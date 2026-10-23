/**
 * The corruption theme. One pure function, `themeFor(corruption, stain)`,
 * returns every colour and effect amount the UI draws with, so a single pair
 * of numbers moves the whole interface from Heaven to Hell.
 *
 * - `corruption` is World Corruption as a continuous tier, 0..5. Tier 0 is
 *   Heaven: near-black glass, thin white and gold filigree, a soft gold glow.
 *   Each effect fades in over its own band of the scale, so the change reads
 *   as a slow creep rather than a switch: veins first, then tarnish, cracks,
 *   embers, chipped edges and, last, heat flicker. At 5 only fragments of
 *   gold are left.
 * - `stain` is the player's personal corruption, 0..100. It drives the halo
 *   and adds accents to the player's own widgets (the vitals frame), never to
 *   the whole screen.
 *
 * No Excalibur import: the theme is plain data and is unit tested.
 */
import { Rgb, clamp, hex, mix, ramp, smoothstep } from "./color";

export const MAX_CORRUPTION = 5;
export const MAX_STAIN = 100;

export const TIER_NAMES = [
    "The Calm Courts",
    "Smoke from the Pit",
    "The Locusts",
    "The Brands",
    "The Four Loosed",
    "War in Heaven",
] as const;

export const ROMAN = ["0", "I", "II", "III", "IV", "V"] as const;

export interface BarColors {
    /** top of the fill gradient */
    hi: Rgb;
    /** bottom of the fill gradient */
    lo: Rgb;
}

export interface UiTheme {
    corruption: number;
    stain: number;
    /** whole tier, 0..5 */
    tier: number;
    /** overall Heaven-to-Hell blend, 0..1 */
    hell: number;

    /** shadows and ink lines */
    ink: Rgb;
    /** panel fill, top of the gradient */
    panel: Rgb;
    /** panel fill, bottom of the gradient */
    panelDeep: Rgb;
    panelAlpha: number;
    /** filigree lines: gold, tarnishing to rust */
    gold: Rgb;
    /** ornaments and highlights: bright gold, turning to ember */
    goldBright: Rgb;
    /** glow colour behind ornaments and focused widgets */
    glow: Rgb;
    /** 0..1 alpha for glows */
    glowStrength: number;
    /** glow radius in px */
    glowBlur: number;

    text: Rgb;
    textDim: Rgb;
    heading: Rgb;
    /** orange: a warning (posture nearly full, low HP) */
    warning: Rgb;
    /** red: danger (damage, guard break, lethal) */
    danger: Rgb;
    vein: Rgb;

    /** red veins creeping in from frame corners, 0..1 */
    veins: number;
    /** gold turning to rust and ember, 0..1 */
    tarnish: number;
    /** cracks across frame lines, 0..1 */
    cracks: number;
    /** missing pieces of frame lines, 0..1 */
    chips: number;
    /** ember particles rising behind the HUD, 0..1 */
    embers: number;
    /** heat waver on the glow under panels, 0..1 */
    shimmer: number;
    /** glow flicker, 0..1 */
    flicker: number;
    /** heat glow rising from the bottom of panels, 0..1 */
    heat: number;
    /** share of gold ornaments still gold, 1 at Tier 0, about 0.15 at Tier 5 */
    goldLeft: number;

    bars: {
        hp: BarColors;
        posture: BarColors;
        grace: BarColors;
        fervour: BarColors;
        sanctity: BarColors;
        /** the recent-damage trail behind HP */
        trail: Rgb;
        /** empty bar track */
        track: Rgb;
    };

    /** stain-driven accents on the player's own widgets */
    personal: {
        /** stain / 100 */
        stain: number;
        /** veins on the vitals frame from Stain, 0..1 */
        veins: number;
        /** red seeping into the halo, 0..1 (see haloRed) */
        red: number;
        /** halo flicker near the Fall, 0..1 */
        flicker: number;
    };
}

const C = {
    ink: [hex("#050506"), hex("#070303")],
    panel: [hex("#0c0c0f"), hex("#100a0b"), hex("#140707")],
    panelDeep: [hex("#060608"), hex("#080405"), hex("#0a0303")],
    gold: [hex("#c9a75e"), hex("#b8894a"), hex("#9a5630"), hex("#7e2f1f")],
    goldBright: [hex("#f6de9c"), hex("#f0b25e"), hex("#ff8a3d"), hex("#ff6a2a")],
    glow: [hex("#ffe6a8"), hex("#ffc070"), hex("#ff7438"), hex("#ff4a24")],
    text: [hex("#eee8da"), hex("#f2e2d8")],
    textDim: [hex("#a39d90"), hex("#b0948c")],
    heading: [hex("#ebd29a"), hex("#e9b985"), hex("#efa07c")],
    vein: [hex("#8e1a14"), hex("#d02a1c")],
    warning: hex("#ff9a2e"),
    danger: hex("#ff3a2a"),
    track: [hex("#18181c"), hex("#1e1011")],
    trail: hex("#ff5a3c"),
};

const BAR = {
    hp: { heaven: [hex("#fff1cc"), hex("#d8ae5c")], hell: [hex("#ffd9b0"), hex("#d98a4a")] },
    posture: { heaven: [hex("#f4f1ea"), hex("#b9b2a4")], hell: [hex("#f6ece6"), hex("#bba69e")] },
    grace: { heaven: [hex("#dfe8ff"), hex("#7f93c4")], hell: [hex("#e6dcf0"), hex("#8f7ea8")] },
    fervour: { heaven: [hex("#fff4dc"), hex("#e6c07a")], hell: [hex("#ffe2c4"), hex("#ee9e5c")] },
    sanctity: { heaven: [hex("#ddd4ee"), hex("#8a80a8")], hell: [hex("#dcc8d2"), hex("#8c6878")] },
};

/** How far bar fills drift toward Hell at Tier 5. Kept small so bars stay readable. */
const BAR_DRIFT = 0.35;

function bar(key: keyof typeof BAR, t: number): BarColors {
    const b = BAR[key];
    return { hi: mix(b.heaven[0], b.hell[0], t * BAR_DRIFT), lo: mix(b.heaven[1], b.hell[1], t * BAR_DRIFT) };
}

/**
 * Red in the halo from Stain, following the progression doc: a tinge in the
 * hairline cracks below 25, half the ring at 50, almost all of it at 75, all
 * of it at 100.
 */
export function haloRed(stain: number): number {
    const s = clamp(stain, 0, MAX_STAIN);
    if (s < 25) return (s / 25) * 0.08;
    if (s < 50) return 0.08 + ((s - 25) / 25) * 0.42;
    if (s < 75) return 0.5 + ((s - 50) / 25) * 0.4;
    return 0.9 + ((s - 75) / 25) * 0.1;
}

export function themeFor(corruption: number, stain: number): UiTheme {
    const c = clamp(Number.isFinite(corruption) ? corruption : 0, 0, MAX_CORRUPTION);
    const s = clamp(Number.isFinite(stain) ? stain : 0, 0, MAX_STAIN);
    const hell = smoothstep(0, MAX_CORRUPTION, c);
    const tarnish = smoothstep(0.6, 4.4, c);
    const veins = smoothstep(0.4, 4.6, c);
    const flicker = smoothstep(3.2, 5, c);

    return {
        corruption: c,
        stain: s,
        tier: Math.min(MAX_CORRUPTION, Math.floor(c)),
        hell,

        ink: ramp(C.ink, hell),
        panel: ramp(C.panel, smoothstep(0.5, 5, c)),
        panelDeep: ramp(C.panelDeep, smoothstep(0.5, 5, c)),
        panelAlpha: 0.8 + 0.06 * hell,
        gold: ramp(C.gold, tarnish),
        goldBright: ramp(C.goldBright, tarnish),
        glow: ramp(C.glow, tarnish),
        glowStrength: 0.5 + 0.2 * hell,
        glowBlur: 10 + 4 * hell,

        text: ramp(C.text, hell),
        textDim: ramp(C.textDim, hell),
        heading: ramp(C.heading, tarnish),
        warning: C.warning,
        danger: C.danger,
        vein: ramp(C.vein, veins),

        veins,
        tarnish,
        cracks: smoothstep(1.6, 5, c),
        chips: smoothstep(2.4, 5, c),
        embers: smoothstep(1.8, 5, c),
        shimmer: smoothstep(3, 5, c),
        flicker,
        heat: smoothstep(2.2, 5, c),
        goldLeft: 1 - 0.85 * smoothstep(1.2, 5, c),

        bars: {
            hp: bar("hp", hell),
            posture: bar("posture", hell),
            grace: bar("grace", hell),
            fervour: bar("fervour", hell),
            sanctity: bar("sanctity", hell),
            trail: C.trail,
            track: ramp(C.track, hell),
        },

        personal: {
            stain: s / MAX_STAIN,
            veins: smoothstep(10, 90, s),
            red: haloRed(s),
            flicker: smoothstep(70, 95, s),
        },
    };
}
