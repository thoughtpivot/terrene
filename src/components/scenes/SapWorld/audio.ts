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
export const SAP_BEAT = 60 / SAP_BPM;
export const SAP_LOOP_BARS = 64;
export const SAP_LOOP_LENGTH = SAP_LOOP_BARS * 4 * SAP_BEAT;

/**
 * Exact frequency ratios for the C natural minor / Dorian / Aeolian scale relative to C,
 * so any pitch-shifted SFX stays strictly in the key of C minor.
 */
export const C_MINOR_RATIOS: readonly number[] = [
    1.0,              // C
    Math.pow(2, 2 / 12),  // D
    Math.pow(2, 3 / 12),  // Eb
    Math.pow(2, 5 / 12),  // F
    Math.pow(2, 7 / 12),  // G
    Math.pow(2, 8 / 12),  // Ab
    Math.pow(2, 10 / 12), // Bb
    2.0,              // C (+1 octave)
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
    grab: 0.45,
    attach: 0.58,
    detach: 0.46,
    wake: 0.62,
    strain: 0.42,
    snap: 0.66,
    launch: 0.52,
    signpost: 0.56,
    suck: 0.68,
    win: 0.82,
};

interface MusicVoice {
    source: AudioBufferSourceNode;
    gain: GainNode;
    startedAt: number;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let voice: MusicVoice | null = null;
let wantMusic = false;
let scaleStep = 0;
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
    source.loopStart = 1.0;
    source.loopEnd = Math.min(buffer.duration, 1.0 + SAP_LOOP_LENGTH);
    const gain = ac.createGain();
    source.connect(gain);
    gain.connect(master);
    const now = ac.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.62, now + 2.2);
    source.start(now);
    voice = { source, gain, startedAt: now };
    console.log("🏰 Forest Last Sap World music started: Last Sap of the Heartwood (C minor, 106 BPM)");
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

/** Current beat phase (0..1) at 106 BPM so visuals can pulse with the four-on-the-floor kick. */
export function getSapBeatPulse(): number {
    const ac = ctx;
    if (!ac || !voice || ac.state !== "running") {
        const t = performance.now() / 1000;
        return 1 - ((t / SAP_BEAT) % 1);
    }
    const elapsed = Math.max(0, ac.currentTime - voice.startedAt);
    return 1 - ((elapsed / SAP_BEAT) % 1);
}

/**
 * Play a C-minor sound effect.
 * `degree` optionally selects a scale degree in C minor (0=C, 1=D, 2=Eb, 3=F, 4=G, 5=Ab, 6=Bb, 7=C+8ve)
 * so repeated actions play a C-minor melodic sequence rather than pitching out of key.
 */
export function playSapSfx(name: SapSfx, pan = 0, degree?: number): void {
    const ac = ctx;
    if (!ac || !master || ac.state !== "running") {
        // Synthesize a light C-minor tone if buffers are still decoding
        playCMinorSynthFallback(name, pan, degree);
        return;
    }
    const url = SFX_URLS[name];
    const buffer = buffers.get(url);
    if (!buffer) {
        playCMinorSynthFallback(name, pan, degree);
        return;
    }
    const src = ac.createBufferSource();
    src.buffer = buffer;
    if (degree !== undefined) {
        const idx = ((Math.round(degree) % C_MINOR_RATIOS.length) + C_MINOR_RATIOS.length) % C_MINOR_RATIOS.length;
        src.playbackRate.value = C_MINOR_RATIOS[idx];
    } else if (name === "attach" || name === "suck") {
        // Step through C-minor chord tones (C, Eb, G, Bb, D, G, C+8ve) so building/rescuing plays a melody
        const chordDegrees = [0, 2, 4, 6, 1, 4, 7];
        const deg = chordDegrees[scaleStep % chordDegrees.length];
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
    src.start();
}

/** Real-time WebAudio C-minor minimal dub pluck used for live harmonic feedback and fallback. */
export function playCMinorSynthFallback(name: SapSfx, pan = 0, degree = 0): void {
    const ac = ctx;
    if (!ac || !master || ac.state !== "running") return;
    const notesByKind: Record<SapSfx, number[]> = {
        grab: [60, 67],
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
    const now = ac.currentTime;
    baseNotes.forEach((midiNote, i) => {
        const shifted = C_MINOR_MIDI[Math.min(C_MINOR_MIDI.length - 1, Math.max(0, C_MINOR_MIDI.indexOf(midiNote) + (degree % 5)))] ?? midiNote;
        const freq = 440 * Math.pow(2, (shifted - 69) / 12);
        const osc = ac.createOscillator();
        const filter = ac.createBiquadFilter();
        const gain = ac.createGain();
        osc.type = name === "snap" ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.035);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2200, now + i * 0.035);
        filter.frequency.exponentialRampToValueAtTime(280, now + i * 0.035 + 0.28);
        gain.gain.setValueAtTime(0.0001, now + i * 0.035);
        gain.gain.linearRampToValueAtTime(0.12 / Math.sqrt(baseNotes.length), now + i * 0.035 + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.035 + 0.32);
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
        osc.start(now + i * 0.035);
        osc.stop(now + i * 0.035 + 0.34);
    });
}
