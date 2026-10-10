import { ImageFiltering, ImageSource } from "excalibur";
import { hits } from "../../scenes/ZeldaLand/field";
import { FLAME, GRAY, GRAY_DARK, WHITE } from "../../scenes/ZeldaLand/palette";
import type { RoomHooks } from "../../scenes/ZeldaLand/room";
import { zeldaRun } from "../../scenes/ZeldaLand/run";
import { ZeldaCritter } from "../../scenes/ZeldaLand/ZeldaCritter";
import SootwingImage from "./Sootwing.png";

const Resources = {
    Image: new ImageSource(SootwingImage, false, ImageFiltering.Pixel),
};

export { Resources };

/**
 * Cave moth. Hangs harmless until the blade is taken, then ricochets.
 * One hit. The foyer door is the floor of its pen.
 */
export default class Sootwing extends ZeldaCritter {
    private vx = -34;
    private vy = 22;

    constructor(x: number, y: number, room: RoomHooks) {
        super(x, y, "Sootwing", 1, room);
    }

    protected bodyHurts(): boolean {
        return zeldaRun.blade;
    }

    protected canBeCut(): boolean {
        return zeldaRun.blade;
    }

    protected step(dt: number): void {
        if (!zeldaRun.blade) return;
        const radius = 4;
        const nx = this.pos.x + this.vx * dt;
        const ny = this.pos.y + this.vy * dt;
        if (hits(nx, this.pos.y, radius, this.room.field.solidAt)) this.vx *= -1;
        else this.pos.x = nx;
        if (hits(this.pos.x, ny, radius, this.room.field.solidAt)) this.vy *= -1;
        else this.pos.y = ny;
        const before = this.pos.y;
        this.stayNorth();
        if (this.pos.y !== before) this.vy = -Math.abs(this.vy);
    }

    protected draw(ctx: CanvasRenderingContext2D): void {
        const flap = Math.floor(this.age * (zeldaRun.blade ? 12 : 4)) % 2 === 0;
        const wing = flap ? 2 : 5;
        ctx.fillStyle = GRAY_DARK;
        ctx.fillRect(1, wing, 5, 8 - wing);
        ctx.fillRect(10, wing, 5, 8 - wing);
        ctx.fillStyle = GRAY;
        ctx.fillRect(5, 5, 6, 5);
        ctx.fillStyle = FLAME;
        ctx.fillRect(7, 6, 2, 2);
        ctx.fillStyle = WHITE;
        ctx.fillRect(7, 6, 1, 1);
    }
}
