/**
 * Builds the Heaven Or Hell sprite atlases from the source paintings in
 * tools/heaven-or-hell/source/ (see prompts.md for how each was made).
 *
 *   node tools/heaven-or-hell/build-art.ts
 *
 * Every painting is on a flat magenta field and drawn for the one fixed
 * camera: orthographic, about 46 degrees down, looking along a diagonal, so
 * a square footprint shows as a diamond 0.72 times as tall as it is wide.
 * The script keys the field out, evens out each painting's footprint to that
 * ratio, scales it to twice its on-screen size (crisp at a pixel ratio of 2),
 * extracts an emissive pass of the glowing parts, cuts the hero into puppet
 * parts, and packs everything into atlas pages with a generated atlas.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jpeg from "jpeg-js";
import pngjs from "pngjs";
import {
    band, blank, blit, borderColor, components, crop, despillEdges, emissive, keepBoxes, keyOut,
    opaqueBounds, outline, pack, pad, pageHeight, ramp, resize, unionBox,
    type Box, type Hsv, type Img, type Rgb,
} from "./image.ts";

const { PNG } = pngjs;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SOURCE = path.join(HERE, "source");
const SCENE_ART = path.join(ROOT, "src/components/scenes/HeavenOrHell/art");
const HERO_DIR = path.join(ROOT, "src/components/characters/player/Tenth");

/** Footprint height over width for the locked camera (sin of the ~46 degree pitch). */
const FOOTPRINT_RATIO = 0.72;
/** Sprites are stored at this multiple of their on-screen size. */
const STORE = 2;
const PAGE = 2048;
const HERO_GOLD: Rgb = [255, 206, 92];

type Glow = (c: Hsv, x: number, y: number) => number;

interface PropSpec {
    name: string;
    src: string;
    /** on-screen height in scene pixels (720p) */
    height?: number;
    /** on-screen width, for decals */
    width?: number;
    /** this painting's own footprint ratio, corrected to FOOTPRINT_RATIO */
    footRatio?: number;
    /** share of the trimmed width that is the footprint on the ground */
    foot: number;
    /** split into this many vertical strips, each depth-sorted by its own base */
    slices?: number;
    decal?: boolean;
    /** anchor at the horizontal centre instead of under the lowest pixel (loose clusters) */
    centred?: boolean;
    glow?: Glow;
}

const flame: Glow = (c) => {
    const whiteHot = c.s < 0.35 && c.v > 0.9 ? ramp(c.v, 0.9, 1) : 0;
    const yellow = c.h > 28 && c.h < 66 && c.s > 0.45 ? ramp(c.v, 0.78, 0.98) : 0;
    return Math.max(whiteHot, yellow);
};

const hellfire: Glow = (c) => {
    const hot = (c.h < 48 || c.h > 345) && c.s > 0.55 ? ramp(c.v, 0.45, 0.85) : 0;
    const core = c.h > 30 && c.h < 62 && c.s > 0.3 ? ramp(c.v, 0.82, 1) : 0;
    return Math.max(hot, core);
};

const PROPS: PropSpec[] = [
    { name: "pillar-a", src: "pillar-a.jpg", height: 330, foot: 1, footRatio: 0.72 },
    { name: "pillar-b", src: "pillar-b.jpg", height: 315, foot: 1, footRatio: 0.75 },
    { name: "pillar-broken", src: "pillar-broken.jpg", height: 185, foot: 1, footRatio: 0.64 },
    {
        name: "brazier", src: "brazier.jpg", height: 150, foot: 0.98, footRatio: 0.7,
        glow: (c, _x, y) => (y < 0.32 ? flame(c) : 0),
    },
    {
        name: "altar", src: "altar.jpg", height: 225, foot: 1, footRatio: 0.72,
        glow: (c, _x, y) => (y < 0.24 ? Math.max(flame(c), c.v > 0.92 && c.s < 0.5 ? 1 : 0) : 0),
    },
    { name: "statue", src: "statue.jpg", height: 265, foot: 1, footRatio: 0.7 },
    { name: "arch-wall", src: "arch-wall.jpg", height: 290, foot: 1, slices: 4 },
    { name: "rubble", src: "rubble.jpg", height: 100, foot: 0.8, centred: true },
    { name: "hell-spikes", src: "hell-spikes.jpg", height: 185, foot: 0.75, glow: hellfire },
    { name: "breach", src: "breach.jpg", width: 560, foot: 1, footRatio: 0.77, decal: true, glow: hellfire },
    { name: "floor-plaza", src: "floor-plaza.jpg", width: 760, foot: 1, footRatio: 0.62, decal: true },
];

interface Frame {
    name: string;
    img: Img;
    /** anchor in stored pixels: the footprint centre, or the centre for decals */
    ax: number;
    ay: number;
    /** on-screen size over stored size */
    scale: number;
    /** footprint width on screen */
    foot: number;
    glow?: { img: Img; ox: number; oy: number };
}

function readJpeg(file: string): Img {
    const raw = jpeg.decode(fs.readFileSync(path.join(SOURCE, file)), { useTArray: true, formatAsRGBA: true });
    return { w: raw.width, h: raw.height, data: new Uint8ClampedArray(raw.data) };
}

function writePng(file: string, img: Img): void {
    const png = new PNG({ width: img.w, height: img.h });
    png.data = Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength);
    fs.writeFileSync(file, PNG.sync.write(png, { colorType: 6 }));
}

/** Key the field out and keep the painted object, dropping specks. */
function cutOut(file: string): Img {
    const src = readJpeg(file);
    const keyed = despillEdges(keyOut(src, borderColor(src)));
    const parts = components(keyed, 400);
    const kept = keepBoxes(keyed, parts);
    return crop(kept, opaqueBounds(kept, 24) ?? unionBox(parts));
}

/** Trim a glow image to its own bounds and remember where it sits on the frame. */
function trimGlow(img: Img): Frame["glow"] {
    const b = opaqueBounds(img, 6);
    if (!b) return undefined;
    const g = pad(crop(img, b), 2);
    return { img: g, ox: b.x - 2, oy: b.y - 2 };
}

/** The lowest opaque pixel in columns [x0, x1): the front corner of the footprint. */
function frontCorner(img: Img, x0 = 0, x1 = img.w): { x: number; y: number } {
    for (let y = img.h - 1; y >= 0; y--) {
        let sum = 0;
        let n = 0;
        for (let x = x0; x < x1; x++) {
            if (img.data[(y * img.w + x) * 4 + 3] > 128) {
                sum += x;
                n++;
            }
        }
        if (n > 0) return { x: sum / n, y };
    }
    return { x: (x0 + x1) / 2, y: img.h - 1 };
}

function buildProp(spec: PropSpec): Frame[] {
    const cut = cutOut(spec.src);
    const yFix = spec.footRatio ? FOOTPRINT_RATIO / spec.footRatio : 1;
    const screenW = spec.width ?? (spec.height! / (cut.h * yFix)) * cut.w;
    const screenH = spec.height ?? (spec.width! / cut.w) * cut.h * yFix;
    const storeW = Math.min(Math.round(screenW * STORE), Math.round(cut.w * Math.max(1, yFix)));
    const scale = screenW / storeW;
    const storeH = Math.round(screenH / scale);
    const img = resize(cut, storeW, storeH);
    const glowAll = spec.glow ? emissive(img, spec.glow) : null;
    const strips = spec.slices ?? 1;
    const frames: Frame[] = [];
    for (let s = 0; s < strips; s++) {
        const x0 = Math.round((s / strips) * img.w);
        const x1 = Math.round(((s + 1) / strips) * img.w);
        const piece = strips === 1 ? img : crop(img, { x: x0, y: 0, w: x1 - x0, h: img.h });
        const footW = (spec.foot * img.w) / strips;
        let ax: number;
        let ay: number;
        if (spec.decal) {
            ax = piece.w / 2;
            ay = piece.h / 2;
        } else {
            const corner = frontCorner(piece);
            ax = strips === 1 && !spec.centred ? corner.x : piece.w / 2;
            ay = corner.y - (footW * FOOTPRINT_RATIO) / 2;
        }
        const glowPiece = glowAll ? (strips === 1 ? glowAll : crop(glowAll, { x: x0, y: 0, w: x1 - x0, h: img.h })) : null;
        frames.push({
            name: strips === 1 ? spec.name : `${spec.name}-${s}`,
            img: piece,
            ax,
            ay,
            scale,
            foot: footW * scale,
            glow: glowPiece ? trimGlow(glowPiece) : undefined,
        });
    }
    return frames;
}

/** A soft white dot, the additive sprite behind every light and particle. */
function glowDot(size: number): Img {
    const img = blank(size, size);
    const c = size / 2;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c;
            const a = d >= 1 ? 0 : Math.pow(1 - d, 2.2);
            const i = (y * size + x) * 4;
            img.data[i] = 255;
            img.data[i + 1] = 255;
            img.data[i + 2] = 255;
            img.data[i + 3] = a * 255;
        }
    }
    return img;
}

/** The soft contact shadow under a hovering actor, a flattened dark ellipse. */
function shadow(w: number, h: number): Img {
    const img = blank(w, h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const d = Math.hypot((x + 0.5 - w / 2) / (w / 2), (y + 0.5 - h / 2) / (h / 2));
            const a = d >= 1 ? 0 : Math.pow(1 - d, 1.4) * 0.85;
            img.data[(y * w + x) * 4 + 3] = a * 255;
        }
    }
    return img;
}

/**
 * The halo: a ring seen at the camera's pitch, white-hot at its core and
 * gold toward the edges, with a little soft falloff baked in. Drawn
 * additively, so the bloom pass catches it.
 */
function halo(rx: number, ry: number, thick: number): Img {
    const m = Math.ceil(thick * 3);
    const w = Math.ceil(rx * 2 + m * 2);
    const h = Math.ceil(ry * 2 + m * 2);
    const img = blank(w, h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const px = x + 0.5 - w / 2;
            const py = (y + 0.5 - h / 2) * (rx / ry);
            const d = Math.abs(Math.hypot(px, py) - rx) / thick;
            const core = Math.max(0, 1 - d);
            const soft = Math.exp(-d * d * 0.5) * 0.45;
            const a = Math.min(1, core * 1.2 + soft);
            const heat = Math.min(1, core * 1.4);
            const i = (y * w + x) * 4;
            img.data[i] = 255;
            img.data[i + 1] = 196 + 59 * heat;
            img.data[i + 2] = 80 + 170 * heat;
            img.data[i + 3] = a * 255;
        }
    }
    return img;
}

/** Floor slabs are diamonds this wide and FOOTPRINT_RATIO as tall, on screen. */
const SLAB = 250;
/** The floor texture repeats every FLOOR_PERIODS slabs each way. */
const FLOOR_PERIODS = 3;

/** [x frequency, y frequency, amplitude, phase] per term of the floor's marble pattern. */
const MARBLE: [number, number, number, number][] = [
    [1, 2, 0.04, 0.3], [3, -1, 0.03, 1.7], [5, 4, 0.02, 2.9], [-7, 6, 0.012, 0.8], [11, 3, 0.008, 4.1],
];

function hash2(a: number, b: number): number {
    let h = Math.imul(a * 374761393 + b * 668265263, 1274126177) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * The floor: chunky bevelled marble slabs laid on the camera's diagonals,
 * lit from the upper left like the paintings, with black ink in the joints.
 * Painted as albedo; the lighting shader darkens it to near-black away from
 * light. Seamless: slab tones repeat with the texture's period.
 */
function floorTile(): Img {
    const slabH = SLAB * FOOTPRINT_RATIO;
    const w = Math.round(SLAB * FLOOR_PERIODS * STORE);
    const h = Math.round(slabH * FLOOR_PERIODS * STORE);
    const img = blank(w, h);
    const P = FLOOR_PERIODS * 2;
    for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
            const x = (px + 0.5) / STORE;
            const y = (py + 0.5) / STORE;
            const u = x / SLAB + y / slabH;
            const v = x / SLAB - y / slabH;
            const cu = Math.round(u);
            const cv = Math.round(v);
            const fu = u - cu;
            const fv = v - cv;
            const tone = hash2((((cu + cv) % P) + P) % P, (((cu - cv) % P) + P) % P);
            // distance to each edge, in screen pixels (roughly: one uv unit is SLAB/2 across)
            const toEdge = (f: number) => (0.5 - Math.abs(f)) * SLAB * 0.5;
            const eu = toEdge(fu);
            const ev = toEdge(fv);
            const edge = Math.min(eu, ev);
            let value = 0.4 + (tone - 0.5) * 0.12;
            const bevel = 7;
            if (edge < bevel) {
                // upper-left and upper-right edges face the key light
                const lit = (eu < ev ? fu < 0 : fv > 0) ? 1 : -1;
                value += lit > 0 ? 0.12 : -0.16;
            }
            const grain = (hash2(px * 3 + 7, py * 5 + 3) - 0.5) * 0.025;
            // marble mottling and veins from whole-number frequencies, so the tile stays seamless
            const tx = px / w;
            const ty = py / h;
            let mottle = 0;
            for (const [kx, ky, a, ph] of MARBLE) mottle += a * Math.sin(Math.PI * 2 * (kx * tx + ky * ty) + ph);
            const vein = Math.abs(Math.sin(Math.PI * 2 * (2 * tx + 3 * ty) + mottle * 9 + tone * 6));
            value += grain + mottle * 0.6 - (vein < 0.05 ? (0.05 - vein) * 1.4 : 0);
            if (tone > 0.86 && Math.abs(fu - fv * 0.6) < 0.012 && edge > bevel) value -= 0.18;
            const ink = edge < 1.6 ? 1 - edge / 1.6 : 0;
            value = value * (1 - ink) + 0.03 * ink;
            const i = (py * w + px) * 4;
            img.data[i] = value * 236;
            img.data[i + 1] = value * 240;
            img.data[i + 2] = value * 255;
            img.data[i + 3] = 255;
        }
    }
    return img;
}

interface HeroPart {
    name: string;
    img: Img;
    /** where the part's top-left sits, relative to the view's anchor (hem centre), stored px */
    ox: number;
    oy: number;
    glow?: Frame["glow"];
}

/** The four painted views, left to right on the sheet. Facings use these and their mirrors. */
const HERO_VIEWS = ["s", "se", "ne", "n"] as const;
/** On-screen height of the hero's body (hood to hem), scene pixels. */
const HERO_HEIGHT = 86;
/** Cut lines as fractions of the body's height: hood above NECK, the hem below WAIST. */
const NECK = 0.4;
const WAIST = 0.66;
const FEATHER = 0.08;

const heroGlow: Glow = (c) => {
    const gold = c.h > 30 && c.h < 64 && c.s > 0.4 ? ramp(c.v, 0.5, 0.9) : 0;
    return gold;
};

function buildHero(): { parts: HeroPart[]; extras: Frame[]; viewHeight: number; scale: number } {
    const src = readJpeg("hero-sheet.jpg");
    const keyed = despillEdges(keyOut(src, borderColor(src)));
    const views = components(keyed, 2000).slice(0, 4).sort((a, b) => a.x - b.x);
    if (views.length !== 4) throw new Error(`hero sheet: expected 4 views, found ${views.length}`);
    const tallest = Math.max(...views.map((v) => v.h));
    const scale = HERO_HEIGHT / (tallest * 1.0);
    const storeScale = scale * STORE;
    const parts: HeroPart[] = [];
    views.forEach((box: Box, i) => {
        const view = HERO_VIEWS[i];
        const body = crop(keepBoxes(keyed, [box]), box);
        const w = Math.round(body.w * storeScale);
        const h = Math.round(body.h * storeScale);
        const lined = outline(resize(body, w, h), 1.6, HERO_GOLD);
        // the outline pads the image by 3 px on every side
        const padPx = (lined.w - w) / 2;
        const anchorX = lined.w / 2;
        const anchorY = lined.h - padPx;
        const cuts: [string, number, number][] = [["head", 0, NECK], ["torso", NECK, WAIST], ["hem", WAIST, 1]];
        for (const [part, top, bottom] of cuts) {
            const bandImg = band(lined, top === 0 ? 0 : (padPx + top * h) / lined.h, bottom === 1 ? 1 : (padPx + bottom * h) / lined.h, (FEATHER * h) / lined.h);
            const b = opaqueBounds(bandImg, 4);
            if (!b) continue;
            const pieceImg = crop(bandImg, b);
            parts.push({
                name: `${view}-${part}`,
                img: pieceImg,
                ox: b.x - anchorX,
                oy: b.y - anchorY,
                glow: trimGlow(emissive(pieceImg, heroGlow)),
            });
        }
    });

    const wingSrc = cutOut("hero-wing.jpg");
    const wingH = Math.round(HERO_HEIGHT * 0.82 * STORE);
    const wing = resize(wingSrc, Math.round((wingSrc.w / wingSrc.h) * wingH), wingH);
    const armSrc = cutOut("hero-arm.jpg");
    const armW = Math.round(HERO_HEIGHT * 0.95 * STORE);
    const arm = resize(armSrc, armW, Math.round((armSrc.h / armSrc.w) * armW));
    const wingGlow: Glow = (c) => (c.h > 38 && c.h < 66 && c.s > 0.5 ? ramp(c.v, 0.55, 0.9) : 0);
    const extras: Frame[] = [
        // the wing root is its lower-left corner, the arm's pivot the shoulder end
        { name: "wing", img: wing, ax: wing.w * 0.12, ay: wing.h * 0.86, scale: 1 / STORE, foot: 0, glow: trimGlow(emissive(wing, wingGlow)) },
        { name: "arm", img: arm, ax: arm.w * 0.08, ay: arm.h * 0.5, scale: 1 / STORE, foot: 0, glow: trimGlow(emissive(arm, (c, x) => (x > 0.4 ? flame(c) : heroGlow(c) * 0.6))) },
    ];
    const ring = halo(22 * STORE, 7 * STORE, 1.6 * STORE);
    extras.push({ name: "halo", img: ring, ax: ring.w / 2, ay: ring.h / 2, scale: 1 / STORE, foot: 0 });
    const contact = shadow(64 * STORE, 22 * STORE);
    extras.push({ name: "shadow", img: contact, ax: contact.w / 2, ay: contact.h / 2, scale: 1 / STORE, foot: 0 });
    const dot = glowDot(64 * STORE);
    extras.push({ name: "glow", img: dot, ax: dot.w / 2, ay: dot.h / 2, scale: 1 / STORE, foot: 0 });
    return { parts, extras, viewHeight: HERO_HEIGHT, scale: 1 / STORE };
}

interface PackItem {
    name: string;
    img: Img;
}

function packPages(items: PackItem[], prefix: string, dir: string): { pages: string[]; at: Map<string, { page: number; x: number; y: number; w: number; h: number }> } {
    const placed = pack(items.map((i) => ({ name: i.name, w: i.img.w, h: i.img.h })), PAGE);
    const count = Math.max(...placed.map((p) => p.page)) + 1;
    const pages: string[] = [];
    const at = new Map<string, { page: number; x: number; y: number; w: number; h: number }>();
    for (let page = 0; page < count; page++) {
        const sheet = blank(PAGE, pageHeight(placed, page));
        for (const p of placed.filter((q) => q.page === page)) {
            blit(sheet, items.find((i) => i.name === p.name)!.img, p.x, p.y);
            at.set(p.name, p);
        }
        const file = `${prefix}-${page}.png`;
        writePng(path.join(dir, file), sheet);
        pages.push(file);
        console.log(`🎨 ${file}: ${sheet.w}x${sheet.h}, ${placed.filter((q) => q.page === page).length} frames`);
    }
    return { pages, at };
}

const round = (n: number) => Math.round(n * 100) / 100;

function rect(r: { page: number; x: number; y: number; w: number; h: number }): string {
    return `page: ${r.page}, x: ${r.x}, y: ${r.y}, w: ${r.w}, h: ${r.h}`;
}

const HEADER = "// Generated by tools/heaven-or-hell/build-art.ts from the paintings in\n// tools/heaven-or-hell/source/. Do not edit by hand: change the script and re-run it.\n";

function main(): void {
    fs.mkdirSync(SCENE_ART, { recursive: true });
    fs.mkdirSync(HERO_DIR, { recursive: true });

    const floor = floorTile();
    writePng(path.join(SCENE_ART, "floor-tile.png"), floor);
    console.log(`🎨 floor-tile.png: ${floor.w}x${floor.h}`);

    const frames = PROPS.flatMap(buildProp);
    frames.push({ name: "glow-dot", img: glowDot(128), ax: 64, ay: 64, scale: 0.5, foot: 0 });
    frames.push({ name: "shadow", img: shadow(128, 64), ax: 64, ay: 32, scale: 0.5, foot: 0 });
    const propItems: PackItem[] = [];
    for (const f of frames) {
        propItems.push({ name: f.name, img: f.img });
        if (f.glow) propItems.push({ name: `${f.name}:glow`, img: f.glow.img });
    }
    const props = packPages(propItems, "heaven-props", SCENE_ART);
    const propLines = frames.map((f) => {
        const r = props.at.get(f.name)!;
        const g = f.glow ? props.at.get(`${f.name}:glow`)! : null;
        const glow = g && f.glow ? `, glow: { ${rect(g)}, ox: ${f.glow.ox}, oy: ${f.glow.oy} }` : "";
        return `    "${f.name}": { ${rect(r)}, ax: ${round(f.ax)}, ay: ${round(f.ay)}, scale: ${Math.round(f.scale * 10000) / 10000}, foot: ${round(f.foot)}${glow} },`;
    });
    fs.writeFileSync(path.join(SCENE_ART, "atlas.ts"), `${HEADER}
import type { AtlasFrame } from "./types.ts";

/** The camera every painting was made for: footprint height over width. */
export const FOOTPRINT_RATIO = ${FOOTPRINT_RATIO};

export const PROP_PAGES = ${JSON.stringify(props.pages)};

/** The repeating floor texture: stored size, and on-screen pixels per stored pixel. */
export const FLOOR_TILE = { w: ${floor.w}, h: ${floor.h}, scale: ${1 / STORE} };

export const PROP_FRAMES = {
${propLines.join("\n")}
} satisfies Record<string, AtlasFrame>;

export type PropName = keyof typeof PROP_FRAMES;
`);

    const hero = buildHero();
    const heroItems: PackItem[] = [];
    for (const p of hero.parts) {
        heroItems.push({ name: p.name, img: p.img });
        if (p.glow) heroItems.push({ name: `${p.name}:glow`, img: p.glow.img });
    }
    for (const f of hero.extras) {
        heroItems.push({ name: f.name, img: f.img });
        if (f.glow) heroItems.push({ name: `${f.name}:glow`, img: f.glow.img });
    }
    const heroPages = packPages(heroItems, "Tenth", HERO_DIR);
    if (heroPages.pages.length !== 1) throw new Error("the hero must fit one atlas page");
    fs.renameSync(path.join(HERO_DIR, heroPages.pages[0]), path.join(HERO_DIR, "Tenth.png"));
    const partLines = hero.parts.map((p) => {
        const r = heroPages.at.get(p.name)!;
        const g = p.glow ? heroPages.at.get(`${p.name}:glow`)! : null;
        const glow = g && p.glow ? `, glow: { ${rect(g)}, ox: ${p.glow.ox}, oy: ${p.glow.oy} }` : "";
        return `    "${p.name}": { ${rect(r)}, ox: ${round(p.ox)}, oy: ${round(p.oy)}${glow} },`;
    });
    const extraLines = hero.extras.map((f) => {
        const r = heroPages.at.get(f.name)!;
        const g = f.glow ? heroPages.at.get(`${f.name}:glow`)! : null;
        const glow = g && f.glow ? `, glow: { ${rect(g)}, ox: ${f.glow.ox}, oy: ${f.glow.oy} }` : "";
        return `    "${f.name}": { ${rect(r)}, ax: ${round(f.ax)}, ay: ${round(f.ay)}, scale: ${f.scale}, foot: 0${glow} },`;
    });
    fs.writeFileSync(path.join(HERO_DIR, "Tenth.atlas.ts"), `${HEADER}
import type { AtlasFrame, PartFrame } from "../../../scenes/HeavenOrHell/art/types.ts";

/** Stored pixels per on-screen pixel is 1 / HERO_SCALE. */
export const HERO_SCALE = ${hero.scale};
/** On-screen height of the body, hood to hem. */
export const HERO_HEIGHT = ${hero.viewHeight};
/** Where the cuts between hood, torso and hem fall, as fractions of the body height. */
export const HERO_CUTS = { neck: ${NECK}, waist: ${WAIST} };

/** Body parts per painted view, placed relative to the hem's bottom centre. */
export const HERO_PARTS = {
${partLines.join("\n")}
} satisfies Record<string, PartFrame>;

export const HERO_EXTRAS = {
${extraLines.join("\n")}
} satisfies Record<string, AtlasFrame>;

export type HeroView = ${HERO_VIEWS.map((v) => `"${v}"`).join(" | ")};
`);
    console.log(`✅ ${frames.length} prop frames, ${hero.parts.length} hero parts`);
}

main();
