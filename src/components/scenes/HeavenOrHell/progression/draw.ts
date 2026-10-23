/**
 * Gift hands. Seeded, so the same run state always draws the same hand.
 * A hand has 4 or 5 cards: up to two Rares, sometimes one Advanced, the rest
 * Common. Some hands offer Stay, which saves the hand for later. Feathers ban
 * a card for the run, guarantee a card in the next hand, or keep a card for
 * the next hand.
 */

import type { GiftHand, GiftRarity, Result, RunState } from "./types";
import { fail, ok } from "./types";
import {
    ADVANCED_CHANCE,
    FIVE_CARD_CHANCE,
    HAND_SIZE_MAX,
    HAND_SIZE_MIN,
    LESSER_GIFT_HANDS,
    RARES_PER_HAND,
    RARITY_ORDER,
    SANCTIFIED_WEIGHT_FROM_TIER_2,
    STAY_CHANCE,
} from "./tuning";
import { DRAWABLE_CATEGORIES, GIFTS, GiftDef, excludes } from "./gifts";
import { VARIANTS } from "./choirs";
import { firstTierFor, tierOf, tierUnlocks } from "./corruption";
import { rollChance, rollInt, rollWeighted } from "./rng";
import { applyStain } from "./stain";
import type { AttributeId } from "./types";

export const FALLEN_STAIN = 25;

export function heldGiftIds(run: RunState): string[] {
    return run.gifts.map((g) => g.id);
}

/** The tier at which this character's Fallen pool opens (Tier 3, or earlier for Seventh Watcher). */
export function fallenPoolTier(run: RunState): number {
    const variant = run.character.variant ? VARIANTS[run.character.variant] : null;
    return variant?.fallenPoolTier ?? firstTierFor("fallenPool");
}

/** Why a Gift can't be taken right now, or null if it can. */
export function giftBlock(run: RunState, def: GiftDef): string | null {
    const held = heldGiftIds(run);
    const tier = tierOf(run);
    if (held.includes(def.id)) return "held";
    if (run.bannedGifts.includes(def.id)) return "banned";
    if (def.minTier !== undefined && tier < def.minTier) return "tier";
    if (def.category === "Fallen") {
        if (run.stain < FALLEN_STAIN || tier < fallenPoolTier(run)) return "fallen-locked";
        if (def.rarity === "Advanced" && !tierUnlocks(tier, "fallenAdvanced")) return "fallen-locked";
    }
    if (def.category === "Sanctified" && run.stain !== 0) return "sanctified-locked";
    for (const id of Object.keys(def.requires ?? {}) as AttributeId[]) {
        if (run.character.attributes[id] < (def.requires?.[id] ?? 0)) return "requirement";
    }
    if ((def.prerequisites ?? []).some((p) => !held.includes(p))) return "prerequisite";
    if (held.some((h) => excludes(h, def.id))) return "exclusive";
    return null;
}

/** Every Gift that could appear in a hand right now. */
export function eligibleGifts(run: RunState): string[] {
    return Object.keys(GIFTS).filter((id) => {
        const def = GIFTS[id];
        return DRAWABLE_CATEGORIES.includes(def.category) && giftBlock(run, def) === null;
    });
}

function giftWeight(run: RunState, def: GiftDef): number {
    if (def.category === "Sanctified" && tierUnlocks(tierOf(run), "sanctifiedWeighting") && run.stain === 0) return SANCTIFIED_WEIGHT_FROM_TIER_2;
    return 1;
}

export interface DrawOptions {
    kind?: GiftHand["kind"];
    /** Only cards of these rarities (Two Lesser Gifts, the Shrine of Lots). */
    rarities?: GiftRarity[];
    /** Whether the hand can offer Stay. Defaults to Ascension hands only. */
    allowStay?: boolean;
}

/** Draws one hand and adds it to the pending hands. */
export function drawGiftHand(run: RunState, options: DrawOptions = {}): { run: RunState; hand: GiftHand } {
    const kind = options.kind ?? "ascension";
    let rng = run.rng;
    const inOtherHands = new Set<string>();
    for (const h of [...run.pendingHands, ...run.stayedHands]) for (const c of h.cards) inOtherHands.add(c);
    const allowed = (def: GiftDef) => !options.rarities || options.rarities.includes(def.rarity);
    let pool = eligibleGifts(run).filter((id) => !inOtherHands.has(id) && allowed(GIFTS[id]));

    const sizeRoll = rollChance(rng, FIVE_CARD_CHANCE);
    rng = sizeRoll.rng;
    const size = sizeRoll.value ? HAND_SIZE_MAX : HAND_SIZE_MIN;

    const cards: string[] = [];
    const take = (id: string) => {
        cards.push(id);
        pool = pool.filter((p) => p !== id);
    };
    let guaranteedGift = run.guaranteedGift;
    if (guaranteedGift && pool.includes(guaranteedGift)) {
        take(guaranteedGift);
        guaranteedGift = null;
    }
    const kept = run.keptCards.filter((id) => GIFTS[id] && giftBlock(run, GIFTS[id]) === null && !cards.includes(id));

    const plan: GiftRarity[] = [];
    if (!options.rarities) {
        const adv = rollChance(rng, ADVANCED_CHANCE);
        rng = adv.rng;
        if (adv.value) plan.push("Advanced");
        for (let i = 0; i < RARES_PER_HAND; i++) plan.push("Rare");
    }
    while (plan.length < size) plan.push(options.rarities ? options.rarities[0] : "Common");

    for (const rarity of plan) {
        if (cards.length >= size) break;
        const order = [rarity, ...RARITY_ORDER.filter((r) => r !== rarity)];
        for (const r of order) {
            const choices = pool.filter((id) => GIFTS[id].rarity === r && allowed(GIFTS[id]));
            if (choices.length === 0) continue;
            const pick = rollWeighted(rng, choices.map((id) => ({ item: id, weight: giftWeight(run, GIFTS[id]) })));
            rng = pick.rng;
            if (pick.value) take(pick.value);
            break;
        }
    }
    for (const id of kept) if (!cards.includes(id)) cards.push(id);

    let stay = false;
    if (options.allowStay ?? kind === "ascension") {
        const s = rollChance(rng, STAY_CHANCE);
        rng = s.rng;
        stay = s.value;
    }
    const hand: GiftHand = { id: run.nextId, kind, cards, stay };
    return {
        hand,
        run: { ...run, rng, nextId: run.nextId + 1, guaranteedGift, keptCards: [], pendingHands: [...run.pendingHands, hand] },
    };
}

export function drawLesserGiftHands(run: RunState): RunState {
    let next = run;
    for (let i = 0; i < LESSER_GIFT_HANDS; i++) next = drawGiftHand(next, { kind: "lesser", rarities: ["Common"], allowStay: false }).run;
    return next;
}

function findHand(run: RunState, handId: number): { hand: GiftHand; stayed: boolean } | null {
    const pending = run.pendingHands.find((h) => h.id === handId);
    if (pending) return { hand: pending, stayed: false };
    const stayed = run.stayedHands.find((h) => h.id === handId);
    return stayed ? { hand: stayed, stayed: true } : null;
}

function removeHand(run: RunState, handId: number): RunState {
    return { ...run, pendingHands: run.pendingHands.filter((h) => h.id !== handId), stayedHands: run.stayedHands.filter((h) => h.id !== handId) };
}

/** Takes one card from a hand. Taking a Fallen Gift adds Stain. */
export function pickGift(run: RunState, handId: number, giftId: string, options: { fatedRoll?: boolean } = {}): Result<RunState> {
    if (run.status !== "alive") return fail("run-over");
    if (run.penances.includes("fated") && !options.fatedRoll) return fail("fated");
    const found = findHand(run, handId);
    if (!found) return fail("no-hand");
    if (!found.hand.cards.includes(giftId)) return fail("not-in-hand");
    const block = giftBlock(run, GIFTS[giftId]);
    if (block) return fail(block);
    let next = removeHand(run, handId);
    next = { ...next, gifts: [...next.gifts, { id: giftId, source: found.hand.kind === "throne" ? "throne" : "drawn" }] };
    if (GIFTS[giftId].category === "Fallen") next = applyStain(next, "fallenGift");
    return ok(next);
}

/** Fated: the seeded roll picks a card that can still be taken. */
export function autoPick(run: RunState, handId: number): Result<RunState> {
    const found = findHand(run, handId);
    if (!found) return fail("no-hand");
    const options = found.hand.cards.filter((id) => giftBlock(run, GIFTS[id]) === null);
    if (options.length === 0) return ok(removeHand(run, handId));
    const r = rollInt(run.rng, options.length);
    return pickGift({ ...run, rng: r.rng }, handId, options[r.value], { fatedRoll: true });
}

/** Stay: carries the hand forward to resolve later. */
export function stayHand(run: RunState, handId: number): Result<RunState> {
    const hand = run.pendingHands.find((h) => h.id === handId);
    if (!hand) return fail("no-hand");
    if (!hand.stay) return fail("no-stay");
    return ok({
        ...run,
        pendingHands: run.pendingHands.filter((h) => h.id !== handId),
        stayedHands: [...run.stayedHands, { ...hand, stay: false }],
    });
}

function spendFeather(run: RunState): Result<RunState> {
    if (run.feathers <= 0) return fail("no-feather");
    return ok({ ...run, feathers: run.feathers - 1 });
}

/** Feather: ban a Gift for the rest of the run and strip it from open hands. */
export function banGift(run: RunState, giftId: string): Result<RunState> {
    if (!GIFTS[giftId]) return fail("unknown-gift");
    if (run.bannedGifts.includes(giftId)) return fail("already-banned");
    const paid = spendFeather(run);
    if (!paid.ok) return paid;
    const strip = (h: GiftHand) => ({ ...h, cards: h.cards.filter((c) => c !== giftId) });
    return ok({
        ...paid.value,
        bannedGifts: [...run.bannedGifts, giftId],
        pendingHands: paid.value.pendingHands.map(strip),
        stayedHands: paid.value.stayedHands.map(strip),
        keptCards: paid.value.keptCards.filter((c) => c !== giftId),
    });
}

/** Feather: the next hand will contain this Gift, if it can still be taken then. */
export function guaranteeGift(run: RunState, giftId: string): Result<RunState> {
    const def = GIFTS[giftId];
    if (!def || !DRAWABLE_CATEGORIES.includes(def.category)) return fail("not-drawable");
    if (run.guaranteedGift) return fail("already-guaranteed");
    const paid = spendFeather(run);
    if (!paid.ok) return paid;
    return ok({ ...paid.value, guaranteedGift: giftId });
}

/** Feather: move a card out of an open hand into the next hand. */
export function keepCard(run: RunState, handId: number, giftId: string): Result<RunState> {
    const hand = run.pendingHands.find((h) => h.id === handId);
    if (!hand) return fail("no-hand");
    if (!hand.cards.includes(giftId)) return fail("not-in-hand");
    const paid = spendFeather(run);
    if (!paid.ok) return paid;
    return ok({
        ...paid.value,
        pendingHands: paid.value.pendingHands.map((h) => (h.id === handId ? { ...h, cards: h.cards.filter((c) => c !== giftId) } : h)),
        keptCards: [...paid.value.keptCards, giftId],
    });
}
