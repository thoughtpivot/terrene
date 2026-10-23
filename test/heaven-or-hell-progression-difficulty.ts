import assert from "node:assert/strict";
import test from "node:test";
import {
    DEFAULT_DIFFICULTY,
    DIFFICULTIES,
    DifficultyId,
    SAVE_VERSION,
    V1_MINUTES_PER_TIER,
    addItem,
    applyStain,
    deserializeSave,
    enemyScaling,
    freshMeta,
    lootTier,
    minutesToLastTier,
    secondsToNextTier,
    serializeSave,
    tierAt,
    tierOf,
    validateCreation,
    weaponItem,
    wipe,
} from "../src/components/scenes/HeavenOrHell/progression/index.ts";
import { atTier, baseInput, errorOf, makeRun, tierSeconds, unwrap } from "./heaven-or-hell-progression-fixtures.ts";

const IDS: DifficultyId[] = ["stillWaters", "narrowWay", "furnaceOfAffliction", "sonOfTheMorning"];

test("there are exactly four difficulties, easiest to hardest, ready for a picker", () => {
    assert.deepEqual(DIFFICULTIES.map((d) => d.id), IDS);
    assert.equal(DEFAULT_DIFFICULTY, "narrowWay");
    for (const d of DIFFICULTIES) {
        assert.ok(d.name && d.subtitle && d.epigraph.text && d.epigraph.ref);
        assert.ok(!/\b(God|Christ|Gabriel|Raphael|Uriel|Michael)\b/.test(`${d.name} ${d.subtitle} ${d.epigraph.text}`));
    }
    assert.deepEqual(DIFFICULTIES.map((d) => d.accent), ["white", "gold", "orange", "red"]);
});

test("easier difficulties run shorter: minutes per tier rise to 100 at the hardest", () => {
    assert.deepEqual(DIFFICULTIES.map((d) => d.minutesPerTier), [40, 60, 80, 100]);
    assert.deepEqual(IDS.map(minutesToLastTier), [200, 300, 400, 500]);
    for (const id of IDS) {
        const minutes = DIFFICULTIES.find((d) => d.id === id)!.minutesPerTier;
        assert.equal(tierAt(minutes * 60 - 1, id), 0);
        for (let t = 1; t <= 5; t++) assert.equal(tierAt(t * minutes * 60, id), t);
        assert.equal(secondsToNextTier(0, id), minutes * 60);
    }
    const twoHours = 2 * 3600;
    assert.deepEqual(IDS.map((id) => tierAt(twoHours, id)), [3, 2, 1, 1]);
    const easy = { ...makeRun({ difficulty: "stillWaters" }), elapsedSeconds: twoHours };
    const hard = { ...makeRun({ difficulty: "sonOfTheMorning" }), elapsedSeconds: twoHours };
    assert.ok(tierOf(easy) > tierOf(hard));
});

test("enemy scaling multiplies the tier's scaling by the difficulty's", () => {
    const scaling = (id: DifficultyId, tier: number) => enemyScaling(atTier(makeRun({ difficulty: id }), tier));
    assert.deepEqual(scaling("narrowWay", 0), { hp: 1, posture: 1, damage: 1, aggression: 1 });
    assert.deepEqual(scaling("stillWaters", 0), { hp: 0.7, posture: 0.8, damage: 0.7, aggression: 0.8 });
    assert.deepEqual(scaling("sonOfTheMorning", 0), { hp: 1.5, posture: 1.3, damage: 1.4, aggression: 1.3 });
    assert.ok(Math.abs(scaling("furnaceOfAffliction", 2).hp - 1.35 * 1.25) < 1e-9);
    for (const tier of [0, 3, 5]) {
        const rows = IDS.map((id) => scaling(id, tier));
        for (let i = 1; i < rows.length; i++) {
            for (const key of ["hp", "posture", "damage", "aggression"] as const) assert.ok(rows[i][key] > rows[i - 1][key], `${key} tier ${tier}`);
        }
    }
});

test("difficulty sets the Stain rate and loot quality", () => {
    const heart = (id: DifficultyId) => applyStain(makeRun({ difficulty: id }), "demonHeart").stain;
    assert.deepEqual(IDS.map(heart), [6, 8, 9, 10]);
    assert.deepEqual(IDS.map((id) => lootTier(atTier(makeRun({ difficulty: id }), 2))), [3, 3, 4, 4]);
    assert.equal(weaponItem(atTier(makeRun({ difficulty: "sonOfTheMorning" }), 4), "bowOfLight").tier, 6);
    assert.equal(addItem(makeRun(), weaponItem(makeRun(), "censerFlail")).item.tier, 1);
});

test("difficulty is chosen at creation, validated, and kept through a wipe", () => {
    assert.ok(validateCreation(baseInput({ difficulty: "easy" as DifficultyId }), freshMeta()).includes("difficulty:unknown"));
    assert.deepEqual(validateCreation(baseInput({ difficulty: "easy" as DifficultyId }), freshMeta(), "testimonyAndPenances"), []);
    const run = makeRun({ difficulty: "furnaceOfAffliction" });
    assert.equal(run.difficulty, "furnaceOfAffliction");
    assert.equal(unwrap(wipe(run, freshMeta(), { seed: 3 })).fresh?.difficulty, "furnaceOfAffliction");
});

test("save and load keep the difficulty and refuse an unknown one", () => {
    const run = { ...makeRun({ difficulty: "stillWaters" }), elapsedSeconds: tierSeconds(2, "stillWaters") + 30 };
    const loaded = unwrap(deserializeSave(serializeSave(freshMeta(), run)));
    assert.deepEqual(loaded.run, run);
    assert.equal(tierOf(loaded.run!), 2);
    assert.equal(JSON.parse(serializeSave(freshMeta(), run)).version, SAVE_VERSION);
    const bad = JSON.parse(serializeSave(freshMeta(), run));
    bad.run.difficulty = "nightmare";
    assert.equal(errorOf(deserializeSave(JSON.stringify(bad))), "bad-run:run.difficulty");
});

test("version 1 saves migrate to the default difficulty at the same corruption level", () => {
    const run = makeRun();
    const v1Elapsed = 2.5 * V1_MINUTES_PER_TIER * 60;
    const old = JSON.parse(serializeSave(freshMeta(), { ...run, elapsedSeconds: v1Elapsed }));
    old.version = 1;
    delete old.run.difficulty;
    delete old.run.character.creation.difficulty;
    const loaded = unwrap(deserializeSave(JSON.stringify(old))).run!;
    assert.equal(loaded.difficulty, DEFAULT_DIFFICULTY);
    assert.equal(loaded.character.creation.difficulty, DEFAULT_DIFFICULTY);
    assert.equal(tierOf(loaded), 2);
    assert.equal(loaded.elapsedSeconds, 2.5 * 60 * 60);
    const metaOnly = JSON.parse(serializeSave(freshMeta(), null));
    metaOnly.version = 1;
    assert.equal(unwrap(deserializeSave(JSON.stringify(metaOnly))).run, null);
});
