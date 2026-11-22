import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {camperPartCell} from '../lib/camp-camper-parts.mjs';
import {fileURLToPath} from 'node:url';
import '../tests/sprite-fixture.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';
import {candidateContext,readCamperCandidate} from './camper-review-assets.mjs';
import {join} from 'node:path';
const folder=new URL('../../art/sprites/field-camper-v2/shared-head/',import.meta.url);
const candidate=process.env.CAMP_CAMPER_JOB?readCamperCandidate():null;
const assets=candidate?candidateContext(candidate):undefined;
if(assets)await assets.preloadSprites(Object.keys(candidate.files));
const m=candidate?.manifest??JSON.parse(readFileSync(new URL('manifest.json',folder)));
const output=name=>candidate?join(candidate.path,'review',name):new URL(name,folder);
const font=process.env.CAMP_REVIEW_KOREAN_FONT||(process.platform==='win32'?'C:/Windows/Fonts/malgun.ttf':'/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc');
if(existsSync(font))GlobalFonts.registerFromPath(font,'Review');
const out=createCanvas(822,750),c=out.getContext('2d');c.fillStyle='#f3f0e8';c.fillRect(0,0,out.width,out.height);
c.fillStyle='#33322e';c.font='bold 23px Review, sans-serif';c.fillText('공통 머리와 헤어 파츠',18,36);
c.font='16px Review, sans-serif';['공통 머리','단발 파츠','묶은 머리 파츠','단발 착용','묶은 머리 착용'].forEach((t,i)=>c.fillText(t,110+139*i,71));
const cases=[[0,0,0,'정면 · 남동'],[0,0,1,'후면 · 북동'],[0,0,2,'후면 · 북서'],[0,0,3,'정면 · 남서'],[0,6,4,'눈 감기'],[0,4,4,'점프']];
const walk=(candidate?.files??m.files)['field-camper-walk'];
const walkHead=walk.bodyOnly?[0,0]:[1,8];
cases.push([...walkHead,0,'보행 · 남동'],[...walkHead,3,'보행 · 남서']);
const images=await Promise.all(['field-camper-v2','field-camper-walk'].map(id=>
  candidate?candidate.load(candidate.files[id].url):loadImage(fileURLToPath(new URL('../public'+m.files[id].url,import.meta.url)))));
for(const [i,[detail,group,index,title]] of cases.entries()){
 const top=80+83*i,unit=detail?3:1,part={group,index};
 c.fillStyle=i%2?'#e6e2d8':'#eee9df';c.fillRect(9,top,804,80);c.fillStyle='#33322e';c.font='14px Review, sans-serif';c.fillText(title,17,top+48);
 const draw=(layer,style,column)=>{const [x,y]=camperPartCell(part,layer,style,!!detail);c.imageSmoothingEnabled=!!detail;
 c.drawImage(images[detail],x*64*unit,y*80*unit,64*unit,44*unit,102+139*column,top,112,77);};
 draw('face',0,0);draw('hair',0,1);draw('hair',1,2);draw('face',0,3);draw('hair',0,3);draw('face',0,4);draw('hair',1,4);
}
writeFileSync(output('layers.png'),out.toBuffer('image/png'));

const wardrobe=createCanvas(720,630),ink=wardrobe.getContext('2d');
ink.fillStyle='#f3f0e8';ink.fillRect(0,0,720,630);
ink.fillStyle='#33322e';ink.font='bold 21px Review, sans-serif';
ink.fillText('헤어와 상의 교차 착용',16,32);
ink.font='15px Review, sans-serif';
['단발 · 재킷','묶은 머리 · 재킷','단발 · 후디','묶은 머리 · 후디'].forEach((s,i)=>ink.fillText(s,126+i*144,65));
const poses=[['정지',{}],['착석',{sitting:true}],['북동 보행',{moving:true,walkCycle:.375,visualDirection:'back-right'}],
  ['남서 보행',{moving:true,walkCycle:.75,visualDirection:'front-left'}],['손 흔들기',{emote:'wave'}],
  ['점프',{motion:'airborne',vz:2}]];
for(const [row,[title,pose]] of poses.entries()){
  const y=74+row*92;
  ink.fillStyle=row%2?'#e6e2d8':'#eee9df';ink.fillRect(8,y,704,90);
  ink.fillStyle='#33322e';ink.fillText(title,17,y+48);
  for(let i=0;i<4;i++){
    ink.save();ink.translate(163+i*144,y+82);ink.scale(1.15,1.15);
    drawCharacter(ink,{color:'#606060',id:'',visualDirection:'front-right',hairStyle:i%2,topStyle:Math.floor(i/2),...pose},
      {time:0,reduced:false,emote:pose.emote||null,assets});ink.restore();
  }
}
writeFileSync(output('wardrobe.png'),wardrobe.toBuffer('image/png'));
