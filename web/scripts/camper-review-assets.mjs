// Offline only. Resolve candidate bytes explicitly, keeping the shipped registry intact.
import {readFileSync} from 'node:fs';
import {inside,readJSON} from '../../tools/lib/sprite-spec.mjs';
import {loadImage} from '@napi-rs/canvas';
import {spriteManifest,createSpriteContext} from '../lib/camp-sprite-assets.mjs';
import {CAMPER_ART_FILES,CAMPER_SOLES} from '../lib/camp-camper-art.mjs';
import {CAMPER_PART_FILES} from '../lib/camp-camper-part-files.mjs';
import {camperAtlasDimensions,legacyContract} from './camper-consistency.mjs';
import {camperAtlasIds,headRecipe} from './build-shared-camper-head.mjs';
import {subcultureHeadRecipe,subcultureSourceIdentity} from './compile-subculture-camper.mjs';
import {motionSourceIdentity} from './compile-camper-motion.mjs';
import {camperJobPath,contractDigest,digest,isSha256,objectDigest,readCamperInputs} from './camper-harness-inputs.mjs';

export const candidateDir=new URL('../../art/sprites/field-camper-v2/consistency/',import.meta.url);
export {digest,camperJobPath};

export function readCamperIntermediate(){
  const manifest=JSON.parse(readFileSync(new URL('manifest.json',candidateDir)));
  if(manifest.contract!==objectDigest(legacyContract))throw Error('Camper contract changed; regenerate');
  if(JSON.stringify(manifest.soles)!==JSON.stringify(CAMPER_SOLES))throw Error('Candidate soles incompatible with runtime');
  const buffers={},files={...spriteManifest.files};
  for(const id of ['field-camper-v2','field-camper-walk']){
    const {file,sha256,bytes,width,height,sampling}=manifest.files[id];
    if(file!==id+'.'+sha256.slice(0,12)+'.webp')throw Error('Invalid candidate file '+id);
    const expected=CAMPER_ART_FILES[id];
    if(width!==expected.width||height!==expected.height||sampling!==expected.sampling)
      throw Error('Incompatible camper atlas metadata: '+id);
    const data=readFileSync(new URL(file,candidateDir));
    if(data.length!==bytes||digest(data)!==sha256)throw Error('Changed candidate '+id);
    const url='candidate/'+file;
    buffers[url]=data;
    files[id]={url,sha256,bytes,width,height,sampling};
  }
  files['field-camper-v2-dark']=files['field-camper-v2'];
  const load=url=>loadImage(buffers[url]??readFileSync(new URL('../public'+url,import.meta.url)));
  return {manifest,files,load,buffers};
}

export function readCamperCandidate(job=process.env.CAMP_CAMPER_JOB||'current'){
  const path=camperJobPath(job);
  const manifest=readJSON(inside(path,'manifest.json'));
  const {id,...payload}=manifest;
  if(!isSha256(id)||objectDigest(payload)!==id||![1,2,3,4].includes(manifest.version))
    throw Error('Stale or changed camper candidate manifest: '+job);
  if(manifest.version===4)return readMotionCandidate(manifest,path);
  const subculture=manifest.version===3;
  if(subculture){
    const {sources,recipe}=subcultureSourceIdentity();
    if(objectDigest(sources)!==objectDigest(manifest.sources)||recipe!==manifest.recipe)throw Error('Candidate source or recipe changed; rebuild '+job);
  }else{
    const inputs=readJSON(inside(path,'inputs.json'));
    if(manifest.contract!==contractDigest(manifest.version)||manifest.version!==inputs.version||manifest.inputs!==objectDigest(inputs))
      throw Error('Candidate inputs changed; rebuild '+job);
    const {hashes}=readCamperInputs(inputs,path);
    if(objectDigest(hashes)!==objectDigest(manifest.sources))throw Error('Candidate source hashes changed; rebuild '+job);
  }
  const dir=inside(path,'candidates/'+id),files={...spriteManifest.files},buffers={};
  for(const id of camperAtlasIds){
    const details=manifest.files?.[id],expected=CAMPER_PART_FILES[id];
    const walking=id==='field-camper-walk',bodyOnly=walking&&manifest.version>=2;
    const [width,height]=camperAtlasDimensions(walking,true,{bodyOnly});
    const layout=bodyOnly?details?.bodyOnly===true&&details.headLayers===undefined:
      details?.headLayers==='shared-face-v1'&&details.bodyOnly===undefined;
    if(!details||!isSha256(details.sha256)||!layout||
      details.width!==width||details.height!==height||details.sampling!==expected.sampling)
      throw Error('Incompatible final atlas: '+id);
    const name=id+'-parts.'+details.sha256.slice(0,12)+'.webp';
    if(details.url!=='/sprites/'+name)throw Error('Invalid final atlas name: '+id);
    const bytes=readFileSync(inside(dir,name));
    if(bytes.length!==details.bytes||digest(bytes)!==details.sha256)throw Error('Changed final atlas: '+id);
    const url='candidate/'+name;
    buffers[url]=bytes;
    files[id]={...details,url};
  }
  files['field-camper-v2-dark']=files['field-camper-v2'];
  const load=url=>loadImage(buffers[url]??readFileSync(new URL('../public'+url,import.meta.url)));
  return {manifest,files,load,buffers,recipe:subculture?subcultureHeadRecipe:headRecipe,path};
}

function readMotionCandidate(manifest,path){
  if(objectDigest(manifest.sources)!==objectDigest(motionSourceIdentity({
    authoredCrops:!!manifest.sources?.layout,regenerated:!!manifest.sources?.collars,
  })))
    throw Error('Camper motion sources changed; rebuild the candidate');
  const {id,motion}=manifest,dir=inside(path,'candidates/'+id),buffers={},files={...spriteManifest.files};
  for(const [key,{color,normal,density}] of Object.entries(motion.plates)){
    if(![1,3].includes(density))throw Error('Invalid camper motion density: '+key);
    const existingWalk=key==='walk'&&color==='field-camper-walk'&&density===3;
    const base=existingWalk?files[color]:manifest.files[color];
    if(!base)throw Error('Missing camper motion color plate: '+color);
    for(const [kind,atlas] of [['color',color],['normal',normal]]){
      if(kind==='color'&&existingWalk)continue;
      const details=manifest.files[atlas],expected='camper-motion-'+key+'-'+kind;
      if(!details||atlas!==expected||!isSha256(details.sha256)
        ||details.width!==base.width||details.height!==base.height
        ||!Number.isSafeInteger(details.width)||details.width<=0||details.width%(64*density)
        ||!Number.isSafeInteger(details.height)||details.height<=0||details.height%(80*density))
        throw Error('Incompatible camper motion plate: '+atlas);
      const name=atlas+'.'+details.sha256.slice(0,12)+'.png';
      if(details.url!=='/sprites/'+name)throw Error('Invalid camper motion atlas name: '+atlas);
      const bytes=readFileSync(inside(dir,name));
      if(bytes.length!==details.bytes||digest(bytes)!==details.sha256)
        throw Error('Changed camper motion atlas: '+atlas);
      const url='/__camper-candidate/'+name;
      buffers[url]=bytes;
      files[atlas]={...details,url};
    }
  }
  const load=url=>loadImage(buffers[url]??readFileSync(new URL('../public'+url,import.meta.url)));
  return {manifest,motion,files,load,buffers,path,recipe:subcultureHeadRecipe};
}

export function candidateContext(candidate){
  return createSpriteContext({...spriteManifest,files:candidate.files,camperMotion:candidate.motion},
    {loader:candidate.load,cacheLimit:64});
}
