/**
 * An enemy's half of a fixed step: its telegraphed attack loop and the
 * "reader" that watches the hero's wind-up and may commit to a parry, block,
 * roll or counter. A feint after the enemy commits baits that commitment.
 */

import { distance, down, inArc, moveBy, nextRandom, normalize, reached, sub } from "./math";
import { isOut, markCombat, resolveHit, setStun } from "./resolve";
import {
    ADAPT_BUCKET_MS,
    ADAPT_SIGHT_RANGE,
    ENEMY_BLOCK_HOLD_MS,
    ENEMY_PARRY_COOLDOWN_MS,
    ENEMY_PARRY_LEAD_MS,
    ENEMY_ROLL_COOLDOWN_MS,
    ENEMY_ROLL_DISTANCE,
    ENEMY_ROLL_IFRAME_MS,
    ENEMY_ROLL_LEAD_MS,
    ENEMY_ROLL_MS,
    ENEMY_WHIFF_PARRY_STUN_MS,
    READ_RANGE_MARGIN,
    STEP_MS,
} from "./tuning";
import type {
    Action,
    AttackKind,
    CombatEvent,
    CombatState,
    EnemyAttackDef,
    EnemyDef,
    EnemyState,
    ReactionKind,
    ReadTraits,
    Vec,
} from "./types";
import { enemyAttackSpec } from "./weapons";

const REACTIONS: ReactionKind[] = ["parry", "block", "roll", "counter"];

export function createEnemy(id: string, def: EnemyDef, traits: ReadTraits, pos: Vec, passive: boolean): EnemyState {
    return {
        id,
        side: "enemy",
        def,
        traits,
        pos: { ...pos },
        facing: { x: -1, y: 0 },
        radius: def.radius,
        hp: def.maxHp,
        maxHp: def.maxHp,
        posture: 0,
        maxPosture: def.maxPosture,
        postureRegenPerSec: def.postureRegenPerSec,
        postureRegenDelayMs: 0,
        action: { kind: "idle" },
        hitStopMs: 0,
        parryCooldownMs: 0,
        rollCooldownMs: 0,
        autoParryMs: 0,
        exposedMs: 0,
        brain: {
            passive,
            attackCooldownMs: 0,
            patternIndex: 0,
            read: null,
            reaction: null,
            committedSerial: -1,
            committedKind: null,
            memory: {},
        },
    };
}

/** How familiar an adaptive enemy is with your feints on this swing, as a commit multiplier. */
export function familiarity(enemy: EnemyState, attackKind: AttackKind, chainStep: number): number {
    const traits = enemy.traits;
    if (!traits.adaptive) return 1;
    const prefix = `${attackKind}:${chainStep}:`;
    let strongest = 0;
    for (const [key, weight] of Object.entries(enemy.brain.memory)) {
        if (key.startsWith(prefix)) strongest = Math.max(strongest, weight);
    }
    return Math.max(traits.familiarityFloor, 1 - traits.learnPerRepeat * strongest);
}

export function commitChance(enemy: EnemyState, attackKind: AttackKind, chainStep: number): number {
    return enemy.traits.commitChance * familiarity(enemy, attackKind, chainStep);
}

function isFree(enemy: EnemyState): boolean {
    const a = enemy.action;
    if (enemy.brain.reaction) return false;
    return a.kind === "idle" || (a.kind === "block" && reached(a.t, a.lockMs));
}

/** Called when the hero starts any swing; free enemies in range schedule a read. */
export function onPlayerSwingStart(state: CombatState, _events: CombatEvent[]): void {
    const p = state.player;
    const a = p.action;
    if (a.kind !== "attack") return;
    for (const enemy of state.enemies) {
        if (isOut(enemy) || !isFree(enemy)) continue;
        if (distance(p.pos, enemy.pos) - enemy.radius > a.spec.reach + READ_RANGE_MARGIN) continue;
        enemy.brain.read = {
            serial: a.serial,
            readAtMs: state.timeMs + a.spec.windupMs * enemy.traits.readAtFraction,
            hitAtMs: state.timeMs + a.spec.windupMs,
            attackKind: a.spec.kind,
            chainStep: a.chainStep,
            parryable: a.spec.parryable,
            blockable: a.spec.blockable,
        };
    }
}

export interface FeintInfo {
    serial: number;
    attackKind: AttackKind;
    chainStep: number;
    elapsedMs: number;
}

/** Called when the hero feints: committed readers are baited, adaptive ones learn the rhythm. */
export function onPlayerFeint(state: CombatState, info: FeintInfo, events: CombatEvent[]): void {
    const p = state.player;
    for (const enemy of state.enemies) {
        if (isOut(enemy)) continue;
        const brain = enemy.brain;
        if (brain.read?.serial === info.serial) brain.read = null;
        if (brain.committedSerial === info.serial && brain.committedKind) {
            events.push({ type: "enemyBaited", atMs: state.timeMs, enemyId: enemy.id, reaction: brain.committedKind });
            if (brain.reaction?.serial === info.serial) brain.reaction.baited = true;
            if (enemy.action.kind === "parry" || enemy.action.kind === "roll") enemy.action.baited = true;
        }
        if (enemy.traits.adaptive && distance(p.pos, enemy.pos) <= ADAPT_SIGHT_RANGE) {
            const key = `${info.attackKind}:${info.chainStep}:${Math.floor(info.elapsedMs / ADAPT_BUCKET_MS)}`;
            brain.memory[key] = (brain.memory[key] ?? 0) + 1;
        }
    }
}

function available(enemy: EnemyState, kind: ReactionKind, parryable: boolean, blockable: boolean): boolean {
    switch (kind) {
        case "parry":
            return parryable && enemy.parryCooldownMs <= 0;
        case "block":
            return blockable;
        case "roll":
            return enemy.rollCooldownMs <= 0;
        case "counter":
            return enemy.def.counter !== null;
    }
}

function decideRead(state: CombatState, enemy: EnemyState, events: CombatEvent[]): void {
    const read = enemy.brain.read;
    if (!read) return;
    enemy.brain.read = null;
    const pa = state.player.action;
    if (pa.kind !== "attack" || pa.serial !== read.serial || pa.activeStarted || !isFree(enemy)) return;

    const chance = commitChance(enemy, read.attackKind, read.chainStep);
    const options = REACTIONS.filter((kind) => available(enemy, kind, read.parryable, read.blockable));
    const total = options.reduce((sum, kind) => sum + enemy.traits.reactionWeights[kind], 0);
    if (nextRandom(state) >= chance || total <= 0) {
        events.push({ type: "enemyRead", atMs: state.timeMs, enemyId: enemy.id, committed: false, reaction: null, chance });
        return;
    }
    let pick = nextRandom(state) * total;
    let kind = options[options.length - 1];
    for (const option of options) {
        pick -= enemy.traits.reactionWeights[option];
        if (pick < 0) {
            kind = option;
            break;
        }
    }
    const lead = kind === "parry" ? ENEMY_PARRY_LEAD_MS : kind === "roll" ? ENEMY_ROLL_LEAD_MS : Infinity;
    enemy.brain.reaction = {
        kind,
        serial: read.serial,
        startAtMs: Math.max(state.timeMs, read.hitAtMs - lead),
        baited: false,
    };
    enemy.brain.committedSerial = read.serial;
    enemy.brain.committedKind = kind;
    events.push({ type: "enemyRead", atMs: state.timeMs, enemyId: enemy.id, committed: true, reaction: kind, chance });
}

function startAttack(state: CombatState, enemy: EnemyState, def: EnemyAttackDef, kind: "enemy" | "counter", events: CombatEvent[]): void {
    const spec = enemyAttackSpec(def, kind);
    enemy.action = { kind: "attack", t: 0, spec, serial: 0, chainStep: 0, resolved: [], landed: false, activeStarted: false };
    events.push({
        type: "enemyTelegraph",
        atMs: state.timeMs,
        enemyId: enemy.id,
        attackId: spec.id,
        color: spec.parryable ? "orange" : "red",
        parryable: spec.parryable,
        windupMs: spec.windupMs,
    });
    markCombat(state);
}

function startReaction(state: CombatState, enemy: EnemyState, events: CombatEvent[]): void {
    const reaction = enemy.brain.reaction;
    if (!reaction) return;
    enemy.brain.reaction = null;
    const p = state.player;
    switch (reaction.kind) {
        case "parry":
            enemy.parryCooldownMs = ENEMY_PARRY_COOLDOWN_MS;
            enemy.action = { kind: "parry", t: 0, windowMs: enemy.def.parry.windowMs, baited: reaction.baited };
            break;
        case "block":
            enemy.action = { kind: "block", t: 0, lockMs: ENEMY_BLOCK_HOLD_MS, shaky: false };
            break;
        case "roll":
            enemy.rollCooldownMs = ENEMY_ROLL_COOLDOWN_MS;
            enemy.action = {
                kind: "roll",
                t: 0,
                durationMs: ENEMY_ROLL_MS,
                iframeMs: ENEMY_ROLL_IFRAME_MS,
                distance: ENEMY_ROLL_DISTANCE,
                dir: normalize(sub(enemy.pos, p.pos), { x: 1, y: 0 }),
                baited: reaction.baited,
            };
            break;
        case "counter":
            if (enemy.def.counter) startAttack(state, enemy, enemy.def.counter, "counter", events);
            break;
    }
    events.push({ type: "enemyReaction", atMs: state.timeMs, enemyId: enemy.id, reaction: reaction.kind });
}

function advanceAttack(state: CombatState, enemy: EnemyState, events: CombatEvent[]): void {
    const a = enemy.action as Extract<Action, { kind: "attack" }>;
    const p = state.player;
    const spec = a.spec;
    const before = a.t;
    a.t += STEP_MS;
    const activeEnd = spec.windupMs + spec.activeMs;
    if (!a.activeStarted && reached(a.t, spec.windupMs)) a.activeStarted = true;
    if (a.activeStarted && !reached(before, activeEnd)) {
        const inReach = distance(enemy.pos, p.pos) - p.radius <= spec.reach;
        if (!isOut(p) && a.resolved.length === 0 && inReach && inArc(enemy.pos, enemy.facing, p.pos, spec.arcDeg)) {
            a.resolved.push(`${p.id}#0`);
            const outcome = resolveHit(state, enemy, p, spec, events);
            a.landed = outcome === "hit" || outcome === "blocked" || outcome === "guardBroken";
            if (enemy.action !== a) return;
        }
        if (reached(a.t, activeEnd) && a.resolved.length === 0) {
            events.push({ type: "whiffed", atMs: state.timeMs, bodyId: enemy.id, attackId: spec.id });
        }
    }
    if (reached(a.t, activeEnd + spec.recoveryMs)) {
        enemy.action = { kind: "idle" };
        enemy.brain.attackCooldownMs = enemy.def.attackIntervalMs;
    }
}

function advanceAction(state: CombatState, enemy: EnemyState, events: CombatEvent[]): void {
    const a = enemy.action;
    switch (a.kind) {
        case "attack":
            advanceAttack(state, enemy, events);
            return;
        case "parry":
            a.t += STEP_MS;
            if (reached(a.t, a.windowMs)) {
                enemy.exposedMs = ENEMY_WHIFF_PARRY_STUN_MS;
                setStun(enemy, ENEMY_WHIFF_PARRY_STUN_MS, "parryWhiff");
                events.push({ type: "enemyParryWhiffed", atMs: state.timeMs, enemyId: enemy.id, baited: a.baited, stunMs: ENEMY_WHIFF_PARRY_STUN_MS });
            }
            return;
        case "roll": {
            const before = a.t;
            a.t += STEP_MS;
            enemy.pos = moveBy(enemy.pos, a.dir, (a.distance * STEP_MS) / a.durationMs);
            if (!reached(before, a.iframeMs) && reached(a.t, a.iframeMs)) {
                events.push({ type: "enemyRollEndLag", atMs: state.timeMs, enemyId: enemy.id, baited: a.baited, endLagMs: a.durationMs - a.iframeMs });
            }
            if (reached(a.t, a.durationMs)) enemy.action = { kind: "idle" };
            return;
        }
        case "block":
            a.t += STEP_MS;
            if (reached(a.t, a.lockMs)) enemy.action = { kind: "idle" };
            return;
        case "stun":
        case "feintRecovery":
            a.t += STEP_MS;
            if (reached(a.t, a.durationMs)) enemy.action = { kind: "idle" };
            return;
        default:
            return;
    }
}

function forget(enemy: EnemyState): void {
    if (!enemy.traits.adaptive) return;
    const amount = (enemy.traits.forgetPerSec * STEP_MS) / 1000;
    for (const key of Object.keys(enemy.brain.memory)) {
        const left = enemy.brain.memory[key] - amount;
        if (left <= 0) delete enemy.brain.memory[key];
        else enemy.brain.memory[key] = left;
    }
}

export function enemyStep(state: CombatState, enemy: EnemyState, events: CombatEvent[]): void {
    if (isOut(enemy)) return;
    const brain = enemy.brain;
    enemy.parryCooldownMs = down(enemy.parryCooldownMs, STEP_MS);
    enemy.rollCooldownMs = down(enemy.rollCooldownMs, STEP_MS);
    enemy.exposedMs = down(enemy.exposedMs, STEP_MS);
    enemy.postureRegenDelayMs = down(enemy.postureRegenDelayMs, STEP_MS);
    if (enemy.action.kind === "idle") brain.attackCooldownMs = down(brain.attackCooldownMs, STEP_MS);
    forget(enemy);

    if (enemy.hitStopMs > 0) {
        enemy.hitStopMs = down(enemy.hitStopMs, STEP_MS);
        return;
    }

    const p = state.player;
    advanceAction(state, enemy, events);
    if (isOut(enemy)) return;
    if (brain.read && reached(state.timeMs, brain.read.readAtMs)) decideRead(state, enemy, events);
    if (brain.reaction && reached(state.timeMs, brain.reaction.startAtMs)) {
        const a = enemy.action;
        if (a.kind === "idle" || a.kind === "block") startReaction(state, enemy, events);
    }

    const gap = distance(enemy.pos, p.pos) - p.radius;
    const a = enemy.action;
    if (a.kind === "idle" || a.kind === "block" || a.kind === "parry" || (a.kind === "attack" && !a.activeStarted)) {
        enemy.facing = normalize(sub(p.pos, enemy.pos), enemy.facing);
    }
    const watching = brain.read !== null || brain.reaction !== null;
    if (a.kind === "idle" && !isOut(p) && !watching) {
        if (!brain.passive && brain.attackCooldownMs <= 0 && gap <= enemy.def.attackRange) {
            const id = enemy.def.pattern[brain.patternIndex % enemy.def.pattern.length];
            brain.patternIndex += 1;
            startAttack(state, enemy, enemy.def.attacks[id], "enemy", events);
        } else if (gap > enemy.def.attackRange * 0.9) {
            const step = Math.min(gap - enemy.def.attackRange * 0.9, (enemy.def.moveSpeed * STEP_MS) / 1000);
            enemy.pos = moveBy(enemy.pos, normalize(sub(p.pos, enemy.pos)), step);
        }
    }
    if (enemy.action.kind !== "block" && enemy.postureRegenDelayMs <= 0) {
        enemy.posture = Math.max(0, enemy.posture - (enemy.postureRegenPerSec * STEP_MS) / 1000);
    }
}
