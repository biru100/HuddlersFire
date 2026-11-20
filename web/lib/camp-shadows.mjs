import {createSpriteSurface,defaultSpriteAssets} from './camp-sprite-assets.mjs';
import {playerDisplay,propDisplay} from './camp-scene-contract.mjs';
import {camperSheetId} from './camp-camper-render.mjs';
import {drawCharacter,characterPose} from './camp-character.mjs';
import {pixelPropDisplay} from './camp-pixel.mjs';
import {clearingBench, drawClearingBench} from './camp-clearing-art.mjs';
import {DAY_SUN,shadowLights} from './camp-lighting.mjs';
import {placedGeometry} from './camp-prop-geometry.mjs';
import {projectWorld} from './camp-scene-frame.mjs';

export function shadowProfile(item,assets=defaultSpriteAssets){
  const key=item.type==='bench'?(Math.abs(Math.sin(item.angle||0))<.5?'bench-ne':'bench-nw'):item.type==='garden'?item.variant:item.type==='fire'?'firewood':item.type==='gameBooth'?'game-booth':item.type;
  const row=assets.manifest.materials?.surfaces[key];if(!row)return null;const scale=item.scale||1;
  return {rx:row.footprint[0]*scale,ry:row.footprint[1]*scale,height:row.height*scale,angle:row.axis||0};
}
export function castVector(item,light,receiverZ=0){
  const height=Math.max(0,(item.z||0)+(item.height??1)-receiverZ);
  if(!height)return null;
  if(light.kind==='sun'){
    const rise=Math.min(240,height*40);
    const [x,y]=projectWorld(-DAY_SUN.x,-DAY_SUN.y);
    return {x:x*rise/(40*DAY_SUN.height),y:y*rise/(40*DAY_SUN.height),alpha:.34};
  }
  const dx=item.x-light.x,dy=item.y-light.y,distance=Math.hypot(dx,dy);
  if(distance<.05||distance>=light.radius)return null;
  // Intersect the light ray with the receiver, soft-limiting grazing rays
  // from a low emitter (including a caster that rises above the flame).
  const run=height*distance;
  const length=run/(Math.max(.2,light.height-receiverZ-height)+run/2.35);
  const reach=1-distance/light.radius;
  return {x:(dx-dy)*40*length/distance,y:(dx+dy)*20*length/distance,
    alpha:.47*(light.intensity??1)*reach*reach*(3-2*reach)};
}

const fillLevel=light=>Math.round((light.fillIntensity??light.intensity??1)*8);
function incident(item,light){
  const reach=Math.max(0,1-Math.hypot(item.x-light.x,item.y-light.y)/light.radius);
  // Bin only the fill energy, so flame flicker can modulate opacity on the
  // existing texture without a new static map raster every frame.
  return reach**2*Math.max(0,fillLevel(light)/8);
}
function shadowShare(item,light,lights){
  if(lights.length<2)return 1;
  const own=incident(item,light);
  let total=own;
  for(const other of lights)if(other!==light)total+=incident(item,other);
  return total>0?own/total:0;
}
function geometryKey(light){
  return light.kind==='sun'?'sun':[light.x,light.y,light.height,Number(light.radius.toFixed(1))];
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
    const relief=Math.max(8,baseline-(top/rasterScale-originY)+Math.abs(slope)*(right-left)/2/rasterScale);
    const blur=Math.min(6,Math.max(2.5,relief*.042)),pad=Math.ceil((blur*2+1)*rasterScale);
    const x=(left-pad)/rasterScale-originX,y=(top-pad)/rasterScale-originY;
    const w=right-left+1+pad*2,h=bottom-top+1+pad*2,image=createSpriteSurface(this.ctx,w,h),m=image.getContext('2d');
    m.drawImage(source,left,top,right-left+1,bottom-top+1,pad,pad,right-left+1,bottom-top+1);
    m.globalCompositeOperation='source-in';m.fillStyle='#000';m.fillRect(0,0,w,h);
    const diffuse=createSpriteSurface(this.ctx,w,h),soft=diffuse.getContext('2d');
    soft.filter='blur('+blur*rasterScale+'px)';soft.drawImage(image,0,0);
    const near=m.getImageData(0,0,w,h),far=soft.getImageData(0,0,w,h);
    // Mix sharp alpha at the caster's feet into a larger, lighter penumbra at
    // its crown. This is baked per silhouette, shared by Canvas and WebGL.
    for(let py=0;py<h;py++)for(let px=0;px<w;px++){
      const i=(py*w+px)*4+3,where=Math.min(1,Math.max(0,(baseline+slope*(x+px/rasterScale)-y-py/rasterScale)/relief));
      const spread=.17+.79*where;
      near.data[i]=(near.data[i]*(1-spread)+far.data[i]*spread)*(1-.42*where);
      far.data[i]*=1-.42*where;
    }
    m.putImageData(near,0,0);soft.putImageData(far,0,0);
    const contacts=[];let start=null,end=null;
    const flush=()=>{if(start!==null){const center=(start+end)/2/rasterScale-originX;contacts.push({x:center,y:slope*center+baseline+1,rx:Math.max(2,(end-start+3)/2/rasterScale),ry:2});}start=end=null;};
    for(let px=left;px<=right+1;px++){const edge=edges[px],near=edge>=0&&Math.abs(slope*(px/rasterScale-originX)+baseline-(edge/rasterScale-originY))<3;if(near){if(start===null)start=px;end=px;}else flush();}
    const result={key,image,diffuse,x,y,width:w/rasterScale,height:h/rasterScale,slope,baseline,relief,contacts};
    this.masks.set(key,result);while(this.masks.size>256)this.masks.delete(this.masks.keys().next().value);return result;
  }
  propMask(item,theme='color'){
    const bench=clearingBench(this.assets,item,theme,this.mapId,this.pixelMode);
    if (bench) {
      const key=JSON.stringify(['clearing-bench',theme,bench.sx,bench.sy,bench.x,bench.y]);
      const mask=this.mask(key,c=>drawClearingBench(c,bench,null),{slope:bench.direction==='ne'?-.5:.5});
      return this.attachSupports(mask,bench.profile,1,false);
    }
    const d=pixelPropDisplay(this.assets,item,this.mapId,this.pixelMode)||propDisplay(item,this.assets);if(!d||!this.assets.getSprite(d.frame.sheet+(theme==='dark'&&!d.frame.ungraded?'-dark':'')))return null;
    const feet=d.profile?.feet;
    // The cast from a sloping fence must meet both supports, including mirrors.
    let slope=d.direction==='ne'?-.5:d.direction==='nw'?.5:0;
    let ground=null;
    const line=d.profile?.groundLine ?? (feet?.length===2&&!d.profile.deck ? feet : null);
    // A single baseline fits a straight run; a corner has two opposing slopes.
    if(line?.length===2){
      const [[x1,y1],[x2,y2]]=line;
      const nativeSlope=(y2-y1)/(x2-x1);
      slope=d.flip?-nativeSlope:nativeSlope;
      ground=(y1-d.profile.origin[1]-nativeSlope*(x1-d.profile.origin[0]))*d.width/d.frame.w;
    }
    const width=Math.max(240,Math.ceil(d.width+48)),height=Math.max(256,Math.ceil(d.width*d.frame.h/d.frame.w+48));
    const mask=this.mask(JSON.stringify(['prop',theme,d.id,d.direction,d.width,d.y,d.flip]),c=>this.assets.drawSprite(c,d.id,{...d,theme}),{slope,ground,width,height,originX:width*.5,originY:height-24});
    return this.attachSupports(mask,d.profile,d.width/d.frame.w,d.flip);
  }
  attachSupports(mask,profile,scale,flip){
    if(mask&&profile&&!mask.structure){
      mask.structure=placedGeometry(profile,scale,flip);
      mask.contacts=mask.structure.contacts;
    }
    return mask;
  }
  projectDeck(c,item,structure,light,alpha){
    // Each post and deck corner has its own world-space light ray.
    const tip=(x,y)=>{
      const point={x:item.x+x/80+y/40,y:item.y+y/40-x/80,height:structure.height};
      const v=castVector(point,light);
      return [x+(v?.x||0),y+(v?.y||0)];
    };
    c.save();c.globalAlpha*=alpha*.87;c.fillStyle='#262626';
    // Fill the deck and supports in one silhouette. Overlapping post/roof
    // projections block the same light once. Only the static raster is blurred.
    c.filter='blur('+Math.min(2.2,.4+structure.height*.8)+'px)';
    c.beginPath();
    for(const [i,[x,y]] of structure.deck.entries()){
      const [u,v]=tip(x,y);
      if(i===0)c.moveTo(u,v);else c.lineTo(u,v);
    }
    c.closePath();
    for(const {x,y,rx,ry} of structure.contacts){
      const [u,v]=tip(x,y),dx=u-x,dy=v-y,length=Math.hypot(dx,dy);
      if(length<.01)continue;
      const radius=Math.max(1,Math.min(rx*.64,ry*1.35));
      const px=-dy/length*radius,py=dx/length*radius;
      c.moveTo(x+px,y+py);c.lineTo(x-px,y-py);
      c.lineTo(u-px,v-py);c.lineTo(u+px,v+py);c.closePath();
    }
    c.fill();
    c.restore();
  }
  playerMask(p,{time=0,now=time*1000,reduced=true,theme='color'}={}){
    const display=playerDisplay({...p,z:0},this.assets,theme,this.pixelMode),player={...display.player,color:null},emote=player.emoteUntil>now?player.emote:null,pose=characterPose(player,time,reduced,emote,now,this.assets);
    const releaseId=camperSheetId(theme),release=this.assets.manifest.files?.[releaseId]&&this.assets.getSprite(releaseId);
    if(!release&&!this.assets.getSprite(pose.sheet||this.assets.characterSheet(0,theme)))return null;
    const key=JSON.stringify(['player',!!release,theme,player.hairStyle,player.topStyle,player.visualDirection,pose.artFrame,pose.state,pose.index,pose.lower.state,pose.lower.index,pose.mirror,player.renderDirection,player.renderSeat,player.weapon,pose.weaponSide,display.x,display.y]);
    return this.mask(key,c=>{c.translate(display.x,player.renderSeat?0:display.y);drawCharacter(c,player,{time,now,reduced,emote,blankHead:true,shadowOnly:true,theme,assets:this.assets});},{ground:0,width:160,height:192,originX:80,originY:160,rasterScale:.5});
  }
  project(c,mask,item,light,share=1,receiverZ=0){
    const z=Math.max(0,(item.z||0)-receiverZ),shape=shadowProfile(item,this.assets);
    if(mask.structure?.deck){
      const vector=castVector({...item,height:mask.structure.height},{...light,intensity:1});
      if(vector&&vector.alpha*share>.002)this.projectDeck(c,item,mask.structure,light,vector.alpha*share);
      return;
    }
    // Low, broad props occupy many vertical sprite pixels from isometric depth.
    // Use their measured height so a trampoline does not cast a fence-sized shadow.
    const height=Math.min(mask.relief/40,shape?.height??Infinity);
    const vector=castVector({...item,height},{...light,intensity:1},receiverZ);
    if(!vector||share*vector.alpha<.002)return;
    const base=z?castVector({...item,height:0},light,receiverZ):null;
    const kx=(vector.x-(base?.x||0))/mask.relief,ky=(vector.y-(base?.y||0))/mask.relief,b=mask.baseline;
    c.save();c.globalAlpha*=share*vector.alpha/(1+z*.74);
    c.translate(base?.x||0,base?.y||0);
    // Looking along the edge of an upright sprite can collapse the affine
    // projection to a line. Its thickness on the ground is still visible.
    if(Math.abs(vector.y)<7&&Math.abs(vector.x)>5){
      const dx=kx*mask.relief,dy=ky*mask.relief;
      this.blob(c,dx*.5,mask.baseline+dy*.5,
        Math.max(4,Math.hypot(dx,dy)*.56),Math.min(6,mask.width*.12),Math.atan2(dy,dx),(1-Math.abs(vector.y)/7)*.7);
    }
    c.transform(1+kx*mask.slope,mask.slope*(1+ky),-kx,-ky,kx*b,mask.baseline+ky*b);
    c.drawImage(z>.3?mask.diffuse:mask.image,mask.x,mask.y,mask.width,mask.height);c.restore();
  }
  layer(){const surface=createSpriteSurface(this.ctx,1050,600),c=surface.getContext('2d');c.scale(.5,.5);c.translate(1050,580);return {surface,c};}
  static(objects,lights,map,theme){
    const candidates=objects.filter(o=>o.type!=='player').map(item=>({item,mask:this.propMask(item,theme)})),rows=candidates.filter(r=>r.mask),key=map+theme+(this.pixelMode||'off')+JSON.stringify(candidates.map(r=>[r.item.type,r.item.id,r.item.x,r.item.y,r.item.scale,r.item.angle,r.item.variant,r.mask?.key]));
    if(this.cache?.key!==key){
      const {surface,c}=this.layer();
      for(const {item,mask}of rows){
        const x=(item.x-item.y)*40,y=(item.x+item.y)*20,shape=shadowProfile(item,this.assets);
        // Broad ground contact is deliberately faint. The solid feet and
        // supports supply the darkest contact, including separate bench legs.
        if(shape)this.blob(c,x,y,shape.rx*1.12,shape.ry*1.08,shape.angle,mask.structure?.deck ? .12 : .19);
        for(const foot of mask.contacts)this.blob(c,x+foot.x,y+foot.y,foot.rx+2,foot.ry+1,0,.78);
      }
      this.cache={key,surface,layers:new Map()};
    }
    const c=this.ctx;this.activeLayers=[];c.drawImage(this.cache.surface,-1050,-580,2100,1200);
    const sources=shadowLights(map,lights);
    const fillKey=sources.length>1?JSON.stringify(sources.map(l=>[geometryKey(l),fillLevel(l)])):'';
    for(const light of sources){
      const lightKey=JSON.stringify(geometryKey(light))+fillKey;let layer=this.cache.layers.get(lightKey);
      if(!layer){
        layer=this.layer();
        for(const {item,mask}of rows){
          layer.c.save();layer.c.translate((item.x-item.y)*40,(item.x+item.y)*20);
          this.project(layer.c,mask,item,light,shadowShare(item,light,sources));layer.c.restore();
        }
        this.cache.layers.set(lightKey,layer);while(this.cache.layers.size>6)this.cache.layers.delete(this.cache.layers.keys().next().value);
      }
      this.activeLayers.push(layer);c.save();c.globalAlpha*=light.intensity??1;c.drawImage(layer.surface,-1050,-580,2100,1200);c.restore();
    }
  }
  player(p,lights,options){
    if(['falling','respawning'].includes(p.motion))return;
    const mask=this.playerMask(p,options);if(!mask)return;
    const surface=p.seatId?playerDisplay(p,this.assets,options?.theme,this.pixelMode):null;
    const caster=surface?.player.renderSeat?{...p,z:-surface.y/40}:p;
    const c=this.ctx,z=Math.max(0,caster.z||0);
    c.save();c.translate((p.x-p.y)*40,(p.x+p.y)*20);
    if(!p.carriedBy&&!p.seatId&&!p.springLift){
      // Airborne ambient occlusion spreads and disappears as the feet lift.
      this.blob(c,0,1,13+Math.min(z,3)*2,4+Math.min(z,3)*.9,0,.41/(1+z*2.8)**2);
      if(z<.25)for(const foot of mask.contacts)this.blob(c,foot.x,foot.y,foot.rx+1,2.4,0,.63*(1-z/.25));
    }
    for(const light of lights){
      c.save();c.globalAlpha*=light.intensity??1;this.project(c,mask,caster,light,shadowShare(p,light,lights));c.restore();
    }
    c.restore();
  }
  football(ball,lights,theme){
    const c=this.ctx,mask=this.mask('football/'+theme,ctx=>this.assets.drawSprite(ctx,'football',{y:-8,width:17,anchorY:.5,theme}),{ground:0,width:40,height:40,originX:20,originY:28});
    if(!mask)return;
    c.save();c.translate((ball.x-ball.y)*40,(ball.x+ball.y)*20);
    this.blob(c,0,0,8,2.8,0,.56);
    for(const light of lights)this.project(c,mask,ball,light,shadowShare(ball,light,lights)*(light.intensity??1));
    c.restore();
  }
  onSpring(item,display,players,lights,options){
    const {profile,width,frame}=display, scale=width/frame.w;
    const [cx,cy,rx,ry]=profile.mat,h=profile.rise*scale/40,c=this.ctx;
    c.save();c.setMaterial?.({lighting:'protected'});c.beginPath();
    c.ellipse((cx-profile.origin[0])*scale,(cy-profile.origin[1])*scale,rx*scale,ry*scale,0,0,Math.PI*2);c.clip();
    for(const p of players){
      if(p.springId!==item.id||p.motion==='falling'||p.motion==='respawning')continue;
      const mask=this.playerMask(p,options);if(!mask)continue;
      const [x,y]=projectWorld(p.x-item.x,p.y-item.y);
      c.save();c.translate(x,y-h*40);
      if(!p.carriedBy)this.blob(c,0,0,10,3.8,0,.68/(1+Math.max(0,p.z-h)*3)**2);
      for(const light of shadowLights('playground',lights))this.project(c,mask,p,light,1,h);
      c.restore();
    }
    c.restore();
  }
  draw(objects,lights,{map,edge,theme,...options}){
    const c=this.ctx;this.lastLights=lights;c.save();c.setObject?.({type:'ground-shadow'});
    if(c.clipGround)c.clipGround(edge);else{c.transform(1,.5,-1,.5,0,0);c.beginPath();c.roundRect(-edge*40,-edge*40,edge*80,edge*80,80);c.clip();c.transform(.5,-.5,1,1,0,0);}
    this.static(objects.filter(o=>!['player','football','projectile','weaponEffect'].includes(o.type)),lights,map,theme);
    const sources=shadowLights(map,lights);
    for(const item of objects){
      if(item.type==='player')this.player(item,sources,{...options,theme});
      else if(item.type==='football')this.football(item,sources,theme);
    }
    c.restore();
  }
  destroy(){this.cache=null;this.texture=null;this.masks.clear();}
}
