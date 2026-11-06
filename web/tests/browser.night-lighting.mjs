import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {headlessBrowser,until} from './browser-cdp.mjs';
const origin=process.env.CAMP_TEST_URL||'http://127.0.0.1:5195';if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const browser=await headlessBrowser();
try{
  await browser.call('Page.navigate',{url:origin+'/__material-preview'});await until(()=>browser.evaluate('!!window.lightingReady'),'Night preview unavailable');
  const pixels=await browser.evaluate(`(()=>{
    const {renderer}=lightingReview,gpu=renderer.webgl,image=document.createElement('canvas');image.width=image.height=16;const c=image.getContext('2d');c.fillStyle='#c0c0c0';c.fillRect(0,0,16,16);
    const light={x:2,y:0,height:1,radius:8,color:[1,.57,.2],intensity:1,screen:[0,0,40],screenRadius:320};
    const sample=({role='lit',lights=[],scale=1,x=128,y=128,alpha=1,normals=true}={})=>{gpu.options.normals=normals;const material={lighting:role,strength:0},camera={x,y,scale};
      gpu.render([{type:'image',image,source:[0,0,16,16],dest:[-8,-8,16,16],matrix:{a:scale,b:0,c:0,d:scale,e:x,f:y},alpha,clips:[],material,object:{type:'player',x:0,y:0,z:0}}],{width:256,height:256,dpr:1,lights,lighting:renderer.sceneLighting,camera});
      const gl=gpu.renderer.gl,pixel=new Uint8Array(4);gl.readPixels(Math.floor(x),255-Math.floor(y),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);return [...pixel];};
    const result={ambient:sample(),near:sample({lights:[light]}),far:sample({lights:[{...light,x:20}]}),noNormals:sample({lights:[light],normals:false}),zoom:sample({lights:[light],scale:2,x:80,y:90}),emissive:sample({role:'emissive'}),protected:sample({role:'protected'}),transparent:sample({alpha:0})};gpu.options.normals=true;renderer.draw(5000);return result;
  })()`);
  assert.ok(pixels.ambient[0]<60&&pixels.ambient[3]===255);assert.ok(pixels.near[0]>pixels.far[0]);assert.deepEqual(pixels.far,pixels.ambient);assert.deepEqual(pixels.noNormals,pixels.near);
  for(let i=0;i<3;i++)assert.ok(Math.abs(pixels.zoom[i]-pixels.near[i])<=2,'Zoom must not change world light energy');
  assert.deepEqual(pixels.emissive,[192,192,192,255]);assert.deepEqual(pixels.protected,[192,192,192,255]);assert.deepEqual(pixels.transparent,[0,0,0,0]);
  // Optional pre-change checkout for a like-for-like renderer comparison.
  const baselineUrl=process.env.CAMP_NIGHT_BASELINE;
  const maps=baselineUrl?await browser.evaluate(`(async()=>{
    const {CampRenderer}=await import(${JSON.stringify(baselineUrl)}),results=[];
    for(const mapId of ['playground','showroom'])for(const theme of ['color','dark']){
      await lightingReview.set({mapId,theme,case:'actions'});for(const p of lightingReview.scene.players)p.avatar=null;
      // Match fresh mask caches: the old cache omitted theme from its key.
      lightingReview.renderer.groundShadows.destroy();lightingReview.renderer.draw(5000);
      const canvas=document.createElement('canvas');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%';document.querySelector('.world').appendChild(canvas);
      const baseline=new CampRenderer(canvas,()=>lightingReview.scene);baseline.cancelFrame(baseline.frame);baseline.raf=()=>0;await baseline.ready;await baseline.backendReady;baseline.reduced=true;baseline.draw(5000);
      const read=r=>{const gl=r.webgl.renderer.gl,bytes=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);r.draw(5000);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,bytes);return bytes;};
      const a=read(lightingReview.renderer),b=read(baseline);let changed=0,maxDelta=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){changed++;maxDelta=Math.max(maxDelta,Math.abs(a[i]-b[i]));}results.push({mapId,theme,changed,maxDelta,channels:a.length});baseline.destroy();canvas.remove();
    }return results;
  })()`):[];
  // A one-byte channel difference is allowed for GPU shader quantization.
  for(const row of maps)assert.ok(row.maxDelta<=1,row.mapId+'/'+row.theme+' changed outside camp: '+row.maxDelta);
  assert.deepEqual(browser.errors,[]);mkdirSync('outputs/night-v1',{recursive:true});writeFileSync('outputs/night-v1/gpu-contract.json',JSON.stringify({pixels,maps},null,2)+'\n');console.log(JSON.stringify({pixels,maps}));
}finally{await browser.close();}
