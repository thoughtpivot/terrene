import type { Vec } from "./types";

/** Float timers drift by a hair over many 16.67 ms steps. */
const EPSILON = 1e-6;

export function reached(t: number, ms: number): boolean {
    return t >= ms - EPSILON;
}

export function down(timer: number, ms: number): number {
    return Math.max(0, timer - ms);
}

export function length(v: Vec): number {
    return Math.hypot(v.x, v.y);
}

export function normalize(v: Vec, fallback: Vec = { x: 1, y: 0 }): Vec {
    const len = length(v);
    return len > EPSILON ? { x: v.x / len, y: v.y / len } : { ...fallback };
}

export function sub(a: Vec, b: Vec): Vec {
    return { x: a.x - b.x, y: a.y - b.y };
}

export function distance(a: Vec, b: Vec): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

export function moveBy(pos: Vec, dir: Vec, amount: number): Vec {
    return { x: pos.x + dir.x * amount, y: pos.y + dir.y * amount };
}

/** True when `to` lies within `arcDeg` centred on `facing`, seen from `from`. */
export function inArc(from: Vec, facing: Vec, to: Vec, arcDeg: number): boolean {
    if (arcDeg >= 360) return true;
    const dir = sub(to, from);
    const len = length(dir);
    if (len < EPSILON) return true;
    const f = normalize(facing);
    const cos = (f.x * dir.x + f.y * dir.y) / len;
    return cos >= Math.cos(((arcDeg / 2) * Math.PI) / 180) - EPSILON;
}

/** Mulberry32. The seed lives in the combat state so every run replays exactly. */
export function nextRandom(holder: { rng: number }): number {
    holder.rng = (holder.rng + 0x6d2b79f5) >>> 0;
    let t = holder.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
