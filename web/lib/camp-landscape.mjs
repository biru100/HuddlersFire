import {createSpriteSurface} from './camp-sprite-assets.mjs';

// Current maps ship a square floor and a separate world-resolution horizon.
// Older preview atlases pack the horizon below the square floor.
const prepared = new WeakMap();
function decodedPixels(ctx,image) {
  const surface=createSpriteSurface(ctx,image.width,image.height);
  const c=surface.getContext('2d');
  c.drawImage(image,0,0);
  return c.getImageData(0,0,image.width,image.height);
}
function grayAtlas(ctx,source,size,night) {
  const canvas=createSpriteSurface(ctx,source.width,source.height);
  const c=canvas.getContext('2d'), output=c.createImageData(source.width,source.height);
  for (let i=0;i<source.data.length;i+=4) {
    const sky=i>=size*size*4;
    const tone=source.data[i]*.30+source.data[i+1]*.58+source.data[i+2]*.12;
    const gray=sky?(night?tone*.72+1:tone*.30+7):tone*.49+8;
    output.data[i]=output.data[i+1]=output.data[i+2]=gray;
    output.data[i+3]=source.data[i+3];
  }
  c.putImageData(output,0,0);
  return canvas;
}

export function landscapeFor(ctx,assets,mapId,theme,pixelMode,layer='landscape') {
  const id=layer+'-'+mapId;
  if(pixelMode==='candidates'||!assets.manifest?.files?.[id]) return null;
  if(theme==='dark'&&assets.manifest.files[id+'-dark'])return assets.getSprite(id+'-dark');
  const image=assets.getSprite(id);
  if(!image) return null;
  let versions=prepared.get(image);
  if(!versions) { versions={color:image}; prepared.set(image,versions); }
  if(theme==='dark'&&!versions.dark) versions.dark=grayAtlas(ctx,decodedPixels(ctx,image),layer==='horizon'?0:image.width,mapId==='camp');
  return versions[theme==='dark'?'dark':'color'];
}

export function landscapeNormals(ctx,atlas) {
  // Build once for each decoded terrain atlas.
  const cached=prepared.get(atlas)||{};
  if(cached.normal) return cached.normal;
  const size=atlas.width, pixels=decodedPixels(ctx,atlas).data;
  const canvas=createSpriteSurface(ctx,size,size),c=canvas.getContext('2d'), result=c.createImageData(size,size);
  const at=(x,y)=>{
    const i=(Math.min(size-1,Math.max(0,y))*size+Math.min(size-1,Math.max(0,x)))*4;
    return pixels[i]*.30+pixels[i+1]*.58+pixels[i+2]*.12;
  };
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const du=at(x+1,y)-at(x-1,y), dv=at(x,y+1)-at(x,y-1);
    const offset=(y*size+x)*4;
    // Floor markings and grout have less relief than feet and timber edges.
    result.data[offset]=128+(dv-du)*.12;
    result.data[offset+1]=180+(du+dv)*.14;
    result.data[offset+2]=242;
    result.data[offset+3]=pixels[offset+3];
  }
  c.putImageData(result,0,0);
  cached.normal=canvas;
  prepared.set(atlas,cached);
  return canvas;
}

export function drawHorizon(c,atlas,w,h,camera) {
  const width=atlas.width, packed=atlas.height>width, offset=packed?width:0, height=atlas.height-offset;
  // The painter places world (0,0) at the panorama's center.
  // Clamp only when free panning or overview would otherwise reveal the end of the painting.
  const scale=Math.max((camera?.scale??0)*(packed?5:1),w/width,h/height);
  const cropW=w/scale,cropH=h/scale;
  const left=Math.max(0,Math.min(width-cropW,width/2-(camera?.x??w/2)/scale));
  const top=Math.max(0,Math.min(height-cropH,height/2-(camera?.y??h/2)/scale));
  c.save();
  c.setMaterial?.({lighting:'protected'});
  c.imageSmoothingEnabled=false;
  if(packed)c.drawImage(atlas,left,offset+top,cropW,cropH,0,0,w,h);
  // A free-moving camera reuses one full WebGL texture instead of caching a new subframe per step.
  else c.drawImage(atlas,-left*scale,-top*scale,width*scale,height*scale);
  c.restore();
}

export function paintLandscape(surface,{atlas,edge}) {
  const c=surface.getContext('2d'), span=edge*40, width=atlas.width;
  c.save();
  c.scale(surface.width/2100,surface.height/1200);
  c.translate(1050,580);
  c.transform(1,.5,-1,.5,0,0);
  c.imageSmoothingEnabled=false;
  c.drawImage(atlas,0,0,width,width,-span,-span,span*2,span*2);
  c.restore();
}
