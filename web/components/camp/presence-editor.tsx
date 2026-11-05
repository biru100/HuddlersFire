'use client';
import { ActionButton as Button } from '@/seed-design/ui/action-button';
import { Input, Toggle } from '@/components/camp/form-controls';
import ChoiceField from './choice-field';
import { useState } from 'react';
import type { Presence } from '@/lib/camp-types';
import { PRESENCE_LABELS } from '@/lib/camp-presence.mjs';
export default function PresenceEditor({value,save,onFocus,workTime,expanded=false}:{value:Presence;save:(value:Presence)=>Promise<unknown>;onFocus:()=>void;workTime:string;expanded?:boolean}) {
  const [draft,setDraft]=useState<Presence|null>(null), [busy,setBusy]=useState(false), [message,setMessage]=useState('');
  const editing = draft ?? value;
  async function commit(next:Presence, quick=false) {
    if (busy) return;
    setBusy(true);setMessage('');
    try {
      await save(next);
      setDraft(previous => quick && previous ? {...previous,presence:next.presence} : null);
      setMessage('상태를 공유했어요.');
    } catch(error) {setMessage(error instanceof Error?error.message:'저장하지 못했어요.');}
    finally {setBusy(false);}
  }
  return <section className="presence-editor" aria-label="내 작업과 상태">
    <div className="presence-time"><strong>내 작업 시간</strong><output>{workTime}</output><small>이번 입장 · 작업 중일 때 누적</small></div>
    <div className="presence-quick" aria-label="내 상태 선택">{Object.entries(PRESENCE_LABELS).map(([key,label])=><Button key={key} variant={value.presence===key?'neutralSolid':'neutralWeak'} disabled={busy} aria-pressed={value.presence===key} onFocus={onFocus} onClick={()=>void commit({...value,presence:key},true)}>{label}</Button>)}</div>
    <div hidden={!expanded}>
    <form onFocus={onFocus} onSubmit={e=>{e.preventDefault();void commit(editing);}}>
      <ChoiceField label="지금 상태" value={editing.presence} disabled={busy} onChange={presence=>setDraft({...editing,presence})} options={Object.entries(PRESENCE_LABELS).map(([value,label])=>({value,label}))}/>
      <label>상태 한마디<Input aria-label="상태 한마디" maxLength={40} value={editing.statusText} disabled={busy} placeholder="오후에는 대화 가능해요" onChange={e=>setDraft({...editing,statusText:e.target.value})}/></label>
      <label>지금 하는 작업<Input aria-label="지금 하는 작업" maxLength={80} value={editing.workText} disabled={busy} placeholder="보스 패턴 구현 중" onChange={e=>setDraft({...editing,workText:e.target.value})}/></label>
      <Toggle checked={editing.allowCall} disabled={busy} onChange={allowCall=>setDraft({...editing,allowCall})}>친구의 호출 받기</Toggle>
      <p className="micro-copy">상태는 직접 바꿔요. 작업 중이거나 자리를 비워도 친구들과의 상호작용은 이어져요.</p>
      <Button disabled={busy}>{busy?'저장 중…':'상태 공유하기'}</Button>
    </form>
    </div><p className="presence-feedback" role="status">{message}</p>
  </section>;
}
