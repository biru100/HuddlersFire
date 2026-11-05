'use client';
import { ActionButton as Button } from '@/seed-design/ui/action-button';
import { Dialog } from '@/seed-design/ui/dialog';
import { useLayoutEffect,useRef } from 'react';
import { gameById,exhibitTrailer,exhibitSocials } from '@/lib/camp-games.mjs';

export default function GameInfoPanel({gameId,onClose,onCloseFocus}:{gameId:string|null;onClose:()=>void;onCloseFocus:()=>void}) {
  const game=gameById(gameId);
  const trailer=exhibitTrailer(game),socials=exhibitSocials(game);
  const panel=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    if(!gameId)return;
    const dock=document.querySelector('.in-camp .music-dock');
    const measure=()=>panel.current?.style.setProperty('--game-player-height',`${dock?.getBoundingClientRect().height||0}px`);
    measure();const observer=new ResizeObserver(measure);if(dock)observer.observe(dock);
    return()=>observer.disconnect();
  },[gameId]);
  return <Dialog.Root open={!!game} onOpenChange={open=>{if(!open)onClose();}}><Dialog.Portal>
    <Dialog.Overlay className="radio-backdrop"/>
    <Dialog.Content ref={panel} className="radio-popup game-info-popup" onCloseAutoFocus={e=>{e.preventDefault();onCloseFocus();}}>
      <Dialog.Close className="radio-close" aria-label="게임 소개 닫기">×</Dialog.Close>
      {game&&<div className="game-info-content">
        <header className="game-info-heading">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {game.image&&<img className="game-info-logo" src={game.image} alt="" width={120} height={52}/>}
        <div><p className="eyebrow">{game.studio}</p><Dialog.Title>{game.title}</Dialog.Title></div>
        </header>
        {trailer?<section className="game-trailer" aria-label="게임 트레일러">
          <iframe key={trailer.id} src={trailer.embed} title={`${game.title} 공식 트레일러`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>
          <a href={trailer.url} target="_blank" rel="noopener noreferrer">YouTube에서 트레일러 보기 ↗</a>
        </section>:<div className="game-trailer-empty"><p>트레일러 준비 중</p></div>}
        <p className="game-tagline">{game.tagline}</p>
        <Dialog.Description>{game.description}</Dialog.Description>
        <ul className="game-facts">{game.details.map(detail=><li key={detail}>{detail}</li>)}</ul>
        <nav className="game-socials" aria-label="게임 SNS 계정">{socials.map(social=>{
          // Decorative SVGs are local Simple Icons assets; accessible names belong to the controls.
          // eslint-disable-next-line @next/next/no-img-element
          const icon=<img src={`/icons/social/${social.id}.svg`} alt="" width={22} height={22}/>;
          return social.url?<Button asChild key={social.id} variant="neutralWeak"><a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={`${social.label} 계정 열기`} title={social.label}>{icon}</a></Button>:<Button key={social.id} type="button" disabled aria-disabled="true" aria-label={`${social.label} 계정 미등록`} title={`${social.label} 계정 링크가 아직 없어요`}>{icon}</Button>;
        })}</nav>
        <p>{game.release}</p>
        <nav className="game-links" aria-label="게임 관련 링크">{game.links.map(link=><Button asChild key={link.url} variant="neutralWeak"><a href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a></Button>)}</nav>
        {game.source&&<small>소개·이미지: <a href={game.source} target="_blank" rel="noopener noreferrer">{game.studio} 공식 웹사이트</a> · {game.checkedAt} 기준<br/>게임 링크는 새 탭에서 열립니다.</small>}
      </div>}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
