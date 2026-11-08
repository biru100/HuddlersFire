// Pixel-edit fixtures below are tests only, never character artwork or user approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {compositeMasks,inspectCompositeSource} from '../../tools/lib/idle-composite.mjs';
import {compileIdlePlan} from '../../tools/lib/idle-checks.mjs';
import {coreFrameRequest,coreFrameRequestText} from '../../tools/lib/idle-core-request.mjs';
import {decodeIdlePng} from '../../tools/idle-frames.mjs';
const W=32,H=48;
const plan={version:1,view:'nw',canvas:[W,H],defaultRegion:'locked',
 protectedZones:[{id:'hair-whole',rect:[0,0,W,8]},{id:'lower-body',rect:[0,32,W,16]},{id:'shoe-screen-left',rect:[4,40,10,8]},{id:'shoe-screen-right',rect:[18,40,10,8]}],
 motionRegions:[{id:'cloth-interior',polygon:[[8,10],[25,10],[25,28],[8,28]],maxChangedFraction:.2,maxMeanRgbaError:12}],
 composition:{mode:'masked-rgba-replacement',maskSource:'frozen-motion-polygons',outsideMask:'anchor',insideMask:'generated-original',guardBandPx:2,guardSource:'anchor',maxInnerEdgeChannelDelta:12},
 checks:{maxGlobalTranslationPx:0,maxLockedChangedPixels:0,maxFootChangedPixels:0,maxTransitionRateRatio:1.6,maxSeamRateToOtherMean:1.25,maxEdgeMeanError:10,minimumMotionPixels:1}};
function anchor(){const b=Buffer.alloc(W*H*4);for(let p=0;p<W*H;p++)b.set([70,110,90,254],p*4);b.set([9,8,7,0],0);return b;}
const point=(x,y)=>(y*W+x)*4;
test('new selection mask is the eroded core and the guard comes from anchor',()=>{
 const m=compositeMasks(plan);assert.equal(m.allowed,m.core);assert.equal(m.guardSource,'anchor');
 assert.ok(m.envelope.reduce((a,b)=>a+b,0)>m.allowed.reduce((a,b)=>a+b,0));
 for(let i=0;i<m.allowed.length;i++)if(m.guard[i])assert.equal(m.allowed[i],0);
});
test('old plans retain the full mask and exact source-guard requirement',()=>{
 const old=structuredClone(plan);delete old.composition.guardSource;
 const m=compositeMasks(old);assert.deepEqual(m.allowed,compileIdlePlan(old).allowed);
 const a=anchor(),s=Buffer.from(a);s[point(15,18)]+=4;s[point(9,18)]+=3;
 assert.ok(inspectCompositeSource(a,s,old).report.blockers.includes('source_guard_band_differs_from_anchor'));
});
test('raw guard/outside differences are disclosed, never transplanted into the derivative',()=>{
 const a=anchor(),s=Buffer.from(a);s[point(15,18)]+=4;s[point(9,18)]+=60;s[0]=200;
 const before=Buffer.from(s),{output,report}=inspectCompositeSource(a,s,plan);
 assert.equal(report.technicalStatus,'technical_checks_passed');assert.equal(report.sourceGuardExcluded.rawChangedPixels,1);
 assert.equal(report.compositeGuard.rawChangedPixels,0);assert.equal(report.compositeOutsideMask.rawChangedPixels,0);
 assert.ok(report.sourceOutsideMask.rawChangedPixels>=2);assert.equal(output[0],a[0]);assert.equal(output[point(9,18)],a[point(9,18)]);
 assert.equal(output[point(15,18)],s[point(15,18)]);assert.deepEqual(s,before);
 assert.equal(report.artApproved,false);assert.equal(report.animationApproved,false);assert.equal(report.runtimeVerified,false);
});
test('using anchor guard does not bypass the core/guard seam check',()=>{
 const a=anchor(),s=Buffer.from(a);s[point(10,18)]+=70;
 assert.ok(inspectCompositeSource(a,s,plan).report.blockers.includes('inner_seam_gradient_budget_exceeded'));
});
test('nonmoving source and excessive core changes remain blocked',()=>{
 const a=anchor();assert.ok(inspectCompositeSource(a,a,plan).report.blockers.includes('no_observable_motion_in_supplied_region'));
 const s=Buffer.from(a),m=compositeMasks(plan);for(let i=0;i<m.core.length;i++)if(m.core[i])s[i*4]+=30;
 assert.ok(inspectCompositeSource(a,s,plan).report.blockers.includes('source_motion_region_budget_exceeded'));
});
test('unknown guard source cannot silently become an alternative composition mode',()=>{
 const p=structuredClone(plan);p.composition.guardSource='blend';assert.throws(()=>compositeMasks(p),/guard source/);
});
test('new frame request is single-frame, core-only, and does not require a pixel-identical raw guard',()=>{
 const job={view:'nw',canvas:[W,H],anchorSha256:'1'.repeat(64),planSha256:'2'.repeat(64),intentSha256:'3'.repeat(64),composition:{mode:'masked-rgba-replacement',maskFile:'motion-plan/COMPOSITE_MASK.bin',maskSha256:'4'.repeat(64)},regionComposition:plan.composition};
 const r=coreFrameRequest(job,{id:'f2',intent:'inhale',file:'generated/frame02-inhale.png'});
 assert.equal(r.output.sheet,false);assert.equal(r.composition.guardSource,'anchor');assert.equal(r.animationApproved,false);
 assert.match(coreFrameRequestText(r),/경계 띠와 그 밖은 f1/);assert.equal(r.roles.finalMotionSelection,'user');
});
test('real approved anchor is preserved by exact selection; synthetic delta is not artwork',()=>{
 const path=new URL('../../art/sprites/source-registry/rounded02-rev2-lookdev/original/nw-approved.png',import.meta.url);
 const bytes=readFileSync(path),before=createHash('sha256').update(bytes).digest('hex');
 assert.equal(before,'c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a');
 const a=decodeIdlePng(fileURLToPath(path)).data,p=JSON.parse(readFileSync(new URL('../../docs/briefs/rounded-02/idle-nw-regions-03.json',import.meta.url),'utf8'));
 const m=compositeMasks(p),s=Buffer.from(a);let selected=-1;
 for(let y=620;y<800&&selected<0;y++)for(let x=500;x<650;x++){const i=y*1086+x;if(m.core[i]&&a[i*4+3]>=128){selected=i;break;}}
 assert.ok(selected>=0);s[selected*4]^=1;const g=m.guard.findIndex(Boolean);s[g*4]^=1;s[0]^=1;
 const {output,report}=inspectCompositeSource(a,s,p);assert.equal(report.technicalStatus,'technical_checks_passed');
 for(let i=0;i<m.allowed.length;i++){const expected=m.allowed[i]?s:a;assert.ok(output.subarray(i*4,i*4+4).equals(expected.subarray(i*4,i*4+4)));}
 assert.equal(report.compositeGuard.rawChangedPixels,0);assert.ok(report.protectedZones.every(z=>z.compositeChanges.rawChangedPixels===0));
 assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),before);
});
