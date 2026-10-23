# Heaven Or Hell: Plan

## Overview

Heaven Or Hell is a working title for a 2D isometric roguelite. It takes its
mechanics from Deepwoken and its look from dark isometric pixel art: near-black
stone rooms with bright glowing foregrounds. This plan turns the Granola notes
"Heaven Or Hell" (Dan, October 23, 2026) into milestones that fit Terrene's
existing scene, art pipeline and test patterns.

### What the notes decided

- Genre: a roguelite (runs end, some progress carries over), not a roguelike.
- Drop the earlier "Shroom and Gloom" direction. It was too derivative.
- Mechanics come from Deepwoken (Roblox), and only the mechanics and systems.
  Reference: [Deepwoken Mechanics](https://deepwoken.fandom.com/wiki/Category:Mechanics),
  plus blog articles that explain its gameplay.
- Look: 2D high-resolution art in an isometric view. It should not look like
  Roblox. It should feel like "Deepwoken done properly on a real engine."
- Palette: very dark backgrounds, very vibrant foregrounds, high contrast and
  bloom. Parallax or animated backgrounds are wanted.
- Target imagery: dark stone, cyan, orange and red glows, isometric dungeon
  rooms, NPC dialogue, progression across several floors.
- Primary style reference: the
  [Little Scavenger itch.io profile page](https://coderedstudio.itch.io/little-scavenger)
  by Coderedstudio, plus a
  [YouTube video from its creator](https://youtu.be/OKOf6yrfg4Q).
- Next steps from the meeting: gather 4–5 more visual references, then plan
  and build in Cursor.

### Not decided yet

These came up implicitly but the notes don't settle them. Each one blocks a
specific milestone, marked in brackets.

1. **What "Heaven Or Hell" means in play.** Here's one reading that fits
   Deepwoken's two lives: you descend through hell floors, and dying twice
   sends you down instead of ending the run. A second reading: at each floor
   exit you choose to go up (safer, fewer rewards) or down (riskier, more
   rewards). [M4]
2. **Pixel art or painted art.** The notes say both "2D high-resolution" and
   "isometric pixel art." This plan assumes crisp pixel art drawn at 960x540
   with no smoothing. It does not use Oka World's antialiased HD mode. [M1]
3. **Input scheme.** Deepwoken is mouse plus keyboard. Terrene's scenes are
   keyboard-first. This plan assumes keyboard-first, with the mouse for aiming
   as an option. [M2]
4. **Where the art comes from.** The choices are bought packs, original art
   painted as source sheets (as Oka World does), or generated art. [M1]

## Design pillars

1. **Combat comes first.** Posture, parry and roll matter more than numbers.
   A skilled player with starting gear can clear floor one.
2. **Death matters, a run doesn't end on the first mistake.** Deepwoken's two
   lives fit the "roguelite" choice well.
3. **Dark world, bright actors.** Anything you can interact with glows. The
   environment stays close to black.
4. **Small systems, kept separate.** Rules live in pure TypeScript and are
   tested without the engine, the way `Street/rules.ts` is.

## Mechanics scope

The Deepwoken mechanics index is long. This plan ports the ones that make up
the core combat loop and the roguelite structure, and leaves out the MMO
systems.

| Deepwoken system | Heaven Or Hell version | Milestone |
| --- | --- | --- |
| M1 string and Flourish | Light attack chain, the third hit is a knockback finisher with end lag | M2 |
| Posture bar and guard break | Blocking fills posture. When it overflows you are guard-broken and stunned for about 1 second. It refills when you are not blocking | M2 |
| Parry | A short deflect window on a cooldown. It stuns the attacker, deals posture damage and resets its own cooldown | M2 |
| Rolling | A dodge with i-frames and a cooldown. Roll-cancel comes later | M2 |
| Critical attack | One heavy attack per weapon with its own cooldown. It can't be feinted | M3 |
| Feint | Cancel your attack during the wind-up. Enemy AI reacts to it | M3 |
| Tempo and Vent | A meter built by trading hits that can be spent on a knockback burst. Failing it stuns you | M3 |
| Death and stained health | Two lives per run. The first death stains your health, and clearing the stain needs a shrine or a level-up | M4 |
| Talents (cards drawn on level-up) | Pick one of three talent cards when you clear a floor | M4 |
| Attunements and Mantras, with Ether | Elemental schools (flame, frost, thunder) that give your build an active ability | M5 |
| Deep Shrines | Rare rooms that trade a stat for a stat | M5 |
| Echoes (meta progress after a wipe) | Currency that survives death and unlocks starting options | M4 |
| Out of scope | PvP, guilds, ships, bounties, servers, crafting, hunger and thirst | – |

## Technical approach

### Engine features (ExcaliburJS 0.32.0, already installed)

ExcaliburJS 0.32.0 ships everything this look needs, so no upgrade is
required, and the project rules forbid 0.33+ anyway.

- `IsometricMap` and `IsometricTile` for the room floors and walls.
- `IsometricEntityComponent` for depth-sorting actors against walls.
- `addPostProcessor` and `ScreenShader` for a bloom pass: threshold the bright
  pixels, blur them and add them back. This is what makes the glow pop
  against near-black.
- `ParallaxComponent` for the animated backdrop layers behind the room.
- `GpuParticleEmitter` for embers, sparks and dust.
- Lighting reuses the method from Oka World 2's `HollowDark` overlay
  (`destination-out` radial gradients over a dark fill). Excalibur 0.32 has no
  point lights.

### Scene and routing

- Scene key `heavenorhell`, opened at `/#heavenorhell`, added to
  `ROUTED_SCENES` and `SCENE_TITLES` in `Terrene.ts`. Oka World stays the
  default scene.
- It runs at 960x540, using `OkaScene`'s method of saving the screen settings,
  switching them and restoring them in `onDeactivate()`. It keeps
  `antialiasing: false` so the pixel art stays crisp (see open decision 2).

### Code layout

This follows the Street split, where the rules are pure and the scene is thin,
and the Oka World pipeline, where art is built from a `source/` folder:

```
src/components/scenes/HeavenOrHell/
├── HeavenOrHell.ts     # Scene: load, build floor, loop, onDeactivate cleanup
├── rules.ts            # Pure combat and run rules: posture, parry, roll, lives
├── floors.ts           # Seeded floor and room generation (pure)
├── room.ts             # Builds an IsometricMap and fixtures from a room plan
├── bloom.ts            # Bloom post-processor
├── lighting.ts         # Dark overlay and light holes
├── hud.ts              # Health, posture, tempo, cooldown icons
├── art/atlas.ts        # Generated by tools/heaven-or-hell/build_art.py
└── sfx/, HeavenOrHell.mp3
src/components/characters/player/<Hero>/
src/components/creatures/<Enemy>/   # one folder per enemy, per project rules
tools/heaven-or-hell/
├── source/             # reference and source art
├── references.md       # one line per reference: what to take from it
└── build_art.py
test/heaven-or-hell-rules.ts
docs/heaven-or-hell.md  # player-facing doc, written when M1 ships
```

### Testing

- `rules.ts` and `floors.ts` import nothing from Excalibur, so `node:test`
  covers the parry window, posture overflow, roll i-frames, the two-lives
  state and seeded floor generation, all deterministically.
- **Fix this first:** `node --test test/street-rules.ts` fails today with
  `ERR_MODULE_NOT_FOUND` because `Street/level.ts` imports `./rules` without
  an extension, and Node 22's type stripping needs one. The fix is to use
  `.ts` import specifiers (with `allowImportingTsExtensions` in tsconfig) or
  to add a TypeScript runner such as `tsx`. Then wire `test/*.ts` into
  `npm test`, which today points at a `test/test.js` that doesn't exist.
- Each milestone also ends with a manual run in the browser at
  `/#heavenorhell`: a screen recording and a clean console.

## Milestones

### M0: References (Dan, before any code)

- Gather 4–5 more visual references, as the meeting asked. One tileset isn't
  enough to work from. Sources: Google Images and specific itch.io profile
  pages.
- Store them in `tools/heaven-or-hell/source/` and give each one a line in
  `references.md` saying what to take from it (palette, wall shape, glow,
  UI). Follow the sourcing notes. Call an itch page a "specific itch
  profile page," not a "website." Leave out anything off-topic, because every
  stray image adds ambiguity.
- Add the Deepwoken wiki pages and one or two blog articles about its combat
  to `references.md`.
- **Done when** there are at least 5 tagged references and open decisions 2
  and 4 are answered.

### M1: One lit room

- The `#heavenorhell` route, the 960x540 pixel-crisp mode, and one hand-built
  isometric stone room using `IsometricMap`.
- The hero walks in 8 directions and is depth-sorted against walls and
  pillars.
- The dark overlay, glowing braziers (cyan, orange, red), the bloom pass and
  one parallax backdrop layer.
- **Done when** a screenshot reads as "near-black room, vibrant lights" next
  to the M0 references, the frame rate holds at 60, and switching to another
  hash restores the screen settings.

### M2: The combat core

- `rules.ts` covers the light attack chain with its flourish, block and
  posture, parry with its cooldown, and roll with i-frames.
- One melee enemy whose wind-ups can be read and parried, plus the HUD:
  health, posture and cooldown icons.
- Hit-stop and a screen shake when you parry or guard-break.
- **Done when** unit tests cover every timing rule, and in manual play a
  clean parry, a guard break and a dodge through an attack each work and feel
  distinct.

### M3: Depth of combat

- Critical attacks, feints, Tempo and Vent.
- Two more enemy types: a ranged one with telegraphed area attacks, and a
  heavy one with hyperarmor.
- Telegraphs follow the Little Scavenger feedback: shrinking timer circles,
  visible cooldowns and clear feedback when you take damage.
- **Done when** each enemy type has a unit-tested pattern, and a fight
  against all three together is winnable with no damage taken.

### M4: The run

- Seeded floors made of 6–10 rooms joined by doors, with a stair down
  (or up, per open decision 1). Rooms are cleared to unlock their doors.
- Two lives with stained health, and shrines that clear the stain.
- A talent draft of one card from three at each floor exit.
- Echoes saved to `localStorage` and a hub room where they are spent.
- NPC dialogue in the hub, using `DialogueNPC` and `ChatSystem`.
- **Done when** a full run of three floors plus a boss can be played start to
  finish, death and wipe behave as designed, and Echoes persist across a
  reload.

### M5: Builds and variety

- Three attunements, each with one active ability and an Ether bar.
- Deep Shrine rooms, more talents, and a second biome palette.
- **Done when** two runs with different attunements play noticeably
  differently.

### M6: Polish and release

- An original score and sound effects, built by a script such as
  `tools/oka-world/compose_music.py`.
- The title and chapter cards, `docs/heaven-or-hell.md`, and a README entry.
- **Done when** the GitHub Pages build serves `/#heavenorhell` and the
  console has no errors on a fresh `localStorage`.

## Risks

- **Bloom cost.** A full-screen blur at 960x540 every frame can drop the
  frame rate on low-end GPUs. To mitigate it, blur at half resolution, as
  `HollowDark` paints at 480x270.
- **Isometric depth sorting** with tall walls and large sprites is a common
  source of visual bugs. Settle it in M1, before combat depends on it.
- **The art supply** is the real bottleneck, not the code. M1 can ship with
  placeholder art (`kenney_tinydungeon` is already in `src/assets/`), but the
  look depends on M0.
- **Combat feel** is hard to judge from tests alone. Each combat milestone
  needs a manual play session and a recording, not only green tests.
- **Engine pin.** Every API used must exist in ExcaliburJS 0.32.x.
