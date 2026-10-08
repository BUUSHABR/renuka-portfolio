/* ==========================================================================
   UI, content rendering, scroll choreography
   Content lives in js/data.js — you normally never need to edit this file.
   ========================================================================== */
import * as vault from "./vault.js";
const D = window.PORTFOLIO;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pad2 = (n) => String(n).padStart(2, "0");
const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
const isMobile = matchMedia("(max-width: 820px)").matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// images may be "path.jpg" or { src, label }
const img = (x) => (typeof x === "string" ? { src: x.includes("/") ? x : `assets/sheets/${x}.jpg`, label: "" } : x);

D.projects.forEach((p, i) => (p.no = pad2(i + 1)));

/* ---------- Fill static content ---------- */
const P = D.person;
$("#heroPrefix").textContent = P.prefix;
const [first, ...rest] = P.name.split(" ");
$("#heroFirst").textContent = first;
$("#heroLast").textContent = rest.join(" ") + ".";
$("#heroRole").textContent = P.title;
$("#heroTag").textContent = P.tagline;
$("#yearsLabel").textContent = P.years;
vault.set($("#aboutPhoto"), P.photo);
$("#aboutIntro").textContent = P.intro;
$("#cvLink").href = P.cv;
$("#contactMail").textContent = P.email;
$("#contactMail").href = `mailto:${P.email}`;
$("#contactPhone").textContent = P.phone;
$("#contactPhone").href = `tel:${P.phone.replace(/\s/g, "")}`;
$("#contactWa").href = `https://wa.me/${P.whatsapp}`;
$("#contactLoc").textContent = P.location;
$("#yr").textContent = new Date().getFullYear();
$("#footName").textContent = P.name;
vault.set($("#contactPhoto"), P.photo);
$("#contactPhoto").alt = P.name;
$("#contactName").textContent = `${P.prefix} ${P.name}`;
$("#aboutPhoto").alt = P.name;

$("#stats").innerHTML = D.stats
  .map((s) => `<div class="stat"><b><span data-count="${s.value}">0</span><sup>${esc(s.suffix)}</sup></b><span>${esc(s.label)}</span></div>`)
  .join("");

$("#timeline").innerHTML = D.experience
  .map((e) => `<div class="tl-item reveal">
      <div class="tl-period mono">${esc(e.period)}</div>
      <div class="tl-role">${esc(e.role)}</div>
      <div class="tl-org">${esc(e.org)} <span>· ${esc(e.place)}</span></div>
      ${e.points.length ? `<ul class="tl-points">${e.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
    </div>`)
  .join("");
$("#workshops").innerHTML = D.workshops.map((w) => `<li><b>${esc(w.name)}</b><span>${esc(w.by)}<br>${esc(w.place)}</span></li>`).join("");
$("#skills").innerHTML = D.skills.map((s) => `<li>${esc(s)}</li>`).join("");
$("#langs").innerHTML = D.languages.map(esc).join("<i>·</i>");
const mq = D.software.map((s) => `<span>${esc(s)}</span>`).join("");
$("#marquee").innerHTML = mq + mq;

const counts = { all: D.projects.length, Architecture: 0, Interior: 0 };
D.projects.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
$("#countAll").textContent = pad2(counts.all);
$("#countArch").textContent = pad2(counts.Architecture);
$("#countInt").textContent = pad2(counts.Interior);

/* ---------- Works: reel + index ---------- */
$("#reelTrack").innerHTML = D.projects
  .map((p, i) => `<article class="card ${i % 3 === 1 ? "tall" : ""}" data-open="${i}" data-cat="${esc(p.category)}" data-cursor="view">
      <div class="card-media"><span class="card-num">${p.no}</span><span class="card-type mono">${esc(p.type)}</span>
        <img data-src="${esc(p.cover)}" alt="" loading="lazy" />
        <div class="card-model" data-model="${i}"><span class="mono">3D model · hover to explode</span></div></div>
      <div class="card-info"><h3>${esc(p.title)}</h3><span class="mono">${esc(p.location.split(",")[0])}</span></div>
    </article>`)
  .join("");
vault.hydrate($("#reelTrack"));
let views = null;
try {
  const { createViews } = await import("./views.js");
  views = createViews();
  $$(".card-model").forEach((el) => {
    const p = D.projects[+el.dataset.model];
    views.add(el, p.model, { file: p.modelFile, hoverExplode: true });
  });
} catch (e) { console.warn("models disabled", e); $$(".card-model").forEach((el) => el.remove()); }
$("#reel").insertAdjacentHTML("afterend", `<div class="reel-progress"><i id="reelBar"></i></div>`);

$("#index").innerHTML = D.projects
  .map((p, i) => `<li data-open="${i}" data-cat="${esc(p.category)}" data-img="${esc(p.cover)}">
      <span class="n">${p.no}</span><span class="t">${esc(p.title)}</span>
      <span class="l">${esc(p.location)}</span><span class="y">${esc(p.type)}</span>
      <span class="arrow">→</span></li>`)
  .join("");

/* ---------- Hero dimension ticker ---------- */
(() => {
  const el = $("#heroDim");
  const items = D.projects.map((p) => `${(p.facts[0] || ["", ""])[1]} · ${p.no}`);
  let i = 0;
  setInterval(() => {
    i = (i + 1) % items.length;
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = items[i]; el.style.opacity = 1; }, 250);
  }, 2600);
  el.style.transition = "opacity .25s";
})();

/* ---------- 3D scene ---------- */
let stage = null;
try {
  const { createScene } = await import("./scene.js");
  stage = createScene($("#stage"));
} catch (err) {
  console.warn("3D disabled:", err);
  document.body.classList.add("no-webgl");
  const c = $("#stage");
  c.outerHTML = `<div id="stage" style="position:fixed;inset:0;z-index:0;background:#0c0b0a center/cover;filter:brightness(.45)"></div>`;
  $("#studio").style.display = "none";
  vault.get(D.projects[0].cover).then((u) => u && ($("#stage").style.backgroundImage = `url(${u})`));
}

let userPickedMode = false;
function setMode(name, fromUser) {
  if (!stage) return;
  if (fromUser) userPickedMode = true;
  stage.setMode(name);
  $$(".studio-modes button").forEach((b) => {
    const on = b.dataset.mode === name;
    b.classList.toggle("active", on);
    b.setAttribute("aria-checked", on);
  });
}
$$(".studio-modes button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode, true)));
const explodeBtn = $("#explodeBtn");
function toggleExplode() {
  if (!stage) return;
  stage.setExplode(!stage.exploded);
  explodeBtn.classList.toggle("on", stage.exploded);
  explodeBtn.firstChild.textContent = stage.exploded ? "Assemble " : "Explode ";
}
explodeBtn.addEventListener("click", toggleExplode);
$("#rebuildBtn").addEventListener("click", () => stage && stage.startBuild());
addEventListener("keydown", (e) => {
  if (e.target.closest("input,textarea") || $("#project").classList.contains("open")) return;
  if (e.key === "e" || e.key === "E") toggleExplode();
  if (e.key === "r" || e.key === "R") stage && stage.startBuild();
  if (e.key === "1") setMode("blueprint", true);
  if (e.key === "2") setMode("golden", true);
  if (e.key === "3") setMode("night", true);
});

/* ---------- Loader ---------- */
await new Promise((res) => {
  const num = $("#loadNum");
  const imgs = [P.photo, D.projects[0].cover, D.projects[1].cover].map((src) => vault.get(src));
  let loaded = false;
  Promise.all([...imgs, document.fonts.ready]).then(() => (loaded = true));
  const t0 = performance.now();
  let shown = 0;
  const tick = () => {
    const t = (performance.now() - t0) / 1800;          // time-based, never frame-bound
    const goal = loaded ? Math.min(1, t) : Math.min(0.9, t * 0.9);
    shown += (goal - shown) * 0.25;
    if (loaded && t >= 1) shown = 1;
    num.textContent = Math.floor(shown * 100);
    if (shown >= 1) return res();
    setTimeout(tick, 30);
  };
  setTimeout(() => (loaded = true), 6000); // never block forever
  tick();
});
$("#loader").classList.add("done");
document.body.classList.remove("is-loading");
stage && stage.startBuild();

/* ---------- Smooth scroll ---------- */
gsap.registerPlugin(ScrollTrigger);
let lenis = null;
if (window.Lenis && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  lenis = new Lenis({ duration: 1.25, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const el = id === "#top" ? document.body : $(id);
    if (!el) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(el, { offset: 0, duration: 1.8 }) : el.scrollIntoView({ behavior: "smooth" });
  })
);

/* ---------- Hero intro ---------- */
gsap.from(".hero-title .line > *", { yPercent: 110, duration: 1.6, ease: "expo.out", stagger: 0.12, delay: 0.35 });
setTimeout(() => $("#studio").classList.add("ready"), 1400);
gsap.from(".hero-meta, .hero-tag, .hero-dim, .scroll-cue, .nav", { opacity: 0, y: 24, duration: 1.4, ease: "expo.out", stagger: 0.08, delay: 0.7 });

/* ---------- Scroll → camera & stage visibility ---------- */
const view = { hero: 0, contact: 0 };
const pushView = () => stage && stage.setView(view.contact > 0 ? 1 + view.contact : view.hero);
ScrollTrigger.create({
  trigger: "#about", start: "top bottom", end: "center center", scrub: true,
  onUpdate: (s) => { view.hero = s.progress; pushView(); },
});
ScrollTrigger.create({
  trigger: "#contact", start: "top bottom", end: "bottom bottom", scrub: true,
  onUpdate: (s) => { view.contact = s.progress; pushView(); },
  onEnter: () => !userPickedMode && setMode("night"),
  onLeaveBack: () => !userPickedMode && setMode("golden"),
});
const root = document.documentElement;
const setStage = (v) => {
  root.style.setProperty("--stage", v.toFixed(3));
  document.body.classList.toggle("stage-off", v < 0.2);
  stage && stage.setPaused(v < 0.02 && !$("#project").classList.contains("open") ? true : false);
};
ScrollTrigger.create({
  trigger: "#works", start: "top 80%", end: "top 10%", scrub: true,
  onUpdate: (s) => { if (view.contact === 0) setStage(1 - s.progress); },
});
ScrollTrigger.create({
  trigger: "#contact", start: "top 90%", end: "top 20%", scrub: true,
  onUpdate: (s) => setStage(s.progress),
});

// nav hide on scroll down
let lastY = 0;
const nav = $(".nav");
addEventListener("scroll", () => {
  const y = scrollY;
  nav.classList.toggle("scrolled", y > 60);
  nav.classList.toggle("hide", y > lastY && y > 400);
  lastY = y;
}, { passive: true });

/* ---------- Reveals & counters ---------- */
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  en.target.classList.add("in");
  $$("[data-count]", en.target).forEach((c) => {
    const o = { v: 0 };
    gsap.to(o, { v: +c.dataset.count, duration: 2.2, ease: "power3.out", onUpdate: () => (c.textContent = Math.round(o.v)) });
  });
  io.unobserve(en.target);
}), { threshold: 0.2 });
$$(".reveal").forEach((el) => io.observe(el));

gsap.utils.toArray(".display").forEach((el) =>
  gsap.from(el, { y: 60, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } })
);
gsap.from("#index li", { y: 30, opacity: 0, duration: 1, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: "#index", start: "top 85%" } });

/* ---------- Horizontal reel (desktop) ---------- */
let reelST = null;
function buildReel() {
  if (reelST) { reelST.kill(); reelST = null; gsap.set("#reelTrack", { x: 0 }); }
  if (isMobile) return;
  const track = $("#reelTrack");
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  reelST = ScrollTrigger.create({
    trigger: "#reel", start: "center center", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true,
    animation: gsap.to(track, { x: () => -dist(), ease: "none" }),
    onUpdate: (s) => gsap.set("#reelBar", { scaleX: s.progress }),
  });
  // gentle parallax inside each card
  $$(".card-media img", track).forEach((img) =>
    gsap.fromTo(img, { xPercent: -4 }, { xPercent: 4, ease: "none", scrollTrigger: { trigger: "#reel", start: "center center", end: () => "+=" + dist(), scrub: true } })
  );
}
buildReel();

/* ---------- Filters ---------- */
$$(".filters button").forEach((b) =>
  b.addEventListener("click", () => {
    $$(".filters button").forEach((x) => x.classList.toggle("active", x === b));
    const f = b.dataset.filter;
    $$("[data-cat]").forEach((el) => el.classList.toggle("hidden", f !== "all" && el.dataset.cat !== f));
    buildReel();
    ScrollTrigger.refresh();
  })
);

/* ---------- Index hover preview ---------- */
const hp = $("#hoverPreview"), hpImg = $("img", hp);
let hpX = 0, hpY = 0, hpTX = 0, hpTY = 0;
$$("#index li").forEach((li) => {
  li.addEventListener("mouseenter", () => { vault.set(hpImg, li.dataset.img); hp.classList.add("on"); });
  li.addEventListener("mouseleave", () => hp.classList.remove("on"));
});

/* ---------- Cursor ---------- */
const cur = $("#cursor"), curLabel = $("#cursorLabel");
let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; hpTX = mx + 30; hpTY = my - 120; });
gsap.ticker.add(() => {
  cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
  cur.style.transform = `translate(${cx}px, ${cy}px)`;
  hpX += (hpTX - hpX) * 0.12; hpY += (hpTY - hpY) * 0.12;
  hp.style.transform = `translate(${hpX}px, ${hpY}px) ${hp.classList.contains("on") ? "scale(1)" : "scale(.85)"}`;
});
document.addEventListener("pointerover", (e) => {
  const v = e.target.closest("[data-cursor='view'], #index li, .p-renders figure, .p-sheets figure, .p-next");
  const h = e.target.closest("a, button");
  cur.classList.toggle("is-view", !!v);
  cur.classList.toggle("is-hover", !v && !!h);
  curLabel.textContent = v ? (v.closest(".p-sheets, .p-renders") ? "Zoom" : v.classList.contains("p-next") ? "Next" : "View") : "";
});

// magnetic buttons
if (!isTouch) $$("[data-magnetic]").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.6, ease: "power3.out" });
  });
  el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1,0.4)" }));
});

/* ---------- Project overlay ---------- */
const proj = $("#project"), projScroll = $("#projectScroll");
projScroll.setAttribute("data-lenis-prevent", "");
let currentProject = -1;

function openProject(i) {
  const p = D.projects[i];
  const next = D.projects[(i + 1) % D.projects.length];
  currentProject = i;
  const renders = (p.renders || [p.cover]).map(img);
  const sheets = (p.sheets || []).map(img);
  projScroll.innerHTML = `
    <div class="p-hero"><img data-src="${esc(p.cover)}" alt="${esc(p.title)}" />
      <div class="p-hero-text">
        <div class="p-num">${p.no}</div>
        <h2 class="p-title">${esc(p.title)}</h2>
        <div class="p-sub mono"><span>${esc(p.location)}</span><span>${esc(p.type)}</span><span>${esc(p.category)}</span></div>
      </div></div>
    <div class="p-body">
      <div class="p-facts">${(p.facts || []).map(([k, v]) => `<div class="p-fact"><span class="mono">${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}
        <div class="p-fact"><span class="mono">Role</span><b>${esc(p.role || "Junior Architect")}</b></div></div>
      <div class="p-desc">${(p.description || []).map((t) => `<p>${esc(t)}</p>`).join("")}</div>
    </div>
    ${views && p.model ? `<div class="p-section-title"><h3>3D model</h3><span class="mono">Drag to rotate</span></div>
      <div class="p-model" id="pModel">
        <div class="p-model-ui">
          <div class="seg" role="radiogroup" aria-label="Lighting">
            <button data-m="blueprint">Blueprint</button><button data-m="day" class="on">Day</button><button data-m="night">Night</button>
          </div>
          <div class="seg">
            <button data-a="explode">Explode</button><button data-a="rebuild">Rebuild</button><button data-a="lines">Linework</button><button data-a="spin" class="on">Auto-rotate</button>
          </div>
        </div>
        <div class="p-model-note mono">Study model interpreted from the project renders &amp; drawings</div>
      </div>` : ""}
    ${renders.length > 1 ? `<div class="p-section-title"><h3>Views</h3><span class="mono">${pad2(renders.length)} renders</span></div>
      <div class="p-renders">${renders.map((r, k) => `<figure data-lb="r" data-k="${k}"><img data-src="${esc(r.src)}" alt="${esc(r.label)}" loading="lazy" />${r.label ? `<figcaption>${esc(r.label)}</figcaption>` : ""}</figure>`).join("")}</div>` : ""}
    ${sheets.length ? `<div class="p-section-title"><h3>Drawings</h3><span class="mono">${pad2(sheets.length)} sheets</span></div>
      <div class="p-sheets">${sheets.map((s, k) => `<figure data-lb="s" data-k="${k}"><img data-src="${esc(s.src)}" alt="${esc(s.label)}" loading="lazy" /><figcaption>${esc(s.label || pad2(k + 1))}</figcaption></figure>`).join("")}</div>` : ""}
    <a class="p-next" data-next="${(i + 1) % D.projects.length}"><span class="mono">Next project — ${next.no}</span><h4>${esc(next.title)}</h4><img data-src="${esc(next.cover)}" alt="" loading="lazy" /></a>`;
  vault.hydrate(projScroll, true);
  if (views) {
    views.removeLayer("overlay");
    const el = $("#pModel", projScroll);
    if (el) {
      const mv = views.add(el, p.model, { file: p.modelFile, layer: "overlay", drag: true });
      $$("[data-m]", el).forEach((b) => b.addEventListener("click", () => {
        mv.mode(b.dataset.m); $$("[data-m]", el).forEach((x) => x.classList.toggle("on", x === b));
      }));
      $$("[data-a]", el).forEach((b) => b.addEventListener("click", () => {
        const a = b.dataset.a;
        if (a === "explode") { const on = mv.explode(); b.classList.toggle("on", on); b.textContent = on ? "Assemble" : "Explode"; }
        if (a === "rebuild") { mv.rebuild(); const ex = $("[data-a=explode]", el); ex.classList.remove("on"); ex.textContent = "Explode"; }
        if (a === "lines") b.classList.toggle("on", mv.lines());
        if (a === "spin") b.classList.toggle("on", mv.spin());
      }));
    }
    views.setLayer("overlay");
  }
  projScroll.scrollTop = 0;
  proj.classList.add("open");
  proj.setAttribute("aria-hidden", "false");
  lenis && lenis.stop();
  stage && stage.setPaused(true);
  gsap.from(".p-hero-text > *", { y: 80, opacity: 0, duration: 1.4, stagger: 0.1, ease: "expo.out", delay: 0.45 });

  $$("[data-lb]", projScroll).forEach((f) =>
    f.addEventListener("click", () => {
      openLB(f.dataset.lb === "r" ? renders : sheets, +f.dataset.k);
    })
  );
  $(".p-next", projScroll).addEventListener("click", (e) => {
    const n = +e.currentTarget.dataset.next;
    proj.classList.remove("open");
    views && views.setLayer("none");
    setTimeout(() => openProject(n), 650);
  });
}
function closeProject() {
  proj.classList.remove("open");
  if (views) { views.setLayer("page"); setTimeout(() => views.removeLayer("overlay"), 900); }
  proj.setAttribute("aria-hidden", "true");
  lenis && lenis.start();
  stage && stage.setPaused(parseFloat(getComputedStyle(root).getPropertyValue("--stage")) < 0.02);
  currentProject = -1;
}
document.addEventListener("click", (e) => {
  const o = e.target.closest("[data-open]");
  if (o) openProject(+o.dataset.open);
});
$("#projectClose").addEventListener("click", closeProject);

/* ---------- Lightbox ---------- */
const lb = $("#lightbox"), lbImg = $("#lbImg"), lbStage = $("#lbStage"), lbCap = $("#lbCap");
let lbList = [], lbI = 0;
function showLB() {
  lbStage.classList.remove("zoom");
  lbImg.style.transform = "";
  lbImg.removeAttribute("src");
  vault.set(lbImg, lbList[lbI].src);
  // pre-decode neighbours for instant next/prev
  [lbI + 1, lbI - 1].forEach((j) => lbList[(j + lbList.length) % lbList.length] && vault.get(lbList[(j + lbList.length) % lbList.length].src));
  lbImg.alt = lbList[lbI].label || "";
  lbCap.textContent = `${lbList[lbI].label ? lbList[lbI].label + "  ·  " : ""}${pad2(lbI + 1)} / ${pad2(lbList.length)}`;
}
function openLB(list, i) { lbList = list; lbI = i; showLB(); lb.classList.add("open"); lb.setAttribute("aria-hidden", "false"); }
function closeLB() { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); }
$("#lbClose").addEventListener("click", closeLB);
$("#lbPrev").addEventListener("click", () => { lbI = (lbI - 1 + lbList.length) % lbList.length; showLB(); });
$("#lbNext").addEventListener("click", () => { lbI = (lbI + 1) % lbList.length; showLB(); });
lbStage.addEventListener("click", (e) => {
  const z = lbStage.classList.toggle("zoom");
  if (z) zoomAt(e); else lbImg.style.transform = "";
});
function zoomAt(e) {
  const r = lbStage.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100;
  lbImg.style.transformOrigin = `${x}% ${y}%`;
  lbImg.style.transform = "scale(2.4)";
}
lbStage.addEventListener("pointermove", (e) => lbStage.classList.contains("zoom") && zoomAt(e));
// swipe on touch
let tx0 = null;
lbStage.addEventListener("touchstart", (e) => (tx0 = e.touches[0].clientX), { passive: true });
lbStage.addEventListener("touchend", (e) => {
  if (tx0 === null) return;
  const dx = e.changedTouches[0].clientX - tx0;
  if (Math.abs(dx) > 50) $(dx < 0 ? "#lbNext" : "#lbPrev").click();
  tx0 = null;
});

addEventListener("keydown", (e) => {
  if (lb.classList.contains("open")) {
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowRight") $("#lbNext").click();
    if (e.key === "ArrowLeft") $("#lbPrev").click();
    return;
  }
  if (proj.classList.contains("open") && e.key === "Escape") closeProject();
});

addEventListener("load", () => ScrollTrigger.refresh());

/* ---------- Image protection (deterrent: blocks right-click save, drag, long-press) ---------- */
(() => {
  const toast = document.createElement("div");
  toast.className = "protect-toast";
  toast.textContent = `© ${P.name} — images are protected. Contact ${P.email} for a copy.`;
  document.body.appendChild(toast);
  let t;
  const warn = () => { toast.classList.add("on"); clearTimeout(t); t = setTimeout(() => toast.classList.remove("on"), 2600); };
  document.addEventListener("contextmenu", (e) => { e.preventDefault(); warn(); });
  document.addEventListener("dragstart", (e) => { if (e.target.tagName === "IMG") e.preventDefault(); });
  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p")) { e.preventDefault(); warn(); }
    if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && (k === "u" || (e.shiftKey && ["i", "j", "c"].includes(k)))) || (e.metaKey && e.altKey && ["i", "j", "c", "u"].includes(k))) { e.preventDefault(); warn(); }
  });
})();
