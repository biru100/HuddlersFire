import {readFileSync,writeFileSync,existsSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const ROOT=fileURLToPath(new URL('../..',import.meta.url));
export const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
export const readJSON=file=>JSON.parse(readFileSync(file,'utf8'));
export const writeJSON=(file,value)=>writeFileSync(file,JSON.stringify(value,null,2)+'\n');
export const RUNTIME_FILES=['lib/camp-sprite-assets.mjs','lib/camp-sprite-animation.mjs','lib/camp-character.mjs','lib/camp-artwork.mjs','lib/camp-renderer.mjs','lib/camp-player-info.mjs','lib/camp-scene-contract.mjs','lib/camp-maps.mjs','lib/camp-seats.mjs','lib/camp-scene-layout.mjs','lib/camp-world.mjs','app/camp.tsx','components/camp/music-player.tsx','app/camp-layout.css','app/field-v2.css','lib/camp-lighting.mjs','lib/camp-shadows.mjs','lib/camp-scene-frame.mjs','lib/camp-draw-context.mjs','lib/camp-materials.mjs','lib/camp-canvas-renderer.mjs','lib/camp-webgl-renderer.mjs','lib/camp-lighting-shader.mjs','lib/camp-avatar-proxy.mjs','lib/camp-api.mjs','package-lock.json'];
export const runtimeHash=()=>hash(RUNTIME_FILES.map(name=>hash(readFileSync(resolve(ROOT,'web/'+name)))));
export const reviewCases=job=>[...job.spec.cases.filter(c=>job.spec.version!==2||job.scope==='full'||!['actions','stack'].includes(c.view)),...(job.spec.version===2&&job.scope==='full'?[['desktop',1280,900],['mobile',390,844]].map(([size,width,height])=>({id:'ui-'+size+'-radio',kind:'ui',map:'camp',view:'radio',width,height,criteria:['active-video','control-occlusion']})):[])];
export function inside(base,name){const p=resolve(base,name),r=relative(resolve(base),p);if(r==='..'||r.startsWith('..\\')||r.startsWith('../')||isAbsolute(r))throw Error('Path outside permitted directory: '+name);let existing=p;while(!existsSync(existing))existing=dirname(existing);const real=realpathSync(existing),rr=relative(realpathSync(base),real);if(rr==='..'||rr.startsWith('..\\')||rr.startsWith('../')||isAbsolute(rr))throw Error('Symlink outside permitted directory');return p;}
const point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1);
export function validateSpec(spec){
  if(![1,2].includes(spec.version)||!spec.id||!spec.intentIds?.length||!spec.style?.medium||!spec.style?.view||!spec.style?.light||!spec.style?.reference)throw Error('Incomplete scene specification');
  if(!spec.assets||!Object.keys(spec.assets).length||!spec.cases?.length)throw Error('Assets and review cases required');
  for(const [id,a]of Object.entries(spec.assets)){
    if(!/^[a-z][a-z0-9-]*$/.test(id)||!['character','prop','terrain',...(spec.version===2?['effect']:[])].includes(a.kind)||!a.direction||!a.action||!Number.isInteger(a.frames)||a.frames<1||a.frames>16||!(a.width>0))throw Error('Invalid asset: '+id);
    if(!a.contacts||Object.values(a.contacts).some(p=>!point(p)))throw Error('Invalid contact: '+id);
    if(a.kind==='character'&&(!a.state||!(a.fps>0)||!point(a.head?.center)||!(a.head?.radius>0&&a.head.radius<.5)||!a.contacts.feet))throw Error('Character head/feet/state required: '+id);
    if(a.state==='sit'&&!a.contacts.seat)throw Error('Seat contact required: '+id);
    if(a.kind==='prop'&&(!a.target||!a.contacts.ground||!['background','foreground','sorted'].includes(a.depth)))throw Error('Prop ground/depth required: '+id);
    if(a.kind!=='character'&&a.frames!==1)throw Error('Props and terrain require one frame: '+id);
  }
  for(const b of Object.values(spec.bindings||{})){if(!spec.assets[b.asset]||spec.assets[b.asset].direction!==b.direction)throw Error('Binding direction missing from asset specification');if(b.characterDirection&&!Object.values(spec.assets).some(a=>a.state==='sit'&&a.direction===b.characterDirection))throw Error('Binding character direction missing from specification');}
  const ids=new Set();for(const c of spec.cases){if(!c.id||ids.has(c.id)||!['camp','playground','showroom'].includes(c.map)||!['canvas','ui'].includes(c.kind)||!(c.width>0&&c.height>0)||!c.criteria?.length)throw Error('Invalid review case');ids.add(c.id);}
  return spec;
}
export function promptFor(spec,id){const a=spec.assets[id];if(!a)throw Error('Unknown asset '+id);return [
  'Use case: game sprite. Asset ID: '+id+'.',
  'Style: '+spec.style.medium+'. View: '+spec.style.view+'. Lighting: '+spec.style.light+'.',
  'Style reference: '+spec.style.reference+' (character identity and paint treatment only).',
  a.kind==='character'?'Character: '+spec.style.character+'.':'',
  'Subject: '+a.action+'. Direction: '+a.direction+'.',
  'Composition: exactly '+a.frames+' distinct frame(s) in one evenly spaced horizontal strip; full silhouettes, generous clear margin; consistent proportions.',
  'Contact design, normalized within each tight alpha silhouette: '+JSON.stringify(a.contacts)+'.'+(a.head?' Blank head target: '+JSON.stringify(a.head)+'.':''),
  a.kind==='terrain'?'Opaque seamless square texture.':'Genuine transparent alpha background. No ground, cast shadow, text, face, watermark, grid or detached effects.',
].filter(Boolean).join('\n')+'\n';}
export function loadJob(file){const job=readJSON(file);validateSpec(job.spec);if(job.version!==1||job.specHash!==hash(job.spec)||!Array.isArray(job.selected)||!job.selected.length||new Set(job.selected).size!==job.selected.length||job.selected.some(id=>!job.spec.assets[id]))throw Error('Invalid or changed job specification');if(job.referenceHash!==hash(readFileSync(inside(ROOT,job.spec.style.reference))))throw Error('Reference image changed');for(const id of job.selected)if(readFileSync(inside(dirname(resolve(file)),'prompts/'+id+'.txt'),'utf8')!==promptFor(job.spec,id))throw Error('Compiled prompt changed: '+id);return job;}
export function buildFingerprint(job,inputs,annotations){return hash({specHash:job.specHash,selected:job.selected,inputs,annotations});}
export function verifyReview(jobFile,reviewFile){
  const job=loadJob(jobFile),dir=dirname(resolve(jobFile)),built=readJSON(inside(dir,'build/preview.json')),review=readJSON(reviewFile),evidence=readJSON(inside(dir,'evidence.json'));
  const inputs=Object.fromEntries(job.selected.map(id=>[id,hash(readFileSync(inside(dir,'source/'+id+'.png')))]));
  const annotations=existsSync(inside(dir,'annotations.json'))?readJSON(inside(dir,'annotations.json')):{};
  if(built.fingerprint!==buildFingerprint(job,inputs,annotations)||built.manifestHash!==hash(readFileSync(inside(dir,'build/manifest.json')))||review.fingerprint!==built.fingerprint||evidence.fingerprint!==built.fingerprint||review.manifestHash!==built.manifestHash||evidence.manifestHash!==built.manifestHash||evidence.runtimeHash!==runtimeHash())throw Error('Stale sources, build, runtime or review');
  for(const f of Object.values(readJSON(inside(dir,'build/manifest.json')).files)){const bytes=readFileSync(f.url.startsWith('/__sprite-preview/files/')?inside(dir,'build/'+f.url.split('/').at(-1)):inside(resolve(ROOT,'web/public'),'.'+f.url)),digest=hash(bytes),expected=f.sha256||f.url.match(/\.([a-f0-9]{12})\.png$/)?.[1];if(bytes.length!==f.bytes||!expected||!digest.startsWith(expected))throw Error('Built asset changed: '+f.url);}
  if(!review.reviewer||!review.observations?.length)throw Error('Named reviewer and observations required');
  for(const c of reviewCases(job)){const e=evidence.cases?.find(e=>e.id===c.id),r=review.cases?.find(r=>r.id===c.id);if(!e||!r||r.result!=='pass'||!r.observation?.trim()||e.kind!==c.kind||e.width!==c.width||e.height!==c.height||e.map!==c.map||e.view!==c.view||e.sha256!==hash(readFileSync(inside(dir,e.file))))throw Error('Missing, failed or stale case: '+c.id);const png=readFileSync(inside(dir,e.file));if(png.length<24||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||png.readUInt32BE(16)!==c.width||png.readUInt32BE(20)!==c.height)throw Error('Screenshot dimensions differ: '+c.id);}
  if(review.unresolved?.length)throw Error('Unresolved visual findings');
  return {specHash:job.specHash,fingerprint:built.fingerprint,reviewer:review.reviewer};
}
