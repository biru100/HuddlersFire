// Offline replay from approved source PNGs. This does not call an image-generation API.
import {readFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url)),run='art/sprites/runs/rebuild-'+Date.now();
if(!process.argv.includes('--job')&&!process.argv.includes('--legacy')){
  const result=spawnSync(process.execPath,['tools/rebuild-field.mjs'],{cwd:root,stdio:'inherit',windowsHide:true});if(result.status!==0)throw Error('Reviewed field replay failed');
}else if(process.argv.includes('--job')){
  const file=process.argv[process.argv.indexOf('--job')+1];
  if(!file)throw Error('--job requires a job.json path');
  const {slicePreview}=await import('./lib/sprite-preview.mjs');slicePreview(file);
  const result=spawnSync(process.execPath,['web/scripts/build-sprite-assets.mjs','--job',resolve(file)],{cwd:root,stdio:'inherit',windowsHide:true});if(result.status!==0)throw Error('Preview build failed');
}else{
const lock=JSON.parse(readFileSync(resolve(root,'tools/sprite-gen.lock.json'),'utf8'));
const repo=resolve(root,lock.location),python=resolve(repo,process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python');
const head=spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8',windowsHide:true});
if(head.status!==0||head.stdout.trim()!==lock.commit)throw Error('Run tools/setup-sprite-gen.mjs with the pinned checkout first.');
function command(exe,args){const result=spawnSync(exe,args,{cwd:root,stdio:'inherit',windowsHide:true});if(result.error||result.status!==0)throw result.error||Error(`${args[0]} failed (${result.status})`);}
const cli=(...args)=>command(python,['-m','sprite_gen.cli',...args]);
const request=JSON.parse(readFileSync(resolve(root,'art/sprites/camper-request.json'),'utf8'));
cli('prepare','--out-dir',`${run}/camper`,'--character-id','camper','--base-image','art/sprites/source/camper-base.png','--request','art/sprites/camper-request.json','--chroma-key','#ff00ff','--no-fit-pixel-unfake','--fit-resample','lanczos');
mkdirSync(resolve(root,`${run}/camper/raw`),{recursive:true});
for(const state of Object.keys(request.states))copyFileSync(resolve(root,`art/sprites/source/camper-${state}.png`),resolve(root,`${run}/camper/raw/${state}.png`));
cli('extract','--run-dir',`${run}/camper`);
cli('compose-atlas','--run-dir',`${run}/camper`);
cli('compose-gif','--run-dir',`${run}/camper`,'--out-dir',`${run}/camper/previews`);
const slice=(source,group,grid,names,prefix,cell,baseline,height)=>cli('slice-sheet','--sheet',`art/sprites/source/${source}.png`,'--out-dir',`${run}/${group}`,'--chroma-key','none','--alpha-floor','64','--grid',grid,'--names',names,'--prefix',prefix,'--cell-width',String(cell),'--cell-height',String(cell),'--baseline-y',String(baseline),'--target-height',String(height),'--scale','sheet','--fit','contain');
slice('environment','environment','4x4','tree,tent,bench,lantern,radio,sign,fence,shade,crate,trampoline,football,portal,gameBooth,firewood,flowers,rock','prop_',256,240,220);
slice('effects','effects','4x3','amber,gold,blue,jade,violet,gun,snowball,bomb,impact,dust,heart,spark','fx_',192,180,160);
slice('terrain','terrain','3x1','grass,sand,stone','tile_',256,256,256);
for(const name of ['grass','sand','stone']){
  cli('background-tile','--source',`${run}/terrain/tile_${name}.png`,'--out',`${run}/terrain/${name}-x.png`,'--axis','x','--period','192','--overlap','32');
  cli('background-tile','--source',`${run}/terrain/${name}-x.png`,'--out',`${run}/terrain/${name}.png`,'--axis','y','--period','192','--overlap','32');
}
command(process.execPath,['web/scripts/build-sprite-assets.mjs',run]);
console.log('Reports and previews: '+run);
}
