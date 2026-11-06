// Authoring contract only. Drafts never change Member, Player, wire data or Discord photos.
export const PIXEL_DIRECTIONS=Object.freeze({NW:[-1,0],NE:[0,-1],SW:[0,1],SE:[1,0]});
export const PIXEL_STATES=Object.freeze(['idle','walk','sit_bench','emote']);
export const AVATAR_SLOTS=Object.freeze(['base','hair','top','bottom','headwear','face','accessory']);
export const AVATAR_DRAFT_KEY='huddlers-fire-avatar-draft-v1';
export const AVATAR_DRAW_ORDER=Object.freeze(['back_hair','base','bottom','top','face','front_hair','headwear','accessory']);
const slotLayers={base:['base'],hair:['back_hair','front_hair'],top:['top'],bottom:['bottom'],headwear:['headwear'],face:['face'],accessory:['accessory']};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function normalizeAvatarDraft(value,catalog){
  const input=value&&value.version===1?value:{},parts={};
  for(const slot of AVATAR_SLOTS){const id=input.parts?.[slot];parts[slot]=typeof id==='string'&&catalog.assets.some(a=>a.id===id&&a.slot===slot)?id:null;}
  const palettes={};for(const [slot,options]of Object.entries(catalog.palettes||{})){const id=input.palettes?.[slot];palettes[slot]=options.includes(id)?id:options[0];}
  return {version:1,parts,palettes,profilePhotoMode:'preserve',scope:'local-draft'};
}
export function readAvatarDraft(storage,catalog){try{return normalizeAvatarDraft(JSON.parse(storage.getItem(AVATAR_DRAFT_KEY)),catalog);}catch{return normalizeAvatarDraft(null,catalog);}}
export function saveAvatarDraft(storage,value,catalog){const draft=normalizeAvatarDraft(value,catalog);try{storage.setItem(AVATAR_DRAFT_KEY,JSON.stringify(draft));return {draft,saved:true};}catch{return {draft,saved:false};}}
export function inspectAvatarCombination(draft,catalog,direction,state,contract){
  const reasons=[],layers=[];
  if(!Object.hasOwn(PIXEL_DIRECTIONS,direction)||!PIXEL_STATES.includes(state))return {ready:false,reasons:['unknown_direction_or_state'],layers:[]};
  const normalized=normalizeAvatarDraft(draft,catalog);
  if(!normalized.parts.base)reasons.push('missing_base');
  let baseline;
  if(!contract?.states?.[state])reasons.push('missing_approved_frame_contract');
  for(const slot of AVATAR_SLOTS){
    const id=normalized.parts[slot];if(!id)continue;
    const entry=catalog.assets.find(a=>a.id===id),variant=entry.variants?.[direction]?.[state];
    if(entry.status!=='usable_as_is')reasons.push(id+':not_approved');
    if(!variant){reasons.push(id+':missing_'+direction+'_'+state);continue;}
    const validPoint=(point,canvas)=>Array.isArray(point)&&point.length===2&&point.every((n,i)=>Number.isInteger(n)&&n>=0&&n<canvas[i]);
    if(!Array.isArray(variant.canvas)||variant.canvas.length!==2||variant.canvas.some(n=>!Number.isInteger(n)||n<=0)||!variant.frames?.length||variant.frames.length!==(variant.durations?.length||0)||variant.durations.some(n=>!Number.isFinite(n)||n<=0)||!variant.frameAnchors||variant.frameAnchors.length!==variant.frames.length||variant.frameAnchors.some(a=>!validPoint(a.feet,variant.canvas)||!validPoint(a.head,variant.canvas)||(state==='sit_bench'&&!validPoint(a.seat,variant.canvas)))||variant.pixelGrid!==1){reasons.push(id+':invalid_frame_contract');continue;}
    const validRect=rect=>Array.isArray(rect)&&rect.length===4&&rect.every(Number.isInteger)&&rect[0]>=0&&rect[1]>=0&&rect[2]===variant.canvas[0]&&rect[3]===variant.canvas[1]&&rect[0]+rect[2]<=entry.size[0]&&rect[1]+rect[3]<=entry.size[1];
    if(variant.frames.some(frame=>!frame.layers?.length||new Set(frame.layers.map(l=>l.name)).size!==frame.layers.length||frame.layers.some(l=>!slotLayers[slot].includes(l.name)||!validRect(l.rect)))){reasons.push(id+':invalid_frame_layers_or_crop');continue;}
    if(!entry.paletteId||variant.paletteId!==entry.paletteId)reasons.push(id+':missing_palette_contract');
    if(contract&&(variant.frames.length!==contract.states[state].frames||!equal(variant.durations,contract.states[state].durations)))reasons.push(id+':incorrect_frame_count_or_timing');
    const signature={canvas:variant.canvas,durations:variant.durations,frameAnchors:variant.frameAnchors,pixelGrid:variant.pixelGrid};
    if(slot==='base')baseline=signature;
    else if(!baseline||!equal(signature,baseline))reasons.push(id+':incompatible_canvas_timing_or_anchors');
    layers.push({id,slot,...variant});
  }
  // A caller cannot mistake a partial stack for a successful assembly.
  return {ready:reasons.length===0,reasons,layers:reasons.length?[]:layers,profilePhotoMode:'preserve'};
}
