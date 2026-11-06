'use client';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { BottomSheet, Text } from '@seed-design/react';
import { ActionButton as Button } from '@/seed-design/ui/action-button';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/seed-design/ui/tabs';
import SpriteArt from './sprite-art';
const compactQuery='(max-width: 760px)';
const subscribeCompact=(notify:()=>void)=>{const q=window.matchMedia(compactQuery);q.addEventListener('change',notify);return()=>q.removeEventListener('change',notify);};
export const useCompactCamp=()=>useSyncExternalStore(subscribeCompact,()=>window.matchMedia(compactQuery).matches,()=>false);
const subscribeTouch=(notify:()=>void)=>{const q=window.matchMedia('(pointer: coarse)');q.addEventListener('change',notify);return()=>q.removeEventListener('change',notify);};
export const CAMP_PANELS=[['chat','대화'],['people','사람'],['status','내 상태'],['play','놀이'],['radio','라디오']] as const;
export type CampPanelTab=typeof CAMP_PANELS[number][0];
type Props={title:string;status:string;tab:CampPanelTab;onTab:(tab:CampPanelTab)=>void;onClose:()=>void;peopleCount:number;invite?:ReactNode;presence:ReactNode;people:ReactNode;chat:ReactNode;play:ReactNode;radio:ReactNode;footer:ReactNode;open:boolean;floating:boolean};
export default function CampPanel(p:Props){
  const [expanded,setExpanded]=useState(false);
  const touchInput=useSyncExternalStore(subscribeTouch,()=>window.matchMedia('(pointer: coarse)').matches,()=>false);
  function resizePanel(button:HTMLButtonElement){
    button.focus();
    // The drawer freezes input geometry before an on-screen keyboard opens.
    // Without a keyboard resize (desktop/responsive preview), release that freeze.
    if(window.innerHeight-(window.visualViewport?.height??window.innerHeight)<60){
      const sheet=button.closest<HTMLElement>('[data-camp-panel]');
      sheet?.style.removeProperty('height');sheet?.style.removeProperty('min-height');
    }
    setExpanded(value=>!value);
  }
  const pages={chat:p.chat,people:p.people,status:p.presence,play:p.play,radio:p.radio};
  return <BottomSheet.Root open={!p.floating||p.open} onOpenChange={open=>{if(!open)p.onClose();}} modal={false} autoFocus={false} repositionInputs={p.floating&&touchInput} dismissible={p.floating} handleOnly closeOnInteractOutside={false} closeOnEscape={p.floating} lazyMount={false} unmountOnExit={false}>
    <BottomSheet.Positioner hidden={p.floating&&!p.open} className={'camp-panel-positioner'+(p.floating?' is-floating':'')+(expanded?' is-expanded':'')}>
      <BottomSheet.Content className="camp-panel" data-camp-panel aria-label="모닥불 대화와 친구들" onKeyDown={e=>{if(e.key==='Escape'&&!e.nativeEvent.isComposing&&e.keyCode!==229){e.preventDefault();p.onClose();}}}>
        {p.floating&&<BottomSheet.Handle/>}
        <header className="camp-panel-heading"><div><span className="panel-eyebrow"><SpriteArt name="amber"/>OUR LITTLE CAMP</span><BottomSheet.Title>{p.title}</BottomSheet.Title><Text as="p" textStyle="t3Regular" color="fg.neutralMuted" role="status">{p.status}</Text></div><div className="camp-panel-size">{p.floating&&<Button size="small" variant="ghost" aria-label="패널 높이 조절" aria-pressed={expanded} onClick={event=>resizePanel(event.currentTarget)}>{expanded?'작게':'크게'}</Button>}<Button size="small" variant="ghost" className="panel-close" onClick={p.onClose}>필드로</Button></div></header>
        <TabsRoot className="camp-tabs" value={p.tab} onValueChange={v=>p.onTab(v as CampPanelTab)} triggerLayout="fill" contentLayout="fill" size="medium" lazyMount={false} unmountOnExit={false}>
          <TabsList className="camp-panel-tabs" aria-label="캠프 패널">{CAMP_PANELS.map(([id,label])=><TabsTrigger id={`camp-tab-${id}`} aria-controls={`camp-page-${id}`} key={id} value={id}>{label}{id==='people'&&<span className="tab-count">{p.peopleCount}</span>}</TabsTrigger>)}</TabsList>
          <div className="camp-panel-scroll">{CAMP_PANELS.map(([id])=><TabsContent key={id} value={id} className="camp-panel-page" id={`camp-page-${id}`} aria-labelledby={`camp-tab-${id}`}>{pages[id]}</TabsContent>)}</div>
        </TabsRoot>
        <footer className="camp-panel-footer">{p.invite&&<details className="invite-card"><summary>친구 초대하기</summary><div>{p.invite}</div></details>}{p.footer}</footer>
      </BottomSheet.Content>
    </BottomSheet.Positioner>
  </BottomSheet.Root>;
}
