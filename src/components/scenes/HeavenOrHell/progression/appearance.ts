/**
 * Appearance options. The body stays near-monochrome; only halo, eyes and
 * wing edges glow white and gold. Extra wing eyes belong to the Ophan line.
 */

import type { Appearance, ChoirId } from "./types";
import { CHOIRS } from "./choirs";

export const WING_COUNT_MIN = 2;
export const WING_COUNT_MAX = 6;
export const WING_POSES: readonly Appearance["wings"]["pose"][] = ["open", "folded", "clipped"];
export const WING_TEXTURES: readonly Appearance["wings"]["texture"][] = ["feather", "ember", "glass"];
export const HALO_SHAPES: readonly Appearance["halo"]["shape"][] = ["ring", "brokenRing", "thorned", "wheel", "crown"];
export const HALO_LIGHTS: readonly Appearance["halo"]["light"][] = ["white", "gold", "silver"];
export const EYE_STYLES: readonly Appearance["eyes"]["style"][] = ["glow", "veiled"];
export const ROBES: readonly Appearance["robe"][] = ["linen", "sash", "cowl"];

export function defaultAppearance(choir: ChoirId): Appearance {
    return {
        wings: { count: 2, pose: "open", texture: "feather" },
        halo: { shape: "ring", light: "white" },
        eyes: { style: "glow", wingEyes: false },
        robe: "linen",
        mark: CHOIRS[choir].marks[0],
    };
}

export function appearanceErrors(a: Appearance, choir: ChoirId): string[] {
    const errors: string[] = [];
    if (!Number.isInteger(a.wings.count) || a.wings.count < WING_COUNT_MIN || a.wings.count > WING_COUNT_MAX) errors.push("appearance:wing-count");
    if (!WING_POSES.includes(a.wings.pose)) errors.push("appearance:wing-pose");
    if (!WING_TEXTURES.includes(a.wings.texture)) errors.push("appearance:wing-texture");
    if (!HALO_SHAPES.includes(a.halo.shape)) errors.push("appearance:halo-shape");
    if (!HALO_LIGHTS.includes(a.halo.light)) errors.push("appearance:halo-light");
    if (!EYE_STYLES.includes(a.eyes.style)) errors.push("appearance:eyes");
    if (a.eyes.wingEyes && choir !== "wheelborn") errors.push("appearance:wing-eyes");
    if (!ROBES.includes(a.robe)) errors.push("appearance:robe");
    if (!CHOIRS[choir].marks.includes(a.mark)) errors.push("appearance:mark");
    return errors;
}
