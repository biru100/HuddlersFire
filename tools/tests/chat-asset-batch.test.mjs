// Synthetic binary fixtures, not ChatGPT-generated game artwork.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {crc32,deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {inspectBatchPng,inspectBatch,inspectBatches} from '../chat-asset-batch.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function chunk(name,data=Buffer.alloc(0)){const size=Buffer.alloc(4),tag=Buffer.from(name),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([tag,data]))>>>0);return Buffer.concat([size,tag,data,crc]);}
function png(w=6,h=6,color=6){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=color;const nch=color===6?4:3;const raw=Buffer.alloc(h*(1+w*nch));for(let y=0;y<h;y++)raw[y*(1+w*nch)]=0;return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND')]);}
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'hf-batch-')),batchId='idle-concepts-001';
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 const base=join(root,'art/sprites/incoming/chat-asset-batches',batchId);
 mkdirSync(join(base,'originals'),{recursive:true});
 const a=png(6,8,6),b=png(6,8,2);
 writeFileSync(join(base,'originals/idle-sheet.png'),a);
 writeFileSync(join(base,'originals/background.png'),b);
 const manifest={version:1,kind:'chat-asset-batch',repository:'biru100/HuddlersFire',batchId,
  sourceReference:'verified Chat message reference in the actual production record',
  observedModel:'unverified',target:'Camp animation and background lookdev only',
  artApproved:false,productionReady:false,runtimeVerified:false,
  assets:[{id:'idle-sheet',file:'originals/idle-sheet.png',type:'animation-sheet',role:'reference',description:'2x2 idle breathing exploration',sha256:sha(a)},
          {id:'background',file:'originals/background.png',type:'background',role:'candidate',description:'Camp background candidate',sha256:sha(b)}]};
 writeFileSync(join(base,'manifest.json'),JSON.stringify(manifest,null,2));
 return {root,batchId,base,manifest,a,b};
}
test('single manifest can receive a multi-frame sheet and background as unchanged files',t=>{
 const f=fixture(t),result=inspectBatches(f.root);assert.equal(result.checked,1);assert.equal(result.blocked,0);
 assert.equal(result.batches[0].status,'ready_for_work_review');assert.equal(result.batches[0].assets.length,2);
 assert.equal(result.batches[0].assets[0].color,'RGBA8');assert.equal(result.batches[0].assets[1].color,'RGB8');
 assert.equal(result.batches[0].published,false);assert.equal(result.batches[0].artApproved,false);
 assert.deepEqual(readFileSync(join(f.base,'originals/idle-sheet.png')),f.a);
});
test('do not impose CORE03 1086x1448 dimensions on a generated lookdev sheet',()=>{
 const result=inspectBatchPng(png(12,10,6));assert.equal(result.width,12);assert.equal(result.height,10);
});
test('a missing original blocks even if metadata exists',t=>{
 const f=fixture(t);f.manifest.assets[0].file='originals/missing.png';
 writeFileSync(join(f.base,'manifest.json'),JSON.stringify(f.manifest));
 assert.match(inspectBatch(f.root,f.batchId).reason,/bad_asset_path/);
});
test('sha mismatch cannot be fixed by resizing or metadata alone',t=>{
 const f=fixture(t);f.manifest.assets[0].sha256='f'.repeat(64);
 writeFileSync(join(f.base,'manifest.json'),JSON.stringify(f.manifest));
 assert.match(inspectBatch(f.root,f.batchId).reason,/source_sha_mismatch/);
});
test('truncated and CRC-corrupted original PNG cannot be read as valid',()=>{
 const good=png(),bad=Buffer.from(good);bad[29]^=1;assert.throws(()=>inspectBatchPng(bad),/bad_crc/);
 assert.throws(()=>inspectBatchPng(good.subarray(0,good.length-2)));
});
test('report cannot be approved merely by setting manifest approval',t=>{
 const f=fixture(t);f.manifest.artApproved=true;
 writeFileSync(join(f.base,'manifest.json'),JSON.stringify(f.manifest));
 assert.match(inspectBatch(f.root,f.batchId).reason,/approval_in_manifest_forbidden/);
});
test('reject unlisted original binaries so Work sees all actual source assets',t=>{
 const f=fixture(t);writeFileSync(join(f.base,'originals/sneaky.png'),png());
 assert.match(inspectBatch(f.root,f.batchId).reason,/unlisted_png_in_batch/);
});
test('reject malicious identifier, traversal, and symlink-like content path',t=>{
 const f=fixture(t);
 f.manifest.assets[0].id='../escape';
 writeFileSync(join(f.base,'manifest.json'),JSON.stringify(f.manifest));
 assert.match(inspectBatch(f.root,f.batchId).reason,/bad_asset_id/);
});
