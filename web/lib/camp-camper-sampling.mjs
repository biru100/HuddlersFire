import {createSpriteSurface} from './camp-sprite-assets.mjs';

const expandedTiles = new Map();
const expandedLimit = 64;

// Apply the same display transform to the layers of one character. The camera
// and hit areas keep their continuous coordinates.
const aligned = n => Math.abs(n-Math.round(n)) < 1e-6;
export function camperDisplay(ctx, detailDensity) {
  const {a,b,c,d,e,f} = ctx.getTransform();
  const x = Math.hypot(a,b), y = Math.hypot(c,d);
  const axisAligned = b === 0 && c === 0 && a !== 0 && d !== 0;
  if (axisAligned && x >= detailDensity && y >= detailDensity &&
      aligned(x/detailDensity) && aligned(y/detailDensity)) {
    ctx.translate((Math.round(e)-e)/a, (Math.round(f)-f)/d);
  }
  return Math.min(x,y);
}

export function camperFilter(scale, density) {
  const ratio = scale/density;
  if (ratio < 1-1e-6) return 'area';
  return aligned(ratio) ? 'nearest' : 'edge';
}

function halfSize(ctx, image) {
  const width = image.width/2, height = image.height/2;
  const surface = createSpriteSurface(ctx,width,height), target = surface.getContext('2d');
  const source = image.getContext('2d').getImageData(0,0,image.width,image.height).data;
  const pixels = target.createImageData(width,height), data = pixels.data;
  const stride = image.width*4;
  for (let y=0; y<height; y++) for (let x=0; x<width; x++) {
    const start = y*2*stride+x*8;
    const otherRow = start+stride;
    const a = source[start+3], b = source[start+7], c = source[otherRow+3], d = source[otherRow+7];
    const alpha = a+b+c+d, out = (y*width+x)*4;
    if (!alpha) continue;
    for (let ch=0; ch<3; ch++) {
      data[out+ch] = (source[start+ch]*a+source[start+4+ch]*b+
        source[otherRow+ch]*c+source[otherRow+4+ch]*d)/alpha;
    }
    data[out+3] = alpha/4;
  }
  target.putImageData(pixels,0,0);
  return surface;
}

// Prepared levels are attached to existing frame caches and reused across viewports.
// Prefilter isolated tiles so a neighbour in the atlas cannot leak into a layer.
export function camperImage(ctx, part, filter, ratio, recording) {
  const {image} = part;
  if (filter === 'area') {
    const levels = part.reduced ??= [image];
    let current = image;
    for (let level=1; ratio<=.5 && !(current.width%2 || current.height%2); level++) {
      current = levels[level] ??= halfSize(ctx,current);
      ratio *= 2;
    }
    return current;
  }
  // Canvas has no shader. Duplicate the native texels first, then let its
  // linear sampler interpolate across the narrower boundaries.
  if (filter !== 'edge' || recording || image.width>64) return image;
  const factor = Math.min(3,Math.ceil(ratio));
  let expanded = expandedTiles.get(image);
  expandedTiles.delete(image);
  if (expanded?.factor !== factor) {
    const surface = createSpriteSurface(ctx,image.width*factor,image.height*factor);
    const copy = surface.getContext('2d');
    copy.imageSmoothingEnabled = false;
    copy.drawImage(image,0,0,surface.width,surface.height);
    expanded = {factor,surface};
  }
  expandedTiles.set(image,expanded);
  if(expandedTiles.size>expandedLimit) expandedTiles.delete(expandedTiles.keys().next().value);
  return expanded.surface;
}
