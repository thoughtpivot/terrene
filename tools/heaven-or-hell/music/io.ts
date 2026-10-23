import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { SR, Stereo } from "./synth/dsp";

/** 16-bit PCM WAV (what ffmpeg encodes from), or 32-bit float for intermediate files. */
export function writeWav(path: string, channels: Float32Array[], format: "pcm16" | "float32" = "pcm16"): void {
    const n = channels[0].length;
    const ch = channels.length;
    const bytes = format === "pcm16" ? 2 : 4;
    const data = Buffer.alloc(n * ch * bytes);
    let o = 0;
    for (let i = 0; i < n; i++) {
        for (let c = 0; c < ch; c++) {
            const v = channels[c][i];
            if (format === "pcm16") {
                const s = Math.max(-1, Math.min(1, v));
                data.writeInt16LE(Math.round(s * 32767), o);
            } else {
                data.writeFloatLE(v, o);
            }
            o += bytes;
        }
    }
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + data.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(format === "pcm16" ? 1 : 3, 20);
    header.writeUInt16LE(ch, 22);
    header.writeUInt32LE(SR, 24);
    header.writeUInt32LE(SR * ch * bytes, 28);
    header.writeUInt16LE(ch * bytes, 32);
    header.writeUInt16LE(bytes * 8, 34);
    header.write("data", 36);
    header.writeUInt32LE(data.length, 40);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.concat([header, data]));
}

export function hasFfmpeg(): boolean {
    return spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
}

/** Encode a WAV to CBR MP3 with LAME (via ffmpeg's libmp3lame). LAME writes the gapless header browsers and ffmpeg honour. */
export function encodeMp3(wavPath: string, mp3Path: string, kbps: number, channels: 1 | 2): void {
    mkdirSync(dirname(mp3Path), { recursive: true });
    execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-i", wavPath,
        "-ac", String(channels), "-codec:a", "libmp3lame", "-b:a", `${kbps}k`, "-ar", String(SR),
        "-map_metadata", "-1", mp3Path,
    ]);
}

/** Decode any audio file to stereo float at 44.1 kHz. */
export function decodeToStereo(path: string): Stereo {
    const raw = execFileSync("ffmpeg", ["-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", String(SR), "-"], {
        maxBuffer: 1 << 30,
    });
    const f = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
    const n = f.length / 2;
    const l = new Float32Array(n);
    const r = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        l[i] = f[2 * i];
        r[i] = f[2 * i + 1];
    }
    return new Stereo(l, r);
}

export function fileSize(path: string): number {
    return statSync(path).size;
}

export function readJson<T>(path: string): T {
    return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function writeText(path: string, text: string): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
}
