import { Actor, Sprite, vec } from "excalibur";
import type { Box, OkaHooks } from "./hooks";

/**
 * Base for Oka World creatures. Subclasses move in `step` and pick a frame;
 * the scene checks the hero against `box()` and calls `stomp()` or hurts
 * the hero depending on `stompable` and how the hero arrived.
 */
export default abstract class OkaCreature extends Actor {
    alive = true;
    protected t = 0;
    protected frames: Sprite[] = [];
    /** Art is painted facing this way (-1 left, 1 right). */
    protected artFacing: -1 | 1 = -1;
    protected facing: -1 | 1 = -1;

    abstract readonly stompable: boolean;
    abstract readonly creatureName: string;

    protected constructor(x: number, y: number, protected hooks: OkaHooks, z = 9) {
        super({ pos: vec(x, y), z });
    }

    abstract box(): Box;
    protected abstract step(dt: number): void;

    /** Called by the scene when the hero lands on top. */
    stomp(): void {
        this.alive = false;
    }

    protected frameIndex = 0;

    protected show(index: number): void {
        const f = this.frames[index];
        if (!f) return;
        this.frameIndex = index;
        f.flipHorizontal = this.facing !== this.artFacing;
        this.graphics.use(f);
    }

    onPreUpdate(_engine: unknown, delta: number): void {
        const dt = Math.min(delta / 1000, 1 / 30);
        this.t += dt;
        this.step(dt);
    }
}
