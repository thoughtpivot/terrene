import type { LocationId, RunState } from "./types.js";
import { makeEnemy } from "../content/index.js";
import { drawCards } from "./combat.js";

export function crackDamage(run: RunState): number {
    return 2 * run.crack;
}

export function enterLocation(run: RunState, location: LocationId): RunState {
    if (location === "gate") {
        return {
            ...run,
            log: [...run.log, "The next court is still sealed."],
        };
    }

    const opensCrack = (location === "alcove" || location === "stall") && !run.crackedDoors.includes(location);
    let next: RunState = {
        ...run,
        location,
        phase: location === "court" ? "court" : location === "glade" ? "combat" : "room",
        visited: run.visited.includes(location) ? run.visited : [...run.visited, location],
        crackedDoors: opensCrack ? [...run.crackedDoors, location] : run.crackedDoors,
        crack: opensCrack ? run.crack + 1 : run.crack,
    };

    if (location !== "glade") return next;

    if (next.enemies.length === 0) {
        next = { ...next, enemies: [makeEnemy("spark"), makeEnemy("shade")] };
    }
    next = drawCards(next, 3);
    return {
        ...next,
        lamp: next.lampMax,
        turn: 1,
        guard: 0,
    };
}
