/**
 * Chunk math for streaming the open map. The world is a grid of equal
 * chunks; a chunk loads when the hero comes within LOAD_DISTANCE of its
 * edge and unloads only once the hero is UNLOAD_DISTANCE away, so walking
 * along a border never makes a chunk flicker in and out.
 */

export interface Grid {
    cols: number;
    rows: number;
    /** chunk size in world pixels */
    size: number;
}

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Plan {
    /** nearest first */
    load: string[];
    unload: string[];
}

export const LOAD_DISTANCE = 900;
export const UNLOAD_DISTANCE = 1300;

export function chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
}

export function parseKey(key: string): { cx: number; cy: number } {
    const [cx, cy] = key.split(",").map(Number);
    return { cx, cy };
}

export function inGrid(grid: Grid, cx: number, cy: number): boolean {
    return cx >= 0 && cy >= 0 && cx < grid.cols && cy < grid.rows;
}

/** The chunk containing a world point, or null outside the map. */
export function chunkAt(grid: Grid, x: number, y: number): { cx: number; cy: number } | null {
    const cx = Math.floor(x / grid.size);
    const cy = Math.floor(y / grid.size);
    return inGrid(grid, cx, cy) ? { cx, cy } : null;
}

export function chunkRect(grid: Grid, cx: number, cy: number): Rect {
    return { x: cx * grid.size, y: cy * grid.size, w: grid.size, h: grid.size };
}

export function worldRect(grid: Grid): Rect {
    return { x: 0, y: 0, w: grid.cols * grid.size, h: grid.rows * grid.size };
}

/** Distance from a point to the nearest edge of a rectangle; 0 inside. */
export function distanceToRect(x: number, y: number, r: Rect): number {
    const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
    const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
    return Math.hypot(dx, dy);
}

/** Every chunk within `distance` of the point, nearest first. */
export function chunksNear(grid: Grid, x: number, y: number, distance: number): string[] {
    const reach = Math.ceil(distance / grid.size) + 1;
    const home = { cx: Math.floor(x / grid.size), cy: Math.floor(y / grid.size) };
    const found: { key: string; d: number }[] = [];
    for (let cy = home.cy - reach; cy <= home.cy + reach; cy++) {
        for (let cx = home.cx - reach; cx <= home.cx + reach; cx++) {
            if (!inGrid(grid, cx, cy)) continue;
            const d = distanceToRect(x, y, chunkRect(grid, cx, cy));
            if (d <= distance) found.push({ key: chunkKey(cx, cy), d });
        }
    }
    found.sort((a, b) => a.d - b.d || (a.key < b.key ? -1 : 1));
    return found.map((f) => f.key);
}

/** What to load and unload this frame, given what is loaded and where the hero is. */
export function planStreaming(
    grid: Grid,
    loaded: Iterable<string>,
    x: number,
    y: number,
    load = LOAD_DISTANCE,
    unload = UNLOAD_DISTANCE,
): Plan {
    const have = new Set(loaded);
    const toLoad = chunksNear(grid, x, y, load).filter((key) => !have.has(key));
    const toUnload: string[] = [];
    for (const key of have) {
        const { cx, cy } = parseKey(key);
        if (!inGrid(grid, cx, cy) || distanceToRect(x, y, chunkRect(grid, cx, cy)) > unload) toUnload.push(key);
    }
    toUnload.sort();
    return { load: toLoad, unload: toUnload };
}

/** A small seeded generator (mulberry32), so a chunk dresses the same way every time it loads. */
export function seeded(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function chunkSeed(cx: number, cy: number, worldSeed = 7): number {
    return (Math.imul(cx + 101, 73856093) ^ Math.imul(cy + 37, 19349663) ^ Math.imul(worldSeed, 83492791)) >>> 0;
}
