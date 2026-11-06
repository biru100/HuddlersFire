import {resolve} from 'node:path';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {headlessBrowser,until,delay} from './browser-cdp.mjs';
import {youtubeFixture} from './youtube-fixture.mjs';
import {inside,readJSON,writeJSON,hash} from '../../tools/lib/sprite-spec.mjs';
import {materialFingerprint} from '../../tools/lib/material-review.mjs';
const origin=process.env.CAMP_TEST_URL||'http://127.0.0.1:5192';if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const job=resolve(process.env.CAMP_LIGHTING_JOB||'../art/sprites/runs/lighting-prototype'),fingerprint=materialFingerprint(job),out=inside(job,'screens');mkdirSync(out,{recursive:true});
const browser=await headlessBrowser(),{evaluate,call}=browser;
const click=async text=>{await evaluate(`(()=>{const text=${JSON.stringify(text)};if(['작은 창 · PIP','전체 보기','내 캐릭터 따라가기'].includes(text))document.querySelector('.field-view-menu')?.setAttribute('open','');})()`);assert.ok(await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.getClientRects().length&&b.textContent.includes(${JSON.stringify(text)}));if(!b)return false;b.click();return true;})()`),'Missing button '+text);await delay(200);};
async function save(id,send=call,stateExpression=`(()=>{const c=document.querySelector('[data-camp-input]');return {backend:c?.dataset.campRenderer,normalDraws:Number(c?.dataset.campNormalDraws||0)};})()`){
  await delay(300);const state=await evaluate(stateExpression);assert.equal(state.backend,'webgl');assert.ok(state.normalDraws>0);const capture=await send('Page.captureScreenshot',{format:'png'}),bytes=Buffer.from(capture.data,'base64'),file='screens/'+id+'.png';writeFileSync(inside(job,file),bytes);const e=readJSON(inside(job,'evidence.json'));assert.equal(e.fingerprint,fingerprint);e.cases=e.cases.filter(c=>c.id!==id);e.cases.push({id,kind:'ui',...state,file,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:hash(bytes)});writeJSON(inside(job,'evidence.json'),e);console.log('Captured '+id+' · '+e.cases.at(-1).width+'x'+e.cases.at(-1).height);
}
try{
  await call('Page.addScriptToEvaluateOnNewDocument',{source:youtubeFixture});await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  for(const [name,width,height,mobile]of [['desktop',1280,900,false],['mobile',390,844,true]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await call('Page.navigate',{url:origin});await until(()=>evaluate(`!!document.querySelector('#nickname')`),'Lobby unavailable');
    await evaluate(`localStorage.setItem('huddlers-fire-settings',JSON.stringify({theme:'color',effectsVolume:0,musicVolume:20,musicMuted:true,allowCarry:false}));fetch('/api/camp/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'조명 검토'})}).then(()=>fetch('/__test/discord-connect',{method:'POST'}))`);
    await call('Page.navigate',{url:origin});await until(()=>evaluate(`!!document.querySelector('.solo-button')&&!document.querySelector('.solo-button').disabled`),'Linked entry unavailable');await evaluate(`document.querySelector('.solo-button').click()`);
    await until(()=>evaluate(`document.querySelector('.in-camp [data-camp-input]')?.dataset.campRenderer==='webgl'&&Number(document.querySelector('[data-camp-input]').dataset.campNormalDraws)>0&&!document.querySelector('.scene-status')`),'Actual UI did not use material renderer');
    await save('ui-'+name+'-default');await click('필드 보기');await save('ui-'+name+'-field');await evaluate(`document.querySelector('.camp-panel-dock button').click()`);await save('ui-'+name+'-panel');
    await evaluate(`document.querySelector('#camp-tab-radio').click()`);await delay(200);
    await evaluate(`(()=>{const e=[...document.querySelectorAll('input[aria-label="신청할 YouTube 영상 링크"]')].find(e=>e.getClientRects().length);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'https://youtu.be/jfKfPfyJRdk');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await until(()=>evaluate(`(()=>{const e=[...document.querySelectorAll('.music-panel form button')].find(e=>e.getClientRects().length);return e&&!e.disabled;})()`),'Video submit unavailable');await evaluate(`[...document.querySelectorAll('.music-panel form button')].find(e=>e.getClientRects().length).click()`);
    await until(()=>evaluate(`window.__ytPlayers.some(p=>p.videoId==='jfKfPfyJRdk'&&p.state===1)`),'Video fixture did not start');
    await evaluate(`document.querySelector('.panel-close')?.click()`);await save('ui-'+name+'-video');
    if(!mobile){
      const before=new Set((await browser.send('Target.getTargets')).targetInfos.map(t=>t.targetId));await click('작은 창 · PIP');await until(()=>evaluate(`window.documentPictureInPicture?.window?.document.querySelector('[data-camp-input]')?.dataset.campRenderer==='webgl'`),'PIP material renderer unavailable');
      const targets=(await browser.send('Target.getTargets')).targetInfos,target=targets.find(t=>!before.has(t.targetId)&&!['worker','service_worker'].includes(t.type));assert.ok(target,'PIP target missing');const {sessionId}=await browser.send('Target.attachToTarget',{targetId:target.targetId,flatten:true});const pipCall=(method,params={})=>browser.send(method,params,sessionId);await pipCall('Emulation.setDeviceMetricsOverride',{width:560,height:480,deviceScaleFactor:1,mobile:false});await delay(500);
      await save('ui-pip',pipCall,`(()=>{const c=window.documentPictureInPicture.window.document.querySelector('[data-camp-input]');return {backend:c.dataset.campRenderer,normalDraws:Number(c.dataset.campNormalDraws)};})()`);
      await evaluate(`window.documentPictureInPicture.window.close()`);await until(()=>evaluate(`document.querySelector('[data-camp-input]')?.dataset.campRenderer==='webgl'`),'Field did not return from PIP');
    }
  }
  assert.deepEqual(browser.errors,[]);console.log('PASS: actual desktop/mobile panels, video fixture and Document PIP material rendering');
}finally{await browser.close();}
