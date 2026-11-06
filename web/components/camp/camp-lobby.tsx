'use client';
import { Callout } from '@/seed-design/ui/callout';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Text, VStack, HStack } from '@seed-design/react';
import { ActionButton as Button } from '@/seed-design/ui/action-button';
import { TextField, TextFieldInput } from '@/seed-design/ui/text-field';
import { RadioSelectBoxRoot, RadioSelectBoxItem } from '@/seed-design/ui/select-box';
import { Badge } from '@/seed-design/ui/badge';
import { Dialog } from '@/seed-design/ui/dialog';
import { ArrowUpRight, Plus, KeyRound, Check, ArrowRight } from 'lucide-react';
import { TONE_LABELS, TONE_MARKS, COLOR_LABELS, characterColor } from '@/lib/camp-appearance.mjs';
import { COLORS } from '@/lib/camp-config.mjs';
import { useCampSettings } from './use-camp-settings';
import CharacterPreview from './character-preview';
import RoomList from './room-list';
import SpriteArt from './sprite-art';
export type Profile = { name:string;color:string;avatar:string|null;linked:boolean };
type Props = {onDiscord:()=>void;discordAvailable:boolean;discordBusy:boolean;discordMessage:string;profile:Profile;setProfile:Dispatch<SetStateAction<Profile>>;code:string;setCode:(value:string)=>void;busy:boolean;ready:boolean;error:string;enter:(mode:'create'|'join',code?:string,creation?:{title:string;visibility:string})=>Promise<void>;enterSolo:()=>void};
export default function CampLobby(p:Props) {
  const [{theme}] = useCampSettings();
  const [title,setTitle]=useState('우리의 모닥불'),[visibility,setVisibility]=useState('public');
  const [entry,setEntry]=useState<'create'|'join'|null>(null);
  const blocked=p.busy||!p.ready||!p.profile.linked;
  return <section className="lobby-content">
    <header className="lobby-heading">
      <Badge tone="neutral" variant="weak">잠깐, 같이 쉬어 갈까요?</Badge>
      <Text as="h1" textStyle="t10Bold">각자의 하루,<br/>하나의 모닥불.</Text>
      <Text as="p" textStyle="t5Regular" color="fg.neutralMuted">같이 쉬고, 만들고, 놀아요.<br/>잠깐 들러도 괜찮은 우리들의 작은 공간.</Text>
      <div className="lobby-places" aria-label="캠프에서 할 수 있는 일"><span><SpriteArt name="amber"/>불멍과 대화</span><span><SpriteArt name="football"/>가벼운 놀이</span><span><SpriteArt name="gameBooth"/>게임 구경</span></div>
    </header>
    <div className="lobby-grid">
      <section className="lobby-profile surface" aria-label="입장 준비">
        <div className="section-heading"><Text as="h2" textStyle="t6Bold">오늘의 나</Text><span className="step-number">01</span></div>
        <HStack gap="x4" align="center" className="profile-preview">
          <CharacterPreview color={p.profile.color} avatar={p.profile.avatar}/>
          <VStack gap="x1"><Text textStyle="t5Bold">{p.profile.name||'오늘의 허들러'}</Text><Text textStyle="t3Regular" color="fg.neutralMuted">{p.profile.linked?'Discord 연결됨':'Discord로 함께할 준비를 해요'}</Text></VStack>
        </HStack>
        {!p.profile.linked&&<VStack gap="x3"><Button variant="brandSolid" size="large" loading={p.discordBusy} disabled={!p.discordAvailable||!p.ready} onClick={p.onDiscord}>Discord 연결하기 <ArrowUpRight size={18}/></Button>{p.discordMessage&&<Text as="p" role="status" textStyle="t3Regular">{p.discordMessage}</Text>}</VStack>}
        <TextField label="닉네임" value={p.profile.name} disabled={p.busy}>
          <TextFieldInput id="nickname" aria-label="닉네임" maxLength={16} placeholder="어떤 이름으로 만날까요?" autoComplete="nickname" onChange={e=>p.setProfile(v=>({...v,name:e.target.value}))}/>
        </TextField>
        <VStack gap="x3"><Text textStyle="t4Medium">캐릭터 톤</Text><div className="tone-options" role="group" aria-label="캐릭터 톤">{COLORS.map((color:string,i:number)=><Button key={color} size="small" variant={p.profile.color===color?'neutralSolid':'neutralWeak'} aria-label={(theme==='dark'?TONE_LABELS:COLOR_LABELS)[i]+' · '+TONE_MARKS[i]} aria-pressed={p.profile.color===color} onClick={()=>p.setProfile(v=>({...v,color}))} disabled={p.busy}><span className="tone-swatch" style={{background:characterColor(color,theme)}}/>{p.profile.color===color?<Check size={14}/>:TONE_MARKS[i]}</Button>)}</div></VStack>
        <Button className="solo-button" variant="ghost" disabled={blocked} onClick={p.enterSolo}>먼저 혼자 둘러보기 <ArrowRight size={16}/></Button>
      </section>
      <section className="lobby-rooms surface" aria-label="함께할 공간">
        <div className="section-heading"><div><span className="eyebrow">MEET BY THE FIRE</span><Text as="h2" textStyle="t6Bold">함께할 공간</Text></div><SpriteArt name="tent" className="room-illustration"/></div>
        {p.code.length===6&&<div className="invite-arrival"><Text textStyle="t5Bold">초대받은 모닥불 · {p.code}</Text><Button variant="brandSolid" disabled={blocked} onClick={()=>void p.enter('join',p.code)}>이 방에 참여</Button></div>}
        <RoomList busy={blocked} join={code=>void p.enter('join',code)}/>
        <div className="entry-actions"><Button variant="brandSolid" size="large" disabled={blocked} onClick={()=>setEntry('create')}><Plus size={18}/> 방 만들기</Button><Button size="large" disabled={blocked} onClick={()=>setEntry('join')}><KeyRound size={18}/> 코드로 참여</Button></div>
        <Text as="p" textStyle="t3Regular" color="fg.neutralMuted">최대 16명 · Discord 연결 후 참여할 수 있어요.</Text>
      </section>
    </div>
    {p.busy&&<p role="status">모닥불에 연결하는 중이에요…</p>}
    {p.error&&<Callout tone="neutral" role="alert" description={p.error}/>}
    <Dialog.Root open={entry!==null} onOpenChange={open=>{if(!open)setEntry(null);}}><Dialog.Portal><Dialog.Overlay/>
      <Dialog.Content className="entry-dialog"><Dialog.Close aria-label="입장 창 닫기">×</Dialog.Close>
        <Dialog.Title>{entry==='create'?'새 모닥불 피우기':'초대 코드로 참여'}</Dialog.Title><Dialog.Description>{entry==='create'?'함께할 공간의 이름과 공개 범위를 정해요.':'친구에게 받은 6자리 코드를 입력해요.'}</Dialog.Description>
        <form onSubmit={e=>{e.preventDefault();if(entry==='create')void p.enter('create',undefined,{title:title.trim(),visibility});else void p.enter('join');}}>
          {entry==='create'?<><TextField label="방 이름" value={title} disabled={p.busy}><TextFieldInput aria-label="방 이름" maxLength={40} onChange={e=>setTitle(e.target.value)}/></TextField><RadioSelectBoxRoot label="공개 범위" value={visibility} onValueChange={setVisibility} disabled={p.busy}><RadioSelectBoxItem value="public" label="공개방" description="목록에서 새로운 친구와 만나요"/><RadioSelectBoxItem value="unlisted" label="초대방" description="링크나 코드를 받은 친구와 만나요"/></RadioSelectBoxRoot></>:<TextField label="참가 코드 6자리" value={p.code} disabled={p.busy}><TextFieldInput id="room-code" aria-label="참가 코드 6자리" onChange={e=>p.setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6))} placeholder="ABC234" maxLength={6} autoComplete="off" required pattern="[A-Z2-9]{6}"/></TextField>}
          {p.error&&<Callout tone="neutral" role="alert" description={p.error}/>}
          <Button variant="brandSolid" size="large" type="submit" loading={p.busy} disabled={blocked||(entry==='create'?!title.trim():p.code.length!==6)}>{entry==='create'?'모닥불 시작하기':'참가하기'}</Button>
        </form>
      </Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}
