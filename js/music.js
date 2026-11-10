// Música de fondo de cada recorrido (generada con ElevenLabs Music). Se mezcla con Web Audio
// porque iOS no deja cambiar el volumen de un <audio>. Baja sola mientras habla la voz.
const SRC = { historica: 'assets/audio/bucle-historica.mp3', arte: 'assets/audio/bucle-arte.mp3' };
const BASE = 0.32;   // volumen de la música sin voz
const DUCK = 0.09;   // volumen bajo la voz

let ctx = null, gain = null, el = null, srcNode = null;
let enabled = true, level = 1, voice = false, wanted = false, route = 'historica';
let releaseTimer = null;

function ensure() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC();
  gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
  el = new Audio(); el.loop = true; el.preload = 'auto'; el.crossOrigin = 'anonymous'; el.setAttribute('playsinline', '');
  el.src = SRC[route];
  srcNode = ctx.createMediaElementSource(el); srcNode.connect(gain);
}
const target = () => (!enabled || !wanted ? 0 : (voice ? DUCK : BASE) * level);
function ramp(t = 0.8) {
  if (!ctx) return;
  const now = ctx.currentTime; const v = target();
  gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(v, now + t);
  if (v === 0) { clearTimeout(ensure._stop); ensure._stop = setTimeout(() => { if (target() === 0) el && el.pause(); }, t * 1000 + 100); }
  else if (el && el.paused) el.play().catch(() => {});
}

export const music = {
  // Llamar dentro de un toque (iOS).
  unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
  setRoute(r) { if (!SRC[r] || r === route) return; route = r; if (el) { const was = !el.paused; el.src = SRC[r]; if (was) el.play().catch(() => {}); } },
  play() { wanted = true; ensure(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume().catch(() => {}); el.play().catch(() => {}); ramp(1.6); },
  stop() { wanted = false; ramp(1.2); },
  // La voz habla: la música baja enseguida; sube con un poco de retraso para no «bombear» entre frases.
  voice(on) {
    clearTimeout(releaseTimer);
    if (on) { voice = true; ramp(0.35); }
    else releaseTimer = setTimeout(() => { voice = false; ramp(1.4); }, 1400);
  },
  setEnabled(v) { enabled = v; ramp(0.6); },
  setLevel(v) { level = v; ramp(0.3); },
  get enabled() { return enabled; },
  get playing() { return !!el && !el.paused && wanted; },
};
