import { emptyFire, fireStrength, flareAt, fireStyle, FIRE_STYLES } from './camp-fire.mjs';
import { isSeated, CAMP_SEATS } from './camp-seats.mjs';
import { visiblePlayers, fireConversation } from './camp-focus.mjs';
import { RADIO, EMOTES, spawnPlayer, canUseRadio } from './camp-world.mjs';
import { layoutBubbles } from './camp-bubbles.mjs';
import { AvatarImages, drawCharacter, characterPose } from './camp-character.mjs';
import { pickPlayer } from './camp-player-info.mjs';
import { WEAPONS } from './camp-weapons.mjs';
import { CAMP_MAP, PLAY_MAP, getMap } from './camp-maps.mjs';

const presenceBadges = { available: ['대화', '#a4c5b3'], working: ['작업', '#e0c28f'], away: ['비움', '#c5b6db'] };

const seed = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export class CampRenderer {
  constructor(canvas, getScene) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.getScene = getScene; this.avatars = new AvatarImages(); this.hitAreas = [];
    this.win = canvas.ownerDocument?.defaultView || window;
    this.raf = this.win.requestAnimationFrame?.bind(this.win) || requestAnimationFrame;
    this.cancelFrame = this.win.cancelAnimationFrame?.bind(this.win) || cancelAnimationFrame;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
    this.frame = this.raf(t => this.draw(t));
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect(); this.width = rect.width; this.height = rect.height;
    this.dpr = Math.min(this.win.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * this.dpr); this.canvas.height = Math.round(rect.height * this.dpr);
  }
  polygon(points, fill, stroke) {
    const c = this.ctx; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = .6; c.stroke(); }
  }
  ellipse(x, y, rx, ry, color) { const c = this.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill(); }
  project(x, y) { return [(x - y) * 40, (x + y) * 20]; }
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
  glow(x, y, radius, color) {
    const c = this.ctx, gradient = c.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color); gradient.addColorStop(1, 'transparent');
    c.fillStyle = gradient; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  tree(item) {
    const c = this.ctx, s = item.scale || 1;
    this.ellipse(8, 1, 34 * s, 12 * s, '#09150e66');
    c.fillStyle = '#483f2d'; c.fillRect(-5 * s, -48 * s, 10 * s, 48 * s);
    for (let i = 0; i < 4; i++) {
      const y = -24 * s - i * 26 * s, width = (42 - i * 6) * s;
      this.polygon([[-width, y], [0, y - 67 * s], [width, y], [0, y + 11 * s]], ['#213d30', '#294637', '#304c39', '#3c5640'][i]);
      this.polygon([[0, y - 67 * s], [width, y], [0, y + 11 * s]], '#0d241f55');
      this.polygon([[-width, y], [-4 * s, y - 57 * s], [-10 * s, y - 8 * s]], '#8195640e');
    }
  }
  tent() {
    this.ellipse(0, 0, 75, 26, '#0c170c55');
    this.polygon([[-65, -9], [-6, -76], [62, -42], [5, 27]], '#aa6a42');
    this.polygon([[5, 27], [62, -42], [88, 0]], '#d19459');
    this.polygon([[15, 22], [61, -32], [76, -1]], '#312c26');
    this.polygon([[16, 22], [61, -32], [48, 9]], '#181f1a');
    this.polygon([[-65, -9], [-6, -76], [-10, -66], [-56, -8]], '#d39860');
    const c = this.ctx; c.strokeStyle = '#d8be8b88'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-6, -76); c.lineTo(-90, 15); c.moveTo(62, -42); c.lineTo(104, 19); c.stroke();
    c.fillStyle = '#8c7c55'; c.fillRect(-92, 10, 3, 10); c.fillRect(103, 15, 3, 10);
  }
  log() {
    const c = this.ctx; this.ellipse(0, 5, 37, 15, '#101a1055');
    this.polygon([[-34, -9], [-12, -20], [38, 6], [15, 18]], '#6e5135');
    this.polygon([[-34, -9], [15, 18], [15, 28], [-34, 2]], '#3d3628');
    this.ellipse(27, 16, 13, 12, '#ac8051'); this.ellipse(27, 16, 9, 8, '#725635');
    this.ellipse(27, 16, 6, 5, '#ae8353');
    c.strokeStyle = '#aa85534d'; c.beginPath(); c.moveTo(-24, -8); c.lineTo(14, 13); c.moveTo(-18, -13); c.lineTo(20, 8); c.stroke();
  }
  lantern(t) {
    const c = this.ctx; this.glow(0, -38, 70, '#ffbc5329');
    c.fillStyle = '#55503a'; c.fillRect(-3, -67, 6, 68);
    c.strokeStyle = '#55503a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -65); c.lineTo(17, -65); c.lineTo(17, -53); c.stroke();
    c.fillStyle = '#313e31'; c.fillRect(9, -53, 17, 25); c.fillStyle = '#efbf71'; c.fillRect(12, -50, 11, 18);
    this.glow(17, -42, 22, '#ffd37355');
  }
  sign() {
    const c = this.ctx; c.fillStyle = '#6d5940'; c.fillRect(-3, -45, 6, 45);
    this.polygon([[-32, -53], [26, -53], [34, -42], [26, -31], [-32, -31]], '#a08758');
    c.fillStyle = '#31352b'; c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.fillText('HUDDLERS', -1, -39);
  }
  bench(item) {
    const [tx,ty]=this.project(-Math.sin(item.angle),Math.cos(item.angle));
    this.ctx.rotate(Math.atan2(ty,tx));this.ctx.scale(1.15,.65);this.log();
  }
  fence() {
    const c=this.ctx;c.strokeStyle='#e8ddbd';c.lineWidth=4;c.beginPath();c.moveTo(-35,-25);c.lineTo(35,10);c.moveTo(-35,-37);c.lineTo(35,-2);c.stroke();
    for(const x of [-35,0,35]){const y=x*.5;c.fillStyle='#f5e9c9';c.fillRect(x-3,y-45,6,45);}
  }
  shade() {
    const c=this.ctx;this.ellipse(0,5,48,22,'#243c2444');c.fillStyle='#c5ad7b';c.fillRect(-37,-65,4,65);c.fillRect(33,-30,4,42);
    this.polygon([[-50,-70],[-3,-94],[49,-45],[0,-21]],'#82c2ce');this.polygon([[-50,-70],[0,-21],[0,-11],[-50,-60]],'#438fa3');
  }
  crate() {
    const c=this.ctx;this.polygon([[-18,-19],[4,-30],[24,-15],[1,-4]],'#e2b16b');this.polygon([[-18,-19],[1,-4],[1,14],[-18,0]],'#bc864c');this.polygon([[1,-4],[24,-15],[24,4],[1,14]],'#cf9b57');
    c.strokeStyle='#866c4b';c.lineWidth=2;c.beginPath();c.moveTo(-15,-15);c.lineTo(-3,8);c.stroke();
  }
  pickSeat(clientX,clientY) {
    const rect=this.canvas.getBoundingClientRect(),x=(clientX-rect.left)*this.width/rect.width,y=(clientY-rect.top)*this.height/rect.height;
    return (this.seatAreas||[]).filter(s=>Math.hypot(x-s.x,y-s.y)<s.radius).sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y))[0]?.id||null;
  }
  fire(time) {
    const c = this.ctx, t = this.reduced ? 1 : time;
    const style=fireStyle(this.fireAppearance)||FIRE_STYLES[0];
    const strength=this.fireLevel??.6,flare=this.fireFlare||0;c.save();
    this.glow(0, -15, 95+strength*90+flare*35 + Math.sin(t * 5) * 5, style.glow);
    this.ellipse(0, 2, 42, 23, '#403d2b'); this.ellipse(0, 0, 31, 17, '#252a20');
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, x = Math.cos(a) * 37, y = Math.sin(a) * 20;
      this.ellipse(x, y, 9, 6, i < 6 ? '#797963' : '#575c4b');
      this.ellipse(x - 1, y - 2, 7, 3, '#a5a18433');
    }
    this.polygon([[-23, -6], [20, 10], [24, 4], [-17, -13]], '#765135');
    this.polygon([[20, -11], [-21, 8], [-17, 13], [24, -5]], '#977049');
    c.save();c.scale((.5+strength*.5+flare*.25)*style.width,(.25+strength*.75+flare*.55)*style.height);
    for (let i = 0; i < 5; i++) {
      const wobble = Math.sin(t * 5 + i * 2) * 7, x = (i - 2) * 7, h = 34 + seed(i) * 25;
      c.beginPath(); c.moveTo(x - 13, -6); c.bezierCurveTo(x - 25, -20, x + 15 + wobble, -h + 8, x + wobble, -h - 8);
      c.bezierCurveTo(x + 30, -25, x + 16, -5, x + 9, -4); c.closePath();
      c.fillStyle = style.colors[i]; c.fill();
    }
    this.ellipse(0, -13, 12, 16, style.core);
    if (!this.reduced) for (let i = 0; i < 12; i++) {
      const life = (t * .23 + seed(i + 62)) % 1;
      c.globalAlpha = (1 - life) * .7; c.fillStyle = style.spark;
      const x=Math.sin(life * 9 + i) * (8 + life * 22),y=-30-life*100;
      c.fillRect(x,y,2,style.id==='violet'?6:3);
      if(style.id==='violet')c.fillRect(x-2,y+2,6,2);
    }
    c.globalAlpha = 1;c.restore();c.restore();
  }
  trampoline() {
    const c = this.ctx;
    for (const x of [-23, 23]) { c.strokeStyle = '#a7b9a2'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, -2); c.lineTo(x, 13); c.stroke(); }
    this.ellipse(0, 0, 31, 17, '#819d88'); this.ellipse(0, -2, 26, 13, '#263e38');
    c.strokeStyle = '#dab77e'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -2, 29, 15, 0, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#c4d1a7'; c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillText('↑', 0, 3);
    c.font = '10px "Malgun Gothic", sans-serif'; c.fillStyle = '#b0bda1'; c.fillText('트램펄린', 0, 29);
  }
  radio(item) {
    const c = this.ctx;
    this.ellipse(0, 6, 29, 12, '#06170b66');
    if (item.available) {
      c.strokeStyle = '#e7cf8e'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 5, 34, 17, 0, 0, Math.PI * 2); c.stroke();
    }
    c.strokeStyle = '#aebaa1'; c.lineWidth = 2; c.beginPath(); c.moveTo(12, -33); c.lineTo(23, -62); c.stroke();
    c.strokeStyle = '#ba9567'; c.lineWidth = 4; c.beginPath(); c.roundRect(-12, -43, 24, 15, 5); c.stroke();
    c.fillStyle = '#a77348'; c.beginPath(); c.roundRect(-27, -34, 54, 36, 6); c.fill();
    this.ellipse(-10, -16, 12, 12, '#243b32');
    c.strokeStyle = '#708776'; c.lineWidth = 1;
    for (let y = -23; y <= -9; y += 4) { c.beginPath(); c.moveTo(-18, y); c.lineTo(-2, y); c.stroke(); }
    c.fillStyle = '#263e32'; c.fillRect(7, -27, 14, 8); c.fillStyle = '#e3c982'; c.fillRect(9, -25, 9, 3);
    this.ellipse(13, -9, 5, 5, '#e1c192');
    c.textAlign = 'center'; c.font = '11px "Malgun Gothic", sans-serif'; c.fillStyle = '#e1c192'; c.fillText('라디오', 0, 26);
  }
  projectile(shot) {
    const c = this.ctx, weapon = WEAPONS.find(w => w.id === shot.weapon);
    if (!weapon) return;
    this.ellipse(0, 2, shot.weapon === 'bomb' ? 8 : 4, 3, '#09150d44');
    if (shot.weapon === 'bomb') {
      const fuse = Math.max(0, Math.min(1, (this.sceneTime - shot.bornAt) / (shot.expiresAt - shot.bornAt)));
      c.beginPath(); c.ellipse(0, 0, weapon.blast * 40, weapon.blast * 20, 0, 0, Math.PI * 2);
      c.fillStyle = '#e7a9690b'; c.fill(); c.strokeStyle = `rgba(236,180,110,${.18 + fuse * .45})`; c.lineWidth = 1.2; c.stroke();
    }
    c.translate(0, -shot.z * 40);
    if (shot.weapon === 'gun') {
      const [vx, vy] = this.project(shot.vx * .025, shot.vy * .025);
      c.lineCap = 'round'; c.strokeStyle = '#fff0aa'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-vx, -vy); c.lineTo(0, 0); c.stroke(); this.ellipse(0, 0, 2.4, 2.4, '#fff5cf');
    } else if (shot.weapon === 'snowball') {
      this.ellipse(0, 0, 5, 4.5, '#d9e7eb'); this.ellipse(-1, -1, 3.4, 2.5, '#fffaf0');
    } else {
      this.ellipse(0, 0, 7, 7, '#343f3b'); this.ellipse(-2, -2, 3, 3, '#819080');
      c.strokeStyle = '#c6b786'; c.lineWidth = 2; c.beginPath(); c.moveTo(2, -6); c.quadraticCurveTo(8, -11, 6, -14); c.stroke();
      this.ellipse(6, -14, 2.4, 2.4, '#f3b35d');
    }
  }
  weaponEffect(effect) {
    const c = this.ctx, progress = Math.max(0, Math.min(1, (this.sceneTime - effect.at) / (effect.expiresAt - effect.at)));
    if (progress >= 1) return;
    c.translate(0, -effect.z * 40); c.globalAlpha *= 1 - progress;
    const explosion = effect.kind === 'explosion', radius = explosion ? effect.radius * 40 : 14;
    const spread = this.reduced ? .7 : .25 + progress * .75;
    c.beginPath(); c.ellipse(0, 0, radius * spread, radius * spread * .5, 0, 0, Math.PI * 2);
    c.lineWidth = explosion ? 3 : 1.5; c.strokeStyle = effect.kind === 'snow' ? '#e6f2ed' : '#efc088'; c.stroke();
    if (!this.reduced) for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4, x = Math.cos(angle) * radius * spread, y = Math.sin(angle) * radius * spread * .5;
      this.ellipse(x, y - Math.sin(progress * Math.PI) * 8, explosion ? 8 : 2.5, explosion ? 5 : 2.5, effect.kind === 'snow' ? '#edf4ed' : '#e5b77f99');
    }
  }
  player(p, self, time) {
    if (p.motion === 'respawning') return;
    const c = this.ctx;
    const emote = p.emoteUntil > this.sceneTime ? EMOTES.find(e => e.id === p.emote) : null;
    if (p.motion !== 'falling' && !p.carriedBy) this.ellipse(0, 3, Math.max(5, 14 - p.z * 2), Math.max(3, 7 - p.z), '#06170b66');
    if (p.targeted) { c.strokeStyle = '#e7cf8e'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 3, 20, 11, 0, 0, Math.PI * 2); c.stroke(); }
    if (self) { c.strokeStyle = '#f3cb8655'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 3, 19, 10, 0, 0, Math.PI * 2); c.stroke(); }
    if (p.selected) { c.strokeStyle = '#a8d3bd'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 3, 23, 12, 0, 0, Math.PI * 2); c.stroke(); }
    c.translate(0, -(p.z || 0) * 40);
    if (p.motion === 'falling') c.globalAlpha *= Math.max(.1, 1 + p.z / 15);
    drawCharacter(c, p, { time, now: this.sceneTime, reduced: this.reduced, emote: emote?.id, avatar: this.avatars.get(p.avatar) });
    c.font = '500 11px "Malgun Gothic", sans-serif'; c.textAlign = 'center';
    const label = (p.name || '허들러') + (self ? ' · 나' : ''), w = c.measureText(label).width + 18;
    const matrix = c.getTransform(), labelX = p.carriedBy ? (matrix.e / this.dpr + (28 + w) * matrix.a / this.dpr > this.width - 12 ? -28 - w : 28) : -w / 2, labelY = p.carriedBy ? -49 : 16;
    this.nameplates.push({label,x:labelX,y:labelY,width:w,self,matrix,alpha:c.globalAlpha});
    const pose = characterPose(p, time, this.reduced, emote?.id, this.sceneTime);
    const point = (x, y) => ({ x: (matrix.a * x + matrix.c * y + matrix.e) / this.dpr, y: (matrix.b * x + matrix.d * y + matrix.f) / this.dpr });
    const head = point(pose.lean * .65, pose.headY + pose.headBob + pose.bob);
    const rect = (x, y, width, height) => ({ ...point(x, y), width: width * matrix.a / this.dpr, height: height * matrix.d / this.dpr });
    this.hitAreas.push({ id: p.id, head: { ...head, radius: pose.radius * matrix.a / this.dpr },
      body: rect(-19, pose.headY + pose.radius + pose.bob, 38, -pose.headY - pose.radius + 6), label: rect(labelX, labelY, w, 22) });
    if (emote) {
      c.font = 'bold 15px "Malgun Gothic", sans-serif'; c.fillStyle = '#f1d5a1'; c.fillText(emote.symbol, 0, -64);
    }
  }
  drawNameplates() {
    const c=this.ctx;
    for(const plate of this.nameplates){
      const {matrix:m,x,y,width,self,label}=plate;
      c.save();c.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);c.globalAlpha=plate.alpha;
      c.font='500 11px "Malgun Gothic", sans-serif';c.textAlign='center';
      c.fillStyle=self?'#d9b779e8':'#18251fe6';c.beginPath();c.roundRect(x,y,width,22,6);c.fill();
      c.fillStyle=self?'#263027':'#ced6c5';c.fillText(label,x+width/2,y+15);c.restore();
    }
  }
  bubbles(players, scale, music) {
    const c = this.ctx, candidates = [];
    c.font = '12px "Malgun Gothic", sans-serif';
    const speakers = [...players];
    if (music?.current) speakers.push({ id: '__radio__', x: RADIO.x, y: RADIO.y, z: 0,
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
    c.strokeStyle = '#e8e2cc99'; c.lineWidth = 1;
    for (const b of boxes) {
      c.beginPath(); c.moveTo(b.anchorX, b.anchorY); c.lineTo(b.x + b.width / 2, b.y + b.height); c.stroke();
    }
    c.textAlign = 'left';
    for (const b of boxes) {
      c.fillStyle = '#e8e2ccf5'; c.beginPath(); c.roundRect(b.x, b.y, b.width, b.height, 8); c.fill();
      c.fillStyle = '#4e6248'; c.font = 'bold 10px "Malgun Gothic", sans-serif'; c.fillText(b.name, b.x + 12, b.y + 16, 140);
      c.fillStyle = '#283c30'; c.font = '12px "Malgun Gothic", sans-serif';
      b.lines.forEach((line, i) => c.fillText(line, b.x + 12, b.y + 32 + i * 17));
    }
  }
  draw(ms) {
    if (this.stopped) return;
    const c = this.ctx, w = this.width, h = this.height, t = ms / 1000;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, w, h);
    const scene=this.getScene(),all=scene.players||[],self=all.find(p=>p.id===scene.self);
    const mapId=scene.mapId||self?.mapId||CAMP_MAP,map=getMap(mapId),playing=mapId===PLAY_MAP,focused=isSeated(self);
    const players=all.length?visiblePlayers(all,self||{id:'',mapId},scene.hiddenIds||[]):[{id:'preview',name:scene.name||'허들러',color:scene.color,...spawnPlayer(),sitting:true}];
    const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,playing?'#a4dbe9':'#14231f');bg.addColorStop(.7,playing?'#dbedcd':'#1c2a23');bg.addColorStop(1,playing?'#7eaa75':'#15201b');
    c.fillStyle=bg;c.fillRect(0,0,w,h);
    if(playing){
      this.ellipse(w*.82,h*.17,53,53,'#fff3b722');this.ellipse(w*.82,h*.17,38,38,'#fff3b733');this.ellipse(w*.82,h*.17,27,27,'#fff3b9');
      for(let i=0;i<4;i++){const x=w*(.13+i*.23),y=h*(.1+(i%2)*.08);this.ellipse(x,y,45,12,'#ffffff77');this.ellipse(x-14,y-8,23,16,'#ffffff88');}
    }else{
      for(let i=0;i<65;i++){c.globalAlpha=.08+seed(i+90)*.25;c.fillStyle='#e2deba';c.fillRect(seed(i+3)*w,seed(i+11)*h*.58,i%5===0?2:1,i%5===0?2:1);}
      c.globalAlpha=1;this.glow(w*.83,h*.15,100,'#b2b5980c');this.ellipse(w*.83,h*.15,20,20,'#b9bd9677');this.ellipse(w*.83+9,h*.15-6,19,19,'#14231f');
    }
    let scale = Math.min(w / 1110, h / 790) * 1.02, originY = h * .60;
    const top = Math.min(0, ...players.filter(p => p.motion !== 'respawning').map(p => (p.x + p.y) * 20 - Math.max(0, p.z || 0) * 40 - 68));
    if (originY + top * scale < h * .28) {
      scale = Math.min(scale, (h * .72 - 76) / (264 - top)); originY = h * .28 - top * scale;
    }
    scale *= Math.max(.75, Math.min(3, scene.zoom || 1));
    let originX = w * .51;
    const followed = scene.followSelf && players.find(p => p.id === scene.self);
    if (followed) { const [fx,fy] = this.project(followed.x,followed.y); originX=w*.5-fx*scale;originY=h*.58-(fy-(followed.z||0)*40)*scale; }
    this.focusMix=this.reduced?Number(focused):(this.focusMix||0)+(Number(focused)-(this.focusMix||0))*.12;
    const mobileMusic=w<600&&(scene.occlusions||[]).find(r=>r.kind==='music'&&r.x>w*.25&&r.x<w&&r.y<h);
    scale*=1+this.focusMix*(mobileMusic ? .45 : 1.1);
    const focusX=mobileMusic?Math.max(75,mobileMusic.x-50):w*.5,focusY=h*(mobileMusic ? .7 : .66);
    originX+=(focusX-originX)*this.focusMix;originY+=(focusY-originY)*this.focusMix;
    this.camera = { scale, x: originX, y: originY };
    this.sceneTime=scene.now??performance.now();this.fireLevel=fireStrength(scene.fire||emptyFire(),this.sceneTime);this.fireFlare=flareAt(scene.fire||emptyFire(),this.sceneTime);this.fireAppearance=scene.fire?.style||'amber';
    this.seatAreas=playing?[]:CAMP_SEATS.map(s=>{const [x,y]=this.project(s.x,s.y);return{id:s.id,x:originX+x*scale,y:originY+(y-8)*scale,radius:18*scale};});
    c.save(); c.translate(originX, originY); c.scale(scale, scale);
    this.ellipse(0, 110, 370, 150, '#0c15144d');
    this.polygon([[-480, 0], [0, 240], [0, 264], [-480, 24]], '#2b3023');
    this.polygon([[0, 240], [480, 0], [480, 24], [0, 264]], '#232c22');
    for (let x = -6; x < 6; x++) for (let y = -6; y < 6; y++) {
      const [px, py] = this.project(x, y), n = seed(x * 21 + y + 370), center = Math.hypot(x + .5, y + .5) < 2.8;
      const color = center ? (playing ? ['#d6c494', '#dccc9e', '#ceb989'] : ['#5d6243', '#626546', '#596044'])[Math.floor(n * 3)] : (playing?['#7da968','#86ae70','#8bb575','#77a563']:['#384b36', '#3c5038', '#405239', '#3b4e37'])[Math.floor(n * 4)];
      this.polygon([[px, py], [px + 40, py + 20], [px, py + 40], [px - 40, py + 20]], color);
      if (!center && n > .4) {
        c.strokeStyle = '#73805a66'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(px + 4, py + 24); c.lineTo(px + 2, py + 19); c.moveTo(px + 4, py + 24); c.lineTo(px + 8, py + 20); c.stroke();
      }
      if (n < .13) { this.ellipse(px + 10, py + 16, 3, 2, '#89916d66'); }
    }
    // Pebbles and small yellow flowers are deterministic: the world never shimmers.
    for (let i = 0; i < 70; i++) {
      const x = seed(i + 400) * 11 - 5.5, y = seed(i + 620) * 11 - 5.5;
      if (Math.hypot(x, y) < 3) continue;
      const [px, py] = this.project(x, y); this.ellipse(px, py, i % 3 ? 2 : 4, 2, i % 4 ? '#8c92624d' : '#ddc47788');
    }
    this.hitAreas = [];this.nameplates=[];
    this.sceneTime = scene.now ?? performance.now();
    const objects = [...map.scenery.map(o => ({ ...o })), ...map.trampolines, ...(playing && scene.ball ? [{ ...scene.ball, type: 'football' }] : []),
      ...(map.radio ? [{ ...map.radio, available: canUseRadio(players.find(p => p.id === scene.self)) }] : []), ...(map.fire ? [{ type: 'fire', x: 0, y: 0 }] : []),
      ...players.map(p => ({ ...p, type: 'player', targeted: p.id === scene.targetId, selected: p.id === scene.selectedId })),
      ...(playing ? scene.weapons?.projectiles || [] : []).filter(p => p.expiresAt > this.sceneTime).map(p => {
        const age = this.reduced ? 0 : Math.max(0, Math.min(.1, (this.sceneTime - (scene.weapons.at ?? this.sceneTime)) / 1000));
        return { ...p, x: p.x + p.vx * age, y: p.y + p.vy * age, z: Math.max(0, p.z + p.vz * age - (p.weapon === 'gun' ? 0 : 4 * age * age)), type: 'projectile' };
      }), ...(playing ? scene.weapons?.effects || [] : []).map(e => ({ ...e, type: 'weaponEffect' }))]
      .sort((a, b) => (a.x + a.y) - (b.x + b.y) || (a.z || 0) - (b.z || 0));
    if(!playing){
    // A loose strand of warm bulbs connects the two sides of the camp.
    c.strokeStyle = '#b1aa7833'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-250, -154); c.quadraticCurveTo(0, -36, 242, -140); c.stroke();
    for (let i = 0; i < 11; i++) {
      const f = i / 10, x = -250 + f * 492, y = (1 - f) ** 2 * -154 + 2 * (1 - f) * f * -36 + f ** 2 * -140;
      this.glow(x, y + 3, 16, '#ffca6330'); this.ellipse(x, y + 3, 2.3, 3, '#e2bc75');
    }
    }
    for (const item of objects) {
      const [px, py] = this.project(item.x, item.y); c.save(); c.translate(px, py);
      if (['tree','tent'].includes(item.type) && players.some(p => { const [x,y]=this.project(p.x,p.y); return Math.abs(x-px)<65 && y<py && y>py-125; })) c.globalAlpha=.4;
      if (item.type === 'player') this.player(item, item.id === scene.self, t);
      else if (item.type === 'fire') this.fire(t);
      else this[item.type]?.(item, t);
      c.restore();
    }
    if (!playing && !this.reduced) for (let i = 0; i < 18; i++) {
      const x = Math.sin(t * .1 + i * 3.2) * 330, y = Math.cos(i * 7.1 + t * .15) * 130 - 30;
      c.globalAlpha = Math.max(0, Math.sin(t + i * 2)) * .45; this.glow(x, y, 5, '#e1db7d66'); this.ellipse(x, y, 1, 1, '#e6da8f');
    }
    c.globalAlpha = 1; c.restore();
    const vignette = c.createRadialGradient(w / 2, h * .55, w * .24, w / 2, h * .55, w * .8);
    vignette.addColorStop(0, 'transparent'); vignette.addColorStop(1, playing?'#496b2915':'#0c191777'); c.fillStyle = vignette; c.fillRect(0, 0, w, h);
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
      const {x,y,width,height,lines}=chosen;c.fillStyle='#172b24ed';c.beginPath();c.roundRect(x,y,width,height,9);c.fill();c.fillStyle='#f0dfbd';
      lines.forEach((line,i)=>c.fillText(line,x+12,y+23+i*17));this.bubbleAreas.push({x,y,width,height});occupied.push(chosen);
    }
  }
  presenceLabels(players, scene) {
    const c = this.ctx;
    this.presenceAreas = [];
    c.font = '10px "Malgun Gothic", sans-serif'; c.textAlign = 'left';
    const occupied = this.hitAreas.flatMap(a => [a.body, a.label,
      {x:a.head.x-a.head.radius,y:a.head.y-a.head.radius,width:a.head.radius*2,height:a.head.radius*2}]);
    occupied.push(...(this.bubbleAreas || []));
    const overlaps = (a,b) => a.x < b.x+b.width+2 && a.x+a.width+2 > b.x && a.y < b.y+b.height+2 && a.y+a.height+2 > b.y;
    const priority = p => p.id===scene.selectedId ? 2 : p.id===scene.self ? 1 : 0;
    const sorted = [...players].sort((a,b) => priority(b)-priority(a) || a.id.localeCompare(b.id));
    for (const p of sorted) {
      const badge = presenceBadges[p.presence], area = this.hitAreas.find(a => a.id === p.id);
      if (!badge || !area || ['falling','respawning'].includes(p.motion)) continue;
      const [text,color] = badge, width = c.measureText(text).width+12, height = 18;
      const y=area.head.y-area.head.radius-height-5;
      const box=[0,-width*.55,width*.55].map(offset=>({x:area.head.x-width/2+offset,y,width,height})).find(b=>
        b.x>=8 && b.x+b.width<=this.width-8 && b.y>=40 && b.y+b.height<=this.height-56 && occupied.every(other => !overlaps(b,other)));
      // Extra status yields to bodies, names and speech. Full notes remain in player details.
      if (!box) continue;
      area.badge = box;
      this.presenceAreas.push({...box,id:p.id,text});occupied.push(box);
      c.fillStyle = '#15271fed';c.beginPath();c.roundRect(box.x,box.y,width,height,5);c.fill();
      c.fillStyle = color;c.fillText(text,box.x+6,box.y+12);
    }
  }
  football(ball) {
    const c = this.ctx;
    this.ellipse(0, 1, 9, 4, '#07140c66');
    c.save(); c.translate(0, -7); c.rotate(this.reduced ? 0 : ball.rotation);
    c.fillStyle = '#eeeadd'; c.strokeStyle = '#718077'; c.lineWidth = .7;
    c.beginPath(); c.arc(0, 0, 7.5, 0, Math.PI * 2); c.fill(); c.stroke(); c.clip();
    for (const [x,y,r] of [[0,0,3.2],[-6,-4,3],[6,-4,3],[0,8,3]]) {
      c.beginPath();
      for (let i=0;i<5;i++) { const angle=i*Math.PI*2/5-Math.PI/2; const px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r; if(i)c.lineTo(px,py);else c.moveTo(px,py); }
      c.closePath(); c.fillStyle='#34443d'; c.fill();
    }
    c.restore();
  }
  destroy() { this.stopped = true; this.cancelFrame(this.frame); this.observer.disconnect(); this.avatars.dispose(); }
}

export { CampAudio } from './camp-audio.mjs';
