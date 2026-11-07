// Disposable headless layout smoke test; the one-pixel fixture is not character artwork.
import assert from 'node:assert/strict';
import {writeFileSync,rmSync} from 'node:fs';
import {resolve,relative,join,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {prepareArtJob,receiveArtSubmission,buildArtJob,renderArtReview} from '../../tools/lib/art-direction.mjs';
import {headlessBrowser,until} from './browser-cdp.mjs';
const runs=resolve('../art/sprites/runs');
const made=prepareArtJob({out:'test-art-review-smoke-'+Date.now(),variation:'rounded'});
const file=join(made.directory,'job.json'),source=join(made.directory,'fixture.png');
writeFileSync(source,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCWQAAAAASUVORK5CYII=','base64'));
receiveArtSubmission(file,source,{reference:'SYNTHETIC LAYOUT TEST ONLY'});
await buildArtJob(file);const result=renderArtReview(file);let browser;
try{
 browser=await headlessBrowser();
 for(const [label,width,height] of [['desktop',1280,1000],['mobile',390,844]]){
  await browser.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await browser.call('Page.navigate',{url:pathToFileURL(result.file).href});
  await until(()=>browser.evaluate('document.readyState==="complete"&&[...document.images].every(i=>i.complete&&i.naturalWidth===1)'),'Local review PNG did not load');
  assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Review overflows '+label);
  assert.equal(await browser.evaluate('document.querySelectorAll("img").length'),5);
  assert.equal(await browser.evaluate('document.body.textContent.includes("실제 게임")&&document.body.textContent.includes("unverified")'),true);
  const capture=await browser.call('Page.captureScreenshot',{format:'png'});
  writeFileSync(resolve('../outputs/art-review-smoke-'+label+'.png'),Buffer.from(capture.data,'base64'));
 }
 assert.equal(browser.errors.length,0,browser.errors.join('\n'));
 console.log('PASS local art-review HTML: desktop/mobile layout, original PNG loading, 5 views, unverified model and scene boundaries. Synthetic fixture only.');
}finally{
 if(browser)await browser.close();
 const rel=relative(runs,resolve(made.directory));
 assert.ok(rel&&!rel.startsWith('..')&&!rel.includes(':')&&resolve(made.directory).startsWith(runs+sep));
 rmSync(made.directory,{recursive:true,force:true});
}
