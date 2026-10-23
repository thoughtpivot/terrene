# Heaven Or Hell

A dark isometric action game. You play the Tenth, a lesser angel defending Heaven, in a ruined temple where Hell has broken through the floor. The name comes from Isaiah 6:13: "But yet in it shall be a tenth". The Tenth wears near-monochrome robes, with a glowing white-gold halo, eyes and wing edges. This first milestone (M1) is the walkable world: the hero, the temple, the breach, the light and the bloom. Combat comes in M2.

Open it at [/#heavenorhell](https://thoughtpivot.github.io/terrene/#heavenorhell). `#heaven-or-hell`, `#heaven` and `#hoh` open the same scene. Oka World stays the default.

## What is in M1

- A temple in the middle of a 5x5 grid of world chunks. The temple is fully dressed: an altar, a star seal, braziers, pillars, a ruined gate and statues. Hell's breach cracks open to the east of it, with lava, obsidian spikes and embers. The chunks around it are dressed more lightly: pillars, rubble, statues and scattered braziers, with spikes and smaller rifts where Hell is close.
- Chunks stream in and out around the hero as you walk, so the map stays light.
- The Tenth turns to face the mouse in eight directions, walks with a puppet animation and dashes with a trail of light.
- Props sort by depth, so you can walk behind pillars, arches and statues.
- White and gold light belongs to Heaven and the hero. Red and orange belong to Hell. Everything else sits near black.

## Controls

| Key | Action |
| --- | --- |
| WASD or arrow keys | Move |
| Mouse | Aim and face |
| Space | Dash |
| G | Streaming debug view |
| B | Bloom on or off |

Presses are buffered for 150 ms, so a dash pressed just before you can use it still fires.

These keys are already reserved for M2 combat and do nothing yet: left mouse attacks, right mouse feints, F parries (hold to block), Q rolls and R is the critical.

## The debug view

Press G to see the streaming. Chunk borders are coloured by state: loaded, loading and idle. The circles around the hero mark how far chunks load (900) and unload (1300). Blue ellipses are the colliders near you. The top right shows a minimap of the grid. The panel shows fps, the current chunk, loaded and pending chunks, how many chunks have streamed in and out, actor, light, collider and texture counts, and which bloom format the browser gave.

## The card game

The earlier Heaven Or Hell card slice still exists. It has moved to [/#heavenorhellcards](https://thoughtpivot.github.io/terrene/#heavenorhellcards) (or `#hohcards`).

## Code

- `src/components/scenes/HeavenOrHell/` holds the scene, the map and streaming (`world/`), and the bloom, lighting, particles and overlays (`render/`).
- `src/components/characters/player/Tenth/` holds the hero and the puppet rig.
- `tools/heaven-or-hell/` holds the art pipeline. Every image prompt is in `tools/heaven-or-hell/prompts.md`.
- `npm run test:heaven` runs the tests in `test/heaven-or-hell-*.ts`.
