import { ImageFiltering, ImageSource } from "excalibur";
import { hits } from "../../scenes/ZeldaLand/field";
import { BROWN, BROWN_DARK, TAN, WHITE } from "../../scenes/ZeldaLand/palette";
import type { RoomHooks } from "../../scenes/ZeldaLand/room";
import { ZeldaCritter } from "../../scenes/ZeldaLand/ZeldaCritter";
import SkipperImage from "./Skipper.png";

const Resources = {
    Image: new ImageSource(SkipperImage, false, ImageFiltering.Pixel),
};

export { Resources };

/**
 * Sand hopper. The arc is a tell, and the sword only connects on the ground.
 * It drifts until you come close, then hops toward you.
 */
export default class Skipper extends ZeldaCritter {
    private state: "ground" | "air" = "ground";
    private timer = 0.45;
    private hopT = 0;
    private readonly hopDur = 0.42;
    private vx = 0;
    private vy = 0;
    private startX = 0;
    private startY = 0;

    constructor(x: number, y: number, room: RoomHooks) {
        super(x, y, "Skipper", 1, room);
        this.startX = x;
        this.startY = y;
    }

    protected canBeCut(): boolean {
        return this.state === "ground";
    }

    protected step(dt: number): void {
        if (this.state === "ground") {
            this.timer -= dt;
            if (this.timer <= 0) this.hop();
            return;
        }
        this.hopT += dt;
        const u = Math.min(1, this.hopT / this.hopDur);
        const arc = Math.sin(Math.PI * u) * 14;
        this.pos.x = this.startX + this.vx * u;
        this.pos.y = this.startY + this.vy * u - arc;
        if (u < 1) return;
        const landX = this.startX + this.vx;
        const landY = this.startY + this.vy;
        if (hits(landX, landY, 5, this.room.field.solidAt)) {
            this.pos.x = this.startX;
            this.pos.y = this.startY;
        } else {
            this.pos.x = landX;
            this.pos.y = landY;
        }
        this.state = "ground";
        this.timer = 0.55;
    }

    private hop(): void {
        const hero = this.room.hero;
        const dx = hero.pos.x - this.pos.x;
        const dy = hero.pos.y - this.pos.y;
        const dist = Math.hypot(dx, dy);
        let hx = 22;
        let hy = 0;
        if (dist < 100 && dist > 1) {
            hx = (dx / dist) * 28;
            hy = (dy / dist) * 28;
        } else {
            const picks = [
                [24, 0],
                [-24, 0],
                [0, 24],
                [0, -24],
            ];
            const pick = picks[Math.floor(this.age * 3) % picks.length];
            hx = pick[0];
            hy = pick[1];
        }
        this.startX = this.pos.x;
        this.startY = this.pos.y;
        this.vx = hx;
        this.vy = hy;
        this.hopT = 0;
        this.state = "air";
    }

    protected draw(ctx: CanvasRenderingContext2D): void {
        const lift = this.state === "air" ? 0 : 1;
        ctx.fillStyle = BROWN_DARK;
        ctx.fillRect(3, 6 + lift, 10, 7);
        ctx.fillStyle = TAN;
        ctx.fillRect(4, 5 + lift, 8, 6);
        ctx.fillStyle = WHITE;
        ctx.fillRect(7, 6 + lift, 2, 2);
        ctx.fillStyle = "#000000";
        ctx.fillRect(7, 7 + lift, 1, 1);
        ctx.fillStyle = BROWN;
        ctx.fillRect(2, 11 + lift, 2, 3);
        ctx.fillRect(12, 11 + lift, 2, 3);
        ctx.fillRect(5, 12 + lift, 2, 3);
        ctx.fillRect(9, 12 + lift, 2, 3);
    }
}
