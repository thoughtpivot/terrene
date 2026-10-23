/**
 * Save and load as versioned JSON, and the save slots built on it. No browser
 * APIs here: slot functions take a SlotStorage, which localStorage satisfies.
 * Saving after every change means a reload can never undo being struck down.
 */

import type { CorruptionTier, CreationInput, DifficultyId, MetaState, Result, RunState, RunStatus } from "./types";
import { fail, forwardFail, ok } from "./types";
import { freshMeta } from "./meta";
import { DEFAULT_DIFFICULTY, DIFFICULTIES, SAVE_SLOT_COUNT, difficultyDef } from "./tuning";
import { CHOIRS, VARIANTS } from "./choirs";
import { tierOf } from "./corruption";
import { buildRun } from "./creation";

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
    /** Epoch milliseconds of the last save. Missing on single saves from before slots. */
    savedAt?: number;
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

export function serializeSave(meta: MetaState, run: RunState | null, savedAt?: number): string {
    const file: SaveFile = { format: SAVE_FORMAT, version: SAVE_VERSION, meta, run };
    if (savedAt !== undefined) file.savedAt = savedAt;
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

export interface LoadedSave {
    meta: MetaState;
    run: RunState | null;
    savedAt: number | null;
}

export function deserializeSave(text: string): Result<LoadedSave> {
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
    const savedAt = typeof save.savedAt === "number" && Number.isFinite(save.savedAt) ? save.savedAt : null;
    if (save.run === null || save.run === undefined) return ok({ meta, run: null, savedAt });
    if (!isObject(save.run)) return fail("bad-run");
    const shape = runShapeError(save.run);
    if (shape) return fail(`bad-run:${shape}`);
    return ok({ meta, run: save.run as unknown as RunState, savedAt });
}

// ---------------------------------------------------------------------------
// Save slots. Each slot holds its own run and its own meta (Testimony,
// Remembrance), so a wipe in one slot never touches another.

/** The subset of the Web Storage API the slots need. `window.localStorage` fits. */
export interface SlotStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

/** Bump when the slot key layout changes. The file inside keeps its own SAVE_VERSION. */
export const SLOT_KEY_VERSION = 1;

export type SlotId = string;

/** Slot ids in menu order: "A", "B", "C" for three slots. The id is also the label. */
export const SLOT_IDS: readonly SlotId[] = Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => String.fromCharCode(65 + i));

export function isSlotId(id: string): boolean {
    return SLOT_IDS.indexOf(id) >= 0;
}

export function slotKey(id: SlotId): string {
    return `${SAVE_KEY}:slot-v${SLOT_KEY_VERSION}:${id}`;
}

/** "bright" or "dimmed" while alive, otherwise the run's end state. */
export type SlotLife = "bright" | "dimmed" | Exclude<RunStatus, "alive">;

export type SlotSummary =
    | { id: SlotId; label: string; state: "empty" }
    /** Readable data but no run: a new character starts here and keeps the slot's meta. */
    | { id: SlotId; label: string; state: "noCharacter"; testimony: number; lastPlayed: number | null }
    | {
          id: SlotId;
          label: string;
          state: "character";
          /** The variant's name when the angel has one, otherwise the Choir's. */
          choirName: string;
          difficulty: DifficultyId;
          difficultyName: string;
          tier: CorruptionTier;
          playSeconds: number;
          life: SlotLife;
          lastPlayed: number | null;
      }
    /** Unreadable data. Offer delete; `error` is the deserializeSave code. */
    | { id: SlotId; label: string; state: "corrupt"; error: string };

/** The error code of a failed result, or null. Spelled out because the webpack build lacks strictNullChecks narrowing. */
function errorCode(result: Result<unknown>): string | null {
    return result.ok ? null : (result as { error: string }).error;
}

function summarize(id: SlotId, text: string | null): SlotSummary {
    if (text === null) return { id, label: id, state: "empty" };
    const loaded = deserializeSave(text);
    if (!loaded.ok) return { id, label: id, state: "corrupt", error: errorCode(loaded) as string };
    const { meta, run, savedAt } = loaded.value;
    if (!run) return { id, label: id, state: "noCharacter", testimony: meta.testimony, lastPlayed: savedAt };
    const variant = run.character.variant;
    return {
        id,
        label: id,
        state: "character",
        choirName: variant ? VARIANTS[variant].name : CHOIRS[run.character.choir].name,
        difficulty: run.difficulty,
        difficultyName: difficultyDef(run.difficulty).name,
        tier: tierOf(run),
        playSeconds: run.elapsedSeconds,
        life: run.status === "alive" ? run.halo : run.status,
        lastPlayed: savedAt,
    };
}

export type LegacyMigration = "none" | "migrated" | "slotOccupied" | "unreadable";

/**
 * Moves the pre-slot single save (SAVE_KEY) into slot A, keeping its meta and
 * run, then removes the old key. Leaves the old key alone if slot A already
 * holds data or the old save can't be read. Safe to call on every start.
 */
export function migrateLegacySave(storage: SlotStorage): LegacyMigration {
    const legacy = storage.getItem(SAVE_KEY);
    if (legacy === null) return "none";
    const first = SLOT_IDS[0];
    if (storage.getItem(slotKey(first)) !== null) return "slotOccupied";
    const loaded = deserializeSave(legacy);
    if (!loaded.ok) return "unreadable";
    const { meta, run, savedAt } = loaded.value;
    storage.setItem(slotKey(first), serializeSave(meta, run, savedAt === null ? undefined : savedAt));
    storage.removeItem(SAVE_KEY);
    return "migrated";
}

/** One summary per slot, in order, for the slot-select screen. Migrates a legacy save first. */
export function listSlots(storage: SlotStorage): SlotSummary[] {
    migrateLegacySave(storage);
    return SLOT_IDS.map((id) => summarize(id, storage.getItem(slotKey(id))));
}

/** Loads a slot to continue it. Fails with "empty-slot" when nothing is stored. */
export function loadSlot(storage: SlotStorage, id: SlotId): Result<LoadedSave> {
    if (!isSlotId(id)) return fail("bad-slot");
    migrateLegacySave(storage);
    const text = storage.getItem(slotKey(id));
    if (text === null) return fail("empty-slot");
    return deserializeSave(text);
}

/** Writes a slot. Call after every change, with the wall-clock time for "last played". */
export function saveSlot(storage: SlotStorage, id: SlotId, meta: MetaState, run: RunState | null, now: number): Result<true> {
    if (!isSlotId(id)) return fail("bad-slot");
    storage.setItem(slotKey(id), serializeSave(meta, run, now));
    return ok(true);
}

/** Erases a slot's run and its meta. Other slots are untouched. */
export function deleteSlot(storage: SlotStorage, id: SlotId): Result<true> {
    if (!isSlotId(id)) return fail("bad-slot");
    storage.removeItem(slotKey(id));
    return ok(true);
}

/** The meta that character creation should validate against for this slot. */
export function slotMeta(storage: SlotStorage, id: SlotId): Result<MetaState> {
    const loaded = loadSlot(storage, id);
    if (loaded.ok) return ok(loaded.value.meta);
    return errorCode(loaded) === "empty-slot" ? ok(freshMeta()) : forwardFail(loaded);
}

/**
 * Kindles a new character into a slot that is empty or has no run, using and
 * keeping that slot's meta, and saves it. Fails with "slot-occupied" while the
 * slot still holds a run (delete it, or wipe it, first).
 */
export function startCharacterInSlot(storage: SlotStorage, id: SlotId, input: CreationInput, seed: number, now: number): Result<LoadedSave> {
    const loaded = loadSlot(storage, id);
    if (loaded.ok && loaded.value.run) return fail("slot-occupied");
    if (!loaded.ok && errorCode(loaded) !== "empty-slot") return forwardFail(loaded);
    const meta = loaded.ok ? loaded.value.meta : freshMeta();
    const built = buildRun(input, meta, seed);
    if (!built.ok) return forwardFail(built);
    storage.setItem(slotKey(id), serializeSave(meta, built.value, now));
    return ok({ meta, run: built.value, savedAt: now });
}
