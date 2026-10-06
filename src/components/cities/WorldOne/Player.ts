import {
    Actor,
    CollisionType,
    Color,
    Engine,
    Keys,
    Side,
    vec,
} from "excalibur";
import { loop, sprite } from "./sprites";
import { sfxJump } from "./audio";
import type { BumpBlock, Walker } from "./Actors";

export interface StageHooks {
    solidAt(x: number, y: number): boolean;
    isPlayable(): boolean;
    onFlag(y: number): void;
}

const WALK = 78;
const RUN = 132;
const ACCEL = 900;
const GRAVITY_JUMP = -500;

/**
 * Pip, an original jumper. Arrows move, Z / Space / Up jump, X or Shift runs.
 */
export default class Player extends Actor {
    big = false;
    facing: 1 | -1 = 1;
    locked = false;
    invuln = 0;
    star = 0;
    dead = false;
    onGround = false;
    private coyote = 0;
    private jumpBuffer = 0;
    private jumpHeld = false;
    private cutJump = false;
    private anim = "";
    private starTint = 0;
    hooks!: StageHooks;
    private wasDown = false;

    constructor(x: number, y: number) {
        super({
            name: "Pip",
            pos: vec(x, y),
            width: 10,
            height: 16,
            collisionType: CollisionType.Active,
            anchor: vec(0.5, 0.5),
            z: 10,
        });
        this.addTag("player");
        this.body.friction = 0;
        this.body.bounciness = 0;
        this.body.useGravity = true;
    }

    bind(hooks: StageHooks): void {
        this.hooks = hooks;
    }

    onInitialize(): void {
        this.graphics.add("idle", sprite("pip-idle"));
        this.graphics.add("walk", loop(["pip-walk-0", "pip-walk-1", "pip-walk-2", "pip-walk-1"], 90));
        this.graphics.add("jump", sprite("pip-jump"));
        this.graphics.add("skid", sprite("pip-skid"));
        this.graphics.add("crouch", sprite("pip-crouch"));
        this.graphics.add("dead", sprite("pip-dead"));
        this.graphics.add("big-idle", sprite("pip-big-idle"));
        this.graphics.add("big-walk", loop(["pip-big-walk-0", "pip-big-walk-1", "pip-big-walk-2", "pip-big-walk-1"], 80));
        this.graphics.add("big-jump", sprite("pip-big-jump"));
        this.graphics.add("big-skid", sprite("pip-big-skid"));
        this.graphics.add("big-crouch", sprite("pip-big-crouch"));
        this.useAnim("idle");

        this.on("postcollision", (evt) => this.handleHit(evt.other as Actor, evt.side));
    }

    private useAnim(name: string): void {
        const key = this.big && name !== "dead" ? `big-${name}` : name;
        if (this.anim === key) return;
        this.anim = key;
        this.graphics.use(key);
    }

    grow(): void {
        if (this.big || this.dead) return;
        this.big = true;
        this.pos.y -= 8;
        this.collider.useBoxCollider(12, 32);
        this.anim = "";
    }

    shrink(): void {
        if (!this.big) return;
        this.big = false;
        this.pos.y += 8;
        this.collider.useBoxCollider(10, 16);
        this.invuln = 1.6;
        this.anim = "";
    }

    killPlayer(): void {
        if (this.dead) return;
        this.dead = true;
        this.locked = true;
        this.vel = vec(0, -280);
        this.body.group = this.body.group; // keep gravity
        this.body.collisionType = CollisionType.PreventCollision;
        this.useAnim("dead");
    }

    onPreUpdate(engine: Engine, delta: number): void {
        const sec = delta / 1000;
        if (this.invuln > 0) this.invuln -= sec;
        if (this.star > 0) {
            this.star -= sec;
            this.starTint += sec;
        }

        if (this.dead) {
            this.vel.y = Math.min(460, this.vel.y + 1700 * sec);
            this.useAnim("dead");
            return;
        }

        const grounded = this.onGround;
        this.onGround = false;
        if (grounded) this.coyote = 0.09;
        else this.coyote = Math.max(0, this.coyote - sec);

        if (this.dead || this.locked || !this.hooks?.isPlayable()) {
            this.applyStarTint();
            return;
        }

        const kb = engine.input.keyboard;
        const left = kb.isHeld(Keys.Left) || kb.isHeld(Keys.A);
        const right = kb.isHeld(Keys.Right) || kb.isHeld(Keys.D);
        const jump = kb.isHeld(Keys.Z) || kb.isHeld(Keys.Space) || kb.isHeld(Keys.Up) || kb.isHeld(Keys.W);
        const run = kb.isHeld(Keys.X) || kb.isHeld(Keys.ShiftLeft) || kb.isHeld(Keys.ShiftRight);
        const down = kb.isHeld(Keys.Down) || kb.isHeld(Keys.S);

        const max = run ? RUN : WALK;
        if (right && !left) {
            this.facing = 1;
            this.vel.x = Math.min(max, this.vel.x + ACCEL * sec);
            if (this.vel.x < 0) this.vel.x = Math.min(0, this.vel.x + ACCEL * 1.4 * sec);
        } else if (left && !right) {
            this.facing = -1;
            this.vel.x = Math.max(-max, this.vel.x - ACCEL * sec);
            if (this.vel.x > 0) this.vel.x = Math.max(0, this.vel.x - ACCEL * 1.4 * sec);
        } else {
            const drag = grounded ? 12 : 4;
            this.vel.x = moveToward(this.vel.x, 0, drag * ACCEL * sec);
        }

        if (jump && !this.jumpHeld) this.jumpBuffer = 0.12;
        this.jumpHeld = jump;
        this.jumpBuffer = Math.max(0, this.jumpBuffer - sec);

        if (this.jumpBuffer > 0 && (grounded || this.coyote > 0)) {
            this.vel.y = GRAVITY_JUMP;
            this.jumpBuffer = 0;
            this.coyote = 0;
            this.onGround = false;
            this.cutJump = true;
            sfxJump();
        } else if (!jump && this.cutJump) {
            if (this.vel.y < 0) this.vel.y *= 0.5;
            this.cutJump = false;
        }

        if (this.vel.y > 460) this.vel.y = 460;

        const skid = grounded && ((right && this.vel.x < -20) || (left && this.vel.x > 20));
        if (!grounded) this.useAnim("jump");
        else if (down) this.useAnim("crouch");
        else if (skid) this.useAnim("skid");
        else if (Math.abs(this.vel.x) > 12) this.useAnim("walk");
        else this.useAnim("idle");

        this.graphics.flipHorizontal = this.facing < 0;
        this.wasDown = down;
        this.applyStarTint();
        if (this.invuln > 0 && !this.star) {
            this.graphics.opacity = Math.sin(this.invuln * 40) > 0 ? 1 : 0.25;
        } else {
            this.graphics.opacity = 1;
        }
    }

    private applyStarTint(): void {
        if (this.star <= 0) {
            for (const shown of this.graphics.current) shown.graphic.tint = Color.White;
            return;
        }
        const palette = [Color.fromHex("#fff07a"), Color.fromHex("#7CFFB2"), Color.fromHex("#8ec5ff"), Color.White];
        const tint = palette[Math.floor(this.starTint * 12) % palette.length];
        for (const shown of this.graphics.current) shown.graphic.tint = tint;
    }

    private handleHit(other: Actor, side: Side): void {
        if (other.hasTag?.("terrain") === false && side === Side.Bottom) {
            /* fallthrough */
        }
        const wasAirborne = !this.onGround;
        if (side === Side.Bottom) this.onGround = true;
        if (this.dead || this.locked) return;

        if (side === Side.Top && typeof (other as BumpBlock).hit === "function" && other.hasTag("block")) {
            (other as BumpBlock).hit(this);
        }

        if (other.hasTag("enemy") && typeof (other as Walker).receivePlayer === "function") {
            const stomp = side === Side.Bottom && (this.vel.y > 0 || wasAirborne);
            (other as Walker).receivePlayer(this, stomp);
        }
    }

    bounce(): void {
        this.vel.y = -260;
        this.onGround = false;
    }

    get pressingDown(): boolean {
        return this.wasDown;
    }
}

function moveToward(current: number, target: number, maxDelta: number): number {
    if (Math.abs(target - current) <= maxDelta) return target;
    return current + Math.sign(target - current) * maxDelta;
}
