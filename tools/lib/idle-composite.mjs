// Explicitly authorized, deterministic selection of supplied RGBA pixels. No redraw/blend/repair.
import assert from 'node:assert/strict';
import {compileIdlePlan,compareIdleRegion} from './idle-checks.mjs';

export function compositeMasks(plan){
  const {w,h,allowed:envelope,regions}=compileIdlePlan(plan);assert.ok(plan.composition,'Explicit composition plan required');
  const guardSource=plan.composition.guardSource??'generated';
  assert.ok(['generated','anchor'].includes(guardSource),'Unknown guard source');
  let core=Uint8Array.from(envelope);
  // Four-neighbour erosion freezes a visible context collar; this is mask data, not artwork.
  for(let step=0;step<plan.composition.guardBandPx;step++){
    const next=new Uint8Array(core.length);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const p=y*w+x;if(core[p]&&core[p-1]&&core[p+1]&&core[p-w]&&core[p+w])next[p]=1;}
    core=next;
  }
  assert.ok(core.some(Boolean),'Motion mask has no editable interior after seam guard');
  const guard=Uint8Array.from(envelope,(v,i)=>v&&!core[i]?1:0);
  // Existing plans select the full envelope. New explicit plans select only core.
  const allowed=guardSource==='anchor'?core:envelope;
  return {w,h,allowed,envelope,regions,core,guard,guardSource};
}
function bounds(mask,w){let l=w,t=Infinity,r=-1,b=-1;for(let i=0;i<mask.length;i++)if(mask[i]){const x=i%w,y=Math.floor(i/w);l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return r<0?null:[l,t,r-l+1,b-t+1];}
export function inspectCompositeSource(anchor,source,plan){
  const {w,h,allowed,envelope,regions,core,guard,guardSource}=compositeMasks(plan);
  assert.equal(anchor.length,w*h*4);assert.equal(source.length,anchor.length);
  const outside=Uint8Array.from(allowed,v=>v?0:1),changed=new Uint8Array(w*h),discarded=new Uint8Array(w*h);
  const output=Buffer.from(anchor);let preserved=0,selected=0,maxDelta=0,edgeSamples=0;
  for(let p=0;p<allowed.length;p++){
    const offset=p*4,same=anchor.subarray(offset,offset+4).equals(source.subarray(offset,offset+4));
    if(allowed[p]){source.copy(output,offset,offset,offset+4);selected++;if(!same)changed[p]=1;}
    else{preserved++;if(!same)discarded[p]=1;}
  }
  // Detect a discontinuity at the INNER edge of the fixed collar as well as the outer cut.
  for(let p=0;p<core.length;p++)if(core[p])for(const q of [p-1,p+1,p-w,p+w])if(guard[q]){
    edgeSamples++;for(let k=0;k<4;k++){const value=(data,index)=>k===3?data[index*4+3]:data[index*4+k]*data[index*4+3]/255;
      maxDelta=Math.max(maxDelta,Math.abs((value(output,p)-value(output,q))-(value(anchor,p)-value(anchor,q))));}
  }
  const guardCheck=compareIdleRegion(anchor,source,guard),outsideCheck=compareIdleRegion(anchor,source,outside);
  const budgets=regions.map(r=>{const m=compareIdleRegion(anchor,guardSource==='anchor'?output:source,r.indices);return {id:r.id,...m,budgetPassed:m.changedFraction<=r.maxChangedFraction&&m.meanRgbaError<=r.maxMeanRgbaError};});
  const blockers=[];
  if(guardSource==='generated'&&guardCheck.rawChangedPixels)blockers.push('source_guard_band_differs_from_anchor');
  if(maxDelta>plan.composition.maxInnerEdgeChannelDelta)blockers.push('inner_seam_gradient_budget_exceeded');
  if(budgets.some(r=>!r.budgetPassed))blockers.push('source_motion_region_budget_exceeded');
  const inside=compareIdleRegion(anchor,source,allowed);
  if(!inside.changedPixels)blockers.push('no_observable_motion_in_supplied_region');
  const report={kind:'masked-upper-body-technical-review',technicalStatus:blockers.length?'blocked':'technical_checks_passed',blockers,
    sourceScope:'upper-body-partial-on-original-canvas; not a verified full-character frame',
    sourceInsideMask:inside,guardPolicy:guardSource==='anchor'?'anchor-guard-core-only':'source-guard-exact-match',
    ...(guardSource==='anchor'?{sourceEnvelope:compareIdleRegion(anchor,source,envelope),sourceGuardExcluded:{...guardCheck,disposition:'Preserved raw source differences; excluded by the predeclared anchor-guard contract'},compositeGuard:compareIdleRegion(anchor,output,guard),sourceRegionMeasurements:regions.map(r=>({id:r.id,...compareIdleRegion(anchor,source,r.indices)}))}:{}),
    sourceOutsideMask:{...outsideCheck,discardedChangeBounds:bounds(discarded,w),disposition:'Excluded by the predeclared mask; disclosed, never treated as a full-source lock PASS'},
    generatedRegionBudgets:budgets,changedCompositeBounds:bounds(changed,w),selectedPixels:selected,preservedAnchorPixels:preserved,
    compositeOutsideMask:compareIdleRegion(anchor,output,outside),
    protectedZones:plan.protectedZones.map(z=>{const mask=new Uint8Array(w*h);for(let y=z.rect[1];y<z.rect[1]+z.rect[3];y++)for(let x=z.rect[0];x<z.rect[0]+z.rect[2];x++)mask[y*w+x]=1;return {id:z.id,sourceChanges:compareIdleRegion(anchor,source,mask),compositeChanges:compareIdleRegion(anchor,output,mask)};}),
    boundarySeam:{guardBandPx:plan.composition.guardBandPx,guardBandComparison:guardCheck,...(guardSource==='anchor'?{guardPixelSource:'anchor',compositeGuardComparison:compareIdleRegion(anchor,output,guard)}:{}),innerEdgeSamples:edgeSamples,maxInnerEdgeChannelDelta:maxDelta,maximum:plan.composition.maxInnerEdgeChannelDelta,artisticSeamQuality:'unreviewed'},
    operations:['exact-rgba-selection'],artApproved:false,animationApproved:false,decision:'pending',reviewState:'pending-motion-review',productionReady:false,runtimeVerified:false};
  return {output,report};
}
