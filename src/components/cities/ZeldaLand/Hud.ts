import { Canvas, Color, ImageFiltering, ScreenElement, vec } from "excalibur";
import { BROWN, RED, TAN, WHITE } from "./palette";
import { zeldaRun } from "./run";

const FONT: Record<string, string[]> = {
    " ": ["000", "000", "000", "000", "000"],
    ".": ["000", "000", "000", "000", "010"],
    A: ["010", "101", "111", "101", "101"],
    B: ["110", "101", "110", "101", "110"],
    C: ["011", "100", "100", "100", "011"],
    D: ["110", "101", "101", "101", "110"],
    E: ["111", "100", "110", "100", "111"],
    F: ["111", "100", "110", "100", "100"],
    G: ["011", "100", "101", "101", "011"],
    H: ["101", "101", "111", "101", "101"],
    I: ["111", "010", "010", "010", "111"],
    K: ["101", "110", "100", "110", "101"],
    L: ["100", "100", "100", "100", "111"],
    M: ["101", "111", "101", "101", "101"],
    N: ["110", "101", "101", "101", "101"],
    O: ["111", "101", "101", "101", "111"],
    P: ["110", "101", "110", "100", "100"],
    Q: ["111", "101", "101", "111", "001"],
    R: ["110", "101", "110", "101", "101"],
    S: ["011", "100", "010", "001", "110"],
    T: ["111", "010", "010", "010", "010"],
    U: ["101", "101", "101", "101", "111"],
    V: ["101", "101", "101", "101", "010"],
    W: ["101", "101", "101", "111", "101"],
    Y: ["101", "101", "010", "010", "010"],
    Z: ["111", "001", "010", "100", "111"],
};

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
    const glyphs = text.toUpperCase();
    for (let i = 0; i < glyphs.length; i++) {
        const rows = FONT[glyphs[i]] ?? FONT[" "];
        for (let gy = 0; gy < rows.length; gy++) {
            for (let gx = 0; gx < rows[gy].length; gx++) {
                if (rows[gy][gx] !== "1") continue;
                ctx.fillStyle = color;
                ctx.fillRect(x + i * 7 + gx * 2, y + gy * 2, 2, 2);
            }
        }
    }
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, filled: boolean): void {
    const c = filled ? RED : "#3c3c3c";
    ctx.fillStyle = c;
    ctx.fillRect(x + 1, y, 2, 1);
    ctx.fillRect(x + 4, y, 2, 1);
    ctx.fillRect(x, y + 1, 7, 2);
    ctx.fillRect(x + 1, y + 3, 5, 1);
    ctx.fillRect(x + 2, y + 4, 3, 1);
    ctx.fillRect(x + 3, y + 5, 1, 1);
    if (filled) {
        ctx.fillStyle = WHITE;
        ctx.fillRect(x + 1, y + 1, 1, 1);
    }
}

function drawBlade(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = WHITE;
    ctx.fillRect(x + 3, y, 1, 6);
    ctx.fillStyle = BROWN;
    ctx.fillRect(x + 2, y + 6, 3, 2);
}

export class Hud extends ScreenElement {
    private canvas: Canvas;
    private age = 0;

    constructor(private title: string) {
        super({
            pos: vec(0, 0),
            anchor: vec(0, 0),
            z: 100,
        });
        this.canvas = new Canvas({
            width: 256,
            height: 48,
            cache: true,
            smoothing: false,
            filtering: ImageFiltering.Pixel,
            origin: vec(0, 0),
            color: Color.fromRGB(0, 0, 0, 1),
            draw: (ctx) => this.paint(ctx),
        });
        this.graphics.use(this.canvas);
    }

    onPreUpdate(_engine: unknown, delta: number): void {
        const dt = delta / 1000;
        this.age += dt;
        if (zeldaRun.messageTime > 0) {
            zeldaRun.messageTime -= dt;
            if (zeldaRun.messageTime <= 0) zeldaRun.message = "";
        }
        this.canvas.flagDirty();
    }

    private paint(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 256, 48);
        for (let i = 0; i < zeldaRun.maxHearts; i++) {
            drawHeart(ctx, 8 + i * 12, 6, i < zeldaRun.hearts);
        }
        const title = this.title;
        drawText(ctx, title, Math.floor((256 - title.length * 7) / 2), 6, WHITE);
        if (zeldaRun.blade) drawBlade(ctx, 236, 4);
        const line = zeldaRun.message || (this.age < 7 ? "ARROWS MOVE  Z SWINGS" : "");
        if (line) drawText(ctx, line, 8, 28, TAN);
        ctx.fillStyle = TAN;
        ctx.fillRect(0, 44, 256, 1);
        ctx.fillStyle = BROWN;
        ctx.fillRect(0, 45, 256, 2);
    }
}
