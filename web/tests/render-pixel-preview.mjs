import {createCanvas,loadImage,Image} from '@napi-rs/canvas';
import {resolve,dirname} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
import {CampRenderer} from '../lib/camp-renderer.mjs';
import {createSpriteContext,setSpriteCanvasFactory} from '../lib/camp-sprite-assets.mjs';
import {spawnPlayer,COLORS} from '../lib/camp-world.mjs';
import {CAMP_SEATS} from '../lib/camp-seats.mjs';
import {ROOT,inside,hash,readJSON,writeJSON} from '../../tools/lib/sprite-spec.mjs';
import {loadPixelJob,pixelFingerprint} from '../../tools/lib/pixel-assets.mjs';
export async function renderPixelPreview(file){
 const job=loadPixelJob(file),dir=dirname(resolve(file)),built=readJSON(inside(dir,'build/preview.json')),manifest=readJSON(inside(dir,'build/manifest.json'));
 if(built.fingerprint!==pixelFingerprint(job))throw Error('Rebuild stale pixel preview first');
 const assets=createSpriteContext(manifest,{cacheLimit:128,loader:url=>loadImage(url.startsWith('/__sprite-preview/files/')?inside(dir,'build/'+url.split('/').at(-1)):resolve(ROOT,'web/public'+url))});
 await assets.preloadSprites(Object.keys(manifest.files));if(assets.spriteStatus(Object.keys(manifest.files)).loading||assets.spriteStatus(Object.keys(manifest.files)).failed.length)throw Error('All comparison assets must remain loaded before the first capture');setSpriteCanvasFactory(createCanvas);
 globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};globalThis.Image=Image;
 const cases=[];mkdirSync(inside(dir,'screens'),{recursive:true});
 for(const id of ['canvas-before','canvas-candidates','canvas-seated','canvas-occlusion']){
  const seat=CAMP_SEATS[0],p={...spawnPlayer(0),id:'self',name:'검수',color:COLORS[0],x:-5.5,y:-.5,connected:true};
  if(id==='canvas-seated')Object.assign(p,{seatId:seat.id,x:seat.x,y:seat.y,z:.18,sitting:true});
  const players=id==='canvas-occlusion'?[{...p,x:-9,y:-3.5,name:'나무 뒤'},{...p,id:'front',x:-9,y:-2.5,name:'나무 앞'}]:[p];
  const canvas=createCanvas(1050,824);canvas.getBoundingClientRect=()=>({width:1050,height:824});
  const renderer=new CampRenderer(canvas,()=>({players,self:p.id,mapId:'camp',followSelf:true,now:1000,pixelMode:id==='canvas-before'?'off':'candidates'}),{assets});
  renderer.draw(1000);const path='screens/'+id+'.png',bytes=canvas.toBuffer('image/png');writeFileSync(inside(dir,path),bytes);cases.push({id,file:path,kind:'canvas',width:1050,height:824,sha256:hash(bytes),mode:renderer.pixelMode});renderer.destroy();
 }
 writeJSON(inside(dir,'evidence.json'),{fingerprint:built.fingerprint,manifestHash:built.manifestHash,cases});return cases;
}
