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
   *Partial answer:* neither style reference settles this. Little Scavenger
   is 3D, so it's a reference for lighting and colour, not for projection or
   rendering. Death's Door is also 3D, and its concept art is painted with an
   ink line, not pixel art. See [Art direction](#art-direction).
3. **Input scheme.** Deepwoken is mouse plus keyboard. Terrene's scenes are
   keyboard-first. This plan assumes keyboard-first, with the mouse for aiming
   as an option. [M2]
4. **Where the art comes from.** The choices are bought packs, original art
   painted as source sheets (as Oka World does), or generated art. [M1]
   *Partial answer:* the Death's Door concept sheets show a workable format
   for source sheets: one isometric room per sheet, with props, a flat
   elevation of each key piece and short notes on how it's used.
5. **The isometric angle.** Both style references are 3D games with a fixed
   high camera. A 2D game has to commit to one tile ratio, such as 2:1, and
   draw every sprite at that angle. Death's Door uses a "classic isometric
   angle" for its world and a straighter angle for its office hub, which
   suggests a hub could break the rule on purpose. [M1]

## Design pillars

1. **Combat comes first.** Posture, parry and roll matter more than numbers.
   A skilled player with starting gear can clear floor one.
2. **Death matters, a run doesn't end on the first mistake.** Deepwoken's two
   lives fit the "roguelite" choice well.
3. **Dark world, bright actors.** Anything you can interact with glows. The
   environment stays close to black.
4. **Small systems, kept separate.** Rules live in pure TypeScript and are
   tested without the engine, the way `Street/rules.ts` is.

## Art direction

This section combines two style references, Little Scavenger and Death's
Door. Neither one matches the target exactly. Both are 3D games under a fixed
high camera, and neither is near-black. So the plan takes lighting, colour
and readability from them and keeps projection and value structure as its
own rules.

### What the references show

**Little Scavenger** (Coderedstudio) is a 3D roguelite prototype. Its itch.io
page tags it "3D" and "Pixel Art", and a player comment calls the look "a bit
of PSX style graphics." It renders at low resolution under a fixed
near-isometric camera. Its useful lessons are about light: glows that each
have one job, bloom only on emissive objects, pooled light on a dark floor
and edges that fall off to black. Its itch comments also flag what to fix:
timed attacks "don't show their timers," and players asked for more feedback
when they take damage.

**Death's Door** (Acid Nerve, 2021) is a 3D isometric action-adventure made
in Unity. Frits Olsen was art director, and Sarah Morris, whose portfolio
page is the reference here, is credited for concept art. The team describes
its look as "muted tones of dungeons with vivid splashes of light and
colour," with naturally lit areas set against a "subtle toon shader" on the
characters. The office hub, the Hall of Doors, is greyscale, while the world
beyond the doors is in colour. The team chose the isometric view because it
gives "a clearer view of two angles" and suits "detailed areas with
verticality."

Sarah Morris's Death's Door page shows 12 concept sheets with no captions.
The notes are on the sheets themselves:

- **Rooms are dioramas.** Each room is drawn from a high three-quarter angle
  as a floating block with its outer edges cut away: the Fragment of Truth
  chamber, the inside of a ship, Grandma's arena, and a secret garden. The
  sheets are painted on a light grey board, so the cut edges don't fall off
  to black.
- **Shape language.** The stone is chunky, bevelled and slightly irregular,
  with a dark ink line around each shape. Ornament gathers on the focal
  objects, such as the doors, the bell tower and the iron gate, while floors
  stay plain.
- **Value and palette.** The environments sit in the mid values, in
  desaturated greens, ochres, grey-blue stone and rust. The darkest values
  are the recesses and the crow itself.
- **Light is a few small sources.** Lanterns, cannon heaters and windows give
  warm orange and red pools. Cool cyan or teal is kept for the uncanny: water
  in the cracks of the Fragment of Truth chamber, the eye of Truth, and the
  final boss door, noted as "glowing light in the center of the head." Other
  accents are a green alchemy glow, a pink crystal, and a pale yellow glow
  around the Spirit Crow against dark grey.
- **Readability.** The crow is a small dark wedge with a white eye. It reads
  by value against lighter floors, and the bell tower gate sheet gives it a
  single red sword as its colour accent. The Graveyard Ghost notes say "Key
  face to echo Golem design" and "Longer robes to echo Golem design," so
  related enemies share shapes.
- **Sheets are built to hand off.** Rooms come with prop breakouts, flat
  elevations and practical notes, for example "Large anchor to frame the
  doorway in the mountainside" and "Flowers can be really simple and just
  change texture colour for variation."

The game's own screenshots on Steam are brighter than the target. Measured
on the 12 store screenshots, mean brightness runs from 53 to 144 out of 255,
and the share of pixels darker than 40 runs from 1% to 31%. Death's Door is
a muted mid-key game with dark pockets. It isn't a near-black one.

A trailer artist rebuilt Death's Door's character toon shader to add a rim
light and support for more than one light, because the original "only
supported a single directional light source," and the trailer used "heavy
use of post processing" and volumetrics. That describes the trailer, not the
shipped game. It's still a useful hint: to push the look further, the
artist's first addition was a rim light on the characters.

### Rules for Heaven Or Hell

These rules are this plan's proposal. They take the light and colour from
the references and replace their value structure with the near-black target.

- **Value structure.** The environment lives in the bottom 15% of
  brightness. Floors in shadow sit around `#0B0C10` to `#16181F`, and lit
  floor never rises above about 35% brightness. Pure black is kept for edges
  and the void beyond the room. Only light sources, actors and effects go
  above 60%.
- **Where the light goes.** Each room has two to four small light sources.
  Each makes a pool on the floor that falls off to the near-black base. The
  room's outer edges fade to black, as in Little Scavenger. They are not cut
  off on a grey board, as in the Death's Door sheets. One focal object per
  room, such as a door, shrine or exit, gets the most ornament and the
  brightest light, as Death's Door's doors do.
- **One job per glow colour.** Cyan is the player: the hero's outline, their
  attacks, parry flashes and anything the player can use. Orange is a
  warning: enemy wind-ups, ground telegraphs and fire. Red is damage and
  danger: hits taken, lethal areas, and hell floors. Warm light sources that
  only light the room use a dim amber that doesn't compete with these three.
  A fourth accent, such as green, pink or pale gold, is allowed once per
  biome for something special, like a shrine or a boss, the way Death's Door
  uses its pink crystal and gold Spirit Crow.
- **Bloom, fog and lighting.** Bloom applies only to emissive pixels above
  the threshold, never to the environment. Fog may tint the shadows but must
  never lift them above the near-black base, which rules out Little
  Scavenger's grey fog. Light shafts are allowed as additive shapes over
  dark.
- **Character readability.** Every actor reads in silhouette first. The hero
  gets a bright cyan rim or outline, the 2D answer to Death's Door's rim-lit
  toon shader. Enemies get a thin warm rim, and related enemies share a
  shape, as the Ghost "echoes" the Golem. Each actor gets one strong colour
  accent, like the crow's red sword.
- **Environment shape language.** Use chunky bevelled stone blocks with a
  dark line, plain floors, and ornament gathered on focal pieces. Draw rooms
  as dioramas on a fixed isometric grid, with walls on the camera side cut
  low or removed.
- **UI palette.** UI panels are near-black and translucent, with a thin cyan
  or amber line, never white boxes. Numbers and icons use the same glow roles
  as the world. Telegraphs always show their timing, for example with
  shrinking circles.
- **Heaven and hell can be palette shifts.** Death's Door separates its hub
  from its world with colour (greyscale against colour) and camera angle.
  Heaven Or Hell can do the same between its floors, for example cold cyan
  and pale gold for heaven against red and orange for hell, on the same
  near-black base. This depends on open decision 1.

### Borrow and avoid

| Reference | Borrow | Avoid |
| --- | --- | --- |
| Little Scavenger | Glow colours with one job each. Bloom only on emissive objects. A bright outline on the player. Light shafts and pooled light on a dark floor. Edges that fall off to black. Coloured ground telegraphs and "!" alerts. Element combos | The low-resolution 3D pipeline and voxel props. Grey fog that lifts the blacks. Muddy olive and ochre mid-tones. White UI boxes. Telegraphs with no timer |
| Death's Door | Rooms drawn as isometric dioramas. Chunky bevelled stone with a dark line. Ornament on focal objects, plain floors. Small warm light pools. Cyan kept for the uncanny. Related enemies sharing shapes. A rim light on characters. One colour accent per character. Concept sheets with breakouts and notes. Separating areas with colour | The mid-key values and desaturated greens and ochres, which are far too bright for near-black. Cut edges on a light board instead of falling off to black. The 3D toon-shaded pipeline itself |
| Deepwoken wiki | Mechanics only (see Mechanics scope) | Its look, because the notes say it shouldn't look like Roblox |

### References

| Reference | Link | What to take from it |
| --- | --- | --- |
| Little Scavenger itch.io page | [coderedstudio.itch.io/little-scavenger](https://coderedstudio.itch.io/little-scavenger) | Glow, bloom, pooled light, telegraphs. The page tags it "3D", and player comments flag untimed telegraphs |
| Little Scavenger creator video | [YouTube](https://youtu.be/OKOf6yrfg4Q) | The meeting's primary style reference |
| Sarah Morris, Death's Door concept art | [braverobynart.com/deathsdoor](https://braverobynart.com/deathsdoor) | Diorama rooms, shape language, light sources, readability, sheet format |
| Acid Nerve game credits | [acidnerve.com/game-credits](https://www.acidnerve.com/game-credits) | Who did what: Frits Olsen as art director, Sarah Morris on concept art, Juan Abad on 3D art |
| Byteside interview with Acid Nerve | [byteside.com](https://www.byteside.com/2021/08/deaths-door-developer-acid-nerve-on-how-it-made-its-sword-wielding-crow-game/) | "Muted tones of dungeons with vivid splashes of light and colour," and a toon shader on the characters against naturally lit areas |
| Press Start interview with Acid Nerve | [press-start.com.au](https://press-start.com.au/features/2021/03/27/we-spoke-to-the-team-at-acid-nerve-about-the-stylish-looking-deaths-door/) | Why isometric, and a different camera angle and colour for the hub |
| Stevivor interview with Acid Nerve | [stevivor.com](https://stevivor.com/features/interviews/acid-nerve-talks-deaths-door-interview/) | The greyscale Hall of Doors as a contrast to the coloured world |
| Kev Hayes, Death's Door trailer | [kevhayes.com/deaths-door](http://www.kevhayes.com/deaths-door) | A rim light added to the character toon shader, and heavy post-processing and volumetrics in the trailer |
| Death's Door on Steam | [store.steampowered.com/app/894020](https://store.steampowered.com/app/894020/Deaths_Door/) | The 12 store screenshots used to measure how bright the game actually is |
| Death's Door Artbook on Steam | [store.steampowered.com/app/1662730](https://store.steampowered.com/app/1662730/Deaths_Door_Artbook/) | A free 43-page PDF of concepts curated by Frits Olsen. It needs the base game and hasn't been reviewed yet |
| Deepwoken Mechanics | [deepwoken.fandom.com](https://deepwoken.fandom.com/wiki/Category:Mechanics) | Mechanics only |

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
- **Progress:** 2 of the 4–5 visual references are covered: Little Scavenger
  and Death's Door (see [Art direction](#art-direction)). Both are 3D, so at
  least one of the remaining references should be true 2D isometric art, to
  settle open decisions 2 and 5. The Deepwoken wiki is linked, but the combat
  blog articles aren't collected yet, and `references.md` doesn't exist yet.
- **Done when** there are at least 5 tagged references and open decisions 2,
  4 and 5 are answered.

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
