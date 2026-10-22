import type { CardInstance, Effect, RunState, Side } from "./types.js";
import { CARD_DEFS } from "../content/index.js";
import { shuffleWithRng } from "./rng.js";

export function enemyHit(run: RunState, baseIntent: number): number {
    return Math.max(0, baseIntent + run.ash + 2 * run.crack - run.guard);
}

export function resolveEnemyPhase(run: RunState): RunState {
    let hp = run.hp;
    const log = run.log.slice();
    for (const enemy of run.enemies) {
        if (enemy.hp <= 0) continue;
        const damage = enemyHit(run, enemy.intent);
        hp = Math.max(0, hp - damage);
        log.push(`${enemy.name} hits for ${damage}.`);
    }
    return { ...run, hp, log, guard: 0 };
}

export function drawCards(run: RunState, n: number): RunState {
    let drawPile = run.drawPile;
    let discard = run.discard;
    const hand = run.hand.slice();
    let rngState = run.rngState;
    let drew = false;

    for (let i = 0; i < n; i++) {
        if (drawPile.length === 0) {
            if (discard.length === 0) break;
            const shuffled = shuffleWithRng(discard, rngState);
            drawPile = shuffled.items;
            rngState = shuffled.rngState;
            discard = [];
        }
        if (drawPile === run.drawPile) drawPile = drawPile.slice();
        const card = drawPile.shift();
        if (!card) break;
        hand.push(card);
        drew = true;
    }

    if (!drew && discard === run.discard) return run;
    return { ...run, drawPile, discard, hand, rngState };
}

export function startPlayerTurn(run: RunState): RunState {
    const refilled: RunState = { ...run, lamp: run.lampMax };
    if (refilled.hand.length === 0) return drawCards(refilled, 3);
    return refilled;
}

export function playCard(run: RunState, instanceId: string, side: Side, targetId?: string): RunState {
    const index = run.hand.findIndex((card) => card.instanceId === instanceId);
    if (index < 0) return run;

    const card = run.hand[index];
    const def = CARD_DEFS[card.cardId];
    if (!def) return run;
    if (def.cost > run.lamp) {
        return { ...run, log: [...run.log, "Not enough Lamp."] };
    }

    let next: RunState = {
        ...run,
        lamp: run.lamp - def.cost,
        hand: [...run.hand.slice(0, index), ...run.hand.slice(index + 1)],
        discard: [...run.discard, card],
        log: run.log.slice(),
    };

    const effects = side === "heaven" ? def.heaven : def.hell;
    for (const effect of effects) {
        next = applyEffect(next, effect, scaledAmount(card, effect.amount, side), def.name, targetId);
    }

    if (side === "hell") {
        next = { ...next, ash: next.ash + 1 };
    }

    if (next.phase === "combat" && next.enemies.length > 0 && next.enemies.every((enemy) => enemy.hp <= 0)) {
        next = {
            ...next,
            phase: "result",
            result: next.ash <= 1 ? "heaven" : "hell",
        };
    }

    return next;
}

export function endTurn(run: RunState): RunState {
    let next: RunState = { ...run, lamp: 0 };
    const enemiesLive = next.enemies.some((enemy) => enemy.hp > 0);
    if (next.phase === "combat" && enemiesLive) {
        next = resolveEnemyPhase(next);
    }
    if (next.hp <= 0) {
        return { ...next, phase: "result", result: "dead" };
    }
    next = {
        ...next,
        discard: [...next.discard, ...next.hand],
        hand: [],
        turn: next.turn + 1,
        guard: 0,
    };
    next = drawCards(next, 3);
    return { ...next, lamp: next.lampMax, guard: 0 };
}

function scaledAmount(card: CardInstance, base: number, side: Side): number {
    if (side === "heaven") {
        return Math.trunc(base + card.heavenBonus + card.combatBonus + (card.cleanWick ? 1 : 0));
    }
    return Math.trunc(base + card.hellBonus + card.combatBonus);
}

function applyEffect(run: RunState, effect: Effect, amount: number, cardName: string, targetId?: string): RunState {
    switch (effect.kind) {
        case "damage":
            return effect.target === "all"
                ? damageAll(run, amount, cardName)
                : damageOne(run, amount, cardName, targetId);
        case "guard":
            return { ...run, guard: amount, log: [...run.log, `${cardName} sets guard to ${amount}.`] };
        case "lamp":
            return { ...run, lamp: run.lamp + amount, log: [...run.log, `${cardName} adds ${amount} Lamp.`] };
        case "heal":
            return {
                ...run,
                hp: Math.min(run.maxHp, run.hp + amount),
                log: [...run.log, `${cardName} heals ${amount}.`],
            };
        case "buff-hand":
            return buffHand(run, amount, cardName, targetId);
        default:
            return run;
    }
}

function damageOne(run: RunState, amount: number, cardName: string, targetId?: string): RunState {
    const enemy = run.enemies.find((candidate) => candidate.id === targetId && candidate.hp > 0);
    if (!enemy) return { ...run, log: [...run.log, "No target."] };
    return {
        ...run,
        enemies: run.enemies.map((candidate) =>
            candidate.id === enemy.id ? { ...candidate, hp: Math.max(0, candidate.hp - amount) } : candidate,
        ),
        log: [...run.log, `${cardName} deals ${amount} to ${enemy.name}.`],
    };
}

function damageAll(run: RunState, amount: number, cardName: string): RunState {
    const log = run.log.slice();
    const enemies = run.enemies.map((enemy) => {
        if (enemy.hp <= 0) return enemy;
        log.push(`${cardName} deals ${amount} to ${enemy.name}.`);
        return { ...enemy, hp: Math.max(0, enemy.hp - amount) };
    });
    return { ...run, enemies, log };
}

function buffHand(run: RunState, amount: number, cardName: string, targetId?: string): RunState {
    const target = targetId ? run.hand.find((card) => card.instanceId === targetId) : undefined;
    if (!target) return { ...run, log: [...run.log, "No card to buff."] };
    return {
        ...run,
        hand: run.hand.map((card) =>
            card.instanceId === target.instanceId ? { ...card, combatBonus: card.combatBonus + amount } : card,
        ),
        log: [...run.log, `${cardName} gives ${target.instanceId} +${amount} this combat.`],
    };
}
