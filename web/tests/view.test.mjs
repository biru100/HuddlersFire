import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { spawnPlayer } from '../lib/camp-world.mjs';

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
          total++;assert.ok(['작업','비움'].includes(badge.text));assert.ok(badge.x>=0&&badge.y>=0&&badge.x+badge.width<=width&&badge.y+badge.height<=height);
          assert.ok(blocked.every(area=>!overlap(badge,area)),'Status badge covers a profile, name or conversation');
          assert.equal(renderer.pickPlayer(badge.x+badge.width/2,badge.y+badge.height/2),badge.id);
          blocked.push(badge);
        }
      } finally {renderer.destroy();}
    }
    assert.ok(total>0,'All badges disappeared');
  } finally {for(const [key,value] of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
