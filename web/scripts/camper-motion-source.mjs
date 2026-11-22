export function sourcePoseRows(width,height,authoredEdges={}){
  if(Object.keys(authoredEdges).some(key=>!['0','1','2','3'].includes(key)))
    throw Error('Invalid camper crop row');
  return Array.from({length:4},(_,row)=>{
    const edges=authoredEdges[row]??Array.from({length:5},(_,i)=>Math.floor(i*width/4));
    if(edges.length!==5||edges[0]!==0||edges[4]!==width
      ||edges.some((x,i)=>!Number.isInteger(x)||i>0&&x<=edges[i-1]))
      throw Error('Invalid camper crop edges at row '+(row+1));
    const y=Math.floor(row*height/4),bottom=Math.floor((row+1)*height/4);
    return Array.from({length:4},(_,col)=>[edges[col],y,edges[col+1]-edges[col],bottom-y]);
  });
}

// A continuous silhouette on both sides of an internal edge is cut by that crop.
export function crossedPoseEdges(pixels,width,height,rows=sourcePoseRows(width,height)){
  const hits=[];
  const opaque=(x,y)=>pixels[(y*width+x)*4+3]>=128;
  for(const [row,cells] of rows.entries()){
    for(const [column,[x,y,w,h]] of cells.entries()){
      let pixelsAcross=0;
      if(column>0){
        for(let j=y;j<y+h;j++)if(opaque(x-1,j)&&opaque(x,j))pixelsAcross++;
        if(pixelsAcross)hits.push({edge:'column',row,column,at:x,pixelsAcross});
      }
      if(row>0){
        pixelsAcross=0;
        for(let i=x;i<x+w;i++)if(opaque(i,y-1)&&opaque(i,y))pixelsAcross++;
        if(pixelsAcross)hits.push({edge:'row',row,column,at:y,pixelsAcross});
      }
    }
  }
  return hits;
}

export function assertUncutMotionSources(crossings){
  if(crossings.length){
    const summary=crossings.map(({sheet,row,column,edge,at})=>`${sheet} ${edge} ${at} (row ${row+1}, column ${column+1})`);
    throw Error('Camper source crop cuts opaque pose pixels: '+summary.join(', '));
  }
}
