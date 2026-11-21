import {createCanvas,GlobalFonts,loadImage} from '@napi-rs/canvas';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import '../tests/sprite-fixture.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';
import {createSpriteContext,spriteManifest} from '../lib/camp-sprite-assets.mjs';
import {CAMPER_ART_FILES} from '../lib/camp-camper-art.mjs';
import {candidateContext,readCamperCandidate} from './camper-review-assets.mjs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const staged=readCamperCandidate();
const candidate=candidateContext(staged);
const out=join(staged.path,'review');
mkdirSync(out,{recursive:true});
const baseline=createSpriteContext({...spriteManifest,files:{...spriteManifest.files,...CAMPER_ART_FILES}},
  {loader:url=>loadImage(fileURLToPath(new URL('../public'+url,import.meta.url))),cacheLimit:64});
await baseline.preloadSprites(Object.keys(CAMPER_ART_FILES));
if((await candidate.preloadSprites(Object.keys(candidate.manifest.files))).some(img=>!img))
  throw Error('Missing candidate preview image');
const font=process.env.CAMP_REVIEW_KOREAN_FONT || (process.platform==='win32'?
  'C:/Windows/Fonts/malgun.ttf':'/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc');
if(existsSync(font))GlobalFonts.register(readFileSync(font),'Review');
const looks=['단발 · 재킷','단발 · 후디','묶음 · 재킷','묶음 · 후디'];
const sheet=createCanvas(960,718),c=sheet.getContext('2d');
c.fillStyle='#f5f1e8';c.fillRect(0,0,sheet.width,sheet.height);
function label(text,x,y,size=16,bold=false){
  c.fillStyle='#423c35';c.font=(bold?'bold ':'')+size+'px Review, sans-serif';c.fillText(text,x,y);
}
label('같은 캠퍼의 정지와 보행',24,39,27,true);
label('남동향  ·  동일한 기본 의상 색  ·  게임 렌더러 1.5배 확대',25,67,15);
for(const [i,title] of ['기존','재생성'].entries()){
  const x=120+i*414;
  label(title,x+6,104,20,true);
  for(const [j,pose] of ['정지','보행 1','보행 5','착석'].entries())label(pose,x+7+j*99,131,14);
}
for(const [look,name] of looks.entries()){
  const top=144+look*141;
  c.fillStyle=look%2?'#ebe6dc':'#f2ede3';c.fillRect(12,top,936,137);
  label(name,22,top+75,15,true);
  for(const [i,assets] of [baseline,candidate].entries()){
    for(const [j,state] of [{},{moving:true,walkCycle:0},{moving:true,walkCycle:.5},{sitting:true}].entries()){
      c.save();c.translate(154+i*414+j*99,top+116);c.scale(1.5,1.5);
      drawCharacter(c,{id:'',color:'#606060',hairStyle:Math.floor(look/2),topStyle:look%2,visualDirection:'front-right',...state},
        {assets,time:0,reduced:!state.moving});c.restore();
    }
  }
}
writeFileSync(join(out,'wardrobe-comparison.png'),sheet.toBuffer('image/png'));

// Crop the same part of each verified 390 × 520 capture, at its actual game scale.
const job=process.argv[2];
if(job){
  if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(job))throw Error('Invalid current-art job');
  const dir=fileURLToPath(new URL('../outputs/current-art/'+job+'/',import.meta.url));
  const verify=fileURLToPath(new URL('../tests/current-art-review.mjs',import.meta.url));
  execFileSync(process.execPath,[verify,'verify',job],{stdio:'inherit'});
  const after=JSON.parse(readFileSync(join(dir,'after','receipt.json')));
  assert.deepEqual(after.release.camperCandidate,staged.manifest);
  const panel=createCanvas(896,460),ink=panel.getContext('2d');
  ink.fillStyle='#f5f1e8';ink.fillRect(0,0,panel.width,panel.height);
  ink.fillStyle='#423c35';ink.font='bold 16px Review, sans-serif';
  for(const [i,title] of ['모닥불 캠프','놀이터','전시장'].entries())
    ink.fillText(title,70+i*272,26);
  for(const [j,phase] of ['before','after'].entries()){
    ink.fillText(j?'재생성':'기존',9,140+j*210);
    for(const [i,map] of ['camp','playground','showroom'].entries()){
      const image=await loadImage(join(dir,phase,map+'-mobile.png'));
      ink.drawImage(image,60,156,268,205,70+i*272,36+j*210,268,205);
    }
  }
  writeFileSync(join(out,'scene-comparison.png'),panel.toBuffer('image/png'));
}
