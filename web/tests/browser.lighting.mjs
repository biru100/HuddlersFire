import {mkdirSync,writeFileSync,readFileSync,existsSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {headlessBrowser,until,delay} from './browser-cdp.mjs';
import {hash,readJSON,writeJSON,inside} from '../../tools/lib/sprite-spec.mjs';
import {materialFingerprint,verifyMaterialReview} from '../../tools/lib/material-review.mjs';
const origin=process.env.CAMP_TEST_URL||'http://127.0.0.1:5193';if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const job=resolve(process.env.CAMP_LIGHTING_JOB||'../art/sprites/runs/lighting-prototype'),out=inside(job,'screens'),scope=process.env.CAMP_LIGHTING_SCOPE||'prototype';mkdirSync(out,{recursive:true});
if(scope==='full')verifyMaterialReview(job,inside(job,'prototype-review.json'),{scope:'prototype'});
const fingerprint=materialFingerprint(job),file=inside(job,'evidence.json'),previous=existsSync(file)?readJSON(file):null,evidence=previous?.fingerprint===fingerprint?previous:{version:1,fingerprint,cases:[]};
const browser=await headlessBrowser();
try{
  await browser.call('Emulation.setDeviceMetricsOverride',{width:1050,height:824,deviceScaleFactor:1,mobile:false});
  await browser.call('Page.navigate',{url:origin+'/__material-preview'});await until(()=>browser.evaluate('!!window.lightingReady'),'Lighting preview not ready');
  const identity=await fetch(origin+'/__material-preview/identity').then(r=>r.json());assert.equal(identity.manifestHash,readJSON(inside(job,'materials-build.json')).manifestHash,'Restart the preview server after rebuilding materials');
  const status=await browser.evaluate(`({mode:document.querySelector('[data-camp-input]').dataset.campRenderer,reason:document.querySelector('[data-camp-input]').dataset.campRenderReason,status:lightingReview.renderer.webgl?.status})`);assert.equal(status.mode,'webgl',status.reason);
  const shot=async(id,kind='webgl')=>{await delay(100);const state=await browser.evaluate(`({backend:lightingReview.renderer.webgl?.status==='ready'?'webgl':'canvas',normalDraws:lightingReview.renderer.webgl?.metrics.normalDraws||0,theme:lightingReview.scene.theme,map:lightingReview.scene.mapId,view:lightingReview.scene.zoom})`);if(kind==='webgl')assert.equal(state.backend,'webgl');if(kind==='canvas')assert.equal(state.backend,'canvas');const r=await browser.call('Page.captureScreenshot',{format:'png'}),bytes=Buffer.from(r.data,'base64'),name=id+'.png';writeFileSync(inside(out,name),bytes);evidence.cases=evidence.cases.filter(c=>c.id!==id);evidence.cases.push({id,kind,file:'screens/'+name,sha256:hash(bytes),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),...state});writeJSON(file,evidence);console.log('Captured '+id+' · '+state.backend+' · normals '+state.normalDraws);};
  await shot('camp-color');await browser.evaluate(`lightingReview.set({zoom:1.9})`);await shot('camp-close');
  for(const mode of ['left','right']){await browser.evaluate(`lightingReview.relight('${mode}')`);await shot('normal-'+mode);}
  await browser.evaluate(`lightingReview.renderer.webgl.options.normals=false;lightingReview.renderer.draw(5000)`);await shot('normals-off');await browser.evaluate(`lightingReview.renderer.webgl.options.normals=true;lightingReview.relight(null)`);
  if(scope==='full'){
    for(const map of ['camp','playground','showroom'])for(const theme of ['color','dark']){await browser.evaluate(`lightingReview.set({mapId:'${map}',theme:'${theme}',zoom:1.1,case:'seats'})`);await shot(map+'-'+theme);}
    for(const kind of ['actions','stack']){await browser.evaluate(`lightingReview.set({mapId:'camp',theme:'color',zoom:1.1,case:'${kind}'})`);await shot(kind);}
    for(let page=0;page<4;page++){await browser.evaluate(`lightingReview.frames(${page})`);await shot('frames-'+page);}
    await browser.evaluate(`lightingReview.set({mapId:'camp',case:'seats',zoom:1.1})`);
    await browser.evaluate(`window.lossExtension=lightingReview.renderer.webgl.renderer.gl.getExtension('WEBGL_lose_context');lossExtension.loseContext()`);await until(()=>browser.evaluate(`lightingReview.renderer.webgl.status==='lost'`),'Context did not enter fallback');await browser.evaluate('lightingReview.renderer.draw(5000)');await shot('context-lost','canvas');
    await browser.evaluate(`lossExtension.restoreContext()`);await until(()=>browser.evaluate(`lightingReview.renderer.webgl.status==='ready'`),'Context did not restore');await browser.evaluate('lightingReview.renderer.draw(5000)');await shot('context-restored');
    await browser.evaluate(`lightingReview.renderer.webgl.fail(new Error('forced compatibility test'));lightingReview.renderer.draw(5000)`);await shot('fallback','canvas');
    for(const id of ['normal-character','normal-environment']){const f=readJSON(inside(job,'materials-build.json')).files[id],bytes=readFileSync(inside(job,f.url.split('/').at(-1))),name='normal-atlas-'+id.replace('normal-','');copyFileSync(inside(job,f.url.split('/').at(-1)),inside(out,name+'.png'));evidence.cases=evidence.cases.filter(c=>c.id!==name);evidence.cases.push({id:name,kind:'data',file:'screens/'+name+'.png',sha256:hash(bytes),width:f.width,height:f.height});}writeJSON(file,evidence);
  }
  assert.deepEqual(browser.errors,[]);console.log('Material '+scope+' captures complete');
}finally{await browser.close();}
