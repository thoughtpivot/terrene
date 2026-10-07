/**
 * World 1-2, a single-path crypt.
 * One screen of quiet, then one creature at a time, then the gate.
 * Corridor length and ceiling height change the pace. Room shapes are not one repeated rectangle.
 */

const COLS = 120;
const ROWS = 15;

export const GROUND_ROW = 13;
export const LEVEL_COLS = COLS;
export const GATE_COL = 110;

export interface Marker {
    col: number;
    row: number;
    kind: "marrow" | "wick" | "gloam";
}

export interface Decor {
    name: "skull" | "bones" | "chain" | "torch";
    col: number;
    row: number;
}

const KIND: Record<string, Marker["kind"]> = {
    M: "marrow",
    W: "wick",
    G: "gloam",
};

function empty(): string[][] {
    return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => "-"));
}

function fill(grid: string[][], c0: number, c1: number, r0: number, r1: number, ch: string): void {
    for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) grid[row][col] = ch;
    }
}

function solid(ch: string): boolean {
    return ch === "#" || ch === "*";
}

function buildGrid(): string[][] {
    const grid = empty();
    fill(grid, 0, COLS - 1, 0, 1, "#");
    fill(grid, 0, 1, 2, 12, "#");
    fill(grid, 16, 21, 2, 8, "#");
    fill(grid, 46, 64, 2, 5, "*");
    fill(grid, 104, COLS - 1, 2, 3, "#");
    fill(grid, 116, COLS - 1, 4, 12, "#");
    fill(grid, 0, COLS - 1, 13, 14, "#");
    fill(grid, 46, 64, 13, 14, "*");
    fill(grid, 38, 43, 13, 14, "*");
    fill(grid, 80, 83, 13, 14, "*");
    fill(grid, 94, 97, 13, 14, "*");
    fill(grid, 40, 41, 13, 14, "-");
    fill(grid, 82, 83, 13, 14, "-");
    fill(grid, 94, 95, 13, 14, "-");
    grid[9][8] = "Q";
    grid[9][68] = "Q";
    grid[9][71] = "Q";
    grid[9][108] = "Q";
    grid[12][28] = "M";
    grid[6][55] = "W";
    grid[5][87] = "G";
    return grid;
}

const GRID = buildGrid();

export const LEVEL_ROWS: readonly string[] = GRID.map((row) => row.join(""));

export const MARKERS: readonly Marker[] = (() => {
    const found: Marker[] = [];
    LEVEL_ROWS.forEach((line, row) => {
        for (let col = 0; col < line.length; col++) {
            const kind = KIND[line[col]];
            if (kind) found.push({ col, row, kind });
        }
    });
    return found;
})();

export const LEASH: Record<"marrow" | "gloam", { minCol: number; maxCol: number }> = {
    marrow: { minCol: 24, maxCol: 36 },
    gloam: { minCol: 85, maxCol: 91 },
};

export const TORCHES: readonly Decor[] = [
    { name: "torch", col: 5, row: 10 },
    { name: "torch", col: 13, row: 10 },
    { name: "torch", col: 18, row: 10 },
    { name: "torch", col: 26, row: 10 },
    { name: "torch", col: 35, row: 10 },
    { name: "torch", col: 44, row: 10 },
    { name: "torch", col: 66, row: 10 },
    { name: "torch", col: 73, row: 10 },
    { name: "torch", col: 79, row: 10 },
    { name: "torch", col: 84, row: 10 },
    { name: "torch", col: 90, row: 10 },
    { name: "torch", col: 97, row: 10 },
    { name: "torch", col: 108, row: 7 },
    { name: "torch", col: 113, row: 7 },
];

export const PROPS: readonly Decor[] = [
    { name: "skull", col: 9, row: 12 },
    { name: "chain", col: 30, row: 2 },
    { name: "bones", col: 37, row: 12 },
    { name: "skull", col: 48, row: 12 },
    { name: "chain", col: 50, row: 6 },
    { name: "bones", col: 72, row: 12 },
    { name: "skull", col: 106, row: 12 },
    { name: "chain", col: 109, row: 4 },
];

export const COIN_BLOCKS: readonly { col: number; row: number }[] = (() => {
    const found: { col: number; row: number }[] = [];
    LEVEL_ROWS.forEach((line, row) => {
        for (let col = 0; col < line.length; col++) {
            if (line[col] === "Q") found.push({ col, row });
        }
    });
    return found;
})();

function openAt(col: number, row: number): boolean {
    if (row < 0 || col < 0 || row >= ROWS || col >= COLS) return false;
    return !solid(GRID[row][col]);
}

function assertLevel(): void {
    if (LEVEL_ROWS.length !== ROWS) throw new Error("World 1-2 row count");
    if (LEVEL_ROWS.some((row) => row.length !== COLS)) throw new Error("World 1-2 ragged row");
    const counts = { marrow: 0, wick: 0, gloam: 0 };
    for (const marker of MARKERS) {
        counts[marker.kind] += 1;
        if (!openAt(marker.col, marker.row)) throw new Error(`Spawn inside stone: ${marker.kind}`);
    }
    if (counts.marrow !== 1 || counts.wick !== 1 || counts.gloam !== 1) {
        throw new Error("World 1-2 needs one Marrow, one Wick, and one Gloam");
    }
    for (const torch of TORCHES) {
        if (!openAt(torch.col, torch.row) || !openAt(torch.col, torch.row - 1)) {
            throw new Error(`Torch inside stone at ${torch.col},${torch.row}`);
        }
    }
    for (const prop of PROPS) {
        if (!openAt(prop.col, prop.row)) throw new Error(`Prop inside stone: ${prop.name}`);
    }
    for (const coin of COIN_BLOCKS) {
        if (!openAt(coin.col, coin.row)) throw new Error(`Coin block inside stone at ${coin.col}`);
    }
}

assertLevel();
