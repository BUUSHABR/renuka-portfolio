# Ar. Renuka Sivakumar — Architect Portfolio

An interactive 3D portfolio built with Three.js. A modern villa drafts itself in gold lines, then rises into a lit building. Visitors can switch between **Blueprint**, **Golden hour** and **Night**, **explode** the model into an axonometric, and browse eight projects with renders and drawing sheets.

Plain static files: no build step, no server, free to host on GitHub Pages.

---

## Put it online (GitHub Pages, free)

1. Push this folder to a public GitHub repository, for example `renuka-portfolio`.
2. On GitHub, open the repo and go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then branch **main** and folder **/ (root)**. Click **Save**.
4. After about a minute the site is live at
   `https://<your-username>.github.io/renuka-portfolio/`

To get a shorter address like `https://<username>.github.io/`, name the repository `<username>.github.io` instead.

---

## Add a new project

All content lives in **`js/data.js`**. You never need to touch the 3D code.

1. Add the images (they must be **protected** first, see below):
   - put the full-size originals on **your computer** in a folder such as `originals/renders/09-living-room.jpg` and `originals/sheets/09-ground-floor-plan.jpg`. Name files by what they show.
   - run `python tools/protect.py originals`. This resizes, watermarks and scrambles them into `assets/…/*.bin`.
   - **never commit the originals folder.** It's already ignored in `.gitignore`.
2. Open `js/data.js`, copy one project block `{ ... },` and paste it **at the top** of the `projects` list. Then edit the text:

```js
{
  title: "New Project Name",
  location: "City, Tamil Nadu",
  category: "Architecture",          // or "Interior" (drives the filter)
  type: "Residence",
  facts: [
    ["Built-up", "4,200 sq.ft"],
    ["Programme", "4-bedroom home"],
  ],
  description: [
    "First paragraph — shown large.",
    "Second paragraph — shown smaller.",
  ],
  cover: "assets/renders/09-front-view.jpg",
  renders: [
    { src: "assets/renders/09-front-view.jpg", label: "Front view" },
    { src: "assets/renders/09-living-room.jpg", label: "Living room" },
  ],
  sheets: [
    { src: "assets/sheets/09-ground-floor-plan.jpg", label: "Ground floor plan" },
  ],
},
```

3. Commit and push. The live site updates within about a minute.

Project numbers (01, 02 …) are assigned automatically from the order in the list. You can also edit the profile text, stats, experience, workshops and skills in the same file.

---

## Files

| Path | What it is |
|---|---|
| `index.html` | Page structure |
| `css/style.css` | Look & feel (colours at the top under `:root`) |
| `js/data.js` | **All content — edit this** |
| `js/main.js` | Scrolling, project pages, lightbox |
| `js/scene.js` | The Three.js model and lighting |
| `assets/` | Images, drawings, CV |

Keyboard extras: `E` explode / assemble · `R` rebuild · `1` `2` `3` switch lighting.
Add `?lite` to the URL to force the light version on slow machines (it also switches automatically).

---

## Protecting the work

- **Images are encrypted.** Every render, drawing and photo is stored scrambled as `.bin`, so cloning the repo, downloading files or digging through the page source only gets unreadable data. The site decodes them in memory just for display.
- What visitors do see is **watermarked** and **limited to 1600px**. Full-resolution originals stay on your computer.
- Right-click, drag-to-save, long-press save, Ctrl/Cmd+S, Ctrl/Cmd+U (view source), F12 / DevTools shortcuts and printing are blocked.
- `LICENSE` states all rights are reserved.
- **Recommended:** make the repository **private** and host it free on **Netlify** or **Cloudflare Pages**, which deploy from private repos. GitHub Pages needs a paid plan for private repos.

No website can stop screenshots, so the watermark is what protects anything captured that way.
