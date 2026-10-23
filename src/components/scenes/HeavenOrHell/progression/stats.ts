/**
 * The stats combat reads. Progression never runs combat; it only reports
 * pools, multipliers and flags gathered from the Choir, Gifts, Boons and
 * Burdens, the Canticle, active Anointings, Penances, Stain and Testimony.
 */

import type { Attributes, CorruptionTier, Effect, NumericStat, RunState, WeaponId } from "./types";
import { GRACE_PER_VOICE, GRACE_PER_WISDOM, formValue, spiritValue } from "./attributes";
import { BASE_AIR_DASHES, BASE_FERVOUR, BASE_GRACE, BASE_HP, BASE_SANCTITY, FERVOUR_PER_FAITH, HP_PER_STEADFAST, SANCTITY_PER_FAITH } from "./tuning";
import { CHOIRS, Passive, VARIANTS } from "./choirs";
import { GIFTS } from "./gifts";
import { BOONS, BURDENS } from "./boons";
import { CANTICLES } from "./tongues";
import { ANOINTINGS, activeAnointings } from "./anointings";
import { HYMNS, equippedHymns, hymnGraceCost, hymnLevelCap, hymnShape } from "./hymns";
import { stainEffects } from "./stain";
import { tierOf, tierScaling } from "./corruption";
import { vowConsequences } from "./vows";
import { TRUMPET_PROGRESS_MAX } from "./tuning";

export const OUTCRY_FERVOUR = 40;

/** The Choir passive in force: fallen form at 50 Stain, else the variant's, else the base. */
export function activePassive(run: RunState): Passive {
    const choir = CHOIRS[run.character.choir];
    if (stainEffects(run).fallenChoir) return choir.fallen;
    if (run.character.variant) return VARIANTS[run.character.variant].passive;
    return choir.passive;
}

export function collectEffects(run: RunState): Effect[] {
    const c = run.character;
    const effects: Effect[] = [...activePassive(run).effects, ...CHOIRS[c.choir].flaw.effects];
    const pure = run.stain === 0;
    for (const g of run.gifts) {
        const def = GIFTS[g.id];
        if (!def) continue;
        if (def.category === "Sanctified" && !pure) continue;
        effects.push(...def.effects);
    }
    for (const b of c.boons) effects.push(...BOONS[b].effects);
    for (const b of c.burdens) effects.push(...BURDENS[b].effects);
    if (c.canticle) effects.push(...CANTICLES[c.canticle].effects);
    for (const a of activeAnointings(run)) effects.push(...ANOINTINGS[a].effects);
    if (run.penances.includes("fragileHeart")) effects.push({ stat: "damageTakenMult", mult: 2 });
    if (run.penances.includes("clippedChoir")) effects.push({ flag: "noTrumpet" });
    effects.push({ stat: "demonDamageMult", mult: run.metaBonuses.demonDamageMult });
    effects.push({ stat: "armourMult", mult: run.metaBonuses.armourMult });
    const stain = stainEffects(run);
    effects.push({ stat: "maxSanctity", mult: stain.sanctityMult });
    if (stain.crackedHalo) effects.push({ flag: "crackedHalo" });
    if (stain.fallenChoir) effects.push({ flag: "alliesChargeMore" });
    if (stain.eliteHesitation) effects.push({ flag: "eliteHesitation" });
    if (run.halo === "dimmed") effects.push({ flag: "haloDimmed" });
    if (vowConsequences(run).alliesHostile) effects.push({ flag: "alliesHostile" });
    return effects;
}

function statValue(base: number, stat: NumericStat, effects: Effect[]): number {
    let add = 0;
    let mult = 1;
    for (const e of effects) {
        if (!("stat" in e) || e.stat !== stat) continue;
        add += e.add ?? 0;
        mult *= e.mult ?? 1;
    }
    return (base + add) * mult;
}

export interface HymnStats {
    id: string;
    level: number;
    maxLevel: number;
    graceCost: number;
    shape: Record<"size" | "speed" | "range" | "duration" | "area", number>;
    seals: string[];
}

export interface CombatStats {
    attributes: Attributes;
    form: number;
    spirit: number;
    ascension: number;
    tier: CorruptionTier;
    maxHp: number;
    maxGrace: number;
    maxSanctity: number;
    maxFervour: number;
    outcryFervour: number;
    multipliers: Record<Exclude<NumericStat, "maxHp" | "maxGrace" | "maxSanctity" | "maxFervour" | "airDashes">, number>;
    airDashes: number;
    canParry: boolean;
    flags: string[];
    hymns: HymnStats[];
    weapon: { item: string; weapon: WeaponId | null; tier: number } | null;
    halo: "bright" | "dimmed";
    stain: number;
    trumpet: { id: string; rarity: string; ready: boolean } | null;
}

const MULTIPLIERS: Exclude<NumericStat, "maxHp" | "maxGrace" | "maxSanctity" | "maxFervour" | "airDashes">[] = [
    "damageMult",
    "demonDamageMult",
    "postureDamageMult",
    "demonPostureDamageMult",
    "flourishPostureMult",
    "damageTakenMult",
    "blockPostureTakenMult",
    "armourMult",
    "healingMult",
    "graceCostMult",
    "graceRegenMult",
    "sanctityLossMult",
    "sanctityRegenMult",
    "statusBuildupTakenMult",
    "detectionRangeMult",
    "stealthMult",
    "rollDistanceMult",
    "glideStaminaMult",
];

export function deriveCombatStats(run: RunState): CombatStats {
    const a = run.character.attributes;
    const effects = collectEffects(run);
    const flags: string[] = [];
    for (const e of effects) if ("flag" in e && !flags.includes(e.flag)) flags.push(e.flag);
    const multipliers = {} as CombatStats["multipliers"];
    for (const m of MULTIPLIERS) multipliers[m] = statValue(1, m, effects);
    const noAirDash = flags.includes("noAirDash");
    const weaponItem = run.equipped.weapon ? run.items.find((i) => i.id === run.equipped.weapon) : undefined;
    return {
        attributes: { ...a },
        form: formValue(a),
        spirit: spiritValue(a),
        ascension: run.ascension,
        tier: tierOf(run),
        maxHp: Math.round(statValue(BASE_HP + a.steadfast * HP_PER_STEADFAST, "maxHp", effects)),
        maxGrace: Math.round(statValue(BASE_GRACE + a.wisdom * GRACE_PER_WISDOM + a.voice * GRACE_PER_VOICE, "maxGrace", effects)),
        maxSanctity: Math.round(statValue(BASE_SANCTITY + a.faith * SANCTITY_PER_FAITH, "maxSanctity", effects)),
        maxFervour: Math.round(statValue(BASE_FERVOUR + a.faith * FERVOUR_PER_FAITH, "maxFervour", effects)),
        outcryFervour: OUTCRY_FERVOUR,
        multipliers,
        airDashes: noAirDash ? 0 : Math.max(0, Math.round(statValue(BASE_AIR_DASHES, "airDashes", effects))),
        canParry: !flags.includes("noParry"),
        flags,
        hymns: equippedHymns(run.slots).map((id) => {
            const known = run.hymns.find((h) => h.id === id);
            const def = HYMNS[id];
            return {
                id,
                level: known?.level ?? 1,
                maxLevel: hymnLevelCap(def, a[def.scaling]),
                graceCost: known ? hymnGraceCost(known, multipliers.graceCostMult) : 0,
                shape: known ? hymnShape(known) : { size: 1, speed: 1, range: 1, duration: 1, area: 1 },
                seals: known?.seals ?? [],
            };
        }),
        weapon: weaponItem ? { item: weaponItem.id, weapon: weaponItem.weapon, tier: weaponItem.tier } : null,
        halo: run.halo,
        stain: run.stain,
        trumpet: run.trumpet ? { id: run.trumpet.id, rarity: run.trumpet.rarity, ready: run.trumpetProgress >= TRUMPET_PROGRESS_MAX } : null,
    };
}

/** Enemy multipliers for the current tier, for combat to apply to spawned foes. */
export function enemyScaling(run: RunState): { hp: number; posture: number; damage: number; aggression: number } {
    const s = tierScaling(tierOf(run));
    return { hp: s.enemyHp, posture: s.enemyPosture, damage: s.enemyDamage, aggression: s.enemyAggression };
}
