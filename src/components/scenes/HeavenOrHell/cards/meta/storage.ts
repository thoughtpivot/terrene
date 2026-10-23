import { emptyMeta, META_KEY } from "../core/state.js";
import type { LocationId, MetaState, PassiveId } from "../core/types.js";

const LOCATION_IDS: LocationId[] = ["hearth", "court", "chapel", "alcove", "stall", "glade", "gate"];
const PASSIVE_IDS: PassiveId[] = ["clean-wick", "soot-wick"];

export function loadMeta(): MetaState {
    try {
        const raw = readRaw();
        if (raw === null || raw === "") return emptyMeta();
        return validateMeta(JSON.parse(raw));
    } catch {
        return emptyMeta();
    }
}

export function saveMeta(meta: MetaState): void {
    const storage = browserStorage();
    if (!storage) return;
    try {
        storage.setItem(META_KEY, JSON.stringify(meta));
    } catch {
        // A full or blocked store should not stop the descent.
    }
}

function readRaw(): string | null {
    const storage = browserStorage();
    if (!storage) return null;
    return storage.getItem(META_KEY);
}

function browserStorage(): Storage | null {
    const candidate = (globalThis as { localStorage?: Storage }).localStorage;
    if (!candidate || typeof candidate.getItem !== "function" || typeof candidate.setItem !== "function") {
        return null;
    }
    return candidate;
}

function validateMeta(value: unknown): MetaState {
    if (!value || typeof value !== "object" || Array.isArray(value)) return emptyMeta();
    const record = value as Record<string, unknown>;
    if (!Array.isArray(record.codex) || !Array.isArray(record.unlockedPassives)) return emptyMeta();
    if (record.equippedPassive !== null && record.equippedPassive !== undefined && typeof record.equippedPassive !== "string") {
        return emptyMeta();
    }

    const codex: LocationId[] = [];
    for (const id of record.codex) {
        if (isLocation(id) && codex.indexOf(id) < 0) codex.push(id);
    }

    const unlockedPassives: PassiveId[] = [];
    for (const id of record.unlockedPassives) {
        if (isPassive(id) && unlockedPassives.indexOf(id) < 0) unlockedPassives.push(id);
    }

    const equippedPassive = isPassive(record.equippedPassive) && unlockedPassives.indexOf(record.equippedPassive) >= 0
        ? record.equippedPassive
        : null;

    return { codex, unlockedPassives, equippedPassive };
}

function isLocation(value: unknown): value is LocationId {
    return typeof value === "string" && LOCATION_IDS.indexOf(value as LocationId) >= 0;
}

function isPassive(value: unknown): value is PassiveId {
    return typeof value === "string" && PASSIVE_IDS.indexOf(value as PassiveId) >= 0;
}
