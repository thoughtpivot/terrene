import { ImageFiltering, ImageSource } from "excalibur";
import { slide } from "../../scenes/ZeldaLand/field";
import { BROWN, RED, WHITE } from "../../scenes/ZeldaLand/palette";
import type { RoomHooks } from "../../scenes/ZeldaLand/room";
import { zeldaRun } from "../../scenes/ZeldaLand/run";
import { ZeldaCritter } from "../../scenes/ZeldaLand/ZeldaCritter";
import ClackImage from "./Clack.png";

const Resources = {
    Image: new ImageSource(ClackImage, false, ImageFiltering.Pixel),
};

export { Resources };

/**
 * Bone pile that stands once the blade is taken. Two hits.
 * It walks, then lunges. The center rock is there so the lunge has a corner.
 */
export default class Clack extends ZeldaCritter {
    private timer = 1.2;
    private lunge = 0;
    private dx = 0;
    private dy = 0;

    constructor(x: number, y: number, room: RoomHooks) {
        super(x, y, "Clack", 2, room);
    }

    protected bodyHurts(): boolean {
        return zeldaRun.blade;
    }

    protected canBeCut(): boolean {
        return zeldaRun.blade;
    }

    protected step(dt: number): void {
        if (!zeldaRun.blade) return;
        const hero = this.room.hero;
        const solid = this.room.field.solidAt;
        this.timer -= dt;
        if (this.lunge > 0) {
            this.lunge -= dt;
            slide(this.pos, this.dx * 76 * dt, this.dy * 76 * dt, 5, solid);
        } else {
            const dx = hero.pos.x - this.pos.x;
            const dy = hero.pos.y - this.pos.y;
            const len = Math.hypot(dx, dy) || 1;
            slide(this.pos, (dx / len) * 24 * dt, (dy / len) * 24 * dt, 5, solid);
            if (this.timer <= 0 && len < 80) {
                this.dx = dx / len;
                this.dy = dy / len;
                this.lunge = 0.18;
                this.timer = 1.8;
            } else if (this.timer <= 0) {
                this.timer = 0.6;
            }
        }
        this.stayNorth();
    }

    protected draw(ctx: CanvasRenderingContext2D): void {
        if (!zeldaRun.blade) {
            ctx.fillStyle = WHITE;
            ctx.fillRect(3, 10, 10, 3);
            ctx.fillRect(5, 8, 6, 2);
            ctx.fillStyle = BROWN;
            ctx.fillRect(6, 11, 4, 1);
            return;
        }
        const hop = this.lunge > 0 ? -2 : 0;
        ctx.fillStyle = WHITE;
        ctx.fillRect(5, 3 + hop, 6, 5);
        ctx.fillRect(6, 8 + hop, 4, 3);
        ctx.fillRect(4, 11 + hop, 3, 4);
        ctx.fillRect(9, 11 + hop, 3, 4);
        ctx.fillStyle = BROWN;
        ctx.fillRect(6, 8 + hop, 4, 1);
        ctx.fillStyle = RED;
        ctx.fillRect(6, 5 + hop, 1, 1);
        ctx.fillRect(9, 5 + hop, 1, 1);
    }
}
