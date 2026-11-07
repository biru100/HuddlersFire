// External artwork handoff within the existing prepare -> rebuild -> render -> review tools.
// No image generation, network calls, resizing, quantization or runtime installation.
import {readFileSync, writeFileSync, mkdirSync, existsSync, realpathSync, copyFileSync} from 'node:fs';
import {resolve, relative, dirname, isAbsolute, basename} from 'node:path';
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
      compact: 'COMPACT — 비율과 밀집도를 비교하는 후보야. 머리 아래 몸통이 분명히 남는 짧고 다부진 비율, 몸 가까운 소매, 짧지만 구분되는 두 다리, 큼직하고 단단한 신발로 응축된 실루엣을 만들어 줘. 후드티 부피와 옷 주름은 절제해 줘.',
      rounded: 'ROUNDED — 부드러운 볼륨과 덩어리감을 비교하는 후보야. 초안보다 머리 부피를 절제하고 몸통·두 다리·발목 경계를 더 또렷이 나눈다. 둥근 뒤통수, 어깨에서 소매까지 완만하게 이어지는 약간 넉넉한 후드티, 통통한 손과 둥근 신발로 포근한 실루엣을 만들어 줘. 머리만 과장하지 말고 몸통과 두 다리가 따로 읽히게 해 줘. 길고 가는 팔다리는 피하고 곡선은 일정한 픽셀 계단으로 표현해 줘.',
      graphic: 'GRAPHIC — 색면과 윤곽의 명료함을 비교하는 후보야. 기본 체형은 중립적으로 유지하고 머리·후드·소매·바지·신발을 큰 색 덩어리로 구분해 줘. 곱슬머리는 몇 개의 특징적인 묶음으로, 옷 주름은 꼭 필요한 경계만 사용해 줘. 각 재질은 소수의 명암 면으로 정리하되 정확한 색 수는 강제하지 말고 그림자를 검은 덩어리로 뭉치지 마.'
    };
    const pose = (job.view ?? 'nw') === 'se'
      ? '화면 오른쪽 아래를 바라보는 SE 앞사선 idle 한 명. 카메라는 살짝 위에서 내려다보고 얼굴·앞머리·후드티 전면과 두 눈이 자연스럽게 읽혀야 해. 어깨·골반·두 신발의 앞코가 모두 같은 SE 방향으로 돌아가고 완전한 정면이나 측면으로 돌리지 마. NW 후보와 머리 부피·옷 색·체형·신발을 동일하게 유지해.'
      : '화면 왼쪽 위를 바라보는 NW 뒷사선 idle 한 명. 카메라는 살짝 위에서 내려다보고 뒤통수·등·후드의 윗면이 보여야 해. 뒤통수, 양어깨, 골반, 두 신발이 모두 같은 NW 방향으로 돌아가고 얼굴과 눈은 보이지 않게 해 줘. 정측면이나 정면으로 돌리지 마.';
    return `${common}\n\n이번에는 완성된 착의 캐릭터의 미술 기준 시안 한 장만 만들어 줘. ${styles[job.variation]}\n${pose}\n짙은 밤색의 짧은 곱슬머리, 세이지 후드티, 차콜 브라운 긴 바지, 따뜻한 갈색 신발. 후드는 머리에 쓰지 않고 등 위에 내려져 있어야 해. 짧은 목과 몸통, 소매 끝의 작은 손, 두 바짓단과 신발의 경계가 읽히게 해 줘. 양발은 바닥에 편하게 두고 팔은 옆으로 자연스럽게 내린 정지 자세야. 걷기, 손 흔들기, 소품과 가방은 제외해 줘. 눈에 먼저 들어오는 실루엣과 입히고 싶은 옷의 형태를 우선해 줘.\n독립된 단일 캐릭터만 머리부터 신발까지 잘림 없이 적당한 투명 여백 안에 배치해 줘. 중립적인 확산광으로 원래 피부와 옷 색을 보여 줘. 실제 투명 배경 PNG를 원하며 체크무늬를 배경에 그리지 마. 여러 방향, 비교 패널, 프레임 시트, UI, 글자, 모닥불 조명, 광선, 바닥 그림자는 제외해 줘.\n의도적인 픽셀 색면과 일정한 계단형 외곽을 사용해 줘. 곱슬은 작은 점의 집합이 아니라 읽히는 머리 덩어리로 표현하고 윤곽 두께와 픽셀 단위를 통일해 줘. 부드러운 에어브러시, 3D 렌더, 반짝이는 점, 디더링, 불규칙한 가짜 도트, 늘인 팔다리는 피하고 실제 게임에서 작게 보아도 머리·후드·긴 바지·신발이 구분되게 해 줘. 정확한 6색 제한 없이 따뜻한 명암을 살려 줘.\n이것은 LOOKDEV_ONLY 시안이며 ${a.canvas.join('×')} 납품 원화가 아니야. 출력은 도구의 실제 해상도로 보존하고 자동 축소·양자화·코드로 다시 그리기를 하지 마. 이 시안을 그대로 게임에 넣거나 규격 통과라고 주장하지 마.\n원본 PNG 한 파일을 전달해 줘. 투명도나 출력 크기를 도구가 지원하지 않으면 그 사실을 별도로 알려 주고 변환으로 숨기지 마. 이전에 기각된 NW 기본 신체는 기준작으로 사용하지 마. 이번 후보만 검토하고 마음에 드는 디자인을 선택한 뒤 기본 신체를 제작할 거야.\n`;
  }
  return `${common}\n\n첨부 REFERENCE.png (NW)와 REFERENCE_SE.png (SE)는 사용자가 선택한 동일 착의 캐릭터의 실루엣·비율·색감 기준이야. 이번에는 같은 디자인 계열의 기본 신체/피부만 NW 뒷사선 idle 한 컷으로 새로 제작해 줘. 등은 보이고 얼굴은 보이지 않아야 해. 머리카락·표정·상의·하의·액세서리는 제외하고, 해부학적 상세 없는 중립적인 게임용 마네킹으로 그려 줘.\n제작 목표는 ${a.canvas.join('×')} 논리 픽셀, feet=(${a.feet.join(',')}), head=(${a.head.join(',')}). 좌면 앵커는 이 정지 컷에 적용하지 않아. 목표가 비율을 망치면 임의로 늘이지 말고 불일치를 알려 줘.\n1px 격자에 연결된 색면과 일정한 윤곽/명암, 실제 투명 PNG와 alpha 0/255만 사용해 줘. 안티앨리어싱·디더링·글로우·바닥 그림자·라벨 금지. 정확한 6색 제한은 폐기하며 따뜻한 명암을 살려 줘.\n한 장의 원본 PNG, 실제 크기·RGB 팔레트·앵커 정보, 가능하면 정확한 4배 최근접 복제 검토본을 제출해 줘. 다른 방향·동작·의상은 아직 만들지 마.\n중요: 생성기가 이 실제 크기/격자/알파로 만들지 못하면 원본을 보존하고 blocked_native_delivery로 알려 줘. 큰 이미지의 사후 강제 축소, 색 양자화, Python/SVG 도형 재작화로 통과시키지 마. 프롬프트만으로 크기와 격자가 보장됐다고 주장하지 마.\n`;
}
export function prepareArtJob({root = ART_ROOT, out, stage = 'lookdev', variation = 'compact', view = 'nw', previousJob, previousReview, companionJob, companionReview} = {}) {
  if (!ART_STAGES.includes(stage) || !['compact', 'rounded', 'graphic'].includes(variation)) throw Error('Unknown art stage or variation');
  if (!['nw', 'se'].includes(view) || (stage === 'native-base' && view !== 'nw')) throw Error('Unknown art view or native base must be NW');
  if (!/^[a-z][a-z0-9-]{2,79}$/.test(out || '')) throw Error('--out requires a fresh simple job name');
  const context = readArtContext(root);
  let parent = null;
  if (stage === 'native-base') {
    if (!previousJob || !previousReview) throw Error('Native base requires an explicitly approved lookdev job and review');
    const proof = verifyArtReview(previousJob, previousReview, {root});
    if (proof.stage !== 'lookdev') throw Error('Native base must follow lookdev, not another native delivery');
    const first = loadArtJob(previousJob, {root});
    if ((first.view ?? 'nw') !== 'nw') throw Error('Native base requires approved NW lookdev');
    if (!companionJob || !companionReview) throw Error('Native base requires separately approved SE companion');
    const second = loadArtJob(companionJob, {root}), secondProof = verifyArtReview(companionJob, companionReview, {root});
    if (second.stage !== 'lookdev' || second.view !== 'se' || second.variation !== first.variation || secondProof.stage !== 'lookdev') throw Error('SE companion must match NW variation and view');
    parent = {job: projectRelative(root, previousJob), review: projectRelative(root, previousReview), fingerprint: proof.fingerprint, reviewHash: digest(readFileSync(artPath(root, previousReview))), companion: {job: projectRelative(root, companionJob), review: projectRelative(root, companionReview), fingerprint: secondProof.fingerprint, reviewHash: digest(readFileSync(artPath(root, companionReview)))}};
  }
  const dir = artPath(root, 'art/sprites/runs/' + out);
  if (existsSync(dir)) throw Error('Job already exists; preserve the original and use a new name');
  mkdirSync(resolve(dir, 'source'), {recursive: true});
  const job = {version: 1, kind: 'art-direction', stage, variation: parent ? json(artPath(root, parent.job)).variation : variation, view, ...context, parent};
  if (parent) {
    const prior = json(artPath(root, parent.job)), priorDir = dirname(artPath(root, parent.job));
    const submission = json(resolve(priorDir, 'submission.json'));
    const original = artPath(priorDir, submission.file);
    copyFileSync(original, resolve(dir, 'REFERENCE.png'));
    job.reference = {file: 'REFERENCE.png', sha256: digest(readFileSync(original)), role: 'approved-lookdev-not-native-sprite'};
    const companionDir = dirname(artPath(root, parent.companion.job));
    const companionReceipt = json(resolve(companionDir, 'submission.json'));
    const companionSource = artPath(companionDir, companionReceipt.file);
    copyFileSync(companionSource, resolve(dir, 'REFERENCE_SE.png'));
    job.companionReference = {file: 'REFERENCE_SE.png', sha256: digest(readFileSync(companionSource)), role: 'approved-se-lookdev-not-native-sprite'};
    if (prior.stage !== 'lookdev') throw Error('Invalid parent stage');
  }
  save(resolve(dir, 'job.json'), job);
  writeFileSync(resolve(dir, 'CHATGPT_REQUEST.txt'), artPrompt(job));
  save(resolve(dir, 'submission.template.json'), {file: 'source/candidate.png', sourceType: 'image-generation', surface: 'chatgpt', requestedModel: context.policy.generation.requestedModel, observedModel: null, modelEvidence: {kind: 'unverified', reference: ''}, operations: [], paletteRgb: [], frameAnchors: {feet: context.contract.avatar.feet, head: context.contract.avatar.head}, note: 'Fill with observed facts only. Do not run scripts from incoming packages.'});
  writeFileSync(resolve(dir, 'README.md'), '# Artwork handoff\n\nSend CHATGPT_REQUEST.txt and REFERENCE.png / REFERENCE_SE.png if present. Return ONE downloaded original PNG, never a screenshot or recompressed preview. Receive it with rebuild-sprites.mjs --job <this job.json> --source <original.png> and optionally --source-reference <conversation reference>. This preserves exact bytes and creates a factual submission.json; existing originals/receipts are never overwritten. Unknown actual models stay null/unverified. Then run render and review. Do not resize or redraw. LOOKDEV approval is never runtime approval.\n');
  return {directory: dir, stage, status: 'awaiting_external_art', generated: false};
}
export function loadArtJob(file, {root = ART_ROOT} = {}) {
  const path = artPath(root, file), job = json(path), context = readArtContext(root);
  artPath(artPath(root, 'art/sprites/runs'), path);
  if (job.version !== 1 || job.kind !== 'art-direction' || !ART_STAGES.includes(job.stage)) throw Error('Not an art-direction job');
  if (!['nw', 'se'].includes(job.view ?? 'nw') || (job.stage === 'native-base' && (job.view ?? 'nw') !== 'nw')) throw Error('Invalid art view');
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
    const paired = job.parent.companion;
    if (!paired) throw Error('Missing approved SE companion');
    const se = loadArtJob(paired.job, {root});
    if (se.stage !== 'lookdev' || se.view !== 'se' || se.variation !== parentJob.variation) throw Error('Invalid SE companion');
    const seProof = verifyArtReview(paired.job, paired.review, {root});
    if (seProof.fingerprint !== paired.fingerprint || digest(readFileSync(artPath(root, paired.review))) !== paired.reviewHash) throw Error('Stale companion approval');
    if (!job.companionReference || digest(readFileSync(artPath(dir, job.companionReference.file))) !== job.companionReference.sha256 || job.companionReference.sha256 !== seProof.sourceSha256) throw Error('Approved SE reference changed');
  } else if (job.reference || job.companionReference) throw Error('Unapproved reference in lookdev job');
  return job;
}
export function receiveArtSubmission(file, original, {root = ART_ROOT, reference = ''} = {}) {
  loadArtJob(file, {root});
  if (!text(original)) throw Error('--source requires an original PNG path');
  const dir = dirname(artPath(root, file));
  const destination = artPath(dir, 'source/candidate.png'), receiptFile = artPath(dir, 'submission.json');
  if (existsSync(destination) || existsSync(receiptFile)) throw Error('Artwork already received; preserve the original and prepare a fresh job');
  const bytes = readFileSync(resolve(original));
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw Error('Original PNG required; do not convert the file');
  const receipt = {...json(resolve(dir, 'submission.template.json')), originalName: basename(original), originalSha256: digest(bytes), sourceReference: reference, operations: ['lossless-copy']};
  // Exclusive writes preserve original bytes even if the same receive command is repeated.
  writeFileSync(destination, bytes, {flag: 'wx'});
  writeFileSync(receiptFile, JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx'});
  return {file: destination, sourceSha256: receipt.originalSha256, generated: false, artApproved: false};
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
  if (receipt.originalSha256 != null && (!sha(receipt.originalSha256) || receipt.originalSha256 !== metrics?.sha256)) blockers.push('received_original_changed');
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
  save(resolve(dir, 'art-review.template.json'), {version: 1, fingerprint, reviewer: '', reviewerRole: 'user', artDirectorReview: {actor: 'chatgpt', reference: '', summary: ''}, decision: 'pending', userDecision: {quote: '', reference: ''}, criteria: Object.fromEntries(job.policy.criteria.map(id => [id, {result: 'unreviewed', observation: ''}])), unresolved: [], note: 'A human art-direction decision only; native production still requires pixel/scene/feature checks.'});
  return {fingerprint, stage: job.stage, ...assessment};
}
export function validateArtDecision(review, job, intake) {
  if (review.fingerprint !== intake.fingerprint) throw Error('Stale artwork review');
  if (intake.blockers.length) throw Error('Technical/provenance blockers remain: ' + intake.blockers.join(', '));
  if (review.decision !== 'approved' || review.reviewerRole !== 'user' || !text(review.reviewer) || !text(review.userDecision?.quote) || !text(review.userDecision?.reference)) throw Error('Explicit user art approval with a real decision reference is required; never invent it');
  if (review.artDirectorReview?.actor !== 'chatgpt' || !text(review.artDirectorReview?.reference) || !text(review.artDirectorReview?.summary)) throw Error('ChatGPT art-direction review and source reference required');
  if (!Array.isArray(review.unresolved) || review.unresolved.length) throw Error('Unresolved art issues');
  for (const id of job.policy.criteria) if (review.criteria?.[id]?.result !== 'pass' || !text(review.criteria[id].observation)) throw Error('Unreviewed aesthetic criterion: ' + id);
  return {stage: job.stage, view: job.view ?? 'nw', fingerprint: intake.fingerprint, sourceSha256: intake.sourceSha256, artApproved: true, productionReady: false, runtimeVerified: false};
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
  if (!link.companionJob || !link.companionReview) throw Error('Pixel release requires an approved SE companion');
  const nw = loadArtJob(link.job, {root}), se = loadArtJob(link.companionJob, {root});
  if ((nw.view ?? 'nw') !== 'nw' || se.stage !== 'lookdev' || se.view !== 'se' || se.variation !== nw.variation) throw Error('Pixel release requires matching NW and SE lookdev views');
  const seProof = verifyArtReview(link.companionJob, link.companionReview, {root});
  if (seProof.stage !== 'lookdev') throw Error('Pixel release requires approved SE lookdev');
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
  const targetScale = Math.min(1, job.contract.avatar.canvas[0] / w, job.contract.avatar.canvas[1] / h);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const view = (job.view ?? 'nw').toUpperCase();
  const directionCheck = view === 'SE' ? '얼굴·앞머리·어깨·골반·신발이 SE를 향하는가.' : '뒤통수·어깨·후드·골반·신발이 NW를 향하는가.';
  const imageAt = s => `<img alt="${job.variation} ${view} ${job.stage}" width="${w * s}" height="${h * s}" src="${img}">`;
  const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Huddlers art review</title><style>body{font:16px/1.6 system-ui;margin:24px;background:#eee7d9;color:#2c241c}section{display:flex;gap:16px;flex-wrap:wrap}.panel{padding:24px;max-width:100%;overflow:auto}.night{background:#142c30;color:#f8f0db}.day{background:#c3c79b}img{image-rendering:pixelated;max-width:none}code{word-break:break-all}details{overflow:auto;max-width:100%}</style><h1>${job.stage}: ${intake.status === 'blocked' ? '차단 — 승인 불가' : '승인 대기'}</h1><p>원본 ${w}×${h}. ${job.stage === 'lookdev' ? '시안 표시용 축소만 적용. 원본 파일은 변경하지 않음. 네이티브 스프라이트 아님.' : '1배 / 정확한 4배 CSS 픽셀 복제 비교. PNG 파일은 변경하지 않음.'}</p><p>요청 모델: ${escape(receipt.requestedModel)} / 실제 모델: ${escape(receipt.observedModel || 'unverified')}. 경고: ${escape(intake.warnings.join(', ') || '없음')}. 차단: ${escape(intake.blockers.join(', ') || '없음')}.</p><section><div class="panel day"><h2>밝은 바탕</h2>${imageAt(scale)}</div><div class="panel night"><h2>어두운 바탕</h2>${imageAt(scale)}</div>${job.stage === 'native-base' ? `<div class="panel"><h2>4배</h2>${imageAt(4)}</div>` : `<div class="panel day"><h2>작은 표시 가설 · 밝음</h2>${imageAt(targetScale)}</div><div class="panel night"><h2>작은 표시 가설 · 어두움</h2>${imageAt(targetScale)}</div>`}</section>${job.stage === 'lookdev' ? `<p>작은 표시는 목표 ${job.contract.avatar.canvas.join('×')} 캔버스 안에 원래 종횡비로 맞춘 CSS 비교다. 실제 픽셀 밀도·게임 카메라 배율·네이티브 납품의 증거가 아니다. 여백도 원본 그대로 포함한다.</p>` : ''}<details><summary>원본 100% 크기로 보기</summary>${imageAt(1)}</details><h2>직접 관찰할 항목</h2><ul><li>실루엣: 머리·몸통·손·두 다리·신발이 작은 표시에서도 구분되는가.</li><li>방향: ${directionCheck}</li><li>픽셀 표현: 일정한 계단과 색면인가, 흐림·잔점·가짜 도트가 있는가.</li><li>팔레트: 밝고 어두운 바탕에서 의상과 신체가 구분되는가.</li><li>매력: 가만히 서 있어도 이 캐릭터로 캠프에 참여하고 싶은가.</li><li>장면 적합성: 디자인 가설을 기록하고 실제 접지·조명·좌석은 미확인으로 남긴다.</li></ul><p>배경 대비 검토 도구이며 실제 게임 주야간 조명·가림·좌석·WebGL 검증이 아님. 생성 성공/기술 검사와 미술 승인을 구분.</p><p>SHA256 <code>${intake.sourceSha256}</code></p></html>`;
  writeFileSync(resolve(dir, 'art-review.html'), html);
  return {file: resolve(dir, 'art-review.html'), stage: job.stage, runtimeVerified: false, renderedGameScene: false};
}
