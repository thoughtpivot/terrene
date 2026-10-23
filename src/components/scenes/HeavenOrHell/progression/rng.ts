/**
 * Seeded randomness. Every roll takes a uint32 state and returns the next one,
 * so the same seed always gives the same run.
 */

export interface Roll<T> {
    value: T;
    rng: number;
}

export function seedRng(seed: number): number {
    let h = (seed ^ 0x9e3779b9) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
}

/** mulberry32: a float in [0, 1). */
export function rollFloat(rng: number): Roll<number> {
    let t = (rng + 0x6d2b79f5) | 0;
    const next = t >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: next };
}

export function rollInt(rng: number, maxExclusive: number): Roll<number> {
    const r = rollFloat(rng);
    return { value: Math.floor(r.value * maxExclusive), rng: r.rng };
}

export function rollChance(rng: number, chance: number): Roll<boolean> {
    const r = rollFloat(rng);
    return { value: r.value < chance, rng: r.rng };
}

/** Picks by weight. Returns null for an empty or zero-weight list. */
export function rollWeighted<T>(rng: number, entries: readonly { item: T; weight: number }[]): Roll<T | null> {
    const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
    const r = rollFloat(rng);
    if (total <= 0) return { value: null, rng: r.rng };
    let target = r.value * total;
    for (const entry of entries) {
        target -= Math.max(0, entry.weight);
        if (target < 0) return { value: entry.item, rng: r.rng };
    }
    return { value: entries[entries.length - 1].item, rng: r.rng };
}

export function shuffle<T>(rng: number, items: readonly T[]): Roll<T[]> {
    const out = items.slice();
    let state = rng;
    for (let i = out.length - 1; i > 0; i--) {
        const r = rollInt(state, i + 1);
        state = r.rng;
        const swap = out[i];
        out[i] = out[r.value];
        out[r.value] = swap;
    }
    return { value: out, rng: state };
}
