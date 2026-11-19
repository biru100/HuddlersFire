import { createCanvas, Image, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { COLORS, spawnPlayer } from '../lib/camp-world.mjs';
import { CAMP_SEATS, takeSeat } from '../lib/camp-seats.mjs';
import { EXHIBITED_GAMES, exhibitCover } from '../lib/camp-games.mjs';

globalThis.window = {devicePixelRatio:1,matchMedia:()=>({matches:true})};
globalThis.ResizeObserver = class {observe() {} disconnect() {}};
globalThis.requestAnimationFrame = ()=>1;
globalThis.cancelAnimationFrame = ()=>{};
globalThis.Image = Image;
const koreanFont = process.env.CAMP_REVIEW_KOREAN_FONT || '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';
if (existsSync(koreanFont)) GlobalFonts.registerFromPath(koreanFont,'Malgun Gothic');
const out = 'outputs/landscapes';
mkdirSync(out,{recursive:true});
for (const [mapId,x,y] of [['camp',-.45,-2.05],['playground',0,.5],['showroom',0,-.5]]) {
  const self = {...spawnPlayer(0,mapId),mapId,id:'self',name:'Myo',x,y,color:COLORS[1],connected:true};
  const guest = {...self,id:'guest',name:'Sol',x:x+2.2,y:y+.2,color:COLORS[3],hairStyle:1,topStyle:2};
  const players = [self,guest];
  if (mapId === 'camp') {
    const seat = CAMP_SEATS.find(s=>s.bench==='log-7');
    Object.assign(guest,{x:seat.x,y:seat.y});
    const error = takeSeat(new Map(players.map(p=>[p.id,p])),guest,seat.id);
    if (error) throw Error(error);
  }
  for (const [format,width,height,followSelf] of [['overview',960,700,false],['desktop',900,640,true],['mobile',390,520,true],['dark',640,480,true]]) {
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
    writeFileSync(out+'/'+mapId+'-'+format+'.png',canvas.toBuffer('image/png'));
    renderer.destroy();
  }
}
