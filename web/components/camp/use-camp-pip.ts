'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useCampSettings } from './use-camp-settings';
import { applyTheme } from '@/lib/camp-theme.mjs';
type PipAPI = { requestWindow:(options:{width:number;height:number})=>Promise<Window> };
const subscribeCapability=()=>()=>{};
const pipCapability=()=>typeof window!=='undefined'&&'documentPictureInPicture' in window;
const noServerPip=()=>false;
export function useCampPip(onClose:()=>void, kind:'field'|'music'='field') {
  const [settings] = useCampSettings();
  const [pipWindow,setPipWindow]=useState<Window|null>(null), [busy,setBusy]=useState(false);
  useEffect(() => { if (pipWindow) applyTheme(pipWindow.document, settings.theme); }, [pipWindow, settings.theme]);
  const supported=useSyncExternalStore(subscribeCapability,pipCapability,noServerPip);
  const current=useRef<Window|null>(null), latest=useRef(onClose), opening=useRef(false), generation=useRef(0);
  useEffect(()=>{latest.current=onClose;},[onClose]);
  useEffect(()=>{const tokenRef=generation,windowRef=current;return()=>{tokenRef.current++;windowRef.current?.close();};},[]);
  const close=()=>{generation.current++;current.current?.close();};
  async function open() {
    if(opening.current||current.current){current.current?.focus();return;}
    const api=(window as Window & {documentPictureInPicture?:PipAPI}).documentPictureInPicture;
    if(!api)throw new Error('이 브라우저에서는 PIP를 지원하지 않아요. 필드 보기를 사용해 주세요.');
    opening.current=true;setBusy(true);const token=++generation.current;
    try {
      const next=await api.requestWindow(kind==='music'?{width:360,height:340}:{width:560,height:480});
      if(token!==generation.current){next.close();return;}
      next.document.title=kind==='music'?'Huddlers · 함께 듣는 밤':'Huddlers · 함께하는 모닥불';
      next.document.documentElement.lang='ko';
      applyTheme(next.document, settings.theme);
      for(const sheet of Array.from(document.styleSheets)) {
        try {const style=next.document.createElement('style');style.textContent=Array.from(sheet.cssRules).map(r=>r.cssText).join('\n');next.document.head.appendChild(style);}
        catch {if(sheet.href){const link=next.document.createElement('link');link.rel='stylesheet';link.href=sheet.href;next.document.head.appendChild(link);}}
      }
      next.document.body.className=kind==='music'?'camp-music-pip':'camp-pip';current.current=next;
      next.addEventListener('pagehide',()=>{if(current.current===next){current.current=null;setPipWindow(null);latest.current();}},{once:true});
      setPipWindow(next);
    } finally {opening.current=false;setBusy(false);}
  }
  return {pipWindow,supported,busy,open,close};
}
