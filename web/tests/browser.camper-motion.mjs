import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {CAMPER_PART_FILES} from '../lib/camp-camper-part-files.mjs';
import {camperMotionReviewPhases,camperMotionScene,motionPhases} from '../scripts/camper-motion-audit.mjs';
import {readCamperCandidate} from '../scripts/camper-review-assets.mjs';
import {materialPreviewPlugin} from './lighting-preview-plugin.mjs';
import {headlessBrowser,until} from './browser-cdp.mjs';
import {browserFormats,motionFormats,verifyMotionProof} from './camper-scale-evidence.mjs';

const mixedKeys={
  'emote.seated-wave':'sit.hold/emote.wave/',
  'emote.walking-wave':'walk.step-3/emote.wave/',
  'run.armed':'run.step-3/weapon.gun-aim/',
};

export async function captureCamperMotion(browser,capture,candidate=null){
  const replacements=new Map(candidate?.motion?Object.entries(candidate.buffers):candidate?['field-camper-v2','field-camper-walk'].map(id=>[
    CAMPER_PART_FILES[id].url,candidate.buffers[candidate.files[id].url],
  ]):[]);
  const served=new Set();
  const atlasPlugin={
    name:'camper-motion-candidate',
    configureServer(server){
      server.middlewares.use((req,res,next)=>{
        const url=req.url?.split('?')[0],bytes=replacements.get(url);
        if(candidate?.motion&&url==='/__camper-candidate/manifest'){
          res.setHeader('Content-Type','application/json');
          const files=Object.fromEntries(Object.keys(candidate.manifest.files).map(id=>[id,candidate.files[id]]));
          res.end(JSON.stringify({files,motion:candidate.motion}));
          return;
        }
        if(!bytes)return next();
        served.add(url);
        res.setHeader('Content-Type',url.endsWith('.png')?'image/png':'image/webp');
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
    const proof={};
    await browser.call('Page.navigate',{url:origin+'/__material-preview?art=release'+(candidate?.motion?'&camperCandidate':'')});
    await until(()=>browser.evaluate('!!window.lightingReady'),'Camper motion material preview did not load');
    const shot=async(id,phase,light=null)=>{
      const scene=camperMotionScene(phase,light?{mapId:'camp'}:undefined);
      proof[id]=await browser.evaluate(`lightingReview.showCamperMotion(${JSON.stringify(scene)},${JSON.stringify(light)})`);
      if(mixedKeys[phase.id])assert.ok(proof[id].artFrame?.startsWith(mixedKeys[phase.id]),
        'Mixed camper screenshot drew a different pose: '+id+' '+proof[id].artFrame);
      if(candidate?.motion)assert.ok(proof[id].parts.every(part=>part.normalKind==='authored'),
        'Candidate draw fell back to the legacy normal: '+id);
      await capture(id);
    };
    for(const [format,width,height,deviceScaleFactor,mobile] of browserFormats){
      if(!motionFormats.includes(format))continue;
      await browser.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor,mobile});
      await browser.evaluate('lightingReview.renderer.resize()');
      for(const phase of camperMotionReviewPhases())await shot(format+'-motion-'+phase.id,phase);
      if(format==='desktop')for(const light of ['left','right','off'])
        await shot('desktop-motion-normal-'+light,motionPhases().get('walk.step-3'),light);
    }
    assert.equal(served.size,replacements.size,'Every candidate atlas must reach the motion preview');
    verifyMotionProof(proof);
    return proof;
  }finally{await server.close();}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const job=process.argv[2],candidate=job?readCamperCandidate(job):null;
  const out=resolve(job?'outputs/camper-harness/'+job+'/motion-webgl':'outputs/current-art/camper-motion-webgl');
  const browser=await headlessBrowser();
  try{
    mkdirSync(out,{recursive:true});
    const proof=await captureCamperMotion(browser,async id=>{
      const shot=await browser.call('Page.captureScreenshot',{format:'png'});
      writeFileSync(resolve(out,id+'.png'),Buffer.from(shot.data,'base64'));
    },candidate);
    assert.deepEqual(browser.errors,[]);
    writeFileSync(resolve(out,'proof.json'),JSON.stringify(proof,null,2)+'\n');
    console.log(Object.keys(proof).length+' camper WebGL motion and lighting captures');
  }finally{await browser.close();}
}
