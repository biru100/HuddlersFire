import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,mkdtempSync,existsSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {ROOT,readJSON,writeJSON,validateSpec,hash,loadJob,inside,verifyReview,runtimeHash} from '../../tools/lib/sprite-spec.mjs';
import {prepareJob as prepareSceneJob} from '../../tools/prepare-sprite-job.mjs';
import {slicePreview,buildPreview} from '../../tools/lib/sprite-preview.mjs';
import {spriteManifest} from '../lib/camp-sprite-assets.mjs';
const runs=resolve(ROOT,'art/sprites/runs');mkdirSync(runs,{recursive:true});
const temporary=()=>mkdtempSync(resolve(runs,'test-authoring-'));
const specFile=resolve(ROOT,'art/sprites/examples/composition-pilot-v1.json');
const spec=()=>readJSON(specFile);
const prepareJob=options=>prepareSceneJob({specFile,...options});
function source(dir,id){const c=createCanvas(256,256),ctx=c.getContext('2d');ctx.fillStyle='#b17b48';ctx.fillRect(30,80,196,130);writeFileSync(resolve(dir,'source',id+'.png'),c.toBuffer('image/png'));}
test('a partial job compiles only requested assets and refuses output outside runs',()=>{
  const dir=prepareJob({selected:['bench-ne'],out:resolve(temporary(),'job')});const job=loadJob(resolve(dir,'job.json'));assert.deepEqual(job.selected,['bench-ne']);assert.ok(existsSync(resolve(dir,'prompts/bench-ne.txt')));assert.equal(existsSync(resolve(dir,'prompts/camper-sit.txt')),false);assert.equal(job.referenceHash,hash(readFileSync(resolve(ROOT,job.spec.style.reference))));
  assert.throws(()=>prepareJob({selected:['missing'],out:resolve(temporary(),'job')}),/Invalid selection/);assert.throws(()=>prepareJob({out:'../source'}),/outside/);
});
test('required contacts, directions and matching bindings are validated before generation',()=>{
  for(const mutate of [s=>delete s.assets['camper-sit'].contacts.seat,s=>s.assets['bench-ne'].contacts.ground=[2,0],s=>s.bindings['log-0'].direction='nw']){const s=spec();mutate(s);assert.throws(()=>validateSpec(s));}
  const dir=prepareJob({selected:['bench-ne'],out:resolve(temporary(),'job')}),file=resolve(dir,'job.json'),job=readJSON(file);job.spec.style.light='changed';writeJSON(file,job);assert.throws(()=>loadJob(file),/changed job/);
});
test('real pinned sprite-gen partial processing leaves production assets untouched and rejects missing inputs',async()=>{
  const paths=['web/lib/camp-sprite-manifest.mjs','web/public/sprites/manifest.json','art/sprites/source/environment.png'].map(p=>resolve(ROOT,p)),before=paths.map(p=>hash(readFileSync(p)));
  const dir=prepareJob({selected:['bench-ne'],out:resolve(temporary(),'job')}),file=resolve(dir,'job.json');assert.throws(()=>slicePreview(file),/Selected source missing/);source(dir,'bench-ne');slicePreview(file);const result=await buildPreview(file),data=readJSON(resolve(dir,'build/manifest.json'));
  assert.ok(result.fingerprint);assert.ok(data.sprites.bench.directions.ne);assert.equal(data.bindings['log-2'],spriteManifest.bindings['log-2']);assert.equal(data.characterBindings['log-2'],spriteManifest.characterBindings['log-2']);assert.equal(existsSync(resolve(dir,'source/camper-idle.png')),false);assert.deepEqual(paths.map(p=>hash(readFileSync(p))),before);
  writeJSON(resolve(dir,'annotations.json'),{'bench-ne':{contacts:{ground:[1.5,1]}}});await assert.rejects(buildPreview(file),/Invalid contact|outside silhouette/);
});
test('review rejects missing, failed, old-size and stale artifacts; complete evidence unlocks only matching-spec full preparation',async()=>{
  const dir=prepareJob({selected:['bench-ne'],out:resolve(temporary(),'job')}),file=resolve(dir,'job.json');source(dir,'bench-ne');slicePreview(file);const built=await buildPreview(file),job=loadJob(file),cases=[];mkdirSync(resolve(dir,'screens'));
  for(const c of job.spec.cases){const bytes=createCanvas(c.width,c.height).toBuffer('image/png'),name='screens/'+c.id+'.png';writeFileSync(resolve(dir,name),bytes);cases.push({...c,file:name,sha256:hash(bytes)});}
  const meta=readJSON(resolve(dir,'build/preview.json'));
  writeJSON(resolve(dir,'evidence.json'),{fingerprint:built.fingerprint,manifestHash:meta.manifestHash,runtimeHash:runtimeHash(),cases});const review={reviewer:'automated gate fixture (not visual review)',fingerprint:built.fingerprint,manifestHash:meta.manifestHash,observations:['Synthetic evidence for gate behavior only'],unresolved:[],cases:cases.map(c=>({id:c.id,result:'pass',observation:'Synthetic fixture'}))},r=resolve(dir,'review.json');writeJSON(r,review);
  assert.equal(verifyReview(file,r).fingerprint,built.fingerprint);
  assert.ok(prepareJob({selected:['bench-ne'],out:resolve(temporary(),'full'),scope:'full',reviewJob:file,reviewFile:r}));
  review.cases[0].result='fail';writeJSON(r,review);assert.throws(()=>verifyReview(file,r),/failed or stale case/);review.cases[0].result='pass';writeJSON(r,review);
  const screenshot=resolve(dir,cases[0].file),original=readFileSync(screenshot);writeFileSync(screenshot,createCanvas(2,2).toBuffer('image/png'));const evidence=readJSON(resolve(dir,'evidence.json'));evidence.cases[0].sha256=hash(readFileSync(screenshot));writeJSON(resolve(dir,'evidence.json'),evidence);assert.throws(()=>verifyReview(file,r),/dimensions differ/);writeFileSync(screenshot,original);evidence.cases[0].sha256=hash(original);writeJSON(resolve(dir,'evidence.json'),evidence);
  writeFileSync(resolve(dir,'source/bench-ne.png'),Buffer.from('changed'));assert.throws(()=>verifyReview(file,r),/Stale/);
});
test('new full generation requires review while legacy repacking remains a separate entry point',()=>{
  assert.throws(()=>prepareJob({scope:'full',out:resolve(temporary(),'full')}),/reviewed pilot/);
  assert.throws(()=>inside(runs,'../../web/public'),/outside/);
});
test('a complete colour revision requires explicit unchanged sources and rejects a modified reused PNG',async()=>{
 const file=resolve(ROOT,'art/sprites/scene-spec.json');
 assert.throws(()=>prepareSceneJob({specFile:file,scope:'revision',out:resolve(temporary(),'no-proof')}),/explicit source reuse/);
 const dir=prepareSceneJob({specFile:file,scope:'revision',reuseFrom:'art/sprites/field-v2/release',out:resolve(temporary(),'revision')}),job=loadJob(resolve(dir,'job.json'));
 assert.equal(job.selected.length,Object.keys(job.spec.assets).length);const [id,entry]=Object.entries(job.reusedSources)[0];
 copyFileSync(resolve(ROOT,entry.path),resolve(dir,'source/'+id+'.png'));writeFileSync(resolve(dir,'source/'+id+'.png'),Buffer.from('changed reused source'));
 await assert.rejects(buildPreview(resolve(dir,'job.json')),/Reused source changed/);
});
test('field v2 refuses incomplete releases, opaque character panels and anchors from an older source',async()=>{
  const v2=resolve(ROOT,'art/sprites/scene-spec.json');
  assert.throws(()=>prepareSceneJob({specFile:v2,selected:['camper-idle'],scope:'full',out:resolve(temporary(),'full')}),/every declared asset/);
  const dir=prepareSceneJob({specFile:v2,selected:['camper-idle'],out:resolve(temporary(),'field')}),file=resolve(dir,'job.json'),canvas=createCanvas(512,128),c=canvas.getContext('2d');c.fillStyle='#fff0cf';c.fillRect(0,0,512,128);writeFileSync(resolve(dir,'source/camper-idle.png'),canvas.toBuffer('image/png'));slicePreview(file);
  await assert.rejects(buildPreview(file),/Opaque character panel/);
  writeJSON(resolve(dir,'annotations.json'),{'camper-idle':{sourceHash:'old',frameAnchors:Array.from({length:4},()=>({head:{center:[.5,.2],radius:.2}}))}});
  await assert.rejects(buildPreview(file),/different source/);
  writeJSON(resolve(dir,'annotations.json'),{'camper-idle':{contacts:{feet:[1.5,1]}}});
  await assert.rejects(buildPreview(file),/Invalid contact/);
});
test('tiled terrain with a different output size fills the complete runtime cell without transparent seams',async()=>{
  const dir=prepareJob({selected:['grass'],out:resolve(temporary(),'job')}),file=resolve(dir,'job.json'),c=createCanvas(256,256),ctx=c.getContext('2d');ctx.fillStyle='#87aa50';ctx.fillRect(0,0,256,256);writeFileSync(resolve(dir,'source/grass.png'),c.toBuffer('image/png'));slicePreview(file);await buildPreview(file);const image=await loadImage(resolve(dir,'build/grass.png')),out=createCanvas(image.width,image.height),paint=out.getContext('2d');paint.drawImage(image,0,0);const data=paint.getImageData(0,0,image.width,image.height).data;for(let i=3;i<data.length;i+=4)assert.equal(data[i],255);
});
