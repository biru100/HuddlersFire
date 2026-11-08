// Prepare the reviewed NW core-only experiment. No image generation, game run or deployment.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ART_ROOT,verifyArtReview} from './lib/art-direction.mjs';
import {restoreRounded02Review} from './restore-rounded02-idle-review.mjs';
import {prepareIdleFrames,loadIdleFrames,confirmIdlePlan,inspectIdleFrames} from './idle-frames.mjs';
const SET='rounded02-idle-frames-nw-03';
const REVIEW='docs/reviews/2026-11-08-idle-core03-plan-review.md';
export async function prepareCore03({root=ART_ROOT}={}){
  const parent='art/sprites/runs/lookdev-nw-rounded02-rev2-approved-20261108';
  if(!existsSync(join(root,parent,'job.json')))await restoreRounded02Review({root});
  verifyArtReview(parent+'/job.json',parent+'/art-review.json',{root});
  const file=join(root,'art/sprites/source-registry',SET,'job.json');
  const review=readFileSync(join(root,REVIEW),'utf8');
  assert.ok(review.includes('REVIEW_SCOPE: core03-plan-only')&&review.includes('PLAN_CONFIRMATION: experiment-accepted'),'Actual scoped ChatGPT plan review is required');
  if(!existsSync(file))prepareIdleFrames({root,out:SET,view:'nw',parentJob:parent+'/job.json',parentReview:parent+'/art-review.json',
    anchor:'art/sprites/source-registry/rounded02-rev2-lookdev/original/nw-approved.png',
    plan:'docs/briefs/rounded-02/idle-nw-regions-03.json',intent:'docs/briefs/rounded-02/idle-frame-intent-03.json',
    anchorReview:'art/sprites/source-registry/rounded02-idle-frames-nw-02/motion-plan/NEUTRAL_ANCHOR_REVIEW.json'});
  const loaded=loadIdleFrames(file,{root});
  assert.equal(loaded.plan.composition.guardSource,'anchor');
  if(!loaded.confirmed)confirmIdlePlan(file,{root,reference:REVIEW+'; ChatGPT current task, 2026-11-08; production/motion approval NOT granted'});
  const inspection=inspectIdleFrames(file,{root});
  writeFileSync(join(loaded.dir,'README.md'),`# Rounded 02 NW Idle: core-only plan 03\n\nThe approved f1 remains unchanged. ChatGPT accepted the narrowed central cloth envelope and anchor-sourced guard for a pilot only. User motion approval is still pending.\n\n- Raw sources: generated/. Derived exact-selection candidates: composites/.\n- CORE uses generated RGBA; guard, head, sleeves, hands, lower body and shoes use f1.\n- Raw excluded differences, seam and region-budget failures remain reported.\n- No automatic resize, alignment, blending, alpha conversion, redraw, native conversion or deployment.\n- Registered originals: ${loaded.manifest.originals.map(e=>e.slot).join(', ')}. Missing frames are not filled with fixtures.\n- [Scoped review](../../../../${REVIEW}). Timing: 4 x 475ms as a hypothesis.\n`);
  mkdirSync(join(root,'outputs'),{recursive:true});
  writeFileSync(join(root,'outputs/idle-core03-preparation.json'),JSON.stringify({setId:SET,job:file,...inspection,gameExecuted:false,deployed:false},null,2)+'\n');
  return {setId:SET,job:file,...inspection,gameExecuted:false,deployed:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(await prepareCore03(),null,2));
