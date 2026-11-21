import {createCanvas,loadImage} from '@napi-rs/canvas';
import {camperPartCell} from '../lib/camp-camper-parts.mjs';
import {camperAtlasDimensions,contract,measureCamperLayer,sampleCamperMaterials} from './camper-consistency.mjs';

export async function inspectHeadAtlas(bytes,detailed,recipe){
  const image=await loadImage(bytes),[w,h]=detailed?contract.walkCell:contract.cell,unit=w/contract.cell[0];
  const [width,height]=camperAtlasDimensions(detailed,true);
  if(image.width!==width||image.height!==height)throw Error('Invalid modular head atlas');
  const ctx=createCanvas(image.width,image.height).getContext('2d');
  ctx.drawImage(image,0,0);
  const crop=(part,layer,style)=>{
    const [col,row]=camperPartCell(part,layer,style,detailed);
    return ctx.getImageData(col*w,row*h,w,h).data;
  };
  const results=[];
  const silhouettes=new Map();
  const combined=new Uint8ClampedArray(w*h*4);
  function swatch(name,pixels,cell,frame){
    const rgb=sampleCamperMaterials({width:w,data:pixels},cell)[name];
    const target=recipe.swatches?.[name]??contract.swatches[name];
    if(!rgb||rgb.some((n,channel)=>Math.abs(n-target[channel])>contract.tolerance.materialChannel))
      throw Error(`Head material ${name} outside palette: ${frame}`);
  }
  const directions=contract.directions.length;
  for(const group of detailed?[8]:[0,2,4,6]) for(let index=0;index<(detailed?contract.walkSteps:2)*directions;index++){
    const part={group,index},d=group===4?0:index%directions;
    const face=crop(part,'face',0),bob=crop(part,'hair',0),bun=crop(part,'hair',1);
    const entry=(detailed?recipe.walk:recipe.native)[d];
    const zones=recipe.protectedFeatures[detailed?'walk':'native'][d] || [];
    let skin=0,different=0,core=0,covered=0,leakedSkin=0;
    let left=w,top=h,right=0,bottom=0;
    const silhouette=Buffer.alloc(w*h);
    for(let i=0;i<face.length;i+=4){
      const x=((i/4)%w+.5)/unit,y=(Math.floor(i/(4*w))+.5)/unit;
      if(face[i+3]>180 && face[i]>165 && face[i+1]>100)skin++;
      silhouette[i/4]=face[i+3];
      if(face[i+3]>180){
        const px=i/4%w,py=Math.floor(i/(4*w));
        left=Math.min(left,px);right=Math.max(right,px+1);
        top=Math.min(top,py);bottom=Math.max(bottom,py+1);
      }
      if(Math.abs(bob[i+3]-bun[i+3])>128)different++;
      if(y>20)for(const hair of [bob,bun]){
        if(hair[i+3]>180&&hair[i]>185&&hair[i+1]>122&&hair[i+2]>90&&hair[i+1]>hair[i]*.62)
          leakedSkin++;
      }
      if(face[i+3]<200 || !zones.some(([l,t,r,b])=>x>=l&&x<r&&y>=t&&y<b))continue;
      core++;
      if(bob[i+3]>0||bun[i+3]>0)covered++;
    }
    if(skin<100*unit*unit || different<40*unit*unit || (entry.features && core<30*unit*unit))
      throw Error('Missing face or indistinguishable hair '+[detailed,group,index,skin,different,core]);
    const expected=recipe.faceBounds[detailed?'walk':'native'][d];
    if([left,top,right,bottom].some((value,i)=>value!==expected[i]) ||
        (silhouettes.has(d)&&!silhouettes.get(d).equals(silhouette)))
      throw Error('Shared skull or jaw moved '+[detailed,group,index]);
    if(covered || leakedSkin)throw Error('Hair paints facial features '+[detailed,group,index,covered,leakedSkin]);
    const frame=[detailed?'walk':'native',group,index].join('/');
    const cell={unit,head:true,d,neck:contract.neck,sole:contract.standingSoles[d]};
    if(d===0||d===3)swatch('skin',face,cell,frame);
    for(const [style,hair] of [bob,bun].entries()){
      swatch('hair',hair,cell,frame+'/'+style);
      for(let i=3;i<combined.length;i+=4)combined[i]=hair[i]+face[i]*(1-hair[i]/255);
      const bounds=measureCamperLayer({width:w,height:h,data:combined},cell);
      const span=recipe.headSpan?.[style][d]??contract.headSpan[style][d];
      const crown=recipe.crownToNeck?.[style][d]??contract.crownToNeck[style];
      if(Math.abs(bounds.span-span)>contract.tolerance.span||
          Math.abs(contract.neck-bounds.top-crown)>contract.tolerance.crown||
          bounds.left===0||bounds.right===contract.cell[0]||bounds.top===0||bounds.foot===contract.cell[1])
        throw Error(`Combined head outside size contract: ${frame}/${style}`);
    }
    silhouettes.set(d,silhouette);
    results.push({group,index,core,covered});
  }
  return results;
}
