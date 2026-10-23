/**
 * Pure HUD logic: bar maths, cooldown display state, the halo's two channels
 * (lives and Stain), corruption tier labels, toast timing and the layout.
 * No Excalibur import, so all of it runs under node:test.
 */
import { clamp } from "./color";
import { MAX_CORRUPTION, MAX_STAIN, ROMAN, TIER_NAMES, haloRed } from "./theme";

export function ratio(value: number, max: number): number {
    if (!(max > 0) || !Number.isFinite(value)) return 0;
    return clamp(value / max);
}

// ------------------------------------------------------------------ bars

/** How long the damage trail waits before it drains, in seconds. */
export const TRAIL_HOLD = 0.45;
/** How fast the damage trail drains, in bar fractions per second. */
export const TRAIL_RATE = 0.7;
/** How fast a fill rises on a heal, in bar fractions per second. */
export const GAIN_RATE = 1.1;

/**
 * A bar's displayed state over time. Damage drops the fill at once and leaves
 * a red trail that holds, then drains; a heal shows a bright gain segment and
 * eases the fill up to it.
 */
export class BarTracker {
    fill: number;
    trail: number;
    gain: number;
    private hold = 0;

    constructor(initial = 1) {
        this.fill = clamp(initial);
        this.trail = this.fill;
        this.gain = this.fill;
    }

    update(target: number, dt: number): this {
        const t = clamp(target);
        if (t < this.fill - 1e-6) {
            if (this.trail < this.fill) this.trail = this.fill;
            this.fill = t;
            this.gain = t;
            this.hold = TRAIL_HOLD;
        } else if (t > this.fill + 1e-6) {
            this.gain = t;
            this.fill = Math.min(t, this.fill + GAIN_RATE * dt);
        } else {
            this.fill = t;
            this.gain = t;
        }
        if (this.hold > 0) {
            this.hold = Math.max(0, this.hold - dt);
        } else if (this.trail > this.fill) {
            this.trail = Math.max(this.fill, this.trail - TRAIL_RATE * dt);
        }
        if (this.trail < this.fill) this.trail = this.fill;
        return this;
    }
}

export interface HpView {
    fill: number;
    /** healable maximum: below 1 when the halo is dimmed */
    cap: number;
    low: boolean;
    critical: boolean;
}

export function hpView(hp: number, max: number, healCap = max): HpView {
    const fill = ratio(hp, max);
    return { fill, cap: Math.max(fill, ratio(healCap, max)), low: fill < 0.3, critical: fill < 0.15 };
}

export type PostureLevel = "calm" | "warning" | "danger";

export const POSTURE_WARNING = 0.7;
export const POSTURE_DANGER = 0.9;

export function postureView(posture: number, max: number): { fill: number; level: PostureLevel } {
    const fill = ratio(posture, max);
    return { fill, level: fill >= POSTURE_DANGER ? "danger" : fill >= POSTURE_WARNING ? "warning" : "calm" };
}

/** Spending this much Fervour (G) is an Outcry. */
export const OUTCRY_COST = 40;

export function fervourView(fervour: number, max: number, cost = OUTCRY_COST): { fill: number; notch: number; canOutcry: boolean } {
    return { fill: ratio(fervour, max), notch: ratio(cost, max), canOutcry: max > 0 && fervour >= cost };
}

// ------------------------------------------------------------- cooldowns

export type CooldownState = "ready" | "cooling" | "locked";

export interface CooldownView {
    state: CooldownState;
    /** share of the cooldown still to run, 1 just used, 0 ready */
    remaining: number;
    /** seconds left as shown, empty when ready or locked */
    label: string;
    /** brief flash when it comes off cooldown, 0..1 */
    flash: number;
}

/** How long the ready flash lasts, in seconds. */
export const READY_FLASH = 0.35;

export function formatSeconds(seconds: number): string {
    if (!(seconds > 0)) return "";
    if (seconds < 10) return (Math.ceil(seconds * 10) / 10).toFixed(1);
    return String(Math.ceil(seconds));
}

export function cooldownView(remaining: number, duration: number, sinceReady = Infinity, locked = false): CooldownView {
    if (locked) return { state: "locked", remaining: 0, label: "", flash: 0 };
    if (remaining > 0 && duration > 0) {
        return { state: "cooling", remaining: clamp(remaining / duration), label: formatSeconds(remaining), flash: 0 };
    }
    const flash = sinceReady >= 0 && sinceReady < READY_FLASH ? 1 - sinceReady / READY_FLASH : 0;
    return { state: "ready", remaining: 0, label: "", flash };
}

// ------------------------------------------------------------------ halo

export type HaloMark = "pure" | "hairline" | "cracked" | "fallen" | "regard" | "fall";

export interface HaloState {
    lives: number;
    maxLives: number;
    /** struck down once: the halo glows at about half */
    dimmed: boolean;
    /** no lives left */
    castOut: boolean;
    /** glow brightness from lives alone, 0..1 */
    brightness: number;
    /** number of cracks in the ring */
    crackCount: number;
    /** how far the cracks reach across the ring's width, 0..1 */
    crackDepth: number;
    /** red seeping in from the cracks, 0..1 */
    red: number;
    embers: boolean;
    flicker: boolean;
    shattered: boolean;
    mark: HaloMark;
    /** the Stain threshold still ahead, or null at the Fall */
    nextThreshold: number | null;
}

export const STAIN_THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * The halo carries two channels, as the progression doc asks: lives set its
 * brightness, and Stain sets its cracks and colour. Neither touches the other.
 */
export function haloState(lives: number, stain: number, maxLives = 2): HaloState {
    const l = Math.max(0, Math.min(maxLives, Math.floor(lives)));
    const s = clamp(Number.isFinite(stain) ? stain : 0, 0, MAX_STAIN);
    const castOut = l <= 0;
    const dimmed = l < maxLives;
    const mark: HaloMark = s >= 100 ? "fall" : s >= 75 ? "regard" : s >= 50 ? "fallen" : s >= 25 ? "cracked" : s > 0 ? "hairline" : "pure";
    return {
        lives: l,
        maxLives,
        dimmed,
        castOut,
        brightness: castOut ? 0.15 : dimmed ? 0.5 : 1,
        crackCount: s <= 0 ? 0 : Math.min(8, 1 + Math.floor(s / 12.5)),
        crackDepth: s <= 0 ? 0 : clamp(0.18 + 0.82 * Math.pow(s / MAX_STAIN, 0.8)),
        red: haloRed(s),
        embers: s >= 50,
        flicker: s >= 75,
        shattered: s >= 100,
        mark,
        nextThreshold: STAIN_THRESHOLDS.find((t) => s < t) ?? null,
    };
}

export const HALO_MARK_LABELS: Record<HaloMark, string> = {
    pure: "Unstained",
    hairline: "Hairline cracks",
    cracked: "Cracked halo",
    fallen: "Choir fallen",
    regard: "Hell's regard",
    fall: "The Fall",
};

// ------------------------------------------------------------------ tier

export interface TierView {
    tier: number;
    roman: string;
    name: string;
    /** progress through the current tier, 0..1, and 1 at Tier 5 */
    progress: number;
}

export function tierView(corruption: number): TierView {
    const c = clamp(Number.isFinite(corruption) ? corruption : 0, 0, MAX_CORRUPTION);
    const tier = Math.min(MAX_CORRUPTION, Math.floor(c));
    return { tier, roman: ROMAN[tier], name: TIER_NAMES[tier], progress: tier >= MAX_CORRUPTION ? 1 : c - tier };
}

// ---------------------------------------------------------------- toasts

export type ToastKind = "grace" | "info" | "warning" | "danger";

export interface Toast {
    id: number;
    title: string;
    detail: string;
    kind: ToastKind;
    age: number;
    ttl: number;
}

export const TOAST_FADE_IN = 0.25;
export const TOAST_FADE_OUT = 0.6;
export const MAX_TOASTS = 3;

export function toastAlpha(t: Toast): number {
    return clamp(Math.min(t.age / TOAST_FADE_IN, (t.ttl - t.age) / TOAST_FADE_OUT));
}

/** Notifications stack downward from the top and drop the oldest past three. */
export class ToastQueue {
    items: Toast[] = [];
    private next = 1;

    push(title: string, detail = "", kind: ToastKind = "info", ttl = 4): Toast {
        const toast: Toast = { id: this.next++, title, detail, kind, age: 0, ttl };
        this.items.push(toast);
        while (this.items.length > MAX_TOASTS) this.items.shift();
        return toast;
    }

    update(dt: number): void {
        for (const t of this.items) t.age += dt;
        this.items = this.items.filter((t) => t.age < t.ttl);
    }
}

/** Characters shown by a typewriter after `elapsed` seconds. */
export function typewriter(text: string, elapsed: number, charsPerSecond = 48): number {
    if (elapsed <= 0) return 0;
    return Math.min(text.length, Math.floor(elapsed * charsPerSecond));
}

// ---------------------------------------------------------------- layout

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** The HUD is designed at 1280x720 and scaled to fit the screen. */
export const REF_W = 1280;
export const REF_H = 720;

/** Widget sizes in reference pixels. */
export const SIZES = {
    vitals: { w: 368, h: 150 },
    hotbar: { w: 452, h: 86 },
    tier: { w: 252, h: 64 },
    dialogue: { w: 640, h: 132 },
    prompt: { w: 260, h: 40 },
    toast: { w: 340, h: 58 },
    margin: 22,
} as const;

export interface HudLayout {
    scale: number;
    vitals: Rect;
    hotbar: Rect;
    tier: Rect;
    dialogue: Rect;
    prompt: Rect;
    /** top-centre of the first toast */
    toasts: { x: number; y: number; w: number; gap: number };
}

/**
 * Deepwoken keeps the HUD in a low band at the bottom with the middle of the
 * screen clear; this does the same: vitals bottom-left, the hotbar bottom
 * centre, the tier top-right, toasts top-centre, and dialogue just above the
 * hotbar. Returns screen-space rects, already scaled.
 */
export function hudLayout(width: number, height: number): HudLayout {
    const s = Math.max(0.5, Math.min(width / REF_W, height / REF_H));
    const m = SIZES.margin * s;
    const rect = (x: number, y: number, size: { w: number; h: number }): Rect => ({ x, y, w: size.w * s, h: size.h * s });
    const hotbar = rect(width / 2 - (SIZES.hotbar.w * s) / 2, height - m - SIZES.hotbar.h * s, SIZES.hotbar);
    const dialogue = rect(width / 2 - (SIZES.dialogue.w * s) / 2, hotbar.y - 20 * s - SIZES.dialogue.h * s, SIZES.dialogue);
    return {
        scale: s,
        vitals: rect(m, height - m - SIZES.vitals.h * s, SIZES.vitals),
        hotbar,
        tier: rect(width - m - SIZES.tier.w * s, m, SIZES.tier),
        dialogue,
        prompt: rect(width / 2 - (SIZES.prompt.w * s) / 2, height * 0.52, SIZES.prompt),
        toasts: { x: width / 2, y: m, w: SIZES.toast.w * s, gap: 8 * s },
    };
}
