// GitHub is the cross-session state. Read-only gates; never edits or approves artwork.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,lstatSync,realpathSync,mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {resolve,relative,dirname,isAbsolute,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const sha256=b=>createHash('sha256').update(b).digest('hex');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
function inside(base,p){
  assert.equal(typeof p,'string');const f=resolve(base,p),r=relative(resolve(base),f);
  assert.ok(r!==''&&!isAbsolute(r)&&r!=='..'&&!r.startsWith('../')&&!r.startsWith('..\\'),'Path outside registry');
  if(existsSync(f)){const real=relative(realpathSync(base),realpathSync(f));assert.ok(!isAbsolute(real)&&real!=='..'&&!real.startsWith('../')&&!real.startsWith('..\\'),'Symlink outside registry');assert.ok(!lstatSync(f).isSymbolicLink(),'Symlink not accepted');}return f;
}
export function inventory(base){
  const dir=join(base,'art/sprites/source-registry'),sets=[];
  if(!existsSync(dir))return {sets,filesVerified:0,acceptedMotionFrames:0,issues:[]};
  let filesVerified=0,acceptedMotionFrames=0;const issues=[];
  for(const item of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    if(!item.isDirectory())continue;const folder=join(dir,item.name),mf=join(folder,'MANIFEST.json');if(!existsSync(mf))continue;
    try{
      const m=read(mf);assert.ok(Array.isArray(m.originals),'originals array missing');const seen=new Set();
      for(const e of m.originals){
        assert.ok(!seen.has(e.path),'duplicate original path');seen.add(e.path);
        assert.match(e.sha256??'',/^[a-f0-9]{64}$/);const b=readFileSync(inside(folder,e.path));
        assert.equal(sha256(b),e.sha256,'original SHA256 mismatch');assert.equal(b.length,e.bytes,'original byte count mismatch');
        assert.ok(b.length>=33&&b.subarray(0,8).toString('hex')==='89504e470d0a1a0a','PNG required');
        assert.deepEqual([b.readUInt32BE(16),b.readUInt32BE(20)],e.dimensions,'PNG dimensions mismatch');filesVerified++;
        if(m.kind==='idle-frames'&&['f2','f3','f4'].includes(e.slot))acceptedMotionFrames++;
      }
      sets.push({setId:item.name,kind:m.kind,reviewState:m.reviewState,slots:m.originals.map(e=>e.slot),productionReady:m.productionReady===true,runtimeVerified:m.runtimeVerified===true});
    }catch(err){issues.push({setId:item.name,error:String(err.message)});}
  }
  return {sets,filesVerified,acceptedMotionFrames,issues};
}
export function configStatus(env){
  const required=['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID','CAMP_WORKER_NAME','CAMP_D1_DATABASE_ID','CAMP_PUBLIC_URL'];
  const missing=required.filter(k=>!env[k]?.trim()),invalid=[];
  if(env.CLOUDFLARE_ACCOUNT_ID&&!/^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID))invalid.push('CLOUDFLARE_ACCOUNT_ID');
  if(env.CAMP_WORKER_NAME&&!/^[a-z0-9][a-z0-9-]{0,62}$/.test(env.CAMP_WORKER_NAME))invalid.push('CAMP_WORKER_NAME');
  if(env.CAMP_D1_DATABASE_ID&&(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(env.CAMP_D1_DATABASE_ID)||['00000000-0000-4000-8000-000000000000','11111111-2222-4333-8444-555555555555'].includes(env.CAMP_D1_DATABASE_ID)))invalid.push('CAMP_D1_DATABASE_ID');
  if(env.CAMP_PUBLIC_URL){try{const u=new URL(env.CAMP_PUBLIC_URL);if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash||u.username||u.password||u.hostname==='localhost'||/^(127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname))invalid.push('CAMP_PUBLIC_URL');}catch{invalid.push('CAMP_PUBLIC_URL');}}
  const readinessConfirmed=env.CAMP_PRODUCTION_READY==='true',paused=env.CAMP_AUTO_DEPLOY==='false';
  return {ready:!missing.length&&!invalid.length&&readinessConfirmed&&!paused,missing,invalid,readinessConfirmed,paused};
}
export function validateRuntimeChanges(base,paths,approvals){
  const failures=[];
  for(const p of paths){
    if(!p.startsWith('web/public/')||! /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(p))continue;
    const absolute=inside(base,p),found=approvals.find(x=>x.path===p);
    if(!found||found.state!=='runtime-approved'||!found.userDecision?.quote?.trim()||!found.userDecision?.reference?.trim()){failures.push({path:p,reason:'missing_explicit_runtime_art_approval'});continue;}
    if(!existsSync(absolute)){failures.push({path:p,reason:'runtime_asset_deletion_requires_separate_review'});continue;}
    const hash=sha256(readFileSync(absolute));
    if(hash!==found.sha256||!found.approvalDocument){failures.push({path:p,reason:'approval_hash_or_document_missing'});continue;}
    const text=readFileSync(inside(base,found.approvalDocument),'utf8');
    if(!text.includes(hash)||!text.includes(found.userDecision.quote))failures.push({path:p,reason:'approval_document_does_not_match'});
  }return failures;
}
export function releaseGate(base){
  const policy=read(join(base,'docs/automation/POLICY.json'));
  assert.match(policy.runtimeArtBaseline,/^[a-f0-9]{40}$/);assert.equal(policy.repository,'biru100/HuddlersFire');
  const list=execFileSync('git',['diff','--name-only','-z','--no-renames',policy.runtimeArtBaseline,'HEAD','--','web/public'],{cwd:base,encoding:'utf8'}).split('\0').filter(Boolean);
  return validateRuntimeChanges(base,list,read(join(base,'docs/automation/RUNTIME_ART_APPROVALS.json')).assets);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const op=process.argv[2];let result;
  if(op==='config')result=configStatus(process.env);
  else if(op==='inspect'){const art=inventory(root),runtimeIssues=releaseGate(root);result={commit:process.env.GITHUB_SHA??null,...art,runtimeIssues,readyForCodeRelease:!art.issues.length&&!runtimeIssues.length,motionApprovalGranted:false};}
  else throw Error('Usage: node tools/autoflow.mjs inspect|config');
  const out=process.argv[3]??'outputs/autoflow-status.json';const target=resolve(root,out);assert.ok(relative(root,target).startsWith('outputs/'),'Reports must stay under outputs/');mkdirSync(dirname(target),{recursive:true});writeFileSync(target,JSON.stringify(result,null,2)+'\n');
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`ready=${Boolean(result.ready??result.readyForCodeRelease)}\n`);
  // Configuration values and credentials are deliberately never written to reports or logs.
  console.log(JSON.stringify(result,null,2));
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### HuddlersFire automation gate\n```json\n'+JSON.stringify(result,null,2)+'\n```\n');
  if(op==='inspect'&&!result.readyForCodeRelease)process.exitCode=1;
  if(op==='config'&&!result.ready)process.exitCode=1;
}
