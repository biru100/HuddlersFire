import {createCanvas} from '@napi-rs/canvas';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {inside,readJSON,writeJSON} from '../../tools/lib/sprite-spec.mjs';
import {reviewPng} from '../../tools/lib/review-png.mjs';
import {camperFacings} from '../lib/camp-camper-motion.mjs';
import {setSpriteCanvasFactory} from '../lib/camp-sprite-assets.mjs';
import {drawCharacter} from '../lib/camp-character.mjs';
import {compileCamperMotion} from './compile-camper-motion.mjs';
import {candidateContext} from './camper-review-assets.mjs';
import {motionPhases,motionPlayer} from './camper-motion-audit.mjs';
import {objectDigest} from './camper-harness-inputs.mjs';
import {camperCaptureIdentity} from '../tests/camper-scale-evidence.mjs';

export const visualChecks={
  crop:'Check that each extracted pose contains the intended full silhouette.',
  limbs:'Compare the original, fitted key, removed layer and final sprite. Check fingers, sleeves, and feet.',
  joints:'Compare the neck, sleeves, and waist in the final pose across both hairstyles.',
  mixed:'Check the silhouette and waist seam in seated and walking gestures and armed running.',
  transitions:'Check the sequence, footing and contact in the running loop, sit, jump, carry and throw.',
};

const width=64,height=80,zoom=2;
const columns=['Source crop','Fitted key','Removed as head','Body after split','Packed body','Game / bob','Game / tied hair'];
const boardWidth=160+width*zoom*columns.length;

function bodyImage(image,ref,density){
  const [x,y]=ref.cell,w=width*density,h=height*density;
  const tile=createCanvas(width,height);
  tile.getContext('2d').drawImage(image,x*w,y*h,w,h,0,0,width,height);
  return tile;
}

function drawPose(canvas,assets,phase,direction,style,hair,x,y){
  const ink=canvas.getContext('2d'),player=motionPlayer(phase,direction,style,hair);
  ink.save();
  ink.translate(x,y);
  drawCharacter(ink,{...player,color:'#606060'},{assets,time:phase.time,reduced:false,emote:phase.emote});
  ink.restore();
}

function makeBoard(poses,phase,assets){
  const board=createCanvas(boardWidth,44+164*poses.length),ink=board.getContext('2d');
  ink.fillStyle='#e7d9be';
  ink.fillRect(0,0,board.width,board.height);
  ink.fillStyle='#2e2821';
  ink.font='14px sans-serif';
  columns.forEach((name,i)=>ink.fillText(name,162+width*zoom*i,28));
  for(const [i,{key,direction,style,source,fitted,removed,body}] of poses.entries()){
    const y=44+i*164,ref=assets.manifest.camperMotion.frames[key][direction][style];
    const {color,density}=assets.manifest.camperMotion.plates[ref.plate];
    const packed=bodyImage(assets.getSprite(color),ref,density);
    ink.fillStyle=i%2?'#ded0b7':'#f3ead8';
    ink.fillRect(0,y,board.width,164);
    ink.fillStyle='#2e2821';
    ink.fillText(camperFacings[direction],10,y+65);
    ink.fillText(style?'Hoodie':'Jacket',10,y+86);
    const [x0,y0,w,h]=source.bounds,factor=Math.min(120/w,150/h);
    ink.imageSmoothingEnabled=true;
    ink.drawImage(source.image,x0,y0,w,h,160+(128-w*factor)/2,y+5,w*factor,h*factor);
    ink.imageSmoothingEnabled=false;
    const layers=[fitted,removed,body,packed];
    for(const hair of [0,1]){
      const canvas=createCanvas(width,height);
      drawPose(canvas,assets,phase,camperFacings[direction],style,hair,width/2,ref.anchor);
      layers.push(canvas);
    }
    layers.forEach((layer,j)=>ink.drawImage(layer,160+128*(j+1),y,128,160));
  }
  return board;
}

const sequenceActions=['sit','walk','run','jump','carry','throw'];

function makeSequence(phases,assets){
  const board=createCanvas(164+96*phases.length,48+8*95),ink=board.getContext('2d');
  ink.fillStyle='#efe4cb';
  ink.fillRect(0,0,board.width,board.height);
  ink.font='13px sans-serif';
  phases.forEach((phase,i)=>{ink.fillStyle='#2e2821';ink.fillText(phase.id,164+i*96,28);});
  for(const [direction,facing] of camperFacings.entries())for(const style of [0,1]){
    const y=48+(direction*2+style)*95;
    ink.fillStyle=style?'#d9c9ac':'#f4e9d5';
    ink.fillRect(0,y,board.width,95);
    ink.fillStyle='#2e2821';
    ink.fillText(facing,12,y+45);
    ink.fillText(style?'Hoodie':'Jacket',12,y+65);
    phases.forEach((phase,i)=>drawPose(board,assets,phase,facing,style,style,192+i*96,y+83));
  }
  return board;
}

export async function captureCamperVisualReview(job,candidate){
  const dir=inside(candidate.path,'review/visual');
  mkdirSync(dir,{recursive:true});
  const grouped=new Map();
  const compiled=await compileCamperMotion({authoredCrops:!!candidate.manifest.sources.layout,
    regenerated:!!candidate.manifest.sources.collars,observePose(pose){
    if(!grouped.has(pose.key))grouped.set(pose.key,[]);
    grouped.get(pose.key).push(pose);
  }});
  if(compiled.manifest.id!==candidate.manifest.id)throw Error('Visual review uses different camper source frames');
  const assets=candidateContext(candidate),phases=motionPhases();
  setSpriteCanvasFactory(createCanvas);
  const ids=['field-camper-v2','effects',...Object.keys(candidate.manifest.files),'field-camper-walk'];
  if((await assets.preloadSprites(ids)).some(image=>!image))throw Error('Camper visual atlas failed to decode');
  const boards={};
  const save=(key,board)=>{
    const file=inside(dir,key+'.png');
    writeFileSync(file,board.toBuffer('image/png'));
    boards[key]={width:board.width,height:board.height,sha256:reviewPng(file,board.width,board.height)};
  };
  for(const [key,poses] of grouped)save(key,makeBoard(poses,phases.get(key),assets));
  for(const action of sequenceActions){
    const sequence=[...phases.values()].filter(phase=>phase.action===action);
    save('sequence-'+action,makeSequence(sequence,assets));
  }
  const payload={version:1,identity:camperCaptureIdentity('canvas',job,'after'),boards};
  const evidence={...payload,id:objectDigest(payload)};
  writeJSON(inside(dir,'evidence.json'),evidence);
  const file=inside(dir,'observations.json');
  if(!existsSync(file)){
    const checks=Object.fromEntries(Object.entries(visualChecks).map(([key,prompt])=>[
      key,{status:'pending',note:'',evidence:[],prompt},
    ]));
    writeJSON(file,{version:1,source:evidence.id,canvasAfter:null,browserAfter:null,checks});
  }
  const links=Object.keys(boards).map(key=>`<li><a href="${key}.png">${key}</a></li>`).join('');
  writeFileSync(inside(dir,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Camper pose layers</title><h1>Camper pose layers</h1><p><a href="observations.json">Review notes</a> · <a href="../comparison.html">Game scenes</a></p><ul>${links}</ul></html>`);
  console.log(`${grouped.size} source-to-game pose comparisons: ${inside(dir,'index.html')}`);
}

export function validateCamperVisualObservations(notes,{source,canvas,browser,boards,scenes}){
  if(notes?.version!==1||notes.source!==source||notes.canvasAfter!==canvas||notes.browserAfter!==browser)
    throw Error('Visual observations must reference these source boards and both final game captures');
  const all=new Set([...boards,...scenes]);
  for(const key of Object.keys(visualChecks)){
    const row=notes.checks?.[key];
    if(row?.status!=='pass')throw Error('Camper visual check has not passed: '+key);
    if(typeof row.note!=='string'||!row.note.trim()||!Array.isArray(row.evidence)||!row.evidence.length
      ||row.evidence.some(id=>!all.has(id)))
      throw Error('Camper visual check lacks a concrete observation or evidence: '+key);
    const sourceCheck=['crop','limbs','joints'].includes(key);
    if(!row.evidence.some(id=>(sourceCheck?boards:scenes).includes(id)))
      throw Error('Camper visual check cites the wrong type of evidence: '+key);
    if(key==='mixed'&&!['emote.seated-wave','emote.walking-wave','run.armed'].every(phase=>
      row.evidence.some(id=>id.endsWith('-motion-'+phase))))
      throw Error('Camper mixed-pose review must cite seated, walking and armed running scenes');
    if(key==='transitions'&&!sequenceActions.every(action=>row.evidence.includes('sequence-'+action)))
      throw Error('Camper transition review must cite the ordered pose strips');
  }
}

export function verifyCamperVisualReview(job,candidate,{canvas,browser},scenes){
  const dir=inside(candidate.path,'review/visual');
  const file=inside(dir,'evidence.json'),notes=inside(dir,'observations.json');
  if(!existsSync(file)||!existsSync(notes))throw Error('Camper visual review is missing; capture the candidate and record observations');
  const {id,...evidence}=readJSON(file);
  if(evidence.version!==1||id!==objectDigest(evidence)
    ||objectDigest(evidence.identity)!==objectDigest(camperCaptureIdentity('canvas',job,'after')))
    throw Error('Stale camper visual review');
  for(const [key,row] of Object.entries(evidence.boards)){
    if(reviewPng(inside(dir,key+'.png'),row.width,row.height)!==row.sha256)
      throw Error('Changed camper visual review board: '+key);
  }
  validateCamperVisualObservations(readJSON(notes),{
    source:id,canvas:canvas.after,browser:browser.after,boards:Object.keys(evidence.boards),scenes,
  });
}
