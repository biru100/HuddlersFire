import {animationOffset} from './camp-sprite-animation.mjs';

export const camperFacings=['front-right','back-right','back-left','front-left'];
const expressions=new Set(['wave','heart','clap','dance','laugh','surprise']);
const weaponActions={gun:'fire',snowball:'throw',bomb:'throw'};

// Display-only events are derived from successive authoritative snapshots.
export function camperTransition(previous,player,passenger,now){
  if(!previous||player.motion!=='grounded')return null;
  const sitting=!!player.sitting;
  if(sitting!==previous.sitting)return {key:sitting?'sit.enter':'sit.exit',until:now+145};
  if(previous.carrying&&!player.carrying&&passenger?.thrown
    &&passenger.motion==='airborne'&&!(passenger.hitAt>=0&&now-passenger.hitAt<280))
    return {key:'throw.release',until:now+170};
  return previous.transition?.until>now?previous.transition:null;
}

const recent=(at,now,span)=>at>=0&&now>=at&&now-at<span;

function lowerFrame(player,time,now,reduced){
  if(player.carriedBy)return 'carry.passenger';
  if(player.motion==='falling')return 'fall.edge';
  if(player.motion==='airborne'){
    if(recent(player.hitAt,now,300))return 'hit.impact';
    if(player.thrown)return 'throw.passenger';
    return player.vz>0?'jump.rise':'jump.fall';
  }
  if(player.jumpAt>=0)return 'jump.prepare';
  if(recent(player.landedAt,now,150))return 'jump.land';
  if(!reduced&&player.camperTransition?.until>now)return player.camperTransition.key;
  if(player.sitting)return 'sit.hold';
  if(player.crouching)return 'crouch.hold';
  if(player.moving&&!reduced){
    const cycle=player.walkCycle??(time*(player.running?3.4:2.25)+animationOffset(player.id)/1000);
    const step=((Math.floor(cycle*8)%8)+8)%8+1;
    return (player.running?'run':'walk')+'.step-'+step;
  }
  if(!reduced){
    const period=(time*1000+animationOffset(player.id))%3400;
    if(period>=1050&&period<1820)return 'idle.inhale';
    if(period>=2420&&period<2570)return 'idle.blink';
  }
  return 'idle.stand';
}

export function selectCamperMotion(manifest,player,pose,time,now,reduced){
  const facing=player.renderDirection||player.visualDirection||(player.facing===-1?'front-left':'front-right');
  const direction=Math.max(0,camperFacings.indexOf(facing)),outfit=player.topStyle===1?1:0;
  const hairstyle=player.hairStyle===1?1:0;
  let lowerKey=lowerFrame(player,time,now,reduced),upperKey=lowerKey;
  if(lowerKey==='idle.blink'&&direction%3!==0)lowerKey=upperKey='idle.stand';
  const interrupted=['hit.impact','throw.release','throw.passenger','carry.passenger','fall.edge'].includes(lowerKey);
  if(!interrupted){
    if(player.carrying)upperKey='carry.holder';
    else if(expressions.has(pose.state)&&(reduced||pose.index%2===0))upperKey='emote.'+pose.state;
    else if(pose.state==='weapon'&&weaponActions[player.weapon]){
      const action=recent(player.shotAt,now,190)?weaponActions[player.weapon]:'aim';
      upperKey='weapon.'+player.weapon+'-'+action;
    }else if(pose.state==='hit')upperKey='hit.impact';
    if(!pose.combine&&upperKey!==lowerKey)lowerKey=upperKey;
  }
  const lower=manifest.frames[lowerKey]?.[direction]?.[outfit];
  const upper=manifest.frames[upperKey]?.[direction]?.[outfit];
  const head=manifest.heads[direction];
  if(!lower||!upper||!head)return null;
  return {lower,upper,head,lowerKey,upperKey,direction,hairstyle,outfit};
}

export function camperMotionAssets(assets){
  const motion=assets.manifest.camperMotion;
  if(!motion)return null;
  const images={};
  for(const [key,plate] of Object.entries(motion.plates)){
    const color=assets.getSprite(plate.color),normal=assets.getSprite(plate.normal);
    if(!color||!normal||color.width!==normal.width||color.height!==normal.height)return null;
    images[key]={color,normal,density:plate.density};
  }
  return {motion,images};
}
