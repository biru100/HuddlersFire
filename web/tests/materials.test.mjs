import test from 'node:test';
import assert from 'node:assert/strict';
import {normalFrame,validateMaterialSpec} from '../../tools/lib/material-assets.mjs';
import {validateNormalPair} from '../lib/camp-materials.mjs';
test('normal generation uses silhouette and authored shape, independent of painted colour and highlight',()=>{
  const w=32,h=32,a=new Uint8ClampedArray(w*h*4),b=new Uint8ClampedArray(a.length);for(let i=0;i<w*h;i++){const x=i%w,y=Math.floor(i/w);a.set([250,240,200,x>3&&x<28&&y>3&&y<28?255:0],i*4);b.set([20,80,35,a[i*4+3]],i*4);}
  const recipe={form:'round',bevel:5},one=normalFrame(a,w,h,recipe),two=normalFrame(b,w,h,recipe);assert.deepEqual(one,two);
  for(let i=0;i<w*h;i++)if(one[i*4+3]){const v=Array.from(one.slice(i*4,i*4+3),n=>n/255*2-1);assert.ok(Math.abs(Math.hypot(...v)-1)<.015);}
});
test('portrait and clear pixels cannot acquire normal lighting and mismatched atlas sizes are rejected',()=>{
  const image=new Uint8ClampedArray(16*16*4).fill(255),normal=normalFrame(image,16,16,{form:'character',bevel:3},{x:8,y:5,radius:3});assert.equal(normal[(5*16+8)*4+3],0);assert.equal(normal[(12*16+8)*4+3],255);
  assert.ok(validateNormalPair({width:16,height:16},{width:16,height:16}));assert.equal(validateNormalPair({width:16,height:16},{width:32,height:16}),false);
  assert.throws(()=>normalFrame(image,8,8,{bevel:3}),/dimensions/);assert.throws(()=>validateMaterialSpec({version:2}),/specification/);
});
