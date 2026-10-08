/* ==========================================================================
   THE LIVING BLUEPRINT — Three.js scene
   A procedural modern villa that drafts itself in gold lines, then rises
   into a lit, rendered building. Modes: blueprint / golden / night.
   Extras: exploded axonometric, rebuild, mouse parallax, scroll camera.
   ========================================================================== */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

const MODES = {
  blueprint: {
    skyTop: "#081426", skyBottom: "#0d2140", horizon: "#1d4b86",
    ground: "#0a1830", grid: "#7fb0ff", gridOpacity: 0.55,
    line: "#d6e6ff", lineOpacity: 1, solid: 0.025, glow: 0.0,
    sun: "#bcd4ff", sunI: 0.6, hemiI: 0.35, sunPos: [20, 30, 15], exposure: 1.0, bloom: 0.35, fog: 0.012,
  },
  golden: {
    skyTop: "#120d0a", skyBottom: "#3a2414", horizon: "#c27a3e",
    ground: "#16110d", grid: "#c9a46a", gridOpacity: 0.28,
    line: "#e6c88f", lineOpacity: 0.28, solid: 1, glow: 0.9,
    sun: "#ffad5e", sunI: 2.3, hemiI: 0.4, sunPos: [-26, 9, 18], exposure: 0.95, bloom: 0.45, fog: 0.012,
  },
  night: {
    skyTop: "#030407", skyBottom: "#0b0f1a", horizon: "#24304d",
    ground: "#08090c", grid: "#c9a46a", gridOpacity: 0.16,
    line: "#e6c88f", lineOpacity: 0.12, solid: 1, glow: 3.2,
    sun: "#8fa8ff", sunI: 0.5, hemiI: 0.16, sunPos: [18, 22, -12], exposure: 1.0, bloom: 0.8, fog: 0.012,
  },
};

export function createScene(canvas) {
  const isMobile = matchMedia("(max-width: 820px)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x16110d, 0.014);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(isMobile ? 48 : 34, innerWidth / innerHeight, 0.1, 600);

  /* ---------- Sky dome ---------- */
  const skyU = {
    top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() },
    horizon: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 0.3, 1).normalize() },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 top,bottom,horizon,sunDir; varying vec3 vP;
        void main(){ float h = vP.y; vec3 c = mix(bottom, top, smoothstep(-0.05, 0.55, h));
          float hz = exp(-abs(h-0.02)*9.0); c = mix(c, horizon, hz*0.55);
          float s = max(dot(normalize(vP), normalize(sunDir)), 0.0); c += horizon * pow(s, 18.0) * 0.6;
          gl_FragColor = vec4(c,1.);
          #include <colorspace_fragment>
        }`,
    })
  );
  scene.add(sky);

  /* ---------- Ground + blueprint grid ---------- */
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x16110d, roughness: 0.92, metalness: 0 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(220, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const gridU = { color: { value: new THREE.Color("#c9a46a") }, opacity: { value: 0.3 }, reveal: { value: 0 } };
  const grid = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: gridU,
      vertexShader: `varying vec2 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform vec3 color; uniform float opacity, reveal; varying vec2 vW;
        float line(vec2 p, float s){ vec2 g = abs(fract(p/s - 0.5) - 0.5) / fwidth(p/s); return 1.0 - min(min(g.x,g.y),1.0); }
        void main(){ float d = length(vW);
          float a = line(vW, 1.0)*0.35 + line(vW, 5.0)*0.9;
          float axis = (1.0 - min(abs(vW.x)/fwidth(vW.x),1.0)) + (1.0 - min(abs(vW.y)/fwidth(vW.y),1.0));
          a = max(a, axis*0.9);
          float fade = 1.0 - smoothstep(10.0, 70.0, d);
          float rv = 1.0 - smoothstep(reveal*80.0 - 8.0, reveal*80.0, d);
          gl_FragColor = vec4(color, a*fade*rv*opacity);
        }`,
    })
  );
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.01;
  scene.add(grid);

  /* ---------- Lights ---------- */
  const hemi = new THREE.HemisphereLight(0xfff1dc, 0x1a120c, 0.5);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb46b, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 90 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const interior = new THREE.PointLight(0xffc27a, 0, 30, 1.6);
  interior.position.set(-1, 2.2, 1.5);
  scene.add(interior);

  /* ---------- Materials ---------- */
  const M = {
    plaster: new THREE.MeshStandardMaterial({ color: 0xd8cfc1, roughness: 0.88 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xb59a7a, roughness: 0.7 }),
    travertine: new THREE.MeshStandardMaterial({ color: 0xd6c6aa, roughness: 0.6 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.55 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x23201d, roughness: 0.4, metalness: 0.6 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc9a46a, roughness: 0.3, metalness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1b2026, roughness: 0.05, metalness: 0.9, emissive: 0xffb469, emissiveIntensity: 0 }),
    water: new THREE.MeshStandardMaterial({ color: 0x1d5a6b, roughness: 0.28, metalness: 0.1, emissive: 0x2fa6c9, emissiveIntensity: 0 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3c4630, roughness: 0.9, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.9 }),
  };
  const solidMats = Object.values(M);
  solidMats.forEach((m) => { m.transparent = true; m.userData.base = m.opacity; });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xe6c88f, transparent: true, opacity: 1, depthWrite: false });

  /* ---------- Building ---------- */
  const building = new THREE.Group();
  scene.add(building);
  const parts = [];
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const boxEdges = new THREE.EdgesGeometry(boxGeo);

  // w,h,d = size ; x,y,z = centre ; level = floor index for explode
  function box(mat, w, h, d, x, y, z, level, { shadow = true, edges = true } = {}) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const mesh = new THREE.Mesh(boxGeo, mat);
    mesh.scale.set(w, h, d);
    mesh.castShadow = shadow; mesh.receiveShadow = true;
    g.add(mesh);
    let lines = null;
    if (edges) {
      lines = new THREE.LineSegments(boxEdges, lineMat);
      lines.scale.set(w * 1.002, h * 1.002, d * 1.002);
      g.add(lines);
    }
    building.add(g);
    parts.push({ g, mesh, lines, base: g.position.clone(), level, w, h, d, delay: 0, kind: "box" });
    return g;
  }
  function custom(geo, mat, x, y, z, level, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z); g.rotation.y = rotY;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), lineMat);
    g.add(mesh, lines);
    building.add(g);
    parts.push({ g, mesh, lines, base: g.position.clone(), level, delay: 0, kind: "custom" });
    return g;
  }

  // L0 — plinth, steps, pool, landscape
  box(M.travertine, 24, 0.45, 15, 0, 0.225, 0, 0);
  box(M.travertine, 3.2, 0.15, 1.2, -1.2, 0.075, 8.1, 0);
  box(M.dark, 9.2, 0.12, 4.2, 4.2, 0.46, 5.2, 0, { shadow: false });
  box(M.water, 8.6, 0.1, 3.6, 4.2, 0.5, 5.2, 0, { shadow: false, edges: false });
  box(M.stone, 0.5, 1.1, 15, -11.75, 1.0, 0, 0); // garden wall
  box(M.stone, 6, 1.1, 0.5, -8.9, 1.0, -7.25, 0);

  // L1 — ground floor: glazed living box + stone-clad block + fin wall
  box(M.glass, 10.6, 2.9, 0.12, -2.2, 1.9, 3.7, 1, { shadow: false });
  box(M.glass, 0.12, 2.9, 6.6, -7.45, 1.9, 0.4, 1, { shadow: false });
  box(M.plaster, 10.8, 3.0, 0.3, -2.2, 1.95, -2.9, 1);
  box(M.stone, 5.2, 3.2, 7.6, 5.4, 2.05, 0.1, 1);
  box(M.dark, 1.4, 2.4, 0.1, 5.0, 1.65, 3.95, 1); // entrance door
  box(M.stone, 0.45, 7.6, 3.4, -8.3, 4.25, 2.2, 1); // tall fin wall (GL to FF lintel)
  for (let i = 0; i < 6; i++) box(M.dark, 0.06, 2.9, 0.16, -6.9 + i * 1.95, 1.9, 3.78, 1, { edges: false });
  box(M.dark, 0.25, 3.0, 0.25, 7.9, 1.95, 4.1, 1); // columns under cantilever
  box(M.dark, 0.25, 3.0, 0.25, 2.9, 1.95, 4.1, 1);

  // L2 — first floor slab (cantilever) with gold fascia
  box(M.plaster, 18.5, 0.42, 9.6, 0.4, 3.66, 0.3, 2);
  box(M.gold, 18.5, 0.06, 0.04, 0.4, 3.5, 5.12, 2, { edges: false });

  // L3 — first floor: plaster box with ribbon window + wood box with fins
  box(M.plaster, 9.6, 3.1, 7.8, 3.6, 5.42, -0.6, 3);
  box(M.glass, 8.2, 1.5, 0.12, 3.6, 5.5, 3.32, 3, { shadow: false });
  box(M.wood, 0.12, 1.5, 0.1, 3.6, 5.5, 3.36, 3, { edges: false });
  box(M.wood, 6.2, 3.1, 6.8, -4.6, 5.42, 0.2, 3);
  box(M.glass, 5.2, 2.4, 0.12, -4.6, 5.3, 3.62, 3, { shadow: false });
  for (let i = 0; i < 11; i++) box(M.wood, 0.14, 3.1, 0.34, -7.4 + i * 0.56, 5.42, 3.95, 3, { edges: i % 2 === 0 });
  box(M.dark, 3.4, 1.05, 0.06, 9.6, 4.4, 4.6, 3, { edges: true }); // balcony glass rail
  box(M.glass, 0.12, 1.4, 4.5, 8.42, 5.5, -0.5, 3, { shadow: false });

  // L4 — roof slabs, parapet, pergola
  box(M.plaster, 11.2, 0.3, 9.0, 3.6, 7.12, -0.4, 4);
  box(M.plaster, 7.2, 0.3, 7.8, -4.6, 7.12, 0.4, 4);
  box(M.gold, 11.2, 0.05, 0.04, 3.6, 7.0, 4.1, 4, { edges: false });
  for (let i = 0; i < 9; i++) box(M.wood, 0.12, 0.18, 4.4, -0.3 + i * 0.9, 7.6 + 0.0, -1.6, 4, { edges: i % 2 === 0 });
  box(M.dark, 0.14, 0.9, 0.14, -0.4, 7.4, 0.5, 4, { edges: false });
  box(M.dark, 0.14, 0.9, 0.14, 7.6, 7.4, 0.5, 4, { edges: false });

  // Landscape — low-poly trees
  const leafGeo = new THREE.IcosahedronGeometry(1.4, 0);
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 2.4, 6);
  [[-14, 0, 6, 1.2], [-15.5, 0, -3, 1.5], [13.5, 0, -4, 1.3], [14.5, 0, 6.5, 1.0], [-10.5, 0, 9.5, 0.8]].forEach(([x, , z, s], i) => {
    custom(trunkGeo, M.trunk, x, 1.2 * s, z, 0);
    const leaf = custom(leafGeo, M.leaf, x, 2.9 * s, z, 1, i);
    leaf.scale.setScalar(s);
    parts[parts.length - 1].base = leaf.position.clone();
  });

  // build order — bottom-up, sweeping left to right
  parts.forEach((p) => {
    p.delay = clamp01(p.base.y / 8) * 0.55 + clamp01((p.base.x + 16) / 32) * 0.15 + Math.random() * 0.05;
  });
  const center = new THREE.Vector3(0, 3.5, 0);

  /* ---------- Gold dust ---------- */
  const N = isMobile ? 350 : 800;
  const pos = new Float32Array(N * 3), spd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 70;
    pos[i * 3 + 1] = Math.random() * 26;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 70;
    spd[i] = 0.2 + Math.random() * 0.6;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xe6c88f, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.7,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ---------- Post-processing ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.6, 0.92);
  if (isMobile) bloom.resolution.set(innerWidth / 2, innerHeight / 2);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- State ---------- */
  const cur = {}; // live, lerped mode values
  const tmpC = new THREE.Color();
  const tmpV = new THREE.Vector3();
  const colorKeys = ["skyTop", "skyBottom", "horizon", "ground", "grid", "line", "sun"];
  const numKeys = ["gridOpacity", "lineOpacity", "solid", "glow", "sunI", "hemiI", "exposure", "bloom", "fog"];
  let target = MODES.golden;
  colorKeys.forEach((k) => (cur[k] = new THREE.Color(target[k])));
  numKeys.forEach((k) => (cur[k] = target[k]));
  cur.sunPos = new THREE.Vector3(...target.sunPos);

  const state = {
    mode: "golden",
    build: 0, buildTarget: 0, buildStart: null, buildDur: 5200,
    explode: 0, explodeTarget: 0,
    view: 0,        // 0 = hero, 1 = about, 2 = aerial (contact)
    mouse: new THREE.Vector2(), mouseS: new THREE.Vector2(),
    drag: 0, dragV: 0,
    hidden: false,
  };

  // camera keyframes: radius, azimuth, elevation, target x/y, look offset
  const VIEWS = [
    { r: isMobile ? 62 : 50, az: 0.62, el: 0.2, tx: isMobile ? 0 : -0.28, ty: isMobile ? -1 : 4.2 },
    { r: isMobile ? 52 : 36, az: -0.55, el: 0.14, tx: isMobile ? 0 : 0.22, ty: isMobile ? 0 : 3.6 },
    { r: 58, az: 1.25, el: 0.62, tx: 0, ty: 1.5 },
  ];
  const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3();

  function viewAt(v) {
    const i = Math.min(Math.floor(v), VIEWS.length - 2);
    const t = easeIO(clamp01(v - i));
    const a = VIEWS[i], b = VIEWS[i + 1];
    return { r: lerp(a.r, b.r, t), az: lerp(a.az, b.az, t), el: lerp(a.el, b.el, t), tx: lerp(a.tx, b.tx, t), ty: lerp(a.ty, b.ty, t) };
  }

  /* ---------- Public API ---------- */
  function setMode(name) {
    if (!MODES[name]) return;
    state.mode = name;
    target = MODES[name];
  }
  function startBuild() {
    state.build = 0; state.buildStart = performance.now();
  }
  function setExplode(on) { state.explodeTarget = on ? 1 : 0; }
  function setView(v) { state.view = v; }

  addEventListener("pointermove", (e) => {
    state.mouse.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  });
  // drag on empty canvas area to spin the model
  let dragging = false, lastX = 0;
  addEventListener("pointerdown", (e) => {
    if (e.target !== canvas && !e.target.closest("[data-drag]")) return;
    dragging = true; lastX = e.clientX;
  });
  addEventListener("pointerup", () => (dragging = false));
  addEventListener("pointermove", (e) => {
    if (!dragging) return;
    state.dragV += (e.clientX - lastX) * 0.0045; lastX = e.clientX;
  });

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  }
  addEventListener("resize", resize);

  /* ---------- Loop ---------- */
  const clock = new THREE.Clock();
  let elapsed = 0;
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (state.hidden) { requestAnimationFrame(frame); return; }
    elapsed += dt;
    const k = 1 - Math.pow(0.0015, dt); // smoothing factor

    // mode lerp
    colorKeys.forEach((key) => cur[key].lerp(tmpC.set(target[key]), k));
    numKeys.forEach((key) => (cur[key] = lerp(cur[key], target[key], k)));
    cur.sunPos.lerp(tmpV.set(...target.sunPos), k * 0.6);

    skyU.top.value.copy(cur.skyTop); skyU.bottom.value.copy(cur.skyBottom); skyU.horizon.value.copy(cur.horizon);
    skyU.sunDir.value.copy(cur.sunPos).normalize();
    scene.fog.color.copy(cur.skyBottom); scene.fog.density = cur.fog;
    groundMat.color.copy(cur.ground);
    gridU.color.value.copy(cur.grid);
    gridU.opacity.value = cur.gridOpacity;
    lineMat.color.copy(cur.line);
    sun.color.copy(cur.sun); sun.intensity = cur.sunI; sun.position.copy(cur.sunPos);
    hemi.intensity = cur.hemiI;
    renderer.toneMappingExposure = cur.exposure;
    bloom.strength = cur.bloom;
    M.glass.emissiveIntensity = cur.glow * 0.55;
    M.water.emissiveIntensity = cur.glow * 0.18;
    interior.intensity = cur.glow * 5;
    dustMat.opacity = 0.35 + cur.glow * 0.12;

    // build progress
    if (state.buildStart !== null) state.build = clamp01((performance.now() - state.buildStart) / state.buildDur);
    const B = state.build;
    gridU.reveal.value = ease(clamp01(B * 2.2));

    state.explode = lerp(state.explode, state.explodeTarget, 1 - Math.pow(0.02, dt));
    const E = easeIO(state.explode);

    let lineAlpha = 0;
    parts.forEach((p) => {
      const lt = ease(clamp01((B - p.delay * 0.55) / 0.22));            // line draw-in
      const st = ease(clamp01((B - 0.42 - p.delay * 0.5) / 0.22));      // solid rise
      p.g.visible = lt > 0.001;
      const drop = (1 - lt) * 3.5;
      p.g.position.set(
        p.base.x + (p.base.x - center.x) * 0.3 * E,
        p.base.y + drop + p.level * 3.8 * E,
        p.base.z + (p.base.z - center.z) * 0.3 * E
      );
      const sv = Math.max(st, 0.0001);
      if (p.kind === "box") {
        p.mesh.scale.set(p.w, p.h * sv, p.d);
        p.mesh.position.y = -p.h * (1 - sv) / 2;      // grow up from its base
      } else p.mesh.scale.setScalar(sv);
      p.mesh.visible = st > 0.002 && cur.solid > 0.01;
      if (p.lines) p.lines.visible = lt > 0.001;
      lineAlpha = Math.max(lineAlpha, lt);
    });
    // shared materials: opacity follows the mode (ghosted in blueprint)
    const solidNow = cur.solid;
    solidMats.forEach((m) => {
      m.opacity = solidNow;
      const t = solidNow < 0.995;
      if (m.transparent !== t) { m.transparent = t; m.depthWrite = !t; m.needsUpdate = true; }
    });
    const builtSolid = ease(clamp01((B - 0.5) / 0.5));
    lineMat.opacity = Math.min(1, lerp(0.95, cur.lineOpacity, builtSolid * Math.min(1, cur.solid * 1.2)) * lineAlpha + E * 0.45);

    // dust drift
    const arr = dustGeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] += spd[i] * dt * 0.35;
      arr[i * 3] += Math.sin(elapsed * 0.3 + i) * dt * 0.05;
      if (arr[i * 3 + 1] > 26) arr[i * 3 + 1] = 0;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // camera
    state.drag += state.dragV; state.dragV *= 0.92;
    state.mouseS.lerp(state.mouse, 1 - Math.pow(0.02, dt));
    const v = viewAt(state.view);
    const auto = reduced ? 0 : elapsed * 0.035;
    const az = v.az + auto + state.drag + state.mouseS.x * 0.12;
    const el = v.el + state.mouseS.y * 0.05 + E * 0.12;
    const r = v.r + E * 14;
    camTarget.set(0, v.ty, 0);
    camPos.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r + v.ty, Math.cos(az) * Math.cos(el) * r);
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    // shift the building sideways in screen space (keeps text readable)
    camera.setViewOffset(innerWidth, innerHeight, v.tx * innerWidth, 0, innerWidth, innerHeight);

    if (lite) renderer.render(scene, camera); else composer.render();
    adapt(dt);
    requestAnimationFrame(frame);
  }

  // adaptive quality — drop bloom/shadows/resolution on slow devices
  let lite = /[?&]lite\b/.test(location.search), fpsT = 0, fpsN = 0, adapted = false;
  function adapt(dt) {
    if (adapted) return;
    fpsT += dt; fpsN++;
    if (fpsT < 2.5) return;
    adapted = true;
    const fps = fpsN / fpsT;
    if (fps < 28) {
      lite = true;
      renderer.shadowMap.enabled = false;
      renderer.setPixelRatio(1);
      solidMats.forEach((m) => (m.needsUpdate = true));
      resize();
    }
  }
  if (lite) { renderer.shadowMap.enabled = false; renderer.setPixelRatio(1); }
  requestAnimationFrame(frame);

  document.addEventListener("visibilitychange", () => (state.hidden = document.hidden));

  return {
    setMode, startBuild, setExplode, setView,
    get mode() { return state.mode; },
    get exploded() { return state.explodeTarget === 1; },
    setPaused(p) { state.hidden = p; },
  };
}
