import { COLORS, MAX_PLAYERS } from './camp-world.mjs';

export const MEMBER_TTL = 90_000;
const SESSION_TTL = 7 * 86400_000;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const json = (data, status = 200, extra = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const random = (n = 24) => Array.from(crypto.getRandomValues(new Uint8Array(n)), v => v.toString(16).padStart(2, '0')).join('');
const hash = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), v => v.toString(16).padStart(2, '0')).join('');
const cookie = (request, name) => request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1);
const setCookie = (req, name, value, age) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`;
const profile = s => ({ name: s.name, color: s.color, avatar: s.avatar || null, linked: !!s.discord_id });
const normalizeName = v => typeof v === 'string' ? v.replace(/[\p{C}]/gu, '').trim().slice(0, 16) || '허들러' : '허들러';
const normalizeCode = value => typeof value === 'string' && /^[A-Z2-9]{6}$/.test(value.trim().toUpperCase()) ? value.trim().toUpperCase() : fail('참가 코드 6자리를 확인해 주세요.');

async function body(req) {
  if (Number(req.headers.get('content-length')) > 18000) fail('요청이 너무 큽니다.', 413);
  const text = await req.text();
  if (text.length > 18000) fail('요청이 너무 큽니다.', 413);
  try { const b = JSON.parse(text); if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error(); return b; }
  catch { fail('올바르지 않은 요청입니다.'); }
}
async function session(db, req, now) {
  const token = cookie(req, 'camp_session');
  if (!token || !/^[a-f0-9]{48}$/.test(token)) return null;
  return db.prepare('SELECT * FROM camp_sessions WHERE id = ? AND expires > ?').bind(await hash(token), now).first();
}
async function rate(db, key, now, max = 30) {
  const window = Math.floor(now / 60_000);
  const row = await db.prepare(`INSERT INTO camp_limits (id, window, count) VALUES (?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET window = excluded.window,
    count = CASE WHEN camp_limits.window = excluded.window THEN camp_limits.count + 1 ELSE 1 END RETURNING count`).bind(key, window).first();
  if (row.count > max) fail('요청이 많습니다. 잠시 후 다시 시도해 주세요.', 429);
}
async function cleanRoom(db, code, now) {
  await db.batch([
    db.prepare('DELETE FROM camp_rooms WHERE code = ? AND NOT EXISTS (SELECT 1 FROM camp_members WHERE id = camp_rooms.host AND seen > ?)').bind(code, now - MEMBER_TTL),
    db.prepare('DELETE FROM camp_members WHERE room = ? AND seen <= ?').bind(code, now - MEMBER_TTL),
    db.prepare('DELETE FROM camp_signals WHERE room = ? AND created < ?').bind(code, now - 120_000),
  ]);
}
async function iceConfig(env, playerId, now) {
  const servers = [{ urls: 'stun:stun.cloudflare.com:3478' }];
  const urls = (env.TURN_URLS || '').split(',').map(v => v.trim()).filter(v => /^turns?:/.test(v));
  if (urls.length && env.TURN_SHARED_SECRET) {
    const username = `${Math.floor(now / 1000) + 3600}:${playerId.slice(0, 12)}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.TURN_SHARED_SECRET), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(username)));
    servers.push({ urls, username, credential: btoa(String.fromCharCode(...signature)) });
  }
  return { iceServers: servers, turnConfigured: servers.length > 1 };
}

export async function handleCampRequest(req, env, options = {}) {
  const now = options.now ?? Date.now(), outboundFetch = options.fetch ?? fetch;
  const db = env.DB;
  if (!db) return json({ error: '로비 저장소가 준비되지 않았습니다.' }, 503);
  const url = new URL(req.url), route = url.pathname.replace(/^\/api\/camp\/?/, '');
  try {
    if (req.method !== 'GET') {
      if (req.headers.get('origin') !== url.origin || req.headers.get('sec-fetch-site') === 'cross-site') fail('요청 출처를 확인할 수 없습니다.', 403);
    }
    let s = await session(db, req, now);
    if (route === 'session') {
      if (req.method === 'GET') return json({ profile: s ? profile(s) : null, discordAvailable: !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET), ...(s ? await iceConfig(env, s.id, now) : {}) });
      if (req.method !== 'POST') fail('지원하지 않는 요청입니다.', 405);
      const b = await body(req), name = normalizeName(b.name), color = COLORS.includes(b.color) ? b.color : COLORS[0];
      if (s) {
        await db.prepare('UPDATE camp_sessions SET name = ?, color = ?, expires = ? WHERE id = ?').bind(name, color, now + SESSION_TTL, s.id).run();
        s = { ...s, name, color };
        return json({ profile: profile(s), ...await iceConfig(env, s.id, now) });
      }
      const address = req.headers.get('cf-connecting-ip') || options.ip || 'local';
      await rate(db, 'enroll:' + await hash(address), now, 60);
      const token = random(), id = await hash(token);
      await db.batch([
        db.prepare('DELETE FROM camp_sessions WHERE expires < ?').bind(now),
        db.prepare('DELETE FROM camp_oauth_states WHERE expires < ?').bind(now),
        db.prepare('DELETE FROM camp_limits WHERE window < ?').bind(Math.floor(now / 60_000) - 1440),
        db.prepare('DELETE FROM camp_rooms WHERE NOT EXISTS (SELECT 1 FROM camp_members WHERE id = camp_rooms.host AND seen > ?)').bind(now - MEMBER_TTL),
        db.prepare('INSERT INTO camp_sessions (id, name, color, expires) VALUES (?, ?, ?, ?)').bind(id, name, color, now + SESSION_TTL),
      ]);
      return json({ profile: { name, color, avatar: null, linked: false }, ...await iceConfig(env, id, now) }, 200, { 'Set-Cookie': setCookie(req, 'camp_session', token, SESSION_TTL / 1000) });
    }
    if (!s) fail('입장 정보를 다시 설정해 주세요.', 401);
    if (route === 'discord/start' && req.method === 'GET') {
      if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) return Response.redirect(url.origin + '/?notice=discord-unconfigured', 302);
      await rate(db, 'oauth:' + s.id, now, 5);
      const state = random();
      await db.prepare('INSERT INTO camp_oauth_states (id, session, expires) VALUES (?, ?, ?)').bind(await hash(state), s.id, now + 300_000).run();
      const oauth = new URL('https://discord.com/oauth2/authorize');
      oauth.search = new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, redirect_uri: url.origin + '/api/camp/discord/callback', response_type: 'code', scope: 'identify', state }).toString();
      return Response.redirect(oauth, 302);
    }
    if (route === 'discord/callback' && req.method === 'GET') {
      const state = url.searchParams.get('state') || '';
      const valid = await db.prepare('DELETE FROM camp_oauth_states WHERE id = ? AND session = ? AND expires > ? RETURNING id').bind(await hash(state), s.id, now).first();
      if (!valid) fail('Discord 인증이 만료되었습니다. 다시 연결해 주세요.', 403);
      if (url.searchParams.has('error')) return Response.redirect(url.origin + '/?notice=discord-cancelled', 302);
      const code = url.searchParams.get('code');
      if (!code || !env.DISCORD_CLIENT_SECRET) fail('Discord 인증 정보가 없습니다.');
      const response = await outboundFetch('https://discord.com/api/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET, redirect_uri: url.origin + '/api/camp/discord/callback' }), signal: AbortSignal.timeout(10_000) });
      if (!response.ok) fail('Discord 연결에 실패했습니다. 다시 시도해 주세요.', 502);
      const token = await response.json();
      const responseUser = await outboundFetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(10_000) });
      if (!responseUser.ok) fail('Discord 프로필을 가져오지 못했습니다.', 502);
      const user = await responseUser.json();
      if (!/^\d{1,24}$/.test(user.id)) fail('Discord 프로필이 올바르지 않습니다.', 502);
      const avatar = typeof user.avatar === 'string' && /^(a_)?[a-f0-9]+$/.test(user.avatar) ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : null;
      await db.prepare('UPDATE camp_sessions SET discord_id = ?, avatar = ? WHERE id = ?').bind(user.id, avatar, s.id).run();
      return Response.redirect(url.origin + '/?notice=discord-linked', 302);
    }
    if (route === 'discord/unlink' && req.method === 'POST') {
      await db.prepare('UPDATE camp_sessions SET discord_id = NULL, avatar = NULL WHERE id = ?').bind(s.id).run();
      return json({ ok: true });
    }
    if (route === 'rooms' && req.method === 'POST') {
      await rate(db, 'rooms:' + s.id, now, 20);
      const b = await body(req), id = random(12);
      let code;
      if (b.op === 'create') {
        await db.prepare('DELETE FROM camp_rooms WHERE host IN (SELECT id FROM camp_members WHERE session = ?)').bind(s.id).run();
        for (let attempt = 0; attempt < 8; attempt++) {
          code = Array.from(crypto.getRandomValues(new Uint8Array(6)), v => CODE_ALPHABET[v % CODE_ALPHABET.length]).join('');
          try {
            await db.batch([
              db.prepare('INSERT INTO camp_rooms (code, host, created) VALUES (?, ?, ?)').bind(code, id, now),
              db.prepare('INSERT INTO camp_members (id, room, session, name, color, avatar, seen, joined) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, code, s.id, s.name, s.color, s.avatar, now, now),
            ]);
            return json({ code, player: id, host: id, ...await iceConfig(env, id, now) }, 201);
          } catch (e) { if (!String(e).includes('UNIQUE')) throw e; }
        }
        fail('방을 만들지 못했습니다. 다시 시도해 주세요.', 503);
      }
      if (b.op !== 'join') fail('지원하지 않는 요청입니다.');
      code = normalizeCode(b.code);
      await cleanRoom(db, code, now);
      const room = await db.prepare('SELECT * FROM camp_rooms WHERE code = ?').bind(code).first();
      if (!room) fail('방이 없거나 이미 종료되었습니다.', 404);
      const inserted = await db.prepare(`INSERT INTO camp_members (id, room, session, name, color, avatar, seen, joined)
        SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM camp_members WHERE room = ?) < ?
        AND EXISTS (SELECT 1 FROM camp_rooms r JOIN camp_members m ON m.id = r.host WHERE r.code = ? AND m.seen > ?) RETURNING id`)
        .bind(id, code, s.id, s.name, s.color, s.avatar, now, now, code, MAX_PLAYERS, code, now - MEMBER_TTL).first();
      if (!inserted) fail('방이 가득 찼거나 종료되었습니다.', 409);
      return json({ code, player: id, host: room.host, ...await iceConfig(env, id, now) }, 201);
    }
    if (route === 'room') {
      const b = req.method === 'GET' ? Object.fromEntries(url.searchParams) : await body(req);
      const code = normalizeCode(b.code), player = typeof b.player === 'string' ? b.player : '';
      await cleanRoom(db, code, now);
      const room = await db.prepare('SELECT * FROM camp_rooms WHERE code = ?').bind(code).first();
      if (!room) fail('모닥불이 꺼졌습니다. 방장이 나갔거나 연결이 종료되었습니다.', 410);
      const member = await db.prepare('SELECT * FROM camp_members WHERE room = ? AND id = ? AND session = ?').bind(code, player, s.id).first();
      if (!member) fail('방 참여 정보가 만료되었습니다. 다시 입장해 주세요.', 403);
      if (req.method === 'GET') {
        const after = Number(b.after || 0);
        if (!Number.isSafeInteger(after) || after < 0) fail('잘못된 연결 정보입니다.');
        await db.batch([
          db.prepare('UPDATE camp_members SET seen = ? WHERE id = ?').bind(now, player),
          db.prepare('DELETE FROM camp_signals WHERE recipient = ? AND id <= ?').bind(player, after),
        ]);
        const [people, pending] = await Promise.all([
          db.prepare('SELECT id, name, color, avatar, joined FROM camp_members WHERE room = ? ORDER BY joined, id').bind(code).all(),
          db.prepare('SELECT id, sender, payload FROM camp_signals WHERE recipient = ? AND id > ? ORDER BY id LIMIT 100').bind(player, after).all(),
        ]);
        return json({ code, host: room.host, members: people.results, signals: pending.results.map(p => ({ id: p.id, sender: p.sender, data: JSON.parse(p.payload) })) });
      }
      if (req.method !== 'POST') fail('지원하지 않는 요청입니다.', 405);
      if (b.op === 'leave') {
        if (room.host === player) await db.prepare('DELETE FROM camp_rooms WHERE code = ?').bind(code).run();
        else await db.prepare('DELETE FROM camp_members WHERE id = ?').bind(player).run();
        return json({ ok: true });
      }
      if (b.op !== 'signal') fail('지원하지 않는 요청입니다.');
      await rate(db, 'signal:' + player, now, 240);
      const peer = await db.prepare('SELECT id FROM camp_members WHERE room = ? AND id = ?').bind(code, typeof b.to === 'string' ? b.to : '').first();
      if (!peer || peer.id === player || (room.host !== player && room.host !== peer.id)) fail('연결 대상을 확인할 수 없습니다.', 403);
      const signal = b.signal;
      if (!signal || !['offer', 'answer', 'ice'].includes(signal.type) || typeof signal.generation !== 'string' || !/^[a-f0-9-]{36}$/.test(signal.generation)) fail('잘못된 연결 정보입니다.');
      if (signal.type === 'ice') {
        if (!signal.candidate || typeof signal.candidate.candidate !== 'string' || signal.candidate.candidate.length > 2048) fail('잘못된 연결 후보입니다.');
      } else if (typeof signal.sdp !== 'string' || signal.sdp.length > 14000) fail('잘못된 연결 설명입니다.');
      await db.prepare('INSERT INTO camp_signals (room, sender, recipient, payload, created) VALUES (?, ?, ?, ?, ?)').bind(code, player, peer.id, JSON.stringify(signal), now).run();
      return json({ ok: true });
    }
    return json({ error: '요청한 기능을 찾을 수 없습니다.' }, 404);
  } catch (error) {
    if (!error.status) console.error('Camp API failure:', error.message);
    return json({ error: error.status ? error.message : '잠시 연결이 원활하지 않습니다. 다시 시도해 주세요.' }, error.status || 500);
  }
}
