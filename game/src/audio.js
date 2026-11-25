// audio.js — tiny synthesized kitchen sounds (WebAudio oscillators, no audio files).
// Every blip is generated in code, so the game needs no sound assets at all.

let context = null;

function ensureContext() {
  if (context === null) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    context = new AudioCtor();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

function blip(freqFrom, freqTo, duration, type, gainPeak, when = 0) {
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Short wooden knock when an ingredient lands on a plate or board. */
export function playPlace() { blip(340, 190, 0.09, 'triangle', 0.16); }
/** Quick double-chop while the board is working. */
export function playChop() { blip(210, 120, 0.06, 'square', 0.07); blip(190, 110, 0.06, 'square', 0.07, 0.09); }
/** Bright ding when a station finishes and the item is ready to collect. */
export function playReady() { blip(880, 1320, 0.14, 'sine', 0.14); }
/** Cash-register style arpeggio when a dish is served. */
export function playServe(combo) {
  const base = 520 + Math.min(combo, 8) * 40;
  blip(base, base, 0.1, 'sine', 0.15);
  blip(base * 1.25, base * 1.25, 0.1, 'sine', 0.15, 0.08);
  blip(base * 1.5, base * 1.5, 0.16, 'sine', 0.16, 0.16);
}
/** Low buzz when an order expires or a serve misses. */
export function playMiss() { blip(160, 70, 0.28, 'sawtooth', 0.1); }
/** Bell that opens and closes the shift. */
export function playBell() { blip(1046, 1046, 0.3, 'sine', 0.16); blip(1568, 1568, 0.4, 'sine', 0.1, 0.05); }
