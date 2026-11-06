// Pixel import/audit branch of the existing sprite-job harness. No model calls,
// resizing, recolouring, auto-mirroring or writes to original images.
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {ROOT,inside,readJSON,writeJSON,hash,runtimeHash} from './sprite-spec.mjs';
import {SPRITE_MANIFEST} from '../../web/lib/camp-sprite-manifest.mjs';
import {projectWorld} from '../../web/lib/camp-scene-frame.mjs';
const require=createRequire(new URL('../../web/package.json',import.meta.url));
const {createCanvas,loadImage}=require('@napi-rs/canvas');
export const PIXEL_GRADES=['usable_as_is','needs_anchor','needs_redraw','reference_only'];
export function validatePixelCatalog(catalog){
  const ids=new Set();
  if(catalog.version!==1||!catalog.assets?.length)throw Error('Pixel catalog required');
  for(const a of catalog.assets){if(!/^[a-z][a-z0-9_.-]+$/.test(a.id)||ids.has(a.id)||!PIXEL_GRADES.includes(a.status)||!a.reason||!a.file||!a.source||!Array.isArray(a.size)||a.size.length!==2||a.size.some(n=>!Number.isInteger(n)||n<=0))throw Error('Invalid pixel entry: '+a.id);ids.add(a.id);inside(ROOT,a.file);inside(ROOT,a.source);
    if(a.status==='usable_as_is'&&(!a.approval?.reviewer||!a.approval.observation||a.projection!=='verified'||a.grid!=='verified'||!Array.isArray(a.ground)||a.ground.length!==2||a.ground.some((v,i)=>!Number.isInteger(v)||v<0||v>=a.size[i])||!Array.isArray(a.displaySize)||a.displaySize.length!==2||a.displaySize.some((v,i)=>!Number.isInteger(v)||v<=0||v%a.size[i]!==0)||a.displaySize[0]/a.size[0]!==a.displaySize[1]/a.size[1]||!a.paletteId||!a.paletteRgb?.length||a.paletteRgb.some(c=>!/^#[0-9a-f]{6}$/i.test(c))))throw Error('Approval metadata missing: '+a.id);
  }return catalog;
}
function specSnapshot(specFile){const spec=readJSON(specFile).pixelQuarterview;if(!spec||spec.version!==1||spec.projection.tile[0]!==80||spec.projection.tile[1]!==40||JSON.stringify(projectWorld(1,0))!=='[40,20]'||JSON.stringify(projectWorld(0,1))!=='[-40,20]')throw Error('STOP: actual projection differs from the pixel specification');return spec;}
function inputHashes(catalog){return Object.fromEntries([...new Set(catalog.assets.flatMap(a=>[a.file,a.source,...(a.normalization?.recipe?[a.normalization.recipe]:[]),...(a.normalization?.report?[a.normalization.report]:[])]).concat(catalog.references||[]))].sort().map(file=>[file,hash(readFileSync(inside(ROOT,file)))]));}
export function verifyNormalizedEntry(entry){
 if(!entry.normalization)return null;const recipe=readJSON(inside(ROOT,entry.normalization.recipe)),report=readJSON(inside(ROOT,entry.normalization.report)),filename=entry.file.split(/[\\/]/).at(-1);
 if(entry.normalization.sourceSha256!==recipe.sourceSha256||report.sourceSha256!==recipe.sourceSha256||hash(readFileSync(inside(ROOT,entry.source)))!==recipe.sourceSha256||report.recipeSha256!==hash(recipe)||report.normalizerSha256!==hash(readFileSync(new URL('./pixel-normalize.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n'))||report.spriteGenCommit!==readJSON(resolve(ROOT,'tools/sprite-gen.lock.json')).commit||report.outputs[filename]!==hash(readFileSync(inside(ROOT,entry.file))))throw Error('Stale or mismatched normalization proof: '+entry.id);
 return {sourcePreserved:true,pixelsVerified:true,productionApproved:false};
}
export function preparePixelJob({out,catalogFile=resolve(ROOT,'art/sprites/pixel-quarterview/catalog.json'),specFile=resolve(ROOT,'art/sprites/scene-spec.json')}={}){
  const catalog=validatePixelCatalog(readJSON(catalogFile)),spec=specSnapshot(specFile),runs=resolve(ROOT,'art/sprites/runs');mkdirSync(runs,{recursive:true});
  const dir=inside(runs,out||'pixel-'+Date.now());if(existsSync(dir))throw Error('Job directory already exists');mkdirSync(dir,{recursive:true});
  writeJSON(resolve(dir,'job.json'),{version:1,kind:'pixel-quarterview',spec,catalog,specFile:resolve(specFile).replaceAll('\\','/').replace(ROOT.replaceAll('\\','/'),''),catalogFile:resolve(catalogFile).replaceAll('\\','/').replace(ROOT.replaceAll('\\','/'),''),inputs:inputHashes(catalog)});
  return dir;
}
export function loadPixelJob(file){
  const job=readJSON(file);inside(resolve(ROOT,'art/sprites/runs'),resolve(file));
  if(job.kind!=='pixel-quarterview'||job.version!==1)throw Error('Pixel job expected');validatePixelCatalog(job.catalog);
  if(hash(job.inputs)!==hash(inputHashes(job.catalog)))throw Error('Original input changed; prepare a new pixel job');
  const current=specSnapshot(resolve(ROOT,job.specFile));if(hash(job.spec)!==hash(current)||hash(job.catalog)!==hash(readJSON(resolve(ROOT,job.catalogFile))))throw Error('Stale pixel specification/catalog; prepare a new job');return job;
}
export async function inspectImage(file,palette=null){
  const bytes=readFileSync(file),image=await loadImage(bytes),canvas=createCanvas(image.width,image.height),c=canvas.getContext('2d');c.drawImage(image,0,0);const d=c.getImageData(0,0,image.width,image.height).data;
  let opaque=0,transparent=0,soft=0,x=image.width,y=image.height,r=-1,b=-1,edgePixels=0,redFringe=0;const colors=new Set();
  for(let yy=0;yy<image.height;yy++)for(let xx=0;xx<image.width;xx++){const i=(yy*image.width+xx)*4,a=d[i+3];if(a===0){transparent++;continue;}if(a===255)opaque++;else soft++;colors.add((d[i]<<16)|(d[i+1]<<8)|d[i+2]);x=Math.min(x,xx);y=Math.min(y,yy);r=Math.max(r,xx);b=Math.max(b,yy);
    if(a>=128&&[[xx-1,yy],[xx+1,yy],[xx,yy-1],[xx,yy+1]].some(([nx,ny])=>nx<0||ny<0||nx>=image.width||ny>=image.height||d[(ny*image.width+nx)*4+3]<128)){edgePixels++;if(d[i]>180&&d[i]>d[i+1]*1.6&&d[i]>d[i+2]*1.6)redFringe++;}
  }
  const allowed=palette&&new Set(palette.map(c=>parseInt(c.slice(1),16)));
  return {sha256:hash(bytes),bytes:bytes.length,size:[image.width,image.height],alpha:{opaque,transparent,soft},bounds:r<0?null:[x,y,r-x+1,b-y+1],visibleColors:colors.size,paletteMismatches:allowed?[...colors].filter(c=>!allowed.has(c)).length:null,edgePixels,redFringe};
}
export function pixelFingerprint(job){return hash({spec:job.spec,catalog:job.catalog,inputs:job.inputs,runtime:runtimeHash(),harness:['tools/lib/pixel-assets.mjs','tools/lib/pixel-normalize.mjs','tools/import-pixel-package.mjs','tools/prepare-sprite-job.mjs','tools/rebuild-sprites.mjs','tools/review-sprite-job.mjs','web/tests/render-pixel-preview.mjs','web/tests/render-pixel-body.mjs','web/tests/pixel-preview-ui.mjs','web/tests/sprite-preview-plugin.mjs'].map(f=>hash(readFileSync(inside(ROOT,f))))});}
export async function buildPixelJob(file){
  const job=loadPixelJob(file),dir=dirname(resolve(file)),out=inside(dir,'build');mkdirSync(out,{recursive:true});
  const inventory=[],sources={};for(const a of job.catalog.assets){verifyNormalizedEntry(a);const metrics=await inspectImage(inside(ROOT,a.file),a.status==='usable_as_is'?a.paletteRgb:null);if(!metrics.bounds||JSON.stringify(metrics.size)!==JSON.stringify(a.size)||metrics.alpha.soft||metrics.paletteMismatches)throw Error('Candidate file/size/binary-alpha/palette invalid: '+a.id);if(!sources[a.source])sources[a.source]=await inspectImage(inside(ROOT,a.source));
    inventory.push({...a,metrics,productionEligible:a.status==='usable_as_is',checks:{fileSize:'pass',alpha:'pass',projection:a.projection,pixelGrid:a.grid,anchors:a.ground?'draft':'missing',tileConnectivity:a.id.includes('path_')?'unverified':'not_applicable',layerCompatibility:a.slot?'missing_direction_pose_frame_set':'not_applicable'}});
  }
  const data=structuredClone(SPRITE_MANIFEST),selected=[];for(const a of inventory){
    const name='pixel-'+a.id.replaceAll('.','-'),ext=name+'.png',bytes=readFileSync(inside(ROOT,a.file));copyFileSync(inside(ROOT,a.file),inside(out,ext));
    data.files[name]={url:'/__sprite-preview/files/'+ext,width:a.size[0],height:a.size[1],bytes:bytes.length,sha256:hash(bytes),sampling:'nearest'};
    data.sprites[name]={sheet:name,x:0,y:0,w:a.size[0],h:a.size[1],ungraded:true,depth:'sorted',sampling:'nearest',contacts:{ground:{x:a.ground?.[0]??a.size[0]/2,y:a.ground?.[1]??a.size[1]}}};if(a.pilot&&!a.review?.rejected)selected.push(name);
  }
  data.preview={selected,legacyAssets:Object.keys(SPRITE_MANIFEST.files),pixelQuarterview:true};data.previewFiles=selected;
  data.pixelQuarterview={catalog:job.catalog,spec:job.spec,basePilot:inventory.find(a=>a.pilot?.type==='avatar'&&!a.review?.rejected&&a.variants?.NW?.idle)?.id||null,overrides:inventory.filter(a=>a.pilot&&!a.review?.rejected&&a.kind==='prop').map(a=>({id:'pixel-'+a.id.replaceAll('.','-'),type:a.pilot.type,match:a.pilot.match,width:a.displaySize[0],status:a.status})),flagDefault:false};
  writeJSON(inside(out,'inventory.json'),{sources,assets:inventory,grades:Object.fromEntries(PIXEL_GRADES.map(k=>[k,inventory.filter(a=>a.status===k).length])),productionReady:inventory.filter(a=>a.productionEligible).map(a=>a.id)});
  writeJSON(inside(out,'manifest.json'),data);const fingerprint=pixelFingerprint(job),manifestHash=hash(readFileSync(inside(out,'manifest.json')));
  writeJSON(inside(out,'preview.json'),{fingerprint,manifestHash,selected});
  writeJSON(inside(dir,'review.template.json'),{kind:'pixel-quarterview',reviewer:'',fingerprint,manifestHash,result:'unreviewed',observations:[],unresolved:inventory.filter(a=>a.pilot&&a.status!=='usable_as_is').map(a=>a.id+': '+a.reason),cases:job.spec.cases.map(id=>({id,result:'unreviewed',observation:''}))});
  writeFileSync(inside(out,'REQUEST_MISSING_ASSETS.md'),pixelAssetRequest(job));
  return {directory:dir,inventory:inventory.length,grades:Object.fromEntries(PIXEL_GRADES.map(k=>[k,inventory.filter(a=>a.status===k).length])),productionReady:inventory.filter(a=>a.productionEligible).length,fingerprint};
}
export function verifyPixelReview(file,reviewFile){
  const job=loadPixelJob(file),dir=dirname(resolve(file)),built=readJSON(inside(dir,'build/preview.json')),review=readJSON(reviewFile),evidence=readJSON(inside(dir,'evidence.json'));
  if(built.fingerprint!==pixelFingerprint(job)||built.manifestHash!==hash(readFileSync(inside(dir,'build/manifest.json')))||review.fingerprint!==built.fingerprint||review.manifestHash!==built.manifestHash||evidence.fingerprint!==built.fingerprint||evidence.manifestHash!==built.manifestHash)throw Error('Stale pixel review/build/evidence');
  if(!review.reviewer||review.result!=='pass'||!review.observations?.length||review.unresolved?.length)throw Error('Unresolved pixel review; production installation blocked');
  const manifest=readJSON(inside(dir,'build/manifest.json'));for(const f of Object.values(manifest.files).filter(f=>f.url.startsWith('/__sprite-preview/files/'))){const bytes=readFileSync(inside(dir,'build/'+f.url.split('/').at(-1)));if(hash(bytes)!==f.sha256||bytes.length!==f.bytes)throw Error('Built pixel asset changed');}
  for(const id of job.spec.cases){const c=review.cases.find(c=>c.id===id),e=evidence.cases.find(c=>c.id===id);if(c?.result!=='pass'||!c.observation||!e)throw Error('Missing/failed/stale pixel case: '+id);const bytes=readFileSync(inside(dir,e.file));if(e.sha256!==hash(bytes)||bytes.length<24||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.readUInt32BE(16)!==e.width||bytes.readUInt32BE(20)!==e.height||e.kind!==(id.startsWith('canvas-')?'canvas':'ui'))throw Error('Missing/failed/stale pixel case: '+id);}
  for(const a of job.catalog.assets.filter(a=>a.pilot))if(a.status!=='usable_as_is')throw Error('Unapproved pilot asset: '+a.id);
  return {fingerprint:built.fingerprint,reviewer:review.reviewer};
}
export function pixelAssetRequest(job){
 const a=job.spec.avatar;if(!a.styleReference)return missingAssetRequest(job);
 const note=`## 이번에 제작할 기본 신체 1컷\n\n- 첨부할 실제 PNG: ${a.styleReference}. 이 원본의 실루엣·신체 비율·따뜻한 피부색을 참고한다. 원본은 규격 완성본이 아니다.\n- 이전 1/16 축소·6색 가공본과 그 4배 확대본은 사용자 품질 피드백으로 기각했다. 이를 제작 기준으로 쓰거나 NE/SW/SE를 먼저 확장하지 않는다.\n- **NW 뒷사선 idle 1컷부터**, 처음부터 ${a.canvas.join('×')} 논리 픽셀 캔버스에서 읽히도록 새로 그린다. 전체 신체가 들어가고 발 기준선 ${JSON.stringify(a.feet)}, 머리 중심 ${JSON.stringify(a.head)}을 제작 목표로 맞춘다. 머리 위치는 원본 비율을 참고한 초안이며 첫 컷에서 검토한다. 착석 좌면은 이번 정지 컷에 적용하지 않는다.\n- 1px 격자에 의도적으로 그린 외곽과 연결된 색면, 일관된 윤곽선·명암 단계를 요구한다. 정확한 6색 제한은 폐기한다. 원본의 따뜻한 명암을 살리는 팔레트와 정확 RGB 표를 함께 제출한다. 자동 양자화·디더링·큰 그림의 사후 강제 축소로 맞추지 않는다.\n- 최종 ${a.canvas.join('×')} 투명 PNG + 정확히 픽셀을 복제한 4배 검토본 + 방향/상태/캔버스/앵커/팔레트 메타데이터를 전달한다. 실제 1배와 게임 장면에서 외곽·손발·얼굴 없는 머리·주야간 가독성을 먼저 확인한다. 이 컷이 통과한 뒤 NE/SW/SE 정지, 걷기/착석/감정표현, 일치 레이어 순서로 확장한다.\n- 프롬프트로 정확한 크기·알파·격자가 보장되지는 않는다. 큰 이미지나 반투명 결과가 오면 원본을 보존해 불일치로 보고하고 재제작을 요청한다. 하네스가 강제 축소·6색 변환해서 통과시키지 않는다.\n\n`;
 return missingAssetRequest(job).replace('## 소품',note+'## 소품');
}
function missingAssetRequest(job){const a=job.spec.avatar;return `# 추가 이미지 제작 요청 · 픽셀 쿼터뷰\n\n상태: 요청 규격 초안. 현재 원본에서 승인된 공통 픽셀 격자/기본 신체가 없으며 아래 캔버스와 앵커는 **제작 목표 제안**이다. 아래 전체 방향/레이어는 후속 요구이며, 지금은 목표 크기에 맞게 그린 NW 기본 신체 정지 1컷만 먼저 검토한다.\n\n- 참조: art/sprites/pixel-quarterview/incoming/v0.1/assets/source/characters.png (인물·색감만), environment.png (소품만). scene_mood.png는 분위기 전용.\n- 실제 투영: screen=((x-y)*40,(x+y)*20), 정사각형=80×40. NW=(-1,0), NE=(0,-1), SW=(0,1), SE=(1,0). 카메라 회전 금지, 기존 팬·줌은 유지.\n- 논리 캔버스: ${a.canvas.join('×')}px, 모든 레이어 동일. feet=${JSON.stringify(a.feet)}, head=${JSON.stringify(a.head)}, bench seat=${JSON.stringify(a.seat)}. 앵커는 프레임마다 기록하며 같은 자세의 레이어끼리 정확히 일치.\n- 우선 기본 신체/피부, 헤어 2종(short_curly/bob), 상의 2종(hoodie/knit), 하의 1종을 각각 분리. 이어 모자/헤드폰, 표정, 액세서리. 긴 머리와 모자는 앞/뒤 레이어 분리.\n- 각 NW/NE/SW/SE에 idle 1, walk 6, sit_bench 1, emote 4프레임. 프레임 이름과 시간(ms) 동일; walk=100ms×6, emote=150ms×4. 단일 포즈 PNG 또는 정확한 프레임 좌표표 제출. 좌우 반전/늘이기로 방향을 대체하지 않는다.\n- 가림 순서: back_hair → base/skin → bottom → top → face → front_hair → headwear → accessory. 손 앞/뒤는 포즈별 명시.\n- 1 논리 픽셀, 불투명 색과 alpha=0/255, 안티앨리어싱/글로우/바닥 그림자/라벨 금지. 피부·머리·옷 색상은 정확 RGB 팔레트 표와 치환 영역 마스크 제출. 기존 사진은 생성기에 입력하지 않는다.\n\n## 소품\n\n- 벤치: 세계 축에 맞춘 두 축(화면 기울기 ±0.5), 네 착석 facing. ground/seat 접점과 두 seat slot을 같은 캔버스에 좌표로 명시; 현재 bench_ne/nw/se/s는 투영 미확정이므로 그대로 승인하지 않는다.\n- 모닥불: 돌/장작의 비발광 바닥 레이어, 6프레임 불꽃, 발광 마스크를 분리. 공용 불 성장/외형 5종은 기존 ID를 유지하며 누락 시 기존 표현. 빛은 renderer가 계산.\n- 나무 1종, 랜턴 1종, 라디오: 지면 접점, 논리 캔버스, 표시 크기, 충돌 footprint 별도. 밝은 테두리/빨간 잔여 픽셀 제거.\n- 경로: 2:1 화면 사진을 타일로 간주하지 않는다. 원본 정사각 타일의 크기와 각 방향 접속 마스크·직선/모서리/T/교차/끝을 제출하고 실제 3×3 반복 검사를 통과한다.\n\n## 전달 파일\n\nPNG 원본 + 각 파일의 방향/상태/레이어/frames/durations/canvas/frameAnchors/paletteId + 출처. catalog.json의 variants[direction][state]에 등록한다. 검사는 기존 prepare-sprite-job --pixel → rebuild-sprites --job → render-scene-preview --job → review-sprite-job --job 순서. PNG에 없는 프레임을 검증기가 만들어 주지는 않는다.\n`;}
