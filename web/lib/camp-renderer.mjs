import { SCENERY, TRAMPOLINES, EMOTES, spawnPlayer } from './camp-world.mjs';

const seed = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export class CampRenderer {
  constructor(canvas, getScene) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.getScene = getScene; this.images = new Map();
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
    this.frame = requestAnimationFrame(t => this.draw(t));
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect(); this.width = rect.width; this.height = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * this.dpr); this.canvas.height = Math.round(rect.height * this.dpr);
  }
  polygon(points, fill, stroke) {
    const c = this.ctx; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = .6; c.stroke(); }
  }
  ellipse(x, y, rx, ry, color) { const c = this.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill(); }
  project(x, y) { return [(x - y) * 40, (x + y) * 20]; }
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
  fire(time) {
    const c = this.ctx, t = this.reduced ? 1 : time;
    this.glow(0, -15, 150 + Math.sin(t * 5) * 5, '#ed912740');
    this.ellipse(0, 2, 42, 23, '#403d2b'); this.ellipse(0, 0, 31, 17, '#252a20');
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, x = Math.cos(a) * 37, y = Math.sin(a) * 20;
      this.ellipse(x, y, 9, 6, i < 6 ? '#797963' : '#575c4b');
      this.ellipse(x - 1, y - 2, 7, 3, '#a5a18433');
    }
    this.polygon([[-23, -6], [20, 10], [24, 4], [-17, -13]], '#765135');
    this.polygon([[20, -11], [-21, 8], [-17, 13], [24, -5]], '#977049');
    for (let i = 0; i < 5; i++) {
      const wobble = Math.sin(t * 5 + i * 2) * 7, x = (i - 2) * 7, h = 34 + seed(i) * 25;
      c.beginPath(); c.moveTo(x - 13, -6); c.bezierCurveTo(x - 25, -20, x + 15 + wobble, -h + 8, x + wobble, -h - 8);
      c.bezierCurveTo(x + 30, -25, x + 16, -5, x + 9, -4); c.closePath();
      c.fillStyle = ['#e36c35', '#f4933b', '#ffc15b', '#f89e42', '#f5b94e'][i]; c.fill();
    }
    this.ellipse(0, -13, 12, 16, '#ffe3a0');
    if (!this.reduced) for (let i = 0; i < 12; i++) {
      const life = (t * .23 + seed(i + 62)) % 1;
      c.globalAlpha = (1 - life) * .7; c.fillStyle = '#ffd18a';
      c.fillRect(Math.sin(life * 9 + i) * (8 + life * 22), -30 - life * 100, 2, 3);
    }
    c.globalAlpha = 1;
  }
  trampoline() {
    const c = this.ctx;
    for (const x of [-23, 23]) { c.strokeStyle = '#a7b9a2'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, -2); c.lineTo(x, 13); c.stroke(); }
    this.ellipse(0, 0, 31, 17, '#819d88'); this.ellipse(0, -2, 26, 13, '#263e38');
    c.strokeStyle = '#dab77e'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -2, 29, 15, 0, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#c4d1a7'; c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillText('↑', 0, 3);
    c.font = '10px "Malgun Gothic", sans-serif'; c.fillStyle = '#b0bda1'; c.fillText('트램펄린', 0, 29);
  }
  player(p, self, time) {
    if (p.motion === 'respawning') return;
    const c = this.ctx, sitting = p.sitting, crouching = p.crouching;
    const emote = p.emoteUntil > this.sceneTime ? EMOTES.find(e => e.id === p.emote) : null;
    const bob = !sitting && p.moving && !this.reduced ? Math.sin(time * 15) * 2 : 0;
    if (p.motion !== 'falling' && !p.carriedBy) this.ellipse(0, 3, Math.max(5, 14 - p.z * 2), Math.max(3, 7 - p.z), '#06170b66');
    if (p.targeted) { c.strokeStyle = '#e7cf8e'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 3, 20, 11, 0, 0, Math.PI * 2); c.stroke(); }
    if (self) { c.strokeStyle = '#f3cb8655'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 3, 19, 10, 0, 0, Math.PI * 2); c.stroke(); }
    c.translate(0, -(p.z || 0) * 40);
    if (p.motion === 'falling') c.globalAlpha *= Math.max(.1, 1 + p.z / 15);
    c.save(); c.translate(0, bob + (sitting ? 10 : crouching ? 14 : 0));
    if (emote && !this.reduced) {
      if (emote.id === 'dance') c.rotate(Math.sin(time * 9) * .13);
      if (emote.id === 'laugh' || emote.id === 'surprise') c.translate(0, Math.sin(time * 14) * 2);
    }
    if (crouching) c.scale(1.1, .78);
    c.fillStyle = '#293633'; c.fillRect(-9, -9, 7, sitting ? 5 : 12); c.fillRect(3, -9, 7, sitting ? 5 : 12);
    c.fillStyle = p.color || '#e5a76d'; c.beginPath(); c.roundRect(-12, -30, 24, 24, [8, 8, 5, 5]); c.fill();
    const motion = this.reduced ? 0 : Math.sin(time * 12);
    let leftX = -13, rightX = 13, leftY = -17, rightY = -17;
    if (p.carrying) { leftY = -46; rightY = -46; }
    else if (emote?.id === 'wave') rightY = -39 + motion * 5;
    else if (emote?.id === 'clap') { leftY = rightY = -29; leftX = -5 - motion * 3; rightX = 5 + motion * 3; }
    else if (emote?.id === 'heart') { leftY = rightY = -33; leftX = -5; rightX = 5; }
    else if (emote?.id === 'dance') { leftY = -30 + motion * 8; rightY = -30 - motion * 8; }
    this.ellipse(leftX, leftY, 4, 6, p.color || '#e5a76d'); this.ellipse(rightX, rightY, 4, 6, p.color || '#e5a76d');
    this.ellipse(0, -38, 12, 13, '#eac5a0');
    c.fillStyle = '#50402e'; c.beginPath(); c.arc(0, -42, 12, Math.PI, 0); c.fill(); c.fillRect(-12, -43, 24, 5);
    c.fillStyle = '#34372c'; c.fillRect(-5 + p.facing, -38, 2, 3); c.fillRect(3 + p.facing, -38, 2, 3);
    c.fillStyle = '#e4be78'; c.fillRect(-10, -28, 20, 4); c.fillRect(5, -25, 4, 9);
    if (p.avatar && /^https:\/\/cdn\.discordapp\.com\/avatars\//.test(p.avatar)) {
      let img = this.images.get(p.avatar);
      if (!img) { img = new Image(); img.src = p.avatar; this.images.set(p.avatar, img); }
      if (img.complete && img.naturalWidth) { c.save(); c.beginPath(); c.arc(0, -37, 11, 0, Math.PI * 2); c.clip(); c.drawImage(img, -11, -48, 22, 22); c.restore(); }
    }
    c.restore();
    c.font = '500 11px "Malgun Gothic", sans-serif'; c.textAlign = 'center';
    const label = (p.name || '허들러') + (self ? ' · 나' : ''), w = c.measureText(label).width + 18;
    c.fillStyle = self ? '#d9b779e8' : '#18251fe6'; c.beginPath(); c.roundRect(-w / 2, 16, w, 22, 6); c.fill();
    c.fillStyle = self ? '#263027' : '#ced6c5'; c.fillText(label, 0, 31);
    if (emote) {
      c.font = 'bold 15px "Malgun Gothic", sans-serif'; c.fillStyle = '#f1d5a1'; c.fillText(emote.symbol, 0, -64);
    }
    if (p.bubble && p.bubbleUntil > this.sceneTime) {
      c.font = '12px "Malgun Gothic", sans-serif';
      const lines = []; let line = '';
      for (const char of p.bubble) {
        if (c.measureText(line + char).width > 140) { lines.push(line); line = ''; }
        line += char;
        if (lines.length === 3) { line = line + '…'; break; }
      }
      if (line) lines.push(line);
      const height = lines.length * 17 + 16, bottom = emote ? -82 : -60;
      c.fillStyle = '#e8e2ccef'; c.beginPath(); c.roundRect(-82, bottom - height, 164, height, 8); c.fill();
      this.polygon([[-5, bottom - 1], [5, bottom - 1], [0, bottom + 5]], '#e8e2ccef');
      c.fillStyle = '#283c30'; lines.forEach((text, i) => c.fillText(text, 0, bottom - height + 21 + i * 17));
    }
  }
  draw(ms) {
    if (this.stopped) return;
    const c = this.ctx, w = this.width, h = this.height, t = ms / 1000;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, w, h);
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#14231f'); bg.addColorStop(.7, '#1c2a23'); bg.addColorStop(1, '#15201b');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 65; i++) {
      c.globalAlpha = .08 + seed(i + 90) * .25; c.fillStyle = '#e2deba';
      c.fillRect(seed(i + 3) * w, seed(i + 11) * h * .58, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
    c.globalAlpha = 1; this.glow(w * .83, h * .15, 100, '#b2b5980c');
    this.ellipse(w * .83, h * .15, 20, 20, '#b9bd9677'); this.ellipse(w * .83 + 9, h * .15 - 6, 19, 19, '#14231f');
    const scale = Math.min(w / 1110, h / 790) * 1.02;
    c.save(); c.translate(w * .51, h * .60); c.scale(scale, scale);
    this.ellipse(0, 110, 370, 150, '#0c15144d');
    this.polygon([[-480, 0], [0, 240], [0, 264], [-480, 24]], '#2b3023');
    this.polygon([[0, 240], [480, 0], [480, 24], [0, 264]], '#232c22');
    for (let x = -6; x < 6; x++) for (let y = -6; y < 6; y++) {
      const [px, py] = this.project(x, y), n = seed(x * 21 + y + 370), center = Math.hypot(x + .5, y + .5) < 2.8;
      const color = center ? ['#5d6243', '#626546', '#596044'][Math.floor(n * 3)] : ['#384b36', '#3c5038', '#405239', '#3b4e37'][Math.floor(n * 4)];
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
    const scene = this.getScene(), players = scene.players?.length ? scene.players : [{ id: 'preview', name: scene.name || '허들러', color: scene.color, ...spawnPlayer(), sitting: true }];
    this.sceneTime = scene.now ?? performance.now();
    const objects = [...SCENERY.map(o => ({ ...o })), ...TRAMPOLINES, { type: 'fire', x: 0, y: 0 }, ...players.map(p => ({ ...p, type: 'player', targeted: p.id === scene.targetId }))]
      .sort((a, b) => (a.x + a.y) - (b.x + b.y) || (a.z || 0) - (b.z || 0));
    // A loose strand of warm bulbs connects the two sides of the camp.
    c.strokeStyle = '#b1aa7833'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-250, -154); c.quadraticCurveTo(0, -36, 242, -140); c.stroke();
    for (let i = 0; i < 11; i++) {
      const f = i / 10, x = -250 + f * 492, y = (1 - f) ** 2 * -154 + 2 * (1 - f) * f * -36 + f ** 2 * -140;
      this.glow(x, y + 3, 16, '#ffca6330'); this.ellipse(x, y + 3, 2.3, 3, '#e2bc75');
    }
    for (const item of objects) {
      const [px, py] = this.project(item.x, item.y); c.save(); c.translate(px, py);
      if (item.type === 'player') this.player(item, item.id === scene.self, t);
      else if (item.type === 'fire') this.fire(t);
      else this[item.type]?.(item, t);
      c.restore();
    }
    if (!this.reduced) for (let i = 0; i < 18; i++) {
      const x = Math.sin(t * .1 + i * 3.2) * 330, y = Math.cos(i * 7.1 + t * .15) * 130 - 30;
      c.globalAlpha = Math.max(0, Math.sin(t + i * 2)) * .45; this.glow(x, y, 5, '#e1db7d66'); this.ellipse(x, y, 1, 1, '#e6da8f');
    }
    c.globalAlpha = 1; c.restore();
    const vignette = c.createRadialGradient(w / 2, h * .55, w * .24, w / 2, h * .55, w * .8);
    vignette.addColorStop(0, 'transparent'); vignette.addColorStop(1, '#0c191777'); c.fillStyle = vignette; c.fillRect(0, 0, w, h);
    this.frame = requestAnimationFrame(next => this.draw(next));
  }
  destroy() { this.stopped = true; cancelAnimationFrame(this.frame); this.observer.disconnect(); }
}

export class CampAudio {
  async setVolume(volume) {
    if (!this.context && volume > 0) {
      const context = new AudioContext(); this.context = context;
      const gain = context.createGain(); gain.gain.value = 0; gain.connect(context.destination); this.gain = gain;
      const buffer = context.createBuffer(1, context.sampleRate * 7, context.sampleRate), data = buffer.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < data.length; i++) { brown = (brown + (Math.random() * 2 - 1) * .025) / 1.025; data[i] = brown * 2.8; }
      const noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true;
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 780;
      noise.connect(filter); filter.connect(gain); noise.start(); this.noise = noise;
      this.crackle = setInterval(() => {
        if (context.state !== 'running' || this.volume <= 0) return;
        const b = context.createBuffer(1, context.sampleRate * .07, context.sampleRate), a = b.getChannelData(0);
        for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * Math.exp(-i / 280) * .35;
        const source = context.createBufferSource(); source.buffer = b; source.connect(gain); source.start();
      }, 800);
    }
    this.volume = volume;
    if (this.context) { await this.context.resume(); this.gain.gain.setTargetAtTime(volume * .45, this.context.currentTime, .12); }
  }
  destroy() { clearInterval(this.crackle); this.noise?.stop(); this.context?.close(); }
}
