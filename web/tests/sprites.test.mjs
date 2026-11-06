import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createCanvas} from '@napi-rs/canvas';
import {spriteManifest as m,getSprite,characterSheet,sceneSpriteIds,setSpriteLoader,loadSprite,spriteStatus,retrySprites,subscribeSprites,createSpriteContext} from '../lib/camp-sprite-assets.mjs';
import {frameAt,characterAnimation} from '../lib/camp-sprite-animation.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';

test('shipped atlas frames have valid crop/anchor/duration metadata and decoded alpha',()=>{
  const spec=JSON.parse(readFileSync(new URL('../../art/sprites/scene-spec.json',import.meta.url),'utf8')),front=Object.values(spec.assets).filter(a=>a.kind==='character'&&a.direction==='front');
  assert.deepEqual(Object.keys(m.character.states).sort(),front.map(a=>a.state).sort());
  const image=getSprite(characterSheet(0)),canvas=createCanvas(image.width,image.height),c=canvas.getContext('2d');c.drawImage(image,0,0);
  let count=0;
  for(const [name,state]of Object.entries(m.character.states)){
    assert.equal(state.frames.length,state.durations.length,name);
    state.frames.forEach((f,i)=>{
      count++;assert.ok(state.durations[i]>0);assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=image.width&&f.y+f.h<=image.height);
      assert.ok(f.head.radius>10&&f.feet.y<=f.h&&f.head.y<f.feet.y,name);
      for(const hand of f.hands)assert.ok(hand.x>=0&&hand.y>=0&&hand.x+hand.w<=f.w&&hand.y+hand.h<=f.h,`${name} hand crop`);
      const {data}=c.getImageData(f.x,f.y,f.w,f.h);let opaque=0,clear=0;
      for(let n=3;n<data.length;n+=4){if(data[n]>200)opaque++;if(!data[n])clear++;}
      assert.ok(opaque>300&&clear>500,`${name}/${i} must be a nonempty transparent sprite`);
    });
  }
  assert.equal(count,front.reduce((n,a)=>n+a.frames,0));
  for(const a of Object.values(spec.assets).filter(a=>a.kind==='character'&&a.direction!=='front')){const row=m.character.states[a.state].directions[a.direction];assert.equal(row.frames.length,a.frames);assert.ok(row.frames.every(f=>f.contacts?.feet&&f.head.radius>10&&(a.state!=='sit'||f.contacts.seat)));}
});
test('files match content hashes and fit the explicit 10 MB transfer/6 MB scene budgets',()=>{
  for(const file of Object.values(m.files)){
    const bytes=readFileSync(new URL('../public'+file.url,import.meta.url));
    assert.equal(bytes.length,file.bytes);assert.ok(file.url.includes(createHash('sha256').update(bytes).digest('hex').slice(0,12)));
  }
  assert.ok(Object.values(m.files).reduce((n,f)=>n+f.bytes,0)<10_000_000);
  for(const theme of ['color','dark'])for(const map of ['camp','playground','showroom'])assert.ok(sceneSpriteIds(theme,map).reduce((n,id)=>n+m.files[id].bytes,0)<6_000_000);
});
test('animated effects loop with a fixed root and reduced motion freezes the first image',async()=>{
 const source=createCanvas(8,4),paint=source.getContext('2d');paint.fillStyle='#ff0000';paint.fillRect(0,0,4,4);paint.fillStyle='#0000ff';paint.fillRect(4,0,4,4);
 const frame=x=>({sheet:'effects',x,y:0,w:4,h:4,contacts:{ground:{x:2,y:4}}}),first=frame(0),data={files:{effects:{url:'fixture'}},sprites:{flame:{...first,animation:{frames:[first,frame(4)],durations:[100,100],loop:true}}}};
 const assets=createSpriteContext(data,{loader:async()=>source});await assets.loadSprite('effects');
 for(const [elapsed,reduced,expected]of [[0,false,[255,0,0,255]],[100,false,[0,0,255,255]],[200,false,[255,0,0,255]],[100,true,[255,0,0,255]]]){const c=createCanvas(16,16).getContext('2d');assets.drawSprite(c,'flame',{x:8,y:10,width:4,elapsed,reduced});assert.deepEqual([...c.getImageData(8,8,1,1).data],expected);assert.equal(c.getImageData(8,10,1,1).data[3],0,'Root stays at the requested baseline');}
});
test('animation cycles, one-shot clamp, reduced motion and combined poses preserve gameplay state',()=>{
  assert.equal(frameAt('walk',0).index,frameAt('walk',750).index);
  assert.equal(frameAt('hit',9999).index,2);
  assert.equal(characterAnimation({motion:'airborne',vz:2},8,true).index,1);
  assert.equal(characterAnimation({motion:'airborne',vz:-2},8,true).index,2);
  assert.equal(characterAnimation({landedAt:900},1,true,null,1000).index,3);
  assert.notEqual(characterAnimation({carriedBy:'a'},0,false).index,characterAnimation({carriedBy:'a'},.2,false).index);
  for(const [p,emote,upper,lower]of [[{moving:true,carrying:'b'},null,'carry','walk'],[{moving:true,weapon:'gun'},null,'weapon','walk'],[{crouching:true},'wave','wave','crouch'],[{carriedBy:'a',carrying:'b'},null,'carry','carried']]){
    const copy=structuredClone(p),pose=characterAnimation(p,1,false,emote);assert.equal(pose.state,upper);assert.equal(pose.lower.state,lower);assert.equal(pose.combine,true);assert.deepEqual(p,copy);
    const canvas=createCanvas(128,128),ctx=canvas.getContext('2d');ctx.translate(64,110);drawCharacter(ctx,p,{time:1,reduced:false,emote});assert.equal(ctx.getTransform().e,64);
  }
});
test('dark character atlases are neutral without changing coverage',()=>{
  for(let slot=0;slot<6;slot++){
    const color=getSprite(characterSheet(slot)),dark=getSprite(characterSheet(slot,'dark'));
    const c=createCanvas(color.width,color.height).getContext('2d');c.drawImage(color,0,0);const a=c.getImageData(0,0,color.width,color.height).data;c.clearRect(0,0,color.width,color.height);c.drawImage(dark,0,0);const b=c.getImageData(0,0,color.width,color.height).data;
    for(let i=0;i<a.length;i+=4){assert.equal(a[i+3],b[i+3]);if(b[i+3]>8){assert.equal(b[i],b[i+1]);assert.equal(b[i+1],b[i+2]);}}
  }
});
test('failed loads stay cached until retry; subscriptions detach and decoded cache evicts',async()=>{
  let calls=0,notifications=0;const un=subscribeSprites(()=>notifications++);
  setSpriteLoader(async()=>{calls++;if(calls===1)throw Error('offline');return {width:1,height:1};},{cacheLimit:2});
  const ids=Object.keys(m.files);
  await loadSprite(ids[0]);await loadSprite(ids[0]);assert.equal(calls,1);assert.deepEqual(spriteStatus([ids[0]]),{loading:false,failed:[ids[0]]});
  await retrySprites([ids[0]]);assert.deepEqual(spriteStatus([ids[0]]),{loading:false,failed:[]});
  un();const before=notifications;await loadSprite(ids[1]);await loadSprite(ids[2]);assert.equal(notifications,before);assert.equal(getSprite(ids[0]),null);await loadSprite(ids[0]);assert.equal(calls,5);
});
