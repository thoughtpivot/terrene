/**
 * The hero's half of a fixed step: input buffer, the M1 chain and flourish,
 * parry and block, roll, critical, feint, Outcry, and the posture, Fervour
 * and Grace meters.
 */

import { onPlayerFeint, onPlayerSwingStart } from "./enemy";
import { distance, down, inArc, length, moveBy, normalize, reached, sub } from "./math";
import { isInvulnerable, isOut, isParrying, markCombat, resolveHit, setStun } from "./resolve";
import {
    ATTACK_MOVE_MULT,
    BLOCK_MOVE_MULT,
    CHAIN_RESET_MS,
    COMBAT_TIMEOUT_MS,
    FEINT_COOLDOWN_MS,
    FEINT_LIMIT,
    FEINT_RECOVERY_MS,
    FERVOUR_DECAY_PER_SEC,
    GRACE_MAX,
    GRACE_REGEN_IN_COMBAT_PER_SEC,
    GRACE_REGEN_OUT_OF_COMBAT_PER_SEC,
    GUARD_ARC_DEG,
    INPUT_BUFFER_MS,
    MISSED_PARRY_BLOCK_MS,
    OUTCRY_COST,
    OUTCRY_ENEMY_STAGGER_MS,
    OUTCRY_MIN_FERVOUR,
    OUTCRY_PARRIED_STUN_MS,
    OUTCRY_PUSH,
    OUTCRY_WHIFF_STUN_MS,
    PARRY_CANCEL_STARTUP_MS,
    PARRY_COOLDOWN_MS,
    PLAYER_SPRINT_SPEED,
    PLAYER_WALK_SPEED,
    POSTURE_REGEN_PER_SEC,
    ROLL_CANCEL_ENABLED,
    ROLL_CANCEL_EXTRA_COOLDOWN_MS,
    ROLL_COOLDOWN_MS,
    ROLL_DISTANCE,
    ROLL_IFRAME_MS,
    ROLL_MS,
    STEP_MS,
} from "./tuning";
import type { Action, AttackSpec, BufferedAction, CombatEvent, CombatInputs, CombatState, PlayerState } from "./types";
import { criticalSpec, flourishSpec, lightSpec, outcrySpec } from "./weapons";

type AttackAction = Extract<Action, { kind: "attack" }>;

/** When several buffered keys go down in one tick, defence wins. */
const PRESS_PRIORITY: BufferedAction[] = ["parry", "roll", "outcry", "critical", "attack"];

export function registerInputs(state: CombatState, inputs: CombatInputs): void {
    const p = state.player;
    p.blockHeld = !!inputs.blockHeld;
    const pressed = inputs.pressed ?? {};
    const action = PRESS_PRIORITY.find((name) => pressed[name]);
    if (action) p.buffer = { action, atMs: state.timeMs };
    if (pressed.feint) p.pendingFeint = true;
    if (pressed.cast) p.pendingCast = true;
}

function inWindup(a: Action): a is AttackAction {
    return a.kind === "attack" && !a.activeStarted;
}

function inRecovery(a: Action): a is AttackAction {
    return a.kind === "attack" && reached(a.t, a.spec.windupMs + a.spec.activeMs);
}

function canAct(p: PlayerState): boolean {
    return p.action.kind === "idle" || (p.action.kind === "block" && !p.action.shaky);
}

function canStart(p: PlayerState, action: BufferedAction): boolean {
    const a = p.action;
    switch (action) {
        case "attack":
            return canAct(p);
        case "critical":
            return canAct(p) && p.criticalCooldownMs <= 0;
        case "parry":
            if (p.parryCooldownMs > 0) return false;
            if (canAct(p)) return true;
            return inWindup(a) && (a.spec.kind === "light" || a.spec.kind === "flourish") && a.t < PARRY_CANCEL_STARTUP_MS;
        case "roll":
            if (p.rollCooldownMs > 0) return false;
            if (canAct(p)) return true;
            return inRecovery(a) && a.spec.kind === "light" && a.landed;
        case "outcry":
            if (p.fervour < OUTCRY_MIN_FERVOUR) return false;
            if (canAct(p)) return true;
            return a.kind === "stun" && (a.reason === "hit" || a.reason === "flourish");
    }
}

function startAttack(state: CombatState, spec: AttackSpec, chainStep: number, events: CombatEvent[]): void {
    const p = state.player;
    p.swingSerial += 1;
    p.action = {
        kind: "attack",
        t: 0,
        spec,
        serial: p.swingSerial,
        chainStep,
        resolved: [],
        landed: false,
        activeStarted: false,
    };
    events.push({
        type: "attackStarted",
        atMs: state.timeMs,
        bodyId: p.id,
        attackId: spec.id,
        kind: spec.kind,
        chainStep,
        windupMs: spec.windupMs,
    });
    onPlayerSwingStart(state, events);
}

function start(state: CombatState, action: BufferedAction, events: CombatEvent[]): void {
    const p = state.player;
    switch (action) {
        case "attack": {
            const step = p.chainStep;
            const spec = step >= p.weapon.chainLength ? flourishSpec(p.weapon) : lightSpec(p.weapon, step);
            startAttack(state, spec, step, events);
            return;
        }
        case "critical":
            p.criticalCooldownMs = p.weapon.critical.cooldownMs;
            startAttack(state, criticalSpec(p.weapon), p.chainStep, events);
            return;
        case "parry":
            p.parryCooldownMs = PARRY_COOLDOWN_MS;
            p.action = { kind: "parry", t: 0, windowMs: p.weapon.parry.windowMs, baited: false };
            return;
        case "roll": {
            const dir = length(p.moveDir) > 0 ? normalize(p.moveDir) : normalize(p.facing);
            p.rollCooldownMs = ROLL_COOLDOWN_MS;
            p.action = { kind: "roll", t: 0, durationMs: ROLL_MS, iframeMs: ROLL_IFRAME_MS, distance: ROLL_DISTANCE, dir, baited: false };
            events.push({ type: "rollStarted", atMs: state.timeMs, bodyId: p.id, dir });
            return;
        }
        case "outcry":
            p.fervour -= OUTCRY_COST;
            startAttack(state, outcrySpec(), p.chainStep, events);
            return;
    }
}

function tryFeint(state: CombatState, events: CombatEvent[]): void {
    const p = state.player;
    const a = p.action;
    const atMs = state.timeMs;
    if (a.kind === "roll" && ROLL_CANCEL_ENABLED) {
        p.action = { kind: "idle" };
        p.rollCooldownMs += ROLL_CANCEL_EXTRA_COOLDOWN_MS;
        events.push({ type: "rollCancelled", atMs });
        return;
    }
    if (!inWindup(a)) {
        events.push({ type: "feintRejected", atMs, reason: "notInWindup" });
        return;
    }
    if (!a.spec.feintable) {
        events.push({ type: "feintRejected", atMs, reason: "unfeintable" });
        return;
    }
    if (p.feintCooldownMs > 0) {
        events.push({ type: "feintRejected", atMs, reason: "cooldown" });
        return;
    }
    if (p.feintsInRow >= FEINT_LIMIT) {
        events.push({ type: "feintRejected", atMs, reason: "limit" });
        return;
    }
    p.feintCooldownMs = FEINT_COOLDOWN_MS;
    p.feintsInRow += 1;
    p.action = { kind: "feintRecovery", t: 0, durationMs: FEINT_RECOVERY_MS };
    events.push({ type: "feint", atMs, attackId: a.spec.id, chainStep: a.chainStep, windupElapsedMs: a.t });
    onPlayerFeint(state, { serial: a.serial, attackKind: a.spec.kind, chainStep: a.chainStep, elapsedMs: a.t }, events);
}

function tryCast(state: CombatState, events: CombatEvent[]): void {
    const p = state.player;
    const a = p.action;
    if (inRecovery(a) && a.spec.kind === "flourish") {
        p.action = { kind: "idle" };
        events.push({ type: "castRequested", atMs: state.timeMs, cancelledFlourish: true });
    } else if (canAct(p)) {
        events.push({ type: "castRequested", atMs: state.timeMs, cancelledFlourish: false });
    }
}

function resolveSwingHits(state: CombatState, a: AttackAction, events: CombatEvent[]): void {
    const p = state.player;
    const spec = a.spec;
    const sinceActive = a.t - spec.windupMs;
    const interval = spec.activeMs / spec.hitCount;
    for (let i = 0; i < spec.hitCount; i++) {
        if (!reached(sinceActive, i * interval)) break;
        for (const enemy of state.enemies) {
            if (isOut(enemy)) continue;
            const key = `${enemy.id}#${i}`;
            if (a.resolved.includes(key)) continue;
            if (distance(p.pos, enemy.pos) - enemy.radius > spec.reach) continue;
            if (!inArc(p.pos, p.facing, enemy.pos, spec.arcDeg)) continue;
            a.resolved.push(key);
            const outcome = resolveHit(state, p, enemy, spec, events);
            if (outcome === "hit" || outcome === "blocked" || outcome === "guardBroken") a.landed = true;
            if (p.action !== a) return;
        }
    }
}

function resolveOutcry(state: CombatState, events: CombatEvent[]): void {
    const p = state.player;
    const spec = outcrySpec();
    const inRange = state.enemies.filter((e) => !isOut(e) && distance(p.pos, e.pos) - e.radius <= spec.reach);
    markCombat(state);

    const parrier = inRange.find(
        (e) => !isInvulnerable(e) && isParrying(e) && inArc(e.pos, e.facing, p.pos, GUARD_ARC_DEG),
    );
    if (parrier) {
        resolveHit(state, p, parrier, spec, events);
        setStun(p, OUTCRY_PARRIED_STUN_MS, "outcryParried");
        events.push({ type: "outcry", outcome: "parried", enemyIds: [parrier.id], atMs: state.timeMs, hitStopMs: spec.hitStopMs, shake: { ...spec.shake } });
        return;
    }

    const struck: string[] = [];
    for (const enemy of inRange) {
        if (isInvulnerable(enemy)) {
            events.push({ type: "dodged", atMs: state.timeMs, attackerId: p.id, targetId: enemy.id, attackId: spec.id });
            continue;
        }
        const away = normalize(sub(enemy.pos, p.pos), p.facing);
        enemy.pos = moveBy(enemy.pos, away, OUTCRY_PUSH);
        setStun(enemy, OUTCRY_ENEMY_STAGGER_MS, "outcryStagger");
        struck.push(enemy.id);
    }
    if (struck.length === 0) {
        setStun(p, OUTCRY_WHIFF_STUN_MS, "outcryWhiff");
        events.push({ type: "outcry", outcome: "whiffed", enemyIds: [], atMs: state.timeMs, hitStopMs: 0, shake: { magnitudePx: 0, durationMs: 0 } });
        return;
    }
    p.hitStopMs = Math.max(p.hitStopMs, spec.hitStopMs);
    events.push({ type: "outcry", outcome: "hit", enemyIds: struck, atMs: state.timeMs, hitStopMs: spec.hitStopMs, shake: { ...spec.shake } });
}

function advanceAttack(state: CombatState, a: AttackAction, events: CombatEvent[]): void {
    const p = state.player;
    const spec = a.spec;
    const before = a.t;
    a.t += STEP_MS;
    const activeEnd = spec.windupMs + spec.activeMs;

    if (!a.activeStarted && reached(a.t, spec.windupMs)) {
        a.activeStarted = true;
        p.feintsInRow = 0;
        if (spec.kind === "light") p.chainStep = a.chainStep + 1;
        if (spec.kind === "flourish") p.chainStep = 0;
        if (spec.kind === "outcry") {
            resolveOutcry(state, events);
            return;
        }
    }
    if (a.activeStarted && spec.kind !== "outcry" && !reached(before, activeEnd)) {
        if (spec.lunge > 0) p.pos = moveBy(p.pos, normalize(p.facing), (spec.lunge * STEP_MS) / spec.activeMs);
        resolveSwingHits(state, a, events);
        if (p.action !== a) return;
        if (reached(a.t, activeEnd) && a.resolved.length === 0) {
            events.push({ type: "whiffed", atMs: state.timeMs, bodyId: p.id, attackId: spec.id });
        }
    }
    if (reached(a.t, activeEnd + spec.recoveryMs)) {
        p.action = { kind: "idle" };
        if (spec.kind === "light" || spec.kind === "critical") p.chainWindowMs = CHAIN_RESET_MS;
    }
}

function advanceAction(state: CombatState, events: CombatEvent[]): void {
    const p = state.player;
    const a = p.action;
    switch (a.kind) {
        case "attack":
            advanceAttack(state, a, events);
            return;
        case "parry":
            a.t += STEP_MS;
            if (reached(a.t, a.windowMs)) {
                p.action = { kind: "block", t: 0, lockMs: MISSED_PARRY_BLOCK_MS, shaky: true };
                events.push({ type: "parryMissed", atMs: state.timeMs, bodyId: p.id });
            }
            return;
        case "block":
            a.t += STEP_MS;
            if (a.shaky && reached(a.t, a.lockMs)) a.shaky = false;
            return;
        case "roll":
            a.t += STEP_MS;
            p.pos = moveBy(p.pos, a.dir, (a.distance * STEP_MS) / a.durationMs);
            if (reached(a.t, a.durationMs)) p.action = { kind: "idle" };
            return;
        case "stun":
        case "feintRecovery":
            a.t += STEP_MS;
            if (reached(a.t, a.durationMs)) p.action = { kind: "idle" };
            return;
        default:
            return;
    }
}

function tickCooldowns(p: PlayerState): void {
    p.parryCooldownMs = down(p.parryCooldownMs, STEP_MS);
    p.rollCooldownMs = down(p.rollCooldownMs, STEP_MS);
    p.criticalCooldownMs = down(p.criticalCooldownMs, STEP_MS);
    p.feintCooldownMs = down(p.feintCooldownMs, STEP_MS);
    p.autoParryMs = down(p.autoParryMs, STEP_MS);
    p.exposedMs = down(p.exposedMs, STEP_MS);
    p.postureRegenDelayMs = down(p.postureRegenDelayMs, STEP_MS);
    p.fervourDecayDelayMs = down(p.fervourDecayDelayMs, STEP_MS);
}

function locksFacing(a: Action): boolean {
    return a.kind === "stun" || a.kind === "roll" || (a.kind === "attack" && a.activeStarted);
}

function move(p: PlayerState, inputs: CombatInputs): void {
    const raw = inputs.move ?? { x: 0, y: 0 };
    const moving = length(raw) > 0;
    p.moveDir = moving ? normalize(raw) : { x: 0, y: 0 };
    p.sprinting = !!inputs.sprint && moving && p.action.kind === "idle";
    if (!moving) return;
    let speed = 0;
    if (p.action.kind === "idle") speed = p.sprinting ? PLAYER_SPRINT_SPEED : PLAYER_WALK_SPEED;
    else if (p.action.kind === "block") speed = PLAYER_WALK_SPEED * BLOCK_MOVE_MULT;
    else if (inWindup(p.action)) speed = PLAYER_WALK_SPEED * ATTACK_MOVE_MULT;
    p.pos = moveBy(p.pos, p.moveDir, (speed * STEP_MS) / 1000);
}

function meters(state: CombatState): void {
    const p = state.player;
    const seconds = STEP_MS / 1000;
    if (p.action.kind !== "block" && !p.sprinting && p.postureRegenDelayMs <= 0) {
        p.posture = Math.max(0, p.posture - POSTURE_REGEN_PER_SEC * seconds);
    }
    if (p.fervourDecayDelayMs <= 0) p.fervour = Math.max(0, p.fervour - FERVOUR_DECAY_PER_SEC * seconds);
    const inCombat = state.timeMs - p.lastCombatAtMs < COMBAT_TIMEOUT_MS;
    const rate = inCombat ? (p.fervour > 0 ? GRACE_REGEN_IN_COMBAT_PER_SEC : 0) : GRACE_REGEN_OUT_OF_COMBAT_PER_SEC;
    p.grace = Math.min(GRACE_MAX, p.grace + rate * seconds);
}

export function playerStep(state: CombatState, inputs: CombatInputs, events: CombatEvent[]): void {
    const p = state.player;
    if (isOut(p)) {
        p.pendingFeint = false;
        p.pendingCast = false;
        return;
    }
    tickCooldowns(p);
    if (inputs.aim && length(inputs.aim) > 0 && !locksFacing(p.action)) p.facing = normalize(inputs.aim);

    if (p.hitStopMs > 0) {
        p.hitStopMs = down(p.hitStopMs, STEP_MS);
    } else {
        if (p.pendingFeint) tryFeint(state, events);
        if (p.pendingCast) tryCast(state, events);
        p.pendingFeint = false;
        p.pendingCast = false;
        advanceAction(state, events);
        if (isOut(p)) return;

        if (p.buffer) {
            if (state.timeMs - p.buffer.atMs > INPUT_BUFFER_MS) {
                events.push({ type: "inputDropped", atMs: state.timeMs, action: p.buffer.action });
                p.buffer = null;
            } else if (canStart(p, p.buffer.action)) {
                const action = p.buffer.action;
                p.buffer = null;
                start(state, action, events);
            }
        }

        if (p.action.kind === "idle" && p.blockHeld) p.action = { kind: "block", t: 0, lockMs: 0, shaky: false };
        if (p.action.kind === "block" && !p.action.shaky && !p.blockHeld) p.action = { kind: "idle" };
    }

    if (p.action.kind !== "attack" && p.action.kind !== "feintRecovery") {
        p.chainWindowMs = down(p.chainWindowMs, STEP_MS);
        if (p.chainWindowMs <= 0) p.chainStep = 0;
    }
    move(p, inputs);
    meters(state);
}
