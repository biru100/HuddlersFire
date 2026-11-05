// Disposable headless Chrome + loopback fixture; no personal browser or desktop UI.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync } from 'node:fs';
import { resolve,join,sep } from 'node:path';
import { youtubeFixture } from './youtube-fixture.mjs';
import { readJSON,writeJSON,inside,hash,runtimeHash } from '../../tools/lib/sprite-spec.mjs';
const previewDir=process.env.CAMP_PREVIEW_JOB?resolve(process.env.CAMP_PREVIEW_JOB,'..'):null;
const origin=process.env.CAMP_TEST_URL||'http://127.0.0.1:5192';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const executable=process.env.CAMP_TEST_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const root=resolve('.wrangler');mkdirSync(root,{recursive:true});mkdirSync('outputs',{recursive:true});
const profile=mkdtempSync(join(root,'headless-appearance-'));
const browser=spawn(executable,['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,label,timeout=15000)=>{const start=Date.now();while(!(await fn())){if(Date.now()-start>timeout)throw Error(label);await delay(100);}};
let socket,seq=0;const pending=new Map(),errors=[];
function send(method,params={},sessionId){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},15000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
try{
  await until(()=>existsSync(join(profile,'DevToolsActivePort')),'Headless browser did not start');
  const [port,path]=readFileSync(join(profile,'DevToolsActivePort'),'utf8').trim().split(/\r?\n/);
  socket=new WebSocket('ws://127.0.0.1:'+port+path);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
  const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  await send('Runtime.enable',{},sessionId);await send('Page.enable',{},sessionId);
  await send('Page.addScriptToEvaluateOnNewDocument',{source:'performance.setResourceTimingBufferSize(5000);'},sessionId);
  await send('Page.addScriptToEvaluateOnNewDocument',{source:youtubeFixture},sessionId);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},sessionId);
  await send('Page.navigate',{url:origin},sessionId);
  await until(()=>evaluate(`!!document.querySelector('#nickname')`),'Lobby did not load');
  await evaluate(`fetch('/api/camp/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'전시장 검증'})}).then(()=>fetch('/__test/discord-connect',{method:'POST'}))`);

  for(const [name,width,height,mobile]of [['desktop',1280,900,false],['mobile',390,844,true]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile},sessionId);
    await evaluate(`localStorage.setItem('huddlers-fire-settings',JSON.stringify({effectsVolume:.35,musicVolume:28,musicMuted:true,allowCarry:false,...JSON.parse(localStorage.getItem('huddlers-fire-settings')||'{}'),theme:'color'}))`);
    await send('Page.navigate',{url:origin},sessionId);
    await until(()=>evaluate(`!!document.querySelector('#nickname')`),'Lobby unavailable');
    await until(()=>evaluate(`!!document.querySelector('.solo-button')&&!document.querySelector('.solo-button').disabled`),'Linked entry not ready');
    await until(()=>evaluate(`!document.querySelector('.scene-status')`),'Scene assets did not finish loading');
    await delay(300);
    const shot=async label=>{const s=await send('Page.captureScreenshot',{format:'png'},sessionId),bytes=Buffer.from(s.data,'base64');writeFileSync('outputs/seed-'+label+'-'+name+'.png',bytes);
      if(previewDir&&['room','field'].includes(label)){
        const identity=await evaluate(`fetch('/__sprite-preview/identity').then(r=>r.json())`),built=readJSON(inside(previewDir,'build/preview.json'));
        assert.equal(identity.fingerprint,built.fingerprint);assert.equal(identity.manifestHash,built.manifestHash);
        assert.ok(await evaluate(`performance.getEntriesByType('resource').some(r=>r.name.includes('/__sprite-preview/files/'))`),'Preview sprites must actually be consumed');
        const evidence=readJSON(inside(previewDir,'evidence.json'));assert.equal(evidence.fingerprint,built.fingerprint);assert.equal(evidence.manifestHash,built.manifestHash);assert.equal(evidence.runtimeHash,runtimeHash());
        const id='ui-'+name+(label==='field'?'-field':''),file='screens/'+id+'.png';writeFileSync(inside(previewDir,file),bytes);
        evidence.cases=evidence.cases.filter(c=>c.id!==id);evidence.cases.push({id,kind:'ui',width,height,map:'camp',view:label==='field'?'field':'ui',file,sha256:hash(bytes)});writeJSON(inside(previewDir,'evidence.json'),evidence);
      }
    };
    await shot('lobby');
    for(const entry of ['방 만들기','코드로 참여']){
      await evaluate(`[...document.querySelectorAll('.entry-actions button')].find(e=>e.textContent.includes(${JSON.stringify(entry)})).click()`);
      await until(()=>evaluate(`!!document.querySelector('.entry-dialog')`),'Entry dialog unavailable');
      await until(()=>evaluate(`(()=>{const e=document.querySelector('.entry-dialog'),r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.contains(document.activeElement);})()`),'Entry dialog bounds/focus');
      await delay(300);await shot(entry==='방 만들기'?'create':'join');
      await evaluate(`document.querySelector('[aria-label="입장 창 닫기"]').click()`);
      await until(()=>evaluate(`!document.querySelector('.entry-dialog')`),'Entry dialog did not close');
    }
    await evaluate(`document.querySelector('.solo-button').click()`);
    await until(()=>evaluate(`!!document.querySelector('.in-camp')`),'Solo unavailable');
    await delay(300);await shot('field');
    if(mobile)assert.ok(await evaluate(`(()=>{const f=document.querySelector('.fire-seat-tools')?.getBoundingClientRect(),t=document.querySelector('.touch-controls')?.getBoundingClientRect();return !f||!t||f.left>=t.right||f.right<=t.left||f.top>=t.bottom||f.bottom<=t.top;})()`),'Fire controls must not cover mobile movement');
    if(mobile)await evaluate(`document.querySelector('.camp-panel-dock button').click()`);
    await delay(300);await shot('room');
    assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll('.camp-panel-tabs button')].every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=36;})`),'Panel tabs must stay readable at both viewport sizes');
    assert.ok(await evaluate(`(()=>{const e=document.querySelector('.chat-panel form'),r=e.getBoundingClientRect(),footer=document.querySelector('.camp-panel-footer').getBoundingClientRect();return r.bottom<=footer.top&&footer.top-r.bottom<50&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()`),'Chat composer must remain visible at the bottom of the panel');
    await evaluate(`(()=>{const e=document.querySelector('input[aria-label="채팅 메시지"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'이어 쓰는 초안');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    for(const tab of ['people','status','play','radio','chat']){
      await evaluate(`document.querySelector('#camp-tab-${tab}').click()`);
      await delay(150);
      assert.ok(await evaluate(`[...document.querySelectorAll('.camp-panel-page')].filter(e=>e.getClientRects().length).length===1`),'Only the selected panel is visible');
      assert.ok(await evaluate(`(()=>{const f=document.querySelector('.camp-panel-footer').getBoundingClientRect(),c=document.querySelector('.camp-panel').getBoundingClientRect();return f.bottom<=innerHeight&&c.bottom<=innerHeight&&f.bottom<=c.bottom+1;})()`),'Every panel keeps the footer in the viewport');
      await shot('panel-'+tab);
    }
    assert.equal(await evaluate(`document.querySelector('input[aria-label="채팅 메시지"]').value`),'이어 쓰는 초안');
    if(mobile){
      const before=await evaluate(`document.querySelector('.camp-panel').getBoundingClientRect().height`);
      await evaluate(`document.querySelector('.camp-panel-size button[aria-label="패널 높이 조절"]').click()`);await delay(300);
      assert.ok(await evaluate(`document.querySelector('.camp-panel').getBoundingClientRect().height>${before}`),'Sheet size control must increase available space');
      await shot('panel-expanded');
      await evaluate(`document.querySelector('.panel-close').click()`);
      await until(()=>evaluate(`document.querySelector('.camp-panel').getClientRects().length===0`),'Sheet must close without keeping focusable content visible');
      await evaluate(`document.querySelector('.camp-panel-dock button').click()`);await delay(300);
      assert.equal(await evaluate(`document.querySelector('input[aria-label="채팅 메시지"]').value`),'이어 쓰는 초안');
    }
    await evaluate(`document.querySelector('[aria-label="설정 열기"]').click()`);
    await until(()=>evaluate(`!!document.querySelector('.settings-popup')`),'Settings unavailable');
    await delay(300);await shot('settings');
    assert.ok(await evaluate(`(()=>{const e=document.querySelector('.settings-popup'),r=e.getBoundingClientRect(),close=e.querySelector('[aria-label="설정 닫기"]'),b=close.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.contains(document.activeElement)&&close.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));})()`),'Settings must trap focus and paint above the mobile panel and field tools');
    assert.equal(await evaluate(`document.documentElement.dataset.campTheme`),'color');
    await evaluate(`window.__themeCanvas=document.querySelector('[data-camp-input]');window.__themePreferences=JSON.parse(localStorage.getItem('huddlers-fire-settings'));`);
    for(const theme of ['dark','color','dark']){
      await evaluate(`document.querySelector('.theme-options input[value="${theme}"]').click()`);
      await until(()=>evaluate(`document.documentElement.dataset.campTheme==='${theme}'`),'Theme did not apply');
      assert.ok(await evaluate(`document.querySelector('[data-camp-input]')===window.__themeCanvas&&document.querySelector('input[aria-label="채팅 메시지"]').value==='이어 쓰는 초안'`),'Theme switch must preserve Canvas and drafts');
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('huddlers-fire-settings')).theme`),theme);
      const rgb=await evaluate(`getComputedStyle(document.querySelector('.settings-popup')).backgroundColor.match(/\\d+/g).map(Number)`);
      assert.ok(theme==='dark'?rgb[0]<60&&rgb[0]===rgb[1]&&rgb[1]===rgb[2]:rgb[0]>230,'Readable themed surface');
      await until(()=>evaluate(`!document.querySelector('.scene-status')`),'Themed assets did not finish loading');
      await delay(100);await shot('settings-'+theme);
    }
    assert.ok(await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem('huddlers-fire-settings')),old=window.__themePreferences;return ['musicVolume','effectsVolume','musicMuted','allowCarry'].every(k=>s[k]===old[k]);})()`),'Theme should preserve audio and consent settings');
    await evaluate(`document.querySelector('[aria-label="설정 닫기"]').click()`);
    await until(()=>evaluate(`!document.querySelector('.settings-popup')&&document.activeElement===document.querySelector('[data-camp-input]')`),'Settings did not restore Canvas focus');
    await shot('field-dark');
    await send('Page.reload',{},sessionId);
    await until(()=>evaluate(`!!document.querySelector('#nickname')`),'Reloaded lobby missing');
    await until(()=>evaluate(`!!document.querySelector('.solo-button')&&!document.querySelector('.solo-button').disabled`),'Reload hydration incomplete');
    assert.equal(await evaluate(`document.documentElement.dataset.campTheme`),'dark');
    await evaluate(`document.querySelector('[aria-label="설정 열기"]').click()`);
    await until(()=>evaluate(`!!document.querySelector('.theme-options input[value="dark"]')?.checked`),'Saved radio selection missing');
    await evaluate(`document.querySelector('[aria-label="설정 닫기"]').click()`);
    console.log('PASS: '+name+' theme switching, storage, reload, Canvas/drafts, tabs, modal focus and screenshots');
  }
  assert.deepEqual(errors,[]);
}finally{
  if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}
  await delay(500);browser.kill();
  if(resolve(profile).startsWith(root+sep))try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch{}
}
