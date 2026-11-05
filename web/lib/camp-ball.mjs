import { canPlay, MAP_BOUNDS } from './camp-maps.mjs';

export const BALL_RADIUS = .22;
export const emptyBall = () => ({ x: 3.7, y: .6, vx: 0, vy: 0, rotation: 0 });
export function readBall(value) {
  if (!value || !['x','y','vx','vy','rotation'].every(k => Number.isFinite(value[k]))) return null;
  if (Math.abs(value.x) > MAP_BOUNDS.state || Math.abs(value.y) > MAP_BOUNDS.state || Math.hypot(value.vx, value.vy) > 6.001 || Math.abs(value.rotation) > Math.PI * 2 + .001) return null;
  return { x:value.x, y:value.y, vx:value.vx, vy:value.vy, rotation:value.rotation };
}
export function stepBall(ball, players, dt, obstacles) {
  for (const p of players.values()) {
    if (!canPlay(p) || p.connected === false || p.motion !== 'grounded' || p.sitting || !p.moving) continue;
    const dx = ball.x - p.x, dy = ball.y - p.y, distance = Math.hypot(dx, dy);
    if (distance > BALL_RADIUS + .3) continue;
    const nx = distance > .001 ? dx / distance : p.aimX, ny = distance > .001 ? dy / distance : p.aimY;
    const speed = p.running ? 5.3 : 3.3;
    ball.vx = nx * speed; ball.vy = ny * speed;
    ball.x = p.x + nx * (BALL_RADIUS + .31); ball.y = p.y + ny * (BALL_RADIUS + .31);
  }
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  for (const o of obstacles) {
    const dx = ball.x - o.x, dy = ball.y - o.y, distance = Math.hypot(dx, dy), radius = o.r + BALL_RADIUS;
    if (distance >= radius) continue;
    const nx = distance > .0001 ? dx / distance : 1, ny = distance > .0001 ? dy / distance : 0;
    ball.x = o.x + nx * (radius + .001); ball.y = o.y + ny * (radius + .001);
    const dot = ball.vx * nx + ball.vy * ny;
    if (dot < 0) { ball.vx -= 1.65 * dot * nx; ball.vy -= 1.65 * dot * ny; }
  }
  if (Math.abs(ball.x) > MAP_BOUNDS.edge+.2 || Math.abs(ball.y) > MAP_BOUNDS.edge+.2) { Object.assign(ball, emptyBall()); return; }
  const speed = Math.hypot(ball.vx, ball.vy);
  ball.rotation = (ball.rotation + speed * dt / BALL_RADIUS) % (Math.PI * 2);
  const decay = Math.exp(-1.35 * dt);
  ball.vx *= decay; ball.vy *= decay;
  if (speed < .04) { ball.vx = 0; ball.vy = 0; }
}
