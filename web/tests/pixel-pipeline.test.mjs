import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT,readJSON,writeJSON,hash} from '../../tools/lib/sprite-spec.mjs';
import {validatePixelCatalog,preparePixelJob,loadPixelJob,buildPixelJob,verifyPixelReview,pixelAssetRequest,verifyNormalizedEntry} from '../../tools/lib/pixel-assets.mjs';
import {inspectAvatarCombination,readAvatarDraft,saveAvatarDraft,PIXEL_DIRECTIONS} from '../lib/camp-avatar-assembly.mjs';
import {pixelPropDisplay,snapPixelOrigin} from '../lib/camp-pixel.mjs';
import {createSpriteContext} from '../lib/camp-sprite-assets.mjs';
import {nearestFrame,draftPalette,normalizePixelAsset} from '../../tools/lib/pixel-normalize.mjs';
const catalog=readJSON(resolve(ROOT,'art/sprites/pixel-quarterview/catalog.json')),spec=readJSON(resolve(ROOT,'art/sprites/scene-spec.json')).pixelQuarterview;
test('pixel preview honors a larger explicit cache so before/after captures contain all legacy assets',async()=>{
 const files=Object.fromEntries(Array.from({length:80},(_,i)=>['sheet-'+i,{url:String(i)}])),assets=createSpriteContext({files,preview:{pixelQuarterview:true}},{cacheLimit:128,loader:async()=>({width:2,height:2})});
 await assets.preloadSprites(Object.keys(files));assert.deepEqual(assets.spriteStatus(Object.keys(files)),{loading:false,failed:[]});
});
test('pixel world directions project onto the actual NW NE SW SE axes',async()=>{
 const {projectWorld}=await import('../lib/camp-scene-frame.mjs');assert.deepEqual(Object.fromEntries(Object.entries(PIXEL_DIRECTIONS).map(([d,[x,y]])=>[d,projectWorld(x,y)])),{NW:[-40,-20],NE:[40,-20],SW:[-40,20],SE:[40,20]});
});
test('all imported candidates remain unapproved; false approval and traversal are rejected',()=>{
 assert.equal(validatePixelCatalog(catalog).assets.filter(a=>a.file.includes('/incoming/v0.1/')).length,69);assert.equal(catalog.assets.filter(a=>a.status==='usable_as_is').length,0);
 const c=structuredClone(catalog);c.assets[0].status='usable_as_is';assert.throws(()=>validatePixelCatalog(c),/Approval/);c.assets[0].status='needs_redraw';c.assets[0].file='../outside.png';assert.throws(()=>validatePixelCatalog(c),/outside/);
});
test('single-frame normalization uses exact nearest samples, binary alpha and declared RGB only',()=>{
 const pixels=new Uint8ClampedArray(8*8*4);for(let y=0;y<8;y++)for(let x=0;x<8;x++)pixels.set([x*30,y*30,20,x===3?127:254],(y*8+x)*4);
 const recipe={canvas:[4,4],alphaThreshold:128,translate:[0,0]},before=Buffer.from(pixels),raw=nearestFrame(pixels,8,8,recipe),palette=[[0,0,0],[255,255,255]],normalized=nearestFrame(pixels,8,8,{...recipe,palette});
 assert.deepEqual(Buffer.from(pixels),before);assert.deepEqual([...raw.raw.slice(0,4)],[30,30,20,254]);
 for(let i=0;i<normalized.output.length;i+=4){assert.ok([0,255].includes(normalized.output[i+3]));if(normalized.output[i+3])assert.ok(palette.some(p=>p.every((n,j)=>n===normalized.output[i+j])));else assert.deepEqual([...normalized.output.slice(i,i+4)],[0,0,0,0]);}
 assert.deepEqual(draftPalette(raw.output),draftPalette(raw.output));assert.throws(()=>nearestFrame(pixels,8,8,{...recipe,canvas:[3,4]}),/uniform/);assert.throws(()=>nearestFrame(pixels,8,8,{...recipe,translate:[0,10]}),/clip/);
});
test('registered NW idle derivative is reproducible and remains blocked for every missing pose/direction',async()=>{
 const entry=catalog.assets.find(a=>a.id==='characters.body_nw_idle_v1');assert.ok(entry);const before=Buffer.from(readFileSync(resolve(ROOT,entry.source))),runs=resolve(ROOT,'art/sprites/runs'),temporary=mkdtempSync(join(runs,'pixel-normalize-')),id=temporary.split(/[\\/]/).at(-1),output=resolve(ROOT,'art/sprites/pixel-quarterview/derived',id);
 try{const recipe=readJSON(resolve(ROOT,entry.normalization.recipe));recipe.id=id;const file=join(temporary,'recipe.json');writeFileSync(file,JSON.stringify(recipe,null,4).replaceAll('\n','\r\n'));const result=await normalizePixelAsset(file);assert.equal(result.recipeSha256,hash(recipe));assert.equal(result.sourcePreserved,true);assert.deepEqual(readFileSync(resolve(ROOT,entry.source)),before);assert.equal(result.outputs['body-nw-idle.png'],readJSON(resolve(ROOT,entry.normalization.report)).outputs['body-nw-idle.png']);}
 finally{for(const [base,p]of [[runs,temporary],[resolve(ROOT,'art/sprites/pixel-quarterview/derived'),output]]){assert.ok(p.startsWith(base+sep));rmSync(p,{recursive:true,force:true});}}
 const draft={version:1,parts:{base:entry.id}};const current=inspectAvatarCombination(draft,catalog,'NW','idle',spec.avatar);assert.equal(current.ready,false);assert.ok(current.reasons.every(r=>r.endsWith(':not_approved')));assert.deepEqual(current.layers,[]);
 for(const d of ['NE','SW','SE'])assert.ok(inspectAvatarCombination(draft,catalog,d,'idle',spec.avatar).reasons.some(r=>r.includes('missing_')));for(const state of ['walk','sit_bench','emote'])assert.ok(inspectAvatarCombination(draft,catalog,'NW',state,spec.avatar).reasons.some(r=>r.includes('missing_')));
 const request=pixelAssetRequest({catalog,spec});assert.ok(request.includes(entry.file));assert.ok(request.includes('head=[32,28]'));assert.ok(request.includes('idle을 각각 한 장씩'));
});
test('normalization metadata cannot be reused with a different source receipt',()=>{
 const entry=structuredClone(catalog.assets.find(a=>a.id==='characters.body_nw_idle_v1'));assert.equal(verifyNormalizedEntry(entry).productionApproved,false);entry.normalization.sourceSha256='0'.repeat(64);assert.throws(()=>verifyNormalizedEntry(entry),/mismatched normalization/);
});
test('provided hair and clothes cannot be assembled or mirrored into missing directions',()=>{
 const draft={version:1,parts:{base:'characters.base_stand_front_left',hair:'characters.hair_bob',top:'characters.top_hoodie'}};
 for(const d of Object.keys(PIXEL_DIRECTIONS))for(const state of ['idle','walk','sit_bench','emote']){const result=inspectAvatarCombination(draft,catalog,d,state,spec.avatar);assert.equal(result.ready,false);assert.deepEqual(result.layers,[]);assert.ok(result.reasons.some(r=>r.includes('missing_')));}
});
function compatible(){
 const variant={canvas:[4,4],frames:[{layers:[{name:'base',rect:[0,0,4,4]}]}],durations:[1000],frameAnchors:[{feet:[2,3],head:[2,1],seat:[2,2]}],pixelGrid:1,paletteId:'p'};
 const base={id:'base.ok',slot:'base',size:[4,4],status:'usable_as_is',paletteId:'p',variants:{NW:{idle:structuredClone(variant)}}};variant.frames[0].layers[0].name='front_hair';
 const hair={id:'hair.ok',slot:'hair',size:[4,4],status:'usable_as_is',paletteId:'p',variants:{NW:{idle:variant}}};return {version:1,assets:[base,hair],palettes:{}};
}
test('compatible synthetic layers pass; frame timing, canvas, anchors and crops cannot be silently fitted',()=>{
 const draft={version:1,parts:{base:'base.ok',hair:'hair.ok'}},contract={states:{idle:{frames:1,durations:[1000]}}};
 assert.equal(inspectAvatarCombination(draft,compatible(),'NW','idle',contract).ready,true);
 for(const mutate of [v=>v.canvas=[3,4],v=>v.durations=[900],v=>v.frameAnchors[0].head=[1,1],v=>v.frames[0].layers[0].rect=[1,0,4,4],v=>v.pixelGrid=2,v=>v.paletteId='other']){const c=compatible();mutate(c.assets[1].variants.NW.idle);const result=inspectAvatarCombination(draft,c,'NW','idle',contract);assert.equal(result.ready,false);assert.deepEqual(result.layers,[]);}
});
test('draft persistence filters unknown IDs, handles unavailable storage and preserves online identity',()=>{
 const player={avatar:'https://cdn.discordapp.com/avatars/1/abc.png?size=64',name:'Camper',color:'#fff'},before=JSON.stringify(player),memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 const saved=saveAvatarDraft(storage,{version:1,parts:{base:'characters.base_stand_front_left',hair:'bad'},profilePhotoMode:'remove',avatar:'evil'},catalog);assert.equal(saved.saved,true);assert.equal(readAvatarDraft(storage,catalog).parts.hair,null);assert.equal(saved.draft.profilePhotoMode,'preserve');assert.equal(saved.draft.scope,'local-draft');assert.equal(JSON.stringify(player),before);
 assert.equal(saveAvatarDraft({setItem(){throw Error('denied');}},saved.draft,catalog).saved,false);assert.equal(readAvatarDraft({getItem(){return '{bad';}},catalog).parts.base,null);
});
test('pixel field flag is map-scoped, keeps invalid benches out and preserves geometry',()=>{
 const item={type:'tree',x:-9,y:-3,r:.42},before=JSON.stringify(item),assets={manifest:{pixelQuarterview:{overrides:[{id:'tree',type:'tree',width:150,status:'needs_anchor',match:{x:-9,y:-3}}]}},spriteFrame:()=>({w:210,h:240})};
 assert.equal(pixelPropDisplay(assets,item,'camp','off'),null);assert.equal(pixelPropDisplay(assets,item,'showroom','candidates'),null);assert.equal(pixelPropDisplay(assets,item,'camp','approved'),null);assert.equal(pixelPropDisplay(assets,item,'camp','candidates').width,150);assert.equal(JSON.stringify(item),before);assets.manifest.pixelQuarterview.overrides[0].status='needs_redraw';assert.equal(pixelPropDisplay(assets,item,'camp','candidates'),null);
});
test('pixel snapping aligns the device origin without changing the world scale',()=>{
 const c=createCanvas(8,8).getContext('2d');c.setTransform(1.25,0,0,1.25,.3,.6);snapPixelOrigin(c);const m=c.getTransform();assert.ok(Math.abs(m.e)<1e-6&&Math.abs(m.f-1)<1e-6);assert.equal(m.a,1.25);
});
test('changed originals invalidate jobs; unresolved pixel evidence cannot pass the review gate',async()=>{
 const runs=resolve(ROOT,'art/sprites/runs');mkdirSync(runs,{recursive:true});const dir=mkdtempSync(join(runs,'pixel-contract-')),prefix=dir.slice(ROOT.length).replaceAll('\\','/');
 try{const image=createCanvas(4,4);image.getContext('2d').fillRect(0,0,4,4);const file=prefix+'/source.png';writeFileSync(resolve(ROOT,file),image.toBuffer('image/png'));const c={version:1,assets:[{id:'test.one',file,source:file,size:[4,4],status:'needs_anchor',reason:'test',projection:'unverified',grid:'unverified',ground:[2,3]}]};const catalogFile=join(dir,'catalog.json');writeJSON(catalogFile,c);const out=prefix.split('/').at(-1)+'/job',prepared=preparePixelJob({catalogFile,out}),job=join(prepared,'job.json');await buildPixelJob(job);writeJSON(join(prepared,'evidence.json'),{fingerprint:'stale'});assert.throws(()=>verifyPixelReview(job,join(prepared,'review.template.json')),/Stale/);writeFileSync(resolve(ROOT,file),Buffer.from(readFileSync(resolve(ROOT,file))).subarray(0,40));assert.throws(()=>loadPixelJob(job),/changed/);
 }finally{const target=resolve(dir);assert.ok(target.startsWith(runs+sep));rmSync(target,{recursive:true,force:true});}
});
test('package import preserves bytes, defaults to reference-only and refuses overwrite or traversal',()=>{
 const runs=resolve(ROOT,'art/sprites/runs'),dir=mkdtempSync(join(runs,'pixel-import-')),name='test-'+dir.split(/[\\/]/).at(-1),dest=resolve(ROOT,'art/sprites/pixel-quarterview/incoming',name);
 try{
  for(const p of ['assets/source','assets/candidates/test','docs'])mkdirSync(join(dir,p),{recursive:true});
  for(const p of ['START_HERE.md','docs/ART_DIRECTION.md','docs/HARNESS_IMPLEMENTATION.md','docs/CUSTOMIZATION_SPEC.md','docs/ASSET_ISSUES.md','docs/QA_CHECKLIST.md'])writeFileSync(join(dir,p),'fixture');
  const canvas=createCanvas(4,4);canvas.getContext('2d').fillRect(0,0,4,4);const png=canvas.toBuffer('image/png');for(const p of ['assets/source/characters.png','assets/source/environment.png','assets/source/scene_mood.png','assets/candidates/test/one.png'])writeFileSync(join(dir,p),png);
  const file='assets/candidates/test/one.png',source_file='assets/source/characters.png';writeJSON(join(dir,'assets/candidate_manifest.json'),{assets:[{asset_id:'test.one',file,source_file,size_px:[4,4],source_crop_px:[0,0,4,4]}]});writeJSON(join(dir,'assets/extraction_boxes.json'),{});
  const run=extra=>spawnSync(process.execPath,[resolve(ROOT,'tools/import-pixel-package.mjs'),'--source',dir,'--name',extra||name],{cwd:ROOT,encoding:'utf8',windowsHide:true});
  assert.equal(run().status,0);assert.deepEqual(readFileSync(join(dest,file)),png);assert.equal(readJSON(join(dest,'catalog.draft.json')).assets[0].status,'reference_only');assert.notEqual(run().status,0);assert.notEqual(run('../escape').status,0);assert.deepEqual(readFileSync(join(dest,file)),png);
 }finally{for(const [base,target]of [[runs,dir],[resolve(ROOT,'art/sprites/pixel-quarterview/incoming'),dest]]){assert.ok(resolve(target).startsWith(base+sep));rmSync(target,{recursive:true,force:true});}}
});
