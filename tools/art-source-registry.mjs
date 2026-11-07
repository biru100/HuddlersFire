// GitHub-first binary artwork intake. No image transforms, model calls, or approval changes.
// Run from the project root with explicit original PNG paths; git commit/push remain separate.
import {readFileSync,copyFileSync,mkdirSync,existsSync,lstatSync,constants} from 'node:fs';
import {resolve,relative,dirname,isAbsolute,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {validateFrameRegistry} from './lib/idle-contract.mjs';

export const ROOT=fileURLToPath(new URL('..',import.meta.url));
const SHA=/^[a-f0-9]{64}$/;
const SIGNATURE='89504e470d0a1a0a';
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=file=>JSON.parse(readFileSync(file,'utf8'));

function inside(root,name){
  if(typeof name!=='string'||!name.trim())throw Error('Missing path');
  const rootPath=resolve(root),target=resolve(rootPath,name),rel=relative(rootPath,target);
  if(rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||isAbsolute(rel))throw Error('Path escapes repository: '+name);
  return target;
}
function pngDetails(bytes){
  if(bytes.length<33||bytes.subarray(0,8).toString('hex')!==SIGNATURE||bytes.toString('ascii',12,16)!=='IHDR'||bytes.readUInt32BE(8)!==13)throw Error('Not an original PNG with a valid IHDR');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  if(width<1||height<1||width>16384||height>16384)throw Error('Invalid PNG dimensions');
  return {width,height};
}
function assertManifest(manifest,root,manifestPath){
  if(![1,2,3].includes(manifest.version)||!/^[-a-z0-9]+$/.test(manifest.setId??'')||
     !['design-lookdev','motion-concept','idle-frames'].includes(manifest.kind)||
     !['selected-lookdev','pending-motion-review'].includes(manifest.reviewState)||
     manifest.productionReady!==false||manifest.runtimeVerified!==false)throw Error('Invalid artwork registry contract');
  if((manifest.kind==='design-lookdev')!==(manifest.reviewState==='selected-lookdev'))throw Error('Selection state conflicts with artwork type');
  if(manifest.version===1){
    if(!Array.isArray(manifest.originals)||manifest.originals.length!==2||
       manifest.originals.map(x=>x.slot).join(',')!=='nw,se')throw Error('Expected exactly NW then SE originals');
  }else if(manifest.version===3){
    validateFrameRegistry(manifest);
  }else{
    if(manifest.kind!=='motion-concept'||manifest.artApproved!==false||manifest.animationApproved!==false||manifest.decision!=='pending'||
       !Number.isSafeInteger(manifest.revision)||manifest.revision<1)throw Error('Version 2 only stores pending motion revisions');
    if(!Array.isArray(manifest.originals)||!['nw','se','nw,se'].includes(manifest.originals.map(x=>x.slot).join(',')))throw Error('Expected one motion view or ordered NW,SE; no duplicates');
  }
  const base=relative(resolve(root),dirname(manifestPath)).replaceAll('\\','/');
  if(base!=='art/sprites/source-registry/'+manifest.setId)throw Error('Manifest must be in its own source-registry folder');
  if(manifest.reviewState==='selected-lookdev'){
    if(!manifest.approvalDocument)throw Error('Selected design requires a decision document');
    const approval=readFileSync(inside(root,manifest.approvalDocument),'utf8');
    for(const entry of manifest.originals)if(!approval.includes(entry.sha256))throw Error('Approval document does not reference source hash: '+entry.slot);
  }else if(manifest.approvalDocument)throw Error('Motion concept cannot inherit a design decision');
  for(const entry of manifest.version===3?[]:manifest.originals){
    const role=manifest.kind==='design-lookdev'?'approved':'idle-4cut-v'+(manifest.version===1?1:manifest.revision);
    if(!['nw','se'].includes(entry.slot)||entry.filename!==entry.slot+'-'+role+'.png'||
      entry.path!=='original/'+entry.filename||typeof entry.sourceFilename!=='string'||!entry.sourceFilename.endsWith('.png')||
      !SHA.test(entry.sha256)||!Number.isInteger(entry.bytes)||entry.bytes<33||
      !Array.isArray(entry.dimensions)||entry.dimensions.length!==2||entry.dimensions.some(n=>!Number.isInteger(n)||n<1))throw Error('Invalid original manifest entry: '+entry.slot);
  }
  const expected=manifest.originals.map(entry=>entry.sha256+'  '+entry.path).join('\n')+'\n';
  // Git/Windows may use CRLF in this text index; original PNG bytes remain exact.
  if(readFileSync(join(dirname(manifestPath),'SHA256SUMS.txt'),'utf8').replaceAll('\r\n','\n')!==expected)throw Error('Checksums file differs from manifest; do not edit either silently');
}
export function loadRegistry(manifestName,{root=ROOT}={}){
  const file=inside(root,manifestName),data=json(file);
  assertManifest(data,root,file);
  return {file,base:dirname(file),data};
}
function verifyBytes(bytes,entry){
  const digest=hash(bytes),details=pngDetails(bytes);
  if(digest!==entry.sha256||bytes.length!==entry.bytes||
     details.width!==entry.dimensions[0]||details.height!==entry.dimensions[1])
    throw Error('Original bytes/dimensions do not match manifest for '+entry.slot);
  return {slot:entry.slot,sha256:digest,bytes:bytes.length,dimensions:[details.width,details.height]};
}
export function ingestRegistry(manifestName,{root=ROOT,sources={}}={}){
  const {base,data}=loadRegistry(manifestName,{root});
  const slots=data.originals.map(x=>x.slot);
  if(Object.keys(sources).sort().join(',')!==slots.join(',')||slots.some(slot=>typeof sources[slot]!=='string'||!sources[slot].trim()))throw Error(data.version===1?'Provide both --nw and --se original PNG files':'Provide original PNG files for registered slots only: '+slots.join(','));
  const prepared=data.originals.map(entry=>{
    const source=resolve(sources[entry.slot]);
    if(!existsSync(source)||lstatSync(source).isSymbolicLink())throw Error('Source missing or symlink: '+entry.slot);
    const bytes=readFileSync(source);
    const proof=verifyBytes(bytes,entry);
    const target=inside(base,entry.path);
    if(existsSync(target)){
      if(lstatSync(target).isSymbolicLink())throw Error('Refusing symlink target');
      verifyBytes(readFileSync(target),entry);
    }
    return {entry,source,target,proof};
  });
  for(const item of prepared){
    const folder=dirname(item.target);
    if(existsSync(folder)&&lstatSync(folder).isSymbolicLink())throw Error('Refusing symlink folder');
    mkdirSync(folder,{recursive:true});
    if(!existsSync(item.target))copyFileSync(item.source,item.target,constants.COPYFILE_EXCL);
    verifyBytes(readFileSync(item.target),item.entry);
  }
  return {setId:data.setId,status:'local_originals_preserved_not_yet_github_verified',
    copied:prepared.map(x=>({path:relative(resolve(root),x.target).replaceAll('\\','/'),...x.proof})),
    next:'Commit, push, then verify the remote GitHub blob SHA256. No automatic user art or runtime approval.'};
}
export function verifyRegistry(manifestName,{root=ROOT}={}){
  const {base,data}=loadRegistry(manifestName,{root});
  const found=data.originals.map(entry=>{
    const target=inside(base,entry.path);
    if(!existsSync(target))throw Error('Original not present in local working tree: '+entry.path);
    if(lstatSync(target).isSymbolicLink())throw Error('Refusing symlink source: '+entry.slot);
    return {path:relative(resolve(root),target).replaceAll('\\','/'),...verifyBytes(readFileSync(target),entry)};
  });
  return {setId:data.setId,kind:data.kind,reviewState:data.reviewState,
    status:'validated_local_bytes_remote_push_not_proven',files:found,
    productionReady:false,runtimeVerified:false};
}
function option(args,key){
  const i=args.indexOf(key);if(i<0)return undefined;
  const value=args[i+1];if(!value||value.startsWith('--'))throw Error(key+' needs a value');return value;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [action,...args]=process.argv.slice(2);
  const manifest=option(args,'--manifest');
  if(!manifest)throw Error('Use --manifest art/sprites/source-registry/<set-id>/MANIFEST.json');
  let output;
  if(action==='ingest')output=ingestRegistry(manifest,{sources:Object.fromEntries(['nw','se','f1','f2','f3','f4'].map(slot=>[slot,option(args,'--'+slot)]).filter(([,value])=>value!==undefined))});
  else if(action==='verify')output=verifyRegistry(manifest);
  else throw Error('Usage: art-source-registry.mjs ingest|verify --manifest PATH [--nw ORIGINAL --se ORIGINAL | --f1 ANCHOR --f2 ORIGINAL --f3 ORIGINAL --f4 ORIGINAL]');
  process.stdout.write(JSON.stringify(output,null,2)+'\n');
}
