/**
 * Scene one, and the shape later street levels fill in.
 *
 * Frozen in rules.ts: the coin flip, one follower, a quiet dismiss,
 * the rooted handoff, witnesses (distance and sight) only during the
 * handoff, the five-second call, dumpster hiding, sprint, crosswalk
 * safety, and a full restart at $0.
 *
 * A later level may change everything this file builds: the blocks,
 * seats, alleys, dumpsters, lanes, lights, stop signs, pedestrians,
 * prices, the dollar goal, police timing, and the time of day.
 * Pass that pack to the Street scene. Scene one is the default.
 */

import {
    type Dir,
    type Rect,
    type Vec,
} from "./rules";

export const TILE = 48;
export const WORLD = TILE * 40;
export const VIEW_W = 960;
export const VIEW_H = 540;

export type TimeOfDay = "afternoon" | "dusk";
export type Control = "light" | "stop";

export interface Palette {
    sidewalk: string;
    sidewalkAlt: string;
    curb: string;
    road: string;
    lane: string;
    alley: string;
    outline: string;
    cross: string;
    wall: string[];
    roof: string[];
    background: string;
}

export interface Gate {
    line: number;
    kind: "light" | "stop" | "yield";
    flow: "ns" | "ew";
    crossId: number;
}

export interface Lane {
    axis: "x" | "y";
    dir: 1 | -1;
    fixed: number;
    min: number;
    max: number;
    gates: Gate[];
}

export interface Seat {
    id: number;
    x: number;
    y: number;
    facing: Dir;
    coat: string;
    name: string;
}

export interface PedRoute {
    pts: Vec[];
    coat: string;
    offset: number;
}

/** One block's sight check: the mouth can see the entrance, not the pocket. */
export interface SightCheck {
    mouth: Vec;
    pocket: Vec;
    shaft: Vec;
}

export interface City {
    buildings: Rect[];
    alleys: Rect[];
    dumpsters: Rect[];
    seats: Seat[];
    lanes: Lane[];
    crosswalks: Rect[];
    peds: PedRoute[];
    signs: Array<{ x: number; y: number; kind: "stop" | "ns" | "ew" }>;
    start: Vec;
    checks: SightCheck[];
}

/**
 * Knobs a later level is allowed to turn.
 * The street plan itself is whichever builder returns the City.
 */
export interface StreetLevel {
    id: string;
    title: string;
    goal: number;
    price: number;
    greenSeconds: number;
    carSpeed: number;
    carsPerLane: number;
    witnessRadius: number;
    policeDelay: number;
    policeSprint: number;
    policeWalk: number;
    policeSprintTime: number;
    policeRecover: number;
    copSight: number;
    pullRadius: number;
    time: TimeOfDay;
    /** "verticalRoad,horizontalRoad" using tile origins 2, 18, and 34. */
    controls: Record<string, Control>;
    /** Routed scene to open after a win. Null stays on the clear card. */
    next: string | null;
}

export interface StreetPack {
    level: StreetLevel;
    city: City;
}

const NAMES = [
    "Red", "Moss", "Juniper", "Salt", "Penny", "Wool", "Brick", "Nico",
    "Harper", "Sunny", "Mack", "Rita", "Otto", "Bea", "Luis", "Pearl",
    "Hank", "Ida", "Russ", "Cleo",
];

const COATS = ["#6b5344", "#4e5a48", "#5c4a3a", "#3e4c5c", "#6a3e3e", "#5a4632", "#4a4038", "#7a6248"];
const PED_COATS = ["#d4543c", "#3c7eb5", "#e0b23c", "#6a8f4e", "#c46aa0", "#5b6b8a"];

const DIRS: Dir[] = ["n", "e", "s", "w"];

const BUILDINGS: Rect[] = [
    { x: 0, y: 0, w: 2, h: 8 },
    { x: 4, y: 1, w: 1, h: 3 },
    { x: 5, y: 0, w: 2, h: 4 },
    { x: 7, y: 0, w: 1, h: 8 },
    { x: 2, y: 6, w: 5, h: 2 },
];

const ALLEYS: Rect[] = [
    { x: 2, y: 0, w: 2, h: 5 },
    { x: 2, y: 4, w: 5, h: 2 },
];

const SEAT_LOCAL: Array<{ x: number; y: number; f: Dir }> = [
    { x: 1.05, y: -0.42, f: "n" },
    { x: 6.15, y: -0.42, f: "n" },
    { x: -0.42, y: 2.3, f: "w" },
    { x: -0.42, y: 6.1, f: "w" },
    { x: 3.6, y: 8.42, f: "s" },
];

interface BlockSpec {
    col: number;
    row: number;
    rot: number;
}

const BLOCKS: BlockSpec[] = [
    { col: 8, row: 8, rot: 0 },
    { col: 24, row: 8, rot: 1 },
    { col: 8, row: 24, rot: 3 },
    { col: 24, row: 24, rot: 2 },
];

const ROADS = [2, 18, 34];

export function paletteFor(time: TimeOfDay): Palette {
    if (time === "dusk") {
        return {
            sidewalk: "#b7a18c",
            sidewalkAlt: "#a8927e",
            curb: "#6d6258",
            road: "#2c3138",
            lane: "#cbb98a",
            alley: "#3e3a38",
            outline: "#161311",
            cross: "#d9d0c4",
            wall: ["#c2ad90", "#b3a288", "#a8b4b2", "#cbb89e"],
            roof: ["#6d382e", "#46563c", "#2c4154", "#7d5130"],
            background: "#1c1816",
        };
    }
    return {
        sidewalk: "#d7c4a8",
        sidewalkAlt: "#cbb89a",
        curb: "#8d7b68",
        road: "#3e444d",
        lane: "#e4d7a4",
        alley: "#5c564f",
        outline: "#1b1714",
        cross: "#f3eee6",
        wall: ["#e0c9a6", "#d2c0a2", "#c5d0ce", "#ead4b8"],
        roof: ["#8d4638", "#5d6e4e", "#3c5870", "#a56a3e"],
        background: "#cbb89a",
    };
}

export function buildSceneOne(): StreetPack {
    const level: StreetLevel = {
        id: "street",
        title: "Scene One",
        goal: 500,
        price: 50,
        greenSeconds: 3.4,
        carSpeed: 210,
        carsPerLane: 2,
        witnessRadius: 250,
        policeDelay: 5,
        policeSprint: 176,
        policeWalk: 96,
        policeSprintTime: 1.4,
        policeRecover: 3.8,
        copSight: 420,
        pullRadius: 46,
        time: "afternoon",
        controls: {
            "18,18": "light",
            "18,34": "light",
            "18,2": "stop",
            "2,18": "stop",
            "34,34": "stop",
        },
        next: null,
    };
    return { level, city: buildTown(level) };
}

function rotXY(x: number, y: number, turns: number): [number, number] {
    let px = x;
    let py = y;
    const n = ((turns % 4) + 4) % 4;
    for (let i = 0; i < n; i++) {
        const nx = 8 - py;
        const ny = px;
        px = nx;
        py = ny;
    }
    return [px, py];
}

function rotRect(rect: Rect, turns: number): Rect {
    const corners: Array<[number, number]> = [
        [rect.x, rect.y],
        [rect.x + rect.w, rect.y],
        [rect.x, rect.y + rect.h],
        [rect.x + rect.w, rect.y + rect.h],
    ];
    const pts = corners.map(([x, y]) => rotXY(x, y, turns));
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function worldRect(col: number, row: number, local: Rect): Rect {
    return {
        x: (col + local.x) * TILE,
        y: (row + local.y) * TILE,
        w: local.w * TILE,
        h: local.h * TILE,
    };
}

function worldPoint(col: number, row: number, x: number, y: number): Vec {
    return { x: (col + x) * TILE, y: (row + y) * TILE };
}

export function buildTown(level: StreetLevel): City {
    const buildings: Rect[] = [];
    const alleys: Rect[] = [];
    const dumpsters: Rect[] = [];
    const seats: Seat[] = [];
    const checks: SightCheck[] = [];

    BLOCKS.forEach((block, index) => {
        for (const local of BUILDINGS) buildings.push(worldRect(block.col, block.row, rotRect(local, block.rot)));
        for (const local of ALLEYS) alleys.push(worldRect(block.col, block.row, rotRect(local, block.rot)));

        const pocket = rotXY(6, 5, block.rot);
        const dumpW = 0.62 * TILE;
        const dumpH = 0.5 * TILE;
        const center = worldPoint(block.col, block.row, pocket[0], pocket[1]);
        dumpsters.push({ x: center.x - dumpW / 2, y: center.y - dumpH / 2, w: dumpW, h: dumpH });

        const mouth = rotXY(3, -0.55, block.rot);
        const shaft = rotXY(3, 2, block.rot);
        checks.push({
            mouth: worldPoint(block.col, block.row, mouth[0], mouth[1]),
            pocket: center,
            shaft: worldPoint(block.col, block.row, shaft[0], shaft[1]),
        });

        SEAT_LOCAL.forEach((seat, seatIndex) => {
            const at = rotXY(seat.x, seat.y, block.rot);
            const id = seats.length;
            seats.push({
                id,
                ...worldPoint(block.col, block.row, at[0], at[1]),
                facing: DIRS[(DIRS.indexOf(seat.f) + block.rot) % 4],
                coat: COATS[(index * 5 + seatIndex) % COATS.length],
                name: NAMES[id] ?? `Seat ${id}`,
            });
        });
    });

    const { lanes, crosswalks, signs } = buildTraffic(level);
    const peds = buildPeds();
    return {
        buildings,
        alleys,
        dumpsters,
        seats,
        lanes,
        crosswalks,
        peds,
        signs,
        start: { x: 12.5 * TILE, y: 33.15 * TILE },
        checks,
    };
}

function buildPeds(): PedRoute[] {
    const routes: PedRoute[] = [];
    let n = 0;
    for (const block of BLOCKS) {
        const left = (block.col - 0.9) * TILE;
        const right = (block.col + 8.9) * TILE;
        const top = (block.row - 0.9) * TILE;
        const bot = (block.row + 8.9) * TILE;
        const pts = [
            { x: left, y: top },
            { x: right, y: top },
            { x: right, y: bot },
            { x: left, y: bot },
        ];
        for (let i = 0; i < 3; i++) {
            routes.push({ pts, coat: PED_COATS[n % PED_COATS.length], offset: i / 3 });
            n++;
        }
    }
    return routes;
}

function buildTraffic(level: StreetLevel): { lanes: Lane[]; crosswalks: Rect[]; signs: City["signs"] } {
    const crosswalks: Rect[] = [];
    const signs: City["signs"] = [];
    const band = TILE;
    const span = TILE * 4;

    interface Crossing {
        vx: number;
        hy: number;
        north: number;
        south: number;
        west: number;
        east: number;
        kind: Control | "open";
    }

    const crossings: Crossing[] = [];
    for (const vx of ROADS) {
        for (const hy of ROADS) {
            const ix = vx * TILE;
            const iy = hy * TILE;
            const north = crosswalks.length;
            crosswalks.push({ x: ix, y: iy - band, w: span, h: band });
            const south = crosswalks.length;
            crosswalks.push({ x: ix, y: iy + span, w: span, h: band });
            const west = crosswalks.length;
            crosswalks.push({ x: ix - band, y: iy, w: band, h: span });
            const east = crosswalks.length;
            crosswalks.push({ x: ix + span, y: iy, w: band, h: span });
            const kind = level.controls[`${vx},${hy}`] ?? "open";
            crossings.push({ vx, hy, north, south, west, east, kind });
            const markX = ix - 20;
            const markY = iy - 20;
            if (kind === "stop") signs.push({ x: markX, y: markY, kind: "stop" });
            if (kind === "light") {
                signs.push({ x: markX, y: markY, kind: "ns" });
                signs.push({ x: ix + span + 8, y: iy + span / 2, kind: "ew" });
            }
        }
    }

    const lanes: Lane[] = [];
    // Vertical roads. West lane runs south, east lane runs north.
    for (const origin of ROADS) {
        lanes.push(verticalLane(origin, 1, 1, crossings));
        lanes.push(verticalLane(origin, 3, -1, crossings));
    }
    // Horizontal roads. North lane runs west, south lane runs east.
    for (const origin of ROADS) {
        lanes.push(horizontalLane(origin, 1, -1, crossings));
        lanes.push(horizontalLane(origin, 3, 1, crossings));
    }
    return { lanes, crosswalks, signs };
}

function verticalLane(origin: number, laneTile: number, dir: 1 | -1, crossings: Array<{ vx: number; hy: number; north: number; south: number; kind: Control | "open" }>): Lane {
    const fixed = (origin + laneTile) * TILE;
    const gates: Gate[] = [];
    for (const cross of crossings) {
        if (cross.vx !== origin) continue;
        const iy = cross.hy * TILE;
        const span = TILE * 4;
        if (dir > 0) {
            gates.push({ line: iy - TILE - 18, kind: cross.kind === "open" ? "yield" : cross.kind, flow: "ns", crossId: cross.north });
            gates.push({ line: iy + span - 18, kind: "yield", flow: "ns", crossId: cross.south });
        } else {
            gates.push({ line: iy + span + TILE + 18, kind: cross.kind === "open" ? "yield" : cross.kind, flow: "ns", crossId: cross.south });
            gates.push({ line: iy + 18, kind: "yield", flow: "ns", crossId: cross.north });
        }
    }
    return { axis: "y", dir, fixed, min: 0, max: WORLD, gates };
}

function horizontalLane(origin: number, laneTile: number, dir: 1 | -1, crossings: Array<{ vx: number; hy: number; west: number; east: number; kind: Control | "open" }>): Lane {
    const fixed = (origin + laneTile) * TILE;
    const gates: Gate[] = [];
    for (const cross of crossings) {
        if (cross.hy !== origin) continue;
        const ix = cross.vx * TILE;
        const span = TILE * 4;
        if (dir > 0) {
            gates.push({ line: ix - TILE - 18, kind: cross.kind === "open" ? "yield" : cross.kind, flow: "ew", crossId: cross.west });
            gates.push({ line: ix + span - 18, kind: "yield", flow: "ew", crossId: cross.east });
        } else {
            gates.push({ line: ix + span + TILE + 18, kind: cross.kind === "open" ? "yield" : cross.kind, flow: "ew", crossId: cross.east });
            gates.push({ line: ix + 18, kind: "yield", flow: "ew", crossId: cross.west });
        }
    }
    return { axis: "x", dir, fixed, min: 0, max: WORLD, gates };
}
