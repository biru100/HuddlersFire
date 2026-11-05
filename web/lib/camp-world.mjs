import { leaveSeat, takeSeat, seatById, isSeated } from './camp-seats.mjs';
import { addFirewood, changeFireStyle } from './camp-fire.mjs';
import { CAMP_MAP, PLAY_MAP, isMap, canPlay, getMap, RADIO, MAP_BOUNDS, portalFor } from './camp-maps.mjs';
export { SCENERY, TRAMPOLINES, RADIO } from './camp-maps.mjs';
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
export const WORLD_LIMIT = MAP_BOUNDS.walk;
export const GROUND_EDGE = MAP_BOUNDS.edge;
export function canUseRadio(player) {
  return !!player && player.mapId === CAMP_MAP && player.motion === 'grounded' && !player.carriedBy &&
    Math.hypot(player.x - RADIO.x, player.y - RADIO.y) <= 1.35;
}
export const EMOTES = [
  { id: 'wave', label: '인사', symbol: '안녕!' }, { id: 'laugh', label: '웃음', symbol: '하하!' },
  { id: 'heart', label: '하트', symbol: '♥' }, { id: 'clap', label: '박수', symbol: '짝짝!' },
  { id: 'dance', label: '춤', symbol: '♪ ♫' }, { id: 'surprise', label: '놀람', symbol: '!!' },
];
export function validPosition(x, y, mapId = CAMP_MAP) {
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) <= getMap(mapId).bounds.walk && Math.abs(y) <= getMap(mapId).bounds.walk &&
    getMap(mapId).obstacles.every(o => Math.hypot(x - o.x, y - o.y) > o.r + .18);
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
  if(player.seatId && input && (input.dx || input.dy)) {leaveSeat(player);player.sitting=false;}
  player.running = !!input && input.running === true && !!(input.dx || input.dy) && !player.sitting && !player.crouching && !player.carriedBy && !player.thrown && ['grounded', 'airborne'].includes(player.motion);
  if (!input || player.sitting || player.carriedBy || player.thrown || ['falling', 'respawning'].includes(player.motion)) return;
  const step = SPEED * (player.crouching ? .4 : player.running ? RUN_MULTIPLIER : 1) * Math.max(0, Math.min(.1, dt));
  const x = player.x + input.dx * step, y = player.y + input.dy * step;
  const valid = (x, y) => allowFall ? clearOfObstacles(x, y, 0, player.mapId) : validPosition(x, y, player.mapId);
  if (valid(x, y)) { player.x = x; player.y = y; }
  else if (valid(x, player.y)) player.x = x;
  else if (valid(player.x, y)) player.y = y;
  if (input.dx || input.dy) {
    player.facing = input.dx - input.dy >= 0 ? 1 : -1;
    const length = Math.hypot(input.dx, input.dy);
    player.aimX = input.dx / length; player.aimY = input.dy / length;
  }
}
export function spawnPlayer(index = 0, mapId = CAMP_MAP) {
  const spawn=getMap(mapId).spawns?.[((index%MAX_PLAYERS)+MAX_PLAYERS)%MAX_PLAYERS];
  if(spawn&&validPosition(spawn.x,spawn.y,mapId))return {...spawn,...restingState(),mapId,mapRevision:0};
  const start = index * Math.PI * 2 / MAX_PLAYERS + 1.5;
  for (let attempt = 0; attempt < 48; attempt++) {
    const angle = start + attempt * .17;
    const radius = 2.5 + Math.floor(attempt / 16) * .6;
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    if (validPosition(x, y, mapId)) return { x, y, ...restingState(), mapId, mapRevision: 0 };
  }
  return { x: 0, y: 2.5, ...restingState(), mapId, mapRevision: 0 };
}

function restingState() {
  return { seatId:null,lastStokeAt:-1, ...presenceDefaults(), lastCallAt: -1, lastCalledAt: -1, sitting: false, crouching: false, moving: false, running: false, jumpAt: -1, landedAt: -1, facing: 1, aimX: Math.SQRT1_2, aimY: -Math.SQRT1_2,
    weapon: 'none', nextShotAt: 0, shotAt: -1, shotAimX: Math.SQRT1_2, shotAimY: -Math.SQRT1_2, hitAt: -1,
    z: 0, vz: 0, vx: 0, vy: 0, thrown: false, motion: 'grounded', respawnAt: 0,
    carrying: null, carriedBy: null, allowCarry: true, emote: null, emoteUntil: 0, bubble: '', bubbleUntil: 0, respawns: 0 };
}
export const onGround = (x, y, mapId = CAMP_MAP) => Math.abs(x) <= getMap(mapId).bounds.edge && Math.abs(y) <= getMap(mapId).bounds.edge;
function clearOfObstacles(x, y, tolerance = 0, mapId = CAMP_MAP) {
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) < getMap(mapId).bounds.state && Math.abs(y) < getMap(mapId).bounds.state &&
    getMap(mapId).obstacles.every(o => Math.hypot(x - o.x, y - o.y) > o.r + .18 - tolerance);
}
export function validPlayerState(p, tolerance = 0) {
  return p && isMap(p.mapId) && Number.isSafeInteger(p.mapRevision) && p.mapRevision >= 0 &&
    (canPlay(p) || (p.weapon === 'none' && !p.carrying && !p.carriedBy && !p.thrown)) && typeof p.id === 'string' && Number.isFinite(p.x) && Number.isFinite(p.y) &&
    (p.seatId===null || (isSeated(p) && Math.hypot(p.x-seatById(p.seatId).x,p.y-seatById(p.seatId).y)<.002 && p.z===.18)) && Number.isFinite(p.lastStokeAt) && p.lastStokeAt>=-1 &&
    isWeapon(p.weapon) && Number.isFinite(p.nextShotAt) && p.nextShotAt >= 0 && Number.isFinite(p.shotAt) && p.shotAt >= -1 && Number.isFinite(p.hitAt) && p.hitAt >= -1 &&
    Number.isFinite(p.shotAimX) && Math.abs(p.shotAimX) <= 1 && Number.isFinite(p.shotAimY) && Math.abs(p.shotAimY) <= 1 &&
    typeof p.running === 'boolean' && Number.isFinite(p.jumpAt) && p.jumpAt >= -1 && Number.isFinite(p.landedAt) && p.landedAt >= -1 &&
    Math.abs(p.x) <= getMap(p.mapId).bounds.state && Math.abs(p.y) <= getMap(p.mapId).bounds.state && Number.isFinite(p.z) && p.z >= -25 && p.z <= MAX_HEIGHT &&
    (p.respawnAt == null || (Number.isFinite(p.respawnAt) && p.respawnAt >= 0)) &&
    Number.isFinite(p.vz) && Math.abs(p.vz) <= 30 &&
    Number.isFinite(p.vx) && Math.abs(p.vx) <= 5 && Number.isFinite(p.vy) && Math.abs(p.vy) <= 5 &&
    typeof p.thrown === 'boolean' && (!p.thrown || p.motion === 'airborne') &&
    Number.isFinite(p.aimX) && Math.abs(p.aimX) <= 1 && Number.isFinite(p.aimY) && Math.abs(p.aimY) <= 1 &&
    ['grounded', 'airborne', 'carried', 'falling', 'respawning'].includes(p.motion) &&
    (p.motion !== 'grounded' || (Math.abs(p.x) <= getMap(p.mapId).bounds.edge + tolerance && Math.abs(p.y) <= getMap(p.mapId).bounds.edge + tolerance && (p.seatId || clearOfObstacles(p.x, p.y, tolerance, p.mapId))));
}
export const { carryChain, canLift, carryTarget, syncCarry, releaseCarry, throwPassenger } = createCarrySystem(spawnPlayer);
/** @param {import('./camp-weapons.mjs').WeaponWorld | null} [weapons] @param {import('./camp-types').FireState | null} [fire] */
export function applyPlayerAction(players, id, action, now, weapons = null, fire = null) {
  const p = players.get(id);
  if (!p) return '아직 캠프장에 연결되지 않았어요.';
  if(action.kind==='seat')return takeSeat(players,p,action.seatId);
  if(action.kind==='add-firewood')return fire?addFirewood(fire,p,now):'모닥불을 준비하고 있어요.';
  if(action.kind==='fire-style')return fire?changeFireStyle(fire,p,action.style):'모닥불을 준비하고 있어요.';
  if (action.kind === 'change-map') {
    const portal=portalFor(p,action);
    if (!portal) return '포탈 가까이에서 다시 상호작용해 주세요.';
    // Detach both sides before resetting this player; upper chains stay in their original map.
    if (p.carriedBy) releaseCarry(players, p);
    if (p.carrying) releaseCarry(players, p, true);
    const social = persistentSocialState(p), allowCarry = p.allowCarry, respawns = p.respawns;
    const mapRevision = p.mapRevision + 1, nextShotAt = p.nextShotAt;
    Object.assign(p, spawnPlayer([...players.keys()].indexOf(id), action.mapId), social, { allowCarry, respawns, mapRevision, nextShotAt });
    const arrival=getMap(action.mapId).portals.find(o=>o.id===portal.arrivalId);
    if(arrival && validPosition(arrival.x+1.9,arrival.y,action.mapId))Object.assign(p,{x:arrival.x+1.9,y:arrival.y});
    if (weapons) weapons.projectiles = weapons.projectiles.filter(shot => shot.owner !== id);
    return null;
  }
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
  if (action.kind === 'lift' && !canPlay(p)) return '친구 들기와 던지기는 놀이터에서 할 수 있어요.';
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
  if(p.seatId && ['jump','emote','posture'].includes(action.kind) && !(action.kind==='posture'&&action.posture==='sitting'))leaveSeat(p);
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
      if(p.seatId && p.connected===false){leaveSeat(p);p.sitting=false;}
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
          Object.assign(p, spawnPlayer([...players.keys()].indexOf(p.id), p.mapId), persistentSocialState(p), { respawns, allowCarry, mapRevision: p.mapRevision });
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
        if (clearOfObstacles(x, y, 0, p.mapId)) { p.x = x; p.y = y; }
        else { p.vx = 0; p.vy = 0; }
      }
      if (!onGround(p.x, p.y, p.mapId) && p.z <= 0 && p.motion !== 'falling') {
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
        if (p.z <= 0 && p.vz <= 0 && onGround(p.x, p.y, p.mapId)) {
          p.z = 0; p.vz = 0; p.vx = 0; p.vy = 0; p.thrown = false; p.motion = 'grounded'; p.landedAt = now;
        }
      }
      if (p.motion === 'grounded' && getMap(p.mapId).trampolines.some(t => Math.hypot(p.x - t.x, p.y - t.y) < t.r)) {
        p.motion = 'airborne'; p.vz = 6.4; p.z = .01; p.jumpAt = -1; p.landedAt = -1; p.sitting = false; p.crouching = false; p.emote = null;
      }
    }
    syncCarry(players);
    if (ball) stepBall(ball, players, dt, getMap(PLAY_MAP).obstacles);
    if (weapons) stepWeapons(weapons, players, dt, now, getMap(PLAY_MAP).obstacles, (p, dx, dy, force, bounce, at) => {
      if (p.hitAt >= 0 && at - p.hitAt < 180) return;
      if (p.carriedBy || p.carrying) releaseCarry(players, p);
      Object.assign(p, { vx: dx * force, vy: dy * force, vz: Math.max(Math.min(p.vz || 0, 3.5), bounce), z: Math.max(.01, p.z),
        motion: 'airborne', thrown: true, hitAt: at, jumpAt: -1, landedAt: -1, sitting: false, crouching: false, running: false, emote: null });
    });
  }
}
