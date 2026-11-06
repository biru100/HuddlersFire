import { leaveSeat } from './camp-seats.mjs';
import { emptyFire } from './camp-fire.mjs';
import { PeerTransport } from './camp-peer-transport.mjs';
import { movePlayer, sanitizeInput, spawnPlayer, simulateWorld, applyPlayerAction, releaseCarry } from './camp-world.mjs';
import { PROTOCOL_VERSION, MAX_FRAME_BYTES, validAction, chatText, CommandLedger } from './camp-protocol.mjs';
import { emptyMusic, applyMusicAction } from './camp-media.mjs';
import { emptyWeapons, readWeapons } from './camp-weapons.mjs';
import { encodePlayer, decodeSnapshot, captureRecovery, restoreRecovery } from './camp-snapshot.mjs';
import { HostCoordinator } from './camp-host.mjs';
import { HOST_LEASE, RTC_STALE } from './camp-config.mjs';
import { deltaWire, WireReceiver } from './camp-wire.mjs';
import { callError, validChatEntry } from './camp-presence.mjs';
import { emptyBall } from './camp-ball.mjs';
import { startCampTicker } from './camp-scheduler.mjs';
import {CAMP_RELEASE,RELEASE_HEADER,REVISION_HEADER} from './camp-release.mjs';
import {notifyUpdate} from './camp-updates.mjs';

export async function api(path, data, extra = {}) {
  const response = await fetch('/api/camp/' + path, {
    method: data === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    signal: AbortSignal.timeout(12_000), ...extra,
    headers:{[RELEASE_HEADER]:CAMP_RELEASE.id,[REVISION_HEADER]:String(CAMP_RELEASE.revision),...(data===undefined?{}:{'Content-Type':'application/json'}),...extra.headers},
  });
  const value = await response.json().catch(() => ({ error: '서버 응답을 확인할 수 없습니다.' }));
  const release=response.headers.get(RELEASE_HEADER);
  if(release&&release!==CAMP_RELEASE.id){
    const revision=Number(response.headers.get(REVISION_HEADER));
    if(!Number.isSafeInteger(revision)||revision<CAMP_RELEASE.revision)throw Object.assign(new Error('서버 업데이트를 기다리는 중이에요.'),{status:503});
    notifyUpdate(release);throw Object.assign(new Error('새 버전을 적용하고 있어요.'),{status:410,code:'release-updated'});
  }
  if (!response.ok) throw Object.assign(new Error(value.error || '연결하지 못했습니다.'), { status: response.status });
  return value;
}

export class CampNetwork {
  constructor(info, profile, callbacks = {}, runtime = {}) {
    this.code = info.code; this.player = info.player; this.host = info.host;
    this.epoch = info.epoch || 1; this.migrating = false; this.frozenTime = null; this.handoffUntil = 0; this.lastSnapshot = null; this.lastCheckpoint = 0;
    this.lastRecovery = null; this.health = new HostCoordinator(); this.health.role(this.epoch, info.player === info.host, performance.now());
    this.iceServers = info.iceServers; this.turnConfigured = info.turnConfigured;
    this.iceRefreshAt = Date.now() + 50 * 60_000;
    this.isHost = info.player === info.host;
    this.callbacks = callbacks;
    // Explicit adapters let CLI integration tests exercise the real protocol without operating a browser.
    this.request = runtime.request || api;
    this.PeerConnection = runtime.PeerConnection || globalThis.RTCPeerConnection;
    this.lifecycle = runtime.lifecycle || globalThis.window;
    this.beacon = runtime.beacon || (payload => globalThis.navigator?.sendBeacon?.('/api/camp/room?release='+encodeURIComponent(CAMP_RELEASE.id), new Blob([payload], { type: 'application/json' })));
    this.allowCarry = runtime.allowCarry !== false;
    this.players = new Map([[this.player, { ...profile, id: this.player, ...spawnPlayer(), allowCarry: this.allowCarry, connected: this.isHost }]]);
    this.members = [];
    this.peers = new Map();
    this.pendingIce = new Map();
    this.inputs = new Map();
    this.input = { dx: 0, dy: 0, sitting: false };
    this.after = 0; this.closed = false; this.failures = 0; this.attempts = 0;
    this.lastState = performance.now(); this.lastBroadcast = 0; this.lastTick = performance.now();
    this.lastSequence = -1; this.sequence = 0;
    this.chat = []; this.music = emptyMusic(); this.weapons = emptyWeapons(); this.ball = emptyBall(); this.fire = emptyFire(this.hostNow()); this.ledger = new CommandLedger(); this.pending = new Map();
    this.clockOffset = 0; this.lastClock = 0; this.poseSent = null;
    this.status = this.isHost ? '모닥불을 피웠어요' : '친구들과 연결하는 중';
    this.onPageHide = () => this.destroy(true,true);
    this.lifecycle?.addEventListener('pagehide', this.onPageHide);
    this.stopTick = startCampTicker(() => this.tick());
    this.poll();
  }
  notify(status) { if (this.status !== status) { this.status = status; this.callbacks.status?.(status); } }
  getTransport() { return this.transport ||= new PeerTransport(this); }
  coordinator() { return this.health ||= new HostCoordinator(); }
  async setCarryPreference(allow) { await this.command('allow-carry', { allow }); this.allowCarry = allow; }
  setInput(input) {
    if (this.isHost && Number.isFinite(this.lastTick) && performance.now()-this.lastTick>100) this.tick();
    this.input = sanitizeInput(input) || { dx: 0, dy: 0, sitting: false };
    const posture = input?.crouching ? 'crouching' : this.input.sitting ? 'sitting' : 'standing';
    if (posture !== this.poseSent && (this.isHost || this.peers.get(this.host)?.ready)) {
      this.poseSent = posture;
      this.command('posture', { posture }).catch(() => {});
    }
  }
  hostNow() { return this.migrating && Number.isFinite(this.frozenTime) ? this.frozenTime : performance.now() + (this.clockOffset || 0); }
  resumeSimulation() {
    if (this.migrating && Number.isFinite(this.frozenTime)) this.clockOffset = this.frozenTime - performance.now();
    this.migrating = false; this.frozenTime = null; this.lastTick = performance.now();
    this.coordinator().role(this.epoch || 1, this.isHost, this.lastTick);
  }
  command(kind, data = {}) {
    const action = { ...data, kind, id: crypto.randomUUID() };
    if (this.closed) return Promise.reject(new Error('방 연결이 종료됐어요.'));
    if (this.migrating) return Promise.reject(new Error('새 방장에게 연결 중이에요. 잠깐 기다려 주세요.'));
    if (!validAction(action)) return Promise.reject(new Error('요청 내용을 확인해 주세요.'));
    if (this.isHost) {
      const result = this.handleCommand(this.player, action);
      return result.ok ? Promise.resolve(result) : Promise.reject(new Error(result.error));
    }
    const peer = this.peers.get(this.host);
    if (!peer?.ready || peer.control?.readyState !== 'open') return Promise.reject(new Error('친구들과 연결된 뒤 다시 시도해 주세요.'));
    if (this.pending.size >= 32) return Promise.reject(new Error('이전 요청을 보내는 중이에요.'));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(action.id); reject(new Error('요청 응답을 확인하지 못했어요. 연결을 확인해 주세요.')); }, 6000);
      this.pending.set(action.id, { resolve, reject, timer });
      if (!this.reliable(peer, { t: 'command', action })) this.failPending('연결이 혼잡해요. 다시 시도해 주세요.');
    });
  }
  failPending(message) {
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error(message)); }
    this.pending.clear(); this.poseSent = null;
  }
  handleCommand(sender, action) {
    if (this.isHost && Number.isFinite(this.lastTick)) this.tick();
    if (!validAction(action)) return { ok: false, error: '올바르지 않은 요청이에요.' };
    const cached = this.ledger.cached(sender, action.id); if (cached) return cached;
    const now = this.hostNow(), member = this.players.get(sender);
    let error = !member || member.connected === false ? '참가자 연결을 확인해 주세요.' : null;
    if (!error && !this.ledger.permit(sender, action.kind, now)) error = '잠깐 기다렸다가 다시 해주세요.';
    if (!error) {
      if (action.kind === 'chat') {
        const text = chatText(action.text);
        if (!text) error = '메시지를 입력해 주세요.';
        else {
          const entry = { id: action.id, by: sender, name: member.name, color: member.color, text, at: now, createdAt: Date.now(), mapId:member.mapId, kind: 'chat' };
          this.chat = [...this.chat, entry].slice(-100);
          member.bubble = text; member.bubbleUntil = now + 5000;
          this.broadcastControl({ t: 'chat', entry }); this.callbacks.chat?.(this.chat);
        }
      } else if (action.kind === 'call') {
        error = callError(this.players, this.chat, sender, action.target, now);
        if (!error) {
          member.lastCallAt = now; this.players.get(action.target).lastCalledAt = now;
          const entry = { id: action.id, by: sender, name: member.name, color: member.color, text: `${this.players.get(action.target).name}님을 불렀어요.`,
            at: now, createdAt: Date.now(), kind: 'call', to: action.target };
          this.chat = [...this.chat, entry].slice(-100);
          this.broadcastControl({ t: 'chat', entry }); this.callbacks.chat?.(this.chat); this.callbacks.call?.(entry);
        }
      } else if (action.kind.startsWith('music-')) {
        error = applyMusicAction(this.music, action, member, sender === this.host, now);
        if (!error) { this.broadcastControl({ t: 'music', music: this.music }); this.callbacks.music?.(this.music); }
      } else error = applyPlayerAction(this.players, sender, action, now, this.weapons, this.fire ||= emptyFire(now));
      if (!error && ['change-map','seat'].includes(action.kind)) {
        this.inputs.delete(sender);
        if (sender === this.player) this.input = { dx: 0, dy: 0, sitting: false };
      }
    }
    if(!error&&action.kind==='seat'&&sender===this.player)this.poseSent='sitting';
    const result = { ok: !error, ...(error ? { error } : {}) };
    this.ledger.record(sender, action.id, result);
    if (!error && !action.kind.startsWith('music-')) this.stateDirty = true;
    return result;
  }
  reliable(...args) { return this.getTransport().reliable(...args); }
  flush(...args) { return this.getTransport().flush(...args); }
  broadcastControl(...args) { return this.getTransport().broadcastControl(...args); }
  syncRoom(peer) {
    this.reliable(peer, { t: 'music', music: this.music });
    // Bounded chunks also fit the lowest common browser SCTP message limit with 200-character CJK text.
    for (let i = 0; i < Math.max(1, this.chat.length); i += 20) {
      this.reliable(peer, { t: 'history', reset: i === 0, entries: this.chat.slice(i, i + 20) });
    }
    this.reliable(peer, this.checkpointMessage());
  }
  worldMessage() {
    return { t: 'state', v: PROTOCOL_VERSION, epoch: this.epoch || 1, now: this.hostNow(), seq: this.sequence++, weapons: this.weapons || emptyWeapons(), ball: this.ball || emptyBall(), fire:this.fire || emptyFire(), players: [...this.players.values()].map(encodePlayer) };
  }
  checkpointMessage() {
    const world = { ...this.worldMessage(), checkpoint: { chatId: this.chat?.at(-1)?.id || null, musicRevision: this.music?.revision || 0 } };
    this.coordinator().checkpoint(world.seq, performance.now());
    const recovery = captureRecovery(world, this.chat || [], this.music || emptyMusic());
    if (recovery) {
      this.pendingRecoveries ||= new Map(); this.pendingRecoveries.set(world.seq, recovery);
      if (this.pendingRecoveries.size > 128) this.pendingRecoveries.delete(this.pendingRecoveries.keys().next().value);
      if (!this.members?.some(m => m.id !== this.player && m.active !== 0)) this.lastRecovery = recovery;
    }
    return world;
  }
  publishWorld(reliable = false) {
    const value = reliable ? this.checkpointMessage() : this.worldMessage();
    if (reliable) this.broadcastControl(value);
    else {
      const signature = JSON.stringify({ players: value.players, ball: value.ball, fire:value.fire, projectiles: value.weapons.projectiles, effects: value.weapons.effects });
      if (signature === this.lastWorldSignature) return;
      this.lastWorldSignature = signature;
      const cache = new Map();
      for (const peer of this.peers.values()) if (peer.ready) this.send(peer, this.frameForPeer(value, peer, cache));
    }
  }
  frameForPeer(world, peer, cache = new Map()) {
    const base = performance.now() - (peer.wireBaseAt ?? -Infinity) < RTC_STALE ? this.pendingRecoveries?.get(peer.wireBaseSeq)?.world : null;
    const key = world.checkpoint ? 'full' : base?.seq ?? 'full';
    if (!cache.has(key)) {
      const start = performance.now();
      cache.set(key, JSON.stringify(deltaWire(world, base || null)));
      this.encoding ||= { frames:0, milliseconds:0 }; this.encoding.frames++; this.encoding.milliseconds += performance.now()-start;
    }
    return cache.get(key);
  }
  flushStateUpdate() {
    if (!this.stateDirty) return;
    this.stateDirty = false;
    // Discrete outcomes stay reliable, but are not full recovery checkpoints.
    this.broadcastControl(this.worldMessage());
  }
  receiveWorld(message) {
    // Canonical objects are used by local callers/tests; RTC receives the v9 wire form.
    let decoded;
    if (Array.isArray(message?.players)) decoded = decodeSnapshot(message, this.epoch || 1);
    else {
      this.wireReceiver ||= new WireReceiver();
      const result = this.wireReceiver.read(message, this.epoch || 1, performance.now());
      decoded = result.world;
      if (result.missing && performance.now()-(this.lastResyncAt??-Infinity)>=1000) {
        this.lastResyncAt=performance.now(); const peer=this.peers.get(this.host);
        if(peer?.ready)this.reliable(peer,{t:'resync'});
      }
    }
    if (!decoded) return;
    if (decoded.checkpoint) {
      const recovery = captureRecovery(decoded, this.chat || [], this.music || emptyMusic());
      if (recovery && decoded.seq > (this.lastRecovery?.world.epoch === decoded.epoch ? this.lastRecovery.world.seq : -1)) {
        this.lastRecovery = recovery;
        const peer = this.peers.get(this.host); if (peer?.ready) this.reliable(peer, { t: 'receipt', seq: decoded.seq });
      }
    }
    if (decoded.seq <= this.lastSequence) return;
    message = decoded; const weapons = decoded.weapons;
    this.lastSnapshot = decoded;
    if (this.migrating) this.clockOffset = message.now - performance.now();
    this.migrating = false; this.frozenTime = null;
    this.coordinator().role(this.epoch || 1, false, performance.now());
    this.weapons = weapons;
    this.ball = decoded.ball; this.fire = decoded.fire;
    this.lastSequence = message.seq; this.lastState = performance.now();
    const present = new Set();
    for (const state of message.players) {
      const member = this.members.find(m => m.id === state.id);
      if (!member) continue;
      present.add(state.id);
      const old = this.players.get(state.id), next = { ...member, ...state };
      if (old) {
        const changedMap = old.mapRevision !== state.mapRevision || old.mapId !== state.mapId;
        const reset = changedMap || old.respawns !== state.respawns || old.seatId !== state.seatId || old.motion !== state.motion || old.carriedBy !== state.carriedBy || Math.hypot(old.x - state.x, old.y - state.y) > 1;
        if (changedMap && state.id === this.player) { this.input = { dx: 0, dy: 0, sitting: false }; this.poseSent = null; }
        if(state.id===this.player&&old.seatId!==state.seatId&&state.seatId){this.input={dx:0,dy:0,sitting:true};this.poseSent='sitting';}
        const x = old.x, y = old.y, z = old.z;
        Object.assign(old, next, { targetX: state.x, targetY: state.y, targetZ: state.z });
        if (!reset) { old.x = x + (state.x - x) * .3; old.y = y + (state.y - y) * .3; old.z = z + (state.z - z) * .3; }
      } else this.players.set(state.id, next);
    }
    for (const id of this.players.keys()) if (id !== this.player && !present.has(id)) this.players.delete(id);
  }
  attachControl(peer, channel) {
    if (peer.control) peer.control.close();
    peer.control = channel; channel.bufferedAmountLowThreshold = 32_000;
    channel.onbufferedamountlow = () => this.flush(peer);
    channel.onopen = () => this.reliable(peer, { t: 'hello', allowCarry: this.allowCarry });
    channel.onclose = () => {
      if (this.closed || this.peers.get(peer.id) !== peer || peer.control !== channel) return;
      peer.ready = false;
      this.markDisconnected(peer.id);
      if (!this.isHost) this.failPending('연결이 끊어졌어요. 다시 연결한 뒤 시도해 주세요.');
    };
    channel.onmessage = e => {
      if (this.closed || this.peers.get(peer.id) !== peer || peer.control !== channel || typeof e.data !== 'string' || e.data.length > MAX_FRAME_BYTES) return;
      if(new TextEncoder().encode(e.data).byteLength>MAX_FRAME_BYTES)return;
      try {
        const message = JSON.parse(e.data);
        if (message.v !== PROTOCOL_VERSION) { this.notify('게임 버전이 달라요. 모두 새로고침해 주세요.'); return; }
        if (message.epoch !== this.epoch) return;
        if (message.t === 'hello') {
          if (!peer.ready) {
            peer.ready = true;
            if (this.isHost) {
              const member = this.members.find(m => m.id === peer.id);
              if (!member) return;
              if (!this.players.has(peer.id)) this.players.set(peer.id, { ...member, ...spawnPlayer(this.members.findIndex(m => m.id === peer.id)) });
              this.players.get(peer.id).connected = true;
              applyPlayerAction(this.players, peer.id, { kind: 'allow-carry', allow: message.allowCarry !== false }, this.hostNow());
              this.syncRoom(peer);
            } else { this.poseSent = null; this.reliable(peer, { t: 'clock', sent: performance.now() }); }
          }
        } else if (!peer.ready) return;
        else if (this.isHost) {
          if (message.t === 'receipt') {
            if (this.coordinator().receipt(peer.id, message.epoch, message.seq, performance.now())) {
              const recovery = this.pendingRecoveries?.get(message.seq);
              if(recovery) { peer.wireBaseSeq=message.seq; peer.wireBaseAt=this.coordinator().sent.get(message.seq); }
              if (recovery && (this.lastRecovery?.world.epoch !== this.epoch || message.seq > this.lastRecovery.world.seq)) this.lastRecovery = recovery;
              if (this.migrating) this.resumeSimulation();
            }
          } else if (message.t === 'resync') {
            if(performance.now()-(peer.resyncAt??-Infinity)>=1000) {
              peer.resyncAt=performance.now();peer.wireBaseSeq=undefined;
              this.syncRoom(peer);
            }
          } else if (message.t === 'command') {
            if (this.migrating) { this.reliable(peer, { t: 'ack', id: message.action?.id, ok: false, error: '새 방장을 준비하고 있어요.' }); return; }
            const result = this.handleCommand(peer.id, message.action);
            this.reliable(peer, { t: 'ack', id: message.action?.id, ...result });
          } else if (message.t === 'clock' && Number.isFinite(message.sent)) this.reliable(peer, { t: 'clock', sent: message.sent, now: this.hostNow() });
        } else if (peer.id === this.host) {
          if (message.t === 'ack') {
            const pending = this.pending.get(message.id);
            if (pending) {
              clearTimeout(pending.timer); this.pending.delete(message.id);
              if (message.ok) pending.resolve(message); else pending.reject(new Error(message.error || '요청이 거절됐어요.'));
            }
          } else if (message.t === 'clock' && Number.isFinite(message.sent) && Number.isFinite(message.now)) this.clockOffset = message.now - (message.sent + performance.now()) / 2;
          else if (message.t === 'state') this.receiveWorld(message);
          else if (message.t === 'music' && message.music && Number.isSafeInteger(message.music.revision) && (this.musicEpoch !== this.epoch || message.music.revision >= this.music.revision)) { this.musicEpoch = this.epoch; this.music = message.music; this.callbacks.music?.(this.music); }
          else if (message.t === 'history' && Array.isArray(message.entries) && message.entries.length <= 20 && message.entries.every(validChatEntry)) {
            this.chat = (message.reset ? [] : this.chat).concat(message.entries).slice(-100); this.callbacks.chat?.(this.chat);
          } else if (message.t === 'chat' && validChatEntry(message.entry)) {
            if (!this.chat.some(m => m.id === message.entry.id)) {
              this.chat = [...this.chat, message.entry].slice(-100);
              if (message.entry.kind === 'call') this.callbacks.call?.(message.entry);
            }
            this.callbacks.chat?.(this.chat);
          }
        }
      } catch { /* Invalid control frames do not affect the simulation. */ }
    };
  }
  async signal(to, signal) {
    if (this.closed) return;
    await this.request('room', { op: 'signal', code: this.code, player: this.player, epoch: this.epoch, to, signal: { ...signal, epoch: this.epoch } });
  }
  async poll() {
    if (this.closed || this.leaving) return;
    let delay = 1200;
    let roomResponseReceived = false;
    try {
      const recovery = this.lastRecovery?.world;
      const data = await this.request('room?' + new URLSearchParams({ code: this.code, player: this.player, after: String(this.after), epoch: String(this.epoch),
        ready: recovery && !(this.schedulerLagUntil > performance.now()) ? '1' : '0', recoveryEpoch: String(recovery?.epoch || 0), recoverySeq: String(recovery?.seq ?? -1), recoveryTime: String(Math.floor(recovery?.now || 0)),
        renew: this.coordinator().canRenew(this, performance.now()) ? '1' : '0' }));
      roomResponseReceived = true;
      if (this.closed || this.leaving) return;
      this.failures = 0; this.members = data.members;
      if (data.recoveryWaiting) this.notify('복구할 수 있는 친구의 연결을 기다리는 중');
      if (data.epoch > this.epoch || data.host !== this.host) this.changeHost(data.host, data.epoch);
      if (this.isHost && this.migrating && this.members.every(m => m.active === 0 || m.id === this.player || m.id === this.previousHost)) this.resumeSimulation();
      const ids = new Set(data.members.map(m => m.id));
      for (const [id, peer] of this.peers) if (!ids.has(id)) { this.closePeer(peer); this.peers.delete(id); }
      for (const id of this.players.keys()) if (!ids.has(id)) { releaseCarry(this.players, this.players.get(id), true); this.players.delete(id); this.inputs.delete(id); this.ledger.forget(id); }
      for (const member of data.members) {
        const player = this.players.get(member.id);
        if (player) Object.assign(player, member);
      }
      // Negotiate different guests concurrently; keep each guest's SDP/ICE order intact.
      const bySender = new Map();
      for (const item of data.signals) {
        if (!bySender.has(item.sender)) bySender.set(item.sender, []);
        bySender.get(item.sender).push(item);
      }
      await Promise.all([...bySender.values()].map(async items => {
        for (const item of items) {
          if (this.closed) return;
          try { await this.receiveSignal(item.sender, item.data); }
          catch { if (!this.closed) this.notify('연결을 다시 확인하고 있어요'); }
        }
      }));
      if (this.closed || this.leaving) return;
      if (data.signals.length) this.after = data.signals.at(-1).id;
      if (!this.isHost && !this.peers.has(this.host) && this.attempts < 3) await this.connect();
      this.callbacks.members?.(data.members);
      const negotiating = [...this.peers.values()].some(p => p.pc.connectionState !== 'connected');
      delay = negotiating ? 800 : 3000;
    } catch (error) {
      if (this.closed || this.leaving) return;
      // A rejected offer to a departing host is not proof that the room ended.
      if (!roomResponseReceived && [401, 403, 404, 410].includes(error.status)) {
        this.destroy(false); this.callbacks.ended?.(error.message); return;
      }
      this.failures++;
      if (this.failures >= 3) this.notify('로비 연결을 다시 시도하고 있어요');
      delay = Math.min(10_000, 1500 * this.failures);
    }
    if (!this.closed) this.pollTimer = setTimeout(() => this.poll(), delay);
  }
  changeHost(host, epoch) {
    if (!Number.isSafeInteger(epoch) || epoch <= this.epoch) return;
    const recovery = this.lastRecovery;
    const snapshot = recovery?.world || null;
    this.frozenTime = snapshot?.now ?? this.hostNow();
    this.isHost = false; this.migrating = true;
    this.failPending('방장이 변경됐어요. 연결 후 다시 시도해 주세요.');
    for (const peer of this.peers.values()) this.closePeer(peer);
    this.peers.clear(); this.pendingIce.clear(); this.inputs.clear();
    this.previousHost = this.host; this.host = host; this.epoch = epoch; this.isHost = host === this.player;
    this.lastSequence = -1; this.sequence = 0; this.attempts = 0; this.lastBroadcast = 0; this.lastClock = 0; this.after = 0;
    this.input = { dx: 0, dy: 0, sitting: false }; this.ledger = new CommandLedger();
    this.lastWorldSignature = null; this.musicEpoch = 0; this.pendingRecoveries = new Map(); this.handoffUntil = performance.now() + HOST_LEASE;
    this.wireReceiver = new WireReceiver(); this.lastResyncAt = -Infinity; this.stateDirty = false; this.lastCheckpoint = 0;
    this.coordinator().role(epoch, this.isHost, performance.now(), true);
    if (this.isHost) {
      if (!snapshot) { this.players = new Map(); this.weapons = emptyWeapons(); this.ball = emptyBall(); this.fire=emptyFire(this.hostNow()); this.chat = []; this.music = emptyMusic(); }
      // Keep the camp's logical time at its last snapshot: suspended flight/fuses resume, never fast-forward.
      if (snapshot) {
        this.clockOffset = snapshot.now - performance.now();
        if (recovery) {
          const restored = restoreRecovery(recovery, this.members);
          this.players = restored.players; this.weapons = restored.weapons; this.ball = restored.ball; this.fire=restored.fire; this.chat = restored.chat; this.music = restored.music;
          this.callbacks.chat?.(this.chat); this.callbacks.music?.(this.music);
        }
        else { this.weapons = readWeapons(snapshot.weapons) || emptyWeapons(); this.players = new Map(snapshot.players.filter(p => this.members.some(m => m.id === p.id)).map(p => [p.id, { ...p, connected: true }])); }
      }
      for (const member of this.members) {
        if (!this.players.has(member.id)) this.players.set(member.id, { ...member, ...spawnPlayer(this.members.indexOf(member)), connected: true });
        else Object.assign(this.players.get(member.id), { name: member.name, color: member.color, avatar: member.avatar, connected: member.active !== 0 || member.id === this.player });
      }
      const former = this.players.get(this.previousHost); if (former) {former.connected = false;if(former.seatId){leaveSeat(former);former.sitting=false;}}
      if (this.members.every(m => m.active === 0 || m.id === this.player || m.id === this.previousHost)) this.resumeSimulation();
    }
    this.lastTick = performance.now(); this.lastState = performance.now();
    this.callbacks.host?.({ host, epoch }); this.notify(this.migrating ? '새 방장에게 연결 중' : '함께 불멍하는 중');
  }
  markDisconnected(id) {
    if (this.isHost && performance.now() < this.handoffUntil && this.members.some(m => m.id === id)) return;
    const p = this.players.get(id); if (p) { p.connected = false;if(p.seatId){leaveSeat(p);p.sitting=false;} if (this.isHost) releaseCarry(this.players, p, true); }
  }
  closePeer(...args) { return this.getTransport().closePeer(...args); }
  makePeer(...args) { return this.getTransport().makePeer(...args); }
  attachChannel(...args) { return this.getTransport().attachChannel(...args); }
  connect(...args) { return this.getTransport().connect(...args); }
  receiveSignal(...args) { return this.getTransport().receiveSignal(...args); }
  retry(...args) { return this.getTransport().retry(...args); }
  refreshIce(...args) { return this.getTransport().refreshIce(...args); }
  send(...args) { return this.getTransport().send(...args); }
  tick() {
    if (this.closed) return;
    const now = performance.now(), elapsed = now - this.lastTick;
    if (elapsed < 16) return;
    const dt = Math.min(1, elapsed / 1000); this.lastTick = now;
    if (elapsed > 250) this.schedulerLagUntil = now + 5000;
    for (const peer of this.peers.values()) this.flush(peer);
    if (this.migrating) return;
    if (this.isHost) {
      // Long OS suspension freezes the unprocessed part of camp time; never replay minutes of stale input.
      if (elapsed > 1000) this.clockOffset = (this.clockOffset || 0) - (elapsed - 1000);
      if (this.handoffUntil && now >= this.handoffUntil) {
        this.handoffUntil = 0;
        for (const id of this.players.keys()) if (id !== this.player && !this.peers.get(id)?.ready) this.markDisconnected(id);
      }
      const activeInputs = new Map();
      for (const [id, player] of this.players) {
        const input = id === this.player ? this.input : this.inputs.get(id);
        if (input && (id === this.player || now - input.at < 700) && player.connected) activeInputs.set(id, input);
        else if (player.crouching) player.crouching = false;
      }
      this.ball ||= emptyBall();
      simulateWorld(this.players, activeInputs, dt, this.hostNow(), this.weapons, this.ball);
      if (now - this.lastBroadcast >= 66) {
        this.lastBroadcast = now;
        const checkpoint = now - this.lastCheckpoint >= 1000; if (checkpoint) this.lastCheckpoint = now;
        if(checkpoint){this.stateDirty=false;this.publishWorld(true);}
        else if(this.stateDirty)this.flushStateUpdate();
        else this.publishWorld();
      } else this.flushStateUpdate();
    } else {
      const self = this.players.get(this.player), peer = this.peers.get(this.host);
      if (self && peer?.ready && peer.channel?.readyState === 'open' && now - this.lastState < 3000) movePlayer(self, this.input, dt, true);
      for (const [id, p] of this.players) if ((id !== this.player || p.thrown) && Number.isFinite(p.targetX)) { p.x += (p.targetX - p.x) * .3; p.y += (p.targetY - p.y) * .3; }
      for (const p of this.players.values()) if (Number.isFinite(p.targetZ)) p.z += (p.targetZ - p.z) * .3;
      if (peer?.ready && self && now - this.lastBroadcast >= 50) { this.lastBroadcast = now; this.send(peer, JSON.stringify({ t: 'input', v: PROTOCOL_VERSION, epoch: this.epoch, mapRevision: self.mapRevision, ...this.input })); }
      if (peer?.ready && now - this.lastClock >= 5000) { this.lastClock = now; this.reliable(peer, { t: 'clock', sent: now }); }
      if (peer?.channel?.readyState === 'open' && now - this.lastState > 5000) this.notify('방장의 게임 응답을 기다리는 중');
    }
  }
  destroy(leave = true, immediate = false) {
    if (this.closed) return;
    if (leave && !immediate && this.isHost && !this.leaving && [...this.peers.values()].some(p=>p.ready)) {
      // A normal departure drains the final coherent checkpoint before closing
      // RTC. Page termination/crashes remain best effort and use the last receipt.
      this.leaving=true;this.stopTick?.();clearInterval(this.timer);clearTimeout(this.pollTimer);
      this.frozenTime=this.hostNow();this.migrating=true;
      const final=this.checkpointMessage(),started=performance.now();this.broadcastControl(final);
      const drain=()=>{
        const confirmed=[...this.peers.values()].every(p=>!p.ready||(this.coordinator().receipts.get(p.id)?.seq??-1)>=final.seq);
        if(confirmed||performance.now()-started>=1200)this.finishDestroy(true);
        else this.leaveTimer=setTimeout(drain,20);
      };
      drain();return;
    }
    if(leave&&immediate&&this.isHost)this.publishWorld(true);
    this.finishDestroy(leave);
  }
  finishDestroy(leave) {
    if(this.closed)return;
    clearTimeout(this.leaveTimer);
    this.closed = true; this.stopTick?.(); clearInterval(this.timer); clearTimeout(this.pollTimer);
    this.coordinator().phase = 'closed';
    this.failPending('방 연결이 종료됐어요.');
    this.lifecycle?.removeEventListener('pagehide', this.onPageHide);
    for (const peer of this.peers.values()) this.closePeer(peer);
    if (leave) {
      const payload = JSON.stringify({ op: 'leave', code: this.code, player: this.player });
      const sent = this.beacon(payload);
      if (!sent) this.request('room', JSON.parse(payload), { keepalive: true }).catch(() => {});
    }
  }
}
