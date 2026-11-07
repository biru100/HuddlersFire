// Replays persisted real evidence; does not synthesize or grant art approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { restoreRounded02Review } from '../../tools/restore-rounded02-idle-review.mjs';
import { verifyArtReview } from '../../tools/lib/art-direction.mjs';
import { loadMotionJob } from '../../tools/motion-lookdev.mjs';
import {loadIdleFrames,inspectIdleFrames} from '../../tools/idle-frames.mjs';
const repository=fileURLToPath(new URL('../../',import.meta.url));
test('persisted exact-byte design evidence restores through current gates and motion stays pending',async t=>{
  const root=mkdtempSync(join(tmpdir(),'hf-real-lineage-'));
  t.after(()=>{assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep+'hf-real-lineage-'));rmSync(root,{recursive:true,force:true});});
  for(const file of ['art/sprites/art-direction.json','art/sprites/scene-spec.json','art/sprites/source-registry','docs/reviews/rounded02-idle-v1-20261108','docs/reviews/2026-11-07-rounded02-rev2-art-approval.md']){
    const target=join(root,file);mkdirSync(dirname(target),{recursive:true});cpSync(join(repository,file),target,{recursive:true});
  }
  const result=await restoreRounded02Review({root});assert.equal(result.restored,2);assert.equal(result.motionDecision,'pending');
  const lineage=JSON.parse(readFileSync(join(root,'docs/reviews/rounded02-idle-v1-20261108/lineage.json'),'utf8'));
  for(const item of lineage.views){
    const proof=verifyArtReview(item.parent.job,item.parent.review,{root});assert.equal(proof.sourceSha256,item.parent.sourceSha256);assert.equal(proof.artApproved,true);assert.equal(proof.productionReady,false);
    const motion=loadMotionJob(item.motion.job,{root});assert.equal(motion.parent.sourceSha256,proof.sourceSha256);
    const pending=JSON.parse(readFileSync(join(dirname(join(root,item.motion.job)),'motion-review.template.json'),'utf8'));
    assert.equal(pending.status,'pending');assert.equal(pending.artDirectorReview.reference,'');assert.equal(pending.animationApproved,false);assert.equal(pending.runtimeVerified,false);
  }
  const idleFile=join(root,'art/sprites/source-registry/rounded02-idle-frames-nw-01/job.json');
  const idle=loadIdleFrames(idleFile,{root});assert.equal(idle.confirmed,false);assert.equal(idle.job.parent.sourceSha256,lineage.views.find(v=>v.view==='nw').parent.sourceSha256);
  const check=inspectIdleFrames(idleFile,{root});assert.deepEqual(check.missingFrames,['f2','f3','f4']);assert.equal(check.assemblyReady,false);assert.equal(check.artApproved,false);
  const revisedFile=join(root,'art/sprites/source-registry/rounded02-idle-frames-nw-02/job.json'),revised=loadIdleFrames(revisedFile,{root});
  assert.equal(revised.job.version,2);assert.equal(revised.confirmed,false);assert.equal(revised.plan.protectedZones.some(z=>z.id==='hair-whole'),true);
  const newCheck=inspectIdleFrames(revisedFile,{root});assert.equal(newCheck.assemblyReady,false);assert.equal(newCheck.decision,'pending');
  await assert.rejects(()=>restoreRounded02Review({root}),/Run already exists/);
});
