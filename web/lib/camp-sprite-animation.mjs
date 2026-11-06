import {defaultSpriteAssets} from './camp-sprite-assets.mjs';
const gestures=new Set(['wave','heart','clap','dance','laugh','surprise']);
export function animationOffset(id=''){let hash=0;for(const ch of String(id))hash=(Math.imul(hash,31)+ch.charCodeAt(0))>>>0;return hash%997;}
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
  const clock=time*1000+animationOffset(p.id);
  let state=p.sitting?'sit':p.crouching?'crouch':p.moving?(p.running?'run':'walk'):'idle',elapsed=clock;
  if(air){state=p.carriedBy?'carried':'jump';elapsed=p.carriedBy?time*1000:(p.vz||0)>0?125:250;}
  else if(p.jumpAt>=0){state='jump';elapsed=0;}
  else if(p.landedAt>=0&&now-p.landedAt>=0&&now-p.landedAt<180){state='jump';elapsed=375;}
  const directionFor=s=>s==='sit'?p.renderDirection:['idle','walk','run'].includes(s)&&p.visualDirection?.startsWith('back')&&(assets.manifest.character.locomotionDirections||assets.manifest.character.states[s].directions?.back)?'back':null;
  const lower=frameAt(state,elapsed,reduced&&state!=='jump',assets,directionFor(state));
  if(p.carrying){state='carry';elapsed=clock;}
  else if(gestures.has(emote)&&!p.carriedBy){state=emote;elapsed=clock;}
  else if(['gun','snowball','bomb'].includes(p.weapon)&&!p.carriedBy){state='weapon';elapsed=p.shotAt>=0&&now>=p.shotAt&&now-p.shotAt<375?now-p.shotAt:0;}
  else if(!air&&p.hitAt>=0&&now-p.hitAt>=0&&now-p.hitAt<300){state='hit';elapsed=now-p.hitAt;}
  const chosen=frameAt(state,elapsed,reduced&&state!=='jump',assets,directionFor(state)),frame=chosen.frame;
  // Fixed head diameter makes avatar photos stable despite generative framing variation.
  const scale=17/frame.head.radius;
  const mirror=(p.visualDirection?.endsWith('left')||!p.visualDirection&&p.facing===-1)&&['idle','walk','run','weapon'].includes(state)?-1:1;
  const combine=state!==lower.state&&['carry','weapon',...gestures].includes(state)&&['walk','run','sit','crouch','jump','carried'].includes(lower.state);
  const lowerOrigin=p.renderSeat&&lower.frame.contacts?.seat?lower.frame.contacts.seat:lower.frame.feet;
  const lowerHeadY=(lower.frame.head.y-lowerOrigin.y)*17/lower.frame.head.radius;
  const origin=combine?{x:frame.head.x,y:frame.head.y-lowerHeadY/scale}:p.renderSeat&&frame.contacts?.seat?frame.contacts.seat:frame.feet;
  const headY=(frame.head.y-origin.y)*scale,headX=(frame.head.x-origin.x)*scale;
  return {...chosen,direction:p.renderSeat?p.renderDirection:['idle','walk','run'].includes(state)?p.visualDirection||'front-right':'front-right',lower,lowerOrigin,combine,seatGesture:combine&&p.renderSeat,scale,mirror,headX,headY,radius:17,lean:0,headBob:0,bob:0,origin,feet:frame.feet,hands:frame.hands,weaponSide:state==='weapon'?(p.shotAt>=0&&now-p.shotAt<220?(p.shotAimX-p.shotAimY>=0?1:-1):p.facing===-1?-1:1):0};
}
