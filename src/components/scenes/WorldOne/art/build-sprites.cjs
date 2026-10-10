/**
 * Original pixel art for Terrene's World 1-1 platformer.
 * Nothing here is traced from Nintendo sprites or from the project's older art.
 * Run: node src/components/scenes/WorldOne/art/build-sprites.mjs
 */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const PAL = {
    K: "1a120c",
    W: "fff8f2",
    P: "ffd0a4",
    p: "e09468",
    C: "ef4a32",
    c: "b42818",
    L: "3cb03a",
    l: "9aee58",
    T: "14887e",
    t: "0c524c",
    H: "ffe6bc",
    h: "e4c494",
    S: "5a3016",
    s: "a86a38",
    G: "3e9e1c",
    g: "8ee044",
    d: "20680e",
    D: "c85e2a",
    E: "a4461c",
    e: "6c2c10",
    R: "e48448",
    r: "f8bc80",
    m: "8c3818",
    Q: "f2c428",
    q: "d08810",
    Y: "fff09a",
    U: "d4a474",
    u: "a07848",
    I: "2eae32",
    i: "b6f25e",
    j: "087410",
    N: "eaffc4",
    F: "e4342c",
    f: "ffd0c8",
    Z: "f6f4c4",
    z: "b4b07c",
    M: "d4d4dc",
    n: "9a9aa4",
    B: "5c5c66",
    O: "ffd028",
    o: "e89410",
    b: "c47a3a",
    x: "f0c48a",
    y: "6a3a16",
    V: "ffffff",
    v: "c5d4f4",
    w: "1c100c",
    J: "6ccc38",
    k: "2f7a16",
    A: "2a44b8",
    a: "7aa0f8",
    X: "101018",
    // Critter accents. Digits and symbols so a typo cannot reuse Pip's letters by accident.
    "0": "5b3cc4",
    "1": "c9b6ff",
    "2": "178f86",
    "3": "d7fff6",
    "4": "e4376a",
    "5": "f7b7c8",
    "6": "3a4a68",
    "7": "d5dced",
    "8": "e97a2e",
    "9": "6b3414",
    "+": "f4e7cf",
    "#": "d4a017",
    $: "3e4a54",
    "%": "c5d0d8",
    "^": "e15a34",
    "&": "6a2c28",
    "*": "c4844a",
    "(": "f6e6cf",
    ")": "3c9a34",
    "=": "f2c84a",
    // World 1-2 crypt. Kept off Pip's letters so a typo cannot repaint the hero.
    "~": "1a1722",
    "{": "3c3648",
    "}": "a89fbe",
    "[": "241f2e",
    "]": "3c6e46",
    "!": "ffe27a",
    "@": "fff8dc",
    "/": "ff5c2a",
    ";": "f3e7d4",
    ":": "b9a78c",
    "|": "8b93a0",
    _: "e4e8ef",
    "'": "2a1c30",
    ",": "8a74c4",
    "<": "9ec0ee",
    ">": "24344e",
    "?": "15263c",
    // Distant ridges. Kept off the critter alphabet so a typo cannot repaint a creature.
    "`": "9cbaec",
    "\\": "6f97cf",
    '"': "eef5ff",
};

const SHEET_W = 336;
const SHEET_H = 960;
const sheet = new PNG({ width: SHEET_W, height: SHEET_H, fill: true });
const frames = {};

function hex(h) {
    return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
        255,
    ];
}

function put(x, y, color) {
    if (x < 0 || y < 0 || x >= SHEET_W || y >= SHEET_H || !color) return;
    const i = (y * SHEET_W + x) * 4;
    const [r, g, b, a] = hex(color);
    sheet.data[i] = r;
    sheet.data[i + 1] = g;
    sheet.data[i + 2] = b;
    sheet.data[i + 3] = a;
}

function blit(ox, oy, rows) {
    for (let y = 0; y < rows.length; y++) {
        const row = rows[y];
        for (let x = 0; x < row.length; x++) {
            const ch = row[x];
            if (ch === "." || ch === " ") continue;
            if (!PAL[ch]) throw new Error(`Unknown palette character '${ch}'`);
            put(ox + x, oy + y, PAL[ch]);
        }
    }
}

let cursorX = 0;
let cursorY = 0;
let rowH = 0;

function place(name, rows) {
    const h = rows.length;
    const w = rows[0].length;
    if (rows.some((row) => row.length !== w)) throw new Error(`Ragged sprite ${name}`);
    if (cursorX + w > SHEET_W) {
        cursorX = 0;
        cursorY += rowH + 2;
        rowH = 0;
    }
    blit(cursorX, cursorY, rows);
    frames[name] = { x: cursorX, y: cursorY, w, h };
    cursorX += w + 2;
    rowH = Math.max(rowH, h);
    return frames[name];
}

function blank(w, h, ch = ".") {
    return Array.from({ length: h }, () => ch.repeat(w));
}

function stamp(grid, x, y, ch) {
    if (y < 0 || x < 0 || y >= grid.length) return;
    const row = grid[y];
    if (Array.isArray(row)) {
        if (x < 0 || x >= row.length) return;
        row[x] = ch;
        return;
    }
    if (x < 0 || x >= row.length) return;
    grid[y] = row.slice(0, x) + ch + row.slice(x + 1);
}

function fillRect(grid, x, y, w, h, ch) {
    for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) stamp(grid, xx, yy, ch);
    }
}

function outline(rows) {
    const h = rows.length;
    const w = rows[0].length;
    const src = rows.map((r) => r.split(""));
    const out = src.map((r) => r.slice());
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (src[y][x] !== ".") continue;
            let edge = false;
            for (const [dx, dy] of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ]) {
                const nx = x + dx;
                const ny = y + dy;
                if (ny < 0 || nx < 0 || ny >= h || nx >= w) continue;
                if (src[ny][nx] !== ".") edge = true;
            }
            if (edge) out[y][x] = "K";
        }
    }
    return out.map((r) => r.join(""));
}

/**
 * Layered peaks. `peaks` are measured from the bottom of the sprite.
 * Left of each summit is the lit face so the range reads as volume, not a blob.
 */
function ridge(w, h, peaks, colors) {
    const grid = blank(w, h).map((row) => row.split(""));
    const heightAt = (x) => {
        let best = 0;
        let owner = peaks[0];
        for (const peak of peaks) {
            const dx = Math.abs(x - peak.cx) / peak.half;
            if (dx >= 1) continue;
            const rise = peak.h * Math.pow(1 - dx, 1.45);
            if (rise > best) {
                best = rise;
                owner = peak;
            }
        }
        return { best, owner };
    };
    for (let x = 0; x < w; x++) {
        const { best, owner } = heightAt(x);
        if (best < 1) continue;
        const top = h - Math.round(best);
        for (let y = Math.max(0, top); y < h; y++) {
            const down = y - top;
            const snowLine = Math.max(2, Math.round(best * 0.16));
            if (down < snowLine && best > h * 0.5) grid[y][x] = colors.snow;
            else grid[y][x] = x <= owner.cx ? colors.lit : colors.mid;
        }
    }
    return grid.map((row) => row.join(""));
}

function hill(w, h) {
    const grid = blank(w, h).map((r) => r.split(""));
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const nx = (x - (w - 1) / 2) / ((w - 1) / 2);
            const ny = (y - (h - 1)) / (h - 1);
            if (nx * nx + ny * ny > 1) continue;
            const light = x < w * 0.42;
            const dot = (x * 5 + y * 9) % 17 === 0;
            grid[y][x] = dot ? "d" : light ? "g" : y < h * 0.45 ? "J" : "G";
        }
    }
    // A couple of shrub bumps along the base.
    for (const cx of [Math.floor(w * 0.28), Math.floor(w * 0.62)]) {
        for (let y = h - 10; y < h; y++) {
            for (let x = cx - 6; x < cx + 6; x++) {
                const dx = (x - cx) / 6;
                const dy = (y - (h - 2)) / 8;
                if (dx * dx + dy * dy <= 1 && grid[y] && grid[y][x] === ".") {
                    grid[y][x] = "J";
                }
            }
        }
    }
    return outline(grid.map((r) => r.join("")));
}

function cloud(w, h) {
    const grid = blank(w, h).map((r) => r.split(""));
    const puffs = [
        [w * 0.28, h * 0.62, w * 0.28],
        [w * 0.52, h * 0.4, w * 0.3],
        [w * 0.74, h * 0.6, w * 0.24],
    ];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let inside = false;
            for (const [cx, cy, rx] of puffs) {
                const dx = (x - cx) / rx;
                const dy = (y - cy) / (h * 0.42);
                if (dx * dx + dy * dy <= 1) inside = true;
            }
            if (!inside) continue;
            grid[y][x] = y < h * 0.48 ? "V" : "v";
        }
    }
    return outline(grid.map((r) => r.join("")));
}

function bush(w, h) {
    const grid = blank(w, h).map((r) => r.split(""));
    const count = w > 36 ? 3 : 2;
    for (let i = 0; i < count; i++) {
        const cx = (w * (i + 0.5)) / count;
        const rx = w / (count + 0.4);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const dx = (x - cx) / rx;
                const dy = (y - (h - 2)) / (h * 0.95);
                if (dx * dx + dy * dy <= 1) {
                    const light = x < cx;
                    grid[y][x] = (x + y) % 7 === 0 ? "l" : light ? "g" : "G";
                }
            }
        }
    }
    return outline(grid.map((r) => r.join("")));
}

function castle() {
    const w = 80;
    const h = 80;
    const grid = blank(w, h).map((r) => r.split(""));
    fillRect(grid, 10, 22, 60, 56, "M");
    // Towers
    fillRect(grid, 4, 30, 14, 48, "M");
    fillRect(grid, 62, 30, 14, 48, "M");
    // Battlements
    for (const bx of [4, 12, 22, 30, 38, 46, 54, 62, 70]) {
        fillRect(grid, bx, 16, 6, 8, "n");
        fillRect(grid, bx, 16, 6, 2, "W");
    }
    fillRect(grid, 4, 28, 72, 3, "n");
    // Door
    fillRect(grid, 34, 46, 12, 32, "X");
    for (let y = 46; y < 58; y++) {
        const inset = Math.floor((58 - y) / 4);
        for (let x = 34; x < 46; x++) {
            if (x < 34 + inset || x >= 46 - inset) grid[y][x] = "M";
        }
    }
    // Door arch shadow
    fillRect(grid, 36, 60, 8, 18, "B");
    // Windows
    for (const wx of [18, 56]) {
        fillRect(grid, wx, 38, 8, 12, "X");
        fillRect(grid, wx + 3, 38, 2, 12, "a");
        fillRect(grid, wx, 43, 8, 2, "n");
    }
    // Stone speckles
    for (let y = 24; y < 76; y++) {
        for (let x = 6; x < 74; x++) {
            if (grid[y][x] === "M" && (x * 13 + y * 7) % 19 === 0) grid[y][x] = "n";
            if (grid[y][x] === "M" && (x * 3 + y * 11) % 29 === 0) grid[y][x] = "W";
        }
    }
    // Base step
    fillRect(grid, 0, 74, 80, 4, "n");
    fillRect(grid, 0, 74, 80, 1, "W");
    return outline(grid.map((r) => r.join("")));
}

// --- Terrain (full-bleed 16x16, no padding) ---
place("ground", [
    "gggggggggggggggg",
    "gGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGG",
    "dGdddddddddddddd",
    "DeEeDeEeDeEeDeEe",
    "EDeDEDeDEDeDEDeD",
    "eEDDeEDDeEDDeEDD",
    "DEeEDEeEDEeEDEeE",
    "EeDEeDEeDEeDEeDE",
    "DEDeDEDeDEDeDEDe",
    "eEeDeEeDeEeDeEeD",
    "DDEEDDEEDDEEDDEE",
    "EeDEeDEeDEeDEeDE",
    "eEDDeEDDeEDDeEDD",
    "DEeEDEeEDEeEDEeE",
    "EeDEeDEeDEeDEeDE",
]);

place("dirt", [
    "DeEeDeEeDeEeDeEe",
    "EDeDEDeDEDeDEDeD",
    "eEDDeEDDeEDDeEDD",
    "DEeEDEeEDEeEDEeE",
    "EeDEeDEeDEeDEeDE",
    "DEDeDEDeDEDeDEDe",
    "eEeDeEeDeEeDeEeD",
    "DDEEDDEEDDEEDDEE",
    "EeDEeDEeDEeDEeDE",
    "eEDDeEDDeEDDeEDD",
    "DEeEDEeEDEeEDEeE",
    "EeDEeDEeDEeDEeDE",
    "DEDeDEDeDEDeDEDe",
    "eEeDeEeDeEeDeEeD",
    "DDEEDDEEDDEEDDEE",
    "EeDEeDEeDEeDEeDE",
]);

place("brick", [
    "rrrrrrrmrrrrrrrr",
    "RRRRRRRmRRRRRRRR",
    "RRRRRRRmRRRRRRRR",
    "RRRRRRRmRRRRRRRR",
    "mmmmmmmmmmmmmmmm",
    "rrrrrmrrrrrrrmrr",
    "RRRRmRRRRRRRmRRR",
    "RRRRmRRRRRRRmRRR",
    "RRRRmRRRRRRRmRRR",
    "mmmmmmmmmmmmmmmm",
    "rmrrrrrrrmrrrrrr",
    "RmRRRRRRRmRRRRRR",
    "RmRRRRRRRmRRRRRR",
    "RmRRRRRRRmRRRRRR",
    "mmmmmmmmmmmmmmmm",
    "rrrrrrrrrrrrrrrr",
]);

place("brick-blue", [
    "aaaaaaAaAAAAAAAA",
    "AAAAAAAaAAAAAAAA",
    "AAAAAAAaAAAAAAAA",
    "AAAAAAAaAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "aaaAaaaaaaaAaaaa",
    "AAAAaaaaaaaAaaaa",
    "AAAAaaaaaaaAaaaa",
    "AAAAaaaaaaaAaaaa",
    "AAAAAAAAAAAAAAAA",
    "aAaaaaaaaAaaaaaa",
    "AAaaaaaaaAaaaaaa",
    "AAaaaaaaaAaaaaaa",
    "AAaaaaaaaAaaaaaa",
    "AAAAAAAAAAAAAAAA",
    "aaaaaaaaaaaaaaaa",
].map((row) => row.replace(/A/g, "A").replace(/a/g, "a")));

// Fix blue brick to use K mortar via a cleaner hand paint
frames["brick-blue"] = frames["brick-blue"];
// Overwrite blue brick with a proper mortar pattern
(function paintBlue() {
    const f = frames["brick-blue"];
    const rows = [
        "aaaaaaaKaaaaaaaa",
        "AAAAAAAKAAAAAAAA",
        "AAAAAAAKAAAAAAAA",
        "AAAAAAAKAAAAAAAA",
        "KKKKKKKKKKKKKKKK",
        "aaaKaaaaaaaKaaaa",
        "AAAKAAAAAAAKAAAA",
        "AAAKAAAAAAAKAAAA",
        "AAAKAAAAAAAKAAAA",
        "KKKKKKKKKKKKKKKK",
        "aKaaaaaaaKaaaaaa",
        "AKAAAAAAAKAAAAAA",
        "AKAAAAAAAKAAAAAA",
        "AKAAAAAAAKAAAAAA",
        "KKKKKKKKKKKKKKKK",
        "aaaaaaaaaaaaaaaa",
    ];
    blit(f.x, f.y, rows);
})();

function question(shift) {
    const rows = blank(16, 16).map((r) => r.split(""));
    fillRect(rows, 0, 0, 16, 16, "Q");
    fillRect(rows, 1, 1, 14, 2, "Y");
    fillRect(rows, 1, 13, 14, 2, "q");
    fillRect(rows, 0, 0, 16, 1, "K");
    fillRect(rows, 0, 15, 16, 1, "K");
    fillRect(rows, 0, 0, 1, 16, "K");
    fillRect(rows, 15, 0, 1, 16, "K");
    // Question mark
    const mark = [
        "            ",
        "            ",
        "   KKKKK    ",
        "  KK   KK   ",
        "      KK    ",
        "     KK     ",
        "     KK     ",
        "            ",
        "     KK     ",
        "     KK     ",
        "            ",
        "            ",
        "            ",
        "            ",
        "            ",
        "            ",
    ];
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            if (mark[y][x] === "K") rows[y][x] = "K";
        }
    }
    // Moving shine
    const spots = [
        [3, 3],
        [11, 4],
        [5, 11],
    ];
    const [sx, sy] = spots[shift % spots.length];
    if (rows[sy][sx] === "Q" || rows[sy][sx] === "Y") rows[sy][sx] = "W";
    return rows.map((r) => r.join(""));
}
place("question-0", question(0));
place("question-1", question(1));
place("question-2", question(2));

place("used", [
    "uuuuuuuuuuuuuuuu",
    "uUUUUUUUUUUUUUUu",
    "uUuuUUUUUUUUuuUu",
    "uUUUUUUUUUUUUUUu",
    "uUUUUUuuUUUUUUUu",
    "uUUUUUUUUUUUUUUu",
    "uUuUUUUUUUUUuUUu",
    "uUUUUUUUUUUUUUUu",
    "uUUUUUUUuUUUUUUu",
    "uUUUUUUUUUUUUUUu",
    "uUUUuUUUUUUUuUUu",
    "uUUUUUUUUUUUUUUu",
    "uUuuUUUUUUUUuuUu",
    "uUUUUUUUUUUUUUUu",
    "uuuuuuuuuuuuuuuu",
    "KKKKKKKKKKKKKKKK",
]);

place("hard", [
    "rrrrrrrrrrrrrrrr",
    "rYYYYYYYYYYYYYYr",
    "rYRRRRRRRRRRRRYr",
    "rYRRRRRRRRRRRRYr",
    "rYRRRRRmRRRRRRYr",
    "rYRRRRmmRRRRRRYr",
    "rYRRRRRmRRRRRRYr",
    "rYRRRRRRRRRRRRYr",
    "rYRRRRRRRRRRRRYr",
    "rYRRRRRmRRRRRRYr",
    "rYRRRRmmRRRRRRYr",
    "rYRRRRRmRRRRRRYr",
    "rYRRRRRRRRRRRRYr",
    "rqqqqqqqqqqqqqqr",
    "rqqqqqqqqqqqqqqr",
    "KKKKKKKKKKKKKKKK",
]);

function pipeTile(top, left) {
    const rows = blank(16, 16).map((r) => r.split(""));
    fillRect(rows, 0, 0, 16, 16, "I");
    if (left) {
        fillRect(rows, 0, 0, 3, 16, "i");
        fillRect(rows, 3, 0, 1, 16, "N");
    } else {
        fillRect(rows, 13, 0, 3, 16, "j");
        fillRect(rows, 12, 0, 1, 16, "j");
    }
    if (top) {
        fillRect(rows, 0, 0, 16, 3, left ? "i" : "I");
        fillRect(rows, 0, 0, 16, 1, "N");
        fillRect(rows, 0, 3, 16, 2, "j");
        if (left) fillRect(rows, 0, 0, 3, 5, "i");
        else fillRect(rows, 13, 0, 3, 5, "j");
    }
    // Inner shade line
    if (!left) fillRect(rows, 14, top ? 5 : 0, 2, top ? 11 : 16, "j");
    return rows.map((r) => r.join(""));
}
place("pipe-tl", pipeTile(true, true));
place("pipe-tr", pipeTile(true, false));
place("pipe-bl", pipeTile(false, true));
place("pipe-br", pipeTile(false, false));

// --- Pip, the jumper. Leaf on the cap, teal overalls, no mustache. ---
place("pip-idle", [
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "...CCPPPPPPCC...",
    "....HHHHHHHH....",
    "...TTHHHHHTT....",
    "...TTTTTTTTTT...",
    "...TtTTTTTTtT...",
    "....TTTTTTTT....",
    "....TTTTTTTT....",
    ".....sS..Ss.....",
    "....SSS..SSS....",
    "................",
]);

place("pip-walk-0", [
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "...CCPPPPPPCC...",
    "....HHHHHHHH....",
    "...TTHHHHHTT....",
    "...TTTTTTTTTT...",
    "...TtTTTTTTtT...",
    "....TTTTTTTT....",
    "...SSS..........",
    "..SSS..Ss.......",
    ".SSS....SSS.....",
    "................",
]);

place("pip-walk-1", [
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "...CCPPPPPPCC...",
    "....HHHHHHHH....",
    "...TTHHHHHTT....",
    "...TTTTTTTTTT...",
    "...TtTTTTTTtT...",
    "....TTTTTTTT....",
    ".....TTTTTT.....",
    "....sSSSSSs.....",
    "....SSS..SSS....",
    "................",
]);

place("pip-walk-2", [
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "...CCPPPPPPCC...",
    "....HHHHHHHH....",
    "...TTHHHHHTT....",
    "...TTTTTTTTTT...",
    "...TtTTTTTTtT...",
    "....TTTTTTTT....",
    ".........SSS....",
    "......sS..SSS...",
    "....SSS....SSS..",
    "................",
]);

place("pip-jump", [
    "................",
    "....CCCCCC......",
    "...CCCCCCCC.....",
    "...CCClLCCC.....",
    "..CPPPPPPPCC....",
    "..CPwPPwPCCC....",
    "..CPPPPPPPC.....",
    "..HHHHHHHH......",
    ".TTHHHHHTT......",
    ".TTTTTTTTTT.....",
    "..TtTTTTTtT.....",
    "...SS..SS.......",
    "..SSS..SSS......",
    "................",
    "................",
    "................",
]);

place("pip-skid", [
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "...CCPPPPPPCC...",
    "....HHHHHHHH....",
    "...TTHHHHHTT....",
    "...TTTTTTTTTT...",
    "..TtTTTTTTtT....",
    "..SSSSSSSS......",
    ".SSS....SSS.....",
    "SSS......SS.....",
    "................",
    "................",
]);

place("pip-crouch", [
    "................",
    "................",
    ".....CCCCCC.....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "....HHHHHHHH....",
    "...TTHHHHHTT....",
    "...TTTTTTTTTT...",
    "...TtTTTTTTtT...",
    "....SSSSSSSS....",
    "...SSS....SSS...",
    "................",
    "................",
    "................",
    "................",
]);

place("pip-dead", [
    "................",
    "................",
    "...SSS....SSS...",
    "..SSSS....SSSS..",
    "................",
    "....CCCCCCCC....",
    "...CCClLCCCC....",
    "...CPPPPPPPPC...",
    "...CPwPPwPPwC...",
    "....HHHHHHHH....",
    "...TTHHHHHTT....",
    "...TTTTTTTTTT...",
    "................",
    "................",
    "................",
    "................",
]);

place("pip-big-idle", [
    "................",
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "....CPPPPPPC....",
    "...CCPPPPPPCC...",
    "....HHHHHHHH....",
    "...TTHHHHHHTT...",
    "...TTTTTTTTTT...",
    "...TTTTTTTTTT...",
    "...TtTTTTTTtT...",
    "...TTTTTTTTTT...",
    "...TTTTTTTTTT...",
    "....TTTTTTTT....",
    "....TTTTTTTT....",
    "....TTTTTTTT....",
    ".....sS..Ss.....",
    "....SSS..SSS....",
    "....SSS..SSS....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);

place("pip-big-walk-0", [
    "................",
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "....CPPPPPPC....",
    "...CCPPPPPPCC...",
    "....HHHHHHHH....",
    "...TTHHHHHHTT...",
    "...TTTTTTTTTT...",
    "...TTTTTTTTTT...",
    "...TtTTTTTTtT...",
    "...TTTTTTTTTT...",
    "...TTTTTTTTTT...",
    "....TTTTTTTT....",
    "...SSS..........",
    "..SSS..Ss.......",
    ".SSS....SSS.....",
    "SSS.....SSS.....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);

place("pip-big-walk-1", [
    "................",
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "....CPPPPPPC....",
    "...CCPPPPPPCC...",
    "....HHHHHHHH....",
    "...TTHHHHHHTT...",
    "...TTTTTTTTTT...",
    "...TTTTTTTTTT...",
    "...TtTTTTTTtT...",
    "...TTTTTTTTTT...",
    "...TTTTTTTTTT...",
    "....TTTTTTTT....",
    "....TTTTTTTT....",
    ".....sSSSs......",
    "....SSS..SSS....",
    "....SS....SS....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);

place("pip-big-walk-2", [
    "................",
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "....CPPPPPPC....",
    "...CCPPPPPPCC...",
    "....HHHHHHHH....",
    "...TTHHHHHHTT...",
    "...TTTTTTTTTT...",
    "...TTTTTTTTTT...",
    "...TtTTTTTTtT...",
    "...TTTTTTTTTT...",
    "...TTTTTTTTTT...",
    "....TTTTTTTT....",
    "..........SSS...",
    ".......sS..SSS..",
    ".....SSS....SSS.",
    ".....SSS.....SSS",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);

place("pip-big-jump", [
    "................",
    "....CCCCCC......",
    "...CCCCCCCC.....",
    "...CCCCCCCC.....",
    "...CCClLCCC.....",
    "..CPPPPPPPCC....",
    "..CPPPPPPPCC....",
    "..CPwPPwPCCC....",
    "..CPPPPPPPC.....",
    "..CPPPPPPPC.....",
    "..HHHHHHHH......",
    ".TTHHHHHHTT.....",
    ".TTTTTTTTTTT....",
    ".TTTTTTTTTTT....",
    "..TtTTTTTTtT....",
    "..TTTTTTTTTT....",
    "...TTTTTTTT.....",
    "...SS....SS.....",
    "..SSS....SSS....",
    "..SS......SS....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);

place("pip-big-skid", [
    "................",
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "....CPPPPPPC....",
    "...CCPPPPPPCC...",
    "....HHHHHHHH....",
    "...TTHHHHHHTT...",
    "...TTTTTTTTTT...",
    "..TtTTTTTTTTt...",
    "..TTTTTTTTTTT...",
    "..TTTTTTTTTTT...",
    ".SSSSSSSSSSSS...",
    "SSS......SSS....",
    "SS........SS....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);

place("pip-big-crouch", [
    "................",
    "................",
    "................",
    "................",
    "................",
    ".....CCCCCC.....",
    "....CCCCCCCC....",
    "....CCClLCCC....",
    "....CPPPPPPC....",
    "....CPwPPwPC....",
    "....CPPPPPPC....",
    "....HHHHHHHH....",
    "...TTHHHHHHTT...",
    "...TTTTTTTTTT...",
    "...TtTTTTTTtT...",
    "...TTTTTTTTTT...",
    "....SSSSSSSS....",
    "...SSS....SSS...",
    "..SSS......SSS..",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);

// Sprout: a round leaf-headed walker, original silhouette.
place("sprout-0", [
    "................",
    "......lL........",
    ".....lGLLl......",
    "....bbbbbbbb....",
    "...bbbbbbbbbb...",
    "...bbxbbbbxbb...",
    "...bbKwbbKwbb...",
    "...bbxbbbbxbb...",
    "...bbbbbbbbbb...",
    "....bbbbbbbb....",
    "....yy....yy....",
    "...yyy....yyy...",
    "...KK......KK...",
    "................",
    "................",
    "................",
]);

place("sprout-1", [
    "................",
    ".......lL.......",
    "......lGLLl.....",
    "....bbbbbbbb....",
    "...bbbbbbbbbb...",
    "...bbxbbbbxbb...",
    "...bbKwbbKwbb...",
    "...bbxbbbbxbb...",
    "...bbbbbbbbbb...",
    "....bbbbbbbb....",
    "...yy......yy...",
    "..yyy......yyy..",
    "..KK........KK..",
    "................",
    "................",
    "................",
]);

place("sprout-flat", [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....bbbbbbbb....",
    "...bbKwbbKwbb...",
    "...bbbbbbbbbb...",
    "..yyyyyyyyyyyy..",
    "..KKKKKKKKKKKK..",
    "................",
    "................",
    "................",
    "................",
]);

// Shellkin: a little shelled walker with a spiral, not a hex shell.
place("shellkin-0", [
    "................",
    ".......PP.......",
    "......PPWW......",
    ".....PPKwP......",
    "....GGGGGGGG....",
    "...GGlGGGGGlG...",
    "...GGGGGGGGGG...",
    "...GGlGllGlGG...",
    "...GGGGGGGGGG...",
    "....GGGGGGGG....",
    ".....xxxxx......",
    ".....SS..SS.....",
    "....SSS..SSS....",
    "................",
    "................",
    "................",
]);

place("shellkin-1", [
    "................",
    ".......PP.......",
    "......PPWW......",
    ".....PPKwP......",
    "....GGGGGGGG....",
    "...GGlGGGGGlG...",
    "...GGGGGGGGGG...",
    "...GGlGllGlGG...",
    "...GGGGGGGGGG...",
    "....GGGGGGGG....",
    ".....xxxxx......",
    "....SS....SS....",
    "...SSS....SSS...",
    "................",
    "................",
    "................",
]);

place("shellkin-shell", [
    "................",
    "................",
    "....GGGGGGGG....",
    "...GGlGGGGGlG...",
    "...GGGGGGGGGG...",
    "...GGlGllGlGG...",
    "...GGGGGGGGGG...",
    "....GGGGGGGG....",
    ".....xxxxxx.....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);

function coin(inset) {
    const rows = blank(16, 16).map((r) => r.split(""));
    const rx = [5, 3, 2][inset];
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const dx = (x - 7.5) / rx;
            const dy = (y - 7.5) / 6.2;
            if (dx * dx + dy * dy <= 1) {
                rows[y][x] = x < 8 ? "Y" : "O";
                if (x > 11) rows[y][x] = "o";
            }
        }
    }
    // ridge
    for (let y = 4; y < 12; y++) {
        const x = 8;
        if (rows[y][x] !== ".") rows[y][x] = "W";
    }
    return outline(rows.map((r) => r.join("")));
}
place("coin-0", coin(0));
place("coin-1", coin(1));
place("coin-2", coin(2));

place("coin-icon", [
    "..OOO...",
    ".OYYYO..",
    "OYYWYOO.",
    "OYYWYOO.",
    "OYYWYOO.",
    ".OYYYO..",
    "..ooo...",
    "........",
]);

// Leaf fruit — the power-up. Coral top, cream base, one leaf. Not a spotted cap.
place("fruit", [
    "................",
    "......lL........",
    ".....lGL........",
    "....CCCCCCCC....",
    "...CCCCCCCCCC...",
    "...CCcCCCCCcC...",
    "...CCCCCCCCCC...",
    "...CCCCCCCCCC...",
    "....CCCCCCCC....",
    ".....xxxxxx.....",
    ".....xPPPPx.....",
    ".....xPPPPx.....",
    "......xxxxx.....",
    "................",
    "................",
    "................",
]);

place("fruit-life", [
    "................",
    "......lL........",
    ".....lGL........",
    "....GGGGGGGG....",
    "...GGGGGGGGGG...",
    "...GGlGGGGGlG...",
    "...GGGGGGGGGG...",
    "...GGGGGGGGGG...",
    "....GGGGGGGG....",
    ".....WWWWWW.....",
    ".....WKKKKW.....",
    ".....WKKKKW.....",
    "......WWWW......",
    "................",
    "................",
    "................",
]);

function star(squish) {
    const rows = blank(16, 16).map((r) => r.split(""));
    const pts = [
        [8, 1],
        [10, 6],
        [15, 6],
        [11, 9],
        [13, 15],
        [8, 11],
        [3, 15],
        [5, 9],
        [1, 6],
        [6, 6],
    ];
    // Fill a star by scanning barycentric-ish: distance to segments is fussy.
    // Draw a classic 16px star mask.
    const mask = squish
        ? [
              "................",
              "................",
              ".......W........",
              "......OWO.......",
              ".....OYYYO......",
              "....OYYYYYYO....",
              ".OOOYYYYYYYYOOO.",
              "..OYYYYYYYYYYO..",
              "...OYYYYYYYYO...",
              "....OYYOOYYO....",
              "...OYO....OYO...",
              "..OO........OO..",
              "................",
              "................",
              "................",
              "................",
          ]
        : [
              "................",
              ".......O........",
              "......OYO.......",
              "......OYO.......",
              ".....OYYYO......",
              "....OYYYYYO.....",
              ".OOOOYYYYYOOOO..",
              "..OYYYYYYYYYO...",
              "...OYYYYYYYYO...",
              "....OYYOOYYO....",
              "....OYO..OYO....",
              "...OYO....OYO...",
              "...OO......OO...",
              "................",
              "................",
              "................",
          ];
    return mask;
}
place("star-0", star(false));
place("star-1", star(true));

place("shard", [
    "rR.",
    "RmK",
    ".K.",
]);

place("flag", [
    "................",
    ".FFF............",
    ".FFFFF..........",
    ".FFFFFFF........",
    ".FFFFFFfF.......",
    ".FFFFFFF........",
    ".FFFFF..........",
    ".FFF............",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);

place("pole", [
    "......ZZZ.......",
    "......ZzZ.......",
    "......ZZZ.......",
    "......ZzZ.......",
    "......ZZZ.......",
    "......ZzZ.......",
    "......ZZZ.......",
    "......ZzZ.......",
    "......ZZZ.......",
    "......ZzZ.......",
    "......ZZZ.......",
    "......ZzZ.......",
    "......ZZZ.......",
    "......ZzZ.......",
    "......ZZZ.......",
    "......ZzZ.......",
]);

place("cloud-a", cloud(46, 24));
place("cloud-b", cloud(32, 20));
place("hill-lg", hill(80, 36));
place("hill-sm", hill(48, 22));
place("bush-a", bush(46, 18));
place("bush-b", bush(30, 16));
place("castle", castle());

// Original critters. Facing left. Dark eyes are `w` (never a hole). trace() rims them.
// Birdie: round robin, blue wings. Bink: butter-bellied hopper. Rusk: long snout.
// Vesper: wide moth. Puff: cheeked spitter. Rollo: banded oval. Sable: forked swallow.
// Mog: snouted digger. Brunt: claw in front, tail behind. Bram: low brass bulk. Flick: small ears.
place("birdie-0", [
    "................",
    "...AA....AA.....",
    "..aAAa..aAAa....",
    "...aA....aA.....",
    "....DDDDDDD.....",
    "...DDHHHHHDD....",
    "..oDHwHHHHDD....",
    "...DDHHHHHDD....",
    "....DDDDDDD.....",
    ".....DD..DD.....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);
place("birdie-1", [
    "................",
    "................",
    "....DDDDDDD.....",
    "...aDHHHHHDa....",
    "..aAHwHHHHAa....",
    ".oaDDHHHHHDDaa..",
    "..aDDDDDDDDDa...",
    "...DD....DD.....",
    "..aAa....aAa....",
    ".aAAa....aAAa...",
    "..AA......AA....",
    "................",
    "................",
    "................",
    "................",
    "................",
]);
place("bink-0", [
    "................",
    "................",
    ".....)==).......",
    "...))====)).....",
    "...)=ww==)).....",
    "...))====)).....",
    "....======......",
    ".....====.......",
    "...))....)).....",
    "..)))....)))....",
    "..K......K......",
    ".KK......KK.....",
    "................",
    "................",
    "................",
    "..K......K......",
]);
place("bink-1", [
    "................",
    "................",
    "................",
    ".....)==).......",
    "...)=ww==)).....",
    "..))======))....",
    "..===)===)===...",
    "...))....)).....",
    "..KK......KK....",
    ".K..........K...",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".KK......KK.....",
]);
place("bink-2", [
    "................",
    ".....)==).......",
    "...))====)).....",
    "...)=ww==)).....",
    "...))====)).g...",
    "....======.gg...",
    ".....====...g...",
    "..)))....)))....",
    ".K..........K...",
    "KK..........KK..",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);
place("bink-flat", [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...))====)).....",
    "...)=ww==w).....",
    "..============..",
    ".KKKKKKKKKKKKKK.",
    "................",
    "................",
    "................",
    ".KKKKKKKKKKKKKK.",
]);
place("rusk-0", [
    "................",
    "................",
    "..999...........",
    ".99888888.......",
    ".98ww888888.....",
    "H98888888888....",
    ".98888888888....",
    "..888888888.....",
    "...SS....SS.....",
    "..SSS....SSS....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..S......S......",
]);
place("rusk-1", [
    "................",
    "................",
    "..999...........",
    ".99888888.......",
    ".98ww888888.....",
    "H98888888888....",
    ".98888888888....",
    "..888888888.....",
    "..SS......SS....",
    ".SSS......SSS...",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".S........S.....",
]);
place("rusk-charge", [
    "................",
    "................",
    ".9999...........",
    "998888888.......",
    "98ww8888888.....",
    "H88888888888....",
    "988888888888....",
    ".8888888888.....",
    "..SSSS..SSSS....",
    ".K..........K...",
    "................",
    "................",
    "................",
    "................",
    "................",
    "K..........K....",
]);
place("rusk-flat", [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..99988888888...",
    ".98ww888888888..",
    "H9888888888888..",
    ".888888888888...",
    "KKKKKKKKKKKKKKK.",
    "................",
    "................",
    "................",
    "KKKKKKKKKKKKKKK.",
]);
place("vesper-hang", [
    "..K........K....",
    ".0w0......0w0...",
    "..00......00....",
    "...00000000.....",
    "..0011111100....",
    "..0000000000....",
    "...000ww000.....",
    "....000000......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);
place("vesper-0", [
    ".11........11...",
    "1001......1001..",
    "10001....10001..",
    ".000......000...",
    "...00000000.....",
    "..00ww000000....",
    "..0000000000....",
    "...00000000.....",
    "....000000......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....K....K......",
]);
place("vesper-1", [
    "................",
    "..1........1....",
    ".1001.000.1001..",
    "100010ww010001..",
    "10000000000001..",
    ".000000000000...",
    "..0000000000....",
    "....000000......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...K......K.....",
]);
place("puff-0", [
    "................",
    "................",
    ".....22222......",
    "....2222222.....",
    "...223333322....",
    "...22w33w322....",
    "...223333322....",
    "....2222222.....",
    ".....22222......",
    "......SSSS......",
    ".....SS..SS.....",
    "................",
    "................",
    "................",
    "................",
    "....S....S......",
]);
place("puff-1", [
    "................",
    "....22222222....",
    "...2233333322...",
    "..222333333222..",
    "..22w333333w22..",
    "..222333333222..",
    "...2233333322...",
    "....22222222....",
    "......2222......",
    "......SSSS......",
    ".....SS..SS.....",
    "................",
    "................",
    "................",
    "................",
    "....S....S......",
]);
place("puff-flat", [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..222333333222..",
    "..22w333333w22..",
    "...2222222222...",
    "..SSSSSSSSSSSS..",
    "................",
    "................",
    "................",
    "................",
    ".SSSSSSSSSSSSS..",
]);
place("bubble", [
    "..2222..",
    ".233332.",
    "23w333w2",
    "23333332",
    "23333332",
    ".233332.",
    "..2222..",
    "...22...",
]);
place("rollo-0", [
    "................",
    "................",
    "....%%%%%%......",
    "...%$%$%$%%.....",
    "...%%%%%%%$.....",
    "..%%%ww%%%%.....",
    "...%%%%%%%%.....",
    "....%%%%%%......",
    "....SS..SS......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...S....S.......",
]);
place("rollo-1", [
    "................",
    "................",
    "....%%%%%%......",
    "...%$%$%$%%.....",
    "...%%%%%%%$.....",
    "..%%%ww%%%%.....",
    "...%%%%%%%%.....",
    "....%%%%%%......",
    "...SS....SS.....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..S......S......",
]);
place("rollo-ball", [
    "................",
    "................",
    "................",
    ".....$%%%%......",
    "...%%%%%%%%.....",
    "...%$%$%$%%.....",
    "...%%%%%%%%.....",
    "....$%%%%$......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....$....$......",
]);
place("rollo-dizzy", [
    "................",
    "......Y..Y......",
    ".....$%%%%......",
    "...%%%ww%%%.....",
    "...%$%$%$%%.....",
    "...%%%%%%%%.....",
    "....$%%%%$......",
    ".....SSSS.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....S....S......",
]);
place("sable-0", [
    "................",
    "..7........7....",
    ".767......767...",
    "76667....76667..",
    "...66666666.....",
    "..6677777766....",
    "..66w7777766....",
    "...6666666......",
    "....6666...6....",
    ".....66...6.6...",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);
place("sable-1", [
    "................",
    "................",
    "..7........7....",
    ".7667....7667...",
    "766667..766667..",
    "..6677777766....",
    "..66w7777766....",
    "...66666666.....",
    "....6666....6...",
    ".....66......6..",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);
place("sable-tuck", [
    "................",
    "................",
    ".....66666......",
    "....6677776.....",
    "...766w77766....",
    "..76666666666...",
    "...766666666....",
    ".....6666..6....",
    "..........6.6...",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);
place("sable-dive", [
    "................",
    "......666.......",
    ".....67776......",
    ".....6w776......",
    "....7666666.....",
    "...76666666.....",
    "....766666......",
    ".....6666.......",
    "......6.6.......",
    ".......6........",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]);
place("mog-0", [
    "................",
    "................",
    ".....*****......",
    "....**(***......",
    "...**ww(**......",
    "...********.....",
    "....******......",
    "...**....**.....",
    "..**......**....",
    "..K......K......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..K......K......",
]);
place("mog-1", [
    "................",
    "................",
    ".....*****......",
    "....**(***......",
    "...**ww(**......",
    "...********.....",
    "....******......",
    "..**......**....",
    ".K..........K...",
    "K............K..",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".K........K.....",
]);
place("mog-dirt", [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....gggggg......",
    "...gGGGGGGg.....",
    "..gGGGGGGGGg....",
    "...gggggggg.....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...ggggggg......",
]);
place("mog-rise", [
    "................",
    "................",
    "................",
    "....wwww........",
    "...**(***.......",
    "..**ww(**.......",
    "...******.......",
    "..gGGGGGGg......",
    ".gGGGGGGGGg.....",
    "..gggggggg......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..gggggggg......",
]);
place("mog-flat", [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...**(*****.....",
    "..**ww(*****....",
    "...*********....",
    "..KKKKKKKKKKK...",
    "................",
    "................",
    "................",
    "................",
    ".KKKKKKKKKKKK...",
]);
place("brunt-0", [
    "................",
    "...&&&&.........",
    "..&&^^^^&&......",
    "..&^ww^^&&......",
    "...&&&&..^^^^...",
    "....^^..^^..^...",
    "...^^^^....^^...",
    "....^^..........",
    "...SS..SS..S....",
    "..SSS..SSS.SS...",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..S....S..S.....",
]);
place("brunt-1", [
    "................",
    "...&&&&.........",
    "..&&^^^^&&......",
    "..&^ww^^&&......",
    "...&&&&..^^^^...",
    "....^^..^^..^...",
    "...^^^^....^^...",
    "....^^..........",
    "..SS....SS.S....",
    ".SSS....SSSSS...",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".S......S..S....",
]);
place("brunt-flat", [
    "................",
    "................",
    "................",
    "................",
    "................",
    "...&&&&.........",
    "..&&ww^^&&&&....",
    "...&&&&..^^^^...",
    "..^^^^^^^^^^^^..",
    ".KKKKKKKKKKKKKK.",
    "................",
    "................",
    "................",
    "................",
    "................",
    "KKKKKKKKKKKKKKK.",
]);
place("bram-0", [
    "................",
    "................",
    ".....OOOOOO.....",
    "...OOOqqqqOOO...",
    "..OOqqOOOOOOqq..",
    "..OqOwwOOwwOqO..",
    "..OOOqqqqqqOOO..",
    "...OOOOOOOOOO...",
    "....SS....SS....",
    "...SSS....SSS...",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..SS......SS....",
]);
place("bram-1", [
    "................",
    "................",
    ".....OOOOOO.....",
    "...OOOqqqqOOO...",
    "..OOqqOOOOOOqq..",
    "..OqOwwOOwwOqO..",
    "..OOOqqqqqqOOO..",
    "...OOOOOOOOOO...",
    "...SS......SS...",
    "..SSS......SSS..",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".SS........SS...",
]);
place("bram-crack", [
    "................",
    "................",
    ".....OOO.OO.....",
    "...OOOqq.qOOO...",
    "..OOqqOO.OOqqO..",
    "..OqOwwO.wwOqO..",
    "..OOOqqq.qqOOO..",
    "...OOOOO.OOOO...",
    "....SS....SS....",
    "...SSS....SSS...",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..SS......SS....",
]);
place("flick-0", [
    "................",
    "....5....5......",
    "...455..454.....",
    "....444444......",
    "....44ww44.4....",
    "...4444444..4...",
    "....444444...4..",
    ".....4..4.......",
    "....K....K......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...K....K.......",
]);
place("flick-1", [
    "................",
    ".....5..5.......",
    "....454454......",
    ".....44444......",
    "....44ww444.4...",
    "...4444444...4..",
    "....44444.......",
    "...K......K.....",
    "..K........K....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..K......K......",
]);
place("flick-nip", [
    "................",
    "....5....5......",
    "...455..454.....",
    "....444444......",
    "....4ww44K......",
    "...44444KK......",
    "....444444......",
    ".....4..4.......",
    "....KK..KK......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...K....K.......",
]);
place("flick-flat", [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....5....5......",
    "...44444444.....",
    "...44ww4444.....",
    "..4444444444....",
    ".KKKKKKKKKKKK...",
    "................",
    "................",
    "................",
    "................",
    ".KKKKKKKKKKKK...",
]);

// World 1-2 crypt tiles and creatures. Same sheet as Pip so both stages share one atlas.
function frame16(lines) {
    const rows = lines.map((line) => {
        if (line.length > 16) throw new Error(`wide sprite row ${line.length}: ${line}`);
        return (line + ".".repeat(16)).slice(0, 16);
    });
    while (rows.length < 16) rows.push(".".repeat(16));
    if (rows.length > 16) throw new Error("sprite taller than 16");
    return rows;
}

function masonry(body, lip, crack, lipAt) {
    const rows = [];
    for (let y = 0; y < 16; y++) {
        let row = "";
        for (let x = 0; x < 16; x++) {
            const edge = lipAt === "top" ? y === 0 : lipAt === "bottom" ? y === 15 : false;
            const seam = y % 5 === 4 || (x + (Math.floor(y / 5) % 2 === 0 ? 0 : 4)) % 8 === 7;
            if (edge) row += lip;
            else if (seam) row += crack;
            else row += body;
        }
        rows.push(row);
    }
    return rows;
}

place("stone", masonry("{", "}", "[", "top"));
place("stone-roof", masonry("{", "}", "[", "bottom"));
place("stone-cold", masonry(">", "<", "?", "top"));
place("stone-cold-roof", masonry(">", "<", "?", "bottom"));
place("crypt-deep", masonry("~", "~", "[", "none"));

place(
    "torch-0",
    frame16([
        "......@!......",
        ".....!@@!.....",
        ".....!@!......",
        "......!!......",
        "......''......",
        ".....''''.....",
        "......''......",
        "......||......",
        ".....|__|.....",
    ])
);
place(
    "torch-1",
    frame16([
        ".....@!@......",
        "....!@@@!.....",
        ".....!@!......",
        "......!!......",
        "......''......",
        ".....''''.....",
        "......''......",
        "......||......",
        ".....|__|.....",
    ])
);
place(
    "skull",
    frame16([
        "....;;;;;;....",
        "...;::::::;...",
        "..;::@@::@@:..",
        "..;::::::::;..",
        "...;::;;::;...",
        "....;;;;;;....",
        "....;:;;:;....",
        "....;;..;;....",
    ])
);
place(
    "bones",
    frame16([
        "....;;....;;..",
        "...;::;..;::;.",
        "....;;....;;..",
        "..;;......;;..",
        "...;::;;::;...",
        "....;;;;;;....",
    ])
);
place("chain", [
    "..||..",
    ".|..|.",
    "..||..",
    "..||..",
    ".|..|.",
    "..||..",
    "..||..",
    ".|..|.",
    "..||..",
    "..||..",
    ".|..|.",
    "..||..",
    "..||..",
    ".|..|.",
    "..||..",
    "..||..",
]);

function cryptGate() {
    const w = 32;
    const h = 48;
    const grid = blank(w, h).map((row) => row.split(""));
    fillRect(grid, 1, 2, 30, 46, "|");
    fillRect(grid, 4, 6, 24, 38, "~");
    fillRect(grid, 14, 8, 4, 30, "!");
    fillRect(grid, 15, 10, 2, 26, "@");
    for (const x of [6, 10, 20, 24]) fillRect(grid, x, 6, 2, 38, "|");
    fillRect(grid, 1, 2, 30, 2, "_");
    fillRect(grid, 1, 44, 30, 3, "_");
    fillRect(grid, 12, 40, 8, 4, "_");
    return grid.map((row) => row.join(""));
}
place("crypt-gate", cryptGate());

place(
    "gloam-0",
    frame16([
        "......@!......",
        ".....!@@!.....",
        "......!!......",
        "....,,,,,,....",
        "...;;@@;;@@;..",
        "...;;;;;;;;...",
        "....,,,,,,....",
        ".....;;;;.....",
        "......;;......",
    ])
);
place(
    "gloam-1",
    frame16([
        ".....@!@......",
        "....!@@@!.....",
        "......!!......",
        "...;;;;;;;;...",
        "..;;@@;;@@;;..",
        "...;;;;;;;;...",
        "....;;;;;;....",
        ".....;;;;.....",
        "......;;......",
    ])
);
place(
    "gloam-flare",
    frame16([
        ".....@!@......",
        "....!@@@!.....",
        "...!@@@@@!....",
        "....!@@@!.....",
        "....,,,,,,....",
        "...;;@@;;@@;..",
        "...;;;;;;;;...",
        "....,,,,,,....",
        ".....;;;;.....",
    ])
);
place(
    "gloam-glide",
    frame16([
        "........@!....",
        ".......!@@!...",
        "........!!....",
        "....,,,,,,,,..",
        "...;;@@;;@@;..",
        "..;;;;;;;;;;..",
        "....,,,,,,....",
        "......;;;;....",
        ".......;;.....",
    ])
);
place(
    "marrow-pile",
    frame16([
        "....!!........",
        "...;::;;......",
        "..;:::::;.....",
        "...;;::;;.....",
        "....;;;;......",
    ])
);
place(
    "marrow-shake",
    frame16([
        "...@..@.......",
        "...;::;;......",
        "..;:::::;.....",
        "...;;::;;.....",
        "....;;;;......",
        "...;;..;;.....",
    ])
);
place(
    "marrow-0",
    frame16([
        "..;@@;........",
        ".;;::;;.......",
        ";::@@::;......",
        ";;::::;;......",
        ";::;;::;;.....",
        ";;......;;....",
        ".;;....;;.....",
        "..;;..;;......",
    ])
);
place(
    "marrow-1",
    frame16([
        "...;@@;.......",
        "..;;::;;......",
        ".;::@@::;.....",
        ".;;::::;;.....",
        ";;::;;::;;....",
        ".;;....;;.....",
        "..;;..;;......",
        ".;;....;;.....",
    ])
);
place(
    "marrow-flat",
    frame16([
        "..;@@;..;;....",
        ";::::::::;;...",
        ";;;;;;;;;;;;..",
    ])
);
place(
    "wick-0",
    frame16([
        "...!@!........",
        "..!@@@!.......",
        "...!@!........",
        "...,,,........",
        "..,,,,,.......",
        "..,;;,,.......",
        "...,,,........",
        "....,,........",
    ])
);
place(
    "wick-swell",
    frame16([
        "..@!@!@.......",
        ".!@@@@@!......",
        "..!@@@!.......",
        "..,,,,,.......",
        ".,,,,,,,......",
        "..,;;,,.......",
        "...,,,........",
        "....,,........",
    ])
);
place(
    "wick-flat",
    frame16([
        "..!@!.........",
        ",,,,,,,,,.....",
        ";;;;;;;;;;;...",
    ])
);

function wickDrip() {
    const w = 8;
    const h = 96;
    const rows = [];
    for (let y = 0; y < h; y++) {
        const chars = "........".split("");
        const hot = y % 5 < 2;
        chars[2] = hot ? "@" : "!";
        chars[3] = "/";
        chars[4] = hot ? "!" : "/";
        chars[5] = y % 9 === 0 ? "@" : "!";
        rows.push(chars.join(""));
    }
    return rows;
}
place("wick-drip", wickDrip());

// Background ridges for World 1-1. No black rim: a hard outline would pull them forward.
place(
    "mtn-far",
    ridge(112, 36, [
        { cx: 20, half: 26, h: 28 },
        { cx: 58, half: 34, h: 36 },
        { cx: 96, half: 24, h: 22 },
    ], { lit: "`", mid: "\\", snow: '"' })
);
place(
    "mtn-far-b",
    ridge(96, 30, [
        { cx: 24, half: 28, h: 26 },
        { cx: 68, half: 30, h: 30 },
    ], { lit: "`", mid: "\\", snow: '"' })
);
place(
    "mtn-near",
    ridge(120, 56, [
        { cx: 26, half: 30, h: 48 },
        { cx: 70, half: 36, h: 56 },
        { cx: 104, half: 22, h: 34 },
    ], { lit: "a", mid: "A", snow: '"' })
);
place(
    "mtn-near-b",
    ridge(88, 46, [
        { cx: 22, half: 26, h: 40 },
        { cx: 60, half: 32, h: 46 },
    ], { lit: "a", mid: "A", snow: '"' })
);

// Bitmap font, packed with no gaps so SpriteFont can slice it.
cursorX = 0;
cursorY += rowH + 2;
rowH = 0;
const GLYPHS = {
    "0": ["..XXX..", ".X...X.", "X...XX.", "X..X.X.", "X.X..X.", ".X...X.", "..XXX.."],
    "1": ["...X...", "..XX...", "...X...", "...X...", "...X...", "...X...", ".XXXXX."],
    "2": [".XXXXX.", "X....X.", "....X..", "...X...", "..X....", ".X.....", "XXXXXXX"],
    "3": [".XXXXX.", ".....X.", "....X..", "..XXX..", ".....X.", "X....X.", ".XXXXX."],
    "4": ["...XX..", "..X.X..", ".X..X..", "X...X..", "XXXXXXX", "....X..", "....X.."],
    "5": ["XXXXXXX", "X......", "XXXXX..", ".....X.", ".....X.", "X....X.", ".XXXXX."],
    "6": ["..XXXX.", ".X.....", "X......", "XXXXX..", "X....X.", "X....X.", ".XXXXX."],
    "7": ["XXXXXXX", ".....X.", "....X..", "...X...", "..X....", ".X.....", ".X....."],
    "8": [".XXXXX.", "X....X.", "X....X.", ".XXXXX.", "X....X.", "X....X.", ".XXXXX."],
    "9": [".XXXXX.", "X....X.", "X....X.", ".XXXXXX", ".....X.", "....X..", ".XXX..."],
    A: ["..XXX..", ".X...X.", "X.....X", "X.....X", "XXXXXXX", "X.....X", "X.....X"],
    B: ["XXXXXX.", "X....X.", "X....X.", "XXXXXX.", "X....X.", "X....X.", "XXXXXX."],
    C: ["..XXXX.", ".X....X", "X......", "X......", "X......", ".X....X", "..XXXX."],
    D: ["XXXXX..", "X....X.", "X.....X", "X.....X", "X.....X", "X....X.", "XXXXX.."],
    E: ["XXXXXXX", "X......", "X......", "XXXXX..", "X......", "X......", "XXXXXXX"],
    F: ["XXXXXXX", "X......", "X......", "XXXXX..", "X......", "X......", "X......"],
    G: ["..XXXX.", ".X.....", "X......", "X..XXXX", "X.....X", ".X....X", "..XXXX."],
    H: ["X.....X", "X.....X", "X.....X", "XXXXXXX", "X.....X", "X.....X", "X.....X"],
    I: ["XXXXXXX", "...X...", "...X...", "...X...", "...X...", "...X...", "XXXXXXX"],
    J: ["...XXXX", ".....X.", ".....X.", ".....X.", "X....X.", "X....X.", ".XXXX.."],
    K: ["X....X.", "X...X..", "X..X...", "XXX....", "X..X...", "X...X..", "X....X."],
    L: ["X......", "X......", "X......", "X......", "X......", "X......", "XXXXXXX"],
    M: ["X.....X", "XX...XX", "X.X.X.X", "X..X..X", "X.....X", "X.....X", "X.....X"],
    N: ["X.....X", "XX....X", "X.X...X", "X..X..X", "X...X.X", "X....XX", "X.....X"],
    O: ["..XXX..", ".X...X.", "X.....X", "X.....X", "X.....X", ".X...X.", "..XXX.."],
    P: ["XXXXXX.", "X....X.", "X....X.", "XXXXXX.", "X......", "X......", "X......"],
    Q: ["..XXX..", ".X...X.", "X.....X", "X.....X", "X..X..X", ".X...X.", "..XXX.X"],
    R: ["XXXXXX.", "X....X.", "X....X.", "XXXXXX.", "X..X...", "X...X..", "X....X."],
    S: [".XXXXX.", "X......", "X......", ".XXXXX.", ".....X.", ".....X.", "XXXXX.."],
    T: ["XXXXXXX", "...X...", "...X...", "...X...", "...X...", "...X...", "...X..."],
    U: ["X.....X", "X.....X", "X.....X", "X.....X", "X.....X", "X.....X", ".XXXXX."],
    V: ["X.....X", "X.....X", "X.....X", ".X...X.", ".X...X.", "..X.X..", "...X..."],
    W: ["X.....X", "X.....X", "X.....X", "X..X..X", "X.X.X.X", "XX...XX", "X.....X"],
    X: ["X.....X", ".X...X.", "..X.X..", "...X...", "..X.X..", ".X...X.", "X.....X"],
    Y: ["X.....X", ".X...X.", "..X.X..", "...X...", "...X...", "...X...", "...X..."],
    Z: ["XXXXXXX", ".....X.", "....X..", "...X...", "..X....", ".X.....", "XXXXXXX"],
    ":": [".......", "...X...", "...X...", ".......", "...X...", "...X...", "......."],
    "-": [".......", ".......", ".......", ".XXXXX.", ".......", ".......", "......."],
    x: [".......", "X.....X", ".X...X.", "..XXX..", ".X...X.", "X.....X", "......."],
    " ": [".......", ".......", ".......", ".......", ".......", ".......", "......."],
};

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-x ";
const fontY = cursorY;
for (let i = 0; i < alphabet.length; i++) {
    const g = GLYPHS[alphabet[i]];
    const rows = [];
    for (let y = 0; y < 8; y++) {
        let line = "........";
        const src = g[y] || ".......";
        // Drop shadow then ink, inside 8px (glyph is 7 wide).
        for (let x = 0; x < src.length; x++) {
            if (src[x] !== "X") continue;
            const chars = line.split("");
            if (x + 2 < 8 && chars[x + 2] === ".") chars[x + 2] = "K";
            if (y < 7) {
                /* shadow row handled below */
            }
            chars[x + 1] = "W";
            line = chars.join("");
        }
        rows.push(line);
    }
    // second pass for vertical shadow
    const painted = rows.map((r) => r.split(""));
    const srcRows = g;
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if ((srcRows[y] || "")[x] !== "X") continue;
            const sy = y + 1;
            const sx = x + 2;
            if (sy < 8 && sx < 8 && painted[sy][sx] === ".") painted[sy][sx] = "K";
        }
    }
    blit(i * 8, fontY, painted.map((r) => r.join("")));
}
frames.font = { x: 0, y: fontY, w: alphabet.length * 8, h: 8, alphabet };

function bottomAlign(name) {
    const f = frames[name];
    const copy = Buffer.alloc(f.w * f.h * 4);
    let last = -1;
    for (let y = 0; y < f.h; y++) {
        for (let x = 0; x < f.w; x++) {
            const si = ((f.y + y) * SHEET_W + (f.x + x)) * 4;
            const di = (y * f.w + x) * 4;
            copy[di] = sheet.data[si];
            copy[di + 1] = sheet.data[si + 1];
            copy[di + 2] = sheet.data[si + 2];
            copy[di + 3] = sheet.data[si + 3];
            if (sheet.data[si + 3] !== 0) last = y;
        }
    }
    const shift = f.h - 1 - last;
    if (shift <= 0) return;
    for (let y = 0; y < f.h; y++) {
        for (let x = 0; x < f.w; x++) {
            const di = ((f.y + y) * SHEET_W + (f.x + x)) * 4;
            const sy = y - shift;
            if (sy < 0) {
                sheet.data[di] = sheet.data[di + 1] = sheet.data[di + 2] = sheet.data[di + 3] = 0;
            } else {
                const si = (sy * f.w + x) * 4;
                sheet.data[di] = copy[si];
                sheet.data[di + 1] = copy[si + 1];
                sheet.data[di + 2] = copy[si + 2];
                sheet.data[di + 3] = copy[si + 3];
            }
        }
    }
}

function addBrim(name) {
    const f = frames[name];
    let brimY = -1;
    let brimX = -1;
    for (let y = f.h - 1; y >= 0; y--) {
        for (let x = 0; x < f.w; x++) {
            const i = ((f.y + y) * SHEET_W + (f.x + x)) * 4;
            if (
                sheet.data[i + 3] !== 0 &&
                sheet.data[i] === 0xef &&
                sheet.data[i + 1] === 0x4a &&
                sheet.data[i + 2] === 0x32
            ) {
                brimY = y;
                brimX = Math.max(brimX, x);
            }
        }
        if (brimY === y) break;
    }
    if (brimY < 0) return;
    for (let dx = 1; dx <= 2; dx++) {
        put(f.x + brimX + dx, f.y + brimY, PAL.C);
        put(f.x + brimX + dx, f.y + brimY + 1, PAL.c);
    }
}

const GROUND_CRITTERS = ["bink", "rusk", "puff", "rollo", "mog", "brunt", "bram", "flick", "marrow"];

for (const name of Object.keys(frames)) {
    if (
        name.startsWith("pip-big") ||
        name.includes("crouch") ||
        name === "shellkin-shell" ||
        name === "sprout-flat" ||
        GROUND_CRITTERS.some((prefix) => name.startsWith(prefix))
    ) {
        bottomAlign(name);
    }
    if (name.startsWith("pip-") && name !== "pip-dead") addBrim(name);
}

// Dark rim so characters stay readable on hills, bushes, and pipes.
// Interior gaps (between the feet, inside a shell) stay open.
function trace(name) {
    const f = frames[name];
    const opaque = [];
    for (let y = 0; y < f.h; y++) {
        opaque[y] = [];
        for (let x = 0; x < f.w; x++) {
            const i = ((f.y + y) * SHEET_W + (f.x + x)) * 4;
            opaque[y][x] = sheet.data[i + 3] !== 0;
        }
    }
    for (let y = 0; y < f.h; y++) {
        for (let x = 0; x < f.w; x++) {
            if (opaque[y][x]) continue;
            let edge = false;
            for (const [dx, dy] of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ]) {
                const nx = x + dx;
                const ny = y + dy;
                if (ny < 0 || nx < 0 || ny >= f.h || nx >= f.w) continue;
                if (opaque[ny][nx]) edge = true;
            }
            if (!edge) continue;
            let left = false;
            let right = false;
            let up = false;
            let down = false;
            for (let i = x - 1; i >= 0; i--) if (opaque[y][i]) { left = true; break; }
            for (let i = x + 1; i < f.w; i++) if (opaque[y][i]) { right = true; break; }
            for (let i = y - 1; i >= 0; i--) if (opaque[i][x]) { up = true; break; }
            for (let i = y + 1; i < f.h; i++) if (opaque[i][x]) { down = true; break; }
            if ((left && right) || (up && down)) continue;
            put(f.x + x, f.y + y, PAL.K);
        }
    }
}

const CRITTER_FRAMES = [
    "birdie",
    "bink",
    "rusk",
    "vesper",
    "puff",
    "bubble",
    "rollo",
    "sable",
    "mog",
    "brunt",
    "bram",
    "flick",
    "gloam",
    "marrow",
    "wick",
];

for (const name of Object.keys(frames)) {
    if (
        name.startsWith("pip-") ||
        name.startsWith("sprout-") ||
        name.startsWith("shellkin-") ||
        CRITTER_FRAMES.some((prefix) => name === prefix || name.startsWith(`${prefix}-`))
    ) {
        trace(name);
    }
}

const outDir = __dirname;
const pngPath = path.join(outDir, "spritesheet.png");
const atlasPath = path.join(outDir, "atlas.ts");

fs.writeFileSync(
    atlasPath,
    `// Generated by build-sprites.mjs. Do not edit by hand.\nexport interface Frame {\n    x: number;\n    y: number;\n    w: number;\n    h: number;\n}\n\nexport const FONT_ALPHABET = ${JSON.stringify(alphabet)};\n\nexport const frames: Record<string, Frame> = ${JSON.stringify(
        Object.fromEntries(
            Object.entries(frames).map(([k, v]) => [k, { x: v.x, y: v.y, w: v.w, h: v.h }])
        ),
        null,
        4
    )};\n`
);

sheet.pack().pipe(fs.createWriteStream(pngPath)).on("finish", () => {
    // Nearest-neighbor showcase for visual QA.
    const sceneW = 256;
    const sceneH = 160;
    const scale = 3;
    const preview = new PNG({ width: sceneW * scale, height: sceneH * scale, fill: true });
    const sky = hex("5c94fc");
    for (let i = 0; i < preview.data.length; i += 4) {
        preview.data[i] = sky[0];
        preview.data[i + 1] = sky[1];
        preview.data[i + 2] = sky[2];
        preview.data[i + 3] = 255;
    }
    function sample(name, dx, dy) {
        const f = frames[name];
        for (let y = 0; y < f.h; y++) {
            for (let x = 0; x < f.w; x++) {
                const si = ((f.y + y) * SHEET_W + (f.x + x)) * 4;
                const a = sheet.data[si + 3];
                if (a === 0) continue;
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const px = (dx + x) * scale + sx;
                        const py = (dy + y) * scale + sy;
                        if (px < 0 || py < 0 || px >= preview.width || py >= preview.height) continue;
                        const di = (py * preview.width + px) * 4;
                        preview.data[di] = sheet.data[si];
                        preview.data[di + 1] = sheet.data[si + 1];
                        preview.data[di + 2] = sheet.data[si + 2];
                        preview.data[di + 3] = 255;
                    }
                }
            }
        }
    }
    sample("mtn-far", 0, 160 - 16 - frames["mtn-far"].h - 18);
    sample("mtn-far-b", 108, 160 - 16 - frames["mtn-far-b"].h - 14);
    sample("mtn-near", 20, 160 - 16 - frames["mtn-near"].h);
    sample("mtn-near-b", 150, 160 - 16 - frames["mtn-near-b"].h + 4);
    sample("hill-lg", 8, 160 - 16 - frames["hill-lg"].h);
    sample("hill-sm", 120, 160 - 16 - frames["hill-sm"].h);
    sample("cloud-a", 150, 16);
    sample("cloud-b", 40, 28);
    sample("bush-a", 70, 160 - 16 - frames["bush-a"].h);
    for (let x = 0; x < 16; x++) sample("ground", x * 16, 144);
    sample("pipe-tl", 180, 144 - 32);
    sample("pipe-tr", 196, 144 - 32);
    sample("pipe-bl", 180, 144 - 16);
    sample("pipe-br", 196, 144 - 16);
    sample("question-0", 48, 144 - 64);
    sample("brick", 64, 144 - 64);
    sample("question-1", 80, 144 - 64);
    sample("hard", 96, 144 - 48);
    sample("coin-0", 112, 144 - 80);
    sample("fruit", 128, 144 - 64);
    sample("pip-idle", 24, 144 - 16);
    sample("pip-big-idle", 210, 144 - 32);
    sample("sprout-0", 140, 144 - 16);
    sample("shellkin-0", 160, 144 - 16);
    sample("castle", 230, 144 - frames["castle"].h);
    const lineupSpecs = [
        ["BIRDIE", ["birdie-0", "birdie-1"]],
        ["BINK", ["bink-0", "bink-1", "bink-2", "bink-flat"]],
        ["RUSK", ["rusk-0", "rusk-1", "rusk-charge", "rusk-flat"]],
        ["VESPER", ["vesper-hang", "vesper-0", "vesper-1"]],
        ["PUFF", ["puff-0", "puff-1", "puff-flat", "bubble"]],
        ["ROLLO", ["rollo-0", "rollo-1", "rollo-ball", "rollo-dizzy"]],
        ["SABLE", ["sable-0", "sable-1", "sable-tuck", "sable-dive"]],
        ["MOG", ["mog-0", "mog-1", "mog-dirt", "mog-rise", "mog-flat"]],
        ["BRUNT", ["brunt-0", "brunt-1", "brunt-flat"]],
        ["BRAM", ["bram-0", "bram-1", "bram-crack"]],
        ["FLICK", ["flick-0", "flick-1", "flick-nip", "flick-flat"]],
        ["GLOAM", ["gloam-0", "gloam-1", "gloam-flare", "gloam-glide"]],
        ["MARROW", ["marrow-pile", "marrow-shake", "marrow-0", "marrow-1", "marrow-flat"]],
        ["WICK", ["wick-0", "wick-swell", "wick-flat"]],
    ];
    const lineupScale = 4;
    const rowH = 16 * lineupScale + 18;
    const lineup = new PNG({ width: 640, height: lineupSpecs.length * rowH + 8, fill: true });
    for (let i = 0; i < lineup.data.length; i += 4) {
        lineup.data[i] = sky[0];
        lineup.data[i + 1] = sky[1];
        lineup.data[i + 2] = sky[2];
        lineup.data[i + 3] = 255;
    }
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-x ";
    function glyph(ch, dx, dy) {
        const idx = alphabet.indexOf(ch);
        if (idx < 0) return;
        const font = frames.font;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const si = ((font.y + y) * SHEET_W + (font.x + idx * 8 + x)) * 4;
                if (sheet.data[si + 3] === 0) continue;
                const px = dx + x;
                const py = dy + y;
                if (px < 0 || py < 0 || px >= lineup.width || py >= lineup.height) continue;
                const di = (py * lineup.width + px) * 4;
                lineup.data[di] = sheet.data[si];
                lineup.data[di + 1] = sheet.data[si + 1];
                lineup.data[di + 2] = sheet.data[si + 2];
                lineup.data[di + 3] = 255;
            }
        }
    }
    function label(text, dx, dy) {
        for (let i = 0; i < text.length; i++) glyph(text[i], dx + i * 8, dy);
    }
    function blitFrame(name, dx, dy) {
        const f = frames[name];
        for (let y = 0; y < f.h; y++) {
            for (let x = 0; x < f.w; x++) {
                const si = ((f.y + y) * SHEET_W + (f.x + x)) * 4;
                if (sheet.data[si + 3] === 0) continue;
                for (let sy = 0; sy < lineupScale; sy++) {
                    for (let sx = 0; sx < lineupScale; sx++) {
                        const px = dx + x * lineupScale + sx;
                        const py = dy + y * lineupScale + sy;
                        if (px < 0 || py < 0 || px >= lineup.width || py >= lineup.height) continue;
                        const di = (py * lineup.width + px) * 4;
                        lineup.data[di] = sheet.data[si];
                        lineup.data[di + 1] = sheet.data[si + 1];
                        lineup.data[di + 2] = sheet.data[si + 2];
                        lineup.data[di + 3] = 255;
                    }
                }
            }
        }
    }
    lineupSpecs.forEach((spec, i) => {
        const y = 8 + i * rowH;
        label(spec[0], 4, y + 20);
        spec[1].forEach((name, n) => blitFrame(name, 88 + n * 76, y));
    });
    const lineupPath = "/opt/cursor/artifacts/creature-lineup.png";
    const previewPath = "/opt/cursor/artifacts/sprites-preview.png";
    fs.mkdirSync("/opt/cursor/artifacts", { recursive: true });
    lineup.pack().pipe(fs.createWriteStream(lineupPath));
    preview.pack().pipe(fs.createWriteStream(previewPath)).on("finish", () => {
        console.log("wrote", pngPath);
        console.log("atlas entries", Object.keys(frames).length);
        console.log("preview", previewPath);
        console.log("lineup", lineupPath);
        console.log("font", frames.font);
    });
});
