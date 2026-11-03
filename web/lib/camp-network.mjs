import { movePlayer, sanitizeInput, spawnPlayer, validPlayerState, simulateWorld, applyPlayerAction, releaseCarry } from './camp-world.mjs';
import { PROTOCOL_VERSION, MAX_FRAME_BYTES, validAction, chatText, CommandLedger } from './camp-protocol.mjs';
import { emptyMusic, applyMusicAction } from './camp-media.mjs';

export async function api(path, data, extra = {}) {
  const response = await fetch('/api/camp/' + path, {
    method: data === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
    ...(data === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    signal: AbortSignal.timeout(12_000), ...extra,
  });
  const value = await response.json().catch(() => ({ error: '서버 응답을 확인할 수 없습니다.' }));
  if (!response.ok) throw Object.assign(new Error(value.error || '연결하지 못했습니다.'), { status: response.status });
  return value;
}

export class CampNetwork {
  constructor(info, profile, callbacks = {}, runtime = {}) {
    this.code = info.code; this.player = info.player; this.host = info.host;
    this.iceServers = info.iceServers; this.turnConfigured = info.turnConfigured;
    this.iceRefreshAt = Date.now() + 50 * 60_000;
    this.isHost = info.player === info.host;
    this.callbacks = callbacks;
    // Explicit adapters let CLI integration tests exercise the real protocol without operating a browser.
    this.request = runtime.request || api;
    this.PeerConnection = runtime.PeerConnection || globalThis.RTCPeerConnection;
    this.lifecycle = runtime.lifecycle || globalThis.window;
    this.beacon = runtime.beacon || (payload => globalThis.navigator?.sendBeacon?.('/api/camp/room', new Blob([payload], { type: 'application/json' })));
    this.players = new Map([[this.player, { ...profile, id: this.player, ...spawnPlayer(), connected: this.isHost }]]);
    this.members = [];
    this.peers = new Map();
    this.pendingIce = new Map();
    this.inputs = new Map();
    this.input = { dx: 0, dy: 0, sitting: false };
    this.after = 0; this.closed = false; this.failures = 0; this.attempts = 0;
    this.lastState = performance.now(); this.lastBroadcast = 0; this.lastTick = performance.now();
    this.lastSequence = -1; this.sequence = 0;
    this.chat = []; this.music = emptyMusic(); this.ledger = new CommandLedger(); this.pending = new Map();
    this.clockOffset = 0; this.lastClock = 0; this.poseSent = null;
    this.status = this.isHost ? '모닥불을 피웠어요' : '친구들과 연결하는 중';
    this.onPageHide = () => this.destroy(true);
    this.lifecycle?.addEventListener('pagehide', this.onPageHide);
    this.timer = setInterval(() => this.tick(), 33);
    this.poll();
  }
  notify(status) { if (this.status !== status) { this.status = status; this.callbacks.status?.(status); } }
  setInput(input) {
    this.input = sanitizeInput(input) || { dx: 0, dy: 0, sitting: false };
    const posture = input?.crouching ? 'crouching' : this.input.sitting ? 'sitting' : 'standing';
    if (posture !== this.poseSent && (this.isHost || this.peers.get(this.host)?.ready)) {
      this.poseSent = posture;
      this.command('posture', { posture }).catch(() => {});
    }
  }
  hostNow() { return performance.now() + this.clockOffset; }
  command(kind, data = {}) {
    const action = { ...data, kind, id: crypto.randomUUID() };
    if (this.closed) return Promise.reject(new Error('방 연결이 종료됐어요.'));
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
    if (!validAction(action)) return { ok: false, error: '올바르지 않은 요청이에요.' };
    const cached = this.ledger.cached(sender, action.id); if (cached) return cached;
    const now = performance.now(), member = this.players.get(sender);
    let error = !member || member.connected === false ? '참가자 연결을 확인해 주세요.' : null;
    if (!error && !this.ledger.permit(sender, action.kind, now)) error = '잠깐 기다렸다가 다시 해주세요.';
    if (!error) {
      if (action.kind === 'chat') {
        const text = chatText(action.text);
        if (!text) error = '메시지를 입력해 주세요.';
        else {
          const entry = { id: action.id, by: sender, name: member.name, color: member.color, text, at: now };
          this.chat = [...this.chat, entry].slice(-100);
          member.bubble = text; member.bubbleUntil = now + 5000;
          this.broadcastControl({ t: 'chat', entry }); this.callbacks.chat?.(this.chat);
        }
      } else if (action.kind.startsWith('music-')) {
        error = applyMusicAction(this.music, action, member, sender === this.host, now);
        if (!error) { this.broadcastControl({ t: 'music', music: this.music }); this.callbacks.music?.(this.music); }
      } else error = applyPlayerAction(this.players, sender, action, now);
    }
    const result = { ok: !error, ...(error ? { error } : {}) };
    this.ledger.record(sender, action.id, result);
    if (!error && !action.kind.startsWith('music-')) this.publishWorld(true);
    return result;
  }
  reliable(peer, value) {
    if (peer.control?.readyState !== 'open') return false;
    const frame = JSON.stringify({ ...value, v: PROTOCOL_VERSION });
    const bytes = new TextEncoder().encode(frame).byteLength;
    if (bytes > MAX_FRAME_BYTES || peer.queueBytes + bytes > 512_000) {
      this.notify('연결이 혼잡해서 다시 연결해야 해요.'); this.closePeer(peer); return false;
    }
    peer.queue.push({ frame, bytes }); peer.queueBytes += bytes; this.flush(peer); return true;
  }
  flush(peer) {
    while (peer.control?.readyState === 'open' && peer.control.bufferedAmount < 64_000 && peer.queue.length) {
      const item = peer.queue[0];
      try { peer.control.send(item.frame); peer.queue.shift(); peer.queueBytes -= item.bytes; }
      catch { break; }
    }
  }
  broadcastControl(value) { for (const peer of this.peers.values()) if (peer.ready) this.reliable(peer, value); }
  syncRoom(peer) {
    this.reliable(peer, { t: 'music', music: this.music });
    // Bounded chunks also fit the lowest common browser SCTP message limit with 200-character CJK text.
    for (let i = 0; i < Math.max(1, this.chat.length); i += 20) {
      this.reliable(peer, { t: 'history', reset: i === 0, entries: this.chat.slice(i, i + 20) });
    }
    this.reliable(peer, this.worldMessage());
  }
  worldMessage() {
    return { t: 'state', v: PROTOCOL_VERSION, seq: this.sequence++, players: [...this.players.values()].map(p => ({
      id: p.id, x: p.x, y: p.y, z: p.z, vz: p.vz, motion: p.motion, facing: p.facing, sitting: p.sitting,
      crouching: p.crouching, carrying: p.carrying, carriedBy: p.carriedBy, allowCarry: p.allowCarry,
      emote: p.emote, emoteUntil: p.emoteUntil, bubble: p.bubble, bubbleUntil: p.bubbleUntil,
      moving: p.moving, respawns: p.respawns, connected: p.connected,
    })) };
  }
  publishWorld(reliable = false) {
    const value = this.worldMessage();
    if (reliable) this.broadcastControl(value);
    else { const frame = JSON.stringify(value); for (const peer of this.peers.values()) if (peer.ready) this.send(peer, frame); }
  }
  receiveWorld(message) {
    if (!Array.isArray(message.players) || message.players.length > 16 || !Number.isSafeInteger(message.seq) || message.seq <= this.lastSequence) return;
    this.lastSequence = message.seq; this.lastState = performance.now();
    const present = new Set();
    for (const state of message.players) {
      const member = this.members.find(m => m.id === state.id);
      if (!member || !validPlayerState(state)) continue;
      present.add(state.id);
      const old = this.players.get(state.id), next = { ...member, ...state };
      if (old) {
        const reset = old.respawns !== state.respawns || old.motion !== state.motion || old.carriedBy !== state.carriedBy || Math.hypot(old.x - state.x, old.y - state.y) > 1;
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
    channel.onopen = () => this.reliable(peer, { t: 'hello' });
    channel.onclose = () => {
      peer.ready = false;
      const p = this.players.get(peer.id); if (p) { p.connected = false; if (this.isHost) releaseCarry(this.players, p, true); }
      if (!this.isHost) this.failPending('연결이 끊어졌어요. 다시 연결한 뒤 시도해 주세요.');
    };
    channel.onmessage = e => {
      if (this.closed || this.peers.get(peer.id) !== peer || typeof e.data !== 'string' || e.data.length > MAX_FRAME_BYTES) return;
      try {
        const message = JSON.parse(e.data);
        if (message.v !== PROTOCOL_VERSION) { this.notify('게임 버전이 달라요. 모두 새로고침해 주세요.'); return; }
        if (message.t === 'hello') {
          if (!peer.ready) {
            peer.ready = true;
            if (this.isHost) {
              const member = this.members.find(m => m.id === peer.id);
              if (!member) return;
              if (!this.players.has(peer.id)) this.players.set(peer.id, { ...member, ...spawnPlayer(this.members.findIndex(m => m.id === peer.id)) });
              this.players.get(peer.id).connected = true; this.syncRoom(peer);
            } else { this.poseSent = null; this.reliable(peer, { t: 'clock', sent: performance.now() }); }
          }
        } else if (!peer.ready) return;
        else if (this.isHost) {
          if (message.t === 'command') {
            const result = this.handleCommand(peer.id, message.action);
            this.reliable(peer, { t: 'ack', id: message.action?.id, ...result });
          } else if (message.t === 'clock' && Number.isFinite(message.sent)) this.reliable(peer, { t: 'clock', sent: message.sent, now: performance.now() });
        } else if (peer.id === this.host) {
          if (message.t === 'ack') {
            const pending = this.pending.get(message.id);
            if (pending) {
              clearTimeout(pending.timer); this.pending.delete(message.id);
              if (message.ok) pending.resolve(message); else pending.reject(new Error(message.error || '요청이 거절됐어요.'));
            }
          } else if (message.t === 'clock' && Number.isFinite(message.sent) && Number.isFinite(message.now)) this.clockOffset = message.now - (message.sent + performance.now()) / 2;
          else if (message.t === 'state') this.receiveWorld(message);
          else if (message.t === 'music' && message.music && Number.isSafeInteger(message.music.revision) && message.music.revision >= this.music.revision) { this.music = message.music; this.callbacks.music?.(this.music); }
          else if (message.t === 'history' && Array.isArray(message.entries) && message.entries.length <= 20) {
            this.chat = (message.reset ? [] : this.chat).concat(message.entries).slice(-100); this.callbacks.chat?.(this.chat);
          } else if (message.t === 'chat' && message.entry?.id) {
            if (!this.chat.some(m => m.id === message.entry.id)) this.chat = [...this.chat, message.entry].slice(-100);
            this.callbacks.chat?.(this.chat);
          }
        }
      } catch { /* Invalid control frames do not affect the simulation. */ }
    };
  }
  async signal(to, signal) {
    if (this.closed) return;
    await this.request('room', { op: 'signal', code: this.code, player: this.player, to, signal });
  }
  async poll() {
    if (this.closed) return;
    let delay = 1200;
    try {
      const data = await this.request('room?' + new URLSearchParams({ code: this.code, player: this.player, after: String(this.after) }));
      if (this.closed) return;
      this.failures = 0; this.members = data.members;
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
      if (data.signals.length) this.after = data.signals.at(-1).id;
      if (!this.isHost && !this.peers.has(this.host) && this.attempts < 3) await this.connect();
      this.callbacks.members?.(data.members);
      const negotiating = [...this.peers.values()].some(p => p.pc.connectionState !== 'connected');
      delay = negotiating ? 800 : 3000;
    } catch (error) {
      if (this.closed) return;
      if ([401, 403, 404, 410].includes(error.status)) {
        this.destroy(false); this.callbacks.ended?.(error.message); return;
      }
      this.failures++;
      if (this.failures >= 3) this.notify('로비 연결을 다시 시도하고 있어요');
      delay = Math.min(10_000, 1500 * this.failures);
    }
    if (!this.closed) this.pollTimer = setTimeout(() => this.poll(), delay);
  }
  closePeer(peer) {
    clearTimeout(peer.timeout);
    peer.pc.onconnectionstatechange = null; peer.pc.onicecandidate = null;
    if (peer.channel) { peer.channel.onclose = null; peer.channel.close(); }
    if (peer.control) { peer.control.onclose = null; peer.control.close(); }
    peer.ready = false; peer.queue = []; peer.queueBytes = 0;
    if (!this.isHost) this.failPending('연결을 다시 만드는 중이에요.');
    const player = this.players.get(peer.id);
    if (player) { player.connected = false; if (this.isHost) releaseCarry(this.players, player, true); }
    peer.pc.close();
  }
  makePeer(id, generation) {
    const old = this.peers.get(id); if (old) this.closePeer(old);
    const pc = new this.PeerConnection({ iceServers: this.iceServers });
    const peer = { pc, generation, id, channel: null, control: null, queue: [], queueBytes: 0, ready: false, lastInput: 0 };
    this.peers.set(id, peer);
    pc.onicecandidate = e => {
      if (e.candidate) this.signal(id, { type: 'ice', candidate: e.candidate.toJSON(), generation }).catch(() => this.notify('연결 정보를 다시 보내는 중이에요'));
    };
    pc.ondatachannel = e => this.attachChannel(peer, e.channel);
    pc.onconnectionstatechange = () => {
      if (this.closed || this.peers.get(id) !== peer) return;
      if (pc.connectionState === 'connected') { clearTimeout(peer.timeout); this.notify('함께 불멍하는 중'); }
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        const p = this.players.get(id); if (p) p.connected = false;
        this.notify('친구와의 연결을 확인하는 중');
        if (!this.isHost) {
          clearTimeout(peer.timeout);
          peer.timeout = setTimeout(() => this.retry(false), 4000);
        }
      }
    };
    peer.timeout = setTimeout(() => {
      if (pc.connectionState !== 'connected' && !this.closed) {
        if (!this.isHost) this.retry(false);
      }
    }, 18_000);
    return peer;
  }
  attachChannel(peer, channel) {
    if (channel.label === 'camp-control-v2') { this.attachControl(peer, channel); return; }
    if (channel.label !== 'camp') { channel.close(); return; }
    if (peer.channel) peer.channel.close();
    peer.channel = channel;
    channel.onopen = () => {
      if (this.closed || this.peers.get(peer.id) !== peer) return;
      const member = this.members.find(m => m.id === peer.id);
      if (this.isHost && member && !this.players.has(peer.id)) {
        this.players.set(peer.id, { ...member, ...spawnPlayer(this.members.findIndex(m => m.id === peer.id)), connected: true });
      }
      const p = this.players.get(peer.id); if (p) p.connected = true;
      const self = this.players.get(this.player); if (self) self.connected = true;
      this.notify('함께 불멍하는 중');
    };
    channel.onmessage = e => {
      if (this.closed || this.peers.get(peer.id) !== peer) return;
      if (typeof e.data !== 'string' || e.data.length > 24_000) return;
      try {
        const message = JSON.parse(e.data);
        if (message.v !== PROTOCOL_VERSION) { this.notify('게임 버전이 달라요. 모두 새로고침해 주세요.'); return; }
        if (!peer.ready) return;
        if (this.isHost) {
          const input = message.t === 'input' ? sanitizeInput(message) : null;
          if (input) this.inputs.set(peer.id, { ...input, at: performance.now() });
        } else if (peer.id === this.host && message.t === 'state') this.receiveWorld(message);
      } catch { /* Ignore malformed peer data. */ }
    };
    channel.onclose = () => { const p = this.players.get(peer.id); if (p) p.connected = false; };
  }
  async connect() {
    if (this.closed || this.isHost) return;
    await this.refreshIce();
    if (this.closed) return;
    this.attempts++; this.lastSequence = -1;
    const generation = crypto.randomUUID(), peer = this.makePeer(this.host, generation);
    this.attachChannel(peer, peer.pc.createDataChannel('camp', { ordered: false, maxRetransmits: 0 }));
    this.attachChannel(peer, peer.pc.createDataChannel('camp-control-v2', { ordered: true }));
    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(offer);
    await this.signal(this.host, { type: 'offer', sdp: offer.sdp, generation });
  }
  async receiveSignal(id, data) {
    if (!this.members.some(m => m.id === id)) return;
    if (!this.isHost && id !== this.host) return;
    let peer = this.peers.get(id);
    if (data.type === 'offer' && this.isHost) {
      await this.refreshIce();
      if (this.closed) return;
      peer = this.makePeer(id, data.generation);
      await peer.pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      await this.signal(id, { type: 'answer', sdp: answer.sdp, generation: data.generation });
    } else if (data.type === 'answer' && peer?.generation === data.generation && !this.isHost) {
      await peer.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
    } else if (data.type === 'ice') {
      if (peer?.generation === data.generation && peer.pc.remoteDescription) await peer.pc.addIceCandidate(data.candidate);
      else {
        const key = id + ':' + data.generation;
        const pending = this.pendingIce.get(key) || [];
        if (pending.length < 40 && this.pendingIce.size < 64) { pending.push(data.candidate); this.pendingIce.set(key, pending); }
      }
    }
    if (peer?.pc.remoteDescription) {
      const key = id + ':' + peer.generation;
      for (const candidate of this.pendingIce.get(key) || []) await peer.pc.addIceCandidate(candidate).catch(() => {});
      this.pendingIce.delete(key);
    }
  }
  retry(manual = true) {
    if (this.closed || this.isHost) return;
    if (manual) this.attempts = 0;
    const peer = this.peers.get(this.host); if (peer) this.closePeer(peer);
    this.peers.delete(this.host);
    if (this.attempts < 3) {
      this.notify('다시 연결하는 중');
      this.connect().catch(() => this.notify('연결하지 못했어요. 다시 연결을 눌러 주세요'));
    } else this.notify('직접 연결이 어려워요. 다시 연결하거나 다른 네트워크를 사용해 주세요');
  }
  async refreshIce() {
    if (Date.now() < this.iceRefreshAt) return;
    if (!this.refreshingIce) this.refreshingIce = this.request('session').then(config => {
      if (config.iceServers) this.iceServers = config.iceServers;
      this.turnConfigured = config.turnConfigured;
      this.iceRefreshAt = Date.now() + 50 * 60_000;
    }).finally(() => { this.refreshingIce = null; });
    await this.refreshingIce;
  }
  send(peer, message) {
    if (peer.channel?.readyState === 'open' && peer.channel.bufferedAmount < 64_000) {
      try { peer.channel.send(message); } catch { /* Backpressure or a just-closed connection. */ }
    }
  }
  tick() {
    if (this.closed) return;
    const now = performance.now(), dt = Math.min(.1, (now - this.lastTick) / 1000); this.lastTick = now;
    for (const peer of this.peers.values()) this.flush(peer);
    if (this.isHost) {
      const activeInputs = new Map();
      for (const [id, player] of this.players) {
        const input = id === this.player ? this.input : this.inputs.get(id);
        if (input && (id === this.player || now - input.at < 700) && player.connected) activeInputs.set(id, input);
        else if (player.crouching) player.crouching = false;
      }
      simulateWorld(this.players, activeInputs, dt, now);
      if (now - this.lastBroadcast >= 66) {
        this.lastBroadcast = now;
        this.publishWorld();
      }
    } else {
      const self = this.players.get(this.player), peer = this.peers.get(this.host);
      if (self && peer?.ready && peer.channel?.readyState === 'open' && now - this.lastState < 3000) movePlayer(self, this.input, dt, true);
      for (const [id, p] of this.players) if (id !== this.player && Number.isFinite(p.targetX)) { p.x += (p.targetX - p.x) * .3; p.y += (p.targetY - p.y) * .3; }
      for (const p of this.players.values()) if (Number.isFinite(p.targetZ)) p.z += (p.targetZ - p.z) * .3;
      if (peer?.ready && now - this.lastBroadcast >= 50) { this.lastBroadcast = now; this.send(peer, JSON.stringify({ t: 'input', v: PROTOCOL_VERSION, ...this.input })); }
      if (peer?.ready && now - this.lastClock >= 5000) { this.lastClock = now; this.reliable(peer, { t: 'clock', sent: now }); }
      if (peer?.channel?.readyState === 'open' && now - this.lastState > 5000) this.notify('방장의 게임 응답을 기다리는 중');
    }
  }
  destroy(leave = true) {
    if (this.closed) return;
    this.closed = true; clearInterval(this.timer); clearTimeout(this.pollTimer);
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
