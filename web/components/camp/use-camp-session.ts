'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { CampNetwork, api } from '@/lib/camp-network.mjs';
import type { ChatEntry } from './chat-panel';
import type { MusicState } from './music-panel';
import type { Member } from '@/lib/camp-types';
import {watchUpdates,reloadForUpdate} from '@/lib/camp-updates.mjs';

export type Room = { code: string; title: string; visibility: string; player: string; host: string; epoch: number; turnConfigured: boolean };
type Options = { networkRef: RefObject<CampNetwork | null>; onChat:(chat:ChatEntry[])=>void; onCall:(entry:ChatEntry)=>void; onMusic:(music:MusicState)=>void; onHost:()=>void; onEnded:(message:string)=>void; onUpdate:()=>void; onUpdateFailed:()=>void };
export function useCampSession(options: Options) {
  const latest = useRef(options);
  const generation = useRef(0);
  const [room,setRoom] = useState<Room|null>(null), [people,setPeople] = useState<Member[]>([]), [status,setStatus] = useState('');
  useEffect(()=>{latest.current=options;},[options]);
  const {networkRef} = options;
  useEffect(()=>()=>{generation.current++;networkRef.current?.destroy();networkRef.current=null;},[networkRef]);
  useEffect(()=>watchUpdates({request:api,onUpdate:(release:string)=>{
    generation.current++;networkRef.current?.destroy(false);networkRef.current=null;
    setRoom(null);setPeople([]);setStatus('');latest.current.onUpdate();
    if(!reloadForUpdate(release))latest.current.onUpdateFailed();
  }}),[networkRef]);
  async function connectRoom(mode:'create'|'join', profile:{name:string;color:string;avatar:string|null}, code:string, allowCarry:boolean, creation?:{title:string;visibility:string}) {
    const token = ++generation.current;
    const info = await api('rooms',{op:mode,...(mode==='join'?{code:code.trim().toUpperCase()}:creation)});
    if(token!==generation.current){await api('room',{op:'leave',code:info.code,player:info.player}).catch(()=>{});throw new Error('입장이 취소됐어요. 다시 시도해 주세요.');}
    setRoom(info);setPeople([]);setStatus(info.player===info.host?'모닥불을 피웠어요':'친구들과 연결하는 중');
    networkRef.current = new CampNetwork(info,profile,{
      // A departing connection can still finish async work after the next entry.
      status:(status:string)=>{if(token===generation.current)setStatus(status);},
      members:(members:Member[])=>{if(token===generation.current)setPeople(members);},
      host:({host,epoch}:{host:string;epoch:number})=>{if(token!==generation.current)return;setRoom(previous=>previous?{...previous,host,epoch}:previous);latest.current.onHost();},
      chat:(chat:ChatEntry[])=>{if(token===generation.current)latest.current.onChat([...chat]);},
      music:(music:MusicState)=>{if(token===generation.current)latest.current.onMusic(structuredClone(music));},
      call:(entry:ChatEntry)=>{if(token===generation.current)latest.current.onCall(entry);},
      ended:(message:string)=>{
        if(token!==generation.current)return;
        generation.current++; // Accept termination only once, before notifying the UI.
        networkRef.current=null;setRoom(null);setPeople([]);setStatus('');latest.current.onEnded(message);
      },
    },{allowCarry});
    return info as Room;
  }
  function disconnectRoom() {generation.current++;networkRef.current?.destroy();networkRef.current=null;setRoom(null);setPeople([]);setStatus('');}
  return {room,people,status,setStatus,connectRoom,disconnectRoom};
}
