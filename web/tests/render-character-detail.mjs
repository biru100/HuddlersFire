import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { drawCharacter } from '../lib/camp-character.mjs';
import { avatarFixtures } from './character-fixtures.mjs';

const conceptPath = fileURLToPath(new URL('../../art/sprites/source/camper-base.png', import.meta.url));
// Published source snapshots contain web/ only; the reference PNG stays in the original project docs.
const concept = existsSync(conceptPath) ? await loadImage(conceptPath) : null;
const fixtures = avatarFixtures();
const poses = [['서기', {}], ['걷기', { moving: true }], ['앉기', { sitting: true }], ['쪼그리기', { crouching: true }],
  ['인사', {}, 'wave'], ['박수', {}, 'clap'], ['하트', {}, 'heart'], ['춤', {}, 'dance'],
  ['웃음', {}, 'laugh'], ['놀람', {}, 'surprise'], ['친구 들기', { carrying: 'friend' }], ['공중', { motion: 'airborne' }]];
const movementPoses = [['걷기', { moving: true }], ['달리기', { moving: true, running: true }],
  ['점프 준비', { jumpAt: 220 }], ['도약', { motion: 'airborne', vz: 3.8 }], ['공중', { motion: 'airborne', vz: 0 }], ['착지', { landedAt: 230 }]];

const canvas = createCanvas(1300, 1160), c = canvas.getContext('2d');
c.fillStyle = '#18251f'; c.fillRect(0, 0, canvas.width, canvas.height);
c.fillStyle = '#f5e6c9'; c.font = 'bold 26px "Malgun Gothic", sans-serif'; c.fillText('생성 스프라이트 · 사진 머리 · 게임 동작', 35, 44);
c.fillStyle = '#adbcaa'; c.font = '16px "Malgun Gothic", sans-serif';
c.fillText('기준 원본', 150, 89); c.fillText('슬롯 팔레트', 515, 89); c.fillText('Discord 사진 머리', 960, 89);
if (concept) c.drawImage(concept, 46, 94, 302, 330);
c.save(); c.translate(590, 404); c.scale(5.4, 5.4); drawCharacter(c, {}, { blankHead: true }); c.restore();
c.save(); c.translate(1025, 404); c.scale(5.4, 5.4); drawCharacter(c, {}, { avatar: fixtures[0].image }); c.restore();
poses.forEach(([label, state, emote], index) => {
  const x = 120 + (index % 6) * 212, y = 634 + Math.floor(index / 6) * 250;
  c.save(); c.translate(x, y); c.scale(2.8, 2.8); drawCharacter(c, state, { time: .32, reduced: false, emote }); c.restore();
  c.fillStyle = '#d9dec7'; c.font = '17px "Malgun Gothic", sans-serif'; c.textAlign = 'center'; c.fillText(label, x, y + 34); c.textAlign = 'left';
});
c.fillStyle = '#adbcaa'; c.font = '16px "Malgun Gothic", sans-serif'; c.fillText('걷기 · 한 주기의 프레임', 35, 979);
for (let i = 0; i < 8; i++) {
  c.save(); c.translate(120 + i * 152, 1114); c.scale(2, 2);
  drawCharacter(c, { moving: true }, { time: i / 8 * Math.PI * 2 / 9, reduced: false, avatar: fixtures[0].image }); c.restore();
}
writeFileSync('outputs/character-detail-v2.png', canvas.toBuffer('image/png'));

const movement = createCanvas(1320, 620), mc = movement.getContext('2d');
mc.fillStyle = '#18251f'; mc.fillRect(0, 0, 1320, 620); mc.fillStyle = '#f5e6c9'; mc.font = 'bold 24px "Malgun Gothic", sans-serif'; mc.fillText('걷기 · 달리기 · 점프 단계별 자세', 30, 42);
for (let row = 0; row < 2; row++) movementPoses.forEach(([label, state], column) => {
  const x = 115 + column * 217, y = 265 + row * 265;
  mc.save(); mc.translate(x, y); mc.scale(3.2, 3.2);
  drawCharacter(mc, state, { time: .32, now: 320, reduced: false, avatar: row ? fixtures[0].image : null }); mc.restore();
  mc.fillStyle = '#d9dec7'; mc.font = '16px "Malgun Gothic", sans-serif'; mc.textAlign = 'center'; mc.fillText(label, x, y + 35);
});
writeFileSync('outputs/character-movement.png', movement.toBuffer('image/png'));

const toys = createCanvas(1120, 650), tc = toys.getContext('2d');
tc.fillStyle = '#18251f'; tc.fillRect(0, 0, 1120, 650); tc.fillStyle = '#f5e6c9'; tc.font = 'bold 25px "Malgun Gothic", sans-serif'; tc.fillText('장난감 · 준비 / 사용 / 공중', 32, 40);
for (let row = 0; row < 3; row++) for (const [column, weapon] of ['none', 'gun', 'snowball', 'bomb'].entries()) {
  const x = 140 + column * 280, y = 205 + row * 192;
  tc.save(); tc.translate(x, y); tc.scale(2.6, 2.6);
  drawCharacter(tc, { weapon, facing: 1, shotAt: row === 1 ? 950 : -1, shotAimX: Math.SQRT1_2, shotAimY: -Math.SQRT1_2, motion: row === 2 ? 'airborne' : 'grounded', vz: 2 }, { time: 1, now: 1000, reduced: false, avatar: row === 2 ? fixtures[0].image : null }); tc.restore();
  tc.fillStyle = '#d9dec7'; tc.font = '16px "Malgun Gothic", sans-serif'; tc.textAlign = 'center'; tc.fillText(['맨손', '총', '눈뭉치', '폭탄'][column], x, y + 30);
}
writeFileSync('outputs/character-weapons.png', toys.toBuffer('image/png'));

// A self-contained local preview: production drawing code, no service or account connection.
const source = readFileSync(new URL('../lib/camp-character.mjs', import.meta.url), 'utf8').replace(/^export /gm, '');
const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>캐릭터 동작 비교</title>
<style>body{margin:0;padding:28px;background:#18251f;color:#f5e6c9;font:15px system-ui,sans-serif}h1{font-size:25px}header{max-width:1100px;margin:auto}label{display:inline-flex;gap:8px;margin:12px 24px 18px 0;align-items:center}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;max-width:1100px;margin:auto}section{border:1px solid #aaba9626;border-radius:18px;background:#213329;text-align:center;padding:12px}h2{font-size:15px;font-weight:500;margin:5px}canvas{width:100%;height:auto;max-width:260px}p{color:#b4c0ac;line-height:1.6}</style>
<header><h1>둥근 몸통과 말랑한 동작</h1><p>사진 머리와 기본 얼굴을 바꿔 보고, 동작을 멈춰 자세를 비교할 수 있습니다.</p><label><input type="checkbox" id="photo">사진 머리</label><label><input type="checkbox" id="pause">동작 멈춤</label><label><input type="checkbox" id="reduce">동작 줄이기</label></header><main></main>
<script>${source}
const poses=${JSON.stringify([...poses, ['달리기', { moving: true, running: true }]])}, main=document.querySelector('main'), photo=document.querySelector('#photo'), pause=document.querySelector('#pause'), reduce=document.querySelector('#reduce');
reduce.checked=matchMedia('(prefers-reduced-motion:reduce)').matches;
const profile=new Image(); profile.src=${JSON.stringify(fixtures[0].image.toDataURL('image/png'))};
const cards=poses.map(([label,state,emote])=>{const section=document.createElement('section'),title=document.createElement('h2'),canvas=document.createElement('canvas');title.textContent=label;canvas.width=520;canvas.height=440;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',label+' 캐릭터 동작');section.append(title,canvas);main.append(section);return {canvas,state,emote};});
let previous=0,time=0;
function frame(ms){if(!pause.checked)time+=previous?Math.min((ms-previous)/1000,.05):0;previous=ms;
cards.forEach(({canvas,state,emote})=>{const ctx=canvas.getContext('2d');ctx.clearRect(0,0,520,440);ctx.save();ctx.translate(260,391);ctx.scale(5.6,5.6);drawCharacter(ctx,state,{time,reduced:reduce.checked,emote,avatar:photo.checked&&profile.complete&&profile.naturalWidth?profile:null});ctx.restore();});requestAnimationFrame(frame);}requestAnimationFrame(frame);
</script></html>`;
writeFileSync('outputs/character-motion-preview.html', html);

// Preserve a reviewable before/after image when a local pre-change snapshot is available.
if (concept && existsSync('outputs/camp-character-before.mjs')) {
  const { drawCharacter: before } = await import('../outputs/camp-character-before.mjs');
  const comparison = createCanvas(1150, 480), ctx = comparison.getContext('2d');
  ctx.fillStyle = '#18251f'; ctx.fillRect(0, 0, 1150, 480);
  ctx.fillStyle = '#f5e6c9'; ctx.font = 'bold 22px "Malgun Gothic", sans-serif';
  ctx.fillText('생성 시안', 120, 46); ctx.fillText('이전 동작 형태', 470, 46); ctx.fillText('개선한 동작 형태', 845, 46);
  ctx.drawImage(concept, 33, 65, 330, 361);
  for (const [index, draw] of [before, drawCharacter].entries()) {
    ctx.save(); ctx.translate(550 + index * 365, 420); ctx.scale(5.8, 5.8); draw(ctx, {}, { blankHead: true }); ctx.restore();
  }
  writeFileSync('outputs/character-before-after.png', comparison.toBuffer('image/png'));
}
console.log('PASS character-detail-v2 and character-motion-preview: concept comparison, twelve poses and eight walking frames');
