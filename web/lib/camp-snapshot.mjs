// @ts-check
import { validPlayerState } from './camp-world.mjs';
import { readWeapons, emptyWeapons } from './camp-weapons.mjs';
import { MAX_PLAYERS } from './camp-config.mjs';
import { validPresence, validChatEntry } from './camp-presence.mjs';
import { emptyBall, readBall } from './camp-ball.mjs';
/** @typedef {import('./camp-types').PlayerState} PlayerState */
/** @typedef {import('./camp-types').WorldSnapshot} WorldSnapshot */
/** @typedef {import('./camp-types').RecoveryState} RecoveryState */
/** @type {(keyof PlayerState)[]} */
export const PLAYER_FIELDS = ['id','x','y','z','vx','vy','vz','motion','facing','aimX','aimY','sitting','crouching','moving','running','thrown','carrying','carriedBy','allowCarry','connected','emote','emoteUntil','bubble','bubbleUntil','jumpAt','landedAt','respawns','respawnAt','weapon','nextShotAt','shotAt','shotAimX','shotAimY','hitAt','presence','statusText','workText','allowCall','lastCallAt','lastCalledAt'];
const id = (/** @type {unknown} */ x) => typeof x === 'string' && x.length > 0 && x.length <= 64;
const time = (/** @type {unknown} */ x) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
/** Wire precision never changes authoritative physics. @param {PlayerState} p @returns {PlayerState} */
export function encodePlayer(p) {
  const value = Object.fromEntries(PLAYER_FIELDS.map(key => [key, p[key]]));
  for (const key of ['x','y','z','vx','vy','vz','aimX','aimY','shotAimX','shotAimY']) value[key] = Math.round(Number(value[key]) * 10000) / 10000;
  value.respawnAt ??= 0; value.connected = p.connected !== false; value.moving = !!p.moving;
  return /** @type {PlayerState} */ (value);
}
/** @param {PlayerState[]} players */
function validLinks(players) {
  const map = new Map(players.map(p => [p.id, p]));
  if (map.size !== players.length) return false;
  for (const p of players) {
    if (p.carrying && map.get(p.carrying)?.carriedBy !== p.id) return false;
    if (p.carriedBy && map.get(p.carriedBy)?.carrying !== p.id) return false;
    const seen = new Set(); let next = /** @type {PlayerState | undefined} */ (p);
    while (next) { if (seen.has(next.id)) return false; seen.add(next.id); next = map.get(next.carrying || ''); }
  }
  return true;
}
/** @param {unknown} value @param {number} epoch @returns {WorldSnapshot | null} */
export function decodeSnapshot(value, epoch) {
  const m = /** @type {WorldSnapshot} */ (value);
  if (!m || m.t !== 'state' || m.epoch !== epoch || !Number.isSafeInteger(m.seq) || m.seq < 0 || !time(m.now) || !Array.isArray(m.players) || m.players.length > MAX_PLAYERS) return null;
  const weapons = readWeapons(m.weapons); if (!weapons) return null;
  const ball = readBall(m.ball === undefined ? emptyBall() : m.ball); if (!ball) return null;
  for (const p of m.players) {
    if (!validPresence(p) || ![p.lastCallAt,p.lastCalledAt].every(t=>Number.isFinite(t)&&t>=-1)) return null;
    if (!id(p?.id) || !validPlayerState(p, .001) || !['sitting','crouching','running','thrown','allowCarry'].every(k => typeof p[/** @type {keyof PlayerState} */ (k)] === 'boolean') ||
      (p.carrying !== null && !id(p.carrying)) || (p.carriedBy !== null && !id(p.carriedBy)) ||
      typeof p.bubble !== 'string' || p.bubble.length > 200 || !time(p.emoteUntil) || !time(p.bubbleUntil) || !Number.isSafeInteger(p.respawns) || p.respawns < 0) return null;
    if (![1,-1].includes(p.facing) || (p.emote !== null && !id(p.emote)) || (p.motion === 'carried') !== !!p.carriedBy) return null;
  }
  if (!validLinks(m.players)) return null;
  if (m.checkpoint && ((!id(m.checkpoint.chatId) && m.checkpoint.chatId !== null) || !Number.isSafeInteger(m.checkpoint.musicRevision) || m.checkpoint.musicRevision < 0)) return null;
  return { t: 'state', v: m.v, epoch, seq: m.seq, now: m.now, weapons, ball, players: m.players.map(encodePlayer), ...(m.checkpoint ? { checkpoint: { ...m.checkpoint } } : {}) };
}
/** @param {WorldSnapshot} world @param {import('./camp-types').ChatEntry[]} chat @param {import('./camp-types').MusicState} music @returns {RecoveryState | null} */
export function captureRecovery(world, chat, music) {
  if (!world.checkpoint || !Array.isArray(chat) || chat.length > 100 || !music || music.revision !== world.checkpoint.musicRevision ||
    (chat.at(-1)?.id || null) !== world.checkpoint.chatId || !Array.isArray(music.queue) || music.queue.length > 30 || !time(music.position) || !time(music.anchor)) return null;
  if (chat.some(e => !validChatEntry(e))) return null;
  return structuredClone({ world, chat, music });
}
/** @param {RecoveryState} recovery @param {import('./camp-types').Member[]} members */
export function restoreRecovery(recovery, members) {
  const byId = new Map(members.map(m => [m.id, m]));
  return { players: new Map(recovery.world.players.filter(p => byId.has(p.id)).map(p => { const member = byId.get(p.id); return [p.id, { ...p, name: member?.name, color: member?.color, avatar: member?.avatar, connected: true }]; })),
    weapons: readWeapons(recovery.world.weapons) || emptyWeapons(), ball: readBall(recovery.world.ball) || emptyBall(), chat: structuredClone(recovery.chat), music: structuredClone(recovery.music), now: recovery.world.now };
}
