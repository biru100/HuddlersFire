import { MAX_PLAYERS } from './camp-config.mjs';

export function normalizeWardrobe(value) {
  return {hairStyle:value?.hairStyle === 1 ? 1 : 0, topStyle:value?.topStyle === 1 ? 1 : 0};
}

// Reliable roster changes only when a peer joins or rejoins. Leave physics snapshots compact.
export function readWardrobeRoster(rows) {
  if (!Array.isArray(rows) || rows.length > MAX_PLAYERS) return null;
  const result = new Map();
  for (const row of rows) {
    if (!Array.isArray(row) || row.length !== 2) return null;
    const [id, style] = row;
    if (typeof id !== 'string' || !id.length || id.length > 64 || result.has(id) ||
        !style || ![0, 1].includes(style.hairStyle) || ![0, 1].includes(style.topStyle)) return null;
    result.set(id, normalizeWardrobe(style));
  }
  return result;
}
