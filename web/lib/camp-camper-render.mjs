import {CAMPER_SOLES} from './camp-camper-art.mjs';
import {spriteImageMetadata} from './camp-materials.mjs';
import {animationOffset} from './camp-sprite-animation.mjs';
import {createSpriteSurface} from './camp-sprite-assets.mjs';
import {camperPartCell,camperStrideRise} from './camp-camper-parts.mjs';
import {camperDisplay,camperFilter,camperImage} from './camp-camper-sampling.mjs';

const width=64, height=80, center=32;
const directions=['front-right','back-right','back-left','front-left'];
const action=new Map([['wave',0],['carry',1],['heart',2],['clap',2],['weapon',3],['jump',4],['carried',4],['crouch',5],['hit',6],['surprise',6],['dance',7],['laugh',7]]);
const fabric=[[0,0,0],[67,148,129],[80,136,186],[159,112,167],[187,149,74],[185,119,139]];
const partsByImage=new WeakMap();
const normalsByImage=new WeakMap();

function gradePart(c,w,h,density,isHead,styleId,slot,theme){
  if(theme!=='dark'&&(isHead||slot<=0))return;
  const frame=c.getImageData(0,0,w,h),data=frame.data;
  for(let i=0;i<data.length;i+=4){
    if(!data[i+3])continue;
    let r=data[i],g=data[i+1],b=data[i+2];
    const y=Math.floor(i/(w*4))/density;
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

export const camperSheetId=theme=>theme==='dark'?'field-camper-v2-dark':'field-camper-v2';
const style=value=>value===1?1:0;
const sheetFrame=(group,index)=>({group,index});
const walkGroup=8;
const sole=(part,outfit)=>part.group===walkGroup ? CAMPER_SOLES[outfit*8+part.index%4] : CAMPER_SOLES[(part.group+outfit)*8+part.index];

export function camperPlan(player,pose,time,reduced) {
  const visual=player.renderDirection||player.visualDirection||(player.facing===-1?'front-left':'front-right');
  const direction=Math.max(0,directions.indexOf(visual)),left=visual.endsWith('left'),back=visual.startsWith('back');
  const gait=pose.lower, moving=gait.state==='walk'||gait.state==='run';
  let lower=sheetFrame(0,direction),phase=0;
  if(gait.state==='sit') lower=sheetFrame(0,direction+4);
  else if(moving&&!reduced) {
    const cycle=player.walkCycle??(time*(gait.state==='run'?3.4:2.25)+animationOffset(player.id)/1000);
    phase=Math.floor(cycle*8)%8;
    lower=sheetFrame(walkGroup,phase*4+direction);
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
  const head=upper.group===walkGroup||upper.group===4&&back ? sheetFrame(0,direction) : upper;
  const topStyle=style(player.topStyle),hairStyle=style(player.hairStyle);
  const seated=player.renderSeat&&gait.state==='sit';
  const anchor=seated?55:sole(lower,topStyle);
  const bob=!reduced&&moving&&phase%4===2?(gait.state==='run'?-2:-1):0;
  return {lower,upper,head,topStyle,hairStyle,left,back,anchor,bob,phase};
}

export function walkingSheet(assets,plan){
  const id='field-camper-walk';
  return plan.lower.group===walkGroup&&assets.manifest.files[id]?assets.getSprite(id):null;
}

// Cache only requested parts. Changing wardrobe or theme never creates a player-specific GPU texture.
function camperFile(image){
  const meta=spriteImageMetadata.get(image);
  return meta?.assets.manifest.files[meta.id];
}
const hasHeadLayers=image=>camperFile(image)?.headLayers==='shared-face-v1';
const bodyOnlyWalk=image=>camperFile(image)?.bodyOnly===true;

function spritePart(ctx,sheet,part,styleId,layer,slot,theme,detailed=false) {
  const isHead=layer!=='body';
  let cache=partsByImage.get(sheet);
  if(!cache){cache=new Map();partsByImage.set(sheet,cache);}
  const [col,row]=camperPartCell(part,layer,styleId,detailed,hasHeadLayers(sheet)||bodyOnlyWalk(sheet));
  const key=[col,row,layer,slot,theme].join('/');
  if(cache.has(key)) return cache.get(key);
  const density=detailed?3:1, w=width*density, h=height*density;
  const tile=createSpriteSurface(ctx,w,h),c=tile.getContext('2d');
  c.drawImage(sheet,col*w,row*h,w,h,0,0,w,h);
  // WebGL must use the parent sheet's sampling when drawing a cached part.
  const meta=spriteImageMetadata.get(sheet);
  if(meta)spriteImageMetadata.set(tile,meta);
  let normals=normalsByImage.get(sheet);
  if(!normals){normals=new Map();normalsByImage.set(sheet,normals);}
  const normalKey=detailed?isHead:[part.group,part.index,styleId,layer].join('/');
  let normal=normals.get(normalKey);
  if(!normal){
    normal=createSpriteSurface(ctx,w,h);
    const nc=normal.getContext('2d'),normalPixels=nc.createImageData(w,h);
    const source=detailed?null:c.getImageData(0,0,w,h).data,dst=normalPixels.data;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4;
      if(source&&!source[i+3])continue;
      const nx=(x/density-center)/(isHead?35:27),ny=((isHead?24:49)-y/density)/(isHead?29:38);
      const length=Math.hypot(nx,ny,1);
      dst[i]=128+Math.round(126*nx/length);dst[i+1]=128+Math.round(126*ny/length);
      dst[i+2]=128+Math.round(126/length);dst[i+3]=255;
    }
    nc.putImageData(normalPixels,0,0);normals.set(normalKey,normal);
  }
  gradePart(c,w,h,density,isHead,styleId,slot,theme);
  const result={image:tile,normal,cell:[col,row]};
  cache.set(key,result);
  if(cache.size>(detailed?144:400))cache.delete(cache.keys().next().value);
  return result;
}

function motionPart(ctx,plate,cell,layer,styleId,slot,theme){
  const {color,normal,density}=plate;
  let tiles=partsByImage.get(color);
  if(!tiles){tiles=new Map();partsByImage.set(color,tiles);}
  const key=['motion',...cell,layer,styleId,slot,theme].join('/');
  if(tiles.has(key))return tiles.get(key);
  const w=width*density,h=height*density,[x,y]=cell;
  const crop=(source)=>{
    const surface=createSpriteSurface(ctx,w,h);
    surface.getContext('2d').drawImage(source,x*w,y*h,w,h,0,0,w,h);
    const meta=spriteImageMetadata.get(source);
    if(meta)spriteImageMetadata.set(surface,meta);
    return surface;
  };
  let paired=normalsByImage.get(normal);
  if(!paired){paired=new Map();normalsByImage.set(normal,paired);}
  const id=cell.join('/');
  if(!paired.has(id))paired.set(id,crop(normal));
  if(paired.size>192)paired.delete(paired.keys().next().value);
  const image=crop(color);
  gradePart(image.getContext('2d'),w,h,density,layer!=='body',styleId,slot,theme);
  const tile={image,normal:paired.get(id)};
  tiles.set(key,tile);
  if(tiles.size>192)tiles.delete(tiles.keys().next().value);
  return tile;
}

export function motionGeometry(pose,plan){
  const {lower,lowerKey,upperKey,direction,hairstyle,outfit}=plan;
  const anchor=lower.anchor;
  return {...pose,headX:0,headY:23+lower.neck-40-anchor,headBob:0,bob:0,lean:0,mirror:1,radius:17,
    weaponSide:upperKey.endsWith('-aim')?(direction<2?1:-1):pose.weaponSide,
    feet:{x:center,y:lower.feet??anchor},origin:{x:center,y:anchor},scale:1,
    artFrame:[lowerKey,upperKey,direction,hairstyle,outfit].join('/')};
}

export function paintCamperMotion(ctx,images,plan,slot,theme,withHead){
  const {lower,upper,head,hairstyle,outfit}=plan;
  const anchor=lower.anchor;
  ctx.save();
  const scale=camperDisplay(ctx,1);
  const draw=(ref,layer,offset=0,clip=null)=>{
    const plate=images[ref.plate],{density}=plate;
    const tile=motionPart(ctx,plate,ref.cell,layer,outfit,layer==='body'?slot:0,theme);
    const filter=camperFilter(scale,density);
    const image=camperImage(ctx,tile,filter,scale/density,ctx.recording?.active);
    ctx.save();
    ctx.imageSmoothingEnabled=filter!=='nearest';
    ctx.setMaterial?.({
      lighting:'lit',normalImage:tile.normal,normalizedSurface:true,normalKind:'authored',
      camperFilter:filter,strength:layer==='body'?.3:.38,
      ambientLift:theme==='dark'?[.14,.14,.14]:[.16,.15,.14],camperLayer:layer,camperCell:ref.cell,
    });
    if(clip){
      ctx.beginPath();
      ctx.rect(-center,clip[0]-anchor,width,clip[1]-clip[0]);
      ctx.clip();
    }
    ctx.drawImage(image,-center,-anchor+offset,width,height);
    ctx.restore();
  };
  const drawHead=()=>{
    const face=plan.upperKey==='idle.blink'?head.blink:head.face;
    draw(face,'face',lower.neck-40);
    draw(head.hairs[hairstyle],'hair',lower.neck-40);
  };
  if(withHead&&upper.foreground)drawHead();
  const split=lower.waist??56;
  if(lower===upper)draw(upper,'body');
  else{
    draw(lower,'body',0,[split,height]);
    draw(upper,'body',lower.neck-upper.neck,[0,split+1]);
  }
  if(withHead&&!upper.foreground)drawHead();
  ctx.restore();
}

export function camperGeometry(pose,plan) {
  const headY=23-plan.anchor+plan.bob;
  return {...pose,headX:0,headY,headBob:0,bob:0,lean:0,mirror:1,radius:17,
    feet:{x:center,y:sole(plan.lower,plan.topStyle)},origin:{x:center,y:plan.anchor},scale:1,
    artFrame:[plan.lower.group,plan.lower.index,plan.upper.group,plan.upper.index,plan.head.group,plan.head.index,plan.bob,plan.left].join('/')};
}

export function paintCamper(ctx,sheet,plan,slot,theme,withHead,walkSheet) {
  const usingWalkArt=!!walkSheet&&plan.lower.group===walkGroup;
  const sharedWalkHead=usingWalkArt&&hasHeadLayers(sheet)&&(hasHeadLayers(walkSheet)||bodyOnlyWalk(walkSheet));
  ctx.save();
  const screenScale=camperDisplay(ctx,usingWalkArt&&!sharedWalkHead?3:1);
  const recording=ctx.recording?.active;
  const drawPart=(part,layer,top=0,bottom=height,offset=0)=>{
    const detailed=!!walkSheet&&part.group===walkGroup;
    const density=detailed?3:1;
    const isHead=layer!=='body';
    const styleId=layer==='face'?0:isHead?plan.hairStyle:plan.topStyle;
    const tile=spritePart(ctx,detailed?walkSheet:sheet,part,styleId,layer,isHead?0:slot,theme,detailed);
    const filter=camperFilter(screenScale,density);
    const image=camperImage(ctx,tile,filter,screenScale/density,recording);
    ctx.save();
    ctx.imageSmoothingEnabled=filter!=='nearest';
    ctx.setMaterial?.({lighting:'lit',normalImage:tile.normal,normalizedSurface:true,
      camperFilter:filter,strength:isHead?.38:.3,ambientLift:light,
      camperLayer:layer,camperCell:tile.cell,normalKind:'procedural'});
    if(part.group===4&&plan.left)ctx.scale(-1,1);
    if(top||bottom!==height){
      ctx.beginPath();ctx.rect(-center,top-plan.anchor+offset,width,bottom-top);ctx.clip();
    }
    ctx.drawImage(image,-center,-plan.anchor+offset,width,height);
    ctx.restore();
  };
  const drawHead=(part,offset)=>{
    const image=walkSheet&&part.group===walkGroup?walkSheet:sheet;
    if(hasHeadLayers(image)){
      if(part.group===walkGroup)offset+=camperStrideRise[Math.floor(part.index/4)];
      drawPart(part,'face',0,height,offset);
    }
    // Historical sheets store their entire head in the hairstyle's cell.
    drawPart(part,'hair',0,height,offset);
  };
  const light=theme==='dark'?[.14,.14,.14]:[.16,.15,.14];
  const foregroundHands=plan.upper.group===4;
  // Each painted step already includes the rise and fall of the head.
  const paintedWalk=walkSheet&&plan.upper.group===walkGroup;
  const bob=paintedWalk?0:plan.bob;
  if(withHead&&foregroundHands) drawHead(plan.head,plan.bob);
  const split=56;
  if(plan.lower!==plan.upper||bob){
    drawPart(plan.lower,'body',split,height);
    drawPart(plan.upper,'body',0,split+1,bob);
  }else drawPart(plan.upper,'body');
  if(withHead&&!foregroundHands){
    // Locomotion retains the standing face and hairstyle. Follow the painted
    // stride with the same displacement for both parts.
    if(paintedWalk&&sharedWalkHead)drawHead(plan.head,camperStrideRise[plan.phase]);
    else drawHead(paintedWalk?plan.upper:plan.head,bob);
  }
  ctx.restore();
}
