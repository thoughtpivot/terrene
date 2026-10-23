/**
 * Starting values chosen where the design docs give no number.
 * Every value here is a first guess for playtesting, not a decision.
 * Numbers the designer fixed (15 creation points, caps of 75 and 100,
 * 15 points per Ascension, 2 and 1.5 Grace per point, Stain thresholds,
 * shrine prices from the doc) live next to the rules that use them.
 */

import type { CorruptionTier, DifficultyId, GiftRarity, TrumpetRarity } from "./types";

/** Points that Tongue-takers must place in their Tongues, so every build reaches 330. */
export const TONGUE_BOUND_CREATION_POINTS = 10;

export const BASE_HP = 100;
export const HP_PER_STEADFAST = 2;
export const BASE_GRACE = 40;
export const BASE_SANCTITY = 100;
export const SANCTITY_PER_FAITH = 1;
export const BASE_FERVOUR = 100;
export const FERVOUR_PER_FAITH = 0.5;
export const BASE_AIR_DASHES = 1;

/** Experience for Ascension n is XP_BASE * n^XP_EXPONENT, times the tier's cost multiplier. */
export const XP_BASE = 100;
export const XP_EXPONENT = 1.35;

export const VISIONS_PER_ASCENSION = 1;
export const VISIONS_FIRST_BOSS_KILL = 3;
export const VISIONS_REPEAT_BOSS_KILL = 1;

/** Ascensions that also grant a Hymn Draw. */
export const HYMN_DRAW_ASCENSIONS: readonly number[] = [1, 4, 7, 10, 13, 16, 19];
export const HYMN_DRAW_SIZE = 3;
export const LESSER_GIFT_HANDS = 2;

export const HAND_SIZE_MIN = 4;
export const HAND_SIZE_MAX = 5;
export const FIVE_CARD_CHANCE = 0.35;
export const RARES_PER_HAND = 2;
export const ADVANCED_CHANCE = 0.25;
export const STAY_CHANCE = 0.2;
export const SANCTIFIED_WEIGHT_FROM_TIER_2 = 2;
export const STARTING_FEATHERS = 0;
/** One Feather every N Ascensions. */
export const FEATHER_EVERY_ASCENSIONS = 5;

export const HYMN_STAR_REQUIREMENT: Record<1 | 2 | 3, number> = { 1: 10, 2: 25, 3: 40 };
export const HYMN_BASE_GRACE: Record<1 | 2 | 3, number> = { 1: 15, 2: 25, 3: 40 };
/** Each Altar Coal adds this fraction of the base Grace cost. Seals add nothing. */
export const COAL_GRACE_COST_STEP = 0.15;
export const MAX_COALS_PER_HYMN = 2;
export const MAX_SEALS_PER_HYMN = 1;

export const STAIN_AMOUNTS = {
    demonHeart: 8,
    brandAccepted: 10,
    fallenGift: 5,
    brimstoneOutcry: 1,
    abyssalTrumpet: 3,
    forbiddenVow: 10,
};

/** Corruption points per tier. Tier 5 at 500 points. The pace comes from the difficulty. */
export const CORRUPTION_POINTS_PER_TIER = 100;

export interface DifficultyDef {
    id: DifficultyId;
    name: string;
    subtitle: string;
    epigraph: { text: string; ref: string };
    /** Picker accent, from white Heaven to red Hell. */
    accent: "white" | "gold" | "orange" | "red";
    /** Minutes of play per Corruption Tier. Shorter means a shorter, easier run. */
    minutesPerTier: number;
    /** Multiplies the tier's enemy scaling. */
    enemy: { hp: number; posture: number; damage: number; aggression: number };
    stainGainMult: number;
    /** Added to the tier's weapon and loot tier. */
    lootTierBonus: number;
}

/** Ordered easiest to hardest. Son of the Morning keeps the original 100-minute pace. */
export const DIFFICULTIES: readonly DifficultyDef[] = [
    {
        id: "stillWaters",
        name: "Still Waters",
        subtitle: "A short watch, gently kept",
        epigraph: { text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.", ref: "Psalm 23:2" },
        accent: "white",
        minutesPerTier: 40,
        enemy: { hp: 0.7, posture: 0.8, damage: 0.7, aggression: 0.8 },
        stainGainMult: 0.75,
        lootTierBonus: 0,
    },
    {
        id: "narrowWay",
        name: "The Narrow Way",
        subtitle: "The road as it was meant to be walked",
        epigraph: { text: "Strait is the gate, and narrow is the way, which leadeth unto life, and few there be that find it.", ref: "Matthew 7:14" },
        accent: "gold",
        minutesPerTier: 60,
        enemy: { hp: 1, posture: 1, damage: 1, aggression: 1 },
        stainGainMult: 1,
        lootTierBonus: 0,
    },
    {
        id: "furnaceOfAffliction",
        name: "The Furnace of Affliction",
        subtitle: "A longer siege, refined by fire",
        epigraph: { text: "Behold, I have refined thee, but not with silver; I have chosen thee in the furnace of affliction.", ref: "Isaiah 48:10" },
        accent: "orange",
        minutesPerTier: 80,
        enemy: { hp: 1.25, posture: 1.15, damage: 1.2, aggression: 1.15 },
        stainGainMult: 1.15,
        lootTierBonus: 1,
    },
    {
        id: "sonOfTheMorning",
        name: "Son of the Morning",
        subtitle: "The longest war, against the fallen star",
        epigraph: { text: "How art thou fallen from heaven, O Lucifer, son of the morning!", ref: "Isaiah 14:12" },
        accent: "red",
        minutesPerTier: 100,
        enemy: { hp: 1.5, posture: 1.3, damage: 1.4, aggression: 1.3 },
        stainGainMult: 1.3,
        lootTierBonus: 1,
    },
];

export const DEFAULT_DIFFICULTY: DifficultyId = "narrowWay";

export function difficultyDef(id: DifficultyId): DifficultyDef {
    const def = DIFFICULTIES.find((d) => d.id === id);
    if (!def) throw new Error(`unknown difficulty ${id}`);
    return def;
}

export interface TierScaling {
    enemyHp: number;
    enemyPosture: number;
    enemyDamage: number;
    enemyAggression: number;
    weaponTier: number;
    lootTier: number;
    /** Multiplies experience needed and Vision prices. */
    costMult: number;
    /** Multiplies experience and Visions earned. */
    rewardMult: number;
}

export const TIER_SCALING: Record<CorruptionTier, TierScaling> = {
    0: { enemyHp: 1, enemyPosture: 1, enemyDamage: 1, enemyAggression: 1, weaponTier: 1, lootTier: 1, costMult: 1, rewardMult: 1 },
    1: { enemyHp: 1.15, enemyPosture: 1.15, enemyDamage: 1.1, enemyAggression: 1.1, weaponTier: 2, lootTier: 2, costMult: 1.1, rewardMult: 1.2 },
    2: { enemyHp: 1.35, enemyPosture: 1.3, enemyDamage: 1.2, enemyAggression: 1.2, weaponTier: 3, lootTier: 3, costMult: 1.25, rewardMult: 1.4 },
    3: { enemyHp: 1.6, enemyPosture: 1.5, enemyDamage: 1.35, enemyAggression: 1.3, weaponTier: 4, lootTier: 4, costMult: 1.4, rewardMult: 1.65 },
    4: { enemyHp: 1.9, enemyPosture: 1.75, enemyDamage: 1.5, enemyAggression: 1.45, weaponTier: 5, lootTier: 5, costMult: 1.6, rewardMult: 1.9 },
    5: { enemyHp: 2.25, enemyPosture: 2, enemyDamage: 1.7, enemyAggression: 1.6, weaponTier: 6, lootTier: 6, costMult: 1.8, rewardMult: 2.25 },
};

export const TRUMPET_PROGRESS_MAX = 100;
export const TRUMPET_PROGRESS = { bossKill: 35, breachCleared: 15, eliteKill: 5 };
export const TRUMPET_CHOICES = 3;
export const TRUMPET_SUBSTAT_POINTS = 10;
export const TRUMPET_RARITY_WEIGHTS: Record<4 | 5, Record<TrumpetRarity, number>> = {
    4: { Normal: 75, Cracked: 25, Archangel: 0, Abyssal: 0 },
    5: { Normal: 50, Cracked: 25, Archangel: 17, Abyssal: 8 },
};

export const ANOINTING_DROP_CHANCE = 0.04;
export const WEAPON_DROP_CHANCE = 0.06;

export const BREACH_WARDEN_XP = { inBreach: 1.25, outside: 0.85 };
export const UNLETTERED_XP_MULT = 0.85;
export const UNLETTERED_VISIONS_MULT = 0.75;

export const PENANCE_TESTIMONY_BONUS = { fragileHeart: 0.5, clippedChoir: 0.25, fated: 0.35 };

/** Lifetime Testimony needed for each rank. */
export const TESTIMONY_RANKS: readonly { rank: "E" | "D" | "C" | "B" | "A" | "S"; at: number }[] = [
    { rank: "E", at: 0 },
    { rank: "D", at: 25 },
    { rank: "C", at: 75 },
    { rank: "B", at: 150 },
    { rank: "A", at: 300 },
    { rank: "S", at: 500 },
];

export const TESTIMONY_UPGRADE_COST = { demonDamage: 10, armour: 10, startingVisions: 6, startingFeathers: 20 };
export const ORIGIN_UNLOCK_COST = { loneVigil: 15, breachWarden: 20, hostOfTheGate: 25, scribeOfNames: 20, penitent: 30 };
export const VARIANT_UNLOCK_COST = 40;
export const RELIQUARY_COST = 60;

export const BESTIARY_STUDY_REPEATS = 3;
export const BESTIARY_MASTER_KILLS = 10;
export const WHEELBORN_BESTIARY_MULT = 1.25;

export const RARITY_ORDER: readonly GiftRarity[] = ["Common", "Rare", "Advanced"];
