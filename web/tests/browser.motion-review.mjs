// Disposable headless review QA; opens only local HTML, never a personal browser.
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { headlessBrowser, until } from './browser-cdp.mjs';
const dir=resolve(process.env.CAMP_MOTION_REVIEW_DIR||'../docs/reviews/rounded02-idle-v1-20261108');
const views=(process.env.CAMP_MOTION_VIEWS||'nw,se').split(',');assert.ok(views.every(view=>['nw','se'].includes(view)));
const screenshots=resolve(process.env.CAMP_MOTION_SCREEN_DIR||'../outputs/rounded02-idle-review-screens');mkdirSync(screenshots,{recursive:true});
let browser;
try{
  browser=await headlessBrowser();
  for(const view of views)for(const [label,width,height] of [['desktop',1480,1180],['mobile',390,844]]){
    await browser.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await browser.call('Page.navigate',{url:pathToFileURL(resolve(dir,`${view}-review.html`)).href});
    await until(()=>browser.evaluate('document.readyState==="complete"&&document.images.length===8&&[...document.images].every(i=>i.complete&&i.naturalWidth>0)'),view+' original PNGs did not load');
    assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,view+' '+label+' overflow');
    assert.equal(await browser.evaluate('document.querySelectorAll("#frames article").length'),4);
    if(label==='desktop')assert.equal(await browser.evaluate('new Set([...document.querySelectorAll("#frames article")].map(e=>Math.round(e.getBoundingClientRect().top))).size'),1,'All four frames must fit in a desktop comparison row');
    await browser.evaluate('playing=false;current=3;update()');
    assert.equal(await browser.evaluate('document.querySelector("#loop .cell").dataset.frame'),'3');
    await browser.evaluate('playing=true;last=performance.now()-300');
    await until(()=>browser.evaluate('current===0'),'4-to-1 did not play');
    await browser.evaluate('playing=false;document.querySelector("#align").checked=true;current=1;update()');
    assert.equal(await browser.evaluate('document.querySelector("#loop .cell").style.transform.includes("translate(")'),true);
    await browser.evaluate('document.querySelector("#background").value="#17252a";document.querySelector("#background").dispatchEvent(new Event("change"))');
    assert.equal(await browser.evaluate('document.body.style.getPropertyValue("--back")'),'#17252a');
    if(label==='desktop'){
      await browser.evaluate('window.scrollTo(0,0)');
      const dark=await browser.call('Page.captureScreenshot',{format:'png'});
      writeFileSync(resolve(screenshots,`${view}-dark.png`),Buffer.from(dark.data,'base64'));
    }
    await browser.evaluate('document.querySelector("#background").value="#dce2d0";document.querySelector("#background").dispatchEvent(new Event("change"));current=0;update()');
    await browser.evaluate('window.scrollTo(0,0)');
    const shot=await browser.call('Page.captureScreenshot',{format:'png'});
    writeFileSync(resolve(screenshots,`${view}-${label}.png`),Buffer.from(shot.data,'base64'));
  }
  assert.deepEqual(browser.errors,[]);
  console.log('PASS '+views.join('/')+' desktop+mobile: original image decode, 4 frames, responsive layout, 4→1 loop, alignment toggle, light/dark backgrounds, zero JS exceptions. Display hypotheses only.');
}finally{if(browser)await browser.close();}
