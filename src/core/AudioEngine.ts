/**
 * Native Web Audio API procedural synthesizer.
 * Generates an evocative, calming deep-space ambient drone and futuristic UI sound effects
 * entirely in real-time code with 0 external audio files.
 */
export class AudioEngine {
  private static ctx: AudioContext | null = null;
  private static isMuted = true;
  private static ambientOsc1: OscillatorNode | null = null;
  private static ambientOsc2: OscillatorNode | null = null;
  private static ambientGain: GainNode | null = null;
  private static lfo: OscillatorNode | null = null;
  private static masterGain: GainNode | null = null;

  public static init() {
    if (this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported on this browser', e);
    }
  }

  /**
   * Start cosmic ambient synthesizer drone
   */
  public static startAmbientDrone() {
    if (!this.ctx) this.init();
    if (!this.ctx || this.ambientOsc1) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    // Sub-bass fundamental (55 Hz - A1)
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = 'sine';
    this.ambientOsc1.frequency.setValueAtTime(55, t);

    // Warm fifth harmonic (82.4 Hz - E2)
    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = 'triangle';
    this.ambientOsc2.frequency.setValueAtTime(82.4, t);

    // Filter with subtle sweeping resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, t);
    filter.Q.setValueAtTime(3.0, t);

    // LFO for slow meditative filter breathing
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.08, t); // 1 cycle every ~12.5 seconds
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(45, t);
    this.lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.15, t);

    this.ambientOsc1.connect(filter);
    this.ambientOsc2.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain!);

    this.ambientOsc1.start();
    this.ambientOsc2.start();
    this.lfo.start();
  }

  /**
   * Toggle global mute
   */
  public static toggleMute(): boolean {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.masterGain) return true;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;

    if (!this.isMuted && !this.ambientOsc1) {
      this.startAmbientDrone();
    }

    const targetGain = this.isMuted ? 0 : 0.4;
    this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);

    return this.isMuted;
  }

  public static getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Play futuristic UI click
   */
  public static playClick() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {
      // Ignore user gesture restrictions
    }
  }

  /**
   * Play cinematic camera swoop whoosh
   */
  public static playWhoosh() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.4);
      osc.frequency.exponentialRampToValueAtTime(70, t + 1.1);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, t);
      filter.frequency.exponentialRampToValueAtTime(900, t + 0.4);
      filter.frequency.exponentialRampToValueAtTime(100, t + 1.1);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 1.15);
    } catch {
      // Ignore
    }
  }

  /**
   * Play pleasant harmonic chord when inspecting a celestial body
   */
  public static playChime() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const freqs = [523.25, 659.25, 783.99]; // C Major chord
      const t = this.ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);

        gain.gain.setValueAtTime(0.06, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8 + idx * 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + idx * 0.04);
        osc.stop(t + 0.9 + idx * 0.04);
      });
    } catch {
      // Ignore
    }
  }
}
