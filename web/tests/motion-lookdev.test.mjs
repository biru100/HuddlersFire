// Synthetic receipts test the motion handoff contract; never treated as user art.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {prepareArtJob,assessArtSubmission,verifyArtReview} from '../../tools/lib/art-direction.mjs';
import {prepareMotionJob,loadMotionJob,receiveMotionJob,validateMotionMetrics,motionPrompt} from '../../tools/motion-lookdev.mjs';
const sha = data => createHash('sha256').update(Buffer.isBuffer(data)||typeof data==='string'?data:JSON.stringify(data)).digest('hex');
const save = (file,x) => writeFileSync(file,JSON.stringify(x,null,2)+'\n');
const read = file => JSON.parse(readFileSync(file,'utf8'));
const fixturePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCWQAAAAASUVORK5CYII=','base64');
function approvedParent(t){
  const root=mkdtempSync(join(tmpdir(),'huddlers-motion-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  mkdirSync(join(root,'art/sprites'),{recursive:true});
  const policy=read(new URL('../../art/sprites/art-direction.json',import.meta.url));
  save(join(root,'art/sprites/art-direction.json'),policy);
  save(join(root,'art/sprites/scene-spec.json'),{pixelQuarterview:{version:1,projection:{tile:[80,40]},avatar:{canvas:[64,96],feet:[32,88],head:[32,28],seat:[32,62],states:{idle:{frames:1,durations:[1000]}}}}});
  const prepared=prepareArtJob({root,out:'approved-rounded02-nw',variation:'rounded',view:'nw'});
  const jobFile=join(prepared.directory,'job.json'),job=read(jobFile);
  writeFileSync(join(prepared.directory,'source/candidate.png'),fixturePng);
  const receipt={file:'source/candidate.png',sourceType:'image-generation',surface:'chatgpt',requestedModel:policy.generation.requestedModel,
    observedModel:null,modelEvidence:{kind:'unverified',reference:''},operations:['lossless-copy'],
    paletteRgb:[],frameAnchors:{feet:[32,88],head:[32,28]},originalSha256:sha(fixturePng)};
  save(join(prepared.directory,'submission.json'),receipt);
  const metrics={sha256:sha(fixturePng),bytes:fixturePng.length,size:[1,1],bounds:[0,0,1,1],alpha:{opaque:1,transparent:0,soft:0},paletteMismatches:null};
  const harness=sha(readFileSync(new URL('../../tools/lib/art-direction.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n'));
  const fingerprint=sha({job,receipt,metrics,harness});
  mkdirSync(join(prepared.directory,'build'));
  save(join(prepared.directory,'build/art-intake.json'),{fingerprint,sourceSha256:sha(fixturePng),metrics,...assessArtSubmission(job,receipt,metrics)});
  const review={version:1,fingerprint,reviewer:'synthetic test user',reviewerRole:'user',decision:'approved',
    artDirectorReview:{actor:'chatgpt',reference:'synthetic-test-only',summary:'Synthetic review; not real art'},
    userDecision:{quote:'synthetic-test-only',reference:'synthetic-test-only'},
    criteria:Object.fromEntries(policy.criteria.map(id=>[id,{result:'pass',observation:'synthetic-test-only'}])),unresolved:[]};
  const reviewFile=join(prepared.directory,'art-review.json');
  save(reviewFile,review);
  assert.equal(verifyArtReview(jobFile,reviewFile,{root}).stage,'lookdev');
  return {root,jobFile,reviewFile};
}
test('motion is exploratory, never production or runtime approval',()=>{
  const m=validateMotionMetrics({size:[1254,1254],bounds:[10,10,400,800],alpha:{opaque:10,soft:60,transparent:500}});
  assert.equal(m.status,'reference_only');assert.equal(m.productionReady,false);assert.equal(m.runtimeVerified,false);
  assert.equal(m.frameCellsVerified,false);assert.equal(m.loopVerified,false);assert.ok(m.warnings.includes('soft_alpha_not_native'));
});
test('reject invalid grid, blank sheets and no transparency',()=>{
  assert.ok(validateMotionMetrics({size:[1253,1254],bounds:[0,0,1,1],alpha:{opaque:1,soft:0,transparent:1}}).blockers.includes('invalid_2x2_sheet_dimensions'));
  assert.ok(validateMotionMetrics({size:[1254,1254],bounds:null,alpha:{opaque:0,soft:0,transparent:100}}).blockers.includes('empty_motion_sheet'));
  assert.ok(validateMotionMetrics({size:[1254,1254],bounds:[0,0,10,10],alpha:{opaque:500,soft:0,transparent:0}}).blockers.includes('no_transparent_background'));
});
test('cannot prepare motion without an approved design parent',t=>{
  const {root}=approvedParent(t);
  assert.throws(()=>prepareMotionJob({root,out:'no-parent',view:'nw'}),/parent and review required/);
  assert.throws(()=>prepareMotionJob({root,out:'bad-view',view:'sw'}),/view/);
});
test('approved same-view lookdev is byte-preserved, still a concept, receipt never overwritten',t=>{
  const f=approvedParent(t);
  const m=prepareMotionJob({root:f.root,out:'motion-nw-idle-01',view:'nw',parentJob:f.jobFile,parentReview:f.reviewFile});
  const file=join(m.directory,'job.json'),job=loadMotionJob(file,{root:f.root});
  assert.equal(job.view,'nw');assert.equal(job.frameCount,4);assert.deepEqual(job.grid,[2,2]);
  assert.deepEqual(readFileSync(join(m.directory,'REFERENCE.png')),fixturePng);
  assert.match(motionPrompt(job),/LOOKDEV_ONLY/);
  assert.match(motionPrompt(job),/2×2/);
  assert.doesNotMatch(motionPrompt(job),/완료된 게임용/);
  const png=join(f.root,'incoming.png');writeFileSync(png,fixturePng);
  const received=receiveMotionJob(file,png,{root:f.root,sourceReference:'synthetic-test'});
  assert.equal(received.originalPreserved,true);
  assert.equal(received.sourceSha256,sha(fixturePng));
  assert.deepEqual(readFileSync(join(m.directory,'source/candidate.png')),fixturePng);
  assert.equal(read(join(m.directory,'submission.json')).productionReady,false);
  assert.throws(()=>receiveMotionJob(file,png,{root:f.root}),/already received/);
  assert.throws(()=>prepareMotionJob({root:f.root,out:'motion-nw-idle-01',view:'nw',parentJob:f.jobFile,parentReview:f.reviewFile}),/Job exists/);
});
test('parent direction mismatch and altered reference are rejected',t=>{
  const f=approvedParent(t);
  assert.throws(()=>prepareMotionJob({root:f.root,out:'wrong-view',view:'se',parentJob:f.jobFile,parentReview:f.reviewFile}),/same view/);
  const m=prepareMotionJob({root:f.root,out:'right-view',view:'nw',parentJob:f.jobFile,parentReview:f.reviewFile});
  writeFileSync(join(m.directory,'REFERENCE.png'),'changed');
  assert.throws(()=>loadMotionJob(join(m.directory,'job.json'),{root:f.root}),/Changed motion design reference/);
});
