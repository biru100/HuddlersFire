import {CAMP_BENCHES,seatById} from './camp-seats.mjs';
// Display geometry only; authoritative positions and shared physics are unchanged.
export function benchDirection(angle){const dx=-Math.sin(angle)-Math.cos(angle),dy=(Math.cos(angle)-Math.sin(angle))*.5;if(Math.abs(dx)<.001)return 'vertical';if(Math.abs(dy)<.001)return 'horizontal';return dx*dy<0?'ne':'nw';}
export function benchBinding(assets,item){const direction=assets.manifest.bindings?.[item.id];if(!direction)return null;if(direction!==benchDirection(item.angle||0))throw Error('Bench direction does not match world seating axis: '+item.id);return assets.spriteFrame(item.variant==='weathered'&&assets.manifest.sprites['bench-weathered-'+direction]?'bench-weathered-'+direction:'bench',item.variant==='weathered'&&assets.manifest.sprites['bench-weathered-'+direction]?null:direction);}
export function seatOffset(frame,z=0,width=frame.displayWidth||90){const seat=frame.contacts?.seat,ground=frame.contacts?.ground;if(!seat||!ground)throw Error('Seat and ground contacts required');const scale=width/frame.w;return {x:(seat.x-ground.x)*scale,y:(seat.y-ground.y)*scale+6+z*40};}

// Shared colour/mask geometry; authoritative coordinates are unchanged.
export function playerDisplay(player,assets){
  const seat=seatById(player.seatId),bench=seat&&CAMP_BENCHES.find(b=>b.id===seat.bench),frame=bench&&benchBinding(assets,bench);
  if(frame&&assets.manifest.character.states.sit.frames[0].contacts?.seat){const offset=seatOffset(frame,0);return {player:{...player,renderSeat:true,renderDirection:assets.manifest.characterBindings?.[bench.id]},...offset};}
  return {player,x:0,y:-(player.z||0)*40};
}
export function propDisplay(item,assets){
  const definitions={tree:['tree',180,0],tent:['tent',190,5],bench:['bench',110,6],lantern:['lantern',26,0],sign:['sign',78,0],fence:['fence',90,5],shade:['shade',155,10],crate:['crate',58,6],fire:['firewood',103,12],trampoline:['trampoline',110,8],radio:['radio',58,3],portal:['portal',116,5],gameBooth:['gameBooth',180,9]};
  let row=definitions[item.type];if(item.type==='garden')row=[item.variant,item.variant==='rock'?30:40,2];if(!row)return null;
  let [id,baseWidth,y]=row;const direction=id==='bench'?assets.manifest.bindings?.[item.id]:null;
  if(item.type==='tree'&&item.variant&&assets.manifest.sprites['tree-'+item.variant])id='tree-'+item.variant;
  if(item.type==='bench'&&item.variant==='weathered'&&assets.manifest.sprites['bench-weathered-'+direction])id='bench-weathered-'+direction;
  const frame=id==='bench'&&direction?assets.spriteFrame(id,direction):assets.spriteFrame(id);if(!frame)return null;
  const width=(item.type==='bench'?frame.displayWidth||baseWidth:baseWidth)*(item.type==='tree'||item.type==='garden'?item.scale||1:1);
  return {id,frame,width,y,direction,flip:item.type==='fence'&&item.x>-9};
}
