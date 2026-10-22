import { Canvas, Color, ImageFiltering, vec } from "excalibur";
import type { City } from "./level";
import { TILE, WORLD, paletteFor, type Palette, type TimeOfDay } from "./level";
import type { Dir, Rect } from "./rules";

const cache = new Map<string, Canvas>();

function gfx(key: string, w: number, h: number, ox: number, oy: number, draw: (ctx: CanvasRenderingContext2D) => void): Canvas {
    const found = cache.get(key);
    if (found) return found;
    const canvas = new Canvas({
        width: w,
        height: h,
        cache: true,
        smoothing: false,
        filtering: ImageFiltering.Pixel,
        origin: vec(ox, oy),
        color: Color.fromRGB(0, 0, 0, 0),
        draw: (ctx) => {
            ctx.clearRect(0, 0, w, h);
            ctx.imageSmoothingEnabled = false;
            draw(ctx);
        },
    });
    cache.set(key, canvas);
    return canvas;
}

function disk(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, outline: string): void {
    ctx.fillStyle = outline;
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function roundBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    outline: string
): void {
    ctx.fillStyle = outline;
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
}

export type FigureKind = "seller" | "sit" | "walk" | "cop" | "chew" | "carry";

const INK = "#14110e";

export function personGraphic(kind: FigureKind, dir: Dir, coat: string): Canvas {
    return gfx(`p2:${kind}:${dir}:${coat}`, 80, 96, 40, 86, (ctx) => drawPerson(ctx, kind, dir, coat));
}

function drawPerson(ctx: CanvasRenderingContext2D, kind: FigureKind, dir: Dir, coat: string): void {
    const skin = "#e8b48a";
    const hair = kind === "cop" ? "#1b2433" : "#2c241e";
    const pants = kind === "cop" ? "#1c2740" : "#3a332c";
    const seated = kind === "sit" || kind === "chew";
    ctx.fillStyle = "rgba(20,16,12,0.38)";
    ctx.beginPath();
    ctx.ellipse(40, 86, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (seated) roundBox(ctx, 18, 70, 44, 12, "#8d6844", INK);
    if (!seated) {
        const step = dir === "e" ? 2 : dir === "w" ? -2 : 0;
        roundBox(ctx, 22 + step, 66, 12, 16, pants, INK);
        roundBox(ctx, 46 - step, 66, 12, 16, pants, INK);
        roundBox(ctx, 22 + step, 78, 12, 6, "#2a2622", INK);
        roundBox(ctx, 46 - step, 78, 12, 6, "#2a2622", INK);
    }
    roundBox(ctx, seated ? 24 : 22, seated ? 50 : 44, seated ? 32 : 36, seated ? 22 : 26, coat, INK);
    if (kind === "cop") {
        ctx.fillStyle = "#f0c84a";
        ctx.fillRect(48, 52, 6, 6);
        ctx.fillStyle = INK;
        ctx.fillRect(50, 54, 2, 2);
    }
    disk(ctx, 40, 34, 16, skin, INK);
    ctx.fillStyle = hair;
    ctx.beginPath();
    if (dir === "n") ctx.arc(40, 32, 16, 0, Math.PI * 2);
    else ctx.arc(40, 30, 16, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
    if (kind === "cop") {
        roundBox(ctx, 22, 16, 36, 10, "#243656", INK);
        roundBox(ctx, 18, 24, 44, 5, "#1c2a44", INK);
        ctx.fillStyle = "#f0c84a";
        ctx.fillRect(38, 18, 5, 5);
    }
    if (dir !== "n") {
        ctx.fillStyle = INK;
        const eyeY = 34;
        if (dir === "s") {
            ctx.fillRect(32, eyeY, 4, 4);
            ctx.fillRect(44, eyeY, 4, 4);
        } else if (dir === "e") {
            ctx.fillRect(48, eyeY, 4, 4);
        } else {
            ctx.fillRect(28, eyeY, 4, 4);
        }
    }
    if (kind === "seller") {
        roundBox(ctx, 46, 48, 22, 16, "#c43732", INK);
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(50, 52, 5, 5);
        ctx.fillRect(58, 52, 5, 5);
        ctx.fillRect(50, 58, 5, 5);
    }
    if (kind === "carry" || kind === "chew") {
        const hx = dir === "w" ? 8 : 52;
        const hy = kind === "chew" ? 36 : 50;
        roundBox(ctx, hx, hy, 16, 14, "#f0b429", INK);
        ctx.fillStyle = "#d8892a";
        ctx.fillRect(hx + 3, hy + 3, 10, 3);
    }
}

export function crumbGraphic(): Canvas {
    return gfx("crumb", 14, 14, 7, 7, (ctx) => {
        roundBox(ctx, 2, 2, 10, 10, "#f0b429", INK);
    });
}

export function carGraphic(dir: Dir, color: string): Canvas {
    const vertical = dir === "n" || dir === "s";
    const w = vertical ? 40 : 72;
    const h = vertical ? 72 : 40;
    return gfx(`car:${dir}:${color}`, w, h, w / 2, h / 2, (ctx) => {
        const outline = "#1b1714";
        roundBox(ctx, 4, 4, w - 8, h - 8, color, outline);
        ctx.fillStyle = "#9fd7e8";
        if (vertical) ctx.fillRect(8, dir === "s" ? 14 : 28, w - 16, 22);
        else ctx.fillRect(dir === "e" ? 14 : 28, 8, 22, h - 16);
        ctx.fillStyle = "#f4efe4";
        if (dir === "s") ctx.fillRect(8, h - 12, w - 16, 4);
        if (dir === "n") ctx.fillRect(8, 6, w - 16, 4);
        if (dir === "e") ctx.fillRect(w - 12, 8, 4, h - 16);
        if (dir === "w") ctx.fillRect(6, 8, 4, h - 16);
    });
}

export function dumpsterGraphic(): Canvas {
    return gfx("dumpster", 40, 32, 20, 16, (ctx) => {
        roundBox(ctx, 2, 6, 36, 22, "#3f6b45", "#1b1714");
        ctx.fillStyle = "#2f5236";
        ctx.fillRect(6, 10, 28, 6);
        ctx.fillStyle = "#1b1714";
        ctx.fillRect(8, 4, 24, 4);
    });
}

export function stopSignGraphic(): Canvas {
    return gfx("stop", 22, 22, 11, 11, (ctx) => {
        disk(ctx, 11, 11, 9, "#d23b32", "#1b1714");
        ctx.fillStyle = "#f4efe4";
        ctx.fillRect(7, 10, 8, 2);
    });
}

export function groundGraphic(city: City, time: TimeOfDay): Canvas {
    const palette = paletteFor(time);
    return gfx(`ground:${time}:${city.seats.length}`, WORLD, WORLD, WORLD / 2, WORLD / 2, (ctx) => {
        paintGround(ctx, city, palette);
    });
}

function paintGround(ctx: CanvasRenderingContext2D, city: City, palette: Palette): void {
    ctx.fillStyle = palette.sidewalk;
    ctx.fillRect(0, 0, WORLD, WORLD);
    for (let y = 0; y < WORLD; y += TILE) {
        for (let x = 0; x < WORLD; x += TILE) {
            if (((x / TILE) + (y / TILE)) % 2 === 0) {
                ctx.fillStyle = palette.sidewalkAlt;
                ctx.fillRect(x, y, TILE, TILE);
            }
        }
    }
    ctx.fillStyle = "rgba(28,22,16,0.28)";
    for (let y = 0; y < WORLD; y += TILE) ctx.fillRect(0, y, WORLD, 2);
    for (let x = 0; x < WORLD; x += TILE) ctx.fillRect(x, 0, 2, WORLD);

    ctx.fillStyle = palette.road;
    for (const origin of [2, 18, 34]) {
        ctx.fillRect(origin * TILE, 0, TILE * 4, WORLD);
        ctx.fillRect(0, origin * TILE, WORLD, TILE * 4);
    }

    for (const alley of city.alleys) {
        ctx.fillStyle = palette.alley;
        ctx.fillRect(alley.x, alley.y, alley.w, alley.h);
        ctx.fillStyle = "#4a453f";
        ctx.fillRect(alley.x + 10, alley.y + 14, 8, 6);
        ctx.fillRect(alley.x + alley.w - 22, alley.y + alley.h - 18, 10, 7);
    }

    ctx.strokeStyle = palette.curb;
    ctx.lineWidth = 3;
    for (const origin of [2, 18, 34]) {
        strokeRect(ctx, origin * TILE, 0, TILE * 4, WORLD);
        strokeRect(ctx, 0, origin * TILE, WORLD, TILE * 4);
    }

    ctx.fillStyle = palette.lane;
    for (const origin of [2, 18, 34]) {
        const midX = (origin + 2) * TILE;
        const midY = (origin + 2) * TILE;
        for (let y = 8; y < WORLD; y += 28) ctx.fillRect(midX - 2, y, 4, 14);
        for (let x = 8; x < WORLD; x += 28) ctx.fillRect(x, midY - 2, 14, 4);
    }

    ctx.fillStyle = palette.cross;
    city.crosswalks.forEach((walk) => paintCrosswalk(ctx, walk));

    city.buildings.forEach((building, index) => paintBuilding(ctx, building, palette, index));
}

function strokeRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}

function paintCrosswalk(ctx: CanvasRenderingContext2D, walk: Rect): void {
    if (walk.w >= walk.h) {
        for (let x = walk.x + 4; x < walk.x + walk.w - 4; x += 14) {
            ctx.fillRect(x, walk.y + 4, 8, walk.h - 8);
        }
    } else {
        for (let y = walk.y + 4; y < walk.y + walk.h - 4; y += 14) {
            ctx.fillRect(walk.x + 4, y, walk.w - 8, 8);
        }
    }
}

function paintBuilding(ctx: CanvasRenderingContext2D, building: Rect, palette: Palette, index: number): void {
    const wall = palette.wall[index % palette.wall.length];
    const roof = palette.roof[index % palette.roof.length];
    ctx.fillStyle = palette.outline;
    ctx.fillRect(building.x - 4, building.y - 4, building.w + 8, building.h + 8);
    ctx.fillStyle = wall;
    ctx.fillRect(building.x, building.y, building.w, building.h);
    ctx.fillStyle = roof;
    ctx.fillRect(building.x, building.y, building.w, 16);
    ctx.fillStyle = palette.outline;
    ctx.fillRect(building.x, building.y + 14, building.w, 3);
    const inset = 8;
    if (building.w > inset * 3 && building.h > inset * 3) {
        ctx.fillStyle = roof;
        ctx.fillRect(building.x + inset, building.y + inset, building.w - inset * 2, building.h - inset * 2);
    }
    ctx.fillStyle = "#d7e4ea";
    const stepX = 36;
    const stepY = 42;
    for (let y = building.y + 16; y < building.y + building.h - 18; y += stepY) {
        for (let x = building.x + 14; x < building.x + building.w - 16; x += stepX) {
            ctx.fillStyle = palette.outline;
            ctx.fillRect(x - 2, y - 2, 16, 22);
            ctx.fillStyle = "#d5e6ee";
            ctx.fillRect(x, y, 12, 18);
            ctx.fillStyle = "rgba(60,90,110,0.35)";
            ctx.fillRect(x, y, 5, 18);
        }
    }
}
