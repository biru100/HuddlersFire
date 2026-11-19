import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {defaultSpriteAssets as assets} from '../lib/camp-sprite-assets.mjs';
import {benchBinding,seatOffset} from '../lib/camp-scene-contract.mjs';
import {CAMP_BENCHES,CAMP_SEATS} from '../lib/camp-seats.mjs';
import {GroundShadows} from '../lib/camp-shadows.mjs';
import {clearingBench, clearingSheet, drawClearingBench, paintCampClearing} from '../lib/camp-clearing-art.mjs';

test('all sixteen camp seat contacts land on the illustrated planks and cast their own silhouettes',async()=>{
  await assets.preloadSprites(assets.sceneSpriteIds('color','camp'));
  const canvas=createCanvas(180,150), c=canvas.getContext('2d'), shadows=new GroundShadows(c,{assets}); shadows.mapId='camp';
  for (const item of CAMP_BENCHES) {
    const bench=clearingBench(assets,item,'color','camp','off');
    assert.equal(bench.direction,assets.manifest.bindings[item.id]);
    c.clearRect(0,0,180,150); c.save(); c.translate(90,90); drawClearingBench(c,bench,null); c.restore();
    const anchor=seatOffset(benchBinding(assets,item));
    for (const seat of CAMP_SEATS.filter(seat=>seat.bench===item.id)) {
      const dx=seat.x-item.x,dy=seat.y-item.y;
      const [r,g,b,a]=c.getImageData(Math.round(90+anchor.x+(dx-dy)*40),Math.round(90+anchor.y+(dx+dy)*20),1,1).data;
      assert.ok(a>=250 && r>g && g>b,'both seat centres must rest on timber for '+item.id);
    }
    const mask=shadows.propMask(item);
    assert.match(mask.key,/clearing-bench/);
    assert.equal(mask.slope,bench.direction==='ne'?-.5:.5);
    assert.ok(mask.contacts.length>0);
  }
  shadows.destroy();
  assert.equal(clearingBench(assets,CAMP_BENCHES[0],'color','showroom','off'), null);
  assert.equal(clearingBench(assets,CAMP_BENCHES[0],'color','camp','candidates'), null);
});
test('camp clearing stays local and supplies distinct surface textures beneath each bench', async()=>{
  await assets.preloadSprites(['camp-clearing-art','camp-clearing-art-dark']);
  const color=createCanvas(1050,600),dark=createCanvas(1050,600);
  paintCampClearing(color,clearingSheet(assets,'color')); paintCampClearing(dark,clearingSheet(assets,'dark'));
  const c=color.getContext('2d'),d=dark.getContext('2d');
  assert.equal(c.getImageData(700,410,1,1).data[3],0);
  assert.ok(c.getImageData(525,290,1,1).data[3]>0);
  for (const {x,y} of CAMP_BENCHES) {
    const px=Math.round(525+(x-y)*20),py=Math.round(290+(x+y)*10);
    const sample=c.getImageData(px,py,1,1).data,mono=d.getImageData(px,py,1,1).data;
    assert.ok(sample[3]>0 && sample[0]>sample[2]); assert.ok(Math.abs(mono[0]-mono[2])<4);
  }
});
