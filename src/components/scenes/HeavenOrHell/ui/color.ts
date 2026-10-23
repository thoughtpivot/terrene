/**
 * Colour maths for the Heaven Or Hell UI. Pure: no Excalibur, no DOM, so the
 * theme can be tested in Node.
 */

export interface Rgb {
    r: number;
    g: number;
    b: number;
}

export function clamp(v: number, lo = 0, hi = 1): number {
    return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** Hermite ease from 0 at `edge0` to 1 at `edge1`, flat outside. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = clamp((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

export function hex(value: string): Rgb {
    const h = value.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
    const k = clamp(t);
    return { r: lerp(a.r, b.r, k), g: lerp(a.g, b.g, k), b: lerp(a.b, b.b, k) };
}

/** Walk a list of colour stops evenly spaced over 0..1. */
export function ramp(stops: Rgb[], t: number): Rgb {
    if (stops.length === 1) return stops[0];
    const k = clamp(t) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(k));
    return mix(stops[i], stops[i + 1], k - i);
}

export function css(c: Rgb, alpha = 1): string {
    const r = Math.round(c.r);
    const g = Math.round(c.g);
    const b = Math.round(c.b);
    return alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${+clamp(alpha).toFixed(3)})`;
}

/** WCAG relative luminance, 0..1. */
export function luminance(c: Rgb): number {
    const ch = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
}

/** WCAG contrast ratio between two colours, 1..21. */
export function contrast(a: Rgb, b: Rgb): number {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
