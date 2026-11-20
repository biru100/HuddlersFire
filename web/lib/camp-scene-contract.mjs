import {CAMP_BENCHES,seatById} from './camp-seats.mjs';
import {propGeometry} from './camp-prop-geometry.mjs';
// Display geometry only; authoritative positions and shared physics are unchanged.
export function benchDirection(angle){const dx=-Math.sin(angle)-Math.cos(angle),dy=(Math.cos(angle)-Math.sin(angle))*.5;if(Math.abs(dx)<.001)return 'vertical';if(Math.abs(dy)<.001)return 'horizontal';return dx*dy<0?'ne':'nw';}
export function benchBinding(assets,item){const direction=assets.manifest.bindings?.[item.id];if(!direction)return null;if(direction!==benchDirection(item.angle||0))throw Error('Bench direction does not match world seating axis: '+item.id);return assets.spriteFrame(item.variant==='weathered'&&assets.manifest.sprites['bench-weathered-'+direction]?'bench-weathered-'+direction:'bench',item.variant==='weathered'&&assets.manifest.sprites['bench-weathered-'+direction]?null:direction);}
export function seatOffset(frame,z=0,width=frame.displayWidth||90){const seat=frame.contacts?.seat,ground=frame.contacts?.ground;if(!seat||!ground)throw Error('Seat and ground contacts required');const scale=width/frame.w;return {x:(seat.x-ground.x)*scale,y:(seat.y-ground.y)*scale+6+z*40};}

// Shared colour/mask geometry; authoritative coordinates are unchanged.
export function clearingGeometry(assets,frame,theme='color',mode='off'){
  const sheet='camp-clearing-art'+(theme==='dark'?'-dark':'');
  if(mode==='candidates'||!frame||!assets.manifest.files?.[sheet]||!assets.getSprite(sheet))return null;
  return assets.manifest.files['camp-clearing-art']?.benchGeometry?.[frame.direction] ?? propGeometry('bench-'+frame.direction);
}
export function playerDisplay(player,assets,theme='color',mode='off'){
  const seat=seatById(player.seatId),bench=seat&&CAMP_BENCHES.find(b=>b.id===seat.bench),frame=bench&&benchBinding(assets,bench);
  if(frame&&assets.manifest.character.states.sit.frames[0].contacts?.seat){
    const profile=clearingGeometry(assets,frame,theme,mode);
    const offset=profile?{x:profile.seat[0]-profile.origin[0],y:profile.seat[1]-profile.origin[1]}:seatOffset(frame);
    return {player:{...player,renderSeat:true,renderDirection:assets.manifest.characterBindings?.[bench.id]},seatDirection:frame.direction,...offset};
  }
  return {player,x:0,y:-(player.z||0)*40};
}
export function propDisplay(item,assets){
  const definitions={tree:['tree',180,0],tent:['tent',190,5],bench:['bench',110,6],lantern:['lantern',26,0],sign:['sign',78,0],fence:['fence',90,5],shade:['shade',155,10],crate:['crate',58,6],fire:['firewood',103,12],trampoline:['trampoline',110,8],radio:['radio',58,3],portal:['portal',116,5],gameBooth:['gameBooth',180,9]};
  let row=definitions[item.type];if(item.type==='garden')row=[item.variant,item.variant==='rock'?30:40,2];if(!row)return null;
  let [id,baseWidth,y]=row;const direction=id==='bench'?assets.manifest.bindings?.[item.id]:null;
  if((item.type==='tree'||item.type==='fence')&&item.variant&&assets.manifest.sprites[id+'-'+item.variant])id=id+'-'+item.variant;
  if(item.type==='bench'&&item.variant==='weathered'&&assets.manifest.sprites['bench-weathered-'+direction])id='bench-weathered-'+direction;
  const frame=id==='bench'&&direction?assets.spriteFrame(id,direction):assets.spriteFrame(id);if(!frame)return null;
  const profile=frame.sheet==='camp-scenery' && propGeometry(id,frame);
  // The playable mat spans the existing .75-world-unit spring radius.
  if(frame.placement)baseWidth=frame.placement.width;
  else if(profile && item.type==='trampoline')baseWidth=96;
  const width=(item.type==='bench'?frame.displayWidth||baseWidth:baseWidth)*(item.type==='tree'||item.type==='garden'?item.scale||1:1);
  return {id,frame,width,y:profile?0:y,direction,flip:item.type==='fence'&&item.x>-9,
    profile,anchorX:profile?profile.origin[0]/frame.w:null,anchorY:profile?profile.origin[1]/frame.h:null};
}
