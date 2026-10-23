/**
 * Screen-space layers over the world: a slow drifting haze that parallaxes
 * against the camera, and a vignette that sinks the edges of the view into
 * the void.
 */
import { Color, Graphic, type ExcaliburGraphicsContext, type ImageSource, type Vector } from "excalibur";
import type { AtlasRect } from "../art/types.ts";
import { seeded } from "../world/chunks.ts";

/** Draws a plain canvas; whoever made the canvas owns its texture. */
export class CanvasGraphic extends Graphic {
    readonly canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement, w: number, h: number) {
        super({ width: w, height: h });
        this.canvas = canvas;
    }

    protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
        ex.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, x, y, this.width, this.height);
    }

    clone(): CanvasGraphic {
        return new CanvasGraphic(this.canvas, this.width, this.height);
    }
}

export function vignetteCanvas(w: number, h: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w / 2);
    canvas.height = Math.round(h / 2);
    const g = canvas.getContext("2d");
    if (!g) return canvas;
    const cw = canvas.width;
    const ch = canvas.height;
    g.save();
    g.translate(cw / 2, ch / 2);
    g.scale(1, ch / cw);
    const r = cw * 0.62;
    const grad = g.createRadialGradient(0, 0, r * 0.45, 0, 0, r);
    grad.addColorStop(0, "rgba(5,6,9,0)");
    grad.addColorStop(0.55, "rgba(5,6,9,0.35)");
    grad.addColorStop(1, "rgba(5,6,9,0.92)");
    g.fillStyle = grad;
    g.fillRect(-cw, -cw, cw * 2, cw * 2);
    g.restore();
    return canvas;
}

interface Wisp {
    x: number;
    y: number;
    r: number;
    speed: number;
    alpha: number;
}

/** Faint cold haze in screen space, drifting and sliding a little slower than the world. */
export class FogGraphic extends Graphic {
    private wisps: Wisp[] = [];
    private readonly haze = new Color(120, 132, 160, 0);
    time = 0;
    camera: Vector | null = null;

    constructor(readonly image: ImageSource, readonly frame: AtlasRect, w: number, h: number, count = 14) {
        super({ width: w, height: h });
        const rand = seeded(97);
        for (let i = 0; i < count; i++) {
            this.wisps.push({ x: rand() * w * 1.6, y: rand() * h * 1.6, r: 180 + rand() * 260, speed: 6 + rand() * 12, alpha: 0.05 + rand() * 0.06 });
        }
    }

    protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
        const img = this.image.image;
        const f = this.frame;
        const spanW = this.width * 1.6;
        const spanH = this.height * 1.6;
        const cam = this.camera;
        const base = ex.opacity;
        ex.tint = this.haze;
        for (const w of this.wisps) {
            const px = w.x + this.time * w.speed - (cam ? cam.x * 0.35 : 0);
            const py = w.y - (cam ? cam.y * 0.35 : 0);
            const sx = (((px % spanW) + spanW) % spanW) - this.width * 0.3;
            const sy = (((py % spanH) + spanH) % spanH) - this.height * 0.3;
            ex.opacity = base * w.alpha;
            ex.drawImage(img, f.x, f.y, f.w, f.h, x + sx - w.r, y + sy - w.r * 0.6, w.r * 2, w.r * 1.2);
        }
        ex.opacity = base;
        ex.tint = Color.White;
    }

    clone(): FogGraphic {
        return new FogGraphic(this.image, this.frame, this.width, this.height, this.wisps.length);
    }
}
