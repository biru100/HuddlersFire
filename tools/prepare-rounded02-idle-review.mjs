// One scoped replay of the documented, exact-byte LOOKDEV selection.
// Does not invent decisions, approve motion, change policy, or touch runtime art.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { prepareArtJob, receiveArtSubmission, buildArtJob, renderArtReview, verifyArtReview } from './lib/art-direction.mjs';
import { prepareMotionJob, receiveMotionJob, inspectMotionJob } from './motion-lookdev.mjs';
import { verifyRegistry } from './art-source-registry.mjs';
import { motionAnalysisHtml } from './lib/motion-analysis.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const rel = p => relative(root, p).replaceAll('\\', '/');
const json = p => JSON.parse(readFileSync(p, 'utf8'));
const save = (p, v) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 2) + '\n', { flag: 'wx' }); };
const hash = b => createHash('sha256').update(b).digest('hex');
const approvalPath = 'docs/reviews/2026-11-07-rounded02-rev2-art-approval.md';
const approval = readFileSync(join(root, approvalPath), 'utf8');
const quote = '일단 확정하자 나쁘지 않은 것 같아';
assert.ok(approval.includes(quote), 'Missing recorded user selection');
const criteria = {};
for (const match of approval.matchAll(/^\| `([^`]+)` \| pass \([^|]+\) \| (.+) \|$/gm)) criteria[match[1]] = { result: 'pass', observation: match[2] };
assert.equal(Object.keys(criteria).length, 6, 'Missing actual ChatGPT criterion observations');
const reference = `${approvalPath} — 2026-11-07 ChatGPT 대화 「Rounded 02 Rev2 미술 검토 결과」 및 직후 사용자 선택. 대화 URL 확인 불가; 새 평가가 아닌 문서의 기존 평가를 전사.`;
const output = join(root, 'docs/reviews/rounded02-idle-v1-20261108');
const views = ['nw', 'se'];
const design = verifyRegistry('art/sprites/source-registry/rounded02-rev2-lookdev/MANIFEST.json', { root });
const motion = verifyRegistry('art/sprites/source-registry/rounded02-idle-motion-01/MANIFEST.json', { root });
const plans = views.map(view => ({ view, parentDir: join(root, `art/sprites/runs/lookdev-${view}-rounded02-rev2-approved-20261108`), motionDir: join(root, `art/sprites/runs/motion-${view}-rounded02-idle-v1-20261108`),
  design: design.files.find(f => f.slot === view), motion: motion.files.find(f => f.slot === view) }));
assert.ok(!existsSync(output), 'Review bundle exists: preserve it, do not overwrite');
for (const p of plans) {
  assert.ok(approval.includes(p.design.sha256), 'Selection document must reference exact original hash');
  assert.ok(!existsSync(p.parentDir) && !existsSync(p.motionDir), 'Job exists: inspect existing lineage rather than reusing or overwriting it');
}
const protectedPaths = ['web/app', 'web/lib', 'web/public', 'tools/lib/art-direction.mjs', 'art/sprites/art-direction.json',
  ...plans.flatMap(p => [p.design.path, p.motion.path]), 'art/sprites/runs/lookdev-nw-rounded-02-rev2', 'art/sprites/runs/lookdev-se-rounded-02-rev2'];
function snapshot() {
  const result = {};
  function walk(p) {
    if (!existsSync(p)) return;
    const stat = readdirSafe(p);
    if (stat) for (const name of stat) walk(join(p, name));
    else result[rel(p)] = hash(readFileSync(p));
  }
  for (const p of protectedPaths) walk(join(root, p));
  return result;
}
function readdirSafe(p) { try { return readdirSync(p).sort(); } catch (e) { if (e.code === 'ENOTDIR') return null; throw e; } }
const before = snapshot(), manifest = { version: 1, kind: 'parent-lookdev-and-pending-motion-evidence', approvalDocument: approvalPath, approvalDocumentSha256: hash(approval.replaceAll('\r\n', '\n')), approvalDocumentHashPolicy: 'UTF-8 text normalized to LF; PNG hashes are always exact bytes',
  designApprovalScope: 'LOOKDEV_ONLY', motionDecision: 'pending', animationApproved: false, productionReady: false, runtimeVerified: false, views: [] };
mkdirSync(output, { recursive: true });
for (const p of plans) {
  prepareArtJob({ root, out: p.parentDir.split(/[\\/]/).at(-1), stage: 'lookdev', variation: 'rounded', view: p.view });
  const job = join(p.parentDir, 'job.json'), review = join(p.parentDir, 'art-review.json');
  const sourceUrl = `https://github.com/biru100/HuddlersFire/blob/602c28c5c897e7425cbb328bf1f7d9cdeb6b70ba/${p.design.path}`;
  receiveArtSubmission(job, join(root, p.design.path), { root, reference: sourceUrl });
  const intake = await buildArtJob(job, { root });
  assert.equal(intake.blockers.length, 0, 'Design technical blockers prohibit approval transcription');
  renderArtReview(job, { root });
  const decision = { ...json(join(p.parentDir, 'art-review.template.json')), reviewer: '사용자 (승인 문서의 실제 선택)', reviewerRole: 'user', decision: 'approved',
    artDirectorReview: { actor: 'chatgpt', reference, summary: '기존 ChatGPT 미술 평가의 LOOKDEV 수준 여섯 기준 통과를 해당 승인 해시 원본에 연결. 네이티브·게임 장면은 미검증.' },
    userDecision: { quote, reference }, criteria, unresolved: [], approvalScope: 'LOOKDEV_ONLY', productionReady: false, runtimeVerified: false };
  save(review, decision);
  const proof = verifyArtReview(job, review, { root });
  assert.equal(proof.sourceSha256, p.design.sha256);
  prepareMotionJob({legacySheet:true, root, view: p.view, out: p.motionDir.split(/[\\/]/).at(-1), parentJob: job, parentReview: review });
  const motionJob = join(p.motionDir, 'job.json');
  receiveMotionJob(motionJob, join(root, p.motion.path), { root, sourceReference: `https://github.com/biru100/HuddlersFire/blob/602c28c5c897e7425cbb328bf1f7d9cdeb6b70ba/${p.motion.path}` });
  const inspected = await inspectMotionJob(motionJob, { root });
  assert.equal(inspected.sourceSha256, p.motion.sha256);
  const analysis = json(join(p.motionDir, 'build/motion-analysis.json'));
  const parentOriginal = readFileSync(join(root, p.design.path)), original = readFileSync(join(root, p.motion.path));
  writeFileSync(join(output, `${p.view}-review.html`), motionAnalysisHtml(analysis, original, parentOriginal), { flag: 'wx' });
  save(join(output, `${p.view}-analysis.json`), analysis);
  const evidence = join(output, 'evidence', p.view);
  for (const [directory, files] of [[p.parentDir, ['job.json', 'submission.json', 'art-review.json', 'CHATGPT_REQUEST.txt', 'build/art-intake.json']],
    [p.motionDir, ['job.json', 'submission.json', 'motion-review.template.json', 'CHATGPT_REQUEST.txt', 'build/motion-intake.json']]]) {
    const role = directory === p.parentDir ? 'parent' : 'motion';
    for (const file of files) { const destination = join(evidence, role, file); mkdirSync(dirname(destination), { recursive: true }); copyFileSync(join(directory, file), destination); }
  }
  manifest.views.push({ view: p.view, parent: { job: rel(job), review: rel(review), ...proof }, motion: { job: rel(motionJob), originalSha256: analysis.originalSha256, decision: 'pending', artApproved: false, productionReady: false, runtimeVerified: false },
    report: `${p.view}-analysis.json`, preview: `${p.view}-review.html`, sourceDesign: p.design.path, sourceMotion: p.motion.path });
}
assert.deepEqual(snapshot(), before, 'Originals, legacy local candidates or runtime files changed');
save(join(output, 'lineage.json'), manifest);
save(join(output, 'preservation.json'), { allUnchanged: true, files: before });
console.log(JSON.stringify({ output: rel(output), parentApprovals: manifest.views.map(p => p.parent), motionDecision: 'pending', productionReady: false, runtimeVerified: false }, null, 2));
