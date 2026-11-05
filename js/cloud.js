// Voz (ElevenLabs v4 Turbo) y respuestas del guía (Claude) a través del servidor de Cloudflare
// (prototipo-ra/worker, rutas /sjd/tts y /sjd/ask). Aquí no hay claves: la web es pública y las
// claves solo viven como secretos en Cloudflare.
// Para probar otro servidor: ?api=https://… en la dirección. Con ?api= (vacío) se trabaja sin servidor.
const params = new URLSearchParams(location.search);
export const API = params.has('api') ? params.get('api') : 'https://optimaguia-ra.optimaguia.workers.dev';
export const status = { model: null };

// Un único elemento de audio: iOS solo deja reproducir si se ha desbloqueado con un toque.
export const audio = new Audio();
audio.preload = 'auto';
audio.setAttribute('playsinline', '');
let unlocked = false;
export function unlockAudio() {
  if (unlocked) return; unlocked = true;
  const sr = 8000, n = 800, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  audio.src = URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  audio.play().catch(() => {});
}

// Locución de un texto, con el momento en que empieza cada carácter. Se guarda en memoria.
const cache = new Map();
export function tts(text, { narration = false } = {}) {
  if (cache.has(text)) return cache.get(text);
  const p = (async () => {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(`${API}/sjd/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, cache: narration }), signal: ctl.signal });
      if (!r.ok) throw new Error(`tts ${r.status}`);
      const d = await r.json();
      status.model = d.model || status.model;
      const bin = atob(d.audio); const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return { url: URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' })), times: d.alignment?.character_start_times_seconds || null };
    } finally { clearTimeout(to); }
  })();
  p.catch(() => cache.delete(text));
  cache.set(text, p);
  if (cache.size > 80) { const k = cache.keys().next().value; cache.get(k).then((x) => URL.revokeObjectURL(x.url)).catch(() => {}); cache.delete(k); }
  return p;
}
// Momento de inicio de cada palabra (separadas por espacios), a partir de los tiempos por carácter.
function wordTimes(text, times) {
  const out = []; let o = 0;
  for (const w of text.split(/\s+/).filter(Boolean)) { const i = text.indexOf(w, o); out.push(times ? times[i] ?? null : null); o = i + w.length; }
  return out;
}

let current = null; let raf = 0;
export async function play(text, { rate = 1, narration = false, onStart, onProgress, onEnd, onError } = {}) {
  const token = {}; current = token; cancelAnimationFrame(raf);
  try {
    const item = await tts(text, { narration });
    if (current !== token) return;
    const wt = wordTimes(text, item.times);
    audio.onplaying = () => { if (current === token && !token.started) { token.started = true; onStart && onStart(); } };
    audio.onended = () => { if (current !== token) return; current = null; cancelAnimationFrame(raf); onProgress && onProgress(audio.duration, audio.duration, wt.length - 1); onEnd && onEnd(); };
    audio.onerror = () => { if (current !== token) return; current = null; cancelAnimationFrame(raf); onError && onError(new Error('audio')); };
    audio.src = item.url; audio.playbackRate = rate;
    await audio.play();
    const loop = () => {
      if (current !== token) return;
      const ct = audio.currentTime; let w = -1;
      for (let k = 0; k < wt.length; k++) if (wt[k] != null && wt[k] <= ct + 0.04) w = k;
      onProgress && onProgress(ct, audio.duration || 0, w);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  } catch (e) { if (current === token) { current = null; onError && onError(e); } }
}
export function stop() { current = null; cancelAnimationFrame(raf); try { audio.pause(); } catch (e) {} }
export function pause() { try { audio.pause(); } catch (e) {} }
export function resume() { if (current) audio.play().catch(() => {}); return !!current; }
export function setRate(r) { audio.playbackRate = r; }

// Cola de voz para respuestas que llegan por frases: cada frase se pide en cuanto llega
// y suenan en orden. onWord recibe el índice de palabra dentro de toda la respuesta.
export function speakQueue({ rate = 1, onWord, onDone, onError } = {}) {
  const items = []; let ended = false, playing = false, stopped = false, base = 0, failed = false;
  const next = () => {
    if (stopped) return;
    if (!items.length) { playing = false; if (ended) onDone && onDone(); return; }
    playing = true; const it = items.shift();
    play(it.text, { rate, onProgress: (ct, du, w) => { if (w >= 0) onWord && onWord(it.b + w); }, onEnd: next, onError: () => { failed = true; onError && onError(); next(); } });
  };
  return {
    push(text) { text = text.trim(); if (!text) return; items.push({ text, b: base }); base += text.split(/\s+/).filter(Boolean).length; tts(text).catch(() => {}); if (!playing) next(); },
    end() { ended = true; if (!playing && !items.length) onDone && onDone(); },
    stop() { stopped = true; stop(); },
    get failed() { return failed; },
  };
}

// Pregunta al guía (Claude). El texto llega poco a poco; se avisa por cada frase completa.
export async function ask(question, { stop: stopId, kids, ar, previous = [], onText, onSentence, signal } = {}) {
  if (!API) throw new Error('sin servidor');
  const r = await fetch(`${API}/sjd/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, stop: stopId, kids, ar, previous }), signal });
  if (!r.ok || !r.body) throw new Error(`ask ${r.status}`);
  const reader = r.body.getReader(); const dec = new TextDecoder();
  let full = ''; let sent = 0;
  const flush = (visible, final) => {
    const re = /[.!?…]["»)]*(\s+|$)/g; re.lastIndex = sent; let m;
    while ((m = re.exec(visible))) {
      if (!final && m.index + m[0].length >= visible.length && !m[1]) break; // el punto puede ser de «1.5»: espera
      const s = visible.slice(sent, m.index + m[0].length).trim(); sent = m.index + m[0].length;
      if (s) onSentence && onSentence(s);
      if (re.lastIndex === m.index) re.lastIndex++;
    }
    if (final) { const rest = visible.slice(sent).trim(); if (rest) { sent = visible.length; onSentence && onSentence(rest); } }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += dec.decode(value, { stream: true });
    const visible = full.split('[[')[0];
    onText && onText(visible.trim());
    flush(visible, false);
  }
  const visible = full.split('[[')[0];
  flush(visible, true);
  if (/\[\[(error|rechazo)\]\]/.test(full) && !visible.trim()) throw new Error('sin respuesta');
  const m = full.match(/\[\[parada:([a-z]+)\]\]/);
  return { text: visible.trim(), stop: m && m[1] !== 'ninguna' ? m[1] : null };
}
