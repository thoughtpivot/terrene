"""Builds the Oka World art from the painted source sheets in ./source.

Every source is painted on a flat magenta field. This keys the magenta out,
splits sheets into objects, scales each object to its in-game size (stored at
2x so the 960x540 scene stays sharp at pixel ratio 2), packs the terrain atlas
and writes src/components/scenes/OkaWorld/art/atlas.ts with sizes, frame
anchors and walkable surface profiles.

    python3 tools/oka-world/build_art.py
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "source")
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
COMP = os.path.join(ROOT, "src", "components")
SCENE = os.path.join(COMP, "scenes", "OkaWorld")
STORE = 2  # stored pixels per logical pixel


def key(path, lo=60, hi=140):
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3),
                           a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    mag = edge[(edge[:, 0] > edge[:, 1] + 60) & (edge[:, 2] > edge[:, 1] + 40)]
    bg = np.median(mag if len(mag) > 20 else edge, axis=0)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g
    bgm = min(bg[0], bg[2]) - bg[1]
    d = np.sqrt(((a - bg) ** 2).sum(-1))
    alpha = np.clip((d - lo) / (hi - lo), 0, 1)
    alpha = np.where(m > bgm * 0.55, np.minimum(alpha, np.clip((bgm - m) / (bgm * 0.45), 0, 1)), alpha)
    # Near the background, treat pixels as a linear mix of a neutral foreground
    # and the magenta field. Deep inside objects real pinks are left alone.
    edge = ndimage.distance_transform_edt(alpha > 0.05) <= 4
    mix = np.clip(1 - np.clip(m, 0, None) / bgm, 0, 1)
    alpha = np.where(edge, np.minimum(alpha, mix), alpha)
    solid = ndimage.binary_opening(alpha > 0.5, iterations=1)
    lab, n = ndimage.label(solid)
    if n:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        keep = np.isin(lab, 1 + np.where(sizes > 40)[0])
        alpha = np.where(ndimage.binary_dilation(keep, iterations=2), alpha, 0)
    out = a.copy()
    al = np.maximum(alpha, 0.05)[..., None]
    unmixed = (a - (1 - al) * bg) / al
    out = np.where((edge & (alpha < 0.98))[..., None], unmixed, out)
    m2 = np.minimum(out[..., 0], out[..., 2]) - out[..., 1]
    spill = np.clip(m2, 0, None) * np.where(edge, 1.0, 0.15)
    out[..., 0] -= spill
    out[..., 2] -= spill
    out = np.clip(out, 0, 255)
    return np.dstack([out, alpha * 255]).astype(np.uint8)


def objects(rgba, expect):
    """Split a keyed sheet into `expect` objects ordered by row then column."""
    a = rgba[..., 3] > 30
    grown = ndimage.binary_dilation(a, iterations=3)
    lab, n = ndimage.label(grown)
    boxes = ndimage.find_objects(lab)
    areas = ndimage.sum(a, lab, range(1, n + 1))
    order = np.argsort(-areas)
    big = areas[order[0]]
    mains = [i for i in order if areas[i] > big * 0.08]
    if len(mains) < expect:
        raise SystemExit(f"found {len(mains)} objects, expected {expect}")
    mains = sorted(mains[:expect], key=lambda i: (boxes[i][0].start + boxes[i][0].stop) / 2)
    groups = {i: [i] for i in mains}
    for i in range(n):
        if i in groups or areas[i] < 6:
            continue
        sy, sx = boxes[i]
        best, bd = None, 1e9
        for j in mains:
            ty, tx = boxes[j]
            dx = max(tx.start - sx.stop, sx.start - tx.stop, 0)
            dy = max(ty.start - sy.stop, sy.start - ty.stop, 0)
            if dx + dy < bd:
                best, bd = j, dx + dy
        if bd < 24:
            groups[best].append(i)
    rows, cur, last = [], [], None
    for i in mains:
        cy = (boxes[i][0].start + boxes[i][0].stop) / 2
        if last is not None and cy - last > rgba.shape[0] * 0.18:
            rows.append(cur)
            cur = []
        cur.append(i)
        last = cy
    rows.append(cur)
    ordered = [i for row in rows for i in sorted(row, key=lambda k: boxes[k][1].start)]
    result = []
    for i in ordered:
        mask = np.isin(lab, [g + 1 for g in groups[i]])
        ys, xs = np.where(mask & a)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(mask[y0:y1, x0:x1], crop[..., 3], 0)
        result.append(crop)
    return result


def trim(rgba):
    ys, xs = np.where(rgba[..., 3] > 10)
    return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def resize(rgba, scale):
    img = Image.fromarray(rgba, "RGBA")
    w, h = max(1, round(img.width * scale)), max(1, round(img.height * scale))
    # premultiply so keyed edges do not pick up dark fringes
    arr = np.asarray(img).astype(np.float32) / 255
    pre = arr.copy()
    pre[..., :3] *= pre[..., 3:4]
    small = np.asarray(Image.fromarray((pre * 255).astype(np.uint8), "RGBA").resize((w, h), Image.LANCZOS)).astype(np.float32) / 255
    al = small[..., 3:4]
    small[..., :3] = np.where(al > 0.003, small[..., :3] / np.maximum(al, 0.003), 0)
    return (np.clip(small, 0, 1) * 255).astype(np.uint8)


def save(rgba, *parts):
    path = os.path.join(*parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(path, optimize=True)
    print("wrote", os.path.relpath(path, ROOT), rgba.shape[1], "x", rgba.shape[0])


def tops(rgba, rockonly=False):
    """Topmost solid row per column."""
    a = rgba[..., 3] > 128
    if rockonly:
        c = rgba[..., :3].astype(int)
        rock = (np.abs(c[..., 0] - c[..., 1]) < 40) & (c[..., 2] >= c[..., 0] - 12) & (c.max(-1) - c.min(-1) < 70)
        a = a & rock
    h = a.shape[0]
    first = np.where(a.any(0), a.argmax(0), h)
    return first


def profile(rgba, step, rockonly=False, x0=0.0, x1=1.0):
    t = tops(rgba, rockonly).astype(float)
    w = rgba.shape[1]
    out = []
    for x in range(0, w, step):
        seg = t[x:x + step]
        seg = seg[seg < rgba.shape[0]]
        out.append(float(np.median(seg)) if len(seg) else None)
    lo, hi = int(len(out) * x0), int(np.ceil(len(out) * x1))
    vals = [v for v in out[lo:hi] if v is not None]
    return out, vals


def sheet(frames, ref_index, target, axis, align, anchor_head=False, pad=2):
    ref = frames[ref_index]
    size = ref.shape[0] if axis == "h" else ref.shape[1]
    scale = target * STORE / size
    scaled = [resize(f, scale) for f in frames]
    scaled = [trim(f) for f in scaled]
    anchors = []
    for f in scaled:
        if anchor_head:
            al = f[..., 3] > 128
            head = al[: max(4, int(f.shape[0] * 0.45))]
            ys, xs = np.where(head)
            anchors.append(xs.mean())
        else:
            anchors.append(f.shape[1] / 2)
    left = max(anchors) + pad
    right = max(f.shape[1] - a for f, a in zip(scaled, anchors)) + pad
    cw = int(np.ceil(left + right))
    ch = max(f.shape[0] for f in scaled) + pad * 2
    out = np.zeros((ch, cw * len(scaled), 4), np.uint8)
    for i, (f, ax) in enumerate(zip(scaled, anchors)):
        x = int(round(i * cw + left - ax))
        if align == "bottom":
            y = ch - pad - f.shape[0]
        else:
            y = (ch - f.shape[0]) // 2
        out[y:y + f.shape[0], x:x + f.shape[1]] = f
    return out, cw, ch, int(round(left))


def pack(named, width=2048, pad=4):
    """Shelf-pack images, tallest first."""
    items = sorted(named.items(), key=lambda kv: -kv[1].shape[0])
    x = y = shelf = 0
    places = {}
    for name, img in items:
        h, w = img.shape[:2]
        if x + w + pad > width:
            x, y, shelf = 0, y + shelf + pad, 0
        places[name] = (x, y)
        x += w + pad
        shelf = max(shelf, h)
    height = y + shelf
    atlas = np.zeros((height, width, 4), np.uint8)
    for name, img in named.items():
        px, py = places[name]
        atlas[py:py + img.shape[0], px:px + img.shape[1]] = img
    return atlas, places


def main():
    meta = {"store": STORE, "terrain": {}, "sheets": {}, "items": {}}

    # ---- parallax layers
    bd = Image.open(os.path.join(SRC, "backdrop.jpg")).convert("RGB")
    os.makedirs(os.path.join(SCENE, "art"), exist_ok=True)
    bd.save(os.path.join(SCENE, "art", "backdrop.jpg"), quality=86, optimize=True)
    mid = key(os.path.join(SRC, "pillars-mid.jpg"))
    mid = np.asarray(Image.fromarray(mid, "RGBA").resize((960, 540), Image.LANCZOS))
    save(mid, SCENE, "art", "pillars-mid.png")
    near = key(os.path.join(SRC, "pillars-near.jpg"))
    save(near, SCENE, "art", "pillars-near.png")
    meta["layers"] = {"backdrop": [bd.width, bd.height], "mid": [960, 540], "near": [near.shape[1], near.shape[0]]}

    # ---- terrain atlas (the scene's own sheet)
    terrain = {}
    ground = trim(key(os.path.join(SRC, "ground.jpg")))
    terrain["ground"] = resize(ground, 420 * STORE / ground.shape[1])
    slab = trim(key(os.path.join(SRC, "slab.jpg")))
    terrain["slab"] = resize(slab, 400 * STORE / slab.shape[1])
    fl = objects(key(os.path.join(SRC, "floaters.jpg")), 3)
    for name, f, w in zip(["floatS", "floatM", "floatL"], fl, [110, 160, 210]):
        terrain[name] = resize(f, w * STORE / f.shape[1])
    isle = trim(key(os.path.join(SRC, "bonsai-isle.jpg")))
    terrain["isle"] = resize(isle, 320 * STORE / isle.shape[1])
    wall = trim(key(os.path.join(SRC, "crystal-wall.jpg")))
    terrain["wall"] = resize(wall, 400 * STORE / wall.shape[0])
    atlas, places = pack(terrain)
    save(atlas, SCENE, "OkaWorld.png")
    for name, img in terrain.items():
        h, w = img.shape[:2]
        x, y = places[name]
        entry = {"x": x, "y": y, "w": w, "h": h}
        step = 8 * STORE
        if name == "isle":
            # ignore the tree: only look below the top of the rock mound
            cut = img.copy()
            cut[: int(img.shape[0] * 0.46), :, 3] = 0
            prof, _ = profile(cut, step)
            vals = np.array([np.nan if v is None else v for v in prof])
            for i in range(len(vals)):
                win = vals[max(0, i - 4): i + 5]
                win = win[~np.isnan(win)]
                if len(win) and not np.isnan(vals[i]):
                    vals[i] = max(vals[i], np.median(win) - 14)
            prof = [None if np.isnan(v) else float(v) for v in vals]
            # the grass ledge runs in front of the mound; it is the walk line
            ends = [v for v in prof[:4] + prof[-4:] if v is not None]
            entry["top"] = float(np.median(ends)) - 4
        else:
            prof, vals = profile(img, step, x0=0.1, x1=0.9)
            entry["top"] = float(np.median(vals))
        entry["profile"] = [None if v is None else round(v / STORE, 1) for v in prof]
        meta["terrain"][name] = entry

    # ---- characters and creatures
    hero = objects(key(os.path.join(SRC, "hero.jpg")), 8)
    img, cw, ch, ax = sheet(hero, 0, 72, "h", "bottom", anchor_head=True)
    save(img, COMP, "characters", "player", "Mori", "Mori.png")
    meta["sheets"]["mori"] = {"fw": cw, "fh": ch, "frames": 8, "ax": ax}

    cre = objects(key(os.path.join(SRC, "creatures.jpg")), 8)
    img, cw, ch, ax = sheet(cre[:4], 0, 96, "w", "bottom")
    save(img, COMP, "creatures", "Mossback", "Mossback.png")
    meta["sheets"]["mossback"] = {"fw": cw, "fh": ch, "frames": 4, "ax": ax}
    img, cw, ch, ax = sheet(cre[4:], 0, 54, "w", "center")
    save(img, COMP, "creatures", "Glimmerfly", "Glimmerfly.png")
    meta["sheets"]["glimmerfly"] = {"fw": cw, "fh": ch, "frames": 4, "ax": ax}
    fish = objects(key(os.path.join(SRC, "gloomfin.jpg")), 4)
    img, cw, ch, ax = sheet(fish, 0, 86, "w", "center")
    save(img, COMP, "creatures", "Gloomfin", "Gloomfin.png")
    meta["sheets"]["gloomfin"] = {"fw": cw, "fh": ch, "frames": 4, "ax": ax}

    # ---- items: pickups and fixtures
    def item(name, src_img, size, axis):
        s = size * STORE / (src_img.shape[0] if axis == "h" else src_img.shape[1])
        out = trim(resize(src_img, s))
        save(out, COMP, "items", "cave", name, f"{name}.png")
        meta["items"][name] = {"w": out.shape[1], "h": out.shape[0]}

    it = objects(key(os.path.join(SRC, "items.jpg")), 3)
    item("BlueCrystal", it[0], 30, "h")
    item("HeartMoss", it[1], 32, "h")
    item("Heartstone", it[2], 100, "h")
    tree = trim(key(os.path.join(SRC, "tree.jpg")))
    item("BonsaiTree", tree, 240, "h")
    pr = objects(key(os.path.join(SRC, "props.jpg")), 8)
    item("Boulders", pr[0], 110, "w")
    item("MossyBoulder", pr[1], 120, "w")
    item("Kelp", pr[2], 96, "h")
    item("Fern", pr[3], 92, "w")
    item("MossDrip", pr[4], 120, "w")
    item("GrassTuft", pr[5], 64, "w")
    item("GlowShrooms", pr[6], 46, "h")
    item("Stalagmite", pr[7], 72, "h")

    ts = os.path.join(SCENE, "art", "atlas.ts")
    with open(ts, "w") as fh:
        fh.write("// Generated by tools/oka-world/build_art.py. Sizes are stored pixels; divide by STORE for scene units.\n")
        fh.write("/* eslint-disable */\n")
        fh.write(f"export const STORE = {STORE};\n\n")
        fh.write("export interface TerrainFrame {\n    x: number;\n    y: number;\n    w: number;\n    h: number;\n    top?: number;\n    profile: (number | null)[];\n}\n\n")
        fh.write("export interface SheetInfo {\n    fw: number;\n    fh: number;\n    frames: number;\n    ax: number;\n}\n\n")
        fh.write("export const LAYERS = " + json.dumps(meta["layers"]) + ";\n\n")
        fh.write("export const TERRAIN: Record<string, TerrainFrame> = " + json.dumps(meta["terrain"], indent=4) + ";\n\n")
        fh.write("export const SHEETS: Record<string, SheetInfo> = " + json.dumps(meta["sheets"], indent=4) + ";\n\n")
        fh.write("export const ITEMS: Record<string, { w: number; h: number }> = " + json.dumps(meta["items"], indent=4) + ";\n")
    print("wrote", os.path.relpath(ts, ROOT))


if __name__ == "__main__":
    main()
