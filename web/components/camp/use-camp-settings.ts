'use client';
import { useSyncExternalStore, type SetStateAction } from 'react';
import { DEFAULT_SETTINGS, normalizeSettings, readSettings, saveSettings } from '@/lib/camp-settings.mjs';

type Settings = typeof DEFAULT_SETTINGS;
let snapshot: Settings = { ...DEFAULT_SETTINGS }, raw: string | null | undefined;
const listeners = new Set<() => void>();
function getSnapshot(): Settings {
  try {
    const next = localStorage.getItem('huddlers-fire-settings');
    if (raw !== next) { raw = next; snapshot = readSettings(localStorage); }
  } catch { /* Use the in-memory preferences when storage is unavailable. */ }
  return snapshot;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const changed = (event: StorageEvent) => { if (event.key === null || event.key === 'huddlers-fire-settings') listener(); };
  window.addEventListener('storage', changed);
  return () => { listeners.delete(listener); window.removeEventListener('storage', changed); };
}
function updateSettings(update: SetStateAction<Settings>) {
  snapshot = normalizeSettings(typeof update === 'function' ? update(getSnapshot()) : update);
  try { saveSettings(localStorage, snapshot); raw = localStorage.getItem('huddlers-fire-settings'); } catch { /* Keep the in-memory preferences. */ }
  for (const listener of listeners) listener();
}
const getServerSnapshot = () => DEFAULT_SETTINGS;
export function useCampSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [settings, updateSettings] as const;
}
