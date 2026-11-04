'use client';
import { useLayoutEffect, useRef, useState } from 'react';
export type { ChatEntry } from '@/lib/camp-types';
import type { ChatEntry } from '@/lib/camp-types';
export default function ChatPanel({ entries, send, onFocus, onClose, visible=true, focusRequest=0 }: { entries: ChatEntry[]; send: (text: string) => Promise<unknown>; onFocus: () => void; onClose: () => void; visible?:boolean; focusRequest?:number }) {
  const [text, setText] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null), log = useRef<HTMLDivElement>(null), composing = useRef(false);
  const following = useRef(true);
  const scrollPosition = useRef(0);
  const [reading, setReading] = useState({following:true,readId:entries.at(-1)?.id});
  const unread = !reading.following && reading.readId !== entries.at(-1)?.id;
  function latest() { following.current = true; setReading({following:true,readId:entries.at(-1)?.id}); if (log.current) log.current.scrollTop = log.current.scrollHeight; }
  useLayoutEffect(() => {
    if (!visible) return;
    if (log.current) log.current.scrollTop = following.current ? log.current.scrollHeight : scrollPosition.current;
  }, [entries, visible]);
  useLayoutEffect(() => { if (visible && focusRequest > 0) input.current?.focus({preventScroll:true}); }, [focusRequest, visible]);
  async function submit() {
    if (composing.current || busy || !text.trim()) return;
    setBusy(true); setError('');
    try { following.current = true; await send(text); setText(''); setReading({following:true,readId:entries.at(-1)?.id}); input.current?.focus(); }
    catch (e) { setError(e instanceof Error ? e.message : '메시지를 보내지 못했어요.'); }
    finally { setBusy(false); }
  }
  return <section className="chat-panel" aria-label="모닥불 채팅">
    <div className="panel-title"><strong>모닥불 이야기</strong><span>방 안의 모두에게 <kbd>Enter</kbd></span></div>
    <div ref={log} className="chat-log" role="log" aria-live="polite" aria-relevant="additions text" onScroll={e => { if(!visible)return;const node=e.currentTarget;scrollPosition.current=node.scrollTop;following.current=node.scrollHeight-node.clientHeight-node.scrollTop<32;const atEnd=following.current;setReading(previous=>previous.following===atEnd&&(!atEnd||previous.readId===entries.at(-1)?.id)?previous:{following:atEnd,readId:atEnd?entries.at(-1)?.id:previous.readId}); }}>
      {!entries.length && <p className="panel-empty">친구들에게 첫 인사를 건네 보세요.</p>}
      {entries.map((entry,i,list) => {
        const date=new Date(entry.createdAt), previous=list[i-1];
        const label=date.toLocaleDateString('ko-KR');
        return <div key={entry.id} className="chat-entry">{(!previous||new Date(previous.createdAt).toLocaleDateString('ko-KR')!==label)&&<div className="chat-date">{label}</div>}
          <p><strong style={{ color: entry.color }}>{entry.name}</strong><span>{entry.kind==='call'?'🔔 ':''}{entry.text}</span><time dateTime={date.toISOString()} title={date.toLocaleString('ko-KR')}>{date.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</time></p></div>;
      })}
    </div>
    {unread && <button type="button" className="chat-latest" onClick={latest}>새 메시지 · 최신으로 이동 ↓</button>}
    <form onSubmit={e => { e.preventDefault(); void submit(); }}>
      <input ref={input} className="text-input" aria-label="채팅 메시지" placeholder="이야기 남기기…" maxLength={200} value={text} onFocus={onFocus} onChange={e => setText(e.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={e => {
        if (e.key === 'Enter' && (e.nativeEvent.isComposing || composing.current || e.keyCode === 229)) e.preventDefault();
        if (e.key === 'Escape') {
          e.stopPropagation();
          if (!e.nativeEvent.isComposing && !composing.current && e.keyCode !== 229) { e.preventDefault(); input.current?.blur(); onClose(); }
        }
      }} />
      <button type="submit" disabled={busy || !text.trim()}>{busy ? '전송 중' : '보내기'}</button>
    </form>
    {error && <p className="panel-error" role="alert">{error}</p>}
  </section>;
}
