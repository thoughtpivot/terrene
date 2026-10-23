/**
 * Writes the 808 hit map (every 808 note per stem, and the merged audible hits
 * per tier) as JSON for engine-side effects and tooling.
 *
 *   npm run music:hoh:hitmap
 */
import { join } from "node:path";
import { hitMap808 } from "../../../src/components/scenes/HeavenOrHell/audio/bass808";
import { BPM, PAD_SEC } from "../../../src/components/scenes/HeavenOrHell/audio/musicSpec";
import { writeText } from "./io";
import { ARTIFACT_DIR } from "./paths";

const round = (x: number, d = 4): number => Math.round(x * 10 ** d) / 10 ** d;

function main(): void {
    const map = hitMap808(PAD_SEC, BPM);
    const json = {
        ...map,
        note: "Times are from the loop start; loop position 0 is filePadSec into each MP3. velocity = note velocity x min(1, stemGain / 0.5); stems under gain 0.05 are silent.",
        stems: Object.fromEntries(
            Object.entries(map.stems).map(([id, notes]) => [
                id,
                notes.map((n) => ({ ...n, sec: round(n.sec), hold: round(n.hold), beat: round(n.beat, 3) })),
            ]),
        ),
        tiers: map.tiers.map((t) => ({
            tier: t.tier,
            stemGains: t.stemGains,
            count: t.hits.length,
            slides: t.hits.filter((h) => h.slide).length,
            hits: t.hits.map((h) => ({ ...h, sec: round(h.sec), beat: round(h.beat, 3), velocity: round(h.velocity, 3) })),
        })),
    };
    const out = join(ARTIFACT_DIR, "808-hitmap.json");
    writeText(out, JSON.stringify(json, null, 2));
    for (const t of json.tiers) console.log(`   tier ${t.tier}: ${t.count} hits (${t.slides} slides/dives) gains ${JSON.stringify(t.stemGains)}`);
    console.log(`✅ ${out}`);
}

main();
