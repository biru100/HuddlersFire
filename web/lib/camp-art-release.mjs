// Install current art at the production boundary; authoring jobs supply their own manifest.
import { CAMPER_PART_FILES } from './camp-camper-part-files.mjs';
import { CAMPER_MOTION_RELEASE } from './camp-camper-motion-release.mjs';
import { STYLE_FILES, STYLE_FRAMES } from './camp-style-files.mjs';

export function withCampArt(manifest) {
  const sprites = {...manifest.sprites};
  for (const [id,frame] of Object.entries(STYLE_FRAMES)) {
    sprites[id] = {...sprites[id], ...frame};
  }
  // The UI and the field share this exhibit sprite under the two historic spellings.
  sprites['game-booth'] = sprites.gameBooth;
  const files={...manifest.files,...CAMPER_PART_FILES,...STYLE_FILES,...CAMPER_MOTION_RELEASE.files};
  const oldCharacters=[...(manifest.character?.variants??[]),...(manifest.character?.darkVariants??[])];
  const fallbackFiles={};
  for(const id of new Set([...oldCharacters,...oldCharacters.map(id=>manifest.materials?.sheets[id]).filter(Boolean)])){
    if(files[id]){
      fallbackFiles[id]=files[id];
      delete files[id];
    }
  }
  return {
    ...manifest, sprites,
    files, fallbackFiles,
    camperMotion: CAMPER_MOTION_RELEASE.motion,
    materials: {...manifest.materials, sheets: {...manifest.materials.sheets,
      'camp-scenery':'normal-camp-scenery','camp-scenery-dark':'normal-camp-scenery'}},
  };
}
