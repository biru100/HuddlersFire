import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, roomQuery } from './api-fixture.mjs';
import { HostCoordinator } from '../lib/camp-host.mjs';
import { HOST_LEASE, RTC_STALE } from '../lib/camp-config.mjs';
import { encodePlayer, decodeSnapshot, captureRecovery, restoreRecovery, PLAYER_FIELDS } from '../lib/camp-snapshot.mjs';
import { spawnPlayer, applyPlayerAction, validPlayerState } from '../lib/camp-world.mjs';
import { emptyMusic } from '../lib/camp-media.mjs';
import { emptyWeapons } from '../lib/camp-weapons.mjs';
import { CampNetwork } from '../lib/camp-network.mjs';

test('authority requires fresh validated RTC receipts after grace, while one isolated guest does not rotate the host', () => {
  const h = new HostCoordinator(); h.role(1, true, 0);
  const s = { isHost: true, migrating: false, lastTick: HOST_LEASE + 1, player: 'host', members: [{ id: 'host' }, { id: 'a' }, { id: 'b' }] };
  assert.equal(h.canRenew(s, HOST_LEASE + 1), false);
  h.checkpoint(10, HOST_LEASE); assert.equal(h.receipt('a', 0, 10, HOST_LEASE + 1), false);
  assert.equal(h.receipt('a', 1, 99, HOST_LEASE + 1), false);
  assert.equal(h.receipt('a', 1, 10, HOST_LEASE + 1), true); assert.ok(h.canRenew(s, HOST_LEASE + 1));
  s.lastTick = HOST_LEASE + RTC_STALE + 2; assert.equal(h.canRenew(s, s.lastTick), false);
  s.members = [{ id: 'host' }]; assert.ok(h.canRenew(s, s.lastTick));
});

test('world contract roundtrip preserves all fields within wire tolerance without changing physics', () => {
  const p = { ...spawnPlayer(), id: 'p', connected: true, x: .12345678, y: 1.23456789 }, original = structuredClone(p);
  const encoded = encodePlayer(p); assert.deepEqual(p, original); assert.ok(Math.abs(encoded.x - p.x) <= .00005);
  const world = { t: 'state', v: 8, epoch: 1, seq: 1, now: 1000, players: [encoded], weapons: emptyWeapons(), checkpoint: { chatId: null, musicRevision: 0 } };
  const decoded = decodeSnapshot(world, 1); assert.ok(decoded); assert.ok(PLAYER_FIELDS.every(k => k in decoded.players[0]));
  const recovery = captureRecovery(decoded, [], emptyMusic()); assert.ok(recovery);
  const restored = restoreRecovery(recovery, [{ id: 'p', name: 'P', color: '#fff' }]);
  assert.ok(validPlayerState(restored.players.get('p'))); assert.equal(restored.now, 1000);
  assert.equal(decodeSnapshot({ ...world, players: [encoded, encoded] }, 1), null);
  assert.equal(decodeSnapshot({ ...world, epoch: 0 }, 1), null);
  assert.equal(decodeSnapshot({ ...world, players: [{ ...encoded, carrying: 'missing' }] }, 1), null);
  assert.equal(captureRecovery(decoded, [], { ...emptyMusic(), revision: 2 }), null);
});

test('bounded cyclic carry graphs are rejected at the snapshot boundary', () => {
  const a = { ...spawnPlayer(), id: 'a' }, b = { ...spawnPlayer(), id: 'b' };
  a.carrying = 'b'; a.carriedBy = 'b'; b.carrying = 'a'; b.carriedBy = 'a';
  assert.equal(decodeSnapshot({ t: 'state', epoch: 1, seq: 1, now: 1, players: [a, b], weapons: emptyWeapons() }, 1), null);
});

test('a world received long ago is not advertised as recovery-ready without an acknowledged recovery bundle', async () => {
  let params;
  const n = Object.assign(Object.create(CampNetwork.prototype), { code: 'ABC234', player: 'a', host: 'b', epoch: 1, isHost: false, closed: false,
    lastSnapshot: { now: 0 }, lastRecovery: null, lastTick: 0, members: [], after: 0, request: async path => { params = new URL('https://camp.test/' + path).searchParams; n.closed = true; return {}; } });
  await n.poll(); assert.equal(params.get('ready'), '0');
});

test('terminal room errors close the session once and prevent polling or reconnecting to the dead room', async () => {
  for (const status of [401, 403, 404, 410]) {
    let requests=0, ended=0, removed=0;
    const n=new CampNetwork({code:'ABC234',player:'a',host:'b',epoch:1},{name:'A'},
      {ended:message=>{assert.equal(message,'room ended');ended++;}},
      {request:async()=>{requests++;throw Object.assign(new Error('room ended'),{status});},
        lifecycle:{addEventListener(){},removeEventListener(){removed++;}}});
    try {
      await new Promise(resolve=>setImmediate(resolve));
      assert.ok(n.closed);assert.equal(ended,1);assert.equal(removed,1);
      await n.poll();n.retry();await n.poll();
      assert.equal(requests,1);assert.equal(ended,1);
    } finally {n.destroy(false);}
  }
});

test('temporary lobby failures stay recoverable without firing room termination', async () => {
  for (const error of [new TypeError('offline'),Object.assign(new Error('unavailable'),{status:503})]) {
    let ended=0;
    const n=new CampNetwork({code:'ABC234',player:'a',host:'b',epoch:1},{name:'A'},
      {ended:()=>ended++},{request:async()=>{throw error;}});
    try {
      await new Promise(resolve=>setImmediate(resolve));
      assert.equal(ended,0);assert.equal(n.closed,false);assert.equal(n.failures,1);assert.ok(n.pollTimer);
    } finally {n.destroy(false);}
  }
});

test('a successful room poll followed by rejected signalling does not terminate a live room during succession', async () => {
  let resolvePoll,ended=0;
  const n=new CampNetwork({code:'ABC234',player:'a',host:'b',epoch:1},{name:'A'},
    {ended:()=>ended++},{request:()=>new Promise(resolve=>{resolvePoll=resolve;})});
  try {
    // The old host can leave between this room response and our connection offer.
    n.connect=async()=>{throw Object.assign(new Error('peer left'),{status:403});};
    resolvePoll({host:'b',epoch:1,members:[{id:'a'},{id:'b'}],signals:[]});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(ended,0);assert.equal(n.closed,false);assert.ok(n.pollTimer);
  } finally {n.destroy(false);}
});

test('a pending poll cannot turn a normal draining departure into a terminal room error', async () => {
  let rejectPoll,ended=0;
  const n=new CampNetwork({code:'ABC234',player:'a',host:'a',epoch:1},{name:'A'},
    {ended:()=>ended++},{request:()=>new Promise((_,reject)=>{rejectPoll=reject;})});
  try {
    n.leaving=true;
    rejectPoll(Object.assign(new Error('room ended'),{status:410}));
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(ended,0);assert.equal(n.closed,false);assert.equal(n.pollTimer,undefined);
  } finally {n.destroy(false);}
});

async function lobby() {
  const f = fixture(), h = await f.enrolled('H'), a = await f.enrolled('A'), b = await f.enrolled('B');
  const { value: room } = await h('rooms', { op: 'create' }); f.advance(1);
  const { value: ar } = await a('rooms', { op: 'join', code: room.code }); f.advance(1);
  const { value: br } = await b('rooms', { op: 'join', code: room.code });
  return { f, h, a, b, room, ar, br };
}
const report = (r, seq, at) => roomQuery(r) + `&ready=1&recoveryEpoch=1&recoverySeq=${seq}&recoveryTime=${at}`;

test('server excludes an older isolated snapshot and elects a later member with current confirmed recovery', async () => {
  const { f, h, a, b, room, ar, br } = await lobby();
  await a(report(ar, 10, 1000)); await b(report(br, 100, 120000));
  await h('room', { op: 'leave', code: room.code, player: room.player });
  const next = await a(roomQuery(ar)); assert.equal(next.value.host, br.player); assert.equal(next.value.epoch, 2);
  f.sqlite.close();
});

test('shared failure duration does not age every valid recovery candidate out of succession', async () => {
  const { f, a, b, room, ar, br } = await lobby();
  await a(report(ar, 10, 1000)); await b(report(br, 11, 1100));
  f.advance(12000); await a(report(ar, 10, 1000)); await b(report(br, 11, 1100));
  f.advance(HOST_LEASE - 11998);
  const results = await Promise.all([a(roomQuery(ar)), b(roomQuery(br))]);
  assert.ok(results.every(r => r.value.host === ar.player && r.value.epoch === 2)); assert.equal(results[0].value.code, room.code);
  f.sqlite.close();
});

test('no suitable recovery keeps the room waiting instead of silently restoring an obsolete world', async () => {
  const { f, h, a, b, room, ar, br } = await lobby();
  await a(report(ar, 10, 1000)); await b(report(br, 100, 120000));
  await b('room', { op: 'leave', code: room.code, player: br.player }); await h('room', { op: 'leave', code: room.code, player: room.player });
  f.advance(10_000); await a(report(ar, 10, 1000)); f.advance(HOST_LEASE - 9999); const waiting = await a(roomQuery(ar));
  assert.equal(waiting.value.host, room.player); assert.equal(waiting.value.epoch, 1); assert.ok(waiting.value.recoveryWaiting);
  f.sqlite.close();
});

test('normal room polls use fewer SQL statements after bounded maintenance has run', async () => {
  const { f, a, ar } = await lobby(); await a(roomQuery(ar)); f.resetQueries();
  assert.equal((await a(roomQuery(ar))).status, 200); assert.ok(f.queries() <= 7, String(f.queries())); f.sqlite.close();
});

test('unconfirmed authority rotation is bounded, and the last active survivor can still take over', async () => {
  const f=fixture(), clients=[]; const h=await f.enrolled('H');const {value:room}=await h('rooms',{op:'create'});
  clients.push({request:h,info:room});
  for(let i=0;i<3;i++){f.advance(1);const request=await f.enrolled('G'+i);const {value:info}=await request('rooms',{op:'join',code:room.code});clients.push({request,info});}
  for(let round=0;round<3;round++){
    f.advance(10000);for(const c of clients.slice(1))await c.request(roomQuery(c.info));
    f.advance(10001);for(const c of clients.slice(1))await c.request(roomQuery(c.info));
  }
  const elected=await clients[1].request(roomQuery(clients[1].info));assert.equal(elected.value.epoch,4);
  f.advance(10000);for(const c of clients.slice(1))await c.request(roomQuery(c.info));f.advance(10001);
  const waiting=await clients[1].request(roomQuery(clients[1].info));assert.equal(waiting.value.epoch,4);assert.ok(waiting.value.recoveryWaiting);
  const keeper=clients.at(-1);
  for(const c of clients.slice(0,-1))await c.request('room',{op:'leave',code:room.code,player:c.info.player});
  const alone=await keeper.request(roomQuery(keeper.info));assert.equal(alone.value.host,keeper.info.player);assert.equal(alone.value.epoch,5);
  f.sqlite.close();
});

test('unchanged volatile snapshots are suppressed but reliable recovery checkpoints continue', () => {
  const n = Object.assign(Object.create(CampNetwork.prototype), { epoch: 1, sequence: 0, isHost: true, players: new Map([['a', { ...spawnPlayer(), id: 'a' }]]), peers: new Map(), callbacks: {}, chat: [], music: emptyMusic(), weapons: emptyWeapons() });
  let volatile = 0, checkpoints = 0; n.peers.set('b', { ready: true }); n.send = () => volatile++; n.broadcastControl = () => checkpoints++;
  for (let i = 0; i < 15; i++) n.publishWorld(); n.publishWorld(true);
  assert.equal(volatile, 1); assert.equal(checkpoints, 1); assert.ok(n.lastRecovery);
  applyPlayerAction(n.players, 'a', { kind: 'jump' }, 2000); n.publishWorld(); assert.equal(volatile, 2);
});
