'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Button } from '@astryxdesign/core/Button';
import { CampTextInput } from './camp-text-input';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { CampDialog } from '@/components/camp/camp-dialog';
import { ArrowUpRight, Plus, KeyRound, Check, ArrowRight, ChevronDown } from 'lucide-react';
import { TONE_LABELS, TONE_MARKS, COLOR_LABELS, characterColor } from '@/lib/camp-appearance.mjs';
import { COLORS } from '@/lib/camp-config.mjs';
import { useCampSettings } from './use-camp-settings';
import CharacterPreview from './character-preview';
import RoomList from './room-list';
export type Profile = { name:string;color:string;avatar:string|null;linked:boolean };
const wardrobeOptions = [
  {key:'hairStyle', label:'헤어', choices:['밤색 단발','묶은 머리']},
  {key:'topStyle', label:'상의', choices:['필드 재킷','캠프 후디']},
] as const;
type Props = {onDiscord:()=>void;discordAvailable:boolean;discordBusy:boolean;discordMessage:string;profile:Profile;setProfile:Dispatch<SetStateAction<Profile>>;code:string;setCode:(value:string)=>void;busy:boolean;ready:boolean;error:string;enter:(mode:'create'|'join',code?:string,creation?:{title:string;visibility:string})=>Promise<void>;enterSolo:()=>void};
export default function CampLobby(p:Props) {
  const [settings,setSettings] = useCampSettings();
  const {theme,hairStyle,topStyle} = settings;
  const [title,setTitle]=useState('우리의 모닥불'),[visibility,setVisibility]=useState('public');
  const [entry,setEntry]=useState<'create'|'join'|null>(null);
  const blocked=p.busy||!p.ready||!p.profile.linked;
  return <section className="lobby-content">
    <header className="lobby-heading">
      <div className="lobby-intro">
        <Text as="h1" type="display-1">각자의 하루,<br/><span>하나의 모닥불.</span></Text>
        <Text as="p" className="lobby-lede">게임을 만드는 사람들이 쉬어 가는 캠프.</Text>
        <div className="entry-actions">
          {p.profile.linked ? <>
            {p.code.length===6
              ? <Button variant="primary" size="lg" isDisabled={blocked} onClick={()=>void p.enter('join',p.code)} label="이 방에 참여"/>
              : <Button variant="primary" size="lg" isDisabled={blocked} onClick={()=>setEntry('create')} icon={<Plus size={17}/>} label="방 만들기"/>}
            <Button size="lg" isDisabled={blocked} onClick={()=>setEntry('join')} icon={<KeyRound size={16}/>} label="코드로 참여"/>
          </> : <Button variant="primary" size="lg" isLoading={p.discordBusy} isDisabled={!p.discordAvailable||!p.ready} onClick={p.onDiscord} label="Discord 연결하기" endContent={<ArrowUpRight size={17}/>}/>}
        </div>
        {p.profile.linked
          ? <Button className="solo-button" variant="ghost" isDisabled={blocked} onClick={p.enterSolo} label="먼저 혼자 둘러보기" endContent={<ArrowRight size={15}/>}/>
          : <Text as="p" className="entry-note" role="status">{p.discordMessage||(p.code.length===6?'초대받은 방에 참여하려면 Discord를 연결하세요.':'Discord를 연결하면 캠프에 입장할 수 있어요.')}</Text>}
      </div>
    </header>
    <div className="lobby-grid">
      <section className="lobby-rooms" aria-label="함께할 공간">
        <RoomList busy={blocked} join={code=>void p.enter('join',code)}/>
        {p.profile.linked&&p.code.length===6&&<div className="invite-arrival">
          <Text type="label">초대 코드 · {p.code}</Text>
          <Button isDisabled={blocked} onClick={()=>setEntry('create')} label="방 만들기"/>
        </div>}
      </section>
      <section className="lobby-profile" aria-label="입장 준비">
        <div className="section-heading"><Text as="h2" type="display-3">내 캠퍼</Text></div>
        <HStack gap={4} align="center" className="profile-preview">
          <CharacterPreview color={p.profile.color} hairStyle={hairStyle} topStyle={topStyle}/>
          <VStack gap={1}><Text weight="bold">{p.profile.name||'오늘의 허들러'}</Text><Text size="sm" color="secondary">{p.profile.linked?'Discord 연결됨':'Discord 연결 전'}</Text></VStack>
        </HStack>
        <CampTextInput label="닉네임" value={p.profile.name} isDisabled={p.busy} id="nickname" aria-label="닉네임" maxLength={16} placeholder="어떤 이름으로 만날까요?" autoComplete="nickname" onChange={name=>p.setProfile(v=>({...v,name}))}/>
        <details className="lobby-wardrobe">
          <summary>캐릭터 꾸미기 <ChevronDown size={16} aria-hidden="true"/></summary>
          <div className="wardrobe-fields">
            {wardrobeOptions.map(({key,label,choices}) => <VStack gap={2} key={key}>
              <Text>{label}</Text>
              <div className="tone-options" role="group" aria-label={label}>
                {choices.map((name,i) => <Button key={name} size="sm" variant={settings[key]===i?'primary':'secondary'} aria-pressed={settings[key]===i} isDisabled={p.busy} onClick={()=>setSettings(current=>({...current,[key]:i}))} label={name}/>)}
              </div>
            </VStack>)}
            <VStack gap={3}><Text>캐릭터 톤</Text><div className="tone-options" role="group" aria-label="캐릭터 톤">{COLORS.map((color:string,i:number)=><Button key={color} size="sm" variant={p.profile.color===color?'primary':'secondary'} aria-pressed={p.profile.color===color} onClick={()=>p.setProfile(v=>({...v,color}))} isDisabled={p.busy} label={(theme==='dark'?TONE_LABELS:COLOR_LABELS)[i]+' · '+TONE_MARKS[i]}><span className="tone-swatch" style={{background:characterColor(color,theme)}}/>{p.profile.color===color?<Check size={14}/>:TONE_MARKS[i]}</Button>)}</div></VStack>
          </div>
        </details>
      </section>
    </div>
    {p.busy&&<p role="status">모닥불에 연결하는 중이에요…</p>}
    {p.error&&<Banner status="error" role="alert" title={p.error}/>}
    <CampDialog open={entry!==null} onOpenChange={open=>{if(!open)setEntry(null);}} label="입장 방법" className="entry-dialog"><Button onClick={()=>setEntry(null)} label="입장 창 닫기">×</Button>
        <h2>{entry==='create'?'새 모닥불 피우기':'초대 코드로 참여'}</h2><p>{entry==='create'?'함께할 공간의 이름과 공개 범위를 정해요.':'친구에게 받은 6자리 코드를 입력해요.'}</p>
        <form onSubmit={e=>{e.preventDefault();if(entry==='create')void p.enter('create',undefined,{title:title.trim(),visibility});else void p.enter('join');}}>
          {entry==='create'?<><CampTextInput label="방 이름" value={title} isDisabled={p.busy} aria-label="방 이름" maxLength={40} onChange={setTitle}/><RadioList label="공개 범위" value={visibility} onChange={setVisibility} isDisabled={p.busy}><RadioListItem value="public" label="공개방" description="목록에서 새로운 친구와 만나요"/><RadioListItem value="unlisted" label="초대방" description="링크나 코드를 받은 친구와 만나요"/></RadioList></>:<CampTextInput label="참가 코드 6자리" value={p.code} isDisabled={p.busy} id="room-code" aria-label="참가 코드 6자리" onChange={value=>p.setCode(value.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6))} placeholder="ABC234" maxLength={6} autoComplete="off" isRequired pattern="[A-Z2-9]{6}"/>}
          {p.error&&<Banner status="error" role="alert" title={p.error}/>}
          <Button variant="primary" size="lg" type="submit" isLoading={p.busy} isDisabled={blocked||(entry==='create'?!title.trim():p.code.length!==6)} label={entry==='create'?'모닥불 시작하기':'참가하기'}/>
        </form>
      </CampDialog>
  </section>;
}
