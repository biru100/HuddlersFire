// Runs the production v9 codec, per-peer receipt selection, tick and transport queue.
// Fake channels count application payload only; the separate RTC test uses real sockets.
import assert from 'node:assert/strict';
import { CampNetwork } from '../lib/camp-network.mjs';
import { WireReceiver } from '../lib/camp-wire.mjs';
import { spawnPlayer } from '../lib/camp-world.mjs';
import { encodePlayer } from '../lib/camp-snapshot.mjs';
import { emptyWeapons } from '../lib/camp-weapons.mjs';
import { emptyMusic } from '../lib/camp-media.mjs';
import { CommandLedger, PROTOCOL_VERSION } from '../lib/camp-protocol.mjs';
const SECONDS=30,PEERS=15;
const original=Object.getOwnPropertyDescriptor(performance,'now');
let clock=100000;
Object.defineProperty(performance,'now',{configurable:true,value:()=>clock});
function scenario(name,moving,toys=false) {
  clock=100000;
  const players=Array.from({length:16},(_,i)=>({id:String(i).padStart(24,'0'),...spawnPlayer(i),connected:true}));
  const n=Object.assign(Object.create(CampNetwork.prototype),{
    epoch:1,sequence:0,isHost:true,player:players[0].id,host:players[0].id,hostNow:()=>clock,
    players:new Map(players.map(p=>[p.id,p])),members:players.map(p=>({id:p.id})),weapons:emptyWeapons(),music:emptyMusic(),chat:[],
    peers:new Map(),inputs:new Map(),input:{dx:0,dy:0,sitting:false},lastTick:clock,lastBroadcast:0,lastCheckpoint:0,ledger:new CommandLedger(),callbacks:{},
  });
  n.coordinator().role(1,true,clock);
  let currentBytes=0,baselineBytes=0,frames=0,full=0,deltas=0,drops=0,decoded=0,legacySeq=0,signature=null,lastLegacy=0,lastLegacyCheckpoint=0;
  const receipts=[];
  // Frozen v8 broadcast behavior: full JSON on every successful non-music action,
  // plus periodic whole-state snapshots with the original idle suppression.
  function legacy(checkpoint) {
    const w={t:'state',v:8,epoch:1,seq:legacySeq++,now:clock,weapons:n.weapons,players:[...n.players.values()].map(encodePlayer)};
    if(checkpoint) w.checkpoint={chatId:null,musicRevision:0};
    else {const s=JSON.stringify({players:w.players,projectiles:w.weapons.projectiles,effects:w.weapons.effects});if(s===signature)return;signature=s;}
    baselineBytes+=Buffer.byteLength(JSON.stringify(w))*PEERS;
  }
  const handle=n.handleCommand.bind(n);
  function command(id,action){const result=handle(id,action);if(result.ok)legacy(true);return result;}
  for(let i=1;i<=PEERS;i++) {
    const rx=new WireReceiver(),p={id:players[i].id,ready:true,queue:[],queueBytes:0,epoch:1};
    function receive(frame,reliable) {
      const m=JSON.parse(frame);if(m.t!=='state')return;
      currentBytes+=Buffer.byteLength(frame);frames++;if(m.f)full++;else deltas++;
      if(!reliable&&frames%20===0){drops++;return;}
      const result=rx.read(m,1,clock);assert.ok(result.world,`undecodable peer ${i} seq ${m.seq}`);decoded++;
      if(result.world.checkpoint)receipts.push({peer:p,seq:m.seq,at:clock+250+(i%3)*100});
    }
    p.channel={readyState:'open',bufferedAmount:0,send:f=>receive(f,false),close(){}};
    const channel={readyState:'open',bufferedAmount:0,send:f=>receive(f,true),close(){}};
    n.peers.set(p.id,p);n.attachControl(p,channel);
  }
  let maxPendingBytes=0;
  for(let step=0;step<SECONDS*30;step++) {
    clock=100000+step*1000/30;
    for(let i=receipts.length-1;i>=0;i--)if(receipts[i].at<=clock){const r=receipts.splice(i,1)[0];r.peer.control.onmessage({data:JSON.stringify({t:'receipt',v:PROTOCOL_VERSION,epoch:1,seq:r.seq})});}
    for(let i=0;i<players.length;i++) {
      const angle=Math.floor(step/30)*Math.PI/2+i*.31;
      const input={dx:i<moving?Math.cos(angle):0,dy:i<moving?Math.sin(angle):0,sitting:false,running:i<moving&&i%2===0};
      if(i===0)n.input=input;else n.inputs.set(players[i].id,{...input,at:clock});
      if(toys&&i<moving&&step===0)command(players[i].id,{id:`equip-${i}`,kind:'equip',weapon:['gun','snowball','bomb'][i%3]});
      if(toys&&i<moving&&step%2===0&&(step/2)%12===i%12)command(players[i].id,{id:`fire-${step}-${i}`,kind:'fire',dx:Math.cos(angle),dy:Math.sin(angle)});
    }
    n.tick();
    if(clock-lastLegacy>=66){lastLegacy=clock;const checkpoint=clock-lastLegacyCheckpoint>=1000;if(checkpoint)lastLegacyCheckpoint=clock;legacy(checkpoint);}
    maxPendingBytes=Math.max(maxPendingBytes,...[...n.peers.values()].map(p=>p.queueBytes));
  }
  assert.ok(n.coordinator().receipts.size===PEERS);assert.equal(maxPendingBytes,0);
  return {name,movingInputPlayers:moving,baselineV8BytesPerSecond:Math.round(baselineBytes/SECONDS),productionV9BytesPerSecond:Math.round(currentBytes/SECONDS),
    reductionPercent:Math.round((1-currentBytes/baselineBytes)*1000)/10,frames:{all:frames,full,delta:deltas,simulatedVolatileDrops:drops,validated:decoded},encodingOperations:n.encoding?.frames,
    maxPendingApplicationQueueBytes:maxPendingBytes,checkpointReceipts:n.coordinator().receipts.size};
}
try {
  const scenarios=[scenario('idle',0),scenario('one-moving',1),scenario('four-moving',4),scenario('all-moving',16),scenario('four-weapons',4,true),scenario('all-weapons',16,true)];
  for(const [name,target] of [['idle',50],['all-moving',80],['all-weapons',50]])assert.ok(scenarios.find(s=>s.name===name).reductionPercent>=target,`${name} target ${target}%`);
  console.log(JSON.stringify({kind:'production path / simulated channels; not internet or CPU/FPS measurement',parameters:{seconds:SECONDS,simulationHz:30,peers:PEERS,receiptDelayMs:[250,350,450],periodicCheckpointHz:1},scenarios},null,2));
} finally {
  if(original)Object.defineProperty(performance,'now',original);else delete performance.now;
}
