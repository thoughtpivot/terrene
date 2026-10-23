/**
 * Stain: personal corruption from 0 to 100, taken on for power.
 * It is separate from lives: a cracked halo (25 Stain) is not a dimmed halo.
 * At 100 the angel Falls and the run ends in a wipe.
 */

import type { CleanseId, Result, RunState, StainSourceId, TongueId } from "./types";
import { fail, ok } from "./types";
import { STAIN_AMOUNTS, difficultyDef } from "./tuning";
import { WATCHER_KIN_STAIN_MULT } from "./choirs";
import { scaleCost, tierOf } from "./corruption";

export const STAIN_MAX = 100;

export interface StainSourceDef {
    id: StainSourceId;
    name: string;
    amount: number;
}

export const STAIN_SOURCES: Record<StainSourceId, StainSourceDef> = {
    demonHeart: { id: "demonHeart", name: "Ate a demon heart", amount: STAIN_AMOUNTS.demonHeart },
    brandAccepted: { id: "brandAccepted", name: "Accepted a Brand", amount: STAIN_AMOUNTS.brandAccepted },
    fallenGift: { id: "fallenGift", name: "Took a Fallen Gift", amount: STAIN_AMOUNTS.fallenGift },
    mouthShrine: { id: "mouthShrine", name: "Spoke at the Mouth", amount: 15 },
    brimstoneOutcry: { id: "brimstoneOutcry", name: "Breathed brimstone", amount: STAIN_AMOUNTS.brimstoneOutcry },
    abyssalTrumpet: { id: "abyssalTrumpet", name: "Sounded an Abyssal Trumpet", amount: STAIN_AMOUNTS.abyssalTrumpet },
    forbiddenVow: { id: "forbiddenVow", name: "Swore the Forbidden Vow", amount: STAIN_AMOUNTS.forbiddenVow },
};

export interface CleanseDef {
    id: CleanseId;
    name: string;
    amount: number;
    maxPerRun: number;
    /** Visions at Tier 0. Scaled by the tier's cost multiplier. */
    visions: number;
    /** Reported for combat to apply. */
    sanctity: number;
    hpFraction: number;
    quest?: string;
    tongue?: TongueId;
}

export const CLEANSES: Record<CleanseId, CleanseDef> = {
    refiningShrine: { id: "refiningShrine", name: "Shrine of Refining", amount: 10, maxPerRun: 2, visions: 3, sanctity: 0, hpFraction: 0 },
    altarVigil: { id: "altarVigil", name: "Vigil at an Altar", amount: 5, maxPerRun: 5, visions: 2, sanctity: 30, hpFraction: 0 },
    livingWater: { id: "livingWater", name: "River of Living Water", amount: 25, maxPerRun: 1, visions: 0, sanctity: 0, hpFraction: 0, quest: "quest:riverOfLife" },
    sacrificialCleansing: { id: "sacrificialCleansing", name: "Sacrificial Cleansing", amount: 15, maxPerRun: 2, visions: 0, sanctity: 0, hpFraction: 0.25, tongue: "sacrifice" },
};

export interface StainThreshold {
    at: number;
    id: "crackedHalo" | "fallenChoir" | "eliteHesitation" | "fall";
    text: string;
}

export const STAIN_THRESHOLDS: readonly StainThreshold[] = [
    { at: 25, id: "crackedHalo", text: "Your halo cracks. Fallen Gifts appear. Sanctity cap -10%." },
    { at: 50, id: "fallenChoir", text: "Your Choir turns fallen. Ally angels charge more; some turn hostile." },
    { at: 75, id: "eliteHesitation", text: "Hell's elites hesitate. Pure endings are locked." },
    { at: 100, id: "fall", text: "The Fall: the run ends and you are cast from Heaven." },
];

export const CRACKED_HALO_SANCTITY_MULT = 0.9;

/** Watcher-kin's flaw times the difficulty's Stain rate. */
export function stainGainMultiplier(run: RunState): number {
    return (run.character.choir === "watcherKin" ? WATCHER_KIN_STAIN_MULT : 1) * difficultyDef(run.difficulty).stainGainMult;
}

/** Adds Stain from a source (or a raw amount). Reaching 100 is the Fall. */
export function applyStain(run: RunState, source: StainSourceId | { amount: number }): RunState {
    if (run.status !== "alive") return run;
    const base = typeof source === "string" ? STAIN_SOURCES[source].amount : source.amount;
    if (base <= 0) return run;
    const stain = Math.min(STAIN_MAX, run.stain + Math.round(base * stainGainMultiplier(run)));
    return {
        ...run,
        stain,
        peakStain: Math.max(run.peakStain, stain),
        status: stain >= STAIN_MAX ? "fallen" : run.status,
    };
}

export interface CleanseResult {
    run: RunState;
    removed: number;
    cost: { visions: number; sanctity: number; hpFraction: number };
}

export function cleanseStain(run: RunState, id: CleanseId): Result<CleanseResult> {
    const def = CLEANSES[id];
    if (run.status !== "alive") return fail("run-over");
    if (run.stain <= 0) return fail("no-stain");
    const used = run.cleanses[id] ?? 0;
    if (used >= def.maxPerRun) return fail("cleanse-limit");
    if (def.quest && !run.quests.includes(def.quest)) return fail("quest-required");
    if (def.tongue && !run.character.tongues.includes(def.tongue)) return fail("tongue-required");
    const visions = def.visions > 0 ? scaleCost(def.visions, tierOf(run)) : 0;
    if (run.visions < visions) return fail("not-enough-visions");
    const removed = Math.min(run.stain, def.amount);
    return ok({
        run: { ...run, stain: run.stain - removed, visions: run.visions - visions, cleanses: { ...run.cleanses, [id]: used + 1 } },
        removed,
        cost: { visions, sanctity: def.sanctity, hpFraction: def.hpFraction },
    });
}

export function crossedThresholds(stain: number): StainThreshold[] {
    return STAIN_THRESHOLDS.filter((t) => stain >= t.at);
}

export interface StainEffects {
    crackedHalo: boolean;
    fallenChoir: boolean;
    eliteHesitation: boolean;
    /** Sticky: once Stain has reached 75 the pure endings stay locked. */
    pureEndingsLocked: boolean;
    fallen: boolean;
    sanctityMult: number;
    sanctifiedOffered: boolean;
}

/** Threshold effects follow current Stain, except the pure-ending lock and the Fall. */
export function stainEffects(run: RunState): StainEffects {
    const s = run.stain;
    return {
        crackedHalo: s >= 25,
        fallenChoir: s >= 50,
        eliteHesitation: s >= 75,
        pureEndingsLocked: run.peakStain >= 75,
        fallen: s >= STAIN_MAX || run.status === "fallen",
        sanctityMult: s >= 25 ? CRACKED_HALO_SANCTITY_MULT : 1,
        sanctifiedOffered: s === 0,
    };
}
