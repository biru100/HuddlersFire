import {CAMP_BENCHES} from './camp-maps.mjs';
import {benchBinding, seatOffset} from './camp-scene-contract.mjs';
export {CAMP_CLEARING_FILES} from './camp-clearing-files.mjs';

const COLOR_ID = 'camp-clearing-art';
const NORMAL_ID = 'normal-camp-clearing-art';
const BENCH_WIDTH = 110;
const BENCH_HEIGHT = 68;
const SEAT = {nw:{x:55,y:24}, ne:{x:55,y:22}};

export function clearingSheet(assets, theme) {
  const id = COLOR_ID + (theme === 'dark' ? '-dark' : '');
  return assets.manifest.files?.[id] ? assets.getSprite(id) : null;
}
export function clearingNormals(assets) {
  return assets.manifest.files?.[NORMAL_ID] ? assets.getSprite(NORMAL_ID) : null;
}
export function clearingBench(assets, item, theme, map, pixelMode) {
  if (map !== 'camp' || item.type !== 'bench' || pixelMode === 'candidates') return null;
  const sheet = clearingSheet(assets, theme);
  if (!sheet) return null;
  const frame = benchBinding(assets,item), seat = SEAT[frame?.direction];
  if (!seat) return null;
  const contact = seatOffset(frame);
  return {
    sheet, dark:theme === 'dark', direction:frame.direction,
    sx:frame.direction === 'ne' ? BENCH_WIDTH : 0, sy:item.variant === 'weathered' ? BENCH_HEIGHT : 0,
    x:contact.x-seat.x, y:contact.y-seat.y,
  };
}
export function drawClearingBench(c, bench, normal) {
  c.save();
  c.imageSmoothingEnabled = false;
  c.setMaterial?.({lighting:'lit', normalImage:normal, strength:.34, ambientLift:bench.dark ? [.035,.035,.035] : [.04,.035,.028]});
  c.drawImage(bench.sheet,bench.sx,bench.sy,BENCH_WIDTH,BENCH_HEIGHT,bench.x,bench.y,BENCH_WIDTH,BENCH_HEIGHT);
  c.restore();
}

const STAMP_WIDTH = 176, STAMP_HEIGHT = 88;
const SOURCE = {moss:[0,136], soil:[176,136], ash:[0,224]};
// Worn approaches lead from each seat towards the fire; lusher ground lies behind the logs.
const patches = [];
for (const [i,bench] of CAMP_BENCHES.entries()) {
  const x = (bench.x-bench.y)*40, y = (bench.x+bench.y)*20;
  patches.push(
    {kind:'moss',x:x*1.16,y:y*1.16,width:227+(i%3)*17, opacity:.88, reverse:i%3===1},
    {kind:'soil',x:x*.75,y:y*.75,width:201+(i%2)*16, opacity:.72, reverse:i%3===2}
  );
}
patches.push(
  {kind:'ash',x:-13,y:5,width:125,opacity:.90},
  {kind:'ash',x:19,y:1,width:107,opacity:.78,reverse:true}
);
// Small, authored groups at the seat approaches and along the edge of the fire pit.
const details = [
  [0,-221,-37],[1,-184,-13],[0,-166,-89],[1,-91,-103],[0,-46,-123],
  [1,52,-102],[0,133,-95],[1,196,-53],[0,216,-28],[1,171,47],
  [0,63,105],[1,24,89],[0,-86,99],[1,-155,60],[0,-207,31],
  [2,-59,11],[1,-46,-21],[2,43,-14],[2,36,27],[2,-19,32]
];
export function paintCampClearing(surface, sheet) {
  const c = surface.getContext('2d');
  c.save();
  c.setTransform(surface.width/2100,0,0,surface.height/1200,surface.width/2,580*surface.height/1200);
  c.imageSmoothingEnabled = false;
  for (const {kind,x,y,width,opacity,reverse} of patches) {
    const [sx,sy] = SOURCE[kind], height = width/2;
    c.save(); c.translate(x,y);
    if (reverse) c.scale(-1,1);
    c.globalAlpha=opacity;
    c.drawImage(sheet,sx,sy,STAMP_WIDTH,STAMP_HEIGHT,-width/2,-height/2,width,height);
    c.restore();
  }
  c.globalAlpha=.90;
  for (const [type,x,y] of details) {
    c.drawImage(sheet,224+type*14,0,14,10,x-7,y-7,14,10);
  }
  c.restore();
}
