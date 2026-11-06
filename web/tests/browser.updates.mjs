// Real compiled legacy -> current -> next-build transitions on loopback only.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {headlessBrowser,until,delay} from './browser-cdp.mjs';
import {youtubeFixture} from './youtube-fixture.mjs';
const origin=process.env.CAMP_TEST_URL||'http://127.0.0.1:5295',out='outputs/scene-polish-publish';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const releaseFrom=file=>{const bytes=readFileSync(file),text=bytes.toString(bytes[0]===255&&bytes[1]===254?'utf16le':'utf8');return JSON.parse(text.match(/Camp build release (\{[^\r\n]+\})/)[1]);};
const first=releaseFrom(out+'/update-build-final.txt'),b=await headlessBrowser();
const click=async text=>{assert.ok(await b.evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&e.textContent.includes(${JSON.stringify(text)}));if(!e||e.disabled)return false;e.click();return true;})()`),text);};
const request=async(path,body)=>{const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,path);return r.json();};
const deploy=async(release,upstream)=>request('/__test/deploy',{release,upstream});
const enter=async()=>{await until(()=>b.evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='방 만들기');return e&&!e.disabled;})()`),'Linked lobby not ready');await click('방 만들기');await until(()=>b.evaluate(`!!document.querySelector('.entry-dialog')`),'Create dialog absent');await click('모닥불 시작하기');await until(()=>b.evaluate(`!!document.querySelector('.in-camp')&&!!document.querySelector('.room-code strong')`),'Room did not open');return b.evaluate(`document.querySelector('.room-code strong').textContent`);};
const shot=async name=>writeFileSync(out+'/'+name+'.png',Buffer.from((await b.call('Page.captureScreenshot',{format:'png'})).data,'base64'));
async function buildNext(){
  writeFileSync(out+'/update-waiting.json',JSON.stringify({readyForNextBuild:true,first})+'\n');
  // The orchestrator builds outside the browser process and starts the next
  // Worker. Keeping each compiled server in its own folder avoids Windows locks.
  await until(()=>existsSync(out+'/update-next-ready.json'),'Next build was not supplied',180000);
  const release=JSON.parse(readFileSync(out+'/update-next-ready.json','utf8'));assert.ok(release.revision>first.revision);assert.notEqual(release.id,first.id);
  await until(async()=>{try{return(await fetch('http://127.0.0.1:5296/',{signal:AbortSignal.timeout(1000)})).ok;}catch{return false;}},'Next compiled Worker did not start');return release;
}
try{
  await b.call('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await b.call('Page.addScriptToEvaluateOnNewDocument',{source:youtubeFixture+`;sessionStorage.setItem('camp-test-loads',String(Number(sessionStorage.getItem('camp-test-loads')||0)+1));`});
  await b.call('Page.navigate',{url:origin});await until(()=>b.evaluate(`!!document.querySelector('#nickname')`),'Legacy lobby not ready');
  await b.evaluate(`localStorage.setItem('camp-test-keep','preserved');localStorage.setItem('huddlers-fire-settings',JSON.stringify({theme:'color',effectsVolume:0,musicVolume:17,musicMuted:true,allowCarry:false}));fetch('/api/camp/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'배포 검증'})}).then(()=>fetch('/__test/discord-connect',{method:'POST'}))`);
  await b.call('Page.navigate',{url:origin});await until(()=>b.evaluate(`!!document.querySelector('#nickname')&&![...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='방 만들기')?.disabled`),'Linked legacy lobby not ready');
  const oldCode=await enter();assert.equal((await request('/__test/runtime')).rooms,1);
  await b.evaluate(`history.replaceState(null,'','/?room=${oldCode}&keep=updates#camp');window.__oldPage=true;`);await shot('update-before-legacy');
  await deploy(first,'http://127.0.0.1:5294');
  await until(()=>b.evaluate(`!window.__oldPage&&!!document.querySelector('#nickname')&&!document.querySelector('.in-camp')`),'Legacy room did not reload into new lobby',30000);
  assert.equal((await request('/__test/runtime')).rooms,0);assert.equal((await request('/__test/runtime')).members,0);
  assert.ok(await b.evaluate(`!new URL(location.href).searchParams.has('room')&&new URL(location.href).searchParams.get('keep')==='updates'&&location.hash==='#camp'&&localStorage.getItem('camp-test-keep')==='preserved'`));
  assert.equal(await b.evaluate(`fetch('/api/camp/session').then(r=>r.json()).then(r=>r.profile.linked)`),true);await shot('update-after-legacy');
  console.log('PASS: actual published v36 room received 410, reloaded the new compiled app and retained the linked profile/settings.');
  const currentCode=await enter();
  await b.evaluate(`document.querySelector('.field-view-menu').setAttribute('open','')`);await click('작은 창 · PIP');
  await until(()=>b.evaluate(`!!window.documentPictureInPicture?.window?.document.querySelector('[data-camp-input]')`),'PIP did not open');
  const pipTargets=(await b.send('Target.getTargets')).targetInfos.filter(t=>t.type==='other').map(t=>t.targetId);
  await b.evaluate(`history.replaceState(null,'','/?room=${currentCode}&keep=updates#camp');window.__oldPage=true;`);
  console.log('Building the second release for a real current -> next transition.');
  const next=await buildNext();await deploy(next,'http://127.0.0.1:5296');
  await until(()=>b.evaluate(`!window.__oldPage&&!!document.querySelector('#nickname')&&document.body.textContent.includes('새 버전으로 업데이트했어요')`),'Automatic release watcher did not load the next compiled app',30000);
  const runtime=await request('/__test/runtime');assert.equal(runtime.rooms,0);assert.equal(runtime.members,0);assert.deepEqual(runtime.release,next);
  const state=await b.evaluate(`({url:location.href,linked:document.querySelector('#nickname')?.value,settings:JSON.parse(localStorage.getItem('huddlers-fire-settings')),keep:localStorage.getItem('camp-test-keep'),loads:Number(sessionStorage.getItem('camp-test-loads'))})`);
  assert.equal(new URL(state.url).searchParams.has('room'),false);assert.equal(new URL(state.url).searchParams.get('keep'),'updates');assert.equal(new URL(state.url).hash,'#camp');assert.equal(state.keep,'preserved');assert.equal(state.settings.musicVolume,17);assert.equal(state.linked,'배포 검증');
  const currentTargets=(await b.send('Target.getTargets')).targetInfos.map(t=>t.targetId);assert.ok(pipTargets.every(id=>!currentTargets.includes(id)),'Old PIP target survived update');
  await delay(16000);assert.equal(await b.evaluate(`Number(sessionStorage.getItem('camp-test-loads'))`),state.loads,'Repeated version checks caused a reload loop');
  await shot('update-after-current');assert.deepEqual(b.errors,[]);
  writeFileSync(out+'/update-browser.json',JSON.stringify({legacy:'published-v36',first,next,legacyReload:true,currentReload:true,rooms:0,members:0,pipClosed:true,profileAndSettingsPreserved:true,noReloadLoop:true,loads:state.loads},null,2)+'\n');
  console.log('PASS: current room and PIP closed, next compiled release loaded automatically, profiles/settings survived and no reload loop occurred.');
}finally{
  await b.close();
}
