import { Actor, vec } from "excalibur";
import { PickupItem, type ItemOptions } from "../../../../common/BaseItem";
import { glow, paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import HeartMossImage from "./HeartMoss.png";

const Resources = {
    Image: paintedImage(HeartMossImage),
};

export { Resources };

/** A bloom of heart-leaf moss. Pickup: restores one heart. */
export default class HeartMoss extends PickupItem {
    readonly itemName = "HeartMoss";
    private halo = new Actor({ z: -1 });
    private beat = 0;

    constructor(options: ItemOptions) {
        super(options, 2);
        this.reach = { w: 34, h: 34 };
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
        this.halo.graphics.use(glow(34, "255,140,170", 0.5));
        this.halo.z = this.z - 0.5;
        this.addChild(this.halo);
    }

    onPreUpdate(engine: unknown, delta: number): void {
        super.onPreUpdate(engine, delta);
        if (this.used) {
            this.halo.graphics.opacity = this.graphics.opacity;
            return;
        }
        this.beat += delta / 1000;
        // a soft double "heartbeat" every 1.4 s
        const p = this.beat % 1.4;
        const thump = Math.exp(-((p - 0.1) ** 2) / 0.004) + 0.6 * Math.exp(-((p - 0.32) ** 2) / 0.004);
        const s = 1 + thump * 0.08;
        this.scale = vec(s, s);
        this.halo.graphics.opacity = 0.6 + thump * 0.4;
    }
}
