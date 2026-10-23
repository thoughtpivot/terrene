/**
 * Boons and Burdens (Deepwoken's Boons and Flaws). At creation, pick one or
 * two of each. A heavy Burden counts as two, so it can carry two Boons.
 * Tarnished is never picked: the Mercy Seat gives it for a Trumpet reroll.
 */

import type { BoonId, BurdenId, Effect } from "./types";

export interface BoonDef {
    id: BoonId;
    name: string;
    text: string;
    effects: Effect[];
    exclusive?: BurdenId[];
}

export interface BurdenDef {
    id: BurdenId;
    name: string;
    text: string;
    effects: Effect[];
    /** How many Boons it pays for. */
    weight: number;
    selectable: boolean;
}

export const MIN_BOONS = 1;
export const MAX_BOONS = 2;
export const MIN_BURDENS = 1;
export const MAX_BURDENS = 2;

export const BOONS: Record<BoonId, BoonDef> = {
    tirelessWing: { id: "tirelessWing", name: "Tireless Wing", text: "More glide stamina.", effects: [{ stat: "glideStaminaMult", mult: 1.25 }], exclusive: ["clipped"] },
    psalmist: { id: "psalmist", name: "Psalmist", text: "An extra Feather on every other Hymn Draw.", effects: [] },
    unseen: { id: "unseen", name: "Unseen", text: "Better stealth.", effects: [{ stat: "stealthMult", mult: 1.2 }], exclusive: ["tarnishedHalo"] },
    lampBearer: { id: "lampBearer", name: "Lamp-Bearer", text: "Grace regenerates 15% faster.", effects: [{ stat: "graceRegenMult", mult: 1.15 }] },
    quickStudy: { id: "quickStudy", name: "Quick Study", text: "+10% experience.", effects: [], exclusive: ["unlettered"] },
};

export const BURDENS: Record<BurdenId, BurdenDef> = {
    clipped: { id: "clipped", name: "Clipped", text: "No air dash.", effects: [{ flag: "noAirDash" }], weight: 1, selectable: true },
    doubting: { id: "doubting", name: "Doubting", text: "More Sanctity damage.", effects: [{ stat: "sanctityLossMult", mult: 1.25 }], weight: 1, selectable: true },
    tarnishedHalo: { id: "tarnishedHalo", name: "Tarnished Halo", text: "Enemies spot you more easily.", effects: [{ stat: "detectionRangeMult", mult: 1.15 }], weight: 1, selectable: true },
    unlettered: { id: "unlettered", name: "Unlettered", text: "Slower experience and fewer Visions. Counts as two.", effects: [], weight: 2, selectable: true },
    heavyHearted: { id: "heavyHearted", name: "Heavy-Hearted", text: "Fervour builds 15% slower.", effects: [{ flag: "slowFervour" }], weight: 1, selectable: true },
    tarnished: { id: "tarnished", name: "Tarnished", text: "Trumpet Progress builds 20% slower.", effects: [{ flag: "tarnished" }], weight: 1, selectable: false },
};

export function burdenWeight(burdens: readonly BurdenId[]): number {
    return burdens.reduce((sum, id) => sum + BURDENS[id].weight, 0);
}
