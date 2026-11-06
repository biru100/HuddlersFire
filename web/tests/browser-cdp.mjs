import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,readFileSync,mkdirSync,rmSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
export const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function until(fn,label,timeout=30000){const start=Date.now();while(!(await fn())){if(Date.now()-start>timeout)throw Error(label);await delay(100);}}
export async function headlessBrowser(){
  const root=resolve('.wrangler');mkdirSync(root,{recursive:true});const profile=mkdtempSync(join(root,'headless-lighting-'));
  const process=spawn(globalThis.process.env.CAMP_TEST_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
  let socket,id=0;const pending=new Map(),errors=[],listeners=new Set();
  try{await until(()=>existsSync(join(profile,'DevToolsActivePort')),'Headless browser did not start');const [port,path]=readFileSync(join(profile,'DevToolsActivePort'),'utf8').trim().split(/\r?\n/);socket=new WebSocket('ws://127.0.0.1:'+port+path);await new Promise((r,j)=>{const timer=setTimeout(()=>j(Error('Headless CDP socket did not connect within 10 seconds')),10000);socket.addEventListener('open',()=>{clearTimeout(timer);r();},{once:true});socket.addEventListener('error',()=>{clearTimeout(timer);j(Error('Headless CDP socket connection failed'));},{once:true});});
    socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);}}else{if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);for(const listener of listeners)listener(m);}});
    const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const next=++id,timer=setTimeout(()=>{pending.delete(next);reject(Error('CDP timeout '+method));},60000);pending.set(next,{resolve,reject,timer});socket.send(JSON.stringify({id:next,method,params,...(sessionId?{sessionId}:{})}));});
    const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
    const call=(method,params={})=>send(method,params,sessionId);await call('Runtime.enable');await call('Page.enable');
    return {call,send,errors,onEvent:listener=>(listeners.add(listener),()=>listeners.delete(listener)),evaluate:async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;},close:async()=>{try{await send('Browser.close');}catch{}socket.close();process.kill();await delay(500);if(resolve(profile).startsWith(root+sep))try{rmSync(profile,{recursive:true,force:true});}catch{}}};
  }catch(error){socket?.close();process.kill();throw error;}
}
