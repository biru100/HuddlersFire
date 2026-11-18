import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { deflateSync, crc32 } from 'node:zlib';
import { validateCleanroom, verifyLocalOutputs } from '../../tools/verify-pixel-cleanroom.mjs';

const base = new URL('../../art/sprites/cleanroom-pilot/manifest.json', import.meta.url);
const promptFile = new URL('../../docs/briefs/cleanroom-pixel-generation-20261118.txt', import.meta.url);
const prompt = readFileSync(promptFile, 'utf8');
const fresh = () => JSON.parse(readFileSync(base, 'utf8'));

test('positive-only new design with no image inputs passes preflight', () => {
  const result = validateCleanroom(fresh(), prompt);
  assert.equal(result.lanes.native_pixel, fresh().lanes.native_pixel.status);
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

test('rejects hidden historical image reference fields', () => {
  const m = fresh(); m.lanes.native_pixel.styleReference = 'some-old-image.png';
  assert.throws(() => validateCleanroom(m, prompt), /unexpected field/);
});

test('rejects renamed approval gates even when all six values remain pending', () => {
  const m = fresh();
  delete m.approval.runtime;
  m.approval.unrelated = 'pending_user';
  assert.throws(() => validateCleanroom(m, prompt), /unexpected field/);
});

test('rejects an array disguised as the lane map', () => {
  const m = fresh();
  const lanes = [];
  Object.assign(lanes, m.lanes);
  m.lanes = lanes;
  assert.throws(() => validateCleanroom(m, prompt), /invalid lanes/);
});

function candidate(path, bytes) {
  const m = fresh();
  m.lanes.native_pixel = {
    status: 'review_candidate', provider: 'Synthetic technical test fixture',
    actualModelId: null, sourceImages: [], costUsd: 0,
    output: {path, sha256: createHash('sha256').update(bytes).digest('hex'),
      provenance: 'Unit test fixture only', usageRights: 'Test-authored bytes'}
  };
  return m;
}
function pngFixture() {
  function chunk(type, data) {
    const content = Buffer.concat([Buffer.from(type), data]);
    const result = Buffer.alloc(content.length + 8);
    result.writeUInt32BE(data.length);
    content.copy(result, 4);
    result.writeUInt32BE(crc32(content) >>> 0, result.length - 4);
    return result;
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1); header.writeUInt32BE(1, 4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),
    chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.from([0,1,2,3,255]))),
    chunk('IEND', Buffer.alloc(0))]);
}
test('rejects cross-lane traversal hidden in a PNG path', () => {
  const m = candidate('art/sprites/cleanroom-pilot/outputs/native_pixel/../manual_native/forged.png', Buffer.from('test'));
  assert.throws(() => validateCleanroom(m, prompt), /canonical/);
});
test('verifies delivered PNG bytes and rejects corrupt or fake images even with matching hashes', () => {
  const parent = new URL('../../art/sprites/cleanroom-pilot/outputs/native_pixel/', import.meta.url);
  mkdirSync(parent, {recursive:true});
  const dir = mkdtempSync(new URL('test-', parent));
  const relativePath = 'art/sprites/cleanroom-pilot/outputs/native_pixel/' + dir.split('/').at(-1) + '/candidate.png';
  try {
    const valid = pngFixture();
    writeFileSync(new URL('candidate.png', 'file://' + dir + '/'), valid);
    const m = candidate(relativePath, valid);
    validateCleanroom(m, prompt);
    assert.equal(verifyLocalOutputs(m)[0].width, 1);
    m.lanes.native_pixel.status = 'rejected_visual';
    m.lanes.native_pixel.rejectionReason = 'Fixture rejected by the user for visual quality.';
    assert.equal(validateCleanroom(m, prompt).lanes.native_pixel, 'rejected_visual');
    assert.equal(verifyLocalOutputs(m)[0].width, 1);
    for (const invalid of [Buffer.from('not a PNG'), Buffer.from(valid)]) {
      if (invalid.length === valid.length) invalid[29] ^= 1;
      writeFileSync(new URL('candidate.png', 'file://' + dir + '/'), invalid);
      assert.throws(() => verifyLocalOutputs(candidate(relativePath, invalid)));
    }
    const linked = dir + '/linked.png';
    symlinkSync(dir + '/candidate.png', linked);
    assert.throws(() => validateCleanroom(candidate(relativePath.replace('candidate.png','linked.png'), valid), prompt), /symlink/);
    rmSync(dir + '/candidate.png');
    assert.throws(() => verifyLocalOutputs(m), /missing actual file/);
  } finally {
    rmSync(dir, {recursive:true,force:true});
  }
});

// A technically valid native sprite may be aesthetically rejected by the user.
// Rejection must stay visible in the receipt and retain its genuine PNG hash.
test('visually rejected native output remains recorded, not promoted to art approval', () => {
  const m = fresh();
  m.lanes.manual_native.status = 'rejected_visual';
  m.lanes.manual_native.rejectionReason = 'Fixture rejected by the user for visual quality.';
  const result = validateCleanroom(m, prompt);
  assert.equal(result.lanes.manual_native, 'rejected_visual');
  assert.equal(m.approval.base, 'pending_user');
});
test('visual rejection without a reason cannot be registered', () => {
  const m = fresh();
  m.lanes.manual_native.status = 'rejected_visual';
  delete m.lanes.manual_native.rejectionReason;
  assert.throws(() => validateCleanroom(m, prompt), /visual failure reason/);
});
