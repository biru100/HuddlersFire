'use client';

import { useState } from 'react';
import ChoiceField from './choice-field';
import { FIRE_STYLES, FIRE_XP_PER_LEVEL, fireLevel } from '@/lib/camp-fire.mjs';

export default function FireProgress({ xp, style, change }: { xp:number; style:string; change:(style:string)=>Promise<void> }) {
  const [busy,setBusy]=useState(false);
  const level=fireLevel({xp}),max=level===FIRE_STYLES.length;
  return <div className="fire-progress">
    <strong aria-live="polite">우리 모닥불 · Lv.{level}</strong>
    <span className="fire-xp-label">{max?`함께 모은 ${xp} XP · 최고 레벨`:`다음 레벨 ${xp%FIRE_XP_PER_LEVEL} / ${FIRE_XP_PER_LEVEL} XP`}</span>
    {!max&&<progress aria-label="다음 모닥불 레벨까지 경험치" value={xp%FIRE_XP_PER_LEVEL} max={FIRE_XP_PER_LEVEL}/>}
    <ChoiceField label="모두의 불 모습" value={style} disabled={busy} onChange={async next=>{
      setBusy(true);try{await change(next);}finally{setBusy(false);}
    }} options={FIRE_STYLES.map(s=>({value:s.id,label:s.name+(s.level>level?` · Lv.${s.level} 해금`:''),disabled:s.level>level}))}/>
  </div>;
}
