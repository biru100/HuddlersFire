'use client';
import { EMOTES } from '@/lib/camp-world.mjs';

type Props = {
  crouching: boolean; emotesOpen: boolean; target: string | null; carrying: boolean; carried: boolean; allowCarry: boolean; motion: string;
  onCrouch: (down: boolean) => void; onEmotes: (open: boolean) => void; onEmote: (id: string) => void;
  onLift: () => void; onEscape: () => void; onAllowCarry: (allow: boolean) => void;
};
export default function ActionBar(p: Props) {
  return <div className="camp-actions">
    <div className="action-buttons" aria-label="캐릭터 동작">
      <button className={p.crouching ? 'selected' : ''} aria-pressed={p.crouching} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); p.onCrouch(true); }} onPointerUp={() => p.onCrouch(false)} onPointerCancel={() => p.onCrouch(false)} onLostPointerCapture={() => p.onCrouch(false)} onKeyDown={e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); p.onCrouch(true); } }} onKeyUp={e => { if (e.code === 'Space' || e.code === 'Enter') p.onCrouch(false); }} onBlur={() => p.onCrouch(false)}><span>웅크리기</span><kbd>Shift</kbd></button>
      <button aria-expanded={p.emotesOpen} onClick={() => p.onEmotes(!p.emotesOpen)}>감정표현 <kbd>Q</kbd></button>
      <button disabled={!p.carrying && !p.target} onClick={p.onLift}>{p.carrying ? '내려놓기' : p.target ? `${p.target} 들기` : '친구 들기'} <kbd>F</kbd></button>
      {p.carried && <button onClick={p.onEscape}>내려오기 <kbd>Space</kbd></button>}
    </div>
    {p.emotesOpen && <div className="emote-picker" role="group" aria-label="감정표현 선택">{EMOTES.map((e: { id: string; label: string; symbol: string }, i: number) => <button key={e.id} onClick={() => p.onEmote(e.id)}><strong>{e.symbol}</strong><span>{e.label} <kbd>{i + 1}</kbd></span></button>)}</div>}
    <div className="action-settings"><label><input type="checkbox" checked={p.allowCarry} onChange={e => p.onAllowCarry(e.target.checked)} /> 친구가 나를 들어올려도 좋아요</label><span role="status">{p.motion === 'falling' || p.motion === 'respawning' ? '앗! 모닥불 근처로 돌아가요…' : p.carried ? 'Space로 언제든 내려올 수 있어요' : p.motion === 'airborne' ? '통통! 하늘 구경 중' : '가장자리에서는 떨어질 수 있어요'}</span></div>
  </div>;
}
