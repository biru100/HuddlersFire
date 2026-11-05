// @ts-check
import { PLAYER_FIELDS, decodeSnapshot } from './camp-snapshot.mjs';
import { MAX_PLAYERS, WIRE_BASE_TTL, WIRE_BASE_LIMIT, WIRE_CACHE_BYTES } from './camp-config.mjs';
import { PROTOCOL_VERSION } from './camp-protocol.mjs';
import { emptyFire } from './camp-fire.mjs';
import { emptyBall } from './camp-ball.mjs';
/** @typedef {import('./camp-types').WorldSnapshot} WorldSnapshot */
/** @typedef {import('./camp-types').WireState} WireState */
const same = (/** @type {unknown} */ a, /** @type {unknown} */ b) => a === b || JSON.stringify(a) === JSON.stringify(b);
const id = (/** @type {unknown} */ x) => typeof x === 'string' && x.length > 0 && x.length <= 64;
const sequence = (/** @type {unknown} */ x) => Number.isSafeInteger(x) && Number(x) >= 0;
/** @param {WorldSnapshot} world @returns {WireState} */
export function fullWire(world) {
  return { t:'state', v:world.v, epoch:world.epoch, seq:world.seq, now:world.now,
    f:world.players.map(p=>PLAYER_FIELDS.map(key=>p[key])), h:world.fire || emptyFire(), w:world.weapons, u:world.ball || emptyBall(),
    ...(world.checkpoint ? { c:world.checkpoint } : {}) };
}
/** No volatile frame depends on a previous volatile frame. @param {WorldSnapshot} world @param {WorldSnapshot|null} base @returns {WireState} */
export function deltaWire(world, base) {
  const full = fullWire(world);
  if (!base || base.epoch !== world.epoch || base.seq >= world.seq || world.checkpoint) return full;
  const previous = new Map(base.players.map(p=>[p.id,p]));
  /** @type {[string, unknown[]][]} */ const changes = [];
  for (const p of world.players) {
    const old = previous.get(p.id), fields = [];
    for (let index=1; index<PLAYER_FIELDS.length; index++) {
      const key = PLAYER_FIELDS[index]; if (!old || !same(p[key],old[key])) fields.push(index,p[key]);
    }
    if (fields.length || !old) changes.push([p.id,fields]);
    previous.delete(p.id);
  }
  const delta = { t:/** @type {const} */('state'),v:world.v,epoch:world.epoch,seq:world.seq,now:world.now,b:base.seq,d:changes,r:[...previous.keys()],
    ...(!same(world.fire,base.fire)?{h:world.fire||emptyFire()}:{}),
    ...(!same(world.weapons,base.weapons) ? { w:world.weapons } : {}),
    ...(!same(world.ball,base.ball) ? { u:world.ball || emptyBall() } : {}) };
  return JSON.stringify(delta).length < JSON.stringify(full).length ? delta : full;
}

/** Bounded immutable checkpoint cache; never use interpolated display players as a base. */
export class WireReceiver {
  constructor() {
    /** @type {Map<number,{world:WorldSnapshot,at:number,bytes:number}>} */ this.bases = new Map();
    this.bytes = 0;
  }
  /** @param {number} now */
  prune(now) {
    for (const [seq,entry] of this.bases) if (now-entry.at>WIRE_BASE_TTL) { this.bases.delete(seq); this.bytes-=entry.bytes; }
    while (this.bases.size>WIRE_BASE_LIMIT || this.bytes>WIRE_CACHE_BYTES) {
      const seq=this.bases.keys().next().value; if(seq===undefined)break;
      this.bytes-=this.bases.get(seq)?.bytes||0; this.bases.delete(seq);
    }
  }
  /** @param {unknown} value @param {number} epoch @param {number} now @returns {{world:WorldSnapshot|null,missing:boolean}} */
  read(value, epoch, now) {
    this.prune(now);
    const m=/** @type {WireState} */(value), fail={world:null,missing:false};
    if (!m || m.t!=='state' || m.v!==PROTOCOL_VERSION || m.epoch!==epoch || !sequence(m.seq) || !Number.isFinite(m.now) || m.now<0 || (m.c!==undefined&&(!m.c||typeof m.c!=='object'||Array.isArray(m.c)))) return fail;
    /** @type {unknown[]} */ let players;
    let weapons=m.w, ball=m.u, fire=m.h;
    if (Array.isArray(m.f)) {
      if (!m.h || !m.w || !m.u || m.f.length>MAX_PLAYERS || m.b!==undefined || m.d!==undefined || m.r!==undefined) return fail;
      players=[];
      for(const row of m.f) {
        if(!Array.isArray(row)||row.length!==PLAYER_FIELDS.length)return fail;
        players.push(Object.fromEntries(PLAYER_FIELDS.map((key,index)=>[key,row[index]])));
      }
    } else {
      if(!sequence(m.b)||Number(m.b)>=m.seq||m.c!==undefined||!Array.isArray(m.d)||m.d.length>MAX_PLAYERS||!Array.isArray(m.r)||m.r.length>MAX_PLAYERS)return fail;
      const changed=new Set(), removed=new Set();
      for(const key of m.r){if(!id(key)||removed.has(key))return fail;removed.add(key);}
      for(const row of m.d) {
        if(!Array.isArray(row)||row.length!==2||!id(row[0])||changed.has(row[0])||removed.has(row[0])||!Array.isArray(row[1])||row[1].length>2*(PLAYER_FIELDS.length-1)||row[1].length%2)return fail;
        changed.add(row[0]);let last=0;
        for(let i=0;i<row[1].length;i+=2){const field=row[1][i];if(!Number.isInteger(field)||Number(field)<=last||Number(field)>=PLAYER_FIELDS.length)return fail;last=Number(field);}
      }
      const base=this.bases.get(Number(m.b));
      if(!base||base.world.epoch!==epoch)return {world:null,missing:true};
      const map=new Map(base.world.players.map(p=>[p.id,{...p}]));
      for(const key of m.r) map.delete(key);
      for(const [key,fields] of m.d) {
        const p=map.get(key)||/** @type {import('./camp-types').PlayerState} */({id:key});
        for(let i=0;i<fields.length;i+=2) Object.assign(p,{[PLAYER_FIELDS[Number(fields[i])]]:fields[i+1]});
        map.set(key,p);
      }
      fire=fire===undefined?base.world.fire:fire;players=[...map.values()];weapons=weapons??base.world.weapons;ball=ball===undefined?base.world.ball:ball;
    }
    if (!ball) return fail;
    const world=decodeSnapshot({t:'state',v:m.v,epoch,seq:m.seq,now:m.now,players,weapons,ball,fire,...(m.c?{checkpoint:m.c}:{})},epoch);
    if(!world)return fail;
    if(world.checkpoint&&!this.bases.has(world.seq)) {
      const bytes=new TextEncoder().encode(JSON.stringify(world)).byteLength;
      this.bases.set(world.seq,{world:structuredClone(world),at:now,bytes});this.bytes+=bytes;this.prune(now);
    }
    return {world,missing:false};
  }
}
