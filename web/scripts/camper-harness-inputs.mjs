import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {ROOT,inside,readJSON} from '../../tools/lib/sprite-spec.mjs';
import {contract} from './camper-consistency.mjs';
import {walkSources} from './pack-walk-detail.mjs';
import {headRecipe,camperMasterNames} from './build-shared-camper-head.mjs';

const art=fileURLToPath(new URL('../../art/sprites/field-camper-v2/',import.meta.url));
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export const objectDigest=object=>digest(JSON.stringify(object));
export const camperInputNames=(version=2)=>[...contract.nativeSheets.map(name=>name+'.png'),
  ...walkSources.map(([outfit])=>`walk-detail/${outfit}-drawing.png`),...camperMasterNames(headRecipe,{bodyOnly:version===2})];
export const contractDigest=(version=1)=>objectDigest(version===1?{contract,headRecipe}:{contract,headRecipe,walkBodyOnly:true});
export const isSha256=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);

export function camperJobPath(job){
  if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(job||''))throw Error('Invalid camper job name');
  return inside(ROOT,`web/outputs/camper-harness/${job}`);
}

export function currentCamperInputs(version=2){
  const native=readJSON(inside(art,'sources.json'));
  const masters=readJSON(inside(art,'shared-head/masters/sources.json'));
  return {version,source:'current',calibration:contract.sourceCalibration,files:Object.fromEntries(camperInputNames(version).map(name=>{
    const walk=walkSources.find(([outfit])=>name===`walk-detail/${outfit}-drawing.png`);
    const hash=name.startsWith('shared-head/')?masters[name.split('/').at(-1)]:walk?.[2]??native[name.slice(0,-4)];
    return [name,hash];
  }))};
}

export function camperDraftInputs(version=2){
  return {version,source:'job',calibration:contract.sourceCalibration,
    files:Object.fromEntries(camperInputNames(version).map(name=>[name,null]))};
}

export function readCamperInputs(receipt,jobDir,{record=false}={}){
  if(![1,2].includes(receipt?.version)||!['job','current'].includes(receipt.source)||!receipt.files)
    throw Error('Invalid camper input manifest');
  const required=camperInputNames(receipt.version);
  if(Object.keys(receipt.files).sort().join('|')!==[...required].sort().join('|'))throw Error('Invalid camper input file list');
  const {calibration}=receipt;
  const frames=contract.directions.length*2;
  if(!Array.isArray(calibration?.headHeights)||calibration.headHeights.length!==contract.nativeSheets.length||
      !calibration.headHeights.every(row=>Array.isArray(row)&&[1,frames].includes(row.length)&&row.every(n=>Number.isInteger(n)&&n>0))||
      !Array.isArray(calibration.walkMattes)||calibration.walkMattes.length!==walkSources.length||
      !calibration.walkMattes.every(n=>Number.isInteger(n)&&n>=0&&n<238))throw Error('Invalid camper source calibration');
  const images=new Map(), hashes={}, errors=[];
  for(const name of required){
    const path=receipt.source==='current'?inside(art,name):inside(jobDir,'input/'+name);
    if(!existsSync(path)){errors.push(`missing ${name}`);continue;}
    const bytes=readFileSync(path);
    if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'){errors.push(`not a PNG ${name}`);continue;}
    const hash=digest(bytes);
    if(!record&&hash!==receipt.files[name]){errors.push(`${receipt.files[name]?'changed':'unregistered'} ${name}`);continue;}
    hashes[name]=hash;
    images.set(name,bytes);
  }
  if(errors.length)throw Error('Camper inputs:\n'+errors.join('\n'));
  return {calibration,hashes,readInput:name=>{
    if(!images.has(name))throw Error('Undeclared camper input '+name);
    return images.get(name);
  }};
}

export function camperBrief(version=2){
  const directions=['남동','북동','북서','남서'];
  const colors=Object.entries(contract.swatches).map(([role,rgb])=>`${role} RGB ${rgb.join(',')}`).join(' / ');
  const [w,h]=contract.cell,[walkW,walkH]=contract.walkCell;
  const lines=[
    '# HuddlersFire 캠퍼 원화 재생성 요청',
    '',
    '현재 캠퍼의 체격과 픽셀 색면을 이어갈 투명 PNG를 제작한다. 캔버스에 배경·문자·가이드를 그리지 않는다.',
    `- 기본 동작 셀 ${w}×${h}, 목 중심 (${contract.neckX}, ${contract.neck}). 서기 발 접점 Y ${contract.standingSoles.join('·')}.`,
    `- 방향 순서 ${directions.join(' → ')}. 보행 원화는 이 방향을 행으로, 보폭 ${contract.walkSteps}개를 열로 배열한다. 게임용 보행 셀 ${walkW}×${walkH}.`,
    `- 포즈 키 ${Object.entries(contract.poses).map(([role,poses])=>`${role} ${poses.join('·')}`).join(' / ')}.`,
    `- 중립 조명의 재질 중간색 ${colors}.`,
    `- 머리 폭·높이 허용치 ${contract.tolerance.span}·${contract.tolerance.crown}px, 발 ${contract.tolerance.sole}px, 색 RGB 채널당 ${contract.tolerance.materialChannel}.`,
    '- 공통 머리는 두피·귀·눈·코·턱과 표정을 담는다. 단발과 묶은 머리는 독립 투명 레이어로 제공하며 눈·코·턱 보호 영역을 비운다.',
    '- 헤어 두 종과 재킷·후디를 교차 착용한다. 정지와 보행은 방향별로 같은 기본 머리·헤어를 사용한다. 앞손 픽셀은 의상과 함께 작업한다.',
    '- 눈·턱·앞머리의 판독은 실제 게임 크기에서 먼저 본다. 빠진 방향·프레임은 별도 표기한다.',
    '',
    '## 제작 순서',
    '',
    '먼저 남동·북동·북서·남서의 서기 키포즈를 2:1 쿼터뷰에서 그린다. 공통 머리를 고정하고 두 헤어와 두 상의를 교차 착용해 실제 크기에서 검토한다.',
    '기준 캐릭터를 잡은 뒤 착석·호흡·깜빡임과 제스처를 제작한다. 마지막으로 두 상의의 4방향 보행을 이어서 그려 8→1프레임의 이음새와 발 접지를 확인한다.',
    '',
    '## 기본 머리의 방향별 정렬',
    '',
    '64×80 셀의 왼쪽 위를 (0, 0)으로 잡는다. 사각형은 왼쪽·위쪽·오른쪽·아래쪽 순서이며 오른쪽과 아래쪽 좌표는 범위에 포함하지 않는다.',
    '',
    '| 방향 | 공통 머리 경계 | 헤어가 덮어서는 안 되는 눈·코·턱 영역 |',
    '| --- | --- | --- |',
    ...directions.map((direction,i)=>`| ${direction} | ${headRecipe.faceBounds.native[i].join(', ')} | ${
      headRecipe.protectedFeatures.native[i]?.map(box=>box.join(', ')).join(' / ')??'후면 실루엣과 목 기준'} |`),
    '',
    '## 입력 파일',
    '',
    ...camperInputNames(version).map(name=>'- `input/'+name+'`'),
    '',
    '기본 원화는 4열×2행이다. 제스처의 8칸은 위 행에서 아래 행으로 읽으며 명세의 키 순서를 사용한다.',
    version===2?'공통 얼굴과 두 헤어의 마스터는 각각 4열×8행이다. 두 보행 전신 원화의 머리는 자세와 목 정렬에 사용하고 최종 보행 아틀라스에는 몸통과 다리를 담는다.':
      '편집용 머리 마스터는 기본 4열×8행, 보행용 4열×1행이다.',
    '소스 이미지의 픽셀 밀도가 달라졌다면 `inputs.json`의 `calibration`에 실측한 원본 머리 높이와 보행 알파 컷오프를 기록한다.',
  ];
  return lines.join('\n')+'\n';
}
