'use client';
import { useCampSettings } from './use-camp-settings';
import { characterColor } from '@/lib/camp-appearance.mjs';
import CharacterPreview from './character-preview';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { CampDialog } from '@/components/camp/camp-dialog';
import { PRESENCE_LABELS } from '@/lib/camp-presence.mjs';
import type { Presence } from '@/lib/camp-types';

export type PlayerInfoView = Presence & {
  id: string; name: string; color: string; hairStyle:number; topStyle:number; isSelf: boolean; isHost: boolean;
  connected: boolean; allowCarry: boolean | null; activity: string; weapon: string;
};
type Props = { canHide?:boolean; hidden?:boolean; onHidden?:(id:string)=>void; player: PlayerInfoView | null; anchor: { x: number; y: number } | null; onClose: () => void; onCloseFocus: () => void; onCall:(id:string)=>void; container?:HTMLElement };
export default function PlayerInfoPanel({ player, onClose, onCloseFocus, onCall, container,canHide,hidden,onHidden }: Props) {
  const [{theme}] = useCampSettings();
  return <CampDialog open={!!player} onOpenChange={open => { if (!open) onClose(); }} container={container} label="함께 쉬는 친구" className="player-info-panel" onCloseFocus={onCloseFocus}>
      <Button onClick={()=>onClose()} className="player-info-close" label="플레이어 정보 닫기">×</Button>
      <h2>함께 쉬는 친구</h2>
      <p>지금 이 모닥불에서 함께하는 플레이어예요.</p>
      {player && <>
        <div className="player-info-heading">
          <CharacterPreview {...player} portraitSize={64}/>
          <div><strong>{player.name}</strong><div className="player-info-badges">{player.isSelf && <Badge label="나"/>}{player.isHost && <Badge label="방장"/>}<Badge label={player.connected ? '연결됨' : '연결 대기'}/></div></div>
        </div>
        <p>{PRESENCE_LABELS[player.presence as keyof typeof PRESENCE_LABELS]}{player.statusText&&` · ${player.statusText}`}</p><p>{player.workText}</p>
        <dl><div><dt>지금은</dt><dd>{player.activity}</dd></div><div><dt>장난감</dt><dd>{player.weapon}</dd></div><div><dt>캐릭터 톤</dt><dd><i className="player-color-dot" style={{ backgroundColor: characterColor(player.color,theme) }} />오늘의 톤</dd></div><div><dt>친구가 들어올리기</dt><dd>{player.allowCarry === null ? '확인 중' : player.allowCarry ? '허용 · 앉아 있을 때 제외' : '허용하지 않음'}</dd></div></dl>
        {!player.isSelf&&canHide&&<><Button aria-pressed={!!hidden} onClick={()=>onHidden?.(player.id)} label={hidden?'내 화면에 다시 보이기':'내 화면에서 숨기기'}/><small>통나무에서 쉬는 동안 캐릭터와 말풍선만 숨겨요. 전체 채팅은 그대로예요.</small></>}
        {!player.isSelf&&<Button isDisabled={!player.connected||!player.allowCall} onClick={()=>onCall(player.id)} label={player.allowCall?'친구 부르기':'호출을 받지 않는 친구예요'}/>}
      </>}
    </CampDialog>;
}
