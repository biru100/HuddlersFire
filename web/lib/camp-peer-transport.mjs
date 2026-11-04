import { PROTOCOL_VERSION, MAX_FRAME_BYTES } from './camp-protocol.mjs';
import { spawnPlayer, sanitizeInput } from './camp-world.mjs';

// RTC negotiation, channels and backpressure; the session owns authority and game state.
export class PeerTransport {
  constructor(session) { this.session = session; }
  reliable(peer, value, encoded) {
    if (peer.control?.readyState !== 'open') return false;
    const frame = encoded || (value.t === 'state' && value.players ? this.session.frameForPeer(value,peer) : JSON.stringify({ ...value, v: PROTOCOL_VERSION, epoch: this.session.epoch || 1 }));
    const bytes = new TextEncoder().encode(frame).byteLength;
    const key = value.t==='state' ? value.checkpoint ? 'checkpoint' : 'live' : null;
    // Only replace unsent state. Acks, chat, music and history retain FIFO delivery.
    if(key) for(let i=peer.queue.length-1;i>=0;i--) if(peer.queue[i].key===key){peer.queueBytes-=peer.queue[i].bytes;peer.queue.splice(i,1);}
    if (bytes > MAX_FRAME_BYTES || peer.queueBytes + bytes > 512_000) {
      this.session.notify('연결이 혼잡해서 다시 연결해야 해요.'); this.session.closePeer(peer); return false;
    }
    peer.queue.push({ frame, bytes, key }); peer.queueBytes += bytes; this.session.flush(peer); return true;
  }
  flush(peer) {
    while (peer.control?.readyState === 'open' && peer.control.bufferedAmount < 64_000 && peer.queue.length) {
      const item = peer.queue[0];
      try { peer.control.send(item.frame); this.record(item.bytes,true,peer); peer.queue.shift(); peer.queueBytes -= item.bytes; }
      catch { break; }
    }
  }
  broadcastControl(value) {
    const cache=new Map();
    for (const peer of this.session.peers.values()) if (peer.ready) this.session.reliable(peer, value, value.t==='state'&&value.players ? this.session.frameForPeer(value,peer,cache) : undefined);
  }
  record(bytes,reliable,peer) {
    const stats=this.session.traffic ||= {volatileBytes:0,reliableBytes:0,volatileFrames:0,reliableFrames:0,droppedVolatile:0,maxBufferedAmount:0};
    stats[reliable?'reliableBytes':'volatileBytes']+=bytes;stats[reliable?'reliableFrames':'volatileFrames']++;
    stats.maxBufferedAmount=Math.max(stats.maxBufferedAmount,peer.control?.bufferedAmount||0,peer.channel?.bufferedAmount||0);
  }
  closePeer(peer) {
    clearTimeout(peer.timeout);
    peer.pc.onconnectionstatechange = null; peer.pc.onicecandidate = null;
    if (peer.channel) { peer.channel.onclose = null; peer.channel.close(); }
    if (peer.control) { peer.control.onclose = null; peer.control.close(); }
    peer.ready = false; peer.queue = []; peer.queueBytes = 0;
    if (!this.session.isHost) this.session.failPending('연결을 다시 만드는 중이에요.');
    this.session.markDisconnected(peer.id);
    peer.pc.close();
  }
  makePeer(id, generation) {
    const old = this.session.peers.get(id); if (old) this.session.closePeer(old);
    const pc = new this.session.PeerConnection({ iceServers: this.session.iceServers });
    const peer = { pc, generation, epoch: this.session.epoch, id, channel: null, control: null, queue: [], queueBytes: 0, ready: false, lastInput: 0 };
    this.session.peers.set(id, peer);
    pc.onicecandidate = e => {
      if (this.session.closed || this.session.peers.get(id) !== peer || peer.epoch !== this.session.epoch) return;
      if (e.candidate) this.session.signal(id, { type: 'ice', candidate: e.candidate.toJSON(), generation }).catch(() => this.session.notify('연결 정보를 다시 보내는 중이에요'));
    };
    pc.ondatachannel = e => this.session.attachChannel(peer, e.channel);
    pc.onconnectionstatechange = () => {
      if (this.session.closed || this.session.peers.get(id) !== peer) return;
      if (pc.connectionState === 'connected') { clearTimeout(peer.timeout); this.session.notify('함께 불멍하는 중'); }
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
      this.session.markDisconnected(id);
        this.session.notify('친구와의 연결을 확인하는 중');
        if (!this.session.isHost) {
          clearTimeout(peer.timeout);
          peer.timeout = setTimeout(() => this.session.retry(false), 4000);
        }
      }
    };
    peer.timeout = setTimeout(() => {
      if (pc.connectionState !== 'connected' && !this.session.closed) {
        if (!this.session.isHost) this.session.retry(false);
      }
    }, 18_000);
    return peer;
  }
  attachChannel(peer, channel) {
    if (channel.label === 'camp-control-v2') { this.session.attachControl(peer, channel); return; }
    if (channel.label !== 'camp') { channel.close(); return; }
    if (peer.channel) peer.channel.close();
    peer.channel = channel;
    channel.onopen = () => {
      if (this.session.closed || this.session.peers.get(peer.id) !== peer || peer.channel !== channel) return;
      const member = this.session.members.find(m => m.id === peer.id);
      if (this.session.isHost && member && !this.session.players.has(peer.id)) {
        this.session.players.set(peer.id, { ...member, ...spawnPlayer(this.session.members.findIndex(m => m.id === peer.id)), connected: !!peer.ready });
      }
      // During handoff the first receipt can resume physics before every control
      // hello arrives. Opening the volatile channel must not disconnect restored
      // players and tear down their carry chains in that interval.
      const p = this.session.players.get(peer.id); if (p && (!this.session.isHost || peer.ready)) p.connected = true;
      const self = this.session.players.get(this.session.player); if (self) self.connected = true;
      this.session.notify('함께 불멍하는 중');
    };
    channel.onmessage = e => {
      if (this.session.closed || this.session.peers.get(peer.id) !== peer || peer.channel !== channel) return;
      if (typeof e.data !== 'string' || e.data.length > MAX_FRAME_BYTES) return;
      if(new TextEncoder().encode(e.data).byteLength>MAX_FRAME_BYTES)return;
      try {
        const message = JSON.parse(e.data);
        if (message.v !== PROTOCOL_VERSION) { this.session.notify('게임 버전이 달라요. 모두 새로고침해 주세요.'); return; }
        if (message.epoch !== this.session.epoch) return;
        if (!peer.ready) return;
        if (this.session.isHost) {
          const input = message.t === 'input' ? sanitizeInput(message) : null;
          if (input) { this.session.tick(); this.session.inputs.set(peer.id, { ...input, at: performance.now() }); }
        } else if (peer.id === this.session.host && message.t === 'state') this.session.receiveWorld(message);
      } catch { /* Ignore malformed peer data. */ }
    };
    channel.onclose = () => {
      if (!this.session.closed && this.session.peers.get(peer.id) === peer && peer.channel === channel) this.session.markDisconnected(peer.id);
    };
  }
  async connect() {
    if (this.session.closed || this.session.isHost) return;
    const epoch = this.session.epoch;
    await this.session.refreshIce();
    if (this.session.closed || this.session.isHost || epoch !== this.session.epoch) return;
    this.session.attempts++; this.session.lastSequence = -1;
    const generation = crypto.randomUUID(), peer = this.session.makePeer(this.session.host, generation);
    this.session.attachChannel(peer, peer.pc.createDataChannel('camp', { ordered: false, maxRetransmits: 0 }));
    this.session.attachChannel(peer, peer.pc.createDataChannel('camp-control-v2', { ordered: true }));
    const offer = await peer.pc.createOffer();
    if (this.session.closed || this.session.peers.get(peer.id) !== peer || epoch !== this.session.epoch) return;
    await peer.pc.setLocalDescription(offer);
    if (this.session.closed || this.session.peers.get(peer.id) !== peer || epoch !== this.session.epoch) return;
    await this.session.signal(this.session.host, { type: 'offer', sdp: offer.sdp, generation });
  }
  async receiveSignal(id, data) {
    if (data.epoch !== this.session.epoch) return;
    if (!this.session.members.some(m => m.id === id)) return;
    if (!this.session.isHost && id !== this.session.host) return;
    let peer = this.session.peers.get(id);
    if (data.type === 'offer' && this.session.isHost) {
      await this.session.refreshIce();
      if (this.session.closed || !this.session.isHost || data.epoch !== this.session.epoch) return;
      peer = this.session.makePeer(id, data.generation);
      await peer.pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      await this.session.signal(id, { type: 'answer', sdp: answer.sdp, generation: data.generation });
    } else if (data.type === 'answer' && peer?.generation === data.generation && !this.session.isHost) {
      await peer.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
    } else if (data.type === 'ice') {
      if (peer?.generation === data.generation && peer.pc.remoteDescription) await peer.pc.addIceCandidate(data.candidate);
      else {
        const key = id + ':' + data.generation;
        const pending = this.session.pendingIce.get(key) || [];
        if (pending.length < 40 && this.session.pendingIce.size < 64) { pending.push(data.candidate); this.session.pendingIce.set(key, pending); }
      }
    }
    if (peer?.pc.remoteDescription) {
      const key = id + ':' + peer.generation;
      for (const candidate of this.session.pendingIce.get(key) || []) await peer.pc.addIceCandidate(candidate).catch(() => {});
      this.session.pendingIce.delete(key);
    }
  }
  retry(manual = true) {
    if (this.session.closed || this.session.isHost) return;
    if (manual) this.session.attempts = 0;
    const peer = this.session.peers.get(this.session.host); if (peer) this.session.closePeer(peer);
    this.session.peers.delete(this.session.host);
    if (this.session.attempts < 3) {
      this.session.notify('다시 연결하는 중');
      this.session.connect().catch(() => this.session.notify('연결하지 못했어요. 다시 연결을 눌러 주세요'));
    } else this.session.notify('직접 연결이 어려워요. 다시 연결하거나 다른 네트워크를 사용해 주세요');
  }
  async refreshIce() {
    if (Date.now() < this.session.iceRefreshAt) return;
    if (!this.session.refreshingIce) this.session.refreshingIce = this.session.request('session').then(config => {
      if (config.iceServers) this.session.iceServers = config.iceServers;
      this.session.turnConfigured = config.turnConfigured;
      this.session.iceRefreshAt = Date.now() + 50 * 60_000;
    }).finally(() => { this.session.refreshingIce = null; });
    await this.session.refreshingIce;
  }
  send(peer, message) {
    if (peer.channel?.readyState === 'open' && peer.channel.bufferedAmount < 64_000) {
      try { peer.channel.send(message); this.record(new TextEncoder().encode(message).byteLength,false,peer); return true; } catch { /* Backpressure or a just-closed connection. */ }
    }
    this.record(0,false,peer);this.session.traffic.volatileFrames--;this.session.traffic.droppedVolatile++;return false;
  }
}
