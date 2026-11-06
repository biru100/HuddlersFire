import {createSpriteSurface} from './camp-sprite-assets.mjs';
import {getMap} from './camp-maps.mjs';
export function paintGroundSurface(surface,{base,sand,mapId,edge,dark=false,normal=false}){
  const c=surface.getContext('2d'),map=getMap(mapId);c.scale(surface.width/2100,surface.height/1200);c.translate(1050,580);
  c.save();c.translate(0,9);c.transform(1,.5,-1,.5,0,0);c.beginPath();c.roundRect(-edge*40,-edge*40,edge*80,edge*80,80);c.fillStyle=normal?'#80b4f0':dark?'#252525':'#686447';c.fill();c.restore();
  c.save();c.transform(1,.5,-1,.5,0,0);c.beginPath();c.roundRect(-edge*40,-edge*40,edge*80,edge*80,80);c.clip();c.fillStyle=c.createPattern(base,'repeat');c.fillRect(-edge*40,-edge*40,edge*80,edge*80);
  const area=map.clearing;
  const rim=t=>1+Math.sin(t*3+.4)*.045+Math.sin(t*7+1.7)*.022+Math.cos(t*11)*.012;
  const clearing=(grow=0)=>{c.beginPath();for(let i=0;i<=100;i++){const t=i/100*Math.PI*2,r=rim(t),x=area.x*40+Math.cos(t)*(area.rx*40+grow)*r,y=area.y*40+Math.sin(t)*(area.ry*40+grow)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();};
  if(area&&sand){c.fillStyle=c.createPattern(sand,'repeat');for(const [grow,alpha]of [[15,.12],[9,.23],[4,.4],[0,1]]){c.globalAlpha=alpha;clearing(grow);c.fill();}c.globalAlpha=1;}
  for(const route of map.routes||[]){
   const points=route.points.map(([x,y])=>[x*40,y*40]);const path=()=>{c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++){if(i<points.length-1)c.quadraticCurveTo(...points[i],(points[i][0]+points[i+1][0])/2,(points[i][1]+points[i+1][1])/2);else c.lineTo(...points[i]);}};
   c.lineCap='round';c.lineJoin='round';c.strokeStyle=mapId==='showroom'?(normal?'#80cce6':dark?'#696969':'#d3cfb4'):c.createPattern(sand,'repeat');
   for(const [extra,alpha]of [[10,.16],[4,.38],[0,1]]){path();c.globalAlpha=alpha;c.lineWidth=route.width+extra;c.stroke();}c.globalAlpha=1;
   if(!normal){path();c.lineWidth=route.width*.22;c.globalAlpha=.16;c.strokeStyle=dark?'#353535':'#9a895b';c.stroke();c.globalAlpha=1;}
  }
  if(!normal&&area&&sand){c.lineWidth=1.4;c.strokeStyle=dark?'#3f3f3f':'#7e8c48';for(let i=0;i<145;i++){const t=i*2.399963,r=rim(t),x=area.x*40+Math.cos(t)*(area.rx*40*r+6+Math.sin(i*7)*8),y=area.y*40+Math.sin(t)*(area.ry*40*r+6+Math.cos(i*3)*8);c.globalAlpha=.15+(i%3)*.09;c.beginPath();c.moveTo(x-2,y+3);c.lineTo(x,y-3-i%4);c.lineTo(x+2,y+2);c.stroke();}c.globalAlpha=1;}
  c.beginPath();c.roundRect(-edge*40,-edge*40,edge*80,edge*80,80);c.lineWidth=14;c.strokeStyle=normal?'#80b4f0':dark?'#30303055':'#657b3555';c.stroke();
  c.restore();
}
// Cached light sprites are shared by Canvas fallback and the WebGL draw list.
export class GroundLightSprites{
  constructor(ctx){this.ctx=ctx;this.cache=new Map();}
  texture(color){const key=color.join(',');if(this.cache.has(key))return this.cache.get(key);const image=createSpriteSurface(this.ctx,128,128),c=image.getContext('2d'),rgb=color.map(v=>Math.round(v*255)).join(','),g=c.createRadialGradient(64,64,0,64,64,63);g.addColorStop(0,`rgba(${rgb},.78)`);g.addColorStop(.45,`rgba(${rgb},.29)`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(0,0,128,128);this.cache.set(key,image);return image;}
  draw(ctx,lights,profile){this.lastLights=lights;for(const light of lights){const radius=light.radius*40,x=(light.x-light.y)*40,y=(light.x+light.y)*20;ctx.save();ctx.setMaterial?.({lighting:'emissive'});ctx.globalAlpha*=profile?.night?light.intensity*(ctx.recording?.active ? .08 : .55):Math.min(.24,light.intensity*.2);ctx.drawImage(this.texture(light.color),x-radius,y-radius*.5,radius*2,radius);ctx.restore();}}
  destroy(){this.cache.clear();}
}
