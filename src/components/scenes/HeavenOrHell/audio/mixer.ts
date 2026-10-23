import {
    BAR_SEC,
    BEAT_SEC,
    HELL_TIER,
    MAX_CORRUPTION,
    MIN_CORRUPTION,
    STEMS,
    STINGERS,
    StemId,
    StemSet,
    StingerId,
    Tier,
} from "./musicSpec";

/**
 * Target linear gain for each stem at each integer tier (index 0..5).
 * Continuous corruption interpolates between neighbouring tiers. Heaven stems
 * are silent from Tier 4 and hell stems are silent below it: those two sets
 * are in different modes (F Lydian vs F Phrygian) and must never overlap
 * except inside a switch-up crossfade.
 */
export const TIER_GAINS: Readonly<Record<StemId, readonly number[]>> = {
    heavenChoir: [1.0, 0.9, 0.7, 0.45, 0, 0],
    heavenBells: [0.75, 0.9, 0.65, 0.4, 0, 0],
    heaven808: [0.5, 0.85, 0.6, 0.2, 0, 0],
    corruptChoir: [0, 0, 0.45, 0.9, 0, 0],
    grit808: [0, 0, 0.45, 0.9, 0, 0],
    drumsSoft: [0.45, 0.85, 0.75, 0.45, 0, 0],
    hatsRoll: [0, 0.3, 0.7, 0.85, 0.9, 1.0],
    ghostLine: [0, 0, 0.55, 0.85, 0.6, 0.7],
    drumsHard: [0, 0, 0, 0.45, 0.95, 1.0],
    hellBells: [0, 0, 0, 0, 0.9, 0.85],
    hellChoir: [0, 0, 0, 0, 0.7, 0.9],
    hell808: [0, 0, 0, 0, 0.9, 1.0],
    hellBrass: [0, 0, 0, 0, 0.35, 1.0],
};

/** Corruption must fall this far below a tier's floor before the tier drops. */
export const HYSTERESIS = 0.25;
/** Non-structural stingers (risers, impacts) are skipped if one fired this recently. */
export const STINGER_COOLDOWN_BARS = 4;
/** Ordinary gain moves glide over this many bars, starting on a bar line. */
export const SMOOTH_RAMP_BARS = 1;
/** Ignore target changes smaller than this so slow drift doesn't reschedule every bar. */
export const GAIN_EPSILON = 0.02;
/** Never schedule closer to "now" than this; WebAudio needs a little lead time. */
export const SCHEDULE_MARGIN_SEC = 0.05;

export type Gains = Record<StemId, number>;
export type MusicSet = "heaven" | "hell";
export type TransitionKind = "smooth" | StingerId;

export interface MixState {
    tier: Tier;
    /** Bar index (since the music epoch) at which this evaluation happens. */
    bar: number;
    lastStingerBar: number;
}

export interface MixPlan {
    tier: Tier;
    set: MusicSet;
    gains: Gains;
    stinger: StingerId | null;
    state: MixState;
}

export const INITIAL_MIX_STATE: MixState = { tier: 0, bar: 0, lastStingerBar: -1e9 };

export function clampCorruption(c: number): number {
    if (!Number.isFinite(c)) return MIN_CORRUPTION;
    return Math.min(MAX_CORRUPTION, Math.max(MIN_CORRUPTION, c));
}

export function setForTier(tier: Tier): MusicSet {
    return tier >= HELL_TIER ? "hell" : "heaven";
}

/** Tier rises as soon as corruption reaches the next integer and falls only once it is HYSTERESIS below the current floor. */
export function tierWithHysteresis(corruption: number, previous: Tier): Tier {
    const c = clampCorruption(corruption);
    let t: number = previous;
    while (t < MAX_CORRUPTION && c >= t + 1) t++;
    while (t > MIN_CORRUPTION && c < t - HYSTERESIS) t--;
    return t as Tier;
}

function interpolate(table: readonly number[], x: number): number {
    const i = Math.min(table.length - 2, Math.max(0, Math.floor(x)));
    const f = Math.min(1, Math.max(0, x - i));
    return table[i] + (table[i + 1] - table[i]) * f;
}

/**
 * Where inside the tier a stem reads its curve. Clamping to the tier's band means
 * hysteresis holds the current sound instead of letting it sag at tier edges.
 * Neutral stems may lean halfway into Tier 4 while still in Tier 3, so the
 * drums are already hardening when the switch-up lands.
 */
function curvePosition(set: StemSet, c: number, tier: Tier): number {
    if (set === "heaven") return Math.min(Math.max(c, tier), Math.min(tier + 1, HELL_TIER - 1));
    if (set === "hell") return Math.min(Math.max(c, tier), MAX_CORRUPTION);
    const top = tier === HELL_TIER - 1 ? tier + 0.5 : Math.min(tier + 1, MAX_CORRUPTION);
    return Math.min(Math.max(c, tier), top);
}

export function gainsFor(corruption: number, tier: Tier): Gains {
    const c = clampCorruption(corruption);
    const set = setForTier(tier);
    const gains = {} as Gains;
    for (const stem of STEMS) {
        const silent = (stem.set === "heaven" && set === "hell") || (stem.set === "hell" && set === "heaven");
        gains[stem.id] = silent ? 0 : interpolate(TIER_GAINS[stem.id], curvePosition(stem.set, c, tier));
    }
    return gains;
}

export function stingerFor(previous: Tier, next: Tier): StingerId | null {
    if (next === previous) return null;
    const from = setForTier(previous);
    const to = setForTier(next);
    if (from === "heaven" && to === "hell") return "switchUp";
    if (from === "hell" && to === "heaven") return "redeem";
    if (next > previous && to === "hell") return "hellImpact";
    if (next > previous && next >= 2) return "riser";
    return null;
}

function isStructural(stinger: StingerId): boolean {
    return stinger === "switchUp" || stinger === "redeem";
}

/**
 * Pure mix decision for one moment of play: which tier we are in (with
 * hysteresis), the target gain of every stem, and which stinger to fire.
 */
export function mixFor(corruption: number, state: MixState): MixPlan {
    const tier = tierWithHysteresis(corruption, state.tier);
    let stinger = stingerFor(state.tier, tier);
    if (stinger && !isStructural(stinger) && state.bar - state.lastStingerBar < STINGER_COOLDOWN_BARS) {
        stinger = null;
    }
    return {
        tier,
        set: setForTier(tier),
        gains: gainsFor(corruption, tier),
        stinger,
        state: {
            tier,
            bar: state.bar,
            lastStingerBar: stinger ? state.bar : state.lastStingerBar,
        },
    };
}

export function barAt(elapsedSec: number, barSec = BAR_SEC): number {
    return Math.floor(elapsedSec / barSec + 1e-9);
}

/**
 * First bar index that is a multiple of `phraseBars` and leaves at least
 * `leadBars` whole bars (plus the scheduling margin) before it.
 */
export function nextBoundaryBar(elapsedSec: number, phraseBars = 1, leadBars = 0, barSec = BAR_SEC): number {
    const earliest = Math.ceil((elapsedSec + SCHEDULE_MARGIN_SEC) / barSec - 1e-9) + leadBars;
    const phrase = Math.max(1, Math.round(phraseBars));
    return Math.ceil(earliest / phrase) * phrase;
}

export function gainsDiffer(a: Gains, b: Gains, epsilon = GAIN_EPSILON): boolean {
    return STEMS.some((s) => Math.abs(a[s.id] - b[s.id]) > epsilon);
}

/** An automation point: hold `v` at the first point's time, then ramp linearly to each later point. */
export interface AutomationPoint {
    t: number;
    v: number;
}

const DROP_LEVEL = 0.06;
const SLAM_SEC = 0.03;

/**
 * Gain envelope for one stem across a transition that resolves on `boundarySec`.
 * Shared by the browser player and the offline demo renderer so both perform
 * the same crossfades.
 */
export function automationFor(
    set: StemSet,
    kind: TransitionKind,
    boundarySec: number,
    from: number,
    to: number,
): AutomationPoint[] {
    const smooth = (bars: number): AutomationPoint[] => [
        { t: boundarySec, v: from },
        { t: boundarySec + bars * BAR_SEC, v: to },
    ];
    if (kind === "smooth") return smooth(SMOOTH_RAMP_BARS);
    if (kind === "riser") return smooth(1);
    const lead = STINGERS[kind].leadBars * BAR_SEC;

    if (kind === "switchUp") {
        if (set === "heaven") {
            return [
                { t: boundarySec - lead, v: from },
                { t: boundarySec - BEAT_SEC, v: from * 0.5 },
                { t: boundarySec, v: 0 },
            ];
        }
        if (set === "hell") return [{ t: boundarySec, v: from }, { t: boundarySec + SLAM_SEC, v: to }];
        // The drum drop: neutral layers vanish for the last beat, then slam back in on the hit.
        return [
            { t: boundarySec - BEAT_SEC, v: from },
            { t: boundarySec - BEAT_SEC + 0.04, v: from * DROP_LEVEL },
            { t: boundarySec, v: from * DROP_LEVEL },
            { t: boundarySec + SLAM_SEC, v: to },
        ];
    }

    if (kind === "redeem") {
        if (set === "hell") {
            return [
                { t: boundarySec - lead, v: from },
                { t: boundarySec - BEAT_SEC, v: from * 0.4 },
                { t: boundarySec, v: 0 },
            ];
        }
        // Heaven breathes back in after the hit rather than slamming.
        return [
            { t: boundarySec, v: set === "heaven" ? 0 : from },
            { t: boundarySec + 2 * BAR_SEC, v: to },
        ];
    }

    // hellImpact: half-beat breath before the hit, then the new level.
    return [
        { t: boundarySec - BEAT_SEC / 2, v: from },
        { t: boundarySec - BEAT_SEC / 2 + 0.03, v: from * 0.3 },
        { t: boundarySec, v: from * 0.3 },
        { t: boundarySec + SLAM_SEC, v: to },
    ];
}

export const FILTER_OPEN_HZ = 18000;
export const FILTER_CLOSED_HZ = 220;

/**
 * Low-pass cutoff automation for the bus that is leaving during a switch-up
 * (heaven) or a redemption (hell). Points ramp exponentially. Returns null
 * when the transition needs no sweep.
 */
export function filterSweepFor(kind: TransitionKind, boundarySec: number): { bus: MusicSet; points: AutomationPoint[] } | null {
    if (kind !== "switchUp" && kind !== "redeem") return null;
    const lead = STINGERS[kind].leadBars * BAR_SEC;
    return {
        bus: kind === "switchUp" ? "heaven" : "hell",
        points: [
            { t: boundarySec - lead, v: FILTER_OPEN_HZ },
            { t: boundarySec, v: FILTER_CLOSED_HZ },
            { t: boundarySec + 0.05, v: FILTER_OPEN_HZ },
        ],
    };
}

/** Value of an automation lane at time t (hold before the first point and after the last). */
export function valueAt(points: readonly AutomationPoint[], t: number, exponential = false): number {
    if (points.length === 0) return 0;
    if (t <= points[0].t) return points[0].v;
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        if (t <= b.t) {
            const f = b.t > a.t ? (t - a.t) / (b.t - a.t) : 1;
            if (exponential && a.v > 0 && b.v > 0) return a.v * Math.pow(b.v / a.v, f);
            return a.v + (b.v - a.v) * f;
        }
    }
    return points[points.length - 1].v;
}
