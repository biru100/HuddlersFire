import '../tests/sprite-fixture.mjs';
import {setSpriteLoader,preloadSprites,spriteManifest} from '../lib/camp-sprite-assets.mjs';
import {readCamperCandidate} from './camper-review-assets.mjs';

const candidate=readCamperCandidate();
Object.assign(spriteManifest.files,candidate.files);
setSpriteLoader(candidate.load,{cacheLimit:64});
const images=await preloadSprites(Object.keys(spriteManifest.files));
if(images.some(image=>!image))throw Error('Incomplete candidate preview');
