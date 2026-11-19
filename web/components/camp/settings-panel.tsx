'use client';
import EffectsStatus from './effects-status';
import { Button } from '@astryxdesign/core/Button';
import { VolumeSlider } from '@/components/camp/form-controls';
import { Switch } from '@astryxdesign/core/Switch';
import { CampDialog } from '@/components/camp/camp-dialog';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onCloseFocus: () => void;
  theme: string; onTheme: (theme: string) => void;
  effectsVolume: number; effectsStatus:string; musicVolume: number; muted: boolean; allowCarry: boolean; carryBusy: boolean;
  onEffectsVolume: (volume: number) => void; onMusicVolume: (volume: number) => void; onMuted: (muted: boolean) => void; onAllowCarry: (allow: boolean) => void;
  inRoom?:boolean; linked: boolean; discordAvailable: boolean; discordBusy: boolean; discordMessage: string; onDiscord: () => void; onCancelDiscord: () => void };
export default function SettingsPanel(p: Props) {
  return <CampDialog open={p.open} onOpenChange={p.onOpenChange} label="나의 설정" className="radio-popup settings-popup" onCloseFocus={p.onCloseFocus}>
      <Button onClick={()=>p.onOpenChange(false)} className="radio-close" label="설정 닫기">×</Button>
      <h2>나의 설정</h2><p>화면, 소리와 친구들과의 상호작용을 편하게 맞춰요.</p>
      <fieldset><legend>화면 테마</legend>
        <RadioList isLabelHidden label="화면 테마" value={p.theme} onChange={p.onTheme} containerClassName="theme-options">
          <RadioListItem value="color" label="컬러 모드" description="따뜻한 불빛과 생동감 있는 색상"/>
          <RadioListItem value="dark" label="다크 모드" description="필드 색은 유지하고 메뉴와 패널을 어둡게"/>
        </RadioList>
        <p>내 화면에 바로 적용돼요. 작은 창에도 같은 테마를 사용해요.</p>
      </fieldset>
      <fieldset><legend>소리</legend>
        <VolumeSlider label="효과음 음량" value={Math.round(p.effectsVolume*100)} onChange={v=>p.onEffectsVolume(v/100)}/>
        <EffectsStatus volume={p.effectsVolume} status={p.effectsStatus} onVolume={p.onEffectsVolume}/>
        <Switch label="내 라디오 음소거" description="다른 친구의 재생에는 영향을 주지 않아요." value={p.muted} onChange={p.onMuted}/>
        <VolumeSlider label="음악 음량" value={p.musicVolume} onChange={p.onMusicVolume}/>
        <p>효과음 음량은 모닥불·장작 등 효과음 전체에 적용돼요. 라디오는 자동으로 함께 재생돼요. 음소거와 음량은 나에게만 적용돼요. 방 전체 재생은 라디오에서 바꿔요.</p>
      </fieldset>
      <fieldset><legend>친구와 함께</legend><Switch label="친구가 나를 들어올려도 좋아요" description="들린 상태에서 끄면 바로 내려와요." value={p.allowCarry} isDisabled={p.carryBusy} onChange={p.onAllowCarry}/></fieldset>
      <fieldset><legend>Discord</legend><p>{p.linked ? 'Discord 계정이 연결되어 있어요. 연결 해제는 방을 떠난 뒤 할 수 있어요.' : '입장하려면 Discord 계정을 연결해 주세요.'}</p>
        <Button className="discord-button" isDisabled={(p.inRoom&&p.linked) || p.discordBusy || (!p.discordAvailable && !p.linked)} onClick={p.onDiscord} label={p.discordBusy ? 'Discord 연결 확인 중…' : p.linked ? 'Discord 계정 연결 해제' : p.discordAvailable ? 'Discord 계정 연결' : 'Discord 연결 준비 중'}/>
        {p.discordBusy && <Button onClick={p.onCancelDiscord} label="연결 취소"/>}
        {p.discordMessage && <p role="status">{p.discordMessage}</p>}
      </fieldset>
      <p className="settings-note">화면 테마, 음량과 상호작용 설정은 이 브라우저에 저장돼요.</p>
    </CampDialog>;
}
