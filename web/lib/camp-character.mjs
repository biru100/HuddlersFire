// Shared by the world renderer and the lobby preview. Coordinates are relative to the feet.
const OUTLINE = '#4a472c';
const HEAD_RADIUS = 17;
const avatarUrl = value => typeof value === 'string' && /^https:\/\/cdn\.discordapp\.com\/avatars\/\d{1,24}\/(?:a_)?[a-f0-9]+\.png(?:\?size=\d+)?$/.test(value);

export class AvatarImages {
  constructor(onChange = () => {}, ImageType = globalThis.Image) {
    this.entries = new Map(); this.onChange = onChange; this.ImageType = ImageType;
  }
  get(url) {
    if (!avatarUrl(url) || !this.ImageType) return null;
    let entry = this.entries.get(url);
    if (!entry) {
      const image = new this.ImageType(); entry = { image, failed: false }; this.entries.set(url, entry);
      if (this.entries.size > 64) {
        const oldest = this.entries.keys().next().value, previous = this.entries.get(oldest);
        previous.image.onload = previous.image.onerror = null; this.entries.delete(oldest);
      }
      image.onload = () => this.onChange();
      image.onerror = () => { entry.failed = true; this.onChange(); };
      try { image.src = url; } catch { entry.failed = true; }
    }
    const image = entry.image;
    return !entry.failed && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 ? image : null;
  }
  dispose() {
    for (const { image } of this.entries.values()) image.onload = image.onerror = null;
    this.entries.clear();
  }
}

const paletteCache = new Map();
function palette(color) {
  if (!paletteCache.has(color)) {
    const value = /^#[a-f0-9]{6}$/i.test(color) ? color : '#e5a76d';
    const rgb = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
    const mix = (target, amount) => `rgb(${rgb.map((v, i) => Math.round(v + (target[i] - v) * amount)).join(',')})`;
    if (paletteCache.size >= 64) paletteCache.clear();
    paletteCache.set(color, { base: value, light: mix([255, 237, 202], .24), shadow: mix([111, 74, 44], .16) });
  }
  return paletteCache.get(color);
}
function paint(c, fill, width = 1.15) {
  c.fillStyle = fill; c.fill(); c.strokeStyle = OUTLINE; c.lineWidth = width; c.lineJoin = 'round'; c.stroke();
}
function oval(c, x, y, rx, ry, fill, outline = true) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (outline) paint(c, fill); else { c.fillStyle = fill; c.fill(); }
}
function softFill(c, colors, x, y, width, height) {
  const gradient = c.createLinearGradient(x - width * .4, y - height * .4, x + width * .6, y + height * .6);
  gradient.addColorStop(0, colors.light); gradient.addColorStop(.65, colors.base); gradient.addColorStop(1, colors.shadow);
  return gradient;
}

// One continuous mitten silhouette, with a soft shoulder and a wide rounded tip.
// Keeping the hand inside the arm shape avoids the old thin-stick-and-dot joints.
function arm(c, side, pose, hand, colors) {
  const x = side * 7 + pose.lean, y = pose.top + 4;
  if (hand.y < pose.headY + 9) {
    // Raised arms bend outside the large head instead of disappearing behind the photo.
    const hx = (hand.x - pose.lean) * side;
    c.save(); c.translate(pose.lean, 0); c.scale(side, 1);
    c.beginPath(); c.moveTo(4, y - 2);
    c.bezierCurveTo(12, y + 3, hx - 4, hand.y + 10, hx - 4, hand.y);
    c.bezierCurveTo(hx - 4, hand.y - 5.5, hx + 4, hand.y - 5.5, hx + 4, hand.y);
    c.bezierCurveTo(hx + 9, hand.y + 13, 22, y + 13, 10, y + 3);
    c.quadraticCurveTo(5, y + 4, 4, y - 2); c.closePath();
    paint(c, softFill(c, colors, 14, (y + hand.y) / 2, 16, Math.abs(y - hand.y) + 8));
    c.restore(); return;
  }
  const dx = hand.x - x, dy = hand.y - y, length = Math.hypot(dx, dy);
  c.save(); c.translate(x, y); c.rotate(Math.atan2(dy, dx));
  c.beginPath(); c.moveTo(-2.5, -3.4);
  c.bezierCurveTo(length * .25, -4.4, length + 4.4, -5.1, length + 4.4, 0);
  c.bezierCurveTo(length + 4.4, 5.1, length * .4, 4.3, -2.5, 3.4);
  c.quadraticCurveTo(-5, 0, -2.5, -3.4); c.closePath();
  paint(c, softFill(c, colors, length * .35, 0, length + 8, 9));
  c.restore();
}

export function characterPose(p, time = 0, reduced = true, emote = null, now = time * 1000) {
  const sitting = !!p.sitting, crouching = !sitting && !!p.crouching;
  const motion = reduced ? 0 : Math.sin(time * 8);
  const running = !!p.running && !!p.moving && !sitting && !crouching;
  const step = !reduced && p.moving && !sitting ? Math.sin(time * (crouching ? 6 : running ? 14 : 9)) : 0;
  const airborne = p.motion === 'airborne' || !!p.carriedBy;
  const headY = sitting ? -32 : crouching ? -29 : -40;
  const breath = reduced || p.moving || airborne ? 0 : Math.sin(time * 2.6) * .25;
  const pose = { headY, radius: HEAD_RADIUS, top: headY + 13, bottom: sitting ? -2.5 : -4.5,
    width: sitting ? 12.8 : crouching ? 12 : 10.7, lean: step * .6, stretch: 1 - Math.abs(step) * .035 + breath * .025,
    feet: sitting ? [[-8.5, .5, 6, 4.8, -.18], [8.5, .5, 6, 4.8, .18]] : crouching ? [[-8.5, .2, 5.2, 4.2, -.3], [8.5, .2, 5.2, 4.2, .3]] : [[-5.5 - step * .7, -Math.max(0, step) * 2.5, 4.7, 4.5, step * .12], [5.5 - step * .7, -Math.max(0, -step) * 2.5, 4.7, 4.5, -step * .12]],
    hands: [{ x: -12.5, y: sitting ? -8 : crouching ? -3 : -12.5 + step * 1.7 }, { x: 12.5, y: sitting ? -8 : crouching ? -3 : -12.5 - step * 1.7 }],
    frontHands: false, frontArms: false, bob: -Math.abs(step) * .8 + breath, headBob: 0, tilt: 0, effect: null };
  if (running) {
    pose.lean = step * 1.4; pose.tilt = step * .065; pose.bob = -Math.abs(step) * 1.5;
    pose.stretch = 1 - Math.abs(step) * .065;
    pose.feet = [[-6.5 - step * 1.3, -Math.max(0, step) * 4, 4.7, 4.5, step * .25], [6.5 - step * 1.3, -Math.max(0, -step) * 4, 4.7, 4.5, -step * .25]];
    pose.hands = [{ x: -13, y: -15 + step * 3.5 }, { x: 13, y: -15 - step * 3.5 }];
  }
  if (airborne) {
    const rising = (p.vz || 0) > 0;
    pose.feet = [[-6, rising ? -3 : -1.5, 5, 4.5, -.3], [6, rising ? -3 : -1.5, 5, 4.5, .3]];
    pose.hands = [{ x: rising ? -13 : -17, y: rising ? -24 : -18 }, { x: rising ? 13 : 17, y: rising ? -24 : -18 }];
    pose.stretch = rising ? 1.07 : 1.02; pose.bob = 0; pose.tilt = 0; pose.lean = 0;
  } else if (p.jumpAt >= 0) {
    const press = reduced ? 1 : Math.min(1, Math.max(0, (now - p.jumpAt) / 110));
    pose.stretch = 1 - press * .18; pose.width += press * 1.3; pose.headBob = press * 3;
    pose.hands = [{ x: -12, y: -10 }, { x: 12, y: -10 }]; pose.bob = 0;
  } else if (!reduced && p.landedAt >= 0 && now - p.landedAt >= 0 && now - p.landedAt < 180) {
    const press = Math.sin((now - p.landedAt) / 180 * Math.PI);
    pose.stretch = 1 - press * .18; pose.width += press; pose.headBob = press * 2.7;
  }
  if (p.carrying) {
    pose.hands = [{ x: -15, y: -50 }, { x: 15, y: -50 }]; pose.frontHands = true;
    pose.width += .5; pose.stretch = 1.03;
  } else if (emote === 'wave') {
    pose.hands[1] = { x: 21 + motion * 2.2, y: headY - 4 + motion * 1.2 }; pose.frontHands = true;
    pose.lean = -.5; pose.tilt = -.035;
  } else if (emote === 'heart') {
    pose.hands = [{ x: -3.5, y: -13.5 }, { x: 3.5, y: -13.5 }];
    pose.frontArms = true; pose.frontHands = true; pose.effect = 'heart';
    pose.stretch = 1 - (motion + 1) * .02; pose.headBob = -Math.max(0, motion) * .6;
  } else if (emote === 'clap') {
    const x = 3 + (motion + 1) * 2;
    pose.hands = [{ x: -x, y: -15 }, { x, y: -15 }]; pose.frontArms = true; pose.frontHands = true;
    pose.stretch = 1 - (motion + 1) * .025;
    if (motion < -.35 || reduced) pose.effect = 'clap';
  } else if (emote === 'dance') {
    pose.hands = [{ x: -16, y: -22 + motion * 5 }, { x: 16, y: -22 - motion * 5 }];
    pose.lean = motion * 1.8; pose.tilt = motion * .085;
    pose.feet = [[-6.5, -Math.max(0, motion) * 2.2, 5, 4.5, -.15], [6.5, -Math.max(0, -motion) * 2.2, 5, 4.5, .15]];
    pose.bob = -Math.abs(motion) * 1.2; pose.stretch = 1 - Math.abs(motion) * .05;
  } else if (emote === 'laugh') {
    pose.hands = [{ x: -7.5, y: -11 }, { x: 7.5, y: -11 }]; pose.frontArms = true;
    pose.stretch = .96 - Math.abs(motion) * .04; pose.width += .5;
    pose.headBob = -Math.abs(motion) * 1.1;
  } else if (emote === 'surprise') {
    pose.hands = [{ x: -18, y: -28 }, { x: 18, y: -28 }]; pose.frontHands = true;
    pose.stretch = 1.06; pose.headBob = -1 - Math.max(0, motion) * 1.3;
  }
  if (['gun', 'snowball', 'bomb'].includes(p.weapon) && !p.carrying && !p.carriedBy && !emote) {
    const recent = p.shotAt >= 0 && now >= p.shotAt && now - p.shotAt < 220;
    const side = recent ? (p.shotAimX - p.shotAimY >= 0 ? 1 : -1) : p.facing === -1 ? -1 : 1;
    pose.weaponSide = side; pose.frontArms = true;
    pose.hands = [{ x: side * 3, y: -16 }, { x: side * 13, y: -19 }];
    if (!reduced && recent) { const recoil = 1 - (now - p.shotAt) / 220; pose.lean -= side * recoil; pose.tilt -= side * recoil * .06; }
  }
  if (!reduced && p.hitAt >= 0 && now >= p.hitAt && now - p.hitAt < 280) {
    const hit = Math.sin((now - p.hitAt) / 280 * Math.PI);
    pose.stretch *= 1 - hit * .08; pose.headBob -= hit; pose.tilt += hit * .08;
  }
  return pose;
}

function heldWeapon(c, p, pose, now, reduced) {
  if (!pose.weaponSide) return;
  const side = pose.weaponSide, recent = p.shotAt >= 0 && now >= p.shotAt && now - p.shotAt < 130;
  const angle = recent ? Math.max(-.55, Math.min(.55, Math.atan2((p.shotAimX + p.shotAimY) * 20, Math.abs(p.shotAimX - p.shotAimY) * 40))) : -.08;
  c.save(); c.translate(side * 13, -19); c.scale(side, 1); c.rotate(angle);
  if (p.weapon === 'gun') {
    c.fillStyle = '#b18453'; c.beginPath(); c.roundRect(-2, 0, 4, 9, 2); paint(c, '#b18453', .9);
    c.beginPath(); c.roundRect(-6, -4.5, 16, 8, 3); paint(c, '#e7ad68', 1);
    c.beginPath(); c.roundRect(6, -3.5, 7, 6, 2); paint(c, '#8baea1', .9);
    oval(c, -2, -1, 2, 1.5, '#f5dc9a', false);
    if (recent && !reduced) { c.beginPath(); c.moveTo(14, -1); c.lineTo(20, -4); c.lineTo(18, 0); c.lineTo(21, 3); c.lineTo(14, 1); c.closePath(); c.fillStyle = '#f6dfa0'; c.fill(); }
  } else if (p.weapon === 'snowball') {
    oval(c, 2, 0, 6, 5.6, '#dce7e9'); oval(c, .6, -1.6, 3.6, 2.6, '#fffaf0', false);
  } else {
    oval(c, 2, 0, 6.5, 6.5, '#46534b'); oval(c, 0, -2, 2.5, 2.5, '#82917d', false);
    c.beginPath(); c.moveTo(3, -6); c.quadraticCurveTo(9, -12, 7, -13); c.strokeStyle = '#c9b77e'; c.lineWidth = 1.5; c.stroke();
    oval(c, 7, -13, 1.6, 1.6, '#f2b064', false);
  }
  c.restore();
}

function torsoPath(c, pose, shape) {
  const { top, bottom, width: w } = pose;
  c.beginPath(); c.moveTo(-6.5, top);
  if (shape === 'capsule') {
    c.bezierCurveTo(-w, top, -w, top + 5, -w, bottom - 5);
    c.quadraticCurveTo(-w, bottom + 1, 0, bottom + 1);
    c.quadraticCurveTo(w, bottom + 1, w, bottom - 5);
    c.bezierCurveTo(w, top + 5, w, top, 6.5, top);
  } else {
    c.bezierCurveTo(-8.3, top + 3, -w - 3.2, bottom - 10, -w + .4, bottom - 2);
    c.bezierCurveTo(-w + 2, bottom + 1.5, w - 2, bottom + 1.5, w - .4, bottom - 2);
    c.bezierCurveTo(w + 3.2, bottom - 10, 8.3, top + 3, 6.5, top);
  }
  c.closePath();
}

function torso(c, pose, colors, shape) {
  const { top, bottom, width: w } = pose;
  c.save(); c.translate(pose.lean, bottom); c.rotate(pose.tilt); c.scale(1 / pose.stretch, pose.stretch); c.translate(0, -bottom);
  torsoPath(c, pose, shape);
  c.save(); c.clip();
  c.fillStyle = softFill(c, colors, -2, top + (bottom - top) * .35, w * 2, bottom - top); c.fillRect(-w - 6, top - 2, w * 2 + 12, bottom - top + 8);
  c.beginPath(); c.moveTo(w * .38, top + 4);
  c.bezierCurveTo(w * .95, bottom - 8, w * .7, bottom - .5, -w * .65, bottom - 1);
  c.bezierCurveTo(w * .3, bottom + 5, w + 8, bottom + 2, w * .38, top + 4);
  c.closePath(); c.fillStyle = '#75512e18'; c.fill(); c.restore();
  torsoPath(c, pose, shape); c.strokeStyle = OUTLINE; c.lineWidth = 1.15; c.stroke(); c.restore();
}

export function drawCharacter(c, p, { time = 0, now = time * 1000, reduced = true, emote = null, avatar = null, shape = 'pear', blankHead = false } = {}) {
  const pose = characterPose(p, time, reduced, emote, now), colors = palette(p.color || '#e5a76d');
  c.save(); c.translate(0, pose.bob);
  if (!pose.frontArms) for (const side of [-1, 1]) arm(c, side, pose, pose.hands[side === -1 ? 0 : 1], colors);
  for (const [x, y, rx, ry, angle] of pose.feet) {
    c.save(); c.translate(x, y); c.rotate(angle);
    c.beginPath(); c.moveTo(-rx, 0);
    c.bezierCurveTo(-rx, -ry * 1.3, rx * .7, -ry * 1.4, rx, -ry * .1);
    c.bezierCurveTo(rx * 1.3, ry * 1.1, -rx * 1.1, ry * 1.1, -rx, 0); c.closePath();
    paint(c, softFill(c, colors, 0, 0, rx * 2, ry * 2)); c.restore();
  }
  torso(c, pose, colors, shape);
  if (pose.frontArms) for (const side of [-1, 1]) arm(c, side, pose, pose.hands[side === -1 ? 0 : 1], colors);
  heldWeapon(c, p, pose, now, reduced);
  c.save(); c.translate(pose.lean * .65, pose.headBob);
  // Paint a complete fallback first; transparent pixels in a profile keep this neutral backing.
  oval(c, 0, pose.headY, HEAD_RADIUS, HEAD_RADIUS, '#f5e6c9', false);
  const width = avatar?.naturalWidth || avatar?.width, height = avatar?.naturalHeight || avatar?.height;
  if (avatar && width > 0 && height > 0) {
    const size = Math.min(width, height);
    c.save(); c.beginPath(); c.arc(0, pose.headY, HEAD_RADIUS - .8, 0, Math.PI * 2); c.clip();
    c.drawImage(avatar, (width - size) / 2, (height - size) / 2, size, size,
      -HEAD_RADIUS, pose.headY - HEAD_RADIUS, HEAD_RADIUS * 2, HEAD_RADIUS * 2); c.restore();
  } else if (!blankHead) {
    const facing = p.facing === -1 ? -1 : 1;
    oval(c, -4.5 + facing, pose.headY - .5, 1.2, 1.7, OUTLINE, false);
    oval(c, 4.5 + facing, pose.headY - .5, 1.2, 1.7, OUTLINE, false);
    c.beginPath(); c.arc(facing, pose.headY + 3, 2.8, .15, Math.PI - .15);
    c.strokeStyle = OUTLINE; c.lineWidth = 1.2; c.stroke();
  }
  c.beginPath(); c.arc(0, pose.headY, HEAD_RADIUS, 0, Math.PI * 2);
  c.strokeStyle = OUTLINE; c.lineWidth = 1.3; c.stroke(); c.restore();
  if (pose.frontHands && !pose.frontArms) {
    // Only the raised tips overlap the head; the shoulders remain behind it.
    for (const hand of pose.hands) oval(c, hand.x, hand.y, 3.8, 4.1, softFill(c, colors, hand.x, hand.y, 8, 8));
  }
  if (pose.effect === 'heart') {
    c.save(); c.translate(0, -18.5); c.beginPath(); c.moveTo(0, 3);
    c.bezierCurveTo(-8, -1, -4.5, -7, 0, -3); c.bezierCurveTo(4.5, -7, 8, -1, 0, 3);
    c.fillStyle = '#db7d87'; c.fill(); c.restore();
  } else if (pose.effect === 'clap') {
    c.strokeStyle = '#e9cc91'; c.lineWidth = 1; c.lineCap = 'round';
    for (const side of [-1, 1]) { c.beginPath(); c.moveTo(side * 10, -20); c.lineTo(side * 12, -23); c.stroke(); }
  }
  c.restore();
}
