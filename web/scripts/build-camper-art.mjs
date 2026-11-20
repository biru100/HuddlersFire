// Slices the original, independently drawn directions into interchangeable native-pixel layers.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import sharp from 'sharp';
import {separateCamper} from './camper-collar.mjs';

const checkOnly = process.argv.includes('--check');
function publish(path, value){
  if(checkOnly){
    if(!readFileSync(path).equals(Buffer.from(value)))throw Error('Stale camper asset '+fileURLToPath(path));
  }else writeFileSync(path,value);
}

const root = new URL('../../', import.meta.url);
const directory = new URL('art/sprites/field-camper-v2/', root);
const width = 64, height = 80, columns = 4;
const sheets = ['turnaround','wardrobe','stride','stride-hood','gestures','gestures-hood','breath','breath-hood'];
// The right half stores eight walking poses per direction and outfit. Heads
// come from the registered turnaround so changing clothes cannot move the face.
const output = createCanvas(width*columns*4, height*sheets.length*2);
const graphics = output.getContext('2d');
const contacts = [];
const sourceHashes = {};
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
function trimCell(image, column, row) {
  const x=Math.round(image.width*column/4), y=Math.round(image.height*row/2);
  const w=Math.round(image.width*(column+1)/4)-x, h=Math.round(image.height*(row+1)/2)-y;
  const c=createCanvas(w,h).getContext('2d'); c.drawImage(image,x,y,w,h,0,0,w,h);
  return {c, ...opaqueBox(c.getImageData(0,0,w,h).data,w,h)};
}

function alignLayer(ctx, pixels, sourceSocket, scaleY=1){
  const tile=createCanvas(width,height), ink=tile.getContext('2d'), source=ink.createImageData(width,height);
  source.data.set(pixels);ink.putImageData(source,0,0);
  ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(tile,0,40-sourceSocket*scaleY,width,height*scaleY);
  return ctx.getImageData(0,0,width,height);
}

// Stance occupies half a cycle. The other foot passes the planted boot and
// lifts at the knee. Sample the painted limbs backwards from the destination
// so even the stretched ankle and the outline of the boot remain contiguous.
function drawWalkCycle(ctx,body,direction,outfit) {
  const facingX=direction<2?1:-1, facingY=direction===0||direction===3?1:-1;
  const nearSide=direction%2===0?-1:1;
  const hip=52+outfit*3, ankle=61+outfit*3, center=32;
  const reach=[1,.5,0,-.5,-1,-.6,0,.65], lift=[0,0,0,0,0,2,4,2];
  for(let phase=0;phase<8;phase++){
    const frame=ctx.createImageData(width,height);
    const copy=(x,y,sx,sy)=>{
      if(sx<0||sx>=width||sy<0||sy>=height)return;
      const src=(sy*width+sx)*4;
      if(body.data[src+3]) frame.data.set(body.data.subarray(src,src+4),(y*width+x)*4);
    };
    for(const side of [-nearSide,nearSide]){
      const step=(phase+(side===-1?0:4))%8;
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
      const side=x<center?-1:1, step=(phase+(side===-1?0:4))%8;
      const arm=Math.max(0,1-Math.abs(y-48)/9)*Math.min(1,Math.abs(x-center)/13);
      copy(x,y,Math.round(x+facingX*2.6*reach[step]*arm),y);
    }
    graphics.putImageData(frame,(8+phase)*width,(outfit*4+direction)*height);
  }
}

for (const [set,sheet] of sheets.entries()) {
  const source=readFileSync(new URL(sheet+'.png', directory));
  sourceHashes[sheet]=digest(source);
  const image=await loadImage(source);
  for (let row=0; row<2; row++) for (let col=0; col<4; col++) {
    const {c,x0,y0,x1,y1}=trimCell(image,col,row);
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
    // Measured hairline-to-collar intervals of the eight source drawings.
    const headPx=gesture ? (set===4?[207,208,209,208,200,201,207,203]:[217,213,212,216,210,224,210,212])[row*4+col] : (set%2===1?218:217);
    const neck=y0+headPx, scale=(set%2===1?37:35)/headPx;
    const seated=set<=1&&row===1;
    const bodyScale=seated?scale*.79:scale;
    const ctx=createCanvas(width,height).getContext('2d');
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(c.canvas,x0,y0,x1-x0+1,headPx,32+(x0-center)*scale,40-headPx*scale,(x1-x0+1)*scale,headPx*scale);
    ctx.drawImage(c.canvas,x0,neck,x1-x0+1,y1-neck+1,32+(x0-center)*scale,39.9,(x1-x0+1)*scale,(y1-neck+1)*bodyScale);
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
    const parts=separateCamper(rgba.data,width,height,{hoodie,neck:39,unit:1,gesture});
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
    const targetFoot=hoodie?contacts[(set-1)*8+row*4+col]:foot+1;
    const body=alignLayer(ctx,parts.body,parts.socket,(targetFoot-40)/(foot+1-parts.socket));
    graphics.putImageData(head,col*width,(set*2+row)*height);
    graphics.putImageData(body,(columns+col)*width,(set*2+row)*height);
    if(set<2 && row===0) drawWalkCycle(ctx,body,col,set);
    contacts.push(targetFoot);
  }
}
function releaseImage(name,bytes,width,height,sampling){
  const hash=digest(bytes),filename=name+'.'+hash.slice(0,12)+'.webp';
  publish(new URL('web/public/sprites/'+filename,root),bytes);
  return {url:'/sprites/'+filename,width,height,sampling,bytes:bytes.length,sha256:hash};
}
const native=await sharp(output.toBuffer('image/png')).webp({lossless:true,effort:6}).toBuffer();
const resource=releaseImage('field-camper-v2',native,output.width,output.height,'nearest');
const layers=['head-bob','head-bun','top-jacket','top-hoodie'];
const walk=await sharp({create:{width:3072,height:1920,channels:4,background:'#00000000'}})
  .composite(layers.map((name,i)=>({input:fileURLToPath(new URL('walk-detail/'+name+'.png',directory)),
    left:(i%2)*1536,top:Math.floor(i/2)*960})))
  .webp({quality:88,alphaQuality:100,effort:6}).toBuffer();
const walkResource=releaseImage('field-camper-walk',walk,3072,1920,'linear');
const code='// Generated by web/scripts/build-camper-art.mjs from the versioned artwork.\n'+
  'const sheet = '+JSON.stringify(resource)+';\n'+
  "export const CAMPER_ART_FILES = {'field-camper-v2':sheet,'field-camper-v2-dark':sheet,'field-camper-walk':"+JSON.stringify(walkResource)+"};\n"+
  'export const CAMPER_SOLES = '+JSON.stringify(contacts)+';\n';
publish(new URL('web/lib/camp-camper-art.mjs',root),code);
publish(new URL('sources.json',directory),JSON.stringify(sourceHashes,null,2)+'\n');
console.log(resource.url,walkResource.url);
