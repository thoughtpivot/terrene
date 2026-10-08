import { ImageFiltering, ImageSource } from "excalibur";
import { slide } from "../../cities/ZeldaLand/field";
import { BLUE, BLUE_DARK, WHITE } from "../../cities/ZeldaLand/palette";
import type { RoomHooks } from "../../cities/ZeldaLand/room";
import { zeldaRun } from "../../cities/ZeldaLand/run";
import { ZeldaCritter } from "../../cities/ZeldaLand/ZeldaCritter";
import DripImage from "./Drip.png";

const Resources = {
    Image: new ImageSource(DripImage, false, ImageFiltering.Pixel),
};

export { Resources };

/**
 * Cave sap. A puddle until the blade is taken, then a slow creep and a short dash.
 * One hit. The wind-up is the moment to swing.
 */
export default class Drip extends ZeldaCritter {
    private mode: "slide" | "wind" | "dash" = "slide";
    private timer = 1;
    private dx = 0;
    private dy = 0;

    constructor(x: number, y: number, room: RoomHooks) {
        super(x, y, "Drip", 1, room);
    }

    protected bodyHurts(): boolean {
        return zeldaRun.blade;
    }

    protected canBeCut(): boolean {
        return zeldaRun.blade;
    }

    protected step(dt: number): void {
        if (!zeldaRun.blade) return;
        this.timer -= dt;
        const solid = this.room.field.solidAt;
        if (this.mode === "slide") {
            const hero = this.room.hero;
            const dx = hero.pos.x - this.pos.x;
            const dy = hero.pos.y - this.pos.y;
            const len = Math.hypot(dx, dy) || 1;
            slide(this.pos, (dx / len) * 18 * dt, (dy / len) * 18 * dt, 5, solid);
            if (this.timer <= 0) {
                this.mode = "wind";
                this.timer = 0.38;
            }
        } else if (this.mode === "wind") {
            if (this.timer <= 0) {
                const hero = this.room.hero;
                const dx = hero.pos.x - this.pos.x;
                const dy = hero.pos.y - this.pos.y;
                const len = Math.hypot(dx, dy) || 1;
                this.dx = dx / len;
                this.dy = dy / len;
                this.mode = "dash";
                this.timer = 0.26;
            }
        } else {
            slide(this.pos, this.dx * 92 * dt, this.dy * 92 * dt, 5, solid);
            if (this.timer <= 0) {
                this.mode = "slide";
                this.timer = 1.35;
            }
        }
        this.stayNorth();
    }

    protected draw(ctx: CanvasRenderingContext2D): void {
        const dash = this.mode === "dash";
        const wind = this.mode === "wind";
        const y = wind ? 7 : 5;
        const h = dash ? 6 : wind ? 4 : 8;
        ctx.fillStyle = BLUE_DARK;
        ctx.fillRect(2, y, 12, h);
        ctx.fillStyle = BLUE;
        ctx.fillRect(3, y + 1, 10, h - 2);
        ctx.fillStyle = WHITE;
        ctx.fillRect(5, y + 2, 2, 2);
        ctx.fillRect(9, y + 2, 2, 2);
        ctx.fillStyle = "#9cb0ff";
        ctx.fillRect(4, y + 1, 2, 1);
    }
}
