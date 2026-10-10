import { Actor, Canvas, Color, ImageFiltering, ImageSource, Scene, Sprite, vec } from "excalibur";
import { LAYERS } from "./art/atlas";

export const VIEW_W = 960;
export const VIEW_H = 540;

interface Layer {
    actors: Actor[];
    factor: number;
    span: number;
    drift: number;
    offset: number;
    y: number;
}

interface TileOptions {
    z: number;
    /** 0 = fixed to the screen, 1 = moves with the world, >1 = in front of it */
    factor: number;
    /** distance between tile starts */
    span: number;
    scale: number;
    y?: number;
    opacity?: number;
    /** alternate tiles are mirrored so a single painting repeats seamlessly */
    mirror?: boolean;
    tint?: Color;
    /** part of the image to use, as fractions */
    view?: { x: number; y: number; w: number; h: number };
    /** shifts where the first tile appears */
    phase?: number;
}

/**
 * The cave behind (and in front of) the play field. Each layer is a row of
 * tiles that scroll at their own rate and wrap around, so the cave never ends.
 */
export class CaveParallax {
    private layers: Layer[] = [];
    private t = 0;
    private rays: Actor | null = null;

    constructor(private scene: Scene, private images: { backdrop: ImageSource; mid: ImageSource; near: ImageSource }) {}

    build(): void {
        const [bw, bh] = LAYERS.backdrop;
        const backdropScale = VIEW_H / bh;
        this.addTiles(this.images.backdrop, { z: -100, factor: 0.04, span: bw * backdropScale, scale: backdropScale, mirror: true });

        this.rays = new Actor({ anchor: vec(0, 0), z: -95 });
        this.rays.graphics.use(lightRays());
        this.scene.add(this.rays);

        this.addTiles(this.images.mid, {
            z: -90, factor: 0.16, span: VIEW_W, scale: 1, opacity: 0.8, mirror: true, tint: Color.fromHex("#d6ece4"),
        });
        this.addMist(-85, 0.3, 150, 0.42, 7);
        const [nw, nh] = LAYERS.near;
        const nearScale = 600 / nh;
        this.addTiles(this.images.near, {
            z: -80, factor: 0.42, span: nw * nearScale + 380, scale: nearScale, y: -30, opacity: 0.96, mirror: true,
            tint: Color.fromHex("#b4cccc"),
        });
        this.addMist(-70, 0.62, 330, 0.34, -11);
        // dark stalactites hanging in front of the play field
        this.addTiles(this.images.near, {
            z: 40, factor: 1.35, span: 1900, scale: 0.6, y: -30, mirror: true, tint: Color.fromHex("#0d1b1f"),
            view: { x: 0, y: 0, w: 0.36, h: 0.8 }, phase: 1250,
        });
    }

    private addTiles(image: ImageSource, o: TileOptions): void {
        const actors: Actor[] = [];
        let count = Math.ceil(VIEW_W / o.span) + 2;
        if (o.mirror && count % 2 === 1) count++;
        const v = o.view ?? { x: 0, y: 0, w: 1, h: 1 };
        for (let i = 0; i < count; i++) {
            const sprite = new Sprite({
                image,
                sourceView: { x: v.x * image.width, y: v.y * image.height, width: v.w * image.width, height: v.h * image.height },
                destSize: { width: v.w * image.width * o.scale, height: v.h * image.height * o.scale },
            });
            sprite.flipHorizontal = !!o.mirror && i % 2 === 1;
            sprite.opacity = o.opacity ?? 1;
            if (o.tint) sprite.tint = o.tint;
            const a = new Actor({ anchor: vec(0, 0), z: o.z });
            a.graphics.use(sprite);
            this.scene.add(a);
            actors.push(a);
        }
        this.layers.push({ actors, factor: o.factor, span: o.span, drift: 0, offset: o.phase ?? 0, y: o.y ?? 0 });
    }

    private addMist(z: number, factor: number, y: number, opacity: number, drift: number): void {
        const span = 1400;
        const actors: Actor[] = [];
        for (let i = 0; i < 3; i++) {
            const a = new Actor({ anchor: vec(0, 0), z });
            const g = mist(span, 230, i * 7 + z);
            g.opacity = opacity;
            a.graphics.use(g);
            this.scene.add(a);
            actors.push(a);
        }
        this.layers.push({ actors, factor, span, drift, offset: 0, y });
    }

    /** Call after the camera moves. `left` is the world x at the left edge of the screen. */
    layout(left: number, dt: number): void {
        this.t += dt;
        for (const layer of this.layers) {
            layer.offset += layer.drift * dt;
            const period = layer.span * layer.actors.length;
            const shift = left * layer.factor - layer.offset;
            const base = Math.floor(shift / period) * period;
            layer.actors.forEach((a, i) => {
                let x = base + i * layer.span - shift;
                if (x < -layer.span) x += period;
                a.pos = vec(left + x, layer.y);
            });
        }
        if (this.rays) {
            this.rays.pos = vec(left - ((left * 0.08) % 400) - 200, 0);
            this.rays.graphics.opacity = 0.75 + Math.sin(this.t * 0.35) * 0.2;
        }
    }
}

/** God rays falling from cracks in the cave roof. */
function lightRays(): Canvas {
    const w = 1600;
    const h = VIEW_H;
    return new Canvas({
        width: w,
        height: h,
        cache: true,
        quality: 1,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            const beams = [
                [180, 70, 0.10], [430, 120, 0.07], [600, 50, 0.12], [910, 140, 0.06],
                [1120, 80, 0.1], [1380, 110, 0.08],
            ];
            for (const [x, width, alpha] of beams) {
                const g = ctx.createLinearGradient(0, 0, 0, h);
                g.addColorStop(0, `rgba(235,255,230,${alpha * 1.4})`);
                g.addColorStop(0.55, `rgba(210,250,225,${alpha * 0.6})`);
                g.addColorStop(1, "rgba(200,240,220,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x + width, 0);
                ctx.lineTo(x + width * 2.2 + 140, h);
                ctx.lineTo(x + 140, h);
                ctx.closePath();
                ctx.fill();
            }
        },
    });
}

/** Wide soft mist bank made of overlapping blurred ellipses. Wraps at its own width. */
function mist(w: number, h: number, seed: number): Canvas {
    let s = Math.abs(seed * 9301 + 49297) % 233280;
    const rand = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
    const blobs = Array.from({ length: 26 }, () => ({
        x: rand() * w,
        y: h * 0.35 + rand() * h * 0.5,
        rx: 90 + rand() * 180,
        ry: 30 + rand() * 50,
        a: 0.12 + rand() * 0.18,
    }));
    return new Canvas({
        width: w,
        height: h,
        cache: true,
        quality: 1,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            for (const b of blobs) {
                for (const dx of [-w, 0, w]) {
                    const cx = b.x + dx;
                    const g = ctx.createRadialGradient(cx, b.y, 0, cx, b.y, b.rx);
                    g.addColorStop(0, `rgba(205,235,225,${b.a})`);
                    g.addColorStop(1, "rgba(205,235,225,0)");
                    ctx.save();
                    ctx.translate(cx, b.y);
                    ctx.scale(1, b.ry / b.rx);
                    ctx.translate(-cx, -b.y);
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, b.y, b.rx, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        },
    });
}
