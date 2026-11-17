// Tiny synthesized sound effects with WebAudio — no audio files needed.
// The context is created lazily on the first user gesture (browser policy).
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  gather(combo) {
    this.tone(520 + combo * 60, 0.12, 'sine', 0.16, 880 + combo * 80);
  }

  shatter() {
    this.tone(220, 0.18, 'sawtooth', 0.12, 60);
    this.tone(1240, 0.1, 'triangle', 0.1, 300);
  }

  hurt() {
    this.tone(160, 0.25, 'square', 0.14, 70);
  }

  dash() {
    this.tone(300, 0.1, 'sine', 0.07, 620);
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.3, 'triangle', 0.14), i * 110));
  }

  lose() {
    [392, 330, 262, 196].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.3, 'triangle', 0.12), i * 130));
  }
}
