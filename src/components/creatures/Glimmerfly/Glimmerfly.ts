import { Actor, vec } from "excalibur";
import { SHEETS } from "../../scenes/OkaWorld/art/atlas";
import type { Box, OkaHooks } from "../../scenes/OkaWorld/hooks";
import OkaCreature from "../../scenes/OkaWorld/OkaCreature";
import { glow, paintedFrames, paintedImage } from "../../scenes/OkaWorld/paint";
import GlimmerflyImage from "./Glimmerfly.png";

const Resources = {
    Image: paintedImage(GlimmerflyImage),
};

export { Resources };

/**
 * A glowing cave moth that loops figure-eights over chasms and water.
 * Its dust stings on contact, but a well-timed hop from above sends it
 * scattering into sparks.
 */
export default class Glimmerfly extends OkaCreature {
    readonly stompable = true;
    readonly creatureName = "Glimmerfly";
    private halo = new Actor({ z: 8.5 });
    private phase = Math.random() * Math.PI * 2;
    private gone = 0;
    private lastX: number;

    constructor(private homeX: number, private homeY: number, private rx: number, private ry: number, hooks: OkaHooks) {
        super(homeX, homeY, hooks, 9);
        this.anchor = vec(0.5, 0.5);
        this.lastX = homeX;
    }

    onInitialize(): void {
        const s = SHEETS.glimmerfly;
        this.frames = paintedFrames(Resources.Image, s.fw, s.fh, s.frames);
        this.halo.graphics.use(glow(46, "150,255,235", 0.45));
        this.addChild(this.halo);
        this.show(0);
    }

    box(): Box {
        return { x: this.pos.x - 16, y: this.pos.y - 14, w: 32, h: 28 };
    }

    stomp(): void {
        if (!this.alive) return;
        super.stomp();
        this.hooks.sfx("crystal", this.pos.x, 0.7);
        this.hooks.burst("poof", this.pos.x, this.pos.y, 18);
    }

    protected step(dt: number): void {
        if (!this.alive) {
            this.gone += dt;
            this.graphics.opacity = Math.max(0, 1 - this.gone / 0.3);
            this.halo.graphics.opacity = this.graphics.opacity;
            if (this.gone > 0.3) this.kill();
            return;
        }
        this.phase += dt * 0.9;
        const x = this.homeX + Math.sin(this.phase) * this.rx;
        const y = this.homeY + Math.sin(this.phase * 2) * this.ry + Math.sin(this.t * 7) * 2;
        this.facing = x < this.lastX ? -1 : 1;
        this.lastX = x;
        this.pos = vec(x, y);
        this.show(Math.floor(this.t * 12) % 4);
        this.halo.graphics.opacity = 0.75 + Math.sin(this.t * 5) * 0.2;
        if (Math.random() < dt * 6) this.hooks.burst("glow", x + (Math.random() - 0.5) * 16, y + 8, 1);
    }
}
