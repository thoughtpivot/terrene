import SapMusic from "./SapWorld.mp3";
import AttachSfx from "./sfx/attach.mp3";
import DetachSfx from "./sfx/detach.mp3";
import GrabSfx from "./sfx/grab.mp3";
import LaunchSfx from "./sfx/launch.mp3";
import SignpostSfx from "./sfx/signpost.mp3";
import SnapSfx from "./sfx/snap.mp3";
import StrainSfx from "./sfx/strain.mp3";
import SuckSfx from "./sfx/suck.mp3";
import WakeSfx from "./sfx/wake.mp3";
import WinSfx from "./sfx/win.mp3";

export type SapSfx =
    | "grab"
    | "attach"
    | "detach"
    | "wake"
    | "strain"
    | "snap"
    | "launch"
    | "signpost"
    | "suck"
    | "win";

export const SAP_BPM = 106;
export const SAP_BEAT = 60 / SAP_BPM;         // 0.5660377s per quarter-note beat
export const SAP_EIGHTH = SAP_BEAT / 2;       // 0.2830189s per 8th note
export const SAP_SIXTEENTH = SAP_BEAT / 4;    // 0.1415094s per 16th note
export const SAP_SWING_SEC = 0.016;           // 16ms minimal-tech swing on odd 16th notes
export const SAP_LOOP_BARS = 64;
export const SAP_LOOP_LENGTH = SAP_LOOP_BARS * 4 * SAP_BEAT;

/**
 * Exact frequency ratios for the C natural minor / Dorian / Aeolian scale relative to C,
 * so any pitch-shifted SFX stays strictly in the key of C minor.
 */
export const C_MINOR_RATIOS: readonly number[] = [
    1.0,                  // 0: C
    Math.pow(2, 2 / 12),  // 1: D
    Math.pow(2, 3 / 12),  // 2: Eb
    Math.pow(2, 5 / 12),  // 3: F
    Math.pow(2, 7 / 12),  // 4: G
    Math.pow(2, 8 / 12),  // 5: Ab
    Math.pow(2, 10 / 12), // 6: Bb
    2.0,                  // 7: C (+1 octave)
];

/**
 * Chord-aware scale degrees in C minor for each 2-bar chord in the 8-bar progression:
 *   Bars 0-1: Cm9      -> C(0), Eb(2), G(4), Bb(6), D(1), C+8ve(7)
 *   Bars 2-3: Abmaj9   -> Ab(5), C(0), Eb(2), G(4), Bb(6), C+8ve(7)
 *   Bars 4-5: Fm9      -> F(3), Ab(5), C(0), Eb(2), G(4), C+8ve(7)
 *   Bars 6-7: Gm7(b13) -> G(4), Bb(6), D(1), F(3), Eb(2), G(4)
 */
const CHORD_DEGREES_BY_PAIR: readonly (readonly number[])[] = [
    [0, 2, 4, 6, 1, 7],
    [5, 0, 2, 4, 6, 7],
    [3, 5, 0, 2, 4, 7],
    [4, 6, 1, 3, 2, 4],
];

/** MIDI notes in C minor across octaves 3..6 for real-time harmonic accents. */
export const C_MINOR_MIDI: readonly number[] = [
    48, 50, 51, 53, 55, 56, 58, // C3..Bb3
    60, 62, 63, 65, 67, 68, 70, // C4..Bb4
    72, 74, 75, 77, 79, 80, 82, // C5..Bb5
    84,                         // C6
];

const SFX_URLS: Record<SapSfx, string> = {
    grab: GrabSfx,
    attach: AttachSfx,
    detach: DetachSfx,
    wake: WakeSfx,
    strain: StrainSfx,
    snap: SnapSfx,
    launch: LaunchSfx,
    signpost: SignpostSfx,
    suck: SuckSfx,
    win: WinSfx,
};

const SFX_LEVEL: Record<SapSfx, number> = {
    grab: 0.48,
    attach: 0.62,
    detach: 0.48,
    wake: 0.66,
    strain: 0.44,
    snap: 0.68,
    launch: 0.54,
    signpost: 0.58,
    suck: 0.70,
    win: 0.85,
};

/**
 * Rhythmic quantization subdivision for each SFX so every sound locks to the 106 BPM grid:
 * - "16th": snaps to the nearest swung 16th-note grid line (max ~65ms lookahead)
 * - "8th":  snaps to the nearest 8th-note grid line (for grove wake / pipe suction melody)
 * - "beat": snaps to the next quarter-note kick/beat (for win fanfare)
 */
const SFX_GRID: Record<SapSfx, "16th" | "8th" | "beat"> = {
    grab: "16th",
    attach: "16th",
    detach: "16th",
    wake: "8th",
    strain: "16th",
    snap: "16th",
    launch: "16th",
    signpost: "8th",
    suck: "16th",
    win: "beat",
};

interface MusicVoice {
    source: AudioBufferSourceNode;
    gain: GainNode;
    /** WebAudio timestamp corresponding to Bar 0 Beat 0 of the 106 BPM loop. */
    loopEpochAt: number;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let voice: MusicVoice | null = null;
let wantMusic = false;
let scaleStep = 0;
let lastQuantizedSlotTime = 0;
const buffers = new Map<string, AudioBuffer>();
const pending = new Map<string, Promise<AudioBuffer | null>>();

function context(): AudioContext | null {
    if (ctx) return ctx;
    const Ctor = typeof AudioContext !== "undefined"
        ? AudioContext
        : (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    return ctx;
}

function loadBuffer(url: string): Promise<AudioBuffer | null> {
    const ac = context();
    if (!ac) return Promise.resolve(null);
    const cached = buffers.get(url);
    if (cached) return Promise.resolve(cached);
    const inflight = pending.get(url);
    if (inflight) return inflight;
    const job = fetch(url)
        .then((res) => res.arrayBuffer())
        .then((data) => new Promise<AudioBuffer>((resolve, reject) => {
            ac.decodeAudioData(data, resolve, reject);
        }))
        .then((decoded) => {
            buffers.set(url, decoded);
            return decoded;
        })
        .catch((error) => {
            console.error("❌ SapWorld audio failed to load", url, error);
            return null;
        });
    pending.set(url, job);
    return job;
}

/** Preload the 106 BPM C-minor score and all 10 C-minor sound effects. */
export function preloadSapAudio(): Promise<void> {
    const urls = [SapMusic, ...Object.values(SFX_URLS)];
    return Promise.all(urls.map(loadBuffer)).then(() => undefined);
}

/** Resume the WebAudio context on user gesture and start the C-minor techno score. */
export function unlockSapAudio(): void {
    const ac = context();
    if (!ac) return;
    if (ac.state === "suspended") {
        void ac.resume().then(() => {
            if (wantMusic) beginMusic();
        }).catch((error) => console.error("❌ SapWorld audio resume failed", error));
    } else if (wantMusic) {
        beginMusic();
    }
}

export function startSapMusic(): void {
    wantMusic = true;
    const ac = context();
    if (!ac) return;
    if (ac.state === "running") beginMusic();
}

function beginMusic(): void {
    const ac = context();
    if (!ac || !master || voice || ac.state !== "running") return;
    const buffer = buffers.get(SapMusic);
    if (!buffer) {
        void loadBuffer(SapMusic).then(() => {
            if (wantMusic) beginMusic();
        });
        return;
    }
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    // Start at 0.0 and loop the exact 64-bar 106 BPM cycle so `ac.currentTime - loopEpochAt`
    // is always phase-locked to Bar 0 Beat 0 of the score, even across loop wraps.
    source.loopStart = 0.0;
    source.loopEnd = Math.min(buffer.duration, SAP_LOOP_LENGTH);
    const gain = ac.createGain();
    source.connect(gain);
    gain.connect(master);
    const now = ac.currentTime + 0.02;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.62, now + 4 * SAP_BEAT);
    source.start(now, 0);
    voice = { source, gain, loopEpochAt: now };
    lastQuantizedSlotTime = now;
    console.log("🏰 Forest Last Sap World music started: Last Sap of the Heartwood (C minor, 106 BPM, beat-synced)");
}

export function stopSapMusic(): void {
    wantMusic = false;
    const ac = ctx;
    const v = voice;
    voice = null;
    if (!ac || !v) return;
    const now = ac.currentTime;
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(v.gain.gain.value, now);
    v.gain.gain.linearRampToValueAtTime(0, now + 0.35);
    v.source.stop(now + 0.4);
}

export function duckSapMusic(level: number, seconds: number): void {
    const ac = ctx;
    const v = voice;
    if (!ac || !v) return;
    const base = 0.62;
    const g = v.gain.gain;
    const now = ac.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(base * level, now + 0.25);
    g.setValueAtTime(base * level, now + seconds);
    g.linearRampToValueAtTime(base, now + seconds + 1.8);
}

/** Elapsed musical time in seconds since Bar 0 Beat 0 of the 106 BPM score. */
function getMusicalElapsedSeconds(): number {
    const ac = ctx;
    if (!ac || !voice || ac.state !== "running") {
        return performance.now() / 1000;
    }
    return Math.max(0, ac.currentTime - voice.loopEpochAt);
}

/** Current beat phase (0..1, where 1.0 is the exact downbeat kick impact) at 106 BPM. */
export function getSapBeatPulse(): number {
    const elapsed = getMusicalElapsedSeconds();
    return 1 - ((elapsed / SAP_BEAT) % 1);
}

/**
 * Compute the exact WebAudio `startTime` on the 106 BPM rhythmic grid so every sound effect
 * lands rhythmically in sync with the score's kick, hats, and swung 16th-note groove.
 */
function quantizeTo106BpmGrid(ac: AudioContext, mode: "16th" | "8th" | "beat", isBurstSequence = false): {
    startTime: number;
    barIndex: number;
    stepInBar: number;
} {
    const now = ac.currentTime;
    const epoch = voice ? voice.loopEpochAt : 0;
    const elapsed = Math.max(0, now - epoch);

    const rawStepFloat = elapsed / SAP_SIXTEENTH;
    let stepIndex = Math.ceil(rawStepFloat - 0.18); // if within ~25ms after a grid line, fire immediately on that grid line

    if (mode === "8th") {
        if (stepIndex % 2 !== 0) stepIndex += 1;
    } else if (mode === "beat") {
        const rem = stepIndex % 4;
        if (rem !== 0) stepIndex += 4 - rem;
    }

    const swingOffset = stepIndex % 2 === 1 ? SAP_SWING_SEC : 0;
    let targetTime = epoch + stepIndex * SAP_SIXTEENTH + swingOffset;

    if (targetTime < now + 0.002) {
        targetTime = now + 0.002;
    }

    // When multiple Goo balls are sucked into the pipe or attached rapidly, stagger them on consecutive
    // 16th-note subdivisions so they form a tight 106 BPM minimal-tech arpeggio instead of flamming!
    if (isBurstSequence && targetTime <= lastQuantizedSlotTime + SAP_SIXTEENTH * 0.55) {
        stepIndex += 1;
        const nextSwing = stepIndex % 2 === 1 ? SAP_SWING_SEC : 0;
        targetTime = Math.max(now + 0.002, epoch + stepIndex * SAP_SIXTEENTH + nextSwing);
    }
    if (isBurstSequence) {
        lastQuantizedSlotTime = targetTime;
    }

    const barIndex = Math.floor(stepIndex / 16) % SAP_LOOP_BARS;
    const stepInBar = ((stepIndex % 16) + 16) % 16;
    return { startTime: targetTime, barIndex, stepInBar };
}

/**
 * Play a C-minor sound effect rhythmically quantized to the 106 BPM grid and harmonically
 * voiced to the active bar's chord (`Cm9`, `Abmaj9`, `Fm9`, `Gm7`).
 */
export function playSapSfx(name: SapSfx, pan = 0, degree?: number): void {
    const ac = ctx;
    if (!ac || !master || ac.state !== "running") {
        playCMinorSynthFallback(name, pan, degree);
        return;
    }

    const isBurst = name === "suck" || name === "attach";
    const { startTime, barIndex, stepInBar } = quantizeTo106BpmGrid(ac, SFX_GRID[name], isBurst);
    const chordPairIdx = Math.floor(barIndex / 2) % CHORD_DEGREES_BY_PAIR.length;
    const activeChordDegrees = CHORD_DEGREES_BY_PAIR[chordPairIdx];

    const url = SFX_URLS[name];
    const buffer = buffers.get(url);
    if (!buffer) {
        playCMinorSynthFallback(name, pan, degree, startTime);
        return;
    }

    const src = ac.createBufferSource();
    src.buffer = buffer;
    if (degree !== undefined) {
        const degIdx = activeChordDegrees[((Math.round(degree) % activeChordDegrees.length) + activeChordDegrees.length) % activeChordDegrees.length];
        src.playbackRate.value = C_MINOR_RATIOS[degIdx];
    } else if (name === "attach" || name === "suck" || name === "grab") {
        // Step through the currently playing bar's C-minor chord tones in 16th-note sync
        const deg = activeChordDegrees[(scaleStep + stepInBar) % activeChordDegrees.length];
        scaleStep++;
        src.playbackRate.value = C_MINOR_RATIOS[deg];
    } else {
        src.playbackRate.value = 1.0;
    }

    const gain = ac.createGain();
    gain.gain.value = SFX_LEVEL[name];
    src.connect(gain);
    if (typeof ac.createStereoPanner === "function") {
        const panner = ac.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        gain.connect(panner);
        panner.connect(master);
    } else {
        gain.connect(master);
    }
    src.start(startTime);
}

/** Real-time WebAudio C-minor minimal dub pluck locked to 106 BPM 16th-note subdivisions. */
export function playCMinorSynthFallback(name: SapSfx, pan = 0, degree = 0, scheduledStart?: number): void {
    const ac = ctx;
    if (!ac || !master || ac.state !== "running") return;
    const notesByKind: Record<SapSfx, number[]> = {
        grab: [60, 67, 75],
        attach: [60, 63, 67, 70, 74],
        detach: [67, 63, 60],
        wake: [60, 63, 67, 72, 75],
        strain: [55, 56, 62],
        snap: [36, 48, 56],
        launch: [48, 55, 60, 67],
        signpost: [53, 56, 60, 63, 67],
        suck: [72, 75, 79, 84],
        win: [60, 63, 67, 70, 74, 79, 84],
    };
    const baseNotes = notesByKind[name] ?? [60, 63, 67];
    const t0 = scheduledStart ?? quantizeTo106BpmGrid(ac, SFX_GRID[name]).startTime;
    baseNotes.forEach((midiNote, i) => {
        const shifted = C_MINOR_MIDI[Math.min(C_MINOR_MIDI.length - 1, Math.max(0, C_MINOR_MIDI.indexOf(midiNote) + (degree % 5)))] ?? midiNote;
        const freq = 440 * Math.pow(2, (shifted - 69) / 12);
        const osc = ac.createOscillator();
        const filter = ac.createBiquadFilter();
        const gain = ac.createGain();
        const noteTime = t0 + i * (SAP_SIXTEENTH * 0.5);
        osc.type = name === "snap" ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(freq, noteTime);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2200, noteTime);
        filter.frequency.exponentialRampToValueAtTime(280, noteTime + SAP_EIGHTH);
        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.linearRampToValueAtTime(0.12 / Math.sqrt(baseNotes.length), noteTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + SAP_EIGHTH + 0.04);
        osc.connect(filter);
        filter.connect(gain);
        if (typeof ac.createStereoPanner === "function") {
            const p = ac.createStereoPanner();
            p.pan.value = Math.max(-1, Math.min(1, pan));
            gain.connect(p);
            p.connect(master!);
        } else {
            gain.connect(master!);
        }
        osc.start(noteTime);
        osc.stop(noteTime + SAP_EIGHTH + 0.05);
    });
}
