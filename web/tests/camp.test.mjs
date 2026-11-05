import { fixture, roomQuery } from './api-fixture.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MEMBER_TTL, HOST_LEASE } from '../lib/camp-api.mjs';
import { direction, movePlayer, sanitizeInput, spawnPlayer, validPosition, SPEED } from '../lib/camp-world.mjs';

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

test('member credentials cannot be used by another session; host departure preserves room and elects guest', async () => {
  const f = fixture(), host = await f.enrolled('Host'), guest = await f.enrolled('Guest');
  const { value: r } = await host('rooms', { op: 'create' });
  const { value: g } = await guest('rooms', { op: 'join', code: r.code });
  assert.equal((await guest('room', { op: 'leave', code: r.code, player: r.player })).status, 403);
  assert.equal((await host(roomQuery(r))).value.members.length, 2);
  assert.equal((await host('room', { op: 'leave', code: r.code, player: r.player })).status, 200);
  const next = await guest(roomQuery(g)); assert.equal(next.status, 200); assert.equal(next.value.host, g.player); assert.equal(next.value.epoch, 2);
  assert.equal(f.DB.prepare('SELECT COUNT(*) AS count FROM camp_members').first().count, 1);
  await guest('room', { op: 'leave', code: r.code, player: g.player });
  assert.equal(f.DB.prepare('SELECT COUNT(*) AS count FROM camp_rooms').first().count, 0);
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

test('expired host lease elects one fresh successor in join order and fences the former host', async () => {
  const f = fixture(), h = await f.enrolled('H'), a = await f.enrolled('A'), b = await f.enrolled('B');
  const { value: r } = await h('rooms', { op: 'create' }); f.advance(1);
  const { value: ar } = await a('rooms', { op: 'join', code: r.code }); f.advance(1);
  const { value: br } = await b('rooms', { op: 'join', code: r.code });
  f.advance(HOST_LEASE / 2);
  await a(roomQuery(ar) + '&ready=1'); await b(roomQuery(br) + '&ready=1');
  f.advance(HOST_LEASE / 2);
  const results = await Promise.all([a(roomQuery(ar) + '&ready=1'), b(roomQuery(br) + '&ready=1')]);
  assert.ok(results.every(r => r.value.host === ar.player && r.value.epoch === 2));
  const old = await h(roomQuery(r) + '&epoch=1&renew=1'); assert.equal(old.value.host, ar.player); assert.equal(old.value.epoch, 2);
  const signal = { type: 'offer', sdp: 'v=0', generation: crypto.randomUUID() };
  assert.equal((await h('room', { op: 'signal', code: r.code, player: r.player, epoch: 1, to: br.player, signal })).status, 409);
  assert.equal((await b('room', { op: 'signal', code: r.code, player: br.player, epoch: 2, to: ar.player, signal })).status, 200);
  f.sqlite.close();
});

test('host heartbeat prevents election, while an unresponsive successor is skipped on the next lease', async () => {
  const f = fixture(), h = await f.enrolled('H'), a = await f.enrolled('A'), b = await f.enrolled('B');
  const { value: r } = await h('rooms', { op: 'create' }); f.advance(1);
  const { value: ar } = await a('rooms', { op: 'join', code: r.code }); f.advance(1);
  const { value: br } = await b('rooms', { op: 'join', code: r.code });
  f.advance(15_000); await h(roomQuery(r) + '&epoch=1&renew=1');
  await a(roomQuery(ar) + '&ready=1'); await b(roomQuery(br) + '&ready=1');
  f.advance(10_000); assert.equal((await b(roomQuery(br) + '&ready=1')).value.epoch, 1);
  await a(roomQuery(ar) + '&ready=1'); f.advance(10_001);
  assert.equal((await b(roomQuery(br) + '&ready=1')).value.host, ar.player);
  f.advance(15_000); await b(roomQuery(br) + '&ready=1'); f.advance(5_001);
  const third = await b(roomQuery(br)); assert.equal(third.value.host, br.player); assert.equal(third.value.epoch, 3);
  f.sqlite.close();
});

test('creating another room hands the previous room to its remaining member', async () => {
  const f = fixture(), h = await f.enrolled('H'), a = await f.enrolled('A');
  const { value: r } = await h('rooms', { op: 'create' });
  const { value: ar } = await a('rooms', { op: 'join', code: r.code });
  await h('rooms', { op: 'create' });
  const next = await a(roomQuery(ar)); assert.equal(next.status, 200); assert.equal(next.value.host, ar.player);
  f.sqlite.close();
});

test('signaling is private to recipient and restricted to host topology', async () => {
  const f = fixture(), host = await f.enrolled('H'), a = await f.enrolled('A'), b = await f.enrolled('B');
  const { value: r } = await host('rooms', { op: 'create' });
  const { value: ar } = await a('rooms', { op: 'join', code: r.code });
  const { value: br } = await b('rooms', { op: 'join', code: r.code });
  const signal = { type: 'offer', sdp: 'v=0\r\n', generation: crypto.randomUUID() };
  assert.equal((await a('room', { op: 'signal', epoch: 1, code: r.code, player: ar.player, to: br.player, signal })).status, 403);
  assert.equal((await a('room', { op: 'signal', epoch: 1, code: r.code, player: ar.player, to: r.host, signal })).status, 200);
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
  const { value: room } = await c('rooms', { op: 'create' });
  const start = await c('discord/start');
  const auth = new URL(start.response.headers.get('location'));
  assert.equal(auth.searchParams.get('scope'), 'identify');
  const path = 'discord/callback?state=' + auth.searchParams.get('state') + '&code=approved';
  assert.match((await outsider(path)).response.headers.get('location'), /discord-expired/);
  const responses = [Response.json({ access_token: 'private-token' }), Response.json({ id: '12345', avatar: 'abc123' })];
  const linked = await c(path, undefined, { options: { fetch: async () => responses.shift() } });
  assert.equal(linked.status, 302);
  assert.match(linked.response.headers.get('location'), /\/discord-complete\?notice=discord-linked$/);
  const p = (await c('session')).value.profile;
  assert.equal(p.linked, true); assert.match(p.avatar, /^https:\/\/cdn.discordapp.com\/avatars\/12345\/abc123.png/);
  assert.match((await c(path)).response.headers.get('location'), /discord-expired/);
  const beforeUnlink = await c(roomQuery(room));
  assert.equal(beforeUnlink.status, 200); assert.equal(beforeUnlink.value.host, room.host);
  assert.equal(beforeUnlink.value.members[0].avatar, p.avatar);
  assert.equal((await c('discord/unlink', {})).status,409);
  assert.equal((await c('session')).value.profile.linked,true);
  await c('room',{op:'leave',code:room.code,player:room.player});
  assert.equal((await c('discord/unlink', {})).status,200);assert.equal((await c('session')).value.profile.linked,false);
  f.sqlite.close();
});

test('Discord cancellation is handled and expired states are rejected', async () => {
  const f = fixture({ DISCORD_CLIENT_ID: 'client', DISCORD_CLIENT_SECRET: 'secret' }), c = await f.enrolled('H');
  let start = await c('discord/start');
  let state = new URL(start.response.headers.get('location')).searchParams.get('state');
  const denied = await c('discord/callback?state=' + state + '&error=access_denied');
  assert.match(denied.response.headers.get('location'), /discord-cancelled/);
  start = await c('discord/start'); state = new URL(start.response.headers.get('location')).searchParams.get('state');
  f.advance(300_001); assert.match((await c('discord/callback?state=' + state + '&code=x')).response.headers.get('location'), /discord-expired/);
  f.sqlite.close();
});

test('Discord errors return to the completion page without linking or exposing credentials', async () => {
  for (const fetcher of [async () => { throw new Error('network private-token'); }, async () => Response.json({}, { status: 401 }), async () => Response.json({})]) {
    const f = fixture({ DISCORD_CLIENT_ID: 'client', DISCORD_CLIENT_SECRET: 'test-secret' }), c = await f.enrolled('H',false);
    const start = await c('discord/start'), state = new URL(start.response.headers.get('location')).searchParams.get('state');
    const result = await c('discord/callback?state=' + state + '&code=approved', undefined, { options: { fetch: fetcher } });
    assert.equal(result.status, 302); assert.match(result.response.headers.get('location'), /discord-failed$/);
    assert.equal((await c('session')).value.profile.linked, false);
    assert.ok(!result.response.headers.get('location').includes('secret')); f.sqlite.close();
  }
  const f = fixture(), c = await f.enrolled('H');
  assert.match((await c('discord/start')).response.headers.get('location'), /discord-unconfigured$/);
  assert.match((await f.client()('discord/callback?code=x')).response.headers.get('location'), /discord-expired$/);
  f.sqlite.close();
});

test('music title lookup uses a fixed YouTube endpoint, normalizes titles and caches successful responses', async () => {
  const f = fixture(), c = f.client(); let calls = 0;
  const options = { fetch: async (url, init) => {
    calls++; const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://www.youtube.com'); assert.equal(parsed.pathname, '/oembed');
    assert.equal(parsed.searchParams.get('url'), 'https://www.youtube.com/watch?v=meta1234567');
    assert.equal(init.redirect, 'error');
    return Response.json({ title: '  한글 노래\u0000 제목 ♥  ', html: '<iframe>not used</iframe>' });
  } };
  for (let i = 0; i < 2; i++) {
    const result = await c('music-metadata?videoId=meta1234567', undefined, { options });
    assert.equal(result.status, 200); assert.deepEqual(result.value, { title: '한글 노래 제목 ♥' });
  }
  assert.equal(calls, 1);
  assert.equal((await c('music-metadata?videoId=https://evil.test', undefined, { options })).status, 400);
  assert.equal(calls, 1);
  const failure = await c('music-metadata?videoId=fail1234567', undefined, { options: { fetch: async () => Response.json({}, { status: 404 }) } });
  assert.equal(failure.status, 502); f.sqlite.close();
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
