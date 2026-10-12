import { Actor, Canvas, ImageFiltering, vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { glow, paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import HangingLanternImage from "./HangingLantern.png";

const Resources = {
    Image: paintedImage(HangingLanternImage),
};

export { Resources };

/** How far above the ground the lantern hangs, and where its chain is fixed (world y). */
const HANG = 150;
const CEILING = -20;

/**
 * An old iron lantern on a long chain, swaying a little in the dark. Fixture:
 * it stays put. Its pale flame is almost out; when Mori walks beneath it she
 * lends it her own warm light, and scenes use a lit lantern as a checkpoint.
 * `pos` is the ground under the lantern.
 */
export default class HangingLantern extends FixtureItem {
    readonly itemName = "HangingLantern";
    lit = false;
    private pendulum = new Actor({ anchor: vec(0.5, 0) });
    private cold = new Actor();
    private warm = new Actor();
    private t = Math.random() * 10;
    private length: number;
    private warmth = 0;

    constructor(options: ItemOptions, readonly checkpoint = true) {
        super(options);
        this.reach = { w: 70, h: 170 };
        this.length = options.y - HANG - CEILING;
    }

    onInitialize(): void {
        const chain = new Canvas({
            width: 4,
            height: Math.ceil(this.length),
            cache: true,
            quality: 2,
            filtering: ImageFiltering.Blended,
            draw: (ctx) => {
                for (let y = 0; y < this.length; y += 7) {
                    ctx.fillStyle = y % 14 === 0 ? "rgba(70,78,96,0.95)" : "rgba(40,46,60,0.95)";
                    ctx.fillRect(1, y, 2, 6);
                }
            },
        });
        this.pendulum.pos = vec(0, CEILING - this.pos.y);
        this.pendulum.graphics.use(chain);
        const lamp = new Actor({ anchor: vec(0.5, 0), pos: vec(0, this.length - 4) });
        lamp.graphics.use(paintedSprite(Resources.Image));
        this.cold.z = -0.5;
        this.warm.z = -0.4;
        this.pendulum.addChild(lamp);
        this.cold.graphics.use(glow(46, "150,200,255", 0.55));
        this.warm.graphics.use(glow(110, "255,186,104", 0.6));
        this.cold.pos = vec(0, this.length + 46);
        this.warm.pos = vec(0, this.length + 46);
        this.warm.graphics.opacity = 0;
        this.pendulum.addChild(this.cold);
        this.pendulum.addChild(this.warm);
        this.addChild(this.pendulum);
    }

    /** World position of the flame, for lighting. */
    flame(): { x: number; y: number } {
        const r = this.pendulum.rotation;
        const d = this.length + 46;
        return { x: this.pos.x - Math.sin(r) * d, y: CEILING + Math.cos(r) * d };
    }

    /** 0 when cold, 1 once Mori has lit it. */
    get glowAmount(): number {
        return this.warmth;
    }

    protected onInteract(): boolean {
        if (this.lit || !this.checkpoint) return false;
        this.lit = true;
        return true;
    }

    onPreUpdate(engine: unknown, delta: number): void {
        super.onPreUpdate(engine, delta);
        const dt = delta / 1000;
        this.t += dt;
        this.pendulum.rotation = Math.sin(this.t * 0.9) * 0.035 + Math.sin(this.t * 2.3) * 0.008;
        this.warmth += ((this.lit ? 1 : 0) - this.warmth) * Math.min(1, dt * 2.5);
        const flicker = 0.9 + Math.sin(this.t * 11) * 0.05 + Math.sin(this.t * 27) * 0.04;
        this.warm.graphics.opacity = this.warmth * flicker;
        this.cold.graphics.opacity = (1 - this.warmth) * (0.5 + Math.sin(this.t * 1.7) * 0.15);
    }
}
