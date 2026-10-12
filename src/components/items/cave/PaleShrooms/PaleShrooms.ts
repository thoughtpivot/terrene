import { Actor, vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { glow, paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import PaleShroomsImage from "./PaleShrooms.png";

const Resources = {
    Image: paintedImage(PaleShroomsImage),
};

export { Resources };

/** Ghost-pale mushrooms that glow by themselves in the deep. Fixture: scenery and a little light. */
export default class PaleShrooms extends FixtureItem {
    readonly itemName = "PaleShrooms";
    private halo = new Actor({ z: -1, pos: vec(0, -34) });
    private t = Math.random() * 10;

    constructor(options: ItemOptions) {
        super(options);
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
        this.halo.graphics.use(glow(70, "170,225,255", 0.45));
        this.halo.z = this.z - 0.5;
        this.addChild(this.halo);
    }

    /** How brightly it glows right now, 0..1. */
    get glowAmount(): number {
        return 0.75 + Math.sin(this.t * 1.1) * 0.15 + Math.sin(this.t * 3.7) * 0.05;
    }

    onPreUpdate(engine: unknown, delta: number): void {
        super.onPreUpdate(engine, delta);
        this.t += delta / 1000;
        const g = this.glowAmount;
        this.halo.graphics.opacity = g;
        this.halo.scale = vec(0.9 + g * 0.2, 0.9 + g * 0.2);
    }
}
