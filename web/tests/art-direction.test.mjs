// Rule/receipt tests use temporary synthetic fixtures, not real human approvals or visual scores.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {prepareArtJob, loadArtJob, artPrompt, receiveArtSubmission, assessArtSubmission, validateArtDecision, verifyArtReview, verifyPixelArtApproval, renderArtReview, artPath} from '../../tools/lib/art-direction.mjs';
import {inspectAvatarCombination} from '../lib/camp-avatar-assembly.mjs';
const hash = x => createHash('sha256').update(typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x)).digest('hex');
const save = (p, x) => writeFileSync(p, JSON.stringify(x, null, 2) + '\n');
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const policy = read(new URL('../../art/sprites/art-direction.json', import.meta.url));
// A valid tiny PNG. Fixtures exercise receipt binding; raster decode remains an integration test.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCWQAAAAASUVORK5CYII=', 'base64');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'huddlers-art-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  mkdirSync(join(root, 'art/sprites'), {recursive: true});
  save(join(root, 'art/sprites/art-direction.json'), policy);
  save(join(root, 'art/sprites/scene-spec.json'), {pixelQuarterview: {version: 1, projection: {tile: [80, 40]}, avatar: {canvas: [64, 96], feet: [32, 88], head: [32, 28], seat: [32, 62], states: {idle: {frames: 1, durations: [1000]}}}}});
  return root;
}
const receipt = () => ({file: 'source/candidate.png', surface: 'chatgpt', sourceType: 'image-generation', requestedModel: 'gpt-image-2.6', observedModel: null, modelEvidence: {kind: 'unverified', reference: ''}, operations: [], paletteRgb: ['#f3b281'], frameAnchors: {feet: [32, 88], head: [32, 28]}});
const metrics = () => ({sha256: hash(png), bytes: png.length, size: [64, 96], bounds: [10, 8, 44, 80], alpha: {opaque: 1700, transparent: 4444, soft: 0}, paletteMismatches: 0});
function context(t, stage = 'lookdev') {
  const root = fixture(t), prepared = prepareArtJob({root, out: 'test-lookdev'}), jobFile = join(prepared.directory, 'job.json'), job = read(jobFile);
  return {root, jobFile, job: {...job, stage}, dir: prepared.directory};
}
function userReview(job, fingerprint) {
  return {version: 1, fingerprint, reviewer: 'synthetic test user', reviewerRole: 'user', decision: 'approved', userDecision: {quote: 'TEST FIXTURE ONLY: approve this exact candidate', reference: 'test-fixture'}, criteria: Object.fromEntries(job.policy.criteria.map(id => [id, {result: 'pass', observation: 'Synthetic fixture, not a real visual review'}])), unresolved: []};
}
function approvedLookdev(t) {
  const f = context(t), r = receipt(), m = {...metrics(), size: [1, 1], bounds: [0, 0, 1, 1], alpha: {opaque: 1, transparent: 0, soft: 0}};
  writeFileSync(join(f.dir, r.file), png);save(join(f.dir, 'submission.json'), r);
  const harness = hash(readFileSync(new URL('../../tools/lib/art-direction.mjs', import.meta.url), 'utf8').replaceAll('\r\n', '\n'));
  const fingerprint = hash({job: f.job, receipt: r, metrics: m, harness});
  mkdirSync(join(f.dir, 'build'));save(join(f.dir, 'build/art-intake.json'), {fingerprint, sourceSha256: hash(png), metrics: m, ...assessArtSubmission(f.job, r, m)});
  const reviewFile = join(f.dir, 'art-review.json');save(reviewFile, userReview(f.job, fingerprint));
  return {...f, reviewFile};
}
test('prepare is external-only and creates one scoped prompt, not artwork', t => {
  const f = context(t), p = artPrompt(f.job);
  assert.equal(existsSync(join(f.dir, 'source/candidate.png')), false);
  assert.match(p, /착의 캐릭터/);assert.match(p, /NW/);assert.match(p, /LOOKDEV_ONLY/);
  assert.doesNotMatch(p, /art\/sprites|catalog\.json|node tools/);
  assert.equal(read(join(f.dir, 'submission.template.json')).observedModel, null);
});
test('a duplicate job cannot overwrite source', t => {
  const f = context(t);assert.throws(() => prepareArtJob({root: f.root, out: 'test-lookdev'}), /already exists/);
});

test('receive preserves downloaded bytes and unknown model, and refuses a second source', t => {
  const f = context(t), original = join(f.root, 'download.png');writeFileSync(original, png);
  const result = receiveArtSubmission(f.jobFile, original, {root: f.root, reference: 'TEST conversation reference'});
  const r = read(join(f.dir, 'submission.json'));
  assert.deepEqual(readFileSync(result.file), readFileSync(original));assert.equal(result.sourceSha256, hash(png));
  assert.equal(r.originalSha256, hash(png));assert.equal(r.observedModel, null);assert.equal(r.modelEvidence.kind, 'unverified');
  assert.equal(r.sourceReference, 'TEST conversation reference');assert.deepEqual(r.operations, ['lossless-copy']);
  assert.throws(() => receiveArtSubmission(f.jobFile, original, {root: f.root}), /already received/);
  assert.deepEqual(readFileSync(result.file), png);
  assert.ok(assessArtSubmission(f.job, r, {...metrics(), sha256: '0'.repeat(64)}).blockers.includes('received_original_changed'));
});

test('receive refuses non-PNG input and an existing receipt without touching source', t => {
  const f = context(t), original = join(f.root, 'download.jpg');writeFileSync(original, 'not PNG');
  assert.throws(() => receiveArtSubmission(f.jobFile, original, {root: f.root}), /Original PNG/);
  assert.equal(existsSync(join(f.dir, 'source/candidate.png')), false);
  writeFileSync(original, png);save(join(f.dir, 'submission.json'), {note: 'preserve existing receipt'});
  assert.throws(() => receiveArtSubmission(f.jobFile, original, {root: f.root}), /already received/);
  assert.equal(existsSync(join(f.dir, 'source/candidate.png')), false);
});

test('look variants change one design emphasis while retaining NW clothed idle and delivery boundaries', t => {
  const {job} = context(t), prompts = ['compact', 'rounded', 'graphic'].map(variation => artPrompt({...job, variation}));
  assert.equal(new Set(prompts).size, 3);
  for (const p of prompts) {assert.match(p, /곱슬머리/);assert.match(p, /긴 바지/);assert.match(p, /후드는 머리에 쓰지 않고/);assert.match(p, /정지 자세/);assert.match(p, /LOOKDEV_ONLY/);assert.match(p, /강제|자동 축소/);}
  assert.match(prompts[0], /비율과 밀집도/);assert.match(prompts[1], /볼륨과 덩어리감/);assert.match(prompts[2], /색면과 윤곽의 명료함/);
});

test('active art and validation skills retain resolvable local document links', () => {
  for (const name of ['camp-art-direction', 'camp-sprite-assets', 'camp-change-validation']) {
    const file = new URL(`../../.agents/skills/${name}/SKILL.md`, import.meta.url), source = readFileSync(file, 'utf8');
    assert.match(source, new RegExp(`name: ${name}`));
    for (const [, link] of source.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
      if (!/^https?:/.test(link)) assert.ok(existsSync(new URL(link, file)), `${name}: broken link ${link}`);
    }
  }
});
test('bad job names and unknown stages are rejected', t => {
  const root = fixture(t);for (const out of ['../outside', '', '/tmp/art']) assert.throws(() => prepareArtJob({root, out}), /fresh simple/);
  assert.throws(() => prepareArtJob({root, out: 'test-unknown', stage: 'all-animations'}), /Unknown art stage/);
});
test('native output cannot be requested before a user-selected look', t => {
  const root = fixture(t);assert.throws(() => prepareArtJob({root, out: 'test-native', stage: 'native-base'}), /approved lookdev/);
});
test('approved lookdev is byte-preserved as native reference, not resized', t => {
  const f = approvedLookdev(t), made = prepareArtJob({root: f.root, out: 'native-next', stage: 'native-base', previousJob: f.jobFile, previousReview: f.reviewFile});
  assert.deepEqual(readFileSync(join(made.directory, 'REFERENCE.png')), png);
  const j = loadArtJob(join(made.directory, 'job.json'), {root: f.root}), p = artPrompt(j);
  assert.match(p, /64×96/);assert.match(p, /32,28/);assert.match(p, /blocked_native_delivery/);assert.match(p, /6색 제한은 폐기/);
});
test('large lookdev is reviewable but never production-ready', t => {
  const {job} = context(t), r = assessArtSubmission(job, receipt(), {...metrics(), size: [1024, 1536], alpha: {opaque: 10000, transparent: 300, soft: 400}});
  assert.equal(r.status, 'awaiting_visual_review');assert.equal(r.productionReady, false);assert.equal(r.runtimeVerified, false);
});
test('the same large image is blocked as a native base', t => {
  const {job} = context(t, 'native-base');assert.ok(assessArtSubmission(job, receipt(), {...metrics(), size: [1024, 1536]}).blockers.includes('blocked_native_delivery:canvas'));
});
test('soft alpha and missing real transparency are blocked', t => {
  const {job} = context(t, 'native-base');for (const alpha of [{opaque: 20, transparent: 20, soft: 1}, {opaque: 6144, transparent: 0, soft: 0}]) assert.ok(assessArtSubmission(job, receipt(), {...metrics(), alpha}).blockers.includes('blocked_native_delivery:binary_alpha'));
});
test('blank image is blocked', t => {
  const {job} = context(t);assert.ok(assessArtSubmission(job, receipt(), {...metrics(), bounds: null, alpha: {opaque: 0, transparent: 6144, soft: 0}}).blockers.includes('empty_image'));
});
test('exact palette and anchor metadata are required, with no six-color cap', t => {
  const {job} = context(t, 'native-base');assert.equal(assessArtSubmission(job, receipt(), metrics()).blockers.length, 0);
  assert.ok(assessArtSubmission(job, {...receipt(), paletteRgb: []}, metrics()).blockers.includes('blocked_native_delivery:palette'));
  assert.ok(assessArtSubmission(job, receipt(), {...metrics(), paletteMismatches: 1}).blockers.includes('blocked_native_delivery:palette'));
  assert.ok(assessArtSubmission(job, {...receipt(), frameAnchors: {feet: [32, 88], head: [32, 18]}}, metrics()).blockers.includes('blocked_native_delivery:anchor_metadata'));
});
test('model claims are not inferred from the ChatGPT label', t => {
  const {job} = context(t), r = assessArtSubmission(job, receipt(), metrics());assert.ok(r.warnings.includes('actual_image_model_unverified'));
});
test('Codex generation and image-2 fallback are blocked', t => {
  const {job} = context(t);
  assert.ok(assessArtSubmission(job, {...receipt(), surface: 'codex'}, metrics()).blockers.includes('unapproved_generation_route'));
  assert.ok(assessArtSubmission(job, {...receipt(), observedModel: 'gpt-image-2'}, metrics()).blockers.includes('model_mismatch_no_silent_fallback'));
});
test('procedural redraw cannot be reported as image-model output', t => {
  const {job} = context(t);assert.ok(assessArtSubmission(job, {...receipt(), sourceType: 'procedural-redraw'}, metrics()).blockers.includes('unapproved_generation_route'));
});
test('all prohibited processing is rejected while lossless copy is allowed', t => {
  const {job} = context(t);
  for (const op of policy.forbiddenOperations) assert.ok(assessArtSubmission(job, {...receipt(), operations: [op]}, metrics()).blockers.includes('forbidden_or_unknown_transform'));
  assert.equal(assessArtSubmission(job, {...receipt(), operations: ['lossless-copy']}, metrics()).blockers.length, 0);
});
test('technical success alone is not human art approval', t => {
  const {job} = context(t), intake = {fingerprint: 'fixture', blockers: []};
  assert.throws(() => validateArtDecision({fingerprint: 'fixture', decision: 'pass'}, job, intake), /Explicit user/);
  const r = userReview(job, 'fixture');r.reviewerRole = 'agent';assert.throws(() => validateArtDecision(r, job, intake), /Explicit user/);
});
test('each aesthetic criterion needs an observation and no unresolved issue', t => {
  const {job} = context(t), intake = {fingerprint: 'fixture', blockers: []}, r = userReview(job, 'fixture');
  r.criteria.silhouette.observation = '';assert.throws(() => validateArtDecision(r, job, intake), /criterion/);
  r.criteria.silhouette.observation = 'test';r.unresolved.push('bad hands');assert.throws(() => validateArtDecision(r, job, intake), /Unresolved/);
});
test('art approval remains distinct from runtime/production approval', t => {
  const f = approvedLookdev(t), r = verifyArtReview(f.jobFile, f.reviewFile, {root: f.root});assert.equal(r.artApproved, true);assert.equal(r.productionReady, false);assert.equal(r.runtimeVerified, false);
});
test('changed original or generation receipt invalidates approval', t => {
  const f = approvedLookdev(t);writeFileSync(join(f.dir, 'source/candidate.png'), Buffer.concat([png, Buffer.from('changed')]));assert.throws(() => verifyArtReview(f.jobFile, f.reviewFile, {root: f.root}), /Stale/);
  writeFileSync(join(f.dir, 'source/candidate.png'), png);const r = read(join(f.dir, 'submission.json'));r.observedModel = 'gpt-image-2.6-flare';save(join(f.dir, 'submission.json'), r);assert.throws(() => verifyArtReview(f.jobFile, f.reviewFile, {root: f.root}), /Stale/);
});
test('policy, geometry and compiled prompt changes invalidate jobs', t => {
  const f = context(t), file = join(f.root, 'art/sprites/art-direction.json');save(file, {...policy, id: 'changed'});assert.throws(() => loadArtJob(f.jobFile, {root: f.root}), /Stale/);
  save(file, policy);const specFile=join(f.root, 'art/sprites/scene-spec.json'), spec=read(specFile);spec.pixelQuarterview.avatar.head=[32,18];save(specFile,spec);assert.throws(() => loadArtJob(f.jobFile,{root:f.root}),/Stale/);spec.pixelQuarterview.avatar.head=[32,28];save(specFile,spec);writeFileSync(join(f.dir, 'CHATGPT_REQUEST.txt'), 'changed');assert.throws(() => loadArtJob(f.jobFile, {root: f.root}), /prompt changed/);
});
test('a changed approved reference blocks native expansion', t => {
  const f = approvedLookdev(t), made = prepareArtJob({root: f.root, out: 'native-next', stage: 'native-base', previousJob: f.jobFile, previousReview: f.reviewFile});
  writeFileSync(join(made.directory, 'REFERENCE.png'), Buffer.from('changed'));assert.throws(() => loadArtJob(join(made.directory, 'job.json'), {root: f.root}), /reference changed/);
});
test('project traversal and symlink escapes are rejected', t => {
  const root = fixture(t);assert.throws(() => artPath(root, '../outside.png'), /outside/);
  if (process.platform !== 'win32') {symlinkSync(tmpdir(), join(root, 'outside'));assert.throws(() => artPath(root, 'outside/art.png'), /Symlink/);}
});
test('review page never claims a real game render and does not modify PNG', t => {
  const f = approvedLookdev(t), before = readFileSync(join(f.dir, 'source/candidate.png')), result = renderArtReview(f.jobFile, {root: f.root});
  assert.equal(result.renderedGameScene, false);assert.equal(result.runtimeVerified, false);assert.deepEqual(readFileSync(join(f.dir, 'source/candidate.png')), before);assert.match(readFileSync(result.file, 'utf8'), /실제 게임/);
});
test('pixel release needs a user decision and hashes for every active pilot', t => {
  const f = approvedLookdev(t), job = {catalog: {assets: [{id: 'test-base', pilot: {type: 'avatar'}, file: 'art/sprites/runs/test-lookdev/source/candidate.png'}]}};
  assert.throws(() => verifyPixelArtApproval(job, {}, {root: f.root}), /artDirection/);
  const r = {artDirection: {job: f.jobFile, review: f.reviewFile, assets: [{id: 'test-base', sha256: hash(png)}]}, userDecision: {actor: 'user', quote: 'TEST fixture approval', reference: 'test-fixture'}};
  assert.equal(verifyPixelArtApproval(job, r, {root: f.root}).artApproved, true);
  r.artDirection.assets[0].sha256 = '0'.repeat(64);assert.throws(() => verifyPixelArtApproval(job, r, {root: f.root}), /stale pixel asset/);
});
function avatar() {
  const v = {canvas: [4, 4], frames: [{layers: [{name: 'base', rect: [0, 0, 4, 4]}]}], durations: [1000], frameAnchors: [{feet: [2, 3], head: [2, 1]}], pixelGrid: 1, paletteId: 'p'};
  return {draft: {version: 1, parts: {base: 'test-base'}}, catalog: {version: 1, palettes: {}, assets: [{id: 'test-base', slot: 'base', size: [4, 4], status: 'usable_as_is', paletteId: 'p', variants: {NW: {idle: v}}}]}};
}
test('missing state contract blocks assembly without throwing', () => {
  const {draft, catalog} = avatar();for (const contract of [undefined, {}, {states: {}}, {states: {idle: {frames: 1}}}]) {const r = inspectAvatarCombination(draft, catalog, 'NW', 'idle', contract);assert.equal(r.ready, false);assert.deepEqual(r.layers, []);assert.ok(r.reasons.includes('missing_approved_frame_contract'));}
});
test('a matching wrong canvas across all layers no longer bypasses the contract', () => {
  const {draft, catalog} = avatar(), contract = {canvas: [64, 96], states: {idle: {frames: 1, durations: [1000]}}};const r = inspectAvatarCombination(draft, catalog, 'NW', 'idle', contract);assert.equal(r.ready, false);assert.ok(r.reasons.includes('test-base:outside_declared_canvas'));
});
test('existing synthetic contracts without canvas remain backward-compatible', () => {
  const {draft, catalog} = avatar();assert.equal(inspectAvatarCombination(draft, catalog, 'NW', 'idle', {states: {idle: {frames: 1, durations: [1000]}}}).ready, true);
});

test('verified model metadata is preserved and future policy names are not hardcoded', t => {
 const {job}=context(t), r=receipt();r.observedModel='gpt-image-2.6-sunburst';r.modelEvidence={kind:'tool-metadata',reference:'TEST tool receipt'};assert.deepEqual(assessArtSubmission(job,r,metrics()).warnings,[]);
 const next=structuredClone(job);next.policy.generation.requestedModel='example-approved-model';r.requestedModel='example-approved-model';r.observedModel='example-approved-model-rev1';assert.deepEqual(assessArtSubmission(next,r,metrics()).blockers,[]);
});
