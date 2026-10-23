import assert from "node:assert/strict";
import test from "node:test";
import {
    GIFTS,
    HYMNS,
    RunState,
    activeAnointings,
    addItem,
    applyAnointing,
    applyCoal,
    applySeal,
    ascend,
    banGift,
    breakVow,
    completeQuest,
    deriveCombatStats,
    drawGiftHand,
    dropItem,
    equipHymn,
    equipItem,
    freshMeta,
    giftBlock,
    guaranteeGift,
    hymnGraceCost,
    hymnLevelCap,
    keepCard,
    learnHymn,
    pickGift,
    progressVow,
    stayHand,
    swearVow,
    upgradeHymn,
    vowConsequences,
    weaponDropTable,
    weaponUnlocked,
} from "../src/components/scenes/HeavenOrHell/progression/index.ts";
import { atTier, cardsOverSeeds, errorOf, makeRun, unwrap, withAttrs, withGifts, withSeed } from "./heaven-or-hell-progression-fixtures.ts";

const draw = (r: RunState) => drawGiftHand(r).hand.cards;
const strong = (run: RunState) =>
    withAttrs(run, { might: 40, steadfast: 40, swiftness: 40, wisdom: 40, faith: 40, voice: 40, heavyArms: 40, mediumArms: 40, lightArms: 40, seraphFire: 40 });

test("Gift hands are deterministic for the same seed and vary across seeds", () => {
    const run = strong(makeRun());
    assert.deepEqual(drawGiftHand(run).hand, drawGiftHand(run).hand);
    const hands = new Set<string>();
    for (let i = 0; i < 20; i++) hands.add(draw(withSeed(run, i)).join(","));
    assert.ok(hands.size > 10);
});

test("hands hold 4 or 5 unique, takeable cards with at most one Advanced", () => {
    const run = strong(makeRun());
    for (let i = 0; i < 200; i++) {
        const cards = draw(withSeed(run, i));
        assert.ok(cards.length === 4 || cards.length === 5, `size ${cards.length}`);
        assert.equal(new Set(cards).size, cards.length);
        for (const c of cards) assert.equal(giftBlock(run, GIFTS[c]), null);
        assert.ok(cards.filter((c) => GIFTS[c].rarity === "Advanced").length <= 1);
        assert.ok(cards.filter((c) => GIFTS[c].rarity === "Rare").length <= 2);
    }
});

test("requirements gate cards: a fresh angel never sees a Rare needing 35", () => {
    const seen = cardsOverSeeds(makeRun(), 200, draw);
    assert.ok(!seen.has("boneOfBrass"));
    assert.ok(!seen.has("fullOfEyesGift"));
    assert.ok(seen.has("kindling"));
});

test("mutually exclusive Gifts never appear once the other is held", () => {
    const run = withGifts(strong(makeRun()), ["lionsFace"]);
    const seen = cardsOverSeeds(run, 300, draw);
    assert.ok(!seen.has("oxsFace"));
    assert.ok(cardsOverSeeds(strong(makeRun()), 300, draw).has("oxsFace"));
    const forced = { ...run, pendingHands: [{ id: 900, kind: "ascension" as const, cards: ["oxsFace"], stay: false }] };
    assert.equal(errorOf(pickGift(forced, 900, "oxsFace")), "exclusive");
});

test("Fallen Gifts need Stain 25 and Tier 3; Advanced Fallen need Tier 4", () => {
    const fallen = (seen: Set<string>) => [...seen].filter((c) => GIFTS[c].category === "Fallen");
    const stained = { ...makeRun(), stain: 30, peakStain: 30 };
    assert.deepEqual(fallen(cardsOverSeeds(atTier(stained, 2), 200, draw)), []);
    assert.deepEqual(fallen(cardsOverSeeds(atTier({ ...stained, stain: 24 }, 3), 200, draw)), []);
    const tier3 = fallen(cardsOverSeeds(atTier(stained, 3), 200, draw));
    assert.ok(tier3.length > 0);
    assert.ok(tier3.every((c) => GIFTS[c].rarity !== "Advanced"));
    assert.ok(fallen(cardsOverSeeds(atTier(stained, 4), 300, draw)).some((c) => GIFTS[c].rarity === "Advanced"));
});

test("Seventh Watcher sees Fallen Gifts from Tier 1", () => {
    const meta = { ...freshMeta(), unlockedVariants: ["seventhWatcher" as const] };
    const watcher = { ...makeRun({ choir: "watcherKin", variant: "seventhWatcher" }, meta), stain: 30 };
    const plain = { ...makeRun({ choir: "watcherKin" }), stain: 30 };
    const fallen = (r: RunState) => [...cardsOverSeeds(atTier(r, 1), 200, draw)].filter((c) => GIFTS[c].category === "Fallen");
    assert.ok(fallen(watcher).length > 0);
    assert.deepEqual(fallen(plain), []);
});

test("Sanctified Gifts are offered only at Stain 0", () => {
    const sanctified = (r: RunState) => [...cardsOverSeeds(r, 200, draw)].filter((c) => GIFTS[c].category === "Sanctified");
    assert.ok(sanctified(makeRun()).length > 0);
    assert.deepEqual(sanctified({ ...makeRun(), stain: 1, peakStain: 1 }), []);
});

test("taking a Fallen Gift adds Stain, more for Watcher-kin", () => {
    const hand = { id: 900, kind: "ascension" as const, cards: ["ashenWings"], stay: false };
    const run = atTier({ ...makeRun(), stain: 30, peakStain: 30, pendingHands: [hand] }, 3);
    assert.equal(unwrap(pickGift(run, 900, "ashenWings")).stain, 35);
    const kin = atTier({ ...makeRun({ choir: "watcherKin" }), stain: 30, peakStain: 30, pendingHands: [hand] }, 3);
    assert.equal(unwrap(pickGift(kin, 900, "ashenWings")).stain, 36);
});

test("Stay carries a hand forward to be resolved later", () => {
    let run = strong(makeRun());
    let seed = 0;
    let drawn = drawGiftHand(withSeed(run, seed));
    while (!drawn.hand.stay) drawn = drawGiftHand(withSeed(run, ++seed));
    run = unwrap(stayHand(drawn.run, drawn.hand.id));
    assert.equal(run.pendingHands.length, 0);
    assert.equal(run.stayedHands.length, 1);
    run = unwrap(pickGift(run, drawn.hand.id, drawn.hand.cards[0]));
    assert.equal(run.stayedHands.length, 0);
    assert.ok(run.gifts.some((g) => g.id === drawn.hand.cards[0]));
    let plain = drawGiftHand(withSeed(strong(makeRun()), 0));
    for (let s = 1; plain.hand.stay; s++) plain = drawGiftHand(withSeed(strong(makeRun()), s));
    assert.equal(errorOf(stayHand(plain.run, plain.hand.id)), "no-stay");
});

test("Feathers ban, guarantee and keep cards", () => {
    const base = { ...strong(makeRun()), feathers: 3 };
    const first = drawGiftHand(base);
    const banned = first.hand.cards[0];
    let run = unwrap(banGift(first.run, banned));
    assert.ok(!run.pendingHands[0].cards.includes(banned));
    assert.ok(!cardsOverSeeds(run, 200, draw).has(banned));

    run = unwrap(guaranteeGift(run, "longStride"));
    const second = drawGiftHand(run);
    assert.ok(second.hand.cards.includes("longStride"));
    assert.equal(second.run.guaranteedGift, null);

    const kept = second.hand.cards.find((c) => c !== "longStride") as string;
    run = unwrap(keepCard(second.run, second.hand.id, kept));
    assert.equal(run.feathers, 0);
    assert.ok(drawGiftHand(run).hand.cards.includes(kept));
    assert.equal(errorOf(banGift(run, "riposte")), "no-feather");
});

test("Fated picks cards for you", () => {
    const run = makeRun({ penances: ["fated"] });
    const next = unwrap(ascend(run, { free: true }));
    assert.equal(next.pendingHands.length, 0);
    assert.equal(next.gifts.length, run.gifts.length + 1);
    const hand = drawGiftHand(run);
    assert.equal(errorOf(pickGift(hand.run, hand.hand.id, hand.hand.cards[0])), "fated");
});

test("Hymn slots: 3 Combat, 1 Support, 1 Mobility and a Wildcard for any kind", () => {
    let run = unwrap(learnHymn(makeRun(), "coalFromTheAltar"));
    assert.equal(errorOf(equipHymn(run, "coalFromTheAltar", { kind: "support" })), "wrong-slot");
    run = unwrap(equipHymn(run, "coalFromTheAltar", { kind: "wildcard" }));
    assert.equal(run.slots.wildcard, "coalFromTheAltar");
    run = unwrap(equipHymn(run, "coalFromTheAltar", { kind: "combat", index: 2 }));
    assert.equal(run.slots.wildcard, null);
    assert.equal(run.slots.combat[2], "coalFromTheAltar");
    assert.equal(errorOf(equipHymn(run, "coalFromTheAltar", { kind: "combat", index: 3 })), "bad-slot");
    assert.equal(errorOf(learnHymn(run, "crystalShard")), "requirement");
});

test("Hymn levels unlock at 20/40/60/80 investment; Vow Hymns never level", () => {
    const def = HYMNS.coalFromTheAltar;
    assert.deepEqual([0, 19, 20, 40, 60, 80, 100].map((n) => hymnLevelCap(def, n)), [1, 1, 2, 3, 4, 5, 5]);
    assert.equal(hymnLevelCap(HYMNS.noneShallPass, 100), 1);
    let run = unwrap(learnHymn(makeRun(), "coalFromTheAltar"));
    assert.equal(errorOf(upgradeHymn(run, "coalFromTheAltar")), "investment");
    run = withAttrs(run, { seraphFire: 40 });
    run = unwrap(upgradeHymn(unwrap(upgradeHymn(run, "coalFromTheAltar")), "coalFromTheAltar"));
    assert.equal(run.hymns[0].level, 3);
    assert.equal(errorOf(upgradeHymn(run, "coalFromTheAltar")), "investment");
});

test("Altar Coals raise the Grace cost; Seals don't", () => {
    let run: RunState = { ...unwrap(learnHymn(makeRun(), "coalFromTheAltar")), coals: { ember: 2, amber: 1, sapphire: 1 }, seals: { pursuit: 1 } };
    assert.equal(hymnGraceCost(run.hymns[0]), 15);
    assert.equal(errorOf(applyCoal(run, "coalFromTheAltar", "ember")), "tier-locked");
    run = atTier(run, 1);
    run = unwrap(applyCoal(run, "coalFromTheAltar", "ember"));
    assert.equal(hymnGraceCost(run.hymns[0]), 17);
    assert.equal(errorOf(applyCoal(run, "coalFromTheAltar", "ember")), "coal-duplicate");
    run = unwrap(applyCoal(run, "coalFromTheAltar", "amber"));
    assert.equal(hymnGraceCost(run.hymns[0]), 20);
    assert.equal(errorOf(applyCoal(run, "coalFromTheAltar", "sapphire")), "coal-limit");
    run = unwrap(applySeal(run, "coalFromTheAltar", "pursuit"));
    assert.equal(hymnGraceCost(run.hymns[0]), 20);
    run = unwrap(equipHymn(run, "coalFromTheAltar", { kind: "combat", index: 0 }));
    assert.equal(deriveCombatStats(run).hymns[0].graceCost, 20);
});

test("Vows: Tier 2, one at a time, broken at the Mercy Seat", () => {
    const meta = freshMeta();
    let run = completeQuest(withAttrs(makeRun(), { might: 40, voice: 50 }), "quest:gate");
    assert.equal(errorOf(swearVow(atTier(run, 1), "flamingSword", meta)), "tier-locked");
    run = atTier(run, 2);
    assert.equal(errorOf(swearVow(withAttrs(run, { might: 39 }), "flamingSword", meta)), "requirement");
    run = unwrap(swearVow(run, "flamingSword", meta));
    assert.equal(run.vow?.id, "flamingSword");
    assert.ok(run.gifts.some((g) => g.id === "turningEveryWay" && g.source === "vow"));
    assert.ok(run.hymns.some((h) => h.id === "noneShallPass"));
    assert.equal(run.pendingTestimony, 5);
    assert.equal(errorOf(swearVow(run, "herald", meta)), "vow-held");
    run = unwrap(progressVow(unwrap(progressVow(run))));
    assert.ok(run.witnesses.includes("vowCompleted:flamingSword"));
    run = unwrap(breakVow(run));
    assert.equal(run.vow, null);
    assert.ok(!run.gifts.some((g) => GIFTS[g.id].vow === "flamingSword"));
    assert.ok(!run.hymns.some((h) => h.id === "noneShallPass"));
    assert.equal(errorOf(swearVow(run, "flamingSword", meta)), "vow-barred");
    run = unwrap(breakVow(unwrap(swearVow(run, "herald", meta))));
    assert.equal(unwrap(swearVow(run, "herald", meta)).vow?.id, "herald");
});

test("a fully progressed Vow can be skipped for 10 Visions", () => {
    const run = { ...atTier(withAttrs(makeRun(), { might: 40 }), 2), visions: 10 };
    assert.equal(errorOf(swearVow(run, "flamingSword", freshMeta(), { skipQuests: true })), "quest-required");
    const meta = { ...freshMeta(), progressedVows: ["flamingSword" as const] };
    assert.equal(unwrap(swearVow(run, "flamingSword", meta, { skipQuests: true })).visions, 0);
});

test("the Forbidden Vow needs Tier 5 and Stain 50, and breaking it marks you", () => {
    const meta = freshMeta();
    let run = completeQuest({ ...makeRun(), stain: 50, peakStain: 50 }, "quest:keyOfThePit");
    assert.equal(errorOf(swearVow(atTier(run, 4), "fallenStar", meta)), "tier-locked");
    assert.equal(errorOf(swearVow(atTier({ ...run, stain: 40 }, 5), "fallenStar", meta)), "requirement");
    run = unwrap(swearVow(atTier(run, 5), "fallenStar", meta));
    assert.equal(run.stain, 60);
    assert.deepEqual(vowConsequences(run), { alliesHostile: true, pureEndingsLocked: true });
    run = unwrap(breakVow(run));
    assert.equal(run.fallenStarMark, true);
    assert.equal(errorOf(swearVow(run, "fallenStar", meta)), "vow-barred");
});

test("Anointings: one per item, soulbound on equip, Brands from Tier 3 add Stain", () => {
    let run = makeRun();
    const weapon = run.equipped.weapon as string;
    assert.equal(errorOf(applyAnointing(atTier(run, 1), weapon, "coalAnointed")), "tier-locked");
    run = atTier(run, 2);
    assert.equal(errorOf(applyAnointing(run, weapon, "watchersOil")), "wrong-slot");
    run = unwrap(applyAnointing(run, weapon, "coalAnointed"));
    assert.equal(run.items[0].soulbound, true);
    assert.equal(errorOf(applyAnointing(run, weapon, "amberGlory")), "item-anointed");
    assert.equal(errorOf(dropItem(run, weapon)), "soulbound");
    const added = addItem(run, { slot: "armour", weapon: null, tier: 1, anointing: null, soulbound: false });
    assert.equal(errorOf(applyAnointing(added.run, added.item.id, "leviathanScale")), "tier-locked");
    run = unwrap(applyAnointing(atTier(added.run, 3), added.item.id, "leviathanScale"));
    assert.equal(run.stain, 10);
    assert.equal(run.items.find((i) => i.id === added.item.id)?.soulbound, false);
    run = unwrap(equipItem(run, added.item.id));
    assert.equal(run.items.find((i) => i.id === added.item.id)?.soulbound, true);
    assert.equal(deriveCombatStats(run).canParry, false);
    const spare = addItem(run, { slot: "weapon", weapon: "spear", tier: 1, anointing: "coalAnointed", soulbound: false });
    run = unwrap(equipItem(spare.run, spare.item.id));
    assert.deepEqual(activeAnointings(run), ["coalAnointed", "leviathanScale"]);
});

test("special weapons are loot gated by tier and quests; starters are basic", () => {
    const run = makeRun();
    assert.ok(weaponUnlocked(run, "knife"));
    assert.deepEqual(weaponDropTable(run), []);
    assert.ok(!weaponUnlocked(atTier(run, 2), "flamingSword"));
    assert.ok(weaponUnlocked(completeQuest(atTier(run, 2), "quest:gate"), "flamingSword"));
    const tier4 = weaponDropTable(atTier(run, 4)).map((e) => e.item);
    assert.ok(tier4.includes("bowOfLight") && !tier4.includes("heraldsHorn"));
});
