import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { contrast, hex, mix } from "../src/components/scenes/HeavenOrHell/ui/color";
import {
    ACCENT_COLORS,
    CHOIR_PICKS,
    CREATION_STEPS,
    DEFAULT_DIFFICULTY_ID,
    DIFFICULTY_OPTIONS,
    DifficultyOption,
    HALO_COLOURS,
    HALO_SHAPES,
    choose,
    creationResult,
    creationStrings,
    currentStep,
    epigraphSource,
    goToStep,
    isLastStep,
    navLabels,
    newCreation,
    nudge,
    stepBack,
    stepForward,
} from "../src/components/scenes/HeavenOrHell/ui/creation";
import { themeFor } from "../src/components/scenes/HeavenOrHell/ui/theme";

describe("creation flow", () => {
    it("runs Choir, then appearance, then difficulty", () => {
        assert.deepEqual(
            CREATION_STEPS.map((s) => s.id),
            ["choir", "appearance", "difficulty"],
        );
        let s = newCreation();
        assert.equal(currentStep(s).id, "choir");
        s = stepForward(s);
        assert.equal(currentStep(s).id, "appearance");
        s = stepForward(s);
        assert.equal(currentStep(s).id, "difficulty");
        assert.ok(isLastStep(s));
        assert.equal(s.done, false);
    });

    it("finishes with Kindle on the last step and never runs past it", () => {
        let s = goToStep(newCreation(), 2);
        s = stepForward(s);
        assert.equal(s.done, true);
        assert.equal(s.step, 2);
    });

    it("goes back without leaving the first step, and backing out clears done", () => {
        let s = stepBack(newCreation());
        assert.equal(s.step, 0);
        s = stepBack({ ...goToStep(s, 2), done: true });
        assert.equal(s.step, 1);
        assert.equal(s.done, false);
    });

    it("labels the buttons: no Back first, Continue between, Kindle last", () => {
        assert.deepEqual(navLabels(newCreation()), { back: null, next: "Continue" });
        assert.deepEqual(navLabels(goToStep(newCreation(), 1)), { back: "Back", next: "Continue" });
        assert.deepEqual(navLabels(goToStep(newCreation(), 2)), { back: "Back", next: "Kindle" });
    });

    it("clamps step jumps", () => {
        assert.equal(goToStep(newCreation(), -3).step, 0);
        assert.equal(goToStep(newCreation(), 99).step, CREATION_STEPS.length - 1);
    });

    it("chooses on the current step only", () => {
        let s = choose(newCreation(), 5);
        assert.equal(s.choir, 5);
        assert.equal(s.difficulty, newCreation().difficulty);
        s = choose(stepForward(s), 2, "shape");
        s = choose(s, 3, "colour");
        assert.equal(s.haloShape, 2);
        assert.equal(s.haloColour, 3);
        assert.equal(s.choir, 5);
        s = choose(stepForward(s), 0);
        assert.equal(s.difficulty, 0);
    });

    it("clamps choices into range", () => {
        assert.equal(choose(newCreation(), 99).choir, CHOIR_PICKS.length - 1);
        assert.equal(choose(newCreation(), -4).choir, 0);
    });

    it("nudges with wrapping, for arrow keys", () => {
        const s = newCreation();
        assert.equal(nudge(s, -1).choir, CHOIR_PICKS.length - 1);
        assert.equal(nudge(nudge(s, -1), 1).choir, 0);
        const a = goToStep(s, 1);
        assert.equal(nudge(a, 1, "colour").haloColour, 1);
        assert.equal(nudge(a, 1, "colour").haloShape, 0);
        const d = goToStep(s, 2);
        assert.equal(nudge(d, 1).difficulty, 2);
        assert.equal(nudge(nudge(d, 1), 1).difficulty, 3);
        assert.equal(nudge(nudge(nudge(d, 1), 1), 1).difficulty, 0);
    });

    it("hands the scene ids, not indices", () => {
        const s = choose(goToStep(choose(newCreation(), 2), 2), 3);
        assert.deepEqual(creationResult(s), {
            choir: "wheelborn",
            halo: { shape: "ring", colour: "dawn" },
            difficulty: "sonOfTheMorning",
        });
    });
});

describe("difficulty picker", () => {
    it("offers the four roads in order, easiest first", () => {
        assert.deepEqual(
            DIFFICULTY_OPTIONS.map((d) => d.name),
            ["Still Waters", "The Narrow Way", "The Furnace of Affliction", "Son of the Morning"],
        );
        assert.deepEqual(
            DIFFICULTY_OPTIONS.map((d) => d.accent),
            ["white", "gold", "orange", "red"],
        );
    });

    it("preselects The Narrow Way", () => {
        const s = newCreation();
        assert.equal(DEFAULT_DIFFICULTY_ID, "narrowWay");
        assert.equal(DIFFICULTY_OPTIONS[s.difficulty].name, "The Narrow Way");
    });

    it("preselects the default from whatever list it is given", () => {
        const swapped: DifficultyOption[] = [DIFFICULTY_OPTIONS[1], DIFFICULTY_OPTIONS[0]];
        assert.equal(newCreation(swapped).difficulty, 0);
        assert.equal(newCreation([DIFFICULTY_OPTIONS[0]]).difficulty, 0);
    });

    it("accepts the progression branch's richer DifficultyDef shape as is", () => {
        const def = {
            ...DIFFICULTY_OPTIONS[3],
            minutesPerTier: 100,
            enemy: { hp: 1.5, posture: 1.3, damage: 1.4, aggression: 1.3 },
            stainGainMult: 1.3,
            lootTierBonus: 1,
        };
        const list: readonly DifficultyOption[] = [def];
        assert.equal(creationResult(choose(goToStep(newCreation(list), 2), 0, "shape", list), list).difficulty, "sonOfTheMorning");
    });

    it("keeps every subtitle to one short line", () => {
        for (const d of DIFFICULTY_OPTIONS) assert.ok(d.subtitle.length <= 44, d.subtitle);
    });

    it("shows the epigraph's book without chapter and verse", () => {
        assert.equal(epigraphSource("Psalm 23:2"), "Psalm");
        assert.equal(epigraphSource("Matthew 7:14"), "Matthew");
        assert.equal(epigraphSource("Isaiah 48:10"), "Isaiah");
        assert.equal(epigraphSource("1 John 4:8"), "1 John");
    });

    it("runs accents from light to dark, and each reads on the Tier 0 panel", () => {
        const t = themeFor(0, 0);
        const panel = mix(hex("#0e0e10"), t.panel, t.panelAlpha);
        const lum = DIFFICULTY_OPTIONS.map((d) => contrast(ACCENT_COLORS[d.accent], panel));
        for (const c of lum) assert.ok(c >= 4.5, `accent contrast ${c.toFixed(2)}`);
        assert.ok(lum[0] > lum[3], "white should outshine red");
    });
});

describe("creation copy", () => {
    it("puts no numbers on screen", () => {
        for (const s of creationStrings()) assert.ok(!/\d/.test(s), `"${s}" has a number`);
    });

    it("keeps Choir lines and tooltips short", () => {
        for (const c of CHOIR_PICKS) {
            assert.ok(c.line.length <= 32, c.line);
            assert.ok(c.leaning.length <= 48, c.leaning);
        }
    });

    it("has eight Choirs and four of each halo option, all with unique ids", () => {
        assert.equal(CHOIR_PICKS.length, 8);
        assert.equal(HALO_SHAPES.length, 4);
        assert.equal(HALO_COLOURS.length, 4);
        for (const list of [CHOIR_PICKS, HALO_SHAPES, HALO_COLOURS, DIFFICULTY_OPTIONS]) {
            const ids = list.map((x) => x.id);
            assert.equal(new Set(ids).size, ids.length);
        }
    });

    it("names the player the Tenth, a lesser angel, and nothing else", () => {
        const all = creationStrings().join(" ");
        assert.ok(all.includes("the Tenth") || all.includes("The Tenth"));
        assert.ok(!/auriel/i.test(all));
        assert.ok(!/fallen angel/i.test(all));
    });
});
