import { createCombat, step } from "../src/components/scenes/HeavenOrHell/combat/index.ts";
import type {
    CombatEvent,
    CombatInputs,
    CombatSetup,
    CombatState,
    ReactionKind,
    ReadTraits,
} from "../src/components/scenes/HeavenOrHell/combat/index.ts";

type Press = keyof NonNullable<CombatInputs["pressed"]>;
type EventOf<T extends CombatEvent["type"]> = Extract<CombatEvent, { type: T }>;

/** Never commits, so swings land on it untouched. */
export const DUMMY: ReadTraits = {
    id: "dummy",
    commitChance: 0,
    readAtFraction: 0.5,
    reactionWeights: { parry: 0, block: 0, roll: 0, counter: 0 },
    adaptive: false,
    learnPerRepeat: 0,
    familiarityFloor: 1,
    forgetPerSec: 0,
};

/** Always commits to one reaction, early in the wind-up. */
export function always(kind: ReactionKind, readAtFraction = 0.2): ReadTraits {
    return {
        ...DUMMY,
        id: `always_${kind}`,
        commitChance: 1,
        readAtFraction,
        reactionWeights: { parry: 0, block: 0, roll: 0, counter: 0, [kind]: 1 },
    };
}

/** Steps a combat one frame at a time and keeps every event, for tests. */
export class Duel {
    state: CombatState;
    events: CombatEvent[] = [];
    held: CombatInputs = {};

    constructor(setup: CombatSetup | CombatState) {
        this.state = "player" in setup ? setup : createCombat(setup);
    }

    get p() {
        return this.state.player;
    }

    get e() {
        return this.state.enemies[0];
    }

    get time(): number {
        return this.state.timeMs;
    }

    frame(pressed?: Press[]): CombatEvent[] {
        const inputs: CombatInputs = { ...this.held };
        if (pressed?.length) inputs.pressed = Object.fromEntries(pressed.map((key) => [key, true]));
        const result = step(this.state, inputs);
        this.state = result.state;
        this.events.push(...result.events);
        return result.events;
    }

    press(...keys: Press[]): CombatEvent[] {
        return this.frame(keys);
    }

    wait(ms: number): CombatEvent[] {
        const out: CombatEvent[] = [];
        const end = this.time + ms - 1e-6;
        while (this.time < end) out.push(...this.frame());
        return out;
    }

    /** Steps until an event of `type` (matching `test`) appears, then returns it. */
    until<T extends CombatEvent["type"]>(type: T, maxMs = 5000, test: (event: EventOf<T>) => boolean = () => true): EventOf<T> {
        const end = this.time + maxMs;
        while (this.time < end) {
            for (const event of this.frame()) {
                if (event.type === type && test(event as EventOf<T>)) return event as EventOf<T>;
            }
        }
        throw new Error(`no ${type} event within ${maxMs} ms`);
    }

    /** Steps until `test` holds for the state. */
    when(test: (state: CombatState) => boolean, maxMs = 5000): void {
        const end = this.time + maxMs;
        while (this.time < end) {
            this.frame();
            if (test(this.state)) return;
        }
        throw new Error(`condition not met within ${maxMs} ms`);
    }

    of<T extends CombatEvent["type"]>(type: T): EventOf<T>[] {
        return this.events.filter((event) => event.type === type) as EventOf<T>[];
    }

    edit(change: (state: CombatState) => void): void {
        const next = structuredClone(this.state);
        change(next);
        this.state = next;
    }
}
