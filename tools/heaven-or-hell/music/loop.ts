/**
 * Loop maths for gapless stems. A stem is rendered into a buffer longer than
 * the loop; whatever spills past the loop end (note releases, echoes) is folded
 * back onto the start, so the end flows into the beginning exactly as if the
 * music had kept playing. Stateful effects (filters, reverb, limiter) are run
 * over two copies of the loop and the second copy is kept: by then the effect
 * is in its steady circular state, so there is no seam where its memory resets.
 */

export function loopSampleCount(bpm: number, bars: number, sampleRate: number, beatsPerBar = 4): number {
    const exact = (bars * beatsPerBar * 60 * sampleRate) / bpm;
    const rounded = Math.round(exact);
    if (Math.abs(exact - rounded) > 1e-6) {
        throw new Error(`loop of ${bars} bars at ${bpm} BPM is ${exact} samples; pick a tempo that lands on a whole sample`);
    }
    return rounded;
}

/** Sum every loopLength-long slice of `buf` onto the first one. */
export function foldTail(buf: Float32Array, loopLength: number): Float32Array {
    const out = new Float32Array(loopLength);
    for (let i = 0; i < buf.length; i++) out[i % loopLength] += buf[i];
    return out;
}

/** Run a stateful process over the loop as if it had already been playing for one full cycle. */
export function circularProcess(loop: Float32Array, process: (input: Float32Array) => Float32Array): Float32Array {
    const n = loop.length;
    const doubled = new Float32Array(n * 2);
    doubled.set(loop, 0);
    doubled.set(loop, n);
    const processed = process(doubled);
    if (processed.length < 2 * n) throw new Error("circularProcess: process must preserve length");
    return processed.slice(n, 2 * n);
}

/** Stereo variant: the process sees both channels together (needed for reverbs and linked limiters). */
export function circularProcessStereo(
    left: Float32Array,
    right: Float32Array,
    process: (l: Float32Array, r: Float32Array) => [Float32Array, Float32Array],
): [Float32Array, Float32Array] {
    const n = left.length;
    const dl = new Float32Array(n * 2);
    const dr = new Float32Array(n * 2);
    dl.set(left, 0);
    dl.set(left, n);
    dr.set(right, 0);
    dr.set(right, n);
    const [pl, pr] = process(dl, dr);
    return [pl.slice(n, 2 * n), pr.slice(n, 2 * n)];
}

/** File layout: [last `pad` samples of the loop] + loop + [first `pad` samples of the loop]. */
export function padForFile(loop: Float32Array, pad: number): Float32Array {
    const n = loop.length;
    if (pad > n) throw new Error("pad longer than loop");
    const out = new Float32Array(n + 2 * pad);
    out.set(loop.subarray(n - pad), 0);
    out.set(loop, pad);
    out.set(loop.subarray(0, pad), pad + n);
    return out;
}

export interface SeamMetrics {
    /** |x[0] - x[N-1]|: the step the listener hears when the loop wraps. */
    seamJump: number;
    /** 99.9th percentile of |x[i+1] - x[i]| inside the loop: what "normal" motion looks like. */
    typicalJump: number;
    maxJump: number;
    /** seamJump / typicalJump; at or below ~1 means the wrap is indistinguishable from any other sample step. */
    ratio: number;
}

export function seamMetrics(loop: Float32Array): SeamMetrics {
    const n = loop.length;
    const seamJump = Math.abs(loop[0] - loop[n - 1]);
    // A coarse histogram keeps this linear-time even on multi-million-sample stems.
    const bins = 4096;
    let maxJump = 0;
    for (let i = 1; i < n; i++) maxJump = Math.max(maxJump, Math.abs(loop[i] - loop[i - 1]));
    const hist = new Uint32Array(bins);
    const scale = maxJump > 0 ? (bins - 1) / maxJump : 0;
    for (let i = 1; i < n; i++) hist[Math.floor(Math.abs(loop[i] - loop[i - 1]) * scale)]++;
    const target = 0.999 * (n - 1);
    let acc = 0;
    let typicalJump = maxJump;
    for (let b = 0; b < bins; b++) {
        acc += hist[b];
        if (acc >= target) {
            typicalJump = scale > 0 ? (b + 1) / scale : 0;
            break;
        }
    }
    const ratio = typicalJump > 0 ? seamJump / typicalJump : seamJump === 0 ? 0 : Infinity;
    return { seamJump, typicalJump, maxJump, ratio };
}
