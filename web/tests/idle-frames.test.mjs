// Geometric RGBA fixtures only. No generated character artwork or real approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,rmdirSync,existsSync,symlinkSync,unlinkSync} from 'node:fs';
import {join,dirname,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {prepareArtJob,assessArtSubmission,verifyArtReview} from '../../tools/lib/art-direction.mjs';
import {prepareMotionJob} from '../../tools/motion-lookdev.mjs';
import {prepareIdleFrames,loadIdleFrames,confirmIdlePlan,receiveIdleFrame,inspectIdleFrames,assembleIdleFrames,decodeIdlePng,composeIdleFrame} from '../../tools/idle-frames.mjs';
import {compositeMasks,inspectCompositeSource} from '../../tools/lib/idle-composite.mjs';
import {compileIdlePlan,inspectIdlePixels} from '../../tools/lib/idle-checks.mjs';
import {verifyRegistry,loadRegistry} from '../../tools/art-source-registry.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const W=32,H=48;
const plan={version:1,view:'nw',canvas:[W,H],defaultRegion:'locked',protectedZones:[{id:'lower-body',rect:[0,30,W,18]},{id:'shoe-screen-left',rect:[6,40,8,7]},{id:'shoe-screen-right',rect:[18,40,8,7]}],motionRegions:[{id:'chest',polygon:[[10,10],[22,10],[22,20],[10,20]],maxChangedFraction:.25,maxMeanRgbaError:6}],checks:{maxGlobalTranslationPx:0,maxLockedChangedPixels:0,maxFootChangedPixels:0,maxTransitionRateRatio:1.6,maxSeamRateToOtherMean:1.25,maxEdgeMeanError:10,minimumMotionPixels:1}};
const intent={frames:[{id:'f1',intent:'neutral-anchor',durationMs:250},{id:'f2',intent:'inhale',durationMs:250},{id:'f3',intent:'exhale',durationMs:250},{id:'f4',intent:'return',durationMs:250}]};
function pixels(phase=0){const data=Buffer.alloc(W*H*4);data.set([7,5,9,0]);for(const [x0,y0,w,h] of [[10,10,12,10],[9,30,4,11],[19,30,4,11],[6,40,8,7],[18,40,8,7]])for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)data.set([100,80,60,253],(y*W+x)*4);for(let x=12;x<15;x++)data[(12*W+x)*4]+=phase;return data;}
function crc(b){let c=0xffffffff;for(const byte of b){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(name,data){const b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length);b.write(name,4);data.copy(b,8);b.writeUInt32BE(crc(b.subarray(4,-4)),b.length-4);return b;}
function png(data,width=W,height=H,profile=false){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)data.copy(rows,y*(width*4+1)+1,y*width*4,(y+1)*width*4);return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),...(profile?[chunk('sRGB',Buffer.from([0]))]:[]),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
function fixture(t){
  const root=mkdtempSync(join(tmpdir(),'hf-anchor-idle-'));t.after(()=>{assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep+'hf-anchor-idle-'));rmSync(root,{recursive:true,force:true});});mkdirSync(join(root,'art/sprites'),{recursive:true});
  const policy=read(new URL('../../art/sprites/art-direction.json',import.meta.url));save(join(root,'art/sprites/art-direction.json'),policy);
  save(join(root,'art/sprites/scene-spec.json'),{pixelQuarterview:{version:1,projection:{tile:[80,40]},avatar:{canvas:[64,96],feet:[32,88],head:[32,28],seat:[32,62],states:{idle:{frames:1,durations:[1000]}}}}});
  const prepared=prepareArtJob({root,out:'synthetic-approved-nw',variation:'rounded',view:'nw'}),jobFile=join(prepared.directory,'job.json'),job=read(jobFile),bytes=png(pixels());
  writeFileSync(join(prepared.directory,'source/candidate.png'),bytes);
  const receipt={file:'source/candidate.png',sourceType:'image-generation',surface:'chatgpt',requestedModel:policy.generation.requestedModel,observedModel:null,modelEvidence:{kind:'unverified',reference:''},operations:['lossless-copy'],paletteRgb:[],frameAnchors:{feet:[32,88],head:[32,28]},originalSha256:sha(bytes)};
  save(join(prepared.directory,'submission.json'),receipt);
  const metrics={sha256:sha(bytes),bytes:bytes.length,size:[W,H],bounds:[6,10,20,37],alpha:{opaque:0,transparent:1000,soft:536},paletteMismatches:null};
  const harness=sha(readFileSync(new URL('../../tools/lib/art-direction.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n')),fingerprint=sha(JSON.stringify({job,receipt,metrics,harness}));
  mkdirSync(join(prepared.directory,'build'));save(join(prepared.directory,'build/art-intake.json'),{fingerprint,sourceSha256:sha(bytes),metrics,...assessArtSubmission(job,receipt,metrics)});
  const reviewFile=join(prepared.directory,'art-review.json');save(reviewFile,{version:1,fingerprint,reviewer:'synthetic user',reviewerRole:'user',decision:'approved',artDirectorReview:{actor:'chatgpt',reference:'SYNTHETIC TEST ONLY',summary:'SYNTHETIC TEST ONLY'},userDecision:{quote:'SYNTHETIC TEST ONLY',reference:'SYNTHETIC TEST ONLY'},criteria:Object.fromEntries(policy.criteria.map(id=>[id,{result:'pass',observation:'SYNTHETIC TEST ONLY'}])),unresolved:[]});verifyArtReview(jobFile,reviewFile,{root});
  const anchor=join(root,'anchor.png'),planFile=join(root,'plan.json'),intentFile=join(root,'intent.json');writeFileSync(anchor,bytes);save(planFile,plan);save(intentFile,intent);
  return {root,jobFile,reviewFile,anchor,bytes,options:{root,out:'test-idle-frames-nw',view:'nw',parentJob:jobFile,parentReview:reviewFile,anchor,plan:planFile,intent:intentFile}};
}
function prepared(t){const f=fixture(t),made=prepareIdleFrames(f.options);return {...f,file:made.job,dir:dirname(made.job),made};}
function fill(f,{profile=false}={}){confirmIdlePlan(f.file,{root:f.root,reference:'SYNTHETIC PLAN CONFIRMATION ONLY'});for(const [frame,phase] of [['f2',12],['f3',24],['f4',12]]){const source=join(f.root,frame+'.png');writeFileSync(source,png(pixels(phase),W,H,profile));receiveIdleFrame(f.file,{root:f.root,frame,source,sourceReference:'SYNTHETIC GENERATION ONLY',anchorSha256:sha(f.bytes)});}}

test('full-sheet prepare is opt-in legacy; current default redirects to anchor frames',()=>assert.throws(()=>prepareMotionJob({}),/legacy-only.*idle-frames/));
test('default locked canvas, protected shoes and disjoint regions cannot be weakened',()=>{
  assert.equal(compileIdlePlan(plan).regions.length,1);
  for(const mutation of [p=>p.defaultRegion='motion',p=>p.checks.maxFootChangedPixels=1,p=>p.protectedZones.pop(),p=>p.motionRegions[0].polygon=[[5,39],[15,39],[15,47],[5,47]],p=>p.motionRegions.push({...p.motionRegions[0],id:'overlap'})]){const p=structuredClone(plan);mutation(p);assert.throws(()=>compileIdlePlan(p));}
});
test('four equal transitions pass technical checks only, preserving all approval gates',()=>{
  const report=inspectIdlePixels([pixels(),pixels(12),pixels(24),pixels(12)],plan,intent);assert.equal(report.technicalStatus,'technical_checks_passed');assert.equal(report.rhythm.rateRatio,1);assert.equal(report.transitions.length,4);assert.equal(report.artApproved,false);assert.equal(report.runtimeVerified,false);assert.equal(report.artisticBreathingReadability,undefined);
});
test('shoe and locked pixel edits, including invisible RGB, are blocked without correction',()=>{
  for(const position of [(42*W+8)*4,0]){const changed=pixels(12);changed[position]++;const report=inspectIdlePixels([pixels(),changed,pixels(24),pixels(12)],plan,intent);assert.ok(report.blockers.includes('f2:locked_region_changed'));assert.equal(report.morphDetectionSummary.lockedPixelChanges[0].pixels,1);if(position)assert.ok(report.blockers.includes('f2:foot_lock_changed'));else assert.equal(report.morphDetectionSummary.lockedPixelChanges[0].visibleChangedPixels,0);}
});
test('whole-character translation is diagnosed and never aligned into a pass',()=>{
  const shifted=Buffer.alloc(W*H*4),base=pixels(12);for(let y=0;y<H;y++)for(let x=0;x<W-2;x++)base.copy(shifted,(y*W+x+2)*4,(y*W+x)*4,(y*W+x+1)*4);
  const report=inspectIdlePixels([pixels(),shifted,pixels(24),pixels(12)],plan,intent);assert.ok(report.blockers.includes('f2:global_translation'));assert.deepEqual(report.frames[0].globalTranslation.shiftToAnchor,[-2,0]);
});
test('region morph budget, static fake motion and unique 2→3 jump are rejected',()=>{
  const over=pixels();for(let y=10;y<20;y++)for(let x=10;x<22;x++)over[(y*W+x)*4]=250;
  assert.ok(inspectIdlePixels([pixels(),over,pixels(24),pixels(12)],plan,intent).blockers.includes('f2:motion_region_budget_exceeded'));
  assert.ok(inspectIdlePixels([pixels(),pixels(),pixels(),pixels()],plan,intent).blockers.includes('f2:no_observable_motion'));
  assert.ok(inspectIdlePixels([pixels(),pixels(2),pixels(24),pixels(12)],plan,intent).blockers.includes('uneven_transition_rhythm'));
  assert.ok(inspectIdlePixels([pixels(),pixels(12),pixels(12),pixels()],plan,intent).blockers.includes('frozen_internal_transition'));
});
test('4→1 seam and return distance are checked separately from ordinary edges',()=>{
  const report=inspectIdlePixels([pixels(),pixels(2),pixels(4),pixels(24)],plan,intent);assert.ok(report.blockers.includes('loop_seam_budget_exceeded'));assert.ok(report.blockers.includes('return_further_from_anchor_than_peaks'));assert.equal(report.loopSmoothness.artisticSmoothness,'unreviewed');
});
test('anchor-only preparation registers actual bytes, awaits frames and invents no loop or review',t=>{
  const f=prepared(t);assert.deepEqual(readFileSync(join(f.dir,'base/frame01-anchor.png')),f.bytes);assert.deepEqual(f.made.missingFrames,['f2','f3','f4']);assert.equal(f.made.assemblyReady,false);
  const manifest=read(join(f.dir,'MANIFEST.json'));assert.equal(manifest.version,3);assert.equal(manifest.originals.length,1);assert.equal(verifyRegistry(join(f.dir,'MANIFEST.json'),{root:f.root}).files[0].sha256,sha(f.bytes));
  assert.equal(existsSync(join(f.dir,'generated/frame02-inhale.png')),false);assert.equal(existsSync(join(f.dir,'assembly/idle-4cut-reference.png')),false);assert.equal(existsSync(join(f.dir,'motion-plan/confirmation.json')),false);
  const html=readFileSync(join(f.dir,'review/loop-preview.html'),'utf8');assert.match(html,/id="play" disabled/);assert.match(html,/DRAFT/);assert.match(html,/64×96/);assert.throws(()=>assembleIdleFrames(f.file,{root:f.root}),/Assembly blocked/);
  assert.throws(()=>prepareIdleFrames(f.options),/Set exists/);
});
test('wrong view or alternate anchor cannot inherit a real design approval',t=>{
  const f=fixture(t);assert.throws(()=>prepareIdleFrames({...f.options,view:'se'}),/same-view/);writeFileSync(f.anchor,png(pixels(12)));assert.throws(()=>prepareIdleFrames(f.options),/exact approved design/);
});
test('intake requires confirmed plan, source provenance, matching anchor, exact canvas and fresh frame',t=>{
  const f=prepared(t),source=join(f.root,'f2.png');writeFileSync(source,png(pixels(12)));const opts={root:f.root,frame:'f2',source,sourceReference:'SYNTHETIC ONLY',anchorSha256:sha(f.bytes)};
  assert.throws(()=>receiveIdleFrame(f.file,opts),/Confirm/);assert.throws(()=>confirmIdlePlan(f.file,{root:f.root}),/actual ChatGPT/);
  confirmIdlePlan(f.file,{root:f.root,reference:'SYNTHETIC ONLY'});assert.throws(()=>receiveIdleFrame(f.file,{...opts,anchorSha256:'0'.repeat(64)}),/exact anchor/);assert.throws(()=>receiveIdleFrame(f.file,{...opts,sourceReference:''}),/reference/);
  const bad=join(f.root,'bad.png');writeFileSync(bad,png(Buffer.alloc(4),1,1));assert.throws(()=>receiveIdleFrame(f.file,{...opts,source:bad}),/Canvas mismatch/);
  receiveIdleFrame(f.file,opts);assert.throws(()=>receiveIdleFrame(f.file,opts),/Frame exists/);assert.deepEqual(readFileSync(join(f.dir,'generated/frame02-inhale.png')),readFileSync(source));
});
test('stale plan, changed request, missing receipt and approval promotion are detected',t=>{
  for(const kind of ['plan','request','receipt','approval']){const f=prepared(t);fill(f);if(kind==='plan')writeFileSync(join(f.dir,'motion-plan/REGION_LOCKS.json'),'{}');if(kind==='request')writeFileSync(join(f.dir,'motion-plan/f2-request.txt'),'changed');if(kind==='receipt')rmSync(join(f.dir,'generated/f2-receipt.json'));if(kind==='approval'){const m=read(join(f.dir,'MANIFEST.json'));m.artApproved=true;save(join(f.dir,'MANIFEST.json'),m);}assert.throws(()=>loadIdleFrames(f.file,{root:f.root}));}
});
test('version 3 rejects duplicate source slots and mismatched checksum inventories',t=>{
  const f=prepared(t),path=join(f.dir,'MANIFEST.json'),m=read(path);m.originals.push(m.originals[0]);save(path,m);assert.throws(()=>loadRegistry(path,{root:f.root}),/duplicate/);m.originals.pop();save(path,m);writeFileSync(join(f.dir,'SHA256SUMS.txt'),'wrong');assert.throws(()=>loadRegistry(path,{root:f.root}),/Checksums/);
});
test('a linked assembly/review directory cannot redirect writes outside the job',t=>{
  const f=prepared(t),target=join(f.root,'outside-job');mkdirSync(target);const assembly=join(f.dir,'assembly');
  unlinkSync(join(assembly,'.gitkeep'));rmdirSync(assembly);symlinkSync(target,assembly,'junction');
  assert.throws(()=>inspectIdleFrames(f.file,{root:f.root}),/Symlink outside project/);
  unlinkSync(assembly);mkdirSync(assembly);
});
test('assembly preserves every decoded RGBA including soft alpha and hidden RGB; originals stay immutable',t=>{
  const f=prepared(t);fill(f);const report=inspectIdleFrames(f.file,{root:f.root});assert.equal(report.assemblyReady,true);
  const result=assembleIdleFrames(f.file,{root:f.root}),sheet=decodeIdlePng(result.file);assert.equal(result.pixelExact,true);assert.equal(result.productionReady,false);assert.deepEqual(sheet.dimensions,[W*2,H*2]);
  for(let n=0;n<4;n++){const expected=pixels([0,12,24,12][n]);for(let y=0;y<H;y++){const start=((Math.floor(n/2)*H+y)*W*2+n%2*W)*4;assert.deepEqual(sheet.data.subarray(start,start+W*4),expected.subarray(y*W*4,(y+1)*W*4));}}
  assert.deepEqual(readFileSync(f.anchor),f.bytes);assert.deepEqual(readFileSync(join(f.dir,'generated/frame03-exhale.png')),png(pixels(24)));assert.throws(()=>assembleIdleFrames(f.file,{root:f.root}),/never overwrite/);
});
test('a failed current frame cannot be rescued with an old passing report',t=>{
  const f=prepared(t);fill(f);inspectIdleFrames(f.file,{root:f.root});writeFileSync(join(f.dir,'generated/frame03-exhale.png'),png(pixels(200)));assert.throws(()=>assembleIdleFrames(f.file,{root:f.root}),/match manifest/);
});
test('assembly refuses mismatched PNG color interpretation rather than recoloring',t=>{
  const f=prepared(t);fill(f,{profile:true});assert.equal(inspectIdleFrames(f.file,{root:f.root}).assemblyReady,false);assert.throws(()=>assembleIdleFrames(f.file,{root:f.root}),/png_color_profile_chunks_differ/);assert.equal(existsSync(join(f.dir,'assembly/idle-4cut-reference.png')),false);
});

function compositeFixture(t,{duration=475}={}){
  const f=fixture(t),p=structuredClone(plan),timing=structuredClone(intent);
  p.protectedZones.push({id:'hair-whole',rect:[0,0,W,8]});
  p.composition={mode:'masked-rgba-replacement',maskSource:'frozen-motion-polygons',outsideMask:'anchor',insideMask:'generated-original',guardBandPx:1,maxInnerEdgeChannelDelta:12};
  timing.frames.forEach(frame=>frame.durationMs=duration);save(join(f.root,'plan.json'),p);save(join(f.root,'intent.json'),timing);
  const anchorReview=join(f.root,'neutral.json');save(anchorReview,{actor:'chatgpt',reportedBy:'user',reference:'SYNTHETIC REPORTED REVIEW ONLY',quote:'SYNTHETIC f1 neutral suitability only',scope:'f1-neutral-only',sourceSha256:sha(f.bytes)});
  return {...f,plan:p,intent:timing,options:{...f.options,anchorReview}};
}
function preparedComposite(t){const f=compositeFixture(t),made=prepareIdleFrames(f.options);return {...f,file:made.job,dir:dirname(made.job)};}
function partialPixels(phase){const source=pixels(phase);source[0]++;source[(42*W+8)*4+3]=0;return source;}
function intakePartial(f,frame,phase,data=partialPixels(phase)){
  const source=join(f.root,frame+'-partial.png');writeFileSync(source,png(data));receiveIdleFrame(f.file,{root:f.root,frame,source,sourceReference:'SYNTHETIC PARTIAL SOURCE ONLY',anchorSha256:sha(f.bytes)});return source;
}
test('revised plan requires whole hair lock, explicit composition and a fixed editable interior',()=>{
  const p=structuredClone(plan);p.composition={mode:'masked-rgba-replacement',maskSource:'frozen-motion-polygons',outsideMask:'anchor',insideMask:'generated-original',guardBandPx:1,maxInnerEdgeChannelDelta:12};
  assert.throws(()=>compositeMasks(p),/all hair/);p.protectedZones.push({id:'hair-whole',rect:[0,0,W,8]});assert.ok(compositeMasks(p).core.some(Boolean));
  p.composition.mode='alpha-blend';assert.throws(()=>compositeMasks(p),/exact RGBA/);
});
test('partial source diagnostics disclose discarded source/hair/shoe/hidden RGB changes separately',()=>{
  const p=structuredClone(plan);p.protectedZones.push({id:'hair-whole',rect:[0,0,W,8]});p.composition={mode:'masked-rgba-replacement',maskSource:'frozen-motion-polygons',outsideMask:'anchor',insideMask:'generated-original',guardBandPx:1,maxInnerEdgeChannelDelta:12};
  const anchor=pixels(),source=partialPixels(12),original=Buffer.from(source),{output,report}=inspectCompositeSource(anchor,source,p);
  assert.equal(report.technicalStatus,'technical_checks_passed');assert.equal(report.sourceOutsideMask.rawChangedPixels,2);assert.equal(report.compositeOutsideMask.rawChangedPixels,0);assert.deepEqual(output,pixels(12));assert.deepEqual(source,original);
  assert.equal(report.protectedZones.find(z=>z.id==='hair-whole').sourceChanges.rawChangedPixels,1);assert.equal(report.protectedZones.find(z=>z.id==='hair-whole').compositeChanges.rawChangedPixels,0);assert.equal(report.artApproved,false);
});
test('neutral suitability never confirms revised regions or permits composition/intake',t=>{
  const f=preparedComposite(t),loaded=loadIdleFrames(f.file,{root:f.root});assert.equal(loaded.confirmed,false);assert.equal(loaded.job.version,2);
  const report=read(join(f.dir,'review/alignment-report.json'));assert.equal(report.neutralAnchorUsableAsReportedByUser,true);assert.equal(report.planConfirmed,false);assert.equal(report.loopDurationMs,1900);assert.equal(report.assemblyReady,false);
  assert.equal(existsSync(join(f.dir,'motion-plan/confirmation.json')),false);assert.equal(existsSync(join(f.dir,'composites/frame02-inhale.png')),false);
  assert.throws(()=>composeIdleFrame(f.file,{root:f.root,frame:'f2'}),/not been confirmed/);
  const source=join(f.root,'partial.png');writeFileSync(source,png(partialPixels(12)));assert.throws(()=>receiveIdleFrame(f.file,{root:f.root,frame:'f2',source,sourceReference:'SYNTHETIC ONLY',anchorSha256:sha(f.bytes)}),/Confirm/);
});
test('revised timing and actual neutral review scope are mandatory before preparation',t=>{
  const f=compositeFixture(t,{duration:250});assert.throws(()=>prepareIdleFrames(f.options),/1.8/);
  const g=compositeFixture(t);const n=read(g.options.anchorReview);n.scope='all-motion-approved';save(g.options.anchorReview,n);assert.throws(()=>prepareIdleFrames(g.options),/neutral-anchor review/);
});
test('source collar mismatch blocks composition, preserves raw failure and never writes a repaired image',t=>{
  const f=preparedComposite(t);confirmIdlePlan(f.file,{root:f.root,reference:'SYNTHETIC REVISED PLAN CONFIRMATION ONLY'});
  const data=partialPixels(12);data[(12*W+10)*4]++;const source=intakePartial(f,'f2',12,data),bytes=readFileSync(source);
  assert.throws(()=>composeIdleFrame(f.file,{root:f.root,frame:'f2'}),/source_guard_band/);assert.equal(existsSync(join(f.dir,'composites/frame02-inhale.png')),false);assert.deepEqual(readFileSync(source),bytes);
  assert.ok(read(join(f.dir,'review/f2-source-technical.json')).blockers.includes('source_guard_band_differs_from_anchor'));
  assert.equal(inspectIdleFrames(f.file,{root:f.root}).technicalStatus,'blocked');
});
test('the inner edge of an unchanged collar still detects a sharp seam',t=>{
  const f=compositeFixture(t),source=partialPixels(12);source[(12*W+11)*4]+=20;
  const {report}=inspectCompositeSource(pixels(),source,f.plan);assert.equal(report.boundarySeam.guardBandComparison.rawChangedPixels,0);assert.ok(report.blockers.includes('inner_seam_gradient_budget_exceeded'));
});
test('source and deterministic derivatives have independent hashes; final sheet uses composites and all gates stay pending',t=>{
  const f=preparedComposite(t);confirmIdlePlan(f.file,{root:f.root,reference:'SYNTHETIC REVISED PLAN CONFIRMATION ONLY'});
  for(const [frame,phase] of [['f2',12],['f3',24],['f4',12]]){const source=intakePartial(f,frame,phase),bytes=readFileSync(source),result=composeIdleFrame(f.file,{root:f.root,frame});assert.notEqual(result.sha256,sha(bytes));assert.deepEqual(decodeIdlePng(result.file).data,pixels(phase));assert.deepEqual(readFileSync(source),bytes);assert.deepEqual(readFileSync(join(f.dir,read(join(f.dir,'MANIFEST.json')).originals.find(e=>e.slot===frame).path)),bytes);}
  const inspected=inspectIdleFrames(f.file,{root:f.root});assert.equal(inspected.assemblyReady,true);assert.equal(inspected.artApproved,false);
  const report=read(join(f.dir,'review/alignment-report.json'));assert.equal(report.sourceTechnicalReviews.length,3);assert.equal(report.sourceTechnicalReviews[0].sourceOutsideMask.rawChangedPixels,2);
  const result=assembleIdleFrames(f.file,{root:f.root}),proof=read(join(f.dir,'assembly/ASSEMBLY.json'));assert.equal(result.pixelExact,true);assert.match(proof.sources[1].path,/composites/);assert.match(proof.sourceOriginals[1].path,/generated/);assert.equal(proof.runtimeVerified,false);
  assert.throws(()=>composeIdleFrame(f.file,{root:f.root,frame:'f2'}),/never overwrite/);
});
test('frozen mask and derivative provenance tampering are detected independently',t=>{
  const f=preparedComposite(t),mask=join(f.dir,'motion-plan/COMPOSITE_MASK.bin'),bytes=readFileSync(mask);bytes[0]=1;writeFileSync(mask,bytes);assert.throws(()=>loadIdleFrames(f.file,{root:f.root}),/Changed frozen mask/);
  const g=preparedComposite(t);confirmIdlePlan(g.file,{root:g.root,reference:'SYNTHETIC ONLY'});intakePartial(g,'f2',12);composeIdleFrame(g.file,{root:g.root,frame:'f2'});
  const proofFile=join(g.dir,'composites/f2-COMPOSITE.json'),proof=read(proofFile);proof.maskSha256='0'.repeat(64);save(proofFile,proof);assert.throws(()=>inspectIdleFrames(g.file,{root:g.root}),/Stale composite provenance/);
});
