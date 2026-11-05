import {CAMP_BENCHES,seatById} from './camp-seats.mjs';
import {benchBinding} from './camp-scene-contract.mjs';
export const projectWorld=(x,y)=>[(x-y)*40,(x+y)*20];
export function sortSceneObjects(objects,assets){const depth=item=>{if(item.type==='player'&&item.seatId){const b=CAMP_BENCHES.find(b=>b.id===seatById(item.seatId)?.bench);if(b)return b.x+b.y+.01;}return item.type==='bench'?(benchBinding(assets,item)?.depth==='background'?-1000:benchBinding(assets,item)?.depth==='foreground'?1000:item.x+item.y):item.x+item.y;};return objects.sort((a,b)=>depth(a)-depth(b)||(a.z||0)-(b.z||0));}
export function screenClips(paths){
  const clips=[];
  for(const path of paths){let index=0;for(const op of path.ops){const {a,b,c,d,e,f}=path.matrix;if(Math.abs(b)>1e-6||Math.abs(c)>1e-6)throw Error('Rotated image clip is not supported');
    let rect,radius=0,kind=0;
    if(op[0]==='rect'||op[0]==='roundRect'){rect=op.slice(1,5);radius=Number(op[5])||0;}
    else if(op[0]==='arc'){rect=[op[1]-op[3],op[2]-op[3],op[3]*2,op[3]*2];kind=1;}
    else if(op[0]==='closePath')continue;else throw Error('Unsupported image clip '+op[0]);
    const [x,y,w,h]=rect;clips.push({rect:[Math.min(a*x+e,a*(x+w)+e),Math.min(d*y+f,d*(y+h)+f),Math.abs(w*a),Math.abs(h*d)],kind,radius:radius*Math.abs(a),inverse:path.rule==='evenodd'&&index++>0});
  }}if(clips.length>4)throw Error('Image clip budget exceeded');return clips;
}
