import { Canvas, ImageFiltering, Scene, ScreenElement, vec } from "excalibur";
import { VIEW_H, VIEW_W } from "../parallax";

/** A light in world space. `r` is its reach; `strength` 0..1 is how much darkness it lifts at its heart. */
export interface Light {
    x: number;
    y: number;
    r: number;
    strength: number;
    /** throws warm lantern colour as well as light */
    warm?: boolean;
}

/** A pinpoint that glows through the dark, in screen space: distant eyes and the like. */
export interface Glint {
    x: number;
    y: number;
    r: number;
    rgb: string;
    alpha: number;
}

interface Watcher {
    /** position in the watcher's own parallax space */
    x: number;
    y: number;
    /** parallax factor: smaller is further away */
    depth: number;
    gap: number;
    rgb: string;
    open: number;
    wantOpen: boolean;
    timer: number;
    blink: number;
    look: number;
}

/** The overlay is painted at half size and scaled up: the dark is soft anyway. */
const SCALE = 2;
const W = VIEW_W / SCALE;
const H = VIEW_H / SCALE;
const WRAP = 2600;

/**
 * The Hollow's darkness. A dim veil over the whole play field, with holes
 * cut where light falls: Mori's lantern, lit lanterns, pale mushrooms, the
 * creatures' own glow. Lantern light also spills warm colour. Around the
 * edges a vignette closes in, and from the dark between the pillars pairs of
 * eyes watch Mori, closing whenever his light comes near.
 *
 * Drawn above the world and its foreground silhouettes, below the HUD.
 */
export class HollowDark {
    private el: ScreenElement;
    private canvas: Canvas;
    private lights: Light[] = [];
    private glints: Glint[] = [];
    private watchers: Watcher[] = [];
    private left = 0;
    private t = 0;
    private hero: { x: number; y: number } | null = null;
    private frame = 0;
    /** 0..1 how far the dark is lifted everywhere, e.g. after the shrine wakes */
    lift = 0;

    constructor(scene: Scene, private depth = 0.6) {
        this.canvas = new Canvas({
            width: W,
            height: H,
            cache: true,
            quality: 1,
            filtering: ImageFiltering.Blended,
            draw: (ctx) => this.paint(ctx),
        });
        this.el = new ScreenElement({ x: 0, y: 0, z: 60 });
        this.el.scale = vec(SCALE, SCALE);
        this.el.graphics.use(this.canvas);
        scene.add(this.el);
        const tints = ["205,255,140", "225,235,255", "205,255,140", "255,210,150", "190,255,200"];
        for (let i = 0; i < 9; i++) {
            this.watchers.push({
                x: (i / 9) * WRAP + Math.random() * 180,
                y: 150 + Math.random() * 200,
                depth: 0.22 + Math.random() * 0.36,
                gap: 7 + Math.random() * 5,
                rgb: tints[i % tints.length],
                open: 0,
                wantOpen: Math.random() < 0.5,
                timer: 2 + Math.random() * 6,
                blink: 0,
                look: 0,
            });
        }
    }

    get actor(): ScreenElement {
        return this.el;
    }

    /** Hand over this frame's lights and glints. `left` is the world x at the screen's left edge. */
    update(dt: number, left: number, lights: Light[], glints: Glint[], hero: { x: number; y: number } | null): void {
        this.t += dt;
        this.left = left;
        this.lights = lights;
        this.glints = glints;
        this.hero = hero;
        for (const w of this.watchers) this.watch(w, dt);
        // re-raster at 30 Hz: the dark moves slowly and the canvas upload is not free
        this.frame++;
        if (this.frame % 2 === 0) this.canvas.flagDirty();
    }

    private watcherScreen(w: Watcher): { x: number; y: number } {
        let x = (w.x - this.left * w.depth) % WRAP;
        if (x < 0) x += WRAP;
        return { x: x - 300, y: w.y };
    }

    private watch(w: Watcher, dt: number): void {
        const at = this.watcherScreen(w);
        const hero = this.hero;
        let near = false;
        if (hero) {
            const hx = hero.x - this.left;
            near = Math.hypot(hx - at.x, (hero.y - at.y) * 1.4) < 230;
            w.look += ((hx < at.x ? -1 : 1) * 1.6 - w.look) * Math.min(1, dt * 2);
        }
        w.timer -= dt;
        if (w.timer <= 0) {
            w.wantOpen = !w.wantOpen && Math.random() < 0.7;
            w.timer = w.wantOpen ? 4 + Math.random() * 7 : 2 + Math.random() * 5;
            if (!w.wantOpen) w.y = 140 + Math.random() * 210;
        }
        const target = w.wantOpen && !near && this.lift < 0.5 ? 1 : 0;
        w.open += (target - w.open) * Math.min(1, dt * (target ? 1.2 : 6));
        if (w.blink > 0) w.blink -= dt;
        else if (w.open > 0.9 && Math.random() < dt * 0.25) w.blink = 0.16;
    }

    private paint(ctx: CanvasRenderingContext2D): void {
        const lift = this.lift;
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, W, H);

        const veil = ctx.createLinearGradient(0, 0, 0, H);
        const a = this.depth * (1 - lift * 0.7);
        veil.addColorStop(0, `rgba(1,3,8,${Math.min(0.95, a * 1.3)})`);
        veil.addColorStop(0.45, `rgba(2,5,12,${a * 0.9})`);
        veil.addColorStop(0.78, `rgba(2,5,12,${a * 0.85})`);
        veil.addColorStop(1, `rgba(1,2,6,${Math.min(0.95, a * 1.25)})`);
        ctx.fillStyle = veil;
        ctx.fillRect(0, 0, W, H);

        // carve the light out of the dark
        ctx.globalCompositeOperation = "destination-out";
        for (const l of this.lights) {
            const x = (l.x - this.left) / SCALE;
            const y = l.y / SCALE;
            const r = l.r / SCALE;
            if (x < -r || x > W + r) continue;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, `rgba(0,0,0,${l.strength})`);
            g.addColorStop(0.35, `rgba(0,0,0,${l.strength * 0.72})`);
            g.addColorStop(0.7, `rgba(0,0,0,${l.strength * 0.25})`);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }

        // lantern light is warm
        ctx.globalCompositeOperation = "source-over";
        for (const l of this.lights) {
            if (!l.warm) continue;
            const x = (l.x - this.left) / SCALE;
            const y = l.y / SCALE;
            const r = (l.r * 0.8) / SCALE;
            if (x < -r || x > W + r) continue;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, `rgba(255,170,80,${0.1 * l.strength})`);
            g.addColorStop(0.5, `rgba(255,140,60,${0.045 * l.strength})`);
            g.addColorStop(1, "rgba(255,120,50,0)");
            ctx.fillStyle = g;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }

        // vignette
        const v = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.42, W / 2, H * 0.55, W * 0.62);
        v.addColorStop(0, "rgba(0,0,0,0)");
        v.addColorStop(1, `rgba(0,0,0,${0.62 * (1 - lift * 0.5)})`);
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, W, H);

        // eyes in the dark
        for (const w of this.watchers) {
            if (w.open < 0.02) continue;
            const at = this.watcherScreen(w);
            if (at.x < -20 || at.x > VIEW_W + 20) continue;
            const lid = w.blink > 0 ? 0.08 : w.open;
            const s = (0.6 + w.depth) / SCALE;
            for (const side of [-1, 1]) {
                const ex = (at.x + side * w.gap * (0.6 + w.depth) + w.look) / SCALE;
                const ey = at.y / SCALE;
                this.eye(ctx, ex, ey, 2.4 * s, Math.max(0.15, 1.5 * s * lid), w.rgb, w.open * 0.9);
            }
        }
        for (const g of this.glints) {
            this.eye(ctx, g.x / SCALE, g.y / SCALE, g.r / SCALE, (g.r * 0.6) / SCALE, g.rgb, g.alpha);
        }
    }

    private eye(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rgb: string, alpha: number): void {
        const halo = ctx.createRadialGradient(x, y, 0, x, y, rx * 4);
        halo.addColorStop(0, `rgba(${rgb},${alpha * 0.35})`);
        halo.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = halo;
        ctx.fillRect(x - rx * 4, y - rx * 4, rx * 8, rx * 8);
        ctx.fillStyle = `rgba(${rgb},${alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}
