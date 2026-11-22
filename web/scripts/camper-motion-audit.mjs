import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync} from 'node:fs';
import {drawCharacter} from '../lib/camp-character.mjs';
import {createDrawContext} from '../lib/camp-draw-context.mjs';
import {spriteManifest,createSpriteContext,setSpriteCanvasFactory} from '../lib/camp-sprite-assets.mjs';
import {spriteImageMetadata} from '../lib/camp-materials.mjs';
import {EMOTES,spawnPlayer} from '../lib/camp-world.mjs';
import {WEAPONS} from '../lib/camp-weapons.mjs';
import {CAMP_SEATS} from '../lib/camp-seats.mjs';
import {emptyFire} from '../lib/camp-fire.mjs';
import {contract} from './camper-consistency.mjs';
import {digest,objectDigest} from './camper-harness-inputs.mjs';

const art=new URL('../../art/sprites/field-camper-v2/',import.meta.url);
export const motionSpec=JSON.parse(readFileSync(new URL('camper-motion-spec.json',art)));
const atlasIds=['field-camper-v2','field-camper-walk'];
const layers=['body','face','hair'];
const {directions}=contract;
export const motionBaseline=JSON.parse(readFileSync(new URL('subculture-20261122/motion-coverage.json',art)));

export function motionPhases(spec=motionSpec){
  if(spec.version!==1||!spec.actions||!Array.isArray(spec.normalLayers)
    ||!spec.normalLayers.length||!spec.normalLayers.every(layer=>layers.includes(layer))
    ||!Array.isArray(spec.sharing?.commonLayers)||!spec.sharing.commonLayers.every(layer=>['face','hair'].includes(layer))
    ||!Array.isArray(spec.sharing?.exceptions))
    throw Error('Invalid camper motion specification');
  const phases=new Map();
  for(const [action,entry] of Object.entries(spec.actions)){
    let list=entry.phases;
    if(entry.steps==='walkSteps'){
      list=Object.fromEntries(Array.from({length:contract.walkSteps},(_,i)=>{
        const key='step-'+(i+1);
        const previous=Array.from({length:i},(_,j)=>action+'.step-'+(j+1));
        if(entry.distinctFrom)previous.push(entry.distinctFrom+'.'+key);
        return [key,{player:{...entry.player,moving:true,walkCycle:i/contract.walkSteps},distinctFrom:previous}];
      }));
    }
    if(!list||!Object.keys(list).length)throw Error('Missing camper phases for '+action);
    for(const [phase,entry] of Object.entries(list)){
      const id=action+'.'+phase,layer=entry.layer??'body',time=entry.time??1;
      const facings=entry.directions??directions;
      if(!layers.includes(layer)||!Number.isFinite(time)||time<0
        ||!Array.isArray(entry.distinctFrom??[])||!Array.isArray(facings)||!facings.length
        ||new Set(facings).size!==facings.length||facings.some(value=>!directions.includes(value)))
        throw Error('Invalid camper phase '+id);
      phases.set(id,{...entry,id,action,layer,time,directions:facings});
    }
  }
  for(const item of phases.values()){
    const references=[...(item.distinctFrom??[])];
    if(item.mixWith)references.push(item.mixWith);
    for(const ref of references){
      if(!phases.has(ref)||ref===item.id)throw Error('Invalid motion comparison '+item.id+' -> '+ref);
    }
  }
  for(const {id} of EMOTES){
    if(phases.get('emote.'+id)?.emote!==id)throw Error('Missing emote phase '+id);
  }
  for(const {id} of WEAPONS){
    const entries=[...phases.values()].filter(p=>p.player?.weapon===id);
    if(!entries.some(p=>p.player.shotAt===undefined)||!entries.some(p=>p.player.shotAt>=0))
      throw Error('Missing aim or action phase for '+id);
  }
  if(!Array.isArray(spec.sceneCases)||!spec.sceneCases.length
    ||new Set(spec.sceneCases).size!==spec.sceneCases.length||spec.sceneCases.some(id=>!phases.has(id)))
    throw Error('Invalid camper scene cases');
  return phases;
}

export function motionPlayer(phase,direction,topStyle=0,hairStyle=0){
  const transition=['sit.enter','sit.exit','throw.release'].includes(phase.id)
    ?{key:phase.id,until:phase.time*1000+120}:null;
  return {...spawnPlayer(0,'camp'),id:'',color:'#e5a76d',visualDirection:direction,
    topStyle,hairStyle,camperTransition:transition,...phase.player,
    ...(phase.seat&&{sitting:true,renderSeat:true,renderDirection:direction})};
}

export function camperMotionScene(phase,{mapId=['idle','sit'].includes(phase.action)?'camp':'playground'}={}){
  const now=Math.round(phase.time*1000);
  const player={...motionPlayer(phase,'front-right'),id:'motion-self',name:'캠퍼',mapId,
    x:0,y:0,emote:phase.emote??null,emoteUntil:phase.emote?now+500:0};
  const players=[player];
  if(phase.action==='walk'&&mapId==='camp')Object.assign(player,{x:1.6,y:-0.6});
  if(phase.action==='sit'){
    const seat=CAMP_SEATS[1];
    Object.assign(player,{x:seat.x,y:seat.y,seatId:phase.seat?seat.id:null,z:phase.seat?seat.z??0:0});
  }
  if(phase.action==='carry'||phase.action==='throw'){
    const partner={...spawnPlayer(1,mapId),id:'partner',name:'친구',x:0,y:0,hairStyle:1,topStyle:1};
    if(phase.id==='carry.holder')Object.assign(partner,{carriedBy:player.id,motion:'carried',z:1.3});
    if(phase.id==='throw.release')Object.assign(partner,{motion:'airborne',thrown:true,z:1.3,vz:4,x:0.6});
    if(phase.id==='throw.passenger')player.x=0.6;
    players.push(partner);
  }
  const fire={...emptyFire(now),fuel:120};
  return {mapId,now,self:player.id,players,fire,zoom:1,theme:'color',cameraMode:'follow'};
}

const pairKey=(a,b)=>[a,b].sort().join(' = ');
const caseId=({phase,direction,outfit,hair})=>[phase,direction,outfit,hair].join('/');

function commandPixels(image,frame){
  const [x,y,w,h]=frame;
  const ctx=image.getContext?.('2d');
  if(ctx)return ctx.getImageData(x,y,w,h).data;
  const canvas=createCanvas(w,h),ink=canvas.getContext('2d');
  ink.drawImage(image,x,y,w,h,0,0,w,h);
  return ink.getImageData(0,0,w,h).data;
}

function measureCommand(command,cache){
  const {image,source,material,matrix,clips}=command;
  const normal=material.normalImage,key=source.join('/');
  let frames=cache.get(image);
  if(!frames){frames=new Map();cache.set(image,frames);}
  const saved=frames.get(key);
  if(saved&&saved.paired===normal)return {...saved.value,mirrored:matrix.a<0,clipped:!!clips.length};
  const color=commandPixels(image,source);
  const [, ,width,height]=source;
  const normalFrame=normal&&source.map((n,i)=>n*(i%2===0?normal.width/image.width:normal.height/image.height));
  const aligned=normalFrame&&normalFrame[2]===width&&normalFrame[3]===height&&normalFrame.every(Number.isInteger);
  const pixels=aligned?commandPixels(normal,normalFrame):null;
  const maskMatches=!!pixels&&color.every((value,i)=>i%4!==3||(value>0)===(pixels[i]>0));
  const value={
    layer:material.camperLayer,cell:material.camperCell,atlas:spriteImageMetadata.get(image)?.id,
    color:color.some((n,i)=>i%4===3&&n>0)?digest(color):null,
    normal:pixels&&pixels.some((n,i)=>i%4===3&&n>0)?digest(pixels):null,
    normalKind:material.normalKind,maskMatches,
  };
  frames.set(key,{paired:normal,value});
  return {...value,mirrored:matrix.a<0,clipped:!!clips.length};
}

export function observeCamperMotion(assets,spec=motionSpec){
  const phases=motionPhases(spec),ctx=createDrawContext(createCanvas(240,300).getContext('2d'));
  const cache=new WeakMap(),observed=[];
  ctx.setTransform(3,0,0,3,120,255);
  for(const phase of phases.values())for(const direction of phase.directions){
    for(const outfit of [0,1])for(const hair of [0,1]){
      ctx.recording.begin();
      drawCharacter(ctx,motionPlayer(phase,direction,outfit,hair),{assets,time:phase.time,
        reduced:false,emote:phase.emote});
      const parts=ctx.recording.end().filter(row=>row.type==='image'&&row.material?.camperLayer)
        .map(row=>measureCommand(row,cache));
      observed.push({phase:phase.id,direction,outfit,hair,parts});
    }
  }
  return observed;
}

export function auditCamperMotion(observed,spec=motionSpec){
  const phases=motionPhases(spec),cases=new Map(),issues=[];
  for(const row of observed){
    const id=caseId(row);
    if(!phases.get(row.phase)?.directions.includes(row.direction)||![0,1].includes(row.outfit)
      ||![0,1].includes(row.hair)||cases.has(id))throw Error('Unexpected or duplicate camper case '+id);
    cases.set(id,row);
  }
  const exceptions=new Map();
  for(const {channel,a,b,reason,approval} of spec.sharing.exceptions){
    const key=channel+'/'+pairKey(a,b);
    if(!['color','normal'].includes(channel)||!cases.has(a)||!cases.has(b)||a===b
      ||typeof reason!=='string'||!reason.trim()||typeof approval!=='string'||!approval.trim()
      ||exceptions.has(key))throw Error('Invalid camper sharing exception '+key);
    exceptions.set(key,reason);
  }
  const checkShared=(channel,part,other,row,ref,kind)=>{
    if(!part?.[channel]||part[channel]!==other?.[channel])return;
    if(exceptions.has(channel+'/'+pairKey(caseId(row),caseId(ref))))return;
    issues.push({action:phases.get(row.phase).action,id:caseId(row),kind:channel+'-'+kind,ref:caseId(ref)});
  };
  for(const phase of phases.values())for(const direction of phase.directions){
    for(const outfit of [0,1])for(const hair of [0,1]){
      const args={phase:phase.id,direction,outfit,hair},id=caseId(args),row=cases.get(id);
      const flag=(kind,detail)=>issues.push({action:phase.action,id,kind,...detail});
      if(!row){flag('missing-case');continue;}
      const part=layer=>row.parts.filter(p=>p.layer===layer).at(-1);
      for(const layer of layers){
        if(!part(layer)?.color)flag('missing-layer',{layer});
      }
      for(const layer of spec.normalLayers){
        const draws=row.parts.filter(p=>p.layer===layer);
        if(!draws.length||draws.some(p=>!p.normal))flag('missing-normal',{layer});
        if(draws.some(p=>p.normalKind==='procedural'))flag('procedural-normal',{layer});
        if(draws.some(p=>p.normal&&!p.maskMatches))flag('normal-mask',{layer});
      }
      const main=part(phase.layer);
      if(main?.mirrored){
        const approved=directions.some(otherDirection=>{
          const ref=cases.get(caseId({...args,direction:otherDirection}));
          const other=ref?.parts.filter(p=>p.layer===phase.layer).at(-1);
          return other?.color&&other.color===main.color&&!other.mirrored
            &&exceptions.has('color/'+pairKey(id,caseId(ref)));
        });
        if(!approved)flag('mirrored-direction',{layer:phase.layer});
      }
      for(const otherDirection of directions.slice(0,directions.indexOf(direction))){
        const ref=cases.get(caseId({...args,direction:otherDirection}));
        const other=ref?.parts.filter(p=>p.layer===phase.layer).at(-1);
        checkShared('color',main,other,row,ref,'shared-direction');
        if(spec.normalLayers.includes(phase.layer))checkShared('normal',main,other,row,ref,'shared-direction');
      }
      for(const previous of phase.distinctFrom??[]){
        const ref=cases.get(caseId({...args,phase:previous}));
        const other=ref?.parts.filter(p=>p.layer===phase.layer).at(-1);
        checkShared('color',main,other,row,ref,'shared-phase');
        if(spec.normalLayers.includes(phase.layer))checkShared('normal',main,other,row,ref,'shared-phase');
      }
      if(outfit===1&&phase.layer==='body'&&spec.normalLayers.includes('body')){
        const ref=cases.get(caseId({...args,outfit:0}));
        const other=ref?.parts.filter(p=>p.layer==='body').at(-1);
        if(main?.color!==other?.color)checkShared('normal',main,other,row,ref,'shared-outfit');
      }
      if(phase.mixWith){
        const ref=cases.get(caseId({...args,phase:phase.mixWith}));
        const lower=ref?.parts.find(p=>p.layer==='body'),body=row.parts.filter(p=>p.layer==='body');
        if(body.length!==2||!body.every(p=>p.clipped)||!lower?.color||body[0].color!==lower.color)
          flag('lower-body-mix',{ref:phase.mixWith});
      }
    }
  }
  return {spec:objectDigest(spec),cases:observed.length,issues};
}

export async function inspectCamperMotion({files=spriteManifest.files,load,motion}={}){
  const loader=load??(url=>loadImage(readFileSync(new URL('../public'+url,import.meta.url))));
  const assets=createSpriteContext({...spriteManifest,files,camperMotion:motion??spriteManifest.camperMotion},{loader,cacheLimit:36});
  setSpriteCanvasFactory(createCanvas);
  const ids=[...atlasIds,'effects'];
  for(const {color,normal} of Object.values(assets.manifest.camperMotion?.plates??{}))ids.push(color,normal);
  if((await assets.preloadSprites(ids)).some(image=>!image))throw Error('Camper motion assets failed to load');
  return {...auditCamperMotion(observeCamperMotion(assets)),atlases:[...new Set(ids)]
    .filter(id=>id!=='effects').map(id=>files[id].sha256)};
}

export function motionIssueCounts(issues){
  const groups={};
  for(const issue of issues){
    const phase=issue.id.split('/')[0],key=[phase,issue.kind,issue.layer].filter(Boolean).join('/');
    groups[key]=(groups[key]??0)+1;
  }
  return Object.fromEntries(Object.entries(groups).sort(([a],[b])=>a.localeCompare(b,'en')));
}

export function verifyMotionBaseline(report,baseline){
  if(report.spec!==baseline.spec||JSON.stringify(report.atlases)!==JSON.stringify(baseline.atlases))
    throw Error('Camper motion baseline does not apply to this specification and these atlases');
  if(report.cases!==baseline.cases||objectDigest(report.issues)!==baseline.issuesHash)
    throw Error('Observed v50 camper coverage differs from the recorded baseline');
}

export function isMotionBaseline(report){
  return JSON.stringify(report.atlases)===JSON.stringify(motionBaseline.atlases);
}

export function printMotionReport(report){
  const details={};
  for(const {action,kind} of report.issues){
    details[action]??={};
    details[action][kind]=(details[action][kind]??0)+1;
  }
  console.log(`Camper motion: ${report.cases} cases; ${report.issues.length} findings`);
  for(const [action,kinds] of Object.entries(details)){
    console.log(action+' — '+Object.entries(kinds).map(([kind,count])=>kind+' '+count).join(', '));
  }
}

export function assertCamperMotion(report,actions='full'){
  const scope=actions==='full'?Object.keys(motionSpec.actions):actions;
  if(!Array.isArray(scope)||!scope.length||scope.some(action=>!Object.hasOwn(motionSpec.actions,action)))
    throw Error('Unknown camper motion scope '+scope);
  const issues=report.issues.filter(row=>scope.includes(row.action));
  if(issues.length){
    const groups=Object.entries(motionIssueCounts(issues));
    const preview=groups.slice(0,18).map(([kind,count])=>kind+' ('+count+')').join(', ');
    const extra=groups.length>18?' and '+(groups.length-18)+' more groups; see coverage --json':'';
    throw Error('Incomplete camper motion: '+preview+extra);
  }
}
