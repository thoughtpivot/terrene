import { Canvas, Color, ImageFiltering, Scene, ScreenElement, vec } from "excalibur";
import { css, mix } from "./color";
import { GLYPHS, GlyphName } from "./icons";
import {
    BarTracker,
    CooldownView,
    HALO_MARK_LABELS,
    ToastQueue,
    cooldownView,
    fervourView,
    haloState,
    hpView,
    postureView,
    ratio,
    tierView,
    toastAlpha,
    typewriter,
} from "./hudState";
import {
    Ctx,
    FAMILY,
    Rarity,
    bevelPath,
    drawBar,
    drawCooldownTile,
    drawFrame,
    drawGiftCard,
    drawHalo,
    drawKeyCap,
    drawLives,
    drawRule,
    drawSlot,
    font,
    glowAlpha,
    inkText,
    setSpacing,
    wrapText,
} from "./paint";
import { UiTheme, themeFor } from "./theme";

/** Decorative effects redraw at this rate; state changes redraw at once. */
const EFFECT_FPS = 30;

let measureCtx: Ctx | null = null;
/** A scratch context for measuring text before a widget's canvas exists. */
export function measure(): Ctx {
    if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d") as Ctx;
    return measureCtx;
}

export interface WidgetOptions {
    x?: number;
    y?: number;
    w: number;
    h: number;
    z?: number;
    /** room around the widget for glows, in reference px */
    pad?: number;
    seed?: number;
}

/**
 * A UI widget: one ScreenElement showing one Canvas raster. Widgets paint in
 * reference pixels (the 1280x720 design size); `place()` scales them, and the
 * raster's quality follows the screen's pixel ratio times that scale, so
 * lines and text land on device pixels and stay sharp.
 */
export abstract class UiWidget {
    readonly element: ScreenElement;
    readonly canvas: Canvas;
    x: number;
    y: number;
    w: number;
    h: number;
    scale = 1;
    theme: UiTheme = themeFor(0, 0);
    time = 0;
    protected seed: number;
    protected pad: number;
    private pixelRatio = 1;
    private sinceDraw = 0;
    private forced = true;

    constructor(o: WidgetOptions) {
        this.x = o.x ?? 0;
        this.y = o.y ?? 0;
        this.w = o.w;
        this.h = o.h;
        this.pad = o.pad ?? 18;
        this.seed = o.seed ?? Math.floor(Math.random() * 1e6);
        this.canvas = new Canvas({
            width: this.w + this.pad * 2,
            height: this.h + this.pad * 2,
            cache: true,
            quality: 2,
            smoothing: true,
            filtering: ImageFiltering.Blended,
            draw: (ctx) => {
                ctx.save();
                ctx.translate(this.pad, this.pad);
                this.paint(ctx);
                ctx.restore();
            },
        });
        this.element = new ScreenElement({ x: this.x - this.pad, y: this.y - this.pad, z: o.z ?? 100 });
        this.element.graphics.use(this.canvas);
    }

    protected abstract paint(ctx: Ctx): void;

    /** Whether the widget has time-based effects at the current theme. */
    protected animated(): boolean {
        const t = this.theme;
        return t.veins > 0 || t.flicker > 0 || t.cracks > 0 || t.heat > 0;
    }

    addTo(scene: Scene): this {
        scene.add(this.element);
        return this;
    }

    place(x: number, y: number, scale = this.scale, pixelRatio = this.pixelRatio): this {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.pixelRatio = pixelRatio;
        this.element.pos = vec(x - this.pad * scale, y - this.pad * scale);
        this.element.scale = vec(scale, scale);
        this.canvas.quality = Math.max(1, pixelRatio * scale);
        this.invalidate();
        return this;
    }

    resize(w: number, h: number): void {
        this.w = w;
        this.h = h;
        this.canvas.width = w + this.pad * 2;
        this.canvas.height = h + this.pad * 2;
        this.invalidate();
    }

    setTheme(theme: UiTheme): void {
        this.theme = theme;
        this.invalidate();
    }

    set visible(v: boolean) {
        this.element.graphics.isVisible = v;
    }

    get visible(): boolean {
        return this.element.graphics.isVisible;
    }

    set opacity(v: number) {
        this.element.graphics.opacity = v;
    }

    /** Hit test in screen coordinates. */
    contains(px: number, py: number): boolean {
        return this.visible && px >= this.x && py >= this.y && px <= this.x + this.w * this.scale && py <= this.y + this.h * this.scale;
    }

    /** Screen point to the widget's reference coordinates. */
    local(px: number, py: number): { x: number; y: number } {
        return { x: (px - this.x) / this.scale, y: (py - this.y) / this.scale };
    }

    invalidate(): void {
        this.forced = true;
    }

    update(dt: number): void {
        this.time += dt;
        this.sinceDraw += dt;
        if (this.forced || (this.animated() && this.sinceDraw >= 1 / EFFECT_FPS)) {
            this.forced = false;
            this.sinceDraw = 0;
            this.canvas.flagDirty();
        }
    }

    destroy(): void {
        this.element.kill();
    }
}

// =================================================================== kit

/** A framed panel with an optional title and body text. */
export class Panel extends UiWidget {
    title: string;
    subtitle: string;
    body: string;
    crest = true;

    constructor(o: WidgetOptions & { title?: string; subtitle?: string; body?: string }) {
        super(o);
        this.title = o.title ?? "";
        this.subtitle = o.subtitle ?? "";
        this.body = o.body ?? "";
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, crest: this.crest, bevel: 10 });
        let y = 36;
        if (this.title) {
            font(ctx, FAMILY.displayBold, 18);
            setSpacing(ctx, 3);
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            inkText(ctx, this.title.toUpperCase(), this.w / 2, y, css(t.heading), t);
            setSpacing(ctx, 0);
            y += 18;
            if (this.subtitle) {
                font(ctx, FAMILY.bodyItalic, 15);
                inkText(ctx, this.subtitle, this.w / 2, y, css(t.textDim), t, 2);
                y += 10;
            }
            drawRule(ctx, 30, y, this.w - 60, t, 0.55);
            y += 26;
        }
        if (this.body) {
            font(ctx, FAMILY.body, 16);
            ctx.textAlign = "left";
            for (const l of wrapText(ctx, this.body, this.w - 56)) {
                inkText(ctx, l, 28, y, css(t.text, 0.92), t, 2);
                y += 21;
            }
        }
    }
}

export type ButtonState = "normal" | "hover" | "pressed" | "disabled";

export class Button extends UiWidget {
    label: string;
    state: ButtonState = "normal";
    hint: string;
    onClick: (() => void) | null = null;
    private hoverT = 0;

    constructor(o: WidgetOptions & { label: string; hint?: string }) {
        super({ pad: 14, ...o });
        this.label = o.label;
        this.hint = o.hint ?? "";
    }

    setState(s: ButtonState): void {
        if (s === this.state) return;
        this.state = s;
        this.invalidate();
    }

    protected animated(): boolean {
        return super.animated() || (this.hoverT > 0 && this.hoverT < 1);
    }

    update(dt: number): void {
        const target = this.state === "hover" || this.state === "pressed" ? 1 : 0;
        const before = this.hoverT;
        this.hoverT += Math.sign(target - this.hoverT) * Math.min(Math.abs(target - this.hoverT), dt * 6);
        if (before !== this.hoverT) this.invalidate();
        super.update(dt);
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        const disabled = this.state === "disabled";
        const pressed = this.state === "pressed";
        const h = this.hoverT;
        drawFrame(ctx, {
            x: 0,
            y: pressed ? 1 : 0,
            w: this.w,
            h: this.h,
            theme: t,
            time: this.time,
            seed: this.seed,
            bevel: 6,
            focus: disabled ? 0 : h,
            crest: h > 0.05 && !disabled,
            fillAlpha: disabled ? 0.6 : 1,
            line: disabled ? mix(t.gold, t.ink, 0.5) : undefined,
        });
        if (h > 0 && !disabled) {
            const g = ctx.createRadialGradient(this.w / 2, this.h, 4, this.w / 2, this.h, this.w * 0.6);
            g.addColorStop(0, css(t.glow, 0.14 * h));
            g.addColorStop(1, css(t.glow, 0));
            ctx.save();
            bevelPath(ctx, 0, 0, this.w, this.h, 6);
            ctx.clip();
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, this.w, this.h);
            ctx.restore();
        }
        font(ctx, FAMILY.displayBold, 13);
        setSpacing(ctx, 2.5);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const color = disabled ? css(t.textDim, 0.55) : css(mix(t.text, t.goldBright, 0.25 + 0.5 * h));
        inkText(ctx, this.label.toUpperCase(), this.w / 2 + 1.25, this.h / 2 + (pressed ? 2 : 1), color, t, 3);
        setSpacing(ctx, 0);
        if (this.hint) {
            font(ctx, FAMILY.ui, 9);
            ctx.textAlign = "right";
            inkText(ctx, this.hint, this.w - 9, this.h / 2 + 1, css(t.textDim, disabled ? 0.4 : 0.8), t, 2);
        }
    }
}

export interface GiftData {
    name: string;
    rarity: Rarity;
    category: string;
    text: string;
    requirement: string;
    glyph: GlyphName;
    fallen?: boolean;
}

export class GiftCard extends UiWidget {
    data: GiftData;
    hover = 0;
    selected = false;
    private target = 0;

    constructor(o: WidgetOptions & { data: GiftData }) {
        super({ pad: 34, ...o });
        this.data = o.data;
    }

    setHover(on: boolean): void {
        this.target = on ? 1 : 0;
    }

    protected animated(): boolean {
        return super.animated() || this.data.rarity !== "common" || this.hover !== this.target;
    }

    update(dt: number): void {
        this.hover += Math.sign(this.target - this.hover) * Math.min(Math.abs(this.target - this.hover), dt * 5);
        super.update(dt);
    }

    protected paint(ctx: Ctx): void {
        const lift = this.hover * 6;
        drawGiftCard(ctx, {
            x: 0,
            y: -lift,
            w: this.w,
            h: this.h,
            ...this.data,
            glyph: GLYPHS[this.data.glyph],
            hover: Math.max(this.hover, this.selected ? 1 : 0),
            theme: this.theme,
            time: this.time,
            seed: this.seed,
        });
    }
}

export class Tooltip extends UiWidget {
    title = "";
    tag = "";
    lines: string[] = [];
    footer = "";

    constructor(o: Omit<WidgetOptions, "h"> & { h?: number }) {
        super({ h: o.h ?? 100, pad: 22, ...o });
    }

    /** Set content and grow to fit it. */
    show(title: string, tag: string, body: string, footer = ""): void {
        this.title = title;
        this.tag = tag;
        this.footer = footer;
        const m = measure();
        font(m, FAMILY.body, 15);
        this.lines = wrapText(m, body, this.w - 32);
        this.resize(this.w, 58 + this.lines.length * 19 + (footer ? 24 : 6));
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, bevel: 6, fillAlpha: 1.12 });
        font(ctx, FAMILY.displayBold, 14);
        setSpacing(ctx, 1);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        inkText(ctx, this.title, 16, 26, css(t.heading), t);
        setSpacing(ctx, 0);
        font(ctx, FAMILY.ui, 9);
        setSpacing(ctx, 1.6);
        inkText(ctx, this.tag.toUpperCase(), 16, 42, css(t.textDim), t, 2);
        setSpacing(ctx, 0);
        drawRule(ctx, 10, 49, this.w - 20, t, 0.45);
        font(ctx, FAMILY.body, 15);
        this.lines.forEach((l, i) => inkText(ctx, l, 16, 68 + i * 19, css(t.text, 0.94), t, 2));
        if (this.footer) {
            font(ctx, FAMILY.bodyItalic, 13.5);
            inkText(ctx, this.footer, 16, this.h - 13, css(mix(t.goldBright, t.text, 0.3)), t, 2);
        }
    }
}

export class TabBar extends UiWidget {
    tabs: string[];
    active = 0;
    hover = -1;
    onChange: ((index: number) => void) | null = null;
    private stops: number[] = [];

    constructor(o: Omit<WidgetOptions, "h"> & { tabs: string[]; h?: number }) {
        super({ h: o.h ?? 36, pad: 16, ...o });
        this.tabs = o.tabs;
    }

    select(i: number): void {
        if (i === this.active || i < 0 || i >= this.tabs.length) return;
        this.active = i;
        this.invalidate();
        this.onChange?.(i);
    }

    setHover(i: number): void {
        if (i === this.hover) return;
        this.hover = i;
        this.invalidate();
    }

    /** Which tab a screen point is over, or -1. */
    hit(px: number, py: number): number {
        if (!this.contains(px, py)) return -1;
        const { x } = this.local(px, py);
        for (let i = 0; i < this.tabs.length; i++) if (x >= this.stops[i] && x < this.stops[i + 1]) return i;
        return -1;
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, bevel: 6, fillAlpha: 0.9 });
        const n = this.tabs.length;
        const cell = this.w / n;
        this.stops = Array.from({ length: n + 1 }, (_, i) => i * cell);
        font(ctx, FAMILY.displayBold, 12);
        setSpacing(ctx, 2.4);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        this.tabs.forEach((label, i) => {
            const cx = cell * i + cell / 2;
            const on = i === this.active;
            const hot = i === this.hover;
            if (on) {
                ctx.save();
                const g = ctx.createRadialGradient(cx, this.h, 2, cx, this.h, cell * 0.6);
                g.addColorStop(0, css(t.glow, 0.2));
                g.addColorStop(1, css(t.glow, 0));
                ctx.fillStyle = g;
                ctx.fillRect(cell * i + 4, 4, cell - 8, this.h - 8);
                ctx.shadowColor = css(t.glow, glowAlpha(t, this.time, i) + 0.2);
                ctx.shadowBlur = 8;
                ctx.fillStyle = css(t.goldBright);
                ctx.fillRect(cx - cell * 0.28, this.h - 6, cell * 0.56, 1.5);
                ctx.restore();
            }
            const color = on ? css(mix(t.text, t.goldBright, 0.4)) : hot ? css(t.text, 0.95) : css(t.textDim);
            inkText(ctx, label.toUpperCase(), cx + 1.2, this.h / 2 + 0.5, color, t, 2);
            if (i > 0) {
                ctx.fillStyle = css(t.gold, 0.5);
                ctx.save();
                ctx.translate(cell * i, this.h / 2);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-1.8, -1.8, 3.6, 3.6);
                ctx.restore();
            }
        });
        setSpacing(ctx, 0);
    }
}

// =================================================================== HUD

export interface CooldownInput {
    remaining: number;
    duration: number;
    /** time since it last came off cooldown, for the ready flash */
    sinceReady?: number;
    locked?: boolean;
}

export interface HudValues {
    name: string;
    hp: number;
    hpMax: number;
    /** healable cap: below hpMax once the halo has dimmed */
    hpCap?: number;
    posture: number;
    postureMax: number;
    grace: number;
    graceMax: number;
    fervour: number;
    fervourMax: number;
    sanctity: number;
    sanctityMax: number;
    lives: number;
    maxLives?: number;
    cooldowns: Record<"roll" | "parry" | "block" | "feint" | "critical" | "trumpet", CooldownInput>;
}

const COOLDOWN_ORDER: Array<{ key: keyof HudValues["cooldowns"]; glyph: GlyphName; bind: string }> = [
    { key: "roll", glyph: "roll", bind: "Q" },
    { key: "parry", glyph: "parry", bind: "F" },
    { key: "block", glyph: "block", bind: "F" },
    { key: "feint", glyph: "feint", bind: "M2" },
    { key: "critical", glyph: "critical", bind: "R" },
    { key: "trumpet", glyph: "trumpet", bind: "C" },
];

/** Halo, HP, Posture, Grace, Fervour, Sanctity and the cooldown row: the bottom-left cluster. */
export class VitalsWidget extends UiWidget {
    values: HudValues | null = null;
    private hp = new BarTracker(1);
    private posture = new BarTracker(0);
    private grace = new BarTracker(1);

    constructor(o: Omit<WidgetOptions, "w" | "h"> & { w?: number; h?: number }) {
        super({ w: o.w ?? 368, h: o.h ?? 150, pad: 24, ...o });
    }

    protected animated(): boolean {
        return true;
    }

    set(values: HudValues): void {
        this.values = values;
    }

    update(dt: number): void {
        const v = this.values;
        if (v) {
            this.hp.update(ratio(v.hp, v.hpMax), dt);
            this.posture.update(ratio(v.posture, v.postureMax), dt);
            this.grace.update(ratio(v.grace, v.graceMax), dt);
        }
        super.update(dt);
    }

    protected paint(ctx: Ctx): void {
        const v = this.values;
        const t = this.theme;
        if (!v) return;
        const halo = haloState(v.lives, t.stain, v.maxLives ?? 2);
        const time = this.time;

        drawFrame(ctx, { x: 66, y: 38, w: this.w - 66, h: 110, theme: t, time, seed: this.seed, personal: true, bevel: 8 });

        drawHalo(ctx, 46, 84, 25, halo, t, time, this.seed + 1);
        drawLives(ctx, 46, 131, halo, t, time);

        const x0 = 100;
        const bw = this.w - x0 - 18;

        font(ctx, FAMILY.display, 12);
        setSpacing(ctx, 1.8);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        inkText(ctx, v.name.toUpperCase(), x0, 57, css(t.heading, 0.95), t, 2);
        setSpacing(ctx, 0);
        font(ctx, FAMILY.uiBold, 11);
        ctx.textAlign = "right";
        const hpLabel = `${Math.ceil(v.hp)}`;
        const maxLabel = ` / ${Math.round(v.hpMax)}`;
        const maxW = ctx.measureText(maxLabel).width;
        const hpv = hpView(v.hp, v.hpMax, v.hpCap ?? v.hpMax);
        inkText(ctx, hpLabel, x0 + bw - maxW, 57, css(hpv.low ? mix(t.text, t.danger, hpv.critical ? 0.8 : 0.5) : t.text), t, 2);
        font(ctx, FAMILY.ui, 10);
        inkText(ctx, maxLabel, x0 + bw, 57, css(t.textDim), t, 2);

        const pv = postureView(v.posture, v.postureMax);
        drawBar(ctx, { x: x0, y: 64, w: bw, h: 3, fill: this.posture.fill, trail: this.posture.fill, colors: t.bars.posture, theme: t, time, level: pv.level });

        drawBar(ctx, {
            x: x0,
            y: 73,
            w: bw,
            h: 11,
            fill: this.hp.fill,
            trail: this.hp.trail,
            gain: this.hp.gain,
            cap: hpv.cap,
            colors: t.bars.hp,
            theme: t,
            time,
            alarm: hpv.critical,
        });

        const gw = bw - 44;
        drawBar(ctx, { x: x0, y: 91, w: gw, h: 4, fill: this.grace.fill, colors: t.bars.grace, theme: t, time });

        const fv = fervourView(v.fervour, v.fervourMax);
        const fw = Math.round(bw * 0.62);
        drawBar(ctx, { x: x0, y: 103, w: fw, h: 3, fill: fv.fill, colors: t.bars.fervour, theme: t, time, notch: fv.notch, notchLit: fv.canOutcry });
        const sx = x0 + fw + 14;
        drawBar(ctx, { x: sx, y: 103, w: x0 + bw - sx, h: 3, fill: ratio(v.sanctity, v.sanctityMax), colors: t.bars.sanctity, theme: t, time });

        font(ctx, FAMILY.ui, 8);
        setSpacing(ctx, 1.4);
        ctx.textAlign = "left";
        const label = css(t.textDim, 0.85);
        inkText(ctx, fv.canOutcry ? "FERVOUR · G" : "FERVOUR", x0, 117, fv.canOutcry ? css(mix(t.textDim, t.goldBright, 0.6)) : label, t, 2);
        inkText(ctx, "SANCTITY", sx, 117, label, t, 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        inkText(ctx, "GRACE", x0 + bw, 93, css(mix(t.textDim, t.bars.grace.hi, 0.35), 0.9), t, 2);
        ctx.textBaseline = "alphabetic";
        setSpacing(ctx, 0);

        COOLDOWN_ORDER.forEach((c, i) => {
            const input = v.cooldowns[c.key];
            const view: CooldownView = cooldownView(input.remaining, input.duration, input.sinceReady ?? Infinity, input.locked);
            drawCooldownTile(ctx, x0 + 8 + i * 25, 134, 17, GLYPHS[c.glyph], view, t, time);
        });
        font(ctx, FAMILY.bodyItalic, 12.5);
        ctx.textAlign = "right";
        ctx.textBaseline = "alphabetic";
        const markColor = halo.mark === "pure" ? css(t.textDim, 0.8) : css(mix(t.textDim, t.danger, Math.min(1, 0.25 + halo.red * 0.75)));
        inkText(ctx, HALO_MARK_LABELS[halo.mark], x0 + bw, 138, markColor, t, 2);
    }
}

export interface HotbarSlotData {
    key: string;
    name: string;
    glyph: GlyphName | null;
    cost?: number;
    cooldown?: CooldownInput;
}

/** One weapon slot and six Hymn slots, grouped like Deepwoken's Mantra slots: 3 combat, support, mobility, wildcard. */
export class HotbarWidget extends UiWidget {
    weapon: HotbarSlotData = { key: "1", name: "", glyph: null };
    hymns: HotbarSlotData[] = [];
    grace = 0;
    active = -1;
    private rects: Array<{ x: number; y: number; s: number }> = [];

    constructor(o: Omit<WidgetOptions, "w" | "h"> & { w?: number; h?: number }) {
        super({ w: o.w ?? 452, h: o.h ?? 86, pad: 22, ...o });
        const s = 48;
        const gap = 6;
        const group = 12;
        const widths = [58, group, s, gap, s, gap, s, group, s, gap, s, group, s];
        const total = widths.reduce((a, b) => a + b, 0);
        let x = (this.w - total) / 2;
        this.rects.push({ x, y: 14, s: 58 });
        x += 58 + group;
        const offsets = [0, s + gap, s + gap, s + group, s + gap, s + group];
        for (let i = 0; i < 6; i++) {
            x += i === 0 ? 0 : offsets[i];
            this.rects.push({ x, y: 19, s });
        }
    }

    protected animated(): boolean {
        return true;
    }

    /** Which slot a screen point is over: 0 the weapon, 1..6 Hymns, or -1. */
    hit(px: number, py: number): number {
        if (!this.contains(px, py)) return -1;
        const p = this.local(px, py);
        return this.rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.s && p.y >= r.y && p.y <= r.y + r.s);
    }

    /** Screen rect of a slot, for anchoring a tooltip. */
    slotRect(i: number): { x: number; y: number; w: number; h: number } {
        const r = this.rects[i];
        return { x: this.x + r.x * this.scale, y: this.y + r.y * this.scale, w: r.s * this.scale, h: r.s * this.scale };
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, bevel: 9, crest: true });
        const slots = [this.weapon, ...this.hymns];
        slots.forEach((slot, i) => {
            const r = this.rects[i];
            if (!r) return;
            const cd = slot.cooldown;
            drawSlot(ctx, {
                x: r.x,
                y: r.y,
                size: r.s,
                key: slot.key,
                glyph: slot.glyph ? GLYPHS[slot.glyph] : null,
                cost: slot.cost,
                affordable: slot.cost === undefined || this.grace >= slot.cost,
                cooldown: cd ? cooldownView(cd.remaining, cd.duration, cd.sinceReady ?? Infinity, cd.locked) : undefined,
                active: i === this.active,
                theme: t,
                time: this.time,
                seed: this.seed + i * 31,
            });
        });
        // group captions under the slots, like Deepwoken's slot categories
        font(ctx, FAMILY.ui, 7.5);
        setSpacing(ctx, 1.6);
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        const cap = css(t.textDim, 0.7);
        const mid = (a: number, b: number) => (this.rects[a].x + this.rects[b].x + this.rects[b].s) / 2;
        inkText(ctx, "COMBAT", mid(1, 3), 78, cap, t, 2);
        inkText(ctx, "SUPPORT · MOVE", mid(4, 5), 78, cap, t, 2);
        inkText(ctx, "ANY", mid(6, 6), 78, cap, t, 2);
        setSpacing(ctx, 0);
    }
}

/** World Corruption: the tier numeral, its name and progress toward the next. */
export class TierWidget extends UiWidget {
    constructor(o: Omit<WidgetOptions, "w" | "h"> & { w?: number; h?: number }) {
        super({ w: o.w ?? 252, h: o.h ?? 64, pad: 22, ...o });
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        const tv = tierView(t.corruption);
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, bevel: 8 });
        // numeral in a diamond
        const cx = 34;
        const cy = this.h / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.shadowColor = css(mix(t.glow, t.danger, t.hell), glowAlpha(t, this.time, 2));
        ctx.shadowBlur = t.glowBlur;
        ctx.fillStyle = css(t.panelDeep, 0.95);
        ctx.fillRect(-15, -15, 30, 30);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = css(mix(t.goldBright, t.danger, t.hell * 0.6), 0.9);
        ctx.lineWidth = 1;
        ctx.strokeRect(-15.5, -15.5, 31, 31);
        ctx.strokeStyle = css(t.gold, 0.35);
        ctx.strokeRect(-12, -12, 24, 24);
        ctx.restore();
        font(ctx, FAMILY.displayBold, tv.roman.length > 2 ? 12 : 15);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        inkText(ctx, tv.roman, cx, cy + 1, css(mix(t.text, t.goldBright, 0.3)), t, 3);

        const x0 = 66;
        font(ctx, FAMILY.ui, 8.5);
        setSpacing(ctx, 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        inkText(ctx, `CORRUPTION · TIER ${tv.tier}`, x0, 22, css(t.textDim), t, 2);
        setSpacing(ctx, 0);
        font(ctx, FAMILY.displayBold, 15);
        setSpacing(ctx, 0.6);
        inkText(ctx, tv.name, x0, 40, css(t.heading), t, 3);
        setSpacing(ctx, 0);

        // five tier segments with a marker at the continuous value
        const tw = this.w - x0 - 16;
        const seg = tw / 5;
        for (let i = 0; i < 5; i++) {
            const sx = x0 + i * seg;
            const filled = Math.max(0, Math.min(1, t.corruption - i));
            ctx.fillStyle = css(t.bars.track, 1);
            ctx.fillRect(sx + 1, 49, seg - 2, 3);
            if (filled > 0) {
                const col = mix(t.goldBright, t.danger, i / 4);
                ctx.fillStyle = css(col, 0.9);
                ctx.fillRect(sx + 1, 49, (seg - 2) * filled, 3);
            }
        }
        const mx = x0 + (t.corruption / 5) * tw;
        ctx.save();
        ctx.shadowColor = css(t.glow, 0.9);
        ctx.shadowBlur = 6;
        ctx.fillStyle = css(mix(t.text, t.goldBright, 0.4));
        ctx.translate(mx, 50.5);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-2.5, -2.5, 5, 5);
        ctx.restore();
    }
}

/** "[E] Pray at the altar." */
export class PromptWidget extends UiWidget {
    key = "E";
    label = "";

    constructor(o: Omit<WidgetOptions, "w" | "h"> & { w?: number; h?: number }) {
        super({ w: o.w ?? 260, h: o.h ?? 40, pad: 20, ...o });
    }

    show(key: string, label: string): void {
        this.key = key;
        this.label = label;
        this.invalidate();
    }

    protected animated(): boolean {
        return true;
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        if (!this.label) return;
        font(ctx, FAMILY.body, 18);
        const tw = ctx.measureText(this.label).width;
        const total = 26 + 12 + tw;
        const x = (this.w - total) / 2;
        const g = ctx.createLinearGradient(x - 30, 0, x + total + 30, 0);
        g.addColorStop(0, css(t.panelDeep, 0));
        g.addColorStop(0.2, css(t.panelDeep, 0.78));
        g.addColorStop(0.8, css(t.panelDeep, 0.78));
        g.addColorStop(1, css(t.panelDeep, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - 30, 4, total + 60, this.h - 8);
        drawRule(ctx, x - 20, 4, total + 40, t, 0.5);
        drawRule(ctx, x - 20, this.h - 5, total + 40, t, 0.35);
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 3);
        ctx.save();
        ctx.globalAlpha = 0.85 + 0.15 * pulse;
        drawKeyCap(ctx, x, (this.h - 24) / 2, this.key, t, this.time, 24);
        ctx.restore();
        font(ctx, FAMILY.body, 18);
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        inkText(ctx, this.label, x + 26 + 12, this.h / 2 + 1, css(t.text), t, 3);
    }
}

/** The shape of a line of dialogue. ChatSystem's ChatMessage fits it as is. */
export interface DialogueLine {
    speaker: string;
    text: string;
}

/**
 * A dialogue box in the spirit of ChatSystem: a queue of `{ speaker, text }`
 * lines, typed out, advanced with Space or a click, with `onComplete` when
 * the last line closes.
 */
export class DialogueWidget extends UiWidget {
    private queue: DialogueLine[] = [];
    private index = -1;
    private elapsed = 0;
    private wrapped: string[] = [];
    onComplete: (() => void) | null = null;

    constructor(o: Omit<WidgetOptions, "w" | "h"> & { w?: number; h?: number }) {
        super({ w: o.w ?? 640, h: o.h ?? 132, pad: 26, ...o });
    }

    get open(): boolean {
        return this.index >= 0 && this.index < this.queue.length;
    }

    start(lines: DialogueLine[], onComplete?: () => void): void {
        this.queue = lines;
        this.index = lines.length ? 0 : -1;
        this.onComplete = onComplete ?? null;
        this.begin();
    }

    /** Finish typing the current line, or go to the next. */
    advance(): void {
        if (!this.open) return;
        const line = this.queue[this.index];
        if (typewriter(line.text, this.elapsed) < line.text.length) {
            this.elapsed = 1e6;
        } else {
            this.index++;
            if (!this.open) {
                this.index = -1;
                this.onComplete?.();
            }
            this.begin();
        }
        this.invalidate();
    }

    private begin(): void {
        this.elapsed = 0;
        const line = this.open ? this.queue[this.index] : null;
        const m = measure();
        font(m, FAMILY.body, 19);
        this.wrapped = line ? wrapText(m, line.text, this.w - 64) : [];
    }

    protected animated(): boolean {
        return true;
    }

    update(dt: number): void {
        this.elapsed += dt;
        super.update(dt);
    }

    protected paint(ctx: Ctx): void {
        if (!this.open) return;
        const t = this.theme;
        const line = this.queue[this.index];
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, crest: true, bevel: 10 });

        font(ctx, FAMILY.displayBold, 13);
        setSpacing(ctx, 2.6);
        const nw = ctx.measureText(line.speaker.toUpperCase()).width + 36;
        drawFrame(ctx, { x: 26, y: -13, w: nw, h: 26, theme: t, time: this.time, seed: this.seed + 5, bevel: 5, fillAlpha: 1.15 });
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        inkText(ctx, line.speaker.toUpperCase(), 26 + nw / 2 + 1.3, 0.5, css(t.heading), t, 2);
        setSpacing(ctx, 0);

        let shown = typewriter(line.text, this.elapsed);
        font(ctx, FAMILY.body, 19);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        this.wrapped.slice(0, 4).forEach((l, i) => {
            const part = l.slice(0, Math.max(0, shown));
            shown -= l.length + 1;
            if (part) inkText(ctx, part, 32, 44 + i * 25, css(t.text), t, 3);
        });
        if (typewriter(line.text, this.elapsed) >= line.text.length) {
            const blink = 0.55 + 0.45 * Math.sin(this.time * 4);
            font(ctx, FAMILY.ui, 9.5);
            setSpacing(ctx, 1.6);
            ctx.textAlign = "right";
            const last = this.index === this.queue.length - 1;
            inkText(ctx, last ? "SPACE · CLOSE" : "SPACE · CONTINUE", this.w - 34, this.h - 14, css(t.textDim, 0.6 + 0.4 * blink), t, 2);
            setSpacing(ctx, 0);
            ctx.save();
            ctx.fillStyle = css(t.goldBright, blink);
            ctx.translate(this.w - 24, this.h - 17);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-2.5, -2.5, 5, 5);
            ctx.restore();
        }
        font(ctx, FAMILY.ui, 9);
        ctx.textAlign = "left";
        inkText(ctx, `${this.index + 1} / ${this.queue.length}`, 32, this.h - 14, css(t.textDim, 0.6), t, 2);
    }
}

/** Notifications, stacked downward from the top centre. */
export class ToastWidget extends UiWidget {
    readonly queue = new ToastQueue();
    private readonly itemH = 54;
    private readonly gap = 8;

    constructor(o: Omit<WidgetOptions, "w" | "h"> & { w?: number }) {
        super({ w: o.w ?? 340, h: 3 * 54 + 2 * 8, pad: 22, ...o });
    }

    protected animated(): boolean {
        return this.queue.items.length > 0;
    }

    update(dt: number): void {
        const had = this.queue.items.length;
        this.queue.update(dt);
        if (had !== this.queue.items.length) this.invalidate();
        super.update(dt);
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        const accent = {
            grace: t.goldBright,
            info: t.text,
            warning: t.warning,
            danger: t.danger,
        };
        [...this.queue.items].reverse().forEach((toast, i) => {
            const a = toastAlpha(toast);
            if (a <= 0) return;
            const y = i * (this.itemH + this.gap) - (1 - Math.min(1, toast.age / 0.25)) * 8;
            ctx.save();
            ctx.globalAlpha = a;
            drawFrame(ctx, { x: 0, y, w: this.w, h: this.itemH, theme: t, time: this.time, seed: this.seed + toast.id * 13, bevel: 7 });
            const col = accent[toast.kind];
            ctx.save();
            ctx.shadowColor = css(toast.kind === "grace" ? t.glow : col, 0.9);
            ctx.shadowBlur = 10;
            ctx.fillStyle = css(col);
            ctx.translate(24, y + this.itemH / 2);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-4, -4, 8, 8);
            ctx.restore();
            font(ctx, FAMILY.displayBold, 14);
            setSpacing(ctx, 1.2);
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
            inkText(ctx, toast.title, 44, y + 24, css(toast.kind === "info" || toast.kind === "grace" ? t.heading : mix(col, t.text, 0.25)), t, 3);
            setSpacing(ctx, 0);
            font(ctx, FAMILY.bodyItalic, 14.5);
            inkText(ctx, toast.detail, 44, y + 42, css(t.textDim), t, 2);
            ctx.restore();
        });
    }
}

// ============================================================ full screen

/**
 * Sanctity's screen edge. Like Deepwoken's Sanity, there's no loud meter for
 * the mind's state: below 70% a cold, desaturating dark creeps in from the
 * edges. Rendered once; only its opacity changes.
 */
export class SanctityVignette {
    readonly element: ScreenElement;
    private canvas: Canvas;

    constructor(private w: number, private h: number) {
        this.canvas = new Canvas({
            width: w,
            height: h,
            cache: true,
            quality: 1,
            smoothing: true,
            filtering: ImageFiltering.Blended,
            draw: (ctx) => {
                const g = ctx.createRadialGradient(this.w / 2, this.h / 2, this.h * 0.35, this.w / 2, this.h / 2, this.w * 0.62);
                g.addColorStop(0, "rgba(20,16,30,0)");
                g.addColorStop(0.65, "rgba(22,18,34,0.45)");
                g.addColorStop(1, "rgba(8,6,14,0.9)");
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, this.w, this.h);
            },
        });
        this.element = new ScreenElement({ x: 0, y: 0, z: 90 });
        this.element.graphics.use(this.canvas);
        this.element.graphics.opacity = 0;
    }

    resize(w: number, h: number): void {
        this.w = w;
        this.h = h;
        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.flagDirty();
    }

    /** Sanctity as a share of its maximum. */
    set(share: number): void {
        const k = Math.max(0, Math.min(1, (0.7 - share) / 0.7));
        this.element.graphics.opacity = k * k * (3 - 2 * k);
    }
}

interface Ember {
    el: ScreenElement;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    age: number;
    size: number;
}

/**
 * Faint embers rising off the top edges of the HUD panels once corruption
 * reaches about Tier 2. Each ember is a small ScreenElement sharing one
 * pre-rendered glow, so they cost no canvas redraws. They sit behind the
 * panels, so they never cross a bar.
 */
export class EmberLayer {
    private embers: Ember[] = [];
    private sprite: Canvas;
    private sources: Array<{ x: number; y: number; w: number }> = [];
    private theme: UiTheme = themeFor(0, 0);
    private spawnDebt = 0;
    private scale = 1;

    constructor(private scene: Scene, private z = 95, private max = 44) {
        this.sprite = new Canvas({
            width: 16,
            height: 16,
            cache: true,
            quality: 2,
            smoothing: true,
            filtering: ImageFiltering.Blended,
            draw: (ctx) => {
                const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
                g.addColorStop(0, "rgba(255,240,210,1)");
                g.addColorStop(0.25, "rgba(255,170,90,0.9)");
                g.addColorStop(1, "rgba(255,60,20,0)");
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, 16, 16);
            },
        });
    }

    /** Edges embers rise from, in screen coordinates. */
    setSources(sources: Array<{ x: number; y: number; w: number }>, scale: number): void {
        this.sources = sources;
        this.scale = scale;
    }

    setTheme(theme: UiTheme): void {
        this.theme = theme;
        const tint = mix({ r: 255, g: 200, b: 140 }, theme.danger, 0.4 + 0.4 * theme.hell);
        this.sprite.tint = Color.fromRGB(Math.round(tint.r), Math.round(tint.g), Math.round(tint.b));
    }

    /** Advance the embers; with `spawn` off the live ones burn out and no new ones rise. */
    update(dt: number, spawn = true): void {
        const rate = this.theme.embers * 16;
        this.spawnDebt += spawn ? rate * dt : 0;
        while (this.spawnDebt >= 1 && this.sources.length) {
            this.spawnDebt -= 1;
            if (this.embers.length < this.max) this.spawn();
        }
        if (!this.sources.length || !spawn) this.spawnDebt = 0;
        for (const e of this.embers) {
            e.age += dt;
            e.vx += Math.sin(e.age * 2.1 + e.size * 7) * 6 * dt;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            const k = e.age / e.life;
            const fade = Math.min(1, e.age * 3) * (1 - k);
            const flick = 0.75 + 0.25 * Math.sin(e.age * 17 + e.size * 31);
            e.el.pos = vec(e.x, e.y);
            e.el.graphics.opacity = Math.max(0, fade * flick * (0.35 + 0.45 * this.theme.embers));
            const s = (e.size / 16) * (1 - 0.4 * k) * this.scale;
            e.el.scale = vec(s, s);
        }
        const dead = this.embers.filter((e) => e.age >= e.life);
        for (const e of dead) e.el.kill();
        if (dead.length) this.embers = this.embers.filter((e) => e.age < e.life);
    }

    private spawn(): void {
        const src = this.sources[Math.floor(Math.random() * this.sources.length)];
        const el = new ScreenElement({ x: 0, y: 0, z: this.z, anchor: vec(0.5, 0.5) });
        el.graphics.use(this.sprite);
        el.graphics.opacity = 0;
        this.scene.add(el);
        this.embers.push({
            el,
            x: src.x + Math.random() * src.w,
            y: src.y + Math.random() * 4 * this.scale,
            vx: (Math.random() - 0.5) * 10 * this.scale,
            vy: -(14 + Math.random() * 22) * this.scale,
            life: 1.6 + Math.random() * 1.8,
            age: 0,
            size: 3 + Math.random() * 4.5,
        });
    }

    destroy(): void {
        for (const e of this.embers) e.el.kill();
        this.embers = [];
    }
}
