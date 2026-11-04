// Reproducible local scenarios; not an internet capacity or hosting-cost benchmark.
import assert from 'node:assert/strict';
import { CampNetwork } from '../lib/camp-network.mjs';
import { spawnPlayer } from '../lib/camp-world.mjs';
import { emptyWeapons } from '../lib/camp-weapons.mjs';
import { PLAYER_FIELDS } from '../lib/camp-snapshot.mjs';
import { fullWire } from '../lib/camp-wire.mjs';
import { fixture, roomQuery } from './api-fixture.mjs';
const players = Array.from({length:16},(_,i)=>({id:String(i).padStart(24,'0'),...spawnPlayer(i),connected:true}));
const n = Object.assign(Object.create(CampNetwork.prototype),{epoch:1,sequence:0,hostNow:()=>12345.123456789123,weapons:emptyWeapons(),players:new Map(players.map(p=>[p.id,p])),chat:[],peers:new Map(),callbacks:{}});
const encoded = n.worldMessage(), raw = {...encoded,players:players.map(p=>Object.fromEntries(PLAYER_FIELDS.map(k=>[k,p[k]])))};
const bytes = x=>new TextEncoder().encode(JSON.stringify(x)).byteLength;
assert.ok(bytes(encoded)<bytes(raw));
let volatile=0,reliable=0;n.peers.set('peer',{ready:true});n.send=()=>volatile++;n.broadcastControl=()=>reliable++;
for(let i=0;i<150;i++)n.publishWorld(i%15===0);
const f=fixture(),h=await f.enrolled('H'),g=await f.enrolled('G');const {value:r}=await h('rooms',{op:'create'});const {value:gr}=await g('rooms',{op:'join',code:r.code});
await g(roomQuery(gr));f.resetQueries();await g(roomQuery(gr));
console.log(JSON.stringify({players:16,rawSnapshotBytes:bytes(raw),encodedSnapshotBytes:bytes(encoded),transmittedFullSnapshotBytes:bytes(fullWire(encoded)),snapshotReductionPct:Math.round(1000*(1-bytes(fullWire(encoded))/bytes(raw)))/10,
  idle10Seconds:{previousFrames:150,frames:volatile+reliable,volatile,reliable},ordinaryGuestPoll:{previousSql:12,sql:f.queries()}},null,2));f.sqlite.close();
