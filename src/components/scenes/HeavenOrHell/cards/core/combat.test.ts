import { describe, expect, it } from "vitest";
import type { CardInstance, EnemyState, RunState } from "./types.js";
import { drawCards, endTurn, enemyHit, playCard, resolveEnemyPhase, startPlayerTurn } from "./combat.js";
import { crackDamage, enterLocation } from "./court.js";
import { nextRng } from "./rng.js";

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

function spark(extras: Partial<EnemyState> = {}): EnemyState {
    return { id: "spark", name: "Spark", hp: 8, maxHp: 8, intent: 4, intentName: "Bite", ...extras };
}

function shade(extras: Partial<EnemyState> = {}): EnemyState {
    return { id: "shade", name: "Shade", hp: 24, maxHp: 24, intent: 7, intentName: "Strike", ...extras };
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
        phase: "combat",
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

describe("rng", () => {
    it("matches mulberry32 and stays inside 0..1", () => {
        const expected: number[] = [];
        let a = 123456;
        for (let i = 0; i < 5; i++) {
            let t = (a += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            expected.push(((t ^ (t >>> 14)) >>> 0) / 4294967296);
        }

        let state = 123456;
        for (const value of expected) {
            const rolled = nextRng(state);
            expect(rolled.value).toBe(value);
            expect(rolled.value).toBeGreaterThanOrEqual(0);
            expect(rolled.value).toBeLessThan(1);
            state = rolled.next;
        }
        expect(nextRng(1)).toEqual(nextRng(1));
    });
});

describe("playCard", () => {
    it("heaven wick deals 5, spends 1 lamp, and leaves ash unchanged", () => {
        const before = makeRun({ hand: [card("w1", "wick")], enemies: [spark()] });
        const after = playCard(before, "w1", "heaven", "spark");

        expect(after.lamp).toBe(2);
        expect(after.ash).toBe(0);
        expect(after.enemies[0].hp).toBe(3);
        expect(after.hand).toEqual([]);
        expect(after.discard.map((c) => c.instanceId)).toEqual(["w1"]);
        expect(after.phase).toBe("combat");
        expect(before.lamp).toBe(3);
        expect(before.enemies[0].hp).toBe(8);
    });

    it("hell wick deals 8, raises ash to 1, and Shade's 7 becomes 8 before guard", () => {
        const after = playCard(makeRun({ hand: [card("w1", "wick")], enemies: [shade()] }), "w1", "hell", "shade");

        expect(after.enemies[0].hp).toBe(16);
        expect(after.ash).toBe(1);
        expect(after.guard).toBe(0);
        expect(enemyHit(after, 7)).toBe(8);
        expect(after.enemies[0].intent).toBe(7);
    });

    it("one hell wick kills Spark and a second card still hits Shade", () => {
        let run = makeRun({
            hand: [card("w1", "wick"), card("w2", "wick")],
            enemies: [spark(), shade()],
        });
        run = playCard(run, "w1", "hell", "spark");

        expect(run.enemies.find((enemy) => enemy.id === "spark")?.hp).toBe(0);
        expect(run.phase).toBe("combat");
        expect(run.ash).toBe(1);
        expect(run.hp).toBe(32);

        run = playCard(run, "w2", "heaven", "shade");
        expect(run.enemies.find((enemy) => enemy.id === "shade")?.hp).toBe(19);
        expect(run.lamp).toBe(1);
        expect(run.phase).toBe("combat");
    });

    it("killing the fight sets heaven at ash 1 and hell at ash 2 without an enemy phase", () => {
        const heaven = playCard(makeRun({ hand: [card("w1", "wick")], enemies: [spark()] }), "w1", "hell", "spark");
        expect(heaven.phase).toBe("result");
        expect(heaven.result).toBe("heaven");
        expect(heaven.ash).toBe(1);
        expect(heaven.hp).toBe(32);

        let hell = makeRun({
            hand: [card("w1", "wick"), card("w2", "wick")],
            enemies: [spark(), shade({ hp: 8 })],
        });
        hell = playCard(hell, "w1", "hell", "spark");
        hell = playCard(hell, "w2", "hell", "shade");
        expect(hell.phase).toBe("result");
        expect(hell.result).toBe("hell");
        expect(hell.ash).toBe(2);
        expect(hell.hp).toBe(32);
    });

    it("refuses a card the lamp cannot pay", () => {
        const run = makeRun({ lamp: 0, hand: [card("w1", "wick")], enemies: [spark()] });
        const after = playCard(run, "w1", "hell", "spark");
        expect(after.lamp).toBe(0);
        expect(after.ash).toBe(0);
        expect(after.hand).toHaveLength(1);
        expect(after.enemies[0].hp).toBe(8);
        expect(after.log).toContain("Not enough Lamp.");
    });

    it("adds heaven bonuses and clean wick, and replaces guard", () => {
        const blessed = playCard(
            makeRun({
                hand: [card("w1", "wick", { heavenBonus: 2, cleanWick: true, combatBonus: 1 })],
                enemies: [shade()],
            }),
            "w1",
            "heaven",
            "shade",
        );
        expect(blessed.enemies[0].hp).toBe(24 - 9);
        expect(blessed.ash).toBe(0);

        let guarded = makeRun({
            hand: [card("a1", "aegis"), card("a2", "aegis")],
            lamp: 2,
            enemies: [shade()],
        });
        guarded = playCard(guarded, "a1", "heaven");
        expect(guarded.guard).toBe(5);
        guarded = playCard(guarded, "a2", "heaven");
        expect(guarded.guard).toBe(5);
    });

    it("buffs another card in hand and then that card hits harder", () => {
        let run = makeRun({
            hand: [card("h", "hinge"), card("w1", "wick")],
            enemies: [shade()],
            lamp: 3,
        });
        run = playCard(run, "h", "heaven", "w1");
        expect(run.hand.find((c) => c.instanceId === "w1")?.combatBonus).toBe(2);
        run = playCard(run, "w1", "heaven", "shade");
        expect(run.enemies[0].hp).toBe(24 - 7);

        const missed = playCard(makeRun({ hand: [card("h", "hinge")], enemies: [shade()] }), "h", "hell");
        expect(missed.log).toContain("No card to buff.");
        expect(missed.ash).toBe(1);
        expect(missed.hand).toEqual([]);
    });
});

describe("enemy phase", () => {
    it("incoming damage is intent + ash + 2*crack - guard", () => {
        const run = makeRun({ ash: 2, crack: 2, guard: 5 });
        expect(enemyHit(run, 7)).toBe(8);
        expect(crackDamage(run)).toBe(4);
    });

    it("subtracts the same guard from each living strike, then clears it", () => {
        const run = makeRun({
            hp: 32,
            ash: 2,
            crack: 2,
            guard: 5,
            enemies: [spark(), shade()],
        });
        const after = resolveEnemyPhase(run);
        expect(after.hp).toBe(19);
        expect(after.guard).toBe(0);
        expect(after.enemies[0].intent).toBe(4);
        expect(after.enemies[1].intent).toBe(7);
    });

    it("skips dead enemies", () => {
        const after = resolveEnemyPhase(makeRun({ hp: 32, enemies: [spark({ hp: 0 }), shade()] }));
        expect(after.hp).toBe(25);
    });
});

describe("turns", () => {
    it("endTurn fades unspent lamp and refills to lampMax, not lampMax plus leftover", () => {
        const after = endTurn(
            makeRun({
                lamp: 3,
                lampMax: 3,
                phase: "combat",
                hand: [],
                hp: 32,
                enemies: [spark()],
            }),
        );
        expect(after.lamp).toBe(3);
        expect(after.hp).toBe(28);
        expect(after.turn).toBe(2);
        expect(after.guard).toBe(0);

        const partial = endTurn(makeRun({ lamp: 1, lampMax: 3, phase: "room", hand: [], enemies: [] }));
        expect(partial.lamp).toBe(3);
    });

    it("endTurn on a lethal enemy phase is death and does not refill lamp", () => {
        const after = endTurn(
            makeRun({
                hp: 5,
                lamp: 3,
                phase: "combat",
                enemies: [shade()],
                hand: [card("w1", "wick")],
            }),
        );
        expect(after.hp).toBe(0);
        expect(after.phase).toBe("result");
        expect(after.result).toBe("dead");
        expect(after.lamp).toBe(0);
        expect(after.hand.map((c) => c.instanceId)).toEqual(["w1"]);
    });

    it("startPlayerTurn refills lamp and draws 3 only when the hand is empty", () => {
        const drawn = startPlayerTurn(
            makeRun({
                lamp: 0,
                hand: [],
                drawPile: [card("a", "wick"), card("b", "wick"), card("c", "gleam"), card("d", "steady")],
            }),
        );
        expect(drawn.lamp).toBe(3);
        expect(drawn.hand.map((c) => c.instanceId)).toEqual(["a", "b", "c"]);

        const kept = startPlayerTurn(makeRun({ lamp: 0, hand: [card("w1", "wick")], drawPile: [card("b", "gleam")] }));
        expect(kept.hand.map((c) => c.instanceId)).toEqual(["w1"]);
        expect(kept.lamp).toBe(3);
    });

    it("drawCards shuffles the discard into a new draw pile", () => {
        const after = drawCards(
            makeRun({
                hand: [],
                drawPile: [],
                discard: [card("a", "wick"), card("b", "gleam"), card("c", "aegis")],
                rngState: 7,
            }),
            2,
        );
        expect(after.hand).toHaveLength(2);
        expect(after.discard).toEqual([]);
        expect(after.drawPile).toHaveLength(1);
        const ids = [...after.hand, ...after.drawPile].map((c) => c.instanceId).sort();
        expect(ids).toEqual(["a", "b", "c"]);
    });
});

describe("court", () => {
    it("first alcove and stall each add one crack, and a return visit does not", () => {
        let run = makeRun({ location: "court", phase: "court", crack: 0, crackedDoors: [], visited: [] });
        run = enterLocation(run, "alcove");
        expect(run.crack).toBe(1);
        expect(run.crackedDoors).toEqual(["alcove"]);
        expect(run.location).toBe("alcove");
        expect(run.phase).toBe("room");
        expect(run.visited).toEqual(["alcove"]);

        run = enterLocation(run, "stall");
        expect(run.crack).toBe(2);
        expect(run.crackedDoors).toEqual(["alcove", "stall"]);

        run = enterLocation(run, "alcove");
        expect(run.crack).toBe(2);
        expect(run.crackedDoors).toEqual(["alcove", "stall"]);
        expect(run.visited).toEqual(["alcove", "stall"]);

        const chapel = enterLocation(makeRun({ crack: 0, phase: "court", location: "court" }), "chapel");
        expect(chapel.crack).toBe(0);
        expect(chapel.phase).toBe("room");
        expect(crackDamage(chapel)).toBe(0);
    });

    it("entering the gate does not leave the court", () => {
        const run = makeRun({
            location: "court",
            phase: "court",
            visited: ["court"],
            crack: 1,
            crackedDoors: ["alcove"],
            log: ["The hearth is warm."],
        });
        const after = enterLocation(run, "gate");
        expect(after.location).toBe("court");
        expect(after.phase).toBe("court");
        expect(after.visited).toEqual(["court"]);
        expect(after.crack).toBe(1);
        expect(after.crackedDoors).toEqual(["alcove"]);
        expect(after.log[after.log.length - 1]).toBe("The next court is still sealed.");
    });

    it("entering the court keeps the court phase", () => {
        const after = enterLocation(makeRun({ location: "hearth", phase: "room" }), "court");
        expect(after.location).toBe("court");
        expect(after.phase).toBe("court");
        expect(after.crack).toBe(0);
    });

    it("entering the glade deals Spark and Shade, draws 3, and fills the lamp", () => {
        const after = enterLocation(
            makeRun({
                phase: "court",
                location: "court",
                lamp: 0,
                turn: 0,
                guard: 4,
                enemies: [],
                hand: [],
                drawPile: [card("a", "wick"), card("b", "wick"), card("c", "gleam"), card("d", "aegis"), card("e", "steady")],
            }),
            "glade",
        );
        expect(after.phase).toBe("combat");
        expect(after.location).toBe("glade");
        expect(after.enemies.map((enemy) => [enemy.id, enemy.hp, enemy.intent])).toEqual([
            ["spark", 8, 4],
            ["shade", 24, 7],
        ]);
        expect(after.hand).toHaveLength(3);
        expect(after.drawPile).toHaveLength(2);
        expect(after.lamp).toBe(3);
        expect(after.turn).toBe(1);
        expect(after.guard).toBe(0);
        expect(after.crack).toBe(0);
        expect(after.visited).toEqual(["glade"]);

        const again = enterLocation(after, "glade");
        expect(again.enemies).toHaveLength(2);
        expect(again.crack).toBe(0);
    });
});
