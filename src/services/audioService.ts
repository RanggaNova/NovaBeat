import { getSoundPreference } from './storageService';

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.isEnabled = getSoundPreference();
  }

  public setEnabled(val: boolean) {
    this.isEnabled = val;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  private initCtx(): AudioContext | null {
    if (!this.isEnabled) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Subtle mechanical keypress click
   */
  public playKeypress() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Soft short mechanical frequency impulse
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext error suppressed
    }
  }

  /**
   * Muffled error thud/buzz
   */
  public playError() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Ignore
    }
  }

  /**
   * Streak milestone chime that scales musically with streak count
   */
  public playStreakMilestone(currentStreak: number = 20) {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      // Scale notes based on streak tier
      let notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (Base)
      if (currentStreak >= 50) {
        // Godlike tier: C5, E5, G5, B5, C6 (Major 7th arpeggio)
        notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
      } else if (currentStreak >= 25) {
        // Fever tier: C5, E5, G5, C6
        notes = [523.25, 659.25, 783.99, 1046.5];
      }

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.055;

        osc.type = currentStreak >= 30 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Song completed victory chime
   */
  public playVictory() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const chord = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.07, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch {
      // Ignore
    }
  }

  public playKeyClick(_charIndex?: number) {
    this.playKeypress();
  }

  public playErrorBeep() {
    this.playError();
  }

  public playComboChime(currentStreak: number = 20) {
    this.playStreakMilestone(currentStreak);
  }

  public playSuccessChord() {
    this.playVictory();
  }

  public playLineComplete() {
    this.playStreakMilestone(10);
  }
}

export const audioSynthesizer = new AudioSynthesizer();
