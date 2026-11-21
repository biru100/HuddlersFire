import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {ROOT,inside,readJSON} from '../../tools/lib/sprite-spec.mjs';
import {reviewPng} from '../../tools/lib/review-png.mjs';
import {readCamperCandidate} from '../scripts/camper-review-assets.mjs';
import {digest,objectDigest,camperJobPath} from '../scripts/camper-harness-inputs.mjs';
import {releaseIdentity} from './current-art-evidence.mjs';
import {withCampArt} from '../lib/camp-art-release.mjs';
import {SPRITE_MANIFEST} from '../lib/camp-sprite-manifest.mjs';

export const camperZooms=[['min',.75],['default',1],['max',3]];
export const camperPoses=['idle','walk','stop'];
export const canvasFormats=[['desktop',900,640,1],['mobile',390,520,2],['desktop-125',900,640,1.25]];
export const browserFormats=[['desktop',1280,900,1,false],['mobile',390,844,2,true],['desktop-125',1024,720,1.25,false]];
export const fieldCases=formats=>formats.flatMap(([format])=>camperZooms.flatMap(([zoom])=>camperPoses.map(pose=>`${format}-${zoom}-${pose}`)));
export const browserLobbyCases=browserFormats.flatMap(([format])=>[0,1].flatMap(top=>[0,1].map(hair=>`${format}-lobby-${top}-${hair}`)));
export const browserPortraitCases=['roster-portrait','profile-portrait'];

export function camperReviewRoot(job){return inside(camperJobPath(job),'review');}

function protocol(kind){
  const shared=['camper-scale-evidence','current-art-evidence','sprite-fixture','render-camper-scales'];
  if(kind==='browser')shared.push('browser.camper-head','browser-cdp');
  return objectDigest(shared.map(name=>digest(readFileSync(inside(ROOT,`web/tests/${name}.mjs`),'utf8').replaceAll('\r\n','\n'))));
}

export function camperCaptureIdentity(kind,job,phase){
  const release=releaseIdentity(withCampArt(SPRITE_MANIFEST));
  const installed=Object.fromEntries(Object.entries(release.files).filter(([url])=>url.startsWith('/sprites/field-camper-')));
  const staged=phase==='after'?readCamperCandidate(job).manifest:null;
  return {protocol:protocol(kind),release:objectDigest(release),
    candidate:staged?.id??null,atlases:staged?Object.fromEntries(Object.values(staged.files).map(row=>[row.url,row.sha256])):installed};
}

function evidenceCases(kind){
  return kind==='canvas'?['subpixel-grid',...fieldCases(canvasFormats)]:
    [...browserLobbyCases,...fieldCases(browserFormats),'desktop-125-max-canvas',...browserPortraitCases];
}

function pngEvidence(dir,id){
  const file=inside(dir,id+'.png'),buf=readFileSync(file);
  const width=buf.readUInt32BE(16),height=buf.readUInt32BE(20);
  return {id,width,height,sha256:reviewPng(file,width,height)};
}

export function writeCamperCapture(dir,{job,kind,phase,identity,build=null}){
  const root=camperReviewRoot(job),prefix=kind==='browser'?'browser-':'';
  const baseline=phase==='after'?readCamperCapture(inside(root,prefix+'before'),kind,'before'):null;
  if(objectDigest(identity)!==objectDigest(camperCaptureIdentity(kind,job,phase)))
    throw Error('Camper inputs changed during capture');
  const payload={version:1,job,kind,phase,identity,baseline:baseline?.id??null,build,
    cases:evidenceCases(kind).map(id=>pngEvidence(dir,id))};
  const receipt={...payload,id:objectDigest(payload)};
  writeFileSync(inside(dir,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
  return receipt;
}

export function readCamperCapture(dir,kind,phase){
  const {id,...payload}=readJSON(inside(dir,'receipt.json'));
  if(id!==objectDigest(payload)||payload.version!==1||payload.kind!==kind||payload.phase!==phase||
     objectDigest(payload.cases.map(row=>row.id))!==objectDigest(evidenceCases(kind)))
    throw Error('Changed or incomplete camper capture: '+dir);
  for(const row of payload.cases){
    if(objectDigest(pngEvidence(dir,row.id))!==objectDigest(row))throw Error('Changed camper screenshot: '+row.id);
  }
  return {...payload,id};
}

export function verifyCamperPair(job,kind){
  const root=camperReviewRoot(job),prefix=kind==='browser'?'browser-':'';
  const [beforePath,afterPath]=['before','after'].map(phase=>inside(root,prefix+phase));
  if(kind==='browser'&&!existsSync(beforePath)&&!existsSync(afterPath))return null;
  const before=readCamperCapture(beforePath,kind,'before'),after=readCamperCapture(afterPath,kind,'after');
  return validateCamperPair(job,before,after,camperCaptureIdentity(kind,job,'before'),camperCaptureIdentity(kind,job,'after'));
}

export function validateCamperPair(job,before,after,active,candidate){
  if(before.job!==job||after.job!==job||after.baseline!==before.id||before.build!==after.build||
     objectDigest(before.identity)!==objectDigest(active)||objectDigest(after.identity)!==objectDigest(candidate))
    throw Error('Stale camper evidence or a different baseline; capture the current candidate again');
  if(before.cases.some(({width,height},i)=>width!==after.cases[i].width||height!==after.cases[i].height))
    throw Error('Camper captures have different display sizes');
  return {before:before.id,after:after.id,count:after.cases.length};
}
