import {copyFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,readJSON,writeJSON} from './lib/sprite-spec.mjs';
import {prepareJob} from './prepare-sprite-job.mjs';
const spec=readJSON(resolve(ROOT,'art/sprites/runs/scene-polish-v1/baseline/art/sprites/scene-spec.json'));
spec.id='field-polish-v1';spec.intentIds.push('INT-20');
for(const [id,action]of [
 ['tree-birch','One graceful small silver birch with two pale ivory trunks and an airy asymmetric crown of sage and olive leaves. Elevated three-quarter view, clear trunk ground contact. Painted at the SAME detail density as the reference elm, no floor or shadow.'],
 ['tree-pine','One compact mountain pine with three irregular layered bough masses, muted deep teal-green needles and a short cocoa trunk. Asymmetric storybook silhouette, clear ground contact. Same paint and contour density as the reference elm.'],
 ['bench-weathered-ne','One TWO PERSON backless low timber bench, four short legs, one broad flat seat. Its long axis rises from lower left to upper right at 26.565 degrees. Warm weathered cocoa wood, rounded uneven ends and two subtle wood knots. No moss on the seat, no people. Preserve the reference bench proportions and seat plane.'],
 ['bench-weathered-nw','One TWO PERSON backless low timber bench, four short legs, one broad flat seat. Its long axis falls from upper left to lower right at 26.565 degrees. Warm weathered cocoa wood, rounded uneven ends and two subtle wood knots. No moss on the seat, no people. Preserve the reference bench proportions and seat plane.'],
]){
 const bench=id.startsWith('bench'),direction=bench?id.endsWith('ne')?'ne':'nw':'isometric';
 spec.assets[id]={kind:'prop',target:id,direction,frames:1,width:bench?110:180,action,contacts:bench?{ground:[.5,.98],seat:[.5,.38]}:{ground:[.5,.96]},depth:'sorted'};
}
for(const [state,frames,fps,action]of [['idle',4,4,'subtle breathing, feet planted, arms relaxed'],['walk',6,8,'walking in place, alternating feet and opposite arms, full loop'],['run',6,12,'running in place, wider stride and opposing bent arms, full loop']]){
 spec.assets['camper-'+state+'-back']={...structuredClone(spec.assets['camper-'+state]),direction:'back',frames,fps,action:'Exact same reference camper seen from BEHIND in three-quarter view, facing diagonally UP and RIGHT; show teal BACK of jacket, ochre short trouser legs and cocoa boots. No front bib pocket visible. Round blank portrait disc remains circular. '+action+'. Fixed head diameter and clothing identity across all frames.'};
}
for(const [id,color]of [['amber','amber orange with pale yellow core'],['gold','golden yellow with warm ivory core'],['blue','soft blue with pale blue-white core'],['jade','jade green with pale mint core'],['violet','violet purple with pale lavender core']])Object.assign(spec.assets[id],{frames:6,fps:9,loop:true,action:'Six-frame seamless camp flame animation, '+color+'. A low broad root stays fixed at the SAME ground baseline in every cell. Two or three flame tongues stretch, curl and separate asymmetrically; naturally different silhouettes, not simply scaled copies. First and last frames connect smoothly. ONLY flame, no logs, stones, ground, light halo, smoke or stray particles.'});
writeJSON(resolve(ROOT,'art/sprites/scene-spec.json'),spec);
const dir=resolve(ROOT,'art/sprites/runs/scene-polish-assets');
if(!existsSync(resolve(dir,'job.json'))){
 prepareJob({specFile:resolve(ROOT,'art/sprites/scene-spec.json'),selected:Object.keys(spec.assets),scope:'revision',reuseFrom:'art/sprites/field-v2/release',out:'scene-polish-assets'});
 const job=readJSON(resolve(dir,'job.json'));for(const [id,entry]of Object.entries(job.reusedSources))copyFileSync(resolve(ROOT,entry.path),resolve(dir,'source/'+id+'.png'));
 writeJSON(resolve(dir,'generation-plan.json'),{tool:'built-in image_gen',newAssets:job.selected.filter(id=>!job.reusedSources[id]),reuseCount:Object.keys(job.reusedSources).length});
 console.log('Prepared revision with '+Object.keys(job.reusedSources).length+' explicit reused sources');
}else console.log('Asset job already prepared');
