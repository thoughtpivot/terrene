/**
 * The wipe. Heaven resets entirely: the character, build, Visions, Stain,
 * corruption clock and sealed regions are gone. Testimony is paid out
 * (times the Penance multiplier) and Remembrance stays.
 */

import type { MetaState, Result, RunState, TongueId, VowId } from "./types";
import { fail, ok } from "./types";
import { RELIQUARY_COST } from "./tuning";
import { TONGUES } from "./tongues";
import { learnTongueForAccount, roundHundredths, testimonyPayout } from "./meta";
import { buildRun } from "./creation";

export type WipeCause = "castOut" | "fallen" | "abandoned";

export interface WipeOptions {
    /** Seed for the fresh run. */
    seed: number;
    /** Pass one anointed item down through the Reliquary, for Testimony. */
    reliquaryItemId?: string;
}

export interface WipeResult {
    meta: MetaState;
    payout: number;
    cause: WipeCause;
    /** The angel rekindled with the same creation choices in a fresh Heaven, or null if they no longer validate. */
    fresh: RunState | null;
}

export function wipeCause(run: RunState): WipeCause {
    return run.status === "alive" ? "abandoned" : run.status;
}

/** The meta state after a wipe, without building the next run. */
export function settleMeta(run: RunState, meta: MetaState, reliquaryItemId?: string): Result<{ meta: MetaState; payout: number }> {
    const payout = testimonyPayout(run);
    let next: MetaState = {
        ...meta,
        testimony: roundHundredths(meta.testimony + payout),
        lifetimeTestimony: roundHundredths(meta.lifetimeTestimony + payout),
        runs: meta.runs + 1,
        falls: meta.falls + (run.status === "fallen" ? 1 : 0),
        reliquary: null,
    };
    const completed = run.witnesses.filter((w) => w.startsWith("vowCompleted:")).map((w) => w.slice("vowCompleted:".length) as VowId);
    for (const vow of completed) if (!next.progressedVows.includes(vow)) next = { ...next, progressedVows: [...next.progressedVows, vow] };
    for (const id of Object.keys(TONGUES) as TongueId[]) {
        const quest = TONGUES[id].unlockQuest;
        if (quest && run.quests.includes(quest)) next = learnTongueForAccount(next, id);
    }
    if (reliquaryItemId) {
        const item = run.items.find((i) => i.id === reliquaryItemId);
        if (!item) return fail("no-item");
        if (!item.anointing) return fail("not-anointed");
        if (next.testimony < RELIQUARY_COST) return fail("not-enough-testimony");
        next = { ...next, testimony: roundHundredths(next.testimony - RELIQUARY_COST), reliquary: { ...item, soulbound: false } };
    }
    return ok({ meta: next, payout });
}

export function wipe(run: RunState, meta: MetaState, options: WipeOptions): Result<WipeResult> {
    const settled = settleMeta(run, meta, options.reliquaryItemId);
    if (!settled.ok) return settled;
    const fresh = buildRun(run.character.creation, settled.value.meta, options.seed);
    return ok({ meta: settled.value.meta, payout: settled.value.payout, cause: wipeCause(run), fresh: fresh.ok ? fresh.value : null });
}
