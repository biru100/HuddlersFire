import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { spawnPlayer } from '../lib/camp-world.mjs';
import {sceneCamera,freeCamera,panCamera,zoomCameraAt} from '../lib/camp-camera.mjs';

test('radio bubbles have no connector and disappear offscreen while player chat keeps its connector',()=>{
 let strokes=0;const ctx={measureText:t=>({width:t.length*6}),beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++;},roundRect(){},fill(){},fillText(){}};
 const r={ctx,camera:{x:350,y:300},project:()=>[0,0],sceneTime:1000,width:800,height:650};
 const music={current:{title:'노래',name:'친구'},playing:true};CampRenderer.prototype.bubbles.call(r,[],1,music);assert.equal(strokes,0);assert.ok(r.bubbleAreas.some(b=>b.id==='__radio__'));
 CampRenderer.prototype.bubbles.call(r,[{id:'friend',x:0,y:0,bubble:'hello',bubbleUntil:2000}],1,music);assert.equal(strokes,1);
 r.camera.x=-1000;CampRenderer.prototype.bubbles.call(r,[],1,music);assert.equal(r.bubbleAreas.length,0);
});

test('mobile following preserves readable people; overview fits tall stacks without overriding a chosen follow zoom',()=>{
 const self={id:'self',x:2.6,y:4.5,z:0},hud=[{x:12,y:48,width:150,height:40},{x:12,y:590,width:120,height:100}];
 const camera=sceneCamera({width:390,height:720,players:[self],self,follow:true,occlusions:hud});
 assert.ok(camera.scale*77>=64);const y=camera.y+(self.x+self.y)*20*camera.scale;
 assert.ok(y-80*camera.scale>=camera.view.top&&y+25<=camera.view.bottom);
 const overview=sceneCamera({width:390,height:720,players:[self],self,follow:false});assert.ok(overview.scale<camera.scale);
 const stack=Array.from({length:16},(_,i)=>({id:String(i),x:0,y:0,z:i*1.4}));
 const high=sceneCamera({width:390,height:520,players:stack,self:stack[0],follow:false});
 for(const p of stack){const y=high.y-p.z*40*high.scale;assert.ok(y-85*high.scale>=high.view.top-.01&&y+30*high.scale<=high.view.bottom+.01);}
 const follow=sceneCamera({width:390,height:520,players:stack,self:stack[0],follow:true,zoom:2});assert.ok(follow.scale>high.scale);
});

test('free dragging preserves the captured camera, anchors wheel zoom and ignores seating or other players moving',()=>{
 const self={id:'self',x:1,y:2,z:0},args={width:1050,height:824,players:[self],self,follow:true,zoom:2};
 const before=sceneCamera(args),captured=freeCamera(before,2),free=sceneCamera({...args,mode:'free',freeView:captured});
 assert.ok(Math.abs(free.x-before.x)<1e-10&&Math.abs(free.y-before.y)<1e-10);assert.equal(free.scale,before.scale);
 const moved=panCamera(captured,2,150,-70),after=sceneCamera({...args,mode:'free',freeView:moved});
 assert.ok(Math.abs(after.x-before.x-150)<1e-10&&Math.abs(after.y-before.y+70)<1e-10);
 const point={x:234,y:300},world={x:(point.x-after.x)/after.scale,y:(point.y-after.y)/after.scale};
 const zoomedView=zoomCameraAt(moved,2,2.5,after.view,point.x,point.y),zoomed=sceneCamera({...args,zoom:2.5,mode:'free',freeView:zoomedView});
 assert.ok(Math.abs(zoomed.x+world.x*zoomed.scale-point.x)<1e-10&&Math.abs(zoomed.y+world.y*zoomed.scale-point.y)<1e-10);
 const seated=sceneCamera({...args,self:{...self,z:.18},players:[{...self,z:20}],focused:1});assert.equal(seated.scale,before.scale);
 const still=sceneCamera({...args,self:{...self,x:10,z:20},players:[{...self,z:20}],mode:'free',freeView:moved,focused:1});assert.equal(still.x,after.x);assert.equal(still.y,after.y);
});
test('display movement direction persists after stopping and never rewrites shared player state',()=>{
 const p={id:'friend',moving:true,vx:-1,vy:0,facing:1},before=structuredClone(p),display={motionDirections:new Map(),getScene:()=>({players:[p]})};
 const moving=CampRenderer.prototype.displayPlayer.call(display,p);assert.equal(moving.visualDirection,'back-left');assert.deepEqual(p,before);
 const stopped=CampRenderer.prototype.displayPlayer.call(display,{...p,moving:false,vx:0,vy:0});assert.equal(stopped.visualDirection,'back-left');
});

test('zoom and following preserve hit testing and inverse aiming across sizes and window ownership',()=>{
  const saved={window:globalThis.window,ResizeObserver:globalThis.ResizeObserver,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
  let scheduled=0,cancelled=0;
  const owner={devicePixelRatio:2,requestAnimationFrame:()=>++scheduled,cancelAnimationFrame:()=>cancelled++};
  globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.requestAnimationFrame=()=>{throw new Error('Wrong window RAF');};globalThis.cancelAnimationFrame=()=>{};
  let renderer;
  try {
    const canvas=createCanvas(560,480);let width=560,height=480;
    canvas.ownerDocument={defaultView:owner};canvas.getBoundingClientRect=()=>({width,height,left:30,top:50});
    const self={...spawnPlayer(),id:'self',x:2,y:-1,name:'나',workText:'개발 중'};
    const scene={players:[self],self:'self',zoom:1,followSelf:false,now:1000};
    renderer=new CampRenderer(canvas,()=>scene);
    for(const size of [[560,480],[390,520],[1050,824]])for(const zoom of [.75,1,2,3])for(const follow of [false,true]){
      [width,height]=size;scene.zoom=zoom;scene.followSelf=follow;renderer.resize();renderer.draw(1000);
      const area=renderer.hitAreas[0];assert.equal(renderer.pickPlayer(area.head.x+30,area.head.y+50),'self');
      const [px,py]=renderer.project(self.x+1,self.y);
      const x=30+renderer.camera.x+px*renderer.camera.scale;
      const y=50+renderer.camera.y+(py-(self.z+.65)*40)*renderer.camera.scale;
      const aim=renderer.aimDirection(x,y,self);assert.ok(Math.abs(aim.dx-1)<.00001);assert.ok(Math.abs(aim.dy)<.00001);
    }
    assert.ok(scheduled>1);renderer.destroy();renderer=null;assert.equal(cancelled,1);
  } finally {renderer?.destroy();for(const [key,value] of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});

test('foreground map art cannot cover nameplates and picking follows their visible overlay at every zoom',()=>{
  const keys=['window','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'],saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
  globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  try{
    for(const theme of ['color','dark'])for(const dpr of [1,2])for(const mapId of ['camp','playground'])for(const zoom of [.75,1,3])for(const posture of [{},{sitting:true},{carriedBy:'carrier',z:1.3}]){
      globalThis.window.devicePixelRatio=dpr;
      const p={...spawnPlayer(0,mapId),...posture,id:'self',name:'지형 뒤 친구',x:0,y:0};
      const canvas=createCanvas(1050,824);canvas.getBoundingClientRect=()=>({left:20,top:30,width:1050,height:824});
      const renderer=new CampRenderer(canvas,()=>({theme,players:[p],self:p.id,now:1000,zoom}));
      try{
        // Opaque foreground art covers every body and the original world-space label position.
        const cover=function(){this.ctx.fillStyle='#ff00ff';this.ctx.fillRect(-10000,-10000,20000,20000);};
        renderer.tree=cover;renderer.tent=cover;renderer.fence=cover;renderer.shade=cover;
        renderer.draw(1000);const box=renderer.hitAreas[0].label;
        const [r,g,b]=canvas.getContext('2d').getImageData(Math.floor((box.x+box.width/2)*dpr),Math.floor((box.y+3*renderer.camera.scale)*dpr),1,1).data;
        assert.ok(!(r>230&&g<20&&b>230),'The visible nameplate must cover the magenta foreground art');
        assert.ok(renderer.nameFontSize>=12,'Names remain readable independently of world zoom');
        assert.equal(renderer.pickPlayer(20+box.x+box.width/2,30+box.y+box.height/2),p.id);
        p.motion='respawning';renderer.draw(1000);assert.equal(renderer.nameplates.length,0,'Hidden respawn bodies must not leave floating names');
      }finally{renderer.destroy();}
    }
  }finally{for(const k of keys){if(saved[k]===undefined)delete globalThis[k];else globalThis[k]=saved[k];}}
});

test('compact presence badges avoid profiles, nameplates and speech at crowded desktop/mobile/PIP scales',()=>{
  const saved={window:globalThis.window,ResizeObserver:globalThis.ResizeObserver,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
  globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  let total=0;
  try {
    for(const [width,height] of [[1050,824],[390,520],[560,480]])for(const count of [1,8,16])for(const zoom of [.75,1,2,3]){
      const canvas=createCanvas(width,height);canvas.getBoundingClientRect=()=>({width,height,left:0,top:0});
      const players=Array.from({length:count},(_,i)=>({...spawnPlayer(i),id:String(i),name:'친구 '+i,
        ...(count===1?{}:{x:(i%4-1.5)*.9,y:(Math.floor(i/4)-1.5)*.9}),presence:i%3===0?'away':'working',
        workText:'이 긴 작업 메모는 상세 정보에서만 읽어요'.repeat(3),statusText:'상세 상태',
        bubble:i%5===0?'이야기를 가리지 않아요':'',bubbleUntil:5000}));
      const renderer=new CampRenderer(canvas,()=>({players,self:'0',targetId:String(count-1),now:1000,zoom,followSelf:true}));
      try {
        renderer.draw(1000);
        const blocked=renderer.hitAreas.flatMap(a=>[a.body,a.label,{x:a.head.x-a.head.radius,y:a.head.y-a.head.radius,width:a.head.radius*2,height:a.head.radius*2}]).concat(renderer.bubbleAreas);
        for(const badge of renderer.presenceAreas){
          total++;assert.ok(/^(작업 중|자리 비움) · 상세 상태/.test(badge.text));assert.ok(badge.x>=0&&badge.y>=0&&badge.x+badge.width<=width&&badge.y+badge.height<=height);
          assert.ok(blocked.every(area=>!overlap(badge,area)),'Status badge covers a profile, name or conversation');
          assert.equal(renderer.pickPlayer(badge.x+badge.width/2,badge.y+badge.height/2),badge.id);
          blocked.push(badge);
        }
      } finally {renderer.destroy();}
    }
    assert.ok(total>0,'All badges disappeared');
  } finally {for(const [key,value] of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
