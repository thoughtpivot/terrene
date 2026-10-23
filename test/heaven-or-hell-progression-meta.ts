import assert from "node:assert/strict";
import test from "node:test";
import {
    SAVE_VERSION,
    applyAnointing,
    ascend,
    bestiaryTier,
    buyUpgrade,
    completeQuest,
    deriveCombatStats,
    deserializeSave,
    discoverLandmark,
    drawGiftHand,
    freshMeta,
    learnLore,
    masteredCount,
    penanceMultiplier,
    recordKill,
    recordSeen,
    recordStudy,
    recordWitness,
    sealBreach,
    serializeSave,
    strikeDown,
    swearVow,
    progressVow,
    testimonyRank,
    unlockOrigin,
    unlockVariant,
    validateCreation,
    wipe,
    applyStain,
} from "../src/components/scenes/HeavenOrHell/progression/index.ts";
import { atTier, baseInput, errorOf, makeRun, unwrap, withAttrs } from "./heaven-or-hell-progression-fixtures.ts";

function rememberedMeta() {
    let meta = { ...freshMeta(), testimony: 5 };
    meta = recordSeen(meta, "imp");
    meta = discoverLandmark(meta, "gateOfEden");
    return learnLore(meta, "isaiah-6");
}

test("Witnesses pay Testimony once per run; Ascension pays every time", () => {
    let run = recordWitness(recordWitness(makeRun(), "sworeVow"), "sworeVow");
    assert.equal(run.pendingTestimony, 5);
    run = recordWitness(recordWitness(run, "ascension"), "ascension");
    assert.equal(run.pendingTestimony, 6.5);
    assert.equal(penanceMultiplier(["fragileHeart", "clippedChoir", "fated"]), 2.1);
    assert.deepEqual([0, 25, 160, 999].map(testimonyRank), ["E", "D", "B", "S"]);
});

test("a wipe resets Heaven and the character, loses Visions, and keeps Testimony and Remembrance", () => {
    const meta = rememberedMeta();
    let run = makeRun({ penances: ["fragileHeart"] }, meta, 11);
    run = { ...atTier(run, 3), visions: 25, stain: 40, peakStain: 40, ascension: 9, pendingTestimony: 10 };
    run = unwrap(sealBreach(run, "outerCourts"));
    run = strikeDown(strikeDown(run, { inBreach: false }).run, { inBreach: false }).run;
    assert.equal(run.status, "castOut");

    const result = unwrap(wipe(run, meta, { seed: 99 }));
    assert.equal(result.cause, "castOut");
    assert.equal(result.payout, 15);
    assert.equal(result.meta.testimony, 20);
    assert.equal(result.meta.lifetimeTestimony, 15);
    assert.equal(result.meta.runs, 1);
    assert.deepEqual(result.meta.bestiary, meta.bestiary);
    assert.deepEqual(result.meta.landmarks, ["gateOfEden"]);
    assert.deepEqual(result.meta.lore, ["isaiah-6"]);

    const fresh = result.fresh;
    assert.ok(fresh);
    assert.equal(fresh.status, "alive");
    assert.equal(fresh.visions, 0);
    assert.equal(fresh.stain, 0);
    assert.equal(fresh.ascension, 0);
    assert.equal(fresh.halo, "bright");
    assert.equal(fresh.elapsedSeconds, 0);
    assert.deepEqual(fresh.sealedRegions, []);
    assert.equal(fresh.seed, 99);
});

test("the Fall is a wipe that still pays Testimony and is remembered", () => {
    let run = { ...makeRun(), pendingTestimony: 4 };
    run = applyStain({ ...run, stain: 90, peakStain: 90 }, { amount: 10 });
    const result = unwrap(wipe(run, freshMeta(), { seed: 5 }));
    assert.equal(result.cause, "fallen");
    assert.equal(result.meta.falls, 1);
    assert.equal(result.meta.testimony, 4);
    assert.ok(unwrap(unlockVariant(result.meta, "seventhWatcher")).unlockedVariants.includes("seventhWatcher"));
    assert.equal(errorOf(unlockVariant(freshMeta(), "seventhWatcher")), "remembrance-required");
});

test("account unlocks survive: quest Tongues and fully progressed Vows", () => {
    let run = completeQuest(completeQuest(withAttrs(atTier(makeRun(), 2), { might: 40 }), "quest:radiance"), "quest:gate");
    run = unwrap(swearVow(run, "flamingSword", freshMeta()));
    run = unwrap(progressVow(unwrap(progressVow(run))));
    const meta = unwrap(wipe(run, freshMeta(), { seed: 1 })).meta;
    assert.deepEqual(meta.learnedTongues, ["radiance"]);
    assert.deepEqual(meta.progressedVows, ["flamingSword"]);
    assert.deepEqual(validateCreation(baseInput({ tongues: ["radiance"], allocation: { radiance: 10, faith: 15 } }), meta), []);
});

test("the Reliquary passes down one anointed item for Testimony", () => {
    let run = atTier(makeRun(), 2);
    run = unwrap(applyAnointing(run, "item-1", "amberGlory"));
    run = { ...run, pendingTestimony: 70 };
    assert.equal(errorOf(wipe({ ...run, pendingTestimony: 10 }, freshMeta(), { seed: 2, reliquaryItemId: "item-1" })), "not-enough-testimony");
    const result = unwrap(wipe(run, freshMeta(), { seed: 2, reliquaryItemId: "item-1" }));
    assert.equal(result.meta.testimony, 10);
    assert.equal(result.fresh?.items[1].anointing, "amberGlory");
    assert.equal(result.fresh?.items[1].soulbound, false);
});

test("the Testimony shop sells small capped upgrades and unlocks", () => {
    let meta = { ...freshMeta(), testimony: 100 };
    assert.equal(errorOf(buyUpgrade({ ...meta, testimony: 5 }, "demonDamage")), "not-enough-testimony");
    for (let i = 0; i < 4; i++) meta = unwrap(buyUpgrade(meta, "demonDamage"));
    assert.equal(errorOf(buyUpgrade(meta, "demonDamage")), "upgrade-maxed");
    assert.equal(meta.testimony, 60);
    meta = unwrap(unlockOrigin(meta, "loneVigil"));
    assert.ok(meta.unlockedOrigins.includes("loneVigil"));
    const run = makeRun({}, meta);
    assert.equal(deriveCombatStats(run).multipliers.demonDamageMult, 1.08);
});

test("the bestiary climbs Seen, Studied, Mastered; Wheelborn learn faster", () => {
    let meta = recordSeen(freshMeta(), "imp");
    assert.equal(bestiaryTier(meta.bestiary.imp), "Seen");
    for (let i = 0; i < 3; i++) meta = recordStudy(recordStudy(meta, "imp", "bite"), "imp", "lunge");
    assert.equal(bestiaryTier(meta.bestiary.imp), "Studied");
    assert.equal(bestiaryTier(meta.bestiary.imp, ["bite", "lunge", "grab"]), "Seen");
    for (let i = 0; i < 10; i++) meta = recordKill(meta, "imp");
    assert.equal(bestiaryTier(meta.bestiary.imp), "Mastered");
    assert.equal(masteredCount(meta), 1);
    let wheel = freshMeta();
    for (let i = 0; i < 3; i++) wheel = recordStudy(wheel, "locust", "sting", "wheelborn");
    for (let i = 0; i < 8; i++) wheel = recordKill(wheel, "locust", "wheelborn");
    assert.equal(bestiaryTier(wheel.bestiary.locust), "Mastered");
});

test("save and load round-trips meta and a run mid-climb", () => {
    let run = makeRun({}, freshMeta(), 42);
    run = unwrap(ascend(run, { free: true }));
    run = unwrap(sealBreach(atTier(run, 1), "outerCourts"));
    run = strikeDown(run, { inBreach: false }).run;
    const meta = rememberedMeta();
    const text = serializeSave(meta, run);
    const parsed = JSON.parse(text);
    assert.equal(parsed.version, SAVE_VERSION);
    const loaded = unwrap(deserializeSave(text));
    assert.deepEqual(loaded.meta, meta);
    assert.deepEqual(loaded.run, run);
    assert.deepEqual(drawGiftHand(loaded.run!).hand, drawGiftHand(run).hand);
    assert.deepEqual(unwrap(deserializeSave(serializeSave(meta, null))).run, null);
});

test("load rejects broken, foreign and future saves", () => {
    assert.equal(errorOf(deserializeSave("{nope")), "bad-json");
    assert.equal(errorOf(deserializeSave(JSON.stringify({ format: "other", version: 1 }))), "bad-format");
    const future = JSON.parse(serializeSave(freshMeta(), null));
    future.version = SAVE_VERSION + 1;
    assert.equal(errorOf(deserializeSave(JSON.stringify(future))), "newer-version");
    const broken = JSON.parse(serializeSave(freshMeta(), makeRun()));
    delete broken.run.visions;
    assert.equal(errorOf(deserializeSave(JSON.stringify(broken))), "bad-run:run.visions");
    const old = JSON.parse(serializeSave(freshMeta(), null));
    delete old.meta.lore;
    assert.deepEqual(unwrap(deserializeSave(JSON.stringify(old))).meta.lore, []);
});
