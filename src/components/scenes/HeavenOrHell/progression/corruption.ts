/**
 * World Corruption, the run's clock. Heaven decays at its own steady rate:
 * the level depends only on elapsed play time and the run's difficulty,
 * which sets the minutes per tier. Sealing a breach never lowers
 * it; it freezes that region's local tier. There is no cap on player strength
 * per tier. Each tier scales enemies, loot and costs, and unlocks systems.
 */

import type { CorruptionTier, DifficultyId, Result, RunState } from "./types";
import { fail, ok } from "./types";
import { CORRUPTION_POINTS_PER_TIER, DEFAULT_DIFFICULTY, TIER_SCALING, TierScaling, difficultyDef } from "./tuning";
import { MAX_ASCENSION } from "./attributes";

export const MAX_TIER: CorruptionTier = 5;

export type TierUnlock =
    | "baseTongues"
    | "hymns"
    | "gifts"
    | "shrine:refining"
    | "shrine:joinedWings"
    | "altarCoals"
    | "quest:radiance"
    | "quest:sacrifice"
    | "shrine:lots"
    | "shrine:partedWings"
    | "vows"
    | "shrine:scales"
    | "blessings"
    | "sanctifiedWeighting"
    | "brands"
    | "fallenPool"
    | "shrine:mouth"
    | "hellMarkets"
    | "fullStain"
    | "trumpets"
    | "fallenAdvanced"
    | "hybridTongues"
    | "unsealing"
    | "forbiddenVow"
    | "archangelTrumpets"
    | "abyssalTrumpets"
    | "endings";

export interface TierDef {
    tier: CorruptionTier;
    name: string;
    enemies: string[];
    bosses: string[];
    unlocks: TierUnlock[];
}

export const TIERS: Record<CorruptionTier, TierDef> = {
    0: {
        tier: 0,
        name: "The Calm Courts",
        enemies: ["imp", "locustScout", "goeticKnight"],
        bosses: [],
        unlocks: ["baseTongues", "hymns", "gifts", "shrine:refining", "shrine:joinedWings"],
    },
    1: {
        tier: 1,
        name: "Smoke from the Pit",
        enemies: ["president", "count", "malphas", "halphas", "furfur"],
        bosses: ["abaddonVanguard"],
        unlocks: ["altarCoals", "quest:radiance", "quest:sacrifice", "shrine:lots", "shrine:partedWings"],
    },
    2: {
        tier: 2,
        name: "The Locusts",
        enemies: ["crownedLocust", "marquis", "duke", "andras", "focalor", "vepar", "astaroth", "corruptedAngel"],
        bosses: ["abaddon"],
        unlocks: ["vows", "shrine:scales", "blessings", "sanctifiedWeighting"],
    },
    3: {
        tier: 3,
        name: "The Brands",
        enemies: ["king"],
        bosses: ["bael", "paimon", "asmodeus", "belial", "leviathan"],
        unlocks: ["brands", "fallenPool", "shrine:mouth", "hellMarkets", "fullStain"],
    },
    4: {
        tier: 4,
        name: "The Four Loosed",
        enemies: ["corruptedAngel", "lionHeadedHorseman"],
        bosses: ["fourLoosedAngels", "behemoth"],
        unlocks: ["trumpets", "fallenAdvanced", "hybridTongues", "unsealing"],
    },
    5: {
        tier: 5,
        name: "War in Heaven",
        enemies: ["corruptedAngel", "lionHeadedHorseman"],
        bosses: ["redDragon", "beastFromTheSea", "beastFromTheEarth"],
        unlocks: ["forbiddenVow", "archangelTrumpets", "abyssalTrumpets", "endings"],
    },
};

/** Seconds of play per tier at a difficulty. */
export function secondsPerTier(difficulty: DifficultyId = DEFAULT_DIFFICULTY): number {
    return difficultyDef(difficulty).minutesPerTier * 60;
}

export function corruptionPoints(elapsedSeconds: number, difficulty: DifficultyId = DEFAULT_DIFFICULTY): number {
    return (Math.max(0, elapsedSeconds) / secondsPerTier(difficulty)) * CORRUPTION_POINTS_PER_TIER;
}

export function tierAt(elapsedSeconds: number, difficulty: DifficultyId = DEFAULT_DIFFICULTY): CorruptionTier {
    return Math.min(MAX_TIER, Math.floor(Math.max(0, elapsedSeconds) / secondsPerTier(difficulty))) as CorruptionTier;
}

export function tierOf(run: Pick<RunState, "elapsedSeconds" | "difficulty">): CorruptionTier {
    return tierAt(run.elapsedSeconds, run.difficulty);
}

/** Seconds of play until the next tier, or null at the last tier. */
export function secondsToNextTier(elapsedSeconds: number, difficulty: DifficultyId = DEFAULT_DIFFICULTY): number | null {
    const tier = tierAt(elapsedSeconds, difficulty);
    if (tier >= MAX_TIER) return null;
    return Math.max(0, (tier + 1) * secondsPerTier(difficulty) - elapsedSeconds);
}

/** Minutes of play from kindling to the last tier at a difficulty. */
export function minutesToLastTier(difficulty: DifficultyId): number {
    return difficultyDef(difficulty).minutesPerTier * MAX_TIER;
}

/** Advances the clock. Time only moves forward. */
export function advanceTime(run: RunState, seconds: number): RunState {
    if (run.status !== "alive" || seconds <= 0) return run;
    return { ...run, elapsedSeconds: run.elapsedSeconds + seconds };
}

export function tierScaling(tier: CorruptionTier): TierScaling {
    return TIER_SCALING[tier];
}

/** Every unlock from Tier 0 up to and including this tier. */
export function unlocksAt(tier: CorruptionTier): TierUnlock[] {
    const out: TierUnlock[] = [];
    for (let t = 0; t <= tier; t++) out.push(...TIERS[t as CorruptionTier].unlocks);
    return out;
}

export function tierUnlocks(tier: CorruptionTier, unlock: TierUnlock): boolean {
    return unlocksAt(tier).includes(unlock);
}

export function firstTierFor(unlock: TierUnlock): CorruptionTier {
    for (let t = 0; t <= MAX_TIER; t++) if (TIERS[t as CorruptionTier].unlocks.includes(unlock)) return t as CorruptionTier;
    throw new Error(`unknown unlock ${unlock}`);
}

/** The highest Ascension reachable at a tier. Always 20: tiers never cap strength. */
export function ascensionCap(_tier: CorruptionTier): number {
    return MAX_ASCENSION;
}

/** Applies a cost multiplier for the current tier to a Vision or experience price. */
export function scaleCost(base: number, tier: CorruptionTier): number {
    return Math.ceil(base * TIER_SCALING[tier].costMult - 1e-9);
}

export function scaleReward(base: number, tier: CorruptionTier): number {
    return Math.round(base * TIER_SCALING[tier].rewardMult);
}

/**
 * Seals a breach. The world level is untouched; the region's local tier is
 * frozen at the tier it was sealed in.
 */
export function sealBreach(run: RunState, region: string): Result<RunState> {
    if (run.status !== "alive") return fail("run-over");
    if (run.sealedRegions.some((r) => r.region === region)) return fail("already-sealed");
    return ok({ ...run, sealedRegions: [...run.sealedRegions, { region, tier: tierOf(run) }] });
}

export function regionTier(run: RunState, region: string): CorruptionTier {
    const world = tierOf(run);
    const sealed = run.sealedRegions.find((r) => r.region === region);
    return sealed ? (Math.min(world, sealed.tier) as CorruptionTier) : world;
}
