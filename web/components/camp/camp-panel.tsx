'use client';
import { useCallback, useState, useSyncExternalStore, type ReactNode } from 'react';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Text } from '@astryxdesign/core/Text';
import { createPortal } from 'react-dom';
import { Button } from '@astryxdesign/core/Button';
import { TabList, Tab } from '@astryxdesign/core/TabList';
const compactQuery='(max-width: 760px)';
const subscribeCompact=(notify:()=>void)=>{const q=window.matchMedia(compactQuery);q.addEventListener('change',notify);return()=>q.removeEventListener('change',notify);};
export const useCompactCamp=()=>useSyncExternalStore(subscribeCompact,()=>window.matchMedia(compactQuery).matches,()=>false);
export const CAMP_PANELS=[['chat','대화'],['people','사람'],['status','내 상태'],['play','놀이'],['radio','라디오']] as const;
export type CampPanelTab=typeof CAMP_PANELS[number][0];
type Props={title:string;status:string;tab:CampPanelTab;onTab:(tab:CampPanelTab)=>void;onClose:()=>void;peopleCount:number;invite?:ReactNode;presence:ReactNode;people:ReactNode;chat:ReactNode;play:ReactNode;radio:ReactNode;footer:ReactNode;open:boolean;floating:boolean};
export default function CampPanel(p:Props){
  const [expanded,setExpanded]=useState(false);
  // Move one subtree between the sidebar and sheet so drafts survive viewport changes.
  const [host] = useState(() => {
    if (typeof document === 'undefined') return null;
    const element = document.createElement('div');
    element.className = 'camp-panel-host';
    return element;
  });
  const attach = useCallback((node: HTMLDivElement | null) => {
    if (node && host) node.appendChild(host);
  }, [host]);
  const pages={chat:p.chat,people:p.people,status:p.presence,play:p.play,radio:p.radio};
  const panel = <section className="camp-panel" data-camp-panel aria-label="모닥불 대화와 친구들" onKeyDown={e=>{if(e.key==='Escape'&&!e.nativeEvent.isComposing&&e.keyCode!==229){e.preventDefault();p.onClose();}}}>
        <header className="camp-panel-heading"><div><h2>{p.title}</h2><Text as="p" size="sm" color="secondary" role="status">{p.status}</Text></div><div className="camp-panel-size">{p.floating&&<Button size="sm" variant="ghost" aria-pressed={expanded} onClick={()=>setExpanded(value=>!value)} label="패널 높이 조절">{expanded?'작게':'크게'}</Button>}<Button size="sm" variant="ghost" className="panel-close" onClick={p.onClose} label="필드로"/></div></header>
        <div className="camp-tabs">
          <TabList role="tablist" className="camp-panel-tabs" aria-label="캠프 패널" value={p.tab} onChange={value=>p.onTab(value as CampPanelTab)} layout="fill">
            {CAMP_PANELS.map(([id,label])=><Tab key={id} id={`camp-tab-${id}`} value={id} label={label} panelId={`camp-page-${id}`} endContent={id==='people'?p.peopleCount:undefined}/>)}
          </TabList>
          <div className="camp-panel-scroll">{CAMP_PANELS.map(([id])=><div key={id} role="tabpanel" hidden={p.tab!==id} className="camp-panel-page" id={`camp-page-${id}`} aria-labelledby={`camp-tab-${id}`}>{pages[id]}</div>)}</div>
        </div>
        <footer className="camp-panel-footer">{p.invite&&<details className="invite-card"><summary>친구 초대하기</summary><div>{p.invite}</div></details>}{p.footer}</footer>
      </section>;
  return <>
    {p.floating ? <BottomSheet label="캠프 패널" isOpen={p.open} onOpenChange={open=>{if(!open)p.onClose();}} hasScrim={false}
      className="camp-sheet" padding={0} height={expanded?'88dvh':'74dvh'}>
      <div className="camp-panel-positioner is-floating" ref={attach}/>
    </BottomSheet> : <div className="camp-panel-positioner" ref={attach}/>}
    {host && createPortal(panel,host)}
  </>;
}
