'use client';
import { Banner } from '@astryxdesign/core/Banner';

export default function CampNotice({message}: {message: string}) {
  return <div className="camp-notice" role="status" aria-live="polite">
    {message && <Banner status="info" title={message}/>}
  </div>;
}
