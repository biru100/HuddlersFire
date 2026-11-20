import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,hash,inside,readJSON} from '../../tools/lib/sprite-spec.mjs';
import {reviewPng} from '../../tools/lib/review-png.mjs';
import {spriteManifest} from '../lib/camp-sprite-assets.mjs';
import {getMap} from '../lib/camp-maps.mjs';
import {sceneDecorations} from '../lib/camp-scene-layout.mjs';
import {EXHIBITED_GAMES,exhibitCover} from '../lib/camp-games.mjs';
import {actionCases,reviewMaps,reviewSizes} from './current-art-scenes.mjs';

const fileHash=path=>hash(readFileSync(inside(ROOT,path)));
const codeHash=path=>hash(readFileSync(inside(ROOT,path),'utf8').replaceAll('\r\n','\n'));

export function releaseIdentity(){
  const files={};
  for(const {url,sha256} of Object.values(spriteManifest.files)){
    const digest=fileHash('web/public'+url);
    if(sha256!==digest)throw Error('Changed release sprite: '+url);
    files[url]=digest;
  }
  for(const url of EXHIBITED_GAMES.map(exhibitCover).filter(Boolean))files[url]=fileHash('web/public'+url);
  const sourceDir='art/sprites/camper-style-release/';
  const sources=readJSON(inside(ROOT,sourceDir+'sources.json'));
  for(const [name,entry] of Object.entries(sources.originals)){
    if(fileHash(sourceDir+name)!==entry.sha256)throw Error('Changed original: '+name);
  }
  const modules=readdirSync(resolve(ROOT,'web/lib')).filter(name=>name.startsWith('camp-')&&name.endsWith('.mjs')).sort();
  return {manifest:hash(spriteManifest),files,sources:hash(sources),
    runtime:hash(modules.map(name=>[name,codeHash('web/lib/'+name)])),
    recipe:hash(['build-camper-style.py','camp_prop_details.py','camp_landscapes.py'].map(name=>
      existsSync(resolve(ROOT,'tools',name))?codeHash('tools/'+name):null))};
}

export function sceneInventory(){
  return Object.fromEntries(reviewMaps.map(id=>{
    const map=getMap(id);
    const items=[...sceneDecorations(id),...map.scenery,...map.portals,...map.booths,...map.trampolines];
    if(map.radio)items.push(map.radio);
    if(map.fire)items.push({type:'fire',x:0,y:0});
    return [id,{surfaces:['horizon','terrain'],moving:id==='playground'?['football']:[],
      placements:items.map(({type,variant,id,x,y,scale})=>({type,variant,id,x,y,scale}))}];
  }));
}

export function expectedCases(browser){
  const rows=[];
  for(const [format,[width,height]] of Object.entries(reviewSizes)){
    for(const map of reviewMaps)rows.push({id:map+'-'+format,width,height,map,backend:'canvas'});
    if(browser)for(const backend of ['webgl','canvas'])for(const name of actionCases){
      const map=name.startsWith('seat')?'camp':name.startsWith('booth')?'showroom':'playground';
      rows.push({id:[format,backend,name].join('-'),width,height,map,backend});
    }
  }
  return rows;
}

export function captureProtocol(browser){
  const scripts=['current-art-scenes','render-landscapes','sprite-fixture'];
  if(browser)scripts.push('browser.grounding','lighting-preview','lighting-preview-plugin');
  return hash(scripts.map(name=>codeHash('web/tests/'+name+'.mjs')));
}

export function verifySnapshot(dir,receipt){
  const {digest,...payload}=receipt;
  if(digest!==hash(payload))throw Error('Changed capture receipt');
  const expected=expectedCases(receipt.browser);
  if(receipt.version!==1||receipt.cases.length!==expected.length)throw Error('Incomplete capture set');
  for(const required of expected){
    const row=receipt.cases.find(c=>c.id===required.id);
    if(!row||Object.entries(required).some(([k,v])=>row[k]!==v)||row.time!==5000||row.zoom!==1||
        row.dpr!==1||row.theme!=='color'||row.camera?.mode!=='follow'||!Number.isFinite(row.camera.scale)||
        !Number.isFinite(row.camera.x)||!Number.isFinite(row.camera.y)||row.players?.length!==2)
      throw Error('Missing or incompatible capture: '+required.id);
    if(reviewPng(inside(dir,row.id+'.png'),row.width,row.height)!==row.png)throw Error('Changed screenshot: '+row.id);
  }
}

export function compareSnapshots(before,after,current,protocol){
  if(before.phase!=='before'||after.phase!=='after'||before.browser!==after.browser||
     before.protocol!==after.protocol||after.protocol!==protocol)throw Error('Incompatible capture protocol');
  if(hash(after.release)!==hash(current))throw Error('Stale candidate release; capture it again');
  if(after.baseline!==before.digest)throw Error('Candidate belongs to a different baseline');
  return after.cases.map(({id,png,...state})=>{
    const original=before.cases.find(row=>row.id===id);
    if(!original)throw Error('Missing baseline: '+id);
    const {id:originalId,png:originalPng,...originalState}=original;
    if(originalId!==id||hash(originalState)!==hash(state))throw Error('Camera or scene conditions changed: '+id);
    return {id,changed:originalPng!==png};
  });
}

export function verifyObservations(notes,before,after){
  if(notes.before!==before.digest||notes.after!==after.digest||notes.aesthetics!=='pending_user')
    throw Error('Observations must identify this pair and leave aesthetic selection to the user');
  for(const map of reviewMaps){
    const note=notes.maps?.[map],inventory=after.inventory[map];
    const types=new Set([...inventory.placements.map(p=>p.type),...inventory.surfaces,...inventory.moving]);
    if(!note||!['affected','unchanged','observations','unresolved','evidence'].every(k=>
      Array.isArray(note[k])&&note[k].every(text=>typeof text==='string'&&text.trim())))throw Error('Invalid map observations: '+map);
    const covered=[...note.affected,...note.unchanged];
    if(covered.length!==types.size||new Set(covered).size!==types.size||covered.some(type=>!types.has(type))||
       !note.observations.length||!note.evidence.length||
       note.evidence.some(id=>!after.cases.some(c=>c.id===id&&c.map===map)))throw Error('Missing inventory or scene observation: '+map);
  }
}
