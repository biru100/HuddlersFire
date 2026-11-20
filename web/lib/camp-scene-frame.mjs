import {CAMP_BENCHES,seatById} from './camp-seats.mjs';
import {benchBinding} from './camp-scene-contract.mjs';
export const projectWorld=(x,y)=>[(x-y)*40,(x+y)*20];
export function sortSceneObjects(objects,assets){
  const depth=item=>{
    if(item.drawDepth!=null)return item.drawDepth;
    if(item.type==='player'&&item.seatId){
      const b=CAMP_BENCHES.find(b=>b.id===seatById(item.seatId)?.bench);
      if(b)return b.x+b.y+.01;
    }
    if(item.type==='bench'){
      const layer=benchBinding(assets,item)?.depth;
      if(layer==='background')return -1000;
      if(layer==='foreground')return 1000;
    }
    return item.x+item.y;
  };
  return objects.sort((a,b)=>depth(a)-depth(b)||(a.z||0)-(b.z||0));
}

// Stable depths keep neighbouring furniture in order as a camper approaches.
// Lighting and the shadow raster always receive the original, unsplit caster.
export function facilityDrawOrder(objects,assets,layoutFor){
  const order=[],seatedDepth=new Map();
  for(const item of objects){
    const layout=layoutFor(item);
    if(!layout?.profile?.front){order.push(item);continue;}
    const {profile,scale}=layout,depth=item.x+item.y;
    const offsets=profile.feet.map(([,y])=>(y-profile.origin[1])*scale/20);
    const front=depth+Math.max(...offsets),back=depth+Math.min(-.12,...offsets);
    if(item.type==='bench')seatedDepth.set(item.id,front+.015);
    if(profile.postLayers){
      for(const [drawPart,index] of profile.postLayers){
        order.push({...item,caster:item,drawPart,drawDepth:depth+offsets[index]});
      }
    }else{
      order.push({...item,caster:item,drawPart:'back',drawDepth:back},{...item,caster:item,drawPart:'front',drawDepth:front});
    }
  }
  for(let i=0;i<order.length;i++){
    const item=order[i];
    if(item.type!=='player')continue;
    const seat=seatById(item.seatId),depth=seat&&seatedDepth.get(seat.bench);
    if(depth!=null)order[i]={...item,caster:item,drawDepth:depth+(item.x+item.y)*.0001};
  }
  return sortSceneObjects(order,assets);
}
export function screenClips(paths){
  const clips=[];
  for(const path of paths){let index=0;for(const op of path.ops){const {a,b,c,d,e,f}=path.matrix;if(Math.abs(b)>1e-6||Math.abs(c)>1e-6)throw Error('Rotated image clip is not supported');
    let rect,radius=0,kind=0;
    if(op[0]==='ground'){rect=[-op[1]*80,-op[1]*40,op[1]*160,op[1]*80];radius=80;kind=2;}
    else if(op[0]==='rect'||op[0]==='roundRect'){rect=op.slice(1,5);radius=Number(op[5])||0;}
    else if(op[0]==='arc'){rect=[op[1]-op[3],op[2]-op[3],op[3]*2,op[3]*2];kind=1;}
    else if(op[0]==='ellipse'&&op[5]===0&&op[6]===0&&op[7]===Math.PI*2){
      rect=[op[1]-op[3],op[2]-op[4],2*op[3],2*op[4]];kind=1;
    }
    else if(op[0]==='closePath')continue;else throw Error('Unsupported image clip '+op[0]);
    const [x,y,w,h]=rect;clips.push({rect:[Math.min(a*x+e,a*(x+w)+e),Math.min(d*y+f,d*(y+h)+f),Math.abs(w*a),Math.abs(h*d)],kind,radius:radius*Math.abs(a),inverse:path.rule==='evenodd'&&index++>0});
  }}if(clips.length>4)throw Error('Image clip budget exceeded');return clips;
}
