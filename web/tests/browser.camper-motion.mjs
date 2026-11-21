import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {CAMPER_PART_FILES} from '../lib/camp-camper-part-files.mjs';
import {camperMotionScene,motionPhases,motionSpec} from '../scripts/camper-motion-audit.mjs';
import {materialPreviewPlugin} from './lighting-preview-plugin.mjs';
import {headlessBrowser,until} from './browser-cdp.mjs';
import {browserFormats,motionFormats,verifyMotionProof} from './camper-scale-evidence.mjs';

export async function captureCamperMotion(browser,capture,candidate=null){
  const replacements=new Map(candidate?['field-camper-v2','field-camper-walk'].map(id=>[
    CAMPER_PART_FILES[id].url,candidate.buffers[candidate.files[id].url],
  ]):[]);
  const served=new Set();
  const atlasPlugin={
    name:'camper-motion-candidate',
    configureServer(server){
      server.middlewares.use((req,res,next)=>{
        const url=req.url?.split('?')[0],bytes=replacements.get(url);
        if(!bytes)return next();
        served.add(url);
        res.setHeader('Content-Type','image/webp');
        res.setHeader('Cache-Control','no-store');
        res.end(bytes);
      });
    },
  };
  const server=await createServer({
    configFile:false,root:fileURLToPath(new URL('../',import.meta.url)),envFile:false,
    cacheDir:'node_modules/.vite-camper-motion',server:{host:'127.0.0.1',port:0,hmr:false,watch:null},
    optimizeDeps:{noDiscovery:true,include:['pixi.js']},
    plugins:[atlasPlugin,materialPreviewPlugin('release')],
  });
  try{
    await server.listen();
    const origin='http://127.0.0.1:'+server.httpServer.address().port;
    const phases=motionPhases(),proof={};
    await browser.call('Page.navigate',{url:origin+'/__material-preview?art=release'});
    await until(()=>browser.evaluate('!!window.lightingReady'),'Camper motion material preview did not load');
    const shot=async(id,phase,light=null)=>{
      const scene=camperMotionScene(phases.get(phase),light?{mapId:'camp'}:undefined);
      proof[id]=await browser.evaluate(`lightingReview.showCamperMotion(${JSON.stringify(scene)},${JSON.stringify(light)})`);
      await capture(id);
    };
    for(const [format,width,height,deviceScaleFactor,mobile] of browserFormats){
      if(!motionFormats.includes(format))continue;
      await browser.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor,mobile});
      await browser.evaluate('lightingReview.renderer.resize()');
      for(const phase of motionSpec.sceneCases)await shot(format+'-motion-'+phase,phase);
      if(format==='desktop')for(const light of ['left','right','off'])
        await shot('desktop-motion-normal-'+light,'walk.step-3',light);
    }
    assert.equal(served.size,replacements.size,'Both candidate atlases must reach the motion preview');
    verifyMotionProof(proof);
    return proof;
  }finally{await server.close();}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const out=resolve('outputs/current-art/camper-motion-webgl');
  const browser=await headlessBrowser();
  try{
    mkdirSync(out,{recursive:true});
    const proof=await captureCamperMotion(browser,async id=>{
      const shot=await browser.call('Page.captureScreenshot',{format:'png'});
      writeFileSync(resolve(out,id+'.png'),Buffer.from(shot.data,'base64'));
    });
    assert.deepEqual(browser.errors,[]);
    writeFileSync(resolve(out,'proof.json'),JSON.stringify(proof,null,2)+'\n');
    console.log(Object.keys(proof).length+' camper WebGL motion and lighting captures');
  }finally{await browser.close();}
}
