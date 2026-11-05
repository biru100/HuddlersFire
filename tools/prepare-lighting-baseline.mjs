// Read the committed renderer into a disposable test folder without checking out files.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {ROOT,inside,hash,writeJSON} from './lib/sprite-spec.mjs';
const dir=resolve(ROOT,'web/outputs/lighting-baseline');mkdirSync(dir,{recursive:true});
const git=args=>execFileSync('git',args,{cwd:ROOT,stdio:['ignore','pipe','ignore']});
const commit=git(['rev-parse','HEAD']).toString().trim(),files={};
for(const name of git(['ls-tree','-r','--name-only',commit,'web/lib']).toString().trim().split(/\r?\n/)){
  const bytes=git(['show',commit+':'+name]),target=inside(dir,name.slice('web/'.length));mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes);files[name]=hash(bytes);
}
writeJSON(inside(dir,'baseline.json'),{commit,files});console.log(JSON.stringify({commit,files:Object.keys(files).length,dir}));
