import { describe, expect, it } from "vitest";
import { createRun } from "../app.js";
import { CARD_DEFS } from "../content/index.js";
import { endTurn, playCard } from "../core/combat.js";
import { enterLocation } from "../core/court.js";
import { emptyMeta, freshRun, META_KEY } from "../core/state.js";
import type { CardInstance, RunState } from "../core/types.js";
import { loadMeta, saveMeta } from "./storage.js";

function heavenDamage(card: CardInstance): number {
    const effect = CARD_DEFS[card.cardId].heaven[0];
    if (!effect || effect.kind !== "damage") return 0;
    const clean = card.cleanWick ? 1 : 0;
    return effect.amount + card.heavenBonus + card.combatBonus + clean;
}

function heavenStep(run: RunState): RunState {
    const playable = run.hand.filter((card) => CARD_DEFS[card.cardId].cost <= run.lamp);
    const spark = run.enemies.find((enemy) => enemy.id === "spark" && enemy.hp > 0);
    const shade = run.enemies.find((enemy) => enemy.id === "shade" && enemy.hp > 0);
    const damage = playable.filter((card) => heavenDamage(card) > 0);

    if (spark) {
        const killer = damage.find((card) => heavenDamage(card) >= spark.hp) ?? damage[0];
        if (killer) {
            const effect = CARD_DEFS[killer.cardId].heaven[0];
            const targetId = effect && effect.kind === "damage" && effect.target === "one" ? "spark" : undefined;
            return playCard(run, killer.instanceId, "heaven", targetId);
        }
    }

    if (shade && damage.length > 0) {
        const ranked = damage.slice().sort((a, b) => heavenDamage(b) - heavenDamage(a));
        const chosen = ranked[0];
        const effect = CARD_DEFS[chosen.cardId].heaven[0];
        const targetId = effect && effect.kind === "damage" && effect.target === "one" ? "shade" : undefined;
        return playCard(run, chosen.instanceId, "heaven", targetId);
    }

    const aegis = playable.find((card) => card.cardId === "aegis");
    if (shade && aegis && run.guard < 5) return playCard(run, aegis.instanceId, "heaven");

    const steady = playable.find((card) => card.cardId === "steady");
    if (steady) {
        const locked = run.hand.find((card) => {
            const cost = CARD_DEFS[card.cardId].cost;
            return card.cardId !== "steady" && cost > run.lamp && cost <= run.lamp + 1 && heavenDamage(card) > 0;
        });
        if (locked) return playCard(run, steady.instanceId, "heaven");
    }

    return endTurn(run);
}

function heavenDescent(seed: number): RunState {
    let run = freshRun(emptyMeta(), seed);
    run = enterLocation(run, "court");
    run = enterLocation(run, "glade");
    for (let step = 0; step < 80 && run.phase === "combat"; step += 1) {
        run = heavenStep(run);
    }
    return run;
}

describe("heaven or hell slice", () => {
    it("a seeded heaven-only fight kills Spark and Shade at crack 0 and ash 0", () => {
        const run = heavenDescent(1);
        expect(run.phase).toBe("result");
        expect(run.result).toBe("heaven");
        expect(run.ash).toBe(0);
        expect(run.crack).toBe(0);
        expect(run.hp).toBeGreaterThan(0);
        expect(run.enemies.map((enemy) => enemy.hp)).toEqual([0, 0]);
    });

    it("gives the next run 1 ash when Soot Wick is equipped and freshRun leaves ash at 0", () => {
        const meta = {
            codex: [],
            unlockedPassives: ["soot-wick" as const],
            equippedPassive: "soot-wick" as const,
        };
        expect(freshRun(meta, 4).ash).toBe(0);
        expect(createRun(meta, 4).ash).toBe(1);
        expect(createRun(emptyMeta(), 4).ash).toBe(0);
    });

    it("falls back to an empty meta when the stored JSON is corrupt", () => {
        const memory = new Map<string, string>();
        const storage = {
            getItem: (key: string) => (memory.has(key) ? memory.get(key)! : null),
            setItem: (key: string, value: string) => {
                memory.set(key, value);
            },
            removeItem: (key: string) => {
                memory.delete(key);
            },
            clear: () => memory.clear(),
            key: () => null,
            get length() {
                return memory.size;
            },
        };
        (globalThis as { localStorage?: Storage }).localStorage = storage as Storage;

        storage.setItem(META_KEY, "{");
        expect(loadMeta()).toEqual(emptyMeta());

        storage.setItem(META_KEY, JSON.stringify(["nope"]));
        expect(loadMeta()).toEqual(emptyMeta());

        saveMeta({
            codex: ["glade", "nope" as "glade"],
            unlockedPassives: ["clean-wick"],
            equippedPassive: "clean-wick",
        });
        expect(loadMeta()).toEqual({
            codex: ["glade"],
            unlockedPassives: ["clean-wick"],
            equippedPassive: "clean-wick",
        });
    });
});
