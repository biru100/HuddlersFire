// Camera geometry is display-only. World coordinates, aim and authoritative physics
// remain in camp-maps; overview/very tall stacks deliberately permit smaller people.
export function sceneViewport(width,height,occlusions=[]){
 let top=20,bottom=height-24,left=18,right=width-18;
 for(const r of occlusions){
  if(r.width<=0||r.height<=0||r.x+r.width<0||r.x>width)continue;
  if(r.y>=0&&r.y<height*.25)top=Math.max(top,Math.min(height*.32,r.y+r.height+14));
  if(r.y>height*.56&&r.y<height)bottom=Math.min(bottom,r.y-16);
 }
 const music=occlusions.find(r=>r.kind==='music'&&r.width>width*.4&&r.height>=160&&r.y>top&&r.y<height);
 if(music){if(music.y-top>=260)bottom=Math.min(bottom,music.y-16);else if(music.x>=130)right=Math.min(right,music.x-12);}
 if(bottom-top<150)bottom=Math.min(height-16,top+150);
 return {left,right,top,bottom,width:right-left,height:bottom-top};
}
export function freeCamera(camera,zoom=1){
 const {view,scale,x,y}=camera,anchorX=(view.left+view.right)*.5,anchorY=(view.top+view.bottom)*.5;
 return {x:(anchorX-x)/scale,y:(anchorY-y)/scale,baseScale:scale/zoom};
}
export function panCamera(view,zoom,dx,dy){return {...view,x:view.x-dx/(view.baseScale*zoom),y:view.y-dy/(view.baseScale*zoom)};}
export function zoomCameraAt(view,fromZoom,toZoom,viewport,x,y){
 const anchorX=(viewport.left+viewport.right)*.5,anchorY=(viewport.top+viewport.bottom)*.5;
 const delta=1/(view.baseScale*fromZoom)-1/(view.baseScale*toZoom);
 return {...view,x:view.x+(x-anchorX)*delta,y:view.y+(y-anchorY)*delta};
}
export function sceneCamera({width,height,players,self,follow=true,mode,freeView,zoom=1,focused=0,edge=12,occlusions=[]}){
 mode=mode||(follow?'follow':'overview');
 const view=sceneViewport(width,height,occlusions),mobile=width<600;
 let scale=mode==='overview'?Math.min(view.width/(edge*160),view.height/(edge*80+130))*.97:Math.max(mobile?.88:.94,Math.min(1.16,view.height/610));
 if(mode==='free'&&freeView)scale=freeView.baseScale;
 scale*=Math.max(.75,Math.min(3,zoom));
 let x=(view.left+view.right)*.5,y=view.top+view.height*.54;
 if(mode==='follow'&&self){x-=(self.x-self.y)*40*scale;y-=((self.x+self.y)*20-(self.z||0)*40-28)*scale;}
 if(mode==='free'&&freeView){x-=freeView.x*scale;y=(view.top+view.bottom)*.5-freeView.y*scale;}
 // Seating changes the conversation presentation, never the user's camera.
 const high=players.filter(p=>p.motion!=='respawning'&&(p.z||0)>2.5);
 if(high.length&&mode==='overview'){
  const positions=players.map(p=>({x:(p.x-p.y)*40,y:(p.x+p.y)*20-(p.z||0)*40}));
  const minY=Math.min(...positions.map(p=>p.y-85)),maxY=Math.max(...positions.map(p=>p.y+30));
  scale=Math.min(scale,view.height/(maxY-minY));
  y=view.top-minY*scale;x=width*.5-(Math.min(...positions.map(p=>p.x))+Math.max(...positions.map(p=>p.x)))*.5*scale;
 }
 return {scale,x,y,view,mode};
}
