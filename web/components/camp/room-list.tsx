'use client';
import { useEffect, useState } from 'react';
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
    <div className="panel-title"><strong>열려 있는 모닥불</strong><button type="button" onClick={()=>{setLoading(true);setRefresh(v=>v+1);}} disabled={loading}>새로고침</button></div>
    <p className="micro-copy">방을 골라 바로 함께해요. Discord 계정을 연결하면 참여할 수 있어요.</p>
    {error?<p role="alert">{error}</p>:loading?<p role="status">모닥불을 찾고 있어요…</p>:!rooms.length?<p>아직 열린 방이 없어요. 첫 모닥불을 피워 보세요.</p>:rooms.map(r=><button className="public-room" key={r.code} disabled={busy||r.state!=='open'} onClick={()=>join(r.code)}>
      <strong>{r.title}</strong><span>{r.count}/{r.capacity}명 · {r.state==='open'?'참여하기':r.state==='full'?'가득 참':'연결 복구 중'}</span>
    </button>)}
    {(offset>0||next!==null)&&<div className="room-pages"><button disabled={offset===0||busy} onClick={()=>{setLoading(true);setOffset(Math.max(0,offset-20));}}>이전</button><button disabled={next===null||busy} onClick={()=>{if(next!==null){setLoading(true);setOffset(next);}}}>다음</button></div>}
  </section>;
}
