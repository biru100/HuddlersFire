import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import sharp from 'sharp';
import {separateCamper} from './camper-collar.mjs';
import {camperPartCell,camperStrideRise} from '../lib/camp-camper-parts.mjs';
import {CAMPER_SOLES} from '../lib/camp-camper-art.mjs';
import {camperAtlasDimensions,contract,gradeCamperMaterials,inspectCamperAtlases} from './camper-consistency.mjs';
import {inspectHeadAtlas} from './inspect-camper-head.mjs';

const art=new URL('../../art/sprites/field-camper-v2/subculture-20261122/',import.meta.url);
const web=new URL('../',import.meta.url);
const sourceReceipt=JSON.parse(readFileSync(new URL('manifest.json',art)));
const productionNotes=JSON.parse(readFileSync(new URL('measurements.json',art)));
export const subcultureHeadRecipe=JSON.parse(readFileSync(new URL('release-head.json',art)));
const crops=productionNotes.crops;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const sole=contract.standingSoles;
const toJson=value=>JSON.stringify(value,null,2)+'\n';

export function subcultureSourceIdentity(){
  const sources=Object.fromEntries(sourceReceipt.originals.map(({file,sha256})=>{
    if(digest(readFileSync(new URL(file,art)))!==sha256)throw new Error('Changed source drawing '+file);
    return [file,sha256];
  }));
  return {sources,recipe:digest(JSON.stringify({contract,crops,faceRanges:productionNotes.faceRanges,head:subcultureHeadRecipe}))};
}

async function readSources(){
  const entries=await Promise.all(sourceReceipt.originals.map(async ({file,sha256})=>{
    const bytes=readFileSync(new URL(file,art));
    if(digest(bytes)!==sha256)throw new Error('Changed source drawing '+file);
    return [file.replace('-original.png',''),await loadImage(bytes)];
  }));
  return Object.fromEntries(entries);
}

const frame=()=>createCanvas(64,80);
const blank=()=>new Uint8ClampedArray(64*80*4);
const rgba=cv=>cv.getContext('2d').getImageData(0,0,64,80).data;
function sprite(image,rect,height,x,top) {
  const width=Math.round(rect[2]*height/rect[3]);
  const canvas=frame(), c=canvas.getContext('2d');
  c.imageSmoothingEnabled=false;
  c.drawImage(image,...rect,x-Math.floor(width/2),top,width,height);
  const data=c.getImageData(0,0,64,80);
  for(let at=3;at<data.data.length;at+=4){
    const pixel=data.data;
    if(pixel[at]>=128)pixel[at]=255;
    else pixel.fill(0,at-3,at+1);
  }
  c.putImageData(data,0,0);
  return canvas;
}
function tile(data){
  const canvas=frame(),ctx=canvas.getContext('2d'),image=ctx.createImageData(64,80);
  image.data.set(data);ctx.putImageData(image,0,0);
  return canvas;
}
function assemble(...layers){
  const canvas=frame(),ctx=canvas.getContext('2d');
  for(const layer of layers)ctx.drawImage(layer,0,0);
  return canvas;
}
function extract(src,test){
  const output=blank();
  for(let y=0;y<80;y++)for(let x=0;x<64;x++){
    const start=(y*64+x)*4;
    if(src[start+3] && test(x,y,src[start],src[start+1],src[start+2]))output.set(src.subarray(start,start+4),start);
  }
  return output;
}
const faceRanges=productionNotes.faceRanges;
const faceAt=(column,x,y)=>{
  const span=faceRanges[column][y];
  return span&&x>=span[0]&&x<=span[1];
};
const splitH=(x,y,r,g,b,mainCut,hairCut)=>y<=mainCut||(y<=hairCut&&r>=g*1.18&&r-b>13&&!(r>145&&r-g>=53));
const isSkin=(r,g,b)=>r>=163&&g>=111&&r-g<98&&g>b*.98;
const headCut=[[37,35,35,37],[36,34,34,37]];
function closeJoint(body,face,hairstyles){
  const yarn=hairstyles.map(hair=>rgba(assemble(face,hair)));
  for(let x=25;x<=39;x++){
    const offset=y=>(y*64+x)*4;
    const bodyTop=Array.from({length:12},(_,i)=>i+34).find(y=>body[offset(y)+3]);
    const headBottom=yarn.map(head=>Array.from({length:10},(_,i)=>41-i).find(y=>head[offset(y)+3]));
    if(!bodyTop||headBottom.some(y=>!y))continue;
    const low=Math.min(...headBottom);
    if(low+1>=bodyTop||bodyTop-low>4)continue;
    for(let y=low+1;y<bodyTop;y++){
      body.set(body.subarray(offset(bodyTop),offset(bodyTop)+4),offset(y));
    }
  }
  return tile(body);
}
function standingParts(images,c){
  const sheet=name=>sprite(images[name],crops[name][c],66,32,sole[c]-66);
  const bob=rgba(sheet('standing')),bun=rgba(sheet('wardrobe'));
  // Three reflected copper pixels on the tied fringe should read as hair.
  if(c===0)for(const [x,y] of [[36,22],[43,23],[44,24]])bun.set([193,105,77,255],(y*64+x)*4);
  const cut=[0,1].map(s=>(x,y,r,g,b)=>splitH(x,y,r,g,b,headCut[s][c],headCut[s][c]+3)||faceAt(c,x,y));
  const face=extract(bob,(x,y)=>faceAt(c,x,y));
  const alternateFace=extract(bun,(x,y,r,g,b)=>y>=25&&y<=37&&cut[1](x,y,r,g,b)&&isSkin(r,g,b));
  for(let pos=0;pos<face.length;pos+=4)if(alternateFace[pos+3]&&!face[pos+3])face.set(alternateFace.subarray(pos,pos+4),pos);
  const hairstyles=[bob,bun].map((src,style)=>tile(extract(src,(x,y,r,g,b)=>cut[style](x,y,r,g,b)&&!faceAt(c,x,y)&&!(style===1&&alternateFace[(y*64+x)*4+3]))));
  const [firstHair,secondHair]=hairstyles.map(rgba);
  for(let y=15;y<=36;y++)for(let x=18;x<=45;x++){
    const i=(y*64+x)*4;
    if(firstHair[i+3]&&secondHair[i+3]&&!face[i+3])face.set([186,113,98,255],i);
  }
  const faceTile=tile(face);
  const outfits=[bob,bun].map((src,style)=>closeJoint(extract(src,(x,y,r,g,b)=>!cut[style](x,y,r,g,b)),faceTile,hairstyles));
  return {face:faceTile,hairstyles,outfits};
}

function fitBody(source,targetBottom,offset=0){
  const ctx=source.getContext('2d'),data=ctx.getImageData(0,0,64,80);
  let bottom=80;
  while(bottom>0&&!data.data.subarray((bottom-1)*256,bottom*256).some((v,i)=>i%4===3&&v))bottom--;
  if(bottom<=42||targetBottom<=42)throw new Error('Missing garment or sole');
  const canvas=frame(),out=canvas.getContext('2d');
  out.imageSmoothingEnabled=false;
  out.drawImage(source,0,0,64,42,offset,0,64,42);
  out.drawImage(source,0,42,64,bottom-42,offset,42,64,targetBottom-42);
  return canvas;
}

function editExpression(face,direction,key){
  if(!key||(direction!==0&&direction!==3))return face;
  const data=rgba(face);
  const set=(x,y,color)=>{const i=(y*64+x)*4;if(data[i+3])data.set(color,i);};
  if(key==='blink'){
    const eyes=direction===0?[[30,37,27,34,31],[40,44,26,32,29]]:[[21,25,25,32,29],[31,39,27,34,31]];
    for(const [left,right,top,bottom,line] of eyes){
      for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
        if(faceAt(direction,x,y))set(x,y,subcultureHeadRecipe.swatches.skin);
      }
      for(let x=left+1;x<right;x++)set(x,line+(x===left+1||x===right-1?1:0),[63,33,26]);
    }
  }else{
    const x=direction===0?38:29;
    set(x,34,[104,48,38]);set(x+1,34,[104,48,38]);
    set(x,35,[170,72,59]);set(x+1,35,[170,72,59]);
  }
  return tile(data);
}

function paintedPose(images,name,index,height,bottom){
  const crop=crops[name][index];
  const [left,top,width,sourceHeight]=crop;
  const window=createCanvas(width,sourceHeight).getContext('2d');
  window.drawImage(images[name],...crop,0,0,width,sourceHeight);
  const band=window.getImageData(0,Math.round(sourceHeight*.13),width,Math.round(sourceHeight*.15)).data;
  let min=width,max=0;
  for(let i=0;i<band.length;i+=4){
    if(band[i+3]<128||band[i]<band[i+1]*1.22||band[i]<band[i+2]*1.12)continue;
    min=Math.min(min,i/4%width);max=Math.max(max,i/4%width);
  }
  if(min>=max)throw new Error('Missing pose crown '+name+'/'+index);
  const x=32+Math.round((width-min-max)*.5*height/sourceHeight);
  return sprite(images[name],[left,top,width,sourceHeight],height,x,bottom-height);
}

// Foreground hands measured on the authored gesture cells. The main collar
// cut follows the head, so these intentionally occluding pixels are restored.
const gestureHands=[
  {
    0:[[[44,34],[46,31],[49,31],[52,34],[51,38],[47,42],[44,40]]],
    4:[[[14,34],[17,32],[21,33],[24,37],[23,41],[19,41],[15,38]],[[47,32],[52,31],[55,34],[54,38],[51,40],[47,37]]],
    7:[[[13,34],[17,31],[21,32],[23,35],[22,39],[18,40],[14,39]]],
  },
  {
    0:[[[46,34],[48,31],[52,31],[56,34],[56,37],[52,41],[47,41]]],
    3:[[[53,40],[56,36],[61,36],[64,39],[63,42],[60,45],[55,45]]],
    4:[[[16,34],[19,31],[23,32],[25,36],[24,40],[20,41],[16,38]],[[49,32],[52,29],[56,30],[58,33],[56,38],[52,39],[48,36]]],
    7:[[[14,34],[17,30],[21,30],[24,33],[24,38],[20,40],[15,38]]],
  },
];

function restoreGestureHands(body,source,contours){
  if(!contours)return;
  const uncut=tile(source),mask=frame(),ctx=mask.getContext('2d');
  for(const points of contours){
    ctx.beginPath();ctx.moveTo(...points[0]);
    for(const point of points.slice(1))ctx.lineTo(...point);
    ctx.closePath();ctx.fill();
  }
  ctx.globalCompositeOperation='source-in';ctx.drawImage(uncut,0,0);
  const rgbaMask=rgba(mask);
  for(let i=0;i<body.length;i+=4){
    if(rgbaMask[i+3]<128)continue;
    body.set(source.subarray(i,i+4),i);
  }
}

function poseBody(images,name,index,bottom,hoodie,pieces,{seat=false,gesture=false}={}){
  const {face,hairstyles}=pieces;
  const crop=crops[name][index];
  const height=seat?Math.round(crop[3]*.194)+1:Math.round(crop[3]*(gesture?.175:.19));
  const original=paintedPose(images,name,index,height,bottom);
  const source=rgba(original);
  const adjustedNeck=seat?37:gesture?[39,39,39,39,36,41,40,38][index]:39;
  const {body}=separateCamper(source,64,80,{hoodie,neck:adjustedNeck,unit:1,gesture});
  if(gesture)restoreGestureHands(body,source,gestureHands[hoodie][index]);
  const tights=fitBody(tile(body),bottom);
  return closeJoint(rgba(tights),face,hairstyles);
}

function walkingBody(images,style,direction,phase){
  const name=style?'walk-hoodie':'walk-jacket';
  const crop=crops[name][direction*8+phase],unit=3;
  const y=headCut[0][direction]+Math.round(camperStrideRise[phase]);
  const height=sole[direction]-y;
  const width=Math.round(crop[2]*height*unit/crop[3]);
  const canvas=createCanvas(192,240),ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(images[name],...crop,96-Math.floor(width/2),y*unit,width,height*unit);
  const frame=ctx.getImageData(0,0,192,240),pixels=frame.data;
  for(let i=3;i<pixels.length;i+=4){
    if(pixels[i]>=128)pixels[i]=255;
    else pixels.fill(0,i-3,i+1);
  }
  ctx.putImageData(frame,0,0);
  return canvas;
}

function finishBody(canvas,pieces,{style,direction,unit,sole,headRise=0,neck=40}){
  const width=canvas.width,ctx=canvas.getContext('2d'),frame=ctx.getImageData(0,0,width,canvas.height);
  const {data}=frame;
  const heads=pieces.hairstyles.map(hair=>rgba(assemble(pieces.face,hair)));
  for(let x=(contract.neckX-3)*unit;x<(contract.neckX+3)*unit;x++){
    const nativeX=Math.floor(x/unit);
    const edges=heads.map(head=>{
      for(let y=Math.ceil(neck+5);y>=Math.floor(neck-7);y--){
        const local=Math.floor(y-headRise);
        if(head[(local*64+nativeX)*4+3])return Math.round((local+headRise+1)*unit)-1;
      }
      return null;
    });
    if(edges.includes(null))continue;
    const start=Math.min(...edges)+1;
    const position=y=>(y*width+x)*4;
    let at=start;
    while(at<(Math.ceil(neck)+11)*unit&&!data[position(at)+3])at++;
    if(at===(Math.ceil(neck)+11)*unit)continue;
    for(let y=start;y<at;y++)data.set(data.subarray(position(at),position(at)+4),position(y));
  }
  gradeCamperMaterials(frame,{head:false,style,d:direction,unit,neck,sole});
  ctx.putImageData(frame,0,0);
  return canvas;
}

const groups=[0,2,4,6];
const ids=['field-camper-v2','field-camper-walk'];
const pack=(ctx,source,cell,unit)=>ctx.drawImage(source,cell[0]*64*unit,cell[1]*80*unit,64*unit,80*unit);

export async function compileSubcultureCamper(){
  const images=await readSources();
  const pieces=sole.map((_,direction)=>standingParts(images,direction));
  const native=createCanvas(...camperAtlasDimensions(false,true)),ink=native.getContext('2d');
  const walk=createCanvas(...camperAtlasDimensions(true,true,{bodyOnly:true})),walking=walk.getContext('2d');
  ink.imageSmoothingEnabled=false;walking.imageSmoothingEnabled=false;
  for(const group of groups)for(let index=0;index<8;index++){
    const part={group,index},direction=group===4?0:index%4,p=pieces[direction];
    const expression=group===6&&index>=4||group===4&&[2,4,7].includes(index)?'blink':group===4&&index===6?'surprise':null;
    pack(ink,editExpression(p.face,direction,expression),camperPartCell(part,'face',0,false),1);
    for(let style=0;style<2;style++){
      pack(ink,p.hairstyles[style],camperPartCell(part,'hair',style,false),1);
      const bottom=CAMPER_SOLES[(group+style)*8+index];
      let body=tile(rgba(p.outfits[style]));
      if(group===0&&index>=4)body=poseBody(images,style?'motion-hoodie':'motion',direction,bottom,style,p,{seat:true});
      if(group===2)body=poseBody(images,style?'motion-hoodie':'motion',index+4,bottom,style,p);
      if(group===4)body=poseBody(images,style?'gesture-hoodie':'gesture',index,bottom,style,p,{gesture:true});
      // The eyes supply the blink. Hold the exact standing garment and only
      // fit its foot to the inhalation key to avoid a second drifting torso.
      if(group===6)body=fitBody(body,bottom);
      pack(ink,finishBody(body,p,{style,direction,unit:1,sole:bottom}),camperPartCell(part,'body',style,false),1);
    }
  }
  for(let style=0;style<2;style++)for(let direction=0;direction<4;direction++)for(let phase=0;phase<8;phase++){
    const part={group:8,index:phase*4+direction},body=walkingBody(images,style,direction,phase);
    const fallback=createCanvas(64,80),ctx=fallback.getContext('2d');
    ctx.imageSmoothingEnabled=false;ctx.drawImage(body,0,0,64,80);
    const neck=40+camperStrideRise[phase],target={style,direction,sole:sole[direction],neck};
    pack(walking,finishBody(body,pieces[direction],{...target,unit:3,headRise:camperStrideRise[phase]}),camperPartCell(part,'body',style,true),3);
    pack(ink,finishBody(fallback,pieces[direction],{...target,unit:1}),camperPartCell(part,'body',style,false),1);
  }
  const canvases=[native,walk];
  const buffers=await Promise.all(canvases.map((canvas,index)=>sharp(canvas.toBuffer('image/png'))
    .webp(index?{quality:90,alphaQuality:100,effort:6}:{lossless:true,effort:5}).toBuffer()));
  const audit=await inspectCamperAtlases(buffers,CAMPER_SOLES,{modular:true,bodyOnly:true});
  if(audit.violations.length)throw new Error('Camper material or contact contract: '+JSON.stringify(audit.violations.slice(0,8)));
  const heads=await inspectHeadAtlas(buffers[0],false,subcultureHeadRecipe);
  const files=Object.fromEntries(ids.map((id,i)=>{
    const sha256=digest(buffers[i]),{width,height}=canvases[i];
    return [id,{url:'/sprites/'+id+'-parts.'+sha256.slice(0,12)+'.webp',width,height,sampling:i?'linear':'nearest',
      bytes:buffers[i].length,sha256,...(i?{bodyOnly:true}:{headLayers:'shared-face-v1'})}];
  }));
  files['field-camper-v2-dark']=files[ids[0]];
  const payload={version:3,...subcultureSourceIdentity(),files};
  const manifest={...payload,id:digest(JSON.stringify(payload))};
  return {files,buffers,audit,heads,manifest};
}

export async function verifySubcultureCamper(active){
  const candidate=await compileSubcultureCamper();
  if(JSON.stringify(candidate.files)!==JSON.stringify(active))throw new Error('Registered subculture camper does not match its source artwork');
  const saved=JSON.parse(readFileSync(new URL('release.json',art)));
  if(JSON.stringify(candidate.manifest)!==JSON.stringify(saved))throw new Error('Stale subculture camper receipt');
  for(const [i,id] of ids.entries()){
    if(!readFileSync(new URL('public'+active[id].url,web)).equals(candidate.buffers[i]))throw new Error('Changed published camper '+id);
  }
  return candidate;
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  const [mode,...rest]=process.argv.slice(2);
  if(rest.length||mode&&mode!=='--install')throw new Error('Expected --install or no arguments');
  const candidate=await compileSubcultureCamper();
  const job=new URL('outputs/camper-harness/subculture-full/',web);
  const out=new URL('candidates/'+candidate.manifest.id+'/',job);
  mkdirSync(out,{recursive:true});
  for(const [i,id] of ids.entries())writeFileSync(new URL(candidate.files[id].url.split('/').at(-1),out),candidate.buffers[i]);
  writeFileSync(new URL('audit.json',job),toJson({bodies:candidate.audit,heads:candidate.heads}));
  writeFileSync(new URL('manifest.json',job),toJson(candidate.manifest));
  if(mode==='--install'){
    const {assertCamperMotion,inspectCamperMotion,isMotionBaseline,motionBaseline,verifyMotionBaseline}
      =await import('./camper-motion-audit.mjs');
    const {readCamperCandidate}=await import('./camper-review-assets.mjs');
    const jobName='subculture-full';
    const motion=await inspectCamperMotion(readCamperCandidate(jobName));
    if(candidate.manifest.id===motionBaseline.candidate&&isMotionBaseline(motion)){
      verifyMotionBaseline(motion,motionBaseline);
    }else{
      assertCamperMotion(motion);
      const {verifyCamperPair}=await import('../tests/camper-scale-evidence.mjs');
      if(!verifyCamperPair(jobName,'canvas')||!verifyCamperPair(jobName,'browser'))
        throw Error('Full camper installation requires Canvas and WebGL review evidence');
    }
    for(const [i,id] of ids.entries())writeFileSync(new URL('public'+candidate.files[id].url,web),candidate.buffers[i]);
    writeFileSync(new URL('release.json',art),toJson(candidate.manifest));
    writeFileSync(new URL('lib/camp-camper-part-files.mjs',web),
      '// Generated from the selected subculture camper drawings.\nexport const CAMPER_PART_FILES = '+JSON.stringify(candidate.files,null,2)+';\n');
  }
  console.log(JSON.stringify({id:candidate.manifest.id,files:candidate.files,bodyLayers:candidate.audit.results.length,headCases:candidate.heads.length}));
}
