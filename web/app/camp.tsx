'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { Flame, Users, Volume2, VolumeX, ArrowUpRight, LogOut, Copy, Check, ChevronRight, TreePine, Moon, X, Headphones, RotateCw, Link2 } from 'lucide-react';
import { CampRenderer, CampAudio } from '@/lib/camp-renderer.mjs';
import { CampNetwork, api } from '@/lib/camp-network.mjs';
import { COLORS, EMOTES, direction, spawnPlayer, simulateWorld, applyPlayerAction, carryTarget } from '@/lib/camp-world.mjs';
import { emptyMusic, applyMusicAction } from '@/lib/camp-media.mjs';
import { CommandLedger, chatText, validAction } from '@/lib/camp-protocol.mjs';
import ActionBar from '@/components/camp/action-bar';
import ChatPanel, { type ChatEntry } from '@/components/camp/chat-panel';
import MusicPanel, { type MusicState } from '@/components/camp/music-panel';

type Person = { id: string; name: string; color: string; avatar?: string | null; connected?: boolean; x?: number; y?: number; sitting?: boolean };
type Profile = { name: string; color: string; avatar: string | null; linked: boolean };
type Room = { code: string; player: string; host: string; turnConfigured: boolean };

export default function Camp() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const network = useRef<CampNetwork | null>(null);
  const audio = useRef<CampAudio | null>(null);
  const keys = useRef(new Set<string>());
  const sittingRef = useRef(false), soloRef = useRef(false);
  const crouchRef = useRef(false), emotesRef = useRef(false), lockedRef = useRef(false), soloPose = useRef('standing');
  const soloPlayer = useRef({ id: 'solo', name: '허들러', color: COLORS[0], ...spawnPlayer() });
  const scene = useRef({ name: '허들러', color: COLORS[0] });
  const soloWorld = useRef(new Map([['solo', soloPlayer.current]]));
  const soloLedger = useRef(new CommandLedger()), soloMusic = useRef(emptyMusic()), soloChat = useRef<ChatEntry[]>([]);
  const [profile, setProfile] = useState<Profile>({ name: '', color: COLORS[0], avatar: null, linked: false });
  const [discordAvailable, setDiscordAvailable] = useState(false);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [room, setRoom] = useState<Room | null>(null), [solo, setSolo] = useState(false);
  const [people, setPeople] = useState<Person[]>([]), [connected, setConnected] = useState(1);
  const [tab, setTab] = useState<'create' | 'join'>('create'), [code, setCode] = useState('');
  const [status, setStatus] = useState(''), [error, setError] = useState(''), [toast, setToast] = useState('');
  const [volume, setVolume] = useState(0), [sitting, setSitting] = useState(false);
  const [help, setHelp] = useState(false), [leaveConfirm, setLeaveConfirm] = useState(false);
  const [copied, setCopied] = useState(false), [elapsed, setElapsed] = useState(0);
  const [chat, setChat] = useState<ChatEntry[]>([]), [music, setMusic] = useState<MusicState>(emptyMusic());
  const [emotesOpen, setEmotesOpen] = useState(false);
  const [actionState, setActionState] = useState({ crouching: false, carrying: false, carried: false, allowCarry: true, motion: 'grounded', target: null as string | null });
  const active = !!room || solo, isHost = room?.player === room?.host;
  const effectReset = useEffectEvent(() => resetInput());
  const effectCrouch = useEffectEvent((down: boolean) => setCrouch(down));
  const effectEmote = useEffectEvent((emote: string) => chooseEmote(emote));
  const effectLift = useEffectEvent(() => lift());
  const effectEscape = useEffectEvent(() => { void runAction('escape'); });
  const effectSit = useEffectEvent(() => toggleSit());

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(location.search);
    api('session').then(data => {
      if (cancelled) return;
      if (data.profile) setProfile(data.profile);
      setDiscordAvailable(data.discordAvailable); setReady(true);
    }).catch(() => { if (!cancelled) { setReady(true); setError('로비에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'); } }).finally(() => {
      if (cancelled) return;
      const invitation = params.get('room');
      if (invitation) { setTab('join'); setCode(invitation.slice(0, 6).toUpperCase()); }
      const notice = params.get('notice');
      if (notice) {
        setToast(notice === 'discord-linked' ? 'Discord 프로필 사진을 연결했어요.' : notice === 'discord-cancelled' ? 'Discord 연결을 취소했어요. 게스트로도 참여할 수 있어요.' : 'Discord 연결을 준비하고 있어요.');
        params.delete('notice'); history.replaceState(null, '', location.pathname + (params.size ? '?' + params : ''));
      }
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    scene.current = { name: profile.name || '허들러', color: profile.color };
    Object.assign(soloPlayer.current, { name: profile.name || '허들러', color: profile.color, avatar: profile.avatar });
  }, [profile]);
  useEffect(() => {
    if (!canvas.current) return;
    const renderer = new CampRenderer(canvas.current, () => ({ ...scene.current,
      players: network.current ? [...network.current.players.values()] : soloRef.current ? [soloPlayer.current] : [],
      self: network.current?.player || (soloRef.current ? 'solo' : undefined),
      now: network.current?.hostNow() ?? performance.now(),
      targetId: network.current ? carryTarget(network.current.players, network.current.player)?.id : null,
    }));
    audio.current = new CampAudio();
    const down = (e: KeyboardEvent) => {
      if (e.isComposing || lockedRef.current) return;
      if (e.target instanceof HTMLElement && (e.target.matches('input, textarea, select, button, a') || e.target.isContentEditable)) return;
      if (!network.current && !soloRef.current) return;
      if (e.code === 'Enter') { e.preventDefault(); effectReset(); window.dispatchEvent(new Event('camp-chat-focus')); return; }
      if (e.code === 'Escape') { setEmotes(false); return; }
      if (emotesRef.current && /^Digit[1-6]$/.test(e.code) && !e.repeat) { e.preventDefault(); effectEmote(EMOTES[Number(e.code.slice(-1)) - 1].id); return; }
      if (e.code === 'KeyQ' && !e.repeat) { e.preventDefault(); setEmotes(!emotesRef.current); return; }
      if (e.code === 'KeyF' && !e.repeat) { e.preventDefault(); effectLift(); return; }
      if (e.code === 'Space' && !e.repeat) { e.preventDefault(); effectEscape(); return; }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { e.preventDefault(); keys.current.add(e.code); effectCrouch(true); return; }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE'].includes(e.code)) {
        e.preventDefault(); keys.current.add(e.code);
        if (e.code === 'KeyE' && !e.repeat) effectSit();
        if (e.code !== 'KeyE') { sittingRef.current = false; setSitting(false); setEmotes(false); }
        updateInput();
      }
    };
    const up = (e: KeyboardEvent) => { keys.current.delete(e.code); if (e.code.startsWith('Shift')) effectCrouch(keys.current.has('ShiftLeft') || keys.current.has('ShiftRight')); };
    const clear = () => effectReset();
    const visibility = () => { if (document.hidden) effectReset(); };
    const focus = (e: FocusEvent) => { if (e.target instanceof HTMLElement && e.target !== canvas.current) effectReset(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear); document.addEventListener('visibilitychange', visibility); document.addEventListener('focusin', focus);
    let last = performance.now();
    const tick = setInterval(() => {
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      const input = updateInput();
      if (soloRef.current) simulateWorld(soloWorld.current, new Map([['solo', input]]), dt, now);
    }, 33);
    const summary = setInterval(() => {
      const n = network.current;
      if (n) setConnected([...n.players.values()].filter(p => p.connected).length);
      const self = n ? n.players.get(n.player) : soloRef.current ? soloPlayer.current : null;
      if (self) {
        if (self.motion !== 'grounded') { sittingRef.current = false; crouchRef.current = false; }
        setSitting(self.sitting);
        const next = { crouching: !!self.crouching, carrying: !!self.carrying, carried: !!self.carriedBy, allowCarry: !!self.allowCarry, motion: self.motion, target: n ? carryTarget(n.players, n.player)?.name || null : null };
        setActionState(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      }
    }, 100);
    return () => {
      renderer.destroy(); audio.current?.destroy(); network.current?.destroy(); network.current = null;
      clearInterval(tick); clearInterval(summary); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('focusin', focus);
    };
  }, []);
  useEffect(() => { lockedRef.current = help || leaveConfirm; if (lockedRef.current) effectReset(); }, [help, leaveConfirm]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!active) return;
    const start = Date.now(), timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [active]);

  async function saveProfile() {
    const data = await api('session', { name: profile.name || '허들러', color: profile.color });
    setProfile(data.profile); return data.profile;
  }
  async function enter() {
    setBusy(true); setError('');
    try {
      if (!window.RTCPeerConnection) throw new Error('이 브라우저에서는 함께하기를 지원하지 않아요. 최신 Chrome 또는 Edge를 사용해 주세요.');
      const p = await saveProfile();
      const info = await api('rooms', { op: tab, ...(tab === 'join' ? { code: code.trim().toUpperCase() } : {}) });
      sittingRef.current = false; crouchRef.current = false; setSitting(false); setElapsed(0); setChat([]); setMusic(emptyMusic()); setRoom(info); setStatus(info.player === info.host ? '모닥불을 피웠어요' : '친구들과 연결하는 중');
      network.current = new CampNetwork(info, p, {
        status: (text: string) => setStatus(text), members: (members: Person[]) => setPeople(members),
        chat: (entries: ChatEntry[]) => setChat([...entries]), music: (state: MusicState) => setMusic(structuredClone(state)),
        ended: (text: string) => { network.current = null; resetInput(); setRoom(null); setPeople([]); setChat([]); setMusic(emptyMusic()); setError(text); },
      });
      canvas.current?.focus();
    } catch (e) { setError(e instanceof Error ? e.message : '입장하지 못했어요.'); }
    finally { setBusy(false); }
  }
  function enterSolo() {
    soloRef.current = true; setSolo(true); setError(''); sittingRef.current = false; setSitting(false);
    Object.assign(soloPlayer.current, spawnPlayer()); soloPose.current = 'standing'; crouchRef.current = false;
    soloLedger.current = new CommandLedger(); soloMusic.current = emptyMusic(); soloChat.current = [];
    setChat([]); setMusic(emptyMusic()); setElapsed(0); canvas.current?.focus();
  }
  function leave() {
    network.current?.destroy(); network.current = null; soloRef.current = false;
    setRoom(null); setSolo(false); setPeople([]); setLeaveConfirm(false); keys.current.clear(); sittingRef.current = false; crouchRef.current = false; setSitting(false); setEmotes(false); setChat([]); setMusic(emptyMusic());
    setStatus(''); setError(''); setToast('다음 모닥불에서 또 만나요.');
  }
  async function linkDiscord() {
    setBusy(true); setError('');
    try { await saveProfile(); location.href = '/api/camp/discord/start'; }
    catch (e) { setError(e instanceof Error ? e.message : '연결하지 못했어요.'); setBusy(false); }
  }
  async function unlink() {
    try { await api('discord/unlink', {}); setProfile(p => ({ ...p, avatar: null, linked: false })); setToast('Discord 사진 연결을 해제했어요.'); }
    catch { setError('연결을 해제하지 못했어요. 다시 시도해 주세요.'); }
  }
  async function copy(invite = false) {
    if (!room) return;
    try { await navigator.clipboard.writeText(invite ? location.origin + '/?room=' + room.code : room.code); setCopied(true); setToast(invite ? '초대 링크를 복사했어요.' : '참가 코드를 복사했어요.'); setTimeout(() => setCopied(false), 2000); }
    catch { setToast('코드를 직접 복사해 주세요: ' + room.code); }
  }
  async function changeVolume(value: number) {
    try { await audio.current?.setVolume(value); setVolume(value); }
    catch { setToast('소리를 켜지 못했어요. 다시 눌러 주세요.'); }
  }
  function updateInput() {
    const input = { ...direction(keys.current), sitting: sittingRef.current, crouching: crouchRef.current };
    network.current?.setInput(input);
    if (soloRef.current) {
      const posture = input.crouching ? 'crouching' : input.sitting ? 'sitting' : 'standing';
      if (posture !== soloPose.current) { applyPlayerAction(soloWorld.current, 'solo', { kind: 'posture', posture }, performance.now()); soloPose.current = posture; }
    }
    return input;
  }
  function resetInput() { keys.current.clear(); crouchRef.current = false; updateInput(); }
  function setCrouch(down: boolean) { crouchRef.current = down; if (down) { sittingRef.current = false; setSitting(false); } updateInput(); }
  function setEmotes(open: boolean) { emotesRef.current = open; setEmotesOpen(open); }
  function toggleSit() { crouchRef.current = false; sittingRef.current = !sittingRef.current; setSitting(sittingRef.current); updateInput(); canvas.current?.focus(); }
  async function sendCommand(kind: string, data: Record<string, unknown> = {}) {
    if (network.current) return network.current.command(kind, data);
    if (!soloRef.current) throw new Error('먼저 캠프장에 들어와 주세요.');
    const action = { ...data, kind, id: crypto.randomUUID() }, now = performance.now();
    if (!validAction(action)) throw new Error('요청 내용을 확인해 주세요.');
    if (!soloLedger.current.permit('solo', kind, now)) throw new Error('잠깐 기다렸다가 다시 해주세요.');
    const member = soloPlayer.current;
    let failure = null;
    if (kind === 'chat') {
      const text = chatText(String(data.text));
      if (!text) throw new Error('메시지를 입력해 주세요.');
      const entry = { id: action.id, by: 'solo', name: member.name, color: member.color, text, at: now };
      soloChat.current = [...soloChat.current, entry].slice(-100); setChat(soloChat.current);
      Object.assign(member, { bubble: text, bubbleUntil: now + 5000 });
    } else if (kind.startsWith('music-')) {
      failure = applyMusicAction(soloMusic.current, action, member, true, now); setMusic(structuredClone(soloMusic.current));
    } else failure = applyPlayerAction(soloWorld.current, 'solo', action, now);
    if (failure) throw new Error(failure);
  }
  async function runAction(kind: string, data: Record<string, unknown> = {}) {
    try { await sendCommand(kind, data); }
    catch (failure) { setToast(failure instanceof Error ? failure.message : '동작을 사용할 수 없어요.'); }
  }
  function standForAction() { sittingRef.current = false; crouchRef.current = false; keys.current.clear(); setSitting(false); updateInput(); }
  function chooseEmote(emote: string) { standForAction(); setEmotes(false); void runAction('emote', { emote }); canvas.current?.focus(); }
  function lift() {
    standForAction(); const n = network.current;
    void runAction('lift', { target: n ? carryTarget(n.players, n.player)?.id || null : null }); canvas.current?.focus();
  }

  return <main className={'camp-app' + (active ? ' in-camp' : '')}>
    <header className="topbar">
      <Link className="brand" href="/" aria-label="허들러즈 불멍 홈"><span className="brand-mark"><Flame size={23} fill="currentColor" /></span><span>huddlers<span className="brand-divider">/</span><strong>fire</strong></span></Link>
      <div className="top-note"><span className="live-dot" /> 우리만의 작은 쉼터</div>
      <button className="help-button" onClick={() => setHelp(true)}><span>이용 안내</span><span className="question-mark">?</span></button>
    </header>

    <div className="camp-layout">
      <section className="world" aria-label="숲속 캠프장">
        <canvas ref={canvas} tabIndex={0} aria-label="쿼터뷰 캠프장. WASD 이동, E 앉기, Shift 웅크리기, Q 감정표현, F 친구 들기, Space 탈출, Enter 채팅." />
        <div className="world-heading"><p className="eyebrow"><span /> A LITTLE SPACE, TOGETHER</p><h1>오늘도, 잠시<br />불멍하고 갈까요.</h1><p>타닥타닥. 이야기 사이에 피어나는 작은 여유.</p></div>
        <div className="weather-chip"><Moon size={14} /><span>고요한 숲의 밤</span></div>
        {active && <div className="session-chip"><span className="live-dot" />{solo ? '나만의 산책' : `${connected}명과 함께`}<span className="chip-divider" />{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</div>}
        <div className="world-bottom"><div className="movement-guide"><span className="keys"><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span><span>천천히 걸어요</span><i /><kbd>E</kbd><span>앉기 · 일어서기</span></div><span className="world-caption">어디에 앉아도, 좋은 자리.</span></div>
        {active && <div className="touch-controls" aria-label="이동 버튼">{[['KeyW', '↑'], ['KeyA', '←'], ['KeyS', '↓'], ['KeyD', '→']].map(([key, label]) => <button key={key} aria-label={`${label} 이동`} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); keys.current.add(key); sittingRef.current = false; setSitting(false); updateInput(); }} onPointerUp={() => keys.current.delete(key)} onPointerCancel={() => keys.current.delete(key)} onLostPointerCapture={() => keys.current.delete(key)}>{label}</button>)}</div>}
      </section>

      <aside className="sidebar">
        <div className="sidebar-top"><span className="eyebrow">THE CAMPFIRE</span><span className="small-icon"><TreePine size={15} /></span></div>
        {!active ? <>
          <h2>함께 피우는 모닥불</h2><p className="intro">친구들과 둥글게 모여 앉아<br />아무 이야기나 나눠 보세요.</p>
          <div className="profile-preview"><span className="mini-person" style={{ '--person-color': profile.color } as React.CSSProperties}>{profile.avatar ? <img src={profile.avatar} alt="내 Discord 프로필" /> : <span className="person-head" />}</span><div><strong>{profile.name || '오늘의 허들러'}</strong><span>{profile.linked ? 'Discord 사진 연결됨' : '당신의 자리도 비워 두었어요'}</span></div><span className="profile-spark">✦</span></div>
          <label className="field-label" htmlFor="nickname">어떤 이름으로 만날까요?</label>
          <input id="nickname" className="text-input" maxLength={16} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="닉네임을 입력해 주세요" autoComplete="nickname" disabled={busy} />
          <div className="color-row"><span>오늘의 색</span><div role="group" aria-label="캐릭터 색상">{COLORS.map((color: string, i: number) => <button key={color} className={'color-dot ' + (profile.color === color ? 'selected' : '')} style={{ backgroundColor: color }} aria-label={['살구색', '민트색', '보라색', '분홍색', '파란색', '노란색'][i]} aria-pressed={profile.color === color} onClick={() => setProfile(p => ({ ...p, color }))} disabled={busy}>{profile.color === color && <Check size={12} />}</button>)}</div></div>
          <div className="room-tabs" role="tablist" aria-label="입장 방법"><button role="tab" aria-selected={tab === 'create'} onClick={() => { setTab('create'); setError(''); }}>새 모닥불</button><button role="tab" aria-selected={tab === 'join'} onClick={() => { setTab('join'); setError(''); }}>코드로 함께하기</button></div>
          <form onSubmit={e => { e.preventDefault(); enter(); }}>
            {tab === 'join' ? <div className="join-field"><label className="field-label" htmlFor="room-code">친구에게 받은 참가 코드</label><input className="text-input code-input" id="room-code" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))} placeholder="ABC234" maxLength={6} autoComplete="off" spellCheck={false} required pattern="[A-Z2-9]{6}" disabled={busy} /></div> : <div className="capacity"><Users size={16} /><span>최대 16명이 함께할 수 있어요</span></div>}
            <button className="primary-button" type="submit" disabled={busy || !ready}>{busy ? <span className="spinner" /> : <Flame size={18} />}<span>{busy ? '모닥불을 준비하는 중' : tab === 'create' ? '모닥불 피우기' : '모닥불에 합류하기'}</span>{!busy && <ArrowUpRight size={18} />}</button>
          </form>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="solo-button" onClick={enterSolo} disabled={busy}>먼저 혼자 둘러보기 <ChevronRight size={14} /></button>
          <div className="divider" />
          <button className="discord-button" disabled={busy || (!discordAvailable && !profile.linked)} onClick={profile.linked ? unlink : linkDiscord}><svg width="18" height="15" viewBox="0 0 24 20" fill="currentColor" aria-hidden="true"><path d="M20 2a18 18 0 0 0-5-1l-.7 1.4a17 17 0 0 0-4.6 0L9 1a18 18 0 0 0-5 1C1 6 0 11 1 16a20 20 0 0 0 6 3l1.2-2a12 12 0 0 1-2-1l.5-.4a17 17 0 0 0 10.6 0l.5.4-2 1 1.2 2a20 20 0 0 0 6-3c1-5 0-10-3-14ZM8 13c-1 0-2-1-2-2.5S7 8 8 8s2 1 2 2.5S9 13 8 13Zm8 0c-1 0-2-1-2-2.5S15 8 16 8s2 1 2 2.5-1 2.5-2 2.5Z" /></svg>{profile.linked ? '프로필 사진 연결 해제' : discordAvailable ? 'Discord 프로필 사진 연결' : 'Discord 프로필 연결 준비 중'}</button>
          <p className="micro-copy">프로필 연결 없이도 편하게 참여할 수 있어요.</p>
        </> : <>
          <h2>{solo ? '혼자여도 좋은 밤' : '우리의 모닥불'}</h2><p className="intro">{solo ? '느긋하게 한 바퀴 걸어 보세요.' : status}</p>
          {room && <div className="invite-card"><span className="field-label">친구를 부르는 여섯 글자</span><button className="room-code" onClick={() => copy()} aria-label={`참가 코드 ${room.code} 복사`}><strong>{room.code}</strong>{copied ? <Check size={17} /> : <Copy size={17} />}</button><button className="invite-link" onClick={() => copy(true)}><Link2 size={13} /> 초대 링크 복사</button></div>}
          <div className="people-heading"><span><Users size={15} /> 함께 쉬는 사람들</span><b>{solo ? 1 : people.length}<small> / 16</small></b></div>
          <div className="people-list">{(solo ? [{ ...profile, id: 'solo', name: profile.name || '허들러' }] : people).map(p => <div className="person-row" key={p.id}><span className="person-avatar" style={{ backgroundColor: p.color + '24', color: p.color }}>{p.avatar ? <img src={p.avatar} alt="" /> : p.name.slice(0, 1)}</span><span>{p.name}{(p.id === room?.player || solo) && <small>나</small>}</span>{p.id === room?.host ? <span className="host-label">방장</span> : <span className="person-dot" />}</div>)}</div>
          <button className={'sit-button ' + (sitting ? 'is-sitting' : '')} onClick={toggleSit}><span>{sitting ? '다시 천천히 걷기' : '여기에 앉아 불멍하기'}</span><kbd>E</kbd></button>
          <ActionBar {...actionState} emotesOpen={emotesOpen} onCrouch={setCrouch} onEmotes={setEmotes} onEmote={chooseEmote} onLift={lift} onEscape={() => void runAction('escape')} onAllowCarry={allow => void runAction('allow-carry', { allow })} />
          <ChatPanel entries={chat} send={text => sendCommand('chat', { text })} onFocus={resetInput} onClose={() => canvas.current?.focus()} />
          <MusicPanel music={music} isHost={solo || isHost} hostNow={() => network.current?.hostNow() ?? performance.now()} command={sendCommand} />
          {room && !isHost && <button className="solo-button" onClick={() => network.current?.retry()}><RotateCw size={13} /> 다시 연결</button>}
          <p className="micro-copy">{solo ? '친구들과 함께하고 싶다면 새 모닥불을 피워 보세요.' : isHost ? '방장 탭을 열어 두세요. 나가면 모두의 방이 종료돼요.' : '음성 대화는 평소처럼 Discord에서 이어 가세요.'}</p>
          <button className="leave-button" onClick={() => room && isHost ? setLeaveConfirm(true) : leave()}><LogOut size={15} />{solo ? '함께하기로 돌아가기' : '모닥불 떠나기'}</button>
        </>}
        <div className="sound-card"><div className="sound-title"><Headphones size={15} /><span>숲의 소리</span><button onClick={() => changeVolume(volume ? 0 : .5)} aria-label={volume ? '소리 끄기' : '소리 켜기'} aria-pressed={volume > 0}>{volume ? <Volume2 size={17} /> : <VolumeX size={17} />}</button></div><div className="sound-slider"><span>타닥타닥</span><input aria-label="모닥불 음량" type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={e => changeVolume(Number(e.target.value) / 100)} /><span>{Math.round(volume * 100)}%</span></div></div>
        <p className="sidebar-footer">MADE FOR HUDDLERS <span>✦</span></p>
      </aside>
    </div>
    {toast && <div className="toast" role="status">{toast}</div>}
    {(help || leaveConfirm) && <div className="modal-backdrop" onClick={() => { setHelp(false); setLeaveConfirm(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="modal" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') { setHelp(false); setLeaveConfirm(false); } }}>
        <button className="modal-close" aria-label="닫기" autoFocus onClick={() => { setHelp(false); setLeaveConfirm(false); }}><X size={20} /></button>
        <Flame className="modal-flame" size={30} /><h2 id="modal-title">{leaveConfirm ? '모닥불을 마칠까요?' : '쉬어 가는 방법'}</h2>
        {leaveConfirm ? <><p>방장이 나가면 함께 있는 친구들의 방도 종료됩니다.</p><button className="primary-button" onClick={leave}>모두의 모닥불 마치기</button><button className="solo-button" onClick={() => setLeaveConfirm(false)}>조금 더 머물기</button></> : <>
          <p>새 모닥불을 피우고 여섯 자리 코드를 친구에게 전해 주세요. 최대 16명이 함께할 수 있어요.</p>
          {[['W A S D', '화면 기준으로 걷기'], ['E', '앉기 · 일어서기'], ['Shift', '누르는 동안 웅크리기 · 티배깅'], ['Q / 1~6', '감정표현 열기 · 선택'], ['F', '가까운 친구 들기 · 내려놓기'], ['Space', '들린 상태에서 내려오기'], ['Enter / Esc', '채팅 입력 · 캠프장으로 돌아가기']].map(([key, label]) => <div className="help-row" key={key}><kbd>{key}</kbd><span>{label}</span></div>)}
          <p>트램펄린을 밟으면 통통 튀어요. 가장자리에서 떨어져도 모닥불 근처로 돌아옵니다.</p>
          <p>YouTube 링크로 신청곡을 남겨 보세요. 방장이 모두의 재생을 관리하고, 함께 듣기와 음량은 각자 선택해요. 음성 대화는 기존 Discord 통화를 이용하면 됩니다.</p>
          <p className="micro-copy">방장 탭이 닫히거나 오래 응답하지 않으면 모닥불이 종료됩니다.</p>
          <button className="primary-button" onClick={() => setHelp(false)}>알겠어요, 쉬러 갈게요</button>
        </>}
      </section>
    </div>}
  </main>;
}
