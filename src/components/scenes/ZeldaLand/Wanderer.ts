import { Actor, Canvas, CollisionType, Color, Engine, ImageFiltering, Keys, vec } from "excalibur";
import { hurtTone, swingTone } from "./audio";
import { type Box, type Facing, type Field, slide } from "./field";
import { BROWN, BROWN_DARK, GREEN, TAN, WHITE } from "./palette";
import { say, zeldaRun } from "./run";

/**
 * Hooded traveler. The scarf and round hood are original shapes.
 * Four directions, a short swing, and a three-heart meter.
 */
export class Wanderer extends Actor {
    facing: Facing = "down";
    swing = 0;
    iframes = 0;
    down = false;
    talk: (() => boolean) | null = null;
    private cool = 0;
    private shove = 0;
    private knockX = 0;
    private knockY = 0;
    private steps = 0;
    private age = 0;
    private canvas!: Canvas;

    constructor(private field: Field) {
        super({
            name: "Wanderer",
            pos: vec(0, 0),
            width: 10,
            height: 10,
            anchor: vec(0.5, 0.5),
            collisionType: CollisionType.PreventCollision,
            z: 5,
        });
        this.body.useGravity = false;
    }

    onInitialize(_engine: Engine): void {
        this.canvas = new Canvas({
            width: 24,
            height: 24,
            cache: true,
            smoothing: false,
            filtering: ImageFiltering.Pixel,
            origin: vec(12, 12),
            color: Color.fromRGB(0, 0, 0, 0),
            draw: (ctx) => {
                ctx.clearRect(0, 0, 24, 24);
                this.paint(ctx);
            },
        });
        this.graphics.use(this.canvas);
    }

    box(): Box {
        return { x: this.pos.x - 5, y: this.pos.y - 4, w: 10, h: 10 };
    }

    swordBox(): Box | null {
        if (!zeldaRun.blade || this.swing <= 0 || this.down) return null;
        const reach = 12;
        const thick = 8;
        switch (this.facing) {
            case "right":
                return { x: this.pos.x + 4, y: this.pos.y - 3, w: reach, h: thick };
            case "left":
                return { x: this.pos.x - 4 - reach, y: this.pos.y - 3, w: reach, h: thick };
            case "up":
                return { x: this.pos.x - 3, y: this.pos.y - 4 - reach, w: thick, h: reach };
            default:
                return { x: this.pos.x - 3, y: this.pos.y + 4, w: thick, h: reach };
        }
    }

    place(x: number, y: number): void {
        this.pos.x = x;
        this.pos.y = y;
        this.down = false;
        this.shove = 0;
        this.swing = 0;
        this.iframes = 0.45;
    }

    injure(dx: number, dy: number): void {
        if (this.iframes > 0 || this.down) return;
        zeldaRun.hearts = Math.max(0, zeldaRun.hearts - 1);
        this.iframes = 0.9;
        const len = Math.hypot(dx, dy) || 1;
        this.knockX = (dx / len) * 80;
        this.knockY = (dy / len) * 80;
        this.shove = 0.16;
        hurtTone();
        if (zeldaRun.hearts <= 0) {
            this.down = true;
            say("YOU FELL.");
        }
    }

    onPreUpdate(engine: Engine, delta: number): void {
        const dt = Math.min(0.05, delta / 1000);
        this.age += dt;
        if (this.iframes > 0) this.iframes -= dt;
        if (this.swing > 0) this.swing -= dt;
        if (this.cool > 0) this.cool -= dt;

        if (this.shove > 0) {
            slide(this.pos, this.knockX * dt, this.knockY * dt, 5, this.field.solidAt);
            this.shove -= dt;
        }

        const kb = engine.input.keyboard;
        // wasPressed catches a tap that is already up by this frame.
        // A held key repeats once the swing cooldown ends.
        const tapped = kb.wasPressed(Keys.Z) || kb.wasPressed(Keys.Space) || kb.wasPressed(Keys.J);
        const held = kb.isHeld(Keys.Z) || kb.isHeld(Keys.Space) || kb.isHeld(Keys.J);
        if ((tapped || (held && this.cool <= 0 && this.swing <= 0)) && !this.down) {
            const talked = this.talk ? this.talk() : false;
            if (!talked) {
                if (!zeldaRun.blade) say("FIND THE CAVE.");
                else if (this.swing <= 0 && this.cool <= 0) {
                    this.swing = 0.16;
                    this.cool = 0.28;
                    swingTone();
                }
            }
        }

        if (!this.down && this.shove <= 0) {
            let x = 0;
            let y = 0;
            if (kb.isHeld(Keys.Left) || kb.isHeld(Keys.A)) x -= 1;
            if (kb.isHeld(Keys.Right) || kb.isHeld(Keys.D)) x += 1;
            if (kb.isHeld(Keys.Up) || kb.isHeld(Keys.W)) y -= 1;
            if (kb.isHeld(Keys.Down) || kb.isHeld(Keys.S)) y += 1;
            const len = Math.hypot(x, y);
            if (len > 0) {
                const speed = 68;
                slide(this.pos, (x / len) * speed * dt, (y / len) * speed * dt, 5, this.field.solidAt);
                if (Math.abs(x) > Math.abs(y)) this.facing = x > 0 ? "right" : "left";
                else if (y !== 0) this.facing = y > 0 ? "down" : "up";
                this.steps += dt * 8;
            }
        }

        this.canvas.flipHorizontal = this.facing === "left";
        this.z = 3 + this.pos.y / 100;
        this.canvas.flagDirty();
    }

    private paint(ctx: CanvasRenderingContext2D): void {
        if (this.iframes > 0 && Math.floor(this.age * 16) % 2 === 0) return;
        const step = Math.floor(this.steps) % 2;
        if (this.down) {
            this.blob(ctx, 4, 12, 16, 6);
            return;
        }
        if (this.facing === "up") this.paintUp(ctx, step);
        else if (this.facing === "left" || this.facing === "right") this.paintSide(ctx, step);
        else this.paintDown(ctx, step);
        if (this.swing > 0) this.paintSword(ctx);
        else if (zeldaRun.blade) {
            ctx.fillStyle = WHITE;
            ctx.fillRect(7, 12, 1, 4);
            ctx.fillStyle = BROWN;
            ctx.fillRect(6, 16, 3, 2);
        }
    }

    private blob(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
        ctx.fillStyle = BROWN;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = GREEN;
        ctx.fillRect(x, y, w, 2);
        ctx.fillStyle = TAN;
        ctx.fillRect(x + w - 4, y + 2, 3, 3);
    }

    private paintDown(ctx: CanvasRenderingContext2D, step: number): void {
        ctx.fillStyle = BROWN_DARK;
        ctx.fillRect(9, 15, 3, 3);
        ctx.fillRect(13, 15 + (step ? -1 : 1), 3, 3);
        ctx.fillStyle = BROWN;
        ctx.fillRect(8, 9, 8, 7);
        ctx.fillStyle = GREEN;
        ctx.fillRect(8, 9, 8, 2);
        ctx.fillStyle = BROWN_DARK;
        ctx.fillRect(9, 4, 6, 6);
        ctx.fillStyle = TAN;
        ctx.fillRect(10, 6, 4, 3);
        ctx.fillStyle = "#000000";
        ctx.fillRect(10, 7, 1, 1);
        ctx.fillRect(13, 7, 1, 1);
    }

    private paintUp(ctx: CanvasRenderingContext2D, step: number): void {
        ctx.fillStyle = BROWN_DARK;
        ctx.fillRect(9, 15, 3, 3);
        ctx.fillRect(13, 15 + (step ? 1 : -1), 3, 3);
        ctx.fillStyle = BROWN;
        ctx.fillRect(8, 9, 8, 7);
        ctx.fillStyle = GREEN;
        ctx.fillRect(8, 10, 8, 2);
        ctx.fillStyle = BROWN_DARK;
        ctx.fillRect(9, 4, 6, 6);
    }

    private paintSide(ctx: CanvasRenderingContext2D, step: number): void {
        ctx.fillStyle = BROWN_DARK;
        ctx.fillRect(10, 15, 3, 3);
        ctx.fillRect(14, 15 + (step ? -1 : 0), 3, 3);
        ctx.fillStyle = BROWN;
        ctx.fillRect(9, 9, 7, 7);
        ctx.fillStyle = GREEN;
        ctx.fillRect(9, 9, 7, 2);
        ctx.fillStyle = BROWN_DARK;
        ctx.fillRect(11, 4, 6, 6);
        ctx.fillStyle = TAN;
        ctx.fillRect(14, 6, 3, 3);
        ctx.fillStyle = "#000000";
        ctx.fillRect(15, 7, 1, 1);
    }

    private paintSword(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = WHITE;
        ctx.fillStyle = BROWN;
        if (this.facing === "up") {
            ctx.fillStyle = WHITE;
            ctx.fillRect(11, 0, 2, 8);
            ctx.fillStyle = BROWN;
            ctx.fillRect(10, 6, 4, 2);
        } else if (this.facing === "down") {
            ctx.fillStyle = WHITE;
            ctx.fillRect(11, 16, 2, 8);
            ctx.fillStyle = BROWN;
            ctx.fillRect(10, 16, 4, 2);
        } else {
            ctx.fillStyle = WHITE;
            ctx.fillRect(16, 10, 8, 2);
            ctx.fillStyle = BROWN;
            ctx.fillRect(16, 9, 2, 4);
        }
    }
}
