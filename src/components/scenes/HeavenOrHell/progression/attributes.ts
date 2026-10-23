/**
 * Attributes, caps and point allocation.
 * Form (Might, Steadfast, Swiftness), Spirit (Wisdom, Faith, Voice),
 * Arms (Heavy, Medium, Light) and one attribute per Tongue.
 */

import type { ArmsAttribute, AttributeId, Attributes, Character, FormAttribute, Result, RunState, SpiritAttribute, TongueId } from "./types";
import { fail, ok } from "./types";

export const FORM_ATTRIBUTES: readonly FormAttribute[] = ["might", "steadfast", "swiftness"];
export const SPIRIT_ATTRIBUTES: readonly SpiritAttribute[] = ["wisdom", "faith", "voice"];
export const ARMS_ATTRIBUTES: readonly ArmsAttribute[] = ["heavyArms", "mediumArms", "lightArms"];
export const TONGUE_ATTRIBUTES: readonly TongueId[] = ["seraphFire", "firmament", "judgementThunder", "whirlwind", "radiance", "sacrifice"];
export const ALL_ATTRIBUTES: readonly AttributeId[] = [...FORM_ATTRIBUTES, ...SPIRIT_ATTRIBUTES, ...ARMS_ATTRIBUTES, ...TONGUE_ATTRIBUTES];

export const CREATION_POINTS = 15;
export const WORDLESS_BONUS_POINTS = 10;
export const SOFT_CAP = 75;
export const HARD_CAP = 100;
export const POINTS_PER_ASCENSION = 15;
export const MAX_ASCENSION = 20;
export const GRACE_PER_WISDOM = 2;
export const GRACE_PER_VOICE = 1.5;

export function isTongueAttribute(id: AttributeId): id is TongueId {
    return (TONGUE_ATTRIBUTES as readonly string[]).includes(id);
}

export function isCoreOrArms(id: AttributeId): boolean {
    return !isTongueAttribute(id);
}

export function emptyAttributes(): Attributes {
    const out = {} as Attributes;
    for (const id of ALL_ATTRIBUTES) out[id] = 0;
    return out;
}

export function sumAttributes(attrs: Partial<Attributes>): number {
    let total = 0;
    for (const id of ALL_ATTRIBUTES) total += attrs[id] ?? 0;
    return total;
}

export function attributeCap(character: Character, id: AttributeId): number {
    return character.unsealed.includes(id) ? HARD_CAP : SOFT_CAP;
}

export function formValue(attrs: Attributes): number {
    return Math.max(...FORM_ATTRIBUTES.map((id) => attrs[id]));
}

export function spiritValue(attrs: Attributes): number {
    return Math.max(...SPIRIT_ATTRIBUTES.map((id) => attrs[id]));
}

/** A Tongue attribute can only take points if the character has that Tongue. */
export function canInvest(character: Character, id: AttributeId): boolean {
    if (!isTongueAttribute(id)) return true;
    return !character.wordless && character.tongues.includes(id);
}

/** Spends unspent points. Respects caps and Tongue access. */
export function allocatePoints(run: RunState, id: AttributeId, amount: number): Result<RunState> {
    if (run.status !== "alive") return fail("run-over");
    if (!Number.isInteger(amount) || amount <= 0) return fail("bad-amount");
    if (amount > run.unspentPoints) return fail("not-enough-points");
    const character = run.character;
    if (!canInvest(character, id)) return fail("tongue-not-known");
    const next = character.attributes[id] + amount;
    if (next > attributeCap(character, id)) return fail(character.unsealed.includes(id) ? "hard-cap" : "soft-cap");
    return ok({
        ...run,
        unspentPoints: run.unspentPoints - amount,
        character: { ...character, attributes: { ...character.attributes, [id]: next } },
    });
}

/** Unsealing raises one attribute's cap from 75 to 100. It needs the attribute's Unsealing quest. */
export function unsealAttribute(run: RunState, id: AttributeId, questId = `unsealing:${id}`): Result<RunState> {
    if (!run.quests.includes(questId)) return fail("quest-required");
    if (run.character.unsealed.includes(id)) return fail("already-unsealed");
    return ok({ ...run, character: { ...run.character, unsealed: [...run.character.unsealed, id] } });
}
