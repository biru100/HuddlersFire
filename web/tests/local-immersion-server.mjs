// Loopback-only QA harness. Real application API + SQLite, mocked external Discord provider.
// No authentication bypass is compiled into the application or its Worker.
import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { fixture } from './api-fixture.mjs';
import { handleCampRequest } from '../lib/camp-api.mjs';
const port=Number(process.env.CAMP_QA_PORT||5192),origin='http://127.0.0.1:'+port;
const upstream=process.env.CAMP_QA_UPSTREAM||'http://127.0.0.1:5191',f=fixture();
const env={DB:f.DB,DISCORD_CLIENT_ID:'qa-local-client',DISCORD_CLIENT_SECRET:'qa-local-secret'};
const external=async(url,init)=>{
  if(url==='https://discord.com/api/oauth2/token')return Response.json({access_token:'qa-'+new URLSearchParams(init.body).get('code')});
  if(url==='https://discord.com/api/users/@me')return Response.json({id:BigInt('0x'+createHash('sha256').update(init.headers.Authorization).digest('hex').slice(0,16)).toString(),avatar:null});
  throw Error('Unexpected external request');
};
const application=req=>handleCampRequest(req,env,{fetch:external});
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,origin),body=[];for await(const chunk of req)body.push(chunk);
    const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
    let response;
    if(url.pathname==='/__test/discord-connect'){
      if(req.method!=='POST'||headers.get('origin')!==origin){res.writeHead(403);res.end();return;}
      const start=await application(new Request(origin+'/api/camp/discord/start',{headers}));
      const state=new URL(start.headers.get('location')).searchParams.get('state');
      const linked=await application(new Request(origin+'/api/camp/discord/callback?state='+encodeURIComponent(state)+'&code='+randomUUID(),{headers}));
      if(!linked.headers.get('location')?.endsWith('discord-linked'))throw Error('Mock OAuth callback did not link');
      response=Response.json({linked:true});
    }else if(url.pathname.startsWith('/api/camp/')){
      response=await application(new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(body)}:{})}));
    }else{
      response=await fetch(upstream+url.pathname+url.search,{headers:{Accept:headers.get('accept')||'*/*'},redirect:'manual'});
    }
    const out=Object.fromEntries(response.headers);delete out['content-encoding'];delete out['content-length'];
    res.writeHead(response.status,out);res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){console.error(error.message);res.writeHead(500,{'Content-Type':'text/plain'});res.end('Local QA harness error');}
});
server.listen(port,'127.0.0.1',()=>console.log('QA API/Discord fixture ready on '+origin));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{f.sqlite.close();process.exit(0);}));
