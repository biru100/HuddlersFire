'use client';
import { useEffect, useRef, useState } from 'react';
import { musicPosition, parseYouTubeUrl } from '@/lib/camp-media.mjs';

type Track = { id: string; videoId: string; by: string; name: string };
export type MusicState = { revision: number; transport: number; current: Track | null; queue: Track[]; playing: boolean; position: number; anchor: number };
type Player = {
  loadVideoById: (options: { videoId: string; startSeconds: number }) => void;
  cueVideoById: (options: { videoId: string; startSeconds: number }) => void;
  playVideo: () => void; pauseVideo: () => void; stopVideo: () => void; destroy: () => void;
  seekTo: (seconds: number, ahead: boolean) => void; getCurrentTime: () => number; getPlayerState: () => number;
  getVideoUrl: () => string; setVolume: (volume: number) => void;
};
type YouTube = { Player: new (element: HTMLElement, options: Record<string, unknown>) => Player };
let youtubeLoading: Promise<YouTube> | null = null;
function loadYouTube(): Promise<YouTube> {
  const ytWindow = window as unknown as { YT?: YouTube; onYouTubeIframeAPIReady?: () => void };
  if (ytWindow.YT?.Player) return Promise.resolve(ytWindow.YT);
  if (youtubeLoading) return youtubeLoading;
  youtubeLoading = new Promise((resolve, reject) => {
    const previous = ytWindow.onYouTubeIframeAPIReady;
    const timer = window.setTimeout(() => { youtubeLoading = null; reject(new Error('YouTube에 연결하지 못했어요. 다시 시도해 주세요.')); }, 15000);
    ytWindow.onYouTubeIframeAPIReady = () => { previous?.(); window.clearTimeout(timer); if (ytWindow.YT) resolve(ytWindow.YT); };
    let script = document.getElementById('camp-youtube-api') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script'); script.id = 'camp-youtube-api'; script.src = 'https://www.youtube.com/iframe_api'; script.async = true;
      script.onerror = () => { window.clearTimeout(timer); youtubeLoading = null; script?.remove(); reject(new Error('YouTube를 불러오지 못했어요. 네트워크를 확인해 주세요.')); };
      document.head.appendChild(script);
    }
  });
  return youtubeLoading;
}
type Props = { music: MusicState; isHost: boolean; hostNow: () => number; command: (kind: string, data?: Record<string, unknown>) => Promise<unknown> };
export default function MusicPanel({ music, isHost, hostNow, command }: Props) {
  const [link, setLink] = useState(''), [error, setError] = useState(''), [playerError, setPlayerError] = useState('');
  const [busy, setBusy] = useState(false), [listening, setListening] = useState(false), [blocked, setBlocked] = useState(false), [volume, setVolume] = useState(40);
  const mount = useRef<HTMLDivElement>(null), player = useRef<Player | null>(null);
  const latest = useRef({ music, isHost, hostNow, command, volume });
  useEffect(() => { latest.current = { music, isHost, hostNow, command, volume }; }, [music, isHost, hostNow, command, volume]);
  useEffect(() => { player.current?.setVolume(volume); }, [volume]);
  useEffect(() => {
    if (!listening || !mount.current) return;
    const parent = mount.current;
    let stopped = false, ready = false, visible = false, appliedTrack: string | null = null, transport = -1, suppressUntil = 0, lastReport = 0;
    const suppress = () => { suppressUntil = performance.now() + 1800; };
    const sync = () => {
      const p = player.current, current = latest.current;
      if (!ready || !p) return;
      if (!visible || document.hidden) {
        if (p.getPlayerState() === 1 || p.getPlayerState() === 3) { suppress(); p.pauseVideo(); }
        transport = -1; return;
      }
      const m = current.music;
      if (!m.current) { if (appliedTrack) { suppress(); p.stopVideo(); } appliedTrack = null; return; }
      const position = musicPosition(m, current.hostNow());
      if (appliedTrack !== m.current.id) {
        suppress(); appliedTrack = m.current.id; transport = m.transport; setPlayerError(''); setBlocked(false);
        const options = { videoId: m.current.videoId, startSeconds: position };
        if (m.playing) p.loadVideoById(options); else p.cueVideoById(options);
      } else if (transport !== m.transport) {
        suppress(); transport = m.transport; p.seekTo(position, true);
        if (m.playing) p.playVideo(); else p.pauseVideo();
      } else if (!current.isHost && m.playing && p.getPlayerState() === 1 && Math.abs(p.getCurrentTime() - position) > 1.5) {
        suppress(); p.seekTo(position, true);
      }
      if (current.isHost && m.playing && p.getPlayerState() === 1 && performance.now() > suppressUntil && performance.now() - lastReport > 5000) {
        lastReport = performance.now();
        void current.command('music-control', { op: 'sync', currentId: m.current.id, position: p.getCurrentTime() }).catch(() => {});
      }
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].intersectionRatio > .5; sync(); }, { threshold: [0, .5, 1] });
    observer.observe(parent);
    const timer = window.setInterval(sync, 1000);
    document.addEventListener('visibilitychange', sync);
    void loadYouTube().then(YT => {
      if (stopped) return;
      const element = document.createElement('div'); parent.replaceChildren(element);
      player.current = new YT.Player(element, {
        width: '100%', height: '220', playerVars: { playsinline: 1, origin: location.origin, enablejsapi: 1 },
        events: {
          onReady: () => { if (stopped) return; ready = true; player.current?.setVolume(latest.current.volume); sync(); },
          onAutoplayBlocked: () => { if (!stopped) setBlocked(true); },
          onError: (event: { data: number }) => {
            if (stopped) return;
            const messages: Record<number, string> = { 100: '삭제되거나 비공개인 영상이에요.', 101: '외부 재생이 허용되지 않는 영상이에요.', 150: '외부 재생이 허용되지 않는 영상이에요.', 153: 'YouTube가 사이트 정보를 확인하지 못했어요. 브라우저 설정을 확인해 주세요.' };
            setPlayerError(messages[event.data] || '이 영상은 현재 재생할 수 없어요. YouTube에서 확인해 주세요.');
          },
          onStateChange: (event: { data: number }) => {
            if (stopped || !player.current || document.hidden || !visible) return;
            const { music: m, isHost: host, command: send } = latest.current;
            if (!host || !m.current || appliedTrack !== m.current.id || parseYouTubeUrl(player.current.getVideoUrl()) !== m.current.videoId) return;
            if (event.data === 0) void send('music-control', { op: 'skip', currentId: m.current.id }).catch(() => {});
            else if (performance.now() > suppressUntil) {
              if ((event.data === 2 && m.playing) || (event.data === 1 && !m.playing)) {
                void send('music-control', { op: 'sync', currentId: m.current.id, position: player.current.getCurrentTime() })
                  .then(() => send('music-control', { op: event.data === 2 ? 'pause' : 'play' })).catch(() => {});
              }
            }
          },
        },
      });
    }).catch(e => { if (!stopped) { setPlayerError(e.message); setListening(false); } });
    return () => {
      stopped = true; window.clearInterval(timer); observer.disconnect(); document.removeEventListener('visibilitychange', sync);
      try { player.current?.destroy(); } catch { /* A failed embed may already have removed its frame. */ }
      player.current = null; parent.replaceChildren();
    };
  }, [listening]);
  async function act(op: string, extra: Record<string, unknown> = {}) {
    setError('');
    try { await command('music-control', { op, ...extra }); if (op === 'play') setListening(true); }
    catch (e) { setError(e instanceof Error ? e.message : '재생 요청을 보내지 못했어요.'); }
  }
  return <section className="music-panel" aria-label="공용 YouTube와 신청곡">
    <div className="panel-title"><strong>함께 듣는 밤</strong><span>YouTube</span></div>
    {music.current ? <div className="current-track"><a href={`https://www.youtube.com/watch?v=${music.current.videoId}`} target="_blank" rel="noopener noreferrer">{music.current.videoId} ↗</a><small>{music.current.name}의 신청곡 · {music.playing ? '재생 중' : '일시정지'}</small></div> : <p className="panel-empty">좋아하는 영상을 신청해 함께 들어요.</p>}
    {isHost && <div className="music-controls"><button onClick={() => void act(music.playing ? 'pause' : 'play')}>{music.playing ? '모두 일시정지' : '모두 재생'}</button><button disabled={!music.current && !music.queue.length} onClick={() => void act('skip', { currentId: music.current?.id || null })}>다음 곡</button></div>}
    <div className="listen-controls"><button disabled={!music.current} onClick={() => {
      if (blocked && player.current) { player.current.seekTo(musicPosition(music, hostNow()), true); player.current.playVideo(); setBlocked(false); }
      else setListening(!listening);
    }}>{blocked ? '눌러서 재생 허용' : listening ? '내 듣기 중단' : '함께 듣기'}</button>
    {listening && <button onClick={() => { player.current?.seekTo(musicPosition(music, hostNow()), true); if (music.playing) player.current?.playVideo(); }}>지금 위치로 맞추기</button>}</div>
    {listening && <><div className="youtube-viewport" ref={mount} /><label className="music-volume">음악 음량 <input type="range" aria-label="내 음악 음량" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} /><span>{volume}%</span></label></>}
    {playerError && <p className="panel-error" role="alert">{playerError}</p>}
    <form onSubmit={async e => {
      e.preventDefault(); if (busy) return; setError('');
      if (!parseYouTubeUrl(link)) { setError('YouTube 영상 링크를 붙여 넣어 주세요.'); return; }
      setBusy(true);
      try { await command('music-add', { url: link }); setLink(''); }
      catch (failure) { setError(failure instanceof Error ? failure.message : '신청하지 못했어요.'); }
      finally { setBusy(false); }
    }}><input className="text-input" aria-label="신청할 YouTube 영상 링크" type="url" placeholder="YouTube 링크 붙여넣기" value={link} maxLength={500} onChange={e => setLink(e.target.value)} /><button disabled={busy || !link.trim()}>{busy ? '신청 중' : '신청'}</button></form>
    {error && <p className="panel-error" role="alert">{error}</p>}
    <ol className="music-queue" aria-label="신청곡 대기열">{music.queue.map((track, i) => <li key={track.id}><span><a href={`https://www.youtube.com/watch?v=${track.videoId}`} target="_blank" rel="noopener noreferrer">{i + 1}. {track.videoId}</a><small>{track.name}</small></span>{isHost && <button aria-label={`${i + 1}번째 신청곡 삭제`} onClick={() => void act('remove', { track: track.id })}>×</button>}</li>)}</ol>
    <p className="music-note">대기 {music.queue.length}/30곡 · 한 사람당 대기곡 3곡<br />화면에 플레이어가 보일 때 재생돼요. 광고·버퍼링으로 재생 시점이 다를 수 있어요.</p>
  </section>;
}
