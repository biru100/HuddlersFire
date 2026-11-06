import './sprite-fixture.mjs';
import {createCanvas,Image,loadImage} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {CampRenderer} from '../lib/camp-renderer.mjs';
import {spawnPlayer,COLORS} from '../lib/camp-world.mjs';
import {CAMP_SEATS} from '../lib/camp-seats.mjs';
import {emptyFire} from '../lib/camp-fire.mjs';
import {EXHIBITED_GAMES,exhibitCover} from '../lib/camp-games.mjs';
import {createSpriteContext} from '../lib/camp-sprite-assets.mjs';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};globalThis.Image=Image;
const out=process.argv[2]||'outputs/scene-polish/after';mkdirSync(out,{recursive:true});const rows=[];
let assets;if(process.env.CAMP_POLISH_MANIFEST){const file=resolve(process.env.CAMP_POLISH_MANIFEST),data=JSON.parse(readFileSync(file,'utf8'));assets=createSpriteContext(data,{cacheLimit:64,loader:url=>loadImage(url.startsWith('/__sprite-preview/files/')?resolve(dirname(file),url.split('/').at(-1)):resolve('public','.'+url))});await assets.preloadSprites(Object.keys(data.files));}
for(const [name,width,height,count,seated,mapId,followSelf]of [
 ['camp-solo',1050,824,1,false,'camp',true],['camp-three',1050,824,3,true,'camp',true],['camp-sixteen',1050,824,16,true,'camp',false],
 ['mobile-solo',390,720,1,false,'camp',true],['mobile-three',390,720,3,true,'camp',true],['playground',1050,824,3,false,'playground',true],['showroom',1050,824,3,false,'showroom',true],
]){
 const canvas=createCanvas(width,height);canvas.getBoundingClientRect=()=>({width,height});
 const seats=count===3?[0,1,6]:Array.from({length:16},(_,i)=>i);
 const players=Array.from({length:count},(_,i)=>{const p={...spawnPlayer(i,mapId),id:String(i),name:i?'친구 '+i:'허들러',color:COLORS[i%6]};if(seated){const seat=CAMP_SEATS[seats[i]];Object.assign(p,{x:seat.x,y:seat.y,z:.18,seatId:seat.id,sitting:true});}return p;});
 const scene={players,self:'0',theme:'color',followSelf,now:5000,fire:emptyFire(0)};
 const renderer=new CampRenderer(canvas,()=>scene,assets?{assets}:{});await renderer.ready;
 for(const game of EXHIBITED_GAMES){const url=exhibitCover(game);if(url)renderer.exhibitImages.set(url,{image:await loadImage('public'+url),failed:false});}
 renderer.draw(5000);writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));rows.push({name,width,height,count,camera:renderer.camera,heads:renderer.hitAreas.map(a=>({id:a.id,diameter:a.head.radius*2})),names:renderer.hitAreas.map(a=>a.label),nameFont:renderer.nameFontSize});renderer.destroy();
}
writeFileSync(out+'/metrics.json',JSON.stringify(rows,null,2)+'\n');console.log('Captured '+rows.length+' current Canvas scenes in '+out);
