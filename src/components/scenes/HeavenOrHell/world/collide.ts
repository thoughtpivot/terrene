/**
 * Keeping the hero out of props. Every collider is a footprint ellipse at
 * the camera's ratio, so the test runs in "ground space", where y is
 * stretched back by 1 / ratio and every footprint becomes a circle.
 */
import type { Rect } from "./chunks.ts";
import type { Footprint } from "./map.ts";

export interface Point {
    x: number;
    y: number;
}

/**
 * Push a circle of `radius` (ground pixels) at `p` out of every footprint
 * it overlaps, then keep it inside `bounds`. A few passes settle a spot
 * wedged between two props.
 */
export function resolve(p: Point, radius: number, colliders: readonly Footprint[], bounds: Rect | null): Point {
    let x = p.x;
    let y = p.y;
    for (let pass = 0; pass < 3; pass++) {
        let moved = false;
        for (const c of colliders) {
            const ratio = c.ry / c.rx;
            const dx = x - c.x;
            const dy = (y - c.y) / ratio;
            const reach = c.rx + radius;
            const d2 = dx * dx + dy * dy;
            if (d2 >= reach * reach) continue;
            const d = Math.sqrt(d2);
            const nx = d > 1e-6 ? dx / d : 0;
            const ny = d > 1e-6 ? dy / d : 1;
            x = c.x + nx * reach;
            y = c.y + ny * reach * ratio;
            moved = true;
        }
        if (!moved) break;
    }
    if (bounds) {
        x = Math.max(bounds.x + radius, Math.min(bounds.x + bounds.w - radius, x));
        y = Math.max(bounds.y + radius, Math.min(bounds.y + bounds.h - radius, y));
    }
    return { x, y };
}

/** Depth for an actor or prop standing at world y: further down the screen draws in front. */
export function depthOf(y: number): number {
    return Math.round(y * 4) / 4;
}

/** Layers that never sort with actors. */
export const Z = {
    floor: -100000,
    floorDetail: -99990,
    decal: -99980,
    decalGlow: -99970,
    pools: -99960,
    overlay: 100000,
    debug: 100100,
    hud: 100200,
} as const;
