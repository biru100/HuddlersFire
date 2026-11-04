// Personal session time uses monotonic elapsed time, never the number of UI timer callbacks.
export class WorkClock {
  constructor() { this.total = 0; this.started = null; }
  setWorking(working, now) {
    if (working && this.started === null) this.started = now;
    if (!working && this.started !== null) { this.total += Math.max(0, now - this.started); this.started = null; }
  }
  read(now) { return this.total + (this.started === null ? 0 : Math.max(0, now - this.started)); }
  reset() { this.total = 0; this.started = null; }
}
export function formatDuration(milliseconds) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
}
