'use client';
import { WEAPONS } from '@/lib/camp-weapons.mjs';

type Props = { playing: boolean; weapon: string; canFire: boolean; ready: boolean; equip: (weapon: string) => void; fire: () => void };
export default function WeaponBar(p: Props) {
  if (!p.playing) return <p className="micro-copy">총·눈뭉치·폭탄과 친구 들기·던지기는 놀이터에서 즐겨요.</p>;
  return <fieldset className="weapon-bar"><legend>장난감 고르기</legend>
    <div className="weapon-slots" role="group" aria-label="장난감 선택">
      {[{ id: 'none', label: '맨손', key: '0' }, ...WEAPONS].map(w => <button key={w.id} aria-pressed={p.weapon === w.id} onPointerDown={e => e.preventDefault()} onClick={() => p.equip(w.id)}><kbd>{w.key}</kbd>{w.label}</button>)}
    </div>
    <button className="weapon-fire" disabled={p.weapon === 'none' || !p.canFire || !p.ready} onPointerDown={e => e.preventDefault()} onClick={p.fire}>{p.weapon === 'none' ? '장난감을 먼저 골라 주세요' : !p.ready ? '잠깐 기다려요…' : '사용하기'} <kbd>J / 우클릭</kbd></button>
    <p>마우스 방향으로 사용해요. 모바일은 마지막 이동 방향이에요. 왼쪽 클릭은 친구 정보예요.</p>
  </fieldset>;
}
