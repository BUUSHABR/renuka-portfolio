/* ==========================================================================
   Playground — small architectural Three.js toys tied to the content.
     brickWall()  Skills: each hover lays a brick (running bond); full wall
                  wobbles, collapses, and is redrawn.
     workshops()  Workshops: Community Build → village, Bamboo → tripod,
                  Vertical Studio → stacking tower.
     crane()      Studio & site: a tower crane lifts a floor onto a building
                  for every milestone hovered.
   Each returns a factory for views.addCustom plus a small control API.
   ========================================================================== */
import * as THREE from "three";

const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const back = (t) => { t = Math.min(1, Math.max(0, t)); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const lineMat = () => new THREE.LineBasicMaterial({ color: 0xc9a46a, transparent: true, opacity: 0.55 });
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });

function baseScene({ THREE: T, env }, camPos, look, fov = 30) {
  const scene = new T.Scene();
  scene.environment = env;
  scene.environmentIntensity = 0.4;
  scene.add(new T.HemisphereLight(0xfff6ea, 0x2a221c, 1.1));
  const sun = new T.DirectionalLight(0xfff1dc, 2.2);
  sun.position.set(-8, 14, 10);
  scene.add(sun);
  const camera = new T.PerspectiveCamera(fov, 1, 0.1, 200);
  camera.position.set(...camPos);
  camera.lookAt(...look);
  // faint ground disc with gold rim
  const ground = new T.Mesh(new T.CircleGeometry(7, 64), new T.MeshBasicMaterial({ color: 0xc9a46a, transparent: true, opacity: 0.06 }));
  ground.rotation.x = -Math.PI / 2;
  const rim = new T.Mesh(new T.RingGeometry(6.95, 7, 96), new T.MeshBasicMaterial({ color: 0xc9a46a, transparent: true, opacity: 0.5 }));
  rim.rotation.x = -Math.PI / 2; rim.position.y = 0.005;
  scene.add(ground, rim);
  return { scene, camera };
}
function edged(geo, mat, lm) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mat), new THREE.LineSegments(new THREE.EdgesGeometry(geo), lm));
  return g;
}

/* ---------------- Skills → brick wall ---------------- */
export function brickWall() {
  const api = { queue: 0 };
  api.factory = (ctx) => {
    const { scene, camera } = baseScene(ctx, [7, 5.2, 10], [0, 1.4, 0]);
    const lm = lineMat();
    const BW = 1.0, BH = 0.42, BD = 0.48, COLS = 5, ROWS = 6;
    const reds = [0x8e3b26, 0x9b4630, 0x7f3322, 0xa65136].map((c) => std(c, { roughness: 0.9 }));
    const slots = [];
    for (let r = 0; r < ROWS; r++) {
      const n = r % 2 ? COLS - 1 : COLS, off = r % 2 ? BW / 2 : 0;
      for (let c = 0; c < n; c++) slots.push(new THREE.Vector3(-((COLS - 1) * BW) / 2 + off + c * (BW + 0.03), BH / 2 + r * (BH + 0.03), 0));
    }
    const wall = new THREE.Group(); scene.add(wall);       // sways gently; bricks live inside
    const ghost = new THREE.Group(); wall.add(ghost);
    const gGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(BW, BH, BD));
    const gMat = new THREE.LineBasicMaterial({ color: 0xc9a46a, transparent: true, opacity: 0.25 });
    slots.forEach((p) => { const l = new THREE.LineSegments(gGeo, gMat); l.position.copy(p); ghost.add(l); });
    const geo = new THREE.BoxGeometry(BW, BH, BD);
    const bricks = [];
    let state = "build", stateT = 0;
    api.drop = () => {
      if (state !== "build" || bricks.length >= slots.length) return;
      const i = bricks.length;
      const b = edged(geo, reds[i % reds.length], lm);
      b.userData = { target: slots[i], t: 0 };
      b.position.copy(slots[i]).y += 5;
      b.rotation.z = (Math.random() - 0.5) * 0.8;
      wall.add(b); bricks.push(b);
    };
    const update = (dt, now) => {
      stateT += dt;
      wall.rotation.y = Math.sin(now * 0.0004) * 0.3;
      if (state === "build") {
        let all = bricks.length === slots.length;
        bricks.forEach((b) => {
          const u = b.userData;
          if (u.t >= 1) return;
          all = false;
          u.t = Math.min(1, u.t + dt * 2.2);
          b.position.set(u.target.x, u.target.y + (1 - back(u.t)) * 5, u.target.z);
          b.rotation.z *= 0.85;
          if (u.t >= 1) b.rotation.z = 0;
        });
        if (all) { state = "wobble"; stateT = 0; }
      } else if (state === "wobble") {
        const a = Math.sin(stateT * 22) * 0.06 * Math.min(1, stateT * 2);
        bricks.forEach((b) => (b.rotation.z = a * (b.userData.target.y / 2.5), b.position.x = b.userData.target.x + a * b.userData.target.y));
        if (stateT > 0.9) {
          state = "fall"; stateT = 0;
          bricks.forEach((b) => { b.userData.v = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3 + 1, Math.random() * 4); b.userData.spin = new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6); });
        }
      } else if (state === "fall") {
        bricks.forEach((b) => {
          const u = b.userData;
          u.v.y -= 14 * dt;
          b.position.addScaledVector(u.v, dt);
          if (b.position.y < BH / 2) { b.position.y = BH / 2; u.v.y *= -0.3; u.v.x *= 0.7; u.v.z *= 0.7; u.spin.multiplyScalar(0.6); }
          b.rotation.x += u.spin.x * dt; b.rotation.y += u.spin.y * dt; b.rotation.z += u.spin.z * dt;
          b.scale.setScalar(Math.max(0.001, 1 - Math.max(0, stateT - 1.2) * 2));
        });
        if (stateT > 1.8) { bricks.forEach((b) => wall.remove(b)); bricks.length = 0; state = "build"; }
      }
    };
    return { scene, camera, update };
  };
  return api;
}

/* ---------------- Workshops → village / bamboo / tower ---------------- */
export function workshops() {
  const api = { show: () => {} };
  api.factory = (ctx) => {
    const { scene, camera } = baseScene(ctx, [9, 6.5, 11], [0, 2, 0]);
    const lm = lineMat();
    const M = { white: std(0xece6db), roof: std(0x8e3b26), wood: std(0x9a6a42), bamboo: std(0xb59a55, { roughness: 0.6 }), node: std(0x6f5a2a), glass: std(0x3f5f75, { roughness: 0.1, metalness: 0.5 }), gold: std(0xc9a46a, { metalness: 0.9, roughness: 0.3 }) };
    const groups = [];
    // 0 — Community Build: village of houses on an arc
    const village = new THREE.Group();
    const roofShape = new THREE.Shape([new THREE.Vector2(-0.75, 0), new THREE.Vector2(0.75, 0), new THREE.Vector2(0, 0.7)].map((v) => v));
    for (let i = 0; i < 5; i++) {
      const h = new THREE.Group(), a = -1.0 + i * 0.5, R = 4.4;
      h.position.set(Math.sin(a) * R, 0, Math.cos(a) * R - 3);
      h.rotation.y = a;
      const body = edged(new THREE.BoxGeometry(1.5, 1.1, 1.3), M.white, lm); body.position.y = 0.55;
      const rg = new THREE.ExtrudeGeometry(roofShape, { depth: 1.45, bevelEnabled: false }); rg.translate(0, 0, -0.725);
      const roof = edged(rg, M.roof, lm); roof.position.y = 1.1;
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.6, 0.05), M.wood); door.position.set(0, 0.3, 0.66);
      h.add(body, roof, door);
      h.userData.d = i * 0.12;
      village.add(h);
    }
    // 1 — Bamboo: tripod + ring beam
    const bamboo = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.09, 0.11, 6, 10); poleGeo.translate(0, 3, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, p = new THREE.Group();
      p.position.set(Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6);
      p.lookAt(0, 5.6, 0); p.rotateX(Math.PI / 2);
      const pole = new THREE.Mesh(poleGeo, M.bamboo); p.add(pole);
      for (let n = 1; n < 6; n++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 6, 16), M.node); ring.rotation.x = Math.PI / 2; ring.position.y = n; p.add(ring); }
      p.userData.d = i * 0.1;
      bamboo.add(p);
    }
    const lash = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 8, 24), M.node); lash.rotation.x = Math.PI / 2; lash.position.y = 5.3; lash.userData.d = 0.75;
    const ringBeam = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.07, 8, 48), M.bamboo); ringBeam.rotation.x = Math.PI / 2; ringBeam.position.y = 2.6; ringBeam.userData.d = 0.65;
    bamboo.add(lash, ringBeam);
    // 2 — Vertical Studio: stacking tower
    const tower = new THREE.Group();
    for (let f = 0; f < 8; f++) {
      const fl = new THREE.Group(); fl.position.y = f * 0.85;
      const slab = edged(new THREE.BoxGeometry(2.4, 0.14, 2.4), M.white, lm); slab.position.y = 0.07;
      const core = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 2.1), M.glass); core.position.y = 0.49;
      fl.add(slab, core);
      fl.rotation.y = f * 0.12;
      fl.userData.d = f * 0.09;
      tower.add(fl);
    }
    const cap = edged(new THREE.BoxGeometry(2.6, 0.18, 2.6), M.gold, lm); cap.position.y = 8 * 0.85; cap.rotation.y = 8 * 0.12; cap.userData.d = 0.8; tower.add(cap);
    groups.push(village, bamboo, tower);
    groups.forEach((g, i) => { g.userData.t = i === 0 ? 1 : 0; g.userData.target = i === 0 ? 1 : 0; scene.add(g); });
    let current = 0;
    api.show = (i) => {
      if (i === current) { groups[i].userData.t = 0; return; }   // replay
      groups[current].userData.target = 0;
      groups[i].userData.target = 1; groups[i].userData.t = 0;
      current = i;
    };
    const update = (dt, now) => {
      groups.forEach((g, gi) => {
        const u = g.userData;
        if (u.target === 1) u.t = Math.min(1.6, u.t + dt * 0.9);
        const out = u.target === 0;
        g.visible = !(out && u.out >= 1);
        u.out = out ? Math.min(1, (u.out || 0) + dt * 3) : 0;
        g.rotation.y = Math.sin(now * 0.0003 + gi) * 0.3;
        g.children.forEach((c) => {
          const k = out ? 1 - ease(u.out) : back((u.t - c.userData.d) / 0.6);
          if (gi === 1 && c.geometry === undefined) c.scale.set(1, Math.max(0.001, k), 1);
          else c.scale.setScalar(Math.max(0.001, k));
        });
      });
    };
    return { scene, camera, update };
  };
  return api;
}

/* ---------------- Studio & site → tower crane ---------------- */
export function crane() {
  const api = { lift: () => {} };
  api.factory = (ctx) => {
    const { scene, camera } = baseScene(ctx, [19, 11, 23], [0.5, 5.2, 0], 32);
    const lm = lineMat();
    const M = { crane: std(0xd9a441, { roughness: 0.5, metalness: 0.2 }), dark: std(0x2a2725, { metalness: 0.4 }), white: std(0xece6db), glass: std(0x3f5f75, { roughness: 0.1, metalness: 0.5 }), conc: std(0xbfb8ad) };
    // mast (lattice look via edges)
    const mast = new THREE.Group(); mast.position.set(-2.5, 0, -1);
    for (let i = 0; i < 9; i++) { const seg = edged(new THREE.BoxGeometry(0.5, 1, 0.5), M.crane, lm); seg.position.y = 0.5 + i; mast.add(seg); }
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.4), M.conc); base.position.y = 0.15; mast.add(base);
    // slewing top: cab + jib + counter-jib
    const top = new THREE.Group(); top.position.y = 9; mast.add(top);
    const cab = edged(new THREE.BoxGeometry(0.7, 0.6, 0.7), M.dark, lm); cab.position.set(0.1, 0.3, 0.45); top.add(cab);
    const jib = edged(new THREE.BoxGeometry(8.5, 0.35, 0.35), M.crane, lm); jib.position.set(4.1, 0.75, 0); top.add(jib);
    const cj = edged(new THREE.BoxGeometry(3, 0.35, 0.35), M.crane, lm); cj.position.set(-1.6, 0.75, 0); top.add(cj);
    const cw = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.6), M.conc); cw.position.set(-2.6, 0.35, 0); top.add(cw);
    const apex = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.4, 4), M.crane); apex.position.set(0, 1.6, 0); top.add(apex);
    const trolley = new THREE.Group(); trolley.position.set(5, 0.55, 0); top.add(trolley);
    const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -1, 0)]), new THREE.LineBasicMaterial({ color: 0x2a2725 }));
    trolley.add(cable);
    const hook = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), M.dark); trolley.add(hook);
    scene.add(mast);
    // building being stacked + block pile
    const bPos = new THREE.Vector3(3, 0, 1.8);
    const floors = [];
    const floorGeo = new THREE.BoxGeometry(2.8, 0.9, 2.2);
    const makeFloor = () => {
      const f = new THREE.Group();
      const body = edged(floorGeo, M.white, lm); body.position.y = 0.45;
      const band = new THREE.Mesh(new THREE.BoxGeometry(2.84, 0.38, 2.24), M.glass); band.position.y = 0.5;
      f.add(body, band);
      return f;
    };
    const ground = makeFloor(); ground.position.copy(bPos); scene.add(ground); floors.push(ground);
    const pile = new THREE.Group(); pile.position.set(-5.5, 0, 3); scene.add(pile);
    const pileBlock = makeFloor(); pile.add(pileBlock);
    let carry = null;
    // motion plan
    const plan = [];
    let task = null, tt = 0;
    const slewAt = (p) => Math.atan2(-(p.z - mast.position.z), p.x - mast.position.x);
    const radAt = (p) => Math.hypot(p.x - mast.position.x, p.z - mast.position.z);
    const pickP = new THREE.Vector3(-5.5, 0, 3);
    let next = 1;
    api.lift = () => {
      if (plan.length > 12) return;
      if (next >= 7) { plan.push({ k: "reset" }); next = 1; return; }
      const lvl = next++;
      plan.push({ k: "slew", to: slewAt(pickP) }, { k: "trolley", to: radAt(pickP) }, { k: "hook", to: 8.5 },
        { k: "grab" }, { k: "hook", to: 3 }, { k: "slew", to: slewAt(bPos) }, { k: "trolley", to: radAt(bPos) },
        { k: "hook", to: 8.5 - lvl * 0.9 }, { k: "drop", lvl }, { k: "hook", to: 3 });
    };
    let slew = 0.6, trol = 5, hookD = 3;
    const update = (dt) => {
      if (!task && plan.length) { task = plan.shift(); tt = 0; task.from = task.k === "slew" ? slew : task.k === "trolley" ? trol : hookD; }
      if (task) {
        tt += dt;
        const dur = task.k === "slew" ? 0.9 : task.k === "trolley" ? 0.6 : task.k === "hook" ? 0.6 : 0.15;
        const k = ease(tt / dur);
        if (task.k === "slew") { let d = task.to - task.from; d = Math.atan2(Math.sin(d), Math.cos(d)); slew = task.from + d * k; }
        if (task.k === "trolley") trol = task.from + (task.to - task.from) * k;
        if (task.k === "hook") hookD = task.from + (task.to - task.from) * k;
        if (task.k === "grab" && !carry) { carry = makeFloor(); trolley.add(carry); }
        if (task.k === "drop" && carry) {
          trolley.remove(carry); carry = null;
          const f = makeFloor(); f.position.set(bPos.x, (task.lvl) * 0.9, bPos.z); scene.add(f); floors.push(f);
        }
        if (task.k === "reset") {
          floors.slice(1).forEach((f) => (f.userData.gone = true));
        }
        if (tt >= dur) task = null;
      } else slew += Math.sin(performance.now() * 0.0006) * dt * 0.05;
      // shrink & remove demolished floors
      for (let i = floors.length - 1; i > 0; i--) {
        const f = floors[i];
        if (!f.userData.gone) continue;
        f.scale.y -= dt * 3;
        if (f.scale.y <= 0.02) { scene.remove(f); floors.splice(i, 1); }
      }
      top.rotation.y = slew;
      trolley.position.x = Math.max(1, Math.min(8, trol));
      hook.position.y = -hookD;
      cable.geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -hookD, 0)]);
      if (carry) carry.position.set(0, -hookD - 1.05, 0);
    };
    return { scene, camera, update };
  };
  return api;
}
