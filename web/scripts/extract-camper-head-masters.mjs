// Reproduce the initial separation without overwriting the editable masters.
import {createHash} from 'node:crypto';
import {existsSync,mkdtempSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadImage} from '@napi-rs/canvas';
import {extractHeadMasters} from './camper-head-layers.mjs';

const folder=new URL('../../art/sprites/field-camper-v2/shared-head/',import.meta.url);
const recipe=JSON.parse(readFileSync(new URL('recipe.json',folder)));
const dest=fileURLToPath(new URL('masters/',folder));
if(existsSync(dest))throw Error('Editable head masters already exist: '+dest);
const inputs=new URL('../consistency/',folder);
const source=JSON.parse(readFileSync(new URL('manifest.json',inputs)));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const stage=mkdtempSync(fileURLToPath(new URL('.separation-',folder)));
try{
  const hashes={};
  for(const [detailed,id] of ['field-camper-v2','field-camper-walk'].entries()){
    const info=source.files[id],bytes=readFileSync(new URL(info.file,inputs));
    if(hash(bytes)!==info.sha256)throw Error('Changed initial input: '+id);
    const layers=extractHeadMasters(await loadImage(bytes),Boolean(detailed),recipe);
    for(const [role,image] of Object.entries(layers)){
      const name=role+(detailed?'-walk':'-native')+'.png',png=image.toBuffer('image/png');
      hashes[name]=hash(png);
      writeFileSync(join(stage,name),png);
    }
  }
  writeFileSync(join(stage,'sources.json'),JSON.stringify(hashes,null,2)+'\n');
  renameSync(stage,dest);
}finally{if(existsSync(stage))rmSync(stage,{recursive:true,force:true});}
