import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { contrast, mix, hex } from "../src/components/scenes/HeavenOrHell/ui/color";
import { MAX_CORRUPTION, TIER_NAMES, haloRed, themeFor, UiTheme } from "../src/components/scenes/HeavenOrHell/ui/theme";
import {
    BarTracker,
    OUTCRY_COST,
    REF_H,
    REF_W,
    ToastQueue,
    cooldownView,
    fervourView,
    formatSeconds,
    haloState,
    hpView,
    hudLayout,
    postureView,
    ratio,
    tierView,
    toastAlpha,
    typewriter,
} from "../src/components/scenes/HeavenOrHell/ui/hudState";

const EFFECTS = ["veins", "tarnish", "cracks", "chips", "embers", "shimmer", "flicker", "heat"] as const;

function samples(): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    for (let c = 0; c <= MAX_CORRUPTION + 1e-9; c += 0.1) {
        for (const s of [0, 10, 25, 50, 75, 90, 100]) out.push([c, s]);
    }
    return out;
}

/** The panel colour a reader actually sees: the fill composited over the near-black world. */
function seenPanel(t: UiTheme) {
    return mix(hex("#0e0e10"), t.panel, t.panelAlpha);
}

describe("themeFor", () => {
    it("is calm Heaven at Tier 0 with no Hell effects", () => {
        const t = themeFor(0, 0);
        assert.equal(t.tier, 0);
        assert.equal(t.hell, 0);
        for (const key of EFFECTS) assert.equal(t[key], 0, key);
        assert.equal(t.goldLeft, 1);
        assert.ok(t.gold.r > t.gold.b + 60, "Tier 0 lines are gold");
    });

    it("is mostly Hell at Tier 5 with only fragments of gold", () => {
        const t = themeFor(5, 0);
        assert.equal(t.tier, 5);
        assert.equal(t.hell, 1);
        for (const key of EFFECTS) assert.equal(t[key], 1, key);
        assert.ok(t.goldLeft > 0 && t.goldLeft < 0.25);
        assert.ok(t.panel.r > t.panel.g * 1.5, "panels pull toward red-black");
        assert.ok(t.gold.g < t.gold.r * 0.5, "gold has tarnished to rust");
    });

    it("clamps out-of-range and non-finite input", () => {
        assert.deepEqual(themeFor(-3, -10), themeFor(0, 0));
        assert.deepEqual(themeFor(9, 400), themeFor(5, 100));
        assert.deepEqual(themeFor(Number.NaN, Number.NaN), themeFor(0, 0));
    });

    it("rises monotonically with corruption", () => {
        let prev = themeFor(0, 0);
        for (let c = 0.05; c <= 5; c += 0.05) {
            const t = themeFor(c, 0);
            for (const key of EFFECTS) assert.ok(t[key] >= prev[key] - 1e-12, `${key} at ${c}`);
            assert.ok(t.goldLeft <= prev.goldLeft + 1e-12);
            assert.ok(t.hell >= prev.hell);
            prev = t;
        }
    });

    it("interpolates smoothly: a small step never jumps a token", () => {
        const step = 0.02;
        for (let c = 0; c < 5; c += step) {
            const a = themeFor(c, 40);
            const b = themeFor(c + step, 40);
            for (const key of EFFECTS) assert.ok(Math.abs(a[key] - b[key]) < 0.03, `${key} jumps at ${c}`);
            for (const key of ["gold", "panel", "glow", "text", "heading"] as const) {
                const d = Math.abs(a[key].r - b[key].r) + Math.abs(a[key].g - b[key].g) + Math.abs(a[key].b - b[key].b);
                assert.ok(d < 6, `${key} jumps at ${c}`);
            }
        }
    });

    it("keeps text readable on panels at every tier and stain", () => {
        for (const [c, s] of samples()) {
            const t = themeFor(c, s);
            const bg = seenPanel(t);
            assert.ok(contrast(t.text, bg) >= 12, `text at ${c},${s}`);
            assert.ok(contrast(t.textDim, bg) >= 4.5, `dim text at ${c},${s}`);
            assert.ok(contrast(t.heading, bg) >= 7, `heading at ${c},${s}`);
        }
    });

    it("keeps every bar fill clear of its track at every tier", () => {
        for (const [c, s] of samples()) {
            const t = themeFor(c, s);
            for (const key of ["hp", "posture", "grace", "fervour", "sanctity"] as const) {
                assert.ok(contrast(t.bars[key].lo, t.bars.track) >= 3, `${key} at ${c}`);
            }
        }
    });

    it("keeps the warning and danger roles fixed while the palette shifts", () => {
        assert.deepEqual(themeFor(0, 0).warning, themeFor(5, 100).warning);
        assert.deepEqual(themeFor(0, 0).danger, themeFor(5, 100).danger);
    });

    it("scopes Stain to the player's own accents", () => {
        const pure = themeFor(2, 0);
        const stained = themeFor(2, 80);
        assert.equal(pure.veins, stained.veins, "Stain does not change world corruption effects");
        assert.equal(pure.personal.veins, 0);
        assert.ok(stained.personal.veins > 0.7);
        assert.ok(stained.personal.red > 0.9);
    });
});

describe("haloRed", () => {
    it("follows the progression doc's thresholds", () => {
        assert.equal(haloRed(0), 0);
        assert.ok(haloRed(24) < 0.1);
        assert.equal(haloRed(50), 0.5);
        assert.ok(Math.abs(haloRed(75) - 0.9) < 1e-9);
        assert.equal(haloRed(100), 1);
    });
});

describe("haloState", () => {
    it("reads lives as brightness only", () => {
        assert.equal(haloState(2, 0).brightness, 1);
        assert.equal(haloState(1, 0).brightness, 0.5);
        assert.equal(haloState(1, 0).dimmed, true);
        assert.equal(haloState(0, 0).castOut, true);
        assert.equal(haloState(1, 60).brightness, haloState(1, 0).brightness, "Stain never dims the halo");
    });

    it("reads Stain as cracks and colour only", () => {
        assert.equal(haloState(2, 0).crackCount, 0);
        assert.equal(haloState(2, 0).mark, "pure");
        assert.equal(haloState(2, 1).mark, "hairline");
        assert.ok(haloState(2, 1).crackCount >= 1);
        assert.equal(haloState(2, 25).mark, "cracked");
        assert.equal(haloState(2, 50).embers, true);
        assert.equal(haloState(2, 49).embers, false);
        assert.equal(haloState(2, 75).flicker, true);
        assert.equal(haloState(2, 100).shattered, true);
        assert.equal(haloState(2, 100).mark, "fall");
        assert.equal(haloState(1, 30).red, haloState(2, 30).red, "lives never redden the halo");
    });

    it("cracks deepen and multiply as Stain grows", () => {
        let prev = haloState(2, 0);
        for (let s = 1; s <= 100; s++) {
            const h = haloState(2, s);
            assert.ok(h.crackCount >= prev.crackCount);
            assert.ok(h.crackDepth >= prev.crackDepth);
            assert.ok(h.red >= prev.red);
            prev = h;
        }
        assert.ok(haloState(2, 100).crackCount <= 8);
    });

    it("names the next threshold", () => {
        assert.equal(haloState(2, 0).nextThreshold, 25);
        assert.equal(haloState(2, 25).nextThreshold, 50);
        assert.equal(haloState(2, 74.9).nextThreshold, 75);
        assert.equal(haloState(2, 99).nextThreshold, 100);
        assert.equal(haloState(2, 100).nextThreshold, null);
    });
});

describe("bar maths", () => {
    it("ratio clamps and survives bad maxima", () => {
        assert.equal(ratio(50, 100), 0.5);
        assert.equal(ratio(150, 100), 1);
        assert.equal(ratio(-5, 100), 0);
        assert.equal(ratio(5, 0), 0);
        assert.equal(ratio(Number.NaN, 10), 0);
    });

    it("hp shows the healable cap when the halo is dimmed", () => {
        const v = hpView(80, 200, 140);
        assert.equal(v.fill, 0.4);
        assert.equal(v.cap, 0.7);
        assert.equal(hpView(40, 200).low, true);
        assert.equal(hpView(20, 200).critical, true);
        assert.equal(hpView(150, 200, 100).cap, 0.75, "cap never sits below the fill");
    });

    it("posture warns in orange then red", () => {
        assert.equal(postureView(10, 100).level, "calm");
        assert.equal(postureView(70, 100).level, "warning");
        assert.equal(postureView(95, 100).level, "danger");
    });

    it("fervour marks the 40 Outcry notch", () => {
        const v = fervourView(39, 100);
        assert.equal(v.notch, OUTCRY_COST / 100);
        assert.equal(v.canOutcry, false);
        assert.equal(fervourView(40, 100).canOutcry, true);
        assert.equal(fervourView(40, 120).notch, 40 / 120);
    });

    it("tracks a damage trail that holds, then drains", () => {
        const bar = new BarTracker(1);
        bar.update(0.6, 1 / 60);
        assert.equal(bar.fill, 0.6);
        assert.equal(bar.trail, 1);
        bar.update(0.6, 0.3);
        assert.equal(bar.trail, 1, "holds before draining");
        for (let i = 0; i < 120; i++) bar.update(0.6, 1 / 60);
        assert.equal(bar.trail, 0.6);
    });

    it("eases a heal up with a gain marker", () => {
        const bar = new BarTracker(0.2);
        bar.update(0.8, 0.1);
        assert.equal(bar.gain, 0.8);
        assert.ok(bar.fill > 0.2 && bar.fill < 0.8);
        for (let i = 0; i < 120; i++) bar.update(0.8, 1 / 60);
        assert.ok(Math.abs(bar.fill - 0.8) < 1e-9);
    });
});

describe("cooldownView", () => {
    it("shows seconds left while cooling", () => {
        const v = cooldownView(2.34, 6);
        assert.equal(v.state, "cooling");
        assert.equal(v.label, "2.4");
        assert.ok(Math.abs(v.remaining - 2.34 / 6) < 1e-9);
        assert.equal(cooldownView(12.2, 20).label, "13");
    });

    it("flashes briefly when ready", () => {
        assert.equal(cooldownView(0, 6, 0).flash, 1);
        assert.equal(cooldownView(0, 6, 1).flash, 0);
        assert.equal(cooldownView(0, 6).flash, 0);
        assert.equal(cooldownView(0, 6).state, "ready");
    });

    it("can be locked, like the Trumpet before Tier 4", () => {
        assert.equal(cooldownView(3, 6, 0, true).state, "locked");
    });

    it("formats seconds", () => {
        assert.equal(formatSeconds(0), "");
        assert.equal(formatSeconds(0.04), "0.1");
        assert.equal(formatSeconds(9.95), "10.0");
        assert.equal(formatSeconds(25), "25");
    });
});

describe("tierView", () => {
    it("names each tier from the progression doc", () => {
        for (let tier = 0; tier <= 5; tier++) assert.equal(tierView(tier + 0.5).name, TIER_NAMES[Math.min(5, tier)]);
        assert.equal(tierView(2.5).roman, "II");
        assert.equal(tierView(2.5).progress, 0.5);
        assert.equal(tierView(5).progress, 1);
        assert.equal(tierView(7).tier, 5);
    });
});

describe("toasts and dialogue", () => {
    it("keeps three toasts and fades them", () => {
        const q = new ToastQueue();
        for (let i = 0; i < 5; i++) q.push(`t${i}`);
        assert.equal(q.items.length, 3);
        assert.equal(q.items[0].title, "t2");
        assert.equal(toastAlpha(q.items[0]), 0);
        q.update(1);
        assert.equal(toastAlpha(q.items[0]), 1);
        q.update(10);
        assert.equal(q.items.length, 0);
    });

    it("types dialogue out", () => {
        assert.equal(typewriter("Hosanna", 0), 0);
        assert.equal(typewriter("Hosanna", 0.1, 30), 3);
        assert.equal(typewriter("Hosanna", 10), 7);
    });
});

describe("hudLayout", () => {
    it("keeps the HUD in the corners and clear of the centre at the reference size", () => {
        const l = hudLayout(REF_W, REF_H);
        assert.equal(l.scale, 1);
        assert.ok(l.vitals.x + l.vitals.w < l.hotbar.x, "vitals and hotbar do not overlap");
        assert.ok(l.vitals.y + l.vitals.h <= REF_H);
        assert.ok(l.hotbar.y + l.hotbar.h <= REF_H);
        assert.ok(l.dialogue.y + l.dialogue.h < l.hotbar.y, "dialogue sits above the hotbar");
        assert.ok(l.tier.x + l.tier.w <= REF_W);
        assert.ok(Math.abs(l.hotbar.x + l.hotbar.w / 2 - REF_W / 2) < 1e-9, "hotbar is centred");
    });

    it("scales with the screen", () => {
        const l = hudLayout(1920, 1080);
        assert.equal(l.scale, 1.5);
        assert.ok(l.vitals.x + l.vitals.w < l.hotbar.x);
        const small = hudLayout(960, 540);
        assert.equal(small.scale, 0.75);
        assert.ok(small.vitals.x + small.vitals.w < small.hotbar.x);
    });
});
