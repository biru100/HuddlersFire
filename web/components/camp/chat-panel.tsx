'use client';
import { useEffect, useRef, useState } from 'react';
export type ChatEntry = { id: string; by: string; name: string; color: string; text: string; at: number };
export default function ChatPanel({ entries, send, onFocus, onClose }: { entries: ChatEntry[]; send: (text: string) => Promise<unknown>; onFocus: () => void; onClose: () => void }) {
  const [text, setText] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null), log = useRef<HTMLDivElement>(null), composing = useRef(false);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [entries]);
  useEffect(() => {
    const focus = () => input.current?.focus(); window.addEventListener('camp-chat-focus', focus);
    return () => window.removeEventListener('camp-chat-focus', focus);
  }, []);
  async function submit() {
    if (composing.current || busy || !text.trim()) return;
    setBusy(true); setError('');
    try { await send(text); setText(''); input.current?.focus(); }
    catch (e) { setError(e instanceof Error ? e.message : '메시지를 보내지 못했어요.'); }
    finally { setBusy(false); }
  }
  return <section className="chat-panel" aria-label="모닥불 채팅">
    <div className="panel-title"><strong>모닥불 이야기</strong><span>방 안의 모두에게 <kbd>Enter</kbd></span></div>
    <div ref={log} className="chat-log" role="log" aria-live="polite" aria-relevant="additions text">
      {!entries.length && <p className="panel-empty">친구들에게 첫 인사를 건네 보세요.</p>}
      {entries.map(entry => <p key={entry.id}><strong style={{ color: entry.color }}>{entry.name}</strong><span>{entry.text}</span></p>)}
    </div>
    <form onSubmit={e => { e.preventDefault(); void submit(); }}>
      <input ref={input} className="text-input" aria-label="채팅 메시지" placeholder="이야기 남기기…" maxLength={200} value={text} onFocus={onFocus} onChange={e => setText(e.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={e => {
        if (e.key === 'Enter' && (e.nativeEvent.isComposing || composing.current || e.keyCode === 229)) e.preventDefault();
        if (e.key === 'Escape') { e.preventDefault(); input.current?.blur(); onClose(); }
      }} />
      <button type="submit" disabled={busy || !text.trim()}>{busy ? '전송 중' : '보내기'}</button>
    </form>
    {error && <p className="panel-error" role="alert">{error}</p>}
  </section>;
}
