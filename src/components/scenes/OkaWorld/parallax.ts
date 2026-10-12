import { Actor, Canvas, Color, ImageFiltering, ImageSource, Scene, Sprite, vec } from "excalibur";

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

export type ParallaxImage = "backdrop" | "mid" | "near";

/** A row of painted tiles that scroll at their own rate and wrap around. */
export interface TileLayer {
    kind: "tiles";
    image: ParallaxImage;
    z: number;
    /** 0 = fixed to the screen, 1 = moves with the world, >1 = in front of it */
    factor: number;
    /** drawn height of the whole image, in scene units */
    height: number;
    /** space between tiles; the distance between tile starts is the drawn width plus this */
    gap?: number;
    y?: number;
    opacity?: number;
    /** alternate tiles are mirrored so a single painting repeats seamlessly */
    mirror?: boolean;
    tint?: string;
    /** part of the image to use, as fractions */
    view?: { x: number; y: number; w: number; h: number };
    /** shifts where the first tile appears */
    phase?: number;
}

/** A wide soft bank of mist. */
export interface MistLayer {
    kind: "mist";
    z: number;
    factor: number;
    y: number;
    opacity: number;
    /** sideways drift in scene units per second */
    drift: number;
    height?: number;
}

/** Beams of light falling from cracks in the roof. */
export interface RaysLayer {
    kind: "rays";
    z: number;
    /** [x, width, alpha] per beam across a 1600-wide strip */
    beams?: [number, number, number][];
}

export type ParallaxLayer = TileLayer | MistLayer | RaysLayer;

export interface ParallaxStyle {
    layers: ParallaxLayer[];
    /** "r,g,b" of the mist */
    mist: string;
    /** "r,g,b" at the top of a light ray, and lower down */
    rays: [string, string];
    raysOpacity: number;
}

/** Oka World's misty jade cave. */
export const OKA_PARALLAX: ParallaxStyle = {
    mist: "205,235,225",
    rays: ["235,255,230", "210,250,225"],
    raysOpacity: 0.75,
    layers: [
        { kind: "tiles", image: "backdrop", z: -100, factor: 0.04, height: VIEW_H, mirror: true },
        { kind: "rays", z: -95 },
        { kind: "tiles", image: "mid", z: -90, factor: 0.16, height: VIEW_H, opacity: 0.8, mirror: true, tint: "#d6ece4" },
        { kind: "mist", z: -85, factor: 0.3, y: 150, opacity: 0.42, drift: 7 },
        { kind: "tiles", image: "near", z: -80, factor: 0.42, height: 600, gap: 380, y: -30, opacity: 0.96, mirror: true, tint: "#b4cccc" },
        { kind: "mist", z: -70, factor: 0.62, y: 330, opacity: 0.34, drift: -11 },
        // dark stalactites hanging in front of the play field
        {
            kind: "tiles", image: "near", z: 40, factor: 1.35, height: 432, gap: 1900, y: -30, mirror: true, tint: "#0d1b1f",
            view: { x: 0, y: 0, w: 0.36, h: 0.8 }, phase: 1250,
        },
    ],
};

/**
 * The cave behind (and in front of) the play field. Each layer is a row of
 * tiles that scroll at their own rate and wrap around, so the cave never ends.
 */
export class CaveParallax {
    private layers: Layer[] = [];
    private t = 0;
    private rays: Actor | null = null;

    constructor(
        private scene: Scene,
        private images: Record<ParallaxImage, ImageSource>,
        private style: ParallaxStyle = OKA_PARALLAX,
    ) {}

    build(): void {
        for (const layer of this.style.layers) {
            if (layer.kind === "tiles") this.addTiles(layer);
            else if (layer.kind === "mist") this.addMist(layer);
            else this.addRays(layer);
        }
    }

    private addRays(o: RaysLayer): void {
        this.rays = new Actor({ anchor: vec(0, 0), z: o.z });
        this.rays.graphics.use(lightRays(this.style.rays, o.beams));
        this.scene.add(this.rays);
    }

    private addTiles(o: TileLayer): void {
        const image = this.images[o.image];
        const scale = o.height / image.height;
        const v = o.view ?? { x: 0, y: 0, w: 1, h: 1 };
        // a cropped view keeps the gap as the distance between tile starts, like the full image does with gap 0
        const span = o.view ? (o.gap ?? 0) : image.width * scale + (o.gap ?? 0);
        const actors: Actor[] = [];
        let count = Math.ceil(VIEW_W / span) + 2;
        if (o.mirror && count % 2 === 1) count++;
        for (let i = 0; i < count; i++) {
            const sprite = new Sprite({
                image,
                sourceView: { x: v.x * image.width, y: v.y * image.height, width: v.w * image.width, height: v.h * image.height },
                destSize: { width: v.w * image.width * scale, height: v.h * image.height * scale },
            });
            sprite.flipHorizontal = !!o.mirror && i % 2 === 1;
            sprite.opacity = o.opacity ?? 1;
            if (o.tint) sprite.tint = Color.fromHex(o.tint);
            const a = new Actor({ anchor: vec(0, 0), z: o.z });
            a.graphics.use(sprite);
            this.scene.add(a);
            actors.push(a);
        }
        this.layers.push({ actors, factor: o.factor, span, drift: 0, offset: o.phase ?? 0, y: o.y ?? 0 });
    }

    private addMist(o: MistLayer): void {
        const span = 1400;
        const actors: Actor[] = [];
        for (let i = 0; i < 3; i++) {
            const a = new Actor({ anchor: vec(0, 0), z: o.z });
            const g = mist(span, o.height ?? 230, i * 7 + o.z, this.style.mist);
            g.opacity = o.opacity;
            a.graphics.use(g);
            this.scene.add(a);
            actors.push(a);
        }
        this.layers.push({ actors, factor: o.factor, span, drift: o.drift, offset: 0, y: o.y });
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
            const o = this.style.raysOpacity;
            this.rays.graphics.opacity = o + Math.sin(this.t * 0.35) * o * 0.27;
        }
    }
}

const BEAMS: [number, number, number][] = [
    [180, 70, 0.10], [430, 120, 0.07], [600, 50, 0.12], [910, 140, 0.06],
    [1120, 80, 0.1], [1380, 110, 0.08],
];

/** God rays falling from cracks in the cave roof. */
function lightRays([top, low]: [string, string], beams = BEAMS): Canvas {
    const w = 1600;
    const h = VIEW_H;
    return new Canvas({
        width: w,
        height: h,
        cache: true,
        quality: 1,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            for (const [x, width, alpha] of beams) {
                const g = ctx.createLinearGradient(0, 0, 0, h);
                g.addColorStop(0, `rgba(${top},${alpha * 1.4})`);
                g.addColorStop(0.55, `rgba(${low},${alpha * 0.6})`);
                g.addColorStop(1, `rgba(${low},0)`);
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
function mist(w: number, h: number, seed: number, rgb: string): Canvas {
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
                    g.addColorStop(0, `rgba(${rgb},${b.a})`);
                    g.addColorStop(1, `rgba(${rgb},0)`);
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
