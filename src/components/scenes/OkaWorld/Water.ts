import { Actor, Canvas, ImageFiltering, vec } from "excalibur";
import type { Water as WaterRegion } from "./physics";

/** Colours of a pool, as "r,g,b" strings with their alphas. */
export interface WaterStyle {
    /** body gradient stops from the surface down: [offset, "r,g,b", alpha] */
    body: [number, string, number][];
    caustic: [string, number];
    shaft: [string, number];
    surface: [string, number];
    sparkle: number;
}

export const OKA_WATER: WaterStyle = {
    body: [[0, "96,200,190", 0.52], [0.18, "40,140,150", 0.62], [0.6, "18,80,100", 0.8], [1, "8,38,56", 0.92]],
    caustic: ["150,240,230", 0.07],
    shaft: ["180,255,240", 0.10],
    surface: ["210,255,245", 0.75],
    sparkle: 1,
};

interface Ripple {
    x: number;
    age: number;
    strength: number;
}

/**
 * A cave pool drawn every frame: deep jade gradient, drifting caustic light,
 * a moving surface line, and ripples where things splash in. It draws over
 * the hero so anything below the surface looks submerged.
 */
export default class Water extends Actor {
    private ripples: Ripple[] = [];
    private t = Math.random() * 10;
    private canvas: Canvas;

    constructor(readonly region: WaterRegion, private floorY: number, private style: WaterStyle = OKA_WATER) {
        super({ pos: vec(region.x, region.y - 10), anchor: vec(0, 0), z: 12 });
        const w = Math.ceil(region.w);
        const h = Math.ceil(floorY - region.y + 10);
        this.canvas = new Canvas({
            width: w,
            height: h,
            cache: true,
            quality: 1,
            filtering: ImageFiltering.Blended,
            draw: (ctx) => this.paint(ctx, w, h),
        });
    }

    onInitialize(): void {
        this.graphics.use(this.canvas);
    }

    ripple(x: number, strength: number): void {
        this.ripples.push({ x: x - this.region.x, age: 0, strength });
        if (this.ripples.length > 8) this.ripples.shift();
    }

    onPreUpdate(_engine: unknown, delta: number): void {
        const dt = delta / 1000;
        this.t += dt;
        for (const r of this.ripples) r.age += dt;
        this.ripples = this.ripples.filter((r) => r.age < 2.4);
        // re-raster at 30 Hz, and only while the pool is on screen
        this.frame++;
        if (this.frame % 2 === 0 && !this.isOffScreen) this.canvas.flagDirty();
    }

    private frame = 0;

    /** Surface height offset at local x. */
    private wave(x: number): number {
        let y = Math.sin(x * 0.035 + this.t * 1.6) * 1.6 + Math.sin(x * 0.011 - this.t * 0.9) * 2.2;
        for (const r of this.ripples) {
            const d = Math.abs(x - r.x);
            const front = r.age * 120;
            const k = d - front;
            if (Math.abs(k) < 40) {
                y += Math.cos(k * 0.16) * Math.exp(-r.age * 1.6) * 6 * r.strength * (1 - Math.abs(k) / 40);
            }
        }
        return y;
    }

    private paint(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const top = 10;
        ctx.clearRect(0, 0, w, h);

        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 6) ctx.lineTo(x, top + this.wave(x));
        ctx.lineTo(w, h);
        ctx.closePath();
        const body = ctx.createLinearGradient(0, top, 0, h);
        const st = this.style;
        for (const [at, rgb, a] of st.body) body.addColorStop(at, `rgba(${rgb},${a})`);
        ctx.fillStyle = body;
        ctx.fill();

        // caustic light: soft wavering bands
        ctx.save();
        ctx.clip();
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 9; i++) {
            const y = top + 14 + i * ((h - top) / 9);
            ctx.beginPath();
            for (let x = 0; x <= w; x += 10) {
                const yy = y + Math.sin(x * 0.03 + this.t * (0.7 + i * 0.13) + i) * 5 + Math.sin(x * 0.07 - this.t * 1.3) * 2;
                if (x === 0) ctx.moveTo(x, yy);
                else ctx.lineTo(x, yy);
            }
            ctx.strokeStyle = `rgba(${st.caustic[0]},${st.caustic[1] * (1 - i / 10)})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        // slanted shafts of light under the surface
        for (let i = 0; i < 4; i++) {
            const x0 = ((i * 260 + this.t * 14) % (w + 200)) - 100;
            const g = ctx.createLinearGradient(0, top, 0, top + 120);
            g.addColorStop(0, `rgba(${st.shaft[0]},${st.shaft[1]})`);
            g.addColorStop(1, `rgba(${st.shaft[0]},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x0, top);
            ctx.lineTo(x0 + 50, top);
            ctx.lineTo(x0 + 90, top + 120);
            ctx.lineTo(x0 + 20, top + 120);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // the surface line with sparkles
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
            const y = top + this.wave(x);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${st.surface[0]},${st.surface[1]})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = `rgba(${st.surface[0]},${st.surface[1] * 0.24})`;
        ctx.lineWidth = 6;
        ctx.stroke();
        for (let i = 0; i < w / 40; i++) {
            const x = (i * 40 + Math.sin(i * 12.9) * 18 + this.t * 8) % w;
            const a = Math.max(0, Math.sin(this.t * 2.3 + i * 1.7));
            if (a < 0.6) continue;
            ctx.fillStyle = `rgba(255,255,255,${(a - 0.6) * 1.8 * st.sparkle})`;
            ctx.fillRect(x, top + this.wave(x) - 1, 3, 2);
        }
    }
}
