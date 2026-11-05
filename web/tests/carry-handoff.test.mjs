import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnPlayer, simulateWorld, applyPlayerAction, carryChain, carryTarget, canLift, syncCarry, validPlayerState, TRAMPOLINES, CARRY_GAP } from '../lib/camp-world.mjs';
import { CampNetwork } from '../lib/camp-network.mjs';
import { CommandLedger, PROTOCOL_VERSION } from '../lib/camp-protocol.mjs';
import { emptyWeapons, readWeapons } from '../lib/camp-weapons.mjs';
import { emptyMusic, musicPosition } from '../lib/camp-media.mjs';
import { captureRecovery } from '../lib/camp-snapshot.mjs';

const world = (count = 4) => new Map(Array.from({ length: count }, (_, i) => [String(i), { ...spawnPlayer(i, 'playground'), id: String(i), name: String(i), x: 0, y: 2, connected: true }]));
const act = (players, id, kind, data = {}) => applyPlayerAction(players, id, { kind, ...data }, 100);
const step = (players, seconds) => { for (let i = 1; i <= seconds * 60; i++) simulateWorld(players, new Map(), 1 / 60, i * 1000 / 60); };
function stack(count = 4) {
  const players = world(count);
  for (let i = count - 2; i >= 0; i--) assert.equal(act(players, String(i), 'lift', { target: String(i + 1) }), null);
  return players;
}

test('16-member chains follow the root independently of map order and remain valid at trampoline height', () => {
  let players = stack(16); players = new Map([...players].reverse());
  const root = players.get('0'); Object.assign(root, { x: TRAMPOLINES[0].x, y: TRAMPOLINES[0].y }); step(players, .4);
  assert.equal(carryChain(players, root).length, 16); assert.ok(root.z > 1);
  for (let i = 0; i < 16; i++) {
    const p = players.get(String(i)); assert.ok(validPlayerState(p)); assert.equal(p.x, root.x); assert.equal(p.y, root.y);
    assert.ok(Math.abs(p.z - root.z - i * CARRY_GAP) < 1e-9);
  }
});

test('middle escape keeps its upper chain; middle F throws only its own upper chain', () => {
  const players = stack();
  assert.equal(act(players, '1', 'escape'), null); assert.equal(players.get('0').carrying, null);
  assert.equal(players.get('1').carrying, '2'); assert.equal(players.get('2').carriedBy, '1');
  Object.assign(players.get('1'), { aimX: -1, aimY: 0 });
  assert.equal(act(players, '1', 'lift'), null); assert.equal(players.get('1').carrying, null);
  assert.ok(players.get('2').thrown); assert.equal(players.get('2').carrying, '3');
  step(players, .1); assert.equal(players.get('3').carriedBy, '2'); assert.ok(players.get('2').x < 0);
});

test('midair catching accepts flight and trampoline motion, clears target velocity and preserves its chain', () => {
  const players = stack(2), catcher = { ...spawnPlayer(0, 'playground'), id: 'catcher', connected: true, x: .5, y: 2, z: 1, motion: 'airborne' };
  Object.assign(players.get('0'), { motion: 'airborne', z: 1.2, thrown: true, vx: 3.6, vy: 0, vz: 2.8 }); syncCarry(players);
  players.set(catcher.id, catcher); assert.equal(carryTarget(players, catcher.id).id, '0');
  assert.equal(act(players, catcher.id, 'lift', { target: '0' }), null);
  assert.equal(players.get('0').vx, 0); assert.equal(players.get('0').thrown, false); assert.equal(players.get('0').motion, 'carried');
  assert.equal(carryChain(players, catcher).length, 3); assert.equal(players.get('1').z, catcher.z + 2 * CARRY_GAP);
});

test('catching rejects excessive height, consent denial, cycles and simultaneous competing catches', () => {
  const players = world(), a = players.get('0'), b = players.get('1');
  b.z = 3; b.motion = 'airborne'; assert.equal(canLift(players, a, b), false);
  b.z = .8; b.allowCarry = false; assert.equal(canLift(players, a, b), false); b.allowCarry = true;
  assert.equal(act(players, '0', 'lift', { target: '1' }), null);
  assert.ok(act(players, '2', 'lift', { target: '1' })); assert.equal(b.carriedBy, '0');
  assert.equal(canLift(players, b, a), false); assert.ok(act(players, '0', 'lift', { target: '0' }) === null); // Existing carry F throws; never self-links.
  const malformed = world(2); malformed.get('0').carriedBy = '1'; malformed.get('1').carriedBy = '0';
  malformed.get('0').carrying = '1'; malformed.get('1').carrying = '0'; syncCarry(malformed);
  assert.ok([...malformed.values()].every(p => !p.carriedBy));
});

test('disconnected middle members and consent changes cannot leave upper players suspended', () => {
  const players = stack(); players.get('1').connected = false; step(players, .1);
  assert.equal(players.get('0').carrying, null);
  assert.ok([...players.values()].every(p => !p.carriedBy));
  const consent = stack(); act(consent, '1', 'allow-carry', { allow: false });
  assert.equal(consent.get('0').carrying, null); assert.equal(consent.get('1').carrying, '2');
  step(consent, 2); assert.ok([...consent.values()].every(validPlayerState));
});

function guest() {
  const players = world(3); const weapons = emptyWeapons();
  weapons.projectiles.push({ id: 'fuse', owner: '1', weapon: 'bomb', x: 3, y: 3, z: 0, vx: 0, vy: 0, vz: 0, bornAt: 800, expiresAt: 2400 });
  return Object.assign(Object.create(CampNetwork.prototype), { code: 'ABC234', player: '1', host: '0', epoch: 1, isHost: false,
    players, weapons, members: [...players.values()].filter(p => p.id !== '0'), peers: new Map(), pendingIce: new Map(), inputs: new Map(),
    pending: new Map(), callbacks: {}, ledger: new CommandLedger(), lastSequence: -1, sequence: 0, clockOffset: 0, closed: false,
    music: { ...emptyMusic(), playing: true, position: 42, anchor: 900 }, chat: [{ id: 'chat', by: '1', name: '1', color: '#fff', text: '남겨 둔 이야기', at: 950, createdAt: 1793740000000, kind: 'chat' }] });
}
function prepareRecovery(n) {
  const world = { ...n.lastSnapshot, checkpoint: { chatId: n.chat.at(-1)?.id || null, musicRevision: n.music.revision } };
  n.lastRecovery = captureRecovery(world, n.chat, n.music); assert.ok(n.lastRecovery);
}

test('host promotion restores canonical state, fuse deadlines and logical time without replaying pending actions', async () => {
  const n = guest(); n.players.get('1').x = -1; n.players.get('2').x = -.5;
  act(n.players, '1', 'lift', { target: '2' });
  const snapshot = { ...n.worldMessage(), epoch: 1, now: 1000, seq: 9 };
  n.lastSnapshot = structuredClone(snapshot); n.players.get('1').x = -4; // Interpolation must not become the new authority.
  prepareRecovery(n);
  let rejected = false;
  n.pending.set('old', { reject: () => { rejected = true; }, timer: setTimeout(() => {}, 1000) });
  n.changeHost('1', 2);
  assert.ok(n.isHost && n.migrating && rejected); assert.equal(n.pending.size, 0);
  assert.equal(n.players.get('1').x, -1); assert.equal(n.players.get('2').carriedBy, '1');
  assert.equal(n.weapons.projectiles[0].expiresAt, 2400); assert.ok(readWeapons(n.weapons));
  assert.ok(Math.abs(n.hostNow() - 1000) < 10); assert.ok(Math.abs(musicPosition(n.music, n.hostNow()) - 42.1) < .02);
  assert.equal(n.chat[0].text, '남겨 둔 이야기');
  await assert.rejects(n.command('jump'), /방장/);
  n.receiveWorld({ ...snapshot, seq: 999, players: snapshot.players.map(p => ({ ...p, x: 4 })) });
  assert.equal(n.players.get('1').x, -1); assert.equal(n.epoch, 2);
});

test('new-epoch handshake resumes the host and rejects old control commands', () => {
  const n = guest(); n.lastSnapshot = { ...n.worldMessage(), now: 1000 }; prepareRecovery(n); n.changeHost('1', 2);
  const frames = [], channel = { readyState: 'open', bufferedAmount: 0, close() {}, send: x => frames.push(JSON.parse(x)) };
  const peer = { id: '2', ready: false, queue: [], queueBytes: 0 }; n.peers.set('2', peer); n.attachControl(peer, channel);
  channel.onmessage({ data: JSON.stringify({ t: 'hello', v: PROTOCOL_VERSION, epoch: 1 }) }); assert.equal(peer.ready, false);
  channel.onmessage({ data: JSON.stringify({ t: 'hello', v: PROTOCOL_VERSION, epoch: 2 }) }); assert.ok(peer.ready); assert.equal(n.migrating, true);
  const checkpoint = frames.find(f => f.t === 'state' && f.epoch === 2);
  channel.onmessage({ data: JSON.stringify({ t: 'receipt', v: PROTOCOL_VERSION, epoch: 2, seq: checkpoint.seq }) }); assert.equal(n.migrating, false);
  assert.ok(frames.some(f => f.t === 'state' && f.epoch === 2));
  channel.onmessage({ data: JSON.stringify({ t: 'command', v: PROTOCOL_VERSION, epoch: 1, action: { id: 'old', kind: 'jump' } }) });
  assert.equal(n.players.get('2').jumpAt, -1);
});

test('volatile channel opening before control hello cannot break a restored carry chain after resume', () => {
  const n=guest();act(n.players,'1','lift',{target:'2'});
  n.lastSnapshot={...n.worldMessage(),now:1000};prepareRecovery(n);n.changeHost('1',2);n.resumeSimulation();
  const peer={id:'2',ready:false,queue:[],queueBytes:0};n.peers.set('2',peer);
  const channel={label:'camp',close(){}};n.attachChannel(peer,channel);channel.onopen();
  assert.equal(n.players.get('2').connected,true);
  simulateWorld(n.players,new Map(),.033,1033,n.weapons);
  assert.equal(n.players.get('2').carriedBy,'1');assert.equal(n.players.get('1').carrying,'2');
});

test('superseded data and control channel callbacks cannot disconnect or command the current peer',()=>{
  const n=guest(),peer={id:'2',ready:true,queue:[],queueBytes:0};n.peers.set('2',peer);
  const data={label:'camp',close(){}},control={readyState:'open',close(){}};
  n.attachChannel(peer,data);n.attachControl(peer,control);
  const lateDataClose=data.onclose,lateControlClose=control.onclose,lateMessage=control.onmessage;
  n.attachChannel(peer,{label:'camp',close(){}});n.attachControl(peer,{readyState:'open',close(){}});
  n.players.get('2').connected=true;lateDataClose();lateControlClose();
  lateMessage({data:JSON.stringify({t:'chat',v:PROTOCOL_VERSION,epoch:1,entry:{id:'stale'}})});
  assert.equal(n.players.get('2').connected,true);assert.equal(peer.ready,true);
  assert.equal(n.chat.some(e=>e.id==='stale'),false);
});

test('connection rebuilding freezes the camp clock and preserves bomb and cooldown remaining time', async () => {
  const n = guest(); n.players.get('1').nextShotAt = 1900; n.lastSnapshot = { ...n.worldMessage(), now: 1000 };
  prepareRecovery(n);
  n.changeHost('1', 2);
  const before = n.hostNow(), fuse = n.weapons.projectiles[0].expiresAt - before;
  await new Promise(resolve => setTimeout(resolve, 35));
  assert.equal(n.hostNow(), before); assert.equal(n.weapons.projectiles[0].expiresAt - n.hostNow(), fuse);
  n.resumeSimulation(); assert.ok(n.hostNow() - before < 10);
  assert.ok(n.players.get('1').nextShotAt - n.hostNow() > 890);
  simulateWorld(n.players, new Map(), .05, n.hostNow() + 50, n.weapons); assert.equal(n.weapons.projectiles.length, 1);
});

test('a lone survivor becomes playable immediately even while the crashed host awaits membership cleanup', async () => {
  const n = guest(); n.members = [...n.players.values()].filter(p => p.id !== '2'); n.lastSnapshot = { ...n.worldMessage(), now: 1000 };
  prepareRecovery(n);
  n.changeHost('1', 2); assert.ok(n.isHost); assert.equal(n.migrating, false);
  assert.equal(n.players.get('0').connected, false); assert.ok((await n.command('jump')).ok);
});

test('multiple inactive former hosts cannot block a lone successor from resuming', () => {
  const n = guest(); n.host = '2'; n.epoch = 2;
  n.members = [...n.players.values()].map(p => ({ ...p, active: p.id === '1' ? 1 : 0 }));
  n.lastSnapshot = { ...n.worldMessage(), now: 1000 }; prepareRecovery(n); n.changeHost('1', 3);
  assert.equal(n.migrating, false); assert.equal(n.players.get('0').connected, false); assert.equal(n.players.get('2').connected, false);
});

test('a new authority accepts a consistent recovered music revision even when it is lower than the old authority', () => {
  const n = guest(); n.music.revision = 9; n.lastSnapshot = { ...n.worldMessage(), now: 1000 }; prepareRecovery(n);
  n.changeHost('2', 2);
  const frames = [], channel = { readyState:'open', bufferedAmount:0, close(){}, send:value=>frames.push(JSON.parse(value)) };
  const peer = { id:'2',ready:false,queue:[],queueBytes:0 };n.peers.set('2',peer);n.attachControl(peer,channel);
  const message = value => channel.onmessage({data:JSON.stringify({v:PROTOCOL_VERSION,epoch:2,...value})});
  message({t:'hello'});message({t:'music',music:{...emptyMusic(),revision:3}});assert.equal(n.music.revision,3);
  message({t:'history',reset:true,entries:[]});
  message({...n.lastSnapshot,epoch:2,seq:20,checkpoint:{chatId:null,musicRevision:3}});
  assert.equal(n.lastRecovery.world.epoch,2);assert.equal(n.migrating,false);assert.ok(frames.some(f=>f.t==='receipt'&&f.seq===20));
});
