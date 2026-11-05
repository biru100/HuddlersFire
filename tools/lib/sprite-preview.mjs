import {mkdirSync,readFileSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {ROOT,inside,readJSON,writeJSON,hash,loadJob,buildFingerprint} from './sprite-spec.mjs';
import {SPRITE_MANIFEST} from '../../web/lib/camp-sprite-manifest.mjs';
const require=createRequire(new URL('../../web/package.json',import.meta.url));
const {createCanvas,loadImage}=require('@napi-rs/canvas');
function jobDirectory(file){const runs=resolve(ROOT,'art/sprites/runs');return inside(runs,dirname(resolve(file)));}
export function slicePreview(jobFile){
  const job=loadJob(jobFile),dir=jobDirectory(jobFile),lock=readJSON(resolve(ROOT,'tools/sprite-gen.lock.json')),repo=resolve(ROOT,lock.location),python=resolve(repo,process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python');
  const head=spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8',windowsHide:true});if(head.status!==0||head.stdout.trim()!==lock.commit)throw Error('Pinned sprite-gen checkout required');
  for(const id of job.selected){const a=job.spec.assets[id],source=inside(dir,'source/'+id+'.png');if(!existsSync(source))throw Error('Selected source missing: '+id);}
  for(const id of job.selected){const a=job.spec.assets[id],v2=job.spec.version===2,cell=a.kind==='character'?(v2?96:128):(v2?192:256),baseline=a.kind==='character'?(v2?90:116):a.kind==='terrain'?cell:cell-12,height=a.kind==='character'?(v2?82:104):a.kind==='terrain'?cell:cell-28;
    const result=spawnSync(python,['-m','sprite_gen.cli','slice-sheet','--sheet',inside(dir,'source/'+id+'.png'),'--out-dir',inside(dir,'sliced/'+id),'--chroma-key','none','--alpha-floor','64','--grid',a.frames+'x1','--names',Array.from({length:a.frames},(_,i)=>'frame'+i).join(','),'--cell-width',String(cell),'--cell-height',String(cell),'--baseline-y',String(baseline),'--target-height',String(height),'--scale','cell','--fit','contain'],{cwd:ROOT,encoding:'utf8',windowsHide:true});
    if(result.status!==0)throw Error('sprite-gen slice failed: '+id+'\n'+result.stderr+result.stdout);
    if(a.kind==='terrain'){
      let source=inside(dir,'sliced/'+id+'/frame0.png');
      for(const axis of ['x','y']){const out=inside(dir,'sliced/'+id+'/tile-'+axis+'.png'),r=spawnSync(python,['-m','sprite_gen.cli','background-tile','--source',source,'--out',out,'--axis',axis,'--period',v2?'160':'192','--overlap','32'],{cwd:ROOT,encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error('sprite-gen tile failed: '+id+' '+r.stderr);source=out;}
      copyFileSync(source,inside(dir,'sliced/'+id+'/frame0.png'));
    }
  }return dir;
}
function bounds(c,w,h){const d=c.getImageData(0,0,w,h).data;let x=w,y=h,r=-1,b=-1;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(d[(yy*w+xx)*4+3]>64){x=Math.min(x,xx);y=Math.min(y,yy);r=Math.max(r,xx);b=Math.max(b,yy);}if(r<0)throw Error('Empty sprite');return{x,y,w:r-x+1,h:b-y+1};}
export async function buildPreview(jobFile){
  if(loadJob(jobFile).spec.version===2)return (await import('./field-assets.mjs')).buildField(jobFile);
  const job=loadJob(jobFile),dir=jobDirectory(jobFile),out=inside(dir,'build');mkdirSync(out,{recursive:true});
  const annotations=existsSync(inside(dir,'annotations.json'))?readJSON(inside(dir,'annotations.json')):{};
  for(const [id,a]of Object.entries(annotations))if(!job.selected.includes(id)||Object.keys(a).some(key=>!['contacts','head'].includes(key)))throw Error('Only selected contact/head annotations may be overridden');
  const data=structuredClone(SPRITE_MANIFEST),inputs={},selectedFiles=[],bindings={},characterBindings={};
  for(const id of job.selected){
    const a={...job.spec.assets[id],...annotations[id]},cell=a.kind==='character'?128:256,canvas=createCanvas(cell*a.frames,cell),ctx=canvas.getContext('2d'),frames=[];
    const {validateSpec}=await import('./sprite-spec.mjs');validateSpec({...job.spec,assets:{...job.spec.assets,[id]:a}});
    inputs[id]=hash(readFileSync(inside(dir,'source/'+id+'.png')));
    for(let i=0;i<a.frames;i++){
      const image=await loadImage(inside(dir,'sliced/'+id+'/frame'+i+'.png')),single=createCanvas(cell,cell),c=single.getContext('2d');c.drawImage(image,0,0,cell,cell);const b=bounds(c,cell,cell);ctx.drawImage(single,i*cell,0);
      const point=p=>{if(!Array.isArray(p)||p.some(v=>!Number.isFinite(v)||v<0||v>1))throw Error('Contact outside silhouette: '+id);return{x:b.x+p[0]*b.w,y:b.y+p[1]*b.h};};
      const contacts=Object.fromEntries(Object.entries(a.contacts).map(([name,p])=>[name,point(p)]));
      if(a.kind==='character'){
        const head={...point(a.head.center),radius:a.head.radius*b.h};if(!(head.radius>0&&head.x-head.radius>=0&&head.x+head.radius<=cell&&head.y-head.radius>=0&&head.y+head.radius<=cell))throw Error('Head outside frame: '+id);
        frames.push({x:i*cell,y:0,w:cell,h:cell,bounds:b,feet:contacts.feet,head,hands:[],waist:contacts.seat?.y||head.y+head.radius+(contacts.feet.y-head.y-head.radius)*.68,contacts});
      }else frames.push({...b,contacts:Object.fromEntries(Object.entries(contacts).map(([name,p])=>[name,{x:p.x-b.x,y:p.y-b.y}]))});
    }
    const bytes=canvas.toBuffer('image/png'),file='pilot-'+id;copyFileSync(inside(dir,'source/'+id+'.png'),inside(out,id+'-source.png'));await import('node:fs').then(fs=>fs.writeFileSync(inside(out,id+'.png'),bytes));
    data.files[file]={url:'/__sprite-preview/files/'+id+'.png',bytes:bytes.length,width:canvas.width,height:canvas.height,sha256:hash(bytes)};selectedFiles.push(file);
    if(a.kind==='character'){const row={fps:a.fps,loop:a.loop,durations:frames.map(()=>Math.round(1000/a.fps)),frames,sheet:file,direction:a.direction},old=data.character.states[a.state]||row;data.character.states[a.state]={...old,...(a.direction==='front'?row:{}),directions:{...old.directions,[a.direction]:row}};}
    else if(a.kind==='terrain'){data.files[a.target]=data.files[file];data.files[a.target+'-dark']=data.files[file];}
    else{data.sprites[id]={...frames[0],sheet:file,ungraded:true,depth:a.depth,direction:a.direction};const base=data.sprites[a.target];if(!base)throw Error('Unknown target '+a.target);base.directions={...base.directions,[a.direction]:id};}
  }
  // These preview bindings refer to existing map IDs, never a second source of world coordinates.
  for(const [id,binding]of Object.entries(job.spec.bindings||{}))if(job.selected.includes(binding.asset)){bindings[id]=binding.direction;if(binding.characterDirection)characterBindings[id]=binding.characterDirection;}
  data.bindings=bindings;data.characterBindings=characterBindings;data.previewFiles=selectedFiles;data.preview={specHash:job.specHash,selected:job.selected,legacyAssets:Object.keys(SPRITE_MANIFEST.sprites).filter(id=>!job.selected.includes(id)),ungraded:true};
  writeJSON(inside(out,'manifest.json'),data);const fingerprint=buildFingerprint(job,inputs,annotations);
  writeJSON(inside(out,'preview.json'),{specHash:job.specHash,fingerprint,manifestHash:hash(readFileSync(inside(out,'manifest.json'))),inputs,annotations,toolCommit:readJSON(resolve(ROOT,'tools/sprite-gen.lock.json')).commit});return{dir,fingerprint};
}
