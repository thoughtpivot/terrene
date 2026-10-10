/**
 * Oka World layout, in scene units. The screen is 960x540 and the camera
 * only scrolls sideways, so every y here is a screen height.
 *
 * Lantern Hollow -> Shimmer Pool -> Crystal Wall -> Shimmer Lake ->
 * Stone Terrace -> Hanging Chasm -> Moss Gardens -> Heartstone Sanctum
 */

export type PieceName = "slab" | "floatS" | "floatM" | "floatL" | "isle";
export type FixtureName =
    | "BonsaiTree" | "Boulders" | "MossyBoulder" | "Stalagmite"
    | "Kelp" | "Fern" | "GrassTuft" | "MossDrip" | "GlowShrooms";

export interface Piece {
    name: PieceName;
    /** left edge */
    x: number;
    /** height of the walkable top (before rotation) */
    top: number;
    /** radians, used to tilt a slab into a ramp */
    angle?: number;
    flip?: boolean;
}

export interface FixturePlacement {
    name: FixtureName;
    x: number;
    y: number;
    /** draw in front of the hero */
    front?: boolean;
    flip?: boolean;
    scale?: number;
}

export interface Pool {
    x0: number;
    x1: number;
    surface: number;
    floor: number;
}

export const LEVEL = {
    width: 7400,
    start: { x: 120, y: 430 },

    /** solid ground runs: [left, right, top] */
    ground: [
        [0, 900, 430],
        [1230, 2060, 430],
        [3640, 4480, 400],
        [5300, 6100, 430],
        [6380, 7400, 430],
    ] as [number, number, number][],

    pools: [
        { x0: 900, x1: 1230, surface: 452, floor: 540 },
        { x0: 2060, x1: 3640, surface: 458, floor: 540 },
        { x0: 6100, x1: 6380, surface: 452, floor: 540 },
    ] as Pool[],

    /** tall crystal walls standing on the ground: [left, top] */
    walls: [
        [1680, 282],
        [6700, 300],
    ] as [number, number][],

    pieces: [
        { name: "floatM", x: 560, top: 330 },
        { name: "floatS", x: 1010, top: 355 },
        { name: "floatS", x: 1520, top: 352 },
        { name: "isle", x: 2150, top: 350 },
        { name: "floatM", x: 2560, top: 320 },
        { name: "slab", x: 2800, top: 360 },
        { name: "floatS", x: 3280, top: 320 },
        { name: "floatL", x: 3440, top: 372, flip: true },
        { name: "slab", x: 4415, top: 342, angle: -0.3 },
        { name: "floatL", x: 4880, top: 300 },
        { name: "floatS", x: 5150, top: 350, flip: true },
        { name: "floatM", x: 5650, top: 320, flip: true },
        { name: "floatS", x: 6185, top: 360 },
        { name: "floatM", x: 6530, top: 362 },
    ] as Piece[],

    fixtures: [
        { name: "BonsaiTree", x: 170, y: 434 },
        { name: "Fern", x: 330, y: 432 },
        { name: "GrassTuft", x: 440, y: 436, front: true },
        { name: "Boulders", x: 770, y: 434 },
        { name: "Stalagmite", x: 862, y: 434, scale: 0.9 },
        { name: "Kelp", x: 960, y: 548 },
        { name: "Kelp", x: 1110, y: 548, flip: true },
        { name: "Kelp", x: 1180, y: 548, scale: 0.8 },
        { name: "MossyBoulder", x: 1330, y: 434 },
        { name: "Fern", x: 1450, y: 432, flip: true },
        { name: "GrassTuft", x: 1610, y: 436, front: true },
        { name: "Stalagmite", x: 1880, y: 434 },
        { name: "GrassTuft", x: 2010, y: 436, front: true, flip: true },
        { name: "Kelp", x: 2110, y: 548 },
        { name: "Boulders", x: 2540, y: 552, scale: 0.9 },
        { name: "Kelp", x: 2620, y: 548, flip: true },
        { name: "Kelp", x: 2985, y: 548 },
        { name: "MossDrip", x: 3000, y: 392 },
        { name: "Kelp", x: 3330, y: 548, scale: 1.15 },
        { name: "MossyBoulder", x: 3190, y: 556, scale: 0.8 },
        { name: "Kelp", x: 3590, y: 548, flip: true },
        { name: "GrassTuft", x: 3760, y: 406, front: true },
        { name: "Fern", x: 3920, y: 402 },
        { name: "BonsaiTree", x: 4160, y: 404, flip: true },
        { name: "Boulders", x: 4400, y: 404, scale: 0.85 },
        { name: "MossDrip", x: 4985, y: 352 },
        { name: "GrassTuft", x: 5470, y: 436, front: true },
        { name: "BonsaiTree", x: 5560, y: 434 },
        { name: "Stalagmite", x: 5900, y: 434 },
        { name: "Fern", x: 6040, y: 432 },
        { name: "Kelp", x: 6160, y: 548 },
        { name: "Kelp", x: 6330, y: 548, flip: true, scale: 0.85 },
        { name: "Fern", x: 6450, y: 432 },
        { name: "GrassTuft", x: 6880, y: 436, front: true },
        { name: "BonsaiTree", x: 6960, y: 434 },
        { name: "GlowShrooms", x: 7055, y: 432 },
        { name: "GlowShrooms", x: 7245, y: 432, flip: true },
        { name: "BonsaiTree", x: 7330, y: 434, flip: true },
    ] as FixturePlacement[],

    /** glowing mushroom checkpoints */
    checkpoints: [
        [1290, 432],
        [3705, 402],
        [5370, 432],
        [6440, 432],
    ] as [number, number][],

    crystals: [
        [300, 382], [345, 368], [390, 382], [610, 296], [670, 296], [800, 390],
        [1065, 322], [985, 508], [1150, 508],
        [1300, 390], [1360, 390], [1575, 318], [1705, 248], [1755, 248], [1900, 390], [1960, 390],
        [2240, 316], [2320, 316], [2640, 286], [2760, 300], [2880, 326], [2960, 326], [3040, 326], [3120, 326],
        [3335, 286], [3500, 338], [3580, 338], [2700, 505], [3200, 505], [2440, 505], [3420, 505],
        [3780, 360], [3840, 360], [4300, 360],
        [4560, 316], [4680, 280], [4790, 246], [4940, 266], [5030, 266], [5205, 316],
        [5420, 390], [5700, 286], [5960, 390], [6020, 390],
        [6240, 326], [6300, 505],
        [6600, 328], [6735, 266], [6900, 390], [7000, 390],
    ] as [number, number][],

    hearts: [
        [2410, 318],
        [5770, 286],
    ] as [number, number][],

    mossbacks: [
        [600, 480, 860],
        [1950, 1830, 2040],
        [4000, 3800, 4300],
        [5560, 5450, 5700],
        [5990, 5900, 6080],
    ] as [number, number, number][],

    /** [homeX, homeY, radiusX, radiusY] */
    glimmerflies: [
        [2650, 228, 90, 30],
        [3000, 268, 150, 36],
        [3370, 226, 60, 40],
        [4840, 186, 50, 20],
        [5160, 252, 46, 46],
    ] as [number, number, number, number][],

    /** pool index for each gloomfin */
    gloomfins: [0, 1, 1, 2],

    heartstone: { x: 7150, y: 434 },
};
