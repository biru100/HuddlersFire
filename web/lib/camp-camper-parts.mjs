// The two styles share their face address in both packed atlas layouts.
export const camperStrideRise = [0,1,0,-2/3,0,1,0,-2/3];

export function camperPartCell(part, layer, style, detailed, modular=true) {
  const direction = part.index % 4;
  const step = Math.floor(part.index / 4);
  if (detailed) {
    if (!modular) return [style * 8 + step, (layer === 'body' ? 4 : 0) + direction];
    if (layer === 'body') return [style * 8 + step, direction];
    return [direction * 3 + (layer === 'face' ? 0 : style + 1), 4];
  }
  if (part.group === 8) return [8 + step, style * 4 + direction];
  if (layer === 'face') return [8 + direction, 8 + part.group + step];
  return [(layer === 'body' ? 4 : 0) + direction, (part.group + style) * 2 + step];
}
