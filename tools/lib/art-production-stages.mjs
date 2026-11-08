// Stage boundaries for original art, pixel masters, and anchored frame candidates.
// Pure validation only. No model calls, image generation, transforms, or approvals.
import {createHash} from 'node:crypto';
import {inspectCompositeSource} from './idle-composite.mjs';

export const ACTIVE_NW_CORE03='art/sprites/source-registry/rounded02-idle-frames-nw-03/job.json';
export const ART_STAGES=Object.freeze(['generation','pixel-master','frame-edit','core-composite','motion-review','native-delivery']);
export const ART_PENDING=Object.freeze({decision:'pending',artApproved:false,animationApproved:false,productionReady:false,runtimeVerified:false});
const hex=/^[a-f0-9]{64}$/;
export const sha256=data=>createHash('sha256').update(data).digest('hex');

export function inspectPngHeader(bytes){
  const errors=[], signature=Buffer.from('89504e470d0a1a0a','hex');
  if(!Buffer.isBuffer(bytes)||bytes.length<33||!bytes.subarray(0,8).equals(signature))return {valid:false,errors:['invalid_png_signature']};
  if(bytes.readUInt32BE(8)!==13||bytes.toString('ascii',12,16)!=='IHDR')return {valid:false,errors:['invalid_png_ihdr']};
  const canvas=[bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
  const bitDepth=bytes[24],colorType=bytes[25],compression=bytes[26],filter=bytes[27],interlace=bytes[28];
  if(canvas.some(n=>!n||n>16384))errors.push('invalid_canvas');
  if(bitDepth!==8||colorType!==6||compression!==0||filter!==0||interlace!==0)errors.push('not_single_rgba8_noninterlaced_png');
  return {valid:errors.length===0,canvas,bitDepth,colorType,interlace,errors};
}
export function colorProfileHash(bytes){
  let offset=8;const chunks=[],profile=new Set(['cHRM','gAMA','iCCP','sRGB']);
  if(!Buffer.isBuffer(bytes)||bytes.length<33)throw Error('Invalid PNG bytes');
  while(offset+12<=bytes.length){
    const length=bytes.readUInt32BE(offset),end=offset+12+length;
    if(end>bytes.length)throw Error('Truncated PNG chunk');
    const type=bytes.toString('ascii',offset+4,offset+8);
    if(profile.has(type))chunks.push(bytes.subarray(offset,end));
    offset=end;
    if(type==='IEND')break;
  }
  return sha256(Buffer.concat(chunks));
}
export function evaluateConceptSource({sourceBytes,sourceReference,toolOrEditor}){
  const validBytes=Buffer.isBuffer(sourceBytes)&&sourceBytes.length>0;
  const blockers=[];
  if(!validBytes)blockers.push('missing_original_file_bytes');
  if(!sourceReference?.trim()||!toolOrEditor?.trim())blockers.push('missing_generation_provenance');
  return {stage:'generation',technicalStatus:blockers.length?'blocked':'reference_only',
    sourceSha256:validBytes?sha256(sourceBytes):null,sourceBytes:validBytes?sourceBytes.length:0,
    sourceReference:sourceReference??null,toolOrEditor:toolOrEditor??null,blockers,
    canBeUsedAsFrame:false,canBeUsedAsPixelMaster:false,
    operations:['read-only-source-hash'],observedModel:'unverified',...ART_PENDING};
}
export function evaluatePixelMaster({sourceBytes,expectedSha256,canvas}){
  const header=inspectPngHeader(sourceBytes),actualSha256=sha256(sourceBytes),blockers=[...header.errors];
  if(!Array.isArray(canvas)||canvas.length!==2||header.canvas?.join(',')!==canvas.join(','))blockers.push('canvas_mismatch');
  if(!hex.test(expectedSha256||'')||actualSha256!==expectedSha256)blockers.push('pixel_master_sha_mismatch');
  return {stage:'pixel-master',technicalStatus:blockers.length?'blocked':'source_header_verified_needs_decode_and_art_review',
    canvas:header.canvas??null,expectedCanvas:canvas,sourceSha256:actualSha256,expectedSha256,blockers,
    operations:['read-only-png-header-and-sha'],pixelMasterApproved:false,...ART_PENDING};
}
export function validateFrameReceipt(receipt,{job,frame,sourceSha256}){
  const blockers=[];
  if(!receipt||typeof receipt!=='object')return ['missing_actual_frame_edit_receipt'];
  if(receipt.version!==1||receipt.stage!=='frame-edit')blockers.push('wrong_stage');
  if(!['f2','f3','f4'].includes(frame)||receipt.frame!==frame)blockers.push('wrong_frame');
  if(!['manual-pixel-edit','masked-inpaint'].includes(receipt.technique))blockers.push('wrong_edit_technique');
  if(receipt.inputKind!=='actual-approved-f1-png')blockers.push('missing_actual_f1_input_attestation');
  if(receipt.inputSha256!==job.anchorSha256||receipt.pixelMasterSha256!==job.anchorSha256)blockers.push('wrong_input_master');
  if(receipt.sourceSha256!==sourceSha256||!hex.test(receipt.sourceSha256||''))blockers.push('source_hash_mismatch');
  if(!receipt.sourceReference?.trim()||!receipt.editorOrTool?.trim())blockers.push('missing_provenance');
  if(receipt.planSha256!==job.planSha256||receipt.maskSha256!==job.composition?.maskSha256)blockers.push('plan_or_mask_mismatch');
  if(!Array.isArray(receipt.canvas)||receipt.canvas.join(',')!==job.canvas.join(','))blockers.push('receipt_canvas_mismatch');
  if(receipt.operations?.length!==1||receipt.operations[0]!==receipt.technique)blockers.push('unapproved_operations');
  if(receipt.resized===true||receipt.cropped===true||receipt.flipped===true||receipt.recolored===true||receipt.alphaConverted===true||receipt.quantized===true)blockers.push('prohibited_transformation');
  if(receipt.artApproved===true||receipt.animationApproved===true||receipt.productionReady===true||receipt.runtimeVerified===true)blockers.push('receipt_cannot_grant_approval');
  return blockers;
}
export function evaluateFrameCandidate({job,plan,frame,sourceBytes,anchorBytes,sourcePixels,anchorPixels,receipt}){
  const source=inspectPngHeader(sourceBytes),anchor=inspectPngHeader(anchorBytes),sourceSha256=sha256(sourceBytes);
  const blockers=[...source.errors.map(e=>'source:'+e),...anchor.errors.map(e=>'anchor:'+e),
    ...validateFrameReceipt(receipt,{job,frame,sourceSha256})];
  if(source.canvas?.join(',')!==job.canvas.join(',')||anchor.canvas?.join(',')!==job.canvas.join(','))blockers.push('canvas_mismatch');
  if(sha256(anchorBytes)!==job.anchorSha256)blockers.push('anchor_sha_mismatch');
  if(source.valid&&anchor.valid){
    try{if(colorProfileHash(sourceBytes)!==colorProfileHash(anchorBytes))blockers.push('png_color_profile_chunks_differ');}
    catch{blockers.push('png_chunk_structure_invalid');}
  }
  let core=null;
  if(!blockers.length){
    if(sourcePixels?.length!==job.canvas[0]*job.canvas[1]*4||anchorPixels?.length!==sourcePixels?.length){
      blockers.push('rgba_decode_mismatch');
    }else{
      core=inspectCompositeSource(anchorPixels,sourcePixels,plan).report;
      blockers.push(...core.blockers.map(b=>'core:'+b));
      const outside=core.sourceOutsideMask.rawChangedPixels;
      const total=job.canvas[0]*job.canvas[1]-core.selectedPixels;
      const fraction=outside/Math.max(1,total);
      // Manual editing must be limited to CORE; masked inpainting may have small
      // outside differences, but a wholesale character redraw is never laundered by a mask.
      const limit=receipt.technique==='manual-pixel-edit'?0:0.01;
      if(fraction>limit)blockers.push('raw_source_excessive_outside_drift');
      core.rawOutsideFraction=fraction;
      core.rawOutsideMaximumFraction=limit;
    }
  }
  return {stage:'frame-edit',frame,technicalStatus:blockers.length?'blocked':'ready_for_explicit_technical_intake',
    blockers,sourceSha256,anchorSha256:job.anchorSha256,maskSha256:job.composition?.maskSha256??null,
    sourceCanvas:source.canvas??null,expectedCanvas:job.canvas,sourceOutsideChanges:core?.sourceOutsideMask?.rawChangedPixels??null,
    coreTechnicalReview:core,
    provenance:'input method self-attested by editor; matching hashes verify files, not historical model behavior',
    operations:['read-only-source-and-anchor-assessment'],artisticQuality:'unreviewed',...ART_PENDING};
}
export function stageOverview({job,manifest,confirmed}){
  const received=manifest.originals.filter(e=>e.slot!=='f1').map(e=>e.slot),missing=['f2','f3','f4'].filter(id=>!received.includes(id));
  return {pipelineVersion:1,track:'approved-master-to-frames',setId:job.setId,view:job.view,
    stages:[
      {stage:'generation',status:'skipped_existing_approved_lookdev',role:'concept reference only for new assets'},
      {stage:'pixel-master',status:'reuse_exact_approved_f1',sha256:job.anchorSha256,canvas:job.canvas},
      {stage:'frame-edit',status:missing.length?'pending_real_frame_source':'original_sources_received',received,missing,nextFrame:missing[0]??null},
      {stage:'core-composite',status:'requires_valid_frame_intake_and_seam_checks'},
      {stage:'motion-review',status:'pending_user_motion_selection'},
      {stage:'native-delivery',status:'not_authorized'}],
    planConfirmed:confirmed,immutability:{anchorSha256:job.anchorSha256,planSha256:job.planSha256,maskSha256:job.composition?.maskSha256},
    ...ART_PENDING};
}
