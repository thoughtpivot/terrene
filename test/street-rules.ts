import assert from "node:assert/strict";
import test from "node:test";
import { buildSceneOne, fillView } from "../src/components/scenes/Street/level.ts";
import {
    abortHandoff,
    ask,
    beginHandoff,
    carHitsPlayer,
    carryAim,
    circleHitsRect,
    dismiss,
    freshSale,
    gateClosed,
    layTrail,
    lightPhase,
    pointInRect,
    sees,
    tickSale,
} from "../src/components/scenes/Street/rules.ts";

test("scene one is a four-block town you can clear", () => {
    const { level, city } = buildSceneOne();
    assert.equal(level.id, "street");
    assert.equal(level.goal, 500);
    assert.equal(level.price, 50);
    assert.equal(level.policeDelay, 5);
    assert.equal(level.next, null);
    assert.equal(city.seats.length, 20);
    assert.equal(city.dumpsters.length, 4);
    assert.equal(city.peds.length, 12);
    assert.equal(city.checks.length, 4);
    assert.ok(city.lanes.length >= 8);
    assert.ok(city.crosswalks.length >= 16);
});

test("seats and dumpsters stay out of the buildings", () => {
    const { city } = buildSceneOne();
    for (const seat of city.seats) {
        assert.equal(city.buildings.some((building) => pointInRect(seat.x, seat.y, building)), false);
    }
    for (const dump of city.dumpsters) {
        const x = dump.x + dump.w / 2;
        const y = dump.y + dump.h / 2;
        assert.equal(city.buildings.some((building) => pointInRect(x, y, building)), false);
        assert.equal(city.alleys.some((alley) => pointInRect(x, y, alley)), true);
    }
});

test("an alley pocket is hidden from the mouth and the entrance is not", () => {
    const { city } = buildSceneOne();
    for (const check of city.checks) {
        assert.equal(sees(check.mouth.x, check.mouth.y, check.pocket.x, check.pocket.y, 800, city.buildings), false);
        assert.equal(sees(check.mouth.x, check.mouth.y, check.shaft.x, check.shaft.y, 800, city.buildings), true);
    }
});

test("a sidewalk handoff is visible to someone standing nearby", () => {
    const { city } = buildSceneOne();
    const seat = city.seats[0];
    const bystander = { x: seat.x + 90, y: seat.y };
    assert.equal(sees(bystander.x, bystander.y, seat.x, seat.y, 250, city.buildings), true);
});

test("a no ends the ask, a yes follows, and a dismiss stays quiet", () => {
    let sale = ask(freshSale(), 3, 0.1);
    assert.equal(sale.note, "no");
    assert.equal(sale.phase, "idle");

    sale = ask(freshSale(), 3, 0.9);
    assert.equal(sale.note, "yes");
    assert.equal(sale.phase, "follow");
    assert.equal(sale.npc, 3);

    sale = dismiss(sale);
    assert.equal(sale.phase, "idle");
    assert.equal(sale.policeIn, null);
    assert.equal(sale.note, "dismiss");
});

test("you cannot ask while someone is following or after they have bought", () => {
    const following = ask(freshSale(), 1, 0.9);
    const ignored = ask(following, 2, 0.9);
    assert.equal(ignored.npc, 1);
    assert.equal(ignored.note, "");

    const bought = { ...freshSale(), sold: [4] };
    const again = ask(bought, 4, 0.9);
    assert.equal(again.phase, "idle");
    assert.equal(again.note, "");
});

test("a witnessed handoff calls police five seconds after it finishes or is aborted", () => {
    let sale = beginHandoff(ask(freshSale(), 2, 0.8), true);
    sale = abortHandoff(sale, 5);
    assert.equal(sale.phase, "idle");
    assert.equal(sale.policeIn, 5);
    assert.equal(sale.note, "call");

    sale = beginHandoff(ask(freshSale(), 2, 0.8), true);
    sale = tickSale(sale, 1.5, 50, 5);
    assert.equal(sale.note, "paid");
    assert.equal(sale.money, 50);
    assert.equal(sale.phase, "toss");
    assert.equal(sale.policeIn, 5);

    sale = tickSale(sale, 5, 50, 5);
    assert.equal(sale.heat, true);
    assert.equal(sale.policeIn, null);
    assert.equal(sale.sold.includes(2), true);
});

test("a quiet handoff pays and does not call", () => {
    let sale = beginHandoff(ask(freshSale(), 7, 0.8), false);
    sale = tickSale(sale, 1.5, 50, 5);
    assert.equal(sale.money, 50);
    assert.equal(sale.policeIn, null);
    assert.equal(sale.heat, false);
    sale = tickSale(sale, 1.25, 50, 5);
    assert.equal(sale.phase, "idle");
    assert.equal(sale.note, "free");
    assert.deepEqual(sale.sold, [7]);
});

test("lights alternate and crosswalks hold traffic", () => {
    assert.equal(lightPhase(0, 3.4).nsGreen, true);
    assert.equal(lightPhase(3.4, 3.4).nsGreen, false);
    assert.equal(lightPhase(4.3, 3.4).ewGreen, true);
    const red = lightPhase(0, 3.4);
    assert.equal(gateClosed("light", "ew", red, false, false), true);
    assert.equal(gateClosed("light", "ns", red, false, false), false);
    assert.equal(gateClosed("yield", "ns", red, true, false), true);
    assert.equal(gateClosed("yield", "ns", red, false, false), false);
    assert.equal(gateClosed("stop", "ns", red, false, false), true);
    assert.equal(gateClosed("stop", "ns", red, false, true), false);
});

test("a crosswalk keeps a car from counting as a hit", () => {
    const walk = { x: 0, y: 0, w: 40, h: 40 };
    const car = { x: 0, y: 0, w: 30, h: 30 };
    assert.equal(carHitsPlayer(10, 10, 14, car, [walk]), false);
    assert.equal(carHitsPlayer(10, 10, 14, car, []), true);
    assert.equal(circleHitsRect(100, 100, 14, car), false);
});

test("patrol beats cover every block and a loop around the town", () => {
    const { city } = buildSceneOne();
    assert.equal(city.beats.length, 6);
    const xs = city.beats.flatMap((beat) => beat.pts.map((point) => point.x));
    const ys = city.beats.flatMap((beat) => beat.pts.map((point) => point.y));
    assert.ok(Math.max(...xs) - Math.min(...xs) > 1000);
    assert.ok(Math.max(...ys) - Math.min(...ys) > 1000);
    for (const beat of city.beats) {
        for (const point of beat.pts) {
            assert.equal(city.buildings.some((building) => pointInRect(point.x, point.y, building)), false);
        }
    }
});

test("a carrier walks home and sheers off a cop, and the trail runs back to you", () => {
    const home = { x: 200, y: 0 };
    const pos = { x: 0, y: 0 };
    assert.deepEqual(carryAim(pos, home, []), home);
    const away = carryAim(pos, home, [{ x: 40, y: 0 }]);
    assert.ok(away.x < pos.x);
    const aside = carryAim(pos, home, [{ x: 0, y: 50 }]);
    assert.ok(aside.y < 0);
    const crumbs = layTrail({ x: 0, y: 0 }, { x: 100, y: 0 }, 40);
    assert.equal(crumbs[0].x, 0);
    assert.equal(crumbs[crumbs.length - 1].x, 100);
    assert.ok(crumbs.length >= 3);
});

test("the street view fills the window at the 960 by 540 scale", () => {
    assert.deepEqual(fillView(1920, 1080), { width: 960, height: 540 });
    assert.deepEqual(fillView(1280, 720), { width: 960, height: 540 });
    assert.deepEqual(fillView(2560, 1080), { width: 1280, height: 540 });
    assert.deepEqual(fillView(1440, 900), { width: 960, height: 600 });
    assert.deepEqual(fillView(800, 600), { width: 960, height: 720 });
    assert.deepEqual(fillView(0, 0), { width: 960, height: 540 });
    for (const [w, h] of [[1920, 1080], [2560, 1080], [800, 600], [1000, 800]] as const) {
        const view = fillView(w, h);
        assert.ok(Math.abs(view.width / view.height - w / h) < 0.01);
        assert.ok(view.width >= 960 || view.height >= 540);
    }
});
