/**
 * Input for Heaven Or Hell, kept pure so it can be tested and so the M2
 * combat can plug straight in. The scene reads keys and the mouse into a
 * `RawInput` each frame; `readIntent` turns that into what the hero wants.
 * Presses go through an `InputBuffer`, so an action pressed a little before
 * it is allowed still fires on the first frame it can.
 */

/** Everything the hero can be asked to do. M1 uses `dash`; the rest are bound and buffered for M2. */
export type Action = "dash" | "attack" | "feint" | "parry" | "block" | "roll" | "critical";

/** How long a press waits in the buffer, in milliseconds. */
export const BUFFER_MS = 150;

export interface Vec2 {
    x: number;
    y: number;
}

export interface RawInput {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    /** the mouse in world pixels */
    aim: Vec2 | null;
    /** actions whose key or button went down this frame */
    pressed: Action[];
    /** actions whose key or button is held */
    held: Action[];
}

export interface Intent {
    /** unit vector or zero */
    move: Vec2;
    /** unit vector from the hero toward the mouse, or null without a mouse */
    aim: Vec2 | null;
    held: Action[];
}

interface Press {
    action: Action;
    at: number;
}

/** Presses waiting to be used. Times are in milliseconds on any steady clock. */
export class InputBuffer {
    private presses: Press[] = [];

    press(action: Action, at: number): void {
        this.presses.push({ action, at });
    }

    /** True, and the press is used up, when `action` was pressed within `windowMs` of `now`. */
    consume(action: Action, now: number, windowMs = BUFFER_MS): boolean {
        this.prune(now, windowMs);
        const i = this.presses.findIndex((p) => p.action === action);
        if (i < 0) return false;
        this.presses.splice(i, 1);
        return true;
    }

    /** Is a press of `action` waiting, without using it? */
    peek(action: Action, now: number, windowMs = BUFFER_MS): boolean {
        return this.presses.some((p) => p.action === action && now - p.at <= windowMs);
    }

    prune(now: number, windowMs = BUFFER_MS): void {
        this.presses = this.presses.filter((p) => now - p.at <= windowMs);
    }

    clear(): void {
        this.presses = [];
    }

    get size(): number {
        return this.presses.length;
    }
}

/** WASD to a unit vector; opposite keys cancel. Screen-relative: W is up the screen. */
export function moveVector(up: boolean, down: boolean, left: boolean, right: boolean): Vec2 {
    const x = (right ? 1 : 0) - (left ? 1 : 0);
    const y = (down ? 1 : 0) - (up ? 1 : 0);
    if (x === 0 && y === 0) return { x: 0, y: 0 };
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
}

export function readIntent(raw: RawInput, hero: Vec2): Intent {
    let aim: Vec2 | null = null;
    if (raw.aim) {
        const dx = raw.aim.x - hero.x;
        const dy = raw.aim.y - hero.y;
        const len = Math.hypot(dx, dy);
        if (len > 4) aim = { x: dx / len, y: dy / len };
    }
    return { move: moveVector(raw.up, raw.down, raw.left, raw.right), aim, held: raw.held };
}

/**
 * One of eight facings from a direction, clockwise from east on screen:
 * 0 east, 1 south-east, 2 south, 3 south-west, 4 west, 5 north-west,
 * 6 north, 7 north-east.
 */
export function facing8(dx: number, dy: number): number {
    const a = Math.atan2(dy, dx);
    return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
}

export type View = "s" | "se" | "ne" | "n";

/**
 * The painted view and mirror for a facing. Four views are painted (south,
 * south-east, north-east, north); east and west use the south-east view,
 * and the western facings are mirrors.
 */
export function viewFor(facing: number): { view: View; flip: boolean } {
    switch (((facing % 8) + 8) % 8) {
        case 0: return { view: "se", flip: false };
        case 1: return { view: "se", flip: false };
        case 2: return { view: "s", flip: false };
        case 3: return { view: "se", flip: true };
        case 4: return { view: "se", flip: true };
        case 5: return { view: "ne", flip: true };
        case 6: return { view: "n", flip: false };
        default: return { view: "ne", flip: false };
    }
}

/** Key bindings: WASD to move, Space to dash, and the Deepwoken layout reserved for M2. */
export const KEY_ACTIONS: Record<string, Action> = {
    Space: "dash",
    KeyF: "parry",
    KeyQ: "roll",
    KeyR: "critical",
};

export const MOUSE_ACTIONS: Record<number, Action> = {
    0: "attack",
    2: "feint",
};
