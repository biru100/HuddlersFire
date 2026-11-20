// Offline art review. Crop each pose from the full-size sheet before the camera scales it.
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createCanvas, GlobalFonts, loadImage} from '@napi-rs/canvas';
import sharp from 'sharp';
import '../tests/sprite-fixture.mjs';
import {CampRenderer} from '../lib/camp-renderer.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';
import {simulateWorld, spawnPlayer} from '../lib/camp-world.mjs';

const folder = new URL('../../art/sprites/field-camper-v2/walk-detail/', import.meta.url);
const path = name => fileURLToPath(new URL(name, folder));
const styles = ['jacket', 'hoodie'];
const directions = ['front-right', 'back-right', 'back-left', 'front-left'];
const labels = ['남동', '북동', '북서', '남서'];
const font = process.env.CAMP_REVIEW_KOREAN_FONT || (process.platform === 'win32'
  ? 'C:/Windows/Fonts/malgun.ttf' : '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc');
if (existsSync(font)) GlobalFonts.registerFromPath(font, 'Review Sans');

const masters = await Promise.all(styles.map(style => loadImage(path('walk-'+style+'.png'))));
const compact = await Promise.all(styles.map(style => loadImage(path('walk-'+style+'-64x80.png'))));
const heads = await Promise.all(['bob','bun'].map(style => loadImage(path('head-'+style+'.png'))));
const tops = await Promise.all(styles.map(style => loadImage(path('top-'+style+'.png'))));
const looks = [
  {hairStyle:0,topStyle:0,label:'단발 · 재킷'}, {hairStyle:0,topStyle:1,label:'단발 · 후디'},
  {hairStyle:1,topStyle:0,label:'묶음 · 재킷'}, {hairStyle:1,topStyle:1,label:'묶음 · 후디'},
];
function drawPose(c, sheet, phase, dir, x, y, width, height) {
  const w = sheet.width / 8, h = sheet.height / 4;
  c.drawImage(sheet, phase*w, dir*h, w, h, x, y, width, height);
}
function drawLook(c, player, ...args) {
  drawPose(c,tops[player.topStyle===1?1:0],...args);
  drawPose(c,heads[player.hairStyle===1?1:0],...args);
}

// Compare both sources at the same output size. PNG keeps the two samples lossless.
const comparison = createCanvas(768, 306), cmp = comparison.getContext('2d');
cmp.fillStyle = '#ede6d7';
cmp.fillRect(0, 0, comparison.width, comparison.height);
cmp.textAlign = 'center';
cmp.fillStyle = '#433a31';
for (const [i, style] of ['재킷', '후디'].entries()) {
  cmp.font = 'bold 19px "Review Sans", sans-serif';
  cmp.fillText(style, i*384+192, 24);
  for (let j=0; j<2; j++) {
    const x = i*384 + j*192;
    cmp.font = '16px "Review Sans", sans-serif';
    cmp.fillText(j ? '원화로 표시' : '64×80을 3배 확대', x+96, 52);
    cmp.imageSmoothingEnabled = false;
    drawPose(cmp, j ? masters[i] : compact[i], 4, 0, x, 62, 192, 240);
  }
}
await writeFile(path('walk-zoom-comparison.png'), comparison.toBuffer('image/png'));

Object.assign(globalThis, {window:{devicePixelRatio:2,matchMedia:()=>({matches:false})},
  ResizeObserver:class {observe() {} disconnect() {}},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}});
const sceneWidth = 352, sceneHeight = 282;
const game = createCanvas(sceneWidth, sceneHeight);
game.getBoundingClientRect = () => ({width:sceneWidth,height:sceneHeight});
const seen = new Map();
function paint(c, p, options) {
  if (!p.moving) return drawCharacter(c, p, options);
  const dir = directions.indexOf(p.visualDirection), key=p.hairStyle+'/'+p.topStyle;
  if(!seen.has(key))seen.set(key,new Set());
  seen.get(key).add(dir);
  c.save();
  c.imageSmoothingEnabled = true;
  c.setMaterial?.({lighting:'lit',ambientLift:[.16,.15,.14]});
  drawLook(c, p, Math.floor(p.walkCycle*8)%8, dir, -32, -69, 64, 80);
  c.restore();
}
const jacket = {...spawnPlayer(),id:'jacket',name:'Myo',x:3,y:6,topStyle:0,hairStyle:1};
const hoodie = {...spawnPlayer(),id:'hoodie',name:'Sol',x:4.1,y:4.9,topStyle:1,hairStyle:0};
const scene = {players:[jacket,hoodie],self:jacket.id,mapId:'camp',zoom:1.5,cameraMode:'follow',theme:'color',now:1000};
const players = new Map(scene.players.map(p => [p.id,p]));
const renderer = new CampRenderer(game, () => scene, {characterPainter:paint});
renderer.draw(scene.now);
await renderer.ready;
const panelWidth = 4*192, width = game.width+panelWidth, height = game.height;
const preview = createCanvas(width, height), c = preview.getContext('2d');
c.fillStyle = '#ede6d7';
c.fillRect(0,0,width,height);
c.fillStyle = '#433a31';
c.textAlign = 'center';
c.font = 'bold 22px "Review Sans", sans-serif';
c.fillText('걷기 · 3배 확대', game.width+panelWidth/2, 30);
c.font = '18px "Review Sans", sans-serif';
looks.forEach((look,index) => c.fillText(look.label,game.width+index*192+96,63));
const ticksPerDir = 16, count = 4*ticksPerDir, pageBytes = width*height*4;
const frames = Buffer.allocUnsafe(pageBytes*count);
let frame = 0;
for (const [dir,[dx,dy]] of [[1,0],[0,-1],[-1,0],[0,1]].entries()) {
  const input = {dx,dy,running:false,sitting:false};
  const inputs = new Map(scene.players.map(p => [p.id,input]));
  for (let tick=0; tick<ticksPerDir; tick++) {
    scene.now += 50;
    simulateWorld(players,inputs,.05,scene.now);
    renderer.draw(scene.now);
    c.drawImage(game,0,0);
    c.fillStyle = '#ede6d7';
    c.fillRect(game.width,72,panelWidth,height-72);
    for (const [col,look] of looks.entries()) {
      for (let view=0; view<2; view++) {
        drawLook(c,look,Math.floor(tick/2),(dir+2*view)%4,game.width+col*192,72+view*240,192,240);
      }
    }
    frames.set(c.getImageData(0,0,width,height).data,pageBytes*frame++);
  }
}
renderer.destroy();
for (const key of ['1/0','0/1']) assert.deepEqual([...seen.get(key)].sort(), [0,1,2,3]);
const encoded = await sharp(frames,{raw:{width,height:height*count,channels:4,pageHeight:height}})
  .webp({lossless:true,effort:2,loop:0,delay:Array(count).fill(50)}).toBuffer();
const metadata = await sharp(encoded,{animated:true}).metadata();
assert.equal(metadata.pages,count);
assert.equal(metadata.pageHeight,height);
assert.ok(metadata.delay.every(ms => ms === 50));
await writeFile(path('walk-preview.webp'), encoded);
const still=createCanvas(4*156+48,4*182+46), ink=still.getContext('2d');
ink.fillStyle='#ede6d7';ink.fillRect(0,0,still.width,still.height);
ink.textAlign='center';ink.fillStyle='#433a31';ink.font='bold 16px "Review Sans", sans-serif';
for(const [col,look] of looks.entries()){
  ink.fillText(look.label,48+col*156+78,27);
  for(const [dir,label] of labels.entries()){
    if(col===0)ink.fillText(label,25,46+dir*182+90);
    drawLook(ink,look,4,dir,48+col*156,46+dir*182,144,180);
  }
}
await writeFile(path('wardrobe-fit.png'),still.toBuffer('image/png'));
console.log(`Walk review: ${width}×${height}, ${count} lossless frames, ${encoded.length} bytes`);
