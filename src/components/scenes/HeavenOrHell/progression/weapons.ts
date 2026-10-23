/**
 * The weapon catalogue: unlock and drop gating only. Combat owns the moves.
 * Starting weapons are basic. Special weapons are loot, gated by tier and quests.
 */

import type { ArmsAttribute, Item, RunState, StartingWeaponId, WeaponId } from "./types";
import { WEAPON_DROP_CHANCE } from "./tuning";
import { tierOf, tierScaling } from "./corruption";
import { rollChance, rollWeighted } from "./rng";

export interface WeaponDef {
    id: WeaponId;
    name: string;
    arms: ArmsAttribute;
    basic: boolean;
    minTier: number;
    quests: string[];
    /** Relative drop weight once unlocked. */
    dropWeight: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
    sword: { id: "sword", name: "Sword", arms: "mediumArms", basic: true, minTier: 0, quests: [], dropWeight: 0 },
    spear: { id: "spear", name: "Spear", arms: "mediumArms", basic: true, minTier: 0, quests: [], dropWeight: 0 },
    knife: { id: "knife", name: "Knife", arms: "lightArms", basic: true, minTier: 0, quests: [], dropWeight: 0 },
    spearOfTheHost: { id: "spearOfTheHost", name: "Spear of the Host", arms: "mediumArms", basic: false, minTier: 1, quests: [], dropWeight: 5 },
    censerFlail: { id: "censerFlail", name: "Censer Flail", arms: "heavyArms", basic: false, minTier: 2, quests: [], dropWeight: 4 },
    ophanCestus: { id: "ophanCestus", name: "Ophan Cestus", arms: "lightArms", basic: false, minTier: 2, quests: [], dropWeight: 4 },
    flamingSword: { id: "flamingSword", name: "Flaming Sword", arms: "mediumArms", basic: false, minTier: 2, quests: ["quest:gate"], dropWeight: 2 },
    bowOfLight: { id: "bowOfLight", name: "Bow of Light", arms: "lightArms", basic: false, minTier: 3, quests: [], dropWeight: 3 },
    heraldsHorn: { id: "heraldsHorn", name: "Herald's Horn", arms: "heavyArms", basic: false, minTier: 4, quests: ["quest:heraldsCall"], dropWeight: 2 },
};

export const STARTING_WEAPONS: readonly StartingWeaponId[] = ["sword", "spear", "knife"];

export function weaponUnlocked(run: RunState, id: WeaponId): boolean {
    const def = WEAPONS[id];
    if (def.basic) return true;
    return tierOf(run) >= def.minTier && def.quests.every((q) => run.quests.includes(q));
}

export function weaponDropTable(run: RunState): { item: WeaponId; weight: number }[] {
    return (Object.keys(WEAPONS) as WeaponId[])
        .filter((id) => !WEAPONS[id].basic && weaponUnlocked(run, id))
        .map((id) => ({ item: id, weight: WEAPONS[id].dropWeight }));
}

/** The item a weapon would be at the current tier. */
export function weaponItem(run: RunState, id: WeaponId): Omit<Item, "id"> {
    return { slot: "weapon", weapon: id, tier: tierScaling(tierOf(run)).weaponTier, anointing: null, soulbound: false };
}

/** A seeded drop roll. Returns the weapon (not yet added to the inventory) or null. */
export function rollWeaponDrop(run: RunState): { run: RunState; weapon: WeaponId | null } {
    const chance = rollChance(run.rng, WEAPON_DROP_CHANCE);
    if (!chance.value) return { run: { ...run, rng: chance.rng }, weapon: null };
    const pick = rollWeighted(chance.rng, weaponDropTable(run));
    return { run: { ...run, rng: pick.rng }, weapon: pick.value };
}
