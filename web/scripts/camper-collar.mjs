// Separate a painted head at the garment edge. The bun, loose ends and jaw
// belong to the head; the jacket lapels and the hood belong to the torso.
export function separateCamper(rgba, w, h, {hoodie, neck, unit, gesture=false}) {
  const heads = new Uint8Array(w*h);
  const pivot = Math.floor(w/2);
  // Trace one continuous painted seam across the image. Independent column
  // thresholds leave little vertical strips of lapel hanging from the hair.
  const low=Math.round(neck-6*unit), high=Math.round(neck+4*unit), levels=high-low+1;
  const back=new Int8Array(w*levels);
  let last=new Float64Array(levels);
  for(let x=0;x<w;x++){
    const next=new Float64Array(levels), weights=[];
    for(let y=low;y<=high;y++){
      const i=(y*w+x)*4, r=rgba[i],g=rgba[i+1],b=rgba[i+2],a=rgba[i+3]/255;
      const cloth=hoodie ? g>=r*.99 && b>=r*.94
        : (g>r*.84 && g>b*1.12) || (r>107 && r>g*1.42 && g>b*1.30);
      const skinOrHair=r>g*1.13 && g<b*1.31;
      weights.push(a*(cloth?2.8:skinOrHair?-1.7:0)/unit);
    }
    let membership=0;
    for(let l=0;l<levels;l++){
      const y=low+l,i=(y*w+x)*4,j=i-w*4;
      const delta=Math.abs(rgba[i]-rgba[j])+Math.abs(rgba[i+1]-rgba[j+1])+Math.abs(rgba[i+2]-rgba[j+2]);
      const edge=Math.min(2.6,delta/65)*Math.min(rgba[i+3],rgba[j+3])/255;
      const guess=neck-Math.min(6*unit,.18*Math.abs(x-pivot));
      let best=last[l], direction=0;
      for(const offset of [-1,1]){
        if(l+offset<0||l+offset>=levels)continue;
        const cost=last[l+offset]+1.4;
        if(cost<best){best=cost;direction=offset;}
      }
      next[l]=best+membership-edge+.28*Math.abs(y-guess)/unit;
      back[x*levels+l]=direction;membership+=weights[l];
    }
    last=next;
  }
  const cuts=new Int16Array(w);
  let level=last.indexOf(Math.min(...last));
  for(let x=w-1;x>=0;x--){
    const cut=low+level;cuts[x]=cut;
    for(let y=0;y<cut;y++) if(rgba[(y*w+x)*4+3]>=24)heads[y*w+x]=1;
    level+=back[x*levels+level];
  }
  // Keep only the cut components attached to the head and the torso. This
  // retains the tip of the bob and puts detached raised hands back on the body.
  const largest = label => {
    const visited=new Uint8Array(w*h);
    let best=[];
    for(let i=0;i<visited.length;i++){
      if(visited[i] || heads[i]!==label || rgba[i*4+3]<24)continue;
      const group=[i];visited[i]=1;
      for(let n=0;n<group.length;n++){
        const p=group[n],x=p%w;
        for(const q of [x?p-1:-1,x<w-1?p+1:-1,p-w,p+w]){
          if(q<0||q>=visited.length||visited[q]||heads[q]!==label||rgba[q*4+3]<24)continue;
          group.push(q);visited[q]=1;
        }
      }
      if(group.length>best.length)best=group;
    }
    return new Set(best);
  };
  const crown=largest(1), torso=largest(0);
  const head=new Uint8ClampedArray(rgba.length), body=new Uint8ClampedArray(rgba.length);
  for(let p=0;p<heads.length;p++){
    const i=p*4;
    if(!rgba[i+3])continue;
    const y=Math.floor(p/w),x=p%w;
    const isHead=heads[p] ? crown.has(p) : !torso.has(p) && y<=neck+2*unit;
    // Lower detached details such as a raised boot stay with the garment.
    const layer=isHead || (rgba[i+3]<24 && y<cuts[x]) ? head : body;
    layer.set(rgba.subarray(i,i+4),i);
  }
  const centralCuts=cuts.slice(pivot-Math.ceil(2*unit),pivot+Math.ceil(2*unit)+1).sort();
  const socket=centralCuts[Math.floor(centralCuts.length/2)];
  const join=[];
  for(let x=pivot-Math.round(9*unit);x<=pivot+Math.round(9*unit);x++){
    const i=(cuts[x]*w+x)*4;
    if(body[i+3]>120 && head[i-4*w+3]>120)join.push(x);
  }
  const socketX=join.length?(join[0]+join.at(-1))/2:pivot;
  // Supply a short underlap at the centre of the collar. A different jaw
  // can expose these pixels; hands and other foreground details keep their ink.
  // A high-resolution jaw includes antialiased edges. Fill beneath the full
  // collar with a taper so its colour does not give way to background pinholes.
  const collarRadius=Math.round((unit>1?13:4)*unit);
  for(let x=pivot-collarRadius;x<=pivot+collarRadius;x++){
    let y=Math.max(Math.round(neck-6*unit),cuts[x]-1);
    while(y<h && body[(y*w+x)*4+3]<190)y++;
    if(y>=neck+7*unit)continue;
    const i=(y*w+x)*4;
    const taper=unit>1?Math.min(1,(collarRadius-Math.abs(x-pivot))/(3*unit)):1;
    for(let k=1;k<=Math.round((gesture?1:2)*unit*taper);k++){
      const dest=i-k*w*4;
      if(!body[dest+3])body.set(body.subarray(i,i+4),dest);
    }
  }
  return {head,body,socket,socketX};
}
