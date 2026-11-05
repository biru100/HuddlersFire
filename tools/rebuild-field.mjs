// Replay the tracked, reviewed release; never generate or restore legacy field art.
import {mkdirSync,cpSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,inside,readJSON,verifyReview} from './lib/sprite-spec.mjs';
import {slicePreview,buildPreview} from './lib/sprite-preview.mjs';
import {installField} from './lib/field-assets.mjs';
import {buildMaterialMaps,installMaterialMaps} from './lib/material-assets.mjs';
import {verifyMaterialReview} from './lib/material-review.mjs';
const materialPointer=resolve(ROOT,'art/sprites/material-release.json');
if(existsSync(materialPointer)){
  const released=inside(ROOT,readJSON(materialPointer).directory);verifyMaterialReview(released,inside(released,'review.json'));
  const runs=resolve(ROOT,'art/sprites/runs');mkdirSync(runs,{recursive:true});const dir=inside(runs,'material-replay-'+Date.now());mkdirSync(dir);
  for(const name of ['base-manifest.json','review.json','prototype-review.json','evidence.json','screens'])cpSync(inside(released,name),inside(dir,name),{recursive:true});
  await buildMaterialMaps({baseManifest:inside(dir,'base-manifest.json'),out:dir});console.log(JSON.stringify({replayed:true,materials:true,...await installMaterialMaps({dir,baseManifest:inside(dir,'base-manifest.json'),reviewFile:inside(dir,'review.json')})}));
  process.exit(0);
}
const approved=resolve(ROOT,'art/sprites/field-v2/release');
if(!existsSync(resolve(approved,'job.json')))throw Error('No reviewed field release package. Follow docs/sprite-authoring.md before installation.');
const runs=resolve(ROOT,'art/sprites/runs');mkdirSync(runs,{recursive:true});const dir=inside(runs,'field-v2-replay-'+Date.now());mkdirSync(dir);
for(const name of ['job.json','annotations.json','review.json','evidence.json','prompts','source','screens'])cpSync(inside(approved,name),inside(dir,name),{recursive:true});
const file=resolve(dir,'job.json');slicePreview(file);await buildPreview(file);verifyReview(file,resolve(dir,'review.json'));
console.log(JSON.stringify({replayed:true,...installField(file,resolve(dir,'review.json'))}));
