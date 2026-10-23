/**
 * A small 2D cutout puppet system. Excalibur 0.32 has no skeletal
 * animation, so an actor is a set of painted parts moved by:
 *
 * - clips: keyframed channels ("body.y", "wing.rot") with an easing per key,
 *   sampled by time and cross-faded when the clip changes;
 * - springs: damped followers for overlapping secondary motion, so wings,
 *   robe and halo lag, overshoot and settle;
 * - pulses: squash and stretch kicked by starts, stops and dashes, with the
 *   area kept roughly constant.
 *
 * Pure: no Excalibur, deterministic for a given sequence of updates.
 */

export type EaseName = "linear" | "inSine" | "outSine" | "inOutSine" | "outCubic" | "inOutCubic" | "outBack" | "inBack" | "step";

export const EASE: Record<EaseName, (t: number) => number> = {
    linear: (t) => t,
    inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
    outSine: (t) => Math.sin((t * Math.PI) / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outBack: (t) => {
        const c = 1.70158;
        return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    },
    inBack: (t) => {
        const c = 1.70158;
        return (c + 1) * t * t * t - c * t * t;
    },
    step: (t) => (t < 1 ? 0 : 1),
};

/** A key at time `t` (seconds into the clip). `ease` shapes the segment that ends at this key. */
export interface Key {
    t: number;
    v: number;
    ease?: EaseName;
}

export interface Clip {
    name: string;
    duration: number;
    loop: boolean;
    /** channel name to keys, sorted by time */
    channels: Record<string, Key[]>;
}

export type Pose = Record<string, number>;

/** The value of a track at time t, clamped to its first and last keys. */
export function sampleKeys(keys: readonly Key[], t: number): number {
    if (keys.length === 0) return 0;
    if (t <= keys[0].t) return keys[0].v;
    const last = keys[keys.length - 1];
    if (t >= last.t) return last.v;
    for (let i = 1; i < keys.length; i++) {
        const b = keys[i];
        if (t <= b.t) {
            const a = keys[i - 1];
            const span = b.t - a.t;
            const u = span > 0 ? (t - a.t) / span : 1;
            return a.v + (b.v - a.v) * EASE[b.ease ?? "inOutSine"](u);
        }
    }
    return last.v;
}

/** Clip time for an elapsed time: wrapped for loops, held at the end otherwise. */
export function clipTime(clip: Clip, elapsed: number): number {
    if (clip.duration <= 0) return 0;
    if (!clip.loop) return Math.min(elapsed, clip.duration);
    return ((elapsed % clip.duration) + clip.duration) % clip.duration;
}

export function sampleClip(clip: Clip, elapsed: number): Pose {
    const t = clipTime(clip, elapsed);
    const pose: Pose = {};
    for (const [channel, keys] of Object.entries(clip.channels)) pose[channel] = sampleKeys(keys, t);
    return pose;
}

/** Mix two poses; a channel missing on one side counts as `rest` (0 by default, 1 for scales). */
export function blendPoses(a: Pose, b: Pose, w: number): Pose {
    const out: Pose = {};
    const channels = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const c of channels) {
        const rest = restValue(c);
        const va = a[c] ?? rest;
        const vb = b[c] ?? rest;
        out[c] = va + (vb - va) * w;
    }
    return out;
}

/** Scale channels rest at 1, everything else at 0. */
export function restValue(channel: string): number {
    return channel.endsWith(".sx") || channel.endsWith(".sy") ? 1 : 0;
}

/** A damped spring that follows a target. */
export interface Spring {
    x: number;
    v: number;
}

export function spring(x = 0): Spring {
    return { x, v: 0 };
}

/**
 * Advance a spring toward `target`. `freq` is its natural frequency in Hz
 * and `damping` its damping ratio (1 is critical, below 1 overshoots).
 * Sub-stepped so a long frame can't make it explode.
 */
export function stepSpring(s: Spring, target: number, freq: number, damping: number, dt: number): Spring {
    const w = Math.PI * 2 * freq;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    let { x, v } = s;
    for (let i = 0; i < steps; i++) {
        const a = -w * w * (x - target) - 2 * damping * w * v;
        v += a * h;
        x += v * h;
    }
    return { x, v };
}

/**
 * Squash and stretch as a spring around 0: kick it with an impulse and read
 * back x and y scales whose product stays near 1.
 */
export function squashScale(s: Spring): { sx: number; sy: number } {
    const k = Math.max(-0.45, Math.min(0.45, s.x));
    return { sx: 1 / (1 + k), sy: 1 + k };
}

/** Plays clips with a cross-fade between the outgoing and incoming clip. */
export class ClipPlayer {
    private current: Clip;
    private previous: Clip | null = null;
    private time = 0;
    private prevTime = 0;
    private fade = 0;
    private fadeLength = 0;

    constructor(clip: Clip) {
        this.current = clip;
    }

    get clip(): Clip {
        return this.current;
    }

    get elapsed(): number {
        return this.time;
    }

    /** Switch clips, cross-fading over `fade` seconds. Playing the current clip again does nothing unless `restart`. */
    play(clip: Clip, fade = 0.12, restart = false): void {
        if (clip === this.current && !restart) return;
        this.previous = this.current;
        this.prevTime = this.time;
        this.current = clip;
        this.time = 0;
        this.fade = 0;
        this.fadeLength = fade;
    }

    /** Advance by dt seconds; `rate` speeds the incoming clip up or slows it down. */
    update(dt: number, rate = 1): Pose {
        this.time += dt * rate;
        this.prevTime += dt;
        if (this.previous) this.fade += dt;
        const pose = sampleClip(this.current, this.time);
        if (!this.previous || this.fadeLength <= 0 || this.fade >= this.fadeLength) {
            this.previous = null;
            return pose;
        }
        const w = EASE.inOutSine(this.fade / this.fadeLength);
        return blendPoses(sampleClip(this.previous, this.prevTime), pose, w);
    }

    /** True once a non-looping clip has reached its end. */
    get finished(): boolean {
        return !this.current.loop && this.time >= this.current.duration;
    }
}
