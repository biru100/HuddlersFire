// Production Canvas renderer with a separate authoring registry. No personal UI.
import {createCanvas,loadImage,Image} from '@napi-rs/canvas';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {CampRenderer} from '../lib/camp-renderer.mjs';
import {createSpriteContext,setSpriteCanvasFactory} from '../lib/camp-sprite-assets.mjs';
import {spawnPlayer,COLORS} from '../lib/camp-world.mjs';
import {CAMP_SEATS} from '../lib/camp-seats.mjs';
import {EXHIBITED_GAMES,exhibitCover} from '../lib/camp-games.mjs';
import {avatarFixtures} from './character-fixtures.mjs';
import {loadJob,readJSON,writeJSON,hash,inside,ROOT,runtimeHash,reviewCases} from '../../tools/lib/sprite-spec.mjs';
export async function renderPreview(jobFile){
  const dir=dirname(resolve(jobFile)),job=loadJob(jobFile),built=readJSON(inside(dir,'build/preview.json')),manifest=readJSON(inside(dir,'build/manifest.json'));
  const assets=createSpriteContext(manifest,{cacheLimit:64,loader:url=>loadImage(url.startsWith('/__sprite-preview/files/')?inside(dir,'build/'+url.split('/').at(-1)):resolve(ROOT,'web/public'+url))});
  await assets.preloadSprites(Object.keys(manifest.files));setSpriteCanvasFactory(createCanvas);
  globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};globalThis.Image=Image;
  const cases=[],out=inside(dir,'screens');mkdirSync(out,{recursive:true});
  for(const c of reviewCases(job).filter(c=>c.kind==='canvas')){
    const canvas=createCanvas(c.width,c.height);canvas.getBoundingClientRect=()=>({width:c.width,height:c.height});
    const seat=c.view==='seat-ne'?CAMP_SEATS.find(s=>s.bench==='log-0'):c.view==='seat-nw'?CAMP_SEATS.find(s=>s.bench==='log-2'):null;
    const p={...spawnPlayer(0,c.map),id:'self',name:'Pilot',color:COLORS[0],connected:true,...(seat?{seatId:seat.id,x:seat.x,y:seat.y,z:.18,sitting:true}:{})};
    const players=c.view==='seats'?CAMP_SEATS.map((s,i)=>({...spawnPlayer(i),id:String(i),name:'친구 '+(i+1),color:COLORS[i%6],seatId:s.id,x:s.x,y:s.y,z:.18,sitting:true})):c.view==='actions'?['idle','walk','run','sit','crouch','jump','carry','carried','wave','heart','clap','dance','laugh','surprise','weapon','hit'].map((state,i)=>({...spawnPlayer(i,c.map),id:String(i),name:state,color:COLORS[i%6],x:-6+(i%4)*3.4,y:-5+Math.floor(i/4)*3.5,sitting:state==='sit',crouching:state==='crouch',moving:state==='walk'||state==='run',running:state==='run',motion:['jump','carried'].includes(state)?'airborne':'grounded',carriedBy:state==='carried'?'carrier':null,carrying:state==='carry'?'friend':null,weapon:state==='weapon'?'gun':'none',emote:state,emoteUntil:5000,hitAt:state==='hit'?950:-1})):c.view==='stack'?Array.from({length:16},(_,i)=>({...spawnPlayer(i,c.map),id:String(i),name:'친구 '+(i+1),x:0,y:0,z:i*1.65,carriedBy:i?'parent':null})): [p];
    if(c.view==='stack')players.forEach((p,i)=>Object.assign(p,{color:COLORS[i%6],carriedBy:i?String(i-1):null,carrying:i<15?String(i+1):null}));
    const profiles=avatarFixtures();if(job.spec.version===2)players.forEach((p,i)=>{if(i%3!==2)p.avatar=profiles[i%profiles.length].url;});
    const renderer=new CampRenderer(canvas,()=>({players,self:players[0].id,mapId:c.map,theme:c.theme,followSelf:!!seat||c.view==='seats',now:1000}),{assets});
    for(const profile of profiles)renderer.avatars.entries.set(profile.url,{image:await loadImage(profile.image.toBuffer('image/png')),failed:false});
    for(const game of EXHIBITED_GAMES){const cover=exhibitCover(game);if(cover)renderer.exhibitImages.set(cover,{image:await loadImage(resolve(ROOT,'web/public'+cover)),failed:false});}
    renderer.draw(1000);const file='screens/'+c.id+'.png';writeFileSync(inside(dir,file),canvas.toBuffer('image/png'));cases.push({id:c.id,kind:c.kind,width:c.width,height:c.height,file,sha256:hash(readFileSync(inside(dir,file))),map:c.map,view:c.view});renderer.destroy();
  }
  const previous=existsSync(inside(dir,'evidence.json'))?readJSON(inside(dir,'evidence.json')):null;
  writeJSON(inside(dir,'evidence.json'),{fingerprint:built.fingerprint,runtimeHash:runtimeHash(),manifestHash:built.manifestHash,selected:job.selected,legacyAssets:manifest.preview.legacyAssets,ungraded:true,cases:[...cases,...(previous?.fingerprint===built.fingerprint&&previous?.manifestHash===built.manifestHash&&previous?.runtimeHash===runtimeHash()?previous.cases.filter(c=>c.kind==='ui'):[])]});return cases;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const job=process.argv[process.argv.indexOf('--job')+1];if(!process.argv.includes('--job'))throw Error('--job required');console.log(JSON.stringify(await renderPreview(job),null,2));}
