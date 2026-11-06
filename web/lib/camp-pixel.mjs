// Display-only experiment. Shared geometry, sitting, identity and wire state stay intact.
export function pixelPropDisplay(assets,item,mapId,mode='off'){
  if(mapId!=='camp'||!['candidates','approved'].includes(mode)||!assets.manifest.pixelQuarterview)return null;
  const row=assets.manifest.pixelQuarterview.overrides.find(r=>r.type===item.type&&Object.entries(r.match||{}).every(([k,v])=>item[k]===v));
  if(!row||(mode==='approved'&&row.status!=='usable_as_is'))return null;
  // Wrong projection or pose is not even enabled by the candidate field flag.
  if(['needs_redraw','reference_only'].includes(row.status))return null;
  return {id:row.id,frame:assets.spriteFrame(row.id),width:row.width,y:0,theme:'color',flip:false};
}
export function snapPixelOrigin(ctx){
  const m=ctx.getTransform(),det=m.a*m.d-m.b*m.c;if(!Number.isFinite(det)||Math.abs(det)<1e-9)return;
  const dx=Math.round(m.e)-m.e,dy=Math.round(m.f)-m.f;
  ctx.translate((m.d*dx-m.c*dy)/det,(-m.b*dx+m.a*dy)/det);
}
