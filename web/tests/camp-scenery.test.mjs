import assert from 'node:assert/strict';
import test from 'node:test';
import {createCanvas} from '@napi-rs/canvas';
import {landscapeFor} from '../lib/camp-landscape.mjs';
import {CampArtwork} from '../lib/camp-artwork.mjs';
import {EXHIBITED_GAMES,exhibitCover} from '../lib/camp-games.mjs';
import {spriteMaterial} from '../lib/camp-materials.mjs';
import {STYLE_FRAMES} from '../lib/camp-style-files.mjs';
import {propDisplay} from '../lib/camp-scene-contract.mjs';
import {GroundShadows} from '../lib/camp-shadows.mjs';
import {defaultSpriteAssets as assets} from '../lib/camp-sprite-assets.mjs';

test('each scenery prop ships with matched color, monochrome and normal silhouettes',async()=>{
  const sheets=['camp-scenery','camp-scenery-dark','normal-camp-scenery'];
  for (const map of ['camp','playground','showroom']) for (const theme of ['color','dark']) {
    const requested=assets.sceneSpriteIds(theme,map);
    assert.ok(requested.includes(sheets[theme==='dark'?1:0]) && requested.includes(sheets[2]));
    assert.ok(!requested.includes(sheets[theme==='dark'?0:1]));
  }
  await assets.preloadSprites(sheets);
  const [color,dark,normal]=sheets.map(id=>{
    const image=assets.getSprite(id),ctx=createCanvas(image.width,image.height).getContext('2d');
    ctx.drawImage(image,0,0);
    return ctx.getImageData(0,0,image.width,image.height).data;
  });
  for(let i=0;i<color.length;i+=4){
    assert.equal(color[i+3],dark[i+3]);
    assert.equal(color[i+3],normal[i+3]);
    if (dark[i+3]) {assert.equal(dark[i],dark[i+1]);assert.equal(dark[i+1],dark[i+2]);}
  }
  const shadows=new GroundShadows(createCanvas(16,16).getContext('2d'),{assets});
  for(const [id,recipe] of Object.entries(STYLE_FRAMES).filter(([,r])=>r.sheet==='camp-scenery')){
    const frame=assets.spriteFrame(id);
    assert.equal(frame.sheet,recipe.sheet);
    const [type,variant]=id.split('-');
    const item={type,variant,x:0,y:0,scale:1};
    if (['rock','flowers'].includes(id)) Object.assign(item,{type:'garden',variant:id});
    if (id==='firewood') item.type='fire';
    if (id==='football') continue; // The ball has a separate moving shadow path.
    assert.equal(propDisplay(item,assets).frame,frame);
    assert.ok(shadows.propMask(item)?.contacts.length,'grounded silhouette for '+id);
    assert.equal(spriteMaterial(assets,frame.sheet,id).normalId,sheets[2]);
  }
  shadows.destroy();
});

test('the showroom paints each live game cover inside its illustrated poster frame',async()=>{
  await assets.preloadSprites(['camp-scenery']);
  const game=EXHIBITED_GAMES.find(g=>exhibitCover(g));
  const cover=createCanvas(48,20),src=cover.getContext('2d');
  src.fillStyle='#ff00ff';src.fillRect(0,0,48,20);
  const canvas=createCanvas(240,200),ctx=canvas.getContext('2d'),art=new CampArtwork();
  ctx.translate(120,170);
  Object.assign(art,{ctx,assets,theme:'color',mapId:'showroom',shadow(){},caption(){},
    exhibitImage(url){assert.equal(url,exhibitCover(game));return cover;}});
  art.gameBooth({type:'gameBooth',gameId:game.id});
  const frame=STYLE_FRAMES.gameBooth,scale=180/frame.w,slot=frame.poster;
  const edge=Math.round(120+(slot.x*frame.w-frame.contacts.ground.x)*scale);
  const middle=Math.round(179+((slot.y+slot.h/2)*frame.h-frame.contacts.ground.y)*scale);
  const pixel=x=>Array.from(ctx.getImageData(x,middle,1,1).data);
  assert.deepEqual(pixel(edge+5),[255,0,255,255]);
  const [r,g,b,a]=pixel(edge-5);
  assert.ok(r>g && g>b && a===255,'the timber mount remains visible around a wide cover');
});

test('paint the atlas horizon and terrain from their respective frames, with a monochrome variant',()=>{
  const source=createCanvas(16,22), painter=source.getContext('2d');
  painter.fillStyle='#c08040'; painter.fillRect(0,0,16,16);
  painter.fillStyle='#204080'; painter.fillRect(0,16,16,6);
  const fakeAssets={manifest:{files:{'landscape-playground':{}}},getSprite:()=>source};
  const ctx=createCanvas(96,68).getContext('2d');
  for (const theme of ['color','dark']) {
    const art=Object.assign(new CampArtwork(),{ctx,assets:fakeAssets,theme});
    art.landscape=landscapeFor(ctx,fakeAssets,'playground',theme,'off');
    art.background(96,68);
    const sky=[...ctx.getImageData(48,34,1,1).data];
    art.ground(9,'playground');
    const floor=[...art.groundCache.surface.getContext('2d').getImageData(1050,580,1,1).data];
    if (theme==='color') {
      assert.deepEqual(sky,[32,64,128,255]);
      assert.deepEqual(floor,[192,128,64,255]);
    } else {
      assert.equal(sky[0],sky[1]); assert.equal(sky[1],sky[2]);
      assert.equal(floor[0],floor[1]); assert.equal(floor[1],floor[2]);
      assert.ok(floor[0]>sky[0]);
    }
  }
  assert.equal(landscapeFor(ctx,fakeAssets,'playground','color','candidates'),null);
});
