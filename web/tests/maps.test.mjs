import { emptyFire } from '../lib/camp-fire.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { CAMP_MAP, PLAY_MAP, SHOW_MAP, getMap } from '../lib/camp-maps.mjs';
import { spawnPlayer, applyPlayerAction, simulateWorld, validPlayerState, validPosition, canLift, canUseRadio, RADIO, TRAMPOLINES } from '../lib/camp-world.mjs';
import { emptyWeapons, stepWeapons } from '../lib/camp-weapons.mjs';
import { emptyBall, stepBall } from '../lib/camp-ball.mjs';
import { PROTOCOL_VERSION, validAction, CommandLedger } from '../lib/camp-protocol.mjs';
import { encodePlayer, decodeSnapshot, captureRecovery, restoreRecovery } from '../lib/camp-snapshot.mjs';
import { fullWire, deltaWire, WireReceiver } from '../lib/camp-wire.mjs';
import { emptyMusic } from '../lib/camp-media.mjs';
import { CampNetwork } from '../lib/camp-network.mjs';
import { CampRenderer } from '../lib/camp-renderer.mjs';

const player=(id,mapId=CAMP_MAP,extra={})=>({id,name:id,color:'#e5a76d',...spawnPlayer(0,mapId),connected:true,x:0,y:2,...extra});
const action=(kind,extra={})=>({id:crypto.randomUUID(),kind,...extra});
const travel=(p,mapId)=>{
  const portal=getMap(p.mapId).portals.find(o=>o.destination===mapId);
  Object.assign(p,{x:portal.x+1,y:portal.y});
  return action('change-map',{mapId,portalId:portal.id,mapRevision:p.mapRevision});
};
const snapshot=(players,extra={})=>({t:'state',v:PROTOCOL_VERSION,epoch:1,seq:1,now:1000,players:[...players.values()].map(encodePlayer),fire:emptyFire(),weapons:emptyWeapons(),ball:emptyBall(),checkpoint:{chatId:null,musicRevision:0},...extra});

test('entry defaults to camp; both maps have valid spawns and distinct facilities',()=>{
  assert.equal(spawnPlayer().mapId,CAMP_MAP);
  for(const mapId of [CAMP_MAP,PLAY_MAP,SHOW_MAP]) for(let i=0;i<16;i++) {
    const p={id:String(i),...spawnPlayer(i,mapId)};
    assert.ok(validPosition(p.x,p.y,mapId));assert.ok(validPlayerState(p));
  }
  assert.equal(getMap(CAMP_MAP).trampolines.length,0);
  assert.equal(getMap(PLAY_MAP).fire,false);assert.equal(getMap(PLAY_MAP).radio,null);
  assert.ok(validPosition(0,0,PLAY_MAP));assert.equal(validPosition(0,0,CAMP_MAP),false);
  assert.equal(validAction(action('change-map',{mapId:'elsewhere'})),false);
});

test('camp rejects every toy and lifting while posture, jump, emotes and presence remain usable',()=>{
  const a=player('a'),b=player('b',CAMP_MAP,{x:.5}),players=new Map([['a',a],['b',b]]),weapons=emptyWeapons();
  for(const weapon of ['gun','snowball','bomb']) assert.ok(applyPlayerAction(players,'a',action('equip',{weapon}),0,weapons));
  assert.ok(applyPlayerAction(players,'a',action('fire',{dx:1,dy:0}),0,weapons));
  assert.ok(applyPlayerAction(players,'a',action('lift',{target:'b'}),0,weapons));
  assert.equal(canLift(players,a,b),false);assert.equal(weapons.projectiles.length,0);
  for(const command of [action('posture',{posture:'sitting'}),action('emote',{emote:'wave'}),action('presence',{presence:'working',statusText:'集中',workText:'개발',allowCall:false}),action('jump')]) {
    assert.equal(applyPlayerAction(players,'a',command,0,weapons),null);
  }
  simulateWorld(players,new Map(),.2,200,weapons);assert.equal(a.motion,'airborne');assert.equal(a.presence,'working');
});

test('identical coordinates in separate maps never share bullets, snowballs, blasts or lifting',()=>{
  for(const weapon of ['gun','snowball','bomb']) {
    const a=player('a',PLAY_MAP),rest=player('rest',CAMP_MAP,{x:.7}),target=player('target',PLAY_MAP,{x:.7});
    const players=new Map([['a',a],['rest',rest],['target',target]]),weapons=emptyWeapons(),hits=[];
    assert.equal(canLift(players,a,rest),false);assert.equal(canLift(players,a,target),true);
    applyPlayerAction(players,'a',action('equip',{weapon}),0,weapons);
    applyPlayerAction(players,'a',action('fire',{dx:1,dy:0}),0,weapons);
    if(weapon==='bomb') {Object.assign(weapons.projectiles[0],{x:.7,y:2,z:0,vx:0,vy:0,vz:0});}
    for(let i=1;i<=110;i++) stepWeapons(weapons,players,1/60,i*1000/60,[],p=>hits.push(p.id));
    assert.ok(hits.includes('target'),weapon);assert.equal(hits.includes('rest'),false,weapon);
  }
});

test('ball, trampoline and radio obey the current map at the same coordinates',()=>{
  for(const mapId of [CAMP_MAP,PLAY_MAP]) {
    const p=player('a',mapId,{x:3.25,y:.6,moving:true}),players=new Map([['a',p]]),ball=emptyBall();
    stepBall(ball,players,1/60,[]);assert.equal(ball.vx>0,mapId===PLAY_MAP);
    Object.assign(p,{x:TRAMPOLINES[0].x,y:TRAMPOLINES[0].y,moving:false});
    simulateWorld(players,new Map(),1/60,1000);assert.equal(p.motion==='airborne',mapId===PLAY_MAP);
    Object.assign(p,{x:RADIO.x+1,y:RADIO.y,motion:'grounded'});
    assert.equal(canUseRadio(p),mapId===CAMP_MAP);
  }
});

test('a carried member cannot travel; a grounded carrier leaves the upper chain in the original map',()=>{
  const players=new Map(['a','b','c','d'].map(id=>[id,player(id,PLAY_MAP)]));
  for(const [id,target] of [['c','d'],['b','c'],['a','b']]) assert.equal(applyPlayerAction(players,id,action('lift',{target}),0),null);
  const carried=players.get('b');assert.ok(applyPlayerAction(players,'b',travel(carried,CAMP_MAP),1000));assert.equal(carried.mapId,PLAY_MAP);
  const b=players.get('a');Object.assign(b,{presence:'away',workText:'개발 중',allowCall:false,allowCarry:false,lastCallAt:100,lastCalledAt:200,nextShotAt:1500});
  const weapons=emptyWeapons();weapons.projectiles=[{owner:'a'},{owner:'b'}];
  assert.equal(applyPlayerAction(players,'a',travel(b,CAMP_MAP),1000,weapons),null);
  assert.equal(b.mapId,CAMP_MAP);assert.equal(b.mapRevision,1);assert.equal(b.weapon,'none');assert.equal(b.motion,'grounded');
  assert.equal(b.presence,'away');assert.equal(b.workText,'개발 중');assert.equal(b.allowCarry,false);assert.equal(b.allowCall,false);
  assert.equal(b.lastCallAt,100);assert.equal(b.lastCalledAt,200);assert.equal(b.nextShotAt,1500);
  assert.equal(b.carrying,null);assert.equal(weapons.projectiles.length,1);assert.equal(weapons.projectiles[0].owner,'b');
  for(const p of players.values()){assert.equal(p.carrying,null);assert.equal(p.carriedBy,null);assert.ok(validPlayerState(p));if(p.id!=='a')assert.equal(p.mapId,PLAY_MAP);}
});

test('portals reject flight, throws and respawning; falls return to the current map',()=>{
  for(const motion of ['airborne','falling','respawning']) {
    const p=player('a',PLAY_MAP,{motion,z:motion==='airborne'?2:-2,vx:2,vy:1,vz:-1,thrown:motion==='airborne'}),players=new Map([['a',p]]);
    const before=structuredClone(p);assert.ok(applyPlayerAction(players,'a',travel(p,CAMP_MAP),1000));
    assert.equal(p.mapId,PLAY_MAP);assert.equal(p.z,before.z);assert.equal(p.vx,before.vx);assert.equal(p.motion,before.motion);
  }
  for(const mapId of [CAMP_MAP,PLAY_MAP,SHOW_MAP]) {
    const p=player('a',mapId,{motion:'respawning',respawnAt:100,mapRevision:4,presence:'working'}),players=new Map([['a',p]]);
    simulateWorld(players,new Map(),.1,200);assert.equal(p.mapId,mapId);assert.equal(p.mapRevision,4);assert.equal(p.presence,'working');
  }
});

test('full/delta checkpoints and recovery retain maps and reject cross-map chains or armed camp players',()=>{
  const players=new Map([['a',player('a')],['b',player('b',PLAY_MAP)]]),base=snapshot(players),receiver=new WireReceiver();
  assert.ok(receiver.read(fullWire(base),1,0).world);
  applyPlayerAction(players,'b',travel(players.get('b'),CAMP_MAP),1000);
  const next=snapshot(players,{seq:2,checkpoint:undefined}),decoded=receiver.read(deltaWire(next,base),1,1).world;
  assert.equal(decoded.players[1].mapId,CAMP_MAP);assert.equal(decoded.players[1].mapRevision,1);
  const recovery=captureRecovery(base,[],emptyMusic()),restored=restoreRecovery(recovery,[...players.values()]);
  assert.equal(restored.players.get('b').mapId,PLAY_MAP);assert.equal(restored.players.get('a').mapId,CAMP_MAP);
  for(const changes of [{mapId:'invalid'},{mapRevision:-1},{weapon:'gun'},{carrying:'b'}]) {
    const bad=structuredClone(base);Object.assign(bad.players[0],changes);assert.equal(decodeSnapshot(bad,1),null);
  }
  const bad=structuredClone(base);Object.assign(bad.players[0],{mapId:PLAY_MAP,carrying:'b'});Object.assign(bad.players[1],{mapId:CAMP_MAP,carriedBy:'a',motion:'carried'});
  assert.equal(decodeSnapshot(bad,1),null);
});

test('host clears queued movement at travel, deduplicates requests and rejects inputs from earlier map visits',()=>{
  const a=player('a',CAMP_MAP),players=new Map([['a',a]]);
  const n=Object.assign(Object.create(CampNetwork.prototype),{player:'host',host:'host',epoch:1,isHost:true,players,inputs:new Map([['a',{dx:1,dy:0,sitting:false}]]),peers:new Map(),ledger:new CommandLedger(),weapons:emptyWeapons(),callbacks:{},tick(){}});
  const command=travel(a,PLAY_MAP);assert.ok(n.handleCommand('a',command).ok);assert.equal(n.inputs.has('a'),false);
  assert.ok(n.handleCommand('a',command).ok);assert.equal(a.mapRevision,1);
  const peer={id:'a',ready:true},channel={label:'camp',close(){}};n.peers.set('a',peer);n.attachChannel(peer,channel);
  const input=mapRevision=>channel.onmessage({data:JSON.stringify({t:'input',v:PROTOCOL_VERSION,epoch:1,mapRevision,dx:1,dy:0,sitting:false})});
  input(0);assert.equal(n.inputs.has('a'),false);input(1);assert.equal(n.inputs.get('a').dx,1);
  // A -> B -> A must not accept delayed input from A's earlier visit.
  applyPlayerAction(players,'a',travel(a,CAMP_MAP),2000);n.inputs.clear();input(0);assert.equal(n.inputs.has('a'),false);
});

test('travel snaps client interpolation even when the new spawn is nearby',()=>{
  const old=player('a',CAMP_MAP),players=new Map([['a',old]]),member={id:'a',name:'a',color:'#fff'};
  const n=Object.assign(Object.create(CampNetwork.prototype),{epoch:1,isHost:false,player:'a',host:'host',players,members:[member],peers:new Map(),lastSequence:-1,chat:[],music:emptyMusic(),callbacks:{},input:{dx:1,dy:0,sitting:false}});
  const next=player('a',PLAY_MAP,{x:.1,y:2,mapRevision:1});
  n.receiveWorld(snapshot(new Map([['a',next]]),{checkpoint:undefined}));
  assert.equal(old.x,.1);assert.equal(old.mapId,PLAY_MAP);assert.equal(n.input.dx,0);
});

test('renderer and picking exclude the other map; toys and radio effects follow the viewed map',()=>{
  const names=['window','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'],saved=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
  globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  let renderer;
  try {
    const a=player('a'),b=player('b',PLAY_MAP,{bubble:'놀이터 대화',bubbleUntil:5000}),canvas=createCanvas(700,600);
    canvas.getBoundingClientRect=()=>({left:0,top:0,width:700,height:600});
    const scene={players:[a,b],self:'a',now:1000,ball:emptyBall(),weapons:{...emptyWeapons(),effects:[{kind:'explosion',x:0,y:2,z:0,at:900,expiresAt:1500,radius:1.7}]}};
    renderer=new CampRenderer(canvas,()=>scene);const calls={fire:0,trampoline:0,football:0,weaponEffect:0,radio:0};
    for(const key of Object.keys(calls)){const original=renderer[key].bind(renderer);renderer[key]=(...args)=>{calls[key]++;return original(...args);};}
    renderer.draw(1000);assert.deepEqual(renderer.hitAreas.map(a=>a.id),['a']);assert.equal(calls.weaponEffect,0);assert.equal(calls.football,0);assert.equal(calls.trampoline,0);assert.ok(calls.radio>0);
    scene.self='b';renderer.draw(1000);assert.deepEqual(renderer.hitAreas.map(a=>a.id),['b']);assert.ok(calls.football>0);assert.ok(calls.trampoline>0);assert.ok(calls.weaponEffect>0);
    const area=renderer.hitAreas[0];assert.equal(renderer.pickPlayer(area.head.x,area.head.y),'b');
  } finally {renderer?.destroy();for(const key of names){if(saved[key]===undefined)delete globalThis[key];else globalThis[key]=saved[key];}}
});
