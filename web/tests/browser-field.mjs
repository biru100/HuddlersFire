// Test-only Canvas observation and keyboard walking. No app debug API or personal browser.
import { getMap } from '../lib/camp-maps.mjs';
import { validPosition } from '../lib/camp-world.mjs';
export const observeField = `(()=>{
  const ellipse=CanvasRenderingContext2D.prototype.ellipse;
  CanvasRenderingContext2D.prototype.ellipse=function(...args){
    if(args[2]===19&&args[3]===10&&this.lineWidth===1&&(this.strokeStyle==='#cfcfcf55'||String(this.strokeStyle).startsWith('rgba(207, 207, 207,')||this.strokeStyle==='#b5542980'||String(this.strokeStyle).startsWith('rgba(181, 84, 41,'))){
      const m=this.getTransform(),r=this.canvas.getBoundingClientRect(),dpr=this.canvas.width/r.width,s=m.a/dpr;
      window.__fieldPosition={x:(m.e/dpr-r.width*.51)/(80*s)+(m.f/dpr-r.height*.56)/(40*s),y:(m.f/dpr-r.height*.56)/(40*s)-(m.e/dpr-r.width*.51)/(80*s)};
    }
    return ellipse.apply(this,args);
  };
})();`;
export function fieldWalker(evaluate) {
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const keys=async codes=>evaluate(`(()=>{document.querySelector('[data-camp-input]').focus();for(const code of ['KeyW','KeyA','KeyS','KeyD'])window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));for(const code of ${JSON.stringify(codes)})window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));})()`);
  return async(mapId,target)=>{
    await evaluate(`(()=>{const stand=[...document.querySelectorAll('.fire-seat-tools button')].find(b=>b.textContent.includes('일어나기'));if(stand)stand.click();else{const sit=document.querySelector('.sit-button');if(sit?.classList.contains('is-sitting'))sit.click();}})()`);
    await delay(800);
    await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='전체 보기').click()`);
    await delay(350);
    const start=await evaluate('window.__fieldPosition');if(!start)throw Error('Self position observation unavailable');
    const step=.4,queue=[{x:start.x,y:start.y,path:[]}],visited=new Set(['0,0']);let path;
    for(let i=0;i<queue.length;i++){
      const p=queue[i];if(Math.hypot(p.x-target.x,p.y-target.y)<(target.type==='gameBooth'?1.5:1.2)){path=p.path;break;}
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const x=p.x+dx*step,y=p.y+dy*step,key=Math.round((x-start.x)/step)+','+Math.round((y-start.y)/step);
        if(visited.has(key)||!validPosition(x,y,mapId)||!validPosition((x+p.x)/2,(y+p.y)/2,mapId)||getMap(mapId).obstacles.some(o=>Math.hypot(x-o.x,y-o.y)<=o.r+.5))continue;
        visited.add(key);queue.push({x,y,path:[...p.path,{x,y}]});
      }
    }
    if(!path)throw Error('No walking path to '+target.id);
    const deadline=Date.now()+20000;
    try{
      for(const waypoint of path){
        while(true){
          if(Date.now()>deadline)throw Error('Walking timed out at '+JSON.stringify(await evaluate('window.__fieldPosition')));
          const p=await evaluate('window.__fieldPosition'),dx=waypoint.x-p.x,dy=waypoint.y-p.y;
          if(Math.hypot(dx,dy)<.13)break;
          const sx=Math.sign(dx),sy=Math.sign(dy);
          const codes=Math.abs(dx)>2*Math.abs(dy)?(sx>0?['KeyD','KeyS']:['KeyW','KeyA']):Math.abs(dy)>2*Math.abs(dx)?(sy>0?['KeyA','KeyS']:['KeyW','KeyD']):sx>0?(sy>0?['KeyS']:['KeyD']):(sy>0?['KeyA']:['KeyW']);
          await keys(codes);await delay(35);
        }
      }
    }finally{await keys([]);}
    await delay(200);
    if(['portal','gameBooth'].includes(target.type)&&!(await evaluate(`!!document.querySelector('.world-interact')`)))throw Error('No nearby interaction for '+target.id);
  };
}
export const portalTo = (mapId,destination)=>getMap(mapId).portals.find(o=>o.destination===destination);
