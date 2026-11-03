import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnPlayer, simulateWorld, applyPlayerAction, carryTarget, validPlayerState, validPosition, TRAMPOLINES } from '../lib/camp-world.mjs';
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
  for (const fields of [{ x: NaN }, { z: Infinity }, { vz: 900 }, { x: 8.1 }, { motion: 'flying' }, { y: 6.1 }]) assert.equal(validPlayerState({ ...p, ...fields }), false);
  assert.ok(validPlayerState({ ...p, y: 6.1, z: -1, motion: 'falling' }));
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
  n.receiveWorld({ seq: 10, players: [state] }); assert.equal(p.x, state.x); assert.equal(p.y, state.y);
  n.receiveWorld({ seq: 9, players: [{ ...state, x: 4 }] }); assert.equal(p.x, state.x);
});
