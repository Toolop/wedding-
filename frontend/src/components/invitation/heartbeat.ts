/*
 * A synthesised heartbeat for the confession chapter: no audio files, just
 * Web Audio. Phone speakers can't play a real 50 Hz thump, so each beat is a
 * ~90–110 Hz triangle (its harmonics carry on small speakers) with a fast
 * attack and decay: "lub", then a slightly higher, softer "dub".
 */

let ctx: AudioContext | null = null;

/** create/resume the audio context; call from a tap or press (browsers require a gesture) */
export function unlockAudio() {
  try {
    if (!ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctx();
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

function buzz(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not supported (iOS) */
  }
}

/** one thump: a pitch-dropping triangle with a quick swell and decay */
function thump(c: AudioContext, at: number, freq: number, gain: number, length = 0.22) {
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, at + length);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(amp).connect(c.destination);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/** lub-dub; `intensity` 0–1 makes it louder, a touch higher and tighter */
export function playBeat(intensity: number) {
  buzz(25 + Math.round(intensity * 25));
  if (!ctx) return;
  const t = ctx.currentTime + 0.01;
  const k = Math.min(1, Math.max(0, intensity));
  thump(ctx, t, 88 + k * 22, 0.55 + k * 0.3);
  thump(ctx, t + 0.17 - k * 0.05, 108 + k * 26, 0.38 + k * 0.25, 0.18);
}

/** the heart can't hold it in any more: a big thump, a rising whoosh and a little chime */
export function playBurst() {
  buzz([60, 40, 140]);
  if (!ctx) return;
  const c = ctx;
  const t = c.currentTime + 0.01;
  thump(c, t, 80, 0.95, 0.35);

  // whoosh: a short burst of noise swept upwards through a band-pass
  const noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.45), c.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = noise;
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 1.2;
  band.frequency.setValueAtTime(300, t);
  band.frequency.exponentialRampToValueAtTime(3200, t + 0.4);
  const amp = c.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  src.connect(band).connect(amp).connect(c.destination);
  src.start(t);

  // a soft sparkle on top
  [1046.5, 1568, 2093].forEach((f, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    const at = t + 0.12 + i * 0.07;
    osc.type = "sine";
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.16, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.7);
    osc.connect(g).connect(c.destination);
    osc.start(at);
    osc.stop(at + 0.75);
  });
}
