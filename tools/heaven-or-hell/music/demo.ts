/**
 * Renders listening material from the shipped MP3s:
 *   - heaven-or-hell-demo.mp3: a ~2.5 minute walk from Tier 0 to Tier 5 and
 *     back to heaven, driven by the same MusicDirector the game uses.
 *   - tier-N.mp3: each tier's static mix.
 *   - spectrogram PNGs of both.
 *
 *   npm run music:hoh:demo
 */
import { join } from "node:path";
import { MusicCommand, MusicDirector } from "../../../src/components/scenes/HeavenOrHell/audio/director";
import { AutomationPoint, FILTER_OPEN_HZ, gainsFor } from "../../../src/components/scenes/HeavenOrHell/audio/mixer";
import {
    BAR_SEC,
    LOOP_SAMPLES,
    MUSIC_MASTER_GAIN,
    PAD_SAMPLES,
    STEMS,
    STINGERS,
    STINGER_IDS,
    StemId,
    StingerId,
    TIERS,
    Tier,
} from "../../../src/components/scenes/HeavenOrHell/audio/musicSpec";
import { decodeToStereo, encodeMp3, writeText, writeWav } from "./io";
import { levels, round } from "./meter";
import { ARTIFACT_DIR, BUILD_DIR, stemMp3, stingerMp3 } from "./paths";
import { spectrogramPng } from "./spectrogram";
import { SR, Stereo, lowpass } from "./synth/dsp";

/** (bar, corruption) keyframes: a compressed two-hour-per-tier run, then heaven fights back. */
const TIMELINE: Array<[number, number]> = [
    [0, 0.1], [10, 0.7], [11, 1.05], [21, 1.6], [22, 2.05], [32, 2.6], [33, 3.05], [42, 3.7], [43, 4.05],
    [58, 4.6], [59, 5.0], [78, 5.0], [79, 2.5], [98, 2.3],
];
const DEMO_BARS = 100;
const TICK_SEC = 0.1;

function corruptionAt(sec: number): number {
    const bar = sec / BAR_SEC;
    for (let i = 1; i < TIMELINE.length; i++) {
        const [b0, c0] = TIMELINE[i - 1];
        const [b1, c1] = TIMELINE[i];
        if (bar <= b1) return c0 + ((c1 - c0) * (bar - b0)) / (b1 - b0);
    }
    return TIMELINE[TIMELINE.length - 1][1];
}

/** Forward-only reader of an automation lane, evaluated once per sample. */
class LaneCursor {
    private i = 1;
    constructor(private points: AutomationPoint[], private exponential = false) {}
    at(t: number): number {
        const p = this.points;
        if (t <= p[0].t) return p[0].v;
        while (this.i < p.length && p[this.i].t < t) this.i++;
        if (this.i >= p.length) return p[p.length - 1].v;
        const a = p[this.i - 1];
        const b = p[this.i];
        const f = b.t > a.t ? (t - a.t) / (b.t - a.t) : 1;
        if (this.exponential && a.v > 0 && b.v > 0) return a.v * Math.pow(b.v / a.v, f);
        return a.v + (b.v - a.v) * f;
    }
}

function loopRegion(path: string): Stereo {
    const d = decodeToStereo(path);
    return new Stereo(d.l.subarray(PAD_SAMPLES, PAD_SAMPLES + LOOP_SAMPLES), d.r.subarray(PAD_SAMPLES, PAD_SAMPLES + LOOP_SAMPLES));
}

function fadeEdges(s: Stereo, inSec: number, outSec: number): void {
    const n = s.length;
    const a = Math.round(inSec * SR);
    const b = Math.round(outSec * SR);
    for (let i = 0; i < n; i++) {
        const g = Math.min(1, a > 0 ? i / a : 1, b > 0 ? (n - 1 - i) / b : 1);
        s.l[i] *= g;
        s.r[i] *= g;
    }
}

function save(s: Stereo, name: string, kbps = 192): string {
    const wav = join(BUILD_DIR, "demo", `${name}.wav`);
    const mp3 = join(ARTIFACT_DIR, `${name}.mp3`);
    writeWav(wav, [s.l, s.r]);
    encodeMp3(wav, mp3, kbps, 2);
    return mp3;
}

function main(): void {
    console.log("🎨 Decoding shipped stems");
    const stems = {} as Record<StemId, Stereo>;
    for (const s of STEMS) stems[s.id] = loopRegion(stemMp3(s.id));
    const stingers = {} as Record<StingerId, Stereo>;
    for (const id of STINGER_IDS) stingers[id] = decodeToStereo(stingerMp3(id));

    // 1. Drive the director exactly as the scene would, one reading every 100 ms.
    const total = Math.round(DEMO_BARS * BAR_SEC * SR);
    const director = new MusicDirector(corruptionAt(0));
    const lanes = {} as Record<StemId, AutomationPoint[]>;
    const initial = director.gains;
    for (const s of STEMS) lanes[s.id] = [{ t: 0, v: initial[s.id] }];
    const filters: Record<"heaven" | "hell", AutomationPoint[]> = { heaven: [{ t: 0, v: FILTER_OPEN_HZ }], hell: [{ t: 0, v: FILTER_OPEN_HZ }] };
    const fired: Array<{ id: StingerId; startSec: number }> = [];
    const log: MusicCommand[] = [];
    for (let t = 0; t < total / SR; t += TICK_SEC) {
        const cmd = director.tick(t, corruptionAt(t));
        if (!cmd) continue;
        log.push(cmd);
        for (const s of STEMS) lanes[s.id].push(...cmd.automation[s.id]);
        if (cmd.filter) filters[cmd.filter.bus].push(...cmd.filter.points);
        if (cmd.stinger) fired.push(cmd.stinger);
    }

    // 2. Mix: stems through their set's bus, the leaving bus through its low-pass sweep.
    console.log("🎨 Mixing the demo");
    const buses: Record<"heaven" | "neutral" | "hell", Stereo> = {
        heaven: Stereo.zeros(total),
        neutral: Stereo.zeros(total),
        hell: Stereo.zeros(total),
    };
    for (const s of STEMS) {
        const cursor = new LaneCursor(lanes[s.id]);
        const src = stems[s.id];
        const bus = buses[s.set];
        for (let i = 0; i < total; i++) {
            const g = cursor.at(i / SR);
            if (g === 0) continue;
            const j = i % LOOP_SAMPLES;
            bus.l[i] += src.l[j] * g;
            bus.r[i] += src.r[j] * g;
        }
    }
    for (const which of ["heaven", "hell"] as const) {
        const cutoff = new LaneCursor(filters[which], true);
        const hz = (i: number): number => cutoff.at(i / SR);
        buses[which].l = lowpass(buses[which].l, hz);
        const cutoffR = new LaneCursor(filters[which], true);
        buses[which].r = lowpass(buses[which].r, (i) => cutoffR.at(i / SR));
    }
    const demo = Stereo.zeros(total);
    for (let i = 0; i < total; i++) {
        demo.l[i] = (buses.heaven.l[i] + buses.neutral.l[i] + buses.hell.l[i]) * MUSIC_MASTER_GAIN;
        demo.r[i] = (buses.heaven.r[i] + buses.neutral.r[i] + buses.hell.r[i]) * MUSIC_MASTER_GAIN;
    }
    for (const f of fired) {
        const st = stingers[f.id];
        const at = Math.round(f.startSec * SR);
        const g = STINGERS[f.id].level * MUSIC_MASTER_GAIN;
        for (let k = 0; k < st.length && at + k < total; k++) {
            if (at + k < 0) continue;
            demo.l[at + k] += st.l[k] * g;
            demo.r[at + k] += st.r[k] * g;
        }
    }
    fadeEdges(demo, 0.02, 4 * BAR_SEC);
    const demoPath = save(demo, "heaven-or-hell-demo");
    const demoLevels = levels(demo);
    console.log(`✅ ${demoPath}  ${(total / SR).toFixed(1)}s  peak ${demoLevels.peakDb.toFixed(2)} dBFS  ${demoLevels.lufs.toFixed(1)} LUFS`);

    const markers = log.map((c) => c.boundarySec);
    spectrogramPng(join(ARTIFACT_DIR, "heaven-or-hell-demo-spectrogram.png"), demo, { markers });

    // 3. Static tier clips, plus one strip with all six side by side.
    const clipBars = 12;
    const clipLen = Math.round(clipBars * BAR_SEC * SR);
    const strip = Stereo.zeros(clipLen * TIERS.length);
    const tierLevels: Record<number, ReturnType<typeof levels>> = {};
    for (const t of TIERS) {
        const g = gainsFor(t, t as Tier);
        const clip = Stereo.zeros(clipLen);
        for (const s of STEMS) {
            if (g[s.id] === 0) continue;
            const src = stems[s.id];
            for (let i = 0; i < clipLen; i++) {
                clip.l[i] += src.l[i % LOOP_SAMPLES] * g[s.id] * MUSIC_MASTER_GAIN;
                clip.r[i] += src.r[i % LOOP_SAMPLES] * g[s.id] * MUSIC_MASTER_GAIN;
            }
        }
        tierLevels[t] = levels(clip);
        strip.l.set(clip.l, t * clipLen);
        strip.r.set(clip.r, t * clipLen);
        fadeEdges(clip, 0.3, 2);
        const p = save(clip, `tier-${t}`, 160);
        console.log(`✅ ${p}  peak ${tierLevels[t].peakDb.toFixed(2)} dBFS  ${tierLevels[t].lufs.toFixed(1)} LUFS`);
    }
    spectrogramPng(join(ARTIFACT_DIR, "tiers-spectrogram.png"), strip, { markers: TIERS.slice(1).map((t) => (t * clipLen) / SR) });

    const events = log.map((c) => ({
        bar: c.boundaryBar,
        sec: round(c.boundarySec, 2),
        kind: c.kind,
        tier: c.tier,
        set: c.set,
        stinger: c.stinger?.id ?? null,
        corruption: round(corruptionAt(c.boundarySec), 2),
    }));
    writeText(join(ARTIFACT_DIR, "demo-timeline.json"), JSON.stringify({
        demo: { seconds: round(total / SR, 2), ...mapLevels(demoLevels) },
        tiers: Object.fromEntries(Object.entries(tierLevels).map(([k, v]) => [k, mapLevels(v)])),
        events,
    }, null, 2));
    console.log(`✅ ${events.length} director commands, stingers: ${fired.map((f) => f.id).join(", ")}`);
}

function mapLevels(l: ReturnType<typeof levels>): Record<string, number> {
    return { peakDb: round(l.peakDb), rmsDb: round(l.rmsDb), lufs: round(l.lufs), clippedSamples: l.clippedSamples };
}

main();
