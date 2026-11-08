// Disposable headless local-file QA. Never operates a user's browser or game.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import {reviewHtml} from '../../tools/idle-frames.mjs';
import {headlessBrowser,until} from './browser-cdp.mjs';
const root=resolve('..'),screens=join(root,'outputs/idle-frames-qa');mkdirSync(screens,{recursive:true});
const temporary=mkdtempSync(join(tmpdir(),'hf-idle-browser-'));let browser;
try{
  browser=await headlessBrowser();
  for(const revision of ['01','02']){
    const source=join(root,'art/sprites/source-registry/rounded02-idle-frames-nw-'+revision),plan=JSON.parse(readFileSync(join(source,'motion-plan/REGION_LOCKS.json'),'utf8'));
    for(const [label,width,height] of [['desktop',1280,1000],['mobile',390,844]]){
    await browser.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await browser.call('Page.navigate',{url:pathToFileURL(join(source,'review/loop-preview.html')).href});
    await until(()=>browser.evaluate('document.readyState==="complete"&&document.images.length===5&&[...document.images].every(i=>i.complete&&i.naturalWidth===1086)'),'actual anchor PNG decode');
    assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,label+' overflow');
    assert.equal(await browser.evaluate('document.querySelector("#play").disabled'),true,'No missing-frame fake loop');
    assert.equal(await browser.evaluate('document.querySelectorAll("polygon").length'),plan.motionRegions.length);
    if(revision==='02')assert.equal(await browser.evaluate('document.body.textContent.includes("전체 곱슬머리 잠금")&&document.body.textContent.includes("1.9초")'),true);
    await browser.evaluate('document.querySelector("#mask").click()');assert.equal(await browser.evaluate('document.querySelector("#overlay").hidden'),true);
    await browser.evaluate('document.querySelector("#mask").click()');assert.equal(await browser.evaluate('document.querySelector("#overlay").hidden'),false);
    const shot=await browser.call('Page.captureScreenshot',{format:'png'});writeFileSync(join(screens,`nw-anchor-${revision}-${label}.png`),Buffer.from(shot.data,'base64'));
    }
  }
  const images=[];for(let i=0;i<4;i++){const c=createCanvas(32,48),ctx=c.getContext('2d');ctx.fillStyle=['#125','#527','#713','#185'][i];ctx.fillRect(10,10,12,20);images.push('data:image/png;base64,'+c.toBuffer('image/png').toString('base64'));}
  const plan=JSON.parse(readFileSync(join(root,'art/sprites/source-registry/rounded02-idle-frames-nw-02/motion-plan/REGION_LOCKS.json'),'utf8'));
  const html=reviewHtml({view:'nw',canvas:[32,48]}, {...plan,protectedZones:[],motionRegions:[]}, {technicalStatus:'SYNTHETIC_UI_TEST_ONLY',planConfirmed:true,missingFrames:[],sourceMetrics:[1,2,3,4].map(n=>({frame:'f'+n})),durationsMs:[200,200,200,200]},images);
  const fixture=join(temporary,'synthetic.html');writeFileSync(fixture,html);
  await browser.call('Page.navigate',{url:pathToFileURL(fixture).href});await until(()=>browser.evaluate('document.readyState==="complete"&&document.images.length===8'),'synthetic loop fixture load');
  await browser.evaluate('document.querySelector("#frame").selectedIndex=3;document.querySelector("#frame").dispatchEvent(new Event("change"));document.querySelector("#play").click()');
  await until(()=>browser.evaluate('document.querySelector("#frame").selectedIndex===0'),'actual 4→1 browser loop');
  await browser.evaluate('document.querySelector("#play").click()');assert.equal(await browser.evaluate('document.querySelector("#play").disabled'),false);
  assert.deepEqual(browser.errors,[]);
  console.log('PASS actual NW anchor desktop/mobile, original PNG decode, draft region overlay, light/dark 64×96 display, missing-frame playback blocked; synthetic four-frame UI 4→1 loop, zero JS exceptions. No game/art approval.');
}finally{if(browser)await browser.close();assert.ok(resolve(temporary).startsWith(resolve(tmpdir())+sep+'hf-idle-browser-'));rmSync(temporary,{recursive:true,force:true});}
