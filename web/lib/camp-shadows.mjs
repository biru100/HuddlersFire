import {createSpriteSurface} from './camp-sprite-assets.mjs';
const SHAPES={tree:[11,5,2.8],tent:[53,19,1.55],bench:[45,5,.48],lantern:[8,3,.7],sign:[10,4,1],fence:[35,4,.7],shade:[40,14,1.8],crate:[21,8,.6],fire:[28,10,.3],trampoline:[36,13,.35],radio:[22,8,.65],portal:[24,7,2],gameBooth:[57,13,1.8],football:[7,3,.18]};
export function shadowProfile(item){const row=SHAPES[item.type]||(item.type==='garden'?[11,4,.32]:null);if(!row)return null;const scale=item.scale||1;return {rx:row[0]*scale,ry:row[1]*scale,height:row[2]*scale,angle:item.type==='bench'?(Math.abs(Math.sin(item.angle||0))<.5?-.463648:.463648):0};}
export function castVector(item,light){const dx=item.x-light.x,dy=item.y-light.y,distance=Math.hypot(dx,dy),height=Math.max(0,(item.z||0)+(item.height||1));if(distance<.05||distance>light.radius)return null;
  const length=Math.min(2.8,height*distance/Math.max(.45,light.height+.6)),ratio=length/distance,px=(dx-dy)*40*ratio,py=(dx+dy)*20*ratio;
  return {x:px,y:py,alpha:Math.max(0,1-distance/light.radius)**1.5*Math.min(.25,light.intensity*.24)};}
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
  constructor(ctx){this.ctx=ctx;this.cache=null;this.texture=null;}
  soft(){if(this.texture)return this.texture;const image=createSpriteSurface(this.ctx,128,64),c=image.getContext('2d');c.scale(1,.5);const g=c.createRadialGradient(64,64,2,64,64,62);g.addColorStop(0,'#000000bb');g.addColorStop(.38,'#0000008a');g.addColorStop(.72,'#00000035');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(0,0,128,128);return this.texture=image;}
  blob(c,x,y,rx,ry,angle=0,alpha=1){c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.drawImage(this.soft(),-rx,-ry,rx*2,ry*2);c.restore();}
  cast(c,x,y,profile,vector,alpha=1){if(!vector||vector.alpha<.004)return;const length=Math.hypot(vector.x,vector.y),angle=Math.atan2(vector.y,vector.x);this.blob(c,x+vector.x*.48,y+vector.y*.48,Math.max(profile.rx*.6,length*.7),Math.max(3,profile.ry*.95),angle,vector.alpha*alpha);}
  static(objects,lights,map,theme){
    const key=map+theme+JSON.stringify(objects.filter(o=>o.type!=='player').map(o=>[o.type,o.x,o.y,o.scale,o.angle]))+JSON.stringify(lights.filter(l=>l.kind==='fire').map(l=>[l.x,l.y,l.height,l.radius.toFixed(1)]));
    if(this.cache?.key!==key){const surface=createSpriteSurface(this.ctx,1050,600),c=surface.getContext('2d');c.scale(.5,.5);c.translate(1050,580);
      for(const item of objects){const profile=shadowProfile(item);if(!profile||item.type==='player')continue;const x=(item.x-item.y)*40,y=(item.x+item.y)*20;
        this.blob(c,x,y+2,profile.rx,profile.ry,profile.angle,theme==='dark'?.58:.38);
        this.cast(c,x,y,profile,{x:profile.height*11,y:profile.height*6,alpha:theme==='dark'?.12:.1});
        for(const light of lights)if(light.kind==='fire')this.cast(c,x,y,profile,castVector({...item,height:profile.height},light),.8);
      }this.cache={key,surface};}
    this.ctx.save();this.ctx.globalAlpha*=.96;this.ctx.drawImage(this.cache.surface,-1050,-580,2100,1200);this.ctx.restore();
  }
  player(p,lights){if(['falling','respawning'].includes(p.motion))return;const c=this.ctx,z=Math.max(0,p.z||0);
    if(!p.carriedBy&&!p.seatId)this.blob(c,0,3,Math.max(7,15-z),Math.max(3,6.5-z*.3),0,.55/(1+z*.22));
    for(const light of lights)if(light.kind==='fire')this.cast(c,0,3,{rx:12,ry:4},castVector({...p,height:p.seatId?.length ? .6 : 1},light),.75);
  }
  destroy(){this.cache=null;this.texture=null;}
}
