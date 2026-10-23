import {
    Rng,
    SR,
    Stereo,
    TAU,
    adsr,
    bandpass,
    constant,
    expDecay,
    highpass,
    lowpass,
    midiHz,
    multiply,
    noise,
    osc,
    panGains,
    saturate,
    scale,
} from "./dsp";

const sec = (s: number): number => Math.max(1, Math.round(s * SR));

// ---------------------------------------------------------------- drums

/** Soft round kick for the heaven kit: short sine thump, no click. */
export function kickSoft(vel: number): Float32Array {
    const n = sec(0.32);
    const body = osc("sine", (i) => 46 + 70 * Math.exp(-i / (0.03 * SR)), n);
    const env = expDecay(n, 0.11, 0.003);
    return scale(saturate(multiply(body, env), 1.2), 0.9 * vel);
}

/** Punchy trap kick for the hard kit: fast pitch drop, click, drive; little sub so the 808 owns the lows. */
export function kickHard(vel: number, rng: Rng): Float32Array {
    const n = sec(0.26);
    const body = osc("sine", (i) => 52 + 190 * Math.exp(-i / (0.012 * SR)), n);
    const env = expDecay(n, 0.075, 0.001);
    const click = multiply(highpass(noise(n, rng), 2500), expDecay(n, 0.004, 0.0005));
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = body[i] * env[i] + click[i] * 0.35;
    return scale(saturate(highpass(out, 38), 2.4), 0.95 * vel);
}

/** Finger snap: two tight noise bursts around 2.5 kHz with a woody click. */
export function snap(vel: number, rng: Rng): Float32Array {
    const n = sec(0.16);
    const nz = noise(n, rng);
    const env = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        env[i] = Math.exp(-t / 0.012) + (t > 0.006 ? 0.7 * Math.exp(-(t - 0.006) / 0.03) : 0);
    }
    const body = multiply(bandpass(nz, 2600, 2.2), env);
    const tick = multiply(osc("sine", constant(1850), n), expDecay(n, 0.004, 0.0003));
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = body[i] * 1.6 + tick[i] * 0.3;
    return scale(out, 0.75 * vel);
}

/** Layered trap clap: three staggered bursts and a noisy tail. */
export function clap(vel: number, rng: Rng, tail = 0.16): Float32Array {
    const n = sec(0.05 + tail * 3);
    const nz = bandpass(noise(n, rng), 1300, 0.9);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        let e = 0;
        for (const off of [0, 0.011, 0.023]) if (t >= off) e += Math.exp(-(t - off) / 0.006) * 0.8;
        if (t >= 0.023) e += Math.exp(-(t - 0.023) / tail) * 0.55;
        out[i] = nz[i] * e;
    }
    return scale(highpass(out, 450), 1.6 * vel);
}

/** Hard snare: tonal body plus bright noise, driven. */
export function snare(vel: number, rng: Rng): Float32Array {
    const n = sec(0.3);
    const body = multiply(osc("triangle", (i) => 185 + 60 * Math.exp(-i / (0.01 * SR)), n), expDecay(n, 0.05));
    const nz = multiply(highpass(noise(n, rng), 1800), expDecay(n, 0.11));
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = body[i] * 1.2 + nz[i] * 0.8;
    return scale(saturate(out, 1.8), 0.8 * vel);
}

const HAT_RATIOS = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0];

/** 808-style metallic hat: six detuned square partials through a high band. */
export function hat(vel: number, decay: number, rng: Rng, tone = 1): Float32Array {
    const n = sec(decay * 6 + 0.01);
    const metal = new Float32Array(n);
    for (const f of HAT_RATIOS) {
        const o = osc("square", constant(f * 1.7 * tone), n, rng.next());
        for (let i = 0; i < n; i++) metal[i] += o[i] / HAT_RATIOS.length;
    }
    const nz = noise(n, rng);
    for (let i = 0; i < n; i++) metal[i] = metal[i] * 0.7 + nz[i] * 0.3;
    const shaped = bandpass(highpass(metal, 6500), 10500 * tone, 0.8);
    return scale(multiply(shaped, expDecay(n, decay, 0.0005)), 2.2 * vel);
}

export function rim(vel: number, rng: Rng): Float32Array {
    const n = sec(0.08);
    const tone = multiply(osc("sine", constant(1720), n), expDecay(n, 0.012, 0.0003));
    const nz = multiply(bandpass(noise(n, rng), 3200, 2), expDecay(n, 0.006, 0.0003));
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = tone[i] * 0.7 + nz[i] * 0.8;
    return scale(out, 0.7 * vel);
}

export function shaker(vel: number, rng: Rng): Float32Array {
    const n = sec(0.09);
    const env = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        env[i] = Math.min(1, t / 0.012) * Math.exp(-t / 0.03);
    }
    return scale(multiply(bandpass(highpass(noise(n, rng), 5000), 8000, 1.2), env), 0.9 * vel);
}

// ---------------------------------------------------------------- 808

export interface BassNote {
    /** Start, in samples from the start of the phrase buffer. */
    at: number;
    /** Held length in seconds (the tail continues after). */
    hold: number;
    midi: number;
    /** If set, the note starts at this pitch and glides into `midi`. */
    slideFrom?: number;
    slideSec?: number;
    vel?: number;
}

export interface BassStyle {
    /** Seconds for the body to decay once the note is held. */
    decay: number;
    /** Drive into the saturator; 1 is clean, 4+ is filthy. */
    drive: number;
    /** Level of the octave-up harmonic that makes the 808 audible on small speakers. */
    harmonic: number;
    /** Low-pass after the drive. */
    tone: number;
    /** Pitch "punch" at note-on in semitones. */
    punch: number;
}

/**
 * Renders a whole 808 line with mono legato: each new note cuts the previous
 * one, and slides glide the pitch exponentially in time, like a trap 808 with
 * portamento.
 */
export function render808(length: number, notes: BassNote[], style: BassStyle): Float32Array {
    const out = new Float32Array(length);
    const sorted = [...notes].sort((a, b) => a.at - b.at);
    let phase = 0;
    for (let k = 0; k < sorted.length; k++) {
        const nt = sorted[k];
        const nextAt = k + 1 < sorted.length ? sorted[k + 1].at : length;
        const end = Math.min(length, nextAt + sec(0.004));
        const holdN = nt.hold * SR;
        const slideN = (nt.slideSec ?? 0.09) * SR;
        const vel = nt.vel ?? 1;
        for (let i = nt.at; i < end; i++) {
            const j = i - nt.at;
            let m = nt.midi;
            if (nt.slideFrom !== undefined && j < slideN) {
                const x = j / slideN;
                m = nt.slideFrom + (nt.midi - nt.slideFrom) * (1 - Math.pow(1 - x, 2.2));
            }
            m += style.punch * Math.exp(-j / (0.012 * SR));
            const f = midiHz(m);
            phase += f / SR;
            if (phase >= 1) phase -= 1;
            const att = Math.min(1, j / (0.0025 * SR));
            const amp = j < holdN ? 1 - 0.35 * (j / Math.max(1, holdN)) : 0.65 * Math.exp(-(j - holdN) / (style.decay * SR));
            const fade = i > nextAt - sec(0.004) ? Math.max(0, (end - i) / sec(0.004)) : 1;
            const s = Math.sin(TAU * phase) + style.harmonic * Math.sin(2 * TAU * phase + 0.3);
            out[i] += s * amp * att * fade * vel;
        }
    }
    const driven = saturate(out, style.drive);
    return scale(lowpass(highpass(driven, 28), style.tone), 0.8);
}

// ---------------------------------------------------------------- bells and plucks

export interface BellStyle {
    /** Modulator ratio; integers ring like glass, irrational ones like a gong or a cursed bell. */
    ratio: number;
    index: number;
    decay: number;
    /** Second detuned partial for shimmer or menace. */
    detuneCents: number;
    bright: number;
}

export const HEAVEN_BELL: BellStyle = { ratio: 3.0, index: 2.4, decay: 1.6, detuneCents: 6, bright: 1 };
export const HELL_BELL: BellStyle = { ratio: 1.414, index: 4.5, decay: 2.2, detuneCents: 21, bright: 0.6 };

/** Two-operator FM bell with a decaying modulation index. */
export function fmBell(midi: number, vel: number, style: BellStyle): Float32Array {
    const n = sec(style.decay * 3.2);
    const out = new Float32Array(n);
    const f = midiHz(midi);
    const f2 = f * Math.pow(2, style.detuneCents / 1200);
    let pc = 0;
    let pm = 0;
    let pc2 = 0;
    let pm2 = 0;
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        const env = Math.min(1, i / (0.0015 * SR)) * Math.exp(-t / style.decay);
        const idx = style.index * Math.exp(-t / (style.decay * 0.35)) * style.bright + 0.3;
        pm += (f * style.ratio) / SR;
        pm2 += (f2 * style.ratio) / SR;
        pc += f / SR;
        pc2 += f2 / SR;
        const a = Math.sin(TAU * pc + idx * Math.sin(TAU * pm));
        const b = Math.sin(TAU * pc2 + idx * 0.8 * Math.sin(TAU * pm2));
        out[i] = (a * 0.6 + b * 0.4) * env;
    }
    return scale(out, 0.5 * vel);
}

/** Karplus-Strong harp string with a fractional-delay tuning and a soft pluck. */
export function harp(midi: number, vel: number, rng: Rng, decaySec = 2.2): Float32Array {
    const n = sec(decaySec * 1.6);
    const f = midiHz(midi);
    const period = SR / f;
    const d = Math.floor(period);
    const frac = period - d;
    const line = new Float32Array(d + 2);
    const pluck = lowpass(noise(d + 2, rng), 4000);
    line.set(pluck);
    const loss = Math.pow(0.001, 1 / (decaySec * f));
    const out = new Float32Array(n);
    let idx = 0;
    let prev = 0;
    for (let i = 0; i < n; i++) {
        const a = line[idx];
        const b = line[(idx + 1) % line.length];
        const v = a + (b - a) * frac;
        const y = 0.5 * (v + prev) * loss;
        prev = v;
        out[i] = v;
        line[idx] = y;
        idx = (idx + 1) % (d + 1);
    }
    const body = multiply(out, expDecay(n, decaySec * 0.6, 0.001));
    return scale(highpass(body, 90), 0.6 * vel);
}

// ---------------------------------------------------------------- pads and voices

export interface VoiceStack {
    voices: number;
    detuneCents: number;
    /** Slow random pitch wander in cents (the "corrupted" choir uses lots). */
    driftCents: number;
    vibratoHz: number;
    vibratoCents: number;
    wave: "saw" | "triangle" | "square";
    spread: number;
}

/**
 * Detuned unison stack of one note, spread across the stereo field. The raw
 * saw stack is what the choir formant bank and the supersaw are built from.
 */
export function unison(midi: number, holdSec: number, env: { a: number; d: number; s: number; r: number }, stack: VoiceStack, rng: Rng, pitchBendCents = 0): Stereo {
    const amp = adsr(env, holdSec);
    const n = amp.length;
    const out = Stereo.zeros(n);
    const base = midiHz(midi);
    for (let v = 0; v < stack.voices; v++) {
        const pos = stack.voices === 1 ? 0 : (v / (stack.voices - 1)) * 2 - 1;
        const cents = pos * stack.detuneCents + rng.bipolar() * stack.detuneCents * 0.2;
        const driftRate = rng.range(0.07, 0.23);
        const driftPhase = rng.range(0, TAU);
        const vibPhase = rng.range(0, TAU);
        const o = osc(
            stack.wave,
            (i) => {
                const t = i / SR;
                const vibDepth = Math.min(1, t / 0.6) * stack.vibratoCents;
                const c =
                    cents +
                    stack.driftCents * Math.sin(TAU * driftRate * t + driftPhase) +
                    vibDepth * Math.sin(TAU * stack.vibratoHz * t + vibPhase) +
                    pitchBendCents * (i / n);
                return base * Math.pow(2, c / 1200);
            },
            n,
            rng.next(),
        );
        const [gl, gr] = panGains(pos * stack.spread);
        const g = 1 / Math.sqrt(stack.voices);
        for (let i = 0; i < n; i++) {
            const s = o[i] * amp[i] * g;
            out.l[i] += s * gl;
            out.r[i] += s * gr;
        }
    }
    return out;
}

export type Vowel = "a" | "o" | "u" | "e";

const FORMANTS: Record<Vowel, Array<[number, number, number]>> = {
    // [centre Hz, Q, gain] for a soprano-ish choir
    a: [[800, 6, 1.0], [1150, 7, 0.5], [2900, 10, 0.25], [3900, 12, 0.12]],
    e: [[400, 6, 1.0], [1600, 8, 0.35], [2700, 10, 0.3], [3300, 12, 0.15]],
    o: [[450, 6, 1.0], [800, 7, 0.55], [2830, 10, 0.12], [3500, 12, 0.08]],
    u: [[325, 6, 1.0], [700, 7, 0.3], [2530, 10, 0.08], [3500, 12, 0.05]],
};

/** Parallel band-pass formant bank that turns a saw stack into a sung vowel. */
export function formant(x: Float32Array, vowel: Vowel, shift = 1): Float32Array {
    const out = new Float32Array(x.length);
    for (const [hz, q, g] of FORMANTS[vowel]) {
        const band = bandpass(x, hz * shift, q);
        for (let i = 0; i < x.length; i++) out[i] += band[i] * g;
    }
    return out;
}

/** Breath noise riding a choir so it sounds sung rather than synthesised. */
export function breath(length: number, rng: Rng, hz: number): Float32Array {
    return bandpass(noise(length, rng), hz, 1.5);
}

/** Drawbar organ: additive sines with a slow rotary tremolo and gentle drive. */
export function organ(midi: number, holdSec: number, rng: Rng, drawbars = [0.8, 1, 0.6, 0.45, 0.3, 0.2]): Stereo {
    const amp = adsr({ a: 0.008, d: 0.15, s: 0.85, r: 0.18 }, holdSec);
    const n = amp.length;
    const harmonics = [0.5, 1, 2, 3, 4, 6];
    const mono = new Float32Array(n);
    const f = midiHz(midi);
    for (let h = 0; h < harmonics.length; h++) {
        const o = osc("sine", constant(f * harmonics[h]), n, rng.next());
        for (let i = 0; i < n; i++) mono[i] += o[i] * drawbars[h] * 0.3;
    }
    const driven = saturate(mono, 1.6);
    const out = Stereo.zeros(n);
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        const rot = Math.sin(TAU * 5.8 * t);
        const v = driven[i] * amp[i];
        out.l[i] = v * (0.75 + 0.25 * rot);
        out.r[i] = v * (0.75 - 0.25 * rot);
    }
    return out;
}

/** Low brass stab: saw stack with a fast filter "blat" and a pitch scoop. */
export function brass(midi: number, holdSec: number, vel: number, rng: Rng): Stereo {
    const stack = unison(midi, holdSec, { a: 0.02, d: 0.25, s: 0.6, r: 0.22 }, {
        voices: 3, detuneCents: 9, driftCents: 2, vibratoHz: 4.5, vibratoCents: 4, wave: "saw", spread: 0.5,
    }, rng, 0);
    const cutoff = (i: number): number => {
        const t = i / SR;
        return 300 + 2600 * vel * Math.exp(-t / 0.12) * Math.min(1, t / 0.015) + 500 * vel;
    };
    return new Stereo(
        scale(saturate(lowpass(stack.l, cutoff, 1.4), 1.8), 0.55 * vel),
        scale(saturate(lowpass(stack.r, cutoff, 1.4), 1.8), 0.55 * vel),
    );
}

/** Breathy hollow flute for the ghost line: triangle body, band-passed breath, late vibrato. */
export function ghostFlute(midi: number, holdSec: number, vel: number, rng: Rng): Float32Array {
    const amp = adsr({ a: 0.09, d: 0.2, s: 0.8, r: 0.35 }, holdSec);
    const n = amp.length;
    const f = midiHz(midi);
    const body = osc("triangle", (i) => {
        const t = i / SR;
        const vib = Math.min(1, Math.max(0, (t - 0.25) / 0.4)) * 0.006 * Math.sin(TAU * 5.2 * t);
        return f * (1 + vib);
    }, n);
    const air = bandpass(noise(n, rng), f * 2, 3);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = (body[i] * 0.9 + air[i] * 0.55) * amp[i];
    return scale(lowpass(out, 3200), 0.6 * vel);
}

/** Thin, bit-reduced square lead whose notes sag at the end, for the Tier 5 horror line. */
export function horrorLead(midi: number, holdSec: number, vel: number, rng: Rng): Stereo {
    const stack = unison(midi, holdSec, { a: 0.01, d: 0.1, s: 0.75, r: 0.25 }, {
        voices: 2, detuneCents: 14, driftCents: 6, vibratoHz: 6.2, vibratoCents: 18, wave: "square", spread: 0.7,
    }, rng, -60);
    return new Stereo(scale(lowpass(stack.l, 3800), 0.35 * vel), scale(lowpass(stack.r, 3800), 0.35 * vel));
}

// ---------------------------------------------------------------- effects one-shots

/** Reverse-cymbal swell that ends exactly at its last sample. */
export function reverseCymbal(lengthSec: number, rng: Rng): Float32Array {
    const n = sec(lengthSec);
    const hit = multiply(highpass(noise(n, rng), 4200), expDecay(n, lengthSec * 0.28, 0.001));
    const rev = new Float32Array(n);
    for (let i = 0; i < n; i++) rev[i] = hit[n - 1 - i];
    return rev;
}

/** Noise riser with an opening band-pass and rising level. */
export function noiseRiser(lengthSec: number, rng: Rng, fromHz = 300, toHz = 9000): Float32Array {
    const n = sec(lengthSec);
    const sweep = (i: number): number => fromHz * Math.pow(toHz / fromHz, i / n);
    const body = bandpass(noise(n, rng), sweep, 2.5);
    for (let i = 0; i < n; i++) body[i] *= Math.pow(i / n, 2) * 1.8;
    return body;
}

/** Sub boom for drops: a long sine that dives from `fromMidi` to `toMidi`. */
export function subBoom(fromMidi: number, toMidi: number, lengthSec: number): Float32Array {
    const n = sec(lengthSec);
    const o = osc("sine", (i) => midiHz(toMidi + (fromMidi - toMidi) * Math.exp(-i / (0.09 * SR))), n);
    return scale(saturate(multiply(o, expDecay(n, lengthSec * 0.35, 0.002)), 1.6), 0.9);
}
