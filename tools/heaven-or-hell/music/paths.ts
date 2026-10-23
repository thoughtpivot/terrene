import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export const REPO_ROOT = resolve(__dirname, "../../..");
/** Shipped MP3s, imported by the game through webpack. */
export const MUSIC_OUT = join(REPO_ROOT, "src/components/scenes/HeavenOrHell/audio/music");
/** Intermediate WAVs and the render manifest. Large, never committed. */
export const BUILD_DIR = process.env.HOH_MUSIC_BUILD ?? join(tmpdir(), "heaven-or-hell-music");
/** Demo mix, tier clips, spectrograms, and the QA report. */
export const ARTIFACT_DIR = process.env.HOH_MUSIC_ARTIFACTS ?? "/opt/cursor/artifacts/hoh-music";

export const stemMp3 = (id: string): string => join(MUSIC_OUT, `${id}.mp3`);
export const stingerMp3 = (id: string): string => join(MUSIC_OUT, "stingers", `${id}.mp3`);
export const loopWav = (id: string): string => join(BUILD_DIR, "loops", `${id}.f32.wav`);
export const manifestPath = (): string => join(BUILD_DIR, "manifest.json");
