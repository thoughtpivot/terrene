import assert from "node:assert/strict";
import test from "node:test";
import { canDash, DASH_COOLDOWN, DASH_SPEED, DASH_TIME, freshMotion, startDash, stepMotion, WALK_SPEED } from "../src/components/characters/player/Auriel/Auriel.motion.ts";
import { BUFFER_MS, facing8, InputBuffer, KEY_ACTIONS, MOUSE_ACTIONS, moveVector, readIntent, viewFor } from "../src/components/scenes/HeavenOrHell/input.ts";

const frame = 1 / 60;

test("WASD gives a unit vector and opposite keys cancel", () => {
    assert.deepEqual(moveVector(false, false, false, false), { x: 0, y: 0 });
    assert.deepEqual(moveVector(true, false, false, false), { x: 0, y: -1 });
    const diag = moveVector(false, true, false, true);
    assert.ok(Math.abs(Math.hypot(diag.x, diag.y) - 1) < 1e-9);
    assert.deepEqual(moveVector(true, true, true, true), { x: 0, y: 0 });
});

test("the intent aims from the hero toward the mouse", () => {
    const raw = { up: false, down: false, left: false, right: true, aim: { x: 110, y: 0 }, pressed: [], held: [] };
    const intent = readIntent(raw, { x: 10, y: 0 });
    assert.deepEqual(intent.aim, { x: 1, y: 0 });
    assert.deepEqual(intent.move, { x: 1, y: 0 });
    assert.equal(readIntent({ ...raw, aim: { x: 11, y: 1 } }, { x: 10, y: 0 }).aim, null, "a mouse on top of the hero has no aim");
    assert.equal(readIntent({ ...raw, aim: null }, { x: 0, y: 0 }).aim, null);
});

test("a press waits in the buffer for its window, then expires", () => {
    const b = new InputBuffer();
    b.press("dash", 1000);
    assert.ok(b.peek("dash", 1000 + BUFFER_MS));
    assert.ok(!b.consume("attack", 1050));
    assert.ok(b.consume("dash", 1100));
    assert.ok(!b.consume("dash", 1100), "a press is used once");
    b.press("dash", 2000);
    assert.ok(!b.consume("dash", 2000 + BUFFER_MS + 1));
    assert.equal(b.size, 0);
    b.press("parry", 0);
    b.press("roll", 0);
    b.clear();
    assert.equal(b.size, 0);
});

test("presses are consumed oldest first", () => {
    const b = new InputBuffer();
    b.press("attack", 0);
    b.press("attack", 50);
    assert.ok(b.consume("attack", 100));
    assert.equal(b.size, 1);
    assert.ok(!b.consume("attack", 50 + BUFFER_MS + 1), "the second press has expired by now");
});

test("the M2 combat layout is bound and buffered already", () => {
    assert.equal(KEY_ACTIONS.Space, "dash");
    assert.equal(KEY_ACTIONS.KeyF, "parry");
    assert.equal(KEY_ACTIONS.KeyQ, "roll");
    assert.equal(KEY_ACTIONS.KeyR, "critical");
    assert.equal(MOUSE_ACTIONS[0], "attack");
    assert.equal(MOUSE_ACTIONS[2], "feint");
});

test("eight facings clockwise from east, with four painted views and mirrors", () => {
    assert.equal(facing8(1, 0), 0);
    assert.equal(facing8(1, 1), 1);
    assert.equal(facing8(0, 1), 2);
    assert.equal(facing8(-1, 0), 4);
    assert.equal(facing8(0, -1), 6);
    assert.equal(facing8(1, -1), 7);
    assert.equal(facing8(1, -0.3), 0);
    assert.deepEqual(viewFor(2), { view: "s", flip: false });
    assert.deepEqual(viewFor(6), { view: "n", flip: false });
    assert.deepEqual(viewFor(1), { view: "se", flip: false });
    assert.deepEqual(viewFor(3), { view: "se", flip: true });
    assert.deepEqual(viewFor(7), { view: "ne", flip: false });
    assert.deepEqual(viewFor(5), { view: "ne", flip: true });
    assert.deepEqual(viewFor(-1), viewFor(7));
});

test("walking reaches full speed within a few frames and stops as quickly", () => {
    let m = freshMotion(0, 0);
    let frames = 0;
    while (Math.hypot(m.vx, m.vy) < WALK_SPEED - 1e-6) {
        m = stepMotion(m, { x: 1, y: 0 }, frame).motion;
        frames++;
    }
    assert.ok(frames <= 5, `full speed in ${frames} frames`);
    assert.ok(m.x > 0);
    frames = 0;
    while (Math.hypot(m.vx, m.vy) > 0) {
        m = stepMotion(m, { x: 0, y: 0 }, frame).motion;
        frames++;
    }
    assert.ok(frames <= 4, `stopped in ${frames} frames`);
});

test("diagonal walking is no faster than straight", () => {
    let m = freshMotion(0, 0);
    const d = Math.SQRT1_2;
    for (let i = 0; i < 30; i++) m = stepMotion(m, { x: d, y: d }, frame).motion;
    assert.ok(Math.abs(Math.hypot(m.vx, m.vy) - WALK_SPEED) < 1e-6);
});

test("a dash bursts, ends at walking speed and cools down", () => {
    let m = freshMotion(0, 0);
    assert.ok(canDash(m));
    m = startDash(m, { x: 0, y: 0 }, { x: 0, y: 2 });
    assert.deepEqual(m.dashDir, { x: 0, y: 1 }, "standing still, the dash goes toward the aim");
    assert.equal(m.vy, DASH_SPEED);
    assert.ok(!canDash(m));
    let ended = false;
    let t = 0;
    while (!ended) {
        const r = stepMotion(m, { x: 0, y: 0 }, frame);
        m = r.motion;
        ended = r.events.dashEnded;
        t += frame;
    }
    assert.ok(Math.abs(t - DASH_TIME) < frame + 1e-9);
    assert.equal(m.vy, WALK_SPEED);
    assert.ok(Math.abs(m.cooldown - DASH_COOLDOWN) < 1e-9);
    assert.ok(!canDash(m));
    for (let i = 0; i < Math.ceil(DASH_COOLDOWN / frame) + 1; i++) m = stepMotion(m, { x: 0, y: 0 }, frame).motion;
    assert.ok(canDash(m));
    const again = startDash(freshMotion(0, 0), { x: 1, y: 0 }, { x: 0, y: 1 });
    assert.deepEqual(again.dashDir, { x: 1, y: 0 }, "moving, the dash goes the way the hero moves");
});
