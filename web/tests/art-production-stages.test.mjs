// Synthetic RGBA fixtures only: never artwork, no model generation or automatic pixelization.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {compositeMasks} from '../../tools/lib/idle-composite.mjs';
import {ACTIVE_NW_CORE03,ART_STAGES,sha256,inspectPngHeader,evaluatePixelMaster,
  validateFrameReceipt,evaluateFrameCandidate,stageOverview} from '../../tools/lib/art-production-stages.mjs';

const W=32,H=48;
const plan={version:1,view:'nw',canvas:[W,H],defaultRegion:'locked',
 protectedZones:[{id:'hair-whole',rect:[0,0,W,8]},{id:'lower-body',rect:[0,32,W,16]},
   {id:'shoe-screen-left',rect:[4,40,10,8]},{id:'shoe-screen-right',rect:[18,40,10,8]}],
 motionRegions:[{id:'cloth-interior',polygon:[[8,10],[25,10],[25,28],[8,28]],maxChangedFraction:0.2,maxMeanRgbaError:12}],
 composition:{mode:'masked-rgba-replacement',maskSource:'frozen-motion-polygons',outsideMask:'anchor',
   insideMask:'generated-original',guardBandPx:2,guardSource:'anchor',maxInnerEdgeChannelDelta:12},
 checks:{maxGlobalTranslationPx:0,maxLockedChangedPixels:0,maxFootChangedPixels:0,maxTransitionRateRatio:1.6,
   maxSeamRateToOtherMean:1.25,maxEdgeMeanError:10,minimumMotionPixels:1}};
function crc(bytes){let value=0xffffffff;for(const b of bytes){value^=b;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0);}return(value^0xffffffff)>>>0;}
function chunk(name,data){const b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length);b.write(name,4);data.copy(b,8);b.writeUInt32BE(crc(b.subarray(4,-4)),b.length-4);return b;}
function png(pixels=base(),w=W,h=H,color=6){
 const channels=color===6?4:3,ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=color;
 const rows=Buffer.alloc(h*(w*channels+1));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let k=0;k<channels;k++)rows[y*(w*channels+1)+1+x*channels+k]=pixels[(y*w+x)*4+k];
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
function base(){const b=Buffer.alloc(W*H*4);for(let i=0;i<W*H;i++)b.set([70,110,90,254],i*4);return b;}
const at=(x,y)=>(y*W+x)*4;
function source(shift=4){const b=base();b[at(15,18)]+=shift;return b;}
function fixture(){
 const a=base(),s=source(),anchorBytes=png(a),sourceBytes=png(s),job={setId:'fixture-core03',view:'nw',canvas:[W,H],
  anchorSha256:sha256(anchorBytes),planSha256:'2'.repeat(64),composition:{maskSha256:'3'.repeat(64)}};
 const receipt={version:1,stage:'frame-edit',frame:'f2',technique:'manual-pixel-edit',inputKind:'actual-approved-f1-png',
  inputSha256:job.anchorSha256,pixelMasterSha256:job.anchorSha256,sourceSha256:sha256(sourceBytes),
  sourceReference:'synthetic fixture path for test',editorOrTool:'synthetic pixel editor',
  planSha256:job.planSha256,maskSha256:job.composition.maskSha256,canvas:[W,H],operations:['manual-pixel-edit'],
  resized:false,cropped:false,flipped:false,recolored:false,alphaConverted:false,quantized:false,
  artApproved:false,animationApproved:false,productionReady:false,runtimeVerified:false};
 return {a,s,anchorBytes,sourceBytes,job,receipt};
}
const run=(f,override={})=>evaluateFrameCandidate({job:f.job,plan,frame:'f2',anchorBytes:f.anchorBytes,
 sourceBytes:f.sourceBytes,anchorPixels:f.a,sourcePixels:f.s,receipt:f.receipt,...override});

test('explicit stage ordering separates generation from frame and game delivery',()=>{
 assert.deepEqual(ART_STAGES,['generation','pixel-master','frame-edit','core-composite','motion-review','native-delivery']);
 assert.equal(ACTIVE_NW_CORE03,'art/sprites/source-registry/rounded02-idle-frames-nw-03/job.json');
 const f=fixture(),view=stageOverview({job:f.job,manifest:{originals:[{slot:'f1'}]},confirmed:true});
 assert.equal(view.stages[0].status,'skipped_existing_approved_lookdev');
 assert.equal(view.stages[1].sha256,f.job.anchorSha256);
 assert.equal(view.stages[2].nextFrame,'f2');
 assert.equal(view.animationApproved,false);
});
test('pixel master is checked by exact bytes, not generated from an illustration or repaired',()=>{
 const f=fixture(),valid=evaluatePixelMaster({sourceBytes:f.anchorBytes,expectedSha256:f.job.anchorSha256,canvas:[W,H]});
 assert.equal(valid.blockers.length,0);
 assert.equal(valid.technicalStatus,'source_header_verified_needs_decode_and_art_review');
 assert.ok(evaluatePixelMaster({sourceBytes:f.anchorBytes,expectedSha256:f.job.anchorSha256,canvas:[W,H+1]}).blockers.includes('canvas_mismatch'));
 assert.ok(evaluatePixelMaster({sourceBytes:f.anchorBytes,expectedSha256:'0'.repeat(64),canvas:[W,H]}).blockers.includes('pixel_master_sha_mismatch'));
});
test('frame receipts reject whole-frame regeneration and unattested actual inputs',()=>{
 const f=fixture();
 assert.equal(validateFrameReceipt(f.receipt,{job:f.job,frame:'f2',sourceSha256:sha256(f.sourceBytes)}).length,0);
 for(const [key,value,reason] of [
  ['technique','whole-character-redraw','wrong_edit_technique'],
  ['inputKind','visual-reference-only','missing_actual_f1_input_attestation'],
  ['inputSha256','0'.repeat(64),'wrong_input_master'],
  ['sourceSha256','0'.repeat(64),'source_hash_mismatch'],
  ['operations',['resize'],'unapproved_operations'],
  ['artApproved',true,'receipt_cannot_grant_approval'],
  ['cropped',true,'prohibited_transformation']]){
  const receipt={...f.receipt,[key]:value};
  assert.ok(validateFrameReceipt(receipt,{job:f.job,frame:'f2',sourceSha256:sha256(f.sourceBytes)}).includes(reason));
 }
});
test('exactly sized and genuinely edited source may pass only the technical intake gate',()=>{
 const f=fixture(),report=run(f);
 assert.equal(report.technicalStatus,'ready_for_explicit_technical_intake');
 assert.equal(report.blockers.length,0);
 assert.equal(report.artApproved,false);
 assert.equal(report.animationApproved,false);
 assert.equal(report.sourceOutsideChanges,0);
});
test('manual pixel editing cannot change even a hidden or outside source pixel',()=>{
 const f=fixture(),s=Buffer.from(f.s);s[at(1,1)]+=10;
 const sourceBytes=png(s),receipt={...f.receipt,sourceSha256:sha256(sourceBytes)};
 const report=run(f,{sourcePixels:s,sourceBytes,receipt});
 assert.ok(report.blockers.includes('raw_source_excessive_outside_drift'));
 assert.equal(report.coreTechnicalReview.compositeOutsideMask.rawChangedPixels,0);
 assert.equal(report.coreTechnicalReview.sourceOutsideMask.rawChangedPixels,1);
});
test('masked inpaint reports small discarded outside source differences, not source-lock success',()=>{
 const f=fixture(),s=Buffer.from(f.s);s[at(1,1)]+=10;
 const sourceBytes=png(s),receipt={...f.receipt,technique:'masked-inpaint',operations:['masked-inpaint'],sourceSha256:sha256(sourceBytes)};
 const report=run(f,{sourcePixels:s,sourceBytes,receipt});
 assert.equal(report.technicalStatus,'ready_for_explicit_technical_intake');
 assert.equal(report.sourceOutsideChanges,1);
 assert.equal(report.coreTechnicalReview.compositeOutsideMask.rawChangedPixels,0);
 assert.match(report.provenance,/self-attested/);
});
test('bulk change outside CORE is rejected even if exact selection would hide the redraw',()=>{
 const f=fixture(),s=Buffer.from(f.s);
 for(let y=0;y<8;y++)for(let x=0;x<30;x++)s[at(x,y)]+=1;
 const sourceBytes=png(s),receipt={...f.receipt,technique:'masked-inpaint',operations:['masked-inpaint'],sourceSha256:sha256(sourceBytes)};
 const report=run(f,{sourcePixels:s,sourceBytes,receipt});
 assert.ok(report.blockers.includes('raw_source_excessive_outside_drift'));
});
test('mismatched canvas and RGB are blocked before any rescale, crop or decode repair',()=>{
 const f=fixture(),wide=png(base(),W,H+1);const receipt={...f.receipt,sourceSha256:sha256(wide)};
 const report=run(f,{sourceBytes:wide,receipt,sourcePixels:null});
 assert.ok(report.blockers.includes('canvas_mismatch'));
 assert.equal(report.coreTechnicalReview,null);
 const rgb=png(f.s,W,H,2);
 assert.equal(inspectPngHeader(rgb).valid,false);
 assert.ok(inspectPngHeader(rgb).errors.includes('not_single_rgba8_noninterlaced_png'));
});
test('frozen CORE confines every source pixel selection; synthetic fixtures never become artwork',()=>{
 const m=compositeMasks(plan),f=fixture(),r=run(f);
 assert.ok(m.core[18*W+15]===1);
 assert.equal(r.coreTechnicalReview.preservedAnchorPixels+m.core.reduce((a,b)=>a+b,0),W*H);
 const bad=Buffer.from(f.s);bad[at(10,18)]+=80;
 const p=run(f,{sourcePixels:bad,sourceBytes:png(bad),receipt:{...f.receipt,sourceSha256:sha256(png(bad))}});
 assert.ok(p.blockers.some(b=>b.startsWith('core:')));
});
test('real approved NW F1 and frozen core mask retain their published hashes',()=>{
 const approved=readFileSync(new URL('../../art/sprites/source-registry/rounded02-idle-frames-nw-03/base/frame01-anchor.png',import.meta.url));
 const mask=readFileSync(new URL('../../art/sprites/source-registry/rounded02-idle-frames-nw-03/motion-plan/COMPOSITE_MASK.bin',import.meta.url));
 assert.equal(createHash('sha256').update(approved).digest('hex'),'c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a');
 assert.equal(createHash('sha256').update(mask).digest('hex'),'278c2b87052885e70323c3cf6e2b403a993dec31ad5168b5fa85ab814e29a93d');
 assert.deepEqual(inspectPngHeader(approved).canvas,[1086,1448]);
 assert.equal(inspectPngHeader(approved).valid,true);
});
