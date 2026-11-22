import {createCanvas} from '@napi-rs/canvas';

export function camperNormal(color,{density,layer,neck=40,blink=false}){
  const {width:w,height:h}=color,ctx=color.getContext('2d');
  const {data}=ctx.getImageData(0,0,w,h);
  const inside=i=>data[i*4+3]>0;
  const count=w*h,distance=new Float32Array(count),relief=new Float32Array(count);
  const step=(i,j,c)=>{distance[i]=Math.min(distance[i],distance[j]+c);};
  for(let i=0;i<count;i++)if(inside(i))distance[i]=w+h;
  // Chamfer distance contours give separate volume to silhouettes such as
  // sleeves and soles. Garment and face relief use their native landmarks.
  for(let i=0;i<count;i++){
    if(!inside(i))continue;
    const x=i%w;
    if(x>0)step(i,i-1,1);
    if(i>=w){
      step(i,i-w,1);
      if(x>0)step(i,i-w-1,Math.SQRT2);
      if(x<w-1)step(i,i-w+1,Math.SQRT2);
    }
  }
  for(let i=count-1;i>=0;i--){
    if(!inside(i))continue;
    const x=i%w;
    if(x<w-1)step(i,i+1,1);
    if(i+w<count){
      step(i,i+w,1);
      if(x>0)step(i,i+w-1,Math.SQRT2);
      if(x<w-1)step(i,i+w+1,Math.SQRT2);
    }
  }
  const bell=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
  for(let i=0;i<count;i++){
    if(!inside(i))continue;
    const x=(i%w+.5)/density,y=(Math.floor(i/w)+.5)/density,d=distance[i]/density;
    const edge=Math.min(1,d/3);
    const contour=(layer==='hair'?3.8:layer==='face'?2.8:2.6)*(1-Math.exp(-d/3.5));
    let detail=0;
    if(layer==='body'){
      detail=1.0*bell(x,y,32,neck+7,10,8)+.3*bell(x,y,31,neck+17,8,3);
      detail+=.43*(bell(x,y,24,neck+20,4,4)+bell(x,y,40,neck+20,4,4));
    }
    if(layer==='face'){
      detail=.6*bell(x,y,33,32,7,4);
      if(blink)detail+=.25*(bell(x,y,27,30,4,1.4)+bell(x,y,37,30,4,1.4));
    }
    relief[i]=(contour+edge*detail)*density;
  }
  const canvas=createCanvas(w,h),out=canvas.getContext('2d'),image=out.createImageData(w,h);
  const pixels=image.data;
  for(let i=0;i<count;i++){
    if(!inside(i))continue;
    const x=i%w,z=relief[i];
    const dx=((x>0?relief[i-1]:z)-(x<w-1?relief[i+1]:z))/2;
    const dy=((i>=w?relief[i-w]:z)-(i+w<count?relief[i+w]:z))/2;
    const length=Math.hypot(dx,dy,1),offset=i*4;
    pixels.set([128+127*dx/length,128-127*dy/length,128+127/length,data[offset+3]],offset);
  }
  out.putImageData(image,0,0);
  return canvas;
}
