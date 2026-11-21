import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadImage,createCanvas} from '@napi-rs/canvas';
import {ROOT,hash,readJSON,writeJSON,inside} from '../../tools/lib/sprite-spec.mjs';
import {reviewPng} from '../../tools/lib/review-png.mjs';
import {releaseIdentity,sceneInventory,captureProtocol,verifySnapshot,compareSnapshots,verifyObservations} from './current-art-evidence.mjs';

const [action,job,...options]=process.argv.slice(2);
if(!['before','after','compare','verify'].includes(action)||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(job||'')||
   options.some(v=>v!=='--browser'&&!(v==='--camper-candidate'&&action==='after')))
  throw Error('Usage: art:review:current -- before|after|compare|verify job [--browser] [after: --camper-candidate]');
if(process.env.CAMP_TEST_MANIFEST||process.env.CAMP_PREVIEW_JOB)throw Error('Current-release captures require the shipped manifest');
const web=resolve(ROOT,'web'),dir=inside(ROOT,'web/outputs/current-art/'+job);
mkdirSync(dir,{recursive:true});
const baseline=inside(dir,'before');
const readSnapshot=path=>{
  const receipt=readJSON(inside(path,'receipt.json'));verifySnapshot(path,receipt);return receipt;
};
const before=action==='before'?null:readSnapshot(baseline);
const browser=before?.browser??options.includes('--browser');
if(options.includes('--browser')&&!browser)throw Error('Baseline does not contain browser captures');
const recordedCandidate=['compare','verify'].includes(action)?readSnapshot(inside(dir,'after')).release.camperCandidate:null;
const staged=options.includes('--camper-candidate') || !!recordedCandidate;
if(staged&&browser)throw Error('Staged camper capture uses the offline Canvas renderer');
const candidateTools=staged?await import('../scripts/camper-review-assets.mjs'):null;
const finalJob=staged&&(!recordedCandidate||recordedCandidate.id)?
  process.env.CAMP_CAMPER_JOB??(existsSync(inside(candidateTools.camperJobPath(job),'manifest.json'))?job:'current'):null;
function identity(){
  const release=releaseIdentity();
  if(staged){
    release.camperCandidate=(finalJob?candidateTools.readCamperCandidate(finalJob):candidateTools.readCamperIntermediate()).manifest;
    release.camperPreview=hash(['camper-review-fixture','camper-review-assets'].map(name=>
      readFileSync(inside(web,'scripts/'+name+'.mjs'),'utf8').replaceAll('\r\n','\n')));
  }
  return release;
}
const release=identity(),protocol=captureProtocol(browser);
if(action==='before'||action==='after'){
  const dest=inside(dir,action);
  if(existsSync(dest))throw Error('Capture already exists. Use a new job: '+dest);
  if(before && before.protocol!==protocol)throw Error('Baseline uses a different capture protocol');
  const stage=mkdtempSync(inside(dir,'.capture-'));
  try{
    const run=args=>execFileSync(process.execPath,args,{cwd:web,stdio:'inherit',env:{...process.env,CAMP_ART_CAPTURE_DIR:stage,
      ...(finalJob&&{CAMP_CAMPER_JOB:finalJob})}});
    run(['--import',staged?'./scripts/camper-review-fixture.mjs':'./tests/sprite-fixture.mjs','tests/render-landscapes.mjs','--quick']);
    if(browser)run(['tests/browser.grounding.mjs']);
    const states=readJSON(inside(stage,'scenes.json'));
    if(browser)states.push(...readJSON(inside(stage,'actions.json')));
    const cases=states.map(state=>({...state,png:reviewPng(inside(stage,state.id+'.png'),state.width,state.height)}));
    if(hash(identity())!==hash(release)||captureProtocol(browser)!==protocol)throw Error('Inputs changed during capture');
    const payload={version:1,phase:action,browser,protocol,release,inventory:sceneInventory(),cases,
      ...(before?{baseline:before.digest}:{})};
    const receipt={...payload,digest:hash(payload)};
    verifySnapshot(stage,receipt);
    if(before)compareSnapshots(before,receipt,release,protocol);
    writeJSON(inside(stage,'receipt.json'),receipt);
    renameSync(stage,dest);
    console.log(dest,cases.length+' verified captures');
  }finally{if(existsSync(stage))rmSync(inside(dir,stage),{recursive:true,force:true});}
}else{
  const after=readSnapshot(inside(dir,'after'));
  const cases=compareSnapshots(before,after,release,protocol);
  for(const row of cases){
    row.changedPixels=0;row.maxChannelDelta=0;
    if(!row.changed)continue;
    const [a,b]=await Promise.all(['before','after'].map(async phase=>{
      const img=await loadImage(inside(dir,phase+'/'+row.id+'.png'));
      const c=createCanvas(img.width,img.height).getContext('2d');c.drawImage(img,0,0);
      return c.getImageData(0,0,img.width,img.height).data;
    }));
    for(let i=0;i<a.length;i+=4){
      let delta=0;
      for(let k=i;k<i+4;k++)delta=Math.max(delta,Math.abs(a[k]-b[k]));
      if(delta)row.changedPixels++;
      row.maxChannelDelta=Math.max(row.maxChannelDelta,delta);
    }
  }
  const pair={before:before.digest,after:after.digest};
  const notes=inside(dir,'observations.json');
  const observations=existsSync(notes)?readJSON(notes):{...pair,aesthetics:'pending_user',maps:
    Object.fromEntries(['camp','playground','showroom'].map(id=>[id,{affected:[],unchanged:[],evidence:[],observations:[],unresolved:[]}]))};
  if(observations.before!==pair.before||observations.after!==pair.after)throw Error('Observations refer to different captures');
  if(action==='verify')verifyObservations(observations,before,after);
  if(!existsSync(notes))writeJSON(notes,observations);
  writeJSON(inside(dir,'comparison.json'),{...pair,technical:'matched',observationsChecked:action==='verify',cases,observations});
  const figures=cases.map(({id,changedPixels,maxChannelDelta})=>`<section><h2>${id} · ${changedPixels?changedPixels+'픽셀 변화, 최대 채널 차이 '+maxChannelDelta:'동일'}</h2><div>${['before','after'].map((path,i)=>`<figure><figcaption>${i?'수정 후':'수정 전'}</figcaption><img loading="lazy" src="${path}/${id}.png" alt="${id}"></figure>`).join('')}</div></section>`).join('\n');
  writeFileSync(inside(dir,'comparison.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>현재 게임 전후 비교</title><style>body{font:16px system-ui;margin:1rem}section div{display:flex;gap:1rem;overflow:auto}figure{margin:0}img{display:block;max-width:none;image-rendering:pixelated}</style><h1>현재 게임 전후 비교</h1><p>원래 표시 크기 · <a href="observations.json">맵별 관찰과 미술 검토</a></p>${figures}</html>`);
  console.log(dir+'/comparison.html',cases.length+' matched pairs, '+cases.filter(c=>c.changed).length+' changed');
}
