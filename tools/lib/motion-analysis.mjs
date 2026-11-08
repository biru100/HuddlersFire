// Decoded-pixel measurements and CSS-only review. Never exports edited frame PNGs.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire(new URL('../../web/package.json', import.meta.url));
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const round = x => Math.round(x * 1000) / 1000;
const vector = (a, b) => a && b ? a.map((x, i) => round(x - b[i])) : null;
const sha = b => createHash('sha256').update(b).digest('hex');
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

function region(data, w, h, { threshold = 1, x0 = 0, x1 = w, y0 = 0, y1 = h } = {}) {
  let left = w, top = h, right = -1, bottom = -1, mass = 0, sx = 0, sy = 0, count = 0;
  for (let y = Math.max(0, Math.floor(y0)); y < Math.min(h, Math.ceil(y1)); y++) {
    for (let x = Math.max(0, Math.floor(x0)); x < Math.min(w, Math.ceil(x1)); x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha < threshold) continue;
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      mass += alpha; sx += x * alpha; sy += y * alpha; count++;
    }
  }
  return { bounds: count ? [left, top, right - left + 1, bottom - top + 1] : null, centroid: mass ? [round(sx / mass), round(sy / mass)] : null, count };
}

function shoeSplit(data, w, h, bounds) {
  if (!bounds) return w / 2;
  const counts = new Uint32Array(w); let left = w, right = -1;
  for (let y = Math.floor(bounds[1] + bounds[3] * .91); y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, [r, g, b, a] = data.subarray(i, i + 4);
    if (a >= 128 && r > 45 && r > g * 1.2 && g > b * 1.1) { counts[x]++; left = Math.min(left, x); right = Math.max(right, x); }
  }
  if (right < left) return bounds[0] + bounds[2] / 2;
  let split = Math.round((left + right) / 2);
  for (let x = Math.floor(left + (right - left) * .4); x <= left + (right - left) * .65; x++) {
    if (counts[x] < counts[split] || counts[x] === counts[split] && Math.abs(x - (left + right) / 2) < Math.abs(split - (left + right) / 2)) split = x;
  }
  return split;
}

function soleProxy(data, w, h, bounds, side, split) {
  if (!bounds) return null;
  const [x, y, width, height] = bounds;
  const area = region(data, w, h, { threshold: 128, x0: side === 0 ? x : split, x1: side === 0 ? split : x + width, y0: y + height * .78 });
  if (!area.bounds) return null;
  let bottom = area.bounds[1] + area.bounds[3] - 1;
  for (let row = bottom; row >= area.bounds[1]; row--) {
    const support = region(data, w, h, { threshold: 128, x0: side === 0 ? x : split, x1: side === 0 ? split : x + width, y0: row, y1: row + 1 });
    if (support.count >= Math.max(3, Math.floor(width * .02))) { bottom = row; break; }
  }
  // Lowest three occupied rows in the lower 22%, split by silhouette midpoint.
  // This is an image-space support proxy, not a semantic/anatomical foot label.
  const contact = region(data, w, h, { threshold: 128, x0: side === 0 ? x : split, x1: side === 0 ? split : x + width, y0: bottom - 2, y1: bottom + 1 });
  return { anchor: [contact.centroid[0], bottom], supportBounds: contact.bounds, samples: contact.count };
}

function describe(data, w, h, index, footSplitX) {
  const full = region(data, w, h), core = region(data, w, h, { threshold: 128 });
  const alpha = { transparent: 0, soft: 0, opaque: 0 }, histogram = new Uint32Array(256);
  for (let i = 3; i < data.length; i += 4) { alpha[data[i] === 0 ? 'transparent' : data[i] === 255 ? 'opaque' : 'soft']++; histogram[data[i]]++; }
  const b = core.bounds;
  const split = footSplitX ?? shoeSplit(data, w, h, b);
  const screenLeft = soleProxy(data, w, h, b, 0, split), screenRight = soleProxy(data, w, h, b, 1, split);
  const feetMidpoint = screenLeft && screenRight ? screenLeft.anchor.map((x, i) => round((x + screenRight.anchor[i]) / 2)) : null;
  const body = b ? region(data, w, h, { threshold: 128, y0: b[1] + b[3] * .35, y1: b[1] + b[3] * .68 }) : null;
  const touches = bounds => bounds ? bounds[0] === 0 || bounds[1] === 0 || bounds[0] + bounds[2] === w || bounds[1] + bounds[3] === h : false;
  return { frame: index + 1, cellOrigin: [index % 2 * w, Math.floor(index / 2) * h], bounds: full.bounds, coreBounds: b, alpha,
    alphaHistogram: Object.fromEntries(Array.from(histogram.entries()).filter(([, count]) => count)),
    centroid: full.centroid, bodyCenterProxy: body?.centroid ?? null,
    feet: { screenLeft, screenRight, splitX: split, midpoint: feetMidpoint, pairVector: screenLeft && screenRight ? vector(screenRight.anchor, screenLeft.anchor) : null },
    touchesCellBoundary: touches(b), faintAlphaAtCellBoundary: touches(full.bounds) && !touches(b) };
}

function premultiply(data) {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    out[i] = Math.round(data[i] * a / 255); out[i + 1] = Math.round(data[i + 1] * a / 255); out[i + 2] = Math.round(data[i + 2] * a / 255); out[i + 3] = a;
  }
  return out;
}

// Shift B by (dx,dy) to compare to A. Translation never mutates or saves pixels.
export function compareFrames(a, b, w, h, dx = 0, dy = 0, step = 1, band = null) {
  let union = 0, intersection = 0, changed = 0, significant = 0, difference = 0;
  const x0 = Math.min(0, dx), x1 = Math.max(w, w + dx), y0 = Math.min(0, dy), y1 = Math.max(h, h + dy);
  for (let y = y0; y < y1; y += step) {
    if (band && (y < band[0] || y >= band[1])) continue;
    for (let x = x0; x < x1; x += step) {
      const ai = x >= 0 && x < w && y >= 0 && y < h ? (y * w + x) * 4 : -1;
      const bx = x - dx, by = y - dy, bi = bx >= 0 && bx < w && by >= 0 && by < h ? (by * w + bx) * 4 : -1;
      const aa = ai < 0 ? 0 : a[ai + 3], ba = bi < 0 ? 0 : b[bi + 3];
      if (!aa && !ba) continue;
      union++; if (aa && ba) intersection++;
      let delta = 0;
      for (let c = 0; c < 4; c++) delta += Math.abs((ai < 0 ? 0 : a[ai + c]) - (bi < 0 ? 0 : b[bi + c]));
      difference += delta; if (delta > 0) changed++; if (delta > 64) significant++;
    }
  }
  return { unionPixels: union, changedPixels: changed, changedPercent: round(100 * changed / (union || 1)), significantPercent: round(100 * significant / (union || 1)),
    meanPremultipliedRgbaError: round(difference / (4 * (union || 1))), silhouetteIoU: round(intersection / (union || 1)) };
}

export function estimateTranslation(a, b, w, h, seed = [0, 0]) {
  let best = { dx: 0, dy: 0, error: Infinity };
  const evaluate = (dx, dy, step) => {
    const m = compareFrames(a, b, w, h, dx, dy, step);
    if (m.meanPremultipliedRgbaError < best.error || m.meanPremultipliedRgbaError === best.error && Math.abs(dx) + Math.abs(dy) < Math.abs(best.dx) + Math.abs(best.dy)) best = { dx, dy, error: m.meanPremultipliedRgbaError };
  };
  const [sx, sy] = seed.map(Math.round);
  const sample = Math.max(1, Math.floor(Math.min(w, h) / 150));
  for (const [cx, cy] of [[sx, sy], [0, 0]]) for (let dy = cy - 6; dy <= cy + 6; dy += 2) for (let dx = cx - 6; dx <= cx + 6; dx += 2) evaluate(dx, dy, sample);
  const coarse = { ...best }; best.error = Infinity;
  for (let dy = coarse.dy - 2; dy <= coarse.dy + 2; dy++) for (let dx = coarse.dx - 2; dx <= coarse.dx + 2; dx++) evaluate(dx, dy, sample);
  const raw = compareFrames(a, b, w, h), residual = compareFrames(a, b, w, h, best.dx, best.dy);
  return residual.meanPremultipliedRgbaError <= raw.meanPremultipliedRgbaError ? { shiftBToA: [best.dx, best.dy], residual } : { shiftBToA: [0, 0], residual: raw };
}

export function analyzePixels(data, width, height, { footSplitX } = {}) {
  assert.ok(Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 && width % 2 === 0 && height % 2 === 0, 'Even 2x2 PNG dimensions required');
  assert.equal(data.length, width * height * 4);
  const w = width / 2, h = height / 2, cells = [], frames = [];
  assert.ok(footSplitX === undefined || Number.isInteger(footSplitX) && footSplitX > 0 && footSplitX < w, 'Foot split must be an integer inside the cell');
  for (let i = 0; i < 4; i++) {
    const cell = new Uint8Array(w * h * 4), ox = i % 2 * w, oy = Math.floor(i / 2) * h;
    for (let y = 0; y < h; y++) cell.set(data.subarray(((y + oy) * width + ox) * 4, ((y + oy) * width + ox + w) * 4), y * w * 4);
    frames.push(describe(cell, w, h, i, footSplitX)); cells.push(premultiply(cell));
  }
  const first = frames[0];
  for (const f of frames) {
    f.bodyDisplacementFromFrame1 = vector(f.bodyCenterProxy, first.bodyCenterProxy);
    f.centroidDisplacementFromFrame1 = vector(f.centroid, first.centroid);
    f.feetDisplacementFromFrame1 = vector(f.feet.midpoint, first.feet.midpoint);
    f.previewShiftToFrame1 = vector(first.feet.midpoint, f.feet.midpoint)?.map(Math.round) ?? [0, 0];
  }
  const transitions = frames.map((f, i) => {
    const j = (i + 1) % 4, next = frames[j];
    const fit = estimateTranslation(cells[i], cells[j], w, h, vector(f.feet.midpoint, next.feet.midpoint) ?? vector(f.centroid, next.centroid) ?? [0, 0]);
    const [dx, dy] = fit.shiftBToA, b = f.coreBounds;
    const bands = b ? { head: [0, b[1] + b[3] * .35], torso: [b[1] + b[3] * .35, b[1] + b[3] * .68], legs: [b[1] + b[3] * .68, b[1] + b[3] * .88], feet: [b[1] + b[3] * .88, h] } : {};
    return { from: i + 1, to: j + 1, raw: compareFrames(cells[i], cells[j], w, h), translationFit: fit,
      footPairVectorChange: vector(next.feet.pairVector, f.feet.pairVector),
      alignedRegions: Object.fromEntries(Object.entries(bands).map(([name, band]) => [name, compareFrames(cells[i], cells[j], w, h, dx, dy, 1, band)])) };
  });
  return { cellSize: [w, h], analysisParameters: { footSplitX: footSplitX ?? null, footSplitSource: footSplitX === undefined ? 'automatic palette-based valley; inspect markers' : 'operator-selected image-plane division; inspect markers; not a world-contact approval' }, frames, transitions, loopSeam: transitions[3],
    technicalBlockers: frames.flatMap(f => !f.bounds ? [`empty_frame_${f.frame}`] : f.touchesCellBoundary ? [`frame_${f.frame}_touches_cell_boundary`] : []),
    technicalWarnings: frames.filter(f => f.faintAlphaAtCellBoundary).map(f => `faint_alpha_at_frame_${f.frame}_cell_boundary_not_core_clipping`),
    measurementPolicy: { coordinates: 'Cell-local pixel indices, row-major TL/TR/BL/BR. Bounds are x,y,width,height; max indices inclusive.',
      bounds: 'bounds uses alpha>0; coreBounds and anchor measurements use alpha>=128 in memory only; the PNG alpha is never altered.',
      feet: 'Lower 22% of silhouette; screen-left/right split uses a column valley in warm-brown support in the bottom 9% (R>45,R>1.2G,G>1.1B), with bbox midpoint fallback. This palette-dependent measurement is not a semantic mask. Lowest support row needs max(3,floor(bbox width*.02)) pixels; weighted x from last three rows. Check markers against original. No PNG modification. Image-plane sole proxies, not anatomical/world-contact guarantees. Do not force both y coordinates equal in quarter-view.',
      bodyCenter: 'Alpha-weighted centroid inside core bbox vertical 35–68%; whole visible-alpha centroid also reported. These are geometric proxies, not tracked semantic landmarks.',
      pixelDifference: 'Decoded Canvas RGBA, premultiplied RGB; hidden RGB at alpha=0 ignored. Changed percent divided by union of visible support. Significant means summed premultiplied RGBA difference>64 (mean channel difference>16). No alpha binarization or palette conversion.',
      translationFit: 'Approximate integer search near measured support displacement; coarse sampled then refined; final full-resolution residual includes translated pixels outside the cell. Not a unique optical flow/animation-quality score.',
      regions: 'Frame-A bbox-relative horizontal bands, not semantic masks. Residual is not an artistic verdict.',
      timing: 'PNG has no verified authored timing; preview defaults to 250ms/frame, an adjustable display hypothesis.' },
    decision: 'pending', reviewState: 'pending-motion-review', artApproved: false, animationApproved: false, frameCellsVerified: false, loopVerified: false, productionReady: false, runtimeVerified: false };
}

export async function writeMotionAnalysis({ original, view, directory, sourceReference, parent, footSplitX }) {
  const image = await loadImage(original), canvas = createCanvas(image.width, image.height), context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const analysis = { version: 1, kind: 'motion-lookdev-technical-analysis', view, originalSha256: sha(original), originalBytes: original.length,
    sheetSize: [image.width, image.height], sourceReference, parent, ...analyzePixels(context.getImageData(0, 0, image.width, image.height).data, image.width, image.height, { footSplitX }) };
  writeFileSync(join(directory, 'motion-analysis.json'), JSON.stringify(analysis, null, 2) + '\n');
  writeFileSync(join(directory, 'motion-analysis.html'), motionAnalysisHtml(analysis, original));
  return analysis;
}

export function motionAnalysisHtml(analysis, original, parentOriginal) {
  const [cw, ch] = analysis.cellSize, [width, height] = analysis.sheetSize;
  const picture = (i, extra = '') => `<div class="cell" data-frame="${i}" style="width:${cw}px;height:${ch}px;${extra}"><img data-sheet alt="Frame ${i + 1} original sheet window" width="${width}" height="${height}" style="position:absolute;max-width:none;left:-${i % 2 * cw}px;top:-${Math.floor(i / 2) * ch}px"></div>`;
  const frame = i => `<article><h3>Frame ${i + 1}</h3><div class="display"><div class="plane">${picture(i)}</div></div><p>BBox ${analysis.frames[i].coreBounds?.join(', ')}<br>Sole L ${analysis.frames[i].feet.screenLeft?.anchor.join(', ')} / R ${analysis.frames[i].feet.screenRight?.anchor.join(', ')}</p></article>`;
  const rows = analysis.transitions.map(t => `<tr><td>${t.from}→${t.to}</td><td>${t.raw.changedPercent}%</td><td>${t.raw.meanPremultipliedRgbaError}</td><td>${t.translationFit.shiftBToA.join(', ')}</td><td>${t.translationFit.residual.meanPremultipliedRgbaError}</td><td>${t.translationFit.residual.significantPercent}%</td></tr>`).join('');
  // Full sheets remain the only image sources. CSS moves view windows; no new art pixels are written.
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${viewTitle(analysis)} Idle 기술 검토</title>
<style>*{box-sizing:border-box}body{font:15px/1.6 system-ui;color:#27312c;background:#f2eee5;margin:0;padding:24px;max-width:1480px;margin:auto}h1{font-size:26px}code{overflow-wrap:anywhere}section{display:flex;flex-wrap:wrap;gap:18px}article,.box{padding:14px;background:#fff;border:1px solid #bcc5bc;border-radius:10px;min-width:0}article{width:min(100%,325px)}.display{width:100%;aspect-ratio:${cw}/${ch};overflow:hidden;background:var(--back,#dce2d0);position:relative}.plane{position:absolute;transform-origin:0 0}.cell{position:relative;overflow:hidden;flex-shrink:0}.cell img{image-rendering:pixelated}.line{position:absolute;left:0;width:${cw}px;height:1px;background:#e75252;pointer-events:none}.dot{position:absolute;width:7px;height:7px;border:1px solid #ff4040;border-radius:50%;transform:translate(-50%,-50%)}button,select,input{font:inherit;margin:5px;padding:6px}table{border-collapse:collapse;font-size:13px}td,th{border:1px solid #aaa;padding:6px;text-align:left}.scroll{overflow:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere}.overlay .cell{position:absolute;left:0;top:0}.parent{max-width:100%;max-height:330px;object-fit:contain}.notice{padding:14px;background:#fff1bd}a{color:#145838}</style>
<h1>${viewTitle(analysis)} · Idle 기술 검토</h1><p class="notice">pending-motion-review · artApproved:false · productionReady:false · runtimeVerified:false. 원본은 그대로이며 네이티브 변환/게임 합성/미술 승인이 아닙니다.</p>
<p>원본 ${width}×${height} / cell ${cw}×${ch} · SHA256 <code>${analysis.originalSha256}</code></p><p>표시는 CSS 창·배율만 사용합니다. 아래 발점은 이미지의 하단 윤곽 측정값이며 실제 월드 접점은 ChatGPT/사용자가 확인해야 합니다. 발 영역 분할: ${analysis.analysisParameters?.footSplitX == null ? '자동 추정 (마커 확인 필요)' : '원본 대조 후 지정한 셀 x='+analysis.analysisParameters.footSplitX+' (측정용, 픽셀 이동 없음)'}.</p>
<label>바탕 <select id="background"><option value="#dce2d0">밝음</option><option value="#17252a">어두움</option><option value="#777777">중간 회색</option></select></label>
${parentOriginal ? `<details><summary>승인된 디자인 부모 (LOOKDEV만 승인)</summary><img class="parent" alt="Approved design reference" src="data:image/png;base64,${parentOriginal.toString('base64')}"><p>원본 SHA256 <code>${analysis.parent.sourceSha256}</code></p></details>` : ''}
<h2>프레임별 원본 창</h2><section id="frames">${[0, 1, 2, 3].map(frame).join('')}</section>
<h2>1→2→3→4→1 루프와 고스트 비교</h2><p>250ms/컷은 재생 가설입니다. 위치 고정 옵션은 CSS 진단이며 원화 보정 납품이 아닙니다.</p>
<button id="play">일시정지</button><label>ms/컷 <input id="speed" type="number" min="80" max="2000" value="250"></label><label><input id="align" type="checkbox">측정 발중점으로 위치 고정</label><label><input id="guides" type="checkbox" checked>발점 표시</label><input id="scrub" type="range" min="0" max="3" value="0"><span id="current">Frame 1</span>
<section><article><h3>Loop</h3><div class="display"><div class="plane" id="loop">${picture(0)}</div></div></article><article><h3>Frame 1 + 선택 컷 (50%)</h3><div class="display"><div class="plane overlay" id="ghost">${picture(0)}${picture(0, 'opacity:.5')}</div></div></article></section>
<h2>픽셀 변화와 위치 이동 분리</h2><div class="scroll"><table><thead><tr><th>전환</th><th>RGBA 변화/가시 합집합</th><th>원시 평균 오차</th><th>B→A 최적 근사 이동</th><th>이동 후 평균 오차</th><th>이동 후 유의 변화</th></tr></thead><tbody>${rows}</tbody></table></div><p>오차는 premultiplied RGBA 평균 절댓값(0–255), 유의 변화는 채널 차이 합&gt;64입니다. 수치 자체가 호흡·동일 인물·루프 품질 PASS를 뜻하지 않습니다.</p>
<details><summary>정의와 원시 측정 JSON</summary><pre>${escape(JSON.stringify(analysis, null, 2))}</pre></details>
<script>const sheet='data:image/png;base64,${original.toString('base64')}';for(const img of document.querySelectorAll('img[data-sheet]'))img.src=sheet;const analysis=${JSON.stringify(analysis).replaceAll('<', '\\u003c')};let current=0,playing=true,last=performance.now();const cw=${cw},ch=${ch};const loop=document.querySelector('#loop .cell'),ghost=document.querySelectorAll('#ghost .cell')[1];
function update(){document.querySelector('#current').textContent='Frame '+(current+1);document.querySelector('#scrub').value=current;for(const cell of [loop,ghost]){const img=cell.querySelector('img');img.style.left=-(current%2*cw)+'px';img.style.top=-Math.floor(current/2)*ch+'px';const shift=document.querySelector('#align').checked?analysis.frames[current].previewShiftToFrame1:[0,0];cell.style.transform='translate('+shift[0]+'px,'+shift[1]+'px)';cell.dataset.frame=current;}for(const d of document.querySelectorAll('.dot,.line'))d.remove();if(document.querySelector('#guides').checked){for(const plane of document.querySelectorAll('#frames .plane,#loop')){const f=plane.id==='loop'?analysis.frames[current]:analysis.frames[Number(plane.querySelector('.cell').dataset.frame)];const shift=plane.id==='loop'&&document.querySelector('#align').checked?f.previewShiftToFrame1:[0,0];for(const foot of [f.feet.screenLeft,f.feet.screenRight]){if(!foot)continue;const dot=document.createElement('span');dot.className='dot';dot.style.left=(foot.anchor[0]+shift[0])+'px';dot.style.top=(foot.anchor[1]+shift[1])+'px';plane.append(dot);}}}}
function resize(){for(const p of document.querySelectorAll('.plane'))p.style.transform='scale('+(p.parentElement.clientWidth/cw)+')';}document.querySelector('#play').onclick=()=>{playing=!playing;document.querySelector('#play').textContent=playing?'일시정지':'재생';};document.querySelector('#scrub').oninput=e=>{playing=false;document.querySelector('#play').textContent='재생';current=Number(e.target.value);update();};document.querySelector('#align').onchange=update;document.querySelector('#guides').onchange=update;document.querySelector('#background').onchange=e=>document.body.style.setProperty('--back',e.target.value);window.addEventListener('resize',resize);resize();update();function tick(now){const delay=Math.max(80,Math.min(2000,Number(document.querySelector('#speed').value)||250));if(playing&&now-last>=delay){current=(current+1)%4;last=now;update();}requestAnimationFrame(tick);}requestAnimationFrame(tick);</script></html>`;
}
function viewTitle(analysis) { return escape(analysis.view.toUpperCase()); }
