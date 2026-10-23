/**
 * The combat rules' public entry points. Every function here is pure: it
 * clones the state it is given and returns a new one plus the events the
 * renderer and the run layer should react to.
 */

import { createEnemy, enemyStep } from "./enemy";
import { playerStep, registerInputs } from "./player";
import { isOut, maxHealable } from "./resolve";
import {
    ENEMY_TUNING,
    GRACE_MAX,
    MAX_STEPS_PER_TICK,
    PLAYER_LIVES,
    PLAYER_MAX_HP,
    PLAYER_MAX_POSTURE,
    PLAYER_RADIUS,
    READ_TRAIT_TUNING,
    STEP_MS,
} from "./tuning";
import type { CombatEvent, CombatInputs, CombatState, EnemyDef, PlayerState, ReadTraits, Vec, WeaponDef } from "./types";
import { SWORD } from "./weapons";

export interface StepResult {
    state: CombatState;
    events: CombatEvent[];
}

export type TraitName = keyof typeof READ_TRAIT_TUNING;

export interface EnemySpawn {
    pos: Vec;
    def?: EnemyDef;
    /** A preset name or custom traits; defaults to the def's own. */
    traits?: TraitName | ReadTraits;
    /** A passive enemy reads and reacts but never starts its own attacks. */
    passive?: boolean;
}

export interface CombatSetup {
    seed: number;
    weapon?: WeaponDef;
    playerPos?: Vec;
    enemies?: EnemySpawn[];
}

function clone(state: CombatState): CombatState {
    return structuredClone(state);
}

function resolveTraits(spawn: EnemySpawn, def: EnemyDef): ReadTraits {
    const traits = spawn.traits ?? def.defaultTraits;
    if (typeof traits !== "string") return structuredClone(traits);
    const preset = READ_TRAIT_TUNING[traits as TraitName];
    if (!preset) throw new Error(`Unknown read traits "${traits}"`);
    return structuredClone(preset);
}

function addEnemy(state: CombatState, spawn: EnemySpawn): void {
    const def = structuredClone(spawn.def ?? ENEMY_TUNING.lesser_demon);
    const id = `enemy_${state.nextEnemyId}`;
    state.nextEnemyId += 1;
    state.enemies.push(createEnemy(id, def, resolveTraits(spawn, def), spawn.pos, !!spawn.passive));
}

function createPlayer(weapon: WeaponDef, pos: Vec): PlayerState {
    return {
        id: "player",
        side: "player",
        weapon: structuredClone(weapon),
        pos: { ...pos },
        facing: { x: 1, y: 0 },
        radius: PLAYER_RADIUS,
        hp: PLAYER_MAX_HP,
        maxHp: PLAYER_MAX_HP,
        posture: 0,
        maxPosture: PLAYER_MAX_POSTURE,
        postureRegenDelayMs: 0,
        action: { kind: "idle" },
        hitStopMs: 0,
        parryCooldownMs: 0,
        rollCooldownMs: 0,
        autoParryMs: 0,
        exposedMs: 0,
        fervour: 0,
        fervourDecayDelayMs: 0,
        grace: GRACE_MAX,
        lives: PLAYER_LIVES,
        haloDimmed: false,
        throneAnswerReady: false,
        criticalCooldownMs: 0,
        feintCooldownMs: 0,
        feintsInRow: 0,
        chainStep: 0,
        chainWindowMs: 0,
        buffer: null,
        pendingFeint: false,
        pendingCast: false,
        blockHeld: false,
        sprinting: false,
        moveDir: { x: 0, y: 0 },
        swingSerial: 0,
        lastCombatAtMs: -Number.MAX_SAFE_INTEGER,
    };
}

export function createCombat(setup: CombatSetup): CombatState {
    const state: CombatState = {
        timeMs: 0,
        accMs: 0,
        rng: setup.seed >>> 0,
        player: createPlayer(setup.weapon ?? SWORD, setup.playerPos ?? { x: 0, y: 0 }),
        enemies: [],
        nextEnemyId: 1,
    };
    for (const spawn of setup.enemies ?? []) addEnemy(state, spawn);
    return state;
}

function runStep(state: CombatState, inputs: CombatInputs, events: CombatEvent[]): void {
    state.timeMs += STEP_MS;
    playerStep(state, inputs, events);
    for (const enemy of state.enemies) enemyStep(state, enemy, events);
}

/**
 * Feeds one frame of input and advances by `dtMs` in fixed STEP_MS steps.
 * Presses are buffered, so a press in a frame too short to run a step still
 * acts on the next one.
 */
export function tick(state: CombatState, dtMs: number, inputs: CombatInputs = {}): StepResult {
    const next = clone(state);
    const events: CombatEvent[] = [];
    registerInputs(next, inputs);
    next.accMs += Math.max(0, dtMs);
    let steps = 0;
    while (next.accMs >= STEP_MS - 1e-6 && steps < MAX_STEPS_PER_TICK) {
        next.accMs -= STEP_MS;
        runStep(next, inputs, events);
        steps += 1;
    }
    if (steps === MAX_STEPS_PER_TICK) next.accMs = Math.min(next.accMs, STEP_MS);
    return { state: next, events };
}

/** Exactly one fixed step, ignoring the accumulator. */
export function step(state: CombatState, inputs: CombatInputs = {}): StepResult {
    const next = clone(state);
    const events: CombatEvent[] = [];
    registerInputs(next, inputs);
    runStep(next, inputs, events);
    return { state: next, events };
}

/**
 * Runs whole steps for `ms`. Presses in `inputs` land on the first step only;
 * held keys, movement and aim apply throughout.
 */
export function advance(state: CombatState, ms: number, inputs: CombatInputs = {}): StepResult {
    const next = clone(state);
    const events: CombatEvent[] = [];
    const held: CombatInputs = { ...inputs, pressed: undefined };
    const count = Math.round(ms / STEP_MS);
    for (let i = 0; i < count; i++) {
        const frame = i === 0 ? inputs : held;
        registerInputs(next, frame);
        runStep(next, frame, events);
    }
    return { state: next, events };
}

export function spawnEnemy(state: CombatState, spawn: EnemySpawn): CombatState {
    const next = clone(state);
    addEnemy(next, spawn);
    return next;
}

/** Stands the hero back up after being struck down, at the dimmed halo's cap. */
export function revivePlayer(state: CombatState): CombatState {
    const next = clone(state);
    const p = next.player;
    if (p.action.kind !== "down") return next;
    p.action = { kind: "idle" };
    p.hp = maxHealable(p);
    p.posture = 0;
    p.fervour = 0;
    return next;
}

export function healPlayer(state: CombatState, amount: number): CombatState {
    const next = clone(state);
    const p = next.player;
    if (!isOut(p)) p.hp = Math.min(maxHealable(p), p.hp + amount);
    return next;
}

/** An altar or an Ascension clears the dimmed halo. */
export function clearHaloDim(state: CombatState): CombatState {
    const next = clone(state);
    next.player.haloDimmed = false;
    return next;
}

export function setThroneAnswerReady(state: CombatState, ready: boolean): CombatState {
    const next = clone(state);
    next.player.throneAnswerReady = ready;
    return next;
}

/** Spends Grace for a Hymn. Returns null when there isn't enough. */
export function spendGrace(state: CombatState, amount: number): CombatState | null {
    if (state.player.grace < amount) return null;
    const next = clone(state);
    next.player.grace -= amount;
    return next;
}

export { maxHealable };
