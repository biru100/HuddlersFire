import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createSpriteContext,defaultSpriteAssets,spriteManifest} from '../lib/camp-sprite-assets.mjs';
import {benchDirection,benchBinding,seatOffset} from '../lib/camp-scene-contract.mjs';
import {frameAt,characterAnimation} from '../lib/camp-sprite-animation.mjs';
test('preview caches and manifests do not modify the shipped context',async()=>{
  const a=createSpriteContext({files:{one:{url:'a'}},sprites:{}},{loader:async()=>({id:'a'})}),b=createSpriteContext({files:{one:{url:'b'}},sprites:{}},{loader:async()=>({id:'b'})});
  await Promise.all([a.loadSprite('one'),b.loadSprite('one')]);assert.equal(a.getSprite('one').id,'a');assert.equal(b.getSprite('one').id,'b');assert.equal(defaultSpriteAssets.manifest,spriteManifest);assert.equal(spriteManifest.files.one,undefined);
});
test('world bench tangent chooses the correct visual axis and refuses a reversed binding',()=>{
  assert.equal(benchDirection(0),'ne');assert.equal(benchDirection(Math.PI/2),'nw');assert.equal(benchDirection(Math.PI/4),'horizontal');assert.equal(benchDirection(Math.PI*3/4),'vertical');
  const a=createSpriteContext({files:{},bindings:{log:'ne'},sprites:{bench:{directions:{ne:'ne'}},ne:{contacts:{seat:{x:100,y:40},ground:{x:100,y:100}},w:200}}});assert.equal(benchBinding(a,{id:'log',angle:0}),a.manifest.sprites.ne);assert.throws(()=>benchBinding(a,{id:'log',angle:Math.PI/2}),/world seating axis/);assert.throws(()=>a.spriteFrame('bench','nw'),/Missing sprite direction/);
});
test('contact offset follows image scale and only cancels display height, preserving world state',()=>{
  const frame={w:200,contacts:{seat:{x:100,y:40},ground:{x:100,y:100}}},p={z:.18,x:2.7,y:.4},before=structuredClone(p);
  const offset=seatOffset(frame,p.z);assert.ok(Math.abs(offset.y-(-60*90/200+6+.18*40))<1e-8);assert.equal(offset.x,0);assert.deepEqual(p,before);assert.throws(()=>seatOffset({w:200,contacts:{}}),/contacts required/);
});
test('explicit character directions never silently use idle or an unrelated frame; a seat anchor changes display origin',()=>{
  const data=structuredClone(spriteManifest),frame=structuredClone(data.character.states.sit.frames[0]);frame.contacts={seat:{x:frame.feet.x,y:frame.feet.y-20}};const row={...data.character.states.sit,frames:[frame],durations:[500],sheet:'pilot'};data.character.states.sit={...row,directions:{front:row}};const assets=createSpriteContext(data);
  assert.throws(()=>frameAt('sit',0,true,assets,'back'),/Missing character direction/);const p={sitting:true,renderSeat:true},pose=characterAnimation(p,0,true,null,0,assets);assert.deepEqual(pose.origin,frame.contacts.seat);assert.equal(pose.sheet,'pilot');assert.equal(p.renderDirection,undefined);
});
test('a seated gesture keeps the oriented pelvis and portrait height of the seated lower body',()=>{
  const data=structuredClone(spriteManifest),frame=structuredClone(data.character.states.sit.frames[0]);frame.contacts={seat:{x:frame.feet.x,y:frame.feet.y-20}};const row={...data.character.states.sit,frames:[frame],durations:[500]};data.character.states.sit={...row,directions:{back:row}};const assets=createSpriteContext(data),p={sitting:true,renderSeat:true,renderDirection:'back'},base=characterAnimation(p,0,true,null,0,assets),wave=characterAnimation(p,0,true,'wave',0,assets);
  assert.ok(wave.seatGesture);assert.deepEqual(wave.lowerOrigin,frame.contacts.seat);assert.ok(Math.abs(wave.headY-base.headY)<1e-8);assert.equal(wave.lower.state,'sit');
});
test('foreground/background drawing is decided by metadata and honors the ground anchor',async()=>{
  const source=createCanvas(20,20),s=source.getContext('2d');s.fillStyle='red';s.fillRect(0,0,20,20);const data={files:{p:{url:'p'}},sprites:{bench:{sheet:'p',ungraded:true,x:0,y:0,w:20,h:20,depth:'foreground',contacts:{ground:{x:0,y:20}}}}},assets=createSpriteContext(data,{loader:async()=>source});await assets.loadSprite('p');const canvas=createCanvas(40,40),c=canvas.getContext('2d');assert.equal(assets.drawSprite(c,'bench',{x:5,y:25,width:20,layer:'background'}),false);assert.equal(c.getImageData(6,6,1,1).data[3],0);assert.equal(assets.drawSprite(c,'bench',{x:5,y:25,width:20,layer:'foreground'}),true);assert.ok(c.getImageData(6,6,1,1).data[3]>0);
});
