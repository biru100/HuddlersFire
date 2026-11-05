// Replaces only the external media API. Does not claim real YouTube audio/autoplay coverage.
export const youtubeFixture = `
const nativeFetch=window.fetch.bind(window);
window.fetch=(input,options)=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href);
  if(url.origin===location.origin&&url.pathname==='/api/camp/music-metadata')return Promise.resolve(new Response(JSON.stringify({title:url.searchParams.get('videoId')}),{headers:{'Content-Type':'application/json'}}));
  return nativeFetch(input,options);
};
window.__ytPlayers=[];
window.YT={Player:class {
  constructor(node,options){
    this.options=options;this.state=-1;this.position=0;this.muted=false;this.volume=100;this.loads=[];
    this.doc=node.ownerDocument;
    const iframe=this.doc.createElement('iframe');iframe.title='YouTube test fixture';iframe.width='300';iframe.height='200';
    node.replaceWith(iframe);this.iframe=iframe;window.__ytPlayers.push(this);
    setTimeout(()=>{this.ready=true;options.events.onReady();},0);
  }
  loadVideoById(o){this.videoId=o.videoId;this.position=o.startSeconds;this.loads.push(o);this.state=1;this.options.events.onStateChange({data:1});}
  cueVideoById(o){this.videoId=o.videoId;this.position=o.startSeconds;this.state=5;}
  playVideo(){this.state=1;this.options.events.onStateChange({data:1});}
  pauseVideo(){this.state=2;this.options.events.onStateChange({data:2});}
  stopVideo(){this.state=2;}
  destroy(){this.destroyed=true;this.iframe.remove();}
  seekTo(p){this.position=p;}
  getCurrentTime(){return this.position;}
  getPlayerState(){return this.state;}
  getVideoUrl(){return 'https://youtu.be/'+this.videoId;}
  setVolume(v){this.volume=v;}
  mute(){this.muted=true;}
  unMute(){this.muted=false;}
}};`;
