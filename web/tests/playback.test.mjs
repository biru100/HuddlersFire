import test from 'node:test';
import assert from 'node:assert/strict';
import { MusicPlayback } from '../lib/camp-playback.mjs';
import { DEFAULT_SETTINGS, readSettings, saveSettings, normalizeSettings } from '../lib/camp-settings.mjs';

test('effects volume migrates the saved fire preference and the new setting takes priority, including mute',()=>{
  assert.equal(normalizeSettings({forestVolume:.6}).effectsVolume,.6);
  assert.equal(normalizeSettings({forestVolume:.6,effectsVolume:0}).effectsVolume,0);
  assert.equal(normalizeSettings({forestVolume:.6,effectsVolume:.2}).effectsVolume,.2);
  assert.equal(normalizeSettings({forestVolume:.6,effectsVolume:NaN}).effectsVolume,.6);
  assert.equal('forestVolume' in normalizeSettings({forestVolume:.6}),false);
});
import { isDiscordCompletion } from '../lib/camp-discord.mjs';
import { applyMusicAction, emptyMusic } from '../lib/camp-media.mjs';

function playback(isHost = false) {
  let now = 0;
  const calls = [], commands = [], state = { isHost, volume: 40, muted: false, hostNow: () => now,
    command: async (kind, data) => { commands.push({ kind, ...data }); },
    music: { ...emptyMusic(), current: { id: 'track1', videoId: 'abcdefghijk' }, playing: true, position: 40 } };
  const player = { position: 40, state: 1, url: 'https://youtu.be/abcdefghijk',
    loadVideoById: value => { calls.push(['load', value]); player.position = value.startSeconds; },
    cueVideoById: value => calls.push(['cue', value]),
    seekTo: value => { calls.push(['seek', value]); player.position = value; },
    playVideo: () => { calls.push(['play']); player.state = 1; },
    pauseVideo: () => { calls.push(['pause']); player.state = 2; },
    stopVideo: () => calls.push(['stop']), destroy: () => calls.push(['destroy']),
    setVolume: value => { calls.push(['volume', value]); player.volume = value; },
    mute: () => { calls.push(['mute']); player.muted = true; },
    unMute: () => { calls.push(['unmute']); player.muted = false; },
    getCurrentTime: () => player.position, getPlayerState: () => player.state, getVideoUrl: () => player.url };
  const controller = new MusicPlayback(player, () => state, () => now); controller.ready = true;
  return { controller, state, player, calls, commands, time: value => { now = value; } };
}

test('opening or closing controls keeps one loaded track and preserves playback position', () => {
  const f = playback(); f.controller.sync(true);
  for (let i = 1; i <= 20; i++) {
    f.time(i * 500); f.player.position = 40 + i * .5;
    f.state.dialogOpen = i % 2 === 0; f.controller.sync(true);
  }
  assert.equal(f.calls.filter(c => c[0] === 'load').length, 1);
  assert.equal(f.calls.filter(c => ['pause', 'seek', 'destroy'].includes(c[0])).length, 0);
  assert.equal(f.player.position, 50);
  f.controller.destroy(); f.controller.sync(true);
  assert.equal(f.calls.filter(c => c[0] === 'destroy').length, 1);
});

test('hidden host and guest keep playing; browser pauses do not pause the room and foreground restores the shared clock', () => {
  for (const isHost of [false, true]) {
    const f = playback(isHost); f.state.muted = true; f.controller.sync(true);
    f.time(4000); f.player.position = 44; f.controller.sync(false);
    assert.equal(f.calls.filter(c => c[0] === 'pause').length, 0);
    assert.equal(f.player.state, 1);
    // Simulate the browser (not the application) stopping a hidden iframe.
    f.player.state = 2; f.controller.onStateChange(2);
    assert.equal(f.commands.length, 0);
    f.time(12000); f.controller.sync(true);
    assert.equal(f.player.position, 52); assert.equal(f.player.state, 1);
    assert.equal(f.player.muted, true); assert.equal(f.commands.length, 0);
  }
});

test('hidden host advances ended songs once; hidden guests follow track changes and shared controls', () => {
  const f = playback(true); f.controller.sync(false); f.time(3000);
  f.controller.onStateChange(0); f.controller.onStateChange(0);
  assert.equal(f.commands.filter(c => c.op === 'skip').length, 1);
  const g = playback(); g.controller.sync(false); g.controller.onStateChange(0);
  assert.equal(g.commands.length, 0);
  g.state.music = { ...g.state.music, current: { id: 'track2', videoId: 'bcdefghijkl' }, transport: 1, position: 0 };
  g.controller.sync(false);
  assert.deepEqual(g.calls.filter(c => c[0] === 'load').at(-1), ['load', { videoId: 'bcdefghijkl', startSeconds: 0 }]);
  g.state.music.playing = false; g.state.music.transport++; g.controller.sync(false);
  assert.equal(g.player.state, 2);
  g.state.music.playing = true; g.state.music.transport++; g.controller.sync(false);
  assert.equal(g.player.state, 1);
});

test('authority recovery suspends the iframe and resumes at the frozen camp time without room commands', () => {
  const f = playback(true); let suspended = false; f.state.suspended = () => suspended;
  f.controller.sync(true); f.time(8000); suspended = true; f.controller.sync(true);
  f.controller.onStateChange(2); assert.equal(f.commands.length, 0); assert.equal(f.player.state, 2);
  f.time(12000); f.state.hostNow = () => 8000; suspended = false; f.controller.sync(true);
  assert.ok(f.calls.some(c => c[0] === 'seek' && c[1] === 48)); assert.equal(f.player.state, 1);
});

test('track changes, host pause and ended events apply once; guests cannot advance the room', async () => {
  const f = playback(true); f.controller.sync(true); f.time(3000);
  f.controller.onStateChange(0); f.controller.onStateChange(0);
  assert.equal(f.commands.filter(c => c.op === 'skip').length, 1);
  f.state.music = { ...f.state.music, current: { id: 'track2', videoId: 'bcdefghijkl' }, position: 0, anchor: 3000, transport: 1 };
  f.controller.sync(true); assert.equal(f.calls.filter(c => c[0] === 'load').length, 2);
  f.state.music.playing = false; f.state.music.transport++; f.controller.sync(true);
  assert.equal(f.calls.filter(c => c[0] === 'pause').length, 1);
  const g = playback(); g.controller.sync(true); g.time(3000); g.controller.onStateChange(0);
  assert.equal(g.commands.length, 0);
  await Promise.resolve();
});

test('saved settings survive reload, malformed storage and unavailable storage', () => {
  let value = 'broken'; const storage = { getItem: () => value, setItem: (_, next) => { value = next; } };
  assert.deepEqual(readSettings(storage), DEFAULT_SETTINGS);
  saveSettings(storage, { theme: 'color', effectsVolume: .3, musicVolume: 25, musicMuted: true, allowCarry: false });
  assert.deepEqual(readSettings(storage), { theme: 'color', effectsVolume: .3, musicVolume: 25, musicMuted: true, allowCarry: false });
  assert.deepEqual(normalizeSettings({ forestVolume: -1, musicVolume: 500, musicMuted: 'yes', allowCarry: null }), { theme: 'color', effectsVolume: 0, musicVolume: 100, musicMuted: false, allowCarry: true });
  const unavailable = { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); } };
  assert.deepEqual(readSettings(unavailable), DEFAULT_SETTINGS); assert.doesNotThrow(() => saveSettings(unavailable, DEFAULT_SETTINGS));
});

test('legacy listening does not opt users out of radio; explicit mute and volumes survive migration', () => {
  for (const listening of [false, true]) {
    const legacy = { listening, forestVolume: .3, musicVolume: 25, allowCarry: false };
    assert.deepEqual(normalizeSettings(legacy), { theme: 'color', effectsVolume: .3, musicVolume: 25, musicMuted: false, allowCarry: false });
    assert.equal(normalizeSettings({ ...legacy, musicMuted: true }).musicMuted, true);
  }
});

test('a late listener automatically loads the current shared position, including saved mute before loading', () => {
  const f = playback(); f.time(12000); f.state.muted = true;
  f.controller.sync(true);
  assert.deepEqual(f.calls, [['volume', 40], ['mute'], ['load', { videoId: 'abcdefghijk', startSeconds: 52 }]]);
  assert.equal(f.commands.length, 0);
});

test('host and guest mute only audio, keep the same player and restore the chosen volume', () => {
  for (const isHost of [false, true]) {
    const f = playback(isHost); f.controller.sync(true); f.calls.length = 0;
    f.state.muted = true; f.controller.sync();
    f.state.volume = 25; f.controller.sync();
    f.state.muted = false; f.controller.sync();
    assert.deepEqual(f.calls, [['mute'], ['volume', 25], ['unmute']]);
    assert.equal(f.commands.length, 0);
    assert.equal(f.player.state, 1); assert.equal(f.player.position, 40); assert.equal(f.player.volume, 25);
  }
});

test('muted hosts still advance a finished song; room pause/play and track changes preserve personal mute', () => {
  const f = playback(true); f.state.muted = true; f.controller.sync(true); f.time(3000);
  f.controller.onStateChange(0); f.controller.onStateChange(0);
  assert.equal(f.commands.filter(c => c.op === 'skip').length, 1);
  f.state.music = { ...f.state.music, current: { id: 'track2', videoId: 'bcdefghijkl' }, position: 0, anchor: 3000, transport: 1 };
  f.controller.sync();
  f.state.music.playing = false; f.state.music.transport++; f.controller.sync();
  f.state.music.playing = true; f.state.music.transport++; f.controller.sync();
  assert.equal(f.player.muted, true);
  assert.equal(f.calls.filter(c => c[0] === 'load').length, 2);
  assert.equal(f.calls.filter(c => c[0] === 'unmute').length, 0);
  assert.equal(f.player.state, 1);
});

test('blocked playback resumes from the shared clock without changing personal mute or room state', () => {
  const f = playback(); f.controller.sync(true); f.player.state = -1;
  f.time(8000); f.controller.resume();
  assert.equal(f.player.position, 48); assert.equal(f.player.state, 1);
  assert.equal(f.commands.length, 0); assert.equal(f.player.muted, false);
});

test('Discord completion accepts only the expected popup and same origin', () => {
  const popup = {}, origin = 'https://camp.test', valid = { origin, source: popup, data: { type: 'camp-discord-complete', notice: 'discord-linked' } };
  assert.ok(isDiscordCompletion(valid, origin, popup));
  for (const change of [{ origin: 'https://evil.test' }, { source: {} }, { data: { type: 'camp-discord-complete', notice: '__proto__' } }, { data: null }]) assert.equal(isDiscordCompletion({ ...valid, ...change }, origin, popup), false);
});

test('music snapshots retain a bounded song title with video ID fallback', () => {
  const m = emptyMusic(), p = { id: 'a', name: 'A' };
  assert.equal(applyMusicAction(m, { id: '1', kind: 'music-add', url: 'https://youtu.be/abcdefghijk', title: '노래\u0000 제목' }, p, true, 0), null);
  assert.equal(m.current.title, '노래 제목');
  assert.equal(applyMusicAction(m, { id: '2', kind: 'music-add', url: 'https://youtu.be/bcdefghijkl' }, p, true, 0), null);
  assert.equal(m.queue[0].title, 'bcdefghijkl');
});
