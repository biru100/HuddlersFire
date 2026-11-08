// Zero-API-cost Chat/Work image handoff preflight. READ ONLY. Never repairs PNGs or grants approval.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,lstatSync} from 'node:fs';
import {resolve,relative,join,dirname,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {crc32,inflateSync} from 'node:zlib';

export const ROOT=resolve(fileURLToPath(new URL('../',import.meta.url)));
const SIG=Buffer.from('89504e470d0a1a0a','hex');
const SHA=/^[0-9a-f]{64}$/;
const SET=/^[a-z][a-z0-9-]{2,79}$/;
const ATTEMPT=/^[a-z0-9][a-z0-9-]{1,79}$/;
const EXPECT={f2:'inhale',f3:'exhale',f4:'return'};
const LIMIT=16*1024*1024;
const sha=b=>createHash('sha256').update(b).digest('hex');
function readJSON(f){return JSON.parse(readFileSync(f,'utf8'));}
function checked(root,p){
  assert.ok(typeof p==='string'&&p&&!p.includes('\\'),'Invalid path');
  const base=resolve(root),file=resolve(base,p),r=relative(base,file);
  assert.ok(r&&r!=='..'&&!r.startsWith('../')&&!r.startsWith('..\\')&&!isAbsolute(r),'Path escapes checkout');
  let current=base;
  for(const part of r.split(/[\\/]/)){current=join(current,part);if(existsSync(current))assert.ok(!lstatSync(current).isSymbolicLink(),'Symlink not allowed');}
  return file;
}
export function inspectPng(bytes){
  assert.ok(Buffer.isBuffer(bytes)&&bytes.length>=45&&bytes.length<=LIMIT,'Invalid PNG byte count');
  assert.ok(bytes.subarray(0,8).equals(SIG),'Not a PNG');
  let pos=8,ihdr=null,idats=[],ended=false,seenIDAT=false;
  while(pos<bytes.length){
    assert.ok(pos+12<=bytes.length,'Truncated PNG chunk');
    const len=bytes.readUInt32BE(pos),type=bytes.toString('ascii',pos+4,pos+8),end=pos+12+len;
    assert.ok(len<=LIMIT&&end<=bytes.length,'Invalid PNG chunk length');
    assert.match(type,/^[A-Za-z]{4}$/,'Invalid PNG chunk type');
    const actual=crc32(bytes.subarray(pos+4,pos+8+len))>>>0;
    assert.equal(actual,bytes.readUInt32BE(pos+8+len),'PNG chunk checksum mismatch');
    if(type==='IHDR'){
      assert.ok(!ihdr&&pos===8&&len===13,'Invalid IHDR');
      const w=bytes.readUInt32BE(pos+8),h=bytes.readUInt32BE(pos+12);
      assert.ok(w>=1&&h>=1&&w*h<=16000000,'PNG dimensions exceed limit');
      assert.ok(bytes[pos+16]===8&&bytes[pos+17]===6&&bytes[pos+18]===0&&bytes[pos+19]===0&&bytes[pos+20]===0,'Only RGBA8 noninterlaced PNG is accepted');
      ihdr={width:w,height:h,mode:'RGBA8'};
    }else if(type==='IDAT'){
      assert.ok(ihdr&&!ended,'IDAT in unexpected position');seenIDAT=true;idats.push(bytes.subarray(pos+8,pos+8+len));
    }else if(type==='IEND'){
      assert.ok(len===0&&ihdr&&seenIDAT&&end===bytes.length,'Invalid PNG end');
      ended=true;
    }
    pos=end;
    if(ended)break;
  }
  assert.ok(ended&&ihdr,'Incomplete PNG');
  const expected=ihdr.height*(1+ihdr.width*4);
  assert.ok(expected<=80*1024*1024,'Decoded PNG too large');
  const pixels=inflateSync(Buffer.concat(idats),{maxOutputLength:expected+1});
  assert.equal(pixels.length,expected,'Invalid PNG scanline length');
  for(let y=0;y<ihdr.height;y++)assert.ok(pixels[y*(1+ihdr.width*4)]<=4,'Invalid PNG filter');
  return {...ihdr,bytes:bytes.length,sha256:sha(bytes)};
}
export function inspectCandidate(root,{setId,frame,attempt}){
  assert.ok(SET.test(setId)&&EXPECT[frame]&&ATTEMPT.test(attempt),'Unsupported handoff identifier');
  const key=setId+'/'+frame+'/'+attempt;
  const directory='art/sprites/incoming/chat-image-handoff/'+key;
  const original=checked(root,directory+'/original.png'),receipt=checked(root,directory+'/request.json');
  const jobPath=checked(root,'art/sprites/source-registry/'+setId+'/job.json');
  const state={id:key,status:'blocked',approval:'pending-motion-review',productionReady:false,runtimeVerified:false};
  try{
    assert.ok(existsSync(original),'missing_original_png');
    assert.ok(existsSync(receipt),'missing_request_json');
    const req=readJSON(receipt);
    assert.equal(req.version,1,'request_version_mismatch');
    assert.equal(req.kind,'chatgpt-image-handoff','request_kind_mismatch');
    assert.equal(req.setId,setId,'request_set_id_mismatch');
    assert.equal(req.frame,frame,'request_frame_mismatch');
    assert.equal(req.intent,EXPECT[frame],'request_intent_mismatch');
    assert.ok(typeof req.sourceReference==='string'&&req.sourceReference.trim().length>=12,'source_reference_required');
    assert.ok(!req.sourceReference.includes('\n'),'source_reference_must_be_one_line');
    assert.ok(existsSync(jobPath),'target_job_not_on_this_branch');
    const job=readJSON(jobPath);
    assert.equal(job.setId,setId,'target_job_mismatch');
    assert.equal(job.kind,'anchor-idle-job','target_kind_mismatch');
    assert.equal(job.workflow,'anchor-frame-by-frame','target_workflow_mismatch');
    assert.equal(job.reviewState,'pending-motion-review','target_motion_status_mismatch');
    assert.ok(Array.isArray(job.canvas)&&job.canvas.length===2,'target_canvas_missing');
    assert.ok(SHA.test(job.anchorSha256),'target_anchor_missing');
    assert.equal(req.anchorSha256,job.anchorSha256,'anchor_sha_mismatch');
    const anchor=checked(root,'art/sprites/source-registry/'+setId+'/base/frame01-anchor.png');
    assert.ok(existsSync(anchor),'anchor_file_missing');
    assert.equal(sha(readFileSync(anchor)),job.anchorSha256,'anchor_bytes_changed');
    const manifestPath=checked(root,'art/sprites/source-registry/'+setId+'/MANIFEST.json');
    assert.ok(existsSync(manifestPath),'target_manifest_missing');
    const manifest=readJSON(manifestPath);
    assert.ok(Array.isArray(manifest.originals),'target_manifest_invalid');
    assert.equal(manifest.originals.find(x=>x.slot==='f1')?.sha256,job.anchorSha256,'f1_manifest_mismatch');
    assert.ok(!manifest.originals.some(x=>x.slot===frame),'target_frame_already_registered');
    if(frame==='f3')assert.ok(manifest.originals.some(x=>x.slot==='f2'),'f2_must_be_registered_first');
    if(frame==='f4')assert.ok(manifest.originals.some(x=>x.slot==='f2')&&manifest.originals.some(x=>x.slot==='f3'),'earlier_frames_must_be_registered_first');
    const png=inspectPng(readFileSync(original));
    assert.deepEqual([png.width,png.height],job.canvas,'canvas_mismatch_no_resize');
    if(req.sourceSha256!=null)assert.equal(req.sourceSha256,png.sha256,'supplied_source_sha_mismatch');
    const confirmation=checked(root,'art/sprites/source-registry/'+setId+'/motion-plan/confirmation.json');
    let planConfirmed=false;
    if(existsSync(confirmation)){
      const conf=readJSON(confirmation);
      planConfirmed=conf.actor==='chatgpt'&&conf.anchorSha256===job.anchorSha256&&conf.planSha256===job.planSha256&&conf.intentSha256===job.intentSha256;
      assert.ok(planConfirmed,'confirmation_does_not_match_current_plan');
    }
    return {...state,status:planConfirmed?'ready_for_explicit_intake':'awaiting_plan_confirmation',source:{sha256:png.sha256,bytes:png.bytes,dimensions:[png.width,png.height],mode:png.mode},planConfirmed,requestedFrame:frame,sourceModel:req.sourceModel??'unverified',next:planConfirmed?'Work may run the existing immutable intake; do not approve motion':'Seek actual plan confirmation before intake; keep source unchanged'};
  }catch(error){
    return {...state,reason:String(error.message??error),next:'Preserve the PNG unchanged and record the reason. Do not resize, crop, convert or mark approved.'};
  }
}
export function inspectInbox(root=ROOT){
  const base=checked(root,'art/sprites/incoming/chat-image-handoff'),candidates=[],issues=[];
  if(!existsSync(base))return {schema:1,kind:'chatgpt-github-handoff',checked:0,blocked:0,awaitingReview:0,readyForIntake:0,candidates,issues,autoArtApproval:false};
  for(const s of readdirSync(base,{withFileTypes:true})){
    if(s.name==='README.md')continue;
    if(!s.isDirectory()||s.isSymbolicLink()){issues.push({path:s.name,reason:'unexpected_entry'});continue;}
    if(!SET.test(s.name)){issues.push({path:s.name,reason:'invalid_set_id'});continue;}
    for(const f of readdirSync(join(base,s.name),{withFileTypes:true})){
      if(!f.isDirectory()||!EXPECT[f.name]){issues.push({path:s.name+'/'+f.name,reason:'invalid_frame_folder'});continue;}
      for(const a of readdirSync(join(base,s.name,f.name),{withFileTypes:true})){
        if(!a.isDirectory()||!ATTEMPT.test(a.name)){issues.push({path:s.name+'/'+f.name+'/'+a.name,reason:'invalid_attempt_folder'});continue;}
        assert.ok(candidates.length<200,'Too many handoff candidates');
        candidates.push(inspectCandidate(root,{setId:s.name,frame:f.name,attempt:a.name}));
      }
    }
  }
  return {schema:1,kind:'chatgpt-github-handoff',checked:candidates.length,blocked:candidates.filter(x=>x.status==='blocked').length+issues.length,awaitingReview:candidates.filter(x=>x.status==='awaiting_plan_confirmation').length,readyForIntake:candidates.filter(x=>x.status==='ready_for_explicit_intake').length,candidates,issues,autoArtApproval:false,autoImageGeneration:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert.equal(process.argv[2],'inspect','Usage: node tools/art-handoff.mjs inspect [outputs/handoff-report.json]');
  const report=inspectInbox();
  const output=process.argv[3]??'outputs/art-handoff-report.json';
  assert.ok(/^outputs\/[a-zA-Z0-9/_-]+\.json$/.test(output)&&!output.includes('..'),'Report must live in outputs/');
  mkdirSync(dirname(checked(ROOT,output)),{recursive:true});
  writeFileSync(checked(ROOT,output),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(process.env.GITHUB_STEP_SUMMARY){
    const {appendFileSync}=await import('node:fs');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### ChatGPT image handoff (no API key)\n\nInspected '+report.checked+', blocked '+report.blocked+', awaiting plan '+report.awaitingReview+', ready for technical intake '+report.readyForIntake+'. This is not motion approval.\n');
  }
  if(report.blocked)process.exitCode=1;
}
