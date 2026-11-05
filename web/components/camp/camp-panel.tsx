'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

const compactQuery = '(max-width: 760px)';
const subscribeCompact = (notify: () => void) => {
  const query = window.matchMedia(compactQuery);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
export const useCompactCamp = () => useSyncExternalStore(subscribeCompact, () => window.matchMedia(compactQuery).matches, () => false);

export const CAMP_PANELS = [
  ['chat', '대화'], ['people', '사람'], ['status', '내 상태'], ['play', '놀이'], ['radio','라디오'],
] as const;
export type CampPanelTab = typeof CAMP_PANELS[number][0];

type Props = {
  title: string;
  status: string;
  tab: CampPanelTab;
  onTab: (tab: CampPanelTab) => void;
  onClose: () => void;
  invite?: ReactNode;
  presence: ReactNode;
  people: ReactNode;
  peopleCount: number;
  chat: ReactNode;
  play: ReactNode; radio:ReactNode;
  footer: ReactNode;
};

// Keep every page mounted so drafts, scroll positions and pending requests survive navigation.
export default function CampPanel(p: Props) {
  return <section className="camp-panel" data-camp-panel aria-label="모닥불 대화와 친구들" onKeyDown={e => {
    if (e.key === 'Escape' && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); p.onClose(); }
  }}>
    <header className="camp-panel-heading">
      <div><h2>{p.title}</h2><p role="status">{p.status}</p></div>
      <button className="panel-close" onClick={p.onClose}>필드로</button>
    </header>
    <nav className="camp-panel-tabs" role="tablist" aria-label="캠프 패널" onKeyDown={e => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const index = CAMP_PANELS.findIndex(([id]) => id === p.tab);
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? CAMP_PANELS.length-1 : (index + (e.key === 'ArrowLeft' ? CAMP_PANELS.length-1 : 1)) % CAMP_PANELS.length;
      p.onTab(CAMP_PANELS[next][0]);
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus();
    }}>
      {CAMP_PANELS.map(([id, label]) => <button key={id} id={`camp-tab-${id}`} role="tab"
        aria-selected={p.tab === id} aria-controls={`camp-page-${id}`} tabIndex={p.tab === id ? 0 : -1}
        onClick={() => p.onTab(id)}>{label}{id === 'people' && <small>{p.peopleCount}</small>}</button>)}
    </nav>
    {p.presence}
    <div className="camp-panel-page" role="tabpanel" id="camp-page-chat" aria-labelledby="camp-tab-chat" hidden={p.tab !== 'chat'}>{p.chat}</div>
    <div className="camp-panel-page" role="tabpanel" id="camp-page-people" aria-labelledby="camp-tab-people" hidden={p.tab !== 'people'}>{p.people}</div>
    <div className="camp-panel-page" role="tabpanel" id="camp-page-play" aria-labelledby="camp-tab-play" hidden={p.tab !== 'play'}>{p.play}</div>
    <div className="camp-panel-page" role="tabpanel" id="camp-page-radio" aria-labelledby="camp-tab-radio" hidden={p.tab!=='radio'}>{p.radio}</div>
    <footer className="camp-panel-footer">
      {p.invite && <details className="invite-card"><summary>친구 초대하기</summary>{p.invite}</details>}
      {p.footer}
    </footer>
  </section>;
}
