# Heaven Or Hell music

Heaven Or Hell has one adaptive trap score that follows corruption. At Tier 0 it is a quiet, heavenly beat, and as corruption climbs it gathers grit. At Tier 4 it switches up into an evil version of the same song, and it can be redeemed back to heaven. Everything is synthesised offline by a Node/TypeScript toolchain and shipped as looping MP3 stems, and a small WebAudio player mixes them live.

The brief was a beat inspired by Lil Tony Official. It is **inspired-by only**: no melody, sample, vocal tag, drum loop or recognisable motif from any record is used. Every note is original, and every sound comes from oscillators and noise in `tools/heaven-or-hell/music/synth/`. The artist's name and voice are not in the audio.

- Preview it at `/#heavenorhellmusic` (`npm run dev`, then open `http://localhost:9000/#heavenorhellmusic`).
- Full research notes and sources are in `tools/heaven-or-hell/music/research.md`.

## Research summary

Lil Tony (Tekai Elijah Key, an Atlanta Westside rapper and self-producer on Priority Records) has two documented phases that map onto the two worlds:

- **Heaven** draws on the 2025 *Born Again* era: faith-themed "motivation trap", described by listeners as "chill and vibey" and "heavenly rap". It informs the bright choir, bells and harp over soft drums.
- **Hell** draws on the 2023 era, *2 Sides 2 Every Story*: "eerie ATL underground beats", "shiny horns and sinkhole-inducing bass" and "the minimal moodiness of a horror flick". His producer circle includes whyceg, who builds beats around horror. This informs the low brass, organ, distorted sliding 808, Phrygian harmony and busier hat rolls.
- **The craft conventions** come from a type-beat guide and the general trap literature: 140–160 BPM with 150 recommended, a half-time feel, F, G or A minor so the 808 translates, Phrygian and harmonic minor for menace, triplet and accelerating hat rolls, 808 slides tuned to chord tones, the 808 ducked under the kick, and risers, filter sweeps and drum drops between sections.

These sources only describe the sound in words; no record was listened to or transcribed. Lil Tony also works with many producers, so "his sound" is a community abstraction, and the tempo and key figures come from third-party type-beat listings. `research.md` cites each claim and marks which sources were only seen as search excerpts.

## Musical design

| | |
| --- | --- |
| Tempo | 150 BPM in a half-time feel. A 16th note is exactly 0.1 s, or 4410 samples. |
| Loop | 32 bars = 51.2 s = 2,257,920 samples at 44.1 kHz. Phrase plan A A B A, with 2-bar chords. |
| Key | One tonic, F. Heaven is **F Lydian** (bright raised 4th, B♮). Hell is **F Phrygian** with a Phrygian-dominant C at cadences. |
| Motif DNA | A six-note cell, C A B G E F in heaven. In hell it becomes C A♭ B G♭ E♭ F an octave down, keeping B♮ as a tritone over the hell tonic chord. Both sets play it straight, inverted, as a retrograde and as reversed swells. |
| Shared glue | A "ghost line" that uses only tones common to both harmonies, plus drums on one grid, so neutral stems sit under either set. |

### Stems and tier map

Thirteen stems, all looping in lockstep. Gains are linear, at integer corruption; between tiers they interpolate. The table lives in `TIER_GAINS` in `src/components/scenes/HeavenOrHell/audio/mixer.ts`.

| Stem | Set | T0 | T1 | T2 | T3 | T4 | T5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Seraph choir (`heavenChoir`) | heaven | 1.0 | 0.9 | 0.7 | 0.45 | – | – |
| Halo bells + harp (`heavenBells`) | heaven | 0.75 | 0.9 | 0.65 | 0.4 | – | – |
| Soft 808 (`heaven808`) | heaven | 0.5 | 0.85 | 0.6 | 0.2 | – | – |
| Fallen choir + swells (`corruptChoir`) | heaven | – | – | 0.45 | 0.9 | – | – |
| Gritty sliding 808 (`grit808`) | heaven | – | – | 0.45 | 0.9 | – | – |
| Soft drums (`drumsSoft`) | shared | 0.45 | 0.85 | 0.75 | 0.45 | – | – |
| Hat rolls + perc (`hatsRoll`) | shared | – | 0.3 | 0.7 | 0.85 | 0.9 | 1.0 |
| Tritone ghost line (`ghostLine`) | shared | – | – | 0.55 | 0.85 | 0.6 | 0.7 |
| Hard drums (`drumsHard`) | shared | – | – | – | 0.45 | 0.95 | 1.0 |
| Hell bells (`hellBells`) | hell | – | – | – | – | 0.9 | 0.85 |
| Sinister choir + organ (`hellChoir`) | hell | – | – | – | – | 0.7 | 0.9 |
| Distorted 808 slides (`hell808`) | hell | – | – | – | – | 0.9 | 1.0 |
| Low brass + horror lead (`hellBrass`) | hell | – | – | – | – | 0.35 | 1.0 |

The score progresses like this:

- **Tier 0–1 (heaven):** choir, bells and harp, a soft 808 and soft drums.
- **Tier 2–3 (corruption builds vertically):** a detuned, bit-crushed "fallen" choir bends flat, with reversed swells into each 4-bar line. A gritty 808 starts sliding, the triplet and sextuplet hat rolls thicken, and the tritone ghost line enters. During Tier 3 the hard drums lean halfway towards their hell level, so the beat is already hardening when the switch-up lands.
- **Tier 4–5 (hell, the horizontal switch-up):** the heaven set is replaced by hell bells, a sinister choir with organ stabs, a distorted 808 with Phrygian ♭2 slides and dives, and at Tier 5 full low brass with a horror lead.

Heaven and hell stems are never audible together except inside the switch-up crossfade, because Lydian and Phrygian clash.

### Stingers

| Stinger | When | What |
| --- | --- | --- |
| `riser` | Rising into Tier 2 or 3 | Noise riser, reverse cymbal and reversed choir swell into a sub boom and a halo bell, landing on a 2-bar line |
| `switchUp` | Heaven to hell | Accelerating snare roll, siren and a reversed hell bell, then a hit of sub boom, crash, clap, brass and tritone bells |
| `hellImpact` | Tier 4 to 5 | A 1-bar suck-back (reverse cymbal, falling growl) into a wall of organ, low brass and a bent, screaming choir |
| `redeem` | Hell to heaven | An accelerating Lydian harp glissando into a bell chord and choir |

## Transitions: morph and switch-up

`mixFor(corruption, state)` is pure. Given the current corruption and the previous state, it returns the tier, the active set, the stem gains and any stinger.

- **Hysteresis:** the tier rises as soon as corruption reaches the next integer, but falls only once it is 0.25 below the tier's floor, so jitter at a boundary never flaps the music. Inside the band, the curve is clamped, so the mix holds instead of sagging.
- **Bar-aligned scheduling:** `MusicDirector` turns (time, corruption) readings into `MusicCommand`s. Every change starts on a bar line.
  - Smooth gain moves glide over one bar.
  - Stingers wait for their phrase: risers land on a multiple of 2 bars, and switch-up, impact and redeem on a multiple of 4. Each needs at least its lead time free (2 bars, or 1 for the impact), so the stinger's build always starts in the future.
  - While a transition is in flight, the director ignores readings and then catches up.
  - Risers and impacts have a 4-bar cooldown. The structural switch-up and redeem always fire.
- **The switch-up:**
  1. Over the 2-bar lead, the heaven bus low-pass sweeps from 18 kHz down to 220 Hz while its stems fade to half.
  2. On the last beat, the shared drums drop out (the "drum drop") and the heaven set closes.
  3. On the downbeat, hell slams in within 30 ms as the stinger hits, and the drums return at their hell levels.
- **Redeem** mirrors this: hell's low-pass closes over the lead, and heaven breathes back in over two bars after the hit instead of slamming.
- **Hell impact:** a half-beat dip to 30% on everything, then the Tier 5 mix.

The same automation (`automationFor`, `filterSweepFor`) drives both the browser player and the offline demo renderer, so the demo is what the game does.

## Seamless loops

Each stem is rendered "circularly":

- Notes are placed modulo the loop into a buffer with a 9 s tail, and the tail is folded back onto the start (`foldTail`), so releases and echoes ring across the loop point.
- Stateful effects (filters, reverb, delay, compression) run over two copies of the loop, and the second copy is kept (`circularProcess`), so their memory is already in steady state at the seam.

Each MP3 file is laid out as `[last 1 s of the loop] + loop + [first 1 s]`. The player loops it with `loopStart = 1.0` and `loopEnd = 52.2`, so even a decoder that does not trim the encoder delay still loops on identical audio. QA checks that this holds.

## Player and Excalibur 0.32 limits

`HeavenOrHellMusic` (`audio/MusicPlayer.ts`) uses Excalibur where it can:

- `Sound` loads and decodes every stem and stinger on Excalibur's shared `AudioContext` (`AudioContextFactory.create()`).
- `WebAudio.unlock()` runs on the first click.
- Stingers play through `Sound.play({ volume, scheduledStartTime })`. Note that `scheduledStartTime` is in **milliseconds** of context time.

The looping stems cannot use `Sound` playback in 0.32, as verified in the shipped source:

- It loops the whole buffer and has no `loopStart`/`loopEnd`, so the gapless pads would be heard.
- Each instance connects straight to the destination, so there are no buses or filters for the sweep.
- Its volume setter is a fixed `setTargetAtTime(v, now, 0.1)`, which cannot be scheduled on a bar line or ramped in sync across 13 stems.

So the stems run on raw `AudioBufferSourceNode`s on that same context, all started at the same `when`. Stems that load later join with a computed offset, so they stay sample-locked. The routing is per-stem gain, then a heaven, shared or hell bus with a low-pass, then a master at `MUSIC_MASTER_GAIN` (0.9).

The heaven or hell set (whichever is needed first) and the shared stems load before playback starts; the rest stream in.

## How the game scene feeds the mixer

```ts
import { HeavenOrHellMusic } from "./audio/MusicPlayer";

const music = new HeavenOrHellMusic();
// From a click or key handler (browsers need a user gesture):
void music.start(state.corruption);
// Whenever corruption changes (0..5, fractional between tiers):
music.setCorruption(state.corruption);
// Once per frame, e.g. in the scene's onPreUpdate:
music.update();
// In onDeactivate:
music.dispose();
```

Corruption is continuous. At about 2 hours per tier, the layers inside a tier creep in over hours (gain moves smaller than 0.02 are not rescheduled), tier changes land on the next bar or phrase, and a corruption drop below the hysteresis band redeems the music. `snapshot()` exposes the audible tier, a pending tier with a countdown, live stem gains and the filter cutoffs for a HUD.

## Preview scene

`/#heavenorhellmusic` (`audio/MusicPreview.ts`) shows the tier, set, bar and beat, the corruption bar, the per-stem gain meters, the filter cutoffs and the next scheduled transition.

| Key | Action |
| --- | --- |
| Click | Start the music |
| ← / → | Scrub corruption by 0.1 (hold to scrub continuously) |
| Shift + ← / → | Scrub by 0.5 |
| 0–5 | Jump to the middle of that tier |
| S | Switch up to hell, or redeem back to heaven |
| A | Auto-drift up and down through the whole arc |
| Space | Start or stop |

## Re-rendering

Requirements: Node 18+ and `ffmpeg` with libmp3lame (`ffprobe` too) on `PATH`. Everything runs through `tsx`, with no Python.

```bash
npm run music:hoh                       # render all 13 stems + 4 stingers into src/.../audio/music/
npm run music:hoh -- hellBells grit808  # re-render only these stems; the others reuse the cache
npm run music:hoh:demo                  # 160 s demo, per-tier clips, spectrograms (artifacts dir)
npm run music:hoh:qa                    # decode every MP3 and check seams, levels and headroom
npm run test:hoh-music                  # mixer, director and loop maths tests (node:test)
npm run typecheck:hoh-music             # strict tsc over the toolchain and runtime audio code
```

- Intermediate WAVs go to `$HOH_MUSIC_BUILD` (default `/tmp/heaven-or-hell-music`) and are never committed.
- The demo and QA outputs go to `$HOH_MUSIC_ARTIFACTS` (default `/opt/cursor/artifacts/hoh-music`).
- Rendering is deterministic (seeded RNGs) and takes about 90 s.

### Mastering

- **Encoding:** LAME (ffmpeg's libmp3lame), CBR at 56–96 kbps. Bass and drum stems are mono.
- **Stem loudness:** each stem is normalised to its own loudness target (BS.1770-style K-weighted, gated LUFS; not a certified meter).
- **Master gain:** one global gain brings the loudest tier to -16 LUFS with every tier peaking at or below -3 dBFS before the 0.9 music master.
- **Stingers:** normalised to -18 LUFS and limited to -2 dBFS, encoded at 128 kbps.
- **Result:** after the 0.9 master, tier mixes sit between -22 and -17.5 LUFS and peak at -4.7 dBFS or lower, which leaves headroom for sound effects.

The shipped audio totals about 6.6 MB:

| Files | Size each |
| --- | --- |
| Choir stems, `ghostLine`, `hellBrass` | 520 KB |
| Bell stems, `hatsRoll` | 624 KB |
| 808 stems | 364 KB |
| Drum stems | 416 KB |
| Stingers | 82–107 KB |

## Files

| Path | Role |
| --- | --- |
| `src/components/scenes/HeavenOrHell/audio/musicSpec.ts` | Tempo, loop geometry, stem and stinger tables |
| `src/components/scenes/HeavenOrHell/audio/mixer.ts` | Pure `mixFor`, hysteresis, gain curves, bar maths, automation |
| `src/components/scenes/HeavenOrHell/audio/director.ts` | Pure `MusicDirector`: readings to bar-aligned commands |
| `src/components/scenes/HeavenOrHell/audio/MusicPlayer.ts` | WebAudio player on Excalibur's context |
| `src/components/scenes/HeavenOrHell/audio/MusicPreview.ts` | `/#heavenorhellmusic` preview scene |
| `src/components/scenes/HeavenOrHell/audio/music/` | Rendered stems and stingers (MP3) |
| `tools/heaven-or-hell/music/` | Synth, score, stems, stingers, render, demo, QA, research |
| `test/heaven-or-hell-music-*.ts` | node:test suites |
