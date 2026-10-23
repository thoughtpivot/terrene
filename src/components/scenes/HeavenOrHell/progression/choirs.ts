/**
 * The eight Choirs (Deepwoken's Aspects), chosen freely at creation.
 * Each echoes a higher choir: +3 and +2 to two attributes, a signature passive,
 * two innate Gifts and a light flaw. A rare variant swaps the passive for a
 * sidegrade and is unlocked with Testimony or Remembrance. At 50 Stain the
 * Choir turns into its fallen form: same stats, passive inverted towards Hell.
 */

import type { AttributeId, ChoirId, ChoirVariantId, Effect, MetaState } from "./types";

export interface Passive {
    id: string;
    name: string;
    text: string;
    effects: Effect[];
}

export interface ChoirDef {
    id: ChoirId;
    name: string;
    echoOf: string;
    bonus: { major: AttributeId; minor: AttributeId };
    passive: Passive;
    flaw: Passive;
    innateGifts: [string, string];
    fallen: Passive & { form: string };
    variant: ChoirVariantId;
    marks: string[];
}

export type VariantUnlock = { kind: "testimony"; cost: number } | { kind: "remembrance"; mastered?: number; lore?: string; falls?: number };

export interface VariantDef {
    id: ChoirVariantId;
    choir: ChoirId;
    name: string;
    passive: Passive;
    unlock: VariantUnlock;
    /** Stain the run starts with. */
    startingStain?: number;
    /** Lowest corruption tier at which Fallen Gifts can appear. */
    fallenPoolTier?: number;
}

export const CHOIR_BONUS_MAJOR = 3;
export const CHOIR_BONUS_MINOR = 2;

export const CHOIRS: Record<ChoirId, ChoirDef> = {
    kindled: {
        id: "kindled",
        name: "Kindled",
        echoOf: "Seraphim",
        bonus: { major: "faith", minor: "voice" },
        passive: { id: "liveCoal", name: "Live Coal", text: "Your first parry after resting purges one ailment.", effects: [{ flag: "firstParryPurges" }] },
        flaw: { id: "burningBright", name: "Burning Bright", text: "Hell enemies notice you from 20% farther away.", effects: [{ stat: "detectionRangeMult", mult: 1.2 }] },
        innateGifts: ["unceasingSong", "altarBorn"],
        fallen: { id: "smoulder", form: "Smoulderer", name: "Smoulder", text: "Your first parry after resting sets Sear on you and the attacker.", effects: [{ flag: "firstParrySearsBoth" }] },
        variant: "ashenKindled",
        marks: ["coal", "tongs", "sixfold"],
    },
    fourFaced: {
        id: "fourFaced",
        name: "Four-Faced",
        echoOf: "Cherubim",
        bonus: { major: "might", minor: "steadfast" },
        passive: { id: "turningFace", name: "Turning Face", text: "Set your face at each rest: Lion, Ox, Eagle or Man.", effects: [{ flag: "turningFace" }] },
        flaw: { id: "turnedNot", name: "Turned Not", text: "You climb and turn more slowly.", effects: [{ flag: "slowTurn" }] },
        innateGifts: ["fourFaces", "brassGreaves"],
        fallen: { id: "averted", form: "Averted", name: "Averted Face", text: "Your face is set by Hell at each rest, at random.", effects: [{ flag: "randomFace" }] },
        variant: "brassShodFourFaced",
        marks: ["lion", "ox", "eagle", "man"],
    },
    wheelborn: {
        id: "wheelborn",
        name: "Wheelborn",
        echoOf: "Ophanim",
        bonus: { major: "wisdom", minor: "swiftness" },
        passive: { id: "fullOfEyes", name: "Full of Eyes", text: "Close ambushes are outlined. Bestiary progress builds 25% faster.", effects: [{ flag: "outlineAmbush" }, { flag: "bestiaryFaster" }] },
        flaw: { id: "seeingTooMuch", name: "Seeing Too Much", text: "You lose more Sanctity from horror and Hell auras.", effects: [{ stat: "sanctityLossMult", mult: 1.2 }] },
        innateGifts: ["ringedWithEyes", "berylGleam"],
        fallen: { id: "rimless", form: "Rimless", name: "Rimless", text: "Ambushes are outlined, but so are you.", effects: [{ flag: "outlineAmbush" }, { stat: "detectionRangeMult", mult: 1.15 }] },
        variant: "sapphireWheelborn",
        marks: ["beryl", "ring", "eye"],
    },
    lordling: {
        id: "lordling",
        name: "Lordling",
        echoOf: "Dominions",
        bonus: { major: "wisdom", minor: "voice" },
        passive: { id: "starReckoner", name: "Star-Reckoner", text: "Landmarks show distance; the night sky reveals the nearest Shrine.", effects: [{ flag: "landmarkDistance" }, { flag: "nightRevealsShrine" }] },
        flaw: { id: "aloof", name: "Aloof", text: "Ally angels charge more unless you pass a Voice check.", effects: [{ flag: "allyPriceUp" }] },
        innateGifts: ["starMap", "crownedBearing"],
        fallen: { id: "usurper", form: "Usurper", name: "Usurper", text: "The night sky reveals the nearest Hell market instead.", effects: [{ flag: "nightRevealsHellMarket" }] },
        variant: "polestarLordling",
        marks: ["star", "crown", "orbit"],
    },
    virtuant: {
        id: "virtuant",
        name: "Virtuant",
        echoOf: "Virtues",
        bonus: { major: "faith", minor: "swiftness" },
        passive: { id: "elementalEase", name: "Elemental Ease", text: "+1 Tongue point, and Cantors charge less.", effects: [{ flag: "cantorDiscount" }] },
        flaw: { id: "lightningRod", name: "Lightning Rod", text: "Statuses from enemy Tongues build 15% faster.", effects: [{ stat: "statusBuildupTakenMult", mult: 1.15 }] },
        innateGifts: ["stormVeined", "weatherSense"],
        fallen: { id: "tempestSworn", form: "Tempest-Sworn", name: "Tempest-Sworn", text: "Your Tongue statuses also build on you.", effects: [{ flag: "selfStatusBuildup" }] },
        variant: "hailCrownedVirtuant",
        marks: ["cloud", "bolt", "hail"],
    },
    bindborn: {
        id: "bindborn",
        name: "Bindborn",
        echoOf: "Powers",
        bonus: { major: "might", minor: "faith" },
        passive: { id: "restraint", name: "Restraint", text: "+10% posture damage to demons, not to corrupted angels.", effects: [{ stat: "demonPostureDamageMult", mult: 1.1 }] },
        flaw: { id: "markedJailer", name: "Marked Jailer", text: "Demons target you first in mixed fights.", effects: [{ flag: "demonsTargetFirst" }] },
        innateGifts: ["chainsOfLight", "wardensGrip"],
        fallen: { id: "chainbreaker", form: "Chainbreaker", name: "Chainbreaker", text: "+10% posture damage to angels instead of demons.", effects: [{ flag: "angelPostureBonus" }] },
        variant: "adamantBindborn",
        marks: ["chain", "gap-ring", "key"],
    },
    banneret: {
        id: "banneret",
        name: "Banneret",
        echoOf: "Principalities",
        bonus: { major: "voice", minor: "steadfast" },
        passive: { id: "rally", name: "Rally", text: "Nearby ally angels regain posture faster and follow longer.", effects: [{ flag: "rallyAllies" }] },
        flaw: { id: "ofTheHost", name: "Of the Host", text: "Sanctity regenerates more slowly with no ally nearby.", effects: [{ flag: "lonelySanctity" }] },
        innateGifts: ["rallyingBanner", "lanternHalo"],
        fallen: { id: "renegade", form: "Renegade", name: "Renegade", text: "Nearby demons regain posture faster instead.", effects: [{ flag: "rallyDemons" }] },
        variant: "oriflammeBanneret",
        marks: ["banner", "lantern", "tower"],
    },
    watcherKin: {
        id: "watcherKin",
        name: "Watcher-kin",
        echoOf: "Guardian Angels",
        bonus: { major: "steadfast", minor: "wisdom" },
        passive: { id: "keeper", name: "Keeper", text: "Revived allies return with more HP; you are harder to grip.", effects: [{ flag: "keeperRevive" }, { flag: "gripResist" }] },
        flaw: { id: "theOldFall", name: "The Old Fall", text: "+25% Stain gained, but Fallen Gifts are slightly stronger.", effects: [{ flag: "moreStain" }, { flag: "strongerFallenGifts" }] },
        innateGifts: ["keepersHand", "veiledSight"],
        fallen: { id: "grigori", form: "Grigori", name: "Grigori", text: "You are easier to grip, but your grips are faster.", effects: [{ flag: "fastGrip" }] },
        variant: "seventhWatcher",
        marks: ["veil", "lamp", "watchtower"],
    },
};

/** Watcher-kin's flaw: Stain gained is multiplied by this. */
export const WATCHER_KIN_STAIN_MULT = 1.25;

export const VARIANTS: Record<ChoirVariantId, VariantDef> = {
    ashenKindled: {
        id: "ashenKindled",
        choir: "kindled",
        name: "Ashen Kindled",
        passive: { id: "ashenCoal", name: "Ashen Coal", text: "Live Coal also briefly silences the attacker.", effects: [{ flag: "firstParryPurges" }, { flag: "firstParrySilences" }] },
        unlock: { kind: "testimony", cost: 40 },
    },
    brassShodFourFaced: {
        id: "brassShodFourFaced",
        choir: "fourFaced",
        name: "Brass-Shod Four-Faced",
        passive: { id: "brassShod", name: "Brass-Shod", text: "Immune to knockdown, but no Eagle face.", effects: [{ flag: "turningFace" }, { flag: "noEagleFace" }, { flag: "knockdownImmune" }] },
        unlock: { kind: "testimony", cost: 40 },
    },
    sapphireWheelborn: {
        id: "sapphireWheelborn",
        choir: "wheelborn",
        name: "Sapphire Wheelborn",
        passive: { id: "sapphireRings", name: "Sapphire Rings", text: "Shows the cooldowns of hostile casters.", effects: [{ flag: "showCasterCooldowns" }, { flag: "bestiaryFaster" }] },
        unlock: { kind: "remembrance", mastered: 5 },
    },
    polestarLordling: {
        id: "polestarLordling",
        choir: "lordling",
        name: "Polestar Lordling",
        passive: { id: "polestar", name: "Polestar", text: "The compass always points to the nearest unsealed breach.", effects: [{ flag: "compassToBreach" }] },
        unlock: { kind: "remembrance", lore: "dominions-chart" },
    },
    hailCrownedVirtuant: {
        id: "hailCrownedVirtuant",
        choir: "virtuant",
        name: "Hail-Crowned Virtuant",
        passive: { id: "hailCrown", name: "Hail Crown", text: "No Tongue point, but your Tongue statuses build 10% faster.", effects: [{ flag: "tongueStatusFaster" }] },
        unlock: { kind: "testimony", cost: 40 },
    },
    adamantBindborn: {
        id: "adamantBindborn",
        choir: "bindborn",
        name: "Adamant Bindborn",
        passive: { id: "adamant", name: "Adamant", text: "+10% posture damage to corrupted angels instead of demons.", effects: [{ flag: "corruptedAngelPostureBonus" }] },
        unlock: { kind: "remembrance", mastered: 10 },
    },
    oriflammeBanneret: {
        id: "oriflammeBanneret",
        choir: "banneret",
        name: "Oriflamme Banneret",
        passive: { id: "oriflamme", name: "Oriflamme", text: "Allies deal more damage but no longer follow you farther.", effects: [{ flag: "alliesDamageUp" }] },
        unlock: { kind: "testimony", cost: 40 },
    },
    seventhWatcher: {
        id: "seventhWatcher",
        choir: "watcherKin",
        name: "Seventh Watcher",
        passive: { id: "seventhWatch", name: "Seventh Watch", text: "Starts with 10 Stain; Fallen Gifts can appear from Tier 1.", effects: [{ flag: "keeperRevive" }, { flag: "gripResist" }] },
        unlock: { kind: "remembrance", falls: 1 },
        startingStain: 10,
        fallenPoolTier: 1,
    },
};

export const CHOIR_IDS = Object.keys(CHOIRS) as ChoirId[];

/** Mastered bestiary entries, for Remembrance unlocks. Provided by meta.ts to avoid a cycle. */
export function variantRemembranceMet(unlock: VariantUnlock, meta: MetaState, masteredCount: number): boolean {
    if (unlock.kind !== "remembrance") return false;
    if (unlock.mastered !== undefined && masteredCount < unlock.mastered) return false;
    if (unlock.lore !== undefined && !meta.lore.includes(unlock.lore)) return false;
    if (unlock.falls !== undefined && meta.falls < unlock.falls) return false;
    return true;
}
