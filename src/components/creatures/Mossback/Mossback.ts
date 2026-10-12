import { Actor, vec } from "excalibur";
import { MOSSBACK_EYES } from "../../scenes/OkaWorld/2/art/atlas";
import { SHEETS, STORE } from "../../scenes/OkaWorld/art/atlas";
import type { Box, OkaHooks, OkaVariant } from "../../scenes/OkaWorld/hooks";
import OkaCreature from "../../scenes/OkaWorld/OkaCreature";
import { glow, paintedFrames, paintedImage } from "../../scenes/OkaWorld/paint";
import MossbackDarkImage from "./Mossback-dark.png";
import MossbackImage from "./Mossback.png";

const Resources = {
    Image: paintedImage(MossbackImage),
    /** Oka World 2: a bone-pale husk over a near-black indigo shell, with acid-green eyes. */
    Dark: paintedImage(MossbackDarkImage),
};

export { Resources };

const WALK = [0, 1, 2, 1];

/**
 * A slow beetle whose shell is a mossy stone. It plods along a ledge and
 * turns around at edges. Hop on its shell to flatten it; walking into it hurts.
 *
 * The dark variant, from the Hollow, walks a little faster and its eyes glow.
 */
export default class Mossback extends OkaCreature {
    readonly stompable = true;
    readonly creatureName = "Mossback";
    private dir: -1 | 1;
    private squashed = 0;
    private speed: number;
    private eyes: Actor | null = null;

    constructor(x: number, y: number, private minX: number, private maxX: number, hooks: OkaHooks, readonly variant: OkaVariant = "light") {
        super(x, y, hooks);
        this.anchor = vec(SHEETS.mossback.ax / SHEETS.mossback.fw, 1);
        this.dir = Math.random() < 0.5 ? -1 : 1;
        this.facing = this.dir;
        this.speed = variant === "dark" ? 44 : 34;
    }

    onInitialize(): void {
        const s = SHEETS.mossback;
        this.frames = paintedFrames(this.variant === "dark" ? Resources.Dark : Resources.Image, s.fw, s.fh, s.frames);
        const g = this.hooks.physics.groundBelow(this.pos.x, this.pos.y - 40, 0);
        if (g) this.pos.y = g.y;
        if (this.variant === "dark") {
            this.eyes = new Actor({ z: 0.1 });
            this.eyes.graphics.use(glow(14, "190,255,110", 0.85, 2));
            this.addChild(this.eyes);
        }
        this.show(0);
    }

    /** World position of the glowing eyes (dark variant), for lighting. */
    eyeGlow(): { x: number; y: number } | null {
        if (!this.eyes) return null;
        return { x: this.pos.x + this.eyes.pos.x, y: this.pos.y + this.eyes.pos.y };
    }

    private placeEyes(): void {
        if (!this.eyes) return;
        const at = MOSSBACK_EYES[this.frameIndex];
        if (!at) return;
        const s = SHEETS.mossback;
        const w = s.fw / STORE;
        const ax = s.ax / STORE;
        const flipped = this.facing !== this.artFacing;
        this.eyes.pos = vec(flipped ? w - at[0] - ax : at[0] - ax, at[1]);
        this.eyes.graphics.opacity = this.alive ? 0.8 + Math.sin(this.t * 6) * 0.2 : Math.max(0, 1 - this.squashed * 2);
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
            this.placeEyes();
            if (this.squashed > 0.5) this.graphics.opacity = Math.max(0, 1 - (this.squashed - 0.5) / 0.5);
            if (this.squashed > 1) this.kill();
            return;
        }
        const physics = this.hooks.physics;
        const speed = this.speed;
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
        const frame = WALK[Math.floor(this.t * (this.variant === "dark" ? 6 : 5)) % WALK.length];
        this.show(frame);
        this.placeEyes();
    }
}
