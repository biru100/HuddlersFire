import {createCanvas} from '@napi-rs/canvas';
import {camperPartCell} from '../lib/camp-camper-parts.mjs';
import {camperAtlasDimensions,contract} from './camper-consistency.mjs';

const [nativeWidth,nativeHeight]=contract.cell;
const directions=contract.directions.length;
const nativeRows=contract.nativeSheets.length;

function interpolate(points, x) {
  for (let n = 1; n < points.length; n++) {
    const [right, y] = points[n];
    if (x > right) continue;
    const [left, previous] = points[n - 1];
    return previous + Math.max(0, (x - left) / (right - left)) * (y - previous);
  }
  return points.at(-1)[1];
}

function getTile(ctx, cell, unit) {
  const w=nativeWidth*unit,h=nativeHeight*unit;
  return ctx.getImageData(cell[0] * w, cell[1] * h, w, h);
}

function canvasFor(frame) {
  const canvas = createCanvas(frame.width, frame.height);
  canvas.getContext('2d').putImageData(frame, 0, 0);
  return canvas;
}

function splitMaster(frame, recipe, style, unit) {
  const w = frame.width, h = frame.height;
  const context = createCanvas(w, h).getContext('2d');
  const hair = context.createImageData(w, h), face = context.createImageData(w, h);
  const cut = recipe[style];
  const fit = style === 'bob' && recipe.bobFit;
  const inverseFit = fit && fit.map(([oldX, newX]) => [newX, oldX]);
  const [cx, cy, rx, ry] = recipe.skull;
  for (let px = 0; px < w; px++) {
    const x = (px + .5) / unit;
    const sx = fit ? interpolate(inverseFit, x) : x;
    const sourceX = fit && (x < inverseFit[0][0] || x > inverseFit.at(-1)[0]) ? x : sx;
    const edge = interpolate(cut, sourceX);
    const sourceColumn = Math.min(w - 1, Math.max(0, Math.floor(sourceX * unit)));
    for (let py = 0; py < 46 * unit; py++) {
      const y = (py + .5) / unit, i = (py * w + px) * 4;
      const j = (py * w + sourceColumn) * 4;
      if (!frame.data[j + 3]) continue;
      const [red,green,blue]=frame.data.subarray(j,j+3);
      const skinAtFringe=y>20 && red>185 && green>122 && blue>90 && green>red*.62;
      if (y < edge && !skinAtFringe) {
        hair.data.set(frame.data.subarray(j, j + 4), i);
        // Painted edge antialiasing on the source was mixed with flesh.
        // Restore its chestnut hue before WebP chroma subsampling.
        if(unit>1 && y>20 && edge-y<4 && red>155 && green>95){
          hair.data[i+1]=Math.min(green,red*.55);
          hair.data[i+2]=Math.min(blue,red*.47);
        }
      }
      if (style !== 'bun') continue;
      const nearPart=y<edge+1.4 && y<30 && green<106;
      if ((y >= edge && !nearPart) || skinAtFringe) {
        face.data.set(frame.data.subarray(j, j + 4), i);
        continue;
      }
      // Complete the area hidden by bangs with a shared scalp. Keep the
      // original eyes, ears, jaw ink and skin shading below the traced part.
      const nx = (x - cx) / rx, ny = (y - cy) / ry;
      const radius = nx * nx + ny * ny;
      if (radius >= 1) continue;
      const light=Math.max(0,1-((nx+.28)**2+(ny+.34)**2)*.65);
      const shade=unit===1?Math.round(light*4)/4:light;
      const rgb = radius > .93 ? [110,69,60]
        : [217+29*shade,151+42*shade,131+39*shade];
      face.data.set([...rgb,255], i);
    }
  }
  return {hair, face};
}

// Fit the donor's expression at the same face origin. The skull and jaw come
// from the master. Only the exposed interior of the face takes expression ink.
function withExpression(master, donor, source, recipe) {
  const [left, top, right, bottom] = recipe.features;
  const w = master.width;
  let best = Infinity, offsetX = 0, offsetY = 0;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
    let cost = 0;
    for (let x = left; x <= right; x++) for (let y = top; y <= bottom; y++) {
      const i = (y*w+x)*4, j = ((y+dy)*w+x+dx)*4;
      if (master.data[i+3] < 200 || y < interpolate(recipe.bun,x+.5)+1) continue;
      // Align skin and silhouette. Eye and mouth ink is allowed to change.
      if (donor.data[i+1] > 115) cost += Math.min(45, Math.abs(donor.data[i+1]-source.data[j+1]));
      cost += Math.abs(donor.data[i+3]-source.data[j+3]);
    }
    cost += (dx*dx+dy*dy)*1.5;
    if (cost < best) { best = cost; offsetX = dx; offsetY = dy; }
  }
  const out = canvasFor(master).getContext('2d').getImageData(0,0,w,master.height);
  for (let y=top; y<=bottom; y++) for (let x=left; x<=right; x++) {
    const i=(y*w+x)*4, j=((y+offsetY)*w+x+offsetX)*4;
    if (master.data[i+3] < 200 || source.data[j+3] < 200 || y < interpolate(recipe.bun,x+.5)+.5) continue;
    out.data.set(source.data.subarray(j,j+3),i);
  }
  return out;
}

// These contours are small foreground fragments of the existing gesture ink.
// They belong to the garment/arm even when the original cut touched the head.
function restoreHands(source, out, part, style, polygons) {
  if (!polygons?.length) return;
  const [hx,hy]=camperPartCell(part,'hair',style,false);
  const [bx,by]=camperPartCell(part,'body',style,false);
  out.save();
  out.translate(bx*nativeWidth,by*nativeHeight);
  out.beginPath();
  for (const points of polygons) {
    out.moveTo(...points[0]);
    for (const point of points.slice(1)) out.lineTo(...point);
    out.closePath();
  }
  out.clip();
  out.drawImage(source,hx*nativeWidth,hy*nativeHeight,nativeWidth,nativeHeight,0,0,nativeWidth,nativeHeight);
  out.restore();
}

export function extractHeadMasters(input, detailed, recipe) {
  const [w,h]=detailed?contract.walkCell:contract.cell,unit=w/nativeWidth;
  const source=createCanvas(input.width,input.height).getContext('2d');
  source.drawImage(input,0,0);
  const sheets=Object.fromEntries(recipe.headLayers.map(role=>[role,createCanvas(directions*w,(detailed?1:nativeRows)*h)]));
  const recipes=detailed?recipe.walk:recipe.native;
  const masters=recipes.map((entry,direction)=>{
    const part={group:detailed?8:0,index:direction};
    const heads=[0,1].map(style=>getTile(source,camperPartCell(part,'hair',style,detailed,false),unit));
    const bob=splitMaster(heads[0],entry,'bob',unit);
    const bun=splitMaster(heads[1],entry,'bun',unit);
    return {face:bun.face, donor:heads[1], hair:[canvasFor(bob.hair),canvasFor(bun.hair)]};
  });
  const groups=detailed?[8]:[0,2,4,6];
  for (const group of groups) for (let index=0;index<(detailed?1:2)*directions;index++) {
    const part={group,index}, dir=group===4?0:index%directions;
    const master=masters[dir];
    let face=master.face;
    const blink=group===6 && index>=directions;
    const expression=group===4 && [4,6,7].includes(index);
    if ((blink||expression) && recipes[dir].features) {
      const donor=getTile(source,camperPartCell(part,'hair',1,false),1);
      face=withExpression(face,master.donor,donor,recipes[dir]);
    }
    const x=index%directions*w,y=detailed?0:(group+Math.floor(index/directions))*h;
    sheets.face.getContext('2d').drawImage(canvasFor(face),x,y);
    sheets.bob.getContext('2d').drawImage(master.hair[0],x,y);
    sheets.bun.getContext('2d').drawImage(master.hair[1],x,y);
  }
  return sheets;
}

// Normal rebuilds take three independently editable masters. An edit to a
// hairstyle never re-extracts the skull, eyes or jaw from a dressed character.
export function buildHeadAtlas(input,detailed,recipe,masters,{bodyOnly=false}={}) {
  const [w,h]=detailed?contract.walkCell:contract.cell;
  const out=createCanvas(...camperAtlasDimensions(detailed,true,{bodyOnly})).getContext('2d');
  const bodyHeight=directions*h;
  if(detailed) out.drawImage(input,0,bodyHeight,input.width,bodyHeight,0,0,input.width,bodyHeight);
  else out.drawImage(input,0,0);
  if(detailed&&bodyOnly)return out.canvas;
  for(const name of recipe.headLayers){
    const master=masters[name];
    if(!master || master.width!==directions*w || master.height!==(detailed?1:nativeRows)*h)
      throw Error('Wrong head master dimensions: '+name);
    const layer=name==='face'?'face':'hair',style=name==='bun'?1:0;
    for(const group of detailed?[8]:[0,2,4,6]) for(let index=0;index<(detailed?1:2)*directions;index++){
      const part={group,index},[col,row]=camperPartCell(part,layer,style,detailed);
      if(layer==='hair'&&group===4)restoreHands(input,out,part,style,recipe.hands[style][index]);
      out.clearRect(col*w,row*h,w,h);
      out.drawImage(master,index%directions*w,(detailed?0:group+Math.floor(index/directions))*h,w,h,col*w,row*h,w,h);
    }
  }
  return out.canvas;
}
