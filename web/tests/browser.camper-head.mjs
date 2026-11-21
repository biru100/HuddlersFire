// Exercise the actual buttons and visible lobby Canvas using a disposable browser.
import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {headlessBrowser,until} from './browser-cdp.mjs';
import {CAMPER_PART_FILES} from '../lib/camp-camper-part-files.mjs';
import {camperPartCell} from '../lib/camp-camper-parts.mjs';
import {loadImage,createCanvas} from '@napi-rs/canvas';
import {youtubeFixture} from './youtube-fixture.mjs';
import {readCamperCandidate} from '../scripts/camper-review-assets.mjs';
import {objectDigest} from '../scripts/camper-harness-inputs.mjs';
import {browserFormats,camperZooms,camperReviewRoot,camperCaptureIdentity,writeCamperCapture} from './camper-scale-evidence.mjs';
import {subcultureHeadRecipe} from '../scripts/compile-subculture-camper.mjs';
import {captureCamperMotion} from './browser.camper-motion.mjs';

const origin=process.env.CAMP_TEST_URL || 'http://127.0.0.1:5192';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const job=process.env.CAMP_CAMPER_JOB,phase=process.env.CAMP_CAMPER_PHASE;
if(job&&!['before','after'].includes(phase))throw Error('Pass a camper browser capture phase');
const candidate=job&&phase==='after'?readCamperCandidate(job):null;
const identity=job?camperCaptureIdentity('browser',job,phase):null;
const archivedRecipe=JSON.parse(readFileSync(new URL('../../art/sprites/field-camper-v2/shared-head/recipe.json',import.meta.url)));
const headRecipe=candidate?.recipe??(CAMPER_PART_FILES['field-camper-walk'].bodyOnly?subcultureHeadRecipe:archivedRecipe);
const {native:zones}=headRecipe.protectedFeatures;
const inspectZones=headRecipe===subcultureHeadRecipe?[headRecipe.native[0].features]:zones[0];
const baseline=!job&&process.env.CAMP_CAMPER_SCALE_BASELINE==='1';
const expected=CAMPER_PART_FILES['field-camper-v2'].url;
const atlas=await loadImage(candidate?.buffers[candidate.files['field-camper-v2'].url]??readFileSync(new URL('../public'+expected,import.meta.url)));
function nativePixels(layer,style){
  const frame=createCanvas(64,80).getContext('2d');
  const [col,row]=camperPartCell({group:0,index:0},layer,style,false);
  frame.drawImage(atlas,col*64,row*80,64,80,0,0,64,80);
  return frame.getImageData(0,0,64,80).data;
}
const mask=nativePixels('face',0), hairs=[nativePixels('hair',0),nativePixels('hair',1)];
const facePoints=[];
for(let y=1;y<79;y++)for(let x=1;x<63;x++){
  if(!inspectZones.some(([l,t,r,b])=>x>l&&x<r-1&&y>t&&y<b-1))continue;
  // Pick an interior of the protected regions. The rendered sample can blend
  // with a neighbouring texel at fractional scales.
  const interior=[-65,-64,-63,-1,0,1,63,64,65].every(offset=>{
    const i=(y*64+x+offset)*4+3;
    return mask[i]===255&&hairs.every(hair=>hair[i]===0);
  });
  if(interior)facePoints.push([16+x,5+y]);
}
assert.ok(facePoints.length>=35);
const out=job?`${camperReviewRoot(job)}/browser-${phase}`:`outputs/current-art/camper-scales/browser-${baseline?'before':'after'}`;
if(job&&phase==='before'&&existsSync(out+'/receipt.json'))throw Error('This job already has a browser baseline');
if(job&&phase==='after'&&!existsSync(`${camperReviewRoot(job)}/browser-before/receipt.json`))
  throw Error('Capture the browser baseline first');
const browser=await headlessBrowser();
const formats=browserFormats;
mkdirSync(out,{recursive:true});
const capture=async (file, clip)=>{
  const shot=await browser.call('Page.captureScreenshot',{format:'png',...(clip&&{clip:{...clip,scale:1}})});
  writeFileSync(`${out}/${file}.png`,Buffer.from(shot.data,'base64'));
};
const viewport=([,width,height,deviceScaleFactor,mobile])=>
  browser.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor,mobile});
try{
  const served=new Set();
  if(candidate){
    // Keep the built application intact. Feed the verified candidate bytes
    // only when its normal sprite loader requests the two local atlas URLs.
    const replacements=new Map(['field-camper-v2','field-camper-walk'].map(id=>[
      new URL(CAMPER_PART_FILES[id].url,origin).href,candidate.buffers[candidate.files[id].url],
    ]));
    await browser.call('Network.enable');
    await browser.call('Network.setCacheDisabled',{cacheDisabled:true});
    browser.onEvent(event=>{
      if(event.method!=='Fetch.requestPaused')return;
      const {requestId,request}=event.params,bytes=replacements.get(request.url);
      const reply=bytes?browser.call('Fetch.fulfillRequest',{requestId,responseCode:200,
        responseHeaders:[{name:'Content-Type',value:'image/webp'},{name:'Cache-Control',value:'no-store'}],
        body:bytes.toString('base64')}).then(()=>served.add(request.url)):
        browser.call('Fetch.continueRequest',{requestId});
      reply.catch(error=>browser.errors.push(error.message));
    });
    await browser.call('Fetch.enable',{patterns:[...replacements.keys()].map(urlPattern=>({urlPattern}))});
  }
  await browser.call('Page.addScriptToEvaluateOnNewDocument',{source:'performance.setResourceTimingBufferSize(5000)'});
  await browser.call('Page.addScriptToEvaluateOnNewDocument',{source:youtubeFixture});
  const walkUrl=CAMPER_PART_FILES['field-camper-walk'].url;
  const expectedWalk=candidate?.manifest.files['field-camper-walk']??CAMPER_PART_FILES['field-camper-walk'];
  await browser.call('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
    window.walkCrops=new Set();
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
      if(image instanceof HTMLImageElement && image.src.endsWith(${JSON.stringify(walkUrl)}) && args.length===8){
        window.walkImageSize=[image.naturalWidth,image.naturalHeight].join('x');
        window.walkCrops.add([args[0]/192,args[1]/240].join('/'));
      }
      return draw.call(this,image,...args);
    };
  })()`});
  let build=null;
  for(const [format,...size] of formats){
    await viewport([format,...size]);
    await browser.call('Page.navigate',{url:origin});
    await until(()=>browser.evaluate(`document.querySelector('.character-preview canvas') && performance.getEntriesByType('resource').some(e=>new URL(e.name).pathname===${JSON.stringify(expected)})`),'Modular lobby artwork did not load');
    if(job&&!build){
      const bundles=await browser.evaluate(`[...document.scripts].map(s=>s.src).filter(src=>src&&new URL(src).origin===location.origin).map(src=>new URL(src).pathname).sort()`);
      assert.ok(bundles.length,'Browser evidence requires application scripts');
      build=objectDigest(bundles);
    }
    await browser.evaluate("document.querySelector('.lobby-wardrobe').open=true");
    let common=null;
    for(const top of [0,1])for(const hair of [0,1]){
      const shot=await browser.evaluate(`(async()=>{
        const pick=async(label,i)=>{
          const button=document.querySelectorAll('.lobby-wardrobe [aria-label="'+label+'"] button')[i];
          button.click();
          for(let n=0;n<60;n++){
            await new Promise(r=>requestAnimationFrame(r));
            if(button.getAttribute('aria-pressed')==='true')break;
          }
          if(button.getAttribute('aria-pressed')!=='true')throw Error('Choice did not apply');
          await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        };
        await pick('상의',${top});await pick('헤어',${hair});
        const canvas=document.querySelector('.character-preview canvas'),c=canvas.getContext('2d');
        const rgba=c.getImageData(0,0,canvas.width,canvas.height).data;
        const scale=Math.min(canvas.width/96,canvas.height/80),rect=canvas.getBoundingClientRect();
        const pixels=${JSON.stringify(facePoints)}.flatMap(([x,y])=>{
          const sx=Math.floor(canvas.width/2+(x+.5-48)*scale),sy=Math.floor(canvas.height/2+(y+.5-40)*scale);
          const i=(sy*canvas.width+sx)*4;return Array.from(rgba.subarray(i,i+4));
        });
        return {pixels,png:canvas.toDataURL(),width:canvas.width,height:canvas.height,
          clip:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},dpr:devicePixelRatio};
      })()`);
      if(!baseline){
        assert.equal(shot.width,Math.round(shot.clip.width*shot.dpr));
        assert.equal(shot.height,Math.round(shot.clip.height*shot.dpr));
      }
      writeFileSync(out+'/'+format+'-'+top+'-'+hair+'.png',Buffer.from(shot.png.split(',')[1],'base64'));
      await capture(`${format}-lobby-${top}-${hair}`,shot.clip);
      assert.ok(shot.pixels.every((v,i)=>i%4!==3||v===255),'Visible face required');
      if(common)assert.equal(Buffer.compare(Buffer.from(shot.pixels),Buffer.from(common)),0,'Lobby eye/nose/jaw pixels changed');
      common=shot.pixels;
    }
    for(const top of [0,1])assert.notDeepEqual(readFileSync(out+'/'+format+'-'+top+'-0.png'),readFileSync(out+'/'+format+'-'+top+'-1.png'));
    console.log(format+': four wardrobe selections, '+facePoints.length+' identical protected facial pixels');
  }
  if(!baseline){
    const resized=['resized',1000,720,2,false];
    await viewport(resized);
    await until(()=>browser.evaluate(`(()=>{const c=document.querySelector('.character-preview canvas');const rect=c.getBoundingClientRect();return devicePixelRatio===2&&c.width===Math.round(rect.width*2)&&c.height===Math.round(rect.height*2);})()`),'Lobby backing pixels did not update after DPR changed');
  }
  const linked=await browser.evaluate(`(async()=>{
    const session=await fetch('/api/camp/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'캠퍼 착용 검증'})});
    const link=await fetch('/__test/discord-connect',{method:'POST'});
    return {session:session.status,link:link.status};
  })()`);
  assert.ok(linked.session<300 && linked.link===200,'Loopback session fixture '+JSON.stringify(linked));
  for(const config of formats){
    const [format]=config;
    await viewport(config);
    await browser.call('Page.navigate',{url:origin});
    await until(()=>browser.evaluate("!!document.querySelector('.solo-button:not(:disabled):not([aria-disabled=true])')"),'Local solo entry unavailable');
    await browser.evaluate("document.querySelector('.solo-button').click()");
    const camp="document.querySelector('.in-camp [data-camp-input]')";
    await until(()=>browser.evaluate(`!!${camp} && !document.querySelector('.scene-status')`),'Camp renderer not ready');
    await until(()=>browser.evaluate(`${camp}.dataset.campRenderer==='webgl'`),'Actual WebGL renderer did not become ready',8000);
    const point=await browser.evaluate(`(()=>{const c=${camp},r=c.getBoundingClientRect();c.focus();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    const zoomValues=[camperZooms[1],camperZooms[0],camperZooms[2]].map(([key,zoom])=>
      [key,Math.round(100*zoom),key==='default'?0:key==='min'?1200:-1200]);
    for(const [name,percent,deltaY] of zoomValues){
      if(deltaY)await browser.evaluate(`${camp}.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,
        clientX:${point.x},clientY:${point.y},deltaY:${deltaY}}))`);
      await until(()=>browser.evaluate(`${camp}.getAttribute('aria-label').includes('배율 ${percent}%')`),'Field zoom did not reach '+percent+'%');
      await capture(`${format}-${name}-idle`);
      await browser.evaluate('window.walkCrops.clear()');
      await browser.call('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyD',key:'d',windowsVirtualKeyCode:68});
      try{
        // Cached crops remain reusable after zoom. Check the initial walk per viewport.
        if(name==='default')await until(()=>browser.evaluate(`(()=>{
          const cells=[...window.walkCrops].map(s=>s.split('/').map(Number));
          return (${baseline}||window.walkImageSize===${JSON.stringify(`${expectedWalk.width}x${expectedWalk.height}`)}) &&
            cells.some(([col,row])=>row<4 && col>=8) && (${baseline} ? cells.some(([col,row])=>
            row===4 && col%3===0 && window.walkCrops.has((col+2)+'/4')) : cells.every(([,row])=>row!==4));
        })()`),'Walking did not use the expected body and head sources',8000);
        else await browser.evaluate('new Promise(r=>setTimeout(r,220))');
        await capture(`${format}-${name}-walk`);
      }finally{await browser.call('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyD',key:'d',windowsVirtualKeyCode:68});}
      await browser.evaluate('new Promise(r=>setTimeout(r,160))');
      await capture(`${format}-${name}-stop`);
    }
    if(format==='desktop-125'&&!baseline){
      await browser.evaluate(`document.querySelector('[data-camp-world="webgl"]').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`);
      await until(()=>browser.evaluate(`${camp}.dataset.campRenderer==='canvas'`),'Canvas fallback did not activate');
      await capture(`${format}-max-canvas`);
      await browser.evaluate("document.querySelector('#camp-tab-people,[aria-controls=camp-page-people]')?.click()");
      const portrait = async (selector,name) => {
        const expression=`(()=>{const c=document.querySelector(${JSON.stringify(selector)});if(!c)return null;
          const r=c.getBoundingClientRect(),rgba=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          if(!r.width||!r.height||!rgba.some((alpha,i)=>i%4===3&&alpha===255)||
            c.width!==Math.round(r.width*devicePixelRatio)||c.height!==Math.round(r.height*devicePixelRatio))return null;
          return {x:r.x,y:r.y,width:r.width,height:r.height};})()`;
        await until(()=>browser.evaluate(expression),name+' portrait did not match its display density');
        await capture(name,await browser.evaluate(expression));
      };
      await portrait('.people-list .camper-portrait canvas','roster-portrait');
      await browser.evaluate("document.querySelector('.person-info-button').click()");
      await portrait('.player-info-heading .camper-portrait canvas','profile-portrait');
    }
    console.log(format+': WebGL at 75%, 100%, 300% camera zoom');
  }
  if(candidate)assert.equal(served.size,2,'Both validated candidate atlases must reach the application');
  const motionProof=job?await captureCamperMotion(browser,capture,candidate):undefined;
  assert.deepEqual(browser.errors,[]);
  if(job)writeCamperCapture(out,{job,kind:'browser',phase,identity,build,motionProof});
}catch(error){
  console.error(await browser.evaluate(`({lobby:!!document.querySelector('#nickname'),solo:document.querySelector('.solo-button')?.outerHTML,dpr:devicePixelRatio,
    preview:[...document.querySelectorAll('.character-preview canvas')].map(c=>[c.width,c.height,c.clientWidth,c.clientHeight]),
    renderer:{...document.querySelector('[data-camp-input]')?.dataset},
    actions:document.querySelector('.entry-actions')?.innerText,camperFiles:performance.getEntriesByType('resource').map(e=>new URL(e.name).pathname).filter(p=>p.includes('/field-camper-'))})`));
  throw error;
}finally{await browser.close();}
