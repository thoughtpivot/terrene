import { vec } from "excalibur";
import { SHEETS } from "../../scenes/OkaWorld/art/atlas";
import type { Box, OkaHooks } from "../../scenes/OkaWorld/hooks";
import OkaCreature from "../../scenes/OkaWorld/OkaCreature";
import { paintedFrames, paintedImage } from "../../scenes/OkaWorld/paint";
import MossbackImage from "./Mossback.png";

const Resources = {
    Image: paintedImage(MossbackImage),
};

export { Resources };

const WALK = [0, 1, 2, 1];

/**
 * A slow beetle whose shell is a mossy stone. It plods along a ledge and
 * turns around at edges. Hop on its shell to flatten it; walking into it hurts.
 */
export default class Mossback extends OkaCreature {
    readonly stompable = true;
    readonly creatureName = "Mossback";
    private dir: -1 | 1;
    private squashed = 0;

    constructor(x: number, y: number, private minX: number, private maxX: number, hooks: OkaHooks) {
        super(x, y, hooks);
        this.anchor = vec(SHEETS.mossback.ax / SHEETS.mossback.fw, 1);
        this.dir = Math.random() < 0.5 ? -1 : 1;
        this.facing = this.dir;
    }

    onInitialize(): void {
        const s = SHEETS.mossback;
        this.frames = paintedFrames(Resources.Image, s.fw, s.fh, s.frames);
        const g = this.hooks.physics.groundBelow(this.pos.x, this.pos.y - 40, 0);
        if (g) this.pos.y = g.y;
        this.show(0);
    }

    box(): Box {
        return { x: this.pos.x - 32, y: this.pos.y - 46, w: 64, h: 44 };
    }

    stomp(): void {
        if (!this.alive) return;
        super.stomp();
        this.hooks.sfx("stomp", this.pos.x);
        this.hooks.burst("dust", this.pos.x, this.pos.y - 10, 14);
    }

    protected step(dt: number): void {
        if (!this.alive) {
            this.squashed += dt;
            this.show(3);
            if (this.squashed > 0.5) this.graphics.opacity = Math.max(0, 1 - (this.squashed - 0.5) / 0.5);
            if (this.squashed > 1) this.kill();
            return;
        }
        const physics = this.hooks.physics;
        const speed = 34;
        const nx = this.pos.x + this.dir * speed * dt;
        const ahead = physics.groundBelow(nx + this.dir * 34, this.pos.y - 14, 0);
        const blocked = !ahead || ahead.y > this.pos.y + 14 || nx < this.minX || nx > this.maxX;
        if (blocked) {
            this.dir = this.dir === 1 ? -1 : 1;
        } else {
            const here = physics.groundBelow(nx, this.pos.y - 14, 0);
            this.pos.x = nx;
            if (here && here.y <= this.pos.y + 14) this.pos.y = here.y;
        }
        this.facing = this.dir;
        const frame = WALK[Math.floor(this.t * 5) % WALK.length];
        this.show(frame);
    }
}
