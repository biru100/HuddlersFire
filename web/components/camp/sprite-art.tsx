'use client';
import { spriteManifest } from '@/lib/camp-sprite-assets.mjs';
import { useCampSettings } from './use-camp-settings';

/** Decorative reuse of the same illustrated sheet as the game. */
export default function SpriteArt({name,className=''}:{name:string;className?:string}){
  const [{theme}]=useCampSettings();
  const sprite=spriteManifest.sprites[name as keyof typeof spriteManifest.sprites];
  if(!sprite)return null;
  const file=spriteManifest.files[(sprite.sheet+(theme==='dark'?'-dark':'')) as keyof typeof spriteManifest.files];
  return <svg className={'sprite-art '+className} viewBox={`0 0 ${sprite.w} ${sprite.h}`} aria-hidden="true" focusable="false"><image href={file.url} x={-sprite.x} y={-sprite.y} width={file.width} height={file.height}/></svg>;
}
