import type { CardId, CardInstance, MetaState, RunState, ShopOffer } from "./types.js";
import { CARD_DEFS, SHOP_POOL } from "../content/index.js";
import { nextRng, shuffleWithRng } from "./rng.js";

/** Slice-1 altar: Wick, Gleam, and Aegis. Steady, Cinder, Salve, and Hinge are not. */
const ALTAR_LEGAL = new Set<CardId>(["wick", "gleam", "aegis"]);

export function applyAltar(run: RunState, instanceId: string): RunState {
    if (run.altarUsed) return run;

    const piles = ["hand", "drawPile", "discard"] as const;
    let foundPile: (typeof piles)[number] | null = null;
    let found: CardInstance | undefined;
    for (const pile of piles) {
        found = run[pile].find((card) => card.instanceId === instanceId);
        if (found) {
            foundPile = pile;
            break;
        }
    }
    if (!found || !foundPile) return run;
    if (!isAltarLegal(found.cardId)) return run;

    const updated: CardInstance = { ...found, heavenBonus: found.heavenBonus + 2 };
    return {
        ...run,
        altarUsed: true,
        [foundPile]: run[foundPile].map((card) => (card.instanceId === instanceId ? updated : card)),
    };
}

export function buyOffer(run: RunState, offerId: string): RunState {
    const shop = run.shop;
    if (!shop) return run;
    const offer = shop.find((candidate) => candidate.offerId === offerId);
    if (!offer || offer.price > run.obols) return run;

    const gained: CardInstance = {
        instanceId: `bought-${offer.offerId}`,
        cardId: offer.cardId,
        heavenBonus: 0,
        hellBonus: 0,
        combatBonus: 0,
        cleanWick: false,
    };
    return {
        ...run,
        obols: run.obols - offer.price,
        discard: [...run.discard, gained],
        shopBought: [...run.shopBought, offerId],
        shop: shop.filter((candidate) => candidate.offerId !== offerId),
    };
}

export function takeHearthObol(run: RunState): RunState {
    if (run.hearthObolTaken) return run;
    return { ...run, hearthObolTaken: true, obols: run.obols + 1 };
}

export function takeUrn(run: RunState): RunState {
    if (run.urnTaken) return run;
    return { ...run, urnTaken: true, obols: run.obols + 1 };
}

export function takeAlcove(run: RunState): RunState {
    if (run.alcoveTaken) return run;
    const rolled = nextRng(run.rngState);
    const cardId = SHOP_POOL[Math.floor(rolled.value * SHOP_POOL.length)];
    const gained: CardInstance = {
        instanceId: `alcove-${cardId}`,
        cardId,
        heavenBonus: 0,
        hellBonus: 0,
        combatBonus: 0,
        cleanWick: false,
    };
    return {
        ...run,
        alcoveTaken: true,
        rngState: rolled.next,
        discard: [...run.discard, gained],
    };
}

export function finishRun(meta: MetaState, run: RunState): MetaState {
    const unlockedPassives = meta.unlockedPassives.slice();
    if (run.result === "heaven" && !unlockedPassives.includes("clean-wick")) {
        unlockedPassives.push("clean-wick");
    }
    if (run.result === "hell" && !unlockedPassives.includes("soot-wick")) {
        unlockedPassives.push("soot-wick");
    }
    const codex = meta.codex.slice();
    for (const location of run.visited) {
        if (!codex.includes(location)) codex.push(location);
    }
    return { ...meta, unlockedPassives, codex };
}

export function rollShop(rngState: number): { offers: ShopOffer[]; rngState: number } {
    const shuffled = shuffleWithRng(SHOP_POOL, rngState);
    const offers = shuffled.items.slice(0, 3).map((cardId, i) => ({
        offerId: `${cardId}-${i}`,
        cardId,
        price: 1,
    }));
    return { offers, rngState: shuffled.rngState };
}

export function wickModifiers(meta: MetaState): { heavenBonus: number; hellBonus: number; startingAsh: number } {
    if (meta.equippedPassive === "clean-wick") {
        return { heavenBonus: 1, hellBonus: 0, startingAsh: 0 };
    }
    if (meta.equippedPassive === "soot-wick") {
        return { heavenBonus: 0, hellBonus: 1, startingAsh: 1 };
    }
    return { heavenBonus: 0, hellBonus: 0, startingAsh: 0 };
}

export function startingAsh(meta: MetaState): number {
    return meta.equippedPassive === "soot-wick" ? 1 : 0;
}

function isAltarLegal(cardId: CardId): boolean {
    const def = CARD_DEFS[cardId];
    if (def && typeof def.altarLegal === "boolean") return def.altarLegal;
    return ALTAR_LEGAL.has(cardId);
}
