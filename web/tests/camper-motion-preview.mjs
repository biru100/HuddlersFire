// Loaded by the loopback material preview only.
export async function showCamperMotion(review,scene,light){
  const {renderer}=review,gpu=renderer.webgl;
  if(gpu?.status!=='ready')throw Error('Camper motion preview requires WebGL');
  renderer.reduced=false;
  const normals=light!=='off';
  gpu.options.normals=normals;
  renderer.lightSources=null;
  if(light){
    const player=scene.players.find(p=>p.id===scene.self),offset=light==='right'?1.4:-1.4;
    renderer.lightSources=[{x:player.x+offset,y:player.y-offset,height:0.7,radius:8,
      color:[1,.75,.45],intensity:1.1,kind:'diagnostic'}];
  }
  Object.assign(review.scene,scene);
  renderer.draw(scene.now);
  await renderer.ready;
  const render=gpu.render,drawImage=gpu.image;
  let captured;
  const parts=[];
  gpu.render=function(commands,settings){
    captured={commands,settings};
    return render.call(this,commands,settings);
  };
  gpu.image=function(command,index,...args){
    drawImage.call(this,command,index,...args);
    const material=command.material;
    if(command.object?.id!==scene.self||!material?.camperLayer)return;
    const shader=this.pool[index]?.shader;
    const source=this.textures.get(material.normalImage)?.source;
    parts.push({
      layer:material.camperLayer,cell:material.camperCell,normalKind:material.normalKind,
      bound:!!source&&shader?.resources.uNormalTexture===source,
      size:source?[source.width,source.height]:null,
      strength:shader?.resources.materialUniforms.uniforms.uStrength??0,
    });
  };
  try{
    renderer.draw(scene.now);
    if(gpu.status!=='ready'||!captured||!parts.length)
      throw Error('No actual camper WebGL draws for '+scene.self+': '+renderer.canvas.dataset.campRenderReason);
    const proof={backend:'webgl',parts};
    if(light){
      gpu.image=drawImage;
      const {commands,settings}=captured;
      const player=commands.filter(row=>row.type==='image'&&row.object?.id===scene.self&&row.material?.camperLayer);
      const gl=gpu.renderer.gl;
      const read=enabled=>{
        gpu.options.normals=enabled;
        render.call(gpu,player,settings);
        const pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
        gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        if(gl.getError()!==gl.NO_ERROR)throw Error('Could not read camper shader output');
        return pixels;
      };
      const on=read(true),off=read(false);
      let visible=0,changed=0,hash=2166136261;
      for(let i=0;i<on.length;i+=4){
        if(!on[i+3])continue;
        visible++;
        if(on[i]!==off[i]||on[i+1]!==off[i+1]||on[i+2]!==off[i+2])changed++;
        const pixels=normals?on:off;
        for(let channel=0;channel<4;channel++)hash=Math.imul(hash^pixels[i+channel],16777619);
      }
      Object.assign(proof,{visible,changed,pixelHash:hash>>>0});
    }
    return proof;
  }finally{
    gpu.render=render;
    gpu.image=drawImage;
    gpu.options.normals=normals;
    renderer.draw(scene.now);
  }
}
