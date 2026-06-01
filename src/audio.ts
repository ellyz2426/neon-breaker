// audio.ts — Neon Breaker VR: Procedural Web Audio

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicOsc: OscillatorNode | null = null;
  private musicLfo: OscillatorNode | null = null;
  private musicPad: OscillatorNode | null = null;

  private init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.masterGain);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.masterGain);
  }

  setVolumes(master: number, sfx: number, music: number) {
    this.init();
    if (this.masterGain) this.masterGain.gain.value = master;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
    if (this.musicGain) this.musicGain.gain.value = music;
  }

  private playTone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.3) {
    this.init();
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(this.sfxGain!);
    o.start(c.currentTime);
    o.stop(c.currentTime + dur);
  }

  private playNoise(dur: number, vol = 0.15) {
    this.init();
    const c = this.ctx!;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 2000;
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxGain!);
    src.start(c.currentTime);
  }

  playBrickHit(multiplier = 1) {
    const baseFreq = 440 + multiplier * 40;
    this.playTone(baseFreq, 0.08, 'square', 0.25);
    this.playNoise(0.04, 0.1);
  }

  playBrickDestroy() {
    this.playTone(660, 0.15, 'sawtooth', 0.3);
    this.playTone(880, 0.12, 'square', 0.2);
    this.playNoise(0.06, 0.12);
  }

  playExplosion() {
    this.init();
    const c = this.ctx!;
    const buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(0.4, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 600;
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxGain!);
    src.start(c.currentTime);
    this.playTone(80, 0.3, 'sawtooth', 0.3);
  }

  playGoldenCollect() {
    [880, 1100, 1320, 1760].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.25), i * 60);
    });
  }

  playPaddleHit() {
    this.playTone(220, 0.08, 'triangle', 0.2);
    this.playNoise(0.03, 0.08);
  }

  playWallBounce() {
    this.playTone(330, 0.05, 'square', 0.12);
  }

  playBallLost() {
    [440, 330, 220, 110].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sawtooth', 0.25), i * 100);
    });
  }

  playPowerUp() {
    [440, 660, 880].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 80);
    });
  }

  playLaser() {
    this.playTone(1200, 0.08, 'sawtooth', 0.15);
    this.playTone(800, 0.06, 'square', 0.1);
  }

  playLevelComplete() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.3), i * 100);
    });
  }

  playGameOver() {
    [440, 370, 294, 220].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sawtooth', 0.2), i * 150);
    });
  }

  playCountdownTick() {
    this.playTone(880, 0.08, 'square', 0.2);
  }

  playCountdownGo() {
    this.playTone(1320, 0.2, 'sine', 0.3);
    this.playTone(1760, 0.15, 'square', 0.2);
  }

  playButtonClick() {
    this.playTone(660, 0.04, 'sine', 0.15);
  }

  playAchievement() {
    const notes = [523, 659, 784, 1047, 1320];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.25), i * 80);
    });
  }

  playShieldBlock() {
    this.playTone(440, 0.15, 'square', 0.2);
    this.playNoise(0.08, 0.15);
    this.playTone(660, 0.1, 'sawtooth', 0.15);
  }

  playBossIntro() {
    // Ominous descending power chord
    [220, 185, 147, 110, 82.5].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.35, 'sawtooth', 0.3);
        this.playTone(freq * 1.5, 0.3, 'square', 0.15);
      }, i * 120);
    });
    setTimeout(() => this.playNoise(0.3, 0.2), 600);
  }

  playBossDefeat() {
    // Triumphant ascending fanfare
    const notes = [523, 659, 784, 1047, 1320, 1568];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.3);
        this.playTone(freq * 0.5, 0.25, 'triangle', 0.15);
      }, i * 100);
    });
  }

  playFireball() {
    this.playTone(150, 0.12, 'sawtooth', 0.2);
    this.playNoise(0.08, 0.1);
  }

  startMusic() {
    this.init();
    if (this.musicOsc) return;
    const c = this.ctx!;
    // Bass drone
    this.musicOsc = c.createOscillator();
    this.musicOsc.type = 'sine';
    this.musicOsc.frequency.value = 55;
    const bassGain = c.createGain();
    bassGain.gain.value = 0.15;
    this.musicOsc.connect(bassGain);
    bassGain.connect(this.musicGain!);
    this.musicOsc.start();
    // LFO
    this.musicLfo = c.createOscillator();
    this.musicLfo.type = 'sine';
    this.musicLfo.frequency.value = 0.15;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 3;
    this.musicLfo.connect(lfoGain);
    lfoGain.connect(this.musicOsc.frequency);
    this.musicLfo.start();
    // Pad
    this.musicPad = c.createOscillator();
    this.musicPad.type = 'triangle';
    this.musicPad.frequency.value = 82.5;
    const padGain = c.createGain();
    padGain.gain.value = 0.08;
    const padFilter = c.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 400;
    this.musicPad.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(this.musicGain!);
    this.musicPad.start();

    // Arpeggiator
    this.startArpeggiator();
  }

  private arpInterval: number | null = null;
  private arpNoteIdx = 0;
  private arpChordIdx = 0;
  private arpChords = [
    [110, 165, 220, 275, 330],   // Am
    [130.8, 196, 261.6, 330, 392], // C
    [146.8, 220, 293.7, 370, 440], // D
    [98, 146.8, 196, 247, 293.7],  // G
  ];

  private startArpeggiator() {
    this.arpInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain) return;
      const chord = this.arpChords[this.arpChordIdx % this.arpChords.length];
      const freq = chord[this.arpNoteIdx % chord.length];

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.06, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 800;
      osc.connect(f);
      f.connect(g);
      g.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);

      this.arpNoteIdx++;
      if (this.arpNoteIdx >= chord.length) {
        this.arpNoteIdx = 0;
        this.arpChordIdx++;
      }
    }, 200);
  }

  stopMusic() {
    try { this.musicOsc?.stop(); } catch { /* */ }
    try { this.musicLfo?.stop(); } catch { /* */ }
    try { this.musicPad?.stop(); } catch { /* */ }
    this.musicOsc = null;
    this.musicLfo = null;
    this.musicPad = null;
    if (this.arpInterval) {
      clearInterval(this.arpInterval);
      this.arpInterval = null;
    }
  }
}
