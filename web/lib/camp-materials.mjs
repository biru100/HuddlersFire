export const spriteImageMetadata=new WeakMap();
const EMISSIVE=new Set(['amber','jade','violet','gold','blue','spark','impact']);
export const lightingRole=(material,object,image)=>material?.lighting||(object?.type==='ground-shadow'?'protected':spriteImageMetadata.has(image)?'lit':'protected');
export function spriteMaterial(assets,sheet,id=null,direction=null){
  const data=assets.manifest.materials,lighting=id==='heart'?'protected':EMISSIVE.has(id)?'emissive':'lit';
  if(!data?.sheets[sheet]||id&&data.unlit?.includes(id))return {normalId:null,strength:0,lighting};
  let key=id;if(id==='bench')key=assets.manifest.sprites.bench.directions?.[direction]||id;
  const recipe=data.surfaces[key];return {normalId:data.sheets[sheet],strength:sheet.startsWith('camper-')?data.character.strength:recipe?.strength??.3,lighting};
}
export function validateNormalPair(color,normal){return !!color&&!!normal&&(color.naturalWidth||color.width)===(normal.naturalWidth||normal.width)&&(color.naturalHeight||color.height)===(normal.naturalHeight||normal.height);}
