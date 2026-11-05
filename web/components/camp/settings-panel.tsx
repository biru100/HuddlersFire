'use client';
import { Dialog } from 'radix-ui';

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onCloseFocus: () => void;
  effectsVolume: number; musicVolume: number; muted: boolean; allowCarry: boolean; carryBusy: boolean;
  onEffectsVolume: (volume: number) => void; onMusicVolume: (volume: number) => void; onMuted: (muted: boolean) => void; onAllowCarry: (allow: boolean) => void;
  inRoom?:boolean; linked: boolean; discordAvailable: boolean; discordBusy: boolean; discordMessage: string; onDiscord: () => void; onCancelDiscord: () => void };
export default function SettingsPanel(p: Props) {
  return <Dialog.Root open={p.open} onOpenChange={p.onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="radio-backdrop" />
    <Dialog.Content className="radio-popup settings-popup" onCloseAutoFocus={e => { e.preventDefault(); p.onCloseFocus(); }}>
      <Dialog.Close className="radio-close" aria-label="설정 닫기">×</Dialog.Close>
      <Dialog.Title>나의 설정</Dialog.Title><Dialog.Description>소리와 친구들과의 상호작용을 편하게 맞춰요.</Dialog.Description>
      <fieldset><legend>소리</legend>
        <label className="setting-range">효과음 음량<input aria-label="효과음 음량" type="range" min={0} max={100} value={Math.round(p.effectsVolume * 100)} onChange={e => p.onEffectsVolume(Number(e.target.value) / 100)} /><span>{Math.round(p.effectsVolume * 100)}%</span></label>
        <button onClick={() => p.onEffectsVolume(p.effectsVolume ? 0 : .5)}>{p.effectsVolume ? '효과음 끄기' : '효과음 켜기'}</button>
        <label className="setting-check"><input type="checkbox" checked={p.muted} onChange={e => p.onMuted(e.target.checked)} /> 내 라디오 음소거</label>
        <label className="setting-range">음악 음량<input type="range" min={0} max={100} value={p.musicVolume} onChange={e => p.onMusicVolume(Number(e.target.value))} /><span>{p.musicVolume}%</span></label>
        <p>효과음 음량은 모닥불·장작 등 효과음 전체에 적용돼요. 라디오는 자동으로 함께 재생돼요. 음소거와 음량은 나에게만 적용돼요. 방 전체 재생은 라디오에서 바꿔요.</p>
      </fieldset>
      <fieldset><legend>친구와 함께</legend><label className="setting-check"><input type="checkbox" checked={p.allowCarry} disabled={p.carryBusy} onChange={e => p.onAllowCarry(e.target.checked)} /> 친구가 나를 들어올려도 좋아요</label><p>들린 상태에서 끄면 바로 내려올 수 있어요.</p></fieldset>
      <fieldset><legend>Discord</legend><p>{p.linked ? 'Discord 계정이 연결되어 있어요. 연결 해제는 방을 떠난 뒤 할 수 있어요.' : '입장하려면 Discord 계정을 연결해 주세요.'}</p>
        <button className="discord-button" disabled={(p.inRoom&&p.linked) || p.discordBusy || (!p.discordAvailable && !p.linked)} onClick={p.onDiscord}>{p.discordBusy ? 'Discord 연결 확인 중…' : p.linked ? '프로필 연결 해제' : p.discordAvailable ? 'Discord 계정 연결' : 'Discord 연결 준비 중'}</button>
        {p.discordBusy && <button onClick={p.onCancelDiscord}>연결 취소</button>}
        {p.discordMessage && <p role="status">{p.discordMessage}</p>}
      </fieldset>
      <p className="settings-note">음량과 상호작용 설정은 이 브라우저에 저장돼요.</p>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
