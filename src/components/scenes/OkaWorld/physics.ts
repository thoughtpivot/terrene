/**
 * Small platformer physics for Oka World, in scene units (the 960x540 screen).
 *
 * - Surfaces are one-way polylines you land on from above. They follow the
 *   painted top of each rock, so slabs can be tilted into ramps.
 * - Solids are rectangles that block from every side (ground runs, walls).
 * - Water regions slow you down and let you swim.
 */

export interface Point {
    x: number;
    y: number;
}

export interface Surface {
    pts: Point[];
    /** Solid tops are not one-way: they come from a Solid rect. */
    solid?: boolean;
}

export interface Solid {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Water {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** A body's position is the middle of its feet. */
export interface Body {
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    grounded: boolean;
    ground: Surface | null;
}

export const GRAVITY = 1500;
export const MAX_FALL = 760;

export function heightAt(s: Surface, x: number): number | null {
    const p = s.pts;
    if (x < p[0].x || x > p[p.length - 1].x) return null;
    for (let i = 1; i < p.length; i++) {
        if (x <= p[i].x) {
            const a = p[i - 1];
            const b = p[i];
            const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
            return a.y + (b.y - a.y) * t;
        }
    }
    return p[p.length - 1].y;
}

export class OkaPhysics {
    surfaces: Surface[] = [];
    solids: Solid[] = [];
    waters: Water[] = [];

    addSurface(pts: Point[], solid = false): Surface {
        const sorted = pts.slice().sort((a, b) => a.x - b.x);
        const s: Surface = { pts: sorted, solid };
        this.surfaces.push(s);
        return s;
    }

    addSolid(x: number, y: number, w: number, h: number): Solid {
        const s = { x, y, w, h };
        this.solids.push(s);
        this.addSurface([{ x, y }, { x: x + w, y }], true);
        return s;
    }

    addWater(x: number, y: number, w: number, h: number): Water {
        const water = { x, y, w, h };
        this.waters.push(water);
        return water;
    }

    waterAt(x: number, y: number): Water | null {
        for (const w of this.waters) {
            if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return w;
        }
        return null;
    }

    /** Highest walkable height under x at or below `fromY - reach`. */
    groundBelow(x: number, fromY: number, reach = 6): { y: number; s: Surface } | null {
        let best: { y: number; s: Surface } | null = null;
        for (const s of this.surfaces) {
            const h = heightAt(s, x);
            if (h === null || h < fromY - reach) continue;
            if (!best || h < best.y) best = { y: h, s };
        }
        return best;
    }

    /**
     * Move a body by its velocity. Resolves solids on each axis, then one-way
     * surfaces for landings. Returns true if the body landed this step.
     */
    move(b: Body, dt: number, dropThrough = false): boolean {
        const wasGrounded = b.grounded;
        const prevFeet = b.y;

        b.x += b.vx * dt;
        this.resolveX(b);

        b.y += b.vy * dt;
        let landed = false;
        const hit = this.resolveY(b);
        if (hit === "floor") landed = true;

        if (!landed && b.vy >= 0) {
            // one-way surfaces: land only when the feet cross the line going down
            let best: { y: number; s: Surface } | null = null;
            for (const s of this.surfaces) {
                if (dropThrough && !s.solid) continue;
                const h = this.surfaceUnder(s, b);
                if (h === null) continue;
                const before = prevFeet - 0.5;
                if (before <= h + 1 && b.y >= h - 0.001) {
                    if (!best || h < best.y) best = { y: h, s };
                }
            }
            // stick to slopes and bumps while walking
            if (!best && wasGrounded && b.vy >= 0) {
                for (const s of this.surfaces) {
                    if (dropThrough && !s.solid) continue;
                    const h = this.surfaceUnder(s, b);
                    if (h === null) continue;
                    if (h >= b.y - 10 && h <= b.y + 12) {
                        if (!best || h < best.y) best = { y: h, s };
                    }
                }
            }
            if (best) {
                b.y = best.y;
                b.vy = 0;
                b.ground = best.s;
                landed = true;
            }
        }
        b.grounded = landed;
        if (!landed) b.ground = null;
        return landed && !wasGrounded;
    }

    /** Height of a surface under the body's feet, sampling its centre and edges. */
    private surfaceUnder(s: Surface, b: Body): number | null {
        const half = b.w * 0.3;
        let best: number | null = null;
        for (const x of [b.x, b.x - half, b.x + half]) {
            const h = heightAt(s, x);
            if (h === null) continue;
            if (best === null || h < best) best = h;
        }
        // centre sample wins on slopes so feet do not float off the edge of a ramp
        const c = heightAt(s, b.x);
        if (c !== null && best !== null && Math.abs(c - best) < 10) return c;
        return best;
    }

    private overlaps(b: Body, s: Solid): boolean {
        return b.x + b.w / 2 > s.x && b.x - b.w / 2 < s.x + s.w && b.y > s.y && b.y - b.h < s.y + s.h;
    }

    private resolveX(b: Body): void {
        for (const s of this.solids) {
            if (!this.overlaps(b, s)) continue;
            // let the body step up onto a top it is basically standing on
            if (b.y - s.y < 8) continue;
            if (b.vx > 0 || b.x < s.x + s.w / 2) {
                b.x = s.x - b.w / 2 - 0.01;
            } else {
                b.x = s.x + s.w + b.w / 2 + 0.01;
            }
            b.vx = 0;
        }
    }

    private resolveY(b: Body): "floor" | "ceiling" | null {
        let result: "floor" | "ceiling" | null = null;
        for (const s of this.solids) {
            if (!this.overlaps(b, s)) continue;
            if (b.vy >= 0 && b.y - s.y < 24) {
                b.y = s.y;
                b.vy = 0;
                b.ground = this.surfaces.find((surf) => surf.solid && surf.pts[0].x === s.x && surf.pts[0].y === s.y) ?? null;
                result = "floor";
            } else if (b.vy < 0) {
                b.y = s.y + s.h + b.h + 0.01;
                b.vy = 0;
                result = "ceiling";
            }
        }
        return result;
    }
}
