'use client';

import { useEffect, useRef } from 'react';
import { useCampSettings, getSettingsSnapshot } from './use-camp-settings';
import { AvatarImages, drawCharacter } from '@/lib/camp-character.mjs';
import { subscribeSprites, preloadSprites, characterSheet } from '@/lib/camp-sprite-assets.mjs';
import { camperSheetId } from '@/lib/camp-camper-render.mjs';
import { toneIndex } from '@/lib/camp-appearance.mjs';

export default function CharacterPreview({ color, avatar, hairStyle, topStyle }: { color: string; avatar: string | null; hairStyle:number; topStyle:number }) {
  const [{theme}] = useCampSettings();
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current, context = node?.getContext('2d');
    if (!node || !context) return;
    const images = new AvatarImages(draw);
    function draw() {
      if (!node || !context) return;
      context.clearRect(0, 0, node.width, node.height);
      context.save(); context.translate(48, 76);
      drawCharacter(context, { color, hairStyle, topStyle }, { avatar: images.get(avatar), theme: getSettingsSnapshot().theme });
      context.restore();
    }
    const unsubscribe=subscribeSprites(draw);
    void preloadSprites([camperSheetId(theme),characterSheet(toneIndex(color),theme)]);
    draw();
    return () => {unsubscribe();images.dispose();};
  }, [color, avatar, theme, hairStyle, topStyle]);
  return <span className="character-preview"><canvas ref={canvas} width={96} height={80} role="img" aria-label={avatar ? 'Discord 프로필 사진을 머리로 사용하는 내 캐릭터' : '내 캐릭터 미리보기'} /></span>;
}
