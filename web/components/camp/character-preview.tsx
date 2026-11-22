'use client';

import { useEffect, useRef } from 'react';
import { useCampSettings, getSettingsSnapshot } from './use-camp-settings';
import { drawCharacter } from '@/lib/camp-character.mjs';
import { subscribeSprites, preloadSprites } from '@/lib/camp-sprite-assets.mjs';
import { camperSheetId } from '@/lib/camp-camper-render.mjs';

type Props = { color:string; hairStyle?:number; topStyle?:number; portraitSize?:42|64 };
export default function CharacterPreview({ color, hairStyle=0, topStyle=0, portraitSize }: Props) {
  const [{theme}] = useCampSettings();
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current, context = node?.getContext('2d');
    if (!node || !context) return;
    function draw() {
      if (!node || !context) return;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const pixelRatio = node.ownerDocument.defaultView?.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width*pixelRatio));
      const height = Math.max(1, Math.round(rect.height*pixelRatio));
      if (node.width !== width) node.width = width;
      if (node.height !== height) node.height = height;
      const scale = Math.min(width/(portraitSize ? 48 : 96), height/(portraitSize ? 48 : 80));
      context.clearRect(0, 0, node.width, node.height);
      context.save();
      context.translate(width/2, height/2+(portraitSize ? 55 : 36)*scale);
      context.scale(scale,scale);
      drawCharacter(context, { color, hairStyle, topStyle }, { theme: getSettingsSnapshot().theme, reduced:true });
      context.restore();
    }
    const unsubscribe=subscribeSprites(draw);
    const observer=new ResizeObserver(draw);
    const observesDevicePixels=typeof ResizeObserverEntry!=='undefined'&&
      'devicePixelContentBoxSize' in ResizeObserverEntry.prototype;
    observer.observe(node,observesDevicePixels?{box:'device-pixel-content-box'}:undefined);
    const view=node.ownerDocument.defaultView;
    view?.addEventListener('resize',draw);
    let resolution:MediaQueryList|undefined;
    function watchResolution() {
      resolution?.removeEventListener('change',watchResolution);
      resolution=view?.matchMedia(`(resolution: ${view.devicePixelRatio}dppx)`);
      resolution?.addEventListener('change',watchResolution);
      draw();
    }
    void preloadSprites([camperSheetId(theme)]);
    watchResolution();
    return () => {
      unsubscribe();
      observer.disconnect();
      view?.removeEventListener('resize',draw);
      resolution?.removeEventListener('change',watchResolution);
    };
  }, [color, theme, hairStyle, topStyle, portraitSize]);
  if (portraitSize) return <span className="camper-portrait" style={{width:portraitSize,height:portraitSize}} aria-hidden="true"><canvas ref={canvas} width={48} height={48}/></span>;
  return <span className="character-preview"><canvas ref={canvas} width={96} height={80} role="img" aria-label="내 캐릭터 미리보기" /></span>;
}
