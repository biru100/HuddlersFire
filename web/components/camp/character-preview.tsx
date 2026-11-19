'use client';

import { useEffect, useRef } from 'react';
import { useCampSettings, getSettingsSnapshot } from './use-camp-settings';
import { drawCharacter } from '@/lib/camp-character.mjs';
import { subscribeSprites, preloadSprites, characterSheet } from '@/lib/camp-sprite-assets.mjs';
import { camperSheetId } from '@/lib/camp-camper-render.mjs';
import { toneIndex } from '@/lib/camp-appearance.mjs';

type Props = { color:string; hairStyle?:number; topStyle?:number; portraitSize?:42|64 };
export default function CharacterPreview({ color, hairStyle=0, topStyle=0, portraitSize }: Props) {
  const [{theme}] = useCampSettings();
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current, context = node?.getContext('2d');
    if (!node || !context) return;
    function draw() {
      if (!node || !context) return;
      context.clearRect(0, 0, node.width, node.height);
      context.save();
      context.imageSmoothingEnabled=false;
      context.translate(portraitSize ? 24 : 48, portraitSize ? 79 : 76);
      drawCharacter(context, { color, hairStyle, topStyle }, { theme: getSettingsSnapshot().theme, reduced:true });
      context.restore();
    }
    const unsubscribe=subscribeSprites(draw);
    void preloadSprites([camperSheetId(theme),characterSheet(toneIndex(color),theme)]);
    draw();
    return () => { unsubscribe(); };
  }, [color, theme, hairStyle, topStyle, portraitSize]);
  if (portraitSize) return <span className="camper-portrait" style={{width:portraitSize,height:portraitSize}} aria-hidden="true"><canvas ref={canvas} width={48} height={48}/></span>;
  return <span className="character-preview"><canvas ref={canvas} width={96} height={80} role="img" aria-label="내 캐릭터 미리보기" /></span>;
}
