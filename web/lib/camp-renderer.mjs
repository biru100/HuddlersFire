import { CampArtwork } from './camp-artwork.mjs';
import { sceneDecorations } from './camp-scene-layout.mjs';
import { defaultSpriteAssets } from './camp-sprite-assets.mjs';
import { playerDisplay,propDisplay } from './camp-scene-contract.mjs';
import { emptyFire, fireStrength, flareAt } from './camp-fire.mjs';
import { isSeated, CAMP_SEATS } from './camp-seats.mjs';
import { visiblePlayers, fireConversation } from './camp-focus.mjs';
import { RADIO, EMOTES, spawnPlayer, canUseRadio } from './camp-world.mjs';
import { layoutBubbles } from './camp-bubbles.mjs';
import { AvatarImages, drawCharacter, characterPose } from './camp-character.mjs';
import { pickPlayer } from './camp-player-info.mjs';
import { CAMP_MAP, PLAY_MAP, getMap, nearbyInteraction } from './camp-maps.mjs';
import {GroundShadows,lightVisibility} from './camp-shadows.mjs';
import {sceneLights,sceneLighting} from './camp-lighting.mjs';
import {projectWorld,sortSceneObjects} from './camp-scene-frame.mjs';
import {createDrawContext} from './camp-draw-context.mjs';
import {GroundLightSprites} from './camp-canvas-renderer.mjs';
import {sceneCamera} from './camp-camera.mjs';
import {PRESENCE_LABELS,presenceSummary} from './camp-presence.mjs';
import {pixelPropDisplay} from './camp-pixel.mjs';

export class CampRenderer extends CampArtwork {
  constructor(canvas, getScene, {assets=defaultSpriteAssets}={}) {
    super();
    this.assets=assets;
    this.canvas = canvas; this.ctx = createDrawContext(canvas.getContext('2d'),{dpr:()=>this.dpr||1}); this.getScene = getScene; this.avatars = new AvatarImages(); this.hitAreas = [];this.exhibitImages=new Map();
    this.groundShadows=new GroundShadows(this.ctx,{assets});this.groundLights=new GroundLightSprites(this.ctx);if(canvas.dataset){canvas.dataset.campInput='';canvas.dataset.campRenderer='canvas';}
    this.win = canvas.ownerDocument?.defaultView || window;
    this.raf = this.win.requestAnimationFrame?.bind(this.win) || requestAnimationFrame;
    this.cancelFrame = this.win.cancelAnimationFrame?.bind(this.win) || cancelAnimationFrame;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer = new ResizeObserver(() => {if(this.resizeFrame)return;this.resizeFrame=this.raf(()=>{this.resizeFrame=null;if(!this.stopped)this.resize();});}); this.observer.observe(canvas); this.resize();
    this.spriteKey='';this.assetIds=[];
    this.unsubscribeSprites=this.assets.subscribeSprites(()=>this.reportAssets());
    this.ensureSprites(this.getScene());
    this.frame = this.raf(t => this.draw(t));
    this.backendReady=this.initBackend();
  }
  async initBackend(){
    if(!this.canvas.ownerDocument||!this.canvas.parentNode||!this.assets.manifest.materials)return;
    try{const {CampWebGLRenderer}=await import('./camp-webgl-renderer.mjs');if(this.stopped)return;this.webgl=new CampWebGLRenderer(this.canvas,{onStatus:(mode,reason='')=>{this.canvas.dataset.campRenderer=mode;this.canvas.dataset.campRenderReason=reason;}});await this.webgl.init();}
    catch(error){this.webgl?.fail(error);if(this.canvas.dataset)this.canvas.dataset.campRenderReason=String(error.message);}
  }
  reportAssets(){if(this.stopped)return;const status=this.assets.spriteStatus(this.assetIds),key=JSON.stringify(status);if(key!==this.assetStatusKey){this.assetStatusKey=key;this.getScene().onAssets?.(status);}}
  ensureSprites(scene){const map=scene.mapId||scene.players?.find(p=>p.id===scene.self)?.mapId||'camp';const key=(scene.theme||'color')+':'+map;if(key===this.spriteKey)return;this.spriteKey=key;this.assetIds=this.assets.sceneSpriteIds(scene.theme,map);this.ready=this.assets.preloadSprites(this.assetIds).then(()=>this.reportAssets());this.reportAssets();}
  retryAssets(){this.ready=this.assets.retrySprites(this.assetIds).then(()=>this.reportAssets());this.reportAssets();return this.ready;}
  displayPlayer(player){
    this.motionDirections??=new Map();let direction=this.motionDirections.get(player.id)||'front-'+(player.facing===-1?'left':'right');
    if(player.moving&&Math.hypot(player.vx||0,player.vy||0)>.02){const sx=player.vx-player.vy,sy=player.vx+player.vy;direction=(sy<-.01?'back':'front')+'-'+(sx<0?'left':'right');this.motionDirections.set(player.id,direction);}
    if(this.motionDirections.size>64){const active=new Set(this.getScene().players?.map(p=>p.id));for(const id of this.motionDirections.keys())if(!active.has(id))this.motionDirections.delete(id);}
    return {...player,visualDirection:direction};
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect(); this.width = rect.width; this.height = rect.height;
    this.dpr = Math.min(this.win.devicePixelRatio || 1, 2);
    const width=Math.round(rect.width*this.dpr),height=Math.round(rect.height*this.dpr);
    if(this.canvas.width!==width)this.canvas.width=width;if(this.canvas.height!==height)this.canvas.height=height;
  }
  polygon(points, fill, stroke) {
    const c = this.ctx; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = .6; c.stroke(); }
  }
  ellipse(x, y, rx, ry, color) { const c = this.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill(); }
  project(x, y) { return projectWorld(x,y); }
  pickPlayer(clientX, clientY, touch = false) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return pickPlayer(this.hitAreas, (clientX - rect.left) * this.width / rect.width, (clientY - rect.top) * this.height / rect.height, touch);
  }
  aimDirection(clientX, clientY, player) {
    if (!player || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
    const targetId = this.pickPlayer(clientX, clientY), target = this.getScene().players?.find(p => p.id === targetId && p.id !== player.id);
    let dx, dy;
    if (target) { dx = target.x - player.x; dy = target.y - player.y; }
    else {
      const rect = this.canvas.getBoundingClientRect(), scale = this.camera?.scale ?? Math.min(this.width / 1110, this.height / 790) * 1.02;
      if (!rect.width || !rect.height || !scale) return null;
      const [x, y] = this.project(player.x, player.y);
      const sx = (clientX - rect.left) * this.width / rect.width - (this.camera?.x ?? this.width * .51) - x * scale;
      const sy = (clientY - rect.top) * this.height / rect.height - (this.camera?.y ?? this.height * .60) - (y - (player.z + .65) * 40) * scale;
      dx = sx / (80 * scale) + sy / (40 * scale); dy = sy / (40 * scale) - sx / (80 * scale);
    }
    const length = Math.hypot(dx, dy);
    return length > .01 ? { dx: dx / length, dy: dy / length } : null;
  }
  pickSeat(clientX,clientY) {
    const rect=this.canvas.getBoundingClientRect(),x=(clientX-rect.left)*this.width/rect.width,y=(clientY-rect.top)*this.height/rect.height;
    return (this.seatAreas||[]).filter(s=>Math.hypot(x-s.x,y-s.y)<s.radius).sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y))[0]?.id||null;
  }
  exhibitImage(url) {
    if(!url)return null;
    let entry=this.exhibitImages.get(url);
    if(!entry){
      const ImageType=this.win.Image||globalThis.Image;if(!ImageType)return null;
      const image=new ImageType();entry={image,failed:false};this.exhibitImages.set(url,entry);
      image.onerror=()=>{entry.failed=true;};
      try{image.src=url;}catch{entry.failed=true;}
    }
    return !entry.failed&&entry.image.complete&&(entry.image.naturalWidth||entry.image.width)>0?entry.image:null;
  }
  player(p, self, time) {
    if (p.motion === 'respawning') return;
    const c = this.ctx;
    const emote = p.emoteUntil > this.sceneTime ? EMOTES.find(e => e.id === p.emote) : null;
    c.setMaterial?.({lighting:'protected'});
    if (p.targeted) { c.strokeStyle = this.ink('#cfcfcf','#b55429'); c.lineWidth = 2; c.beginPath(); c.ellipse(0, 3, 20, 11, 0, 0, Math.PI * 2); c.stroke(); }
    if (self) { c.strokeStyle = this.ink('#cfcfcf55','#b5542980'); c.lineWidth = 1; c.beginPath(); c.ellipse(0, 3, 19, 10, 0, 0, Math.PI * 2); c.stroke(); }
    if (p.selected) { c.strokeStyle = this.ink('#c8c8c8','#386f98'); c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 3, 23, 12, 0, 0, Math.PI * 2); c.stroke(); }
    c.setMaterial?.(null);const display=playerDisplay(p,this.assets);c.translate(display.x,display.y);p=display.player;
    if (p.motion === 'falling') c.globalAlpha *= Math.max(.1, 1 + p.z / 15);
    drawCharacter(c, p, { time, now: this.sceneTime, reduced: this.reduced, emote: emote?.id, avatar: this.avatars.get(p.avatar), theme: this.theme,assets:this.assets });
    c.font = '500 11px "Malgun Gothic", sans-serif'; c.textAlign = 'center';
    const label = (p.name || '허들러') + (self ? ' · 나' : ''), w = c.measureText(label).width + 18;
    const pose = characterPose(p, time, this.reduced, emote?.id, this.sceneTime,this.assets);
    const matrix = c.getTransform(), labelX = p.carriedBy ? (matrix.e / this.dpr + (28 + w) * matrix.a / this.dpr > this.width - 12 ? -28 - w : 28) : -w / 2, labelY = p.carriedBy ? -49 : Math.max(16,(pose.feet.y-pose.origin.y)*pose.scale+8);
    this.nameplates.push({id:p.id,label,x:labelX,y:labelY,width:w,self,matrix,alpha:c.globalAlpha});
    const point = (x, y) => ({ x: (matrix.a * x + matrix.c * y + matrix.e) / this.dpr, y: (matrix.b * x + matrix.d * y + matrix.f) / this.dpr });
    const head = point(pose.headX*pose.mirror+pose.lean * .65, pose.headY + pose.headBob + pose.bob);
    const rect = (x, y, width, height) => ({ ...point(x, y), width: width * matrix.a / this.dpr, height: height * matrix.d / this.dpr });
    this.hitAreas.push({ id: p.id, head: { ...head, radius: pose.radius * matrix.a / this.dpr },
      body: rect(-19, pose.headY + pose.radius + pose.bob, 38, -pose.headY - pose.radius + 6), label: rect(labelX, labelY, w, 22) });
    if (emote) {
      c.font = 'bold 15px "Malgun Gothic", sans-serif'; c.fillStyle = '#d7d7d7'; c.fillText(emote.symbol, 0, -64);
    }
  }
  drawNameplates() {
    const c=this.ctx,occupied=this.hitAreas.flatMap(a=>[{x:a.head.x-a.head.radius,y:a.head.y-a.head.radius,width:a.head.radius*2,height:a.head.radius*2},a.body]),overlap=(a,b)=>a.x<b.x+b.width+2&&a.x+a.width+2>b.x&&a.y<b.y+b.height+2&&a.y+a.height+2>b.y;
    this.nameFontSize=Math.max(12,Math.min(14,11*this.camera.scale));
    for(const plate of [...this.nameplates].sort((a,b)=>Number(b.self)-Number(a.self))){
      const {matrix:m,y,self,label}=plate,s=m.a/this.dpr;
      c.font=`500 ${this.nameFontSize}px "Malgun Gothic",sans-serif`;
      const w=c.measureText(label).width+14,h=this.nameFontSize+8,px=m.e/this.dpr-w/2,py=(m.f+m.d*y)/this.dpr;
      const candidates=[];for(const dy of [0,h+3,-h-3,(h+3)*2,-(h+3)*2,(h+3)*3,-(h+3)*3,(h+3)*4,-(h+3)*4])for(const dx of [0,-w/2,w/2,-w,w])candidates.push({x:px+dx,y:py+dy,width:w,height:h});
      const box=candidates.filter(r=>r.x>=3&&r.y>=3&&r.x+r.width<=this.width-3&&r.y+r.height<=this.height-3&&occupied.every(o=>!overlap(r,o))).sort((a,b)=>Math.hypot(a.x-px,a.y-py)-Math.hypot(b.x-px,b.y-py))[0];
      const area=this.hitAreas.find(a=>a.id===plate.id);if(!box){if(area)area.label={x:-10000,y:-10000,width:0,height:0};continue;}occupied.push(box);if(area)area.label=box;
      c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);c.globalAlpha=plate.alpha;c.font=`500 ${this.nameFontSize}px "Malgun Gothic",sans-serif`;c.textAlign='center';
      const night=this.sceneLighting?.night;
      const dark=this.uiTheme==='dark';
      c.fillStyle=self?(dark?'#dedede':'#e5be82'):dark?'#202020e8':night?'#17281ee8':'#fbf4e0ed';c.beginPath();c.roundRect(box.x,box.y,w,h,5);c.fill();
      c.fillStyle=self?(dark?'#202020':'#352c20'):dark?'#ededed':night?'#ede9dc':'#37442e';c.fillText(label,box.x+w/2,box.y+this.nameFontSize+2);c.restore();
    }
  }
  bubbles(players, scale, music) {
    const c = this.ctx, candidates = [];
    c.font = '12px "Malgun Gothic", sans-serif';
    const speakers = [...players];
    const radioPoint=this.project(RADIO.x,RADIO.y),radioX=this.camera.x+radioPoint[0]*scale,radioY=this.camera.y+radioPoint[1]*scale;
    if (music?.current&&radioX>=0&&radioX<=this.width&&radioY>=0&&radioY<=this.height) speakers.push({ id: '__radio__', x: RADIO.x, y: RADIO.y, z: 0,
      name: music.playing ? '♪ 라디오 · 재생 중' : '♪ 라디오 · 일시정지',
      bubble: `${music.current.title || music.current.videoId} · ${music.current.name}의 신청곡`, bubbleUntil: Number.MAX_SAFE_INTEGER });
    for (const p of speakers) {
      if (!p.bubble || p.bubbleUntil <= this.sceneTime || ['falling', 'respawning'].includes(p.motion)) continue;
      const lines = []; let line = '';
      for (const char of p.bubble) {
        if (c.measureText(line + char).width > 140) {
          lines.push(line); line = '';
          if (lines.length === 3) { lines[2] = lines[2].slice(0, -1) + '…'; break; }
        }
        line += char;
      }
      if (line) lines.push(line);
      const [px, py] = this.project(p.x, p.y);
      candidates.push({ id: p.id, name: p.name || '허들러', lines, until: p.bubbleUntil,
        anchorX: (this.camera?.x ?? this.width * .51) + px * scale,
        anchorY: (this.camera?.y ?? this.height * .60) + (py - (p.z || 0) * 40 - (p.emoteUntil > this.sceneTime ? 82 : 60)) * scale,
        width: 164, height: lines.length * 17 + 34 });
    }
    const recent = candidates.sort((a, b) => b.until - a.until).slice(0, this.width < 600 ? 2 : 4);
    const boxes = layoutBubbles(recent, { left: 12, right: this.width - 12, top: this.height * .32, bottom: this.height - 100 });
    this.bubbleAreas = boxes;
    c.strokeStyle = '#e2e2e299'; c.lineWidth = 1;
    for (const b of boxes) {
      if(b.id==='__radio__')continue;
      c.beginPath(); c.moveTo(b.anchorX, b.anchorY); c.lineTo(b.x + b.width / 2, b.y + b.height); c.stroke();
    }
    c.textAlign = 'left';
    for (const b of boxes) {
      c.fillStyle = '#e2e2e2f5'; c.beginPath(); c.roundRect(b.x, b.y, b.width, b.height, 8); c.fill();
      c.fillStyle = '#5c5c5c'; c.font = 'bold 10px "Malgun Gothic", sans-serif'; c.fillText(b.name, b.x + 12, b.y + 16, 140);
      c.fillStyle = '#373737'; c.font = '12px "Malgun Gothic", sans-serif';
      b.lines.forEach((line, i) => c.fillText(line, b.x + 12, b.y + 32 + i * 17));
    }
  }
  draw(ms) {
    if (this.stopped) return;
    const interval=this.lastFrameMs===undefined?0:ms-this.lastFrameMs;this.lastFrameMs=ms;
    const c = this.ctx, w = this.width, h = this.height, t = ms / 1000;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, w, h);
    const scene=this.getScene(),all=scene.players||[],self=all.find(p=>p.id===scene.self);
    this.ensureSprites(scene);
    this.theme=scene.theme==='dark'?'dark':'color';
    this.uiTheme=scene.uiTheme||this.theme;
    if(this.canvas.dataset){this.canvas.dataset.campFieldTheme=this.theme;this.canvas.dataset.campUiTheme=this.uiTheme;}
    const mapId=scene.mapId||self?.mapId||CAMP_MAP,map=getMap(mapId),playing=mapId===PLAY_MAP,focused=isSeated(self);
    this.mapId=mapId;this.pixelMode=scene.pixelMode||(this.assets.manifest.pixelQuarterview&&new URLSearchParams(this.win.location?.search).get('pixel')==='1'?'candidates':'off');
    if(this.canvas.dataset)this.canvas.dataset.campPixelMode=this.assets.manifest.pixelQuarterview?this.pixelMode:'off';
    this.sceneLighting=sceneLighting(mapId,this.theme);c.setLighting?.(null);c.setObject?.(null);c.setMaterial?.(null);
    const lightingMode=this.sceneLighting.night?'night':'day';if(this.canvas.dataset&&this.canvas.dataset.campLighting!==lightingMode)this.canvas.dataset.campLighting=lightingMode;
    const players=(all.length?visiblePlayers(all,self||{id:'',mapId},scene.hiddenIds||[]):[{id:'preview',name:scene.name||'허들러',color:scene.color,...spawnPlayer(),avatar:scene.avatar,sitting:true}]).map(p=>this.displayPlayer(p));
    const recording=this.webgl?.status==='ready'&&this.ctx.recording;if(recording)this.ctx.recording.begin();
    this.background(w,h);
    this.focusMix=this.reduced?Number(focused):(this.focusMix||0)+(Number(focused)-(this.focusMix||0))*.12;
    this.camera=sceneCamera({width:w,height:h,players,self,follow:!!scene.followSelf,mode:scene.cameraMode,freeView:scene.freeView,zoom:scene.zoom||1,edge:map.bounds.edge,occlusions:scene.occlusions});
    const {scale,x:originX,y:originY}=this.camera;
    this.sceneTime=scene.now??performance.now();this.fireLevel=fireStrength(scene.fire||emptyFire(),this.sceneTime);this.fireFlare=flareAt(scene.fire||emptyFire(),this.sceneTime);this.fireAppearance=scene.fire?.style||'amber';
    const lights=sceneLights({...scene,now:this.sceneTime,selfPosition:self,viewport:{width:w,height:h}},map,this.camera,this.reduced,this.lightSources);
    this.lights=this.webgl?.quality.level===0?lights.slice(0,1):lights;
    const visibility=new WeakMap();c.setLighting?.({profile:this.sceneLighting,camera:this.camera,lights:this.lights,visibility:object=>{if(!object)return [];let row=visibility.get(object);if(!row){row=this.lights.map(light=>lightVisibility(object,light,this.shadowCasters||[]));visibility.set(object,row);}return row;}});
    this.seatAreas=map.fire?CAMP_SEATS.map(s=>{const [x,y]=this.project(s.x,s.y);return{id:s.id,x:originX+x*scale,y:originY+(y-8)*scale,radius:18*scale};}):[];
    c.save(); c.translate(originX, originY); c.scale(scale, scale);
    this.ground(map.bounds.edge,mapId);
    this.hitAreas = [];this.nameplates=[];
    this.sceneTime = scene.now ?? performance.now();
    const near=nearbyInteraction(self);
    const objects = sortSceneObjects([...sceneDecorations(mapId),...map.scenery.map(o => ({ ...o })), ...map.portals.map(o=>({...o,available:near?.id===o.id})),...map.booths.map(o=>({...o,available:near?.id===o.id})),...map.trampolines, ...(playing && scene.ball ? [{ ...scene.ball, type: 'football' }] : []),
      ...(map.radio ? [{ ...map.radio, available: canUseRadio(players.find(p => p.id === scene.self)) }] : []), ...(map.fire ? [{ type: 'fire', x: 0, y: 0 }] : []),
      ...players.map(p => ({ ...p, type: 'player', targeted: p.id === scene.targetId, selected: p.id === scene.selectedId })),
      ...(playing ? scene.weapons?.projectiles || [] : []).filter(p => p.expiresAt > this.sceneTime).map(p => {
        const age = this.reduced ? 0 : Math.max(0, Math.min(.1, (this.sceneTime - (scene.weapons.at ?? this.sceneTime)) / 1000));
        return { ...p, x: p.x + p.vx * age, y: p.y + p.vy * age, z: Math.max(0, p.z + p.vz * age - (p.weapon === 'gun' ? 0 : 4 * age * age)), type: 'projectile' };
      }), ...(playing ? scene.weapons?.effects || [] : []).map(e => ({ ...e, type: 'weaponEffect' }))]
      ,this.assets);
    this.groundShadows.pixelMode=this.pixelMode;this.groundShadows.mapId=mapId;
    this.shadowCasters=objects;this.groundShadows.draw(objects,this.lights,{map:mapId,edge:map.bounds.edge,theme:this.theme,time:t,now:this.sceneTime,reduced:this.reduced});
    for (const item of objects) {
      const [px, py] = this.project(item.x, item.y);
      const screenX=originX+px*scale,screenY=originY+(py-(item.z||0)*40)*scale;
      if(screenX< -220*scale||screenX>w+220*scale||screenY< -80*scale||screenY>h+240*scale)continue;
      c.save(); c.translate(px, py);c.setObject?.(item);
      if(['tree','tent'].includes(item.type)){
        const d=pixelPropDisplay(this.assets,item,mapId,this.pixelMode)||propDisplay(item,this.assets),height=d?d.width*d.frame.h/d.frame.w:125,anchor=d?.frame.contacts?.ground?.x/d?.frame.w||.5;
        if(players.some(p=>{const [x,y]=this.project(p.x,p.y),head=y-(p.z||0)*40-45;return x>px-(d?.width||130)*anchor&&x<px+(d?.width||130)*(1-anchor)&&y<py+8&&head>py-height;}))c.globalAlpha=.4;
      }
      if (item.type === 'player') this.player(item, item.id === scene.self, t);
      else if (item.type === 'fire') this.fire(t);
      else this[item.type]?.(item, t);
      c.restore();
    }
    c.globalAlpha = 1; c.restore();
    if(recording){const commands=c.recording.end();try{this.webgl.render(commands,{width:w,height:h,dpr:this.dpr,lights:this.lights,lighting:this.sceneLighting,camera:this.camera,now:this.sceneTime,frameMs:interval>0&&interval<200?interval:0,casters:objects});const count=String(this.webgl.metrics.normalDraws);if(this.canvas.dataset.campNormalDraws!==count)this.canvas.dataset.campNormalDraws=count;}catch(error){this.webgl.fail(error);this.draw(ms);return;}}
    c.setLighting?.(null);c.setObject?.(null);c.setMaterial?.(null);
    this.drawNameplates();
    if(focused){this.bubbleAreas=[];this.fireChats(fireConversation(scene.chat||[],this.sceneTime,scene.hiddenIds||[]),scale,scene.occlusions||[]);}
    else this.bubbles(players, scale, map.radio ? scene.music : null);
    this.presenceLabels(players, scene);
    this.frame = this.raf(next => this.draw(next));
  }
  fireChats(entries,scale,occlusions=[]) {
    const c=this.ctx,mobile=this.width<600,occupied=[...occlusions],recent=mobile?entries.slice(-1):entries;
    const overlaps=(a,b)=>a.x<b.x+b.width+2&&a.x+a.width+2>b.x&&a.y<b.y+b.height+2&&a.y+a.height+2>b.y;
    c.font='12px "Malgun Gothic",sans-serif';c.textAlign='left';
    for(const e of [...recent].reverse()){
      let chosen;
      for(const width of (mobile?[220,196,160,130]:[300]).filter(w=>w<=this.width-28)){
        const lines=[];let line='';const limit=mobile?1:2;
        for(const ch of e.name+' · '+e.text){
          if(c.measureText(line+ch).width>width-26){lines.push(line);line='';if(lines.length===limit){lines[limit-1]=lines[limit-1].slice(0,-1)+'…';break;}}
          line+=ch;
        }
        if(line&&lines.length<limit)lines.push(line);
        const height=lines.length*17+22,px=Math.max(14,Math.min(this.width-width-14,this.camera.x-width/2)),py=Math.max(90,this.camera.y-105*scale-height);
        const xs=[px,14,this.width-width-14,...occupied.flatMap(r=>[r.x-width-6,r.x+r.width+6])];
        const ys=[py,...Array.from({length:Math.max(1,Math.floor((this.height-180)/8))},(_,i)=>90+i*8)];
        const choices=xs.flatMap(x=>ys.map(y=>({x,y,width,height}))).filter(r=>r.x>=14&&r.x+r.width<=this.width-14&&r.y>=90&&r.y+r.height<=Math.min(this.height-90,this.camera.y-65*scale)&&occupied.every(o=>!overlaps(r,o)));
        choices.sort((a,b)=>Math.hypot(a.x-px,a.y-py)-Math.hypot(b.x-px,b.y-py));
        if(choices.length){chosen={...choices[0],lines};break;}
      }
      if(!chosen)continue;
      const {x,y,width,height,lines}=chosen;c.fillStyle='#262626ed';c.beginPath();c.roundRect(x,y,width,height,9);c.fill();c.fillStyle='#e0e0e0';
      lines.forEach((line,i)=>c.fillText(line,x+12,y+23+i*17));this.bubbleAreas.push({x,y,width,height});occupied.push(chosen);
    }
  }
  presenceLabels(players, scene) {
    const c = this.ctx;
    this.presenceAreas = [];
    c.font = '12px "Malgun Gothic", sans-serif'; c.textAlign = 'left';
    const occupied = this.hitAreas.flatMap(a => [a.body, a.label,
      {x:a.head.x-a.head.radius,y:a.head.y-a.head.radius,width:a.head.radius*2,height:a.head.radius*2}]);
    occupied.push(...(this.bubbleAreas || []));
    const overlaps = (a,b) => a.x < b.x+b.width+2 && a.x+a.width+2 > b.x && a.y < b.y+b.height+2 && a.y+a.height+2 > b.y;
    const priority = p => p.id===scene.selectedId ? 2 : p.id===scene.self ? 1 : 0;
    const sorted = [...players].sort((a,b) => priority(b)-priority(a) || a.id.localeCompare(b.id));
    for (const p of sorted) {
      const area = this.hitAreas.find(a => a.id === p.id);
      if (!PRESENCE_LABELS[p.presence] || !area || (p.presence==='available'&&!p.statusText?.trim()&&p.id!==scene.selectedId) || ['falling','respawning'].includes(p.motion)) continue;
      let text=presenceSummary(p);const maxWidth=Math.min(220,this.width-20);
      if(c.measureText(text).width>maxWidth-12){const chars=Array.from(text);while(chars.length>1&&c.measureText(chars.join('')+'…').width>maxWidth-12)chars.pop();text=chars.join('')+'…';}
      const color='#e5e5e5',width = c.measureText(text).width+12, height = 22;
      const y=area.head.y-area.head.radius-height-5;
      const box=[0,-width*.55,width*.55].map(offset=>({x:area.head.x-width/2+offset,y,width,height})).find(b=>
        b.x>=8 && b.x+b.width<=this.width-8 && b.y>=40 && b.y+b.height<=this.height-56 && occupied.every(other => !overlaps(b,other)));
      // Extra status yields to bodies, names and speech. Full notes remain in player details.
      if (!box) continue;
      area.badge = box;
      this.presenceAreas.push({...box,id:p.id,text});occupied.push(box);
      c.fillStyle = '#232323ed';c.beginPath();c.roundRect(box.x,box.y,width,height,5);c.fill();
      c.fillStyle = color;c.fillText(text,box.x+6,box.y+15);
    }
  }
  destroy() { this.stopped = true; this.unsubscribeSprites?.();this.groundCache=null;this.ctx.clearLighting?.();this.groundShadows.destroy();this.groundLights.destroy();this.webgl?.destroy();this.cancelFrame(this.frame);if(this.resizeFrame)this.cancelFrame(this.resizeFrame);this.observer.disconnect(); this.avatars.dispose();for(const {image}of this.exhibitImages.values())image.onload=image.onerror=null;this.exhibitImages.clear(); }
}

export { CampAudio } from './camp-audio.mjs';
