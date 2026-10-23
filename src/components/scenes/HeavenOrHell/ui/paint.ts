/**
 * Canvas painting for the Heaven Or Hell UI. Every function takes a 2D
 * context and a `UiTheme`, so whatever corruption and Stain the theme was
 * built from shows up in every widget the same way.
 *
 * The rule for effects: veins, cracks, chips and heat live in the frame band,
 * the outer 10 px of a panel. They never cross a bar's fill or a line of text.
 */
import { Rgb, clamp, css, hex, mix } from "./color";
import { BarColors, UiTheme } from "./theme";
import { CooldownView, HaloState, PostureLevel } from "./hudState";

export type Ctx = CanvasRenderingContext2D;

/** Font stacks. The first family is registered by `fonts.ts`; the rest are fallbacks. */
export const FAMILY = {
    display: "'HoH Cinzel', Cinzel, 'Trajan Pro', Georgia, serif",
    displayBold: "'HoH Cinzel Bold', Cinzel, 'Trajan Pro', Georgia, serif",
    body: "'HoH Cormorant', 'Cormorant Garamond', Garamond, Georgia, serif",
    bodyItalic: "'HoH Cormorant Italic', 'Cormorant Garamond', Garamond, Georgia, serif",
    ui: "'HoH Inter', Inter, 'Segoe UI', system-ui, sans-serif",
    uiBold: "'HoH Inter SemiBold', Inter, 'Segoe UI', system-ui, sans-serif",
} as const;

const WHITE = hex("#ffffff");
const ASH = hex("#6c665e");

// ---------------------------------------------------------------- basics

/** Deterministic random numbers so a widget's veins and cracks stay put frame to frame. */
export function rng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Smooth, cheap flicker noise in 0..1. */
export function flickerNoise(time: number, seed = 0): number {
    const t = time + seed * 13.37;
    return 0.5 + 0.25 * Math.sin(t * 7.3) + 0.15 * Math.sin(t * 13.1 + 1.7) + 0.1 * Math.sin(t * 29.7 + 0.3);
}

export function setSpacing(ctx: Ctx, px: number): void {
    const c = ctx as Ctx & { letterSpacing?: string };
    if ("letterSpacing" in c) c.letterSpacing = `${px}px`;
}

export function font(ctx: Ctx, family: string, size: number, italic = false): void {
    ctx.font = `${italic ? "italic " : ""}${size}px ${family}`;
}

/** Draw text with an ink shadow so it holds against any glow behind it. */
export function inkText(ctx: Ctx, text: string, x: number, y: number, color: string, theme: UiTheme, blur = 3): void {
    ctx.save();
    ctx.shadowColor = css(theme.ink, 0.9);
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}

export function wrapText(ctx: Ctx, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const para of text.split("\n")) {
        let line = "";
        for (const word of para.split(/\s+/).filter(Boolean)) {
            const next = line ? `${line} ${word}` : word;
            if (ctx.measureText(next).width > maxWidth && line) {
                lines.push(line);
                line = word;
            } else {
                line = next;
            }
        }
        lines.push(line);
    }
    return lines;
}

/** A rectangle with its corners cut at 45 degrees: the panel shape. */
export function bevelPath(ctx: Ctx, x: number, y: number, w: number, h: number, b: number): void {
    const k = Math.min(b, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + k, y);
    ctx.lineTo(x + w - k, y);
    ctx.lineTo(x + w, y + k);
    ctx.lineTo(x + w, y + h - k);
    ctx.lineTo(x + w - k, y + h);
    ctx.lineTo(x + k, y + h);
    ctx.lineTo(x, y + h - k);
    ctx.lineTo(x, y + k);
    ctx.closePath();
}

function diamond(ctx: Ctx, x: number, y: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
}

/** Glow alpha after the theme's flicker. */
export function glowAlpha(theme: UiTheme, time: number, seed = 0): number {
    const f = theme.flicker * 0.35 * (1 - flickerNoise(time, seed));
    return clamp(theme.glowStrength * (1 - f));
}

/** Gold for an ornament that may have tarnished away, decided per ornament by its seed. */
function ornamentColor(theme: UiTheme, r: number): Rgb {
    return r < theme.goldLeft ? theme.goldBright : mix(theme.gold, theme.vein, 0.5);
}

// ---------------------------------------------------------------- frames

export interface FrameOptions {
    x: number;
    y: number;
    w: number;
    h: number;
    theme: UiTheme;
    time: number;
    seed: number;
    /** size of the cut corners */
    bevel?: number;
    /** add the Stain accents of the player's own widgets */
    personal?: boolean;
    /** draw the small crest at the top centre */
    crest?: boolean;
    /** 0..1, brightens lines and glow, for hover and focus */
    focus?: boolean | number;
    /** skip the fill, for frames drawn over something */
    noFill?: boolean;
    /** fill opacity multiplier */
    fillAlpha?: number;
    /** line colour override, for rarity frames */
    line?: Rgb;
}

/** Fill, filigree, ornaments and every corruption effect of a panel. */
export function drawFrame(ctx: Ctx, o: FrameOptions): void {
    const { x, y, w, h, theme: t, time } = o;
    const b = o.bevel ?? 7;
    const focus = typeof o.focus === "number" ? o.focus : o.focus ? 1 : 0;
    const line = o.line ?? t.gold;
    const veins = o.personal ? Math.max(t.veins, t.personal.veins * 0.85) : t.veins;

    if (!o.noFill) {
        ctx.save();
        ctx.shadowColor = css(t.ink, 0.7);
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        const a = t.panelAlpha * (o.fillAlpha ?? 1);
        g.addColorStop(0, css(t.panel, a));
        g.addColorStop(1, css(t.panelDeep, Math.min(1, a + 0.06)));
        ctx.fillStyle = g;
        bevelPath(ctx, x, y, w, h, b);
        ctx.fill();
        ctx.restore();

        ctx.save();
        bevelPath(ctx, x, y, w, h, b);
        ctx.clip();
        if (t.heat > 0) {
            // Heat rising from the bottom edge, wavering when the shimmer is on.
            const waver = 1 + t.shimmer * 0.25 * Math.sin(time * 2.3 + o.seed);
            const top = y + h - Math.min(h, 46) * waver;
            const hg = ctx.createLinearGradient(0, y + h, 0, top);
            hg.addColorStop(0, css(mix(t.danger, t.glow, 0.35), 0.16 * t.heat));
            hg.addColorStop(1, css(t.danger, 0));
            ctx.fillStyle = hg;
            ctx.fillRect(x, top, w, y + h - top);
        }
        const sheen = ctx.createLinearGradient(0, y, 0, y + 18);
        sheen.addColorStop(0, css(mix(WHITE, t.glow, 0.5), 0.05 + 0.03 * focus));
        sheen.addColorStop(1, css(WHITE, 0));
        ctx.fillStyle = sheen;
        ctx.fillRect(x, y, w, 18);
        ctx.restore();
    }

    const r = rng(o.seed);
    const lineAlpha = 0.5 + 0.3 * focus;

    // Outer filigree line, chipped as corruption rises.
    ctx.save();
    if (t.chips > 0) {
        const dash: number[] = [];
        for (let i = 0; i < 12; i++) {
            dash.push(28 + r() * 110, 0.5 + t.chips * (1.5 + r() * 5));
        }
        ctx.setLineDash(dash);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = css(line, lineAlpha);
    bevelPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, b);
    ctx.stroke();
    ctx.restore();

    // Inner hairline.
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = css(mix(line, t.ink, 0.35), 0.28 + 0.12 * focus);
    bevelPath(ctx, x + 3.5, y + 3.5, w - 7, h - 7, Math.max(1, b - 2.5));
    ctx.stroke();
    ctx.restore();

    drawCorners(ctx, x, y, w, h, b, t, time, r, focus);
    if (o.crest) drawCrest(ctx, x + w / 2, y, Math.min(70, w * 0.22), t, time, r(), focus);
    if (veins > 0.001) drawVeins(ctx, x, y, w, h, veins, t, time, o.seed);
    if (t.cracks > 0.001) drawCracks(ctx, x, y, w, h, t, time, o.seed);
}

function drawCorners(ctx: Ctx, x: number, y: number, w: number, h: number, b: number, t: UiTheme, time: number, r: () => number, focus: number): void {
    const corners: Array<[number, number, number, number]> = [
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x + w, y + h, -1, -1],
        [x, y + h, 1, -1],
    ];
    corners.forEach(([cx, cy, sx, sy], i) => {
        const roll = r();
        const color = ornamentColor(t, roll);
        const gold = roll < t.goldLeft;
        const broken = !gold && r() < 0.6;
        ctx.save();
        if (gold) {
            ctx.shadowColor = css(t.glow, glowAlpha(t, time, i) * (0.8 + 0.4 * focus));
            ctx.shadowBlur = t.glowBlur * 0.6;
        }
        ctx.strokeStyle = css(color, gold ? 0.9 : 0.7);
        ctx.fillStyle = css(color, gold ? 0.95 : 0.75);
        ctx.lineWidth = 1;
        const len = Math.min(18, w * 0.12, h * 0.3);
        // two ticks running along the edges from the cut corner
        ctx.beginPath();
        ctx.moveTo(cx + sx * (b + 3), cy + sy * 1.5);
        ctx.lineTo(cx + sx * (b + 3 + len), cy + sy * 1.5);
        if (!broken) {
            ctx.moveTo(cx + sx * 1.5, cy + sy * (b + 3));
            ctx.lineTo(cx + sx * 1.5, cy + sy * (b + 3 + len * 0.6));
        }
        ctx.stroke();
        diamond(ctx, cx + sx * (b * 0.55 + 1), cy + sy * (b * 0.55 + 1), gold ? 2.2 : 1.6);
        ctx.fill();
        ctx.restore();
    });
}

/** The Heaven accent: a lit lozenge on the top edge with lines fading out each side. */
function drawCrest(ctx: Ctx, cx: number, cy: number, half: number, t: UiTheme, time: number, roll: number, focus: number): void {
    const color = ornamentColor(t, roll * 0.6);
    const a = glowAlpha(t, time, 7);
    ctx.save();
    const g = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
    g.addColorStop(0, css(color, 0));
    g.addColorStop(0.5, css(color, 0.9));
    g.addColorStop(1, css(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - half, cy - 0.5, half * 2, 1.5);
    ctx.shadowColor = css(t.glow, a + 0.2 * focus);
    ctx.shadowBlur = t.glowBlur;
    ctx.fillStyle = css(mix(color, WHITE, 0.35 * (1 - t.tarnish)), 1);
    diamond(ctx, cx, cy + 0.5, 3.6);
    ctx.fill();
    ctx.restore();
}

/**
 * Red veins crawl in from the corners along the frame band, with short twigs
 * reaching inward. Their length grows with `amount`, so they creep rather
 * than appear.
 */
export function drawVeins(ctx: Ctx, x: number, y: number, w: number, h: number, amount: number, t: UiTheme, time: number, seed: number): void {
    const r = rng(seed * 7 + 3);
    const small = Math.min(w, h) < 80;
    const band = Math.min(8, h * 0.16);
    const all: Array<{ px: number; py: number; dx: number; dy: number; nx: number; ny: number; span: number }> = [
        { px: x + 3, py: y + 3, dx: 1, dy: 0, nx: 0, ny: 1, span: w },
        { px: x + w - 3, py: y + h - 3, dx: 0, dy: -1, nx: -1, ny: 0, span: h },
        { px: x + 3, py: y + 3, dx: 0, dy: 1, nx: 1, ny: 0, span: h },
        { px: x + w - 3, py: y + h - 3, dx: -1, dy: 0, nx: 0, ny: -1, span: w },
        { px: x + w - 3, py: y + 3, dx: -1, dy: 0, nx: 0, ny: 1, span: w },
        { px: x + 3, py: y + h - 3, dx: 1, dy: 0, nx: 0, ny: -1, span: w },
    ];
    const starts = small ? all.slice(0, 2) : all;
    const strength = small ? amount * 0.6 : amount;
    const pulse = 0.85 + 0.15 * Math.sin(time * 1.6 + seed);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    starts.forEach((s, i) => {
        // later veins only start once the first ones are well along
        const lag = i * 0.09;
        const own = clamp((strength - lag) / (1 - lag));
        if (own <= 0) return;
        const length = own * s.span * (0.22 + r() * 0.2);
        const step = 4;
        const pts: Array<[number, number]> = [[s.px, s.py]];
        let off = 1 + r() * 2;
        let drift = 0;
        for (let d = step; d <= length; d += step) {
            drift = clamp(drift + (r() - 0.5) * 1.4, -1.6, 1.6);
            off = clamp(off + drift, 0.5, band);
            pts.push([s.px + s.dx * d + s.nx * off, s.py + s.dy * d + s.ny * off]);
        }
        if (pts.length < 3) return;
        // taper: thick and bright at the root, fading toward the tip
        const n = pts.length - 1;
        ctx.shadowColor = css(t.danger, 0.4 * own);
        ctx.shadowBlur = 4;
        for (let k = 0; k < n; k++) {
            const f = 1 - k / n;
            ctx.strokeStyle = css(t.vein, (0.2 + 0.5 * own) * pulse * (0.25 + 0.75 * f));
            ctx.lineWidth = 0.45 + 0.75 * own * f;
            ctx.beginPath();
            ctx.moveTo(pts[k][0], pts[k][1]);
            ctx.lineTo(pts[k + 1][0], pts[k + 1][1]);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        // a few fine twigs reaching inward
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = css(t.vein, 0.4 * own * pulse);
        ctx.beginPath();
        for (let k = 3; k < n; k += 5 + Math.floor(r() * 5)) {
            const [px, py] = pts[k];
            const len = 2 + r() * 4 * own;
            const side = r() < 0.5 ? -0.7 : 0.7;
            ctx.moveTo(px, py);
            ctx.lineTo(px + s.nx * len + s.dx * len * side, py + s.ny * len + s.dy * len * side);
        }
        ctx.stroke();
        if (own > 0.65) {
            // a hot core near the root at the highest tiers
            ctx.strokeStyle = css(mix(t.danger, t.goldBright, 0.35), (own - 0.65) * 0.9 * pulse);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (const p of pts.slice(0, Math.max(2, Math.floor(n * 0.35)))) ctx.lineTo(p[0], p[1]);
            ctx.stroke();
        }
    });
    ctx.restore();
}

/** Hairline fissures across the frame line, with ember showing through. */
export function drawCracks(ctx: Ctx, x: number, y: number, w: number, h: number, t: UiTheme, time: number, seed: number): void {
    const r = rng(seed * 11 + 5);
    const count = Math.round(t.cracks * Math.max(2, Math.min(6, (w + h) / 140)));
    ctx.save();
    ctx.lineJoin = "miter";
    for (let i = 0; i < count; i++) {
        const edge = Math.floor(r() * 4);
        const along = 0.15 + r() * 0.7;
        let px = 0;
        let py = 0;
        let nx = 0;
        let ny = 0;
        if (edge === 0) [px, py, nx, ny] = [x + w * along, y, 0, 1];
        else if (edge === 1) [px, py, nx, ny] = [x + w, y + h * along, -1, 0];
        else if (edge === 2) [px, py, nx, ny] = [x + w * along, y + h, 0, -1];
        else [px, py, nx, ny] = [x, y + h * along, 1, 0];
        const depth = 4 + r() * 6;
        const pts: Array<[number, number]> = [];
        for (let k = 0; k <= 4; k++) {
            const d = -1 + (k / 4) * (depth + 1);
            const j = (r() - 0.5) * 3.2;
            pts.push([px + nx * d + ny * j, py + ny * d + nx * j]);
        }
        const path = () => {
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (const p of pts) ctx.lineTo(p[0], p[1]);
        };
        ctx.strokeStyle = css(t.ink, 0.95);
        ctx.lineWidth = 2.2;
        path();
        ctx.stroke();
        const ember = 0.5 + 0.5 * flickerNoise(time * 0.6, i + seed);
        ctx.strokeStyle = css(mix(t.danger, t.goldBright, 0.45), (0.35 + 0.45 * t.cracks) * ember);
        ctx.shadowColor = css(t.danger, 0.6 * t.cracks);
        ctx.shadowBlur = 4;
        ctx.lineWidth = 0.7;
        path();
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}

/** A thin rule with a lit centre, used to separate a heading from its body. */
export function drawRule(ctx: Ctx, x: number, y: number, w: number, t: UiTheme, alpha = 0.6): void {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, css(t.gold, 0));
    g.addColorStop(0.5, css(t.gold, alpha));
    g.addColorStop(1, css(t.gold, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, 1);
}

// ------------------------------------------------------------------ bars

export interface BarOptions {
    x: number;
    y: number;
    w: number;
    h: number;
    fill: number;
    trail?: number;
    gain?: number;
    /** healable cap; the rest of the bar is hatched ash */
    cap?: number;
    colors: BarColors;
    theme: UiTheme;
    time: number;
    level?: PostureLevel;
    /** a notch, as a share of the bar, such as the 40 Outcry mark */
    notch?: number;
    notchLit?: boolean;
    /** pulse the edges, for low HP */
    alarm?: boolean;
}

export function drawBar(ctx: Ctx, o: BarOptions): void {
    const { x, y, w, h, theme: t, time } = o;
    const fill = clamp(o.fill);
    const cap = clamp(o.cap ?? 1);

    ctx.save();
    // track
    ctx.fillStyle = css(t.bars.track, 0.92);
    ctx.fillRect(x, y, w, h);
    const inner = ctx.createLinearGradient(0, y, 0, y + h);
    inner.addColorStop(0, css(t.ink, 0.55));
    inner.addColorStop(1, css(t.ink, 0));
    ctx.fillStyle = inner;
    ctx.fillRect(x, y, w, h);

    // unhealable part, after the halo dims
    if (cap < 1) {
        const cx = x + w * cap;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx, y, x + w - cx, h);
        ctx.clip();
        ctx.fillStyle = css(ASH, 0.22);
        ctx.fillRect(cx, y, x + w - cx, h);
        ctx.strokeStyle = css(ASH, 0.55);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = cx - h; k < x + w; k += 4) {
            ctx.moveTo(k, y + h);
            ctx.lineTo(k + h, y);
        }
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = css(ASH, 0.9);
        ctx.fillRect(Math.round(cx) - 0.5, y - 1, 1, h + 2);
    }

    const trail = clamp(o.trail ?? fill);
    if (trail > fill) {
        ctx.fillStyle = css(t.bars.trail, 0.85);
        ctx.fillRect(x + w * fill, y, w * (trail - fill), h);
    }
    const gain = clamp(o.gain ?? fill);
    if (gain > fill) {
        ctx.fillStyle = css(WHITE, 0.28);
        ctx.fillRect(x + w * fill, y, w * (gain - fill), h);
    }

    let hi = o.colors.hi;
    let lo = o.colors.lo;
    if (o.level === "warning") {
        hi = mix(hi, t.warning, 0.55);
        lo = mix(lo, t.warning, 0.8);
    } else if (o.level === "danger") {
        hi = mix(t.danger, WHITE, 0.25);
        lo = t.danger;
    }
    if (fill > 0) {
        const fw = w * fill;
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, css(hi));
        g.addColorStop(1, css(lo));
        ctx.fillStyle = g;
        ctx.fillRect(x, y, fw, h);
        if (h >= 6) {
            ctx.fillStyle = css(WHITE, 0.35);
            ctx.fillRect(x, y, fw, 1);
        }
        // a lit leading edge
        ctx.shadowColor = css(o.level === "danger" ? t.danger : t.glow, 0.8);
        ctx.shadowBlur = 6;
        ctx.fillStyle = css(mix(hi, WHITE, 0.6));
        ctx.fillRect(x + fw - 1.5, y, 1.5, h);
        ctx.shadowBlur = 0;
    }

    if (o.notch !== undefined) {
        const nx = Math.round(x + w * clamp(o.notch)) + 0.5;
        const lit = !!o.notchLit;
        ctx.save();
        if (lit) {
            ctx.shadowColor = css(t.glow, glowAlpha(t, time, 3) + 0.25);
            ctx.shadowBlur = 8;
        }
        ctx.fillStyle = css(lit ? t.goldBright : mix(t.gold, t.ink, 0.3), lit ? 1 : 0.85);
        ctx.fillRect(nx - 0.5, y - 3, 1.5, h + 6);
        diamond(ctx, nx + 0.25, y - 4, lit ? 2.6 : 2);
        ctx.fill();
        ctx.restore();
    }

    // an ink keyline; only the thick bars also get a gold line, or thin ones turn into stripes
    ctx.strokeStyle = css(t.ink, 0.95);
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    if (h >= 6) {
        ctx.strokeStyle = o.alarm
            ? css(mix(t.gold, t.danger, 0.7), 0.45 + 0.45 * (0.5 + 0.5 * Math.sin(time * 6)))
            : css(t.gold, 0.38);
        ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
    }
    ctx.restore();
}

// ------------------------------------------------------------------ halo

/**
 * The halo: lives set its brightness; Stain sets its cracks and the red that
 * seeps out of them. A thin outer track shows Stain toward the Fall with the
 * 25, 50 and 75 thresholds ticked.
 */
export function drawHalo(ctx: Ctx, cx: number, cy: number, radius: number, halo: HaloState, t: UiTheme, time: number, seed = 41): void {
    const r = rng(seed);
    const ringW = radius * 0.17;
    const bright = halo.brightness;
    const flick = halo.flicker ? 0.75 + 0.25 * flickerNoise(time * 1.4, 9) : 1;
    const goldCore = mix(hex("#fff6dc"), t.goldBright, 0.35);
    const redCore = hex("#ff3a22");
    const redDeep = hex("#7a0f0a");
    const glowColor = mix(mix(t.glow, hex("#ffe9b0"), 0.5 * (1 - t.tarnish)), redCore, halo.red);

    ctx.save();
    // medallion
    const disc = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.45);
    disc.addColorStop(0, css(mix(t.panel, t.panelDeep, 0.4)));
    disc.addColorStop(1, css(t.panelDeep));
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.42, 0, Math.PI * 2);
    ctx.fill();

    // bloom behind the ring
    const bloom = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius * 1.4);
    bloom.addColorStop(0, css(glowColor, 0));
    bloom.addColorStop(0.45, css(glowColor, 0.34 * bright * flick));
    bloom.addColorStop(1, css(glowColor, 0));
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // crack angles, fixed per halo
    const cracks: number[] = [];
    for (let i = 0; i < 8; i++) cracks.push(-Math.PI / 2 + (i / 8) * Math.PI * 2 + (r() - 0.5) * 0.6);
    const used = cracks.slice(0, halo.crackCount);

    const shatter = halo.shattered ? 1 : 0;
    const segments = halo.shattered ? 9 : 1;
    for (let sIdx = 0; sIdx < segments; sIdx++) {
        const a0 = halo.shattered ? (sIdx / segments) * Math.PI * 2 + 0.06 : 0;
        const a1 = halo.shattered ? ((sIdx + 1) / segments) * Math.PI * 2 - 0.06 : Math.PI * 2;
        const push = shatter * (2 + r() * 3);
        const mid = (a0 + a1) / 2;
        const ox = Math.cos(mid) * push;
        const oy = Math.sin(mid) * push;
        // base ring, gold
        ctx.save();
        ctx.shadowColor = css(glowColor, Math.min(1, 0.9 * bright * flick));
        ctx.shadowBlur = 10 + 6 * bright;
        ctx.lineWidth = ringW;
        ctx.lineCap = "butt";
        const gg = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
        gg.addColorStop(0, css(mix(goldCore, WHITE, 0.3), 0.25 + 0.75 * bright));
        gg.addColorStop(1, css(mix(goldCore, t.gold, 0.6), 0.2 + 0.8 * bright));
        ctx.strokeStyle = gg;
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, radius, a0, a1);
        ctx.stroke();
        ctx.restore();
    }

    // red seeps out from each crack; with no cracks it spreads from the top
    if (halo.red > 0) {
        const sources = used.length ? used : [-Math.PI / 2];
        const span = (halo.red * Math.PI * 2) / sources.length / 2;
        ctx.save();
        ctx.lineWidth = ringW + 0.5;
        ctx.shadowColor = css(redCore, 0.8 * flick);
        ctx.shadowBlur = 8;
        for (const a of sources) {
            const g = ctx.createRadialGradient(cx, cy, radius - ringW, cx, cy, radius + ringW);
            g.addColorStop(0, css(redDeep, 0.9 * flick));
            g.addColorStop(0.5, css(redCore, 0.95 * flick));
            g.addColorStop(1, css(redDeep, 0.9 * flick));
            ctx.strokeStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, a - span, a + span);
            ctx.stroke();
        }
        ctx.restore();
    }

    // inner and outer hairlines of the ring
    ctx.strokeStyle = css(t.ink, 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - ringW / 2 - 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // cracks
    for (const a of used) {
        const depth = halo.crackDepth;
        const inner = radius - ringW / 2 - depth * ringW * 0.6;
        const outer = radius + ringW / 2 + depth * ringW * 0.6;
        const pts: Array<[number, number]> = [];
        for (let k = 0; k <= 4; k++) {
            const rr = inner + ((outer - inner) * k) / 4;
            const j = (r() - 0.5) * 0.07;
            pts.push([cx + Math.cos(a + j) * rr, cy + Math.sin(a + j) * rr]);
        }
        ctx.lineWidth = 0.8 + depth * 1.4;
        ctx.strokeStyle = css(t.ink, 0.95);
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (const p of pts) ctx.lineTo(p[0], p[1]);
        ctx.stroke();
        if (halo.red > 0.06) {
            ctx.lineWidth = 0.6;
            ctx.strokeStyle = css(mix(redCore, hex("#ffb070"), 0.4), 0.7 * flick);
            ctx.stroke();
        }
    }

    // embers off the ring from 50 Stain
    if (halo.embers) {
        for (let i = 0; i < 7; i++) {
            const life = 1.8 + r() * 1.4;
            const phase = ((time + r() * life) % life) / life;
            const a = -Math.PI / 2 + (r() - 0.5) * 2.4;
            const px = cx + Math.cos(a) * radius + Math.sin(time * 2 + i) * 2;
            const py = cy + Math.sin(a) * radius - phase * radius * 0.9;
            ctx.fillStyle = css(mix(hex("#ffb060"), redCore, phase), (1 - phase) * 0.9);
            ctx.beginPath();
            ctx.arc(px, py, 0.8 + (1 - phase) * 0.9, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Stain track
    const tr = radius * 1.32;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = css(t.gold, 0.22);
    ctx.beginPath();
    ctx.arc(cx, cy, tr, 0, Math.PI * 2);
    ctx.stroke();
    if (t.personal.stain > 0) {
        ctx.save();
        ctx.strokeStyle = css(mix(hex("#ff8a5a"), redCore, halo.red), 0.9);
        ctx.shadowColor = css(redCore, 0.6);
        ctx.shadowBlur = 4;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, tr, -Math.PI / 2, -Math.PI / 2 + t.personal.stain * Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    for (const mark of [0.25, 0.5, 0.75]) {
        const a = -Math.PI / 2 + mark * Math.PI * 2;
        const passed = t.personal.stain >= mark;
        ctx.strokeStyle = css(passed ? redCore : t.gold, passed ? 0.95 : 0.55);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (tr - 2), cy + Math.sin(a) * (tr - 2));
        ctx.lineTo(cx + Math.cos(a) * (tr + 2), cy + Math.sin(a) * (tr + 2));
        ctx.stroke();
    }
    // the Fall marker at the top
    ctx.fillStyle = css(t.personal.stain >= 1 ? redCore : t.goldBright, 0.9);
    diamond(ctx, cx, cy - tr, 2.4);
    ctx.fill();
    ctx.restore();
}

/** Life pips under the halo: lit for each life left. */
export function drawLives(ctx: Ctx, cx: number, cy: number, halo: HaloState, t: UiTheme, time: number): void {
    const gap = 11;
    for (let i = 0; i < halo.maxLives; i++) {
        const x = cx + (i - (halo.maxLives - 1) / 2) * gap;
        const lit = i < halo.lives;
        ctx.save();
        if (lit) {
            ctx.shadowColor = css(t.glow, glowAlpha(t, time, i + 20) + 0.2);
            ctx.shadowBlur = 6;
        }
        ctx.fillStyle = css(lit ? mix(t.goldBright, WHITE, 0.3) : t.bars.track, lit ? 1 : 0.9);
        diamond(ctx, x, cy, 3.4);
        ctx.fill();
        ctx.strokeStyle = css(t.gold, lit ? 0.9 : 0.5);
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
    }
}

// ----------------------------------------------------------- cooldowns

/** Darken the part of a tile still cooling, sweeping clockwise from the top. */
export function drawSweep(ctx: Ctx, cx: number, cy: number, radius: number, remaining: number, color: string): void {
    if (remaining <= 0) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const start = -Math.PI / 2 + (1 - remaining) * Math.PI * 2;
    ctx.arc(cx, cy, radius, start, -Math.PI / 2 + Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

export type GlyphFn = (ctx: Ctx, cx: number, cy: number, s: number) => void;

/** A small diamond tile with a glyph: the roll, parry, block, feint and Trumpet icons. */
export function drawCooldownTile(ctx: Ctx, cx: number, cy: number, size: number, glyph: GlyphFn, view: CooldownView, t: UiTheme, time: number): void {
    const r = size / 2;
    ctx.save();
    ctx.fillStyle = css(t.panelDeep, 0.9);
    diamond(ctx, cx, cy, r);
    ctx.fill();
    ctx.save();
    diamond(ctx, cx, cy, r);
    ctx.clip();
    if (view.state === "cooling") drawSweep(ctx, cx, cy, r * 1.5, view.remaining, css(t.danger, 0.28));
    ctx.restore();
    const ready = view.state === "ready";
    if (ready && view.flash > 0) {
        ctx.shadowColor = css(t.glow, view.flash);
        ctx.shadowBlur = 12;
    }
    ctx.strokeStyle = css(
        view.state === "cooling" ? mix(t.gold, t.danger, 0.55) : t.gold,
        view.state === "locked" ? 0.25 : ready ? 0.75 + 0.25 * view.flash : 0.55,
    );
    ctx.lineWidth = 1;
    diamond(ctx, cx, cy, r - 0.5);
    ctx.stroke();
    ctx.shadowBlur = 0;
    const glyphColor = view.state === "locked" ? css(t.textDim, 0.3) : ready ? css(mix(t.text, t.goldBright, 0.25 + 0.5 * view.flash)) : css(mix(t.textDim, t.danger, 0.35), 0.7);
    ctx.strokeStyle = glyphColor;
    ctx.fillStyle = glyphColor;
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    glyph(ctx, cx, cy, size * 0.42);
    void time;
    ctx.restore();
}

// ------------------------------------------------------------------ slots

export interface SlotPaint {
    x: number;
    y: number;
    size: number;
    key: string;
    glyph: GlyphFn | null;
    /** Grace cost, shown bottom-right */
    cost?: number;
    affordable?: boolean;
    cooldown?: CooldownView;
    active?: boolean;
    theme: UiTheme;
    time: number;
    seed: number;
}

export function drawSlot(ctx: Ctx, o: SlotPaint): void {
    const { x, y, size: s, theme: t } = o;
    const empty = !o.glyph;
    drawFrame(ctx, { x, y, w: s, h: s, theme: t, time: o.time, seed: o.seed, bevel: 5, focus: o.active ? 1 : 0, fillAlpha: empty ? 0.55 : 1 });
    if (o.glyph) {
        const cooling = o.cooldown?.state === "cooling";
        const dim = o.affordable === false || cooling;
        const c = dim ? css(t.textDim, cooling ? 0.28 : 0.55) : css(mix(t.text, t.goldBright, 0.15));
        ctx.save();
        ctx.strokeStyle = c;
        ctx.fillStyle = c;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        o.glyph(ctx, x + s / 2, y + s / 2 + 1, s * 0.3);
        ctx.restore();
    }
    if (o.cooldown && o.cooldown.state === "cooling") {
        ctx.save();
        bevelPath(ctx, x + 2, y + 2, s - 4, s - 4, 4);
        ctx.clip();
        drawSweep(ctx, x + s / 2, y + s / 2, s, o.cooldown.remaining, css(t.ink, 0.66));
        ctx.restore();
        const plate = ctx.createRadialGradient(x + s / 2, y + s / 2, 0, x + s / 2, y + s / 2, s * 0.36);
        plate.addColorStop(0, css(t.ink, 0.85));
        plate.addColorStop(1, css(t.ink, 0));
        ctx.fillStyle = plate;
        ctx.fillRect(x, y, s, s);
        font(ctx, FAMILY.uiBold, Math.round(s * 0.29));
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        inkText(ctx, o.cooldown.label, x + s / 2, y + s / 2 + 1, css(t.text), t, 4);
    } else if (o.cooldown && o.cooldown.flash > 0) {
        ctx.save();
        ctx.shadowColor = css(t.glow, o.cooldown.flash);
        ctx.shadowBlur = 14;
        ctx.strokeStyle = css(t.goldBright, o.cooldown.flash);
        bevelPath(ctx, x + 1, y + 1, s - 2, s - 2, 5);
        ctx.stroke();
        ctx.restore();
    }
    font(ctx, FAMILY.uiBold, 10);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    inkText(ctx, o.key, x + 6, y + 5, css(t.textDim, empty ? 0.6 : 0.95), t, 2);
    if (o.cost !== undefined && !empty) {
        font(ctx, FAMILY.ui, 9.5);
        ctx.textAlign = "right";
        ctx.textBaseline = "alphabetic";
        const col = o.affordable === false ? css(t.danger, 0.9) : css(t.bars.grace.hi, 0.9);
        inkText(ctx, String(o.cost), x + s - 6, y + s - 5, col, t, 2);
    }
}

// ------------------------------------------------------------ gift cards

export type Rarity = "common" | "rare" | "advanced";

export interface GiftCardPaint {
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    rarity: Rarity;
    category: string;
    text: string;
    requirement: string;
    glyph: GlyphFn;
    /** a Fallen Gift, from the Hell pool */
    fallen?: boolean;
    hover?: number;
    theme: UiTheme;
    time: number;
    seed: number;
}

const RARITY = {
    common: { label: "Common", line: hex("#a9a49a"), accent: hex("#d8d2c6") },
    rare: { label: "Rare", line: hex("#d6b062"), accent: hex("#f4d88e") },
    advanced: { label: "Advanced", line: hex("#fff0c8"), accent: hex("#ffffff") },
};

export function rarityLabel(r: Rarity): string {
    return RARITY[r].label;
}

/** A Gift card. The frame grows richer with rarity and tarnishes with the theme like any panel. */
export function drawGiftCard(ctx: Ctx, o: GiftCardPaint): void {
    const { x, y, w, h, theme: t, time } = o;
    const hover = o.hover ?? 0;
    const spec = RARITY[o.rarity];
    const tint = (c: Rgb) => mix(c, o.fallen ? t.danger : t.gold, o.fallen ? 0.7 : t.tarnish * 0.7);
    const line = tint(spec.line);
    const accent = tint(spec.accent);

    if (o.rarity !== "common" || o.fallen) {
        ctx.save();
        // the radius stays inside the filled rect so the glow never shows an edge
        const halo = ctx.createRadialGradient(x + w / 2, y + h * 0.3, 10, x + w / 2, y + h * 0.3, Math.min(w / 2, h * 0.3) + 28);
        const gc = o.fallen ? t.danger : o.rarity === "advanced" ? mix(t.glow, WHITE, 0.4 * (1 - t.tarnish)) : t.glow;
        halo.addColorStop(0, css(gc, (o.rarity === "advanced" ? 0.22 : 0.12) + 0.1 * hover));
        halo.addColorStop(1, css(gc, 0));
        ctx.fillStyle = halo;
        ctx.fillRect(x - 30, y - 30, w + 60, h + 60);
        ctx.restore();
    }

    drawFrame(ctx, { x, y, w, h, theme: t, time, seed: o.seed, bevel: 9, focus: hover, line, crest: o.rarity !== "common" });
    if (o.rarity === "advanced") {
        ctx.save();
        ctx.strokeStyle = css(line, 0.5 + 0.3 * hover);
        ctx.lineWidth = 1;
        bevelPath(ctx, x + 6.5, y + 6.5, w - 13, h - 13, 5);
        ctx.stroke();
        ctx.restore();
    }

    // rarity label
    font(ctx, FAMILY.ui, 9);
    setSpacing(ctx, 2.2);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    inkText(ctx, (o.fallen ? "Fallen · " : "") + spec.label.toUpperCase(), x + w / 2, y + 22, css(accent, 0.9), t, 2);
    setSpacing(ctx, 0);

    // medallion with the glyph
    const mx = x + w / 2;
    const my = y + h * 0.28;
    const mr = Math.min(w, h) * 0.17;
    ctx.save();
    const md = ctx.createRadialGradient(mx, my - mr * 0.3, 2, mx, my, mr * 1.1);
    md.addColorStop(0, css(mix(t.panel, accent, 0.18), 0.95));
    md.addColorStop(1, css(t.panelDeep, 0.95));
    ctx.fillStyle = md;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = css(line, 0.75);
    ctx.lineWidth = 1;
    ctx.stroke();
    if (o.rarity !== "common") {
        ctx.strokeStyle = css(line, 0.3);
        ctx.beginPath();
        ctx.arc(mx, my, mr + 4, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.shadowColor = css(o.fallen ? t.danger : t.glow, glowAlpha(t, time, o.seed) * (o.rarity === "common" ? 0.5 : 1));
    ctx.shadowBlur = 10;
    ctx.strokeStyle = css(mix(accent, WHITE, 0.2));
    ctx.fillStyle = css(mix(accent, WHITE, 0.2));
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    o.glyph(ctx, mx, my, mr * 0.55);
    ctx.restore();

    // name
    font(ctx, FAMILY.displayBold, 15);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const nameLines = wrapText(ctx, o.name, w - 26);
    const nameY = y + h * 0.48;
    nameLines.forEach((l, i) => inkText(ctx, l, mx, nameY + i * 18, css(t.heading), t));
    const afterName = nameY + (nameLines.length - 1) * 18;
    font(ctx, FAMILY.ui, 9.5);
    setSpacing(ctx, 1.5);
    inkText(ctx, o.category.toUpperCase(), mx, afterName + 16, css(t.textDim), t, 2);
    setSpacing(ctx, 0);
    drawRule(ctx, x + 18, afterName + 25, w - 36, t, 0.5);

    // step the body text down until it fits above the requirement line
    const top = afterName + 43;
    const room = y + h - 34 - top;
    let bodyLines: string[] = [];
    let lh = 16;
    for (const [size, step] of [[14, 16], [13, 14.5], [12, 13.5]]) {
        font(ctx, FAMILY.body, size);
        bodyLines = wrapText(ctx, o.text, w - 28);
        lh = step;
        if ((bodyLines.length - 1) * lh <= room) break;
    }
    const fit = Math.max(1, Math.floor(room / lh) + 1);
    if (bodyLines.length > fit) {
        bodyLines = bodyLines.slice(0, fit);
        bodyLines[fit - 1] = bodyLines[fit - 1].replace(/\s*\S*$/, "") + "…";
    }
    bodyLines.forEach((l, i) => inkText(ctx, l, mx, top + i * lh, css(t.text, 0.92), t, 2));

    font(ctx, FAMILY.bodyItalic, 13);
    inkText(ctx, o.requirement, mx, y + h - 14, css(t.textDim), t, 2);
}

// ------------------------------------------------------------- key caps

/** A small key cap, such as [E] in the interaction prompt. */
export function drawKeyCap(ctx: Ctx, x: number, y: number, label: string, t: UiTheme, time: number, size = 22): number {
    font(ctx, FAMILY.uiBold, Math.round(size * 0.5));
    const w = Math.max(size, ctx.measureText(label).width + size * 0.6);
    ctx.save();
    ctx.shadowColor = css(t.glow, glowAlpha(t, time, 31) * 0.8);
    ctx.shadowBlur = 8;
    ctx.fillStyle = css(t.panelDeep, 0.95);
    bevelPath(ctx, x, y, w, size, 3);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = css(t.goldBright, 0.85);
    ctx.lineWidth = 1;
    bevelPath(ctx, x + 0.5, y + 0.5, w - 1, size - 1, 3);
    ctx.stroke();
    ctx.restore();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    inkText(ctx, label, x + w / 2, y + size / 2 + 0.5, css(t.text), t, 2);
    return w;
}
