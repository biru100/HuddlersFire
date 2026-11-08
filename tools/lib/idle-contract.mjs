export const IDLE_FRAMES = [
  {id:'f1',intent:'neutral-anchor',file:'base/frame01-anchor.png'},
  {id:'f2',intent:'inhale',file:'generated/frame02-inhale.png'},
  {id:'f3',intent:'exhale',file:'generated/frame03-exhale.png'},
  {id:'f4',intent:'return',file:'generated/frame04-return.png'},
];
export function validateFrameRegistry(manifest){
  if(manifest.version!==3||manifest.kind!=='idle-frames'||manifest.workflow!=='anchor-frame-by-frame'||
    manifest.reviewState!=='pending-motion-review'||manifest.decision!=='pending'||manifest.artApproved!==false||
    manifest.animationApproved!==false||manifest.productionReady!==false||manifest.runtimeVerified!==false||manifest.approvalDocument!==null||
    !['nw','se'].includes(manifest.view))throw Error('Invalid pending Idle frame registry');
  if(!Array.isArray(manifest.originals)||!manifest.originals.length||manifest.originals[0].slot!=='f1')throw Error('Immutable f1 anchor required');
  let prior=-1;
  for(const entry of manifest.originals){
    const index=IDLE_FRAMES.findIndex(f=>f.id===entry.slot),spec=IDLE_FRAMES[index];
    if(index<=prior||!spec||entry.path!==spec.file||entry.filename!==spec.file.split('/').at(-1)||
      !/^[a-f0-9]{64}$/.test(entry.sha256)||!Number.isSafeInteger(entry.bytes)||entry.bytes<33||
      !Array.isArray(entry.dimensions)||entry.dimensions.length!==2||entry.dimensions.some(n=>!Number.isInteger(n)||n<1)||
      !entry.sourceFilename?.endsWith('.png'))throw Error('Invalid, duplicate or reordered Idle original');
    if(entry.dimensions.join(',')!==manifest.originals[0].dimensions.join(','))throw Error('Idle originals must match anchor canvas; no automatic resizing');
    prior=index;
  }
}
