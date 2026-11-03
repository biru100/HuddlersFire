import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleCampRequest, MEMBER_TTL } from '../lib/camp-api.mjs';
import { direction, movePlayer, sanitizeInput, spawnPlayer, validPosition, SPEED } from '../lib/camp-world.mjs';

function fixture(extra = {}) {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec('PRAGMA foreign_keys=ON');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL('../drizzle/' + file, import.meta.url), 'utf8'));
  const DB = {
    prepare(sql) {
      let params = [];
      return {
        bind(...values) { params = values; return this; },
        first() { return sqlite.prepare(sql).get(...params) ?? null; },
        all() { return { results: sqlite.prepare(sql).all(...params) }; },
        run() { return sqlite.prepare(sql).run(...params); },
      };
    },
    batch(statements) {
      sqlite.exec('BEGIN');
      try { const results = statements.map(s => s.run()); sqlite.exec('COMMIT'); return results; }
      catch (e) { sqlite.exec('ROLLBACK'); throw e; }
    },
  };
  let now = Date.now();
  const env = { DB, ...extra };
  const client = () => {
    let cookie = '';
    return async (path, data, overrides = {}) => {
      const request = new Request('https://camp.test/api/camp/' + path, { method: data === undefined ? 'GET' : 'POST', headers: { Origin: 'https://camp.test', Cookie: cookie, 'Content-Type': 'application/json', ...overrides.headers }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
      const response = await handleCampRequest(request, env, { now, ...overrides.options });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      const value = response.headers.get('content-type')?.includes('json') ? await response.json() : null;
      return { response, value, status: response.status };
    };
  };
  const enrolled = async name => { const c = client(); assert.equal((await c('session', { name })).status, 200); return c; };
  return { DB, sqlite, client, enrolled, advance: ms => { now += ms; } };
}
const roomQuery = info => 'room?' + new URLSearchParams({ code: info.code, player: info.player });

test('16-member cap remains atomic under concurrent joins', async () => {
  const f = fixture(), host = await f.enrolled('Host');
  const { value: room } = await host('rooms', { op: 'create' });
  assert.match(room.code, /^[A-HJ-NP-Z2-9]{6}$/);
  const clients = await Promise.all(Array.from({ length: 20 }, (_, i) => f.enrolled('Guest' + i)));
  const results = await Promise.all(clients.map(c => c('rooms', { op: 'join', code: room.code.toLowerCase() })));
  assert.equal(results.filter(r => r.status === 201).length, 15);
  assert.equal(results.filter(r => r.status === 409).length, 5);
  assert.equal((await host(roomQuery(room))).value.members.length, 16);
  f.sqlite.close();
});

test('member credentials cannot be used by another session; host departure cascades', async () => {
  const f = fixture(), host = await f.enrolled('Host'), guest = await f.enrolled('Guest');
  const { value: r } = await host('rooms', { op: 'create' });
  const { value: g } = await guest('rooms', { op: 'join', code: r.code });
  assert.equal((await guest('room', { op: 'leave', code: r.code, player: r.player })).status, 403);
  assert.equal((await host(roomQuery(r))).value.members.length, 2);
  assert.equal((await host('room', { op: 'leave', code: r.code, player: r.player })).status, 200);
  assert.equal((await guest(roomQuery(g))).status, 410);
  assert.equal(f.DB.prepare('SELECT COUNT(*) AS count FROM camp_members').first().count, 0);
  f.sqlite.close();
});

test('guest departure preserves host and stale host closes the room', async () => {
  const f = fixture(), host = await f.enrolled('Host'), guest = await f.enrolled('Guest');
  const { value: r } = await host('rooms', { op: 'create' });
  const { value: g } = await guest('rooms', { op: 'join', code: r.code });
  await guest('room', { op: 'leave', code: r.code, player: g.player });
  assert.equal((await host(roomQuery(r))).value.members.length, 1);
  f.advance(MEMBER_TTL + 1);
  assert.equal((await host(roomQuery(r))).status, 410);
  f.sqlite.close();
});

test('signaling is private to recipient and restricted to host topology', async () => {
  const f = fixture(), host = await f.enrolled('H'), a = await f.enrolled('A'), b = await f.enrolled('B');
  const { value: r } = await host('rooms', { op: 'create' });
  const { value: ar } = await a('rooms', { op: 'join', code: r.code });
  const { value: br } = await b('rooms', { op: 'join', code: r.code });
  const signal = { type: 'offer', sdp: 'v=0\r\n', generation: crypto.randomUUID() };
  assert.equal((await a('room', { op: 'signal', code: r.code, player: ar.player, to: br.player, signal })).status, 403);
  assert.equal((await a('room', { op: 'signal', code: r.code, player: ar.player, to: r.host, signal })).status, 200);
  assert.equal((await b(roomQuery(br))).value.signals.length, 0);
  const events = (await host(roomQuery(r))).value.signals;
  assert.equal(events.length, 1); assert.equal(events[0].sender, ar.player);
  assert.equal((await host(roomQuery(r) + '&after=' + events[0].id)).value.signals.length, 0);
  f.sqlite.close();
});

test('unknown rooms, oversized input, missing authentication and cross-origin mutations fail', async () => {
  const f = fixture(), anonymous = f.client(), c = await f.enrolled('<script>hello</script>');
  assert.equal((await anonymous('rooms', { op: 'create' })).status, 401);
  assert.equal((await c('rooms', { op: 'join', code: 'ABC234' })).status, 404);
  assert.equal((await c('rooms', { op: 'join', code: '../bad' })).status, 400);
  assert.equal((await c('rooms', { op: 'create' }, { headers: { Origin: 'https://evil.test' } })).status, 403);
  assert.equal((await c('session', { name: 'a'.repeat(20_000) })).status, 413);
  assert.equal((await c('session')).value.profile.name.length, 16);
  f.sqlite.close();
});

test('Discord authorization state is one-use, session-bound, and profile-only', async () => {
  const f = fixture({ DISCORD_CLIENT_ID: 'client', DISCORD_CLIENT_SECRET: 'test-secret' });
  const c = await f.enrolled('H'), outsider = await f.enrolled('Other');
  const start = await c('discord/start');
  const auth = new URL(start.response.headers.get('location'));
  assert.equal(auth.searchParams.get('scope'), 'identify');
  const path = 'discord/callback?state=' + auth.searchParams.get('state') + '&code=approved';
  assert.equal((await outsider(path)).status, 403);
  const responses = [Response.json({ access_token: 'private-token' }), Response.json({ id: '12345', avatar: 'abc123' })];
  const linked = await c(path, undefined, { options: { fetch: async () => responses.shift() } });
  assert.equal(linked.status, 302);
  const p = (await c('session')).value.profile;
  assert.equal(p.linked, true); assert.match(p.avatar, /^https:\/\/cdn.discordapp.com\/avatars\/12345\/abc123.png/);
  assert.equal((await c(path)).status, 403);
  await c('discord/unlink', {}); assert.equal((await c('session')).value.profile.linked, false);
  f.sqlite.close();
});

test('Discord cancellation is handled and expired states are rejected', async () => {
  const f = fixture({ DISCORD_CLIENT_ID: 'client', DISCORD_CLIENT_SECRET: 'secret' }), c = await f.enrolled('H');
  let start = await c('discord/start');
  let state = new URL(start.response.headers.get('location')).searchParams.get('state');
  const denied = await c('discord/callback?state=' + state + '&error=access_denied');
  assert.match(denied.response.headers.get('location'), /discord-cancelled/);
  start = await c('discord/start'); state = new URL(start.response.headers.get('location')).searchParams.get('state');
  f.advance(300_001); assert.equal((await c('discord/callback?state=' + state + '&code=x')).status, 403);
  f.sqlite.close();
});

test('TURN credentials expire and never expose the configured shared secret', async () => {
  const f = fixture({ TURN_URLS: 'turn:relay.example:3478,turns:relay.example:5349', TURN_SHARED_SECRET: 'never-public' });
  const c = await f.enrolled('H'), { value } = await c('session');
  assert.equal(value.turnConfigured, true); assert.equal(value.iceServers.length, 2);
  assert.ok(Number(value.iceServers[1].username.split(':')[0]) > Date.now() / 1000);
  assert.ok(!JSON.stringify(value).includes('never-public')); f.sqlite.close();
});

test('WASD is screen-relative, diagonals are normalized, all 16 spawns are walkable', () => {
  const up = direction(new Set(['KeyW'])); assert.ok(up.dx < 0 && up.dy < 0);
  const right = direction(new Set(['KeyD'])); assert.ok(right.dx > 0 && right.dy < 0);
  assert.equal(Math.hypot(...Object.values(direction(new Set(['KeyW', 'KeyD'])))), 1);
  for (let i = 0; i < 16; i++) { const p = spawnPlayer(i); assert.ok(validPosition(p.x, p.y), 'spawn ' + i); }
});

test('movement rejects invalid input and cannot pass through fire, scenery or boundaries', () => {
  assert.equal(sanitizeInput({ dx: NaN, dy: 0, sitting: false }), null);
  assert.equal(sanitizeInput({ dx: 0, dy: Infinity, sitting: false }), null);
  const fast = sanitizeInput({ dx: 1000, dy: 1000, sitting: false }); assert.ok(Math.hypot(fast.dx, fast.dy) <= 1.00001);
  const p = { x: 0, y: 2, sitting: false }; const initial = { ...p };
  for (let i = 0; i < 200; i++) movePlayer(p, { dx: 0, dy: -1 }, .033);
  assert.ok(validPosition(p.x, p.y)); assert.ok(p.y > .87);
  p.sitting = true; const before = { ...p }; movePlayer(p, fast, 1); assert.deepEqual(p, before);
  const q = { ...initial }; movePlayer(q, fast, 10); assert.ok(Math.hypot(q.x - initial.x, q.y - initial.y) <= SPEED * .1 + .0001);
});
