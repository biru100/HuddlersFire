import {loadImage,createCanvas} from '@napi-rs/canvas';
import {fileURLToPath} from 'node:url';
import {setSpriteLoader,setSpriteCanvasFactory,preloadSprites,spriteManifest} from '../lib/camp-sprite-assets.mjs';
setSpriteLoader(url=>loadImage(fileURLToPath(new URL('../public'+url,import.meta.url))),{cacheLimit:64});
setSpriteCanvasFactory(createCanvas);
await preloadSprites(Object.keys(spriteManifest.files));
