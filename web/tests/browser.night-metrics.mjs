import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import assert from 'node:assert/strict';
import {headlessBrowser,until} from './browser-cdp.mjs';
const origin=process.env.CAMP_TEST_URL||'http://127.0.0.1:5195';if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const baseline=process.env.CAMP_NIGHT_BASELINE,browser=await headlessBrowser(),rows=[];
try{
  for(const [view,width,height,dpr]of [['desktop',1050,824,1],['mobile-emulation',390,844,2]]){
    await browser.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:view!=='desktop'});await browser.call('Page.navigate',{url:origin+'/__material-preview?case=actions'});await until(()=>browser.evaluate('!!window.lightingReady'),'Metrics preview unavailable');await browser.call('Page.bringToFront');
    for(const mode of [...(baseline?['baseline-webgl']:[]),'night-webgl','night-canvas']){
      console.log('Measuring '+view+' '+mode);const result=await browser.evaluate(`(async()=>{
        const snapshot=structuredClone(lightingReview.scene);for(const p of snapshot.players)p.avatar=null;
        const {CampRenderer}=await import(${JSON.stringify(mode==='baseline-webgl'?baseline:'/lib/camp-renderer.mjs')}),canvas=document.createElement('canvas');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%';document.querySelector('.world').appendChild(canvas);
        const active=new CampRenderer(canvas,()=>snapshot);active.cancelFrame(active.frame);active.raf=()=>0;await active.ready;await active.backendReady;active.reduced=false;active.webgl.quality.sample=()=>2;
        if(${JSON.stringify(mode)}==='night-canvas')active.webgl.fail(new Error('Canvas timing fixture'));
        const gpu=${JSON.stringify(mode)}!=='night-canvas',gl=gpu?active.webgl.renderer.gl:null,ext=gl?.getExtension('EXT_disjoint_timer_query_webgl2'),debug=gl?.getExtension('WEBGL_debug_renderer_info'),driver=gl?gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL||gl.RENDERER):null;
        const cpu=[],intervals=[],queries=[],gpuTimes=[];let last;
        for(let i=0;i<480;i++){
          const stamp=await new Promise(requestAnimationFrame);if(i>=120&&last!==undefined)intervals.push(stamp-last);last=stamp;snapshot.now=5000+i*16;
          const query=ext&&i>=120?gl.createQuery():null;if(query)gl.beginQuery(ext.TIME_ELAPSED_EXT,query);const start=performance.now();active.draw(stamp);if(i>=120)cpu.push(performance.now()-start);if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);queries.push(query);}
        }
        if(ext){for(let wait=0;wait<60&&queries.length;wait++){await new Promise(requestAnimationFrame);for(let i=queries.length-1;i>=0;i--){const q=queries[i];if(gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)){if(!gl.getParameter(ext.GPU_DISJOINT_EXT))gpuTimes.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);queries.splice(i,1);}}}for(const q of queries)gl.deleteQuery(q);}
        const stats=a=>{a.sort((a,b)=>a-b);return {count:a.length,median:a[Math.floor(a.length*.5)]??null,p95:a[Math.floor(a.length*.95)]??null,max:a.at(-1)??null};};
        const row={cpu:stats(cpu),rafInterval:stats(intervals),webglGpu:stats(gpuTimes),driver,textureBytes:active.webgl.metrics.textureBytes,canvasTintBytes:active.ctx.recording?.lightingCacheBytes||0};active.destroy();canvas.remove();return row;
      })()`);rows.push({view,width,height,dpr,mode,...result});console.log(JSON.stringify(rows.at(-1)));
    }
  }
  const output=process.env.CAMP_METRICS_OUTPUT||'outputs/night-v1/browser-metrics.json';
  assert.deepEqual(browser.errors,[]);mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify({kind:'Disposable headless Chrome. Same 16-player action scene, 120 warm-up and 360 sampled frames. Mobile viewport emulation is not a physical phone.',baseline:baseline||null,rows},null,2)+'\n');
}finally{await browser.close();}
