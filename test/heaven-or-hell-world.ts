import assert from "node:assert/strict";
import test from "node:test";
import {
    chunkAt,
    chunkKey,
    chunkRect,
    chunksNear,
    distanceToRect,
    LOAD_DISTANCE,
    parseKey,
    planStreaming,
    seeded,
    UNLOAD_DISTANCE,
    worldRect,
} from "../src/components/scenes/HeavenOrHell/world/chunks.ts";
import { depthOf, resolve } from "../src/components/scenes/HeavenOrHell/world/collide.ts";
import { archWall, ARCH_STRIPS, chunkDef, GRID, HOME, iso, spawnPoint } from "../src/components/scenes/HeavenOrHell/world/map.ts";
import { FOOTPRINT_RATIO, PROP_FRAMES } from "../src/components/scenes/HeavenOrHell/art/atlas.ts";

const grid = { cols: 3, rows: 3, size: 1000 };

test("chunk keys round-trip and points map to their chunk", () => {
    assert.deepEqual(parseKey(chunkKey(4, 2)), { cx: 4, cy: 2 });
    assert.deepEqual(chunkAt(grid, 1500, 2999), { cx: 1, cy: 2 });
    assert.equal(chunkAt(grid, -1, 10), null);
    assert.equal(chunkAt(grid, 3000, 10), null);
    assert.deepEqual(chunkRect(grid, 2, 1), { x: 2000, y: 1000, w: 1000, h: 1000 });
    assert.deepEqual(worldRect(grid), { x: 0, y: 0, w: 3000, h: 3000 });
});

test("distance to a rect is zero inside and euclidean outside", () => {
    const r = { x: 0, y: 0, w: 100, h: 100 };
    assert.equal(distanceToRect(50, 50, r), 0);
    assert.equal(distanceToRect(150, 50, r), 50);
    assert.equal(distanceToRect(103, 104, r), 5);
});

test("chunks near a point come nearest first and stay in the grid", () => {
    const near = chunksNear(grid, 1500, 1500, 400);
    assert.deepEqual(near, ["1,1"]);
    const edges = chunksNear(grid, 1500, 1500, 600);
    assert.equal(edges.length, 5, "the four edge neighbours are 500 away, the corners 707");
    const wide = chunksNear(grid, 1500, 1500, 750);
    assert.equal(wide[0], "1,1");
    assert.equal(wide.length, 9);
    // the four edge neighbours (500 away) before the corners (707 away) at a reach that includes both
    assert.deepEqual(new Set(wide.slice(1, 5)), new Set(["0,1", "1,0", "1,2", "2,1"]));
    const corner = chunksNear(grid, 10, 10, 2000);
    assert.ok(corner.every((k) => {
        const { cx, cy } = parseKey(k);
        return cx >= 0 && cy >= 0 && cx < 3 && cy < 3;
    }));
});

test("streaming loads near chunks and unloads far ones with hysteresis", () => {
    const first = planStreaming(grid, [], 1500, 1500, 300, 600);
    assert.deepEqual(first.load, ["1,1"]);
    assert.deepEqual(first.unload, []);

    // walk to 250 past the east edge of 1,1: 2,1 is 0 away (inside) and loads; 1,1 is 250 away and stays
    const east = planStreaming(grid, ["1,1"], 2250, 1500, 300, 600);
    assert.ok(east.load.includes("2,1"));
    assert.deepEqual(east.unload, []);

    // between load and unload reach nothing changes for a loaded chunk
    const mid = planStreaming(grid, ["1,1", "2,1"], 2450, 1500, 300, 600);
    assert.ok(!mid.unload.includes("1,1"));
    assert.ok(!mid.load.includes("1,1"));

    // past the unload reach it goes
    const far = planStreaming(grid, ["1,1", "2,1"], 2700, 1500, 300, 600);
    assert.deepEqual(far.unload, ["1,1"]);

    // a key outside the grid is always dropped
    assert.deepEqual(planStreaming(grid, ["9,9"], 1500, 1500, 300, 600).unload, ["9,9"]);
    assert.ok(UNLOAD_DISTANCE > LOAD_DISTANCE);
});

test("walking the whole map leaves only the chunks around the hero", () => {
    const loaded = new Set<string>();
    let peak = 0;
    const w = worldRect(GRID);
    for (let y = 100; y < w.h; y += 211) {
        for (let x = 100; x < w.w; x += 197) {
            const plan = planStreaming(GRID, loaded, x, y);
            for (const k of plan.unload) loaded.delete(k);
            for (const k of plan.load) loaded.add(k);
            peak = Math.max(peak, loaded.size);
        }
    }
    const end = planStreaming(GRID, loaded, w.w - 100, w.h - 100);
    for (const k of end.unload) loaded.delete(k);
    assert.ok(peak <= 9, `at most a 3x3 block is ever loaded, saw ${peak}`);
    assert.ok([...loaded].every((k) => {
        const { cx, cy } = parseKey(k);
        return cx >= GRID.cols - 2 && cy >= GRID.rows - 2;
    }), `only the south-east corner stays loaded, got ${[...loaded]}`);
});

test("seeded generators repeat and differ by seed", () => {
    const a = seeded(42);
    const b = seeded(42);
    const c = seeded(43);
    const sa = [a(), a(), a()];
    assert.deepEqual(sa, [b(), b(), b()]);
    assert.notDeepEqual(sa, [c(), c(), c()]);
    assert.ok(sa.every((v) => v >= 0 && v < 1));
});

test("the map is at least 3x3, the temple is dressed and the rest are plain", () => {
    assert.ok(GRID.cols >= 3 && GRID.rows >= 3);
    const home = chunkDef(HOME.cx, HOME.cy);
    assert.equal(home.dressed, true);
    assert.ok(home.props.length > 20, "the temple is full of ruins");
    assert.ok(home.lights.length >= 5);
    assert.ok(home.decals.some((d) => d.kind === "breach"), "Hell breaks in at the temple's edge");
    assert.ok(home.props.some((p) => p.kind === "altar"));
    for (const [cx, cy] of [[0, 0], [4, 4], [1, 3]]) {
        const def = chunkDef(cx, cy);
        assert.equal(def.dressed, false);
        assert.ok(def.props.length > 0);
        const rect = chunkRect(GRID, cx, cy);
        assert.ok(def.props.every((p) => p.x >= rect.x - 400 && p.x <= rect.x + rect.w + 400));
    }
    assert.deepEqual(chunkDef(1, 3), chunkDef(1, 3), "a chunk dresses the same every time it loads");
});

test("Hell's corruption thickens to the east", () => {
    const west = chunkDef(0, 2).corruption;
    const east = chunkDef(4, 2).corruption;
    assert.ok(east > west);
    assert.ok(east > 0.6);
    assert.equal(west, 0);
});

test("the hero spawns on the temple plaza, clear of every collider", () => {
    const s = spawnPoint();
    assert.deepEqual(chunkAt(GRID, s.x, s.y), HOME);
    const home = chunkDef(HOME.cx, HOME.cy);
    const fixed = resolve(s, 15, home.colliders, null);
    assert.ok(Math.hypot(fixed.x - s.x, fixed.y - s.y) < 1e-6);
});

test("iso projects ground diagonals onto the screen at the camera ratio", () => {
    const a = iso(100, 0);
    const b = iso(0, 100);
    assert.ok(Math.abs(a.x + b.x) < 1e-9);
    assert.ok(Math.abs(a.y - b.y) < 1e-9);
    assert.ok(Math.abs(a.y / a.x - FOOTPRINT_RATIO) < 1e-9);
});

test("the arch wall splits into strips laid edge to edge, each sorting on its own base", () => {
    const strips = archWall(1000, 800);
    assert.equal(strips.length, ARCH_STRIPS.length);
    let right = -Infinity;
    for (const s of strips) {
        const f = PROP_FRAMES[s.kind];
        const left = s.x - f.ax * f.scale;
        if (right !== -Infinity) assert.ok(Math.abs(left - right) < 0.01, "no gap between strips");
        right = left + f.w * f.scale;
        // every strip's painting bottom lines up with the wall's bottom
        assert.ok(Math.abs(s.y - f.ay * f.scale + f.h * f.scale - 800) < 0.01);
    }
    const ys = strips.map((s) => s.y);
    assert.ok(new Set(ys.map((y) => Math.round(y))).size > 1, "the strips sort at different depths");
});

test("colliders push the hero out of footprints and keep it in bounds", () => {
    const pillar = { x: 0, y: 0, rx: 50, ry: 36 };
    const out = resolve({ x: 10, y: 0 }, 15, [pillar], null);
    assert.ok(Math.abs(out.x - 65) < 1e-6);
    const below = resolve({ x: 0, y: 20 }, 15, [pillar], null);
    assert.ok(Math.abs(below.y - 65 * (36 / 50)) < 1e-6);
    const far = { x: 500, y: 500 };
    assert.deepEqual(resolve(far, 15, [pillar], null), far);
    assert.deepEqual(resolve({ x: -50, y: 2000 }, 15, [], { x: 0, y: 0, w: 1000, h: 1000 }), { x: 15, y: 985 });
});

test("depth follows y so lower on screen draws in front", () => {
    assert.ok(depthOf(500) > depthOf(499.5));
    assert.equal(depthOf(100.1), 100);
    assert.equal(depthOf(100.2), 100.25);
});
