// Motor de la pista: un reloj único que comparten el reproductor, el mini reproductor y la RA.
// La voz es la síntesis del propio móvil (speechSynthesis), frase a frase, como sustituta
// de la locución grabada. Si no hay voz, el reloj avanza solo con duraciones estimadas.

import * as cloud from './cloud.js?v=7';

const TERM_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

// Convierte «Fíjate en los [espejos](espejos)» en fichas de palabra con su término.
export function tokenize(line) {
  const tokens = [];
  let last = 0; let m;
  const pushPlain = (s) => s.split(/\s+/).filter(Boolean).forEach((w) => tokens.push({ w, term: null }));
  TERM_RE.lastIndex = 0;
  while ((m = TERM_RE.exec(line))) {
    pushPlain(line.slice(last, m.index));
    m[1].split(/\s+/).filter(Boolean).forEach((w) => tokens.push({ w, term: m[2] }));
    last = m.index + m[0].length;
  }
  pushPlain(line.slice(last));
  // Signos pegados a un término («calicera,») quedan en la palabra siguiente: los unimos a la anterior.
  for (let i = tokens.length - 1; i > 0; i--) {
    if (/^[,.;:!?»)]+$/.test(tokens[i].w)) { tokens[i - 1].w += tokens[i].w; tokens.splice(i, 1); }
  }
  return tokens;
}
export const plain = (line) => line.replace(TERM_RE, '$1');

const PER_WORD = 0.36; // s por palabra a velocidad 1 (voz sintética en español)
const GAP = 0.7;       // pausa entre frases

export class Narrator {
  constructor() {
    this.listeners = {};
    this.rate = 1; this.voiceOn = true; this.voiceBroken = false;
    this.playing = false; this.t = 0; this.idx = -1; this.word = -1;
    this.stop = null; this.sents = []; this.total = 0; this.chapters = [];
    this.utt = null; this.uttDone = true; this.boundary = false; this.charIdx = 0; this.started = false;
    this.voice = null;
    this.cloudOn = !!cloud.API; this.cloudBroken = false; this.cloudFails = 0; this.cloudFrac = 0; this.cloudW = -1;
    this.synth = window.speechSynthesis || null;
    if (this.synth) {
      this.pickVoice();
      this.synth.onvoiceschanged = () => this.pickVoice();
    } else this.voiceBroken = true;
    this._tick = this._tick.bind(this);
    gsap.ticker.add(this._tick);
  }
  on(ev, fn) { (this.listeners[ev] ||= []).push(fn); return () => { this.listeners[ev] = this.listeners[ev].filter((f) => f !== fn); }; }
  emit(ev, ...a) { (this.listeners[ev] || []).forEach((f) => f(...a)); }

  pickVoice() {
    const vs = (this.synth.getVoices() || []).filter((v) => /^es/i.test(v.lang));
    if (!vs.length) return;
    const score = (v) => {
      let s = 0;
      if (/es[-_]ES/i.test(v.lang)) s += 6;
      if (/premium|enhanced|mejorad|natural|neural/i.test(v.name)) s += 5;
      if (/m[oó]nica|marisol|elvira|lucia|luc[ií]a|google espa[nñ]ol|paulina|jorge|helena|laura/i.test(v.name)) s += 3;
      if (/eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad|bells|boing|bubbles|cellos|wobble|zarvox|whisper|jester|organ|superstar|trinoids/i.test(v.name)) s -= 20;
      if (v.localService) s += 1;
      return s;
    };
    this.voice = vs.sort((a, b) => score(b) - score(a))[0];
  }
  // iOS solo deja hablar después de un toque: se llama en el primer gesto.
  unlock() {
    cloud.unlockAudio();
    if (!this.synth || this._unlocked) return;
    this._unlocked = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; this.synth.speak(u); } catch (e) { /* sin voz */ }
  }
  // Voz que suena: ElevenLabs (servidor), la del dispositivo o ninguna.
  get engine() {
    if (!this.voiceOn) return 'silent';
    if (this.cloudOn && !this.cloudBroken) return 'cloud';
    if (this.synth && !this.voiceBroken) return 'device';
    return 'silent';
  }
  get voiceActive() { return this.engine !== 'silent'; }

  load(stop, { route = "arte", chapters = null } = {}) {
    this._cancel();
    this.stop = stop; this.sents = []; this.chapters = [];
    let t = 0;
    const chs = (chapters || stop.tracks?.[route] || stop.chapters).map((c) => ({ ...c })); this.route = route;
    chs.forEach((c, ci) => {
      const cs = { ...c, index: ci, start: t, sents: [] };
      c.lines.forEach((line) => {
        const tokens = tokenize(line);
        const p = plain(line);
        const dur = GAP + tokens.length * PER_WORD;
        // Desplazamiento de cada palabra en el texto plano, para casar los eventos de la voz.
        let off = 0; const offsets = tokens.map((tk) => { const i = p.indexOf(tk.w.replace(/[,.;:!?»)]+$/, ''), off); const o = i < 0 ? off : i; off = o + 1; return o; });
        const s = { line, plain: p, tokens, offsets, start: t, dur, ch: ci, i: this.sents.length };
        this.sents.push(s); cs.sents.push(s); t += dur;
      });
      cs.dur = t - cs.start; this.chapters.push(cs);
    });
    this.total = t; this.t = 0; this.idx = -1; this.word = -1;
    this.emit('load', stop);
    this._setT(0, true);
  }

  play() {
    if (!this.stop) return;
    if (this.t >= this.total - 0.05) this._setT(0, true);
    this.playing = true; this.started = true;
    const s = this.sents[this.idx];
    if (this.engine === 'cloud' && this.utt?.cloud && this.utt.i === this.idx && !this.uttDone && cloud.resume()) { /* sigue donde se pausó */ }
    else if (this.voiceActive && s) { this.t = s.start; this._speak(this.idx); }
    this.emit('state', true);
  }
  pause() {
    if (!this.playing) return;
    this.playing = false;
    if (this.engine === 'cloud' && this.utt?.cloud) { cloud.pause(); clearTimeout(this._watch); } else this._cancel();
    this.emit('state', false);
  }
  toggle() { this.playing ? this.pause() : this.play(); }
  seek(t) {
    const was = this.playing;
    this._cancel();
    this._setT(Math.max(0, Math.min(this.total - 0.01, t)), true);
    if (was && this.voiceActive) { const s = this.sents[this.idx]; this.t = s.start; this._speak(this.idx); this.emit('time', this.t); }
  }
  skip(d) { this.seek(this.t + d); }
  seekSentence(i) { const s = this.sents[i]; if (s) this.seek(s.start + 0.001); }
  setRate(r) {
    this.rate = r;
    if (this.engine === 'cloud') cloud.setRate(r);
    else if (this.playing && this.voiceActive) { const s = this.sents[this.idx]; this._cancel(); this.t = s.start; this._speak(this.idx); }
    this.emit('rate', r);
  }
  setVoice(on) {
    this.voiceOn = on;
    if (!on) this._cancel();
    else if (this.playing) this._speak(this.idx);
  }

  // Locución suelta (respuestas del guía, «escuchar» una ficha). Devuelve una promesa.
  say(text, { onWord, rate } = {}) {
    return new Promise((resolve) => {
      if (this.engine === 'cloud') {
        this._cancel();
        let fin = false; const done = () => { if (fin) return; fin = true; this._sayStop = null; resolve(); };
        this._sayStop = () => { cloud.stop(); done(); };
        cloud.play(text, { rate: rate || this.rate, onProgress: (ct, du, w) => { if (w >= 0) onWord && onWord(w); }, onEnd: done,
          onError: () => { if (fin) return; fin = true; this._sayStop = null; this.cloudFails++; const was = this.cloudOn; this.cloudOn = false; this.say(text, { onWord, rate }).then(() => { this.cloudOn = was; resolve(); }); } });
        return;
      }
      if (!this.voiceActive) { // sin voz: simulamos el tiempo para la animación de palabras
        const words = text.split(/\s+/); let i = 0;
        const iv = setInterval(() => { onWord && onWord(i); if (++i >= words.length) { clearInterval(iv); setTimeout(resolve, 300); } }, 300 / (rate || this.rate));
        this._sayStop = () => { clearInterval(iv); resolve(); };
        return;
      }
      this._cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES'; if (this.voice) u.voice = this.voice; u.rate = rate || this.rate;
      const offs = []; let o = 0; text.split(/\s+/).forEach((w) => { const i = text.indexOf(w, o); offs.push(i); o = i + w.length; });
      let fallbackTimer = null; let gotBoundary = false; let wi = -1;
      u.onboundary = (e) => { gotBoundary = true; let k = 0; while (k + 1 < offs.length && offs[k + 1] <= e.charIndex) k++; if (k !== wi) { wi = k; onWord && onWord(k); } };
      u.onstart = () => {
        let k = 0; // si el navegador no da eventos por palabra, estimamos
        fallbackTimer = setInterval(() => { if (gotBoundary) { clearInterval(fallbackTimer); return; } if (k < offs.length) { onWord && onWord(k++); } }, 330 / (rate || this.rate));
      };
      const done = () => { clearInterval(fallbackTimer); if (this._sayUtt === u) this._sayUtt = null; onWord && onWord(offs.length - 1); resolve(); };
      u.onend = done; u.onerror = done;
      this._sayUtt = u; this._sayStop = () => { try { this.synth.cancel(); } catch (e) {} done(); };
      this.synth.speak(u);
    });
  }
  hush() { if (this._sayStop) { const f = this._sayStop; this._sayStop = null; f(); } }

  chapterAt(t = this.t) { let c = this.chapters[0]; for (const ch of this.chapters) if (t >= ch.start) c = ch; return c; }
  sentenceAt(t) { let i = 0; for (const s of this.sents) if (t >= s.start) i = s.i; return i; }

  // Frase de la pista con ElevenLabs: el reloj sigue al audio y se piden por adelantado las dos siguientes.
  _speakCloud(i) {
    const s = this.sents[i]; if (!s) return;
    const u = { cloud: true, i }; this.utt = u; this.uttDone = false; this.boundary = false; this.cloudFrac = 0; this.cloudW = -1;
    const fail = () => {
      if (this.utt !== u) return;
      this.cloudFails++;
      if (this.cloudFails >= 2) { this.cloudBroken = true; this.emit('cloudbroken'); }
      if (this.playing) this._speak(i);
    };
    clearTimeout(this._watch);
    this._watch = setTimeout(() => { if (this.utt === u && !u.started && this.playing) { cloud.stop(); fail(); } }, 10000);
    cloud.play(s.plain, {
      rate: this.rate, narration: true,
      onStart: () => { u.started = true; this.cloudFails = 0; clearTimeout(this._watch); },
      onProgress: (ct, du, w) => { if (this.utt !== u) return; this.cloudFrac = du ? Math.min(1, ct / du) : 0; this.cloudW = w; },
      onEnd: () => { if (this.utt === u) { this.cloudFrac = 1; this.uttDone = true; } },
      onError: fail,
    });
    [i + 1, i + 2].forEach((k) => { if (this.sents[k]) cloud.tts(this.sents[k].plain, { narration: true }).catch(() => {}); });
  }
  _speak(i) {
    if (this.engine === 'cloud') { this._speakCloud(i); return; }
    const s = this.sents[i]; if (!s || !this.synth) return;
    try { this.synth.cancel(); } catch (e) {}
    const u = new SpeechSynthesisUtterance(s.plain);
    u.lang = 'es-ES'; if (this.voice) u.voice = this.voice; u.rate = this.rate;
    this.boundary = false; this.charIdx = 0;
    u.onstart = () => { u._started = true; this.emit("voice", true); };
    u.onboundary = (e) => { if (this.utt === u) { this.boundary = true; this.charIdx = e.charIndex; } };
    const end = () => { this.emit("voice", false); if (this.utt === u) this.uttDone = true; };
    u.onend = end; u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') end(); };
    this.utt = u; this.uttDone = false; this._uttAt = performance.now();
    // Si en 2,5 s la voz no arranca, se trabaja sin voz (navegadores sin síntesis en español).
    clearTimeout(this._watch);
    this._watch = setTimeout(() => {
      if (this.utt === u && !u._started && this.playing) { this.voiceBroken = true; this.uttDone = true; this.emit('voicebroken'); }
    }, 2500);
    setTimeout(() => { if (this.utt === u) this.synth.speak(u); }, 40);
  }
  _cancel() {
    this.utt = null; this.uttDone = true; clearTimeout(this._watch);
    cloud.stop();
    if (this.synth) { try { this.synth.cancel(); } catch (e) {} }
  }
  _tick(time, dtMs) {
    if (!this.playing || !this.stop) return;
    const dt = Math.min(dtMs / 1000, 0.1) * this.rate;
    const s = this.sents[this.idx];
    let nt = this.t + dt;
    if (this.voiceActive && s) {
      const end = s.start + s.dur;
      if (this.engine === 'cloud' && this.utt?.cloud && !this.uttDone) nt = Math.min(Math.max(this.t, s.start + this.cloudFrac * (s.dur - GAP)), end - 0.03); // sigue al audio
      else if (!this.uttDone) nt = Math.min(nt, end - 0.03);           // espera a que la voz acabe la frase
      else if (this.t < end) nt = Math.min(end + 0.001, this.t + dt * 6); // la voz acabó antes: alcanza el final rápido
    }
    this._setT(nt);
  }
  _setT(t, force = false) {
    this.t = Math.max(0, Math.min(this.total, t));
    const i = this.sentenceAt(this.t);
    if (i !== this.idx || force) {
      const changed = i !== this.idx;
      const prevCh = this.idx >= 0 ? this.sents[this.idx].ch : -1;
      this.idx = i; this.word = -1;
      if (changed || force) this.emit('sentence', i, this.sents[i]);
      if (this.sents[i].ch !== prevCh) this.emit('chapter', this.chapters[this.sents[i].ch]);
      if (changed && this.playing && this.voiceActive && !force) this._speak(i);
    }
    // Palabra actual: por eventos de la voz o estimada por tiempo.
    const s = this.sents[this.idx];
    let w;
    if (this.engine === 'cloud' && this.utt?.cloud && this.playing && this.cloudW >= 0) {
      w = this.cloudW;
    } else if (this.voiceActive && this.boundary && this.playing) {
      w = 0; while (w + 1 < s.offsets.length && s.offsets[w + 1] <= this.charIdx) w++;
    } else {
      const speakDur = s.dur - GAP;
      w = Math.floor(((this.t - s.start) / speakDur) * s.tokens.length);
      if (!this.playing && this.t - s.start < 0.01) w = -1;
    }
    w = Math.min(s.tokens.length - 1, w);
    if (w !== this.word) { this.word = w; this.emit('word', w); }
    this.emit('time', this.t);
    if (this.t >= this.total && this.playing) { this.playing = false; this._cancel(); this.emit('state', false); this.emit('end'); }
  }
}

// Reconocimiento de voz del navegador. Si no existe, la app simula la pregunta.
export function listen({ onInterim, onFinal, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  let r;
  try { r = new SR(); } catch (e) { return null; }
  r.lang = 'es-ES'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  let finalText = ''; let gotAny = false;
  r.onresult = (e) => {
    gotAny = true; let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t; else interim += t;
    }
    onInterim && onInterim(finalText, interim);
  };
  r.onerror = (e) => { onError && onError(e.error || 'error'); };
  r.onend = () => { if (finalText.trim()) onFinal && onFinal(finalText.trim()); else if (!gotAny) onError && onError('no-speech'); else onFinal && onFinal(''); };
  try { r.start(); } catch (e) { return null; }
  // Si en 7 s no llega nada (sin red, sin micro), se corta y la app sigue con una pregunta de ejemplo.
  setTimeout(() => { if (!gotAny) { try { r.abort(); } catch (e) {} } }, 7000);
  return r;
}
