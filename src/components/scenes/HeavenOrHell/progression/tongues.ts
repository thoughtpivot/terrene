/**
 * Tongues (Deepwoken's Attunements). The base four can be chosen at creation.
 * Radiance and Sacrifice are quest-unlocked, then stay learned for the account.
 * Canticles (Murmurs) are optional, one per character.
 */

import type { CanticleId, Effect, MetaState, Result, RunState, TongueId } from "./types";
import { fail, ok } from "./types";

export const MAX_CREATION_TONGUES = 2;

export interface TongueDef {
    id: TongueId;
    name: string;
    base: boolean;
    statuses: string[];
    /** Quest that teaches the Tongue, for the two that start locked. */
    unlockQuest: string | null;
    /** Corruption tier at which the unlock quest becomes available. */
    questTier: number;
    path: { at: number; name: string; text: string } | null;
}

export const TONGUES: Record<TongueId, TongueDef> = {
    seraphFire: {
        id: "seraphFire",
        name: "Seraph-Fire",
        base: true,
        statuses: ["Sear"],
        unlockQuest: null,
        questTier: 0,
        path: { at: 40, name: "Purging Path", text: "Sear can heal allies instead of harming them." },
    },
    firmament: {
        id: "firmament",
        name: "Firmament",
        base: true,
        statuses: ["Awe", "Struck Still"],
        unlockQuest: null,
        questTier: 0,
        path: null,
    },
    judgementThunder: {
        id: "judgementThunder",
        name: "Judgement-Thunder",
        base: true,
        statuses: ["Shock"],
        unlockQuest: null,
        questTier: 0,
        path: { at: 40, name: "Verdict", text: "A stacking mark that overloads." },
    },
    whirlwind: {
        id: "whirlwind",
        name: "Whirlwind",
        base: true,
        statuses: ["Winded", "Hushed"],
        unlockQuest: null,
        questTier: 0,
        path: null,
    },
    radiance: {
        id: "radiance",
        name: "Radiance",
        base: false,
        statuses: ["Dazzle"],
        unlockQuest: "quest:radiance",
        questTier: 1,
        path: null,
    },
    sacrifice: {
        id: "sacrifice",
        name: "Sacrifice",
        base: false,
        statuses: ["Offered"],
        unlockQuest: "quest:sacrifice",
        questTier: 1,
        path: null,
    },
};

export const TONGUE_IDS = Object.keys(TONGUES) as TongueId[];

export interface CanticleDef {
    id: CanticleId;
    name: string;
    text: string;
    effects: Effect[];
}

export const CANTICLES: Record<CanticleId, CanticleDef> = {
    hosanna: { id: "hosanna", name: "Hosanna", text: "More posture damage dealt, less taken.", effects: [{ stat: "postureDamageMult", mult: 1.05 }, { stat: "blockPostureTakenMult", mult: 0.95 }] },
    selah: { id: "selah", name: "Selah", text: "A musical pause: stealth.", effects: [{ stat: "stealthMult", mult: 1.2 }] },
    antiphon: { id: "antiphon", name: "Antiphon", text: "Call and response: track allies and enemies.", effects: [{ flag: "trackNearby" }] },
};

export function tongueAvailableAtCreation(id: TongueId, meta: MetaState): boolean {
    return TONGUES[id].base || meta.learnedTongues.includes(id);
}

/**
 * Learns a Tongue during a run. Base Tongues come from Cantors; locked ones need
 * their quest this run or an account unlock. Wordless angels never learn a Tongue.
 */
export function learnTongue(run: RunState, id: TongueId, meta: MetaState): Result<RunState> {
    const character = run.character;
    if (character.wordless) return fail("wordless");
    if (character.tongues.includes(id)) return fail("already-known");
    const def = TONGUES[id];
    if (!def.base && !meta.learnedTongues.includes(id) && !(def.unlockQuest && run.quests.includes(def.unlockQuest))) {
        return fail("quest-required");
    }
    return ok({ ...run, character: { ...character, tongues: [...character.tongues, id] } });
}

export function learnCanticle(run: RunState, id: CanticleId): Result<RunState> {
    if (run.character.canticle) return fail("canticle-held");
    return ok({ ...run, character: { ...run.character, canticle: id } });
}
