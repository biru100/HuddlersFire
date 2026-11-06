import {mkdirSync,copyFileSync,existsSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {ROOT,hash} from './lib/sprite-spec.mjs';
const dir=resolve(ROOT,'art/sprites/runs/scene-polish-v1');
mkdirSync(dir,{recursive:true});
const files=['web/lib/camp-renderer.mjs','web/lib/camp-character.mjs','web/lib/camp-sprite-animation.mjs','web/lib/camp-maps.mjs','web/lib/camp-scene-contract.mjs','web/lib/camp-scene-layout.mjs','web/lib/camp-canvas-renderer.mjs','web/lib/camp-artwork.mjs','web/lib/camp-lighting.mjs','web/lib/camp-protocol.mjs','web/app/camp.tsx','web/app/camp-layout.css','web/app/field-v2.css','art/sprites/scene-spec.json','art/sprites/material-spec.json','web/public/sprites/manifest.json'];
const receipt=resolve(dir,'baseline.json');
if(!existsSync(receipt)){
 const sources={};for(const name of files){const file=resolve(ROOT,name),target=resolve(dir,'baseline',name);mkdirSync(dirname(target),{recursive:true});copyFileSync(file,target);sources[name]=hash(readFileSync(file));}
 writeFileSync(receipt,JSON.stringify({version:1,approval:'2026-11-06 user approved scene polish implementation and local validation; no deployment/commit/push',sources},null,2)+'\n');
 console.log('Preserved '+files.length+' baseline files');
}else console.log('Existing baseline preserved');
