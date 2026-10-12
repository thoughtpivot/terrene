# Oka World 2: The Hollow Beneath

## Overview

Oka World 2 is the sequel to [Oka World](./oka-world.md). It is the same
platformer with the same hero, creatures and rules, set in a darker place: a
drowned, ruined city under the Heartstone, lit only by Mori's lantern, a few
hanging lanterns and whatever glows on its own. It takes its mood from Hollow
Knight (cold blues, pale bone and lichen, ruined columns, distant eyes, a
melancholic piano and strings score), but every image, name and note is
original.

It opens at `/#okaworld2`. Finishing Oka World also leads into it: after the
victory panel, Enter, Space or Jump (or 9 seconds of waiting) fades the music
and the screen into a chapter card, "Oka World II / The Hollow Beneath", and
Oka World 2 fades in from that card. R explores Oka World again instead.

| Section | What happens |
| --- | --- |
| Lantern's End | Start under a dead tree, first lit lantern ahead |
| Drowned Steps | First pool, two small stepping stones and a Gloomfin |
| Bone Wall | First wall to climb, Mossbacks on both sides |
| Hanging Dark | Bottomless gap on floating rocks under three Glimmerflies |
| Weeping Gallery | Lantern checkpoint, two Mossbacks in the gallery |
| Black Lake | Long lake with an island, rocks to hop and two Gloomfins below |
| The Long Fall | Tilted slab and high rocks over a second gap, Glimmerflies on the way |
| Lantern Road | Two Mossbacks, the last pool and a final wall |
| Soul Shrine | Touch the shrine to wake it and finish |

The controls and rules are those of Oka World. The differences:

- Checkpoints are hanging lanterns. They light when Mori passes under them and
  stay lit.
- The goal is the Soul Shrine. When it wakes, its light spreads and the
  darkness lifts.
- Crystals are "soul shards", 49 in all. There are 19 creatures (8 Mossbacks,
  7 Glimmerflies, 4 Gloomfins), five more than in Oka World, and the dark ones
  are quicker.
- Gaps between rocks keep Oka World's 90–110 units, so every jump is one Mori
  can already make. The level is harder because of what waits around the
  jumps, not the jumps themselves.

## Code Layout

```
src/components/scenes/OkaWorld/
├── OkaScene.ts             # shared scene: HD switch, loading, build, loop, victory
├── OkaWorld.ts             # Oka World: config only (key "okaworld")
└── 2/
    ├── OkaWorldTwo.ts      # Oka World 2: config, lantern/shrine hooks, lights
    ├── chapter.ts          # scene key "okaworld2" and the chapter card
    ├── level.ts            # LEVEL_TWO layout
    ├── lighting.ts         # HollowDark: darkness overlay and watching eyes
    ├── ambience.ts         # distant crawler, falling grit and rumbles
    ├── art/                # generated: backdrop, pillars, atlas.ts
    ├── OkaWorld2.png       # generated: recoloured terrain atlas
    ├── OkaWorld2.mp3       # generated: soundtrack
    └── sfx/*.mp3           # generated: sound effects
```

### One scene class, two configs

`OkaScene` holds everything both worlds share. Each world is a subclass that
passes an `OkaSceneConfig`: its key and name, level, art, soundtrack, parallax
style, water style, particle palettes, HUD style, text, and optionally the
scene to go to after winning (`next`) and a card to fade in from (`card`).
`parallax.ts`, `Water.ts`, `effects.ts`, `hud.ts` and `audio.ts` take a style
object instead of fixed colours; the `OKA_*` defaults reproduce Oka World
exactly.

Subclasses can override four hooks:

- `makeCheckpoint()` and `makeGoal()` choose the checkpoint and goal fixtures
  (Glow Shrooms and Heartstone in Oka World, Hanging Lantern and Soul Shrine
  in Oka World 2).
- `decorate()` runs once after the level is built. Oka World 2 adds the
  darkness and the ambience there.
- `frame(dt, left)` runs every frame. Oka World 2 gathers the lights there.

### Dark variants

Creatures and items take a `variant` of `"light"` (default) or `"dark"`.
`BaseItem` stores it as `this.dark`; each class picks its dark sprite and glow
colours from it:

| Creature | Dark variant |
| --- | --- |
| Mossback | Bone-pale husk on an indigo shell, eyes glowing acid green, walks faster |
| Glimmerfly | Pale lilac moth, faster figure-eights |
| Gloomfin | Indigo with pale spots and a yellow eye, cold lure, longer reach, lunges more often |

Crystals, Heart Moss, rocks, kelp, ferns, grass and moss drips have dark
sprites as well. `DeadTree`, `PaleShrooms`, `HangingLantern` and `SoulShrine`
are new fixtures.

### Lighting

`HollowDark` is a screen-space overlay above the world and below the HUD. It
is painted at half size (480x270) and scaled up, every other frame:

1. Fill with near-black blue at the scene's depth (0.66 opacity).
2. Cut a soft hole for each light (`destination-out` radial gradients). Mori's
   lantern flickers and reaches furthest; lanterns, shrooms, shards, hearts,
   Glimmerflies, the Gloomfin lure and Mossback eyes all carry smaller lights.
3. Spill warm colour around warm lights, then a vignette.
4. Draw the watchers: pairs of eyes far back in the dark that blink, look
   around, and close when Mori comes near.

Fog, spores and dust motes, light shafts and the distant crawler sit in the
parallax layers below the overlay, so the darkness swallows them too.

## Asset Pipeline

```bash
python3 tools/oka-world/build_art.py      # Oka World art first: 2 reuses its output
python3 tools/oka-world/2/build_art.py    # recolours and new art for Oka World 2
python3 tools/oka-world/2/compose_music.py
python3 tools/oka-world/footsteps.py      # renders both worlds' footsteps
```

Mori is not recoloured: both worlds use the same sprite, and the darkness
overlay and his lantern light set his look in the Hollow.

`2/build_art.py` imports the Oka World script for keying and cutting. It reads
four new painted sources in `tools/oka-world/2/source` (ruined-city backdrop,
temple columns, thorned stalactites, and a props sheet with the lantern, pale
mushrooms, dead tree and shrine). It recolours Oka World's built terrain atlas
and sprites in HSV space, which keeps every frame and surface where it was so
the atlas coordinates stay valid. It then writes `2/art/atlas.ts` with the new
layers, items and the Mossback eye positions per frame. Don't edit any of its
outputs by hand.

`2/compose_music.py` renders "Where the Lanterns Sleep" (C minor, 60 BPM, 32
bars, a 128 second loop). The parts are a felt piano motif, a cello line,
wordless choir, strings, a low drone, a funeral bell, a deep drum used
sparingly, wind and creaks, all in a 7.5 second reverb. It is rendered
circularly with a 2 second tail like Oka World's, so the loop is gapless. The
script also renders darker versions of the sound effects plus `lantern` and
`rumble`.

## Testing

`window.__oka` holds whichever Oka scene is active, so the Oka World testing
notes apply. `__oka.config.key` tells you which one it is. To test the
transition, open `/`, call `__oka.win()` (protected in TypeScript, but callable
from the console) or play through, press Enter, and
step the clock about 4 seconds: `__oka.config.key` becomes `"okaworld2"`, the
URL becomes `/#okaworld2`, and the screen stays at 960x540. Opening
`/#worldone` afterwards puts the 256x240 pixel art settings back.
