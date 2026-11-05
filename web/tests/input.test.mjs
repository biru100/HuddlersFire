import test from 'node:test';
import assert from 'node:assert/strict';
import { bindCampInput, zoomFromWheel } from '../lib/camp-input.mjs';

function setup() {
  const win = new EventTarget(), doc = new EventTarget(), node = new EventTarget(), keys = new Set(), calls = [];
  let locked = false, emotes = false, active = true;
  node.focus = () => calls.push('focus');
  const stop = bindCampInput({node,win,doc,keys,locked:()=>locked,active:()=>active,emotes:()=>emotes,setEmotes:value=>{emotes=value;},
    reset:()=>{keys.clear();calls.push('reset');},update:()=>calls.push('input'),startMove:()=>calls.push('move'),
    crouch:x=>calls.push(['crouch',x]),emote:x=>calls.push(['emote',x]),equip:x=>calls.push(['equip',x]),fire:x=>calls.push(['fire',x]),
    jump:()=>calls.push('jump'),lift:()=>calls.push('lift'),radio:()=>calls.push('radio'),sit:()=>calls.push('sit'),player:id=>calls.push(['player',id]),
    self:()=>({weapon:'gun'}),aim:()=>({dx:1,dy:0}),setAim:x=>calls.push(['aim',x]),pick:()=> 'friend',zoom:(delta,mode)=>calls.push(['zoom',delta,mode]),editable:()=>false });
  function event(target,type,values={}) {const e=new Event(type,{cancelable:true});Object.assign(e,values);target.dispatchEvent(e);return e;}
  return {win,doc,node,keys,calls,stop,event,lock:x=>{locked=x;},activate:x=>{active=x;}};
}

test('input ownership distinguishes movement, equipment, emotes and a single jump', () => {
  const s=setup();
  s.event(s.win,'keydown',{code:'KeyW'});assert.ok(s.keys.has('KeyW'));
  s.event(s.win,'keydown',{code:'Digit2'});assert.deepEqual(s.calls.at(-1),['equip','snowball']);
  s.event(s.win,'keydown',{code:'KeyQ'});s.event(s.win,'keydown',{code:'Digit2'});assert.deepEqual(s.calls.at(-1),['emote','laugh']);
  s.event(s.win,'keydown',{code:'Space',repeat:false});s.event(s.win,'keydown',{code:'Space',repeat:true});assert.equal(s.calls.filter(x=>x==='jump').length,1);
  s.event(s.win,'keyup',{code:'KeyW'});assert.equal(s.keys.size,0);s.stop();
});

test('modal locking, composition, focus loss and teardown prevent stuck or unintended input', () => {
  const s=setup();s.lock(true);s.event(s.win,'keydown',{code:'KeyW'});assert.equal(s.keys.size,0);
  s.lock(false);s.event(s.win,'keydown',{code:'Space',isComposing:true});assert.equal(s.calls.includes('jump'),false);
  s.event(s.win,'keydown',{code:'KeyW'});s.event(s.win,'blur');assert.equal(s.keys.size,0);
  s.event(s.win,'keydown',{code:'KeyA'});s.event(s.doc,'focusin');assert.equal(s.keys.size,0);
  s.stop();const count=s.calls.length;s.event(s.win,'keydown',{code:'Space'});s.event(s.node,'pointerdown',{button:2});assert.equal(s.calls.length,count);
});

test('right click fires while left/touch click opens information; dragging and cancellation do not select', () => {
  const s=setup();
  s.event(s.node,'pointerdown',{button:2,clientX:20,clientY:30});assert.deepEqual(s.calls.at(-1),['fire',{dx:1,dy:0}]);
  s.event(s.node,'pointerdown',{button:0,pointerId:1,clientX:20,clientY:30});s.event(s.node,'pointerup',{pointerId:1,clientX:22,clientY:31,pointerType:'touch'});
  assert.deepEqual(s.calls.at(-1),['player','friend']);
  const count=s.calls.length;s.event(s.node,'pointerdown',{button:0,pointerId:2,clientX:20,clientY:30});s.event(s.node,'pointerup',{pointerId:2,clientX:50,clientY:31});
  s.event(s.node,'pointerdown',{button:0,pointerId:3,clientX:20,clientY:30});s.event(s.node,'pointercancel');s.event(s.node,'pointerup',{pointerId:3,clientX:20,clientY:30});assert.equal(s.calls.length,count);s.stop();
});

test('wheel zoom belongs only to the active field and is removed with its owning window listeners',()=>{
  const s=setup();
  const turn=(target=s.node,extra={})=>s.event(target,'wheel',{deltaY:-100,deltaMode:0,...extra});
  assert.equal(turn().defaultPrevented,true);assert.deepEqual(s.calls.at(-1),['zoom',-100,0]);
  const count=s.calls.length;assert.equal(turn(s.win).defaultPrevented,false);assert.equal(turn(s.doc).defaultPrevented,false);assert.equal(turn(s.node,{ctrlKey:true}).defaultPrevented,false);
  s.lock(true);assert.equal(turn().defaultPrevented,false);s.lock(false);s.activate(false);assert.equal(turn().defaultPrevented,false);s.activate(true);
  assert.equal(turn(s.node,{deltaY:0}).defaultPrevented,false);assert.equal(turn(s.node,{deltaY:NaN}).defaultPrevented,false);assert.equal(s.calls.length,count);
  s.stop();const after=s.calls.length;assert.equal(turn().defaultPrevented,false);assert.equal(s.calls.length,after);
});

test('wheel zoom normalizes pixel, line and page deltas, preserves direction and clamps extreme motion',()=>{
  assert.equal(zoomFromWheel(1,-100),1.25);assert.ok(Math.abs(zoomFromWheel(1.25,100)-1)<1e-12);
  assert.equal(zoomFromWheel(1,-100/16,1),zoomFromWheel(1,-100));assert.equal(zoomFromWheel(1,-1,2),1.25);
  assert.equal(zoomFromWheel(1,-100000),3);assert.equal(zoomFromWheel(1,100000),.75);assert.equal(zoomFromWheel(1,NaN),1);
  const tiny=zoomFromWheel(1,-.5);assert.ok(tiny>1&&tiny<1.01,'Trackpad deltas must remain smooth');
});
