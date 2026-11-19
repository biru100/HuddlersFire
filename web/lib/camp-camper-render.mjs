import {CAMPER_SOLES} from './camp-camper-art.mjs';
import {spriteImageMetadata} from './camp-materials.mjs';
import {animationOffset} from './camp-sprite-animation.mjs';
import {createSpriteSurface} from './camp-sprite-assets.mjs';

const width=64, height=80, center=32;
const directions=['front-right','back-right','back-left','front-left'];
const action=new Map([['wave',0],['carry',1],['heart',2],['clap',2],['weapon',3],['jump',4],['carried',4],['crouch',5],['hit',6],['surprise',6],['dance',7],['laugh',7]]);
const fabric=[[0,0,0],[67,148,129],[80,136,186],[159,112,167],[187,149,74],[185,119,139]];
const partsByImage=new WeakMap();
const normalsByImage=new WeakMap();

export const camperSheetId=theme=>theme==='dark'?'field-camper-v2-dark':'field-camper-v2';
const style=value=>value===1?1:0;
const sheetFrame=(group,index)=>({group,index});
const sole=(part,outfit)=>CAMPER_SOLES[(part.group+outfit)*8+part.index];

export function camperPlan(player,pose,time,reduced) {
  const visual=player.renderDirection||player.visualDirection||(player.facing===-1?'front-left':'front-right');
  const direction=Math.max(0,directions.indexOf(visual)),left=visual.endsWith('left'),back=visual.startsWith('back');
  const gait=pose.lower, moving=gait.state==='walk'||gait.state==='run';
  let lower=sheetFrame(0,direction),phase=0;
  if(gait.state==='sit') lower=sheetFrame(0,direction+4);
  else if(moving) {
    phase=gait.index%6;
    if([1,2,4,5].includes(phase)) lower=sheetFrame(2,direction+(phase>=4?4:0));
  } else if(gait.state==='idle'&&!reduced) {
    const cycle=(time*1000+animationOffset(player.id))%3400;
    if(cycle>=880&&cycle<1820) lower=sheetFrame(6,direction);
    else if(cycle>=2420&&cycle<2570) lower=sheetFrame(6,direction+4);
  } else if(action.has(gait.state)) lower=sheetFrame(4,action.get(gait.state));

  let upper=lower;
  if(action.has(pose.state)) {
    const idleKey=pose.index%2===1&&['wave','heart','clap','dance','laugh','surprise'].includes(pose.state);
    upper=idleKey?sheetFrame(0,direction):sheetFrame(4,action.get(pose.state));
    if(!pose.combine) lower=upper;
  }
  const head=upper.group===4&&back ? sheetFrame(0,direction) : upper;
  const topStyle=style(player.topStyle),hairStyle=style(player.hairStyle);
  const seated=player.renderSeat&&gait.state==='sit';
  const anchor=seated?55:sole(lower,topStyle);
  const bob=!reduced&&moving&&[1,4].includes(phase)?(gait.state==='run'?-2:-1):0;
  return {lower,upper,head,topStyle,hairStyle,left,back,anchor,bob,phase};
}

// Cache only requested parts. Changing wardrobe or theme never creates a player-specific GPU texture.
function spritePart(ctx,sheet,part,styleId,isHead,slot,theme) {
  let cache=partsByImage.get(sheet);
  if(!cache){cache=new Map();partsByImage.set(sheet,cache);}
  const key=[part.group,part.index,styleId,isHead,slot,theme].join('/');
  if(cache.has(key)) return cache.get(key);
  const sx=((isHead?0:4)+part.index%4)*width;
  const sy=((part.group+styleId)*2+Math.floor(part.index/4))*height;
  const tile=createSpriteSurface(ctx,width,height),c=tile.getContext('2d');
  c.drawImage(sheet,sx,sy,width,height,0,0,width,height);
  // Record nearest sampling for the sliced canvas on the WebGL path too.
  const meta=spriteImageMetadata.get(sheet);
  if(meta)spriteImageMetadata.set(tile,meta);
  let normals=normalsByImage.get(sheet);
  if(!normals){normals=new Map();normalsByImage.set(sheet,normals);}
  const normalKey=[part.group,part.index,styleId,isHead].join('/');
  let normal=normals.get(normalKey);
  if(!normal){
    normal=createSpriteSurface(ctx,width,height);
    const nc=normal.getContext('2d'),normalPixels=nc.createImageData(width,height);
    const source=c.getImageData(0,0,width,height).data,dst=normalPixels.data;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4;
      if(!source[i+3])continue;
      const nx=(x-center)/(isHead?35:27),ny=((isHead?24:49)-y)/(isHead?29:38);
      const length=Math.hypot(nx,ny,1);
      dst[i]=128+Math.round(126*nx/length);dst[i+1]=128+Math.round(126*ny/length);
      dst[i+2]=128+Math.round(126/length);dst[i+3]=255;
    }
    nc.putImageData(normalPixels,0,0);normals.set(normalKey,normal);
  }
  if(theme==='dark'||(!isHead&&slot>0)){
    const frame=c.getImageData(0,0,width,height),data=frame.data;
    for(let i=0;i<data.length;i+=4){
      if(!data[i+3])continue;
      let r=data[i],g=data[i+1],b=data[i+2];
      const y=Math.floor(i/(width*4));
      const cloth=styleId?g>r*1.14&&Math.abs(g-b)<22:g>r*.85&&r>b*1.12&&g>b*1.25;
      if(!isHead&&slot>0&&y<58&&cloth){
        const light=(.23*r+.62*g+.15*b)/(styleId?74:106),color=fabric[slot];
        r=color[0]*light; g=color[1]*light; b=color[2]*light;
      }
      if(theme==='dark'){const gray=Math.round(.2126*r+.7152*g+.0722*b); r=gray;g=gray;b=gray;}
      data[i]=r;data[i+1]=g;data[i+2]=b;
    }
    c.putImageData(frame,0,0);
  }
  const result={image:tile,normal};
  cache.set(key,result);
  if(cache.size>400)cache.delete(cache.keys().next().value);
  return result;
}

export function camperGeometry(pose,plan) {
  const headY=23-plan.anchor+plan.bob;
  return {...pose,headX:0,headY,headBob:0,bob:0,lean:0,mirror:1,radius:17,
    feet:{x:center,y:sole(plan.lower,plan.topStyle)},origin:{x:center,y:plan.anchor},scale:1,
    artFrame:[plan.lower.group,plan.lower.index,plan.upper.group,plan.upper.index,plan.head.group,plan.head.index,plan.bob,plan.left].join('/')};
}

export function paintCamper(ctx,sheet,plan,slot,theme,withHead) {
  const drawPart=(part,isHead,top=0,bottom=height,offset=0)=>{
    const moving=isHead?plan.hairStyle:plan.topStyle;
    const {image,normal}=spritePart(ctx,sheet,part,moving,isHead,isHead?0:slot,theme);
    ctx.save();
    ctx.setMaterial?.({lighting:'lit',normalImage:normal,strength:isHead?.38:.3,ambientLift:light});
    if(part.group===4&&plan.left)ctx.scale(-1,1);
    if(top||bottom!==height){
      ctx.beginPath();ctx.rect(-center,top-plan.anchor+offset,width,bottom-top);ctx.clip();
    }
    ctx.drawImage(image,-center,-plan.anchor+offset);
    ctx.restore();
  };
  ctx.save();ctx.imageSmoothingEnabled=false;
  const light=theme==='dark'?[.14,.14,.14]:[.16,.15,.14];
  if(withHead) drawPart(plan.head,true,0,height,plan.bob);
  const split=56;
  if(plan.lower!==plan.upper||plan.bob){
    drawPart(plan.lower,false,split,height);
    drawPart(plan.upper,false,0,split+1,plan.bob);
  }else drawPart(plan.upper,false);
  ctx.restore();
}
