/**
 * Rules every street level shares.
 * Asking, following, the handoff, witnesses, dumpsters, sprinting,
 * and the restart all live here. A later level does not get its own copy.
 */

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Vec {
    x: number;
    y: number;
}

export type Dir = "n" | "e" | "s" | "w";

export const YES_CHANCE = 0.5;
export const HANDOFF_SECONDS = 1.5;
export const TOSS_SECONDS = 1.25;
export const TALK_RANGE = 58;
export const FOLLOW_GAP = 44;
export const PLAYER_WALK = 86;
export const PLAYER_SPRINT = 156;
export const PLAYER_RADIUS = 14;
export const WITNESS_PAD = 4;

export const YES_LINES = [
    "Yeah. Somewhere off the street.",
    "Alright. Lead on.",
    "Sure. Not out here.",
];

export const NO_LINES = ["Nah.", "Not hungry.", "Keep walking."];

export type SalePhase = "idle" | "follow" | "exchange" | "toss";

export type SaleNote = "" | "no" | "yes" | "dismiss" | "paid" | "call" | "free";

export interface Sale {
    phase: SalePhase;
    npc: number | null;
    left: number;
    witnessed: boolean;
    /** Seconds until police spawn. Null means nobody has called. */
    policeIn: number | null;
    money: number;
    heat: boolean;
    sold: number[];
    note: SaleNote;
}

export function freshSale(): Sale {
    return {
        phase: "idle",
        npc: null,
        left: 0,
        witnessed: false,
        policeIn: null,
        money: 0,
        heat: false,
        sold: [],
        note: "",
    };
}

export function ask(sale: Sale, npc: number, roll: number): Sale {
    if (sale.phase !== "idle" || sale.sold.includes(npc)) return { ...sale, note: "" };
    if (roll < YES_CHANCE) return { ...sale, note: "no" };
    return { ...sale, phase: "follow", npc, witnessed: false, note: "yes" };
}

/** Sending them home before any handoff does not call the police. */
export function dismiss(sale: Sale): Sale {
    if (sale.phase !== "follow") return { ...sale, note: "" };
    return { ...sale, phase: "idle", npc: null, witnessed: false, note: "dismiss" };
}

export function beginHandoff(sale: Sale, witnessed: boolean): Sale {
    if (sale.phase !== "follow" || sale.npc === null) return { ...sale, note: "" };
    return { ...sale, phase: "exchange", left: HANDOFF_SECONDS, witnessed, note: "" };
}

/** Backing out after the exchange has started still counts if someone saw it. */
export function abortHandoff(sale: Sale, delay: number): Sale {
    if (sale.phase !== "exchange") return { ...sale, note: "" };
    const call = sale.witnessed && !sale.heat && sale.policeIn === null;
    return {
        ...sale,
        phase: "idle",
        npc: null,
        left: 0,
        witnessed: false,
        policeIn: call ? delay : sale.policeIn,
        note: call ? "call" : "dismiss",
    };
}

export function tickSale(sale: Sale, dt: number, price: number, delay: number): Sale {
    const pending = sale.policeIn;
    let next: Sale = { ...sale, note: "" };
    if (next.phase === "exchange") {
        next.left -= dt;
        if (next.left <= 0) {
            const call = next.witnessed && !next.heat && next.policeIn === null;
            next = {
                ...next,
                phase: "toss",
                left: TOSS_SECONDS,
                money: next.money + price,
                policeIn: call ? delay : next.policeIn,
                note: "paid",
            };
        }
    } else if (next.phase === "toss") {
        next.left -= dt;
        if (next.left <= 0 && next.npc !== null) {
            next = {
                ...next,
                phase: "idle",
                sold: next.sold.includes(next.npc) ? next.sold : [...next.sold, next.npc],
                npc: null,
                left: 0,
                witnessed: false,
                note: "free",
            };
        }
    }
    if (pending !== null) {
        const policeIn = pending - dt;
        if (policeIn <= 0) next = { ...next, policeIn: null, heat: true };
        else next = { ...next, policeIn };
    }
    return next;
}

export function clearHeat(sale: Sale): Sale {
    return { ...sale, heat: false };
}

export interface LightPhase {
    nsGreen: boolean;
    ewGreen: boolean;
}

/** Green each way, then a short all-red gap, then the other way. */
export function lightPhase(time: number, green: number): LightPhase {
    const amber = 0.8;
    const cycle = green * 2 + amber * 2;
    const t = ((time % cycle) + cycle) % cycle;
    if (t < green) return { nsGreen: true, ewGreen: false };
    if (t < green + amber) return { nsGreen: false, ewGreen: false };
    if (t < green * 2 + amber) return { nsGreen: false, ewGreen: true };
    return { nsGreen: false, ewGreen: false };
}

export function gateClosed(
    kind: "light" | "stop" | "yield",
    flow: "ns" | "ew",
    phase: LightPhase,
    crossBusy: boolean,
    stopCleared: boolean
): boolean {
    if (crossBusy) return true;
    if (kind === "yield") return false;
    if (kind === "stop") return !stopCleared;
    return flow === "ns" ? !phase.nsGreen : !phase.ewGreen;
}

export function pointInRect(x: number, y: number, rect: Rect): boolean {
    return x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h;
}

export function circleHitsRect(cx: number, cy: number, radius: number, rect: Rect): boolean {
    const x = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const y = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - x;
    const dy = cy - y;
    return dx * dx + dy * dy < radius * radius;
}

/** A car overlap kills only when the player is off a crosswalk. */
export function carHitsPlayer(px: number, py: number, radius: number, car: Rect, walks: Rect[]): boolean {
    if (walks.some((walk) => pointInRect(px, py, walk))) return false;
    return circleHitsRect(px, py, radius, car);
}

export function slide(pos: Vec, dx: number, dy: number, radius: number, rects: Rect[]): Vec {
    let x = pos.x + dx;
    let y = pos.y;
    if (rects.some((rect) => circleHitsRect(x, y, radius, rect))) x = pos.x;
    y = pos.y + dy;
    if (rects.some((rect) => circleHitsRect(x, y, radius, rect))) y = pos.y;
    return { x, y };
}

export function segmentHitsRect(ax: number, ay: number, bx: number, by: number, rect: Rect): boolean {
    const x0 = rect.x;
    const y0 = rect.y;
    const x1 = rect.x + rect.w;
    const y1 = rect.y + rect.h;
    const dx = bx - ax;
    const dy = by - ay;
    let t0 = 0;
    let t1 = 1;
    const p = [-dx, dx, -dy, dy];
    const q = [ax - x0, x1 - ax, ay - y0, y1 - ay];
    for (let i = 0; i < 4; i++) {
        if (p[i] === 0) {
            if (q[i] < 0) return false;
        } else {
            const t = q[i] / p[i];
            if (p[i] < 0) {
                if (t > t1) return false;
                if (t > t0) t0 = t;
            } else {
                if (t < t0) return false;
                if (t < t1) t1 = t;
            }
        }
    }
    return true;
}

/** Distance and a clear line. Buildings block the line. */
export function sees(ax: number, ay: number, bx: number, by: number, radius: number, blockers: Rect[]): boolean {
    const dx = bx - ax;
    const dy = by - ay;
    if (dx * dx + dy * dy > radius * radius) return false;
    return !blockers.some((rect) =>
        segmentHitsRect(ax, ay, bx, by, {
            x: rect.x - WITNESS_PAD,
            y: rect.y - WITNESS_PAD,
            w: rect.w + WITNESS_PAD * 2,
            h: rect.h + WITNESS_PAD * 2,
        })
    );
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function facingOf(dx: number, dy: number, fallback: Dir): Dir {
    if (dx === 0 && dy === 0) return fallback;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "e" : "w";
    return dy > 0 ? "s" : "n";
}

export function approach(pos: number, dir: 1 | -1, line: number): number {
    return (line - pos) * dir;
}
