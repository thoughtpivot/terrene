import assert from "node:assert/strict";
import test from "node:test";
import {
    CHOIRS,
    CHOIR_IDS,
    HARD_CAP,
    MetaState,
    MAX_ASCENSION,
    SOFT_CAP,
    allocatePoints,
    ascend,
    buildRun,
    buyUpgrade,
    completeQuest,
    creationBudget,
    deriveCombatStats,
    freshMeta,
    learnTongue,
    sumAttributes,
    unsealAttribute,
    validateCreation,
} from "../src/components/scenes/HeavenOrHell/progression/index.ts";
import { baseInput, errorOf, makeRun, unwrap, wordlessInput } from "./heaven-or-hell-progression-fixtures.ts";

test("a valid angel is kindled with its Choir's +3 and +2", () => {
    const run = makeRun();
    const a = run.character.attributes;
    assert.equal(a.faith, 5 + 3);
    assert.equal(a.voice, 2);
    assert.equal(a.seraphFire, 10);
    assert.equal(sumAttributes(a), 15 + 10 + 5);
    assert.equal(run.ascension, 0);
    assert.equal(run.halo, "bright");
    assert.equal(run.stain, 0);
    assert.deepEqual(run.gifts.map((g) => g.id), ["unceasingSong", "altarBorn", "commonClay"]);
    assert.equal(run.items[0].weapon, "sword");
    assert.equal(run.equipped.weapon, run.items[0].id);
});

test("all eight Choirs can be chosen freely on a fresh account", () => {
    assert.equal(CHOIR_IDS.length, 8);
    for (const choir of CHOIR_IDS) {
        const def = CHOIRS[choir];
        assert.notEqual(def.bonus.major, def.bonus.minor);
        assert.equal(def.innateGifts.length, 2);
        const allocation = { ...baseInput().allocation, seraphFire: choir === "virtuant" ? 11 : 10 };
        const run = makeRun({ choir, allocation });
        assert.equal(run.character.attributes[def.bonus.major] - (allocation[def.bonus.major] ?? 0), 3);
    }
});

test("Wordless gets 10 free points; Tongue-takers must put 10 in their Tongues", () => {
    assert.deepEqual(creationBudget({ choir: "kindled", variant: null, tongues: [] }), { free: 25, tongueBound: 0, total: 25 });
    assert.deepEqual(creationBudget({ choir: "kindled", variant: null, tongues: ["firmament"] }), { free: 15, tongueBound: 10, total: 25 });
    assert.equal(unwrap(buildRun(wordlessInput(), freshMeta(), 1)).character.wordless, true);
    const lazy = baseInput({ allocation: { seraphFire: 5, faith: 10, mediumArms: 5, steadfast: 5 } });
    assert.ok(validateCreation(lazy, freshMeta()).includes("allocation:tongue-points"));
    const wordlessTongue = wordlessInput({ allocation: { might: 15, seraphFire: 10 } });
    assert.ok(validateCreation(wordlessTongue, freshMeta()).includes("allocation:tongue-not-chosen"));
});

test("Virtuant gets one more Tongue point; Hail-Crowned gives it up", () => {
    assert.equal(creationBudget({ choir: "virtuant", variant: null, tongues: ["whirlwind"] }).tongueBound, 11);
    assert.equal(creationBudget({ choir: "virtuant", variant: null, tongues: [] }).free, 26);
    assert.equal(creationBudget({ choir: "virtuant", variant: "hailCrownedVirtuant", tongues: ["whirlwind"] }).tongueBound, 10);
});

test("creation rejects broken choices with clear codes", () => {
    const meta = freshMeta();
    const codes = (over: Parameters<typeof baseInput>[0]) => validateCreation(baseInput(over), meta);
    assert.ok(codes({ tongues: ["seraphFire", "firmament", "whirlwind"] }).includes("tongues:too-many"));
    assert.ok(codes({ tongues: ["radiance"], allocation: { radiance: 10, faith: 15 } }).includes("tongues:locked"));
    assert.ok(codes({ arms: "flamingSword" as never }).includes("arms:not-basic"));
    assert.ok(codes({ boons: [] }).includes("boons:count"));
    assert.ok(codes({ boons: ["lampBearer", "psalmist", "unseen"] }).includes("boons:count"));
    assert.ok(codes({ boons: ["lampBearer", "psalmist"], burdens: ["doubting"] }).includes("boons:not-paid"));
    assert.deepEqual(codes({ boons: ["lampBearer", "psalmist"], burdens: ["unlettered"] }), []);
    assert.ok(codes({ burdens: ["tarnished"] }).includes("burdens:not-selectable"));
    assert.ok(codes({ boons: ["tirelessWing"], burdens: ["clipped"] }).includes("boons:exclusive"));
    assert.ok(codes({ origin: "penitent" }).includes("origin:locked"));
    assert.ok(codes({ variant: "ashenKindled" }).includes("choir:variant-locked"));
    assert.ok(codes({ variant: "sapphireWheelborn" }).includes("choir:variant-mismatch"));
    assert.ok(codes({ allocation: { seraphFire: 10, faith: 20 } }).includes("allocation:wrong-total"));
    const base = baseInput();
    assert.ok(validateCreation({ ...base, appearance: { ...base.appearance, wings: { ...base.appearance.wings, count: 7 } } }, meta).includes("appearance:wing-count"));
    assert.ok(validateCreation({ ...base, appearance: { ...base.appearance, eyes: { style: "glow", wingEyes: true } } }, meta).includes("appearance:wing-eyes"));
    assert.ok(validateCreation({ ...base, appearance: { ...base.appearance, mark: "lion" } }, meta).includes("appearance:mark"));
});

test("the flow validates step by step in Deepwoken's order", () => {
    const broken = baseInput({ tongues: ["seraphFire", "firmament", "whirlwind"], origin: "penitent" });
    assert.deepEqual(validateCreation(broken, freshMeta(), "choir"), []);
    assert.deepEqual(validateCreation(broken, freshMeta(), "tongues"), ["tongues:too-many"]);
    assert.ok(validateCreation(broken, freshMeta(), "origin").includes("origin:locked"));
});

test("unlocks from Testimony and Remembrance open locked options", () => {
    let meta: MetaState = { ...freshMeta(), testimony: 200, learnedTongues: ["radiance"] };
    meta = unwrap(buyUpgrade(meta, "startingVisions"));
    meta = unwrap(buyUpgrade(meta, "startingFeathers"));
    meta = { ...meta, unlockedVariants: ["seventhWatcher"], unlockedOrigins: [...meta.unlockedOrigins, "penitent"] };
    const run = makeRun({ choir: "watcherKin", variant: "seventhWatcher", tongues: ["radiance"], allocation: { radiance: 10, faith: 15 }, origin: "penitent" }, meta);
    assert.equal(run.stain, 10);
    assert.equal(run.visions, 1);
    assert.equal(run.feathers, 1);
    assert.ok(run.gifts.some((g) => g.id === "penitentsLedger" && g.source === "origin"));
});

test("allocation respects the soft cap of 75 and Unsealing raises it to 100", () => {
    let run = { ...makeRun(), unspentPoints: 200 };
    assert.equal(errorOf(allocatePoints(run, "might", 76)), "soft-cap");
    run = unwrap(allocatePoints(run, "might", SOFT_CAP));
    assert.equal(errorOf(allocatePoints(run, "might", 1)), "soft-cap");
    assert.equal(errorOf(unsealAttribute(run, "might")), "quest-required");
    run = unwrap(unsealAttribute(completeQuest(run, "unsealing:might"), "might"));
    run = unwrap(allocatePoints(run, "might", HARD_CAP - SOFT_CAP));
    assert.equal(run.character.attributes.might, 100);
    assert.equal(errorOf(allocatePoints(run, "might", 1)), "hard-cap");
    assert.equal(errorOf(allocatePoints({ ...run, unspentPoints: 0 }, "faith", 1)), "not-enough-points");
});

test("Tongue points need the Tongue, and Wordless angels never learn one", () => {
    const run = { ...makeRun(), unspentPoints: 10 };
    assert.equal(errorOf(allocatePoints(run, "firmament", 1)), "tongue-not-known");
    const learned = unwrap(learnTongue(run, "firmament", freshMeta()));
    assert.ok(unwrap(allocatePoints(learned, "firmament", 1)).character.attributes.firmament === 1);
    assert.equal(errorOf(learnTongue(run, "radiance", freshMeta())), "quest-required");
    const wordless = unwrap(buildRun(wordlessInput(), freshMeta(), 2));
    assert.equal(errorOf(learnTongue(wordless, "firmament", freshMeta())), "wordless");
});

test("Ascension gives 15 points each, up to 20, for 330 in total", () => {
    let run = unwrap(buildRun(wordlessInput(), freshMeta(), 3));
    for (let i = 1; i <= MAX_ASCENSION; i++) {
        const before = run.unspentPoints;
        run = unwrap(ascend(run, { free: true }));
        assert.equal(run.unspentPoints - before, 15);
    }
    assert.equal(run.ascension, 20);
    assert.equal(sumAttributes(run.character.attributes) + run.unspentPoints, 330);
    assert.equal(errorOf(ascend(run, { free: true })), "max-ascension");
});

test("Wisdom gives 2 Grace per point and Voice 1.5", () => {
    const run = makeRun();
    const base = deriveCombatStats(run).maxGrace;
    const wiser = deriveCombatStats({ ...run, character: { ...run.character, attributes: { ...run.character.attributes, wisdom: 10, voice: 12 } } });
    assert.equal(wiser.maxGrace - base, 10 * 2 + 10 * 1.5);
});
