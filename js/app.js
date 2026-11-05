// OptimaGuía · prototipo funcional · Basílica de San Juan de Dios
import { STOPS, TERMS, SURVEY, LANGS, KB, FALLBACK, ESSENTIAL } from './data.js';
import { Narrator, listen } from './narrator.js';
import { LOGO_SYMBOLS } from './logos.js';
import * as cloud from './cloud.js';

gsap.registerPlugin(CustomEase, SplitText, Draggable, InertiaPlugin, ScrollTrigger, ScrollToPlugin, Observer);
CustomEase.create('ios', '0.32,0.72,0,1');
CustomEase.create('soft', '0.22,1,0.36,1');
gsap.defaults({ ease: 'soft', duration: 0.5 });

// ---------------------------------------------------------------------------
// Utilidades y estado
// ---------------------------------------------------------------------------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
const store = {
  get(k, d) { try { const v = localStorage.getItem('og:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('og:' + k, JSON.stringify(v)); } catch (e) {} },
};
const prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const detectLang = () => { const l = (navigator.language || 'es').slice(0, 2).toUpperCase(); return LANGS.some((x) => x.code === l) ? l : 'ES'; };

const state = {
  lang: store.get('lang', 'ES'), company: store.get('company', null), time: store.get('time', '50'), mode: store.get('mode', 'both'),
  textSize: store.get('textSize', 'grande'), speed: store.get('speed', 1), theme: store.get('theme', 'auto'),
  voice: store.get('voice', true), subs: store.get('subs', true), ad: store.get('ad', false), contrast: store.get('contrast', false), reduce: store.get('reduce', prefersReduce),
  stopId: null, visited: new Set(store.get('visited', [])), camAsked: false,
};
const D = (d) => (state.reduce ? 0.001 : d);
const stopById = (id) => STOPS.find((s) => s.id === id);
const route = () => (state.time === '20' ? STOPS.filter((s) => ESSENTIAL.includes(s.id)) : STOPS);
const curStop = () => stopById(state.stopId) || route()[0];
const nextStop = (s = curStop()) => { const r = route(); const i = r.findIndex((x) => x.id === s.id); return r[i + 1] || null; };
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const floorTxt = (f) => `Planta ${f}`;
const saveVisited = () => store.set('visited', [...state.visited]);

const narrator = new Narrator();
narrator.voiceOn = state.voice; narrator.rate = state.speed;

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
let introStarted = false;
function intro() {
  if (introStarted) return; introStarted = true;
  const split = SplitText.create('.cover-title', { type: 'chars', mask: 'chars' });
  const tl = gsap.timeline();
  if (state.reduce) { gsap.set('#splash', { autoAlpha: 0 }); return; }
  tl.from('#splash .seal', { scale: 0.5, autoAlpha: 0, rotation: -12, duration: 0.9, ease: 'expo.out' })
    .to('#splash .seal', { scale: 0.9, duration: 0.35, ease: 'power2.in' }, '+=0.15')
    .fromTo('#splash', { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
    .set('#splash', { display: 'none' })
    .from('.cover-photo img', { scale: 1.22, duration: 2.4, ease: 'expo.out' }, '-=0.75')
    .from('.cover-logo', { y: -24, autoAlpha: 0, duration: 0.8 }, '-=2')
    .from(split.chars, { yPercent: 110, duration: 0.8, stagger: 0.035, ease: 'expo.out' }, '-=1.85')
    .from('#cover .lead', { y: 16, autoAlpha: 0, duration: 0.7 }, '-=1.5')
    .from('.cover-foot > *', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.7 }, '-=1.35')
    .add(() => { gsap.to('.cover-photo img', { scale: 1.06, duration: 18, ease: 'sine.inOut', yoyo: true, repeat: -1 }); });
}

// ---------------------------------------------------------------------------
// Navegación entre pantallas
// ---------------------------------------------------------------------------
const screens = {}; let cur = 'cover'; let prevScreen = null;
const onEnter = {}; const onLeave = {};
function go(id, { dir = 'push' } = {}) {
  if (id === cur) return;
  const next = screens[id]; const prev = screens[cur];
  onLeave[cur] && onLeave[cur]();
  prevScreen = cur; cur = id;
  next.classList.add('is-on');
  gsap.killTweensOf([next, prev]);
  const done = () => { prev.classList.remove('is-on'); gsap.set([prev, next], { clearProps: 'transform,opacity,visibility,zIndex,borderRadius' }); };
  const tl = gsap.timeline({ defaults: { duration: D(0.62), ease: 'soft' }, onComplete: done });
  if (dir === 'push') {
    gsap.set(next, { zIndex: 3 }); gsap.set(prev, { zIndex: 2 });
    tl.fromTo(next, { xPercent: 100 }, { xPercent: 0 }).fromTo(prev, { xPercent: 0, opacity: 1 }, { xPercent: -28, opacity: 0.55 }, 0);
  } else if (dir === 'pop') {
    gsap.set(next, { zIndex: 2 }); gsap.set(prev, { zIndex: 3 });
    tl.fromTo(prev, { xPercent: 0 }, { xPercent: 100 }).fromTo(next, { xPercent: -28, opacity: 0.55 }, { xPercent: 0, opacity: 1 }, 0);
  } else if (dir === 'up') {
    gsap.set(next, { zIndex: 3 }); gsap.set(prev, { zIndex: 2 });
    tl.fromTo(next, { yPercent: 100, borderRadius: 40 }, { yPercent: 0, borderRadius: 0, duration: D(0.7), ease: 'ios' }).fromTo(prev, { scale: 1, opacity: 1 }, { scale: 0.93, opacity: 0.5, duration: D(0.7), ease: 'ios' }, 0);
  } else if (dir === 'down') {
    gsap.set(next, { zIndex: 2 }); gsap.set(prev, { zIndex: 3 });
    tl.fromTo(prev, { yPercent: 0 }, { yPercent: 100, duration: D(0.6), ease: 'ios' }).fromTo(next, { scale: 0.93, opacity: 0.5 }, { scale: 1, opacity: 1, duration: D(0.6), ease: 'ios' }, 0);
  } else {
    gsap.set(next, { zIndex: 3 }); gsap.set(prev, { zIndex: 2 });
    tl.fromTo(next, { autoAlpha: 0 }, { autoAlpha: 1, duration: D(0.45), ease: 'power2.out' });
  }
  onEnter[id] && onEnter[id](dir);
  updateMini();
}

// ---------------------------------------------------------------------------
// Acciones (delegadas)
// ---------------------------------------------------------------------------
const ACT = {
  start: () => { narrator.unlock(); showStep(0, 1, true); go('survey'); },
  'cover-lang': () => { narrator.unlock(); showStep(0, 1, true); go('survey'); },
  'survey-back': () => { if (svStep === 0 || svFromHome && svStep <= 1) go(svFromHome ? 'home' : 'cover', { dir: 'pop' }); else showStep(svStep - 1, -1); },
  'survey-skip': () => finishSurvey(),
  'survey-next': () => { if (svStep < SURVEY.length - 1) showStep(svStep + 1, 1); else finishSurvey(); },
  'home-go': () => {
    narrator.unlock();
    if (state.mode === 'ar' && !narrator.started) { ensureStop(); openAR(); return; }
    if (narrator.started && narrator.stop) { go('player', { dir: 'up' }); if (!narrator.playing) narrator.play(); return; }
    playStop(route()[0].id, { dir: 'push' });
  },
  'change-visit': () => { svFromHome = true; showStep(1, 1, true); go('survey'); },
  stops: () => openStops(),
  tutorial: () => startTutorial(),
  map: () => { if (sheetOpen) closeSheet(); go('map', { dir: 'push' }); },
  'to-guide': () => { if (narrator.stop) go('player', { dir: 'pop' }); else go('home', { dir: 'pop' }); },
  assist: () => openAssist(),
  settings: () => { if (sheetOpen) closeSheet(); go('settings', { dir: cur === 'ar' ? 'fade' : 'push' }); },
  'close-settings': () => go(prevScreen && prevScreen !== 'settings' && prevScreen !== 'ar' ? prevScreen : 'home', { dir: 'pop' }),
  lang: () => openLang(),
  home: () => go('home', { dir: cur === 'player' ? 'down' : 'pop' }),
  top: () => gsap.to('#home-scroll', { scrollTo: { y: 0 }, duration: D(0.8), ease: 'power3.inOut' }),
  toggle: () => { narrator.unlock(); if (!narrator.stop) ensureStop(); narrator.toggle(); haptic(); },
  back15: (el) => { narrator.skip(-15); spin(el, -1); },
  fwd15: (el) => { narrator.skip(15); spin(el, 1); },
  next: () => { const n = nextStop(); if (n) playStop(n.id, { open: false }); else toast('Es la última parada de la visita'); },
  speed: (el) => { const seq = [1, 1.25, 1.5, 0.75]; const v = seq[(seq.indexOf(state.speed) + 1) % seq.length]; setSpeed(v); gsap.fromTo(el, { scale: 0.7 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }); },
  'photo-term': () => { const ch = narrator.chapterAt(); if (ch?.focus) openTerm(ch.focus); },
  ar: () => openAR(narrator.chapterAt()?.focus),
  'back-now': () => { userScrollAt = 0; followNow(true); },
  center: () => centerMap(),
  'close-sheet': () => closeSheet(),
  'tc-listen': () => listenTerm(),
  'tc-ar': () => { const id = termCur; closeSheet(); if (cur === 'ar') { ar?.setPointed(id); ar?.setOpen(id); } else setTimeout(() => openAR(id), 250); },
  'tc-ask': () => { const t = TERMS[termCur]; closeSheet(); setTimeout(() => openAssist(askFor(t)), 300); },
  'as-resume': () => { asWas = true; closeSheet(); },
  'as-mic': () => assistMic(),
  'perm-ok': () => permOk(),
  'tut-next': () => tutStep(tutI + 1),
  'tut-skip': () => endTutorial(),
  'ar-close': () => closeAR(),
  'ar-map': () => { closeAR('map'); },
  'ar-next': () => arNext(),
  talk: () => enterTalk(),
  'talk-close': () => exitTalk(),
  'talk-mic': () => talkMic(),
  reset: () => { try { Object.keys(localStorage).filter((k) => k.startsWith('og:')).forEach((k) => localStorage.removeItem(k)); } catch (e) {} location.reload(); },
};
document.addEventListener('click', (e) => {
  const term = e.target.closest('.term[data-term]');
  if (term && !e.target.closest('#sh-term')) { e.stopPropagation(); openTerm(term.dataset.term); return; }
  const a = e.target.closest('[data-act]');
  if (a && ACT[a.dataset.act]) { ACT[a.dataset.act](a, e); }
});
$('#mini').addEventListener('click', (e) => { if (e.target.closest('[data-act]')) return; go('player', { dir: 'up' }); });

// Respuesta táctil: todo lo que se pulsa se hunde un poco y vuelve con rebote.
function bindPress() {
  const SEL = '.btn, .ib, .glyph, .play, .tile, .tutcard, .ar-chip, .ask, .mini-pp, .pp, .talk, .ardock .d, .stopbtn, .talkbtn, .center, .tc-x, .stoprow, .logo, .sname, .floors button, .resume, .settings-link, .sugg button, .mini';
  let el = null;
  document.addEventListener('pointerdown', (e) => {
    el = e.target.closest(SEL); if (!el || state.reduce) return;
    gsap.to(el, { scale: el.classList.contains('mini') || el.classList.contains('tutcard') ? 0.98 : 0.95, duration: 0.14, ease: 'power2.out', overwrite: 'auto' });
  });
  const up = () => { if (!el) return; gsap.to(el, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }); el = null; };
  document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  document.addEventListener('pointerleave', up);
}
function spin(el, d) { const s = el.querySelector('svg'); gsap.fromTo(s, { rotation: 0 }, { rotation: d * -360, duration: D(0.6), ease: 'power3.out', transformOrigin: '50% 50%' }); }

// ---------------------------------------------------------------------------
// Preferencias
// ---------------------------------------------------------------------------
function applyPrefs() {
  const r = document.documentElement;
  if (state.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', state.theme);
  r.setAttribute('data-size', state.textSize);
  if (state.contrast) r.setAttribute('data-contrast', 'on'); else r.removeAttribute('data-contrast');
  r.classList.toggle('reduce', state.reduce);
  $('#ar').classList.toggle('no-subs', !state.subs);
  $$('.lang-code').forEach((el) => { el.textContent = state.lang; });
  const L = LANGS.find((l) => l.code === state.lang) || LANGS[0];
  $$('.lang-name').forEach((el) => { el.textContent = L.name; });
  $('#speed').textContent = speedLabel(state.speed);
  $('#player').classList.toggle('simple', state.mode === 'listen');
}
const speedLabel = (v) => `${String(v).replace('.', ',')}×`;
function setSpeed(v) { state.speed = v; store.set('speed', v); narrator.setRate(v); $('#speed').textContent = speedLabel(v); syncSegm('speed', String(v)); }

// ---------------------------------------------------------------------------
// Aviso breve
// ---------------------------------------------------------------------------
let toastTl = null;
function toast(msg, icon = 'i-info') {
  const t = $('#toast'); t.querySelector('span').textContent = msg; t.querySelector('use').setAttribute('href', '#' + icon);
  toastTl && toastTl.kill();
  toastTl = gsap.timeline()
    .fromTo(t, { autoAlpha: 0, y: -18, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: D(0.5), ease: 'back.out(2)' })
    .to(t, { autoAlpha: 0, y: -12, duration: D(0.35), ease: 'power2.in' }, '+=2.6');
}

// ---------------------------------------------------------------------------
// Encuesta: una pregunta por pantalla, de un toque
// ---------------------------------------------------------------------------
let svStep = 0; let svFromHome = false; const svSplits = [];
function buildSurvey() {
  $('#sv-stage').innerHTML = SURVEY.map((q, i) => {
    const rows = q.lang
      ? LANGS.map((l) => `<button class="row lang ${l.code === state.lang ? 'on' : ''}" data-v="${l.code}"><span class="tintbg"></span><span class="t">${l.name}<small>${l.code === detectLang() ? 'Idioma de tu móvil' : l.sub}</small></span><span class="radio"></span></button>`).join('')
      : q.options.map((o) => `<button class="row opt ${state[q.key] === o.v ? 'on' : ''}" data-v="${o.v}"><span class="tintbg"></span>${o.icon ? `<svg class="i lead"><use href="#${o.icon}"/></svg>` : ''}<span class="t">${o.t}${o.s ? `<small>${o.s}</small>` : ''}</span><span class="radio"></span></button>`).join('');
    return `<div class="sv-panel" data-i="${i}" data-key="${q.key}"><div class="q-ico"><svg class="i"><use href="#${q.icon}"/></svg></div><h2>${q.title}</h2><div class="rows">${rows}</div></div>`;
  }).join('');
  $$('.sv-panel').forEach((p, i) => { svSplits[i] = SplitText.create(p.querySelector('h2'), { type: 'words', mask: 'words' }); });
  $('#sv-stage').addEventListener('click', (e) => {
    const row = e.target.closest('.row'); if (!row) return;
    const panel = row.closest('.sv-panel'); const q = SURVEY[+panel.dataset.i];
    const v = row.dataset.v;
    if (q.lang) setLang(v, { silent: true }); else { state[q.key] = v; store.set(q.key, v); }
    $$('.row', panel).forEach((r) => {
      const on = r === row; const was = r.classList.contains('on');
      r.classList.toggle('on', on);
      if (on && !was) {
        gsap.fromTo(r.querySelector('.tintbg'), { scaleX: 0 }, { scaleX: 1, duration: D(0.5), clearProps: 'transform' });
        gsap.fromTo(r.querySelector('.radio'), { '--r': 0 }, { '--r': 1, duration: D(0.45), ease: 'back.out(3)', onComplete() { r.querySelector('.radio').style.removeProperty('--r'); } });
      }
    });
    haptic(6);
    if (q.key === 'mode') { $('#player').classList.toggle('simple', v === 'listen'); }
    clearTimeout(svAuto);
    if (+panel.dataset.i < SURVEY.length - 1) svAuto = setTimeout(() => showStep(+panel.dataset.i + 1, 1), state.reduce ? 150 : 520);
  });
}
let svAuto = null;
function showStep(i, dir = 1, instant = false) {
  const panels = $$('.sv-panel'); const prev = panels[svStep]; const next = panels[i];
  const changed = prev !== next;
  next.classList.add('is-on');
  $('#sv-count').textContent = `Paso ${i + 1} de ${SURVEY.length}`;
  $('#sv-next').textContent = i === SURVEY.length - 1 ? (state.mode === 'ar' ? 'Empezar en RA' : 'Empezar la visita') : 'Continuar';
  gsap.to('#sv-prog', { scaleX: (i + 1) / SURVEY.length, duration: D(0.6) });
  if (changed && !instant) {
    gsap.to(prev, { x: -44 * dir, autoAlpha: 0, duration: D(0.32), ease: 'power2.in', onComplete: () => { prev.classList.remove('is-on'); gsap.set(prev, { clearProps: 'all' }); } });
  } else if (changed) { prev.classList.remove('is-on'); gsap.set(prev, { clearProps: 'all' }); }
  const d = instant ? 0.25 : 0.22;
  gsap.timeline({ delay: D(d) })
    .fromTo(next, { x: 44 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: D(0.55) })
    .fromTo(next.querySelector('.q-ico'), { scale: 0.4, rotation: -20, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: D(0.7), ease: 'back.out(2.2)' }, 0.02)
    .fromTo(svSplits[i].words, { yPercent: 105 }, { yPercent: 0, duration: D(0.6), stagger: 0.05, ease: 'expo.out' }, 0.06)
    .fromTo($$('.row', next), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: D(0.5), stagger: 0.045 }, 0.14);
  svStep = i;
}
function finishSurvey() {
  clearTimeout(svAuto);
  if (!state.company) { state.company = 'solo'; store.set('company', 'solo'); }
  store.set('surveyed', true);
  applyPrefs(); renderHome();
  if (narrator.stop) narrator.load(curStop(), { kids: state.company === 'ninos' });
  svFromHome = false;
  if (state.mode === 'read') { narrator.setVoice(false); state.voice = false; store.set('voice', false); syncToggles(); }
  go('home', { dir: 'push' });
  if (state.mode === 'voice') setTimeout(() => toast('Modo voz: toca el micro y di «pausa», «sigue» o haz una pregunta', 'i-mic'), 900);
}

// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------
const COMPANY = { solo: 'por tu cuenta', pareja: 'en pareja o con amigos', ninos: 'con niños', grupo: 'en grupo' };
function renderHome() {
  const r = route();
  const mins = state.time === '20' ? 20 : state.time === 'libre' ? 70 : 50;
  $('#home-plan').innerHTML = `<b>Tu visita:</b> ${COMPANY[state.company] || 'por tu cuenta'} · ${r.length} paradas · unos ${mins} min <button data-act="change-visit">Cambiar</button>`;
  const s = narrator.started && narrator.stop ? narrator.stop : null;
  $('#home-go span').textContent = s ? `Seguir en ${lower1(s.name)}` : state.mode === 'ar' ? 'Empezar en realidad aumentada' : `Empezar por ${lower1(r[0].name)}`;
  const heard = r.filter((x) => state.visited.has(x.id)).length;
  $('#home-count').textContent = `${heard} de ${r.length} escuchadas`;
  $('#home-all').textContent = `Ver las ${r.length} paradas`;
  $('#home-stops').innerHTML = r.slice(0, 4).map((x, i) => stopRow(x, i === 0)).join('');
  startEq();
}
function stopRow(x, first) {
  const playingHere = narrator.stop?.id === x.id && narrator.started;
  const lead = playingHere ? '<span class="eq"><i></i><i></i><i></i></span>' : state.visited.has(x.id) ? '<svg class="i"><use href="#i-check"/></svg>' : x.n;
  return `<button class="stoprow hr ${first ? 'first' : ''} ${playingHere ? 'cur' : ''}" data-stop="${x.id}"><span class="n">${lead}</span><span class="ph"><img src="${x.cover.src}" alt="" style="object-position:${x.cover.pos};transform:scale(${Math.min(x.cover.zoom, 1.6)});transform-origin:${x.cover.pos}"></span><span class="t">${x.name}<small>${playingHere ? 'Sonando ahora' : `${x.min} min · ${floorTxt(x.floor)}`}</small></span><svg class="i chev"><use href="#i-chev"/></svg></button>`;
}
function startEq() { $$('.eq i').forEach((b, i) => { gsap.killTweensOf(b); gsap.fromTo(b, { scaleY: 0.3 }, { scaleY: () => gsap.utils.random(0.45, 1), duration: () => gsap.utils.random(0.28, 0.5), repeat: -1, yoyo: true, repeatRefresh: true, ease: 'sine.inOut', delay: i * 0.08, paused: !narrator.playing }); }); }
document.addEventListener('click', (e) => { const r = e.target.closest('.stoprow[data-stop]'); if (!r) return; if (sheetOpen) closeSheet(); setTimeout(() => playStop(r.dataset.stop, { dir: cur === 'home' ? 'push' : 'fade' }), sheetOpen ? 200 : 0); });

let homeIntroDone = false; let homeST = [];
onEnter.home = () => {
  renderHome();
  requestAnimationFrame(() => ScrollTrigger.refresh());
  if (homeIntroDone || state.reduce) return; homeIntroDone = true;
  gsap.timeline({ delay: 0.15 })
    .from('#hero img', { scale: 1.16, duration: 1.8, ease: 'expo.out' })
    .from('#home-bar > *', { y: -16, autoAlpha: 0, stagger: 0.08, duration: 0.6 }, 0.1)
    .from('.intro .hr', { y: 24, autoAlpha: 0, stagger: 0.07, duration: 0.75 }, 0.2)
    .from('#home .sect-h, #home-stops .stoprow', { y: 18, autoAlpha: 0, stagger: 0.06, duration: 0.6 }, 0.45);
  homeST.push(gsap.to('#hero img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '#hero', scroller: '#home-scroll', start: 'top top', end: 'bottom top', scrub: true } }));
  ScrollTrigger.create({ scroller: '#home-scroll', trigger: '.intro', start: 'top 70px', onEnter: () => $('#home-bar').classList.add('solid'), onLeaveBack: () => $('#home-bar').classList.remove('solid') });
  const late = $$('#home .tutcard, #home .tile, #home .settings-link, #home .allstops');
  gsap.set(late, { y: 30, autoAlpha: 0 });
  ScrollTrigger.batch(late, { scroller: '#home-scroll', start: 'top 96%', once: true, onEnter: (b) => gsap.to(b, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.7, overwrite: true }) });
};

// ---------------------------------------------------------------------------
// Reproductor
// ---------------------------------------------------------------------------
let lyricEls = []; let curWords = []; let chapBars = []; let curSegBars = []; let trackW = 0; let lastSec = -1; let draggingKnob = false;
const knobX = gsap.quickSetter('#knob', 'x', 'px');

function ensureStop() { if (!narrator.stop) { const s = curStop(); state.stopId = s.id; narrator.load(s, { kids: state.company === 'ninos' }); } }
function playStop(id, { open = true, autoplay = true, dir = 'push' } = {}) {
  const prev = narrator.stop;
  if (prev && prev.id !== id && narrator.t / narrator.total > 0.5) { state.visited.add(prev.id); saveVisited(); }
  state.stopId = id;
  narrator.load(stopById(id), { kids: state.company === 'ninos' });
  if (open && cur !== 'player') go('player', { dir });
  if (autoplay) { narrator.unlock(); narrator.play(); }
  renderHome();
}
function sentenceHTML(s) {
  const tk = s.tokens; let html = ''; let i = 0;
  while (i < tk.length) {
    if (tk[i].term) {
      const id = tk[i].term; const inner = []; let trail = '';
      while (i < tk.length && tk[i].term === id) {
        let w = tk[i].w;
        if (i + 1 >= tk.length || tk[i + 1].term !== id) { const m = w.match(/^(.*?)([,.;:!?»)]+)$/); if (m) { w = m[1]; trail = m[2]; } }
        inner.push(`<span class="w">${esc(w)}</span>`); i++;
      }
      html += `<button class="term" data-term="${id}">${inner.join(' ')}</button>${trail} `;
    } else { html += `<span class="w">${esc(tk[i].w)}</span> `; i++; }
  }
  return html.trim();
}
narrator.on('load', (stop) => {
  const r = route(); const idx = r.findIndex((x) => x.id === stop.id);
  $('#p-name').textContent = stop.name;
  $('#p-floor').textContent = floorTxt(stop.floor);
  $('#p-ask').textContent = stop.ask;
  const segs = r.map((x, i) => `<i class="${i < idx || (state.visited.has(x.id) && i !== idx) ? 'd' : ''}${i === idx ? ' c' : ''}"><b></b></i>`).join('');
  $('#segs').innerHTML = segs; $('#ar-segs').innerHTML = segs;
  $('#segcnt').textContent = `${idx + 1}/${r.length}`; $('#ar-segcnt').textContent = `${idx + 1}/${r.length}`;
  $('#lyric').innerHTML = '<div class="pad-top"></div>' + narrator.sents.map((s) => `<p class="s next" data-i="${s.i}">${sentenceHTML(s)}</p>`).join('') + '<div class="pad-bot"></div>';
  lyricEls = $$('#lyric .s');
  $('#tsegs').innerHTML = narrator.chapters.map((c) => `<i style="flex:${c.dur.toFixed(2)}"><b></b></i>`).join('');
  chapBars = $$('#tsegs i b'); curSegBars = $$('.segs i.c b');
  $('#simple-art').innerHTML = `<img src="${stop.cover.src}" alt="" style="object-position:${stop.cover.pos}">`;
  $('#ar-name').textContent = stop.short; $('#ar-nextname').textContent = nextStop(stop)?.short || 'Fin';
  hideEndcard();
  userScrollAt = 0;
  $('#mini-title').textContent = `${stop.n} · ${stop.name}`;
  requestAnimationFrame(() => { trackW = $('#track').clientWidth; followNow(true); });
  lastSec = -1;
  // Entrada del contenido de la parada
  if (cur === 'player' && !state.reduce) {
    gsap.fromTo(['#p-name', '#p-floor'], { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06 });
    gsap.fromTo('#lyric', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 });
  }
  if (cur === 'ar' && ar) ar.reset(stop);
});
narrator.on('sentence', (i, s) => {
  lyricEls.forEach((el, k) => {
    const now = k === i;
    el.classList.toggle('past', k < i); el.classList.toggle('next', k > i);
    if (now && !el.classList.contains('now')) { el.classList.add('now', 'fresh'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('fresh'))); }
    else if (!now) el.classList.remove('now');
    if (!now) $$('.w.on', el).forEach((w) => w.classList.remove('on'));
  });
  curWords = lyricEls[i] ? $$('.w', lyricEls[i]) : [];
  followNow();
  $('#mini-line').textContent = s.plain;
  hideEndcard();
  // Burbuja del guía en la RA
  const bp = $('#bubble-p'); bp.innerHTML = sentenceHTML(s);
  if (cur === 'ar' && arReady && !state.reduce) gsap.fromTo(bp, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45 });
});
narrator.on('word', (w) => {
  curWords.forEach((el, k) => el.classList.toggle('on', k <= w));
  $$('#bubble-p .w').forEach((el, k) => el.classList.toggle('on', k <= w));
});
narrator.on('chapter', (ch) => {
  setPhoto(ch.photo);
  const t = ch.focus ? TERMS[ch.focus] : null;
  const cap = $('#p-caption');
  cap.innerHTML = t ? `<b>${esc(t.name)}</b> · ${esc(t.cartela)}` : `<b>${esc(ch.title)}</b>`;
  if (!state.reduce) gsap.fromTo(cap, { y: 6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5 });
  swapText('#p-chap', ch.title);
  $('#p-chapn').textContent = `Capítulo ${ch.index + 1} de ${narrator.chapters.length}`;
  rollCount(ch.index + 1, narrator.chapters.length);
  $('#p-photo .ar-chip').style.visibility = ch.focus ? '' : 'hidden';
  $('#mini-img').src = ch.photo.src;
  if (cur === 'ar' && arReady && ch.focus && ar) ar.setPointed(ch.focus);
});
narrator.on('time', (t) => {
  const total = narrator.total || 1; const p = t / total;
  if (!draggingKnob) knobX(p * trackW);
  const bs = chapBars;
  narrator.chapters.forEach((c, k) => { if (bs[k]) bs[k].style.transform = `scaleX(${Math.max(0, Math.min(1, (t - c.start) / c.dur)).toFixed(4)})`; });
  const sec = Math.floor(t);
  if (sec !== lastSec) { lastSec = sec; $('#t-cur').textContent = fmt(t); $('#t-left').textContent = `−${fmt(total - t)}`; }
  curSegBars.forEach((b) => { b.style.transform = `scaleX(${p.toFixed(4)})`; });
  $('#mini-ring').style.strokeDashoffset = (138.2 * (1 - p)).toFixed(2);
});
narrator.on('state', (playing) => {
  $$('#play, .mini-pp, .ardock .pp').forEach((b) => { b.classList.toggle('is-playing', playing); b.setAttribute('aria-label', playing ? 'Pausa' : 'Reproducir'); });
  if (!state.reduce) gsap.fromTo('#play', { scale: 0.9 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' });
  $$('.eq i').forEach((b) => { const tw = gsap.getTweensOf(b)[0]; tw && (playing ? tw.resume() : tw.pause()); });
  if (cur === 'ar' && ar && arReady && !talking) ar.setGuideState(playing && narrator.voiceActive ? 'talk' : 'idle');
  updateMini();
});
narrator.on('end', () => {
  const s = narrator.stop; state.visited.add(s.id); saveVisited();
  const segC = $('#segs i.c'); segC && segC.classList.add('d');
  showEndcard();
  renderHome();
  if (cur === 'ar' && ar) ar.setGuideState('idle');
});
narrator.on('voicebroken', () => toast('Este navegador no tiene voz en español: la pista avanza en silencio, con el texto', 'i-text'));
narrator.on('cloudbroken', () => { toast('Sin conexión con ElevenLabs: sigue con la voz del dispositivo', 'i-speaker'); updateVoiceLabel(); });

function swapText(sel, text) {
  const el = $(sel); if (el.textContent === text) return;
  if (state.reduce) { el.textContent = text; return; }
  gsap.to(el, { y: -8, autoAlpha: 0, duration: 0.2, ease: 'power2.in', onComplete: () => { el.textContent = text; gsap.fromTo(el, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }); } });
}
function rollCount(n, total) {
  const c = $('#p-count'); const roll = c.querySelector('.roll'); const old = roll.querySelector('span');
  if (old && old.textContent === String(n)) { c.lastChild.textContent = ` / ${total}`; return; }
  const nw = document.createElement('span'); nw.textContent = n;
  c.lastChild.textContent = ` / ${total}`;
  if (state.reduce || !old) { roll.innerHTML = ''; roll.appendChild(nw); return; }
  roll.appendChild(nw);
  gsap.set(nw, { position: 'absolute', top: 0, left: 0 });
  gsap.fromTo(nw, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'back.out(2)' });
  gsap.to(old, { yPercent: -100, duration: 0.4, ease: 'power2.in', onComplete: () => { old.remove(); gsap.set(nw, { clearProps: 'position,top,left' }); } });
}
let kb = null;
function setPhoto(ph) {
  const wrap = $('#p-photo .ph');
  const img = new Image(); img.alt = ''; img.src = ph.src;
  img.style.objectPosition = ph.pos; img.style.transformOrigin = ph.pos;
  wrap.appendChild(img);
  const olds = $$('img', wrap).filter((x) => x !== img);
  kb && kb.kill();
  gsap.fromTo(img, { autoAlpha: 0, scale: ph.zoom * 1.1 }, { autoAlpha: 1, scale: ph.zoom, duration: D(1.1), ease: 'power2.out', onComplete: () => {
    olds.forEach((o) => o.remove());
    if (!state.reduce) kb = gsap.to(img, { scale: ph.zoom * 1.07, xPercent: 1.5, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  } });
}

// Seguir lo que suena: la frase actual abajo del todo, las anteriores encima en gris.
let userScrollAt = 0;
function followNow(instant = false) {
  const el = lyricEls[narrator.idx]; const ly = $('#lyric'); if (!el || !ly.clientHeight) return;
  if (userScrollAt && performance.now() - userScrollAt < 5000) return;
  const target = Math.max(0, el.offsetTop + el.offsetHeight - ly.clientHeight + 4);
  gsap.to(ly, { scrollTo: { y: target, autoKill: false }, duration: instant || state.reduce ? 0 : 0.9, ease: 'power3.inOut', overwrite: true });
  hideBackNow();
}
function bindLyric() {
  const ly = $('#lyric');
  const mark = () => { userScrollAt = performance.now(); showBackNow(); clearTimeout(ly._t); ly._t = setTimeout(() => { if (performance.now() - userScrollAt >= 5000) { userScrollAt = 0; followNow(); } }, 5100); };
  ly.addEventListener('wheel', mark, { passive: true });
  ly.addEventListener('touchmove', mark, { passive: true });
  ly.addEventListener('click', (e) => {
    if (e.target.closest('.term')) return;
    const s = e.target.closest('.s'); if (!s) return;
    narrator.seekSentence(+s.dataset.i); userScrollAt = 0; haptic(5);
    if (!narrator.playing) { narrator.unlock(); narrator.play(); }
  });
}
let backNowOn = false;
function showBackNow() { if (backNowOn) return; backNowOn = true; gsap.fromTo('#back-now', { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: D(0.35), ease: 'back.out(2)' }); }
function hideBackNow() { if (!backNowOn) return; backNowOn = false; gsap.to('#back-now', { autoAlpha: 0, y: -8, duration: D(0.25) }); }

function bindTrack() {
  const track = $('#track');
  Draggable.create('#knob', {
    type: 'x', bounds: { minX: 0, maxX: 1 },
    onPress() { this.applyBounds({ minX: 0, maxX: track.clientWidth }); trackW = track.clientWidth; draggingKnob = true; track.classList.add('drag'); },
    onDrag() { const t = (this.x / trackW) * narrator.total; $('#t-cur').textContent = fmt(t); $('#t-left').textContent = `−${fmt(narrator.total - t)}`; const ch = narrator.chapterAt(t); ch && swapText('#p-chap', ch.title); },
    onRelease() { draggingKnob = false; track.classList.remove('drag'); narrator.seek((this.x / trackW) * narrator.total); haptic(6); },
  });
  track.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#knob')) return;
    const r = track.getBoundingClientRect(); const p = (e.clientX - r.left) / r.width;
    narrator.seek(p * narrator.total); haptic(5);
  });
  track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') narrator.skip(5); if (e.key === 'ArrowLeft') narrator.skip(-5); });
  window.addEventListener('resize', () => { trackW = track.clientWidth; });
}

function showEndcard() {
  const n = nextStop(); const ec = $('#endcard'); endOn = true;
  ec.innerHTML = n
    ? `<div class="over">Parada terminada</div><h3>Siguiente: ${n.n} · ${esc(n.name)}</h3><p>${floorTxt(n.floor)} · ${esc(n.howto)}</p><div class="btns"><button class="btn primary" data-act="go-next"><svg class="i fill"><use href="#i-play"/></svg>Ir a la ${n.n}</button><button class="btn second" data-act="map"><svg class="i"><use href="#i-map"/></svg>Ver en el plano</button></div>`
    : `<div class="over">Fin de la visita</div><h3>Gracias por venir</h3><p>Has recorrido la Basílica de San Juan de Dios. Puedes volver a cualquier parada desde el inicio.</p><div class="btns"><button class="btn primary" data-act="home">Volver al inicio</button></div>`;
  gsap.fromTo(ec, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: D(0.6) });
  gsap.from($$('.endcard > *'), { y: 14, autoAlpha: 0, stagger: 0.07, duration: D(0.5), delay: D(0.1) });
}
let endOn = false;
function hideEndcard() { if (!endOn) return; endOn = false; gsap.to('#endcard', { autoAlpha: 0, duration: D(0.25) }); }
ACT['go-next'] = () => { const n = nextStop(); if (n) playStop(n.id, { open: false }); };

onEnter.player = () => {
  requestAnimationFrame(() => { trackW = $('#track').clientWidth; followNow(true); knobX((narrator.t / (narrator.total || 1)) * trackW); });
};

// ---------------------------------------------------------------------------
// Mini reproductor
// ---------------------------------------------------------------------------
let miniOn = false;
function updateMini() {
  const show = narrator.started && !!narrator.stop && (cur === 'home' || cur === 'map');
  $('#app').classList.toggle('mini-on', narrator.started && !!narrator.stop);
  if (show === miniOn) return; miniOn = show;
  if (show) gsap.fromTo('#mini', { y: 90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: D(0.6), ease: 'back.out(1.4)', delay: D(0.25) });
  else gsap.to('#mini', { y: 90, autoAlpha: 0, duration: D(0.3), ease: 'power2.in' });
}

// ---------------------------------------------------------------------------
// Hojas: suben desde abajo, la pantalla de detrás se hunde, se cierran arrastrando
// ---------------------------------------------------------------------------
let sheetOpen = null; let sheetOnClose = null;
function openSheet(id, { onClose } = {}) {
  if (sheetOpen && sheetOpen !== id) closeSheet(true);
  const sh = $('#' + id); sheetOpen = id; sheetOnClose = onClose || null;
  gsap.killTweensOf(sh);
  gsap.set(sh, { visibility: 'visible', y: 0 });
  gsap.fromTo(sh, { yPercent: 100 }, { yPercent: 0, duration: D(0.6), ease: 'ios' });
  gsap.to('#scrim', { autoAlpha: 1, duration: D(0.4) });
  const scr = screens[cur];
  if (scr && cur !== 'ar') gsap.to(scr, { scale: 0.94, borderRadius: 28, duration: D(0.6), ease: 'ios', transformOrigin: '50% 100%' });
  if (!sh._drag) { sh._drag = true; bindSheetDrag(sh, id === 'sh-term' ? { onSwipeX: termSwipe } : {}); }
}
function closeSheet(instant = false) {
  if (!sheetOpen) return;
  const sh = $('#' + sheetOpen); const cb = sheetOnClose; sheetOpen = null; sheetOnClose = null;
  gsap.killTweensOf(sh);
  gsap.to(sh, { y: sh.offsetHeight + 30, duration: instant ? 0 : D(0.42), ease: 'power3.in', onComplete: () => gsap.set(sh, { visibility: 'hidden', y: 0, yPercent: 0 }) });
  gsap.to('#scrim', { autoAlpha: 0, duration: instant ? 0 : D(0.35) });
  const scr = screens[cur];
  if (scr && cur !== 'ar') gsap.to(scr, { scale: 1, borderRadius: 0, duration: D(0.5), ease: 'ios', clearProps: 'transform,borderRadius' });
  cb && cb();
}
function bindSheetDrag(sh, { onSwipeX } = {}) {
  sh.querySelectorAll('[data-grab]').forEach((h) => {
    h.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, input, a')) return;
      const sx = e.clientX, sy = e.clientY; const t0 = performance.now(); let axis = null, dx = 0, dy = 0;
      const move = (ev) => {
        dx = ev.clientX - sx; dy = ev.clientY - sy;
        if (!axis && Math.hypot(dx, dy) > 8) axis = Math.abs(dy) >= Math.abs(dx) || !onSwipeX ? 'y' : 'x';
        if (axis === 'y') { gsap.set(sh, { y: dy > 0 ? dy : dy * 0.15 }); gsap.set('#scrim', { opacity: 1 - Math.max(0, dy) / sh.offsetHeight }); }
        else if (axis === 'x') onSwipeX('move', dx);
      };
      const up = () => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        if (axis === 'y') {
          const v = dy / Math.max(1, performance.now() - t0);
          if (dy > 110 || v > 0.6) closeSheet();
          else { gsap.to(sh, { y: 0, duration: 0.5, ease: 'back.out(1.5)' }); gsap.to('#scrim', { opacity: 1, duration: 0.3 }); }
        } else if (axis === 'x') onSwipeX('end', dx);
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
  });
}

// ---------------------------------------------------------------------------
// Ficha del objeto (término enlazado)
// ---------------------------------------------------------------------------
let termCur = null; let termWas = false; let termList = [];
function askFor(t) {
  if (t.kind === 'Persona') return `¿Quién fue ${t.name}?`;
  const w = t.name.split(' ')[0].toLowerCase(); const plural = /s$/.test(w);
  const art = /as$/.test(w) ? 'las' : /(os|es)$/.test(w) ? 'los' : /a$/.test(w) ? 'la' : 'el';
  return `¿Qué ${plural ? 'son' : 'es'} ${art} ${t.name.charAt(0).toLowerCase() + t.name.slice(1)}?`;
}
function openTerm(id, { keepPlaying = false } = {}) {
  const t = TERMS[id]; if (!t) return;
  const already = sheetOpen === 'sh-term';
  if (!already) { termWas = narrator.playing; if (!keepPlaying) narrator.pause(); }
  const stop = stopById(t.stop);
  termList = stop && stop.ar.includes(id) ? stop.ar : [id];
  fillTerm(id, 0);
  if (!already) openSheet('sh-term', { onClose: () => { narrator.hush(); setListen(false); if (termWas && !narrator.playing) narrator.play(); } });
  haptic(6);
}
function fillTerm(id, dir) {
  const t = TERMS[id]; termCur = id;
  const stop = stopById(t.stop);
  $('#tc-over').textContent = `${t.kind} · ${stop ? stop.short : ''}`;
  $('#tc-name').textContent = t.name; $('#tc-cartela').textContent = t.cartela; $('#tc-def').textContent = t.def;
  $('#tc-dots').innerHTML = termList.length > 1 ? termList.map((x) => `<button data-tdot="${x}" class="${x === id ? 'on' : ''}" aria-label="${esc(TERMS[x].name)}"><i></i></button>`).join('') : '';
  const wrap = $('#sh-term .tc-ph'); const img = new Image(); img.alt = t.name; img.src = t.photo.src;
  img.style.objectPosition = t.photo.pos; img.style.transformOrigin = t.photo.pos;
  wrap.appendChild(img); const olds = $$('img', wrap).filter((x) => x !== img);
  gsap.fromTo(img, { autoAlpha: 0, scale: t.photo.zoom * 1.12, xPercent: dir * 12 }, { autoAlpha: 1, scale: t.photo.zoom, xPercent: 0, duration: D(0.9), ease: 'expo.out', onComplete: () => olds.forEach((o) => o.remove()) });
  olds.forEach((o) => gsap.to(o, { xPercent: -dir * 12, autoAlpha: 0, duration: D(0.4) }));
  if (dir) gsap.fromTo('.tc-body > *', { x: dir * 18, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: D(0.45), stagger: 0.04 });
  else gsap.fromTo('.tc-body > *', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: D(0.55), stagger: 0.05, delay: D(0.15) });
  narrator.hush(); setListen(false);
}
function termSwipe(phase, dx) {
  const img = $('#sh-term .tc-ph img:last-child');
  if (phase === 'move') { img && gsap.set(img, { x: dx * 0.5 }); return; }
  const i = termList.indexOf(termCur);
  if (Math.abs(dx) > 50 && termList.length > 1) { const n = (i + (dx < 0 ? 1 : -1) + termList.length) % termList.length; img && gsap.set(img, { x: 0 }); fillTerm(termList[n], dx < 0 ? 1 : -1); haptic(5); }
  else img && gsap.to(img, { x: 0, duration: 0.4, ease: 'back.out(2)' });
}
document.addEventListener('click', (e) => { const d = e.target.closest('[data-tdot]'); if (!d) return; const i = termList.indexOf(termCur); const n = termList.indexOf(d.dataset.tdot); if (n !== i) fillTerm(d.dataset.tdot, n > i ? 1 : -1); });
let listenTl = null;
function setListen(on) {
  const b = $('#tc-listen'); b.classList.toggle('speaking', on);
  listenTl && listenTl.kill(); gsap.set('#tc-listen svg', { scale: 1 });
  if (on && !state.reduce) listenTl = gsap.to('#tc-listen svg', { scale: 1.18, duration: 0.42, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' });
}
async function listenTerm() {
  if ($('#tc-listen').classList.contains('speaking')) { narrator.hush(); setListen(false); return; }
  const t = TERMS[termCur]; setListen(true);
  await narrator.say(`${t.name}. ${t.def}`);
  setListen(false);
}

// ---------------------------------------------------------------------------
// Listas: paradas e idioma
// ---------------------------------------------------------------------------
function openStops() {
  const r = route(); const heard = r.filter((x) => state.visited.has(x.id)).length;
  $('#stops-sub').textContent = `${heard} de ${r.length} escuchadas · ${state.time === '20' ? 'lo esencial' : 'la visita completa'}`;
  $('#stops-list').innerHTML = r.map((x) => stopRow(x, false)).join('');
  openSheet('sh-stops');
  startEq();
  gsap.from('#stops-list .stoprow', { y: 16, autoAlpha: 0, stagger: 0.035, duration: D(0.45), delay: D(0.15) });
}
function openLang() {
  $('#lang-list').innerHTML = LANGS.map((l) => `<button class="row lang-row ${l.code === state.lang ? 'on' : ''}" data-lang="${l.code}"><span class="t">${l.name}<small>${l.code === detectLang() ? 'Idioma de tu móvil' : l.sub}</small></span><svg class="i check"><use href="#i-check"/></svg></button>`).join('');
  openSheet('sh-lang');
  gsap.from('#lang-list .row', { y: 14, autoAlpha: 0, stagger: 0.03, duration: D(0.4), delay: D(0.12) });
}
document.addEventListener('click', (e) => {
  const r = e.target.closest('[data-lang]'); if (!r) return;
  $$('#lang-list .row').forEach((x) => x.classList.toggle('on', x === r));
  gsap.fromTo(r.querySelector('.check'), { scale: 0.3 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
  setLang(r.dataset.lang);
  setTimeout(closeSheet, 350);
});
function setLang(code, { silent = false } = {}) {
  state.lang = code; store.set('lang', code); applyPrefs();
  $$('.lang-code').forEach((el) => { if (!state.reduce) gsap.fromTo(el, { rotationX: -90 }, { rotationX: 0, duration: 0.5, ease: 'back.out(2)' }); });
  if (code !== 'ES' && !silent) toast('En el prototipo, los contenidos solo están en español', 'i-globe');
  if (code !== 'ES' && silent) setTimeout(() => toast('En el prototipo, los contenidos solo están en español', 'i-globe'), 300);
}

// ---------------------------------------------------------------------------
// Plano (dibujo sobre el levantamiento de Almagro y Cuadros, 2010)
// ---------------------------------------------------------------------------
const PLAN = {
  0: { vb: '-14 -40 400 560', walls: ['M192.4 436.6 L192.4 397.8 L212.0 397.8 L212.0 358.9 L192.4 358.9 L192.4 340.4 L212.0 340.4 L212.0 301.6 L192.4 301.6 L192.4 266.4 L201.7 255.3 L264.6 255.3 L264.6 148.0 L201.7 148.0 L192.4 133.2 L192.4 103.6 L192.4 44.4 L87.0 44.4 L87.0 103.6 L87.0 133.2 L75.8 146.2 L14.8 146.2 L14.8 253.4 L75.8 253.4 L87.0 266.4 L87.0 299.7 L62.9 299.7 L62.9 338.6 L87.0 338.6 L87.0 357.1 L62.9 357.1 L62.9 395.9 L87.0 395.9 L87.0 436.6 L98.0 466.2 L183.2 466.2 Z', 'M240.5 44.4 L240.5 118.4 L192.4 118.4 L192.4 44.4 Z'],
    thin: ['M164.7 47.4 L164.7 58.5 L116.5 58.5 L116.5 47.4 Z', 'M197.9 0.0 L197.9 19.2 L181.3 19.2 L181.3 0.0 Z'], stairs: [177.8, -2.4],
    labels: [['PORTADA', 140.6, 494.2, 'middle'], ['NAVE', 121.6, 318.2, 'end'], ['ALTAR', 79.0, 79.0, 'end'], ['SACRISTÍA', 248.5, 86.4, 'start'], ['AL CAMARÍN', 207.8, 14.6, 'start']] },
  1: { vb: '-6 -20 392 330', walls: ['M306.8 67.6 L306.8 140.4 L257.4 140.4 L257.4 174.2 L70.2 174.2 L70.2 140.4 L20.8 140.4 L20.8 67.6 L70.2 67.6 L70.2 41.6 L117.0 41.6 L117.0 10.4 L210.6 10.4 L210.6 41.6 L257.4 41.6 L257.4 67.6 Z', 'M218.4 174.2 L218.4 239.2 L109.2 239.2 L109.2 174.2'],
    thin: ['M244.4 176.8 L244.4 203.8 L221.0 203.8 L221.0 176.8 Z'], stairs: [221.0, 178.3],
    labels: [['CAMARÍN', 214.8, 30.2, 'start'], ['ANTECAMARÍN', 163.8, 259.8, 'middle']] },
};
let mapFloor = 0; let mapSel = null; let mapDrag = null;
function buildMap() { $('#plan-wrap').innerHTML = [0, 1].map((f) => `<svg class="plan" data-floor="${f}" viewBox="${PLAN[f].vb}" preserveAspectRatio="xMinYMid meet" role="img" aria-label="Plano de la planta ${f}"></svg>`).join(''); }
function drawPlan(f) {
  const P = PLAN[f]; const here = narrator.started ? narrator.stop : null; const nx = here ? nextStop(here) : route()[0];
  const pins = route().filter((s) => s.floor === f).map((s) => {
    const { x, y, r } = s.map; const isHere = here && here.id === s.id; const isNext = nx && nx.id === s.id; const done = state.visited.has(s.id) && !isHere;
    const photo = s.n <= 4 || isHere || done;
    const cls = `pin ${photo ? 'photo' : ''} ${isHere ? 'here' : ''} ${isNext ? 'next' : ''} ${done ? 'done' : ''} ${mapSel === s.id ? 'sel' : ''}`;
    if (!photo) return `<g class="${cls}" data-pin="${s.id}" style="transform-origin:${x}px ${y}px"><circle class="ring" cx="${x}" cy="${y}" r="${r}"/><text x="${x}" y="${y + 5}">${s.n}</text></g>`;
    const R = isHere ? 26 : r;
    return `<g class="${cls}" data-pin="${s.id}" style="transform-origin:${x}px ${y}px">${isHere ? `<circle class="halo" cx="${x}" cy="${y}" r="${R + 15}"/>` : ''}<clipPath id="cp-${s.id}"><circle cx="${x}" cy="${y}" r="${R}"/></clipPath><image href="${s.cover.src}" x="${x - R * 1.5}" y="${y - R}" width="${R * 3}" height="${R * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cp-${s.id})"/><circle class="ring" cx="${x}" cy="${y}" r="${R}"/><circle class="badge" cx="${x + R * 0.82}" cy="${y - R * 0.82}" r="12"/><text class="badge-t" x="${x + R * 0.82}" y="${y - R * 0.82 + 5}">${s.n}</text></g>`;
  }).join('');
  $(`#plan-wrap svg[data-floor="${f}"]`).innerHTML = P.walls.map((d) => `<path class="wall" d="${d}"/>`).join('') + P.thin.map((d) => `<path class="wall-thin" d="${d}"/>`).join('')
    + `<g class="stairs" transform="translate(${P.stairs[0]} ${P.stairs[1]})"><svg width="24" height="24" viewBox="0 0 24 24" class="i"><use href="#i-stairs"/></svg></g>`
    + P.labels.map(([t, x, y, a]) => `<text class="plabel" x="${x}" y="${y}" text-anchor="${a}">${t}</text>`).join('') + pins;
}
function showFloor(f, animate = true) {
  const old = mapFloor; mapFloor = f;
  [0, 1].forEach((k) => drawPlan(k));
  const here = narrator.started ? narrator.stop : null;
  $$('#floors button').forEach((b) => { b.classList.toggle('on', +b.dataset.floor === f); b.classList.toggle('here', here ? +b.dataset.floor === here.floor : +b.dataset.floor === 0); b.setAttribute('aria-selected', +b.dataset.floor === f); });
  const show = $(`#plan-wrap svg[data-floor="${f}"]`); const hide = $(`#plan-wrap svg[data-floor="${1 - f}"]`);
  gsap.set(hide, { autoAlpha: 0 });
  if (animate && !state.reduce) {
    const d = f > old ? -1 : 1;
    gsap.fromTo(show, { autoAlpha: 0, y: 40 * d, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, transformOrigin: '50% 50%' });
    gsap.fromTo($$('.pin', show), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.55, ease: 'back.out(2.4)', stagger: 0.05, delay: 0.2 });
  } else gsap.set(show, { autoAlpha: 1, y: 0, scale: 1 });
  pulseHere();
  renderMapSheet();
}
let haloTw = null;
function pulseHere() {
  haloTw && haloTw.kill();
  const h = $(`#plan-wrap svg[data-floor="${mapFloor}"] .halo`);
  if (h && !state.reduce) haloTw = gsap.fromTo(h, { attr: { r: 30 }, opacity: 0.28 }, { attr: { r: 48 }, opacity: 0, duration: 1.8, repeat: -1, ease: 'power2.out' });
}
function renderMapSheet() {
  const here = narrator.started ? narrator.stop : null; const ms = $('#mapsheet');
  const sel = mapSel ? stopById(mapSel) : null;
  if (sel) {
    const isHere = here && here.id === sel.id; const isNext = here ? nextStop(here)?.id === sel.id : route()[0].id === sel.id;
    const eyebrow = isHere ? `Estás aquí · <b>${esc(floorTxt(sel.floor))}</b>` : here && isNext ? `Estás en <b>${esc(lower1(here.name))}</b> · Siguiente${sel.floor !== here.floor ? `, en la planta ${sel.floor}` : ''}` : `Parada ${sel.n} de ${route().length} · ${floorTxt(sel.floor)}`;
    const bare = sel.name.replace(/^(La|El|Las|Los) /, ''); ms.innerHTML = `<div class="eyebrow">${eyebrow}</div><h2>${sel.n} · ${esc(bare.charAt(0).toUpperCase() + bare.slice(1))}</h2><p>${esc(sel.howto)}</p><button class="btn primary wide" data-act="map-play"><svg class="i fill"><use href="#i-play"/></svg>${isHere ? 'Seguir escuchando' : `Escuchar la parada ${sel.n}`}</button>`;
  } else {
    const list = route().filter((s) => s.floor === mapFloor);
    ms.innerHTML = `<div class="eyebrow">${floorTxt(mapFloor)}${mapFloor === 1 ? ' · encima del altar mayor' : ''} · ${list.length} paradas</div><div class="rows">${list.slice(0, 3).map((s) => `<button class="row" data-pinrow="${s.id}"><img src="${s.cover.src}" alt=""><span class="t"><b>${s.n} · ${esc(s.name)}</b><small>${esc(s.howto)}</small></span><svg class="i chev"><use href="#i-chev"/></svg></button>`).join('')}</div>`;
  }
  gsap.fromTo($$('#mapsheet > *'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: D(0.45) });
}
ACT['map-play'] = () => { const here = narrator.started ? narrator.stop : null; if (here && here.id === mapSel) { go('player', { dir: 'up' }); if (!narrator.playing) narrator.play(); } else playStop(mapSel, { dir: 'up' }); };
document.addEventListener('click', (e) => {
  const p = e.target.closest('[data-pin]'); const pr = e.target.closest('[data-pinrow]'); const fl = e.target.closest('#floors [data-floor]');
  if (fl) { mapSel = null; showFloor(+fl.dataset.floor); haptic(5); return; }
  const id = p?.dataset.pin || pr?.dataset.pinrow; if (!id) return;
  mapSel = id; const s = stopById(id);
  if (s.floor !== mapFloor) showFloor(s.floor); else { drawPlan(mapFloor); pulseHere(); renderMapSheet(); }
  const g = $(`#plan-wrap svg[data-floor="${mapFloor}"] [data-pin="${id}"]`);
  g && gsap.fromTo(g, { scale: 0.7, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' });
  haptic(6);
});
onEnter.map = () => {
  const here = narrator.started ? narrator.stop : null;
  mapSel = here ? (nextStop(here)?.id || here.id) : route()[0].id;
  const sel = stopById(mapSel);
  showFloor(here && here.floor !== sel.floor ? here.floor : sel.floor);
  syncSegm('modes', null);
  if (!mapDrag) {
    mapDrag = Draggable.create('#plan-wrap', { type: 'x,y', inertia: true, bounds: { minX: -160, maxX: 160, minY: -200, maxY: 200 }, edgeResistance: 0.75, dragClickables: true, minimumMovement: 6 })[0];
  }
  gsap.set('#plan-wrap', { x: 0, y: 0, scale: 1 });
};
function centerMap() {
  const here = narrator.started ? narrator.stop : route()[0];
  if (here.floor !== mapFloor) { mapSel = here.id; showFloor(here.floor); }
  const card = $('#mapcard').getBoundingClientRect(); const pin = $(`#plan-wrap svg[data-floor="${here.floor}"] [data-pin="${here.id}"] .ring`);
  if (!pin) return;
  const pr = pin.getBoundingClientRect(); const cx = pr.left + pr.width / 2, cy = pr.top + pr.height / 2;
  const curX = gsap.getProperty('#plan-wrap', 'x'), curY = gsap.getProperty('#plan-wrap', 'y');
  gsap.to('#plan-wrap', { x: curX + (card.left + card.width / 2 - cx), y: curY + (card.top + card.height * 0.45 - cy), duration: D(0.8), ease: 'expo.out', onComplete: () => mapDrag && mapDrag.update() });
  gsap.fromTo('#mapcard .center svg', { rotation: 0 }, { rotation: 180, duration: D(0.6), ease: 'back.out(2)' });
}

// Control segmentado con indicador que se desliza
function syncSegm(name, value) {
  const seg = $(`[data-segm="${name}"]`); if (!seg) return;
  const btns = $$('button', seg); let on = value == null ? btns.find((b) => b.classList.contains('on')) : btns.find((b) => b.dataset.v === value);
  if (!on) return;
  btns.forEach((b) => b.classList.toggle('on', b === on));
  const ind = seg.querySelector('.ind');
  requestAnimationFrame(() => { if (!on.offsetWidth) return; gsap.to(ind, { x: on.offsetLeft, width: on.offsetWidth, duration: ind._init ? D(0.5) : 0, ease: 'back.out(1.2)' }); ind._init = true; });
}

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------
function bindSettings() {
  $$('[data-segm]').forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    const name = seg.dataset.segm; const v = b.dataset.v; syncSegm(name, v); haptic(5);
    if (name === 'textSize') { state.textSize = v; store.set('textSize', v); applyPrefs(); gsap.fromTo('#set-preview', { scale: 0.97, transformOrigin: '0 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(2)' }); requestAnimationFrame(() => followNow(true)); }
    if (name === 'speed') setSpeed(+v);
    if (name === 'theme') { state.theme = v; store.set('theme', v); applyPrefs(); }
  }));
  $$('[data-toggle]').forEach((row) => row.addEventListener('click', () => {
    const k = row.dataset.toggle; state[k] = !state[k]; store.set(k, state[k]); syncToggles(); haptic(6);
    if (k === 'voice') narrator.setVoice(state.voice);
    if (k === 'reduce') { applyPrefs(); if (state.reduce) { kb && kb.kill(); gsap.killTweensOf('.cover-photo img'); } }
    if (k === 'contrast' || k === 'subs') applyPrefs();
    if (k === 'ad' && state.ad) toast('En la versión final, una pista extra describe cada sala', 'i-speaker');
  }));
  $$('[data-mode]').forEach((row) => row.addEventListener('click', () => {
    state.mode = row.dataset.mode; store.set('mode', state.mode); syncModes(); applyPrefs(); haptic(6);
    if (state.mode === 'voice') toast('Modo voz: toca el micro y di «pausa», «sigue» o «siguiente parada»', 'i-mic');
    if (state.mode === 'listen') toast('Modo sencillo: solo audio y botones grandes', 'i-headph');
  }));
}
function updateVoiceLabel() {
  const small = $('[data-toggle="voice"] small'); if (!small) return;
  const e = narrator.engine;
  const name = { eleven_v4_turbo: 'ElevenLabs v4 Turbo', eleven_v4: 'ElevenLabs v4', eleven_flash_v2_5: 'ElevenLabs Flash v2.5' }[cloud.status.model] || 'ElevenLabs v4 Turbo';
  small.textContent = e === 'cloud' ? `${name}, en tiempo real` : e === 'device' ? 'Voz del dispositivo (sin conexión con ElevenLabs)' : 'Sin voz: solo texto';
}
function syncToggles() { $$('[data-toggle]').forEach((row) => { const on = !!state[row.dataset.toggle]; row.querySelector('.sw').classList.toggle('on', on); row.querySelector('.sw').setAttribute('aria-checked', on); }); }
function syncModes() { $$('[data-mode]').forEach((row) => row.classList.toggle('on', row.dataset.mode === state.mode)); }
onEnter.settings = () => {
  syncToggles(); syncModes(); updateVoiceLabel();
  syncSegm('textSize', state.textSize); syncSegm('speed', String(state.speed)); syncSegm('theme', state.theme);
  $('#set-scroll').scrollTop = 0;
  if (!state.reduce) gsap.from('#set-scroll > *', { y: 16, autoAlpha: 0, stagger: 0.025, duration: 0.5, delay: 0.2 });
};

// ---------------------------------------------------------------------------
// Asistente (respuestas cerradas al contenido de la visita)
// ---------------------------------------------------------------------------
function findAnswer(q) {
  const n = norm(q); let best = null; let bestScore = 0;
  for (const k of KB) {
    let s = 0; for (const key of k.keys) { const nk = norm(key); if (n.includes(nk)) s += nk.length + 5; }
    if (s > bestScore) { bestScore = s; best = k; }
  }
  if (/cuanto|cuánto/.test(q) && /(queda|dura|tiempo|falta)/.test(n)) {
    const r = route(); const i = r.findIndex((x) => x.id === curStop().id); const left = r.slice(i + 1);
    return { a: `Te quedan ${left.length} paradas, unos ${left.reduce((a, b) => a + b.min, 0)} minutos de visita.`, stop: curStop().id };
  }
  return best || { a: FALLBACK, stop: null };
}
function voiceCommand(q) {
  const n = norm(q);
  if (/^(pausa|para|detente|calla)\b/.test(n)) { narrator.pause(); asWas = false; toast('Pausa', 'i-pause'); return true; }
  if (/^(sigue|continua|reproduce|play|reanuda)\b/.test(n)) { asWas = true; closeSheet(); return true; }
  if (/siguiente( parada)?$/.test(n)) { const nx = nextStop(); closeSheet(); if (nx) setTimeout(() => playStop(nx.id, { open: true, dir: 'up' }), 300); return true; }
  return false;
}
let asWas = false; let asAsked = new Set(); let asBusy = false; let asQueue = null;
function openAssist(prefill) {
  asWas = narrator.playing; narrator.pause();
  const s = narrator.started ? narrator.stop : null;
  $('#as-stop').textContent = s ? s.name : 'Basílica de San Juan de Dios';
  $('#as-paused').textContent = s ? `En pausa en ${fmt(narrator.t)}` : 'Pregunta lo que quieras de la visita';
  $('#sh-assist .resume').style.display = s ? '' : 'none';
  renderSugg('#as-sugg', (s || curStop()).suggest);
  openSheet('sh-assist', { onClose: () => { stopRec(); narrator.hush(); asQueue && asQueue.stop(); asQueue = null; if (asWas && !narrator.playing) narrator.play(); } });
  if (prefill) setTimeout(() => askAssist(prefill), 450);
}
function renderSugg(sel, list) {
  const items = list.filter((q) => !asAsked.has(q)).slice(0, 3);
  $(sel).innerHTML = items.map((q) => `<button data-q="${esc(q)}"><span>↳</span>${esc(q)}</button>`).join('');
  $(sel).previousElementSibling && ($(sel).previousElementSibling.style.display = items.length ? '' : 'none');
  gsap.fromTo($$(sel + ' button'), { x: -10, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.06, duration: D(0.4) });
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-q]'); if (!b) return;
  if (b.closest('#ts-sugg')) answerTalk(b.dataset.q); else askAssist(b.dataset.q);
});
// Respuesta del guía: Claude por el servidor, en directo. Sin conexión, la respuesta preparada.
const convo = [];
async function guideAnswer(q, { ar = false, onText, onSentence } = {}) {
  try {
    const r = await cloud.ask(q, { stop: narrator.started ? narrator.stop?.id : null, kids: state.company === 'ninos', ar, previous: convo.slice(-3), onText, onSentence });
    if (!r.text) throw new Error('vacía');
    convo.push({ q, a: r.text });
    return { a: r.text, stop: r.stop, live: true };
  } catch (e) {
    console.warn('Guía sin conexión, respuesta preparada:', e.message);
    return { ...findAnswer(q), live: false };
  }
}
// Pinta las palabras que van llegando (la última se espera, puede estar a medias).
function streamWords(el, onNew) {
  let shown = 0;
  return (text, final = false) => {
    const words = text.split(/\s+/).filter(Boolean); const upto = final ? words.length : words.length - 1;
    const fresh = [];
    for (; shown < upto; shown++) { const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = words[shown]; if (shown) el.appendChild(document.createTextNode(' ')); el.appendChild(sp); fresh.push(sp); }
    if (fresh.length && !state.reduce) gsap.fromTo(fresh, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.25, stagger: 0.03 });
    if (fresh.length) onNew && onNew();
  };
}
async function askAssist(q, { spoken = false } = {}) {
  q = q.trim(); if (!q || asBusy) return;
  if (voiceCommand(q)) return;
  asBusy = true; asAsked.add(q);
  const log = $('#as-log'); const chat = $('#as-chat');
  const qb = document.createElement('div'); qb.className = 'qb'; qb.textContent = q; log.appendChild(qb);
  gsap.fromTo(qb, { scale: 0.85, autoAlpha: 0, y: 12 }, { scale: 1, autoAlpha: 1, y: 0, duration: D(0.45), ease: 'back.out(1.8)' });
  const ty = document.createElement('div'); ty.className = 'typing'; ty.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(ty);
  const dots = gsap.to(ty.children, { y: -5, duration: 0.3, stagger: { each: 0.12, repeat: -1, yoyo: true }, ease: 'sine.inOut' });
  gsap.to(chat, { scrollTo: { y: 'max' }, duration: D(0.5) });
  const el = document.createElement('div'); el.className = 'ans';
  const show = () => { if (!el.parentNode) { dots.kill(); ty.remove(); log.appendChild(el); } chat.scrollTop = chat.scrollHeight; };
  const put = streamWords(el, show);
  const useCloudVoice = spoken && narrator.engine === 'cloud';
  const queue = useCloudVoice ? cloud.speakQueue({ rate: state.speed }) : null;
  asQueue = queue;
  const ans = await guideAnswer(q, { onText: (t) => put(t), onSentence: (sn) => queue && queue.push(sn) });
  if (ans.live) put(ans.a, true);
  else { el.textContent = ''; streamWords(el, show)(ans.a, true); queue && queue.stop(); }
  show();
  queue && queue.end();
  const st = ans.stop ? stopById(ans.stop) : null;
  const cite = document.createElement('div'); cite.className = 'cite';
  cite.innerHTML = (st ? `Fuente: <button data-cite="${st.id}">parada ${st.n}, ${esc(st.short)}<svg class="i"><use href="#i-up"/></svg></button>${ans.action === 'map' ? '<button class="act" data-act="map">Ver en el plano</button>' : ''}` : 'Fuera del contenido de la visita')
    + `<span class="src-tag">${ans.live ? 'Guía con IA' : 'Respuesta preparada'}</span>`;
  log.appendChild(cite);
  gsap.fromTo(cite, { autoAlpha: 0 }, { autoAlpha: 1, duration: D(0.4) });
  $('#as-more').textContent = 'También puedes preguntar';
  const pool = [...(curStop().suggest || []), ...STOPS.flatMap((x) => x.suggest || [])];
  renderSugg('#as-sugg', [...new Set(pool)]);
  setTimeout(() => gsap.to(chat, { scrollTo: { y: 'max' }, duration: D(0.6) }), 200);
  asBusy = false;
  if (spoken && !useCloudVoice) narrator.say(ans.a);
}
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-cite]'); if (!c) return;
  const id = c.dataset.cite; closeSheet(); asWas = false;
  setTimeout(() => playStop(id, { dir: 'up' }), 300);
});
function bindForms() {
  const inp = $('#as-input'); const mic = $('#as-mic');
  inp.addEventListener('input', () => mic.classList.toggle('has-text', !!inp.value.trim()));
  $('#as-form').addEventListener('submit', (e) => { e.preventDefault(); const v = inp.value; inp.value = ''; mic.classList.remove('has-text'); inp.blur(); askAssist(v); });
  $('#ts-form').addEventListener('submit', (e) => { e.preventDefault(); const v = $('#ts-input').value; $('#ts-input').value = ''; $('#ts-input').blur(); if (v.trim()) answerTalk(v); });
  $('#ts-input').addEventListener('focus', () => stopTalkRec());
}
let rec = null; let simTimer = null;
function stopRec() { if (rec) { try { rec.abort(); } catch (e) {} rec = null; } clearInterval(simTimer); $('#as-mic').classList.remove('rec'); $('#as-input').closest('.field').classList.remove('listening'); $('#as-input').placeholder = 'Escribe tu pregunta'; }
function assistMic() {
  const inp = $('#as-input'); const mic = $('#as-mic');
  if (inp.value.trim()) { $('#as-form').requestSubmit(); return; }
  if (mic.classList.contains('rec')) { if (rec) { try { rec.stop(); } catch (e) {} } else stopRec(); return; }
  narrator.unlock(); haptic(10);
  mic.classList.add('rec'); inp.closest('.field').classList.add('listening'); inp.placeholder = 'Te escucho…';
  rec = listen({
    onInterim: (f, i) => { inp.value = f + i; },
    onFinal: (q) => { stopRec(); inp.value = ''; if (q) askAssist(q, { spoken: true }); },
    onError: () => { const was = rec; rec = null; if (was) simulateQuestion((t) => { inp.value = t; }, (q) => { stopRec(); inp.value = ''; askAssist(q, { spoken: true }); }); },
  });
  if (!rec) simulateQuestion((t) => { inp.value = t; }, (q) => { stopRec(); inp.value = ''; askAssist(q, { spoken: true }); });
}
// Sin reconocimiento de voz: se escribe sola una pregunta de ejemplo, palabra a palabra.
function simulateQuestion(onPartial, onDone, sel = '#as-sugg') {
  const pool = $$(`${sel} [data-q]`).map((b) => b.dataset.q);
  const q = pool[0] || curStop().suggest[0]; const words = q.split(' '); let i = 0;
  clearInterval(simTimer);
  simTimer = setInterval(() => { i++; onPartial(words.slice(0, i).join(' '), words.slice(i).join(' ')); if (i >= words.length) { clearInterval(simTimer); setTimeout(() => onDone(q), 500); } }, 240);
}

// ---------------------------------------------------------------------------
// Realidad aumentada
// ---------------------------------------------------------------------------
let arMod = null; let ar = null; let arFocus = null; let arReady = false; let arFrom = 'player'; let scanLoops = [];
const loadAR = () => (arMod ||= import('./ar.js'));
function requestMotion() {
  try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') return DeviceOrientationEvent.requestPermission().catch(() => 'denied'); } catch (e) {}
  return Promise.resolve('granted');
}
function openAR(focus) {
  ensureStop(); arFocus = focus || null;
  if (!state.camAsked) { openPerm(); return; }
  enterAR();
}
function openPerm() {
  const s = curStop(); const ids = s.ar.slice(0, 2);
  $('#pv-img').src = s.cover.src; $('#pv-l1').textContent = TERMS[ids[0]]?.name || ''; $('#pv-l2').textContent = TERMS[ids[1]]?.name || '';
  openSheet('sh-perm');
  gsap.fromTo('#sh-perm .pv-mk', { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, stagger: 0.15, duration: D(0.6), ease: 'back.out(2.2)', delay: D(0.4) });
  loadAR().then((m) => m.preloadGuide()).catch(() => {});
}
function permOk() {
  const motion = requestMotion(); // dentro del toque, para iOS
  narrator.unlock();
  state.camAsked = true;
  closeSheet();
  motion.finally(() => enterAR());
}
async function enterAR() {
  let m;
  try { m = await loadAR(); } catch (e) { toast('No se ha podido cargar la realidad aumentada', 'i-info'); return; }
  if (!ar) {
    ar = new m.ARScene({ root: $('#ar'), video: $('#ar-video'), fallback: $('#ar-fallback'), gl: $('#ar-gl'), dots: $('#ar-dots'), marks: $('#ar-marks'), pointer: $('#ar-line'), edge: $('#ar-edge') },
      { term: (id) => TERMS[id], tapMarker: onTapMarker });
    $('#ar').addEventListener('click', (e) => { if (!e.target.closest('.mk, button, .bubble, .talksheet') && ar?.open) ar.setOpen(null); });
  }
  arFrom = cur === 'ar' ? arFrom : cur;
  arReady = false;
  resetARUI();
  go('ar', { dir: 'fade' });
  const mode = await ar.startCamera();
  if (mode === 'photo') toast('Sin cámara: vista simulada con la foto de la sala', 'i-info');
  gsap.fromTo(['#ar-video', '#ar-fallback'], { filter: 'blur(18px) brightness(.45)' }, { filter: 'blur(0px) brightness(1)', duration: D(1.3), ease: 'power2.out', clearProps: 'filter' });
  await ar.begin(curStop());
  runScan();
}
function resetARUI() {
  gsap.set(['#bubble', '#ardock', '#ar-found', '#talksheet'], { autoAlpha: 0 });
  gsap.set('#ar-world', { y: 0, scale: 1 });
  gsap.set('#ar-marks', { autoAlpha: 1 });
  $('#scan-t').textContent = 'Mueve el móvil despacio'; $('#scan-s').textContent = 'para reconocer la sala';
  $('#scan-ring').style.strokeDashoffset = 339.3;
}
async function runScan() {
  const stop = curStop();
  scanLoops.forEach((t) => t.kill()); scanLoops = [];
  gsap.fromTo('#scan', { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: D(0.7), ease: 'expo.out' });
  if (!state.reduce) {
    scanLoops.push(gsap.to('.reticle .c', { scale: 0.86, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' }));
    scanLoops.push(gsap.fromTo('.reticle .phone-ico', { x: -22, rotation: -10 }, { x: 22, rotation: 10, duration: 1.3, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    scanLoops.push(gsap.to('.reticle', { rotation: 4, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
  }
  const ring = $('#scan-ring'); let half = false;
  await ar.scan((p) => {
    ring.style.strokeDashoffset = (339.3 * (1 - p)).toFixed(1);
    if (p > 0.55 && !half) { half = true; $('#scan-t').textContent = 'Casi lo tenemos'; $('#scan-s').textContent = `reconociendo ${lower1(stop.name)}`; }
  });
  if (cur !== 'ar') return;
  scanLoops.forEach((t) => t.kill()); scanLoops = [];
  haptic([12, 40, 12]);
  gsap.to('#scan', { autoAlpha: 0, scale: 0.6, duration: D(0.45), ease: 'power3.in' });
  $('#ar-found span').textContent = `${stop.short} · sala reconocida`;
  gsap.timeline().fromTo('#ar-found', { autoAlpha: 0, y: -14, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: D(0.5), ease: 'back.out(2)' })
    .fromTo('#ar-found svg', { scale: 0, rotation: -45 }, { scale: 1, rotation: 0, duration: D(0.5), ease: 'back.out(3)' }, '<0.1')
    .to('#ar-found', { autoAlpha: 0, y: -10, duration: D(0.35) }, '+=1.4');
  ar.fadeDots();
  const ch = narrator.chapterAt();
  const focus = arFocus || ch?.focus || stop.ar[0];
  ar.revealMarkers(focus, state.reduce);
  try { await ar.revealGuide(state.reduce); } catch (e) { toast('No se ha podido cargar al guía 3D', 'i-info'); }
  if (cur !== 'ar') return;
  arReady = true;
  ar.setPointed(focus, { gesture: false });
  gsap.fromTo('#ardock', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: D(0.6), ease: 'back.out(1.4)', delay: D(0.3) });
  gsap.fromTo('#bubble', { autoAlpha: 0, y: 24, scale: 0.94, transformOrigin: '100% 100%' }, { autoAlpha: 1, y: 0, scale: 1, duration: D(0.6), ease: 'back.out(1.6)', delay: D(0.9) });
  setTimeout(() => { if (cur === 'ar' && arReady && !talking) ar.gesture('Point'); }, state.reduce ? 300 : 4300);
  setTimeout(() => { if (cur === 'ar' && !narrator.playing && !talking) narrator.play(); ar.setGuideState(narrator.playing && narrator.voiceActive ? 'talk' : 'idle'); }, state.reduce ? 200 : 1600);
}
function onTapMarker(id) {
  haptic(6);
  if (ar.open === id) { openTerm(id, { keepPlaying: false }); return; }
  ar.setOpen(id); ar.setPointed(id);
}
function closeAR(to) {
  if (talking) exitTalk(true);
  arReady = false; ar && ar.end();
  scanLoops.forEach((t) => t.kill()); scanLoops = [];
  const dest = to || (arFrom && arFrom !== 'ar' && arFrom !== 'settings' ? arFrom : 'player');
  go(dest, { dir: 'fade' });
}
function arNext() {
  const n = nextStop(); if (!n) { toast('Es la última parada de la visita'); return; }
  arReady = false; arFocus = null;
  gsap.to(['#bubble', '#ardock'], { autoAlpha: 0, y: 20, duration: D(0.3) });
  playStop(n.id, { open: false, autoplay: false });
  ar.reset(n);
  resetARUI();
  runScan();
}
ACT['ar-map'] = () => closeAR('map');

// Hablar con el guía
let talking = false; let talkWas = false; let talkRec = null; let waveTl = null; let talkBusy = false; let talkQueue = null; let talkRelease = null;
function enterTalk() {
  if (!arReady || talking) return;
  talking = true; talkWas = narrator.playing; narrator.pause(); narrator.unlock();
  ar.setGuideState('listen'); ar.hideMarkers(true); ar.setOpen(null);
  gsap.to(['#bubble', '#ardock'], { autoAlpha: 0, y: 16, duration: D(0.3) });
  const H = $('#ar').clientHeight;
  gsap.to('#ar-world', { y: -H * 0.21, scale: 0.84, duration: D(0.8), ease: 'expo.out' });
  $('#ar-sub').textContent = 'El guía te escucha';
  renderSugg('#ts-sugg', curStop().suggest);
  $('#ts-you').innerHTML = '<span>Pregúntale lo que quieras…</span>'; $('#ts-demo').textContent = '';
  gsap.fromTo('#talksheet', { autoAlpha: 1, yPercent: 100 }, { yPercent: 0, duration: D(0.6), ease: 'ios' });
  startTalkListen();
}
function setWave(on) {
  waveTl && waveTl.kill();
  if (on && !state.reduce) waveTl = gsap.to('#wave i', { scaleY: () => gsap.utils.random(0.25, 1), duration: 0.18, repeat: -1, repeatRefresh: true, yoyo: true, stagger: 0.04, ease: 'sine.inOut' });
  else gsap.to('#wave i', { scaleY: 0.3, duration: 0.3 });
}
function startTalkListen() {
  if (talkBusy) return;
  $('#ts-state').textContent = 'Te escucho'; setWave(true); $('#talksheet').classList.remove('answering');
  const sb = $('#ts-stop'); sb.classList.remove('idle'); sb.classList.add('rec');
  ar.setGuideState('listen');
  const you = $('#ts-you');
  const partial = (f, i) => { you.innerHTML = `${esc(f)}<span>${esc(i ? ' ' + i : '')}</span>`; };
  talkRec = listen({
    onInterim: partial,
    onFinal: (q) => { talkRec = null; if (q) answerTalk(q); else idleTalk(); },
    onError: () => { const was = talkRec; talkRec = null; if (was) { $('#ts-demo').textContent = 'Demostración: pregunta de ejemplo'; simulateQuestion(partial, answerTalk, '#ts-sugg'); } },
  });
  if (!talkRec) { $('#ts-demo').textContent = 'Demostración: pregunta de ejemplo'; simulateQuestion(partial, answerTalk, '#ts-sugg'); }
}
function stopTalkRec() { if (talkRec) { try { talkRec.abort(); } catch (e) {} talkRec = null; } clearInterval(simTimer); }
function idleTalk() {
  setWave(false); $('#ts-state').textContent = 'Toca el micro para preguntar';
  const sb = $('#ts-stop'); sb.classList.remove('rec'); sb.classList.add('idle');
  ar.setGuideState('listen');
}
function talkMic() {
  if (talkBusy) { narrator.hush(); return; }
  if ($('#ts-stop').classList.contains('rec')) { if (talkRec) { try { talkRec.stop(); } catch (e) {} } else { clearInterval(simTimer); idleTalk(); } return; }
  haptic(10); startTalkListen();
}
async function answerTalk(q) {
  q = q.trim(); if (!q || !talking) return;
  stopTalkRec(); talkBusy = true; asAsked.add(q);
  setWave(false);
  const sb = $('#ts-stop'); sb.classList.remove('rec'); sb.classList.add('idle');
  $('#ts-demo').textContent = `«${q}»`;
  $('#ts-state').textContent = 'El guía piensa…'; $('#talksheet').classList.add('answering');
  const you = $('#ts-you'); you.innerHTML = '';
  ar.setGuideState('listen');
  const ws = () => $$('.w', you);
  const mark = (k) => ws().forEach((el, j) => el.classList.toggle('on', j <= k));
  const put = streamWords(you, () => { if ($('#ts-state').textContent !== 'El guía responde') { $('#ts-state').textContent = 'El guía responde'; ar.setGuideState('talk'); } });
  const useCloudVoice = narrator.engine === 'cloud';
  let release = null; const spoke = new Promise((res) => { release = res; });
  talkRelease = release;
  const queue = useCloudVoice ? cloud.speakQueue({ rate: state.speed, onWord: mark, onDone: () => release() }) : null;
  talkQueue = queue;
  const ans = await guideAnswer(q, { ar: true, onText: (t) => put(t), onSentence: (sn) => queue && queue.push(sn) });
  if (!talking) { queue && queue.stop(); talkBusy = false; return; }
  if (ans.live) put(ans.a, true); else { you.innerHTML = ''; streamWords(you)(ans.a, true); queue && queue.stop(); }
  const st = ans.stop ? stopById(ans.stop) : null;
  $('#ts-demo').innerHTML = `«${esc(q)}»${st ? ` · <b>De la parada ${st.n}, ${esc(st.short)}</b>` : ''}`;
  $('#ts-state').textContent = 'El guía responde'; ar.setGuideState('talk');
  if (st && st.id === curStop().id) { const f = st.ar.find((id) => norm(ans.a).includes(norm(TERMS[id].name).split(' ')[0])); if (f) ar.setPointed(f); }
  if (queue && ans.live) { queue.end(); await spoke; }
  else await narrator.say(ans.a, { onWord: mark });
  talkQueue = null; talkRelease = null;
  ws().forEach((el) => el.classList.add('on'));
  talkBusy = false;
  if (!talking) return;
  $('#ts-state').textContent = 'Pregúntale otra cosa'; $('#talksheet').classList.remove('answering');
  ar.setGuideState('listen');
  renderSugg('#ts-sugg', [...new Set([...curStop().suggest, ...STOPS.flatMap((x) => x.suggest)])]);
}
function exitTalk(instant = false) {
  if (!talking) return;
  talking = false; talkBusy = false; stopTalkRec(); narrator.hush(); setWave(false); $('#talksheet').classList.remove('answering');
  talkQueue && talkQueue.stop(); talkRelease && talkRelease(); talkQueue = null; talkRelease = null;
  $('#ar-sub').textContent = 'Visita en realidad aumentada';
  gsap.to('#talksheet', { yPercent: 100, duration: instant ? 0 : D(0.45), ease: 'power3.in', onComplete: () => gsap.set('#talksheet', { autoAlpha: 0 }) });
  gsap.to('#ar-world', { y: 0, scale: 1, duration: instant ? 0 : D(0.7), ease: 'expo.out' });
  if (ar && !instant) {
    ar.hideMarkers(false);
    gsap.to(['#bubble', '#ardock'], { autoAlpha: 1, y: 0, duration: D(0.5), delay: D(0.25), stagger: 0.08 });
    if (talkWas) narrator.play();
    ar.setGuideState(narrator.playing && narrator.voiceActive ? 'talk' : 'idle');
  }
}

// ---------------------------------------------------------------------------
// Tutorial: marcas sobre el reproductor real
// ---------------------------------------------------------------------------
const TUT = [
  { sel: () => $('#lyric .s.now .term') || $('#lyric .term'), title: 'Toca las palabras subrayadas', text: 'Verás qué son, con su foto y dónde están en la sala.' },
  { sel: () => $('#p-photo .ar-chip'), title: 'Míralo en realidad aumentada', text: 'Con la cámara verás los puntos sobre la sala y al guía a tu lado.' },
  { sel: () => $('#track'), pad: [10, 34, 10, 26], title: 'Muévete por capítulos', text: 'Cada corte es un capítulo. Arrastra el punto para ir adelante o atrás.' },
  { sel: () => $('#player .ask'), title: 'Pregunta lo que quieras', text: 'Por escrito o con la voz. El guía responde solo sobre la basílica.' },
];
let tutI = 0;
function startTutorial() {
  const stop = narrator.stop && narrator.stop.chapters.some((c) => c.focus) ? narrator.stop : stopById('sacristia');
  if (narrator.stop !== stop) { state.stopId = stop.id; narrator.load(stop, { kids: state.company === 'ninos' }); }
  narrator.pause();
  const i = narrator.sents.findIndex((s) => s.tokens.some((t) => t.term) && narrator.chapters[s.ch].focus);
  if (i >= 0) narrator.seekSentence(i);
  narrator.started = true;
  go('player', { dir: 'up' });
  setTimeout(() => { gsap.set('#tut', { autoAlpha: 1 }); gsap.fromTo('#tut-spot', { autoAlpha: 0 }, { autoAlpha: 1, duration: D(0.4) }); tutStep(0, true); }, state.reduce ? 50 : 750);
}
function tutStep(i, first = false) {
  if (i >= TUT.length) { endTutorial(); return; }
  tutI = i; const s = TUT[i]; const target = s.sel(); if (!target) { tutStep(i + 1); return; }
  const app = $('#app').getBoundingClientRect(); const r = target.getBoundingClientRect();
  const [pt, pr, pb, pl] = s.pad || [6, 8, 6, 8];
  const box = { left: r.left - app.left - pl, top: r.top - app.top - pt, width: r.width + pl + pr, height: r.height + pt + pb };
  gsap.to('#tut-spot', { ...box, duration: first ? 0 : D(0.6), ease: 'expo.inOut' });
  const tip = $('#tut-tip'); $('#tut-k').textContent = `Tutorial · ${i + 1} de ${TUT.length}`;
  $('#tut-title').textContent = s.title; $('#tut-text').textContent = s.text;
  $('#tut-next').textContent = i === TUT.length - 1 ? 'Empezar' : 'Siguiente';
  const below = box.top + box.height / 2 < app.height * 0.45;
  tip.classList.toggle('below', below); tip.classList.toggle('above', !below);
  const th = tip.offsetHeight;
  const top = below ? box.top + box.height + 14 : box.top - th - 14;
  const ax = Math.max(28, Math.min(app.width - 60, box.left + box.width / 2 - 16));
  tip.style.setProperty('--ax', `${ax}px`);
  gsap.fromTo(tip, { autoAlpha: 0, y: below ? -10 : 10 }, { autoAlpha: 1, y: 0, top, duration: D(0.5), delay: first ? 0 : D(0.3), ease: 'back.out(1.6)' });
}
function endTutorial() {
  store.set('tut', true);
  gsap.to('#tut', { autoAlpha: 0, duration: D(0.35) });
  toast('Listo. Toca reproducir cuando quieras', 'i-check');
}

// ---------------------------------------------------------------------------
// QR para abrirlo en el móvil (solo se ve en ordenador)
// ---------------------------------------------------------------------------
function renderQR() {
  try {
    const q = qrcode(0, 'M'); q.addData(location.href.split('#')[0].split('?')[0]); q.make();
    $('#qr').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch (e) { /* sin QR */ }
}

// En segundo plano, se precarga el guía 3D para que la RA abra rápido.
setTimeout(() => { loadAR().then((m) => m.preloadGuide()).catch(() => {}); }, 6000);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (sheetOpen) closeSheet(); else if (talking) exitTalk(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && narrator.playing) narrator.pause(); });

// ---------------------------------------------------------------------------
// Arranque (al final, cuando todo está declarado)
// ---------------------------------------------------------------------------
$('#sprite').insertAdjacentHTML('afterbegin', LOGO_SYMBOLS);
applyPrefs();
buildSurvey();
renderHome();
buildMap();
bindPress();
bindTrack();
bindLyric();
bindSettings();
bindForms();
renderQR();

$$('.screen').forEach((s) => { screens[s.id] = s; });
screens.cover.classList.add('is-on');
document.fonts?.ready.then(intro);
setTimeout(() => { if (!introStarted) intro(); }, 1800);

