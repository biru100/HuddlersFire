'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DISCORD_MESSAGES } from '@/lib/camp-discord.mjs';

function Completion() {
  const params = useSearchParams(), raw = params.get('notice') || '';
  const notice = Object.hasOwn(DISCORD_MESSAGES, raw) ? raw as keyof typeof DISCORD_MESSAGES : 'discord-failed';
  const message = DISCORD_MESSAGES[notice];
  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'camp-discord-complete', notice }, location.origin);
      const timer = window.setTimeout(() => window.close(), 350);
      return () => window.clearTimeout(timer);
    }
  }, [notice]);
  return <main className="discord-result"><h1>Discord 프로필 연결</h1><p role="status">{message}</p><p>원래 캠프장으로 돌아가 주세요.</p><button className="primary-button" onClick={() => window.close()}>이 창 닫기</button><Link href="/">캠프장으로 돌아가기</Link></main>;
}
export default function DiscordComplete() { return <Suspense fallback={<p>Discord 연결 결과를 확인하고 있어요.</p>}><Completion /></Suspense>; }
