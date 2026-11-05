import {defaultSpriteAssets} from './camp-sprite-assets.mjs';
const gestures=new Set(['wave','heart','clap','dance','laugh','surprise']);
export function frameAt(state,elapsed=0,reduced=false,assets=defaultSpriteAssets,direction=null){
  let row=assets.manifest.character.states[state]||assets.manifest.character.states.idle;
  if(direction){const variant=row.directions?.[direction];if(!variant)throw Error('Missing character direction: '+state+'/'+direction);row=variant;}
  if(reduced)return {state,index:state==='surprise'?2:0,frame:row.frames[state==='surprise'?2:0]||row.frames[0],sheet:row.sheet};
  const total=row.durations.reduce((a,b)=>a+b,0),time=row.loop?((elapsed%total)+total)%total:Math.max(0,Math.min(total-1,elapsed));
  let at=0,index=row.frames.length-1;for(let i=0;i<row.frames.length;i++){at+=row.durations[i];if(time<at){index=i;break;}}
  return {state,index,frame:row.frames[index],sheet:row.sheet};
}
export function characterAnimation(p,time=0,reduced=true,emote=null,now=time*1000,assets=defaultSpriteAssets){
  const air=p.motion==='airborne'||p.motion==='falling'||!!p.carriedBy;
  let state=p.sitting?'sit':p.crouching?'crouch':p.moving?(p.running?'run':'walk'):'idle',elapsed=time*1000;
  if(air){state=p.carriedBy?'carried':'jump';elapsed=p.carriedBy?time*1000:(p.vz||0)>0?125:250;}
  else if(p.jumpAt>=0){state='jump';elapsed=0;}
  else if(p.landedAt>=0&&now-p.landedAt>=0&&now-p.landedAt<180){state='jump';elapsed=375;}
  const lower=frameAt(state,elapsed,reduced&&state!=='jump',assets,state==='sit'?p.renderDirection:null);
  if(p.carrying){state='carry';elapsed=time*1000;}
  else if(gestures.has(emote)&&!p.carriedBy){state=emote;elapsed=time*1000;}
  else if(['gun','snowball','bomb'].includes(p.weapon)&&!p.carriedBy){state='weapon';elapsed=p.shotAt>=0&&now>=p.shotAt&&now-p.shotAt<375?now-p.shotAt:0;}
  else if(!air&&p.hitAt>=0&&now-p.hitAt>=0&&now-p.hitAt<300){state='hit';elapsed=now-p.hitAt;}
  const chosen=frameAt(state,elapsed,reduced&&state!=='jump',assets,state==='sit'?p.renderDirection:null),frame=chosen.frame;
  // Fixed head diameter makes avatar photos stable despite generative framing variation.
  const scale=17/frame.head.radius;
  const mirror=p.facing===-1&&['walk','run','weapon'].includes(state)?-1:1;
  const combine=state!==lower.state&&['carry','weapon',...gestures].includes(state)&&['walk','run','sit','crouch','jump','carried'].includes(lower.state);
  const lowerOrigin=p.renderSeat&&lower.frame.contacts?.seat?lower.frame.contacts.seat:lower.frame.feet;
  const lowerHeadY=(lower.frame.head.y-lowerOrigin.y)*17/lower.frame.head.radius;
  const origin=combine?{x:frame.head.x,y:frame.head.y-lowerHeadY/scale}:p.renderSeat&&frame.contacts?.seat?frame.contacts.seat:frame.feet;
  const headY=(frame.head.y-origin.y)*scale,headX=(frame.head.x-origin.x)*scale;
  return {...chosen,lower,lowerOrigin,combine,seatGesture:combine&&p.renderSeat,scale,mirror,headX,headY,radius:17,lean:0,headBob:0,bob:0,origin,feet:frame.feet,hands:frame.hands,weaponSide:state==='weapon'?(p.shotAt>=0&&now-p.shotAt<220?(p.shotAimX-p.shotAimY>=0?1:-1):p.facing===-1?-1:1):0};
}
