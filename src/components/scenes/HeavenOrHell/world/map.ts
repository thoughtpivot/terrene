/**
 * The map of Heaven for M1: a 5x5 grid of chunks. The centre chunk is the
 * fully dressed ruined temple; the others are simply dressed from a seed,
 * with Hell's corruption thickening toward the east. Pure data: the scene
 * turns a ChunkDef into actors when the chunk streams in.
 */
import { FOOTPRINT_RATIO, PROP_FRAMES, type PropName } from "../art/atlas.ts";
import { LIGHT, type Rgb } from "../palette.ts";
import { chunkKey, chunkRect, chunkSeed, seeded, type Grid } from "./chunks.ts";

export const GRID: Grid = { cols: 5, rows: 5, size: 1536 };
export const HOME = { cx: 2, cy: 2 };

export interface Placement {
    kind: PropName;
    x: number;
    y: number;
    flip?: boolean;
}

export interface LightDef {
    x: number;
    y: number;
    /** reach in world pixels */
    r: number;
    color: Rgb;
    intensity: number;
    /** 0..1 how much it flickers */
    flicker: number;
}

/** A footprint the hero cannot enter: an ellipse at the camera's ratio. */
export interface Footprint {
    x: number;
    y: number;
    rx: number;
    ry: number;
}

/** A point that throws particles: embers from Hell, motes from holy light. */
export interface Emitter {
    x: number;
    y: number;
    kind: "embers" | "motes";
    rate: number;
}

export interface ChunkDef {
    key: string;
    cx: number;
    cy: number;
    dressed: boolean;
    /** 0 is pure Heaven, 1 is overrun */
    corruption: number;
    props: Placement[];
    decals: Placement[];
    lights: LightDef[];
    colliders: Footprint[];
    emitters: Emitter[];
}

/** Ground coordinates along the camera's two diagonals, to screen-space world pixels. */
export function iso(gx: number, gy: number): { x: number; y: number } {
    const k = Math.SQRT1_2;
    return { x: (gx - gy) * k, y: (gx + gy) * k * FOOTPRINT_RATIO };
}

const COLLIDES: Partial<Record<PropName, number>> = {
    "pillar-a": 0.62,
    "pillar-b": 0.62,
    "pillar-broken": 0.6,
    brazier: 0.6,
    altar: 0.78,
    statue: 0.66,
    rubble: 0.62,
    "hell-spikes": 0.58,
    "arch-wall-0": 0.85,
    "arch-wall-1": 0.85,
    "arch-wall-2": 0.85,
    "arch-wall-3": 0.85,
};

/** The collider for a prop: its footprint, shrunk so the hero can brush right up to it. */
export function footprintOf(p: Placement): Footprint | null {
    const share = COLLIDES[p.kind];
    if (!share) return null;
    const rx = (PROP_FRAMES[p.kind].foot / 2) * share;
    return { x: p.x, y: p.y, rx, ry: rx * FOOTPRINT_RATIO };
}

export const ARCH_STRIPS: PropName[] = ["arch-wall-0", "arch-wall-1", "arch-wall-2", "arch-wall-3"];

/**
 * The arch wall is cut into strips that each sort on their own base, so the
 * hero can pass behind its high end and in front of its low end. (x, y) is
 * the bottom centre of the whole painting.
 */
export function archWall(x: number, y: number, flip = false): Placement[] {
    const frames = ARCH_STRIPS.map((k) => PROP_FRAMES[k]);
    const totalW = frames.reduce((sum, f) => sum + f.w * f.scale, 0);
    const totalH = frames[0].h * frames[0].scale;
    const x0 = x - totalW / 2;
    const y0 = y - totalH;
    const out: Placement[] = [];
    let left = 0;
    ARCH_STRIPS.forEach((kind, i) => {
        const f = frames[i];
        const ax = x0 + left + f.ax * f.scale;
        out.push({ kind, x: flip ? 2 * x - ax : ax, y: y0 + f.ay * f.scale, flip });
        left += f.w * f.scale;
    });
    return out;
}

function holyLight(x: number, y: number, r: number, intensity: number, flicker = 0.18): LightDef {
    return { x, y, r, color: LIGHT.holy, intensity, flicker };
}

function hellLight(x: number, y: number, r: number, intensity: number): LightDef {
    return { x, y, r, color: LIGHT.hellfire, intensity, flicker: 0.35 };
}

/** The ruined temple at the centre of the map. */
function templeChunk(cx: number, cy: number): Omit<ChunkDef, "key" | "colliders"> {
    const rect = chunkRect(GRID, cx, cy);
    const ox = rect.x + rect.w / 2;
    const oy = rect.y + rect.h / 2;
    const at = (gx: number, gy: number) => {
        const p = iso(gx, gy);
        return { x: ox + p.x, y: oy + p.y };
    };
    const props: Placement[] = [];
    const decals: Placement[] = [];
    const lights: LightDef[] = [];
    const emitters: Emitter[] = [];

    decals.push({ kind: "floor-plaza", ...at(0, 0) });
    const altar = at(-170, -170);
    props.push({ kind: "altar", ...altar });
    lights.push({ ...holyLight(altar.x, altar.y - 70, 460, 0.95, 0.06), color: LIGHT.white });
    emitters.push({ x: altar.x, y: altar.y - 110, kind: "motes", rate: 10 });

    for (const [gx, gy] of [[260, -260], [-260, 260], [270, 270]] as const) {
        const b = at(gx, gy);
        props.push({ kind: "brazier", ...b });
        lights.push(holyLight(b.x, b.y - 55, 340, 0.9));
        emitters.push({ x: b.x, y: b.y - 70, kind: "motes", rate: 5 });
    }

    // a ring of columns around the plaza, broken and fallen in places
    const ring = 470;
    const steps = [-1, -0.5, 0, 0.5, 1];
    const kinds: (PropName | null)[] = [
        "pillar-a", "pillar-b", "pillar-broken", "pillar-a", "pillar-b",
        "pillar-a", null, "pillar-a",
        "pillar-broken", "pillar-b",
        "pillar-a", "pillar-b", "rubble", "pillar-broken", "pillar-a",
        "pillar-b",
    ];
    const seen = new Set<string>();
    let k = 0;
    for (const side of [0, 1, 2, 3]) {
        for (const s of steps) {
            const g = side === 0 ? [s * ring, -ring] : side === 1 ? [ring, s * ring] : side === 2 ? [s * ring, ring] : [-ring, s * ring];
            const id = `${g[0]},${g[1]}`;
            if (seen.has(id)) continue;
            seen.add(id);
            const kind = kinds[k++ % kinds.length];
            // leave the front and east corners open: the way in, and the way to the breach
            if (!kind || (g[0] === ring && g[1] === ring) || (g[0] === ring && g[1] === -ring)) continue;
            props.push({ kind, ...at(g[0], g[1]), flip: k % 3 === 0 });
        }
    }

    props.push(...archWall(ox - 640, oy - 120));
    props.push({ kind: "statue", ...at(-620, 40) });
    props.push({ kind: "statue", ...at(40, -640), flip: true });
    props.push({ kind: "rubble", ...at(-540, 420) });
    props.push({ kind: "pillar-broken", ...at(-700, -380) });

    // Hell breaking in at the east edge
    const breach = { x: ox + 560, y: oy + 40 };
    decals.push({ kind: "breach", ...breach });
    lights.push(hellLight(breach.x, breach.y, 560, 1.3));
    emitters.push({ x: breach.x, y: breach.y, kind: "embers", rate: 26 });
    for (const [dx, dy, flip] of [[-120, -210, false], [210, -130, true], [130, 200, false], [330, 60, true]] as const) {
        props.push({ kind: "hell-spikes", x: breach.x + dx, y: breach.y + dy, flip });
    }
    lights.push(hellLight(breach.x + 300, breach.y + 60, 260, 0.8));

    return { cx, cy, dressed: true, corruption: 0.35, props, decals, lights, emitters };
}

/** Any other chunk: a few seeded clusters of ruins around a brazier, more Hell further east. */
function plainChunk(cx: number, cy: number): Omit<ChunkDef, "key" | "colliders"> {
    const rand = seeded(chunkSeed(cx, cy));
    const rect = chunkRect(GRID, cx, cy);
    const corruption = Math.max(0, Math.min(1, (cx - 2) / 2 + (rand() - 0.5) * 0.2));
    const props: Placement[] = [];
    const decals: Placement[] = [];
    const lights: LightDef[] = [];
    const emitters: Emitter[] = [];
    const margin = 220;
    const clusters = 2 + Math.floor(rand() * 2);
    const spots: { x: number; y: number }[] = [];
    for (let i = 0; i < clusters * 6 && spots.length < clusters; i++) {
        const x = rect.x + margin + rand() * (rect.w - margin * 2);
        const y = rect.y + margin + rand() * (rect.h - margin * 2);
        if (spots.every((s) => Math.hypot(s.x - x, s.y - y) > 520)) spots.push({ x, y });
    }
    for (const spot of spots) {
        const hellish = rand() < corruption;
        if (hellish) {
            props.push({ kind: "hell-spikes", ...spot, flip: rand() < 0.5 });
            lights.push(hellLight(spot.x, spot.y - 30, 360, 1.0));
            emitters.push({ ...spot, kind: "embers", rate: 8 });
            if (corruption > 0.6 && rand() < 0.7) {
                decals.push({ kind: "breach", x: spot.x + 40, y: spot.y + 150 });
                lights.push(hellLight(spot.x + 40, spot.y + 150, 420, 1.1));
            }
        } else {
            props.push({ kind: "brazier", ...spot });
            lights.push(holyLight(spot.x, spot.y - 55, 340, 0.95));
        }
        const around = 2 + Math.floor(rand() * 3);
        for (let j = 0; j < around; j++) {
            const a = (j / around) * Math.PI * 2 + rand() * 0.8;
            const d = 190 + rand() * 90;
            const p = iso(Math.cos(a) * d, Math.sin(a) * d);
            const roll = rand();
            const kind: PropName = roll < 0.3 ? "pillar-a" : roll < 0.5 ? "pillar-b" : roll < 0.72 ? "pillar-broken" : roll < 0.88 ? "rubble" : "statue";
            props.push({ kind: hellish && rand() < 0.4 ? "hell-spikes" : kind, x: spot.x + p.x, y: spot.y + p.y, flip: rand() < 0.5 });
        }
    }
    return { cx, cy, dressed: false, corruption, props, decals, lights, emitters };
}

export function chunkDef(cx: number, cy: number): ChunkDef {
    const base = cx === HOME.cx && cy === HOME.cy ? templeChunk(cx, cy) : plainChunk(cx, cy);
    const colliders = base.props.map(footprintOf).filter((f): f is Footprint => f !== null);
    return { key: chunkKey(cx, cy), ...base, colliders };
}

/** Where the hero starts: on the plaza, in front of the altar. */
export function spawnPoint(): { x: number; y: number } {
    const rect = chunkRect(GRID, HOME.cx, HOME.cy);
    const p = iso(120, 120);
    return { x: rect.x + rect.w / 2 + p.x, y: rect.y + rect.h / 2 + p.y };
}
