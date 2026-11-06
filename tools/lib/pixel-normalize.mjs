// Deterministic normalization explicitly requested for a single supplied frame.
// This is a diagnostic derivative, not generation or automatic production approval.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {ROOT,inside,readJSON,writeJSON,hash} from './sprite-spec.mjs';
const require=createRequire(new URL('../../web/package.json',import.meta.url));
const {createCanvas,loadImage}=require('@napi-rs/canvas');
export function nearestFrame(data,width,height,{canvas,alphaThreshold,translate=[0,0],palette=null}){
 const [w,h]=canvas;if(![w,h,width,height].every(n=>Number.isInteger(n)&&n>0)||width%w||height%h||width/w!==height/h)throw Error('Exact uniform integer reduction required');
 if(data.length!==width*height*4||palette&&(!palette.length||palette.length>256||palette.some(p=>!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isInteger(n)||n<0||n>255))))throw Error('Invalid RGBA buffer or palette');
 if(!Number.isInteger(alphaThreshold)||alphaThreshold<1||alphaThreshold>255||translate.length!==2||translate.some(n=>!Number.isInteger(n)))throw Error('Invalid alpha/translation');
 const output=new Uint8ClampedArray(w*h*4),raw=new Uint8ClampedArray(w*h*4),factor=width/w;let clipped=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const from=(Math.floor((y+.5)*factor)*width+Math.floor((x+.5)*factor))*4,to=(y*w+x)*4;raw.set(data.slice(from,from+4),to);
  if(data[from+3]<alphaThreshold)continue;const xx=x+translate[0],yy=y+translate[1];if(xx<0||yy<0||xx>=w||yy>=h){clipped++;continue;}
  let color=Array.from(data.slice(from,from+3));if(palette)color=palette.reduce((best,c)=>c.reduce((n,v,i)=>n+(v-color[i])**2,0)<best.distance?{color:c,distance:c.reduce((n,v,i)=>n+(v-color[i])**2,0)}:best,{color:null,distance:Infinity}).color;
  const i=(yy*w+xx)*4;output.set([...color,255],i);
 }
 if(clipped)throw Error('Translation would clip visible pixels');return {raw,output};
}
export function draftPalette(rgba,count=6){
 const histogram=new Map();for(let i=0;i<rgba.length;i+=4)if(rgba[i+3]){const rgb=[...rgba.slice(i,i+3)],key=rgb.join(',');const row=histogram.get(key);if(row)row.n++;else histogram.set(key,{rgb,n:1});}
 const rows=[...histogram.values()].sort((a,b)=>a.rgb.reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0)-b.rgb.reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0));if(!rows.length)throw Error('Empty sprite');
 const total=rows.reduce((n,r)=>n+r.n,0);let palette=Array.from({length:count},(_,i)=>{let n=0;return rows.find(r=>(n+=r.n)>total*(i+.5)/count).rgb;});
 for(let step=0;step<24;step++){const sums=palette.map(()=>[0,0,0,0]);for(const row of rows){let best=0,distance=Infinity;palette.forEach((p,i)=>{const d=p.reduce((n,v,j)=>n+(v-row.rgb[j])**2,0);if(d<distance){best=i;distance=d;}});for(let c=0;c<3;c++)sums[best][c]+=row.rgb[c]*row.n;sums[best][3]+=row.n;}palette=palette.map((p,i)=>sums[i][3]?sums[i].slice(0,3).map(n=>Math.round(n/sums[i][3])):p);}
 return [...new Map(palette.map(p=>[p.join(','),p])).values()].sort((a,b)=>a.reduce((n,v)=>n+v,0)-b.reduce((n,v)=>n+v,0));
}
function png(data,[w,h]){const canvas=createCanvas(w,h),c=canvas.getContext('2d'),image=c.createImageData(w,h);image.data.set(data);c.putImageData(image,0,0);return canvas.toBuffer('image/png');}
export async function normalizePixelAsset(recipeFile){
 const recipe=readJSON(recipeFile);if(recipe.version!==1||recipe.status!=='candidate'||recipe.sampling!=='nearest'||recipe.direction!=='NW'||recipe.state!=='idle')throw Error('Only the declared NW idle diagnostic recipe is supported');
 const source=inside(ROOT,recipe.source),bytes=readFileSync(source);if(hash(bytes)!==recipe.sourceSha256)throw Error('Source changed');
 const im=await loadImage(bytes);if(JSON.stringify([im.width,im.height])!==JSON.stringify(recipe.sourceCanvas))throw Error('Source dimensions changed');const c=createCanvas(im.width,im.height),ctx=c.getContext('2d');ctx.drawImage(im,0,0);const data=ctx.getImageData(0,0,im.width,im.height).data;
 const binary=nearestFrame(data,im.width,im.height,{...recipe,palette:null}),palette=recipe.paletteRgb?.map(color=>{if(!/^#[a-f0-9]{6}$/i.test(color))throw Error('Invalid exact RGB');return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16));})||draftPalette(binary.output,6),normalized=nearestFrame(data,im.width,im.height,{...recipe,palette});
 const derivatives=resolve(ROOT,'art/sprites/pixel-quarterview/derived');mkdirSync(derivatives,{recursive:true});const out=inside(derivatives,recipe.id);mkdirSync(out,{recursive:true});
 const enlarged=new Uint8ClampedArray(recipe.canvas[0]*recipe.canvas[1]*16*4);for(let y=0;y<recipe.canvas[1]*4;y++)for(let x=0;x<recipe.canvas[0]*4;x++)enlarged.set(normalized.output.slice((Math.floor(y/4)*recipe.canvas[0]+Math.floor(x/4))*4,(Math.floor(y/4)*recipe.canvas[0]+Math.floor(x/4))*4+4),(y*recipe.canvas[0]*4+x)*4);
 const outputs={'nearest-raw.png':png(binary.raw,recipe.canvas),'nearest-binary.png':png(binary.output,recipe.canvas),'body-nw-idle.png':png(normalized.output,recipe.canvas),'body-nw-idle-4x.png':png(enlarged,recipe.canvas.map(n=>n*4))};
 for(const [name,content]of Object.entries(outputs)){const target=inside(out,name);if(existsSync(target)&&hash(readFileSync(target))!==hash(content))throw Error('Derivative changed: use a new recipe ID');writeFileSync(target,content);}
 const comparison=createCanvas(1000,570),preview=comparison.getContext('2d');preview.fillStyle='#16262b';preview.fillRect(0,0,1000,570);preview.fillStyle='#f7edd9';preview.font='18px sans-serif';preview.fillText('64 x 96 inspection - each logical pixel shown at 4x',22,26);
 for(const [i,name]of ['nearest-raw.png','nearest-binary.png','body-nw-idle.png'].entries()){const im=await loadImage(outputs[name]),x=30+i*320,y=82;preview.fillStyle='#405156';preview.fillRect(x,y,256,384);preview.imageSmoothingEnabled=false;preview.drawImage(im,x,y,256,384);preview.fillStyle='#f7edd9';preview.fillText(name,x,60);preview.fillText('feet (32,88) / head (32,28)',x,505);preview.strokeStyle='#ffb35f';preview.beginPath();preview.moveTo(x,y+88*4);preview.lineTo(x+256,y+88*4);preview.stroke();preview.strokeStyle='#79e5ef';preview.beginPath();preview.arc(x+32*4,y+28*4,4,0,Math.PI*2);preview.stroke();}
 writeFileSync(inside(out,'comparison.png'),comparison.toBuffer('image/png'));
 // Pinned upstream checks the final one-frame geometry at scale 1. It cannot
 // do nearest downsampling, so no resampling is delegated to its smooth fitter.
 const lock=readJSON(resolve(ROOT,'tools/sprite-gen.lock.json')),repo=inside(ROOT,lock.location),head=spawnSync('git',['-c','core.excludesFile=','rev-parse','HEAD'],{cwd:repo,encoding:'utf8',windowsHide:true});if(head.status!==0||head.stdout.trim()!==lock.commit)throw Error('Pinned sprite-gen checkout required');
 let top=recipe.canvas[1],bottom=-1;for(let y=0;y<recipe.canvas[1];y++)for(let x=0;x<recipe.canvas[0];x++)if(normalized.output[(y*recipe.canvas[0]+x)*4+3]){top=Math.min(top,y);bottom=Math.max(bottom,y);}
 const python=resolve(repo,process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python'),args=['-m','sprite_gen.cli','slice-sheet','--sheet',inside(out,'body-nw-idle.png'),'--out-dir',inside(out,'geometry-check'),'--chroma-key','none','--alpha-floor','0','--grid','1x1','--names','frame0','--cell-width',String(recipe.canvas[0]),'--cell-height',String(recipe.canvas[1]),'--baseline-y',String(bottom+1),'--target-height',String(bottom-top+1),'--noise-min','1','--debris-fraction','0','--scale','sheet','--fit','contain'];
 const result=spawnSync(python,args,{cwd:ROOT,encoding:'utf8',windowsHide:true});writeFileSync(inside(out,'sprite-gen.log.txt'),result.stdout+result.stderr);if(result.status!==0)throw Error('Pinned geometry validation failed: '+result.stderr);
 const check=await loadImage(inside(out,'geometry-check/frame0.png')),checkCanvas=createCanvas(...recipe.canvas),checkCtx=checkCanvas.getContext('2d');checkCtx.drawImage(check,0,0);if(Buffer.compare(Buffer.from(checkCtx.getImageData(0,0,...recipe.canvas).data),Buffer.from(normalized.output)))throw Error('Pinned geometry check changed pixels');
 const report={version:1,status:'candidate',recipe:recipeFile.replaceAll('\\','/'),recipeSha256:hash(recipe),sourceSha256:hash(bytes),normalizerSha256:hash(readFileSync(new URL('./pixel-normalize.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n')),textHashPolicy:'parsed recipe JSON; LF-normalized normalizer source',spriteGenCommit:lock.commit,canvas:recipe.canvas,anchors:recipe.anchors,paletteRgb:palette.map(p=>'#'+p.map(n=>n.toString(16).padStart(2,'0')).join('')),outputs:Object.fromEntries(Object.entries(outputs).map(([n,b])=>[n,hash(b)])),sourcePreserved:hash(readFileSync(source))===recipe.sourceSha256,productionApproved:false};
 writeJSON(inside(out,'normalization-report.json'),report);return report;
}
