// Measured in the unscaled, cropped release frames. Support widths are half-widths.
// Deck outlines are on the raised surface; subtracting its elevation from the
// ground projection puts it back on the same pixels as the painted top.
const geometry = {
  shade: {
    feet:[[7,85,3.5],[71,69,3],[103,90,3.5],[47,103,4.5]], origin:[54,85],
    rise:62, deck:[[2,26],[58,2],[110,26],[49,52]],
    // Rear feet remain visible through the opening. The canopy and front post
    // share a depth so that someone underneath passes behind the fabric.
    rearPost:[[56,52,32,52]],leftPost:[[0,52,40,52]],rightPost:[[88,52,24,52]],
    front:[[0,0,112,52],[40,52,16,52]],
    postLayers:[['rearPost',1],['leftPost',0],['rightPost',2],['front',3]],
  },
  trampoline: {
    feet:[[7,52,3],[77,52,3],[42,61,4]], origin:[42,42],
    rise:19, deck:[[2,21],[8,10],[23,3],[43,1],[63,4],[78,11],[83,20],[78,32],[62,41],[42,45],[22,41],[7,32]],
    mat:[42,23,34,16],back:[[0,0,85,30]],front:[[0,30,85,32]],
  },
  gameBooth: {
    feet:[[8,95,4],[109,95,4]],origin:[59,90],
    back:[[14,28,90,68]],front:[[0,0,118,28],[0,28,14,68],[104,28,14,68]],
  },
  'bench-nw': {
    feet:[[20,42,10],[79,66,12]],origin:[55,54],seat:[55,24],
    rise:27,deck:[[2,12],[30,1],[108,35],[81,48]],
    back:[[0,0,55,68]],front:[[55,0,55,68]],
  },
  'bench-ne': {
    feet:[[88,42,10],[26,66,12]],origin:[55,54],seat:[55,22],
    rise:27,deck:[[1,35],[84,1],[108,10],[28,49]],
    back:[[55,0,55,68]],front:[[0,0,55,68]],
  },
  tent:{feet:[[6,97,4],[76,109,5],[112,86,4]],origin:[59,99]},
  fence:{feet:[[7,58,4],[52,42,4]],origin:[30,50]},
  'fence-run':{feet:[[5,84,4]],origin:[45,64],groundLine:[[5,84],[85,44]]},
  'fence-corner':{feet:[[5,84,4],[45,64,4],[85,84,4]],origin:[45,64]},
  portal:{feet:[[12,80,9],[69,80,9]],origin:[41,80]},
  tree:{feet:[[51,95,16]],origin:[51,95]},
  'tree-birch':{feet:[[42,101,12]],origin:[42,101]},
  'tree-pine':{feet:[[43,107,10]],origin:[43,107]},
  crate:{feet:[[15,43,7],[41,33,5]],origin:[24,37]},
  lantern:{feet:[[7,46,6]],origin:[7,46]},
  radio:{feet:[[9,55,5],[37,55,5]],origin:[24,55]},
  sign:{feet:[[28,64,6]],origin:[28,64]},
};

const measuredFrames=new WeakMap();
export function propGeometry(id,frame){
  // Archived or independently staged frames can predate generated placement profiles.
  const original=frame?.placement?.profile??geometry[id];
  if(!original||!frame?.referenceSize)return original;
  if(measuredFrames.has(frame))return measuredFrames.get(frame);
  const sx=frame.w/frame.referenceSize[0],sy=frame.h/frame.referenceSize[1];
  const point=([x,y])=>[x*sx,y*sy];
  const profile={...original,origin:point(original.origin),
    feet:original.feet.map(([x,y,r])=>[x*sx,y*sy,r*sx])};
  if(original.deck)profile.deck=original.deck.map(point);
  if(original.groundLine)profile.groundLine=original.groundLine.map(point);
  if(original.railHeights)profile.railHeights=original.railHeights.map(h=>h*sy);
  if(original.rise)profile.rise=original.rise*sy;
  if(original.mat)profile.mat=[...point(original.mat),...point(original.mat.slice(2))];
  // Round shared boundaries once so every texel belongs to exactly one depth layer.
  const layers=original.postLayers?.map(([key])=>key)??['back','front'];
  for(const key of layers)if(original[key]){
    profile[key]=original[key].map(([x,y,w,h])=>{
      const left=Math.round(x*sx),top=Math.round(y*sy);
      return [left,top,Math.round((x+w)*sx)-left,Math.round((y+h)*sy)-top];
    });
  }
  measuredFrames.set(frame,profile);
  return profile;
}

export function placedGeometry(profile, scale=1, flip=false) {
  if(!profile)return null;
  const [cx,cy]=profile.origin, sx=flip?-scale:scale;
  return {
    contacts:profile.feet.map(([x,y,r])=>({x:(x-cx)*sx,y:(y-cy)*scale,rx:r*scale,ry:Math.max(1.5,r*scale*.26)})),
    deck:profile.deck?.map(([x,y])=>[(x-cx)*sx,(y-cy+profile.rise)*scale]),
    height:(profile.rise||0)*scale/40,
  };
}

// Source and destination rectangles use the same texel edges for colour and normals.
export function drawFrameRegions(c,image,sx,sy,w,h,x,y,width,height,regions){
  if(!regions){c.drawImage(image,sx,sy,w,h,x,y,width,height);return;}
  for(const [u,v,rw,rh] of regions){
    c.drawImage(image,sx+u,sy+v,rw,rh,x+u*width/w,y+v*height/h,rw*width/w,rh*height/h);
  }
}
