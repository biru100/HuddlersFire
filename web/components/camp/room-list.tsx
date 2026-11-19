'use client';
import { Button } from '@astryxdesign/core/Button';
import { useEffect, useState } from 'react';
import { Text } from '@astryxdesign/core/Text';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { List, ListItem } from '@astryxdesign/core/List';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Badge } from '@astryxdesign/core/Badge';
import { RotateCw } from 'lucide-react';
import SpriteArt from './sprite-art';
import { api } from '@/lib/camp-network.mjs';
type PublicRoom = { code:string; title:string; count:number; capacity:number; state:'open'|'full'|'recovering' };
export default function RoomList({busy,join}:{busy:boolean;join:(code:string)=>void}) {
  const [rooms,setRooms]=useState<PublicRoom[]>([]), [error,setError]=useState('');
  const [offset,setOffset]=useState(0), [next,setNext]=useState<number|null>(null), [refresh,setRefresh]=useState(0), [loading,setLoading]=useState(true);
  useEffect(()=>{
    let cancelled=false, pending=false;
    const load=async()=>{
      if(pending)return; pending=true;
      try { const data=await api('rooms?offset='+offset); if(!cancelled){setRooms(data.rooms);setNext(data.next);setError('');} }
      catch(e){if(!cancelled)setError(e instanceof Error?e.message:'방 목록을 불러오지 못했어요.');}
      finally{pending=false;if(!cancelled)setLoading(false);}
    };
    void load(); const timer=setInterval(()=>{if(!document.hidden)void load();},10000);
    return()=>{cancelled=true;clearInterval(timer);};
  },[offset,refresh]);
  return <section className="public-rooms" aria-label="공개 모닥불">
    <div className="section-heading"><Text as="h2" type="display-3">열려 있는 모닥불</Text><Button type="button" size="sm" variant="ghost" icon={<RotateCw size={14}/>} onClick={()=>{setLoading(true);setRefresh(v=>v+1);}} isDisabled={loading} label="새로고침"/></div>
    {error?<Text as="p" role="alert">{error}</Text>:loading?<div role="status" aria-label="모닥불을 찾고 있어요"><Skeleton height={64}/></div>:!rooms.length?<EmptyState className="room-list-empty" icon={<SpriteArt name="tent"/>} title="아직 열린 방이 없어요" description="방을 만들면 최대 16명이 함께 모일 수 있어요."/>:<List>{rooms.map(r=><ListItem className="public-room" key={r.code} label={r.title} description={`${r.count}/${r.capacity}명 · ${r.state==='open'?'함께 쉬는 중':r.state==='full'?'가득 참':'연결 복구 중'}`} endContent={<Badge label="참여"/>} isDisabled={busy||r.state!=='open'} onClick={()=>join(r.code)}/>)}</List>}
    {(offset>0||next!==null)&&<div className="room-pages"><Button isDisabled={offset===0||busy} onClick={()=>{setLoading(true);setOffset(Math.max(0,offset-20));}} label="이전"/><Button isDisabled={next===null||busy} onClick={()=>{if(next!==null){setLoading(true);setOffset(next);}}} label="다음"/></div>}
  </section>;
}
