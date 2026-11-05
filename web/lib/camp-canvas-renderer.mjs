import {createSpriteSurface} from './camp-sprite-assets.mjs';
import {getMap} from './camp-maps.mjs';
export function paintGroundSurface(surface,{base,sand,mapId,edge,dark=false,normal=false}){
  const c=surface.getContext('2d'),map=getMap(mapId);c.scale(surface.width/2100,surface.height/1200);c.translate(1050,580);c.save();c.transform(1,.5,-1,.5,0,0);c.beginPath();c.roundRect(-edge*40,-edge*40,edge*80,edge*80,80);c.clip();c.fillStyle=c.createPattern(base,'repeat');c.fillRect(-edge*40,-edge*40,edge*80,edge*80);
  const area=map.clearing;if(area&&sand){c.fillStyle=c.createPattern(sand,'repeat');c.beginPath();c.ellipse(area.x*40,area.y*40,area.rx*40,area.ry*40,0,0,Math.PI*2);c.fill();}
  for(const route of map.routes||[]){c.beginPath();route.points.forEach(([x,y],i)=>i?c.lineTo(x*40,y*40):c.moveTo(x*40,y*40));c.lineCap='round';c.lineJoin='round';c.lineWidth=route.width;c.strokeStyle=mapId==='showroom'?(normal?'#80cce6':dark?'#575757':'#ece7d3'):c.createPattern(sand,'repeat');c.stroke();if(mapId==='showroom'&&!normal){c.lineWidth=2;c.strokeStyle=dark?'#919191':'#b3ad94';c.stroke();}}
  c.restore();
}
// Cached light sprites are shared by Canvas fallback and the WebGL draw list.
export class GroundLightSprites{
  constructor(ctx){this.ctx=ctx;this.cache=new Map();}
  texture(color){const key=color.join(',');if(this.cache.has(key))return this.cache.get(key);const image=createSpriteSurface(this.ctx,128,128),c=image.getContext('2d'),rgb=color.map(v=>Math.round(v*255)).join(','),g=c.createRadialGradient(64,64,0,64,64,63);g.addColorStop(0,`rgba(${rgb},.78)`);g.addColorStop(.45,`rgba(${rgb},.29)`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(0,0,128,128);this.cache.set(key,image);return image;}
  draw(ctx,lights){for(const light of lights){const radius=light.radius*40,x=(light.x-light.y)*40,y=(light.x+light.y)*20;ctx.save();ctx.globalAlpha*=Math.min(.24,light.intensity*.2);ctx.drawImage(this.texture(light.color),x-radius,y-radius*.5,radius*2,radius);ctx.restore();}}
  destroy(){this.cache.clear();}
}
