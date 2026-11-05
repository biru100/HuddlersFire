import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, roomQuery } from './api-fixture.mjs';
import { emptyFire, fuelAt, fireStrength, addFirewood, MAX_FIRE_FUEL, STOKE_COOLDOWN, fireLevel, FIRE_STYLES, stokeRemaining, stokeWaitLabel, changeFireStyle } from '../lib/camp-fire.mjs';
import { CAMP_BENCHES, CAMP_SEATS, nearestSeat, isSeated, SEAT_REACH } from '../lib/camp-seats.mjs';
import { spawnPlayer, applyPlayerAction, simulateWorld, validPlayerState } from '../lib/camp-world.mjs';
import { emptyWeapons } from '../lib/camp-weapons.mjs';
import { emptyBall } from '../lib/camp-ball.mjs';
import { emptyMusic } from '../lib/camp-media.mjs';
import { visiblePlayers, fireConversation } from '../lib/camp-focus.mjs';
import { fullWire, deltaWire, WireReceiver } from '../lib/camp-wire.mjs';
import { encodePlayer, decodeSnapshot, captureRecovery, restoreRecovery } from '../lib/camp-snapshot.mjs';
import { PROTOCOL_VERSION, CommandLedger, validAction } from '../lib/camp-protocol.mjs';
import { CampNetwork } from '../lib/camp-network.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { CampAudio } from '../lib/camp-audio.mjs';
import { getMap } from '../lib/camp-maps.mjs';

const seat=CAMP_SEATS[0];
const player=(id='a',extra={})=>({id,name:id,color:'#dcc08a',...spawnPlayer(),connected:true,x:seat.exitX,y:seat.exitY,...extra});
const act=(kind,extra={})=>({id:crypto.randomUUID(),kind,...extra});
function setup(){const a=player(),b=player('b'),players=new Map([['a',a],['b',b]]),fire=emptyFire(1000);return{a,b,players,fire};}
const sit=s=>applyPlayerAction(s.players,'a',act('seat',{seatId:seat.id}),1000,null,s.fire);
const snap=s=>({t:'state',v:PROTOCOL_VERSION,epoch:1,seq:1,now:1000,players:[...s.players.values()].map(encodePlayer),fire:s.fire,weapons:emptyWeapons(),ball:emptyBall(),checkpoint:{chatId:null,musicRevision:0}});

test('logs have sixteen exclusive seats; distance, map, airborne and carrying restrictions are authoritative',()=>{
  assert.equal(CAMP_SEATS.length,16);const s=setup();assert.equal(nearestSeat(s.players,s.a).id,seat.id);assert.equal(sit(s),null);assert.ok(isSeated(s.a));assert.ok(validPlayerState(s.a));
  assert.equal(s.a.mapRevision,1,'Sitting invalidates movement queued before the seat action');
  assert.ok(applyPlayerAction(s.players,'b',act('seat',{seatId:seat.id}),1000));
  for(const extra of [{mapId:'playground'},{motion:'airborne'},{carrying:'a'},{x:5,y:5},{connected:false}]){
    const p=player('b',extra);s.players.set('b',p);assert.ok(applyPlayerAction(s.players,'b',act('seat',{seatId:CAMP_SEATS[1].id}),1000));
  }
  assert.equal(validAction(act('seat',{seatId:'../../x'})),false);
});

test('the whole log is reachable from either side and both ends, including while sitting on the ground',()=>{
  for(const bench of CAMP_BENCHES)for(const [radial,tangent]of [[-1.35,0],[1.35,0],[0,-1.7],[0,1.7]]){
    const p=player('a',{x:bench.x+Math.cos(bench.angle)*radial-Math.sin(bench.angle)*tangent,y:bench.y+Math.sin(bench.angle)*radial+Math.cos(bench.angle)*tangent,sitting:true});
    const players=new Map([['a',p]]),near=nearestSeat(players,p);
    assert.ok(near,'A nearby log must be available');
    assert.equal(applyPlayerAction(players,'a',act('seat',{seatId:near.id}),1000),null);assert.ok(isSeated(p));assert.ok(validPlayerState(p));
  }
  const s=setup();Object.assign(s.a,{x:CAMP_BENCHES[0].x+SEAT_REACH,y:CAMP_BENCHES[0].y});
  assert.equal(sit(s),null,'The exact approach boundary is accepted');
  Object.assign(s.a,{seatId:null,x:CAMP_BENCHES[0].x+SEAT_REACH+.01,y:CAMP_BENCHES[0].y,sitting:false});
  assert.ok(sit(s),'Outside the boundary cannot remotely sit');
  s.a.x=seat.exitX;s.a.y=seat.exitY;
  Object.assign(s.b,{seatId:seat.id,sitting:true,x:seat.x,y:seat.y,z:.18});
  const alternative=nearestSeat(s.players,s.a);assert.ok(alternative);assert.notEqual(alternative.id,seat.id);
  assert.equal(applyPlayerAction(s.players,'a',act('seat',{seatId:alternative.id}),1000),null);
});

test('walking, standing, jumping, map travel and disconnect release seats to walkable positions',()=>{
  for(const command of [act('posture',{posture:'standing'}),act('jump')]){
    const s=setup();sit(s);applyPlayerAction(s.players,'a',command,1100);assert.equal(s.a.seatId,null);assert.ok(validPlayerState(s.a));
  }
  const s=setup();sit(s);simulateWorld(s.players,new Map([['a',{dx:.5,dy:0,sitting:false}]]),.05,1050);assert.equal(s.a.seatId,null);assert.equal(s.a.sitting,false);assert.ok(validPlayerState(s.a));
  sit(s);s.a.connected=false;simulateWorld(s.players,new Map(),.05,1100);assert.equal(s.a.seatId,null);
});

test('fire decays by camp time to persistent embers; only seated players can add bounded fuel',()=>{
  const s=setup();assert.equal(fuelAt(s.fire,61000),60);assert.equal(fuelAt(s.fire,999999),0);assert.equal(fireStrength(s.fire,999999),.12);
  assert.ok(addFirewood(s.fire,s.a,2000));sit(s);assert.equal(addFirewood(s.fire,s.a,2000),null);assert.equal(s.fire.revision,1);assert.equal(s.fire.stokedAt,2000);
  const before=structuredClone(s.fire);assert.ok(addFirewood(s.fire,s.a,3000));assert.deepEqual(s.fire,before);
  assert.equal(addFirewood(s.fire,s.a,2000+STOKE_COOLDOWN),null);assert.ok(s.fire.fuel<=MAX_FIRE_FUEL);
});

test('fire commands are idempotent, ignore client fuel overrides and preserve player cooldown across travel',()=>{
  const s=setup();sit(s);const n=Object.assign(Object.create(CampNetwork.prototype),{players:s.players,fire:s.fire,weapons:emptyWeapons(),player:'a',host:'a',isHost:true,callbacks:{},peers:new Map(),inputs:new Map(),ledger:new CommandLedger(),hostNow:()=>2000,tick(){}});
  const command=act('add-firewood',{fuel:999999,xp:999999});assert.ok(n.handleCommand('a',command).ok);assert.ok(n.handleCommand('a',command).ok);assert.equal(s.fire.revision,1);assert.equal(s.fire.xp,1);assert.ok(s.fire.fuel<=MAX_FIRE_FUEL);
  applyPlayerAction(s.players,'a',act('posture',{posture:'standing'}),2050);const portal=getMap('camp').portals.find(p=>p.id==='camp-play');Object.assign(s.a,{x:portal.x,y:portal.y});
  assert.equal(applyPlayerAction(s.players,'a',act('change-map',{mapId:'playground',portalId:'camp-play',mapRevision:s.a.mapRevision}),2100),null);assert.equal(s.a.mapId,'playground');assert.equal(s.a.lastStokeAt,2000);
});

test('ten-minute contribution cooldowns are independent and successful contributions alone earn shared XP',()=>{
  assert.equal(STOKE_COOLDOWN,600000);
  const s=setup();sit(s);assert.equal(addFirewood(s.fire,s.a,2000),null);
  assert.equal(applyPlayerAction(s.players,'b',act('seat',{seatId:CAMP_SEATS[1].id}),2000),null);
  assert.equal(addFirewood(s.fire,s.b,2000),null,'Another participant need not wait for the first');assert.equal(s.fire.xp,2);
  const before=structuredClone(s.fire);
  assert.ok(addFirewood(s.fire,s.a,2000+STOKE_COOLDOWN-1));assert.deepEqual(s.fire,before);assert.equal(s.a.lastStokeAt,2000);
  assert.equal(stokeRemaining(s.a,2000),600000);assert.equal(stokeWaitLabel(599999),'10:00');assert.equal(stokeWaitLabel(1),'0:01');
  assert.equal(addFirewood(s.fire,s.a,2000+STOKE_COOLDOWN),null);assert.equal(s.fire.xp,3);assert.equal(fireLevel(s.fire),2);
  const late=player('late',{seatId:CAMP_SEATS[2].id,sitting:true});
  s.fire.fuel=MAX_FIRE_FUEL;s.fire.updatedAt=2000+STOKE_COOLDOWN;
  assert.ok(addFirewood(s.fire,late,2000+STOKE_COOLDOWN));assert.equal(late.lastStokeAt,-1);assert.equal(s.fire.xp,3);
  late.sitting=false;assert.ok(addFirewood(s.fire,late,3000+STOKE_COOLDOWN));assert.equal(s.fire.xp,3);
  late.sitting=true;assert.equal(addFirewood(s.fire,late,4000+STOKE_COOLDOWN),null);assert.equal(s.fire.xp,4,'A previously rejected request can retry without losing its turn');
});

test('each shared level unlocks a selectable room-wide appearance without changing fuel, XP or wood cooldown',()=>{
  const s=setup();assert.ok(changeFireStyle(s.fire,s.a,'gold'));assert.ok(changeFireStyle(s.fire,s.a,'<script>'));
  assert.equal(validAction(act('fire-style',{style:'<script>'})),false);
  for(const style of FIRE_STYLES){
    s.fire.xp=(style.level-1)*3;assert.equal(fireLevel(s.fire),style.level);
    const before=structuredClone(s.fire),cooldown=s.a.lastStokeAt;
    assert.equal(applyPlayerAction(s.players,'a',act('fire-style',{style:style.id}),1000,null,s.fire),null);
    assert.equal(s.fire.style,style.id);assert.equal(s.fire.fuel,before.fuel);assert.equal(s.fire.updatedAt,before.updatedAt);assert.equal(s.fire.stokedAt,before.stokedAt);assert.equal(s.fire.xp,before.xp);assert.equal(s.a.lastStokeAt,cooldown);
    const revision=s.fire.revision;assert.equal(changeFireStyle(s.fire,s.b,style.id),null);assert.equal(s.fire.revision,revision,'Choosing the current appearance is harmless');
  }
  assert.equal(fireLevel({...s.fire,xp:999}),5);assert.equal(changeFireStyle(s.fire,s.b,'amber'),null,'Any camp participant can choose an unlocked style');
  s.b.mapId='playground';assert.ok(changeFireStyle(s.fire,s.b,'gold'));s.b.mapId='camp';s.b.connected=false;assert.ok(changeFireStyle(s.fire,s.b,'gold'));
});

test('shared growth, appearance and personal cooldowns survive full/delta and new-host recovery',()=>{
  const s=setup();sit(s);const base=structuredClone(snap(s)),receiver=new WireReceiver();assert.ok(receiver.read(fullWire(base),1,0).world);
  addFirewood(s.fire,s.a,2000);s.fire.xp=3;changeFireStyle(s.fire,s.b,'gold');
  const next={...snap(s),seq:2,now:2000},decoded=receiver.read(deltaWire(next,base),1,1).world;
  assert.deepEqual(decoded.fire,s.fire);assert.equal(decoded.players[0].lastStokeAt,2000);
  const recovery=captureRecovery(decoded,[],emptyMusic()),restored=restoreRecovery(recovery,[...s.players.values()]);
  assert.deepEqual(restored.fire,s.fire);assert.equal(stokeRemaining(restored.players.get('a'),restored.now),600000);
  assert.ok(addFirewood(restored.fire,restored.players.get('a'),restored.now+599999));assert.equal(addFirewood(restored.fire,restored.players.get('a'),restored.now+600000),null);
  restored.fire.style='amber';assert.equal(s.fire.style,'gold','Recovery must not alias the original fire');
  for(const extra of [{xp:-1},{xp:.5},{xp:Infinity},{xp:Number.MAX_SAFE_INTEGER+1},{style:'bogus'},{xp:0,style:'gold'}]){
    assert.equal(decodeSnapshot({...next,fire:{...next.fire,...extra}},1),null);
    const fresh=new WireReceiver();fresh.read(fullWire(base),1,0);assert.equal(fresh.read({...deltaWire(next,base),h:{...next.fire,...extra}},1,1).world,null);
  }
  assert.equal(emptyFire(1000).xp,0);assert.equal(emptyFire(1000).style,'amber','A new room starts from the first appearance');
});

test('seat and fire survive full/delta checkpoints and recovery; malformed fuel or duplicate seating is rejected',()=>{
  const s=setup();sit(s);const base=structuredClone(snap(s)),receiver=new WireReceiver();assert.ok(receiver.read(fullWire(base),1,0).world);
  addFirewood(s.fire,s.a,2000);const next={...snap(s),seq:2,now:2000,checkpoint:undefined};assert.deepEqual(receiver.read(deltaWire(next,base),1,1).world.fire,s.fire);
  const saved=captureRecovery(base,[],emptyMusic()),restored=restoreRecovery(saved,[...s.players.values()]);assert.equal(restored.players.get('a').seatId,seat.id);assert.deepEqual(restored.fire,base.fire);
  for(const fuel of [-1,Infinity,MAX_FIRE_FUEL+1])assert.equal(decodeSnapshot({...base,fire:{...base.fire,fuel}},1),null);
  assert.equal(decodeSnapshot({...base,fire:{...base.fire,updatedAt:base.now+100}},1),null);
  assert.equal(receiver.read({...deltaWire(next,base),h:null},1,2).world,null);
  const bad=structuredClone(base);Object.assign(bad.players[1],bad.players[0],{id:'b'});assert.equal(decodeSnapshot(bad,1),null);
});

test('fire audio does not replay initial, late, recovered or other-map wood events',()=>{
  const sound=new CampAudio(),fire={...emptyFire(1000),revision:1,stokedAt:1000};let flares=0;sound.flare=()=>flares++;
  sound.updateScene(fire,1100,true);assert.equal(flares,0);
  const next={...fire,revision:2,updatedAt:2000,stokedAt:2000};sound.updateScene(next,2100,true);sound.updateScene(next,2200,true);assert.equal(flares,1);
  sound.updateScene({...next,revision:3,style:'gold',xp:next.xp},2250,true);assert.equal(flares,1,'Changing appearance must not replay wood audio');
  sound.updateScene(fire,2200,true);sound.updateScene(next,2300,true);assert.equal(flares,1);
  sound.updateScene({...next,revision:3},5000,true);assert.equal(flares,1);
  const elsewhere={...next,revision:4,updatedAt:6000,stokedAt:6000};sound.updateScene(elsewhere,6100,false);sound.updateScene(elsewhere,6200,true);assert.equal(flares,1);
});

test('effects mute applies before loading or resume completes and late loads never restart muted audio',async()=>{
  let loaded,resumed;const sources=[];
  class Context {
    state='suspended';currentTime=1;destination={};
    createGain(){return{gain:{value:0,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;}},connect(to){this.to=to;},disconnect(){}};}
    async decodeAudioData(){return{numberOfChannels:1,sampleRate:1000,length:1000,getChannelData:()=>new Float32Array(1000)};}
    createBuffer(_channels,length){return{duration:length/1000,getChannelData:()=>new Float32Array(length)};}
    createBufferSource(){const s={playbackRate:{value:1},connect(to){this.to=to;},start(){},stop(){},disconnect(){}};sources.push(s);return s;}
    resume(){return new Promise(resolve=>{resumed=()=>{this.state='running';resolve();};});}
    async close(){}
  }
  const audio=new CampAudio(Context,()=>new Promise(resolve=>{loaded=()=>resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});}));
  const first=audio.setVolume(.8);assert.equal(audio.gain.gain.value,.8);
  await audio.setVolume(0);assert.equal(audio.gain.gain.value,0);assert.equal(audio.volume,0);
  resumed();loaded();await first;assert.equal(sources.length,0,'A stale startup cannot restart sound after mute');
  await audio.setVolume(.3);assert.equal(sources.length,1);assert.equal(audio.gain.gain.value,.3);
  audio.flare();assert.equal(sources.length,2);assert.equal(sources[0].to,audio.ambienceGain);assert.equal(sources[1].to.to,audio.campGain);
  assert.equal(audio.ambienceGain.to,audio.campGain);assert.equal(audio.campGain.to,audio.gain);assert.equal(audio.gain.to,audio.context.destination);
  await audio.setVolume(.1);assert.equal(audio.gain.gain.value,.1);await audio.setVolume(0);assert.equal(audio.gain.gain.value,0,'The playing flare shares the same mute');
  audio.updateScene(emptyFire(),100,false);assert.equal(audio.campGain.gain.value,0);audio.destroy();
});

test('personal hiding applies only while seated and never changes shared players or full chat history',()=>{
  const s=setup(),all=[s.a,s.b],before=structuredClone(all);assert.equal(visiblePlayers(all,s.a,['b']).length,2);sit(s);assert.deepEqual(visiblePlayers(all,s.a,['a','b']).map(p=>p.id),['a']);
  const chat=[{by:'b',name:'b',text:'hello',kind:'chat',mapId:'camp',at:1000},{by:'a',name:'a',text:'hi',kind:'chat',mapId:'camp',at:1001},{by:'b',kind:'chat',mapId:'playground',at:1002}];
  assert.equal(fireConversation(chat,2000,['b']).length,1);assert.equal(chat.length,3);assert.equal(fireConversation(chat,15000).length,0);assert.deepEqual(all[1],before[1]);
});

test('unlinked users cannot create or join by code, poll a room or signal; public discovery remains available',async()=>{
  const f=fixture();try{
    const h=await f.enrolled('Host'),u=await f.enrolled('Unlinked',false),room=(await h('rooms',{op:'create',visibility:'public'})).value;
    assert.equal((await u('rooms')).status,200);assert.equal((await u('rooms',{op:'create'})).status,403);assert.equal((await u('rooms',{op:'join',code:room.code})).status,403);
    assert.equal((await u(roomQuery(room))).status,403);assert.equal((await u('room',{op:'signal',code:room.code,player:room.player})).status,403);
    u.linkDiscord();assert.equal((await u('rooms',{op:'join',code:room.code})).status,201);assert.equal((await u('discord/unlink',{})).status,409);
  }finally{f.sqlite.close();}
});

test('focused renderer zooms toward fire, hides selected bodies/picking and restores the previous camera after standing',()=>{
  const names=['window','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'],saved=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
  globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};let r;
  try{
    const s=setup(),canvas=createCanvas(800,650);canvas.getBoundingClientRect=()=>({left:0,top:0,width:800,height:650});
    const scene={players:[s.a,s.b],self:'a',fire:s.fire,now:1000,chat:[{id:'m',by:'a',name:'a',text:'fire talk',kind:'chat',mapId:'camp',at:1000}],hiddenIds:['b'],zoom:1.25};
    r=new CampRenderer(canvas,()=>scene);r.draw(1000);const scale=r.camera.scale;assert.equal(r.hitAreas.length,2);sit(s);r.draw(1100);assert.ok(r.camera.scale>scale);assert.equal(r.hitAreas.length,1);assert.ok(r.bubbleAreas.length>0);assert.equal(r.pickSeat(r.seatAreas[0].x,r.seatAreas[0].y),seat.id);
    applyPlayerAction(s.players,'a',act('posture',{posture:'standing'}),1200);r.draw(1200);assert.equal(r.hitAreas.length,2);assert.equal(r.camera.scale,scale);
    canvas.getBoundingClientRect=()=>({left:0,top:0,width:390,height:700});r.resize();sit(s);
    scene.occlusions=[{x:158,y:260,width:222,height:200,kind:'music'},{x:12,y:204,width:132,height:85,kind:'hud'},{x:12,y:12,width:160,height:90,kind:'hud'}];
    r.draw(1300);assert.ok(r.camera.x+40*r.camera.scale<158,'The focused fire stays beside the mobile video');assert.ok(r.bubbleAreas.length);
    for(const b of r.bubbleAreas){assert.ok(b.y+b.height<r.camera.y,'Conversation stays above the fire');for(const o of scene.occlusions)assert.ok(b.x+b.width<=o.x||b.x>=o.x+o.width||b.y+b.height<=o.y||b.y>=o.y+o.height,'Fire conversation must avoid visible controls and video');}
  }finally{r?.destroy();for(const k of names){if(saved[k]===undefined)delete globalThis[k];else globalThis[k]=saved[k];}}
});
