import {mkdirSync,cpSync,existsSync,readFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {ROOT,inside,readJSON,writeJSON,hash} from './lib/sprite-spec.mjs';
import {verifyMaterialReview} from './lib/material-review.mjs';
import {installMaterialMaps,materialSpecFile} from './lib/material-assets.mjs';
const [input,reviewInput,revision]=process.argv.slice(2);if(!input||!reviewInput||(revision&&!/^[a-z][a-z0-9-]*$/.test(revision)))throw Error('Usage: node tools/install-materials.mjs <job-directory> <review.json> [review-revision]');
const dir=inside(resolve(ROOT,'art/sprites/runs'),resolve(input)),proof=verifyMaterialReview(dir,resolve(reviewInput)),spec=readJSON(materialSpecFile),release=inside(ROOT,'art/sprites/'+spec.id+'/release'+(revision?'-'+revision:''));
if(existsSync(release)){const old=readJSON(inside(release,'review.json'));if(old.fingerprint!==proof.fingerprint)throw Error('Preserve the existing reviewed release; choose a new material spec ID');}
mkdirSync(release,{recursive:true});
for(const name of ['base-manifest.json','manifest.json','materials-build.json','evidence.json','prototype-review.json','screens'])cpSync(inside(dir,name),inside(release,name),{recursive:true});
cpSync(resolve(reviewInput),inside(release,'review.json'));writeJSON(inside(release,'material-spec.json'),spec);
for(const f of Object.values(readJSON(inside(dir,'materials-build.json')).files)){const name=f.url.split('/').at(-1);cpSync(inside(dir,name),inside(release,name));}
writeJSON(inside(release,'generation.json'),{method:'Analytical alpha/shape normals and seamless low-relief ground; no colour-image brightness reconstruction. Colour artwork and any built-in image generation are recorded separately in baseArtwork.',specHash:hash(spec),generatorHash:hash(readFileSync(resolve(ROOT,'tools/lib/material-assets.mjs'))),baseArtwork:spec.baseRelease});
const result=await installMaterialMaps({dir:release,baseManifest:inside(release,'base-manifest.json'),reviewFile:inside(release,'review.json')});
writeJSON(resolve(ROOT,'art/sprites/material-release.json'),{version:1,directory:relative(ROOT,release).replaceAll('\\','/'),fingerprint:proof.fingerprint,specHash:hash(spec)});console.log(JSON.stringify({release,...result}));
