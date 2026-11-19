// Run with the same sprite fixture as the other offline camp renders.
import { createCanvas, loadImage, Image, GlobalFonts } from '@napi-rs/canvas';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { drawCharacter } from '../lib/camp-character.mjs';
import { CAMP_BENCHES, CAMP_SEATS } from '../lib/camp-maps.mjs';
import { benchBinding, seatOffset } from '../lib/camp-scene-contract.mjs';
import { takeSeat } from '../lib/camp-seats.mjs';
import { COLORS, spawnPlayer } from '../lib/camp-world.mjs';

const slug = process.argv[2] || 'camp-circle-se';
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Invalid job slug');
const root = fileURLToPath(new URL('../../art/sprites/scene-reviews/' + slug + '/', import.meta.url));
const recipe = JSON.parse(readFileSync(join(root, 'recipe.json'), 'utf8'));
for (const folder of ['game', 'layers', 'review']) mkdirSync(join(root, folder), {recursive:true});
const save = (name, canvas) => writeFileSync(join(root, name + '.png'), canvas.toBuffer('image/png'));
// The game asks for Malgun Gothic. Linux review hosts may supply a Korean fallback.
const koreanFont = process.env.CAMP_REVIEW_KOREAN_FONT || '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';
if (!GlobalFonts.has('Malgun Gothic') && existsSync(koreanFont)) GlobalFonts.registerFromPath(koreanFont, 'Malgun Gothic');
globalThis.window = {devicePixelRatio:1, matchMedia:() => ({matches:true})};
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
globalThis.Image = Image;

const originals = {}, game = {};
for (const role of ['camper', 'bench', 'ground']) {
  const input = await loadImage(join(root, 'originals', role + '.png'));
  originals[role] = input;
  const spec = recipe[role], result = createCanvas(...spec.canvas);
  for (const region of spec.regions) {
    if (!/^[a-z][a-z0-9-]*$/.test(region.name)) throw Error('Invalid layer name');
    const layer = createCanvas(...spec.canvas), c = layer.getContext('2d');
    const [sx, sy, sw, sh] = region.source, [x, y, w, h] = region.target;
    c.save();
    if (region.clip) {
      c.beginPath();
      region.clip.forEach(([px, py], i) => c[i ? 'lineTo' : 'moveTo'](x+(px-sx)*w/sw, y+(py-sy)*h/sh));
      c.closePath(); c.clip();
    }
    c.imageSmoothingQuality = 'high';
    c.drawImage(input, sx, sy, sw, sh, x, y, w, h);
    c.restore();
    // Flatten partial coverage at logical resolution so the silhouette stays sharp on any ground.
    const pixels = c.getImageData(0, 0, layer.width, layer.height);
    for (let i = 3; i < pixels.data.length; i += 4) {
      const index = (i-3)/4, u = (index % layer.width + .5)/layer.width, v = (Math.floor(index/layer.width)+.5)/layer.height;
      const edge = role === 'ground' ? Math.min(1, Math.max(0, (1-Math.abs(2*u-1)-Math.abs(2*v-1))/recipe.scene.groundEdge)) : 1;
      pixels.data[i] = pixels.data[i] >= 120 ? Math.round(255*edge) : 0;
    }
    c.putImageData(pixels, 0, 0);
    if (spec.regions.length > 1) save('layers/' + region.name, layer);
    result.getContext('2d').drawImage(layer, 0, 0);
  }
  save('game/' + role, result);
  game[role] = result;
}

const cfg = recipe.scene;
const bench = CAMP_BENCHES.find(b => b.id === cfg.benchId);
const seat = CAMP_SEATS.filter(s => s.bench === bench.id)[cfg.seatIndex];
const hero = {...spawnPlayer(0), id:'camper', name:'Myo', facing:1, color:COLORS[0], connected:true, x:cfg.camper[0], y:cfg.camper[1]};
const friend = {...spawnPlayer(1), id:'guest', name:'Sol', color:COLORS[1], connected:true, x:seat.x, y:seat.y};
const players = [hero, friend];
const seatError = takeSeat(new Map(players.map(p => [p.id,p])), friend, seat.id);
if (seatError) throw Error(seatError);
const scene = {players, self:hero.id, mapId:'camp', cameraMode:'follow', followSelf:true, zoom:1, now:5000, theme:'color'};
function stamp(c, image, x, y, material) {
  c.save();
  c.imageSmoothingEnabled = false;
  c.setMaterial({lighting:'lit', ...material});
  c.drawImage(image, x, y);
  c.restore();
}
function reviewCamper(c, player, opts) {
  if (player.id !== hero.id) return drawCharacter(c, player, opts);
  const [footX, footY] = recipe.camper.feet;
  stamp(c, game.camper, -footX, -footY, {ambientLift:[.14,.15,.17]});
}
class CandidateRenderer extends CampRenderer {
  constructor(canvas) {
    super(canvas, () => scene, {characterPainter:reviewCamper});
    const lights = this.groundLights.draw.bind(this.groundLights);
    this.groundLights.draw = (c, ...args) => {
      const [px, py] = this.project(bench.x, bench.y);
      c.save(); c.globalAlpha *= cfg.groundOpacity;
      stamp(c, game.ground, px+cfg.groundOffset[0], py+cfg.groundOffset[1], {ground:true});
      c.restore();
      lights(c, ...args);
    };
  }
  bench(item) {
    if (item.id !== bench.id) return super.bench(item);
    const contact = seatOffset(benchBinding(this.assets, item));
    stamp(this.ctx, game.bench, contact.x-cfg.benchSeat[0], contact.y-cfg.benchSeat[1]);
  }
}
const frames = {};
for (const [device, width, height] of [['desktop',1050,824], ['mobile',390,520]]) {
  for (const version of ['before', 'candidate']) {
    const canvas = createCanvas(width, height);
    canvas.getBoundingClientRect = () => ({width,height});
    const renderer = version === 'candidate' ? new CandidateRenderer(canvas) : new CampRenderer(canvas, () => scene);
    await renderer.ready;
    renderer.draw(scene.now);
    if (renderer.camera.mode !== 'follow' || !renderer.hitAreas.some(p => p.id === hero.id)) throw Error('Missing follow camera or camper');
    save('review/' + device + '-' + version, canvas);
    frames[device + '-' + version] = canvas;
    renderer.destroy();
  }
}
// Keep mobile images pixel-for-pixel; the desktop viewport is available separately.
const sheet = createCanvas(822,828), ctx = sheet.getContext('2d');
ctx.fillStyle='#23272a'; ctx.fillRect(0,0,sheet.width,sheet.height);
const label=(value,x,y,size=15)=>{ctx.font='600 '+size+'px sans-serif';ctx.fillStyle='#fff4da';ctx.fillText(value,x,y);};
label('HUDDLERS FIRE   /   CAMP ART REVIEW',14,28,20);
label('SOURCE',18,60);label('GAME 1x',191,60);label('GAME 2x',311,60);label('BENCH + GROUND 1x',490,60);
ctx.drawImage(originals.camper,0,0,originals.camper.width,originals.camper.height,17,64,156,175);
ctx.imageSmoothingEnabled=false;
ctx.drawImage(game.camper,190,108);ctx.drawImage(game.camper,291,51,128,192);
ctx.drawImage(game.ground,491,128);ctx.drawImage(game.bench,536,112);
label('CURRENT   /   390 px',14,274);label('CANDIDATE   /   390 px',418,274);
ctx.drawImage(frames['mobile-before'],14,289);ctx.drawImage(frames['mobile-candidate'],418,289);
save('review/board', sheet);
