import { Actor, vec } from "excalibur";
import { SHEETS } from "../../scenes/OkaWorld/art/atlas";
import type { Box, OkaHooks } from "../../scenes/OkaWorld/hooks";
import OkaCreature from "../../scenes/OkaWorld/OkaCreature";
import { glow, paintedFrames, paintedImage } from "../../scenes/OkaWorld/paint";
import type { Water } from "../../scenes/OkaWorld/physics";
import GloomfinImage from "./Gloomfin.png";

const Resources = {
    Image: paintedImage(GloomfinImage),
};

export { Resources };

type Mode = "swim" | "leap";

/** Where the lure bulb sits in each frame, from the middle of the frame, facing right. */
const LURE: [number, number][] = [[38, -5], [38, -7], [32, -25], [30, 20]];

/**
 * A deep-pool anglerfish with a glowing lure. It cruises under the surface
 * and lunges out of the water at anything passing overhead. Too spiny to stomp.
 */
export default class Gloomfin extends OkaCreature {
    readonly stompable = false;
    readonly creatureName = "Gloomfin";
    private mode: Mode = "swim";
    private vx = 0;
    private vy = 0;
    private dir: -1 | 1 = 1;
    private cooldown = 1.5 + Math.random() * 2;
    private lure = new Actor({ z: 8.5 });
    private depth: number;

    constructor(private water: Water, hooks: OkaHooks) {
        super(water.x + water.w * (0.3 + Math.random() * 0.4), water.y + 46, hooks, 9);
        this.anchor = vec(0.5, 0.5);
        this.artFacing = 1;
        this.depth = 34 + Math.random() * 30;
    }

    onInitialize(): void {
        const s = SHEETS.gloomfin;
        this.frames = paintedFrames(Resources.Image, s.fw, s.fh, s.frames);
        this.lure.graphics.use(glow(22, "150,255,190", 0.7));
        this.addChild(this.lure);
        this.show(0);
    }

    box(): Box {
        return { x: this.pos.x - 28, y: this.pos.y - 14, w: 56, h: 28 };
    }

    protected step(dt: number): void {
        const w = this.water;
        const hero = this.hooks.hero.rig;
        if (this.mode === "swim") {
            this.cooldown -= dt;
            const speed = 48;
            this.pos.x += this.dir * speed * dt;
            const targetY = w.y + this.depth + Math.sin(this.t * 1.7) * 6;
            this.pos.y += (targetY - this.pos.y) * Math.min(1, dt * 2);
            if (this.pos.x < w.x + 40) this.dir = 1;
            if (this.pos.x > w.x + w.w - 40) this.dir = -1;
            this.facing = this.dir;
            this.rotation = 0;
            this.show(Math.floor(this.t * 4) % 2);
            const dx = hero.x - this.pos.x;
            const heroAbove = hero.y < w.y + 4 && hero.y > w.y - 200;
            const heroOverWater = hero.x > w.x - 60 && hero.x < w.x + w.w + 60;
            if (this.cooldown <= 0 && heroAbove && heroOverWater && Math.abs(dx) < 240) {
                this.mode = "leap";
                this.vy = -640;
                const air = 1.15;
                this.vx = Math.max(-200, Math.min(200, dx / air));
                this.dir = this.vx < 0 ? -1 : 1;
                this.hooks.sfx("splash", this.pos.x, 1.15);
                this.hooks.burst("splash", this.pos.x, w.y, 12);
                this.hooks.ripple(w, this.pos.x, 1);
            }
        } else {
            this.vy += 1100 * dt;
            this.pos.x += this.vx * dt;
            this.pos.y += this.vy * dt;
            this.facing = this.dir;
            this.show(this.vy < 0 ? 2 : 3);
            if (this.vy > 0 && this.pos.y > w.y + 10) {
                this.mode = "swim";
                this.cooldown = 2.6 + Math.random() * 1.5;
                this.pos.x = Math.max(w.x + 40, Math.min(w.x + w.w - 40, this.pos.x));
                this.hooks.sfx("splash", this.pos.x, 0.9);
                this.hooks.burst("splash", this.pos.x, w.y, 14);
                this.hooks.ripple(w, this.pos.x, 1.2);
            }
        }
        const [lx, ly] = LURE[this.frameIndex];
        this.lure.pos = vec(this.facing === 1 ? lx : -lx, ly);
        this.lure.graphics.opacity = 0.7 + Math.sin(this.t * 3) * 0.25;
    }
}
