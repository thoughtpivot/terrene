import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
    BAR_SEC,
    FILE_SAMPLES,
    LOOP_BARS,
    LOOP_END_SEC,
    LOOP_SAMPLES,
    LOOP_SEC,
    LOOP_START_SEC,
    PAD_SAMPLES,
    SAMPLE_RATE,
    STEP_SEC,
} from "../src/components/scenes/HeavenOrHell/audio/musicSpec";
import { circularProcess, foldTail, loopSampleCount, padForFile, seamMetrics } from "../tools/heaven-or-hell/music/loop";
import { lowpass, Rng, noise } from "../tools/heaven-or-hell/music/synth/dsp";

describe("loop lengths", () => {
    it("lands 32 bars at 150 BPM on an exact sample count", () => {
        assert.equal(loopSampleCount(150, 32, 44100), 2_257_920);
        assert.equal(LOOP_SAMPLES, 2_257_920);
        assert.equal(LOOP_SAMPLES, loopSampleCount(150, LOOP_BARS, SAMPLE_RATE));
        assert.equal(LOOP_SEC, 51.2);
    });

    it("keeps every 16th note on a whole sample", () => {
        assert.ok(Math.abs(STEP_SEC * SAMPLE_RATE - 4410) < 1e-9);
        assert.ok(Math.abs(BAR_SEC * SAMPLE_RATE - 70_560) < 1e-9);
    });

    it("rejects tempos that would drift", () => {
        assert.throws(() => loopSampleCount(143, 32, 44100));
    });

    it("describes the padded file layout the player loops inside", () => {
        assert.equal(FILE_SAMPLES, LOOP_SAMPLES + 2 * PAD_SAMPLES);
        assert.equal(LOOP_START_SEC * SAMPLE_RATE, PAD_SAMPLES);
        assert.ok(Math.abs(LOOP_END_SEC * SAMPLE_RATE - (PAD_SAMPLES + LOOP_SAMPLES)) < 1e-6);
    });
});

describe("padForFile", () => {
    it("wraps the loop's end before it and its start after it", () => {
        const loop = Float32Array.from({ length: 100 }, (_, i) => i);
        const file = padForFile(loop, 10);
        assert.equal(file.length, 120);
        assert.deepEqual([...file.subarray(0, 10)], [...loop.subarray(90)]);
        assert.deepEqual([...file.subarray(10, 110)], [...loop]);
        assert.deepEqual([...file.subarray(110)], [...loop.subarray(0, 10)]);
    });

    it("refuses a pad longer than the loop", () => {
        assert.throws(() => padForFile(new Float32Array(4), 5));
    });
});

/** A long sine note that starts near the loop's end and rings past it, the way a real chord tail does. */
function ringingNote(n: number, startAt: number, length: number, hz: number): Float32Array {
    const buf = new Float32Array(n + length);
    for (let i = 0; i < length; i++) {
        buf[startAt + i] = Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE) * Math.exp(-i / (SAMPLE_RATE * 0.8));
    }
    return buf;
}

describe("seam continuity", () => {
    const n = SAMPLE_RATE * 2;

    it("folding the tail makes the wrap as smooth as any other sample step", () => {
        const buf = ringingNote(n, n - 2000, SAMPLE_RATE, 220);
        const folded = foldTail(buf, n);
        const truncated = buf.slice(0, n);
        const good = seamMetrics(folded);
        const bad = seamMetrics(truncated);
        assert.ok(good.ratio <= 1.05, `folded seam ratio ${good.ratio}`);
        assert.ok(bad.ratio > 5, `truncated seam should click (ratio ${bad.ratio})`);
    });

    it("folding conserves energy: nothing past the loop end is lost", () => {
        const buf = ringingNote(n, n - 2000, SAMPLE_RATE * 3, 330);
        const folded = foldTail(buf, n);
        const sum = (x: Float32Array) => x.reduce((a, v) => a + v, 0);
        assert.ok(Math.abs(sum(folded) - sum(buf)) < 1e-3);
    });

    it("circularProcess removes the filter-memory seam", () => {
        const rng = new Rng(7);
        // Low-passed noise with a strong DC-ish swing so a cold filter start is obvious.
        const loop = noise(n, rng).map((v, i) => v * 0.2 + (i < n / 2 ? 0.7 : -0.7));
        const process = (x: Float32Array) => lowpass(x, 40);
        const cold = process(loop);
        const warm = circularProcess(loop, process);
        assert.ok(seamMetrics(warm).ratio <= 1.05, `warm seam ratio ${seamMetrics(warm).ratio}`);
        assert.ok(seamMetrics(cold).ratio > 5, `cold seam should click (ratio ${seamMetrics(cold).ratio})`);
        // The kept copy is the steady state: another lap changes nothing audible.
        const lap3 = (() => {
            const tripled = new Float32Array(3 * n);
            for (let k = 0; k < 3; k++) tripled.set(loop, k * n);
            return process(tripled).slice(2 * n);
        })();
        let maxDiff = 0;
        for (let i = 0; i < n; i++) maxDiff = Math.max(maxDiff, Math.abs(lap3[i] - warm[i]));
        assert.ok(maxDiff < 1e-4, `steady-state difference ${maxDiff}`);
    });

    it("circularProcess requires length-preserving processes", () => {
        assert.throws(() => circularProcess(new Float32Array(8), (x) => x.slice(0, 4)));
    });
});
