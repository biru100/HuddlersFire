// Restore persisted evidence into fresh local runs, then use the existing gates.
// Never creates a new approval or changes an existing run.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { ART_ROOT, verifyArtReview, renderArtReview } from './lib/art-direction.mjs';
import { loadMotionJob, inspectMotionJob } from './motion-lookdev.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = p => JSON.parse(readFileSync(p, 'utf8'));
export async function restoreRounded02Review({ root = ART_ROOT } = {}) {
  const bundle = join(root, 'docs/reviews/rounded02-idle-v1-20261108'), lineage = read(join(bundle, 'lineage.json'));
  assert.equal(hash(readFileSync(join(root, lineage.approvalDocument), 'utf8').replaceAll('\r\n', '\n')), lineage.approvalDocumentSha256, 'Approval document changed; inspect before restoring');
  for (const item of lineage.views) for (const kind of ['parent', 'motion']) {
    const name = kind === 'parent' ? `lookdev-${item.view}-rounded02-rev2-approved-20261108` : `motion-${item.view}-rounded02-idle-v1-20261108`;
    assert.equal(item[kind].job, `art/sprites/runs/${name}/job.json`, 'Unexpected evidence path');
    assert.ok(!existsSync(dirname(join(root, item[kind].job))), 'Run already exists; verify it in place, never overwrite');
  }
  for (const item of lineage.views) {
    const parent = dirname(join(root, item.parent.job)), motion = dirname(join(root, item.motion.job));
    const design = readFileSync(join(root, item.sourceDesign)), sheet = readFileSync(join(root, item.sourceMotion));
    assert.equal(hash(design), item.parent.sourceSha256); assert.equal(hash(sheet), item.motion.originalSha256);
    for (const [kind, target, files] of [['parent', parent, ['job.json', 'submission.json', 'art-review.json', 'CHATGPT_REQUEST.txt', 'build/art-intake.json']], ['motion', motion, ['job.json', 'submission.json', 'motion-review.template.json', 'CHATGPT_REQUEST.txt', 'build/motion-intake.json']]]) {
      for (const file of files) { mkdirSync(dirname(join(target, file)), { recursive: true }); copyFileSync(join(bundle, 'evidence', item.view, kind, file), join(target, file)); }
    }
    mkdirSync(join(parent, 'source'), { recursive: true }); writeFileSync(join(parent, 'source/candidate.png'), design, { flag: 'wx' });
    const proof = verifyArtReview(item.parent.job, item.parent.review, { root });
    assert.equal(proof.fingerprint, item.parent.fingerprint); assert.equal(proof.sourceSha256, item.parent.sourceSha256);
    renderArtReview(item.parent.job, { root });
    mkdirSync(join(motion, 'source'), { recursive: true }); writeFileSync(join(motion, 'source/candidate.png'), sheet, { flag: 'wx' });
    writeFileSync(join(motion, 'REFERENCE.png'), design, { flag: 'wx' });
    loadMotionJob(item.motion.job, { root });
    await inspectMotionJob(item.motion.job, { root });
  }
  return { restored: lineage.views.length, approvalScope: 'LOOKDEV_ONLY', motionDecision: 'pending', productionReady: false, runtimeVerified: false };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) console.log(JSON.stringify(await restoreRounded02Review(), null, 2));
