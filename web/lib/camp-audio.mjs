export class CampAudio {
  constructor(Context = globalThis.AudioContext) { this.Context = Context; }
  async setVolume(volume) {
    if (!this.context && volume > 0) {
      const context = new this.Context(); this.context = context;
      const gain = context.createGain(); gain.gain.value = 0; gain.connect(context.destination); this.gain = gain;
      const buffer = context.createBuffer(1, context.sampleRate * 7, context.sampleRate), data = buffer.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < data.length; i++) { brown = (brown + (Math.random() * 2 - 1) * .025) / 1.025; data[i] = brown * 2.8; }
      // Crackles are part of the looping audio buffer, so Window timer throttling cannot remove them.
      for (let start = .4; start < 7; start += .65 + Math.random() * .3) {
        const offset=Math.floor(start*context.sampleRate), length=Math.floor(context.sampleRate*.07);
        for(let i=0;i<length&&offset+i<data.length;i++)data[offset+i]+=(Math.random()*2-1)*Math.exp(-i/(context.sampleRate*.006))*.35;
      }
      const fade=Math.floor(context.sampleRate*.02);
      for(let i=0;i<fade;i++){data[i]*=i/fade;data[data.length-1-i]*=i/fade;}
      const noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true;
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 780;
      noise.connect(filter); filter.connect(gain); noise.start(); this.noise = noise;
    }
    this.volume = volume;
    if (this.context) { await this.context.resume(); this.gain.gain.setTargetAtTime(volume * .45, this.context.currentTime, .12); }
  }
  async resume() { if(this.volume>0&&this.context&&this.context.state!=='running'&&this.context.state!=='closed')await this.context.resume(); }
  destroy() { this.noise?.stop(); void this.context?.close().catch(()=>{}); }
}
