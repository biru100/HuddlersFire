// Synthetic PNG fixtures validate binary provenance, never real artwork approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ingestRegistry,verifyRegistry,loadRegistry} from '../../tools/art-source-registry.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCWQAAAAASUVORK5CYII=','base64');
function fixture(t,{kind='design-lookdev',reviewState=kind==='design-lookdev'?'selected-lookdev':'pending-motion-review'}={}){
  const root=mkdtempSync(join(tmpdir(),'hf-github-ingest-'));
  t.after(()=>rmSync(root,{force:true,recursive:true}));
  const setId='test-assets';
  const dir=join(root,'art/sprites/source-registry',setId);
  mkdirSync(dir,{recursive:true});
  const raw=kind==='design-lookdev'?'approved':'idle-4cut-v1';
  const originals=['nw','se'].map(slot=>({
    slot,filename:slot+'-'+raw+'.png',path:'original/'+slot+'-'+raw+'.png',
    sourceFilename:slot+'-original.png',sha256:hash(png),bytes:png.length,dimensions:[1,1]
  }));
  const approvalDocument=kind==='design-lookdev'?'docs/reviews/test.md':null;
  if(approvalDocument){mkdirSync(join(root,'docs/reviews'),{recursive:true});writeFileSync(join(root,approvalDocument),'Synthetic approval fixture only '+hash(png)+'\n');}
  const manifest={version:1,setId,kind,reviewState,approvalDocument,
    generation:{surface:'chatgpt',observedModel:null},productionReady:false,runtimeVerified:false,originals};
  writeFileSync(join(dir,'MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
  writeFileSync(join(dir,'SHA256SUMS.txt'),originals.map(x=>x.sha256+'  '+x.path).join('\n')+'\n');
  const sources={nw:join(root,'north.png'),se:join(root,'south.png')};
  for(const p of Object.values(sources))writeFileSync(p,png);
  return {root,manifestFile:'art/sprites/source-registry/test-assets/MANIFEST.json',dir,sources};
}
test('registry accepts only exact NW/SE source bytes and never claims remote push',t=>{
  const f=fixture(t);
  assert.throws(()=>verifyRegistry(f.manifestFile,{root:f.root}),/not present/);
  const result=ingestRegistry(f.manifestFile,{root:f.root,sources:f.sources});
  assert.equal(result.status,'local_originals_preserved_not_yet_github_verified');
  assert.equal(result.copied.length,2);
  const checked=verifyRegistry(f.manifestFile,{root:f.root});
  assert.equal(checked.status,'validated_local_bytes_remote_push_not_proven');
  assert.equal(checked.reviewState,'selected-lookdev');
  assert.equal(checked.productionReady,false);
  assert.equal(checked.runtimeVerified,false);
  assert.deepEqual(readFileSync(join(f.dir,'original/nw-approved.png')),png);
  assert.deepEqual(readFileSync(join(f.dir,'original/se-approved.png')),png);
  assert.deepEqual(readFileSync(f.sources.nw),png);
  assert.equal(ingestRegistry(f.manifestFile,{root:f.root,sources:f.sources}).copied.length,2);
});
test('mismatched NW input blocks the entire intake before files are copied',t=>{
  const f=fixture(t);
  writeFileSync(f.sources.nw,Buffer.concat([png,Buffer.from('changed')]));
  assert.throws(()=>ingestRegistry(f.manifestFile,{root:f.root,sources:f.sources}),/do not match manifest/);
  assert.equal(existsSync(join(f.dir,'original/nw-approved.png')),false);
  assert.equal(existsSync(join(f.dir,'original/se-approved.png')),false);
});
test('a tampered existing original is rejected, never overwritten',t=>{
  const f=fixture(t);
  ingestRegistry(f.manifestFile,{root:f.root,sources:f.sources});
  writeFileSync(join(f.dir,'original/se-approved.png'),'changed');
  assert.throws(()=>ingestRegistry(f.manifestFile,{root:f.root,sources:f.sources}),/Not an original PNG/);
  assert.throws(()=>verifyRegistry(f.manifestFile,{root:f.root}),/Not an original PNG/);
});
test('checksum and user selection evidence cannot be fabricated by this intake',t=>{
  const f=fixture(t);
  const checksums=join(f.dir,'SHA256SUMS.txt');
  writeFileSync(checksums,'incorrect\n');
  assert.throws(()=>loadRegistry(f.manifestFile,{root:f.root}),/Checksums file differs/);
  writeFileSync(checksums,[hash(png)+'  original/nw-approved.png',hash(png)+'  original/se-approved.png',''].join('\n'));
  const approval=join(f.root,'docs/reviews/test.md');
  writeFileSync(approval,'no source hashes here\n');
  assert.throws(()=>loadRegistry(f.manifestFile,{root:f.root}),/Approval document does not reference/);
});
test('motion concept may be stored but never inherits lookdev approval',t=>{
  const f=fixture(t,{kind:'motion-concept'});
  const result=ingestRegistry(f.manifestFile,{root:f.root,sources:f.sources});
  assert.equal(result.copied.length,2);
  const checked=verifyRegistry(f.manifestFile,{root:f.root});
  assert.equal(checked.reviewState,'pending-motion-review');
  assert.equal(checked.productionReady,false);
  assert.equal(checked.runtimeVerified,false);
});
test('reject missing source path, unexpected slot and path traversal',t=>{
  const f=fixture(t);
  assert.throws(()=>ingestRegistry(f.manifestFile,{root:f.root,sources:{nw:f.sources.nw}}),/both --nw and --se/);
  assert.throws(()=>ingestRegistry(f.manifestFile,{root:f.root,sources:{nw:f.sources.nw,se:f.sources.se,other:f.sources.nw}}),/both --nw and --se/);
  assert.throws(()=>loadRegistry('../etc/passwd',{root:f.root}),/escapes repository/);
});

test('CRLF checksum index is accepted without weakening exact PNG hashes or checksum values',t=>{
  const f=fixture(t),path=join(f.dir,'SHA256SUMS.txt');
  const original=readFileSync(path,'utf8');
  writeFileSync(path,original.replaceAll('\n','\r\n'));
  assert.equal(loadRegistry(f.manifestFile,{root:f.root}).data.setId,'test-assets');
  assert.equal(ingestRegistry(f.manifestFile,{root:f.root,sources:f.sources}).copied.length,2);
  writeFileSync(path,original.replace(hash(png),'0'.repeat(64)).replaceAll('\n','\r\n'));
  assert.throws(()=>loadRegistry(f.manifestFile,{root:f.root}),/Checksums file differs/);
});

test('both tracked registry manifests load from a real checkout before PNG delivery',()=>{
  for(const set of ['rounded02-rev2-lookdev','rounded02-idle-motion-01']){
    const registry=loadRegistry('art/sprites/source-registry/'+set+'/MANIFEST.json');
    assert.equal(registry.data.setId,set);assert.equal(registry.data.originals.length,2);
  }
});
