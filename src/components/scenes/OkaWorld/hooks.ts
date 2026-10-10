import type { OkaSfx } from "./audio";
import type { Body, OkaPhysics, Water } from "./physics";

/** What the hero exposes to creatures and items. */
export interface OkaHero {
    readonly rig: Body;
    readonly invulnerable: boolean;
    readonly inWater: boolean;
    hurt(fromX: number): void;
    bounce(strength?: number): void;
}

export type BurstKind = "sparkle" | "heart" | "splash" | "dust" | "poof" | "glow";

/** Everything a creature needs from the scene, so creatures stay scene-agnostic. */
export interface OkaHooks {
    readonly physics: OkaPhysics;
    readonly hero: OkaHero;
    sfx(name: OkaSfx, x?: number, rate?: number): void;
    burst(kind: BurstKind, x: number, y: number, count?: number): void;
    ripple(water: Water, x: number, strength: number): void;
}

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

export function overlap(a: Box, b: Box): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
