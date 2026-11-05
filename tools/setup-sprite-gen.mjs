// Explicit, project-local authoring setup. Never part of the application build.
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const lock=JSON.parse(readFileSync(new URL('./sprite-gen.lock.json',import.meta.url),'utf8'));
const repo=resolve(root,lock.location),uv=process.env.SPRITE_GEN_UV||'uv';
const env={...process.env,UV_CACHE_DIR:resolve(root,'tools/.uv-cache'),UV_PYTHON_INSTALL_DIR:resolve(root,'tools/.python')};
function run(command,args,cwd=root){const r=spawnSync(command,args,{cwd,env,stdio:'inherit',windowsHide:true});if(r.error||r.status!==0)throw r.error||Error(`${command} failed (${r.status})`);}
if(!existsSync(resolve(repo,'.git'))){run('git',['clone','--no-checkout',lock.repository,repo]);run('git',['checkout','--detach',lock.commit],repo);}
const head=spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8',windowsHide:true});
if(head.status!==0||head.stdout.trim()!==lock.commit)throw Error('Existing sprite-gen checkout differs from lock; inspect it before changing the checkout.');
const python=resolve(repo,process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python');
if(!existsSync(python))run(uv,['venv','--python',lock.python,resolve(repo,'.venv')]);
run(uv,['pip','install','--python',python,'-e',repo,'numpy==2.5.4','pillow==12.3.0']);
console.log('Pinned sprite-gen is ready; no global configuration was changed.');
