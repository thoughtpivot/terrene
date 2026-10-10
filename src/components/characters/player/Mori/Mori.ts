import { Actor, Sprite, vec } from "excalibur";
import { SHEETS } from "../../../scenes/OkaWorld/art/atlas";
import type { OkaHero, OkaHooks } from "../../../scenes/OkaWorld/hooks";
import { glow, paintedFrames, paintedImage } from "../../../scenes/OkaWorld/paint";
import { GRAVITY, MAX_FALL, type Body, type Water } from "../../../scenes/OkaWorld/physics";
import MoriImage from "./Mori.png";

const Resources = {
    Image: paintedImage(MoriImage),
};

export { Resources };

export interface MoriInput {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    jumpHeld: boolean;
    jumpPressed: boolean;
}

const IDLE = 0;
const RUN = [1, 2, 3, 4];
const JUMP = 5;
const FALL = 6;
const SWIM = 7;

const RUN_SPEED = 235;
const GROUND_ACCEL = 2100;
const AIR_ACCEL = 1300;
const GROUND_FRICTION = 2400;
const JUMP_SPEED = 575;
const COYOTE = 0.1;
const BUFFER = 0.13;
const SWIM_SPEED = 135;

/**
 * Mori, a young cave explorer in a moss hood, carrying a lantern.
 * The scene feeds input each step; Mori owns movement, animation and health.
 */
export default class Mori extends Actor implements OkaHero {
    readonly rig: Body = { x: 0, y: 0, vx: 0, vy: 0, w: 24, h: 58, grounded: false, ground: null };
    hearts = 3;
    readonly maxHearts = 5;
    inWater = false;
    water: Water | null = null;
    private frames: Sprite[] = [];
    private facing: -1 | 1 = 1;
    private coyote = 0;
    private buffer = 0;
    private leaping = false;
    private hurtTime = 0;
    private invuln = 0;
    private runClock = 0;
    private squash = 0;
    private t = 0;
    private lamp = new Actor({ z: 10.5 });
    private aura = new Actor({ z: 3 });
    private stepClock = 0;
    /** set by the scene: called when Mori's feet touch down after a fall */
    onLand?: (speed: number) => void;
    onSplash?: (water: Water, x: number, strength: number) => void;

    constructor(x: number, y: number, private hooks: OkaHooks) {
        super({ pos: vec(x, y), z: 10 });
        this.rig.x = x;
        this.rig.y = y;
        this.anchor = vec(SHEETS.mori.ax / SHEETS.mori.fw, 1);
        // built here, not in onInitialize, because the scene steps Mori before the first actor update
        const s = SHEETS.mori;
        this.frames = paintedFrames(Resources.Image, s.fw, s.fh, s.frames);
        this.graphics.use(this.frames[IDLE]);
        this.lamp.graphics.use(glow(40, "255,190,90", 0.65));
        this.aura.graphics.use(glow(150, "255,200,120", 0.16));
        this.addChild(this.lamp);
        this.addChild(this.aura);
    }

    get invulnerable(): boolean {
        return this.invuln > 0;
    }

    get dead(): boolean {
        return this.hearts <= 0;
    }

    /** Put Mori back at a checkpoint. A full rest also refills hearts. */
    respawn(x: number, y: number, refill = true): void {
        this.rig.x = x;
        this.rig.y = y;
        this.rig.vx = 0;
        this.rig.vy = 0;
        if (refill) this.hearts = 3;
        this.invuln = 1.2;
        this.hurtTime = 0;
        this.pos = vec(x, y);
    }

    hurt(fromX: number): void {
        if (this.invuln > 0 || this.dead) return;
        this.hearts -= 1;
        this.invuln = 1.4;
        this.hurtTime = 0.35;
        const away = this.rig.x < fromX ? -1 : 1;
        this.rig.vx = away * 260;
        this.rig.vy = this.inWater ? -120 : -330;
        this.hooks.sfx("hurt", this.rig.x);
        this.hooks.burst("dust", this.rig.x, this.rig.y - 30, 8);
    }

    /** Pop upward off a stomped creature. Holding jump bounces higher. */
    bounce(strength = 430): void {
        this.rig.vy = -strength;
        this.coyote = 0;
    }

    step(input: MoriInput, dt: number): void {
        this.t += dt;
        const b = this.rig;
        const physics = this.hooks.physics;
        if (this.invuln > 0) this.invuln -= dt;
        if (this.hurtTime > 0) this.hurtTime -= dt;

        const wasInWater = this.inWater;
        // Enter when the body is half under, leave only once the feet clear the surface,
        // otherwise floating at the waterline flickers between swimming and falling.
        // A leap out of the water rides normal jump physics until it peaks.
        if (this.leaping && b.vy >= 0) this.leaping = false;
        const water = this.leaping ? null : physics.waterAt(b.x, wasInWater ? b.y - 2 : b.y - b.h * 0.45);
        this.inWater = water !== null;
        if (water) this.water = water;
        if (wasInWater && !this.inWater && !this.leaping) this.coyote = COYOTE * 1.5;
        if (this.inWater !== wasInWater && this.water) {
            const strength = Math.min(1.5, Math.abs(b.vy) / 400 + 0.3);
            this.onSplash?.(this.water, b.x, strength);
        }

        let move = 0;
        if (this.hurtTime <= 0) move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (move !== 0) this.facing = move > 0 ? 1 : -1;

        if (input.jumpPressed) this.buffer = BUFFER;
        else this.buffer -= dt;

        if (this.inWater) {
            this.swim(input, move, dt);
        } else {
            this.walk(input, move, dt);
        }

        const fallSpeed = b.vy;
        const landed = physics.move(b, dt, input.down && b.grounded && !this.inWater);
        if (input.down && input.jumpPressed && b.grounded) {
            // drop through a one-way ledge
            if (b.ground && !b.ground.solid) {
                b.y += 3;
                b.grounded = false;
                b.ground = null;
                this.buffer = 0;
            }
        }
        if (landed) {
            this.squash = Math.min(1, fallSpeed / 700);
            this.onLand?.(fallSpeed);
        }
        if (b.grounded) this.coyote = COYOTE;
        else this.coyote -= dt;

        this.pos = vec(Math.round(b.x * 2) / 2, Math.round(b.y * 2) / 2);
        this.animate(move, dt);
    }

    private walk(input: MoriInput, move: number, dt: number): void {
        const b = this.rig;
        const accel = b.grounded ? GROUND_ACCEL : AIR_ACCEL;
        if (move !== 0) {
            b.vx += move * accel * dt;
            if (Math.abs(b.vx) > RUN_SPEED) b.vx = Math.sign(b.vx) * Math.max(RUN_SPEED, Math.abs(b.vx) - GROUND_FRICTION * dt);
        } else if (b.grounded) {
            const slow = GROUND_FRICTION * dt;
            b.vx = Math.abs(b.vx) <= slow ? 0 : b.vx - Math.sign(b.vx) * slow;
        } else {
            b.vx *= Math.exp(-dt * 1.2);
        }

        if (this.buffer > 0 && this.coyote > 0 && !input.down) {
            b.vy = -JUMP_SPEED;
            this.buffer = 0;
            this.coyote = 0;
            b.grounded = false;
            this.squash = -0.6;
            this.hooks.sfx("jump", b.x, 0.95 + Math.random() * 0.1);
            this.hooks.burst("dust", b.x, b.y, 5);
        }

        // short hop when jump is let go early, floatier at the apex
        let g = GRAVITY;
        if (b.vy < 0 && !input.jumpHeld) g *= 2.4;
        else if (Math.abs(b.vy) < 90 && input.jumpHeld) g *= 0.65;
        b.vy = Math.min(MAX_FALL, b.vy + g * dt);
    }

    private swim(input: MoriInput, move: number, dt: number): void {
        const b = this.rig;
        const water = this.water as Water;
        b.vx += (move * SWIM_SPEED - b.vx) * Math.min(1, dt * 4);
        const surfaceY = water.y + b.h * 0.55;
        const atSurface = b.y <= surfaceY + 6;
        if (this.buffer > 0) {
            this.buffer = 0;
            if (atSurface) {
                // leap out of the water
                b.vy = -JUMP_SPEED * 0.92;
                this.leaping = true;
                this.hooks.sfx("splash", b.x, 1.2);
                return;
            } else {
                b.vy = Math.min(b.vy, -230);
                this.hooks.burst("glow", b.x, b.y - 40, 3);
            }
        }
        let push: number;
        if (input.down) push = 300;
        else if (input.up || input.jumpHeld) push = -280;
        else push = Math.max(-140, Math.min(140, (surfaceY - b.y) * 5)); // float up to just under the surface
        b.vy += push * dt;
        b.vy *= Math.exp(-dt * 2.2);
        b.vy = Math.max(-260, Math.min(160, b.vy));
        if (Math.random() < dt * 2) this.hooks.burst("glow", b.x + this.facing * 8, b.y - 50, 1);
    }

    private animate(move: number, dt: number): void {
        const b = this.rig;
        let frame = IDLE;
        let rot = 0;
        if (this.inWater) {
            if (Math.abs(b.vx) > 30) {
                frame = SWIM;
                rot = Math.max(-0.25, Math.min(0.25, b.vy / 600)) * this.facing;
            } else {
                frame = FALL;
            }
        } else if (!b.grounded) {
            frame = b.vy < 40 ? JUMP : FALL;
        } else if (Math.abs(b.vx) > 12) {
            this.runClock += dt * (4 + Math.abs(b.vx) / 30);
            frame = RUN[Math.floor(this.runClock) % RUN.length];
            this.stepClock += dt * Math.abs(b.vx);
            if (this.stepClock > 70) {
                this.stepClock = 0;
                this.hooks.burst("dust", b.x - this.facing * 6, b.y, 1);
            }
        } else {
            this.runClock = 0;
        }
        const f = this.frames[frame];
        f.flipHorizontal = this.facing < 0;
        this.graphics.use(f);
        this.rotation = rot;

        this.squash += (0 - this.squash) * Math.min(1, dt * 10);
        const breathe = frame === IDLE ? Math.sin(this.t * 2.4) * 0.012 : 0;
        const sy = 1 - this.squash * 0.14 + breathe;
        const sx = 1 + this.squash * 0.12 - breathe * 0.5;
        this.scale = vec(sx, sy);

        // lantern position per pose, measured from the sheet (scene units from the feet)
        const lampAt: Record<number, [number, number]> = {
            [IDLE]: [17, -20], [JUMP]: [20, -48], [FALL]: [17, -27], [SWIM]: [27, -30],
        };
        const [lx, ly] = lampAt[frame] ?? [20, -32];
        this.lamp.pos = vec(lx * this.facing, ly / sy);
        this.lamp.graphics.opacity = 0.85 + Math.sin(this.t * 9) * 0.06 + Math.sin(this.t * 23) * 0.04;
        this.aura.pos = vec(lx * this.facing * 0.5, -40);
        this.aura.graphics.opacity = this.inWater ? 0.6 : 1;

        const blink = this.invuln > 0 && Math.floor(this.invuln * 14) % 2 === 0;
        this.graphics.opacity = blink ? 0.35 : 1;
    }
}
