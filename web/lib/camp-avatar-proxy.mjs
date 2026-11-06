const IMAGE_ROUTE=/^avatar\/(\d{1,24})\/((?:a_)?[a-f0-9]{1,128})\.png$/;
const CDN_AVATAR=/^https:\/\/cdn\.discordapp\.com\/avatars\/(\d{1,24})\/((?:a_)?[a-f0-9]{1,128})\.png(?:\?size=\d+)?$/;
export function avatarTextureUrl(value){const match=typeof value==='string'&&CDN_AVATAR.exec(value);return match?`/api/camp/avatar/${match[1]}/${match[2]}.png`:null;}
export function createAvatarProxy({fetch:fetchImage=globalThis.fetch,now=Date.now,limit=64,maxBytes=131072}={}){
  const cache=new Map(),pending=new Map();
  return async function avatarResponse(route,request){
    const match=IMAGE_ROUTE.exec(route);if(!match)return new Response('Invalid avatar',{status:400});
    if(request.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET'}});
    const key=route,cached=cache.get(key);if(cached&&cached.until>now())return cached.response.clone();
    if(pending.has(key))return (await pending.get(key)).clone();
    const task=(async()=>{
      try{
        // Workers supports manual/follow only; !ok below also rejects redirects.
        const response=await fetchImage(`https://cdn.discordapp.com/avatars/${match[1]}/${match[2]}.png?size=64`,{redirect:'manual',signal:AbortSignal.timeout(5000)});
        if(!response.ok)return new Response(null,{status:404});
        if(Number(response.headers.get('content-length'))>maxBytes)return new Response(null,{status:413});
        const reader=response.body?.getReader();if(!reader)return new Response(null,{status:502});
        const parts=[];let bytes=0;
        while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>maxBytes){await reader.cancel();return new Response(null,{status:413});}parts.push(value);}
        const body=new Uint8Array(bytes);let at=0;for(const part of parts){body.set(part,at);at+=part.length;}
        if(body.length<24||body.slice(0,8).some((v,i)=>v!==[137,80,78,71,13,10,26,10][i]))return new Response(null,{status:415});
        const image=new Response(body,{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
        if(cache.size>=limit)cache.delete(cache.keys().next().value);cache.set(key,{until:now()+86400000,response:image.clone()});return image;
      }catch{return new Response(null,{status:502});}
    })();pending.set(key,task);try{return (await task).clone();}finally{pending.delete(key);}
  };
}
