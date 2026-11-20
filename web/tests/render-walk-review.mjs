// Run with the release sprite fixture, once on each revision with a separate output directory.
import {createCanvas} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {CampRenderer} from '../lib/camp-renderer.mjs';
import {simulateWorld,spawnPlayer} from '../lib/camp-world.mjs';

const out=process.argv[2];
if(!out)throw Error('Pass a new output directory for the walk review');
mkdirSync(out,{recursive:false});
Object.assign(globalThis,{window:{devicePixelRatio:1,matchMedia:()=>({matches:false})},
  ResizeObserver:class {observe(){} disconnect(){}},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}});
const canvas=createCanvas(380,300);
canvas.getBoundingClientRect=()=>({width:380,height:300});
const hero={...spawnPlayer(),id:'walker',name:'Myo',x:4.9,y:3.6,color:'green'};
const scene={players:[hero],self:hero.id,mapId:'camp',zoom:1,cameraMode:'follow',theme:'color',now:1000};
const players=new Map([[hero.id,hero]]);
const renderer=new CampRenderer(canvas,()=>scene);
renderer.draw(scene.now);
await renderer.ready;
let frame=0;
function record(dx,dy,count,running=false){
  const inputs=new Map([[hero.id,{dx,dy,running,sitting:false}]]);
  for(let i=0;i<count;i++){
    scene.now+=1000/20;
    simulateWorld(players,inputs,1/20,scene.now);
    renderer.draw(scene.now);
    writeFileSync(join(out,String(frame++).padStart(3,'0')+'.png'),canvas.toBuffer('image/png'));
  }
}
record(0,0,4);
record(1,0,15);record(0,-1,15);record(-1,0,15);record(0,1,15);
record(0,1,8,true);record(0,0,6);
Object.assign(hero,{x:11.3,y:.8,topStyle:1,hairStyle:1});
record(1,0,18);record(1,1,10);record(0,0,26);
renderer.destroy();
console.log(frame,'frames at 20 fps');
