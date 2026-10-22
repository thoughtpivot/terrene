import { describe, expect, it } from "vitest";
import type { CardInstance, MetaState, RunState, ShopOffer } from "./types.js";
import { SHOP_POOL } from "../content/index.js";
import { playCard } from "./combat.js";
import {
    applyAltar,
    buyOffer,
    finishRun,
    rollShop,
    startingAsh,
    takeAlcove,
    takeHearthObol,
    takeUrn,
    wickModifiers,
} from "./rewards.js";

function card(instanceId: string, cardId: CardInstance["cardId"], extras: Partial<CardInstance> = {}): CardInstance {
    return {
        instanceId,
        cardId,
        heavenBonus: 0,
        hellBonus: 0,
        combatBonus: 0,
        cleanWick: false,
        ...extras,
    };
}

function makeRun(overrides: Partial<RunState> = {}): RunState {
    return {
        hp: 32,
        maxHp: 32,
        lamp: 3,
        lampMax: 3,
        ash: 0,
        crack: 0,
        obols: 0,
        drawPile: [],
        hand: [],
        discard: [],
        altarUsed: false,
        guard: 0,
        enemies: [],
        location: "court",
        visited: [],
        crackedDoors: [],
        phase: "room",
        result: "none",
        turn: 1,
        shop: null,
        shopBought: [],
        alcoveTaken: false,
        hearthObolTaken: false,
        urnTaken: false,
        seed: 1,
        rngState: 1,
        log: [],
        ...overrides,
    };
}

function meta(overrides: Partial<MetaState> = {}): MetaState {
    return {
        codex: [],
        unlockedPassives: [],
        equippedPassive: null,
        ...overrides,
    };
}

describe("altar", () => {
    it("does nothing to Steady and gives Wick +2 heaven once", () => {
        const steady = applyAltar(makeRun({ hand: [card("s", "steady")] }), "s");
        expect(steady.altarUsed).toBe(false);
        expect(steady.hand[0].heavenBonus).toBe(0);

        const hinge = applyAltar(makeRun({ hand: [card("h", "hinge")] }), "h");
        expect(hinge.altarUsed).toBe(false);
        expect(hinge.hand[0].heavenBonus).toBe(0);

        let blessed = applyAltar(makeRun({ discard: [card("w1", "wick")] }), "w1");
        expect(blessed.altarUsed).toBe(true);
        expect(blessed.discard[0].heavenBonus).toBe(2);
        expect(blessed.discard[0].cleanWick).toBe(false);

        blessed = applyAltar(blessed, "w1");
        expect(blessed.discard[0].heavenBonus).toBe(2);

        const fought = playCard(
            {
                ...blessed,
                phase: "combat",
                lamp: 3,
                hand: blessed.discard,
                discard: [],
                enemies: [{ id: "shade", name: "Shade", hp: 24, maxHp: 24, intent: 7, intentName: "Strike" }],
            },
            "w1",
            "heaven",
            "shade",
        );
        expect(fought.enemies[0].hp).toBe(17);
        expect(fought.ash).toBe(0);
    });
});

describe("shop and gifts", () => {
    it("buyOffer spends 1 obol and only adds a card", () => {
        const offer: ShopOffer = { offerId: "cinder-0", cardId: "cinder", price: 1 };
        const kept = card("w1", "wick");
        const drawn = card("g", "gleam");
        const run = makeRun({
            obols: 1,
            hand: [kept],
            drawPile: [drawn],
            discard: [card("a", "aegis")],
            shop: [offer],
        });
        const after = buyOffer(run, "cinder-0");

        expect(after.obols).toBe(0);
        expect(after.hand).toEqual([kept]);
        expect(after.drawPile).toEqual([drawn]);
        expect(after.discard.map((c) => c.cardId)).toEqual(["aegis", "cinder"]);
        expect(after.discard[1]).toMatchObject({
            heavenBonus: 0,
            hellBonus: 0,
            combatBonus: 0,
            cleanWick: false,
        });
        expect(after.shop).toEqual([]);
        expect(after.shopBought).toEqual(["cinder-0"]);
        expect(run.hand).toEqual([kept]);
        expect(run.discard).toHaveLength(1);
    });

    it("buyOffer ignores a missing offer and a price above the purse", () => {
        const offer: ShopOffer = { offerId: "salve-1", cardId: "salve", price: 1 };
        const broke = makeRun({ obols: 0, shop: [offer], hand: [card("w1", "wick")] });
        expect(buyOffer(broke, "salve-1")).toBe(broke);
        expect(buyOffer(broke, "missing")).toBe(broke);
        expect(buyOffer(makeRun({ obols: 3, shop: null }), "salve-1").shop).toBeNull();
    });

    it("rolls three distinct shop goods at 1 obol", () => {
        const poolBefore = SHOP_POOL.slice();
        const first = rollShop(99);
        const second = rollShop(99);
        expect(first).toEqual(second);
        expect(first.offers).toHaveLength(3);
        expect(new Set(first.offers.map((offer) => offer.cardId)).size).toBe(3);
        first.offers.forEach((offer, i) => {
            expect(offer.price).toBe(1);
            expect(offer.offerId).toBe(`${offer.cardId}-${i}`);
            expect(SHOP_POOL).toContain(offer.cardId);
        });
        expect(SHOP_POOL).toEqual(poolBefore);
        expect(first.rngState).not.toBe(99);
    });

    it("hearth, urn, and alcove each pay out once", () => {
        const hearth = takeHearthObol(takeHearthObol(makeRun({ obols: 0 })));
        expect(hearth.obols).toBe(1);
        expect(hearth.hearthObolTaken).toBe(true);

        const urn = takeUrn(takeUrn(makeRun({ obols: 2 })));
        expect(urn.obols).toBe(3);
        expect(urn.urnTaken).toBe(true);

        const alcove = takeAlcove(takeAlcove(makeRun({ rngState: 3, discard: [card("w1", "wick")] })));
        expect(alcove.alcoveTaken).toBe(true);
        expect(alcove.discard).toHaveLength(2);
        expect(alcove.discard[0].instanceId).toBe("w1");
        expect(SHOP_POOL).toContain(alcove.discard[1].cardId);
        expect(alcove.rngState).not.toBe(3);
    });
});

describe("finishRun", () => {
    it("heaven unlocks clean-wick, hell unlocks soot-wick, and death only writes the codex", () => {
        const heaven = finishRun(meta(), makeRun({ result: "heaven", visited: ["glade"] }));
        expect(heaven.unlockedPassives).toEqual(["clean-wick"]);
        expect(heaven.codex).toEqual(["glade"]);

        const hell = finishRun(meta(), makeRun({ result: "hell", visited: ["glade", "stall"] }));
        expect(hell.unlockedPassives).toEqual(["soot-wick"]);
        expect(hell.codex).toEqual(["glade", "stall"]);

        const dead = finishRun(meta(), makeRun({ result: "dead", visited: ["stall"] }));
        expect(dead.unlockedPassives).toEqual([]);
        expect(dead.codex).toEqual(["stall"]);

        const again = finishRun(
            { codex: ["stall"], unlockedPassives: ["clean-wick"], equippedPassive: null },
            makeRun({ result: "heaven", visited: ["stall", "chapel"] }),
        );
        expect(again.unlockedPassives).toEqual(["clean-wick"]);
        expect(again.codex).toEqual(["stall", "chapel"]);
    });

    it("reports wick modifiers and starting ash from the equipped passive", () => {
        expect(wickModifiers(meta({ equippedPassive: "clean-wick" }))).toEqual({
            heavenBonus: 1,
            hellBonus: 0,
            startingAsh: 0,
        });
        expect(wickModifiers(meta({ equippedPassive: "soot-wick" }))).toEqual({
            heavenBonus: 0,
            hellBonus: 1,
            startingAsh: 1,
        });
        expect(wickModifiers(meta())).toEqual({ heavenBonus: 0, hellBonus: 0, startingAsh: 0 });
        expect(startingAsh(meta({ equippedPassive: "soot-wick" }))).toBe(1);
        expect(startingAsh(meta({ equippedPassive: "clean-wick" }))).toBe(0);
        expect(startingAsh(meta())).toBe(0);
    });
});
