// Review every newly generated frame and mixed pose using the production adapter.
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createSpriteContext} from '../lib/camp-sprite-assets.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';
import {COLORS} from '../lib/camp-world.mjs';
const dir=dirname(resolve(process.argv[2])),manifest=JSON.parse(readFileSync(resolve(dir,'build/manifest.json'),'utf8')),assets=createSpriteContext(manifest,{cacheLimit:64,loader:url=>loadImage(readFileSync(resolve(dir,'build',url.split('/').at(-1))))});await assets.preloadSprites(Object.keys(manifest.files));
const rows=Object.entries(manifest.character.states).flatMap(([state,row])=>[[state,row],...Object.entries(row.directions||{}).map(([direction,r])=>[state+'/'+direction,r])]),image=assets.getSprite(assets.characterSheet(1)),out=resolve(dir,'screens');mkdirSync(out,{recursive:true});
for(let page=0;page<Math.ceil(rows.length/5);page++){
 const canvas=createCanvas(1152,860),c=canvas.getContext('2d');c.fillStyle='#f4eddf';c.fillRect(0,0,1152,860);c.fillStyle='#453f30';c.font='18px sans-serif';c.fillText('FIELD V2 / SOURCE FRAMES / '+(page+1),20,30);
 for(const [j,[name,row]]of rows.slice(page*5,page*5+5).entries()){c.font='13px sans-serif';c.fillText(name,20,92+j*158);for(const [i,f]of row.frames.entries()){const s=21/f.head.radius,x=255+i*148,y=174+j*158;c.drawImage(image,f.x,f.y,f.w,f.h,x-f.feet.x*s,y-f.feet.y*s,f.w*s,f.h*s);c.font='10px sans-serif';c.fillText(String(i+1),x,y+16);}}
 writeFileSync(resolve(out,'frames-'+page+'.png'),canvas.toBuffer('image/png'));
}
const canvas=createCanvas(1152,670),c=canvas.getContext('2d');c.fillStyle='#f4eddf';c.fillRect(0,0,1152,670);
const poses=[['carry/run',{moving:true,running:true,carrying:'b'},null],['carry/carried',{carriedBy:'a',carrying:'b'},null],['weapon/walk',{moving:true,weapon:'gun'},null],['wave/crouch',{crouching:true},'wave'],['clap/seat back',{sitting:true,renderSeat:true,renderDirection:'back-left'},'clap'],['wave/seat front',{sitting:true,renderSeat:true,renderDirection:'front-right'},'wave']];
for(const [i,[label,p,emote]]of poses.entries())for(const [row,theme]of ['color','dark'].entries()){c.save();c.translate(96+i*192,270+row*300);c.scale(1.7,1.7);drawCharacter(c,{...p,color:COLORS[i]},{assets,time:.25,reduced:false,emote,theme});c.restore();c.fillStyle='#453f30';c.font='13px sans-serif';c.textAlign='center';c.fillText(label,96+i*192,300+row*300);}
writeFileSync(resolve(out,'combined-poses.png'),canvas.toBuffer('image/png'));
console.log(rows.length+' animation rows reviewed on contact sheets');
