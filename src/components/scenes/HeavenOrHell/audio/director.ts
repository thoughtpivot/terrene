import {
    AutomationPoint,
    Gains,
    INITIAL_MIX_STATE,
    MixState,
    MusicSet,
    SMOOTH_RAMP_BARS,
    TransitionKind,
    automationFor,
    barAt,
    filterSweepFor,
    gainsDiffer,
    gainsFor,
    mixFor,
    nextBoundaryBar,
} from "./mixer";
import { BAR_SEC, STEMS, STINGERS, StemId, StingerId, Tier } from "./musicSpec";

/** One scheduled musical change, in seconds since the music epoch. */
export interface MusicCommand {
    kind: TransitionKind;
    tier: Tier;
    set: MusicSet;
    boundaryBar: number;
    boundarySec: number;
    targets: Gains;
    automation: Record<StemId, AutomationPoint[]>;
    filter: { bus: MusicSet; points: AutomationPoint[] } | null;
    stinger: { id: StingerId; startSec: number } | null;
    /** The director makes no new decisions until this time, so envelopes never overlap. */
    busyUntilSec: number;
}

/**
 * Turns a stream of (time, corruption) readings into bar-aligned commands.
 * Pure and deterministic: the browser player and the offline demo renderer
 * both drive it, so what Dan hears in the demo is what the game does.
 */
export class MusicDirector {
    private state: MixState = { ...INITIAL_MIX_STATE };
    private current: Gains;
    private busyUntil = -Infinity;

    constructor(initialCorruption = 0) {
        const first = mixFor(initialCorruption, this.state);
        this.state = { ...first.state, lastStingerBar: INITIAL_MIX_STATE.lastStingerBar };
        this.current = gainsFor(initialCorruption, this.state.tier);
    }

    get tier(): Tier {
        return this.state.tier;
    }

    /** Gains the music is at (or ramping to) right now. */
    get gains(): Gains {
        return { ...this.current };
    }

    isBusy(elapsedSec: number): boolean {
        return elapsedSec < this.busyUntil;
    }

    tick(elapsedSec: number, corruption: number): MusicCommand | null {
        if (this.isBusy(elapsedSec)) return null;
        const plan = mixFor(corruption, { ...this.state, bar: barAt(elapsedSec) });
        const tierChanged = plan.tier !== this.state.tier;
        if (!plan.stinger && !tierChanged && !gainsDiffer(plan.gains, this.current)) return null;

        const kind: TransitionKind = plan.stinger ?? "smooth";
        const info = plan.stinger ? STINGERS[plan.stinger] : null;
        const boundaryBar = nextBoundaryBar(elapsedSec, info?.phraseBars ?? 1, info?.leadBars ?? 0);
        const boundarySec = boundaryBar * BAR_SEC;

        const automation = {} as Record<StemId, AutomationPoint[]>;
        let lastPoint = boundarySec;
        for (const stem of STEMS) {
            const points = automationFor(stem.set, kind, boundarySec, this.current[stem.id], plan.gains[stem.id]);
            automation[stem.id] = points;
            lastPoint = Math.max(lastPoint, points[points.length - 1].t);
        }

        const command: MusicCommand = {
            kind,
            tier: plan.tier,
            set: plan.set,
            boundaryBar,
            boundarySec,
            targets: plan.gains,
            automation,
            filter: filterSweepFor(kind, boundarySec),
            stinger: plan.stinger ? { id: plan.stinger, startSec: boundarySec - STINGERS[plan.stinger].hitSec } : null,
            busyUntilSec: Math.max(lastPoint, boundarySec + SMOOTH_RAMP_BARS * BAR_SEC),
        };
        this.state = { ...plan.state, bar: boundaryBar, lastStingerBar: plan.stinger ? boundaryBar : this.state.lastStingerBar };
        this.current = plan.gains;
        this.busyUntil = command.busyUntilSec;
        return command;
    }
}
