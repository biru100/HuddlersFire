'use client';
import { ActionButton as Button } from '@/seed-design/ui/action-button';
import { Input, Toggle } from '@/components/camp/form-controls';
import { useState } from 'react';
import type { Presence } from '@/lib/camp-types';
import { PRESENCE_LABELS } from '@/lib/camp-presence.mjs';
export default function PresenceEditor({value,save,onFocus,workTime,expanded=false}:{value:Presence;save:(value:Presence)=>Promise<unknown>;onFocus:()=>void;workTime:string;expanded?:boolean}) {
  const [draft,setDraft]=useState<Pick<Presence,'statusText'|'workText'|'allowCall'>|null>(null), [busy,setBusy]=useState(false), [message,setMessage]=useState('');
  const editing = {...value,...draft};
  const dirty=!!draft&&(draft.statusText!==value.statusText||draft.workText!==value.workText||draft.allowCall!==value.allowCall);
  async function commit(next:Presence, quick=false) {
    if (busy) return;
    setBusy(true);setMessage('');
    try {
      await save(next);
      if(!quick)setDraft(null);
      setMessage(quick?'상태를 바로 반영했어요.':'메모를 저장했어요.');
      // The host accepts presence updates at 500 ms intervals. Keep both entry
      // points busy through that interval so a quick choice followed by Save
      // cannot reject the user's memo while leaving it looking submitted.
      await new Promise(resolve=>setTimeout(resolve,500));
    } catch(error) {setMessage(error instanceof Error?error.message:'저장하지 못했어요.');}
    finally {setBusy(false);}
  }
  return <section className="presence-editor" aria-label="내 작업과 상태">
    <div className="presence-time"><strong>내 작업 시간</strong><output>{workTime}</output><small>이번 입장 · 작업 중일 때 누적</small></div>
    <div className="presence-quick" aria-label="내 상태 선택">{Object.entries(PRESENCE_LABELS).map(([key,label])=><Button key={key} variant={value.presence===key?'neutralSolid':'neutralWeak'} disabled={busy} aria-pressed={value.presence===key} onFocus={onFocus} onClick={()=>void commit({...value,presence:key},true)}>{label}</Button>)}</div>
    <div hidden={!expanded}>
    <form onFocus={onFocus} onSubmit={e=>{e.preventDefault();void commit(editing);}}>
      <p className="micro-copy">위 상태 버튼은 바로 반영돼요. 아래 메모는 저장하면 친구들에게 보여요.</p>
      <label>상태 한마디<Input aria-label="상태 한마디" maxLength={40} value={editing.statusText} disabled={busy} placeholder="오후에는 대화 가능해요" onChange={e=>setDraft({statusText:e.target.value,workText:editing.workText,allowCall:editing.allowCall})}/></label>
      <label>지금 하는 작업<Input aria-label="지금 하는 작업" maxLength={80} value={editing.workText} disabled={busy} placeholder="보스 패턴 구현 중" onChange={e=>setDraft({statusText:editing.statusText,workText:e.target.value,allowCall:editing.allowCall})}/></label>
      <Toggle checked={editing.allowCall} disabled={busy} onChange={allowCall=>setDraft({statusText:editing.statusText,workText:editing.workText,allowCall})}>친구의 호출 받기</Toggle>
      <p className="micro-copy">한마디는 머리 위에 짧게, 작업 내용은 사람 탭과 플레이어 정보에 보여요. 상태는 놀이를 제한하지 않아요.</p>
      <span className="presence-draft-state" role="status">{dirty?'저장하지 않은 변경이 있어요.':'메모가 저장되어 있어요.'}</span>
      <Button type="submit" disabled={busy||!dirty}>{busy?'저장 중…':'메모 저장하기'}</Button>
    </form>
    </div><p className="presence-feedback" role="status">{message}</p>
  </section>;
}
