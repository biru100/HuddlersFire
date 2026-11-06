import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,inside,readJSON,writeJSON,hash,validateSpec,promptFor,verifyReview,reviewCases} from './lib/sprite-spec.mjs';
export function prepareJob({specFile=resolve(ROOT,'art/sprites/scene-spec.json'),selected,out,scope='pilot',reviewJob,reviewFile,reuseFrom}={}){
  const spec=validateSpec(readJSON(specFile)),all=Object.keys(spec.assets),ids=selected||(spec.version===2&&scope==='pilot'?all.filter(id=>spec.assets[id].kind!=='character'||['camper-idle','camper-sit'].includes(id)||id.startsWith('sit-')):all);
  if(!['pilot','full','revision'].includes(scope)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!spec.assets[id]))throw Error('Invalid selection or scope');
  const reusedSources={};
  if(scope==='revision'){
    if(!reuseFrom||ids.length!==all.length)throw Error('A revision requires a complete manifest and explicit source reuse');
    const sourceDir=inside(ROOT,reuseFrom),previous=readJSON(resolve(sourceDir,'job.json'));
    for(const id of previous.selected){if(!spec.assets[id])throw Error('Revision cannot silently drop a released asset: '+id);if(JSON.stringify(spec.assets[id])===JSON.stringify(previous.spec.assets[id])){const path=reuseFrom+'/source/'+id+'.png';reusedSources[id]={path,sha256:hash(readFileSync(inside(ROOT,path)))};}}
    if(!Object.keys(reusedSources).length)throw Error('Entirely new generation requires a reviewed full job');
  }
  if(spec.version===2&&scope==='pilot'&&ids.length===all.length)throw Error('Full field generation requires full scope and a reviewed prototype');
  if(scope==='full'){if(spec.version===2&&(ids.length!==Object.keys(spec.assets).length))throw Error('Full field selection must include every declared asset');if(!reviewJob||!reviewFile)throw Error('Full new generation requires a reviewed pilot');const proof=verifyReview(reviewJob,reviewFile);if(proof.specHash!==hash(spec))throw Error('Pilot specification differs');}
  const runs=resolve(ROOT,'art/sprites/runs');mkdirSync(runs,{recursive:true});const dir=inside(runs,out||'job-'+Date.now());if(existsSync(dir))throw Error('Job directory already exists');
  mkdirSync(dir,{recursive:true});for(const sub of ['source','prompts'])mkdirSync(resolve(dir,sub));
  const job={version:1,specHash:hash(spec),spec,selected:ids,scope,...(scope==='revision'?{reusedSources}:{}),referenceHash:hash(readFileSync(inside(ROOT,spec.style.reference)))};
  writeJSON(resolve(dir,'job.json'),job);
  for(const id of ids)writeFileSync(resolve(dir,'prompts',id+'.txt'),promptFor(spec,id));
  writeJSON(resolve(dir,'request.json'),{cell:{width:128,height:128},states:Object.fromEntries(ids.filter(id=>spec.assets[id].kind==='character').map(id=>{const a=spec.assets[id];return[id,{frames:a.frames,fps:a.fps,loop:a.loop,action:a.action}];})),style:spec.style.medium,fit:{resample:'lanczos',pixel_unfake:false,align_y:'bottom',ground_frames:true}});
  writeJSON(resolve(dir,'review.template.json'),{reviewer:'',fingerprint:'',manifestHash:'',observations:[],unresolved:[],cases:reviewCases(job).map(c=>({id:c.id,result:'unreviewed',observation:''}))});
  return dir;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const args=process.argv.slice(2),get=key=>{const i=args.indexOf(key);return i<0?undefined:args[i+1];};console.log(prepareJob({specFile:get('--spec'),selected:get('--assets')?.split(','),out:get('--out'),scope:get('--scope'),reviewJob:get('--review-job'),reviewFile:get('--review')}));}
