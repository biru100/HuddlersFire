import { isSeated } from './camp-seats.mjs';
import { CAMP_MAP } from './camp-maps.mjs';
export const MAX_FIRE_FUEL = 240;
export const STOKE_COOLDOWN = 10 * 60_000;
export const FIRE_XP_PER_LEVEL = 3;
export const FIRE_STYLES = [
  { id:'amber', name:'따뜻한 주황', level:1, colors:['#e36c35','#f4933b','#ffc15b','#f89e42','#f5b94e'], core:'#ffe3a0', glow:'#ed912740', spark:'#ffd18a', width:1, height:1 },
  { id:'gold', name:'황금 꽃불', level:2, colors:['#d89024','#f7b53c','#ffe183','#edc158','#fff0ae'], core:'#fff6ce', glow:'#f9ce5140', spark:'#ffeb99', width:1.2, height:.85 },
  { id:'blue', name:'푸른 물결', level:3, colors:['#296ba8','#3f9fd0','#8adcf3','#58b9df','#b2f2ff'], core:'#e3fbff', glow:'#5dbcef40', spark:'#a4e9ff', width:.85, height:1.25 },
  { id:'jade', name:'초록 오로라', level:4, colors:['#28886d','#47b58a','#97eac0','#6ac6a1','#c0f4cf'], core:'#e3ffe4', glow:'#6cdaa040', spark:'#b5ffd0', width:1.15, height:1.12 },
  { id:'violet', name:'보랏빛 별불', level:5, colors:['#8156b0','#ac7edc','#e2bcf9','#bf91e8','#f6d7ff'], core:'#fff0ff', glow:'#bf83ee40', spark:'#edccff', width:1, height:1.18 },
];
export const fireLevel = fire => Math.min(FIRE_STYLES.length,1+Math.floor(fire.xp/FIRE_XP_PER_LEVEL));
export const fireStyle = id => FIRE_STYLES.find(s=>s.id===id) || null;
export const stokeRemaining = (p,now) => !p || p.lastStokeAt<0 ? 0 : Math.max(0,STOKE_COOLDOWN-Math.max(0,now-p.lastStokeAt));
export const stokeWaitLabel = remaining => { const seconds=Math.ceil(remaining/1000);return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'); };
export const emptyFire = (now=0) => ({ fuel:120, updatedAt:now, stokedAt:-1, revision:0, xp:0, style:'amber' });
export const fuelAt = (fire,now) => Math.max(0,Math.min(MAX_FIRE_FUEL,fire.fuel-Math.max(0,now-fire.updatedAt)/1000));
export const fireStrength = (fire,now) => .12+.88*fuelAt(fire,now)/MAX_FIRE_FUEL;
export const flareAt = (fire,now) => fire.stokedAt<0?0:Math.max(0,1-Math.max(0,now-fire.stokedAt)/2200);
export function readFire(value) {
  if(!value || !Number.isFinite(value.fuel)||value.fuel<0||value.fuel>MAX_FIRE_FUEL||!Number.isFinite(value.updatedAt)||value.updatedAt<0||
    !Number.isFinite(value.stokedAt)||value.stokedAt< -1||value.stokedAt>value.updatedAt||!Number.isSafeInteger(value.revision)||value.revision<0||
    !Number.isSafeInteger(value.xp)||value.xp<0||!fireStyle(value.style)||fireStyle(value.style).level>fireLevel(value))return null;
  return {fuel:value.fuel,updatedAt:value.updatedAt,stokedAt:value.stokedAt,revision:value.revision,xp:value.xp,style:value.style};
}
export function addFirewood(fire,p,now) {
  if(!isSeated(p))return '통나무에 앉으면 장작을 넣을 수 있어요.';
  const remaining=stokeRemaining(p,now);
  if(remaining>0)return '다음 장작까지 '+stokeWaitLabel(remaining)+' 남았어요. 한 사람당 10분에 한 번 넣을 수 있어요.';
  if(fuelAt(fire,now)>=MAX_FIRE_FUEL-1)return '불이 충분히 타고 있어요.';
  Object.assign(fire,{fuel:Math.min(MAX_FIRE_FUEL,fuelAt(fire,now)+60),updatedAt:now,stokedAt:now,revision:fire.revision+1,xp:Math.min(Number.MAX_SAFE_INTEGER,fire.xp+1)});
  p.lastStokeAt=now;return null;
}
export function changeFireStyle(fire,p,id) {
  if(!p || p.connected===false || p.mapId!==CAMP_MAP)return '불멍에 돌아오면 불 모습을 바꿀 수 있어요.';
  const style=fireStyle(id);
  if(!style)return '불 모습을 확인해 주세요.';
  if(style.level>fireLevel(fire))return '모닥불 '+style.level+'레벨에 열리는 모습이에요.';
  if(fire.style!==id){fire.style=id;fire.revision++;}
  return null;
}
