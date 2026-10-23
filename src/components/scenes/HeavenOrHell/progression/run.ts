/**
 * Run-level rules: Visions, the two lives, quests and boss kills.
 * Lives: the first time you're struck down your halo dims; the second
 * casts you out and wipes the run. Altars and Ascension restore the halo.
 */

import type { Result, RunState } from "./types";
import { fail, ok } from "./types";
import { UNLETTERED_VISIONS_MULT, VISIONS_FIRST_BOSS_KILL, VISIONS_REPEAT_BOSS_KILL } from "./tuning";
import { scaleCost, scaleReward, tierOf } from "./corruption";
import { answerThrone, addTrumpetProgress, throneWouldAnswer } from "./trumpets";
import { recordWitness } from "./meta";

/** Earns Visions: scaled up by the tier, down by the Unlettered Burden. */
export function earnVisions(run: RunState, base: number): RunState {
    if (run.status !== "alive" || base <= 0) return run;
    let amount = scaleReward(base, tierOf(run));
    if (run.character.burdens.includes("unlettered")) amount = Math.floor(amount * UNLETTERED_VISIONS_MULT);
    return { ...run, visions: run.visions + amount };
}

/** Spends Visions. With `scaled`, the price rises with the corruption tier. */
export function spendVisions(run: RunState, base: number, scaled = true): Result<RunState> {
    if (run.status !== "alive") return fail("run-over");
    const cost = scaled ? scaleCost(base, tierOf(run)) : base;
    if (run.visions < cost) return fail("not-enough-visions");
    return ok({ ...run, visions: run.visions - cost });
}

export type StrikeOutcome = "throne" | "dimmed" | "castOut";

/**
 * HP reached zero. Inside a breach with full Trumpet Progress the Throne
 * answers instead. Otherwise a bright halo dims, and a dimmed halo is the end.
 */
export function strikeDown(run: RunState, context: { inBreach: boolean }): { run: RunState; outcome: StrikeOutcome } {
    if (run.status !== "alive") return { run, outcome: "castOut" };
    if (throneWouldAnswer(run, context.inBreach)) return { run: answerThrone(run), outcome: "throne" };
    if (run.halo === "bright") return { run: { ...run, halo: "dimmed" }, outcome: "dimmed" };
    return { run: { ...run, status: "castOut" }, outcome: "castOut" };
}

export function restoreHalo(run: RunState): RunState {
    return run.status === "alive" ? { ...run, halo: "bright" } : run;
}

export function livesLeft(run: RunState): number {
    if (run.status !== "alive") return 0;
    return run.halo === "bright" ? 2 : 1;
}

export function completeQuest(run: RunState, quest: string): RunState {
    return run.quests.includes(quest) ? run : { ...run, quests: [...run.quests, quest] };
}

/** A boss kill: Visions (more the first time), Trumpet Progress and a Witness. */
export function recordBossKill(run: RunState, boss: string): RunState {
    if (run.status !== "alive") return run;
    const first = !run.bossesDefeated.includes(boss);
    let next = earnVisions(run, first ? VISIONS_FIRST_BOSS_KILL : VISIONS_REPEAT_BOSS_KILL);
    if (first) next = { ...next, bossesDefeated: [...next.bossesDefeated, boss] };
    next = addTrumpetProgress(next, "bossKill");
    return recordWitness(next, `defeated:${boss}`);
}

export function recordBreachCleared(run: RunState): RunState {
    return recordWitness(addTrumpetProgress(run, "breachCleared"), "sealedBreach");
}

export function nextId(run: RunState): { id: number; run: RunState } {
    return { id: run.nextId, run: { ...run, nextId: run.nextId + 1 } };
}
