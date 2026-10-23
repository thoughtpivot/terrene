/**
 * Save and load as versioned JSON. No browser APIs here: the caller writes the
 * string to localStorage under SAVE_KEY. Saving after every change means a
 * reload can never undo being struck down.
 */

import type { MetaState, Result, RunState } from "./types";
import { fail, ok } from "./types";
import { freshMeta } from "./meta";
import { DEFAULT_DIFFICULTY, DIFFICULTIES, difficultyDef } from "./tuning";

export const SAVE_KEY = "heaven-or-hell-progression";
export const SAVE_FORMAT = "heaven-or-hell-progression";
export const SAVE_VERSION = 2;

/** Version 1 runs had no difficulty and a fixed 100 minutes per tier. */
export const V1_MINUTES_PER_TIER = 100;

export interface SaveFile {
    format: typeof SAVE_FORMAT;
    version: number;
    meta: MetaState;
    run: RunState | null;
}

/** Upgrades older saves one version at a time. Index n migrates version n to n + 1. */
const MIGRATIONS: ((save: Record<string, unknown>) => Record<string, unknown>)[] = [migrateV1ToV2];

/** Gives old runs the default difficulty and rescales their clock so they keep the same corruption level. */
function migrateV1ToV2(save: Record<string, unknown>): Record<string, unknown> {
    if (!isObject(save.run)) return { ...save, version: 2 };
    const run = save.run;
    const character = isObject(run.character) ? run.character : {};
    const creation = isObject(character.creation) ? character.creation : {};
    const elapsed = typeof run.elapsedSeconds === "number" ? run.elapsedSeconds : 0;
    const scale = difficultyDef(DEFAULT_DIFFICULTY).minutesPerTier / V1_MINUTES_PER_TIER;
    return {
        ...save,
        version: 2,
        run: {
            ...run,
            difficulty: DEFAULT_DIFFICULTY,
            elapsedSeconds: elapsed * scale,
            character: { ...character, creation: { ...creation, difficulty: DEFAULT_DIFFICULTY } },
        },
    };
}

export function serializeSave(meta: MetaState, run: RunState | null): string {
    const file: SaveFile = { format: SAVE_FORMAT, version: SAVE_VERSION, meta, run };
    return JSON.stringify(file);
}

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

const RUN_NUMBERS = ["seed", "rng", "ascension", "xp", "unspentPoints", "stain", "peakStain", "visions", "feathers", "elapsedSeconds", "nextId", "trumpetProgress", "pendingTestimony"];
const RUN_ARRAYS = ["gifts", "pendingHands", "stayedHands", "hymns", "items", "witnesses", "quests", "sealedRegions", "penances"];

function runShapeError(run: Record<string, unknown>): string | null {
    for (const key of RUN_NUMBERS) if (typeof run[key] !== "number" || !Number.isFinite(run[key] as number)) return `run.${key}`;
    for (const key of RUN_ARRAYS) if (!Array.isArray(run[key])) return `run.${key}`;
    if (!isObject(run.character) || !isObject((run.character as Record<string, unknown>).attributes)) return "run.character";
    if (run.status !== "alive" && run.status !== "castOut" && run.status !== "fallen") return "run.status";
    if (!DIFFICULTIES.some((d) => d.id === run.difficulty)) return "run.difficulty";
    return null;
}

export function deserializeSave(text: string): Result<{ meta: MetaState; run: RunState | null }> {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return fail("bad-json");
    }
    if (!isObject(parsed) || parsed.format !== SAVE_FORMAT) return fail("bad-format");
    const version = parsed.version;
    if (typeof version !== "number" || !Number.isInteger(version) || version < 1) return fail("bad-version");
    if (version > SAVE_VERSION) return fail("newer-version");
    let save: Record<string, unknown> = parsed;
    for (let v = version; v < SAVE_VERSION; v++) save = MIGRATIONS[v - 1](save);
    if (!isObject(save.meta)) return fail("bad-meta");
    const meta: MetaState = { ...freshMeta(), ...(save.meta as Partial<MetaState>) };
    if (typeof meta.testimony !== "number") return fail("bad-meta");
    if (save.run === null || save.run === undefined) return ok({ meta, run: null });
    if (!isObject(save.run)) return fail("bad-run");
    const shape = runShapeError(save.run);
    if (shape) return fail(`bad-run:${shape}`);
    return ok({ meta, run: save.run as unknown as RunState });
}
