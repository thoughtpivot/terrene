import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
    BASS_808_IDS,
    Bass808Id,
    HEAVEN_BASS_ROOTS,
    HELL_BASS_ROOTS,
    bass808Notes,
    hitMap808,
    nextNoteIndex,
} from "../src/components/scenes/HeavenOrHell/audio/bass808";
import { PULSE_PX_MAX, PULSE_PX_MIN, beatPulse, glowLevel, vibrationOffset } from "../src/components/scenes/HeavenOrHell/audio/beatPulse";
import { BEAT_FIRE_EARLY_MS, Beat808Hit, Beat808Scheduler, BeatMixView } from "../src/components/scenes/HeavenOrHell/audio/beatScheduler";
import { automationFor, gainsFor, valueAt } from "../src/components/scenes/HeavenOrHell/audio/mixer";
import { BAR_SEC, BEAT_SEC, BPM, LOOP_SEC, PAD_SEC, STEP_SEC, TIERS, Tier } from "../src/components/scenes/HeavenOrHell/audio/musicSpec";
import { HEAVEN_CHORDS, HELL_CHORDS } from "../tools/heaven-or-hell/music/score";

const map = hitMap808(PAD_SEC, BPM);

describe("808 hit map", () => {
    it("uses the same chord roots as the score", () => {
        assert.deepEqual([...HEAVEN_BASS_ROOTS], HEAVEN_CHORDS.map((c) => c.root));
        assert.deepEqual([...HELL_BASS_ROOTS], HELL_CHORDS.map((c) => c.root));
    });

    it("has one note per kick step for each 808 line", () => {
        assert.equal(bass808Notes("heaven808").length, 64);
        assert.equal(bass808Notes("grit808").length, 88);
        assert.equal(bass808Notes("hell808").length, 104);
    });

    it("counts audible hits per tier", () => {
        assert.deepEqual(
            map.tiers.map((t) => t.hits.length),
            [64, 64, 100, 100, 104, 104],
        );
    });

    it("keeps every hit on the 16th grid inside the loop, in order", () => {
        for (const t of map.tiers) {
            let prev = -1;
            for (const h of t.hits) {
                assert.ok(h.sec >= 0 && h.sec < LOOP_SEC);
                assert.ok(h.sec > prev);
                prev = h.sec;
                assert.ok(Math.abs(h.sec / STEP_SEC - Math.round(h.sec / STEP_SEC)) < 1e-9);
                assert.ok(Math.abs(h.beat * BEAT_SEC - h.sec) < 1e-9);
                assert.ok(Math.abs(h.bar * BAR_SEC + h.step * STEP_SEC - h.sec) < 1e-9);
                assert.ok(h.velocity > 0 && h.velocity <= 1);
            }
        }
        assert.equal(map.filePadSec, 1);
    });

    it("only reports stems of the audible set", () => {
        assert.ok(map.tiers[0].hits.every((h) => h.stem === "heaven808" && !h.slide));
        assert.ok(map.tiers[3].hits.every((h) => h.stem !== "hell808"));
        assert.ok(map.tiers[5].hits.every((h) => h.stem === "hell808"));
    });

    it("treats the Tier 0 soft 808 as full strength and marks hell dives", () => {
        assert.equal(map.tiers[0].hits[0].velocity, 1);
        const dive = map.tiers[4].hits.find((h) => h.bar === 2 && h.step === 0);
        assert.equal(dive?.glide, "dive");
        assert.ok(map.tiers[4].hits.some((h) => h.glide === "slide"));
    });

    it("finds the next note with wrap-around", () => {
        const notes = bass808Notes("hell808");
        assert.equal(nextNoteIndex(notes, 0), 0);
        assert.equal(nextNoteIndex(notes, notes[5].sec), 5);
        assert.equal(nextNoteIndex(notes, notes[5].sec + 0.001), 6);
        assert.equal(nextNoteIndex(notes, LOOP_SEC - 0.001), 0);
    });
});

describe("beatPulse", () => {
    const rnd = () => 0.25;

    it("scales vibration from 0.5 px at Tier 0 to 3 px at Tier 5", () => {
        assert.ok(Math.abs(beatPulse({ velocity: 1, slide: false }, 0, rnd).vibratePx - PULSE_PX_MIN) < 1e-9);
        assert.ok(Math.abs(beatPulse({ velocity: 1, slide: false }, 5, rnd).vibratePx - PULSE_PX_MAX) < 1e-9);
    });

    it("is monotonic in tier for vibration, duration and glow", () => {
        for (const slide of [false, true]) {
            for (const velocity of [0.3, 0.85, 1]) {
                const pulses = TIERS.map((t) => beatPulse({ velocity, slide }, t, rnd));
                for (let i = 1; i < pulses.length; i++) {
                    assert.ok(pulses[i].vibratePx > pulses[i - 1].vibratePx);
                    assert.ok(pulses[i].vibrateMs > pulses[i - 1].vibrateMs);
                    assert.ok(pulses[i].glowBoost > pulses[i - 1].glowBoost);
                }
            }
        }
    });

    it("keeps the vibration short and subtle", () => {
        for (const t of TIERS) {
            const p = beatPulse({ velocity: 1, slide: true }, t, rnd);
            assert.ok(p.vibrateMs >= 80 && p.vibrateMs <= 140);
            assert.ok(p.vibratePx <= 3);
        }
    });

    it("quieter hits pulse less, and the direction comes from the random source", () => {
        assert.ok(beatPulse({ velocity: 0.4, slide: false }, 3, rnd).vibratePx < beatPulse({ velocity: 1, slide: false }, 3, rnd).vibratePx);
        assert.ok(Math.abs(beatPulse({ velocity: 1, slide: false }, 3, () => 0.25).angle - Math.PI / 2) < 1e-9);
    });

    it("decays to rest within vibrateMs and never exceeds its amplitude", () => {
        const p = beatPulse({ velocity: 1, slide: false }, 5, rnd);
        for (let ms = 0; ms < p.vibrateMs; ms += 1) {
            const { x, y } = vibrationOffset(p, ms);
            assert.ok(Math.hypot(x, y) <= p.vibratePx + 1e-9);
        }
        assert.deepEqual(vibrationOffset(p, p.vibrateMs), { x: 0, y: 0 });
        assert.ok(Math.hypot(vibrationOffset(p, p.vibrateMs - 1).x, vibrationOffset(p, p.vibrateMs - 1).y) < 0.06 * p.vibratePx);
        assert.ok(glowLevel(p, 0) === p.glowBoost && glowLevel(p, 400) === 0 && glowLevel(p, 60) < p.glowBoost);
    });
});

/** Run the scheduler against a simulated 60 fps game loop on an ideal audio clock. */
function simulate(mix: BeatMixView, seconds: number, latencyMs = 20, frameMs = 1000 / 60): Beat808Hit[] {
    const s = new Beat808Scheduler();
    const hits: Beat808Hit[] = [];
    const audibleAt = (t: number) => t * 1000 + latencyMs;
    for (let perf = 0; perf < seconds * 1000; perf += frameMs) {
        const audioNow = perf / 1000;
        s.schedule(audioNow, mix.epoch);
        hits.push(...s.due(perf, audibleAt, mix));
    }
    return hits;
}

function steadyMix(tier: Tier): BeatMixView {
    const g = gainsFor(tier, tier);
    return { epoch: 0, gainAt: (stem: Bass808Id) => g[stem], tierAt: () => tier };
}

describe("Beat808Scheduler", () => {
    it("fires exactly the tier's hit map once per loop, across the wrap", () => {
        for (const tier of TIERS) {
            const hits = simulate(steadyMix(tier), 2 * LOOP_SEC + 0.5);
            const expected = map.tiers[tier].hits;
            const firstTwo = hits.filter((h) => h.audioTime < 2 * LOOP_SEC);
            assert.equal(firstTwo.length, 2 * expected.length, `tier ${tier}`);
            for (let i = 0; i < expected.length; i++) {
                assert.ok(Math.abs(firstTwo[i].loopSec - expected[i].sec) < 1e-9);
                assert.ok(Math.abs(firstTwo[i + expected.length].audioTime - (LOOP_SEC + expected[i].sec)) < 1e-6);
                assert.equal(firstTwo[i].velocity, expected[i].velocity);
            }
        }
    });

    it("fires on the frame the hit reaches the speakers (latency included)", () => {
        const hits = simulate(steadyMix(4), 20, 35);
        assert.ok(hits.length > 0);
        for (const h of hits) {
            assert.ok(Math.abs(h.audibleAtMs - (h.audioTime * 1000 + 35)) < 1e-6);
            assert.ok(h.lateMs >= -BEAT_FIRE_EARLY_MS - 1e-9 && h.lateMs < 1000 / 60 - BEAT_FIRE_EARLY_MS + 1e-6, `late ${h.lateMs}`);
        }
    });

    it("follows a switch-up: heaven 808s fade, hell 808s slam in on the bar line", () => {
        const boundary = 16 * BAR_SEC;
        const from = gainsFor(3.5, 3);
        const to = gainsFor(4, 4);
        const lanes: Record<Bass808Id, ReturnType<typeof automationFor>> = {
            heaven808: automationFor("heaven", "switchUp", boundary, from.heaven808, to.heaven808),
            grit808: automationFor("heaven", "switchUp", boundary, from.grit808, to.grit808),
            hell808: automationFor("hell", "switchUp", boundary, from.hell808, to.hell808),
        };
        const mix: BeatMixView = {
            epoch: 0,
            gainAt: (stem, t) => valueAt(lanes[stem], t),
            tierAt: (t) => (t < boundary ? 3 : 4),
        };
        const hits = simulate(mix, boundary + 4 * BAR_SEC);
        const before = hits.filter((h) => h.audioTime < boundary);
        const after = hits.filter((h) => h.audioTime >= boundary);
        assert.ok(before.every((h) => h.stem !== "hell808" && h.tier === 3));
        assert.ok(after.every((h) => h.stem === "hell808" && h.tier === 4));
        assert.ok(Math.abs(after[0].audioTime - boundary) < 1e-9, "the switch-up downbeat must pulse");
        const lead = before.filter((h) => h.audioTime >= boundary - 2 * BAR_SEC);
        assert.ok(lead[lead.length - 1].velocity < lead[0].velocity, "heaven 808s should thin out over the lead");
    });

    it("drops hits that are long overdue instead of bursting them", () => {
        const s = new Beat808Scheduler();
        const mix = steadyMix(5);
        s.schedule(0, 0);
        const burst = s.due(1000, (t) => t * 1000, mix);
        assert.equal(burst.length, 0);
        assert.equal(s.pending, 0);
    });

    it("stays silent when no 808 is audible", () => {
        const mix: BeatMixView = { epoch: 0, gainAt: () => 0, tierAt: () => 0 };
        assert.equal(simulate(mix, 5).length, 0);
    });

    it("lists the three 808 stems", () => {
        assert.deepEqual([...BASS_808_IDS], ["heaven808", "grit808", "hell808"]);
    });
});
