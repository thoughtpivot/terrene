import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { SR, Stereo } from "./synth/dsp";

const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(data: Uint8Array): number {
    let c = 0xffffffff;
    for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function fftInPlace(re: Float64Array, im: Float64Array): void {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            [re[i], re[j]] = [re[j], re[i]];
            [im[i], im[j]] = [im[j], im[i]];
        }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = (-2 * Math.PI) / len;
        const wr = Math.cos(ang);
        const wi = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
            let cr = 1;
            let ci = 0;
            for (let k = 0; k < len / 2; k++) {
                const ar = re[i + k];
                const ai = im[i + k];
                const br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
                const bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
                re[i + k] = ar + br;
                im[i + k] = ai + bi;
                re[i + k + len / 2] = ar - br;
                im[i + k + len / 2] = ai - bi;
                const t = cr * wr - ci * wi;
                ci = cr * wi + ci * wr;
                cr = t;
            }
        }
    }
}

/** Magma-like colour ramp: black, deep purple, red, orange, pale yellow. */
function colour(v: number): [number, number, number] {
    const stops: Array<[number, number, number, number]> = [
        [0, 0, 0, 4],
        [0.25, 60, 15, 100],
        [0.5, 170, 40, 90],
        [0.75, 245, 120, 40],
        [1, 252, 250, 190],
    ];
    const x = Math.max(0, Math.min(1, v));
    for (let i = 1; i < stops.length; i++) {
        if (x <= stops[i][0]) {
            const a = stops[i - 1];
            const b = stops[i];
            const f = (x - a[0]) / (b[0] - a[0]);
            return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
        }
    }
    return [252, 250, 190];
}

function writePng(path: string, width: number, height: number, rgb: Uint8Array): void {
    const raw = Buffer.alloc((width * 3 + 1) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (width * 3 + 1)] = 0;
        rgb.subarray(y * width * 3, (y + 1) * width * 3).forEach((v, i) => {
            raw[y * (width * 3 + 1) + 1 + i] = v;
        });
    }
    const chunk = (type: string, data: Buffer): Buffer => {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length);
        const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE(crc32(td) >>> 0);
        return Buffer.concat([len, td, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", ihdr),
        chunk("IDAT", deflateSync(raw, { level: 9 })),
        chunk("IEND", Buffer.alloc(0)),
    ]));
}

export interface SpectrogramOptions {
    width?: number;
    height?: number;
    /** Vertical marker lines at these times (seconds), e.g. tier changes. */
    markers?: number[];
    floorDb?: number;
}

/**
 * Log-frequency spectrogram (30 Hz to 18 kHz) of a stereo signal, written as
 * an RGB PNG. Faint grid lines mark 100 Hz, 1 kHz, and 10 kHz.
 */
export function spectrogramPng(path: string, s: Stereo, opts: SpectrogramOptions = {}): void {
    const width = opts.width ?? 1400;
    const height = opts.height ?? 420;
    const floor = opts.floorDb ?? -90;
    const fftN = 4096;
    const win = new Float64Array(fftN);
    for (let i = 0; i < fftN; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (fftN - 1));
    const fLo = 30;
    const fHi = 18000;
    const binFor = (y: number): number => {
        const f = fLo * Math.pow(fHi / fLo, 1 - y / (height - 1));
        return Math.min(fftN / 2 - 1, Math.max(1, Math.round((f * fftN) / SR)));
    };
    const rows = Array.from({ length: height }, (_, y) => binFor(y));
    const img = new Uint8Array(width * height * 3);
    const re = new Float64Array(fftN);
    const im = new Float64Array(fftN);
    const total = s.length;
    for (let x = 0; x < width; x++) {
        const centre = Math.floor(((x + 0.5) / width) * total);
        const start = Math.max(0, Math.min(total - fftN, centre - fftN / 2));
        for (let i = 0; i < fftN; i++) {
            const j = start + i;
            re[i] = j < total ? ((s.l[j] + s.r[j]) * 0.5) * win[i] : 0;
            im[i] = 0;
        }
        fftInPlace(re, im);
        for (let y = 0; y < height; y++) {
            const b = rows[y];
            const mag = Math.sqrt(re[b] * re[b] + im[b] * im[b]) / (fftN / 4);
            const db = 20 * Math.log10(mag + 1e-12);
            const [r, g, bl] = colour((db - floor) / -floor);
            const o = (y * width + x) * 3;
            img[o] = r;
            img[o + 1] = g;
            img[o + 2] = bl;
        }
    }
    for (const f of [100, 1000, 10000]) {
        const y = Math.round((1 - Math.log(f / fLo) / Math.log(fHi / fLo)) * (height - 1));
        for (let x = 0; x < width; x += 4) {
            const o = (y * width + x) * 3;
            img[o] = img[o + 1] = img[o + 2] = 90;
        }
    }
    for (const t of opts.markers ?? []) {
        const x = Math.round((t * SR * width) / total);
        if (x < 0 || x >= width) continue;
        for (let y = 0; y < height; y += 3) {
            const o = (y * width + x) * 3;
            img[o] = 255;
            img[o + 1] = 255;
            img[o + 2] = 255;
        }
    }
    writePng(path, width, height, img);
}
