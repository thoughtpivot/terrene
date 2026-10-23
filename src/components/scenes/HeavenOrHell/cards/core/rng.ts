/** mulberry32 step. `value` is in [0, 1). `next` is the uint32 seed. */
export function nextRng(state: number): { value: number; next: number } {
    let t = (state + 0x6d2b79f5) | 0;
    const next = t >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return { value, next };
}

export function shuffleWithRng<T>(items: readonly T[], rngState: number): { items: T[]; rngState: number } {
    const nextItems = items.slice();
    let state = rngState;
    for (let i = nextItems.length - 1; i > 0; i--) {
        const rolled = nextRng(state);
        state = rolled.next;
        const j = Math.floor(rolled.value * (i + 1));
        const swap = nextItems[i];
        nextItems[i] = nextItems[j];
        nextItems[j] = swap;
    }
    return { items: nextItems, rngState: state };
}
