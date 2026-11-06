import {createSpriteSurface,defaultSpriteAssets} from './camp-sprite-assets.mjs';
import {playerDisplay,propDisplay} from './camp-scene-contract.mjs';
import {drawCharacter,characterPose} from './camp-character.mjs';
import {pixelPropDisplay} from './camp-pixel.mjs';
export function shadowProfile(item,assets=defaultSpriteAssets){
  const key=item.type==='bench'?(Math.abs(Math.sin(item.angle||0))<.5?'bench-ne':'bench-nw'):item.type==='garden'?item.variant:item.type==='fire'?'firewood':item.type;
  const row=assets.manifest.materials?.surfaces[key];if(!row)return null;const scale=item.scale||1;
  return {rx:row.footprint[0]*scale,ry:row.footprint[1]*scale,height:row.height*scale,angle:row.axis||0};
}
export function castVector(item,light){
  const dx=item.x-light.x,dy=item.y-light.y,distance=Math.hypot(dx,dy),height=Math.max(0,(item.z||0)+(item.height??1));if(distance<.05||distance>=light.radius||height<=0)return null;
  // Soft area-light art direction: finite, short shadows, retaining the actual alpha silhouette.
  const length=Math.min(.95,height*distance/Math.max(.2,light.height+height)*.42),ratio=length/distance;
  return {x:(dx-dy)*40*ratio,y:(dx+dy)*20*ratio,alpha:Math.max(0,1-distance/light.radius)*Math.min(.48,(light.intensity??1)*.48)};
}
export function lightVisibility(receiver,light,casters){
  if(!receiver)return 1;const dx=receiver.x-light.x,dy=receiver.y-light.y,length=dx*dx+dy*dy;if(length<.01)return 1;
  const targetHeight=(receiver.z||0)+(receiver.type==='player'?.65:(shadowProfile(receiver)?.height||.4)*.5);let visibility=1;
  for(const blocker of casters){if(blocker===receiver||blocker.type==='fire'||blocker.type==='garden')continue;const shape=blocker.type==='player'?{rx:9,ry:4,height:1}:shadowProfile(blocker);if(!shape)continue;
    const t=((blocker.x-light.x)*dx+(blocker.y-light.y)*dy)/length;if(t<=.04||t>=.96)continue;
    const distance=Math.hypot(light.x+dx*t-blocker.x,light.y+dy*t-blocker.y),radius=Math.max(.12,Math.min(1.3,shape.rx/45)),height=light.height+(targetHeight-light.height)*t;
    if(distance<radius&&height<(blocker.z||0)+shape.height&&height>(blocker.z||0))visibility*=.3+.7*Math.min(1,distance/radius)**3;
    if(visibility<.18)return .18;
  }return visibility;
}
export class GroundShadows{
  constructor(ctx,{assets=defaultSpriteAssets}={}){this.ctx=ctx;this.assets=assets;this.cache=null;this.texture=null;this.masks=new Map();}
  soft(){if(this.texture)return this.texture;const image=createSpriteSurface(this.ctx,128,64),c=image.getContext('2d');c.scale(1,.5);const g=c.createRadialGradient(64,64,2,64,64,62);g.addColorStop(0,'#000000bb');g.addColorStop(.38,'#0000008a');g.addColorStop(.72,'#00000035');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(0,0,128,128);return this.texture=image;}
  blob(c,x,y,rx,ry,angle=0,alpha=1){c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.drawImage(this.soft(),-rx,-ry,rx*2,ry*2);c.restore();}
  mask(key,paint,{slope=0,ground=null,width=240,height=256,originX=120,originY=228,rasterScale=1}={}){
    const previous=this.masks.get(key);if(previous){this.masks.delete(key);this.masks.set(key,previous);return previous;}
    const sw=Math.ceil(width*rasterScale),sh=Math.ceil(height*rasterScale),source=createSpriteSurface(this.ctx,sw,sh),c=source.getContext('2d');c.scale(rasterScale,rasterScale);c.translate(originX,originY);paint(c);
    const data=c.getImageData(0,0,sw,sh).data;let left=sw,right=-1,top=sh,bottom=-1,baseline=-Infinity;const edges=new Int16Array(sw);edges.fill(-1);
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const alpha=data[(y*sw+x)*4+3];if(alpha>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}if(alpha>128){baseline=Math.max(baseline,y/rasterScale-originY-slope*(x/rasterScale-originX));edges[x]=y;}}
    if(right<0)return null;baseline=ground??baseline;
    const pad=Math.ceil(4*rasterScale),x=(left-pad)/rasterScale-originX,y=(top-pad)/rasterScale-originY,w=right-left+1+pad*2,h=bottom-top+1+pad*2,image=createSpriteSurface(this.ctx,w,h),m=image.getContext('2d');
    m.shadowColor='#000';m.shadowBlur=1.5*rasterScale;m.drawImage(source,left,top,right-left+1,bottom-top+1,pad,pad,right-left+1,bottom-top+1);m.globalCompositeOperation='source-in';m.fillStyle='#000';m.fillRect(0,0,w,h);
    const contacts=[];let start=null,end=null;
    const flush=()=>{if(start!==null){const center=(start+end)/2/rasterScale-originX;contacts.push({x:center,y:slope*center+baseline+1,rx:Math.max(2,(end-start+3)/2/rasterScale),ry:2});}start=end=null;};
    for(let px=left;px<=right+1;px++){const edge=edges[px],near=edge>=0&&Math.abs(slope*(px/rasterScale-originX)+baseline-(edge/rasterScale-originY))<3;if(near){if(start===null)start=px;end=px;}else flush();}
    const softened=createSpriteSurface(this.ctx,w,h),soft=softened.getContext('2d');soft.filter='blur('+2*rasterScale+'px)';soft.drawImage(image,0,0);
    const result={image:softened,x,y,width:w/rasterScale,height:h/rasterScale,slope,baseline,relief:Math.max(8,baseline-(top/rasterScale-originY)+Math.abs(slope)*(right-left)/2/rasterScale),contacts};this.masks.set(key,result);while(this.masks.size>256)this.masks.delete(this.masks.keys().next().value);return result;
  }
  propMask(item,theme='color'){
    const d=pixelPropDisplay(this.assets,item,this.mapId,this.pixelMode)||propDisplay(item,this.assets);if(!d||!this.assets.getSprite(d.frame.sheet+(theme==='dark'&&!d.frame.ungraded?'-dark':'')))return null;
    const slope=d.direction==='ne'?-.5:d.direction==='nw'?.5:0;
    const width=Math.max(240,Math.ceil(d.width+48)),height=Math.max(256,Math.ceil(d.width*d.frame.h/d.frame.w+48));
    return this.mask(JSON.stringify(['prop',theme,d.id,d.direction,d.width,d.y,d.flip]),c=>this.assets.drawSprite(c,d.id,{...d,theme}),{slope,width,height,originX:width*.5,originY:height-24});
  }
  playerMask(p,{time=0,now=time*1000,reduced=true,theme='color'}={}){
    const display=playerDisplay({...p,z:0},this.assets),player={...display.player,color:null},emote=player.emoteUntil>now?player.emote:null,pose=characterPose(player,time,reduced,emote,now,this.assets);
    if(!this.assets.getSprite(pose.sheet||this.assets.characterSheet(0,theme)))return null;
    const key=JSON.stringify(['player',theme,pose.state,pose.index,pose.lower.state,pose.lower.index,pose.mirror,player.renderDirection,player.renderSeat,player.weapon,pose.weaponSide,display.x,display.y]);
    return this.mask(key,c=>{c.translate(display.x,display.y);drawCharacter(c,player,{time,now,reduced,emote,blankHead:true,shadowOnly:true,theme,assets:this.assets});},{ground:0,width:160,height:192,originX:80,originY:160,rasterScale:.5});
  }
  project(c,mask,item,light){
    const z=Math.max(0,item.z||0),vector=castVector({...item,height:mask.relief/40},{...light,intensity:1});if(!vector||vector.alpha<.002)return;
    const kx=vector.x/(mask.relief+z*40),ky=vector.y/(mask.relief+z*40),b=mask.baseline+z*40;
    c.save();c.globalAlpha*=vector.alpha/(1+z*.4);c.transform(1+kx*mask.slope,mask.slope*(1+ky),-kx,-ky,kx*b,mask.baseline+ky*b);c.drawImage(mask.image,mask.x,mask.y,mask.width,mask.height);c.restore();
  }
  layer(){const surface=createSpriteSurface(this.ctx,1050,600),c=surface.getContext('2d');c.scale(.5,.5);c.translate(1050,580);return {surface,c};}
  static(objects,lights,map,theme){
    const candidates=objects.filter(o=>o.type!=='player').map(item=>({item,mask:this.propMask(item,theme)})),rows=candidates.filter(r=>r.mask),key=map+theme+(this.pixelMode||'off')+JSON.stringify(candidates.map(r=>[r.item.type,r.item.id,r.item.x,r.item.y,r.item.scale,r.item.angle,r.item.variant,!!r.mask]));
    if(this.cache?.key!==key){const {surface,c}=this.layer();for(const {item,mask}of rows){const x=(item.x-item.y)*40,y=(item.x+item.y)*20;for(const foot of mask.contacts)this.blob(c,x+foot.x,y+foot.y,foot.rx+1,foot.ry,0,theme==='dark'?.55:.5);}this.cache={key,surface,layers:new Map()};}
    const c=this.ctx;this.activeLayers=[];c.drawImage(this.cache.surface,-1050,-580,2100,1200);
    for(const light of lights){const lightKey=JSON.stringify([light.x,light.y,light.height,Number(light.radius.toFixed(1))]);let layer=this.cache.layers.get(lightKey);if(!layer){layer=this.layer();for(const {item,mask}of rows){layer.c.save();layer.c.translate((item.x-item.y)*40,(item.x+item.y)*20);this.project(layer.c,mask,item,light);layer.c.restore();}this.cache.layers.set(lightKey,layer);while(this.cache.layers.size>6)this.cache.layers.delete(this.cache.layers.keys().next().value);}this.activeLayers.push(layer);c.save();c.globalAlpha*=light.intensity;c.drawImage(layer.surface,-1050,-580,2100,1200);c.restore();}
  }
  player(p,lights,options){
    if(['falling','respawning'].includes(p.motion))return;const mask=this.playerMask(p,options);if(!mask)return;const c=this.ctx,z=Math.max(0,p.z||0);c.save();c.translate((p.x-p.y)*40,(p.x+p.y)*20);
    if(!p.carriedBy&&!p.seatId)this.blob(c,0,2,Math.max(7,12-z),Math.max(2.5,4-z*.3),0,.6/(1+z*.6));
    for(const light of lights){c.save();c.globalAlpha*=light.intensity;this.project(c,mask,p,light);c.restore();}c.restore();
  }
  draw(objects,lights,{map,edge,theme,...options}){
    const c=this.ctx;this.lastLights=lights;c.save();c.setObject?.({type:'ground-shadow'});
    if(c.clipGround)c.clipGround(edge);else{c.transform(1,.5,-1,.5,0,0);c.beginPath();c.roundRect(-edge*40,-edge*40,edge*80,edge*80,80);c.clip();c.transform(.5,-.5,1,1,0,0);}
    this.static(objects.filter(o=>!['player','football','projectile','weaponEffect'].includes(o.type)),lights,map,theme);
    for(const item of objects)if(item.type==='player')this.player(item,lights,{...options,theme});c.restore();
  }
  destroy(){this.cache=null;this.texture=null;this.masks.clear();}
}
