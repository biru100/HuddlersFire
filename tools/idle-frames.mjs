// Anchor-first motion LOOKDEV. Sources are immutable; no correction transforms or art approval.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,resolve,relative,basename,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {ART_ROOT,artPath,loadArtJob,verifyArtReview} from './lib/art-direction.mjs';
import {IDLE_FRAMES} from './lib/idle-contract.mjs';
import {compileIdlePlan,inspectIdlePixels} from './lib/idle-checks.mjs';
import {verifyRegistry} from './art-source-registry.mjs';

const hash=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const save=(p,v,exclusive=false)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:exclusive?'wx':'w'});
const rel=(root,p)=>relative(resolve(root),artPath(root,p)).replaceAll('\\','/');
const pending={reviewState:'pending-motion-review',decision:'pending',artApproved:false,animationApproved:false,productionReady:false,runtimeVerified:false};
const helper=fileURLToPath(new URL('./lib/idle-png.py',import.meta.url));
function python(op,args=[],input){
  const executable=join(ART_ROOT,'tools/sprite-gen/.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
  assert.ok(existsSync(executable),'Run node tools/setup-sprite-gen.mjs first (pinned Pillow environment)');
  const result=spawnSync(executable,[helper,op,...args],{input,maxBuffer:80*1024*1024});
  if(result.error)throw result.error;
  assert.equal(result.status,0,result.stderr?.toString()||'PNG decoder failed');
  return result.stdout;
}
export function decodeIdlePng(file){
  const result=python('decode',[file]),width=result.readUInt32BE(0),height=result.readUInt32BE(4);
  assert.equal(result.length,8+width*height*4);
  return {dimensions:[width,height],data:result.subarray(8)};
}
function entry(slot,file,sourceFilename,bytes,dimensions){return {slot,filename:basename(file),path:file,sourceFilename,sha256:hash(bytes),bytes:bytes.length,dimensions};}
function inventory(dir,manifest){
  save(join(dir,'MANIFEST.json'),manifest);
  writeFileSync(join(dir,'SHA256SUMS.txt'),manifest.originals.map(e=>e.sha256+'  '+e.path).join('\n')+'\n');
}
function design(root,parentJob,parentReview,view){
  const parent=loadArtJob(parentJob,{root}),proof=verifyArtReview(parentJob,parentReview,{root});
  assert.ok(parent.stage==='lookdev'&&(parent.view??'nw')===view&&proof.sourceSha256,'Approved same-view LOOKDEV design parent required');
  return {job:rel(root,parentJob),review:rel(root,parentReview),sourceSha256:proof.sourceSha256,fingerprint:proof.fingerprint,reviewSha256:hash(readFileSync(artPath(root,parentReview))),approvalScope:'design-lookdev-only'};
}
function requestFor(job,frame){return {
  workflow:'anchor-frame-by-frame',view:job.view,frame:frame.id,intent:frame.intent,
  anchor:{file:'base/frame01-anchor.png',sha256:job.anchorSha256,canvas:job.canvas},
  lockedPlanSha256:job.planSha256,frameIntentSha256:job.intentSha256,
  attach:['base/frame01-anchor.png','motion-plan/REGION_LOCKS.md','motion-plan/REGION_LOCKS.json','motion-plan/FRAME_INTENT.json'],
  output:{filename:basename(frame.file),format:'single-frame RGBA PNG',canvas:job.canvas,background:'transparent',sheet:false},
  locked:['entire shoes','soles/heels/toes contacts','legs below knees','global position','camera/perspective/view','every pixel outside explicit motion polygons'],
  limitedMotion:['chest','shoulders','hood upper/opening','upper back','selected hair tips','tiny upper-arm response'],
  rules:['Use original f1 as the only geometric anchor, never chain-edit f2 into f3.',
    'Review the draft masks and neutral anchor in ChatGPT before generation; preserve locked pixels exactly.',
    'Generate this frame alone; do not deliver a full 2x2 sheet, resize, mirror or quantize.',
    'Equal duration f1→f2→f3→f4→f1; avoid a unique f2→f3 jump. Return approaches f1.',
    'If the generator cannot preserve locked pixels, report the limitation; do not claim PASS.'],
  roles:{artworkAndArtReview:'ChatGPT',technicalAndAssembly:'Codex',finalMotionSelection:'user'},...pending};}
function requestText(request){return `HuddlersFire Rounded 02 Rev2 ${request.view.toUpperCase()} Idle ${request.frame}: ${request.intent}\n\n첨부한 f1 원본과 REGION_LOCKS를 기준으로 이 프레임 하나만 제작해 주세요.\n고정: 신발 전체·발바닥/뒤꿈치/발끝 접점·무릎 아래·캐릭터 전체 위치·카메라/원근/방향. 허용 영역 밖은 원본 픽셀 그대로 유지합니다.\n허용: 확인된 작은 가슴/어깨/후드 상단/등 위/일부 머리 끝/상완 영역에서만 미세 호흡. f2 흡기, f3 호기, f4 복귀이며 모든 전환의 리듬을 고르게 유지합니다.\nf3/f4도 이전 생성본 대신 동일 f1에서 시작하세요. 전체 시트·전신 바운스·회전·리사이즈·양자화·자동 반전을 금지합니다.\n아래 JSON의 원본 해시·캔버스·플랜을 그대로 따릅니다. 원화 생성과 미술 평가는 ChatGPT, 최종 모션 선택은 사용자입니다. 정확한 고정을 달성하지 못하면 한계를 보고하세요.\n\n${JSON.stringify(request,null,2)}\n`;}

export function prepareIdleFrames({root=ART_ROOT,out,view,parentJob,parentReview,anchor,plan,intent}={}){
  assert.match(out??'',/^[a-z][a-z0-9-]{2,79}$/,'New simple registry set ID required');
  assert.ok(['nw','se'].includes(view),'View must be nw or se');
  const parent=design(root,parentJob,parentReview,view),source=artPath(root,anchor),bytes=readFileSync(source),decoded=decodeIdlePng(source);
  assert.equal(hash(bytes),parent.sourceSha256,'Anchor must be the exact approved design original, never a cropped sheet');
  const regionPlan=read(artPath(root,plan)),frameIntent=read(artPath(root,intent));
  compileIdlePlan(regionPlan);assert.equal(regionPlan.view,view);assert.deepEqual(regionPlan.canvas,decoded.dimensions);
  assert.deepEqual(frameIntent.frames?.map(f=>[f.id,f.intent]),IDLE_FRAMES.map(f=>[f.id,f.intent]));
  assert.ok(frameIntent.frames.every(f=>Number.isInteger(f.durationMs)&&f.durationMs>=80&&f.durationMs<=2000));
  const dir=artPath(root,'art/sprites/source-registry/'+out);assert.ok(!existsSync(dir),'Set exists; prepare a new immutable set');
  for(const sub of ['base','motion-plan','generated','assembly','review'])mkdirSync(join(dir,sub),{recursive:true});
  writeFileSync(join(dir,IDLE_FRAMES[0].file),bytes,{flag:'wx'});
  // Canonical LF copies: plan fingerprints are portable across Git checkouts.
  save(join(dir,'motion-plan/REGION_LOCKS.json'),regionPlan,true);save(join(dir,'motion-plan/FRAME_INTENT.json'),frameIntent,true);
  const job={version:1,kind:'anchor-idle-job',workflow:'anchor-frame-by-frame',setId:out,view,canvas:decoded.dimensions,parent,
    anchorSha256:hash(bytes),anchorRole:'design-approved-original-proposed-as-neutral-motion-anchor',
    planSha256:hash(readFileSync(join(dir,'motion-plan/REGION_LOCKS.json'))),intentSha256:hash(readFileSync(join(dir,'motion-plan/FRAME_INTENT.json'))),...pending};
  save(join(dir,'job.json'),job,true);
  inventory(dir,{version:3,setId:out,kind:'idle-frames',workflow:job.workflow,view,...pending,approvalDocument:null,
    designParent:parent,originals:[entry('f1',IDLE_FRAMES[0].file,basename(source),bytes,decoded.dimensions)]});
  writeFileSync(join(dir,'.gitattributes'),'*.json text eol=lf\n*.md text eol=lf\n*.txt text eol=lf\n*.html text eol=lf\n*.png binary\n');
  writeFileSync(join(dir,'generated/.gitkeep'),'');writeFileSync(join(dir,'assembly/.gitkeep'),'');
  writeFileSync(join(dir,'motion-plan/REGION_LOCKS.md'),`# ${view.toUpperCase()} Idle region locks — DRAFT\n\nCoordinates are original-canvas pixels, origin top-left. Everything outside explicit polygons is locked. Rectangles use [x,y,width,height]. Inspect the overlay in review/loop-preview.html.\n\nBoth entire shoes, soles/heels/toes, lower legs, global registration, camera, perspective and direction are locked. Only the listed small upper-body/hair-tip polygons can change within their budgets. Polygons are conservative proposals, not anatomical segmentation or a ChatGPT art decision.\n\nBefore f2/f3/f4: ChatGPT must confirm the neutral f1 AND actual mask boundaries, budgets and timing. Record that real review with confirm-plan. If boundaries need revision, prepare a new set. Never enlarge the allowed region to hide a failed output. This receipt is not final motion approval.\n`);
  for(const frame of IDLE_FRAMES.slice(1)){const request=requestFor(job,frame);save(join(dir,'motion-plan/'+frame.id+'-request.json'),request,true);writeFileSync(join(dir,'motion-plan/'+frame.id+'-request.txt'),requestText(request),{flag:'wx'});}
  writeFileSync(join(dir,'review/art-review.md'),'# Motion art review — pending\n\nNo new ChatGPT animation critique or user motion selection has been received. Design LOOKDEV approval remains separate.\n\n- Neutral anchor / region plan confirmation: pending\n- Character consistency, camera/view, breathing readability, artistic loop: unreviewed\n- artApproved: false\n- decision: pending\n- productionReady: false\n- runtimeVerified: false\n\nAttach actual ChatGPT review references and user decisions separately; never invent their contents.\n');
  return {job:join(dir,'job.json'),...inspectIdleFrames(join(dir,'job.json'),{root})};
}
export function loadIdleFrames(file,{root=ART_ROOT}={}){
  const path=artPath(root,file),dir=dirname(path),job=read(path);
  assert.ok(job.version===1&&job.kind==='anchor-idle-job'&&job.workflow==='anchor-frame-by-frame','Invalid Idle job');
  assert.equal(rel(root,dir),'art/sprites/source-registry/'+job.setId,'Job must stay in its own registry set');
  for(const sub of ['base','motion-plan','generated','assembly','review'])artPath(dir,sub);
  for(const [key,value] of Object.entries(pending))assert.equal(job[key],value,'Approval scope changed');
  const proof=design(root,job.parent.job,job.parent.review,job.view);assert.deepEqual(proof,job.parent,'Stale design parent');
  assert.equal(hash(readFileSync(artPath(dir,IDLE_FRAMES[0].file))),job.anchorSha256,'Anchor changed');
  assert.equal(job.anchorSha256,proof.sourceSha256,'Design anchor mismatch');
  for(const [name,digest] of [['REGION_LOCKS.json',job.planSha256],['FRAME_INTENT.json',job.intentSha256]])assert.equal(hash(readFileSync(artPath(dir,'motion-plan/'+name))),digest,'Stale plan; prepare a fresh set');
  const plan=read(join(dir,'motion-plan/REGION_LOCKS.json')),intent=read(join(dir,'motion-plan/FRAME_INTENT.json'));compileIdlePlan(plan);
  assert.equal(plan.view,job.view);assert.deepEqual(plan.canvas,job.canvas);
  for(const frame of IDLE_FRAMES.slice(1)){const request=requestFor(job,frame);assert.deepEqual(read(join(dir,'motion-plan/'+frame.id+'-request.json')),request,'Changed frame request');assert.equal(readFileSync(join(dir,'motion-plan/'+frame.id+'-request.txt'),'utf8'),requestText(request),'Changed frame prompt');}
  const manifest=read(join(dir,'MANIFEST.json'));assert.equal(manifest.setId,job.setId);assert.equal(manifest.view,job.view);assert.deepEqual(manifest.designParent,job.parent);
  verifyRegistry(join(dir,'MANIFEST.json'),{root});
  assert.equal(manifest.originals[0].sha256,job.anchorSha256);
  for(const frame of IDLE_FRAMES.slice(1)){
    const target=artPath(dir,frame.file),receiptFile=join(dir,'generated/'+frame.id+'-receipt.json'),registered=manifest.originals.find(e=>e.slot===frame.id);
    assert.equal(existsSync(target),Boolean(registered),'Unregistered or missing frame');assert.equal(existsSync(receiptFile),Boolean(registered),'Missing or orphan frame receipt');
    if(registered){const receipt=read(receiptFile);assert.equal(receipt.frame,frame.id);assert.equal(receipt.anchorSha256,job.anchorSha256);assert.equal(receipt.planSha256,job.planSha256);assert.equal(receipt.sourceSha256,registered.sha256);assert.deepEqual(receipt.operations,['lossless-copy']);assert.ok(receipt.sourceReference?.trim());}
  }
  const confirmationFile=join(dir,'motion-plan/confirmation.json');let confirmed=false;
  if(existsSync(confirmationFile)){const c=read(confirmationFile);assert.ok(c.reference?.trim()&&c.actor==='chatgpt'&&c.scope==='neutral-anchor-and-region-plan-only','Real ChatGPT plan reference required');for(const k of ['anchorSha256','planSha256','intentSha256'])assert.equal(c[k],job[k],'Stale plan confirmation');confirmed=true;}
  return {job,dir,plan,intent,manifest,confirmed};
}
export function confirmIdlePlan(file,{root=ART_ROOT,reference}={}){
  const {job,dir}=loadIdleFrames(file,{root});assert.ok(reference?.trim(),'Supply actual ChatGPT anchor/region/budget/timing review reference');
  save(join(dir,'motion-plan/confirmation.json'),{actor:'chatgpt',reference,scope:'neutral-anchor-and-region-plan-only',anchorSha256:job.anchorSha256,planSha256:job.planSha256,intentSha256:job.intentSha256,...pending},true);
  return {planConfirmed:true,...pending};
}
export function receiveIdleFrame(file,{root=ART_ROOT,frame,source,sourceReference,anchorSha256}={}){
  const {job,dir,manifest,confirmed}=loadIdleFrames(file,{root}),spec=IDLE_FRAMES.find(f=>f.id===frame&&f.id!=='f1');
  assert.ok(spec,'Receive f2, f3 or f4 only');assert.ok(confirmed,'Confirm the actual ChatGPT neutral anchor/region plan review first');
  assert.equal(anchorSha256,job.anchorSha256,'Received frame must identify this exact anchor SHA256');assert.ok(sourceReference?.trim(),'Actual generation source reference required');
  assert.ok(!manifest.originals.some(e=>e.slot===frame),'Frame exists; use a new set for revisions');
  const path=resolve(source),bytes=readFileSync(path),decoded=decodeIdlePng(path);assert.deepEqual(decoded.dimensions,job.canvas,'Canvas mismatch; never resize received art');
  writeFileSync(artPath(dir,spec.file),bytes,{flag:'wx'});
  save(join(dir,'generated/'+frame+'-receipt.json'),{frame,sourceFilename:basename(path),sourceReference,sourceSha256:hash(bytes),anchorSha256,planSha256:job.planSha256,operations:['lossless-copy'],observedModel:null,observedModelStatus:'unverified',...pending},true);
  manifest.originals.push(entry(frame,spec.file,basename(path),bytes,decoded.dimensions));manifest.originals.sort((a,b)=>a.slot.localeCompare(b.slot));inventory(dir,manifest);
  return {frame,sha256:hash(bytes),originalPreserved:true,...pending};
}
function describeFrame(data,w,h,minimumAlpha=1){
  let left=w,top=h,right=-1,bottom=-1,mass=0,sx=0,sy=0;
  const alpha={transparent:0,soft:0,opaque:0};
  for(let p=0;p<w*h;p++){
    const a=data[p*4+3];alpha[a===0?'transparent':a===255?'opaque':'soft']++;
    if(a<minimumAlpha)continue;
    const x=p%w,y=Math.floor(p/w);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
    mass+=a;sx+=x*a;sy+=y*a;
  }
  return {bounds:right<0?null:[left,top,right-left+1,bottom-top+1],alpha,alphaWeightedCenter:mass?[sx/mass,sy/mass]:null};
}
function colorProfile(bytes){let offset=8;const chunks=[];while(offset+12<=bytes.length){const length=bytes.readUInt32BE(offset),name=bytes.toString('ascii',offset+4,offset+8);if(['cHRM','gAMA','iCCP','sRGB'].includes(name))chunks.push(bytes.subarray(offset,offset+length+12));offset+=length+12;}return hash(Buffer.concat(chunks));}
function footAnchors(data,w,zones){return zones.filter(z=>z.id.startsWith('shoe-')).map(z=>{let bottom=-1,left=w,right=-1;for(let y=z.rect[1];y<z.rect[1]+z.rect[3];y++)for(let x=z.rect[0];x<z.rect[0]+z.rect[2];x++)if(data[(y*w+x)*4+3]>=128){if(y>bottom){bottom=y;left=x;right=x;}else if(y===bottom){left=Math.min(left,x);right=Math.max(right,x);}}return {zone:z.id,measurementAlphaThreshold:128,lowestAlphaRow:bottom<0?null:bottom,contactSpan:bottom<0?null:[left,right],interpretation:'image-space proxy inside draft shoe rectangle; threshold is measurement only, never alpha conversion; anatomical contact requires ChatGPT review'};});}
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function reviewHtml(job,plan,report,images){
  const [w,h]=job.canvas,svg=`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${plan.protectedZones.map(z=>`<rect x="${z.rect[0]}" y="${z.rect[1]}" width="${z.rect[2]}" height="${z.rect[3]}" fill="none" stroke="#ec4358" stroke-width="4"><title>${escape(z.id)}</title></rect>`).join('')}${plan.motionRegions.map(r=>`<polygon points="${r.polygon.map(p=>p.join(',')).join(' ')}" fill="#3cff8c55" stroke="#087e36" stroke-width="3"><title>${escape(r.id)}</title></polygon>`).join('')}</svg>`;
  const content=JSON.stringify({images,durations:report.durationsMs}).replaceAll('<','\\u003c');
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${job.view.toUpperCase()} anchor Idle review</title><style>body{font:16px/1.55 system-ui;background:#f0eadf;color:#24201e;margin:24px}button,select{font:inherit;margin:5px}section{display:flex;gap:16px;flex-wrap:wrap}.stage{position:relative;width:min(360px,80vw);aspect-ratio:${w}/${h};background:#faf6ed;border:1px solid #bbb}.stage img,.stage svg{width:100%;height:100%;position:absolute;object-fit:contain}.dark{background:#22282d}.small{width:64px;height:96px;aspect-ratio:auto}.small img{object-fit:contain}pre{white-space:pre-wrap;overflow-wrap:anywhere}code{overflow-wrap:anywhere}</style><h1>${job.view.toUpperCase()} anchor Idle — ${report.technicalStatus}</h1><p>LOOKDEV ONLY · pending-motion-review. 위치 보정/리사이즈 저장/알파 변환 없음. 작은 64×96 영역은 표시 가설입니다.</p><p>영역/neutral 확인: ${report.planConfirmed?'실제 확인 기록 있음 (모션 승인은 별개)':'DRAFT — ChatGPT 확인 필요'}. 누락: ${report.missingFrames.join(', ')||'없음'}. 빨강=잠금 보호, 초록=미세 움직임 허용.</p><button id="play" ${images.length!==4?'disabled':''}>재생 / 정지</button><select id="frame">${report.sourceMetrics.map(m=>`<option value="${m.frame}">${m.frame}</option>`).join('')}</select><label><input id="mask" type="checkbox" checked>영역 표시</label><section><div class="stage"><img class="frame" alt="light original"><div id="overlay" style="position:absolute;inset:0">${svg}</div></div><div class="stage dark"><img class="frame" alt="dark original"></div><div class="stage small"><img class="frame" alt="64x96 display only"></div><div class="stage small dark"><img class="frame" alt="64x96 dark display only"></div></section><h2>개별 원본 비교</h2><section>${images.map((src,i)=>`<figure><figcaption>${report.sourceMetrics[i].frame}</figcaption><img src="${src}" style="width:160px;max-width:100%" alt="individual original"></figure>`).join('')}</section><p>Art critique / breathing readability / camera consistency: unreviewed. No native/runtime/game approval.</p><pre>${escape(JSON.stringify(report,null,2))}</pre><script>const d=${content},sel=document.querySelector('#frame');let n=0,running=false,timer;function show(){document.querySelectorAll('img.frame').forEach(e=>e.src=d.images[n]);sel.selectedIndex=n;}function tick(){show();if(running)timer=setTimeout(()=>{n=(n+1)%d.images.length;tick()},d.durations[n]);}document.querySelector('#play').onclick=()=>{running=!running;clearTimeout(timer);if(running)tick()};sel.onchange=()=>{running=false;clearTimeout(timer);n=sel.selectedIndex;show()};document.querySelector('#mask').onchange=e=>document.querySelector('#overlay').hidden=!e.target.checked;show();</script></html>`;
}
export function inspectIdleFrames(file,{root=ART_ROOT}={}){
  const {job,dir,plan,intent,manifest,confirmed}=loadIdleFrames(file,{root}),frames=manifest.originals.map(e=>decodeIdlePng(artPath(dir,e.path)));
  frames.forEach(f=>assert.deepEqual(f.dimensions,job.canvas,'Original decoder canvas mismatch'));
  const sourceMetrics=manifest.originals.map((e,i)=>({frame:e.slot,sha256:e.sha256,bytes:e.bytes,colorProfileSha256:colorProfile(readFileSync(artPath(dir,e.path))),...describeFrame(frames[i].data,...job.canvas),coreBoundsAtAlpha128:describeFrame(frames[i].data,...job.canvas,128).bounds,footAnchors:footAnchors(frames[i].data,job.canvas[0],plan.protectedZones)}));
  const missingFrames=IDLE_FRAMES.filter(f=>!manifest.originals.some(e=>e.slot===f.id)).map(f=>f.id);
  let report=missingFrames.length?{technicalStatus:'awaiting_frames',blockers:['missing_original_frames'],...pending}:inspectIdlePixels(frames.map(f=>f.data),plan,intent);
  if(!confirmed){report.blockers.push('anchor_region_plan_unconfirmed');if(!missingFrames.length)report.technicalStatus='blocked';}
  for(const m of sourceMetrics)if(!m.bounds||!m.alpha.transparent){report.blockers.push(m.frame+':empty_or_nontransparent_canvas');report.technicalStatus='blocked';}
  if(sourceMetrics.some(m=>m.colorProfileSha256!==sourceMetrics[0].colorProfileSha256)){report.blockers.push('png_color_profile_chunks_differ');report.technicalStatus='blocked';}
  report={...report,view:job.view,anchorSha256:job.anchorSha256,planSha256:job.planSha256,intentSha256:job.intentSha256,planConfirmed:confirmed,missingFrames,sourceMetrics,durationsMs:intent.frames.map(f=>f.durationMs),
    globalPositionPolicy:'zero correction; lower-body translation measurement plus exact outside-mask comparison',
    requiredChecks:['global-translation','foot-lock','locked-region-consistency','motion-region-change-budget','loop-4-to-1','morph-summary'],
    artisticBreathingReadability:'unreviewed',assemblyReady:missingFrames.length===0&&report.blockers.length===0,...pending};
  const images=manifest.originals.map(e=>'data:image/png;base64,'+readFileSync(artPath(dir,e.path)).toString('base64'));
  save(join(dir,'review/alignment-report.json'),report);writeFileSync(join(dir,'review/loop-preview.html'),reviewHtml(job,plan,report,images));
  return {technicalStatus:report.technicalStatus,blockers:report.blockers,missingFrames,assemblyReady:report.assemblyReady,review:join(dir,'review/loop-preview.html'),...pending};
}
export function assembleIdleFrames(file,{root=ART_ROOT}={}){
  const inspection=inspectIdleFrames(file,{root});assert.ok(inspection.assemblyReady,'Assembly blocked: '+inspection.blockers.join(', '));
  const {job,dir,manifest}=loadIdleFrames(file,{root}),out=join(dir,'assembly/idle-4cut-reference.png');
  assert.ok(!existsSync(out)&&!existsSync(join(dir,'assembly/ASSEMBLY.json')),'Assembly exists; never overwrite');
  const result=JSON.parse(python('assemble',[],JSON.stringify({files:manifest.originals.map(e=>artPath(dir,e.path)),out})).toString());
  save(join(dir,'assembly/ASSEMBLY.json'),{kind:'derived-reference-sheet',...result,sources:manifest.originals,anchorSha256:job.anchorSha256,planSha256:job.planSha256,reportSha256:hash(readFileSync(join(dir,'review/alignment-report.json'))),...pending},true);
  return {file:out,...result,...pending};
}
function arg(args,key){const i=args.indexOf(key);if(i<0)return undefined;const value=args[i+1];assert.ok(value&&!value.startsWith('--'),key+' requires a value');return value;}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [op,...args]=process.argv.slice(2),job=arg(args,'--job');let result;
  if(op==='prepare')result=prepareIdleFrames({out:arg(args,'--out'),view:arg(args,'--view'),parentJob:arg(args,'--parent-job'),parentReview:arg(args,'--parent-review'),anchor:arg(args,'--anchor'),plan:arg(args,'--plan'),intent:arg(args,'--intent')});
  else if(op==='confirm-plan')result=confirmIdlePlan(job,{reference:arg(args,'--reference')});
  else if(op==='intake')result=receiveIdleFrame(job,{frame:arg(args,'--frame'),source:arg(args,'--source'),sourceReference:arg(args,'--source-reference'),anchorSha256:arg(args,'--anchor-sha')});
  else if(op==='inspect')result=inspectIdleFrames(job);
  else if(op==='assemble')result=assembleIdleFrames(job);
  else throw Error('Usage: idle-frames.mjs prepare|confirm-plan|intake|inspect|assemble (docs/briefs/rounded-02/idle-frame-workflow.md)');
  console.log(JSON.stringify(result,null,2));
}
