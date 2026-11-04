// @ts-check
import { EMOTES } from './camp-world.mjs';
import { WEAPONS } from './camp-weapons.mjs';
/** @typedef {{dx:number,dy:number} | null} Aim */
/**
 * @param {{node: HTMLCanvasElement, win: Window, doc: Document, keys: Set<string>, locked:()=>boolean, active:()=>boolean,
 * emotes:()=>boolean, setEmotes:(open:boolean)=>void, reset:()=>void, update:()=>unknown, startMove:()=>void,
 * crouch:(down:boolean)=>void, emote:(id:string)=>void, equip:(id:string)=>void, fire:(aim?:Aim)=>void,
 * jump:()=>void, lift:()=>void, radio:()=>void, sit:()=>void, player:(id:string,x:number,y:number)=>void,
 * self:()=>({weapon:string}|null), aim:(x:number,y:number)=>Aim, setAim:(aim:Aim)=>void,
 * pick:(x:number,y:number,touch:boolean)=>string|null, editable?:(target:EventTarget|null)=>boolean}} o
 */
export function bindCampInput(o) {
  const editable = o.editable || (target => !!target && 'nodeType' in target && target.nodeType === 1 &&
    (/** @type {HTMLElement} */(target).matches('input,textarea,select,button,a,summary') || !!/** @type {HTMLElement} */(target).closest('[data-camp-panel]') || /** @type {HTMLElement} */(target).isContentEditable));
  /** @type {{id:number,x:number,y:number}|null} */ let pointer = null;
  /** @param {KeyboardEvent} e */
  const down = e => {
    if (e.isComposing || o.locked() || editable(e.target) || !o.active()) return;
    if (e.code === 'Enter') { e.preventDefault(); o.reset(); o.win.dispatchEvent(new Event('camp-chat-focus')); return; }
    if (e.code === 'Escape') { o.setEmotes(false); return; }
    if (o.emotes() && /^Digit[1-6]$/.test(e.code) && !e.repeat) { e.preventDefault(); o.emote(EMOTES[Number(e.code.slice(-1))-1].id); return; }
    if (/^Digit[0-3]$/.test(e.code) && !e.repeat) { e.preventDefault(); o.equip(Number(e.code.slice(-1)) ? WEAPONS[Number(e.code.slice(-1))-1].id : 'none'); return; }
    if (e.code === 'KeyJ') { e.preventDefault(); if (!e.repeat) o.fire(); return; }
    if (e.code === 'KeyQ' && !e.repeat) { e.preventDefault(); o.setEmotes(!o.emotes()); return; }
    const actions = { KeyF: o.lift, KeyR: o.radio, Space: o.jump };
    if (e.code in actions) { e.preventDefault(); if (!e.repeat) actions[/** @type {keyof typeof actions} */ (e.code)](); return; }
    if (e.code === 'KeyC') { e.preventDefault(); if (!e.repeat) { o.keys.add(e.code); o.crouch(true); } return; }
    if (['ShiftLeft','ShiftRight','KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE'].includes(e.code)) {
      e.preventDefault(); o.keys.add(e.code);
      if (e.code === 'KeyE' && !e.repeat) o.sit();
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) o.startMove();
      o.update();
    }
  };
  /** @param {KeyboardEvent} e */
  const up = e => { o.keys.delete(e.code); if (e.code === 'KeyC') o.crouch(false); o.update(); };
  /** @param {PointerEvent} e */
  const pointerDown = e => {
    if (e.button === 0) pointer = { id:e.pointerId,x:e.clientX,y:e.clientY };
    else if (e.button === 2 && !o.locked() && o.self()?.weapon && o.self()?.weapon !== 'none') {
      pointer = null; e.preventDefault(); o.node.focus(); o.fire(o.aim(e.clientX,e.clientY));
    }
  };
  /** @param {PointerEvent} e */
  const pointerUp = e => {
    const start = pointer; pointer = null;
    if (!start || start.id !== e.pointerId || Math.hypot(e.clientX-start.x,e.clientY-start.y)>8 || o.locked() || !o.active()) return;
    const id = o.pick(e.clientX,e.clientY,e.pointerType==='touch'); if (id) o.player(id,e.clientX,e.clientY);
  };
  /** @param {PointerEvent} e */
  const pointerMove = e => { if (e.pointerType==='mouse' && !o.locked()) o.setAim(o.aim(e.clientX,e.clientY)); };
  /** @param {MouseEvent} e */
  const context = e => { if (!o.locked() && o.self()?.weapon && o.self()?.weapon !== 'none') e.preventDefault(); };
  /** @type {(()=>void)[]} */ const cleanup = [];
  /** @template {Event} T @param {EventTarget} target @param {string} type @param {(event:T)=>void} handler */
  const listen = (target,type,handler) => { const listener = /** @type {EventListener} */ (handler); target.addEventListener(type,listener); cleanup.push(()=>target.removeEventListener(type,listener)); };
  listen(o.win,'keydown',down); listen(o.win,'keyup',up); listen(o.win,'blur',o.reset);
  listen(o.doc,'visibilitychange',()=>{if(o.doc.hidden)o.reset();});
  listen(o.doc,'focusin',e=>{if(e.target && e.target!==o.node)o.reset();});
  listen(o.node,'pointerdown',pointerDown); listen(o.node,'pointerup',pointerUp); listen(o.node,'pointermove',pointerMove);
  listen(o.node,'pointercancel',()=>{pointer=null;}); listen(o.node,'contextmenu',context);
  return () => { cleanup.forEach(fn=>fn()); pointer=null; o.reset(); };
}
