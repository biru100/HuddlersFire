import { SPRITE_MANIFEST as manifest } from './camp-sprite-manifest.mjs';
import {spriteImageMetadata,spriteMaterial} from './camp-materials.mjs';
let canvasFactory=null;
export { manifest as spriteManifest };
export function setSpriteCanvasFactory(value){canvasFactory=value;}
export function createSpriteSurface(ctx,w,h){if(canvasFactory)return canvasFactory(w,h);const doc=ctx.canvas.ownerDocument||globalThis.document;if(doc){const canvas=doc.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;}if(globalThis.OffscreenCanvas)return new globalThis.OffscreenCanvas(w,h);return new ctx.canvas.constructor(w,h);}
function browserLoad(url){return new Promise((resolve,reject)=>{const ImageType=globalThis.Image;if(!ImageType){reject(Error('Image decoder unavailable'));return;}const image=new ImageType();image.onload=()=>{image.onload=image.onerror=null;resolve(image);};image.onerror=()=>{image.onload=image.onerror=null;reject(Error('Sprite image could not be loaded'));};image.src=url;});}
/** Preview manifests and caches never replace the shipped registry. */
export function createSpriteContext(data,{loader:initialLoader=null,cacheLimit:initialLimit=16}={}){
  const entries=new Map(),listeners=new Set();let loader=initialLoader,cacheLimit=initialLimit,clock=0;
  const notify=()=>{for(const listener of listeners)listener();};
  const api={manifest:data,
    setSpriteLoader(value,options={}){loader=value;cacheLimit=options.cacheLimit||16;entries.clear();},
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
    sceneSpriteIds(theme='color',map='camp'){const dark=theme==='dark',suffix=dark?'-dark':'';const ids=[...data.character[dark?'darkVariants':'variants'],'environment'+suffix,'effects'+suffix,(map==='showroom'?'stone':'grass')+suffix,...(map==='camp'||map==='playground'?['sand'+suffix]:[]),...(data.previewFiles||[])];return [...new Set([...ids,...ids.map(id=>data.materials?.sheets[id]).filter(Boolean)])];},
    characterSheet(slot,theme='color'){return data.character[theme==='dark'?'darkVariants':'variants'][Math.max(0,Math.min(5,slot|0))];},
    spriteFrame(id,direction){const base=data.sprites[id];if(direction){const variant=base?.directions?.[direction];if(!variant)throw Error('Missing sprite direction: '+id+'/'+direction);return data.sprites[variant];}return base;},
    drawSprite(ctx,id,{x=0,y=0,width=64,height=null,anchorX=null,anchorY=null,theme='color',flip=false,direction=null,layer=null}={}){
      const frame=api.spriteFrame(id,direction);if(!frame)return false;const sheet=frame.sheet+(theme==='dark'&&!frame.ungraded?'-dark':''),image=api.getSprite(sheet);if(!image)return false;
      if(layer&&frame.depth!==layer)return false;
      const h=height??width*frame.h/frame.w,ground=frame.contacts?.ground;
      const ax=anchorX??(ground?ground.x/frame.w:.5),ay=anchorY??(ground?ground.y/frame.h:1);
      ctx.save();ctx.setMaterial?.(spriteMaterial(api,sheet,id,direction));ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,-width*ax,-h*ay,width,h);ctx.restore();return true;
    },
  };return api;
}
export const defaultSpriteAssets=createSpriteContext(manifest);
export const {setSpriteLoader,subscribeSprites,loadSprite,getSprite,preloadSprites,spriteStatus,retrySprites,sceneSpriteIds,characterSheet,drawSprite}=defaultSpriteAssets;
