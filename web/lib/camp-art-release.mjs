// Install current art at the production boundary; authoring jobs supply their own manifest.
import { CAMPER_ART_FILES } from './camp-camper-art.mjs';
import { STYLE_FILES, STYLE_FRAMES } from './camp-style-files.mjs';

export function withCampArt(manifest) {
  const sprites = {...manifest.sprites};
  for (const [id,frame] of Object.entries(STYLE_FRAMES)) {
    sprites[id] = {...sprites[id], ...frame};
  }
  // The UI and the field share this exhibit sprite under the two historic spellings.
  sprites['game-booth'] = sprites.gameBooth;
  return {
    ...manifest, sprites,
    files: {...manifest.files,...CAMPER_ART_FILES,...STYLE_FILES},
    materials: {...manifest.materials, sheets: {...manifest.materials.sheets,
      'camp-scenery':'normal-camp-scenery','camp-scenery-dark':'normal-camp-scenery'}},
  };
}
