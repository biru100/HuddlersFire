import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { AvatarImages, drawCharacter } from '../lib/camp-character.mjs';
import { pickPlayer, playerInfo } from '../lib/camp-player-info.mjs';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { spawnPlayer } from '../lib/camp-world.mjs';

function render(p = {}, avatar = null, options = {}) {
  const canvas = createCanvas(128, 128), c = canvas.getContext('2d');
  c.translate(64, 104); const pose=drawCharacter(c, { color: '#e5a76d', ...p }, { avatar, ...options });
  return { canvas, c,pose };
}
const pixel = (c, x, y) => [...c.getImageData(x, y, 1, 1).data];

test('profile images are center-cropped without stretching for both wide and tall sources', () => {
  for (const [w, h] of [[300, 100], [100, 300]]) {
    const avatar = createCanvas(w, h), a = avatar.getContext('2d');
    a.fillStyle = '#ff0000'; a.fillRect(0, 0, w, h);
    a.fillStyle = '#00cc44'; a.fillRect((w - 100) / 2, (h - 100) / 2, 100, 100);
    const { c,pose } = render({}, avatar),x=64+pose.headX,y=104+pose.headY;
    for (const dx of [-9,0,9]) assert.deepEqual(pixel(c, Math.round(x+dx),Math.round(y)), [0, 204, 68, 255]);
    assert.equal(pixel(c, Math.round(x-17),Math.round(y-17))[3], 0, 'photo must stay inside the circular head');
  }
});

test('postures keep the same circular photo size and facing never mirrors the original', () => {
  const avatar = createCanvas(64, 64), a = avatar.getContext('2d');
  a.fillStyle = '#ff0000'; a.fillRect(0, 0, 32, 64); a.fillStyle = '#0000ff'; a.fillRect(32, 0, 32, 64);
  for (const p of [{}, { sitting: true }, { crouching: true }]) {
    const left = render({ ...p, facing: -1 }, avatar), right = render({ ...p, facing: 1 }, avatar);
    assert.deepEqual(left.canvas.toBuffer('image/png'), right.canvas.toBuffer('image/png'));
    const { data, width, height } = left.c.getImageData(0, 0, 128, 128), points = [];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if ((data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 0) || (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 255)) points.push([x, y]);
    }
    const spanX = Math.max(...points.map(v => v[0])) - Math.min(...points.map(v => v[0]));
    const spanY = Math.max(...points.map(v => v[1])) - Math.min(...points.map(v => v[1]));
    assert.ok(Math.abs(spanX - spanY) <= 1, 'posture must not squash a square profile');
  }
});

test('transparent profile pixels use the neutral head backing without fallback eyes', () => {
  const transparent = createCanvas(64, 64), withAvatar = render({}, transparent), fallback = render();
  assert.deepEqual(pixel(withAvatar.c,Math.round(60+withAvatar.pose.headX),Math.round(104+withAvatar.pose.headY)), [255, 240, 207, 255]);
  assert.notDeepEqual(withAvatar.canvas.toBuffer('image/png'), fallback.canvas.toBuffer('image/png'));
});

test('avatar loading and failure use fallback, cache requests, and reject untrusted URLs', () => {
  let created = 0, changed = 0;
  class FakeImage { constructor() { created++; this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; } }
  const cache = new AvatarImages(() => changed++, FakeImage), url = 'https://cdn.discordapp.com/avatars/1/abc.png?size=64';
  assert.equal(cache.get('https://example.com/photo.png'), null); assert.equal(created, 0);
  assert.equal(cache.get(url), null); assert.equal(cache.get(url), null); assert.equal(created, 1);
  const image = cache.entries.get(url).image;
  image.onerror(); assert.equal(cache.get(url), null); assert.equal(created, 1); assert.equal(changed, 1);
  const next = url.replace('/abc.', '/def.'); cache.get(next);
  const loaded = cache.entries.get(next).image;
  Object.assign(loaded, { complete: true, naturalWidth: 64, naturalHeight: 64 }); loaded.onload();
  assert.equal(cache.get(next), loaded); assert.equal(changed, 2);
  cache.dispose(); assert.equal(loaded.onload, null); assert.equal(cache.entries.size, 0);
});

test('reduced motion freezes breathing, walking and every expressive gesture', () => {
  for (const emote of [null, 'wave', 'clap', 'heart', 'dance', 'laugh', 'surprise']) {
    const first = render({ moving: true }, null, { emote, time: 0, reduced: true });
    const later = render({ moving: true }, null, { emote, time: 1.31, reduced: true });
    assert.deepEqual(first.canvas.toBuffer('image/png'), later.canvas.toBuffer('image/png'), emote || 'walk');
  }
  assert.deepEqual(render({}, null, { time: 0 }).canvas.toBuffer('image/png'), render({}, null, { time: 10 }).canvas.toBuffer('image/png'));
});

test('expressive animations change the silhouette while preserving caller canvas transforms', () => {
  for (const emote of ['wave', 'clap', 'heart', 'dance', 'laugh', 'surprise']) {
    const a = render({}, null, { emote, time: .1, reduced: false }), b = render({}, null, { emote, time: .23, reduced: false });
    assert.notDeepEqual(a.canvas.toBuffer('image/png'), b.canvas.toBuffer('image/png'), emote);
    assert.equal(a.c.getTransform().a, 1); assert.equal(a.c.getTransform().e, 64); assert.equal(a.c.getTransform().f, 104);
  }
});

test('player selection uses painter order, nameplates and nearest touch padding', () => {
  const a = { id: 'back', head: { x: 50, y: 50, radius: 10 }, body: { x: 42, y: 60, width: 16, height: 12 }, label: { x: 30, y: 80, width: 40, height: 20 } };
  const b = { ...a, id: 'front' };
  assert.equal(pickPlayer([a, b], 50, 50), 'front');
  assert.equal(pickPlayer([a], 35, 90), 'back');
  assert.equal(pickPlayer([a], 69, 50), null); assert.equal(pickPlayer([a], 69, 50, true), 'back');
  assert.equal(pickPlayer([a], 100, 100, true), null); assert.equal(pickPlayer([a], NaN, 50), null);
  const nearby = { id: 'near', head: { x: 83, y: 50, radius: 3 } };
  assert.equal(pickPlayer([a, nearby], 69, 50, true), 'near');
  const upper={id:'upper',head:{x:50,y:10,radius:10},body:{x:40,y:20,width:20,height:40}};
  assert.equal(pickPlayer([a,upper],50,50),'back','A visible portrait wins over a carried neighbour body box');
  const frontBody={id:'body',head:{x:200,y:200,radius:10},body:{x:30,y:80,width:40,height:20}};
  assert.equal(pickPlayer([a,frontBody],50,90),'back','A visible nameplate is above a foreground body');
});

test('rendered player selection follows CSS scale, page offsets, posture, altitude and resize at DPR 2', () => {
  const names = ['window', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const old = Object.fromEntries(names.map(key => [key, globalThis[key]]));
  Object.assign(globalThis, { window: { devicePixelRatio: 2, matchMedia: () => ({ matches: true }) }, ResizeObserver: class { observe() {} disconnect() {} }, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {} });
  let renderer;
  try {
    let width = 900, height = 700;
    const canvas = createCanvas(width, height); canvas.getBoundingClientRect = () => ({ left: 150, top: 90, width, height });
    const players = [{ ...spawnPlayer(), id: 'air', name: '공중', x: -2, y: 2, z: 1.2, motion: 'airborne' }, { ...spawnPlayer(), id: 'sit', name: '앉기', x: 3, y: -1, sitting: true }];
    renderer = new CampRenderer(canvas, () => ({ players, now: 500 }));
    for (const size of [[900, 700], [390, 520]]) {
      [width, height] = size; renderer.resize(); renderer.draw(500);
      const {scale,x:originX,y:originY}=renderer.camera;
      for (const p of players) {
        const x = 150 + originX + (p.x - p.y) * 40 * scale;
        const y = 90 + originY + ((p.x + p.y) * 20 - p.z * 40 + (p.sitting ? -32 : -40)) * scale;
        assert.equal(renderer.pickPlayer(x, y), p.id);
      }
    }
    players[0].motion = 'respawning'; renderer.draw(500);
    assert.equal(renderer.hitAreas.some(a => a.id === 'air'), false);
  } finally {
    renderer?.destroy();
    for (const key of names) if (old[key] === undefined) delete globalThis[key]; else globalThis[key] = old[key];
  }
});

test('player information reports current activity without returning internal session fields', () => {
  const p = { ...spawnPlayer(), id: 'a', name: '친구', running: true, moving: true, connected: true, token: 'private', discord_id: 'private' };
  let info = playerInfo(p, 'a', 'a', 500);
  assert.equal(info.activity, '달리는 중'); assert.equal(info.isSelf, true); assert.equal(info.isHost, true); assert.ok(!JSON.stringify(info).includes('private'));
  info = playerInfo({ ...p, motion: 'airborne', vz: -1 }, 'b', 'b', 500); assert.equal(info.activity, '내려오는 중');
  assert.equal(playerInfo({ ...p, sitting: true }, 'b', 'b', 500).activity, '앉아서 불멍 중');
  assert.equal(playerInfo({ ...p, connected: false }, 'b', 'b', 500).connected, false);
});
