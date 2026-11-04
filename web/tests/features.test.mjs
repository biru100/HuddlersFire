import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnPlayer, simulateWorld, applyPlayerAction, carryTarget, validPlayerState, validPosition, TRAMPOLINES, RADIO, canUseRadio, sanitizeInput, RUN_MULTIPLIER, SPEED } from '../lib/camp-world.mjs';
import { layoutBubbles } from '../lib/camp-bubbles.mjs';
import { emptyMusic, parseYouTubeUrl, musicPosition, applyMusicAction } from '../lib/camp-media.mjs';
import { validAction, chatText, CommandLedger, MAX_FRAME_BYTES } from '../lib/camp-protocol.mjs';
import { CampNetwork } from '../lib/camp-network.mjs';

function world() {
  return new Map(['a', 'b', 'c'].map((id, i) => [id, { id, name: id, color: '#e5a76d', connected: true, ...spawnPlayer(i), x: i * .5, y: 2 }]));
}
function advance(players, seconds, inputs = new Map(), start = 0) {
  for (let i = 1; i <= Math.round(seconds * 60); i++) simulateWorld(players, inputs, 1 / 60, start + i * 1000 / 60);
}
function host() {
  return Object.assign(Object.create(CampNetwork.prototype), { player: 'a', host: 'a', isHost: true, closed: false, players: world(), peers: new Map(),
    callbacks: {}, ledger: new CommandLedger(), chat: [], music: emptyMusic(), sequence: 0, pending: new Map() });
}
const act = (kind, data = {}) => ({ id: crypto.randomUUID(), kind, ...data });

test('running is bounded, normalized, stops on release and yields to crouching', () => {
  const walk = world(), run = world();
  advance(walk, .2, new Map([['a', { dx: 1, dy: 0, running: false }]]));
  advance(run, .2, new Map([['a', { dx: 1, dy: 0, running: true }]]));
  assert.ok(Math.abs(run.get('a').x / walk.get('a').x - RUN_MULTIPLIER) < .0001);
  assert.equal(run.get('a').running, true);
  advance(run, .1); assert.equal(run.get('a').running, false);
  const w = world(), input = sanitizeInput({ dx: 999, dy: 999, sitting: false, running: true });
  advance(w, .1, new Map([['a', input]]));
  assert.ok(Math.hypot(w.get('a').x, w.get('a').y - 2) <= SPEED * RUN_MULTIPLIER * .1 + .00001);
  assert.equal(sanitizeInput({ dx: 1, dy: 0, sitting: false, running: 'fast' }), null);
  const crouch = world(); crouch.get('a').crouching = true;
  advance(crouch, .2, new Map([['a', { dx: 1, dy: 0, running: true }]]));
  assert.equal(crouch.get('a').running, false); assert.ok(Math.abs(crouch.get('a').x - SPEED * .4 * .2) < .00001);
  const blocked = world();
  advance(blocked, 2, new Map([['a', { dx: 0, dy: -1, running: true }]]));
  assert.ok(validPosition(blocked.get('a').x, blocked.get('a').y)); assert.ok(blocked.get('a').y > .87);
});

test('jump prepares, takes off once, lands and can be used again after landing', () => {
  const w = world(), p = w.get('a'); p.sitting = true;
  assert.equal(applyPlayerAction(w, 'a', { kind: 'jump' }, 100), null);
  assert.equal(p.sitting, false); assert.equal(p.jumpAt, 100); assert.equal(p.motion, 'grounded');
  assert.ok(applyPlayerAction(w, 'a', { kind: 'jump' }, 150));
  advance(w, .1, new Map(), 100); assert.equal(p.motion, 'grounded');
  advance(w, .15, new Map(), 200); assert.equal(p.motion, 'airborne'); assert.ok(p.z > 0); assert.ok(validPlayerState(p));
  const velocity = p.vz; assert.ok(applyPlayerAction(w, 'a', { kind: 'jump' }, 350)); assert.equal(p.vz, velocity);
  advance(w, 1, new Map(), 350); assert.equal(p.motion, 'grounded'); assert.equal(p.z, 0); assert.ok(p.landedAt > 350);
  assert.equal(applyPlayerAction(w, 'a', { kind: 'jump' }, 1400), null);
});

test('jump carries a friend through the same arc and airborne escape remains available', () => {
  const w = world(), carrier = w.get('a'), passenger = w.get('b');
  assert.equal(applyPlayerAction(w, 'a', { kind: 'lift', target: 'b' }, 0), null);
  assert.equal(applyPlayerAction(w, 'a', { kind: 'jump' }, 100), null);
  advance(w, .35, new Map(), 100);
  assert.equal(carrier.motion, 'airborne'); assert.equal(passenger.motion, 'carried');
  assert.ok(Math.abs(passenger.z - carrier.z - 1.3) < .00001);
  assert.ok(applyPlayerAction(w, 'b', { kind: 'jump' }, 450));
  assert.equal(applyPlayerAction(w, 'b', { kind: 'escape' }, 450), null);
  assert.equal(passenger.carriedBy, null); advance(w, 1.5, new Map(), 450);
  assert.equal(carrier.motion, 'grounded'); assert.equal(passenger.motion, 'grounded');
});

test('crouching can be repeated, slows movement, and stays independent from sitting', () => {
  const w = world(), p = w.get('a');
  applyPlayerAction(w, 'a', { kind: 'posture', posture: 'sitting' }, 0);
  applyPlayerAction(w, 'a', { kind: 'posture', posture: 'crouching' }, 1);
  assert.ok(p.crouching); assert.equal(p.sitting, false);
  advance(w, .1, new Map([['a', { dx: 0, dy: 1 }]]));
  const crouched = p.y - 2;
  applyPlayerAction(w, 'a', { kind: 'posture', posture: 'standing' }, 200);
  const before = p.y; advance(w, .1, new Map([['a', { dx: 0, dy: 1 }]]), 200);
  assert.ok(p.y - before > crouched * 2);
  for (let i = 0; i < 10; i++) applyPlayerAction(w, 'a', { kind: 'posture', posture: i % 2 ? 'standing' : 'crouching' }, 400 + i);
  assert.equal(p.crouching, false);
});
test('emotes expire and movement cancels them', () => {
  const w = world(), p = w.get('a');
  applyPlayerAction(w, 'a', { kind: 'emote', emote: 'wave' }, 0);
  advance(w, 3.1); assert.equal(p.emote, null);
  applyPlayerAction(w, 'a', { kind: 'emote', emote: 'dance' }, 4000);
  advance(w, .1, new Map([['a', { dx: 0, dy: 1 }]]), 4000); assert.equal(p.emote, null);
});
test('crossing the visible ground edge falls and respawns instead of being rejected', () => {
  const w = world(), p = w.get('a'); p.x = 0; p.y = 5.99;
  advance(w, .1, new Map([['a', { dx: 0, dy: 1 }]]));
  assert.equal(p.motion, 'falling'); assert.ok(p.y > 6); assert.ok(validPlayerState(p));
  advance(w, 2.2, new Map(), 100);
  assert.equal(p.motion, 'grounded'); assert.equal(p.respawns, 1); assert.ok(validPosition(p.x, p.y));
});
test('trampoline launches once per landing and continues to bounce under gravity', () => {
  const w = world(), p = w.get('a'); Object.assign(p, { x: TRAMPOLINES[0].x, y: TRAMPOLINES[0].y });
  advance(w, .1); assert.equal(p.motion, 'airborne'); assert.ok(p.z > 0);
  const v = p.vz; advance(w, .2, new Map(), 100); assert.ok(p.vz < v);
  let peak = p.z, bounces = 0, previousVz = p.vz;
  for (let i = 1; i <= 240; i++) {
    simulateWorld(w, new Map(), 1 / 60, 300 + i * 1000 / 60); peak = Math.max(peak, p.z);
    if (p.vz > 0 && previousVz < 0) bounces++; previousVz = p.vz;
    assert.ok(validPlayerState(p));
  }
  assert.ok(peak > 2); assert.ok(bounces >= 2);
});
test('carry selection, consent, nesting restrictions and passenger escape are authoritative', () => {
  const w = world(), p = w.get('a'), q = w.get('b');
  assert.equal(carryTarget(w, 'a').id, 'b');
  assert.equal(applyPlayerAction(w, 'a', { kind: 'lift', target: 'b' }, 0), null);
  advance(w, .1); assert.equal(q.carriedBy, 'a'); assert.ok(q.z > p.z);
  assert.ok(applyPlayerAction(w, 'b', { kind: 'lift', target: 'c' }, 100));
  applyPlayerAction(w, 'b', { kind: 'escape' }, 100); advance(w, .8, new Map(), 100);
  assert.equal(p.carrying, null); assert.equal(q.carriedBy, null); assert.equal(q.motion, 'grounded');
  applyPlayerAction(w, 'b', { kind: 'allow-carry', allow: false }, 1000);
  assert.notEqual(carryTarget(w, 'a')?.id, 'b');
});
test('carrier and passenger bounce together and both recover after a fall', () => {
  const w = world(), p = w.get('a'), q = w.get('b');
  applyPlayerAction(w, 'a', { kind: 'lift', target: 'b' }, 0);
  Object.assign(p, { x: TRAMPOLINES[0].x, y: TRAMPOLINES[0].y }); advance(w, .4);
  assert.equal(q.motion, 'carried'); assert.equal(q.z, p.z + 1.3);
  Object.assign(p, { x: 0, y: 6.1, z: 0, vz: 0, motion: 'grounded' });
  advance(w, 4, new Map(), 500);
  assert.equal(p.carrying, null); assert.equal(q.carriedBy, null);
  assert.equal(p.motion, 'grounded'); assert.equal(q.motion, 'grounded');
});
test('disconnecting or missing carriers cannot leave a passenger suspended', () => {
  for (const missing of [false, true]) {
    const w = world(), p = w.get('a'), q = w.get('b');
    applyPlayerAction(w, 'a', { kind: 'lift', target: 'b' }, 0); advance(w, .1);
    if (missing) w.delete('a'); else p.connected = false;
    advance(w, .1, new Map(), 100);
    assert.equal(q.carriedBy, null); assert.equal(q.motion, 'grounded'); assert.ok(validPosition(q.x, q.y));
  }
});
test('state validation admits bounded falling positions and rejects nonfinite or impossible values', () => {
  const p = world().get('a'); assert.ok(validPlayerState(p));
  for (const fields of [{ x: NaN }, { z: Infinity }, { vz: 900 }, { vx: Infinity }, { vy: 50 }, { aimX: NaN }, { thrown: true }, { x: 8.1 }, { motion: 'flying' }, { y: 6.1 }]) assert.equal(validPlayerState({ ...p, ...fields }), false);
  assert.ok(validPlayerState({ ...p, y: 6.1, z: -1, motion: 'falling' }));
});

test('F throws in the last movement direction, ignores air steering and clears velocity on landing', () => {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [Math.SQRT1_2, -Math.SQRT1_2]]) {
    const w = world(), p = w.get('a'), q = w.get('b'); w.delete('c');
    advance(w, .1, new Map([['a', { dx, dy }]]));
    applyPlayerAction(w, 'a', { kind: 'lift', target: 'b' }, 100);
    advance(w, .1);
    const start = { x: q.x, y: q.y, z: q.z };
    applyPlayerAction(w, 'a', { kind: 'lift', target: null }, 200);
    assert.equal(p.carrying, null); assert.equal(q.carriedBy, null); assert.ok(q.thrown);
    advance(w, .15, new Map([['b', { dx: -dx, dy: -dy }]]), 200);
    assert.ok(Math.abs(q.x - start.x - dx * 3.6 * .15) < 1e-8);
    assert.ok(Math.abs(q.y - start.y - dy * 3.6 * .15) < 1e-8);
    assert.ok(q.z > start.z);
    advance(w, 1.2, new Map(), 350);
    assert.equal(q.motion, 'grounded'); assert.equal(q.thrown, false);
    assert.equal(q.vx, 0); assert.equal(q.vy, 0); assert.ok(validPlayerState(q));
  }
});

test('throws stop at fire, scenery and radio; edge throws fall and respawn', () => {
  for (const start of [
    { x: 0, y: 1.2, aimX: 0, aimY: -1 },
    { x: 1.8, y: 2.2, aimX: 1, aimY: 0 },
    { x: RADIO.x + 1, y: RADIO.y, aimX: -1, aimY: 0 },
  ]) {
    const w = world(), p = w.get('a'), q = w.get('b'); w.delete('c');
    Object.assign(p, start); Object.assign(q, { x: start.x, y: start.y });
    applyPlayerAction(w, 'a', { kind: 'lift', target: 'b' }, 0);
    applyPlayerAction(w, 'a', { kind: 'lift', target: null }, 1);
    for (let i = 0; i < 90; i++) {
      simulateWorld(w, new Map(), 1 / 60, i * 1000 / 60);
      assert.ok(validPosition(q.x, q.y)); assert.ok(validPlayerState(q));
    }
    assert.equal(q.motion, 'grounded');
    assert.ok(Math.hypot(q.x - start.x, q.y - start.y) < 1);
  }
  const w = world(), p = w.get('a'), q = w.get('b'); w.delete('c');
  Object.assign(p, { x: 0, y: 5.4, aimX: 0, aimY: 1 }); Object.assign(q, { x: 0, y: 5.4 });
  applyPlayerAction(w, 'a', { kind: 'lift', target: 'b' }, 0);
  applyPlayerAction(w, 'a', { kind: 'lift', target: null }, 1);
  advance(w, 1.2); assert.equal(q.motion, 'falling'); assert.ok(validPlayerState(q));
  advance(w, 2.2, new Map(), 1200);
  assert.equal(q.respawns, 1); assert.equal(q.motion, 'grounded'); assert.equal(q.vy, 0);
});

test('a thrown passenger bounces on a trampoline without retaining throw momentum', () => {
  const w = world(), p = w.get('a'), q = w.get('b'); w.delete('c');
  Object.assign(p, { x: 3.9, y: TRAMPOLINES[0].y - .5, aimX: -1, aimY: 0 });
  Object.assign(q, { x: p.x, y: p.y });
  assert.ok(validPosition(p.x, p.y));
  applyPlayerAction(w, 'a', { kind: 'lift', target: 'b' }, 0);
  applyPlayerAction(w, 'a', { kind: 'lift', target: null }, 1);
  advance(w, 1.15);
  assert.equal(q.motion, 'airborne'); assert.ok(q.vz > 0); assert.equal(q.thrown, false); assert.equal(q.vx, 0);
});

test('opting out and escaping release vertically instead of throwing', () => {
  for (const action of [{ kind: 'escape' }, { kind: 'allow-carry', allow: false }]) {
    const w = world(), p = w.get('a'), q = w.get('b');
    applyPlayerAction(w, 'a', { kind: 'lift', target: 'b' }, 0); advance(w, .1);
    applyPlayerAction(w, 'b', action, 100); advance(w, .8, new Map(), 100);
    assert.equal(q.x, p.x); assert.equal(q.y, p.y); assert.equal(q.thrown, false); assert.equal(q.motion, 'grounded');
  }
});

test('radio interaction requires proximity and being on the ground', () => {
  const p = { ...spawnPlayer(), x: RADIO.x + 1, y: RADIO.y };
  assert.ok(canUseRadio(p)); assert.ok(validPosition(p.x, p.y));
  assert.equal(validPosition(RADIO.x, RADIO.y), false);
  for (const other of [null, { ...p, x: RADIO.x + 1.36 }, { ...p, motion: 'airborne' }, { ...p, carriedBy: 'a' }]) assert.equal(canUseRadio(other), false);
});

test('crowded speech bubbles stay within the viewport without overlap and prioritize newest messages', () => {
  const candidates = Array.from({ length: 16 }, (_, i) => ({ id: String(i), until: i, anchorX: 190, anchorY: 360, width: 164, height: 85 }));
  for (const bounds of [{ left: 12, top: 170, right: 378, bottom: 420 }, { left: 12, top: 260, right: 1038, bottom: 724 }]) {
    const boxes = layoutBubbles(candidates, bounds);
    assert.equal(boxes[0].id, '15'); assert.ok(boxes.length > 1);
    for (const [i, b] of boxes.entries()) {
      assert.ok(b.x >= bounds.left && b.x + b.width <= bounds.right && b.y >= bounds.top && b.y + b.height <= bounds.bottom);
      for (const other of boxes.slice(i + 1)) assert.ok(b.x + b.width <= other.x || other.x + other.width <= b.x || b.y + b.height <= other.y || other.y + other.height <= b.y);
    }
  }
  assert.equal(candidates[0].id, '0');
});
test('only supported HTTPS YouTube URLs become video IDs', () => {
  for (const url of ['https://youtu.be/abcdefghijk?t=1', 'https://www.youtube.com/watch?v=abcdefghijk', 'https://m.youtube.com/shorts/abcdefghijk']) assert.equal(parseYouTubeUrl(url), 'abcdefghijk');
  for (const url of ['javascript:alert(1)', 'https://youtube.com.evil.test/watch?v=abcdefghijk', 'https://user@youtube.com/watch?v=abcdefghijk', 'https://youtu.be/a', 'http://youtube.com/watch?v=abcdefghijk', 'https://youtube.com/playlist?list=x']) assert.equal(parseYouTubeUrl(url), null);
});
test('music permission, queue limits and duplicate requests are enforced', () => {
  const m = emptyMusic(), a = { id: 'a', name: 'A' };
  for (let i = 0; i < 3; i++) assert.equal(applyMusicAction(m, act('music-add', { url: 'https://youtu.be/abcdefghij' + i }), a, false, 0), null);
  assert.ok(applyMusicAction(m, act('music-add', { url: 'https://youtu.be/abcdefghij4' }), a, false, 0));
  assert.ok(applyMusicAction(m, act('music-control', { op: 'play' }), a, false, 0));
  assert.ok(applyMusicAction(m, act('music-add', { url: 'https://youtu.be/abcdefghij0' }), { id: 'b', name: 'B' }, false, 0));
  for (let i = 3; i < 30; i++) assert.equal(applyMusicAction(m, act('music-add', { url: 'https://youtu.be/' + String(i).padStart(11, '0') }), { id: 'user' + i, name: 'U' }, false, 0), null);
  assert.ok(applyMusicAction(m, act('music-add', { url: 'https://youtu.be/zzzzzzzzzzz' }), { id: 'z' }, false, 0));
});
test('music clock handles play, pause, seek reports and stale end events', () => {
  const m = emptyMusic(), a = { id: 'a', name: 'A' };
  for (let i = 0; i < 2; i++) applyMusicAction(m, act('music-add', { url: 'https://youtu.be/abcdefghij' + i }), a, true, 0);
  applyMusicAction(m, act('music-control', { op: 'play' }), a, true, 1000); assert.equal(musicPosition(m, 6000), 5);
  applyMusicAction(m, act('music-control', { op: 'pause' }), a, true, 6000); assert.equal(musicPosition(m, 10000), 5);
  applyMusicAction(m, act('music-control', { op: 'play' }), a, true, 10000); assert.equal(musicPosition(m, 12000), 7);
  const old = m.current.id;
  applyMusicAction(m, act('music-control', { op: 'sync', currentId: old, position: 15 }), a, true, 12000); assert.equal(musicPosition(m, 13000), 16);
  assert.ok(applyMusicAction(m, act('music-control', { op: 'sync', currentId: old, position: NaN }), a, true, 13000));
  applyMusicAction(m, act('music-control', { op: 'skip', currentId: old }), a, true, 13000); const next = m.current.id;
  assert.ok(applyMusicAction(m, act('music-control', { op: 'skip', currentId: old }), a, true, 14000)); assert.equal(m.current.id, next);
});
test('command validation, text limits and rate limits reject malformed or excessive actions', () => {
  assert.equal(validAction(act('chat', { text: 'a'.repeat(201) })), false);
  assert.equal(validAction(act('posture', { posture: 'teleport' })), false);
  assert.equal(validAction(act('emote', { emote: '<script>' })), false);
  assert.equal(chatText('hello\n\u202e world'), 'hello   world');
  const ledger = new CommandLedger(); assert.ok(ledger.permit('a', 'chat', 0)); assert.equal(ledger.permit('a', 'chat', 500), false); assert.ok(ledger.permit('a', 'chat', 1000));
});
test('host binds chat author to the connection and deduplicates accepted and rejected requests', () => {
  const n = host(), action = act('chat', { text: '안녕하세요', by: 'c', name: 'forged' });
  assert.ok(n.handleCommand('b', action).ok); assert.ok(n.handleCommand('b', action).ok);
  assert.equal(n.chat.length, 1); assert.equal(n.chat[0].by, 'b'); assert.equal(n.chat[0].name, 'b');
  const denied = act('music-control', { op: 'play' }); assert.equal(n.handleCommand('b', denied).ok, false);
  assert.deepEqual(n.handleCommand('b', denied), n.ledger.cached('b', denied.id));
});
test('reconnect history chunks preserve 100 full-length CJK messages within browser frame limits', () => {
  const n = host(), frames = [];
  n.chat = Array.from({ length: 100 }, (_, i) => ({ id: String(i), by: 'a', name: '가'.repeat(16), color: '#e5a76d', text: '나'.repeat(200), at: i }));
  const peer = { control: { readyState: 'open', bufferedAmount: 0, send: s => frames.push(s) }, queue: [], queueBytes: 0 };
  n.syncRoom(peer);
  for (const frame of frames) assert.ok(Buffer.byteLength(frame) <= MAX_FRAME_BYTES);
  assert.equal(frames.map(s => JSON.parse(s)).filter(m => m.t === 'history').flatMap(m => m.entries).length, 100);
  peer.control.bufferedAmount = 80_000; assert.ok(n.reliable(peer, { t: 'test' })); assert.equal(peer.queue.length, 1);
  peer.control.bufferedAmount = 0; n.flush(peer); assert.equal(peer.queue.length, 0);
});
test('respawn snapshots reset interpolation and stale world snapshots cannot rewind players', () => {
  const n = host(); n.isHost = false; n.members = [...n.players.values()]; n.lastSequence = -1;
  const p = n.players.get('b'); p.x = 0; p.y = 6.1; p.z = -4; p.motion = 'falling';
  const state = { ...p, ...spawnPlayer(1), respawns: 1 };
  n.receiveWorld({ t: 'state', epoch: 1, now: 500, seq: 10, players: [state] }); assert.ok(Math.abs(p.x - state.x) <= .0001); assert.ok(Math.abs(p.y - state.y) <= .0001);
  const before = p.x;
  n.receiveWorld({ t: 'state', epoch: 1, now: 500, seq: 9, players: [{ ...state, x: 4 }] }); assert.equal(p.x, before);
});

test('throw snapshots survive validation and repeated action IDs cannot launch twice', () => {
  const n = host(), q = n.players.get('b');
  assert.ok(n.handleCommand('a', act('lift', { target: 'b' })).ok);
  n.ledger.last.delete('a:lift');
  const action = act('lift', { target: null });
  assert.ok(n.handleCommand('a', action).ok);
  const guest = host(); guest.isHost = false; guest.members = [...guest.players.values()]; guest.lastSequence = -1;
  guest.receiveWorld(n.worldMessage());
  assert.equal(guest.players.get('b').thrown, true);
  assert.ok(Math.abs(guest.players.get('b').vx - q.vx) <= .0001); assert.equal(guest.players.get('b').z, q.z);
  advance(n.players, .15); const before = { ...q };
  assert.ok(n.handleCommand('a', action).ok);
  assert.deepEqual(q, before);
});
