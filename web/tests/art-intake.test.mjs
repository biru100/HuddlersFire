// Real PNG decoder/CLI integration. Tiny synthetic fixtures are never artwork or approval evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {prepareArtJob, receiveArtSubmission, buildArtJob, renderArtReview, verifyArtReview} from '../../tools/lib/art-direction.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCWQAAAAASUVORK5CYII=', 'base64');
const hash = x => createHash('sha256').update(x).digest('hex');
const read = file => JSON.parse(readFileSync(file, 'utf8'));
const save = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
function fixture(t, source = png) {
  const dir = mkdtempSync(join(tmpdir(), 'huddlers-intake-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  mkdirSync(join(dir, 'art/sprites'), {recursive: true});
  for (const name of ['art-direction.json', 'scene-spec.json']) writeFileSync(join(dir, 'art/sprites', name), readFileSync(join(root, 'art/sprites', name)));
  const made = prepareArtJob({root: dir, out: 'test-decoder', variation: 'rounded'});
  const original = join(dir, 'download.png');writeFileSync(original, source);
  const file = join(made.directory, 'job.json');
  receiveArtSubmission(file, original, {root: dir});
  return {dir, file, jobDir: made.directory, original};
}

test('empty PNG is blocked by the decoder rather than trusted synthetic metrics', async t => {
  const blank = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==', 'base64');
  const f = fixture(t, blank), result = await buildArtJob(f.file, {root: f.dir});
  assert.equal(result.status, 'blocked');assert.ok(result.blockers.includes('empty_image'));
  assert.deepEqual(readFileSync(join(f.jobDir, 'source/candidate.png')), blank);
});

test('downloaded PNG passes the real inspector, review rendering and stale-source gate without mutation', async t => {
  const f = fixture(t), result = await buildArtJob(f.file, {root: f.dir});
  assert.equal(result.status, 'awaiting_visual_review');assert.equal(result.artApproved, false);assert.equal(result.runtimeVerified, false);
  const intake = read(join(f.jobDir, 'build/art-intake.json'));
  assert.deepEqual(intake.metrics.size, [1, 1]);assert.equal(intake.metrics.sha256, hash(png));
  assert.equal(intake.metrics.alpha.opaque, 1);assert.equal(intake.metrics.visibleColors, 1);
  const page = renderArtReview(f.file, {root: f.dir}), html = readFileSync(page.file, 'utf8');
  assert.match(html, /원본 100%/);assert.match(html, /작은 표시 가설/);assert.match(html, /실제 게임/);assert.match(html, /unverified/);
  assert.deepEqual(readFileSync(join(f.jobDir, 'source/candidate.png')), png);
  assert.deepEqual(readFileSync(f.original), png);
  const pending = join(f.jobDir, 'art-review.template.json');
  assert.throws(() => verifyArtReview(f.file, pending, {root: f.dir}), /Explicit user/);
  writeFileSync(join(f.jobDir, 'source/candidate.png'), Buffer.concat([png, Buffer.from('changed')]));
  assert.throws(() => renderArtReview(f.file, {root: f.dir}), /Rebuild/);
  const rebuilt = await buildArtJob(f.file, {root: f.dir});
  assert.ok(rebuilt.blockers.includes('received_original_changed'));
});

test('native delivery is blocked by real decoded dimensions and retains its original bytes', async t => {
  const f = fixture(t);await buildArtJob(f.file, {root: f.dir});
  const intake = read(join(f.jobDir, 'build/art-intake.json')), job = read(f.file);
  const reviewFile = join(f.jobDir, 'art-review.json');
  const review = {version: 1, fingerprint: intake.fingerprint, reviewerRole: 'user', reviewer: 'SYNTHETIC TEST ONLY', artDirectorReview: {actor: 'chatgpt', reference: 'automated-test-only', summary: 'SYNTHETIC TEST REVIEW, not an artwork evaluation'}, decision: 'approved', userDecision: {quote: 'SYNTHETIC FIXTURE APPROVAL', reference: 'automated-test-only'}, criteria: Object.fromEntries(job.policy.criteria.map(id => [id, {result: 'pass', observation: 'Synthetic fixture, not a visual decision'}])), unresolved: []};
  save(reviewFile, review);
  const se = prepareArtJob({root: f.dir, stage: 'lookdev', variation: job.variation, view: 'se', out: 'test-lookdev-se'});
  const seFile = join(se.directory, 'job.json'), seReview = join(se.directory, 'art-review.json');
  receiveArtSubmission(seFile, f.original, {root: f.dir});
  const seIntake = await buildArtJob(seFile, {root: f.dir});
  save(seReview, {...review, fingerprint: seIntake.fingerprint});
  const native = prepareArtJob({root: f.dir, stage: 'native-base', out: 'test-native', previousJob: f.file, previousReview: reviewFile, companionJob: seFile, companionReview: seReview});
  const file = join(native.directory, 'job.json');receiveArtSubmission(file, f.original, {root: f.dir});
  const result = await buildArtJob(file, {root: f.dir});
  assert.equal(result.status, 'blocked');assert.ok(result.blockers.includes('blocked_native_delivery:canvas'));
  const html = readFileSync(renderArtReview(file, {root: f.dir}).file, 'utf8');assert.match(html, /차단 — 승인 불가/);
  assert.deepEqual(readFileSync(join(native.directory, 'source/candidate.png')), png);
});

test('existing CLI receives exactly once, decodes PNG and renders a separate review page', t => {
  const out = 'test-intake-cli-' + process.pid + '-' + Date.now(), dir = join(root, 'art/sprites/runs', out);
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  prepareArtJob({out, variation: 'rounded'});
  const downloaded = join(dir, 'download.png');writeFileSync(downloaded, png);
  const job = resolve(dir, 'job.json'), cli = join(root, 'tools/rebuild-sprites.mjs');
  const run = (...args) => spawnSync(process.execPath, args, {cwd: root, encoding: 'utf8', windowsHide: true});
  const first = run(cli, '--job', job, '--source', downloaded, '--source-reference', 'TEST fixture');
  assert.equal(first.status, 0, first.stderr);assert.match(first.stdout, /awaiting_visual_review/);
  const repeated = run(cli, '--job', job, '--source', downloaded);assert.notEqual(repeated.status, 0);assert.match(repeated.stderr, /already received/);
  const render = run(join(root, 'web/tests/render-scene-preview.mjs'), '--job', job);assert.equal(render.status, 0, render.stderr);
  assert.equal(existsSync(join(dir, 'art-review.html')), true);
  assert.deepEqual(readFileSync(join(dir, 'source/candidate.png')), png);
  const invalid = run(cli, '--source', downloaded);assert.notEqual(invalid.status, 0);assert.match(invalid.stderr, /art-direction --job/);
});
