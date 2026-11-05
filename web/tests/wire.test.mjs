import { emptyFire } from '../lib/camp-fire.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fullWire, deltaWire, WireReceiver } from '../lib/camp-wire.mjs';
import { spawnPlayer } from '../lib/camp-world.mjs';
import { encodePlayer, decodeSnapshot, PLAYER_FIELDS, captureRecovery, restoreRecovery } from '../lib/camp-snapshot.mjs';
import { emptyWeapons } from '../lib/camp-weapons.mjs';
import { emptyBall } from '../lib/camp-ball.mjs';
import { emptyMusic } from '../lib/camp-media.mjs';
import { CampNetwork } from '../lib/camp-network.mjs';
import { PeerTransport } from '../lib/camp-peer-transport.mjs';
import { CommandLedger, PROTOCOL_VERSION } from '../lib/camp-protocol.mjs';
import { WIRE_BASE_TTL, WIRE_BASE_LIMIT } from '../lib/camp-config.mjs';
const json=value=>JSON.parse(JSON.stringify(value));
function world(seq=1,checkpoint=true,count=16) {
  return json({t:'state',v:PROTOCOL_VERSION,epoch:1,seq,now:1000+seq,players:Array.from({length:count},(_,i)=>encodePlayer({id:String(i),...spawnPlayer(i,'playground'),connected:true})),fire:emptyFire(),weapons:emptyWeapons(),ball:emptyBall(),...(checkpoint?{checkpoint:{chatId:null,musicRevision:0}}:{})});
}
function guest() {
  return Object.assign(Object.create(CampNetwork.prototype),{epoch:1,player:'0',host:'host',isHost:false,players:new Map(),members:Array.from({length:16},(_,i)=>({id:String(i),name:'P'+i,color:'#fff'})),peers:new Map(),lastSequence:-1,lastRecovery:null,music:emptyMusic(),chat:[],callbacks:{}});
}
test('compact full state preserves every field including unicode, chain and weapon state',()=>{
  const w=world();w.players[0].bubble='안녕 👋';w.players[0].carrying='1';w.players[1].carriedBy='0';w.players[1].motion='carried';w.players[1].z=1.3;
  const result=new WireReceiver().read(json(fullWire(w)),1,0);
  assert.deepEqual(result.world,w);assert.ok(JSON.stringify(fullWire(w)).length<JSON.stringify(w).length*.5);
});

test('presence survives full, delta and handoff without the retired protection field; old arrays are rejected',()=>{
  const base=world();Object.assign(base.players[0],{presence:'working',workText:'개발 중',allowCall:false,allowCarry:false});
  const receiver=new WireReceiver();
  const full=receiver.read(json(fullWire(base)),1,0).world;
  assert.equal(full.players[0].presence,'working');assert.ok(!PLAYER_FIELDS.includes('afkProtected'));
  const old=fullWire(base);old.v=PROTOCOL_VERSION-1;old.f[0].splice(37,0,true);
  assert.equal(receiver.read(old,1,1).world,null);
  const malformed=fullWire(base);malformed.f[0].splice(37,0,true);
  assert.equal(receiver.read(malformed,1,1).world,null);
  const next=world(2,false);Object.assign(next.players[0],full.players[0],{presence:'away'});
  const delta=receiver.read(json(deltaWire(next,base)),1,2).world;
  assert.equal(delta.players[0].presence,'away');assert.equal(delta.players[0].workText,'개발 중');
  const recovery=captureRecovery({...delta,checkpoint:base.checkpoint},[],emptyMusic());
  const restored=restoreRecovery(recovery,[{id:'0',name:'친구',color:'#fff'}]).players.get('0');
  assert.equal(restored.presence,'away');assert.equal(restored.allowCall,false);assert.equal(restored.allowCarry,false);
  assert.equal('afkProtected' in restored,false);
});
test('independent deltas survive missing and reversed frames and member addition/removal',()=>{
  const receiver=new WireReceiver(),base=world();receiver.read(fullWire(base),1,0);
  const next=world(8,false);next.players[0].x+=.05;next.players[1].bubble='hi';next.players.splice(2,1);next.players.push({...next.players[3],id:'new'});
  assert.deepEqual(receiver.read(json(deltaWire(next,base)),1,1).world,next);
  const latest=json(next);latest.seq=12;latest.now=1012;latest.players[0].x+=.1;
  assert.deepEqual(receiver.read(json(deltaWire(latest,base)),1,2).world,latest);
  assert.deepEqual(receiver.read(json(deltaWire(next,base)),1,3).world,next);
});
test('late reliable checkpoint can be acknowledged without rewinding display or a future delta baseline',()=>{
  const n=guest(),messages=[];n.peers.set('host',{ready:true});n.reliable=(_peer,v)=>messages.push(v);
  const base=world(),later=world(5,false);later.players[0].x+=.1;
  n.receiveWorld(fullWire(base));n.receiveWorld(deltaWire(later,base));
  const before=n.players.get('0').targetX,late=world(2);n.receiveWorld(fullWire(late));
  assert.equal(n.lastSequence,5);assert.equal(n.players.get('0').targetX,before);assert.ok(messages.some(m=>m.t==='receipt'&&m.seq===2));
  const newest=world(6,false);newest.players[0].x+=.2;n.receiveWorld(deltaWire(newest,late));assert.equal(n.lastSequence,6);
});
test('malformed field arrays, identities, versions, epochs and carry cycles are rejected atomically',()=>{
  const receiver=new WireReceiver(),base=world();receiver.read(fullWire(base),1,0);
  const w=world(2,false);w.players[0].x+=.1;const good=deltaWire(w,base);
  for(const mutate of [p=>{p.v--;},p=>{p.epoch++;},p=>{p.b=p.seq;},p=>{p.d=[['0',[1,NaN]]];},p=>{p.d=[['0',[1,2,1,3]]];},p=>{p.d=[['0',[0,'other']]];},p=>{p.d=[['0',[PLAYER_FIELDS.length,1]]];},p=>{p.d=[['0',[1,2]],['0',[1,3]]];},p=>{p.r=['0'];p.d=[['0',[1,2]]];}]) {
    const p=structuredClone(good);mutate(p);assert.equal(receiver.read(p,1,1).world,null);
  }
  const bad=fullWire(base);bad.f[1][0]='0';assert.equal(receiver.read(bad,1,1).world,null);
  const cycle=world();cycle.players[0].carrying='1';cycle.players[0].carriedBy='1';cycle.players[0].motion='carried';cycle.players[1].carrying='0';cycle.players[1].carriedBy='0';cycle.players[1].motion='carried';
  assert.equal(receiver.read(fullWire(cycle),1,1).world,null);
  assert.deepEqual(receiver.read(deltaWire(w,base),1,1).world,decodeSnapshot(w,1));
});
test('checkpoint bases are immutable, bounded and expire; missing base does not partially apply',()=>{
  const receiver=new WireReceiver(),base=world();const first=receiver.read(fullWire(base),1,0).world;
  first.players[0].x=999;
  const next=world(2,false);next.players[1].x+=.1;assert.deepEqual(receiver.read(deltaWire(next,base),1,1).world,decodeSnapshot(next,1));
  assert.deepEqual(receiver.read(deltaWire(next,base),1,WIRE_BASE_TTL+1),{world:null,missing:true});
  for(let i=1;i<=WIRE_BASE_LIMIT+5;i++)receiver.read(fullWire(world(i)),1,WIRE_BASE_TTL+2);
  assert.ok(receiver.bases.size<=WIRE_BASE_LIMIT);assert.ok(receiver.bytes<=512000);
});
test('a missing baseline requests bounded resync rather than changing visible state',()=>{
  const n=guest(),messages=[];n.peers.set('host',{ready:true});n.reliable=(_p,v)=>messages.push(v);
  const base=world(),next=world(2,false);next.players[0].x+=.1;
  for(let i=0;i<20;i++)n.receiveWorld(deltaWire(next,base));
  assert.equal(n.players.size,0);assert.equal(messages.filter(m=>m.t==='resync').length,1);
});
test('only a validated coherent checkpoint receipt advances the sender baseline',()=>{
  const n=guest();n.player='0';n.host='0';n.isHost=true;n.players=new Map(world().players.map(p=>[p.id,p]));n.sequence=0;n.hostNow=()=>1000;
  const peer={id:'1',ready:true,queue:[],queueBytes:0},channel={readyState:'open',bufferedAmount:0,send(){},close(){}};
  n.coordinator().role(1,true,performance.now());
  n.peers.set('1',peer);n.attachControl(peer,channel);const checkpoint=n.checkpointMessage();
  const receipt=seq=>channel.onmessage({data:JSON.stringify({t:'receipt',v:PROTOCOL_VERSION,epoch:1,seq})});
  receipt(999);assert.equal(peer.wireBaseSeq,undefined);receipt(checkpoint.seq);assert.equal(peer.wireBaseSeq,checkpoint.seq);
});
test('peers sharing a fresh base reuse encoding and stale bases fall back to full state',()=>{
  const n=guest(),base=world();n.pendingRecoveries=new Map([[1,{world:base}]]);
  const next=world(2,false);next.players[0].x+=.1;
  const peer={wireBaseSeq:1,wireBaseAt:performance.now()},cache=new Map();
  assert.ok(JSON.parse(n.frameForPeer(next,peer,cache)).d);n.frameForPeer(next,{...peer},cache);assert.equal(n.encoding.frames,1);
  assert.ok(JSON.parse(n.frameForPeer(next,{...peer,wireBaseAt:-Infinity})).f);
});
test('queued state coalesces while command ack/chat and distinct checkpoint/live state survive',()=>{
  const sent=[],session={epoch:1,notify(){},frameForPeer:v=>JSON.stringify(v),peers:new Map()},transport=new PeerTransport(session);
  session.flush=p=>transport.flush(p);
  const peer={queue:[],queueBytes:0,control:{readyState:'open',bufferedAmount:70000,send:f=>sent.push(JSON.parse(f))}};
  transport.reliable(peer,world(1));transport.reliable(peer,world(2,false));transport.reliable(peer,{t:'ack',id:'action'});
  transport.reliable(peer,{t:'chat',entry:{id:'chat'}});transport.reliable(peer,world(3,false));transport.reliable(peer,world(4));
  assert.equal(peer.queue.length,4);assert.equal(peer.queueBytes,peer.queue.reduce((s,q)=>s+q.bytes,0));
  peer.control.bufferedAmount=0;transport.flush(peer);
  assert.deepEqual(sent.filter(v=>v.t!=='state').map(v=>v.t),['ack','chat']);assert.deepEqual(sent.filter(v=>v.t==='state').map(v=>v.seq),[3,4]);assert.equal(peer.queueBytes,0);
});
test('burst commands execute once with immediate results but only one reliable live state flush',()=>{
  const n=guest();n.players=new Map(world().players.map(p=>[p.id,p]));n.ledger=new CommandLedger();n.hostNow=()=>1000;n.weapons=emptyWeapons();n.sequence=0;
  const frames=[];n.broadcastControl=v=>frames.push(v);
  assert.ok(n.handleCommand('0',{id:'equip',kind:'equip',weapon:'gun'}).ok);
  const shot={id:'shot',kind:'fire',dx:1,dy:0};assert.ok(n.handleCommand('0',shot).ok);assert.ok(n.handleCommand('0',shot).ok);
  assert.equal(n.weapons.projectiles.length,1);assert.equal(frames.length,0);n.flushStateUpdate();n.flushStateUpdate();
  assert.equal(frames.length,1);assert.equal(frames[0].checkpoint,undefined);
});
test('normal host exit waits for the final coherent receipt before closing RTC and leaving',async()=>{
  const n=guest();n.isHost=true;n.host='0';n.players=new Map(world().players.map(p=>[p.id,p]));n.weapons=emptyWeapons();n.sequence=0;n.hostNow=()=>1000;n.pending=new Map();n.code='ABC234';n.beacon=()=>true;
  n.coordinator().role(1,true,performance.now());
  const frames=[],peer={id:'1',ready:true,queue:[],queueBytes:0,pc:{close(){}}};
  n.peers.set('1',peer);n.attachControl(peer,{readyState:'open',bufferedAmount:0,send:f=>frames.push(JSON.parse(f)),close(){}});
  n.destroy(true);assert.ok(n.leaving);assert.ok(!n.closed);
  const checkpoint=frames.find(f=>f.c);assert.ok(checkpoint);
  peer.control.onmessage({data:JSON.stringify({t:'receipt',v:PROTOCOL_VERSION,epoch:1,seq:checkpoint.seq})});
  await new Promise(resolve=>setTimeout(resolve,40));assert.ok(n.closed);assert.equal(n.lastRecovery.world.seq,checkpoint.seq);
});
