import { Biquad, SR, Stereo, gainToDb } from "./synth/dsp";

export interface LevelReport {
    peakDb: number;
    rmsDb: number;
    /** Integrated loudness per ITU-R BS.1770 (K-weighting, 400 ms blocks, absolute and relative gates). "LUFS-ish": not a certified meter. */
    lufs: number;
    clippedSamples: number;
}

/** BS.1770 K-weighting: a high shelf (+4 dB near 1.7 kHz) then a 38 Hz high-pass. */
function kWeight(x: Float32Array): Float32Array {
    const shelf = Biquad.highShelf(1681.97, 3.99984, SR, 1);
    const hp = Biquad.highpass(38.135, 0.5003, SR);
    return hp.process(shelf.process(x));
}

export function integratedLufs(s: Stereo): number {
    const l = kWeight(s.l);
    const r = kWeight(s.r);
    const block = Math.round(0.4 * SR);
    const hop = Math.round(0.1 * SR);
    const powers: number[] = [];
    for (let start = 0; start + block <= l.length; start += hop) {
        let sum = 0;
        for (let i = start; i < start + block; i++) sum += l[i] * l[i] + r[i] * r[i];
        powers.push(sum / block);
    }
    const lk = (p: number): number => -0.691 + 10 * Math.log10(Math.max(p, 1e-12));
    const abs = powers.filter((p) => lk(p) > -70);
    if (abs.length === 0) return -Infinity;
    const meanAbs = abs.reduce((a, b) => a + b, 0) / abs.length;
    const rel = abs.filter((p) => lk(p) > lk(meanAbs) - 10);
    const meanRel = rel.reduce((a, b) => a + b, 0) / Math.max(1, rel.length);
    return lk(meanRel);
}

export function levels(s: Stereo): LevelReport {
    let peak = 0;
    let sum = 0;
    let clipped = 0;
    for (let i = 0; i < s.length; i++) {
        const a = Math.abs(s.l[i]);
        const b = Math.abs(s.r[i]);
        peak = Math.max(peak, a, b);
        if (a >= 1 || b >= 1) clipped++;
        sum += s.l[i] * s.l[i] + s.r[i] * s.r[i];
    }
    return {
        peakDb: gainToDb(peak),
        rmsDb: gainToDb(Math.sqrt(sum / (2 * Math.max(1, s.length)))),
        lufs: integratedLufs(s),
        clippedSamples: clipped,
    };
}

export function round(x: number, digits = 2): number {
    const f = Math.pow(10, digits);
    return Math.round(x * f) / f;
}
