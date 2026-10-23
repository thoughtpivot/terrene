/**
 * Small offline DSP kit: oscillators, envelopes, filters, noise, saturation,
 * bitcrush, a Freeverb-style reverb, ping-pong delay, sidechain ducking, and a
 * look-ahead limiter. Everything works on Float32Array at a fixed sample rate.
 */

export const SR = 44100;
export const TAU = Math.PI * 2;

export function midiHz(m: number): number {
    return 440 * Math.pow(2, (m - 69) / 12);
}

export function dbToGain(db: number): number {
    return Math.pow(10, db / 20);
}

export function gainToDb(g: number): number {
    return 20 * Math.log10(Math.max(g, 1e-12));
}

/** Deterministic PRNG (mulberry32) so every render is bit-identical. */
export class Rng {
    private s: number;
    constructor(seed: number) {
        this.s = seed >>> 0;
    }
    next(): number {
        this.s = (this.s + 0x6d2b79f5) >>> 0;
        let t = this.s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a: number, b: number): number {
        return a + (b - a) * this.next();
    }
    bipolar(): number {
        return this.next() * 2 - 1;
    }
}

export class Stereo {
    constructor(public l: Float32Array, public r: Float32Array) {}
    static zeros(length: number): Stereo {
        return new Stereo(new Float32Array(length), new Float32Array(length));
    }
    get length(): number {
        return this.l.length;
    }
}

/** Equal-power pan: -1 hard left, +1 hard right. */
export function panGains(pan: number): [number, number] {
    const a = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4;
    return [Math.cos(a), Math.sin(a)];
}

/** Mix a mono signal into a stereo bus at sample offset `at`, wrapping past the end if `wrap` is set. */
export function mixMono(dst: Stereo, src: Float32Array, at: number, gain = 1, pan = 0): void {
    const [gl, gr] = panGains(pan);
    const n = dst.length;
    for (let i = 0; i < src.length; i++) {
        const j = at + i;
        if (j < 0) continue;
        if (j >= n) break;
        const v = src[i] * gain;
        dst.l[j] += v * gl;
        dst.r[j] += v * gr;
    }
}

export function mixStereo(dst: Stereo, src: Stereo, at: number, gain = 1): void {
    const n = dst.length;
    for (let i = 0; i < src.length; i++) {
        const j = at + i;
        if (j < 0) continue;
        if (j >= n) break;
        dst.l[j] += src.l[i] * gain;
        dst.r[j] += src.r[i] * gain;
    }
}

// ---------------------------------------------------------------- oscillators

/** PolyBLEP residual for band-limited saw/square edges. */
function polyBlep(t: number, dt: number): number {
    if (t < dt) {
        const x = t / dt;
        return x + x - x * x - 1;
    }
    if (t > 1 - dt) {
        const x = (t - 1) / dt;
        return x * x + x + x + 1;
    }
    return 0;
}

export type Wave = "sine" | "saw" | "square" | "triangle";

/** Render an oscillator whose frequency may vary per sample (glides, vibrato). */
export function osc(wave: Wave, freq: (i: number) => number, length: number, phase0 = 0): Float32Array {
    const out = new Float32Array(length);
    let p = phase0 - Math.floor(phase0);
    let tri = 0;
    for (let i = 0; i < length; i++) {
        const f = freq(i);
        const dt = Math.min(0.49, Math.abs(f) / SR);
        let v: number;
        switch (wave) {
            case "sine":
                v = Math.sin(TAU * p);
                break;
            case "saw":
                v = 2 * p - 1 - polyBlep(p, dt);
                break;
            case "square": {
                v = (p < 0.5 ? 1 : -1) + polyBlep(p, dt) - polyBlep((p + 0.5) % 1, dt);
                break;
            }
            case "triangle": {
                const sq = (p < 0.5 ? 1 : -1) + polyBlep(p, dt) - polyBlep((p + 0.5) % 1, dt);
                tri = dt * sq * 4 + (1 - dt * 0.5) * tri;
                v = tri;
                break;
            }
        }
        out[i] = v;
        p += dt;
        if (p >= 1) p -= 1;
    }
    return out;
}

export function constant(hz: number): (i: number) => number {
    return () => hz;
}

// ---------------------------------------------------------------- envelopes

export interface Adsr {
    a: number;
    d: number;
    s: number;
    r: number;
}

/** Amplitude envelope for a note held for `hold` seconds; total length includes the release. */
export function adsr(env: Adsr, hold: number, curve = 1): Float32Array {
    const total = Math.ceil((hold + env.r) * SR);
    const out = new Float32Array(total);
    const a = Math.max(1, env.a * SR);
    const d = Math.max(1, env.d * SR);
    const h = hold * SR;
    let levelAtRelease = 0;
    for (let i = 0; i < total; i++) {
        let v: number;
        if (i < h) {
            if (i < a) v = i / a;
            else if (i < a + d) v = 1 + (env.s - 1) * ((i - a) / d);
            else v = env.s;
            levelAtRelease = v;
        } else {
            const x = (i - h) / Math.max(1, env.r * SR);
            v = levelAtRelease * Math.pow(Math.max(0, 1 - x), 2) * Math.exp(-3 * x);
        }
        out[i] = curve === 1 ? v : Math.pow(v, curve);
    }
    return out;
}

export function expDecay(length: number, tau: number, attack = 0.002): Float32Array {
    const out = new Float32Array(length);
    const a = Math.max(1, attack * SR);
    for (let i = 0; i < length; i++) {
        const t = i / SR;
        out[i] = Math.min(1, i / a) * Math.exp(-t / tau);
    }
    return out;
}

export function multiply(a: Float32Array, b: Float32Array): Float32Array {
    const n = Math.min(a.length, b.length);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = a[i] * b[i];
    return out;
}

export function scale(a: Float32Array, g: number): Float32Array {
    for (let i = 0; i < a.length; i++) a[i] *= g;
    return a;
}

export function addInto(dst: Float32Array, src: Float32Array, gain = 1, at = 0): Float32Array {
    for (let i = 0; i < src.length; i++) {
        const j = i + at;
        if (j >= 0 && j < dst.length) dst[j] += src[i] * gain;
    }
    return dst;
}

export function reverse(a: Float32Array): Float32Array {
    const out = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) out[i] = a[a.length - 1 - i];
    return out;
}

export function noise(length: number, rng: Rng): Float32Array {
    const out = new Float32Array(length);
    for (let i = 0; i < length; i++) out[i] = rng.bipolar();
    return out;
}

// ---------------------------------------------------------------- filters

export type FilterMode = "lp" | "hp" | "bp" | "notch";

/**
 * Topology-preserving state-variable filter (Zavalishin). Stable under fast
 * cutoff modulation, which the sweeps and formant choir rely on.
 */
export function svf(input: Float32Array, cutoff: number | ((i: number) => number), q: number, mode: FilterMode): Float32Array {
    const out = new Float32Array(input.length);
    let ic1 = 0;
    let ic2 = 0;
    const k = 1 / Math.max(0.05, q);
    const fixed = typeof cutoff === "number";
    let g = fixed ? Math.tan((Math.PI * Math.min(cutoff as number, SR * 0.49)) / SR) : 0;
    for (let i = 0; i < input.length; i++) {
        if (!fixed) g = Math.tan((Math.PI * Math.min(Math.max(20, (cutoff as (i: number) => number)(i)), SR * 0.49)) / SR);
        const a1 = 1 / (1 + g * (g + k));
        const a2 = g * a1;
        const a3 = g * a2;
        const v0 = input[i];
        const v3 = v0 - ic2;
        const v1 = a1 * ic1 + a2 * v3;
        const v2 = ic2 + a2 * ic1 + a3 * v3;
        ic1 = 2 * v1 - ic1;
        ic2 = 2 * v2 - ic2;
        switch (mode) {
            case "lp":
                out[i] = v2;
                break;
            case "hp":
                out[i] = v0 - k * v1 - v2;
                break;
            case "bp":
                out[i] = v1;
                break;
            case "notch":
                out[i] = v0 - k * v1;
                break;
        }
    }
    return out;
}

export function lowpass(x: Float32Array, hz: number | ((i: number) => number), q = 0.707): Float32Array {
    return svf(x, hz, q, "lp");
}

export function highpass(x: Float32Array, hz: number, q = 0.707): Float32Array {
    return svf(x, hz, q, "hp");
}

export function bandpass(x: Float32Array, hz: number | ((i: number) => number), q = 1): Float32Array {
    return svf(x, hz, q, "bp");
}

/** RBJ biquad for static shelving and peaking EQ (used by the K-weighting meter too). */
export class Biquad {
    private b0 = 1;
    private b1 = 0;
    private b2 = 0;
    private a1 = 0;
    private a2 = 0;
    private z1 = 0;
    private z2 = 0;

    static coefficients(b0: number, b1: number, b2: number, a0: number, a1: number, a2: number): Biquad {
        const f = new Biquad();
        f.b0 = b0 / a0;
        f.b1 = b1 / a0;
        f.b2 = b2 / a0;
        f.a1 = a1 / a0;
        f.a2 = a2 / a0;
        return f;
    }

    static peaking(hz: number, q: number, db: number, sr = SR): Biquad {
        const A = Math.pow(10, db / 40);
        const w = (TAU * hz) / sr;
        const alpha = Math.sin(w) / (2 * q);
        const c = Math.cos(w);
        return Biquad.coefficients(1 + alpha * A, -2 * c, 1 - alpha * A, 1 + alpha / A, -2 * c, 1 - alpha / A);
    }

    static highShelf(hz: number, db: number, sr = SR, slope = 1): Biquad {
        const A = Math.pow(10, db / 40);
        const w = (TAU * hz) / sr;
        const c = Math.cos(w);
        const alpha = (Math.sin(w) / 2) * Math.sqrt((A + 1 / A) * (1 / slope - 1) + 2);
        const sq = 2 * Math.sqrt(A) * alpha;
        return Biquad.coefficients(
            A * (A + 1 + (A - 1) * c + sq),
            -2 * A * (A - 1 + (A + 1) * c),
            A * (A + 1 + (A - 1) * c - sq),
            A + 1 - (A - 1) * c + sq,
            2 * (A - 1 - (A + 1) * c),
            A + 1 - (A - 1) * c - sq,
        );
    }

    static lowShelf(hz: number, db: number, sr = SR, slope = 1): Biquad {
        const A = Math.pow(10, db / 40);
        const w = (TAU * hz) / sr;
        const c = Math.cos(w);
        const alpha = (Math.sin(w) / 2) * Math.sqrt((A + 1 / A) * (1 / slope - 1) + 2);
        const sq = 2 * Math.sqrt(A) * alpha;
        return Biquad.coefficients(
            A * (A + 1 - (A - 1) * c + sq),
            2 * A * (A - 1 - (A + 1) * c),
            A * (A + 1 - (A - 1) * c - sq),
            A + 1 + (A - 1) * c + sq,
            -2 * (A - 1 + (A + 1) * c),
            A + 1 + (A - 1) * c - sq,
        );
    }

    static highpass(hz: number, q: number, sr = SR): Biquad {
        const w = (TAU * hz) / sr;
        const alpha = Math.sin(w) / (2 * q);
        const c = Math.cos(w);
        return Biquad.coefficients((1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + alpha, -2 * c, 1 - alpha);
    }

    process(x: Float32Array): Float32Array {
        const out = new Float32Array(x.length);
        let z1 = this.z1;
        let z2 = this.z2;
        for (let i = 0; i < x.length; i++) {
            const v = x[i];
            const y = this.b0 * v + z1;
            z1 = this.b1 * v - this.a1 * y + z2;
            z2 = this.b2 * v - this.a2 * y;
            out[i] = y;
        }
        this.z1 = z1;
        this.z2 = z2;
        return out;
    }
}

// ---------------------------------------------------------------- distortion

export function saturate(x: Float32Array, drive: number, mix = 1): Float32Array {
    const out = new Float32Array(x.length);
    const norm = 1 / Math.tanh(drive);
    for (let i = 0; i < x.length; i++) {
        const wet = Math.tanh(x[i] * drive) * norm;
        out[i] = x[i] * (1 - mix) + wet * mix;
    }
    return out;
}

/** Cubic soft clipper: transparent below the knee, rounded above. */
export function softClip(x: Float32Array, ceiling = 1): Float32Array {
    const out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) {
        const v = x[i] / ceiling;
        const c = v > 1 ? 2 / 3 : v < -1 ? -2 / 3 : v - (v * v * v) / 3;
        out[i] = c * 1.5 * ceiling;
    }
    return out;
}

/** Asymmetric wavefolder-ish drive for the evil 808s: adds even harmonics. */
export function grit(x: Float32Array, drive: number): Float32Array {
    const out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) {
        const v = x[i] * drive;
        out[i] = Math.tanh(v + 0.25 * v * v * Math.sign(v) * 0.3) * 0.9 + 0.1 * Math.sin(v * 1.7);
    }
    return out;
}

/** Bit depth and sample-rate reduction. */
export function bitcrush(x: Float32Array, bits: number, holdSamples: number, mix = 1): Float32Array {
    const out = new Float32Array(x.length);
    const levels = Math.pow(2, bits - 1);
    let held = 0;
    for (let i = 0; i < x.length; i++) {
        if (i % Math.max(1, Math.round(holdSamples)) === 0) held = Math.round(x[i] * levels) / levels;
        out[i] = x[i] * (1 - mix) + held * mix;
    }
    return out;
}

// ---------------------------------------------------------------- time effects

class Comb {
    private buf: Float32Array;
    private idx = 0;
    private store = 0;
    constructor(size: number, private feedback: number, private damp: number) {
        this.buf = new Float32Array(size);
    }
    tick(x: number): number {
        const y = this.buf[this.idx];
        this.store = y * (1 - this.damp) + this.store * this.damp;
        this.buf[this.idx] = x + this.store * this.feedback;
        if (++this.idx >= this.buf.length) this.idx = 0;
        return y;
    }
}

class Allpass {
    private buf: Float32Array;
    private idx = 0;
    constructor(size: number, private feedback = 0.5) {
        this.buf = new Float32Array(size);
    }
    tick(x: number): number {
        const b = this.buf[this.idx];
        const y = -x + b;
        this.buf[this.idx] = x + b * this.feedback;
        if (++this.idx >= this.buf.length) this.idx = 0;
        return y;
    }
}

export interface ReverbOptions {
    /** 0..1, longer tail as it approaches 1. */
    room: number;
    /** 0..1 high-frequency damping in the tail. */
    damp: number;
    /** Pre-delay in seconds. */
    preDelay?: number;
    /** Stereo spread in samples between channel tunings. */
    spread?: number;
    /** High-pass the reverb input to keep lows dry. */
    lowCut?: number;
}

/** Freeverb (Jezar's public-domain design): 8 parallel combs into 4 allpasses per channel. Returns the wet signal only. */
export function reverb(l: Float32Array, r: Float32Array, opts: ReverbOptions): [Float32Array, Float32Array] {
    const scaleRate = SR / 44100;
    const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
    const aps = [556, 441, 341, 225];
    const spread = opts.spread ?? 23;
    const fb = 0.7 + 0.28 * opts.room;
    const damp = opts.damp * 0.4;
    const mk = (offset: number) => ({
        c: combs.map((s) => new Comb(Math.round((s + offset) * scaleRate), fb, damp)),
        a: aps.map((s) => new Allpass(Math.round((s + offset) * scaleRate))),
    });
    const L = mk(0);
    const R = mk(spread);
    const pre = Math.round((opts.preDelay ?? 0.02) * SR);
    const n = l.length;
    let inL = l;
    let inR = r;
    if (opts.lowCut) {
        inL = highpass(l, opts.lowCut);
        inR = highpass(r, opts.lowCut);
    }
    const outL = new Float32Array(n);
    const outR = new Float32Array(n);
    const gainIn = 0.015;
    for (let i = 0; i < n; i++) {
        const j = i - pre;
        const x = j >= 0 ? (inL[j] + inR[j]) * gainIn : 0;
        let yl = 0;
        let yr = 0;
        for (let k = 0; k < 8; k++) {
            yl += L.c[k].tick(x);
            yr += R.c[k].tick(x);
        }
        for (let k = 0; k < 4; k++) {
            yl = L.a[k].tick(yl);
            yr = R.a[k].tick(yr);
        }
        outL[i] = yl;
        outR[i] = yr;
    }
    return [outL, outR];
}

/** Ping-pong delay with a darkening feedback path. Returns the wet signal only. */
export function pingPong(
    l: Float32Array,
    r: Float32Array,
    delaySec: number,
    feedback: number,
    toneHz = 3500,
): [Float32Array, Float32Array] {
    const d = Math.max(1, Math.round(delaySec * SR));
    const n = l.length;
    const bufL = new Float32Array(d);
    const bufR = new Float32Array(d);
    const outL = new Float32Array(n);
    const outR = new Float32Array(n);
    const coeff = Math.exp((-TAU * toneHz) / SR);
    let lpL = 0;
    let lpR = 0;
    let idx = 0;
    for (let i = 0; i < n; i++) {
        const dl = bufL[idx];
        const dr = bufR[idx];
        lpL = dl + (lpL - dl) * coeff;
        lpR = dr + (lpR - dr) * coeff;
        outL[i] = dl;
        outR[i] = dr;
        // Mono input enters on the left, then bounces across.
        bufL[idx] = (l[i] + r[i]) * 0.5 + lpR * feedback;
        bufR[idx] = lpL * feedback;
        if (++idx >= d) idx = 0;
    }
    return [outL, outR];
}

/**
 * Sidechain gain curve: dips to (1 - depth) at each trigger time and recovers
 * over `release` seconds. Times are positions within a loop of `length`
 * samples, and the curve wraps so it is itself seamless.
 */
export function duckCurve(length: number, triggers: number[], depth: number, release: number, attack = 0.004): Float32Array {
    const out = new Float32Array(length).fill(1);
    const rel = release * SR;
    const att = Math.max(1, attack * SR);
    const span = Math.ceil(rel * 5 + att);
    for (const t of triggers) {
        const start = Math.round(t);
        for (let k = -Math.round(att); k < span; k++) {
            const idx = (((start + k) % length) + length) % length;
            const g = k < 0 ? 1 - depth * (1 + k / att) : 1 - depth * Math.exp(-k / rel);
            if (g < out[idx]) out[idx] = g;
        }
    }
    return out;
}

/**
 * Look-ahead peak limiter (stereo-linked). Gain reduction attacks over the
 * look-ahead window and releases exponentially, so no sample exceeds `ceiling`.
 */
export function limiter(l: Float32Array, r: Float32Array, ceiling: number, lookahead = 0.005, release = 0.12): [Float32Array, Float32Array] {
    const n = l.length;
    const la = Math.max(1, Math.round(lookahead * SR));
    const need = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const p = Math.max(Math.abs(l[i]), Math.abs(r[i]));
        need[i] = p > ceiling ? ceiling / p : 1;
    }
    // Running minimum of the required gain over the look-ahead window (deque).
    const winMin = new Float32Array(n);
    const dq = new Int32Array(n);
    let head = 0;
    let tail = 0;
    for (let i = n - 1; i >= 0; i--) {
        while (tail > head && need[dq[tail - 1]] >= need[i]) tail--;
        dq[tail++] = i;
        while (dq[head] > i + la) head++;
        winMin[i] = need[dq[head]];
    }
    const relCoeff = Math.exp(-1 / (release * SR));
    const attCoeff = Math.exp(-1 / (la / 3));
    const outL = new Float32Array(n);
    const outR = new Float32Array(n);
    let g = 1;
    for (let i = 0; i < n; i++) {
        const target = winMin[i];
        g = target < g ? target + (g - target) * attCoeff : target + (g - target) * relCoeff;
        const gg = Math.min(g, need[i]);
        outL[i] = l[i] * gg;
        outR[i] = r[i] * gg;
    }
    return [outL, outR];
}
