import {CampRenderer} from '../lib/camp-renderer.mjs';
import {createSpriteContext} from '../lib/camp-sprite-assets.mjs';
import {spawnPlayer,COLORS} from '../lib/camp-world.mjs';
import {CAMP_SEATS} from '../lib/camp-seats.mjs';
import {emptyFire} from '../lib/camp-fire.mjs';
const data=await fetch('/__material-preview/manifest').then(r=>r.json()),assets=createSpriteContext(data,{cacheLimit:48}),params=new URLSearchParams(location.search);
const scene={theme:params.get('theme')||'color',mapId:params.get('map')||'camp',now:5000,self:'0',zoom:params.get('view')==='close'?1.8:1.1,fire:emptyFire(),players:[]};
function populate(kind='seats'){
  scene.players=Array.from({length:16},(_,i)=>{const seat=CAMP_SEATS[i],p={...spawnPlayer(i),id:String(i),name:'허들러 '+(i+1),color:COLORS[i%6],mapId:scene.mapId,avatar:i===0?'https://cdn.discordapp.com/avatars/1/abc.png?size=64':null};
    if(kind==='seats'&&scene.mapId==='camp'){Object.assign(p,{x:seat.x,y:seat.y,z:seat.z||.18,seatId:seat.id,sitting:true});}
    else Object.assign(p,{x:(i%4-1.5)*1.9,y:(Math.floor(i/4)-1.5)*1.9,moving:i%2===0,running:i%3===0});return p;});
  if(kind==='actions'){for(let i=0;i<16;i++){const p=scene.players[i];p.emote=['wave','clap','dance','laugh','heart','surprise'][i%6];p.emoteUntil=999999;if(i%4===0){p.motion='airborne';p.z=1.2;p.vz=2;}if(i%4===1)p.crouching=true;}scene.self='15';}
  if(kind==='stack'){scene.players.forEach((p,i)=>{p.x=0;p.y=0;p.z=i*1.4;p.carriedBy=i?String(i-1):null;p.carrying=i<15?String(i+1):null;});scene.self='0';}
}
populate(params.get('case')||'seats');
const portrait=document.createElement('canvas');portrait.width=64;portrait.height=64;const pc=portrait.getContext('2d');pc.fillStyle='#3165c0';pc.fillRect(0,0,32,64);pc.fillStyle='#ed9544';pc.fillRect(32,0,32,64);pc.fillStyle='#fff';pc.fillRect(8,12,12,12);const photo=new Image();photo.src=portrait.toDataURL();await photo.decode();
const renderer=new CampRenderer(document.querySelector('[data-camp-input]'),()=>scene,{assets});renderer.avatars.entries.set('https://cdn.discordapp.com/avatars/1/abc.png?size=64',{image:photo,failed:false});await renderer.ready;await renderer.backendReady;
renderer.cancelFrame(renderer.frame);renderer.raf=()=>0;renderer.reduced=true;renderer.draw(scene.now);
const gpuRender=renderer.webgl?.render.bind(renderer.webgl);let lightMode=null;
if(gpuRender)renderer.webgl.render=(commands,frame)=>{if(lightMode)frame={...frame,lights:[{screen:[lightMode==='left'?100:950,200,180],screenRadius:1100,color:[1,.75,.45],intensity:.9}]};return gpuRender(commands,frame);};
window.lightingReview={renderer,scene,assets,populate,async set(values){Object.assign(scene,values);if(values.mapId)populate(values.case||'seats');else if(values.case)populate(values.case);renderer.draw(scene.now);await renderer.ready;renderer.draw(scene.now);},relight(mode){lightMode=mode;renderer.draw(scene.now);},frames(page){
  const rows=[],seen=new Set();for(const [name,row]of Object.entries(data.character.states))for(const r of [row,...Object.values(row.directions||{})])for(const [index,frame]of r.frames.entries()){const key=frame.x+','+frame.y;if(!seen.has(key)){seen.add(key);rows.push({name,index,frame});}}
  const c=renderer.ctx;c.setTransform(renderer.dpr,0,0,renderer.dpr,0,0);c.clearRect(0,0,renderer.width,renderer.height);c.recording.begin();c.fillStyle='#f1ead9';c.fillRect(0,0,renderer.width,renderer.height);
  const image=assets.getSprite(data.character.variants[0]);for(const [i,row]of rows.slice(page*18,page*18+18).entries()){const x=40+i%6*165,y=30+Math.floor(i/6)*245,f=row.frame;c.drawImage(image,f.x,f.y,f.w,f.h,x,y,144,144);c.font='14px sans-serif';c.fillStyle='#514530';c.fillText(row.name+'/'+row.index,x,y+168);}
  return renderer.webgl.render(c.recording.end(),{width:renderer.width,height:renderer.height,dpr:renderer.dpr,now:5000,lights:[{screen:[350,50,180],screenRadius:1100,color:[1,.72,.4],intensity:.85}]});
},sample(count=180){const rows=[];for(let i=0;i<30+count;i++){scene.now=5000+i*16;const start=performance.now();renderer.draw(scene.now);if(i>=30)rows.push(performance.now()-start);}rows.sort((a,b)=>a-b);return {median:rows[Math.floor(rows.length*.5)],p95:rows[Math.floor(rows.length*.95)],max:rows.at(-1),...renderer.webgl?.metrics};}};
window.lightingReady=true;
