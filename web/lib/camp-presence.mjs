import { isMap } from './camp-maps.mjs';
// User-authored presence is independent of physical posture and game input.
export const PRESENCE_LABELS = { available: '대화 가능', working: '작업 중', away: '자리 비움' };
export const presenceDefaults = () => ({ presence: 'available', statusText: '', workText: '', allowCall: true });
/** @returns {import('./camp-types').Presence} */
export const presenceOf = p => ({ presence:p.presence ?? 'available', statusText:p.statusText ?? '', workText:p.workText ?? '', allowCall:p.allowCall ?? true });
export const persistentSocialState = p => ({ ...presenceOf(p), lastStokeAt:p.lastStokeAt??-1, lastCallAt:p.lastCallAt ?? -1, lastCalledAt:p.lastCalledAt ?? -1 });
export const cleanPresenceText = text => text.replace(/[\p{C}]/gu, '').trim();
export function validPresence(p) {
  return !!p && Object.hasOwn(PRESENCE_LABELS, p.presence) && typeof p.statusText === 'string' && p.statusText.length <= 40 &&
    typeof p.workText === 'string' && p.workText.length <= 80 && typeof p.allowCall === 'boolean';
}
export function validChatEntry(e) {
  return !!e && (e.mapId===undefined||isMap(e.mapId)) && typeof e.id === 'string' && e.id.length > 0 && e.id.length <= 64 &&
    typeof e.by === 'string' && e.by.length > 0 && e.by.length <= 64 && typeof e.name === 'string' && e.name.length <= 16 &&
    typeof e.color === 'string' && typeof e.text === 'string' && e.text.length <= 200 && Number.isFinite(e.at) && e.at >= 0 &&
    Number.isSafeInteger(e.createdAt) && e.createdAt > 0 && e.createdAt <= 8640000000000000 &&
    (e.kind === 'chat' || (e.kind === 'call' && typeof e.to === 'string' && e.to.length > 0 && e.to.length <= 64));
}
export function callError(players, history, sender, target, now) {
  const p = players.get(target);
  if (!p || p.connected === false || sender === target) return '호출할 친구가 연결되어 있지 않아요.';
  if (!p.allowCall) return '이 친구는 호출을 받지 않아요.';
  const caller = players.get(sender);
  if ((caller?.lastCallAt >= 0 && now - caller.lastCallAt < 30_000) || (p.lastCalledAt >= 0 && now - p.lastCalledAt < 10_000)) return '잠시 후 다시 불러 주세요.';
  if (history.some(e => e.kind === 'call' && ((e.by === sender && now - e.at < 30_000) || (e.to === target && now - e.at < 10_000)))) return '잠시 후 다시 불러 주세요.';
  return null;
}
