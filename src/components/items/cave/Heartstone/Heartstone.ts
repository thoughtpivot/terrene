import { Actor, vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { glow, paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import HeartstoneImage from "./Heartstone.png";

const Resources = {
    Image: paintedImage(HeartstoneImage),
};

export { Resources };

/**
 * The heart of the cave on its carved pedestal. Fixture: too heavy to carry,
 * but touching it wakes it up. Waking it is the goal of Oka World.
 */
export default class Heartstone extends FixtureItem {
    readonly itemName = "Heartstone";
    awake = false;
    private halo = new Actor({ z: -1, pos: vec(0, -74) });
    private t = 0;

    constructor(options: ItemOptions) {
        super(options);
        this.reach = { w: 64, h: 100 };
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
        this.halo.graphics.use(glow(90, "90,255,220", 0.75));
        this.halo.z = this.z - 0.5;
        this.addChild(this.halo);
    }

    protected onInteract(): boolean {
        if (this.awake) return false;
        this.awake = true;
        return true;
    }

    onPreUpdate(engine: unknown, delta: number): void {
        super.onPreUpdate(engine, delta);
        this.t += delta / 1000;
        const base = this.awake ? 2.2 : 1;
        const pulse = base + Math.sin(this.t * (this.awake ? 4 : 1.6)) * 0.15;
        this.halo.scale = vec(pulse, pulse);
        this.halo.graphics.opacity = this.awake ? 1 : 0.7;
    }
}
