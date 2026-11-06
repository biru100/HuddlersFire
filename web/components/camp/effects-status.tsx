'use client';
import {ActionButton as Button} from '@/seed-design/ui/action-button';
export const EFFECTS_LABELS:Record<string,string>={muted:'모닥불 소리 꺼짐',blocked:'소리를 재생하려면 한 번 눌러 주세요.',loading:'모닥불 소리를 불러오는 중…',failed:'모닥불 소리를 불러오지 못했어요.',playing:'모닥불 소리 재생 중',outside:'모닥불 소리는 불멍에서 들려요.'};
export default function EffectsStatus({volume,status,onVolume,compact=false}:{volume:number;status:string;onVolume:(volume:number)=>void;compact?:boolean}){
 const state=volume?status:'muted',retry=state==='failed'||state==='blocked';
 return <div className={'effects-status'+(compact?' is-compact':'')}><span role="status">{EFFECTS_LABELS[state]||EFFECTS_LABELS.loading}</span><Button size="small" disabled={state==='loading'} onClick={()=>onVolume(!volume? .25:retry?volume:0)}>{!volume?'효과음 켜기':state==='failed'?'효과음 다시 시도':state==='blocked'?'눌러서 효과음 재생':'효과음 끄기'}</Button></div>;
}
