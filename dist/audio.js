// Synthesised poultry calls: a low glottal pulse, resonant formants and a breathy attack.
// Everything is local and starts only after a player's interaction.
export class FarmAudio {
  constructor(){this.context=null;this.muted=false;this.lastCluck=[-10,-10];}
  async unlock(){try{if(!this.context){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;this.context=new Context();this.master=this.context.createGain();this.master.gain.value=this.muted?0:.36;this.master.connect(this.context.destination);const n=this.context.sampleRate;this.noise=this.context.createBuffer(1,n,this.context.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<n;i++)data[i]=Math.random()*2-1;}if(this.context.state==='suspended')await this.context.resume();}catch{/* Audio is optional if a browser disables it. */}}
  setMuted(muted){this.muted=muted;if(this.context)this.master.gain.setTargetAtTime(muted?0:.36,this.context.currentTime,.025);}
  cluck(player=0,force=false){const c=this.context;if(!c||c.state!=='running'||this.muted)return;const now=c.currentTime;if(!force&&now-this.lastCluck[player]<.65)return;this.lastCluck[player]=now;const pitch=player===0?1.12:.88;
    for(let syllable=0;syllable<2;syllable++){
      const t=now+syllable*.155,duration=syllable===0?.13:.2;
      const source=c.createOscillator(),mod=c.createOscillator(),modGain=c.createGain(),filter=c.createBiquadFilter(),env=c.createGain(),pan=c.createStereoPanner();
      source.type='sawtooth';source.frequency.setValueAtTime(350*pitch,t);source.frequency.exponentialRampToValueAtTime(155*pitch,t+duration*.65);source.frequency.exponentialRampToValueAtTime(205*pitch,t+duration);
      mod.frequency.value=49;modGain.gain.value=38;mod.connect(modGain);modGain.connect(source.frequency);filter.type='bandpass';filter.frequency.setValueAtTime(1450*pitch,t);filter.frequency.exponentialRampToValueAtTime(650*pitch,t+duration);filter.Q.value=2.3;
      env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(.34,t+.009);env.gain.exponentialRampToValueAtTime(.001,t+duration);pan.pan.value=player===0?-.35:.35;source.connect(filter);filter.connect(env);env.connect(pan);pan.connect(this.master);source.start(t);mod.start(t);source.stop(t+duration);mod.stop(t+duration);source.onended=()=>{source.disconnect();mod.disconnect();modGain.disconnect();filter.disconnect();env.disconnect();pan.disconnect();};
      const breath=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();breath.buffer=this.noise;f.type='bandpass';f.frequency.value=1800;f.Q.value=1.8;g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.09);breath.connect(f);f.connect(g);g.connect(this.master);breath.start(t);breath.stop(t+.1);breath.onended=()=>{breath.disconnect();f.disconnect();g.disconnect();};
    }
  }
  bell(final=false){const c=this.context;if(!c||c.state!=='running'||this.muted)return;for(let i=0;i<(final?3:1);i++){const t=c.currentTime+i*.13,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=final?[523.25,659.25,783.99][i]:720;g.gain.setValueAtTime(.13,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.31);o.onended=()=>{o.disconnect();g.disconnect();};}}
}
