import type { CardDef, CardId, CardInstance, MetaState } from "../core/types.js";

export const CARD_DEFS: Record<CardId, CardDef> = {
    wick: {
        id: "wick",
        name: "Wick",
        cost: 1,
        altarLegal: true,
        heaven: [{ kind: "damage", amount: 5, target: "one" }],
        hell: [{ kind: "damage", amount: 8, target: "one" }],
    },
    gleam: {
        id: "gleam",
        name: "Gleam",
        cost: 2,
        altarLegal: true,
        heaven: [{ kind: "damage", amount: 9, target: "one" }],
        hell: [{ kind: "damage", amount: 14, target: "one" }],
    },
    aegis: {
        id: "aegis",
        name: "Aegis",
        cost: 1,
        altarLegal: true,
        heaven: [{ kind: "guard", amount: 5 }],
        hell: [{ kind: "guard", amount: 8 }],
    },
    steady: {
        id: "steady",
        name: "Steady",
        cost: 0,
        altarLegal: false,
        heaven: [{ kind: "lamp", amount: 1 }],
        hell: [{ kind: "lamp", amount: 2 }],
    },
    cinder: {
        id: "cinder",
        name: "Cinder",
        cost: 1,
        altarLegal: false,
        heaven: [{ kind: "damage", amount: 4, target: "all" }],
        hell: [{ kind: "damage", amount: 7, target: "all" }],
    },
    salve: {
        id: "salve",
        name: "Salve",
        cost: 1,
        altarLegal: false,
        heaven: [{ kind: "heal", amount: 5 }],
        hell: [{ kind: "heal", amount: 9 }],
    },
    hinge: {
        id: "hinge",
        name: "Hinge",
        cost: 1,
        altarLegal: false,
        heaven: [{ kind: "buff-hand", amount: 2 }],
        hell: [{ kind: "buff-hand", amount: 4 }],
    },
};

export function makeCard(cardId: CardId, instanceId: string): CardInstance {
    return {
        instanceId,
        cardId,
        heavenBonus: 0,
        hellBonus: 0,
        combatBonus: 0,
        cleanWick: false,
    };
}

export function createCoreDeck(meta: MetaState): CardInstance[] {
    const wickA = makeCard("wick", "wick-a");
    const wickB = makeCard("wick", "wick-b");

    if (meta.equippedPassive === "clean-wick") {
        wickA.cleanWick = true;
        wickA.heavenBonus = 0;
    }

    if (meta.equippedPassive === "soot-wick") {
        wickA.hellBonus = 1;
        wickB.hellBonus = 1;
    }

    return [wickA, wickB, makeCard("gleam", "gleam"), makeCard("aegis", "aegis"), makeCard("steady", "steady")];
}
