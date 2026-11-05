export const spriteImageMetadata=new WeakMap();
export function spriteMaterial(assets,sheet,id=null,direction=null){
  const data=assets.manifest.materials;if(!data?.sheets[sheet])return null;
  if(id&&data.unlit?.includes(id))return {normalId:null,strength:0};
  let key=id;if(id==='bench')key=assets.manifest.sprites.bench.directions?.[direction]||id;
  const recipe=data.surfaces[key];return {normalId:data.sheets[sheet],strength:sheet.startsWith('camper-')?data.character.strength:recipe?.strength??.3};
}
export function validateNormalPair(color,normal){return !!color&&!!normal&&(color.naturalWidth||color.width)===(normal.naturalWidth||normal.width)&&(color.naturalHeight||color.height)===(normal.naturalHeight||normal.height);}
