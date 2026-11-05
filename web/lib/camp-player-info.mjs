import { EMOTES } from './camp-world.mjs';
import { weaponName } from './camp-weapons.mjs';
import { presenceOf } from './camp-presence.mjs';

const inRect = (rect, x, y) => rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
// Areas are recorded in painter order and use CSS pixels, independent of device pixel ratio.
export function pickPlayer(areas, x, y, touch = false) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  // Nameplates and status are painted over every body, so they also win hit testing.
  for (let i = areas.length - 1; i >= 0; i--) if (inRect(areas[i].label,x,y) || inRect(areas[i].badge,x,y)) return areas[i].id;
  // A carried neighbour's broad body box can cross a visible portrait.
  for (let i = areas.length - 1; i >= 0; i--) {const a=areas[i];if(Math.hypot(x-a.head.x,y-a.head.y)<=a.head.radius)return a.id;}
  for (let i = areas.length - 1; i >= 0; i--) if(inRect(areas[i].body,x,y))return areas[i].id;
  if (!touch) return null;
  let closest = null, distance = Infinity;
  for (let i = areas.length - 1; i >= 0; i--) {
    const a = areas[i], d = Math.hypot(x - a.head.x, y - a.head.y);
    if (d <= Math.max(22, a.head.radius + 6) && d < distance) { closest = a.id; distance = d; }
  }
  return closest;
}

export function playerActivity(p, now) {
  if (p.connected === false) return '연결을 기다리는 중';
  if (p.motion === 'respawning' || p.motion === 'falling') return '모닥불로 돌아오는 중';
  if (p.carriedBy) return '친구에게 들려 있는 중';
  if (p.thrown && p.hitAt >= 0 && now - p.hitAt < 1200) return '장난감에 밀려나는 중';
  if (p.jumpAt >= 0) return '점프 준비 중';
  if (p.motion === 'airborne') return p.vz > 0 ? '뛰어오르는 중' : '내려오는 중';
  if (p.landedAt >= 0 && now - p.landedAt >= 0 && now - p.landedAt < 180) return '착지하는 중';
  if (p.sitting) return p.mapId==='camp'?'앉아서 불멍 중':'앉아서 쉬는 중';
  if (p.crouching) return '웅크리는 중';
  if (p.running && p.moving) return '달리는 중';
  if (p.moving) return '걷는 중';
  if (p.carrying) return '친구를 들고 있는 중';
  const emote = p.emoteUntil > now ? EMOTES.find(e => e.id === p.emote) : null;
  return emote ? `${emote.label} 표현 중` : '쉬는 중';
}

export function playerInfo(p, selfId, hostId, now) {
  return { ...presenceOf(p), id: p.id, name: p.name || '허들러', color: p.color || '#e5a76d', avatar: p.avatar || null,
    isSelf: p.id === selfId, isHost: p.id === hostId, connected: p.connected !== false,
    allowCarry: typeof p.allowCarry === 'boolean' ? p.allowCarry : null, activity: playerActivity(p, now), weapon: weaponName(p.weapon) };
}
