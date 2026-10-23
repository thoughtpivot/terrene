/**
 * Vows (Deepwoken's Oaths). One at a time, unlocked by stats and quests,
 * mostly from Tier 2. Vow Gifts are free and Vow Hymns never level.
 * Vows are broken at the Mercy Seat; some can never be sworn again.
 * The Forbidden Vow of the Fallen Star needs Tier 5 and 50 Stain.
 */

import type { AttributeId, MetaState, Result, RunState, VowId } from "./types";
import { fail, forwardFail, ok } from "./types";
import { ARMS_ATTRIBUTES, TONGUE_ATTRIBUTES } from "./attributes";
import { tierOf, tierUnlocks } from "./corruption";
import { GIFTS, vowGifts } from "./gifts";
import { HYMNS, forgetHymn } from "./hymns";
import { applyStain } from "./stain";
import { recordWitness } from "./meta";
import { spendVisions } from "./run";

/** Doc value: a fully progressed Vow can be skipped later for 10 Visions. */
export const VOW_SKIP_VISIONS = 10;

export type VowRequirement =
    | { kind: "attributes"; min: Partial<Record<AttributeId, number>> }
    | { kind: "armsTotal"; min: number }
    | { kind: "tongueCount"; count: number; min: number }
    | { kind: "stain"; min: number };

export interface VowDef {
    id: VowId;
    name: string;
    playstyle: string;
    /** Every group in `requires` must pass; within a group any option passes. */
    requires: VowRequirement[][];
    quests: string[];
    forbidden: boolean;
    /** Breaking it bars swearing it again this run. */
    permanentOnBreak: boolean;
    hymn: string | null;
}

export const VOWS: Record<VowId, VowDef> = {
    flamingSword: {
        id: "flamingSword",
        name: "Vow of the Flaming Sword",
        playstyle: "Zone-holding with a blade.",
        requires: [[{ kind: "attributes", min: { might: 40 } }]],
        quests: ["quest:gate"],
        forbidden: false,
        permanentOnBreak: true,
        hymn: "noneShallPass",
    },
    watcher: {
        id: "watcher",
        name: "Vow of the Watcher",
        playstyle: "Stealth and vision.",
        requires: [[{ kind: "attributes", min: { faith: 40 } }]],
        quests: ["event:sleeplessVigil"],
        forbidden: false,
        permanentOnBreak: false,
        hymn: "markOfWitness",
    },
    herald: {
        id: "herald",
        name: "Vow of the Herald",
        playstyle: "Support and control.",
        requires: [[{ kind: "attributes", min: { voice: 50 } }]],
        quests: [],
        forbidden: false,
        permanentOnBreak: false,
        hymn: "whomShallISend",
    },
    martyr: {
        id: "martyr",
        name: "Vow of the Martyr",
        playstyle: "Stronger at low HP.",
        requires: [],
        quests: ["quest:martyrsBlow"],
        forbidden: false,
        permanentOnBreak: true,
        hymn: "lastBreathOutcry",
    },
    ophansEye: {
        id: "ophansEye",
        name: "Vow of the Ophan's Eye",
        playstyle: "Orbiting wheel-constructs.",
        requires: [[{ kind: "attributes", min: { wisdom: 20, judgementThunder: 20, whirlwind: 20 } }]],
        quests: [],
        forbidden: false,
        permanentOnBreak: false,
        hymn: "wheelWithinAWheel",
    },
    liveCoal: {
        id: "liveCoal",
        name: "Vow of the Live Coal",
        playstyle: "Weaving several elements.",
        requires: [[{ kind: "tongueCount", count: 4, min: 15 }]],
        quests: [],
        forbidden: false,
        permanentOnBreak: false,
        hymn: "altarsTongs",
    },
    michaelsHost: {
        id: "michaelsHost",
        name: "Vow of Michael's Host",
        playstyle: "Pure weapon mastery.",
        requires: [[{ kind: "attributes", min: { mediumArms: 75 } }, { kind: "armsTotal", min: 90 }]],
        quests: [],
        forbidden: false,
        permanentOnBreak: false,
        hymn: "castOut",
    },
    fallenStar: {
        id: "fallenStar",
        name: "Vow of the Fallen Star",
        playstyle: "Converts Stain into power. Demons stay neutral until you strike.",
        requires: [[{ kind: "stain", min: 50 }]],
        quests: ["quest:keyOfThePit"],
        forbidden: true,
        permanentOnBreak: true,
        hymn: "smokeOfTheFurnace",
    },
};

function requirementMet(run: RunState, req: VowRequirement): boolean {
    const attrs = run.character.attributes;
    switch (req.kind) {
        case "attributes":
            return (Object.keys(req.min) as AttributeId[]).every((id) => attrs[id] >= (req.min[id] ?? 0));
        case "armsTotal":
            return ARMS_ATTRIBUTES.reduce((sum, id) => sum + attrs[id], 0) >= req.min;
        case "tongueCount":
            return TONGUE_ATTRIBUTES.filter((id) => attrs[id] >= req.min).length >= req.count;
        case "stain":
            return run.stain >= req.min;
    }
}

export function vowRequirementsMet(run: RunState, id: VowId): boolean {
    return VOWS[id].requires.every((group) => group.some((req) => requirementMet(run, req)));
}

export interface SwearOptions {
    /** Pay Visions to skip the Vow's quests, if the account has fully progressed it before. */
    skipQuests?: boolean;
}

export function canSwear(run: RunState, id: VowId, meta: MetaState, options: SwearOptions = {}): Result<true> {
    const def = VOWS[id];
    if (run.status !== "alive") return fail("run-over");
    if (run.vow) return fail("vow-held");
    const tier = tierOf(run);
    if (!tierUnlocks(tier, def.forbidden ? "forbiddenVow" : "vows")) return fail("tier-locked");
    if (def.forbidden && run.fallenStarMark) return fail("vow-barred");
    if (def.permanentOnBreak && run.brokenVows.includes(id)) return fail("vow-barred");
    if (!vowRequirementsMet(run, id)) return fail("requirement");
    const questsDone = def.quests.every((q) => run.quests.includes(q));
    if (!questsDone) {
        if (!options.skipQuests || !meta.progressedVows.includes(id)) return fail("quest-required");
        if (run.visions < VOW_SKIP_VISIONS) return fail("not-enough-visions");
    }
    return ok(true);
}

/** Swears a Vow: grants its first Gift and its Hymn, and records the Witness. */
export function swearVow(run: RunState, id: VowId, meta: MetaState, options: SwearOptions = {}): Result<RunState> {
    const check = canSwear(run, id, meta, options);
    if (!check.ok) return forwardFail(check);
    const def = VOWS[id];
    let next = run;
    if (!def.quests.every((q) => run.quests.includes(q))) {
        const paid = spendVisions(next, VOW_SKIP_VISIONS, false);
        if (!paid.ok) return paid;
        next = paid.value;
    }
    const gifts = vowGifts(id);
    next = {
        ...next,
        vow: { id, progress: 1 },
        gifts: [...next.gifts, { id: gifts[0], source: "vow" }],
        hymns: def.hymn ? [...next.hymns, { id: def.hymn, level: 1, coals: [], seals: [] }] : next.hymns,
    };
    next = recordWitness(next, "sworeVow");
    if (def.forbidden) next = applyStain(next, "forbiddenVow");
    return ok(next);
}

/** Grants the next Vow Gift. Completing the Vow is remembered across wipes. */
export function progressVow(run: RunState): Result<RunState> {
    if (!run.vow) return fail("no-vow");
    const gifts = vowGifts(run.vow.id);
    if (run.vow.progress >= gifts.length) return fail("vow-complete");
    const progress = run.vow.progress + 1;
    let next: RunState = {
        ...run,
        vow: { ...run.vow, progress },
        gifts: [...run.gifts, { id: gifts[progress - 1], source: "vow" }],
    };
    if (progress >= gifts.length) next = recordWitness(next, `vowCompleted:${run.vow.id}`);
    return ok(next);
}

/** Breaks the held Vow at the Mercy Seat, removing its Gifts and Hymn. */
export function breakVow(run: RunState): Result<RunState> {
    if (!run.vow) return fail("no-vow");
    const id = run.vow.id;
    let next: RunState = {
        ...run,
        vow: null,
        gifts: run.gifts.filter((g) => GIFTS[g.id]?.vow !== id),
        brokenVows: run.brokenVows.includes(id) ? run.brokenVows : [...run.brokenVows, id],
        fallenStarMark: run.fallenStarMark || VOWS[id].forbidden,
    };
    for (const hymn of run.hymns) if (HYMNS[hymn.id]?.vow === id) next = forgetHymn(next, hymn.id);
    return ok(next);
}

/** The Forbidden Vow turns ally angels hostile and locks the pure endings. */
export function vowConsequences(run: RunState): { alliesHostile: boolean; pureEndingsLocked: boolean } {
    const forbidden = run.vow ? VOWS[run.vow.id].forbidden : false;
    return { alliesHostile: forbidden, pureEndingsLocked: forbidden || run.fallenStarMark };
}
