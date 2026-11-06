// Static candidate insertion into the actual CampRenderer. This module is test-only:
// it never replaces a connected user, generates a pose or pretends to support sitting.
import {createCanvas} from '@napi-rs/canvas';
import {writeFileSync} from 'node:fs';
import {CampRenderer} from '../lib/camp-renderer.mjs';
import {spawnPlayer,COLORS,validPosition} from '../lib/camp-world.mjs';
import {CAMP_SEATS} from '../lib/camp-seats.mjs';
import {inside,hash} from '../../tools/lib/sprite-spec.mjs';
export function renderPixelBody({dir,assets}){
 const id=assets.manifest.pixelQuarterview.basePilot;if(!id)return [];
 const entry=assets.manifest.pixelQuarterview.catalog.assets.find(a=>a.id===id),sprite='pixel-'+id.replaceAll('.','-'),variant=entry.variants.NW.idle,head=variant.frameAnchors[0].head,feet=variant.frameAnchors[0].feet,cases=[];
 for(const view of ['field','tree','seats']){
  const seat=CAMP_SEATS[0],body={...spawnPlayer(0),id:'body-pilot',name:'후보 NW 정지',color:COLORS[0],x:1.2,y:2.4,connected:true};
  const legacy={...spawnPlayer(1),id:'legacy',name:'기존 캐릭터',color:COLORS[1],x:2.5,y:2.6,connected:true};
  if(view==='tree'){Object.assign(body,{x:-9,y:-3.9});Object.assign(legacy,{x:-9,y:-2.1});}
  if(view==='seats'){Object.assign(legacy,{x:seat.x,y:seat.y,seatId:seat.id,sitting:true,z:.18});Object.assign(body,{x:seat.exitX-.3,y:seat.exitY-.2});}
  for(const p of [body,legacy])if(!p.seatId&&!validPosition(p.x,p.y,'camp'))throw Error('Review actor intersects authoritative scenery');
  const canvas=createCanvas(1050,824);canvas.getBoundingClientRect=()=>({width:1050,height:824});const renderer=new CampRenderer(canvas,()=>({players:[body,legacy],self:body.id,mapId:'camp',followSelf:true,now:1000,pixelMode:'candidates'}),{assets}),original=renderer.player.bind(renderer),shadow=renderer.groundShadows.playerMask.bind(renderer.groundShadows);
  renderer.player=(p,self,time)=>{
   if(p.id!==body.id)return original(p,self,time);
   const c=renderer.ctx;c.setMaterial?.({lighting:'lit'});assets.drawSprite(c,sprite,{width:64,theme:'color'});
   const m=c.getTransform(),point=(x,y)=>({x:(m.a*x+m.c*y+m.e)/renderer.dpr,y:(m.b*x+m.d*y+m.f)/renderer.dpr});
   renderer.nameplates.push({id:p.id,label:p.name,x:-40,y:8,width:80,self,matrix:m,alpha:c.globalAlpha});renderer.hitAreas.push({id:p.id,head:{...point(head[0]-feet[0],head[1]-feet[1]),radius:16*m.a/renderer.dpr},body:{...point(-17,-40),width:34*m.a/renderer.dpr,height:40*m.d/renderer.dpr}});
  };
  renderer.groundShadows.playerMask=(p,options)=>p.id===body.id?renderer.groundShadows.mask('body-nw-idle-v1',c=>assets.drawSprite(c,sprite,{width:64,theme:'color'}),{ground:0,width:128,height:160,originX:64,originY:128}):shadow(p,options);
  renderer.draw(1000);const file='screens/canvas-body-'+view+'.png',bytes=canvas.toBuffer('image/png');writeFileSync(inside(dir,file),bytes);cases.push({id:'canvas-body-'+view,file,kind:'canvas',width:1050,height:824,sha256:hash(bytes),scope:'Static NW idle candidate; legacy sitting/identity unchanged'});renderer.destroy();
 }
 return cases;
}
