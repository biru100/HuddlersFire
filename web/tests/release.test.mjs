import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture,roomQuery} from './api-fixture.mjs';
import {CAMP_RELEASE,RELEASE_HEADER,REVISION_HEADER,UPDATE_EVENT} from '../lib/camp-release.mjs';
import {reloadForUpdate,watchUpdates} from '../lib/camp-updates.mjs';
import {api} from '../lib/camp-network.mjs';
const a={id:'build-a',revision:100},b={id:'build-b',revision:200};
const opts=release=>({headers:{[RELEASE_HEADER]:release.id},options:{release}});
test('new release preserves every stored row while advancing the release fence once',async()=>{
  const f=fixture(),h=await f.enrolled('Host'),g=await f.enrolled('Guest');
  try{
    const room=(await h('rooms',{op:'create'},opts(a))).value,guest=(await g('rooms',{op:'join',code:room.code},opts(a))).value;
    f.sqlite.prepare('INSERT INTO camp_signals(room,sender,recipient,payload,created) VALUES(?,?,?,?,?)').run(room.code,room.player,guest.player,'{}',Date.now());
    const tables=['camp_rooms','camp_members','camp_signals','camp_sessions','camp_oauth_states','camp_limits'];
    f.sqlite.prepare('INSERT INTO camp_oauth_states(id,session,expires) VALUES(?,?,?)').run('pending-oauth','existing-session',Date.now()+300_000);
    const snapshot=()=>Object.fromEntries(tables.map(t=>[t,f.sqlite.prepare('SELECT * FROM '+t+' ORDER BY '+(t==='camp_rooms'?'code':'id')).all()]));
    const before=snapshot();
    assert.deepEqual((await h('version',undefined,opts(b))).value.release,b);
    assert.deepEqual(snapshot(),before);
    assert.equal((await h('session',undefined,opts(b))).value.profile.linked,true);
    await Promise.all(Array.from({length:8},()=>g('version',undefined,opts(b))));
    assert.equal((await h('room',{op:'leave',code:room.code,player:room.player},opts(a))).status,410);
    assert.deepEqual(snapshot(),before);
    assert.equal((await h(roomQuery(room),undefined,opts(b))).status,200);
    const pending=await g(roomQuery(guest),undefined,opts(b));assert.equal(pending.status,200);
    assert.equal(pending.value.signals.length,1);
    const next=await h('rooms',{op:'create'},opts(b));assert.equal(next.status,201);
    assert.equal((await h(roomQuery(next.value),undefined,opts(b))).status,200);
  }finally{f.sqlite.close();}
});
test('stale clients and old isolates cannot recreate or erase newer rooms',async()=>{
  const f=fixture(),h=await f.enrolled('Host');
  try{
    await h('version',undefined,opts(b));const room=(await h('rooms',{op:'create'},opts(b))).value;
    const stale=await h('rooms',{op:'create'},{headers:{[RELEASE_HEADER]:a.id},options:{release:b}});
    assert.equal(stale.status,410);assert.equal(stale.value.code,'release-updated');assert.equal(stale.response.headers.get(RELEASE_HEADER),b.id);
    const old=await h('rooms',{op:'create'},opts(a));assert.equal(old.status,410);assert.deepEqual(old.value.release,b);
    assert.equal((await h('rooms',{op:'create'},{options:{release:b}})).status,410);
    assert.equal((await h(roomQuery(room),undefined,opts(b))).status,200);
  }finally{f.sqlite.close();}
});
test('first activation without a runtime row preserves existing room data',async()=>{
  const f=fixture(),h=await f.enrolled('Host');
  try{
    const room=(await h('rooms',{op:'create'},opts(a))).value;
    f.sqlite.prepare('DELETE FROM camp_runtime').run();
    const before=f.sqlite.prepare('SELECT * FROM camp_rooms').all();
    assert.deepEqual((await f.client()('version',undefined,opts(b))).value.release,b);
    assert.deepEqual(f.sqlite.prepare('SELECT * FROM camp_rooms').all(),before);
    assert.equal((await h(roomQuery(room),undefined,opts(b))).status,200);
  }finally{f.sqlite.close();}
});
test('create fence rejects an old request paused across activation',async()=>{
  const f=fixture(),h=await f.enrolled('Host');
  try{
    await h('version',undefined,opts(a));const original=f.DB.batch;let advanced=false;
    f.DB.batch=statements=>{if(!advanced){advanced=true;f.sqlite.prepare('UPDATE camp_runtime SET release=?,revision=? WHERE id=1').run(b.id,b.revision);}return original(statements);};
    assert.equal((await h('rooms',{op:'create'},opts(a))).status,410);
    assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM camp_rooms').get().n,0);
  }finally{f.sqlite.close();}
});
test('anonymous version discovery is uncached and cannot reactivate an old build',async()=>{
  const f=fixture(),c=f.client();
  try{
    const fresh=await c('version',undefined,{options:{release:b}});assert.equal(fresh.status,200);assert.equal(fresh.response.headers.get('cache-control'),'no-store');assert.equal(fresh.response.headers.get(RELEASE_HEADER),b.id);
    assert.deepEqual((await c('version',undefined,{options:{release:a}})).value.release,b);
  }finally{f.sqlite.close();}
});
function browser(){
  const win=new EventTarget(),doc=new EventTarget(),values=new Map(),navigations=[];
  Object.assign(doc,{visibilityState:'visible'});
  Object.assign(win,{document:doc,CustomEvent,sessionStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},location:{href:'https://camp.test/?room=ABC234&keep=yes#camp',replace:url=>navigations.push(url)},setInterval:fn=>(win.interval=fn,1),clearInterval:()=>{win.interval=null;}});
  return {win,doc,values,navigations};
}
test('update navigation preserves room invitations and other URL state and prevents loops',()=>{
  const f=browser();assert.equal(reloadForUpdate(b.id,{win:f.win,now:1000}),true);
  const u=new URL(f.navigations[0]);assert.equal(u.searchParams.get('room'),'ABC234');assert.equal(u.searchParams.get('keep'),'yes');assert.equal(u.hash,'#camp');assert.equal(u.searchParams.get('notice'),'app-updated');assert.equal(u.searchParams.get('camp-release'),b.id);
  assert.equal(reloadForUpdate(b.id,{win:f.win,now:1001}),false);delete f.win.__campReloading;
  assert.equal(reloadForUpdate(b.id,{win:f.win,now:2000}),false);assert.equal(reloadForUpdate(b.id,{win:f.win,now:62_000}),true);
});
test('watcher handles an update once, wakes on focus and ignores outages',async()=>{
  const f=browser();let checks=0,updates=0;
  const stop=watchUpdates({win:f.win,request:async()=>{checks++;throw new TypeError('offline');},onUpdate:()=>updates++});
  await new Promise(setImmediate);assert.equal(checks,1);assert.equal(updates,0);
  f.win.dispatchEvent(new Event('focus'));await new Promise(setImmediate);assert.equal(checks,2);
  const event=()=>new CustomEvent(UPDATE_EVENT,{detail:{release:b.id}});f.win.dispatchEvent(event());f.win.dispatchEvent(event());assert.equal(updates,1);
  stop();f.win.dispatchEvent(event());f.win.dispatchEvent(new Event('focus'));assert.equal(checks,2);assert.equal(updates,1);assert.equal(f.win.interval,null);
});
test('API release header notifies before stale success data is consumed; 503 does not reload',async()=>{
  const f=browser(),previousFetch=globalThis.fetch,previousWindow=globalThis.window;let updates=0;
  f.win.addEventListener(UPDATE_EVENT,()=>updates++);globalThis.window=f.win;
  try{
    globalThis.fetch=async(_,init)=>{assert.equal(init.headers[RELEASE_HEADER],CAMP_RELEASE.id);return Response.json({ok:true},{headers:{[RELEASE_HEADER]:b.id}});};
    await assert.rejects(api('version'),e=>e.status===410&&e.code==='release-updated');assert.equal(updates,1);
    globalThis.fetch=async()=>Response.json({error:'temporary'},{status:503,headers:{[RELEASE_HEADER]:CAMP_RELEASE.id}});
    await assert.rejects(api('version'),e=>e.status===503);assert.equal(updates,1);
    globalThis.fetch=async()=>Response.json({release:a},{headers:{[RELEASE_HEADER]:a.id,[REVISION_HEADER]:'-1'}});
    await assert.rejects(api('version'),e=>e.status===503);assert.equal(updates,1,'late responses cannot trigger a downgrade');
  }finally{globalThis.fetch=previousFetch;globalThis.window=previousWindow;}
});
