import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCleanroom } from '../../tools/verify-pixel-cleanroom.mjs';

const base = new URL('../../art/sprites/cleanroom-pilot/manifest.json', import.meta.url);
const promptFile = new URL('../../docs/briefs/cleanroom-pixel-generation-20261118.txt', import.meta.url);
const prompt = readFileSync(promptFile, 'utf8');
const fresh = () => JSON.parse(readFileSync(base, 'utf8'));

test('positive-only new design with no image inputs passes preflight', () => {
  const result = validateCleanroom(fresh(), prompt);
  assert.equal(result.lanes.native_pixel, 'not_run');
  assert.match(result.promptSha256, /^[a-f0-9]{64}$/);
});
test('rejects old project image injection', () => {
  const m = fresh(); m.pastImageInputs.push('some-old-sprite.png');
  assert.throws(() => validateCleanroom(m, prompt), /pastImageInputs/);
});
test('rejects old image prompt text', () => {
  assert.throws(() => validateCleanroom(fresh(), prompt + '\nUse prior PNG from lookdev.'), /old-image reference/);
});
test('rejects fake success without actual output', () => {
  const m = fresh(); m.lanes.native_pixel.status = 'review_candidate';
  assert.throws(() => validateCleanroom(m, prompt), /real output/);
});
test('rejects paid provider permission', () => {
  const m = fresh(); m.externalPaidGenerationAllowed = true;
  assert.throws(() => validateCleanroom(m, prompt), /paid API/);
});
test('rejects lane-to-lane image conditioning', () => {
  const m = fresh(); m.lanes.generic_aligned.sourceImages.push('art/sprites/cleanroom-pilot/outputs/native_pixel/candidate.png');
  assert.throws(() => validateCleanroom(m, prompt), /sourceImages/);
});
test('rejects silent art approval', () => {
  const m = fresh(); m.approval.base = 'approved';
  assert.throws(() => validateCleanroom(m, prompt), /self-approve/);
});
