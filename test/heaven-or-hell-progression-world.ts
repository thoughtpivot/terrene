import assert from "node:assert/strict";
import test from "node:test";
import {
    ALL_ATTRIBUTES,
    CorruptionTier,
    GIFTS,
    TIER_SCALING,
    activePassive,
    addTrumpetProgress,
    advanceTime,
    ascend,
    ascensionCap,
    applyStain,
    cleanseStain,
    deriveCombatStats,
    earnVisions,
    experienceForAscension,
    firstTierFor,
    gainExperience,
    learnHymn,
    livesLeft,
    recordBossKill,
    regionTier,
    restoreHalo,
    rollTrumpet,
    sealBreach,
    secondsToNextTier,
    seedRng,
    shrineCost,
    soundTrumpet,
    spendVisions,
    stainEffects,
    strikeDown,
    swearVow,
    tierAt,
    tierOf,
    useJoinedWings,
    useLots,
    useMouth,
    usePartedWings,
    useRefiningCleanse,
    useRefiningRefund,
    useScales,
    freshMeta,
    completeQuest,
    sumAttributes,
} from "../src/components/scenes/HeavenOrHell/progression/index.ts";
import { atTier, errorOf, makeRun, tierSeconds, unwrap, withAttrs, withGifts } from "./heaven-or-hell-progression-fixtures.ts";

test("corruption rises on its own steady clock through Tiers 0 to 5", () => {
    assert.equal(tierAt(0), 0);
    assert.equal(tierAt(tierSeconds(1) - 1), 0);
    for (let t = 1; t <= 5; t++) assert.equal(tierAt(tierSeconds(t)), t);
    assert.equal(tierAt(tierSeconds(50)), 5);
    let last = 0;
    for (let s = 0; s <= tierSeconds(6); s += 600) {
        assert.ok(tierAt(s) >= last);
        last = tierAt(s);
    }
    assert.equal(secondsToNextTier(0), tierSeconds(1));
    assert.equal(secondsToNextTier(tierSeconds(5)), null);
    let run = makeRun();
    run = advanceTime(advanceTime(run, tierSeconds(2)), -5000);
    assert.equal(tierOf(run), 2);
});

test("sealing a breach never lowers corruption; it freezes that region", () => {
    let run = atTier(makeRun(), 2);
    run = unwrap(sealBreach(run, "outerCourts"));
    assert.equal(tierOf(run), 2);
    assert.equal(errorOf(sealBreach(run, "outerCourts")), "already-sealed");
    run = advanceTime(run, tierSeconds(2));
    assert.equal(tierOf(run), 4);
    assert.equal(regionTier(run, "outerCourts"), 2);
    assert.equal(regionTier(run, "crystalSea"), 4);
});

test("every tier is harder and richer, with no cap on strength", () => {
    for (let t = 1; t <= 5; t++) {
        const prev = TIER_SCALING[(t - 1) as CorruptionTier];
        const cur = TIER_SCALING[t as CorruptionTier];
        for (const key of ["enemyHp", "enemyPosture", "enemyDamage", "enemyAggression", "weaponTier", "lootTier", "costMult", "rewardMult"] as const) {
            assert.ok(cur[key] > prev[key], `${key} at tier ${t}`);
        }
        assert.ok(experienceForAscension(5, t as CorruptionTier) > experienceForAscension(5, (t - 1) as CorruptionTier));
    }
    for (let t = 0; t <= 5; t++) assert.equal(ascensionCap(t as CorruptionTier), 20);
    let run = makeRun();
    for (let i = 0; i < 20; i++) run = unwrap(ascend(run, { free: true }));
    assert.equal(tierOf(run), 0);
    assert.equal(run.ascension, 20);
    assert.ok(gainExperience(atTier(makeRun(), 3), 100).xp > gainExperience(makeRun(), 100).xp);
    assert.ok(earnVisions(atTier(makeRun(), 5), 2).visions > earnVisions(makeRun(), 2).visions);
});

test("tiers unlock systems on schedule", () => {
    assert.equal(firstTierFor("vows"), 2);
    assert.equal(firstTierFor("brands"), 3);
    assert.equal(firstTierFor("fallenPool"), 3);
    assert.equal(firstTierFor("shrine:mouth"), 3);
    assert.equal(firstTierFor("trumpets"), 4);
    assert.equal(firstTierFor("forbiddenVow"), 5);
    assert.equal(firstTierFor("abyssalTrumpets"), 5);
});

test("Ascension costs experience, restores a dimmed halo and opens a hand", () => {
    let run = makeRun();
    assert.equal(errorOf(ascend(run)), "not-enough-experience");
    run = gainExperience(run, experienceForAscension(1, 0));
    run = { ...run, halo: "dimmed" };
    run = unwrap(ascend(run));
    assert.equal(run.ascension, 1);
    assert.equal(run.halo, "bright");
    assert.equal(run.visions, 1);
    assert.equal(run.pendingHands.length, 1);
    assert.equal(run.pendingHymnDraws.length, 1);
    assert.equal(run.pendingTestimony, 0.75);
});

test("two lives: the halo dims, then the angel is cast out", () => {
    let run = makeRun();
    assert.equal(livesLeft(run), 2);
    let hit = strikeDown(run, { inBreach: false });
    assert.equal(hit.outcome, "dimmed");
    assert.equal(livesLeft(hit.run), 1);
    run = restoreHalo(hit.run);
    assert.equal(run.halo, "bright");
    hit = strikeDown(strikeDown(run, { inBreach: false }).run, { inBreach: false });
    assert.equal(hit.outcome, "castOut");
    assert.equal(hit.run.status, "castOut");
    assert.equal(errorOf(ascend(hit.run, { free: true })), "run-over");
});

test("the Throne answers in a breach with full Progress from Tier 4", () => {
    const full = { ...atTier(makeRun(), 4), trumpetProgress: 100 };
    const answered = strikeDown(full, { inBreach: true });
    assert.equal(answered.outcome, "throne");
    assert.equal(answered.run.halo, "bright");
    assert.equal(answered.run.trumpetProgress, 0);
    assert.equal(answered.run.pendingTrumpetChoice?.length, 3);
    assert.equal(answered.run.pendingTestimony, 15);
    assert.equal(strikeDown(full, { inBreach: false }).outcome, "dimmed");
    assert.equal(strikeDown({ ...full, elapsedSeconds: tierSeconds(3) }, { inBreach: true }).outcome, "dimmed");
    assert.equal(addTrumpetProgress(atTier(makeRun(), 3), "bossKill").trumpetProgress, 0);
    assert.equal(recordBossKill(atTier(makeRun(), 4), "behemoth").trumpetProgress, 35);
});

test("Trumpet rarities follow the tier; Clipped Choir silences them", () => {
    const rarities = (tier: CorruptionTier) => {
        const seen = new Set<string>();
        for (let i = 0; i < 400; i++) seen.add(rollTrumpet(seedRng(i), tier).trumpet.rarity);
        return seen;
    };
    assert.deepEqual([...rarities(4)].sort(), ["Cracked", "Normal"]);
    assert.deepEqual([...rarities(5)].sort(), ["Abyssal", "Archangel", "Cracked", "Normal"]);
    const t = rollTrumpet(seedRng(1), 5).trumpet;
    assert.equal(Object.keys(t.substats).reduce((s, k) => s + t.substats[k], 0), 10);
    const holder = { ...makeRun(), trumpet: t };
    assert.ok(soundTrumpet(holder).ok);
    assert.equal(errorOf(soundTrumpet({ ...holder, penances: ["clippedChoir"] })), "penance");
    const abyss = { ...holder, trumpet: { id: "keyOfThePit" as const, rarity: "Abyssal" as const, substats: {} } };
    assert.equal(unwrap(soundTrumpet(abyss)).cost.hpFraction, 0.1);
    assert.equal(unwrap(soundTrumpet(abyss)).run.stain, 3);
});

test("Stain thresholds at 25, 50 and 75 bring their effects", () => {
    const run = makeRun();
    const at = (stain: number) => ({ ...run, stain, peakStain: stain });
    assert.equal(stainEffects(at(24)).crackedHalo, false);
    assert.equal(stainEffects(at(25)).crackedHalo, true);
    assert.equal(deriveCombatStats(at(25)).maxSanctity, Math.round(deriveCombatStats(at(0)).maxSanctity * 0.9));
    assert.equal(activePassive(at(49)).id, "liveCoal");
    assert.equal(activePassive(at(50)).id, "smoulder");
    assert.equal(stainEffects(at(75)).eliteHesitation, true);
    const cleansed = unwrap(cleanseStain({ ...at(80), visions: 10 }, "refiningShrine")).run;
    assert.equal(cleansed.stain, 70);
    assert.equal(stainEffects(cleansed).eliteHesitation, false);
    assert.equal(stainEffects(cleansed).pureEndingsLocked, true);
    assert.equal(at(30).halo, "bright");
});

test("at 100 Stain the angel Falls and the run ends", () => {
    let run = applyStain({ ...makeRun(), stain: 95, peakStain: 95 }, "demonHeart");
    assert.equal(run.stain, 100);
    assert.equal(run.status, "fallen");
    assert.equal(stainEffects(run).fallen, true);
    assert.equal(errorOf(ascend(run, { free: true })), "run-over");
    run = applyStain(makeRun({ choir: "watcherKin" }), "demonHeart");
    assert.equal(run.stain, 10);
});

test("Stain cleansing is data with costs and limits", () => {
    let run = { ...makeRun(), stain: 40, peakStain: 40, visions: 10 };
    run = unwrap(useRefiningCleanse(run));
    assert.deepEqual([run.stain, run.visions], [30, 7]);
    run = unwrap(useRefiningCleanse(run));
    assert.equal(errorOf(useRefiningCleanse(run)), "cleanse-limit");
    const vigil = unwrap(cleanseStain(run, "altarVigil"));
    assert.equal(vigil.cost.sanctity, 30);
    assert.equal(errorOf(cleanseStain(run, "livingWater")), "quest-required");
    assert.equal(unwrap(cleanseStain(completeQuest(run, "quest:riverOfLife"), "livingWater")).run.stain, 0);
    assert.equal(errorOf(cleanseStain(run, "sacrificialCleansing")), "tongue-required");
    const tier2 = unwrap(cleanseStain({ ...atTier(makeRun(), 2), stain: 20, visions: 10 }, "refiningShrine"));
    assert.equal(tier2.cost.visions, 4);
});

test("Visions are spent at prices that rise with the tier", () => {
    const run = { ...makeRun(), visions: 12 };
    assert.equal(errorOf(spendVisions({ ...run, visions: 4 }, 5)), "not-enough-visions");
    assert.equal(unwrap(spendVisions(run, 5)).visions, 7);
    assert.equal(shrineCost(atTier(run, 3), 10), 14);
    assert.equal(unwrap(spendVisions(atTier(run, 3), 5)).visions, 5);
});

test("Shrine of Refining refunds up to three points, never below a Gift's requirement", () => {
    let run = { ...makeRun(), visions: 10 };
    run = unwrap(useRefiningRefund(run, "faith"));
    assert.deepEqual([run.character.attributes.faith, run.unspentPoints, run.visions], [7, 1, 9]);
    run = unwrap(useRefiningRefund(unwrap(useRefiningRefund(run, "faith")), "faith"));
    assert.equal(errorOf(useRefiningRefund(run, "faith")), "refund-limit");
    const holder = withGifts(withAttrs({ ...makeRun(), visions: 5 }, { steadfast: 20 }), ["coveringWings"]);
    assert.equal(errorOf(useRefiningRefund(holder, "steadfast")), "gift-requirement");
    assert.equal(errorOf(useRefiningRefund({ ...makeRun(), visions: 0 }, "faith")), "not-enough-visions");
});

test("Shrine of the Scales averages stats once, within its limits", () => {
    let run = withAttrs({ ...makeRun(), ascension: 8, visions: 30 }, { might: 60, seraphFire: 50, steadfast: 10, faith: 8, mediumArms: 0 });
    assert.equal(errorOf(useScales(atTier(run, 1))), "tier-locked");
    run = atTier(run, 2);
    assert.equal(errorOf(useScales({ ...run, ascension: 7 })), "ascension");
    const before = run.character.attributes;
    const after = unwrap(useScales(run));
    const a = after.character.attributes;
    assert.equal(sumAttributes(a) + after.unspentPoints, sumAttributes(before));
    assert.equal(a.might, 35);
    assert.ok(before.seraphFire - a.seraphFire > 25);
    for (const id of ALL_ATTRIBUTES) if (id !== "seraphFire") assert.ok(before[id] - a[id] <= 25, id);
    assert.equal(after.visions, 30 - 13);
    assert.equal(errorOf(useScales(after)), "once-per-run");
    const sworn = unwrap(swearVow(completeQuest(withAttrs(run, { might: 60 }), "quest:gate"), "flamingSword", freshMeta()));
    assert.equal(errorOf(useScales(sworn)), "vow-held");
});

test("Joined Wings, Parted Wings and Lots trade Gifts and Hymns", () => {
    let run = withGifts({ ...makeRun(), visions: 20 }, ["kindling", "longStride"]);
    assert.equal(errorOf(useJoinedWings(run, ["kindling", "unceasingSong"])), "gift-not-tradeable");
    const joined = unwrap(useJoinedWings(run, ["kindling", "longStride"]));
    assert.equal(joined.visions, 15);
    assert.equal(joined.pendingHymnDraws.length, 1);
    assert.ok(!joined.gifts.some((g) => g.id === "kindling"));

    run = unwrap(learnHymn(run, "coalFromTheAltar"));
    assert.equal(errorOf(usePartedWings(run, "coalFromTheAltar")), "tier-locked");
    const parted = unwrap(usePartedWings(atTier(run, 1), "coalFromTheAltar"));
    assert.equal(parted.hymns.length, 0);
    assert.equal(parted.pendingHands.length, 2);
    assert.ok(parted.pendingHands.every((h) => h.cards.every((c) => GIFTS[c].rarity === "Common")));

    const lots = withGifts(withAttrs(atTier({ ...makeRun(), visions: 20 }, 1), { mediumArms: 30, steadfast: 35 }), ["riposte"]);
    const rareHand = unwrap(useLots(lots, "riposte"));
    assert.ok(rareHand.pendingHands[0].cards.every((c) => GIFTS[c].rarity === "Rare"));
    assert.equal(errorOf(useLots(lots, "riposte", { rares: true })), "needs-common");
    const upgraded = unwrap(useLots(withGifts(lots, ["kindling"]), "kindling", { rares: true }));
    assert.equal(upgraded.visions, 20 - 11);
    assert.ok(upgraded.pendingHands[0].cards.every((c) => GIFTS[c].rarity === "Rare"));
});

test("the Mouth gives three Ascensions, a Burden and Stain; above 17 it rerolls a Burden", () => {
    const run = { ...makeRun(), visions: 20, ascension: 5 };
    assert.equal(errorOf(useMouth(atTier(run, 2))), "tier-locked");
    const spoke = unwrap(useMouth(atTier(run, 3)));
    assert.equal(spoke.ascension, 8);
    assert.equal(spoke.unspentPoints, 45);
    assert.equal(spoke.character.burdens.length, 2);
    assert.equal(spoke.stain, 15);
    assert.equal(spoke.visions, 20 - 7 + 3 * 2);
    const late = unwrap(useMouth(atTier({ ...run, ascension: 18 }, 3)));
    assert.equal(late.ascension, 18);
    assert.equal(late.character.burdens.length, 1);
    assert.notDeepEqual(late.character.burdens, ["doubting"]);
    assert.equal(late.stain, 15);
});
