import type { PassiveId } from "../core/types.js";

export const PASSIVES: Record<PassiveId, { id: PassiveId; name: string; text: string }> = {
    "clean-wick": {
        id: "clean-wick",
        name: "Clean Wick",
        text: "One core Wick starts future runs with +1 Heaven damage.",
    },
    "soot-wick": {
        id: "soot-wick",
        name: "Soot Wick",
        text: "Hell Wicks deal +1 more. The next run starts at 1 Ash.",
    },
};
