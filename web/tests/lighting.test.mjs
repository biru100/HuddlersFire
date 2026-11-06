import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createDrawContext} from '../lib/camp-draw-context.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';
import {screenClips,projectWorld} from '../lib/camp-scene-frame.mjs';
import {castVector,GroundShadows,shadowProfile,lightVisibility} from '../lib/camp-shadows.mjs';
import {sceneLights,LightingQuality,sceneLighting,receiverAt,nightIllumination} from '../lib/camp-lighting.mjs';
import {spriteMaterial} from '../lib/camp-materials.mjs';
import {getMap} from '../lib/camp-maps.mjs';
import {emptyFire} from '../lib/camp-fire.mjs';
import {defaultSpriteAssets} from '../lib/camp-sprite-assets.mjs';
import {CampRenderer} from '../lib/camp-renderer.mjs';
test('night exposure is camp-only and changes light energy independently of normal detail',()=>{
  const profile=sceneLighting('camp'),light={x:2,y:0,height:1,radius:8,intensity:1,color:[1,.57,.2]},point={x:0,y:0,z:0};
  assert.equal(profile.night,true);assert.equal(sceneLighting('playground').night,false);assert.equal(sceneLighting('showroom').night,false);
  assert.deepEqual(nightIllumination(point,[],profile),profile.ambient);
  const near=nightIllumination(point,[light],profile),far=nightIllumination(point,[{...light,x:20}],profile),high=nightIllumination({...point,z:20},[light],profile);
  assert.ok(near[0]>far[0]&&near[0]>near[1]);assert.deepEqual(far,profile.ambient);assert.deepEqual(high,profile.ambient);
  assert.ok(nightIllumination(point,[light],profile,[0,0,-1])[0]<near[0]);assert.deepEqual(nightIllumination(point,[light],profile,[0,0,1],[0]),profile.ambient);
  assert.equal(new Set(sceneLighting('camp','dark').ambient).size,1);
});
test('world receiver position survives zoom, translation and raised sprites',()=>{
  for(const scale of [.5,1,2]){const camera={x:120,y:80,scale},point=receiverAt({x:2,y:1,z:0},camera,120+40*scale,80+(60-40)*scale);assert.deepEqual(point,{x:2,y:1,z:1});}
});
test('theme changes rebuild alpha contacts from the active atlas instead of a previous theme',async()=>{
  await defaultSpriteAssets.preloadSprites(['environment','environment-dark']);const s=new GroundShadows(createCanvas(80,80).getContext('2d')),item={type:'garden',variant:'flowers',scale:.85};
  s.propMask(item,'color');const dark=s.propMask(item,'dark'),fresh=new GroundShadows(createCanvas(80,80).getContext('2d')).propMask(item,'dark');
  assert.deepEqual(dark.contacts,fresh.contacts);assert.deepEqual(dark.image.toBuffer('image/png'),fresh.image.toBuffer('image/png'));assert.notEqual(dark,s.propMask(item,'color'));
});
test('Canvas night fallback shades non-normal sprites and face shapes while preserving protected art',()=>{
  const canvas=createCanvas(80,40),ctx=createDrawContext(canvas.getContext('2d')),source=createCanvas(8,8),s=source.getContext('2d');s.fillStyle='#c0c0c0';s.fillRect(0,0,8,8);
  ctx.setLighting({profile:sceneLighting('camp'),camera:{x:0,y:0,scale:1},lights:[]});ctx.setMaterial({lighting:'lit',strength:0});ctx.setObject({type:'player',x:0,y:0});ctx.drawImage(source,0,0);ctx.fillStyle='#c0c0c0';ctx.beginPath();ctx.arc(20,4,4,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.setMaterial({lighting:'protected'});ctx.drawImage(source,32,0);ctx.restore();
  const pixel=x=>canvas.getContext('2d').getImageData(x,4,1,1).data;
  assert.ok(pixel(4)[0]<60&&pixel(20)[0]<60);assert.equal(pixel(36)[0],192);assert.equal(pixel(4)[3],255);assert.equal(pixel(12)[3],0);assert.ok(ctx.recording.lightingCacheBytes<=16000000);
  for(const id of ['gun','snowball','bomb','football'])assert.equal(spriteMaterial(defaultSpriteAssets,'effects',id).lighting,'lit');
  assert.equal(spriteMaterial(defaultSpriteAssets,'effects','amber').lighting,'emissive');ctx.clearLighting();assert.equal(ctx.recording.lightingCacheBytes,0);
});
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
  for(const z of [0,1,24]){const s=castVector({x:2,y:1,z,height:1},light);assert.ok([s.x,s.y,s.alpha].every(Number.isFinite));assert.ok(Math.hypot(s.x,s.y)<170);assert.ok(s.alpha>0&&s.alpha<=.48);}
  assert.notEqual(shadowProfile({type:'bench',angle:0}).angle,shadowProfile({type:'bench',angle:Math.PI/2}).angle);assert.equal(shadowProfile({type:'tree',scale:2}).height,shadowProfile({type:'tree'}).height*2);
});
test('static shadow geometry is cached across player movement and brightness flicker',()=>{
  const ctx=createCanvas(200,200).getContext('2d'),shadows=new GroundShadows(ctx),objects=[{type:'tree',x:2,y:2}],lights=[{x:0,y:0,height:.8,radius:8,intensity:.8,kind:'fire'}];shadows.static(objects,lights,'camp','color');const first=shadows.cache.surface;
  lights[0].intensity=1;shadows.static(objects,lights,'camp','color');assert.equal(shadows.cache.surface,first);objects[0].x++;shadows.static(objects,lights,'camp','color');assert.notEqual(shadows.cache.surface,first);shadows.destroy();assert.equal(shadows.cache,null);
});
test('finite-height occluders block a standing body but allow light above a low bench and high carry',()=>{
  const light={x:0,y:0,height:.8},target={type:'player',x:4,y:0,z:0},bench={type:'bench',x:2,y:0,angle:0};assert.equal(lightVisibility(target,light,[bench]),1);const tree={type:'tree',x:2,y:0};assert.ok(lightVisibility(target,light,[tree])<.4);assert.equal(lightVisibility({...target,z:shadowProfile(tree).height*2+light.height},light,[tree]),1);
});
test('local lighting respects theme, reduced motion and a bounded light count without mutating shared state',()=>{
  const scene={theme:'dark',now:5000,fire:emptyFire(999999)},before=structuredClone(scene),camera={x:300,y:200,scale:1};const a=sceneLights(scene,getMap('camp'),camera,true),b=sceneLights({...scene,now:6000},getMap('camp'),camera,true);
  assert.ok(a.length<=3&&a[0].kind==='fire');assert.ok(a.every(l=>l.color[0]===l.color[1]&&l.color[1]===l.color[2]));assert.deepEqual(scene,before);assert.equal(a[0].intensity,b[0].intensity);
  const q=new LightingQuality();for(let i=0;i<90;i++)q.sample(30,6000+i);assert.equal(q.level,1);for(let i=0;i<80;i++)q.sample(30,7000+i);assert.equal(q.level,1);
});
test('projected alpha preserves a bench leg gap and begins at its contact instead of a stretched oval',()=>{
  const canvas=createCanvas(120,90),ctx=canvas.getContext('2d'),s=new GroundShadows(ctx),mask=s.mask('two-legs',c=>{c.fillStyle='#000';c.fillRect(-20,-22,40,7);c.fillRect(-18,-15,6,15);c.fillRect(12,-15,6,15);},{ground:0});
  ctx.translate(60,30);s.project(ctx,mask,{x:0,y:0},{x:-4,y:-4,height:1.6,radius:12,intensity:1,kind:'lantern'});
  const alpha=(x,y)=>ctx.getImageData(60+x,30+y,1,1).data[3];assert.ok(alpha(15,3)>5,'Leg must project from its foot');assert.ok(alpha(0,3)<alpha(15,3)*.2,'Open space between legs must stay open');assert.equal(alpha(0,-15),0,'No ellipse extending toward the light');assert.ok(mask.contacts.length===2);
});
test('moving a lantern moves actual projected pixels; brightness does not rebuild static geometry',async()=>{
  await defaultSpriteAssets.preloadSprites(['environment']);const ctx=createCanvas(100,100).getContext('2d'),s=new GroundShadows(ctx),objects=[{type:'bench',id:'log-0',x:0,y:0,angle:0}],light={x:-4,y:1,height:1,radius:12,intensity:.6,kind:'lantern'};
  s.static(objects,[light],'camp','color');const first=s.activeLayers[0],before=first.surface.toBuffer('image/png');s.static(objects,[{...light,intensity:.8,radius:12.00001}],'camp','color');assert.equal(s.activeLayers[0],first,'Flicker and tiny fuel changes must reuse the texture');s.static(objects,[{...light,x:4,y:-1}],'camp','color');assert.notEqual(s.activeLayers[0],first);assert.notDeepEqual(s.activeLayers[0].surface.toBuffer('image/png'),before);s.static(objects,[],'camp','color');assert.equal(s.activeLayers.length,0,'No fixed directional cast may survive with no lights');
});
test('all character/prop shadows precede receivers and quality reduction uses one shared light list',async()=>{
  const old={window:globalThis.window,ResizeObserver:globalThis.ResizeObserver,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};let renderer;
  try{globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
    await defaultSpriteAssets.preloadSprites(defaultSpriteAssets.sceneSpriteIds());const canvas=createCanvas(700,600);canvas.getBoundingClientRect=()=>({width:700,height:600});canvas.dataset={};renderer=new CampRenderer(canvas,()=>({players:[{id:'self',x:4,y:1,z:0,mapId:'camp'}],self:'self',now:5000}));await renderer.ready;renderer.ctx=createDrawContext(renderer.ctx);renderer.groundShadows.ctx=renderer.ctx;
    let commands,frame;renderer.webgl={status:'ready',quality:{level:2},metrics:{normalDraws:1},render(c,f){commands=c;frame=f;},destroy(){}};renderer.draw(5000);
    const shadows=commands.map((c,i)=>c.object?.type==='ground-shadow'?i:-1).filter(i=>i>=0),firstReceiver=commands.findIndex(c=>c.object&&c.object.type!=='ground-shadow');assert.ok(shadows.length>5);assert.ok(Math.max(...shadows)<firstReceiver,'Ground shadows may never paint over an earlier receiver');assert.equal(frame.lights,renderer.groundShadows.lastLights);assert.equal(frame.lights,renderer.groundLights.lastLights);
    renderer.webgl.quality.level=0;renderer.draw(5016);assert.equal(frame.lights.length,1);assert.equal(frame.lights,renderer.groundShadows.lastLights);assert.equal(frame.lights,renderer.groundLights.lastLights);
  }finally{renderer?.destroy();Object.assign(globalThis,old);}
});
test('ground shadow clipping keeps the same rounded isometric boundary at DPR and zoom',()=>{
  const c=createDrawContext(createCanvas(200,200).getContext('2d'),{dpr:()=>2});c.setTransform(3,0,0,3,100,120);c.recording.begin();c.save();c.clipGround(6);c.drawImage(createCanvas(2,2),0,0);c.restore();const clips=c.recording.end()[0].clips;assert.equal(clips.length,1);assert.equal(clips[0].kind,2);assert.deepEqual(clips[0].rect,[-670,-300,1440,720]);assert.equal(clips[0].radius,120);
});
test('a fresh dark scene builds masks from its loaded dark sheets without requesting colour assets',async()=>{
  await defaultSpriteAssets.preloadSprites(['environment-dark',defaultSpriteAssets.characterSheet(0,'dark')]);const requested=[],assets={...defaultSpriteAssets,getSprite(id){requested.push(id);return defaultSpriteAssets.getSprite(id);}},s=new GroundShadows(createCanvas(100,100).getContext('2d'),{assets});assert.ok(s.propMask({type:'tree'},'dark'));assert.ok(s.playerMask({x:0,y:0},{theme:'dark'}));assert.ok(requested.length>=2&&requested.every(id=>id.includes('-dark')));
});
