import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {headlessBrowser,until} from './browser-cdp.mjs';
const origin=process.env.CAMP_TEST_URL||'http://127.0.0.1:5193';if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const browser=await headlessBrowser(),rows=[];
try{
  for(const [name,width,height,dpr]of [['desktop',1050,824,1],['mobile-emulation',390,844,2]]){
    await browser.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:name!=='desktop'});await browser.call('Page.navigate',{url:origin+'/__material-preview?case=actions'});await until(()=>browser.evaluate('!!window.lightingReady'),'Metrics fixture unavailable');
    await browser.evaluate(`(()=>{const {renderer,scene}=lightingReview;renderer.reduced=false;for(const p of scene.players)p.avatar=null;renderer.webgl.quality.sample=()=>2;window.measureLighting=async(mode)=>{
      let active=renderer,base=null,activeScene=scene;const gpu=renderer.webgl;
      if(mode==='canvas-v2'){
        const {CampRenderer}=await import('/outputs/lighting-baseline/lib/camp-renderer.mjs');base=document.createElement('canvas');base.style.cssText='position:absolute;inset:0;width:100%;height:100%';renderer.canvas.parentNode.appendChild(base);const snapshot=structuredClone(scene);activeScene=snapshot;active=new CampRenderer(base,()=>snapshot);active.cancelFrame(active.frame);active.raf=()=>0;await active.ready;active.reduced=false;
      }else {gpu.options.normals=mode!=='webgl-unlit';gpu.options.lights=mode==='webgl-full';}
      const gl=mode.startsWith('webgl')?gpu.renderer.gl:null,ext=gl?.getExtension('EXT_disjoint_timer_query_webgl2'),debug=gl?.getExtension('WEBGL_debug_renderer_info'),driver=gl?gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL||gl.RENDERER):null;
      const cpu=[],intervals=[],queries=[],gpuMs=[];let last;
      for(let i=0;i<480;i++){
        const stamp=await new Promise(requestAnimationFrame);if(i>=120&&last!==undefined)intervals.push(stamp-last);last=stamp;activeScene.now=5000+i*16;
        const query=ext&&i>=120?gl.createQuery():null;if(query)gl.beginQuery(ext.TIME_ELAPSED_EXT,query);const start=performance.now();active.draw(stamp);const elapsed=performance.now()-start;if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);queries.push(query);}if(i>=120)cpu.push(elapsed);
      }
      if(ext){for(let wait=0;wait<60&&queries.length;wait++){await new Promise(requestAnimationFrame);for(let i=queries.length-1;i>=0;i--){const q=queries[i];if(gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)){if(!gl.getParameter(ext.GPU_DISJOINT_EXT))gpuMs.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);queries.splice(i,1);}}}for(const q of queries)gl.deleteQuery(q);}
      const stats=a=>{a.sort((a,b)=>a-b);return {count:a.length,median:a[Math.floor(a.length*.5)]??null,p95:a[Math.floor(a.length*.95)]??null,max:a.at(-1)??null};};
      const result={mode,cpu:stats(cpu),rafInterval:stats(intervals),webglGpu:stats(gpuMs),driver,normalDraws:gpu.metrics.normalDraws,textureBytes:gpu.metrics.textureBytes,draws:gpu.metrics.draws};if(base){active.destroy();base.remove();}return result;
    };})()`);
    for(const mode of ['webgl-unlit','webgl-full','canvas-v2']){const result=await browser.evaluate(`measureLighting('${mode}')`);rows.push({name,width,height,dpr,...result});console.log(JSON.stringify(rows.at(-1)));}
  }
  assert.deepEqual(browser.errors,[]);mkdirSync('outputs/lighting',{recursive:true});writeFileSync(resolve('outputs/lighting/browser-metrics.json'),JSON.stringify({kind:'Disposable headless Chrome; CPU submission, rAF intervals and WebGL-only GPU timers. Mobile viewport emulation is not a physical phone.',rows},null,2));
}finally{await browser.close();}
