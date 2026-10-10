import { Actor, Canvas, CollisionType, ImageFiltering, vec } from "excalibur";
import {
    BLACK,
    BLUE,
    BLUE_DARK,
    BROWN,
    BROWN_DARK,
    CAVE_FLOOR,
    CAVE_LIT,
    CAVE_WALL,
    CAVE_WALL_DARK,
    GRAY,
    GRAY_DARK,
    GREEN,
    GREEN_DARK,
    GREEN_LEAF,
    TAN,
    TAN_DARK,
    WHITE,
} from "./palette";

export const TILE = 16;
export const HUD = 48;
export const COLS = 16;
export const ROWS = 12;
export const VIEW_W = 256;
export const VIEW_H = 240;
export const MAP_H = ROWS * TILE;

export type Facing = "up" | "down" | "left" | "right";

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * One outdoor screen. West of the ridge is forest, east is desert.
 * The mouth sits on the seam and opens south, so the first walk is north
 * into the rock the way the original overworld pulls you up the map.
 * Rows are 12 rather than the original 11 so a 48px heart row fits the
 * existing 256x240 view. The original playfield is 16x11 of these tiles.
 */
export const OVERWORLD: string[] = [
    "################",
    "#T.T.....,,C,R,#",
    "#..~~....,,,C,,#",
    "#T...B...,,R,,,#",
    "#..T..RRRRR,,,,#",
    "#....RRMMRR,C,,#",
    "#.B............#",
    "#T.......,,R,C,#",
    "#...~~....,,,,,#",
    "#.T.B.....,,C,R#",
    "#.......,,,,,,,#",
    "################",
];

/**
 * Sword-cave plan: black hall, brown rock, a lit foyer, then the room.
 * Quill stands in the foyer. The three cave critters are leashed north
 * of the door so the blade is a safe pickup before the fight.
 */
export const CAVE: string[] = [
    "################",
    "##RRRRRRRRRRRR##",
    "##R          R##",
    "##R          R##",
    "##R    R     R##",
    "##R          R##",
    "##RRRRR   RRRR##",
    "##R          R##",
    "##R          R##",
    "##RRRR    RRRR##",
    "####        ####",
    "################",
];

const SOLID = "#TBC~R";

export function cell(col: number, row: number): { x: number; y: number } {
    return { x: col * TILE + TILE / 2, y: HUD + row * TILE + TILE / 2 };
}

export function overlap(a: Box, b: Box): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function hits(x: number, y: number, radius: number, solid: (px: number, py: number) => boolean): boolean {
    return (
        solid(x - radius, y - radius) ||
        solid(x + radius, y - radius) ||
        solid(x - radius, y + radius) ||
        solid(x + radius, y + radius) ||
        solid(x, y - radius) ||
        solid(x, y + radius) ||
        solid(x - radius, y) ||
        solid(x + radius, y)
    );
}

export function slide(
    pos: { x: number; y: number },
    dx: number,
    dy: number,
    radius: number,
    solid: (px: number, py: number) => boolean
): void {
    pos.x += dx;
    if (hits(pos.x, pos.y, radius, solid)) pos.x -= dx;
    pos.y += dy;
    if (hits(pos.x, pos.y, radius, solid)) pos.y -= dy;
}

export function clearLine(
    solid: (px: number, py: number) => boolean,
    x0: number,
    y0: number,
    x1: number,
    y1: number
): boolean {
    for (let i = 1; i <= 5; i++) {
        const t = i / 5;
        if (solid(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
    }
    return true;
}

export function face4(fromX: number, fromY: number, toX: number, toY: number): Facing {
    const dx = toX - fromX;
    const dy = toY - fromY;
    if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? "right" : "left";
    return dy >= 0 ? "down" : "up";
}

function hash(col: number, row: number): number {
    return (col * 17 + row * 31) % 8;
}

export class Field {
    readonly solidAt = (x: number, y: number): boolean => {
        const col = Math.floor(x / TILE);
        const row = Math.floor((y - HUD) / TILE);
        if (row < 0 || row >= this.rows.length || col < 0 || col >= COLS) return true;
        return SOLID.includes(this.rows[row][col]);
    };

    constructor(private rows: string[]) {
        if (rows.length !== ROWS) {
            throw new Error(`Zelda map must be ${ROWS} rows`);
        }
        for (const row of rows) {
            if (row.length !== COLS) {
                throw new Error(`Zelda map row must be ${COLS} wide, got ${row.length}: ${row}`);
            }
        }
    }

    charAt(x: number, y: number): string {
        const col = Math.floor(x / TILE);
        const row = Math.floor((y - HUD) / TILE);
        if (row < 0 || row >= this.rows.length || col < 0 || col >= COLS) return "#";
        return this.rows[row][col];
    }

    rowAt(y: number): number {
        return Math.floor((y - HUD) / TILE);
    }
}

export interface Terrain {
    actor: Actor;
    field: Field;
    setPhase(phase: number): void;
}

export function makeTerrain(rows: string[], mode: "overworld" | "cave"): Terrain {
    const field = new Field(rows);
    let phase = 0;
    const canvas = new Canvas({
        width: VIEW_W,
        height: MAP_H,
        cache: true,
        smoothing: false,
        filtering: ImageFiltering.Pixel,
        draw: (ctx) => {
            drawWorld(ctx, rows, mode, phase);
        },
    });
    const actor = new Actor({
        name: "Terrain",
        pos: vec(VIEW_W / 2, HUD + MAP_H / 2),
        width: VIEW_W,
        height: MAP_H,
        anchor: vec(0.5, 0.5),
        z: 0,
        collisionType: CollisionType.PreventCollision,
    });
    actor.graphics.use(canvas);
    actor.body.useGravity = false;
    return {
        actor,
        field,
        setPhase(next: number): void {
            phase = next;
            canvas.flagDirty();
        },
    };
}

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawWorld(ctx: CanvasRenderingContext2D, rows: string[], mode: "overworld" | "cave", phase: number): void {
    for (let row = 0; row < rows.length; row++) {
        for (let col = 0; col < COLS; col++) {
            const ch = rows[row][col];
            if (mode === "cave") drawCaveTile(ctx, col, row, ch, phase);
            else drawOverworldTile(ctx, col, row, ch, phase);
        }
    }
}

function drawOverworldTile(ctx: CanvasRenderingContext2D, col: number, row: number, ch: string, phase: number): void {
    const x = col * TILE;
    const y = row * TILE;
    if (ch === "#") {
        if (col >= 8) drawRock(ctx, x, y, hash(col, row));
        else drawTree(ctx, x, y);
        return;
    }
    if (ch === "~") {
        drawWater(ctx, x, y, phase);
        return;
    }
    const sand = ch === "," || ch === "C" || col >= 8;
    if (sand) drawSand(ctx, x, y, col, row);
    else drawGrass(ctx, x, y, col, row);
    if (ch === "T") drawTree(ctx, x, y);
    else if (ch === "B") drawBush(ctx, x, y);
    else if (ch === "C") drawCactus(ctx, x, y);
    else if (ch === "R") drawRock(ctx, x, y, hash(col, row));
    else if (ch === "M") drawMouth(ctx, x, y);
}

function drawGrass(ctx: CanvasRenderingContext2D, x: number, y: number, col: number, row: number): void {
    fill(ctx, x, y, 16, 16, GREEN);
    fill(ctx, x + 2, y + 11, 2, 3, GREEN_DARK);
    fill(ctx, x + 11, y + 4, 2, 2, GREEN_LEAF);
    if (hash(col, row) === 0) {
        fill(ctx, x + 8, y + 8, 2, 2, WHITE);
        fill(ctx, x + 8, y + 10, 1, 2, GREEN_DARK);
    }
}

function drawSand(ctx: CanvasRenderingContext2D, x: number, y: number, col: number, row: number): void {
    fill(ctx, x, y, 16, 16, TAN);
    fill(ctx, x + 3, y + 8, 4, 1, TAN_DARK);
    fill(ctx, x + 10, y + 4, 2, 1, BROWN);
    if (hash(col, row) === 3) fill(ctx, x + 6, y + 12, 3, 1, WHITE);
}

function drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, phase: number): void {
    fill(ctx, x, y, 16, 16, phase % 2 === 0 ? BLUE : BLUE_DARK);
    fill(ctx, x + 3 + (phase % 3) * 3, y + 5, 2, 1, WHITE);
    fill(ctx, x + 11, y + 11, 3, 1, "#6c78ff");
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    fill(ctx, x + 6, y + 10, 4, 6, BROWN_DARK);
    fill(ctx, x + 2, y + 1, 12, 11, GREEN_DARK);
    fill(ctx, x + 4, y + 3, 8, 7, GREEN);
    fill(ctx, x + 5, y + 4, 3, 2, GREEN_LEAF);
}

function drawBush(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    fill(ctx, x + 2, y + 7, 12, 7, GREEN_DARK);
    fill(ctx, x + 4, y + 5, 8, 5, GREEN);
    fill(ctx, x + 6, y + 6, 2, 2, WHITE);
}

function drawCactus(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    fill(ctx, x + 6, y + 2, 4, 13, GREEN_DARK);
    fill(ctx, x + 7, y + 3, 2, 10, GREEN);
    fill(ctx, x + 2, y + 6, 4, 3, GREEN_DARK);
    fill(ctx, x + 10, y + 5, 4, 3, GREEN_DARK);
    fill(ctx, x + 7, y + 4, 1, 1, GREEN_LEAF);
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, n: number): void {
    fill(ctx, x, y, 16, 16, BROWN_DARK);
    fill(ctx, x + 1, y + 2, 13, 12, GRAY);
    fill(ctx, x + 2, y + 3, 5, 4, WHITE);
    fill(ctx, x + 8, y + 8, 5, 4, GRAY_DARK);
    if (n % 2 === 0) fill(ctx, x + 6, y + 6, 2, 5, BROWN);
}

function drawMouth(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    fill(ctx, x, y, 16, 16, BROWN_DARK);
    fill(ctx, x + 1, y + 1, 14, 14, GRAY_DARK);
    fill(ctx, x + 3, y + 3, 10, 12, BLACK);
    fill(ctx, x + 5, y + 12, 6, 2, "#3a2410");
}

function drawCaveTile(ctx: CanvasRenderingContext2D, col: number, row: number, ch: string, phase: number): void {
    const x = col * TILE;
    const y = row * TILE;
    if (ch === "#" || ch === "R") {
        drawCaveWall(ctx, x, y, hash(col, row));
        return;
    }
    const lit = row >= 7;
    fill(ctx, x, y, 16, 16, lit ? CAVE_LIT : CAVE_FLOOR);
    const n = hash(col, row);
    if (!lit && n === 2) fill(ctx, x + 4, y + 11, 2, 1, GRAY_DARK);
    if (lit && n === 4) fill(ctx, x + 8, y + 6, 3, 1, "#3a2418");
    if (phase % 2 === 0 && n === 1) fill(ctx, x + 12, y + 3, 1, 1, "#2a1808");
}

function drawCaveWall(ctx: CanvasRenderingContext2D, x: number, y: number, n: number): void {
    fill(ctx, x, y, 16, 16, CAVE_WALL_DARK);
    fill(ctx, x + 1, y + 1, 8, 6, CAVE_WALL);
    fill(ctx, x + 7, y + 8, 8, 6, n % 2 === 0 ? "#8a5a32" : CAVE_WALL);
    fill(ctx, x + 3, y + 3, 2, 2, GRAY);
    fill(ctx, x + 10, y + 10, 3, 2, BLACK);
}
