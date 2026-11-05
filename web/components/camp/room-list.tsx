'use client';
import { ActionButton as Button } from '@/seed-design/ui/action-button';
import { useEffect, useState } from 'react';
import { Text, Skeleton } from '@seed-design/react';
import { List, ListButtonItem } from '@/seed-design/ui/list';
import { ResultSection } from '@/seed-design/ui/result-section';
import { Badge } from '@/seed-design/ui/badge';
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
    <div className="panel-title"><strong>열려 있는 모닥불</strong><Button type="button" onClick={()=>{setLoading(true);setRefresh(v=>v+1);}} disabled={loading}>새로고침</Button></div>
    <p className="micro-copy">방을 골라 바로 함께해요. Discord 계정을 연결하면 참여할 수 있어요.</p>
    {error?<Text as="p" role="alert">{error}</Text>:loading?<div role="status" aria-label="모닥불을 찾고 있어요"><Skeleton height="x16" radius="8"/></div>:!rooms.length?<ResultSection size="medium" title="첫 모닥불을 피워 볼까요?" description="아직 열린 방이 없어요. 친구들을 초대해 보세요."/>:<List>{rooms.map(r=><ListButtonItem className="public-room" key={r.code} title={r.title} detail={`${r.count}/${r.capacity}명 · ${r.state==='open'?'함께 쉬는 중':r.state==='full'?'가득 참':'연결 복구 중'}`} suffix={<Badge tone="neutral" variant="weak">참여</Badge>} disabled={busy||r.state!=='open'} onClick={()=>join(r.code)}/>)}</List>}
    {(offset>0||next!==null)&&<div className="room-pages"><Button disabled={offset===0||busy} onClick={()=>{setLoading(true);setOffset(Math.max(0,offset-20));}}>이전</Button><Button disabled={next===null||busy} onClick={()=>{if(next!==null){setLoading(true);setOffset(next);}}}>다음</Button></div>}
  </section>;
}
