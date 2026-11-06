import {fireStrength,flareAt,emptyFire} from './camp-fire.mjs';
export const LIGHTING_LIMITS=Object.freeze({lights:3,maxDpr:2,shadowScale:.5,normalStrength:.42});
const FIRE_COLORS={amber:[1,.57,.2],jade:[.4,1,.63],violet:[.75,.48,1],gold:[1,.8,.33],blue:[.4,.67,1]};
const DAY=Object.freeze({night:false,ambient:[1,1,1],gain:0});
const NIGHT=Object.freeze({night:true,ambient:[.19,.23,.31],gain:2.8});
const NIGHT_DARK=Object.freeze({night:true,ambient:[.25,.25,.25],gain:2.8});
export const sceneLighting=(map,theme='color')=>map==='camp'?(theme==='dark'?NIGHT_DARK:NIGHT):DAY;
// World coordinates and height are independent of camera zoom, screen size and DPR.
export function receiverAt(object,camera,screenX,screenY){
  const px=(screenX-camera.x)/camera.scale,py=(screenY-camera.y)/camera.scale;
  if(!object)return {x:px/80+py/40,y:py/40-px/80,z:0};
  const across=(px-(object.x-object.y)*40)/80;
  return {x:object.x+across,y:object.y-across,z:Math.max(object.z||0,((object.x+object.y)*20-py)/40)};
}
export function nightIllumination(point,lights,profile,normal=[0,0,1],visibility=[]){
  const result=[...profile.ambient];
  for(let i=0;i<lights.length;i++){
    const l=lights[i],dx=l.x-point.x,dy=l.y-point.y,dz=l.height-(point.z||0),distance=Math.hypot(dx,dy,dz*.7),falloff=Math.max(0,1-distance/l.radius)**2;
    const vector=[(dx-dy)*40,-(dx+dy)*20+dz*40,(dx+dy)*20+dz*24],length=Math.hypot(...vector)||1;
    const facing=.18+.82*Math.max(0,normal.reduce((n,v,j)=>n+v*vector[j]/length,0));
    const gain=profile.gain*l.intensity*falloff*facing*(visibility[i]??1);
    for(let j=0;j<3;j++)result[j]+=l.color[j]*gain;
  }
  return result.map(v=>Math.min(1.1,v));
}
export function sceneLights(scene,map,camera,reduced=false,sources=null){
  const dark=scene.theme==='dark',now=scene.now||0,fire=scene.fire||emptyFire(),strength=fireStrength(fire,now),flare=flareAt(fire,now),lights=[];
  const add=(x,y,height,radius,color,intensity,kind)=>{const px=(x-y)*40,py=(x+y)*20,screen=[camera.x+px*camera.scale,camera.y+(py-height*40)*camera.scale,height*40*camera.scale],screenRadius=radius*40*camera.scale,v=scene.viewport;if(v&&(screen[0]+screenRadius<0||screen[0]-screenRadius>v.width||screen[1]+screenRadius<0||screen[1]-screenRadius>v.height))return;lights.push({x,y,height,radius,intensity,color:dark?[.85,.85,.85]:color,kind,screen,screenRadius});};
  if(sources){for(const l of sources.slice(0,LIGHTING_LIMITS.lights))add(l.x,l.y,l.height,l.radius,l.color,l.intensity,l.kind);return lights;}
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
