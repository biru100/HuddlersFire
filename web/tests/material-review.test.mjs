// Synthetic proof fixtures test rejection contracts; these are not visual review evidence.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {createCanvas} from '@napi-rs/canvas';
import {spriteManifest} from '../lib/camp-sprite-assets.mjs';
import {ROOT,inside,readJSON,writeJSON,hash} from '../../tools/lib/sprite-spec.mjs';
import {buildMaterialMaps,installMaterialMaps} from '../../tools/lib/material-assets.mjs';
import {materialCases,materialFingerprint,verifyMaterialReview} from '../../tools/lib/material-review.mjs';
const parent=inside(ROOT,'web/outputs');mkdirSync(parent,{recursive:true});const dir=mkdtempSync(resolve(parent,'material-contract-')),base=structuredClone(spriteManifest);delete base.materials;for(const id of Object.keys(base.files))if(id.startsWith('normal-'))delete base.files[id];writeJSON(inside(dir,'base-manifest.json'),base);await buildMaterialMaps({baseManifest:inside(dir,'base-manifest.json'),out:dir});
const fingerprint=materialFingerprint(dir),png=createCanvas(1050,824).toBuffer('image/png');writeFileSync(inside(dir,'fixture.png'),png);
const evidence={fingerprint,cases:materialCases('prototype').map(c=>({...c,file:'fixture.png',sha256:hash(png),backend:'webgl',normalDraws:c.normals===false?0:1}))},review={scope:'prototype',reviewer:'unit fixture only',fingerprint,unresolved:[],cases:materialCases('prototype').map(c=>({id:c.id,result:'pass',observation:'Synthetic contract fixture, not an observed scene.'}))};
const save=()=>{writeJSON(inside(dir,'evidence.json'),evidence);writeJSON(inside(dir,'review.json'),review);};save();
after(()=>{const checked=inside(parent,dir);if(!checked.startsWith(parent)||!checked.includes('material-contract-'))throw Error('Unsafe fixture cleanup');rmSync(checked,{recursive:true,force:true});});
test('material gate distinguishes a prototype from full installation and requires the matching backend',async()=>{
  assert.equal(verifyMaterialReview(dir,inside(dir,'review.json'),{scope:'prototype'}).verified,true);
  await assert.rejects(()=>installMaterialMaps({dir,baseManifest:inside(dir,'base-manifest.json'),reviewFile:inside(dir,'review.json')}),/wrong-scope/);
  evidence.cases[0].backend='canvas';save();assert.throws(()=>verifyMaterialReview(dir,inside(dir,'review.json'),{scope:'prototype'}),/WebGL/);evidence.cases[0].backend='webgl';save();
});
test('material gate rejects stale recipes, channels, screenshots, dimensions and unresolved observations',()=>{
  review.unresolved=['contact mismatch'];save();assert.throws(()=>verifyMaterialReview(dir,inside(dir,'review.json'),{scope:'prototype'}),/unresolved/);review.unresolved=[];
  evidence.cases[0].width=10;save();assert.throws(()=>verifyMaterialReview(dir,inside(dir,'review.json'),{scope:'prototype'}),/sized/);evidence.cases[0].width=1050;
  evidence.fingerprint='old';save();assert.throws(()=>verifyMaterialReview(dir,inside(dir,'review.json'),{scope:'prototype'}),/Stale/);evidence.fingerprint=fingerprint;save();
  writeFileSync(inside(dir,'fixture.png'),Buffer.concat([png,Buffer.from([0])]));assert.throws(()=>verifyMaterialReview(dir,inside(dir,'review.json'),{scope:'prototype'}),/screenshot/);writeFileSync(inside(dir,'fixture.png'),png);
  const b=readJSON(inside(dir,'materials-build.json')),normal=inside(dir,Object.values(b.files)[0].url.split('/').at(-1)),bytes=readFileSync(normal);writeFileSync(normal,Buffer.concat([bytes,Buffer.from([0])]));assert.throws(()=>materialFingerprint(dir),/channel/);writeFileSync(normal,bytes);
  const original=b.specHash;b.specHash='old';writeJSON(inside(dir,'materials-build.json'),b);assert.throws(()=>materialFingerprint(dir),/Stale/);b.specHash=original;writeJSON(inside(dir,'materials-build.json'),b);assert.equal(materialFingerprint(dir),fingerprint);
});
