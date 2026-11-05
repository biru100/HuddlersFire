// Non-colliding ground cover; interactive/colliding placements live in camp-maps.
const gardens={
  camp:[[-9,-8],[-8,-9],[-9,-4],[-8,-4],[-9,6],[8,-8],[9,-6],[8,2],[9,3],[-6,9],[7,9],[1,-8]],
  playground:[[-9,-8],[-8,-8],[8,-9],[9,-4],[9,3],[-9,5],[-8,6],[5,9]],
  showroom:[[-9,-6],[-8,-7],[7,-8],[8,-7],[-8,4],[4,-8],[-7,8],[8,-4]],
};
export const SCENE_STYLE={camp:{name:'숲속 모닥불',ground:'grass'},playground:{name:'햇살 놀이터',ground:'grass'},showroom:{name:'허들러즈 게임 마켓',ground:'stone'}};
export function sceneDecorations(mapId){return (gardens[mapId]||gardens.camp).map(([x,y],i)=>({type:'garden',x,y,variant:i%4===0?'rock':'flowers',scale:.7+(i%3)*.15}));}
