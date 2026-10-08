/* ==========================================================================
   Image vault — every image on this site is stored scrambled (.bin), so the
   files in the repository / page source are not viewable images.
   They are decoded in memory only for display. Create .bin files with
   tools/protect.py (see README → "Adding images").
   ========================================================================== */
const KEY = "da8719aca6aaa3e0df180ef21338cff7be4cce018d1060a9d530156306b8ad4d62f039eed067ef3c530d4dff1ea5b0ee";
const k = new Uint8Array(KEY.match(/../g).map((h) => parseInt(h, 16)));
const cache = new Map();

const binPath = (p) => p.replace(/\.(jpe?g|png|webp)$/i, ".bin");

/** Returns a blob: URL for an asset path like "assets/renders/01-front-view.jpg" */
export function get(path) {
  if (!path) return Promise.resolve("");
  if (!cache.has(path)) {
    cache.set(path, fetch(binPath(path))
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((buf) => {
        const b = new Uint8Array(buf);
        for (let i = 0; i < b.length; i++) b[i] ^= k[i % k.length] ^ ((i * 31) & 255);
        return URL.createObjectURL(new Blob([b], { type: "image/jpeg" }));
      })
      .catch((e) => { console.warn("asset", path, e); return ""; }));
  }
  return cache.get(path);
}

/** Set an <img> from a protected path */
export async function set(img, path) {
  img.dataset.src = path;
  const url = await get(path);
  if (img.dataset.src === path && url) { img.removeAttribute("loading"); img.src = url; }
}

/** Decode every <img data-src> inside root; lazy ones load near the viewport */
const lazyIO = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  lazyIO.unobserve(en.target);
  set(en.target, en.target.dataset.src);
}), { rootMargin: "800px 800px" });

export function hydrate(root = document, eager = false) {
  root.querySelectorAll("img[data-src]:not([data-v])").forEach((img) => {
    img.dataset.v = "1";
    if (img.loading === "lazy" && !eager) lazyIO.observe(img);
    else set(img, img.dataset.src);
  });
}
