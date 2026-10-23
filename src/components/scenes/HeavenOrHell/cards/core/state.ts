import type { MetaState, RunState } from "./types.js";
import { createCoreDeck } from "../content/index.js";

export const META_KEY = "heaven-or-hell-meta";

export function emptyMeta(): MetaState {
    return {
        codex: [],
        unlockedPassives: [],
        equippedPassive: null,
    };
}

export function freshRun(meta: MetaState, seed: number): RunState {
    return {
        hp: 32,
        maxHp: 32,
        lamp: 3,
        lampMax: 3,
        ash: 0,
        crack: 0,
        obols: 0,
        drawPile: createCoreDeck(meta),
        hand: [],
        discard: [],
        altarUsed: false,
        guard: 0,
        enemies: [],
        location: "hearth",
        visited: ["hearth"],
        crackedDoors: [],
        phase: "room",
        result: "none",
        turn: 0,
        shop: null,
        shopBought: [],
        alcoveTaken: false,
        hearthObolTaken: false,
        urnTaken: false,
        seed,
        rngState: seed,
        log: [],
    };
}
