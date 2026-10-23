import { BAR_SEC, LOOP_BARS, LOOP_SAMPLES, STEPS_PER_BAR, StemId } from "../../../src/components/scenes/HeavenOrHell/audio/musicSpec";
import { Bass808Id, bass808Notes } from "../../../src/components/scenes/HeavenOrHell/audio/bass808";
import { circularProcessStereo, foldTail } from "./loop";
import {
    GHOST_PLAN,
    HEAVEN_CHORDS,
    HELL_CHORDS,
    LYDIAN,
    MELODY_PLAN,
    SLOTS,
    SLOT_BARS,
    SNARE_STEP,
    STEP,
    degreeToMidi,
    kickSteps,
    kickTriggerSamples,
    motifMidi,
    phraseOfBar,
    softKickSteps,
    softKickTriggerSamples,
    stepAt,
    barAt,
} from "./score";
import {
    Biquad,
    Rng,
    SR,
    bandpass,
    Stereo,
    bitcrush,
    duckCurve,
    grit,
    highpass,
    lowpass,
    mixMono,
    mixStereo,
    noise,
    pingPong,
    reverb,
    reverse,
    saturate,
    softClip,
    ReverbOptions,
} from "./synth/dsp";
import {
    BassNote,
    BassStyle,
    HEAVEN_BELL,
    HELL_BELL,
    Vowel,
    brass,
    clap,
    fmBell,
    formant,
    ghostFlute,
    harp,
    hat,
    horrorLead,
    kickHard,
    kickSoft,
    organ,
    render808,
    reverseCymbal,
    rim,
    shaker,
    snap,
    snare,
    unison,
    VoiceStack,
} from "./synth/instruments";

const N = LOOP_SAMPLES;
const TAIL = 9 * SR;

/** A render bus with room for tails; notes are placed modulo the loop so pickups before bar 0 wrap to the end. */
class Bus {
    readonly buf = Stereo.zeros(N + TAIL);

    mono(sig: Float32Array, at: number, gain = 1, pan = 0): void {
        mixMono(this.buf, sig, wrap(at), gain, pan);
    }

    stereo(sig: Stereo, at: number, gain = 1): void {
        mixStereo(this.buf, sig, wrap(at), gain);
    }

    /** Place a sound so that it *ends* at `endAt` (reversed swells). */
    endingAt(sig: Float32Array, endAt: number, gain = 1, pan = 0): void {
        this.mono(sig, endAt - sig.length, gain, pan);
    }

    loop(): Stereo {
        return new Stereo(foldTail(this.buf.l, N), foldTail(this.buf.r, N));
    }
}

function wrap(at: number): number {
    return ((at % N) + N) % N;
}

function circular(loop: Stereo, fx: (l: Float32Array, r: Float32Array) => [Float32Array, Float32Array]): Stereo {
    const [l, r] = circularProcessStereo(loop.l, loop.r, fx);
    return new Stereo(l, r);
}

function add(a: Stereo, b: Stereo, gb = 1): Stereo {
    const l = new Float32Array(a.length);
    const r = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) {
        l[i] = a.l[i] + b.l[i] * gb;
        r[i] = a.r[i] + b.r[i] * gb;
    }
    return new Stereo(l, r);
}

function withReverb(dry: Stereo, opts: ReverbOptions, wet: number): Stereo {
    const tail = circular(dry, (l, r) => reverb(l, r, opts));
    return add(dry, tail, wet);
}

function withDelay(dry: Stereo, delaySec: number, feedback: number, wet: number, tone = 3500): Stereo {
    const echo = circular(dry, (l, r) => pingPong(l, r, delaySec, feedback, tone));
    return add(dry, echo, wet);
}

function eachChannel(s: Stereo, fx: (x: Float32Array) => Float32Array): Stereo {
    return circular(s, (l, r) => [fx(l), fx(r)]);
}

function duck(s: Stereo, triggers: number[], depth: number, release: number): Stereo {
    const curve = duckCurve(N, triggers, depth, release);
    const l = new Float32Array(N);
    const r = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        l[i] = s.l[i] * curve[i];
        r[i] = s.r[i] * curve[i];
    }
    return new Stereo(l, r);
}

function shelf(x: Float32Array, hz: number, db: number): Float32Array {
    return Biquad.highShelf(hz, db).process(x);
}

function rms(s: Stereo): number {
    let acc = 0;
    for (let i = 0; i < s.length; i++) acc += s.l[i] * s.l[i] + s.r[i] * s.r[i];
    return Math.sqrt(acc / (2 * s.length));
}

function toMono(s: Stereo): Stereo {
    const m = new Float32Array(s.length);
    for (let i = 0; i < s.length; i++) m[i] = (s.l[i] + s.r[i]) * 0.5;
    return new Stereo(m, m.slice());
}

const HEAVEN_VERB: ReverbOptions = { room: 0.93, damp: 0.2, preDelay: 0.05, lowCut: 220 };
const DARK_VERB: ReverbOptions = { room: 0.86, damp: 0.75, preDelay: 0.03, lowCut: 160 };
const ROOM_VERB: ReverbOptions = { room: 0.55, damp: 0.5, preDelay: 0.01, lowCut: 300 };

const DOTTED_EIGHTH = 3 * STEP;
const SWING = 0.008;

function swung(bar: number, step: number): number {
    return stepAt(bar, Math.floor(step), (step % 2 === 1 ? SWING : 0) + (step - Math.floor(step)) * STEP);
}

// ---------------------------------------------------------------- choirs

interface ChoirOptions {
    stack: VoiceStack;
    vowel: Vowel;
    formantShift: number;
    octave: number;
    bendCents: number;
    env: { a: number; d: number; s: number; r: number };
}

/** Unison stacks through a resonant formant bank gain a lot; this keeps the raw choir near -20 LUFS so crush and drive behave. */
const CHOIR_TRIM = 0.06;

function renderChoirChords(bus: Bus, chords: typeof HEAVEN_CHORDS, opts: ChoirOptions, rng: Rng, gain = CHOIR_TRIM): void {
    for (let s = 0; s < SLOTS; s++) {
        const at = barAt(s * SLOT_BARS);
        const hold = SLOT_BARS * BAR_SEC - 0.15;
        for (const note of chords[s].voicing) {
            const voice = unison(note + opts.octave, hold, opts.env, opts.stack, rng, opts.bendCents);
            bus.stereo(voice, at, gain);
        }
    }
}

function choirFinish(raw: Stereo, vowel: Vowel, shift: number): Stereo {
    return eachChannel(raw, (x) => highpass(formant(x, vowel, shift), 110));
}

export function heavenChoir(): Stereo {
    const rng = new Rng(101);
    const bus = new Bus();
    const stack: VoiceStack = { voices: 5, detuneCents: 11, driftCents: 3, vibratoHz: 4.6, vibratoCents: 7, wave: "saw", spread: 0.85 };
    renderChoirChords(bus, HEAVEN_CHORDS, { stack, vowel: "a", formantShift: 1, octave: 0, bendCents: 0, env: { a: 0.8, d: 0.6, s: 0.85, r: 1.5 } }, rng);
    let choir = choirFinish(bus.loop(), "a", 1);
    // Halo: the top voice an octave up, airy and quiet.
    const halo = new Bus();
    for (let s = 0; s < SLOTS; s++) {
        const top = Math.max(...HEAVEN_CHORDS[s].voicing) + 12;
        halo.stereo(unison(top, SLOT_BARS * BAR_SEC - 0.2, { a: 1.2, d: 0.5, s: 0.8, r: 1.6 }, { ...stack, voices: 3, wave: "triangle", detuneCents: 6 }, rng), barAt(s * SLOT_BARS), 0.5 * CHOIR_TRIM);
    }
    choir = eachChannel(choir, (x) => shelf(x, 3500, 6));
    choir = add(choir, eachChannel(halo.loop(), (x) => lowpass(highpass(x, 600), 12000)), 1.6);
    // Breath air: band-passed noise that follows the chord envelope, so the top octave is not empty.
    const env = toMono(choir).l;
    const air = new Stereo(bandpass(noise(N, rng), 8000, 0.7), bandpass(noise(N, rng), 8000, 0.7));
    for (let i = 0; i < N; i++) {
        const e = Math.abs(env[i]);
        air.l[i] *= e;
        air.r[i] *= e;
    }
    const airSmoothed = eachChannel(air, (x) => lowpass(highpass(x, 5000), 14000));
    choir = add(choir, airSmoothed, (0.3 * rms(choir)) / Math.max(1e-9, rms(airSmoothed)));
    choir = duck(choir, softKickTriggerSamples(), 0.15, 0.22);
    return withReverb(choir, HEAVEN_VERB, 0.7);
}

export function corruptChoir(): Stereo {
    const rng = new Rng(202);
    const bus = new Bus();
    const stack: VoiceStack = { voices: 6, detuneCents: 32, driftCents: 18, vibratoHz: 3.1, vibratoCents: 14, wave: "saw", spread: 1 };
    renderChoirChords(bus, HEAVEN_CHORDS, { stack, vowel: "o", formantShift: 0.9, octave: 0, bendCents: -45, env: { a: 0.5, d: 0.6, s: 0.8, r: 1.0 } }, rng);
    // Falling octave-down shadow on the root and fifth.
    for (let s = 0; s < SLOTS; s++) {
        const v = HEAVEN_CHORDS[s].voicing;
        for (const note of [v[0] - 12, v[1] - 12]) {
            bus.stereo(unison(note, SLOT_BARS * BAR_SEC - 0.2, { a: 0.4, d: 0.5, s: 0.8, r: 0.9 }, { ...stack, voices: 4 }, rng, -80), barAt(s * SLOT_BARS), 0.6 * CHOIR_TRIM);
        }
    }
    let choir = choirFinish(bus.loop(), "o", 0.9);
    choir = eachChannel(choir, (x) => lowpass(bitcrush(x, 7, 3, 0.55), 4800));

    // Reversed swells that suck into every 4-bar line: a reversed "ah" of the coming chord plus a reverse cymbal on 8-bar lines.
    const swells = new Bus();
    for (let bar = 0; bar < LOOP_BARS; bar += 4) {
        const chord = HEAVEN_CHORDS[(bar / SLOT_BARS) % SLOTS];
        for (const note of chord.voicing.slice(0, 3)) {
            const v = unison(note, 1.3, { a: 0.005, d: 0.3, s: 0.6, r: 0.6 }, { ...stack, voices: 3, driftCents: 4 }, rng);
            const sung = formant(v.l, "a", 1.05);
            swells.endingAt(reverse(sung), barAt(bar), 0.55 * CHOIR_TRIM, rng.bipolar() * 0.5);
        }
        if (bar % 8 === 0) swells.endingAt(reverseCymbal(BAR_SEC, rng), barAt(bar), 0.25, 0.2);
    }
    choir = add(choir, swells.loop(), 1);
    choir = duck(choir, kickTriggerSamples(), 0.3, 0.2);
    return withReverb(choir, DARK_VERB, 0.65);
}

export function hellChoir(): Stereo {
    const rng = new Rng(303);
    const bus = new Bus();
    const stack: VoiceStack = { voices: 6, detuneCents: 22, driftCents: 8, vibratoHz: 5.6, vibratoCents: 26, wave: "saw", spread: 0.9 };
    renderChoirChords(bus, HELL_CHORDS, { stack, vowel: "o", formantShift: 0.8, octave: -12, bendCents: -25, env: { a: 0.35, d: 0.6, s: 0.8, r: 0.9 } }, rng);
    let choir = choirFinish(bus.loop(), "o", 0.8);

    const organBus = new Bus();
    for (let bar = 0; bar < LOOP_BARS; bar++) {
        const chord = HELL_CHORDS[Math.floor(bar / SLOT_BARS)];
        const upper = chord.voicing.slice(1);
        const stabs: Array<[number, number, number]> = bar % 2 === 0 ? [[0, 0.3, 1], [3, 0.22, 0.75], [6, 0.22, 0.85]] : [[0, 0.3, 0.9], [10, 0.6, 0.7]];
        for (const [step, hold, vel] of stabs) {
            for (const note of upper) organBus.stereo(organ(note, hold, rng), stepAt(bar, step), 0.055 * vel);
        }
        if (bar % SLOT_BARS === 0) organBus.stereo(organ(chord.root + 12, SLOT_BARS * BAR_SEC - 0.1, rng, [1, 0.6, 0.3, 0.1, 0, 0]), barAt(bar), 0.05);
    }
    choir = add(choir, eachChannel(organBus.loop(), (x) => lowpass(x, 3600)), 1);
    choir = duck(choir, kickTriggerSamples(), 0.35, 0.18);
    return withReverb(choir, DARK_VERB, 0.5);
}

// ---------------------------------------------------------------- melodic layers

export function heavenBells(): Stereo {
    const rng = new Rng(404);
    const bus = new Bus();
    for (let s = 0; s < SLOTS; s++) {
        const chord = HEAVEN_CHORDS[s];
        const bar0 = s * SLOT_BARS;
        const phrase = phraseOfBar(bar0);
        MELODY_PLAN[s].forEach((note, i) => {
            const midi = motifMidi(note, chord, false, 65);
            const at = stepAt(bar0, note.step);
            const pan = i % 2 === 0 ? -0.3 : 0.3;
            bus.mono(fmBell(midi, i === 0 ? 1 : 0.8, HEAVEN_BELL), at, 0.9, pan);
            if (phrase === "A2" || phrase === "A3") bus.mono(fmBell(midi + 12, 0.6, { ...HEAVEN_BELL, decay: 1.1 }), at, 0.25, -pan);
            if (phrase === "A2") bus.mono(harp(midi - 12, 0.7, rng), stepAt(bar0, note.step + 2), 0.8, -pan);
        });
        if (phrase === "B") {
            // Rising harp arpeggio through the chord, one note per 8th.
            const tones = chord.voicing.map((m) => m + 12);
            for (let k = 0; k < 16; k++) {
                const midi = tones[k % tones.length] + (k >= tones.length * 2 ? 12 : 0);
                bus.mono(harp(midi, 0.42 + 0.02 * (k % 4), rng, 1.6), stepAt(bar0, k * 2), 0.6, -0.6 + 1.2 * (k / 15));
            }
        }
    }
    // Bar 31: harp glissando up F Lydian, 16th-sextuplets, landing on the loop's downbeat.
    for (let k = 0; k < 24; k++) {
        const midi = degreeToMidi(LYDIAN, k - 7, 65);
        const at = Math.round(barAt(LOOP_BARS - 1) + (k * BAR_SEC * SR) / 24);
        bus.mono(harp(midi, 0.3 + 0.5 * (k / 23), rng, 1.4), at, 0.7, -0.7 + 1.4 * (k / 23));
    }
    let bells = eachChannel(bus.loop(), (x) => shelf(x, 3000, 5));
    bells = withDelay(bells, DOTTED_EIGHTH, 0.35, 0.28, 4500);
    return withReverb(bells, HEAVEN_VERB, 0.55);
}

export function hellBells(): Stereo {
    const rng = new Rng(505);
    const bus = new Bus();
    for (let s = 0; s < SLOTS; s++) {
        const chord = HELL_CHORDS[s];
        const bar0 = s * SLOT_BARS;
        MELODY_PLAN[s].forEach((note, i) => {
            const midi = motifMidi(note, chord, true, 53);
            const at = stepAt(bar0, note.step);
            bus.mono(fmBell(midi, i === 0 ? 1 : 0.85, HELL_BELL), at, 0.9, i % 2 === 0 ? 0.25 : -0.25);
            if (i === 0) {
                // The same note reversed, swelling into the downbeat.
                const rev = reverse(fmBell(midi + 12, 0.8, { ...HELL_BELL, decay: 0.7 }));
                bus.endingAt(rev, at, 0.5, -0.4);
            }
            if (i === 0 && (s === 0 || s === 8)) bus.mono(fmBell(midi + 1, 0.4, HELL_BELL), at, 0.45, 0.6);
        });
    }
    let bells = bus.loop();
    bells = eachChannel(bells, (x) => shelf(highpass(x, 120), 2500, 4));
    bells = withDelay(bells, DOTTED_EIGHTH, 0.42, 0.3, 2200);
    return withReverb(bells, DARK_VERB, 0.5);
}

export function ghostLine(): Stereo {
    const rng = new Rng(606);
    const bus = new Bus();
    for (let s = 0; s < SLOTS; s++) {
        const bar0 = s * SLOT_BARS;
        const lift = phraseOfBar(bar0) === "A3" ? 12 : 0;
        for (const [step, midi, len] of GHOST_PLAN[s]) {
            bus.mono(ghostFlute(midi + lift, len * STEP * 0.92, 0.85, rng), stepAt(bar0, step), 1, -0.15);
        }
    }
    let ghost = bus.loop();
    ghost = withDelay(ghost, DOTTED_EIGHTH, 0.42, 0.4, 2500);
    return withReverb(ghost, DARK_VERB, 0.6);
}

export function hellBrass(): Stereo {
    const rng = new Rng(707);
    const bus = new Bus();
    for (let bar = 0; bar < LOOP_BARS; bar++) {
        const chord = HELL_CHORDS[Math.floor(bar / SLOT_BARS)];
        const pattern: Array<[number, number, number]> = bar % 2 === 0
            ? [[0, 0.32, 1], [3, 0.2, 0.7], [6, 0.26, 0.85], [10, 0.2, 0.65]]
            : [[0, 0.32, 0.95], [3, 0.2, 0.7], [8, 0.5, 0.8]];
        for (const [step, hold, vel] of pattern) {
            for (const note of [chord.root + 12, chord.root + 19, chord.root + 24]) {
                bus.stereo(brass(note, hold, vel, rng), stepAt(bar, step), 0.5);
            }
        }
    }
    // Horror lead: the cell, high and thin, through the B phrase and the last A.
    for (let s = SLOTS / 2; s < SLOTS; s++) {
        const chord = HELL_CHORDS[s];
        const bar0 = s * SLOT_BARS;
        for (const note of MELODY_PLAN[s]) {
            const midi = motifMidi(note, chord, true, 77);
            const lead = horrorLead(midi, note.len * STEP * 0.85, 0.75, rng);
            bus.stereo(lead, stepAt(bar0, note.step), 0.8);
        }
    }
    let out = bus.loop();
    out = eachChannel(out, (x) => softClip(bitcrush(x, 9, 2, 0.35), 0.9));
    out = duck(out, kickTriggerSamples(), 0.3, 0.15);
    return withReverb(out, DARK_VERB, 0.3);
}

// ---------------------------------------------------------------- 808s

/** The 808 stems render exactly the notes the runtime hit map reports. */
function bassLine(id: Bass808Id): BassNote[] {
    return bass808Notes(id).map((n) => ({
        at: stepAt(n.bar, n.step),
        hold: n.hold,
        midi: n.midi,
        vel: n.vel,
        ...(n.slideFrom !== undefined ? { slideFrom: n.slideFrom, slideSec: n.slideSec } : {}),
    }));
}

/**
 * Rendered linearly, then folded. A silent note at the loop end cuts the last
 * note exactly where bar 0's note takes over, so mono legato survives the wrap.
 */
function render808Loop(notes: BassNote[], style: BassStyle): Stereo {
    const cut: BassNote = { at: N, hold: 0.01, midi: notes[0].midi, vel: 0 };
    const mono = render808(N + Math.round(SR * 1.5), [...notes, cut], style);
    const folded = foldTail(mono, N);
    return new Stereo(folded, folded.slice());
}

/** Parallel distortion band so the 808 line reads on small speakers; `amount` is relative to the clean 808's RMS. */
function withGritBand(s: Stereo, drive: number, centerHz: number, amount: number): Stereo {
    const band = eachChannel(s, (x) => highpass(bandpass(grit(x, drive), centerHz, 0.6), 180));
    return add(s, band, (amount * rms(s)) / Math.max(1e-9, rms(band)));
}

export function heaven808(): Stereo {
    const notes = bassLine("heaven808");
    const style: BassStyle = { decay: 0.3, drive: 1.1, harmonic: 0.18, tone: 900, punch: 2 };
    return duck(render808Loop(notes, style), softKickTriggerSamples(), 0.5, 0.05);
}

export function grit808(): Stereo {
    const notes = bassLine("grit808");
    const style: BassStyle = { decay: 0.55, drive: 3.2, harmonic: 0.35, tone: 4500, punch: 5 };
    return duck(withGritBand(render808Loop(notes, style), 9, 1400, 0.22), kickTriggerSamples(), 0.45, 0.05);
}

export function hell808(): Stereo {
    const notes = bassLine("hell808");
    const style: BassStyle = { decay: 0.75, drive: 5.5, harmonic: 0.5, tone: 5000, punch: 7 };
    const loop = withGritBand(render808Loop(notes, style), 14, 1800, 0.3);
    const crushed = new Stereo(lowpass(bitcrush(loop.l, 10, 1, 0.3), 6500), lowpass(bitcrush(loop.r, 10, 1, 0.3), 6500));
    return duck(crushed, kickTriggerSamples(), 0.45, 0.05);
}

// ---------------------------------------------------------------- drums

export function drumsSoft(): Stereo {
    const rng = new Rng(808);
    const bus = new Bus();
    const snapBus = new Bus();
    for (let bar = 0; bar < LOOP_BARS; bar++) {
        for (const step of softKickSteps(bar)) bus.mono(kickSoft(step === 0 ? 1 : 0.8), stepAt(bar, step));
        snapBus.mono(snap(0.95, rng), stepAt(bar, SNARE_STEP));
        for (let step = 0; step < 16; step += 2) bus.mono(hat(step % 4 === 0 ? 0.3 : 0.22, 0.025, rng), swung(bar, step), 0.8);
        if (bar % 2 === 1) bus.mono(rim(0.4, rng), swung(bar, 13), 0.6);
        if (bar % 8 === 7) for (const step of [12, 13, 14, 15]) snapBus.mono(snap(0.35 + 0.12 * (step - 12), rng), swung(bar, step), 0.8);
    }
    const snaps = withReverb(snapBus.loop(), ROOM_VERB, 0.9);
    return toMono(add(bus.loop(), snaps, 1));
}

export function drumsHard(): Stereo {
    const rng = new Rng(909);
    const bus = new Bus();
    for (let bar = 0; bar < LOOP_BARS; bar++) {
        for (const step of kickSteps(bar)) bus.mono(kickHard(step === 0 ? 1 : 0.88, rng), stepAt(bar, step));
        bus.mono(clap(1, rng), stepAt(bar, SNARE_STEP), 0.8);
        bus.mono(snare(0.9, rng), stepAt(bar, SNARE_STEP), 0.6);
        if (bar % 2 === 1) bus.mono(snare(0.3, rng), swung(bar, 15), 0.5);
        if (bar % 8 === 7) {
            // Snare roll into the next phrase: 32nds then 64ths, rising.
            for (let k = 0; k < 8; k++) bus.mono(snare(0.25 + 0.06 * k, rng), Math.round(stepAt(bar, 12) + (k * STEP * SR) / 2), 0.55);
            for (let k = 0; k < 8; k++) bus.mono(snare(0.5 + 0.06 * k, rng), Math.round(stepAt(bar, 14) + (k * STEP * SR) / 4), 0.6);
        }
    }
    const drums = withReverb(bus.loop(), ROOM_VERB, 0.25);
    return toMono(eachChannel(drums, (x) => softClip(saturate(x, 1.4), 0.95)));
}

type Roll = "none" | "triplet" | "thirtySecond" | "sextuplet" | "tripletBeat";
const ROLLS: Roll[] = ["triplet", "thirtySecond", "sextuplet", "none", "tripletBeat", "thirtySecond", "triplet", "sextuplet"];

export function hatsRoll(): Stereo {
    const rng = new Rng(1010);
    const bus = new Bus();
    for (let bar = 0; bar < LOOP_BARS; bar++) {
        const phrase = phraseOfBar(bar);
        const busy = phrase === "B" || phrase === "A3";
        const roll = ROLLS[(bar * 5 + 3) % ROLLS.length];
        const skip = new Set<number>();
        const rollAt = (fromStep: number, count: number, spanSteps: number, v0: number, v1: number, tone0: number, tone1: number): void => {
            for (let k = 0; k < count; k++) {
                const f = count > 1 ? k / (count - 1) : 0;
                const at = Math.round(stepAt(bar, fromStep) + (k * spanSteps * STEP * SR) / count);
                bus.mono(hat(v0 + (v1 - v0) * f, 0.018, rng, tone0 + (tone1 - tone0) * f), at, 0.9, -0.5 + f);
            }
            for (let s = fromStep; s < fromStep + spanSteps; s++) skip.add(s);
        };
        switch (roll) {
            case "triplet":
                rollAt(6, 3, 2, 0.5, 0.75, 1, 1);
                break;
            case "thirtySecond":
                rollAt(14, 4, 2, 0.35, 0.8, 1, 1.05);
                break;
            case "sextuplet":
                rollAt(12, 6, 2, 0.3, 0.85, 0.92, 1.2);
                break;
            case "tripletBeat":
                rollAt(12, 3, 4, 0.7, 0.55, 1, 0.95);
                break;
            default:
                break;
        }
        for (let step = 0; step < 16; step++) {
            if (skip.has(step)) continue;
            const on8th = step % 2 === 0;
            if (!on8th && !busy) continue;
            const vel = step % 4 === 0 ? 0.75 : on8th ? 0.55 : 0.35;
            bus.mono(hat(vel, 0.022, rng), swung(bar, step), 0.9, on8th ? 0.15 : -0.15);
        }
        if (bar % 4 === 1 || bar % 4 === 3) bus.mono(hat(0.55, 0.16, rng, 0.85), swung(bar, 14), 0.7, 0.35);
        bus.mono(rim(0.6, rng), swung(bar, bar % 2 === 0 ? 7 : 13), 0.7, bar % 2 === 0 ? -0.5 : 0.5);
        if (busy) for (let step = 1; step < 16; step += 2) bus.mono(shaker(0.25, rng), swung(bar, step), 0.6, 0.45);
    }
    return withReverb(bus.loop(), ROOM_VERB, 0.15);
}

export const STEM_RENDERERS: Record<StemId, () => Stereo> = {
    heavenChoir,
    heavenBells,
    heaven808,
    corruptChoir,
    grit808,
    drumsSoft,
    hatsRoll,
    ghostLine,
    drumsHard,
    hellBells,
    hellChoir,
    hell808,
    hellBrass,
};
