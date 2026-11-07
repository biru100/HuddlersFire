// Measurement only: never translate, replace, threshold or redraw source pixels.
import assert from 'node:assert/strict';
import {estimateTranslation} from './motion-analysis.mjs';
const round=n=>Math.round(n*10000)/10000;
const inRect=(x,y,r)=>x>=r[0]&&y>=r[1]&&x<r[0]+r[2]&&y<r[1]+r[3];
function polygonContains(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [xi,yi]=points[i],[xj,yj]=points[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
}return inside;}
export function compileIdlePlan(plan){
  const [w,h]=plan.canvas||[];
  assert.ok(plan.version===1&&['nw','se'].includes(plan.view)&&Number.isInteger(w)&&Number.isInteger(h)&&w>0&&h>0&&w*h<=16777216,'Invalid Idle plan canvas/view');
  assert.equal(plan.defaultRegion,'locked','Everything outside explicit motion regions must stay locked');
  assert.ok(plan.protectedZones?.length>=3&&plan.motionRegions?.length>0,'Foot/lower-body protection and motion regions required');
  const ids=new Set();
  for(const z of plan.protectedZones){assert.ok(z.id&&!ids.has(z.id)&&Array.isArray(z.rect)&&z.rect.length===4&&z.rect.every(Number.isInteger)&&z.rect[0]>=0&&z.rect[1]>=0&&z.rect[2]>0&&z.rect[3]>0&&z.rect[0]+z.rect[2]<=w&&z.rect[1]+z.rect[3]<=h,'Invalid protected rectangle');ids.add(z.id);}
  for(const id of ['shoe-screen-left','shoe-screen-right','lower-body'])assert.ok(ids.has(id),'Missing locked zone '+id);
  const allowed=new Uint8Array(w*h),regions=[];
  for(const r of plan.motionRegions){
    assert.ok(r.id&&!ids.has(r.id)&&r.polygon?.length>=3,'Invalid motion region');ids.add(r.id);
    for(const p of r.polygon)assert.ok(Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p[0]>=0&&p[1]>=0&&p[0]<=w&&p[1]<=h,'Motion polygon outside canvas');
    assert.ok(r.maxChangedFraction>0&&r.maxChangedFraction<=1&&r.maxMeanRgbaError>0&&r.maxMeanRgbaError<=255,'Invalid change budget');
    const xs=r.polygon.map(p=>p[0]),ys=r.polygon.map(p=>p[1]),indices=[];
    for(let y=Math.min(...ys);y<Math.max(...ys);y++)for(let x=Math.min(...xs);x<Math.max(...xs);x++)if(polygonContains(x+.5,y+.5,r.polygon)){
      assert.ok(!plan.protectedZones.some(z=>inRect(x,y,z.rect)),'Motion region intersects locked zone: '+r.id);
      const i=y*w+x;assert.equal(allowed[i],0,'Motion regions overlap: '+r.id);allowed[i]=1;indices.push(i);
    }
    assert.ok(indices.length,'Empty motion polygon');regions.push({...r,indices});
  }
  const b=plan.checks;
  assert.ok(b&&b.maxGlobalTranslationPx===0&&b.maxLockedChangedPixels===0&&b.maxFootChangedPixels===0,'Locked pixels/global position must not be silently relaxed');
  assert.ok(b.maxTransitionRateRatio>=1&&b.maxSeamRateToOtherMean>=0&&b.maxEdgeMeanError>0&&b.minimumMotionPixels>=1,'Invalid temporal budgets');
  return {w,h,allowed,regions};
}
function compare(a,b,indices){
  let changed=0,visible=0,error=0,rawChanged=0;
  const visit=i=>{i*=4;const aa=a[i+3],ba=b[i+3];let raw=false;for(let k=0;k<4;k++)if(a[i+k]!==b[i+k])raw=true;if(raw)rawChanged++;
    if(!aa&&!ba)return;visible++;if(raw)changed++;
    error+=Math.abs(aa-ba);for(let k=0;k<3;k++)error+=Math.abs(a[i+k]*aa/255-b[i+k]*ba/255);
  };
  if(indices instanceof Uint8Array){for(let i=0;i<indices.length;i++)if(indices[i])visit(i);}else for(const i of indices)visit(i);
  return {changedPixels:changed,rawChangedPixels:rawChanged,visibleUnionPixels:visible,changedFraction:round(changed/(visible||1)),meanRgbaError:round(error/(4*(visible||1)))};
}
function rectMask(w,h,rect){const mask=new Uint8Array(w*h);for(let y=rect[1];y<rect[1]+rect[3];y++)for(let x=rect[0];x<rect[0]+rect[2];x++)mask[y*w+x]=1;return mask;}
function maskedPremultiplied(data,mask){const out=new Uint8Array(data.length);let mass=0,sx=0,sy=0;for(let p=0;p<mask.length;p++)if(mask[p]){
  const i=p*4,a=data[i+3];out[i+3]=a;for(let k=0;k<3;k++)out[i+k]=Math.round(data[i+k]*a/255);
  mass+=a;sx+=(p%mask.width)*a;sy+=Math.floor(p/mask.width)*a;
}return {data:out,center:mass?[sx/mass,sy/mass]:[0,0]};}
export function inspectIdlePixels(frames,plan,intent){
  const {w,h,allowed,regions}=compileIdlePlan(plan);
  assert.equal(frames.length,4);for(const data of frames)assert.equal(data.length,w*h*4,'Frame canvas differs from f1');
  assert.deepEqual(intent.frames.map(f=>f.id),['f1','f2','f3','f4']);assert.deepEqual(intent.frames.map(f=>f.intent),['neutral-anchor','inhale','exhale','return']);
  assert.ok(intent.frames.every(f=>Number.isInteger(f.durationMs)&&f.durationMs>=80&&f.durationMs<=2000),'Invalid frame timing');
  const locked=Uint8Array.from(allowed,v=>v?0:1),feet=plan.protectedZones.filter(z=>z.id.startsWith('shoe-'));
  const lower=rectMask(w,h,plan.protectedZones.find(z=>z.id==='lower-body').rect);lower.width=w;
  const origin=maskedPremultiplied(frames[0],lower),errors=[];
  const comparisons=frames.slice(1).map((data,index)=>{
    const frame='f'+(index+2),lock=compare(frames[0],data,locked);
    const foot=feet.map(z=>({id:z.id,...compare(frames[0],data,rectMask(w,h,z.rect))}));
    const target=maskedPremultiplied(data,lower),delta=origin.center.map((v,i)=>v-target.center[i]);
    const lowerDiff=compare(frames[0],data,lower);
    const fit=lowerDiff.changedPixels===0?{shiftBToA:[0,0]}:estimateTranslation(origin.data,target.data,w,h,delta);
    const motion=regions.map(r=>{const m=compare(frames[0],data,r.indices);return {id:r.id,...m,maxChangedFraction:r.maxChangedFraction,maxMeanRgbaError:r.maxMeanRgbaError,budgetPassed:m.changedFraction<=r.maxChangedFraction&&m.meanRgbaError<=r.maxMeanRgbaError};});
    if(lock.rawChangedPixels>0)errors.push(frame+':locked_region_changed');
    if(foot.some(f=>f.rawChangedPixels>0))errors.push(frame+':foot_lock_changed');
    if(Math.hypot(...fit.shiftBToA)>0)errors.push(frame+':global_translation');
    if(motion.some(r=>!r.budgetPassed))errors.push(frame+':motion_region_budget_exceeded');
    if(index<2&&compare(frames[0],data,allowed).changedPixels<plan.checks.minimumMotionPixels)errors.push(frame+':no_observable_motion');
    return {frame,globalTranslation:{shiftToAnchor:fit.shiftBToA,basis:'locked lower-body support; no corrective transform applied'},footLocks:foot,lockedRegion:lock,motionRegions:motion};
  });
  const transitions=frames.map((data,i)=>{const m=compare(data,frames[(i+1)%4],allowed);return {from:'f'+(i+1),to:'f'+((i+1)%4+1),...m,durationMs:intent.frames[i].durationMs,errorPerSecond:round(m.meanRgbaError*1000/intent.frames[i].durationMs)};});
  if(transitions.slice(0,3).some(e=>e.changedPixels<plan.checks.minimumMotionPixels))errors.push('frozen_internal_transition');
  const active=transitions.map(e=>e.errorPerSecond).filter(x=>x>0),ratio=active.length?Math.max(...active)/Math.min(...active):Infinity;
  const meanOthers=transitions.slice(0,3).reduce((s,e)=>s+e.errorPerSecond,0)/3;
  const seamRatio=transitions[3].errorPerSecond/(meanOthers||1);
  if(ratio>plan.checks.maxTransitionRateRatio)errors.push('uneven_transition_rhythm');
  if(transitions.some(e=>e.meanRgbaError>plan.checks.maxEdgeMeanError))errors.push('edge_change_budget_exceeded');
  if(seamRatio>plan.checks.maxSeamRateToOtherMean)errors.push('loop_seam_budget_exceeded');
  const returnError=compare(frames[0],frames[3],allowed).meanRgbaError,peaks=Math.max(...[frames[1],frames[2]].map(f=>compare(frames[0],f,allowed).meanRgbaError));
  if(returnError>peaks)errors.push('return_further_from_anchor_than_peaks');
  return {kind:'anchor-idle-alignment-report',technicalStatus:errors.length?'blocked':'technical_checks_passed',blockers:errors,frames:comparisons,transitions,
    rhythm:{rateRatio:Number.isFinite(ratio)?round(ratio):null,maximum:plan.checks.maxTransitionRateRatio,zeroEdgesExcluded:true,allEdgesZero:active.length===0},
    loopSmoothness:{seamRateToOtherMean:round(seamRatio),maximum:plan.checks.maxSeamRateToOtherMean,artisticSmoothness:'unreviewed'},
    morphDetectionSummary:{lockedPixelChanges:comparisons.map(f=>({frame:f.frame,pixels:f.lockedRegion.rawChangedPixels,visibleChangedPixels:f.lockedRegion.changedPixels})),overBudgetRegions:comparisons.flatMap(f=>f.motionRegions.filter(r=>!r.budgetPassed).map(r=>({frame:f.frame,region:r.id}))),interpretation:'Technical shape/color/alpha drift indicators only. Camera, perspective, direction and anatomical identity require ChatGPT review.'},
    cameraPerspectiveDirection:'requires_chatgpt_review',decision:'pending',reviewState:'pending-motion-review',artApproved:false,animationApproved:false,productionReady:false,runtimeVerified:false};
}
