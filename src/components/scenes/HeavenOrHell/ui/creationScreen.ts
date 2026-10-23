import { Scene } from "excalibur";
import { Rgb, css, mix } from "./color";
import {
    ACCENT_COLORS,
    CHOIR_PICKS,
    CREATION_STEPS,
    CREATION_TITLE,
    ChoirPick,
    CreationResult,
    CreationState,
    DIFFICULTY_OPTIONS,
    DifficultyOption,
    HALO_COLOURS,
    HALO_SHAPES,
    HaloShape,
    choose,
    creationResult,
    currentStep,
    epigraphSource,
    goToStep,
    navLabels,
    newCreation,
    nudge,
    stepBack,
    stepForward,
} from "./creation";
import { GLYPHS } from "./icons";
import { Ctx, FAMILY, drawFrame, drawRule, font, glowAlpha, inkText, setSpacing, wrapText } from "./paint";
import { Heading, UiScreen } from "./screens";
import { UiTheme, themeFor } from "./theme";
import { Button, UiWidget, WidgetOptions } from "./widgets";

const WHITE: Rgb = { r: 255, g: 255, b: 255 };

/** Creation happens before the run, so it always wears the Tier 0 look. */
const CREATION_THEME = themeFor(0, 0);

/** Shrink a line's font until it fits on one line. */
function fitLine(ctx: Ctx, text: string, family: string, sizes: number[], maxWidth: number, italic = false): void {
    for (const size of sizes) {
        font(ctx, family, size, italic);
        if (ctx.measureText(text).width <= maxWidth) return;
    }
}

// ------------------------------------------------------------ painting

/** A halo seen face on, in one of the four shapes. */
export function drawHaloShape(ctx: Ctx, cx: number, cy: number, r: number, shape: HaloShape, color: Rgb, time: number, glow = 1): void {
    const bright = mix(color, WHITE, 0.55);
    const pulse = 0.85 + 0.15 * Math.sin(time * 1.6);
    const w = Math.max(1.4, r * 0.13);
    ctx.save();
    const bloom = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.6);
    bloom.addColorStop(0, css(color, 0));
    bloom.addColorStop(0.45, css(color, 0.22 * glow * pulse));
    bloom.addColorStop(1, css(color, 0));
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = css(color, 0.9 * glow);
    ctx.shadowBlur = r * 0.35;
    const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    g.addColorStop(0, css(bright));
    g.addColorStop(1, css(color));
    ctx.strokeStyle = g;
    ctx.fillStyle = g;
    ctx.lineCap = "round";

    const ring = (radius: number, width: number) => {
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
    };

    if (shape === "ring") {
        ring(r, w);
    } else if (shape === "twin") {
        ring(r, w * 0.6);
        ring(r * 0.78, w * 0.45);
    } else if (shape === "rayed") {
        ring(r * 0.86, w * 0.75);
        ctx.lineWidth = Math.max(1, w * 0.4);
        for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
            const long = i % 2 === 0;
            const r0 = r * 1.0;
            const r1 = r * (long ? 1.32 : 1.16);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
            ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
            ctx.stroke();
        }
    } else {
        ring(r * 0.9, w * 0.7);
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
            const px = cx + Math.cos(a) * r * 0.9;
            const py = cy + Math.sin(a) * r * 0.9;
            const s = r * (i === 0 ? 0.17 : 0.11);
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(a + Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, -s * 1.5);
            ctx.lineTo(s * 0.6, 0);
            ctx.lineTo(0, s * 0.9);
            ctx.lineTo(-s * 0.6, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
    ctx.restore();
}

/** The four difficulty emblems: still water, a narrow gate, a furnace flame and a falling star. */
function drawRoadEmblem(ctx: Ctx, id: string, cx: number, cy: number, s: number): void {
    ctx.beginPath();
    if (id === "stillWaters") {
        for (let k = -1; k <= 1; k++) {
            const y = cy + k * s * 0.42;
            const span = s * (1 - Math.abs(k) * 0.25);
            ctx.moveTo(cx - span, y);
            ctx.bezierCurveTo(cx - span * 0.5, y - s * 0.16, cx - span * 0.1, y + s * 0.16, cx + span * 0.35, y);
            ctx.quadraticCurveTo(cx + span * 0.7, y - s * 0.1, cx + span, y);
        }
        ctx.stroke();
    } else if (id === "narrowWay") {
        const gw = s * 0.36;
        ctx.moveTo(cx - gw, cy + s);
        ctx.lineTo(cx - gw, cy - s * 0.35);
        ctx.arc(cx, cy - s * 0.35, gw, Math.PI, 0);
        ctx.lineTo(cx + gw, cy + s);
        ctx.moveTo(cx - s, cy + s);
        ctx.lineTo(cx + s, cy + s);
        ctx.moveTo(cx, cy + s * 0.75);
        ctx.lineTo(cx, cy - s * 0.15);
        ctx.stroke();
    } else if (id === "furnaceOfAffliction") {
        GLYPHS.flame(ctx, cx, cy - s * 0.1, s * 0.9);
        ctx.beginPath();
        ctx.moveTo(cx - s, cy + s);
        ctx.lineTo(cx + s, cy + s);
        ctx.stroke();
    } else {
        // a star falling, trailing light
        const sx = cx + s * 0.35;
        const sy = cy + s * 0.35;
        ctx.moveTo(cx - s, cy - s);
        ctx.lineTo(sx - s * 0.25, sy - s * 0.25);
        ctx.moveTo(cx - s * 0.45, cy - s * 1.05);
        ctx.lineTo(sx - s * 0.2, sy - s * 0.5);
        ctx.moveTo(cx - s * 1.05, cy - s * 0.45);
        ctx.lineTo(sx - s * 0.5, sy - s * 0.2);
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const rr = i % 2 === 0 ? s * 0.42 : s * 0.14;
            const a = -Math.PI / 2 + (i * Math.PI) / 4;
            const x = sx + Math.cos(a) * rr;
            const y = sy + Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
}

// ------------------------------------------------------------- widgets

/** Three diamonds on a hairline: done, current and still to come. */
class StepTrail extends UiWidget {
    step = 0;

    protected animated(): boolean {
        return true;
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        const n = CREATION_STEPS.length;
        const gap = this.w / n;
        const y = 11;
        const xs = CREATION_STEPS.map((_, i) => gap * i + gap / 2);
        ctx.strokeStyle = css(t.gold, 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xs[0], y + 0.5);
        ctx.lineTo(xs[n - 1], y + 0.5);
        ctx.stroke();
        CREATION_STEPS.forEach((s, i) => {
            const on = i === this.step;
            const done = i < this.step;
            const r = on ? 6 : 4.5;
            ctx.save();
            ctx.translate(xs[i], y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = css(t.panelDeep);
            ctx.fillRect(-r - 3, -r - 3, (r + 3) * 2, (r + 3) * 2);
            if (on) {
                ctx.shadowColor = css(t.glow, glowAlpha(t, this.time, 6) + 0.3);
                ctx.shadowBlur = 12;
            }
            ctx.fillStyle = css(on ? mix(t.goldBright, WHITE, 0.3) : done ? t.gold : t.panel);
            ctx.fillRect(-r, -r, r * 2, r * 2);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = css(on ? t.goldBright : t.gold, on ? 1 : done ? 0.8 : 0.5);
            ctx.strokeRect(-r, -r, r * 2, r * 2);
            ctx.restore();
            font(ctx, FAMILY.ui, 9.5);
            setSpacing(ctx, 2.4);
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            inkText(ctx, s.label.toUpperCase(), xs[i] + 1.2, 38, css(on ? mix(t.text, t.goldBright, 0.4) : t.textDim, on ? 1 : 0.8), t, 2);
            setSpacing(ctx, 0);
        });
    }
}

/** A Choir: its emblem, its name and one line. Details wait for the tooltip. */
class ChoirCard extends UiWidget {
    selected = false;
    hover = false;

    constructor(o: WidgetOptions, public data: ChoirPick) {
        super({ pad: 24, ...o });
    }

    protected animated(): boolean {
        return this.selected;
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        const focus = this.selected ? 1 : this.hover ? 0.5 : 0;
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, bevel: 8, focus, crest: this.selected, fillAlpha: 0.95 });
        const cx = this.w / 2;
        const ey = 50;
        ctx.save();
        const g = ctx.createRadialGradient(cx, ey, 2, cx, ey, 42);
        g.addColorStop(0, css(t.glow, (0.06 + 0.2 * focus) * (this.selected ? 0.7 + glowAlpha(t, this.time, 5) : 1)));
        g.addColorStop(1, css(t.glow, 0));
        ctx.fillStyle = g;
        ctx.fillRect(cx - 44, ey - 44, 88, 88);
        ctx.shadowColor = css(t.glow, 0.4 + 0.5 * focus);
        ctx.shadowBlur = 10;
        const c = css(mix(t.textDim, t.goldBright, 0.25 + 0.65 * focus));
        ctx.strokeStyle = c;
        ctx.fillStyle = c;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        GLYPHS[this.data.glyph](ctx, cx, ey, 17);
        ctx.restore();

        font(ctx, FAMILY.displayBold, 15);
        setSpacing(ctx, 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        inkText(ctx, this.data.name.toUpperCase(), cx + 1, 102, css(this.selected ? t.heading : mix(t.text, t.heading, 0.35)), t, 3);
        setSpacing(ctx, 0);
        fitLine(ctx, this.data.line, FAMILY.bodyItalic, [15, 14, 13], this.w - 24, true);
        inkText(ctx, this.data.line, cx, 124, css(t.textDim), t, 2);
    }
}

/** One quiet line under the Choir grid: the hovered Choir's echo and leaning, fading in and out. */
class Caption extends UiWidget {
    text = "";
    private target = 0;
    private alpha = 0;

    set(text: string): void {
        if (text) {
            if (text !== this.text) this.invalidate();
            this.text = text;
        }
        this.target = text ? 1 : 0;
    }

    update(dt: number): void {
        const before = this.alpha;
        this.alpha += Math.sign(this.target - this.alpha) * Math.min(Math.abs(this.target - this.alpha), dt * 5);
        if (before !== this.alpha) this.opacity = this.alpha;
        super.update(dt);
    }

    protected animated(): boolean {
        return false;
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        if (!this.text) return;
        font(ctx, FAMILY.bodyItalic, 17);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        inkText(ctx, this.text, this.w / 2, this.h / 2, css(mix(t.textDim, t.text, 0.25)), t, 3);
    }
}

/** The chosen halo, large, over a soft pool of its own light, with the Tenth's name. */
class HaloPreview extends UiWidget {
    shape: HaloShape = "ring";
    color: Rgb = HALO_COLOURS[0].color;
    caption = "";

    protected animated(): boolean {
        return true;
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        const cx = this.w / 2;
        const cy = 118;
        const pool = ctx.createRadialGradient(cx, cy + 40, 10, cx, cy + 40, this.w * 0.55);
        pool.addColorStop(0, css(this.color, 0.1));
        pool.addColorStop(1, css(this.color, 0));
        ctx.fillStyle = pool;
        ctx.fillRect(0, 0, this.w, this.h);
        drawHaloShape(ctx, cx, cy, 66, this.shape, this.color, this.time);
        font(ctx, FAMILY.displayBold, 20);
        setSpacing(ctx, 5);
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        inkText(ctx, "THE TENTH", cx + 2.5, this.h - 46, css(t.heading), t, 4);
        setSpacing(ctx, 0);
        drawRule(ctx, cx - 70, this.h - 34, 140, t, 0.5);
        font(ctx, FAMILY.bodyItalic, 16);
        inkText(ctx, this.caption, cx, this.h - 12, css(t.textDim), t, 2);
    }
}

/** A labelled row of four swatches; `drawSwatch` paints each one's content. */
class SwatchRow extends UiWidget {
    selected = 0;
    hover = -1;
    readonly cell = 62;
    readonly gap = 18;
    readonly top = 30;

    constructor(
        o: WidgetOptions,
        public label: string,
        public names: readonly string[],
        public drawSwatch: (ctx: Ctx, i: number, cx: number, cy: number, focus: number, time: number) => void,
    ) {
        super({ pad: 22, ...o });
    }

    protected animated(): boolean {
        return true;
    }

    hit(px: number, py: number): number {
        if (!this.contains(px, py)) return -1;
        const p = this.local(px, py);
        if (p.y < this.top || p.y > this.top + this.cell) return -1;
        for (let i = 0; i < this.names.length; i++) {
            const x = i * (this.cell + this.gap);
            if (p.x >= x && p.x <= x + this.cell) return i;
        }
        return -1;
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        font(ctx, FAMILY.ui, 9.5);
        setSpacing(ctx, 2.4);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        inkText(ctx, this.label.toUpperCase(), 0, 14, css(t.textDim), t, 2);
        setSpacing(ctx, 0);
        font(ctx, FAMILY.bodyItalic, 16);
        ctx.textAlign = "right";
        inkText(ctx, this.names[this.selected], this.w, 15, css(mix(t.text, t.goldBright, 0.3)), t, 2);
        this.names.forEach((_, i) => {
            const x = i * (this.cell + this.gap);
            const focus = i === this.selected ? 1 : i === this.hover ? 0.5 : 0;
            drawFrame(ctx, { x, y: this.top, w: this.cell, h: this.cell, theme: t, time: this.time, seed: this.seed + i * 7, bevel: 6, focus, fillAlpha: 0.95 });
            this.drawSwatch(ctx, i, x + this.cell / 2, this.top + this.cell / 2, focus, this.time);
        });
    }
}

/** A difficulty: an emblem in its accent, the name and one line. The epigraph shows only when chosen. */
class RoadCard extends UiWidget {
    selected = false;
    hover = false;

    constructor(o: WidgetOptions, public data: DifficultyOption) {
        super({ pad: 34, ...o });
    }

    protected animated(): boolean {
        return this.selected;
    }

    protected paint(ctx: Ctx): void {
        const t = this.theme;
        const accent = ACCENT_COLORS[this.data.accent];
        const focus = this.selected ? 1 : this.hover ? 0.5 : 0;
        const cx = this.w / 2;

        if (this.selected) {
            ctx.save();
            const halo = ctx.createRadialGradient(cx, 70, 10, cx, 70, Math.min(this.w / 2, 120) + 30);
            halo.addColorStop(0, css(accent, 0.16 + 0.06 * glowAlpha(t, this.time, 8)));
            halo.addColorStop(1, css(accent, 0));
            ctx.fillStyle = halo;
            ctx.fillRect(-32, -32, this.w + 64, this.h + 64);
            ctx.restore();
        }
        const line = mix(t.gold, accent, 0.35 + 0.45 * focus);
        drawFrame(ctx, { x: 0, y: 0, w: this.w, h: this.h, theme: t, time: this.time, seed: this.seed, bevel: 10, focus, crest: this.selected, line, fillAlpha: 0.97 });

        // a thin accent bar across the top edge, so the road's colour reads at a glance
        ctx.save();
        ctx.fillStyle = css(accent, 0.55 + 0.45 * focus);
        ctx.shadowColor = css(accent, 0.8 * focus);
        ctx.shadowBlur = 8;
        ctx.fillRect(cx - 26, 15, 52, 1.5);
        ctx.restore();

        ctx.save();
        ctx.shadowColor = css(accent, 0.5 + 0.4 * focus);
        ctx.shadowBlur = 12;
        const ec = css(mix(accent, WHITE, 0.15), 0.6 + 0.4 * focus);
        ctx.strokeStyle = ec;
        ctx.fillStyle = ec;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        drawRoadEmblem(ctx, this.data.id, cx, 66, 20);
        ctx.restore();

        font(ctx, FAMILY.displayBold, 16);
        setSpacing(ctx, 1.6);
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        const names = wrapText(ctx, this.data.name.toUpperCase(), this.w - 36);
        const nameBottom = 146;
        names.forEach((l, i) => inkText(ctx, l, cx + 0.8, nameBottom - (names.length - 1 - i) * 21, css(this.selected ? t.heading : mix(t.text, t.heading, 0.3)), t, 3));
        setSpacing(ctx, 0);
        fitLine(ctx, this.data.subtitle, FAMILY.bodyItalic, [15.5, 14.5, 13.5, 12.5], this.w - 28, true);
        inkText(ctx, this.data.subtitle, cx, 172, css(t.textDim), t, 2);

        if (this.selected) {
            drawRule(ctx, 34, 190, this.w - 68, t, 0.5);
            font(ctx, FAMILY.bodyItalic, 14);
            const lines = wrapText(ctx, `\u201c${this.data.epigraph.text}\u201d`, this.w - 44);
            lines.forEach((l, i) => inkText(ctx, l, cx, 214 + i * 17, css(mix(t.text, accent, 0.2), 0.85), t, 2));
            font(ctx, FAMILY.ui, 9);
            setSpacing(ctx, 2);
            inkText(ctx, epigraphSource(this.data.epigraph.ref).toUpperCase(), cx + 1, 214 + lines.length * 17 + 6, css(t.textDim, 0.8), t, 2);
            setSpacing(ctx, 0);
        }
    }
}

// -------------------------------------------------------------- screen

/**
 * Character creation in three quiet steps: a Choir, the halo, the road. One
 * choice per screen, Back and Continue at the bottom, Kindle at the end.
 */
export class CreationScreen extends UiScreen {
    state: CreationState;
    onComplete: ((result: CreationResult) => void) | null = null;
    /** which appearance row the Up and Down keys move between */
    focusRow: "shape" | "colour" = "shape";

    private trail = this.add(new StepTrail({ w: 420, h: 44, seed: 140 }));
    private heading = this.add(new Heading({ w: 640, h: 80, title: CREATION_TITLE, subtitle: CREATION_STEPS[0].prompt, seed: 141 }));
    private choirs = CHOIR_PICKS.map((c, i) => this.add(new ChoirCard({ w: 188, h: 136, seed: 150 + i }, c)));
    private caption = this.add(new Caption({ w: 824, h: 28, seed: 160 }));
    private preview = this.add(new HaloPreview({ w: 340, h: 300, pad: 30, seed: 170 }));
    private shapes = this.add(
        new SwatchRow({ w: 302, h: 92, seed: 171 }, "Shape", HALO_SHAPES.map((s) => s.name), (ctx, i, cx, cy, focus, time) =>
            drawHaloShape(ctx, cx, cy, 15, HALO_SHAPES[i].id, HALO_COLOURS[this.state.haloColour].color, time, 0.4 + 0.6 * focus),
        ),
    );
    private colours = this.add(
        new SwatchRow({ w: 302, h: 92, seed: 172 }, "Light", HALO_COLOURS.map((c) => c.name), (ctx, i, cx, cy, focus) => {
            const c = HALO_COLOURS[i].color;
            ctx.save();
            ctx.shadowColor = css(c, 0.5 + 0.5 * focus);
            ctx.shadowBlur = 8 + 8 * focus;
            const g = ctx.createRadialGradient(cx - 4, cy - 5, 1, cx, cy, 14);
            g.addColorStop(0, css(mix(c, WHITE, 0.6)));
            g.addColorStop(1, css(c));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }),
    );
    private roads = DIFFICULTY_OPTIONS.map((d, i) => this.add(new RoadCard({ w: 236, h: 284, seed: 180 + i }, d)));
    private back = this.add(new Button({ w: 180, h: 44, label: "Back", hint: "Esc", seed: 190 }));
    private next = this.add(new Button({ w: 180, h: 44, label: "Continue", hint: "Enter", seed: 191 }));

    constructor(scene: Scene, width: number, height: number) {
        super(scene, width, height);
        this.state = newCreation();
        this.back.onClick = () => this.goBack();
        this.next.onClick = () => this.goNext();
        this.show(false);
    }

    setTheme(_t: UiTheme): void {
        super.setTheme(CREATION_THEME);
    }

    show(on: boolean): void {
        super.show(on);
        if (on) this.sync();
    }

    layout(s: number, pr: number, ox: number, oy: number): void {
        const at = (w: UiWidget, x: number, y: number) => w.place(ox + x * s, oy + y * s, s, pr);
        at(this.trail, 640 - 210, 82);
        at(this.heading, 320, 140);
        this.choirs.forEach((c, i) => at(c, 228 + (i % 4) * 212, 240 + Math.floor(i / 4) * 156));
        at(this.caption, 228, 546);
        at(this.preview, 290, 246);
        at(this.shapes, 690, 280);
        at(this.colours, 690, 414);
        this.roads.forEach((r, i) => at(r, 132 + i * 260, 256));
        at(this.back, 640 - 12 - 180, 590);
        at(this.next, 640 + 12, 590);
    }

    goNext(): void {
        this.state = stepForward(this.state);
        if (this.state.done) {
            this.onComplete?.(creationResult(this.state));
            this.state = { ...this.state, done: false };
        }
        this.sync();
    }

    goBack(): void {
        this.state = stepBack(this.state);
        this.sync();
    }

    setStep(step: number): void {
        this.state = goToStep(this.state, step);
        this.sync();
    }

    /** Arrow keys: left and right move the choice; up and down switch the appearance row. */
    move(dx: number, dy: number): void {
        if (dy !== 0 && currentStep(this.state).id === "appearance") this.focusRow = dy < 0 ? "shape" : "colour";
        if (dx !== 0) this.state = nudge(this.state, dx, this.focusRow);
        this.sync();
    }

    pointerMove(x: number, y: number, down: boolean): void {
        super.pointerMove(x, y, down);
        const step = currentStep(this.state).id;
        if (step === "choir") {
            const over = this.choirs.findIndex((c) => c.contains(x, y));
            this.choirs.forEach((c, i) => {
                if (c.hover !== (i === over)) {
                    c.hover = i === over;
                    c.invalidate();
                }
            });
            this.caption.set(over >= 0 ? `${CHOIR_PICKS[over].echo}. ${CHOIR_PICKS[over].leaning}` : "");
        } else if (step === "appearance") {
            for (const row of [this.shapes, this.colours]) {
                const h = row.hit(x, y);
                if (h !== row.hover) {
                    row.hover = h;
                    row.invalidate();
                }
            }
        } else {
            const over = this.roads.findIndex((r) => r.contains(x, y));
            this.roads.forEach((r, i) => {
                if (r.hover !== (i === over)) {
                    r.hover = i === over;
                    r.invalidate();
                }
            });
        }
    }

    pointerDown(x: number, y: number): void {
        super.pointerDown(x, y);
        const step = currentStep(this.state).id;
        if (step === "choir") {
            const i = this.choirs.findIndex((c) => c.contains(x, y));
            if (i >= 0) this.state = choose(this.state, i);
        } else if (step === "appearance") {
            const s = this.shapes.hit(x, y);
            const c = this.colours.hit(x, y);
            if (s >= 0) this.state = choose(this.state, s, "shape");
            if (c >= 0) this.state = choose(this.state, c, "colour");
        } else {
            const i = this.roads.findIndex((r) => r.contains(x, y));
            if (i >= 0) this.state = choose(this.state, i);
        }
        this.sync();
    }

    /** Show the current step's widgets and push the state into them. */
    private sync(): void {
        const s = this.state;
        const step = currentStep(s).id;
        const on = this.visible;
        this.trail.step = s.step;
        this.trail.invalidate();
        this.heading.subtitle = currentStep(s).prompt;
        this.heading.invalidate();

        this.choirs.forEach((c, i) => {
            c.visible = on && step === "choir";
            c.selected = i === s.choir;
            c.invalidate();
        });
        this.caption.visible = on && step === "choir";
        if (step !== "choir") this.caption.set("");

        const appearance = on && step === "appearance";
        this.preview.visible = appearance;
        this.shapes.visible = appearance;
        this.colours.visible = appearance;
        this.preview.shape = HALO_SHAPES[s.haloShape].id;
        this.preview.color = HALO_COLOURS[s.haloColour].color;
        this.preview.caption = `${HALO_SHAPES[s.haloShape].name} \u00b7 ${HALO_COLOURS[s.haloColour].name}`;
        this.shapes.selected = s.haloShape;
        this.colours.selected = s.haloColour;
        for (const w of [this.preview, this.shapes, this.colours]) w.invalidate();

        this.roads.forEach((r, i) => {
            r.visible = on && step === "difficulty";
            r.selected = i === s.difficulty;
            r.invalidate();
        });

        const nav = navLabels(s);
        this.back.visible = on && nav.back !== null;
        this.next.label = nav.next;
        this.next.invalidate();
    }
}
