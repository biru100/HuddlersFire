'use client';
import { useState, type Dispatch, type SetStateAction } from 'react';
import RoomList from './room-list';
import { Flame, Users, Check, ArrowUpRight, ChevronRight } from 'lucide-react';
import { COLORS } from '@/lib/camp-config.mjs';
import CharacterPreview from './character-preview';
export type Profile = { name:string;color:string;avatar:string|null;linked:boolean };
type Props = {onDiscord:()=>void;discordAvailable:boolean;discordBusy:boolean;discordMessage:string;profile:Profile;setProfile:Dispatch<SetStateAction<Profile>>;code:string;setCode:(value:string)=>void;busy:boolean;ready:boolean;error:string;enter:(mode:'create'|'join',code?:string,creation?:{title:string;visibility:string})=>Promise<void>;enterSolo:()=>void};
export default function CampLobby({profile,setProfile,code,setCode,busy,ready,error,enter,enterSolo,onDiscord,discordAvailable,discordBusy,discordMessage}:Props) {
  const [title,setTitle]=useState('우리의 모닥불'), [visibility,setVisibility]=useState('public');
  return <>
          <h2>함께 피우는 모닥불</h2><p className="intro">친구들과 둥글게 모여 앉아<br />아무 이야기나 나눠 보세요.</p>
          <div className="profile-preview"><CharacterPreview color={profile.color} avatar={profile.avatar} /><div><strong>{profile.name || '오늘의 허들러'}</strong><span>{profile.linked ? 'Discord 계정 연결됨' : 'Discord 연결 후 입장할 수 있어요'}</span></div><span className="profile-spark">✦</span></div>
          {!profile.linked&&<div className="discord-entry"><button className="primary-button" disabled={!discordAvailable||discordBusy||!ready} onClick={onDiscord}>{discordBusy?'Discord 연결 확인 중…':discordAvailable?'Discord 연결하고 입장 준비':'Discord 연결 준비 중'}</button><p>모든 참가자는 Discord 계정을 연결해야 해요.</p>{discordMessage&&<p role="status">{discordMessage}</p>}</div>}
          <label className="field-label" htmlFor="nickname">어떤 이름으로 만날까요?</label>
          <input id="nickname" className="text-input" maxLength={16} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="닉네임을 입력해 주세요" autoComplete="nickname" disabled={busy} />
          <div className="color-row"><span>오늘의 색</span><div role="group" aria-label="캐릭터 색상">{COLORS.map((color: string, i: number) => <button key={color} className={'color-dot ' + (profile.color === color ? 'selected' : '')} style={{ backgroundColor: color }} aria-label={['살구색', '민트색', '보라색', '분홍색', '파란색', '노란색'][i]} aria-pressed={profile.color === color} onClick={() => setProfile(p => ({ ...p, color }))} disabled={busy}>{profile.color === color && <Check size={12} />}</button>)}</div></div>
          {code.length===6&&<div className="invite-arrival"><strong>초대받은 모닥불 · {code}</strong><button className="primary-button" disabled={busy||!ready||!profile.linked} onClick={()=>void enter('join',code)}>이 방에 참여</button></div>}
          <RoomList busy={busy||!ready||!profile.linked} join={code=>void enter('join',code)}/>
          <div className="room-entry-options">
            <section className="room-entry-card" aria-labelledby="create-room-title">
              <h3 id="create-room-title">새 모닥불</h3><p>친구들을 초대할 방을 만들어요.</p>
              <label className="field-label">방 이름<input className="text-input" value={title} maxLength={40} disabled={busy} onChange={e=>setTitle(e.target.value)}/></label>
              <label className="field-label">공개 범위<select className="text-input" value={visibility} disabled={busy} onChange={e=>setVisibility(e.target.value)}><option value="public">공개방 · Discord 연결 후 목록에서 참여</option><option value="unlisted">초대방 · 링크나 코드로 참여</option></select></label>
              <div className="capacity"><Users size={15} /><span>최대 16명</span></div>
              <button className="primary-button" type="button" disabled={busy || !ready || !profile.linked || !title.trim()} onClick={() => enter('create',undefined,{title:title.trim(),visibility})}><Flame size={17} /><span>방 만들기</span></button>
            </section>
            <form className="room-entry-card room-entry-join" onSubmit={e => { e.preventDefault(); enter('join'); }} aria-labelledby="join-room-title">
              <h3 id="join-room-title">코드로 함께하기</h3><label className="field-label" htmlFor="room-code">참가 코드 6자리</label>
              <input className="text-input code-input" id="room-code" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))} placeholder="ABC234" maxLength={6} autoComplete="off" autoCapitalize="characters" spellCheck={false} required pattern="[A-Z2-9]{6}" disabled={busy} />
              <button className="primary-button" type="submit" disabled={busy || !ready || !profile.linked || code.length !== 6}><span>참가하기</span><ArrowUpRight size={16} /></button>
            </form>
          </div>
          {busy && <p className="entry-progress" role="status"><span className="spinner" /> 모닥불에 연결하는 중이에요…</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="solo-button" onClick={enterSolo} disabled={busy||!profile.linked}>먼저 혼자 둘러보기 <ChevronRight size={14} /></button>
          <div className="divider" />
          <p className="micro-copy">Discord 프로필 연결은 설정에서 할 수 있어요.<br />Discord 연결을 마치면 공개방과 초대방 모두 참여할 수 있어요.</p>

  </>;
}
