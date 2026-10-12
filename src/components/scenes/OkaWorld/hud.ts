import { Canvas, Color, Font, FontUnit, ImageFiltering, ImageSource, Scene, ScreenElement, Text, TextAlign, vec, BaseAlign } from "excalibur";
import { paintedSprite } from "./paint";
import { VIEW_H, VIEW_W } from "./parallax";

const SERIF = "'Palatino Linotype', Palatino, 'Book Antiqua', 'URW Palladio L', Georgia, serif";

/** Words and colours of a scene's HUD, title card, win panel and loading card. */
export interface HudStyle {
    title: string;
    subtitle: string;
    hints: string[];
    /** main text */
    text: string;
    /** subtitles and panel lines */
    accent: string;
    /** "r,g,b" of the shade behind cards and of text shadows */
    shade: string;
    loading: { text: string; background: string; label: string; bar: string };
    /** "r,g,b" of an empty heart */
    emptyHeart: string;
}

export const OKA_HUD: HudStyle = {
    title: "Oka World",
    subtitle: "Lanternlight Under Stone",
    hints: [
        "Arrows or A / D to move   ·   Space, W or Up to jump and swim   ·   Down + Jump drops through",
        "Gather the cave crystals and wake the Heartstone",
    ],
    text: "#eafff2",
    accent: "#bfeee0",
    shade: "6,24,26",
    loading: { text: "Entering Oka World…", background: "#0f2427", label: "#cdeee2", bar: "#9ff0d8" },
    emptyHeart: "20,40,40",
};

/** A full-screen chapter card, shown while one scene hands over to the next. */
export interface ChapterCard {
    title: string;
    subtitle: string;
    line: string;
    background: string;
    text: string;
    accent: string;
}

function font(size: number, color = "#f4fff6", align = TextAlign.Left): Font {
    return new Font({
        baseAlign: BaseAlign.Alphabetic,
        family: SERIF,
        size,
        unit: FontUnit.Px,
        color: Color.fromHex(color),
        textAlign: align,
        quality: 3,
        shadow: { blur: 6, offset: vec(0, 2), color: Color.fromRGB(0, 20, 20, 0.85) },
    });
}

function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.05, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x - s * 0.1, y + s * 0.75, x, y + s * 0.95);
    ctx.bezierCurveTo(x + s * 0.1, y + s * 0.75, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.05, x, y, x, y + s * 0.3);
    ctx.closePath();
}

export class OkaHud {
    private hearts = 3;
    private maxHearts = 5;
    private heartCanvas: Canvas;
    private crystalText: Text;
    private toast: ScreenElement;
    private toastText: Text;
    private toastTime = 0;
    private title: ScreenElement;
    private titleTime = 0;
    private panel: ScreenElement | null = null;
    private elements: ScreenElement[] = [];

    constructor(private scene: Scene, crystalImage: ImageSource, private total: number, private style: HudStyle = OKA_HUD) {
        this.heartCanvas = new Canvas({
            width: 5 * 34 + 10,
            height: 40,
            cache: true,
            quality: 2,
            filtering: ImageFiltering.Blended,
            draw: (ctx) => this.paintHearts(ctx),
        });
        const heartsEl = new ScreenElement({ x: 22, y: 18, z: 100 });
        heartsEl.graphics.use(this.heartCanvas);
        this.add(heartsEl);

        const icon = new ScreenElement({ x: VIEW_W - 150, y: 16, z: 100 });
        icon.graphics.use(paintedSprite(crystalImage));
        this.add(icon);
        this.crystalText = new Text({ text: `0 / ${total}`, font: font(26) });
        const counter = new ScreenElement({ x: VIEW_W - 126, y: 22, z: 100 });
        counter.graphics.use(this.crystalText);
        this.add(counter);

        this.toastText = new Text({ text: "", font: font(26, "#f4fff6", TextAlign.Center) });
        this.toast = new ScreenElement({ x: VIEW_W / 2, y: 92, z: 100 });
        this.toast.graphics.use(this.toastText);
        this.toast.graphics.opacity = 0;
        this.add(this.toast);

        this.title = new ScreenElement({ x: 0, y: 0, z: 101 });
        this.title.graphics.use(titleCard(style));
        this.add(this.title);
        this.titleTime = 5.5;
    }

    private add(el: ScreenElement): void {
        this.elements.push(el);
        this.scene.add(el);
    }

    setHearts(hearts: number, max: number): void {
        if (hearts === this.hearts && max === this.maxHearts) return;
        this.hearts = hearts;
        this.maxHearts = max;
        this.heartCanvas.flagDirty();
    }

    setCrystals(count: number): void {
        this.crystalText.text = `${count} / ${this.total}`;
    }

    say(message: string, seconds = 2.4): void {
        this.toastText.text = message;
        this.toastTime = seconds;
    }

    hideTitle(): void {
        this.titleTime = Math.min(this.titleTime, 0.8);
    }

    showPanel(lines: string[]): void {
        this.panel?.kill();
        this.panel = new ScreenElement({ x: 0, y: 0, z: 102 });
        this.panel.graphics.use(winPanel(lines, this.style));
        this.panel.graphics.opacity = 0;
        this.scene.add(this.panel);
        this.elements.push(this.panel);
    }

    hidePanel(): void {
        this.panel?.kill();
        this.panel = null;
    }

    update(dt: number): void {
        if (this.toastTime > 0) {
            this.toastTime -= dt;
            this.toast.graphics.opacity = Math.min(1, this.toastTime * 2, (2.6 - this.toastTime) * 4);
        } else {
            this.toast.graphics.opacity = 0;
        }
        if (this.titleTime > 0) {
            this.titleTime -= dt;
            this.title.graphics.opacity = Math.min(1, this.titleTime / 0.8);
        } else {
            this.title.graphics.opacity = 0;
        }
        if (this.panel) this.panel.graphics.opacity = Math.min(1, this.panel.graphics.opacity + dt * 1.5);
    }

    destroy(): void {
        for (const el of this.elements) el.kill();
        this.elements = [];
    }

    private paintHearts(ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, 200, 40);
        for (let i = 0; i < this.maxHearts; i++) {
            const x = 18 + i * 34;
            const full = i < this.hearts;
            if (!full && i >= 3) continue;
            heartPath(ctx, x, 6, 28);
            if (full) {
                const g = ctx.createLinearGradient(0, 6, 0, 34);
                g.addColorStop(0, "#ff9fb4");
                g.addColorStop(0.5, "#e8476b");
                g.addColorStop(1, "#9c1f45");
                ctx.fillStyle = g;
            } else {
                ctx.fillStyle = `rgba(${this.style.emptyHeart},0.55)`;
            }
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "rgba(25,20,30,0.9)";
            ctx.stroke();
            if (full) {
                ctx.fillStyle = "rgba(255,255,255,0.55)";
                ctx.beginPath();
                ctx.ellipse(x - 7, 15, 4, 2.6, -0.6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function titleCard(style: HudStyle): Canvas {
    return new Canvas({
        width: VIEW_W,
        height: VIEW_H,
        cache: true,
        quality: 2,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            const g = ctx.createRadialGradient(VIEW_W / 2, 200, 40, VIEW_W / 2, 200, 420);
            g.addColorStop(0, `rgba(${style.shade},0.55)`);
            g.addColorStop(1, `rgba(${style.shade},0)`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, VIEW_W, VIEW_H);
            ctx.textAlign = "center";
            ctx.shadowColor = `rgba(${style.shade},0.9)`;
            ctx.shadowBlur = 18;
            ctx.fillStyle = style.text;
            ctx.font = `italic 78px ${SERIF}`;
            ctx.fillText(style.title, VIEW_W / 2, 196);
            ctx.shadowBlur = 8;
            ctx.font = `24px ${SERIF}`;
            ctx.fillStyle = style.accent;
            ctx.fillText(style.subtitle, VIEW_W / 2, 238);
            ctx.font = `18px ${SERIF}`;
            ctx.fillStyle = style.text;
            ctx.globalAlpha = 0.9;
            style.hints.forEach((hint, i) => ctx.fillText(hint, VIEW_W / 2, 292 + i * 28));
        },
    });
}

function winPanel(lines: string[], style: HudStyle): Canvas {
    return new Canvas({
        width: VIEW_W,
        height: VIEW_H,
        cache: true,
        quality: 2,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            ctx.fillStyle = `rgba(${style.shade},0.6)`;
            ctx.fillRect(0, 0, VIEW_W, VIEW_H);
            ctx.textAlign = "center";
            ctx.shadowColor = `rgba(${style.shade},0.9)`;
            ctx.shadowBlur = 16;
            ctx.fillStyle = style.text;
            ctx.font = `italic 56px ${SERIF}`;
            ctx.fillText(lines[0], VIEW_W / 2, 210);
            ctx.shadowBlur = 6;
            ctx.font = `24px ${SERIF}`;
            ctx.fillStyle = style.accent;
            lines.slice(1).forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 262 + i * 36));
        },
    });
}

function paintChapter(ctx: CanvasRenderingContext2D, card: ChapterCard): void {
    ctx.fillStyle = card.background;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = card.text;
    ctx.font = `italic 72px ${SERIF}`;
    ctx.fillText(card.title, VIEW_W / 2, 230);
    ctx.shadowBlur = 8;
    ctx.fillStyle = card.accent;
    ctx.font = `26px ${SERIF}`;
    ctx.fillText(card.subtitle, VIEW_W / 2, 276);
    ctx.globalAlpha = 0.75;
    ctx.font = `italic 19px ${SERIF}`;
    ctx.fillText(card.line, VIEW_W / 2, 336);
    ctx.globalAlpha = 1;
    // a thin rule with a lantern-spark at its centre
    const g = ctx.createLinearGradient(VIEW_W / 2 - 140, 0, VIEW_W / 2 + 140, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, card.accent);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(VIEW_W / 2 - 140, 300, 280, 1.5);
    const spark = ctx.createRadialGradient(VIEW_W / 2, 300, 0, VIEW_W / 2, 300, 10);
    spark.addColorStop(0, "rgba(255,214,150,0.95)");
    spark.addColorStop(1, "rgba(255,180,90,0)");
    ctx.fillStyle = spark;
    ctx.fillRect(VIEW_W / 2 - 10, 290, 20, 20);
}

/** The card one scene fades to before it hands over to the next. */
export function chapterCard(card: ChapterCard): Canvas {
    return new Canvas({
        width: VIEW_W,
        height: VIEW_H,
        cache: true,
        quality: 2,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => paintChapter(ctx, card),
    });
}

/**
 * Progress bar while the painted art streams in. With a chapter card it
 * draws that card, so a scene reached through a transition keeps showing it.
 */
export function loadingCard(progress: () => number, style: HudStyle = OKA_HUD, card?: ChapterCard): Canvas {
    const l = style.loading;
    return new Canvas({
        width: VIEW_W,
        height: VIEW_H,
        cache: false,
        quality: 1,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            const p = Math.max(0, Math.min(1, progress()));
            if (card) {
                paintChapter(ctx, card);
                ctx.fillStyle = "rgba(255,255,255,0.08)";
                ctx.fillRect(VIEW_W / 2 - 120, 400, 240, 3);
                ctx.fillStyle = l.bar;
                ctx.fillRect(VIEW_W / 2 - 120, 400, 240 * p, 3);
                return;
            }
            ctx.fillStyle = l.background;
            ctx.fillRect(0, 0, VIEW_W, VIEW_H);
            ctx.textAlign = "center";
            ctx.fillStyle = l.label;
            ctx.font = `italic 34px ${SERIF}`;
            ctx.fillText(l.text, VIEW_W / 2, VIEW_H / 2 - 20);
            ctx.fillStyle = "rgba(205,238,226,0.2)";
            ctx.fillRect(VIEW_W / 2 - 160, VIEW_H / 2 + 10, 320, 6);
            ctx.fillStyle = l.bar;
            ctx.fillRect(VIEW_W / 2 - 160, VIEW_H / 2 + 10, 320 * p, 6);
        },
    });
}

/** A solid veil for fades in and out of a scene. */
export function veil(color: string): Canvas {
    return new Canvas({
        width: VIEW_W,
        height: VIEW_H,
        cache: true,
        quality: 1,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        },
    });
}

/** Translucent on-screen buttons for touch devices. */
export function touchPad(): Canvas {
    return new Canvas({
        width: VIEW_W,
        height: VIEW_H,
        cache: true,
        quality: 2,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            const button = (x: number, y: number, r: number, label: string) => {
                ctx.fillStyle = "rgba(220,255,240,0.14)";
                ctx.strokeStyle = "rgba(220,255,240,0.4)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = "rgba(240,255,250,0.75)";
                ctx.font = `bold 26px ${SERIF}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, x, y + 1);
            };
            button(80, VIEW_H - 80, 44, "◀");
            button(190, VIEW_H - 80, 44, "▶");
            button(VIEW_W - 90, VIEW_H - 90, 54, "▲");
        },
    });
}
