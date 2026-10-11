import OkaMusic from "./OkaWorld.mp3";
import CrystalSfx from "./sfx/crystal.mp3";
import HeartSfx from "./sfx/heart.mp3";
import HurtSfx from "./sfx/hurt.mp3";
import JumpSfx from "./sfx/jump.mp3";
import SplashSfx from "./sfx/splash.mp3";
import StompSfx from "./sfx/stomp.mp3";
import WinSfx from "./sfx/win.mp3";

export type OkaSfx = "jump" | "crystal" | "heart" | "hurt" | "stomp" | "splash" | "win" | "lantern" | "rumble";

/**
 * A scene's music and sound effects. Each music file holds the loop plus a
 * 2 s copy of its start, so looping between `loopStart` and
 * `loopStart + loopLength` is seamless even if the MP3 decoder shifts the
 * audio by its priming delay. A scene may leave out effects it never plays.
 */
export interface OkaSoundtrack {
    name: string;
    music: string;
    loopStart: number;
    loopLength: number;
    level: number;
    sfx: Partial<Record<OkaSfx, string>>;
    sfxLevel: Partial<Record<OkaSfx, number>>;
}

/** "Lanternlight Under Stone", rendered by tools/oka-world/compose_music.py. */
export const OKA_SOUNDTRACK: OkaSoundtrack = {
    name: "Lanternlight Under Stone",
    music: OkaMusic,
    loopStart: 1,
    loopLength: (32 * 4 * 60) / 72,
    level: 0.62,
    sfx: {
        jump: JumpSfx,
        crystal: CrystalSfx,
        heart: HeartSfx,
        hurt: HurtSfx,
        stomp: StompSfx,
        splash: SplashSfx,
        win: WinSfx,
    },
    sfxLevel: {
        jump: 0.35,
        crystal: 0.5,
        heart: 0.6,
        hurt: 0.6,
        stomp: 0.6,
        splash: 0.45,
        win: 0.8,
    },
};

interface MusicVoice {
    source: AudioBufferSourceNode;
    gain: GainNode;
    track: OkaSoundtrack;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let voice: MusicVoice | null = null;
let track: OkaSoundtrack = OKA_SOUNDTRACK;
let wantMusic = false;
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

function load(url: string): Promise<AudioBuffer | null> {
    const ac = context();
    if (!ac) return Promise.resolve(null);
    const have = buffers.get(url);
    if (have) return Promise.resolve(have);
    const inflight = pending.get(url);
    if (inflight) return inflight;
    const job = fetch(url)
        .then((res) => res.arrayBuffer())
        .then((data) => new Promise<AudioBuffer>((resolve, reject) => {
            // callback form keeps older Safari happy
            ac.decodeAudioData(data, resolve, reject);
        }))
        .then((buffer) => {
            buffers.set(url, buffer);
            return buffer;
        })
        .catch((error) => {
            console.error("❌ Oka World audio failed to load", url, error);
            return null;
        });
    pending.set(url, job);
    return job;
}

/** Switch the soundtrack that music and effects come from. Stops music from another track. */
export function useOkaSoundtrack(next: OkaSoundtrack): void {
    if (next === track) return;
    stopOkaMusic();
    track = next;
}

/** Fetch and decode a soundtrack up front so the first jump is not silent. */
export function preloadOkaAudio(soundtrack: OkaSoundtrack = track): Promise<void> {
    const urls = [soundtrack.music, ...Object.values(soundtrack.sfx)];
    return Promise.all(urls.map(load)).then(() => undefined);
}

/** Call from a key or pointer handler: browsers only start audio after a gesture. */
export function unlockOkaAudio(): void {
    const ac = context();
    if (!ac) return;
    if (ac.state === "suspended") {
        void ac.resume().then(() => {
            if (wantMusic) beginMusic();
        }).catch((error) => console.error("❌ Audio resume failed", error));
    } else if (wantMusic) {
        beginMusic();
    }
}

export function startOkaMusic(): void {
    wantMusic = true;
    const ac = context();
    if (!ac) return;
    if (ac.state === "running") beginMusic();
}

function beginMusic(): void {
    const ac = context();
    if (!ac || !master || voice || ac.state !== "running") return;
    const t = track;
    const buffer = buffers.get(t.music);
    if (!buffer) {
        void load(t.music).then(() => {
            if (wantMusic && track === t) beginMusic();
        });
        return;
    }
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = t.loopStart;
    source.loopEnd = Math.min(buffer.duration, t.loopStart + t.loopLength);
    const gain = ac.createGain();
    source.connect(gain);
    gain.connect(master);
    const now = ac.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(t.level, now + 2.5);
    source.start(now);
    voice = { source, gain, track: t };
    console.log(`🏰 Oka World music started: ${t.name}`);
}

export function stopOkaMusic(): void {
    wantMusic = false;
    const ac = ctx;
    const v = voice;
    voice = null;
    if (!ac || !v) return;
    const now = ac.currentTime;
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(v.gain.gain.value, now);
    v.gain.gain.linearRampToValueAtTime(0, now + 0.4);
    v.source.stop(now + 0.45);
}

/** Dip the music under a sting such as the win fanfare. */
export function duckOkaMusic(level: number, seconds: number): void {
    const ac = ctx;
    const v = voice;
    if (!ac || !v) return;
    const full = v.track.level;
    const g = v.gain.gain;
    const now = ac.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(full * level, now + 0.3);
    g.setValueAtTime(full * level, now + seconds);
    g.linearRampToValueAtTime(full, now + seconds + 2);
}

/** Fade the music out over `seconds`, e.g. while the screen fades to the next scene. */
export function fadeOkaMusic(seconds: number): void {
    const ac = ctx;
    const v = voice;
    if (!ac || !v) return;
    const g = v.gain.gain;
    const now = ac.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + seconds);
}

export function isOkaMusicPlaying(): boolean {
    return voice !== null;
}

export function playOkaSfx(name: OkaSfx, pan = 0, rate = 1): void {
    const ac = ctx;
    if (!ac || !master || ac.state !== "running") return;
    const url = track.sfx[name];
    const buffer = url ? buffers.get(url) : undefined;
    if (!buffer) return;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const gain = ac.createGain();
    gain.gain.value = track.sfxLevel[name] ?? 0.5;
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
