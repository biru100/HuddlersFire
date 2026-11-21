// Register the 64 painted drawings. The step shapes come from the two source PNGs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {createCanvas} from '@napi-rs/canvas';
import {separateCamper} from './camper-collar.mjs';
import {contract} from './camper-consistency.mjs';
import {camperStrideRise} from '../lib/camp-camper-parts.mjs';

const folder = new URL('../../art/sprites/field-camper-v2/walk-detail/', import.meta.url);
const pathFor = name => fileURLToPath(new URL(name, folder));
const cols=contract.walkSteps, rows=contract.directions.length;
const [cellW,cellH]=contract.walkCell;
const weightShift=camperStrideRise.map(rise=>rise*3);

function asCanvas(pixels) {
  const cv=createCanvas(cellW,cellH), c=cv.getContext('2d'), frame=c.createImageData(cellW,cellH);
  frame.data.set(pixels); c.putImageData(frame,0,0);
  return cv;
}

function headSpan(pixels,socket){
  // Measure the broad head band, clear of the bun, chin and elbows.
  const spans=[];
  for(let y=socket-53;y<=socket-37;y++){
    let left=cellW,right=-1;
    for(let x=0;x<cellW;x++)if(pixels[(y*cellW+x)*4+3]>160){
      left=Math.min(left,x);right=x;
    }
    if(right>left)spans.push(right-left+1);
  }
  assert.ok(spans.length>10);
  return spans.sort((a,b)=>a-b)[Math.floor(spans.length/2)];
}

function register(data, w, h, matte, phase) {
  let top = h, bottom = -1, left = w, right = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const idx = (y*w+x)*4;
    const alpha = Math.round(255*Math.min(1, Math.max(0, (data[idx+3]-matte)/(238-matte))));
    data[idx+3] = alpha;
    if (alpha === 0) continue;
    left = Math.min(left,x); right = Math.max(right,x);
    top = Math.min(top,y); bottom = Math.max(bottom,y);
  }
  assert.ok(left > 0 && right < w-1 && top > 0 && bottom < h-1, 'Source touches its cell edge');
  assert.ok(right-left > 85 && bottom-top > 160, 'Missing body or head');

  // The broad middle band of the head stays visible in front and rear views.
  // A boot reaching forward or hair sticking out at the crown cannot shift this pivot.
  const centers = [];
  for (let y = top+40; y < top+67; y++) {
    let first = w, last = -1;
    for (let x = left; x <= right; x++) if (data[(y*w+x)*4+3] >= 220) {
      first = Math.min(first,x); last = x;
    }
    if (last > first) centers.push((first+last)/2);
  }
  assert.ok(centers.length >= 20, 'Head registration is missing');
  centers.sort((a,b) => a-b);
  const dx = cellW/2 - Math.round(centers[Math.floor(centers.length/2)]);
  const dy = 15 + weightShift[phase] - top;
  assert.ok(left+dx >= 3 && right+dx < cellW-3 && top+dy >= 3 && bottom+dy < cellH-3);
  const tile = Buffer.alloc(cellW*cellH*4);
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    const src = (y*w+x)*4;
    if (data[src+3]) data.copy(tile, ((y+dy)*cellW+x+dx)*4, src, src+4);
  }
  return tile;
}

export const walkSources = [
  ['jacket',contract.sourceCalibration.walkMattes[0],'ae8181b88d30f3b08b33ae0243f3ba7965728ec58e2f47d68f1b71bb39cfa195'],
  ['hoodie',contract.sourceCalibration.walkMattes[1],'344c127c02be2b3eeb5fec789c11a2d0acffb5e60660bfadc59cbcfef237d830'],
];

export async function buildWalkLayers({writeLegacySheets=false,readInput,calibration=contract.sourceCalibration}={}) {
  const sharedFeet = [], layers = {};
  for (const [index,[outfit,,sourceHash]] of walkSources.entries()) {
    const name=outfit+'-drawing.png',matte=calibration.walkMattes[index];
    const input=readInput?readInput('walk-detail/'+name):await readFile(pathFor(name));
    if(!readInput)assert.equal(createHash('sha256').update(input).digest('hex'),sourceHash);
    const {width,height} = await sharp(input).metadata();
    const tiles = [];
    const headAtlas=createCanvas(cellW*cols,cellH*rows), topAtlas=createCanvas(cellW*cols,cellH*rows);
    const referenceSpans=[];
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const left = Math.round(width*col/cols), top = Math.round(height*row/rows);
      const w = Math.round(width*(col+1)/cols)-left, h = Math.round(height*(row+1)/rows)-top;
      const data = await sharp(input).extract({left,top,width:w,height:h}).ensureAlpha().raw().toBuffer();
      let tile;
      try{tile=register(data,w,h,matte,col);}
      catch(error){throw Error(`${name}/${contract.directions[row]}/step-${col+1}: ${error.message}`,{cause:error});}
      if(writeLegacySheets)tiles.push({input:tile,raw:{width:cellW,height:cellH,channels:4},left:col*cellW,top:row*cellH});
      const front=row===0||row===3, hoodie=outfit==='hoodie';
      const neck=(hoodie?(front?115:109):(front?107:104))+weightShift[col];
      const {head,body,socket,socketX}=separateCamper(tile,cellW,cellH,{hoodie,neck,unit:3});
      const span=headSpan(head,socket);
      if(col===0)referenceSpans[row]=span;
      const scale=referenceSpans[row]/span;
      const targetY=(front?108:105)+weightShift[col];
      const targetX=cellW/2;
      let foot=cellH-1;
      while(foot>socket && !body.subarray(foot*cellW*4,(foot+1)*cellW*4).some((v,i)=>i%4===3&&v>128))foot--;
      if(!hoodie)sharedFeet[row*cols+col]=foot;
      const legScale=(sharedFeet[row*cols+col]-targetY)/(foot-socket);
      for(const [atlas,pixels,sx,sy] of [[headAtlas,head,scale,scale],[topAtlas,body,1,legScale]]){
        const c=atlas.getContext('2d'),x=col*cellW,y=row*cellH;
        c.save();c.beginPath();c.rect(x,y,cellW,cellH);c.clip();
        c.drawImage(asCanvas(pixels),x+targetX-socketX*sx,y+targetY-socket*sy,cellW*sx,cellH*sy);
        c.restore();
      }
    }
    const headName='head-'+(outfit==='jacket'?'bob':'bun');
    layers[headName]=headAtlas;
    layers['top-'+outfit]=topAtlas;
    if(!writeLegacySheets)continue;
    const sheet = await sharp({create:{width:cellW*cols,height:cellH*rows,channels:4,background:'#00000000'}})
      .composite(tiles).png().toBuffer();
    await writeFile(pathFor('walk-'+outfit+'.png'),sheet);
    await sharp(sheet).resize(cellW*cols/3,cellH*rows/3,{kernel:'lanczos3'}).png().toFile(pathFor('walk-'+outfit+'-64x80.png'));
    await writeFile(pathFor(headName+'.png'),headAtlas.toBuffer('image/png'));
    await writeFile(pathFor('top-'+outfit+'.png'),topAtlas.toBuffer('image/png'));
  }
  return layers;
}

if(process.argv[1] && pathToFileURL(process.argv[1]).href===import.meta.url)
  await buildWalkLayers({writeLegacySheets:true});
