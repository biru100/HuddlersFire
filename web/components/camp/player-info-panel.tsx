'use client';
import { Dialog } from 'radix-ui';
import { PRESENCE_LABELS } from '@/lib/camp-presence.mjs';
import type { Presence } from '@/lib/camp-types';

export type PlayerInfoView = Presence & {
  id: string; name: string; color: string; avatar: string | null; isSelf: boolean; isHost: boolean;
  connected: boolean; allowCarry: boolean | null; activity: string; weapon: string;
};
type Props = { canHide?:boolean; hidden?:boolean; onHidden?:(id:string)=>void; player: PlayerInfoView | null; anchor: { x: number; y: number } | null; onClose: () => void; onCloseFocus: () => void; onCall:(id:string)=>void; container?:HTMLElement };
export default function PlayerInfoPanel({ player, anchor, onClose, onCloseFocus, onCall, container,canHide,hidden,onHidden }: Props) {
  return <Dialog.Root open={!!player} onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal container={container}>
    <Dialog.Overlay className="player-info-overlay" />
    <Dialog.Content className="player-info-panel" style={anchor ? { left: anchor.x, top: anchor.y } : undefined} onCloseAutoFocus={e => { e.preventDefault(); onCloseFocus(); }}>
      <Dialog.Close className="player-info-close" aria-label="플레이어 정보 닫기">×</Dialog.Close>
      <Dialog.Title>함께 쉬는 친구</Dialog.Title>
      <Dialog.Description>지금 이 모닥불에서 함께하는 플레이어예요.</Dialog.Description>
      {player && <>
        <div className="player-info-heading">
          <div className="player-info-avatar" style={{ backgroundColor: player.color }}><span>{Array.from(player.name)[0]}</span>{player.avatar && <img key={player.avatar} src={player.avatar} alt="" onError={e => { e.currentTarget.hidden = true; }} />}</div>
          <div><strong>{player.name}</strong><div className="player-info-badges">{player.isSelf && <span>나</span>}{player.isHost && <span>방장</span>}<span className={player.connected ? 'connected' : ''}>{player.connected ? '연결됨' : '연결 대기'}</span></div></div>
        </div>
        <p>{PRESENCE_LABELS[player.presence as keyof typeof PRESENCE_LABELS]}{player.statusText&&` · ${player.statusText}`}</p><p>{player.workText}</p>
        <dl><div><dt>지금은</dt><dd>{player.activity}</dd></div><div><dt>장난감</dt><dd>{player.weapon}</dd></div><div><dt>캐릭터 색</dt><dd><i className="player-color-dot" style={{ backgroundColor: player.color }} />오늘의 색</dd></div><div><dt>친구가 들어올리기</dt><dd>{player.allowCarry === null ? '확인 중' : player.allowCarry ? '허용 · 앉아 있을 때 제외' : '허용하지 않음'}</dd></div></dl>
        {!player.isSelf&&canHide&&<><button aria-pressed={!!hidden} onClick={()=>onHidden?.(player.id)}>{hidden?'내 화면에 다시 보이기':'내 화면에서 숨기기'}</button><small>통나무에서 쉬는 동안 캐릭터와 말풍선만 숨겨요. 전체 채팅은 그대로예요.</small></>}
        {!player.isSelf&&<button disabled={!player.connected||!player.allowCall} onClick={()=>onCall(player.id)}>{player.allowCall?'친구 부르기':'호출을 받지 않는 친구예요'}</button>}
      </>}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
