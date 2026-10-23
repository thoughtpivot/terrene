/**
 * The three 808 lines as data. The offline renderer builds the 808 stems from
 * `bass808Notes`, so the hit map and the runtime beat callbacks are derived
 * from exactly the notes that are in the audio, with no audio analysis.
 */
import { gainsFor } from "./mixer";
import { BAR_SEC, BEATS_PER_BAR, LOOP_BARS, LOOP_SEC, STEPS_PER_BAR, STEP_SEC, StemId, TIERS, Tier } from "./musicSpec";

export type Bass808Id = Extract<StemId, "heaven808" | "grit808" | "hell808">;
export const BASS_808_IDS: readonly Bass808Id[] = ["heaven808", "grit808", "hell808"];

/** "slide" glides up into the note, "dive" falls onto it. */
export type Glide = "none" | "slide" | "dive";

export interface Bass808Note {
    bar: number;
    /** 16th step within the bar (0..15). */
    step: number;
    /** Beats from the loop start (quarter notes; 128 per loop). */
    beat: number;
    /** Seconds from the loop start (not the file start: the file has a 1 s pad before it). */
    sec: number;
    /** Seconds until the next note in the line, minus a short gap. */
    hold: number;
    midi: number;
    /** Note velocity as rendered (0..1). */
    vel: number;
    slideFrom?: number;
    slideSec?: number;
    glide: Glide;
}

const SLOT_BARS = 2;

function phrasePlan<T>(a: T[], b: T[]): T[] {
    return [...a, ...a, ...b, ...a];
}

/** Chord roots per 2-bar slot (MIDI, F1 = 29); must match the chord tables in tools/heaven-or-hell/music/score.ts. */
export const HEAVEN_BASS_ROOTS: readonly number[] = phrasePlan([29, 29, 26, 28], [33, 29, 28, 24]);
export const HELL_BASS_ROOTS: readonly number[] = phrasePlan([29, 29, 25, 24], [32, 29, 28, 24]);

/** Kick steps per bar, half-time trap: kick on 1, syncopations around the beat-3 snare. */
export function kickSteps(bar: number): number[] {
    switch (bar % 4) {
        case 0:
            return [0, 10];
        case 1:
            return [0, 6, 10];
        case 2:
            return [0, 10, 14];
        default:
            return bar % 8 === 7 ? [0, 3, 10] : [0, 3, 11];
    }
}

/** The heaven kit is sparser: just the downbeat and the pickup. */
export function softKickSteps(bar: number): number[] {
    return bar % 2 === 0 ? [0, 10] : [0, 11];
}

function bassMidi(root: number): number {
    return root < 28 ? root + 12 : root;
}

interface Extra {
    midi?: number;
    slideFrom?: number;
    slideSec?: number;
}
type Decorate = (bar: number, step: number, root: number, idx: number) => Extra;

/**
 * One 808 note per kick step, on the chord root. With `autoSlide`, a note whose
 * pitch differs from the previous one glides from it (wrapping across the loop).
 */
function bassLine(roots: readonly number[], stepsFor: (bar: number) => number[], decorate: Decorate, autoSlide: boolean): Bass808Note[] {
    const notes: Bass808Note[] = [];
    for (let bar = 0; bar < LOOP_BARS; bar++) {
        const root = bassMidi(roots[Math.floor(bar / SLOT_BARS)]);
        const steps = stepsFor(bar);
        steps.forEach((step, idx) => {
            const nextStep = idx + 1 < steps.length ? steps[idx + 1] : STEPS_PER_BAR;
            const extra = decorate(bar, step, root, idx);
            const at = bar * STEPS_PER_BAR + step;
            notes.push({
                bar,
                step,
                beat: (at * BEATS_PER_BAR) / STEPS_PER_BAR,
                sec: at * STEP_SEC,
                hold: (nextStep - step) * STEP_SEC - 0.03,
                midi: extra.midi ?? root,
                vel: idx === 0 ? 1 : 0.85,
                ...(extra.slideFrom !== undefined ? { slideFrom: extra.slideFrom, slideSec: extra.slideSec } : {}),
                glide: "none",
            });
        });
    }
    if (autoSlide) {
        notes.forEach((note, i) => {
            const prev = notes[(i - 1 + notes.length) % notes.length];
            if (note.slideFrom === undefined && prev.midi !== note.midi) {
                note.slideFrom = prev.midi;
                note.slideSec = 0.11;
            }
        });
    }
    for (const note of notes) {
        if (note.slideFrom !== undefined) note.glide = note.slideFrom > note.midi ? "dive" : "slide";
    }
    return notes;
}

function line(id: Bass808Id): Bass808Note[] {
    switch (id) {
        case "heaven808":
            return bassLine(HEAVEN_BASS_ROOTS, softKickSteps, () => ({}), false);
        case "grit808":
            return bassLine(
                HEAVEN_BASS_ROOTS,
                kickSteps,
                (bar, step, root) => (step === 14 || (bar % 4 === 3 && step === 11) ? { midi: root + 12, slideFrom: root, slideSec: 0.07 } : {}),
                true,
            );
        case "hell808":
            return bassLine(
                HELL_BASS_ROOTS,
                (bar) => (bar % 2 === 1 ? [...kickSteps(bar), 7].sort((a, b) => a - b) : kickSteps(bar)),
                (bar, step, root, idx) => {
                    const slot = Math.floor(bar / SLOT_BARS) % 4;
                    // Phrygian b2 slide: F creeps up to Gb under the Gb/F chord.
                    if (slot === 1 && bar % 2 === 1 && step >= 10) return { midi: root + 1, slideFrom: root, slideSec: 0.16 };
                    // 808 dive: start an octave up and fall onto the root.
                    if (idx === 0 && bar % 4 === 2) return { midi: root, slideFrom: root + 12, slideSec: 0.14 };
                    if (step === 14) return { midi: root + 12, slideFrom: root, slideSec: 0.06 };
                    if (step === 7) return { midi: root + 7 };
                    return {};
                },
                true,
            );
    }
}

const CACHE = new Map<Bass808Id, readonly Bass808Note[]>();

/** Every note of an 808 stem within the 32-bar loop, in time order. */
export function bass808Notes(id: Bass808Id): readonly Bass808Note[] {
    let notes = CACHE.get(id);
    if (!notes) {
        notes = line(id);
        CACHE.set(id, notes);
    }
    return notes;
}

/** One audible 808 hit at a tier, merged across stems that land on the same 16th. */
export interface Tier808Hit {
    bar: number;
    step: number;
    beat: number;
    sec: number;
    /** `hitVelocity` of the strongest stem on this 16th (0..1). */
    velocity: number;
    slide: boolean;
    glide: Glide;
    /** The loudest 808 stem on this hit. */
    stem: Bass808Id;
}

/** A stem at or above this gain counts as a full-strength 808 for hit velocity. */
export const FULL_808_GAIN = 0.5;
/** Below this gain an 808 stem is treated as inaudible and reports no hits. */
export const AUDIBLE_808_GAIN = 0.05;

/** Hit velocity (0..1) of a note on a stem playing at `gain`. */
export function hitVelocity(noteVel: number, gain: number): number {
    if (gain < AUDIBLE_808_GAIN) return 0;
    return Math.min(1, noteVel * Math.min(1, gain / FULL_808_GAIN));
}

/** Merge per-stem notes, weighted by stem gains, into one hit list (inaudible stems are ignored). */
export function mergeHits(gains: Readonly<Record<Bass808Id, number>>): Tier808Hit[] {
    const byStep = new Map<number, Tier808Hit>();
    for (const id of BASS_808_IDS) {
        const g = gains[id];
        if (g < AUDIBLE_808_GAIN) continue;
        for (const n of bass808Notes(id)) {
            const key = n.bar * STEPS_PER_BAR + n.step;
            const velocity = hitVelocity(n.vel, g);
            const prev = byStep.get(key);
            if (!prev || velocity > prev.velocity) {
                byStep.set(key, {
                    bar: n.bar,
                    step: n.step,
                    beat: n.beat,
                    sec: n.sec,
                    velocity,
                    slide: n.glide !== "none" || (prev?.slide ?? false),
                    glide: n.glide !== "none" ? n.glide : prev?.glide ?? "none",
                    stem: id,
                });
            } else if (n.glide !== "none") {
                prev.slide = true;
                if (prev.glide === "none") prev.glide = n.glide;
            }
        }
    }
    return [...byStep.values()].sort((a, b) => a.sec - b.sec);
}

export interface HitMap808 {
    bpm: number;
    loopBars: number;
    loopSec: number;
    barSec: number;
    /** Loop position 0 is this many seconds into each MP3 file. */
    filePadSec: number;
    stems: Record<Bass808Id, readonly Bass808Note[]>;
    tiers: Array<{ tier: Tier; stemGains: Record<Bass808Id, number>; hits: Tier808Hit[] }>;
}

/** The full 808 hit map: per-stem notes and the steady-state audible hits at every tier. */
export function hitMap808(filePadSec: number, bpm: number): HitMap808 {
    const stems = {} as Record<Bass808Id, readonly Bass808Note[]>;
    for (const id of BASS_808_IDS) stems[id] = bass808Notes(id);
    return {
        bpm,
        loopBars: LOOP_BARS,
        loopSec: LOOP_SEC,
        barSec: BAR_SEC,
        filePadSec,
        stems,
        tiers: TIERS.map((tier) => {
            const g = gainsFor(tier, tier);
            const stemGains = { heaven808: g.heaven808, grit808: g.grit808, hell808: g.hell808 };
            return { tier, stemGains, hits: mergeHits(stemGains) };
        }),
    };
}

/** Index of the first note at or after `loopSec` (wraps to 0 past the last note). */
export function nextNoteIndex(notes: readonly { sec: number }[], loopSec: number): number {
    let lo = 0;
    let hi = notes.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (notes[mid].sec < loopSec - 1e-9) lo = mid + 1;
        else hi = mid;
    }
    return lo % notes.length;
}
