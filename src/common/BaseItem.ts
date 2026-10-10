import { Actor, Graphic, vec, Vector } from "excalibur";

/**
 * Items are the objects that live in a scene. Some can be picked up
 * (a crystal, a heart), some stay where they are (a tree, a rock, a shrine)
 * but can still react when something touches them.
 *
 * Every item has an anchor at its base (or its middle for floating pickups)
 * and a touch radius. Scenes call `touch()` when their hero overlaps.
 */
export type TouchResult = "collected" | "interacted" | null;

export interface ItemOptions {
    x: number;
    y: number;
    z?: number;
    /** Anchor inside the graphic, default bottom centre. */
    anchor?: Vector;
    /** Horizontal mirror. */
    flip?: boolean;
    scale?: number;
}

export default abstract class BaseItem extends Actor {
    abstract readonly itemName: string;
    abstract readonly pickable: boolean;
    /** Touch box size around the anchor, in scene units. */
    reach = { w: 24, h: 24 };
    used = false;
    /** Scene callback for when this item is collected or interacted with. */
    onTouched?: (item: BaseItem, result: Exclude<TouchResult, null>) => void;

    protected constructor(options: ItemOptions) {
        super({
            pos: vec(options.x, options.y),
            z: options.z ?? 5,
            anchor: options.anchor ?? vec(0.5, 1),
        });
        if (options.scale) this.scale = vec(options.scale, options.scale);
        this.flip = options.flip ?? false;
    }

    protected flip: boolean;

    protected wear(graphic: Graphic): void {
        graphic.flipHorizontal = this.flip;
        this.graphics.use(graphic);
    }

    /** World-space box used for touch checks. */
    touchBox(): { x: number; y: number; w: number; h: number } {
        const ay = this.anchor.y;
        return {
            x: this.pos.x - this.reach.w / 2,
            y: this.pos.y - this.reach.h * ay,
            w: this.reach.w,
            h: this.reach.h,
        };
    }

    touch(): TouchResult {
        if (this.pickable) {
            if (this.used) return null;
            this.used = true;
            this.onPickup();
            this.onTouched?.(this, "collected");
            return "collected";
        }
        if (this.onInteract()) {
            this.onTouched?.(this, "interacted");
            return "interacted";
        }
        return null;
    }

    /** Pickups: play the collect animation, then remove themselves. */
    protected onPickup(): void {
        this.kill();
    }

    /** Fixtures: return true if the touch did something. */
    protected onInteract(): boolean {
        return false;
    }
}

/** Something you can pick up. It bobs gently until collected, then floats up and fades. */
export abstract class PickupItem extends BaseItem {
    readonly pickable = true;
    private t = Math.random() * Math.PI * 2;
    private baseY: number;
    private leaving = -1;

    protected constructor(options: ItemOptions, private bob = 3) {
        super({ anchor: vec(0.5, 0.5), z: 8, ...options });
        this.baseY = options.y;
    }

    protected onPickup(): void {
        this.leaving = 0;
    }

    onPreUpdate(_engine: unknown, delta: number): void {
        const dt = delta / 1000;
        this.t += dt;
        if (this.leaving >= 0) {
            this.leaving += dt;
            const k = this.leaving / 0.45;
            this.pos.y = this.baseY - 34 * Math.sin(Math.min(1, k) * Math.PI / 2);
            this.scale = vec(1 + k * 0.6, 1 + k * 0.6);
            this.graphics.opacity = Math.max(0, 1 - k);
            if (k >= 1) this.kill();
            return;
        }
        this.pos.y = this.baseY + Math.sin(this.t * 2.2) * this.bob;
    }
}

/** Something that stays put. Plants can sway around their base. */
export abstract class FixtureItem extends BaseItem {
    readonly pickable = false;
    protected swayAmount = 0;
    protected swaySpeed = 1;
    private phase = Math.random() * Math.PI * 2;

    protected constructor(options: ItemOptions) {
        super(options);
    }

    onPreUpdate(_engine: unknown, delta: number): void {
        if (this.swayAmount === 0) return;
        this.phase += (delta / 1000) * this.swaySpeed;
        this.rotation = Math.sin(this.phase) * this.swayAmount + Math.sin(this.phase * 2.3) * this.swayAmount * 0.3;
    }
}
