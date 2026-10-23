/**
 * What survives a wipe.
 * Testimony: a currency from one-time Witnesses, multiplied by Penances.
 * Remembrance: knowledge (bestiary tiers, map memory, lore) and account unlocks.
 * Stat creep stays small: four capped upgrades.
 */

import type { BestiaryEntry, ChoirId, ChoirVariantId, MetaState, OriginId, PenanceId, Result, RunState, TongueId } from "./types";
import { fail, ok } from "./types";
import {
    BESTIARY_MASTER_KILLS,
    BESTIARY_STUDY_REPEATS,
    ORIGIN_UNLOCK_COST,
    PENANCE_TESTIMONY_BONUS,
    TESTIMONY_RANKS,
    TESTIMONY_UPGRADE_COST,
    WHEELBORN_BESTIARY_MULT,
} from "./tuning";
import { VARIANTS, variantRemembranceMet } from "./choirs";

export interface WitnessDef {
    id: string;
    name: string;
    testimony: number;
    /** Repeatable Witnesses pay every time; the rest once per run. */
    repeatable?: boolean;
}

const WITNESS_LIST: WitnessDef[] = [
    { id: "sworeVow", name: "Swore a Vow", testimony: 5 },
    { id: "heardTrumpet", name: "Heard a Trumpet", testimony: 15 },
    { id: "ascension", name: "Ascended", testimony: 0.75, repeatable: true },
    { id: "defeated:abaddonVanguard", name: "Broke Abaddon's vanguard", testimony: 3 },
    { id: "defeated:abaddon", name: "Defeated Abaddon", testimony: 5 },
    { id: "defeated:bael", name: "Defeated Bael", testimony: 6 },
    { id: "defeated:paimon", name: "Defeated Paimon", testimony: 6 },
    { id: "defeated:asmodeus", name: "Defeated Asmodeus", testimony: 6 },
    { id: "defeated:belial", name: "Defeated Belial", testimony: 6 },
    { id: "defeated:leviathan", name: "Defeated Leviathan", testimony: 8 },
    { id: "defeated:behemoth", name: "Defeated Behemoth", testimony: 8 },
    { id: "defeated:fourLoosedAngels", name: "Bound the Four again", testimony: 10 },
    { id: "defeated:beastFromTheSea", name: "Defeated the Beast from the Sea", testimony: 12 },
    { id: "defeated:beastFromTheEarth", name: "Defeated the Beast from the Earth", testimony: 12 },
    { id: "defeated:redDragon", name: "Cast down the Dragon", testimony: 20 },
    { id: "sealedBreach", name: "Sealed a breach", testimony: 1, repeatable: true },
    { id: "reachedTier:3", name: "Endured to the Brands", testimony: 3 },
    { id: "reachedTier:5", name: "Saw the War in Heaven", testimony: 6 },
];

export const WITNESSES: Record<string, WitnessDef> = {};
for (const w of WITNESS_LIST) WITNESSES[w.id] = w;

/** Witnesses with no entry (for example `vowCompleted:herald`) are recorded but pay nothing. */
export function recordWitness(run: RunState, id: string): RunState {
    const def = WITNESSES[id];
    if (!def?.repeatable && run.witnesses.includes(id)) return run;
    return {
        ...run,
        witnesses: def?.repeatable && run.witnesses.includes(id) ? run.witnesses : [...run.witnesses, id],
        pendingTestimony: roundHundredths(run.pendingTestimony + (def?.testimony ?? 0)),
    };
}

export interface PenanceDef {
    id: PenanceId;
    name: string;
    text: string;
    bonus: number;
}

export const PENANCES: Record<PenanceId, PenanceDef> = {
    fragileHeart: { id: "fragileHeart", name: "Fragile Heart", text: "Double damage taken.", bonus: PENANCE_TESTIMONY_BONUS.fragileHeart },
    clippedChoir: { id: "clippedChoir", name: "Clipped Choir", text: "No Trumpet use.", bonus: PENANCE_TESTIMONY_BONUS.clippedChoir },
    fated: { id: "fated", name: "Fated", text: "Cards are picked for you.", bonus: PENANCE_TESTIMONY_BONUS.fated },
};

export function penanceMultiplier(penances: readonly PenanceId[]): number {
    return 1 + penances.reduce((sum, id) => sum + PENANCES[id].bonus, 0);
}

export function testimonyPayout(run: RunState): number {
    return roundHundredths(run.pendingTestimony * penanceMultiplier(run.penances));
}

export function testimonyRank(lifetime: number): "E" | "D" | "C" | "B" | "A" | "S" {
    let rank: "E" | "D" | "C" | "B" | "A" | "S" = "E";
    for (const r of TESTIMONY_RANKS) if (lifetime >= r.at) rank = r.rank;
    return rank;
}

export type UpgradeId = "demonDamage" | "armour" | "startingVisions" | "startingFeathers";

export const TESTIMONY_UPGRADES: Record<UpgradeId, { id: UpgradeId; name: string; step: number; maxSteps: number; cost: number }> = {
    demonDamage: { id: "demonDamage", name: "+2% damage against demons", step: 0.02, maxSteps: 4, cost: TESTIMONY_UPGRADE_COST.demonDamage },
    armour: { id: "armour", name: "+2% armour", step: 0.02, maxSteps: 4, cost: TESTIMONY_UPGRADE_COST.armour },
    startingVisions: { id: "startingVisions", name: "+1 starting Vision", step: 1, maxSteps: 5, cost: TESTIMONY_UPGRADE_COST.startingVisions },
    startingFeathers: { id: "startingFeathers", name: "+1 starting Feather", step: 1, maxSteps: 2, cost: TESTIMONY_UPGRADE_COST.startingFeathers },
};

export function freshMeta(): MetaState {
    return {
        testimony: 0,
        lifetimeTestimony: 0,
        upgrades: {},
        unlockedOrigins: ["outerCourts"],
        unlockedVariants: [],
        learnedTongues: [],
        progressedVows: [],
        reliquary: null,
        bestiary: {},
        landmarks: [],
        lore: [],
        runs: 0,
        falls: 0,
    };
}

export function upgradeSteps(meta: MetaState, id: UpgradeId): number {
    return meta.upgrades[id] ?? 0;
}

export function upgradeValue(meta: MetaState, id: UpgradeId): number {
    return upgradeSteps(meta, id) * TESTIMONY_UPGRADES[id].step;
}

function spendTestimony(meta: MetaState, cost: number): Result<MetaState> {
    if (meta.testimony < cost) return fail("not-enough-testimony");
    return ok({ ...meta, testimony: roundHundredths(meta.testimony - cost) });
}

export function buyUpgrade(meta: MetaState, id: UpgradeId): Result<MetaState> {
    const def = TESTIMONY_UPGRADES[id];
    const steps = upgradeSteps(meta, id);
    if (steps >= def.maxSteps) return fail("upgrade-maxed");
    const paid = spendTestimony(meta, def.cost);
    if (!paid.ok) return paid;
    return ok({ ...paid.value, upgrades: { ...paid.value.upgrades, [id]: steps + 1 } });
}

export function unlockOrigin(meta: MetaState, id: Exclude<OriginId, "outerCourts">): Result<MetaState> {
    if (meta.unlockedOrigins.includes(id)) return fail("already-unlocked");
    const paid = spendTestimony(meta, ORIGIN_UNLOCK_COST[id]);
    if (!paid.ok) return paid;
    return ok({ ...paid.value, unlockedOrigins: [...paid.value.unlockedOrigins, id] });
}

/** Unlocks a rare Choir variant by paying Testimony or by meeting its Remembrance condition. */
export function unlockVariant(meta: MetaState, id: ChoirVariantId): Result<MetaState> {
    if (meta.unlockedVariants.includes(id)) return fail("already-unlocked");
    const unlock = VARIANTS[id].unlock;
    if (unlock.kind === "testimony") {
        const paid = spendTestimony(meta, unlock.cost);
        if (!paid.ok) return paid;
        return ok({ ...paid.value, unlockedVariants: [...paid.value.unlockedVariants, id] });
    }
    if (!variantRemembranceMet(unlock, meta, masteredCount(meta))) return fail("remembrance-required");
    return ok({ ...meta, unlockedVariants: [...meta.unlockedVariants, id] });
}

export function learnTongueForAccount(meta: MetaState, id: TongueId): MetaState {
    return meta.learnedTongues.includes(id) ? meta : { ...meta, learnedTongues: [...meta.learnedTongues, id] };
}

// Remembrance: the bestiary, map memory and lore.

export type BestiaryTier = "Unknown" | "Seen" | "Studied" | "Mastered";

function entry(meta: MetaState, enemy: string): BestiaryEntry {
    return meta.bestiary[enemy] ?? { seen: false, moves: {}, kills: 0 };
}

function withEntry(meta: MetaState, enemy: string, next: BestiaryEntry): MetaState {
    return { ...meta, bestiary: { ...meta.bestiary, [enemy]: next } };
}

function bestiaryStep(choir: ChoirId | null): number {
    return choir === "wheelborn" ? WHEELBORN_BESTIARY_MULT : 1;
}

export function recordSeen(meta: MetaState, enemy: string): MetaState {
    const e = entry(meta, enemy);
    return e.seen ? meta : withEntry(meta, enemy, { ...e, seen: true });
}

/** A parry or dodge of one of an enemy's moves. Wheelborn study 25% faster. */
export function recordStudy(meta: MetaState, enemy: string, move: string, choir: ChoirId | null = null): MetaState {
    const e = entry(meta, enemy);
    const moves = { ...e.moves, [move]: (e.moves[move] ?? 0) + bestiaryStep(choir) };
    return withEntry(meta, enemy, { ...e, seen: true, moves });
}

export function recordKill(meta: MetaState, enemy: string, choir: ChoirId | null = null): MetaState {
    const e = entry(meta, enemy);
    return withEntry(meta, enemy, { ...e, seen: true, kills: e.kills + bestiaryStep(choir) });
}

/**
 * Seen: encountered. Studied: every move (the list combat knows, or the moves
 * recorded so far) parried or dodged 3 times. Mastered: Studied and 10 kills.
 */
export function bestiaryTier(e: BestiaryEntry | undefined, moveIds?: readonly string[]): BestiaryTier {
    if (!e || !e.seen) return "Unknown";
    const moves = moveIds ?? Object.keys(e.moves);
    const studied = moves.length > 0 && moves.every((m) => (e.moves[m] ?? 0) >= BESTIARY_STUDY_REPEATS);
    if (!studied) return "Seen";
    return e.kills >= BESTIARY_MASTER_KILLS ? "Mastered" : "Studied";
}

export function masteredCount(meta: MetaState): number {
    return Object.keys(meta.bestiary).filter((id) => bestiaryTier(meta.bestiary[id]) === "Mastered").length;
}

export function discoverLandmark(meta: MetaState, landmark: string): MetaState {
    return meta.landmarks.includes(landmark) ? meta : { ...meta, landmarks: [...meta.landmarks, landmark] };
}

export function learnLore(meta: MetaState, page: string): MetaState {
    return meta.lore.includes(page) ? meta : { ...meta, lore: [...meta.lore, page] };
}

export function roundHundredths(n: number): number {
    return Math.round(n * 100) / 100;
}
