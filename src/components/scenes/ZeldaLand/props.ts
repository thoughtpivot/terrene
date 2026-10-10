import { Actor, Canvas, CollisionType, Color, Engine, ImageFiltering, vec } from "excalibur";
import { BROWN, BROWN_DARK, FLAME, FLAME_HOT, GRAY, TAN, WHITE } from "./palette";

/** Hooded cave-keeper. Original silhouette, lamp instead of a bare beard. */
export class Quill extends Actor {
    private age = 0;
    private canvas!: Canvas;

    constructor(x: number, y: number) {
        super({
            name: "Quill",
            pos: vec(x, y),
            width: 12,
            height: 14,
            anchor: vec(0.5, 0.5),
            collisionType: CollisionType.PreventCollision,
            z: 4,
        });
        this.body.useGravity = false;
    }

    onInitialize(_engine: Engine): void {
        this.canvas = new Canvas({
            width: 16,
            height: 16,
            cache: true,
            smoothing: false,
            filtering: ImageFiltering.Pixel,
            origin: vec(8, 8),
            color: Color.fromRGB(0, 0, 0, 0),
            draw: (ctx) => {
                ctx.clearRect(0, 0, 16, 16);
                const hot = Math.floor(this.age * 8) % 2 === 0;
                ctx.fillStyle = BROWN_DARK;
                ctx.fillRect(5, 6, 7, 8);
                ctx.fillStyle = GRAY;
                ctx.fillRect(6, 2, 5, 5);
                ctx.fillStyle = TAN;
                ctx.fillRect(7, 4, 3, 2);
                ctx.fillStyle = hot ? FLAME_HOT : FLAME;
                ctx.fillRect(1, 8, 3, 3);
                ctx.fillStyle = WHITE;
                ctx.fillRect(2, 9, 1, 1);
                ctx.fillStyle = BROWN;
                ctx.fillRect(2, 11, 1, 3);
            },
        });
        this.graphics.use(this.canvas);
    }

    onPreUpdate(_engine: Engine, delta: number): void {
        this.age += delta / 1000;
        this.z = 3 + this.pos.y / 100;
        this.canvas.flagDirty();
    }
}

export class Torch extends Actor {
    private age = 0;
    private canvas!: Canvas;

    constructor(x: number, y: number) {
        super({
            name: "Torch",
            pos: vec(x, y),
            width: 8,
            height: 12,
            anchor: vec(0.5, 0.5),
            collisionType: CollisionType.PreventCollision,
            z: 2,
        });
        this.body.useGravity = false;
    }

    onInitialize(_engine: Engine): void {
        this.canvas = new Canvas({
            width: 16,
            height: 16,
            cache: true,
            smoothing: false,
            filtering: ImageFiltering.Pixel,
            origin: vec(8, 8),
            color: Color.fromRGB(0, 0, 0, 0),
            draw: (ctx) => {
                ctx.clearRect(0, 0, 16, 16);
                const hot = Math.floor(this.age * 10) % 2 === 0;
                ctx.fillStyle = BROWN_DARK;
                ctx.fillRect(7, 8, 2, 7);
                ctx.fillStyle = hot ? FLAME_HOT : FLAME;
                ctx.fillRect(6, 3, 4, 5);
                ctx.fillStyle = WHITE;
                ctx.fillRect(7, 4, 2, 2);
                ctx.fillStyle = "#f83800";
                ctx.fillRect(5, 6, 2, 2);
            },
        });
        this.graphics.use(this.canvas);
    }

    onPreUpdate(_engine: Engine, delta: number): void {
        this.age += delta / 1000;
        this.canvas.flagDirty();
    }
}
