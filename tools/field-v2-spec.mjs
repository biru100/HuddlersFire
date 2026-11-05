// Reproducible inventory and generation prompts for the approved field replacement.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,writeJSON} from './lib/sprite-spec.mjs';
const dir=resolve(ROOT,'art/sprites/field-v2');mkdirSync(dir,{recursive:true});
const states=JSON.parse(readFileSync(resolve(ROOT,'art/sprites/camper-request.json'),'utf8')).states;
const assets={};
for(const [state,row]of Object.entries(states))assets['camper-'+state]={kind:'character',state,direction:'front',...row,width:96,action:row.action.replaceAll('camera right','screen right'),contacts:{feet:[.5,1],...(state==='sit'?{seat:[.5,.71]}:{})},head:{center:[.5,.22],radius:.205}};
for(const direction of ['back-left','back-right','front-right','front-left'])assets['sit-'+direction]={...assets['camper-sit'],frames:1,direction,action:'Seated on an INVISIBLE low bench, pelvis bearing weight, two bent legs and boots dangling below the thighs. Body faces '+direction+' in the isometric world. Blank circular portrait disc remains FULLY ROUND and SCREEN-FACING even when jacket and legs face away. '+(direction.startsWith('back')?'Show back of jacket and boots projecting UP the screen toward the fire.':'Show bib front and boots projecting DOWN the screen toward the fire.')};
const propRows=[
 ['tree',100,'round-canopy small leafy elm tree, short visible trunk, sparse coherent foliage'],
 ['tent',145,'small ochre canvas A-frame camp shelter, open triangular doorway'],
 ['lantern',35,'small brass camping lantern with softly glowing ivory glass'],
 ['radio',60,'portable teal wood radio with two round speaker grilles and ivory tuning strip'],
 ['sign',65,'timber wayfinding sign on one post, blank ivory sign face'],
 ['fence',90,'short low timber split-rail fence section, axis rises right at 26.565 degrees'],
 ['shade',120,'small open timber pergola with pale canvas roof and four slim posts'],
 ['crate',55,'open wooden toy box with colorful toy handles inside'],
 ['trampoline',100,'low round teal trampoline, dark springy mat, four legs, visible elliptical top'],
 ['football',18,'classic ivory and cocoa patched football, almost circular'],
 ['portal',100,'open timber trail gateway with two posts and rounded pale canvas top, EMPTY WALKABLE opening, tiny teal pennant, no glow, no stones'],
 ['gameBooth',180,'gallery display stand: wide timber board on two short supports with LARGE EMPTY IVORY rectangular poster area at upper center, low plinth below, no awning, no fruit, no text'],
 ['firewood',95,'low circular ring of pale camp stones around a neat short stack of split logs, no flames'],
 ['flowers',35,'small low cluster of cream and ochre daisies in green grass'],
 ['rock',28,'small cluster of two softly rounded warm gray stones']
];
for(const [target,width,action]of propRows){const id=target.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());assets[id]={kind:'prop',target,direction:'isometric',frames:1,width,action,contacts:{ground:[.5,.96]},depth:'sorted',...(target==='gameBooth'?{poster:{x:.16,y:.15,w:.68,h:.44}}:{})};}
for(const direction of ['ne','nw'])assets['bench-'+direction]={kind:'prop',target:'bench',direction,frames:1,width:110,action:'One simple TWO PERSON backless low timber bench, four short legs, continuous long flat top. Long axis '+(direction==='ne'?'rises from lower left to upper right':'descends from upper left to lower right')+' at EXACTLY 26.565 degrees. No backrest, no people, no extra planks. Height roughly one third of its width.',contacts:{ground:[.5,.98],seat:[.5,.38]},depth:'sorted'};
const effectRows={amber:'warm amber camp flame',gold:'golden yellow camp flame',blue:'soft blue camp flame',jade:'jade green camp flame',violet:'violet purple camp flame',gun:'friendly wooden teal toy water pistol pointing right',snowball:'round white snowball',bomb:'round charcoal toy bomb with short unlit cord',impact:'soft playful orange starburst puff',dust:'pale cream landing dust puff',heart:'coral pink heart',spark:'small warm gold four pointed sparkle'};
for(const [id,action]of Object.entries(effectRows))assets[id]={kind:'effect',target:id,direction:'front',frames:1,width:64,action,contacts:{ground:[.5,1]},depth:'sorted'};
for(const [id,action]of Object.entries({grass:'quiet sage green lawn with very fine sparse blades',sand:'warm pale buff compacted dirt with extremely subtle grain',stone:'pale cream gray garden stone paving with restrained irregular joint lines'}))assets[id]={kind:'terrain',target:id,direction:'none',frames:1,width:192,action:'Opaque seamless flat TOP DOWN material: '+action+'. Uniform material scale and lighting, no perspective, border, gradient, props or vignette.',contacts:{}};
const bindings={};for(let i=0;i<8;i++){const side=Math.floor(i/2),direction=side%2?'nw':'ne';bindings['log-'+i]={asset:'bench-'+direction,direction,characterDirection:['back-left','back-right','front-right','front-left'][side]};}
const cases=[];for(const map of ['camp','playground','showroom'])for(const theme of ['color','dark'])cases.push({id:map+'-'+theme,map,theme,view:'overview',width:1050,height:824,kind:'canvas',criteria:['density','wayfinding','contact','occlusion']});
for(const view of ['seats','actions','stack'])cases.push({id:'camp-'+view,map:view==='actions'||view==='stack'?'playground':'camp',view,width:1050,height:824,kind:'canvas',criteria:['contact','direction','portrait','occlusion']});
for(const [id,width,height]of [['desktop',1280,900],['mobile',390,844]])for(const view of ['ui','field'])cases.push({id:'ui-'+id+(view==='field'?'-field':''),map:'camp',view,width,height,kind:'ui',criteria:['ui-hierarchy','occlusion','readability']});
const spec={version:2,id:'field-v2',intentIds:['INT-03','INT-04','INT-07','INT-09','INT-12','INT-16','INT-17','INT-18'],style:{medium:'Polished storybook game illustration, soft chalky gouache fills with restrained fine texture, clean silhouettes, thin warm charcoal contours; no glossy plastic or pixel art',view:'Elevated three quarter props on 2:1 isometric ground. Circular avatar portraits always screen-facing',light:'Soft ambient daylight, mild upper-left highlights; no baked floor or cast shadows',character:'Blank circular ivory portrait disc, teal canvas jacket, ochre short overalls, cream mitten hands and cocoa ankle boots. Match NEW reference identity exactly',reference:'art/sprites/field-v2/master.png'},assets,bindings,cases};
writeJSON(resolve(dir,'spec.json'),spec);
writeJSON(resolve(ROOT,'art/sprites/scene-spec.json'),spec);
const style=spec.style.medium+'. '+spec.style.view+'. '+spec.style.light+'. Match only the paint and palette of the attached NEW reference. Genuine transparent background, no floor, haze, cast shadows, writing, labels, watermark or grid lines. Keep EVERY object fully inside its cell with generous empty margins, never touching neighbours. Equal-size grid cells; exact object count, row-major order. ';
const groups=[
 {id:'environment',cols:3,rows:5,ids:propRows.map(([id])=>id.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()))},
 {id:'benches',cols:2,rows:1,ids:['bench-ne','bench-nw']},
 {id:'effects',cols:4,rows:3,ids:Object.keys(effectRows)},
 {id:'terrain',cols:3,rows:1,ids:['grass','sand','stone']},
 {id:'seated',cols:4,rows:1,ids:['back-left','back-right','front-right','front-left'].map(d=>'sit-'+d)},
 {id:'idle',cols:4,rows:1,ids:['camper-idle']}
];
for(const group of groups){group.prompt=style+'\n'+(group.id==='terrain'?'THREE OPAQUE SQUARE SEAMLESS TEXTURES, exactly three equal square cells, no margins between cells.':'SPRITE SHEET exactly '+group.cols+' columns and '+group.rows+' rows. Each cell is isolated on transparent alpha.')+'\n'+group.ids.map((id,i)=>`Cell ${i+1}: ${assets[id].action}`).join('\n');if(group.id==='idle')group.prompt=style+'\nExactly FOUR equal horizontal cells showing the same full reference character relaxed standing front-facing. Small breathing movement only, feet planted, blank circular ivory head. Identical size and baseline in all four cells. No face.';if(group.id==='seated')group.prompt+='\nUse the attached character identity. Each cell has ONE character with blank round ivory portrait disc. No benches. All characters at same scale, no faces.';}
writeJSON(resolve(dir,'generation-plan.json'),{groups});
console.log(JSON.stringify({assets:Object.keys(assets).length,groups:groups.map(g=>g.id)}));
