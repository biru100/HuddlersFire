// Add the live art only at the production entry point. Authoring/archived
// contexts pass their own manifests, with their original file tables intact.
import { CAMPER_ART_FILES } from './camp-camper-art.mjs';
import { CAMP_CLEARING_FILES } from './camp-clearing-files.mjs';

export function withCampArt(manifest) {
  return { ...manifest, files: { ...manifest.files, ...CAMPER_ART_FILES, ...CAMP_CLEARING_FILES } };
}
