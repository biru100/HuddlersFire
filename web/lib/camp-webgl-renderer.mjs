import {WebGLRenderer,Container,Texture,Sprite,Rectangle,Graphics,Mesh,MeshGeometry,Shader,GlProgram,UniformGroup,Matrix,Color,ImageSource,CanvasSource} from 'pixi.js';
import {spriteImageMetadata,spriteMaterial,validateNormalPair,lightingRole} from './camp-materials.mjs';
import {LIGHT_VERTEX,LIGHT_FRAGMENT} from './camp-lighting-shader.mjs';
import {LightingQuality,receiverAt,nightIllumination} from './camp-lighting.mjs';
import {lightVisibility} from './camp-shadows.mjs';
const dims=image=>[image.naturalWidth||image.width,image.naturalHeight||image.height];
const zero=()=>new Float32Array(4);
function color(value){const c=new Color(value);return {color:c.toNumber(),alpha:c.alpha};}
function transformPoint(m,x,y){return [m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f];}
export class CampWebGLRenderer{
  constructor(input,{onStatus=()=>{}}={}){this.input=input;this.document=input.ownerDocument;this.onStatus=onStatus;this.status='initializing';this.stage=new Container();this.pool=[];this.textures=new Map();this.textureUse=new Map();this.imageFrames=new Map();this.rasters=new Map();this.quality=new LightingQuality();this.metrics={frames:0,draws:0,normalDraws:0,textureBytes:0,uploads:0};this.options={normals:true,lights:true};}
  async init(){
    this.canvas=this.document.createElement('canvas');this.canvas.dataset.campWorld='webgl';this.canvas.setAttribute('aria-hidden','true');this.canvas.style.pointerEvents='none';
    this.renderer=new WebGLRenderer();await this.renderer.init({canvas:this.canvas,width:1,height:1,resolution:1,backgroundAlpha:0,antialias:true,clearBeforeRender:true,hello:false});
    if(!String(this.renderer.gl.getParameter(this.renderer.gl.VERSION)).includes('WebGL 2'))throw Error('WebGL2 material rendering unavailable');
    if(this.destroyed){this.renderer.destroy();return this;}
    this.program=GlProgram.from({vertex:LIGHT_VERTEX,fragment:LIGHT_FRAGMENT,name:'camp-material-lighting'});
    const shared={uViewport:{value:new Float32Array(2),type:'vec2<f32>'},uCamera:{value:new Float32Array([0,0,1]),type:'vec3<f32>'},uAmbient:{value:new Float32Array([1,1,1]),type:'vec3<f32>'},uPointGain:{value:0,type:'f32'}};for(let i=0;i<3;i++){shared['uLight'+i]={value:zero(),type:'vec4<f32>'};shared['uWorldLight'+i]={value:zero(),type:'vec4<f32>'};shared['uLightColor'+i]={value:zero(),type:'vec4<f32>'};}this.frameUniforms=new UniformGroup(shared,{isStatic:true});
    this.input.parentNode.insertBefore(this.canvas,this.input);
    this.lost=e=>{e.preventDefault();this.status='lost';this.canvas.style.display='none';this.onStatus('canvas','context-lost');};
    this.restored=()=>{if(this.destroyed)return;this.status='ready';this.checkErrors=true;this.canvas.style.display='';this.onStatus('webgl','context-restored');};
    this.canvas.addEventListener('webglcontextlost',this.lost);this.canvas.addEventListener('webglcontextrestored',this.restored);this.status='ready';this.onStatus('webgl');return this;
  }
  texture(image,numerical=false){
    if(!image)return Texture.WHITE;
    let row=this.textures.get(image);if(!row){const [width,height]=dims(image),meta=spriteImageMetadata.get(image),sampling=meta?.assets.manifest.files[meta.id]?.sampling,Source=image.getContext?CanvasSource:ImageSource,source=new Source({resource:image,alphaMode:numerical?'no-premultiply-alpha':'premultiply-alpha-on-upload',autoGenerateMipmaps:false,scaleMode:sampling==='nearest'?'nearest':'linear'});row=new Texture({source});this.textures.set(image,row);this.metrics.textureBytes+=width*height*4;this.metrics.uploads++;}
    this.textureUse.set(image,this.metrics.frames);return row;
  }
  imageMesh(index){
    let row=this.pool[index];if(row?.kind==='mesh')return row;
    if(row)this.disposeRow(row);
    const uniforms={uAlpha:{value:1,type:'f32'},uStrength:{value:0,type:'f32'},uNight:{value:0,type:'f32'},uAmbientLift:{value:new Float32Array(3),type:'vec3<f32>'},uReceiver:{value:zero(),type:'vec4<f32>'},uMirror:{value:new Float32Array([1,1]),type:'vec2<f32>'},uVisibility:{value:new Float32Array([1,1,1]),type:'vec3<f32>'}};
    for(let i=0;i<4;i++){uniforms['uClip'+i]={value:zero(),type:'vec4<f32>'};uniforms['uClipMeta'+i]={value:zero(),type:'vec4<f32>'};}
    const shader=new Shader({glProgram:this.program,resources:{uColorTexture:Texture.WHITE.source,uNormalTexture:Texture.WHITE.source,materialUniforms:uniforms,frameUniforms:this.frameUniforms}});
    const geometry=new MeshGeometry({positions:new Float32Array(8),uvs:new Float32Array(8),indices:new Uint32Array([0,1,2,0,2,3])}),node=new Mesh({geometry,shader});
    row={kind:'mesh',node,shader,geometry};this.pool[index]=row;return row;
  }
  image(command,index,width,height,lights){
    const source=spriteImageMetadata.get(command.image),material=command.material||source&&spriteMaterial(source.assets,source.id),candidate=material?.normalImage||(material&&source?.assets.getSprite(material.normalId)),normal=validateNormalPair(command.image,candidate)||(material?.normalizedSurface&&candidate&&dims(command.image)[0]*dims(candidate)[1]===dims(command.image)[1]*dims(candidate)[0])?candidate:null;
    const night=this.profile?.night&&lightingRole(material,command.object,command.image)==='lit';
    if(!night&&(!normal||!this.options.normals||!material.strength)&&!command.clips.length)return this.sprite(command,index);
    const row=this.imageMesh(index),{node,geometry,shader}=row,m=command.matrix,[x,y,w,h]=command.dest,[sx,sy,sw,sh]=command.source,[iw,ih]=dims(command.image);
    geometry.positions.set([...transformPoint(m,x,y),...transformPoint(m,x+w,y),...transformPoint(m,x+w,y+h),...transformPoint(m,x,y+h)]);
    geometry.uvs.set([sx/iw,sy/ih,(sx+sw)/iw,sy/ih,(sx+sw)/iw,(sy+sh)/ih,sx/iw,(sy+sh)/ih]);geometry.getBuffer('aPosition').update();geometry.getBuffer('aUV').update();
    shader.resources.uColorTexture=this.texture(command.image).source;
    shader.resources.uNormalTexture=this.texture(normal,true).source;
    const u=shader.resources.materialUniforms.uniforms;u.uAlpha=command.alpha;u.uStrength=this.options.normals&&normal?material.strength:0;if(u.uStrength)this.metrics.normalDraws++;u.uMirror.set([Math.sign(m.a)||1,Math.sign(m.d)||1]);
    u.uNight=Number(!!night);u.uAmbientLift.set(material?.ambientLift||[0,0,0]);const receiver=command.object;u.uReceiver.set(receiver?[receiver.x||0,receiver.y||0,receiver.z||0,1]:[0,0,0,0]);
    const visibility=(night||u.uStrength)?this.visibilityFor(command.object,lights):null;
    for(let i=0;i<3;i++)u.uVisibility[i]=visibility?.[i]??1;
    for(let i=0;i<4;i++){const clip=command.clips[i];u['uClip'+i].set(clip?.rect||[0,0,1,1]);u['uClipMeta'+i].set(clip?[clip.kind,clip.radius,Number(clip.inverse),1]:[0,0,0,0]);}
    node.visible=true;this.stage.addChild(node);
  }
  visibilityFor(object,lights){if(!object)return null;let row=this.visibility.get(object);if(!row){row=lights.map(l=>lightVisibility(object,l,this.casters));this.visibility.set(object,row);}return row;}
  sprite(command,index){
    const texture=this.texture(command.image),[sx,sy,sw,sh]=command.source,[iw,ih]=dims(command.image);let frame=texture;
    if(sx||sy||sw!==iw||sh!==ih){let frames=this.imageFrames.get(command.image);if(!frames){frames=new Map();this.imageFrames.set(command.image,frames);}const key=command.source.join(',');frame=frames.get(key);if(!frame){frame=new Texture({source:texture.source,frame:new Rectangle(sx,sy,sw,sh)});frames.set(key,frame);}}
    let row=this.pool[index];if(row?.kind!=='sprite'){if(row)this.disposeRow(row);row={kind:'sprite',node:new Sprite(frame)};this.pool[index]=row;}row.node.texture=frame;
    const m=command.matrix,[x,y,w,h]=command.dest;row.node.setFromMatrix(new Matrix(m.a*w/sw,m.b*w/sw,m.c*h/sh,m.d*h/sh,m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f));row.node.alpha=command.alpha;row.node.visible=true;this.stage.addChild(row.node);
  }
  shape(command,index){
    if(command.type==='stroke'&&command.dash.length)return this.image(this.dashed(command),index,this.width,this.height,[]);
    const style=command.type==='stroke'?command.stroke:command.fill;
    if(typeof style!=='string'){const image=this.gradient(command);return this.image(image,index,this.width,this.height,[]);}
    let row=this.pool[index];if(row?.kind!=='shape'){if(row)this.disposeRow(row);row={kind:'shape',node:new Graphics(),key:''};this.pool[index]=row;}
    const key=JSON.stringify([command.ops,command.type,style,command.lineWidth,command.dash]);
    if(row.key!==key){const g=row.node;g.clear();for(const [op,...a]of command.ops){if(op==='ellipse'){g.ellipse(a[0],a[1],a[2],a[3]);}else if(op==='roundRect')g.roundRect(a[0],a[1],a[2],a[3],Number(a[4])||0);else g[op](...a);}
      if(command.type==='stroke')g.stroke({...color(style),width:command.lineWidth,cap:command.lineCap,join:command.lineJoin});else g.fill(color(style));row.key=key;
    }
    const m=command.matrix;row.node.setFromMatrix(new Matrix(m.a,m.b,m.c,m.d,m.e,m.f));row.node.alpha=command.alpha;row.node.visible=true;this.stage.addChild(row.node);
    row.node.tint=0xffffff;
    if(this.profile?.night&&command.object&&command.object.type!=='ground-shadow'&&!['protected','emissive'].includes(command.material?.lighting)){
      const op=command.ops.find(p=>p.length>=3),[x,y]=transformPoint(m,op?.[1]||0,op?.[2]||0),point=receiverAt(command.object,this.camera,x,y),rgb=nightIllumination(point,this.options.lights?this.lights:[],this.profile,[0,0,1],this.visibilityFor(command.object,this.lights)||[]);
      row.node.tint=rgb.reduce((n,v)=>n*256+Math.min(255,Math.round(v*255)),0);
    }
  }
  gradient(command){
    const style=command.fill,key=JSON.stringify([command.ops,style.kind,style.args,style.stops]);let entry=this.rasters.get(key);
    if(!entry){const [op,x,y,w,h]=command.ops[0];if(op!=='rect')throw Error('Unsupported gradient shape');const canvas=this.document.createElement('canvas');canvas.width=Math.min(64,Math.ceil(w));canvas.height=Math.min(256,Math.ceil(h));const c=canvas.getContext('2d');c.scale(canvas.width/w,canvas.height/h);c.translate(-x,-y);const g=style.kind==='linear'?c.createLinearGradient(...style.args):c.createRadialGradient(...style.args);for(const stop of style.stops)g.addColorStop(...stop);c.fillStyle=g;c.fillRect(x,y,w,h);entry={image:canvas,source:[0,0,canvas.width,canvas.height],dest:[x,y,w,h]};this.rasters.set(key,entry);}
    return {...entry,type:'image',matrix:command.matrix,alpha:command.alpha,clips:[],material:null};
  }
  dashed(command){const key=JSON.stringify([command.ops,command.stroke,command.lineWidth,command.dash]);let row=this.rasters.get(key);if(!row){const points=[];for(const [op,...a]of command.ops){if(op==='ellipse'||op==='arc'){const ry=op==='arc'?a[2]:a[3];points.push([a[0]-a[2],a[1]-ry],[a[0]+a[2],a[1]+ry]);}else if(a.length>=2)points.push([a[0],a[1]]);}const pad=command.lineWidth+2,x=Math.min(...points.map(p=>p[0]))-pad,y=Math.min(...points.map(p=>p[1]))-pad,w=Math.ceil(Math.max(...points.map(p=>p[0]))-x+pad),h=Math.ceil(Math.max(...points.map(p=>p[1]))-y+pad),canvas=this.document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');c.translate(-x,-y);c.beginPath();for(const [op,...args]of command.ops)c[op](...args);c.strokeStyle=command.stroke;c.lineWidth=command.lineWidth;c.setLineDash(command.dash);c.stroke();row={image:canvas,source:[0,0,w,h],dest:[x,y,w,h]};this.rasters.set(key,row);}return {...row,type:'image',matrix:command.matrix,alpha:command.alpha,clips:[],material:null};}
  text(command,index){
    const key=JSON.stringify([command.type,command.text,command.font,command.fill,command.stroke,command.lineWidth,command.maxWidth]);let entry=this.rasters.get(key);
    if(!entry){const canvas=this.document.createElement('canvas'),c=canvas.getContext('2d');c.font=command.font;const metrics=c.measureText(command.text),size=parseFloat(command.font.match(/[\d.]+px/)?.[0])||12,pad=command.lineWidth+3,width=Math.min(metrics.width,command.maxWidth||Infinity);canvas.width=Math.ceil(width+pad*2);canvas.height=Math.ceil(size*1.6+pad*2);c.font=command.font;c.textBaseline='alphabetic';c.fillStyle=command.fill;c.strokeStyle=command.stroke;c.lineWidth=command.lineWidth;const baseline=pad+size*1.1;if(command.type==='text')c.fillText(command.text,pad,baseline,width||1);else c.strokeText(command.text,pad,baseline,width||1);entry={image:canvas,width,pad,baseline};this.rasters.set(key,entry);}
    const x=command.x-(command.align==='center'?entry.width/2:command.align==='right'?entry.width:0)-entry.pad,y=command.y-entry.baseline;
    this.image({type:'image',image:entry.image,source:[0,0,entry.image.width,entry.image.height],dest:[x,y,entry.image.width,entry.image.height],matrix:command.matrix,alpha:command.alpha,clips:[],material:command.material,object:command.object},index,this.width,this.height,this.lights);
  }
  render(commands,{width,height,dpr,lights,frameMs=0,casters=[],lighting=null,camera={x:0,y:0,scale:1}}){
    if(this.status!=='ready')return false;const start=performance.now();
    if(this.width!==width||this.height!==height||this.dpr!==dpr){this.width=width;this.height=height;this.dpr=dpr;this.renderer.resolution=dpr;this.renderer.resize(Math.max(1,width),Math.max(1,height));}
    this.stage.removeChildren();this.metrics.normalDraws=0;this.casters=casters;this.visibility=new WeakMap();this.profile=lighting;this.camera=camera;
    const effective=lights,u=this.frameUniforms.uniforms;this.lights=lights;u.uViewport.set([width,height]);for(let i=0;i<3;i++){const l=this.options.lights&&effective[i];u['uLight'+i].set(l?[...l.screen,l.screenRadius]:[0,0,1,1]);u['uLightColor'+i].set(l?[...l.color,l.intensity]:[0,0,0,0]);}
    u.uCamera.set([camera.x,camera.y,camera.scale]);u.uAmbient.set(lighting?.ambient||[1,1,1]);u.uPointGain=lighting?.gain||0;for(let i=0;i<3;i++){const l=this.options.lights&&effective[i];u['uWorldLight'+i].set(l?[l.x||0,l.y||0,l.height||0,l.radius||1]:[0,0,0,1]);}this.frameUniforms.update();
    for(let i=0;i<commands.length;i++){const command=commands[i];if(command.type==='image')this.image(command,i,width,height,effective);else if(command.type.startsWith('text'))this.text(command,i);else this.shape(command,i);}
    this.renderer.render({container:this.stage});if(!this.metrics.frames||this.checkErrors){this.checkErrors=false;const error=this.renderer.gl.getError();if(error&&error!==this.renderer.gl.CONTEXT_LOST_WEBGL)throw Error('WebGL material resource error '+error);}this.metrics.frames++;this.metrics.draws=commands.length;this.metrics.submitMs=performance.now()-start;this.metrics.quality=this.quality.sample(Math.max(this.metrics.submitMs,frameMs),performance.now());
    if(this.metrics.frames%60===0||this.metrics.textureBytes>80000000){for(const [image,texture]of this.textures){const age=this.metrics.frames-this.textureUse.get(image);if(age>120||(this.metrics.textureBytes>80000000&&age>2)){const [w,h]=dims(image);for(const frame of this.imageFrames.get(image)?.values()||[])frame.destroy();this.imageFrames.delete(image);texture.destroy(true);this.textures.delete(image);this.textureUse.delete(image);this.metrics.textureBytes-=w*h*4;}}while(this.rasters.size>128)this.rasters.delete(this.rasters.keys().next().value);}
    return true;
  }
  fail(error){this.status='failed';if(this.canvas)this.canvas.style.display='none';this.onStatus('canvas',String(error?.message||error));}
  disposeRow(row){if(row.kind==='mesh'){row.geometry.destroy();row.shader.destroy();}row.node.destroy();}
  destroy(){this.destroyed=true;this.canvas?.removeEventListener('webglcontextlost',this.lost);this.canvas?.removeEventListener('webglcontextrestored',this.restored);for(const row of this.pool)if(row)this.disposeRow(row);this.stage.destroy();for(const frames of this.imageFrames.values())for(const frame of frames.values())frame.destroy();this.imageFrames.clear();for(const texture of this.textures.values())texture.destroy(true);this.textures.clear();this.rasters.clear();this.renderer?.destroy();this.canvas?.remove();}
}
