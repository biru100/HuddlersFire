// Disposable headless Chrome + loopback fixture; no personal browser or desktop UI.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync } from 'node:fs';
import { resolve,join,sep } from 'node:path';
import { observeField,fieldWalker,portalTo } from './browser-field.mjs';
import { GAME_BOOTHS } from '../lib/camp-maps.mjs';
import { gameById,exhibitCover,exhibitTrailer,exhibitSocials } from '../lib/camp-games.mjs';
import { youtubeFixture } from './youtube-fixture.mjs';
const origin=process.env.CAMP_TEST_URL||'http://127.0.0.1:5192';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const executable=process.env.CAMP_TEST_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const root=resolve('.wrangler');mkdirSync(root,{recursive:true});mkdirSync('outputs',{recursive:true});
const profile=mkdtempSync(join(root,'headless-exhibition-'));
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
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Fetch.requestPaused')void send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html'}],body:Buffer.from('<!doctype html><html><body style="margin:0;display:grid;place-items:center;height:100vh;background:#101c19;color:#e4c992;font:18px sans-serif">YouTube trailer · test fixture</body></html>').toString('base64')},m.sessionId).catch(error=>errors.push(error.message));});
  const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const walk=fieldWalker(evaluate);
  const key=async code=>{await evaluate(`document.activeElement?.blur();document.querySelector('[data-camp-input]').focus()`);for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,code,key:code==='Escape'?'Escape':code.slice(-1).toLowerCase()},sessionId);};
  const nearbyClick=async()=>{
    assert.ok(await evaluate(`(()=>{const e=document.querySelector('.world-interact'),r=e?.getBoundingClientRect();return !!e&&!e.disabled&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()`),'Interaction button covered');
    await evaluate(`document.querySelector('.world-interact').click()`);
  };
  await send('Runtime.enable',{},sessionId);await send('Page.enable',{},sessionId);
  await send('Fetch.enable',{patterns:[{urlPattern:'https://www.youtube-nocookie.com/embed/*',requestStage:'Request'}]},sessionId);
  await send('Page.addScriptToEvaluateOnNewDocument',{source:'performance.setResourceTimingBufferSize(5000);\n'+observeField+'\n'+youtubeFixture},sessionId);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},sessionId);
  await send('Page.navigate',{url:origin},sessionId);
  await until(()=>evaluate(`!!document.querySelector('#nickname')`),'Lobby did not load');
  await evaluate(`fetch('/api/camp/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'전시장 검증'})}).then(()=>fetch('/__test/discord-connect',{method:'POST'}))`);
  for(const [name,width,height,mobile]of [['desktop',1280,900,false],['mobile',390,844,true]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile},sessionId);
    await send('Page.navigate',{url:origin},sessionId);
    await until(()=>evaluate(`!!document.querySelector('.solo-button')&&!document.querySelector('.solo-button').disabled`),'Linked lobby unavailable');
    await evaluate(`document.querySelector('.solo-button').click()`);
    await until(()=>evaluate(`!!document.querySelector('.in-camp')`),'Solo did not enter');
    assert.equal(await evaluate(`!!document.querySelector('.map-travel button')`),false,'Unrestricted travel returned');
    await key('KeyR');
    await until(()=>evaluate(`!!document.querySelector('[aria-label="라디오 닫기"]')`),'Radio did not open');
    await evaluate(`(()=>{const input=[...document.querySelectorAll('input[aria-label="신청할 YouTube 영상 링크"]')].find(e=>e.getClientRects().length);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'https://youtu.be/abcdefghijk');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await evaluate(`[...document.querySelectorAll('.music-panel form')].find(e=>e.getClientRects().length).requestSubmit()`);
    await until(()=>evaluate(`window.__ytPlayers?.at(-1)?.videoId==='abcdefghijk'&&window.__ytPlayers.at(-1).state===1`),'Radio did not start');
    await evaluate(`document.querySelector('[aria-label="라디오 닫기"]').click()`);
    if(await evaluate(`document.querySelector('.music-dock-heading button').getAttribute('aria-pressed')`) !== String(mobile))await evaluate(`document.querySelector('.music-dock-heading button').click()`);
    await until(()=>evaluate(`window.__ytPlayers.at(-1).muted===${mobile}`),'Personal mute did not settle');
    const radioState=()=>evaluate(`window.__ytPlayers.map(p=>({videoId:p.videoId,state:p.state,muted:p.muted,volume:p.volume,destroyed:!!p.destroyed,loads:p.loads.length}))`);
    const travel=async(from,to)=>{
      await walk(from,portalTo(from,to));
      if(mobile)await nearbyClick();else await key('KeyE');
      await until(()=>evaluate(`document.querySelector('.world').getAttribute('aria-label')===${JSON.stringify(to==='showroom'?'허들러즈 게임 전시장':to==='camp'?'불멍 캠프장':'숲속 놀이터')}`),'Portal did not arrive at '+to);
      await delay(600);
    };
    await travel('camp','showroom');
    assert.ok(await evaluate(`!document.querySelector('.fire-seat-tools')&&!document.querySelector('.weapon-slots')`));
    for(const booth of GAME_BOOTHS){
    const game=gameById(booth.gameId),trailer=exhibitTrailer(game),socials=exhibitSocials(game),suffix=game.id+'-'+name;
    await walk('showroom',booth);
    const radioBefore=await radioState();
    await until(()=>evaluate(`performance.getEntriesByName(new URL(${JSON.stringify(exhibitCover(game))},location.origin).href).length>0`),'Booth cover was not loaded: '+game.id);
    const boothShot=await send('Page.captureScreenshot',{format:'png'},sessionId);writeFileSync('outputs/game-booth-'+suffix+'.png',Buffer.from(boothShot.data,'base64'));
    assert.equal(await evaluate(`!!document.querySelector('.game-info-popup')`),false,'Proximity must not auto-open the game');
    if(mobile)await nearbyClick();else await key('KeyE');
    await until(()=>evaluate(`!!document.querySelector('.game-info-popup')`),'Game introduction did not open');
    await until(()=>evaluate(`[...document.querySelectorAll('.game-info-popup img')].every(i=>i.complete&&i.naturalWidth>0)`),'Official artwork did not load');
    assert.equal(await evaluate(`document.querySelector('.game-info-heading h2').textContent`),game.title);
    assert.equal(await evaluate(`document.querySelector('.game-info-logo').getAttribute('src')`),game.image);
    assert.ok(await evaluate(`(()=>{const f=document.querySelector('.game-trailer iframe'),r=f?.getBoundingClientRect();window.__trailerFrame=f;return !!f&&f.src===${JSON.stringify(trailer.embed)}&&!new URL(f.src).searchParams.has('autoplay')&&r.width>=200&&r.height>=200;})()`),'Main trailer missing or too small');
    assert.deepEqual(await radioState(),radioBefore,'Opening an exhibit changed shared playback or personal mute');
    assert.equal(await evaluate(`document.querySelector('.game-trailer a').href`),trailer.url);
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('.game-socials a,.game-socials button')].map(e=>({label:e.getAttribute('aria-label'),url:e.getAttribute('href'),disabled:e.tagName==='BUTTON'&&e.disabled&&e.getAttribute('aria-disabled')==='true'}))`),socials.map(s=>({label:s.label+(s.url?' 계정 열기':' 계정 미등록'),url:s.url,disabled:!s.url})));
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('.game-links a')].map(a=>({label:a.textContent.replace(' ↗',''),url:a.href}))`),game.links);
    await until(()=>evaluate(`(()=>{const d=document.querySelector('.game-info-popup'),r=d.getBoundingClientRect();return d.contains(document.activeElement)&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&d.scrollWidth<=d.clientWidth+1;})()`),'Modal focus or responsive bounds failed');
    if(mobile)assert.ok(await evaluate(`(()=>{const d=document.querySelector('.game-info-popup').getBoundingClientRect(),p=document.querySelector('.music-dock').getBoundingClientRect();return d.bottom+5<=p.top&&p.bottom<=innerHeight;})()`),'Radio overlaps the mobile introduction');
    assert.ok(await evaluate(`[...document.querySelectorAll('.game-links a')].every(a=>a.target==='_blank'&&a.rel.includes('noopener')&&a.href.startsWith('https://'))`));
    const before=await evaluate('window.__fieldPosition');
    for(const code of ['KeyW','KeyJ','KeyE','KeyR','Digit1'])for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,code,key:code.slice(-1).toLowerCase()},sessionId);
    await delay(250);const after=await evaluate('window.__fieldPosition');assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<.01,'Modal leaked game input');
    const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);writeFileSync('outputs/game-intro-'+suffix+'.png',Buffer.from(shot.data,'base64'));
    await evaluate(`document.querySelector('.game-links').scrollIntoView({block:'center'})`);
    assert.ok(await evaluate(`[...document.querySelectorAll('.game-socials a,.game-socials button')].every(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})`),'SNS icons are clipped or covered');
    assert.ok(await evaluate(`[...document.querySelectorAll('.game-links a')].every(a=>{const r=a.getBoundingClientRect();return a.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})`),'Game links are clipped or covered');
    assert.ok(await evaluate(`(()=>{const b=document.querySelector('.game-info-popup .radio-close'),r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()`),'Close button is covered after scrolling');
    const linksShot=await send('Page.captureScreenshot',{format:'png'},sessionId);writeFileSync('outputs/game-intro-links-'+suffix+'.png',Buffer.from(linksShot.data,'base64'));
    if(mobile)await evaluate(`document.querySelector('.game-info-popup button[aria-label="게임 소개 닫기"]').click()`);else for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,code:'Escape',key:'Escape'},sessionId);
    await until(()=>evaluate(`!document.querySelector('.game-info-popup')&&document.activeElement===document.querySelector('[data-camp-input]')`),'Close did not return field focus');
    assert.ok(await evaluate(`!window.__trailerFrame.isConnected`),'Closing the introduction must remove the trailer player');
    assert.deepEqual(await radioState(),radioBefore,'Closing an exhibit changed shared playback or personal mute');
    console.log('PASS: '+suffix+' own cover/logo/trailer/links, exact SNS registration, input lock and close');
    }
    await travel('showroom','camp');await travel('camp','playground');await travel('playground','camp');
    console.log('PASS: '+name+' physical portal walking/return, booth E/touch, official images, links, modal focus/input lock and responsive layout');
  }
  assert.deepEqual(errors,[]);console.log('PASS: no browser runtime exceptions; isolated loopback headless only');
}finally{
  if(socket?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});socket.close();}
  await delay(500);browser.kill();
  if(resolve(profile).startsWith(root+sep))try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch{}
}
