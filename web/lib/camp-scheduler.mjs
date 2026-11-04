// Worker wakeups reduce dependence on throttled Window timers. They cannot bypass OS suspension.
export function startCampTicker(tick, interval = 33) {
  let lastWorkerTick = -Infinity;
  const fallback = setInterval(() => { if (performance.now() - lastWorkerTick > interval * 2) tick(); }, interval);
  let worker;
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
    try {
      const source = new URL('./camp-ticker.worker.mjs?no-inline', import.meta.url);
      // Some SSR bundlers replace import.meta.url with a build-machine file URL.
      const url = source.protocol === 'file:' ? new URL(source.pathname + source.search, window.location.href) : source;
      worker = new Worker(url, { type: 'module' });
      worker.onmessage = () => { lastWorkerTick = performance.now(); tick(); };
      worker.onerror = () => { worker?.terminate(); worker = undefined; };
    } catch { /* Window timer remains available when workers are blocked. */ }
  }
  return () => { clearInterval(fallback); worker?.terminate(); };
}
