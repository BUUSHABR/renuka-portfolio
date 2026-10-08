/* ==========================================================================
   Study models — one procedural 3D model per project, interpreted from the
   renders and drawings. Units ≈ metres. Each builder returns a THREE.Group.
   To use a real exported model instead, set `modelFile` on the project in
   data.js (a .glb exported from SketchUp/Blender) — see README.
   ========================================================================== */
import * as THREE from "three";

export function makeKit() {
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...o });
  const M = {
    white: std(0xece6db), concrete: std(0xbfb8ad), grey: std(0x8f8a83), dark: std(0x2a2725, { roughness: 0.5, metalness: 0.4 }),
    glass: std(0x2f4656, { roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.82 }),
    blue: std(0x3f6f93, { roughness: 0.06, metalness: 0.7 }),
    wood: std(0x9a6a42, { roughness: 0.6 }), woodDark: std(0x6b4630, { roughness: 0.6 }),
    stone: std(0xa99b86), brick: std(0x8e3b26, { roughness: 0.9 }), rust: std(0xa4532c, { roughness: 0.55, metalness: 0.3 }),
    green: std(0x55703a, { flatShading: true }), lawn: std(0x6d8a45), trunk: std(0x4a3626),
    red: std(0xc23b2a), yellow: std(0xe0a526), orange: std(0xd26a2b), maroon: std(0x7a2a24),
    pink: std(0xeab3b6, { emissive: 0xeab3b6, emissiveIntensity: 0.25 }), mint: std(0xa6d8c6, { emissive: 0xa6d8c6, emissiveIntensity: 0.25 }),
    pastel: std(0xeee3d6), gold: std(0xc9a46a, { roughness: 0.3, metalness: 0.9 }),
    fabric: std(0xd8c3a2, { roughness: 1 }), cream: std(0xf3ece0, { roughness: 0.95 }),
    marble: std(0xf2ede5, { roughness: 0.25 }), brown: std(0x5a3d2b), black: std(0x111111, { roughness: 0.3 }),
    road: std(0x55514c), warm: std(0xffd59a, { emissive: 0xffc070, emissiveIntensity: 1.2 }),
  };
  const lineMat = new THREE.LineBasicMaterial({ color: 0xc9a46a, transparent: true, opacity: 0.32 });
  const parts = [];

  /** add a geometry so its BASE sits at y (pivot at base → grows upward when built) */
  function part(parent, geo, mat, x, y, z, o = {}) {
    geo.computeBoundingBox();
    geo.translate(0, -geo.boundingBox.min.y, 0);
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    if (o.ry) pivot.rotation.y = o.ry;
    if (o.rx) pivot.rotation.x = o.rx;
    if (o.rz) pivot.rotation.z = o.rz;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = !(mat.opacity < 1); mesh.receiveShadow = true;
    pivot.add(mesh);
    if (o.edges !== false) pivot.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), lineMat));
    parent.add(pivot);
    parts.push(pivot);
    return pivot;
  }
  const box = (p, m, w, h, d, x, y, z, o) => part(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, o);
  const cyl = (p, m, rt, rb, h, x, y, z, o = {}) => part(p, new THREE.CylinderGeometry(rt, rb, h, o.seg || 20, 1, false, o.ts || 0, o.tl || Math.PI * 2), m, x, y, z, o);
  /** extrude a 2D outline (array of [x,y]) by depth along +z, then lay flat if o.flat */
  function extrude(p, m, pts, depth, x, y, z, o = {}) {
    const s = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b)));
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 24 });
    if (o.flat) g.rotateX(-Math.PI / 2);
    return part(p, g, m, x, y, z, o);
  }
  function tree(p, x, z, s = 1) {
    cyl(p, M.trunk, 0.12 * s, 0.18 * s, 2.2 * s, x, 0, z, { edges: false, seg: 6 });
    part(p, new THREE.IcosahedronGeometry(1.4 * s, 0), M.green, x, 1.6 * s, z, { edges: false });
  }
  function palm(p, x, z, s = 1) {
    cyl(p, M.trunk, 0.12 * s, 0.2 * s, 5 * s, x, 0, z, { edges: false, seg: 6 });
    part(p, new THREE.ConeGeometry(1.6 * s, 0.8 * s, 7), M.green, x, 4.8 * s, z, { edges: false });
  }
  /** instanced repeat of a box (no edges) — chairs etc. */
  function instanced(p, m, w, h, d, positions) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);
    const im = new THREE.InstancedMesh(g, m, positions.length);
    const mx = new THREE.Matrix4();
    positions.forEach(([x, y, z, ry = 0], i) => im.setMatrixAt(i, mx.makeRotationY(ry).setPosition(x, y, z)));
    im.castShadow = im.receiveShadow = true;
    const pivot = new THREE.Group();
    pivot.add(im);
    p.add(pivot);
    parts.push(pivot);
    return pivot;
  }
  return { M, lineMat, parts, part, box, cyl, extrude, tree, palm, instanced };
}

/* --------------------------------------------------------------------------
   01 — Contemporary residence (stacked cantilevers, wood tower, glass rails)
   -------------------------------------------------------------------------- */
function residence(k) {
  const g = new THREE.Group(), { M, box, tree } = k;
  box(g, M.white, 30, 0.4, 20, 0, 0, 0);
  box(g, M.grey, 26, 1.7, 0.35, -1, 0.4, 9.2);
  for (let i = 0; i < 16; i++) box(g, M.wood, 0.12, 1.3, 0.1, -12.5 + i * 1.6, 0.55, 9.42, { edges: false });
  // ground floor
  box(g, M.white, 16, 3.4, 10, -2, 0.4, -1);
  box(g, M.glass, 13, 2.8, 0.12, -2.5, 0.6, 4.05, { edges: false });
  box(g, M.stone, 3, 3.4, 1.4, -8.5, 0.4, 4.4);
  box(g, M.dark, 0.3, 3.4, 0.3, 4.5, 0.4, 5.5);
  // first-floor cantilever slab + glass rail + planters
  box(g, M.white, 20, 0.5, 12.5, -1.5, 3.8, 0.2);
  box(g, M.glass, 18, 1.1, 0.08, -2, 4.3, 6.2, { edges: false });
  box(g, M.green, 18, 0.5, 0.6, -2, 4.3, 5.7, { edges: false });
  // first-floor volume
  box(g, M.white, 12, 3, 8, -3, 4.3, -2);
  box(g, M.wood, 2.6, 3, 0.25, -7.5, 4.3, 2.1);
  box(g, M.stone, 2, 3, 0.25, -1.5, 4.3, 2.1);
  box(g, M.glass, 4.2, 2.4, 0.12, 1.8, 4.5, 2.05, { edges: false });
  // second floor + roof
  box(g, M.white, 14, 0.45, 9, -3, 7.3, -2.5);
  box(g, M.glass, 13, 1, 0.08, -3, 7.75, 1.95, { edges: false });
  box(g, M.green, 12, 0.45, 0.5, -3, 7.75, 1.5, { edges: false });
  box(g, M.white, 7, 2.8, 6, -5, 7.75, -3.5);
  box(g, M.wood, 2, 2.8, 0.2, -7.2, 7.75, -0.45);
  box(g, M.white, 9.5, 0.35, 7.5, -5, 10.55, -3.4);
  // wood-clad tower
  box(g, M.white, 4.4, 11.6, 7.4, 8.4, 0.4, -1.2);
  box(g, M.wood, 3.2, 10, 0.25, 8.1, 0.9, 2.62);
  box(g, M.glass, 0.7, 9.6, 0.15, 9.9, 1.1, 2.66, { edges: false });
  box(g, M.white, 4.9, 0.45, 7.9, 8.4, 12, -1.2);
  box(g, M.white, 2.2, 8.4, 5, 12, 0.4, -1.2);
  box(g, M.glass, 0.5, 6.8, 0.15, 12, 1, 1.35, { edges: false });
  tree(g, -13, 6.5, 1.1); tree(g, 14, 6, 0.9); tree(g, -13.5, -6, 1.3); tree(g, 3, 7.5, 0.7);
  return g;
}

/* --------------------------------------------------------------------------
   02 — Hotel (L-shaped, blue-glass banquet floor in concrete frame, louvers)
   -------------------------------------------------------------------------- */
function hotel(k) {
  const g = new THREE.Group(), { M, box, tree } = k;
  box(g, M.lawn, 50, 0.3, 44, 0, 0, 0, { edges: false });
  const wing = (L, D, x, z, ry) => {
    const w = new THREE.Group();
    w.position.set(x, 0.3, z); w.rotation.y = ry; g.add(w);
    // stilt / lobby
    box(w, M.glass, L - 1.2, 3.2, D - 1.2, 0, 0, 0, { edges: false });
    for (let i = 0; i <= 5; i++) box(w, M.dark, 0.5, 3.2, 0.5, -L / 2 + 0.6 + i * ((L - 1.2) / 5), 0, D / 2 - 0.6, { edges: false });
    // floors 1–2
    box(w, M.concrete, L, 6.6, D, 0, 3.2, 0);
    for (let f = 0; f < 2; f++) for (let i = 0; i < 6; i++)
      box(w, M.dark, 1.6, 1.8, 0.12, -L / 2 + 2.2 + i * ((L - 4.4) / 5), 4.2 + f * 3.3, D / 2 + 0.02, { edges: false });
    for (let i = 0; i < 14; i++) box(w, M.wood, 0.14, 5.6, 0.25, -L / 4 + i * 0.55, 3.7, D / 2 + 0.25, { edges: false });
    // banquet floor: blue glass in a thick frame
    box(w, M.blue, L - 1.4, 3.3, D - 1.4, 0, 9.8, 0, { edges: false });
    box(w, M.concrete, L + 0.8, 0.7, D + 0.8, 0, 13.1, 0);
    box(w, M.concrete, 0.7, 3.3, D + 0.8, -L / 2, 9.8, 0);
    box(w, M.concrete, L + 0.8, 0.5, D + 0.8, 0, 9.5, 0);
    // parapet with louvers
    box(w, M.concrete, L, 1.5, D, 0, 13.8, 0);
    for (let i = 0; i < 10; i++) box(w, M.wood, 0.12, 1.1, 0.12, -L / 2 + 1 + i * ((L - 2) / 9), 14, D / 2 + 0.06, { edges: false, rz: (i % 2 ? 0.4 : -0.4) });
    return w;
  };
  wing(24, 11, -6, 6, 0);
  wing(22, 11, 11.5, -6.5, Math.PI / 2);
  // corner glass box + logo + entrance canopy
  box(g, M.blue, 7, 7.5, 7, 6.5, 6.8, 6.6);
  k.cyl(g, M.gold, 1.1, 1.1, 0.15, 6.5, 12, 10.2, { rx: Math.PI / 2, edges: false });
  box(g, M.dark, 12, 0.35, 4, -6, 3.3, 13.2);
  box(g, M.marble, 8, 0.6, 3, -6, 0.3, 13);
  tree(g, -20, 15, 1); tree(g, 20, 14, 1.2); tree(g, -21, -10, 1.1); tree(g, 0, 18, 0.8);
  return g;
}

/* --------------------------------------------------------------------------
   03 — Kalyana mandapam (curved canopy on tapered columns, finned hall)
   -------------------------------------------------------------------------- */
function mandapam(k) {
  const g = new THREE.Group(), { M, box, cyl, extrude, palm } = k;
  box(g, M.road, 56, 0.3, 46, 0, 0, 0, { edges: false });
  // stilt floor (dark, recessed) + first-floor hall with white fins
  box(g, M.dark, 38, 4, 17, 6, 0.3, -6);
  for (let i = 0; i < 14; i++) box(g, M.white, 0.9, 4, 0.9, -12 + i * 2.8, 0.3, 2.6, { edges: false });
  box(g, M.white, 40, 0.6, 19, 6, 4.3, -6);
  box(g, M.white, 40, 5, 18, 6, 4.9, -6.5);
  box(g, M.glass, 37, 2.6, 0.12, 6, 5.9, 2.55, { edges: false });
  for (let i = 0; i < 16; i++) box(g, M.white, 0.35, 5, 1.1, -13 + i * 2.6, 4.9, 3, { edges: false, ry: 0.35 });
  box(g, M.warm, 40, 0.08, 0.08, 6, 9.8, 2.6, { edges: false });
  // sheet roof (shallow gable)
  box(g, M.grey, 40, 0.25, 10, 6, 9.9, -2.2, { rx: -0.16 });
  box(g, M.grey, 40, 0.25, 10, 6, 9.9, -10.8, { rx: 0.16 });
  // curved entrance canopy
  const pts = [];
  for (let a = 0; a <= 32; a++) { const t = (a / 32) * Math.PI * 2; pts.push([Math.cos(t) * 9, Math.sin(t) * 6.5]); }
  extrude(g, M.white, pts, 1.1, -14, 7.4, 8, { flat: true });
  extrude(g, M.gold, pts.map(([x, y]) => [x * 0.86, y * 0.86]), 0.06, -14, 7.35, 8, { flat: true, edges: false });
  [[-21, 6], [-7, 6], [-19, 11.5], [-9, 11.5], [-14, 13.5], [-14, 3]].forEach(([x, z]) =>
    cyl(g, M.white, 0.35, 0.75, 7.4, x, 0.3, z, { seg: 10 }));
  box(g, M.white, 11, 4.2, 0.7, -14, 8.5, 3.3);
  box(g, M.gold, 7, 0.5, 0.1, -14, 10.2, 3.68, { edges: false });
  box(g, M.marble, 14, 0.4, 9, -14, 0.3, 8, { edges: false });
  palm(g, -26, 12, 1); palm(g, 2, 9, 1.1); palm(g, 12, 9, 0.9); palm(g, 22, 8.5, 1); palm(g, -26, -4, 1.1);
  return g;
}

/* --------------------------------------------------------------------------
   04 — School (brick G+2, concrete top floor, colour-fin feature, courtyard)
   -------------------------------------------------------------------------- */
function school(k) {
  const g = new THREE.Group(), { M, box, cyl, tree } = k;
  box(g, M.lawn, 60, 0.3, 58, 0, 0, -10, { edges: false });
  // front block
  box(g, M.brick, 26, 10.5, 12, 0, 0.3, 0);
  box(g, M.concrete, 20, 3.4, 10, 2, 10.8, -0.5);
  for (let i = 0; i < 6; i++) box(g, M.dark, 0.9, 0.9, 0.1, -5 + i * 2.8, 12.2, 4.55, { edges: false });
  // colour fin feature in black frame
  box(g, M.dark, 11, 6.4, 1, -2, 4.6, 6.4);
  const cols = [M.red, M.yellow, M.orange, M.maroon];
  for (let i = 0; i < 22; i++) box(g, cols[i % 4], 0.3, 5.6, 0.2, -6.9 + i * 0.47, 5, 7, { edges: false });
  // glazed ground floor + entrance porch frame
  box(g, M.glass, 10, 3, 0.12, -2, 0.6, 6.05, { edges: false });
  box(g, M.concrete, 0.9, 5.4, 6, -6.8, 0.3, 9);
  box(g, M.concrete, 0.9, 5.4, 6, 2.8, 0.3, 9);
  box(g, M.concrete, 10.5, 0.9, 6, -2, 5.7, 9);
  for (let i = 0; i < 6; i++) box(g, cols[i % 4], 0.22, 4.4, 0.2, -6.1 + i * 0.3, 0.6, 11.4, { edges: false });
  // slot windows + sign
  [-11, -9.5, 9.5, 11].forEach((x) => box(g, M.dark, 0.5, 4, 0.1, x, 2.5, 6.02, { edges: false }));
  cyl(g, M.gold, 0.9, 0.9, 0.12, 8, 6.5, 6.1, { rx: Math.PI / 2, edges: false });
  // courtyard wings
  box(g, M.brick, 10, 10.5, 30, -18, 0.3, -15);
  box(g, M.brick, 10, 10.5, 30, 18, 0.3, -15);
  box(g, M.concrete, 46, 7, 8, 0, 0.3, -33);
  for (let i = 0; i < 8; i++) { box(g, M.dark, 0.1, 1.4, 1.6, -12.98, 2 + (i % 3) * 3.3, -6 - Math.floor(i / 3) * 8, { edges: false }); }
  // roundabout lawn
  cyl(g, M.lawn, 5, 5, 0.5, -2, 0.3, 19, { seg: 32 });
  tree(g, -2, 19, 0.9); tree(g, -24, 12, 1.2); tree(g, 22, 12, 1); tree(g, 0, -18, 1.3);
  return g;
}

/* --------------------------------------------------------------------------
   05 — Shuttle court (ACP box, copper triangle panels, Advaita gate)
   -------------------------------------------------------------------------- */
function court(k) {
  const g = new THREE.Group(), { M, box, extrude, tree } = k;
  box(g, M.marble, 44, 0.3, 54, 0, 0, -4, { edges: false });
  // hall: front profile with chamfered top corners, extruded back
  extrude(g, M.concrete, [[-11, 0], [11, 0], [11, 9], [9, 10.5], [-9, 10.5], [-11, 9]], 32, 0, 0.3, -24, { rx: 0 });
  // copper triangles — front (z = 8) and side (x = 11)
  const triF = (pts, z) => extrude(g, M.rust, pts, 0.18, 0, 0.3, z, { edges: true });
  triF([[-10.4, 8.6], [-1, 8.6], [-6, 2.6]], 8);
  triF([[1, 2.4], [10.4, 2.4], [6.2, 8.8]], 8);
  const side = new THREE.Group(); side.position.set(11.05, 0.3, -8); side.rotation.y = Math.PI / 2; g.add(side);
  extrude(side, M.rust, [[-15, 8.6], [-2, 8.6], [-8, 2]], 0.18, 0, 0, 0);
  extrude(side, M.rust, [[0, 2.2], [14.5, 2.2], [9, 9]], 0.18, 0, 0, 0);
  // panel joint lines
  const lines = [];
  for (let i = 0; i < 9; i++) { const x = -10 + i * 2.5; lines.push(x, 0.3, 8.05, x + (i % 2 ? 1.2 : -0.8), 9.3, 8.05); }
  for (let i = 0; i < 12; i++) { const z = 6 - i * 2.6; lines.push(11.05, 0.3, z, 11.05, 9.3, z + (i % 2 ? 1 : -1)); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  const ls = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x6d655c }));
  const lp = new THREE.Group(); lp.add(ls); g.add(lp); k.parts.push(lp);
  // compound wall with grilles + gate portal
  box(g, M.concrete, 30, 2, 0.5, -3, 0.3, 17);
  for (let i = 0; i < 7; i++) box(g, M.dark, 1.6, 1.2, 0.1, -15 + i * 3.6, 0.6, 17.3, { edges: false });
  box(g, M.brick, 2.6, 9, 2.2, 13, 0.3, 17);
  box(g, M.concrete, 13, 1.3, 1.6, 19, 8.2, 17);
  box(g, M.concrete, 0.9, 8, 1.4, 25, 0.3, 17);
  box(g, M.dark, 9.6, 3.2, 0.2, 19.3, 0.3, 17.1, { edges: false });
  k.cyl(g, M.gold, 0.7, 0.7, 0.1, 13, 5, 18.15, { rx: Math.PI / 2, edges: false });
  tree(g, -18, 12, 1); tree(g, -16, -20, 1.2); tree(g, 18, -15, 1.1);
  return g;
}

/* --------------------------------------------------------------------------
   06 — Classical bedroom (cut-away room)
   -------------------------------------------------------------------------- */
function bedroom(k) {
  const g = new THREE.Group(), { M, box, cyl, part } = k;
  const W = 8, D = 7, H = 3.8;
  box(g, M.marble, W, 0.2, D, 0, 0, 0);
  box(g, M.fabric, 4.2, 0.04, 3.2, 0.6, 0.2, 0.6, { edges: false });
  // back wall: wood panelling + TV / mirror
  box(g, M.cream, W, H, 0.25, 0, 0.2, -D / 2);
  for (let i = 0; i < 4; i++) box(g, M.wood, 1.5, 2.6, 0.12, -2.8 + i * 1.9, 0.6, -D / 2 + 0.18);
  box(g, M.gold, W, 0.15, 0.12, 0, 3.4, -D / 2 + 0.2, { edges: false });
  // left wall: wardrobe with mirror panels
  box(g, M.cream, 0.25, H, D, -W / 2, 0.2, 0);
  box(g, M.wood, 0.7, 3.1, 4.2, -W / 2 + 0.47, 0.2, -0.6);
  for (let i = 0; i < 3; i++) box(g, M.glass, 0.05, 2.5, 1.1, -W / 2 + 0.84, 0.5, -1.9 + i * 1.3, { edges: false });
  // bed with arched tufted headboard
  box(g, M.brown, 2.4, 0.5, 2.6, 1.4, 0.2, -1.9);
  box(g, M.cream, 2.3, 0.3, 2.4, 1.4, 0.7, -1.85);
  box(g, M.brown, 2.8, 1.5, 0.25, 1.4, 0.2, -3.2);
  cyl(g, M.brown, 1.4, 1.4, 0.25, 1.4, 1.7, -3.2, { rx: Math.PI / 2, tl: Math.PI, ts: -Math.PI / 2, seg: 24 });
  [0.8, 2].forEach((x) => box(g, M.fabric, 0.8, 0.3, 0.4, x, 1, -2.8, { edges: false }));
  box(g, M.woodDark, 0.6, 0.6, 0.5, -0.3, 0.2, -2.9); box(g, M.woodDark, 0.6, 0.6, 0.5, 3.1, 0.2, -2.9);
  // armchairs + round table
  const chair = (x, z, ry) => { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c);
    box(c, M.fabric, 1, 0.45, 0.9, 0, 0.2, 0); box(c, M.fabric, 1, 0.9, 0.2, 0, 0.65, -0.4); box(c, M.brown, 0.15, 0.5, 0.9, -0.55, 0.45, 0); box(c, M.brown, 0.15, 0.5, 0.9, 0.55, 0.45, 0); };
  chair(0.2, 1.8, 0.5); chair(2.6, 1.8, -0.5);
  cyl(g, M.gold, 0.45, 0.45, 0.5, 1.4, 0.2, 2.1, { seg: 24 });
  // false ceiling frame + chandelier
  box(g, M.cream, W, 0.25, 0.8, 0, H, -D / 2 + 0.4); box(g, M.cream, 0.8, 0.25, D, -W / 2 + 0.4, H, 0);
  box(g, M.warm, W - 1, 0.04, 0.04, 0.4, H - 0.02, -D / 2 + 0.85, { edges: false });
  part(g, new THREE.TorusGeometry(0.7, 0.05, 8, 40).rotateX(Math.PI / 2), M.gold, 1.4, 2.9, -0.6, { edges: false });
  cyl(g, M.gold, 0.02, 0.02, 0.9, 1.4, 2.9, -0.6, { edges: false });
  return g;
}

/* --------------------------------------------------------------------------
   07 — Marriage hall interior (800 seats, stage, coffered ceiling)
   -------------------------------------------------------------------------- */
function hall(k) {
  const g = new THREE.Group(), { M, box, part, instanced } = k;
  const W = 30, D = 20, H = 6;
  box(g, M.marble, W, 0.25, D, 0, 0, 0);
  box(g, M.gold, 1.6, 0.03, D - 2, -2, 0.25, 1, { edges: false });
  // back wall with tall windows, left wall too
  box(g, M.cream, W, H, 0.3, 0, 0.25, -D / 2);
  for (let i = 0; i < 9; i++) box(g, M.glass, 2, 3.8, 0.1, -12 + i * 3, 0.8, -D / 2 + 0.2, { edges: false });
  box(g, M.cream, 0.3, H, D, -W / 2, 0.25, 0);
  for (let i = 0; i < 5; i++) box(g, M.glass, 0.1, 3.8, 2.2, -W / 2 + 0.2, 0.8, -7 + i * 3.6, { edges: false });
  // stage with gold backdrop
  box(g, M.woodDark, 7, 1, 12, 11, 0.25, -2);
  box(g, M.gold, 0.3, 4, 8, 14.3, 1.25, -2);
  box(g, M.cream, 0.3, 5, 10, 14.6, 0.25, -2);
  // chairs: two blocks either side of the aisle
  const seats = [], backs = [];
  for (let r = 0; r < 12; r++) for (let c = 0; c < 9; c++) for (const side of [-1, 1]) {
    const x = -13 + r * 1.75, z = side * (1.6 + c * 0.85) + 1;
    seats.push([x, 0.7, z]); backs.push([x - 0.26, 0.7, z]);
  }
  instanced(g, M.cream, 0.5, 0.08, 0.5, seats);
  instanced(g, M.cream, 0.08, 0.75, 0.5, backs);
  instanced(g, M.fabric, 0.06, 0.45, 0.06, seats.map(([x, , z]) => [x, 0.25, z]));
  // coffered ceiling grid (floating)
  for (let i = 0; i <= 5; i++) box(g, M.cream, 0.5, 0.35, D, -W / 2 + i * (W / 5), H, 0);
  for (let i = 0; i <= 4; i++) box(g, M.cream, W, 0.35, 0.5, 0, H, -D / 2 + i * (D / 4));
  for (let i = 0; i < 5; i++) box(g, M.gold, 4.4, 0.05, 3.6, -12 + i * 6, H - 0.03, -5, { edges: false });
  // chandeliers
  [-9, -1, 7].forEach((x) => {
    part(g, new THREE.TorusGeometry(0.9, 0.06, 8, 40).rotateX(Math.PI / 2), M.gold, x, 4.4, 1, { edges: false });
    part(g, new THREE.ConeGeometry(0.6, 1.2, 16).rotateX(Math.PI), M.warm, x, 4.2, 1, { edges: false });
  });
  return g;
}

/* --------------------------------------------------------------------------
   08 — Hospital reception (curved desk, pastel triangle ceiling, waiting)
   -------------------------------------------------------------------------- */
function clinic(k) {
  const g = new THREE.Group(), { M, box, extrude, cyl, instanced, tree } = k;
  const W = 14, D = 11, H = 3.8;
  box(g, M.marble, W, 0.2, D, 0, 0, 0);
  box(g, M.pastel, W, H, 0.25, 0, 0.2, -D / 2);
  box(g, M.pastel, 0.25, H, D, -W / 2, 0.2, 0);
  // accent wall panels + wood doors
  extrude(g, M.pink, [[0, 0], [2.2, 0], [1.1, 2.6]], 0.08, -4, 0.6, -D / 2 + 0.14, { edges: false });
  extrude(g, M.mint, [[0, 2.6], [2.2, 2.6], [1.1, 0]], 0.08, -2.6, 0.6, -D / 2 + 0.14, { edges: false });
  [-2, 1.5, 4.5].forEach((z) => box(g, M.wood, 0.1, 2.4, 1.1, -W / 2 + 0.18, 0.2, z));
  box(g, M.glass, 0.08, 2.8, 4, 3.5, 0.2, -3.4, { edges: false, ry: 0 });
  // curved reception desk (annular sector)
  const pts = [];
  for (let a = 0; a <= 20; a++) { const t = Math.PI * 0.15 + (a / 20) * Math.PI * 0.7; pts.push([Math.cos(t) * 2.6, Math.sin(t) * 2.6]); }
  for (let a = 20; a >= 0; a--) { const t = Math.PI * 0.15 + (a / 20) * Math.PI * 0.7; pts.push([Math.cos(t) * 1.9, Math.sin(t) * 1.9]); }
  extrude(g, M.wood, pts, 1.1, 1.5, 0.2, -1.2, { flat: true });
  extrude(g, M.marble, pts.map(([x, y]) => [x * 1.02, y * 1.02]), 0.06, 1.5, 1.3, -1.2, { flat: true, edges: false });
  // waiting chairs
  const s = [], b = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { s.push([-4 + c * 0.75, 0.62, 2 + r * 2]); b.push([-4 + c * 0.75, 0.62, 2.28 + r * 2]); }
  instanced(g, M.cream, 0.6, 0.12, 0.6, s);
  instanced(g, M.cream, 0.6, 0.6, 0.1, b);
  instanced(g, M.dark, 0.05, 0.42, 0.05, s.map(([x, , z]) => [x, 0.2, z]));
  // floating triangle ceiling panels
  const tri = (m, pts, x, z) => extrude(g, m, pts, 0.15, x, H, z, { flat: true, edges: false });
  tri(M.pink, [[0, 0], [4, 0], [2, -3]], -5, 1);
  tri(M.mint, [[0, -3], [4, -3], [2, 0]], -2.5, 0.5);
  tri(M.pink, [[0, 0], [3.4, 0], [1.7, -2.6]], 1, -2);
  tri(M.mint, [[0, -2.6], [3.4, -2.6], [1.7, 0]], 3.3, 3);
  cyl(g, M.brown, 0.35, 0.28, 0.6, 5.5, 0.2, 3.8, { edges: false });
  tree(g, 5.5, 3.8, 0.45);
  return g;
}

export const BUILDERS = { residence, hotel, mandapam, school, court, bedroom, hall, clinic };
