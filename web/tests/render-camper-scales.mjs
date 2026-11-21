import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {createCanvas, Image, loadImage} from '@napi-rs/canvas';
import {CampRenderer} from '../lib/camp-renderer.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';
import {COLORS, spawnPlayer} from '../lib/camp-world.mjs';
import {spriteManifest} from '../lib/camp-sprite-assets.mjs';
import {readCamperCandidate} from '../scripts/camper-review-assets.mjs';
import {inside} from '../../tools/lib/sprite-spec.mjs';
import {camperReviewRoot,canvasFormats,browserFormats,camperZooms,camperPoses,fieldCases,browserPortraitCases,
  camperCaptureIdentity,writeCamperCapture,verifyCamperPair} from './camper-scale-evidence.mjs';

const [phase] = process.argv.slice(2);
const job=process.env.CAMP_CAMPER_JOB;
if (!['before', 'after', 'compare', ...(job?['verify']:[])].includes(phase)) throw Error('Pass before, after, compare or verify for a job');
const root = job?camperReviewRoot(job):'outputs/current-art/camper-scales';
const output = `${root}/${phase}`;
const samples = fieldCases(canvasFormats);

if(job&&['compare','verify'].includes(phase)){
  for(const kind of ['canvas','browser']){
    const verified=verifyCamperPair(job,kind);
    if(verified)console.log(`${kind}: ${verified.count} image pairs match the current candidate and baseline`);
    else console.log('Browser evidence pending');
  }
  if(phase==='verify')process.exit(0);
}

if (phase==='compare') {
  const plain = ['subpixel-grid',...samples];
  const rows = [];
  const cell = path => existsSync(`${root}/${path}`)?`<a href="${path}"><img src="${path}" alt="" loading="lazy"></a>`:'—';
  const add = (name,before,after) => rows.push(`<tr><th scope="row">${name}</th><td>${cell(before)}</td><td>${cell(after)}</td></tr>`);
  for (const name of plain) {
    const filename = `${name}.png`;
    const [before,after] = await Promise.all(['before','after'].map(side=>loadImage(`${root}/${side}/${filename}`)));
    if (before.width!==after.width || before.height!==after.height) throw Error(`Mismatched output size: ${name}`);
    add(name,`before/${filename}`,`after/${filename}`);
  }
  for (const [format] of browserFormats) for (const top of [0,1]) for (const hair of [0,1]) {
    const name = `${format}-lobby-${top}-${hair}`;
    add(name,`browser-before/${name}.png`,`browser-after/${name}.png`);
  }
  for (const name of [...samples, 'desktop-125-max-canvas', ...browserPortraitCases]) {
    add(`Chromium ${name}`,`browser-before/${name}.png`,`browser-after/${name}.png`);
  }
  writeFileSync(`${root}/comparison.html`, `<!doctype html><html lang="ko"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><title>캠퍼 확대·축소 전후</title>
    <style>body{background:#211e19;color:#eee3cf;font:16px system-ui;margin:24px}table{width:100%;border-collapse:collapse;table-layout:fixed}
    th{font-weight:500;overflow-wrap:anywhere}th:first-child{width:17%}td,th{border-bottom:1px solid #655848;padding:8px;vertical-align:top;text-align:left}
    img{display:block;max-width:100%;height:auto}</style><h1>캠퍼 확대·축소 전후</h1>
    <p>이미지를 누르면 실제 캡처 크기로 열립니다.</p><table><thead><tr><th>화면</th><th>기존</th><th>수정 후</th></tr></thead><tbody>${rows.join('')}</tbody></table></html>`);
  console.log(`${root}/comparison.html: ${plain.length} matching Canvas pairs and available browser captures`);
  process.exit(0);
}

const identity=job?camperCaptureIdentity('canvas',job,phase):null;
if(job&&phase==='before'&&existsSync(output+'/receipt.json'))throw Error('This job already has a Canvas baseline');
if(job&&phase==='after'){
  if(!existsSync(inside(root,'before/receipt.json')))throw Error('Capture the Canvas baseline first');
  const {files}=readCamperCandidate(job);
  for(const id of ['field-camper-v2','field-camper-walk']){
    if(files[id].url!==spriteManifest.files[id]?.url||files[id].sha256!==spriteManifest.files[id]?.sha256)
      throw Error('Canvas did not load the requested final candidate: '+id);
  }
}
mkdirSync(output, {recursive:true});
globalThis.window = {devicePixelRatio:1, matchMedia:() => ({matches:false})};
globalThis.ResizeObserver = class {observe() {} disconnect() {}};
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
globalThis.Image = Image;

const player = {...spawnPlayer(0, 'camp'), id:'self', name:'Myo', x:-.45, y:-2.05,
  color:COLORS[1], connected:true, topStyle:0, hairStyle:0, visualDirection:'front-right'};
const save = (canvas, name) => writeFileSync(`${output}/${name}.png`, canvas.toBuffer('image/png'));
for (const [name,width,height,dpr] of canvasFormats) {
  window.devicePixelRatio = dpr;
  const canvas = createCanvas(width*dpr, height*dpr);
  canvas.getBoundingClientRect = () => ({width,height});
  const scene = {players:[player], self:player.id, mapId:'camp', cameraMode:'follow', zoom:1, now:500, theme:'color'};
  const renderer = new CampRenderer(canvas, () => scene, {
    // Freeze the selected step to make all before/after poses comparable.
    characterPainter(ctx,p,options) {
      drawCharacter(ctx, {...p, visualDirection:player.visualDirection, walkCycle:player.walkCycle}, options);
    },
  });
  await renderer.ready;
  for (const [scale,zoom] of camperZooms) {
    scene.zoom = zoom;
    for (const pose of camperPoses) {
      const moving=pose==='walk',walkCycle=moving?3/8:0;
      Object.assign(player, {moving,walkCycle});
      renderer.draw(500);
      save(canvas, `${name}-${scale}-${pose}`);
    }
  }
  renderer.destroy();
}

// Show the same physical-output size at four subpixel positions without scene lighting.
// This exposes blinking one-pixel features and padding artifacts that a single shot can hide.
const sampleScales = [.35,.65,.8,1,1.25,1.5,2,3];
const grid = createCanvas(884, sampleScales.reduce((sum,scale) => sum+Math.ceil(80*scale)+10, 0));
const ctx = grid.getContext('2d');
ctx.fillStyle = '#e2decd';
ctx.fillRect(0,0,grid.width,grid.height);
ctx.fillStyle = '#3f342e';
ctx.font = '12px sans-serif';
let y = 0;
for (const scale of sampleScales) {
  const height = Math.ceil(80*scale)+10;
  const tile = createCanvas(200,height), tileContext = tile.getContext('2d');
  ctx.fillText(`${scale}x`, 7, y+16);
  for (const [col,phaseOffset] of [0,.25,.5,.75].entries()) {
    tileContext.setTransform(1,0,0,1,0,0);
    tileContext.clearRect(0,0,tile.width,tile.height);
    tileContext.setTransform(scale,0,0,scale,100+phaseOffset,height-8+phaseOffset);
    drawCharacter(tileContext, {...player, moving:false}, {time:.5,reduced:true});
    ctx.drawImage(tile, 52+col*208,y);
  }
  y += height;
}
save(grid, 'subpixel-grid');
if(job)writeCamperCapture(output,{job,kind:'canvas',phase,identity});
console.log(`${output}: 27 game frames and subpixel comparison grid`);
