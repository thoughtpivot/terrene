import { Actor, Canvas, CollisionType, Color, Engine, ImageFiltering, vec } from "excalibur";
import { tone } from "./audio";
import { RED, WHITE } from "./palette";
import type { RoomHooks } from "./room";
import { zeldaRun } from "./run";

export class HeartDrop extends Actor {
    private age = 0;
    private canvas!: Canvas;
    private homeY: number;

    constructor(x: number, y: number) {
        super({
            name: "Heart",
            pos: vec(x, y),
            width: 8,
            height: 8,
            anchor: vec(0.5, 0.5),
            collisionType: CollisionType.PreventCollision,
            z: 4,
        });
        this.body.useGravity = false;
        this.addTag("drop");
        this.homeY = y;
    }

    onInitialize(_engine: Engine): void {
        this.canvas = new Canvas({
            width: 8,
            height: 8,
            cache: true,
            smoothing: false,
            filtering: ImageFiltering.Pixel,
            origin: vec(4, 4),
            color: Color.fromRGB(0, 0, 0, 0),
            draw: (ctx) => {
                ctx.clearRect(0, 0, 8, 8);
                ctx.fillStyle = RED;
                ctx.fillRect(1, 1, 2, 2);
                ctx.fillRect(4, 1, 2, 2);
                ctx.fillRect(0, 2, 7, 2);
                ctx.fillRect(1, 4, 5, 1);
                ctx.fillRect(2, 5, 3, 1);
                ctx.fillRect(3, 6, 1, 1);
                ctx.fillStyle = WHITE;
                ctx.fillRect(1, 2, 1, 1);
            },
        });
        this.graphics.use(this.canvas);
    }

    onPreUpdate(_engine: Engine, delta: number): void {
        const dt = delta / 1000;
        this.age += dt;
        const room = this.scene as unknown as RoomHooks;
        const hero = room.hero;
        if (hero && Math.hypot(hero.pos.x - this.pos.x, hero.pos.y - this.pos.y) < 12) {
            if (zeldaRun.hearts < zeldaRun.maxHearts) zeldaRun.hearts += 1;
            tone(680, 0.08);
            this.kill();
            return;
        }
        if (this.age > 8) this.kill();
        this.pos.y = this.homeY + Math.sin(this.age * 6) * 1.5;
        this.canvas.flagDirty();
    }
}
