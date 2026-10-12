import type { OkaLevel } from "../level";

/**
 * Oka World 2 layout, in scene units (960x540 screen, camera scrolls sideways).
 *
 * Lantern's End -> Drowned Steps -> Bone Wall -> Hanging Dark ->
 * Weeping Gallery -> Black Lake -> The Long Fall -> Lantern Road -> Soul Shrine
 *
 * Gaps between floating rocks stay at the 90-110 units Oka World uses, so
 * every jump is the same jump; what changes is how much waits around it.
 */
export const LEVEL_TWO: OkaLevel = {
    width: 8200,
    start: { x: 120, y: 430 },

    ground: [
        [0, 840, 430],
        [1260, 2080, 430],
        [2910, 3560, 420],
        [4720, 5460, 400],
        [6280, 7000, 430],
        [7280, 8200, 430],
    ],

    pools: [
        { x0: 840, x1: 1260, surface: 452, floor: 540 },
        { x0: 3560, x1: 4720, surface: 450, floor: 540 },
        { x0: 7000, x1: 7280, surface: 452, floor: 540 },
    ],

    walls: [
        [1740, 290],
        [7600, 300],
    ],

    pieces: [
        { name: "floatM", x: 480, top: 330 },
        // Drowned Steps
        { name: "floatS", x: 900, top: 352 },
        { name: "floatS", x: 1090, top: 340, flip: true },
        // Bone Wall
        { name: "floatS", x: 1600, top: 356 },
        // Hanging Dark
        { name: "floatM", x: 2180, top: 385 },
        { name: "floatS", x: 2440, top: 345 },
        { name: "floatM", x: 2650, top: 365, flip: true },
        // Black Lake
        { name: "isle", x: 3660, top: 352 },
        { name: "floatM", x: 4080, top: 322 },
        { name: "floatS", x: 4340, top: 338, flip: true },
        { name: "floatL", x: 4540, top: 372, flip: true },
        // The Long Fall
        { name: "slab", x: 5395, top: 342, angle: -0.3 },
        { name: "floatL", x: 5860, top: 300 },
        { name: "floatS", x: 6130, top: 350, flip: true },
        // Lantern Road
        { name: "floatS", x: 7085, top: 360 },
        { name: "floatM", x: 7430, top: 362 },
    ],

    fixtures: [
        { name: "DeadTree", x: 230, y: 436 },
        { name: "PaleShrooms", x: 400, y: 432 },
        { name: "GrassTuft", x: 610, y: 436, front: true },
        { name: "Boulders", x: 740, y: 434 },
        { name: "Stalagmite", x: 815, y: 434, scale: 0.9 },
        { name: "Kelp", x: 930, y: 548 },
        { name: "Kelp", x: 1160, y: 548, flip: true, scale: 0.9 },
        { name: "MossyBoulder", x: 1450, y: 434 },
        { name: "PaleShrooms", x: 1560, y: 432, flip: true },
        { name: "Stalagmite", x: 1900, y: 434 },
        { name: "Fern", x: 2040, y: 432 },
        { name: "MossDrip", x: 2730, y: 396 },
        { name: "PaleShrooms", x: 3120, y: 422 },
        { name: "DeadTree", x: 3330, y: 426, flip: true, scale: 0.85 },
        { name: "GrassTuft", x: 3480, y: 426, front: true },
        { name: "Kelp", x: 3620, y: 548 },
        { name: "Boulders", x: 4030, y: 552, scale: 0.9 },
        { name: "Kelp", x: 4260, y: 548, flip: true, scale: 1.15 },
        { name: "MossyBoulder", x: 4480, y: 556, scale: 0.8 },
        { name: "MossDrip", x: 4645, y: 404 },
        { name: "PaleShrooms", x: 4880, y: 402 },
        { name: "Fern", x: 5180, y: 402, flip: true },
        { name: "Boulders", x: 5320, y: 404, scale: 0.8 },
        { name: "MossDrip", x: 5965, y: 332 },
        { name: "DeadTree", x: 6520, y: 436 },
        { name: "GrassTuft", x: 6760, y: 436, front: true },
        { name: "Stalagmite", x: 6960, y: 434 },
        { name: "Kelp", x: 7060, y: 548 },
        { name: "Kelp", x: 7230, y: 548, flip: true, scale: 0.85 },
        { name: "PaleShrooms", x: 7360, y: 432 },
        { name: "PaleShrooms", x: 7880, y: 432, flip: true },
        { name: "DeadTree", x: 8110, y: 436, flip: true },
    ],

    /** hanging-lantern checkpoints */
    checkpoints: [
        [1320, 432],
        [2980, 422],
        [4790, 402],
        [6340, 432],
        [7340, 432],
    ],

    crystals: [
        [300, 390], [345, 378], [390, 390], [530, 296], [590, 296], [700, 390],
        [955, 318], [1145, 306], [1050, 505],
        [1400, 390], [1450, 390], [1655, 320], [1790, 252], [1830, 252], [1950, 390], [2020, 390],
        [2260, 346], [2495, 306], [2730, 326], [2860, 330],
        [3030, 380], [3090, 380], [3420, 380], [3500, 380],
        [3760, 316], [3880, 316], [4200, 286], [4395, 300], [4640, 336], [3800, 505], [4300, 505],
        [4900, 360], [4960, 360], [5300, 360], [5560, 316], [5680, 280], [5790, 246], [5960, 266], [6040, 266], [6185, 316],
        [6420, 390], [6700, 390], [6900, 390], [7140, 326], [7160, 505], [7510, 328], [7650, 266], [7800, 390], [7860, 390],
    ],

    hearts: [
        [4120, 288],
        [6470, 392],
    ],

    mossbacks: [
        [560, 380, 820],
        [1500, 1380, 1590],
        [2000, 1900, 2070],
        [3200, 3060, 3330],
        [3450, 3360, 3540],
        [5050, 4900, 5250],
        [6560, 6420, 6700],
        [6850, 6740, 6980],
    ],

    glimmerflies: [
        [2390, 255, 60, 34],
        [2740, 270, 70, 40],
        [2600, 180, 120, 26],
        [4290, 232, 80, 30],
        [5920, 190, 50, 22],
        [6080, 150, 90, 24],
        [6400, 150, 60, 18],
    ],

    gloomfins: [0, 1, 1, 2],

    heartstone: { x: 7990, y: 434 },
};
