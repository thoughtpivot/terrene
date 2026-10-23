/**
 * Hymns (Deepwoken's Mantras), cast with Grace.
 * Slots: 3 Combat, 1 Support, 1 Mobility, 1 Wildcard (any kind).
 * Levels 1 to 5 unlock at 20, 40, 60 and 80 investment in the Hymn's attribute.
 * Altar Coals change a Hymn's shape and raise its Grace cost. Seals change its
 * behaviour and cost nothing. Vow Hymns never level up.
 */

import type { AttributeId, CoalId, HymnSlotKind, HymnSlots, KnownHymn, Result, RunState, SealId, TongueId, VowId } from "./types";
import { fail, ok } from "./types";
import { COAL_GRACE_COST_STEP, HYMN_BASE_GRACE, HYMN_STAR_REQUIREMENT, MAX_COALS_PER_HYMN, MAX_SEALS_PER_HYMN } from "./tuning";
import { tierOf, tierUnlocks } from "./corruption";

export const HYMN_LEVEL_THRESHOLDS: readonly number[] = [20, 40, 60, 80];
export const MAX_HYMN_LEVEL = 5;
export const SLOT_COUNTS = { combat: 3, support: 1, mobility: 1, wildcard: 1 };

export interface HymnDef {
    id: string;
    name: string;
    kind: HymnSlotKind;
    stars: 1 | 2 | 3;
    tongue: TongueId | null;
    /** The attribute the Hymn scales on and levels with. */
    scaling: AttributeId;
    vow: VowId | null;
    /** Support Hymns cast with a Liturgy key sequence. */
    liturgy: boolean;
}

function tongueHymn(id: string, name: string, tongue: TongueId, kind: HymnSlotKind, stars: 1 | 2 | 3): HymnDef {
    return { id, name, kind, stars, tongue, scaling: tongue, vow: null, liturgy: kind === "support" };
}

export const HYMNS: Record<string, HymnDef> = {};

const HYMN_LIST: HymnDef[] = [
    tongueHymn("coalFromTheAltar", "Coal from the Altar", "seraphFire", "combat", 1),
    tongueHymn("tongsOfTheSeraph", "Tongs of the Seraph", "seraphFire", "combat", 2),
    tongueHymn("burningThrone", "Burning Throne", "seraphFire", "combat", 3),
    tongueHymn("crystalShard", "Crystal Shard", "firmament", "combat", 1),
    tongueHymn("firmamentWall", "Firmament Wall", "firmament", "support", 2),
    tongueHymn("seaOfGlass", "Sea of Glass", "firmament", "combat", 3),
    tongueHymn("flashOfTheLivingCreatures", "Flash of the Living Creatures", "judgementThunder", "mobility", 1),
    tongueHymn("voiceFromTheFirmament", "Voice from the Firmament", "judgementThunder", "combat", 2),
    tongueHymn("sevenfoldVerdict", "Sevenfold Verdict", "judgementThunder", "combat", 3),
    tongueHymn("updraft", "Updraft", "whirlwind", "mobility", 1),
    tongueHymn("noiseOfGreatWaters", "Noise of Great Waters", "whirlwind", "combat", 2),
    tongueHymn("answerFromTheWhirlwind", "Answer from the Whirlwind", "whirlwind", "combat", 3),
    tongueHymn("gloryFlash", "Glory Flash", "radiance", "combat", 1),
    tongueHymn("unveiling", "Unveiling", "radiance", "support", 2),
    tongueHymn("brightnessRoundAbout", "Brightness Round About", "radiance", "combat", 3),
    tongueHymn("lambsBloodWard", "Lamb's Blood Ward", "sacrifice", "support", 1),
    tongueHymn("theyOvercame", "They Overcame", "sacrifice", "combat", 2),
    tongueHymn("untoTheDeath", "Unto the Death", "sacrifice", "combat", 3),
    { id: "trisagion", name: "Trisagion", kind: "combat", stars: 2, tongue: null, scaling: "voice", vow: null, liturgy: false },
    { id: "wingBeat", name: "Wing Beat", kind: "mobility", stars: 1, tongue: null, scaling: "swiftness", vow: null, liturgy: false },
    { id: "psalmOfMending", name: "Psalm of Mending", kind: "support", stars: 1, tongue: null, scaling: "faith", vow: null, liturgy: true },
    { id: "noneShallPass", name: "None Shall Pass", kind: "combat", stars: 2, tongue: null, scaling: "might", vow: "flamingSword", liturgy: false },
    { id: "markOfWitness", name: "Mark of Witness", kind: "support", stars: 2, tongue: null, scaling: "faith", vow: "watcher", liturgy: true },
    { id: "whomShallISend", name: "Whom Shall I Send", kind: "support", stars: 2, tongue: null, scaling: "voice", vow: "herald", liturgy: true },
    { id: "lastBreathOutcry", name: "Last Breath Outcry", kind: "combat", stars: 2, tongue: null, scaling: "faith", vow: "martyr", liturgy: false },
    { id: "wheelWithinAWheel", name: "Wheel within a Wheel", kind: "combat", stars: 2, tongue: null, scaling: "wisdom", vow: "ophansEye", liturgy: false },
    { id: "altarsTongs", name: "Altar's Tongs", kind: "combat", stars: 2, tongue: null, scaling: "faith", vow: "liveCoal", liturgy: false },
    { id: "castOut", name: "Cast Out", kind: "combat", stars: 2, tongue: null, scaling: "mediumArms", vow: "michaelsHost", liturgy: false },
    { id: "smokeOfTheFurnace", name: "Smoke of the Furnace", kind: "support", stars: 2, tongue: null, scaling: "faith", vow: "fallenStar", liturgy: true },
];
for (const hymn of HYMN_LIST) HYMNS[hymn.id] = hymn;

export interface CoalDef {
    id: CoalId;
    name: string;
    /** Shape changes as multipliers on the Hymn's base values. */
    changes: Partial<Record<"size" | "speed" | "range" | "duration" | "area", number>>;
}

export const COALS: Record<CoalId, CoalDef> = {
    ember: { id: "ember", name: "Ember", changes: { size: 1.25, speed: 0.85 } },
    berylLens: { id: "berylLens", name: "Beryl Lens", changes: { range: 1.25, size: 0.85 } },
    amber: { id: "amber", name: "Amber", changes: { duration: 1.25, range: 0.85 } },
    brassFiling: { id: "brassFiling", name: "Brass Filing", changes: { speed: 1.25, duration: 0.85 } },
    sapphire: { id: "sapphire", name: "Sapphire", changes: { area: 1.25, duration: 0.85 } },
};

export const SEALS: Record<SealId, { id: SealId; name: string; behaviour: string }> = {
    pursuit: { id: "pursuit", name: "Seal of Pursuit", behaviour: "chases the target" },
    bursting: { id: "bursting", name: "Seal of Bursting", behaviour: "detonates" },
    wheel: { id: "wheel", name: "Seal of the Wheel", behaviour: "orbits you" },
};

export function emptySlots(): HymnSlots {
    return { combat: [null, null, null], support: null, mobility: null, wildcard: null };
}

export function hymnLevelCap(def: HymnDef, investment: number): number {
    if (def.vow) return 1;
    let level = 1;
    for (const at of HYMN_LEVEL_THRESHOLDS) if (investment >= at) level++;
    return Math.min(level, MAX_HYMN_LEVEL);
}

export function hymnRequirement(def: HymnDef): number {
    return def.vow ? 0 : HYMN_STAR_REQUIREMENT[def.stars];
}

/** Whether the character may learn this Hymn (Tongue known, requirement met). */
export function canLearnHymn(run: RunState, def: HymnDef): boolean {
    const c = run.character;
    if (def.vow) return run.vow?.id === def.vow;
    if (def.tongue && (c.wordless || !c.tongues.includes(def.tongue))) return false;
    return c.attributes[def.scaling] >= hymnRequirement(def);
}

export function learnHymn(run: RunState, id: string): Result<RunState> {
    const def = HYMNS[id];
    if (!def) return fail("unknown-hymn");
    if (run.hymns.some((h) => h.id === id)) return fail("already-known");
    if (!canLearnHymn(run, def)) return fail("requirement");
    return ok({ ...run, hymns: [...run.hymns, { id, level: 1, coals: [], seals: [] }] });
}

/** Raises a Hymn one level at a Cantor, if investment allows it. */
export function upgradeHymn(run: RunState, id: string): Result<RunState> {
    const known = run.hymns.find((h) => h.id === id);
    if (!known) return fail("not-known");
    const def = HYMNS[id];
    if (def.vow) return fail("vow-hymn");
    if (known.level >= hymnLevelCap(def, run.character.attributes[def.scaling])) return fail("investment");
    return ok({ ...run, hymns: run.hymns.map((h) => (h.id === id ? { ...h, level: h.level + 1 } : h)) });
}

export type SlotRef = { kind: "combat"; index: number } | { kind: "support" | "mobility" | "wildcard" };

export function equipHymn(run: RunState, id: string, slot: SlotRef): Result<RunState> {
    if (!run.hymns.some((h) => h.id === id)) return fail("not-known");
    const def = HYMNS[id];
    if (slot.kind !== "wildcard" && slot.kind !== def.kind) return fail("wrong-slot");
    if (slot.kind === "combat" && (slot.index < 0 || slot.index >= SLOT_COUNTS.combat)) return fail("bad-slot");
    const cleared = unequipHymnFromSlots(run.slots, id);
    const slots: HymnSlots = { ...cleared, combat: cleared.combat.slice() };
    if (slot.kind === "combat") slots.combat[slot.index] = id;
    else slots[slot.kind] = id;
    return ok({ ...run, slots });
}

function unequipHymnFromSlots(slots: HymnSlots, id: string): HymnSlots {
    return {
        combat: slots.combat.map((s) => (s === id ? null : s)),
        support: slots.support === id ? null : slots.support,
        mobility: slots.mobility === id ? null : slots.mobility,
        wildcard: slots.wildcard === id ? null : slots.wildcard,
    };
}

export function forgetHymn(run: RunState, id: string): RunState {
    return { ...run, hymns: run.hymns.filter((h) => h.id !== id), slots: unequipHymnFromSlots(run.slots, id) };
}

export function equippedHymns(slots: HymnSlots): string[] {
    return [...slots.combat, slots.support, slots.mobility, slots.wildcard].filter((s): s is string => s !== null);
}

/** Applies an Altar Coal at a Lectern of Psalms. Coals drop from Tier 1. */
export function applyCoal(run: RunState, hymnId: string, coal: CoalId): Result<RunState> {
    const known = run.hymns.find((h) => h.id === hymnId);
    if (!known) return fail("not-known");
    if (!tierUnlocks(tierOf(run), "altarCoals")) return fail("tier-locked");
    if ((run.coals[coal] ?? 0) <= 0) return fail("no-coal");
    if (known.coals.length >= MAX_COALS_PER_HYMN) return fail("coal-limit");
    if (known.coals.includes(coal)) return fail("coal-duplicate");
    return ok({
        ...run,
        coals: { ...run.coals, [coal]: (run.coals[coal] ?? 0) - 1 },
        hymns: run.hymns.map((h) => (h.id === hymnId ? { ...h, coals: [...h.coals, coal] } : h)),
    });
}

export function applySeal(run: RunState, hymnId: string, seal: SealId): Result<RunState> {
    const known = run.hymns.find((h) => h.id === hymnId);
    if (!known) return fail("not-known");
    if (!tierUnlocks(tierOf(run), "altarCoals")) return fail("tier-locked");
    if ((run.seals[seal] ?? 0) <= 0) return fail("no-seal");
    if (known.seals.length >= MAX_SEALS_PER_HYMN) return fail("seal-limit");
    return ok({
        ...run,
        seals: { ...run.seals, [seal]: (run.seals[seal] ?? 0) - 1 },
        hymns: run.hymns.map((h) => (h.id === hymnId ? { ...h, seals: [...h.seals, seal] } : h)),
    });
}

/** Grace cost: base by stars, +15% per Coal, Seals free, then the character's cost multiplier. */
export function hymnGraceCost(hymn: KnownHymn, graceCostMult = 1): number {
    const def = HYMNS[hymn.id];
    const base = HYMN_BASE_GRACE[def.stars];
    return Math.round(base * (1 + COAL_GRACE_COST_STEP * hymn.coals.length) * graceCostMult);
}

/** The combined shape multipliers from a Hymn's Coals. */
export function hymnShape(hymn: KnownHymn): Record<"size" | "speed" | "range" | "duration" | "area", number> {
    const shape = { size: 1, speed: 1, range: 1, duration: 1, area: 1 };
    for (const coal of hymn.coals) {
        const changes = COALS[coal].changes;
        for (const key of Object.keys(changes) as (keyof typeof shape)[]) shape[key] *= changes[key] ?? 1;
    }
    return shape;
}

/** Hymns the character could be offered in a Hymn Draw. */
export function drawableHymns(run: RunState): string[] {
    return HYMN_LIST.filter((def) => !def.vow && !run.hymns.some((h) => h.id === def.id) && canLearnHymn(run, def)).map((def) => def.id);
}
