'use client';
import { Button } from '@astryxdesign/core/Button';
import { CampTextInput } from './camp-text-input';
import { Switch } from '@astryxdesign/core/Switch';
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
    <div className="presence-quick" aria-label="내 상태 선택">{Object.entries(PRESENCE_LABELS).map(([key,label])=><Button key={key} variant={value.presence===key?'primary':'secondary'} isDisabled={busy} aria-pressed={value.presence===key} onFocus={onFocus} onClick={()=>void commit({...value,presence:key},true)} label={label}/>)}</div>
    <div hidden={!expanded}>
    <form onFocus={onFocus} onSubmit={e=>{e.preventDefault();void commit(editing);}}>
      <p className="micro-copy">위 상태 버튼은 바로 반영돼요. 아래 메모는 저장하면 친구들에게 보여요.</p>
      <CampTextInput label="상태 한마디" maxLength={40} value={editing.statusText} isDisabled={busy} placeholder="오후에는 대화 가능해요" onChange={statusText=>setDraft({statusText,workText:editing.workText,allowCall:editing.allowCall})}/>
      <CampTextInput label="지금 하는 작업" maxLength={80} value={editing.workText} isDisabled={busy} placeholder="보스 패턴 구현 중" onChange={workText=>setDraft({statusText:editing.statusText,workText,allowCall:editing.allowCall})}/>
      <Switch label="친구의 호출 받기" value={editing.allowCall} isDisabled={busy} onChange={allowCall=>setDraft({statusText:editing.statusText,workText:editing.workText,allowCall})}/>
      <p className="micro-copy">한마디는 머리 위에 짧게, 작업 내용은 사람 탭과 플레이어 정보에 보여요. 상태는 놀이를 제한하지 않아요.</p>
      <span className="presence-draft-state" role="status">{dirty?'저장하지 않은 변경이 있어요.':'메모가 저장되어 있어요.'}</span>
      <Button type="submit" isDisabled={busy||!dirty} label={busy?'저장 중…':'메모 저장하기'}/>
    </form>
    </div><p className="presence-feedback" role="status">{message}</p>
  </section>;
}
