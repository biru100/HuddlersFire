export const MAX_PLAYERS = 16;
export const COLORS = ['#e5a76d', '#89b6a5', '#b6a4d4', '#e5acb8', '#8cadd4', '#d8c486'];
export const SPEED = 2.35;
export const WORLD_LIMIT = 5.7;
export const GROUND_EDGE = 6;
export const TRAMPOLINES = [{ id: 'spring', type: 'trampoline', x: .4, y: 3.8, r: .65 }];
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
  { type: 'tent', x: -3.4, y: -2.5, r: 1.05 },
  { type: 'log', x: 1.6, y: 1.3, r: .5 },
  { type: 'log', x: -1.6, y: -1.3, r: .5 },
  { type: 'lantern', x: 3.5, y: -2.5, r: .2 },
  { type: 'lantern', x: -2.5, y: 3.8, r: .2 },
  { type: 'sign', x: 3.6, y: 4.1, r: .3 },
];
const obstacles = [{ x: 0, y: 0, r: .7 }, ...SCENERY];
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
  const length = Math.max(1, Math.hypot(value.dx, value.dy));
  return { dx: value.dx / length, dy: value.dy / length, sitting: value.sitting };
}
export function movePlayer(player, input, dt, allowFall = false) {
  if (!input || player.sitting || player.carriedBy || ['falling', 'respawning'].includes(player.motion)) return;
  const step = SPEED * (player.crouching ? .4 : 1) * Math.max(0, Math.min(.1, dt));
  const x = player.x + input.dx * step, y = player.y + input.dy * step;
  const valid = allowFall ? clearOfObstacles : validPosition;
  if (valid(x, y)) { player.x = x; player.y = y; }
  else if (valid(x, player.y)) player.x = x;
  else if (valid(player.x, y)) player.y = y;
  if (input.dx || input.dy) player.facing = input.dx - input.dy >= 0 ? 1 : -1;
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
  return { sitting: false, crouching: false, facing: 1, z: 0, vz: 0, motion: 'grounded',
    carrying: null, carriedBy: null, allowCarry: true, emote: null, emoteUntil: 0, bubble: '', bubbleUntil: 0, respawns: 0 };
}
export const onGround = (x, y) => Math.abs(x) <= GROUND_EDGE && Math.abs(y) <= GROUND_EDGE;
function clearOfObstacles(x, y) {
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) < 8 && Math.abs(y) < 8 &&
    obstacles.every(o => Math.hypot(x - o.x, y - o.y) > o.r + .18);
}
export function validPlayerState(p) {
  return p && typeof p.id === 'string' && Number.isFinite(p.x) && Number.isFinite(p.y) &&
    Math.abs(p.x) <= 8 && Math.abs(p.y) <= 8 && Number.isFinite(p.z) && p.z >= -25 && p.z <= 6 &&
    Number.isFinite(p.vz) && Math.abs(p.vz) <= 30 &&
    ['grounded', 'airborne', 'carried', 'falling', 'respawning'].includes(p.motion) &&
    (p.motion !== 'grounded' || (onGround(p.x, p.y) && clearOfObstacles(p.x, p.y)));
}
export function carryTarget(players, id) {
  const self = players.get(id);
  if (!self || self.carrying || self.carriedBy || self.motion !== 'grounded') return null;
  return [...players.values()].filter(p => p.id !== id && p.connected !== false && p.allowCarry &&
    !p.carrying && !p.carriedBy && p.motion === 'grounded' && Math.hypot(p.x - self.x, p.y - self.y) <= 1.05)
    .sort((a, b) => Math.hypot(a.x - self.x, a.y - self.y) - Math.hypot(b.x - self.x, b.y - self.y) || a.id.localeCompare(b.id))[0] || null;
}
export function releaseCarry(players, player, safe = false) {
  const carrier = player.carriedBy ? players.get(player.carriedBy) : player;
  if (player.carriedBy && (!carrier || carrier.carrying !== player.id)) {
    player.carriedBy = null; player.motion = 'airborne'; player.vz = 0;
    if (safe) {
      const allowCarry = player.allowCarry, respawns = player.respawns;
      Object.assign(player, spawnPlayer([...players.keys()].indexOf(player.id)), { allowCarry, respawns });
    }
    return;
  }
  const passenger = carrier?.carrying ? players.get(carrier.carrying) : null;
  if (carrier) carrier.carrying = null;
  if (!passenger) { player.carriedBy = null; return; }
  passenger.x = carrier.x; passenger.y = carrier.y; passenger.z = carrier.z + 1.3;
  passenger.carriedBy = null;
  passenger.motion = 'airborne'; passenger.vz = Math.min(0, carrier.vz || 0);
  if (safe) {
    const allowCarry = passenger.allowCarry, respawns = passenger.respawns;
    Object.assign(passenger, spawnPlayer([...players.keys()].indexOf(passenger.id)), { allowCarry, respawns });
  }
}
export function applyPlayerAction(players, id, action, now) {
  const p = players.get(id);
  if (!p) return '아직 캠프장에 연결되지 않았어요.';
  if (action.kind === 'allow-carry') {
    p.allowCarry = action.allow;
    if (!p.allowCarry && p.carriedBy) releaseCarry(players, p);
    return null;
  }
  if (action.kind === 'escape') { if (p.carriedBy) releaseCarry(players, p); return null; }
  if (action.kind === 'lift' && p.carrying) { releaseCarry(players, p); return null; }
  if (p.motion !== 'grounded') return '땅에 내려온 뒤 사용할 수 있어요.';
  if (action.kind === 'posture') {
    p.sitting = action.posture === 'sitting'; p.crouching = action.posture === 'crouching'; p.emote = null;
  } else if (action.kind === 'emote') {
    p.emote = action.emote; p.emoteUntil = now + 3000; p.sitting = false; p.crouching = false;
  } else if (action.kind === 'lift') {
    const target = carryTarget(players, id);
    if (!target || target.id !== action.target) return '들어올릴 수 있는 친구에게 더 가까이 가세요.';
    p.carrying = target.id; p.sitting = false; p.crouching = false; p.emote = null;
    target.carriedBy = p.id; target.motion = 'carried'; target.sitting = false; target.crouching = false; target.emote = null;
  }
  return null;
}
// The same stepping code drives the authoritative host and solo play. Guests only predict horizontal motion.
export function simulateWorld(players, inputs, elapsed, now) {
  let remaining = Math.max(0, Math.min(.1, elapsed));
  while (remaining > 0) {
    const dt = Math.min(1 / 60, remaining); remaining -= dt;
    for (const p of players.values()) {
      if (p.carriedBy) {
        const carrier = players.get(p.carriedBy);
        if (!carrier || carrier.connected === false || carrier.carrying !== p.id) releaseCarry(players, p, true);
        else continue;
      }
      if (p.connected === false && p.carrying) releaseCarry(players, p, true);
      if (p.motion === 'respawning') {
        if (now >= p.respawnAt) {
          const respawns = (p.respawns || 0) + 1, allowCarry = p.allowCarry;
          Object.assign(p, spawnPlayer([...players.keys()].indexOf(p.id)), { respawns, allowCarry });
        }
        continue;
      }
      const input = inputs.get(p.id);
      p.moving = !!input && !!(input.dx || input.dy) && !p.sitting;
      if (p.moving) p.emote = null;
      if (p.emoteUntil < now) p.emote = null;
      movePlayer(p, input, dt, true);
      if (!onGround(p.x, p.y) && p.z <= 0 && p.motion !== 'falling') {
        if (p.carrying) releaseCarry(players, p);
        p.motion = 'falling'; p.sitting = false; p.crouching = false; p.emote = null; p.respawnAt = now + 2000;
      }
      if (p.motion === 'falling') {
        p.vz = Math.max(-25, p.vz - 8 * dt); p.z = Math.max(-20, p.z + p.vz * dt);
        if (now >= p.respawnAt - 650) p.motion = 'respawning';
        continue;
      }
      if (p.motion === 'airborne') {
        p.vz -= 8 * dt; p.z += p.vz * dt;
        if (p.z <= 0 && p.vz <= 0 && onGround(p.x, p.y)) { p.z = 0; p.vz = 0; p.motion = 'grounded'; }
      }
      if (p.motion === 'grounded' && TRAMPOLINES.some(t => Math.hypot(p.x - t.x, p.y - t.y) < t.r)) {
        p.motion = 'airborne'; p.vz = 6.4; p.z = .01; p.sitting = false; p.crouching = false; p.emote = null;
      }
    }
    for (const p of players.values()) if (p.carriedBy) {
      const carrier = players.get(p.carriedBy);
      if (carrier) { p.x = carrier.x; p.y = carrier.y; p.z = carrier.z + 1.3; p.vz = carrier.vz; p.motion = 'carried'; p.facing = carrier.facing; }
    }
  }
}
