import { describe, expect, it } from "vitest";
import { createCoreDeck } from "../content/index.js";
import { emptyMeta, freshRun } from "./state.js";

describe("freshRun", () => {
    it("starts in the hearth with lamp 3, health 32, and the core deck", () => {
        const meta = emptyMeta();
        const run = freshRun(meta, 7);
        expect(run.phase).toBe("room");
        expect(run.location).toBe("hearth");
        expect(run.visited).toEqual(["hearth"]);
        expect(run.hp).toBe(32);
        expect(run.maxHp).toBe(32);
        expect(run.lamp).toBe(3);
        expect(run.lampMax).toBe(3);
        expect(run.ash).toBe(0);
        expect(run.hand).toEqual([]);
        expect(run.discard).toEqual([]);
        expect(run.drawPile).toEqual(createCoreDeck(meta));
        expect(run.drawPile.map((card) => card.cardId)).toEqual(["wick", "wick", "gleam", "aegis", "steady"]);
        expect(run.seed).toBe(7);
        expect(run.rngState).toBe(7);
    });
});
