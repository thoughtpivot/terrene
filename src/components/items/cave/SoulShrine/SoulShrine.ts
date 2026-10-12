import { Actor, vec } from "excalibur";
import { FixtureItem, type ItemOptions } from "../../../../common/BaseItem";
import { glow, paintedImage, paintedSprite } from "../../../scenes/OkaWorld/paint";
import SoulShrineImage from "./SoulShrine.png";

const Resources = {
    Image: paintedImage(SoulShrineImage),
};

export { Resources };

/** Height of the soul-orb above the shrine's base. */
const ORB = 112;

/**
 * A worn stone shrine holding the last pale soul-light of the Hollow.
 * Fixture: touching it wakes the light. Waking it is the goal of Oka World 2.
 */
export default class SoulShrine extends FixtureItem {
    readonly itemName = "SoulShrine";
    awake = false;
    private halo = new Actor({ z: -0.5, pos: vec(0, -ORB) });
    private core = new Actor({ z: 0.5, pos: vec(0, -ORB) });
    private t = 0;

    constructor(options: ItemOptions) {
        super(options);
        this.reach = { w: 76, h: 128 };
    }

    onInitialize(): void {
        this.wear(paintedSprite(Resources.Image));
        this.halo.graphics.use(glow(110, "150,215,255", 0.7));
        this.core.graphics.use(glow(26, "235,248,255", 0.9));
        this.addChild(this.halo);
        this.addChild(this.core);
    }

    /** World position of the orb, for lighting. */
    orb(): { x: number; y: number } {
        return { x: this.pos.x, y: this.pos.y - ORB };
    }

    get glowAmount(): number {
        return this.awake ? 1 : 0.55 + Math.sin(this.t * 1.4) * 0.12;
    }

    protected onInteract(): boolean {
        if (this.awake) return false;
        this.awake = true;
        return true;
    }

    onPreUpdate(engine: unknown, delta: number): void {
        super.onPreUpdate(engine, delta);
        this.t += delta / 1000;
        const base = this.awake ? 2.4 : 1;
        const pulse = base + Math.sin(this.t * (this.awake ? 3.2 : 1.4)) * 0.12;
        this.halo.scale = vec(pulse, pulse);
        this.halo.graphics.opacity = this.awake ? 1 : 0.75;
        this.core.graphics.opacity = 0.6 + Math.sin(this.t * 2.1) * 0.2 + (this.awake ? 0.2 : 0);
    }
}
