import {CAMP_RELEASE,UPDATE_EVENT} from './camp-release.mjs';

export function notifyUpdate(release,win=globalThis.window) {
  if(typeof release!=='string'||!release||release===CAMP_RELEASE.id)return;
  win?.dispatchEvent(new win.CustomEvent(UPDATE_EVENT,{detail:{release}}));
}

export function reloadForUpdate(release,{win=globalThis.window,now=Date.now()}={}) {
  if(!win||win.__campReloading)return false;
  // Cache-busting navigation normally loads the new hashed bundle. If an edge
  // still serves stale HTML, stop a repeated reload instead of looping forever.
  try{
    const last=JSON.parse(win.sessionStorage.getItem('camp:last-update')||'null');
    if(last?.release===release&&now-last.at<60_000)return false;
    win.sessionStorage.setItem('camp:last-update',JSON.stringify({release,at:now}));
  }catch{/* Storage may be disabled; the per-document guard still applies. */}
  win.__campReloading=true;
  const url=new URL(win.location.href);
  url.searchParams.set('notice','app-updated');url.searchParams.set('camp-release',release);
  win.location.replace(url.href);return true;
}

export function watchUpdates({request,onUpdate,win=globalThis.window,doc=win?.document,interval=15_000}) {
  let stopped=false,busy=false,handled=false;
  const update=event=>{if(stopped||handled||typeof event.detail?.release!=='string')return;handled=true;onUpdate(event.detail.release);};
  const check=async()=>{if(stopped||busy||handled)return;busy=true;try{await request('version');}catch{/* Outages do not clear rooms or force reloads. */}finally{busy=false;}};
  const visible=()=>{if(doc.visibilityState==='visible')void check();};
  win.addEventListener(UPDATE_EVENT,update);win.addEventListener('focus',check);doc.addEventListener('visibilitychange',visible);
  const timer=win.setInterval(check,interval);void check();
  return()=>{stopped=true;win.clearInterval(timer);win.removeEventListener(UPDATE_EVENT,update);win.removeEventListener('focus',check);doc.removeEventListener('visibilitychange',visible);};
}
