/* ==========================================================================
   Model views — one shared WebGL canvas renders every project's study model
   into its own placeholder element (cards + project page). Efficient: a
   single GPU context no matter how many models are on the page.
   Each view supports: build animation, explode, rebuild, lighting modes,
   linework, auto-rotate and drag-to-orbit.
   ========================================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { makeKit, BUILDERS } from "./models.js";

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const MODES = {
  day:       { hemi: 1.1, sun: 2.4, sunColor: 0xfff1dc, glow: 0.2, solid: 1, line: 0xc9a46a, lineOp: 0.3, env: 0.45, exposure: 1.05 },
  blueprint: { hemi: 0.6, sun: 0.6, sunColor: 0xbcd4ff, glow: 0, solid: 0.04, line: 0xcfe2ff, lineOp: 0.95, env: 0.2, exposure: 1.0 },
  night:     { hemi: 0.18, sun: 0.35, sunColor: 0x8fa8ff, glow: 2.2, solid: 1, line: 0xe6c88f, lineOp: 0.12, env: 0.12, exposure: 1.1 },
};

export function createViews() {
  const canvas = document.createElement("canvas");
  canvas.className = "model-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:3";
  document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);
  const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

  // soft contact shadow texture
  const sh = document.createElement("canvas"); sh.width = sh.height = 128;
  const sx = sh.getContext("2d"), grd = sx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, "rgba(0,0,0,0.55)"); grd.addColorStop(1, "rgba(0,0,0,0)");
  sx.fillStyle = grd; sx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(sh);

  const views = new Set();
  let layer = "page";

  function build(v) {
    const kit = makeKit();
    const model = BUILDERS[v.key] ? BUILDERS[v.key](kit) : BUILDERS.residence(kit);
    // normalise: centre on footprint, base at y=0, fit radius ≈ 10
    const bb = new THREE.Box3().setFromObject(model);
    const size = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
    const s = 20 / Math.max(size.x, size.z, size.y * 1.4);
    const holder = new THREE.Group();
    model.position.set(-c.x, -bb.min.y, -c.z);
    holder.add(model); holder.scale.setScalar(s);

    const scene = new THREE.Scene();
    scene.environment = env;
    const hemi = new THREE.HemisphereLight(0xfff6ea, 0x2a221c, 1);
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.4); sun.position.set(-12, 20, 14);
    const fill = new THREE.PointLight(0xffc27a, 0, 40, 1.4); fill.position.set(0, 4, 0);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.scale.set(size.x * s * 1.5, size.z * s * 1.5, 1); shadow.position.y = 0.02;
    const spinner = new THREE.Group();
    spinner.add(holder, shadow);
    scene.add(hemi, sun, fill, spinner);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
    const height = size.y * s;
    v.camR = 34; v.camY = height * 0.45;

    // explode vectors per part (in model-local space)
    scene.updateMatrixWorld(true);
    const cx = 0, cz = 0, maxY = Math.max(...kit.parts.map((p) => p.getWorldPosition(new THREE.Vector3()).y), 1);
    kit.parts.forEach((p) => {
      p.userData.base = p.position.clone();
      const w = p.getWorldPosition(new THREE.Vector3());
      p.userData.ex = new THREE.Vector3((w.x - cx) * 0.35, (w.y / maxY) * 12 + 1.5, (w.z - cz) * 0.35)
        .applyQuaternion(p.parent.getWorldQuaternion(new THREE.Quaternion()).invert())
        .divideScalar(s);
      p.userData.delay = (w.y / maxY) * 0.7 + Math.random() * 0.15;
    });
    const mats = Object.values(kit.M);
    mats.forEach((m) => (m.userData.op = m.opacity, m.userData.ei = m.emissiveIntensity || 0));
    Object.assign(v, { scene, camera, spinner, kit, mats, hemi, sun, fill, built: true, t0: performance.now(), size: size.clone().multiplyScalar(s) });
    applyMode(v, v.mode, true);
    if (v.file) loadFile(v);
  }

  async function loadFile(v) {
    try {
      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      const gltf = await new GLTFLoader().loadAsync(v.file);
      const m = gltf.scene, bb = new THREE.Box3().setFromObject(m);
      const size = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
      const s = 20 / Math.max(size.x, size.z, size.y * 1.4);
      m.position.set(-c.x * s, -bb.min.y * s, -c.z * s); m.scale.setScalar(s);
      v.spinner.children[0].visible = false;
      v.spinner.add(m);
      v.kit.parts.length = 0; m.children.forEach((ch) => { ch.userData.base = ch.position.clone(); ch.userData.ex = new THREE.Vector3(); ch.userData.delay = 0; v.kit.parts.push(ch); });
    } catch (e) { console.warn("model file", v.file, e); }
  }

  function applyMode(v, name) {
    v.mode = name;
    const m = MODES[name] || MODES.day;
    v.target = m;
    v.el.dataset.mode = name;
  }

  function add(el, key, opts = {}) {
    const v = {
      el, key, file: opts.file || null, layer: opts.layer || "page", drag: !!opts.drag,
      mode: opts.mode || "day", spin: true, explode: 0, explodeT: 0, lines: false,
      rot: Math.random() * Math.PI * 2, rotV: 0, interior: ["bedroom", "hall", "clinic"].includes(key), phase: Math.random() * 6, dragOff: 0, hover: false, built: false, live: { hemi: 1, sun: 2.4, glow: 0.2, solid: 1, lineOp: 0.3, env: 0.45 },
    };
    if (opts.hoverExplode) {
      el.addEventListener("pointerenter", () => (v.hover = true, v.explodeT = 1));
      el.addEventListener("pointerleave", () => (v.hover = false, v.explodeT = 0));
    }
    if (v.drag) {
      let down = false, lx = 0;
      el.style.touchAction = "pan-y";
      el.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) return; down = true; lx = e.clientX; el.setPointerCapture(e.pointerId); el.classList.add("grabbing"); });
      el.addEventListener("pointermove", (e) => { if (!down) return; v.rotV += (e.clientX - lx) * 0.006; lx = e.clientX; });
      const up = () => { down = false; el.classList.remove("grabbing"); };
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    }
    views.add(v);
    return {
      explode(on) { v.explodeT = on ?? (v.explodeT ? 0 : 1); return v.explodeT === 1; },
      rebuild() { v.explodeT = 0; v.explode = 0; v.t0 = performance.now(); },
      mode(name) { applyMode(v, name); },
      lines(on) { v.lines = on ?? !v.lines; return v.lines; },
      spin(on) { v.spin = on ?? !v.spin; return v.spin; },
      remove() { dispose(v); },
    };
  }

  function dispose(v) {
    views.delete(v);
    if (!v.scene) return;
    v.scene.traverse((o) => { o.geometry && o.geometry.dispose(); });
    v.mats && v.mats.forEach((m) => m.dispose());
  }

  function update(v, dt, now) {
    const k = 1 - Math.pow(0.002, dt);
    const L = v.live, T = v.target;
    for (const key of ["hemi", "sun", "glow", "solid", "lineOp", "env"]) {
      const goal = v.lines && key === "lineOp" ? 0.9 : v.lines && key === "solid" ? 0.05 : T[key];
      L[key] += (goal - L[key]) * k;
    }
    v.hemi.intensity = L.hemi; v.sun.intensity = L.sun; v.sun.color.setHex(T.sunColor);
    v.fill.intensity = L.glow * 6;
    v.scene.environmentIntensity = L.env;
    v.kit.lineMat.color.setHex(v.lines && v.mode !== "blueprint" ? 0xe6c88f : T.line);
    v.mats.forEach((m) => {
      m.opacity = L.solid * (m.userData.op ?? 1);
      const t = m.opacity < 0.995;
      if (m.transparent !== t && !(m.userData.op < 1)) { m.transparent = t; m.depthWrite = !t; m.needsUpdate = true; }
      if (m.emissive) m.emissiveIntensity = m.userData.ei * (1 + L.glow * 1.6);
    });

    // build + explode
    const B = clamp01((now - v.t0) / 1700);
    v.explode += (v.explodeT - v.explode) * (1 - Math.pow(0.015, dt));
    const E = easeIO(v.explode);
    let lineVis = 0;
    v.kit.parts.forEach((p) => {
      const t = ease(clamp01((B - p.userData.delay * 0.6) / 0.35));
      p.scale.y = Math.max(t, 0.0001);
      p.visible = t > 0.002;
      p.position.copy(p.userData.base).addScaledVector(p.userData.ex, E);
      lineVis = Math.max(lineVis, t);
    });
    v.kit.lineMat.opacity = Math.min(1, L.lineOp + (1 - B) * 0.6 + E * 0.35);

    // rotation
    v.rotV *= 0.92;
    if (v.interior) {           // cut-away rooms sway around their open side
      v.phase += v.spin ? dt * (v.hover ? 0.9 : 0.4) : 0;
      v.dragOff = Math.max(-0.9, Math.min(0.9, v.dragOff + v.rotV));
      v.rot = -0.6 + Math.sin(v.phase) * 0.45 + v.dragOff;
    } else v.rot += v.rotV + (v.spin ? dt * (v.hover ? 0.6 : 0.22) : 0);
    v.spinner.rotation.y = v.rot;
    renderer.toneMappingExposure = T.exposure;
  }

  const clock = new THREE.Clock();
  let paused = false;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (paused) return;
    const now = performance.now();
    const H = innerHeight, W = innerWidth;
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    for (const v of views) {
      if (v.layer !== layer) continue;
      const r = v.el.getBoundingClientRect();
      if (r.width < 2 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue;
      if (!v.built) build(v);
      update(v, dt, now);
      const ex = v.explode;
      v.camera.aspect = r.width / r.height;
      const fit = Math.max(1, 1.25 / v.camera.aspect);
      const R = v.camR * fit * (1 + ex * 0.35);
      v.camera.position.set(0, v.camY + R * (v.interior ? 0.8 : 0.42) + ex * 6, R * (v.interior ? 0.9 : 1));
      v.camera.lookAt(0, v.camY * (1 + ex * 0.9), 0);
      v.camera.updateProjectionMatrix();
      const bottom = H - r.bottom;
      renderer.setViewport(r.left, bottom, r.width, r.height);
      const x0 = Math.max(0, r.left), y0 = Math.max(0, bottom), x1 = Math.min(W, r.right), y1 = Math.min(H, bottom + r.height);
      if (x1 <= x0 || y1 <= y0) continue;
      renderer.setScissor(x0, y0, x1 - x0, y1 - y0);
      renderer.render(v.scene, v.camera);
    }
  }
  requestAnimationFrame(frame);

  addEventListener("resize", () => renderer.setSize(innerWidth, innerHeight));
  document.addEventListener("visibilitychange", () => (paused = document.hidden));

  return {
    add,
    setLayer(l) { layer = l; canvas.dataset.layer = l; canvas.style.zIndex = l === "overlay" ? 71 : 3; },
    removeLayer(l) { [...views].filter((v) => v.layer === l).forEach(dispose); },
  };
}
