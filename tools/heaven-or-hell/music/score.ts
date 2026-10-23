/**
 * The composition, as data. One 32-bar loop at 150 BPM (half-time feel) in F.
 *
 *   Phrases:  A (bars 0-7)  A2 (8-15)  B (16-23)  A3 (24-31)
 *   Slots:    2 bars per chord, 4 chords per phrase, 16 slots per loop.
 *
 * Heaven harmonises in F Lydian. Hell re-harmonises the same slots in
 * F Phrygian, borrowing F harmonic minor (Phrygian dominant on C) for the
 * cadences. Each hell chord is the heaven chord "pulled down": G/F becomes
 * Gb/F, Dm9 becomes Dbmaj7, Cmaj7 becomes C7b9.
 *
 * The motif ("the cell") is six notes, C A B G E F in heaven. Its B natural,
 * Lydian's bright raised fourth, is the same note as the tritone above F, the
 * old "devil in music". In hell the cell keeps its contour and its B natural
 * while every other note falls into Phrygian: C Ab B Gb Eb F, an octave down.
 */

import { kickSteps, softKickSteps } from "../../../src/components/scenes/HeavenOrHell/audio/bass808";
import { BAR_SEC, LOOP_BARS, SAMPLE_RATE, STEPS_PER_BAR, STEP_SEC } from "../../../src/components/scenes/HeavenOrHell/audio/musicSpec";

export const SLOT_BARS = 2;
export const SLOTS = LOOP_BARS / SLOT_BARS;
export const SLOT_STEPS = SLOT_BARS * STEPS_PER_BAR;

/** Sample index of a 16th-note step from the loop start (a 16th is exactly 4410 samples at 150 BPM). */
export function stepAt(bar: number, step: number, offsetSec = 0): number {
    return Math.round(((bar * STEPS_PER_BAR + step) * STEP_SEC + offsetSec) * SAMPLE_RATE);
}

export function barAt(bar: number): number {
    return Math.round(bar * BAR_SEC * SAMPLE_RATE);
}

export const STEP = STEP_SEC;

// Scales as semitone offsets from F.
export const LYDIAN = [0, 2, 4, 6, 7, 9, 11];
export const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
export const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11];

export const F4 = 65;
export const F3 = 53;

/** Map a scale step (0 = F, 7 = F an octave up, negative allowed) to MIDI. */
export function degreeToMidi(scale: readonly number[], step: number, base = F4): number {
    const oct = Math.floor(step / 7);
    const idx = ((step % 7) + 7) % 7;
    return base + 12 * oct + scale[idx];
}

export interface Chord {
    name: string;
    root: number;
    /** Pad voicing in MIDI. */
    voicing: number[];
    /** Scale the melody maps through over this chord. */
    scale: readonly number[];
}

const H = (name: string, root: number, voicing: number[]): Chord => ({ name, root, voicing, scale: LYDIAN });
const P = (name: string, root: number, voicing: number[], scale: readonly number[] = PHRYGIAN): Chord => ({ name, root, voicing, scale });

// Bass roots are in octave 1-2 (F1 = 29). Pads sit around F3-B4.
const HEAVEN_A: Chord[] = [
    H("Fmaj9(#11)", 29, [53, 60, 64, 67, 71]),
    H("G/F", 29, [53, 62, 67, 71, 74]),
    H("Dm9", 26, [50, 57, 60, 64, 65]),
    H("Cmaj7/E", 28, [52, 60, 64, 67, 71]),
];
const HEAVEN_B: Chord[] = [
    H("Am7", 33, [57, 60, 64, 67, 72]),
    H("Fmaj7", 29, [53, 57, 60, 64, 69]),
    H("Em7", 28, [52, 59, 62, 67, 71]),
    H("Cadd9", 24, [48, 55, 60, 62, 64, 67]),
];
const HELL_A: Chord[] = [
    P("Fm7(b9)", 29, [53, 56, 60, 63, 66]),
    P("Gb/F", 29, [53, 58, 61, 66, 70]),
    P("Dbmaj7", 25, [49, 56, 60, 65, 68]),
    P("C7(b9)", 24, [48, 52, 58, 61, 67], HARMONIC_MINOR),
];
const HELL_B: Chord[] = [
    P("Fm/Ab", 32, [44, 53, 56, 60, 65]),
    P("Fm7", 29, [53, 56, 60, 63, 68]),
    P("Edim7", 28, [52, 55, 58, 61, 64], HARMONIC_MINOR),
    P("C7(b9)", 24, [48, 52, 58, 61, 67], HARMONIC_MINOR),
];

function phrasePlan<T>(a: T[], b: T[]): T[] {
    return [...a, ...a, ...b, ...a];
}

export const HEAVEN_CHORDS: Chord[] = phrasePlan(HEAVEN_A, HEAVEN_B);
export const HELL_CHORDS: Chord[] = phrasePlan(HELL_A, HELL_B);

export function phraseOfBar(bar: number): "A" | "A2" | "B" | "A3" {
    return (["A", "A2", "B", "A3"] as const)[Math.floor(bar / 8) % 4];
}

// ---------------------------------------------------------------- the motif

export interface MotifNote {
    /** 16th-step onset within the 2-bar slot. */
    step: number;
    /** Length in 16th steps. */
    len: number;
    /** Scale step relative to F4 (0 = F4). */
    degree: number;
}

const CELL_STEPS = [0, 6, 10, 16, 20, 24];
const CELL_LENS = [6, 4, 6, 4, 4, 8];
/** C A B G E F in F Lydian. */
export const CELL_DEGREES = [4, 2, 3, 1, -1, 0];

export function cell(transpose = 0): MotifNote[] {
    return CELL_DEGREES.map((d, i) => ({ step: CELL_STEPS[i], len: CELL_LENS[i], degree: d + transpose }));
}

/** Inversion around A4 (degree 2): the falling cell becomes a rising prayer. */
export function inversion(transpose = 0): MotifNote[] {
    return CELL_DEGREES.map((d, i) => ({ step: CELL_STEPS[i], len: CELL_LENS[i], degree: 4 - d + transpose }));
}

/** Retrograde: the cell played backwards in pitch, keeping its rhythm. */
export function retrograde(transpose = 0): MotifNote[] {
    const rev = [...CELL_DEGREES].reverse();
    return rev.map((d, i) => ({ step: CELL_STEPS[i], len: CELL_LENS[i], degree: d + transpose }));
}

/** The melodic statement for each of the 16 slots (shared by heaven and hell; only the scale mapping differs). */
export const MELODY_PLAN: MotifNote[][] = (() => {
    const a = [cell(0), cell(2), cell(-1), cell(-2).slice(0, 4).concat([{ step: 20, len: 12, degree: -3 }])];
    const b = [inversion(0), inversion(2), inversion(1), retrograde(0)];
    const a3 = [cell(7), cell(2), cell(-1), cell(-2).slice(0, 4).concat([{ step: 20, len: 12, degree: -3 }])];
    return [...a, ...a, ...b, ...a3];
})();

export const TRITONE_CHORD = "Fm7(b9)";

/**
 * Pitch for a motif degree over a chord. Over the hell tonic, the cell's
 * fourth degree keeps its heaven B natural (the tritone) instead of falling to
 * Bb: that note is the thread that ties the two versions of the song together.
 */
export function motifMidi(note: MotifNote, chord: Chord, hell: boolean, base: number): number {
    const midi = degreeToMidi(chord.scale, note.degree, base);
    if (hell && chord.name === TRITONE_CHORD && ((note.degree % 7) + 7) % 7 === 3) return midi + 1;
    return midi;
}

/**
 * The ghost line uses only tones that both harmonies share at each slot
 * (plus the tritone B over F), so it can keep playing across the switch-up.
 * Entries: [step in slot, MIDI, length in steps].
 */
const GHOST_A: Array<Array<[number, number, number]>> = [
    [[0, 53, 6], [8, 59, 4], [12, 60, 10], [24, 59, 2], [26, 53, 6]],
    [[0, 60, 8], [12, 53, 16]],
    [[0, 65, 6], [8, 60, 8], [20, 53, 12]],
    [[0, 64, 6], [8, 55, 4], [12, 60, 8], [24, 52, 4], [28, 55, 4]],
];
const GHOST_B: Array<Array<[number, number, number]>> = [
    [[0, 60, 10], [12, 48, 4], [16, 60, 14]],
    [[0, 53, 6], [8, 60, 6], [16, 65, 8], [26, 60, 6]],
    [[0, 64, 6], [8, 55, 6], [16, 52, 12]],
    [[0, 55, 6], [8, 60, 6], [16, 64, 14]],
];
export const GHOST_PLAN = phrasePlan(GHOST_A, GHOST_B);

// ---------------------------------------------------------------- rhythm

export { kickSteps, softKickSteps } from "../../../src/components/scenes/HeavenOrHell/audio/bass808";

export const SNARE_STEP = 8;

/** Every sample position (within the loop) where the hard kick lands; used as the sidechain key. */
export function kickTriggerSamples(): number[] {
    const out: number[] = [];
    for (let bar = 0; bar < LOOP_BARS; bar++) for (const s of kickSteps(bar)) out.push(stepAt(bar, s));
    return out;
}

export function softKickTriggerSamples(): number[] {
    const out: number[] = [];
    for (let bar = 0; bar < LOOP_BARS; bar++) for (const s of softKickSteps(bar)) out.push(stepAt(bar, s));
    return out;
}
