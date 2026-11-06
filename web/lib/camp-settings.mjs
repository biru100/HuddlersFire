import { normalizeTheme } from './camp-theme.mjs';
export const DEFAULT_SETTINGS = { theme: 'color', effectsVolume: .25, musicVolume: 40, musicMuted: false, allowCarry: true };
const volume = (value, fallback, max) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : fallback;
export function normalizeSettings(value) {
  const v = value && typeof value === 'object' ? value : {};
  return { theme: normalizeTheme(v.theme), effectsVolume: volume(v.effectsVolume, volume(v.forestVolume, DEFAULT_SETTINGS.effectsVolume, 1), 1), musicVolume: volume(v.musicVolume, 40, 100),
    // Legacy listening=false was the default, not an explicit mute preference.
    musicMuted: typeof v.musicMuted === 'boolean' ? v.musicMuted : false,
    allowCarry: typeof v.allowCarry === 'boolean' ? v.allowCarry : true };
}
export function readSettings(storage) {
  try { return normalizeSettings(JSON.parse(storage.getItem('huddlers-fire-settings'))); }
  catch { return { ...DEFAULT_SETTINGS }; }
}
export function saveSettings(storage, settings) {
  try { storage.setItem('huddlers-fire-settings', JSON.stringify(normalizeSettings(settings))); } catch { /* Private browsing may disable storage. */ }
}
