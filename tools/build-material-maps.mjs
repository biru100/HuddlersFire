import {resolve} from 'node:path';
import {mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {ROOT,readJSON,inside} from './lib/sprite-spec.mjs';
import {buildMaterialMaps} from './lib/material-assets.mjs';
const args=process.argv.slice(2),arg=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const out=resolve(arg('--out',resolve(ROOT,'art/sprites/runs/lighting-prototype'))),base=resolve(out,'base-manifest.json'),pointer=resolve(ROOT,'art/sprites/material-release.json');
const releasedBase=existsSync(pointer)?inside(ROOT,readJSON(pointer).directory+'/base-manifest.json'):resolve(ROOT,'web/public/sprites/manifest.json'),input=arg('--base',releasedBase);
mkdirSync(out,{recursive:true});if(!existsSync(base))copyFileSync(input,base);
const data=await buildMaterialMaps({baseManifest:base,out,specFile:arg('--spec',undefined)});console.log(JSON.stringify({out,files:Object.keys(data.files).length,materials:data.materials.id}));
