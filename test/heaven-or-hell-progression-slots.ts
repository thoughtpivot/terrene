import assert from "node:assert/strict";
import test from "node:test";
import {
    SAVE_KEY,
    SAVE_SLOT_COUNT,
    SLOT_IDS,
    SlotStorage,
    SlotSummary,
    deleteSlot,
    freshMeta,
    listSlots,
    loadSlot,
    migrateLegacySave,
    saveSlot,
    serializeSave,
    slotKey,
    slotMeta,
    startCharacterInSlot,
    strikeDown,
    wipe,
} from "../src/components/scenes/HeavenOrHell/progression/index.ts";
import { atTier, baseInput, errorOf, makeRun, unwrap } from "./heaven-or-hell-progression-fixtures.ts";

function memoryStorage(seed: Record<string, string> = {}): SlotStorage & { data: Map<string, string> } {
    const data = new Map(Object.entries(seed));
    return {
        data,
        getItem: (k) => (data.has(k) ? (data.get(k) as string) : null),
        setItem: (k, v) => void data.set(k, v),
        removeItem: (k) => void data.delete(k),
    };
}

function state(s: SlotSummary): string {
    return s.state;
}

test("there are three slots labelled A, B, C, all empty at first", () => {
    assert.equal(SAVE_SLOT_COUNT, 3);
    assert.deepEqual(SLOT_IDS, ["A", "B", "C"]);
    const slots = listSlots(memoryStorage());
    assert.deepEqual(
        slots.map((s) => [s.id, s.label, s.state]),
        [
            ["A", "A", "empty"],
            ["B", "B", "empty"],
            ["C", "C", "empty"],
        ],
    );
});

test("each slot is stored under its own versioned key", () => {
    assert.equal(slotKey("B"), `${SAVE_KEY}:slot-v1:B`);
    assert.equal(new Set(SLOT_IDS.map(slotKey)).size, SAVE_SLOT_COUNT);
});

test("start a character in an empty slot, then list, load and continue it", () => {
    const storage = memoryStorage();
    const started = unwrap(startCharacterInSlot(storage, "B", baseInput({ difficulty: "furnaceOfAffliction" }), 11, 1000));
    assert.equal(started.run?.difficulty, "furnaceOfAffliction");

    const later = atTier(started.run!, 2);
    const struck = strikeDown(later, { inBreach: false }).run;
    unwrap(saveSlot(storage, "B", started.meta, struck, 5000));

    const b = listSlots(storage)[1];
    assert.deepEqual(b, {
        id: "B",
        label: "B",
        state: "character",
        choirName: "Kindled",
        difficulty: "furnaceOfAffliction",
        difficultyName: "The Furnace of Affliction",
        tier: 2,
        playSeconds: struck.elapsedSeconds,
        life: "dimmed",
        lastPlayed: 5000,
    });
    assert.deepEqual(listSlots(storage).map(state), ["empty", "character", "empty"]);

    const loaded = unwrap(loadSlot(storage, "B"));
    assert.deepEqual(loaded.run, struck);
    assert.equal(loaded.savedAt, 5000);
});

test("the summary shows the variant's name and an ended run's state", () => {
    const storage = memoryStorage();
    const run = makeRun();
    unwrap(saveSlot(storage, "A", freshMeta(), { ...run, status: "castOut" }, 1));
    const a = listSlots(storage)[0];
    assert.equal(a.state === "character" && a.life, "castOut");
    unwrap(saveSlot(storage, "A", freshMeta(), { ...run, status: "fallen" }, 1));
    const fallen = listSlots(storage)[0];
    assert.equal(fallen.state === "character" && fallen.life, "fallen");
});

test("a slot cannot be overwritten by a new character until it is deleted", () => {
    const storage = memoryStorage();
    unwrap(startCharacterInSlot(storage, "A", baseInput(), 1, 1));
    assert.equal(errorOf(startCharacterInSlot(storage, "A", baseInput(), 2, 2)), "slot-occupied");
    unwrap(deleteSlot(storage, "A"));
    assert.equal(state(listSlots(storage)[0]), "empty");
    assert.equal(errorOf(loadSlot(storage, "A")), "empty-slot");
    unwrap(startCharacterInSlot(storage, "A", baseInput(), 2, 2));
});

test("a slot with meta but no run keeps its meta for the next character", () => {
    const storage = memoryStorage();
    const meta = { ...freshMeta(), testimony: 42 };
    unwrap(saveSlot(storage, "C", meta, null, 9));
    assert.deepEqual(listSlots(storage)[2], { id: "C", label: "C", state: "noCharacter", testimony: 42, lastPlayed: 9 });
    assert.equal(unwrap(slotMeta(storage, "C")).testimony, 42);
    assert.equal(unwrap(slotMeta(storage, "A")).testimony, 0);
    const started = unwrap(startCharacterInSlot(storage, "C", baseInput(), 3, 10));
    assert.equal(started.meta.testimony, 42);
});

test("bad slot ids, invalid characters and corrupt slots are reported", () => {
    const storage = memoryStorage();
    assert.equal(errorOf(loadSlot(storage, "D")), "bad-slot");
    assert.equal(errorOf(saveSlot(storage, "Z", freshMeta(), null, 0)), "bad-slot");
    assert.equal(errorOf(deleteSlot(storage, "a")), "bad-slot");
    assert.ok(!startCharacterInSlot(storage, "A", baseInput({ difficulty: "nope" as never }), 1, 1).ok);
    assert.equal(storage.data.size, 0);
    storage.setItem(slotKey("B"), "{broken");
    assert.deepEqual(listSlots(storage)[1], { id: "B", label: "B", state: "corrupt", error: "bad-json" });
});

test("a wipe in slot A leaves slot B's run and meta intact", () => {
    const storage = memoryStorage();
    unwrap(startCharacterInSlot(storage, "A", baseInput(), 1, 1));
    unwrap(startCharacterInSlot(storage, "B", baseInput({ choir: "watcherKin", difficulty: "stillWaters" }), 2, 1));
    unwrap(saveSlot(storage, "B", { ...freshMeta(), testimony: 7 }, unwrap(loadSlot(storage, "B")).run, 2));
    const bBefore = storage.getItem(slotKey("B"));

    const a = unwrap(loadSlot(storage, "A"));
    let run = { ...a.run!, pendingTestimony: 20 };
    run = strikeDown(run, { inBreach: false }).run;
    run = strikeDown(run, { inBreach: false }).run;
    assert.equal(run.status, "castOut");
    const wiped = unwrap(wipe(run, a.meta, { seed: 5 }));
    unwrap(saveSlot(storage, "A", wiped.meta, wiped.fresh, 3));

    assert.equal(unwrap(loadSlot(storage, "A")).meta.testimony, 20);
    assert.equal(unwrap(loadSlot(storage, "A")).meta.runs, 1);
    assert.equal(storage.getItem(slotKey("B")), bBefore);
    const b = unwrap(loadSlot(storage, "B"));
    assert.equal(b.meta.testimony, 7);
    assert.equal(b.meta.runs, 0);
    assert.equal(b.run?.character.choir, "watcherKin");
    assert.equal(b.run?.status, "alive");
});

test("deleting one slot leaves the others", () => {
    const storage = memoryStorage();
    for (const id of SLOT_IDS) unwrap(startCharacterInSlot(storage, id, baseInput(), 1, 1));
    unwrap(deleteSlot(storage, "B"));
    assert.deepEqual(listSlots(storage).map(state), ["character", "empty", "character"]);
});

test("the single pre-slot save moves into slot A on first load", () => {
    const meta = { ...freshMeta(), testimony: 15, lore: ["tenth"] };
    const run = atTier(makeRun(), 1);
    const storage = memoryStorage({ [SAVE_KEY]: serializeSave(meta, run) });

    const slots = listSlots(storage);
    assert.equal(slots[0].state, "character");
    assert.equal(slots[0].state === "character" && slots[0].tier, 1);
    assert.equal(slots[0].state === "character" && slots[0].lastPlayed, null);
    assert.equal(storage.getItem(SAVE_KEY), null);
    const loaded = unwrap(loadSlot(storage, "A"));
    assert.deepEqual(loaded.run, run);
    assert.equal(loaded.meta.testimony, 15);
    assert.deepEqual(loaded.meta.lore, ["tenth"]);
    assert.equal(migrateLegacySave(storage), "none");
});

test("the migration also works from loadSlot and accepts version 1 saves", () => {
    const run = makeRun();
    const v1 = JSON.parse(serializeSave(freshMeta(), run));
    v1.version = 1;
    delete v1.run.difficulty;
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(v1) });
    assert.equal(unwrap(loadSlot(storage, "A")).run?.difficulty, "narrowWay");
    assert.equal(storage.getItem(SAVE_KEY), null);
});

test("the migration never overwrites slot A or drops an unreadable save", () => {
    const occupied = memoryStorage({ [SAVE_KEY]: serializeSave(freshMeta(), null) });
    unwrap(saveSlot(occupied, "A", { ...freshMeta(), testimony: 3 }, null, 1));
    assert.equal(migrateLegacySave(occupied), "slotOccupied");
    assert.notEqual(occupied.getItem(SAVE_KEY), null);
    assert.equal(unwrap(loadSlot(occupied, "A")).meta.testimony, 3);

    const broken = memoryStorage({ [SAVE_KEY]: "{nope" });
    assert.equal(migrateLegacySave(broken), "unreadable");
    assert.equal(broken.getItem(SAVE_KEY), "{nope");
    assert.equal(state(listSlots(broken)[0]), "empty");
});
