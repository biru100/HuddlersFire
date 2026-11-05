// Extract generated multi-asset sheets with the pinned sprite-gen checkout.
import {readFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT,readJSON,inside} from './lib/sprite-spec.mjs';
const args=process.argv.slice(2),dir=inside(resolve(ROOT,'art/sprites/runs'),resolve(args[0])),plan=readJSON(resolve(ROOT,'art/sprites/field-v2/generation-plan.json')),lock=readJSON(resolve(ROOT,'tools/sprite-gen.lock.json')),repo=resolve(ROOT,lock.location),python=resolve(repo,'.venv/Scripts/python.exe');
if(spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).stdout.trim()!==lock.commit)throw Error('Pinned checkout required');
for(const group of plan.groups){
 const source=resolve(ROOT,'art/sprites/field-v2/'+group.id+'.png');
 if(group.id==='idle'){copyFileSync(source,inside(dir,'source/camper-idle.png'));continue;}
 const out=inside(dir,'groups/'+group.id);mkdirSync(out,{recursive:true});
 // The generator returned the two back body views in the opposite cell order.
 const names=group.id==='seated'?['sit-back-right','sit-back-left','sit-front-right','sit-front-left']:group.ids;
 const r=spawnSync(python,['-m','sprite_gen.cli','slice-sheet','--sheet',source,'--out-dir',out,'--chroma-key','none','--alpha-floor','64','--grid',group.cols+'x'+group.rows,'--names',names.join(','),'--cell-width','384','--cell-height','384','--baseline-y',group.id==='terrain'?'384':'368','--target-height',group.id==='terrain'?'384':'336','--scale','cell','--fit','contain'],{cwd:ROOT,encoding:'utf8',windowsHide:true});
 if(r.status!==0)throw Error(group.id+' '+r.stderr+r.stdout);
 for(const id of names)copyFileSync(inside(out,id+'.png'),inside(dir,'source/'+id+'.png'));
}
console.log('Extracted new field sheets into '+dir);
