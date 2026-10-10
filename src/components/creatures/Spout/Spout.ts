import { Actor, Canvas, CollisionType, Color, Engine, ImageFiltering, ImageSource, vec } from "excalibur";
import { tone } from "../../scenes/ZeldaLand/audio";
import { clearLine, face4, type Facing } from "../../scenes/ZeldaLand/field";
import { BROWN, BROWN_DARK, GRAY_DARK, TAN, WHITE } from "../../scenes/ZeldaLand/palette";
import type { RoomHooks } from "../../scenes/ZeldaLand/room";
import { ZeldaCritter } from "../../scenes/ZeldaLand/ZeldaCritter";
import SpoutImage from "./Spout.png";

const Resources = {
    Image: new ImageSource(SpoutImage, false, ImageFiltering.Pixel),
};

export { Resources };

/**
 * Desert pot-creature. Sits, turns on the closer axis, and spits one pebble
 * down a clear line. One hit. The forest ridge stops the shot.
 */
export default class Spout extends ZeldaCritter {
    private cool = 0.8;
    private shot: Pebble | null = null;
    private aim: Facing = "left";

    constructor(x: number, y: number, room: RoomHooks) {
        super(x, y, "Spout", 1, room);
    }

    protected onDie(): void {
        this.shot?.kill();
    }

    protected step(dt: number): void {
        const hero = this.room.hero;
        this.aim = face4(this.pos.x, this.pos.y, hero.pos.x, hero.pos.y);
        if (this.shot && this.shot.isKilled()) this.shot = null;
        this.cool -= dt;
        const dist = Math.hypot(hero.pos.x - this.pos.x, hero.pos.y - this.pos.y);
        const open = clearLine(this.room.field.solidAt, this.pos.x, this.pos.y, hero.pos.x, hero.pos.y);
        if (this.cool <= 0 && !this.shot && dist < 112 && open && !hero.down) {
            this.cool = 1.75;
            const pebble = new Pebble(this.pos.x, this.pos.y, this.aim, this.room);
            this.shot = pebble;
            this.room.spawn(pebble);
            tone(240, 0.04);
        } else if (this.cool <= 0) {
            this.cool = 0.35;
        }
    }

    protected draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = BROWN_DARK;
        ctx.fillRect(3, 5, 10, 9);
        ctx.fillStyle = TAN;
        ctx.fillRect(4, 6, 8, 7);
        ctx.fillStyle = BROWN;
        ctx.fillRect(5, 10, 6, 3);
        ctx.fillStyle = GRAY_DARK;
        const mouth = this.aim === "right" ? [10, 7] : this.aim === "up" ? [6, 5] : this.aim === "down" ? [6, 11] : [4, 7];
        ctx.fillRect(mouth[0], mouth[1], 3, 3);
        ctx.fillStyle = WHITE;
        ctx.fillRect(6, 7, 1, 1);
        ctx.fillRect(9, 7, 1, 1);
    }
}

class Pebble extends Actor {
    private age = 0;
    private canvas!: Canvas;

    constructor(x: number, y: number, private aim: Facing, private room: RoomHooks) {
        super({
            name: "Pebble",
            pos: vec(x, y),
            width: 4,
            height: 4,
            anchor: vec(0.5, 0.5),
            collisionType: CollisionType.PreventCollision,
            z: 6,
        });
        this.body.useGravity = false;
        this.addTag("shot");
    }

    onInitialize(_engine: Engine): void {
        this.canvas = new Canvas({
            width: 4,
            height: 4,
            cache: true,
            smoothing: false,
            filtering: ImageFiltering.Pixel,
            origin: vec(2, 2),
            color: Color.fromRGB(0, 0, 0, 0),
            draw: (ctx) => {
                ctx.fillStyle = BROWN;
                ctx.fillRect(0, 0, 4, 4);
                ctx.fillStyle = TAN;
                ctx.fillRect(1, 1, 1, 1);
            },
        });
        this.graphics.use(this.canvas);
    }

    onPreUpdate(_engine: Engine, delta: number): void {
        const dt = Math.min(0.05, delta / 1000);
        this.age += dt;
        const speed = 78;
        const vx = this.aim === "left" ? -speed : this.aim === "right" ? speed : 0;
        const vy = this.aim === "up" ? -speed : this.aim === "down" ? speed : 0;
        this.pos.x += vx * dt;
        this.pos.y += vy * dt;
        const hero = this.room.hero;
        const sword = hero.swordBox();
        if (sword && sword.x < this.pos.x + 2 && sword.x + sword.w > this.pos.x - 2 && sword.y < this.pos.y + 2 && sword.y + sword.h > this.pos.y - 2) {
            this.kill();
            return;
        }
        if (this.room.field.solidAt(this.pos.x, this.pos.y) || this.age > 1.35) {
            this.kill();
            return;
        }
        if (hero.iframes <= 0 && !hero.down && Math.hypot(hero.pos.x - this.pos.x, hero.pos.y - this.pos.y) < 8) {
            hero.injure(hero.pos.x - this.pos.x, hero.pos.y - this.pos.y);
            this.kill();
        }
    }
}
