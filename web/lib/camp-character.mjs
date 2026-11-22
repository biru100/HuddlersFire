import { toneIndex, TONE_MARKS } from './camp-appearance.mjs';
import { characterAnimation } from './camp-sprite-animation.mjs';
import { defaultSpriteAssets,createSpriteSurface } from './camp-sprite-assets.mjs';
import {camperPlan,camperGeometry,camperSheetId,paintCamper,walkingSheet,motionGeometry,paintCamperMotion} from './camp-camper-render.mjs';
import {camperMotionAssets,selectCamperMotion} from './camp-camper-motion.mjs';

function newMotion(assets,player,pose,time,now,reduced){
  const atlases=camperMotionAssets(assets);
  if(!atlases)return null;
  const plan=selectCamperMotion(atlases.motion,player,pose,time,now,reduced);
  return plan?{images:atlases.images,plan}:null;
}

export function characterPose(p,time=0,reduced=true,emote=null,now=time*1000,assets=defaultSpriteAssets) {
  const pose=characterAnimation(p,time,reduced,emote,now,assets);
  const motion=newMotion(assets,p,pose,time,now,reduced);
  if(motion)return motionGeometry(pose,motion.plan);
  return assets.manifest.files?.[camperSheetId('color')] ? camperGeometry(pose,camperPlan(p,pose,time,reduced)) : pose;
}
const headSurfaces=new Map();
function face(c,theme,emote,blank,direction){
  c.fillStyle=theme==='dark'?'#f4f4f4':'#fff0cf';c.beginPath();c.arc(0,0,16,0,Math.PI*2);c.fill();
  c.strokeStyle=theme==='dark'?'#8c8c8c':'#987653';c.lineWidth=.8;c.stroke();
  if(blank||direction?.startsWith('back'))return;
  const shift=direction?.endsWith('left')?-2.5:2.5;c.fillStyle=theme==='dark'?'#303030':'#65432c';
  for(const x of [-5,5]){c.beginPath();c.ellipse(x+shift,-1,1.4,emote==='surprise'?2.8:1.8,0,0,Math.PI*2);c.fill();}
  c.strokeStyle=c.fillStyle;c.lineWidth=1.3;c.beginPath();c.arc(shift,4,emote==='laugh'?3:2,0,Math.PI);c.stroke();
}
function nightHead(ctx,theme,emote,blank,direction){
  const key=[theme,emote,blank,direction].join(':');if(headSurfaces.has(key))return headSurfaces.get(key);
  const image=createSpriteSurface(ctx,36,36),normal=createSpriteSurface(ctx,36,36),c=image.getContext('2d'),n=normal.getContext('2d'),pixels=n.createImageData(36,36);
  c.translate(18,18);face(c,theme,emote,blank,direction);
  for(let y=0;y<36;y++)for(let x=0;x<36;x++){const nx=(x+.5-18)/16,ny=(18-y-.5)/16,r=nx*nx+ny*ny,p=(y*36+x)*4;pixels.data[p]=Math.round((nx*.5+.5)*255);pixels.data[p+1]=Math.round((ny*.5+.5)*255);pixels.data[p+2]=Math.round((Math.sqrt(Math.max(0,1-r))*.5+.5)*255);pixels.data[p+3]=r<=1?255:0;}
  n.putImageData(pixels,0,0);const result={image,normal};headSurfaces.set(key,result);return result;
}
function body(ctx,image,frame,scale,mirror,clip=null,origin=frame.feet){
  ctx.save();if(clip){ctx.beginPath();if(clip.belly){ctx.moveTo(-80,clip.top);ctx.lineTo(80,clip.top);ctx.lineTo(80,-15);ctx.lineTo(14,-15);ctx.quadraticCurveTo(0,1,-14,-15);ctx.lineTo(-80,-15);ctx.closePath();}else ctx.rect(-80,clip.top,160,clip.bottom-clip.top);ctx.clip();}ctx.scale(mirror,1);
  ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,-origin.x*scale,-origin.y*scale,frame.w*scale,frame.h*scale);ctx.restore();
}
export function legacyCamperImage(assets,sheetId,pose,slot,theme){
  if(assets.manifest.fallbackFiles&&assets.manifest.files[sheetId]&&!assets.spriteStatus([sheetId]).failed.length)return null;
  return assets.getSprite(pose.sheet||assets.characterSheet(slot,theme));
}
export function drawCharacter(ctx,p,{time=0,now=time*1000,reduced=true,emote=null,blankHead=false,shadowOnly=false,theme='color',assets=defaultSpriteAssets}={}){
  const originalPose=characterAnimation(p,time,reduced,emote,now,assets),slot=toneIndex(p.color);
  const sheetId=camperSheetId(theme);
  const camper=assets.manifest.files?.[sheetId]&&assets.getSprite(sheetId);
  const motion=newMotion(assets,p,originalPose,time,now,reduced);
  const plan=!motion&&camper&&camperPlan(p,originalPose,time,reduced);
  const pose=motion?motionGeometry(originalPose,motion.plan):plan?camperGeometry(originalPose,plan):originalPose;
  const image=camper||motion?null:legacyCamperImage(assets,sheetId,pose,slot,theme),{frame,scale,mirror}=pose;
  ctx.save();
  if(motion)paintCamperMotion(ctx,motion.images,motion.plan,slot,theme,shadowOnly||!blankHead);
  else if(camper)paintCamper(ctx,camper,plan,slot,theme,shadowOnly||!blankHead,walkingSheet(assets,plan));
  if(image){
    if(pose.combine){const lower=pose.lower.frame,ls=17/lower.head.radius;
      const lowerImage=assets.getSprite(pose.lower.sheet||assets.characterSheet(slot,theme)),split=(lower.waist-pose.lowerOrigin.y)*ls;
      if(pose.seatGesture){
        if(lowerImage)body(ctx,lowerImage,lower,ls,1,null,pose.lowerOrigin);
        // Keep the fire-facing jacket/pelvis; expressive arms can move beside it.
        ctx.save();ctx.beginPath();ctx.rect(-80,-140,160,240);ctx.rect(-13,pose.headY+15,26,90);ctx.clip('evenodd');body(ctx,image,frame,scale,mirror,{top:-140,bottom:split+4},pose.origin);ctx.restore();
      }else{if(lowerImage)body(ctx,lowerImage,lower,ls,mirror,{top:split-2,bottom:100},pose.lowerOrigin);body(ctx,image,frame,scale,mirror,{top:-140,bottom:split+3},pose.origin);}
    }else body(ctx,image,frame,scale,mirror,null,pose.origin);
  }
  if((!camper&&!motion)||(!shadowOnly&&blankHead)){
    ctx.save();ctx.translate(pose.headX*mirror,pose.headY);
    ctx.save();ctx.setMaterial?.({lighting:'lit'});ctx.fillStyle=theme==='dark'?'#9c9c9c':'#d4b88b';ctx.beginPath();ctx.roundRect(-6,12,12,10,3);ctx.fill();ctx.restore();
    if(ctx.lightingProfile?.night){
      const head=nightHead(ctx,theme,emote,blankHead,pose.direction);
      ctx.setMaterial({lighting:'lit',normalImage:head.normal,strength:.5,ambientLift:theme==='dark'?[.12,.12,.12]:[.18,.12,.04]});
      ctx.drawImage(head.image,-18,-18,36,36);
    }else{
      face(ctx,theme,emote,blankHead,pose.direction);
    }
    ctx.restore();
  }
  // Redraw only isolated hands which can cross in front of the face.
  if(image)for(const hand of frame.hands){if(hand.y>frame.head.y+frame.head.radius)continue;ctx.save();ctx.scale(mirror,1);ctx.drawImage(image,frame.x+hand.x,frame.y+hand.y,hand.w,hand.h,(hand.x-pose.origin.x)*scale,(hand.y-pose.origin.y)*scale,hand.w*scale,hand.h*scale);ctx.restore();}
  if(pose.weaponSide)assets.drawSprite(ctx,p.weapon,{x:pose.weaponSide*16,y:-15,width:p.weapon==='gun'?22:13,theme,flip:pose.weaponSide<0});
  if(!shadowOnly){
    const night=ctx.lightingProfile?.night,{x,y}=pose.toneMark??{x:0,y:-12};
    if(night){ctx.save();ctx.setMaterial?.({lighting:'lit'});}
    ctx.fillStyle=theme==='dark'?'#ffffff':'#fff7df';
    ctx.strokeStyle=theme==='dark'?'#242424':'#6a4230';
    ctx.lineWidth=2;ctx.font='700 6px sans-serif';ctx.textAlign='center';
    ctx.strokeText(TONE_MARKS[slot],x,y);ctx.fillText(TONE_MARKS[slot],x,y);
    if(night)ctx.restore();
  }
  if(!shadowOnly&&emote==='heart')assets.drawSprite(ctx,'heart',{x:0,y:pose.headY-20,width:12,theme});
  if(!shadowOnly&&emote==='clap')assets.drawSprite(ctx,'spark',{x:0,y:pose.headY-24,width:reduced?8:6+Math.sin(time*8)*2,theme});
  ctx.restore();return pose;
}
