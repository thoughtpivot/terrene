import assert from "node:assert/strict";
import test from "node:test";
import {
    KNIFE,
    SPEAR,
    STARTING_WEAPONS,
    SWORD,
    TUNING,
    clearHaloDim,
    createCombat,
    healPlayer,
    lightSpec,
    revivePlayer,
    setThroneAnswerReady,
    spendGrace,
    tick,
} from "../src/components/scenes/HeavenOrHell/combat/index.ts";
import type { CombatSetup, WeaponDef } from "../src/components/scenes/HeavenOrHell/combat/index.ts";
import { DUMMY, Duel, always } from "./heaven-or-hell-combat-kit.ts";

const NEAR = { x: 90, y: 0 };
const STEP = TUNING.STEP_MS;

/** A demon that starts its claw on the first frame and never reads the hero. */
function clawing(extra: Partial<CombatSetup> = {}): Duel {
    return new Duel({ seed: 1, enemies: [{ pos: NEAR, traits: DUMMY }], ...extra });
}

/** A passive training dummy with plenty of HP. */
function dummy(weapon: WeaponDef = SWORD): Duel {
    const d = new Duel({ seed: 1, weapon, enemies: [{ pos: NEAR, traits: DUMMY, passive: true }] });
    d.edit((s) => {
        s.enemies[0].hp = 1000;
        s.enemies[0].maxHp = 1000;
    });
    return d;
}

test("tick is pure, fixed-step and buffers presses shorter than a step", () => {
    const start = createCombat({ seed: 7, enemies: [{ pos: NEAR, traits: DUMMY, passive: true }] });
    const snapshot = structuredClone(start);

    const short = tick(start, 10, { pressed: { attack: true } });
    assert.deepEqual(start, snapshot);
    assert.equal(short.state.timeMs, 0);
    assert.equal(short.events.length, 0);
    assert.equal(short.state.player.buffer?.action, "attack");

    const next = tick(short.state, 10);
    assert.ok(Math.abs(next.state.timeMs - STEP) < 1e-9);
    assert.equal(next.events[0]?.type, "attackStarted");

    const long = tick(start, 100);
    assert.ok(Math.abs(long.state.timeMs - 6 * STEP) < 1e-9);
    const stall = tick(start, 1000);
    assert.ok(Math.abs(stall.state.timeMs - TUNING.MAX_STEPS_PER_TICK * STEP) < 1e-9);
});

test("the same seed and inputs replay the same fight", () => {
    const script = (seed: number) => {
        const d = new Duel({ seed, enemies: [{ pos: NEAR, traits: "gullible" }] });
        for (let i = 0; i < 120; i++) d.frame(i % 20 === 0 ? ["attack"] : i % 20 === 8 ? ["feint"] : []);
        return JSON.stringify(d.events);
    };
    assert.equal(script(42), script(42));
});

test("a parry inside its window parries, stuns the attacker and resets the cooldown", () => {
    const d = clawing();
    const telegraph = d.until("enemyTelegraph");
    assert.equal(telegraph.attackId, "claw");
    d.wait(360);
    d.press("parry");
    const parried = d.until("parried", 300);
    assert.equal(parried.defenderId, "player");
    assert.equal(parried.attackerId, "enemy_1");
    assert.equal(parried.auto, false);
    assert.equal(parried.hitStopMs, TUNING.HITSTOP_PARRY_MS);
    assert.deepEqual(parried.shake, TUNING.SHAKE_PARRY);
    assert.equal(d.p.hp, 100);
    assert.equal(d.p.parryCooldownMs, 0);
    assert.equal(d.p.autoParryMs, TUNING.AUTO_PARRY_MS);
    assert.equal(d.e.action.kind, "stun");
    assert.equal(d.e.action.kind === "stun" && d.e.action.reason, "parried");
    assert.equal(d.e.posture, SWORD.parry.postureDamage);
});

test("a parry restores the defender's posture", () => {
    const d = clawing();
    d.edit((s) => {
        s.player.posture = 50;
        s.player.postureRegenDelayMs = 10000;
    });
    d.until("enemyTelegraph");
    d.wait(360);
    d.press("parry");
    d.until("parried", 300);
    assert.ok(Math.abs(d.p.posture - (50 - SWORD.parry.postureRestore)) < 1);
});

test("a missed parry leaves you in a shaky block, and a hit on it costs extra posture", () => {
    const d = clawing();
    d.until("enemyTelegraph");
    d.wait(150);
    d.press("parry");
    d.until("parryMissed", 300);
    assert.equal(d.p.action.kind, "block");
    const blocked = d.until("blocked", 400);
    assert.equal(blocked.shaky, true);
    assert.equal(d.p.hp, 100);
    assert.equal(blocked.postureDamage, 18 * TUNING.SHAKY_BLOCK_POSTURE_MULT);
    assert.equal(d.p.action.kind === "stun" && d.p.action.reason, "shakyBlock");
});

test("a parry far too early is over before the hit, which lands", () => {
    const d = clawing();
    d.until("enemyTelegraph");
    d.press("parry");
    const hit = d.until("hit", 600);
    assert.equal(hit.targetId, "player");
    assert.equal(d.p.hp, 88);
});

test("the parry cooldown blocks a second parry until 1.2 s have passed", () => {
    const d = new Duel({ seed: 1 });
    d.press("parry");
    assert.equal(d.p.action.kind, "parry");
    d.wait(500);
    d.press("parry");
    assert.notEqual(d.p.action.kind, "parry");
    d.until("inputDropped", 300);
    d.when((s) => s.player.parryCooldownMs === 0, 1000);
    d.press("parry");
    assert.equal(d.p.action.kind, "parry");
});

test("auto-parry catches a second hit just after a successful parry", () => {
    const d = new Duel({ seed: 1, enemies: [{ pos: NEAR, traits: DUMMY }, { pos: { x: 90, y: 12 }, traits: DUMMY }] });
    d.edit((s) => (s.enemies[1].brain.attackCooldownMs = 200));
    d.until("enemyTelegraph");
    d.wait(360);
    d.press("parry");
    const first = d.until("parried", 300);
    assert.equal(first.attackerId, "enemy_1");
    const second = d.until("parried", 600);
    assert.equal(second.attackerId, "enemy_2");
    assert.equal(second.auto, true);
    assert.equal(d.p.hp, 100);
});

test("a hit on a held block becomes posture damage instead of HP damage", () => {
    const d = clawing();
    d.held = { blockHeld: true };
    const blocked = d.until("blocked");
    assert.equal(blocked.shaky, false);
    assert.equal(blocked.postureDamage, 18);
    assert.equal(d.p.hp, 100);
    assert.equal(d.p.posture, 18);
    assert.equal(blocked.hitStopMs, TUNING.HITSTOP_BLOCK_MS);
});

test("filling posture means the next blocked hit guard-breaks you for about 1.05 s", () => {
    const d = clawing();
    d.held = { blockHeld: true };
    d.edit((s) => (s.player.posture = 90));
    d.until("blocked");
    assert.equal(d.p.posture, 100);
    assert.equal(d.of("postureFull").length, 1);
    const broken = d.until("guardBroken", 4000);
    assert.equal(broken.targetId, "player");
    assert.equal(broken.stunMs, TUNING.GUARD_BREAK_STUN_MS);
    assert.equal(broken.hitStopMs, TUNING.HITSTOP_GUARD_BREAK_MS);
    assert.deepEqual(broken.shake, TUNING.SHAKE_GUARD_BREAK);
    assert.equal(d.p.hp, 100);
    assert.equal(d.p.posture, 0);
    d.wait(TUNING.HITSTOP_GUARD_BREAK_MS + 1000);
    assert.equal(d.p.action.kind === "stun" && d.p.action.reason, "guardBreak");
    d.wait(100);
    assert.equal(d.p.action.kind, "block");
});

test("posture regenerates after a delay, but not while blocking or sprinting", () => {
    const setup = () => {
        const d = new Duel({ seed: 1 });
        d.edit((s) => {
            s.player.posture = 50;
            s.player.postureRegenDelayMs = TUNING.POSTURE_REGEN_DELAY_MS;
        });
        return d;
    };
    const idle = setup();
    idle.wait(500);
    assert.equal(idle.p.posture, 50);
    idle.wait(500);
    assert.ok(Math.abs(idle.p.posture - (50 - TUNING.POSTURE_REGEN_PER_SEC * 0.4)) < 0.5);

    const blocking = setup();
    blocking.held = { blockHeld: true };
    blocking.wait(1500);
    assert.equal(blocking.p.posture, 50);

    const sprinting = setup();
    sprinting.held = { sprint: true, move: { x: 0, y: 1 } };
    sprinting.wait(1500);
    assert.equal(sprinting.p.posture, 50);
    assert.ok(sprinting.p.pos.y > 400);
});

test("a roll's i-frames dodge a hit and its end lag does not", () => {
    const dodge = clawing();
    dodge.until("enemyTelegraph");
    dodge.wait(350);
    dodge.press("roll");
    const dodged = dodge.until("dodged", 300);
    assert.equal(dodged.targetId, "player");
    assert.equal(dodge.p.hp, 100);

    const late = clawing();
    late.until("enemyTelegraph");
    late.wait(150);
    late.press("roll");
    late.until("hit", 400);
    assert.equal(late.p.hp, 88);
});

test("the roll has a cooldown", () => {
    const d = new Duel({ seed: 1 });
    d.press("roll");
    assert.equal(d.of("rollStarted").length, 1);
    d.wait(TUNING.ROLL_MS);
    d.press("roll");
    d.until("inputDropped", 300);
    assert.equal(d.of("rollStarted").length, 1);
    d.when((s) => s.player.rollCooldownMs === 0, 1500);
    d.press("roll");
    assert.equal(d.of("rollStarted").length, 2);
});

test("the M1 chain runs three hits then a flourish, then starts over", () => {
    const d = dummy();
    for (let i = 0; i < 5; i++) {
        d.press("attack");
        d.when((s) => s.player.action.kind === "idle", 2000);
    }
    const starts = d.of("attackStarted");
    assert.deepEqual(starts.map((e) => e.kind), ["light", "light", "light", "flourish", "light"]);
    assert.deepEqual(starts.map((e) => e.chainStep), [0, 1, 2, 3, 0]);
    const hits = d.of("hit");
    assert.equal(hits[0].hitStopMs, TUNING.HITSTOP_LIGHT_MS);
    assert.deepEqual(hits[0].shake, TUNING.SHAKE_LIGHT);
});

test("the flourish knocks back and stuns, and a Hymn cast cancels its end lag", () => {
    const d = dummy();
    for (let i = 0; i < 3; i++) {
        d.press("attack");
        d.when((s) => s.player.action.kind === "idle", 2000);
    }
    const before = d.e.pos.x;
    d.press("attack");
    const hit = d.until("hit", 1000);
    assert.equal(hit.kind, "flourish");
    assert.equal(Math.round(hit.knockback.x), SWORD.flourish.knockback);
    assert.ok(d.e.pos.x - before >= (SWORD.flourish.knockback ?? 0) - 1);
    assert.equal(d.e.action.kind === "stun" && d.e.action.reason, "flourish");

    d.when((s) => s.player.action.kind === "attack" && s.player.action.t > s.player.action.spec.windupMs + s.player.action.spec.activeMs, 500);
    d.press("attack");
    d.until("inputDropped", 300);
    assert.equal(d.p.action.kind, "attack");
    d.press("cast");
    const cast = d.of("castRequested")[0];
    assert.equal(cast.cancelledFlourish, true);
    assert.equal(d.p.action.kind, "idle");
});

test("the chain drops back to its first hit if you wait too long", () => {
    const d = dummy();
    d.press("attack");
    d.when((s) => s.player.action.kind === "idle", 2000);
    assert.equal(d.p.chainStep, 1);
    d.wait(TUNING.CHAIN_RESET_MS + 50);
    d.press("attack");
    assert.equal(d.of("attackStarted")[1].chainStep, 0);
});

test("the critical has its own cooldown and can't be feinted", () => {
    const d = dummy();
    d.press("critical");
    assert.equal(d.of("attackStarted")[0].kind, "critical");
    d.wait(50);
    d.press("feint");
    assert.equal(d.of("feintRejected")[0].reason, "unfeintable");
    const hit = d.until("hit", 1000);
    assert.equal(hit.kind, "critical");
    assert.equal(hit.hitStopMs, TUNING.HITSTOP_CRITICAL_MS);
    assert.deepEqual(hit.shake, TUNING.SHAKE_CRITICAL);
    d.when((s) => s.player.action.kind === "idle", 2000);
    d.press("critical");
    d.until("inputDropped", 300);
    assert.equal(d.of("attackStarted").length, 1);
    d.when((s) => s.player.criticalCooldownMs === 0, SWORD.critical.cooldownMs);
    d.press("critical");
    assert.equal(d.of("attackStarted").length, 2);
});

test("right-click feints a wind-up, and does nothing once the swing is active", () => {
    const d = dummy();
    d.press("attack");
    d.wait(100);
    d.press("feint");
    const feint = d.of("feint")[0];
    assert.ok(feint.windupElapsedMs >= 100);
    assert.equal(d.p.action.kind, "feintRecovery");
    d.wait(600);
    assert.equal(d.of("hit").length, 0);
    assert.equal(d.p.chainStep, 0);

    d.press("attack");
    d.when((s) => s.player.action.kind === "attack" && s.player.action.activeStarted, 600);
    d.press("feint");
    d.wait(100);
    assert.equal(d.of("feintRejected")[0].reason, "notInWindup");
    assert.equal(d.of("feint").length, 1);
    assert.equal(d.of("hit").length, 1);
});

test("feints have a cooldown and a limit in a row", () => {
    const d = dummy();
    const swingAndFeint = () => {
        d.when((s) => s.player.action.kind === "idle", 1000);
        d.press("attack");
        d.wait(50);
        d.press("feint");
    };
    swingAndFeint();
    assert.equal(d.of("feint").length, 1);
    swingAndFeint();
    assert.equal(d.of("feintRejected")[0].reason, "cooldown");
    // That swing went through to its active frames, which resets the limit.
    d.until("hit", 600);
    assert.equal(d.p.feintsInRow, 0);

    for (let i = 0; i < TUNING.FEINT_LIMIT; i++) {
        d.wait(TUNING.FEINT_COOLDOWN_MS);
        swingAndFeint();
    }
    assert.equal(d.of("feint").length, 1 + TUNING.FEINT_LIMIT);
    d.wait(TUNING.FEINT_COOLDOWN_MS);
    swingAndFeint();
    assert.equal(d.of("feintRejected")[1].reason, "limit");
    assert.equal(d.of("feint").length, 1 + TUNING.FEINT_LIMIT);

    d.until("hit", 600);
    assert.equal(d.p.feintsInRow, 0);
    d.wait(TUNING.FEINT_COOLDOWN_MS);
    swingAndFeint();
    assert.equal(d.of("feint").length, 2 + TUNING.FEINT_LIMIT);
});

test("a press up to 150 ms early fires on the first free frame, and an earlier one is dropped", () => {
    const swing = SWORD.light.windupFrames + SWORD.light.activeFrames + SWORD.light.recoveryFrames;
    const swingMs = swing * TUNING.FRAME_MS;

    const buffered = new Duel({ seed: 1 });
    buffered.press("attack");
    const first = buffered.of("attackStarted")[0].atMs;
    buffered.wait(swingMs - 140);
    buffered.press("attack");
    buffered.until("attackStarted", 300);
    const second = buffered.of("attackStarted")[1].atMs;
    assert.ok(Math.abs(second - (first + swingMs)) <= STEP + 1e-6, `second swing at ${second - first} ms`);
    assert.equal(buffered.of("inputDropped").length, 0);

    const early = new Duel({ seed: 1 });
    early.press("attack");
    early.wait(swingMs - 200);
    early.press("attack");
    early.wait(400);
    assert.equal(early.of("attackStarted").length, 1);
    assert.equal(early.of("inputDropped")[0].action, "attack");
});

test("Outcry needs 40 Fervour, spends it and pushes enemies back", () => {
    const low = dummy();
    low.edit((s) => (s.player.fervour = 30));
    low.press("outcry");
    low.wait(200);
    assert.equal(low.of("attackStarted").length, 0);
    assert.equal(low.of("inputDropped")[0].action, "outcry");

    const d = dummy();
    d.edit((s) => {
        s.player.fervour = 60;
        s.player.fervourDecayDelayMs = 10000;
    });
    d.press("outcry");
    assert.equal(d.of("attackStarted")[0].kind, "outcry");
    assert.equal(d.p.fervour, 20);
    const outcry = d.until("outcry", 500);
    assert.equal(outcry.outcome, "hit");
    assert.deepEqual(outcry.enemyIds, ["enemy_1"]);
    assert.ok(d.e.pos.x >= NEAR.x + TUNING.OUTCRY_PUSH - 1);
    assert.equal(d.e.action.kind === "stun" && d.e.action.reason, "outcryStagger");
});

test("a whiffed Outcry stuns you", () => {
    const d = new Duel({ seed: 1 });
    d.edit((s) => (s.player.fervour = 50));
    d.press("outcry");
    const outcry = d.until("outcry", 500);
    assert.equal(outcry.outcome, "whiffed");
    assert.equal(d.p.action.kind === "stun" && d.p.action.reason, "outcryWhiff");
    assert.equal(d.p.action.kind === "stun" && d.p.action.durationMs, TUNING.OUTCRY_WHIFF_STUN_MS);
});

test("a parried Outcry stuns you", () => {
    const d = new Duel({ seed: 1, enemies: [{ pos: NEAR, traits: always("parry"), passive: true }] });
    d.edit((s) => (s.player.fervour = 50));
    d.press("outcry");
    const outcry = d.until("outcry", 500);
    assert.equal(outcry.outcome, "parried");
    assert.equal(d.p.action.kind === "stun" && d.p.action.reason, "outcryParried");
    assert.equal(d.p.action.kind === "stun" && d.p.action.durationMs, TUNING.OUTCRY_PARRIED_STUN_MS);
});

test("Outcry breaks out of hitstun", () => {
    const d = dummy();
    d.edit((s) => {
        s.player.fervour = 50;
        s.player.action = { kind: "stun", t: 0, durationMs: 350, reason: "hit" };
    });
    d.press("outcry");
    assert.equal(d.of("attackStarted")[0]?.kind, "outcry");
});

test("Fervour builds on hits and decays, and in combat Grace only regenerates with Fervour", () => {
    const d = dummy();
    d.press("attack");
    d.until("hit", 600);
    assert.equal(d.p.fervour, TUNING.FERVOUR_ON_HIT_DEALT);
    d.wait(TUNING.FERVOUR_DECAY_DELAY_MS - 100);
    assert.equal(d.p.fervour, TUNING.FERVOUR_ON_HIT_DEALT);
    d.wait(600);
    assert.ok(d.p.fervour < TUNING.FERVOUR_ON_HIT_DEALT);

    const g = new Duel({ seed: 1 });
    g.edit((s) => {
        s.player.grace = 50;
        s.player.fervour = 0;
        s.player.lastCombatAtMs = 0;
    });
    g.wait(1000);
    assert.equal(g.p.grace, 50);
    g.edit((s) => {
        s.player.fervour = 30;
        s.player.fervourDecayDelayMs = 10000;
    });
    g.wait(1000);
    assert.ok(Math.abs(g.p.grace - (50 + TUNING.GRACE_REGEN_IN_COMBAT_PER_SEC)) < 0.2);
    g.edit((s) => (s.player.lastCombatAtMs = -1e9));
    g.wait(1000);
    assert.ok(Math.abs(g.p.grace - (54 + TUNING.GRACE_REGEN_OUT_OF_COMBAT_PER_SEC)) < 0.2);

    assert.equal(spendGrace(g.state, 1000), null);
    assert.ok(Math.abs(spendGrace(g.state, 20)!.player.grace - (g.p.grace - 20)) < 1e-9);
});

test("the first strike dims the halo, the second casts you out", () => {
    const d = clawing();
    d.edit((s) => (s.player.hp = 5));
    const down = d.until("struckDown");
    assert.equal(down.livesLeft, 1);
    const types = d.events.map((e) => e.type);
    assert.ok(types.lastIndexOf("hit") < types.indexOf("struckDown"));
    assert.equal(d.p.action.kind, "down");
    assert.equal(d.p.haloDimmed, true);
    const telegraphs = d.of("enemyTelegraph").length;
    d.wait(3000);
    assert.equal(d.of("enemyTelegraph").length, telegraphs);

    const dimmedCap = Math.round(TUNING.PLAYER_MAX_HP * (1 - TUNING.HALO_DIM_FRACTION));
    d.state = revivePlayer(d.state);
    assert.equal(d.p.action.kind, "idle");
    assert.equal(d.p.hp, dimmedCap);
    d.edit((s) => (s.player.hp = 10));
    assert.equal(healPlayer(d.state, 500).player.hp, dimmedCap);
    assert.equal(healPlayer(clearHaloDim(d.state), 500).player.hp, TUNING.PLAYER_MAX_HP);

    d.edit((s) => (s.player.hp = 5));
    d.until("castOut", 5000);
    assert.equal(d.p.lives, 0);
    assert.equal(d.p.action.kind, "dead");
});

test("the Throne's answer heals instead of costing a life", () => {
    const d = clawing();
    d.state = setThroneAnswerReady(d.state, true);
    d.edit((s) => (s.player.hp = 5));
    d.until("throneAnswered");
    assert.equal(d.p.lives, TUNING.PLAYER_LIVES);
    assert.equal(d.p.hp, TUNING.PLAYER_MAX_HP);
    assert.equal(d.p.throneAnswerReady, false);
    assert.equal(d.of("struckDown").length, 0);
});

test("the starting weapons are the basic sword, spear and knife, each fully described", () => {
    assert.deepEqual(STARTING_WEAPONS.map((w) => w.id), ["sword", "spear", "knife"]);
    for (const w of STARTING_WEAPONS) {
        assert.equal(w.tier, "basic");
        assert.ok(w.chainLength >= 3);
        assert.ok(w.critical.cooldownMs > 0 && w.critical.name.length > 0);
        assert.ok(w.parry.windowMs > 0 && w.parry.postureDamage > 0);
        for (const move of [w.light, w.flourish, w.critical]) {
            assert.ok(move.windupFrames > 0 && move.activeFrames > 0 && move.recoveryFrames > 0);
            assert.ok(move.reach > 0 && move.postureDamage > 0);
        }
    }
    assert.ok(lightSpec(KNIFE, 0).windupMs < lightSpec(SWORD, 0).windupMs);
    assert.ok(lightSpec(SWORD, 0).windupMs < lightSpec(SPEAR, 0).windupMs);
    assert.ok(SPEAR.light.reach > SWORD.light.reach && SWORD.light.reach > KNIFE.light.reach);
    assert.equal(KNIFE.chainLength, 4);
});

test("a special weapon is just more data", () => {
    const flaming: WeaponDef = { ...SWORD, id: "flaming_sword", name: "Flaming Sword", tier: "special", light: { ...SWORD.light, damage: 11 } };
    const d = dummy(flaming);
    d.press("attack");
    assert.equal(d.of("attackStarted")[0].attackId, "flaming_sword_m1_1");
    assert.equal(d.until("hit", 600).damage, 11);
});

test("the spear's critical lunges forward and the knife's lands three times", () => {
    const spear = new Duel({ seed: 1, weapon: SPEAR, enemies: [{ pos: { x: 260, y: 0 }, traits: DUMMY, passive: true }] });
    spear.press("critical");
    spear.when((s) => s.player.action.kind === "idle", 2000);
    assert.ok(Math.abs(spear.p.pos.x - (SPEAR.critical.lunge ?? 0)) < 1);
    assert.equal(spear.of("hit").length, 1);

    const knife = dummy(KNIFE);
    knife.press("critical");
    knife.when((s) => s.player.action.kind === "idle", 2000);
    assert.equal(knife.of("hit").length, 3);
});
