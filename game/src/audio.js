// Gobble Run — all sound is synthesized with WebAudio (no audio files):
// a gobble, a cluck, a thud, a fanfare and a sad slide. Everything is
// guarded so a browser with no audio, or a headless one, simply stays quiet.
let ctx = null;
let muted = false;

function audioContext() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  const ac = audioContext();
  if (!ac || muted) return;
  try {
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + when);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + when + dur);
    amp.gain.setValueAtTime(0.0001, ac.currentTime + when);
    amp.gain.exponentialRampToValueAtTime(gain, ac.currentTime + when + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + when + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + dur + 0.05);
  } catch {
    // Sound is garnish: never let it break the game.
  }
}

export function unlockAudio() {
  const ac = audioContext();
  if (ac && ac.state === 'suspended') {
    ac.resume().catch(() => {});
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

export function play(name) {
  switch (name) {
    case 'jump':
      tone(520, 0.12, 'square', 0.08, 0, 880);
      break;
    case 'corn':
      tone(880, 0.07, 'sine', 0.12);
      tone(1320, 0.09, 'sine', 0.1, 0.06);
      break;
    case 'feather':
      tone(660, 0.1, 'triangle', 0.12);
      tone(990, 0.1, 'triangle', 0.12, 0.09);
      tone(1320, 0.16, 'triangle', 0.12, 0.18);
      break;
    case 'stumble':
      tone(180, 0.25, 'sawtooth', 0.14, 0, 70);
      break;
    case 'stage':
      tone(523, 0.1, 'triangle', 0.12);
      tone(659, 0.1, 'triangle', 0.12, 0.1);
      tone(784, 0.18, 'triangle', 0.12, 0.2);
      break;
    case 'escaped':
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.13, i * 0.13));
      break;
    case 'caught':
      tone(392, 0.3, 'sawtooth', 0.1, 0, 370);
      tone(370, 0.3, 'sawtooth', 0.1, 0.28, 349);
      tone(349, 0.55, 'sawtooth', 0.1, 0.56, 220);
      break;
    case 'click':
      tone(700, 0.05, 'square', 0.06);
      break;
    default:
      break;
  }
}
