'use client';
import { List, ListItem } from '@astryxdesign/core/List';
import CharacterPreview from './character-preview';
import { Badge } from '@astryxdesign/core/Badge';
import { Text } from '@astryxdesign/core/Text';
import { mapName } from '@/lib/camp-maps.mjs';
import { presenceSummary } from '@/lib/camp-presence.mjs';
import type {Presence} from '@/lib/camp-types';
type Person={id:string;name:string;color:string;hairStyle?:number;topStyle?:number};
export default function PeoplePanel({people,self,host,maps,presence,hidden,open}:{people:Person[];self?:string;host?:string;maps:Record<string,string>;presence:Record<string,Presence>;hidden:string[];open:(id:string,x:number,y:number)=>void}){
  return <section className="people-list" aria-label="함께 있는 사람들"><Text as="h3" weight="bold">함께 있는 사람들 · {people.length}</Text><List>{people.map(p=><ListItem key={p.id} className="person-row person-info-button" aria-label={`${p.name} 플레이어 정보`} label={<>{p.name}{p.id===self&&' · 나'}</>} description={<span className="person-presence"><span>{mapName(maps[p.id])} · {presenceSummary(presence[p.id])}{hidden.includes(p.id)&&' · 내 필드에서 숨김'}</span>{presence[p.id]?.workText&&<span className="person-work">지금 하는 작업 · {presence[p.id].workText}</span>}</span>} startContent={<CharacterPreview color={p.color} hairStyle={p.hairStyle} topStyle={p.topStyle} portraitSize={42}/>} endContent={p.id===host?<Badge label="방장"/>:undefined} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();open(p.id,r.left,r.top);}}/>)}</List><Text as="p" size="sm" color="secondary">친구를 선택하면 메모 전체를 읽고 부를 수 있어요.</Text></section>;
}
