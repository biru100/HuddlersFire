import { withCampArt } from './camp-art-release.mjs';
import { SPRITE_MANIFEST as originalManifest } from './camp-sprite-manifest.mjs';
import {spriteImageMetadata,spriteMaterial} from './camp-materials.mjs';
import {snapPixelOrigin} from './camp-pixel.mjs';
import {drawFrameRegions} from './camp-prop-geometry.mjs';
let canvasFactory=null;
export const spriteManifest = withCampArt(originalManifest);
export function setSpriteCanvasFactory(value){canvasFactory=value;}
export function createSpriteSurface(ctx,w,h){if(canvasFactory)return canvasFactory(w,h);const doc=ctx.canvas.ownerDocument||globalThis.document;if(doc){const canvas=doc.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;}if(globalThis.OffscreenCanvas)return new globalThis.OffscreenCanvas(w,h);return new ctx.canvas.constructor(w,h);}
function browserLoad(url){return new Promise((resolve,reject)=>{const ImageType=globalThis.Image;if(!ImageType){reject(Error('Image decoder unavailable'));return;}const image=new ImageType();image.onload=()=>{image.onload=image.onerror=null;resolve(image);};image.onerror=()=>{image.onload=image.onerror=null;reject(Error('Sprite image could not be loaded'));};image.src=url;});}
/** Preview manifests and caches never replace the shipped registry. */
export function createSpriteContext(data,{loader:initialLoader=null,cacheLimit:initialLimit=16}={}){
  const entries=new Map(),listeners=new Set();let loader=initialLoader,cacheLimit=Math.max(initialLimit,data.preview?.pixelQuarterview?32:0),clock=0;
  const notify=()=>{for(const listener of listeners)listener();};
  const api={manifest:data,
    setSpriteLoader(value,options={}){loader=value;cacheLimit=options.cacheLimit||initialLimit;entries.clear();},
    subscribeSprites(listener){listeners.add(listener);return()=>listeners.delete(listener);},
    loadSprite(id){
      if(!data.files[id])return Promise.resolve(null);
      let entry=entries.get(id);if(entry){entry.used=++clock;return entry.promise;}
      entry={image:null,error:null,used:++clock,promise:null};entries.set(id,entry);
      entry.promise=Promise.resolve().then(()=>(loader||browserLoad)(data.files[id].url)).then(image=>{if(entries.get(id)===entry){entry.image=image;spriteImageMetadata.set(image,{assets:api,id});const sorted=[...entries].filter(([,e])=>e.image).sort((a,b)=>a[1].used-b[1].used);for(const [key]of sorted){if(entries.size<=cacheLimit)break;entries.delete(key);}notify();}return image;},error=>{entry.error=String(error);notify();return null;});return entry.promise;
    },
    getSprite(id){const entry=entries.get(id);if(entry){entry.used=++clock;return entry.image;}void api.loadSprite(id);return null;},
    preloadSprites(ids){return Promise.all(ids.map(api.loadSprite));},
    spriteStatus(ids){return {loading:ids.some(id=>!entries.get(id)?.image&&!entries.get(id)?.error),failed:ids.filter(id=>entries.get(id)?.error)};},
    retrySprites(ids){for(const id of ids)if(entries.get(id)?.error)entries.delete(id);return api.preloadSprites(ids);},
    sceneSpriteIds(theme='color', map='camp'){
      const dark=theme==='dark', suffix=dark?'-dark':'';
      const ids=[...data.character[dark?'darkVariants':'variants'], 'environment'+suffix, 'effects'+suffix, (map==='showroom'?'stone':'grass')+suffix];
      if(map==='camp'||map==='playground') ids.push('sand'+suffix);
      if(data.files['field-camper-v2'+suffix]) ids.push('field-camper-v2'+suffix);
      if(data.files['field-camper-walk']) ids.push('field-camper-walk');
      if(map==='camp' && data.files['camp-clearing-art'+suffix]) ids.push('camp-clearing-art'+suffix, 'normal-camp-clearing-art');
      if(data.files['landscape-'+map]) ids.push('landscape-'+map);
      const horizon='horizon-'+map;
      if(data.files[horizon]) ids.push(data.files[horizon+suffix]?horizon+suffix:horizon);
      if(data.files['camp-scenery'+suffix]) ids.push('camp-scenery'+suffix);
      ids.push(...(data.previewFiles||[]));
      return [...new Set([...ids,...ids.map(id=>data.materials?.sheets[id]).filter(Boolean)])];
    },
    characterSheet(slot,theme='color'){return data.character[theme==='dark'?'darkVariants':'variants'][Math.max(0,Math.min(5,slot|0))];},
    spriteFrame(id,direction){const base=data.sprites[id];if(direction){if(base?.direction===direction&&!base.directions)return base;const variant=base?.directions?.[direction];if(!variant)throw Error('Missing sprite direction: '+id+'/'+direction);return data.sprites[variant];}return base;},
    drawSprite(ctx,id,{x=0,y=0,width=64,height=null,anchorX=null,anchorY=null,theme='color',flip=false,direction=null,layer=null,regions=null,elapsed=0,reduced=false}={}){
      let frame=api.spriteFrame(id,direction);if(!frame)return false;
      if(frame.animation){const row=frame.animation,total=row.durations.reduce((n,v)=>n+v,0);let time=reduced?0:row.loop?((elapsed%total)+total)%total:Math.min(total-1,Math.max(0,elapsed)),index=0;while(index<row.frames.length-1&&time>=row.durations[index])time-=row.durations[index++];frame=row.frames[index];}
      const sheet=frame.sheet+(theme==='dark'&&!frame.ungraded?'-dark':''),image=api.getSprite(sheet);if(!image)return false;
      if(layer&&frame.depth!==layer)return false;
      const h=height??width*frame.h/frame.w,ground=frame.contacts?.ground;
      const ax=anchorX??(ground?ground.x/frame.w:.5),ay=anchorY??(ground?ground.y/frame.h:1);
      ctx.save();ctx.setMaterial?.(spriteMaterial(api,sheet,id,direction));ctx.translate(x,y);if(frame.sampling==='nearest'){ctx.imageSmoothingEnabled=false;snapPixelOrigin(ctx);}if(flip)ctx.scale(-1,1);drawFrameRegions(ctx,image,frame.x,frame.y,frame.w,frame.h,-width*ax,-h*ay,width,h,regions);ctx.restore();return true;
    },
  };return api;
}
export const defaultSpriteAssets=createSpriteContext(spriteManifest,{cacheLimit:24});
export const {setSpriteLoader,subscribeSprites,loadSprite,getSprite,preloadSprites,spriteStatus,retrySprites,sceneSpriteIds,characterSheet,drawSprite}=defaultSpriteAssets;
