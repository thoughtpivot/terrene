/**
 * Character creation, in order: Choir, Tongues (up to two, or Wordless), Arms,
 * Boons and Burdens, Origin, Appearance, then the Testimony shop and Penances.
 * Points: 15 free, plus the Choir's +3/+2. Wordless gets 10 more free points;
 * Tongue-takers get 10 points that must go into their Tongues.
 */

import type { Attributes, ChoirVariantId, CreationInput, Item, MetaState, PenanceId, Result, RunState, TongueId } from "./types";
import { fail, ok } from "./types";
import { ALL_ATTRIBUTES, CREATION_POINTS, SOFT_CAP, WORDLESS_BONUS_POINTS, emptyAttributes, isTongueAttribute } from "./attributes";
import { CHOIRS, CHOIR_BONUS_MAJOR, CHOIR_BONUS_MINOR, VARIANTS } from "./choirs";
import { MAX_CREATION_TONGUES, TONGUES, tongueAvailableAtCreation } from "./tongues";
import { STARTING_WEAPONS, WEAPONS } from "./weapons";
import { BOONS, BURDENS, MAX_BOONS, MAX_BURDENS, MIN_BOONS, MIN_BURDENS, burdenWeight } from "./boons";
import { ORIGINS } from "./origins";
import { appearanceErrors } from "./appearance";
import { PENANCES, upgradeValue } from "./meta";
import { emptySlots } from "./hymns";
import { seedRng } from "./rng";
import { STARTING_FEATHERS, TONGUE_BOUND_CREATION_POINTS } from "./tuning";

export const CREATION_STEPS = ["choir", "tongues", "arms", "boonsAndBurdens", "origin", "appearance", "testimonyAndPenances"] as const;
export type CreationStep = (typeof CREATION_STEPS)[number];

export interface CreationBudget {
    /** Points that can go anywhere. */
    free: number;
    /** Points that must go into the chosen Tongues. */
    tongueBound: number;
    total: number;
}

/** Virtuant's Elemental Ease adds one Tongue point (a free point if Wordless). Hail-Crowned gives it up. */
export function creationBudget(input: Pick<CreationInput, "choir" | "variant" | "tongues">): CreationBudget {
    const wordless = input.tongues.length === 0;
    let free = CREATION_POINTS + (wordless ? WORDLESS_BONUS_POINTS : 0);
    let tongueBound = wordless ? 0 : TONGUE_BOUND_CREATION_POINTS;
    if (input.choir === "virtuant" && input.variant !== "hailCrownedVirtuant") {
        if (wordless) free += 1;
        else tongueBound += 1;
    }
    return { free, tongueBound, total: free + tongueBound };
}

function stepIndex(step: CreationStep): number {
    return CREATION_STEPS.indexOf(step);
}

/**
 * Returns every rule the input breaks, as error codes. With `upTo`, only the
 * steps up to and including that one are checked, so a UI can validate as it goes.
 * Attribute allocation is checked with the last step.
 */
export function validateCreation(input: CreationInput, meta: MetaState, upTo: CreationStep = "testimonyAndPenances"): string[] {
    const errors: string[] = [];
    const last = stepIndex(upTo);
    const choir = CHOIRS[input.choir];
    if (!choir) return ["choir:unknown"];
    if (input.variant !== null) {
        const variant = VARIANTS[input.variant];
        if (!variant || variant.choir !== input.choir) errors.push("choir:variant-mismatch");
        else if (!meta.unlockedVariants.includes(input.variant)) errors.push("choir:variant-locked");
    }
    if (last < stepIndex("tongues")) return errors;

    if (input.tongues.length > MAX_CREATION_TONGUES) errors.push("tongues:too-many");
    if (new Set(input.tongues).size !== input.tongues.length) errors.push("tongues:duplicate");
    for (const t of input.tongues) {
        if (!TONGUES[t]) errors.push("tongues:unknown");
        else if (!tongueAvailableAtCreation(t, meta)) errors.push("tongues:locked");
    }
    if (last < stepIndex("arms")) return errors;

    if (!STARTING_WEAPONS.includes(input.arms) || !WEAPONS[input.arms]?.basic) errors.push("arms:not-basic");
    if (last < stepIndex("boonsAndBurdens")) return errors;

    if (input.boons.length < MIN_BOONS || input.boons.length > MAX_BOONS) errors.push("boons:count");
    if (input.burdens.length < MIN_BURDENS || input.burdens.length > MAX_BURDENS) errors.push("burdens:count");
    if (new Set(input.boons).size !== input.boons.length) errors.push("boons:duplicate");
    if (new Set(input.burdens).size !== input.burdens.length) errors.push("burdens:duplicate");
    if (input.boons.some((b) => !BOONS[b])) errors.push("boons:unknown");
    if (input.burdens.some((b) => !BURDENS[b] || !BURDENS[b].selectable)) errors.push("burdens:not-selectable");
    else if (burdenWeight(input.burdens) < input.boons.length) errors.push("boons:not-paid");
    for (const b of input.boons) if ((BOONS[b]?.exclusive ?? []).some((x) => input.burdens.includes(x))) errors.push("boons:exclusive");
    if (last < stepIndex("origin")) return errors;

    const origin = ORIGINS[input.origin];
    if (!origin) errors.push("origin:unknown");
    else if (origin.unlockCost > 0 && !meta.unlockedOrigins.includes(input.origin)) errors.push("origin:locked");
    if (last < stepIndex("appearance")) return errors;

    errors.push(...appearanceErrors(input.appearance, input.choir));
    if (last < stepIndex("testimonyAndPenances")) return errors;

    if (new Set(input.penances).size !== input.penances.length) errors.push("penances:duplicate");
    if (input.penances.some((p: PenanceId) => !PENANCES[p])) errors.push("penances:unknown");
    errors.push(...allocationErrors(input));
    return errors;
}

export function allocationErrors(input: CreationInput): string[] {
    const errors: string[] = [];
    const budget = creationBudget(input);
    let total = 0;
    let tonguePoints = 0;
    for (const key of Object.keys(input.allocation)) {
        const id = key as keyof Attributes;
        const value = input.allocation[id] ?? 0;
        if (!ALL_ATTRIBUTES.includes(id)) {
            errors.push("allocation:unknown-attribute");
            continue;
        }
        if (!Number.isInteger(value) || value < 0) errors.push("allocation:bad-value");
        if (isTongueAttribute(id) && value > 0) {
            if (!input.tongues.includes(id as TongueId)) errors.push("allocation:tongue-not-chosen");
            tonguePoints += value;
        }
        total += value;
    }
    if (total !== budget.total) errors.push("allocation:wrong-total");
    if (tonguePoints < budget.tongueBound) errors.push("allocation:tongue-points");
    const finals = finalAttributes(input);
    if (ALL_ATTRIBUTES.some((id) => finals[id] > SOFT_CAP)) errors.push("allocation:cap");
    return errors;
}

/** The allocation plus the Choir's +3/+2. */
export function finalAttributes(input: Pick<CreationInput, "choir" | "allocation">): Attributes {
    const attrs = emptyAttributes();
    for (const id of ALL_ATTRIBUTES) attrs[id] = input.allocation[id] ?? 0;
    const choir = CHOIRS[input.choir];
    attrs[choir.bonus.major] += CHOIR_BONUS_MAJOR;
    attrs[choir.bonus.minor] += CHOIR_BONUS_MINOR;
    return attrs;
}

/** Kindles a new angel into a fresh Heaven. */
export function buildRun(input: CreationInput, meta: MetaState, seed: number): Result<RunState> {
    const errors = validateCreation(input, meta);
    if (errors.length) return fail(errors.join(","));
    const choir = CHOIRS[input.choir];
    const variant = input.variant ? VARIANTS[input.variant as ChoirVariantId] : null;
    const weapon: Item = { id: "item-1", slot: "weapon", weapon: input.arms, tier: 1, anointing: null, soulbound: false };
    const items: Item[] = [weapon];
    if (meta.reliquary) items.push({ ...meta.reliquary, id: "item-2", soulbound: false });
    const startingStain = variant?.startingStain ?? 0;
    return ok({
        seed,
        rng: seedRng(seed),
        status: "alive",
        character: {
            creation: input,
            choir: input.choir,
            variant: input.variant,
            tongues: input.tongues.slice(),
            wordless: input.tongues.length === 0,
            boons: input.boons.slice(),
            burdens: input.burdens.slice(),
            origin: input.origin,
            appearance: input.appearance,
            canticle: null,
            attributes: finalAttributes(input),
            unsealed: [],
        },
        ascension: 0,
        xp: 0,
        unspentPoints: 0,
        halo: "bright",
        stain: startingStain,
        peakStain: startingStain,
        visions: upgradeValue(meta, "startingVisions"),
        feathers: STARTING_FEATHERS + upgradeValue(meta, "startingFeathers"),
        gifts: [
            ...choir.innateGifts.map((id) => ({ id, source: "choir" as const })),
            { id: ORIGINS[input.origin].gift, source: "origin" as const },
        ],
        pendingHands: [],
        stayedHands: [],
        keptCards: [],
        bannedGifts: [],
        guaranteedGift: null,
        pendingHymnDraws: [],
        hymnDrawsTaken: 0,
        hymns: [],
        slots: emptySlots(),
        coals: {},
        seals: {},
        vow: null,
        brokenVows: [],
        fallenStarMark: false,
        items,
        equipped: { weapon: weapon.id, armour: null },
        trumpet: null,
        trumpetProgress: 0,
        pendingTrumpetChoice: null,
        shrineUses: {},
        cleanses: {},
        witnesses: [],
        pendingTestimony: 0,
        quests: [],
        bossesDefeated: [],
        elapsedSeconds: 0,
        sealedRegions: [],
        penances: input.penances.slice(),
        metaBonuses: { demonDamageMult: 1 + upgradeValue(meta, "demonDamage"), armourMult: 1 + upgradeValue(meta, "armour") },
        nextId: 3,
    });
}
