/**
 * Embers from Hell and motes of holy light. `ParticleField` is the pure
 * simulation; `ParticleGraphic` draws a field as additive glow dots, all in
 * one sprite batch.
 */
import { Graphic, type ExcaliburGraphicsContext, type ImageSource } from "excalibur";
import type { AtlasRect } from "../art/types.ts";
import { SPARK, type Rgb } from "../palette.ts";
import { seeded } from "../world/chunks.ts";
import { additive } from "./lighting.ts";

export type ParticleKind = "embers" | "motes";

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    age: number;
    life: number;
    size: number;
    color: Rgb;
    phase: number;
}

const MAX_PER_FIELD = 90;

export class ParticleField {
    readonly particles: Particle[] = [];
    private carry = 0;
    private rand: () => number;

    /** Particles spawn around (0, 0) in the field's own space, `spread` pixels wide. */
    constructor(readonly kind: ParticleKind, readonly rate: number, readonly spread: number, seed = 1) {
        this.rand = seeded(seed);
    }

    update(dt: number): void {
        this.carry += this.rate * dt;
        while (this.carry >= 1 && this.particles.length < MAX_PER_FIELD) {
            this.carry -= 1;
            this.particles.push(this.spawn());
        }
        if (this.carry >= 1) this.carry = 0;
        let w = 0;
        for (const p of this.particles) {
            p.age += dt;
            if (p.age >= p.life) continue;
            const sway = Math.sin(p.age * 2.6 + p.phase);
            p.x += (p.vx + sway * (this.kind === "embers" ? 18 : 7)) * dt;
            p.y += p.vy * dt;
            if (this.kind === "embers") p.vy -= 12 * dt;
            this.particles[w++] = p;
        }
        this.particles.length = w;
    }

    private spawn(): Particle {
        const r = this.rand;
        const ember = this.kind === "embers";
        const x = (r() - 0.5) * this.spread;
        const y = (r() - 0.5) * this.spread * 0.45;
        const hot = r() < 0.35;
        return {
            x,
            y,
            vx: (r() - 0.5) * (ember ? 30 : 10),
            vy: ember ? -(45 + r() * 70) : -(8 + r() * 16),
            age: 0,
            life: ember ? 1.6 + r() * 1.8 : 2.8 + r() * 2.6,
            size: ember ? 7 + r() * 9 : 6 + r() * 8,
            color: ember ? (hot ? SPARK.orange : SPARK.red) : r() < 0.5 ? SPARK.gold : SPARK.white,
            phase: r() * Math.PI * 2,
        };
    }

    /** 0..1 brightness at a particle's age: quick in, long tail out, a little twinkle. */
    static alpha(p: Particle): number {
        const t = p.age / p.life;
        const inOut = Math.min(1, t * 6) * (1 - t) * (1 - t);
        return inOut * (0.75 + 0.25 * Math.sin(p.age * 17 + p.phase));
    }
}

export class ParticleGraphic extends Graphic {
    private tints = new Map<Rgb, ReturnType<typeof additive>>();

    constructor(readonly field: ParticleField, readonly image: ImageSource, readonly frame: AtlasRect, readonly gain = 1.6, w = 600, h = 700) {
        super({ width: w, height: h });
    }

    protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
        const img = this.image.image;
        const f = this.frame;
        const ox = x + this.width / 2;
        const oy = y + this.height * 0.8;
        const base = ex.opacity;
        for (const p of this.field.particles) {
            const a = ParticleField.alpha(p);
            if (a <= 0.01) continue;
            let tint = this.tints.get(p.color);
            if (!tint) {
                tint = additive(p.color, this.gain);
                this.tints.set(p.color, tint);
            }
            ex.tint = tint;
            ex.opacity = base * a;
            const s = p.size;
            ex.drawImage(img, f.x, f.y, f.w, f.h, ox + p.x - s, oy + p.y - s, s * 2, s * 2);
        }
        ex.opacity = base;
    }

    clone(): ParticleGraphic {
        return new ParticleGraphic(this.field, this.image, this.frame, this.gain, this.width, this.height);
    }
}
