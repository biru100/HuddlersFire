// Save measured draft anchors for inspection, then rebuild before visual review.
import {dirname,resolve} from 'node:path';
import {readJSON,writeJSON,loadJob} from './lib/sprite-spec.mjs';
const file=resolve(process.argv[2]),job=loadJob(file),dir=dirname(file),measurements=readJSON(resolve(dir,'build/measurements.json')),annotations={};
const built=readJSON(resolve(dir,'build/preview.json'));
for(const id of job.selected.filter(id=>job.spec.assets[id].kind==='character'))annotations[id]={sourceHash:built.inputs[id],frameAnchors:measurements[id].map(({bounds:b,head:h})=>({head:{center:[(h.x-b.x)/b.w,(h.y-b.y)/b.h],radius:h.radius/b.h}}))};
writeJSON(resolve(dir,'annotations.json'),annotations);console.log('Frozen measured anchors; rebuild and inspect source/mixed/scene screenshots before review.');
