import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, roomQuery } from './api-fixture.mjs';
import { HOST_LEASE, MEMBER_TTL } from '../lib/camp-config.mjs';
import { spawnPlayer, applyPlayerAction, canLift, simulateWorld, validPosition, validPlayerState } from '../lib/camp-world.mjs';
import { presenceDefaults, callError, validChatEntry } from '../lib/camp-presence.mjs';
import { emptyWeapons, applyWeaponAction, stepWeapons } from '../lib/camp-weapons.mjs';
import { CampNetwork } from '../lib/camp-network.mjs';
import { PROTOCOL_VERSION, MAX_FRAME_BYTES, CommandLedger, validAction } from '../lib/camp-protocol.mjs';
import { fullWire } from '../lib/camp-wire.mjs';
import { decodeSnapshot, encodePlayer, captureRecovery, restoreRecovery } from '../lib/camp-snapshot.mjs';
import { emptyMusic } from '../lib/camp-media.mjs';

test('public discovery hides existing/unlisted rooms and exposes only a bounded summary', async()=>{
  const f=fixture();try {
    const a=await f.enrolled('A'),b=await f.enrolled('B'),c=await f.enrolled('C');
    const old=(await a('rooms',{op:'create'})).value;
    await b('rooms',{op:'create',title:'친구만',visibility:'unlisted'});
    const room=(await c('rooms',{op:'create',title:'함께 개발 ♥',visibility:'public'})).value;
    const listing=(await f.client()('rooms')).value;
    assert.equal(listing.rooms.length,1);assert.deepEqual(listing.rooms[0],{code:room.code,title:'함께 개발 ♥',count:1,capacity:16,state:'open'});
    assert.equal(f.sqlite.prepare('SELECT visibility FROM camp_rooms WHERE code=?').get(old.code).visibility,'unlisted');
    assert.equal((await a('rooms',{op:'join',code:room.code})).status,201);
    assert.equal((await c('rooms',{op:'create',title:'x'.repeat(41),visibility:'public'})).status,400);
    assert.equal((await c('rooms',{op:'create',title:'valid',visibility:'unknown'})).status,400);
    assert.equal((await f.client()('rooms?offset=-1')).status,400);
  } finally {f.sqlite.close();}
});

test('public listing reflects capacity, recovery, succession and expired rooms without leaking membership',async()=>{
  const f=fixture();try {
    const h=await f.enrolled('H'),g=await f.enrolled('G'),browse=f.client();
    const room=(await h('rooms',{op:'create',title:'개발방',visibility:'public'})).value;
    const guest=(await g('rooms',{op:'join',code:room.code})).value;
    f.advance(HOST_LEASE+1);
    assert.equal((await browse('rooms')).value.rooms[0].state,'recovering');
    await g(roomQuery(guest));
    assert.equal((await browse('rooms')).value.rooms[0].code,room.code);
    f.advance(MEMBER_TTL+1);
    assert.deepEqual((await browse('rooms')).value.rooms,[]);
    assert.equal((await g('rooms',{op:'join',code:room.code})).status,404);
  } finally {f.sqlite.close();}
});

test('public pagination is bounded and full rooms reject a late join atomically',async()=>{
  const f=fixture();try {
    const browse=f.client();let first;
    for(let i=0;i<22;i++) {const c=await f.enrolled('H'+i);const r=(await c('rooms',{op:'create',visibility:'public'})).value;first??=r;f.advance(1);}
    const page=(await browse('rooms')).value;
    assert.equal(page.rooms.length,20);assert.equal(page.next,20);
    const second=(await browse('rooms?offset=20')).value;assert.equal(second.rooms.length,2);assert.equal(second.next,null);
    assert.ok(second.rooms.every(r=>!page.rooms.some(p=>p.code===r.code)));
    for(let i=0;i<15;i++){const c=await f.enrolled('G'+i);assert.equal((await c('rooms',{op:'join',code:first.code})).status,201);}
    assert.equal((await browse('rooms?offset=20')).value.rooms.find(r=>r.code===first.code).state,'full');
    const extra=await f.enrolled('Extra');assert.equal((await extra('rooms',{op:'join',code:first.code})).status,409);
  } finally {f.sqlite.close();}
});

const world=()=>new Map(['a','b','c'].map((id,i)=>[id,{...spawnPlayer(i,'playground'),id,name:id,color:'#fff',x:i*.3,y:2,connected:true}]));
const presence=(extra={})=>({kind:'presence',...presenceDefaults(),...extra});
test('sitting blocks both ends of lifting and sitting carriers safely release a whole chain',()=>{
  const w=world(),a=w.get('a'),b=w.get('b');
  a.sitting=true;assert.equal(canLift(w,a,b),false);a.sitting=false;b.sitting=true;assert.equal(canLift(w,a,b),false);b.sitting=false;
  assert.equal(applyPlayerAction(w,'b',{kind:'lift',target:'c'},0),null);
  assert.equal(applyPlayerAction(w,'a',{kind:'lift',target:'b'},0),null);
  assert.equal(applyPlayerAction(w,'a',{kind:'posture',posture:'sitting'},1),null);
  assert.ok(a.sitting);assert.ok([...w.values()].every(p=>!p.carriedBy&&!p.carrying&&validPlayerState(p)));
});

test('presence changes preserve a carried chain and do not force posture or consent',()=>{
  const w=world();applyPlayerAction(w,'c',presence({workText:'작업 유지'}),0);
  applyPlayerAction(w,'b',{kind:'lift',target:'c'},0);applyPlayerAction(w,'a',{kind:'lift',target:'b'},0);
  applyPlayerAction(w,'b',presence({presence:'away',workText:'잠깐 휴식',statusText:'곧 복귀'}),1);
  const b=w.get('b');assert.equal(b.motion,'carried');assert.equal(b.carriedBy,'a');assert.equal(b.carrying,'c');
  assert.equal(w.get('c').workText,'작업 유지');assert.ok([...w.values()].every(validPlayerState));
  assert.equal(applyPlayerAction(w,'b',{kind:'escape'},100),null);
  assert.equal(b.carriedBy,null);assert.equal(b.carrying,'c');
  applyPlayerAction(w,'b',{kind:'allow-carry',allow:false},200);
  applyPlayerAction(w,'b',presence({presence:'working'}),300);
  assert.equal(b.allowCarry,false);
});

test('working and away players can move, jump and play without changing their status',()=>{
  for (const status of ['working','away']) {
    const w=world(),b=w.get('b'),state=emptyWeapons();
    applyPlayerAction(w,'b',presence({presence:status}),0);
    const x=b.x;simulateWorld(w,new Map([['b',{dx:1,dy:0,sitting:false}]]),.1,100,state);
    assert.ok(b.x>x);assert.ok(canLift(w,w.get('a'),b));
    assert.equal(applyPlayerAction(w,'b',{kind:'jump'},200,state),null);
    assert.equal(applyPlayerAction(w,'b',{kind:'equip',weapon:'gun'},300,state),null);
    assert.equal(applyPlayerAction(w,'b',{kind:'fire',dx:1,dy:0},1000,state),null);
    assert.equal(b.presence,status);
    const sitting=world();sitting.get('b').sitting=true;
    applyPlayerAction(sitting,'b',presence({presence:status}),0);
    assert.ok(sitting.get('b').sitting,'A social status must not silently stand up a seated player');
  }
});

test('working and away players receive projectiles and explosions; presence survives respawn',()=>{
  for (const status of ['working','away']) {
  const w=world(),state=emptyWeapons(),a=w.get('a'),b=w.get('b');
  Object.assign(a,{x:-1,y:2.4,weapon:'gun'});Object.assign(b,{x:0,y:2.4});
  applyPlayerAction(w,'b',presence({presence:status}),0);
  assert.equal(applyWeaponAction(state,w,'a',{kind:'fire',dx:1,dy:0},1000),null);
  const hits=[];for(let i=0;i<20;i++)stepWeapons(state,w,.02,1000+i*20,[],p=>hits.push(p.id));assert.ok(hits.includes('b'));
  hits.length=0;
  state.projectiles.push({id:'bomb',owner:'a',weapon:'bomb',x:b.x,y:b.y,z:0,vx:0,vy:0,vz:0,bornAt:0,expiresAt:0});
  stepWeapons(state,w,.02,2000,[],p=>hits.push(p.id));assert.ok(hits.includes('b'));
  applyPlayerAction(w,'b',presence({presence:status,workText:'보스 구현',allowCall:false}),3000);
  Object.assign(b,{motion:'respawning',respawnAt:0,lastCallAt:123});simulateWorld(w,new Map(),.02,4000);
  assert.equal(b.presence,status);assert.equal(b.workText,'보스 구현');assert.equal(b.allowCall,false);assert.equal(b.lastCallAt,123);
  }
});

test('presence commands are bounded, sanitized and do not accept remote cooldown overrides',()=>{
  const w=world();const action={id:'p',...presence({statusText:'안녕\u202e',workText:'코딩\n중'}),lastCallAt:999};
  assert.ok(validAction(action));applyPlayerAction(w,'a',action,0);
  assert.equal(w.get('a').statusText,'안녕');assert.equal(w.get('a').workText,'코딩중');assert.equal(w.get('a').lastCallAt,-1);
  assert.equal(validAction({...action,workText:'x'.repeat(81)}),false);assert.equal(validAction({...action,presence:'unknown'}),false);
});

test('calls have real timestamps, respect opt-out, deduplicate, and retain cooldowns in recovery',()=>{
  const w=world();let now=1000;const events=[];
  const n=Object.assign(Object.create(CampNetwork.prototype),{players:w,player:'a',host:'a',epoch:1,ledger:new CommandLedger(),chat:[],music:emptyMusic(),weapons:emptyWeapons(),callbacks:{call:e=>events.push(e)},broadcastControl:()=>{},hostNow:()=>now});
  const action={kind:'call',target:'b',id:'call-1'};
  assert.ok(n.handleCommand('a',action).ok);assert.ok(n.handleCommand('a',action).ok);assert.equal(events.length,1);
  const entry=n.chat[0];assert.ok(validChatEntry(entry));assert.ok(Math.abs(entry.createdAt-Date.now())<2000);
  const snapshot={t:'state',v:PROTOCOL_VERSION,epoch:1,seq:1,now,players:[...w.values()].map(encodePlayer),weapons:emptyWeapons(),checkpoint:{chatId:entry.id,musicRevision:0}};
  const decoded=decodeSnapshot(snapshot,1);assert.ok(decoded);const recovery=captureRecovery(decoded,n.chat,n.music);assert.ok(recovery);
  const restored=restoreRecovery(recovery,[...w.values()]);assert.deepEqual(restored.chat,n.chat);
  assert.match(callError(restored.players,[],'a','b',2000),/잠시/);
  now=32000;w.get('b').allowCall=false;assert.match(n.handleCommand('a',{...action,id:'call-2'}).error,/받지/);
  assert.equal(validChatEntry({...entry,createdAt:NaN}),false);assert.equal(captureRecovery(decoded,[{...entry,kind:'invalid'}],n.music),null);
});

test('wide walking routes and all spawns stay navigable after scenery changes',()=>{
  for(let i=0;i<16;i++){const p=spawnPlayer(i);assert.ok(validPosition(p.x,p.y));}
  for(let x=-4.8;x<=-1.2;x+=.1)assert.ok(validPosition(x,0),'radio corridor at '+x);
  for(let y=-2.2;y<=2;y+=.1)assert.ok(validPosition(1.2,y),'fire corridor at '+y);
});

test('16 maximum-length presence records fit a reliable frame and survive wire validation',()=>{
  const players=Array.from({length:16},(_,i)=>({...spawnPlayer(i),id:'p'+i,statusText:'상'.repeat(40),workText:'작'.repeat(80),bubble:'말'.repeat(200)}));
  const snapshot={t:'state',v:PROTOCOL_VERSION,epoch:1,seq:1,now:1000,players:players.map(encodePlayer),weapons:emptyWeapons()};
  assert.ok(new TextEncoder().encode(JSON.stringify(fullWire(snapshot))).byteLength<MAX_FRAME_BYTES);
  assert.ok(decodeSnapshot(snapshot,1));
});
