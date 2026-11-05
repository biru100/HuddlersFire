import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyWeapons, stepWeapons, readWeapons, segmentCircle, MAX_PROJECTILES, MAX_EFFECTS } from '../lib/camp-weapons.mjs';
import { spawnPlayer, applyPlayerAction, simulateWorld, validPlayerState } from '../lib/camp-world.mjs';
import { CampNetwork } from '../lib/camp-network.mjs';
import { CommandLedger, validAction, MAX_FRAME_BYTES } from '../lib/camp-protocol.mjs';

const player = (id, x = 0, y = 2) => ({ ...spawnPlayer(0, 'playground'), id, name: id, color: '#e5a76d', x, y, connected: true });
function setup() { return { players: new Map([['a', player('a')], ['b', player('b', .9)]]), weapons: emptyWeapons() }; }
function advance(players, weapons, duration, start = 0) { for (let i = 1; i <= Math.round(duration * 60); i++) simulateWorld(players, new Map(), 1 / 60, start + i * 1000 / 60, weapons); }
const equip = (s, weapon, now = 0) => applyPlayerAction(s.players, 'a', { id: 'equip', kind: 'equip', weapon }, now, s.weapons);
const fire = (s, now = 0, dx = 1, dy = 0) => applyPlayerAction(s.players, 'a', { id: `shot-${now}`, kind: 'fire', dx, dy }, now, s.weapons);

test('weapon selection and fire validate direction, carried state and shared cooldown across switches', () => {
  const s = setup();
  assert.ok(fire(s)); assert.ok(equip(s, 'laser')); assert.equal(equip(s, 'gun'), null); assert.equal(fire(s), null);
  assert.equal(s.weapons.projectiles.length, 1); assert.ok(fire(s, 100));
  assert.equal(equip(s, 'bomb', 100), null); assert.ok(fire(s, 110));
  assert.equal(fire(s, 400), null);
  assert.equal(s.weapons.projectiles[1].weapon, 'bomb');
  const p = s.players.get('a'); p.carriedBy = 'b'; p.motion = 'carried'; assert.ok(fire(s, 2000));
  assert.equal(validAction({ kind: 'fire', id: 'x', dx: NaN, dy: 1 }), false);
  assert.equal(validAction({ kind: 'fire', id: 'x', dx: 999, dy: 0 }), false);
  assert.equal(validAction({ kind: 'fire', id: 'x', dx: 0, dy: 0 }), false);
});

test('fast bullets sweep through targets and produce bounded knockback without health state', () => {
  const s = setup(); equip(s, 'gun'); fire(s);
  advance(s.players, s.weapons, .1);
  const target = s.players.get('b');
  assert.ok(target.thrown); assert.equal(target.motion, 'airborne'); assert.ok(target.vx > 0 && target.vx <= 5); assert.ok(target.vz > 0);
  assert.ok(validPlayerState(target)); assert.equal(s.weapons.projectiles.length, 0); assert.equal(s.weapons.effects[0].kind, 'spark');
  assert.equal('health' in target, false); assert.equal(s.players.get('a').hitAt, -1);
  assert.ok(segmentCircle(0, 0, 5, 0, 2.5, 0, .1) > 0);
});

test('jump height avoids low shots and playground scenery blocks bullets before players', () => {
  const s = setup(), target = s.players.get('b'); target.motion = 'airborne'; target.z = 1.8;
  equip(s, 'gun'); fire(s); advance(s.players, s.weapons, .2); assert.equal(target.hitAt, -1);
  const blocked = setup(); Object.assign(blocked.players.get('a'), { x: 4, y: -1.5 }); Object.assign(blocked.players.get('b'), { x: 4, y: -4 });
  equip(blocked, 'gun'); fire(blocked, 0, 0, -1); advance(blocked.players, blocked.weapons, .5);
  assert.equal(blocked.players.get('b').hitAt, -1); assert.equal(blocked.weapons.projectiles.length, 0);
  assert.equal(blocked.weapons.effects[0].kind, 'spark');
});

test('snowballs follow an arc and leave a snow effect on landing', () => {
  const s = setup(); s.players.delete('b'); equip(s, 'snowball'); fire(s);
  let peak = 0;
  for (let i = 1; i <= 90; i++) {
    stepWeapons(s.weapons, s.players, 1 / 60, i * 1000 / 60, [], () => {});
    peak = Math.max(peak, s.weapons.projectiles[0]?.z || 0);
    if (s.weapons.effects.length) break;
  }
  assert.ok(peak > .8); assert.equal(s.weapons.projectiles.length, 0); assert.equal(s.weapons.effects[0].kind, 'snow');
});

test('bomb fuse explodes once, includes its owner and leaves distant or high players unchanged', () => {
  const s = setup(); equip(s, 'bomb'); fire(s);
  Object.assign(s.weapons.projectiles[0], { x: 0, y: 2, z: 0, vx: 0, vy: 0, vz: 0 });
  s.players.set('far', player('far', 3, 2));
  s.players.set('high', { ...player('high', 0, 2), z: 3, motion: 'airborne' });
  simulateWorld(s.players, new Map(), .01, 1500, s.weapons); assert.equal(s.players.get('b').hitAt, -1);
  simulateWorld(s.players, new Map(), .01, 1600, s.weapons);
  assert.equal(s.weapons.projectiles.length, 0); assert.equal(s.weapons.effects.filter(e => e.kind === 'explosion').length, 1);
  assert.ok(s.players.get('a').thrown); assert.ok(s.players.get('b').thrown); assert.equal(s.players.get('far').hitAt, -1); assert.equal(s.players.get('high').hitAt, -1);
  simulateWorld(s.players, new Map(), .01, 1610, s.weapons); assert.equal(s.weapons.effects.length, 1);
});

test('impact releases a carried friend and knockback can fall off the map and respawn', () => {
  const s = setup(); Object.assign(s.players.get('a'), { x: -1, y: 5.65 }); Object.assign(s.players.get('b'), { x: 0, y: 5.65 });
  s.players.set('c', player('c', 0, 5.65));
  applyPlayerAction(s.players, 'b', { kind: 'lift', target: 'c' }, 0, s.weapons);
  equip(s, 'gun'); fire(s, 0, 1, 0); advance(s.players, s.weapons, .12);
  assert.equal(s.players.get('c').carriedBy, null); assert.equal(s.players.get('b').carrying, null);
  const edge = setup(); Object.assign(edge.players.get('a'), { x: 5.1, y: 1 }); Object.assign(edge.players.get('b'), { x: 5.75, y: 1 });
  equip(edge, 'snowball'); fire(edge); advance(edge.players, edge.weapons, 4);
  assert.ok(edge.players.get('b').respawns >= 1); assert.equal(edge.players.get('b').motion, 'grounded');
});

test('disconnect cleanup, owner cap and malformed snapshots remain bounded', () => {
  const s = setup(); equip(s, 'gun');
  for (let i = 0; i < 4; i++) assert.equal(fire(s, i * 400), null);
  assert.ok(fire(s, 2000));
  s.players.get('a').connected = false; stepWeapons(s.weapons, s.players, .02, 2000, [], () => {}); assert.equal(s.weapons.projectiles.length, 0);
  assert.equal(readWeapons({ projectiles: Array(MAX_PROJECTILES + 1).fill({}), effects: [] }), null);
  assert.equal(readWeapons({ projectiles: [], effects: Array(MAX_EFFECTS + 1).fill({}) }), null);
  const valid = setup(); equip(valid, 'gun'); fire(valid);
  assert.ok(readWeapons(valid.weapons));
  assert.equal(readWeapons({ ...valid.weapons, projectiles: [{ ...valid.weapons.projectiles[0], x: NaN }] }), null);
  assert.equal(readWeapons({ ...valid.weapons, projectiles: [{ ...valid.weapons.projectiles[0], weapon: 'laser' }] }), null);
});

test('host deduplicates fire commands and full bounded snapshots fit the reliable channel', () => {
  const s = setup(), n = Object.assign(Object.create(CampNetwork.prototype), { player: 'a', host: 'a', players: s.players, weapons: s.weapons,
    peers: new Map(), callbacks: {}, ledger: new CommandLedger(), sequence: 0 });
  assert.ok(n.handleCommand('a', { id: 'equip-once', kind: 'equip', weapon: 'gun' }).ok);
  const shot = { id: 'fire-once', kind: 'fire', dx: 1, dy: 0 };
  assert.ok(n.handleCommand('a', shot).ok); assert.ok(n.handleCommand('a', shot).ok); assert.equal(n.weapons.projectiles.length, 1);
  const template = n.weapons.projectiles[0];
  const owner = i => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
  const decimal = 12345.123456789123;
  n.weapons.projectiles = Array.from({ length: MAX_PROJECTILES }, (_, i) => ({ ...template, id: `p${i}`.padEnd(64, 'x'), owner: owner(i % 16), x: -5.123456789123456, y: -5.123456789123456,
    vx: -8.485281374238571, vy: -8.485281374238571, bornAt: decimal, expiresAt: decimal + 550 }));
  n.weapons.effects = Array.from({ length: MAX_EFFECTS }, (_, i) => ({ id: `fx:${i}`, weapon: 'bomb', kind: 'explosion', x: -5.123456789123456, y: -5.123456789123456, z: 0, at: decimal, expiresAt: decimal + 650, radius: 1.7 }));
  for (let i = 0; i < 16; i++) n.players.set(owner(i), { ...player(owner(i)), x: -5.123456789123456, y: -5.123456789123456, bubble: '한'.repeat(200), bubbleUntil: decimal + 5000 });
  n.players.delete('a'); n.players.delete('b');
  assert.ok(new TextEncoder().encode(JSON.stringify(n.worldMessage())).byteLength < MAX_FRAME_BYTES);
  assert.ok(readWeapons(n.weapons));
});
