import { Actor, vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { glow, paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import GlowShroomsImage from "./GlowShrooms.png";

const Resources = {
    Image: paintedImage(GlowShroomsImage),
};

export { Resources };

/**
 * Glowing cave mushrooms. Fixture: they stay put, but brushing past lights
 * them up. Scenes can use a lit cluster as a checkpoint.
 */
export default class GlowShrooms extends FixtureItem {
    readonly itemName = "GlowShrooms";
    lit = false;
    private halo = new Actor({ z: -1, pos: vec(0, -22) });
    private t = Math.random() * 5;

    constructor(options: ItemOptions, readonly checkpoint = false) {
        super(options);
        this.reach = { w: 70, h: 120 };
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
        this.halo.graphics.use(glow(60, "80,170,255", 0.5));
        this.halo.z = this.z - 0.5;
        this.addChild(this.halo);
    }

    protected onInteract(): boolean {
        if (this.lit || !this.checkpoint) return false;
        this.lit = true;
        return true;
    }

    onPreUpdate(engine: unknown, delta: number): void {
        super.onPreUpdate(engine, delta);
        this.t += delta / 1000;
        const target = this.lit ? 1.5 : 0.75;
        const s = this.halo.scale.x + (target - this.halo.scale.x) * Math.min(1, (delta / 1000) * 3);
        const breathe = Math.sin(this.t * 1.3) * 0.05;
        this.halo.scale = vec(s + breathe, s + breathe);
        this.halo.graphics.opacity = this.lit ? 1 : 0.55 + Math.sin(this.t * 2.1) * 0.1;
    }
}
