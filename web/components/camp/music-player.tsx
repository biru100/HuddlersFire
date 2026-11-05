'use client';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useCampPip } from './use-camp-pip';
import { MusicPlayback } from '@/lib/camp-playback.mjs';
import type { MusicState } from './music-panel';

type Player = {
  loadVideoById: (options: { videoId: string; startSeconds: number }) => void;
  cueVideoById: (options: { videoId: string; startSeconds: number }) => void;
  playVideo: () => void; pauseVideo: () => void; stopVideo: () => void; destroy: () => void;
  seekTo: (seconds: number, ahead: boolean) => void; getCurrentTime: () => number; getPlayerState: () => number;
  getVideoUrl: () => string; setVolume: (volume: number) => void; mute: () => void; unMute: () => void;
};
type YouTube = { Player: new (element: HTMLElement, options: Record<string, unknown>) => Player };
const youtubeLoading = new WeakMap<Window,Promise<YouTube>>();
function loadYouTube(owner:Window): Promise<YouTube> {
  const ytWindow = owner as unknown as { YT?: YouTube; onYouTubeIframeAPIReady?: () => void };
  if (ytWindow.YT?.Player) return Promise.resolve(ytWindow.YT);
  const existing=youtubeLoading.get(owner);if(existing)return existing;
  const loading = new Promise<YouTube>((resolve, reject) => {
    const previous = ytWindow.onYouTubeIframeAPIReady;
    const timer = owner.setTimeout(() => { youtubeLoading.delete(owner); reject(new Error('YouTube에 연결하지 못했어요. 다시 시도해 주세요.')); }, 15000);
    ytWindow.onYouTubeIframeAPIReady = () => { previous?.(); owner.clearTimeout(timer); if (ytWindow.YT) resolve(ytWindow.YT); };
    let script = owner.document.getElementById('camp-youtube-api') as HTMLScriptElement | null;
    if (!script) {
      script = owner.document.createElement('script'); script.id = 'camp-youtube-api'; script.src = 'https://www.youtube.com/iframe_api'; script.async = true;
      script.onerror = () => { owner.clearTimeout(timer); youtubeLoading.delete(owner); script?.remove(); reject(new Error('YouTube를 불러오지 못했어요.')); };
      owner.document.head.appendChild(script);
    }
  });
  youtubeLoading.set(owner,loading);return loading;
}

type Props = { music: MusicState; isHost: boolean; hostNow: () => number; command: (kind: string, data?: Record<string, unknown>) => Promise<unknown>;
  muted: boolean; volume: number; onMuted: (muted: boolean) => void; modalOpen: boolean; suspended?:()=>boolean };
export default function MusicPlayer({ music, isHost, hostNow, command, muted, volume, onMuted, modalOpen, suspended }: Props) {
  const [mount, setMount] = useState<HTMLDivElement | null>(null), [error, setError] = useState(''), [blocked, setBlocked] = useState(false);
  const [retry, setRetry] = useState(0);
  const pip=useCampPip(()=>{},'music');
  const player = useRef<Player | null>(null), controller = useRef<MusicPlayback | null>(null);
  const latest = useRef({ music, isHost, hostNow, command, volume, muted, suspended });
  useEffect(() => { latest.current = { music, isHost, hostNow, command, volume, muted, suspended }; controller.current?.sync(); }, [music, isHost, hostNow, command, volume, muted, suspended]);
  useEffect(() => {
    if (!mount) return;
    const owner=(mount.ownerDocument.defaultView || window) as Window & typeof globalThis;
    const doc=mount.ownerDocument;
    let stopped = false, visible = false;
    const sync = () => controller.current?.sync(visible && !doc.hidden);
    const observer = new owner.IntersectionObserver(entries => { visible = entries[0].intersectionRatio > .5; sync(); }, { threshold: [0, .5, 1] });
    observer.observe(mount);
    const timer = owner.setInterval(sync, 1000); doc.addEventListener('visibilitychange', sync);
    void loadYouTube(owner).then(YT => {
      if (stopped) return;
      setError(''); setBlocked(false);
      const element = doc.createElement('div'); mount.replaceChildren(element);
      const instance = new YT.Player(element, { width: '100%', height: '200', playerVars: { playsinline: 1, origin: location.origin, enablejsapi: 1 }, events: {
        onReady: () => { if (stopped || !controller.current) return; controller.current.ready = true; sync(); },
        onAutoplayBlocked: () => { if (!stopped) setBlocked(true); },
        onStateChange: (event: { data: number }) => {
          if (stopped) return;
          if (event.data === 1) { setBlocked(false); setError(''); }
          controller.current?.onStateChange(event.data);
        },
        onError: (event: { data: number }) => {
          if (stopped) return;
          const messages: Record<number, string> = { 100: '삭제되거나 비공개인 영상이에요.', 101: '외부 재생이 허용되지 않는 영상이에요.', 150: '외부 재생이 허용되지 않는 영상이에요.', 153: '브라우저 설정으로 YouTube 재생이 제한됐어요.' };
          setError(messages[event.data] || '이 영상은 현재 재생할 수 없어요.');
        },
      } });
      player.current = instance; controller.current = new MusicPlayback(instance, () => latest.current);
    }).catch(e => { if (!stopped) setError(e.message); });
    return () => {
      stopped = true; observer.disconnect(); owner.clearInterval(timer); doc.removeEventListener('visibilitychange', sync);
      try { controller.current?.destroy(); } catch { /* An unavailable iframe may already be gone. */ }
      controller.current = null; player.current = null; mount.replaceChildren();
    };
  }, [mount, retry]);
  const dock=<aside className="music-dock" aria-label="내 YouTube 플레이어" inert={modalOpen&&!pip.pipWindow}>
    <div className="music-dock-heading"><span title={music.current?.title || music.current?.videoId}>{music.current?.title || music.current?.videoId || '신청곡을 기다리고 있어요'}</span><button onClick={() => onMuted(!muted)} aria-pressed={muted} aria-label={muted ? '내 라디오 음소거 해제' : '내 라디오 음소거'} title={muted ? '내 라디오 음소거 해제' : '내 라디오 음소거'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button></div>
    <div className="youtube-viewport" ref={setMount} />
    <div className={'music-window-tools'+(pip.supported?'':' pip-unavailable')}><button disabled={!pip.supported||pip.busy} onClick={()=>{if(pip.pipWindow)pip.close();else void pip.open().catch(e=>setError(e.message));}}>{pip.pipWindow?'원래 화면으로':'YouTube 작은 창'}</button></div>
    {!pip.pipWindow&&<p className="music-window-note">다른 창에서도 재생을 이어가요. 브라우저·기기가 재생을 제한할 수 있어요.{pip.supported?' 영상은 작은 창으로도 볼 수 있어요.':''}</p>}
    {blocked && <button className="player-retry" onClick={() => { controller.current?.resume(); }}>눌러서 재생 허용</button>}
    {error && <div className="player-message" role="status">{error}<button onClick={() => setRetry(v => v + 1)}>다시 연결</button></div>}
  </aside>;
  return pip.pipWindow?createPortal(dock,pip.pipWindow.document.body):dock;
}
