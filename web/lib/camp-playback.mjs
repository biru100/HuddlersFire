import { musicPosition, parseYouTubeUrl } from './camp-media.mjs';

// One controller per iframe; opening dialogs never recreates the player or resets its clock.
export class MusicPlayback {
  constructor(player, getState, now = () => performance.now()) {
    this.player = player; this.getState = getState; this.now = now;
    this.ready = false; this.visible = false; this.track = null; this.transport = -1;
    this.suppressUntil = 0; this.lastReport = 0; this.stopped = false;
  }
  suppress() { this.suppressUntil = this.now() + 1800; }
  syncAudio() {
    if (!this.ready || this.stopped) return;
    const { volume, muted } = this.getState();
    if (this.volume !== volume) { this.player.setVolume(volume); this.volume = volume; }
    if (this.muted !== muted) {
      if (muted) this.player.mute(); else this.player.unMute();
      this.muted = muted;
    }
  }
  sync(visible = this.visible) {
    const becameVisible = visible && !this.visible;
    this.visible = visible;
    if (!this.ready || this.stopped) return;
    this.syncAudio();
    const p = this.player, s = this.getState(), m = s.music;
    if (s.suspended?.()) {
      if ([1, 3].includes(p.getPlayerState())) { this.suppress(); p.pauseVideo(); }
      this.transport = -1; return;
    }
    if (!m.current) {
      if (this.track) { this.suppress(); p.stopVideo(); }
      this.track = null; return;
    }
    const position = musicPosition(m, s.hostNow());
    if (this.track !== m.current.id) {
      this.suppress(); this.track = m.current.id; this.transport = m.transport;
      const options = { videoId: m.current.videoId, startSeconds: position };
      if (m.playing) p.loadVideoById(options); else p.cueVideoById(options);
    } else if (this.transport !== m.transport || becameVisible) {
      this.suppress(); this.transport = m.transport; p.seekTo(position, true);
      if (m.playing) p.playVideo(); else p.pauseVideo();
    } else if (!s.isHost && m.playing && p.getPlayerState() === 1 && Math.abs(p.getCurrentTime() - position) > 1.5) {
      this.suppress(); p.seekTo(position, true);
    }
    if (s.isHost && m.playing && p.getPlayerState() === 1 && this.now() > this.suppressUntil && this.now() - this.lastReport > 5000) {
      this.lastReport = this.now();
      void s.command('music-control', { op: 'sync', currentId: m.current.id, position: p.getCurrentTime() }).catch(() => {});
    }
  }
  onStateChange(state) {
    if (this.stopped || !this.ready) return;
    const { music: m, isHost, command } = this.getState(), p = this.player;
    if (this.getState().suspended?.() || !isHost || !m.current || this.track !== m.current.id || parseYouTubeUrl(p.getVideoUrl()) !== m.current.videoId) return;
    if (state === 0) {
      // An ended event may arrive more than once before the next snapshot.
      if (this.endedTrack === m.current.id) return;
      this.endedTrack = m.current.id;
      void command('music-control', { op: 'skip', currentId: m.current.id }).catch(() => { this.endedTrack = null; });
    // A browser may pause a hidden iframe. That is not a host request to pause everyone.
    } else if (this.visible && this.now() > this.suppressUntil && ((state === 2 && m.playing) || (state === 1 && !m.playing))) {
      const id = m.current.id;
      void command('music-control', { op: 'sync', currentId: id, position: p.getCurrentTime() })
        .then(() => { if (this.getState().music.current?.id === id) return command('music-control', { op: state === 2 ? 'pause' : 'play' }); })
        .catch(() => {});
    }
  }
  resume() {
    const m = this.getState().music;
    if (!this.ready || this.stopped || !m.current) return;
    this.suppress(); this.player.seekTo(musicPosition(m, this.getState().hostNow()), true);
    if (m.playing) this.player.playVideo();
  }
  destroy() { this.stopped = true; this.player.destroy(); }
}
