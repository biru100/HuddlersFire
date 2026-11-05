import { toneIndex, TONE_MARKS } from './camp-appearance.mjs';
import { characterAnimation } from './camp-sprite-animation.mjs';
import { defaultSpriteAssets } from './camp-sprite-assets.mjs';
const avatarUrl = value => typeof value === 'string' && /^https:\/\/cdn\.discordapp\.com\/avatars\/\d{1,24}\/(?:a_)?[a-f0-9]+\.png(?:\?size=\d+)?$/.test(value);

export class AvatarImages {
  constructor(onChange = () => {}, ImageType = globalThis.Image) {
    this.entries = new Map(); this.onChange = onChange; this.ImageType = ImageType;
  }
  get(url) {
    if (!avatarUrl(url) || !this.ImageType) return null;
    let entry = this.entries.get(url);
    if (!entry) {
      const image = new this.ImageType(); entry = { image, failed: false }; this.entries.set(url, entry);
      if (this.entries.size > 64) {
        const oldest = this.entries.keys().next().value, previous = this.entries.get(oldest);
        previous.image.onload = previous.image.onerror = null; this.entries.delete(oldest);
      }
      image.onload = () => this.onChange();
      image.onerror = () => { entry.failed = true; this.onChange(); };
      try { image.src = url; } catch { entry.failed = true; }
    }
    const image = entry.image;
    return !entry.failed && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 ? image : null;
  }
  dispose() {
    for (const { image } of this.entries.values()) image.onload = image.onerror = null;
    this.entries.clear();
  }
}
export const characterPose=characterAnimation;
function body(ctx,image,frame,scale,mirror,clip=null,origin=frame.feet){
  ctx.save();if(clip){ctx.beginPath();if(clip.belly){ctx.moveTo(-80,clip.top);ctx.lineTo(80,clip.top);ctx.lineTo(80,-15);ctx.lineTo(14,-15);ctx.quadraticCurveTo(0,1,-14,-15);ctx.lineTo(-80,-15);ctx.closePath();}else ctx.rect(-80,clip.top,160,clip.bottom-clip.top);ctx.clip();}ctx.scale(mirror,1);
  ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,-origin.x*scale,-origin.y*scale,frame.w*scale,frame.h*scale);ctx.restore();
}
export function drawCharacter(ctx,p,{time=0,now=time*1000,reduced=true,emote=null,avatar=null,blankHead=false,theme='color',assets=defaultSpriteAssets}={}){
  const pose=characterAnimation(p,time,reduced,emote,now,assets),slot=toneIndex(p.color),image=assets.getSprite(pose.sheet||assets.characterSheet(slot,theme)),{frame,scale,mirror}=pose;
  ctx.save();
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
  // Avatar stays in screen orientation, independently of body facing.
  ctx.save();ctx.translate(pose.headX*mirror,pose.headY);ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fillStyle=theme==='dark'?'#f4f4f4':'#fff0cf';ctx.fill();
  const w=avatar?.naturalWidth||avatar?.width,h=avatar?.naturalHeight||avatar?.height;
  if(avatar&&w>0&&h>0){const size=Math.min(w,h);ctx.save();ctx.beginPath();ctx.arc(0,0,15.2,0,Math.PI*2);ctx.clip();ctx.drawImage(avatar,(w-size)/2,(h-size)/2,size,size,-15.2,-15.2,30.4,30.4);ctx.restore();}
  else if(!blankHead){ctx.fillStyle=theme==='dark'?'#303030':'#65432c';for(const x of [-5,5]){ctx.beginPath();ctx.ellipse(x,-1,1.4,emote==='surprise'?2.8:1.8,0,0,Math.PI*2);ctx.fill();}ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(0,4,emote==='laugh'?3:2,0,Math.PI);ctx.stroke();}
  ctx.restore();
  // Redraw only isolated hands which can cross in front of the portrait.
  if(image)for(const hand of frame.hands){if(hand.y>frame.head.y+frame.head.radius)continue;ctx.save();ctx.scale(mirror,1);ctx.drawImage(image,frame.x+hand.x,frame.y+hand.y,hand.w,hand.h,(hand.x-pose.origin.x)*scale,(hand.y-pose.origin.y)*scale,hand.w*scale,hand.h*scale);ctx.restore();}
  if(pose.weaponSide)assets.drawSprite(ctx,p.weapon,{x:pose.weaponSide*16,y:-15,width:p.weapon==='gun'?22:13,theme,flip:pose.weaponSide<0});
  ctx.fillStyle=theme==='dark'?'#ffffff':'#fff7df';ctx.strokeStyle=theme==='dark'?'#242424':'#6a4230';ctx.lineWidth=2;ctx.font='700 6px sans-serif';ctx.textAlign='center';ctx.strokeText(TONE_MARKS[slot],0,-12);ctx.fillText(TONE_MARKS[slot],0,-12);
  if(emote==='heart')assets.drawSprite(ctx,'heart',{x:0,y:pose.headY-20,width:12,theme});
  if(emote==='clap')assets.drawSprite(ctx,'spark',{x:0,y:pose.headY-24,width:reduced?8:6+Math.sin(time*8)*2,theme});
  ctx.restore();return pose;
}
