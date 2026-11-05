// Maps share a room, chat and radio, but never physics or player picking.
export const CAMP_MAP = 'camp';
export const PLAY_MAP = 'playground';
export const MAP_TRAVEL_COOLDOWN = 500;
export const isMap = id => id === CAMP_MAP || id === PLAY_MAP;
export const mapName = id => id === PLAY_MAP ? '놀이터' : '불멍';
export const canPlay = player => player?.mapId === PLAY_MAP;
export const RADIO = { id: 'radio', type: 'radio', x: -3.3, y: .8, r: .35 };
export const TRAMPOLINES = [{ id: 'spring', type: 'trampoline', x: .4, y: 3.8, r: .65 }];
export const CAMP_BENCHES = Array.from({ length: 8 }, (_, i) => {
  const angle=i*Math.PI/4;
  return { id:'log-'+i, type:'bench', x:Math.cos(angle)*2.7, y:Math.sin(angle)*2.7, angle, r:.32 };
});
export const CAMP_SEATS = CAMP_BENCHES.flatMap(b=>[-1,1].map((side,i)=>({
  id:b.id+'-'+i, bench:b.id, x:b.x-Math.sin(b.angle)*side*.4, y:b.y+Math.cos(b.angle)*side*.4,
  exitX:b.x-Math.cos(b.angle)*.72-Math.sin(b.angle)*side*.4,
  exitY:b.y-Math.sin(b.angle)*.72+Math.cos(b.angle)*side*.4,
})));

export const SCENERY = [
  { type: 'tree', x: -5, y: -4.5, r: .4, scale: 1.3 },
  { type: 'tree', x: -3.6, y: -5.1, r: .4, scale: 1.05 },
  { type: 'tree', x: -.8, y: -5.3, r: .4, scale: 1.5 },
  { type: 'tree', x: 2.5, y: -5.1, r: .4, scale: 1.1 },
  { type: 'tree', x: 5, y: -3.4, r: .4, scale: 1.4 },
  { type: 'tree', x: -5.2, y: -1.7, r: .4, scale: 1.1 },
  { type: 'tree', x: 5.2, y: 3.8, r: .4, scale: 1.25 },
  { type: 'tree', x: -5, y: 3.8, r: .4, scale: 1.25 },
  { type: 'tent', x: -4.2, y: -3.3, r: .85 },
  ...CAMP_BENCHES,
  { type: 'lantern', x: 3.5, y: -2.5, r: .2 },
  { type: 'lantern', x: -2.5, y: 3.8, r: .2 },
  { type: 'sign', x: 3.6, y: 4.1, r: .3 },
];
const playScenery = [
  { type:'fence',x:-5.4,y:-4,r:.18 }, { type:'fence',x:-3.6,y:-5.4,r:.18 },
  { type:'fence',x:0,y:-5.4,r:.18 }, { type:'fence',x:3.6,y:-5.4,r:.18 },
  { type:'fence',x:5.4,y:-3.5,r:.18 }, { type:'fence',x:5.4,y:3.5,r:.18 },
  { type:'shade',x:-4,y:-3.6,r:.65 }, { type:'crate',x:4,y:-2.8,r:.3 },
  { type:'sign',x:-3.6,y:4.1,r:.3 },
];
const maps = {
  camp: { id: CAMP_MAP, scenery: SCENERY, trampolines: [], radio: RADIO, fire: true, obstacles: [{ x: 0, y: 0, r: .7 }, RADIO, ...SCENERY] },
  playground: { id: PLAY_MAP, scenery: playScenery, trampolines: TRAMPOLINES, radio: null, fire: false, obstacles: playScenery },
};
export const getMap = id => maps[id === PLAY_MAP ? PLAY_MAP : CAMP_MAP];
