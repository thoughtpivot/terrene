import { ImageFiltering, ImageSource } from "excalibur";
import { tone } from "../../cities/ZeldaLand/audio";
import { slide, type Box } from "../../cities/ZeldaLand/field";
import { BROWN, GREEN, GREEN_DARK, WHITE } from "../../cities/ZeldaLand/palette";
import type { RoomHooks } from "../../cities/ZeldaLand/room";
import { ZeldaCritter } from "../../cities/ZeldaLand/ZeldaCritter";
import BriarImage from "./Briar.png";

const Resources = {
    Image: new ImageSource(BriarImage, false, ImageFiltering.Pixel),
};

export { Resources };

/**
 * Forest thorn that walks a lane and thrusts a stick when you share its row.
 * Two hits. Trees on the lane are the cover.
 */
export default class Briar extends ZeldaCritter {
    private dir: -1 | 1 = -1;
    private thrust = 0;

    constructor(x: number, y: number, private minX: number, private maxX: number, room: RoomHooks) {
        super(x, y, "Briar", 2, room, 20, 16);
    }

    box(): Box {
        const base = super.box();
        if (this.thrust <= 0) return base;
        if (this.dir > 0) return { x: base.x, y: base.y, w: base.w + 8, h: base.h };
        return { x: base.x - 8, y: base.y, w: base.w + 8, h: base.h };
    }

    protected step(dt: number): void {
        const hero = this.room.hero;
        if (this.thrust > 0) {
            this.thrust -= dt;
            return;
        }
        const aligned = Math.abs(hero.pos.y - this.pos.y) < 10;
        const ahead = this.dir > 0 ? hero.pos.x > this.pos.x : hero.pos.x < this.pos.x;
        const dist = Math.abs(hero.pos.x - this.pos.x);
        if (aligned && ahead && dist < 46 && dist > 8 && !hero.down) {
            this.thrust = 0.32;
            tone(160, 0.04);
            return;
        }
        const before = this.pos.x;
        slide(this.pos, this.dir * 26 * dt, 0, 5, this.room.field.solidAt);
        if (this.pos.x < this.minX || this.pos.x > this.maxX || Math.abs(this.pos.x - before) < 0.01) {
            this.dir = this.dir === 1 ? -1 : 1;
            this.pos.x = Math.min(this.maxX, Math.max(this.minX, this.pos.x));
        }
    }

    protected draw(ctx: CanvasRenderingContext2D): void {
        const ox = 2;
        ctx.fillStyle = GREEN_DARK;
        ctx.fillRect(ox + 3, 5, 10, 9);
        ctx.fillStyle = GREEN;
        ctx.fillRect(ox + 4, 6, 8, 6);
        ctx.fillStyle = WHITE;
        ctx.fillRect(ox + 5, 7, 1, 1);
        ctx.fillRect(ox + 9, 7, 1, 1);
        ctx.fillStyle = BROWN;
        const reach = this.thrust > 0 ? 8 : 4;
        if (this.dir > 0) ctx.fillRect(ox + 12, 8, reach, 2);
        else ctx.fillRect(ox + 2 - (this.thrust > 0 ? 4 : 0), 8, reach, 2);
        ctx.fillStyle = GREEN_DARK;
        ctx.fillRect(ox + 4, 13, 2, 3);
        ctx.fillRect(ox + 10, 13, 2, 3);
    }
}
