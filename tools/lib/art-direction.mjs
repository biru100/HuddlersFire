// External artwork handoff within the existing prepare -> rebuild -> render -> review tools.
// No image generation, network calls, resizing, quantization or runtime installation.
import {readFileSync, writeFileSync, mkdirSync, existsSync, realpathSync, copyFileSync} from 'node:fs';
import {resolve, relative, dirname, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

export const ART_ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const ART_STAGES = ['lookdev', 'native-base'];
const POLICY = 'art/sprites/art-direction.json';
const SPEC = 'art/sprites/scene-spec.json';
const REQUIRED_CRITERIA = ['silhouette', 'direction', 'pixel-language', 'palette', 'character-appeal', 'scene-fit'];
const digest = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const json = file => JSON.parse(readFileSync(file, 'utf8'));
const save = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const text = value => typeof value === 'string' && value.trim().length > 0;
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const sourceHash = () => digest(readFileSync(fileURLToPath(import.meta.url), 'utf8').replaceAll('\r\n', '\n'));

export function artPath(root, name) {
  if (!text(name)) throw Error('A nonempty project-relative path is required');
  const base = resolve(root), path = resolve(base, name), rel = relative(base, path);
  const escaped = s => s === '..' || s.startsWith('../') || s.startsWith('..\\') || isAbsolute(s);
  if (escaped(rel)) throw Error('Path outside project: ' + name);
  let ancestor = path;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  if (escaped(relative(realpathSync(base), realpathSync(ancestor)))) throw Error('Symlink outside project: ' + name);
  return path;
}
function projectRelative(root, file) { return relative(resolve(root), artPath(root, file)).replaceAll('\\', '/'); }
export function readArtContext(root = ART_ROOT) {
  const policy = json(artPath(root, POLICY)), pixel = json(artPath(root, SPEC)).pixelQuarterview;
  if (policy.version !== 1 || !text(policy.generation?.requestedModel) || policy.generation?.surface !== 'chatgpt' || policy.generation.allowSilentFallback !== false || policy.generation.allowPaidApi !== false || !equal(policy.criteria, REQUIRED_CRITERIA)) throw Error('Invalid external-art policy');
  if (!pixel?.avatar || !equal(pixel.projection?.tile, [80, 40])) throw Error('Expected the existing 80x40 quarter-view contract');
  const {canvas, feet, head, seat, states} = pixel.avatar;
  if (!Array.isArray(canvas) || canvas.length !== 2 || canvas.some(n => !Number.isInteger(n) || n <= 0)) throw Error('Missing native canvas proposal');
  for (const p of [feet, head]) if (!Array.isArray(p) || p.length !== 2 || p.some((n, i) => !Number.isInteger(n) || n < 0 || n >= canvas[i])) throw Error('Invalid proposed anchor');
  const contract = {projection: pixel.projection, avatar: {canvas, feet, head, seat, states}};
  return {policy, contract, policyHash: digest(policy), contractHash: digest(contract)};
}
export function artPrompt(job) {
  const a = job.contract.avatar;
  const common = 'Huddlers Fire는 친구들이 불 옆에서 쉬고, 각자 작업하고, 장난치며 게임을 소개하는 작은 캠프야. 따뜻한 피부/목재, 절제된 녹색과 청록, 분명한 색면과 짙은 갈색 윤곽의 픽셀 아트로 만들어 줘. 카메라는 고정 쿼터뷰이며 월드 축은 화면에서 ±0.5 기울기야. 기존 사진은 사용하지 마.';
  if (job.stage === 'lookdev') {
    const styles = {
      compact: '머리와 몸이 모두 읽히는 작고 단단한 실루엣, 크게 구분되는 후드와 신발, 세부 질감보다 좋은 형태.',
      rounded: '부드럽고 둥근 실루엣, 약간 여유 있는 후드티, 묶음 단위로 정돈된 명암. 길고 가는 팔다리는 피함.',
      graphic: '큰 색면과 간결한 외곽, 옷의 접힘과 머리카락을 적게 써도 개성 있는 실루엣. 그림자를 진하게 뭉치지 않음.'
    };
    return `${common}\n\n이번에는 완성된 착의 캐릭터의 미술 기준 시안 한 장만 만들어 줘. ${styles[job.variation]}\n화면 왼쪽 위를 바라보는 NW 뒷사선 idle 한 명. 등이 보이고 얼굴은 보이지 않음. 짧은 곱슬머리, 세이지 후드티, 단정한 바지와 갈색 신발. 눈에 먼저 들어오는 실루엣과 옷의 형태를 우선해 줘.\n독립된 단일 캐릭터만, 잘림 없이 중립적인 밝기와 투명 배경. 여러 방향, 프레임 시트, UI, 글자, 모닥불 조명, 광선, 바닥 그림자는 제외해 줘.\n의도적인 픽셀 색면과 일정한 계단형 외곽을 사용해 줘. 반짝이는 점, 불규칙한 가짜 도트, 늘인 팔다리는 피하고 실제 게임에서 작게 보아도 형태가 읽히게 해 줘.\n이것은 LOOKDEV_ONLY 시안이며 ${a.canvas.join('×')} 납품 원화가 아니야. 출력은 도구의 실제 해상도로 보존하고 자동 축소·양자화·코드로 다시 그리기를 하지 마. 이 시안을 그대로 게임에 넣거나 규격 통과라고 주장하지 마.\n이번 후보만 검토하고 마음에 드는 디자인을 선택한 뒤 기본 신체를 제작할 거야.\n`;
  }
  return `${common}\n\n첨부 REFERENCE.png는 사용자가 선택한 착의 캐릭터의 실루엣·비율·색감 기준이야. 이번에는 같은 디자인 계열의 기본 신체/피부만 NW 뒷사선 idle 한 컷으로 새로 제작해 줘. 등은 보이고 얼굴은 보이지 않아야 해. 머리카락·표정·상의·하의·액세서리는 제외하고, 해부학적 상세 없는 중립적인 게임용 마네킹으로 그려 줘.\n제작 목표는 ${a.canvas.join('×')} 논리 픽셀, feet=(${a.feet.join(',')}), head=(${a.head.join(',')}). 좌면 앵커는 이 정지 컷에 적용하지 않아. 목표가 비율을 망치면 임의로 늘이지 말고 불일치를 알려 줘.\n1px 격자에 연결된 색면과 일정한 윤곽/명암, 실제 투명 PNG와 alpha 0/255만 사용해 줘. 안티앨리어싱·디더링·글로우·바닥 그림자·라벨 금지. 정확한 6색 제한은 폐기하며 따뜻한 명암을 살려 줘.\n한 장의 원본 PNG, 실제 크기·RGB 팔레트·앵커 정보, 가능하면 정확한 4배 최근접 복제 검토본을 제출해 줘. 다른 방향·동작·의상은 아직 만들지 마.\n중요: 생성기가 이 실제 크기/격자/알파로 만들지 못하면 원본을 보존하고 blocked_native_delivery로 알려 줘. 큰 이미지의 사후 강제 축소, 색 양자화, Python/SVG 도형 재작화로 통과시키지 마. 프롬프트만으로 크기와 격자가 보장됐다고 주장하지 마.\n`;
}
export function prepareArtJob({root = ART_ROOT, out, stage = 'lookdev', variation = 'compact', previousJob, previousReview} = {}) {
  if (!ART_STAGES.includes(stage) || !['compact', 'rounded', 'graphic'].includes(variation)) throw Error('Unknown art stage or variation');
  if (!/^[a-z][a-z0-9-]{2,79}$/.test(out || '')) throw Error('--out requires a fresh simple job name');
  const context = readArtContext(root);
  let parent = null;
  if (stage === 'native-base') {
    if (!previousJob || !previousReview) throw Error('Native base requires an explicitly approved lookdev job and review');
    const proof = verifyArtReview(previousJob, previousReview, {root});
    if (proof.stage !== 'lookdev') throw Error('Native base must follow lookdev, not another native delivery');
    parent = {job: projectRelative(root, previousJob), review: projectRelative(root, previousReview), fingerprint: proof.fingerprint, reviewHash: digest(readFileSync(artPath(root, previousReview)))};
  }
  const dir = artPath(root, 'art/sprites/runs/' + out);
  if (existsSync(dir)) throw Error('Job already exists; preserve the original and use a new name');
  mkdirSync(resolve(dir, 'source'), {recursive: true});
  const job = {version: 1, kind: 'art-direction', stage, variation, ...context, parent};
  if (parent) {
    const prior = json(artPath(root, parent.job)), priorDir = dirname(artPath(root, parent.job));
    const submission = json(resolve(priorDir, 'submission.json'));
    const original = artPath(priorDir, submission.file);
    copyFileSync(original, resolve(dir, 'REFERENCE.png'));
    job.reference = {file: 'REFERENCE.png', sha256: digest(readFileSync(original)), role: 'approved-lookdev-not-native-sprite'};
    if (prior.stage !== 'lookdev') throw Error('Invalid parent stage');
  }
  save(resolve(dir, 'job.json'), job);
  writeFileSync(resolve(dir, 'CHATGPT_REQUEST.txt'), artPrompt(job));
  save(resolve(dir, 'submission.template.json'), {file: 'source/candidate.png', sourceType: 'image-generation', surface: 'chatgpt', requestedModel: context.policy.generation.requestedModel, observedModel: null, modelEvidence: {kind: 'unverified', reference: ''}, operations: [], paletteRgb: [], frameAnchors: {feet: context.contract.avatar.feet, head: context.contract.avatar.head}, note: 'Fill with observed facts only. Do not run scripts from incoming packages.'});
  writeFileSync(resolve(dir, 'README.md'), '# Artwork handoff\n\nSend CHATGPT_REQUEST.txt and REFERENCE.png if present. Return ONE original PNG at source/candidate.png and factual submission.json (copy the template). Do not resize or redraw. Run the existing rebuild, render and review commands for this job. LOOKDEV approval is never runtime approval.\n');
  return {directory: dir, stage, status: 'awaiting_external_art', generated: false};
}
export function loadArtJob(file, {root = ART_ROOT} = {}) {
  const path = artPath(root, file), job = json(path), context = readArtContext(root);
  artPath(artPath(root, 'art/sprites/runs'), path);
  if (job.version !== 1 || job.kind !== 'art-direction' || !ART_STAGES.includes(job.stage)) throw Error('Not an art-direction job');
  if (job.policyHash !== context.policyHash || job.contractHash !== context.contractHash || digest(job.policy) !== job.policyHash || digest(job.contract) !== job.contractHash) throw Error('Stale art policy or geometry; prepare a new job');
  const dir = dirname(path);
  if (readFileSync(resolve(dir, 'CHATGPT_REQUEST.txt'), 'utf8') !== artPrompt(job)) throw Error('Compiled art prompt changed; prepare a new job');
  if (job.stage === 'lookdev' && job.parent) throw Error('Lookdev cannot inherit an approval parent');
  if (job.stage === 'native-base' && !job.parent) throw Error('Missing approved lookdev parent');
  if (job.parent) {
    const parentJob = json(artPath(root, job.parent.job));
    if (parentJob.stage !== 'lookdev' || parentJob.parent) throw Error('Invalid/cyclic lookdev lineage');
    const proof = verifyArtReview(job.parent.job, job.parent.review, {root});
    if (proof.fingerprint !== job.parent.fingerprint || digest(readFileSync(artPath(root, job.parent.review))) !== job.parent.reviewHash) throw Error('Stale parent approval');
    if (!job.reference || digest(readFileSync(artPath(dir, job.reference.file))) !== job.reference.sha256 || job.reference.sha256 !== proof.sourceSha256) throw Error('Approved reference changed');
  } else if (job.reference) throw Error('Unapproved reference in lookdev job');
  return job;
}
export function assessArtSubmission(job, receipt, metrics) {
  const blockers = [], warnings = [];
  if (receipt.surface !== 'chatgpt' || receipt.sourceType !== 'image-generation') blockers.push('unapproved_generation_route');
  if (receipt.requestedModel !== job.policy.generation.requestedModel) blockers.push('requested_model_mismatch');
  if (!Array.isArray(receipt.operations) || receipt.operations.some(op => op !== 'lossless-copy')) blockers.push('forbidden_or_unknown_transform');
  const expectedModel = job.policy.generation.requestedModel.toLowerCase();
  if (receipt.observedModel != null && (typeof receipt.observedModel !== 'string' || !(receipt.observedModel.toLowerCase() === expectedModel || receipt.observedModel.toLowerCase().startsWith(expectedModel + '-')))) blockers.push('model_mismatch_no_silent_fallback');
  if (!receipt.observedModel || receipt.modelEvidence?.kind !== 'tool-metadata' || !text(receipt.modelEvidence?.reference)) warnings.push('actual_image_model_unverified');
  if (!metrics?.bounds || metrics.alpha?.opaque + metrics.alpha?.soft <= 0) blockers.push('empty_image');
  if (job.stage === 'native-base') {
    if (!equal(metrics.size, job.contract.avatar.canvas)) blockers.push('blocked_native_delivery:canvas');
    if (metrics.alpha?.soft !== 0 || !(metrics.alpha?.transparent > 0)) blockers.push('blocked_native_delivery:binary_alpha');
    if (!Array.isArray(receipt.paletteRgb) || !receipt.paletteRgb.length || receipt.paletteRgb.some(c => !/^#[0-9a-f]{6}$/i.test(c)) || metrics.paletteMismatches !== 0) blockers.push('blocked_native_delivery:palette');
    if (!equal(receipt.frameAnchors?.feet, job.contract.avatar.feet) || !equal(receipt.frameAnchors?.head, job.contract.avatar.head)) blockers.push('blocked_native_delivery:anchor_metadata');
  }
  return {status: blockers.length ? 'blocked' : 'awaiting_visual_review', blockers, warnings, artApproved: false, productionReady: false, runtimeVerified: false, semanticAnchorsVerified: false};
}
function artFingerprint(job, receipt, metrics) { return digest({job, receipt, metrics, harness: sourceHash()}); }
export async function buildArtJob(file, {root = ART_ROOT} = {}) {
  const job = loadArtJob(file, {root}), dir = dirname(artPath(root, file)), receipt = json(resolve(dir, 'submission.json'));
  const imageFile = artPath(artPath(dir, 'source'), artPath(dir, receipt.file));
  const bytes = readFileSync(imageFile);
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw Error('Original PNG required');
  // Use the project's existing raster inspector; do not introduce another decoder or processor.
  const {inspectImage} = await import('./pixel-assets.mjs');
  const palette = Array.isArray(receipt.paletteRgb) && receipt.paletteRgb.length && receipt.paletteRgb.every(c => /^#[0-9a-f]{6}$/i.test(c)) ? receipt.paletteRgb : null;
  const metrics = await inspectImage(imageFile, palette), assessment = assessArtSubmission(job, receipt, metrics);
  if (metrics.sha256 !== digest(bytes)) throw Error('Raster inspector/source mismatch');
  const fingerprint = artFingerprint(job, receipt, metrics), build = resolve(dir, 'build');
  mkdirSync(build, {recursive: true});
  save(resolve(build, 'art-intake.json'), {version: 1, stage: job.stage, fingerprint, sourceSha256: metrics.sha256, metrics, ...assessment});
  save(resolve(dir, 'art-review.template.json'), {version: 1, fingerprint, reviewer: '', reviewerRole: 'user', decision: 'pending', userDecision: {quote: '', reference: ''}, criteria: Object.fromEntries(job.policy.criteria.map(id => [id, {result: 'unreviewed', observation: ''}])), unresolved: [], note: 'A human art-direction decision only; native production still requires pixel/scene/feature checks.'});
  return {fingerprint, stage: job.stage, ...assessment};
}
export function validateArtDecision(review, job, intake) {
  if (review.fingerprint !== intake.fingerprint) throw Error('Stale artwork review');
  if (intake.blockers.length) throw Error('Technical/provenance blockers remain: ' + intake.blockers.join(', '));
  if (review.decision !== 'approved' || review.reviewerRole !== 'user' || !text(review.reviewer) || !text(review.userDecision?.quote) || !text(review.userDecision?.reference)) throw Error('Explicit user art approval with a real decision reference is required; never invent it');
  if (!Array.isArray(review.unresolved) || review.unresolved.length) throw Error('Unresolved art issues');
  for (const id of job.policy.criteria) if (review.criteria?.[id]?.result !== 'pass' || !text(review.criteria[id].observation)) throw Error('Unreviewed aesthetic criterion: ' + id);
  return {stage: job.stage, fingerprint: intake.fingerprint, sourceSha256: intake.sourceSha256, artApproved: true, productionReady: false, runtimeVerified: false};
}
export function verifyArtReview(file, reviewFile, {root = ART_ROOT} = {}) {
  const job = loadArtJob(file, {root}), dir = dirname(artPath(root, file)), receipt = json(resolve(dir, 'submission.json'));
  const intake = json(resolve(dir, 'build/art-intake.json')), review = json(artPath(root, reviewFile));
  const bytes = readFileSync(artPath(artPath(dir, 'source'), artPath(dir, receipt.file)));
  if (!sha(intake.sourceSha256) || digest(bytes) !== intake.sourceSha256 || intake.metrics?.sha256 !== intake.sourceSha256 || artFingerprint(job, receipt, intake.metrics) !== intake.fingerprint) throw Error('Stale artwork source, receipt or tool');
  const assessment = assessArtSubmission(job, receipt, intake.metrics);
  if (!equal(assessment.blockers, intake.blockers)) throw Error('Altered technical verdict');
  return validateArtDecision(review, job, intake);
}
export function verifyPixelArtApproval(job, review, {root = ART_ROOT} = {}) {
  const link = review.artDirection;
  if (!link?.job || !link?.review) throw Error('Pixel release requires artDirection.job/review, not only technical PASS');
  const proof = verifyArtReview(link.job, link.review, {root});
  if (proof.stage !== 'lookdev') throw Error('Pixel art baseline must be an approved lookdev');
  if (review.userDecision?.actor !== 'user' || !text(review.userDecision.quote) || !text(review.userDecision.reference)) throw Error('User approval of the assembled pixel pilot is required');
  const entries = job.catalog.assets.filter(a => a.pilot && !a.review?.rejected);
  if (!entries.length) throw Error('No active pixel pilot');
  for (const asset of entries) {
    const approved = link.assets?.find(a => a.id === asset.id);
    if (!approved || approved.sha256 !== digest(readFileSync(artPath(root, asset.file)))) throw Error('Unapproved/stale pixel asset: ' + asset.id);
  }
  return proof;
}
export function renderArtReview(file, {root = ART_ROOT} = {}) {
  const job = loadArtJob(file, {root}), dir = dirname(artPath(root, file)), receipt = json(resolve(dir, 'submission.json'));
  const intake = json(resolve(dir, 'build/art-intake.json'));
  const bytes = readFileSync(artPath(artPath(dir, 'source'), artPath(dir, receipt.file)));
  if (digest(bytes) !== intake.sourceSha256 || artFingerprint(job, receipt, intake.metrics) !== intake.fingerprint) throw Error('Rebuild after source/receipt changes');
  const [w, h] = intake.metrics.size;
  const img = `data:image/png;base64,${bytes.toString('base64')}`;
  const scale = job.stage === 'native-base' ? 1 : Math.min(1, 384 / h);
  const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Huddlers art review</title><style>body{font:16px system-ui;margin:24px;background:#eee7d9;color:#2c241c}section{display:flex;gap:16px;flex-wrap:wrap}.panel{padding:24px}.night{background:#142c30;color:#f8f0db}.day{background:#c3c79b}img{image-rendering:pixelated;max-width:none}code{word-break:break-all}</style><h1>${job.stage}: 승인 대기</h1><p>원본 ${w}×${h}. ${job.stage === 'lookdev' ? '시안 표시용 축소만 적용. 원본 파일은 변경하지 않음. 네이티브 스프라이트 아님.' : '1배 / 정확한 4배 CSS 픽셀 복제 비교. PNG 파일은 변경하지 않음.'}</p><section><div class="panel day"><h2>밝은 바탕</h2><img width="${w * scale}" height="${h * scale}" src="${img}"></div><div class="panel night"><h2>어두운 바탕</h2><img width="${w * scale}" height="${h * scale}" src="${img}"></div>${job.stage === 'native-base' ? `<div class="panel"><h2>4배</h2><img width="${w * 4}" height="${h * 4}" src="${img}"></div>` : ''}</section><p>배경 대비 검토 도구이며 실제 게임 주야간 조명·가림·좌석·WebGL 검증이 아님. 생성 성공/기술 검사와 미술 승인을 구분.</p><p>SHA256 <code>${intake.sourceSha256}</code></p></html>`;
  writeFileSync(resolve(dir, 'art-review.html'), html);
  return {file: resolve(dir, 'art-review.html'), stage: job.stage, runtimeVerified: false, renderedGameScene: false};
}
