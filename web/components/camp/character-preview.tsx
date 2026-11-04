'use client';

import { useEffect, useRef } from 'react';
import { AvatarImages, drawCharacter } from '@/lib/camp-character.mjs';

export default function CharacterPreview({ color, avatar }: { color: string; avatar: string | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current, context = node?.getContext('2d');
    if (!node || !context) return;
    const images = new AvatarImages(draw);
    function draw() {
      if (!node || !context) return;
      context.clearRect(0, 0, node.width, node.height);
      context.save(); context.translate(48, 72); context.scale(1.1, 1.1);
      drawCharacter(context, { color }, { avatar: images.get(avatar) });
      context.restore();
    }
    draw();
    return () => images.dispose();
  }, [color, avatar]);
  return <span className="character-preview"><canvas ref={canvas} width={96} height={80} role="img" aria-label={avatar ? 'Discord 프로필 사진을 머리로 사용하는 내 캐릭터' : '내 캐릭터 미리보기'} /></span>;
}
