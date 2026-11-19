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
const LANE_KEYS = ['status','provider','actualModelId','sourceImages','output','companionOutputs','costUsd','rejectionReason'];
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
      check(info.companionOutputs === undefined, 'unrun lane cannot have companion outputs');
      check(info.output === null && info.actualModelId === null && info.costUsd === null, 'unrun lane has fabricated output/model/cost: ' + lane);
    } else {
      check(info.output && typeof info.output === 'object', 'review candidate requires real output for ' + lane);
      check(Array.isArray(info.companionOutputs ?? []), 'invalid companion outputs');
      const outputs = [info.output, ...(info.companionOutputs ?? [])];
      check(new Set(outputs.map(o => o?.path)).size === outputs.length, 'duplicate output path');
      for (const output of outputs) {
        onlyKeys(output, OUTPUT_KEYS, lane + '.output');
        const p = output.path;
        check(typeof p === 'string' && p.startsWith('art/sprites/cleanroom-pilot/outputs/' + lane + '/') && /\.png$/i.test(p), 'output must be a lane-isolated PNG for ' + lane);
        check(relative(ROOT, safeRelativePath(p)).split(sep).join('/') === p, 'output path must be canonical');
        check(SHA256.test(output.sha256), 'output sha256 missing for ' + lane);
        check(typeof output.provenance === 'string' && output.provenance.trim(), 'provenance missing for ' + lane);
        check(typeof output.usageRights === 'string' && output.usageRights.trim(), 'usage permission evidence missing for ' + lane);
      }
      check(info.actualModelId === null || (typeof info.actualModelId === 'string' && info.actualModelId.trim()), 'invalid actual model ID');
      check(Number.isFinite(info.costUsd) && info.costUsd >= 0, 'actual cost unknown for ' + lane);
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
    for (const output of [info.output, ...(info.companionOutputs ?? [])]) {
      const file = safeRelativePath(output.path);
      check(existsSync(file), 'missing actual file: ' + output.path);
      const bytes = readFileSync(file);
      const actual = createHash('sha256').update(bytes).digest('hex');
      check(actual === output.sha256.toLowerCase(), 'output digest mismatch: ' + lane);
      const png = inspectBatchPng(bytes);
      checks.push({ lane, path: output.path, sha256: actual, width: png.width, height: png.height, color: png.color });
    }
  }
  return checks;
}

const ROLES = ['camper', 'bench', 'ground'];
const REVIEW_FRAMES = {'desktop-before':[1050,824], 'desktop-candidate':[1050,824], 'mobile-before':[390,520], 'mobile-candidate':[390,520], board:[822,828]};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export function verifySceneReview(m, path, mode = 'verify') {
  onlyKeys(m, ['schemaVersion','job','mode','referenceImages','pastImageInputs','paletteImages','imageToImage','externalPaidGenerationAllowed','provider','actualModelId','usageRights','approval','briefs','files'], 'scene receipt');
  check(m.schemaVersion === 2 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.job), 'invalid scene job');
  const root = 'art/sprites/scene-reviews/' + m.job + '/';
  check(path === root + 'manifest.json', 'receipt must belong to its own job directory');
  check(m.mode === 'text-only-cleanroom' && m.imageToImage === false && m.externalPaidGenerationAllowed === false, 'text-only source, no paid API');
  for (const key of ['pastImageInputs','referenceImages','paletteImages']) zeroImages(m[key], key);
  check(typeof m.provider === 'string' && m.provider.trim() && (m.actualModelId === null || typeof m.actualModelId === 'string' && m.actualModelId.trim()), 'provider and actual model disclosure required');
  check(typeof m.usageRights === 'string' && m.usageRights.trim(), 'usage permission evidence missing');
  onlyKeys(m.approval, GATES, 'approval');
  check(GATES.every(key => m.approval[key] === 'pending_user'), 'scene receipt cannot self-approve a gate');
  onlyKeys(m.briefs, ROLES, 'briefs');
  const read = name => readFileSync(safeRelativePath(root + name));
  for (const role of ROLES) {
    const bytes = read('briefs/' + role + '.txt'), prompt = bytes.toString('utf8');
    check(prompt.length > 100 && !BAD_PROMPT.test(prompt), 'creative brief contains an old-image reference or is missing');
    check(hash(bytes) === m.briefs[role], 'brief digest mismatch: ' + role);
  }
  check(['preflight','inventory','verify'].includes(mode), 'unknown verification mode');
  if (mode === 'preflight') return {job:m.job, verified:'text-only briefs and input contract'};

  const recipeBytes = read('recipe.json'), recipe = JSON.parse(recipeBytes);
  const files = {'recipe.json':hash(recipeBytes)};
  function inspect(name, size, alpha) {
    const png = inspectBatchPng(read(name));
    if (size) check(png.width === size[0] && png.height === size[1], 'unexpected dimensions: ' + name);
    if (alpha) check(png.color === 'RGBA8', 'alpha channel required: ' + name);
    files[name] = png.sha256;
  }
  for (const role of ROLES) {
    inspect('originals/' + role + '.png', null, true);
    inspect('game/' + role + '.png', recipe[role].canvas, true);
    if (recipe[role].regions.length > 1) {
      for (const region of recipe[role].regions) {
        check(/^[a-z][a-z0-9-]*$/.test(region.name), 'unsafe layer name');
        inspect('layers/' + region.name + '.png', recipe[role].canvas, true);
      }
    }
  }
  for (const [name, size] of Object.entries(REVIEW_FRAMES)) inspect('review/' + name + '.png', size, false);
  for (const device of ['desktop','mobile']) {
    check(files['review/'+device+'-before.png'] !== files['review/'+device+'-candidate.png'], 'identical before and candidate frames: '+device);
  }
  if (mode === 'inventory') return files;
  onlyKeys(m.files, Object.keys(files), 'submitted files');
  for (const [name, digest] of Object.entries(files)) check(m.files[name] === digest, 'missing or mismatched digest: ' + name);
  return {job:m.job, files:Object.keys(files).length, verified:'recorded PNGs, dimensions, recipe and text-only provenance', approval:m.approval};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const arg = process.argv[2] || 'art/sprites/cleanroom-pilot/manifest.json';
    const manifest = JSON.parse(readFileSync(safeRelativePath(arg), 'utf8'));
    let report;
    if (manifest.schemaVersion === 2) {
      const mode = process.argv[3]?.replace(/^--/, '') || 'verify';
      report = verifySceneReview(manifest, arg, mode);
    } else {
      const prompt = readFileSync(safeRelativePath(manifest.promptFile), 'utf8');
      report = validateCleanroom(manifest, prompt);
      report.checkedOutputs = verifyLocalOutputs(manifest);
    }
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } catch (error) {
    process.stderr.write(String(error.message || error) + '\n');
    process.exitCode = 1;
  }
}
