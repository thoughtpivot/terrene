/**
 * How Auriel moves: an eight-way hover with a short dash. Tuned to feel
 * immediate: full speed in about four frames and a stop in about three, so
 * a tap moves the hero at once and a release halts it crisply. Pure.
 */

export interface Vec2 {
    x: number;
    y: number;
}

export const WALK_SPEED = 235;
/** pixels per second squared */
export const ACCEL = 3400;
export const DECEL = 4600;
export const DASH_SPEED = 780;
export const DASH_TIME = 0.17;
/** from the end of one dash to the start of the next */
export const DASH_COOLDOWN = 0.22;
/** the hero's footprint radius for collisions */
export const RADIUS = 15;

export interface Motion {
    x: number;
    y: number;
    vx: number;
    vy: number;
    /** seconds of dash left, 0 when not dashing */
    dash: number;
    dashDir: Vec2;
    /** seconds until a dash is allowed */
    cooldown: number;
}

export interface MotionEvents {
    started: boolean;
    stopped: boolean;
    dashEnded: boolean;
}

export function freshMotion(x: number, y: number): Motion {
    return { x, y, vx: 0, vy: 0, dash: 0, dashDir: { x: 1, y: 0 }, cooldown: 0 };
}

export function canDash(m: Motion): boolean {
    return m.dash <= 0 && m.cooldown <= 0;
}

/** Start a dash toward `move`, or toward `aim` when standing still, or the way the hero last went. */
export function startDash(m: Motion, move: Vec2, aim: Vec2 | null): Motion {
    let dir = move.x !== 0 || move.y !== 0 ? move : aim ?? m.dashDir;
    const len = Math.hypot(dir.x, dir.y) || 1;
    dir = { x: dir.x / len, y: dir.y / len };
    return { ...m, dash: DASH_TIME, dashDir: dir, vx: dir.x * DASH_SPEED, vy: dir.y * DASH_SPEED };
}

/** Advance by dt seconds toward the wanted direction `move` (unit vector or zero). */
export function stepMotion(m: Motion, move: Vec2, dt: number): { motion: Motion; events: MotionEvents } {
    const wasMoving = Math.hypot(m.vx, m.vy) > 1;
    let { vx, vy, dash, cooldown } = m;
    let dashEnded = false;
    if (dash > 0) {
        dash -= dt;
        if (dash <= 0) {
            dash = 0;
            dashEnded = true;
            cooldown = DASH_COOLDOWN;
            // come out of the dash at walking speed, not from a standstill
            vx = m.dashDir.x * WALK_SPEED;
            vy = m.dashDir.y * WALK_SPEED;
        }
    } else {
        cooldown = Math.max(0, cooldown - dt);
        const tx = move.x * WALK_SPEED;
        const ty = move.y * WALK_SPEED;
        const wants = move.x !== 0 || move.y !== 0;
        const rate = (wants ? ACCEL : DECEL) * dt;
        // accelerate along the wanted direction as a vector, so diagonals are not faster
        const dx = tx - vx;
        const dy = ty - vy;
        const gap = Math.hypot(dx, dy);
        if (gap <= rate) {
            vx = tx;
            vy = ty;
        } else {
            vx += (dx / gap) * rate;
            vy += (dy / gap) * rate;
        }
    }
    const motion: Motion = { x: m.x + vx * dt, y: m.y + vy * dt, vx, vy, dash, dashDir: m.dashDir, cooldown };
    const moving = Math.hypot(vx, vy) > 1;
    return { motion, events: { started: moving && !wasMoving, stopped: !moving && wasMoving, dashEnded } };
}
