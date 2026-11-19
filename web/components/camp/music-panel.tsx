'use client';
import EffectsStatus from './effects-status';
import { Button } from '@astryxdesign/core/Button';
import { CampTextInput } from './camp-text-input';
import { VolumeSlider } from '@/components/camp/form-controls';
import { useState } from 'react';
import { CampDialog } from '@/components/camp/camp-dialog';
import { parseYouTubeUrl } from '@/lib/camp-media.mjs';

export type Track = { id: string; videoId: string; title?: string; by: string; name: string };
export type MusicState = { revision: number; transport: number; current: Track | null; queue: Track[]; playing: boolean; position: number; anchor: number };
type Props = { music: MusicState; isHost: boolean; command: (kind: string, data?: Record<string, unknown>) => Promise<unknown>;
  inline?:boolean; sound?:{effectsVolume:number;effectsStatus:string;musicVolume:number;onEffectsVolume:(v:number)=>void;onMusicVolume:(v:number)=>void};
  open: boolean; onOpenChange: (open: boolean) => void; onCloseFocus: () => void; muted: boolean; onMuted: (muted: boolean) => void };

export default function MusicPanel({ music, isHost, command, open, onOpenChange, onCloseFocus, muted, onMuted, inline=false, sound }: Props) {
  const [link, setLink] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function act(op: string, extra: Record<string, unknown> = {}) {
    setError('');
    try { await command('music-control', { op, ...extra }); }
    catch (e) { setError(e instanceof Error ? e.message : '재생 요청을 보내지 못했어요.'); }
  }
  const Title=inline?'h3':'h2',Description='p';
  const content=(
      <section className="music-panel" aria-label="공용 YouTube와 신청곡">
        <div className="panel-title"><Title>함께 듣는 밤</Title><span>YouTube</span></div>
        <Description className="music-note">신청하면 비어 있는 라디오는 바로 재생하고, 재생 중이면 순서대로 이어져요. 방장이 일시정지한 곡은 그대로 기다려요. 원할 때 나만 음소거할 수 있고, 다른 창에서도 ‘YouTube 작은 창’으로 함께 들을 수 있어요.</Description>
        {music.current ? <div className="current-track"><a href={`https://www.youtube.com/watch?v=${music.current.videoId}`} target="_blank" rel="noopener noreferrer">{music.current.title || music.current.videoId} ↗</a><small>{music.current.name}의 신청곡 · {music.playing ? '재생 중' : '일시정지'}</small></div> : <p className="panel-empty">좋아하는 영상을 신청해 함께 들어요.</p>}
        {isHost && <div className="music-controls"><Button onClick={() => void act(music.playing ? 'pause' : 'play')} label={music.playing ? '모두 일시정지' : '모두 재생'}/><Button isDisabled={!music.current && !music.queue.length} onClick={() => void act('skip', { currentId: music.current?.id || null })} label="다음 곡"/></div>}
        <div className="listen-controls"><Button aria-pressed={muted} onClick={() => onMuted(!muted)} label={muted ? '내 라디오 음소거 해제' : '내 라디오 음소거'}/></div>
        {sound&&<fieldset className="radio-sound-settings"><legend>나에게 들리는 소리</legend>
          <VolumeSlider label="라디오 음량" value={sound.musicVolume} onChange={sound.onMusicVolume}/>
          <VolumeSlider label="효과음 음량" value={Math.round(sound.effectsVolume*100)} onChange={v=>sound.onEffectsVolume(v/100)}/>
          <EffectsStatus volume={sound.effectsVolume} status={sound.effectsStatus} onVolume={sound.onEffectsVolume}/>
          <small>모닥불·장작 등 효과음 전체에 적용돼요. 모닥불은 불멍에서 들려요. <a href="/audio/CREDITS.txt" target="_blank" rel="noopener noreferrer">소리 출처 · CC BY 3.0</a></small>
        </fieldset>}
        <form onSubmit={async e => {
          e.preventDefault(); if (busy) return; setError('');
          if (!parseYouTubeUrl(link)) { setError('YouTube 영상 링크를 붙여 넣어 주세요.'); return; }
          setBusy(true);
          try { await command('music-add', { url: link }); setLink(''); }
          catch (failure) { setError(failure instanceof Error ? failure.message : '신청하지 못했어요.'); }
          finally { setBusy(false); }
        }}><CampTextInput isLabelHidden containerClassName="camp-input" label="신청할 YouTube 영상 링크" type="url" placeholder="YouTube 링크 붙여넣기" value={link} maxLength={500} onChange={setLink} /><Button isDisabled={busy || !link.trim()} type="submit" label={busy ? '신청 중' : '신청'}/></form>
        {error && <p className="panel-error" role="alert">{error}</p>}
        <ol className="music-queue" aria-label="신청곡 대기열">{music.queue.map((track, i) => <li key={track.id}><span><a href={`https://www.youtube.com/watch?v=${track.videoId}`} target="_blank" rel="noopener noreferrer">{i + 1}. {track.title || track.videoId}</a><small>{track.name}</small></span>{isHost && <Button onClick={() => void act('remove', { track: track.id })} label={`${i + 1}번째 신청곡 삭제`}>×</Button>}</li>)}</ol>
        <p className="music-note">대기 {music.queue.length}/30곡 · 한 사람당 대기곡 3곡<br />내 음소거와 음량은 설정에서도 바꿀 수 있어요.</p>
      </section>);
  return inline?content:<CampDialog open={open} onOpenChange={onOpenChange} label="함께 듣는 밤" className="radio-popup" onCloseFocus={onCloseFocus}><Button onClick={()=>onOpenChange(false)} className="radio-close" label="라디오 닫기">×</Button>{content}</CampDialog>;
}
