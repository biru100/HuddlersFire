// Derived numerical surface data. Original colour art and its silhouette are never edited.
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {ROOT,hash,inside,readJSON,writeJSON,loadJob} from './sprite-spec.mjs';
const require=createRequire(new URL('../../web/package.json',import.meta.url));
const {createCanvas,loadImage}=require('@napi-rs/canvas');
export const materialSpecFile=resolve(ROOT,'art/sprites/material-spec.json');
export function baseArtworkHash(spec){const dir=inside(ROOT,spec.baseRelease),job=loadJob(inside(dir,'job.json'));return hash({job,annotations:readJSON(inside(dir,'annotations.json')),sources:Object.fromEntries(job.selected.map(id=>[id,hash(readFileSync(inside(dir,'source/'+id+'.png')))]))});}
export function validateMaterialSpec(spec){
  if(spec.version!==1||spec.normalConvention!=='view-x-right-y-up-z-viewer'||!/^field-[a-z0-9-]+$/.test(spec.id)||!spec.surfaces||!spec.character||!Array.isArray(spec.unlit))throw Error('Invalid material specification');
  const forms=new Set(['tree','tent','bench-ne','bench-nw','round','flat','box']);
  for(const [id,s]of Object.entries(spec.surfaces))if(!forms.has(s.form)||!(s.strength>=0&&s.strength<=1)||!(s.bevel>0)||!(s.height>=0)||s.footprint?.length!==2||!s.footprint.every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid material surface '+id);
  if(!(spec.character.strength>=0&&spec.character.strength<=1)||!(spec.character.bevel>0)||!['grass','sand','stone'].every(id=>spec.terrain?.[id]>=0&&spec.terrain[id]<=1))throw Error('Invalid material channels');
  return spec;
}
function edgeDistance(alpha,w,h){
  const d=new Float32Array(w*h),far=w+h;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;d[i]=alpha[i]<64||!x||!y||x===w-1||y===h-1?0:far;}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(x)d[i]=Math.min(d[i],d[i-1]+1);if(y)d[i]=Math.min(d[i],d[i-w]+1);if(x&&y)d[i]=Math.min(d[i],d[i-w-1]+1.4142);if(y&&x<w-1)d[i]=Math.min(d[i],d[i-w+1]+1.4142);}
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(x<w-1)d[i]=Math.min(d[i],d[i+1]+1);if(y<h-1)d[i]=Math.min(d[i],d[i+w]+1);if(x<w-1&&y<h-1)d[i]=Math.min(d[i],d[i+w+1]+1.4142);if(x&&y<h-1)d[i]=Math.min(d[i],d[i+w-1]+1.4142);}
  return d;
}
export function normalFrame(rgba,w,h,recipe,head=null){
  if(rgba.length!==w*h*4)throw Error('Material frame dimensions mismatch');
  const alpha=Uint8Array.from({length:w*h},(_,i)=>rgba[i*4+3]),distance=edgeDistance(alpha,w,h),height=new Float32Array(w*h),result=new Uint8ClampedArray(w*h*4);
  // Shape is inferred from alpha and authored forms, never from painted RGB brightness.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,nx=x/Math.max(1,w-1),ny=y/Math.max(1,h-1),bevel=Math.min(1,distance[i]/recipe.bevel);
    let shape=bevel*.65;
    if(recipe.form==='round'||recipe.form==='character')shape+=Math.sqrt(Math.max(0,1-(nx*2-1)**2))*.75;
    if(recipe.form==='tree'){const mix=Math.max(0,Math.min(1,(ny-.53)/.2)),trunk=Math.sqrt(Math.max(0,1-((nx-.51)/.19)**2)),canopy=Math.sqrt(Math.max(0,1-((nx-.5)/.55)**2));shape+=(canopy*(1-mix)+trunk*mix)*.65;}
    if(recipe.form==='tent')shape+=(1-Math.abs(nx*2-1))*.9;
    height[i]=shape;
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,p=i*4,nx=x/Math.max(1,w-1),ny=y/Math.max(1,h-1);
    let dx=-(height[y*w+Math.min(w-1,x+1)]-height[y*w+Math.max(0,x-1)])*2.4,dy=(height[Math.min(h-1,y+1)*w+x]-height[Math.max(0,y-1)*w+x])*2.4,dz=1;
    if(recipe.form==='bench-ne'||recipe.form==='bench-nw'){
      const sign=recipe.form==='bench-ne'?1:-1,top=ny<.73-sign*(nx-.5)*.5;
      dx+=top?-.05:sign*.44;dy+=top?.62:-.15;
    }else if(recipe.form==='box'){dx+=nx>.57?.45:-.23;dy+=ny<.34?.62:-.12;}
    else if(recipe.form==='tent'){dx+=(nx>.5?.5:-.5);dy+=.3;}
    else if(recipe.form==='flat')dy+=.2;
    const length=Math.hypot(dx,dy,dz),portrait=head&&Math.hypot(x-head.x,y-head.y)<head.radius*1.03;
    result[p]=Math.round((dx/length*.5+.5)*255);result[p+1]=Math.round((dy/length*.5+.5)*255);result[p+2]=Math.round((dz/length*.5+.5)*255);
    result[p+3]=portrait?0:alpha[i];
    if(!alpha[i]){result[p]=128;result[p+1]=128;result[p+2]=255;}
  }
  return result;
}
function allFrames(manifest){return Object.values(manifest.character.states).flatMap(row=>[...row.frames,...Object.values(row.directions||{}).flatMap(r=>r.frames)]);}
export async function buildMaterialMaps({baseManifest,specFile=materialSpecFile,out}={}){
  const spec=validateMaterialSpec(readJSON(specFile)),base=readJSON(baseManifest),dir=resolve(out);mkdirSync(dir,{recursive:true});
  if(base.materials)throw Error('Material source must be a frozen colour-only manifest');
  const data=structuredClone(base),files={},inputs={},surfaces={},sourceRoot=resolve(ROOT,'web/public');
  for(const [id,f]of Object.entries(base.files)){const bytes=readFileSync(inside(sourceRoot,'.'+f.url));if(hash(bytes)!==f.sha256)throw Error('Colour source changed: '+id);inputs[id]=hash(bytes);}
  async function build(sheetId,frames){
    const f=base.files[sheetId];if(!f)throw Error('Material sheet missing '+sheetId);
    const image=await loadImage(inside(sourceRoot,'.'+f.url)),source=createCanvas(f.width,f.height),c=source.getContext('2d');c.drawImage(image,0,0);
    const result=createCanvas(f.width,f.height),r=result.getContext('2d');r.fillStyle='rgb(128,128,255)';r.fillRect(0,0,f.width,f.height);r.clearRect(0,0,f.width,f.height);
    for(const {frame,recipe,head}of frames){
      const pixels=c.getImageData(frame.x,frame.y,frame.w,frame.h),normal=normalFrame(pixels.data,frame.w,frame.h,recipe,head),out=r.createImageData(frame.w,frame.h);out.data.set(normal);r.putImageData(out,frame.x,frame.y);
    }
    const bytes=result.toBuffer('image/png'),id=sheetId.startsWith('camper-')?'normal-character':'normal-'+sheetId,name=id+'.'+hash(bytes).slice(0,12)+'.png';
    writeFileSync(inside(dir,name),bytes);files[id]={url:'/sprites/'+name,width:f.width,height:f.height,bytes:bytes.length,sha256:hash(bytes)};return id;
  }
  const characterNormal=await build(base.character.variants[0],allFrames(base).map(frame=>({frame,head:frame.head,recipe:{...spec.character,form:'character'}})));
  const propFrames=[],seen=new Set();
  for(const [id,frame]of Object.entries(base.sprites)){
    if(frame.sheet!=='environment'||seen.has(frame.x+','+frame.y))continue;
    const specId=id==='gameBooth'?'game-booth':id,recipe=spec.surfaces[specId];if(!recipe&&spec.unlit.includes(id)){seen.add(frame.x+','+frame.y);continue;}if(!recipe)throw Error('Missing material recipe '+id);
    seen.add(frame.x+','+frame.y);surfaces[id]={...recipe};propFrames.push({frame,recipe});
  }
  const environmentNormal=await build('environment',propFrames),sheets={};
  for(const id of [...base.character.variants,...base.character.darkVariants])sheets[id]=characterNormal;
  sheets.environment=environmentNormal;sheets['environment-dark']=environmentNormal;
  for(const id of Object.keys(spec.terrain)){
    const canvas=createCanvas(192,192),c=canvas.getContext('2d'),pixels=c.createImageData(192,192);
    for(let y=0;y<192;y++)for(let x=0;x<192;x++){const u=x/191*Math.PI*2,v=y/191*Math.PI*2,dx=.12*Math.cos(u)*Math.cos(v)+.04*Math.sin(2*u+v),dy=.6+.08*Math.sin(u)*Math.sin(v),dz=.8,length=Math.hypot(dx,dy,dz),p=(y*192+x)*4;pixels.data[p]=(dx/length*.5+.5)*255;pixels.data[p+1]=(dy/length*.5+.5)*255;pixels.data[p+2]=(dz/length*.5+.5)*255;pixels.data[p+3]=255;}
    c.putImageData(pixels,0,0);const bytes=canvas.toBuffer('image/png'),normalId='normal-'+id,name=normalId+'.'+hash(bytes).slice(0,12)+'.png';writeFileSync(inside(dir,name),bytes);files[normalId]={url:'/sprites/'+name,width:192,height:192,bytes:bytes.length,sha256:hash(bytes)};sheets[id]=normalId;sheets[id+'-dark']=normalId;
  }
  data.files={...base.files,...files};data.materials={version:1,id:spec.id,normalConvention:spec.normalConvention,specHash:hash(spec),baseManifestHash:hash(readFileSync(baseManifest)),sheets,surfaces,character:spec.character,terrain:spec.terrain,unlit:spec.unlit};
  const total=Object.values(data.files).reduce((n,f)=>n+f.bytes,0);if(total>=spec.budgets.totalBytes)throw Error('Material release exceeds total transfer budget');
  for(const theme of ['color','dark'])for(const map of ['camp','playground','showroom']){const suffix=theme==='dark'?'-dark':'',ids=[...data.character[theme==='dark'?'darkVariants':'variants'],'environment'+suffix,'effects'+suffix,map==='showroom'?'stone'+suffix:'grass'+suffix,...(map==='showroom'?[]:['sand'+suffix])],all=[...new Set([...ids,...ids.map(id=>sheets[id]).filter(Boolean)])];if(all.reduce((n,id)=>n+data.files[id].bytes,0)>=spec.budgets.sceneBytes)throw Error('Material release exceeds scene transfer budget');}
  writeJSON(inside(dir,'manifest.json'),data);writeJSON(inside(dir,'materials-build.json'),{version:1,specHash:hash(spec),baseArtworkHash:baseArtworkHash(spec),baseManifestHash:data.materials.baseManifestHash,inputs,files,manifestHash:hash(data),generatorHash:hash(readFileSync(new URL(import.meta.url))),bytes:total});return data;
}
export async function installMaterialMaps({dir,baseManifest,reviewFile}={}){
  const {verifyMaterialReview}=await import('./material-review.mjs');verifyMaterialReview(dir,reviewFile,{scope:'full'});
  const source=readJSON(inside(resolve(dir),'materials-build.json')),data=readJSON(inside(resolve(dir),'manifest.json'));
  if(source.specHash!==hash(readJSON(materialSpecFile))||source.baseManifestHash!==hash(readFileSync(baseManifest))||source.manifestHash!==hash(data)||source.generatorHash!==hash(readFileSync(new URL(import.meta.url))))throw Error('Stale material build');
  for(const [id,f]of Object.entries(source.files)){const name=f.url.split('/').at(-1),file=inside(resolve(dir),name);if(hash(readFileSync(file))!==f.sha256)throw Error('Normal map changed '+id);copyFileSync(file,resolve(ROOT,'web/public/sprites',name));}
  writeJSON(resolve(ROOT,'web/public/sprites/manifest.json'),data);writeFileSync(resolve(ROOT,'web/lib/camp-sprite-manifest.mjs'),'// Generated colour and material manifest.\nexport const SPRITE_MANIFEST = '+JSON.stringify(data)+';\n');
  return {files:Object.keys(source.files).length,bytes:source.bytes};
}
