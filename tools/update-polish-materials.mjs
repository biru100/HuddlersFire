import {resolve} from 'node:path';
import {ROOT,readJSON,writeJSON} from './lib/sprite-spec.mjs';
const spec=readJSON(resolve(ROOT,'art/sprites/runs/scene-polish-v1/baseline/art/sprites/material-spec.json'));
spec.id='field-polish-v1';spec.baseRelease='art/sprites/field-polish-v1/artwork';spec.surfaces.tree.height=4.5;spec.surfaces.tent.height=2;
for(const id of ['tree-birch','tree-pine'])spec.surfaces[id]={...spec.surfaces.tree};
for(const direction of ['ne','nw'])spec.surfaces['bench-weathered-'+direction]={...spec.surfaces['bench-'+direction]};
writeJSON(resolve(ROOT,'art/sprites/material-spec.json'),spec);console.log('Updated source-bound material recipes');
