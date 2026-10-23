# Heaven Or Hell: Plan

## Overview

Heaven Or Hell is a working title for a roguelite seen through a fixed,
angled 3D camera, the way Death's Door is. It takes its mechanics from
Deepwoken and its look from Death's Door, pushed darker: toon-shaded 3D
rooms in near-black monochrome stone, with vivid glowing colours that bloom
against them. This plan turns the Granola notes "Heaven Or Hell" (Dan,
October 23, 2026) and Dan's follow-up decisions into milestones that fit
Terrene's existing scene, rules and test patterns.

The engine is not chosen yet. ExcaliburJS 0.32, which the project rules lock
Terrene to, is a 2D engine and can't draw a real 3D camera. The options and
a recommendation are in [Engine options](#engine-options), and the choice is
open decision 6.

### What the notes decided

These are the meeting notes as recorded. Two of them, the look and the
style reference, were refined in the follow-up below.

- Genre: a roguelite (runs end, some progress carries over), not a roguelike.
- Drop the earlier "Shroom and Gloom" direction. It was too derivative.
- Mechanics come from Deepwoken (Roblox), and only the mechanics and systems.
  Reference: [Deepwoken Mechanics](https://deepwoken.fandom.com/wiki/Category:Mechanics),
  plus blog articles that explain its gameplay.
- Look: 2D high-resolution art in an isometric view. It should not look like
  Roblox. It should feel like "Deepwoken done properly on a real engine."
  *The follow-up replaces the 2D isometric view with a fixed 3D camera.*
- Palette: very dark backgrounds, very vibrant foregrounds, high contrast and
  bloom. Parallax or animated backgrounds are wanted.
- Target imagery: dark stone, cyan, orange and red glows, isometric dungeon
  rooms, NPC dialogue, progression across several floors.
- Primary style reference: the
  [Little Scavenger itch.io profile page](https://coderedstudio.itch.io/little-scavenger)
  by Coderedstudio, plus a
  [YouTube video from its creator](https://youtu.be/OKOf6yrfg4Q).
  *The follow-up makes Death's Door the primary style reference.*
- Next steps from the meeting: gather 4–5 more visual references, then plan
  and build in Cursor.

### What Dan decided after the meeting

Dan made these decisions in a follow-up after the meeting notes were
written. In his words: "I like Death's Door's fixed camera more than Little
Scavenger's, so I think we should go with Death's Door's fixed camera
instead of a 2D isometric camera. And about the art, I feel like we should
go for more of a Death's Door artistic style, with just darker, dark
contrast with monochromatic tones. And I'd like popping colors that are
vibrant and blooming. High contrast, high resolution. And that's only for
the aesthetics of the game. We're still following the Deepwoken mechanics."

- **Camera.** The game uses a fixed, angled 3D camera like Death's Door's,
  not a 2D isometric tile camera. The player never rotates it.
- **Art style.** Death's Door is now the primary style reference: chunky
  bevelled shapes, toon-shaded 3D, ink-like edges and readable silhouettes.
  It is pushed darker, with high contrast and a monochromatic base, and with
  vibrant glowing colours that bloom and pop against it.
- **Resolution.** The game renders at high resolution. It is not pixel art
  and does not use a low-resolution render. This settles open decision 2.
- **Little Scavenger** stays a reference for lighting and colour only.
- **Mechanics are unchanged.** The decisions above are about aesthetics.
  The Deepwoken mechanics in [Mechanics scope](#mechanics-scope) stay as
  planned.

### Not decided yet

Each open decision blocks a specific milestone, marked in brackets.

1. **What "Heaven Or Hell" means in play.** Here's one reading that fits
   Deepwoken's two lives: you descend through hell floors, and dying twice
   sends you down instead of ending the run. A second reading: at each floor
   exit you choose to go up (safer, fewer rewards) or down (riskier, more
   rewards). [M4]
2. **Pixel art or painted art.** *Resolved by Dan's follow-up: neither.* The
   game is high-resolution, toon-shaded 3D, in Death's Door's style. There is
   no pixel art, no low-resolution render target and no pixel snapping.
3. **Input scheme.** Deepwoken is mouse plus keyboard. Terrene's scenes are
   keyboard-first. This plan assumes keyboard-first, with the mouse for aiming
   as an option. [M2]
4. **Where the art comes from.** The art is now 3D models and their
   textures. The choices are bought model packs, original models built in
   Blender, or generated models, or a mix. Someone on the team has to be able
   to model, rig and animate in Blender for any of the engine options. [M1]
   *Partial answer:* the Death's Door concept sheets show a workable format
   for source sheets: one room per sheet, with props, a flat elevation of
   each key piece and short notes on how it's used.
5. **The fixed camera angle and lens.** The camera is fixed and angled, but
   its pitch, yaw and lens still need to be chosen. The lens is either
   orthographic, with no perspective, or perspective with a narrow field of
   view. The sources gathered so far don't say which one Death's Door uses.
   Its store screenshots don't all use the same yaw: some look straight
   along a room's walls and others look along a diagonal. Death's Door also
   uses a "classic isometric angle" for its world and a straighter angle for
   its office hub, which suggests a hub could break the rule on purpose. A
   reasonable starting point is the common isometric setup that Unity's
   camera tutorial describes, about 45 degrees of yaw and 35 degrees of
   pitch, tuned against the screenshots. [M1]
6. **The engine.** Excalibur 0.32 can't draw a 3D camera, so the game needs
   either a 2.5D workaround inside Excalibur, a 3D web library inside this
   repo, or a native engine in a new repo. This plan recommends Three.js
   inside Terrene, with Excalibur kept for routing, input, HUD and dialogue.
   That needs Dan's sign-off and a change to the project rules. See
   [Engine options](#engine-options). [M1]

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

Death's Door is the primary style reference: its fixed angled camera, its
chunky bevelled toon-shaded 3D and its readable silhouettes. Heaven Or Hell
takes that and makes it much darker. The environment is near-black and
monochromatic, and only light sources, actors and effects carry vivid colour
and bloom. Little Scavenger is the reference for lighting and colour only.

### What the references show

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
a muted mid-key game with dark pockets. It isn't a near-black one, so its
shapes, camera and shading are borrowed but its brightness is not.

A trailer artist rebuilt Death's Door's character toon shader to add a rim
light and support for more than one light, because the original "only
supported a single directional light source," and the trailer used "heavy
use of post processing" and volumetrics. That describes the trailer, not the
shipped game. It's still a useful hint: to push the look further, the
artist's first addition was a rim light on the characters.

**Little Scavenger** (Coderedstudio) is a 3D roguelite prototype. Its itch.io
page tags it "3D" and "Pixel Art", and a player comment calls the look "a bit
of PSX style graphics." It renders at low resolution under a fixed
near-isometric camera. Heaven Or Hell takes only its light and colour: glows
that each have one job, bloom only on emissive objects, pooled light on a
dark floor and edges that fall off to black. Its itch comments also flag
what to fix: timed attacks "don't show their timers," and players asked for
more feedback when they take damage.

### Rules for Heaven Or Hell

These rules are this plan's proposal. They take Death's Door's camera,
shapes and shading, darken them, and use Little Scavenger's approach to
light and colour.

- **Camera.** One fixed, angled camera follows the player through a room and
  never rotates. Every room is modelled to read from that angle. The angle
  and lens are open decision 5. A hub may use a different, straighter angle
  on purpose, as Death's Door's office does.
- **High resolution.** The game renders at the display's full resolution,
  with antialiasing on. There is no pixel art, no low-resolution render
  target and no pixel snapping. Textures are painted or flat-coloured, never
  pixel art.
- **Value structure.** The environment lives in the bottom 15% of
  brightness. Floors in shadow sit around `#0B0C10` to `#16181F`, and lit
  floor never rises above about 35% brightness. Pure black is kept for edges,
  ink lines and the void beyond the room. Only light sources, actors and
  effects go above 60%.
- **Monochrome base per biome.** Each biome builds every environment surface
  from one hue at low saturation, so a room reads as a single dark tone and
  the glows are the only real colour in it. This is Death's Door's greyscale
  Hall of Doors, taken further and tinted per biome. The proposed bases are
  in the table after this list.
- **Toon shading.** Surfaces use hard-stepped toon bands, not smooth
  shading: three steps, for shadow, mid and lit. On the environment the
  three steps stay inside the value structure, from the shadow floor to the
  35% ceiling. Characters use the same bands plus a rim light, the trailer
  artist's first addition. Emissive surfaces skip the bands and draw at full
  brightness.
- **Ink outlines.** Every mesh gets a dark ink outline of constant on-screen
  thickness, matching the ink line on the Death's Door sheets. Environment
  outlines are pure black, so they merge into the shadows and only show
  where a shape meets light. That is why actors also need rim light to read.
  The hero's outline is cyan instead of black.
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
  uses its pink crystal and gold Spirit Crow. Glow colours are fully
  saturated and bright, so they pop against the monochrome base.
- **Bloom, fog and lighting.** Bloom applies only to emissive surfaces above
  the bloom threshold, never to the environment. Fog uses a near-black tint
  of the biome's base hue and must never lift the shadows above the base,
  which rules out Little Scavenger's grey fog. Light shafts are allowed as
  additive shapes over dark.
- **Character readability.** Every actor reads in silhouette first. The hero
  gets a bright cyan outline and rim light. Enemies get a thin warm rim, and
  related enemies share a shape, as the Ghost "echoes" the Golem. Each actor
  gets one strong colour accent, like the crow's red sword.
- **Environment shape language.** Model the environment from chunky,
  bevelled, slightly irregular stone kit pieces, with plain floors and
  ornament gathered on focal pieces. Build rooms as dioramas, with walls on
  the camera side cut low or removed so they never hide the player.
- **UI palette.** UI panels are near-black and translucent, with a thin cyan
  or amber line, never white boxes. Numbers and icons use the same glow roles
  as the world. Telegraphs always show their timing, for example with
  shrinking circles on the ground.
- **Heaven and hell can be base-hue shifts.** Death's Door separates its hub
  from its world with colour (greyscale against colour) and camera angle.
  Heaven Or Hell can do the same between its floors by changing the
  monochrome base hue and the special accent, on the same near-black values.
  This depends on open decision 1.

Proposed monochrome bases. The hex values follow the value structure: the
shadow range is the floor in shadow, and the lit ceiling is the brightest a
lit floor gets, at about 35% brightness.

| Biome | Base hue | Shadow range | Lit ceiling | Special accent |
| --- | --- | --- | --- | --- |
| First floors (stone) | Cold blue-grey slate | `#0B0C10` to `#16181F` | `#4A5059` | Green, for one shrine |
| Hell floors | Char and oxblood, desaturated | `#100A0A` to `#1E1212` | `#59403E` | None beyond red. The base stays desaturated so danger red still stands apart |
| Heaven floors | Cold bone grey, near neutral | `#0E0E10` to `#1A1A1E` | `#59575A` | Pale gold |
| Second biome (M5) | Chosen at M5, one hue not used above | – | – | – |

### Borrow and avoid

| Reference | Borrow | Avoid |
| --- | --- | --- |
| Death's Door | The fixed angled 3D camera. Chunky bevelled shapes with a dark ink line. Toon-shaded 3D with readable silhouettes. Rooms built as dioramas. Ornament on focal objects, plain floors. Small warm light pools. Cyan kept for the uncanny. Related enemies sharing shapes. A rim light on characters. One colour accent per character. Concept sheets with breakouts and notes. Separating areas with colour, as the greyscale hub does | The mid-key brightness and the desaturated greens and ochres, which are far too bright for near-black. Cut edges on a light board instead of falling off to black |
| Little Scavenger | Lighting and colour only: glow colours with one job each, bloom only on emissive objects, a bright outline on the player, light shafts and pooled light on a dark floor, edges that fall off to black, coloured ground telegraphs and "!" alerts | The low-resolution render and voxel props. Grey fog that lifts the blacks. Muddy olive and ochre mid-tones. White UI boxes. Telegraphs with no timer |
| Deepwoken wiki | Mechanics only (see Mechanics scope) | Its look, because the notes say it shouldn't look like Roblox |

### References

| Reference | Link | What to take from it |
| --- | --- | --- |
| Little Scavenger itch.io page | [coderedstudio.itch.io/little-scavenger](https://coderedstudio.itch.io/little-scavenger) | Glow, bloom, pooled light, telegraphs. The page tags it "3D", and player comments flag untimed telegraphs |
| Little Scavenger creator video | [YouTube](https://youtu.be/OKOf6yrfg4Q) | The meeting's original style reference, now used for lighting and colour |
| Sarah Morris, Death's Door concept art | [braverobynart.com/deathsdoor](https://braverobynart.com/deathsdoor) | Diorama rooms, shape language, light sources, readability, sheet format |
| Acid Nerve game credits | [acidnerve.com/game-credits](https://www.acidnerve.com/game-credits) | Who did what: Frits Olsen as art director, Sarah Morris on concept art, Juan Abad on 3D art |
| Byteside interview with Acid Nerve | [byteside.com](https://www.byteside.com/2021/08/deaths-door-developer-acid-nerve-on-how-it-made-its-sword-wielding-crow-game/) | "Muted tones of dungeons with vivid splashes of light and colour," a toon shader on the characters against naturally lit areas, and that the team learned Unity before making Death's Door |
| Press Start interview with Acid Nerve | [press-start.com.au](https://press-start.com.au/features/2021/03/27/we-spoke-to-the-team-at-acid-nerve-about-the-stylish-looking-deaths-door/) | Why isometric, and a different camera angle and colour for the hub |
| Stevivor interview with Acid Nerve | [stevivor.com](https://stevivor.com/features/interviews/acid-nerve-talks-deaths-door-interview/) | The greyscale Hall of Doors as a contrast to the coloured world |
| Kev Hayes, Death's Door trailer | [kevhayes.com/deaths-door](http://www.kevhayes.com/deaths-door) | A rim light added to the character toon shader, and heavy post-processing and volumetrics in the trailer |
| Death's Door on Steam | [store.steampowered.com/app/894020](https://store.steampowered.com/app/894020/Deaths_Door/) | The 12 store screenshots used to measure how bright the game is and to compare camera angles |
| Death's Door Artbook on Steam | [store.steampowered.com/app/1662730](https://store.steampowered.com/app/1662730/Deaths_Door_Artbook/) | A free 43-page PDF of concepts curated by Frits Olsen. It needs the base game and hasn't been reviewed yet |
| Death's Door on Wikipedia | [en.wikipedia.org](https://en.wikipedia.org/wiki/Death%27s_Door_(video_game)) | Lists Unity as the engine |
| Unity Learn, camera views | [learn.unity.com](https://learn.unity.com/pathway/creative-core/unit/creative-core-cameras/tutorial/explore-camera-views?version=6.0) | Isometric views usually face 45 degrees and sit 35 degrees above the focus, with orthographic or perspective cameras. A starting point for open decision 5 |
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

### What Excalibur 0.32 can and can't do

Excalibur describes itself as "a free and open source 2D game engine
written in TypeScript." The installed package, `excalibur` 0.32.0 in
`node_modules`, matches that:

- The only projection `Matrix` offers is `ortho()`, documented as "an
  orthographic (flat non-perspective) projection." There is no perspective
  projection.
- The built bundle never enables a depth test. The only `gl.enable` call is
  for `gl.BLEND`. Draw order comes from z-index and sorting, not a depth
  buffer.
- `Material` takes custom GLSL, but its vertex input is a 2D `a_position`
  drawn through the ortho matrix. It shades sprites, not meshes, and there's
  no mesh, model loader or 3D light type.
- What it does have, and what a 2.5D approach would use: `Material` can bind
  extra textures, such as a normal map, by sampler name. `addPostProcessor`
  and `ScreenShader` can run a full-screen bloom pass. The engine option
  `enableCanvasTransparency` makes its canvas transparent, so another canvas
  can show underneath.

So a real Death's Door camera isn't possible in Excalibur 0.32. Upgrading
wouldn't help either, because Excalibur is 2D by design, and the project
rules forbid 0.33+.

### Engine options

| | (a) Excalibur, pre-rendered 2.5D | (b) Three.js inside Terrene (recommended) | (b2) Babylon.js inside Terrene | (c) Godot 4 or Unity, new repo |
| --- | --- | --- | --- | --- |
| Real 3D camera | No. Faked at one angle | Yes | Yes | Yes |
| Toon shading | Baked into renders | `MeshToonMaterial` with a gradient map | `CellMaterial` | Engine shaders |
| Outlines | Baked into renders | `OutlineEffect` | `renderOutline` on meshes | Engine shaders |
| Bloom | Custom `ScreenShader` | `UnrealBloomPass` with a threshold | Bloom and a glow layer in `DefaultRenderingPipeline` | Glow (Godot), post-processing (Unity) |
| Dark fog | 2D gradient overlays | `FogExp2` | Scene fog | Depth and height fog (Godot on the web) |
| Keeps Terrene systems | Yes | Yes, with Excalibur as an overlay | Partly. It overlaps Excalibur more | No |
| GitHub Pages | Yes, as today | Yes, as today | Yes, as today | Possible, as a separate build |
| Project rule change | None | Yes | Yes | New project |

**(a) Stay in Excalibur and fake it.** Model everything in Blender, then
render it at the one fixed angle into high-resolution sprites and normal
maps. A custom `Material` lights sprites from their normal maps, and bloom
is a `ScreenShader`. It works because the camera never rotates, and it keeps
every Terrene system and rule. The costs are large. Every character
animation has to be rendered in every facing the game needs, at high
resolution, plus a normal map for each frame, so the sprite sheets and
texture memory grow with resolution, facings and frames. The toon bands and
outlines are baked in at render time, so lights that move can only change a
sprite through its normal map. With no depth buffer, actors are sorted
against rooms by draw order, so rooms must be split into layers wherever an
actor can pass behind something. Any room with a second camera angle means
rendering its kit again. This option suits a game with few animations, and
Deepwoken-style combat needs many.

**(b) Three.js inside Terrene. Recommended.** Three.js is a 3D rendering
library, not a full engine, so it can draw the world while Excalibur keeps
running the scene, input, HUD and dialogue on a transparent canvas laid
over it. Three.js ships each piece the look needs:

- `MeshToonMaterial` implements toon shading. Its `gradientMap` sets the
  bands and needs `NearestFilter` for hard steps. Its `emissive` colour is
  "unaffected by other lighting," which is what the glow roles need.
- `OutlineEffect` is "an outline effect for toon shaders," with a set
  thickness and colour. It works only with `WebGLRenderer`, and the docs
  point to `ToonOutlinePassNode` for `WebGPURenderer`.
- `UnrealBloomPass` takes a luminance threshold, so only bright areas bloom.
  The docs say tone mapping must be enabled with it.
- `FogExp2` gives exponential fog with any colour, including near-black.
- `OrthographicCamera` and `PerspectiveCamera` cover either answer to open
  decision 5.
- `GLTFLoader` loads glTF 2.0 models, the usual export from Blender.

It stays TypeScript and webpack and deploys to GitHub Pages as static files,
like the rest of Terrene. `rules.ts` and `floors.ts` stay pure and engine-free.
`ChatSystem`, `QuestSystem` and `DialogueNPC` are built on Excalibur types
(`Actor`, `Vector`, `Text`, `GraphicsGroup`), so they keep working only if
Excalibur stays in the scene as the overlay. One model serves every facing,
and skeletal animation replaces rendered frames, so the art pipeline is
smaller than option (a)'s. The costs are two render loops and two canvases
to keep in sync, world-space markers such as quest indicators that must be
projected from 3D to screen coordinates, and a second rendering dependency.

**(b2) Babylon.js inside Terrene.** Babylon.js also has every piece:
`DefaultRenderingPipeline` with bloom (threshold, weight, kernel and scale)
and a glow layer, `CellMaterial` for quantised toon lighting, and
`renderOutline` on meshes. It's a full engine with its own scene graph and
render pipeline, so it overlaps more with Excalibur's scenes than Three.js
does. It's a fair alternative if Dan would rather have more built in.

**(c) A native engine in a new repo.** Death's Door was made in Unity, so
Unity is the most direct way to its look. Godot 4 is the other common
choice. Both can export to the web with limits. Godot 4's web export
needs WebAssembly and WebGL 2.0 and uses only the Compatibility renderer.
That renderer supports glow and depth and height fog, but not volumetric
fog, and C# projects can't export to the web, so the game would be written
in GDScript. Unity's web builds don't support C# threads and run on WebGL,
which is based on OpenGL ES. Either way it means a new repo, a new language
and none of Terrene's systems or test setup, although the rules in this plan
port over. This option is the right one if Heaven Or Hell should become a
desktop game first.

**Recommendation.** Option (b), Three.js inside Terrene, with Excalibur kept
for routing, input, HUD and dialogue. It's the only option that gives the
real Death's Door camera, toon shading, outlines, bloom and dark fog while
staying on the web, in TypeScript and webpack, on GitHub Pages and with the
Terrene systems. M1 is its proof: if one lit room can't hold 60 frames per
second with the overlay working, fall back to option (c) with Godot 4.
Option (a) is only worth it if Dan wants Excalibur alone to stay the rule.

**What option (b) changes in the project rules.** Excalibur stays at 0.32.0,
so the version lock holds. But `.cursor/rules/terrene-project-rules.md`
calls Terrene "a 2D RPG game built with ExcaliburJS 0.32.x," and its asset
standards assume PNG sprites at 16x16 with `ImageFiltering.Pixel` and a PNG
as each component's primary sprite. Adding Three.js needs Dan's sign-off and
an update to that file and `docs/coding-standards.md` together, as the rules
require. The update should allow a pinned Three.js version for Heaven Or
Hell only, allow `.glb` models as a component's primary asset, and keep
Excalibur 0.32.x for everything else.

The rest of this section is written for option (b). The notes marked
"Other options" say what changes if Dan picks another.

### Scene and routing

- Scene key `heavenorhell`, opened at `/#heavenorhell`, added to
  `ROUTED_SCENES` and `SCENE_TITLES` in `src/components/Terrene.ts`. Oka
  World stays the default scene.
- The scene is an Excalibur `Scene`, as the project rules require. On
  activate it creates the Three.js renderer and its canvas under
  Excalibur's canvas, turns on canvas transparency, and sizes both to the
  same fitted rectangle. On `onDeactivate()` it stops the render loop,
  disposes the renderer, geometry, materials and textures, removes the
  canvas, and restores the screen settings.
- The HUD and dialogue run at high resolution with antialiasing, using
  `OkaScene`'s method of saving the screen settings, switching them and
  restoring them. The rest of Terrene runs at 256x240 pixel art with
  `suppressHiDPIScaling`, so the pixel ratio follows the display the way
  `OkaScene.pickPixelRatio()` does.
- Other options: under (a), Excalibur draws everything and there is no
  second canvas. Under (c), none of this applies.

### Code layout

This follows the Street split, where the rules are pure and the scene is
thin:

```
src/components/scenes/HeavenOrHell/
├── HeavenOrHell.ts     # Excalibur scene: load, routing, input, HUD, dialogue, onDeactivate cleanup
├── rules.ts            # Pure combat and run rules: posture, parry, roll, lives
├── floors.ts           # Seeded floor and room generation (pure)
├── palette.ts          # Biome base tones, toon bands and glow-role colours (pure)
├── world/
│   ├── renderer.ts     # Three.js renderer, fixed camera, bloom, outlines, fog, tone mapping
│   ├── room.ts         # Builds a room from a room plan out of glTF kit pieces
│   ├── toon.ts         # Toon materials: gradient maps per biome, emissive glow roles
│   └── sync.ts         # Mirrors rule-state positions into 3D and projects 3D to screen
├── hud.ts              # Health, posture, tempo, cooldown icons
└── sfx/, HeavenOrHell.mp3
src/components/characters/player/<Hero>/   # <Hero>.ts and <Hero>.glb
src/components/creatures/<Enemy>/          # one folder per enemy, per project rules
tools/heaven-or-hell/
├── source/             # reference images and .blend sources
├── references.md       # one line per reference: what to take from it
└── export_models.py    # exports the Blender sources to .glb
test/heaven-or-hell-rules.ts
docs/heaven-or-hell.md  # player-facing doc, written when M1 ships
```

Webpack 5, already installed, needs an asset rule so `.glb` files are
bundled like images.

Other options: under (a), `world/` is replaced by `room.ts` (sprite layers
from a room plan), `bloom.ts` (a `ScreenShader`), `lighting.ts` (a
normal-map `Material`) and a generated `art/atlas.ts`, and the tools script
renders sprites and normal maps from Blender instead of exporting models.
Under (c), only `rules.ts`, `floors.ts` and `palette.ts` carry over, as
designs to port.

### Testing

- `rules.ts`, `floors.ts` and `palette.ts` import nothing from Excalibur or
  Three.js, so `node:test` covers the parry window, posture overflow, roll
  i-frames, the two-lives state, seeded floor generation and the palette's
  value limits, all deterministically. This holds for every engine option.
- **Fix this first:** `node --test test/street-rules.ts` fails today with
  `ERR_MODULE_NOT_FOUND` because `Street/level.ts` imports `./rules` without
  an extension, and Node 22's type stripping needs one. The fix is to use
  `.ts` import specifiers (with `allowImportingTsExtensions` in tsconfig) or
  to add a TypeScript runner such as `tsx`. Then wire `test/*.ts` into
  `npm test`, which today points at a `test/test.js` that doesn't exist.
- Each milestone also ends with a manual run in the browser at
  `/#heavenorhell`: a screen recording, a clean console and a frame-rate
  reading. `puppeteer` and `pixelmatch` are already dev dependencies and
  could take and compare M1 screenshots, if headless WebGL works with them.

## Milestones

### M0: References and decisions (Dan, before any code)

- Gather 4–5 more visual references, as the meeting asked. Sources: Google
  Images and specific itch.io profile pages. They should now be stylised,
  toon-shaded 3D under a fixed camera, darker than Death's Door.
- Store them in `tools/heaven-or-hell/source/` and give each one a line in
  `references.md` saying what to take from it (palette, shape, glow, camera,
  UI). Follow the sourcing notes. Call an itch page a "specific itch
  profile page," not a "website." Leave out anything off-topic, because every
  stray image adds ambiguity.
- Add the Deepwoken wiki pages and one or two blog articles about its combat
  to `references.md`.
- Pick the engine (open decision 6), and if it's option (b), sign off on the
  project rules change.
- Pick the camera angle and lens (open decision 5), by matching a test scene
  against the Death's Door store screenshots.
- **Progress:** 2 of the 4–5 visual references are covered: Death's Door and
  Little Scavenger (see [Art direction](#art-direction)). Open decision 2 is
  settled. The Deepwoken wiki is linked, but the combat blog articles aren't
  collected yet, and `references.md` doesn't exist yet.
- **Done when** there are at least 5 tagged references and open decisions
  4, 5 and 6 are answered.

### M1: One lit room

- The `#heavenorhell` route with the Three.js world under the Excalibur
  overlay, at full resolution, and switching away disposes it cleanly.
- The fixed camera from open decision 5, following the hero without
  rotating.
- One hand-built stone room as a greybox: bevelled boxes in the first
  floors' slate base, with the camera-side walls cut low. Placeholder kit
  pieces are fine. The 2D packs in `src/assets/` aren't usable here.
- The hero as a placeholder model walking in 8 directions on the floor
  plane, with real occlusion against walls and pillars from the depth
  buffer.
- Toon materials with three bands, black ink outlines with a cyan outline on
  the hero, glowing braziers in cyan, orange and red, the bloom pass, and
  near-black fog. One animated backdrop layer beyond the room's edge.
- One `ChatSystem` line drawn over the 3D view, to prove the overlay.
- **Done when** a screenshot reads as "near-black monochrome room, vivid
  glows" next to the M0 references, the frame rate holds at 60 at full
  resolution, and switching to another hash restores the screen settings
  and leaves no WebGL context behind.
- Other options: under (a), M1 is the same room as pre-rendered sprite
  layers and normal maps in Excalibur, with draw-order sorting instead of a
  depth buffer, and the done-when adds a check on texture memory. Under (c),
  M1 is the same room in a new Godot or Unity project, and the overlay and
  routing checks don't apply.

### M2: The combat core

- `rules.ts` covers the light attack chain with its flourish, block and
  posture, parry with its cooldown, and roll with i-frames.
- One melee enemy whose wind-ups can be read and parried, plus the HUD:
  health, posture and cooldown icons.
- Hit-stop and a screen shake when you parry or guard-break. The shake
  moves the fixed camera without rotating it.
- **Done when** unit tests cover every timing rule, and in manual play a
  clean parry, a guard break and a dodge through an attack each work and feel
  distinct.

### M3: Depth of combat

- Critical attacks, feints, Tempo and Vent.
- Two more enemy types: a ranged one with telegraphed area attacks, and a
  heavy one with hyperarmor.
- Telegraphs follow the Little Scavenger feedback: shrinking timer circles
  on the ground, visible cooldowns and clear feedback when you take damage.
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
- Deep Shrine rooms, more talents, and a second biome with its own
  monochrome base tone.
- **Done when** two runs with different attunements play noticeably
  differently.

### M6: Polish and release

- An original score and sound effects, built by a script such as
  `tools/oka-world/compose_music.py`.
- The title and chapter cards, `docs/heaven-or-hell.md`, and a README entry.
- **Done when** the GitHub Pages build serves `/#heavenorhell` and the
  console has no errors on a fresh `localStorage`.

## Risks

- **The engine choice is open.** M1 can't start until Dan picks one. If the
  M1 room can't hold its frame rate with the Excalibur overlay, plan for
  option (c) instead of patching the hybrid.
- **Two renderers in one scene.** Excalibur and Three.js each run a loop and
  own a canvas. Input, resizing, pausing and cleanup have to be handled once,
  in `HeavenOrHell.ts`, or they'll drift. Settle it in M1.
- **Bloom and outline cost at full resolution.** A bloom pass and an outline
  pass every frame at the display's resolution can drop the frame rate on
  low-end GPUs. To mitigate it, run bloom at a lower resolution than the
  frame, as `HollowDark` paints its lighting at 480x270, and measure in M1.
- **Tone mapping against near-black.** `UnrealBloomPass` needs tone mapping,
  and tone mapping can lift or crush the darkest values. Check the M1 room
  against the value structure, not by eye alone.
- **Camera occlusion.** A fixed camera means walls and props can hide the
  hero. The diorama rule (cut the camera-side walls low) has to hold for
  every room, including generated ones in M4.
- **The art supply** is the real bottleneck, not the code. Every option
  needs someone who can model, rig and animate in Blender. M1 can ship with
  greybox placeholders, but the look depends on M0 and open decision 4.
- **Combat feel** is hard to judge from tests alone. Each combat milestone
  needs a manual play session and a recording, not only green tests.
- **Engine pin.** Every Excalibur API used must exist in ExcaliburJS
  0.32.x. If Three.js is added, pin its exact version too, because the
  WebGL and WebGPU paths differ (`OutlineEffect` is WebGL only).

## Engine sources

These are the sources behind the claims in [Technical approach](#technical-approach).

| Source | Link | What it supports |
| --- | --- | --- |
| Excalibur docs, welcome page | [excaliburjs.com/docs](https://excaliburjs.com/docs/) | Excalibur is "a free and open source 2D game engine" |
| Excalibur docs, materials | [excaliburjs.com/docs/materials](https://excaliburjs.com/docs/materials) | Materials are custom shaders on graphics, WebGL only |
| Installed `excalibur` 0.32.0 | `node_modules/excalibur/build/dist` | `Matrix.ortho()` only, no depth test, 2D `Material` vertex input, `enableCanvasTransparency` |
| Three.js `MeshToonMaterial` | [threejs.org](https://threejs.org/docs/pages/MeshToonMaterial.html) | Toon shading, `gradientMap` with `NearestFilter`, `emissive` |
| Three.js `OutlineEffect` | [threejs.org](https://threejs.org/docs/pages/OutlineEffect.html) | Outlines for toon shaders, WebGL only |
| Three.js `UnrealBloomPass` | [threejs.org](https://threejs.org/docs/pages/UnrealBloomPass.html) | Threshold bloom, needs tone mapping |
| Three.js `FogExp2` | [threejs.org](https://threejs.org/docs/pages/FogExp2.html) | Exponential fog with a set colour |
| Three.js `OrthographicCamera` | [threejs.org](https://threejs.org/docs/pages/OrthographicCamera.html) | An orthographic lens for open decision 5 |
| Three.js `GLTFLoader` | [threejs.org](https://threejs.org/docs/pages/GLTFLoader.html) | Loading glTF 2.0 models |
| Babylon.js default rendering pipeline | [doc.babylonjs.com](https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/defaultRenderingPipeline) | Bloom with threshold, glow layer, tone mapping |
| Babylon.js cell material | [doc.babylonjs.com](https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/cellShadingMat) | Toon (cell) shading with up to five light levels |
| Babylon.js `Mesh` | [doc.babylonjs.com](https://doc.babylonjs.com/typedoc/classes/BABYLON.Mesh) | `renderOutline`, `outlineColor`, `outlineWidth` |
| Godot, exporting for the web | [docs.godotengine.org](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html) | Needs WebAssembly and WebGL 2.0, Compatibility renderer only, no C# on the web |
| Godot, overview of renderers | [docs.godotengine.org](https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html) | Compatibility supports glow and depth and height fog, not volumetric fog |
| Unity, web technical limitations | [docs.unity3d.com](https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-technical-overview.html) | No C# threads on the web, WebGL based on OpenGL ES |
| MobyGames, Death's Door releases | [mobygames.com](https://www.mobygames.com/game/168005/deaths-door/releases/) | Credits Unity Technologies as the game engine |
