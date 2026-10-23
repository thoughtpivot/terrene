/**
 * Shared facts about the Heaven Or Hell score. The Node renderer in
 * tools/heaven-or-hell/music, the node:test suites, and the in-game player all
 * import this file, so tempo, loop length, and stem ids cannot drift apart.
 * Keep it free of browser and asset imports.
 */

export const SAMPLE_RATE = 44100;
export const BPM = 150;
export const BEATS_PER_BAR = 4;
export const BEAT_SEC = 60 / BPM;
export const BAR_SEC = BEAT_SEC * BEATS_PER_BAR;
export const STEPS_PER_BAR = 16;
export const STEP_SEC = BAR_SEC / STEPS_PER_BAR;
export const LOOP_BARS = 32;
export const LOOP_SEC = LOOP_BARS * BAR_SEC;
export const LOOP_SAMPLES = Math.round(LOOP_SEC * SAMPLE_RATE);

/**
 * Each stem file is [last PAD_SEC of the loop] + loop + [first PAD_SEC of the loop].
 * Playing between LOOP_START_SEC and LOOP_END_SEC stays seamless even when a
 * browser leaves the MP3 encoder delay in the decoded buffer, because the audio
 * on both sides of the loop points is the loop's own continuation.
 */
export const PAD_SEC = 1;
export const PAD_SAMPLES = PAD_SEC * SAMPLE_RATE;
export const LOOP_START_SEC = PAD_SEC;
export const LOOP_END_SEC = PAD_SEC + LOOP_SEC;
export const FILE_SAMPLES = LOOP_SAMPLES + 2 * PAD_SAMPLES;

/** Output level of the whole music bus (stems and stingers), leaving room for sound effects. */
export const MUSIC_MASTER_GAIN = 0.9;

export const MIN_CORRUPTION = 0;
export const MAX_CORRUPTION = 5;
export type Tier = 0 | 1 | 2 | 3 | 4 | 5;
export const TIERS: readonly Tier[] = [0, 1, 2, 3, 4, 5];
/** Tiers at or above this play the hell harmony set (the switch-up). */
export const HELL_TIER: Tier = 4;

/** heaven stems use F Lydian harmony, hell stems use F Phrygian, neutral stems fit both. */
export type StemSet = "heaven" | "neutral" | "hell";

export type StemId =
    | "heavenChoir"
    | "heavenBells"
    | "heaven808"
    | "corruptChoir"
    | "grit808"
    | "drumsSoft"
    | "hatsRoll"
    | "ghostLine"
    | "drumsHard"
    | "hellBells"
    | "hellChoir"
    | "hell808"
    | "hellBrass";

export interface StemInfo {
    id: StemId;
    set: StemSet;
    label: string;
    channels: 1 | 2;
    kbps: number;
}

export const STEMS: readonly StemInfo[] = [
    { id: "heavenChoir", set: "heaven", label: "Seraph choir", channels: 2, kbps: 80 },
    { id: "heavenBells", set: "heaven", label: "Halo bells + harp", channels: 2, kbps: 96 },
    { id: "heaven808", set: "heaven", label: "Soft 808", channels: 1, kbps: 56 },
    { id: "corruptChoir", set: "heaven", label: "Fallen choir + swells", channels: 2, kbps: 80 },
    { id: "grit808", set: "heaven", label: "Gritty sliding 808", channels: 1, kbps: 56 },
    { id: "drumsSoft", set: "neutral", label: "Soft drums", channels: 1, kbps: 64 },
    { id: "hatsRoll", set: "neutral", label: "Hat rolls + perc", channels: 2, kbps: 96 },
    { id: "ghostLine", set: "neutral", label: "Tritone ghost line", channels: 2, kbps: 80 },
    { id: "drumsHard", set: "neutral", label: "Hard drums", channels: 1, kbps: 64 },
    { id: "hellBells", set: "hell", label: "Hell bells", channels: 2, kbps: 96 },
    { id: "hellChoir", set: "hell", label: "Sinister choir + organ", channels: 2, kbps: 80 },
    { id: "hell808", set: "hell", label: "Distorted 808 slides", channels: 1, kbps: 56 },
    { id: "hellBrass", set: "hell", label: "Low brass + horror lead", channels: 2, kbps: 80 },
];

export const STEM_IDS: readonly StemId[] = STEMS.map((s) => s.id);

export function stemInfo(id: StemId): StemInfo {
    const info = STEMS.find((s) => s.id === id);
    if (!info) throw new Error(`unknown stem ${id}`);
    return info;
}

export type StingerId = "riser" | "switchUp" | "hellImpact" | "redeem";

export interface StingerInfo {
    id: StingerId;
    /** Seconds from the start of the file to the downbeat the stinger lands on. */
    hitSec: number;
    /** Whole bars of build-up before the hit, so the mixer can wait for room. */
    leadBars: number;
    /** The hit must land on a bar index that is a multiple of this. */
    phraseBars: number;
    totalSec: number;
    level: number;
}

export const STINGERS: Record<StingerId, StingerInfo> = {
    riser: { id: "riser", hitSec: 2 * BAR_SEC, leadBars: 2, phraseBars: 2, totalSec: 2 * BAR_SEC + 2.4, level: 0.7 },
    switchUp: { id: "switchUp", hitSec: 2 * BAR_SEC, leadBars: 2, phraseBars: 4, totalSec: 2 * BAR_SEC + 3.6, level: 0.85 },
    hellImpact: { id: "hellImpact", hitSec: BAR_SEC, leadBars: 1, phraseBars: 4, totalSec: BAR_SEC + 3.6, level: 0.8 },
    redeem: { id: "redeem", hitSec: 2 * BAR_SEC, leadBars: 2, phraseBars: 4, totalSec: 2 * BAR_SEC + 3.6, level: 0.75 },
};

export const STINGER_IDS: readonly StingerId[] = ["riser", "switchUp", "hellImpact", "redeem"];
