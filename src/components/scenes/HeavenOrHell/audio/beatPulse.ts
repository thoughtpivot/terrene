import { MAX_CORRUPTION, Tier } from "./musicSpec";

/** Vibration amplitude at full velocity for Tier 0 and Tier 5; linear in between. */
export const PULSE_PX_MIN = 0.5;
export const PULSE_PX_MAX = 3;
export const PULSE_MS_MIN = 80;
export const PULSE_MS_MAX = 120;
export const GLOW_MIN = 0.12;
export const GLOW_MAX = 0.6;
/** Slides and dives ring a little longer and brighter than straight hits. */
const GLIDE_MS = 15;
const GLIDE_GLOW = 1.2;
/** Quiet hits still read: velocity scales between this floor and 1. */
const VELOCITY_FLOOR = 0.55;
/** Oscillation rate of the vibration; ~2 frames per cycle at 60 fps. */
export const VIBRATE_HZ = 30;

export interface PulseInput {
    /** 0..1 */
    velocity: number;
    slide: boolean;
}

export interface BeatPulse {
    /** Peak offset in CSS/world pixels. */
    vibratePx: number;
    /** Time for the vibration to decay to ~5%. */
    vibrateMs: number;
    /** Additive bloom/glow intensity at the hit, decaying over about vibrateMs * 1.5. */
    glowBoost: number;
    /** Direction of the vibration in radians (random per hit). */
    angle: number;
}

/**
 * Tier-scaled 808 pulse: a short, small vibration (not a camera shake; combat
 * shake stays reserved for hits and parries) plus a glow boost for the bloom pass.
 * `random` is injectable so tests and replays are deterministic.
 */
export function beatPulse(hit: PulseInput, tier: Tier, random: () => number = Math.random): BeatPulse {
    const t = Math.min(1, Math.max(0, tier / MAX_CORRUPTION));
    const v = VELOCITY_FLOOR + (1 - VELOCITY_FLOOR) * Math.min(1, Math.max(0, hit.velocity));
    return {
        vibratePx: (PULSE_PX_MIN + (PULSE_PX_MAX - PULSE_PX_MIN) * t) * v,
        vibrateMs: PULSE_MS_MIN + (PULSE_MS_MAX - PULSE_MS_MIN) * t + (hit.slide ? GLIDE_MS : 0),
        glowBoost: (GLOW_MIN + (GLOW_MAX - GLOW_MIN) * t) * v * (hit.slide ? GLIDE_GLOW : 1),
        angle: random() * Math.PI * 2,
    };
}

/** Offset of the vibration `elapsedMs` after the hit: a decaying ~30 Hz oscillation along the pulse angle. */
export function vibrationOffset(pulse: BeatPulse, elapsedMs: number): { x: number; y: number } {
    if (elapsedMs < 0 || elapsedMs >= pulse.vibrateMs) return { x: 0, y: 0 };
    const env = Math.exp((-3 * elapsedMs) / pulse.vibrateMs);
    const a = pulse.vibratePx * env * Math.cos((2 * Math.PI * VIBRATE_HZ * elapsedMs) / 1000);
    return { x: a * Math.cos(pulse.angle), y: a * Math.sin(pulse.angle) };
}

/** Glow intensity `elapsedMs` after the hit (fast attack already passed, exponential release). */
export function glowLevel(pulse: BeatPulse, elapsedMs: number): number {
    if (elapsedMs < 0) return 0;
    const releaseMs = pulse.vibrateMs * 1.5;
    if (elapsedMs >= releaseMs * 2) return 0;
    return pulse.glowBoost * Math.exp((-2 * elapsedMs) / releaseMs);
}
