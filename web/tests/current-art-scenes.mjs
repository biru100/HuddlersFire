// Shared by the native and browser recorders. Take these values after the final game draw.
export const reviewSizes = {desktop:[900,640], mobile:[390,520]};
export const reviewMaps = ['camp','playground','showroom'];
export const actionCases = ['seat-ne','seat-nw','seat-exit','shade-back','shade-between','shade-front',
  'spring-takeoff','spring-air','spring-landing','booth-back','booth-between','booth-front'];

export function captureState(renderer,scene,backend){
  const status=renderer.assets.spriteStatus(renderer.assetIds);
  if(status.loading || status.failed.length)throw Error('Scene assets incomplete: '+JSON.stringify(status));
  return {
    width:renderer.width,height:renderer.height,dpr:renderer.dpr,backend,map:scene.mapId,
    time:renderer.sceneTime,theme:renderer.theme,zoom:scene.zoom,camera:renderer.camera,
    self:scene.self,players:scene.players.map(p=>({id:p.id,x:p.x,y:p.y,z:p.z??0,seat:p.seatId??null,
      motion:p.motion,sitting:!!p.sitting,color:p.color,hair:p.hairStyle??0,top:p.topStyle??0})),
  };
}
