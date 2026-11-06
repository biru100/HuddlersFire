import { emptyFire, fireStrength } from './camp-fire.mjs';
// Recorded campfire: Glaneur de sons, CC BY 3.0. See public/audio/CREDITS.txt.
export class CampAudio {
  constructor(Context=globalThis.AudioContext||globalThis.webkitAudioContext,request=globalThis.fetch) {
    this.Context=Context;this.request=request;this.volume=0;this.strength=.55;this.inCamp=true;this.seenFlare=new Set();this.initializedScene=false;
    this.status='muted';this.listeners=new Set();
  }
  subscribe(listener){this.listeners.add(listener);listener(this.status);return()=>this.listeners.delete(listener);}
  refreshStatus(){const next=this.destroyed?'stopped':!this.volume?'muted':this.loadError?'failed':this.context?.state!=='running'?'blocked':!this.buffer||!this.noise?'loading':!this.inCamp?'outside':'playing';if(next!==this.status){this.status=next;for(const listener of this.listeners)listener(next);}}
  async load() {
    if(this.buffer)return this.buffer;
    if(!this.loading)this.loading=(async()=>{
      const response=await this.request('/audio/campfire.ogg');if(!response.ok)throw Error('모닥불 소리를 불러오지 못했어요.');
      const decoded=await this.context.decodeAudioData(await response.arrayBuffer());
      if(this.destroyed)return null;
      const fade=Math.min(Math.floor(decoded.sampleRate*.18),Math.floor(decoded.length/4));
      const buffer=this.context.createBuffer(decoded.numberOfChannels,decoded.length-fade,decoded.sampleRate);
      for(let ch=0;ch<decoded.numberOfChannels;ch++) {
        const src=decoded.getChannelData(ch),dst=buffer.getChannelData(ch);dst.set(src.subarray(fade));
        for(let i=0;i<fade;i++){const t=i/fade;dst[dst.length-fade+i]=src[src.length-fade+i]*(1-t)+src[i]*t;}
      }
      this.buffer=buffer;return buffer;
    })().catch(error=>{this.loading=null;throw error;});
    return this.loading;
  }
  async setVolume(volume) {
    if(this.destroyed)return;
    const generation=this.generation=(this.generation||0)+1;
    this.volume=Number.isFinite(volume)?Math.max(0,Math.min(1,volume)):0;
    this.loadError=false;
    try{
    if(!this.context&&this.volume>0) {
      this.context=new this.Context();this.gain=this.context.createGain();this.gain.gain.value=0;this.gain.connect(this.context.destination);
      this.campGain=this.context.createGain();this.campGain.gain.value=this.inCamp?1:0;this.campGain.connect(this.gain);
      this.ambienceGain=this.context.createGain();this.ambienceGain.gain.value=.18+.32*this.strength;this.ambienceGain.connect(this.campGain);
      this.stateChanged=()=>this.refreshStatus();this.context.addEventListener?.('statechange',this.stateChanged);
    }
    if(!this.context){this.refreshStatus();return;}
    this.applyGain();
    this.refreshStatus();
    if(!this.volume)return;
    const [buffer]=await Promise.all([this.load(),this.context.state==='running'?undefined:this.context.resume()]);
    if(!this.destroyed&&this.volume>0&&!this.noise&&buffer) {
      const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.ambienceGain);source.start();this.noise=source;
    }
    this.refreshStatus();
    }catch(error){if(!this.destroyed&&this.volume>0&&this.generation===generation){this.loadError=true;this.refreshStatus();}throw error;}
  }
  applyGain(){
    if(!this.gain)return;
    const at=this.context.currentTime;
    if(this.appliedVolume!==this.volume){
      const gain=this.gain.gain;gain.cancelScheduledValues(at);
      gain.setValueAtTime(this.volume?gain.value:0,at);
      if(this.volume)gain.setTargetAtTime(this.volume,at,.025);
      this.appliedVolume=this.volume;
    }
    this.campGain.gain.setTargetAtTime(this.inCamp?1:0,at,.08);
    this.ambienceGain.gain.setTargetAtTime(.18+.32*this.strength,at,.25);
  }
  updateScene(fire=emptyFire(),now=0,inCamp=true) {
    this.strength=fireStrength(fire,now);this.inCamp=inCamp;this.applyGain();this.refreshStatus();
    const key=fire.xp+':'+fire.stokedAt;
    if(this.initializedScene&&fire.stokedAt>=0&&!this.seenFlare.has(key)&&now>=fire.stokedAt&&now-fire.stokedAt<1200&&inCamp)this.flare();
    this.seenFlare.add(key);if(this.seenFlare.size>100)this.seenFlare.delete(this.seenFlare.values().next().value);
    this.initializedScene=true;
  }
  flare() {
    if(!this.buffer||!this.context||!this.volume||this.context.state!=='running')return;
    const source=this.context.createBufferSource(),gain=this.context.createGain(),at=this.context.currentTime;
    source.buffer=this.buffer;source.playbackRate.value=.85;source.connect(gain);gain.connect(this.campGain);
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.23,at+.15);gain.gain.linearRampToValueAtTime(0,at+1.8);
    this.flares??=new Set();this.flares.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.flares.delete(source);};
    source.start(0,Math.min(12,this.buffer.duration/3),2);source.stop(at+2.1);
  }
  async resume(){if(this.volume>0&&this.context&&this.context.state!=='closed'&&(this.context.state!=='running'||!this.noise))await this.setVolume(this.volume);}
  destroy(){this.destroyed=true;this.refreshStatus();this.listeners.clear();this.context?.removeEventListener?.('statechange',this.stateChanged);this.noise?.stop();for(const source of this.flares||[])try{source.stop();}catch{}void this.context?.close().catch(()=>{});}
}
