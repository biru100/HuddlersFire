'use client';
import { useState } from 'react';
import { Dialog } from 'radix-ui';
import { parseYouTubeUrl } from '@/lib/camp-media.mjs';

export type Track = { id: string; videoId: string; title?: string; by: string; name: string };
export type MusicState = { revision: number; transport: number; current: Track | null; queue: Track[]; playing: boolean; position: number; anchor: number };
type Props = { music: MusicState; isHost: boolean; command: (kind: string, data?: Record<string, unknown>) => Promise<unknown>;
  open: boolean; onOpenChange: (open: boolean) => void; onCloseFocus: () => void; listening: boolean; onListening: (enabled: boolean) => void };

export default function MusicPanel({ music, isHost, command, open, onOpenChange, onCloseFocus, listening, onListening }: Props) {
  const [link, setLink] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function act(op: string, extra: Record<string, unknown> = {}) {
    setError('');
    try { await command('music-control', { op, ...extra }); if (op === 'play') onListening(true); }
    catch (e) { setError(e instanceof Error ? e.message : '재생 요청을 보내지 못했어요.'); }
  }
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="radio-backdrop" />
    <Dialog.Content className="radio-popup" onCloseAutoFocus={e => { e.preventDefault(); onCloseFocus(); }}>
      <Dialog.Close className="radio-close" aria-label="라디오 닫기">×</Dialog.Close>
      <section className="music-panel" aria-label="공용 YouTube와 신청곡">
        <div className="panel-title"><Dialog.Title>함께 듣는 밤</Dialog.Title><span>YouTube</span></div>
        <Dialog.Description className="music-note">라디오 설정을 닫아도 보이는 플레이어에서 계속 들어요. 다른 창에서 작업할 때는 플레이어의 ‘YouTube 작은 창’을 이용해 주세요.</Dialog.Description>
        {music.current ? <div className="current-track"><a href={`https://www.youtube.com/watch?v=${music.current.videoId}`} target="_blank" rel="noopener noreferrer">{music.current.title || music.current.videoId} ↗</a><small>{music.current.name}의 신청곡 · {music.playing ? '재생 중' : '일시정지'}</small></div> : <p className="panel-empty">좋아하는 영상을 신청해 함께 들어요.</p>}
        {isHost && <div className="music-controls"><button onClick={() => void act(music.playing ? 'pause' : 'play')}>{music.playing ? '모두 일시정지' : '모두 재생'}</button><button disabled={!music.current && !music.queue.length} onClick={() => void act('skip', { currentId: music.current?.id || null })}>다음 곡</button></div>}
        <div className="listen-controls"><button disabled={!music.current && !listening} onClick={() => onListening(!listening)}>{listening ? '내 듣기 중단' : '함께 듣기'}</button></div>
        <form onSubmit={async e => {
          e.preventDefault(); if (busy) return; setError('');
          if (!parseYouTubeUrl(link)) { setError('YouTube 영상 링크를 붙여 넣어 주세요.'); return; }
          setBusy(true);
          try { await command('music-add', { url: link }); setLink(''); }
          catch (failure) { setError(failure instanceof Error ? failure.message : '신청하지 못했어요.'); }
          finally { setBusy(false); }
        }}><input className="text-input" aria-label="신청할 YouTube 영상 링크" type="url" placeholder="YouTube 링크 붙여넣기" value={link} maxLength={500} onChange={e => setLink(e.target.value)} /><button disabled={busy || !link.trim()}>{busy ? '신청 중' : '신청'}</button></form>
        {error && <p className="panel-error" role="alert">{error}</p>}
        <ol className="music-queue" aria-label="신청곡 대기열">{music.queue.map((track, i) => <li key={track.id}><span><a href={`https://www.youtube.com/watch?v=${track.videoId}`} target="_blank" rel="noopener noreferrer">{i + 1}. {track.title || track.videoId}</a><small>{track.name}</small></span>{isHost && <button aria-label={`${i + 1}번째 신청곡 삭제`} onClick={() => void act('remove', { track: track.id })}>×</button>}</li>)}</ol>
        <p className="music-note">대기 {music.queue.length}/30곡 · 한 사람당 대기곡 3곡<br />음량과 내 듣기는 설정에서도 바꿀 수 있어요.</p>
      </section>
    </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
