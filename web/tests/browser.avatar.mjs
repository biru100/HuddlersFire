import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {loadImage,createCanvas} from '@napi-rs/canvas';
import {headlessBrowser,until,delay} from './browser-cdp.mjs';
const origin=process.env.CAMP_TEST_URL||'http://127.0.0.1:5197';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Loopback only');
const browser=await headlessBrowser();
const count=data=>{let n=0;for(let i=0;i<data.length;i+=4)if((data[i]===255&&data[i+1]===0&&data[i+2]===180)||(data[i]===0&&data[i+1]===255&&data[i+2]===90))n++;return n;};
async function captureField(name){
  await delay(700);
  const clip=await browser.evaluate("(()=>{const r=document.querySelector('[data-camp-input]').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()");
  const screenshot=await browser.call('Page.captureScreenshot',{format:'png',clip}),bytes=Buffer.from(screenshot.data,'base64'),image=await loadImage(bytes),canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
  const pixels=count(ctx.getImageData(0,0,canvas.width,canvas.height).data);assert.equal(pixels,0,name+' field contains the account portrait');
  mkdirSync('outputs/avatar-debug',{recursive:true});writeFileSync('outputs/avatar-debug/avatar-'+name+'.png',bytes);return pixels;
}
try{
  await browser.call('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await browser.call('Page.navigate',{url:origin});await until(()=>browser.evaluate("!!document.querySelector('#nickname')"),'Lobby unavailable');
  await browser.evaluate(`fetch('/api/camp/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Avatar QA'})}).then(()=>fetch('/__test/discord-connect',{method:'POST'}))`);
  await browser.call('Page.navigate',{url:origin});
  await until(()=>browser.evaluate(`document.querySelector('.character-preview canvas')?.getAttribute('aria-label')==='내 캐릭터 미리보기'`),'Character preview unavailable');
  await until(()=>browser.evaluate(`(()=>{const c=document.querySelector('.character-preview canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let opaque=0;for(let i=0;i<d.length;i+=4){if(d[i]===255&&d[i+1]===0&&d[i+2]===180)return false;if(d[i+3]===255)opaque++;}return opaque>200;})()`),'Linked user must see an illustrated character in the lobby');
  const account=await browser.evaluate("fetch('/api/camp/session').then(r=>r.json()).then(s=>({linked:s.profile.linked,hasPhoto:!!s.profile.avatar}))");
  assert.deepEqual(account,{linked:true,hasPhoto:true});
  const lobbyAvatarPixels=await captureField('lobby');
  await browser.evaluate("document.querySelector('.solo-button').click()");
  await until(()=>browser.evaluate("document.querySelector('.in-camp [data-camp-input]')?.dataset.campRenderer==='webgl'&&!document.querySelector('.scene-status')"),'Solo field unavailable');
  const pixels=await captureField('field');
  await browser.evaluate("document.querySelector('#camp-tab-people,[aria-controls=camp-page-people]')?.click()");
  const painted = selector => browser.evaluate(`(()=>{const c=document.querySelector(${JSON.stringify(selector)});if(!c)return false;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let opaque=0;for(let i=0;i<d.length;i+=4){if(d[i]===255 && d[i+1]===0 && d[i+2]===180)return false;if(d[i+3]===255)opaque++;}return opaque>200})()`);
  await until(()=>painted('.people-list .camper-portrait canvas'),'Roster portrait missing');
  await browser.evaluate("document.querySelector('.person-info-button').click()");
  await until(()=>painted('.player-info-heading .camper-portrait canvas'),'Profile portrait missing');
  const photoRequests=await browser.evaluate("performance.getEntriesByType('resource').filter(e=>e.name.includes('/api/camp/avatar/') || e.name.includes('cdn.discordapp.com/avatars/')).length");
  assert.equal(photoRequests,0);
  assert.deepEqual(browser.errors,[]);
  console.log(JSON.stringify({account,roster:true,profileCard:true,photoRequests,profilePreview:true,lobbyAvatarPixels,fieldAvatarPixels:pixels,backend:'webgl'}));
}finally{await browser.close();}
