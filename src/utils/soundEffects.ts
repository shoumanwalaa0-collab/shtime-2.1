// Audio Synthesizer using Web Audio API
class WebSoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgInterval: number | null = null;
  private bgNoteIndex: number = 0;
  private isBgPlaying: boolean = false;

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked in this environment', e);
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ctx && this.ctx.state === 'running') {
      // do not fully close, just pause notes
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play a single synthesized note
  public playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.2, volume: number = 0.1) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio node failure fallback
    }
  }

  // Victory / Success Chime (ascending cheerful arpeggio)
  public playWinSound() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.35, 0.15);
      }, idx * 90);
    });
  }

  // Wrong / Penalty Buzz
  public playWrongSound() {
    if (this.isMuted) return;
    const notes = [220, 196, 174.61]; // A3, G3, F3
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.25, 0.12);
      }, idx * 110);
    });
  }

  // Coins / Reward Chime
  public playCoinSound() {
    if (this.isMuted) return;
    this.playTone(987.77, 'sine', 0.12, 0.15); // B5
    setTimeout(() => {
      this.playTone(1318.51, 'sine', 0.3, 0.15); // E6
    }, 100);
  }

  // Upgrade / Powerup Sound
  public playUpgradeSound() {
    if (this.isMuted) return;
    const notes = [392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.2, 0.12);
      }, idx * 70);
    });
  }

  public playLevelUpSound() {
    this.playUpgradeSound();
  }

  // Button Click Tick
  public playClickSound() {
    if (this.isMuted) return;
    this.playTone(600, 'triangle', 0.05, 0.06);
  }

  // Timer Tick (warning)
  public playTickSound() {
    if (this.isMuted) return;
    this.playTone(880, 'sine', 0.04, 0.05);
  }

  // Start Background Ambient Melody
  public startBgMusic() {
    if (this.isBgPlaying) return;
    this.isBgPlaying = true;

    const melody = [
      261.63, 329.63, 392.00, 523.25, // C E G C
      293.66, 349.23, 440.00, 523.25, // D F A C
      329.63, 392.00, 493.88, 587.33, // E G B D
      392.00, 523.25, 659.25, 783.99, // G C E G
    ];

    this.bgInterval = window.setInterval(() => {
      if (!this.isMuted && this.isBgPlaying) {
        const freq = melody[this.bgNoteIndex % melody.length];
        this.playTone(freq, 'sine', 0.7, 0.02);
        this.bgNoteIndex++;
      }
    }, 750);
  }

  public stopBgMusic() {
    this.isBgPlaying = false;
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
  }
}

export const soundFx = new WebSoundManager();
