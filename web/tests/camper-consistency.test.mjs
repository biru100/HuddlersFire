import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {inspectCamperAtlases} from '../scripts/camper-consistency.mjs';
import {candidateDir,digest,readCamperIntermediate} from '../scripts/camper-review-assets.mjs';
import {CAMPER_PART_FILES} from '../lib/camp-camper-part-files.mjs';
import {CAMPER_SOLES} from '../lib/camp-camper-art.mjs';
import {camperDraftInputs,readCamperInputs} from '../scripts/camper-harness-inputs.mjs';
import {camperAtlasIds,compileCamperParts,headRecipe} from '../scripts/build-shared-camper-head.mjs';
import {validateCamperPair} from './camper-scale-evidence.mjs';

test('decoded camper candidate fits the same size, collar and material contract across both atlases',async()=>{
  const {buffers,manifest}=readCamperIntermediate();
  for(const [name,sha256] of Object.entries(manifest.sources)){
    const path=new URL('../'+name+'.png',candidateDir);
    assert.equal(digest(readFileSync(path)),sha256,name);
  }
  const {results,violations}=await inspectCamperAtlases(Object.values(buffers),manifest.soles);
  assert.equal(results.length,320);
  assert.deepEqual(violations,[]);
});

test('wrong head width, foot height, hair color and an open collar each fail on decoded pixels',async()=>{
  const {buffers,manifest}=readCamperIntermediate();
  const [native,walk]=Object.values(buffers);
  const image=await loadImage(walk),c=createCanvas(image.width,image.height).getContext('2d');
  c.drawImage(image,0,0);
  const w=192,h=240;
  c.clearRect(0,0,w,h);
  c.drawImage(image,0,0,w,h,24,0,w-48,h);
  const bodyRow=4*h;
  c.clearRect(0,bodyRow,w,h);
  c.drawImage(image,0,bodyRow,w,h,0,bodyRow-9,w,h);
  const head=c.getImageData(w,0,w,h);
  for(let i=0;i<head.data.length;i+=4){
    if(head.data[i+3])head.data[i+1]=255;
  }
  c.putImageData(head,w,0);
  c.clearRect(3*w,bodyRow,w,50*3);
  const {violations}=await inspectCamperAtlases([native,c.canvas.toBuffer('image/png')],manifest.soles);
  for(const [id,key] of [['walk/0/0','head span'],['walk/0/4','sole'],['walk/1/0','missing hair'],['walk/3/4','open collar']])
    assert.ok(violations.some(v=>v.id===id&&v.key===key),id+' '+key);
});

test('an empty intake identifies each missing part including head, outfit and walking sources',()=>{
  const draft=camperDraftInputs();
  assert.equal(Object.keys(draft.files).length,13);
  assert.throws(()=>readCamperInputs(draft,fileURLToPath(new URL('.',import.meta.url)),{record:true}),error=>
    ['wardrobe.png','walk-detail/jacket-drawing.png','shared-head/masters/face-native.png','shared-head/masters/bun-native.png']
      .every(name=>error.message.includes('missing '+name))&&!error.message.includes('masters/bun-walk.png'));
});

test('the decoded final atlas also rejects a changed sole, garment palette and an open collar',async()=>{
  const [native,walk]=['field-camper-v2','field-camper-walk'].map(id=>
    readFileSync(new URL('../public'+CAMPER_PART_FILES[id].url,import.meta.url)));
  const image=await loadImage(native),c=createCanvas(image.width,image.height).getContext('2d');
  c.drawImage(image,0,0);
  c.clearRect(4*64,68,64,12);
  c.clearRect(5*64+26,32,12,19);
  const outfit=c.getImageData(6*64,0,64,80);
  for(let i=0;i<outfit.data.length;i+=4){
    if(outfit.data[i+3])outfit.data.set([170,40,170],i);
  }
  c.putImageData(outfit,6*64,0);
  const bodyOnly=CAMPER_PART_FILES['field-camper-walk'].bodyOnly===true;
  const {violations}=await inspectCamperAtlases([c.canvas.toBuffer('image/png'),walk],CAMPER_SOLES,{modular:true,bodyOnly});
  for(const [id,key] of [['native/4/0','sole'],['native/5/0','open collar'],['native/6/0','missing jacket']])
    assert.ok(violations.some(row=>row.id===id&&row.key===key),id+' '+key);
});

test('a missing final walking frame is rejected even when the atlas size matches',async()=>{
  const [native,walk]=['field-camper-v2','field-camper-walk'].map(id=>
    readFileSync(new URL('../public'+CAMPER_PART_FILES[id].url,import.meta.url)));
  const image=await loadImage(walk),c=createCanvas(image.width,image.height).getContext('2d');
  c.drawImage(image,0,0);
  c.clearRect(192,2*240,192,240);
  const bodyOnly=CAMPER_PART_FILES['field-camper-walk'].bodyOnly===true;
  await assert.rejects(inspectCamperAtlases([native,c.canvas.toBuffer('image/png')],CAMPER_SOLES,{modular:true,bodyOnly}),
    /Empty camper layer .*"d":2.*"col":1.*"pose":"walk"/);
});

test('the thirteen-input build packs body-only walking and never reads detailed head PNGs',async()=>{
  const base=readCamperIntermediate();
  const reads=[];
  const result=await compileCamperParts(Object.values(base.buffers),path=>{
    reads.push(path);
    return readFileSync(new URL('../'+path,candidateDir));
  },headRecipe,{bodyOnly:true});
  assert.equal(reads.length,3);
  assert.ok(reads.every(path=>path.endsWith('-native.png')));
  const {files}=result.manifest,walk=files['field-camper-walk'];
  assert.deepEqual([walk.width,walk.height,walk.bodyOnly],[3072,960,true]);
  const archived=JSON.parse(readFileSync(new URL('../../art/sprites/field-camper-v2/shared-head/manifest.json',import.meta.url)));
  assert.equal(files['field-camper-v2'].sha256,archived.files['field-camper-v2'].sha256);
  const bytes=camperAtlasIds.map(id=>result.outputs[files[id].url.split('/').at(-1)]);
  const {violations,results}=await inspectCamperAtlases(bytes,CAMPER_SOLES,{modular:true,bodyOnly:true});
  assert.equal(results.length,192);
  assert.deepEqual(violations,[]);
});

test('a screenshot from a different candidate cannot satisfy the current camper review',()=>{
  const cases=[{width:20,height:40}],job='proof';
  const before={job,id:'base',identity:{protocol:'capture-1',candidate:null},cases};
  const after={job,id:'candidate',baseline:'base',identity:{protocol:'capture-1',candidate:'one'},cases};
  assert.equal(validateCamperPair(job,before,after,before.identity,after.identity).count,1);
  assert.throws(()=>validateCamperPair(job,before,after,before.identity,{...after.identity,candidate:'two'}),/Stale camper evidence/);
});
