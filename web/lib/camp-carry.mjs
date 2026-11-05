import { canPlay } from './camp-maps.mjs';
import { MAX_PLAYERS, CARRY_GAP, MAX_HEIGHT } from './camp-config.mjs';
import { persistentSocialState } from './camp-presence.mjs';

// The spawn adapter avoids a dependency from carry rules back to the simulation loop.
export function createCarrySystem(spawnPlayer) {
function carryChain(players, root) {
  const chain = [], seen = new Set(); let p = root;
  while (p && !seen.has(p.id) && chain.length < MAX_PLAYERS) {
    chain.push(p); seen.add(p.id); p = players.get(p.carrying);
  }
  return chain;
}
function canLift(players, self, target) {
  if (!self || !target || !canPlay(self) || !canPlay(target) || self.id === target.id || self.connected === false || target.connected === false ||
      self.sitting || target.sitting ||
      self.carrying || self.carriedBy || target.carriedBy || !target.allowCarry ||
      !['grounded', 'airborne'].includes(self.motion) || !['grounded', 'airborne'].includes(target.motion)) return false;
  const chain = carryChain(players, target);
  return !chain.some(p => p.id === self.id) && chain.length < MAX_PLAYERS &&
    self.z + chain.length * CARRY_GAP <= MAX_HEIGHT && Math.hypot(target.x - self.x, target.y - self.y) <= 1.05 && Math.abs(target.z - self.z) <= 1.3;
}
function carryTarget(players, id) {
  const self = players.get(id);
  return [...players.values()].filter(p => canLift(players, self, p))
    .sort((a, b) => Math.hypot(a.x - self.x, a.y - self.y, (a.z - self.z) * .65) - Math.hypot(b.x - self.x, b.y - self.y, (b.z - self.z) * .65) || a.id.localeCompare(b.id))[0] || null;
}
function syncCarry(players) {
  const visited = new Set();
  for (const root of players.values()) if (!root.carriedBy) {
    const chain = carryChain(players, root); visited.add(root.id);
    for (let i = 1; i < chain.length; i++) {
      const p = chain[i], carrier = chain[i - 1];
      if (p.carriedBy !== carrier.id || p.mapId !== carrier.mapId) { carrier.carrying = null; break; }
      Object.assign(p, { x: root.x, y: root.y, z: root.z + CARRY_GAP * i, vz: root.vz, vx: 0, vy: 0, motion: 'carried', thrown: false, facing: root.facing, running: false });
      visited.add(p.id);
    }
  }
  // Broken/cyclic snapshots must never strand a stack outside the root traversal.
  for (const p of players.values()) if (p.carriedBy && !visited.has(p.id)) {
    const parent = players.get(p.carriedBy); if (parent?.carrying === p.id) parent.carrying = null;
    p.carriedBy = null; p.motion = 'airborne'; p.thrown = false; p.vx = 0; p.vy = 0; p.vz = 0;
  }
}
function releaseCarry(players, player, safe = false) {
  const passenger = player.carriedBy ? player : players.get(player.carrying);
  if (!passenger) { player.carrying = null; return; }
  const carrier = players.get(passenger.carriedBy);
  if (carrier?.carrying === passenger.id) carrier.carrying = null;
  if (carrier) Object.assign(passenger, { x: carrier.x, y: carrier.y, z: carrier.z + CARRY_GAP });
  Object.assign(passenger, { carriedBy: null, motion: 'airborne', vz: Math.min(0, passenger.vz || 0), jumpAt: -1, landedAt: -1, running: false, vx: 0, vy: 0, thrown: false });
  if (safe) {
    for (const p of carryChain(players, passenger)) {
      const allowCarry = p.allowCarry, respawns = p.respawns;
      Object.assign(p, spawnPlayer([...players.keys()].indexOf(p.id), p.mapId), persistentSocialState(p), { allowCarry, respawns, mapRevision: p.mapRevision });
    }
  }
}
function throwPassenger(players, carrier) {
  const passenger = players.get(carrier.carrying);
  if (passenger) releaseCarry(players, passenger);
  if (!passenger) return;
  // Release from the current carried height, then follow a short ballistic arc.
  passenger.vx = carrier.aimX * 3.6; passenger.vy = carrier.aimY * 3.6;
  passenger.vz = 2.8; passenger.thrown = true;
  passenger.sitting = false; passenger.crouching = false; passenger.emote = null;
}
  return { carryChain, canLift, carryTarget, syncCarry, releaseCarry, throwPassenger };
}
