// OptimaGuía · prototipo funcional v5 · Basílica de San Juan de Dios
import { STOPS, TERMS, SURVEY, LANGS, KB, FALLBACK, ROUTES, PORTALS } from './data.js?v=6';
import { Narrator } from './narrator.js?v=6';
import { LOGO_SYMBOLS } from './logos.js?v=6';
import * as cloud from './cloud.js?v=6';
import { music } from './music.js?v=6';

gsap.registerPlugin(CustomEase, SplitText, Draggable, InertiaPlugin, ScrollTrigger, ScrollToPlugin);
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
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:«»]/g, ' ').replace(/\s+/g, ' ').trim();
const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
const store = {
  get(k, d) { try { const v = localStorage.getItem('og5:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('og5:' + k, JSON.stringify(v)); } catch (e) {} },
};
const prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const detectLang = () => { const l = (navigator.language || 'es').slice(0, 2).toUpperCase(); return LANGS.some((x) => x.code === l) ? l : 'ES'; };

const state = {
  lang: store.get('lang', 'ES'), route: store.get('route', null), access: store.get('access', null), mode: store.get('mode', null),
  textSize: store.get('textSize', 'grande'), speed: store.get('speed', 1), theme: store.get('theme', 'auto'),
  voice: store.get('voice', true), music: store.get('music', true), musicLevel: store.get('musicLevel', 1),
  subs: store.get('subs', true), bigText: store.get('bigText', false), contrast: store.get('contrast', false), reduce: store.get('reduce', prefersReduce),
  stopId: null, visited: new Set(), camAsked: false, permsAsked: false,
  photos: [], opened: new Set(), asked: [], startedAt: null, stopSecs: {}, rating: null,
};
const CAPTURE = new URLSearchParams(location.search).has('captura'); // capturas para desarrollo: RA con la foto de la sala
if (CAPTURE) { window.__ogNoCam = true; document.documentElement.classList.add('capture'); }
const D = (d) => (state.reduce ? 0.001 : d);
const RT = () => ROUTES[state.route || 'historica'];
const stopById = (id) => STOPS.find((s) => s.id === id);
const curStop = () => stopById(state.stopId) || STOPS[0];
const nextStop = (s = curStop()) => STOPS[STOPS.findIndex((x) => x.id === s.id) + 1] || null;
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const floorTxt = (f) => `Planta ${f}`;
const isBlind = () => state.access === 'visual';
const isAuto = () => isBlind() || state.mode === 'auto';
const usesAR = () => !isBlind() && (state.mode === 'ar' || state.mode === 'auto');
const voiceAsk = () => isAuto(); // modos sin pantalla: se pregunta con la voz, micrófono abierto
const info = (id) => (PORTALS[id] ? { label: PORTALS[id].label, portal: true } : { label: TERMS[id]?.name || id });

// Pista de la sala y pista ampliada: dos motores, una sola voz a la vez.
const narrator = new Narrator(); narrator.voiceOn = state.voice; narrator.rate = state.speed;
const detail = new Narrator(); detail.rate = state.speed;
const dt = { item: null, pausedMain: false, queued: null, afterEnd: null };

// La música baja sola mientras suena cualquier voz.
cloud.audio.addEventListener('playing', () => music.voice(true));
cloud.audio.addEventListener('pause', () => music.voice(false));
cloud.audio.addEventListener('ended', () => music.voice(false));
narrator.on('voice', (on) => music.voice(on)); detail.on('voice', (on) => music.voice(on));
let musicIdle = null;
function musicFollow() {
  clearTimeout(musicIdle);
  if (narrator.playing || detail.playing) { music.play(); return; }
  musicIdle = setTimeout(() => { if (!narrator.playing && !detail.playing && !speaking) music.stop(); }, 8000);
}

// ---------------------------------------------------------------------------
// Navegación
// ---------------------------------------------------------------------------
const screens = {}; let cur = 'cover'; let prevScreen = null;
const onEnter = {}; const onLeave = {};
function go(id, { dir = 'push' } = {}) {
  if (id === cur) { onEnter[id] && onEnter[id]('same'); return; }
  const next = screens[id]; const prev = screens[cur];
  onLeave[cur] && onLeave[cur]();
  prevScreen = cur; cur = id;
  next.classList.add('is-on');
  gsap.killTweensOf([next, prev]);
  const done = () => { prev.classList.remove('is-on'); gsap.set([prev, next], { clearProps: 'transform,opacity,visibility,zIndex,borderRadius' }); };
  const tl = gsap.timeline({ defaults: { duration: D(0.62), ease: 'soft' }, onComplete: done });
  if (dir === 'push') { gsap.set(next, { zIndex: 3 }); gsap.set(prev, { zIndex: 2 }); tl.fromTo(next, { xPercent: 100 }, { xPercent: 0 }).fromTo(prev, { xPercent: 0, opacity: 1 }, { xPercent: -28, opacity: 0.55 }, 0); }
  else if (dir === 'pop') { gsap.set(next, { zIndex: 2 }); gsap.set(prev, { zIndex: 3 }); tl.fromTo(prev, { xPercent: 0 }, { xPercent: 100 }).fromTo(next, { xPercent: -28, opacity: 0.55 }, { xPercent: 0, opacity: 1 }, 0); }
  else if (dir === 'up') { gsap.set(next, { zIndex: 3 }); gsap.set(prev, { zIndex: 2 }); tl.fromTo(next, { yPercent: 100, borderRadius: 40 }, { yPercent: 0, borderRadius: 0, duration: D(0.7), ease: 'ios' }).fromTo(prev, { scale: 1, opacity: 1 }, { scale: 0.93, opacity: 0.5, duration: D(0.7), ease: 'ios' }, 0); }
  else if (dir === 'down') { gsap.set(next, { zIndex: 2 }); gsap.set(prev, { zIndex: 3 }); tl.fromTo(prev, { yPercent: 0 }, { yPercent: 100, duration: D(0.6), ease: 'ios' }).fromTo(next, { scale: 0.93, opacity: 0.5 }, { scale: 1, opacity: 1, duration: D(0.6), ease: 'ios' }, 0); }
  else { gsap.set(next, { zIndex: 3 }); gsap.set(prev, { zIndex: 2 }); tl.fromTo(next, { autoAlpha: 0 }, { autoAlpha: 1, duration: D(0.45), ease: 'power2.out' }); }
  $('#app').classList.toggle('on-map', id === 'map');
  onEnter[id] && onEnter[id](dir);
  updateMini();
}
const backToGuide = () => { if (narrator.started && narrator.stop) go(isBlind() ? 'voice' : 'player', { dir: 'pop' }); else go('home', { dir: 'pop' }); };

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------
const ACT = {
  start: () => { unlockAll(); showStep(0, 1, true); go('survey'); },
  lang: () => openLang(),
  'survey-back': () => { const seq = steps(); const i = seq.indexOf(svStep); if (i <= 0) go(svFrom === 'home' ? 'home' : 'cover', { dir: 'pop' }); else showStep(seq[i - 1], -1); },
  'survey-skip': () => { state.route ||= 'historica'; state.access ||= 'none'; state.mode ||= 'ar'; saveProfile(); showStep('summary', 1); },
  'survey-next': () => { const seq = steps(); const i = seq.indexOf(svStep); if (svStep === 'summary') beginVisit(); else showStep(seq[i + 1], 1); },
  'sv-home': () => { saveProfile(); go('home', { dir: 'push' }); },
  'home-go': () => { unlockAll(); if (!narrator.started) beginVisit(); else if (isBlind()) go('voice', { dir: 'up' }); else { go('player', { dir: 'up' }); if (!narrator.playing && !detail.playing) playMain(); } },
  top: () => gsap.to('#home-scroll', { scrollTo: { y: 0 }, duration: D(0.8), ease: 'power3.inOut' }),
  map: () => { if (sheetOpen) closeSheet(); go('map', { dir: 'push' }); },
  'back-guide': () => backToGuide(),
  home: () => go('home', { dir: cur === 'player' ? 'down' : 'pop' }),
  stops: () => openStops(),
  guide: () => openGuide(),
  tutorial: () => startTutorial(),
  settings: () => { if (sheetOpen) closeSheet(); go('settings', { dir: cur === 'ar' ? 'fade' : 'push' }); },
  'close-settings': () => go(prevScreen && !['settings', 'ar', 'survey', 'cover'].includes(prevScreen) ? prevScreen : 'home', { dir: 'pop' }),
  'redo-survey': () => { svFrom = 'home'; showStep(steps()[1] ?? 0, 1, true); go('survey'); },
  finish: () => openRecap(),
  toggle: () => { unlockAll(); if (detail.playing) { detail.pause(); return; } if (!narrator.stop) ensureStop(); narrator.playing ? narrator.pause() : playMain(); haptic(); },
  back15: (el) => { narrator.skip(-15); spin(el, -1); },
  fwd15: (el) => { narrator.skip(15); spin(el, 1); },
  next: () => { const n = nextStop(); if (!n) { openRecap(); return; } if (isAuto()) startWalk(n); else playStop(n.id, { open: false }); },
  speed: (el) => { const seq = [1, 1.25, 1.5, 0.75]; setSpeed(seq[(seq.indexOf(state.speed) + 1) % seq.length]); gsap.fromTo(el, { scale: 0.7 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }); },
  'photo-term': () => { const f = narrator.chapterAt()?.focus; if (!f) return; if (PORTALS[f]) openAR(f); else openTerm(f); },
  ar: () => openAR(narrator.chapterAt()?.focus),
  'back-now': () => { userScrollAt = 0; followNow(true); },
  unqueue: () => { if (dt.item && detail.playing) { stopDetail(true); } else { dt.queued = null; } renderQueue(); },
  'zoom-in': () => mapZoomAt(null, MAPV.s * 1.6),
  'zoom-out': () => mapZoomAt(null, MAPV.s / 1.6),
  center: () => centerMap(),
  'close-sheet': () => closeSheet(),
  'dt-toggle': () => detailButton(),
  'dt-now': () => { $('#dt-choice').hidden = true; playDetail(termItem(termCur)); },
  'dt-later': () => { $('#dt-choice').hidden = true; dt.queued = termItem(termCur); renderQueue(); renderDetailRow(); toast(`Sonará al terminar la pista de la sala`, 'i-queue'); },
  'v-spin': (el) => { const on = !el.classList.contains('on'); el.classList.toggle('on', on); viewer && viewer.spin(on); },
  'v-in': () => viewer && viewer.zoom(0.7),
  'v-out': () => viewer && viewer.zoom(1.4),
  'tc-ar': () => { const id = termCur; closeSheet(); if (cur === 'ar') ar?.setPointed(id); else setTimeout(() => openAR(id), 250); },
  'tc-ask': () => { const t = TERMS[termCur]; closeSheet(); setTimeout(() => openGuide(askFor(t)), 300); },
  'perm-ok': () => permOk(),
  'perm-no': () => permNo(),
  'ar-close': () => closeAR(),
  'ar-map': () => closeAR('map'),
  shot: () => takePhoto(),
  photos: () => openPhotos(),
  'portal-close': () => closePortalUI(),
  'voice-exit': () => { voiceLoop.stop(); go('home', { dir: 'down' }); },
  'vc-repeat': () => { narrator.seekSentence(narrator.idx); if (!narrator.playing) playMain(); },
  arrive: () => arrive(),
  'walk-map': () => { hideWalk(false); go('map', { dir: 'push' }); },
  'recap-close': () => { stopStory(); go(narrator.started ? 'home' : 'cover', { dir: 'down' }); },
  'rc-prev': () => storyGo(storyI - 1),
  'rc-next': () => storyGo(storyI + 1),
  'recap-open': () => openRecap(),
  'to-rate': () => { stopStory(); go('rate', { dir: 'push' }); },
  'rate-back': () => go('recap', { dir: 'pop' }),
  'rate-skip': () => go('thanks', { dir: 'push' }),
  'rate-send': () => sendRating(),
  share: () => shareRecap('more'), 'share-ig': () => shareRecap('ig'), 'share-wa': () => shareRecap('wa'), 'share-save': () => shareRecap('save'),
  'tut-next': () => tutStep(tutI + 1),
  'tut-skip': () => endTutorial(),
  'go-next': () => ACT.next(),
  'map-play': () => { const here = narrator.started ? narrator.stop : null; if (here && here.id === mapSel) backToGuide(); else playStop(mapSel, { dir: 'up' }); },
  reset: () => { try { Object.keys(localStorage).filter((k) => k.startsWith('og5:')).forEach((k) => localStorage.removeItem(k)); } catch (e) {} location.reload(); },
};
document.addEventListener('click', (e) => {
  const term = e.target.closest('.term[data-term]');
  if (term && !e.target.closest('#sh-term')) { e.stopPropagation(); openTerm(term.dataset.term); return; }
  const a = e.target.closest('[data-act]');
  if (a && ACT[a.dataset.act]) ACT[a.dataset.act](a, e);
});
$('#mini').addEventListener('click', (e) => { if (e.target.closest('[data-act]')) return; backToGuide(); });
function unlockAll() { narrator.unlock(); music.unlock(); }

function bindPress() {
  const SEL = '.btn, .ib, .glyph, .play, .tile, .ar-chip, .ask, .askbar, .mini-pp, .pp, .ardock .d, .shutter, .talkbtn, .center, .tc-x, .stoprow, .rail-card, .logo, .sname, .fchips button, .zoom button, .sugg button, .mini, .optcard, .pill, .fab, .finish, .score button, .chips button, .dt-play, .tc-tools button, .vc-play, .vc-row button, .share-row button';
  let el = null;
  document.addEventListener('pointerdown', (e) => { el = e.target.closest(SEL); if (!el || state.reduce) return; gsap.to(el, { scale: el.matches('.mini, .optcard, .rail-card, .hm-hero') ? 0.98 : 0.95, duration: 0.14, ease: 'power2.out', overwrite: 'auto' }); });
  const up = () => { if (!el) return; gsap.to(el, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }); el = null; };
  document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
}
function spin(el, d) { const s = el.querySelector('svg'); gsap.fromTo(s, { rotation: 0 }, { rotation: d * -360, duration: D(0.6), ease: 'power3.out', transformOrigin: '50% 50%' }); }

// ---------------------------------------------------------------------------
// Preferencias
// ---------------------------------------------------------------------------
function applyPrefs() {
  const r = document.documentElement;
  if (state.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', state.theme);
  r.setAttribute('data-size', state.textSize);
  r.toggleAttribute('data-contrast', false); if (state.contrast) r.setAttribute('data-contrast', 'on');
  r.toggleAttribute('data-bigtext', false); if (state.bigText || state.access === 'auditiva') r.setAttribute('data-bigtext', 'on');
  r.classList.toggle('reduce', state.reduce);
  const app = $('#app'); app.classList.toggle('route-arte', state.route === 'arte'); app.classList.toggle('route-historica', state.route !== 'arte');
  $('#ar').classList.toggle('no-subs', !state.subs && state.access !== 'auditiva');
  $$('.lang-code').forEach((el) => { el.textContent = state.lang; });
  const L = LANGS.find((l) => l.code === state.lang) || LANGS[0];
  $$('.lang-name').forEach((el) => { el.textContent = L.name; });
  $('#speed').textContent = speedLabel(state.speed);
  music.setEnabled(state.music); music.setLevel(state.musicLevel); music.setRoute(state.route || 'historica');
  const rt = RT();
  $('#p-ask').textContent = rt.ask; $('#hm-ask-t').textContent = rt.ask;
  $('#p-narra').innerHTML = `<span class="av-s"></span><span>Narra <b>${esc(rt.who)}</b>${state.route === 'arte' ? '' : ', en primera persona'}</span>`;
  $('#subs-who').textContent = rt.who;
  $('#hm-guide-t').textContent = rt.who; $('#hm-guide-s').textContent = state.route === 'arte' ? 'Tu guía en la app: pregúntale' : 'La escultura cobra vida y te responde';
}
const speedLabel = (v) => `${String(v).replace('.', ',')}×`;
function setSpeed(v) { state.speed = v; store.set('speed', v); narrator.setRate(v); detail.setRate(v); $('#speed').textContent = speedLabel(v); syncSegm('speed', String(v)); }

let toastTl = null;
function toast(msg, icon = 'i-info') {
  const t = $('#toast'); t.querySelector('span').textContent = msg; t.querySelector('use').setAttribute('href', '#' + icon);
  toastTl && toastTl.kill();
  toastTl = gsap.timeline().fromTo(t, { autoAlpha: 0, y: -18, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: D(0.5), ease: 'back.out(2)' }).to(t, { autoAlpha: 0, y: -12, duration: D(0.35), ease: 'power2.in' }, '+=2.6');
}

// ---------------------------------------------------------------------------
// Carga y bienvenida
// ---------------------------------------------------------------------------
function preload() {
  const items = ['sjd-8', 'sjd-1', 'sjd-12', 'sjd-13', 'sjd-14', 'sjd-15'].map((f) => `assets/img/${f}.jpg`).concat(['assets/img/avatar-sjd.jpg']);
  let done = 0; const prog = { p: 0 };
  const bump = () => { done++; gsap.to(prog, { p: done / (items.length + 1), duration: 0.4, onUpdate: () => gsap.set('#sp-prog', { scaleX: prog.p }) }); };
  const ps = items.map((src) => new Promise((res) => { const i = new Image(); i.onload = i.onerror = () => { bump(); res(); }; i.src = src; }));
  ps.push((document.fonts?.ready || Promise.resolve()).then(bump));
  return Promise.race([Promise.all(ps), wait(5000)]).then(() => gsap.to(prog, { p: 1, duration: 0.3, onUpdate: () => gsap.set('#sp-prog', { scaleX: prog.p }) }));
}
async function intro() {
  if (state.reduce) { await preload(); gsap.set('#splash', { autoAlpha: 0 }); return; }
  gsap.set(['.og-lock', '.sp-line', '.sp-for', '.sjd-lock'], { autoAlpha: 0 });
  const tl = gsap.timeline();
  // OPTIMA sube, la barra cae sobre la O y GUIA entra detrás
  tl.set('#splash .og-lock', { autoAlpha: 1 }, 0)
    .fromTo('#splash .og-optima', { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out' }, 0)
    .fromTo('#splash .og-bar', { y: -60, scaleX: 0.2, autoAlpha: 0, transformOrigin: '50% 50%' }, { y: 0, scaleX: 1, autoAlpha: 1, duration: 0.75, ease: 'back.out(2.2)' }, 0.3)
    .fromTo('#splash .og-guia', { x: -24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out' }, 0.45)
    .fromTo('#splash .sp-line', { scaleY: 0, autoAlpha: 1 }, { scaleY: 1, duration: 0.6, ease: 'power2.inOut' }, 0.6)
    .to('#splash .sp-for', { autoAlpha: 1, duration: 0.5 }, 0.95)
    .fromTo('#splash .sjd-lock', { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 1.05);
  await Promise.all([preload(), wait(2100)]);
  const split = SplitText.create('.cv-title', { type: 'words', mask: 'words' });
  gsap.timeline()
    .to('#splash .sp-in', { y: -30, autoAlpha: 0, duration: 0.5, ease: 'power2.in' })
    .to('#splash', { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '-=0.15')
    .set('#splash', { display: 'none' })
    .from('.cv-photo img', { scale: 1.25, duration: 2.4, ease: 'expo.out' }, '-=0.8')
    .from('.cv-top > *', { y: -24, autoAlpha: 0, stagger: 0.08, duration: 0.7 }, '-=2.1')
    .from('.cv-card', { yPercent: 40, autoAlpha: 0, duration: 1, ease: 'expo.out' }, '-=2')
    .from('.cv-card .tag-over', { y: 10, autoAlpha: 0, duration: 0.5 }, '-=1.6')
    .from(split.words, { yPercent: 110, duration: 0.8, stagger: 0.05, ease: 'expo.out' }, '-=1.5')
    .from(['.cv-sub', '.stats div', '.cv-card .btn', '.made-by'], { y: 14, autoAlpha: 0, stagger: 0.06, duration: 0.6 }, '-=1.2')
    .add(() => { gsap.to('.cv-photo img', { scale: 1.07, duration: 18, ease: 'sine.inOut', yoyo: true, repeat: -1 }); });
}

// ---------------------------------------------------------------------------
// Cuestionario: tocar selecciona, «Continuar» avanza
// ---------------------------------------------------------------------------
let svStep = 0; let svFrom = 'cover'; const svSplits = {};
const steps = () => SURVEY.map((q, i) => (q.skipIf && q.skipIf(state) ? null : i)).filter((i) => i !== null).concat(['summary']);
function saveProfile() { ['route', 'access', 'mode'].forEach((k) => store.set(k, state[k])); applyPrefs(); }
function buildSurvey() {
  $('#sv-stage').innerHTML = SURVEY.map((q, i) => {
    let body;
    if (q.lang) body = `<div class="rows">${LANGS.map((l) => `<button class="row lang ${l.code === state.lang ? 'on' : ''}" data-v="${l.code}"><span class="tintbg"></span><span class="t">${l.name}<small>${l.code === detectLang() ? 'Idioma de tu móvil' : l.sub}</small></span><span class="radio"></span></button>`).join('')}</div>`;
    else if (q.cards) body = `<div class="optcards">${q.options.map((o) => `<button class="optcard" data-v="${o.v}"><img src="${o.photo.src}" alt="" style="object-position:${o.photo.pos}"><span class="oc-t"><small>${o.k}</small><b>${o.t}</b><span>${o.s}</span></span><span class="ck"><svg class="i"><use href="#i-check"/></svg></span></button>`).join('')}</div>`;
    else body = `<div class="rows">${q.options.map((o) => `<button class="row opt" data-v="${o.v}"><span class="tintbg"></span><span class="oi"><svg class="i"><use href="#${o.icon}"/></svg></span><span class="t">${o.t}${o.badge ? `<span class="badge">${o.badge}</span>` : ''}${o.s ? `<small>${o.s}</small>` : ''}</span><span class="radio"></span></button>`).join('')}</div>`;
    return `<div class="sv-panel" data-i="${i}" data-key="${q.key}"><div class="q-ico"><svg class="i"><use href="#${q.icon}"/></svg></div><h2>${q.title}</h2>${body}</div>`;
  }).join('') + '<div class="sv-panel summary" data-i="summary"></div>';
  $$('.sv-panel:not(.summary)').forEach((p) => { svSplits[p.dataset.i] = SplitText.create(p.querySelector('h2'), { type: 'words', mask: 'words' }); });
  $('#sv-stage').addEventListener('click', (e) => {
    const chg = e.target.closest('[data-step]'); if (chg) { showStep(+chg.dataset.step, -1); return; }
    const row = e.target.closest('.row[data-v], .optcard'); if (!row) return;
    const panel = row.closest('.sv-panel'); const q = SURVEY[+panel.dataset.i]; const v = row.dataset.v;
    if (q.lang) setLang(v, { silent: true }); else state[q.key] = v;
    $$('.row, .optcard', panel).forEach((r) => {
      const on = r === row; const was = r.classList.contains('on'); r.classList.toggle('on', on);
      if (on && !was && r.classList.contains('row')) {
        gsap.fromTo(r.querySelector('.tintbg'), { scaleX: 0 }, { scaleX: 1, duration: D(0.5), clearProps: 'transform' });
        gsap.fromTo(r.querySelector('.radio'), { '--r': 0 }, { '--r': 1, duration: D(0.45), ease: 'back.out(3)', onComplete() { r.querySelector('.radio').style.removeProperty('--r'); } });
        r.querySelector('.oi') && gsap.fromTo(r.querySelector('.oi'), { scale: 0.8 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      }
      if (on && !was && r.classList.contains('optcard')) gsap.fromTo(r.querySelector('.ck'), { scale: 0.6 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    });
    haptic(6); updateNextBtn();
  });
}
function updateNextBtn() {
  const b = $('#sv-next');
  if (svStep === 'summary') { b.disabled = false; b.textContent = 'Empezar la visita'; return; }
  const q = SURVEY[svStep]; b.disabled = !q.lang && !state[q.key]; b.textContent = 'Continuar';
  if (!b.disabled) gsap.fromTo(b, { scale: 0.97 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
}
function renderSummary() {
  const rt = RT(); const L = LANGS.find((l) => l.code === state.lang) || LANGS[0];
  const accessTxt = { none: 'Sin adaptaciones', visual: 'Por voz, sin mirar la pantalla', auditiva: 'Todo en texto, en grande' }[state.access] || 'Sin adaptaciones';
  const modeTxt = isBlind() ? 'Automática: cada pista suena al llegar' : { ar: 'Con realidad aumentada', auto: 'Automática, con realidad aumentada', audio: 'Solo audio y texto' }[state.mode] || 'Con realidad aumentada';
  const perms = [usesAR() && 'cámara', isAuto() && 'ubicación', voiceAsk() && 'micrófono'].filter(Boolean);
  const i = (k) => SURVEY.findIndex((q) => q.key === k);
  $('.sv-panel.summary').innerHTML = `<div class="sum-hero"><img src="${rt.photo.src}" alt="" style="object-position:${rt.photo.pos}"><span>${esc(rt.long)}</span></div>
    <h2>Tu visita está lista</h2>
    <div class="rows">
      <div class="row"><span class="oi"><svg class="i"><use href="#i-globe"/></svg></span><span class="t">${L.name}<small>Idioma</small></span><button class="chg" data-step="${i('lang')}">Cambiar</button></div>
      <div class="row"><span class="oi"><svg class="i"><use href="#i-route"/></svg></span><span class="t">${esc(rt.name)}<small>${esc(rt.tagline)}</small></span><button class="chg" data-step="${i('route')}">Cambiar</button></div>
      <div class="row"><span class="oi"><svg class="i"><use href="#i-access"/></svg></span><span class="t">${accessTxt}<small>Accesibilidad</small></span><button class="chg" data-step="${i('access')}">Cambiar</button></div>
      <div class="row"><span class="oi"><svg class="i"><use href="#${usesAR() ? 'i-ar' : 'i-headph'}"/></svg></span><span class="t">${modeTxt}<small>Cómo la recorres</small></span>${isBlind() ? '' : `<button class="chg" data-step="${i('mode')}">Cambiar</button>`}</div>
      <div class="row"><span class="oi"><svg class="i"><use href="#${voiceAsk() ? 'i-mic' : 'i-chat'}"/></svg></span><span class="t">${voiceAsk() ? 'Por voz, con el micrófono abierto' : 'Por escrito'}<small>Preguntas ${esc(rt.toWho)}</small></span></div>
    </div>
    ${perms.length ? `<p class="perm-note"><svg class="i"><use href="#i-lock"/></svg><span>Te pediremos permiso para usar ${perms.join(', ').replace(/, ([^,]*)$/, ' y $1')}. No se graba ni se guarda nada.</span></p>` : ''}
    <div style="text-align:center;margin-top:6px"><button class="btn text" data-act="sv-home">Ver el inicio primero</button></div>`;
}
function showStep(i, dir = 1, instant = false) {
  const seq = steps(); if (!seq.includes(i)) i = seq[0];
  const panels = $$('.sv-panel'); const pick = (k) => panels.find((p) => p.dataset.i === String(k));
  const prev = pick(svStep); const next = pick(i); const changed = prev !== next;
  if (i === 'summary') { saveProfile(); renderSummary(); }
  next.classList.add('is-on');
  const qn = seq.length - 1; const pos = seq.indexOf(i);
  $('#sv-count').textContent = i === 'summary' ? 'Resumen' : `Paso ${pos + 1} de ${qn}`;
  $('.steps .skip').style.visibility = i === 'summary' ? 'hidden' : '';
  gsap.to('#sv-prog', { scaleX: (pos + 1) / seq.length, duration: D(0.6) });
  if (changed && !instant) gsap.to(prev, { x: -44 * dir, autoAlpha: 0, duration: D(0.32), ease: 'power2.in', onComplete: () => { prev.classList.remove('is-on'); gsap.set(prev, { clearProps: 'all' }); } });
  else if (changed) { prev.classList.remove('is-on'); gsap.set(prev, { clearProps: 'all' }); }
  svStep = i; updateNextBtn();
  const tl = gsap.timeline({ delay: D(instant ? 0.25 : 0.22) }).fromTo(next, { x: 44 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: D(0.55) });
  if (i === 'summary') tl.fromTo(next.children, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: D(0.5), stagger: 0.06 }, 0.05);
  else {
    tl.fromTo(next.querySelector('.q-ico'), { scale: 0.4, rotation: -20, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: D(0.7), ease: 'back.out(2.2)' }, 0.02)
      .fromTo(svSplits[i].words, { yPercent: 105 }, { yPercent: 0, duration: D(0.6), stagger: 0.05, ease: 'expo.out' }, 0.06)
      .fromTo($$('.row, .optcard', next), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: D(0.5), stagger: 0.05 }, 0.14);
  }
  // marca lo ya elegido
  if (i !== 'summary') { const q = SURVEY[i]; const v = q.lang ? state.lang : state[q.key]; $$('.row[data-v], .optcard', next).forEach((r) => r.classList.toggle('on', r.dataset.v === v)); }
}

// ---------------------------------------------------------------------------
// Empezar la visita (permisos según el perfil)
// ---------------------------------------------------------------------------
function beginVisit() {
  unlockAll(); saveProfile(); renderHome();
  const needs = [usesAR() && 'camera', isAuto() && 'location', voiceAsk() && 'mic'].filter(Boolean);
  if (needs.length && !state.permsAsked) { openPerm(needs, startFirst); return; }
  startFirst();
}
function startFirst() {
  state.startedAt ||= Date.now();
  const s = narrator.stop && narrator.started ? curStop() : STOPS[0];
  if (isBlind()) { playStop(s.id, { open: false }); go('voice', { dir: 'up' }); voiceLoop.start(); return; }
  if (isAuto() && usesAR() && state.camAsked) { playStop(s.id, { open: false, autoplay: false }); enterAR({ autoplay: true }); if (voiceAsk()) voiceLoop.start(); return; }
  playStop(s.id, { dir: 'up' });
  if (voiceAsk()) voiceLoop.start();
}

// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------
function renderHome() {
  const rt = RT(); const s = narrator.started && narrator.stop ? narrator.stop : null; const target = s || STOPS[0];
  const heard = STOPS.filter((x) => state.visited.has(x.id)).length;
  $('#hm-route').innerHTML = `<svg class="i"><use href="#i-route"/></svg>${esc(rt.name)} · ${esc(lower1(rt.tagline))}`;
  $('#hm-hero-img').src = target.cover.src; $('#hm-hero-img').style.objectPosition = target.cover.pos;
  $('#hm-k').textContent = heard >= STOPS.length ? 'Has recorrido' : s ? 'Sigue en' : 'Empieza en';
  $('#hm-title').textContent = heard >= STOPS.length ? 'Toda la basílica' : target.name;
  $('#hm-meta').textContent = `${heard} de ${STOPS.length} espacios · ${floorTxt(target.floor)}`;
  gsap.to('#hm-prog', { scaleX: heard / STOPS.length, duration: D(0.8) });
  const chips = [];
  if (isBlind()) chips.push(['i-mic', 'Por voz']); else if (state.mode === 'auto') chips.push(['i-auto', 'Automática']);
  if (usesAR()) chips.push(['i-ar', 'Realidad aumentada']); else if (!isBlind()) chips.push(['i-headph', 'Solo audio']);
  if (state.access === 'auditiva') chips.push(['i-text', 'Texto en grande']);
  chips.push(['i-globe', (LANGS.find((l) => l.code === state.lang) || LANGS[0]).name]);
  $('#hm-modes').innerHTML = chips.map(([ic, t]) => `<span class="chip"><svg class="i"><use href="#${ic}"/></svg>${t}</span>`).join('');
  $('#hm-rail').innerHTML = STOPS.map((x) => {
    const here = s && s.id === x.id; const done = state.visited.has(x.id);
    return `<button class="rail-card ${here ? 'cur' : ''}" data-stop="${x.id}"><span class="rc-ph"><img src="${x.cover.src}" alt="" style="object-position:${x.cover.pos};transform:scale(${Math.min(x.cover.zoom, 1.6)});transform-origin:${x.cover.pos}"><span class="rc-n tnum">${x.n}</span>${done ? '<span class="rc-st"><svg class="i"><use href="#i-check"/></svg></span>' : ''}</span><b>${esc(x.name)}</b><small>${here ? 'Sonando ahora' : `${floorTxt(x.floor)} · ${x.min} min`}</small></button>`;
  }).join('');
}
document.addEventListener('click', (e) => { const r = e.target.closest('[data-stop]'); if (!r) return; const id = r.dataset.stop; const was = sheetOpen; if (was) closeSheet(); setTimeout(() => { unlockAll(); state.startedAt ||= Date.now(); playStop(id, { dir: cur === 'home' ? 'push' : 'fade' }); }, was ? 220 : 0); });
let homeIntroDone = false;
onEnter.home = () => {
  renderHome();
  const rail = $('#hm-rail .rail-card.cur'); if (rail) $('#hm-rail').scrollTo({ left: rail.offsetLeft - 20, behavior: 'smooth' });
  if (homeIntroDone || state.reduce) return; homeIntroDone = true;
  gsap.timeline({ delay: 0.15 })
    .from('#hm-hero', { y: 24, autoAlpha: 0, duration: 0.8 })
    .from('#hm-hero-img', { scale: 1.18, duration: 1.8, ease: 'expo.out' }, 0)
    .from('#hm-hero .fab', { scale: 0, duration: 0.7, ease: 'back.out(2.4)' }, 0.4)
    .from('#hm-modes .chip', { y: 10, autoAlpha: 0, stagger: 0.05, duration: 0.5 }, 0.35)
    .from('#hm-rail .rail-card', { x: 60, autoAlpha: 0, stagger: 0.05, duration: 0.7 }, 0.45)
    .from('.hm-grid .tile', { y: 20, autoAlpha: 0, stagger: 0.06, duration: 0.6 }, 0.6)
    .from('#hm-ask', { y: 80, duration: 0.8, ease: 'back.out(1.4)' }, 0.5);
};
function drawPlanIll() {
  const here = narrator.started ? curStop() : STOPS[0];
  $('#plan-ill').innerHTML = `<svg viewBox="-14 -40 400 560" preserveAspectRatio="xMidYMid meet"><path class="wall" style="stroke-width:14" d="${PLAN[0].walls[0]}"/>${here.floor === 0 ? `<circle cx="${here.map.x}" cy="${here.map.y}" r="34" fill="var(--monument)"/>` : ''}</svg>`;
}

// ---------------------------------------------------------------------------
// Reproductor
// ---------------------------------------------------------------------------
let lyricEls = []; let curWords = []; let chapBars = []; let curSegBars = []; let trackW = 0; let lastSec = -1; let draggingKnob = false;
const knobX = gsap.quickSetter('#knob', 'x', 'px');
function ensureStop() { if (!narrator.stop) { const s = curStop(); state.stopId = s.id; narrator.load(s, { route: state.route || 'historica' }); } }
function playMain() {
  if (detail.started && (detail.playing || detail.t < detail.total)) stopDetail(true);
  if (!narrator.stop) ensureStop();
  narrator.play(); musicFollow();
}
function playStop(id, { open = true, autoplay = true, dir = 'push' } = {}) {
  const prev = narrator.stop;
  if (prev && prev.id !== id && narrator.t / narrator.total > 0.5) { state.visited.add(prev.id); }
  if (detail.playing) stopDetail(true);
  dt.queued = null; renderQueue();
  state.stopId = id; state.startedAt ||= Date.now(); stopClock = Date.now();
  narrator.load(stopById(id), { route: state.route || 'historica' });
  if (open && cur !== 'player') go('player', { dir });
  if (autoplay) { unlockAll(); playMain(); }
  renderHome(); drawPlanIll();
}
let stopClock = Date.now();
function sentenceHTML(s) {
  const tk = s.tokens; let html = ''; let i = 0;
  while (i < tk.length) {
    if (tk[i].term) {
      const id = tk[i].term; const inner = []; let trail = '';
      while (i < tk.length && tk[i].term === id) { let w = tk[i].w; if (i + 1 >= tk.length || tk[i + 1].term !== id) { const m = w.match(/^(.*?)([,.;:!?»)]+)$/); if (m) { w = m[1]; trail = m[2]; } } inner.push(`<span class="w">${esc(w)}</span>`); i++; }
      html += `<button class="term" data-term="${id}">${inner.join(' ')}</button>${trail} `;
    } else { html += `<span class="w">${esc(tk[i].w)}</span> `; i++; }
  }
  return html.trim();
}
const wordsHTML = (text) => text.split(/\s+/).filter(Boolean).map((w) => `<span class="w">${esc(w)}</span>`).join(' ');
narrator.on('load', (stop) => {
  const idx = STOPS.findIndex((x) => x.id === stop.id);
  $('#p-name').textContent = stop.name; $('#p-floor').textContent = floorTxt(stop.floor);
  const segs = STOPS.map((x, i) => `<i class="${state.visited.has(x.id) && i !== idx ? 'd' : ''}${i === idx ? ' c' : ''}"><b></b></i>`).join('');
  $('#segs').innerHTML = segs; $('#ar-segs').innerHTML = segs;
  $('#segcnt').textContent = `${idx + 1}/${STOPS.length}`; $('#ar-segcnt').textContent = `${idx + 1}/${STOPS.length}`;
  $('#lyric').innerHTML = '<div class="pad-top"></div>' + narrator.sents.map((s) => `<p class="s next" data-i="${s.i}">${sentenceHTML(s)}</p>`).join('') + '<div class="pad-bot"></div>';
  lyricEls = $$('#lyric .s');
  $('#tsegs').innerHTML = narrator.chapters.map((c) => `<i style="flex:${c.dur.toFixed(2)}"><b></b></i>`).join('');
  chapBars = $$('#tsegs i b'); curSegBars = $$('.segs i.c b');
  $('#ar-name').textContent = stop.short; $('#vc-name').textContent = stop.name;
  $('#mini-title').textContent = `${stop.n} · ${stop.name}`;
  hideEndcard(); userScrollAt = 0; lastSec = -1;
  requestAnimationFrame(() => { trackW = $('#track').clientWidth; followNow(true); });
  if (cur === 'player' && !state.reduce) { gsap.fromTo(['#p-name', '#p-floor'], { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06 }); gsap.fromTo('#lyric', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }); }
});
narrator.on('sentence', (i, s) => {
  lyricEls.forEach((el, k) => {
    const now = k === i; el.classList.toggle('past', k < i); el.classList.toggle('next', k > i);
    if (now && !el.classList.contains('now')) { el.classList.add('now', 'fresh'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('fresh'))); }
    else if (!now) el.classList.remove('now');
    if (!now) $$('.w.on', el).forEach((w) => w.classList.remove('on'));
  });
  curWords = lyricEls[i] ? $$('.w', lyricEls[i]) : [];
  followNow(); $('#mini-line').textContent = s.plain; hideEndcard();
  const sp = $('#subs-p'); sp.innerHTML = sentenceHTML(s);
  if (cur === 'ar' && arReady && !state.reduce) gsap.fromTo(sp, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 });
  const vl = $('#vc-line'); vl.textContent = s.plain;
});
narrator.on('word', (w) => { curWords.forEach((el, k) => el.classList.toggle('on', k <= w)); $$('#subs-p .w').forEach((el, k) => el.classList.toggle('on', k <= w)); });
narrator.on('chapter', (ch) => {
  setPhoto(ch.photo);
  const portal = ch.focus && PORTALS[ch.focus]; const t = ch.focus && TERMS[ch.focus];
  const cap = $('#p-caption');
  cap.innerHTML = portal ? `<b>${esc(portal.label)}</b> · ${esc(portal.title)}, ábrelo con la cámara` : t ? `<b>${esc(t.name)}</b> · ${esc(t.cartela)}` : `<b>${esc(ch.title)}</b>`;
  if (!state.reduce) gsap.fromTo(cap, { y: 6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5 });
  swapText('#p-chap', ch.title);
  $('#p-chapn').textContent = `Capítulo ${ch.index + 1} de ${narrator.chapters.length}`;
  rollCount(ch.index + 1, narrator.chapters.length);
  const arb = $('#p-arbtn');
  arb.style.display = usesAR() ? '' : 'none';
  arb.innerHTML = portal ? '<svg class="i"><use href="#i-portal"/></svg>Abrir el portal' : t?.model ? '<svg class="i"><use href="#i-camera"/></svg>Verla en la sala' : '<svg class="i"><use href="#i-camera"/></svg>Abrir la cámara';
  $('#mini-img').src = ch.photo.src;
  if (cur === 'ar' && arReady && ch.focus && ar) {
    ar.setPointed(ch.focus);
    if (portal && isAuto() && ar.hasMarker(ch.focus)) setTimeout(() => { if (cur === 'ar' && !ar.portal) openPortalUI(ch.focus); }, 1600);
  }
});
narrator.on('time', (t) => {
  const total = narrator.total || 1; const p = t / total;
  if (!draggingKnob) knobX(p * trackW);
  narrator.chapters.forEach((c, k) => { if (chapBars[k]) chapBars[k].style.transform = `scaleX(${Math.max(0, Math.min(1, (t - c.start) / c.dur)).toFixed(4)})`; });
  const sec = Math.floor(t);
  if (sec !== lastSec) { lastSec = sec; $('#t-cur').textContent = fmt(t); $('#t-left').textContent = `−${fmt(total - t)}`; }
  curSegBars.forEach((b) => { b.style.transform = `scaleX(${p.toFixed(4)})`; });
  $('#mini-ring').style.strokeDashoffset = (138.2 * (1 - p)).toFixed(2);
  const s = narrator.sents[narrator.idx]; if (s) $('#subs-prog').style.transform = `scaleX(${Math.min(1, (t - s.start) / s.dur).toFixed(3)})`;
});
narrator.on('state', (playing) => {
  $$('#play, .mini-pp, .ardock .pp, .vc-play').forEach((b) => { b.classList.toggle('is-playing', playing); b.setAttribute('aria-label', playing ? 'Pausa' : 'Reproducir'); });
  $('#vc-play-t').textContent = playing ? 'Pausa' : 'Seguir'; $('#vc-state').textContent = playing ? 'Sonando' : 'En pausa';
  if (playing && !state.reduce) gsap.fromTo('#play', { scale: 0.9 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' });
  if (playing) { state.stopSecs[state.stopId] = state.stopSecs[state.stopId] || 0; stopClock = Date.now(); } else if (state.stopId) state.stopSecs[state.stopId] = (state.stopSecs[state.stopId] || 0) + (Date.now() - stopClock) / 1000;
  musicFollow(); updateMini();
});
narrator.on('end', () => {
  const s = narrator.stop; state.visited.add(s.id);
  $('#segs i.c')?.classList.add('d');
  renderHome();
  const n = nextStop(s);
  const after = () => { if (n && isAuto()) startWalk(n); else showEndcard(); };
  if (dt.queued) { const it = dt.queued; dt.queued = null; renderQueue(); toast(`A continuación: ${it.name}`, 'i-queue'); setTimeout(() => playDetail(it, { after }), 1600); }
  else after();
});
narrator.on('cloudbroken', () => toast('Sin conexión con ElevenLabs: sigue con la voz del dispositivo', 'i-speaker'));
narrator.on('voicebroken', () => toast('Este navegador no tiene voz en español: la pista avanza en silencio, con el texto', 'i-text'));

function swapText(sel, text) { const el = $(sel); if (el.textContent === text) return; if (state.reduce) { el.textContent = text; return; } gsap.to(el, { y: -8, autoAlpha: 0, duration: 0.2, ease: 'power2.in', onComplete: () => { el.textContent = text; gsap.fromTo(el, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }); } }); }
function rollCount(n, total) {
  const c = $('#p-count'); const roll = c.querySelector('.roll'); const old = roll.querySelector('span');
  c.lastChild.textContent = ` / ${total}`;
  if (old && old.textContent === String(n)) return;
  const nw = document.createElement('span'); nw.textContent = n;
  if (state.reduce || !old) { roll.innerHTML = ''; roll.appendChild(nw); return; }
  roll.appendChild(nw); gsap.set(nw, { position: 'absolute', top: 0, left: 0 });
  gsap.fromTo(nw, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'back.out(2)' });
  gsap.to(old, { yPercent: -100, duration: 0.4, ease: 'power2.in', onComplete: () => { old.remove(); gsap.set(nw, { clearProps: 'position,top,left' }); } });
}
let kb = null;
function setPhoto(ph) {
  const wrap = $('#p-photo .ph'); const img = new Image(); img.alt = ''; img.src = ph.src;
  img.style.objectPosition = ph.pos; img.style.transformOrigin = ph.pos; wrap.appendChild(img);
  const olds = $$('img', wrap).filter((x) => x !== img); kb && kb.kill();
  gsap.fromTo(img, { autoAlpha: 0, scale: ph.zoom * 1.1 }, { autoAlpha: 1, scale: ph.zoom, duration: D(1.1), ease: 'power2.out', onComplete: () => { olds.forEach((o) => o.remove()); if (!state.reduce) kb = gsap.to(img, { scale: ph.zoom * 1.07, xPercent: 1.5, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1 }); } });
}
let userScrollAt = 0; let backNowOn = false;
function followNow(instant = false) {
  const el = lyricEls[narrator.idx]; const ly = $('#lyric'); if (!el || !ly.clientHeight) return;
  if (userScrollAt && performance.now() - userScrollAt < 5000) return;
  gsap.to(ly, { scrollTo: { y: Math.max(0, el.offsetTop + el.offsetHeight - ly.clientHeight + 4), autoKill: false }, duration: instant || state.reduce ? 0 : 0.9, ease: 'power3.inOut', overwrite: 'auto' });
  if (backNowOn) { backNowOn = false; gsap.to('#back-now', { autoAlpha: 0, y: -8, duration: D(0.25) }); }
}
function bindLyric() {
  const ly = $('#lyric');
  const mark = () => { userScrollAt = performance.now(); if (!backNowOn) { backNowOn = true; gsap.fromTo('#back-now', { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: D(0.35), ease: 'back.out(2)' }); } clearTimeout(ly._t); ly._t = setTimeout(() => { userScrollAt = 0; followNow(); }, 5100); };
  ly.addEventListener('wheel', mark, { passive: true }); ly.addEventListener('touchmove', mark, { passive: true });
  ly.addEventListener('click', (e) => { if (e.target.closest('.term')) return; const s = e.target.closest('.s'); if (!s) return; narrator.seekSentence(+s.dataset.i); userScrollAt = 0; haptic(5); if (!narrator.playing) playMain(); });
}
function bindTrack() {
  const track = $('#track');
  Draggable.create('#knob', {
    type: 'x', bounds: { minX: 0, maxX: 1 },
    onPress() { this.applyBounds({ minX: 0, maxX: track.clientWidth }); trackW = track.clientWidth; draggingKnob = true; track.classList.add('drag'); },
    onDrag() { const t = (this.x / trackW) * narrator.total; $('#t-cur').textContent = fmt(t); $('#t-left').textContent = `−${fmt(narrator.total - t)}`; const ch = narrator.chapterAt(t); ch && swapText('#p-chap', ch.title); },
    onRelease() { draggingKnob = false; track.classList.remove('drag'); narrator.seek((this.x / trackW) * narrator.total); haptic(6); },
  });
  track.addEventListener('pointerdown', (e) => { if (e.target.closest('#knob')) return; const r = track.getBoundingClientRect(); narrator.seek(((e.clientX - r.left) / r.width) * narrator.total); haptic(5); });
  track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') narrator.skip(5); if (e.key === 'ArrowLeft') narrator.skip(-5); });
  window.addEventListener('resize', () => { trackW = track.clientWidth; });
}
let endOn = false;
function showEndcard() {
  const n = nextStop(); const ec = $('#endcard'); endOn = true;
  ec.innerHTML = n
    ? `<div class="over">Espacio terminado</div><h3>Siguiente: ${n.n} · ${esc(n.name)}</h3><p>${floorTxt(n.floor)} · ${esc(n.howto)}</p><div class="btns"><button class="btn primary" data-act="go-next"><svg class="i fill"><use href="#i-play"/></svg>Ir al ${n.n}</button><button class="btn second" data-act="map"><svg class="i"><use href="#i-map"/></svg>Plano</button></div>`
    : `<div class="over">Fin de la visita</div><h3>Has recorrido la basílica</h3><p>Mira el resumen de tu visita, valórala y compártela.</p><div class="btns"><button class="btn primary" data-act="finish"><svg class="i"><use href="#i-flag"/></svg>Ver tu resumen</button></div>`;
  gsap.fromTo(ec, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: D(0.6) });
  gsap.from($$('.endcard > *'), { y: 14, autoAlpha: 0, stagger: 0.07, duration: D(0.5), delay: D(0.1) });
}
function hideEndcard() { if (!endOn) return; endOn = false; gsap.to('#endcard', { autoAlpha: 0, duration: D(0.25) }); }
onEnter.player = () => requestAnimationFrame(() => { trackW = $('#track').clientWidth; followNow(true); knobX((narrator.t / (narrator.total || 1)) * trackW); });

// Cola: lo que suena después (pista ampliada) o lo que está sonando ahora
function renderQueue() {
  const q = $('#p-queue');
  if (dt.item && (detail.playing || (detail.started && detail.t < detail.total - 0.1))) { q.hidden = false; q.querySelector('span').innerHTML = `Sonando: <b>pista ampliada · ${esc(dt.item.name)}</b>`; }
  else if (dt.queued) { q.hidden = false; q.querySelector('span').innerHTML = `A continuación: <b>${esc(dt.queued.name)}</b>`; }
  else q.hidden = true;
  if (!q.hidden && !state.reduce) gsap.fromTo(q, { y: -6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 });
}

// ---------------------------------------------------------------------------
// Pista ampliada (obra o portal): nunca se monta sobre la pista de la sala
// ---------------------------------------------------------------------------
const estDur = (lines) => lines.reduce((a, l) => a + 0.7 + l.split(/\s+/).length * 0.36, 0);
const termItem = (id) => { const t = TERMS[id]; return t && t.detail ? { id, name: t.name, photo: t.photo, lines: t.detail } : null; };
const portalItem = (id) => { const p = PORTALS[id]; return { id, name: p.title, photo: { src: p.img, pos: '50% 50%', zoom: 1 }, lines: p.lines }; };
function playDetail(item, { after = null } = {}) {
  if (!item) return;
  unlockAll();
  if (narrator.playing) { dt.pausedMain = true; narrator.pause(); } else dt.pausedMain = false;
  dt.item = item; dt.afterEnd = after;
  detail.load({ id: 'detalle-' + item.id, name: item.name, cover: item.photo }, { chapters: [{ title: item.name, photo: item.photo, focus: item.id, lines: item.lines }] });
  detail.play(); musicFollow(); renderQueue(); renderDetailRow();
  if (termCur === item.id && sheetOpen === 'sh-term') { const d = $('#tc-def'); d.innerHTML = wordsHTML(item.lines.join(' ')); d.classList.add('speaking'); }
}
function stopDetail(silent = false) {
  const wasPaused = dt.pausedMain; detail.pause(); detail._cancel && detail._cancel(); detail.started = false;
  dt.item = null; dt.pausedMain = false; renderQueue(); renderDetailRow(); restoreDef();
  return wasPaused && !silent;
}
function restoreDef() { if (termCur && TERMS[termCur]) { const d = $('#tc-def'); d.classList.remove('speaking'); d.textContent = TERMS[termCur].def; } }
detail.on('word', (w) => { $$('#tc-def.speaking .w').forEach((el, k) => el.classList.toggle('on', k <= detail.idx * 0 + globalDetailWord(w))); });
function globalDetailWord(w) { let base = 0; for (let k = 0; k < detail.idx; k++) base += detail.sents[k].tokens.length; return base + w; }
detail.on('time', (t) => { $('#dt-prog').style.transform = `scaleX(${(t / (detail.total || 1)).toFixed(4)})`; });
detail.on('state', () => { renderDetailRow(); musicFollow(); });
detail.on('end', () => {
  const resume = dt.pausedMain; const after = dt.afterEnd; const name = dt.item?.name;
  dt.item = null; dt.pausedMain = false; dt.afterEnd = null; detail.started = false; renderQueue(); renderDetailRow(); restoreDef();
  if (resume) { toast('Sigue la pista de la sala', 'i-headph'); setTimeout(() => { if (!narrator.playing && !detail.playing) narrator.play(); }, 1100); }
  else if (after) after();
  else if (name) musicFollow();
});
function renderDetailRow() {
  const id = termCur; const row = $('#tc-detail'); if (!id) return;
  const it = termItem(id); row.style.display = it ? '' : 'none'; if (!it) return;
  const mine = dt.item && dt.item.id === id; const playing = mine && detail.playing;
  $('#dt-play').classList.toggle('is-playing', playing);
  $('#dt-sub').textContent = mine ? (playing ? 'Sonando · la pista de la sala está en pausa' : 'En pausa') : dt.queued?.id === id ? 'En cola · sonará al terminar la pista de la sala' : `${fmt(estDur(it.lines))} · más sobre esta obra`;
  if (!mine) $('#dt-prog').style.transform = 'scaleX(0)';
}
function detailButton() {
  const it = termItem(termCur); if (!it) return;
  if (dt.item && dt.item.id === it.id) { detail.playing ? detail.pause() : detail.play(); return; }
  if (narrator.playing) { const c = $('#dt-choice'); c.hidden = !c.hidden; if (!c.hidden) gsap.fromTo(c, { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: D(0.4) }); return; }
  playDetail(it);
}

// ---------------------------------------------------------------------------
// Mini reproductor
// ---------------------------------------------------------------------------
let miniOn = false;
function updateMini() {
  const show = narrator.started && !!narrator.stop && (cur === 'home' || cur === 'map');
  $('#app').classList.toggle('mini-on', show);
  if (show === miniOn) return; miniOn = show;
  if (show) gsap.fromTo('#mini', { y: 90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: D(0.6), ease: 'back.out(1.4)', delay: D(0.25) });
  else gsap.to('#mini', { y: 90, autoAlpha: 0, duration: D(0.3), ease: 'power2.in' });
}

// ---------------------------------------------------------------------------
// Hojas
// ---------------------------------------------------------------------------
let sheetOpen = null; let sheetOnClose = null;
function openSheet(id, { onClose } = {}) {
  if (sheetOpen && sheetOpen !== id) closeSheet(true);
  const sh = $('#' + id); sheetOpen = id; sheetOnClose = onClose || null;
  gsap.killTweensOf(sh); gsap.set(sh, { visibility: 'visible', y: 0 });
  gsap.fromTo(sh, { yPercent: 100 }, { yPercent: 0, duration: D(0.6), ease: 'ios' });
  gsap.to('#scrim', { autoAlpha: 1, duration: D(0.4) });
  const scr = screens[cur]; if (scr && cur !== 'ar' && cur !== 'voice') gsap.to(scr, { scale: 0.94, borderRadius: 28, duration: D(0.6), ease: 'ios', transformOrigin: '50% 100%' });
  if (!sh._drag) { sh._drag = true; bindSheetDrag(sh); }
}
function closeSheet(instant = false) {
  if (!sheetOpen) return;
  const sh = $('#' + sheetOpen); const cb = sheetOnClose; sheetOpen = null; sheetOnClose = null;
  gsap.killTweensOf(sh);
  gsap.to(sh, { y: sh.offsetHeight + 30, duration: instant ? 0 : D(0.42), ease: 'power3.in', onComplete: () => gsap.set(sh, { visibility: 'hidden', y: 0, yPercent: 0 }) });
  gsap.to('#scrim', { autoAlpha: 0, duration: instant ? 0 : D(0.35) });
  const scr = screens[cur]; if (scr && cur !== 'ar' && cur !== 'voice') gsap.to(scr, { scale: 1, borderRadius: 0, duration: D(0.5), ease: 'ios', clearProps: 'transform,borderRadius' });
  cb && cb();
}
function bindSheetDrag(sh) {
  sh.querySelectorAll('[data-grab]').forEach((h) => {
    h.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, input, a, canvas')) return;
      const sx = e.clientX, sy = e.clientY; const t0 = performance.now(); let axis = null, dy = 0;
      const move = (ev) => { const dx = ev.clientX - sx; dy = ev.clientY - sy; if (!axis && Math.hypot(dx, dy) > 8) axis = Math.abs(dy) >= Math.abs(dx) ? 'y' : 'x'; if (axis === 'y') { gsap.set(sh, { y: dy > 0 ? dy : dy * 0.15 }); gsap.set('#scrim', { opacity: 1 - Math.max(0, dy) / sh.offsetHeight }); } };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); if (axis === 'y') { const v = dy / Math.max(1, performance.now() - t0); if (dy > 110 || v > 0.6) closeSheet(); else { gsap.to(sh, { y: 0, duration: 0.5, ease: 'back.out(1.5)' }); gsap.to('#scrim', { opacity: 1, duration: 0.3 }); } } };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
  });
}

// ---------------------------------------------------------------------------
// Ficha de la obra: 3D, foto y pista ampliada. La pista de la sala sigue sonando.
// ---------------------------------------------------------------------------
let termCur = null; let viewer = null; let viewerMod = null; let termList = [];
const loadViewer = () => (viewerMod ||= import('./viewer3d.js?v=6'));
function askFor(t) {
  if (t.kind === 'Escultura' || t.kind === 'Persona') return `¿Quién fue ${t.name}?`;
  const w = t.name.split(' ')[0].toLowerCase(); const plural = /s$/.test(w);
  const art = /as$/.test(w) ? 'las' : /(os|es)$/.test(w) ? 'los' : /a$/.test(w) ? 'la' : 'el';
  return `¿Qué ${plural ? 'son' : 'es'} ${art} ${lower1(t.name)}?`;
}
function openTerm(id) {
  const t = TERMS[id]; if (!t) return;
  state.opened.add(id);
  const stop = stopById(t.stop); termList = stop && stop.hotspots.includes(id) ? stop.hotspots : [id];
  const already = sheetOpen === 'sh-term';
  fillTerm(id);
  if (!already) openSheet('sh-term', { onClose: () => { viewer && viewer.stop(); $('#dt-choice').hidden = true; restoreDef(); termCur = null; } });
  haptic(6);
}
async function fillTerm(id) {
  const t = TERMS[id]; termCur = id; const stop = stopById(t.stop);
  $('#tc-over').textContent = `${t.kind} · ${stop ? stop.short : ''}`;
  $('#tc-name').textContent = t.name; $('#tc-cartela').textContent = t.cartela;
  $('#dt-choice').hidden = true;
  if (dt.item && dt.item.id === id) { const d = $('#tc-def'); d.innerHTML = wordsHTML(dt.item.lines.join(' ')); d.classList.add('speaking'); } else restoreDef();
  renderDetailRow();
  $('#tc-dots').innerHTML = termList.length > 1 ? termList.map((x) => `<button data-tdot="${x}" class="${x === id ? 'on' : ''}" aria-label="${esc(TERMS[x].name)}"><i></i></button>`).join('') : '';
  const wrap = $('#sh-term .tc-ph'); wrap.innerHTML = `<img src="${t.photo.src}" alt="${esc(t.name)}" style="object-position:${t.photo.pos};transform:scale(${t.photo.zoom});transform-origin:${t.photo.pos}">`;
  const view = $('#sh-term .tc-view'); const has3d = !!t.model;
  view.classList.toggle('no3d', !has3d); setTermView(has3d ? '3d' : 'foto');
  gsap.fromTo('.tc-body > *', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: D(0.55), stagger: 0.05, delay: D(0.12) });
  if (has3d) {
    try { const m = await loadViewer(); if (!viewer) { viewer = new m.ObjectViewer($('#tc-3d')); viewer.onInteract = () => { $('#tc-hint').style.opacity = 0; $('#tc-tools [data-act="v-spin"]').classList.remove('on'); }; } $('#tc-hint').style.opacity = ''; $('#tc-tools [data-act="v-spin"]').classList.add('on'); await viewer.show(t); gsap.fromTo('#tc-3d', { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: D(0.8), ease: 'expo.out' }); }
    catch (e) { console.warn(e); view.classList.add('no3d'); setTermView('foto'); }
  }
}
function setTermView(v) { $('#sh-term .tc-view').classList.toggle('foto', v === 'foto'); syncSegm('tcview', v, '#tc-seg'); if (viewer) v === '3d' ? viewer.start() : viewer.stop(); }
$('#tc-seg').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { setTermView(b.dataset.v); haptic(5); } });
document.addEventListener('click', (e) => { const d = e.target.closest('[data-tdot]'); if (d && d.dataset.tdot !== termCur) { state.opened.add(d.dataset.tdot); fillTerm(d.dataset.tdot); } });

// ---------------------------------------------------------------------------
// Listas: espacios, idioma, fotos
// ---------------------------------------------------------------------------
function stopRow(x) {
  const here = narrator.stop?.id === x.id && narrator.started;
  const lead = here ? '<span class="eq"><i></i><i></i><i></i></span>' : state.visited.has(x.id) ? '<svg class="i"><use href="#i-check"/></svg>' : x.n;
  return `<button class="stoprow ${here ? 'cur' : ''}" data-stop="${x.id}"><span class="n">${lead}</span><span class="ph"><img src="${x.cover.src}" alt="" style="object-position:${x.cover.pos};transform:scale(${Math.min(x.cover.zoom, 1.6)});transform-origin:${x.cover.pos}"></span><span class="t">${esc(x.name)}<small>${here ? 'Sonando ahora' : `${x.min} min · ${floorTxt(x.floor)}`}</small></span><svg class="i chev"><use href="#i-chev"/></svg></button>`;
}
function openStops() {
  const heard = STOPS.filter((x) => state.visited.has(x.id)).length;
  $('#stops-sub').textContent = `${heard} de ${STOPS.length} escuchados · ${RT().long.toLowerCase()}`;
  $('#stops-list').innerHTML = [1, 0].map((f) => `<div class="sec">${floorTxt(f)}${f ? ' · camarín' : ' · iglesia'}</div>${STOPS.filter((s) => s.floor === f).map(stopRow).join('')}`).join('');
  openSheet('sh-stops');
  $$('.eq i').forEach((b, i) => gsap.fromTo(b, { scaleY: 0.3 }, { scaleY: () => gsap.utils.random(0.45, 1), duration: () => gsap.utils.random(0.28, 0.5), repeat: -1, yoyo: true, repeatRefresh: true, ease: 'sine.inOut', delay: i * 0.08 }));
  gsap.from('#stops-list > *', { y: 16, autoAlpha: 0, stagger: 0.03, duration: D(0.45), delay: D(0.15) });
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
  setLang(r.dataset.lang); setTimeout(closeSheet, 350);
});
function setLang(code, { silent = false } = {}) {
  state.lang = code; store.set('lang', code); applyPrefs();
  $$('.lang-code').forEach((el) => { if (!state.reduce) gsap.fromTo(el, { rotationX: -90 }, { rotationX: 0, duration: 0.5, ease: 'back.out(2)' }); });
  if (code !== 'ES') setTimeout(() => toast('En el prototipo, los contenidos solo están en español', 'i-globe'), silent ? 300 : 0);
}
function openPhotos() {
  $('#ph-grid').innerHTML = state.photos.length ? state.photos.map((p) => `<img src="${p.src}" alt="Foto en ${esc(p.stop)}">`).join('') : '<p class="empty">Aún no has hecho fotos. Usa el botón rojo de la cámara.</p>';
  openSheet('sh-photos');
  gsap.from('#ph-grid > *', { scale: 0.9, autoAlpha: 0, stagger: 0.04, duration: D(0.4), delay: D(0.15) });
}

// ---------------------------------------------------------------------------
// Plano: las dos plantas a la vez, con zoom y un margen de seguridad al arrastrar
// ---------------------------------------------------------------------------
const PLAN = {
  0: { vb: [-14, -40, 400, 560], walls: ['M192.4 436.6 L192.4 397.8 L212.0 397.8 L212.0 358.9 L192.4 358.9 L192.4 340.4 L212.0 340.4 L212.0 301.6 L192.4 301.6 L192.4 266.4 L201.7 255.3 L264.6 255.3 L264.6 148.0 L201.7 148.0 L192.4 133.2 L192.4 103.6 L192.4 44.4 L87.0 44.4 L87.0 103.6 L87.0 133.2 L75.8 146.2 L14.8 146.2 L14.8 253.4 L75.8 253.4 L87.0 266.4 L87.0 299.7 L62.9 299.7 L62.9 338.6 L87.0 338.6 L87.0 357.1 L62.9 357.1 L62.9 395.9 L87.0 395.9 L87.0 436.6 L98.0 466.2 L183.2 466.2 Z', 'M240.5 44.4 L240.5 118.4 L192.4 118.4 L192.4 44.4 Z'],
    thin: ['M164.7 47.4 L164.7 58.5 L116.5 58.5 L116.5 47.4 Z', 'M197.9 0.0 L197.9 19.2 L181.3 19.2 L181.3 0.0 Z'], stairs: [177.8, -2.4],
    labels: [['PORTADA', 140.6, 494.2, 'middle'], ['NAVE', 121.6, 318.2, 'end'], ['ALTAR', 79.0, 79.0, 'end'], ['SACRISTÍA', 248.5, 86.4, 'start'], ['AL CAMARÍN', 207.8, 14.6, 'start']] },
  1: { vb: [-6, -20, 392, 330], walls: ['M306.8 67.6 L306.8 140.4 L257.4 140.4 L257.4 174.2 L70.2 174.2 L70.2 140.4 L20.8 140.4 L20.8 67.6 L70.2 67.6 L70.2 41.6 L117.0 41.6 L117.0 10.4 L210.6 10.4 L210.6 41.6 L257.4 41.6 L257.4 67.6 Z', 'M218.4 174.2 L218.4 239.2 L109.2 239.2 L109.2 174.2'],
    thin: ['M244.4 176.8 L244.4 203.8 L221.0 203.8 L221.0 176.8 Z'], stairs: [221.0, 178.3],
    labels: [['CAMARÍN', 214.8, 30.2, 'start'], ['ANTECAMARÍN', 163.8, 259.8, 'middle']] },
};
// Lienzo común: la planta 1 arriba y la planta 0 debajo, en unidades del SVG.
const MAP_W = 420; const FL = { 1: { k: 420 / 392, y: 40 }, 0: { k: 420 / 400, y: 470 } }; const MAP_H = 470 + 560 * (420 / 400) + 10;
const toMap = (f, x, y) => { const P = PLAN[f].vb, F = FL[f]; return { x: (x - P[0]) * F.k, y: F.y + (y - P[1]) * F.k }; };
let mapSel = null;
function drawMap() {
  const here = narrator.started ? narrator.stop : null; const nx = here ? nextStop(here) : STOPS[0];
  const floorG = (f) => {
    const P = PLAN[f], F = FL[f];
    const pins = STOPS.filter((s) => s.floor === f).map((s) => {
      const { x, y } = s.map; const isHere = here && here.id === s.id; const isNext = nx && nx.id === s.id; const done = state.visited.has(s.id) && !isHere; const R = isHere ? 26 : 20;
      const cls = `pin photo ${isHere ? 'here' : ''} ${isNext ? 'next' : ''} ${done ? 'done' : ''} ${mapSel === s.id ? 'sel' : ''}`;
      return `<g class="${cls}" data-pin="${s.id}">${isHere ? `<circle class="halo" cx="${x}" cy="${y}" r="${R + 15}"/>` : ''}<circle class="pinhit" cx="${x}" cy="${y}" r="${R + 12}"/><clipPath id="cp-${s.id}"><circle cx="${x}" cy="${y}" r="${R}"/></clipPath><image href="${s.cover.src}" x="${x - R * 1.5}" y="${y - R}" width="${R * 3}" height="${R * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cp-${s.id})"/><circle class="ring" cx="${x}" cy="${y}" r="${R}"/><circle class="badge" cx="${x + R * 0.82}" cy="${y - R * 0.82}" r="12"/><text class="badge-t" x="${x + R * 0.82}" y="${y - R * 0.82 + 5}">${s.n}</text></g>`;
    }).join('');
    return `<g class="floor" data-f="${f}" transform="translate(0 ${F.y}) scale(${F.k}) translate(${-P.vb[0]} ${-P.vb[1]})">${P.walls.map((d) => `<path class="wall" d="${d}"/>`).join('')}${P.thin.map((d) => `<path class="wall-thin" d="${d}"/>`).join('')}<g class="stairs" transform="translate(${P.stairs[0]} ${P.stairs[1]})"><svg width="24" height="24" viewBox="0 0 24 24" class="i"><use href="#i-stairs"/></svg></g>${P.labels.map(([t, x, y, a]) => `<text class="plabel" x="${x}" y="${y}" text-anchor="${a}">${t}</text>`).join('')}${pins}</g>`;
  };
  $('#plan-wrap').innerHTML = `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" role="img" aria-label="Plano de la basílica: planta 1 (camarín) arriba y planta 0 (iglesia) abajo, con los diez puntos de audioguía">
    <text class="fhead" x="16" y="24">PLANTA 1 · CAMARÍN</text>${floorG(1)}
    <line class="fsep" x1="16" x2="${MAP_W - 16}" y1="${FL[0].y - 30}" y2="${FL[0].y - 30}"/>
    <text class="fhead" x="16" y="${FL[0].y - 8}">PLANTA 0 · IGLESIA</text>${floorG(0)}</svg>`;
  pulseHere();
}
let haloTw = null;
function pulseHere() { haloTw && haloTw.kill(); const h = $('#plan-wrap .halo'); if (h && !state.reduce) haloTw = gsap.fromTo(h, { attr: { r: 30 }, opacity: 0.3 }, { attr: { r: 50 }, opacity: 0, duration: 1.8, repeat: -1, ease: 'power2.out' }); }
function renderMapSheet() {
  const here = narrator.started ? narrator.stop : null; const sel = stopById(mapSel) || STOPS[0];
  const isHere = here && here.id === sel.id; const isNext = here ? nextStop(here)?.id === sel.id : STOPS[0].id === sel.id;
  const eyebrow = isHere ? `Estás aquí · <b>${floorTxt(sel.floor)}</b>` : isNext && here ? `Siguiente${sel.floor !== here.floor ? `, en la planta ${sel.floor}` : ''}` : `Espacio ${sel.n} de ${STOPS.length} · ${floorTxt(sel.floor)}`;
  $('#mapsheet').innerHTML = `<div class="ms-row"><img src="${sel.cover.src}" alt="" style="object-position:${sel.cover.pos}"><div><div class="eyebrow">${eyebrow}</div><h2>${sel.n} · ${esc(sel.name)}</h2><p>${esc(sel.howto)}</p></div></div><button class="btn primary wide" data-act="map-play"><svg class="i fill"><use href="#i-play"/></svg>${isHere ? 'Seguir escuchando' : 'Escuchar este espacio'}</button>`;
  gsap.fromTo($$('#mapsheet > *'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: D(0.45) });
  $$('#fchips button').forEach((b) => { b.classList.toggle('on', +b.dataset.floor === sel.floor); b.classList.toggle('here', here ? +b.dataset.floor === here.floor : +b.dataset.floor === 0); });
}
// Vista: escala y desplazamiento, siempre dentro de los límites (sin huecos a los lados).
const MAPV = { s: 1, x: 0, y: 0, min: 1, max: 4, cw: 0, ch: 0, W: 0, H: 0 };
function mapLayout() { const c = $('#mapcard'); MAPV.cw = c.clientWidth; MAPV.ch = c.clientHeight; MAPV.W = MAPV.cw; MAPV.H = MAPV.cw * (MAP_H / MAP_W); const w = $('#plan-wrap'); w.style.width = MAPV.W + 'px'; w.style.height = MAPV.H + 'px'; }
function bounds(s) { const sw = MAPV.W * s, sh = MAPV.H * s, m = 16; const bx = sw <= MAPV.cw ? [(MAPV.cw - sw) / 2, (MAPV.cw - sw) / 2] : [MAPV.cw - sw, 0]; const by = sh <= MAPV.ch ? [(MAPV.ch - sh) / 2, (MAPV.ch - sh) / 2] : [MAPV.ch - sh - m, m]; return { bx, by }; }
function clampV(v, rubber = false) {
  const { bx, by } = bounds(v.s); const f = (val, [a, b]) => (rubber ? (val < a ? a - (a - val) * 0.25 : val > b ? b + (val - b) * 0.25 : val) : Math.max(a, Math.min(b, val)));
  return { s: v.s, x: f(v.x, bx), y: f(v.y, by) };
}
function applyV(v, anim = false) { Object.assign(MAPV, v); if (anim) gsap.to('#plan-wrap', { x: v.x, y: v.y, scale: v.s, duration: D(0.55), ease: 'power3.out', overwrite: true }); else gsap.set('#plan-wrap', { x: v.x, y: v.y, scale: v.s }); }
function mapZoomAt(pt, s) {
  s = Math.max(MAPV.min, Math.min(MAPV.max, s)); const p = pt || { x: MAPV.cw / 2, y: MAPV.ch / 2 };
  const wx = (p.x - MAPV.x) / MAPV.s, wy = (p.y - MAPV.y) / MAPV.s;
  applyV(clampV({ s, x: p.x - wx * s, y: p.y - wy * s }), true);
}
function focusMap(mx, my, s = MAPV.s, anim = true) { const u = MAPV.W / MAP_W; applyV(clampV({ s, x: MAPV.cw / 2 - mx * u * s, y: MAPV.ch * 0.45 - my * u * s }), anim); }
function centerMap() { const here = narrator.started ? curStop() : STOPS[0]; const p = toMap(here.floor, here.map.x, here.map.y); mapSel = here.id; drawMap(); renderMapSheet(); focusMap(p.x, p.y, Math.max(MAPV.s, 1.8)); gsap.fromTo('#mapcard .center svg', { rotation: 0 }, { rotation: 180, duration: D(0.6), ease: 'back.out(2)' }); }
let mapMoved = false;
function bindMap() {
  const card = $('#mapcard'); const pts = new Map(); let g0 = null; let lastTap = 0;
  card.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); mapMoved = false; g0 = null;
  });
  card.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = card.getBoundingClientRect();
    if (pts.size === 1) { const dx = e.clientX - prev.x, dy = e.clientY - prev.y; if (Math.abs(dx) + Math.abs(dy) > 0.5) { applyV(clampV({ s: MAPV.s, x: MAPV.x + dx, y: MAPV.y + dy }, true)); } }
    else if (pts.size === 2) {
      const [a, b] = [...pts.values()]; const c = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top }; const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (!g0) g0 = { d, c, s: MAPV.s, x: MAPV.x, y: MAPV.y };
      const s = Math.max(MAPV.min * 0.85, Math.min(MAPV.max * 1.15, g0.s * d / g0.d)); const wx = (g0.c.x - g0.x) / g0.s, wy = (g0.c.y - g0.y) / g0.s;
      applyV(clampV({ s, x: c.x - wx * s, y: c.y - wy * s }, true)); mapMoved = true;
    }
  });
  const end = (e) => {
    if (!pts.has(e.pointerId)) return; const start = pts.get(e.pointerId); pts.delete(e.pointerId); g0 = null;
    if (pts.size === 0) {
      applyV(clampV({ ...MAPV, s: Math.max(MAPV.min, Math.min(MAPV.max, MAPV.s)) }), true);
      const now = performance.now(); const r = card.getBoundingClientRect();
      if (!mapMoved && now - lastTap < 300 && !e.target.closest('[data-pin]')) { mapZoomAt({ x: start.x - r.left, y: start.y - r.top }, MAPV.s > 2.4 ? 1 : MAPV.s * 2); lastTap = 0; } else lastTap = now;
    }
  };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  card.addEventListener('wheel', (e) => { e.preventDefault(); const r = card.getBoundingClientRect(); mapZoomAt({ x: e.clientX - r.left, y: e.clientY - r.top }, MAPV.s * Math.exp(-e.deltaY * 0.0018)); }, { passive: false });
  // un toque largo sin moverse no es arrastre; marca si se ha movido más de 6 px
  let sx = 0, sy = 0; card.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; }, true);
  card.addEventListener('pointermove', (e) => { mapMoved = Math.hypot(e.clientX - sx, e.clientY - sy) > 6; }, true);
  card.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pin]'); if (!p || mapMoved) return;
    mapSel = p.dataset.pin; drawMap(); renderMapSheet(); haptic(6);
    const g = $(`#plan-wrap [data-pin="${mapSel}"]`); g && gsap.fromTo(g, { scale: 0.7, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' });
  });
  $('#fchips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-floor]'); if (!b) return; const f = +b.dataset.floor;
    const first = STOPS.find((s) => s.floor === f); mapSel = first.id; drawMap(); renderMapSheet();
    const y0 = f === 1 ? 20 : FL[0].y - 30; focusMap(MAP_W / 2, y0 + (f === 1 ? 180 : 300), 1); haptic(5);
  });
  window.addEventListener('resize', () => { if (cur === 'map') { mapLayout(); applyV(clampV(MAPV)); } });
}
onEnter.map = () => {
  const here = narrator.started ? narrator.stop : null; mapSel = here ? here.id : STOPS[0].id;
  drawMap(); renderMapSheet();
  requestAnimationFrame(() => {
    mapLayout(); const s = here || STOPS[0]; const p = toMap(s.floor, s.map.x, s.map.y); focusMap(p.x, p.y, 1, false);
    if (!state.reduce) { gsap.fromTo('#plan-wrap .floor', { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.15, duration: 0.6 }); gsap.fromTo('#plan-wrap .pin', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.55, ease: 'back.out(2.4)', stagger: 0.04, delay: 0.25 }); }
  });
};

// Control segmentado con indicador que se desliza
function syncSegm(name, value, sel) {
  const seg = sel ? $(sel) : $(`[data-segm="${name}"]`); if (!seg) return;
  const btns = $$('button', seg); const on = value == null ? btns.find((b) => b.classList.contains('on')) : btns.find((b) => b.dataset.v === value); if (!on) return;
  btns.forEach((b) => b.classList.toggle('on', b === on));
  const ind = seg.querySelector('.ind');
  requestAnimationFrame(() => { if (!on.offsetWidth) return; gsap.to(ind, { x: on.offsetLeft, width: on.offsetWidth, duration: ind._init ? D(0.5) : 0, ease: 'back.out(1.2)' }); ind._init = true; });
}

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------
function bindSettings() {
  $$('[data-segm]').forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]'); if (!b) return; const name = seg.dataset.segm; const v = b.dataset.v; syncSegm(name, v); haptic(5);
    if (name === 'textSize') { state.textSize = v; store.set('textSize', v); applyPrefs(); gsap.fromTo('#set-preview', { scale: 0.97, transformOrigin: '0 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(2)' }); }
    if (name === 'speed') setSpeed(+v);
    if (name === 'theme') { state.theme = v; store.set('theme', v); applyPrefs(); }
    if (name === 'route' && v !== state.route) { state.route = v; saveProfile(); if (narrator.stop) { const was = narrator.playing; narrator.load(curStop(), { route: v }); if (was) playMain(); } toast(`Ahora te guía ${RT().who.toLowerCase().startsWith('el') ? RT().who.toLowerCase() : RT().who}`, 'i-route'); updateVisitLabel(); }
  }));
  $$('[data-toggle]').forEach((row) => row.addEventListener('click', () => {
    const k = row.dataset.toggle; state[k] = !state[k]; store.set(k, state[k]); syncToggles(); haptic(6);
    if (k === 'voice') narrator.setVoice(state.voice);
    if (k === 'music') { applyPrefs(); if (state.music) { music.unlock(); musicFollow(); } }
    if (k === 'reduce') { applyPrefs(); if (state.reduce) { kb && kb.kill(); gsap.killTweensOf('.cv-photo img'); } }
    if (['contrast', 'subs', 'bigText'].includes(k)) applyPrefs();
  }));
  $('#music-level').addEventListener('input', (e) => { state.musicLevel = e.target.value / 100; store.set('musicLevel', state.musicLevel); music.setLevel(state.musicLevel); });
}
function syncToggles() { $$('[data-toggle]').forEach((row) => { const on = !!state[row.dataset.toggle]; const sw = row.querySelector('.sw'); sw.classList.toggle('on', on); sw.setAttribute('aria-checked', on); }); }
function updateVoiceLabel() { const small = $('[data-toggle="voice"] small'); const e = narrator.engine; const name = { eleven_v4_turbo: 'ElevenLabs v4 Turbo', eleven_v4: 'ElevenLabs v4', eleven_flash_v2_5: 'ElevenLabs Flash v2.5' }[cloud.status.model] || 'ElevenLabs v4 Turbo'; small.textContent = e === 'cloud' ? `${name}, en tiempo real` : e === 'device' ? 'Voz del dispositivo (sin conexión con ElevenLabs)' : 'Sin voz: solo texto'; }
function updateVisitLabel() { $('#set-visit').textContent = isBlind() ? 'Por voz y automática' : { ar: 'Con realidad aumentada', auto: 'Automática, con realidad aumentada', audio: 'Solo audio y texto' }[state.mode] || 'Con realidad aumentada'; }
onEnter.settings = () => {
  syncToggles(); updateVoiceLabel(); updateVisitLabel(); $('#music-level').value = Math.round(state.musicLevel * 100);
  syncSegm('textSize', state.textSize); syncSegm('speed', String(state.speed)); syncSegm('theme', state.theme); syncSegm('route', state.route || 'historica');
  $('#set-scroll').scrollTop = 0;
  if (!state.reduce) gsap.from('#set-scroll > *', { y: 16, autoAlpha: 0, stagger: 0.02, duration: 0.5, delay: 0.2 });
};

// ---------------------------------------------------------------------------
// Tu guía: avatar en la app (arte) o escultura animada (histórica). Pregunta por escrito;
// en los modos sin pantalla, por voz con el micrófono abierto. Abrirlo no corta la pista.
// ---------------------------------------------------------------------------
const convo = []; let portrait = null; let speaking = false; let resumeAfterAnswer = false; let orbTl = null;
function findAnswer(q) {
  const n = norm(q); let best = null; let bestScore = 0;
  for (const k of KB) { let s = 0; for (const key of k.keys) { const nk = norm(key); if (n.includes(nk)) s += nk.length + 5; } if (s > bestScore) { bestScore = s; best = k; } }
  return best || { a: FALLBACK, stop: null };
}
async function guideAnswer(q, { onText, onSentence } = {}) {
  try {
    const r = await cloud.ask(q, { stop: narrator.started ? narrator.stop?.id : null, route: state.route, ar: cur === 'ar', previous: convo.slice(-3), onText, onSentence });
    if (!r.text) throw new Error('vacía');
    convo.push({ q, a: r.text }); return { a: r.text, stop: r.stop, live: true };
  } catch (e) { console.warn('Guía sin conexión, respuesta preparada:', e.message); return { ...findAnswer(q), live: false }; }
}
function guideState(s) {
  if (state.route === 'arte') { orbTl && orbTl.kill(); if (s === 'talk' && !state.reduce) orbTl = gsap.to('#gd-orb i', { scaleY: () => gsap.utils.random(0.3, 1), duration: 0.16, repeat: -1, repeatRefresh: true, yoyo: true, stagger: 0.04 }); else gsap.to('#gd-orb i', { scaleY: s === 'listen' ? 0.45 : 0.25, duration: 0.3 }); }
  else portrait && portrait.set(s);
  $('#gd-status').textContent = s === 'talk' ? 'Te está respondiendo…' : s === 'listen' ? 'Te escucha' : state.route === 'arte' ? 'Tu guía en la app' : 'La escultura de su capilla, animada';
}
async function openGuide(prefill) {
  const rt = RT(); $('#gd-name').textContent = rt.who;
  $('#sh-guide').classList.toggle('voicemode', voiceAsk());
  renderSugg('#as-sugg', (narrator.started ? curStop() : STOPS[0]).suggest);
  openSheet('sh-guide', { onClose: () => { portrait && portrait.stop(); stopSpeaking(); } });
  if (state.route !== 'arte') {
    try { const m = await loadViewer(); if (!portrait) portrait = new m.Portrait($('#gd-portrait')); portrait.start(); await portrait.ready; portrait.set('greet'); setTimeout(() => sheetOpen === 'sh-guide' && portrait.set('idle'), 4200); } catch (e) { console.warn(e); }
  }
  guideState('idle');
  if (prefill) setTimeout(() => askGuide(prefill), 450);
}
function renderSugg(sel, list) {
  const items = [...new Set(list)].filter((q) => !state.asked.includes(q)).slice(0, 3);
  $(sel).innerHTML = items.map((q) => `<button data-q="${esc(q)}"><span>↳</span>${esc(q)}</button>`).join('');
  gsap.fromTo($$(sel + ' button'), { x: -10, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.06, duration: D(0.4) });
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) askGuide(b.dataset.q); });
function streamWords(el, onNew) {
  let shown = 0;
  return (text, final = false) => {
    const words = text.split(/\s+/).filter(Boolean); const upto = final ? words.length : words.length - 1; const fresh = [];
    for (; shown < upto; shown++) { const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = words[shown]; if (shown) el.appendChild(document.createTextNode(' ')); el.appendChild(sp); fresh.push(sp); }
    if (!fresh.length) return;
    // Attach first: GSAP measuring a detached node moves it and can drop the space before it.
    onNew && onNew();
    if (!state.reduce) gsap.fromTo(fresh, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, stagger: 0.03 });
  };
}
let asBusy = false;
async function askGuide(q, { spoken = voiceAsk() } = {}) {
  q = q.trim(); if (!q || asBusy) return;
  if (sheetOpen !== 'sh-guide' && cur !== 'voice') { await openGuide(); }
  asBusy = true; state.asked.push(q);
  const log = $('#as-log'); const chat = $('#as-chat');
  const qb = document.createElement('div'); qb.className = 'qb'; qb.textContent = q; log.appendChild(qb);
  gsap.fromTo(qb, { scale: 0.85, autoAlpha: 0, y: 12 }, { scale: 1, autoAlpha: 1, y: 0, duration: D(0.45), ease: 'back.out(1.8)' });
  const ty = document.createElement('div'); ty.className = 'typing'; ty.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(ty);
  const dots = gsap.to(ty.children, { y: -5, duration: 0.3, stagger: { each: 0.12, repeat: -1, yoyo: true }, ease: 'sine.inOut' });
  gsap.to(chat, { scrollTo: { y: 'max' }, duration: D(0.5) }); guideState('listen');
  const el = document.createElement('div'); el.className = 'ans';
  const show = () => { if (!el.parentNode) { dots.kill(); ty.remove(); log.appendChild(el); } chat.scrollTop = chat.scrollHeight; };
  const put = streamWords(el, show);
  let queue = null;
  if (spoken) { if (narrator.playing) { resumeAfterAnswer = true; narrator.pause(); } beginSpeaking(); queue = cloud.speakQueue({ rate: state.speed, onWord: (k) => $$('.w', el).forEach((w, j) => w.classList.toggle('on', j <= k)), onDone: endSpeaking }); activeQueue = queue; el.classList.add('speaking'); }
  const ans = await guideAnswer(q, { onText: (t) => put(t), onSentence: (sn) => queue && narrator.engine === 'cloud' && queue.push(sn) });
  if (ans.live) put(ans.a, true); else { el.textContent = ''; streamWords(el, show)(ans.a, true); }
  show();
  if (queue) { if (narrator.engine === 'cloud' && ans.live) queue.end(); else { queue.stop(); narrator.say(ans.a, { onWord: (k) => $$('.w', el).forEach((w, j) => w.classList.toggle('on', j <= k)) }).then(endSpeaking); } }
  const st = ans.stop ? stopById(ans.stop) : null;
  const cite = document.createElement('div'); cite.className = 'cite';
  cite.innerHTML = (st ? `Fuente: <button data-cite="${st.id}">espacio ${st.n}, ${esc(st.short)}<svg class="i"><use href="#i-up"/></svg></button>` : 'Fuera del contenido de la visita') + `<span class="src-tag">${ans.live ? 'Guía con IA' : 'Respuesta preparada'}</span>`;
  log.appendChild(cite);
  if (!spoken) { const tools = document.createElement('div'); tools.className = 'ans-tools'; tools.innerHTML = '<button data-listen><svg class="i"><use href="#i-speaker"/></svg>Escuchar</button>'; log.appendChild(tools); tools.querySelector('button').addEventListener('click', () => speakAnswer(el, ans.a)); }
  gsap.fromTo(cite, { autoAlpha: 0 }, { autoAlpha: 1, duration: D(0.4) });
  $('#as-more').textContent = 'También puedes preguntar';
  renderSugg('#as-sugg', [...(curStop().suggest || []), ...STOPS.flatMap((x) => x.suggest || [])]);
  setTimeout(() => gsap.to(chat, { scrollTo: { y: 'max' }, duration: D(0.6) }), 200);
  if (cur === 'voice') $('#vc-line').textContent = ans.a;
  asBusy = false;
}
let activeQueue = null;
function beginSpeaking() { speaking = true; guideState('talk'); music.play(); }
function endSpeaking() { speaking = false; activeQueue = null; guideState('idle'); $$('.ans.speaking').forEach((a) => a.classList.remove('speaking')); if (resumeAfterAnswer) { resumeAfterAnswer = false; setTimeout(() => { if (!narrator.playing && !detail.playing) playMain(); }, 700); } musicFollow(); }
function stopSpeaking() { if (activeQueue) activeQueue.stop(); narrator.hush(); if (speaking) endSpeaking(); }
function speakAnswer(el, text) {
  if (narrator.playing) { resumeAfterAnswer = true; narrator.pause(); }
  el.classList.add('speaking'); beginSpeaking();
  narrator.say(text, { onWord: (k) => $$('.w', el).forEach((w, j) => w.classList.toggle('on', j <= k)) }).then(endSpeaking);
}
document.addEventListener('click', (e) => { const c = e.target.closest('[data-cite]'); if (!c) return; closeSheet(); setTimeout(() => playStop(c.dataset.cite, { dir: 'up' }), 300); });
function bindForms() {
  const inp = $('#as-input');
  $('#as-form').addEventListener('submit', (e) => { e.preventDefault(); const v = inp.value; inp.value = ''; inp.blur(); askGuide(v, { spoken: false }); });
}

// Micrófono siempre abierto (modos sin pantalla). Ignora lo que coincide con lo que está diciendo la voz.
const voiceLoop = {
  on: false, r: null, waveTl: null,
  start() { if (this.on) return; const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { this.ui('Este navegador no permite escuchar siempre. Toca «Pausa» o usa los botones.'); return; } this.on = true; this.listen(); this.wave(true); },
  stop() { this.on = false; try { this.r && this.r.abort(); } catch (e) {} this.r = null; this.wave(false); },
  ui(t) { $('#vc-mic-t').textContent = t; $('#as-voice-t').textContent = t; },
  wave(on) { this.waveTl && this.waveTl.kill(); if (on && !state.reduce) this.waveTl = gsap.to('#vc-wave i, #as-wave i', { scaleY: () => gsap.utils.random(0.2, 0.7), duration: 0.35, repeat: -1, repeatRefresh: true, yoyo: true, stagger: 0.05 }); },
  listen() {
    if (!this.on) return; const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR(); this.r = r; r.lang = 'es-ES'; r.continuous = true; r.interimResults = false;
    r.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) this.handle(e.results[i][0].transcript); };
    r.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.on = false; this.wave(false); this.ui('No hay permiso para el micrófono. Usa los botones.'); } };
    r.onend = () => { if (this.on) setTimeout(() => this.listen(), 350); };
    try { r.start(); this.ui('Te escucho. Di «pausa», «repite», «siguiente» o haz una pregunta.'); } catch (e) {}
  },
  handle(text) {
    const n = norm(text); if (!n) return;
    const s = narrator.sents[narrator.idx]; const said = norm(s ? s.plain : '').split(' ');
    const words = n.split(' '); const overlap = words.filter((w) => said.includes(w)).length / words.length;
    if (overlap > 0.6 && narrator.playing) return; // es la propia voz de la guía
    gsap.fromTo('#vc-mic', { scale: 0.97 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
    if (/^(pausa|para|detente|calla)/.test(n)) { narrator.pause(); detail.pause(); return; }
    if (/^(sigue|continua|reproduce|play|adelante)/.test(n)) { playMain(); return; }
    if (/^(repite|otra vez)/.test(n)) { narrator.seekSentence(narrator.idx); playMain(); return; }
    if (/^(siguiente|la siguiente)/.test(n)) { ACT.next(); return; }
    if (/(donde estoy|en que sala)/.test(n)) { const st = curStop(); narrator.say(`Estás en ${lower1(st.name)}, en la planta ${st.floor}.`); return; }
    if (n.split(' ').length >= 3) askGuide(text, { spoken: true });
  },
};

// ---------------------------------------------------------------------------
// Permisos
// ---------------------------------------------------------------------------
let permDone = null; let permNeeds = [];
function openPerm(needs, done) {
  permNeeds = needs; permDone = done;
  const s = curStop(); const ids = s.hotspots.slice(0, 2);
  $('#pv-img').src = s.cover.src; $('#pv-l1').textContent = TERMS[ids[0]]?.name || ''; $('#pv-l2').textContent = TERMS[ids[1]]?.name || '';
  const onlyCam = needs.length === 1 && needs[0] === 'camera';
  $('#perm-over').textContent = onlyCam ? 'Realidad aumentada' : 'Antes de empezar';
  $('#perm-title').textContent = onlyCam ? '¿Podemos usar la cámara?' : 'Tu visita necesita estos permisos';
  $('#perm-why').textContent = onlyCam ? 'Para mostrar los puntos sobre la sala y las obras en 3D.' : 'Los pediremos de uno en uno. Puedes cambiarlos en cualquier momento.';
  const R = { camera: ['i-camera', 'Cámara', 'Para la realidad aumentada. No se graba ni se guarda nada.'], location: ['i-location', 'Ubicación', 'Para lanzar cada pista al llegar a la sala. En el prototipo, simulada.'], mic: ['i-mic', 'Micrófono', 'Para que puedas preguntar con la voz, sin tocar la pantalla.'] };
  $('#perm-rows').innerHTML = needs.map((k) => `<div class="row"><svg class="i lead"><use href="#${R[k][0]}"/></svg><span class="t"><b>${R[k][1]}</b><small>${R[k][2]}</small></span></div>`).join('');
  $('#perm-ok').textContent = onlyCam ? 'Permitir la cámara' : 'Permitir y empezar';
  $('#perm-no').textContent = onlyCam ? 'Ahora no, seguir con el audio' : 'Empezar sin permisos';
  openSheet('sh-perm', { onClose: () => {} });
  gsap.fromTo('#sh-perm .pv-mk', { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, stagger: 0.15, duration: D(0.6), ease: 'back.out(2.2)', delay: D(0.4) });
  loadAR().catch(() => {});
}
function requestMotion() { try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') return DeviceOrientationEvent.requestPermission().catch(() => 'denied'); } catch (e) {} return Promise.resolve('granted'); }
function permOk() {
  const m = permNeeds.includes('camera') ? requestMotion() : Promise.resolve(); unlockAll();
  if (permNeeds.includes('camera')) state.camAsked = true;
  state.permsAsked = true; const done = permDone; permDone = null; closeSheet();
  m.finally(() => done && done());
}
function permNo() {
  state.permsAsked = true; const done = permDone; permDone = null;
  if (permNeeds.includes('camera') && permNeeds.length === 1) { closeSheet(); return; }
  if (permNeeds.includes('camera')) { state.mode = 'audio'; saveProfile(); toast('Sin cámara: la visita sigue con audio y texto', 'i-headph'); }
  closeSheet(); done && done();
}

// ---------------------------------------------------------------------------
// Realidad aumentada: puntos, obras en 3D, portales y fotos
// ---------------------------------------------------------------------------
let arMod = null; let ar = null; let arReady = false; let arFrom = 'player'; let scanLoops = []; let arFocus = null;
const loadAR = () => (arMod ||= import('./ar.js?v=6'));
function openAR(focus) { ensureStop(); arFocus = focus || null; if (!state.camAsked) { openPerm(['camera'], () => enterAR({ autoplay: false })); return; } enterAR({ autoplay: false }); }
async function enterAR({ autoplay = false } = {}) {
  let m; try { m = await loadAR(); } catch (e) { toast('No se ha podido cargar la realidad aumentada'); return; }
  if (!ar) {
    ar = new m.ARScene({ root: $('#ar'), video: $('#ar-video'), fallback: $('#ar-fallback'), gl: $('#ar-gl'), dots: $('#ar-dots'), marks: $('#ar-marks'), edge: $('#ar-edge') }, { info, tap: onTapMarker });
  }
  arFrom = cur === 'ar' ? arFrom : cur; arReady = false; resetARUI();
  $('#ar-auto').hidden = !isAuto(); $('#ar-sub').textContent = isAuto() ? (voiceAsk() ? 'Te escucho · di una pregunta' : 'Se activa sola en cada sala') : 'Realidad aumentada';
  go('ar', { dir: 'fade' });
  const mode = await ar.startCamera();
  if (mode === 'photo' && !CAPTURE) toast('Sin cámara: vista simulada con la foto de la sala');
  gsap.fromTo(['#ar-video', '#ar-fallback'], { filter: 'blur(18px) brightness(.45)' }, { filter: 'blur(0px) brightness(1)', duration: D(1.3), ease: 'power2.out', clearProps: 'filter' });
  ar.begin(curStop());
  runScan({ autoplay });
}
function resetARUI() { gsap.set(['#subs', '#ardock', '#ar-found', '#portal-bar'], { autoAlpha: 0 }); gsap.set('#ar-marks', { autoAlpha: 1 }); $('#scan-t').textContent = 'Mueve el móvil despacio'; $('#scan-s').textContent = 'para reconocer la sala'; $('#scan-ring').style.strokeDashoffset = 339.3; }
async function runScan({ autoplay = false, quick = false } = {}) {
  const stop = curStop(); scanLoops.forEach((t) => t.kill()); scanLoops = [];
  gsap.fromTo('#scan', { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: D(0.7), ease: 'expo.out' });
  if (!state.reduce) {
    scanLoops.push(gsap.to('.reticle .c', { scale: 0.86, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' }));
    scanLoops.push(gsap.fromTo('.reticle .phone-ico', { x: -22, rotation: -10 }, { x: 22, rotation: 10, duration: 1.3, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
  }
  let half = false;
  await ar.scan((p) => { $('#scan-ring').style.strokeDashoffset = (339.3 * (1 - p)).toFixed(1); if (p > 0.55 && !half) { half = true; $('#scan-t').textContent = 'Casi lo tenemos'; $('#scan-s').textContent = `reconociendo ${lower1(stop.name)}`; } }, quick ? 1.6 : 3);
  if (cur !== 'ar') return;
  scanLoops.forEach((t) => t.kill()); scanLoops = []; haptic([12, 40, 12]);
  gsap.to('#scan', { autoAlpha: 0, scale: 0.6, duration: D(0.45), ease: 'power3.in' });
  $('#ar-found span').textContent = `${stop.short} · sala reconocida`;
  gsap.timeline().fromTo('#ar-found', { autoAlpha: 0, y: -14, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: D(0.5), ease: 'back.out(2)' }).fromTo('#ar-found svg', { scale: 0, rotation: -45 }, { scale: 1, rotation: 0, duration: D(0.5), ease: 'back.out(3)' }, '<0.1').to('#ar-found', { autoAlpha: 0, y: -10, duration: D(0.35) }, '+=1.4');
  ar.fadeDots();
  const focus = arFocus || narrator.chapterAt()?.focus || stop.hotspots[0];
  ar.revealMarkers(focus, state.reduce); ar.setPointed(focus); arReady = true;
  gsap.fromTo('#ardock', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: D(0.6), ease: 'back.out(1.4)', delay: D(0.3) });
  gsap.fromTo('#subs', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: D(0.6), ease: 'back.out(1.4)', delay: D(0.7) });
  if (arFocus && PORTALS[arFocus]) setTimeout(() => openPortalUI(arFocus), 900);
  arFocus = null;
  if (autoplay && !narrator.playing) setTimeout(() => { if (cur === 'ar') playMain(); }, 900);
}
function onTapMarker(id) {
  haptic(6);
  if (PORTALS[id]) { openPortalUI(id); return; }
  ar.setPointed(id); openTerm(id); // la pista de la sala sigue sonando
}
function openPortalUI(id) {
  const p = PORTALS[id]; if (!p || !ar) return;
  ar.openPortal(id, p, state.reduce); state.opened.add(id);
  $('#pb-title').textContent = p.title; $('#pb-sub').textContent = p.sub;
  gsap.fromTo('#portal-bar', { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: D(0.5), ease: 'back.out(1.6)' });
  toast('Mueve el móvil para asomarte al portal', 'i-portal');
}
function closePortalUI() { ar && ar.closePortal(); gsap.to('#portal-bar', { autoAlpha: 0, duration: D(0.3) }); }
function closeAR(to) {
  arReady = false; ar && ar.end(); scanLoops.forEach((t) => t.kill()); scanLoops = [];
  hideWalk(false);
  const dest = to || (arFrom && !['ar', 'settings', 'survey', 'cover'].includes(arFrom) ? arFrom : 'player');
  go(dest, { dir: 'fade' });
}
function takePhoto() {
  if (!ar || !arReady) return;
  const st = curStop(); const src = ar.capture([`Basílica de San Juan de Dios · ${st.short}`, new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · OptimaGuía']);
  state.photos.push({ src, stop: st.short, t: Date.now() }); haptic(20);
  gsap.fromTo('#flash', { opacity: 0.9 }, { opacity: 0, duration: D(0.6), ease: 'power2.out' });
  $('#ph-thumb').innerHTML = `<img src="${src}" alt="">`; $('#ph-count').textContent = `${state.photos.length} foto${state.photos.length > 1 ? 's' : ''}`;
  gsap.fromTo('#ph-thumb', { scale: 1.6, rotation: -8 }, { scale: 1, rotation: 0, duration: D(0.6), ease: 'back.out(2)' });
  toast('Foto guardada para tu resumen', 'i-image');
}

// ---------------------------------------------------------------------------
// De sala a sala (automática y por voz): indica hacia dónde ir y lanza la pista al llegar
// ---------------------------------------------------------------------------
let walkTo = null; let walkTimer = null;
const DIR = { straight: [-90, 'Sigue recto'], right: [0, 'Gira a la derecha'], left: [180, 'Gira a la izquierda'], up: [-90, 'Sube por la escalera'], down: [90, 'Baja por la escalera'] };
function startWalk(next) {
  walkTo = next; const [deg, verb] = DIR[next.walk?.dir || 'straight'];
  $('#wk-k').textContent = `Siguiente · ${next.n} de ${STOPS.length}`; $('#wk-name').textContent = next.name; $('#wk-text').textContent = next.howto;
  $('#wk-meta').textContent = `${verb} · ≈ ${next.walk?.m || 20} m · te avisaremos al llegar`;
  gsap.set('#wk-arrow svg', { rotation: deg });
  gsap.fromTo('#walk', { autoAlpha: 0 }, { autoAlpha: 1, duration: D(0.4) });
  gsap.fromTo('.wk-card', { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: D(0.7), ease: 'expo.out' });
  if (!state.reduce) gsap.fromTo('#wk-arrow svg', { x: 0 }, { x: 10, duration: 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  narrator.say(`Siguiente: ${next.name}. ${next.howto}`);
  clearTimeout(walkTimer); walkTimer = setTimeout(arrive, 11000);
}
function hideWalk(anim = true) { clearTimeout(walkTimer); gsap.killTweensOf('#wk-arrow svg'); gsap.to('#walk', { autoAlpha: 0, duration: anim ? D(0.3) : 0 }); }
function arrive() {
  if (!walkTo) return; const n = walkTo; walkTo = null; hideWalk(); narrator.hush(); haptic([20, 60, 20]);
  toast(`Has llegado: ${n.name}`, 'i-location');
  if (cur === 'ar' && ar) { playStop(n.id, { open: false, autoplay: false }); ar.reset(n); resetARUI(); runScan({ autoplay: true, quick: true }); }
  else if (cur === 'voice') playStop(n.id, { open: false });
  else playStop(n.id, { open: true, dir: 'fade' });
}

// ---------------------------------------------------------------------------
// Cierre: resumen tipo historias, compartir, valoración y gracias
// ---------------------------------------------------------------------------
let storyI = 0; let storyTl = null; let shareBlob = null;
function visitStats() {
  const heard = STOPS.filter((x) => state.visited.has(x.id)); const mins = Math.max(1, Math.round((Date.now() - (state.startedAt || Date.now())) / 60000));
  const opened = [...state.opened].filter((id) => TERMS[id]);
  const top = Object.entries(state.stopSecs).sort((a, b) => b[1] - a[1]).map(([id]) => stopById(id)).filter(Boolean).slice(0, 3);
  return { heard: heard.length || (narrator.started ? 1 : 0), mins, opened, portals: [...state.opened].filter((id) => PORTALS[id]).length, asked: state.asked.length, photos: state.photos.length, top: top.length ? top : STOPS.slice(0, 3) };
}
function openRecap() {
  if (narrator.playing) narrator.pause(); if (detail.playing) detail.pause();
  const st = visitStats(); const rt = RT();
  const covers = state.photos.length ? state.photos.map((p) => ({ src: p.src, cap: p.stop })) : STOPS.filter((x) => state.visited.has(x.id)).concat(STOPS).slice(0, 6).map((x) => ({ src: x.cover.src, cap: x.short }));
  const slides = [
    `<div class="rc-slide"><div class="bg"><img src="assets/img/sjd-8.jpg" alt=""></div><span class="rc-k">Tu visita · ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span><h2>Has recorrido la Basílica de San Juan de Dios</h2><p class="lead">${esc(rt.long)}, ${state.route === 'arte' ? 'con el narrador' : 'de la mano de San Juan de Dios'}.</p><div class="big tnum">${st.heard}<small> de 10 espacios</small></div></div>`,
    `<div class="rc-slide"><div class="bg"><img src="assets/img/sjd-14.jpg" alt=""></div><span class="rc-k">En cifras</span><h2>Tu paso por la basílica</h2><div class="rc-stats"><div><b class="tnum">${st.mins}</b><span>minutos de visita</span></div><div><b class="tnum">2</b><span>plantas recorridas</span></div><div><b class="tnum">${st.opened.length}</b><span>obras vistas en 3D</span></div><div><b class="tnum">${st.asked}</b><span>preguntas ${esc(rt.toWho)}</span></div></div></div>`,
    `<div class="rc-slide"><div class="bg"><img src="${st.top[0].cover.src}" alt=""></div><span class="rc-k">Donde más te paraste</span><h2>${esc(st.top[0].name)}</h2><div class="rc-top3">${st.top.map((x, i) => `<div><span class="n">${i + 1}</span><img src="${x.cover.src}" alt=""><span><b>${esc(x.name)}</b><small>${floorTxt(x.floor)}</small></span></div>`).join('')}</div></div>`,
    `<div class="rc-slide"><span class="rc-k">Tu fotodump</span><h2>${state.photos.length ? `${state.photos.length} foto${state.photos.length > 1 ? 's' : ''} de tu visita` : 'Los espacios de tu visita'}</h2><div class="dump">${covers.slice(0, 6).map((c) => `<figure><img src="${c.src}" alt=""><figcaption>${esc(c.cap)}</figcaption></figure>`).join('')}</div>${state.photos.length ? '' : '<p class="lead" style="font-size:15px">Haz fotos con la cámara durante la visita y aparecerán aquí.</p>'}</div>`,
    `<div class="rc-slide"><span class="rc-k">Compártela</span><h2>Tu visita, lista para compartir</h2><div class="share-card"><img id="share-img" alt="Imagen para compartir con el resumen de tu visita"></div><div class="share-row"><button class="ig" data-act="share-ig"><span><svg class="i"><use href="#i-camera"/></svg></span>Historias</button><button class="wa" data-act="share-wa"><span><svg class="i"><use href="#i-chat"/></svg></span>WhatsApp</button><button data-act="share-save"><span><svg class="i"><use href="#i-download"/></svg></span>Guardar</button><button data-act="share"><span><svg class="i"><use href="#i-share"/></svg></span>Más</button></div><button class="btn primary wide rc-next" data-act="to-rate">Valorar la visita</button></div>`,
  ];
  $('#rc-slides').innerHTML = slides.join('');
  $('#rc-bars').innerHTML = slides.map(() => '<i><b></b></i>').join('');
  go('recap', { dir: 'up' });
  buildShareImage(st, covers).then((b) => { shareBlob = b; const u = URL.createObjectURL(b); const im = $('#share-img'); if (im) im.src = u; }).catch((e) => console.warn(e));
  storyGo(0);
}
function storyGo(i) {
  const sl = $$('#rc-slides .rc-slide'); const bars = $$('#rc-bars b'); if (i < 0) i = 0; if (i >= sl.length) { ACT['to-rate'](); return; }
  storyI = i; storyTl && storyTl.kill();
  sl.forEach((s, k) => s.classList.toggle('on', k === i)); bars.forEach((b, k) => gsap.set(b, { scaleX: k < i ? 1 : 0 }));
  const s = sl[i];
  gsap.fromTo(s.querySelectorAll(':scope > *:not(.bg)'), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: D(0.7), ease: 'expo.out' });
  const bg = s.querySelector('.bg img'); bg && gsap.fromTo(bg, { scale: 1.15 }, { scale: 1, duration: 6, ease: 'none' });
  const big = s.querySelector('.big'); if (big && !state.reduce) { const n = parseInt(big.textContent, 10); const o = { v: 0 }; gsap.to(o, { v: n, duration: 1.2, ease: 'power3.out', onUpdate: () => { big.firstChild.textContent = Math.round(o.v); } }); }
  $$('.rc-stats b', s).forEach((b) => { const n = parseInt(b.textContent, 10); const o = { v: 0 }; gsap.to(o, { v: n, duration: 1.1, delay: 0.3, ease: 'power3.out', onUpdate: () => { b.textContent = Math.round(o.v); } }); });
  $$('.dump figure', s).forEach((f, k) => gsap.fromTo(f, { scale: 0.6, rotation: gsap.utils.random(-8, 8), autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: D(0.6), delay: 0.15 + k * 0.08, ease: 'back.out(1.8)' }));
  const last = i === sl.length - 1;
  $('.rc-tap').style.display = last ? 'none' : '';
  if (!last) storyTl = gsap.to(bars[i], { scaleX: 1, duration: state.reduce ? 8 : 6, ease: 'none', onComplete: () => storyGo(i + 1) });
  else gsap.set(bars[i], { scaleX: 1 });
}
function stopStory() { storyTl && storyTl.kill(); }
onLeave.recap = () => stopStory();
async function buildShareImage(st, covers) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d');
  x.fillStyle = '#0B0C0E'; x.fillRect(0, 0, 1080, 1920);
  const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const imgs = (await Promise.all(covers.slice(0, 5).map((cv) => load(cv.src)))).filter(Boolean);
  const cells = [[60, 380, 620, 760], [700, 380, 320, 370], [700, 770, 320, 370], [60, 1160, 470, 420], [550, 1160, 470, 420]];
  imgs.forEach((im, k) => { const [X, Y, W, H] = cells[k]; const sc = Math.max(W / im.width, H / im.height); x.save(); rr(x, X, Y, W, H, 36); x.clip(); x.drawImage(im, X + (W - im.width * sc) / 2, Y + (H - im.height * sc) / 2, im.width * sc, im.height * sc); x.restore(); });
  x.fillStyle = '#FF8FB0'; x.font = '800 34px "Atkinson Hyperlegible Next", system-ui'; x.fillText('MI VISITA', 60, 150);
  x.fillStyle = '#fff'; x.font = '800 72px "Atkinson Hyperlegible Next", system-ui'; x.fillText('Basílica de', 60, 240); x.fillText('San Juan de Dios', 60, 322);
  x.font = '800 96px "Atkinson Hyperlegible Next", system-ui'; x.fillText(`${st.heard}/10`, 60, 1720); x.font = '500 36px "Atkinson Hyperlegible Next", system-ui'; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText('espacios', 60, 1770);
  x.fillStyle = '#fff'; x.font = '800 96px "Atkinson Hyperlegible Next", system-ui'; x.fillText(`${st.mins}`, 420, 1720); x.font = '500 36px "Atkinson Hyperlegible Next", system-ui'; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText('minutos', 420, 1770);
  x.fillStyle = '#fff'; x.font = '800 96px "Atkinson Hyperlegible Next", system-ui'; x.fillText(`${st.opened.length}`, 760, 1720); x.font = '500 36px "Atkinson Hyperlegible Next", system-ui'; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText('obras en 3D', 760, 1770);
  x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '700 30px "Atkinson Hyperlegible Next", system-ui'; const made = 'Audioguía oficial · con tecnología'; x.fillText(made, 60, 1860);
  const sym = document.getElementById('og-logo'); // logotipo de OptimaGuía, en blanco
  const logo = sym && await load('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sym.getAttribute('viewBox')}" fill="#ffffff">${sym.innerHTML}</svg>`));
  if (logo) { const h = 26, w = h * 846.13 / 123.73; x.globalAlpha = 0.9; x.drawImage(logo, 60 + x.measureText(made).width + 14, 1860 - 23, w, h); x.globalAlpha = 1; }
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.88));
}
function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
async function shareRecap(target) {
  if (!shareBlob) { toast('Preparando la imagen…'); return; }
  const file = new File([shareBlob], 'mi-visita-san-juan-de-dios.jpg', { type: 'image/jpeg' });
  const text = 'Mi visita a la Basílica de San Juan de Dios (Granada), con la audioguía oficial.';
  if (target === 'wa') { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener'); return; }
  if (target !== 'save' && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Mi visita', text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(shareBlob); a.download = file.name; a.click(); toast('Imagen guardada', 'i-download');
}
function buildRate() {
  $('#score').innerHTML = Array.from({ length: 10 }, (_, i) => `<button data-score="${i + 1}" class="tnum">${i + 1}</button>`).join('');
  $('#improve').innerHTML = ['Contenido', 'Duración', 'Facilidad de uso', 'Realidad aumentada', 'Voz y música', 'Accesibilidad', 'Plano', 'Guía con IA'].map((t) => `<button data-imp="${t}">${t}</button>`).join('');
  $('#score').addEventListener('click', (e) => { const b = e.target.closest('[data-score]'); if (!b) return; state.rating = +b.dataset.score; $$('#score button').forEach((x) => { const n = +x.dataset.score; x.classList.toggle('on', n === state.rating); x.classList.toggle('lit', n < state.rating); }); gsap.fromTo(b, { scale: 0.7 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }); $('#rate-send').disabled = false; haptic(6); });
  $('#improve').addEventListener('click', (e) => { const b = e.target.closest('[data-imp]'); if (!b) return; b.classList.toggle('on'); haptic(4); });
}
onEnter.rate = () => { if (!state.reduce) gsap.from(['.rate-scroll > *', '#score button'], { y: 16, autoAlpha: 0, stagger: 0.03, duration: 0.5, delay: 0.2 }); };
function sendRating() {
  const data = { score: state.rating, mejorar: $$('#improve .on').map((b) => b.dataset.imp), texto: $('#rate-text').value.trim(), ruta: state.route, modo: state.mode, acceso: state.access, espacios: [...state.visited], fecha: new Date().toISOString() };
  store.set('valoracion', data); console.info('Valoración (en producción, al servidor de analítica):', data);
  go('thanks', { dir: 'push' });
}
onEnter.thanks = () => { music.stop(); if (!state.reduce) gsap.timeline().from('.th-check', { scale: 0, rotation: -90, duration: 0.8, ease: 'back.out(2)' }).from('.th-check svg', { scale: 0, duration: 0.5, ease: 'back.out(3)' }, '-=0.3').from(['.thanks h1', '.thanks p', '.th-btns'], { y: 20, autoAlpha: 0, stagger: 0.1, duration: 0.6 }, '-=0.2'); };

// ---------------------------------------------------------------------------
// Tutorial
// ---------------------------------------------------------------------------
const TUT = [
  { sel: () => $('#lyric .s.now .term') || $('#lyric .term'), title: 'Toca las palabras subrayadas', text: 'Se abre la obra en 3D, con su pista ampliada. La pista de la sala no se corta.' },
  { sel: () => $('#p-arbtn'), title: 'Mírala en la sala', text: 'Con la cámara verás los puntos de cada sala y, en dos espacios, un portal a otra época.' },
  { sel: () => $('#player .bar .tools .ib'), title: 'El plano, siempre a mano', text: 'Aquí tienes las dos plantas y los puntos de audio. En el mismo botón vuelves a la audioguía.' },
  { sel: () => $('#player .ask'), title: `Pregunta lo que quieras`, text: 'Tu guía responde solo con las fuentes verificadas por la basílica.' },
];
let tutI = 0;
function startTutorial() {
  if (!narrator.stop) { const s = STOPS[1]; state.stopId = s.id; narrator.load(s, { route: state.route || 'historica' }); }
  narrator.pause(); const i = narrator.sents.findIndex((s) => s.tokens.some((t) => t.term)); if (i >= 0) narrator.seekSentence(i);
  narrator.started = true; go('player', { dir: 'up' });
  setTimeout(() => { gsap.set('#tut', { autoAlpha: 1 }); gsap.fromTo('#tut-spot', { autoAlpha: 0 }, { autoAlpha: 1, duration: D(0.4) }); tutStep(0, true); }, state.reduce ? 50 : 750);
}
function tutStep(i, first = false) {
  if (i >= TUT.length) { endTutorial(); return; }
  tutI = i; const s = TUT[i]; const target = s.sel(); if (!target || !target.offsetWidth) { tutStep(i + 1); return; }
  const app = $('#app').getBoundingClientRect(); const r = target.getBoundingClientRect();
  const box = { left: r.left - app.left - 8, top: r.top - app.top - 6, width: r.width + 16, height: r.height + 12 };
  gsap.to('#tut-spot', { ...box, duration: first ? 0 : D(0.6), ease: 'expo.inOut' });
  const tip = $('#tut-tip'); $('#tut-k').textContent = `Cómo funciona · ${i + 1} de ${TUT.length}`; $('#tut-title').textContent = s.title; $('#tut-text').textContent = s.text;
  $('#tut-next').textContent = i === TUT.length - 1 ? 'Empezar' : 'Siguiente';
  const below = box.top + box.height / 2 < app.height * 0.45; tip.classList.toggle('below', below); tip.classList.toggle('above', !below);
  const th = tip.offsetHeight; const top = below ? box.top + box.height + 14 : box.top - th - 14;
  tip.style.setProperty('--ax', `${Math.max(28, Math.min(app.width - 60, box.left + box.width / 2 - 16))}px`);
  gsap.fromTo(tip, { autoAlpha: 0, y: below ? -10 : 10 }, { autoAlpha: 1, y: 0, top, duration: D(0.5), delay: first ? 0 : D(0.3), ease: 'back.out(1.6)' });
}
function endTutorial() { gsap.to('#tut', { autoAlpha: 0, duration: D(0.35) }); toast('Listo. Toca reproducir cuando quieras', 'i-check'); }

// ---------------------------------------------------------------------------
// QR (ordenador) y arranque
// ---------------------------------------------------------------------------
function renderQR() { try { const q = qrcode(0, 'M'); q.addData(location.href.split('#')[0].split('?')[0]); q.make(); $('#qr').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) {} }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheetOpen) closeSheet(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && narrator.playing && !isAuto()) narrator.pause(); });

$('#sprite').insertAdjacentHTML('afterbegin', LOGO_SYMBOLS);
$$('.screen').forEach((s) => { screens[s.id] = s; });
applyPrefs(); buildSurvey(); buildRate(); renderHome(); drawPlanIll(); bindPress(); bindTrack(); bindLyric(); bindSettings(); bindForms(); bindMap(); renderQR();
screens.cover.classList.add('is-on');
intro();
setTimeout(() => { loadAR().catch(() => {}); loadViewer().then((m) => m.loadFray()).catch(() => {}); }, 7000);
window.__og = { state, narrator, detail, go, STOPS, openTerm, openGuide, openStops, openLang, openPerm, startWalk, openRecap, storyGo, setTermView, showStep, enterAR, openPortalUI, takePhoto, playStop, closeSheet, applyPrefs, renderHome, askGuide, playDetail, termItem, toast, get ar() { return ar; } }; // para las pruebas y las capturas
