import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createSpriteContext} from '../lib/camp-sprite-assets.mjs';
const dir=resolve('../art/sprites/runs/scene-polish-assets'),data=JSON.parse(readFileSync(resolve(dir,'build/manifest.json'),'utf8')),assets=createSpriteContext(data,{loader:url=>loadImage(resolve(dir,'build',url.split('/').at(-1))),cacheLimit:64});await assets.preloadSprites(Object.keys(data.files));
const canvas=createCanvas(1120,900),c=canvas.getContext('2d');c.fillStyle='#f1ead9';c.fillRect(0,0,1120,900);c.fillStyle='#514530';c.font='17px sans-serif';c.fillText('Each row: six frames followed by the first frame again (loop seam)',20,30);
for(const [row,id]of ['amber','gold','blue','jade','violet'].entries()){c.fillStyle='#514530';c.fillText(id,12,85+row*164);for(let i=0;i<7;i++){assets.drawSprite(c,id,{x:145+i*143,y:190+row*164,width:98,elapsed:i*111});}}
writeFileSync(resolve(dir,'screens/effect-loops.png'),canvas.toBuffer('image/png'));console.log('Rendered every flame frame and loop seam');
