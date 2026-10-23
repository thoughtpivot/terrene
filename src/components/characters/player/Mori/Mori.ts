import { Actor, Sprite, vec } from "excalibur";
import { MORI, SHEETS } from "../../../scenes/OkaWorld/art/atlas";
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

const F = MORI.frames;
const IDLE = F.idle;
/** Two steps: contact, down, passing, flight on one foot, then the other. */
const RUN = [F.run0, F.run1, F.run2, F.run3, F.run4, F.run5, F.run6, F.run7];
const CONTACTS = [0, 4];
/** Ground covered by one full cycle. The planted foot slides back about this far per frame. */
const STRIDE = 100;
/** Per run frame: lift off the ground and vertical squash, at full speed. */
const RUN_LIFT = [0, 0, 1, 3.5, 0, 0, 1, 3.5];
const RUN_SQUASH = [0.985, 0.965, 1, 1.02, 0.985, 0.965, 1, 1.02];
const JUMP = F.jump;
const FALL = F.fall;
const SWIM = F.swim;
const START = F.start;
const SKID = F.skid;
const LAND = F.land;
const STOP = F.stop;
const SKID_SPEED = 90;
/** Boots stay wet for a while after a swim. */
const WET_TIME = 2.5;

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
    /** distance into the run cycle, 0 to STRIDE */
    private runDist = 0;
    private runFrame = -1;
    private squash = 0;
    private lean = 0;
    private t = 0;
    private lamp = new Actor({ z: 0.5 });
    private aura = new Actor({ z: -7 });
    private skidding = false;
    private skidDust = 0;
    private startTime = 0;
    private landTime = 0;
    private stopTime = 0;
    private wetTime = 0;
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

    /** World position of the lantern flame and how bright it burns this frame (about 0.8 to 1). */
    get lantern(): { x: number; y: number; flicker: number } {
        const lx = this.lamp.pos.x * this.scale.x;
        const ly = this.lamp.pos.y * this.scale.y;
        const c = Math.cos(this.rotation);
        const s = Math.sin(this.rotation);
        return {
            x: this.pos.x + lx * c - ly * s,
            y: this.pos.y + lx * s + ly * c,
            flicker: this.lamp.graphics.opacity,
        };
    }

    /** Burn the lantern brighter and warmer, for scenes where it is the main light. */
    brightenLantern(): void {
        this.lamp.graphics.use(glow(52, "255,196,110", 0.8));
        this.aura.graphics.use(glow(190, "255,176,96", 0.2));
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
        this.runDist = 0;
        this.runFrame = -1;
        this.skidding = false;
        this.startTime = this.landTime = this.stopTime = 0;
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
        if (this.inWater) this.wetTime = WET_TIME;
        else if (this.wetTime > 0) this.wetTime -= dt;

        let move = 0;
        if (this.hurtTime <= 0) move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        // reversing at speed: plant the front heel and keep facing the old way until he stops
        const skid = b.grounded && !this.inWater && move !== 0 && b.vx * move < 0 && Math.abs(b.vx) > SKID_SPEED;
        if (skid && !this.skidding) {
            this.hooks.sfx("skid", b.x, 0.95 + Math.random() * 0.1, Math.min(1, Math.abs(b.vx) / RUN_SPEED));
            this.skidDust = 0;
        }
        this.skidding = skid;
        if (skid) this.facing = b.vx > 0 ? 1 : -1;
        else if (move !== 0) this.facing = move > 0 ? 1 : -1;
        if (move !== 0 && b.grounded && Math.abs(b.vx) < 30 && !this.inWater && this.startTime <= 0 && this.runFrame < 0) {
            this.startTime = 0.12;
        }

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
            const impact = Math.min(1, fallSpeed / 700);
            this.squash = impact;
            if (fallSpeed > 160) {
                // a running landing rolls straight into the next stride
                this.landTime = Math.abs(b.vx) > 60 ? 0.06 + impact * 0.04 : 0.09 + impact * 0.1;
                this.runDist = (STRIDE / RUN.length) * 1.01;
                this.runFrame = 1;
                this.hooks.sfx("land", b.x, 1.05 - impact * 0.15, 0.35 + impact * 0.65);
                this.hooks.burst("dust", b.x, b.y, Math.round(2 + impact * 4));
            }
        }
        if (b.grounded) this.coyote = COYOTE;
        else this.coyote -= dt;

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

    /** Close enough to a pool that the stones underfoot are wet. */
    private nearWater(): boolean {
        const b = this.rig;
        return this.hooks.physics.waters.some((w) => b.x > w.x - 30 && b.x < w.x + w.w + 30 && Math.abs(w.y - b.y) < 40);
    }

    private footfall(i: number, k: number): void {
        const b = this.rig;
        const wet = this.wetTime > 0 || this.nearWater();
        this.hooks.sfx(wet ? "stepWet" : "step", b.x, 0.93 + Math.random() * 0.14, 0.55 + 0.45 * k);
        const footX = b.x + this.facing * MORI.feet[RUN[i]];
        this.hooks.burst(wet && Math.random() < 0.5 ? "splash" : "dust", footX, b.y, 1);
    }

    private animate(move: number, dt: number): void {
        const b = this.rig;
        const speed = Math.abs(b.vx);
        const k = Math.min(1, speed / RUN_SPEED);
        const was = this.runFrame;
        let frame: number = IDLE;
        let lean = 0;
        let lift = 0;
        let runSy = 1;
        this.startTime -= dt;
        this.landTime -= dt;
        this.stopTime -= dt;
        if (this.inWater) {
            if (speed > 30) {
                frame = SWIM;
                lean = Math.max(-0.25, Math.min(0.25, b.vy / 600)) * this.facing;
            } else {
                frame = FALL;
            }
            this.runFrame = -1;
        } else if (!b.grounded) {
            frame = b.vy < 40 ? JUMP : FALL;
            lean = this.facing * 0.04 * k;
            this.runFrame = -1;
        } else if (this.skidding) {
            frame = SKID;
            lean = -this.facing * (0.06 + 0.1 * k);
            this.skidDust -= dt;
            if (this.skidDust <= 0) {
                this.skidDust = 0.035;
                this.hooks.burst("dust", b.x + this.facing * 14, b.y, 1);
            }
            this.runFrame = -1;
            this.runDist = 0;
        } else if (this.landTime > 0) {
            frame = LAND;
            lean = this.facing * 0.05 * k;
            this.runDist = (this.runDist + speed * dt) % STRIDE;
        } else if (this.startTime > 0 && move !== 0 && speed < 170) {
            // crouch and push off; the cycle picks up in flight, so the first contact comes next
            frame = START;
            lean = this.facing * 0.12;
            this.runDist = (STRIDE * 3) / RUN.length;
            this.runFrame = 3;
        } else if (speed > 12 && (move !== 0 || this.runFrame >= 0 && speed > 120 && this.stopTime <= 0)) {
            if (move === 0) {
                // let go at speed: plant a foot and brake
                frame = STOP;
                this.stopTime = 0.16;
                this.runFrame = -1;
                this.footfall(4, k * 0.7);
            } else {
                this.runDist = (this.runDist + speed * dt) % STRIDE;
                const i = Math.floor(this.runDist / (STRIDE / RUN.length)) % RUN.length;
                if (i !== was && CONTACTS.includes(i)) this.footfall(i, k);
                this.runFrame = i;
                frame = RUN[i];
                lift = RUN_LIFT[i] * k;
                runSy = 1 + (RUN_SQUASH[i] - 1) * k;
                // lean into it, more while still picking up speed
                lean = this.facing * (0.06 * k + (speed < RUN_SPEED - 5 ? 0.05 * (1 - k) : 0));
            }
        } else if (this.stopTime > 0) {
            frame = STOP;
            lean = -this.facing * 0.04;
            this.runFrame = -1;
        } else {
            this.runFrame = -1;
            if (this.startTime <= 0) this.runDist = 0;
        }
        const f = this.frames[frame];
        f.flipHorizontal = this.facing < 0;
        this.graphics.use(f);
        this.lean = this.inWater ? lean : this.lean + (lean - this.lean) * Math.min(1, dt * 14);
        this.rotation = this.lean;
        this.pos = vec(Math.round(b.x * 2) / 2, Math.round((b.y - lift) * 2) / 2);

        this.squash += (0 - this.squash) * Math.min(1, dt * 10);
        const breathe = frame === IDLE ? Math.sin(this.t * 2.4) * 0.012 : 0;
        const sy = (1 - this.squash * 0.14 + breathe) * runSy;
        const sx = 1 + this.squash * 0.12 - breathe * 0.5 + (1 - runSy) * 0.6;
        this.scale = vec(sx, sy);

        // the glow sits on the flame painted in this frame, so it swings with the lantern
        const [lx, ly] = MORI.lamps[frame] ?? [20, -24];
        this.lamp.pos = vec(lx * this.facing, ly);
        this.lamp.graphics.opacity = 0.85 + Math.sin(this.t * 9) * 0.06 + Math.sin(this.t * 23) * 0.04;
        this.aura.pos = vec(lx * this.facing * 0.5, -40);
        this.aura.graphics.opacity = this.inWater ? 0.6 : 1;

        const blink = this.invuln > 0 && Math.floor(this.invuln * 14) % 2 === 0;
        this.graphics.opacity = blink ? 0.35 : 1;
    }
}
