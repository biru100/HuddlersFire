const gap = 8;
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

// In each candidate column, the gaps between obstacles are the available rows.
function closestPosition(item, height, bounds, occupied, columns) {
  const maxX = bounds.right - item.width, maxY = bounds.bottom - height;
  if (maxX < bounds.left || maxY < bounds.top) return null;
  const x = clamp(item.anchorX - item.width / 2, bounds.left, maxX);
  const y = clamp(item.anchorY - height - 10, bounds.top, maxY);
  let best = null, distance = Infinity;
  for (const left of new Set([x, bounds.left, maxX, ...columns])) {
    const dx = (left - x) ** 2;
    if (left < bounds.left || left > maxX || dx >= distance) continue;
    let top = bounds.top;
    function consider(bottom) {
      if (top > bottom) return;
      const row = clamp(y, top, bottom);
      const score = dx + (row - y) ** 2;
      if (score < distance) {
        distance = score;
        best = { x: left, y: row };
      }
    }
    for (const box of occupied) {
      if (left + item.width + gap <= box.x || left >= box.x + box.width + gap) continue;
      consider(Math.min(maxY, box.y - gap - height));
      top = Math.max(top, box.y + box.height + gap);
      if (top > maxY) break;
    }
    consider(maxY);
  }
  return best;
}

// Full messages remain in the chat log when a field bubble is shortened or omitted.
export function layoutBubbles(candidates, bounds, { mobile = false, obstacles = [], limit = Infinity } = {}) {
  const recent = [...candidates].sort((a, b) =>
    (mobile && Number(a.id === '__radio__') - Number(b.id === '__radio__')) ||
    b.until - a.until || a.id.localeCompare(b.id));
  const crowded = mobile && recent.filter(item => item.id !== '__radio__').length > limit;
  const occupied = obstacles.filter(box => box.width > 0 && box.height > 0 &&
    box.x < bounds.right + gap && box.x + box.width > bounds.left - gap &&
    box.y < bounds.bottom + gap && box.y + box.height > bounds.top - gap);
  const placed = [];
  for (const item of recent) {
    const columns = mobile ? occupied.flatMap(box => [box.x - item.width - gap, box.x + box.width + gap]) : [];
    occupied.sort((a, b) => a.y - b.y);
    let compact = crowded;
    let height = compact ? 28 : item.height;
    let position = closestPosition(item, height, bounds, occupied, columns);
    if (!position && mobile && !compact) {
      compact = true;
      height = 28;
      position = closestPosition(item, height, bounds, occupied, columns);
    }
    if (!position) continue;
    const box = { ...item, ...position, height, compact };
    placed.push(box);
    occupied.push(box);
    if (placed.length >= limit) break;
  }
  return placed;
}
