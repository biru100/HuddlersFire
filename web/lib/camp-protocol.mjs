import { EMOTES } from './camp-world.mjs';
export const PROTOCOL_VERSION = 2;
export const MAX_FRAME_BYTES = 48_000;
export function validAction(a) {
  if (!a || typeof a.id !== 'string' || a.id.length > 64 || !a.id.length) return false;
  switch (a.kind) {
    case 'posture': return ['standing', 'sitting', 'crouching'].includes(a.posture);
    case 'emote': return EMOTES.some(e => e.id === a.emote);
    case 'lift': return a.target === null || (typeof a.target === 'string' && a.target.length <= 64);
    case 'escape': return true;
    case 'allow-carry': return typeof a.allow === 'boolean';
    case 'chat': return typeof a.text === 'string' && a.text.trim().length > 0 && a.text.length <= 200;
    case 'music-add': return typeof a.url === 'string' && a.url.length <= 500;
    case 'music-control': return ['play', 'pause', 'skip', 'remove', 'sync'].includes(a.op) &&
      (a.currentId == null || (typeof a.currentId === 'string' && a.currentId.length <= 64)) &&
      (a.op !== 'remove' || (typeof a.track === 'string' && a.track.length <= 64));
    default: return false;
  }
}
// Drop control characters and bidi overrides; text remains plain text throughout React and Canvas.
export const chatText = text => text.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ').trim();
export class CommandLedger {
  constructor() { this.results = new Map(); this.buckets = new Map(); this.last = new Map(); }
  cached(sender, id) { return this.results.get(sender)?.get(id); }
  record(sender, id, result) {
    if (!this.results.has(sender)) this.results.set(sender, new Map());
    const entries = this.results.get(sender); entries.set(id, result);
    if (entries.size > 128) entries.delete(entries.keys().next().value);
  }
  permit(sender, kind, now) {
    const b = this.buckets.get(sender) || { at: now, tokens: 30 };
    b.tokens = Math.min(30, b.tokens + Math.max(0, now - b.at) * .02); b.at = now;
    this.buckets.set(sender, b);
    if (b.tokens < 1) return false;
    b.tokens--;
    const interval = { chat: 1000, emote: 1000, lift: 250, 'music-add': 1000 }[kind] || 0;
    const key = sender + ':' + kind;
    if (now - (this.last.get(key) ?? -Infinity) < interval) return false;
    this.last.set(key, now); return true;
  }
  forget(sender) {
    this.results.delete(sender); this.buckets.delete(sender);
    for (const key of this.last.keys()) if (key.startsWith(sender + ':')) this.last.delete(key);
  }
}
