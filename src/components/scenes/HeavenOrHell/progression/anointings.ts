/**
 * Anointings (Deepwoken's Enchantments): Sanctified Whetstones on weapons,
 * Holy Oil on armour. Blessings appear from Tier 2, Brands from Tier 3.
 * One Anointing per item. An anointed item soulbinds when equipped.
 * The same Anointing can't be active twice.
 */

import type { AnointingId, Effect, Item, Result, RunState } from "./types";
import { fail, ok } from "./types";
import { ANOINTING_DROP_CHANCE } from "./tuning";
import { tierOf, tierUnlocks } from "./corruption";
import { rollChance, rollInt } from "./rng";
import { applyStain } from "./stain";

export interface AnointingDef {
    id: AnointingId;
    name: string;
    kind: "blessing" | "brand";
    slot: "weapon" | "armour";
    upside: string;
    downside: string | null;
    effects: Effect[];
}

export const ANOINTINGS: Record<AnointingId, AnointingDef> = {
    coalAnointed: { id: "coalAnointed", name: "Coal-Anointed", kind: "blessing", slot: "weapon", upside: "M1 hits apply light Sear.", downside: null, effects: [{ flag: "m1Sear" }] },
    berylWheel: { id: "berylWheel", name: "Beryl Wheel", kind: "blessing", slot: "weapon", upside: "Every third parry launches a rolling wheel.", downside: null, effects: [{ flag: "parryWheel" }] },
    amberGlory: { id: "amberGlory", name: "Amber Glory", kind: "blessing", slot: "weapon", upside: "Landing a critical restores Grace.", downside: null, effects: [{ flag: "critGrace" }] },
    watchersOil: { id: "watchersOil", name: "Watcher's Oil", kind: "blessing", slot: "armour", upside: "Better stealth; ambushes are revealed.", downside: null, effects: [{ stat: "stealthMult", mult: 1.15 }, { flag: "revealAmbush" }] },
    brandOfTheLocust: {
        id: "brandOfTheLocust",
        name: "Brand of the Locust",
        kind: "brand",
        slot: "weapon",
        upside: "+15% damage; M1s apply Torment (no healing).",
        downside: "Your own healing is 25% weaker.",
        effects: [{ stat: "damageMult", mult: 1.15 }, { flag: "m1Torment" }, { stat: "healingMult", mult: 0.75 }],
    },
    markOfTheNumber: {
        id: "markOfTheNumber",
        name: "Mark of the Number",
        kind: "brand",
        slot: "armour",
        upside: "Large posture and armour bonus.",
        downside: "No angelic merchant will trade with you.",
        effects: [{ stat: "armourMult", mult: 1.25 }, { stat: "blockPostureTakenMult", mult: 0.8 }, { flag: "noAngelicMerchants" }],
    },
    leviathanScale: {
        id: "leviathanScale",
        name: "Leviathan Scale",
        kind: "brand",
        slot: "armour",
        upside: "M1s can't guard-break you.",
        downside: "You can block but never parry.",
        effects: [{ flag: "m1GuardBreakImmune" }, { flag: "noParry" }],
    },
    behemothBone: {
        id: "behemothBone",
        name: "Behemoth Bone",
        kind: "brand",
        slot: "armour",
        upside: "+20% armour.",
        downside: "No air dash and shorter rolls.",
        effects: [{ stat: "armourMult", mult: 1.2 }, { flag: "noAirDash" }, { stat: "rollDistanceMult", mult: 0.85 }],
    },
};

const ANOINTING_IDS = Object.keys(ANOINTINGS) as AnointingId[];

export function anointingAvailable(run: RunState, id: AnointingId): boolean {
    return tierUnlocks(tierOf(run), ANOINTINGS[id].kind === "brand" ? "brands" : "blessings");
}

export function addItem(run: RunState, item: Omit<Item, "id">): { run: RunState; item: Item } {
    const full: Item = { ...item, id: `item-${run.nextId}` };
    return { item: full, run: { ...run, nextId: run.nextId + 1, items: [...run.items, full] } };
}

/** Anoints an item. Accepting a Brand adds Stain. */
export function applyAnointing(run: RunState, itemId: string, id: AnointingId): Result<RunState> {
    if (run.status !== "alive") return fail("run-over");
    const item = run.items.find((i) => i.id === itemId);
    if (!item) return fail("no-item");
    const def = ANOINTINGS[id];
    if (!anointingAvailable(run, id)) return fail("tier-locked");
    if (item.slot !== def.slot) return fail("wrong-slot");
    if (item.anointing) return fail("item-anointed");
    const otherSlot = item.slot === "weapon" ? run.equipped.armour : run.equipped.weapon;
    if (otherSlot && run.items.find((i) => i.id === otherSlot)?.anointing === id) return fail("anointing-active");
    const anointed: Item = { ...item, anointing: id, soulbound: item.soulbound || isEquipped(run, itemId) };
    let next: RunState = { ...run, items: run.items.map((i) => (i.id === itemId ? anointed : i)) };
    if (def.kind === "brand") next = applyStain(next, "brandAccepted");
    return ok(next);
}

function isEquipped(run: RunState, itemId: string): boolean {
    return run.equipped.weapon === itemId || run.equipped.armour === itemId;
}

/** Equips an item. An anointed item soulbinds; a second copy of an active Anointing is refused. */
export function equipItem(run: RunState, itemId: string): Result<RunState> {
    const item = run.items.find((i) => i.id === itemId);
    if (!item) return fail("no-item");
    const otherId = item.slot === "weapon" ? run.equipped.armour : run.equipped.weapon;
    const other = otherId ? run.items.find((i) => i.id === otherId) : undefined;
    if (item.anointing && other?.anointing === item.anointing) return fail("anointing-active");
    return ok({
        ...run,
        equipped: { ...run.equipped, [item.slot]: itemId },
        items: run.items.map((i) => (i.id === itemId && i.anointing ? { ...i, soulbound: true } : i)),
    });
}

export function dropItem(run: RunState, itemId: string): Result<RunState> {
    const item = run.items.find((i) => i.id === itemId);
    if (!item) return fail("no-item");
    if (item.soulbound) return fail("soulbound");
    return ok({
        ...run,
        items: run.items.filter((i) => i.id !== itemId),
        equipped: {
            weapon: run.equipped.weapon === itemId ? null : run.equipped.weapon,
            armour: run.equipped.armour === itemId ? null : run.equipped.armour,
        },
    });
}

/** A small seeded chance to drop an Anointing available at the current tier. */
export function rollAnointingDrop(run: RunState): { run: RunState; anointing: AnointingId | null } {
    const chance = rollChance(run.rng, ANOINTING_DROP_CHANCE);
    const options = ANOINTING_IDS.filter((id) => anointingAvailable(run, id));
    if (!chance.value || options.length === 0) return { run: { ...run, rng: chance.rng }, anointing: null };
    const pick = rollInt(chance.rng, options.length);
    return { run: { ...run, rng: pick.rng }, anointing: options[pick.value] };
}

export function activeAnointings(run: RunState): AnointingId[] {
    const out: AnointingId[] = [];
    for (const id of [run.equipped.weapon, run.equipped.armour]) {
        const a = id ? run.items.find((i) => i.id === id)?.anointing : null;
        if (a && !out.includes(a)) out.push(a);
    }
    return out;
}
