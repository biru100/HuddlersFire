import { createCanvas, Image, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { COLORS, spawnPlayer } from '../lib/camp-world.mjs';
import { CAMP_SEATS, takeSeat } from '../lib/camp-seats.mjs';
import { EXHIBITED_GAMES, exhibitCover } from '../lib/camp-games.mjs';
import {getMap} from '../lib/camp-maps.mjs';
import {captureState} from './current-art-scenes.mjs';

globalThis.window = {devicePixelRatio:1,matchMedia:()=>({matches:true})};
globalThis.ResizeObserver = class {observe() {} disconnect() {}};
globalThis.requestAnimationFrame = ()=>1;
globalThis.cancelAnimationFrame = ()=>{};
globalThis.Image = Image;
const koreanFont = process.env.CAMP_REVIEW_KOREAN_FONT || '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';
if (existsSync(koreanFont)) GlobalFonts.registerFromPath(koreanFont,'Malgun Gothic');
const maps = [
  ['camp', -.45, -2.05],
  ['playground', 0, .5],
  ['showroom', 0, -.5],
];
const formats = [
  ['overview', 960, 700, false],
  ['desktop', 900, 640, true],
  ['mobile', 390, 520, true],
  ['dark', 640, 480, true],
];
const [mode, ...requestedMaps] = process.argv.slice(2);
const quick = mode === '--quick';
if ((mode && !quick) || requestedMaps.some(id => !maps.some(([name]) => name === id))) {
  console.error('Usage: node tests/render-landscapes.mjs [--quick [camp|playground|showroom ...]]');
  process.exit(1);
}
const selectedMaps = requestedMaps.length ? maps.filter(([id]) => requestedMaps.includes(id)) : maps;
const selectedFormats = quick ? formats.filter(([name]) => name === 'desktop' || name === 'mobile') : formats;
const capture = process.env.CAMP_ART_CAPTURE_DIR;
const out = capture || 'outputs/landscapes';
const cases = [];
mkdirSync(out,{recursive:true});
for (const [mapId,defaultX,defaultY] of selectedMaps) {
  const booth=getMap(mapId).booths[0];
  const [x,y]=capture && mapId==='playground'?[-5.65,-5.85]:
    capture && booth?[booth.x+1.35,booth.y+1.35]:[defaultX,defaultY];
  const self = {...spawnPlayer(0,mapId),mapId,id:'self',name:'Myo',x,y,color:COLORS[1],connected:true};
  const guest = {...self,id:'guest',name:'Sol',x:x+2.2,y:y+.2,color:COLORS[3],hairStyle:1,topStyle:2};
  const players = [self,guest];
  if (mapId === 'camp') {
    const seat = CAMP_SEATS.find(s=>s.bench==='log-7');
    Object.assign(guest,{x:seat.x,y:seat.y});
    const error = takeSeat(new Map(players.map(p=>[p.id,p])),guest,seat.id);
    if (error) throw Error(error);
  }
  for (const [format,width,height,followSelf] of selectedFormats) {
    const canvas=createCanvas(width,height);
    canvas.getBoundingClientRect=()=>({width,height});
    const scene={players,self:self.id,mapId,followSelf,cameraMode:followSelf?'follow':'overview',zoom:1,now:5000,theme:format==='dark'?'dark':'color'};
    const renderer=new CampRenderer(canvas,()=>scene);
    for (const game of EXHIBITED_GAMES) {
      const cover=exhibitCover(game);
      if (cover) renderer.exhibitImages.set(cover,{image:await loadImage('public'+cover),failed:false});
    }
    renderer.draw(5000);
    await renderer.ready;
    renderer.draw(5000);
    const outputPath = `${out}/${mapId}-${format}.png`;
    writeFileSync(outputPath,canvas.toBuffer('image/png'));
    if(capture)cases.push({id:mapId+'-'+format,...captureState(renderer,scene,'canvas')});
    console.log(outputPath);
    renderer.destroy();
  }
}
if(capture)writeFileSync(out+'/scenes.json',JSON.stringify(cases));
