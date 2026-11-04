import { createCanvas } from '@napi-rs/canvas';

// Local, artificial profiles: no Discord account or network requests are needed for render checks.
export function avatarFixtures() {
  const fixtures = [];
  for (const kind of ['portrait', 'illustration', 'logo', 'transparent']) {
    const image = createCanvas(kind === 'portrait' ? 160 : 96, 96), c = image.getContext('2d');
    if (kind !== 'transparent') { c.fillStyle = kind === 'logo' ? '#273c67' : '#88b9d2'; c.fillRect(0, 0, image.width, image.height); }
    c.translate(image.width / 2, 48);
    if (kind === 'logo') {
      c.fillStyle = '#f6cb75'; c.beginPath(); c.moveTo(0, -31); c.lineTo(26, 23); c.lineTo(-26, 23); c.closePath(); c.fill();
    } else if (kind === 'transparent') {
      c.strokeStyle = '#c94f73'; c.lineWidth = 10; c.beginPath(); c.arc(0, 0, 23, 0, Math.PI * 2); c.stroke();
    } else {
      c.fillStyle = kind === 'portrait' ? '#324052' : '#f4d997'; c.beginPath(); c.ellipse(0, 34, 37, 27, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e9b897'; c.beginPath(); c.ellipse(0, -2, 21, 27, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#4d3537'; c.beginPath(); c.arc(0, -12, 23, Math.PI, Math.PI * 2); c.fill();
      c.fillRect(-12, -3, 4, 4); c.fillRect(7, -3, 4, 4);
      c.strokeStyle = '#9b5553'; c.lineWidth = 2; c.beginPath(); c.arc(0, 7, 6, 0, Math.PI); c.stroke();
    }
    fixtures.push({ kind, image, url: `https://cdn.discordapp.com/avatars/${fixtures.length + 1}/abc.png?size=64` });
  }
  return fixtures;
}
