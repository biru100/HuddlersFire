// Import an extracted handoff without executing its scripts or replacing originals.
import {existsSync,mkdirSync,readFileSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {ROOT,inside,hash,readJSON,writeJSON} from './lib/sprite-spec.mjs';
import {inspectImage} from './lib/pixel-assets.mjs';
const args=process.argv.slice(2),get=key=>args[args.indexOf(key)+1],source=get('--source'),name=get('--name');
if(!args.includes('--source')||!args.includes('--name')||!source||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,50}$/.test(name))throw Error('Expected --source <extracted package directory> --name <new immutable import name>');
const src=resolve(source),incoming=resolve(ROOT,'art/sprites/pixel-quarterview/incoming');mkdirSync(incoming,{recursive:true});const dest=inside(incoming,name);if(existsSync(dest))throw Error('Import already exists; originals are never overwritten');
const documents=['START_HERE.md','docs/ART_DIRECTION.md','docs/HARNESS_IMPLEMENTATION.md','docs/CUSTOMIZATION_SPEC.md','docs/ASSET_ISSUES.md','docs/QA_CHECKLIST.md'];
const documentHashes=Object.fromEntries(documents.map(n=>[n,hash(readFileSync(inside(src,n)))])),manifest=readJSON(inside(src,'assets/candidate_manifest.json'));
const files=new Set(['assets/candidate_manifest.json','assets/extraction_boxes.json','assets/source/characters.png','assets/source/environment.png','assets/source/scene_mood.png']);
const ids=new Set();for(const a of manifest.assets){if(!/^[a-z][a-z0-9_.-]+$/.test(a.asset_id)||ids.has(a.asset_id)||!a.file?.startsWith('assets/candidates/')||!a.file.endsWith('.png')||!a.source_file?.startsWith('assets/source/')||!a.source_file.endsWith('.png'))throw Error('Invalid package manifest');ids.add(a.asset_id);files.add(a.file);files.add(a.source_file);const metrics=await inspectImage(inside(src,a.file));if(JSON.stringify(metrics.size)!==JSON.stringify(a.size_px))throw Error('Candidate size differs: '+a.asset_id);}
// All reads/validation precede the first import write.
const hashes=Object.fromEntries([...files].map(n=>[n,hash(readFileSync(inside(src,n)))]));mkdirSync(dest);
for(const n of files){const p=inside(dest,n);mkdirSync(dirname(p),{recursive:true});copyFileSync(inside(src,n),p);}
const relative=p=>p.replaceAll('\\','/').slice(ROOT.replaceAll('\\','/').length),assets=manifest.assets.map(a=>({id:a.asset_id,file:relative(dest)+'/'+a.file,source:relative(dest)+'/'+a.source_file,crop:a.source_crop_px,size:a.size_px,kind:a.asset_id.startsWith('characters.')?'avatar':'prop',slot:null,status:'reference_only',reason:'New import: projection, grid, anchors and layer compatibility require review',projection:'unverified',grid:'unverified',direction:'unverified',frames:1,variants:{},ground:null,displaySize:null,paletteId:null,collision:{authority:'web/lib/camp-maps.mjs',mode:'preserve-existing'}}));
writeJSON(inside(dest,'import-receipt.json'),{version:1,documents:documentHashes,files:hashes,policy:'archive only; active rules live in project harness'});
writeJSON(inside(dest,'catalog.draft.json'),{version:1,assets,references:['characters','environment','scene_mood'].map(n=>relative(dest)+'/assets/source/'+n+'.png'),palettes:{}});
console.log(JSON.stringify({imported:dest,candidates:assets.length,catalog:inside(dest,'catalog.draft.json'),next:'Review classifications/metadata, then prepare-sprite-job --pixel --catalog <draft> --out <new job>'},null,2));
