import { canPlay, MAP_BOUNDS } from './camp-maps.mjs';
// Gameplay-only toy weapons. Positions, trajectories and hits are owned by the room host.
/** @typedef {import('./camp-types').Projectile} Projectile */
/** @typedef {import('./camp-types').WeaponEffect} WeaponEffect */
/** @typedef {import('./camp-types').WeaponWorld} WeaponWorld */
export const WEAPONS = [
  { id: 'gun', label: '총', key: '1', cooldown: 350, speed: 12, lift: 0, lifetime: 550, force: 1.9, bounce: 1.35, radius: .07 },
  { id: 'snowball', label: '눈뭉치', key: '2', cooldown: 650, speed: 4.8, lift: 2.2, lifetime: 1300, force: 2.8, bounce: 2, radius: .14 },
  { id: 'bomb', label: '폭탄', key: '3', cooldown: 1400, speed: 3.6, lift: 3.6, lifetime: 1600, force: 4.5, bounce: 3.1, radius: .15, blast: 1.7 },
];
export const MAX_PROJECTILES = 48;
export const MAX_EFFECTS = 32;
export const isWeapon = id => id === 'none' || WEAPONS.some(w => w.id === id);
export const weaponName = id => WEAPONS.find(w => w.id === id)?.label || '맨손';
/** @returns {WeaponWorld} */
export const emptyWeapons = () => ({ projectiles: [], effects: [], sequence: 0, at: 0 });

export function applyWeaponAction(state, players, id, action, now) {
  const p = players.get(id);
  if (!p || p.connected === false) return '연결을 확인해 주세요.';
  if (!canPlay(p) && !(action.kind === 'equip' && action.weapon === 'none')) return '장난감은 놀이터에서 사용할 수 있어요.';
  if (!['grounded', 'airborne'].includes(p.motion) || p.carriedBy || p.thrown) return '발을 디딘 뒤 사용해 주세요.';
  if (action.kind === 'equip') {
    if (!isWeapon(action.weapon)) return '장난감을 확인해 주세요.';
    p.weapon = action.weapon; return null;
  }
  const weapon = WEAPONS.find(w => w.id === p.weapon);
  if (!weapon || !state) return '먼저 장난감을 골라 주세요.';
  if (p.carrying) return '친구를 내려놓은 뒤 사용해 주세요.';
  if (now < p.nextShotAt) return '잠깐 기다렸다가 사용해 주세요.';
  if (state.projectiles.length >= MAX_PROJECTILES || state.projectiles.filter(s => s.owner === id).length >= 4) return '날아간 장난감이 돌아오길 기다려 주세요.';
  const length = Math.hypot(action.dx, action.dy);
  if (!Number.isFinite(length) || length < .01 || Math.abs(action.dx) > 1 || Math.abs(action.dy) > 1) return '방향을 확인해 주세요.';
  const dx = action.dx / length, dy = action.dy / length;
  p.nextShotAt = now + weapon.cooldown; p.shotAt = now; p.shotAimX = dx; p.shotAimY = dy;
  p.sitting = false; p.crouching = false; p.emote = null;
  state.projectiles.push({ id: action.id, owner: id, weapon: weapon.id, x: p.x + dx * .08, y: p.y + dy * .08,
    z: (p.z || 0) + .65, vx: dx * weapon.speed, vy: dy * weapon.speed, vz: weapon.lift,
    bornAt: now, expiresAt: now + weapon.lifetime });
  state.at = now;
  return null;
}

// First intersection with a swept circle; fast bullets cannot skip over small targets.
export function segmentCircle(x0, y0, x1, y1, cx, cy, radius) {
  const dx = x1 - x0, dy = y1 - y0, ox = x0 - cx, oy = y0 - cy;
  const a = dx * dx + dy * dy, c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  if (a < 1e-12) return null;
  const b = 2 * (ox * dx + oy * dy), disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}
function effect(state, shot, kind, now, radius = 0) {
  state.effects.push({ id: `fx:${++state.sequence}`, weapon: shot.weapon, kind, x: shot.x, y: shot.y, z: Math.max(0, shot.z),
    at: now, expiresAt: now + (kind === 'explosion' ? 650 : 420), radius });
  if (state.effects.length > MAX_EFFECTS) state.effects.splice(0, state.effects.length - MAX_EFFECTS);
}
const hittable = p => canPlay(p) && p.connected !== false && ['grounded', 'airborne', 'carried'].includes(p.motion);

export function stepWeapons(state, players, dt, now, obstacles, onHit) {
  state.at = now;
  state.effects = state.effects.filter(e => e.expiresAt > now);
  const keep = [];
  for (const shot of state.projectiles) {
    const weapon = WEAPONS.find(w => w.id === shot.weapon);
    if (!weapon || !canPlay(players.get(shot.owner)) || players.get(shot.owner).connected === false) continue;
    if (now >= shot.expiresAt) {
      if (weapon.id === 'bomb') {
        effect(state, shot, 'explosion', now, weapon.blast);
        for (const p of players.values()) {
          if (!hittable(p)) continue;
          const dx = p.x - shot.x, dy = p.y - shot.y, distance = Math.hypot(dx, dy, p.z + .35 - shot.z);
          if (distance > weapon.blast || obstacles.some(o => segmentCircle(shot.x, shot.y, p.x, p.y, o.x, o.y, o.r) !== null)) continue;
          const length = Math.hypot(dx, dy), strength = weapon.force * Math.max(.35, 1 - distance / weapon.blast * .5);
          onHit(p, length > .01 ? dx / length : Math.SQRT1_2, length > .01 ? dy / length : -Math.SQRT1_2, strength, weapon.bounce, now, weapon.id);
        }
      }
      continue;
    }
    const x = shot.x + shot.vx * dt, y = shot.y + shot.vy * dt;
    const vz = weapon.id === 'gun' ? 0 : shot.vz - 8 * dt, z = shot.z + vz * dt;
    if (Math.abs(x) > MAP_BOUNDS.projectile || Math.abs(y) > MAP_BOUNDS.projectile) continue;
    let first = 2, target = null;
    for (const o of obstacles) {
      const t = segmentCircle(shot.x, shot.y, x, y, o.x, o.y, o.r + weapon.radius);
      if (t !== null && t < first) { first = t; target = null; }
    }
    if (weapon.id !== 'bomb') for (const p of players.values()) {
      if (p.id === shot.owner || !hittable(p)) continue;
      const t = segmentCircle(shot.x, shot.y, x, y, p.x, p.y, .28 + weapon.radius);
      const height = t === null ? -100 : shot.z + (z - shot.z) * t;
      if (t !== null && t < first && height >= p.z + .04 && height <= p.z + 1.35) { first = t; target = p; }
    }
    if (first <= 1) {
      shot.x += (x - shot.x) * first; shot.y += (y - shot.y) * first; shot.z += (z - shot.z) * first;
      if (weapon.id === 'bomb') { shot.vx = 0; shot.vy = 0; shot.vz = vz; shot.z = Math.max(0, z); keep.push(shot); }
      else {
        effect(state, shot, weapon.id === 'snowball' ? 'snow' : 'spark', now);
        if (target) onHit(target, shot.vx / weapon.speed, shot.vy / weapon.speed, weapon.force, weapon.bounce, now, weapon.id);
      }
    } else {
      Object.assign(shot, { x, y, z: Math.max(0, z), vz });
      if (z <= 0) {
        if (weapon.id === 'bomb') { shot.vx = 0; shot.vy = 0; shot.vz = 0; keep.push(shot); }
        else effect(state, shot, weapon.id === 'snowball' ? 'snow' : 'spark', now);
      } else keep.push(shot);
    }
  }
  state.projectiles = keep;
}

// A bounded snapshot is validated before replacing client state. Never trust arbitrary extra fields.
export function readWeapons(value) {
  if (value == null) return emptyWeapons();
  if (!Array.isArray(value.projectiles) || value.projectiles.length > MAX_PROJECTILES || !Array.isArray(value.effects) || value.effects.length > MAX_EFFECTS || (value.at != null && (!Number.isFinite(value.at) || value.at < 0))) return null;
  const position = p => [p?.x, p?.y, p?.z].every(Number.isFinite) && Math.abs(p.x) <= MAP_BOUNDS.projectile+.25 && Math.abs(p.y) <= MAP_BOUNDS.projectile+.25 && p.z >= 0 && p.z <= 34;
  const id = s => typeof s === 'string' && s.length > 0 && s.length <= 96;
  const projectiles = [], effects = [];
  for (const p of value.projectiles) {
    if (!position(p) || !id(p.id) || !id(p.owner) || !WEAPONS.some(w => w.id === p.weapon) || ![p.vx, p.vy, p.vz, p.bornAt, p.expiresAt].every(Number.isFinite) || Math.abs(p.vx) > 12 || Math.abs(p.vy) > 12 || Math.abs(p.vz) > 30 || p.bornAt < 0 || p.expiresAt < p.bornAt || p.expiresAt - p.bornAt > 2000) return null;
    projectiles.push({ id: p.id, owner: p.owner, weapon: p.weapon, x: p.x, y: p.y, z: p.z, vx: p.vx, vy: p.vy, vz: p.vz, bornAt: p.bornAt, expiresAt: p.expiresAt });
  }
  for (const e of value.effects) {
    if (!position(e) || !id(e.id) || !WEAPONS.some(w => w.id === e.weapon) || !['spark', 'snow', 'explosion'].includes(e.kind) || ![e.at, e.expiresAt, e.radius].every(Number.isFinite) || e.at < 0 || e.expiresAt < e.at || e.expiresAt - e.at > 700 || e.radius < 0 || e.radius > 1.7) return null;
    effects.push({ id: e.id, weapon: e.weapon, kind: e.kind, x: e.x, y: e.y, z: e.z, at: e.at, expiresAt: e.expiresAt, radius: e.radius });
  }
  return { projectiles, effects, sequence: 0, at: value.at ?? 0 };
}
