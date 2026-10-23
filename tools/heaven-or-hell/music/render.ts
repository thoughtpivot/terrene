/**
 * Renders the Heaven Or Hell adaptive score: 13 seamless stems and 4 stingers.
 *
 *   npm run music:hoh            # render everything
 *   npm run music:hoh -- heavenBells grit808   # re-render just these stems (others reuse the build cache)
 *
 * Output MP3s go to src/components/scenes/HeavenOrHell/audio/music/.
 * Encoding uses ffmpeg's libmp3lame (LAME), which must be on PATH.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { gainsFor } from "../../../src/components/scenes/HeavenOrHell/audio/mixer";
import {
    LOOP_SAMPLES,
    PAD_SAMPLES,
    STEMS,
    STINGER_IDS,
    StemId,
    TIERS,
    Tier,
    stemInfo,
} from "../../../src/components/scenes/HeavenOrHell/audio/musicSpec";
import { encodeMp3, fileSize, hasFfmpeg, readJson, writeText, writeWav, decodeToStereo } from "./io";
import { padForFile } from "./loop";
import { integratedLufs, levels, round } from "./meter";
import { BUILD_DIR, loopWav, manifestPath, stemMp3, stingerMp3 } from "./paths";
import { STEM_RENDERERS } from "./stems";
import { STINGER_RENDERERS } from "./stingers";
import { Stereo, dbToGain, limiter } from "./synth/dsp";

/**
 * Loudness each stem is normalised to before the tier gains apply. These set
 * the balance of the arrangement: drums and 808s forward, hats and the ghost
 * line tucked in. K-weighting under-reads sub-bass, so the 808 targets look low.
 */
const STEM_TARGET_LUFS: Record<StemId, number> = {
    heavenChoir: -22,
    heavenBells: -23.5,
    heaven808: -24,
    corruptChoir: -23,
    grit808: -22,
    drumsSoft: -23,
    hatsRoll: -26,
    ghostLine: -25,
    drumsHard: -21,
    hellBells: -23,
    hellChoir: -23.5,
    hell808: -21,
    hellBrass: -22.5,
};

/** The loudest tier mix lands here, leaving room for sound effects on top. */
const TOP_TIER_LUFS = -16;
/** No tier mix may peak above this. */
const TIER_PEAK_DB = -3;
const STINGER_LUFS = -18;
const STINGER_PEAK_DB = -2;

interface Manifest {
    stems: Record<string, { rawLufs: number; normGain: number }>;
    globalGain: number;
}

function scaled(s: Stereo, g: number): Stereo {
    const l = new Float32Array(s.length);
    const r = new Float32Array(s.length);
    for (let i = 0; i < s.length; i++) {
        l[i] = s.l[i] * g;
        r[i] = s.r[i] * g;
    }
    return new Stereo(l, r);
}

function tierMix(stems: Record<StemId, Stereo>, tier: Tier): Stereo {
    const gains = gainsFor(tier, tier);
    const out = Stereo.zeros(LOOP_SAMPLES);
    for (const s of STEMS) {
        const g = gains[s.id];
        if (g === 0) continue;
        const x = stems[s.id];
        for (let i = 0; i < LOOP_SAMPLES; i++) {
            out.l[i] += x.l[i] * g;
            out.r[i] += x.r[i] * g;
        }
    }
    return out;
}

function main(): void {
    if (!hasFfmpeg()) throw new Error("ffmpeg (with libmp3lame) is required on PATH to encode the stems");
    const only = new Set(process.argv.slice(2));
    const cached = existsSync(manifestPath()) ? readJson<Manifest>(manifestPath()) : null;

    console.log(`🎨 Rendering Heaven Or Hell stems into ${BUILD_DIR}`);
    const normalised = {} as Record<StemId, Stereo>;
    const manifest: Manifest = { stems: {}, globalGain: 1 };
    for (const stem of STEMS) {
        const reuse = only.size > 0 && !only.has(stem.id) && cached?.stems[stem.id] && existsSync(loopWav(stem.id));
        let raw: Stereo;
        if (reuse) {
            // The cached loop is stored post-normalisation and pre-global gain.
            const decoded = decodeToStereo(loopWav(stem.id));
            raw = new Stereo(decoded.l.subarray(0, LOOP_SAMPLES), decoded.r.subarray(0, LOOP_SAMPLES));
            normalised[stem.id] = raw;
            manifest.stems[stem.id] = cached!.stems[stem.id];
            console.log(`   ${stem.id.padEnd(13)} reused`);
            continue;
        }
        const t0 = Date.now();
        raw = STEM_RENDERERS[stem.id]();
        if (raw.length !== LOOP_SAMPLES) throw new Error(`${stem.id} rendered ${raw.length} samples, expected ${LOOP_SAMPLES}`);
        const lufs = integratedLufs(raw);
        const g = dbToGain(STEM_TARGET_LUFS[stem.id] - lufs);
        normalised[stem.id] = scaled(raw, g);
        manifest.stems[stem.id] = { rawLufs: round(lufs), normGain: round(g, 4) };
        writeWav(loopWav(stem.id), [normalised[stem.id].l, normalised[stem.id].r], "float32");
        console.log(`   ${stem.id.padEnd(13)} ${((Date.now() - t0) / 1000).toFixed(1)}s  raw ${lufs.toFixed(1)} LUFS`);
    }

    let maxPeak = 0;
    let maxLufs = -Infinity;
    for (const t of TIERS) {
        const mix = tierMix(normalised, t);
        const lv = levels(mix);
        maxPeak = Math.max(maxPeak, dbToGain(lv.peakDb));
        maxLufs = Math.max(maxLufs, lv.lufs);
        console.log(`   tier ${t} pre-master: ${lv.lufs.toFixed(1)} LUFS, peak ${lv.peakDb.toFixed(1)} dBFS`);
    }
    const global = Math.min(dbToGain(TOP_TIER_LUFS - maxLufs), dbToGain(TIER_PEAK_DB) / maxPeak);
    manifest.globalGain = round(global, 4);
    console.log(`   master gain ${(20 * Math.log10(global)).toFixed(2)} dB`);

    for (const stem of STEMS) {
        const final = scaled(normalised[stem.id], global);
        const wav = join(BUILD_DIR, "padded", `${stem.id}.wav`);
        writeWav(wav, [padForFile(final.l, PAD_SAMPLES), padForFile(final.r, PAD_SAMPLES)]);
        const info = stemInfo(stem.id);
        encodeMp3(wav, stemMp3(stem.id), info.kbps, info.channels);
        console.log(`✅ ${stem.id.padEnd(13)} ${(fileSize(stemMp3(stem.id)) / 1024).toFixed(0)} KB`);
    }

    if (only.size === 0 || STINGER_IDS.some((id) => only.has(id))) {
        for (const id of STINGER_IDS) {
            if (only.size > 0 && !only.has(id)) continue;
            const raw = STINGER_RENDERERS[id]();
            const g = dbToGain(STINGER_LUFS - integratedLufs(raw));
            const [l, r] = limiter(scaled(raw, g).l, scaled(raw, g).r, dbToGain(STINGER_PEAK_DB));
            const wav = join(BUILD_DIR, "stingers", `${id}.wav`);
            writeWav(wav, [l, r]);
            encodeMp3(wav, stingerMp3(id), 128, 2);
            console.log(`✅ stinger ${id.padEnd(10)} ${(fileSize(stingerMp3(id)) / 1024).toFixed(0)} KB`);
        }
    }
    writeText(manifestPath(), JSON.stringify(manifest, null, 2));
}

main();
