/**
 * Ascension (Deepwoken's Power), 0 at kindling up to 20.
 * Each Ascension gives 15 attribute points, a Gift hand, Visions and a Witness,
 * restores a dimmed halo, and on some Ascensions a Hymn Draw.
 * Experience costs rise with the corruption tier; rewards rise too.
 */

import type { CorruptionTier, HymnDraw, Result, RunState } from "./types";
import { fail, ok } from "./types";
import {
    BREACH_WARDEN_XP,
    FEATHER_EVERY_ASCENSIONS,
    HYMN_DRAW_ASCENSIONS,
    HYMN_DRAW_SIZE,
    UNLETTERED_XP_MULT,
    VISIONS_PER_ASCENSION,
    XP_BASE,
    XP_EXPONENT,
} from "./tuning";
import { MAX_ASCENSION, POINTS_PER_ASCENSION } from "./attributes";
import { ascensionCap, scaleReward, tierOf, tierScaling } from "./corruption";
import { autoPick, drawGiftHand, drawLesserGiftHands } from "./draw";
import { drawableHymns, learnHymn } from "./hymns";
import { recordWitness } from "./meta";
import { earnVisions, restoreHalo } from "./run";
import { shuffle } from "./rng";

export const TWO_LESSER_GIFTS = "twoLesserGifts";

export function experienceForAscension(n: number, tier: CorruptionTier): number {
    return Math.round(XP_BASE * Math.pow(n, XP_EXPONENT) * tierScaling(tier).costMult);
}

export function experienceNeeded(run: RunState): number {
    return experienceForAscension(run.ascension + 1, tierOf(run));
}

export function experienceMultiplier(run: RunState, inBreach: boolean): number {
    let mult = 1;
    const c = run.character;
    if (c.origin === "breachWarden") mult *= inBreach ? BREACH_WARDEN_XP.inBreach : BREACH_WARDEN_XP.outside;
    if (c.burdens.includes("unlettered")) mult *= UNLETTERED_XP_MULT;
    if (c.boons.includes("quickStudy")) mult *= 1.1;
    return mult;
}

export function gainExperience(run: RunState, base: number, context: { inBreach?: boolean } = {}): RunState {
    if (run.status !== "alive" || base <= 0) return run;
    const amount = scaleReward(base, tierOf(run)) * experienceMultiplier(run, context.inBreach ?? false);
    return { ...run, xp: run.xp + Math.round(amount) };
}

export function canAscend(run: RunState): boolean {
    return run.status === "alive" && run.ascension < ascensionCap(tierOf(run)) && run.xp >= experienceNeeded(run);
}

/**
 * Ascends once. `free` skips the experience cost (the Mouth's instant
 * Ascensions). Fated runs resolve their new hands at once.
 */
export function ascend(run: RunState, options: { free?: boolean } = {}): Result<RunState> {
    if (run.status !== "alive") return fail("run-over");
    if (run.ascension >= MAX_ASCENSION) return fail("max-ascension");
    if (!options.free && run.xp < experienceNeeded(run)) return fail("not-enough-experience");
    const level = run.ascension + 1;
    let next: RunState = {
        ...run,
        xp: options.free ? run.xp : run.xp - experienceNeeded(run),
        ascension: level,
        unspentPoints: run.unspentPoints + POINTS_PER_ASCENSION,
        feathers: run.feathers + (level % FEATHER_EVERY_ASCENSIONS === 0 ? 1 : 0),
    };
    next = restoreHalo(next);
    next = earnVisions(next, VISIONS_PER_ASCENSION);
    next = recordWitness(next, "ascension");
    const drawn = drawGiftHand(next, { kind: "ascension" });
    next = drawn.run;
    if (HYMN_DRAW_ASCENSIONS.includes(level)) next = drawHymns(next).run;
    if (next.penances.includes("fated")) next = resolveFated(next);
    return ok(next);
}

function resolveFated(run: RunState): RunState {
    let next = run;
    for (const hand of run.pendingHands) {
        const picked = autoPick(next, hand.id);
        if (picked.ok) next = picked.value;
    }
    return next;
}

/** A Hymn Draw: up to three Hymns the angel can learn, plus Two Lesser Gifts. */
export function drawHymns(run: RunState): { run: RunState; draw: HymnDraw } {
    const options = shuffle(run.rng, drawableHymns(run));
    const draw: HymnDraw = { id: run.nextId, hymns: options.value.slice(0, HYMN_DRAW_SIZE) };
    return { draw, run: { ...run, rng: options.rng, nextId: run.nextId + 1, pendingHymnDraws: [...run.pendingHymnDraws, draw] } };
}

/**
 * Resolves a Hymn Draw with a Hymn or Two Lesser Gifts. Psalmist grants a
 * Feather on every other resolved draw.
 */
export function pickHymnDraw(run: RunState, drawId: number, choice: string): Result<RunState> {
    const draw = run.pendingHymnDraws.find((d) => d.id === drawId);
    if (!draw) return fail("no-draw");
    let next: RunState = { ...run, pendingHymnDraws: run.pendingHymnDraws.filter((d) => d.id !== drawId) };
    if (choice === TWO_LESSER_GIFTS) {
        next = drawLesserGiftHands(next);
        if (next.penances.includes("fated")) next = resolveFated(next);
    } else {
        if (!draw.hymns.includes(choice)) return fail("not-in-draw");
        const learned = learnHymn(next, choice);
        if (!learned.ok) return learned;
        next = learned.value;
    }
    const taken = next.hymnDrawsTaken + 1;
    const feather = next.character.boons.includes("psalmist") && taken % 2 === 0 ? 1 : 0;
    return ok({ ...next, hymnDrawsTaken: taken, feathers: next.feathers + feather });
}
