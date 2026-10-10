import OkaMusic from "./OkaWorld.mp3";
import CrystalSfx from "./sfx/crystal.mp3";
import HeartSfx from "./sfx/heart.mp3";
import HurtSfx from "./sfx/hurt.mp3";
import JumpSfx from "./sfx/jump.mp3";
import SplashSfx from "./sfx/splash.mp3";
import StompSfx from "./sfx/stomp.mp3";
import WinSfx from "./sfx/win.mp3";

/**
 * "Lanternlight Under Stone", rendered by tools/oka-world/compose_music.py.
 * The file holds the loop plus a 2 s copy of its start, so looping between
 * LOOP_START and LOOP_START + LOOP_LENGTH is seamless even if the MP3 decoder
 * shifts the audio by its priming delay.
 */
const LOOP_LENGTH = (32 * 4 * 60) / 72;
const LOOP_START = 1;
const MUSIC_LEVEL = 0.62;

export type OkaSfx = "jump" | "crystal" | "heart" | "hurt" | "stomp" | "splash" | "win";

const SFX_URLS: Record<OkaSfx, string> = {
    jump: JumpSfx,
    crystal: CrystalSfx,
    heart: HeartSfx,
    hurt: HurtSfx,
    stomp: StompSfx,
    splash: SplashSfx,
    win: WinSfx,
};

const SFX_LEVEL: Record<OkaSfx, number> = {
    jump: 0.35,
    crystal: 0.5,
    heart: 0.6,
    hurt: 0.6,
    stomp: 0.6,
    splash: 0.45,
    win: 0.8,
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicSource: AudioBufferSourceNode | null = null;
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
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
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

/** Fetch and decode everything up front so the first jump is not silent. */
export function preloadOkaAudio(): Promise<void> {
    const urls = [OkaMusic, ...Object.values(SFX_URLS)];
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
    if (!ac || !musicGain || musicSource || ac.state !== "running") return;
    const buffer = buffers.get(OkaMusic);
    if (!buffer) {
        void load(OkaMusic).then(() => {
            if (wantMusic) beginMusic();
        });
        return;
    }
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopStart = LOOP_START;
    src.loopEnd = Math.min(buffer.duration, LOOP_START + LOOP_LENGTH);
    src.connect(musicGain);
    const now = ac.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(0, now);
    musicGain.gain.linearRampToValueAtTime(MUSIC_LEVEL, now + 2.5);
    src.start(now);
    musicSource = src;
    console.log("🏰 Oka World music started");
}

export function stopOkaMusic(): void {
    wantMusic = false;
    const ac = ctx;
    const src = musicSource;
    musicSource = null;
    if (!ac || !src || !musicGain) return;
    const now = ac.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(musicGain.gain.value, now);
    musicGain.gain.linearRampToValueAtTime(0, now + 0.4);
    src.stop(now + 0.45);
}

/** Dip the music under a sting such as the win fanfare. */
export function duckOkaMusic(level: number, seconds: number): void {
    const ac = ctx;
    if (!ac || !musicGain || !musicSource) return;
    const now = ac.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(musicGain.gain.value, now);
    musicGain.gain.linearRampToValueAtTime(MUSIC_LEVEL * level, now + 0.3);
    musicGain.gain.setValueAtTime(MUSIC_LEVEL * level, now + seconds);
    musicGain.gain.linearRampToValueAtTime(MUSIC_LEVEL, now + seconds + 2);
}

export function isOkaMusicPlaying(): boolean {
    return musicSource !== null;
}

export function playOkaSfx(name: OkaSfx, pan = 0, rate = 1): void {
    const ac = ctx;
    if (!ac || !master || ac.state !== "running") return;
    const buffer = buffers.get(SFX_URLS[name]);
    if (!buffer) return;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
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
