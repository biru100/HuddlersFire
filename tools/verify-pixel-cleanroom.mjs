// Clean-room generation manifest: technical provenance guard, NOT a visual quality score.
// Reuses the static RGB/RGBA8 PNG intake check for delivered candidates. No external calls.
import { readFileSync, existsSync, lstatSync } from 'node:fs';
import { resolve, relative, dirname, sep, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import { inspectBatchPng } from './chat-asset-batch.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GATES = ['concept','base','modular','motion','runtime','publish'];
const LANES = ['native_pixel', 'generic_aligned', 'manual_native'];
const ALLOWED_STATES = new Set(['not_run', 'blocked_provider_unavailable', 'review_candidate', 'rejected_visual']);
const BAD_PROMPT = /https?:\/\/|\b(?:rounded[ _-]?0?[12]|core03|source[ _-]?registry|lookdev|nw[ _-]?idle|prior[ _-]?png|previous[ _-]?sprite)\b|\.(?:png|jpe?g|webp|gif)(?:\b|$)/i;
const SHA256 = /^[a-f0-9]{64}$/i;
const TOP_KEYS = ['schemaVersion','taskId','mode','promptFile','pastImageInputs','referenceImages','paletteImages','imageToImage','externalPaidGenerationAllowed','approvedNativeCanvas','approval','lanes'];
const LANE_KEYS = ['status','provider','actualModelId','sourceImages','output','costUsd','rejectionReason'];
const OUTPUT_KEYS = ['path','sha256','provenance','usageRights'];
function onlyKeys(object, allowed, label) {
  check(object && typeof object === 'object' && !Array.isArray(object), 'invalid ' + label);
  check(Object.keys(object).every(k => allowed.includes(k)), 'unexpected field in ' + label + ' (possible hidden reference input)');
}

function check(condition, reason) {
  if (!condition) throw new Error('Clean-room STOP: ' + reason);
}
function safeRelativePath(path) {
  check(typeof path === 'string' && path.length > 0, 'file path must be nonempty');
  check(!path.includes('\\') && !path.includes('\0'), 'unsafe file path');
  const absolute = resolve(ROOT, path);
  const rel = relative(ROOT, absolute);
  check(rel && !rel.startsWith('..' + sep) && rel !== '..' && !rel.startsWith(sep), 'path escapes repository');
  let current = ROOT;
  for (const segment of rel.split(sep)) {
    current = join(current, segment);
    check(!existsSync(current) || !lstatSync(current).isSymbolicLink(), 'symlink in file path');
  }
  return absolute;
}
function zeroImages(value, label) {
  check(Array.isArray(value) && value.length === 0, label + ' must be empty');
}

export function validateCleanroom(manifest, prompt) {
  check(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'invalid manifest');
  onlyKeys(manifest, TOP_KEYS, 'manifest');
  check(manifest.schemaVersion === 1, 'schemaVersion must be 1');
  check(manifest.taskId === 'HF-ART-CLEANROOM-20261118', 'incorrect task ID');
  check(manifest.mode === 'text-only-cleanroom', 'text-only source required');
  check(manifest.imageToImage === false, 'image-to-image not authorized');
  check(manifest.externalPaidGenerationAllowed === false, 'paid API calls not authorized');
  check(manifest.approvedNativeCanvas === null, 'native canvas has not been approved');
  zeroImages(manifest.pastImageInputs, 'pastImageInputs');
  zeroImages(manifest.referenceImages, 'referenceImages');
  zeroImages(manifest.paletteImages, 'paletteImages');
  check(typeof prompt === 'string' && prompt.length > 100, 'missing positive-only prompt');
  check(!BAD_PROMPT.test(prompt), 'creative prompt contains an old-image reference or URL');
  check(manifest.promptFile === 'docs/briefs/cleanroom-pixel-generation-20261118.txt', 'use approved positive-only prompt file');
  onlyKeys(manifest.lanes, LANES, 'lanes');
  const keys = Object.keys(manifest.lanes).sort();
  check(JSON.stringify(keys) === JSON.stringify([...LANES].sort()), 'expected exactly three comparison lanes');
  for (const lane of LANES) {
    const info = manifest.lanes[lane];
    check(info && typeof info === 'object', 'missing lane ' + lane);
    onlyKeys(info, LANE_KEYS, lane);
    check(ALLOWED_STATES.has(info.status), 'unsupported lane status ' + lane);
    if (info.status === 'rejected_visual') check(typeof info.rejectionReason === 'string' && info.rejectionReason.trim().length >= 25, 'rejected candidate must record visual failure reason: ' + lane);
    if (info.status !== 'rejected_visual') check(info.rejectionReason === undefined, 'rejection reason only valid for rejected_visual: ' + lane);
    zeroImages(info.sourceImages, lane + '.sourceImages');
    check(typeof info.provider === 'string' && info.provider.length > 0, 'missing provider description');
    if (info.status === 'not_run' || info.status === 'blocked_provider_unavailable') {
      check(info.output === null && info.actualModelId === null && info.costUsd === null, 'unrun lane has fabricated output/model/cost: ' + lane);
    } else {
      check(info.output && typeof info.output === 'object', 'review candidate requires real output for ' + lane);
      onlyKeys(info.output, OUTPUT_KEYS, lane + '.output');
      const p = info.output.path;
      check(typeof p === 'string' && p.startsWith('art/sprites/cleanroom-pilot/outputs/' + lane + '/') && /\.png$/i.test(p), 'output must be a lane-isolated PNG for ' + lane);
      check(relative(ROOT, safeRelativePath(p)).split(sep).join('/') === p, 'output path must be canonical');
      check(info.actualModelId === null || (typeof info.actualModelId === 'string' && info.actualModelId.trim()), 'invalid actual model ID');
      check(SHA256.test(info.output.sha256), 'output sha256 missing for ' + lane);
      check(typeof info.output.provenance === 'string' && info.output.provenance.trim(), 'provenance missing for ' + lane);
      check(Number.isFinite(info.costUsd) && info.costUsd >= 0, 'actual cost unknown for ' + lane);
      check(typeof info.output.usageRights === 'string' && info.output.usageRights.trim(), 'usage permission evidence missing for ' + lane);
    }
  }
  onlyKeys(manifest.approval, GATES, 'approval');
  check(GATES.every(gate => Object.hasOwn(manifest.approval, gate)), 'expected six pending approval gates');
  for (const [gate, state] of Object.entries(manifest.approval)) {
    check(state === 'pending_user', 'this comparison manifest cannot self-approve ' + gate);
  }
  return {
    taskId: manifest.taskId,
    sourceMode: manifest.mode,
    promptSha256: createHash('sha256').update(prompt, 'utf8').digest('hex'),
    lanes: Object.fromEntries(LANES.map(x => [x, manifest.lanes[x].status])),
    verified: 'generation-input contract only; not art approval'
  };
}

export function verifyLocalOutputs(manifest) {
  const checks = [];
  for (const lane of LANES) {
    const info = manifest.lanes[lane];
    if (info.status !== 'review_candidate' && info.status !== 'rejected_visual') continue;
    const file = safeRelativePath(info.output.path);
    check(existsSync(file), 'missing actual file: ' + info.output.path);
    const bytes = readFileSync(file);
    const actual = createHash('sha256').update(bytes).digest('hex');
    check(actual === info.output.sha256.toLowerCase(), 'output digest mismatch: ' + lane);
    const png = inspectBatchPng(bytes);
    checks.push({ lane, path: info.output.path, sha256: actual, width: png.width, height: png.height, color: png.color });
  }
  return checks;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const arg = process.argv[2] || 'art/sprites/cleanroom-pilot/manifest.json';
    const manifest = JSON.parse(readFileSync(safeRelativePath(arg), 'utf8'));
    const prompt = readFileSync(safeRelativePath(manifest.promptFile), 'utf8');
    const report = validateCleanroom(manifest, prompt);
    report.checkedOutputs = verifyLocalOutputs(manifest);
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } catch (error) {
    process.stderr.write(String(error.message || error) + '\n');
    process.exitCode = 1;
  }
}
