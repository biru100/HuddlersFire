'use client';
import { Button } from '@astryxdesign/core/Button';
import { CampDialog } from '@/components/camp/camp-dialog';
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
  return <CampDialog open={!!game} onOpenChange={open=>{if(!open)onClose();}} label="게임 소개" width={760} contentRef={panel} className="radio-popup game-info-popup" onCloseFocus={onCloseFocus}>
      <Button onClick={()=>onClose()} className="radio-close" label="게임 소개 닫기">×</Button>
      {game&&<div className="game-info-content">
        <header className="game-info-heading">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {game.image&&<img className="game-info-logo" src={game.image} alt="" width={120} height={52}/>}
        <div><p className="eyebrow">{game.studio}</p><h2>{game.title}</h2></div>
        </header>
        {trailer?<section className="game-trailer" aria-label="게임 트레일러">
          <iframe key={trailer.id} src={trailer.embed} title={`${game.title} 공식 트레일러`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>
          <a href={trailer.url} target="_blank" rel="noopener noreferrer">YouTube에서 트레일러 보기 ↗</a>
        </section>:<div className="game-trailer-empty"><p>트레일러 준비 중</p></div>}
        <p className="game-tagline">{game.tagline}</p>
        <p>{game.description}</p>
        <ul className="game-facts">{game.details.map(detail=><li key={detail}>{detail}</li>)}</ul>
        <nav className="game-socials" aria-label="게임 SNS 계정">{socials.map(social=>{
          // Decorative SVGs are local Simple Icons assets; accessible names belong to the controls.
          // eslint-disable-next-line @next/next/no-img-element
          const icon=<img src={`/icons/social/${social.id}.svg`} alt="" width={22} height={22}/>;
          return social.url?<Button key={social.id} variant="secondary" href={social.url} target="_blank" rel="noopener noreferrer" tooltip={social.label} label={`${social.label} 계정 열기`}>{icon}</Button>:<Button key={social.id} type="button" isDisabled aria-disabled="true" tooltip={`${social.label} 계정 링크가 아직 없어요`} label={`${social.label} 계정 미등록`}>{icon}</Button>;
        })}</nav>
        <p>{game.release}</p>
        <nav className="game-links" aria-label="게임 관련 링크">{game.links.map(link=><Button key={link.url} variant="secondary" href={link.url} target="_blank" rel="noopener noreferrer" label={link.label} endContent={<span aria-hidden="true">↗</span>}/>)}</nav>
        {game.source&&<small>소개·이미지: <a href={game.source} target="_blank" rel="noopener noreferrer">{game.studio} 공식 웹사이트</a> · {game.checkedAt} 기준<br/>게임 링크는 새 탭에서 열립니다.</small>}
      </div>}
    </CampDialog>;
}
