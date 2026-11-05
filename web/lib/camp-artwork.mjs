import { WEAPONS } from './camp-weapons.mjs';
import { portalMark } from './camp-appearance.mjs';
import { gameById, exhibitCover } from './camp-games.mjs';
import { defaultSpriteAssets, createSpriteSurface } from './camp-sprite-assets.mjs';
import { benchBinding } from './camp-scene-contract.mjs';
import {paintGroundSurface} from './camp-canvas-renderer.mjs';
export const FIELD_INK=Object.freeze({background:'#111111',floor:'#343434',edge:'#222222',line:'#555555',muted:'#aaaaaa',paper:'#eeeeee',white:'#ffffff'});
const COLOR_FIELD_INK=Object.freeze({background:'#f1ead9',floor:'#a9b67a',edge:'#7d8651',line:'#87975c',muted:'#655e48',paper:'#fff8e6',white:'#fffdf4'});
export class CampArtwork {
  get sprites(){return this.assets||defaultSpriteAssets;}
  ink(dark,color){return this.theme==='dark'?dark:color;}
  get fieldInk(){return this.theme==='dark'?FIELD_INK:COLOR_FIELD_INK;}
  sprite(id,options={}){return this.sprites.drawSprite(this.ctx,id,{theme:this.theme,...options});}
  round(x,y,w,h,r,fill,stroke){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.2;c.stroke();}}
  line(points,color=this.fieldInk.line,width=1){const c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
  caption(text,y=28,size=11){const c=this.ctx;c.textAlign='center';c.font=`600 ${size}px "Malgun Gothic",sans-serif`;c.fillStyle=this.ink('#ededed','#514530');c.strokeStyle=this.ink('#191919cc','#fff9e6cc');c.lineWidth=4;c.strokeText(text,0,y);c.fillText(text,0,y);}
  background(w,h){const c=this.ctx,g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,this.ink('#171717','#ede5d1'));g.addColorStop(1,this.ink('#101010','#f9f2e2'));c.fillStyle=g;c.fillRect(0,0,w,h);}
  ground(edge,mapId){
    const suffix=this.theme==='dark'?'-dark':'',base=this.sprites.getSprite((mapId==='showroom'?'stone':'grass')+suffix),sand=mapId==='showroom'?null:this.sprites.getSprite('sand'+suffix);
    if(!base||(mapId!=='showroom'&&!sand))return;
    const materials=this.webgl?.status==='ready'?this.sprites.manifest.materials:null,normalBase=this.sprites.getSprite(materials?.sheets[(mapId==='showroom'?'stone':'grass')+suffix]),normalSand=mapId==='showroom'?null:this.sprites.getSprite(materials?.sheets['sand'+suffix]);
    const key=mapId+suffix+edge+Boolean(normalBase)+Boolean(normalSand);
    if(this.groundCache?.key!==key){
      const surface=createSpriteSurface(this.ctx,2100,1200);paintGroundSurface(surface,{base,sand,mapId,edge,dark:this.theme==='dark'});let normal=null;
      if(normalBase&&(mapId==='showroom'||normalSand)){normal=createSpriteSurface(this.ctx,1050,600);paintGroundSurface(normal,{base:normalBase,sand:normalSand,mapId,edge,normal:true});}
      this.groundCache={key,surface,normal};
    }
    this.ctx.save();this.ctx.setMaterial?.(this.groundCache.normal?{normalImage:this.groundCache.normal,normalizedSurface:true,strength:materials.terrain[mapId==='showroom'?'stone':'grass']}:null);this.ctx.drawImage(this.groundCache.surface,-1050,-580);this.ctx.restore();
    if(this.groundLights)this.groundLights.draw(this.ctx,this.lights||[]);
    else if(mapId==='camp'){
      const c=this.ctx,level=this.fireLevel??.6;c.save();c.scale(1,.5);const g=c.createRadialGradient(0,0,10,0,0,210+level*80);
      g.addColorStop(0,this.ink('#dddddd18','#ffc75b24'));g.addColorStop(1,this.ink('#dddddd00','#ffc75b00'));c.fillStyle=g;c.beginPath();c.arc(0,0,210+level*80,0,Math.PI*2);c.fill();c.restore();
    }
  }
  shadow(rx,ry,y=4){if(!this.groundShadows)this.ellipse(0,y,rx,ry,this.ink('#00000055','#4e422530'));}
  tree(item){this.shadow(30,12);this.sprite('tree',{width:100*(item.scale||1)});}
  tent(){this.shadow(55,21);this.sprite('tent',{width:150,y:5});}
  log(){this.shadow(37,11);this.sprite('bench',{width:90,y:6});}
  bench(item){const frame=benchBinding(this.sprites,item);if(frame){this.shadow(39,10);this.sprite('bench',{width:frame.displayWidth||90,y:6,direction:this.sprites.manifest.bindings[item.id]});return;}this.ctx.save();const angle=item.angle||0;this.ctx.scale(Math.cos(angle)<0?-1:1,1);this.log();this.ctx.restore();}
  lantern(){this.shadow(10,4);this.sprite('lantern',{width:26});}
  sign(){this.sprite('sign',{width:78});this.caption('HUDDLERS',-35,8);}
  fence(item){this.sprite('fence',{width:90,y:5,flip:item?.x>-9});}
  shade(){this.shadow(50,20);this.sprite('shade',{width:125,y:10});}
  crate(){this.shadow(24,10);this.sprite('crate',{width:58,y:6});}
  garden(item){this.sprite(item.variant,{width:(item.variant==='rock'?30:40)*(item.scale||1),y:2});}
  fire(time){
    this.shadow(47,20);this.sprite('firewood',{width:103,y:12});
    const c=this.ctx,strength=.42+(this.fireLevel??.6)*.58+(this.fireFlare||0)*.2,t=this.reduced?0:time;
    c.save();c.translate(0,-7);c.scale(strength*(1+Math.sin(t*3.1)*.025),strength*(1+Math.cos(t*4.2)*.04));
    this.sprite(this.fireAppearance||'amber',{width:75,y:3});c.restore();
    if(!this.reduced)for(let i=0;i<3;i++){const life=(t*.23+i/3)%1;c.save();c.globalAlpha=1-life;this.sprite('spark',{x:Math.sin(t+i*2)*16,y:-50-life*35,width:3+life*2});c.restore();}
  }
  trampoline(){this.shadow(40,15);this.sprite('trampoline',{width:110,y:8});this.caption('트램펄린',32);}
  radio(item){this.shadow(26,9);this.sprite('radio',{width:58,y:3});if(item.available)this.line([[-30,9],[30,9]],this.ink('#eeeeee','#c77e37'),2);this.caption('라디오',27);}
  portal(item){
    this.shadow(35,10);this.sprite('portal',{width:100,y:5});
    this.caption(portalMark(item.destination)+' '+item.label,-113,11);if(item.available)this.caption('E · 이동',24);
  }
  gameBooth(item){
    const c=this.ctx,game=gameById(item.gameId),image=this.exhibitImage(exhibitCover(game)),frame=this.sprites.spriteFrame('gameBooth'),width=180;this.shadow(62,16);this.sprite('gameBooth',{width,y:9});
    if(image&&frame){const slot=frame.poster||{x:.15,y:.15,w:.7,h:.42},h=width*frame.h/frame.w,ground=frame.contacts?.ground||{x:frame.w*.5,y:frame.h},x=-width*ground.x/frame.w+width*slot.x,y=9-h*ground.y/frame.h+h*slot.y,w=width*slot.w,sh=h*slot.h,iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height,sw=Math.min(iw,ih*w/sh),sourceH=sw*sh/w;c.save();c.beginPath();c.roundRect(x,y,w,sh,3);c.clip();c.drawImage(image,(iw-sw)/2,(ih-sourceH)/2,sw,sourceH,x,y,w,sh);c.restore();}
    this.caption(game?.title||item.label,-150,12);if(item.available)this.caption('E · 게임 소개 보기',26);
  }
  projectile(shot){
    const c=this.ctx;if(shot.weapon==='bomb'){const r=WEAPONS.find(w=>w.id==='bomb').blast*40;c.save();c.setLineDash([4,5]);c.strokeStyle=this.ink('#ffffff80','#b75b2d99');c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,r,r*.5,0,0,Math.PI*2);c.stroke();c.restore();}
    this.shadow(6,3);c.translate(0,-shot.z*40);this.sprite(shot.weapon==='gun'?'spark':shot.weapon,{width:shot.weapon==='gun'?10:shot.weapon==='bomb'?18:12,anchorY:.5});
  }
  weaponEffect(e){const c=this.ctx,p=Math.max(0,Math.min(1,(this.sceneTime-e.at)/(e.expiresAt-e.at)));if(p>=1)return;c.translate(0,-e.z*40);c.globalAlpha*=1-p;const r=(e.kind==='explosion'?e.radius*70:38)*(this.reduced?.7:.35+p*.65);this.sprite(e.kind==='explosion'?'impact':'dust',{width:r,anchorY:.5});}
  football(ball){this.shadow(10,4);this.ctx.save();this.ctx.translate(0,-8);this.ctx.rotate(this.reduced?0:ball.rotation);this.sprite('football',{width:17,anchorY:.5});this.ctx.restore();}
}
