// Historical v8 payload prototype, with frozen v8 broadcast behavior.
// Production v9 measurement: measure-p2p-applied.mjs. Neither uses live sockets.
// Run: node tests/measure-p2p.mjs (Node 24). See docs/p2p-network-benchmark.md.
// Rates exclude RTC/TURN/IP and HTTP traffic; count generated payload, not socket delivery.
import assert from 'node:assert/strict';
import { CampNetwork } from '../lib/camp-network.mjs';
import { PLAYER_FIELDS } from '../lib/camp-snapshot.mjs';
import { spawnPlayer, simulateWorld } from '../lib/camp-world.mjs';
import { emptyWeapons } from '../lib/camp-weapons.mjs';
import { PROTOCOL_VERSION, CommandLedger } from '../lib/camp-protocol.mjs';

const SECONDS = 30, HZ = 15, PEERS = 15;
const bytes = value => Buffer.byteLength(JSON.stringify(value));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function compactFull(world) {
  return ['full', world.v, world.epoch, world.seq, world.now, world.weapons,
    world.players.map(p => PLAYER_FIELDS.map(key => p[key])), world.checkpoint ?? null];
}
function restoreFull(packet) {
  const [, v, epoch, seq, now, weapons, rows, checkpoint] = packet;
  return { t: 'state', v, epoch, seq, now, weapons,
    players: rows.map(row => Object.fromEntries(PLAYER_FIELDS.map((key, index) => [key, row[index]]))),
    ...(checkpoint ? { checkpoint } : {}) };
}

// A deliberately small, lossless binary prototype: schema-ordered arrays, UTF-8,
// float64 numbers and length-prefixed containers. No quantization beyond encodePlayer.
function binaryEncode(value) {
  const chunks = [];
  const tag = n => chunks.push(Buffer.from([n]));
  const length = n => { const b = Buffer.alloc(4); b.writeUInt32LE(n); chunks.push(b); };
  function write(v) {
    if (v === null) return tag(0);
    if (v === false) return tag(1);
    if (v === true) return tag(2);
    if (typeof v === 'number') { assert.ok(Number.isFinite(v)); tag(3); const b = Buffer.alloc(8); b.writeDoubleLE(v); chunks.push(b); return; }
    if (typeof v === 'string') { tag(4); const b = Buffer.from(v); length(b.length); chunks.push(b); return; }
    if (Array.isArray(v)) { tag(5); length(v.length); v.forEach(write); return; }
    assert.ok(v && typeof v === 'object'); tag(6); const entries = Object.entries(v); length(entries.length);
    for (const [key, entry] of entries) { write(key); write(entry); }
  }
  write(value); return Buffer.concat(chunks);
}
function binaryDecode(buffer) {
  let offset = 0;
  const length = () => { const n = buffer.readUInt32LE(offset); offset += 4; return n; };
  function read() {
    const t = buffer[offset++];
    if (t === 0) return null;
    if (t === 1) return false;
    if (t === 2) return true;
    if (t === 3) { const n = buffer.readDoubleLE(offset); offset += 8; return n; }
    if (t === 4) { const size = length(), s = buffer.toString('utf8', offset, offset + size); offset += size; return s; }
    if (t === 5) return Array.from({ length: length() }, read);
    assert.equal(t, 6); const count = length(), result = {};
    for (let i = 0; i < count; i++) { const key = read(); result[key] = read(); }
    return result;
  }
  const value = read(); assert.equal(offset, buffer.length); return value;
}

// Every volatile delta references an independently reliable full checkpoint.
// Never reference the previous volatile frame: dropping it must not break later deltas.
function delta(world, base) {
  const previous = new Map(base.players.map(p => [p.id, p]));
  const changes = [];
  for (const p of world.players) {
    const old = previous.get(p.id);
    const fields = [];
    for (let i = 0; i < PLAYER_FIELDS.length; i++) {
      if (PLAYER_FIELDS[i] !== 'id' && (!old || !equal(p[PLAYER_FIELDS[i]], old[PLAYER_FIELDS[i]]))) fields.push(i, p[PLAYER_FIELDS[i]]);
    }
    if (fields.length || !old) changes.push([p.id, fields]);
    previous.delete(p.id);
  }
  return [world.v, world.epoch, world.seq, world.now, base.seq, changes, [...previous.keys()], equal(world.weapons, base.weapons) ? null : world.weapons];
}
function restore(packet, base) {
  const [v, epoch, seq, now, baseSeq, changes, removed, weapons] = packet;
  assert.equal(baseSeq, base.seq); assert.equal(epoch, base.epoch);
  const players = new Map(base.players.map(p => [p.id, structuredClone(p)]));
  for (const id of removed) players.delete(id);
  for (const [id, fields] of changes) {
    const p = players.get(id) || { id };
    for (let i = 0; i < fields.length; i += 2) p[PLAYER_FIELDS[fields[i]]] = fields[i + 1];
    players.set(id, p);
  }
  return { t: 'state', v, epoch, seq, now, players: [...players.values()], weapons: weapons ?? structuredClone(base.weapons) };
}

function scenario(name, moving, toys = false) {
  let clock = 100_000, base = null, pendingBases = [];
  const players = Array.from({ length: 16 }, (_, i) => ({ id: String(i).padStart(24, '0'), ...spawnPlayer(i), connected: true }));
  const n = Object.assign(Object.create(CampNetwork.prototype), {
    epoch: 1, sequence: 0, hostNow: () => clock, weapons: emptyWeapons(),
    players: new Map(players.map(p => [p.id, p])), chat: [], music: { revision: 0 },
    peers: new Map([['capture', { ready: true }]]), callbacks: {},
    ledger: new CommandLedger(),
  });
  const generate=n.worldMessage.bind(n);n.worldMessage=()=>({...generate(),v:8});
  n.publishWorld=function(reliable=false){
    const value=reliable?this.checkpointMessage():this.worldMessage();
    if(reliable)this.broadcastControl(value);
    else {
      const signature=JSON.stringify({players:value.players,projectiles:value.weapons.projectiles,effects:value.weapons.effects});
      if(signature===this.lastWorldSignature)return;this.lastWorldSignature=signature;
      const frame=JSON.stringify(value);for(const peer of this.peers.values())if(peer.ready)this.send(peer,frame);
    }
  };
  const handle=n.handleCommand.bind(n);n.handleCommand=(sender,action)=>{const result=handle(sender,action);if(result.ok&&!action.kind.startsWith('music-'))n.publishWorld(true);return result;};
  const totals = { current: 0, deltaJson: 0, deltaBinary: 0, compactFullAndDelta: 0, fullCheckpoints: 0, compactCheckpoints: 0 };
  let volatile = 0, checkpoints = 0, roundtrips = 0, missingBase = 0, dropped = 0, resumedAfterDrop = 0, previousDropped = false;
  let currentSecondBytes = 0, peakSecondBytes = 0;
  function capture(world, reliable) {
    const current = bytes(world); totals.current += current; currentSecondBytes += current;
    const compact = JSON.parse(JSON.stringify(compactFull(world))), compactSize = bytes(compact);
    assert.deepEqual(restoreFull(compact), world);
    if (reliable) {
      // Delta-only candidates retain every current reliable JSON checkpoint.
      // The compact-full candidate changes its encoding, not cadence/content.
      pendingBases.push({ world: structuredClone(world), acknowledgeAt: clock + 250 });
      totals.fullCheckpoints += current;
      totals.compactCheckpoints += compactSize;
      totals.compactFullAndDelta += compactSize;
      totals.deltaJson += current; totals.deltaBinary += current; checkpoints++; return;
    }
    volatile++;
    if (!base) { missingBase++; totals.deltaJson += current; totals.deltaBinary += current; totals.compactFullAndDelta += compactSize; return; }
    const packet = delta(world, base), binary = binaryEncode(packet);
    const decoded = binaryDecode(binary);
    assert.deepEqual(decoded, packet);
    assert.deepEqual(restore(decoded, base), world); roundtrips++;
    totals.deltaJson += Math.min(current, bytes(packet));
    totals.deltaBinary += Math.min(current, binary.length);
    totals.compactFullAndDelta += Math.min(compactSize, bytes(packet));
    // Deterministically skip every twentieth volatile packet (5%). Later packets
    // still restore exactly because they reference the checkpoint, not that packet.
    if (volatile % 20 === 0) { dropped++; previousDropped = true; }
    else {
      const restoredAfterSkippingEarlierDeltas = restore(decoded, base);
      assert.deepEqual(restoredAfterSkippingEarlierDeltas, world);
      if (previousDropped) resumedAfterDrop++;
      previousDropped = false;
    }
  }
  n.send = (_peer, frame) => capture(JSON.parse(frame), false);
  n.broadcastControl = value => capture(JSON.parse(JSON.stringify(value)), true);
  for (let frame = 0; frame < SECONDS * HZ; frame++) {
    clock = 100_000 + frame * 1000 / HZ;
    for (const entry of pendingBases) if (entry.acknowledgeAt <= clock) base = entry.world;
    pendingBases = pendingBases.filter(entry => entry.acknowledgeAt > clock);
    const inputs = new Map();
    for (let i = 0; i < moving; i++) {
      // Real simulation; change direction every second, do not manufacture coordinates.
      const angle = Math.floor(frame / HZ) * Math.PI / 2 + i * .31;
      inputs.set(players[i].id, { dx: Math.cos(angle), dy: Math.sin(angle), sitting: false, running: i % 2 === 0 });
      if (toys && frame === 0) n.handleCommand(players[i].id, { kind: 'equip', id: `equip-${i}`, weapon: ['gun', 'snowball', 'bomb'][i % 3] });
      if (toys && frame % 12 === i % 12) {
        // Use actual command handling: successful actions immediately publish a
        // reliable full world in addition to the periodic checkpoint.
        n.handleCommand(players[i].id, { kind: 'fire', id: `${frame}-${i}`, dx: Math.cos(angle), dy: Math.sin(angle) });
      }
    }
    simulateWorld(n.players, inputs, 1 / HZ, clock, n.weapons);
    n.publishWorld(frame % HZ === 0);
    if ((frame + 1) % HZ === 0) { peakSecondBytes = Math.max(peakSecondBytes, currentSecondBytes); currentSecondBytes = 0; }
  }
  const rate = count => Math.round(count * PEERS / SECONDS);
  const saved = count => Math.round(1000 * (1 - count / totals.current)) / 10;
  return { name, movingPlayers: moving, framesPerPeer: { volatile, checkpoints },
    hostStatePayloadBytesPerSecond: { current: rate(totals.current), deltaJson: rate(totals.deltaJson), deltaBinary: rate(totals.deltaBinary), compactFullAndDelta: rate(totals.compactFullAndDelta) },
    reductionPercent: { deltaJson: saved(totals.deltaJson), deltaBinary: saved(totals.deltaBinary), compactFullAndDelta: saved(totals.compactFullAndDelta) },
    checkpointFloorBytesPerSecond: rate(totals.fullCheckpoints), currentPeakOneSecondBytes: peakSecondBytes * PEERS,
    compactCheckpointFloorBytesPerSecond: rate(totals.compactCheckpoints),
    deltaRoundtrips: roundtrips, noBaselineFallbacks: missingBase, skippedVolatilePackets: dropped, successfulUpdatesAfterSkip: resumedAfterDrop };
}

// Explicitly exercise missing baseline/recovery and membership transitions for this prototype.
const initial = { t: 'state', v: PROTOCOL_VERSION, epoch: 2, seq: 1, now: 100, weapons: emptyWeapons(), players: [
  { id: 'a', ...spawnPlayer(), connected: true, moving: false },
] };
const changed = structuredClone(initial); changed.seq = 2; changed.now = 200; changed.players[0].bubble = '안녕 👋';
changed.players.push({ ...structuredClone(changed.players[0]), id: 'b', carrying: null });
assert.deepEqual(restore(binaryDecode(binaryEncode(delta(changed, initial))), initial), changed);
const removed = structuredClone(changed); removed.seq++; removed.players.shift();
assert.deepEqual(restore(delta(removed, changed), changed), removed);
assert.throws(() => restore(delta(changed, initial), { ...initial, seq: 999 }));

const scenarios = [scenario('idle', 0), scenario('one-moving', 1), scenario('four-moving', 4), scenario('all-moving', 16), scenario('four-playing-with-weapons', 4, true), scenario('all-playing-with-weapons', 16, true)];
const relayFanout = [2, 3, 4].map(relays => ({ relays, hostStateFanoutReductionPercent: Math.round(1000 * (1 - relays / PEERS)) / 10,
  maximumRelayStateCopies: Math.ceil((PEERS - relays) / relays), totalDeliveryEdges: PEERS, extraHopForLeafPlayers: 1 }));
console.log(JSON.stringify({ kind: 'offline payload prototype; not live RTC or production implementation',
  parameters: { nodeVersion: process.version, protocolVersion: PROTOCOL_VERSION, seconds: SECONDS, nominalUpdatesHz: HZ, peers: PEERS, periodicCheckpointHz: 1, actionCheckpoints: 'actual handleCommand publishes a full reliable world on every successful action', deltaBaseline: 'latest reliable checkpoint; 250ms receipt delay simulated',
    exclusions: ['RTC/SCTP/DTLS/UDP/IP overhead', 'HTTP lobby', 'inputs/commands/receipts/chat/music', 'join handshake', 'real RTT or packet loss', 'CPU/FPS claims'] },
  scenarios, relayFanout, note: 'Relay numbers are topology arithmetic, not a working relay implementation; they shift upload to other players rather than eliminate total traffic.' }, null, 2));
