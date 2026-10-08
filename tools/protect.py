#!/usr/bin/env python3
"""
Prepare images for the website: resize, watermark and scramble.

Usage (needs Python 3 + Pillow:  pip install pillow):

    python tools/protect.py  path/to/originals

`originals` must contain the same sub-folders as assets/:
    originals/renders/09-front-view.jpg
    originals/sheets/09-ground-floor-plan.jpg
    originals/img/renuka.jpg            (portrait — resized, not watermarked)

Output goes to assets/<folder>/<name>.bin. In js/data.js keep referring to the
image as  "assets/renders/09-front-view.jpg"  — the site loads the .bin for you.

Keep the full-resolution originals on your own computer; never commit them.
"""
import glob, math, os, re, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = bytes.fromhex(re.search(r'KEY = "([0-9a-f]+)"', open(os.path.join(ROOT, "js", "vault.js")).read()).group(1))
OWNER = "RENUKA SIVAKUMAR"
MAX = 1600


def font(size):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "C:/Windows/Fonts/arial.ttf",
              "/System/Library/Fonts/Supplemental/Arial.ttf", "/Library/Fonts/Arial.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def tile(im, alpha, frac, color):
    w, h = im.size
    fs = max(14, int(w * frac)); f = font(fs)
    d = int(math.hypot(w, h))
    layer = Image.new("RGBA", (d, d), (0, 0, 0, 0)); dr = ImageDraw.Draw(layer)
    text = "© " + OWNER
    tw = dr.textlength(text + "      ", font=f)
    y, row = 0, 0
    while y < d:
        x = -(row % 2) * tw / 2
        while x < d:
            dr.text((x, y), text, font=f, fill=color + (alpha,)); x += tw
        y += fs * 4.2; row += 1
    layer = layer.rotate(28, resample=Image.BICUBIC)
    o = ((d - w) // 2, (d - h) // 2)
    return Image.alpha_composite(im, layer.crop((o[0], o[1], o[0] + w, o[1] + h)))


def corner(im):
    w, h = im.size
    fs = max(12, int(w * 0.011)); f = font(fs)
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(lay)
    t = "© " + OWNER.title() + " · All rights reserved"
    tw = dr.textlength(t, font=f); pad = int(fs * 1.4)
    dr.text((w - tw - pad + 1, h - fs - pad + 1), t, font=f, fill=(0, 0, 0, 120))
    dr.text((w - tw - pad, h - fs - pad), t, font=f, fill=(255, 255, 255, 170))
    return Image.alpha_composite(im, lay)


def scramble(data):
    b = bytearray(data)
    for i in range(len(b)):
        b[i] ^= KEY[i % len(KEY)] ^ ((i * 31) & 255)
    return bytes(b)


def main(src):
    import io
    n = 0
    for folder in ("renders", "sheets", "img"):
        files = [f for ext in ("jpg", "jpeg", "png", "webp") for f in glob.glob(os.path.join(src, folder, "*." + ext))]
        os.makedirs(os.path.join(ROOT, "assets", folder), exist_ok=True)
        for f in sorted(files):
            im = Image.open(f).convert("RGBA")
            im.thumbnail((MAX, MAX) if folder != "img" else (700, 700), Image.LANCZOS)
            if folder == "renders":
                im = corner(tile(im, 16, 0.018, (255, 255, 255)))
            elif folder == "sheets":
                im = corner(tile(im, 30, 0.016, (150, 120, 70)))
            buf = io.BytesIO()
            im.convert("RGB").save(buf, "JPEG", quality=78, optimize=True, progressive=True)
            name = os.path.splitext(os.path.basename(f))[0] + ".bin"
            open(os.path.join(ROOT, "assets", folder, name), "wb").write(scramble(buf.getvalue()))
            n += 1
            print("  ✓", folder, name)
    print(f"Done — {n} images protected.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__); sys.exit(1)
    main(sys.argv[1])
