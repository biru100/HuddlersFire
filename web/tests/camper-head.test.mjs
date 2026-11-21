import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {inspectHeadAtlas} from '../scripts/inspect-camper-head.mjs';
import {camperPartCell} from '../lib/camp-camper-parts.mjs';
import {CAMPER_PART_FILES} from '../lib/camp-camper-part-files.mjs';
import {withCampArt} from '../lib/camp-art-release.mjs';
import {buildHeadAtlas} from '../scripts/camper-head-layers.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';
import {spriteManifest,defaultSpriteAssets} from '../lib/camp-sprite-assets.mjs';
import {digest} from '../scripts/camper-review-assets.mjs';
import {camperDisplay,camperFilter,camperImage} from '../lib/camp-camper-sampling.mjs';
import {spriteImageMetadata} from '../lib/camp-materials.mjs';
import {subcultureHeadRecipe} from '../scripts/compile-subculture-camper.mjs';

const source=new URL('../../art/sprites/field-camper-v2/shared-head/',import.meta.url);
const recipe=JSON.parse(readFileSync(new URL('recipe.json',source)));
const activeRecipe=CAMPER_PART_FILES['field-camper-walk'].bodyOnly?subcultureHeadRecipe:recipe;
const ids=['field-camper-v2','field-camper-walk'];
const filename=id=>new URL('../public'+CAMPER_PART_FILES[id].url,import.meta.url);

test('compact walking draws its upper rows and the exact same native head, and tolerates a missing walking image',async()=>{
  const detail=await loadImage(readFileSync(filename(ids[1])));
  const compact=createCanvas(detail.width,960);
  compact.getContext('2d').drawImage(detail,0,0);
  const manifest={...spriteManifest,files:{...spriteManifest.files,[ids[1]]:{bodyOnly:true}}};
  let walkImage=compact;
  const assets={...defaultSpriteAssets,manifest,getSprite:id=>id===ids[1]?walkImage:defaultSpriteAssets.getSprite(id)};
  spriteImageMetadata.set(compact,{assets,id:ids[1]});
  const ctx=createCanvas(300,320).getContext('2d');
  ctx.setTransform(3,0,0,3,150,250);
  const draws=[],original=ctx.drawImage.bind(ctx);
  ctx.drawImage=(image,...args)=>{draws.push({image,args});return original(image,...args);};
  const p={color:'#606060',visualDirection:'front-right',topStyle:1,hairStyle:1};
  drawCharacter(ctx,p,{assets,reduced:true});
  const [,,baselineHair]=draws.splice(0);
  drawCharacter(ctx,{...p,moving:true,walkCycle:1/8},{assets,reduced:false});
  assert.deepEqual(draws.map(({image})=>[image.width,image.height]),[[192,240],[64,80],[64,80]]);
  assert.equal(draws[2].image,baselineHair.image);
  const source=compact.getContext('2d').getImageData(9*192,0,192,240).data;
  assert.deepEqual(draws[0].image.getContext('2d').getImageData(0,0,192,240).data,source);
  draws.length=0;
  walkImage=null;
  drawCharacter(ctx,{...p,moving:true,walkCycle:1/8},{assets,reduced:false});
  assert.ok(draws.length===3&&draws.every(({image})=>image.width===64));
  assert.equal(draws[2].image,baselineHair.image);
});

test('camper sampling uses backing pixels and aligns the whole stack at integer magnification',()=>{
  const c=createCanvas(128,160).getContext('2d');
  c.setTransform(2,0,0,2,60.25,75.75);
  assert.equal(camperDisplay(c,1),2);
  assert.deepEqual([c.getTransform().e,c.getTransform().f],[60,76]);
  assert.equal(camperFilter(2,1),'nearest');
  assert.equal(camperFilter(2,3),'area');
  c.setTransform(1.25,0,0,1.25,60.25,75.75);
  assert.equal(camperFilter(camperDisplay(c,1),1),'edge');
  assert.deepEqual([c.getTransform().e,c.getTransform().f],[60.25,75.75]);
});

test('area reduction keeps the original hue at transparent edges and reuses the prefiltered tile',()=>{
  const image=createCanvas(4,4),c=image.getContext('2d');
  c.fillStyle='#ff0000';c.fillRect(0,0,1,1);
  const part={image};
  const mip=camperImage(c,part,'area',.5,false);
  assert.deepEqual([mip.width,mip.height],[2,2]);
  assert.deepEqual([...mip.getContext('2d').getImageData(0,0,1,1).data],[255,0,0,64]);
  assert.strictEqual(camperImage(c,part,'area',.5,true),mip);
  assert.strictEqual(camperImage(c,part,'nearest',1,false),image);
});

test('the standing face and hairstyle are reused during walking at the same actual pixel density',
  {skip:!spriteManifest.files[ids[0]]?.headLayers},()=>{
    const c=createCanvas(128,160).getContext('2d');
    c.translate(64,110);
    const trace=[];
    const draw=c.drawImage.bind(c);
    c.drawImage=(image,...args)=>{trace.push({image,args});draw(image,...args);};
    const p={color:'#606060',visualDirection:'front-right',topStyle:1,hairStyle:1};
    drawCharacter(c,p,{reduced:true});
    const still=trace.splice(0);
    drawCharacter(c,{...p,moving:true,walkCycle:1/8},{reduced:false});
    assert.notEqual(still[0].image,trace[0].image,'The painted legs and garment must animate');
    for(const index of [1,2]){
      assert.strictEqual(still[index].image,trace[index].image);
      assert.equal(trace[index].args[1]-still[index].args[1],1,'Both head layers follow the same stride');
    }
  });
test('registered native and walking atlases keep eyes, nose and jaw clear for both hair overlays',async()=>{
  const active=withCampArt({sprites:{},files:{},materials:{sheets:{}}});
  for(const [index,id] of ids.entries()){
    assert.deepEqual(active.files[id],CAMPER_PART_FILES[id]);
    const bytes=readFileSync(filename(id));
    assert.equal(digest(bytes),CAMPER_PART_FILES[id].sha256);
    if(index&&active.files[id].bodyOnly){
      assert.equal((await loadImage(bytes)).height,960);
      assert.equal(active.files[id].headLayers,undefined);
      continue;
    }
    assert.equal(active.files[id].headLayers,'shared-face-v1');
    const cases=await inspectHeadAtlas(bytes,Boolean(index),activeRecipe);
    assert.equal(cases.length,32);
    assert.ok(cases.every(c=>c.covered===0));
  }
});

test('baking a dark eye into a hairstyle or moving a posed jaw fails the decoded-art check',async()=>{
  const image=await loadImage(readFileSync(filename(ids[0])));
  const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');
  ctx.drawImage(image,0,0);
  const [hairX,hairY]=camperPartCell({group:0,index:0},'hair',0,false);
  ctx.fillStyle='#352720';ctx.fillRect(hairX*64+31,hairY*80+32,1,1);
  await assert.rejects(inspectHeadAtlas(canvas.toBuffer('image/png'),false,activeRecipe),/Hair paints facial features/);
  ctx.clearRect(0,0,image.width,image.height);
  ctx.drawImage(image,0,0);
  const [x,y]=camperPartCell({group:0,index:4},'face',0,false);
  ctx.clearRect(x*64,y*80,64,80);
  ctx.drawImage(image,x*64,y*80,64,80,x*64+2,y*80,64,80);
  await assert.rejects(inspectHeadAtlas(canvas.toBuffer('image/png'),false,activeRecipe),/Shared skull or jaw moved/);
});

test('a modular hairstyle can preserve its silhouette and still fail the final colour contract',async()=>{
  const atlas=await loadImage(readFileSync(filename(ids[0])));
  const c=createCanvas(atlas.width,atlas.height).getContext('2d');
  c.drawImage(atlas,0,0);
  const [x,y]=camperPartCell({group:0,index:0},'hair',0,false);
  const tile=c.getImageData(x*64,y*80,64,80);
  for(let i=0;i<tile.data.length;i+=4)if(tile.data[i+3])tile.data.set([145,70,55],i);
  c.putImageData(tile,x*64,y*80);
  await assert.rejects(inspectHeadAtlas(c.canvas.toBuffer('image/png'),false,activeRecipe),/Head material hair outside palette/);
});

test('editing only the bob PNG changes only bob cells in the rebuilt native atlas',async()=>{
  const masters={};
  for(const role of recipe.headLayers)
    masters[role]=await loadImage(readFileSync(new URL('masters/'+role+'-native.png',source)));
  const previous=JSON.parse(readFileSync(new URL('../consistency/manifest.json',source))).files[ids[0]];
  const original=await loadImage(readFileSync(new URL('../consistency/'+previous.file,source)));
  const before=buildHeadAtlas(original,false,recipe,masters);
  const edit=createCanvas(masters.bob.width,masters.bob.height);
  const ink=edit.getContext('2d');ink.drawImage(masters.bob,0,0);
  ink.fillStyle='#89462e';ink.fillRect(27,14,4,4);
  const after=buildHeadAtlas(original,false,recipe,{...masters,bob:edit});
  const oldInk=before.getContext('2d'),newInk=after.getContext('2d');
  assert.notDeepEqual(oldInk.getImageData(27,14,4,4).data,newInk.getImageData(27,14,4,4).data);
  oldInk.clearRect(27,14,4,4);newInk.clearRect(27,14,4,4);
  assert.deepEqual(oldInk.getImageData(0,0,before.width,before.height).data,
    newInk.getImageData(0,0,after.width,after.height).data);
});

test('switching hair reuses the exact face surface and draw transform across field and portrait poses',
  {skip:!spriteManifest.files[ids[0]]?.headLayers},()=>{
    const c=createCanvas(160,160).getContext('2d');
    c.translate(80,112);
    let calls=[];
    const draw=c.drawImage.bind(c);
    c.drawImage=(image,...args)=>{
      const m=c.getTransform();
      calls.push({image,args,transform:[m.a,m.b,m.c,m.d,m.e,m.f]});
      draw(image,...args);
    };
    const fallback={...defaultSpriteAssets,getSprite:id=>id==='field-camper-walk'?null:defaultSpriteAssets.getSprite(id)};
    const modes=[{reduced:true},{time:1.25},{time:2.5},{sitting:true},{sitting:true,renderSeat:true},
      {emote:'wave'},{emote:'dance'},{emote:'surprise'},{emote:'clap',moving:true,walkCycle:.25},
      {moving:true,walkCycle:.25,assets:fallback},
      ...Array.from({length:8},(_,step)=>({moving:true,running:step%2===1,walkCycle:step/8}))];
    for(const visualDirection of recipe.directions)for(const theme of ['color','dark'])for(const mode of modes){
      const draws=[];
      for(const hairStyle of [0,1]){
        calls=[];
        drawCharacter(c,{id:'',color:'#606060',visualDirection,topStyle:1,hairStyle,...mode},
          {theme,reduced:false,time:0,...mode});
        draws.push(calls);
      }
      assert.equal(draws[0].length,draws[1].length);
      const changed=draws[0].map((call,i)=>call.image!==draws[1][i].image);
      assert.equal(changed.filter(Boolean).length,1,'Only hair can change');
      const hair=changed.indexOf(true);
      assert.ok(hair>=1,'The shared face must draw before hair');
      assert.strictEqual(draws[0][hair-1].image,draws[1][hair-1].image);
      for(const [i,call] of draws[0].entries()){
        assert.deepEqual(call.args,draws[1][i].args);
        assert.deepEqual(call.transform,draws[1][i].transform);
      }
    }
  });
