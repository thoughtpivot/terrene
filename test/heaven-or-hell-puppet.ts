import assert from "node:assert/strict";
import test from "node:test";
import { AurielRig, CLIPS, HOVER } from "../src/components/characters/player/Auriel/Auriel.rig.ts";
import { HERO_EXTRAS, HERO_PARTS } from "../src/components/characters/player/Auriel/Auriel.atlas.ts";
import { WALK_SPEED } from "../src/components/characters/player/Auriel/Auriel.motion.ts";
import {
    blendPoses,
    ClipPlayer,
    clipTime,
    EASE,
    sampleClip,
    sampleKeys,
    spring,
    squashScale,
    stepSpring,
    type Clip,
} from "../src/components/scenes/HeavenOrHell/anim/puppet.ts";

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

test("every ease starts at 0 and ends at 1", () => {
    for (const [name, f] of Object.entries(EASE)) {
        assert.ok(near(f(0), 0), `${name}(0)`);
        assert.ok(near(f(1), 1), `${name}(1)`);
    }
    assert.ok(EASE.outBack(0.7) > 1, "outBack overshoots");
});

test("keys interpolate with the ease of the segment they end", () => {
    const keys = [{ t: 0, v: 0 }, { t: 1, v: 10, ease: "linear" as const }, { t: 2, v: 0, ease: "step" as const }];
    assert.equal(sampleKeys(keys, -1), 0);
    assert.ok(near(sampleKeys(keys, 0.25), 2.5));
    assert.equal(sampleKeys(keys, 1.5), 10, "a step holds until its key");
    assert.equal(sampleKeys(keys, 2), 0);
    assert.equal(sampleKeys(keys, 9), 0);
    assert.equal(sampleKeys([], 1), 0);
});

test("looping clips wrap and one-shots hold their last frame", () => {
    const loop: Clip = { name: "l", duration: 2, loop: true, channels: {} };
    const once: Clip = { ...loop, loop: false };
    assert.ok(near(clipTime(loop, 5), 1));
    assert.ok(near(clipTime(loop, -0.5), 1.5));
    assert.equal(clipTime(once, 5), 2);
});

test("blending treats a missing scale as 1 and anything else as 0", () => {
    const pose = blendPoses({ "wing.sx": 2, "body.y": 4 }, {}, 0.5);
    assert.ok(near(pose["wing.sx"], 1.5));
    assert.ok(near(pose["body.y"], 2));
});

test("the walk loops seamlessly: its first and last poses match", () => {
    for (const clip of [CLIPS.idle, CLIPS.walk]) {
        const a = sampleClip(clip, 0);
        const b = sampleClip(clip, clip.duration - 1e-9);
        for (const k of Object.keys(a)) assert.ok(near(a[k], b[k], 1e-3), `${clip.name} ${k}`);
    }
});

test("the clip player cross-fades without a pop", () => {
    const a: Clip = { name: "a", duration: 1, loop: true, channels: { x: [{ t: 0, v: 0 }, { t: 1, v: 0 }] } };
    const b: Clip = { name: "b", duration: 1, loop: true, channels: { x: [{ t: 0, v: 10 }, { t: 1, v: 10 }] } };
    const p = new ClipPlayer(a);
    p.update(0.5);
    p.play(b, 0.2);
    const first = p.update(0.0001).x;
    assert.ok(first < 0.1, `starts at the old pose, got ${first}`);
    const mid = p.update(0.1).x;
    assert.ok(mid > 2 && mid < 8, `half way, got ${mid}`);
    assert.ok(near(p.update(0.2).x, 10));
    p.play(b);
    assert.ok(near(p.update(0.01).x, 10), "playing the same clip again does not restart a fade");
    const once = new ClipPlayer({ ...a, loop: false });
    once.update(2);
    assert.ok(once.finished);
});

test("springs settle on the target, overshoot when underdamped, and survive long frames", () => {
    let s = spring();
    let peak = 0;
    for (let i = 0; i < 240; i++) {
        s = stepSpring(s, 1, 3, 0.3, 1 / 60);
        peak = Math.max(peak, s.x);
    }
    assert.ok(peak > 1.2, "underdamped overshoots");
    assert.ok(near(s.x, 1, 0.02));
    const big = stepSpring(spring(), 1, 8, 0.5, 0.5);
    assert.ok(Number.isFinite(big.x) && Math.abs(big.x) < 3);
});

test("squash and stretch keeps the volume", () => {
    for (const x of [-0.3, 0, 0.2, 0.45, 2]) {
        const { sx, sy } = squashScale({ x, v: 0 });
        assert.ok(near(sx * sy, 1));
    }
    assert.ok(squashScale({ x: 2, v: 0 }).sy <= 1.45 + 1e-9, "clamped");
});

const idle = { vx: 0, vy: 0, dashing: false, aim: null, facing: 2 };

test("the rig draws every part from the atlas, wings behind when facing the camera", () => {
    const rig = new AurielRig();
    const parts = rig.update(1 / 60, idle);
    const names = parts.map((p) => p.part);
    assert.deepEqual(new Set(names), new Set(["shadow", "wingL", "wingR", "hem", "torso", "head", "arm", "halo"]));
    assert.equal(names[0], "shadow");
    assert.equal(names[names.length - 1], "halo");
    assert.ok(names.indexOf("wingL") < names.indexOf("torso"), "facing south the wings are behind the body");
    for (const p of parts) {
        const known = p.frame in HERO_PARTS || p.frame in HERO_EXTRAS;
        assert.ok(known, `${p.frame} is in the atlas`);
        assert.ok(p.w > 0 && p.h > 0);
    }

    const north = new AurielRig();
    const back = north.update(1 / 60, { ...idle, facing: 6 }).map((p) => p.part);
    assert.ok(back.indexOf("wingL") > back.indexOf("torso"), "facing north the wings are in front");
});

test("the body parts stack: hem, torso and head meet at the cuts", () => {
    const rig = new AurielRig();
    const parts = rig.update(1 / 60, idle);
    const get = (n: string) => parts.find((p) => p.part === n)!;
    const hem = get("hem");
    const torso = get("torso");
    const head = get("head");
    // in root space: hem and torso share the waist origin; the head's origin is the neck
    const hemBottom = hem.local.y + hem.dy + hem.h;
    const torsoBottom = torso.local.y + torso.dy + torso.h;
    const headBottom = head.local.y + head.dy + head.h;
    assert.ok(hemBottom > torsoBottom && torsoBottom > headBottom, "hem below torso below head");
    assert.ok(torso.local.y + torso.dy < hem.local.y + hem.dy, "torso starts above the hem");
    assert.ok(Math.abs(hemBottom - (-hem.root.y - HOVER)) < 8, "the hem reaches down to the hover height");
});

test("facing west mirrors the south-east view", () => {
    const rig = new AurielRig();
    const parts = rig.update(1 / 60, { ...idle, facing: 4 });
    assert.equal(rig.view, "se");
    assert.equal(rig.flip, true);
    assert.ok(parts.find((p) => p.part === "torso")!.root.sx < 0);
});

test("walking leans into the motion and the robe and halo lag behind", () => {
    const rig = new AurielRig();
    rig.update(1 / 60, { ...idle, facing: 0 });
    let parts = rig.update(1 / 60, { ...idle, facing: 0 });
    for (let i = 0; i < 6; i++) parts = rig.update(1 / 60, { vx: WALK_SPEED, vy: 0, dashing: false, aim: null, facing: 0 });
    const torso = parts.find((p) => p.part === "torso")!;
    const hem = parts.find((p) => p.part === "hem")!;
    const halo = parts.find((p) => p.part === "halo")!;
    assert.ok(torso.root.rot > 0.02, "leans forward");
    assert.ok(hem.local.rot < 0, "the robe trails");
    const head = parts.find((p) => p.part === "head")!;
    assert.ok(halo.local.x > head.local.x, "the halo has not caught up with the head");
    assert.equal(rig.player.clip.name, "walk");
});

test("a facing change pops the squash spring", () => {
    const rig = new AurielRig();
    rig.update(1 / 60, idle);
    const before = rig.update(1 / 60, idle).find((p) => p.part === "torso")!.root.sy;
    let after = before;
    for (let i = 0; i < 3; i++) after = rig.update(1 / 60, { ...idle, facing: 6 }).find((p) => p.part === "torso")!.root.sy;
    assert.ok(after > before + 0.01);
});
