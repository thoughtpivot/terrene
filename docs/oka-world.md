# Oka World

## Overview

Oka World is a hand-painted cave platformer scene, open it at `/#okaworld`
(World 1-1 stays the default scene). It takes its mood from CartoonSmart's
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
- Touching the Heartstone wins the level and shows your crystal count.

## Code Layout

Oka World follows the Terrene split into scenes, characters, creatures and
items.

```
src/
├── common/BaseItem.ts                    # BaseItem, PickupItem, FixtureItem
└── components/
    ├── scenes/OkaWorld/
    │   ├── OkaWorld.ts                   # scene: HD switch, loading, build, loop
    │   ├── level.ts                      # the whole layout as data
    │   ├── physics.ts                    # surfaces, solids, water, body movement
    │   ├── terrain.ts                    # places painted pieces + their surfaces
    │   ├── parallax.ts                   # backdrop, rays, pillars, mist, foreground
    │   ├── Water.ts                      # animated pool with caustics and ripples
    │   ├── effects.ts                    # particle bursts and drifting motes
    │   ├── hud.ts                        # hearts, crystals, cards, touch buttons
    │   ├── audio.ts                      # gapless music loop and positional SFX
    │   ├── OkaCreature.ts / hooks.ts     # shared creature base and scene hooks
    │   └── art/atlas.ts                  # generated: frames, anchors, surfaces
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
`OkaWorld.ts`, then place it in `LEVEL.fixtures`.

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

## Asset Pipeline

Both tools need Python 3 with `numpy`, `scipy` and `Pillow`, and
`compose_music.py` also needs `ffmpeg`.

```bash
python3 tools/oka-world/build_art.py      # art -> OkaWorld.png, art/*, items, atlas.ts
python3 tools/oka-world/compose_music.py  # OkaWorld.mp3 and sfx/*.mp3
```

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

## Testing

Run `npm run build`, serve `dist/` and open `/#okaworld`. While the scene is
active, `window.__oka` holds the scene (`mori`, `cave` for the physics,
`creatures`, `crystals`, `won`), for tests and console poking.
With `engine.debug.useTestClock()` and `engine.clock.step(1000 / 60)` you can
drive the game frame by frame, which keeps headless browser runs deterministic
even when software WebGL is slow.
