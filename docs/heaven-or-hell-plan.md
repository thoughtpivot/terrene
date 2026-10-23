# Heaven Or Hell: Plan

## Overview

Heaven Or Hell is a working title for an open-map roguelite set in Heaven.
You play a lesser angel defending Heaven while Hell invades it. It takes its
mechanics from Deepwoken and its look from Death's Door, pushed darker. The
world is toon-shaded, bevelled 3D seen from one fixed, angled camera, in
near-black monochrome, and Heaven's white and gold clash with Hell's red and
orange in glows that bloom against the dark.

The game is built in ExcaliburJS 0.32, like the rest of Terrene. Because the
camera never rotates, the 3D look is pre-rendered: models are built in
Blender, rendered at the one fixed angle into high-resolution sprites with
emissive and normal passes, and lit, bloomed and fogged in Excalibur.

This plan turns the Granola notes "Heaven Or Hell" (Dan, October 23, 2026)
and Dan's follow-up decisions into milestones that fit Terrene's existing
scene, rules and test patterns.

### What the notes decided

These are the meeting notes as recorded. Several were refined in Dan's
follow-up decisions below.

- Genre: a roguelite (runs end, some progress carries over), not a roguelike.
- Drop the earlier "Shroom and Gloom" direction. It was too derivative.
- Mechanics come from Deepwoken (Roblox), and only the mechanics and systems.
  Reference: [Deepwoken Mechanics](https://deepwoken.fandom.com/wiki/Category:Mechanics),
  plus blog articles that explain its gameplay.
- Look: 2D high-resolution art in an isometric view. It should not look like
  Roblox. It should feel like "Deepwoken done properly on a real engine."
  *The follow-up replaces the 2D isometric view with a fixed 3D-style
  camera, pre-rendered.*
- Palette: very dark backgrounds, very vibrant foregrounds, high contrast and
  bloom. Parallax or animated backgrounds are wanted.
- Target imagery: dark stone, cyan, orange and red glows, isometric dungeon
  rooms, NPC dialogue, progression across several floors.
  *The follow-up makes red and white the main clash, and replaces floors with
  an open map.*
- Primary style reference: the
  [Little Scavenger itch.io profile page](https://coderedstudio.itch.io/little-scavenger)
  by Coderedstudio, plus a
  [YouTube video from its creator](https://youtu.be/OKOf6yrfg4Q).
  *The follow-up makes Death's Door the primary style reference.*
- Next steps from the meeting: gather 4–5 more visual references, then plan
  and build in Cursor.

### What Dan decided after the meeting

Dan made these decisions in follow-ups after the meeting notes were written.

**Camera and art.** In his words: "I like Death's Door's fixed camera more
than Little Scavenger's, so I think we should go with Death's Door's fixed
camera instead of a 2D isometric camera. And about the art, I feel like we
should go for more of a Death's Door artistic style, with just darker, dark
contrast with monochromatic tones. And I'd like popping colors that are
vibrant and blooming. High contrast, high resolution. And that's only for
the aesthetics of the game. We're still following the Deepwoken mechanics."

- **Camera.** One fixed, angled camera like Death's Door's, not a 2D
  isometric tile camera. The player never rotates it.
- **Art style.** Death's Door is the primary style reference: chunky
  bevelled shapes, toon shading, ink-like edges and readable silhouettes,
  pushed darker, with high contrast, a monochromatic base and vivid glows
  that bloom.
- **Resolution.** High resolution. Not pixel art, and no low-resolution
  render.
- **Little Scavenger** stays a reference for lighting and colour only.

**Engine.** Dan: "Stay in ExcaliburJS." The game is built in Excalibur 0.32
with pre-rendered 3D, described in [Technical approach](#technical-approach).
Three.js, Babylon.js and native engines (Godot, Unity) were considered.
Excalibur won because it reuses `ChatSystem`, `QuestSystem` and
`DialogueNPC`, it keeps the project rules as they are, and the camera never
rotates, so pre-rendering at one angle works.

**Premise.** The game takes place in Heaven. You are a lesser angel. Hell is
attacking and invading Heaven, and you defend Heaven from Hell taking it
over.

**World structure.** Dan: "You're walking on an open map where you have to
traverse heaven." The game is an open, traversable map of Heaven, not
discrete floors of rooms. It is still a roguelite, the way Deepwoken is an
open world with permadeath. How the two fit is proposed in
[World and run structure](#world-and-run-structure), for Dan to confirm.

**Creatures.** Heaven is full of "biblically accurate" heavenly creatures,
for immersion: seraphim with six wings, ophanim as wheels within wheels
covered in eyes, cherubim with four faces, thrones and others. Whether they
fight for you, ignore you or fight against you is open decision 1.

**Palette.** The red of Hell and the white of Heaven are the main clash.
Both pop vividly, with bloom, against a dark, high-contrast monochrome base.

**Combat feel.** Combat should "make you feel like you are the one actually
swinging the weapon and parrying and dodging." This is now a design pillar,
with game-feel targets in M2 and M3.

**Mechanics are unchanged.** Everything above is premise, world and
aesthetics. The Deepwoken mechanics in [Mechanics scope](#mechanics-scope)
stay as planned.

### Resolved since the first draft

- **What "Heaven Or Hell" means in play.** Resolved by the premise: you
  defend Heaven against Hell's invasion. The earlier readings (descending
  through hell floors, or choosing up or down at each exit) are dropped.
- **Pixel art or painted art.** Resolved: neither. The game is high-resolution,
  toon-shaded 3D, pre-rendered.
- **The engine.** Resolved: ExcaliburJS 0.32.

### Not decided yet

Each open decision blocks a specific milestone, marked in brackets.

1. **What the heavenly creatures are to the player.** Allies, neutral
   wildlife, or also enemies (fallen or corrupted angels) alongside Hell's
   demons? *Proposal:* a mix. Uncorrupted creatures are allies and NPCs,
   corrupted ones are elite enemies and bosses, and demons are the common
   enemies. See [Creatures](#creatures). [M3]
2. **The fixed camera angle and lens.** The camera is fixed, but its pitch,
   yaw and lens still need choosing. The lens is either orthographic, with no
   perspective, or perspective with a narrow field of view. The sources
   gathered so far don't say which one Death's Door uses. Its store
   screenshots don't all use the same yaw: some look straight along a room's
   walls and others look along a diagonal. Pre-rendering makes this choice
   expensive to change later, because every sprite is rendered at it. A
   reasonable starting point is the common isometric setup that Unity's
   camera tutorial describes, about 45 degrees of yaw and 35 degrees of
   pitch, tuned against the screenshots. [M1]
3. **Who makes the 3D models and animations.** Bought model packs, original
   models built in Blender, generated models, or a mix. Someone has to model,
   rig and animate in Blender, and run the render pipeline. [M1]
   *Partial answer:* the Death's Door concept sheets show a workable format
   for source sheets: one area per sheet, with props, a flat elevation of
   each key piece and short notes on how it's used.
4. **Desktop only, or mobile too.** This decides the sprite resolution, how
   much texture memory the game can use and how much bloom it can afford.
   [M1]
5. **How big Heaven's map is.** The number of regions and their size set the
   art budget and the streaming work. [M4]
6. **Whether Heaven's map has a hub.** *Proposal:* a sanctuary region where
   Graces are spent and allied NPCs talk, which an attack never reaches.
   [M4]
7. **Input scheme.** Deepwoken is mouse plus keyboard. Terrene's scenes are
   keyboard-first. This plan assumes keyboard-first, with the mouse for aiming
   as an option. [M2]

## Design pillars

1. **You are the one swinging, parrying and dodging.** Combat comes first.
   Inputs act at once, hits land with weight, and every enemy attack can be
   read. Posture, parry and roll matter more than numbers. A skilled player
   with starting gear can hold the first region.
2. **Death matters, a run doesn't end on the first mistake.** Deepwoken's two
   lives fit the "roguelite" choice well.
3. **Dark world, bright actors.** Anything you can interact with glows. The
   environment stays close to black.
4. **Small systems, kept separate.** Rules live in pure TypeScript and are
   tested without the engine, the way `Street/rules.ts` is.

## World and run structure

This section is a proposal for Dan to confirm. It reconciles the open map
with the roguelite decision the way Deepwoken does: the world stays, and the
character's run ends.

- **Heaven's map is fixed.** The regions, paths and landmarks are the same
  every run, so players learn the map. Region names are placeholders, for
  example the Outer Gates, the Courts, the Sea of Glass (from Revelation
  4:6) and the approach to the Throne.
- **Hell's invasion is reseeded every run.** Each run places breaches where
  Hell is pushing in, spreads corruption out from them, and sets up demon
  camps, roaming patrols and events. Where the corrupted elites stand also
  changes. The same seed always gives the same invasion, so it can be tested.
- **A run is a defence.** You seal breaches, which pushes corruption back
  and opens the way to the next region. Sealing a breach is the open-map
  equivalent of clearing a floor, so it's when the talent draft happens. A
  run is won by holding Heaven against the invasion's leader at the end.
- **Two lives, in angel terms.** Your first fall dims your halo. That's
  Deepwoken's stained health: the dimmed part of your health bar can't be
  healed until you pray at an altar or level up. A second fall casts you
  out, and the run ends.
- **Meta progress survives the fall.** Deepwoken's Echoes become Graces
  (a placeholder name). They're earned during a run, kept after it ends, and
  spent on starting options.

## Creatures

Heaven is full of "biblically accurate" heavenly creatures. Their designs
start from the scripture descriptions below, quoted from the ESV. The roles
are a proposal (see open decision 1).

| Creature | Scripture description | Proposed role |
| --- | --- | --- |
| Seraphim | Isaiah 6:2–7: "Each had six wings: with two he covered his face, and with two he covered his feet, and with two he flew." They call "Holy, holy, holy," and one carries "a burning coal that he had taken with tongs from the altar." | Allies and NPCs. A corrupted seraph is an elite whose burning coals become ranged attacks |
| Cherubim (the living creatures) | Ezekiel 1:5–14: "a human likeness," "four faces," "four wings," "human hands" under the wings, legs "straight," feet like "a calf's foot," sparkling "like burnished bronze." Each "went straight forward, without turning," and they "darted to and fro, like the appearance of a flash of lightning." Ezekiel 10:14 lists the faces as a cherub's, a human's, a lion's and an eagle's | Guardians and NPCs. A corrupted cherub is a boss that attacks in all four directions without turning |
| Ophanim (the wheels) | Ezekiel 1:15–21 and 10:9–13: "a wheel within a wheel," gleaming "like sparkling beryl," with rims "full of eyes all around." They move "in any of their four directions without turning" and are called "the whirling wheels." *Ophanim* is Hebrew for "wheels" | Ally sentinels that watch the map. A corrupted ophan is a boss that rolls through the arena |
| Thrones | Colossians 1:16 names "thrones or dominions or rulers or authorities" among things created "in heaven." Some Christian angelology treats Thrones as one of the choirs of angels and identifies them with the ophanim. Jewish angelic hierarchies keep the two apart | To be chosen: either the same creature as the ophanim, or a separate ruler class that guards the Throne region |
| The four living creatures of Revelation | Revelation 4:6–8: "like a lion," "like an ox," "with the face of a man," and "like an eagle in flight," "each of them with six wings," "full of eyes all around and within" | Guardians of the Throne region, and part of the final defence |
| The player | A lesser angel. The premise echoes Revelation 12:7, where "war arose in heaven, Michael and his angels fighting against the dragon" | The hero |
| Demons | Not drawn from a scripture description. Original designs | The common enemies: the melee, ranged and heavy types of M2 and M3 |

Two notes for the render pipeline. Cherubim and ophanim move "without
turning," so each needs only one facing instead of eight, which saves a lot
of render work. Wings and eyes are costly to animate, so they should loop
in short cycles.

## Art direction

Death's Door is the primary style reference: its fixed angled camera, its
chunky bevelled toon-shaded shapes and its readable silhouettes. Heaven Or
Hell takes that and makes it much darker. The environment is near-black and
monochromatic, and only light sources, actors and effects carry vivid
colour and bloom: white and gold for Heaven, red and orange for Hell. Little
Scavenger is the reference for lighting and colour only.

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

- **Camera.** One fixed, angled camera follows the player and never rotates.
  Every sprite is rendered at that angle, so nothing in the game may rotate
  the camera, and zoom stays within a narrow range so the baked ink lines
  keep their width. The angle and lens are open decision 2.
- **High resolution.** The game renders at the display's full resolution,
  with antialiasing on. There is no pixel art and no pixel snapping. Sprites
  are rendered at the size they're shown on a 1080p screen, not scaled up.
- **Value structure.** The environment lives in the bottom 15% of
  brightness. Floors in shadow sit around `#0B0C10` to `#16181F`, and lit
  floor never rises above about 35% brightness. Pure black is kept for edges,
  ink lines and the void beyond the map. Only light sources, actors and
  effects go above 60%.
- **Monochrome base per region.** Each region builds every environment
  surface from one hue at low saturation, so it reads as a single dark tone
  and the glows are the only real colour in it. This is Death's Door's
  greyscale Hall of Doors, taken further and tinted per region. Corruption
  pushes a region's base toward red and black. The proposed bases are in the
  table after this list.
- **Toon shading.** Surfaces use hard-stepped toon bands, not smooth
  shading: three steps, for shadow, mid and lit. On the environment the
  three steps stay inside the value structure, from the shadow floor to the
  35% ceiling. Characters use the same bands plus a rim light. Emissive
  surfaces skip the bands and draw at full brightness. The same three bands
  are used in Blender's renders and in the runtime lighting shader, so baked
  and runtime light match.
- **Ink outlines.** Every model gets a dark ink outline, baked in Blender at
  a fixed line width. Environment outlines are pure black, so they merge into
  the shadows and only show where a shape meets light. That's why actors
  also need rim light to read. The hero's outline is gold instead of black.
- **Where the light goes.** Each area has two to four small light sources.
  Each makes a pool on the ground that falls off to the near-black base. The
  map's edges fade to black, as in Little Scavenger. One focal object per
  area, such as a gate, altar or breach, gets the most ornament and the
  brightest light, as Death's Door's doors do.
- **Glow roles (proposal).**
  - *White and gold are Heaven and the player:* the hero's gold outline and
    white rim, their attacks, parry flashes, allied creatures, altars and
    anything the player can use. The hero's gold must stay distinct from
    the white of allied creatures.
  - *Orange is a warning:* enemy wind-ups, ground telegraphs and fire.
  - *Red is danger and Hell:* damage taken, lethal areas, breaches,
    corruption and demons.
  - Warm light sources that only light the area use a dim amber that doesn't
    compete with these.
  - Cyan is no longer a role. It's an optional accent, allowed once per
    region for something special, like the beryl gleam of an ophan, the way
    Death's Door uses its pink crystal.
  - Glow colours are fully saturated and bright, so they pop against the
    monochrome base, and the white-against-red clash is the strongest
    contrast on screen.
- **Bloom, fog and lighting.** Bloom applies only to emissive pixels above
  the bloom threshold, never to the environment. Because the environment
  stays below 35% brightness, a brightness threshold separates them. Fog
  uses a near-black tint of the region's base hue and must never lift the
  shadows above the base, which rules out Little Scavenger's grey fog. Light
  shafts are allowed as additive shapes over dark.
- **Character readability.** Every actor reads in silhouette first. The hero
  gets a gold outline and a white rim light. Demons and corrupted creatures
  get a thin red rim, and related enemies share a shape, as Death's Door's
  Ghost "echoes" its Golem. Each actor gets one strong colour accent, like
  the crow's red sword.
- **Environment shape language.** Model the environment from chunky,
  bevelled, slightly irregular stone kit pieces, with plain ground and
  ornament gathered on focal pieces. Walls and tall pieces on the camera
  side are cut low or left out, so they never hide the player.
- **UI palette.** UI panels are near-black and translucent, with a thin gold
  or amber line, never white boxes. Numbers and icons use the same glow roles
  as the world. Telegraphs always show their timing, for example with
  shrinking circles on the ground.

Proposed monochrome bases. The shadow range is the ground in shadow, and the
lit ceiling is the brightest lit ground gets, at about 35% brightness.

| Region state | Base hue | Shadow range | Lit ceiling |
| --- | --- | --- | --- |
| Heaven, uncorrupted (default) | Cold bone and ash grey, near neutral | `#0E0E10` to `#1A1A1E` | `#59575A` |
| Heaven, a second region | Cold slate, slightly blue | `#0B0C10` to `#16181F` | `#4A5059` |
| Heaven, a third region | Pale violet-grey | `#0E0C10` to `#1A171E` | `#56505A` |
| Corrupted (any region) | Char and oxblood, desaturated, darker | `#0A0606` to `#170D0D` | `#4A3533` |

Corruption is a blend, not a swap. As it spreads from a breach, the ground
shifts from the region's base toward the corrupted row, and red cracks and
embers appear. In the render pipeline the environment is rendered in near
neutral values and tinted at runtime, so one kit serves every region and
corruption can be animated.

### Borrow and avoid

| Reference | Borrow | Avoid |
| --- | --- | --- |
| Death's Door | The fixed angled camera. Chunky bevelled shapes with a dark ink line. Toon shading with readable silhouettes. Areas built as dioramas. Ornament on focal objects, plain floors. Small warm light pools. Related enemies sharing shapes. A rim light on characters. One colour accent per character. Concept sheets with breakouts and notes. Separating areas with colour, as the greyscale hub does | The mid-key brightness and the desaturated greens and ochres, which are far too bright for near-black. Cut edges on a light board instead of falling off to black |
| Little Scavenger | Lighting and colour only: glow colours with one job each, bloom only on emissive objects, a bright outline on the player, light shafts and pooled light on a dark floor, edges that fall off to black, coloured ground telegraphs and "!" alerts | The low-resolution render and voxel props. Grey fog that lifts the blacks. Muddy olive and ochre mid-tones. White UI boxes. Telegraphs with no timer |
| Deepwoken wiki | Mechanics only (see Mechanics scope), and its open world with permadeath as the model for the run structure | Its look, because the notes say it shouldn't look like Roblox |

### References

| Reference | Link | What to take from it |
| --- | --- | --- |
| Little Scavenger itch.io page | [coderedstudio.itch.io/little-scavenger](https://coderedstudio.itch.io/little-scavenger) | Glow, bloom, pooled light, telegraphs. The page tags it "3D", and player comments flag untimed telegraphs |
| Little Scavenger creator video | [YouTube](https://youtu.be/OKOf6yrfg4Q) | The meeting's original style reference, now used for lighting and colour |
| Sarah Morris, Death's Door concept art | [braverobynart.com/deathsdoor](https://braverobynart.com/deathsdoor) | Diorama rooms, shape language, light sources, readability, sheet format |
| Acid Nerve game credits | [acidnerve.com/game-credits](https://www.acidnerve.com/game-credits) | Who did what: Frits Olsen as art director, Sarah Morris on concept art, Juan Abad on 3D art |
| Byteside interview with Acid Nerve | [byteside.com](https://www.byteside.com/2021/08/deaths-door-developer-acid-nerve-on-how-it-made-its-sword-wielding-crow-game/) | "Muted tones of dungeons with vivid splashes of light and colour," and a toon shader on the characters against naturally lit areas |
| Press Start interview with Acid Nerve | [press-start.com.au](https://press-start.com.au/features/2021/03/27/we-spoke-to-the-team-at-acid-nerve-about-the-stylish-looking-deaths-door/) | Why isometric, and a different camera angle and colour for the hub |
| Stevivor interview with Acid Nerve | [stevivor.com](https://stevivor.com/features/interviews/acid-nerve-talks-deaths-door-interview/) | The greyscale Hall of Doors as a contrast to the coloured world |
| Kev Hayes, Death's Door trailer | [kevhayes.com/deaths-door](http://www.kevhayes.com/deaths-door) | A rim light added to the character toon shader, and heavy post-processing and volumetrics in the trailer |
| Death's Door on Steam | [store.steampowered.com/app/894020](https://store.steampowered.com/app/894020/Deaths_Door/) | The 12 store screenshots used to measure how bright the game is and to compare camera angles |
| Death's Door Artbook on Steam | [store.steampowered.com/app/1662730](https://store.steampowered.com/app/1662730/Deaths_Door_Artbook/) | A free 43-page PDF of concepts curated by Frits Olsen. It needs the base game and hasn't been reviewed yet |
| Death's Door on Wikipedia | [en.wikipedia.org](https://en.wikipedia.org/wiki/Death%27s_Door_(video_game)) | Lists Unity as the engine |
| Unity Learn, camera views | [learn.unity.com](https://learn.unity.com/pathway/creative-core/unit/creative-core-cameras/tutorial/explore-camera-views?version=6.0) | Isometric views usually face 45 degrees and sit 35 degrees above the focus, with orthographic or perspective cameras. A starting point for open decision 2 |
| Isaiah 6:1–7 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Isaiah+6%3A1-7&version=ESV) | The seraphim |
| Ezekiel 1:4–28 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Ezekiel+1%3A4-28&version=ESV) | The living creatures and the wheels |
| Ezekiel 10 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Ezekiel+10&version=ESV) | The cherubim, their four faces and "the whirling wheels" |
| Colossians 1:16 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Colossians+1%3A16&version=ESV) | Thrones among things created in heaven |
| Revelation 4:6–8 and 12:7–9 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Revelation+12%3A7-9%3BRevelation+4%3A6-8&version=ESV) | The four living creatures, the sea of glass, and the war in heaven |
| Ophanim on Wikipedia | [en.wikipedia.org](https://en.wikipedia.org/wiki/Ophanim) | "Ophanim" means wheels. Some Christian angelology identifies them with Thrones, and Jewish hierarchies keep the two apart |
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

In the open-map version, these keep their mechanics and take angel names in
the game's text. A death is a fall and stained health is a dimmed halo.
Shrines are altars, clearing a floor is sealing a breach, and Echoes are
Graces. Deep Shrines are rare places on the map rather than rooms.

## Technical approach

### Why pre-rendering fits Excalibur

Excalibur's [documentation](https://excaliburjs.com/docs/) describes it as
"a free and open source 2D game engine written in TypeScript." The installed `excalibur` 0.32.0 has no perspective
projection, no depth test and no meshes. Its only projection is
`Matrix.ortho()`, its bundle enables only `gl.BLEND`, and `Material` shaders
take 2D positions. So the 3D look is made in Blender and shown in Excalibur
as sprites. This works because the camera never rotates: one render angle
covers the whole game.

These are the Excalibur 0.32 APIs the plan relies on. Each was checked in
`node_modules/excalibur/build/dist`:

- `ImageSource`, `SpriteSheet.fromImageSource()`,
  `SpriteSheet.fromImageSourceWithSourceViews()` (for packed atlases) and
  `Animation.fromSpriteSheet()` for the rendered frames.
- `Actor.z` for draw order. With no depth buffer, sorting is how actors pass
  in front of and behind things.
- `graphicsContext.createMaterial()` and `Material`, whose `images` option
  binds extra textures by sampler name. That's how a sprite gets its normal
  and emissive passes. Materials also get `v_screenuv` and can read the
  screen texture.
- `addPostProcessor()` with a `PostProcessor` built on `ScreenShader`, for
  bloom and the final grade. Post-processors run as a chain of single
  full-screen passes, each reading the previous pass's output.
- `GpuParticleEmitter` for embers, sparks, corruption and hit effects.
- `ParallaxComponent` for drifting fog and sky layers.
- `Camera.shake(magnitudeX, magnitudeY, duration)`, which only moves the
  camera, plus `elasticToActor()` and `limitCameraBounds()` to follow the
  hero. `Camera.rotation` is never set.
- `OffscreenSystem`, which tags entities that leave the view with
  `ex.offscreen` and emits `enterviewport` and `exitviewport` events, for
  streaming.
- `Engine.timescale` for a whole-game hit-stop when it's needed.
- `TextureLoader.checkImageSizeSupportedAndLog()`, which checks an image
  against the GPU's maximum texture size.

Excalibur 0.32 has no light types. Darkness uses the method from Oka World
2's `HollowDark` overlay (`destination-out` radial gradients over a dark
fill), and light on sprites comes from their normal maps in a `Material`.

### The Blender render pipeline

Everything 3D lives in Blender under `tools/heaven-or-hell/` and is rendered
by script, never by hand, so the look stays consistent and a change to the
camera or bands can be re-rendered.

- **One camera rig.** `rig.blend` holds the fixed camera (the angle and lens
  from open decision 2), the key light used for the baked toon bands, the
  ink outline settings and the render size. Every render uses it. Models
  turn under the camera to make facings, and the camera itself never moves.
- **Eight facings for characters.** The hero, demons and most creatures are
  rendered in 8 facings at 45-degree steps. To save work, render five
  (south, south-east, east, north-east, north) and mirror the other three at
  runtime. A mirrored normal map needs its x channel flipped in the shader,
  and anything held in one hand, like a sword, breaks the mirror, so the hero
  may need all eight. Creatures that move "without turning" (cherubim,
  ophanim) need one facing.
- **Passes per frame.**
  - *Colour:* toon-shaded in three bands under the dim key light, with the
    ink outline baked in.
  - *Emissive:* only the glowing parts, black elsewhere.
  - *Normal:* surface normals in camera space, for runtime lighting.
  - *Depth, for environment only:* optional, for the occlusion approach in
    M1.

  Environment colour is rendered near neutral and tinted by region at
  runtime.
- **Animation frame data.** Animations render at a fixed rate, 30 frames per
  second as a starting value. The start-up, active and recovery frames of
  each attack are exported as data that `rules.ts` uses, so the sprite and
  the rules never disagree about timing.
- **Packing.** `pack_atlas.py` trims empty space, packs frames into atlas
  pages within the GPU's maximum texture size, and writes
  `art/atlas.ts`, the way `tools/oka-world/build_art.py` generates Oka
  World's art.
- **Environment chunks.** The map is modelled in Blender in fixed-size
  chunks, and each chunk is rendered at the camera angle into layers:
  - *ground:* always behind actors;
  - *tall pieces:* pillars, wall ends, statues, each a separate sprite
    sorted by its base;
  - *front:* the cut-low wall stubs on the camera side, always in front.

  Each layer gets its emissive and normal passes.

### The real costs of pre-rendering

These costs are why the pipeline is scripted. Each one gets a measurement
in M1.

- **Frame count.** The figures here are arithmetic on assumed numbers, not
  measurements. Suppose the hero has 16 animations (idle, run, three light
  attacks, a critical, block, block hit, parry, parried, guard break, roll,
  hit reaction, a fall and two casts) averaging 12 frames. That's about 190
  frames per facing, or about 1,500 across 8 facings, for each pass. Every
  enemy and creature adds its own set. Mirroring, short loops and sharing
  animations between related enemies keep this down.
- **Texture memory.** Again assumed: a 256x256 frame takes 256 KB on the GPU
  as uncompressed RGBA. At 1,500 frames that's about 375 MB per pass for the
  hero alone if everything is loaded at once. So frames are trimmed and
  packed, the normal pass can use half resolution, the emissive pass covers
  only frames that glow, and only the creatures in nearby regions are
  loaded. Open decision 4 (desktop or mobile) sets the budget.
- **Depth sorting with no depth buffer.** Actors sort by their ground
  position through `z`. Anything an actor can walk behind has to be its own
  sprite with a base point, so environment chunks are split into layers. A
  second approach is worth testing in M1: render a depth pass per chunk, and
  in each actor's `Material` discard pixels where the chunk is closer to the
  camera, using `v_screenuv` and a depth uniform per actor. If it works, it
  removes most of the layer splitting.
- **Baked and runtime light must agree.** The toon bands and ink lines are
  baked, but braziers, glows and corruption move. The runtime `Material`
  lights each sprite from its normal pass and quantises that light into the
  same three bands, using one band table shared by Blender and the shader.
  Ink lines are never lit. The baked key light stays dim, so most of the
  drama comes from runtime light, which keeps the mismatch small.
- **Bloom in a chain of single passes.** Excalibur's post-processors pass
  one image down a chain, so a bloom pass can't blur and then add back to
  the original. The plan is to bake a soft glow halo into the emissive pass
  for static glows, and to add a single cheap screen pass, a threshold with
  a small blur, for moving effects. M1 measures the cost at full
  resolution.

### Scene and routing

- Scene key `heavenorhell`, opened at `/#heavenorhell`, added to
  `ROUTED_SCENES` and `SCENE_TITLES` in `src/components/Terrene.ts`. Oka
  World stays the default scene.
- The scene switches the screen to a high-resolution 16:9 mode with
  antialiasing while it's active, using `OkaScene`'s method of saving the
  screen settings, switching them and restoring them in `onDeactivate()`.
  The rest of Terrene runs at 256x240 pixel art with `suppressHiDPIScaling`,
  so the pixel ratio follows the display the way `OkaScene.pickPixelRatio()`
  does.
- `onDeactivate()` also removes post-processors, stops music and timers, and
  unloads the loaded chunks.
- NPCs implement `DialogueNPC` and talk through `ChatSystem`, and quests use
  `QuestSystem`, all unchanged.

### Code layout

This follows the Street split, where the rules are pure and the scene is
thin, and the Oka World pipeline, where art is generated from `tools/`:

```
src/components/scenes/HeavenOrHell/
├── HeavenOrHell.ts     # Scene: load, camera, chunk streaming, loop, onDeactivate cleanup
├── rules.ts            # Pure combat and run rules: posture, parry, roll, falls, frame data
├── map.ts              # Fixed map of Heaven: regions, chunks, paths, landmarks (pure)
├── invasion.ts         # Seeded invasion: breaches, corruption, camps, events (pure)
├── palette.ts          # Region bases, corruption blend, toon bands, glow roles (pure)
├── chunks.ts           # Loads and unloads chunk layers near the camera
├── lit.ts              # Normal-map lighting and emissive Material, region tint
├── bloom.ts            # Bloom and grade PostProcessors built on ScreenShader
├── darkness.ts         # Dark overlay and light holes, after HollowDark
├── fx.ts               # Hit sparks, embers, corruption particles
├── hud.ts              # Health and halo, posture, tempo, cooldown icons
├── art/atlas.ts        # Generated by tools/heaven-or-hell/pack_atlas.py
└── sfx/, HeavenOrHell.mp3
src/components/characters/player/<Hero>/   # one folder per character, per project rules
src/components/creatures/<Creature>/       # demons and heavenly creatures alike
tools/heaven-or-hell/
├── source/             # reference images and .blend sources
├── rig.blend           # fixed camera, key light, outline and render settings
├── render_sprites.py   # renders colour, emissive, normal (and depth) passes
├── pack_atlas.py       # trims, packs atlases, writes atlas.ts and frame data
└── references.md       # one line per reference: what to take from it
test/heaven-or-hell-rules.ts
docs/heaven-or-hell.md  # player-facing doc, written when M1 ships
```

### Testing

- `rules.ts`, `map.ts`, `invasion.ts` and `palette.ts` import nothing from
  Excalibur, so `node:test` covers the parry window, posture overflow, roll
  i-frames, input buffering, the two-falls state, seeded invasions and the
  palette's value limits, all deterministically.
- **Fix this first:** `node --test test/street-rules.ts` fails today with
  `ERR_MODULE_NOT_FOUND` because `Street/level.ts` imports `./rules` without
  an extension, and Node 22's type stripping needs one. The fix is to use
  `.ts` import specifiers (with `allowImportingTsExtensions` in tsconfig) or
  to add a TypeScript runner such as `tsx`. Then wire `test/*.ts` into
  `npm test`, which today points at a `test/test.js` that doesn't exist.
- A check in `pack_atlas.py` fails the build if an atlas page is larger than
  the agreed maximum or the total texture budget is exceeded.
- Each milestone also ends with a manual run in the browser at
  `/#heavenorhell`: a screen recording, a clean console and a frame-rate
  reading.

## Milestones

### M0: References and decisions (Dan, before any code)

- Gather 4–5 more visual references, as the meeting asked. Sources: Google
  Images and specific itch.io profile pages. They should be stylised,
  toon-shaded 3D under a fixed camera, darker than Death's Door, and include
  some depictions of seraphim, cherubim and ophanim.
- Store them in `tools/heaven-or-hell/source/` and give each one a line in
  `references.md` saying what to take from it (palette, shape, glow, camera,
  creature, UI). Follow the sourcing notes. Call an itch page a "specific
  itch profile page," not a "website." Leave out anything off-topic, because
  every stray image adds ambiguity.
- Add the Deepwoken wiki pages and one or two blog articles about its combat
  to `references.md`.
- Answer open decisions 2, 3 and 4: the camera angle and lens, who makes the
  models, and desktop or mobile.
- **Progress:** 2 of the 4–5 visual references are covered: Death's Door and
  Little Scavenger (see [Art direction](#art-direction)). The engine, the
  premise, the world structure, the palette and pixel art versus painted are
  settled. The Deepwoken wiki is linked, but the combat blog articles aren't
  collected yet, and `references.md` doesn't exist yet.
- **Done when** there are at least 5 tagged references and open decisions
  2, 3 and 4 are answered.

### M1: One lit area, pre-rendered

- The Blender pipeline end to end: `rig.blend`, `render_sprites.py` and
  `pack_atlas.py`, producing colour, emissive and normal passes and
  `art/atlas.ts`.
- The `#heavenorhell` route in its high-resolution mode, restoring the screen
  settings on leaving.
- One chunk of Heaven as a greybox: bevelled stone kit pieces rendered at the
  fixed angle, split into ground, tall-piece and front layers, in the
  default bone-grey base. Placeholder models are fine. The 2D packs in
  `src/assets/` don't fit this look.
- The hero as a placeholder model, rendered in 8 facings with idle and run,
  walking in 8 directions. Sorted against pillars and walls by `z`, with the
  depth-pass `Material` tried as the alternative.
- Runtime lighting from normal maps in three bands, a gold outline on the
  hero, altars glowing white and gold, a breach glowing red, the bloom
  approach, near-black fog and one drifting parallax layer.
- One `ChatSystem` line from a placeholder `DialogueNPC`.
- **Done when**
  - a screenshot reads as "near-black monochrome Heaven, white against red"
    next to the M0 references;
  - the frame rate holds at 60 at full resolution;
  - the measured texture memory and frame count for the hero are written
    down, with a projection for the full roster;
  - baked and runtime bands visibly match;
  - switching to another hash restores the screen settings.

### M2: The combat core

- `rules.ts` covers the light attack chain with its flourish, block and
  posture, parry with its cooldown, and roll with i-frames.
- One melee demon whose wind-ups can be read and parried, plus the HUD:
  health with its halo, posture and cooldown icons.
- **Game-feel targets.** These are starting values to tune in play, not
  facts:
  - *Input to action:* an input starts its action on the next fixed update
    (Terrene runs fixed updates at 60 per second), and the first frame of
    the action is on screen within 2 frames of the key press.
  - *Input buffer:* an attack, parry or roll pressed up to 150 ms before
    the current action can be cancelled fires on the first frame it can.
  - *Hit-stop:* the attacker and target freeze on contact. Start at 50 ms
    for a light hit, 120 ms for a parry and 150 ms for a guard break. The
    freeze lives in `rules.ts`, so it's tested. `Engine.timescale` is used
    only for the parry, if a whole-screen pause feels better.
  - *Camera shake:* translation only, through `Camera.shake()`, never
    rotation. Start at 2 px for 80 ms on a hit, 4 px for 120 ms on a parry
    and 6 px for 200 ms on a guard break, at 1080p.
  - *Readable wind-ups:* every enemy attack shows an orange telegraph from
    its first wind-up frame, and ordinary attacks wind up for at least
    300 ms.
  - *Cancel windows:* each move has start-up, active and recovery frames in
    the frame data. The roll can cancel the recovery of a light attack after
    it hits, and the parry can cancel the first frames of a light attack's
    start-up.
  - *Parry and roll:* start with a 150 ms parry window and 250 ms of
    i-frames in a 400 ms roll.
  - *Hit sparks and sound:* white and gold sparks with a bright ring when
    the hero hits or parries, red sparks and a darker sound when the hero is
    hurt. Parry, hit, block and guard break each get a distinct sound. The
    sparks use `GpuParticleEmitter`.
- **Done when** unit tests cover every timing rule and buffer, and in manual
  play a clean parry, a guard break and a dodge through an attack each work
  and feel distinct.

### M3: Depth of combat

- Critical attacks, feints, Tempo and Vent.
- Two more demon types: a ranged one with telegraphed area attacks, and a
  heavy one with hyperarmor.
- One corrupted heavenly creature as an elite, if open decision 1 goes that
  way. A corrupted seraph is the cheapest, because it needs no new movement
  rules.
- Telegraphs follow the Little Scavenger feedback: shrinking timer circles
  on the ground, visible cooldowns and clear feedback when you take damage.
- **Game-feel targets.** Again starting values to tune:
  - *Feints:* the hero's feint cancels the wind-up of an attack on any frame
    before its active frames, and the enemy's reaction is visible within
    100 ms.
  - *Criticals:* criticals have their own red-cored telegraph, so they read
    as unparryable at a glance.
  - *Heavy hits:* a critical landing gets a longer hit-stop (start at
    100 ms) and a bigger shake than a light hit.
  - *Hyperarmor:* the heavy demon flashes red on a hit that doesn't stagger
    it, so the player knows it landed.
- **Done when** each enemy type has a unit-tested pattern, and a fight
  against all three together is winnable with no damage taken.

### M4: The run

- `map.ts` describes Heaven's fixed regions, built from chunks, and
  `chunks.ts` streams them in and out as the hero moves (see
  [Risks](#risks)).
- `invasion.ts` seeds each run's breaches, corruption spread, demon camps
  and events. Sealing a breach pushes back corruption and opens the next
  region.
- Two lives: the first fall dims the halo (stained health), and altars clear
  the stain. A second fall casts you out and ends the run.
- A talent draft of one card from three each time a breach is sealed.
- Graces saved to `localStorage`, and the hub where they are spent (open
  decision 6).
- NPC dialogue with allied heavenly creatures, using `DialogueNPC` and
  `ChatSystem`.
- **Done when** a full run across three regions plus the invasion's leader
  can be played start to finish, falls and being cast out behave as
  designed, two seeds produce different invasions on the same map, and
  Graces persist across a reload.

### M5: Builds and variety

- Three attunements, each with one active ability and an Ether bar.
- Deep Shrines as rare places on the map, more talents, and a second region
  with its own monochrome base.
- More heavenly creatures from the roster, allied and corrupted.
- **Done when** two runs with different attunements play noticeably
  differently.

### M6: Polish and release

- An original score and sound effects, built by a script such as
  `tools/oka-world/compose_music.py`.
- The title and chapter cards, `docs/heaven-or-hell.md`, and a README entry.
- **Done when** the GitHub Pages build serves `/#heavenorhell` and the
  console has no errors on a fresh `localStorage`.

## Risks

- **The art supply** is the real bottleneck, not the code. Pre-rendering
  needs someone who can model, rig and animate in Blender and keep the
  pipeline running (open decision 3). M1 can ship with greybox placeholders,
  but the look depends on M0.
- **Frame counts and texture memory.** High-resolution sprites in 8 facings,
  three passes each, add up fast (see
  [The real costs of pre-rendering](#the-real-costs-of-pre-rendering)).
  Measure the hero in M1, set a budget per creature, and enforce it in
  `pack_atlas.py`.
- **Depth sorting** with tall pieces and big creatures, such as a wheel
  boss, is a common source of visual bugs. Settle the layer split or the
  depth-pass `Material` in M1, before combat depends on it.
- **Baked and runtime look drifting apart.** If the band table or the
  outline width changes in one place and not the other, sprites and runtime
  light stop matching. Keep one band table in `palette.ts`, export it to
  Blender, and re-render when it changes.
- **The camera angle is locked in by every render.** Changing open decision 2
  after M1 means re-rendering everything. Decide it before the first real
  asset.
- **Streaming a large map.** Excalibur has no built-in streaming. Chunks have
  to be loaded, added to the scene, removed and unloaded by `chunks.ts`, with
  `OffscreenSystem`'s viewport events as a trigger. Loading images while the
  hero runs can stutter, so chunks next to the current one load ahead of
  time, and textures for far chunks are released. The map's size (open
  decision 5) decides how hard this is.
- **Bloom cost.** A full-screen pass at full resolution every frame can drop
  the frame rate on low-end GPUs. Baked halos keep most of the glow out of
  the screen pass, and the screen pass can run at a lower resolution than
  the frame, as `HollowDark` paints its lighting at 480x270.
- **White and red readability.** White allies, the gold hero and white
  altars can blur together, and red corruption can hide red danger. Check
  each in M1 and M3 screenshots.
- **Combat feel** is hard to judge from tests alone. Each combat milestone
  needs a manual play session and a recording, not only green tests.
- **Engine pin.** Every API used must exist in ExcaliburJS 0.32.x.
