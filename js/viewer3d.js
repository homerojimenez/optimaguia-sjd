// Visor 3D de las obras (ficha) y retrato animado del guía (escultura de San Juan de Dios).
// Los modelos son PROVISIONALES: piezas construidas con la foto de cada obra, hasta tener el CGI de producción.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

let gltfP = null;
export const loadFray = () => (gltfP ||= new GLTFLoader().loadAsync('assets/fray-guia.glb?v=1'));
const texCache = new Map();
function photoTex(src, crop) {
  const key = src + JSON.stringify(crop || {});
  if (texCache.has(key)) return texCache.get(key);
  const t = new THREE.TextureLoader().load(src);
  t.colorSpace = THREE.SRGBColorSpace;
  if (crop) { t.repeat.set(1 / crop.zoom, 1 / crop.zoom); const [px, py] = crop.pos.split(' ').map((v) => parseFloat(v) / 100); t.offset.set(px * (1 - 1 / crop.zoom), (1 - py) * (1 - 1 / crop.zoom)); }
  texCache.set(key, t); return t;
}
const M = {
  gold: () => new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: 1, roughness: 0.32 }),
  silver: () => new THREE.MeshStandardMaterial({ color: 0xd4d8de, metalness: 1, roughness: 0.22 }),
  darkStone: () => new THREE.MeshStandardMaterial({ color: 0x3b3c40, metalness: 0.1, roughness: 0.18 }),
  whiteStone: () => new THREE.MeshStandardMaterial({ color: 0xe9e5dc, metalness: 0, roughness: 0.25 }),
  wood: () => new THREE.MeshStandardMaterial({ color: 0x4a2c1c, metalness: 0, roughness: 0.6 }),
};
function archShape(w, h) {
  const s = new THREE.Shape(); const r = w / 2;
  s.moveTo(-r, 0); s.lineTo(-r, h - r); s.absarc(0, h - r, r, Math.PI, 0, true); s.lineTo(r, 0); s.lineTo(-r, 0);
  return s;
}

// Modelos provisionales por tipo
const BUILD = {
  mesa(t) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), M.whiteStone()); top.position.y = 0.92; g.add(top);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.04, 0.96), M.darkStone()); edge.position.y = 0.87; g.add(edge);
    [-0.5, 0.5].forEach((x) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.8, 32), M.darkStone()); col.position.set(x, 0.46, 0); g.add(col);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.26), M.darkStone()); base.position.set(x, 0.04, 0); g.add(base);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.22), M.darkStone()); cap.position.set(x, 0.85, 0); g.add(cap);
    });
    return g;
  },
  urna() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.6), M.silver()); body.position.y = 0.45; g.add(body);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.2, 40, 1, false, 0, Math.PI), M.silver()); lid.rotation.z = Math.PI / 2; lid.rotation.y = Math.PI / 2; lid.scale.set(1, 1, 0.9); lid.position.y = 0.7; g.add(lid);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.1, 0.72), M.gold()); foot.position.y = 0.15; g.add(foot);
    [-0.4, 0.4].forEach((x) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 12, 40), M.gold()); m.position.set(x, 0.45, 0.31); g.add(m); });
    [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]].forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 16), M.gold()); b.position.set(x, 0.07, z); g.add(b); });
    return g;
  },
  templete() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.14, 48), M.gold()); base.position.y = 0.07; g.add(base);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + (i % 2 ? 0.12 : -0.12); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.2, 20), M.silver()); c.position.set(Math.cos(a) * 0.58, 0.74, Math.sin(a) * 0.58); g.add(c); }
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.1, 48), M.gold()); ring.position.y = 1.38; g.add(ring);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.silver()); dome.position.y = 1.43; g.add(dome);
    const cross = new THREE.Group(); const v = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.03), M.gold()); const h = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), M.gold()); h.position.y = 0.06; cross.add(v, h); cross.position.y = 2.2; g.add(cross);
    const urn = BUILD.urna(); urn.scale.setScalar(0.5); urn.position.y = 0.14; g.add(urn);
    return g;
  },
  columna() {
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.07, 1.4, 4, 1), M.gold()); shaft.rotation.y = Math.PI / 4; shaft.position.y = 0.9; g.add(shaft);
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.2 - i * 0.03, 0.025, 10, 32), M.gold()); b.rotation.x = Math.PI / 2; b.position.y = 1.5 - i * 0.28; g.add(b); }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), M.gold()); cap.position.y = 1.64; g.add(cap);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.34), M.gold()); base.position.y = 0.1; g.add(base);
    return g;
  },
  cupula(t) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ map: photoTex(t.photo.src), side: THREE.BackSide, roughness: 0.9 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), mat); g.add(dome);
    const outer = new THREE.Mesh(new THREE.SphereGeometry(1.02, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), M.gold()); g.add(outer);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.04, 16, 96), M.gold()); ring.rotation.x = Math.PI / 2; g.add(ring);
    const lant = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 24), M.gold()); lant.position.y = 1.12; g.add(lant);
    g.rotation.x = Math.PI; g.position.y = 1.2; // se ve desde abajo, como en la sala
    g.userData.fromBelow = true;
    return g;
  },
  panel(t) {
    const g = new THREE.Group();
    const w = 1.2, h = 1.6;
    const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(w + 0.16, h + 0.1), { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }), M.gold());
    frame.position.set(0, -0.05, -0.06); g.add(frame);
    const pic = new THREE.Mesh(new THREE.ShapeGeometry(archShape(w, h), 32), new THREE.MeshStandardMaterial({ map: photoTex(t.photo.src, t.photo), roughness: 0.7 }));
    // Coordenadas UV de la forma: de la caja de la silueta a 0..1
    const uv = pic.geometry.attributes.uv; const pos = pic.geometry.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, pos.getY(i) / h);
    pic.position.z = 0.056; g.add(pic); // delante de la cara del marco (z 0.04): sin parpadeo de profundidad
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.06, 0.24), M.gold()); shelf.position.set(0, -0.06, 0); g.add(shelf);
    g.position.y = 0.1;
    return g;
  },
};

// ---------- Visor de obras ----------
export class ObjectViewer {
  constructor(canvas) {
    this.canvas = canvas;
    const r = this.r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
    this.scene = new THREE.Scene();
    this.scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.add(new THREE.HemisphereLight(0xfff4e6, 0x2a241f, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 4, 3); this.scene.add(key);
    this.cam = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
    this.controls = new OrbitControls(this.cam, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 1.2, maxDistance: 7, autoRotateSpeed: 2.4, rotateSpeed: 0.8, zoomSpeed: 0.8 });
    this.controls.addEventListener('start', () => { this.controls.autoRotate = false; this.onInteract && this.onInteract(); });
    // Sombra de contacto
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.scene.add(this.shadow);
    this.clock = new THREE.Clock(); this.running = false; this._loop = this._loop.bind(this);
    new ResizeObserver(() => this.resize()).observe(canvas);
  }
  resize() { const w = this.canvas.clientWidth, h = this.canvas.clientHeight; if (!w || !h) return; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }
  async show(term) {
    if (this.obj) { this.scene.remove(this.obj); this.obj = null; }
    if (this.mixer) { this.mixer.stopAllAction(); this.mixer = null; }
    let obj;
    if (term.model === 'escultura') {
      const g = await loadFray(); obj = SkeletonUtils.clone(g.scene);
      obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
      this.mixer = new THREE.AnimationMixer(obj); const idle = g.animations.find((a) => a.name === 'Idle'); idle && this.mixer.clipAction(idle).play();
      // peana
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.3, 48), M.gold()); ped.position.y = -0.15;
      const grp = new THREE.Group(); obj.position.y = 0; grp.add(ped, obj); obj = grp;
      obj.userData.frame = { c: new THREE.Vector3(0, 0.82, 0), size: new THREE.Vector3(0.9, 2.15, 0.9) }; // la malla con esqueleto no da caja fiable
    } else obj = (BUILD[term.model] || BUILD.panel)(term);
    this.obj = obj; this.scene.add(obj);
    const box = new THREE.Box3().setFromObject(obj); let size = box.getSize(new THREE.Vector3()); let ctr = box.getCenter(new THREE.Vector3());
    if (obj.userData.frame) { ctr = obj.userData.frame.c.clone(); size = obj.userData.frame.size.clone(); box.min.y = -0.3; }
    const rad = Math.max(size.x, size.y, size.z) * 0.62;
    this.shadow.position.y = box.min.y + 0.002; this.shadow.scale.setScalar(Math.max(size.x, size.z) * 0.9); this.shadow.visible = !obj.userData.fromBelow;
    this.controls.target.copy(ctr);
    const below = obj.userData.fromBelow;
    this.home = { pos: below ? new THREE.Vector3(ctr.x, ctr.y - rad * 2.6, ctr.z + 0.01) : new THREE.Vector3(ctr.x + rad * 1.4, ctr.y + rad * 0.5, ctr.z + rad * 2.6), target: ctr.clone() };
    this.controls.minDistance = rad * 1.1; this.controls.maxDistance = rad * 6;
    this.reset(true);
    this.controls.autoRotate = true;
    this.resize(); this.start();
  }
  reset(instant) {
    if (!this.home) return;
    if (instant) { this.cam.position.copy(this.home.pos); this.controls.target.copy(this.home.target); this.controls.update(); return; }
    const from = this.cam.position.clone(); const o = { t: 0 };
    gsap.to(o, { t: 1, duration: 0.7, ease: 'power3.inOut', onUpdate: () => { this.cam.position.lerpVectors(from, this.home.pos, o.t); this.controls.update(); } });
  }
  zoom(f) { const d = this.cam.position.clone().sub(this.controls.target); const len = THREE.MathUtils.clamp(d.length() * f, this.controls.minDistance, this.controls.maxDistance); const to = this.controls.target.clone().add(d.setLength(len)); const from = this.cam.position.clone(); const o = { t: 0 }; gsap.to(o, { t: 1, duration: 0.4, ease: 'power2.out', onUpdate: () => { this.cam.position.lerpVectors(from, to, o.t); this.controls.update(); } }); }
  spin(on) { this.controls.autoRotate = on; }
  start() { if (this.running) return; this.running = true; this.clock.start(); requestAnimationFrame(this._loop); }
  stop() { this.running = false; }
  _loop() { if (!this.running) return; requestAnimationFrame(this._loop); const dt = Math.min(this.clock.getDelta(), 0.1); this.mixer && this.mixer.update(dt); this.controls.update(); this.r.render(this.scene, this.cam); }
}

// ---------- Retrato animado del guía (escultura de San Juan de Dios) ----------
export class Portrait {
  constructor(canvas) {
    this.canvas = canvas;
    const r = this.r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.12;
    this.scene = new THREE.Scene();
    this.scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2b211b, 0.8));
    const key = new THREE.DirectionalLight(0xffe7c9, 2); key.position.set(-1.5, 2.5, 2); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xc9dcff, 1); rim.position.set(1.5, 2, -2); this.scene.add(rim);
    this.cam = new THREE.PerspectiveCamera(28, 1, 0.05, 20); this.cam.position.set(0, 1.58, 1.35); this.cam.lookAt(0, 1.5, 0);
    this.clock = new THREE.Clock(); this.running = false; this._loop = this._loop.bind(this);
    this.ready = loadFray().then((g) => {
      const m = g.scene; this.scene.add(m); m.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
      this.mixer = new THREE.AnimationMixer(m); this.acts = {}; g.animations.forEach((a) => { this.acts[a.name] = this.mixer.clipAction(a); });
      this.set('idle', 0);
    });
    new ResizeObserver(() => this.resize()).observe(canvas);
  }
  resize() { const w = this.canvas.clientWidth, h = this.canvas.clientHeight; if (!w || !h) return; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }
  set(state, fade = 0.35) {
    if (!this.acts) return;
    const name = state === 'talk' ? 'Talk' : state === 'listen' ? 'Listen' : state === 'greet' ? 'Greet' : 'Idle';
    const next = this.acts[name]; if (!next || this.cur === next) return;
    if (name === 'Greet') { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; }
    next.reset().fadeIn(fade).play(); if (this.cur) this.cur.fadeOut(fade); this.cur = next;
  }
  start() { if (this.running) return; this.running = true; this.resize(); this.clock.start(); requestAnimationFrame(this._loop); }
  stop() { this.running = false; }
  _loop() { if (!this.running) return; requestAnimationFrame(this._loop); const dt = Math.min(this.clock.getDelta(), 0.1); this.mixer && this.mixer.update(dt); this.r.render(this.scene, this.cam); }
}
