import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { MusicDirector } from "../src/components/scenes/HeavenOrHell/audio/director";
import {
    FILTER_CLOSED_HZ,
    FILTER_OPEN_HZ,
    HYSTERESIS,
    INITIAL_MIX_STATE,
    MixState,
    STINGER_COOLDOWN_BARS,
    TIER_GAINS,
    automationFor,
    barAt,
    filterSweepFor,
    gainsFor,
    mixFor,
    nextBoundaryBar,
    stingerFor,
    tierWithHysteresis,
    valueAt,
} from "../src/components/scenes/HeavenOrHell/audio/mixer";
import { BAR_SEC, BEAT_SEC, STEMS, STINGERS, TIERS, Tier } from "../src/components/scenes/HeavenOrHell/audio/musicSpec";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

describe("gain curves", () => {
    it("matches the tier table at integer corruption", () => {
        for (const tier of TIERS) {
            const g = gainsFor(tier, tier);
            for (const stem of STEMS) close(g[stem.id], TIER_GAINS[stem.id][tier]);
        }
    });

    it("never mixes heaven and hell stems outside a switch-up", () => {
        for (let c = 0; c <= 5; c += 0.05) {
            const tier = tierWithHysteresis(c, 0);
            const g = gainsFor(c, tier);
            const heaven = STEMS.filter((s) => s.set === "heaven").some((s) => g[s.id] > 0);
            const hell = STEMS.filter((s) => s.set === "hell").some((s) => g[s.id] > 0);
            assert.ok(!(heaven && hell), `both sets audible at corruption ${c.toFixed(2)}`);
            assert.equal(hell, tier >= 4);
        }
    });

    it("builds monotonically: the corrupt layers only grow through heaven tiers", () => {
        let prev = gainsFor(0, 0);
        for (let c = 0.1; c < 4; c += 0.1) {
            const g = gainsFor(c, tierWithHysteresis(c, 0));
            for (const id of ["corruptChoir", "grit808", "hatsRoll", "drumsHard"] as const) {
                assert.ok(g[id] >= prev[id] - 1e-9, `${id} fell at ${c.toFixed(1)}`);
            }
            // The ghost line peaks at Tier 3, then thins as the hard drums lean towards hell.
            if (c <= 3) assert.ok(g.ghostLine >= prev.ghostLine - 1e-9, `ghostLine fell at ${c.toFixed(1)}`);
            prev = g;
        }
    });

    it("interpolates between tiers and stays in [0, 1]", () => {
        const g = gainsFor(2.5, 2);
        close(g.corruptChoir, (TIER_GAINS.corruptChoir[2] + TIER_GAINS.corruptChoir[3]) / 2);
        for (let c = -1; c <= 6; c += 0.25) {
            for (const tier of TIERS) {
                for (const v of Object.values(gainsFor(c, tier))) assert.ok(v >= 0 && v <= 1);
            }
        }
    });

    it("leans the drums halfway into hell during Tier 3", () => {
        const g = gainsFor(3.9, 3);
        close(g.drumsHard, (TIER_GAINS.drumsHard[3] + TIER_GAINS.drumsHard[4]) / 2);
    });

    it("treats NaN and out-of-range corruption as clamped", () => {
        assert.deepEqual(gainsFor(Number.NaN, 0), gainsFor(0, 0));
        assert.deepEqual(gainsFor(99, 5), gainsFor(5, 5));
    });
});

describe("hysteresis", () => {
    it("rises as soon as corruption reaches the next tier", () => {
        assert.equal(tierWithHysteresis(0.999, 0), 0);
        assert.equal(tierWithHysteresis(1, 0), 1);
        assert.equal(tierWithHysteresis(4.2, 1), 4);
    });

    it("holds the tier until corruption falls HYSTERESIS below its floor", () => {
        assert.equal(tierWithHysteresis(4 - HYSTERESIS + 0.01, 4), 4);
        assert.equal(tierWithHysteresis(4 - HYSTERESIS - 0.01, 4), 3);
        assert.equal(tierWithHysteresis(0.2, 3), 0);
    });

    it("does not flap when corruption jitters around a boundary", () => {
        let tier: Tier = 3;
        assert.equal(tierWithHysteresis(3.95, tier), 3);
        let flips = 0;
        tier = 4;
        for (let i = 0; i < 200; i++) {
            const next = tierWithHysteresis(4 + 0.1 * Math.sin(i), tier);
            if (next !== tier) flips++;
            tier = next;
        }
        assert.equal(flips, 0);
    });

    it("holds the current mix inside the hysteresis band", () => {
        assert.deepEqual(gainsFor(3.9, 4), gainsFor(4, 4));
    });
});

describe("stingers", () => {
    it("maps tier changes to the right stinger", () => {
        assert.equal(stingerFor(0, 1), null);
        assert.equal(stingerFor(1, 2), "riser");
        assert.equal(stingerFor(2, 3), "riser");
        assert.equal(stingerFor(3, 4), "switchUp");
        assert.equal(stingerFor(1, 5), "switchUp");
        assert.equal(stingerFor(4, 5), "hellImpact");
        assert.equal(stingerFor(5, 4), null);
        assert.equal(stingerFor(4, 3), "redeem");
        assert.equal(stingerFor(3, 2), null);
        assert.equal(stingerFor(2, 2), null);
    });

    it("rate-limits risers and impacts but never the switch-up", () => {
        const recent: MixState = { tier: 1, bar: 10, lastStingerBar: 10 - STINGER_COOLDOWN_BARS + 1 };
        assert.equal(mixFor(2, recent).stinger, null);
        assert.equal(mixFor(2, { ...recent, lastStingerBar: 10 - STINGER_COOLDOWN_BARS }).stinger, "riser");
        assert.equal(mixFor(4, { ...recent, tier: 3 }).stinger, "switchUp");
        assert.equal(mixFor(3, { ...recent, tier: 4 }).stinger, "redeem");
    });

    it("records the stinger bar in the next state", () => {
        const plan = mixFor(2, { ...INITIAL_MIX_STATE, tier: 1, bar: 40 });
        assert.equal(plan.state.lastStingerBar, 40);
        assert.equal(plan.set, "heaven");
        assert.equal(mixFor(4.5, INITIAL_MIX_STATE).set, "hell");
    });
});

describe("bar alignment", () => {
    it("finds bar indices", () => {
        assert.equal(barAt(0), 0);
        assert.equal(barAt(BAR_SEC * 3), 3);
        assert.equal(barAt(BAR_SEC * 3 - 1e-6), 2);
    });

    it("schedules on the next bar line with the safety margin", () => {
        assert.equal(nextBoundaryBar(0), 1);
        assert.equal(nextBoundaryBar(BAR_SEC * 2 - 0.2), 2);
        assert.equal(nextBoundaryBar(BAR_SEC * 2 - 0.01), 3);
    });

    it("leaves the stinger lead and lands on a phrase line", () => {
        for (let t = 0; t < 30; t += 0.37) {
            const b = nextBoundaryBar(t, 4, 2);
            assert.equal(b % 4, 0);
            assert.ok(b * BAR_SEC - t >= 2 * BAR_SEC, `lead too short at t=${t}`);
            assert.ok(b * BAR_SEC - t < 6 * BAR_SEC + 0.06, `waited too long at t=${t}`);
        }
    });
});

describe("automation", () => {
    it("ramps smooth moves over one bar from the boundary", () => {
        const pts = automationFor("heaven", "smooth", 8, 0.2, 0.8);
        assert.deepEqual(pts, [
            { t: 8, v: 0.2 },
            { t: 8 + BAR_SEC, v: 0.8 },
        ]);
        close(valueAt(pts, 8 + BAR_SEC / 2), 0.5);
    });

    it("switch-up: heaven is gone and hell is in within 30 ms of the hit", () => {
        const at = 16 * BAR_SEC;
        const heaven = automationFor("heaven", "switchUp", at, 0.9, 0);
        const hell = automationFor("hell", "switchUp", at, 0, 0.9);
        const drums = automationFor("neutral", "switchUp", at, 0.85, 0.95);
        assert.equal(heaven[0].t, at - STINGERS.switchUp.leadBars * BAR_SEC);
        close(valueAt(heaven, at), 0);
        close(valueAt(hell, at), 0);
        close(valueAt(hell, at + 0.03), 0.9);
        assert.ok(valueAt(drums, at - BEAT_SEC / 2) < 0.1, "drums should drop for the last beat");
        close(valueAt(drums, at + 0.03), 0.95);
    });

    it("sweeps the leaving bus's low-pass shut and reopens it after the hit", () => {
        const sweep = filterSweepFor("switchUp", 10);
        assert.ok(sweep);
        assert.equal(sweep.bus, "heaven");
        close(valueAt(sweep.points, 10, true), FILTER_CLOSED_HZ);
        close(valueAt(sweep.points, 11, true), FILTER_OPEN_HZ);
        assert.equal(filterSweepFor("redeem", 10)?.bus, "hell");
        assert.equal(filterSweepFor("riser", 10), null);
    });
});

describe("MusicDirector", () => {
    it("stays quiet while corruption is steady", () => {
        const d = new MusicDirector(0);
        for (let t = 0; t < 20; t += 0.1) assert.equal(d.tick(t, 0), null);
    });

    it("schedules a bar-aligned switch-up with its stinger hitting on the boundary", () => {
        const d = new MusicDirector(3.5);
        const cmd = d.tick(5.3, 4.1);
        assert.ok(cmd);
        assert.equal(cmd.kind, "switchUp");
        assert.equal(cmd.boundaryBar % STINGERS.switchUp.phraseBars, 0);
        close(cmd.boundarySec, cmd.boundaryBar * BAR_SEC);
        assert.ok(cmd.stinger);
        close(cmd.stinger.startSec + STINGERS.switchUp.hitSec, cmd.boundarySec);
        assert.ok(cmd.stinger.startSec >= 5.3, "stinger must start in the future");
        assert.equal(cmd.filter?.bus, "heaven");
        assert.equal(d.tier, 4);
    });

    it("ignores readings while a transition is in flight, then catches up", () => {
        const d = new MusicDirector(0);
        const first = d.tick(1, 1.5);
        assert.ok(first);
        assert.equal(d.tick(first.busyUntilSec - 0.01, 2.5), null);
        const next = d.tick(first.busyUntilSec, 2.5);
        assert.ok(next);
        assert.equal(next.kind, "riser");
        assert.ok(next.boundarySec >= first.busyUntilSec);
    });

    it("plays the whole arc with stingers in story order", () => {
        const d = new MusicDirector(0);
        const stingers: string[] = [];
        // Climb to full corruption, hold it, then get pushed back to Tier 2.
        const path = (t: number) => (t < 100 ? (t / 100) * 5 : t < 120 ? 5 : 5 - ((t - 120) / 30) * 3);
        for (let t = 0; t < 150; t += 0.1) {
            const cmd = d.tick(t, path(t));
            if (cmd?.stinger) stingers.push(cmd.stinger.id);
        }
        assert.deepEqual(stingers, ["riser", "riser", "switchUp", "hellImpact", "redeem"]);
    });
});
