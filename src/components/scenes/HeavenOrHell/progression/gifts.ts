/**
 * Gifts (Deepwoken's Talents). Drawn in hands on each Ascension.
 * Choir, Vow and Testament (Origin and quest) Gifts are free and never drawn.
 * Fallen Gifts need Stain 25 and Tier 3 (Advanced ones Tier 4).
 * Sanctified Gifts are only offered while Stain is 0.
 */

import type { AttributeId, Effect, GiftCategory, GiftRarity, VowId } from "./types";

export interface GiftDef {
    id: string;
    name: string;
    rarity: GiftRarity;
    category: GiftCategory;
    text: string;
    requires?: Partial<Record<AttributeId, number>>;
    /** Gifts that must already be held (Advanced Gifts end a tree). */
    prerequisites?: string[];
    /** Gifts that can't be held together with this one. */
    exclusive?: string[];
    /** Lowest corruption tier at which the Gift can be drawn. */
    minTier?: number;
    vow?: VowId;
    effects: Effect[];
}

const LIST: GiftDef[] = [
    // Form
    { id: "coveringWings", name: "Covering Wings", rarity: "Common", category: "Form", requires: { steadfast: 20 }, text: "10% less posture damage when blocking from the front.", effects: [{ stat: "blockPostureTakenMult", mult: 0.9 }] },
    { id: "burnishedFeet", name: "Burnished Feet", rarity: "Common", category: "Form", requires: { steadfast: 15 }, text: "You can't be knocked down when you land.", effects: [{ flag: "landingKnockdownImmune" }] },
    { id: "lionsFace", name: "Lion's Face", rarity: "Common", category: "Form", requires: { might: 25 }, exclusive: ["oxsFace"], text: "Your flourish deals +15% posture damage.", effects: [{ stat: "flourishPostureMult", mult: 1.15 }] },
    { id: "oxsFace", name: "Ox's Face", rarity: "Common", category: "Form", requires: { steadfast: 25 }, exclusive: ["lionsFace"], text: "Blocking costs 10% less posture.", effects: [{ stat: "blockPostureTakenMult", mult: 0.9 }] },
    { id: "eaglesFace", name: "Eagle's Face", rarity: "Common", category: "Form", requires: { swiftness: 25 }, exclusive: ["mansFace"], text: "+1 air dash.", effects: [{ stat: "airDashes", add: 1 }] },
    { id: "mansFace", name: "Man's Face", rarity: "Common", category: "Form", requires: { voice: 25 }, exclusive: ["eaglesFace"], text: "Voice dialogue checks are easier.", effects: [{ flag: "easierVoiceChecks" }] },
    { id: "strongBack", name: "Strong Back", rarity: "Common", category: "Form", requires: { might: 10 }, text: "+20% carry load.", effects: [{ flag: "carryLoadUp" }] },
    { id: "longStride", name: "Long Stride", rarity: "Common", category: "Form", requires: { swiftness: 10 }, text: "+10% roll distance.", effects: [{ stat: "rollDistanceMult", mult: 1.1 }] },
    { id: "boneOfBrass", name: "Bone of Brass", rarity: "Rare", category: "Form", requires: { steadfast: 35 }, text: "+10% max HP.", effects: [{ stat: "maxHp", mult: 1.1 }] },
    { id: "wingbeatRecovery", name: "Wingbeat Recovery", rarity: "Rare", category: "Form", requires: { swiftness: 30 }, text: "Rolling out of a knockdown is faster.", effects: [{ flag: "fastKnockdownRecovery" }] },
    { id: "turnedNotGift", name: "Turned Not", rarity: "Advanced", category: "Form", requires: { swiftness: 40 }, prerequisites: ["eaglesFace"], text: "Forward dashes grant hyperarmor, but you can't steer.", effects: [{ flag: "dashHyperarmor" }] },
    // Spirit
    { id: "psalmKeeper", name: "Psalm-Keeper", rarity: "Common", category: "Spirit", requires: { wisdom: 10 }, text: "+10 Grace.", effects: [{ stat: "maxGrace", add: 10 }] },
    { id: "steadfastPrayer", name: "Steadfast Prayer", rarity: "Common", category: "Spirit", requires: { faith: 10 }, text: "+10 Sanctity.", effects: [{ stat: "maxSanctity", add: 10 }] },
    { id: "choirVoice", name: "Choir Voice", rarity: "Common", category: "Spirit", requires: { voice: 15 }, text: "Grace regenerates 10% faster.", effects: [{ stat: "graceRegenMult", mult: 1.1 }] },
    { id: "fullOfEyesGift", name: "Full of Eyes", rarity: "Rare", category: "Spirit", requires: { wisdom: 35 }, text: "Enemies behind you flash when they wind up.", effects: [{ flag: "rearWindupFlash" }] },
    { id: "hereAmI", name: "Here Am I", rarity: "Rare", category: "Spirit", requires: { voice: 30 }, text: "Dash to a downed ally and grant brief invulnerability.", effects: [{ flag: "dashToAlly" }] },
    { id: "quietMind", name: "Quiet Mind", rarity: "Rare", category: "Spirit", requires: { faith: 30 }, text: "Lose 15% less Sanctity.", effects: [{ stat: "sanctityLossMult", mult: 0.85 }] },
    { id: "gloryOverflow", name: "Glory Overflow", rarity: "Advanced", category: "Spirit", requires: { wisdom: 50 }, prerequisites: ["psalmKeeper"], text: "Hymns cost 10% less Grace.", effects: [{ stat: "graceCostMult", mult: 0.9 }] },
    // Arms
    { id: "edgeOfTheHost", name: "Edge of the Host", rarity: "Common", category: "Arms", requires: { mediumArms: 15 }, text: "+5% damage with Medium weapons.", effects: [{ flag: "mediumDamageUp" }] },
    { id: "judgementsWeight", name: "Judgement's Weight", rarity: "Common", category: "Arms", requires: { heavyArms: 15 }, text: "+5% posture damage with Heavy weapons.", effects: [{ flag: "heavyPostureUp" }] },
    { id: "heraldsQuickness", name: "Herald's Quickness", rarity: "Common", category: "Arms", requires: { lightArms: 15 }, text: "+5% attack speed with Light weapons.", effects: [{ flag: "lightSpeedUp" }] },
    { id: "riposte", name: "Riposte", rarity: "Rare", category: "Arms", requires: { mediumArms: 30 }, text: "A parry readies a faster next swing.", effects: [{ flag: "riposte" }] },
    { id: "sunder", name: "Sunder", rarity: "Rare", category: "Arms", requires: { heavyArms: 30 }, exclusive: ["flicker"], text: "Guard breaks deal bonus damage.", effects: [{ flag: "sunder" }] },
    { id: "flicker", name: "Flicker", rarity: "Rare", category: "Arms", requires: { lightArms: 30 }, exclusive: ["sunder"], text: "Rolling through an attack refunds stamina.", effects: [{ flag: "flicker" }] },
    { id: "twoEdged", name: "Two-Edged", rarity: "Advanced", category: "Arms", requires: { mediumArms: 50 }, prerequisites: ["riposte"], text: "The flourish strikes twice.", effects: [{ flag: "doubleFlourish" }] },
    { id: "shatterpoint", name: "Shatterpoint", rarity: "Advanced", category: "Arms", requires: { heavyArms: 50 }, prerequisites: ["sunder"], text: "Criticals on a full-posture foe guard break.", effects: [{ flag: "shatterpoint" }] },
    // Tongue
    { id: "kindling", name: "Kindling", rarity: "Common", category: "Tongue", requires: { seraphFire: 10 }, text: "Sear lasts longer.", effects: [{ flag: "searLonger" }] },
    { id: "liveCoalParry", name: "Live Coal Parry", rarity: "Rare", category: "Tongue", requires: { seraphFire: 30 }, text: "A parry Hushes the attacker for 1.5 seconds.", effects: [{ flag: "parryHushes" }] },
    { id: "rime", name: "Rime", rarity: "Common", category: "Tongue", requires: { firmament: 10 }, text: "Awe builds faster.", effects: [{ flag: "aweFaster" }] },
    { id: "crystalWard", name: "Crystal Ward", rarity: "Rare", category: "Tongue", requires: { firmament: 30 }, text: "Struck Still foes take more posture damage.", effects: [{ flag: "frozenPosture" }] },
    { id: "static", name: "Static", rarity: "Common", category: "Tongue", requires: { judgementThunder: 10 }, text: "Shock jumps once.", effects: [{ flag: "shockJump" }] },
    { id: "chainVerdict", name: "Chain Verdict", rarity: "Rare", category: "Tongue", requires: { judgementThunder: 30 }, text: "Verdict marks spread on overload.", effects: [{ flag: "verdictSpread" }] },
    { id: "tailwind", name: "Tailwind", rarity: "Common", category: "Tongue", requires: { whirlwind: 10 }, text: "Mobility Hymns go farther.", effects: [{ flag: "mobilityFarther" }] },
    { id: "breathless", name: "Breathless", rarity: "Rare", category: "Tongue", requires: { whirlwind: 30 }, text: "Hushed lasts longer.", effects: [{ flag: "hushedLonger" }] },
    { id: "afterglow", name: "Afterglow", rarity: "Common", category: "Tongue", requires: { radiance: 10 }, text: "Dazzle lingers.", effects: [{ flag: "dazzleLonger" }] },
    { id: "bloodPrice", name: "Blood Price", rarity: "Common", category: "Tongue", requires: { sacrifice: 10 }, text: "Sacrifice Hymns cost less HP.", effects: [{ flag: "cheaperSacrifice" }] },
    { id: "thunderhead", name: "Thunderhead", rarity: "Advanced", category: "Tongue", requires: { judgementThunder: 40, whirlwind: 40 }, minTier: 4, text: "Whirlwind Hymns carry Shock.", effects: [{ flag: "hybridStorm" }] },
    // Fallen
    { id: "ashenWings", name: "Ashen Wings", rarity: "Common", category: "Fallen", text: "+15% glide stamina; your wings shed ash.", effects: [{ stat: "glideStaminaMult", mult: 1.15 }] },
    { id: "hollowHunger", name: "Hollow Hunger", rarity: "Common", category: "Fallen", text: "Killing a demon heals you a little.", effects: [{ flag: "demonKillHeal" }] },
    { id: "brimstoneLungs", name: "Brimstone Lungs", rarity: "Rare", category: "Fallen", text: "Your Outcry breathes fire; each use adds Stain and Sanctity regenerates at half speed.", effects: [{ flag: "brimstoneOutcry" }, { stat: "sanctityRegenMult", mult: 0.5 }] },
    { id: "pitSight", name: "Pit-Sight", rarity: "Rare", category: "Fallen", text: "See demons through walls.", effects: [{ flag: "seeDemons" }] },
    { id: "locustCrownGift", name: "Locust Crown", rarity: "Advanced", category: "Fallen", minTier: 4, prerequisites: ["hollowHunger"], text: "Locusts fight beside you.", effects: [{ flag: "locustAllies" }] },
    { id: "wormwood", name: "Wormwood", rarity: "Advanced", category: "Fallen", minTier: 4, text: "Your Tongue statuses also make foes bitter: no healing.", effects: [{ flag: "wormwood" }] },
    // Sanctified
    { id: "cleanHands", name: "Clean Hands", rarity: "Common", category: "Sanctified", text: "+10% healing while pure.", effects: [{ stat: "healingMult", mult: 1.1 }] },
    { id: "whiteRobe", name: "White Robe", rarity: "Common", category: "Sanctified", text: "+5% armour while pure.", effects: [{ stat: "armourMult", mult: 1.05 }] },
    { id: "sealOnTheForehead", name: "Seal on the Forehead", rarity: "Rare", category: "Sanctified", text: "Immune to locust-swarm damage while Stain is 0.", effects: [{ flag: "locustImmune" }] },
    { id: "firstfruits", name: "Firstfruits", rarity: "Advanced", category: "Sanctified", prerequisites: ["cleanHands"], text: "Your first hit in each fight deals double damage while pure.", effects: [{ flag: "firstfruits" }] },
    // Choir (innate, free)
    { id: "unceasingSong", name: "Unceasing Song", rarity: "Common", category: "Choir", text: "Grace regenerates 10% faster.", effects: [{ stat: "graceRegenMult", mult: 1.1 }] },
    { id: "altarBorn", name: "Altar-Born", rarity: "Common", category: "Choir", text: "Sear builds on you more slowly.", effects: [{ flag: "searResist" }] },
    { id: "fourFaces", name: "Four Faces", rarity: "Common", category: "Choir", text: "Your mask turns between four faces.", effects: [] },
    { id: "brassGreaves", name: "Brass Greaves", rarity: "Common", category: "Choir", text: "Less knockback.", effects: [{ flag: "knockbackResist" }] },
    { id: "ringedWithEyes", name: "Ringed with Eyes", rarity: "Common", category: "Choir", text: "Your ring halo watches behind you.", effects: [{ flag: "rearSight" }] },
    { id: "berylGleam", name: "Beryl Gleam", rarity: "Common", category: "Choir", text: "+5 Grace.", effects: [{ stat: "maxGrace", add: 5 }] },
    { id: "starMap", name: "Star-Map", rarity: "Common", category: "Choir", text: "Your mantle shows discovered landmarks.", effects: [{ flag: "mantleMap" }] },
    { id: "crownedBearing", name: "Crowned Bearing", rarity: "Common", category: "Choir", text: "Voice checks with lesser angels are easier.", effects: [{ flag: "easierVoiceChecks" }] },
    { id: "stormVeined", name: "Storm-Veined", rarity: "Common", category: "Choir", text: "Shock builds on you more slowly.", effects: [{ flag: "shockResist" }] },
    { id: "weatherSense", name: "Weather-Sense", rarity: "Common", category: "Choir", text: "You sense incoming Tongue casts.", effects: [{ flag: "senseCasts" }] },
    { id: "chainsOfLight", name: "Chains of Light", rarity: "Common", category: "Choir", text: "Harder to grab.", effects: [{ flag: "grabResist" }] },
    { id: "wardensGrip", name: "Warden's Grip", rarity: "Common", category: "Choir", text: "Your grips are faster on demons.", effects: [{ flag: "fastDemonGrip" }] },
    { id: "rallyingBanner", name: "Rallying Banner", rarity: "Common", category: "Choir", text: "Allies see you from farther away.", effects: [{ flag: "allyBeacon" }] },
    { id: "lanternHalo", name: "Lantern Halo", rarity: "Common", category: "Choir", text: "Your halo lights dark places.", effects: [{ flag: "halolight" }] },
    { id: "keepersHand", name: "Keeper's Hand", rarity: "Common", category: "Choir", text: "Revive allies faster.", effects: [{ flag: "fastRevive" }] },
    { id: "veiledSight", name: "Veiled Sight", rarity: "Common", category: "Choir", text: "Horror sights cost less Sanctity when veiled.", effects: [{ flag: "veiled" }] },
    // Testament (Origin and quest, free)
    { id: "commonClay", name: "Common Clay", rarity: "Common", category: "Testament", text: "Basic gear is repaired for free at the Outer Courts.", effects: [{ flag: "freeRepair" }] },
    { id: "markOfTheVigil", name: "Mark of the Vigil", rarity: "Rare", category: "Testament", text: "Granted for clearing the Vigil's trial.", effects: [{ stat: "maxHp", add: 10 }] },
    { id: "wardensRecall", name: "Warden's Recall", rarity: "Common", category: "Testament", text: "Recall out of a breach once per rest.", effects: [{ flag: "breachRecall" }] },
    { id: "gateEnsign", name: "Gate Ensign", rarity: "Common", category: "Testament", text: "Rank in the Cherubim's guard.", effects: [{ flag: "gateRank" }] },
    { id: "scribesLedger", name: "Scribe's Ledger", rarity: "Common", category: "Testament", text: "Archive commissions pay more.", effects: [{ flag: "commissionsUp" }] },
    { id: "penitentsLedger", name: "Penitent's Ledger", rarity: "Common", category: "Testament", text: "Bounties on marked corrupted angels pay more.", effects: [{ flag: "bountiesUp" }] },
    // Vow (free)
    { id: "turningEveryWay", name: "Turning Every Way", rarity: "Rare", category: "Vow", vow: "flamingSword", text: "The critical becomes a 360-degree sweep.", effects: [{ flag: "sweepCritical" }] },
    { id: "noneShallPassGift", name: "None Shall Pass", rarity: "Rare", category: "Vow", vow: "flamingSword", text: "A stance punishes anyone who rolls through you.", effects: [{ flag: "rollPunish" }] },
    { id: "keeperOfTheTree", name: "Keeper of the Tree", rarity: "Advanced", category: "Vow", vow: "flamingSword", text: "Holding ground grants posture regeneration.", effects: [{ flag: "holdGround" }] },
    { id: "sleepless", name: "Sleepless", rarity: "Rare", category: "Vow", vow: "watcher", text: "No penalty for skipping rest.", effects: [{ flag: "sleepless" }] },
    { id: "markOfWitnessGift", name: "Mark of Witness", rarity: "Rare", category: "Vow", vow: "watcher", text: "Tag a target through walls.", effects: [{ flag: "tagThroughWalls" }] },
    { id: "veiledEyes", name: "Veiled Eyes", rarity: "Advanced", category: "Vow", vow: "watcher", text: "Stealth while still.", effects: [{ stat: "stealthMult", mult: 1.3 }] },
    { id: "annunciation", name: "Annunciation", rarity: "Rare", category: "Vow", vow: "herald", text: "An area buff for allies.", effects: [{ flag: "areaBuff" }] },
    { id: "hereAmIVow", name: "Here Am I", rarity: "Rare", category: "Vow", vow: "herald", text: "Dash to a downed ally.", effects: [{ flag: "dashToAlly" }] },
    { id: "whomShallISendGift", name: "Whom Shall I Send", rarity: "Advanced", category: "Vow", vow: "herald", text: "Summon an ally angel.", effects: [{ flag: "summonAlly" }] },
    { id: "lovedNotTheirLives", name: "Loved Not Their Lives", rarity: "Rare", category: "Vow", vow: "martyr", text: "Deal more damage at low HP.", effects: [{ flag: "lowHpDamage" }] },
    { id: "wordOfTestimony", name: "Word of Testimony", rarity: "Rare", category: "Vow", vow: "martyr", text: "Taking a hit for an ally restores Grace.", effects: [{ flag: "martyrGrace" }] },
    { id: "lastBreathOutcryGift", name: "Last Breath Outcry", rarity: "Advanced", category: "Vow", vow: "martyr", text: "Outcry at low HP heals.", effects: [{ flag: "lastBreath" }] },
    { id: "wheelWithinAWheelGift", name: "Wheel within a Wheel", rarity: "Rare", category: "Vow", vow: "ophansEye", text: "Summon an orbiting wheel.", effects: [{ flag: "orbitWheel" }] },
    { id: "fullOfEyesVow", name: "Full of Eyes", rarity: "Rare", category: "Vow", vow: "ophansEye", text: "360-degree parry warnings.", effects: [{ flag: "parryWarnings" }] },
    { id: "wentStraightForward", name: "Went Straight Forward", rarity: "Advanced", category: "Vow", vow: "ophansEye", text: "Wheels charge forward.", effects: [{ flag: "wheelCharge" }] },
    { id: "lipsTouched", name: "Lips Touched", rarity: "Rare", category: "Vow", vow: "liveCoal", text: "Hymns cost 15% less Grace.", effects: [{ stat: "graceCostMult", mult: 0.85 }] },
    { id: "iniquityTakenAway", name: "Iniquity Taken Away", rarity: "Rare", category: "Vow", vow: "liveCoal", text: "Weaving two Tongues purges an ailment.", effects: [{ flag: "weavePurge" }] },
    { id: "altarsTongsGift", name: "Altar's Tongs", rarity: "Advanced", category: "Vow", vow: "liveCoal", text: "Grab with any Tongue.", effects: [{ flag: "tongueGrab" }] },
    { id: "warInHeaven", name: "War in Heaven", rarity: "Rare", category: "Vow", vow: "michaelsHost", text: "Posture damage carries through chains.", effects: [{ flag: "chainPosture" }] },
    { id: "andPrevailedNot", name: "And Prevailed Not", rarity: "Rare", category: "Vow", vow: "michaelsHost", text: "Hyperarmor on the flourish.", effects: [{ flag: "flourishHyperarmor" }] },
    { id: "castOutGift", name: "Cast Out", rarity: "Advanced", category: "Vow", vow: "michaelsHost", text: "The flourish throws the target.", effects: [{ flag: "flourishThrow" }] },
    { id: "keyOfThePitGift", name: "Key of the Pit", rarity: "Rare", category: "Vow", vow: "fallenStar", text: "Stain becomes power: +1% damage per 5 Stain.", effects: [{ flag: "stainPower" }] },
    { id: "smokeOfTheFurnaceGift", name: "Smoke of the Furnace", rarity: "Rare", category: "Vow", vow: "fallenStar", text: "An obscuring cloud.", effects: [{ flag: "smokeCloud" }] },
    { id: "locustCrownVow", name: "Locust Crown", rarity: "Advanced", category: "Vow", vow: "fallenStar", text: "A crown of locusts.", effects: [{ flag: "locustCrown" }] },
];

export const GIFTS: Record<string, GiftDef> = {};
for (const gift of LIST) {
    if (GIFTS[gift.id]) throw new Error(`duplicate gift ${gift.id}`);
    GIFTS[gift.id] = gift;
}

export const GIFT_IDS = LIST.map((g) => g.id);

/** Categories that can appear in hands. The rest are granted. */
export const DRAWABLE_CATEGORIES: readonly GiftCategory[] = ["Form", "Spirit", "Arms", "Tongue", "Fallen", "Sanctified"];

export function isFreeCategory(category: GiftCategory): boolean {
    return category === "Choir" || category === "Vow" || category === "Testament";
}

/** Two Gifts exclude each other if either lists the other. */
export function excludes(a: string, b: string): boolean {
    return (GIFTS[a]?.exclusive ?? []).includes(b) || (GIFTS[b]?.exclusive ?? []).includes(a);
}

export function vowGifts(vow: VowId): string[] {
    return LIST.filter((g) => g.vow === vow).map((g) => g.id);
}
