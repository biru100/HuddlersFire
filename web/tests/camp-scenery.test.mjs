import assert from 'node:assert/strict';
import test from 'node:test';
import {createCanvas} from '@napi-rs/canvas';
import {drawHorizon, landscapeFor, landscapeNormals} from '../lib/camp-landscape.mjs';
import {CampArtwork} from '../lib/camp-artwork.mjs';
import {EXHIBITED_GAMES,exhibitCover} from '../lib/camp-games.mjs';
import {spriteMaterial} from '../lib/camp-materials.mjs';
import {STYLE_FRAMES} from '../lib/camp-style-files.mjs';
import {propDisplay} from '../lib/camp-scene-contract.mjs';
import {facilityDrawOrder} from '../lib/camp-scene-frame.mjs';
import {placedGeometry,propGeometry} from '../lib/camp-prop-geometry.mjs';
import {GroundShadows} from '../lib/camp-shadows.mjs';
import {getMap} from '../lib/camp-maps.mjs';
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
    if (id==='football') {assert.equal(frame.w,17);continue;} // Moving ball width.
    const display=propDisplay(item,assets);
    assert.equal(display.frame,frame);
    assert.equal(frame.w,display.width,'one native texel per base world pixel for '+id);
    assert.ok(shadows.propMask(item)?.contacts.length,'grounded silhouette for '+id);
    assert.equal(spriteMaterial(assets,frame.sheet,id).normalId,sheets[2]);
  }
  shadows.destroy();
});

test('the playground fence shares seven grounded posts with continuous rails through its corner',async()=>{
  await assets.preloadSprites(['camp-scenery']);
  const ctx=createCanvas(440,190).getContext('2d'),posts=[];
  for(const item of getMap('playground').scenery.filter(o=>o.type==='fence')){
    const d=propDisplay(item,assets),x=220+(item.x-item.y)*40,y=420+(item.x+item.y)*20;
    const rig=placedGeometry(d.profile,d.width/d.frame.w,d.flip);
    for(const foot of rig.contacts)posts.push([x+foot.x,y+foot.y]);
    ctx.save();ctx.translate(x,y);assets.drawSprite(ctx,d.id,d);ctx.restore();
  }
  assert.equal(posts.length,7);
  assert.equal(new Set(posts.map(p=>p.join(','))).size,7);
  posts.sort(([a],[b])=>a-b);
  function assertRails(){
    const pixels=ctx.getImageData(0,0,440,190).data,alpha=(x,y)=>pixels[(y*440+x)*4+3];
    for(let i=1;i<posts.length;i++){
      const [x1,y1]=posts[i-1],[x2,y2]=posts[i];
      assert.equal(Math.abs((y2-y1)/(x2-x1)),.5);
      for(let x=x1;x<=x2;x++){
        const base=Math.round(y1+(x-x1)*(y2-y1)/(x2-x1));
        for(const height of [13,30])assert.equal(alpha(x,base-height),255,'continuous rail at '+x);
        if(x>x1+6&&x<x2-6)assert.equal(alpha(x,base-21),0,'open space between rails at '+x);
      }
    }
  }
  assertRails();
  const [[x1,y1],[x2,y2]]=posts;
  ctx.clearRect((x1+x2)/2-1,(y1+y2)/2-32,3,5);
  assert.throws(assertRails,/continuous rail/);
});

test('release placement drives drawing and support geometry; older frames keep their original anchors',()=>{
  const frame=assets.spriteFrame('shade');
  const old={...frame};delete old.placement;
  assert.deepEqual(propGeometry('shade',frame),propGeometry('shade',old));
  const edited=structuredClone(frame);edited.placement.width+=12;
  edited.placement.profile.origin[0]+=4;
  const display=propDisplay({type:'shade'},{...assets,spriteFrame:()=>edited});
  assert.equal(display.width,edited.placement.width);
  assert.ok(Math.abs(display.anchorX-edited.placement.profile.origin[0]/edited.referenceSize[0])<1e-12);
  assert.deepEqual(propGeometry('fence-run',assets.spriteFrame('fence-run')).railHeights,[30,13]);
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

test('every painted canopy foot receives independent contact, and a camper crosses between its posts',async()=>{
  await assets.preloadSprites(['camp-scenery']);
  const item={type:'shade',x:0,y:0},d=propDisplay(item,assets);
  const layout={...d,scale:d.width/d.frame.w};
  const structure=placedGeometry(d.profile,layout.scale);
  const surface=createCanvas(260,240),c=surface.getContext('2d'),shadows=new GroundShadows(c,{assets});
  c.translate(130,170);
  assets.drawSprite(c,d.id,d);
  for(const {x,y} of structure.contacts){
    assert.ok(c.getImageData(Math.round(130+x),Math.round(169+y),1,1).data[3]>128,'support is on the painted foot');
  }
  assert.equal(structure.contacts.length,4);
  assert.equal(new Set(structure.contacts.map(p=>p.y)).size,4);
  c.clearRect(-130,-170,260,240);
  shadows.static([item],[],'camp','color');
  for(const {x,y} of structure.contacts){
    assert.ok(c.getImageData(Math.round(130+x),Math.round(170+y),1,1).data[3]>48,'contact survives without any direct light');
  }
  const order=facilityDrawOrder([item,{type:'player',x:0,y:0}],assets,o=>o===item&&layout);
  assert.deepEqual(order.map(o=>o.drawPart||o.type),['rearPost','leftPost','player','rightPost','front']);
  // Source regions must reproduce exactly the uncut sprite, with no seam/duplicate alpha.
  for(const type of ['shade','trampoline','gameBooth']){
    const d=propDisplay({type},assets),f=d.frame;
    const counts=new Uint8Array(f.w*f.h);
    const layers=d.profile.postLayers?.map(([key])=>key)??['front','back'];
    for(const [x,y,w,h] of layers.flatMap(key=>d.profile[key]))
      for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)counts[row*f.w+col]++;
    assert.ok(counts.every(count=>count===1),type);
  }
  shadows.destroy();
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

test('the turf margin keeps its cutout in the shipped terrain, monochrome and normal map',async()=>{
  const ctx=createCanvas(1,1).getContext('2d');
  for(const map of ['camp','playground','showroom']){
    await assets.preloadSprites(['landscape-'+map]);
    const color=landscapeFor(ctx,assets,map,'color','off');
    const dark=landscapeFor(ctx,assets,map,'dark','off');
    const masks=[color,dark,landscapeNormals(ctx,color)].map(image=>{
      const surface=createCanvas(color.width,1), row=surface.getContext('2d');
      row.drawImage(image,0,0);
      return row.getImageData(0,0,color.width,1).data.filter((_,i)=>i%4===3);
    });
    assert.ok(masks[0].includes(0),map+' must show the surrounding meadow through the turf edge');
    assert.deepEqual(masks[1],masks[0]); assert.deepEqual(masks[2],masks[0]);
  }
});

test('release floors, horizons and fire frames use the follow camera pixel pitch',async()=>{
  const ctx=createCanvas(1,1).getContext('2d');
  for(const map of ['camp','playground','showroom']){
    const floor=landscapeFor(ctx,assets,map,'color','off');
    assert.equal(floor.width,960);assert.equal(floor.height,960);
    for(const theme of ['color','dark']){
      const horizon=landscapeFor(ctx,assets,map,theme,'off','horizon');
      assert.deepEqual([horizon.width,horizon.height],[3200,2000]);
      const suffix=theme==='dark'?'-dark':'';
      assert.deepEqual(assets.sceneSpriteIds(theme,map).filter(id=>id.startsWith('horizon-')),['horizon-'+map+suffix]);
    }
  }
  for(const id of ['amber','gold','blue','jade','violet']){
    assert.ok(assets.spriteFrame(id).animation.frames.every(f=>f.w===75&&f.h===75));
  }
  const horizon=createCanvas(80,40),paint=horizon.getContext('2d');
  paint.fillStyle='red';paint.fillRect(37,19,1,1);
  for(const cx of [20,35]){
    const view=createCanvas(40,20).getContext('2d');
    drawHorizon(view,horizon,40,20,{x:cx,y:10,scale:1});
    assert.equal(view.getImageData(cx-3,9,1,1).data[0],255);
    assert.equal(view.getImageData(cx-2,9,1,1).data[3],0);
  }
});

test('nearby scenery moves with the playable ground when the follow camera pans',()=>{
  const atlas=createCanvas(80,120), paint=atlas.getContext('2d');
  paint.fillStyle='red';paint.fillRect(36,98,2,4);
  const view=createCanvas(60,30).getContext('2d');
  for(const cameraX of [22,37]){
    view.clearRect(0,0,60,30);
    drawHorizon(view,atlas,60,30,{x:cameraX,y:15,scale:1});
    assert.deepEqual([...view.getImageData(cameraX-16,14,1,1).data],[255,0,0,255]);
  }
});
