import { CAMP_SEATS } from '../lib/camp-seats.mjs';
import { fuelAt, MAX_FIRE_FUEL } from '../lib/camp-fire.mjs';
// Real ICE/DTLS/SCTP traffic on loopback, through the running application's HTTP API.
// This validates the game protocol, not browser interoperability or real-world NAT traversal.
import assert from 'node:assert/strict';
import { RTCPeerConnection } from 'werift';
import { CampNetwork } from '../lib/camp-network.mjs';
import { spawnPlayer, TRAMPOLINES } from '../lib/camp-world.mjs';
import { musicPosition } from '../lib/camp-media.mjs';
import { getMap } from '../lib/camp-maps.mjs';
const origin = process.env.CAMP_TEST_URL || 'http://127.0.0.1:5192';
const instances = [], connections = [];
let requests = 0;
class LocalPeer extends RTCPeerConnection {
  constructor(config) {
    super({ ...config, iceServers: [], iceUseIpv4: true, iceUseIpv6: false, iceUseTcp: false, iceInterfaceAddresses: { udp4: '127.0.0.1' } });
    connections.push(this);
  }
}
function client() {
  let cookie = '';
  return async (path, data) => {
    requests++;
    const response = await fetch(origin + '/api/camp/' + path, {
      method: data === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }), signal: AbortSignal.timeout(15_000),
    });
    const sessionCookie = response.headers.get('set-cookie'); if (sessionCookie) cookie = sessionCookie.split(';')[0];
    const value = await response.json();
    if(path==='session'&&data){const linked=await fetch(origin+'/__test/discord-connect',{method:'POST',headers:{Cookie:cookie,Origin:origin}});assert.equal(linked.status,200,'Local mock OAuth link');}
    if (!response.ok) throw Object.assign(new Error(value.error), { status: response.status });
    return value;
  };
}
async function until(condition, label, timeout = 45_000) {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) throw new Error(label);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
let hostRequest, info;
try {
  hostRequest = client();
  const profile = (await hostRequest('session', { name: 'QA Host' })).profile;
  info = await hostRequest('rooms', { op: 'create', title: '공개방 통합 검증', visibility: 'public' });
  assert.ok((await hostRequest('rooms')).rooms.some(r=>r.code===info.code&&r.title==='공개방 통합 검증'));
  const host = new CampNetwork(info, profile, {}, { request: hostRequest, PeerConnection: LocalPeer, beacon: () => false });
  instances.push(host);
  for (let i = 1; i <= 15; i++) {
    const request = client(), p = (await request('session', { name: 'QA ' + i })).profile;
    const room = await request('rooms', { op: 'join', code: info.code });
    instances.push(new CampNetwork(room, p, {}, { request, PeerConnection: LocalPeer, beacon: () => false, allowCarry: i !== 1 }));
  }
  console.log('PASS: host and 15 separately authenticated guests joined over HTTP.');
  await until(() => host.players.size === 16 && [...host.peers.values()].every(p => p.channel?.readyState === 'open'), '16 players did not connect');
  console.log('PASS: 15 real WebRTC DataChannels opened.');
  await until(() => instances.every(n => n.players.size === 16), 'All peers did not receive the complete state');
  console.log('PASS: all 16 clients received the complete P2P world state.');
  const isolated = instances[15], originalReliable = host.reliable.bind(host), originalSend = host.send.bind(host);
  const originalReceive = isolated.receiveWorld.bind(isolated);
  // Drop packets already queued in SCTP as well as new sends during this outage.
  isolated.receiveWorld = () => {};
  const isolatedSeq = isolated.lastRecovery?.world.seq ?? -1;
  host.reliable = (peer, value) => peer.id === isolated.player && value.t === 'state' ? true : originalReliable(peer, value);
  host.send = (peer, frame) => { if (peer.id !== isolated.player) originalSend(peer, frame); };
  await new Promise(resolve => setTimeout(resolve, 7000));
  assert.equal(host.epoch, 1); assert.ok(host.coordinator().canRenew(host, performance.now()));
  assert.equal(isolated.lastRecovery?.world.seq ?? -1, isolatedSeq);
  host.reliable = originalReliable; host.send = originalSend;
  isolated.receiveWorld = originalReceive;
  await until(() => (isolated.lastRecovery?.world.seq ?? -1) > isolatedSeq, 'Isolated guest did not recover checkpoints', 5000);
  console.log('PASS: selective game-state loss for one guest did not rotate the healthy host; checkpoints resumed.');
  // Different receipt delays and volatile reordering on one real RTC link must
  // not corrupt other peers or force a healthy host to migrate.
  let faultPackets=0;const faultTimers=new Set();
  const later=(fn,delay)=>{const timer=setTimeout(()=>{faultTimers.delete(timer);fn();},delay);faultTimers.add(timer);};
  host.send=(peer,frame)=>{
    if(peer.id!==isolated.player)return originalSend(peer,frame);
    faultPackets++;if(faultPackets%5===0)return;
    later(()=>originalSend(peer,frame),faultPackets%2?180:30);
  };
  host.reliable=(peer,value)=>{
    if(peer.id!==isolated.player||value.t!=='state')return originalReliable(peer,value);
    const copy=structuredClone(value);later(()=>originalReliable(peer,copy),300);return true;
  };
  isolated.setInput({dx:.5,dy:.5,sitting:false});
  await until(()=>faultPackets>=15,'Did not generate faulted volatile frames',5000);
  const beforeResync=isolated.lastResyncAt??-Infinity;
  isolated.wireReceiver.bases.clear();isolated.wireReceiver.bytes=0;
  await until(()=>(isolated.lastResyncAt??-Infinity)>beforeResync,'Missing baseline did not request resync',5000);
  await until(()=>isolated.wireReceiver.bases.size>0&&isolated.lastSequence>(isolated.lastRecovery?.world.seq??-1),'Resync did not restore independent deltas',5000);
  isolated.setInput({dx:0,dy:0,sitting:false});
  host.send=originalSend;host.reliable=originalReliable;
  for(const timer of faultTimers)clearTimeout(timer);
  assert.equal(host.epoch,1);assert.ok(host.coordinator().canRenew(host,performance.now()));
  console.log('PASS: 20% volatile drop, reordering, delayed checkpoints and missing-base resync recovered over real RTC without rotating the healthy host.');
  assert.ok(instances.every(n=>[...n.players.values()].every(p=>p.mapId==='camp')));
  await assert.rejects(()=>instances[1].command('equip',{weapon:'gun'}),/놀이터/);
  await assert.rejects(()=>instances[1].command('lift',{target:instances[2].player}),/놀이터/);
  const travel=async(n,mapId)=>{
    const p=host.players.get(n.player),portal=getMap(p.mapId).portals.find(o=>o.destination===mapId);
    n.setInput({dx:0,dy:0,sitting:false});host.inputs.delete(n.player);
    Object.assign(p,{x:portal.x-1,y:portal.y});host.publishWorld(true);
    await until(()=>Math.abs(n.players.get(n.player).x-p.x)<.01,'Portal approach did not replicate',5000);
    await n.command('change-map',{mapId,portalId:portal.id,mapRevision:p.mapRevision});
    await until(()=>n.players.get(n.player).mapId===mapId,'Portal travel did not replicate',5000);
  };
  await assert.rejects(()=>instances[1].command('change-map',{mapId:'showroom',portalId:'camp-show',mapRevision:0}),/포탈/);
  await travel(instances[11],'showroom');
  await instances[11].command('chat',{text:'전시장에서 만나요'});
  await until(()=>instances.every(n=>n.players.get(instances[11].player)?.mapId==='showroom'&&n.chat.some(e=>e.text==='전시장에서 만나요'&&e.mapId==='showroom')),'Showroom and chat did not replicate',5000);
  await until(()=>host.hostNow()-(host.ledger.last.get(instances[11].player+':change-map')??-Infinity)>=500,'Travel cooldown did not clear',5000);
  await travel(instances[11],'camp');
  await until(()=>host.hostNow()-(host.ledger.last.get(instances[11].player+':change-map')??-Infinity)>=500,'Travel cooldown did not clear',5000);
  for(const [index,n] of instances.entries()) if(index!==14) await travel(n,'playground');
  // Move away from the arrival portal before the movement/sitting probes below.
  const arrivalGuest=host.players.get(instances[1].player);Object.assign(arrivalGuest,{x:0,y:2});host.publishWorld(true);
  await until(()=>Math.abs(instances[1].players.get(instances[1].player).x)<.01,'Clear playground position did not replicate',5000);
  await until(()=>instances.every(n=>n.players.get(instances[1].player)?.mapId==='playground'&&n.players.get(instances[14].player)?.mapId==='camp'),'Map travel did not replicate',5000);
  console.log('PASS: all entries start at camp; toys/lifting are rejected there, and map travel replicates while one camper stays.');
  const guest = instances[1], observer = instances[2], before = { ...host.players.get(guest.player) };
  await until(()=>host.hostNow()-(host.ledger.last.get(guest.player+':equip')??-Infinity)>=100,'Initial rejected equipment cooldown did not clear',5000);
  const latencies=[];
  for(let sample=0;sample<30;sample++) {
    const weapon=sample%2?'none':'gun',start=performance.now();
    await guest.command('equip',{weapon});
    while(observer.players.get(guest.player)?.weapon!==weapon) {
      if(performance.now()-start>2000)throw new Error('Discrete action latency probe timed out');
      await new Promise(resolve=>setTimeout(resolve,5));
    }
    latencies.push(performance.now()-start);await new Promise(resolve=>setTimeout(resolve,110));
  }
  latencies.sort((a,b)=>a-b);
  console.log('METRIC: local input-to-observer equipment update '+JSON.stringify({samples:30,p50ms:Math.round(latencies[14]),p95ms:Math.round(latencies[28]),scope:'Node loopback, excludes browser rendering'}));
  guest.setInput({ dx: 0, dy: 1, sitting: false });
  await until(() => Math.hypot(host.players.get(guest.player).x - before.x, host.players.get(guest.player).y - before.y) > .2, 'Guest input did not move the authoritative player', 5000);
  guest.setInput({ dx: 0, dy: 0, sitting: true });
  await until(() => host.players.get(guest.player).sitting && observer.players.get(guest.player).sitting, 'Sitting did not replicate', 5000);
  console.log('PASS: guest input moved the host state and sitting reached a different guest.');
  guest.setInput({ dx: 1, dy: 0, sitting: false, running: true });
  await until(() => host.players.get(guest.player).running && observer.players.get(guest.player).running, 'Running did not replicate', 5000);
  guest.setInput({ dx: 0, dy: 0, sitting: false, running: false });
  await until(() => !observer.players.get(guest.player).running, 'Running release did not replicate', 5000);
  await guest.command('jump');
  await until(() => observer.players.get(guest.player).motion === 'airborne' && observer.players.get(guest.player).z > .1, 'Jump did not replicate', 5000);
  await assert.rejects(() => guest.command('jump'));
  await until(() => observer.players.get(guest.player).motion === 'grounded' && observer.players.get(guest.player).landedAt >= 0, 'Jump landing did not replicate', 5000);
  console.log('PASS: running, release, jump, duplicate airborne request and landing reached other guests.');
  await guest.command('equip', { weapon: 'gun' });
  await until(() => observer.players.get(guest.player).weapon === 'gun', 'Weapon selection did not replicate', 5000);
  // Arrange known clear positions inside this local test room to inspect authoritative impacts.
  Object.assign(host.players.get(guest.player), spawnPlayer(1,'playground'), { x: -1, y: 2.4, weapon: 'gun', allowCarry: false, connected: true });
  Object.assign(host.players.get(observer.player), spawnPlayer(2,'playground'), { x: -.1, y: 2.4, connected: true });
  // The playground has no central fire obstacle; keep uninvolved spawns outside this firing lane.
  for (const [id,p] of host.players) if (![guest.player,observer.player].includes(id)) {const spawn=spawnPlayer([...host.players.keys()].indexOf(id),p.mapId);Object.assign(p,{x:spawn.x,y:spawn.y});}
  host.publishWorld(true);
  await until(() => Math.abs(guest.players.get(guest.player).x + 1) < .1, 'Test firing position did not arrive', 5000);
  await guest.command('fire', { dx: 1, dy: 0 });
  await until(() => observer.players.get(observer.player).hitAt >= 0 && observer.players.get(observer.player).thrown, 'Authoritative weapon hit did not replicate', 5000);
  assert.ok(host.players.get(observer.player).vx > 0);
  await until(() => observer.players.get(observer.player).motion === 'grounded', 'Weapon knockback did not land', 5000);
  await guest.command('equip', { weapon: 'bomb' });
  await until(() => host.hostNow() >= host.players.get(guest.player).nextShotAt, 'Shared cooldown did not clear', 5000);
  await guest.command('fire', { dx: -1, dy: 0 });
  await until(() => observer.weapons.projectiles.some(p => p.weapon === 'bomb'), 'Bomb projectile did not replicate', 5000);
  await until(() => observer.weapons.effects.some(e => e.kind === 'explosion'), 'Bomb explosion did not replicate', 5000);
  await guest.command('equip', { weapon: 'none' });
  console.log('PASS: weapon equip, bullet knockback, bomb projectile and timed explosion replicated over real WebRTC.');
  await until(() => [...host.peers.values()].every(p => p.ready && p.control?.readyState === 'open') && instances.slice(1).every(n => n.peers.get(n.host)?.ready), 'Reliable control handshake failed');
  assert.equal(host.players.get(guest.player).allowCarry, false);
  await guest.setCarryPreference(true);
  await until(() => observer.players.get(guest.player).allowCarry === true, 'Saved carry preference did not update', 5000);
  guest.setInput({ dx: 0, dy: 0, sitting: false, crouching: true });
  await until(() => host.players.get(guest.player).crouching && observer.players.get(guest.player).crouching, 'Crouch did not replicate', 5000);
  guest.setInput({ dx: 0, dy: 0, sitting: false, crouching: false });
  await until(() => !observer.players.get(guest.player).crouching, 'Crouch release did not replicate', 5000);
  await guest.command('emote', { emote: 'dance' });
  await until(() => observer.players.get(guest.player).emote === 'dance', 'Emote did not replicate', 5000);
  const text = '한글 채팅 <b>그대로 표시</b> ♥';
  await guest.command('chat', { text });
  await until(() => instances.every(n => n.chat.some(m => m.text === text && m.by === guest.player)), 'Chat did not reach all 16 members', 5000);
  assert.equal(observer.chat.filter(m => m.text === text).length, 1);
  await assert.rejects(() => guest.command('chat', { text: 'too fast' }), /기다렸다가/);
  await guest.command('music-add', { url: 'https://youtu.be/abcdefghijk', title: '별이 빛나는 밤 · 함께 듣는 노래' });
  await assert.rejects(() => guest.command('music-control', { op: 'play' }), /방장/);
  await until(() => instances.every(n => n.music.current?.videoId === 'abcdefghijk' && n.music.playing), 'A guest request did not automatically start radio for every peer', 5000);
  assert.ok(instances.every(n => n.music.current.title === '별이 빛나는 밤 · 함께 듣는 노래'));
  await host.command('music-control', { op: 'sync', currentId: host.music.current.id, position: 42 });
  await until(() => observer.music.position === 42, 'Playback checkpoint did not replicate', 5000);
  assert.ok(musicPosition(observer.music, observer.hostNow()) >= 42);
  console.log('PASS: reliable crouch/release, emotes, CJK chat, request limits and host-only music controls reached 16 peers.');
  const carrier = host.players.get(guest.player), passenger = host.players.get(observer.player);
  Object.assign(carrier, spawnPlayer(1,'playground'), { x: 0, y: 2 }); Object.assign(passenger, spawnPlayer(2,'playground'), { x: .5, y: 2 });
  // Isolate this pair from nearby spawn locations so the advertised nearest target is deterministic.
  for (const [id, p] of host.players) if (![guest.player, observer.player].includes(id)) {const spawn=spawnPlayer([...host.players.keys()].indexOf(id),p.mapId);Object.assign(p,{x:spawn.x,y:spawn.y});}
  host.publishWorld(true);
  await guest.command('lift', { target: observer.player });
  await until(() => observer.players.get(observer.player).carriedBy === guest.player, 'Carrying did not replicate', 5000);
  await observer.command('escape');
  await until(() => !host.players.get(guest.player).carrying && observer.players.get(observer.player).motion === 'grounded', 'Passenger could not escape', 5000);
  Object.assign(carrier, spawnPlayer(1,'playground'), { x: 0, y: 2, aimX: -1, aimY: 0 });
  Object.assign(passenger, spawnPlayer(2,'playground'), { x: .5, y: 2 }); host.publishWorld(true);
  const liftedAt = performance.now();
  await guest.command('lift', { target: observer.player });
  await until(() => observer.players.get(observer.player).carriedBy === guest.player && performance.now() - liftedAt > 300, 'Lift before throw did not replicate', 5000);
  await guest.command('lift', { target: null });
  await until(() => [host, guest, observer].every(n => {
    const p = n.players.get(observer.player);
    return p.thrown && !p.carriedBy && p.vx < 0 && p.x < -.1 && p.z > 1.3;
  }), 'Throw arc did not reach carrier, passenger and host', 5000);
  await until(() => [host, guest, observer].every(n => {
    const p = n.players.get(observer.player);
    return !p.thrown && p.motion === 'grounded' && p.vx === 0 && p.x < -1;
  }), 'Throw landing did not replicate', 5000);
  console.log('PASS: throw arc and landing reached carrier, passenger and host over real WebRTC.');
  Object.assign(carrier, { x: TRAMPOLINES[0].x, y: TRAMPOLINES[0].y });
  await until(() => observer.players.get(guest.player).motion === 'airborne' && observer.players.get(guest.player).z > .2, 'Trampoline did not replicate', 5000);
  Object.assign(carrier, { x: 0, y: getMap('playground').bounds.edge-.01, z: 0, vz: 0, motion: 'grounded' });
  const respawns = carrier.respawns;
  guest.setInput({ dx: 0, dy: 1, sitting: false });
  await until(() => observer.players.get(guest.player).motion === 'falling', 'Fall was rejected by remote snapshot validation', 5000);
  guest.setInput({ dx: 0, dy: 0, sitting: false });
  await until(() => observer.players.get(guest.player).respawns > respawns, 'Respawn did not replicate', 5000);
  console.log('PASS: carrying, passenger escape, trampoline height, off-map fall and respawn replicated over real WebRTC.');
  await assert.rejects(() => hostRequest('rooms', { op: 'join', code: info.code }), e => e.status === 409);
  console.log('PASS: the 17th player was rejected.');
  const previousPeer = guest.peers.get(guest.host);
  guest.iceRefreshAt = 0; host.iceRefreshAt = 0;
  guest.retry();
  await until(() => guest.peers.get(guest.host) !== previousPeer && guest.peers.get(guest.host)?.channel?.readyState === 'open', 'Reconnect failed');
  guest.setInput({ dx: 0, dy: 0, sitting: false });
  await until(() => !host.players.get(guest.player).sitting && !observer.players.get(guest.player).sitting, 'State did not resume after reconnect', 5000);
  assert.ok(guest.iceRefreshAt > Date.now() && host.iceRefreshAt > Date.now());
  console.log('PASS: reconnect refreshed ICE settings, opened a new channel and resumed replication.');
  await until(() => guest.peers.get(guest.host)?.ready && guest.chat.some(m => m.text === text) && guest.music.current?.videoId === 'abcdefghijk', 'Reconnect did not restore chat/music');
  assert.equal(guest.music.current.title, '별이 빛나는 밤 · 함께 듣는 노래');
  Object.assign(carrier, spawnPlayer(1,'playground'), { x: 0, y: 2 }); Object.assign(passenger, spawnPlayer(2,'playground'), { x: .5, y: 2 });
  await guest.command('lift', { target: observer.player });
  await until(() => observer.players.get(observer.player).carriedBy === guest.player, 'Second lift did not replicate', 5000);
  guest.retry();
  await until(() => !passenger.carriedBy && passenger.motion === 'grounded' && guest.peers.get(guest.host)?.ready, 'Carrier reconnect left a passenger suspended');
  assert.equal(guest.chat.filter(m => m.text === text).length, 1);
  console.log('PASS: reconnect restored bounded chat history and music and safely released a carried passenger.');
  const third = instances[3];
  for (const [id, p] of host.players) {const spawn=spawnPlayer([...host.players.keys()].indexOf(id),p.mapId);Object.assign(p,spawn,{...([guest.player,observer.player,third.player].includes(id)?{x:0,y:2}:{}),connected:true});}
  host.publishWorld(true);
  await guest.command('lift', { target: observer.player });
  await third.command('lift', { target: guest.player });
  await until(() => instances.every(n => n.players.get(guest.player)?.carriedBy === third.player && n.players.get(observer.player)?.carriedBy === guest.player), 'Three-player chain did not replicate', 5000);
  await guest.command('escape');
  await until(() => observer.players.get(guest.player)?.motion === 'grounded', 'Chain escape did not settle', 5000);
  await guest.command('lift', { target: null });
  await until(() => host.players.get(observer.player).motion === 'grounded', 'Chain test throw did not settle', 5000);
  Object.assign(host.players.get(third.player), spawnPlayer(0,'playground'), { x: 0, y: 2, z: .7, vz: 0, motion: 'airborne' });
  Object.assign(host.players.get(observer.player), spawnPlayer(0,'playground'), { x: .4, y: 2, z: .9, vx: -1, vy: 0, vz: 0, motion: 'airborne', thrown: true });
  host.publishWorld(true);
  await third.command('lift', { target: observer.player });
  await until(() => instances.every(n => n.players.get(observer.player)?.carriedBy === third.player && !n.players.get(observer.player)?.thrown), 'Midair catch did not replicate', 5000);
  console.log('PASS: three-player chain, middle escape, throwing and midair catching replicated to all 16 clients.');
  const presenceOwner=instances[4], callOwner=instances[5], callEvents=[];
  presenceOwner.callbacks.call=e=>callEvents.push(e);
  const presence={presence:'away',statusText:'잠깐 자리 비움',workText:'보스 패턴 구현',allowCall:true};
  await presenceOwner.command('presence',presence);
  await until(()=>instances.every(n=>n.players.get(presenceOwner.player)?.workText===presence.workText),'Presence did not replicate',5000);
  await callOwner.command('call',{target:presenceOwner.player});
  await until(()=>callEvents.length===1&&instances.every(n=>n.chat.some(e=>e.kind==='call'&&e.to===presenceOwner.player)),'Call did not replicate',5000);
  const callEntry=presenceOwner.chat.find(e=>e.kind==='call'&&e.to===presenceOwner.player);
  assert.ok(callEntry.createdAt>0);await presenceOwner.command('jump');
  await until(()=>instances.every(n=>n.players.get(presenceOwner.player)?.jumpAt>=0||n.players.get(presenceOwner.player)?.motion==='airborne'),'Away player jump did not replicate',5000);
  await until(()=>instances.every(n=>n.players.get(presenceOwner.player)?.motion==='grounded'&&n.players.get(presenceOwner.player)?.jumpAt<0),'Away jump did not settle',5000);
  await until(()=>instances.every(n=>n.lastRecovery?.chat.some(e=>e.id===callEntry.id)),'Call recovery was not confirmed',5000);
  console.log('PASS: away status keeps interaction enabled; jump, notes, calls and wall-clock timestamps replicated to 16 peers.');
  Object.assign(host.players.get(host.player),spawnPlayer(0,'playground'),{x:3.25,y:.6,connected:true});
  host.ball={x:3.7,y:.6,vx:0,vy:0,rotation:0};host.setInput({dx:1,dy:0,sitting:false});
  await until(()=>instances.every(n=>n.ball.x>4),'Walking kick did not replicate the ball to all 16 peers',5000);
  host.setInput({dx:0,dy:0,sitting:false});
  const savedBall={x:4,y:1,vx:0,vy:0,rotation:.4};Object.assign(host.ball,savedBall);host.publishWorld(true);
  await until(()=>instances.every(n=>n.lastRecovery?.world.ball?.rotation===.4),'Ball checkpoint was not confirmed',5000);
  console.log('PASS: walking kick and coherent ball checkpoint replicated to all 16 peers.');
  assert.equal(host.players.get(observer.player).carriedBy,third.player,'Pre-handoff live carry');
  assert.ok(instances.every(n=>n.lastRecovery?.world.players.find(p=>p.id===observer.player)?.carriedBy===third.player),'Pre-handoff recovery carry');
  if(process.env.CAMP_TRACE_HANDOFF) {
    const describe=()=>[third.player,observer.player].map(id=>{const p=guest.players.get(id);return {id:id===third.player?'carrier':'passenger',connected:p?.connected,carriedBy:p?.carriedBy,carrying:p?.carrying,sitting:p?.sitting,allowCarry:p?.allowCarry,motion:p?.motion};});
    for(const method of ['tick','handleCommand','markDisconnected','changeHost']) {
      const original=guest[method].bind(guest);
      guest[method]=(...args)=>{const before=describe(),result=original(...args),after=describe();if(guest.epoch>=2&&(method==='changeHost'||JSON.stringify(before)!==JSON.stringify(after)))console.log('TRACE',method,JSON.stringify({args:method==='tick'?[]:args,before,after}));return result;};
    }
  }
  const restSeat=CAMP_SEATS[0],restClient=instances[14],restPlayer=host.players.get(restClient.player);
  Object.assign(restPlayer,{x:restSeat.exitX,y:restSeat.exitY});host.publishWorld(true);
  await until(()=>Math.abs(restClient.players.get(restClient.player).x-restSeat.exitX)<.01,'Seat approach did not replicate',5000);
  await restClient.command('seat',{seatId:restSeat.id});await restClient.command('add-firewood');
  for(const [i,contributor]of [instances[12],instances[13]].entries()){
    await travel(contributor,'camp');
    const extraSeat=CAMP_SEATS[4+i*2],p=host.players.get(contributor.player);
    Object.assign(p,{x:extraSeat.exitX,y:extraSeat.exitY});host.publishWorld(true);
    await until(()=>Math.abs(contributor.players.get(contributor.player).x-extraSeat.exitX)<.01,'Contributor approach did not replicate',5000);
    await contributor.command('seat',{seatId:extraSeat.id});
    await until(()=>fuelAt(host.fire,host.hostNow())<MAX_FIRE_FUEL-1,'Fire remained full',5000);
    await contributor.command('add-firewood');
  }
  await until(()=>host.hostNow()-restPlayer.lastStokeAt>=250,'Contribution request throttle did not elapse',2000);
  await assert.rejects(()=>restClient.command('add-firewood'),/다음 장작/);
  await restClient.command('fire-style',{style:'gold'});
  await until(()=>instances.every(n=>n.lastRecovery?.world.players.find(p=>p.id===restClient.player)?.seatId===restSeat.id&&n.lastRecovery?.world.fire?.revision===host.fire.revision&&n.fire?.xp===3&&n.fire?.style==='gold'),'Growth/appearance coherent checkpoint not confirmed',5000);
  const savedFire=structuredClone(host.fire);
  console.log('PASS: three independent wood contributions reached level two, shared the gold appearance and retained personal cooldowns in coherent checkpoints.');
  host.destroy(true);
  const survivors = instances.slice(1);
  await until(() => survivors.every(n => !n.closed && n.host === guest.player && n.epoch === 2), 'Normal host departure did not elect first guest', 20_000);
  await until(() => survivors.every(n => !n.migrating && (n.isHost || n.peers.get(n.host)?.ready)) && [...guest.peers.values()].filter(p => p.ready).length === 14, 'WebRTC recovery did not rebuild after host migration', 60_000);
  await until(() => survivors.every(n => n.players.get(observer.player)?.carriedBy === third.player), 'Carrying state did not survive host migration', 5000);
  assert.ok(survivors.every(n => n.chat.some(m => m.text === text) && n.music.current?.videoId === 'abcdefghijk'));
  assert.ok(survivors.every(n=>n.players.get(presenceOwner.player)?.workText===presence.workText&&n.players.get(presenceOwner.player)?.presence==='away'&&!('afkProtected' in n.players.get(presenceOwner.player))));
  assert.ok(survivors.every(n=>n.chat.some(e=>e.id===callEntry.id&&e.createdAt===callEntry.createdAt)));
  assert.ok(survivors.every(n=>Math.abs(n.ball.x-savedBall.x)<.001&&Math.abs(n.ball.rotation-savedBall.rotation)<.001));
  assert.ok(survivors.every(n=>n.players.get(instances[14].player)?.mapId==='camp'&&n.players.get(observer.player)?.mapId==='playground'));
  assert.ok(survivors.every(n=>n.players.get(restClient.player)?.seatId===restSeat.id&&n.fire?.revision===savedFire.revision&&n.fire?.fuel===savedFire.fuel&&n.fire?.xp===3&&n.fire?.style==='gold'));
  await assert.rejects(()=>restClient.command('add-firewood'),/다음 장작/);
  assert.equal(callEvents.length,1,'Recovery must not ring historical calls again');
  assert.ok((await presenceOwner.request('rooms')).rooms.some(r=>r.code===info.code&&r.title==='공개방 통합 검증'));
  await guest.command('music-control', { op: 'pause' });
  await assert.rejects(() => observer.command('music-control', { op: 'play' }), /방장/);
  await until(() => survivors.every(n => !n.music.playing), 'New host music permission did not propagate', 5000);
  console.log('PASS: normal host departure preserved room, code, chain, chat and music; 14 WebRTC peers reconnected to the first successor.');
  guest.destroy(false); // Simulate a crashed browser: no leave beacon or heartbeat.
  const afterCrash = instances.slice(2);
  await until(() => afterCrash.every(n => !n.closed && n.host === observer.player && n.epoch === 3), 'Crashed successor did not trigger next election', 40_000);
  await until(() => afterCrash.every(n => !n.migrating && (n.isHost || n.peers.get(n.host)?.ready)) && [...observer.peers.values()].filter(p => p.ready).length === 13, 'Second migration did not rebuild WebRTC recovery', 60_000);
  await observer.command('music-control', { op: 'play' });
  await until(() => afterCrash.every(n => n.music.playing), 'Second successor could not control music', 5000);
  assert.ok(afterCrash.every(n => n.chat.some(m => m.text === text)));
  console.log('PASS: abrupt host crash elected the next guest after lease expiry and restored all 13 remaining peer links.');
  // Keep HTTP polling and RTC channels alive, but drop the current host's world frames for everyone.
  const currentHost = observer, nextHost = third;
  const healthyReliable = currentHost.reliable.bind(currentHost);
  currentHost.reliable = (peer, value) => value.t === 'state' ? true : healthyReliable(peer, value);
  currentHost.send = () => {};
  await until(() => afterCrash.every(n => n.host === nextHost.player && n.epoch === 4), 'RTC-only host failure did not rotate authority', 45_000);
  await until(() => afterCrash.every(n => n.isHost || n.peers.get(n.host)?.ready) && !nextHost.migrating, 'RTC-only handoff did not complete recovery receipts', 60_000);
  assert.ok(afterCrash.every(n => n.chat.some(m => m.text === text) && n.music.current?.videoId === 'abcdefghijk'));
  assert.ok(!currentHost.closed && !currentHost.isHost); // Former host follows the new epoch without losing its HTTP session.
  console.log('PASS: total game-state/receipt loss with healthy HTTP triggered epoch 4; the former host rejoined as a guest.');
  nextHost.schedulerLagUntil=Infinity;
  currentHost.reliable=healthyReliable;delete currentHost.send;
  await until(()=>afterCrash.every(n=>n.epoch===5&&n.host!==nextHost.player),'Slow scheduler with healthy receipts did not yield authority',45_000);
  await until(()=>afterCrash.every(n=>!n.migrating&&(n.isHost||n.peers.get(n.host)?.ready)),'Slow scheduler handoff did not rebuild peers',60_000);
  assert.ok(!nextHost.isHost);
  console.log('PASS: sustained scheduler lag yielded authority despite healthy HTTP/RTC and restored the room at epoch 5.');
  console.log('METRIC: initial host actual DataChannel send payload counters '+JSON.stringify({traffic:host.traffic,encoding:host.encoding,scope:'CLI application bytes and local encoding wall time, not NIC traffic or FPS'}));
  console.log(`Network integration passed; ${requests} HTTP requests. Scope: local Node WebRTC implementation, no browser UI.`);
} catch (error) {
  console.error('FAIL:', error.stack);
  console.error(JSON.stringify(instances.map((n, i) => ({ player: i, host: instances.findIndex(x=>x.player===n.host), epoch:n.epoch, migrating:n.migrating, phase:n.health?.phase,
    chain:[...n.players.values()].filter(p=>p.carrying||p.carriedBy).map(p=>({id:instances.findIndex(x=>x.player===p.id),by:instances.findIndex(x=>x.player===p.carriedBy),carrying:instances.findIndex(x=>x.player===p.carrying)})),closed:n.closed, members:n.members.length, players:n.players.size, ready:[...n.peers.values()].filter(p=>p.ready).length, recovery:n.lastRecovery?.world.seq, receipts:n.health?.receipts.size }))));
  process.exitCode = 1;
} finally {
  // Only remove members created by this local test; no unrelated rooms are touched.
  await Promise.allSettled(instances.map(n => n.request('room', { op: 'leave', code: n.code, player: n.player })));
  instances.forEach(n => n.destroy(false));
  await Promise.race([Promise.allSettled(connections.map(p => p.close())), new Promise(resolve => setTimeout(resolve, 2000))]);
}
// Werift can retain internal transport timers; this CLI owns and exits its test process.
process.exit(process.exitCode || 0);
