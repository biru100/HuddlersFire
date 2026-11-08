// Real PNG receipts are required; synthetic fixtures do not grant art approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {crc32,deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {inspectPng,inspectInbox,inspectCandidate} from '../art-handoff.mjs';
const SHA=b=>createHash('sha256').update(b).digest('hex');
function chunk(type,data=Buffer.alloc(0)){
  const len=Buffer.alloc(4),kind=Buffer.from(type),sum=Buffer.alloc(4);
  len.writeUInt32BE(data.length);sum.writeUInt32BE(crc32(Buffer.concat([kind,data]))>>>0);
  return Buffer.concat([len,kind,data,sum]);
}
function png(w=2,h=3,{rgba=true,filter=0}={}){
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=rgba?6:2;
  const bpp=rgba?4:3,scan=Buffer.alloc(h*(1+w*bpp));
  for(let y=0;y<h;y++){scan[y*(1+w*bpp)]=filter;for(let i=1;i<=w*bpp;i++)scan[y*(1+w*bpp)+i]=(y+i*3)%256;}
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(scan)),chunk('IEND')]);
}
function fixture(t,frame='f2'){
  const root=mkdtempSync(join(tmpdir(),'hf-chat-handoff-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const setId='rounded02-idle-frames-nw-03',attempt='attempt-001';
  const where=join(root,'art/sprites/incoming/chat-image-handoff',setId,frame,attempt);
  const jdir=join(root,'art/sprites/source-registry',setId);
  mkdirSync(where,{recursive:true});mkdirSync(join(jdir,'base'),{recursive:true});mkdirSync(join(jdir,'motion-plan'),{recursive:true});
  const img=png(),anchor=png(2,3),anchorSha=SHA(anchor);
  writeFileSync(join(where,'original.png'),img);
  writeFileSync(join(jdir,'base/frame01-anchor.png'),anchor);
  const job={kind:'anchor-idle-job',workflow:'anchor-frame-by-frame',setId,view:'nw',canvas:[2,3],anchorSha256:anchorSha,planSha256:'a'.repeat(64),intentSha256:'b'.repeat(64),reviewState:'pending-motion-review',decision:'pending'};
  writeFileSync(join(jdir,'job.json'),JSON.stringify(job));
  const manifest={originals:[{slot:'f1',sha256:anchorSha}],reviewState:'pending-motion-review'};
  writeFileSync(join(jdir,'MANIFEST.json'),JSON.stringify(manifest));
  const request={version:1,kind:'chatgpt-image-handoff',setId,frame,intent:({f2:'inhale',f3:'exhale',f4:'return'})[frame],anchorSha256:anchorSha,sourceReference:'Actual ChatGPT generation turn and URL, independently supplied',sourceModel:'unverified',sourceSha256:SHA(img)};
  writeFileSync(join(where,'request.json'),JSON.stringify(request));
  return {root,setId,frame,attempt,where,jdir,img,job,manifest,request};
}
function overwriteJSON(file,value){writeFileSync(file,JSON.stringify(value));}
test('missing inbox is empty, not completed',t=>{const root=mkdtempSync(join(tmpdir(),'hf-none-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const r=inspectInbox(root);assert.equal(r.checked,0);assert.equal(r.autoArtApproval,false);});
test('valid original PNG has exact RGBA provenance and awaits real plan confirmation',t=>{
  const f=fixture(t),r=inspectInbox(f.root);
  assert.equal(r.blocked,0);assert.equal(r.awaitingReview,1);assert.equal(r.candidates[0].status,'awaiting_plan_confirmation');
  assert.equal(r.candidates[0].source.sha256,SHA(f.img));assert.equal(r.candidates[0].productionReady,false);
});
test('matching confirmation permits technical intake but never grants motion approval',t=>{
  const f=fixture(t);
  overwriteJSON(join(f.jdir,'motion-plan/confirmation.json'),{actor:'chatgpt',anchorSha256:f.job.anchorSha256,planSha256:f.job.planSha256,intentSha256:f.job.intentSha256});
  const x=inspectInbox(f.root);assert.equal(x.readyForIntake,1);assert.equal(x.candidates[0].approval,'pending-motion-review');
});
test('wrong size blocks without converting bytes',t=>{
  const f=fixture(t),wrong=png(3,3);writeFileSync(join(f.where,'original.png'),wrong);
  const b=inspectInbox(f.root);assert.equal(b.blocked,1);assert.match(b.candidates[0].reason,/canvas_mismatch_no_resize/);assert.deepEqual(readFileSync(join(f.where,'original.png')),wrong);
});
test('corrupted PNG checksum is blocked',t=>{
  const f=fixture(t),bad=Buffer.from(f.img);bad[29]^=1;writeFileSync(join(f.where,'original.png'),bad);
  assert.match(inspectCandidate(f.root,f).reason,/checksum|CRC/i);
});
test('RGB, invalid filters and trailing bytes are refused',()=>{
  assert.throws(()=>inspectPng(png(2,3,{rgba:false})),/RGBA8/);
  assert.throws(()=>inspectPng(png(2,3,{filter:6})),/filter/);
  assert.throws(()=>inspectPng(Buffer.concat([png(),Buffer.from('extra')])),/end/);
});
test('missing origin reference and wrong source SHA block',t=>{
  const f=fixture(t);overwriteJSON(join(f.where,'request.json'),{...f.request,sourceReference:''});
  assert.match(inspectCandidate(f.root,f).reason,/source_reference_required/);
  overwriteJSON(join(f.where,'request.json'),{...f.request,sourceSha256:'0'.repeat(64)});
  assert.match(inspectCandidate(f.root,f).reason,/supplied_source_sha_mismatch/);
});
test('frame cannot precede earlier registered frames',t=>{
  const f=fixture(t,'f3');assert.match(inspectCandidate(f.root,f).reason,/f2_must_be_registered/);
});
test('already registered slot cannot be overwritten',t=>{
  const f=fixture(t);
  overwriteJSON(join(f.jdir,'MANIFEST.json'),{...f.manifest,originals:[...f.manifest.originals,{slot:'f2',sha256:SHA(f.img)}]});
  assert.match(inspectCandidate(f.root,f).reason,/already_registered/);
});
test('changed anchor bytes and wrong confirmation never become ready',t=>{
  const f=fixture(t);writeFileSync(join(f.jdir,'base/frame01-anchor.png'),png(3,3));
  assert.match(inspectCandidate(f.root,f).reason,/anchor_bytes_changed/);
  writeFileSync(join(f.jdir,'base/frame01-anchor.png'),png(2,3));
  overwriteJSON(join(f.jdir,'motion-plan/confirmation.json'),{actor:'chatgpt',anchorSha256:f.job.anchorSha256,planSha256:'0'.repeat(64),intentSha256:f.job.intentSha256});
  assert.match(inspectCandidate(f.root,f).reason,/confirmation_does_not_match/);
});
test('repository handoff never reads arbitrary traversal paths',t=>{
  const f=fixture(t);
  assert.throws(()=>inspectCandidate(f.root,{setId:'..',frame:'f2',attempt:'attempt-001'}),/identifier/);
  assert.throws(()=>inspectCandidate(f.root,{setId:f.setId,frame:'f2',attempt:'../../etc'}),/identifier/);
});
test('nonexistent target job is blocked rather than assuming another session has it',t=>{
  const f=fixture(t);rmSync(join(f.jdir,'job.json'));assert.match(inspectCandidate(f.root,f).reason,/target_job_not_on_this_branch/);
});
