import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readdir, readFile, rm, symlink } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makePlan, parseArgs, downloadThumbnail, saveThumbnail, run } from './prepare-thumbnail.mjs';

const requireWeb = createRequire(new URL('../../../../web/package.json', import.meta.url));
const { createCanvas } = requireWeb('@napi-rs/canvas');
const outputs = fileURLToPath(new URL('../../../../web/outputs/', import.meta.url));
const url = 'https://www.youtube.com/watch?v=s0pMzMwvKgE';
const args = ['--game-id', 'sample-game', '--trailer-url', url];
const jpeg = (w, h) => {
  const canvas = createCanvas(w, h);
  canvas.getContext('2d').fillRect(0, 0, w, h);
  return canvas.toBuffer('image/jpeg');
};
const large = jpeg(1280, 720), hq = jpeg(480, 360), placeholder = jpeg(120, 90);
const response = (bytes, status = 200, type = 'image/jpeg') => new Response(bytes, { status, headers: { 'content-type': type } });

async function sandbox(t) {
  await mkdir(outputs, { recursive: true });
  const root = await mkdtemp(join(outputs, 'booth-thumbnail-test-'));
  // root is an OS-generated child of the fixed project outputs directory.
  t.after(async () => {
    assert.equal(dirname(resolve(root)), resolve(outputs));
    assert.ok(basename(root).startsWith('booth-thumbnail-test-'));
    await rm(root, { recursive: true, force: true });
  });
  return { root, target: join(root, 'web', 'public', 'games', 'sample-game-trailer-thumbnail.jpg') };
}

test('official YouTube URL forms produce the same fixed local cover and CDN candidates', () => {
  for (const trailerUrl of [url, 'https://youtu.be/s0pMzMwvKgE', 'https://www.youtube.com/shorts/s0pMzMwvKgE', 'https://www.youtube.com/embed/s0pMzMwvKgE']) {
    const plan = makePlan({ gameId: 'sample-game', trailerUrl });
    assert.equal(plan.videoId, 's0pMzMwvKgE');
    assert.equal(plan.cover, '/games/sample-game-trailer-thumbnail.jpg');
    assert.deepEqual(plan.candidates.map(v => v.url), ['maxresdefault', 'hqdefault'].map(q => `https://i.ytimg.com/vi/s0pMzMwvKgE/${q}.jpg`));
  }
});

test('unsafe IDs and unsupported or deceptive URLs are rejected', () => {
  for (const gameId of ['', '../escape', 'a/b', 'A-game', '-game', 'a--b', 'a'.repeat(65)]) assert.throws(() => makePlan({ gameId, trailerUrl: url }));
  for (const trailerUrl of ['http://youtu.be/s0pMzMwvKgE', 'https://youtube.com.evil.test/watch?v=s0pMzMwvKgE', 'https://user:pass@youtube.com/watch?v=s0pMzMwvKgE', 'https://youtube.com:444/watch?v=s0pMzMwvKgE', 'https://youtu.be/short', 'file:///video']) assert.throws(() => makePlan({ gameId: 'sample', trailerUrl }));
});

test('CLI rejects missing, unknown and repeated arguments', () => {
  for (const input of [[], ['--game-id'], ['--bad'], [...args, '--game-id', 'again'], [...args, '--replace', '--replace']]) {
    assert.throws(() => makePlan(parseArgs(input)));
  }
});

test('dry-run validates without fetching or creating output directories', async t => {
  const { root } = await sandbox(t);
  const result = await run([...args, '--dry-run'], { outputRoot: root, fetchImpl: () => assert.fail('unexpected network') });
  assert.equal(result.dryRun, true);
  assert.deepEqual(await readdir(root), []);
});

test('uses validated maxres JPEG without requesting fallback', async () => {
  const calls = [];
  const result = await downloadThumbnail(makePlan(parseArgs(args)), { fetchImpl: async (u, options) => { calls.push(u); assert.equal(options.redirect, 'error'); assert.ok(options.signal); return response(large); } });
  assert.equal(calls.length, 1);
  assert.equal(result.quality, 'maxresdefault');
  assert.equal(result.width, 1280);
  assert.equal(result.height, 720);
  assert.deepEqual(result.bytes, large);
});

for (const [name, first] of [
  ['HTTP 404', () => response('missing', 404)],
  ['small placeholder', () => response(placeholder)],
  ['HTML response', () => response('<html>no</html>', 200, 'text/html')],
  ['HTML with JPEG MIME', () => response('<html>no</html>')],
  ['corrupt JPEG', () => response(Buffer.from([255, 216, 255, 0, 0]))],
  ['network failure', () => { throw new Error('network failed'); }],
  ['oversized body', () => response(Buffer.alloc(8 * 1024 * 1024 + 1))],
]) {
  test(`${name} falls back once to a valid hq image`, async () => {
    let calls = 0;
    const result = await downloadThumbnail(makePlan(parseArgs(args)), { fetchImpl: async () => ++calls === 1 ? first() : response(hq) });
    assert.equal(calls, 2);
    assert.equal(result.quality, 'hqdefault');
    assert.equal(result.width, 480);
  });
}

test('total failure is bounded and leaves no image or temp file', async t => {
  const { root, target } = await sandbox(t);
  let calls = 0;
  await assert.rejects(run(args, { outputRoot: root, fetchImpl: async () => { calls++; return response(placeholder); } }), /No usable thumbnail/);
  assert.equal(calls, 2);
  assert.deepEqual(await readdir(join(root, 'web', 'public', 'games')), []);
  await assert.rejects(readFile(target), { code: 'ENOENT' });
});

test('save is atomic, preserves existing files by default and permits explicit replacement', async t => {
  const { root, target } = await sandbox(t);
  await saveThumbnail(target, large, { root });
  await assert.rejects(saveThumbnail(target, hq, { root }), /already exists/);
  assert.deepEqual(await readFile(target), large);
  await saveThumbnail(target, hq, { root, replace: true });
  assert.deepEqual(await readFile(target), hq);
  assert.deepEqual(await readdir(join(root, 'web', 'public', 'games')), ['sample-game-trailer-thumbnail.jpg']);
});

test('existing output blocks network and failed replacement preserves original', async t => {
  const { root, target } = await sandbox(t);
  await saveThumbnail(target, large, { root });
  await assert.rejects(run(args, { outputRoot: root, fetchImpl: () => assert.fail('unexpected network') }), /already exists/);
  await assert.rejects(run([...args, '--replace'], { outputRoot: root, fetchImpl: async () => response('no', 404) }), /No usable thumbnail/);
  assert.deepEqual(await readFile(target), large);
});

test('rejects out-of-project targets and linked parent directories', async t => {
  const { root, target } = await sandbox(t);
  await assert.rejects(saveThumbnail(join(root, 'escape.jpg'), large, { root }), /Output must stay/);
  const linked = join(root, 'linked');
  await mkdir(join(root, 'web', 'public'), { recursive: true });
  await mkdir(linked);
  await symlink(linked, join(root, 'web', 'public', 'games'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(saveThumbnail(target, large, { root }), /not a link/);
  assert.deepEqual(await readdir(linked), []);
});

test('successful run returns source, resolution, cover and checksum for attribution', async t => {
  const { root, target } = await sandbox(t);
  const result = await run(args, { outputRoot: root, fetchImpl: async () => response(large) });
  assert.equal(result.cover, '/games/sample-game-trailer-thumbnail.jpg');
  assert.equal(result.bytes, large.length);
  assert.match(result.sha256, /^[0-9a-f]{64}$/);
  assert.match(result.creditNote, /s0pMzMwvKgE/);
  assert.equal(result.width, 1280);
  assert.deepEqual(await readFile(target), large);
});
