import {fireStrength,flareAt,emptyFire} from './camp-fire.mjs';
export const LIGHTING_LIMITS=Object.freeze({lights:3,maxDpr:2,shadowScale:.5,normalStrength:.42});
const FIRE_COLORS={amber:[1,.57,.2],jade:[.4,1,.63],violet:[.75,.48,1],gold:[1,.8,.33],blue:[.4,.67,1]};
export function sceneLights(scene,map,camera,reduced=false){
  const dark=scene.theme==='dark',now=scene.now||0,fire=scene.fire||emptyFire(),strength=fireStrength(fire,now),flare=flareAt(fire,now),lights=[];
  const add=(x,y,height,radius,color,intensity,kind)=>{const px=(x-y)*40,py=(x+y)*20,screen=[camera.x+px*camera.scale,camera.y+(py-height*24)*camera.scale,height*75*camera.scale],screenRadius=radius*40*camera.scale,v=scene.viewport;if(v&&(screen[0]+screenRadius<0||screen[0]-screenRadius>v.width||screen[1]+screenRadius<0||screen[1]-screenRadius>v.height))return;lights.push({x,y,height,radius,intensity,color:dark?[.85,.85,.85]:color,kind,screen,screenRadius});};
  if(map.fire)add(0,0,.8,7.7+strength*1.1,FIRE_COLORS[fire.style]||FIRE_COLORS.amber,(.45+strength*.55+flare*.12)*(reduced?1:1+Math.sin(now*.0031)*.025+Math.sin(now*.0073)*.015),'fire');
  const lamps=map.scenery.filter(p=>p.type==='lantern').sort((a,b)=>Math.hypot(a.x-(scene.selfPosition?.x||0),a.y-(scene.selfPosition?.y||0))-Math.hypot(b.x-(scene.selfPosition?.x||0),b.y-(scene.selfPosition?.y||0)));
  for(const lamp of lamps.slice(0,LIGHTING_LIMITS.lights-lights.length))add(lamp.x,lamp.y,.65,2.5,[1,.75,.4],.28,'lantern');
  return lights;
}
export function lightingAt(x,y,lights){return lights.reduce((sum,l)=>sum+Math.max(0,1-Math.hypot(x-l.x,y-l.y)/l.radius)**2*l.intensity,0);}
export class LightingQuality{
  constructor(){this.level=2;this.slow=0;this.fast=0;this.lastChange=0;}
  sample(ms,now){if(!Number.isFinite(ms)||ms<0)return this.level;if(now-this.lastChange<5000)return this.level;if(ms>22){this.slow++;this.fast=0;}else if(ms<12){this.fast++;this.slow=Math.max(0,this.slow-1);}else{this.slow=Math.max(0,this.slow-1);this.fast=0;}
    if(this.slow>=90&&this.level>0){this.level--;this.lastChange=now;this.slow=0;}else if(this.fast>=600&&this.level<2){this.level++;this.lastChange=now;this.fast=0;}return this.level;}
}
