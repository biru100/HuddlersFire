import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadImage} from '@napi-rs/canvas';
import {inside,readJSON} from '../../tools/lib/sprite-spec.mjs';
import {CAMPER_SOLES} from '../lib/camp-camper-art.mjs';
import {CAMPER_PART_FILES} from '../lib/camp-camper-part-files.mjs';
import {compileCamperBase} from './build-camper-art.mjs';
import {camperAtlasIds,compileCamperParts,headRecipe} from './build-shared-camper-head.mjs';
import {inspectCamperAtlases} from './camper-consistency.mjs';
import {verifySubcultureCamper} from './compile-subculture-camper.mjs';
import {camperBrief,camperDraftInputs,camperInputNames,camperJobPath,contractDigest,currentCamperInputs,digest,
  objectDigest,readCamperInputs} from './camper-harness-inputs.mjs';

const web=fileURLToPath(new URL('../',import.meta.url));
const json=value=>JSON.stringify(value,null,2)+'\n';
const inputFilename='inputs.json';

function writeReceipt(dir,name,receipt){
  const temp=mkdtempSync(join(dir,'.receipt-'));
  try{
    const path=inside(temp,name);
    writeFileSync(path,json(receipt));
    renameSync(path,inside(dir,name));
  }finally{rmSync(temp,{recursive:true,force:true});}
}

function prepare(job,fromCurrent){
  const dir=camperJobPath(job);
  mkdirSync(dirname(dir),{recursive:true});
  mkdirSync(dir);
  const receipt=fromCurrent?currentCamperInputs():camperDraftInputs();
  const names=camperInputNames(receipt.version);
  for(const name of names)mkdirSync(dirname(inside(dir,'input/'+name)),{recursive:true});
  writeFileSync(inside(dir,inputFilename),json(receipt));
  writeFileSync(inside(dir,'brief.md'),camperBrief(receipt.version));
  console.log(`${dir}: ${names.length} expected PNGs. ${fromCurrent?'Using registered current masters.':'Add originals and register them.'}`);
}

async function register(dir){
  const receipt=readJSON(inside(dir,inputFilename));
  if(receipt.source!=='job')throw Error('This job references the registered current masters');
  const {hashes,readInput}=readCamperInputs(receipt,dir,{record:true});
  for(const name of Object.keys(hashes)){
    try{await loadImage(readInput(name));}
    catch(error){throw Error('Unreadable PNG '+name,{cause:error});}
  }
  writeReceipt(dir,inputFilename,{...receipt,files:hashes});
  console.log(`Registered ${Object.keys(hashes).length} originals in ${dir}`);
}

async function compile(receipt,dir){
  const {calibration,hashes,readInput}=readCamperInputs(receipt,dir);
  const bodyOnly=receipt.version===2;
  const {buffers,contacts,count}=await compileCamperBase(readInput,calibration,{targetSoles:CAMPER_SOLES});
  const {outputs,manifest}=await compileCamperParts(buffers,readInput,headRecipe,{bodyOnly});
  const finalBodies=await inspectCamperAtlases(camperAtlasIds.map(id=>outputs[manifest.files[id].url.split('/').at(-1)]),
    contacts,{modular:true,bodyOnly});
  if(finalBodies.violations.length)throw Error('Final camper body or collar failed: '+JSON.stringify(finalBodies.violations.slice(0,35)));
  const payload={version:receipt.version,contract:contractDigest(receipt.version),inputs:objectDigest(receipt),sources:hashes,
    intermediate:manifest.sources,files:manifest.files};
  console.log(`${count} normalized layers and ${finalBodies.results.length} final body/neck layers checked`);
  return {outputs,manifest:{...payload,id:objectDigest(payload)},parts:manifest};
}

function verifyCandidate(dir,{manifest,outputs}){
  const receipt=readJSON(inside(dir,'manifest.json'));
  if(objectDigest(receipt)!==objectDigest(manifest))throw Error('Stale camper candidate; build it again');
  const saved=inside(dir,'candidates/'+manifest.id);
  for(const [name,bytes] of Object.entries(outputs)){
    if(!readFileSync(inside(saved,name)).equals(bytes))throw Error('Changed or non-reproducible camper atlas '+name);
  }
}

function saveCandidate(dir,result){
  const {manifest,outputs}=result;
  const parent=inside(dir,'candidates');
  mkdirSync(parent,{recursive:true});
  const dest=inside(parent,manifest.id);
  if(!existsSync(dest)){
    const stage=mkdtempSync(join(parent,'.build-'));
    try{
      for(const [name,bytes] of Object.entries(outputs))writeFileSync(inside(stage,name),bytes);
      renameSync(stage,dest);
    }finally{if(existsSync(stage))rmSync(stage,{recursive:true,force:true});}
  }
  for(const [name,bytes] of Object.entries(outputs)){
    if(!readFileSync(inside(dest,name)).equals(bytes))throw Error('Existing camper candidate differs: '+name);
  }
  writeReceipt(dir,'manifest.json',manifest);
  console.log(`${dest}: ${Object.keys(outputs).join(', ')}`);
}

function review(job,phase,browser){
  const candidate=camperJobPath(job);
  const env={...process.env,CAMP_CAMPER_JOB:job,CAMP_CAMPER_PHASE:phase};
  const run=(script,headless=false)=>execFileSync(process.execPath,[
    ...(!headless&&phase!=='verify'&&phase!=='compare'?['--import',phase==='after'?'./scripts/camper-review-fixture.mjs':'./tests/sprite-fixture.mjs']:[]),
    script,...(headless?[]:[phase]),
  ],{cwd:web,stdio:'inherit',env});
  if(!existsSync(inside(candidate,inputFilename)))throw Error('Prepare the camper job first');
  run('tests/render-camper-scales.mjs');
  if(phase==='after')execFileSync(process.execPath,['scripts/review-camper-head.mjs'],{cwd:web,stdio:'inherit',env});
  if(browser&&['before','after'].includes(phase))run('tests/browser.camper-head.mjs',true);
}

async function main(args){
  if(args.length===1&&args[0]==='--check'){
    if(CAMPER_PART_FILES['field-camper-walk'].bodyOnly){
      const result=await verifySubcultureCamper(CAMPER_PART_FILES);
      console.log(`${result.audit.results.length} body and collar cases; ${result.heads.length} shared head cases`);
      console.log('Reproduced registered camper: '+camperAtlasIds.map(id=>CAMPER_PART_FILES[id].url.split('/').at(-1)).join(', '));
      return;
    }
    const result=await compile(currentCamperInputs(1),web);
    if(objectDigest(CAMPER_PART_FILES)!==objectDigest(result.manifest.files))throw Error('Current registered camper does not match the master PNGs');
    const registered=readJSON(new URL('../../art/sprites/field-camper-v2/shared-head/manifest.json',import.meta.url));
    if(objectDigest(registered)!==objectDigest(result.parts))throw Error('Current camper master receipt does not match the registry');
    for(const [name,bytes] of Object.entries(result.outputs)){
      if(digest(readFileSync(inside(web,'public/sprites/'+name)))!==digest(bytes))throw Error('Changed current camper '+name);
    }
    console.log('Reproduced registered camper: '+Object.keys(result.outputs).join(', '));
    return;
  }
  if(!args.length){
    const job='current',dir=camperJobPath(job);
    if(!existsSync(dir))prepare(job,true);
    saveCandidate(dir,await compile(readJSON(inside(dir,inputFilename)),dir));
    return;
  }
  const [action,job,phase,option,...rest]=args;
  const dir=camperJobPath(job);
  if(!rest.length&&action==='prepare'&&!option&&(!phase||phase==='--from-current'))return prepare(job,!!phase);
  if(action==='review'&&!rest.length&&['before','after','compare'].includes(phase)&&
      (!option||option==='--browser'&&phase!=='compare'))return review(job,phase,!!option);
  if(['register','build','check','verify'].includes(action)&&args.length===2){
    if(action==='register')return register(dir);
    const result=await compile(readJSON(inside(dir,inputFilename)),dir);
    if(action==='build')return saveCandidate(dir,result);
    verifyCandidate(dir,result);
    console.log('Reproduced camper job '+job+' '+result.manifest.id);
    if(action==='verify')review(job,'verify',false);
    return;
  }
  throw Error('Usage: sprites:camper -- prepare JOB [--from-current] | register/build/check/verify JOB | review JOB before/after/compare [--browser] | --check');
}

await main(process.argv.slice(2));
