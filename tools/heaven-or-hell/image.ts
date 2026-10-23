/**
 * Plain RGBA image operations for the Heaven Or Hell art pipeline.
 * Pixels are straight (not premultiplied) 8-bit RGBA, row-major.
 * Nothing here touches the file system, so it can be tested on its own.
 */

export interface Img {
    w: number;
    h: number;
    data: Uint8ClampedArray;
}

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type Rgb = [number, number, number];

export function blank(w: number, h: number): Img {
    return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}

export function clone(img: Img): Img {
    return { w: img.w, h: img.h, data: new Uint8ClampedArray(img.data) };
}

/** Median colour of the outermost ring of pixels: the flat field the painting was made on. */
export function borderColor(img: Img): Rgb {
    const rs: number[] = [];
    const gs: number[] = [];
    const bs: number[] = [];
    const take = (x: number, y: number) => {
        const i = (y * img.w + x) * 4;
        rs.push(img.data[i]);
        gs.push(img.data[i + 1]);
        bs.push(img.data[i + 2]);
    };
    for (let x = 0; x < img.w; x += 2) {
        take(x, 0);
        take(x, img.h - 1);
    }
    for (let y = 0; y < img.h; y += 2) {
        take(0, y);
        take(img.w - 1, y);
    }
    const median = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1];
    return [median(rs), median(gs), median(bs)];
}

/**
 * Key out a flat background colour. Alpha ramps from 0 at distance `lo` to 1
 * at `hi`, and partly covered pixels are unmixed from the key so no magenta
 * fringe is left on the edges.
 */
export function keyOut(img: Img, key: Rgb, lo = 60, hi = 150): Img {
    const out = blank(img.w, img.h);
    const [kr, kg, kb] = key;
    for (let i = 0; i < img.data.length; i += 4) {
        const r = img.data[i];
        const g = img.data[i + 1];
        const b = img.data[i + 2];
        const d = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);
        let a = (d - lo) / (hi - lo);
        a = a < 0 ? 0 : a > 1 ? 1 : a;
        if (a <= 0) continue;
        let fr = r;
        let fg = g;
        let fb = b;
        if (a < 1) {
            fr = (r - (1 - a) * kr) / a;
            fg = (g - (1 - a) * kg) / a;
            fb = (b - (1 - a) * kb) / a;
        }
        out.data[i] = fr;
        out.data[i + 1] = fg;
        out.data[i + 2] = fb;
        out.data[i + 3] = a * 255;
    }
    return out;
}

/** Remove magenta spill from opaque pixels that touch transparency (JPEG ringing on the ink line). */
export function despillEdges(img: Img, radius = 3): Img {
    const out = clone(img);
    const near = dilateMask(alphaMask(img, 250, true), img.w, img.h, radius);
    for (let p = 0; p < img.w * img.h; p++) {
        if (!near[p]) continue;
        const i = p * 4;
        const r = out.data[i];
        const g = out.data[i + 1];
        const b = out.data[i + 2];
        const m = Math.min(r, b);
        if (m > g) {
            out.data[i] = r - (m - g);
            out.data[i + 2] = b - (m - g);
        }
    }
    return out;
}

/** 1 where alpha is above `threshold` (or at or below it when `invert`). */
export function alphaMask(img: Img, threshold = 127, invert = false): Uint8Array {
    const mask = new Uint8Array(img.w * img.h);
    for (let p = 0; p < mask.length; p++) {
        const on = img.data[p * 4 + 3] > threshold;
        mask[p] = (invert ? !on : on) ? 1 : 0;
    }
    return mask;
}

/** Grow a mask by `radius` pixels (square neighbourhood, two separable passes). */
export function dilateMask(mask: Uint8Array, w: number, h: number, radius: number): Uint8Array {
    const rows = new Uint8Array(mask.length);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let on = 0;
            for (let d = -radius; d <= radius && !on; d++) {
                const xx = x + d;
                if (xx >= 0 && xx < w && mask[y * w + xx]) on = 1;
            }
            rows[y * w + x] = on;
        }
    }
    const out = new Uint8Array(mask.length);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let on = 0;
            for (let d = -radius; d <= radius && !on; d++) {
                const yy = y + d;
                if (yy >= 0 && yy < h && rows[yy * w + x]) on = 1;
            }
            out[y * w + x] = on;
        }
    }
    return out;
}

/** Bounding box of pixels with alpha above `threshold`, or null when empty. */
export function opaqueBounds(img: Img, threshold = 8): Box | null {
    let x0 = img.w;
    let y0 = img.h;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < img.h; y++) {
        for (let x = 0; x < img.w; x++) {
            if (img.data[(y * img.w + x) * 4 + 3] > threshold) {
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
            }
        }
    }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export function crop(img: Img, box: Box): Img {
    const out = blank(box.w, box.h);
    for (let y = 0; y < box.h; y++) {
        const sy = box.y + y;
        if (sy < 0 || sy >= img.h) continue;
        for (let x = 0; x < box.w; x++) {
            const sx = box.x + x;
            if (sx < 0 || sx >= img.w) continue;
            const si = (sy * img.w + sx) * 4;
            const di = (y * box.w + x) * 4;
            out.data[di] = img.data[si];
            out.data[di + 1] = img.data[si + 1];
            out.data[di + 2] = img.data[si + 2];
            out.data[di + 3] = img.data[si + 3];
        }
    }
    return out;
}

export function pad(img: Img, n: number): Img {
    return crop(img, { x: -n, y: -n, w: img.w + n * 2, h: img.h + n * 2 });
}

/**
 * Connected regions of opaque pixels, largest first. Regions smaller than
 * `minArea` pixels (JPEG specks) are dropped.
 */
export function components(img: Img, minArea = 64, threshold = 127): Box[] {
    const { w, h } = img;
    const mask = alphaMask(img, threshold);
    const seen = new Uint8Array(w * h);
    const stack = new Int32Array(w * h);
    const found: (Box & { area: number })[] = [];
    for (let start = 0; start < mask.length; start++) {
        if (!mask[start] || seen[start]) continue;
        let top = 0;
        stack[top++] = start;
        seen[start] = 1;
        let area = 0;
        let x0 = w;
        let y0 = h;
        let x1 = 0;
        let y1 = 0;
        while (top > 0) {
            const p = stack[--top];
            area++;
            const x = p % w;
            const y = (p - x) / w;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
            const n = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
            for (const q of n) {
                if (q >= 0 && mask[q] && !seen[q]) {
                    seen[q] = 1;
                    stack[top++] = q;
                }
            }
        }
        if (area >= minArea) found.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, area });
    }
    found.sort((a, b) => b.area - a.area);
    return found.map(({ x, y, w: bw, h: bh }) => ({ x, y, w: bw, h: bh }));
}

export function unionBox(boxes: Box[]): Box {
    const x0 = Math.min(...boxes.map((b) => b.x));
    const y0 = Math.min(...boxes.map((b) => b.y));
    const x1 = Math.max(...boxes.map((b) => b.x + b.w));
    const y1 = Math.max(...boxes.map((b) => b.y + b.h));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Keep only pixels inside the given boxes (drops stray specks between objects). */
export function keepBoxes(img: Img, boxes: Box[]): Img {
    const out = blank(img.w, img.h);
    for (const b of boxes) {
        for (let y = b.y; y < b.y + b.h; y++) {
            for (let x = b.x; x < b.x + b.w; x++) {
                const i = (y * img.w + x) * 4;
                out.data[i] = img.data[i];
                out.data[i + 1] = img.data[i + 1];
                out.data[i + 2] = img.data[i + 2];
                out.data[i + 3] = img.data[i + 3];
            }
        }
    }
    return out;
}

/**
 * Resample to an exact size with an area (box) filter in premultiplied
 * alpha, so downscaled edges stay clean and no dark halo appears.
 */
export function resize(img: Img, w: number, h: number): Img {
    const pre = new Float32Array(img.w * img.h * 4);
    for (let p = 0; p < img.w * img.h; p++) {
        const a = img.data[p * 4 + 3] / 255;
        pre[p * 4] = img.data[p * 4] * a;
        pre[p * 4 + 1] = img.data[p * 4 + 1] * a;
        pre[p * 4 + 2] = img.data[p * 4 + 2] * a;
        pre[p * 4 + 3] = a;
    }
    const horiz = resampleAxis(pre, img.w, img.h, w, true);
    const both = resampleAxis(horiz, w, img.h, h, false);
    const out = blank(w, h);
    for (let p = 0; p < w * h; p++) {
        const a = both[p * 4 + 3];
        if (a <= 1e-4) continue;
        out.data[p * 4] = both[p * 4] / a;
        out.data[p * 4 + 1] = both[p * 4 + 1] / a;
        out.data[p * 4 + 2] = both[p * 4 + 2] / a;
        out.data[p * 4 + 3] = a * 255;
    }
    return out;
}

/** One axis of `resize`. Upscaling falls back to linear interpolation. */
function resampleAxis(src: Float32Array, sw: number, sh: number, size: number, horizontal: boolean): Float32Array {
    const from = horizontal ? sw : sh;
    const across = horizontal ? sh : sw;
    const dst = new Float32Array((horizontal ? size * sh : sw * size) * 4);
    const scale = from / size;
    const at = (line: number, k: number) => (horizontal ? (line * sw + k) * 4 : (k * sw + line) * 4);
    const put = (line: number, k: number) => (horizontal ? (line * size + k) * 4 : (k * sw + line) * 4);
    for (let line = 0; line < across; line++) {
        for (let k = 0; k < size; k++) {
            const o = put(line, k);
            if (scale <= 1) {
                const s = Math.max(0, Math.min(from - 1, (k + 0.5) * scale - 0.5));
                const i0 = Math.floor(s);
                const i1 = Math.min(from - 1, i0 + 1);
                const t = s - i0;
                for (let c = 0; c < 4; c++) dst[o + c] = src[at(line, i0) + c] * (1 - t) + src[at(line, i1) + c] * t;
                continue;
            }
            const start = k * scale;
            const end = start + scale;
            let total = 0;
            const acc = [0, 0, 0, 0];
            for (let i = Math.floor(start); i < Math.ceil(end) && i < from; i++) {
                const weight = Math.min(end, i + 1) - Math.max(start, i);
                if (weight <= 0) continue;
                total += weight;
                const si = at(line, i);
                for (let c = 0; c < 4; c++) acc[c] += src[si + c] * weight;
            }
            for (let c = 0; c < 4; c++) dst[o + c] = acc[c] / total;
        }
    }
    return dst;
}

/** Paint `src` over `dst` at (x, y) with source-over in straight alpha. */
export function blit(dst: Img, src: Img, x: number, y: number): void {
    for (let sy = 0; sy < src.h; sy++) {
        const dy = y + sy;
        if (dy < 0 || dy >= dst.h) continue;
        for (let sx = 0; sx < src.w; sx++) {
            const dx = x + sx;
            if (dx < 0 || dx >= dst.w) continue;
            const si = (sy * src.w + sx) * 4;
            const di = (dy * dst.w + dx) * 4;
            const sa = src.data[si + 3] / 255;
            if (sa <= 0) continue;
            const da = dst.data[di + 3] / 255;
            const oa = sa + da * (1 - sa);
            for (let c = 0; c < 3; c++) {
                dst.data[di + c] = (src.data[si + c] * sa + dst.data[di + c] * da * (1 - sa)) / oa;
            }
            dst.data[di + 3] = oa * 255;
        }
    }
}

/**
 * A solid outline `radius` pixels wide around the opaque shape, drawn
 * behind it. Soft at the outer edge so it survives downscaling.
 */
export function outline(img: Img, radius: number, color: Rgb): Img {
    const out = pad(img, Math.ceil(radius) + 1);
    const { w, h } = out;
    const ring = blank(w, h);
    const r = Math.ceil(radius);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let best = 0;
            for (let dy = -r; dy <= r && best < 255; dy++) {
                const yy = y + dy;
                if (yy < 0 || yy >= h) continue;
                for (let dx = -r; dx <= r; dx++) {
                    const xx = x + dx;
                    if (xx < 0 || xx >= w) continue;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > radius + 0.5) continue;
                    const fall = Math.min(1, radius + 0.5 - dist);
                    const a = out.data[(yy * w + xx) * 4 + 3] * fall;
                    if (a > best) best = a;
                }
            }
            const i = (y * w + x) * 4;
            ring.data[i] = color[0];
            ring.data[i + 1] = color[1];
            ring.data[i + 2] = color[2];
            ring.data[i + 3] = best;
        }
    }
    blit(ring, out, 0, 0);
    return ring;
}

export interface Hsv {
    h: number;
    s: number;
    v: number;
}

export function hsv(r: number, g: number, b: number): Hsv {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d > 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    return { h, s: max === 0 ? 0 : d / max, v: max / 255 };
}

/**
 * The emissive pass: only the pixels `glow` scores above 0, at that score's
 * strength, everything else transparent. Drawn additively over the sprite.
 */
export function emissive(img: Img, glow: (c: Hsv, x: number, y: number) => number): Img {
    const out = blank(img.w, img.h);
    for (let y = 0; y < img.h; y++) {
        for (let x = 0; x < img.w; x++) {
            const i = (y * img.w + x) * 4;
            const a = img.data[i + 3];
            if (a === 0) continue;
            const k = Math.max(0, Math.min(1, glow(hsv(img.data[i], img.data[i + 1], img.data[i + 2]), x / img.w, y / img.h)));
            if (k <= 0) continue;
            out.data[i] = img.data[i];
            out.data[i + 1] = img.data[i + 1];
            out.data[i + 2] = img.data[i + 2];
            out.data[i + 3] = a * k;
        }
    }
    return out;
}

/** Ramp from 0 at `a` to 1 at `b`. */
export function ramp(x: number, a: number, b: number): number {
    const t = (x - a) / (b - a);
    return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * Keep the band of rows between `top` and `bottom` (fractions of height),
 * fading alpha over `feather` (a fraction) at each cut so neighbouring
 * pieces cross-fade where they overlap and no seam shows when they move.
 */
export function band(img: Img, top: number, bottom: number, feather: number): Img {
    const out = clone(img);
    for (let y = 0; y < img.h; y++) {
        const f = y / img.h;
        let k = 1;
        if (top > 0) k = Math.min(k, ramp(f, top - feather / 2, top + feather / 2));
        if (bottom < 1) k = Math.min(k, 1 - ramp(f, bottom - feather / 2, bottom + feather / 2));
        for (let x = 0; x < img.w; x++) out.data[(y * img.w + x) * 4 + 3] *= k;
    }
    return out;
}

export interface Placed {
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    page: number;
}

/**
 * Shelf-pack rectangles (tallest first) into square pages of `size`,
 * leaving `gap` transparent pixels between them so linear filtering never
 * bleeds a neighbour in.
 */
export function pack(items: { name: string; w: number; h: number }[], size: number, gap = 4): Placed[] {
    const sorted = [...items].sort((a, b) => b.h - a.h || b.w - a.w);
    const placed: Placed[] = [];
    let page = 0;
    let x = gap;
    let y = gap;
    let shelf = 0;
    for (const item of sorted) {
        if (item.w + gap * 2 > size || item.h + gap * 2 > size) {
            throw new Error(`${item.name} (${item.w}x${item.h}) does not fit a ${size} page`);
        }
        if (x + item.w + gap > size) {
            x = gap;
            y += shelf + gap;
            shelf = 0;
        }
        if (y + item.h + gap > size) {
            page++;
            x = gap;
            y = gap;
            shelf = 0;
        }
        placed.push({ name: item.name, x, y, w: item.w, h: item.h, page });
        x += item.w + gap;
        shelf = Math.max(shelf, item.h);
    }
    return placed;
}

/** Smallest power-of-two height that holds everything placed on a page. */
export function pageHeight(placed: Placed[], page: number, gap = 4): number {
    const bottom = Math.max(...placed.filter((p) => p.page === page).map((p) => p.y + p.h + gap));
    let h = 64;
    while (h < bottom) h *= 2;
    return h;
}
