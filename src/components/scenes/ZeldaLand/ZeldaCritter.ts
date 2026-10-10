import { Actor, Canvas, CollisionType, Color, Engine, ImageFiltering, vec } from "excalibur";
import { tone } from "./audio";
import { HUD, TILE, overlap, type Box } from "./field";
import { HeartDrop } from "./HeartDrop";
import type { RoomHooks } from "./room";
import { zeldaRun } from "./run";

/**
 * Shared hit, heart drop, and blink. Each critter owns its own step.
 * Cave critters stay north of the foyer door.
 */
export abstract class ZeldaCritter extends Actor {
    alive = true;
    hurt = 0;
    protected age = 0;
    private canvas!: Canvas;

    constructor(
        x: number,
        y: number,
        name: string,
        protected hpMax: number,
        protected room: RoomHooks,
        private widthPx = 16,
        private heightPx = 16
    ) {
        super({
            name,
            pos: vec(x, y),
            width: 10,
            height: 10,
            anchor: vec(0.5, 0.5),
            collisionType: CollisionType.PreventCollision,
            z: 4,
        });
        this.hp = hpMax;
        this.body.useGravity = false;
        this.addTag("foe");
    }

    hp: number;

    onInitialize(_engine: Engine): void {
        this.canvas = new Canvas({
            width: this.widthPx,
            height: this.heightPx,
            cache: true,
            smoothing: false,
            filtering: ImageFiltering.Pixel,
            origin: vec(this.widthPx / 2, this.heightPx / 2),
            color: Color.fromRGB(0, 0, 0, 0),
            draw: (ctx) => {
                ctx.clearRect(0, 0, this.widthPx, this.heightPx);
                if (this.hurt > 0 && Math.floor(this.age * 24) % 2 === 0) return;
                this.draw(ctx);
            },
        });
        this.graphics.use(this.canvas);
    }

    box(): Box {
        return { x: this.pos.x - 5, y: this.pos.y - 5, w: 10, h: 10 };
    }

    protected canBeCut(): boolean {
        return true;
    }

    protected bodyHurts(): boolean {
        return true;
    }

    protected stayNorth(): void {
        const limit = HUD + 6 * TILE - 8;
        if (this.pos.y > limit) this.pos.y = limit;
    }

    onPreUpdate(_engine: Engine, delta: number): void {
        const dt = Math.min(0.05, delta / 1000);
        this.age += dt;
        if (this.hurt > 0) this.hurt -= dt;
        if (this.alive) {
            this.step(dt);
            this.touchHero();
        }
        this.z = 3 + this.pos.y / 100;
        this.canvas.flagDirty();
    }

    protected abstract step(dt: number): void;

    protected abstract draw(ctx: CanvasRenderingContext2D): void;

    protected onDie(): void {
        return;
    }

    private touchHero(): void {
        const hero = this.room.hero;
        const sword = hero.swordBox();
        if (sword && this.canBeCut() && overlap(this.box(), sword)) {
            this.damage();
            return;
        }
        if (this.bodyHurts() && hero.iframes <= 0 && !hero.down && overlap(this.box(), hero.box())) {
            hero.injure(hero.pos.x - this.pos.x, hero.pos.y - this.pos.y);
        }
    }

    private damage(): void {
        if (!this.alive || this.hurt > 0) return;
        this.hp -= 1;
        this.hurt = 0.18;
        tone(180, 0.05);
        if (this.hp <= 0) this.die();
    }

    private die(): void {
        if (!this.alive) return;
        this.alive = false;
        this.onDie();
        tone(120, 0.08);
        if (zeldaRun.hearts < zeldaRun.maxHearts && (this.hpMax >= 2 || Math.random() < 0.45)) {
            this.room.spawn(new HeartDrop(this.pos.x, this.pos.y - 4));
        }
        this.kill();
    }
}
