// Render our own Canvas drawing code to PNG without launching or controlling a browser.
import { createCanvas, Image } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { COLORS, EMOTES, TRAMPOLINES, spawnPlayer } from '../lib/camp-world.mjs';
globalThis.window = { devicePixelRatio: 1, matchMedia: () => ({ matches: true }) };
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
globalThis.Image = Image;
mkdirSync('outputs', { recursive: true });
for (const [name, width, height, count] of [['camp-desktop', 1050, 824, 16], ['camp-mobile', 390, 520, 1]]) {
  const canvas = createCanvas(width, height);
  canvas.getBoundingClientRect = () => ({ width, height });
  const players = Array.from({ length: count }, (_, i) => ({ id: String(i), name: i === 0 ? 'Huddlers' : 'Camper ' + i, color: COLORS[i % COLORS.length], ...spawnPlayer(i), sitting: i % 3 === 0 }));
  const renderer = new CampRenderer(canvas, () => ({ players, self: '0' }));
  renderer.draw(5000);
  const png = canvas.toBuffer('image/png');
  writeFileSync('outputs/' + name + '.png', png);
  renderer.destroy();
  console.log(`PASS ${name}: ${width}x${height}, ${count} players, ${png.length} bytes`);
}
for (const [name, width, height, reduced] of [['camp-actions', 1050, 824, false], ['camp-actions-mobile', 390, 520, false], ['camp-actions-reduced', 1050, 824, true]]) {
  globalThis.window.matchMedia = () => ({ matches: reduced });
  const canvas = createCanvas(width, height); canvas.getBoundingClientRect = () => ({ width, height });
  const positions = [[0, 2], [-2, 0], [2, 0], [TRAMPOLINES[0].x, TRAMPOLINES[0].y], [-1, -3], [-1, -3], [0, 6.1], [-3, 2], [2, -3], [1, -2.5], [-3, -1]];
  const players = positions.map(([x, y], i) => ({ id: String(i), name: i === 0 ? '나' : '친구 ' + i, color: COLORS[i % COLORS.length], ...spawnPlayer(i), x, y }));
  Object.assign(players[0], { crouching: true });
  EMOTES.forEach((e, i) => Object.assign(players[[1, 2, 7, 8, 9, 10][i]], { emote: e.id, emoteUntil: 8000 }));
  Object.assign(players[2], { bubble: '한글 채팅도 반가워요! 모닥불에서 함께 쉬어 가요.', bubbleUntil: 8000 });
  Object.assign(players[3], { motion: 'airborne', z: 2.3, vz: 0 });
  Object.assign(players[4], { carrying: '5' }); Object.assign(players[5], { carriedBy: '4', motion: 'carried', z: 1.3 });
  Object.assign(players[6], { motion: 'falling', z: -1.3 });
  const renderer = new CampRenderer(canvas, () => ({ players, self: '0', targetId: '1', now: 5000 }));
  renderer.draw(5000); const png = canvas.toBuffer('image/png'); writeFileSync('outputs/' + name + '.png', png); renderer.destroy();
  console.log(`PASS ${name}: ${width}x${height}, all emotes/crouch/carry/air/fall/chat, reduced=${reduced}, ${png.length} bytes`);
}
