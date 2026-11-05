import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createDrawContext} from '../lib/camp-draw-context.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';
import {screenClips,projectWorld} from '../lib/camp-scene-frame.mjs';
import {castVector,GroundShadows,shadowProfile,lightVisibility} from '../lib/camp-shadows.mjs';
import {sceneLights,LightingQuality} from '../lib/camp-lighting.mjs';
import {getMap} from '../lib/camp-maps.mjs';
import {emptyFire} from '../lib/camp-fire.mjs';
test('recorded mixed poses preserve native transforms, clipping and draw order without painting the HUD',()=>{
  const canvas=createCanvas(160,160),native=canvas.getContext('2d'),ctx=createDrawContext(native);ctx.translate(80,140);const before=native.getTransform();ctx.recording.begin();
  drawCharacter(ctx,{moving:true,carrying:'b',facing:-1},{time:1,reduced:false});const commands=ctx.recording.end();
  assert.ok(commands.filter(c=>c.type==='image').length>=2);assert.ok(commands.some(c=>c.type==='image'&&c.clips.length));assert.deepEqual(native.getTransform(),before);assert.equal(native.getImageData(80,90,1,1).data[3],0);
  ctx.fillStyle='red';ctx.fillRect(-5,-5,10,10);assert.equal(native.getImageData(80,140,1,1).data[3],255);
});
test('portrait circle, inverse torso clip and DPR resolve to the same CSS space as picking',()=>{
  const matrix={a:2,b:0,c:0,d:2,e:10,f:20};const clips=screenClips([{matrix,rule:'evenodd',ops:[['rect',0,0,40,40],['rect',10,10,10,10]]},{matrix,ops:[['arc',20,20,15,0,Math.PI*2]]}]);
  assert.equal(clips.length,3);assert.equal(clips[1].inverse,true);assert.equal(clips[2].kind,1);assert.deepEqual(clips[2].rect,[20,30,60,60]);assert.throws(()=>screenClips([{matrix,ops:[['lineTo',1,2]]}]),/Unsupported/);
  assert.deepEqual(projectWorld(2,1),[40,60]);
});
test('cached drawing transforms match the native matrix through rotation, mirror and nested restore',()=>{const native=createCanvas(80,80).getContext('2d'),ctx=createDrawContext(native,{dpr:()=>2});ctx.setTransform(2,0,0,2,0,0);ctx.recording.begin();ctx.translate(20,30);ctx.save();ctx.rotate(.4);ctx.scale(-1,1.5);const expected=native.getTransform();ctx.drawImage(createCanvas(2,2),0,0);ctx.restore();ctx.drawImage(createCanvas(2,2),0,0);const commands=ctx.recording.end();for(const key of ['a','b','c','d','e','f'])assert.ok(Math.abs(commands[0].matrix[key]-expected[key]/2)<1e-10);assert.deepEqual(commands[1].matrix,{a:1,b:0,c:0,d:1,e:20,f:30});});
test('height-aware shadow projection stays finite near the light and high carry chains',()=>{
  const light={x:0,y:0,height:.8,radius:8,intensity:1};assert.equal(castVector({x:0,y:0,height:1},light),null);assert.equal(castVector({x:9,y:0,height:1},light),null);
  for(const z of [0,1,24]){const s=castVector({x:2,y:1,z,height:1},light);assert.ok([s.x,s.y,s.alpha].every(Number.isFinite));assert.ok(Math.hypot(s.x,s.y)<170);assert.ok(s.alpha>0&&s.alpha<=.25);}
  assert.notEqual(shadowProfile({type:'bench',angle:0}).angle,shadowProfile({type:'bench',angle:Math.PI/2}).angle);assert.equal(shadowProfile({type:'tree',scale:2}).height,5.6);
});
test('static shadow geometry is cached across player movement and brightness flicker',()=>{
  const ctx=createCanvas(200,200).getContext('2d'),shadows=new GroundShadows(ctx),objects=[{type:'tree',x:2,y:2}],lights=[{x:0,y:0,height:.8,radius:8,intensity:.8,kind:'fire'}];shadows.static(objects,lights,'camp','color');const first=shadows.cache.surface;
  lights[0].intensity=1;shadows.static(objects,lights,'camp','color');assert.equal(shadows.cache.surface,first);objects[0].x++;shadows.static(objects,lights,'camp','color');assert.notEqual(shadows.cache.surface,first);shadows.destroy();assert.equal(shadows.cache,null);
});
test('finite-height occluders block a standing body but allow light above a low bench and high carry',()=>{
  const light={x:0,y:0,height:.8},target={type:'player',x:4,y:0,z:0},bench={type:'bench',x:2,y:0,angle:0};assert.equal(lightVisibility(target,light,[bench]),1);const tree={type:'tree',x:2,y:0};assert.ok(lightVisibility(target,light,[tree])<.4);assert.equal(lightVisibility({...target,z:7},light,[tree]),1);
});
test('local lighting respects theme, reduced motion and a bounded light count without mutating shared state',()=>{
  const scene={theme:'dark',now:5000,fire:emptyFire(999999)},before=structuredClone(scene),camera={x:300,y:200,scale:1};const a=sceneLights(scene,getMap('camp'),camera,true),b=sceneLights({...scene,now:6000},getMap('camp'),camera,true);
  assert.ok(a.length<=3&&a[0].kind==='fire');assert.ok(a.every(l=>l.color[0]===l.color[1]&&l.color[1]===l.color[2]));assert.deepEqual(scene,before);assert.equal(a[0].intensity,b[0].intensity);
  const q=new LightingQuality();for(let i=0;i<90;i++)q.sample(30,6000+i);assert.equal(q.level,1);for(let i=0;i<80;i++)q.sample(30,7000+i);assert.equal(q.level,1);
});
