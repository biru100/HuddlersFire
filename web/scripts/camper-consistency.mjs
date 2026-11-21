// All distances are expressed at the game's 64 × 80 display size.
// The bob includes its side locks. The bun gains height above the crown.
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync} from 'node:fs';
import {camperPartCell,camperStrideRise} from '../lib/camp-camper-parts.mjs';

export const contract=JSON.parse(readFileSync(new URL('../../art/sprites/field-camper-v2/camper-spec.json',import.meta.url)));
const {version,cell,neck,directions,headSpan,crownToNeck,standingSoles,swatches,tolerance}=contract;
export const legacyContract={version,cell,neck,directions,headSpan,crownToNeck,standingSoles,swatches,tolerance};
const [cellWidth,cellHeight]=contract.cell;
const [walkWidth,walkHeight]=contract.walkCell;
const directionCount=contract.directions.length,steps=contract.walkSteps,walkUnit=walkWidth/cellWidth;
const walkBob=camperStrideRise;
const quantile=(values,q)=>values.sort((a,b)=>a-b)[Math.floor((values.length-1)*q)];
const median=v=>quantile(v,.5);

export function camperAtlasDimensions(detailed,modular=false,{bodyOnly=false}={}){
  const walkRows=bodyOnly?directionCount:modular?directionCount+1:2*directionCount;
  return detailed?[2*steps*walkWidth,walkRows*walkHeight]:
    [4*directionCount*cellWidth,2*contract.nativeSheets.length*cellHeight];
}

function* cells(detailed,soles) {
  if(soles.length!==contract.nativeSheets.length*directionCount*2 || soles.some(n=>!Number.isInteger(n)||n<=neck||n>=cellHeight))
    throw Error('Invalid native sole metadata');
  for(let style=0;style<2;style++)for(let d=0;d<directionCount;d++){
    for(let phase=0;phase<steps;phase++){
      const standing=contract.standingSoles[d];
      if(detailed){
        const row=d,col=style*steps+phase,neck=contract.neck+walkBob[phase];
        for(const head of [true,false])yield {d,style,head,col,row:head?row:row+directionCount,unit:walkUnit,
          neck,sourceNeck:((d===0||d===3)?108:105)/3+walkBob[phase],sole:standing,pose:'walk'};
      }else{
        yield {d,style,head:false,col:steps+phase,row:style*directionCount+d,unit:1,neck,sourceNeck:neck,sole:standing,pose:'fallback'};
      }
    }
    if(detailed)continue;
    for(let group=0;group<Object.keys(contract.poses).length;group++)for(let key=0;key<2;key++){
      const row=group*4+style*2+key;
      // Gesture columns are different actions, all drawn in the forward view.
      const pose=Object.keys(contract.poses)[group];
      const sole=group===0&&key===0?contract.standingSoles[d]:soles[(row-style*2)*4+d];
      for(const head of [true,false])yield {d:group===2?0:d,style,head,col:d+(head?0:4),
        row,unit:1,neck,sourceNeck:neck,sole,pose};
    }
  }
}

export function measureCamperLayer(frame,cell){
  const {width:w,height:h,data}=frame,{unit,head}=cell;
  const spans=[];
  let top=h,foot=0,left=w,right=-1;
  for(let y=0;y<h;y++){
    let first=w,last=-1;
    for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=180){
      first=Math.min(first,x);last=x;
    }
    if(last<first)continue;
    top=Math.min(top,y);foot=y+1;
    left=Math.min(left,first);right=Math.max(right,last);
    spans.push((last-first+1)/unit);
  }
  if(!spans.length)throw Error('Empty camper layer '+JSON.stringify(cell));
  return {span:head?quantile(spans,.8):null,top:top/unit,foot:foot/unit,left:left/unit,right:(right+1)/unit};
}

// Use the centre of the material's painted midtones. Translucent antialiasing,
// black outlines, cream trim and the gaps between the boots are excluded.
export function sampleCamperMaterials(frame,cell){
  const {data,width}=frame,{head,style,unit,neck,sole,d}=cell;
  const samples={};
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2];
    if(data[i+3]<220)continue;
    const y=Math.floor(i/(4*width))/unit;
    const leg=(y-neck)/(sole-neck);
    let name;
    if(head){
      if(r>75&&r<152&&r>1.18*g&&g<105)name='hair';
      else if((d===0||d===3)&&r>=190&&g>=120&&r>g*1.12&&g>b*1.06)name='skin';
    }else if(leg>.73&&r>g*1.2&&g>b*1.02&&r>=58&&r<160)name='boots';
    else if(leg>.44&&leg<.85&&g>r*1.08&&b>r*1.02&&g>42&&g<142)name='trousers';
    else if(leg>0&&leg<.43){
      if(style===0&&g>r*.85&&r>b*1.12&&g>b*1.25&&g>55&&g<150)name='jacket';
      if(style===1&&g>r*1.14&&Math.abs(g-b)<22&&g>42&&g<130)name='hoodie';
    }
    if(!name)continue;
    const channels=samples[name]??=[[],[],[]];
    channels[0].push(r);channels[1].push(g);channels[2].push(b);
  }
  return Object.fromEntries(Object.entries(samples)
    .filter(([,channels])=>channels[0].length>=5*unit*unit)
    .map(([name,channels])=>[name,channels.map(median)]));
}

function grade(frame,samples){
  // Blend corrections in RGB space, including fixed black and white anchors.
  // Nearby shades receive continuous corrections, preserving shading and fine ink.
  const anchors=Object.entries(samples).map(([name,rgb])=>[rgb,contract.swatches[name]]);
  anchors.push([[20,17,18],[20,17,18]],[[244,238,222],[244,238,222]]);
  const data=frame.data;
  for(let i=0;i<data.length;i+=4){
    if(!data[i+3])continue;
    let sum=0,dr=0,dg=0,db=0;
    const r=data[i],g=data[i+1],b=data[i+2];
    for(const [from,to] of anchors){
      const dist=(r-from[0])**2+(g-from[1])**2+(b-from[2])**2+64;
      const w=1/(dist*dist);
      sum+=w;dr+=w*(to[0]-from[0]);dg+=w*(to[1]-from[1]);db+=w*(to[2]-from[2]);
    }
    data[i]=r+dr/sum;data[i+1]=g+dg/sum;data[i+2]=b+db/sum;
  }
}

export function gradeCamperMaterials(frame,cell){
  grade(frame,sampleCamperMaterials(frame,cell));
  const corrected=sampleCamperMaterials(frame,cell);
  if(Object.entries(corrected).some(([name,rgb])=>rgb.some((v,i)=>
    Math.abs(v-contract.swatches[name][i])>contract.tolerance.materialChannel)))
    grade(frame,corrected);
}

function targetHead(cell){
  return {span:contract.headSpan[cell.style][cell.d],crown:contract.crownToNeck[cell.style]};
}

function collarEdges(frame,cell){
  const {unit,head,neck}=cell,w=frame.width;
  const edges=[];
  for(let x=(contract.neckX-3)*unit;x<(contract.neckX+3)*unit;x++){
    let edge=null;
    for(let y=Math.floor((neck-7)*unit);y<Math.ceil((neck+6)*unit);y++)
      if(frame.data[(y*w+x)*4+3]>=128 && (head||edge===null))edge=y;
    edges.push(edge);
  }
  return edges;
}
export function normalizeCamperAtlases(atlases,soles){
  return atlases.map((atlas,index)=>{
    const source=atlas.getContext('2d'),out=createCanvas(atlas.width,atlas.height);
    const result=out.getContext('2d');
    for(const cell of cells(Boolean(index),soles)){
      const {unit,head,col,row,neck,sourceNeck,sole}=cell,w=cellWidth*unit,h=cellHeight*unit;
      const frame=source.getImageData(col*w,row*h,w,h);
      const bounds=measureCamperLayer(frame,cell),target=targetHead(cell);
      const sy=head?target.crown/(sourceNeck-bounds.top):(sole-neck)/(bounds.foot-sourceNeck);
      const tile=createCanvas(w,h);tile.getContext('2d').putImageData(frame,0,0);
      const aligned=createCanvas(w,h).getContext('2d');aligned.imageSmoothingEnabled=unit>1;
      aligned.drawImage(tile,0,(neck-sourceNeck*sy)*unit,w,h*sy);
      const sx=head?target.span/measureCamperLayer(aligned.getImageData(0,0,w,h),cell).span:1;
      if(![sx,sy].every(n=>Number.isFinite(n)&&n>.60&&n<1.60))
        throw Error('Source proportions need redraw: '+JSON.stringify({cell,sx,sy}));
      const ink=tile.getContext('2d');ink.clearRect(0,0,w,h);
      ink.imageSmoothingEnabled=unit>1;
      ink.drawImage(aligned.canvas,w/2*(1-sx),0,w*sx,h);
      const registered=ink.getImageData(0,0,w,h);
      // At native size a single reassigned pixel can change a small boot's
      // median. Resample the painted pixels once before checking the encoder.
      gradeCamperMaterials(registered,cell);
      result.putImageData(registered,col*w,row*h);
    }
    return out;
  });
}

// Inspect the decoded shipment, including the walking fallback and every pose.
// Each layer is shared by both cross-worn combinations in the renderer.
function modularCollar(native,cell,hair){
  const {d,pose,unit,row,neck,col}=cell;
  const part=pose==='walk'||pose==='fallback'?{group:0,index:d}:
    {group:Math.floor(row/4)*2,index:(row%2)*4+col-4};
  const tile=createCanvas(cellWidth*unit,cellHeight*unit),ctx=tile.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  for(const layer of ['face','hair']){
    const [x,y]=camperPartCell(part,layer,hair,false);
    const offset=pose==='walk'?walkBob[col%contract.walkSteps]*unit:0;
    ctx.drawImage(native,x*cellWidth,y*cellHeight,cellWidth,cellHeight,0,offset,tile.width,tile.height);
  }
  return collarEdges(ctx.getImageData(0,0,tile.width,tile.height),{unit,head:true,neck});
}

export async function inspectCamperAtlases(buffers,soles,{modular=false,bodyOnly=false}={}){
  if(buffers.length!==2)throw Error('Expected native and detailed walking atlases');
  if(bodyOnly&&!modular)throw Error('Body-only walking requires the modular native atlas');
  for(const [direction,sole] of contract.standingSoles.entries()){
    if(soles[direction]!==sole || soles[8+direction]!==sole)
      throw Error('Standing foot origin differs from the atlas contract');
  }
  const results=[],violations=[];
  let native;
  for(const [index,bytes] of buffers.entries()){
    const image=await loadImage(bytes),expected=camperAtlasDimensions(Boolean(index),modular,{bodyOnly});
    if(image.width!==expected[0]||image.height!==expected[1])throw Error('Wrong camper atlas size');
    const c=createCanvas(...expected).getContext('2d');c.drawImage(image,0,0);
    if(!index)native=c.canvas;
    const layout=[...cells(Boolean(index),soles)].filter(cell=>!modular||!cell.head).map(cell=>
      modular&&index?{...cell,row:cell.row-directionCount}:cell);
    const collars=new Map();
    for(const cell of layout){
      const {col,row,unit,head,neck,sole}=cell,w=cellWidth*unit,h=cellHeight*unit;
      const frame=c.getImageData(col*w,row*h,w,h),m=measureCamperLayer(frame,cell);
      const samples=sampleCamperMaterials(frame,cell);
      const target=targetHead(cell),tol=contract.tolerance;
      const id=[index?'walk':'native',col,row].join('/');
      collars.set(col+'/'+row,collarEdges(frame,cell));
      const check=(key,delta,limit)=>{if(delta>limit)violations.push({id,key,delta,limit});};
      if(head){
        check('head span',Math.abs(m.span-target.span),tol.span);
        check('crown height',Math.abs(neck-m.top-target.crown),tol.crown);
      }else check('sole',Math.abs(m.foot-sole),tol.sole);
      if(m.top===0||m.left===0||m.right>=cellWidth||m.foot>=cellHeight)violations.push({id,key:'clipped edge'});
      const required=head?['hair',...(cell.d===0||cell.d===3?['skin']:[])]:[cell.style?'hoodie':'jacket','trousers','boots'];
      for(const name of required)if(!samples[name])violations.push({id,key:'missing '+name});
      for(const [name,value] of Object.entries(samples)){
        check(name,Math.max(...value.map((v,i)=>Math.abs(v-contract.swatches[name][i]))),tol.materialChannel);
      }
      results.push({id,pose:cell.pose,style:cell.style,d:cell.d,head,...m,samples});
    }
    for(const cell of layout){
      if(cell.head)continue;
      const {col,row,unit,style,pose,d}=cell,body=collars.get(col+'/'+row);
      for(const hair of [0,1]){
        let headCol=col-4,headRow=row+(hair-style)*2;
        if(index){headCol=col%8+hair*8;headRow=d;}
        else if(pose==='fallback'){headCol=d;headRow=hair*2;}
        const head=modular?modularCollar(native,cell,hair):collars.get(headCol+'/'+headRow);
        const joined=body.filter((y,x)=>y!==null&&head[x]!==null&&y-head[x]<=unit);
        if(joined.length<body.length/2)violations.push({id:[index?'walk':'native',col,row].join('/'),
          key:'open collar',hair,joined:joined.length});
      }
    }
  }
  return {results,violations};
}
