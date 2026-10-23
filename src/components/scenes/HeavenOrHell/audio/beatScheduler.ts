import { BASS_808_IDS, Bass808Id, Bass808Note, Glide, bass808Notes, hitVelocity, nextNoteIndex } from "./bass808";
import { LOOP_SEC, Tier } from "./musicSpec";

/** Look this far ahead on the audio clock each frame; longer than any frame gap we expect to survive. */
export const BEAT_LOOKAHEAD_SEC = 0.25;
/** Fire a hit on the frame where it is due within this many ms (about half a 60 fps frame). */
export const BEAT_FIRE_EARLY_MS = 8;
/**
 * An 808 hit is judged by its loudest moment in this window after the onset, so
 * a note that lands on a slam (gain ramping up over 30 ms) still counts.
 */
export const HIT_BODY_SEC = 0.05;
/** Hits more than this late (tab was hidden, long GC) are dropped rather than fired in a burst. */
export const BEAT_STALE_MS = 120;

/** One 808 hit as the listener hears it. */
export interface Beat808Hit {
    /** 0..1: note velocity scaled by how loud its stem is at that moment (see `hitVelocity`). */
    velocity: number;
    /** The note glides (slide up or dive down). */
    slide: boolean;
    glide: Glide;
    /** The tier the listener hears at the hit (a pending switch-up does not count until its bar line). */
    tier: Tier;
    /** The loudest 808 stem on this hit. */
    stem: Bass808Id;
    /** AudioContext time at which the hit's sample is rendered. */
    audioTime: number;
    /** `performance.now()` time the hit reaches the speakers (output latency included). */
    audibleAtMs: number;
    /** How late the callback ran relative to `audibleAtMs` (negative = slightly early). */
    lateMs: number;
    bar: number;
    step: number;
    /** Beat within the loop (0..127). */
    beat: number;
    /** Seconds from the loop start. */
    loopSec: number;
}

/** What the scheduler needs to know about the live mix, all in AudioContext time. */
export interface BeatMixView {
    /** Context time of loop position 0 (the first loop). */
    epoch: number;
    /** Linear gain of an 808 stem at a context time, including master fades and whether its source has started. */
    gainAt(stem: Bass808Id, audioTime: number): number;
    tierAt(audioTime: number): Tier;
}

interface Pending {
    audioTime: number;
    loopSec: number;
    notes: Array<{ stem: Bass808Id; note: Bass808Note }>;
}

/**
 * Lookahead scheduler for 808 hits. `schedule` walks the 808 note lists over the
 * next window of the audio clock; `due` returns the hits whose audible time has
 * arrived, evaluating stem gains and tier at the hit's own audio time so crossfades,
 * drum drops and switch-ups are reflected exactly as they will be heard.
 */
export class Beat808Scheduler {
    private queue: Pending[] = [];
    private scheduledUntil = -Infinity;

    reset(): void {
        this.queue = [];
        this.scheduledUntil = -Infinity;
    }

    get pending(): number {
        return this.queue.length;
    }

    schedule(nowAudio: number, epoch: number, lookahead = BEAT_LOOKAHEAD_SEC): void {
        const horizon = nowAudio + lookahead;
        const from = Math.max(this.scheduledUntil, nowAudio - 0.02, epoch);
        if (from >= horizon) return;
        const byTime = new Map<number, Pending>();
        for (const p of this.queue) byTime.set(Math.round(p.audioTime * 1e4), p);
        for (const stem of BASS_808_IDS) {
            const notes = bass808Notes(stem);
            let k = Math.floor((from - epoch) / LOOP_SEC);
            const pos = from - epoch - k * LOOP_SEC;
            let i = nextNoteIndex(notes, pos);
            if (notes[i].sec < pos - 1e-9) k++;
            for (;;) {
                const audioTime = epoch + k * LOOP_SEC + notes[i].sec;
                if (audioTime >= horizon) break;
                if (audioTime >= from) {
                    const key = Math.round(audioTime * 1e4);
                    let p = byTime.get(key);
                    if (!p) {
                        p = { audioTime, loopSec: notes[i].sec, notes: [] };
                        byTime.set(key, p);
                    }
                    p.notes.push({ stem, note: notes[i] });
                }
                i++;
                if (i === notes.length) {
                    i = 0;
                    k++;
                }
            }
        }
        this.queue = [...byTime.values()].sort((a, b) => a.audioTime - b.audioTime);
        this.scheduledUntil = horizon;
    }

    /** Pop every hit due by `nowMs`; `audibleAt` maps audio time to performance time. */
    due(nowMs: number, audibleAt: (audioTime: number) => number, mix: BeatMixView): Beat808Hit[] {
        const out: Beat808Hit[] = [];
        while (this.queue.length) {
            const p = this.queue[0];
            const at = audibleAt(p.audioTime);
            if (nowMs < at - BEAT_FIRE_EARLY_MS) break;
            this.queue.shift();
            if (nowMs - at > BEAT_STALE_MS) continue;
            const hit = this.resolve(p, at, nowMs, mix);
            if (hit) out.push(hit);
        }
        return out;
    }

    private resolve(p: Pending, audibleAtMs: number, nowMs: number, mix: BeatMixView): Beat808Hit | null {
        let best: { stem: Bass808Id; note: Bass808Note; velocity: number } | null = null;
        let glide: Glide = "none";
        for (const { stem, note } of p.notes) {
            const gain = Math.max(mix.gainAt(stem, p.audioTime), mix.gainAt(stem, p.audioTime + HIT_BODY_SEC));
            const velocity = hitVelocity(note.vel, gain);
            if (velocity <= 0) continue;
            if (note.glide !== "none" && glide === "none") glide = note.glide;
            if (!best || velocity > best.velocity) best = { stem, note, velocity };
        }
        if (!best) return null;
        return {
            velocity: best.velocity,
            slide: glide !== "none",
            glide,
            tier: mix.tierAt(p.audioTime),
            stem: best.stem,
            audioTime: p.audioTime,
            audibleAtMs,
            lateMs: nowMs - audibleAtMs,
            bar: best.note.bar,
            step: best.note.step,
            beat: best.note.beat,
            loopSec: p.loopSec,
        };
    }
}
