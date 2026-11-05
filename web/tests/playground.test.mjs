import { emptyFire } from '../lib/camp-fire.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyBall, readBall, stepBall } from '../lib/camp-ball.mjs';
import { spawnPlayer, simulateWorld } from '../lib/camp-world.mjs';
import { WorkClock, formatDuration } from '../lib/camp-work-clock.mjs';
import { fullWire, deltaWire, WireReceiver } from '../lib/camp-wire.mjs';
import { encodePlayer, captureRecovery, restoreRecovery } from '../lib/camp-snapshot.mjs';
import { emptyWeapons } from '../lib/camp-weapons.mjs';
import { emptyMusic } from '../lib/camp-media.mjs';
import { PROTOCOL_VERSION } from '../lib/camp-protocol.mjs';
import { HostCoordinator } from '../lib/camp-host.mjs';
import { CampNetwork } from '../lib/camp-network.mjs';
import { CampAudio } from '../lib/camp-audio.mjs';
import { startCampTicker } from '../lib/camp-scheduler.mjs';

const player = extra => ({...spawnPlayer(0,'playground'),id:'p',connected:true,x:3.25,y:.6,moving:true,...extra});
test('walking and running kick the ball; it rolls with drag without moving other players',()=>{
  const slow={...emptyBall(),x:1.5},fast={...slow},p=player({x:1.05}),before={...p};
  stepBall(slow,new Map([['p',p]]),1/60,[]);
  stepBall(fast,new Map([['p',player({x:1.05,running:true})]]),1/60,[]);
  assert.ok(slow.vx>0);assert.ok(fast.vx>slow.vx);assert.deepEqual(p,before);
  const start=slow.x;for(let i=0;i<600;i++)stepBall(slow,new Map(),1/60,[]);
  assert.ok(slow.x>start);assert.equal(slow.vx,0);assert.ok(readBall(slow));
});
test('sitting, airborne, disconnected and stationary players do not kick',()=>{
  for(const extra of [{sitting:true},{motion:'airborne'},{connected:false},{moving:false}]) {
    const ball=emptyBall();stepBall(ball,new Map([['p',player(extra)]]),1/60,[]);assert.deepEqual(ball,emptyBall());
  }
});
test('working and away status leave contact with the ball enabled',()=>{
  for (const presence of ['working','away']) {
    const ball=emptyBall();stepBall(ball,new Map([['p',player({presence})]]),1/60,[]);
    assert.ok(ball.vx>0);
  }
});
test('ball rebounds from scenery and returns to a clear spawn when leaving the island',()=>{
  const ball={...emptyBall(),x:1,y:0,vx:-3};stepBall(ball,new Map(),.1,[{x:0,y:0,r:.7}]);
  assert.ok(ball.x>.92);assert.ok(ball.vx>0);
  Object.assign(ball,{x:12.1,y:3,vx:5});stepBall(ball,new Map(),.1,[]);assert.deepEqual(ball,emptyBall());
});
test('full/delta packets validate ball state and keep independent checkpoint bases',()=>{
  const base={t:'state',v:PROTOCOL_VERSION,epoch:1,seq:1,now:1000,players:[encodePlayer(player())],fire:emptyFire(),weapons:emptyWeapons(),ball:emptyBall(),checkpoint:{chatId:null,musicRevision:0}};
  const receiver=new WireReceiver();assert.deepEqual(receiver.read(fullWire(base),1,0).world,base);
  const next={...base,seq:2,ball:{...base.ball,x:4.1,vx:1},checkpoint:undefined};
  assert.deepEqual(receiver.read(deltaWire(next,base),1,1).world.ball,next.ball);
  const later={...next,seq:3,ball:{...next.ball,x:4.4}};
  assert.deepEqual(receiver.read(deltaWire(later,base),1,2).world.ball,later.ball);
  for(const value of [null,{...emptyBall(),vx:Infinity},{...emptyBall(),x:15},{...emptyBall(),vy:7},{...emptyBall(),rotation:99}]) {
    assert.equal(readBall(value),null);assert.equal(receiver.read({...fullWire(base),seq:5,u:value},1,3).world,null);
  }
  assert.equal(receiver.bases.get(1).world.ball.x,3.7);
});
test('ball position and velocity survive coherent recovery without sharing mutable state',()=>{
  const p=player(),ball={...emptyBall(),x:4,vx:2};
  const world={t:'state',v:PROTOCOL_VERSION,epoch:1,seq:1,now:1000,players:[encodePlayer(p)],fire:emptyFire(),weapons:emptyWeapons(),ball,checkpoint:{chatId:null,musicRevision:0}};
  const recovery=captureRecovery(world,[],emptyMusic());const restored=restoreRecovery(recovery,[p]);
  assert.deepEqual(restored.ball,ball);restored.ball.x=5;assert.equal(recovery.world.ball.x,4);
});
test('personal work time counts background elapsed time and pauses for other statuses',()=>{
  const clock=new WorkClock();clock.setWorking(true,100);clock.setWorking(true,1000);
  assert.equal(clock.read(3_600_100),3_600_000);assert.equal(formatDuration(clock.read(3_600_100)),'01:00:00');
  clock.setWorking(false,3_600_100);assert.equal(clock.read(7_200_100),3_600_000);
  clock.setWorking(true,7_200_100);clock.setWorking(false,7_201_100);assert.equal(clock.read(9_000_000),3_601_000);
  clock.reset();assert.equal(clock.read(10_000_000),0);
});
test('a one-second delayed simulation preserves movement, flight and rolling distance',()=>{
  const p=player({x:2,y:-1,motion:'airborne',z:2,vz:1,moving:false}),a=new Map([['p',{...p}]]),b=new Map([['p',{...p}]]);
  const ballA={...emptyBall(),vx:1},ballB={...ballA},input=new Map([['p',{dx:0,dy:.4,sitting:false}]]);
  for(let i=1;i<=60;i++)simulateWorld(a,input,1/60,i*1000/60,null,ballA);
  simulateWorld(b,input,1,1000,null,ballB);
  for(const key of ['x','y','z','vz'])assert.ok(Math.abs(a.get('p')[key]-b.get('p')[key])<1e-8,key);
  for(const key of ['x','vx','rotation'])assert.ok(Math.abs(ballA[key]-ballB[key])<1e-8,key);
});
test('long OS suspension processes bounded physics and freezes unprocessed camp time',()=>{
  const now=performance.now(),p=player({moving:false}),n=Object.assign(Object.create(CampNetwork.prototype),{
    isHost:true,closed:false,lastTick:now-60_000,clockOffset:0,players:new Map([['p',p]]),player:'p',peers:new Map(),inputs:new Map(),input:{dx:0,dy:0,sitting:false},
    fire:emptyFire(),weapons:emptyWeapons(),ball:emptyBall(),lastBroadcast:now,lastCheckpoint:now,flushStateUpdate:()=>{},publishWorld:()=>{}
  });
  n.tick();assert.ok(n.clockOffset < -58_900);assert.ok(n.schedulerLagUntil>performance.now());assert.ok(n.hostNow()<now-58_900);
});
test('slow scheduler cannot renew authority even while receipts and HTTP remain healthy',()=>{
  const h=new HostCoordinator();h.role(1,true,0);h.checkpoint(1,21_000);h.receipt('guest',1,1,21_000);
  const session={isHost:true,migrating:false,lastTick:21_000,player:'host',members:[{id:'host'},{id:'guest'}],schedulerLagUntil:26_000};
  assert.equal(h.canRenew(session,21_000),false);session.schedulerLagUntil=0;assert.equal(h.canRenew(session,21_000),true);
});
test('worker wakeups advance the ticker and teardown stops worker and fallback',()=>{
  const oldWindow=globalThis.window,oldWorker=globalThis.Worker,oldInterval=globalThis.setInterval,oldClear=globalThis.clearInterval,workers=[];let ticks=0,fallback,cleared=false;
  globalThis.setInterval=fn=>{fallback=fn;return 123;};globalThis.clearInterval=id=>{cleared=id===123;};
  globalThis.window={location:{href:'https://camp.test/'}};globalThis.Worker=class{constructor(){workers.push(this);}terminate(){this.stopped=true;}};
  try{const stop=startCampTicker(()=>ticks++),worker=workers[0];fallback();assert.equal(ticks,1);worker.onmessage();assert.equal(ticks,2);fallback();assert.equal(ticks,2);stop();assert.ok(worker.stopped&&cleared);}finally{globalThis.window=oldWindow;globalThis.Worker=oldWorker;globalThis.setInterval=oldInterval;globalThis.clearInterval=oldClear;}
});
test('recorded fire loads once, loops smoothly and resumes without timers',async()=>{
  let sources=0,resumes=0,stopped=false,closed=false;
  class Context {
    state='suspended';sampleRate=1000;currentTime=0;
    createGain(){return{gain:{value:0,setTargetAtTime(){},cancelScheduledValues(){},setValueAtTime(){}},connect(){}};}
    async decodeAudioData(){return {numberOfChannels:1,sampleRate:1000,length:20000,getChannelData:()=>new Float32Array(20000)};}
    createBuffer(_channels,length){const data=new Float32Array(length);return{getChannelData:()=>data};}
    createBufferSource(){sources++;return{connect(){},start(){},stop(){stopped=true;}};}
    createBiquadFilter(){return{frequency:{value:0},connect(){}};}
    async resume(){resumes++;this.state='running';}async close(){closed=true;}
  }
  const audio=new CampAudio(Context,async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}));await audio.setVolume(.5);assert.equal(sources,1);assert.ok(audio.noise.loop);
  await audio.resume();assert.equal(resumes,1);audio.context.state='interrupted';await audio.resume();assert.equal(resumes,2);
  await audio.setVolume(0);audio.context.state='suspended';await audio.resume();assert.equal(resumes,2);
  audio.destroy();assert.ok(stopped&&closed);
});
