// @ts-check
import { isMap, MAP_TRAVEL_COOLDOWN } from './camp-maps.mjs';
import { EMOTES } from './camp-world.mjs';
import { isWeapon } from './camp-weapons.mjs';
import { validPresence } from './camp-presence.mjs';
import { fireStyle } from './camp-fire.mjs';
// v18: illustrated scene layout and taller sprite carry spacing share one physics contract.
export const PROTOCOL_VERSION = 19;
export const MAX_FRAME_BYTES = 48_000;
/** @typedef {import('./camp-types').CampAction} CampAction */
/** @typedef {{ok:boolean,error?:string}} CommandResult */
/** @param {unknown} value @returns {value is CampAction} */
export function validAction(value) {
  const a = /** @type {CampAction} */ (value);
  if (!a || typeof a.id !== 'string' || a.id.length > 64 || !a.id.length) return false;
  switch (a.kind) {
    case 'seat': return typeof a.seatId==='string'&&/^log-[0-7]-[01]$/.test(a.seatId);
    case 'add-firewood': return true;
    case 'fire-style': return !!fireStyle(a.style);
    case 'change-map': return isMap(a.mapId) && typeof a.portalId==='string' && a.portalId.length>0 && a.portalId.length<=64 && Number.isSafeInteger(a.mapRevision) && a.mapRevision>=0;
    case 'presence': return validPresence(a);
    case 'call': return typeof a.target === 'string' && a.target.length > 0 && a.target.length <= 64;
    case 'posture': return ['standing', 'sitting', 'crouching'].includes(a.posture);
    case 'emote': return EMOTES.some(e => e.id === a.emote);
    case 'lift': return a.target === null || (typeof a.target === 'string' && a.target.length <= 64);
    case 'escape': return true;
    case 'jump': return true;
    case 'equip': return isWeapon(a.weapon);
    case 'fire': return Number.isFinite(a.dx) && Number.isFinite(a.dy) && Math.abs(a.dx) <= 1 && Math.abs(a.dy) <= 1 && Math.hypot(a.dx, a.dy) >= .01;
    case 'allow-carry': return typeof a.allow === 'boolean';
    case 'chat': return typeof a.text === 'string' && a.text.trim().length > 0 && a.text.length <= 200;
    case 'music-add': return typeof a.url === 'string' && a.url.length <= 500 &&
      (a.title == null || (typeof a.title === 'string' && a.title.length <= 160));
    case 'music-control': return ['play', 'pause', 'skip', 'remove', 'sync'].includes(a.op) &&
      (a.currentId == null || (typeof a.currentId === 'string' && a.currentId.length <= 64)) &&
      (a.op !== 'remove' || (typeof a.track === 'string' && a.track.length <= 64));
    default: return false;
  }
}
// Drop control characters and bidi overrides; text remains plain text throughout React and Canvas.
export const chatText = (/** @type {string} */ text) => text.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ').trim();
export class CommandLedger {
  constructor() {
    /** @type {Map<string,Map<string,CommandResult>>} */ this.results = new Map();
    /** @type {Map<string,{at:number,tokens:number}>} */ this.buckets = new Map();
    /** @type {Map<string,number>} */ this.last = new Map();
  }
  /** @param {string} sender @param {string} id */
  cached(sender, id) { return this.results.get(sender)?.get(id); }
  /** @param {string} sender @param {string} id @param {CommandResult} result */
  record(sender, id, result) {
    let entries = this.results.get(sender); if (!entries) { entries = new Map(); this.results.set(sender, entries); }
    entries.set(id, result);
    const oldest = entries.keys().next().value; if (entries.size > 128 && oldest !== undefined) entries.delete(oldest);
  }
  /** @param {string} sender @param {string} kind @param {number} now */
  permit(sender, kind, now) {
    const b = this.buckets.get(sender) || { at: now, tokens: 30 };
    b.tokens = Math.min(30, b.tokens + Math.max(0, now - b.at) * .02); b.at = now;
    this.buckets.set(sender, b);
    if (b.tokens < 1) return false;
    b.tokens--;
    // Attempts are throttled briefly; only successful wood contributions start the ten-minute world cooldown.
    /** @type {Record<string,number>} */ const intervals = { seat:250, 'add-firewood':250, 'fire-style':500, 'change-map': MAP_TRAVEL_COOLDOWN, presence: 500, call: 30000, chat: 1000, emote: 1000, lift: 250, jump: 250, equip: 100, fire: 100, 'music-add': 1000 };
    const interval = intervals[kind] || 0;
    const key = sender + ':' + kind;
    if (now - (this.last.get(key) ?? -Infinity) < interval) return false;
    this.last.set(key, now); return true;
  }
  /** @param {string} sender */
  forget(sender) {
    this.results.delete(sender); this.buckets.delete(sender);
    for (const key of this.last.keys()) if (key.startsWith(sender + ':')) this.last.delete(key);
  }
}
