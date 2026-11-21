import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,renameSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {loadImage} from '@napi-rs/canvas';
import sharp from 'sharp';
import {buildHeadAtlas} from './camper-head-layers.mjs';
import {inspectHeadAtlas} from './inspect-camper-head.mjs';

const folder=new URL('../../art/sprites/field-camper-v2/shared-head/',import.meta.url);
export const headRecipe=JSON.parse(readFileSync(new URL('recipe.json',folder)));
export const camperAtlasIds=['field-camper-v2','field-camper-walk'];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

export function camperMasterNames(recipe=headRecipe,{bodyOnly=false}={}){
  return (bodyOnly?['native']:['native','walk']).flatMap(kind=>
    recipe.headLayers.map(role=>`shared-head/masters/${role}-${kind}.png`));
}

export async function compileCamperParts(buffers,readInput,recipe=headRecipe,{bodyOnly=false}={}){
  if(recipe.version!==1||recipe.source!=='consistency'||recipe.faceDonor!=='bun'||
      recipe.headLayers.join('/')!=='face/bob/bun')throw Error('Unsupported camper head recipe');
  const outputs={}, sources={}, files={};
  for (const [index,id] of camperAtlasIds.entries()) {
    const bytes=buffers[index];
    const compactWalk=Boolean(index)&&bodyOnly;
    sources[id]=digest(bytes);
    const masters={};
    for(const role of compactWalk?[]:recipe.headLayers){
      const name=role+(index?'-walk':'-native')+'.png',png=readInput('shared-head/masters/'+name);
      sources['masters/'+name]=digest(png);
      masters[role]=await loadImage(png);
    }
    const canvas=buildHeadAtlas(await loadImage(bytes),Boolean(index),recipe,masters,{bodyOnly});
    const options=index?{quality:92,alphaQuality:100,effort:6}:{lossless:true,effort:6};
    const data=await sharp(canvas.toBuffer('image/png')).webp(options).toBuffer();
    const sha256=digest(data), name=id+'-parts.'+sha256.slice(0,12)+'.webp';
    if(!compactWalk)await inspectHeadAtlas(data,Boolean(index),recipe);
    outputs[name]=data;
    files[id]={url:'/sprites/'+name,width:canvas.width,height:canvas.height,sampling:index?'linear':'nearest',
      bytes:data.length,sha256,...(compactWalk?{bodyOnly:true}:{headLayers:'shared-face-v1'})};
  }
  files['field-camper-v2-dark']=files[camperAtlasIds[0]];
  return {outputs,manifest:{recipe:digest(JSON.stringify(recipe)),sources,files}};
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)await main();

async function main(){
  const check=process.argv.includes('--check');
  const install=process.argv.includes('--use-local');
  if (process.argv.slice(2).some(a=>!['--check','--use-local'].includes(a)) || (check&&install))
    throw Error('Use --check, --use-local or no arguments');
  const recipe=headRecipe;
  const sourceDir=new URL('../'+recipe.source+'/',folder);
  const sourceManifest=JSON.parse(readFileSync(new URL('manifest.json',sourceDir)));
  const outputDir=fileURLToPath(new URL('../public/sprites/',import.meta.url));
  const mastersDir=new URL('masters/',folder);
  const masterHashes=JSON.parse(readFileSync(new URL('sources.json',mastersDir)));
  const buffers=camperAtlasIds.map(id=>{
    const source=sourceManifest.files[id], bytes=readFileSync(new URL(source.file,sourceDir));
    if (digest(bytes)!==source.sha256) throw Error('Changed layered input '+id);
    return bytes;
  });
  const {outputs,manifest:compiled}=await compileCamperParts(buffers,path=>{
    const name=path.split('/').at(-1), bytes=readFileSync(new URL(name,mastersDir));
    if(digest(bytes)!==masterHashes[name])throw Error('Unregistered head master: '+name);
    return bytes;
  },recipe);
  const {files}=compiled;
  const manifest=JSON.stringify(compiled,null,2)+'\n';
  const moduleText='// Selected local camper parts. See art/sprites/field-camper-v2/shared-head/manifest.json.\n'+
    'export const CAMPER_PART_FILES = '+JSON.stringify(files,null,2)+';\n';
  const registry=new URL('../lib/camp-camper-part-files.mjs',import.meta.url);
  if(check) {
    if(JSON.stringify(JSON.parse(readFileSync(new URL('manifest.json',folder))))!==JSON.stringify(JSON.parse(manifest)))
      throw Error('Stale camper parts manifest');
    for(const [name,bytes] of Object.entries(outputs))
      if(!readFileSync(join(outputDir,name)).equals(bytes))throw Error('Stale camper parts '+name);
  }else{
    const stage=mkdtempSync(join(outputDir,'.camper-parts-'));
    try{
      for(const [name,bytes] of Object.entries(outputs)){
        writeFileSync(join(stage,name),bytes);
        renameSync(join(stage,name),join(outputDir,name));
      }
      writeFileSync(join(stage,'manifest.json'),manifest);
      renameSync(join(stage,'manifest.json'),new URL('manifest.json',folder));
      if(install){
        writeFileSync(join(stage,'registry.mjs'),moduleText);
        renameSync(join(stage,'registry.mjs'),registry);
      }
    }finally{rmSync(stage,{recursive:true,force:true});}
  }
  console.log('Verified 32 native and 4 walking shared head frames with two hair overlays',Object.keys(outputs).join(', '));
}
