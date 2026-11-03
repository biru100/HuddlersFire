// Real ICE/DTLS/SCTP traffic on loopback, through the running application's HTTP API.
// This validates the game protocol, not browser interoperability or real-world NAT traversal.
import assert from 'node:assert/strict';
import { RTCPeerConnection } from 'werift';
import { CampNetwork } from '../lib/camp-network.mjs';
import { spawnPlayer, TRAMPOLINES } from '../lib/camp-world.mjs';
import { musicPosition } from '../lib/camp-media.mjs';
const origin = process.env.CAMP_TEST_URL || 'http://127.0.0.1:5173';
const instances = [], connections = [];
let requests = 0;
class LocalPeer extends RTCPeerConnection {
  constructor(config) {
    super({ ...config, iceServers: [], iceUseIpv4: true, iceUseIpv6: false, iceUseTcp: false, iceInterfaceAddresses: { udp4: '127.0.0.1' } });
    connections.push(this);
  }
}
function client() {
  let cookie = '';
  return async (path, data) => {
    requests++;
    const response = await fetch(origin + '/api/camp/' + path, {
      method: data === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }), signal: AbortSignal.timeout(15_000),
    });
    const sessionCookie = response.headers.get('set-cookie'); if (sessionCookie) cookie = sessionCookie.split(';')[0];
    const value = await response.json();
    if (!response.ok) throw Object.assign(new Error(value.error), { status: response.status });
    return value;
  };
}
async function until(condition, label, timeout = 45_000) {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) throw new Error(label);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
let hostRequest, info;
try {
  hostRequest = client();
  const profile = (await hostRequest('session', { name: 'QA Host' })).profile;
  info = await hostRequest('rooms', { op: 'create' });
  const host = new CampNetwork(info, profile, {}, { request: hostRequest, PeerConnection: LocalPeer, beacon: () => false });
  instances.push(host);
  for (let i = 1; i <= 15; i++) {
    const request = client(), p = (await request('session', { name: 'QA ' + i })).profile;
    const room = await request('rooms', { op: 'join', code: info.code });
    instances.push(new CampNetwork(room, p, {}, { request, PeerConnection: LocalPeer, beacon: () => false }));
  }
  console.log('PASS: host and 15 separately authenticated guests joined over HTTP.');
  await until(() => host.players.size === 16 && [...host.peers.values()].every(p => p.channel?.readyState === 'open'), '16 players did not connect');
  console.log('PASS: 15 real WebRTC DataChannels opened.');
  await until(() => instances.every(n => n.players.size === 16), 'All peers did not receive the complete state');
  console.log('PASS: all 16 clients received the complete P2P world state.');
  const guest = instances[1], observer = instances[2], before = { ...host.players.get(guest.player) };
  guest.setInput({ dx: 0, dy: 1, sitting: false });
  await until(() => Math.hypot(host.players.get(guest.player).x - before.x, host.players.get(guest.player).y - before.y) > .2, 'Guest input did not move the authoritative player', 5000);
  guest.setInput({ dx: 0, dy: 0, sitting: true });
  await until(() => host.players.get(guest.player).sitting && observer.players.get(guest.player).sitting, 'Sitting did not replicate', 5000);
  console.log('PASS: guest input moved the host state and sitting reached a different guest.');
  await until(() => [...host.peers.values()].every(p => p.ready && p.control?.readyState === 'open') && instances.slice(1).every(n => n.peers.get(n.host)?.ready), 'Reliable control handshake failed');
  guest.setInput({ dx: 0, dy: 0, sitting: false, crouching: true });
  await until(() => host.players.get(guest.player).crouching && observer.players.get(guest.player).crouching, 'Crouch did not replicate', 5000);
  guest.setInput({ dx: 0, dy: 0, sitting: false, crouching: false });
  await until(() => !observer.players.get(guest.player).crouching, 'Crouch release did not replicate', 5000);
  await guest.command('emote', { emote: 'dance' });
  await until(() => observer.players.get(guest.player).emote === 'dance', 'Emote did not replicate', 5000);
  const text = '한글 채팅 <b>그대로 표시</b> ♥';
  await guest.command('chat', { text });
  await until(() => instances.every(n => n.chat.some(m => m.text === text && m.by === guest.player)), 'Chat did not reach all 16 members', 5000);
  assert.equal(observer.chat.filter(m => m.text === text).length, 1);
  await assert.rejects(() => guest.command('chat', { text: 'too fast' }), /기다렸다가/);
  await guest.command('music-add', { url: 'https://youtu.be/abcdefghijk' });
  await assert.rejects(() => guest.command('music-control', { op: 'play' }), /방장/);
  await host.command('music-control', { op: 'play' });
  await until(() => instances.every(n => n.music.current?.videoId === 'abcdefghijk' && n.music.playing), 'Music state did not replicate', 5000);
  await host.command('music-control', { op: 'sync', currentId: host.music.current.id, position: 42 });
  await until(() => observer.music.position === 42, 'Playback checkpoint did not replicate', 5000);
  assert.ok(musicPosition(observer.music, observer.hostNow()) >= 42);
  console.log('PASS: reliable crouch/release, emotes, CJK chat, request limits and host-only music controls reached 16 peers.');
  const carrier = host.players.get(guest.player), passenger = host.players.get(observer.player);
  Object.assign(carrier, spawnPlayer(1), { x: 0, y: 2 }); Object.assign(passenger, spawnPlayer(2), { x: .5, y: 2 });
  // Isolate this pair from nearby spawn locations so the advertised nearest target is deterministic.
  for (const [id, p] of host.players) if (![guest.player, observer.player].includes(id)) Object.assign(p, { x: -2, y: -4 });
  host.publishWorld(true);
  await guest.command('lift', { target: observer.player });
  await until(() => observer.players.get(observer.player).carriedBy === guest.player, 'Carrying did not replicate', 5000);
  await observer.command('escape');
  await until(() => !host.players.get(guest.player).carrying && observer.players.get(observer.player).motion === 'grounded', 'Passenger could not escape', 5000);
  Object.assign(carrier, { x: TRAMPOLINES[0].x, y: TRAMPOLINES[0].y });
  await until(() => observer.players.get(guest.player).motion === 'airborne' && observer.players.get(guest.player).z > .2, 'Trampoline did not replicate', 5000);
  Object.assign(carrier, { x: 0, y: 5.99, z: 0, vz: 0, motion: 'grounded' });
  const respawns = carrier.respawns;
  guest.setInput({ dx: 0, dy: 1, sitting: false });
  await until(() => observer.players.get(guest.player).motion === 'falling', 'Fall was rejected by remote snapshot validation', 5000);
  guest.setInput({ dx: 0, dy: 0, sitting: false });
  await until(() => observer.players.get(guest.player).respawns > respawns, 'Respawn did not replicate', 5000);
  console.log('PASS: carrying, passenger escape, trampoline height, off-map fall and respawn replicated over real WebRTC.');
  await assert.rejects(() => hostRequest('rooms', { op: 'join', code: info.code }), e => e.status === 409);
  console.log('PASS: the 17th player was rejected.');
  const previousPeer = guest.peers.get(guest.host);
  guest.iceRefreshAt = 0; host.iceRefreshAt = 0;
  guest.retry();
  await until(() => guest.peers.get(guest.host) !== previousPeer && guest.peers.get(guest.host)?.channel?.readyState === 'open', 'Reconnect failed');
  guest.setInput({ dx: 0, dy: 0, sitting: false });
  await until(() => !host.players.get(guest.player).sitting && !observer.players.get(guest.player).sitting, 'State did not resume after reconnect', 5000);
  assert.ok(guest.iceRefreshAt > Date.now() && host.iceRefreshAt > Date.now());
  console.log('PASS: reconnect refreshed ICE settings, opened a new channel and resumed replication.');
  await until(() => guest.peers.get(guest.host)?.ready && guest.chat.some(m => m.text === text) && guest.music.current?.videoId === 'abcdefghijk', 'Reconnect did not restore chat/music');
  Object.assign(carrier, spawnPlayer(1), { x: 0, y: 2 }); Object.assign(passenger, spawnPlayer(2), { x: .5, y: 2 });
  await guest.command('lift', { target: observer.player });
  await until(() => observer.players.get(observer.player).carriedBy === guest.player, 'Second lift did not replicate', 5000);
  guest.retry();
  await until(() => !passenger.carriedBy && passenger.motion === 'grounded' && guest.peers.get(guest.host)?.ready, 'Carrier reconnect left a passenger suspended');
  assert.equal(guest.chat.filter(m => m.text === text).length, 1);
  console.log('PASS: reconnect restored bounded chat history and music and safely released a carried passenger.');
  await hostRequest('room', { op: 'leave', code: info.code, player: info.player });
  await until(() => instances.every(n => n.closed), 'Host departure did not close all peers', 15_000);
  console.log('PASS: host departure closed all 16 clients.');
  console.log(`Network integration passed; ${requests} HTTP requests. Scope: local Node WebRTC implementation, no browser UI.`);
} catch (error) {
  console.error('FAIL:', error.message);
  console.error(JSON.stringify(instances.map((n, i) => ({ player: i, closed: n.closed, members: n.members.length, players: n.players.size, status: n.status, peers: [...n.peers.values()].map(p => ({ state: p.pc.connectionState, channel: p.channel?.readyState })) })), null, 2));
  process.exitCode = 1;
} finally {
  if (hostRequest && info) await hostRequest('room', { op: 'leave', code: info.code, player: info.player }).catch(() => {});
  instances.forEach(n => n.destroy(false));
  await Promise.race([Promise.allSettled(connections.map(p => p.close())), new Promise(resolve => setTimeout(resolve, 2000))]);
}
// Werift can retain internal transport timers; this CLI owns and exits its test process.
process.exit(process.exitCode || 0);
