import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { monochrome, portalMark, toneIndex, characterColor, CHARACTER_COLORS } from '../lib/camp-appearance.mjs';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { spawnPlayer, COLORS } from '../lib/camp-world.mjs';
import { emptyFire, FIRE_STYLES } from '../lib/camp-fire.mjs';

test('legacy profile colors become neutral without dropping alpha; portals have distinct non-color cues',()=>{
  assert.equal(monochrome('#e5a76d'),'#b0b0b0');
  assert.equal(monochrome('#12ab34cc').slice(-2),'cc');
  assert.equal(monochrome('#fff4'),'#ffffff44');
  assert.equal(monochrome('invalid'),'#b8b8b8');
  assert.equal(new Set(['camp','playground','showroom'].map(portalMark)).size,3);
  assert.deepEqual(COLORS.map(toneIndex),[0,1,2,3,4,5]);
});

test('live theme switching covers every map/fire style without mutating profiles',()=>{
  const names=['window','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'];
  const saved=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
  globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  const fires={color:new Set(),dark:new Set()};
  try{
    for(const mapId of ['camp','playground','showroom'])for(const style of FIRE_STYLES){
      const canvas=createCanvas(640,480);canvas.getBoundingClientRect=()=>({width:640,height:480});
      const p={...spawnPlayer(0,mapId),id:'self',color:'#89b6a5',name:'친구',connected:true};
      const original=structuredClone(p);
      let theme='color';
      const renderer=new CampRenderer(canvas,()=>({theme,players:[p],self:p.id,now:1000,fire:{...emptyFire(),xp:12,style:style.id}}));
      try{
        for(theme of ['color','dark','color']) {
        renderer.draw(1000);
        const pixels=canvas.getContext('2d').getImageData(0,0,640,480).data;
        if(theme==='dark')for(let i=0;i<pixels.length;i+=4)assert.ok(Math.abs(pixels[i]-pixels[i+1])<=1&&Math.abs(pixels[i+1]-pixels[i+2])<=1,`${mapId}/${style.id}: chromatic pixel at ${i/4}`);
        if(theme==='color')assert.ok(pixels.some((v,i)=>i%4===0&&Math.abs(v-pixels[i+1])>20),'Color mode needs chromatic artwork');
        assert.deepEqual(p,original,'Appearance never rewrites shared player data');
        if(mapId==='camp')fires[theme].add(canvas.toBuffer('image/png').toString('base64'));
        }
      }finally{renderer.destroy();}
    }
    for(const theme of ['color','dark'])assert.equal(fires[theme].size,5,'All fire shapes remain distinct in '+theme);
  }finally{for(const name of names){if(saved[name]===undefined)delete globalThis[name];else globalThis[name]=saved[name];}}
});

test('character slots remain consistent across the lobby, field and dark mode',()=>{
  assert.deepEqual(COLORS.map(c=>characterColor(c,'color')),CHARACTER_COLORS);
  assert.deepEqual(COLORS.map(c=>characterColor(c,'dark')),COLORS);
  assert.equal(characterColor('#89b6a5','color'),'#89b6a5');
});
