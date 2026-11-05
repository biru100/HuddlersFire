// Contact sheets for visual review of every source frame at the production head scale.
import {createCanvas} from '@napi-rs/canvas';
import {writeFileSync} from 'node:fs';
import {spriteManifest as m,getSprite,characterSheet} from '../lib/camp-sprite-assets.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';
const states=Object.entries(m.character.states),image=getSprite(characterSheet(0));
for(let page=0;page<2;page++){
  const canvas=createCanvas(1000,1070),c=canvas.getContext('2d');c.fillStyle='#f8f0dc';c.fillRect(0,0,1000,1070);
  c.fillStyle='#594634';c.font='bold 21px sans-serif';c.fillText('ILLUSTRATED CAMP / '+(page+1)+' / ALL SOURCE FRAMES',28,40);
  states.slice(page*8,page*8+8).forEach(([name,state],row)=>{
    c.fillStyle='#594634';c.font='14px sans-serif';c.fillText(name+' · '+state.fps+'fps',28,100+row*120);
    state.frames.forEach((f,i)=>{const scale=23/f.head.radius,x=220+i*143,y=172+row*120;c.drawImage(image,f.x,f.y,f.w,f.h,x-f.feet.x*scale,y-f.feet.y*scale,f.w*scale,f.h*scale);c.font='10px sans-serif';c.fillText(String(i+1),x-3,y+17);});
  });
  writeFileSync(`outputs/sprite-frames-${page+1}.png`,canvas.toBuffer('image/png'));
}
const mix=createCanvas(1050,380),c=mix.getContext('2d');c.fillStyle='#f8f0dc';c.fillRect(0,0,1050,380);
for(const [i,[label,p,emote]]of [['carry + run',{moving:true,running:true,carrying:'b'},null],['carry + carried',{carriedBy:'a',carrying:'b'},null],['weapon + walk',{moving:true,weapon:'gun'},null],['wave + crouch',{crouching:true},'wave'],['clap + sit',{sitting:true},'clap'],['carry + jump',{motion:'airborne',vz:2,carrying:'b'},null]].entries()){
  const x=90+i*174;for(const [row,theme]of ['color','dark'].entries()){c.save();c.translate(x,155+row*170);c.scale(1.8,1.8);drawCharacter(c,p,{time:.25,reduced:false,emote,theme});c.restore();}c.fillStyle='#594634';c.font='12px sans-serif';c.textAlign='center';c.fillText(label,x,360);
}
writeFileSync('outputs/sprite-combined-poses.png',mix.toBuffer('image/png'));
