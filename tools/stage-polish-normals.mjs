import {copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,readJSON} from './lib/sprite-spec.mjs';
const dir=resolve(ROOT,'art/sprites/runs/scene-polish-materials'),build=readJSON(resolve(dir,'materials-build.json'));
for(const f of Object.values(build.files)){const name=f.url.split('/').at(-1);copyFileSync(resolve(dir,name),resolve(ROOT,'web/public/sprites',name));}
console.log('Staged hashed normal PNGs; production manifest unchanged');
