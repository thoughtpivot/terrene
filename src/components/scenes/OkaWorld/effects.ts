import { Actor, Canvas, Graphic, ImageFiltering, Scene, vec } from "excalibur";
import type { BurstKind } from "./hooks";
import { glow } from "./paint";
import { VIEW_H, VIEW_W } from "./parallax";

interface Particle {
    actor: Actor;
    vx: number;
    vy: number;
    life: number;
    max: number;
    gravity: number;
    drag: number;
    grow: number;
    spin: number;
}

interface Mote {
    actor: Actor;
    x: number;
    y: number;
    phase: number;
    speed: number;
    depth: number;
}

function star(size: number, rgb: string): Canvas {
    return new Canvas({
        width: size,
        height: size,
        cache: true,
        quality: 2,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            const c = size / 2;
            const g = ctx.createRadialGradient(c, c, 0, c, c, c);
            g.addColorStop(0, `rgba(255,255,255,1)`);
            g.addColorStop(0.25, `rgba(${rgb},0.9)`);
            g.addColorStop(1, `rgba(${rgb},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(c, 0);
            ctx.quadraticCurveTo(c, c, size, c);
            ctx.quadraticCurveTo(c, c, c, size);
            ctx.quadraticCurveTo(c, c, 0, c);
            ctx.quadraticCurveTo(c, c, c, 0);
            ctx.fill();
        },
    });
}

function drop(rgb: string, r: number): Canvas {
    const size = r * 2 + 2;
    return new Canvas({
        width: size,
        height: size,
        cache: true,
        quality: 2,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            ctx.fillStyle = `rgba(${rgb},0.9)`;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
            ctx.fill();
        },
    });
}

/** Short-lived particles and the ambient motes that float through the cave. */
export class Effects {
    private particles: Particle[] = [];
    private motes: Mote[] = [];
    private looks: Record<string, Graphic[]>;

    constructor(private scene: Scene) {
        this.looks = {
            sparkle: [star(16, "150,220,255"), star(10, "200,240,255")],
            heart: [star(14, "255,150,180"), glow(8, "255,180,200", 0.9, 2)],
            splash: [drop("200,250,245", 2.2), drop("150,230,230", 1.6)],
            dust: [glow(7, "210,220,200", 0.55, 2), glow(5, "190,200,180", 0.5, 2)],
            poof: [star(14, "150,255,235"), glow(8, "180,255,240", 0.9, 2)],
            glow: [glow(5, "190,255,235", 0.9, 2), glow(3, "230,255,250", 1, 2)],
        };
    }

    burst(kind: BurstKind, x: number, y: number, count = 8): void {
        const looks = this.looks[kind];
        for (let i = 0; i < count; i++) {
            const a = new Actor({ pos: vec(x, y), z: kind === "splash" ? 13 : 15 });
            a.graphics.use(looks[i % looks.length]);
            this.scene.add(a);
            const angle = Math.random() * Math.PI * 2;
            let p: Particle;
            switch (kind) {
                case "sparkle":
                case "heart": {
                    const speed = 60 + Math.random() * 120;
                    p = { actor: a, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40, life: 0, max: 0.55 + Math.random() * 0.35, gravity: 60, drag: 3, grow: -0.8, spin: (Math.random() - 0.5) * 8 };
                    break;
                }
                case "splash": {
                    const speed = 120 + Math.random() * 160;
                    const up = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
                    p = { actor: a, vx: Math.cos(up) * speed * 0.8, vy: Math.sin(up) * speed, life: 0, max: 0.7, gravity: 900, drag: 0.5, grow: 0, spin: 0 };
                    break;
                }
                case "dust": {
                    const speed = 20 + Math.random() * 50;
                    p = { actor: a, vx: Math.cos(angle) * speed, vy: -Math.abs(Math.sin(angle)) * speed * 0.6, life: 0, max: 0.5 + Math.random() * 0.4, gravity: -10, drag: 2.5, grow: 1.2, spin: 0 };
                    break;
                }
                case "poof": {
                    const speed = 50 + Math.random() * 140;
                    p = { actor: a, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0, max: 0.6 + Math.random() * 0.4, gravity: -30, drag: 2.5, grow: -0.6, spin: (Math.random() - 0.5) * 6 };
                    break;
                }
                default: {
                    p = { actor: a, vx: (Math.random() - 0.5) * 12, vy: -12 - Math.random() * 20, life: 0, max: 0.9 + Math.random() * 0.8, gravity: -8, drag: 0.8, grow: -0.4, spin: 0 };
                }
            }
            this.particles.push(p);
        }
    }

    /** Glowing spores drifting in the air, wrapped around the view. */
    seedMotes(count: number): void {
        const looks = [glow(6, "200,255,220", 0.8, 2), glow(4, "255,240,190", 0.8, 2), glow(9, "170,230,255", 0.5, 2)];
        for (let i = 0; i < count; i++) {
            const depth = 0.6 + Math.random() * 0.8;
            const actor = new Actor({ z: depth > 1.15 ? 16 : -60 });
            actor.graphics.use(looks[i % looks.length]);
            actor.scale = vec(depth, depth);
            this.scene.add(actor);
            this.motes.push({ actor, x: Math.random() * VIEW_W, y: Math.random() * VIEW_H, phase: Math.random() * 10, speed: 6 + Math.random() * 12, depth });
        }
    }

    update(dt: number, left: number, lastLeft: number): void {
        for (const p of this.particles) {
            p.life += dt;
            p.vy += p.gravity * dt;
            p.vx *= Math.exp(-p.drag * dt);
            p.vy *= Math.exp(-p.drag * dt * 0.5);
            p.actor.pos = vec(p.actor.pos.x + p.vx * dt, p.actor.pos.y + p.vy * dt);
            const k = p.life / p.max;
            const s = Math.max(0.05, 1 + p.grow * k);
            p.actor.scale = vec(s, s);
            p.actor.rotation += p.spin * dt;
            p.actor.graphics.opacity = Math.max(0, 1 - k * k);
            if (p.life >= p.max) p.actor.kill();
        }
        this.particles = this.particles.filter((p) => p.life < p.max);

        const dx = left - lastLeft;
        for (const m of this.motes) {
            m.phase += dt;
            m.x -= dx * (m.depth - 1);
            m.x += Math.sin(m.phase * 0.5) * 6 * dt;
            m.y -= m.speed * dt * 0.6;
            if (m.y < -10) m.y = VIEW_H + 10;
            if (m.x < -10) m.x += VIEW_W + 20;
            if (m.x > VIEW_W + 10) m.x -= VIEW_W + 20;
            m.actor.pos = vec(left + m.x, m.y + Math.sin(m.phase * 1.3) * 4);
            m.actor.graphics.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(m.phase * (0.6 + m.depth * 0.3)));
        }
    }
}
