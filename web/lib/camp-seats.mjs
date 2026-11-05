import { CAMP_MAP, CAMP_BENCHES, CAMP_SEATS } from './camp-maps.mjs';
export { CAMP_BENCHES, CAMP_SEATS } from './camp-maps.mjs';
export const seatById = id => CAMP_SEATS.find(s=>s.id===id) || null;
export const isSeated = p => !!p && p.mapId===CAMP_MAP && !!seatById(p.seatId) && p.sitting && p.motion==='grounded' && p.connected!==false;
// Approach the whole log, including its ends, rather than a small circle around a seat.
export const SEAT_REACH = 1.4;
export function distanceToLog(p, seat) {
  const bench = CAMP_BENCHES.find(b=>b.id===seat.bench);
  const dx=p.x-bench.x,dy=p.y-bench.y,along=-Math.sin(bench.angle)*dx+Math.cos(bench.angle)*dy;
  return Math.hypot(Math.cos(bench.angle)*dx+Math.sin(bench.angle)*dy,Math.max(0,Math.abs(along)-.65));
}
const canApproach = p => p && p.connected!==false && p.mapId===CAMP_MAP && p.motion==='grounded' && !p.carriedBy && !p.carrying && !p.thrown;
export function nearestSeat(players,p) {
  if(!canApproach(p))return null;
  return CAMP_SEATS.filter(s=>distanceToLog(p,s)<=SEAT_REACH && ![...players.values()].some(other=>other.id!==p.id&&other.connected!==false&&other.seatId===s.id))
    .sort((a,b)=>distanceToLog(p,a)-distanceToLog(p,b)||Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0] || null;
}
export function leaveSeat(p) {
  const seat=seatById(p.seatId);
  if(seat && p.mapId===CAMP_MAP)Object.assign(p,{x:seat.exitX,y:seat.exitY,z:0});
  p.seatId=null;
}
export function takeSeat(players,p,id) {
  if(!canApproach(p))return '불멍의 통나무 가까이에서 앉아 주세요.';
  const seat=seatById(id);
  if(!seat || distanceToLog(p,seat)>SEAT_REACH)return '통나무 가까이로 다가가 주세요.';
  if([...players.values()].some(other=>other.id!==p.id&&other.connected!==false&&other.seatId===id))return '이미 친구가 앉아 있는 자리예요.';
  Object.assign(p,{seatId:id,x:seat.x,y:seat.y,z:.18,vx:0,vy:0,vz:0,sitting:true,crouching:false,moving:false,running:false,jumpAt:-1,emote:null,
    aimX:-Math.cos(CAMP_BENCHES.find(b=>b.id===seat.bench).angle),aimY:-Math.sin(CAMP_BENCHES.find(b=>b.id===seat.bench).angle)});
  p.facing=p.aimX-p.aimY>=0?1:-1;
  p.mapRevision++;
  return null;
}
