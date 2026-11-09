// Chat-created image BATCH handoff. Verification only, no alteration, approval or publish.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,lstatSync} from 'node:fs';
import {join,resolve,dirname,relative,isAbsolute} from 'node:path';
import {inflateSync,crc32} from 'node:zlib';
import {fileURLToPath} from 'node:url';

export const ROOT=resolve(fileURLToPath(new URL('../',import.meta.url)));
export const INBOX='art/sprites/incoming/chat-asset-batches';
const SIG=Buffer.from('89504e470d0a1a0a','hex');
const ID=/^[a-z0-9][a-z0-9-]{1,79}$/;
const SHA=/^[0-9a-f]{64}$/;
const TYPES=new Set(['character','animation-sheet','animation-frame','background','prop','ui','costume','reference','other']);
const sha=b=>createHash('sha256').update(b).digest('hex');
const isPlain=o=>o&&typeof o==='object'&&!Array.isArray(o);
function pathIn(root,name){
  assert.ok(typeof name==='string'&&!name.includes('\\'),'invalid_path');
  const base=resolve(root),p=resolve(base,name),r=relative(base,p);
  assert.ok(r&&!r.startsWith('..')&&!isAbsolute(r),'path_outside_repo');
  let cursor=base;
  for(const segment of r.split('/')){cursor=join(cursor,segment);if(existsSync(cursor))assert.ok(!lstatSync(cursor).isSymbolicLink(),'symlinks_not_allowed');}
  return p;
}
export function inspectBatchPng(bytes){
  assert.ok(Buffer.isBuffer(bytes)&&bytes.length>=45&&bytes.length<=20*1024*1024,'invalid_png_size');
  assert.ok(bytes.subarray(0,8).equals(SIG),'not_png');
  let pos=8,ihdr=null,done=false,sawData=false,animation=false;
  const idats=[];
  while(pos<bytes.length){
    assert.ok(pos+12<=bytes.length,'truncated_chunk');
    const length=bytes.readUInt32BE(pos),type=bytes.toString('ascii',pos+4,pos+8),end=pos+length+12;
    assert.ok(length<=20*1024*1024&&end<=bytes.length,'invalid_chunk');
    assert.match(type,/^[a-zA-Z]{4}$/);
    assert.equal(crc32(bytes.subarray(pos+4,pos+8+length))>>>0,bytes.readUInt32BE(pos+8+length),'bad_crc');
    if(type==='IHDR'){
      assert.ok(!ihdr&&pos===8&&length===13,'bad_ihdr');
      const width=bytes.readUInt32BE(pos+8),height=bytes.readUInt32BE(pos+12);
      assert.ok(width>0&&height>0&&width*height<=16000000,'canvas_out_of_bounds');
      assert.ok(bytes[pos+16]===8&&[2,6].includes(bytes[pos+17])&&bytes[pos+18]===0&&bytes[pos+19]===0&&bytes[pos+20]===0,'unsupported_png_format');
      ihdr={width,height,color:bytes[pos+17]===6?'RGBA8':'RGB8'};
    }else if(type==='acTL')animation=true;
    else if(type==='IDAT'){assert.ok(ihdr&&!done,'bad_idat');sawData=true;idats.push(bytes.subarray(pos+8,pos+8+length));}
    else if(type==='IEND'){assert.ok(ihdr&&sawData&&length===0&&end===bytes.length,'bad_iend');done=true;}
    pos=end;
  }
  assert.ok(done&&!animation&&ihdr,'not_static_png');
  const channels=ihdr.color==='RGBA8'?4:3,scanline=1+ihdr.width*channels;
  const expected=scanline*ihdr.height;
  assert.ok(expected<=100*1024*1024,'too_many_raw_bytes');
  const raw=inflateSync(Buffer.concat(idats),{maxOutputLength:expected+1});
  assert.equal(raw.length,expected,'bad_scanline_length');
  for(let y=0;y<ihdr.height;y++)assert.ok(raw[y*scanline]<=4,'bad_scanline_filter');
  return {...ihdr,bytes:bytes.length,sha256:sha(bytes),static:true};
}
export function inspectBatch(root,batchId){
  const state={batchId,status:'blocked',published:false,artApproved:false,runtimeVerified:false,deployApproved:false};
  try{
    assert.ok(ID.test(batchId),'invalid_batch_id');
    const dir=INBOX+'/'+batchId,manifestPath=pathIn(root,dir+'/manifest.json');
    assert.ok(existsSync(manifestPath),'missing_manifest');
    const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
    assert.equal(manifest.version,1,'manifest_version');
    assert.equal(manifest.kind,'chat-asset-batch','manifest_kind');
    assert.equal(manifest.batchId,batchId,'manifest_batch');
    assert.equal(manifest.repository,'biru100/HuddlersFire','wrong_repo');
    assert.ok(typeof manifest.sourceReference==='string'&&manifest.sourceReference.trim().length>=10,'missing_chat_source_reference');
    assert.ok(typeof manifest.target==='string'&&manifest.target.trim().length>=3,'missing_target_description');
    assert.ok(Array.isArray(manifest.assets)&&manifest.assets.length>0&&manifest.assets.length<=24,'invalid_assets');
    assert.ok(!manifest.artApproved&&!manifest.productionReady&&!manifest.runtimeVerified,'approval_in_manifest_forbidden');
    const found=[],used=new Set();
    for(const a of manifest.assets){
      assert.ok(isPlain(a)&&ID.test(a.id)&&!used.has(a.id),'bad_asset_id');used.add(a.id);
      assert.ok(TYPES.has(a.type),'bad_asset_type');
      assert.ok(['reference','candidate'].includes(a.role),'bad_asset_role');
      assert.ok(a.file===('originals/'+a.id+'.png'),'bad_asset_path');
      assert.ok(a.sha256===null||SHA.test(a.sha256),'bad_asset_sha');
      assert.ok(typeof a.description==='string'&&a.description.trim(),'missing_asset_description');
      const path=pathIn(root,dir+'/'+a.file);
      assert.ok(existsSync(path),'missing_original:'+a.id);
      const proof=inspectBatchPng(readFileSync(path));
      if(a.sha256)assert.equal(proof.sha256,a.sha256,'source_sha_mismatch:'+a.id);
      found.push({id:a.id,type:a.type,role:a.role,path:dir+'/'+a.file,...proof});
    }
    const originalDir=pathIn(root,dir+'/originals');
    const names=readdirSync(originalDir).filter(f=>f.endsWith('.png')).sort();
    assert.deepEqual(names,manifest.assets.map(a=>a.id+'.png').sort(),'unlisted_png_in_batch');
    return {...state,status:'ready_for_work_review',sourceReference:manifest.sourceReference,sourceModel:manifest.observedModel??'unverified',target:manifest.target,assets:found,assetCount:found.length,next:'Work may make derived previews/transformations with provenance; approval and Sites deploy remain separate.'};
  }catch(e){return {...state,reason:String(e.message??e),next:'Preserve raw files. No auto-resize, no approval, no publish.'};}
}
export function inspectBatches(root=ROOT){
 const dir=pathIn(root,INBOX);if(!existsSync(dir))return {kind:'chat-asset-batches',checked:0,blocked:0,batches:[]};
 const entries=readdirSync(dir,{withFileTypes:true}),issues=[],batches=[];
 for(const e of entries){
   if(e.name==='README.md')continue;
   if(!e.isDirectory()||e.isSymbolicLink()||!ID.test(e.name)){issues.push({path:e.name,reason:'unexpected_entry'});continue;}
   assert.ok(batches.length<100,'too_many_batches');
   batches.push(inspectBatch(root,e.name));
 }
 return {kind:'chat-asset-batches',checked:batches.length,blocked:batches.filter(x=>x.status==='blocked').length+issues.length,batches,issues,autoImageGeneration:false,autoArtApproval:false,autoPublish:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.equal(process.argv[2],'inspect','Usage: node tools/chat-asset-batch.mjs inspect [outputs/chat-asset-batch-report.json]');
 const report=inspectBatches();
 const dest=process.argv[3]??'outputs/chat-asset-batch-report.json';
 assert.ok(/^outputs\/[a-zA-Z0-9/_-]+\.json$/.test(dest)&&!dest.includes('..'),'report_path_invalid');
 const p=pathIn(ROOT,dest);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 if(report.blocked)process.exitCode=1;
}
