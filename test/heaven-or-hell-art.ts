import assert from "node:assert/strict";
import test from "node:test";
import {
    blank,
    borderColor,
    components,
    crop,
    dilateMask,
    keyOut,
    opaqueBounds,
    outline,
    pack,
    resize,
    type Img,
} from "../tools/heaven-or-hell/image.ts";

function fill(img: Img, x0: number, y0: number, w: number, h: number, rgba: [number, number, number, number]): void {
    for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
            const i = (y * img.w + x) * 4;
            img.data[i] = rgba[0];
            img.data[i + 1] = rgba[1];
            img.data[i + 2] = rgba[2];
            img.data[i + 3] = rgba[3];
        }
    }
}

const MAGENTA: [number, number, number, number] = [255, 0, 255, 255];
const STONE: [number, number, number, number] = [200, 196, 186, 255];

function painting(): Img {
    const img = blank(40, 30);
    fill(img, 0, 0, 40, 30, MAGENTA);
    fill(img, 5, 5, 8, 10, STONE);
    fill(img, 25, 12, 10, 12, STONE);
    return img;
}

test("the key colour is read from the border of a painting", () => {
    assert.deepEqual(borderColor(painting()), [255, 0, 255]);
});

test("keying makes the background clear and keeps the subject solid", () => {
    const keyed = keyOut(painting(), [255, 0, 255]);
    const at = (x: number, y: number) => keyed.data[(y * keyed.w + x) * 4 + 3];
    assert.equal(at(0, 0), 0);
    assert.equal(at(20, 2), 0);
    assert.equal(at(8, 8), 255);
    assert.equal(at(30, 20), 255);
    const b = opaqueBounds(keyed)!;
    assert.deepEqual(b, { x: 5, y: 5, w: 30, h: 19 });
});

test("components finds each separate subject, largest first", () => {
    const keyed = keyOut(painting(), [255, 0, 255]);
    const boxes = components(keyed, 4);
    assert.equal(boxes.length, 2);
    assert.deepEqual(boxes[0], { x: 25, y: 12, w: 10, h: 12 });
    assert.deepEqual(boxes[1], { x: 5, y: 5, w: 8, h: 10 });
    assert.deepEqual(crop(keyed, boxes[1]).w, 8);
});

test("dilating a mask grows it by the radius", () => {
    const mask = new Uint8Array(9 * 9);
    mask[4 * 9 + 4] = 1;
    const grown = dilateMask(mask, 9, 9, 2);
    assert.equal(grown[4 * 9 + 6], 1);
    assert.equal(grown[4 * 9 + 7], 0);
    assert.equal(grown[2 * 9 + 4], 1);
});

test("an outline is drawn behind the subject, never over it", () => {
    const img = blank(12, 12);
    fill(img, 4, 4, 4, 4, STONE);
    const out = outline(img, 2, [255, 206, 92]);
    // the result is padded by radius + 1 on every side
    assert.equal(out.w, 18);
    const px = (x: number, y: number) => Array.from(out.data.slice(((y + 3) * out.w + x + 3) * 4, ((y + 3) * out.w + x + 3) * 4 + 4));
    assert.deepEqual(px(5, 5), [...STONE]);
    assert.deepEqual(px(3, 5), [255, 206, 92, 255], "solid next to the shape");
    assert.ok(px(2, 5)[3] > 0 && px(2, 5)[3] < 255, "soft at the outer edge");
    assert.equal(px(1, 5)[3], 0);
    assert.equal(px(-3, -3)[3], 0);
});

test("resizing halves dimensions and averages colour", () => {
    const img = blank(4, 4);
    fill(img, 0, 0, 4, 4, [100, 100, 100, 255]);
    fill(img, 0, 0, 2, 4, [200, 200, 200, 255]);
    const half = resize(img, 2, 2);
    assert.equal(half.w, 2);
    assert.equal(half.h, 2);
    assert.ok(Math.abs(half.data[0] - 200) <= 2);
    assert.ok(Math.abs(half.data[4] - 100) <= 2);
});

test("the shelf packer places everything without overlap inside the page", () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ name: `f${i}`, w: 30 + ((i * 37) % 90), h: 20 + ((i * 53) % 70) }));
    const placed = pack(items, 256, 2);
    assert.equal(placed.length, items.length);
    for (const a of placed) {
        assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.w <= 256 && a.y + a.h <= 256);
        for (const b of placed) {
            if (a === b || a.page !== b.page) continue;
            const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
            assert.ok(apart, `${a.name} overlaps ${b.name}`);
        }
    }
});
