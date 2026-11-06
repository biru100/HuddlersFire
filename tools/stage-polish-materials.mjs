import {mkdirSync,copyFileSync,cpSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,readJSON,writeJSON,loadJob} from './lib/sprite-spec.mjs';
import {buildMaterialMaps} from './lib/material-assets.mjs';
const source=resolve(ROOT,'art/sprites/runs/scene-polish-assets'),job=loadJob(resolve(source,'job.json')),data=readJSON(resolve(source,'build/manifest.json'));
if(job.scope!=='revision'||!data.preview.anchorsFrozen||job.selected.some(id=>!readJSON(resolve(source,'build/preview.json')).inputs[id]))throw Error('Incomplete revision artwork');
const artwork=resolve(ROOT,'art/sprites/field-polish-v1/artwork');mkdirSync(artwork,{recursive:true});
for(const name of ['job.json','annotations.json','generation-plan.json','generation-receipts.json','prompts','source','build'])cpSync(resolve(source,name),resolve(artwork,name),{recursive:true});
for(const f of Object.values(data.files)){const name=f.url.split('/').at(-1);copyFileSync(resolve(source,'build',name),resolve(ROOT,'web/public/sprites',name));f.url='/sprites/'+name;}
delete data.preview;delete data.previewFiles;const out=resolve(ROOT,'art/sprites/runs/scene-polish-materials');mkdirSync(out,{recursive:true});writeJSON(resolve(out,'base-manifest.json'),data);
const result=await buildMaterialMaps({baseManifest:resolve(out,'base-manifest.json'),out});console.log(JSON.stringify({out,files:Object.keys(result.files).length,normal:result.files['normal-character'],props:result.files['normal-environment']}));
