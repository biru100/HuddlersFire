// @ts-check
import { HOST_LEASE, RTC_STALE } from './camp-config.mjs';
/** Independent authority health: HTTP liveness alone is not evidence of a working game. */
export class HostCoordinator {
  constructor() {
    this.epoch = 0; this.startedAt = 0;
    /** @type {import('./camp-types').SessionPhase} */ this.phase = 'joining';
    /** @type {Map<number, number>} */ this.sent = new Map();
    /** @type {Map<string, {seq: number, at: number}>} */ this.receipts = new Map();
  }
  /** @param {number} epoch @param {boolean} host @param {number} now @param {boolean} recovering */
  role(epoch, host, now, recovering = false) {
    if (epoch !== this.epoch) { this.epoch = epoch; this.startedAt = now; this.sent.clear(); this.receipts.clear(); }
    this.phase = recovering ? 'recovering' : host ? 'hosting' : 'active';
  }
  /** @param {number} seq @param {number} now */
  checkpoint(seq, now) { this.sent.set(seq, now); if (this.sent.size > 128) this.sent.delete(this.sent.keys().next().value ?? -1); }
  /** @param {string} peer @param {number} epoch @param {number} seq @param {number} now */
  receipt(peer, epoch, seq, now) {
    if (epoch !== this.epoch || !Number.isSafeInteger(seq) || !this.sent.has(seq) || now - (this.sent.get(seq) ?? 0) > RTC_STALE || seq <= (this.receipts.get(peer)?.seq ?? -1)) return false;
    this.receipts.set(peer, { seq, at: now }); return true;
  }
  /** @param {{isHost: boolean, migrating: boolean, lastTick: number, schedulerLagUntil?: number, members: import('./camp-types').Member[], player: string, previousHost?: string}} session @param {number} now */
  canRenew(session, now) {
    if (!session.isHost || session.migrating || this.phase === 'closed' || now - session.lastTick >= 3000 || (session.schedulerLagUntil || 0) > now) return false;
    const others = session.members.filter(m => m.id !== session.player && m.active !== 0);
    if (!others.length || now - this.startedAt < HOST_LEASE) return true;
    return others.some(m => now - (this.receipts.get(m.id)?.at ?? -Infinity) < RTC_STALE);
  }
}
