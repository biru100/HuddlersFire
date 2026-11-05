// A narrow recording adapter for our existing drawing vocabulary. Native Canvas remains
// the source of transform, text-metric and clipping semantics, including mixed poses.
import {screenClips} from './camp-scene-frame.mjs';
const PATH=new Set(['moveTo','lineTo','bezierCurveTo','quadraticCurveTo','arc','ellipse','rect','roundRect','closePath']);
const STATE=['fillStyle','strokeStyle','globalAlpha','lineWidth','lineCap','lineJoin','font','textAlign','textBaseline'];
export function createDrawContext(native,{dpr=()=>1}={}){
  let active=false,commands=[],path=[],clips=[],stack=[],material=null,object=null,styles={},local=null,dash=[];
  const matrix=()=>{const m=active?local:native.getTransform(),r=dpr();return {a:m.a/r,b:m.b/r,c:m.c/r,d:m.d/r,e:m.e/r,f:m.f/r};};
  const multiply=(a,b,c,d,e,f)=>{const m=local;local={a:m.a*a+m.c*b,b:m.b*a+m.d*b,c:m.a*c+m.c*d,d:m.b*c+m.d*d,e:m.a*e+m.c*f+m.e,f:m.b*e+m.d*f+m.f};};
  const paint=type=>({type,ops:path.map(op=>[...op]),matrix:matrix(),alpha:styles.globalAlpha,fill:styles.fillStyle,stroke:styles.strokeStyle,lineWidth:styles.lineWidth,lineCap:styles.lineCap,lineJoin:styles.lineJoin,dash,clips:clips.slice()});
  const api={
    begin(){active=true;commands=[];path=[];clips=[];stack=[];material=null;object=null;styles=Object.fromEntries(STATE.map(key=>[key,native[key]]));const m=native.getTransform();local={a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f};dash=native.getLineDash();},
    end(){active=false;return commands;},
    get active(){return active;},
    setMaterial(value){material=value;},
    setObject(value){object=value;},
    save(){if(active)stack.push({clips:clips.slice(),styles:{...styles},material,object,local:{...local},dash});native.save();},
    restore(){native.restore();if(active){const state=stack.pop();if(!state)throw Error('Unbalanced scene restore');clips=state.clips;styles=state.styles;material=state.material;object=state.object;local=state.local;dash=state.dash;}},
    translate(x,y){if(active)multiply(1,0,0,1,x,y);native.translate(x,y);},
    scale(x,y){if(active)multiply(x,0,0,y,0,0);native.scale(x,y);},
    rotate(angle){if(active)multiply(Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),0,0);native.rotate(angle);},
    transform(a,b,c,d,e,f){if(active)multiply(a,b,c,d,e,f);native.transform(a,b,c,d,e,f);},
    setTransform(...args){native.setTransform(...args);if(active){const m=native.getTransform();local={a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f};}},
    setLineDash(value){if(active)dash=Array.from(value);native.setLineDash(value);},
    beginPath(){if(active)path=[];native.beginPath();},
    clip(rule='nonzero'){if(active){const clip={ops:path.map(op=>[...op]),matrix:matrix(),rule};screenClips([clip]);clips.push(clip);}native.clip(rule);},
    fill(rule='nonzero'){if(active)commands.push({...paint('shape'),rule});else native.fill(rule);},
    stroke(){if(active)commands.push(paint('stroke'));else native.stroke();},
    fillRect(x,y,w,h){if(active){const old=path;path=[['rect',x,y,w,h]];commands.push(paint('shape'));path=old;}else native.fillRect(x,y,w,h);},
    strokeRect(x,y,w,h){if(active){const old=path;path=[['rect',x,y,w,h]];commands.push(paint('stroke'));path=old;}else native.strokeRect(x,y,w,h);},
    clearRect(...args){if(!active)native.clearRect(...args);},
    drawImage(image,...args){
      if(!active){native.drawImage(image,...args);return;}
      const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;let source,dest;
      if(args.length===2){source=[0,0,width,height];dest=[...args,width,height];}else if(args.length===4){source=[0,0,width,height];dest=args;}else if(args.length===8){source=args.slice(0,4);dest=args.slice(4);}else throw Error('Unsupported image draw');
      commands.push({type:'image',image,source,dest,matrix:matrix(),alpha:styles.globalAlpha,clips:screenClips(clips),material:material?{...material}:null,object});
    },
    fillText(text,x,y,maxWidth){if(active)commands.push({...paint('text'),text:String(text),x,y,maxWidth,font:styles.font,align:styles.textAlign,baseline:styles.textBaseline});else if(maxWidth===undefined)native.fillText(text,x,y);else native.fillText(text,x,y,maxWidth);},
    strokeText(text,x,y,maxWidth){if(active)commands.push({...paint('text-stroke'),text:String(text),x,y,maxWidth,font:styles.font,align:styles.textAlign,baseline:styles.textBaseline});else if(maxWidth===undefined)native.strokeText(text,x,y);else native.strokeText(text,x,y,maxWidth);},
    createLinearGradient(...args){const value=native.createLinearGradient(...args),stops=[];return {native:value,kind:'linear',args,stops,addColorStop(at,color){stops.push([at,color]);value.addColorStop(at,color);}};},
    createRadialGradient(...args){const value=native.createRadialGradient(...args),stops=[];return {native:value,kind:'radial',args,stops,addColorStop(at,color){stops.push([at,color]);value.addColorStop(at,color);}};},
  };
  return new Proxy(native,{get(target,key){if(key==='recording')return api;if(key in api){const value=api[key];return typeof value==='function'?value.bind(api):value;}if(PATH.has(key))return (...args)=>{if(active)path.push([key,...args]);return target[key](...args);};if(active&&key in styles)return styles[key];const value=target[key];return typeof value==='function'?value.bind(target):value;},set(target,key,value){if(active&&STATE.includes(key))styles[key]=value;target[key]=value?.native||value;return true;}});
}
