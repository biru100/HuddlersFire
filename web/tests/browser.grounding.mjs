import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {headlessBrowser,until} from './browser-cdp.mjs';
import {spriteManifest} from '../lib/camp-sprite-assets.mjs';
import {hash} from '../../tools/lib/sprite-spec.mjs';
import {actionCases,reviewSizes} from './current-art-scenes.mjs';

const origin=process.env.CAMP_TEST_URL||'http://127.0.0.1:5193';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const out=process.env.CAMP_ART_CAPTURE_DIR||'outputs/grounding-scenes';
const cases=[];
mkdirSync(out,{recursive:true});
const browser=await headlessBrowser();
try{
  for(const [format,[width,height]] of Object.entries(reviewSizes)){
    await browser.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:format==='mobile'});
    await browser.call('Page.navigate',{url:origin+'/__material-preview?art=release'});
    await until(()=>browser.evaluate('!!window.lightingReady'),'Material preview unavailable');
    assert.equal(hash(await browser.evaluate('lightingReview.assets.manifest')),hash(spriteManifest),'preview must use the complete shipped manifest');
    await browser.evaluate(`(async()=>{
      const {renderer:r,scene,assets}=lightingReview;
      const {getMap,CAMP_SEATS}=await import('/lib/camp-maps.mjs');
      const {takeSeat,leaveSeat}=await import('/lib/camp-seats.mjs');
      const {spawnPlayer,simulateWorld}=await import('/lib/camp-world.mjs');
      const {gameById,exhibitCover}=await import('/lib/camp-games.mjs');
      const {captureState}=await import('/tests/current-art-scenes.mjs');
      if(!assets.getSprite('field-camper-v2'))throw Error('Release camper missing');
      window.groundingScene=async(name)=>{
        const mapId=name.startsWith('seat')?'camp':name.startsWith('booth')?'showroom':'playground';
        const map=getMap(mapId);
        const hero={...spawnPlayer(0,mapId),id:'self',name:'Myo',connected:true,color:'green'};
        const guest={...hero,id:'guest',name:'Sol',hairStyle:1,topStyle:1};
        const players=new Map([[hero.id,hero],[guest.id,guest]]);
        Object.assign(scene,{players:[hero,guest],self:hero.id,mapId,zoom:1,followSelf:true,cameraMode:'follow',now:5000});
        if(name.startsWith('seat')){
          const seats=CAMP_SEATS.filter(s=>s.bench===(name==='seat-ne'?'log-0':'log-7'));
          for(const [i,p] of scene.players.entries()){
            Object.assign(p,{x:seats[i].x,y:seats[i].y});
            const error=takeSeat(players,p,seats[i].id);if(error)throw Error(error);
          }
          if(name==='seat-exit'){leaveSeat(hero);hero.sitting=false;}
        }else if(name.startsWith('spring')){
          const spring=map.trampolines[0];
          Object.assign(hero,{x:spring.x,y:spring.y});Object.assign(guest,{x:spring.x+1.5,y:spring.y});
          const inputs=new Map();
          simulateWorld(players,inputs,1/60,5000);
          if(hero.motion!=='airborne'||hero.vz<=0)throw Error('Spring did not launch');
          if(name==='spring-air')for(let i=1;i<28;i++)simulateWorld(players,inputs,1/60,5000+i*16);
          if(name==='spring-landing'){
            let descending=false,bounced=false;
            for(let i=1;i<130;i++){simulateWorld(players,inputs,1/60,5000+i*16);if(hero.vz<0)descending=true;
              if(descending&&hero.vz>0){bounced=true;break;}}
            if(!bounced)throw Error('Spring did not land and rebound');
          }
        }else{
          const booth=name.startsWith('booth');
          const prop=booth?map.booths[0]:map.scenery.find(o=>o.type==='shade');
          const offset=name.endsWith('front')?1.35:name.endsWith('back')?-1.35:0;
          Object.assign(hero,{x:prop.x+.65+offset,y:prop.y-.65+offset});
          Object.assign(guest,{x:prop.x-1,y:prop.y+2});
        }
        r.draw(5000);await r.ready;
        if(map.booths.length)await Promise.all(map.booths.map(async b=>{
          const url=exhibitCover(gameById(b.gameId));r.exhibitImage(url);
          await r.exhibitImages.get(url).image.decode();
        }));
        r.draw(5000);
        if(hero.seatId){const s=r.seatAreas.find(s=>s.id===hero.seatId);if(r.pickSeat(s.x,s.y)!==hero.seatId)throw Error('Seat hit target moved');}
        return {mode:r.canvas.dataset.campRenderer,normals:r.webgl.metrics.normalDraws,z:hero.z,
          capture:captureState(r,scene,r.canvas.dataset.campRenderer)};
      };
    })()`);
    for(const backend of ['webgl','canvas']){
      if(backend==='canvas')await browser.evaluate("lightingReview.renderer.webgl.fail(new Error('grounding fallback test'))");
      for(const name of actionCases){
        const state=await browser.evaluate('groundingScene('+JSON.stringify(name)+')');
        assert.equal(state.mode,backend);
        if(backend==='webgl')assert.ok(state.normals>0);
        if(name==='spring-air')assert.ok(state.z>1);
        if(name==='spring-landing')assert.ok(state.z<.05);
        const shot=await browser.call('Page.captureScreenshot',{format:'png'});
        const id=format+'-'+backend+'-'+name;
        writeFileSync(out+'/'+id+'.png',Buffer.from(shot.data,'base64'));
        cases.push({id,...state.capture});
      }
      console.log(format,backend,actionCases.length+' release scenes');
    }
  }
  assert.deepEqual(browser.errors,[]);
  if(process.env.CAMP_ART_CAPTURE_DIR)writeFileSync(out+'/actions.json',JSON.stringify(cases));
}finally{await browser.close();}
