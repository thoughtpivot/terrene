import { Actor, Canvas, ImageFiltering, Scene, vec } from "excalibur";
import { glow } from "../paint";
import { VIEW_W } from "../parallax";
import type { Glint } from "./lighting";

interface Grit {
    actor: Actor;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

const BODY_W = 1150;
const BODY_H = 230;

/** Something very large and very far away, crawling along the cavern behind the columns. */
function crawler(): Canvas {
    return new Canvas({
        width: BODY_W,
        height: BODY_H,
        cache: true,
        quality: 1,
        filtering: ImageFiltering.Blended,
        draw: (ctx) => {
            const spine = (x: number) => 120 + Math.sin(x * 0.006) * 26 + Math.sin(x * 0.017) * 8;
            ctx.fillStyle = "rgba(3,5,10,0.94)";
            // legs first, thin and many
            ctx.strokeStyle = "rgba(3,5,10,0.9)";
            ctx.lineCap = "round";
            for (let x = 60; x < BODY_W - 180; x += 34) {
                const y = spine(x);
                const r = 24 + 12 * Math.sin((x / BODY_W) * Math.PI);
                for (const side of [-1, 1]) {
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x, y + r * 0.5);
                    ctx.quadraticCurveTo(x + side * 16, y + r + 26, x + side * 24 + 6, y + r + 58 + (x % 3) * 6);
                    ctx.stroke();
                }
            }
            // segmented body
            for (let x = 20; x < BODY_W - 140; x += 14) {
                const y = spine(x);
                const r = 18 + 22 * Math.sin((x / (BODY_W - 140)) * Math.PI) ** 0.6;
                ctx.beginPath();
                ctx.ellipse(x, y, r * 0.9, r, 0, 0, Math.PI * 2);
                ctx.fill();
                // dorsal spines
                if (x % 42 === 20) {
                    ctx.beginPath();
                    ctx.moveTo(x - 7, y - r + 4);
                    ctx.lineTo(x + 6, y - r - 18 - (x % 5) * 3);
                    ctx.lineTo(x + 9, y - r + 6);
                    ctx.fill();
                }
            }
            // the head, a blunt hooded skull with two long mandibles
            const hx = BODY_W - 140;
            const hy = spine(hx);
            ctx.beginPath();
            ctx.ellipse(hx + 50, hy - 4, 66, 40, -0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 6;
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(hx + 96, hy + side * 14);
                ctx.quadraticCurveTo(hx + 136, hy + side * 26, hx + 132, hy + side * 4 + 30);
                ctx.stroke();
            }
        },
    });
}

/**
 * Distant movement in the Hollow: a vast crawler that drifts past behind the
 * columns every minute or so (only its pale eye catches any light), and
 * grit that sifts down from the roof with a far-off rumble.
 */
export class HollowAmbience {
    private body: Actor;
    private bodyClock = -14;
    private gritClock = 6;
    private grit: Grit[] = [];
    private gritLook = glow(3, "150,160,180", 0.8, 2);
    private eye: Glint | null = null;

    constructor(private scene: Scene, private rumble: (pan: number) => void, private shake: () => void) {
        this.body = new Actor({ anchor: vec(0, 0), z: -92 });
        this.body.graphics.use(crawler());
        this.body.graphics.opacity = 0;
        scene.add(this.body);
    }

    /** The crawler's eye, in screen space, for the dark to draw. */
    glints(): Glint[] {
        return this.eye ? [this.eye] : [];
    }

    update(dt: number, left: number): void {
        // the crawler: one slow pass from left to right, then a long wait
        this.bodyClock += dt;
        const pass = 70;
        const speed = 34;
        if (this.bodyClock > 0 && this.bodyClock < pass) {
            const sx = -BODY_W + this.bodyClock * speed - (left * 0.07) % 600;
            const sy = 150 + Math.sin(this.bodyClock * 0.21) * 14;
            this.body.pos = vec(left + sx, sy);
            this.body.rotation = Math.sin(this.bodyClock * 0.13) * 0.02;
            const fade = Math.min(1, this.bodyClock / 6, (pass - this.bodyClock) / 6);
            this.body.graphics.opacity = 0.85 * fade;
            const ex = sx + BODY_W - 64;
            const ey = sy + 112;
            const blink = Math.sin(this.bodyClock * 0.7) > 0.97 ? 0.1 : 1;
            this.eye = ex > -40 && ex < VIEW_W + 40 ? { x: ex, y: ey, r: 4.5, rgb: "220,240,200", alpha: 0.75 * fade * blink } : null;
        } else {
            this.body.graphics.opacity = 0;
            this.eye = null;
            if (this.bodyClock >= pass) this.bodyClock = -(40 + Math.random() * 30);
        }

        // grit from the roof
        this.gritClock -= dt;
        if (this.gritClock <= 0) {
            this.gritClock = 8 + Math.random() * 9;
            const sx = 120 + Math.random() * (VIEW_W - 240);
            for (let i = 0; i < 16; i++) {
                const actor = new Actor({ z: 15 });
                actor.graphics.use(this.gritLook);
                actor.graphics.opacity = 0.7;
                this.scene.add(actor);
                this.grit.push({ actor, x: left + sx + (Math.random() - 0.5) * 40, y: -10 - Math.random() * 80, vx: (Math.random() - 0.5) * 14, vy: 30 + Math.random() * 60 });
            }
            if (Math.random() < 0.45) {
                this.rumble((sx - VIEW_W / 2) / (VIEW_W / 2));
                this.shake();
            }
        }
        for (const g of this.grit) {
            g.vy += 260 * dt;
            g.x += g.vx * dt;
            g.y += g.vy * dt;
            g.actor.pos = vec(g.x, g.y);
            if (g.y > 600) g.actor.kill();
        }
        this.grit = this.grit.filter((g) => g.y <= 600);
    }
}
