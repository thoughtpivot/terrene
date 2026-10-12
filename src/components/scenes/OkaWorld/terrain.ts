import { Actor, ImageSource, Sprite, vec } from "excalibur";
import { STORE, TERRAIN, type TerrainFrame } from "./art/atlas";
import type { Piece } from "./level";
import type { OkaPhysics, Point } from "./physics";

function frameSprite(atlas: ImageSource, f: TerrainFrame, width?: number): Sprite {
    const w = f.w / STORE;
    const h = f.h / STORE;
    return new Sprite({
        image: atlas,
        sourceView: { x: f.x, y: f.y, width: f.w, height: f.h },
        destSize: { width: width ?? w, height: h },
    });
}

/** Columns of a piece whose painted top is level with its walk line. */
function walkColumns(f: TerrainFrame): number[] {
    const top = (f.top ?? 0) / STORE;
    const cols: number[] = [];
    f.profile.forEach((v, i) => {
        if (v !== null && v <= top + 12) cols.push(i);
    });
    return cols;
}

/**
 * Place a floating rock, slab or island. `top` is where feet rest.
 * Returns the actor so the scene can track it.
 */
export function placePiece(atlas: ImageSource, physics: OkaPhysics, piece: Piece): Actor {
    const f = TERRAIN[piece.name];
    const w = f.w / STORE;
    const h = f.h / STORE;
    const top = (f.top ?? 0) / STORE;
    const angle = piece.angle ?? 0;
    const cx = piece.x + w / 2;
    const cy = piece.top - top + h / 2;
    const actor = new Actor({ pos: vec(cx, cy), anchor: vec(0.5, 0.5), z: 0, rotation: angle });
    const sprite = frameSprite(atlas, f);
    sprite.flipHorizontal = !!piece.flip;
    actor.graphics.use(sprite);

    const cols = walkColumns(f);
    const first = Math.min(...cols);
    const last = Math.max(...cols);
    // local coords relative to the centre, before rotation
    const xs = [first * 8 + 2, (last + 1) * 8 - 2];
    const local: Point[] = xs.map((x) => ({ x: (piece.flip ? w - x : x) - w / 2, y: top - h / 2 }));
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const pts = local.map((p) => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }));
    physics.addSurface(pts);
    return actor;
}

/** A run of solid ground tiled from the cobbled block painting. */
export function placeGround(atlas: ImageSource, physics: OkaPhysics, x0: number, x1: number, top: number): Actor[] {
    const f = TERRAIN.ground;
    const tileW = f.w / STORE;
    const h = f.h / STORE;
    const imgTop = top - (f.top ?? 0) / STORE;
    const span = x1 - x0;
    const actors: Actor[] = [];
    // tiles overlap by at least 24 so their rounded ends never leave a seam
    const n = span <= tileW ? 1 : Math.ceil((span - tileW) / (tileW - 24)) + 1;
    const width = n === 1 ? span : tileW;
    const step = n === 1 ? 0 : (span - tileW) / (n - 1);
    for (let i = 0; i < n; i++) {
        const sprite = frameSprite(atlas, f, width);
        sprite.flipHorizontal = i % 2 === 1;
        const a = new Actor({ pos: vec(x0 + i * step, imgTop), anchor: vec(0, 0), z: i % 2 === 0 ? 0.1 : 0 });
        a.graphics.use(sprite);
        actors.push(a);
    }
    physics.addSolid(x0 + 4, top, span - 8, 700 - top);
    return actors;
}

/** A tall crystal wall whose foot sinks behind the ground. */
export function placeWall(atlas: ImageSource, physics: OkaPhysics, x: number, top: number): Actor {
    const f = TERRAIN.wall;
    const w = f.w / STORE;
    const imgTop = top - (f.top ?? 0) / STORE;
    const a = new Actor({ pos: vec(x, imgTop), anchor: vec(0, 0), z: -1 });
    a.graphics.use(frameSprite(atlas, f));
    physics.addSolid(x + 8, top, w - 16, 560 - top);
    return a;
}
