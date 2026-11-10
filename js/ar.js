// RA simulada v5: la cámara del móvil de fondo y, encima, los puntos de cada sala colocados al azar
// alrededor del visitante. Ya no hay guía en el suelo: la voz va por encima y el guía vive en la app.
// El giroscopio orienta una cámara virtual (3 grados de libertad): los puntos se quedan en su sitio
// al girar el móvil. Sin giroscopio (ordenador), se mira alrededor arrastrando.
// Portales: una ventana en la sala que deja ver otra realidad (máscara de stencil en three.js).
import * as THREE from 'three';

const D2R = Math.PI / 180;

export class ARScene {
  constructor(els, hooks = {}) {
    this.els = els; this.hooks = hooks;
    this.active = false; this.mode = 'none';
    this.markers = []; this.dots = []; this.pointed = null; this.open = null; this.portal = null;
    this.qTarget = new THREE.Quaternion(); this.hasGyro = false; this.offsetQ = null;
    this.look = { yaw: 0, pitch: 0, vy: 0, vp: 0 }; this.dragging = false;
    this._loop = this._loop.bind(this); this._onOrient = this._onOrient.bind(this); this._resize = this._resize.bind(this);
    this.clock = new THREE.Clock(); this.tmp = new THREE.Vector3();
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: els.gl, alpha: true, antialias: true, stencil: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 0.5, 0.05, 80); this.camera.rotation.order = 'YXZ';
    this._setupDrag();
  }

  // ---------- cámara ----------
  async startCamera() {
    const v = this.els.video;
    try {
      if (window.__ogNoCam || !navigator.mediaDevices?.getUserMedia) throw new Error('sin cámara');
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      v.srcObject = this.stream; v.muted = true; v.setAttribute('playsinline', '');
      await v.play(); this.mode = 'camera';
    } catch (e) { this.mode = 'photo'; }
    this.els.root.classList.toggle('is-photo', this.mode === 'photo');
    return this.mode;
  }
  stopCamera() { if (this.stream) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; } this.els.video.srcObject = null; }

  // ---------- sesión ----------
  begin(stop) {
    this.active = true; this.stop = stop;
    this._resize(); window.addEventListener('resize', this._resize);
    window.addEventListener('deviceorientation', this._onOrient, true);
    this.hasGyro = false; this.offsetQ = null; this.look.yaw = 0; this.look.pitch = 0;
    this.camera.quaternion.identity(); this.camera.rotation.set(0, 0, 0);
    if (this.mode === 'photo') this.els.fallback.src = stop.cover.src;
    this.els.marks.innerHTML = ''; this.markers = [];
    this.clock.start(); requestAnimationFrame(this._loop);
  }
  reset(stop) {
    this.stop = stop; this.closePortal(true);
    if (this.mode === 'photo') this.els.fallback.src = stop.cover.src;
    this.els.marks.innerHTML = ''; this.markers = []; this.pointed = null; this.open = null;
  }
  end() {
    this.active = false; this.closePortal(true);
    window.removeEventListener('resize', this._resize);
    window.removeEventListener('deviceorientation', this._onOrient, true);
    this.stopCamera();
    this.els.marks.innerHTML = ''; this.markers = []; this.dots = []; this.pointed = null; this.open = null;
  }

  // Escaneo: puntos de rastreo; el avance va más rápido si el móvil se mueve.
  scan(onProgress, secs = 3.2) {
    return new Promise((resolve) => {
      this.dots = []; const now = performance.now();
      for (let i = 0; i < 90; i++) {
        const yaw = (Math.random() * 2 - 1) * 40 * D2R, pitch = (Math.random() * 2 - 1) * 32 * D2R;
        this.dots.push({ p: dirToVec(yaw, pitch, 1.6 + Math.random() * 4), born: now + Math.random() * 2600, life: 900 + Math.random() * 2600, size: 0.8 + Math.random() * 1.2 });
      }
      this.motion = 0; const st = { p: 0 };
      const tick = () => {
        if (!this.active) { gsap.ticker.remove(tick); return; }
        const speed = 1 / secs + Math.min(this.motion, 1) * 0.5; this.motion *= 0.9;
        st.p = Math.min(1, st.p + speed * gsap.ticker.deltaRatio(60) / 60);
        onProgress && onProgress(st.p);
        if (st.p >= 1) { gsap.ticker.remove(tick); resolve(); }
      };
      gsap.ticker.add(tick);
    });
  }
  fadeDots() { const o = { a: 1 }; gsap.to(o, { a: 0, duration: 0.6, onUpdate: () => { this.dotAlpha = o.a; }, onComplete: () => { this.dots = []; this.dotAlpha = 1; } }); }

  // Coloca los puntos de la sala: hasta tres a la vista y el resto alrededor. El portal, siempre a la vista.
  _layoutMarkers(stop, focus) {
    const { marks } = this.els; marks.innerHTML = ''; this.markers = [];
    const W = this.W, H = this.H;
    const ids = [...(stop.hotspots || [])];
    if (stop.portal) ids.unshift(stop.portal);
    if (focus && ids.includes(focus)) { ids.splice(ids.indexOf(focus), 1); ids.unshift(focus); }
    const placed = [];
    const forbidden = [{ x: 0, y: 0, w: W, h: 150 }, { x: 0, y: H - 250, w: W, h: 250 }];
    const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const cam = new THREE.PerspectiveCamera(this.camera.fov, W / H, 0.05, 60);
    cam.quaternion.copy(this.camera.quaternion); cam.updateMatrixWorld();
    const yaw0 = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ').y;
    ids.forEach((id, i) => {
      let pos = null;
      if (i < 3) {
        for (let k = 0; k < 400 && !pos; k++) {
          const sx = 26 + Math.random() * (W - 200), sy = 170 + Math.random() * (H - 440);
          const box = { x: sx - 24, y: sy - 30, w: 190, h: 60 };
          if (forbidden.some((f) => hit(box, f)) || placed.some((p) => hit(box, p))) continue;
          placed.push(box);
          pos = new THREE.Vector3((sx / W) * 2 - 1, -(sy / H) * 2 + 1, 0.5).unproject(cam).normalize().multiplyScalar(3 + Math.random() * 2);
        }
      }
      if (!pos) { const side = i % 2 ? 1 : -1; pos = dirToVec(-yaw0 + side * (24 + Math.random() * 40) * D2R, (-6 + Math.random() * 28) * D2R, 3 + Math.random() * 2); }
      const info = this.hooks.info(id); const isPortal = !!info.portal;
      const el = document.createElement('button'); el.type = 'button'; el.className = 'mk' + (isPortal ? ' portal' : ''); el.dataset.term = id;
      el.innerHTML = isPortal
        ? '<span class="mk-in"><span class="arch"><i></i></span><span class="lbl"></span></span>'
        : '<span class="mk-in"><span class="ring"></span><span class="lbl"></span></span>';
      el.querySelector('.lbl').textContent = info.label;
      el.setAttribute('aria-label', isPortal ? `${info.label}. Tocar para abrir el portal` : `${info.label}. Tocar para ver la obra en 3D`);
      el.addEventListener('click', (e) => { e.stopPropagation(); this.hooks.tap && this.hooks.tap(id, el); });
      el.style.visibility = 'hidden'; marks.appendChild(el);
      this.markers.push({ id, el, pos, sx: 0, sy: 0, vis: null, portal: isPortal });
    });
  }
  revealMarkers(focus, reduce) {
    this._layoutMarkers(this.stop, focus);
    this.markers.forEach((m) => { m.el.style.visibility = ''; });
    gsap.fromTo(this.markers.map((m) => m.el.querySelector('.mk-in')), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: reduce ? 0.01 : 0.7, ease: 'back.out(2.2)', stagger: reduce ? 0 : 0.14 });
  }
  hideMarkers(v) { gsap.to(this.els.marks, { autoAlpha: v ? 0 : 1, duration: 0.3 }); }
  setPointed(id) { this.pointed = id; this.markers.forEach((m) => m.el.classList.toggle('pointed', m.id === id)); }
  markerEl(id) { return this.markers.find((m) => m.id === id)?.el; }
  hasMarker(id) { return this.markers.some((m) => m.id === id); }

  // ---------- portal ----------
  openPortal(id, data, reduce) {
    const m = this.markers.find((x) => x.id === id); if (!m) return;
    this.closePortal(true);
    const grp = new THREE.Group(); grp.position.copy(m.pos).setLength(Math.min(m.pos.length(), 3.2)); grp.position.y -= 0.3;
    grp.lookAt(0, grp.position.y, 0);
    const w = 1.25, h = 1.9;
    const shape = arch(w, h);
    // máscara: escribe 1 en el stencil donde está la ventana
    const mask = new THREE.Mesh(new THREE.ShapeGeometry(shape, 48), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp }));
    mask.position.y = -h / 2; mask.renderOrder = 1; grp.add(mask);
    // el otro mundo: un panel lejano con la escena y partículas, visible solo a través de la máscara
    const inside = new THREE.Group(); inside.renderOrder = 2;
    const tex = gradeTexture(data.img, data.grade);
    const stencil = { stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc };
    const back = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 7, 64, 1, true, Math.PI * 0.6, Math.PI * 0.8), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false, ...stencil }));
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1; // se ve por dentro: sin espejo
    back.position.z = -5.4; back.renderOrder = 2; inside.add(back);
    const N = 160; const g = new THREE.BufferGeometry(); const p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { p[i * 3] = (Math.random() - 0.5) * 4; p[i * 3 + 1] = (Math.random() - 0.5) * 3.5; p[i * 3 + 2] = -0.5 - Math.random() * 4; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pm = new THREE.PointsMaterial({ size: data.grade === 'fuego' ? 0.06 : 0.035, color: data.grade === 'fuego' ? 0xffa24a : 0xfff0c8, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, map: dotTex(), ...stencil });
    const pts = new THREE.Points(g, pm); pts.renderOrder = 3; inside.add(pts);
    grp.add(inside);
    // marco luminoso
    const pts2 = shape.getSpacedPoints(160).map((v) => new THREE.Vector3(v.x, v.y - h / 2, 0.01));
    const frame = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2, true), 200, 0.022, 8, true), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    frame.renderOrder = 4; grp.add(frame);
    const glow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2, true), 200, 0.07, 8, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.renderOrder = 4; grp.add(glow);
    this.scene.add(grp);
    this.portal = { id, grp, pts, grade: data.grade };
    m.el.classList.add('opened');
    const d = reduce ? 0.01 : 1;
    gsap.fromTo(grp.scale, { x: 0.05, y: 0.05, z: 1 }, { x: 1, y: 1, z: 1, duration: 1.3 * d, ease: 'expo.out' });
    gsap.fromTo(glow.material, { opacity: 0.9 }, { opacity: 0.18, duration: 1.6 * d });
  }
  closePortal(instant) {
    if (!this.portal) return;
    const { grp, id } = this.portal; this.portal = null;
    this.markerEl(id)?.classList.remove('opened');
    const kill = () => { this.scene.remove(grp); grp.traverse((o) => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); }); };
    if (instant) kill(); else gsap.to(grp.scale, { x: 0.02, y: 0.02, duration: 0.5, ease: 'power3.in', onComplete: kill });
  }

  // ---------- foto ----------
  // Junta la imagen de la cámara, la capa 3D y los puntos visibles, con el pie de la basílica.
  capture(stamp) {
    const W = this.W, H = this.H; const s = Math.min(2, 1080 / W);
    const c = document.createElement('canvas'); c.width = Math.round(W * s); c.height = Math.round(H * s); const x = c.getContext('2d');
    const src = this.mode === 'camera' ? this.els.video : this.els.fallback;
    const sw = src.videoWidth || src.naturalWidth || W, sh = src.videoHeight || src.naturalHeight || H;
    const k = Math.max(c.width / sw, c.height / sh);
    try { x.drawImage(src, (c.width - sw * k) / 2, (c.height - sh * k) / 2, sw * k, sh * k); } catch (e) { x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); }
    try { x.drawImage(this.els.gl, 0, 0, c.width, c.height); } catch (e) {}
    x.save(); x.scale(s, s);
    for (const m of this.markers) {
      if (!m.vis) continue;
      x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.arc(m.sx, m.sy, 14, 0, 6.283); x.stroke();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(m.sx, m.sy, 4, 0, 6.283); x.fill();
      const label = this.hooks.info(m.id).label; x.font = '700 14px "Atkinson Hyperlegible Next", system-ui';
      const tw = x.measureText(label).width; x.fillStyle = 'rgba(255,255,255,.93)'; roundRect(x, m.sx + 22, m.sy - 16, tw + 24, 32, 8); x.fill();
      x.fillStyle = '#111214'; x.fillText(label, m.sx + 34, m.sy + 5);
    }
    const g = x.createLinearGradient(0, H - 120, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = g; x.fillRect(0, H - 120, W, 120);
    x.fillStyle = '#fff'; x.font = '800 17px "Atkinson Hyperlegible Next", system-ui'; x.fillText(stamp[0], 20, H - 44);
    x.font = '500 14px "Atkinson Hyperlegible Next", system-ui'; x.fillText(stamp[1], 20, H - 22);
    x.restore();
    return c.toDataURL('image/jpeg', 0.86);
  }

  // ---------- orientación ----------
  _onOrient(e) {
    if (e.alpha == null && e.beta == null) return;
    const a = (e.alpha || 0) * D2R, b = (e.beta || 0) * D2R, g = (e.gamma || 0) * D2R;
    const orient = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * D2R;
    const q = new THREE.Quaternion(); devQuat(q, a, b, g, orient);
    if (!this.offsetQ) { const f = new THREE.Vector3(0, 0, -1).applyQuaternion(q); this.offsetQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(-f.x, -f.z)); }
    const nq = this.offsetQ.clone().multiply(q);
    if (this.hasGyro) this.motion += Math.min(1, nq.angleTo(this.qTarget) * 6);
    this.qTarget.copy(nq);
    if (!this.hasGyro) { this.hasGyro = true; this.camera.quaternion.copy(nq); this.els.root.classList.add('has-gyro'); }
  }
  _setupDrag() {
    const el = this.els.root; let px = 0, py = 0;
    el.addEventListener('pointerdown', (e) => {
      if (!this.active || this.hasGyro || e.target.closest('button, .ar-ui, .sheet, .talksheet')) return;
      this.dragging = true; px = e.clientX; py = e.clientY; this.look.vy = 0; this.look.vp = 0;
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const k = (this.camera.fov * D2R) / this.H; const dy = (e.clientX - px) * k, dp = (e.clientY - py) * k;
      this.look.yaw += dy; this.look.pitch = clamp(this.look.pitch + dp, -0.7, 0.7); this.look.vy = dy; this.look.vp = dp;
      this.motion += Math.min(1, Math.hypot(dy, dp) * 8); px = e.clientX; py = e.clientY;
    });
    window.addEventListener('pointerup', () => { this.dragging = false; });
  }

  // ---------- bucle ----------
  _resize() {
    const r = this.els.root.getBoundingClientRect(); this.W = r.width || 390; this.H = r.height || 844;
    this.renderer.setSize(this.W, this.H, false); this.camera.aspect = this.W / this.H; this.camera.fov = this.W < this.H ? 62 : 44; this.camera.updateProjectionMatrix();
    const c = this.els.dots; const dpr = Math.min(window.devicePixelRatio || 1, 2); c.width = this.W * dpr; c.height = this.H * dpr; this.dpr = dpr;
  }
  _loop() {
    if (!this.active) return;
    requestAnimationFrame(this._loop);
    const dt = Math.min(this.clock.getDelta(), 0.1); const time = this.clock.elapsedTime; const cam = this.camera;
    if (this.hasGyro) cam.quaternion.slerp(this.qTarget, 0.3);
    else {
      if (!this.dragging) { this.look.yaw += this.look.vy *= 0.92; this.look.pitch = clamp(this.look.pitch + (this.look.vp *= 0.92), -0.7, 0.7); }
      cam.rotation.set(this.look.pitch + Math.sin(time * 0.5) * 0.006, this.look.yaw + Math.sin(time * 0.35) * 0.012, 0);
    }
    cam.updateMatrixWorld();
    if (this.mode === 'photo') {
      const e = new THREE.Euler().setFromQuaternion(cam.quaternion, 'YXZ'); const k = this.H / (cam.fov * D2R);
      this.els.fallback.style.transform = `translate3d(${(-e.y * k).toFixed(1)}px, ${(e.x * k).toFixed(1)}px, 0) scale(1.6)`;
    }
    if (this.portal) { // partículas del otro mundo: polvo que flota o brasas que suben
      const a = this.portal.pts.geometry.attributes.position; const up = this.portal.grade === 'fuego' ? 0.5 : 0.06;
      for (let i = 0; i < a.count; i++) { let y = a.getY(i) + up * dt; if (y > 1.8) y = -1.8; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(time + i) * 0.0015); }
      a.needsUpdate = true;
    }
    this.renderer.render(this.scene, cam);
    this._project();
  }
  _project() {
    const W = this.W, H = this.H; const cam = this.camera; const v = this.tmp; let pointedOff = null;
    for (const m of this.markers) {
      v.copy(m.pos).project(cam); const behind = v.z > 1;
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      const on = !behind && x > -40 && x < W + 40 && y > -40 && y < H + 40;
      m.sx = x; m.sy = y;
      if (on !== m.vis) { m.vis = on; m.el.classList.toggle('off', !on); }
      if (on) m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      if (m.id === this.pointed && (!on || x < 8 || x > W - 8 || y < 120 || y > H - 250)) pointedOff = { m, x, y, behind };
    }
    // Flecha en el borde: hacia dónde girar para ver lo que se está contando.
    const edge = this.els.edge;
    if (pointedOff && !this.portal) {
      let { x, y, behind } = pointedOff; let dx = x - W / 2, dy = y - H / 2;
      if (behind) { dx = -dx; dy = -dy; }
      const ang = Math.atan2(dy, dx);
      const s = Math.min((W / 2 - 44) / Math.abs(Math.cos(ang) || 1e-3), (H / 2 - 180) / Math.abs(Math.sin(ang) || 1e-3));
      edge.style.transform = `translate3d(${(W / 2 + Math.cos(ang) * s).toFixed(1)}px, ${(H / 2 + Math.sin(ang) * s - 40).toFixed(1)}px, 0)`;
      edge.querySelector('.arw').style.transform = `rotate(${ang}rad)`;
      const side = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'Gira a la izquierda' : 'Gira a la derecha') : (dy < 0 ? 'Mira hacia arriba' : 'Mira hacia abajo');
      edge.querySelector('span').textContent = `${side} · ${this.hooks.info(pointedOff.m.id).label}`;
      if (!edge.classList.contains('show')) edge.classList.add('show');
    } else if (edge.classList.contains('show')) edge.classList.remove('show');
    // Puntos de rastreo del escaneo
    const ctx = this.els.dots.getContext('2d'); const dpr = this.dpr; ctx.clearRect(0, 0, W * dpr, H * dpr);
    if (this.dots.length) {
      const now = performance.now(); const A = this.dotAlpha ?? 1;
      for (const d of this.dots) {
        const age = now - d.born; if (age < 0) continue;
        const life = age / d.life; if (life > 1) { d.born = now + Math.random() * 600; d.life = 900 + Math.random() * 2400; continue; }
        v.copy(d.p).project(cam); if (v.z > 1) continue;
        const x = (v.x + 1) / 2 * W * dpr, y = (1 - v.y) / 2 * H * dpr; const a = Math.sin(Math.PI * life) * A;
        ctx.fillStyle = `rgba(255,255,255,${(a * 0.22).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 5 * d.size * dpr, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${(a * 0.95).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 1.6 * d.size * dpr, 0, 6.283); ctx.fill();
      }
    }
  }
}

function arch(w, h) { const s = new THREE.Shape(); const r = w / 2; s.moveTo(-r, 0); s.lineTo(-r, h - r); s.absarc(0, h - r, r, Math.PI, 0, true); s.lineTo(r, 0); s.lineTo(-r, 0); return s; }
// Textura del otro mundo: la foto con un etalonaje (velas o fuego), viñeta y grano.
function gradeTexture(src, grade) {
  const c = document.createElement('canvas'); c.width = 1400; c.height = 900; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const img = new Image(); img.onload = () => {
    x.filter = grade === 'fuego' ? 'sepia(.6) saturate(2.2) hue-rotate(-18deg) brightness(.75) contrast(1.25)' : 'sepia(.55) saturate(1.4) brightness(.82) contrast(1.1)';
    x.drawImage(img, 0, 0, c.width, c.height); x.filter = 'none';
    const g = x.createRadialGradient(700, 450, 150, 700, 450, 760);
    g.addColorStop(0, grade === 'fuego' ? 'rgba(255,120,30,.15)' : 'rgba(255,200,120,.12)'); g.addColorStop(1, 'rgba(0,0,0,.78)');
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    if (grade === 'fuego') { const f = x.createLinearGradient(0, 900, 0, 300); f.addColorStop(0, 'rgba(255,90,0,.55)'); f.addColorStop(1, 'rgba(255,90,0,0)'); x.fillStyle = f; x.fillRect(0, 0, c.width, c.height); }
    tex.needsUpdate = true;
  }; img.src = src;
  return tex;
}
let _dot = null;
function dotTex() { if (_dot) return _dot; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); _dot = new THREE.CanvasTexture(c); return _dot; }
function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function dirToVec(yaw, pitch, d) { return new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, -Math.cos(yaw) * Math.cos(pitch) * d); }
const zee = new THREE.Vector3(0, 0, 1); const eul = new THREE.Euler(); const q0 = new THREE.Quaternion(); const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
function devQuat(out, a, b, g, orient) { eul.set(b, a, -g, 'YXZ'); out.setFromEuler(eul); out.multiply(q1); out.multiply(q0.setFromAxisAngle(zee, -orient)); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
