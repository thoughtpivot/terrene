import { Actor, vec } from "excalibur";
import { PickupItem, type ItemOptions } from "../../../../common/BaseItem";
import { glow, paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import BlueCrystalImage from "./BlueCrystal.png";

const Resources = {
    Image: paintedImage(BlueCrystalImage),
};

export { Resources };

/** A shard of cave crystal. Pickup: the hero collects it on touch. */
export default class BlueCrystal extends PickupItem {
    readonly itemName = "BlueCrystal";
    private halo = new Actor({ z: -1 });
    private shimmer = Math.random() * 6;

    constructor(options: ItemOptions) {
        super(options, 3);
        this.reach = { w: 30, h: 38 };
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
        this.halo.graphics.use(glow(30, "140,210,255", 0.55));
        this.halo.z = this.z - 0.5;
        this.addChild(this.halo);
    }

    onPreUpdate(engine: unknown, delta: number): void {
        super.onPreUpdate(engine, delta);
        this.shimmer += delta / 1000;
        const pulse = 0.75 + 0.25 * Math.sin(this.shimmer * 3.1);
        this.halo.graphics.opacity = pulse * this.graphics.opacity;
        this.halo.scale = vec(0.9 + pulse * 0.2, 0.9 + pulse * 0.2);
    }
}
