/**
 * Trumpets (Deepwoken's Resonance). Hidden Progress builds from boss kills and
 * cleared breaches from Tier 4. If HP hits zero inside a breach with full
 * Progress, the Throne answers: a full heal and a choice of three Trumpets,
 * and the angel is not struck down. Solo only: no PvP progress paths.
 */

import type { CorruptionTier, Result, RunState, TrumpetId, TrumpetInstance, TrumpetRarity } from "./types";
import { fail, ok } from "./types";
import { TRUMPET_CHOICES, TRUMPET_PROGRESS, TRUMPET_PROGRESS_MAX, TRUMPET_RARITY_WEIGHTS, TRUMPET_SUBSTAT_POINTS } from "./tuning";
import { tierOf, tierUnlocks } from "./corruption";
import { rollInt, rollWeighted } from "./rng";
import { recordWitness } from "./meta";
import { applyStain } from "./stain";

export const TARNISHED_PROGRESS_MULT = 0.8;

export interface TrumpetDef {
    id: TrumpetId;
    name: string;
    rarity: TrumpetRarity;
    text: string;
    substats: string[];
    useCost: { sanctity: number; hpFraction: number; stain: boolean };
}

export const TRUMPETS: Record<TrumpetId, TrumpetDef> = {
    coalOfTheAltar: { id: "coalOfTheAltar", name: "Coal of the Altar", rarity: "Normal", text: "Heals allies in an area and purges ailments.", substats: ["radius", "healing", "cooldown"], useCost: { sanctity: 0, hpFraction: 0, stain: false } },
    wheelWithinAWheel: { id: "wheelWithinAWheel", name: "Wheel within a Wheel", rarity: "Normal", text: "An eye-wheel orbits you and deflects projectiles.", substats: ["deflects", "duration", "cooldown"], useCost: { sanctity: 0, hpFraction: 0, stain: false } },
    firmamentDome: { id: "firmamentDome", name: "Firmament", rarity: "Normal", text: "A brief crystal dome blocks attacks.", substats: ["duration", "radius", "cooldown"], useCost: { sanctity: 0, hpFraction: 0, stain: false } },
    noiseOfGreatWaters: { id: "noiseOfGreatWaters", name: "Noise of Great Waters", rarity: "Cracked", text: "A huge wing-roar that stuns. Costs 40 Sanctity.", substats: ["stun", "radius", "cooldown"], useCost: { sanctity: 40, hpFraction: 0, stain: false } },
    michaelsCharge: { id: "michaelsCharge", name: "Michael's Charge", rarity: "Archangel", text: "Teleport and strike a marked foe.", substats: ["damage", "range", "cooldown"], useCost: { sanctity: 0, hpFraction: 0, stain: false } },
    keyOfThePit: { id: "keyOfThePit", name: "Key of the Pit", rarity: "Abyssal", text: "Smoke and a locust swarm. Costs 10% max HP as Ash and adds Stain.", substats: ["swarm", "duration", "cooldown"], useCost: { sanctity: 0, hpFraction: 0.1, stain: true } },
};

const TRUMPET_LIST = Object.keys(TRUMPETS).map((id) => TRUMPETS[id as TrumpetId]);

export function trumpetsActive(tier: CorruptionTier): boolean {
    return tierUnlocks(tier, "trumpets");
}

export function rarityWeights(tier: CorruptionTier): Record<TrumpetRarity, number> {
    const weights = TRUMPET_RARITY_WEIGHTS[tier >= 5 ? 5 : 4];
    return {
        Normal: weights.Normal,
        Cracked: weights.Cracked,
        Archangel: tierUnlocks(tier, "archangelTrumpets") ? weights.Archangel : 0,
        Abyssal: tierUnlocks(tier, "abyssalTrumpets") ? weights.Abyssal : 0,
    };
}

/** Rolls one Trumpet. Points are spread at random across its sub-stats. */
export function rollTrumpet(rng: number, tier: CorruptionTier, rarity?: TrumpetRarity, avoid?: TrumpetId): { trumpet: TrumpetInstance; rng: number } {
    let state = rng;
    let chosenRarity = rarity;
    if (!chosenRarity) {
        const weights = rarityWeights(tier);
        const r = rollWeighted(state, (Object.keys(weights) as TrumpetRarity[]).map((item) => ({ item, weight: weights[item] })));
        state = r.rng;
        chosenRarity = r.value ?? "Normal";
    }
    let options = TRUMPET_LIST.filter((t) => t.rarity === chosenRarity);
    if (avoid && options.length > 1) options = options.filter((t) => t.id !== avoid);
    const pick = rollInt(state, options.length);
    state = pick.rng;
    const def = options[pick.value];
    const substats: Record<string, number> = {};
    for (const s of def.substats) substats[s] = 0;
    for (let i = 0; i < TRUMPET_SUBSTAT_POINTS; i++) {
        const r = rollInt(state, def.substats.length);
        state = r.rng;
        substats[def.substats[r.value]]++;
    }
    return { trumpet: { id: def.id, rarity: chosenRarity, substats }, rng: state };
}

export function addTrumpetProgress(run: RunState, source: keyof typeof TRUMPET_PROGRESS): RunState {
    if (run.status !== "alive" || !trumpetsActive(tierOf(run))) return run;
    const mult = run.character.burdens.includes("tarnished") ? TARNISHED_PROGRESS_MULT : 1;
    return { ...run, trumpetProgress: Math.min(TRUMPET_PROGRESS_MAX, run.trumpetProgress + TRUMPET_PROGRESS[source] * mult) };
}

export function throneWouldAnswer(run: RunState, inBreach: boolean): boolean {
    return run.status === "alive" && inBreach && trumpetsActive(tierOf(run)) && run.trumpetProgress >= TRUMPET_PROGRESS_MAX;
}

/** The Throne answers: Progress resets and three Trumpets are offered. Combat applies the full heal. */
export function answerThrone(run: RunState): RunState {
    let state = run.rng;
    const choices: TrumpetInstance[] = [];
    for (let i = 0; i < TRUMPET_CHOICES; i++) {
        const r = rollTrumpet(state, tierOf(run));
        state = r.rng;
        choices.push(r.trumpet);
    }
    return recordWitness({ ...run, rng: state, trumpetProgress: 0, pendingTrumpetChoice: choices }, "heardTrumpet");
}

export function chooseTrumpet(run: RunState, index: number): Result<RunState> {
    const choice = run.pendingTrumpetChoice?.[index];
    if (!choice) return fail("no-choice");
    return ok({ ...run, trumpet: choice, pendingTrumpetChoice: null });
}

export interface TrumpetUse {
    run: RunState;
    cost: { sanctity: number; hpFraction: number };
}

export function soundTrumpet(run: RunState): Result<TrumpetUse> {
    if (run.status !== "alive") return fail("run-over");
    if (run.penances.includes("clippedChoir")) return fail("penance");
    if (!run.trumpet) return fail("no-trumpet");
    const cost = TRUMPETS[run.trumpet.id].useCost;
    const next = cost.stain ? applyStain(run, "abyssalTrumpet") : run;
    return ok({ run: next, cost: { sanctity: cost.sanctity, hpFraction: cost.hpFraction } });
}

/** At the Mercy Seat: a new Trumpet of the same rarity, and the Tarnished Burden. */
export function rerollTrumpet(run: RunState): Result<RunState> {
    if (!run.trumpet) return fail("no-trumpet");
    const r = rollTrumpet(run.rng, tierOf(run), run.trumpet.rarity, run.trumpet.id);
    const burdens = run.character.burdens.includes("tarnished") ? run.character.burdens : [...run.character.burdens, "tarnished" as const];
    return ok({ ...run, rng: r.rng, trumpet: r.trumpet, character: { ...run.character, burdens } });
}
