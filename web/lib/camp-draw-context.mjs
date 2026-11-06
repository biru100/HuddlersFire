// A narrow recording adapter for our existing drawing vocabulary. Native Canvas remains
// the source of transform, text-metric and clipping semantics, including mixed poses.
import {screenClips} from './camp-scene-frame.mjs';
import {lightingRole} from './camp-materials.mjs';
import {receiverAt,nightIllumination} from './camp-lighting.mjs';
const PATH=new Set(['moveTo','lineTo','bezierCurveTo','quadraticCurveTo','arc','ellipse','rect','roundRect','closePath']);
const STATE=['fillStyle','strokeStyle','globalAlpha','lineWidth','lineCap','lineJoin','font','textAlign','textBaseline'];
export function createDrawContext(native,{dpr=()=>1}={}){
  let active=false,commands=[],path=[],clips=[],stack=[],material=null,object=null,styles={},local=null,dash=[];
  let lighting=null,fallbackStack=[],cacheBytes=0,nextImage=0;
  const tinted=new Map(),imageIds=new WeakMap();
  const tintAt=(x,y,ground=false)=>{
    if(ground)return lighting.profile.ambient;
    const m=matrix(),screenX=m.a*x+m.c*y+m.e,screenY=m.b*x+m.d*y+m.f;
    return nightIllumination(receiverAt(object,lighting.camera,screenX,screenY),lighting.lights,lighting.profile,[0,0,1],lighting.visibility?.(object)).map((v,i)=>Math.min(1.1,v+(material?.ambientLift?.[i]||0)));
  };
  const tintColor=(value,tint)=>{
    if(typeof value!=='string'||!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value))return value;
    return '#'+tint.map((v,i)=>Math.min(255,Math.round(parseInt(value.slice(1+i*2,3+i*2),16)*v)).toString(16).padStart(2,'0')).join('')+value.slice(7);
  };
  const shadePaint=()=>lighting?.profile.night&&object&&object.type!=='ground-shadow'&&material?.lighting!=='protected'&&material?.lighting!=='emissive';
  const paintNative=(method,...args)=>{
    if(!shadePaint()){native[method](...args);return;}
    const op=path.find(row=>row.length>=3),text=method==='fillText'||method==='strokeText',x=text?args[1]:op?.[1]||0,y=text?args[2]:op?.[2]||0,tint=tintAt(x,y),fill=native.fillStyle,stroke=native.strokeStyle;
    native.fillStyle=tintColor(fill,tint);native.strokeStyle=tintColor(stroke,tint);native[method](...args);native.fillStyle=fill;native.strokeStyle=stroke;
  };
  const tintedFrame=(image,source,tint)=>{
    if(!imageIds.has(image))imageIds.set(image,++nextImage);
    const rgb=tint.map(v=>Math.round(Math.min(1,v)*24)/24),key=[imageIds.get(image),...source,...rgb].join(',');let row=tinted.get(key);
    if(row){tinted.delete(key);tinted.set(key,row);return row.image;}
    const [sx,sy,sw,sh]=source,doc=native.canvas.ownerDocument||globalThis.document,surface=typeof doc?.createElement==='function'?doc.createElement('canvas'):new native.canvas.constructor(Math.ceil(sw),Math.ceil(sh));surface.width=Math.ceil(sw);surface.height=Math.ceil(sh);
    const c=surface.getContext('2d');c.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);c.globalCompositeOperation='multiply';c.fillStyle='rgb('+rgb.map(v=>Math.round(v*255)).join(',')+')';c.fillRect(0,0,sw,sh);c.globalCompositeOperation='destination-in';c.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
    row={image:surface,bytes:surface.width*surface.height*4};tinted.set(key,row);cacheBytes+=row.bytes;
    while(tinted.size>192||cacheBytes>16000000){const first=tinted.keys().next().value;cacheBytes-=tinted.get(first).bytes;tinted.delete(first);}return surface;
  };
  const matrix=()=>{const m=active?local:native.getTransform(),r=dpr();return {a:m.a/r,b:m.b/r,c:m.c/r,d:m.d/r,e:m.e/r,f:m.f/r};};
  const multiply=(a,b,c,d,e,f)=>{const m=local;local={a:m.a*a+m.c*b,b:m.b*a+m.d*b,c:m.a*c+m.c*d,d:m.b*c+m.d*d,e:m.a*e+m.c*f+m.e,f:m.b*e+m.d*f+m.f};};
  const paint=type=>({type,ops:path.map(op=>[...op]),matrix:matrix(),alpha:styles.globalAlpha,fill:styles.fillStyle,stroke:styles.strokeStyle,lineWidth:styles.lineWidth,lineCap:styles.lineCap,lineJoin:styles.lineJoin,dash,clips:clips.slice(),material:material?{...material}:null,object});
  const api={
    begin(){active=true;commands=[];path=[];clips=[];stack=[];material=null;object=null;styles=Object.fromEntries(STATE.map(key=>[key,native[key]]));const m=native.getTransform();local={a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f};dash=native.getLineDash();},
    end(){active=false;return commands;},
    get active(){return active;},
    setLighting(value){lighting=value;},
    get lightingProfile(){return lighting?.profile;},
    get lightingCacheBytes(){return cacheBytes;},
    clearLighting(){tinted.clear();cacheBytes=0;lighting=null;},
    setMaterial(value){material=value;},
    setObject(value){object=value;},
    save(){if(active)stack.push({clips:clips.slice(),styles:{...styles},material,object,local:{...local},dash});else fallbackStack.push({material,object});native.save();},
    restore(){native.restore();if(active){const state=stack.pop();if(!state)throw Error('Unbalanced scene restore');clips=state.clips;styles=state.styles;material=state.material;object=state.object;local=state.local;dash=state.dash;}else{const state=fallbackStack.pop();if(state){material=state.material;object=state.object;}}},
    translate(x,y){if(active)multiply(1,0,0,1,x,y);native.translate(x,y);},
    scale(x,y){if(active)multiply(x,0,0,y,0,0);native.scale(x,y);},
    rotate(angle){if(active)multiply(Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),0,0);native.rotate(angle);},
    transform(a,b,c,d,e,f){if(active)multiply(a,b,c,d,e,f);native.transform(a,b,c,d,e,f);},
    setTransform(...args){native.setTransform(...args);if(active){const m=native.getTransform();local={a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f};}},
    setLineDash(value){if(active)dash=Array.from(value);native.setLineDash(value);},
    beginPath(){path=[];native.beginPath();},
    clip(rule='nonzero'){if(active){const clip={ops:path.map(op=>[...op]),matrix:matrix(),rule};screenClips([clip]);clips.push(clip);}native.clip(rule);},
    clipGround(edge){if(active)clips.push({ops:[['ground',edge]],matrix:matrix(),rule:'nonzero'});native.transform(1,.5,-1,.5,0,0);native.beginPath();native.roundRect(-edge*40,-edge*40,edge*80,edge*80,80);native.clip();native.transform(.5,-.5,1,1,0,0);},
    fill(rule='nonzero'){if(active)commands.push({...paint('shape'),rule});else paintNative('fill',rule);},
    stroke(){if(active)commands.push(paint('stroke'));else paintNative('stroke');},
    fillRect(x,y,w,h){if(active){const old=path;path=[['rect',x,y,w,h]];commands.push(paint('shape'));path=old;}else native.fillRect(x,y,w,h);},
    strokeRect(x,y,w,h){if(active){const old=path;path=[['rect',x,y,w,h]];commands.push(paint('stroke'));path=old;}else native.strokeRect(x,y,w,h);},
    clearRect(...args){if(!active)native.clearRect(...args);},
    drawImage(image,...args){
      const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;let source,dest;
      if(args.length===2){source=[0,0,width,height];dest=[...args,width,height];}else if(args.length===4){source=[0,0,width,height];dest=args;}else if(args.length===8){source=args.slice(0,4);dest=args.slice(4);}else throw Error('Unsupported image draw');
      if(!active){if(lighting?.profile.night&&lightingRole(material,object,image)==='lit'){const [x,y,w,h]=dest,tint=tintAt(x+w/2,y+h/2,material?.ground);native.drawImage(tintedFrame(image,source,tint),...dest);}else native.drawImage(image,...args);return;}
      commands.push({type:'image',image,source,dest,matrix:matrix(),alpha:styles.globalAlpha,clips:screenClips(clips),material:material?{...material}:null,object});
    },
    fillText(text,x,y,maxWidth){if(active)commands.push({...paint('text'),text:String(text),x,y,maxWidth,font:styles.font,align:styles.textAlign,baseline:styles.textBaseline});else if(material?.lighting==='lit')paintNative('fillText',text,x,y,...(maxWidth===undefined?[]:[maxWidth]));else if(maxWidth===undefined)native.fillText(text,x,y);else native.fillText(text,x,y,maxWidth);},
    strokeText(text,x,y,maxWidth){if(active)commands.push({...paint('text-stroke'),text:String(text),x,y,maxWidth,font:styles.font,align:styles.textAlign,baseline:styles.textBaseline});else if(material?.lighting==='lit')paintNative('strokeText',text,x,y,...(maxWidth===undefined?[]:[maxWidth]));else if(maxWidth===undefined)native.strokeText(text,x,y);else native.strokeText(text,x,y,maxWidth);},
    createLinearGradient(...args){const value=native.createLinearGradient(...args),stops=[];return {native:value,kind:'linear',args,stops,addColorStop(at,color){stops.push([at,color]);value.addColorStop(at,color);}};},
    createRadialGradient(...args){const value=native.createRadialGradient(...args),stops=[];return {native:value,kind:'radial',args,stops,addColorStop(at,color){stops.push([at,color]);value.addColorStop(at,color);}};},
  };
  return new Proxy(native,{get(target,key){if(key==='recording')return api;if(key in api){const value=api[key];return typeof value==='function'?value.bind(api):value;}if(PATH.has(key))return (...args)=>{path.push([key,...args]);return target[key](...args);};if(active&&key in styles)return styles[key];const value=target[key];return typeof value==='function'?value.bind(target):value;},set(target,key,value){if(active&&STATE.includes(key))styles[key]=value;target[key]=value?.native||value;return true;}});
}
