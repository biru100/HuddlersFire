// Maps share a room, chat and radio, but never physics or player picking.
export const CAMP_MAP = 'camp';
export const PLAY_MAP = 'playground';
export const SHOW_MAP = 'showroom';
export const MAP_TRAVEL_COOLDOWN = 500;
export const isMap = id => [CAMP_MAP, PLAY_MAP, SHOW_MAP].includes(id);
export const mapName = id => id === SHOW_MAP ? '허들러즈 게임 전시장' : id === PLAY_MAP ? '놀이터' : '불멍';
export const canPlay = player => player?.mapId === PLAY_MAP;
// Twelve tiles per side used to be the entire island. Every map now has 24.
export const MAP_BOUNDS = Object.freeze({ walk: 11.7, edge: 12, state: 14, projectile: 16 });
const portal = (id, x, y, destination, arrivalId, label, color) => ({ id, type:'portal', x, y, destination, arrivalId, label, color });
const campPortals = [portal('camp-play',-7,3.5,PLAY_MAP,'play-camp','놀이터','#cacaca'),portal('camp-show',3.5,-7,SHOW_MAP,'show-camp','게임 전시장','#b0b0b0')];
const playPortals = [portal('play-camp',7.5,7.5,CAMP_MAP,'camp-play','불멍으로','#c0c0c0')];
const showPortals = [portal('show-camp',7.5,7.5,CAMP_MAP,'camp-show','불멍으로','#c0c0c0')];
export const GAME_BOOTHS = [
  { id:'parruits-booth',type:'gameBooth',gameId:'parruits',label:'PARRUITS!',x:-5.5,y:.5,r:.95 },
  { id:'torizon-telecom-booth',type:'gameBooth',gameId:'torizon-telecom',label:'Torizon Telecom',x:.5,y:-5.5,r:.95 },
];
export const RADIO = { id: 'radio', type: 'radio', x: -6, y: -.5, r: .4 };
export const TRAMPOLINES = [{ id: 'spring', type: 'trampoline', x: 3, y: -3, r: .75 }];
export const CAMP_BENCHES = Array.from({ length: 8 }, (_, i) => {
  const angle=Math.floor(i/2)*Math.PI/2;
  const [x,y]=[[3.55,1.6],[3.85,-1.25],[-1.8,4.2],[1.6,4.5],[-4.5,-1.5],[-4,1.5],[1.55,-4.25],[-1.75,-3.55]][i];
  return {id:'log-'+i,type:'bench',x,y,angle,r:.36,variant:i%2?'weathered':null};
});
export const CAMP_SEATS = CAMP_BENCHES.flatMap(b=>[-1,1].map((side,i)=>({
  id:b.id+'-'+i, bench:b.id, x:b.x-Math.sin(b.angle)*side*.5, y:b.y+Math.cos(b.angle)*side*.5,
  exitX:b.x-Math.cos(b.angle)*.95-Math.sin(b.angle)*side*.5,
  exitY:b.y-Math.sin(b.angle)*.95+Math.cos(b.angle)*side*.5,
})));

// Open sightlines through the gathering circle; scenery lives in quiet perimeter clusters.
export const SCENERY = [
  ...CAMP_BENCHES,
  ...[[-9,-7,1.18],[-7.5,-9,.92],[-9,-3,.96],[-2,-9,1.12],[8,-9,1.05],[9,-3,.9],[-9,8,.9],[8.5,9,.86],[-10,-5,.82],[6.8,-9,.78]].map(([x,y,scale],i)=>({type:'tree',x,y,r:.42,scale,variant:i%3===1?'birch':i%3===2?'pine':null})),
  {type:'tent',x:-7,y:-5.7,r:.85},
  {type:'lantern',x:-4.9,y:-3.8,r:.2},
  {type:'lantern',x:4.8,y:2.1,r:.2},
];
const playScenery = [
  ...[[-9,-5],[-9,-7],[-9,-9],[-7,-9],[-5,-9]].map(([x,y])=>({type:'fence',x,y,r:.18})),
  {type:'shade',x:-6.3,y:-5.2,r:.65},
  {type:'crate',x:7,y:-5,r:.4},
  {type:'sign',x:6,y:5,r:.3},
];
const spawnGrid=(x,y)=>Array.from({length:16},(_,i)=>({x:Math.round((x+(i%4)*.6)*100)/100,y:Math.round((y+Math.floor(i/4)*.6)*100)/100}));
const route=(points,width=44)=>({points,width});
const maps = {
  camp: { id: CAMP_MAP, scenery: SCENERY, portals:campPortals, booths:[], bounds:MAP_BOUNDS, trampolines: [], radio: RADIO, fire: true, obstacles: [{ x: 0, y: 0, r: .8 }, RADIO, ...SCENERY],spawns:spawnGrid(2.6,4.5),clearing:{x:0,y:0,rx:6.1,ry:6.1},routes:[route([[0,0],[0,6.3],[6.3,6.3]],46),route([[0,6.3],[-6.2,6.3],[campPortals[0].x,campPortals[0].y]]),route([[6.3,0],[6.3,-6.2],[campPortals[1].x,campPortals[1].y]]),route([[-4.8,0],[RADIO.x,RADIO.y]],32)] },
  playground: { id: PLAY_MAP, scenery: playScenery, portals:playPortals, booths:[], bounds:MAP_BOUNDS, trampolines: TRAMPOLINES, radio: null, fire: false, obstacles: playScenery,spawns:spawnGrid(4.3,4.3),clearing:{x:-1,y:0,rx:6.2,ry:5},routes:[route([[playPortals[0].x,playPortals[0].y],[5.5,5.5],[2,3]],52),route([[2,3],[3,0],[TRAMPOLINES[0].x,TRAMPOLINES[0].y]],32)] },
  showroom: { id:SHOW_MAP, scenery:[{type:'lantern',x:-7,y:2,r:.2},{type:'lantern',x:2,y:-7,r:.2},{type:'shade',x:-6.8,y:-6.8,r:.65},{type:'tree',x:-9,y:6,r:.4,scale:.8},{type:'tree',x:6,y:-9,r:.4,scale:.8}], portals:showPortals, booths:GAME_BOOTHS, bounds:MAP_BOUNDS, trampolines:[],radio:null,fire:false,obstacles:GAME_BOOTHS,spawns:spawnGrid(3.4,3.4),clearing:{x:-1,y:-1,rx:7.4,ry:7.4},routes:[route([[showPortals[0].x,showPortals[0].y],[3,3],[0,0]],64),...GAME_BOOTHS.map(b=>route([[0,0],[b.x+1.2,b.y+1.2]],54))] },
};
export const getMap = id => maps[isMap(id) ? id : CAMP_MAP];
const canInteract = p => p && p.connected!==false && p.motion==='grounded' && !p.carriedBy && !p.thrown && !p.seatId;
export function nearbyInteraction(p) {
  if(!canInteract(p))return null;
  return [...getMap(p.mapId).portals,...getMap(p.mapId).booths]
    .filter(o=>Math.hypot(p.x-o.x,p.y-o.y)<=1.7)
    .sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0]||null;
}
export function portalFor(p, action) {
  if(!canInteract(p) || action.mapRevision!==p.mapRevision)return null;
  return getMap(p.mapId).portals.find(o=>o.id===action.portalId && o.destination===action.mapId && Math.hypot(p.x-o.x,p.y-o.y)<=1.7)||null;
}
