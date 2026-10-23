/**
 * Shrines of the Throne (Deepwoken's Deep Shrines), paid with Visions:
 * a currency earned within a run and lost on wipe. Vision prices rise with
 * the corruption tier. The Mercy Seat is separate and costs nothing.
 */

import type { AttributeId, BurdenId, Result, RunState } from "./types";
import { fail, forwardFail, ok } from "./types";
import { ALL_ATTRIBUTES, attributeCap, isCoreOrArms } from "./attributes";
import { CHOIRS } from "./choirs";
import { TierUnlock, scaleCost, tierOf, tierUnlocks } from "./corruption";
import { GIFTS } from "./gifts";
import { HYMNS, forgetHymn } from "./hymns";
import { drawGiftHand, drawLesserGiftHands } from "./draw";
import { ascend, drawHymns } from "./ascension";
import { BURDENS } from "./boons";
import { applyStain, cleanseStain } from "./stain";
import { spendVisions } from "./run";
import { rollInt } from "./rng";
import { breakVow } from "./vows";
import { rerollTrumpet } from "./trumpets";
import type { ShrineId } from "./types";

export interface ShrineDef {
    id: ShrineId;
    name: string;
    deepwoken: string;
    unlock: TierUnlock;
    text: string;
}

export const SHRINES: Record<ShrineId, ShrineDef> = {
    scales: { id: "scales", name: "Shrine of the Scales", deepwoken: "Order", unlock: "shrine:scales", text: "10 Visions, once per run, Ascension 8+, no Vow: averages your stats." },
    refining: { id: "refining", name: "Shrine of Refining", deepwoken: "Mastery", unlock: "shrine:refining", text: "1 Vision: refund an attribute point (3 per run). 3 Visions: cleanse 10 Stain (twice per run)." },
    joinedWings: { id: "joinedWings", name: "Shrine of Joined Wings", deepwoken: "Unification", unlock: "shrine:joinedWings", text: "2 Gifts and 5 Visions for a Hymn Draw." },
    partedWings: { id: "partedWings", name: "Shrine of the Parted Wings", deepwoken: "Division", unlock: "shrine:partedWings", text: "A Hymn and 5 Visions for Two Lesser Gifts." },
    lots: { id: "lots", name: "Shrine of Lots", deepwoken: "Chance", unlock: "shrine:lots", text: "A Gift and 5 Visions for a hand of its rarity, or a Common and 10 for a hand of Rares." },
    mouth: { id: "mouth", name: "The Mouth Speaking Great Things", deepwoken: "Blasphemy", unlock: "shrine:mouth", text: "5 Visions: three instant Ascensions, a Burden and +15 Stain. Above Ascension 17 it rerolls a Burden instead." },
};

export const SCALES_COST = 10;
export const SCALES_MIN_ASCENSION = 8;
export const SCALES_MAX_LOSS = 25;
export const REFINING_REFUND_COST = 1;
export const REFINING_MAX_REFUNDS = 3;
export const JOINED_WINGS_COST = 5;
export const PARTED_WINGS_COST = 5;
export const LOTS_COST = 5;
export const LOTS_RARE_COST = 10;
export const MOUTH_COST = 5;
export const MOUTH_ASCENSIONS = 3;
export const MOUTH_REROLL_ABOVE = 17;

export function shrineAvailable(run: RunState, id: ShrineId): boolean {
    return tierUnlocks(tierOf(run), SHRINES[id].unlock);
}

export function shrineCost(run: RunState, base: number): number {
    return scaleCost(base, tierOf(run));
}

function open(run: RunState, id: ShrineId): Result<RunState> {
    if (run.status !== "alive") return fail("run-over");
    if (!shrineAvailable(run, id)) return fail("tier-locked");
    return ok(run);
}

function bumpUse(run: RunState, key: string): RunState {
    return { ...run, shrineUses: { ...run.shrineUses, [key]: (run.shrineUses[key] ?? 0) + 1 } };
}

/**
 * The averaged attributes. Every invested attribute moves to the mean, but a
 * Form, Spirit or Arms attribute loses at most 25; Tongues can lose any amount.
 */
export function scalesResult(run: RunState): Record<AttributeId, number> {
    const attrs = run.character.attributes;
    const ids = ALL_ATTRIBUTES.filter((id) => attrs[id] > 0);
    const total = ids.reduce((sum, id) => sum + attrs[id], 0);
    const fixed: Partial<Record<AttributeId, number>> = {};
    for (;;) {
        const free = ids.filter((id) => fixed[id] === undefined);
        const fixedSum = (Object.keys(fixed) as AttributeId[]).reduce((s, id) => s + (fixed[id] ?? 0), 0);
        const avg = free.length ? (total - fixedSum) / free.length : 0;
        const clamp = free.filter((id) => isCoreOrArms(id) && attrs[id] - avg > SCALES_MAX_LOSS);
        if (clamp.length === 0) break;
        for (const id of clamp) fixed[id] = attrs[id] - SCALES_MAX_LOSS;
    }
    const out = { ...attrs };
    const free = ids.filter((id) => fixed[id] === undefined);
    const fixedSum = (Object.keys(fixed) as AttributeId[]).reduce((s, id) => s + (fixed[id] ?? 0), 0);
    const remaining = total - fixedSum;
    const base = free.length ? Math.floor(remaining / free.length) : 0;
    let extra = remaining - base * free.length;
    const byOriginal = free.slice().sort((a, b) => attrs[b] - attrs[a] || ALL_ATTRIBUTES.indexOf(a) - ALL_ATTRIBUTES.indexOf(b));
    for (const id of byOriginal) {
        out[id] = base + (extra > 0 ? 1 : 0);
        if (extra > 0) extra--;
    }
    for (const id of Object.keys(fixed) as AttributeId[]) out[id] = fixed[id] ?? 0;
    return out;
}

export function useScales(run: RunState): Result<RunState> {
    const opened = open(run, "scales");
    if (!opened.ok) return opened;
    if ((run.shrineUses.scales ?? 0) >= 1) return fail("once-per-run");
    if (run.ascension < SCALES_MIN_ASCENSION) return fail("ascension");
    if (run.vow) return fail("vow-held");
    const paid = spendVisions(run, SCALES_COST);
    if (!paid.ok) return paid;
    const averaged = scalesResult(run);
    let overflow = 0;
    for (const id of ALL_ATTRIBUTES) {
        const cap = attributeCap(run.character, id);
        if (averaged[id] > cap) {
            overflow += averaged[id] - cap;
            averaged[id] = cap;
        }
    }
    const next = { ...paid.value, unspentPoints: paid.value.unspentPoints + overflow, character: { ...paid.value.character, attributes: averaged } };
    return ok(bumpUse(next, "scales"));
}

/** The lowest an attribute can be refined to: the Choir bonus and every held Gift's requirement. */
export function refineFloor(run: RunState, id: AttributeId): number {
    const choir = CHOIRS[run.character.choir];
    let floor = choir.bonus.major === id ? 3 : choir.bonus.minor === id ? 2 : 0;
    for (const g of run.gifts) floor = Math.max(floor, GIFTS[g.id]?.requires?.[id] ?? 0);
    return floor;
}

export function useRefiningRefund(run: RunState, id: AttributeId): Result<RunState> {
    const opened = open(run, "refining");
    if (!opened.ok) return opened;
    if ((run.shrineUses.refiningRefund ?? 0) >= REFINING_MAX_REFUNDS) return fail("refund-limit");
    if (run.character.attributes[id] - 1 < refineFloor(run, id)) return fail("gift-requirement");
    const paid = spendVisions(run, REFINING_REFUND_COST);
    if (!paid.ok) return paid;
    const c = paid.value.character;
    const next = { ...paid.value, unspentPoints: paid.value.unspentPoints + 1, character: { ...c, attributes: { ...c.attributes, [id]: c.attributes[id] - 1 } } };
    return ok(bumpUse(next, "refiningRefund"));
}

export function useRefiningCleanse(run: RunState): Result<RunState> {
    const opened = open(run, "refining");
    if (!opened.ok) return opened;
    const cleansed = cleanseStain(run, "refiningShrine");
    return cleansed.ok ? ok(cleansed.value.run) : forwardFail(cleansed);
}

/** Only Gifts that were drawn can be traded, and not ones another held Gift depends on. */
export function tradeableGift(run: RunState, giftId: string): boolean {
    const held = run.gifts.find((g) => g.id === giftId);
    if (!held || held.source !== "drawn") return false;
    return !run.gifts.some((g) => (GIFTS[g.id]?.prerequisites ?? []).includes(giftId));
}

function removeGifts(run: RunState, ids: string[]): RunState {
    return { ...run, gifts: run.gifts.filter((g) => !ids.includes(g.id)) };
}

export function useJoinedWings(run: RunState, giftIds: [string, string]): Result<RunState> {
    const opened = open(run, "joinedWings");
    if (!opened.ok) return opened;
    if (giftIds[0] === giftIds[1] || !giftIds.every((id) => tradeableGift(run, id))) return fail("gift-not-tradeable");
    const paid = spendVisions(run, JOINED_WINGS_COST);
    if (!paid.ok) return paid;
    return ok(drawHymns(removeGifts(paid.value, giftIds)).run);
}

export function usePartedWings(run: RunState, hymnId: string): Result<RunState> {
    const opened = open(run, "partedWings");
    if (!opened.ok) return opened;
    if (!run.hymns.some((h) => h.id === hymnId) || HYMNS[hymnId]?.vow) return fail("hymn-not-tradeable");
    const paid = spendVisions(run, PARTED_WINGS_COST);
    if (!paid.ok) return paid;
    return ok(drawLesserGiftHands(forgetHymn(paid.value, hymnId)));
}

/** Trades a Gift for a hand of its rarity, or (rares) a Common for a hand of Rares. */
export function useLots(run: RunState, giftId: string, options: { rares?: boolean } = {}): Result<RunState> {
    const opened = open(run, "lots");
    if (!opened.ok) return opened;
    if (!tradeableGift(run, giftId)) return fail("gift-not-tradeable");
    const rarity = GIFTS[giftId].rarity;
    if (options.rares && rarity !== "Common") return fail("needs-common");
    const paid = spendVisions(run, options.rares ? LOTS_RARE_COST : LOTS_COST);
    if (!paid.ok) return paid;
    const traded = removeGifts(paid.value, [giftId]);
    return ok(drawGiftHand(traded, { kind: "lots", rarities: [options.rares ? "Rare" : rarity], allowStay: false }).run);
}

function randomNewBurden(run: RunState, exclude: BurdenId[]): { run: RunState; burden: BurdenId | null } {
    const options = (Object.keys(BURDENS) as BurdenId[]).filter((id) => BURDENS[id].selectable && !exclude.includes(id));
    if (options.length === 0) return { run, burden: null };
    const r = rollInt(run.rng, options.length);
    return { run: { ...run, rng: r.rng }, burden: options[r.value] };
}

/** The Mouth: three instant Ascensions, a Burden and +15 Stain. Above Ascension 17 it rerolls a Burden. */
export function useMouth(run: RunState): Result<RunState> {
    const opened = open(run, "mouth");
    if (!opened.ok) return opened;
    const paid = spendVisions(run, MOUTH_COST);
    if (!paid.ok) return paid;
    let next = paid.value;
    const held = next.character.burdens;
    if (next.ascension > MOUTH_REROLL_ABOVE) {
        const rerollable = held.filter((b) => BURDENS[b].selectable);
        if (rerollable.length > 0) {
            const r = rollInt(next.rng, rerollable.length);
            next = { ...next, rng: r.rng };
            const old = rerollable[r.value];
            const fresh = randomNewBurden(next, held);
            next = fresh.run;
            if (fresh.burden) next = { ...next, character: { ...next.character, burdens: held.map((b) => (b === old ? (fresh.burden as BurdenId) : b)) } };
        }
    } else {
        for (let i = 0; i < MOUTH_ASCENSIONS && next.ascension < 20; i++) {
            const up = ascend(next, { free: true });
            if (!up.ok) return up;
            next = up.value;
        }
        const fresh = randomNewBurden(next, next.character.burdens);
        next = fresh.run;
        if (fresh.burden) next = { ...next, character: { ...next.character, burdens: [...next.character.burdens, fresh.burden] } };
    }
    return ok(bumpUse(applyStain(next, "mouthShrine"), "mouth"));
}

// The Mercy Seat: break a Vow, reroll a Trumpet (gives Tarnished), remove a Canticle.

export const mercySeat = {
    breakVow,
    rerollTrumpet,
    removeCanticle(run: RunState): Result<RunState> {
        if (!run.character.canticle) return fail("no-canticle");
        return ok({ ...run, character: { ...run.character, canticle: null } });
    },
};
