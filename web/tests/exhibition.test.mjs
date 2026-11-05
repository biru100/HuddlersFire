import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMP_MAP,PLAY_MAP,SHOW_MAP,getMap,nearbyInteraction,MAP_BOUNDS,GAME_BOOTHS } from '../lib/camp-maps.mjs';
import { spawnPlayer,applyPlayerAction,validPlayerState,validPosition,simulateWorld } from '../lib/camp-world.mjs';
import { validAction,PROTOCOL_VERSION } from '../lib/camp-protocol.mjs';
import { encodePlayer,captureRecovery,restoreRecovery } from '../lib/camp-snapshot.mjs';
import { fullWire,deltaWire,WireReceiver } from '../lib/camp-wire.mjs';
import { emptyWeapons,readWeapons } from '../lib/camp-weapons.mjs';
import { emptyBall,readBall } from '../lib/camp-ball.mjs';
import { emptyFire } from '../lib/camp-fire.mjs';
import { emptyMusic } from '../lib/camp-media.mjs';
import { validChatEntry } from '../lib/camp-presence.mjs';
import { createGameExhibit,exhibitSocials,exhibitTrailer,exhibitCover,gameById,EXHIBITED_GAMES } from '../lib/camp-games.mjs';
import { readFile } from 'node:fs/promises';
import { createCanvas,loadImage } from '@napi-rs/canvas';
import { CampRenderer } from '../lib/camp-renderer.mjs';

const member=(mapId=CAMP_MAP)=>({id:'a',name:'친구',color:'#e5a76d',connected:true,...spawnPlayer(0,mapId)});
test('every exhibit has a unique mapped booth, local decodable artwork and a reachable interaction',async()=>{
  assert.equal(new Set(EXHIBITED_GAMES.map(g=>g.id)).size,EXHIBITED_GAMES.length);
  assert.equal(new Set(GAME_BOOTHS.map(b=>b.id)).size,GAME_BOOTHS.length);
  assert.equal(new Set(GAME_BOOTHS.map(b=>b.gameId)).size,GAME_BOOTHS.length);
  const credits=await readFile(new URL('../public/games/CREDITS.txt',import.meta.url),'utf8');
  for(const game of EXHIBITED_GAMES){
    const booth=GAME_BOOTHS.find(b=>b.gameId===game.id);
    assert.ok(booth,`Missing booth: ${game.id}`);
    assert.ok(validPosition(booth.x,booth.y+1.5,SHOW_MAP));
    assert.equal(nearbyInteraction({...member(SHOW_MAP),x:booth.x,y:booth.y+1.5})?.gameId,game.id);
    for(const path of [game.image,exhibitCover(game)]){
      assert.ok(path?.startsWith('/games/'));
      const image=await loadImage(await readFile(new URL('../public'+path,import.meta.url)));
      assert.ok(image.width>0&&image.height>0);
      assert.ok(credits.includes(path.slice('/games/'.length)),`Missing artwork credit: ${path}`);
    }
  }
  for(const booth of GAME_BOOTHS){
    assert.ok(gameById(booth.gameId));
    for(const other of [...GAME_BOOTHS,...getMap(SHOW_MAP).portals].filter(b=>b.id!==booth.id)){
      assert.ok(Math.hypot(booth.x-other.x,booth.y-other.y)>3.4,`Ambiguous interaction ranges: ${booth.id}/${other.id}`);
    }
  }
});
test('Torizon uses its own trailer, storefronts and four accounts while unregistered channels remain inactive',()=>{
  const game=gameById('torizon-telecom');
  assert.ok(game);
  assert.equal(exhibitTrailer(game).id,'eDon6CQezQY');
  assert.notEqual(exhibitCover(game),exhibitCover(gameById('parruits')));
  assert.deepEqual(exhibitSocials(game).filter(s=>s.url===null).map(s=>s.id),['instagram','tiktok']);
  assert.deepEqual(exhibitSocials(game).filter(s=>s.url!==null).map(s=>s.id),['youtube','x','discord','reddit']);
  const links=game.links.map(l=>new URL(l.url));
  assert.ok(links.some(u=>u.hostname==='store.steampowered.com'&&u.pathname.includes('/4599560/')));
  assert.ok(links.some(u=>u.hostname==='store.steampowered.com'&&u.pathname.includes('/4599570/')));
  assert.ok(links.every(u=>u.protocol==='https:'));
});
test('new exhibit templates keep optional media and accounts independent and absent accounts inactive',()=>{
  const a=createGameExhibit({id:'sample',title:'다음 게임'}),b=createGameExhibit();
  a.socials.x='https://x.com/example';a.details.push('설명');
  assert.deepEqual(b.socials,{});assert.deepEqual(b.details,[]);
  assert.equal(exhibitTrailer(a),null);assert.equal(exhibitCover(a),null);
  assert.equal(exhibitSocials(a).find(s=>s.id==='x').url,'https://x.com/example');
  assert.ok(exhibitSocials(b).every(s=>s.url===null));
  for(const value of ['',null,'   ','javascript:alert(1)','https://x.com.evil.test/account','https://x.com/','https://name:pass@x.com/account'])assert.equal(exhibitSocials({socials:{x:value}}).find(s=>s.id==='x').url,null);
  assert.equal(exhibitCover({cover:'https://example.com/image.png'}),null);
  assert.equal(exhibitCover({cover:'/games/../secret.png'}),null);
  assert.equal(exhibitCover({cover:'/games/sample.webp'}),'/games/sample.webp');
});
test('trailer embeds use only validated YouTube IDs, manual playback and a direct fallback link',()=>{
  const trailer=exhibitTrailer({trailer:'https://youtu.be/s0pMzMwvKgE'});
  assert.equal(trailer.id,'s0pMzMwvKgE');assert.equal(new URL(trailer.embed).host,'www.youtube-nocookie.com');
  assert.equal(new URL(trailer.embed).searchParams.get('autoplay'),null);
  assert.equal(trailer.url,'https://www.youtube.com/watch?v=s0pMzMwvKgE');
  for(const value of [null,'bad','https://other.test/watch?v=s0pMzMwvKgE','javascript:alert(1)'])assert.equal(exhibitTrailer({trailer:value}),null);
});
test('booth artwork is painted in the field; failed image loads fall back without repeated requests',async()=>{
  const canvas=createCanvas(300,210),ctx=canvas.getContext('2d'),poster=createCanvas(320,180);
  poster.getContext('2d').fillStyle='#ff0000';poster.getContext('2d').fillRect(0,0,320,180);
  const image=await loadImage(poster.toBuffer('image/png'));
  const cover=exhibitCover(gameById('parruits'));
  const renderer=Object.assign(Object.create(CampRenderer.prototype),{ctx,win:{},exhibitImages:new Map([[cover,{image,failed:false}]])});
  ctx.translate(150,170);renderer.gameBooth({gameId:'parruits',label:'PARRUITS!'});
  assert.deepEqual([...ctx.getImageData(150,100,1,1).data],[255,0,0,255]);
  let attempts=0;class FailedImage{set src(_value){attempts++;this.onerror();}}
  renderer.exhibitImages.clear();renderer.win.Image=FailedImage;
  renderer.gameBooth({gameId:'parruits',label:'PARRUITS!'});renderer.gameBooth({gameId:'parruits',label:'PARRUITS!'});
  assert.equal(attempts,1);assert.equal(renderer.exhibitImages.get(cover).failed,true);
});
const usePortal=(p,id)=>{
  const o=getMap(p.mapId).portals.find(o=>o.id===id);
  return {id:crypto.randomUUID(),kind:'change-map',mapId:o.destination,portalId:o.id,mapRevision:p.mapRevision};
};
test('portals require a real nearby source, correct destination and current visit revision',()=>{
  const p=member(),players=new Map([['a',p]]),cmd=usePortal(p,'camp-show');
  assert.ok(validAction(cmd));assert.ok(applyPlayerAction(players,'a',cmd,1000));
  Object.assign(p,{x:getMap(CAMP_MAP).portals[1].x,y:getMap(CAMP_MAP).portals[1].y});assert.equal(nearbyInteraction(p).id,'camp-show');
  for(const bad of [{portalId:'camp-play'},{mapId:PLAY_MAP},{mapRevision:1},{portalId:'missing'},{mapRevision:undefined}]) {
    const before=structuredClone(p);assert.ok(applyPlayerAction(players,'a',{...cmd,...bad},1000));assert.deepEqual(p,before);
  }
  assert.equal(validAction({...cmd,portalId:undefined}),false);
  assert.equal(applyPlayerAction(players,'a',cmd,1000),null);assert.equal(p.mapId,SHOW_MAP);assert.equal(p.mapRevision,1);
  assert.ok(validPosition(p.x,p.y,SHOW_MAP));assert.equal(nearbyInteraction(p),null,'Arrival clears the source portal interaction radius');
  Object.assign(p,{x:getMap(SHOW_MAP).portals[0].x,y:getMap(SHOW_MAP).portals[0].y});const back=usePortal(p,'show-camp');
  assert.equal(applyPlayerAction(players,'a',back,2000),null);assert.equal(p.mapId,CAMP_MAP);assert.equal(p.mapRevision,2);
  Object.assign(p,{x:getMap(CAMP_MAP).portals[1].x,y:getMap(CAMP_MAP).portals[1].y});assert.ok(applyPlayerAction(players,'a',{...cmd,id:crypto.randomUUID()},3000),'A delayed request from the earlier visit cannot warp the player');
});
test('booth interaction is local to the showroom, range limited and unavailable in flight or while carried',()=>{
  for(const mapId of [CAMP_MAP,PLAY_MAP,SHOW_MAP]) {
    const p=member(mapId),booth=getMap(SHOW_MAP).booths[0];Object.assign(p,{x:booth.x+1.3,y:booth.y});
    assert.equal(nearbyInteraction(p)?.type||null,mapId===SHOW_MAP?'gameBooth':null);
    if(mapId===SHOW_MAP)for(const extra of [{motion:'airborne'},{carriedBy:'b'},{thrown:true},{connected:false},{x:5}])assert.equal(nearbyInteraction({...p,...extra}),null);
  }
});
test('expanded corners stay walkable, replicate and recover along with showroom chat and fire',()=>{
  const p=member(SHOW_MAP);Object.assign(p,{x:10,y:9,presence:'working'});
  assert.equal(MAP_BOUNDS.edge,12);assert.ok(validPosition(p.x,p.y,p.mapId));assert.ok(validPlayerState(p));
  const state={t:'state',v:PROTOCOL_VERSION,epoch:1,seq:1,now:1000,players:[encodePlayer(p)],fire:emptyFire(),weapons:emptyWeapons(),ball:{...emptyBall(),x:10},checkpoint:{chatId:'c',musicRevision:0}};
  const chat=[{id:'c',by:'a',name:'친구',color:p.color,text:'전시장에서 만나요',at:900,createdAt:Date.now(),mapId:SHOW_MAP,kind:'chat'}];
  assert.ok(validChatEntry(chat[0]));const receiver=new WireReceiver();assert.ok(receiver.read(fullWire(state),1,0).world);
  const next={...state,seq:2,players:[{...state.players[0],x:11}],checkpoint:undefined};
  assert.equal(receiver.read(deltaWire(next,state),1,1).world.players[0].x,11);
  const restored=restoreRecovery(captureRecovery(state,chat,emptyMusic()),[p]);
  assert.equal(restored.players.get('a').mapId,SHOW_MAP);assert.equal(restored.players.get('a').x,10);assert.equal(restored.chat[0].mapId,SHOW_MAP);assert.equal(restored.ball.x,10);
  assert.ok(readBall({...emptyBall(),x:11}));assert.equal(readBall({...emptyBall(),x:15}),null);
  const weapons={...emptyWeapons(),projectiles:[{id:'shot',owner:'a',weapon:'gun',x:11.5,y:0,z:1,vx:12,vy:0,vz:0,bornAt:0,expiresAt:550}]};assert.ok(readWeapons(weapons));
});
test('all three maps fall at the expanded edge and keep their current map on respawn',()=>{
  for(const mapId of [CAMP_MAP,PLAY_MAP,SHOW_MAP]) {
    const p=member(mapId),players=new Map([['a',p]]);Object.assign(p,{x:0,y:9});
    simulateWorld(players,new Map(),.1,100);assert.equal(p.motion,'grounded');
    p.y=12.1;simulateWorld(players,new Map(),.1,200);assert.equal(p.motion,'falling');
    for(let i=1;i<=25;i++)simulateWorld(players,new Map(),.1,200+i*100);
    assert.equal(p.mapId,mapId);assert.equal(p.motion,'grounded');assert.ok(validPlayerState(p));
  }
});
test('showroom enforces the playground-only toy and carry contract at authority and snapshot boundaries',()=>{
  const p=member(SHOW_MAP),b={...member(SHOW_MAP),id:'b',x:p.x+.5},players=new Map([['a',p],['b',b]]);
  for(const action of [{kind:'equip',weapon:'gun'},{kind:'fire',dx:1,dy:0},{kind:'lift',target:'b'}])assert.ok(applyPlayerAction(players,'a',action,1000,emptyWeapons()));
  for(const extra of [{weapon:'gun'},{carrying:'b'},{carriedBy:'b',motion:'carried'},{thrown:true,motion:'airborne'}])assert.equal(validPlayerState({...p,...extra}),false);
});
