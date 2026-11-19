import {createSpriteSurface} from './camp-sprite-assets.mjs';

// The square top frame maps to the complete walkable island. The lower strip is the horizon.
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
    output.data[i+3]=255;
  }
  c.putImageData(output,0,0);
  return canvas;
}

export function landscapeFor(ctx,assets,mapId,theme,pixelMode) {
  const id='landscape-'+mapId;
  if(pixelMode==='candidates'||!assets.manifest?.files?.[id]) return null;
  const image=assets.getSprite(id);
  if(!image) return null;
  let versions=prepared.get(image);
  if(!versions) { versions={color:image}; prepared.set(image,versions); }
  if(theme==='dark'&&!versions.dark) versions.dark=grayAtlas(ctx,decodedPixels(ctx,image),image.width,mapId==='camp');
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
    result.data[offset]=128+(dv-du)*.24;
    result.data[offset+1]=180+(du+dv)*.28;
    result.data[offset+2]=242;
    result.data[offset+3]=255;
  }
  c.putImageData(result,0,0);
  cached.normal=canvas;
  prepared.set(atlas,cached);
  return canvas;
}

export function drawHorizon(c,atlas,w,h) {
  // Crop the panoramic sides on a narrow phone and retain the depth of the ridgelines.
  const width=atlas.width, crop=width*Math.min(1,w/(h*1.55));
  c.save();
  c.setMaterial?.({lighting:'protected'});
  c.imageSmoothingEnabled=false;
  c.drawImage(atlas,(width-crop)/2,width,crop,atlas.height-width,0,0,w,h);
  c.restore();
}

const sides={
  camp:['#4b4634','#767045'],playground:['#64553c','#8a8956'],showroom:['#807560','#ac997b']
};
export function paintLandscape(surface,{atlas,mapId,edge,dark=false,normal=false}) {
  const c=surface.getContext('2d'), span=edge*40, width=atlas.width;
  c.save();
  c.scale(surface.width/2100,surface.height/1200);
  c.translate(1050,580);
  const colors=normal?['#8095e8','#80a5ed']:dark?['#343434','#444444']:sides[mapId];
  for(const [i,drop] of [12,5].entries()) {
    c.save(); c.translate(0,drop); c.transform(1,.5,-1,.5,0,0);
    c.beginPath(); c.roundRect(-span,-span,2*span,2*span,80);
    c.fillStyle=colors[i]; c.fill(); c.restore();
  }
  c.transform(1,.5,-1,.5,0,0);
  c.beginPath(); c.roundRect(-span,-span,2*span,2*span,80); c.clip();
  c.imageSmoothingEnabled=false;
  c.drawImage(atlas,0,0,width,width,-span,-span,span*2,span*2);
  c.restore();
}
