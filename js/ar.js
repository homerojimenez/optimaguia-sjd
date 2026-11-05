// RA simulada: la cámara del móvil de fondo, puntos colocados al azar alrededor del visitante
// y el guía 3D a su lado. El giroscopio orienta una cámara virtual (3 grados de libertad),
// así que los puntos y el guía se quedan en su sitio al girar el móvil, como en una RA real.
// Sin giroscopio (ordenador), se mira alrededor arrastrando.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const D2R = Math.PI / 180;
const FLOOR = -1.45;           // altura de los ojos sobre el suelo, en metros
const GUIDE_DIST = 3.1;
const GUIDE_YAW = 8.5 * D2R;   // a la derecha de donde miras al empezar

let gltfPromise = null;
export function preloadGuide() {
  if (!gltfPromise) gltfPromise = new GLTFLoader().loadAsync('assets/fray-guia.glb?v=1');
  return gltfPromise;
}

// iOS pide permiso para el giroscopio; tiene que llamarse dentro de un toque.
export async function requestMotion() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const r = await DeviceOrientationEvent.requestPermission();
      return r === 'granted';
    }
  } catch (e) { return false; }
  return true;
}

export class ARScene {
  constructor(els, hooks = {}) {
    this.els = els; this.hooks = hooks;
    this.active = false; this.mode = 'none';
    this.markers = []; this.dots = []; this.pointed = null; this.open = null;
    this.qTarget = new THREE.Quaternion(); this.hasGyro = false; this.offsetQ = null;
    this.look = { yaw: 0, pitch: 0, vy: 0, vp: 0 }; this.dragging = false;
    this._loop = this._loop.bind(this);
    this._onOrient = this._onOrient.bind(this);
    this._resize = this._resize.bind(this);
    this.clock = new THREE.Clock();
    this.tmp = new THREE.Vector3();
    this._setupThree();
    this._setupDrag();
  }

  // ---------- three.js ----------
  _setupThree() {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.els.gl, alpha: true, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.08;
    const scene = this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xfff3e2, 0x2e2620, 0.85));
    const key = new THREE.DirectionalLight(0xffeedd, 1.7); key.position.set(-2, 3, 2); scene.add(key);
    const rim = new THREE.DirectionalLight(0xcfe0ff, 0.7); rim.position.set(2, 2.5, -4); scene.add(rim);
    this.camera = new THREE.PerspectiveCamera(60, 0.5, 0.05, 60);
    this.camera.rotation.order = 'YXZ';

    // Guía: contenedor en el suelo, a la derecha.
    const g = this.guide = new THREE.Group();
    g.position.set(Math.sin(GUIDE_YAW) * GUIDE_DIST, FLOOR, -Math.cos(GUIDE_YAW) * GUIDE_DIST);
    g.visible = false; scene.add(g);
    // Sombra de contacto
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'); const gr = x.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0 }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.004; g.add(this.shadow);
    // Anillos de aparición
    this.rings = [0, 1].map(() => {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.46, 72), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.01; g.add(m); return m;
    });
  }

  async loadGuide() {
    if (this.model) return this.model;
    const gltf = await preloadGuide();
    const root = gltf.scene;
    root.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        o.material = o.material.clone();
        o.material.transparent = true; o.material.opacity = 0;
      }
    });
    this.holder = new THREE.Group(); this.holder.add(root); this.guide.add(this.holder);
    this.mixer = new THREE.AnimationMixer(root);
    this.actions = {};
    for (const clip of gltf.animations) this.actions[clip.name] = this.mixer.clipAction(clip);
    for (const n of ['Greet', 'Point']) if (this.actions[n]) { this.actions[n].setLoop(THREE.LoopOnce, 1); this.actions[n].clampWhenFinished = true; }
    this.mixer.addEventListener('finished', (e) => {
      if (e.action === this.actions.Greet || e.action === this.actions.Point) { this.oneShot = null; this._play(this.base); }
    });
    this.finger = root.getObjectByName('index_03.R') || root.getObjectByName('hand.R');
    this.mats = []; root.traverse((o) => { if (o.isMesh) this.mats.push(o.material); });
    this.base = 'Idle'; this._play('Idle', 0);
    this.model = root;
    return root;
  }
  _play(name, fade = 0.35) {
    const next = this.actions?.[name] || this.actions?.Idle; if (!next) return;
    if (this.cur === next && next.isRunning() && name !== 'Point' && name !== 'Greet') return;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(fade).play();
    if (this.cur && this.cur !== next) this.cur.fadeOut(fade);
    this.cur = next;
  }
  // talk | idle | listen
  setGuideState(s) {
    this.base = s === 'talk' ? 'Talk' : s === 'listen' ? 'Listen' : 'Idle';
    if (!this.oneShot) this._play(this.base);
  }
  gesture(name) { if (!this.actions?.[name]) return; this.oneShot = name; this._play(name, 0.3); }

  // ---------- cámara ----------
  async startCamera() {
    const v = this.els.video;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('sin cámara');
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      v.srcObject = this.stream; v.muted = true; v.setAttribute('playsinline', '');
      await v.play();
      this.mode = 'camera';
    } catch (e) {
      this.mode = 'photo';
    }
    this.els.root.classList.toggle('is-photo', this.mode === 'photo');
    return this.mode;
  }
  stopCamera() {
    if (this.stream) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; }
    this.els.video.srcObject = null;
  }

  // ---------- sesión ----------
  async begin(stop, { focus } = {}) {
    this.active = true; this.stop = stop;
    this._resize(); window.addEventListener('resize', this._resize);
    window.addEventListener('deviceorientation', this._onOrient, true);
    this.hasGyro = false; this.offsetQ = null; this.look.yaw = 0; this.look.pitch = 0;
    this.camera.quaternion.identity(); this.camera.rotation.set(0, 0, 0);
    if (this.mode === 'photo') this.els.fallback.src = stop.cover.src;
    this.els.marks.innerHTML = ''; this.markers = [];
    this.clock.start(); requestAnimationFrame(this._loop);
  }
  // Cambio de sala sin apagar la cámara: fuera puntos y guía, listo para escanear otra vez.
  reset(stop) {
    this.stop = stop;
    if (this.mode === 'photo') this.els.fallback.src = stop.cover.src;
    this.els.marks.innerHTML = ''; this.markers = []; this.pointed = null; this.open = null;
    this.guide.visible = false; this.oneShot = null;
    if (this.mats) this.mats.forEach((m) => { m.opacity = 0; m.transparent = true; m.needsUpdate = true; });
    this.shadow.material.opacity = 0;
  }
  end() {
    this.active = false;
    window.removeEventListener('resize', this._resize);
    window.removeEventListener('deviceorientation', this._onOrient, true);
    this.stopCamera();
    this.guide.visible = false;
    if (this.mats) this.mats.forEach((m) => { m.opacity = 0; m.transparent = true; });
    this.shadow.material.opacity = 0;
    this.els.marks.innerHTML = ''; this.markers = []; this.dots = [];
    this.pointed = null; this.open = null;
  }

  // Escaneo: aparecen puntos de rastreo; el avance va más rápido si el móvil se mueve.
  scan(onProgress) {
    return new Promise((resolve) => {
      this.dots = [];
      const now = performance.now();
      for (let i = 0; i < 90; i++) {
        const yaw = (Math.random() * 2 - 1) * 40 * D2R; const pitch = (Math.random() * 2 - 1) * 32 * D2R;
        const d = 1.6 + Math.random() * 4;
        this.dots.push({ p: dirToVec(yaw, pitch, d), born: now + Math.random() * 2600, life: 900 + Math.random() * 2600, size: 0.8 + Math.random() * 1.2 });
      }
      this.scanning = true; this.motion = 0;
      const st = { p: 0 };
      const tick = () => {
        if (!this.active) { gsap.ticker.remove(tick); return; }
        const speed = 1 / 3.2 + Math.min(this.motion, 1) * 0.5; // con movimiento, 2 s; quieto, 3,2 s
        this.motion *= 0.9;
        st.p = Math.min(1, st.p + speed * gsap.ticker.deltaRatio(60) / 60);
        onProgress && onProgress(st.p);
        if (st.p >= 1) { gsap.ticker.remove(tick); this.scanning = false; resolve(); }
      };
      gsap.ticker.add(tick);
    });
  }
  fadeDots() { const o = { a: 1 }; gsap.to(o, { a: 0, duration: 0.6, onUpdate: () => { this.dotAlpha = o.a; }, onComplete: () => { this.dots = []; this.dotAlpha = 1; } }); }

  // El guía aparece a la derecha de donde mira el visitante en ese momento.
  _placeGuide() {
    const th = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ').y;
    const fx = -Math.sin(th), fz = -Math.cos(th), rx = Math.cos(th), rz = -Math.sin(th);
    const c = Math.cos(GUIDE_YAW), s = Math.sin(GUIDE_YAW);
    this.guide.position.set((fx * c + rx * s) * GUIDE_DIST, FLOOR, (fz * c + rz * s) * GUIDE_DIST);
  }
  async revealGuide(reduce) {
    await this.loadGuide();
    if (!this.active) return;
    this._placeGuide();
    this.guide.visible = true;
    this.holder.rotation.y = this._faceYaw();
    const d = reduce ? 0.01 : 1;
    this.rings.forEach((m, i) => {
      gsap.fromTo(m.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 2.4, y: 2.4, z: 2.4, duration: 1.4 * d, delay: i * 0.25 * d, ease: 'expo.out' });
      gsap.fromTo(m.material, { opacity: 0.95 }, { opacity: 0, duration: 1.4 * d, delay: i * 0.25 * d, ease: 'power2.out' });
    });
    gsap.fromTo(this.holder.scale, { x: 0.92, y: 0.92, z: 0.92 }, { x: 1, y: 1, z: 1, duration: 1.1 * d, ease: 'expo.out' });
    gsap.to(this.shadow.material, { opacity: 1, duration: 0.8 * d });
    const o = { a: 0 };
    gsap.to(o, { a: 1, duration: 0.9 * d, ease: 'power2.out', onUpdate: () => this.mats.forEach((m) => { m.opacity = o.a; }), onComplete: () => this.mats.forEach((m) => { m.transparent = false; m.opacity = 1; m.needsUpdate = true; }) });
    this.gesture('Greet');
  }

  // Coloca los puntos de la parada: hasta tres a la vista y el resto alrededor.
  _layoutMarkers(stop, focus) {
    const { marks } = this.els; marks.innerHTML = ''; this.markers = [];
    const W = this.W, H = this.H;
    const ids = [...stop.ar];
    if (focus && ids.includes(focus)) { ids.splice(ids.indexOf(focus), 1); ids.unshift(focus); }
    const placed = [];
    const forbidden = [
      { x: 0, y: 0, w: W, h: 150 },                          // barra superior
      { x: 0, y: H - 130, w: W, h: 130 },                    // barra de acciones
      { x: W * 0.56, y: H * 0.3, w: W * 0.44, h: H * 0.6 },  // guía
      { x: 0, y: H * 0.24, w: W * 0.72, h: H * 0.32 },       // bocadillo (hasta 5 líneas)
    ];
    const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const cam = new THREE.PerspectiveCamera(this.camera.fov, W / H, 0.05, 60);
    cam.quaternion.copy(this.camera.quaternion); cam.updateMatrixWorld(); // relativo a donde se mira ahora
    const yaw0 = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ').y;
    ids.forEach((id, i) => {
      let pos = null;
      if (i < 3) {
        for (let k = 0; k < 400 && !pos; k++) {
          const sx = 26 + Math.random() * (W - 190); const sy = 160 + Math.random() * (H - 320);
          const box = { x: sx - 20, y: sy - 24, w: 176, h: 48 };
          if (forbidden.some((f) => hit(box, f)) || placed.some((p) => hit(box, p))) continue;
          placed.push(box);
          const v = new THREE.Vector3((sx / W) * 2 - 1, -(sy / H) * 2 + 1, 0.5).unproject(cam).normalize();
          pos = v.multiplyScalar(2.8 + Math.random() * 2.2);
        }
      }
      if (!pos) {
        const side = i % 2 ? 1 : -1;
        const yaw = -yaw0 + side * (24 + Math.random() * 40) * D2R; const pitch = (-8 + Math.random() * 34) * D2R;
        pos = dirToVec(yaw, pitch, 3 + Math.random() * 2);
      }
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'mk'; el.dataset.term = id;
      el.innerHTML = '<span class="mk-in"><span class="ring"></span><span class="lbl"></span><span class="card"><b></b><small></small><em>Ver ficha <svg class="i"><use href="#i-chev"/></svg></em></span></span>';
      const t = this.hooks.term(id);
      el.querySelector('.lbl').textContent = t.name;
      el.querySelector('.card b').textContent = t.name;
      el.querySelector('.card small').textContent = t.cartela;
      el.setAttribute('aria-label', `${t.name}. Tocar para ver la ficha`);
      el.addEventListener('click', (e) => { e.stopPropagation(); this.hooks.tapMarker && this.hooks.tapMarker(id, el); });
      el.style.visibility = 'hidden';
      marks.appendChild(el);
      this.markers.push({ id, el, pos, sx: 0, sy: 0, vis: null });
    });
  }
  revealMarkers(focus, reduce) {
    this._layoutMarkers(this.stop, focus);
    this.markers.forEach((m) => { m.el.style.visibility = ''; });
    gsap.fromTo(this.markers.map((m) => m.el.querySelector('.mk-in')), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: reduce ? 0.01 : 0.7, ease: 'back.out(2.2)', stagger: reduce ? 0 : 0.14 });
  }
  hideMarkers(v) { gsap.to(this.els.marks, { autoAlpha: v ? 0 : 1, duration: 0.3 }); }
  setPointed(id, { gesture = true } = {}) {
    this.pointed = id;
    this.markers.forEach((m) => m.el.classList.toggle('pointed', m.id === id));
    if (id && gesture && this.guide.visible) this.gesture('Point');
  }
  setOpen(id) {
    this.open = id;
    this.markers.forEach((m) => m.el.classList.toggle('open', m.id === id));
  }
  markerEl(id) { return this.markers.find((m) => m.id === id)?.el; }

  // ---------- orientación ----------
  _onOrient(e) {
    if (e.alpha == null && e.beta == null) return;
    const a = (e.alpha || 0) * D2R, b = (e.beta || 0) * D2R, g = (e.gamma || 0) * D2R;
    const orient = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * D2R;
    const q = new THREE.Quaternion();
    devQuat(q, a, b, g, orient);
    if (!this.offsetQ) {
      const f = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
      const yaw0 = Math.atan2(-f.x, -f.z);
      this.offsetQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -yaw0);
    }
    const nq = this.offsetQ.clone().multiply(q);
    if (this.hasGyro) this.motion += Math.min(1, nq.angleTo(this.qTarget) * 6);
    this.qTarget.copy(nq);
    if (!this.hasGyro) { this.hasGyro = true; this.camera.quaternion.copy(nq); this.els.root.classList.add('has-gyro'); }
  }
  _setupDrag() {
    const el = this.els.root; let px = 0, py = 0;
    el.addEventListener('pointerdown', (e) => {
      if (!this.active || this.hasGyro || e.target.closest('button, .ar-ui, .sheet')) return;
      this.dragging = true; px = e.clientX; py = e.clientY; this.look.vy = 0; this.look.vp = 0;
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const k = (this.camera.fov * D2R) / this.H;
      const dy = (e.clientX - px) * k, dp = (e.clientY - py) * k;
      this.look.yaw += dy; this.look.pitch = clamp(this.look.pitch + dp, -0.7, 0.7);
      this.look.vy = dy; this.look.vp = dp; this.motion += Math.min(1, Math.hypot(dy, dp) * 8);
      px = e.clientX; py = e.clientY;
    });
    window.addEventListener('pointerup', () => { this.dragging = false; });
  }

  // ---------- bucle ----------
  _resize() {
    const r = this.els.root.getBoundingClientRect();
    this.W = r.width || 390; this.H = r.height || 844;
    this.renderer.setSize(this.W, this.H, false);
    this.camera.aspect = this.W / this.H;
    this.camera.fov = this.W < this.H ? 62 : 44;
    this.camera.updateProjectionMatrix();
    const c = this.els.dots; const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = this.W * dpr; c.height = this.H * dpr; this.dpr = dpr;
  }
  _faceYaw() { const p = this.guide.position; return Math.atan2(-p.x, -p.z); }
  _loop() {
    if (!this.active) return;
    requestAnimationFrame(this._loop);
    const dt = Math.min(this.clock.getDelta(), 0.1); const time = this.clock.elapsedTime;
    const cam = this.camera;
    if (this.hasGyro) cam.quaternion.slerp(this.qTarget, 0.3);
    else {
      if (!this.dragging) { this.look.yaw += this.look.vy *= 0.92; this.look.pitch = clamp(this.look.pitch + (this.look.vp *= 0.92), -0.7, 0.7); }
      const sway = Math.sin(time * 0.35) * 0.012; const bob = Math.sin(time * 0.5) * 0.006;
      cam.rotation.set(this.look.pitch + bob, this.look.yaw + sway, 0);
    }
    cam.updateMatrixWorld();
    // Fondo de foto (sin cámara): se desplaza con la mirada.
    if (this.mode === 'photo') {
      const e = new THREE.Euler().setFromQuaternion(cam.quaternion, 'YXZ');
      const k = this.H / (cam.fov * D2R);
      this.els.fallback.style.transform = `translate3d(${(-e.y * k).toFixed(1)}px, ${(e.x * k).toFixed(1)}px, 0) scale(1.6)`;
    }
    // Guía
    if (this.mixer) this.mixer.update(dt);
    if (this.holder && this.guide.visible) {
      let target = this._faceYaw();
      const pm = this.pointed && this.markers.find((m) => m.id === this.pointed);
      if (this.oneShot === 'Point' && pm) {
        const gp = this.guide.position; const dx = pm.pos.x - gp.x, dz = pm.pos.z - gp.z;
        const pt = Math.atan2(dz, -dx);
        // Gira hacia el objeto, pero sin dar la espalda al visitante.
        target = target + clamp(angleDiff(target, pt), -1.15, 1.15);
      }
      this.holder.rotation.y = angleDamp(this.holder.rotation.y, target, dt * 3.2);
    }
    this.renderer.render(this.scene, cam);
    this._project(time);
  }
  _project() {
    const W = this.W, H = this.H; const cam = this.camera; const v = this.tmp;
    let pointedOff = null;
    for (const m of this.markers) {
      v.copy(m.pos).project(cam);
      const behind = v.z > 1;
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      const on = !behind && x > -40 && x < W + 40 && y > -40 && y < H + 40;
      m.sx = x; m.sy = y;
      if (on !== m.vis) { m.vis = on; m.el.classList.toggle('off', !on); }
      if (on) m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      if (m.id === this.pointed && (!on || x < 8 || x > W - 8 || y < 120 || y > H - 120)) pointedOff = { m, x, y, behind };
    }
    // Flecha en el borde hacia el punto que señala el guía, si está fuera de la vista.
    const edge = this.els.edge;
    if (pointedOff) {
      let { x, y, behind } = pointedOff; let dx = x - W / 2, dy = y - H / 2;
      if (behind) { dx = -dx; dy = -dy; }
      const ang = Math.atan2(dy, dx);
      const s = Math.min((W / 2 - 44) / Math.abs(Math.cos(ang) || 1e-3), (H / 2 - 150) / Math.abs(Math.sin(ang) || 1e-3));
      edge.style.transform = `translate3d(${(W / 2 + Math.cos(ang) * s).toFixed(1)}px, ${(H / 2 + Math.sin(ang) * s).toFixed(1)}px, 0)`;
      edge.querySelector('.arw').style.transform = `rotate(${ang}rad)`;
      edge.querySelector('span').textContent = this.hooks.term(pointedOff.m.id).name;
      if (!edge.classList.contains('show')) edge.classList.add('show');
    } else if (edge.classList.contains('show')) edge.classList.remove('show');

    // Línea desde el dedo del guía hasta el punto señalado, mientras señala.
    const line = this.els.pointer; let showLine = false;
    if (this.oneShot === 'Point' && this.finger && this.actions?.Point) {
      const tt = this.actions.Point.time; const pm = this.markers.find((mm) => mm.id === this.pointed);
      if (pm && pm.vis && tt > 1.05 && tt < 3.1) {
        this.finger.getWorldPosition(v); v.project(cam);
        const fx = (v.x + 1) / 2 * W, fy = (1 - v.y) / 2 * H;
        line.setAttribute('x1', fx); line.setAttribute('y1', fy); line.setAttribute('x2', pm.sx); line.setAttribute('y2', pm.sy);
        showLine = true;
      }
    }
    if (showLine !== this._lineOn) { this._lineOn = showLine; gsap.to(line, { opacity: showLine ? 0.95 : 0, duration: 0.25 }); }

    // Puntos de rastreo del escaneo
    const ctx = this.els.dots.getContext('2d'); const dpr = this.dpr;
    ctx.clearRect(0, 0, W * dpr, H * dpr);
    if (this.dots.length) {
      const now = performance.now(); const A = this.dotAlpha ?? 1;
      for (const d of this.dots) {
        const age = now - d.born; if (age < 0) continue;
        const life = age / d.life; if (life > 1) { d.born = now + Math.random() * 600; d.life = 900 + Math.random() * 2400; continue; }
        v.copy(d.p).project(cam); if (v.z > 1) continue;
        const x = (v.x + 1) / 2 * W * dpr, y = (1 - v.y) / 2 * H * dpr;
        const a = Math.sin(Math.PI * life) * A;
        ctx.fillStyle = `rgba(255,255,255,${(a * 0.22).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 5 * d.size * dpr, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${(a * 0.95).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 1.6 * d.size * dpr, 0, 6.283); ctx.fill();
      }
    }
  }
}

function dirToVec(yaw, pitch, d) { return new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, -Math.cos(yaw) * Math.cos(pitch) * d); }
const zee = new THREE.Vector3(0, 0, 1); const eul = new THREE.Euler(); const q0 = new THREE.Quaternion(); const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
function devQuat(out, a, b, g, orient) { eul.set(b, a, -g, 'YXZ'); out.setFromEuler(eul); out.multiply(q1); out.multiply(q0.setFromAxisAngle(zee, -orient)); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function angleDiff(a, b) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
function angleDamp(a, b, k) { return a + angleDiff(a, b) * Math.min(1, k); }
