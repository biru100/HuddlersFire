// Keep the newest bubbles when the viewport cannot fit every speaker.
// Complete messages remain available in the chat log.
export function layoutBubbles(candidates, bounds) {
  const placed = [], gap = 8;
  for (const item of [...candidates].sort((a, b) => b.until - a.until || a.id.localeCompare(b.id))) {
    const { width, height } = item;
    if (width > bounds.right - bounds.left || height > bounds.bottom - bounds.top) continue;
    const x = Math.max(bounds.left, Math.min(bounds.right - width, item.anchorX - width / 2));
    const y = Math.max(bounds.top, Math.min(bounds.bottom - height, item.anchorY - height - 10));
    const xs = [x, bounds.left, bounds.right - width];
    const ys = [y, bounds.top, bounds.bottom - height, ...placed.flatMap(p => [p.y + p.height + gap, p.y - height - gap])];
    const choices = xs.flatMap(left => ys.map(top => ({ x: left, y: top })))
      .filter(p => p.y >= bounds.top && p.y + height <= bounds.bottom && placed.every(other =>
        p.x + width + gap <= other.x || other.x + other.width + gap <= p.x ||
        p.y + height + gap <= other.y || other.y + other.height + gap <= p.y))
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    if (choices.length) placed.push({ ...item, ...choices[0] });
  }
  return placed;
}
