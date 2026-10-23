/**
 * Shared types for Heaven Or Hell character and progression.
 * Everything here is plain data so a run can be saved as JSON.
 */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function ok<T>(value: T): Result<T> {
    return { ok: true, value };
}

export function fail<T = never>(error: string): Result<T> {
    return { ok: false, error };
}

export type FormAttribute = "might" | "steadfast" | "swiftness";
export type SpiritAttribute = "wisdom" | "faith" | "voice";
export type ArmsAttribute = "heavyArms" | "mediumArms" | "lightArms";
export type TongueId = "seraphFire" | "firmament" | "judgementThunder" | "whirlwind" | "radiance" | "sacrifice";
export type AttributeId = FormAttribute | SpiritAttribute | ArmsAttribute | TongueId;
export type Attributes = Record<AttributeId, number>;

export type ChoirId =
    | "kindled"
    | "fourFaced"
    | "wheelborn"
    | "lordling"
    | "virtuant"
    | "bindborn"
    | "banneret"
    | "watcherKin";

export type ChoirVariantId =
    | "ashenKindled"
    | "brassShodFourFaced"
    | "sapphireWheelborn"
    | "polestarLordling"
    | "hailCrownedVirtuant"
    | "adamantBindborn"
    | "oriflammeBanneret"
    | "seventhWatcher";

export type OriginId = "outerCourts" | "loneVigil" | "breachWarden" | "hostOfTheGate" | "scribeOfNames" | "penitent";

export type BoonId = "tirelessWing" | "psalmist" | "unseen" | "lampBearer" | "quickStudy";
export type BurdenId = "clipped" | "doubting" | "tarnishedHalo" | "unlettered" | "heavyHearted" | "tarnished";

export type StartingWeaponId = "sword" | "spear" | "knife";
export type WeaponId =
    | StartingWeaponId
    | "flamingSword"
    | "spearOfTheHost"
    | "censerFlail"
    | "ophanCestus"
    | "bowOfLight"
    | "heraldsHorn";

export type CanticleId = "hosanna" | "selah" | "antiphon";
export type PenanceId = "fragileHeart" | "clippedChoir" | "fated";
export type GiftRarity = "Common" | "Rare" | "Advanced";
export type GiftCategory = "Form" | "Spirit" | "Arms" | "Tongue" | "Vow" | "Testament" | "Choir" | "Fallen" | "Sanctified";
export type GiftSource = "drawn" | "choir" | "vow" | "origin" | "quest" | "throne";
export type HymnSlotKind = "combat" | "support" | "mobility";
export type CoalId = "ember" | "berylLens" | "amber" | "brassFiling" | "sapphire";
export type SealId = "pursuit" | "bursting" | "wheel";
export type VowId =
    | "flamingSword"
    | "watcher"
    | "herald"
    | "martyr"
    | "ophansEye"
    | "liveCoal"
    | "michaelsHost"
    | "fallenStar";
export type AnointingId =
    | "coalAnointed"
    | "berylWheel"
    | "amberGlory"
    | "watchersOil"
    | "brandOfTheLocust"
    | "markOfTheNumber"
    | "leviathanScale"
    | "behemothBone";
export type TrumpetRarity = "Normal" | "Cracked" | "Archangel" | "Abyssal";
export type TrumpetId = "coalOfTheAltar" | "wheelWithinAWheel" | "firmamentDome" | "noiseOfGreatWaters" | "michaelsCharge" | "keyOfThePit";
export type ShrineId = "scales" | "refining" | "joinedWings" | "partedWings" | "lots" | "mouth";
export type CorruptionTier = 0 | 1 | 2 | 3 | 4 | 5;
export type StainSourceId =
    | "demonHeart"
    | "brandAccepted"
    | "fallenGift"
    | "mouthShrine"
    | "brimstoneOutcry"
    | "abyssalTrumpet"
    | "forbiddenVow";
export type CleanseId = "refiningShrine" | "altarVigil" | "livingWater" | "sacrificialCleansing";

/** A numeric stat that combat reads. Effects add first, then multiply. */
export type NumericStat =
    | "maxHp"
    | "maxGrace"
    | "maxSanctity"
    | "maxFervour"
    | "damageMult"
    | "demonDamageMult"
    | "postureDamageMult"
    | "demonPostureDamageMult"
    | "flourishPostureMult"
    | "damageTakenMult"
    | "blockPostureTakenMult"
    | "armourMult"
    | "healingMult"
    | "graceCostMult"
    | "graceRegenMult"
    | "sanctityLossMult"
    | "sanctityRegenMult"
    | "statusBuildupTakenMult"
    | "detectionRangeMult"
    | "stealthMult"
    | "rollDistanceMult"
    | "glideStaminaMult"
    | "airDashes";

export type Effect = { stat: NumericStat; add?: number; mult?: number } | { flag: string };

export interface Appearance {
    wings: { count: number; pose: "open" | "folded" | "clipped"; texture: "feather" | "ember" | "glass" };
    halo: { shape: "ring" | "brokenRing" | "thorned" | "wheel" | "crown"; light: "white" | "gold" | "silver" };
    eyes: { style: "glow" | "veiled"; wingEyes: boolean };
    robe: "linen" | "sash" | "cowl";
    mark: string;
}

export interface CreationInput {
    choir: ChoirId;
    variant: ChoirVariantId | null;
    /** Empty means Wordless. */
    tongues: TongueId[];
    arms: StartingWeaponId;
    boons: BoonId[];
    burdens: BurdenId[];
    origin: OriginId;
    appearance: Appearance;
    /** Points placed at creation, not counting the Choir's +3/+2. */
    allocation: Partial<Attributes>;
    penances: PenanceId[];
}

export interface Character {
    creation: CreationInput;
    choir: ChoirId;
    variant: ChoirVariantId | null;
    tongues: TongueId[];
    wordless: boolean;
    boons: BoonId[];
    burdens: BurdenId[];
    origin: OriginId;
    appearance: Appearance;
    canticle: CanticleId | null;
    /** Attribute totals, including the Choir bonus. */
    attributes: Attributes;
    /** Attributes whose hard cap has been raised to 100. */
    unsealed: AttributeId[];
}

export interface HeldGift {
    id: string;
    source: GiftSource;
}

export interface GiftHand {
    id: number;
    kind: "ascension" | "lesser" | "lots" | "throne";
    cards: string[];
    /** True when the hand offers the Stay card. */
    stay: boolean;
}

export interface HymnDraw {
    id: number;
    hymns: string[];
}

export interface KnownHymn {
    id: string;
    level: number;
    coals: CoalId[];
    seals: SealId[];
}

export interface HymnSlots {
    combat: (string | null)[];
    support: string | null;
    mobility: string | null;
    wildcard: string | null;
}

export interface VowState {
    id: VowId;
    /** How many of the Vow's Gifts have been granted. */
    progress: number;
}

export interface Item {
    id: string;
    slot: "weapon" | "armour";
    weapon: WeaponId | null;
    tier: number;
    anointing: AnointingId | null;
    soulbound: boolean;
}

export interface TrumpetInstance {
    id: TrumpetId;
    rarity: TrumpetRarity;
    substats: Record<string, number>;
}

export interface SealedRegion {
    region: string;
    tier: CorruptionTier;
}

export type RunStatus = "alive" | "castOut" | "fallen";

export interface RunState {
    seed: number;
    rng: number;
    status: RunStatus;
    character: Character;
    ascension: number;
    xp: number;
    unspentPoints: number;
    halo: "bright" | "dimmed";
    stain: number;
    peakStain: number;
    visions: number;
    feathers: number;
    gifts: HeldGift[];
    pendingHands: GiftHand[];
    stayedHands: GiftHand[];
    keptCards: string[];
    bannedGifts: string[];
    guaranteedGift: string | null;
    pendingHymnDraws: HymnDraw[];
    hymnDrawsTaken: number;
    hymns: KnownHymn[];
    slots: HymnSlots;
    coals: Partial<Record<CoalId, number>>;
    seals: Partial<Record<SealId, number>>;
    vow: VowState | null;
    brokenVows: VowId[];
    fallenStarMark: boolean;
    items: Item[];
    equipped: { weapon: string | null; armour: string | null };
    trumpet: TrumpetInstance | null;
    trumpetProgress: number;
    pendingTrumpetChoice: TrumpetInstance[] | null;
    shrineUses: Record<string, number>;
    cleanses: Partial<Record<CleanseId, number>>;
    witnesses: string[];
    pendingTestimony: number;
    quests: string[];
    bossesDefeated: string[];
    elapsedSeconds: number;
    sealedRegions: SealedRegion[];
    penances: PenanceId[];
    /** Testimony upgrades, snapshotted when the run is kindled. */
    metaBonuses: { demonDamageMult: number; armourMult: number };
    nextId: number;
}

export interface BestiaryEntry {
    seen: boolean;
    moves: Record<string, number>;
    kills: number;
}

export interface MetaState {
    testimony: number;
    lifetimeTestimony: number;
    upgrades: Record<string, number>;
    unlockedOrigins: OriginId[];
    unlockedVariants: ChoirVariantId[];
    learnedTongues: TongueId[];
    progressedVows: VowId[];
    reliquary: Item | null;
    bestiary: Record<string, BestiaryEntry>;
    landmarks: string[];
    lore: string[];
    runs: number;
    falls: number;
}
