// Scoped motion-lookdev intake. Does not modify art-direction's approval fingerprints,
// generate/crop/resize images, or register production animation assets.
import {readFileSync,writeFileSync,copyFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname,relative,basename} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {ART_ROOT,artPath,loadArtJob,verifyArtReview} from './lib/art-direction.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = file => JSON.parse(readFileSync(file,'utf8'));
const writeJson = (file,value) => writeFileSync(file,JSON.stringify(value,null,2)+'\n');
const relativeToRoot = (root,file) => relative(resolve(root),artPath(root,file)).replaceAll('\\','/');
const pngSignature = '89504e470d0a1a0a';

export function motionPrompt(job){
  const direction = job.view==='nw'
    ? 'NW 왼쪽 위 뒷사선. 뒤통수와 후드의 등쪽 면만 보이며 눈과 얼굴은 보이지 않음.'
    : 'SE 오른쪽 아래 앞사선. 눈, 앞머리, 후드 앞주머니가 보이며 정면이나 측면으로 돌아가지 않음.';
  return `HuddlersFire Rounded 02 Rev2 캐릭터 Idle 숨쉬기 모션 LOOKDEV_ONLY.
첨부 REFERENCE.png는 실제 사용자가 선택한 ${job.view.toUpperCase()} 착의 디자인 원본이야.
${direction}
이 원본과 같은 인물, 짙은 밤갈색 곱슬머리, 세이지색 내려진 후드, 차콜 브라운 긴 바지, 갈색 신발을 유지해 줘.
단일 PNG 안에 2×2, 왼쪽 위→오른쪽 위→왼쪽 아래→오른쪽 아래 순서로 네 가지 미세한 호흡 동작을 배치해 줘.
1 숨 들이쉬기 준비, 2 어깨·가슴이 아주 살짝 올라감, 3 자연스럽게 내려감, 4 제자리로 복귀.
고개 방향, 머리 크기, 얼굴, 주머니·끈·소매, 양손, 신발의 특징이 컷마다 동일해야 해.
4컷 모두 발바닥의 기준점과 캐릭터 원근 방향이 일치해야 하고, 잘림·가려짐·분리된 손발이 없어야 해.
투명 배경, 동일한 2×2 셀 크기. 셀 테두리, 글자, 그림자, 배경, 비교 UI, 추가 인물은 넣지 마.
각 프레임은 손발·머리·후드 형태가 거의 동일하고 움직임은 미세하고 반복이 자연스러워야 해.
프레임 사이 자동 좌우 반전이나 임의 카메라 회전은 금지.
원본을 조작하지 않고 생성 도구의 실제 해상도 그대로 보존해 줘. 픽셀 색면/계단 윤곽을 일관되게 그려 줘.
이것은 모션 디자인 탐색용 4컷이며, 정확한 64×96 네이티브 프레임·완전한 루프·프레임 앵커의 정확도를 보증하는 납품이 아니야.
실제 애니메이션 여부는 ChatGPT의 미술 평가와 Codex의 개별 프레임 검사 후 결정해.\n`;
}

export function validateMotionMetrics(metrics){
  const blockers=[],warnings=['motion_concept_not_native_or_runtime_animation'];
  if(!Array.isArray(metrics?.size)||metrics.size.length!==2||metrics.size.some(n=>!Number.isInteger(n)||n<4||n%2!==0))blockers.push('invalid_2x2_sheet_dimensions');
  if(!metrics?.bounds||!(metrics.alpha?.opaque+metrics.alpha?.soft>0))blockers.push('empty_motion_sheet');
  if(!(metrics?.alpha?.transparent>0))blockers.push('no_transparent_background');
  if((metrics?.alpha?.soft??0)>0)warnings.push('soft_alpha_not_native');
  return {status:blockers.length?'blocked':'reference_only',blockers,warnings,motionConcept:true,frameCellsVerified:false,loopVerified:false,artApproved:false,productionReady:false,runtimeVerified:false};
}

export function prepareMotionJob({root=ART_ROOT,out,view,parentJob,parentReview,legacySheet=false}={}){
  if(!legacySheet)throw Error('Whole-sheet generation is legacy-only. Use tools/idle-frames.mjs prepare; historical sheet intake requires --legacy-sheet.');
  if(!/^[a-z][a-z0-9-]{2,79}$/.test(out||''))throw Error('--out needs a new simple job name');
  if(!['nw','se'].includes(view))throw Error('Motion view must be nw or se');
  if(!parentJob||!parentReview)throw Error('Approved same-view lookdev parent and review required');
  const original=loadArtJob(parentJob,{root});
  if(original.stage!=='lookdev'||(original.view??'nw')!==view)throw Error('Motion parent must be an approved lookdev of the same view');
  const proof=verifyArtReview(parentJob,parentReview,{root});
  if(proof.stage!=='lookdev'||proof.sourceSha256==null)throw Error('Unapproved or invalid design parent');
  const parentDir=dirname(artPath(root,parentJob));
  const receipt=readJson(resolve(parentDir,'submission.json'));
  const sourceFile=artPath(parentDir,receipt.file);
  const originalBytes=readFileSync(sourceFile);
  if(hash(originalBytes)!==proof.sourceSha256)throw Error('Approved design original changed');
  const directory=artPath(root,'art/sprites/runs/'+out);
  if(existsSync(directory))throw Error('Job exists: never overwrite motion source or receipts');
  mkdirSync(resolve(directory,'source'),{recursive:true});
  const job={version:1,kind:'motion-lookdev',stage:'motion-concept',view,
    action:'idle-breath',variation:original.variation,frameCount:4,grid:[2,2],order:'row-major',
    status:'awaiting_external_art',productionReady:false,runtimeVerified:false,
    parent:{job:relativeToRoot(root,parentJob),review:relativeToRoot(root,parentReview),fingerprint:proof.fingerprint,reviewSha256:hash(readFileSync(artPath(root,parentReview))),sourceSha256:proof.sourceSha256},
    reference:{file:'REFERENCE.png',sha256:proof.sourceSha256}};
  copyFileSync(sourceFile,resolve(directory,'REFERENCE.png'));
  writeJson(resolve(directory,'job.json'),job);
  writeFileSync(resolve(directory,'CHATGPT_REQUEST.txt'),motionPrompt(job));
  writeFileSync(resolve(directory,'README.md'),'# Motion concept handoff\n\nUse the original 2x2 PNG as one unmodified concept sheet. Frame order: TL, TR, BL, BR. This is not native 64x96, a verified looping animation or an installation request. Use motion-lookdev.mjs intake / inspect; never feed this sheet into an art-direction native-base or production sprite job.\n');
  return {directory,stage:job.stage,status:job.status,motionConcept:true,productionReady:false};
}

export function loadMotionJob(file,{root=ART_ROOT}={}){
  const path=artPath(root,file),job=readJson(path);
  artPath(artPath(root,'art/sprites/runs'),path);
  if(job.kind!=='motion-lookdev'||job.stage!=='motion-concept'||job.version!==1||!['nw','se'].includes(job.view)||job.action!=='idle-breath'||job.frameCount!==4||JSON.stringify(job.grid)!=='[2,2]'||job.order!=='row-major')throw Error('Invalid motion-lookdev contract');
  if(!job.parent?.job||!job.parent?.review)throw Error('Motion job has no approved design parent');
  const parent=loadArtJob(job.parent.job,{root});
  if(parent.stage!=='lookdev'||(parent.view??'nw')!==job.view||parent.variation!==job.variation)throw Error('Motion design parent mismatch');
  const proof=verifyArtReview(job.parent.job,job.parent.review,{root});
  if(proof.fingerprint!==job.parent.fingerprint||proof.sourceSha256!==job.parent.sourceSha256||hash(readFileSync(artPath(root,job.parent.review)))!==job.parent.reviewSha256)throw Error('Stale design approval');
  if(!job.reference||hash(readFileSync(artPath(dirname(path),job.reference.file)))!==job.reference.sha256||job.reference.sha256!==proof.sourceSha256)throw Error('Changed motion design reference');
  if(readFileSync(resolve(dirname(path),'CHATGPT_REQUEST.txt'),'utf8')!==motionPrompt(job))throw Error('Motion request changed; prepare a fresh job');
  return job;
}

export function receiveMotionJob(file,source,{root=ART_ROOT,sourceReference=''}={}){
  const job=loadMotionJob(file,{root});
  if(!source)throw Error('--source requires an actual original PNG path');
  const dir=dirname(artPath(root,file)),target=resolve(dir,'source/candidate.png'),receiptFile=resolve(dir,'submission.json');
  if(existsSync(target)||existsSync(receiptFile))throw Error('Motion image already received; use a new job');
  const bytes=readFileSync(resolve(source));
  if(bytes.subarray(0,8).toString('hex')!==pngSignature)throw Error('Original PNG required');
  const record={kind:'motion-lookdev-receipt',sourceType:'chatgpt-image-generation',sourceFilename:basename(source),
    sourceReference,sourceSha256:hash(bytes),originalBytes:bytes.length,operations:['lossless-copy'],observedModel:null,
    observedModelStatus:'unverified',animationApproved:false,productionReady:false};
  writeFileSync(target,bytes,{flag:'wx'});
  writeJson(receiptFile,record);
  return {view:job.view,sourceSha256:record.sourceSha256,originalPreserved:true,status:'awaiting_motion_inspection'};
}

export async function inspectMotionJob(file,{root=ART_ROOT,footSplitX}={}){
  const job=loadMotionJob(file,{root}),dir=dirname(artPath(root,file));
  const receipt=readJson(resolve(dir,'submission.json')),filename=resolve(dir,'source/candidate.png');
  const original=readFileSync(filename);
  if(hash(original)!==receipt.sourceSha256||receipt.operations?.join(',')!=='lossless-copy'||receipt.sourceType!=='chatgpt-image-generation')throw Error('Motion receipt or original source changed');
  const {inspectImage}=await import('./lib/pixel-assets.mjs');
  const metrics=await inspectImage(filename);
  const assessment=validateMotionMetrics(metrics);
  if(metrics.sha256!==receipt.sourceSha256)throw Error('Inspector hash mismatch');
  const cellSize=metrics.size.map(n=>n/2);
  const report={version:1,kind:'motion-lookdev-intake',view:job.view,action:job.action,frameCount:4,grid:[2,2],order:'row-major',
    originalSha256:metrics.sha256,sourceReference:receipt.sourceReference,metrics,cellSize, ...assessment,
    checksToPerform:['same-character-every-frame','same-view-every-frame','feet-registration','hair-and-clothing-consistency','frame-order','breathing-motion-readable','loop-seam-4-to-1'],
    note:'Image format/grid geometry is not per-frame artistic, native-resolution or runtime approval.'};
  const build=resolve(dir,'build');mkdirSync(build,{recursive:true});
  writeJson(resolve(build,'motion-intake.json'),report);
  writeJson(resolve(dir,'motion-review.template.json'),{status:'pending',artDirectorReview:{actor:'chatgpt',reference:'',summary:''},
    userDecision:{quote:'',reference:''},checks:Object.fromEntries(report.checksToPerform.map(k=>[k,{result:'unreviewed',observation:''}])),
    animationApproved:false,productionReady:false,runtimeVerified:false});
  const uri='data:image/png;base64,'+original.toString('base64');
  const [w,h]=metrics.size,[cw,ch]=cellSize;
  const frames=[0,1,2,3].map(i=>{
    const left=-(i%2*cw),top=-(Math.floor(i/2)*ch);
    return `<div class="panel"><h3>Frame ${i+1}</h3><div style="position:relative;overflow:hidden;width:${cw}px;height:${ch}px"><img src="${uri}" width="${w}" height="${h}" style="position:absolute;left:${left}px;top:${top}px;max-width:none"></div></div>`;
  }).join('');
  const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Huddlers motion concept review</title><style>body{font:16px/1.5 system-ui;background:#eee7da;color:#2f251f;margin:24px}section{display:flex;flex-wrap:wrap;gap:12px}.panel{background:#d6dccb;padding:12px;max-width:100%;overflow:auto}img{image-rendering:pixelated}code{overflow-wrap:anywhere}</style><h1>${job.view.toUpperCase()} idle 4-cut motion concept</h1><p>원본 ${w}×${h} · 2×2 · cell ${cw}×${ch}. ${assessment.status}. LOOKDEV ONLY. No frames were cropped or saved as production assets. Frame position and loop not verified.</p><section>${frames}</section><p>SHA256 <code>${metrics.sha256}</code></p><p>Check feet registration, head/hood/jacket continuity, order and 4→1 seam manually in ChatGPT. This is not 64×96 native or a game-render test.</p></html>`;
  writeFileSync(resolve(build,'motion-review.html'),assessment.blockers.length?html:html.replace('<section>','<p><a href="motion-analysis.html">프레임 측정·루프·고스트 검토 열기</a></p><section>'));
  let analysisFile=null;
  if(!assessment.blockers.length){
    const {writeMotionAnalysis}=await import('./lib/motion-analysis.mjs');
    await writeMotionAnalysis({original,view:job.view,directory:build,sourceReference:receipt.sourceReference,parent:job.parent,footSplitX});
    analysisFile=resolve(build,'motion-analysis.html');
  }
  return {status:assessment.status,report:resolve(build,'motion-intake.json'),review:resolve(build,'motion-review.html'),
    analysis:analysisFile,sourceSha256:metrics.sha256,cellSize,framesVerified:false,productionReady:false};
}
function arg(args,key){const i=args.indexOf(key);if(i<0)return undefined;const v=args[i+1];if(!v||v.startsWith('--'))throw Error(key+' requires a value');return v;}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [op,...args]=process.argv.slice(2);
  const job=arg(args,'--job');
  let output;
  if(op==='prepare')output=prepareMotionJob({out:arg(args,'--out'),view:arg(args,'--view'),parentJob:arg(args,'--parent-job'),parentReview:arg(args,'--parent-review'),legacySheet:args.includes('--legacy-sheet')});
  else if(op==='intake')output=receiveMotionJob(job,arg(args,'--source'),{sourceReference:arg(args,'--source-reference')??''});
  else if(op==='inspect')output=await inspectMotionJob(job,{footSplitX:arg(args,'--foot-split')===undefined?undefined:Number(arg(args,'--foot-split'))});
  else throw Error('Usage: motion-lookdev.mjs prepare|intake|inspect (see docs/briefs/rounded-02/animation-idle-handoff.md)');
  console.log(JSON.stringify(output,null,2));
}
