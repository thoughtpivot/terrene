"""Builds the Oka World 2 art: the dark parallax layers and props painted for
the Hollow, plus dark variants of the Oka World terrain, creatures and items.

New paintings live in ./source on the same flat magenta field as Oka World's
sources and go through the same keying and scaling as tools/oka-world/build_art.py.
The dark variants are recolored pixel by pixel from the sheets that
build_art.py writes, so every frame, anchor and surface profile in
src/components/scenes/OkaWorld/art/atlas.ts stays valid for them. Run the
Oka World build first whenever its sources change.

    python3 tools/oka-world/build_art.py
    python3 tools/oka-world/2/build_art.py
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(HERE))
import build_art as base  # noqa: E402

SRC = os.path.join(HERE, "source")
ROOT = base.ROOT
COMP = base.COMP
SCENE1 = base.SCENE
SCENE = os.path.join(SCENE1, "2")
STORE = base.STORE


# ------------------------------------------------------------------ colour

def to_hsv(rgb):
    """rgb floats 0-1 -> h in degrees, s, v"""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1)
    mn = rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    nz = d > 1e-6
    rm = nz & (mx == r)
    gm = nz & (mx == g) & ~rm
    bm = nz & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    h *= 60
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def to_rgb(h, s, v):
    h = (h % 360) / 60
    c = v * s
    x = c * (1 - np.abs(h % 2 - 1))
    m = v - c
    z = np.zeros_like(h)
    sector = np.floor(h).astype(int) % 6
    r = np.choose(sector, [c, x, z, z, x, c])
    g = np.choose(sector, [x, c, c, x, z, z])
    b = np.choose(sector, [z, z, x, c, c, x])
    return np.stack([r + m, g + m, b + m], -1)


def band(h, lo, hi, soft=12):
    """1 inside the hue band [lo, hi] (degrees, may wrap), fading over `soft`."""
    def dist(a, b):
        return np.abs((a - b + 180) % 360 - 180)
    if lo <= hi:
        inside = (h >= lo) & (h <= hi)
    else:
        inside = (h >= lo) | (h <= hi)
    edge = np.minimum(dist(h, lo), dist(h, hi))
    return np.where(inside, 1.0, np.clip(1 - edge / soft, 0, 1))


def ramp(x, lo, hi):
    return np.clip((x - lo) / max(hi - lo, 1e-6), 0, 1)


def mix(a, b, w):
    w = w[..., None] if np.ndim(w) == a.ndim - 1 else w
    return a * (1 - w) + b * w


def hollow_grade(rgb, shade=0.52, hue=222, sat=0.32):
    """The base night grade: pull everything toward deep slate indigo."""
    h, s, v = to_hsv(rgb)
    lum = rgb @ np.array([0.3, 0.55, 0.15])
    nh = np.full_like(h, hue)
    ns = np.clip(s * 0.35 + sat * 0.6, 0, 1)
    nv = np.clip(lum ** 1.08 * shade * 1.25, 0, 1)
    return to_rgb(nh, ns, nv)


def tone(rgb, hue, sat, lo, hi, gamma=1.0):
    """Map luminance onto a single hue, from value lo to hi."""
    lum = np.clip(rgb @ np.array([0.3, 0.55, 0.15]), 0, 1) ** gamma
    return to_rgb(np.full(lum.shape, float(hue)), np.full(lum.shape, float(sat)), lo + (hi - lo) * lum)


def recolor(rgba, rules, base_grade=None):
    """rules: list of (weight_fn(h, s, v, rgb) -> 0..1, target_fn(rgb) -> rgb), applied in order."""
    a = rgba.astype(np.float32) / 255
    rgb = a[..., :3]
    h, s, v = to_hsv(rgb)
    out = base_grade(rgb) if base_grade else rgb.copy()
    for weight, target in rules:
        w = np.clip(weight(h, s, v, rgb), 0, 1)
        out = mix(out, target(rgb), w)
    a[..., :3] = np.clip(out, 0, 1)
    return (a * 255).astype(np.uint8)


def load(*parts):
    return np.asarray(Image.open(os.path.join(*parts)).convert("RGBA"))


GREEN = lambda h, s, v, rgb: band(h, 55, 150, 18) * ramp(s, 0.18, 0.35)  # noqa: E731
BROWN = lambda h, s, v, rgb: band(h, 10, 48, 10) * ramp(s, 0.2, 0.35) * (1 - ramp(v, 0.8, 0.95))  # noqa: E731


def pale_moss(rgb):
    """Moss turns to pale grey-teal lichen: it rims every walkable top."""
    return tone(rgb, 186, 0.2, 0.28, 0.86, 0.9)


# ------------------------------------------------------------------ variants

def dark_terrain():
    img = load(SCENE1, "OkaWorld.png")
    crystal = lambda h, s, v, rgb: band(h, 195, 235, 10) * ramp(s, 0.35, 0.55) * ramp(v, 0.35, 0.6)  # noqa: E731
    out = recolor(img, [
        (GREEN, pale_moss),
        (BROWN, lambda rgb: tone(rgb, 230, 0.3, 0.03, 0.2)),
        (crystal, lambda rgb: tone(rgb, 190, 0.35, 0.45, 1.0, 0.8)),
    ], lambda rgb: hollow_grade(rgb, 0.5))
    base.save(out, SCENE, "OkaWorld2.png")


def dark_mossback():
    img = load(COMP, "creatures", "Mossback", "Mossback.png")
    eyes = lambda h, s, v, rgb: band(h, 38, 70, 8) * ramp(s, 0.45, 0.65) * ramp(v, 0.6, 0.8)  # noqa: E731
    out = recolor(img, [
        (lambda h, s, v, rgb: GREEN(h, s, v, rgb) * (1 - eyes(h, s, v, rgb)), lambda rgb: tone(rgb, 38, 0.1, 0.42, 0.92, 0.85)),
        (BROWN, lambda rgb: tone(rgb, 250, 0.25, 0.04, 0.22)),
        (eyes, lambda rgb: to_rgb(np.full(rgb.shape[:2], 88.0), np.full(rgb.shape[:2], 0.75), np.clip(0.75 + rgb.max(-1) * 0.3, 0, 1))),
    ], lambda rgb: hollow_grade(rgb, 0.42, 248, 0.38))
    base.save(out, COMP, "creatures", "Mossback", "Mossback-dark.png")
    return glow_spots(img, eyes, 4)


def dark_glimmerfly():
    img = load(COMP, "creatures", "Glimmerfly", "Glimmerfly.png")
    out = recolor(img, [
        (lambda h, s, v, rgb: band(h, 60, 200, 20) * ramp(s, 0.1, 0.25), lambda rgb: tone(rgb, 262, 0.22, 0.35, 0.98, 0.8)),
    ])
    base.save(out, COMP, "creatures", "Glimmerfly", "Glimmerfly-dark.png")


def dark_gloomfin():
    img = load(COMP, "creatures", "Gloomfin", "Gloomfin.png")
    spots = lambda h, s, v, rgb: band(h, 120, 175, 12) * ramp(v, 0.62, 0.8) * ramp(s, 0.25, 0.4)  # noqa: E731
    eye = lambda h, s, v, rgb: band(h, 55, 95, 10) * ramp(s, 0.4, 0.6) * ramp(v, 0.5, 0.7)  # noqa: E731
    out = recolor(img, [
        (spots, lambda rgb: tone(rgb, 200, 0.18, 0.55, 1.0, 0.6)),
        (eye, lambda rgb: to_rgb(np.full(rgb.shape[:2], 70.0), np.full(rgb.shape[:2], 0.8), np.clip(0.7 + rgb.max(-1) * 0.4, 0, 1))),
    ], lambda rgb: hollow_grade(rgb, 0.48, 258, 0.42))
    base.save(out, COMP, "creatures", "Gloomfin", "Gloomfin-dark.png")


def glow_spots(img, weight, frames):
    """Centre of the glowing pixels in each frame, relative to the frame's foot anchor."""
    a = img.astype(np.float32) / 255
    h, s, v = to_hsv(a[..., :3])
    w = weight(h, s, v, a[..., :3]) * (a[..., 3] > 0.5)
    fw = img.shape[1] // frames
    spots = []
    for i in range(frames):
        cell = w[:, i * fw:(i + 1) * fw]
        lab, n = ndimage.label(cell > 0.4)
        if not n:
            spots.append(None)
            continue
        sizes = ndimage.sum(cell > 0.4, lab, range(1, n + 1))
        k = int(np.argmax(sizes)) + 1
        ys, xs = np.where(lab == k)
        spots.append([round(float(xs.mean()) / STORE, 1), round((float(ys.mean()) - img.shape[0]) / STORE, 1)])
    return spots


def dark_items(meta):
    stone = lambda rgb: hollow_grade(rgb, 0.5)  # noqa: E731
    looks = {
        "BlueCrystal": ([], lambda rgb: tone(rgb, 192, 0.28, 0.32, 1.0, 0.75)),
        "HeartMoss": ([], lambda rgb: tone(rgb, 350, 0.62, 0.18, 0.95, 0.9)),
        "Boulders": ([], stone),
        "MossyBoulder": ([(GREEN, pale_moss)], stone),
        "Stalagmite": ([], stone),
        "Kelp": ([], lambda rgb: tone(rgb, 205, 0.35, 0.05, 0.42)),
        "Fern": ([(BROWN, lambda rgb: tone(rgb, 230, 0.3, 0.03, 0.18))], lambda rgb: tone(rgb, 200, 0.22, 0.06, 0.5)),
        "GrassTuft": ([], lambda rgb: tone(rgb, 196, 0.2, 0.08, 0.55)),
        "MossDrip": ([], lambda rgb: tone(rgb, 186, 0.18, 0.18, 0.82)),
    }
    for name, (rules, grade) in looks.items():
        img = load(COMP, "items", "cave", name, f"{name}.png")
        out = recolor(img, rules, grade)
        base.save(out, COMP, "items", "cave", name, f"{name}-dark.png")
        meta["items"][f"{name}-dark"] = {"w": out.shape[1], "h": out.shape[0]}


# ------------------------------------------------------------------ new paintings

def layers(meta):
    art = os.path.join(SCENE, "art")
    os.makedirs(art, exist_ok=True)
    bd = Image.open(os.path.join(SRC, "backdrop.jpg")).convert("RGB")
    bd.save(os.path.join(art, "backdrop.jpg"), quality=86, optimize=True)
    print("wrote", os.path.relpath(os.path.join(art, "backdrop.jpg"), ROOT), bd.width, "x", bd.height)
    mid = base.key(os.path.join(SRC, "pillars-mid.jpg"))
    mid = np.asarray(Image.fromarray(mid, "RGBA").resize((960, 540), Image.LANCZOS))
    base.save(mid, art, "pillars-mid.png")
    near = base.key(os.path.join(SRC, "pillars-near.jpg"))
    base.save(near, art, "pillars-near.png")
    meta["layers"] = {"backdrop": [bd.width, bd.height], "mid": [960, 540], "near": [near.shape[1], near.shape[0]]}


def props(meta):
    pr = base.objects(base.key(os.path.join(SRC, "props.jpg")), 4)

    # glows painted over magenta keep a pink cast inside the halo; turn it cold violet-blue
    pink = lambda h, s, v, rgb: band(h, 285, 345, 15) * ramp(s, 0.2, 0.4)  # noqa: E731

    def cold(rgb):
        h, s, v = to_hsv(rgb)
        return to_rgb(np.full(h.shape, 232.0), s * 0.7, v)

    def item(name, src_img, size):
        s = size * STORE / src_img.shape[0]
        out = recolor(base.trim(base.resize(src_img, s)), [(pink, cold)])
        base.save(out, COMP, "items", "cave", name, f"{name}.png")
        meta["items"][name] = {"w": out.shape[1], "h": out.shape[0]}

    item("HangingLantern", pr[0], 70)
    item("PaleShrooms", pr[1], 62)
    item("DeadTree", pr[2], 250)
    item("SoulShrine", pr[3], 128)


def main():
    meta = {"items": {}}
    layers(meta)
    props(meta)
    dark_terrain()
    eyes = dark_mossback()
    dark_glimmerfly()
    dark_gloomfin()
    dark_items(meta)
    ts = os.path.join(SCENE, "art", "atlas.ts")
    with open(ts, "w") as fh:
        fh.write("// Generated by tools/oka-world/2/build_art.py. Sizes are stored pixels; divide by STORE for scene units.\n")
        fh.write("/* eslint-disable */\n\n")
        fh.write("export const LAYERS = " + json.dumps(meta["layers"]) + ";\n\n")
        fh.write("/** Glowing eyes of the dark Mossback per frame, in scene units from the frame's bottom-left. */\n")
        fh.write("export const MOSSBACK_EYES: ([number, number] | null)[] = " + json.dumps(eyes) + ";\n\n")
        fh.write("export const ITEMS: Record<string, { w: number; h: number }> = " + json.dumps(meta["items"], indent=4) + ";\n")
    print("wrote", os.path.relpath(ts, ROOT))


if __name__ == "__main__":
    main()
