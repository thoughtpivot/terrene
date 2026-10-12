# Oka World

## Overview

Oka World is a hand-painted cave platformer and the default scene: it opens
at `/` (or `/#okaworld`), and World 1-1 is at `/#worldone`. It takes its mood from CartoonSmart's
Underground Cave Tile Set: misty caverns of tall rock pillars, bonsai trees
growing on floating ledges, crystal walls, and still pools lit by caustics.
None of the kit's files are used. Every image is original art in
`tools/oka-world/source`, and the soundtrack and sound effects are synthesized
by `tools/oka-world/compose_music.py`.

You play Mori, a hooded explorer with a lantern, and run from Lantern Hollow
to the Heartstone Sanctum, collecting blue crystals along the way.

| Section | What happens |
| --- | --- |
| Lantern Hollow | Start, first ledges, first Mossback |
| Shimmer Pool | First swim, Gloomfin in the water |
| Crystal Wall | Climb a ledge to get over a crystal wall |
| Shimmer Lake | Long lake with a bonsai island and floating rocks, checkpoint on the far bank |
| Stone Terrace | Tilted slab ramp up to high ledges |
| Hanging Chasm | Bottomless gap crossed on floating rocks, Glimmerflies overhead |
| Moss Gardens | Second checkpoint, small pool, last crystal wall |
| Heartstone Sanctum | Touch the Heartstone to finish |

## Controls

| Action | Keys | Gamepad |
| --- | --- | --- |
| Move | Arrows, A / D | Stick, D-pad |
| Jump, swim up | Space, W, Up, Z, K | A |
| Drop through a ledge | Down + Jump | Down + A |
| Dive | Down while swimming | Down |

On touch screens, on-screen buttons appear for move and jump.

## Rules

- Mori starts with 3 hearts (5 at most). Touching a creature from the side
  costs a heart, and a Heart Moss restores one.
- Landing on a Mossback or Glimmerfly from above defeats it and bounces Mori up.
  Gloomfins can't be stomped, so avoid them.
- Falling into the chasm costs a heart. Mori comes back at the last lit Glow
  Shroom checkpoint.
- At 0 hearts Mori rests for a moment, then comes back at the checkpoint with
  3 hearts. Crystals already collected are kept.
- Touching the Heartstone wins the level and shows your crystal count. Enter,
  Space or Jump (or waiting 9 seconds) then leads down into
  [Oka World 2](./oka-world-2.md); R explores Oka World again.

## Code Layout

Oka World follows the Terrene split into scenes, characters, creatures and
items.

```
src/
├── common/BaseItem.ts                    # BaseItem, PickupItem, FixtureItem
└── components/
    ├── scenes/OkaWorld/
    │   ├── OkaScene.ts                   # shared scene: HD switch, loading, build, loop
    │   ├── OkaWorld.ts                   # Oka World's config: level, art, music, styles
    │   ├── level.ts                      # the whole layout as data
    │   ├── physics.ts                    # surfaces, solids, water, body movement
    │   ├── terrain.ts                    # places painted pieces + their surfaces
    │   ├── parallax.ts                   # backdrop, rays, pillars, mist, foreground
    │   ├── Water.ts                      # animated pool with caustics and ripples
    │   ├── effects.ts                    # particle bursts and drifting motes
    │   ├── hud.ts                        # hearts, crystals, cards, touch buttons
    │   ├── audio.ts                      # gapless music loop and positional SFX
    │   ├── OkaCreature.ts / hooks.ts     # shared creature base and scene hooks
    │   ├── art/atlas.ts                  # generated: frames, anchors, surfaces
    │   └── 2/                            # Oka World 2, see oka-world-2.md
    ├── characters/player/Mori/           # the hero
    ├── creatures/{Mossback,Glimmerfly,Gloomfin}/
    └── items/cave/                       # pickups and fixtures
```

### Items: pickups vs fixtures

Every object you can put in a scene extends `BaseItem`:

- `PickupItem` can be collected. Its `reach` box is checked against the hero
  each frame, and once `collect()` runs the item plays its pickup animation
  and is removed. Examples: `BlueCrystal`, `HeartMoss`.
- `FixtureItem` stays in the world. A fixture that sets `reach` gets
  `onTouch()` calls (`GlowShrooms` lights as a checkpoint, `Heartstone` wins
  the level). The others are scenery (`BonsaiTree`, `Boulders`,
  `MossyBoulder`, `Stalagmite`, `Kelp`, `Fern`, `GrassTuft`, `MossDrip`).

To add a fixture, create it under `items/cave/<Name>/`, add the name to
`FixtureName` in `level.ts`, register it in the `FIXTURES` map in
`OkaScene.ts`, then place it in `LEVEL.fixtures`.

### HD rendering

The engine boots at 256x240 pixel art. When Oka World activates, it switches
the screen to 960x540 with antialiasing and pixel ratio 1.5–2, and turns off
pixel snapping. `onDeactivate()` puts the previous settings back, so the pixel
art scenes are unaffected. Painted images are stored at 2x and drawn at half
size, so they stay sharp on high-density screens.

Oka World's art and audio load when the scene first activates, behind a loading
card, so the other scenes don't download them.

### Physics

Oka World uses its own small physics in `physics.ts`, not Excalibur bodies,
because the painted rocks have uneven tops:

- Surfaces are one-way polylines that follow each painted piece's walkable
  top. `build_art.py` measures them from the art and stores them in
  `atlas.ts`. You can jump up through them, and Down + Jump drops through.
- Solids are boxes for ground runs and crystal walls.
- Water regions apply buoyancy and drag. Mori enters the water when half his
  body is under and leaves only when his feet clear the surface. Without that
  gap he flickers between swimming and falling while floating. A jump at the
  surface is a leap that uses normal jump physics until it peaks, high enough
  to climb out onto any bank.

### Mori's animation

Mori's strip (`characters/player/Mori/Mori.png`) has 16 frames: idle; an
8-frame run of two steps (contact, down, passing, flight on each foot);
jump, fall and swim; and start, skid, land and stop poses.

- The run cycle advances with distance, not time. One cycle covers `STRIDE`
  (100 units, two steps), which matches how far the planted foot slides back
  between painted frames, so his feet keep pace with the ground at any speed.
  At full speed (235) that is about 4.7 steps a second.
- Each run frame adds a little lift (flight frames leave the ground) and
  vertical squash (down frames sink), scaled by speed. He leans into the run,
  more while still speeding up.
- Starting from rest shows a crouched push-off. Reversing at speed shows a
  skid: he keeps facing the old way, leans back and kicks up dust until he
  slows down. Letting go at speed brakes on a planted foot. Landings show a
  crouch, squash and dust, then a running landing rolls into the next stride.
- The lantern glow and aura sit on the flame painted in each frame
  (`MORI.lamps` in `atlas.ts`), so the light swings with the lantern and
  follows his lean. Oka World 2's darkness cuts its light from the same point.
- Movement physics are unchanged: run speed 235, jump speed 575, the same
  acceleration and friction, so every gap plays as before.

### Footsteps

Footsteps play on the two contact frames of the run cycle, louder at speed.
A soundtrack effect can be a list of takes, and `audio.ts` plays a random
take without repeating the last one. Near a pool, or for a few seconds after
a swim, the steps are wet. Landing plays a thud scaled by fall speed, and a
skid plays a scrape. Oka World 2 has its own darker, echoing set. All of
these sit well under the music (mix levels 0.2–0.34).

## Asset Pipeline

The tools need Python 3 with `numpy`, `scipy` and `Pillow`, and the audio
scripts also need `ffmpeg`.

```bash
python3 tools/oka-world/build_art.py      # art -> OkaWorld.png, art/*, items, Mori, atlas.ts
python3 tools/oka-world/compose_music.py  # OkaWorld.mp3 and sfx/*.mp3
python3 tools/oka-world/footsteps.py      # footsteps, land and skid for both worlds
```

Mori is built from four painted sheets: `hero.jpg` (idle, jump, fall, swim),
`hero-run.jpg` (the run cycle), `hero-moves.jpg` (start, stop) and
`hero-skid.jpg` (skid, land). `build_art.py` scales every sheet to the same
hood size, stands each frame on the cell floor, and centres the anchor so
he mirrors in place when he turns. It also measures the lantern flame and
the lowest foot in every frame and writes them to `MORI` in `atlas.ts`.

`build_art.py` removes the magenta background from each painted source,
including pink fringe left by JPEG compression around edges. It then cuts the
sheets into objects, scales them, packs the terrain atlas, and writes
`atlas.ts`. Don't edit `atlas.ts` by hand: rerun the script instead.

`compose_music.py` renders "Lanternlight Under Stone" (D Dorian, 72 BPM, 32
bars). The parts are a string pad over a drone, harp arpeggios, a kalimba
ostinato, a wooden flute melody, a frame drum and water drips, all in a long
convolution reverb. The loop is rendered circularly and the file carries 2
extra seconds, and `audio.ts` loops between exact sample points, so the loop
has no gap or click. The script also renders the seven sound effects.

`footsteps.py` renders five dry and three wet footstep takes, a landing
thud and a skid for each world. A step is a low heel thump, a short scuff of
grit and a lighter toe tap a few milliseconds later. Each take varies pitch,
heel-to-toe gap and grit. Oka World's set is in a small, bright cave. Oka
World 2's is duller, with a long dark tail and a slap back off far walls.

## Testing

Run `npm run build:prod`, serve `dist/` and open `/`. While the scene is
active, `window.__oka` holds the scene (`mori`, `cave` for the physics,
`creatures`, `crystals`, `won`), for tests and console poking.
With `engine.debug.useTestClock()` and `engine.clock.step(1000 / 60)` you can
drive the game frame by frame, which keeps headless browser runs deterministic
even when software WebGL is slow.
