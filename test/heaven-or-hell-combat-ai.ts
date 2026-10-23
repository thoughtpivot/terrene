import assert from "node:assert/strict";
import test from "node:test";
import { SPEAR, TUNING, familiarity } from "../src/components/scenes/HeavenOrHell/combat/index.ts";
import type { EnemyDef, ReadTraits, WeaponDef } from "../src/components/scenes/HeavenOrHell/combat/index.ts";
import { DUMMY, Duel, always } from "./heaven-or-hell-combat-kit.ts";

const NEAR = { x: 90, y: 0 };
const DEMON = TUNING.ENEMY_TUNING.lesser_demon;
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

function reader(traits: ReadTraits | "gullible" | "wary" | "adaptive", seed = 1, weapon?: WeaponDef): Duel {
    const d = new Duel({ seed, weapon, enemies: [{ pos: NEAR, traits, passive: true }] });
    d.edit((s) => {
        s.player.hp = s.player.maxHp = 10000;
        s.enemies[0].hp = s.enemies[0].maxHp = 10000;
    });
    return d;
}

/** Starts an M1 and feints once its wind-up has run `ms`. */
function feintAt(d: Duel, ms: number): void {
    d.press("attack");
    d.when((s) => s.player.action.kind === "attack" && s.player.action.t >= ms - 1e-6, 1000);
    d.press("feint");
    assert.equal(d.of("feint").length > 0, true);
}

function baitRate(traits: "gullible" | "wary" | "adaptive", feintMs: number): number {
    let baited = 0;
    for (const seed of SEEDS) {
        const d = reader(traits, seed);
        feintAt(d, feintMs);
        d.wait(50);
        if (d.of("enemyBaited").length > 0) baited += 1;
    }
    return baited / SEEDS.length;
}

/** Waits until both sides are back to neutral and the feint limit allows another feint. */
function settle(d: Duel): void {
    const neutral = () =>
        d.when((s) => {
            const p = s.player;
            const e = s.enemies[0];
            const gap = Math.hypot(p.pos.x - e.pos.x, p.pos.y - e.pos.y);
            return (
                p.action.kind === "idle" &&
                p.feintCooldownMs === 0 &&
                p.chainStep === 0 &&
                e.action.kind === "idle" &&
                !e.brain.read &&
                !e.brain.reaction &&
                gap <= 115
            );
        }, 10000);
    neutral();
    if (d.p.feintsInRow >= TUNING.FEINT_LIMIT) {
        d.press("attack");
        d.when((s) => s.player.feintsInRow === 0 && s.player.action.kind === "idle", 3000);
        neutral();
    }
}

/** One full feint, ready or not. Returns whether the enemy was baited. */
function feintCycle(d: Duel, ms: number): boolean {
    settle(d);
    const before = d.of("enemyBaited").length;
    feintAt(d, ms);
    return d.of("enemyBaited").length > before;
}

test("enemy attacks telegraph orange when parryable and red when not, and wind up for at least 300 ms", () => {
    for (const attack of Object.values(DEMON.attacks)) assert.ok(attack.windupMs >= 300, attack.id);
    const d = new Duel({ seed: 1, enemies: [{ pos: NEAR, traits: DUMMY }] });
    d.held = { blockHeld: true };
    const telegraphs = [d.until("enemyTelegraph"), d.until("enemyTelegraph"), d.until("enemyTelegraph")];
    assert.deepEqual(telegraphs.map((t) => t.attackId), ["claw", "claw", "slam"]);
    assert.deepEqual(telegraphs.map((t) => t.color), ["orange", "orange", "red"]);
    const claw = DEMON.attacks.claw;
    const cycle = claw.windupMs + claw.activeMs + claw.recoveryMs + DEMON.attackIntervalMs;
    const gap = telegraphs[1].atMs - telegraphs[0].atMs;
    assert.ok(gap >= cycle && gap <= cycle + 3 * TUNING.STEP_MS + TUNING.HITSTOP_BLOCK_MS, `gap ${gap}`);
});

test("an unparryable attack goes through a parry but not a block", () => {
    const slammer: EnemyDef = { ...DEMON, pattern: ["slam"] };
    const parry = new Duel({ seed: 1, enemies: [{ pos: NEAR, def: slammer, traits: DUMMY }] });
    parry.until("enemyTelegraph");
    parry.wait(DEMON.attacks.slam.windupMs - 90);
    parry.press("parry");
    parry.until("hit", 400);
    assert.equal(parry.of("parried").length, 0);
    assert.equal(parry.p.hp, 100 - DEMON.attacks.slam.damage);

    const block = new Duel({ seed: 1, enemies: [{ pos: NEAR, def: slammer, traits: DUMMY }] });
    block.held = { blockHeld: true };
    block.until("blocked");
    assert.equal(block.p.hp, 100);
});

test("an enemy that reads a parry parries a real swing", () => {
    const d = reader(always("parry"));
    d.press("attack");
    const read = d.until("enemyRead", 300);
    assert.equal(read.committed, true);
    const parried = d.until("parried", 500);
    assert.equal(parried.attackerId, "player");
    assert.equal(d.p.action.kind === "stun" && d.p.action.reason, "parried");
    assert.equal(d.p.posture, DEMON.parry.postureDamage);
});

test("a feint baits an enemy parry: it whiffs, goes on cooldown and opens a posture window", () => {
    const d = reader(always("parry"));
    feintAt(d, 150);
    d.press("attack");
    assert.equal(d.of("enemyBaited")[0].reaction, "parry");
    const whiff = d.until("enemyParryWhiffed", 500);
    assert.equal(whiff.baited, true);
    assert.equal(d.e.action.kind === "stun" && d.e.action.reason, "parryWhiff");
    assert.ok(d.e.parryCooldownMs > 0);
    const hit = d.until("hit", 600);
    assert.equal(hit.targetId, "enemy_1");
    assert.equal(hit.postureDamage, 10 * TUNING.EXPOSED_POSTURE_MULT);
    assert.equal(d.e.posture, hit.postureDamage);
    assert.equal(d.of("parried").length, 0);
});

test("an enemy that reads a block blocks a real swing, and a feint locks it in that block", () => {
    const real = reader(always("block"));
    real.press("attack");
    const blocked = real.until("blocked", 600);
    assert.equal(blocked.targetId, "enemy_1");
    assert.equal(real.e.posture, 10);

    const d = reader(always("block"));
    feintAt(d, 150);
    assert.equal(d.of("enemyBaited")[0].reaction, "block");
    d.wait(300);
    assert.equal(d.e.action.kind, "block");
    assert.equal(d.of("enemyTelegraph").length, 0);
});

test("an enemy that reads a roll dodges a real swing, and a baited roll can be followed through", () => {
    const real = reader(always("roll"), 1, SPEAR);
    real.press("attack");
    const dodged = real.until("dodged", 600);
    assert.equal(dodged.targetId, "enemy_1");
    assert.equal(real.of("hit").length, 0);

    const d = reader(always("roll"), 1, SPEAR);
    feintAt(d, 150);
    d.press("attack");
    assert.equal(d.of("enemyBaited")[0].reaction, "roll");
    const endLag = d.until("enemyRollEndLag", 600);
    assert.equal(endLag.baited, true);
    const hit = d.until("hit", 600);
    assert.equal(hit.targetId, "enemy_1");
    assert.equal(d.of("dodged").length, 0);
});

test("an enemy that reads a counter trades with a real swing, and a baited counter can be parried", () => {
    const real = reader(always("counter"));
    real.press("attack");
    const traded = real.until("hit", 600, (e) => e.targetId === "enemy_1");
    assert.equal(traded.armored, true);
    real.until("hit", 600, (e) => e.targetId === "player");

    const d = reader(always("counter"));
    feintAt(d, 150);
    d.press("parry");
    assert.equal(d.of("enemyBaited")[0].reaction, "counter");
    const parried = d.until("parried", 600);
    assert.equal(parried.attackerId, "enemy_1");
    assert.equal(d.p.hp, d.p.maxHp);
});

test("a feint before the enemy reads baits nothing", () => {
    const d = reader(always("parry"));
    feintAt(d, 30);
    d.wait(600);
    assert.equal(d.of("enemyBaited").length, 0);
    assert.equal(d.of("enemyRead").length, 0);
    assert.equal(d.of("enemyParryWhiffed").length, 0);
});

test("gullible enemies fall for feints readily", () => {
    assert.ok(baitRate("gullible", 150) >= 0.75, `gullible mid feint ${baitRate("gullible", 150)}`);
    assert.ok(baitRate("gullible", 270) >= 0.75);
});

test("wary enemies don't commit early, so mid feints never bait them and late ones rarely do", () => {
    assert.equal(baitRate("wary", 150), 0);
    const late = baitRate("wary", 270);
    assert.ok(late > 0 && late <= 0.35, `wary late feint ${late}`);
});

test("adaptive enemies learn a repeated feint rhythm, then forget it over time", () => {
    const first: boolean[] = [];
    const learned: boolean[] = [];
    const recovered: boolean[] = [];
    for (const seed of SEEDS) {
        const d = reader("adaptive", seed);
        first.push(feintCycle(d, 150));
        for (let i = 0; i < 5; i++) feintCycle(d, 150);
        learned.push(feintCycle(d, 150));
        d.wait(40000);
        recovered.push(feintCycle(d, 150));
    }
    const rate = (xs: boolean[]) => xs.filter(Boolean).length / xs.length;
    assert.ok(rate(first) >= 0.65, `first ${rate(first)}`);
    assert.ok(rate(learned) <= 0.25, `learned ${rate(learned)}`);
    assert.ok(rate(recovered) >= 0.65, `recovered ${rate(recovered)}`);
});

test("adaptive familiarity tracks identical rhythms, not varied ones, and decays", () => {
    const traits = TUNING.READ_TRAIT_TUNING.adaptive;
    const same = reader("adaptive");
    for (let i = 0; i < 3; i++) feintCycle(same, 150);
    const varied = reader("adaptive");
    for (const ms of [40, 150, 260]) feintCycle(varied, ms);

    const sameFam = familiarity(same.e, "light", 0);
    const variedFam = familiarity(varied.e, "light", 0);
    assert.ok(sameFam < 1 - traits.learnPerRepeat * 1.5, `same ${sameFam}`);
    assert.ok(variedFam > sameFam, `varied ${variedFam} vs same ${sameFam}`);
    assert.equal(familiarity(same.e, "light", 1), 1);

    same.wait(5000);
    assert.ok(familiarity(same.e, "light", 0) > sameFam);
    same.wait(30000);
    assert.equal(familiarity(same.e, "light", 0), 1);

    const gullible = reader("gullible");
    for (let i = 0; i < 3; i++) feintCycle(gullible, 150);
    assert.equal(familiarity(gullible.e, "light", 0), 1);
});
