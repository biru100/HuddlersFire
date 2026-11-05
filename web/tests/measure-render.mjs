import { createCanvas, Image } from '@napi-rs/canvas';
import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { spawnPlayer, COLORS } from '../lib/camp-world.mjs';

globalThis.window = { devicePixelRatio: 1, matchMedia: () => ({matches:false}), Image };
globalThis.Image = Image;
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
const rows=[];
for (const mapId of ['camp','playground','showroom']) for(const theme of ['color','dark']) {
  const canvas=createCanvas(1050,824);
  canvas.getBoundingClientRect=()=>({width:1050,height:824});
  const players=Array.from({length:16},(_,i)=>({...spawnPlayer(i),id:String(i),name:`Camper ${i+1}`,mapId,color:COLORS[i%6],moving:i%2===0,running:i%3===0}));
  const scene={players,self:'0',mapId,theme,now:5000};
  const started=performance.now();
  const renderer=new CampRenderer(canvas,()=>scene);
  await renderer.ready;
  const readyMs=performance.now()-started;
  for(let i=0;i<30;i++)renderer.draw(5000+i*16);
  const samples=[];
  for(let i=0;i<180;i++){const start=performance.now();scene.now=6000+i*16;renderer.draw(scene.now);samples.push(performance.now()-start);}
  samples.sort((a,b)=>a-b);
  rows.push({mapId,theme,readyMs,medianMs:samples[90],p95Ms:samples[171],maxMs:samples.at(-1)});
  renderer.destroy();
}
mkdirSync('outputs',{recursive:true});
const output=process.argv[2]||'outputs/sprite-render-metrics.json';
writeFileSync(output,JSON.stringify({kind:'CPU Skia Canvas; not browser GPU or device FPS',width:1050,height:824,players:16,frames:180,rows},null,2));
console.log(JSON.stringify(rows,null,2));
