import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync} from 'node:fs';
import {separateCamper} from './camper-collar.mjs';
import {camperNormal} from './camper-motion-normal.mjs';
import {CAMPER_PART_FILES} from '../lib/camp-camper-part-files.mjs';
import {camperPartCell,camperStrideRise} from '../lib/camp-camper-parts.mjs';
import {gradeCamperMaterials} from './camper-consistency.mjs';
import {digest,objectDigest} from './camper-harness-inputs.mjs';

const art=new URL('../../art/sprites/field-camper-v2/motion-full-v1/',import.meta.url);
const names=['jump-seat','jump-seat-hood','carry-release-jacket','carry-release',
  'run-jacket','run-hood','emote-jacket','emote-hood','action-jacket','action-hood'];
const soles=[71,69,69,71];
const width=64,height=80;
const canvas=(w=width,h=height)=>createCanvas(w,h);
const rgba=tile=>tile.getContext('2d').getImageData(0,0,tile.width,tile.height);
const tileFrom=data=>{
  const tile=canvas(),ctx=tile.getContext('2d'),pixels=ctx.createImageData(width,height);
  pixels.data.set(data);
  ctx.putImageData(pixels,0,0);
  return tile;
};

export function motionSourceIdentity(){
  const receipt=readFileSync(new URL('sources.json',art));
  const {sources}=JSON.parse(receipt);
  for(const key of names){
    const {sha256,references}=sources[key];
    const bytes=readFileSync(new URL('sources/'+key+'.png',art));
    if(digest(bytes)!==sha256)throw Error('Camper pose source changed: '+key);
    for(const reference of references){
      const path=new URL('../../'+reference.path,art);
      if(digest(readFileSync(path))!==reference.sha256)throw Error('Camper pose reference changed: '+reference.path);
    }
  }
  const base=Object.fromEntries(Object.entries(CAMPER_PART_FILES).slice(0,2).map(([id,details])=>[
    id,details.sha256,
  ]));
  return {receipt:digest(receipt),base};
}

function crop(image,[col,row],density=1){
  const w=width*density,h=height*density,result=canvas(w,h);
  result.getContext('2d').drawImage(image,col*w,row*h,w,h,0,0,w,h);
  return result;
}

function opaqueBounds(data,w,h){
  let l=w,r=-1,t=h,b=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(data[(y*w+x)*4+3]<128)continue;
    l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
  }
  if(r<l||b<t)throw Error('Camper source sheet has an empty pose');
  return [l,t,r+1,b+1];
}

function sourceCells(image,key){
  const result=canvas(image.width,image.height),ctx=result.getContext('2d');
  ctx.drawImage(image,0,0);
  return Array.from({length:4},(_,row)=>Array.from({length:4},(_,col)=>{
    const sx=Math.floor(col*image.width/4),sy=Math.floor(row*image.height/4);
    const sw=Math.floor((col+1)*image.width/4)-sx,sh=Math.floor((row+1)*image.height/4)-sy;
    const data=ctx.getImageData(sx,sy,sw,sh).data;
    const [l,t,r,b]=opaqueBounds(data,sw,sh),h=b-t;
    if(r-l<30||h<30)throw Error('Camper source pose too small: '+key+'/'+row+'/'+col);
    const centers=[];
    for(let y=t+Math.floor(.12*h);y<t+Math.floor(.38*h);y++){
      let a=r,z=l;
      for(let x=l;x<r;x++)if(data[(y*sw+x)*4+3]>=128){a=Math.min(a,x);z=Math.max(z,x);}
      if(a<z)centers.push({x:(a+z)/2,span:z-a+1});
    }
    centers.sort((a,b)=>a.span-b.span);
    const crown=centers[Math.floor(centers.length*.57)];
    // Locate the jaw by matching where the central silhouette narrows
    // under the head. Each sheet has a separately authored perspective.
    let jaw=t+Math.round(.53*h),best=Infinity;
    for(let y=t+Math.floor(.46*h);y<t+Math.floor(.64*h);y++){
      let span=0;
      for(let x=Math.max(l,Math.round(crown.x-crown.span*.48));x<Math.min(r,crown.x+crown.span*.48);x++)
        if(data[(y*sw+x)*4+3]>=128)span++;
      const score=span+crown.span*.012*Math.abs(y-(t+.55*h));
      if(score<best){jaw=y;best=score;}
    }
    return {image,bounds:[sx+l,sy+t,r-l,h],headX:sx+crown.x,jaw:sy+jaw,crownWidth:crown.span};
  }));
}

function posedBody(source,{neck,feet,foreground=false,style,repairTrousers=false}){
  const {image,bounds,headX,jaw,crownWidth}=source;
  const [x,y,w,h]=bounds;
  const output=canvas(),ctx=output.getContext('2d');
  const scale=Math.min(37/crownWidth,60/w),left=32-(headX-x)*scale;
  const headHeight=(jaw-y)*scale;
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(image,x,y,w,jaw-y,left,neck-headHeight,w*scale,headHeight);
  ctx.drawImage(image,x,jaw,w,y+h-jaw,left,neck,w*scale,feet-neck);
  const input=rgba(output).data;
  for(let i=0;i<input.length;i+=4){
    if(input[i+3]<128)input.fill(0,i,i+4);
    else input[i+3]=255;
  }
  const {body}=separateCamper(input,width,height,{hoodie:style===1,neck,unit:1,gesture:foreground});
  // Keep lifted fingers that remain attached to the sleeve outside the
  // modular jaw. Reject isolated pixels and hair-coloured edge remnants.
  if(foreground){
    for(let y=Math.max(20,neck-11);y<neck;y++)for(let x=3;x<61;x++){
      const i=(y*width+x)*4,[r,g,b,a]=input.subarray(i,i+4);
      const hand=r>=130&&r>=g*1.13&&g>b*1.03;
      if(a&&hand&&Math.abs(x-32)>=15
        &&[i-4,i+4,i+width*4].some(j=>body[j+3]))body.set(input.subarray(i,i+4),i);
    }
  }
  removeSpecks(body);
  if(repairTrousers){
    // These hoodie keys painted bare knees. Continue the approved trousers
    // through the knees, preserving their shading and the boot outline.
    for(let y=Math.ceil(neck+(feet-neck)*.54);y<Math.floor(neck+(feet-neck)*.85);y++){
      for(let x=13;x<51;x++){
        const i=(y*width+x)*4,[r,g,b,a]=body.subarray(i,i+4);
        if(!a||r<107||r<g*1.08||g<b*.99)continue;
        const light=.33*r+.5*g+.17*b;
        body.set([32+.21*light,41+.28*light,44+.29*light],i);
      }
    }
  }
  const tile=tileFrom(body),pixels=rgba(tile);
  gradeCamperMaterials(pixels,{head:false,style,unit:1,neck,sole:feet});
  tile.getContext('2d').putImageData(pixels,0,0);
  return tile;
}

function removeSpecks(body){
  const seen=new Uint8Array(width*height);
  for(let start=0;start<seen.length;start++){
    if(seen[start]||!body[start*4+3])continue;
    const group=[start];
    seen[start]=1;
    for(let i=0;i<group.length;i++){
      const at=group[i],x=at%width;
      for(const next of [x>0?at-1:-1,x<width-1?at+1:-1,at-width,at+width]){
        if(next<0||next>=seen.length||seen[next]||!body[next*4+3])continue;
        seen[next]=1;
        group.push(next);
      }
    }
    if(group.length<=8)for(const at of group)body.fill(0,at*4,at*4+4);
  }
}

function seam(tile,heads,neck){
  const pixels=rgba(tile),data=pixels.data,offset=neck-40;
  for(let x=26;x<=37;x++){
    const at=y=>(y*width+x)*4;
    let top=neck-4;
    while(top<neck+10&&!data[at(top)+3])top++;
    if(top===neck+10)continue;
    let bottom=neck+3;
    for(const head of heads){
      let y=neck+3;
      while(y>neck-8&&!head[at(y-offset)+3])y--;
      bottom=Math.min(bottom,y);
    }
    if(top-bottom<=8){
      const fill=data.slice(at(top),at(top)+4);
      for(let y=bottom+1;y<top;y++)data.set(fill,at(y));
    }
  }
  tile.getContext('2d').putImageData(pixels,0,0);
}

// The shared hair covers the hands in these source keys. Bring the
// fingers and cuffs into the foreground at the painted arm positions.
function jacketCarryHands(tile,direction,key){
  const ctx=tile.getContext('2d'),right=direction<2,back=direction===1||direction===2;
  const rows=key==='carry.holder'
    ?[[20,38,24,47],[43,34,39,47]]
    :[[27,38,27,48],[50,34,38,47]];
  for(const [handX,handY,shoulderX,shoulderY] of rows){
    const hx=right?handX:64-handX,sx=right?shoulderX:64-shoulderX;
    ctx.lineCap='square';ctx.strokeStyle='#382c29';ctx.lineWidth=9;
    ctx.beginPath();ctx.moveTo(sx,shoulderY);ctx.lineTo(hx,handY+3);ctx.stroke();
    ctx.strokeStyle=back?'#716a49':'#857857';ctx.lineWidth=6;
    ctx.beginPath();ctx.moveTo(sx,shoulderY);ctx.lineTo(hx,handY+3);ctx.stroke();
    ctx.fillStyle='#59362d';ctx.fillRect(hx-3,handY-4,6,7);ctx.fillRect(hx-4,handY-2,8,4);
    ctx.fillStyle='#d99770';ctx.fillRect(hx-3,handY-3,6,5);
    ctx.fillStyle='#f4c19a';ctx.fillRect(hx-2,handY-3,4,3);
  }
  const pixels=rgba(tile),ink=pixels.data;
  for(let i=0;i<ink.length;i+=4){
    if(ink[i+3]<128)ink.fill(0,i,i+4);
    else ink[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
}

// Move the upper body and bend the leg silhouette between the authored keys.
// Preserve the contact sole on grounded frames.
function flex(tile,neck,feet,{rise=0,lean=0,leg=0,waist=55}={}){
  const src=rgba(tile).data,result=new Uint8ClampedArray(src.length);
  for(let y=0;y<height;y++){
    let source=y-rise;
    if(y>=waist+rise)source=waist+(y-waist-rise)*(feet-waist)/Math.max(1,feet+leg-waist-rise);
    const sy=Math.round(source);
    if(sy<0||sy>=height||sy>=feet)continue;
    const dx=Math.round(lean*Math.min(1,Math.max(0,(feet-y)/(feet-neck))));
    for(let x=0;x<width;x++){
      const sx=x-dx;
      if(sx<0||sx>=width)continue;
      const i=(sy*width+sx)*4;
      result.set(src.subarray(i,i+4),(y*width+x)*4);
    }
  }
  return tileFrom(result);
}

function newPlate(key,columns,rows,density,existingColor){
  const color=existingColor??canvas(columns*width*density,rows*height*density);
  const normal=canvas(color.width,color.height);
  let next=0;
  const add=(tile,{layer='body',blink=false,cell,...meta}={})=>{
    cell??=[next%columns,Math.floor(next++/columns)];
    if(cell[1]>=rows)throw Error('Camper motion plate overflow: '+key);
    const at=[cell[0]*width*density,cell[1]*height*density];
    if(!existingColor)color.getContext('2d').drawImage(tile,...at);
    normal.getContext('2d').drawImage(camperNormal(tile,{density,layer,neck:meta.neck,blink}),...at);
    return {plate:key,cell,...meta};
  };
  return {density,color,normal,add};
}

const drawRecipes={
  'sit.enter':['jump',3,-5,3,true],
  'jump.prepare':['jump',0,-5,0],
  'jump.rise':['jump',1,-1,-2,true],
  'jump.land':['jump',2,-4,0],
  'carry.holder':['carry',0,0,0,true],
  'throw.release':['carry',1,-1,0,true],
  'carry.passenger':['carry',2,-4,-5,true],
  'throw.passenger':['carry',3,-2,-3,true],
  'emote.wave':['emote',0,0,0,true],
  'emote.heart':['emote',1,0,0],
  'emote.clap':['emote',2,0,0],
  'emote.dance':['emote',3,-1,0,true],
  'fall.edge':['action',0,-2,-4,true],
  'hit.impact':['action',1,-2,0,true],
  'weapon.gun-aim':['action',2,0,0,true],
  'weapon.snowball-aim':['action',3,0,0],
};
const derivatives={
  'idle.inhale':['idle.stand',-1,0,0],
  'sit.exit':['sit.enter',-3,1,1],
  'crouch.hold':['jump.prepare',3,-1,0],
  'jump.fall':['fall.edge',1,-2,0],
  'weapon.gun-fire':['weapon.gun-aim',-2,-3,0],
  'weapon.bomb-aim':['weapon.snowball-aim',2,-1,0],
  'weapon.snowball-throw':['throw.release',0,2,0],
  'weapon.bomb-throw':['throw.release',2,-2,0],
  'emote.laugh':['emote.clap',1,-2,0],
  'emote.surprise':['hit.impact',-3,-1,0],
};
const sheetNames={
  jump:['jump-seat','jump-seat-hood'],carry:['carry-release-jacket','carry-release'],
  run:['run-jacket','run-hood'],emote:['emote-jacket','emote-hood'],
  action:['action-jacket','action-hood'],
};

export async function compileCamperMotion(){
  const sources=motionSourceIdentity(),sheets={};
  for(const key of names)
    sheets[key]=sourceCells(await loadImage(readFileSync(new URL('sources/'+key+'.png',art))),key);
  const inputs=await Promise.all(['field-camper-v2','field-camper-walk'].map(async id=>{
    const details=CAMPER_PART_FILES[id],bytes=readFileSync(new URL('../public'+details.url,import.meta.url));
    if(digest(bytes)!==details.sha256)throw Error('Published camper atlas changed: '+id);
    return loadImage(bytes);
  }));
  const native=newPlate('native',16,20,1),walk=newPlate('walk',16,4,3,inputs[1]);
  const frames={},heads=[],outfits=[0,1];
  const addFrame=(key,direction,style,body,meta,plate=native)=>{
    frames[key]??=Array.from({length:4},()=>[]);
    frames[key][direction][style]=plate.add(body,meta);
  };
  for(let direction=0;direction<4;direction++){
    const anchor=soles[direction],sign=direction<2?1:-1;
    const part=(group,index=direction)=>({group,index});
    const body=(pose,style)=>crop(inputs[0],camperPartCell(pose,'body',style,false));
    const sharedHead=outfits.map(style=>{
      const tile=crop(inputs[0],camperPartCell(part(0),'face',0,false));
      tile.getContext('2d').drawImage(crop(inputs[0],camperPartCell(part(0),'hair',style,false)),0,0);
      return rgba(tile).data;
    });
    const head=(pose,layer,style,blink=false)=>native.add(
      crop(inputs[0],camperPartCell(pose,layer,style,false)),{layer,blink});
    heads[direction]={face:head(part(0),'face',0),
      blink:head(part(6,direction+4),'face',0,true),
      hairs:outfits.map(style=>head(part(0),'hair',style))};
    for(const style of outfits){
      const bodies={};
      const add=(key,tile,meta={})=>{
        const placement={anchor,neck:40,feet:anchor,...meta};
        if(key!=='idle.stand'&&key!=='sit.hold')seam(tile,sharedHead,placement.neck);
        if(!style&&['carry.holder','throw.release'].includes(key))jacketCarryHands(tile,direction,key);
        addFrame(key,direction,style,tile,placement);
        bodies[key]={tile,...placement};
      };
      add('idle.stand',body(part(0),style));
      add('sit.hold',body(part(0,direction+4),style),{anchor:55,neck:38,feet:anchor-7,waist:52});
      for(const [key,[sheet,row,offset,footOffset,foreground]] of Object.entries(drawRecipes)){
        const neck=40+offset,feet=anchor+footOffset;
        const meta={neck,feet,foreground:!!foreground};
        if(key==='sit.enter')Object.assign(meta,{anchor:61,waist:52});
        const repairTrousers=style===1&&sheet==='jump';
        add(key,posedBody(sheets[sheetNames[sheet][style]][row][direction],
          {...meta,style,repairTrousers}),meta);
      }
      for(const [key,[donor,rise,lean,leg]] of Object.entries(derivatives)){
        const source=bodies[donor],{neck,feet,foreground}=source;
        add(key,flex(source.tile,neck,feet,{rise,lean:lean*sign,leg}),
          {neck:neck+rise,feet:feet+leg,foreground});
      }
      for(let step=0;step<8;step++){
        const gait=part(8,step*4+direction),cell=camperPartCell(gait,'body',style,true);
        const gaitColor=crop(inputs[1],cell,3),offset=camperStrideRise[step];
        addFrame('walk.step-'+(step+1),direction,style,gaitColor,
          {anchor,neck:40+offset,feet:anchor,cell},walk);
        const row=Math.floor(step/2),neck=38+[0,1,2,1][row];
        const feet=anchor-[1,0,1,0][row];
        const runner=posedBody(sheets[sheetNames.run[style]][row][direction],{neck,feet,style});
        const intermediate=step%2?{rise:row%2===0?2:-1,lean:2*sign,leg:row%2===0?1:-2}:{};
        add('run.step-'+(step+1),step%2?flex(runner,neck,feet,intermediate):runner,
          {neck:neck+(intermediate.rise??0),feet:feet+(intermediate.leg??0)});
      }
    }
  }
  frames['idle.blink']=frames['idle.stand'];
  const plates={},files={},outputs={};
  for(const [key,plate] of Object.entries({native,walk})){
    plates[key]={density:plate.density};
    for(const kind of ['color','normal']){
      if(key==='walk'&&kind==='color'){
        plates[key].color='field-camper-walk';
        continue;
      }
      const id='camper-motion-'+key+'-'+kind,atlas=plate[kind];
      const bytes=atlas.toBuffer('image/png'),sha256=digest(bytes);
      const name=id+'.'+sha256.slice(0,12)+'.png';
      outputs[name]=bytes;
      files[id]={url:'/sprites/'+name,sha256,bytes:bytes.length,width:atlas.width,height:atlas.height,
        sampling:plate.density===1?'nearest':'linear'};
      plates[key][kind]=id;
    }
  }
  const payload={version:4,sources,files,motion:{plates,frames,heads}};
  return {manifest:{...payload,id:objectDigest(payload)},outputs};
}
