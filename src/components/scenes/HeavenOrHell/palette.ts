/**
 * Colour roles for Heaven Or Hell. The environment stays near-black; only
 * lights, actors and effects go bright. White and gold are Heaven and the
 * hero, orange is a warning or wind-up, red is danger and Hell. Cyan is an
 * optional accent and is not used in M1.
 */

export type Rgb = readonly [number, number, number];

/** The void beyond the map and the darkest floor. */
export const VOID = "#050609";
export const FLOOR_SHADOW = "#0B0C10";
export const FLOOR_LIT = "#16181F";

/** Light colours, 0..1 per channel, as the lighting shader takes them. */
export const LIGHT = {
    holy: [1.0, 0.82, 0.46],
    white: [0.92, 0.94, 1.0],
    halo: [1.0, 0.86, 0.55],
    hellfire: [1.0, 0.24, 0.08],
    ember: [1.0, 0.5, 0.12],
} as const satisfies Record<string, Rgb>;

/** Particle tints. */
export const SPARK = {
    gold: [1.0, 0.84, 0.42],
    white: [1.0, 0.97, 0.9],
    red: [1.0, 0.22, 0.06],
    orange: [1.0, 0.52, 0.12],
} as const satisfies Record<string, Rgb>;

/** Ambient light on the environment: barely there, cool, so unlit stone sits at about #0B0C10. */
export const AMBIENT: Rgb = [0.05, 0.055, 0.075];
