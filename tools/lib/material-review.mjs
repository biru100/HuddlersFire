import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,hash,readJSON,inside,runtimeHash} from './sprite-spec.mjs';
import {materialSpecFile,baseArtworkHash} from './material-assets.mjs';
export function materialCases(scope='full'){
  const prototype=[{id:'camp-color',kind:'webgl'},{id:'camp-close',kind:'webgl'},{id:'normal-left',kind:'webgl'},{id:'normal-right',kind:'webgl'},{id:'normals-off',kind:'webgl',normals:false}];
  if(scope==='prototype')return prototype.map(c=>({...c,width:1050,height:824}));if(scope!=='full')throw Error('Unknown material review scope');
  return [...prototype,...['camp-dark','playground-color','playground-dark','showroom-color','showroom-dark','actions','stack','context-restored','frames-0','frames-1','frames-2','frames-3'].map(id=>({id,kind:'webgl'})),{id:'context-lost',kind:'canvas'},{id:'fallback',kind:'canvas'},...['ui-desktop-field','ui-mobile-field','ui-desktop-panel','ui-mobile-panel','ui-desktop-video','ui-mobile-video','ui-pip'].map(id=>({id,kind:'ui'})),...['normal-atlas-character','normal-atlas-environment'].map(id=>({id,kind:'data'}))].map(c=>({...c,width:c.kind==='ui'?(c.id==='ui-pip'?560:c.id.includes('mobile')?390:1280):c.kind==='data'?768:1050,height:c.kind==='ui'?(c.id==='ui-pip'?480:c.id.includes('mobile')?844:900):c.kind==='data'?(c.id.includes('character')?864:960):824}));
}
export function materialFingerprint(dir){
  const root=resolve(dir),build=readJSON(inside(root,'materials-build.json')),spec=readJSON(materialSpecFile),manifest=readJSON(inside(root,'manifest.json'));
  if(build.specHash!==hash(spec)||build.manifestHash!==hash(manifest)||build.generatorHash!==hash(readFileSync(new URL('./material-assets.mjs',import.meta.url)))||build.baseArtworkHash!==baseArtworkHash(spec))throw Error('Stale material sources, recipe or generator');
  if(build.baseManifestHash!==hash(readFileSync(inside(root,'base-manifest.json'))))throw Error('Stale base manifest');
  for(const [id,digest]of Object.entries(build.inputs)){const file=manifest.files[id];if(!file||hash(readFileSync(inside(resolve(ROOT,'web/public'),'.'+file.url)))!==digest)throw Error('Changed colour source '+id);}
  for(const [id,file]of Object.entries(build.files)){const bytes=readFileSync(inside(root,file.url.split('/').at(-1)));if(hash(bytes)!==file.sha256||bytes.length!==file.bytes)throw Error('Changed material channel '+id);}
  const captureHash=hash(['lighting-preview.mjs','browser.lighting.mjs','browser.lighting-ui.mjs','browser-cdp.mjs'].map(name=>hash(readFileSync(resolve(ROOT,'web/tests/'+name),'utf8').replaceAll('\r\n','\n'))));return hash({build,runtime:runtimeHash(),captureHash});
}
export function verifyMaterialReview(dir,reviewFile,{scope='full'}={}){
  const root=resolve(dir),fingerprint=materialFingerprint(root),evidence=readJSON(inside(root,'evidence.json')),review=readJSON(reviewFile);
  if(evidence.fingerprint!==fingerprint||review.fingerprint!==fingerprint||review.scope!==scope||!review.reviewer||!Array.isArray(review.unresolved)||review.unresolved.length)throw Error('Stale, unresolved or wrong-scope material review');
  for(const required of materialCases(scope)){
    const proof=evidence.cases.find(c=>c.id===required.id),observation=review.cases.find(c=>c.id===required.id);
    if(!proof||proof.kind!==required.kind||proof.width!==required.width||proof.height!==required.height||!observation||observation.result!=='pass'||!observation.observation?.trim())throw Error('Missing or differently sized material case '+required.id);
    const bytes=readFileSync(inside(root,proof.file));if(bytes.length<24||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||hash(bytes)!==proof.sha256||bytes.readUInt32BE(16)!==proof.width||bytes.readUInt32BE(20)!==proof.height)throw Error('Changed material screenshot '+required.id);
    if(['webgl','ui'].includes(required.kind)&&(proof.backend!=='webgl'||(required.normals===false?proof.normalDraws!==0:!proof.normalDraws)))throw Error('WebGL material proof required '+required.id);
    if(required.kind==='canvas'&&proof.backend!=='canvas')throw Error('Canvas fallback proof required '+required.id);
  }
  return {verified:true,fingerprint,scope,cases:materialCases(scope).length};
}
