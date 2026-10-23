/**
 * Headless QA for the shipped score: decodes every MP3 the game loads and checks
 * what a listener would notice: loop length, the seam at the loop point, levels,
 * clipping, and headroom of every tier mix (plus the worst switch-up overlap).
 *
 *   npm run music:hoh:qa
 *
 * Writes qa-report.md and qa-report.json to the artifact directory and exits
 * non-zero if any check fails.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { gainsFor } from "../../../src/components/scenes/HeavenOrHell/audio/mixer";
import {
    FILE_SAMPLES,
    LOOP_SAMPLES,
    MUSIC_MASTER_GAIN,
    PAD_SAMPLES,
    STEMS,
    STINGERS,
    STINGER_IDS,
    StemId,
    TIERS,
} from "../../../src/components/scenes/HeavenOrHell/audio/musicSpec";
import { decodeToStereo, fileSize, hasFfmpeg, readJson, writeText } from "./io";
import { seamMetrics } from "./loop";
import { levels, round } from "./meter";
import { ARTIFACT_DIR, loopWav, manifestPath, stemMp3, stingerMp3 } from "./paths";
import { SR, Stereo } from "./synth/dsp";

/** A decoded seam step this many times the 99.9th-percentile step would be audible as a click. */
const MAX_SEAM_RATIO = 1.5;
/** Pre-roll and post-roll pads must carry the same audio as the loop edges they mirror (codec noise only). */
const MIN_WRAP_CORRELATION = 0.95;
/** Tier mixes must leave this much room for sound effects. */
const MAX_TIER_PEAK_DB = -1;
/** Allowed difference between decoded and expected length (decoders may keep a partial final frame). */
const LENGTH_TOLERANCE = 1152;

interface StemReport {
    id: StemId;
    kbps: number;
    channels: number;
    sizeKb: number;
    decodedSamples: number;
    lengthOk: boolean;
    decoderOffset: number | null;
    floatSeamRatio: number | null;
    mp3SeamRatio: number;
    wrapCorrelation: number;
    peakDb: number;
    rmsDb: number;
    lufs: number;
    clipped: number;
}

function slice(s: Stereo, start: number, end: number): Stereo {
    return new Stereo(s.l.subarray(start, end), s.r.subarray(start, end));
}

/**
 * Lag (decoded index minus file index) that best aligns the decode with the
 * reference file. Least squares over a 1 s window rather than a dot product:
 * sustained 808 sines correlate almost equally well a period away, but their
 * envelope and slides only match at the true lag.
 */
function decoderOffset(decoded: Float32Array, reference: Float32Array, search = 3000): number {
    const at = PAD_SAMPLES + 10 * SR;
    const win = SR;
    const stride = 3;
    let best = 0;
    let bestErr = Infinity;
    for (let lag = -search; lag <= search; lag++) {
        let err = 0;
        for (let i = 0; i < win; i += stride) {
            const d = decoded[at + lag + i] - reference[at + i];
            err += d * d;
            if (err >= bestErr) break;
        }
        if (err < bestErr) {
            bestErr = err;
            best = lag;
        }
    }
    return best;
}

function worstSeamRatio(s: Stereo): number {
    return Math.max(seamMetrics(s.l).ratio, seamMetrics(s.r).ratio);
}

/**
 * Correlation between each pad and the loop edge it mirrors, after the MP3
 * round trip (1 = identical). Codec noise in masked high bands lowers it a
 * little on noisy layers; wrong audio in a pad would drop it towards 0.
 */
function wrapCorrelation(s: Stereo): number {
    const w = Math.round(0.5 * SR);
    let worst = 1;
    for (const x of [s.l, s.r]) {
        for (const [a, b] of [
            [PAD_SAMPLES, PAD_SAMPLES + LOOP_SAMPLES],
            [PAD_SAMPLES + LOOP_SAMPLES - w, PAD_SAMPLES - w],
        ]) {
            let ab = 0;
            let aa = 0;
            let bb = 0;
            for (let i = 0; i < w; i++) {
                ab += x[a + i] * x[b + i];
                aa += x[a + i] * x[a + i];
                bb += x[b + i] * x[b + i];
            }
            if (aa > 0 && bb > 0) worst = Math.min(worst, ab / Math.sqrt(aa * bb));
        }
    }
    return worst;
}

function mixStems(decoded: Record<StemId, Stereo>, gains: Record<StemId, number>): Stereo {
    const out = Stereo.zeros(LOOP_SAMPLES);
    for (const stem of STEMS) {
        const g = gains[stem.id] * MUSIC_MASTER_GAIN;
        if (g === 0) continue;
        const x = decoded[stem.id];
        for (let i = 0; i < LOOP_SAMPLES; i++) {
            out.l[i] += x.l[PAD_SAMPLES + i] * g;
            out.r[i] += x.r[PAD_SAMPLES + i] * g;
        }
    }
    return out;
}

function main(): void {
    if (!hasFfmpeg()) throw new Error("ffmpeg is required on PATH for QA decoding");
    const failures: string[] = [];
    const manifest = existsSync(manifestPath()) ? readJson<{ globalGain: number }>(manifestPath()) : null;

    console.log("🔍 Checking stems");
    const decoded = {} as Record<StemId, Stereo>;
    const stems: StemReport[] = [];
    for (const stem of STEMS) {
        const path = stemMp3(stem.id);
        const s = decodeToStereo(path);
        decoded[stem.id] = s;
        const loop = slice(s, PAD_SAMPLES, PAD_SAMPLES + LOOP_SAMPLES);
        const lv = levels(loop);
        let offset: number | null = null;
        let floatSeam: number | null = null;
        if (manifest && existsSync(loopWav(stem.id))) {
            const ref = decodeToStereo(loopWav(stem.id));
            const refLoop = slice(ref, 0, LOOP_SAMPLES);
            floatSeam = worstSeamRatio(refLoop);
            const padded = new Float32Array(FILE_SAMPLES);
            padded.set(refLoop.l.subarray(LOOP_SAMPLES - PAD_SAMPLES), 0);
            padded.set(refLoop.l, PAD_SAMPLES);
            padded.set(refLoop.l.subarray(0, PAD_SAMPLES), PAD_SAMPLES + LOOP_SAMPLES);
            offset = decoderOffset(s.l, padded);
        }
        const report: StemReport = {
            id: stem.id,
            kbps: stem.kbps,
            channels: stem.channels,
            sizeKb: Math.round(fileSize(path) / 1024),
            decodedSamples: s.length,
            lengthOk: Math.abs(s.length - FILE_SAMPLES) <= LENGTH_TOLERANCE,
            decoderOffset: offset,
            floatSeamRatio: floatSeam === null ? null : round(floatSeam, 3),
            mp3SeamRatio: round(worstSeamRatio(loop), 3),
            wrapCorrelation: round(wrapCorrelation(s), 4),
            peakDb: round(lv.peakDb),
            rmsDb: round(lv.rmsDb),
            lufs: round(lv.lufs),
            clipped: lv.clippedSamples,
        };
        stems.push(report);
        if (!report.lengthOk) failures.push(`${stem.id}: decoded ${s.length} samples, expected ${FILE_SAMPLES}`);
        if (offset !== null && Math.abs(offset) >= PAD_SAMPLES) failures.push(`${stem.id}: decoder offset ${offset} exceeds the pad`);
        if (report.mp3SeamRatio > MAX_SEAM_RATIO) failures.push(`${stem.id}: seam ratio ${report.mp3SeamRatio}`);
        if (report.floatSeamRatio !== null && report.floatSeamRatio > MAX_SEAM_RATIO) failures.push(`${stem.id}: float seam ratio ${report.floatSeamRatio}`);
        if (report.wrapCorrelation < MIN_WRAP_CORRELATION) failures.push(`${stem.id}: wrap correlation ${report.wrapCorrelation}`);
        if (report.clipped > 0) failures.push(`${stem.id}: ${report.clipped} clipped samples`);
        console.log(
            `   ${stem.id.padEnd(13)} ${String(report.sizeKb).padStart(4)} KB  len ${report.lengthOk ? "ok" : "BAD"}  offset ${offset ?? "-"}  seam ${report.mp3SeamRatio}  wrap r=${report.wrapCorrelation}  peak ${report.peakDb}  ${report.lufs} LUFS`,
        );
    }

    console.log("🔍 Checking tier mixes");
    const tiers = TIERS.map((tier) => {
        const lv = levels(mixStems(decoded, gainsFor(tier, tier)));
        if (lv.peakDb > MAX_TIER_PEAK_DB) failures.push(`tier ${tier}: peak ${lv.peakDb.toFixed(2)} dBFS`);
        console.log(`   tier ${tier}  peak ${lv.peakDb.toFixed(2)} dBFS  ${lv.lufs.toFixed(1)} LUFS`);
        return { tier, peakDb: round(lv.peakDb), rmsDb: round(lv.rmsDb), lufs: round(lv.lufs), clipped: lv.clippedSamples };
    });

    // Worst momentary overlap: the last beat of a switch-up has heaven at half level while hell is arriving.
    const overlapGains = { ...gainsFor(3.5, 3) };
    const hell = gainsFor(4, 4);
    for (const stem of STEMS) {
        if (stem.set === "heaven") overlapGains[stem.id] *= 0.5;
        else overlapGains[stem.id] = Math.max(overlapGains[stem.id], hell[stem.id]);
    }
    const overlap = levels(mixStems(decoded, overlapGains));
    if (overlap.peakDb > 0) failures.push(`switch-up overlap clips: ${overlap.peakDb.toFixed(2)} dBFS`);
    console.log(`   switch-up overlap peak ${overlap.peakDb.toFixed(2)} dBFS`);

    console.log("🔍 Checking stingers");
    const stingers = STINGER_IDS.map((id) => {
        const s = decodeToStereo(stingerMp3(id));
        const lv = levels(s);
        const lengthSec = s.length / SR;
        if (lv.clippedSamples > 0) failures.push(`stinger ${id}: clipped`);
        if (lengthSec < STINGERS[id].hitSec) failures.push(`stinger ${id}: shorter than its hit time`);
        console.log(`   ${id.padEnd(10)} ${lengthSec.toFixed(2)}s  peak ${lv.peakDb.toFixed(2)}  ${lv.lufs.toFixed(1)} LUFS`);
        return { id, sizeKb: Math.round(fileSize(stingerMp3(id)) / 1024), lengthSec: round(lengthSec), peakDb: round(lv.peakDb), lufs: round(lv.lufs) };
    });

    const demoPath = join(ARTIFACT_DIR, "heaven-or-hell-demo.mp3");
    const demo = existsSync(demoPath)
        ? (() => {
              const s = decodeToStereo(demoPath);
              const lv = levels(s);
              if (lv.clippedSamples > 0) failures.push("demo: clipped");
              return { lengthSec: round(s.length / SR), peakDb: round(lv.peakDb), lufs: round(lv.lufs), clipped: lv.clippedSamples };
          })()
        : null;

    const totalKb = stems.reduce((a, s) => a + s.sizeKb, 0) + stingers.reduce((a, s) => a + s.sizeKb, 0);
    const report = {
        thresholds: { MAX_SEAM_RATIO, MIN_WRAP_CORRELATION, MAX_TIER_PEAK_DB, LENGTH_TOLERANCE },
        expected: { fileSamples: FILE_SAMPLES, loopSamples: LOOP_SAMPLES, padSamples: PAD_SAMPLES },
        stems,
        tiers,
        switchUpOverlap: { peakDb: round(overlap.peakDb), lufs: round(overlap.lufs) },
        stingers,
        demo,
        totalKb,
        failures,
    };
    writeText(join(ARTIFACT_DIR, "qa-report.json"), JSON.stringify(report, null, 2));
    writeText(join(ARTIFACT_DIR, "qa-report.md"), toMarkdown(report));
    console.log(`   total shipped audio ${(totalKb / 1024).toFixed(2)} MB`);
    if (failures.length) {
        console.error(`❌ ${failures.length} QA failure(s):\n   ${failures.join("\n   ")}`);
        process.exitCode = 1;
    } else {
        console.log(`✅ QA passed; report in ${ARTIFACT_DIR}/qa-report.md`);
    }
}

function toMarkdown(r: {
    stems: StemReport[];
    tiers: Array<{ tier: number; peakDb: number; lufs: number }>;
    switchUpOverlap: { peakDb: number };
    stingers: Array<{ id: string; sizeKb: number; lengthSec: number; peakDb: number; lufs: number }>;
    demo: { lengthSec: number; peakDb: number; lufs: number } | null;
    totalKb: number;
    failures: string[];
}): string {
    const lines = [
        "# Heaven Or Hell score QA",
        "",
        `Result: ${r.failures.length ? `**${r.failures.length} failure(s)**` : "pass"}. Total shipped audio: ${(r.totalKb / 1024).toFixed(2)} MB.`,
        "",
        `Seam ratio = loop-point step / 99.9th-percentile sample step (click if > ${MAX_SEAM_RATIO}). Wrap r = correlation of each pad with the loop edge it mirrors, after the MP3 round trip (must be >= ${MIN_WRAP_CORRELATION}). Offset = decoder lag found by least squares against the float loop (must be smaller than the 1 s pad). LUFS is BS.1770-style, not a certified meter.`,
        "",
        "| stem | kbps | ch | KB | decoded samples | offset | float seam | mp3 seam | wrap r | peak dBFS | RMS dB | LUFS | clipped |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
        ...r.stems.map(
            (s) =>
                `| ${s.id} | ${s.kbps} | ${s.channels} | ${s.sizeKb} | ${s.decodedSamples} | ${s.decoderOffset ?? "-"} | ${s.floatSeamRatio ?? "-"} | ${s.mp3SeamRatio} | ${s.wrapCorrelation} | ${s.peakDb} | ${s.rmsDb} | ${s.lufs} | ${s.clipped} |`,
        ),
        "",
        "| tier mix (with master 0.9) | peak dBFS | LUFS |",
        "| --- | --- | --- |",
        ...r.tiers.map((t) => `| ${t.tier} | ${t.peakDb} | ${t.lufs} |`),
        `| switch-up overlap (worst beat) | ${r.switchUpOverlap.peakDb} | - |`,
        "",
        "| stinger | KB | length s | peak dBFS | LUFS |",
        "| --- | --- | --- | --- | --- |",
        ...r.stingers.map((s) => `| ${s.id} | ${s.sizeKb} | ${s.lengthSec} | ${s.peakDb} | ${s.lufs} |`),
        "",
        r.demo ? `Demo: ${r.demo.lengthSec} s, peak ${r.demo.peakDb} dBFS, ${r.demo.lufs} LUFS.` : "Demo not rendered.",
        "",
        ...(r.failures.length ? ["## Failures", "", ...r.failures.map((f) => `- ${f}`)] : []),
    ];
    return lines.join("\n") + "\n";
}

main();
