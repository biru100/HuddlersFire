import { createCarrySystem } from './camp-carry.mjs';
import { stepBall } from './camp-ball.mjs';
import { presenceDefaults, presenceOf, persistentSocialState, validPresence, cleanPresenceText } from './camp-presence.mjs';
import { isWeapon, applyWeaponAction, stepWeapons } from './camp-weapons.mjs';
import { MAX_PLAYERS, CARRY_GAP, MAX_HEIGHT, COLORS } from './camp-config.mjs';
export { MAX_PLAYERS, CARRY_GAP, MAX_HEIGHT, COLORS } from './camp-config.mjs';
export const SPEED = 2.35;
export const RUN_MULTIPLIER = 1.6;
export const JUMP_PREP_MS = 110;
export const JUMP_SPEED = 3.8;
export const WORLD_LIMIT = 5.7;
export const GROUND_EDGE = 6;
export const TRAMPOLINES = [{ id: 'spring', type: 'trampoline', x: .4, y: 3.8, r: .65 }];
export const RADIO = { id: 'radio', type: 'radio', x: -3.3, y: .8, r: .35 };
export function canUseRadio(player) {
  return !!player && player.motion === 'grounded' && !player.carriedBy &&
    Math.hypot(player.x - RADIO.x, player.y - RADIO.y) <= 1.35;
}
export const EMOTES = [
  { id: 'wave', label: '인사', symbol: '안녕!' }, { id: 'laugh', label: '웃음', symbol: '하하!' },
  { id: 'heart', label: '하트', symbol: '♥' }, { id: 'clap', label: '박수', symbol: '짝짝!' },
  { id: 'dance', label: '춤', symbol: '♪ ♫' }, { id: 'surprise', label: '놀람', symbol: '!!' },
];
export const SCENERY = [
  { type: 'tree', x: -5, y: -4.5, r: .4, scale: 1.3 },
  { type: 'tree', x: -3.6, y: -5.1, r: .4, scale: 1.05 },
  { type: 'tree', x: -.8, y: -5.3, r: .4, scale: 1.5 },
  { type: 'tree', x: 2.5, y: -5.1, r: .4, scale: 1.1 },
  { type: 'tree', x: 5, y: -3.4, r: .4, scale: 1.4 },
  { type: 'tree', x: -5.2, y: -1.7, r: .4, scale: 1.1 },
  { type: 'tree', x: 5.2, y: 3.8, r: .4, scale: 1.25 },
  { type: 'tree', x: -5, y: 3.8, r: .4, scale: 1.25 },
  { type: 'tent', x: -4.2, y: -3.3, r: .85 },
  { type: 'log', x: 2.8, y: 2.2, r: .42 },
  { type: 'log', x: -2.8, y: -2.2, r: .42 },
  { type: 'lantern', x: 3.5, y: -2.5, r: .2 },
  { type: 'lantern', x: -2.5, y: 3.8, r: .2 },
  { type: 'sign', x: 3.6, y: 4.1, r: .3 },
];
const obstacles = [{ x: 0, y: 0, r: .7 }, RADIO, ...SCENERY];
export function validPosition(x, y) {
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) <= WORLD_LIMIT && Math.abs(y) <= WORLD_LIMIT &&
    obstacles.every(o => Math.hypot(x - o.x, y - o.y) > o.r + .18);
}
export function direction(keys) {
  const sx = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
  const sy = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
  const x = sx + sy, y = sy - sx, length = Math.hypot(x, y);
  return length ? { dx: x / length, dy: y / length } : { dx: 0, dy: 0 };
}
export function sanitizeInput(value) {
  if (!value || !Number.isFinite(value.dx) || !Number.isFinite(value.dy) || typeof value.sitting !== 'boolean') return null;
  if (value.running != null && typeof value.running !== 'boolean') return null;
  const length = Math.max(1, Math.hypot(value.dx, value.dy));
  return { dx: value.dx / length, dy: value.dy / length, sitting: value.sitting, running: value.running === true };
}
export function movePlayer(player, input, dt, allowFall = false) {
  player.running = !!input && input.running === true && !!(input.dx || input.dy) && !player.sitting && !player.crouching && !player.carriedBy && !player.thrown && ['grounded', 'airborne'].includes(player.motion);
  if (!input || player.sitting || player.carriedBy || player.thrown || ['falling', 'respawning'].includes(player.motion)) return;
  const step = SPEED * (player.crouching ? .4 : player.running ? RUN_MULTIPLIER : 1) * Math.max(0, Math.min(.1, dt));
  const x = player.x + input.dx * step, y = player.y + input.dy * step;
  const valid = allowFall ? clearOfObstacles : validPosition;
  if (valid(x, y)) { player.x = x; player.y = y; }
  else if (valid(x, player.y)) player.x = x;
  else if (valid(player.x, y)) player.y = y;
  if (input.dx || input.dy) {
    player.facing = input.dx - input.dy >= 0 ? 1 : -1;
    const length = Math.hypot(input.dx, input.dy);
    player.aimX = input.dx / length; player.aimY = input.dy / length;
  }
}
export function spawnPlayer(index = 0) {
  const start = index * Math.PI * 2 / MAX_PLAYERS + 1.5;
  for (let attempt = 0; attempt < 48; attempt++) {
    const angle = start + attempt * .17;
    const radius = 2.5 + Math.floor(attempt / 16) * .6;
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    if (validPosition(x, y)) return { x, y, ...restingState() };
  }
  return { x: 0, y: 2.5, ...restingState() };
}

function restingState() {
  return { ...presenceDefaults(), lastCallAt: -1, lastCalledAt: -1, sitting: false, crouching: false, running: false, jumpAt: -1, landedAt: -1, facing: 1, aimX: Math.SQRT1_2, aimY: -Math.SQRT1_2,
    weapon: 'none', nextShotAt: 0, shotAt: -1, shotAimX: Math.SQRT1_2, shotAimY: -Math.SQRT1_2, hitAt: -1,
    z: 0, vz: 0, vx: 0, vy: 0, thrown: false, motion: 'grounded', respawnAt: 0,
    carrying: null, carriedBy: null, allowCarry: true, emote: null, emoteUntil: 0, bubble: '', bubbleUntil: 0, respawns: 0 };
}
export const onGround = (x, y) => Math.abs(x) <= GROUND_EDGE && Math.abs(y) <= GROUND_EDGE;
function clearOfObstacles(x, y, tolerance = 0) {
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) < 8 && Math.abs(y) < 8 &&
    obstacles.every(o => Math.hypot(x - o.x, y - o.y) > o.r + .18 - tolerance);
}
export function validPlayerState(p, tolerance = 0) {
  return p && typeof p.id === 'string' && Number.isFinite(p.x) && Number.isFinite(p.y) &&
    isWeapon(p.weapon) && Number.isFinite(p.nextShotAt) && p.nextShotAt >= 0 && Number.isFinite(p.shotAt) && p.shotAt >= -1 && Number.isFinite(p.hitAt) && p.hitAt >= -1 &&
    Number.isFinite(p.shotAimX) && Math.abs(p.shotAimX) <= 1 && Number.isFinite(p.shotAimY) && Math.abs(p.shotAimY) <= 1 &&
    typeof p.running === 'boolean' && Number.isFinite(p.jumpAt) && p.jumpAt >= -1 && Number.isFinite(p.landedAt) && p.landedAt >= -1 &&
    Math.abs(p.x) <= 8 && Math.abs(p.y) <= 8 && Number.isFinite(p.z) && p.z >= -25 && p.z <= MAX_HEIGHT &&
    (p.respawnAt == null || (Number.isFinite(p.respawnAt) && p.respawnAt >= 0)) &&
    Number.isFinite(p.vz) && Math.abs(p.vz) <= 30 &&
    Number.isFinite(p.vx) && Math.abs(p.vx) <= 5 && Number.isFinite(p.vy) && Math.abs(p.vy) <= 5 &&
    typeof p.thrown === 'boolean' && (!p.thrown || p.motion === 'airborne') &&
    Number.isFinite(p.aimX) && Math.abs(p.aimX) <= 1 && Number.isFinite(p.aimY) && Math.abs(p.aimY) <= 1 &&
    ['grounded', 'airborne', 'carried', 'falling', 'respawning'].includes(p.motion) &&
    (p.motion !== 'grounded' || (Math.abs(p.x) <= GROUND_EDGE + tolerance && Math.abs(p.y) <= GROUND_EDGE + tolerance && clearOfObstacles(p.x, p.y, tolerance)));
}
export const { carryChain, canLift, carryTarget, syncCarry, releaseCarry, throwPassenger } = createCarrySystem(spawnPlayer);
/** @param {import('./camp-weapons.mjs').WeaponWorld | null} [weapons] */
export function applyPlayerAction(players, id, action, now, weapons = null) {
  const p = players.get(id);
  if (!p) return '아직 캠프장에 연결되지 않았어요.';
  if (action.kind === 'presence') {
    if (!validPresence(action)) return '상태 내용을 확인해 주세요.';
    const next = { ...presenceOf(action), statusText: cleanPresenceText(action.statusText), workText: cleanPresenceText(action.workText) };
    Object.assign(p, next); return null;
  }
  if (action.kind === 'equip' || action.kind === 'fire') return applyWeaponAction(weapons, players, id, action, now);
  if (action.kind === 'allow-carry') {
    p.allowCarry = action.allow;
    if (!p.allowCarry && p.carriedBy) releaseCarry(players, p);
    return null;
  }
  if (action.kind === 'escape') { if (p.carriedBy) releaseCarry(players, p); return null; }
  if (action.kind === 'lift' && p.carrying) { throwPassenger(players, p); return null; }
  if (action.kind === 'lift') {
    const target = players.get(action.target);
    if (!canLift(players, p, target)) return '손이 닿는 가까운 친구를 골라 주세요.';
    p.carrying = target.id; p.sitting = false; p.crouching = false; p.emote = null; p.jumpAt = -1;
    target.carriedBy = p.id;
    for (const member of carryChain(players, target)) Object.assign(member, { motion: 'carried', thrown: false, vx: 0, vy: 0, vz: 0,
      sitting: false, crouching: false, emote: null, jumpAt: -1, landedAt: -1, running: false });
    syncCarry(players); return null;
  }
  if (p.motion !== 'grounded') return '땅에 내려온 뒤 사용할 수 있어요.';
  if (action.kind === 'jump') {
    if (p.jumpAt >= 0) return '점프를 준비하고 있어요.';
    p.jumpAt = now; p.landedAt = -1; p.sitting = false; p.crouching = false; p.emote = null;
  } else if (action.kind === 'posture') {
    if (action.posture === 'sitting' && p.carrying) releaseCarry(players, p, true);
    p.sitting = action.posture === 'sitting'; p.crouching = action.posture === 'crouching'; p.emote = null;
    if (p.sitting || p.crouching) { p.running = false; p.jumpAt = -1; }
  } else if (action.kind === 'emote') {
    p.emote = action.emote; p.emoteUntil = now + 3000; p.sitting = false; p.crouching = false; p.jumpAt = -1;
  }
  return null;
}
// The same stepping code drives the authoritative host and solo play. Guests only predict horizontal motion.
/** @param {import('./camp-weapons.mjs').WeaponWorld | null} [weapons] @param {import('./camp-types').BallState | null} [ball] */
export function simulateWorld(players, inputs, elapsed, now, weapons = null, ball = null) {
  let remaining = Math.max(0, Math.min(1, elapsed));
  const end = now;
  while (remaining > 0) {
    const dt = Math.min(1 / 60, remaining); remaining -= dt;
    now = end - remaining * 1000;
    for (const p of players.values()) {
      if (p.connected === false && (p.carriedBy || p.carrying)) releaseCarry(players, p, true);
      if (p.carriedBy) {
        const carrier = players.get(p.carriedBy);
        if (!carrier || carrier.connected === false || carrier.carrying !== p.id) releaseCarry(players, p, true);
        else continue;
      }
      if (p.connected === false && p.carrying) releaseCarry(players, p, true);
      if (p.motion === 'respawning') {
        if (now >= p.respawnAt) {
          const respawns = (p.respawns || 0) + 1, allowCarry = p.allowCarry;
          Object.assign(p, spawnPlayer([...players.keys()].indexOf(p.id)), persistentSocialState(p), { respawns, allowCarry });
        }
        continue;
      }
      if (p.motion === 'grounded' && p.jumpAt >= 0 && now - p.jumpAt >= JUMP_PREP_MS) {
        p.motion = 'airborne'; p.vz = JUMP_SPEED; p.z = .01; p.jumpAt = -1;
      }
      const input = inputs.get(p.id);
      p.moving = !!input && !!(input.dx || input.dy) && !p.sitting;
      if (p.moving) p.emote = null;
      if (p.emoteUntil < now) p.emote = null;
      movePlayer(p, input, dt, true);
      if (p.thrown) {
        const x = p.x + p.vx * dt, y = p.y + p.vy * dt;
        if (clearOfObstacles(x, y)) { p.x = x; p.y = y; }
        else { p.vx = 0; p.vy = 0; }
      }
      if (!onGround(p.x, p.y) && p.z <= 0 && p.motion !== 'falling') {
        if (p.carrying) releaseCarry(players, p);
        p.motion = 'falling'; p.thrown = false; p.vx = 0; p.vy = 0;
        p.sitting = false; p.crouching = false; p.running = false; p.jumpAt = -1; p.emote = null; p.respawnAt = now + 2000;
      }
      if (p.motion === 'falling') {
        p.vz = Math.max(-25, p.vz - 8 * dt); p.z = Math.max(-20, p.z + p.vz * dt);
        if (now >= p.respawnAt - 650) p.motion = 'respawning';
        continue;
      }
      if (p.motion === 'airborne') {
        p.vz -= 8 * dt; p.z += p.vz * dt;
        const ceiling = MAX_HEIGHT - (carryChain(players, p).length - 1) * CARRY_GAP;
        if (p.z > ceiling) { p.z = ceiling; p.vz = Math.min(0, p.vz); }
        if (p.z <= 0 && p.vz <= 0 && onGround(p.x, p.y)) {
          p.z = 0; p.vz = 0; p.vx = 0; p.vy = 0; p.thrown = false; p.motion = 'grounded'; p.landedAt = now;
        }
      }
      if (p.motion === 'grounded' && TRAMPOLINES.some(t => Math.hypot(p.x - t.x, p.y - t.y) < t.r)) {
        p.motion = 'airborne'; p.vz = 6.4; p.z = .01; p.jumpAt = -1; p.landedAt = -1; p.sitting = false; p.crouching = false; p.emote = null;
      }
    }
    syncCarry(players);
    if (ball) stepBall(ball, players, dt, obstacles);
    if (weapons) stepWeapons(weapons, players, dt, now, obstacles, (p, dx, dy, force, bounce, at) => {
      if (p.hitAt >= 0 && at - p.hitAt < 180) return;
      if (p.carriedBy || p.carrying) releaseCarry(players, p);
      Object.assign(p, { vx: dx * force, vy: dy * force, vz: Math.max(Math.min(p.vz || 0, 3.5), bounce), z: Math.max(.01, p.z),
        motion: 'airborne', thrown: true, hitAt: at, jumpAt: -1, landedAt: -1, sitting: false, crouching: false, running: false, emote: null });
    });
  }
}
