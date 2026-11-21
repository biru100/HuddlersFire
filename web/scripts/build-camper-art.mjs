// Slices the original, independently drawn directions into interchangeable native-pixel layers.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync,renameSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import sharp from 'sharp';
import {separateCamper} from './camper-collar.mjs';
import {buildWalkLayers,walkSources} from './pack-walk-detail.mjs';
import {camperAtlasDimensions,normalizeCamperAtlases,inspectCamperAtlases,contract,legacyContract} from './camper-consistency.mjs';
import {CAMPER_ART_FILES,CAMPER_SOLES} from '../lib/camp-camper-art.mjs';

const root = new URL('../../', import.meta.url);
const directory = new URL('art/sprites/field-camper-v2/', root);
const [width,height]=contract.cell;
const columns=contract.directions.length;
const sheets=contract.nativeSheets;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function opaqueBox(data, w, h) {
  let x0=w, y0=h, x1=0, y1=0;
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    if (data[(y*w+x)*4+3] < 155) continue;
    x0=Math.min(x,x0); y0=Math.min(y,y0); x1=Math.max(x,x1); y1=Math.max(y,y1);
  }
  if (x1<=x0 || y1<=y0) throw Error('Missing camper art in source cell');
  return {x0,y0,x1,y1};
}
function trimCell(image, column, row, name) {
  const x=Math.round(image.width*column/columns), y=Math.round(image.height*row/2);
  const w=Math.round(image.width*(column+1)/columns)-x, h=Math.round(image.height*(row+1)/2)-y;
  const c=createCanvas(w,h).getContext('2d'); c.drawImage(image,x,y,w,h,0,0,w,h);
  try{return {c, ...opaqueBox(c.getImageData(0,0,w,h).data,w,h)};}
  catch(error){throw Error(`Missing camper frame ${name}/${column}/${row}`,{cause:error});}
}

function alignLayer(ctx, pixels, sourceSocket, scaleY=1){
  const tile=createCanvas(width,height), ink=tile.getContext('2d'), source=ink.createImageData(width,height);
  source.data.set(pixels);ink.putImageData(source,0,0);
  ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(tile,0,contract.neck-sourceSocket*scaleY,width,height*scaleY);
  return ctx.getImageData(0,0,width,height);
}

// Stance occupies half a cycle. The other foot passes the planted boot and
// lifts at the knee. Sample the painted limbs backwards from the destination
// so even the stretched ankle and the outline of the boot remain contiguous.
function drawWalkCycle(graphics,ctx,body,direction,outfit) {
  const facingX=direction<2?1:-1, facingY=direction===0||direction===3?1:-1;
  const nearSide=direction%2===0?-1:1;
  const hip=52+outfit*3, ankle=61+outfit*3, center=contract.neckX;
  const reach=[1,.5,0,-.5,-1,-.6,0,.65], lift=[0,0,0,0,0,2,4,2];
  for(let phase=0;phase<contract.walkSteps;phase++){
    const frame=ctx.createImageData(width,height);
    const copy=(x,y,sx,sy)=>{
      if(sx<0||sx>=width||sy<0||sy>=height)return;
      const src=(sy*width+sx)*4;
      if(body.data[src+3]) frame.data.set(body.data.subarray(src,src+4),(y*width+x)*4);
    };
    for(const side of [-nearSide,nearSide]){
      const step=(phase+(side===-1?0:contract.walkSteps/2))%contract.walkSteps;
      const dx=facingX*8*reach[step], dy=facingY*4*reach[step]-lift[step];
      for(let y=hip;y<height;y++){
        const sy=Math.round(y>=ankle+dy ? y-dy : hip+(y-hip)*(ankle-hip)/(ankle+dy-hip));
        const bend=Math.min(1,(sy-hip)/(ankle-hip));
        for(let x=0;x<width;x++){
          const sx=Math.round(x-dx*bend);
          if((sx<center?-1:1)===side)copy(x,y,sx,sy);
        }
      }
    }
    // Both shoulders stay attached to the collar. The outer sleeve follows
    // the opposite boot while the waist and the center of the jacket stay put.
    for(let y=0;y<hip;y++)for(let x=0;x<width;x++){
      const side=x<center?-1:1, step=(phase+(side===-1?0:contract.walkSteps/2))%contract.walkSteps;
      const arm=Math.max(0,1-Math.abs(y-48)/9)*Math.min(1,Math.abs(x-center)/13);
      copy(x,y,Math.round(x+facingX*2.6*reach[step]*arm),y);
    }
    graphics.putImageData(frame,(8+phase)*width,(outfit*4+direction)*height);
  }
}

export async function buildCamperNative(readInput,calibration=contract.sourceCalibration,candidate=true,targetSoles){
  const output = createCanvas(width*columns*4, height*sheets.length*2);
  const graphics = output.getContext('2d');
  const contacts = [];
  const sourceHashes = {};
  for (const [set,sheet] of sheets.entries()) {
    const source=readInput(sheet+'.png');
    sourceHashes[sheet]=digest(source);
    const image=await loadImage(source);
    for (let row=0; row<2; row++) for (let col=0; col<4; col++) {
      const {c,x0,y0,x1,y1}=trimCell(image,col,row,sheet);
      if(candidate && (x0===0||y0===0||x1===c.canvas.width-1||y1===c.canvas.height-1))
        throw Error('Source crosses a cell edge: '+[sheet,col,row].join('/'));
      const gesture=set===4||set===5;
      // The haircut, collar and boots are registered independently of margins or a raised hand.
      const pixels=c.getImageData(0,0,c.canvas.width,c.canvas.height).data;
      let hairLeft=x1, hairRight=x0;
      const scan=Math.round(y0+(y1-y0)*.3);
      for(let y=scan-8;y<scan+9;y++) for(let x=x0;x<=x1;x++) {
        const i=(y*c.canvas.width+x)*4;
        if(pixels[i+3]>180 && pixels[i]>pixels[i+1]*1.22 && pixels[i]>pixels[i+2]*1.23) {
          hairLeft=Math.min(hairLeft,x); hairRight=Math.max(hairRight,x);
        }
      }
      const center=(hairRight+hairLeft)*.5;
      if(candidate && hairRight<hairLeft)throw Error('Missing head landmark: '+[sheet,col,row].join('/'));
      // Measured hairline-to-collar intervals of the eight source drawings.
      const heights=calibration.headHeights[set],headPx=heights.length===1?heights[0]:heights[row*4+col];
      const neck=y0+headPx, scale=contract.crownToNeck[set%2]/headPx;
      if(candidate&&neck>=y1)throw Error('Invalid source collar calibration: '+[sheet,col,row].join('/'));
      const seated=set<=1&&row===1;
      const bodyScale=seated?scale*.79:scale;
      const ctx=createCanvas(width,height).getContext('2d');
      ctx.imageSmoothingQuality='high';
      const left=contract.neckX+(x0-center)*scale;
      ctx.drawImage(c.canvas,x0,y0,x1-x0+1,headPx,left,contract.neck-headPx*scale,(x1-x0+1)*scale,headPx*scale);
      ctx.drawImage(c.canvas,x0,neck,x1-x0+1,y1-neck+1,left,contract.neck-.1,(x1-x0+1)*scale,(y1-neck+1)*bodyScale);
      const rgba=ctx.getImageData(0,0,width,height);
      let foot=0;
      for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
        const i=(y*width+x)*4;
        if(rgba.data[i+3]<126){rgba.data[i+3]=0;continue;}
        for(let ch=0;ch<3;ch++)rgba.data[i+ch]=Math.min(255,Math.round(rgba.data[i+ch]/5)*5);
        rgba.data[i+3]=255;
        foot=Math.max(foot,y);
      }
      const hoodie=set%2===1;
      const parts=separateCamper(rgba.data,width,height,{hoodie,neck:contract.neck-1,unit:1,gesture});
      if(candidate && opaqueBox(parts.head,width,height).y0+contract.neck-parts.socket<0)
        throw Error('Head would be cropped at the collar registration: '+[sheet,col,row].join('/'));
      const head=alignLayer(ctx,parts.head,parts.socket);
      if((set===2||set===3)&&row===1){
        // Turn the second painted step into a counter-step. Bend at the knees and
        // exchange boot depth without reflecting the toes or moving the hip joint.
        const step=ctx.createImageData(width,height),leftFacing=col>=2;
        for(let y=0;y<height;y++)for(let x=0;x<width;x++){
          const from=(y*width+x)*4;
          if(!parts.body[from+3])continue;
          const weight=Math.max(0,Math.min(1,(y-56)/11)),side=x<32?-1:1;
          const depth=(leftFacing?-1:1)*side,dx=Math.round(-side*2*weight);
          const dy=Math.round(-depth*5*weight);
          const nx=x+dx,ny=y+dy;
          if(nx<0||nx>=width||ny<0||ny>=height)continue;
          step.data.set(parts.body.subarray(from,from+4),(ny*width+nx)*4);
        }
        parts.body=step.data;
        foot=opaqueBox(parts.body,width,height).y1;
      }
      // Use the same neck and ground plane for both garments in this pose.
      const targetFoot=targetSoles?.[set*8+row*4+col]??(hoodie?contacts[(set-1)*8+row*4+col]:foot+1);
      const fittedHeight=(targetFoot-contract.neck)/(foot+1-parts.socket);
      if(candidate&&(!Number.isFinite(fittedHeight)||fittedHeight<=.6||fittedHeight>=1.6))
        throw Error('Body proportions need redraw: '+[sheet,col,row].join('/'));
      const body=alignLayer(ctx,parts.body,parts.socket,fittedHeight);
      graphics.putImageData(head,col*width,(set*2+row)*height);
      graphics.putImageData(body,(columns+col)*width,(set*2+row)*height);
      if(set<2 && row===0) drawWalkCycle(graphics,ctx,body,col,set);
      contacts.push(targetFoot);
    }
  }
  return {output,contacts,sourceHashes};
}

export async function compileCamperBase(readInput,calibration,{targetSoles}={}){
  const {output,contacts,sourceHashes}=await buildCamperNative(readInput,calibration,true,targetSoles);
  const layers=await buildWalkLayers({readInput,calibration});
  const [w,h]=contract.walkCell;
  const tileWidth=w*contract.walkSteps,tileHeight=h*columns;
  const walkCanvas=createCanvas(2*tileWidth,2*tileHeight), walkCtx=walkCanvas.getContext('2d');
  for(const [index,key] of ['head-bob','head-bun','top-jacket','top-hoodie'].entries())
    walkCtx.drawImage(layers[key],(index%2)*tileWidth,Math.floor(index/2)*tileHeight);
  const [native,walk]=normalizeCamperAtlases([output,walkCanvas],contacts);
  const buffers=await Promise.all([native,walk].map((canvas,i)=>
    sharp(canvas.toBuffer('image/png')).webp(i?{quality:92,alphaQuality:100,effort:6}:{lossless:true,effort:6}).toBuffer()));
  const audit=await inspectCamperAtlases(buffers,contacts);
  if(audit.violations.length)
    throw Error('Camper consistency failed ('+audit.violations.length+'): '+JSON.stringify(audit.violations.slice(0,35)));
  for(const [name] of walkSources)sourceHashes['walk-detail/'+name+'-drawing']=digest(readInput('walk-detail/'+name+'-drawing.png'));
  return {buffers,contacts,sourceHashes,count:audit.results.length};
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)await main();

async function main(){
  const checkOnly = process.argv.includes('--check');
  const candidate = process.argv.includes('--candidate');
  if(process.argv.slice(2).some(arg=>!['--check','--candidate'].includes(arg)))throw Error('Expected --check or --candidate');
  const recordedHashes=JSON.parse(readFileSync(new URL('sources.json',directory)));
  for(const [name,,sha] of walkSources)recordedHashes['walk-detail/'+name+'-drawing']=sha;
  const readInput=name=>{
    const bytes=readFileSync(new URL(name,directory));
    if(digest(bytes)!==recordedHashes[name.slice(0,-4)])throw Error('Changed camper original: '+name);
    return bytes;
  };
  // Keep the approved release reproducible for existing build/check callers.
  // New artwork goes through the candidate contract before review.
  if(!candidate){
    const {output,contacts}=await buildCamperNative(readInput,contract.sourceCalibration,false);
    const names=['head-bob','head-bun','top-jacket','top-hoodie'];
    const native=await sharp(output.toBuffer('image/png')).webp({lossless:true,effort:6}).toBuffer();
    const walk=await sharp({create:{width:3072,height:1920,channels:4,background:'#00000000'}})
      .composite(names.map((name,i)=>({input:fileURLToPath(new URL('walk-detail/'+name+'.png',directory)),
        left:i%2*1536,top:Math.floor(i/2)*960}))).webp({quality:88,alphaQuality:100,effort:6}).toBuffer();
    const releases=[['field-camper-v2',native],['field-camper-walk',walk]];
    if(JSON.stringify(contacts)!==JSON.stringify(CAMPER_SOLES)||
      releases.some(([id,bytes])=>digest(bytes)!==CAMPER_ART_FILES[id].sha256))
      throw Error('Artwork differs from the registered release. Build a review with --candidate.');
    for(const [id,bytes] of releases){
      const url=new URL('web/public'+CAMPER_ART_FILES[id].url,root);
      if(!checkOnly)writeFileSync(url,bytes);
      else if(!readFileSync(url).equals(bytes))throw Error('Stale released camper '+url);
    }
    console.log('Reproduced registered camper atlases');
  }else await buildCandidate(readInput,checkOnly);
}

async function buildCandidate(readInput,checkOnly){
  const {buffers,contacts,sourceHashes,count}=await compileCamperBase(readInput,contract.sourceCalibration);
  const names=['field-camper-v2','field-camper-walk'];
  const files=Object.fromEntries(buffers.map((bytes,i)=>{
    const sha256=digest(bytes),name=names[i],[width,height]=camperAtlasDimensions(Boolean(i));
    return [name,{file:name+'.'+sha256.slice(0,12)+'.webp',sha256,bytes:bytes.length,
      width,height,sampling:i?'linear':'nearest'}];
  }));
  const manifest=JSON.stringify({contract:digest(JSON.stringify(legacyContract)),sources:sourceHashes,
    soles:contacts,files},null,2)+'\n';
  const dest=fileURLToPath(new URL('consistency/',directory));
  if(checkOnly){
    const saved=JSON.parse(readFileSync(join(dest,'manifest.json')));
    if(JSON.stringify(saved)!==JSON.stringify(JSON.parse(manifest)))throw Error('Stale camper candidate manifest');
    for(const {file,sha256} of Object.values(files))
      if(digest(readFileSync(join(dest,file)))!==sha256)throw Error('Changed camper candidate '+file);
  }else{
    mkdirSync(dest,{recursive:true});
    const stage=mkdtempSync(join(dest,'.build-'));
    try{
      for(const [i,name] of names.entries()){
        const file=files[name].file;
        writeFileSync(join(stage,file),buffers[i]);renameSync(join(stage,file),join(dest,file));
      }
      writeFileSync(join(stage,'manifest.json'),manifest);
      renameSync(join(stage,'manifest.json'),join(dest,'manifest.json'));
    }finally{rmSync(stage,{recursive:true,force:true});}
  }
  console.log(dest, count+' decoded layers passed');
  execFileSync(process.execPath,[fileURLToPath(new URL('./build-shared-camper-head.mjs',import.meta.url)),
    ...(checkOnly?['--check']:[])],{stdio:'inherit'});
}
