// Slices the original, independently drawn directions into interchangeable native-pixel layers.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';

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
const output = createCanvas(width*columns*2, height*sheets.length*2);
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
    const head=ctx.createImageData(width,height),body=ctx.createImageData(width,height);
    let foot=0;
    for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
      const i=(y*width+x)*4;
      if(rgba.data[i+3]<126) continue;
      const [r,g,b]=rgba.data.slice(i,i+3);
      const warm=r>g*1.16 && r>b*1.15;
      // Collar and raised sleeves travel with the outfit. The cheeks and fringe travel with the hairstyle.
      const inHead=y<37 || y<=41 && warm && (x>19&&x<48);
      const layer=inHead?head:body;
      for(let ch=0;ch<3;ch++)layer.data[i+ch]=Math.min(255,Math.round(rgba.data[i+ch]/5)*5);
      layer.data[i+3]=255;
      foot=Math.max(foot,y);
    }
    if((set===2||set===3)&&row===1){
      // Turn the second painted step into a counter-step. Bend at the knees and
      // exchange boot depth without reflecting the toes or moving the hip joint.
      const step=ctx.createImageData(width,height),leftFacing=col>=2;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const from=(y*width+x)*4;
        if(!body.data[from+3])continue;
        const weight=Math.max(0,Math.min(1,(y-56)/11)),side=x<32?-1:1;
        const depth=(leftFacing?-1:1)*side,dx=Math.round(-side*2*weight);
        const dy=Math.round(-depth*5*weight);
        const nx=x+dx,ny=y+dy;
        if(nx<0||nx>=width||ny<0||ny>=height)continue;
        step.data.set(body.data.subarray(from,from+4),(ny*width+nx)*4);
      }
      body.data.set(step.data);
      foot=opaqueBox(body.data,width,height).y1;
    }
    graphics.putImageData(head,col*width,(set*2+row)*height);
    graphics.putImageData(body,(columns+col)*width,(set*2+row)*height);
    contacts.push(foot+1);
  }
}
const png=output.toBuffer('image/png'), hash=digest(png);
const filename='field-camper-v2.'+hash.slice(0,12)+'.png';
publish(new URL('web/public/sprites/'+filename,root),png);
const resource={url:'/sprites/'+filename,width:output.width,height:output.height,sampling:'nearest',bytes:png.length,sha256:hash};
const code='// Generated by web/scripts/build-camper-art.mjs from the versioned artwork.\n'+
  'const sheet = '+JSON.stringify(resource)+';\n'+
  "export const CAMPER_ART_FILES = {'field-camper-v2':sheet,'field-camper-v2-dark':sheet};\n"+
  'export const CAMPER_SOLES = '+JSON.stringify(contacts)+';\n';
publish(new URL('web/lib/camp-camper-art.mjs',root),code);
publish(new URL('sources.json',directory),JSON.stringify(sourceHashes,null,2)+'\n');
console.log(fileURLToPath(new URL('web/public/sprites/'+filename,root)));
