'use client';
import { List, ListButtonItem } from '@/seed-design/ui/list';
import { Avatar } from '@/seed-design/ui/avatar';
import { Badge } from '@/seed-design/ui/badge';
import { Text } from '@seed-design/react';
import { mapName } from '@/lib/camp-maps.mjs';
import { PRESENCE_LABELS } from '@/lib/camp-presence.mjs';
type Person={id:string;name:string;avatar?:string|null};
export default function PeoplePanel({people,self,host,maps,presence,hidden,open}:{people:Person[];self?:string;host?:string;maps:Record<string,string>;presence:Record<string,string>;hidden:string[];open:(id:string,x:number,y:number)=>void}){
  return <section className="people-list" aria-label="함께 있는 사람들"><Text as="h3" textStyle="t5Bold">함께 있는 사람들 · {people.length}</Text><List>{people.map(p=><ListButtonItem key={p.id} className="person-row person-info-button" aria-label={`${p.name} 플레이어 정보`} title={<>{p.name}{p.id===self&&' · 나'}</>} detail={`${mapName(maps[p.id])} · ${PRESENCE_LABELS[presence[p.id] as keyof typeof PRESENCE_LABELS]||'대화'}${hidden.includes(p.id)?' · 내 필드에서 숨김':''}`} prefix={<Avatar size="42" src={p.avatar||undefined} alt="" fallback={p.name.slice(0,1)}/>} suffix={p.id===host?<Badge tone="neutral" variant="weak">방장</Badge>:undefined} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();open(p.id,r.left,r.top);}}/>)}</List><Text as="p" textStyle="t3Regular" color="fg.neutralMuted">친구를 선택하면 작업 메모를 읽고 부를 수 있어요.</Text></section>;
}
