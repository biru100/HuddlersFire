import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Miniflare} from 'miniflare';
import {createAvatarProxy,avatarTextureUrl} from '../lib/camp-avatar-proxy.mjs';
import {handleCampRequest} from '../lib/camp-api.mjs';
const png=Uint8Array.from([137,80,78,71,13,10,26,10,...new Array(32).fill(0)]),request=new Request('https://camp.test/api/camp/avatar/1/abc.png');
test('avatar texture URL keeps the shared CDN identity and proxy only fetches its fixed origin',async()=>{
  assert.equal(avatarTextureUrl('https://cdn.discordapp.com/avatars/1/abc.png?size=64'),'/api/camp/avatar/1/abc.png');assert.equal(avatarTextureUrl('https://evil.test/a.png'),null);let calls=0;
  const proxy=createAvatarProxy({fetch:async(url,init)=>{calls++;assert.equal(url,'https://cdn.discordapp.com/avatars/1/abc.png?size=64');assert.equal(init.redirect,'manual');return new Response(png);}});
  const [a,b]=await Promise.all([proxy('avatar/1/abc.png',request),proxy('avatar/1/abc.png',request)]);assert.equal(calls,1);assert.equal(a.status,200);assert.deepEqual(new Uint8Array(await b.arrayBuffer()),png);assert.equal((await proxy('avatar/1/abc.png',request)).status,200);assert.equal(calls,1);
  assert.equal((await proxy('avatar/https://evil.test/a',request)).status,400);assert.equal(calls,1);
});
test('avatar proxy rejects redirects, non-images, oversized streams and write methods',async()=>{
  const html=createAvatarProxy({fetch:async()=>new Response('<html>not an image</html>')});assert.equal((await html('avatar/1/abc.png',request)).status,415);
  const large=createAvatarProxy({maxBytes:32,fetch:async()=>new Response(png)});assert.equal((await large('avatar/1/abc.png',request)).status,413);
  const broken=createAvatarProxy({fetch:async()=>{throw Error('redirect');}});assert.equal((await broken('avatar/1/abc.png',request)).status,502);
  const redirect=createAvatarProxy({fetch:async()=>Response.redirect('https://evil.test/image.png')});assert.equal((await redirect('avatar/1/abc.png',request)).status,404);
  assert.equal((await html('avatar/1/abc.png',new Request(request,{method:'POST'}))).status,405);
});
test('public immutable avatar image reads remain independent of lobby database availability',async()=>{const response=await handleCampRequest(request,{}, {fetch:async()=>new Response(png)});assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');});

test('avatar proxy loads PNGs and refuses redirects in the production Worker runtime',async()=>{
  const source=readFileSync(new URL('../lib/camp-avatar-proxy.mjs',import.meta.url),'utf8');
  const mf=new Miniflare({workers:[
    {name:'avatar',modules:true,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],outboundService:'cdn',script:source+`\nconst proxy=createAvatarProxy();export default {fetch(request){return proxy(new URL(request.url).pathname.slice(1),request);}};`},
    {name:'cdn',modules:true,compatibilityDate:'2026-05-15',script:`export default {fetch(request){const url=new URL(request.url);if(url.hostname!=='cdn.discordapp.com')return new Response(null,{status:400});if(url.pathname.endsWith('/def.png'))return Response.redirect('https://cdn.discordapp.com/avatars/1/abc.png?size=64');return new Response(Uint8Array.from(${JSON.stringify([...png])}),{headers:{'Content-Type':'image/png'}});}};`}
  ]});
  try{
    const response=await mf.dispatchFetch('http://localhost/avatar/1/abc.png');
    assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()),png);
    assert.equal((await mf.dispatchFetch('http://localhost/avatar/1/def.png')).status,404);
  }finally{await mf.dispose();}
});
