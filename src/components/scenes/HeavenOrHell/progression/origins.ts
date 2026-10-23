/**
 * Origins: where the angel was made. Spawn, starting gear, allegiance and a
 * progression bonus. Solo-adapted: every ally and rival is an NPC.
 * The Outer Courts are open from the start; the rest cost Testimony.
 */

import type { OriginId } from "./types";
import { ORIGIN_UNLOCK_COST } from "./tuning";

export interface OriginDef {
    id: OriginId;
    name: string;
    spawn: string;
    allegiance: string;
    startingGear: string[];
    gift: string;
    bonus: string;
    /** Testimony to unlock. Zero means open from the start. */
    unlockCost: number;
}

export const ORIGINS: Record<OriginId, OriginDef> = {
    outerCourts: {
        id: "outerCourts",
        name: "The Outer Courts",
        spawn: "outerCourts",
        allegiance: "none",
        startingGear: [],
        gift: "commonClay",
        bonus: "The most common starting zone, with basic gear.",
        unlockCost: 0,
    },
    loneVigil: {
        id: "loneVigil",
        name: "The Lone Vigil",
        spawn: "vigilTrial",
        allegiance: "none",
        startingGear: [],
        gift: "markOfTheVigil",
        bonus: "Spawn inside a trial; clearing it grants Mark of the Vigil.",
        unlockCost: ORIGIN_UNLOCK_COST.loneVigil,
    },
    breachWarden: {
        id: "breachWarden",
        name: "Breach-Warden",
        spawn: "breachEdge",
        allegiance: "wardens",
        startingGear: ["recallFeather"],
        gift: "wardensRecall",
        bonus: "More experience inside Hell breaches, less outside.",
        unlockCost: ORIGIN_UNLOCK_COST.breachWarden,
    },
    hostOfTheGate: {
        id: "hostOfTheGate",
        name: "Host of the Gate",
        spawn: "gateOfEden",
        allegiance: "cherubimGuard",
        startingGear: ["guardTabard"],
        gift: "gateEnsign",
        bonus: "Ranks and NPC ally angels at the Gate; leaving your post too long brands you a deserter.",
        unlockCost: ORIGIN_UNLOCK_COST.hostOfTheGate,
    },
    scribeOfNames: {
        id: "scribeOfNames",
        name: "Scribe of Names",
        spawn: "archive",
        allegiance: "archive",
        startingGear: ["reedPen"],
        gift: "scribesLedger",
        bonus: "Progress through the archive's commissions and boards.",
        unlockCost: ORIGIN_UNLOCK_COST.scribeOfNames,
    },
    penitent: {
        id: "penitent",
        name: "The Penitent",
        spawn: "penitentsCell",
        allegiance: "penitents",
        startingGear: ["bountyLedger"],
        gift: "penitentsLedger",
        bonus: "Hunt marked corrupted angels (NPCs) for bounties.",
        unlockCost: ORIGIN_UNLOCK_COST.penitent,
    },
};
