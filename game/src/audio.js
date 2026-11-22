// audio.js — all sound is synthesised with the Web Audio API: no audio
// files, no network. A tiny helper plays short tones for card plays, hits,
// healing and the win fanfare. Silent until the player first interacts,
// as browsers require.

let audioCtx = null;
let muted = false;

function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, dur, type, vol, when) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol || 0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function playSound(name) {
  if (muted) return;
  ensureAudio();
  if (name === 'play') { tone(520, 0.12, 'triangle', 0.14); tone(780, 0.1, 'triangle', 0.1, 0.06); }
  else if (name === 'hit') { tone(160, 0.18, 'sawtooth', 0.16); tone(90, 0.22, 'square', 0.1, 0.02); }
  else if (name === 'heal') { tone(660, 0.2, 'sine', 0.1); tone(880, 0.25, 'sine', 0.1, 0.1); }
  else if (name === 'draw') { tone(440, 0.07, 'triangle', 0.08); }
  else if (name === 'click') { tone(600, 0.05, 'square', 0.05); }
  else if (name === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.12)); }
  else if (name === 'lose') { [392, 330, 262].forEach((f, i) => tone(f, 0.35, 'sine', 0.12, i * 0.16)); }
}

function toggleMute() {
  muted = !muted;
  return muted;
}
