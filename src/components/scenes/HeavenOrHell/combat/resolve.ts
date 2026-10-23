/**
 * What happens when an attack reaches a body: i-frames, parry, block,
 * posture, guard break, damage and the two lives. Shared by the hero and
 * every enemy so both sides follow the same rules.
 */

import { inArc, moveBy, normalize, sub } from "./math";
import {
    AUTO_PARRY_MS,
    EXPOSED_POSTURE_MULT,
    FERVOUR_MAX,
    FERVOUR_DECAY_DELAY_MS,
    FERVOUR_ON_BLOCKED_DEALT,
    FERVOUR_ON_HIT_DEALT,
    FERVOUR_ON_HIT_TAKEN,
    FERVOUR_ON_PARRY,
    FLOURISH_STUN_MS,
    GUARD_ARC_DEG,
    GUARD_BREAK_STUN_MS,
    HALO_DIM_FRACTION,
    HITSTOP_BLOCK_MS,
    HITSTOP_GUARD_BREAK_MS,
    HITSTOP_PARRY_MS,
    HITSTUN_MS,
    PARRIED_STUN_MS,
    POSTURE_REGEN_DELAY_MS,
    SHAKE_BLOCK,
    SHAKE_GUARD_BREAK,
    SHAKE_PARRY,
    SHAKY_BLOCK_POSTURE_MULT,
    SHAKY_BLOCK_STUN_MS,
} from "./tuning";
import type {
    AttackSpec,
    Body,
    CombatEvent,
    CombatState,
    EnemyState,
    ParryFeel,
    PlayerState,
    StunReason,
} from "./types";

export type HitOutcome = "dodged" | "parried" | "blocked" | "guardBroken" | "hit";

export function isPlayer(body: Body): body is PlayerState {
    return body.side === "player";
}

export function isOut(body: Body): boolean {
    return body.action.kind === "down" || body.action.kind === "dead";
}

export function isInvulnerable(body: Body): boolean {
    return body.action.kind === "roll" && body.action.t < body.action.iframeMs;
}

export function isParrying(body: Body): boolean {
    if (body.action.kind === "parry" && body.action.t < body.action.windowMs) return true;
    return body.autoParryMs > 0 && body.action.kind !== "stun" && !isOut(body);
}

export function isBlocking(body: Body): boolean {
    return body.action.kind === "block";
}

export function maxHealable(player: PlayerState): number {
    return player.haloDimmed ? Math.round(player.maxHp * (1 - HALO_DIM_FRACTION)) : player.maxHp;
}

function parryFeel(body: Body): ParryFeel {
    return isPlayer(body) ? body.weapon.parry : (body as EnemyState).def.parry;
}

function hitstunMs(body: Body): number {
    return isPlayer(body) ? HITSTUN_MS : (body as EnemyState).def.hitstunMs;
}

function parriedStunMs(body: Body): number {
    return isPlayer(body) ? PARRIED_STUN_MS : (body as EnemyState).def.parriedStunMs;
}

function guardBreakStunMs(body: Body): number {
    return isPlayer(body) ? GUARD_BREAK_STUN_MS : (body as EnemyState).def.guardBreakStunMs;
}

export function markCombat(state: CombatState): void {
    state.player.lastCombatAtMs = state.timeMs;
}

export function gainFervour(player: PlayerState, amount: number): void {
    player.fervour = Math.min(FERVOUR_MAX, player.fervour + amount);
    player.fervourDecayDelayMs = FERVOUR_DECAY_DELAY_MS;
}

export function setStun(body: Body, durationMs: number, reason: StunReason): void {
    if (isOut(body)) return;
    body.action = { kind: "stun", t: 0, durationMs, reason };
    if (isPlayer(body)) {
        body.chainStep = 0;
        body.chainWindowMs = 0;
    } else {
        const enemy = body as EnemyState;
        enemy.brain.read = null;
        enemy.brain.reaction = null;
    }
}

/** Adds posture. Returns "broken" if posture was already full when this landed. */
export function applyPosture(body: Body, amount: number): "absorbed" | "full" | "broken" {
    body.postureRegenDelayMs = POSTURE_REGEN_DELAY_MS;
    if (body.posture >= body.maxPosture) return "broken";
    body.posture = Math.min(body.maxPosture, body.posture + amount);
    return body.posture >= body.maxPosture ? "full" : "absorbed";
}

export function guardBreak(state: CombatState, attacker: Body, target: Body, events: CombatEvent[]): void {
    const stunMs = guardBreakStunMs(target);
    target.posture = 0;
    setStun(target, stunMs, "guardBreak");
    attacker.hitStopMs = Math.max(attacker.hitStopMs, HITSTOP_GUARD_BREAK_MS);
    target.hitStopMs = Math.max(target.hitStopMs, HITSTOP_GUARD_BREAK_MS);
    events.push({
        type: "guardBroken",
        atMs: state.timeMs,
        attackerId: attacker.id,
        targetId: target.id,
        stunMs,
        hitStopMs: HITSTOP_GUARD_BREAK_MS,
        shake: { ...SHAKE_GUARD_BREAK },
    });
}

function postPosture(state: CombatState, body: Body, result: "absorbed" | "full" | "broken", events: CombatEvent[]): void {
    if (result === "full") events.push({ type: "postureFull", atMs: state.timeMs, bodyId: body.id });
}

export function applyDamage(state: CombatState, target: Body, damage: number, events: CombatEvent[]): void {
    target.hp = Math.max(0, target.hp - damage);
    if (target.hp > 0) return;
    if (isPlayer(target)) {
        strikeDown(state, target, events);
    } else {
        target.action = { kind: "dead" };
        events.push({ type: "enemyDefeated", atMs: state.timeMs, enemyId: target.id });
    }
}

function strikeDown(state: CombatState, player: PlayerState, events: CombatEvent[]): void {
    if (player.throneAnswerReady) {
        player.throneAnswerReady = false;
        player.hp = maxHealable(player);
        events.push({ type: "throneAnswered", atMs: state.timeMs });
        return;
    }
    player.lives = Math.max(0, player.lives - 1);
    player.buffer = null;
    if (player.lives > 0) {
        player.haloDimmed = true;
        player.action = { kind: "down" };
        events.push({ type: "struckDown", atMs: state.timeMs, livesLeft: player.lives, haloDimmed: true });
    } else {
        player.action = { kind: "dead" };
        events.push({ type: "castOut", atMs: state.timeMs });
    }
}

function contactFervour(attacker: Body, target: Body, dealt: number, taken: number): void {
    if (isPlayer(attacker) && dealt > 0) gainFervour(attacker, dealt);
    if (isPlayer(target) && taken > 0) gainFervour(target, taken);
}

/** Interrupts the target unless an armored wind-up soaks the hit. */
function interrupt(target: Body, spec: AttackSpec): boolean {
    const a = target.action;
    if (a.kind === "attack" && a.spec.armored && !a.activeStarted) return false;
    setStun(target, spec.kind === "flourish" ? FLOURISH_STUN_MS : hitstunMs(target), spec.kind === "flourish" ? "flourish" : "hit");
    return true;
}

/**
 * Resolves one hit of `spec` from `attacker` on `defender`. The caller has
 * already checked reach and the attack's arc.
 */
export function resolveHit(
    state: CombatState,
    attacker: Body,
    defender: Body,
    spec: AttackSpec,
    events: CombatEvent[],
): HitOutcome {
    const atMs = state.timeMs;
    if (attacker.side === "player" || defender.side === "player") markCombat(state);

    if (isInvulnerable(defender)) {
        events.push({ type: "dodged", atMs, attackerId: attacker.id, targetId: defender.id, attackId: spec.id });
        return "dodged";
    }

    const facingAttacker = inArc(defender.pos, defender.facing, attacker.pos, GUARD_ARC_DEG);

    if (spec.parryable && facingAttacker && isParrying(defender)) {
        const auto = defender.action.kind !== "parry";
        const feel = parryFeel(defender);
        defender.parryCooldownMs = 0;
        defender.autoParryMs = isPlayer(defender) ? AUTO_PARRY_MS : 0;
        defender.posture = Math.max(0, defender.posture - feel.postureRestore);
        if (defender.action.kind === "parry") defender.action = { kind: "idle" };
        if (isPlayer(defender)) gainFervour(defender, FERVOUR_ON_PARRY);
        defender.hitStopMs = Math.max(defender.hitStopMs, HITSTOP_PARRY_MS);
        attacker.hitStopMs = Math.max(attacker.hitStopMs, HITSTOP_PARRY_MS);
        const stunMs = spec.kind === "outcry" ? 0 : parriedStunMs(attacker);
        events.push({
            type: "parried",
            atMs,
            attackerId: attacker.id,
            defenderId: defender.id,
            attackId: spec.id,
            auto,
            stunMs,
            hitStopMs: HITSTOP_PARRY_MS,
            shake: { ...SHAKE_PARRY },
        });
        if (spec.kind === "outcry") return "parried";
        const result = applyPosture(attacker, feel.postureDamage);
        if (result === "broken") {
            guardBreak(state, defender, attacker, events);
        } else {
            postPosture(state, attacker, result, events);
            setStun(attacker, stunMs, "parried");
        }
        return "parried";
    }

    if (spec.blockable && facingAttacker && isBlocking(defender)) {
        const block = defender.action.kind === "block" ? defender.action : null;
        const shaky = block?.shaky ?? false;
        const amount = spec.postureDamage * (shaky ? SHAKY_BLOCK_POSTURE_MULT : 1);
        const result = applyPosture(defender, amount);
        contactFervour(attacker, defender, FERVOUR_ON_BLOCKED_DEALT, 0);
        if (result === "broken") {
            guardBreak(state, attacker, defender, events);
            return "guardBroken";
        }
        defender.hitStopMs = Math.max(defender.hitStopMs, HITSTOP_BLOCK_MS);
        attacker.hitStopMs = Math.max(attacker.hitStopMs, HITSTOP_BLOCK_MS);
        events.push({
            type: "blocked",
            atMs,
            attackerId: attacker.id,
            targetId: defender.id,
            attackId: spec.id,
            postureDamage: amount,
            shaky,
            posture: defender.posture,
            hitStopMs: HITSTOP_BLOCK_MS,
            shake: { ...SHAKE_BLOCK },
        });
        postPosture(state, defender, result, events);
        if (shaky) setStun(defender, SHAKY_BLOCK_STUN_MS, "shakyBlock");
        return "blocked";
    }

    const exposedPosture = defender.exposedMs > 0 ? spec.postureDamage * EXPOSED_POSTURE_MULT : 0;
    const away = normalize(sub(defender.pos, attacker.pos), attacker.facing);
    const hit: Extract<CombatEvent, { type: "hit" }> = {
        type: "hit",
        atMs,
        attackerId: attacker.id,
        targetId: defender.id,
        attackId: spec.id,
        kind: spec.kind,
        damage: spec.damage,
        postureDamage: exposedPosture,
        knockback: { x: away.x * spec.knockback, y: away.y * spec.knockback },
        armored: false,
        hitStopMs: spec.hitStopMs,
        shake: { ...spec.shake },
    };
    events.push(hit);
    contactFervour(attacker, defender, FERVOUR_ON_HIT_DEALT, FERVOUR_ON_HIT_TAKEN);
    defender.hitStopMs = Math.max(defender.hitStopMs, spec.hitStopMs);
    attacker.hitStopMs = Math.max(attacker.hitStopMs, spec.hitStopMs);
    applyDamage(state, defender, spec.damage, events);
    if (isOut(defender)) return "hit";

    const postureResult = exposedPosture > 0 ? applyPosture(defender, exposedPosture) : "absorbed";
    if (postureResult === "broken") {
        guardBreak(state, attacker, defender, events);
        return "guardBroken";
    }
    postPosture(state, defender, postureResult, events);
    hit.armored = !interrupt(defender, spec);
    if (spec.knockback > 0) defender.pos = moveBy(defender.pos, away, spec.knockback);
    return "hit";
}
