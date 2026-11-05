'use client';
import { applyTheme } from '@/lib/camp-theme.mjs';
import CampNotice from '@/components/camp/camp-notice';
import SpriteArt from '@/components/camp/sprite-art';
import { Text } from '@seed-design/react';
import { Badge } from '@/seed-design/ui/badge';
import PeoplePanel from '@/components/camp/people-panel';
import { ActionButton as Button } from '@/seed-design/ui/action-button';
import { Dialog } from '@/seed-design/ui/dialog';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import PresenceEditor from '@/components/camp/presence-editor';
import CampPanel, { CAMP_PANELS, useCompactCamp, type CampPanelTab } from '@/components/camp/camp-panel';
import { useCampPip } from '@/components/camp/use-camp-pip';
import { presenceDefaults, presenceOf, PRESENCE_LABELS } from '@/lib/camp-presence.mjs';
import { emptyFire, fuelAt, stokeRemaining, stokeWaitLabel } from '@/lib/camp-fire.mjs';
import { nearestSeat } from '@/lib/camp-seats.mjs';
import { emptyBall } from '@/lib/camp-ball.mjs';
import { WorkClock, formatDuration } from '@/lib/camp-work-clock.mjs';
import { startCampTicker } from '@/lib/camp-scheduler.mjs';
import type { Presence, MapId } from '@/lib/camp-types';
import { CAMP_MAP, PLAY_MAP, SHOW_MAP, MAP_TRAVEL_COOLDOWN, mapName, canPlay, nearbyInteraction } from '@/lib/camp-maps.mjs';
import { Flame, Settings, LogOut, Copy, Check, X, RotateCw, Link2 } from 'lucide-react';
import { CampRenderer, CampAudio } from '@/lib/camp-renderer.mjs';
import { CampNetwork, api } from '@/lib/camp-network.mjs';
import { COLORS, direction, spawnPlayer, simulateWorld, applyPlayerAction, carryTarget, canUseRadio } from '@/lib/camp-world.mjs';
import { emptyMusic, applyMusicAction, parseYouTubeUrl } from '@/lib/camp-media.mjs';
import { DISCORD_MESSAGES, isDiscordCompletion } from '@/lib/camp-discord.mjs';
import { CommandLedger, chatText, validAction } from '@/lib/camp-protocol.mjs';
import ActionBar from '@/components/camp/action-bar';
import ChatPanel, { type ChatEntry } from '@/components/camp/chat-panel';
import MusicPanel, { type MusicState } from '@/components/camp/music-panel';
import MusicPlayer from '@/components/camp/music-player';
import SettingsPanel from '@/components/camp/settings-panel';
import { useCampSettings, getSettingsSnapshot } from '@/components/camp/use-camp-settings';
import CampLobby, { type Profile } from '@/components/camp/camp-lobby';
import PlayerInfoPanel, { type PlayerInfoView } from '@/components/camp/player-info-panel';
import { playerInfo } from '@/lib/camp-player-info.mjs';
import WeaponBar from '@/components/camp/weapon-bar';
import { bindCampInput, zoomFromWheel } from '@/lib/camp-input.mjs';
import { useCampSession } from '@/components/camp/use-camp-session';
import { emptyWeapons } from '@/lib/camp-weapons.mjs';
import FireProgress from '@/components/camp/fire-progress';
import GameInfoPanel from '@/components/camp/game-info-panel';

type Person = { id: string; name: string; color: string; avatar?: string | null; connected?: boolean; x?: number; y?: number; sitting?: boolean };

export default function Camp() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const rendererRef=useRef<CampRenderer|null>(null);
  const [assetStatus,setAssetStatus]=useState<{loading:boolean;failed:string[]}>({loading:true,failed:[]});
  const occlusions=useRef<{x:number;y:number;width:number;height:number;kind:string}[]>([]);
  const view = useRef({zoom:1,followSelf:true});
  const [zoom,setZoom]=useState(1), [followSelf,setFollowSelf]=useState(true), [fieldOnly,setFieldOnly]=useState(false), [compactPanel,setCompactPanel]=useState(false);
  const [panelTab,setPanelTab]=useState<CampPanelTab>('chat'), [chatFocusRequest,setChatFocusRequest]=useState(0);
  const compactScreen=useCompactCamp();
  const [myPresence,setMyPresence]=useState<Presence>(presenceDefaults());
  const workClock=useRef(new WorkClock()), soloBall=useRef(emptyBall());
  const [workTime,setWorkTime]=useState('00:00:00');
  const [presenceById,setPresenceById]=useState<Record<string,string>>({});
  const [mapId,setMapId]=useState<MapId>('camp'), [mapBusy,setMapBusy]=useState(false);
  const [nearInteraction,setNearInteraction]=useState<ReturnType<typeof nearbyInteraction>>(null),[gameId,setGameId]=useState<string|null>(null);
  const travelPending=useRef(false);
  const [mapsById,setMapsById]=useState<Record<string,string>>({});
  const seenMapRevision=useRef(0);
  const soloFire=useRef(emptyFire(performance.now())),hiddenPeople=useRef<string[]>([]);
  const [hiddenIds,setHiddenIds]=useState<string[]>([]),[seatId,setSeatId]=useState<string|null>(null),[nearSeatId,setNearSeatId]=useState<string|null>(null),[fireFuel,setFireFuel]=useState(120),[stokeWait,setStokeWait]=useState(0);
  const [fireProgress,setFireProgress]=useState({xp:0,style:'amber'});
  const stokeReady=stokeWait===0,seatPending=useRef(false);
  const [unreadCalls,setUnreadCalls]=useState<ChatEntry[]>([]);
  const seenCalls=useRef(new Set<string>());
  const pip=useCampPip(()=>{closePlayerInfo();resetInput();});
  useEffect(()=>{view.current={zoom,followSelf};},[zoom,followSelf]);
  const network = useRef<CampNetwork | null>(null);
  const audio = useRef<CampAudio | null>(null);
  const keys = useRef(new Set<string>());
  const aimRef = useRef<{ dx: number; dy: number } | null>(null), soloWeapons = useRef(emptyWeapons());
  const sittingRef = useRef(false), soloRef = useRef(false);
  const touchRunRef = useRef(false), selectedPlayerRef = useRef<string | null>(null);
  const crouchRef = useRef(false), emotesRef = useRef(false), lockedRef = useRef(false), soloPose = useRef('standing');
  const soloPlayer = useRef({ id: 'solo', name: '허들러', color: COLORS[0], ...spawnPlayer() });
  const scene = useRef({ name: '허들러', color: COLORS[0] });
  const soloWorld = useRef(new Map([['solo', soloPlayer.current]]));
  const soloLedger = useRef(new CommandLedger()), soloMusic = useRef(emptyMusic()), soloChat = useRef<ChatEntry[]>([]);
  const [profile, setProfile] = useState<Profile>({ name: '', color: COLORS[0], avatar: null, linked: false });
  const [discordAvailable, setDiscordAvailable] = useState(false);
  const [discordBusy, setDiscordBusy] = useState(false), [discordMessage, setDiscordMessage] = useState('');
  const discordPopup = useRef<Window | null>(null), discordPoll = useRef<number | null>(null);
  const [settings, setSettings] = useCampSettings();
  const themeRef = useRef(settings.theme);
  useEffect(() => { themeRef.current = getSettingsSnapshot().theme; applyTheme(document, themeRef.current); }, [settings.theme]);
  const [settingsOpen, setSettingsOpen] = useState(false), [carryBusy, setCarryBusy] = useState(false);
  const effectsNeedsGesture = useRef(true), sceneMusic = useRef<MusicState>(emptyMusic());
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [solo, setSolo] = useState(false);
  const [connected, setConnected] = useState(1);
  const [code, setCode] = useState('');
  const [error, setError] = useState(''), [toast, setToast] = useState('');
  const [sitting, setSitting] = useState(false);
  const [help, setHelp] = useState(false), [leaveConfirm, setLeaveConfirm] = useState(false);
  const [copied, setCopied] = useState(false), [elapsed, setElapsed] = useState(0);
  const [chat, setChat] = useState<ChatEntry[]>([]), [music, setMusic] = useState<MusicState>(emptyMusic());
  const [emotesOpen, setEmotesOpen] = useState(false);
  const [radioOpen, setRadioOpen] = useState(false), [nearRadio, setNearRadio] = useState(false);
  const [runMode, setRunMode] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<PlayerInfoView | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<{ x: number; y: number } | null>(null);
  const [actionState, setActionState] = useState({ crouching: false, carrying: false, carried: false, allowCarry: true, motion: 'grounded', weapon: 'none', fireReady: true, canFire: false, target: null as string | null });
  const {room,people,status,setStatus,connectRoom,disconnectRoom} = useCampSession({networkRef:network,
    onChat:setChat,onMusic:setMusic,onHost:()=>{resetInput();setToast('새 방장에게 연결하고 있어요.');},
    onCall:entry=>{if(entry.to===network.current?.player&&!seenCalls.current.has(entry.id)){seenCalls.current.add(entry.id);if(seenCalls.current.size>200)seenCalls.current.delete(seenCalls.current.values().next().value!);setUnreadCalls(previous=>[...previous,entry].slice(-20));setToast(entry.name+'님이 불렀어요.');}},
    onEnded:(text)=>{
      pip.close();setFieldOnly(false);setCompactPanel(false);resetInput();setRadioOpen(false);setChat([]);setMusic(emptyMusic());setError(text);
      // Drop the dead invitation before refreshing, so the lobby cannot reuse it.
      const url=new URL(window.location.href);
      url.searchParams.delete('room');url.searchParams.set('notice','room-ended');
      window.history.replaceState(null,'',url);window.location.reload();
    },
  });
  const active = !!room || solo, isHost = room?.player === room?.host;
  const panelVisible=active&&(!(fieldOnly||compactScreen)||compactPanel);
  const modalOpen = help || leaveConfirm || radioOpen || settingsOpen || !!selectedInfo || !!gameId;
  const volume = settings.effectsVolume;
  const effectClosePip = useEffectEvent(()=>pip.close());
  const effectReset = useEffectEvent(() => resetInput());
  const effectCrouch = useEffectEvent((down: boolean) => setCrouch(down));
  const effectEmote = useEffectEvent((emote: string) => chooseEmote(emote));
  const effectLift = useEffectEvent(() => lift());
  const effectJump = useEffectEvent(() => jumpOrEscape());
  const effectEquip = useEffectEvent((weapon: string) => equipWeapon(weapon));
  const effectFire = useEffectEvent((aim?: { dx: number; dy: number } | null) => fireWeapon(aim));
  const effectPlayer = useEffectEvent((id: string, x: number, y: number) => openPlayerInfo(id, x, y));
  const effectRefreshPlayer = useEffectEvent(() => refreshPlayerInfo());
  const effectSeat = useEffectEvent((id:string)=>{void sitOnSeat(id);});
  const effectSit = useEffectEvent(() => interactOrSit());
  const effectRadio = useEffectEvent(() => openRadio());
  const effectDiscordFinished = useEffectEvent((notice: string) => { void finishDiscord(notice); });
  const effectChat = useEffectEvent(() => { if(active) showPanel('chat',true); });

  useEffect(() => {
    const focusChat=()=>effectChat();
    window.addEventListener('camp-chat-focus',focusChat);
    return()=>window.removeEventListener('camp-chat-focus',focusChat);
  },[]);

  useEffect(() => {
    const message = (event: MessageEvent) => {
      if (isDiscordCompletion(event, location.origin, discordPopup.current)) effectDiscordFinished(event.data.notice);
    };
    window.addEventListener('message', message);
    return () => {
      window.removeEventListener('message', message);
      if (discordPoll.current !== null) window.clearInterval(discordPoll.current);
      discordPopup.current?.close();
    };
  }, []);
  useEffect(() => { sceneMusic.current = music; }, [music]);

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
      if (invitation) setCode(invitation.slice(0, 6).toUpperCase());
      const notice = params.get('notice');
      if (notice) {
        if(notice==='room-ended')setError('방 연결이 종료되어 새로고침했어요. 새 방으로 입장해 주세요.');
        else setToast(notice === 'discord-linked' ? 'Discord 계정을 연결했어요.' : notice === 'discord-cancelled' ? 'Discord 연결을 취소했어요. Discord 계정을 연결한 뒤 참여해 주세요.' : 'Discord 연결을 준비하고 있어요.');
        params.delete('notice'); history.replaceState(null, '', location.pathname + (params.size ? '?' + params : '') + location.hash);
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
    const renderer = new CampRenderer(canvas.current, () => ({ ...scene.current, ...view.current, theme: themeRef.current, onAssets:setAssetStatus,
      players: network.current ? [...network.current.players.values()] : soloRef.current ? [soloPlayer.current] : [],
      self: network.current?.player || (soloRef.current ? 'solo' : undefined),
      now: network.current?.hostNow() ?? performance.now(),
      targetId: network.current ? carryTarget(network.current.players, network.current.player)?.id : null,
      selectedId: selectedPlayerRef.current,
      weapons: network.current?.weapons || soloWeapons.current,
      ball: network.current?.ball || soloBall.current,
      music: sceneMusic.current,fire:network.current?.fire||soloFire.current,chat:network.current?.chat||soloChat.current,hiddenIds:hiddenPeople.current,occlusions:occlusions.current,
    }));
    rendererRef.current=renderer;
    const inputWindow=canvas.current.ownerDocument.defaultView || window;
    const unbindInput = bindCampInput({node:canvas.current,win:inputWindow,doc:canvas.current.ownerDocument,keys:keys.current,
      locked:()=>lockedRef.current,active:()=>!!network.current||soloRef.current,emotes:()=>emotesRef.current,setEmotes,
      reset:effectReset,update:updateInput,startMove:()=>{sittingRef.current=false;setSitting(false);setEmotes(false);},
      crouch:effectCrouch,emote:effectEmote,equip:effectEquip,fire:effectFire,jump:effectJump,lift:effectLift,radio:effectRadio,sit:effectSit,player:effectPlayer,
      self:()=>network.current?network.current.players.get(network.current.player):soloRef.current?soloPlayer.current:null,
      aim:(x,y)=>renderer.aimDirection(x,y,network.current?network.current.players.get(network.current.player):soloRef.current?soloPlayer.current:null),
      seat:effectSeat,pickSeat:(x,y)=>renderer.pickSeat(x,y),
      zoom:(deltaY,deltaMode)=>setZoom(previous=>zoomFromWheel(previous,deltaY,deltaMode)),
      setAim:aim=>{aimRef.current=aim;},pick:(x,y,touch)=>renderer.pickPlayer(x,y,touch),
    });
    const chatFromPip=()=>{if(inputWindow!==window){effectClosePip();setTimeout(()=>window.dispatchEvent(new Event('camp-chat-focus')),100);}};
    inputWindow.addEventListener('camp-chat-focus',chatFromPip);
    let last = performance.now();
    const stopTick = startCampTicker(() => {
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      const input = updateInput();
      if (soloRef.current) simulateWorld(soloWorld.current, new Map([['solo', input]]), dt, now, soloWeapons.current, soloBall.current);
    });
    const summary = setInterval(() => {
      const node=canvas.current;
      if(node){const base=node.getBoundingClientRect(),doc=node.ownerDocument;
        occlusions.current=[...doc.querySelectorAll<HTMLElement>('.field-tools,.map-travel,.work-chip,.session-chip,.fire-seat-tools,.music-dock,.touch-actions,.touch-controls')].filter(e=>e.getClientRects().length&&doc.defaultView?.getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return{x:r.x-base.x,y:r.y-base.y,width:r.width,height:r.height,kind:e.classList.contains('music-dock')?'music':'hud'};});
      }
      const n = network.current;
      const statuses=Object.fromEntries((n?[...n.players.values()]:[soloPlayer.current]).map(p=>[p.id,p.presence]));
      setPresenceById(previous=>JSON.stringify(previous)===JSON.stringify(statuses)?previous:statuses);
      const locations=Object.fromEntries((n?[...n.players.values()]:[soloPlayer.current]).map(p=>[p.id,p.mapId]));
      setMapsById(previous=>JSON.stringify(previous)===JSON.stringify(locations)?previous:locations);
      if (n) setConnected([...n.players.values()].filter(p => p.connected).length);
      effectRefreshPlayer();
      const self = n ? n.players.get(n.player) : soloRef.current ? soloPlayer.current : null;
      setNearRadio(canUseRadio(self));
      setNearInteraction(nearbyInteraction(self));
      if(!self||self.mapId!==SHOW_MAP)setGameId(null);
      const currentFire=n?.fire||soloFire.current,currentTime=n?.hostNow()??performance.now();
      setSeatId(self?.seatId||null);setNearSeatId(self?nearestSeat(n?.players||soloWorld.current,self)?.id||null:null);
      setFireFuel(Math.round(fuelAt(currentFire,currentTime)));setStokeWait(Math.ceil(stokeRemaining(self,currentTime)/1000)*1000);
      setFireProgress(previous=>previous.xp===currentFire.xp&&previous.style===currentFire.style?previous:{xp:currentFire.xp,style:currentFire.style});
      audio.current?.updateScene(currentFire,currentTime,!self||self.mapId===CAMP_MAP);
      if (self) {
        setMapId(self.mapId);
        if (seenMapRevision.current !== self.mapRevision) {
          seenMapRevision.current=self.mapRevision;
          sittingRef.current=!!self.sitting;effectReset();aimRef.current=null;setEmotes(false);closePlayerInfo();soloPose.current=self.sitting?'sitting':'standing';
        }
        if (self.motion !== 'grounded') { sittingRef.current = false; crouchRef.current = false; }
        setSitting(self.sitting);
        const presence=presenceOf(self);setMyPresence(previous=>JSON.stringify(previous)===JSON.stringify(presence)?previous:presence);
        const next = { crouching: !!self.crouching, carrying: !!self.carrying, carried: !!self.carriedBy, allowCarry: !!self.allowCarry, motion: self.motion, weapon: self.weapon || 'none', fireReady: self.nextShotAt <= (n?.hostNow() ?? performance.now()), canFire: canPlay(self) && !self.carrying && !self.carriedBy && !self.thrown && ['grounded', 'airborne'].includes(self.motion), target: n ? carryTarget(n.players, n.player)?.name || null : null };
        setActionState(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      }
    }, 100);
    return () => {
      renderer.destroy(); rendererRef.current=null; unbindInput(); inputWindow.removeEventListener('camp-chat-focus',chatFromPip);
      stopTick(); clearInterval(summary);
    };
  }, [pip.pipWindow]);
  useEffect(()=>{
    const sound=new CampAudio();audio.current=sound;
    const resume=()=>{void sound.resume().catch(()=>{effectsNeedsGesture.current=true;});};
    document.addEventListener('visibilitychange',resume);window.addEventListener('pageshow',resume);
    return()=>{document.removeEventListener('visibilitychange',resume);window.removeEventListener('pageshow',resume);sound.destroy();};
  },[]);
  useEffect(()=>{
    const sound=audio.current;
    if(sound&&sound.volume!==volume)void sound.setVolume(volume).catch(()=>{effectsNeedsGesture.current=true;});
  },[volume]);
  useEffect(() => { lockedRef.current = modalOpen; if (lockedRef.current) effectReset(); }, [modalOpen]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!active) return;
    const clock=workClock.current;clock.reset();
    const start = performance.now(), timer = setInterval(() => {setElapsed(Math.floor((performance.now() - start) / 1000));setWorkTime(formatDuration(clock.read(performance.now())));}, 1000);
    return () => {clearInterval(timer);clock.reset();};
  }, [active]);
  useEffect(()=>{workClock.current.setWorking(active&&myPresence.presence==='working',performance.now());},[active,myPresence.presence]);

  async function saveProfile() {
    const data = await api('session', { name: profile.name || '허들러', color: profile.color });
    setProfile(data.profile); return data.profile;
  }
  async function enter(mode: 'create' | 'join', selectedCode=code, creation?:{title:string;visibility:string}) {
    if(!profile.linked){setError('Discord 계정을 연결한 뒤 입장해 주세요.');return;}
    hiddenPeople.current=[];setHiddenIds([]);
    aimRef.current = null;
    setPanelTab('chat');setCompactPanel(false);
    setBusy(true); setError('');
    try {
      if (!window.RTCPeerConnection) throw new Error('이 브라우저에서는 함께하기를 지원하지 않아요. 최신 Chrome 또는 Edge를 사용해 주세요.');
      const p = await saveProfile();
      sittingRef.current=false;crouchRef.current=false;setSitting(false);setElapsed(0);setWorkTime('00:00:00');setChat([]);setMusic(emptyMusic());
      await connectRoom(mode,p,selectedCode,settings.allowCarry,creation);
      seenCalls.current.clear();setUnreadCalls([]);setMyPresence(presenceDefaults());
      canvas.current?.focus();
    } catch (e) { setError(e instanceof Error ? e.message : '입장하지 못했어요.'); }
    finally { setBusy(false); }
  }
  function enterSolo() {
    if(!profile.linked){setError('Discord 계정을 연결한 뒤 입장해 주세요.');return;}
    hiddenPeople.current=[];setHiddenIds([]);soloFire.current=emptyFire(performance.now());
    setMapId('camp');seenMapRevision.current=0;
    setPanelTab('chat');setCompactPanel(false);
    soloWeapons.current = emptyWeapons(); soloBall.current=emptyBall();setMyPresence(presenceDefaults()); aimRef.current = null;
    soloRef.current = true; setSolo(true); setError(''); sittingRef.current = false; setSitting(false);
    Object.assign(soloPlayer.current, spawnPlayer(), { allowCarry: settings.allowCarry }); soloPose.current = 'standing'; crouchRef.current = false;
    soloLedger.current = new CommandLedger(); soloMusic.current = emptyMusic(); soloChat.current = [];
    setChat([]); setMusic(emptyMusic()); setElapsed(0); setWorkTime('00:00:00');canvas.current?.focus();
  }
  function leave() {
    hiddenPeople.current=[];setHiddenIds([]);setSeatId(null);
    pip.close();setFieldOnly(false);setCompactPanel(false);setUnreadCalls([]);seenCalls.current.clear();
    soloWeapons.current = emptyWeapons(); aimRef.current = null;
    closePlayerInfo(); touchRunRef.current = false; setRunMode(false);
    setRadioOpen(false); setNearRadio(false);
    disconnectRoom(); soloRef.current = false;
    setSolo(false); setLeaveConfirm(false); keys.current.clear(); sittingRef.current = false; crouchRef.current = false; setSitting(false); setEmotes(false); setChat([]); setMusic(emptyMusic());
    setStatus(''); setError(''); setToast('다음 모닥불에서 또 만나요.');
  }
  function cancelDiscord() {
    if (discordPoll.current !== null) window.clearInterval(discordPoll.current);
    discordPoll.current = null; discordPopup.current?.close(); discordPopup.current = null; setDiscordBusy(false);
  }
  async function finishDiscord(notice: string) {
    cancelDiscord();
    try {
      const data = await api('session');
      if (data.profile) {
        setProfile(data.profile);
        const n = network.current, self = n?.players.get(n.player);
        if (self) self.avatar = data.profile.avatar;
      }
      const key = Object.hasOwn(DISCORD_MESSAGES, notice) ? notice as keyof typeof DISCORD_MESSAGES : 'discord-failed';
      const message = data.profile?.linked && key === 'discord-cancelled' ? DISCORD_MESSAGES['discord-linked'] : DISCORD_MESSAGES[key];
      setDiscordMessage(message); setToast(message);
    } catch { setDiscordMessage('연결 결과를 확인하지 못했어요. 다시 시도해 주세요.'); }
  }
  async function linkDiscord() {
    if (discordBusy || !discordAvailable) return;
    const popup = window.open('about:blank', 'huddlers-discord', 'popup,width=520,height=720');
    if (!popup) { setDiscordMessage('팝업을 허용한 뒤 다시 연결해 주세요.'); return; }
    popup.document.title = 'Discord 연결'; popup.document.body.textContent = 'Discord 연결을 준비하고 있어요…';
    discordPopup.current = popup; setDiscordBusy(true); setDiscordMessage(''); resetInput();
    try {
      await saveProfile();
      if (discordPopup.current !== popup || popup.closed) { cancelDiscord(); return; }
      popup.location.href = '/api/camp/discord/start';
      const deadline = Date.now() + 5 * 60_000;
      discordPoll.current = window.setInterval(() => {
        if (popup.closed) void finishDiscord('discord-cancelled');
        else if (Date.now() >= deadline) void finishDiscord('discord-expired');
      }, 700);
    } catch { cancelDiscord(); setDiscordMessage('연결을 시작하지 못했어요. 다시 시도해 주세요.'); }
  }
  async function unlink() {
    if(active){setDiscordMessage('방을 떠난 뒤 Discord 연결을 해제해 주세요.');return;}
    setDiscordBusy(true);
    try {
      await api('discord/unlink', {}); setProfile(p => ({ ...p, avatar: null, linked: false }));
      const n = network.current, self = n?.players.get(n.player); if (self) self.avatar = null;
      setDiscordMessage('Discord 사진 연결을 해제했어요.'); setToast('Discord 사진 연결을 해제했어요.');
    } catch { setDiscordMessage('연결을 해제하지 못했어요. 다시 시도해 주세요.'); }
    finally { setDiscordBusy(false); }
  }
  async function copy(invite = false) {
    if (!room) return;
    try { await navigator.clipboard.writeText(invite ? location.origin + '/?room=' + room.code : room.code); setCopied(true); setToast(invite ? '초대 링크를 복사했어요.' : '참가 코드를 복사했어요.'); setTimeout(() => setCopied(false), 2000); }
    catch { setToast('코드를 직접 복사해 주세요: ' + room.code); }
  }
  async function changeVolume(value: number) {
    setSettings(s => ({ ...s, effectsVolume: value }));
    try { await audio.current?.setVolume(value); effectsNeedsGesture.current = !!value&&audio.current?.context?.state!=='running'; }
    catch { if(audio.current?.volume===value){effectsNeedsGesture.current=true;setToast('효과음을 켜지 못했어요. 다시 눌러 주세요.');} }
  }
  function resumeEffectsSound() {
    if ((!effectsNeedsGesture.current&&audio.current?.context?.state==='running'&&audio.current.noise) || !volume) return;
    effectsNeedsGesture.current = false;
    void audio.current?.setVolume(volume).catch(() => { effectsNeedsGesture.current = true; });
  }
  async function changeAllowCarry(allow: boolean) {
    if (carryBusy) return; setCarryBusy(true);
    try {
      if (network.current) await network.current.setCarryPreference(allow);
      else if (soloRef.current) await sendCommand('allow-carry', { allow });
      setSettings(s => ({ ...s, allowCarry: allow }));
    } catch (failure) { setToast(failure instanceof Error ? failure.message : '설정을 바꾸지 못했어요.'); }
    finally { setCarryBusy(false); }
  }
  function updateInput() {
    const input = { ...direction(keys.current), sitting: sittingRef.current, crouching: crouchRef.current,
      running: !lockedRef.current && !crouchRef.current && !sittingRef.current && (touchRunRef.current || keys.current.has('ShiftLeft') || keys.current.has('ShiftRight')) };
    network.current?.setInput(input);
    if (soloRef.current) {
      const posture = input.crouching ? 'crouching' : input.sitting ? 'sitting' : 'standing';
      if (posture !== soloPose.current) { applyPlayerAction(soloWorld.current, 'solo', { kind: 'posture', posture }, performance.now()); soloPose.current = posture; }
    }
    return input;
  }
  function resetInput() { keys.current.clear(); crouchRef.current = false; touchRunRef.current = false; setRunMode(false); updateInput(); }
  function toggleRun() { touchRunRef.current = !touchRunRef.current; setRunMode(touchRunRef.current); updateInput(); canvas.current?.focus(); }
  function equipWeapon(weapon: string) {
    if (lockedRef.current) return;
    setEmotes(false); void runAction('equip', { weapon }); canvas.current?.focus();
  }
  function fireWeapon(aim?: { dx: number; dy: number } | null) {
    if (lockedRef.current) return;
    const n = network.current, self = n ? n.players.get(n.player) : soloRef.current ? soloPlayer.current : null;
    if (!self || !canPlay(self) || self.weapon === 'none' || self.carrying || self.carriedBy || self.thrown || !['grounded', 'airborne'].includes(self.motion) || self.nextShotAt > (n?.hostNow() ?? performance.now())) return;
    const direction = aim || aimRef.current || { dx: self.aimX, dy: self.aimY };
    sittingRef.current = false; crouchRef.current = false; setSitting(false); setEmotes(false); updateInput();
    void runAction('fire', direction); canvas.current?.focus();
  }
  function jumpOrEscape() {
    const n = network.current, self = n ? n.players.get(n.player) : soloRef.current ? soloPlayer.current : null;
    if (!self || lockedRef.current) return;
    if (self.carriedBy) { void runAction('escape'); return; }
    if (self.motion !== 'grounded' || self.jumpAt >= 0) return;
    sittingRef.current = false; crouchRef.current = false; setSitting(false); setEmotes(false); updateInput();
    void runAction('jump'); canvas.current?.focus();
  }
  function closePlayerInfo() { selectedPlayerRef.current = null; setSelectedInfo(null); setInfoAnchor(null); }
  function refreshPlayerInfo() {
    const id = selectedPlayerRef.current;
    if (!id) return;
    const n = network.current;
    if ((!n && !soloRef.current) || (n && id !== n.player && !n.members.some((p: Person) => p.id === id))) { closePlayerInfo(); return; }
    const member = n?.members.find((p: Person) => p.id === id);
    const p = n ? n.players.get(id) || (member ? { ...member, connected: false } : null) : id === 'solo' ? soloPlayer.current : null;
    if (!p) { closePlayerInfo(); return; }
    const next = playerInfo(p, n?.player || 'solo', room?.host, n?.hostNow() ?? performance.now());
    setSelectedInfo(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
  }
  function openPlayerInfo(id: string, x: number, y: number) {
    if (!active || lockedRef.current) return;
    resetInput(); setEmotes(false); selectedPlayerRef.current = id;
    const owner=canvas.current?.ownerDocument.defaultView || window;
    setInfoAnchor({ x: Math.max(12, Math.min(x + 12, owner.innerWidth - 316)), y: Math.max(12, Math.min(y + 12, owner.innerHeight - 430)) });
    refreshPlayerInfo(); if (selectedPlayerRef.current) lockedRef.current = true;
  }
  function openRadio() {
    if(pip.pipWindow)pip.close();
    const n = network.current, self = n ? n.players.get(n.player) : soloRef.current ? soloPlayer.current : null;
    if (!self || lockedRef.current) return;
    resetInput(); setEmotes(false); lockedRef.current = true; setRadioOpen(true);
  }
  function setCrouch(down: boolean) { crouchRef.current = down; if (down) { sittingRef.current = false; setSitting(false); } updateInput(); }
  function setEmotes(open: boolean) { emotesRef.current = open; setEmotesOpen(open); if(open){setPanelTab('play');setCompactPanel(true);} }
  function showPanel(tab:CampPanelTab,focusChat=false) {
    resetInput();setEmotes(false);setPanelTab(tab);setCompactPanel(true);
    if(focusChat)setChatFocusRequest(v=>v+1);
  }
  function closePanel() {setCompactPanel(false);resetInput();setEmotes(false);canvas.current?.focus({preventScroll:true});}
  async function sitOnSeat(id:string) {
    if(lockedRef.current||seatPending.current)return;resetInput();setEmotes(false);
    const n=network.current,token=n||soloLedger.current;
    const previous=sittingRef.current;
    // Keydown/keyup and the simulation tick also send posture while this command is awaiting its reply.
    // Set the intended pose synchronously so they cannot immediately stand up after a successful seat.
    seatPending.current=true;sittingRef.current=true;crouchRef.current=false;setSitting(true);
    try{await sendCommand('seat',{seatId:id});}
    catch(failure){
      if((network.current||soloLedger.current)===token){
        if(sittingRef.current){sittingRef.current=previous;setSitting(previous);updateInput();}
        setToast(failure instanceof Error?failure.message:'자리에 앉지 못했어요.');
      }
    }finally{seatPending.current=false;}
    if((network.current||soloLedger.current)===token){updateInput();canvas.current?.focus();}
  }
  function toggleSit() {
    if(lockedRef.current||seatPending.current)return;
    const n=network.current,self=n?n.players.get(n.player):soloRef.current?soloPlayer.current:null;
    const seat=self&&!self.seatId?nearestSeat(n?.players||soloWorld.current,self):null;
    if(seat){void sitOnSeat(seat.id);return;}
    crouchRef.current=false;sittingRef.current=!sittingRef.current;setSitting(sittingRef.current);updateInput();canvas.current?.focus();
  }
  function toggleHidden(id:string){
    const next=hiddenPeople.current.includes(id)?hiddenPeople.current.filter(p=>p!==id):[...hiddenPeople.current,id];
    hiddenPeople.current=next;setHiddenIds(next);
  }
  async function sendCommand(kind: string, data: Record<string, unknown> = {}) {
    const connection = network.current, ledger = soloLedger.current;
    if (!connection && !soloRef.current) throw new Error('먼저 캠프장에 들어와 주세요.');
    if (kind === 'music-add') {
      const videoId = parseYouTubeUrl(data.url);
      if (!videoId) throw new Error('YouTube 영상 링크를 확인해 주세요.');
      let title = videoId;
      try { title = (await api('music-metadata?videoId=' + videoId)).title || videoId; } catch { /* Playback still works without metadata. */ }
      data = { ...data, title };
      if (network.current !== connection || soloLedger.current !== ledger) throw new Error('캠프장이 바뀌었어요. 다시 신청해 주세요.');
    }
    if (network.current) {
      const current=network.current,result=await current.command(kind, data);
      if(kind==='presence'&&network.current===current){const p=presenceOf(data);workClock.current.setWorking(p.presence==='working',performance.now());setMyPresence(p);}
      return result;
    }
    if (!soloRef.current) throw new Error('먼저 캠프장에 들어와 주세요.');
    const action = { ...data, kind, id: crypto.randomUUID() }, now = performance.now();
    if (!validAction(action)) throw new Error('요청 내용을 확인해 주세요.');
    if (!soloLedger.current.permit('solo', kind, now)) throw new Error('잠깐 기다렸다가 다시 해주세요.');
    const member = soloPlayer.current;
    let failure = null;
    if (kind === 'chat') {
      const text = chatText(String(data.text));
      if (!text) throw new Error('메시지를 입력해 주세요.');
      const entry:ChatEntry = { id: action.id, by: 'solo', name: member.name, color: member.color, text, at: now, createdAt:Date.now(), mapId:member.mapId as MapId, kind:'chat' };
      soloChat.current = [...soloChat.current, entry].slice(-100); setChat(soloChat.current);
      Object.assign(member, { bubble: text, bubbleUntil: now + 5000 });
    } else if (kind.startsWith('music-')) {
      failure = applyMusicAction(soloMusic.current, action, member, true, now); setMusic(structuredClone(soloMusic.current));
    } else failure = applyPlayerAction(soloWorld.current, 'solo', action, now, soloWeapons.current,soloFire.current);
    if (failure) throw new Error(failure);
    if(kind==='presence'){workClock.current.setWorking(member.presence==='working',performance.now());setMyPresence(presenceOf(member));}
  }
  async function runAction(kind: string, data: Record<string, unknown> = {}) {
    try { await sendCommand(kind, data); }
    catch (failure) { setToast(failure instanceof Error ? failure.message : '동작을 사용할 수 없어요.'); }
  }
  function standForAction() { sittingRef.current = false; crouchRef.current = false; keys.current.clear(); setSitting(false); updateInput(); }
  function chooseEmote(emote: string) { standForAction(); setEmotes(false); void runAction('emote', { emote }); canvas.current?.focus(); }
  function lift() {
    const n = network.current, self=n?n.players.get(n.player):soloPlayer.current;
    if (!canPlay(self)) {setToast('친구 들기와 던지기는 놀이터에서 할 수 있어요.');return;}
    if(self?.sitting){setToast('일어난 뒤 친구를 들어 주세요.');return;}
    standForAction();
    void runAction('lift', { target: n ? carryTarget(n.players, n.player)?.id || null : null }); canvas.current?.focus();
  }

  function interactOrSit() {
    if(lockedRef.current||travelPending.current)return;
    const n=network.current,self=n?n.players.get(n.player):soloRef.current?soloPlayer.current:null;
    const target=nearbyInteraction(self);
    if(!target){toggleSit();return;}
    if(target.type==='portal'){void changeMap();return;}
    if(target.type==='gameBooth'){
      if(pip.pipWindow)pip.close();
      resetInput();setEmotes(false);lockedRef.current=true;setGameId(target.gameId);
    }
  }
  async function changeMap() {
    if (travelPending.current || lockedRef.current) return;
    const n=network.current, self=n?n.players.get(n.player):soloPlayer.current;
    const portal=nearbyInteraction(self);
    if (!self || portal?.type!=='portal') return;
    const destination=portal.destination;
    travelPending.current=true;
    setMapBusy(true);sittingRef.current=false;setSitting(false);resetInput();setEmotes(false);aimRef.current=null;
    try {await sendCommand('change-map',{mapId:destination,portalId:portal.id,mapRevision:self.mapRevision});setToast(mapName(destination)+'로 이동했어요.');}
    catch (failure) {setToast(failure instanceof Error?failure.message:'장소를 이동하지 못했어요.');}
    finally {
      // Keep the button busy through the host's travel cooldown, including fast local acknowledgments.
      await new Promise(resolve=>setTimeout(resolve,MAP_TRAVEL_COOLDOWN));
      travelPending.current=false;setMapBusy(false);resetInput();canvas.current?.focus();
    }
  }
  const playing=active&&mapId===PLAY_MAP,showing=active&&mapId===SHOW_MAP;
  const world = (<section className="world" aria-label={showing?'허들러즈 게임 전시장':playing?'숲속 놀이터':'불멍 캠프장'}>
        {(assetStatus.loading||assetStatus.failed.length>0)&&<div className="scene-status" role="status">{assetStatus.failed.length>0?<><span>풍경을 불러오지 못했어요.</span><Button size="small" onClick={()=>void rendererRef.current?.retryAssets()}>다시 불러오기</Button></>:<span>캠프에 불을 밝히고 있어요…</span>}</div>}
        <canvas data-camp-input ref={canvas} tabIndex={0} aria-label={`쿼터뷰 캠프장. 배율 ${Math.round(zoom*100)}%. 마우스 휠로 확대·축소. WASD 이동, Shift 달리기, Space 점프와 내려오기, E 가까운 포탈·부스 상호작용 또는 앉기, C 웅크리기, Q 감정표현, 놀이터에서 F 친구 들기·던지기, 1 총, 2 눈뭉치, 3 폭탄, 0 맨손, J 또는 우클릭으로 사용, R 어디서든 라디오 열기, Enter 채팅. 플레이어를 눌러 정보를 확인하세요.`} />
        <div className="world-heading"><Badge tone="neutral" variant="weak">{active?(showing?'게임 전시장':playing?'놀이터':'불멍'):'A PLACE TO GATHER'}</Badge><Text as="h2" textStyle="t7Bold">{active?(showing?'만드는 즐거움을 나누는 곳':playing?'마음껏, 함께 놀아요':'잠시 쉬어 가도 좋아요'):'우리들의 작은 쉼터'}</Text></div>
        {active && <div className="session-chip"><span className="live-dot" />{solo ? '나만의 산책' : `${connected}명과 함께`}<span className="chip-divider" />{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</div>}
        {active&&<div className="work-chip"><strong>{PRESENCE_LABELS[myPresence.presence as keyof typeof PRESENCE_LABELS]}</strong><span>내 작업 {workTime}</span></div>}
        {active&&<div className="map-travel"><span aria-live="polite">{mapName(mapId)} · {Object.values(mapsById).filter(id=>id===mapId).length || 1}명</span><small>{mapId===CAMP_MAP?'△ 놀이터 · □ 전시장':'○ 불멍으로'}</small></div>}
        {active&&nearInteraction&&<Button className="world-interact" disabled={mapBusy} onClick={interactOrSit}>{mapBusy?'이동 중…':nearInteraction.type==='portal'?`${nearInteraction.label} 포탈 타기`:`${nearInteraction.label} 소개 보기`} <kbd>E</kbd></Button>}
        {active&&mapId===CAMP_MAP&&<div className={'fire-seat-tools'+(seatId?' is-seated':'')}><span>{seatId?'불 곁에서 · ':'모닥불 · '}{fireFuel>150?'활활':fireFuel>30?'따뜻함':'잔불'} · Lv.{Math.min(5,1+Math.floor(fireProgress.xp/3))}</span>
          {seatId&&<details className="fire-seat-more"><summary>불 모습 바꾸기</summary><FireProgress {...fireProgress} change={style=>runAction('fire-style',{style})}/></details>}
          {seatId?<><Button disabled={!stokeReady||fireFuel>=239} onClick={()=>void runAction('add-firewood')}>{!stokeReady?`다음 장작 ${stokeWaitLabel(stokeWait)}`:fireFuel>=239?'불이 충분히 타고 있어요':'장작 넣기'}</Button><Button onClick={toggleSit}>일어나기 <kbd>E</kbd></Button><small>장작 +1 XP · 인당 10분에 한 번<br/>사람 탭에서 친구를 내 화면에서 숨길 수 있어요.</small></>:nearSeatId?<Button onClick={()=>void sitOnSeat(nearSeatId)}>통나무에 앉기 <kbd>E</kbd></Button>:<small>통나무 가까이에서 E로 앉아 보세요.</small>}</div>}
        {active && nearRadio && <Button className="radio-interact" onClick={openRadio}>라디오 설정 <kbd>R</kbd></Button>}
        <div className="world-bottom"><div className="movement-guide"><span className="keys"><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span><span>이동</span><kbd>Shift</kbd><span>달리기</span><kbd>Space</kbd><span>점프</span><kbd>E</kbd><span>상호작용 · 앉기</span></div><span className="world-caption">{active ? '친구를 누르면 정보를 볼 수 있어요.' : '어디에 앉아도, 좋은 자리.'}</span></div>
        {active && <div className="touch-controls" aria-label="이동 버튼">{[['KeyW', '↑'], ['KeyA', '←'], ['KeyS', '↓'], ['KeyD', '→']].map(([key, label]) => <Button key={key} aria-label={`${label} 이동`} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); keys.current.add(key); sittingRef.current = false; setSitting(false); updateInput(); }} onPointerUp={() => keys.current.delete(key)} onPointerCancel={() => keys.current.delete(key)} onLostPointerCapture={() => keys.current.delete(key)}>{label}</Button>)}</div>}
        {active && <div className="touch-actions" aria-label="이동 동작"><Button variant={runMode?'neutralSolid':'neutralWeak'} aria-pressed={runMode} onPointerDown={e => e.preventDefault()} onClick={toggleRun}>{runMode ? '달리기 켜짐' : '달리기'}</Button><Button disabled={actionState.motion !== 'grounded' && !actionState.carried} onPointerDown={e => e.preventDefault()} onClick={jumpOrEscape}>{actionState.carried ? '내려오기' : '점프'}</Button><Button variant={sitting?'neutralSolid':'neutralWeak'} aria-pressed={sitting} onPointerDown={e => e.preventDefault()} onClick={toggleSit}>{sitting ? '일어나기' : '앉기'}</Button></div>}
        {active && playing && actionState.weapon !== 'none' && <Button className="touch-fire" disabled={!actionState.canFire || !actionState.fireReady} onPointerDown={e => e.preventDefault()} onClick={() => fireWeapon()}>{actionState.fireReady ? '사용' : '대기'}</Button>}
        {active&&<div className="field-tools">
          <Button variant={followSelf?'neutralSolid':'neutralWeak'} aria-pressed={followSelf} onClick={()=>setFollowSelf(v=>!v)}>내 캐릭터 따라가기</Button><Button onClick={()=>{setZoom(1);setFollowSelf(false);}}>전체 보기</Button>
          {pip.pipWindow?<Button onClick={pip.close}>원래 화면으로</Button>:<><Button variant={fieldOnly?'neutralSolid':'neutralWeak'} aria-pressed={fieldOnly} onClick={()=>{setFieldOnly(v=>!v);closePanel();}}>{fieldOnly?'기본 화면':'필드 보기'}</Button><Button disabled={!pip.supported||pip.busy} title={pip.supported?'다른 창 위에 띄우기':'이 브라우저에서는 필드 보기를 이용해 주세요'} onClick={()=>{resetInput();closePlayerInfo();void pip.open().catch(e=>setToast(e.message));}}>작은 창 · PIP</Button>{fieldOnly&&<Button aria-expanded={compactPanel} onClick={()=>compactPanel?closePanel():showPanel(panelTab)}>참가자·상태·채팅</Button>}</>}
        </div>}
        {active&&pip.pipWindow&&<details className="pip-people"><summary>함께 있는 사람 {solo?1:people.length}명</summary>{(solo?[soloPlayer.current]:people).map(p=><Button key={p.id} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();openPlayerInfo(p.id,r.left,r.top);}}>{p.name} · {mapName(mapsById[p.id])}{p.id===room?.host?' · 방장':''}</Button>)}</details>}
        {active&&unreadCalls.length>0&&<div className="call-notice" role="status"><strong>{unreadCalls.at(-1)?.name}님이 불렀어요 · {unreadCalls.length}건</strong><Button onClick={()=>{setUnreadCalls([]);if(pip.pipWindow)pip.close();showPanel('chat',true);}}>확인 · 채팅에서 기록 보기</Button></div>}
        {pip.pipWindow&&<CampNotice message={toast}/>}
      </section>);

  return <main className={'camp-app' + (active && fieldOnly ? ' field-only' : '') + (compactPanel ? ' compact-panel-open' : '') + (active ? ' in-camp' : '') + (active ? ' has-player' : '')} onPointerDownCapture={resumeEffectsSound} onKeyDownCapture={resumeEffectsSound}>
    <header className="topbar">
      <Link className="brand" href="/" aria-label="허들러즈 불멍 홈"><span className="brand-mark"><SpriteArt name="amber"/></span><span>huddlers <strong>fire</strong></span></Link>
      <div className="top-note"><Badge tone="neutral" variant="weak">{active?mapName(mapId):'함께하는 작은 시간'}</Badge></div>
      <div className="header-actions"><Button className="help-button" onClick={() => setHelp(true)}><span>이용 안내</span><span className="question-mark">?</span></Button><Button className="settings-button" aria-label="설정 열기" onClick={() => { resetInput(); setEmotes(false); setSettingsOpen(true); }}><Settings size={18} /><span>설정</span></Button></div>
    </header>

    <div className="camp-layout">
      {pip.pipWindow?createPortal(world,pip.pipWindow.document.body):world}

      <aside className={active?"sidebar":"lobby"}>
        {!active ? <>
          <CampLobby profile={profile} setProfile={setProfile} code={code} setCode={setCode} busy={busy} ready={ready} error={error} enter={enter} enterSolo={enterSolo} onDiscord={()=>void linkDiscord()} discordAvailable={discordAvailable} discordBusy={discordBusy} discordMessage={discordMessage} />
        </> : <CampPanel open={compactPanel} floating={compactScreen||fieldOnly}
          title={solo ? '혼자여도 좋은 밤' : room?.title || '우리의 모닥불'}
          status={solo ? '느긋하게 한 바퀴 걸어 보세요.' : status}
          tab={panelTab} onTab={showPanel} onClose={closePanel} peopleCount={solo ? 1 : people.length}
          invite={room && <>
            <Button variant="neutralSolid" size="large" className="primary-button" onClick={()=>copy(true)}><Link2 size={15}/> 초대 링크 복사</Button>
            <span className="field-label">참가 코드</span>
            <Button className="room-code" onClick={() => copy()} aria-label={`참가 코드 ${room.code} 복사`}><strong>{room.code}</strong>{copied ? <Check size={17} /> : <Copy size={17} />}</Button>
          </>}
          presence={<PresenceEditor value={myPresence} workTime={workTime} expanded={panelTab==='status'} onFocus={resetInput} save={async value=>{await sendCommand('presence',value);resetInput();}}/>}
          people={<PeoplePanel people={solo?[{...profile,id:'solo',name:profile.name||'허들러'}]:people} self={solo?'solo':room?.player} host={room?.host} maps={mapsById} presence={presenceById} hidden={hiddenIds} open={openPlayerInfo}/>}
          radio={<MusicPanel inline open={false} onOpenChange={()=>{}} onCloseFocus={()=>canvas.current?.focus()} music={music} isHost={solo||isHost} command={sendCommand} muted={settings.musicMuted} onMuted={musicMuted=>setSettings(s=>({...s,musicMuted}))} sound={{effectsVolume:volume,musicVolume:settings.musicVolume,onEffectsVolume:v=>void changeVolume(v),onMusicVolume:musicVolume=>setSettings(s=>({...s,musicVolume}))}}/>}
          play={<>
            <Button className={'sit-button ' + (sitting ? 'is-sitting' : '')} onClick={toggleSit}><span>{sitting ? '다시 천천히 걷기' : mapId===CAMP_MAP ? '여기에 앉아 불멍하기' : '여기에 앉아 쉬기'}</span></Button>
            {mapId===CAMP_MAP&&<><FireProgress {...fireProgress} change={style=>runAction('fire-style',{style})}/><p className="micro-copy">함께 장작을 넣어 불을 키워요. 1회 +1 XP · 인당 10분에 한 번</p></>}
            {seatId&&<Button variant="neutralSolid" size="large" className="primary-button" disabled={!stokeReady||fireFuel>=239} onClick={()=>void runAction('add-firewood')}>{!stokeReady?`다음 장작 ${stokeWaitLabel(stokeWait)}`:fireFuel>=239?'불이 충분히 타고 있어요':'장작 넣기'}</Button>}
            <ActionBar {...actionState} playing={playing} runMode={runMode} onRun={toggleRun} onJump={jumpOrEscape} emotesOpen={emotesOpen} onCrouch={setCrouch} onEmotes={setEmotes} onEmote={chooseEmote} onLift={lift} />
            <WeaponBar playing={playing} weapon={actionState.weapon} ready={actionState.fireReady} canFire={actionState.canFire} equip={equipWeapon} fire={() => fireWeapon()} />
          </>}
          chat={<ChatPanel entries={chat} send={text => sendCommand('chat', { text })} onFocus={resetInput} onClose={closePanel} visible={panelVisible&&panelTab==='chat'} focusRequest={chatFocusRequest}/>}
          footer={<>
            {room && !isHost && <Button className="solo-button" onClick={() => network.current?.retry()}><RotateCw size={13} /> 다시 연결</Button>}
            <Button className="leave-button" onClick={() => room && isHost ? setLeaveConfirm(true) : leave()}><LogOut size={15} />{solo ? '함께하기로 돌아가기' : '모닥불 떠나기'}</Button>
          </>}
        />}
      </aside>
    </div>
    {active&&!pip.pipWindow&&<nav className="camp-panel-dock" aria-label="캠프 빠른 메뉴">
      {CAMP_PANELS.map(([id,label])=><Button key={id} aria-expanded={compactPanel&&panelTab===id} aria-controls={`camp-page-${id}`} onClick={()=>compactPanel&&panelTab===id?closePanel():showPanel(id,id==='chat')}>{label}{id==='chat'&&unreadCalls.length>0&&<span aria-label="미확인 호출"> · {unreadCalls.length}</span>}</Button>)}
    </nav>}
    <CampNotice message={toast}/>
    <PlayerInfoPanel canHide={!!seatId} hidden={!!selectedInfo&&hiddenIds.includes(selectedInfo.id)} onHidden={toggleHidden} container={pip.pipWindow?.document.body} onCall={id=>void runAction('call',{target:id})} player={selectedInfo} anchor={infoAnchor} onClose={closePlayerInfo} onCloseFocus={() => canvas.current?.focus()} />
    {active&&<GameInfoPanel gameId={gameId} onClose={()=>setGameId(null)} onCloseFocus={()=>canvas.current?.focus()}/>}
    <SettingsPanel theme={settings.theme} onTheme={theme => setSettings(s => ({ ...s, theme }))} inRoom={active} open={settingsOpen} onOpenChange={setSettingsOpen} onCloseFocus={() => canvas.current?.focus()}
      effectsVolume={volume} musicVolume={settings.musicVolume} muted={settings.musicMuted} allowCarry={active ? actionState.allowCarry : settings.allowCarry} carryBusy={carryBusy}
      onEffectsVolume={value => void changeVolume(value)} onMusicVolume={musicVolume => setSettings(s => ({ ...s, musicVolume }))} onMuted={musicMuted => setSettings(s => ({ ...s, musicMuted }))} onAllowCarry={allow => void changeAllowCarry(allow)}
      linked={profile.linked} discordAvailable={discordAvailable} discordBusy={discordBusy} discordMessage={discordMessage} onDiscord={() => void (profile.linked ? unlink() : linkDiscord())} onCancelDiscord={() => { cancelDiscord(); setDiscordMessage(DISCORD_MESSAGES['discord-cancelled']); }} />
    {active && <MusicPanel open={radioOpen} onOpenChange={setRadioOpen} onCloseFocus={() => canvas.current?.focus()} sound={{effectsVolume:volume,musicVolume:settings.musicVolume,onEffectsVolume:v=>void changeVolume(v),onMusicVolume:musicVolume=>setSettings(s=>({...s,musicVolume}))}} music={music} isHost={solo || isHost} command={sendCommand} muted={settings.musicMuted} onMuted={musicMuted => setSettings(s => ({ ...s, musicMuted }))} />}
    {active && <MusicPlayer music={music} isHost={solo || isHost} hostNow={() => network.current?.hostNow() ?? performance.now()} command={sendCommand} muted={settings.musicMuted} volume={settings.musicVolume} onMuted={musicMuted => setSettings(s => ({ ...s, musicMuted }))} modalOpen={modalOpen} suspended={()=>!!network.current?.migrating} />}
    <Dialog.Root open={help||leaveConfirm} onOpenChange={open=>{if(!open){setHelp(false);setLeaveConfirm(false);}}}><Dialog.Portal>
      <Dialog.Overlay className="modal-backdrop"/>
      <Dialog.Content className="modal" onCloseAutoFocus={e=>{e.preventDefault();canvas.current?.focus();}}>
        <Button className="modal-close" aria-label="닫기" autoFocus onClick={() => { setHelp(false); setLeaveConfirm(false); }}><X size={20} /></Button>
        <Flame className="modal-flame" size={30} /><Dialog.Title>{leaveConfirm ? '모닥불을 마칠까요?' : '쉬어 가는 방법'}</Dialog.Title>
        <Dialog.Description className="micro-copy">{leaveConfirm?'방을 떠나기 전에 확인해 주세요.':'함께 쉬고 놀 때 필요한 조작이에요.'}</Dialog.Description>
        {leaveConfirm ? <><p>연결된 친구가 남아 있으면 다음 방장에게 모닥불을 이어줘요. 모두 떠나면 방이 종료됩니다.</p><Button variant="neutralSolid" size="large" className="primary-button" onClick={leave}>모닥불 떠나기</Button><Button className="solo-button" onClick={() => setLeaveConfirm(false)}>조금 더 머물기</Button></> : <>
          <p>공개 목록에서 모닥불을 고르거나 초대 링크로 들어오세요. 새 방은 공개방 또는 목록에 없는 초대방으로 만들 수 있어요. 최대 16명이 함께할 수 있어요.</p>
          <div className="help-row"><kbd>마우스 휠</kbd><span>필드 위에서 위로 확대 · 아래로 축소</span></div>
          {[['W A S D', '화면 기준으로 걷기'], ['Shift', '이동하며 달리기'], ['Space', '점프 · 들린 상태에서 내려오기'], ['E', '가까운 포탈·게임 부스 상호작용 · 앉기 · 일어서기'], ['C', '누르는 동안 웅크리기'], ['Q / 1~6', '감정표현 열기 · 선택'], ['F', '가까운 친구 들기 · 이동한 방향으로 던지기'], ['0 / 1 / 2 / 3', '맨손 · 총 · 눈뭉치 · 폭탄 선택'], ['J / 우클릭', '마우스 방향으로 사용 · 맞으면 통통 밀려나요'], ['모바일 사용', '장난감을 고른 뒤 사용 버튼 · 마지막 이동 방향'], ['R', '어디서든 라디오 열기'], ['클릭 / 터치', '캐릭터 또는 참가자 목록에서 정보 보기'], ['Enter / Esc', '채팅 입력 · 캠프장으로 돌아가기']].map(([key, label]) => <div className="help-row" key={key}><kbd>{key}</kbd><span>{label}</span></div>)}
          <p>불멍에서 △ 포탈에 다가가 E를 누르면 놀이터로, □ 포탈에서는 게임 전시장으로 이동해요. 돌아올 때는 ○ 포탈을 이용하세요. 전시장 부스 가까이에서 E를 누르면 게임 소개와 링크를 볼 수 있어요.</p>
          <p>총·눈뭉치·폭탄과 친구 들기·던지기는 놀이터에서 즐길 수 있어요. 축구공은 걸으면 굴러가고 달려가면 더 세게 찰 수 있어요. 트램펄린을 밟으면 통통 튀고, 떨어져도 현재 장소로 돌아옵니다.</p>
          <p>라디오는 첫 신청곡부터 자동으로 시작하고 다음 곡도 순서대로 이어져요. 어디서든 R키나 라디오 탭에서 신청하고, 플레이어나 설정에서 나만 음소거할 수 있어요. 방장은 전체 일시정지·재개·다음 곡을 관리하며 일시정지 중에는 신청해도 그대로 기다립니다.</p>
          <p>친구를 들고 있는 사람도 들 수 있어요. 날아가거나 트램펄린을 타는 친구도 손이 닿으면 F로 잡을 수 있어요. Space로 자신과 위쪽 친구들을 함께 분리해요.</p>
          <p className="micro-copy">방장이 나가면 입장 순서대로 다음 친구가 이어받아요. 갑자기 연결이 끊기면 잠시 기다린 뒤 자동으로 다시 연결합니다.</p>
          <Button variant="neutralSolid" size="large" className="primary-button" onClick={() => setHelp(false)}>알겠어요, 쉬러 갈게요</Button>
        </>}
      </Dialog.Content>
    </Dialog.Portal></Dialog.Root>
  </main>;
}
