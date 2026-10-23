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
scene, rules and test patterns. Its companion,
[heaven-or-hell-progression.md](./heaven-or-hell-progression.md), is the
detailed design for character creation and progression, partly decided
by Dan and partly still a proposal.

### Questions that block M1 or M2

None. M1 (one lit area, pre-rendered) and M2 (the combat core with the
basic sword) can start on the decisions already made. M3 has no open
blocker either, now that right-click and Choir selection are decided. The
first milestone with open questions is M4, the run. The full list is in
[Not decided yet](#not-decided-yet).

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
open world with permadeath. Dan has since confirmed this, and
[World and run structure](#world-and-run-structure) describes how the two
fit.

**Creatures.** Heaven is full of "biblically accurate" heavenly creatures,
for immersion: seraphim with six wings, ophanim as wheels within wheels
covered in eyes, cherubim with four faces, thrones and others.

**Allegiance.** The angels are on the player's side, fighting Hell's
corruption with you. The enemies are mainly demons and frightening creatures
of Hell as the Bible or tradition depicts them: the locusts of Revelation 9
and their king Abaddon, the beast of Revelation 13, the dragon of
Revelation 12, Leviathan and Behemoth from Job 40–41, Legion from Mark 5,
and named demons from traditional demonology. A smaller tier of corrupted
angels serves as elites and bosses. See [Creatures](#creatures).

**Palette.** The red of Hell and the white of Heaven are the main clash.
Both pop vividly, with bloom, against a dark, high-contrast monochrome base.

**Combat feel.** Combat should "make you feel like you are the one actually
swinging the weapon and parrying and dodging." This is now a design pillar,
with game-feel targets in M2 and M3.

**Roguelite, confirmed.** It's a roguelite, not a roguelike: open-world
permadeath like Deepwoken. A run is meant to last a long time, with so much
to do that you progress differently each run. When you're wiped, Heaven
resets entirely. What you keep is small and mostly knowledge: each death
teaches you something, such as a bestiary entry that reveals a demon's
patterns and weaknesses, lore, map knowledge or a small unlock. It is not
big stat creep. The meta progress is now split in two, following the
progression proposal: **Testimony** is the currency, and **Remembrance** is
the knowledge (bestiary, map memory and lore). Within a run, **Visions** is
the shrine currency, like Deepwoken's Knowledge, and it's lost on a wipe.
These replace the plan's earlier names, Graces and then Revelations. Dan
has confirmed the split, and Grace is the mana for Hymns.

**Corruption is the clock.** While a run goes on, Hell's invasion slowly
corrupts more and more of Heaven. The longer you last, the stronger the
demons get and the more bosses spawn around the open map. As Heaven
corrupts, more aspects and mechanics also open up, so the player can gain
more and grow stronger to match. The tiers are in section 10 of
[the progression doc](./heaven-or-hell-progression.md#10-corruption-tiers-the-power-curve)
and summarised in M4.

**Heaven decays at its own rate.** There's no cap on the player's strength
per tier. Corruption rises with time at a steady, designed rate, and the
challenge is to keep pace with it by growing stronger. Sealing a breach
does not lower corruption. It slows the spread around that breach and
protects the region and its rewards. *This reading of "decays at its own
rate" is an interpretation that Dan can adjust.* Rising corruption still
opens up more systems.

**Every tier brings more.** Each tier brings harder enemies, stronger
weapons (better loot, higher weapon tiers and rarer weapons dropping) and
harder progression with bigger rewards.

**Full Stain ends the run.** At 100 Stain you fall out of Heaven as a fallen
angel, and you start over. It's a wipe, and Testimony and Remembrance still
carry over. The idea that your fallen self returns as a nemesis next run is
kept only as an optional idea for later.

**Lives stay as they are.** The first time you're struck down, your halo
dims, and the second time wipes you. Dan likes it.

**Camera angle.** By default, copy Death's Door's look: a fixed camera about
45–50 degrees down, looking along a diagonal, with one angle for the whole
world. Orthographic is the default lens, as a starting value to verify
against Death's Door's screenshots in M1.

**Art production.** There is no modeller, and no art will be bought or
commissioned. Dan: "Just try your best." The development agent makes the 3D
models, rigs and animations itself, as scripted Blender in Python: simple
stylised shapes in a chunky, bevelled, toon-shaded look inspired mostly by
Death's Door and only a little by Little Scavenger. See
[Who makes the art](#who-makes-the-art).

**Controls.** Like Deepwoken. The mouse aims and left-click attacks (the
light attack chain). F parries, holding F blocks, Q rolls and R is the
critical attack. Movement is assumed to be WASD.

**Right-click is always the feint.** R is the only critical input, and
there are no right-click or middle-click criticals. Dan's point is that in
Deepwoken feints matter mostly in PvP. Here they must work on the AI
enemies and actually confuse them, so enemies read your wind-ups, commit to
a response, and can be baited. The model is in section 14 of
[the progression doc](./heaven-or-hell-progression.md#14-combat-controls-and-feints)
and summarised in M3.

**Solo only, for now.** Multiplayer is out of scope. Every system works
against NPCs.

**Platform.** Desktop browsers, as the default. Dan didn't object.

**Character creation and progression.** It starts like Deepwoken, with a
character creation step where you customise your angel. Races, which
Deepwoken calls Aspects, give different buffs and are all inspired by
angels. Dan also wants Deepwoken's Mantras, Oaths, Talents, Enchantments,
Aspects, Deep Shrines and Resonance, all given angel and Heaven flavour. The
progression doc renames them Choirs, Hymns, Vows, Gifts, Anointings and
Shrines of the Throne, and Resonance becomes Trumpets. Dan liked the Tenth
lore hook, the Choirs, the angelic names and the biblically grounded
content. Choirs are chosen freely at creation, not rolled, and rare Choir
variants are unlocked through Testimony and Remembrance. Deepwoken's Boons
and Flaws are called Boons and Burdens. See
[Character creation and progression](#character-creation-and-progression).

**Mechanics are unchanged, with additions.** None of the decisions above
change the Deepwoken mechanics already planned. Dan's request for the full
set of progression systems adds Aspects, Oaths, Enchantments and Resonance
to [Mechanics scope](#mechanics-scope).

**Starting weapons are basic.** You start with a plain sword, spear or
knife, and a mace unlocks with Testimony. The Flaming Sword and the other
named weapons are found or earned as you grow stronger, gated by
corruption tier and quests. The prototype is built around the basic sword,
the baseline every other weapon is tuned against.

### Resolved since the first draft

- **What "Heaven Or Hell" means in play.** Resolved by the premise: you
  defend Heaven against Hell's invasion. The earlier readings (descending
  through hell floors, or choosing up or down at each exit) are dropped.
- **Pixel art or painted art.** Resolved: neither. The game is high-resolution,
  toon-shaded 3D, pre-rendered.
- **The engine.** Resolved: ExcaliburJS 0.32.
- **What the heavenly creatures are to the player.** Resolved: angels are
  allies, demons are the main enemies, and corrupted angels are a smaller
  elite and boss tier.
- **Roguelite or roguelike.** Confirmed: a roguelite, with open-world
  permadeath and knowledge as the main thing kept.
- **The camera angle and lens.** Decided as a default: Death's Door's look,
  45–50 degrees down along a diagonal, orthographic, one angle everywhere.
  It's verified against the screenshots in M1.
- **Who makes the 3D models and animations.** Resolved: the development
  agent, by script, with no bought or commissioned art.
- **Input scheme.** Resolved: Deepwoken-like mouse and keyboard, with
  right-click always the feint and R the only critical.
- **Desktop or mobile.** Resolved as the default: desktop browsers.
- **How a Choir is chosen.** Resolved: freely, with rare variants unlocked
  through Testimony and Remembrance.
- **Multiplayer.** Resolved: solo only, for now.
- **Whether Ascension is capped by corruption tier.** Resolved: no cap.
- **Whether sealing a breach lowers corruption.** Resolved: no. Corruption
  rises at a steady rate, and sealing protects a region instead.
- **What happens at Stain 100.** Resolved: the run ends in the Fall.
- **How many lives.** Resolved: two, as they are.
- **Names.** Resolved: Visions, Testimony and Remembrance, Grace as the
  mana, and Boons and Burdens.

### Not decided yet

Each open decision blocks a specific milestone, marked in brackets.
Nothing blocks M1, M2 or M3.

1. **How big Heaven's map is.** The number of regions and their size set the
   art budget, the streaming work and how long a run can last. This plan
   proposes a fixed map with the invasion reseeded each run. [M4]
2. **Whether Heaven's map has a hub.** *Proposal:* a sanctuary region where
   allied angels talk and the bestiary and lore are read, which corruption
   reaches only at the last tier. [M4]
3. **How a run ends well.** Does a run have a victory, such as defeating the
   dragon at Tier 5, or does it only end when you're wiped or fall, with the
   score being how long Heaven held? [M4]
4. **How long a run should last, and how it's saved.** A long run with
   permadeath has to survive closing the tab. *Proposal:* the run saves
   continuously to `localStorage`, so quitting never undoes a death. The
   run's length also sets the corruption pace, proposed as one tier about
   every 2 hours of play. [M4]
5. **Tone.** How literal should scripture be? The progression doc names
   Michael, Abaddon and the dragon, keeps the Throne offscreen, and quotes
   Isaiah 14:12 in the Fall scene. [M6, before the text is final]
6. **Survival meters.** Hunger and thirst, or only Sanctity? Until this is
   answered, the mechanics table keeps hunger and thirst out of scope. [M5]
7. **The nemesis (optional, later).** Should your fallen self return as an
   elite in your next run? It's not planned for any milestone.

The progression doc lists items 5 to 7 in its own
[open questions](./heaven-or-hell-progression.md#15-open-questions-for-dan).

## Design pillars

1. **You are the one swinging, parrying and dodging.** Combat comes first.
   Inputs act at once, hits land with weight, and every enemy attack can be
   read. Posture, parry and roll matter more than numbers. A skilled player
   with starting gear can hold the first region.
2. **Death matters, a run doesn't end on the first mistake, and every death
   teaches.** Deepwoken's two lives fit the "roguelite" choice well. What
   survives a wipe is mostly knowledge, not power.
3. **Dark world, bright actors.** Anything you can interact with glows. The
   environment stays close to black.
4. **Small systems, kept separate.** Rules live in pure TypeScript and are
   tested without the engine, the way `Street/rules.ts` is.

## World and run structure

Decided: a roguelite with open-world permadeath like Deepwoken's, long runs,
a full reset of Heaven on a wipe, knowledge as the main thing kept, and
corruption that escalates through the run. The details below are proposals
for Dan to confirm, apart from where they restate those decisions.

- **Heaven's map is fixed.** The regions, paths and landmarks are the same
  every run, so map knowledge carries over. Region names are placeholders,
  for example the Outer Gates, the Courts, the Sea of Glass (from Revelation
  4:6) and the approach to the Throne.
- **Hell's invasion is reseeded every run.** Each run places breaches where
  Hell is pushing in, spreads corruption out from them, and sets up demon
  camps, roaming patrols and events. Where the elites and bosses appear also
  changes. The same seed always gives the same invasion, so it can be
  tested.
- **Corruption is the run's clock (decided).** A single World Corruption
  level rises with time at a steady, designed rate, and nothing lowers it.
  There's no cap on the player's strength per tier: the challenge is to
  keep pace. Breaches act locally. An open breach pulls its region up to a
  tier ahead of the world, with harder enemies and better loot. Sealing it
  slows the spread and keeps the region a tier behind, protecting its
  altar, merchants and rewards. Each tier brings harder enemies, stronger
  weapons and harder progression, and opens new systems. The tiers are in
  section 10 of the progression doc and summarised in M4.
- **A run is long, and different every time.** There's more to do than one
  run can finish: breaches, camps, bosses, quests from allied angels,
  Shrines of the Throne and Vow trials. So two runs progress differently
  even on the same map. Whether a run can be won is open decision 3.
- **Two lives, in angel terms.** The first time you're struck down, your
  halo dims. That's Deepwoken's stained health: the dimmed part of your
  health bar can't be healed until you pray at an altar or Ascend. The
  second time casts you out, and the run is wiped. This is decided, and
  Dan likes it as it is. Deepwoken sends a drowned
  character to the Depths for one last chance before wiping. The angel
  equivalent is the Throne's answer in the progression doc: if your
  Trumpet's Progress is full when your HP hits zero inside a breach, you're
  healed instead of struck down, so you don't lose a life.
- **Lives and Stain are separate.** Personal Stain, from 0 to 100, is the
  corruption you choose to take on for power (progression doc, section 11).
  The halo shows both: lives change its brightness, and Stain cracks it and
  turns it red. Stain doesn't cost a life, and losing a life doesn't add
  Stain. Reaching 100 Stain is the Fall, which ends the run as a wipe even
  if you still have both lives.
- **A wipe resets Heaven entirely,** whether you were cast out or fell. The
  character, their build, their Visions and every change to the map are
  gone.
- **Testimony and Remembrance survive the wipe.** What carries over is
  mostly knowledge, which is Remembrance:
  - *bestiary entries* that reveal a demon's patterns and weaknesses, filled
    in by fighting it and dying to it;
  - *lore* found in the world;
  - *map memory*, such as discovered landmarks, altars and shrine sites,
    kept as faded ink on the next run's map.

  Testimony is a small currency earned from one-time Witnesses in a run. It
  buys small unlocks, such as an Origin, a starter weapon or a rare Choir
  variant, and a few small capped upgrades. That follows Deepwoken's Echoes,
  which are earned on a wipe from one-time Triumphs. Deepwoken's
  [Knowledge](https://deepwoken.fandom.com/wiki/Knowledge), by contrast, "is
  bound to a character and is lost upon wiping," and Visions follow that.
  There's no big stat creep.

## Creatures

The creature designs start from the descriptions below. Scripture is quoted
from the ESV, apart from Tobit and Matthew, which are quoted from the
NRSVUE. Decided: the angels are allies, demons and creatures of Hell are the
main enemies, and corrupted angels are a smaller elite and boss tier. The
role of each creature is a proposal.

### Angels: allies and NPCs

| Creature | Description | Proposed role |
| --- | --- | --- |
| The player | A lesser angel. The premise echoes Revelation 12:7, where "war arose in heaven, Michael and his angels fighting against the dragon" | The hero |
| Seraphim | Isaiah 6:2–7: "Each had six wings: with two he covered his face, and with two he covered his feet, and with two he flew." They call "Holy, holy, holy," and one carries "a burning coal that he had taken with tongs from the altar" | Allies who fight beside you at breaches, and altar keepers who clear a dimmed halo |
| Cherubim (the living creatures) | Ezekiel 1:5–14: "a human likeness," "four faces," "four wings," "human hands" under the wings, legs "straight," feet like "a calf's foot," sparkling "like burnished bronze." Each "went straight forward, without turning," and they "darted to and fro, like the appearance of a flash of lightning." Ezekiel 10:14 lists the faces as a cherub's, a human's, a lion's and an eagle's | Guardians of gates and quest givers |
| Ophanim (the wheels) | Ezekiel 1:15–21 and 10:9–13: "a wheel within a wheel," gleaming "like sparkling beryl," with rims "full of eyes all around." They move "in any of their four directions without turning" and are called "the whirling wheels." *Ophanim* is Hebrew for "wheels" | Sentinels that watch the map. Talking to one reveals nearby breaches, which is a natural source of map knowledge |
| Thrones | Colossians 1:16 names "thrones or dominions or rulers or authorities" among things created "in heaven." Some Christian angelology treats Thrones as one of the choirs of angels and identifies them with the ophanim. Jewish angelic hierarchies keep the two apart | To be chosen: either the same creature as the ophanim, or a ruler class that grants Vows |
| The four living creatures of Revelation | Revelation 4:6–8: "like a lion," "like an ox," "with the face of a man," and "like an eagle in flight," "each of them with six wings," "full of eyes all around and within" | Guardians of the Throne region and keepers of lore |

### Hell: the enemies

| Creature | Description | Proposed role |
| --- | --- | --- |
| Locusts of the pit | Revelation 9:3–10: they rise from the smoke of "the bottomless pit," "like horses prepared for battle," with "crowns of gold," "human faces," "hair like women's hair," "teeth like lions' teeth," "breastplates like breastplates of iron," wings that sound "like the noise of many chariots," and "tails and stings like scorpions" | The common swarm enemy from the first tier. Their stings are the first orange telegraphs a player learns |
| Abaddon (Apollyon) | Revelation 9:11: the locusts' king is "the angel of the bottomless pit," named Abaddon in Hebrew and Apollyon in Greek. The ESV notes that the names mean "destruction" and "destroyer" | A boss. As an angel of the pit, he sits in the corrupted-angel tier and leads the locust swarms |
| Legion | Mark 5:2–13: a man "with an unclean spirit" lived "among the tombs" and "wrenched the chains apart." Asked his name, he answered, "My name is Legion, for we are many," and the spirits went into a herd of "about two thousand" pigs | An elite that splits into many bodies when hurt and possesses lesser demons |
| Behemoth | Job 40:15–24: he "eats grass like an ox," "makes his tail stiff like a cedar," and "his bones are tubes of bronze, his limbs like bars of iron." He lies "in the shelter of the reeds and in the marsh." The ESV calls him "a large animal, exact identity uncertain" | A heavy boss with hyperarmor that charges across open regions |
| Leviathan | Job 41: "his back is made of rows of shields," "out of his mouth go flaming torches," "out of his nostrils comes forth smoke," and "his breath kindles coals." "Though the sword reaches him, it does not avail." He "makes the deep boil like a pot" and is "king over all the sons of pride." The ESV calls him "a large sea animal, exact identity uncertain" | A boss of the Sea of Glass whose armour has to be broken before it takes damage |
| The beast from the sea | Revelation 13:1–2: "with ten horns and seven heads, with ten diadems on its horns and blasphemous names on its heads," "like a leopard," with feet "like a bear's" and a mouth "like a lion's mouth." "The dragon gave his power" to it | A late boss |
| The dragon | Revelation 12:3–9: "a great red dragon, with seven heads and ten horns, and on his heads seven diadems." "His tail swept down a third of the stars of heaven." He fought Michael's angels "and was thrown down" | The invasion's leader and the last-tier boss |
| Named demons | Tobit 3:8 names "the wicked demon Asmodeus," and Matthew 12:24 names "Beelzebul, the ruler of the demons." The Ars Goetia, part of a 17th-century grimoire called the Lesser Key of Solomon, lists 72 spirits with ranks, such as King Bael, Duke Astaroth, King Asmodeus and King Belial | Ranked enemies using the Ars Goetia's titles, from Knights at the first corruption tier to Kings who roam as bosses (progression doc, section 10). They command camps and lead breaches. Their names and ranks come from these sources, but no descriptions of them have been gathered yet, so their designs are original |
| Lesser demons | No single source. Original designs, kept in the same shape language | The melee, ranged and heavy types of M2 and M3 |

Behemoth and Leviathan appear in Job as creatures of God's making, not as
demons. Casting them as Hell's is this game's choice. So is casting the
beast and the dragon, who come to earth in Revelation, as invaders of
Heaven.

### Corrupted angels: the elite and boss tier

A smaller tier. Each is an allied creature that Hell has taken, so it shares
the ally's shape and gets red where the ally has white. That follows Death's
Door's "echo" rule for related enemies.

- A corrupted seraph, whose burning coals become ranged attacks.
- A corrupted cherub that attacks in all four directions without turning.
- A corrupted ophan that rolls through the arena.
- Abaddon, who leads them.

### Notes for the render pipeline

Cherubim, ophanim and corrupted versions of them move "without turning," so
each needs only one facing instead of eight, which saves a lot of render
work. Locusts and Legion's bodies share one rig each and appear in numbers,
so they need few animations. The big bosses (Behemoth, Leviathan, the beast
and the dragon) are the costliest to build and animate, so they come one at
a time, from M4 on. Wings and eyes should loop in short cycles.

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
  keep their width. Decided as the default: Death's Door's look, about
  45–50 degrees down, looking along a diagonal, with an orthographic lens.
  These are starting values. M1 checks them against Death's Door's
  screenshots, for example whether vertical edges converge, which would
  mean a perspective lens. One angle covers the whole world.
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
    region for something special, the way Death's Door uses its pink
    crystal.
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
| Unity Learn, camera views | [learn.unity.com](https://learn.unity.com/pathway/creative-core/unit/creative-core-cameras/tutorial/explore-camera-views?version=6.0) | Isometric views usually face 45 degrees and sit 35 degrees above the focus, with orthographic or perspective cameras. Context for the decided 45–50 degree default |
| Isaiah 6:1–7 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Isaiah+6%3A1-7&version=ESV) | The seraphim |
| Ezekiel 1:4–28 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Ezekiel+1%3A4-28&version=ESV) | The living creatures and the wheels |
| Ezekiel 10 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Ezekiel+10&version=ESV) | The cherubim, their four faces and "the whirling wheels" |
| Colossians 1:16 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Colossians+1%3A16&version=ESV) | Thrones among things created in heaven |
| Revelation 4:6–8 and 12:7–9 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Revelation+12%3A7-9%3BRevelation+4%3A6-8&version=ESV) | The four living creatures, the sea of glass, and the war in heaven |
| Ophanim on Wikipedia | [en.wikipedia.org](https://en.wikipedia.org/wiki/Ophanim) | "Ophanim" means wheels. Some Christian angelology identifies them with Thrones, and Jewish hierarchies keep the two apart |
| Revelation 9:1–11, 12:3–4 and 13:1–2 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Revelation+9%3A1-11%3BRevelation+12%3A3-4%3BRevelation+13%3A1-2&version=ESV) | The locusts and Abaddon/Apollyon, the great red dragon, and the beast from the sea |
| Job 40:15–24, Job 41 and Mark 5:1–13 (ESV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Job+40%3A15-24%3BJob+41%3A1-34%3BMark+5%3A1-13&version=ESV) | Behemoth, Leviathan and Legion |
| Tobit 3:8 and Matthew 12:24 (NRSVUE) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Tobit+3%3A8%3BMatthew+12%3A24&version=NRSVUE) | Asmodeus and Beelzebul by name |
| The Lesser Key of Solomon on Wikipedia | [en.wikipedia.org](https://en.wikipedia.org/wiki/The_Lesser_Key_of_Solomon) | The Ars Goetia's 72 spirits and their ranks, a source for named demons |
| Deepwoken Mechanics | [deepwoken.fandom.com](https://deepwoken.fandom.com/wiki/Category:Mechanics) | Mechanics only |
| Deepwoken Aspects, Oaths, Enchantments, Resonance, Mantras and Death | [Aspects](https://deepwoken.fandom.com/wiki/Aspects), [Oaths](https://deepwoken.fandom.com/wiki/Oaths), [Enchantments](https://deepwoken.fandom.com/wiki/Enchantments), [Resonance](https://deepwoken.fandom.com/wiki/Resonance), [Mantras](https://deepwoken.fandom.com/wiki/Mantras), [Death](https://deepwoken.fandom.com/wiki/Death) | The progression systems to reflavour, and how death, wipes and Knowledge work |

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
| Aspects (chosen at character creation) | Angel-inspired races, each with an innate talent and a small attribute bonus | M3 |
| Oaths | One sworn vow at a time, a unique talent with a set of abilities that progresses | M5 |
| Enchantments | Upgrades placed on weapons and equipment | M5 |
| Resonance | A personal ability that awakens from Progress earned by defeating bosses | M5 |
| Out of scope | PvP, guilds, ships, bounties, servers, crafting, hunger and thirst | – |

The last four rows are new, added at Dan's request. The rows above them are
unchanged.

In the open-map version, these keep their mechanics and take angel names in
the game's text, from the
[progression doc](./heaven-or-hell-progression.md), which also has a full
glossary:

| Deepwoken | Heaven Or Hell |
| --- | --- |
| Aspects | Choirs |
| Attunements and Mantras | Tongues and Hymns |
| Ether | Grace |
| Tempo and Vent | Fervour and Outcry |
| Sanity | Sanctity |
| Power | Ascension |
| Talents | Gifts |
| Oaths | Vows |
| Enchantments | Anointings |
| Deep Shrines | Shrines of the Throne |
| Knowledge (within a run) | Visions |
| Resonance | Trumpets |
| Echoes (after a wipe) | Testimony, plus Remembrance for knowledge |
| Boons and Flaws | Boons and Burdens |

A death is being struck down, and stained health is a dimmed halo. Altars
stand in for ordinary shrines, and clearing a floor is sealing a breach.
Shrines of the Throne are rare places on the map rather than rooms. Where a
row's short description differs from the progression doc, the progression
doc's detail wins. For example, Gifts come in hands of 4 to 5 cards on
each Ascension, not one of three per floor.

## Character creation and progression

Decided: a run starts like Deepwoken, with a character creation screen where
you customise your angel and choose a Choir. Every Deepwoken progression
system Dan listed is in, each given angel and Heaven flavour. The detail is
in [heaven-or-hell-progression.md](./heaven-or-hell-progression.md), which
lists what Dan has decided and proposes the rest. In short:

- You are one of **the Tenth**, lesser angels kindled to refill Heaven's
  choirs after the War in Heaven. Each Choir is an echo of a higher choir,
  such as the Kindled (Seraphim) or the Wheelborn (Ophanim), with the same
  +3 and +2 attribute bonuses as Deepwoken's Aspects. Each of the eight
  Choirs also has a signature passive, two innate Gifts, a flaw that can be
  played around, and a rare variant, all balanced to the same budget.
  Choirs are chosen freely.
- Creation follows Deepwoken's order: Choir, Tongues, a basic weapon,
  Boons and Burdens, Origin, appearance, then the Testimony Shop and
  Penances. Every Origin works solo.
- In a run you Ascend, draw Gifts and Hymns, swear one Vow, anoint your
  gear, pay Visions at Shrines of the Throne, and earn a Trumpet from boss
  kills.
- Corruption tiers open these systems over the run, from Tongues and Gifts
  at Tier 0 to Trumpets at Tier 4, and bring better loot and named
  weapons such as the Flaming Sword.
- Personal Stain is a separate risk-and-reward track. It cracks and
  reddens the halo, and at 100 it ends the run in the Fall.

The character creation screen is in M3, after the combat core and before
the run.

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

- **One camera rig.** `rig.blend` holds the fixed camera (orthographic,
  about 45–50 degrees down along a diagonal, as verified in M1), the key light used for the baked toon bands, the
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

### Who makes the art

Decided: nobody is hired and nothing is bought. The development agent makes
the models, rigs and animations by scripting Blender's Python API, aiming
for simple, chunky, bevelled, toon-shaded shapes in Death's Door's style.
The work goes in this order:

1. **Greybox.** Block out each chunk and actor from plain primitives, to
   check scale, the camera, sorting and combat timing before any detail.
2. **Scripted stylised models.** Build each model in code from bevelled
   primitives, combined and slightly irregular, with flat toon materials.
   The silhouette is designed first, because the outline, toon bands and
   bloom carry most of the look.
3. **A limited animation budget.** Rigs are generated armatures, and
   animations are keyframed by script from a few poses each, with easing.
   As starting assumptions: about 16 animations for the hero (the list in
   [The real costs of pre-rendering](#the-real-costs-of-pre-rendering)),
   about 6 for a common demon (idle, move, two attacks, hit, death), and
   bosses budgeted one by one. Creatures that float or drift, such as
   seraphim, ophanim and locust swarms, lean on procedural motion like
   bobbing, wing beats and rotation instead of hand-made clips.
4. **Modular kits.** Environment chunks are assembled from a small set of
   generated kit pieces (floor tiles, steps, pillars, wall ends, arches,
   altars), and related demons share rigs, parts and animations.

The risk is fidelity: scripted models will look simpler than hand-made
ones. The plan accepts that and leans on what scripts do well, which is
consistency, clean silhouettes, toon shading, ink outlines and bloom, with
ornament kept for focal pieces.

Blender isn't installed on the development VM today. Python 3 with Pillow
and NumPy is.
So installing Blender headless is the first task in M1. If it can't be
installed, the fallback is to generate the meshes, or the sprites directly,
procedurally in Python with NumPy and Pillow, using the same camera angle,
toon bands and passes.

### The real costs of pre-rendering

These costs are why the pipeline is scripted. Each one gets a measurement
in M1.

- **Frame count.** The figures here are arithmetic on assumed numbers, not
  measurements. Suppose the hero has 16 animations (idle, run, three light
  attacks, a critical, block, block hit, parry, parried, guard break, roll,
  hit reaction, being struck down and two casts) averaging 12 frames.
  That's about 190 frames per facing, or about 1,500 across 8 facings, for
  each pass. Every enemy and creature adds its own set. Mirroring, short loops and sharing
  animations between related enemies keep this down.
- **Texture memory.** Again assumed: a 256x256 frame takes 256 KB on the GPU
  as uncompressed RGBA. At 1,500 frames that's about 375 MB per pass for the
  hero alone if everything is loaded at once. So frames are trimmed and
  packed, the normal pass can use half resolution, the emissive pass covers
  only frames that glow, and only the creatures in nearby regions are
  loaded. The target is desktop browsers, so M1 sets the budget from a
  desktop GPU's limits.
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
├── rules.ts            # Pure combat and run rules: posture, parry, roll, lives, frame data
├── map.ts              # Fixed map of Heaven: regions, chunks, paths, landmarks (pure)
├── invasion.ts         # Seeded invasion: breaches, corruption spread, camps, events (pure)
├── corruption.ts       # Corruption level, tiers and what each tier unlocks or spawns (pure)
├── character.ts        # Creation, Choirs, Gifts, Vows, Anointings, Trumpets, Stain, Visions (pure)
├── testimony.ts        # What survives a wipe: Testimony, Remembrance, unlocks (pure)
├── save.ts             # Continuous run save, Testimony and Remembrance in localStorage
├── input.ts            # Mouse aim, left-click, F, hold F, Q, R, right-click feint, WASD
├── reads.ts            # Enemy read traits, commitments and feint baiting (pure)
├── palette.ts          # Region bases, corruption blend, toon bands, glow roles (pure)
├── chunks.ts           # Loads and unloads chunk layers near the camera
├── lit.ts              # Normal-map lighting and emissive Material, region tint
├── bloom.ts            # Bloom and grade PostProcessors built on ScreenShader
├── darkness.ts         # Dark overlay and light holes, after HollowDark
├── fx.ts               # Hit sparks, embers, corruption particles
├── hud.ts              # Health and halo, posture, Fervour, Grace, cooldown icons
├── art/atlas.ts        # Generated by tools/heaven-or-hell/pack_atlas.py
└── sfx/, HeavenOrHell.mp3
src/components/characters/player/<Hero>/   # one folder per character, per project rules
src/components/creatures/<Creature>/       # demons and angels alike
tools/heaven-or-hell/
├── source/             # reference images and .blend sources
├── rig.blend           # fixed camera, key light, outline and render settings
├── greybox.py          # blocks out chunks and actors from primitives
├── build_models.py     # scripted stylised models, kit pieces, rigs and animations
├── procedural.py       # fallback if Blender can't be installed: meshes or sprites in NumPy
├── render_sprites.py   # renders colour, emissive, normal (and depth) passes
├── pack_atlas.py       # trims, packs atlases, writes atlas.ts and frame data
└── references.md       # one line per reference: what to take from it
test/heaven-or-hell-rules.ts
docs/heaven-or-hell.md  # player-facing doc, written when M1 ships
```

### Testing

- `rules.ts`, `reads.ts`, `map.ts`, `invasion.ts`, `corruption.ts`,
  `character.ts`, `testimony.ts` and `palette.ts` import nothing from
  Excalibur, so `node:test` covers the parry window, posture overflow, roll
  i-frames, input buffering, feint baits and adaptive memory, the two-lives
  state, seeded invasions, corruption tiers, Choir bonuses, Stain
  thresholds and the Fall, what survives a wipe and the palette's value
  limits, all deterministically. Enemy reads use the run's seeded random
  numbers, so a bait test always plays out the same way.
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
- **Progress:** 2 of the 4–5 visual references are covered: Death's Door and
  Little Scavenger (see [Art direction](#art-direction)). The engine, the
  premise, the world structure, the palette, pixel art versus painted, the
  creatures' allegiance, the roguelite structure, the camera default, who
  makes the art, the controls, and the platform are
  settled. The Deepwoken wiki is linked, but the combat blog articles aren't
  collected yet, and `references.md` doesn't exist yet.
- **Done when** there are at least 5 tagged references. The open decisions
  each block a later milestone, not M0.

### M1: One lit area, pre-rendered

- **First task: install Blender headless** on the development VM and run a
  scripted render from the command line. If it can't be installed, switch to
  the procedural Python fallback in
  [Who makes the art](#who-makes-the-art) and adjust the rest of M1 to it.
- **Verify the camera.** Compare a test render at the orthographic,
  45–50 degree default against Death's Door's Steam screenshots: the pitch,
  the diagonal, and whether vertical edges converge. Lock the angle in
  `rig.blend` before any real asset.
- `greybox.py` and the first `build_models.py` kit pieces.
- The Blender pipeline end to end: `rig.blend`, `render_sprites.py` and
  `pack_atlas.py`, producing colour, emissive and normal passes and
  `art/atlas.ts`.
- The `#heavenorhell` route in its high-resolution mode, restoring the screen
  settings on leaving.
- One chunk of Heaven as a greybox: bevelled stone kit pieces rendered at the
  fixed angle, split into ground, tall-piece and front layers, in the
  default bone-grey base, then replaced by scripted kit pieces. The 2D packs
  in `src/assets/` don't fit this look.
- The hero as a scripted placeholder model, rendered in 8 facings with idle
  and run, walking in 8 directions. Sorted against pillars and walls by `z`, with the
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
  - the camera angle and lens are checked against the screenshots and
    written down;
  - switching to another hash restores the screen settings.

### M2: The combat core

- **The basic sword is the first weapon** (see
  [Weapons](./heaven-or-hell-progression.md#13-weapons) in the progression
  doc). It's a Plain medium weapon with three even hits and a flourish, a
  wind-up of about 0.35 seconds and the standard parry window. It's the
  baseline every other weapon is tuned against. Its critical, *Rising Cut*,
  comes in M3. The Flaming Sword is a later progression weapon.
- `rules.ts` covers the light attack chain with its flourish, block and
  posture, parry with its cooldown, and roll with i-frames.
- `input.ts` maps the decided controls: WASD to move, the mouse to aim,
  left-click for the light attack chain, F to parry, holding F to block and
  Q to roll. A tap of F parries and a hold past a short threshold blocks,
  as a starting value to tune.
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

- Critical attacks on R, starting with the basic sword's *Rising Cut*, an
  upward cut that deals 1.5 times a light hit's posture damage on a
  6-second cooldown. R is the only critical input, and criticals can't be
  feinted.
- Feints on right-click, always, and Fervour and Outcry (Deepwoken's Tempo
  and Vent).
- **Feints that fool the AI.** `reads.ts` implements the model in
  [section 14](./heaven-or-hell-progression.md#14-combat-controls-and-feints)
  of the progression doc. All numbers are starting values to tune:
  - *The feint:* right-click on any frame of an M1 wind-up before its
    active frames, or during a Hymn cast. 0.1 seconds of recovery, a
    1-second cooldown, and at most two feints in one M1 chain.
  - *Reads:* when you start a wind-up, each enemy in range waits its read
    delay, then rolls its commit chance and commits to a parry, block, roll
    or counter from its own table. Every commitment shows a tell.
  - *Baits:* a baited parry whiffs and goes on cooldown, leaving 0.35
    seconds in which your next hit can't be parried and deals +25% posture
    damage. A baited roll is followed through, with aim help on your next
    hit. A baited block soaks posture damage, and a baited counter can be
    parried for a longer stun.
  - *Read traits:* gullible enemies almost always commit and never learn.
    Wary enemies commit late and punish feints they see. Adaptive enemies
    remember your last 6 wind-ups, stop committing if you feint more than
    half the time, and learn your feint rhythm. Unreading enemies ignore
    feints.
  - *Remembrance:* the bestiary shows an enemy's read trait once it's
    Studied, and its read delay once it's Mastered. The bestiary UI itself
    lands in M4, so M3 records what the player has learned.
  - The three M3 demons cover three traits: the melee demon is gullible,
    the ranged demon is wary, and the corrupted elite is adaptive. Commit
    poses reuse the first frames of each enemy's parry, block and roll
    animations, so the animation budget doesn't grow.
- Two more demon types: a ranged one with telegraphed area attacks, and a
  heavy one with hyperarmor.
- One corrupted angel as an elite. A corrupted seraph is the cheapest,
  because it needs no new movement rules.
- **The character creation screen**, after the combat core and before the
  run: customising your angel and freely choosing one of the eight
  Choirs, each with +3 and +2 to two attributes, a signature passive, two
  innate Gifts and a flaw. Then a starter weapon: the sword, spear or knife.
  The full creation flow (Tongues, weapon, Boons and Burdens,
  Origin, appearance) can follow in M4 and M5, as the systems behind it
  land.
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
- **Done when** each enemy type has a unit-tested pattern, a fight against
  all three together is winnable with no damage taken, unit tests cover
  every bait outcome and the adaptive memory, a feint visibly fools the
  gullible demon in manual play and stops fooling the adaptive elite when
  spammed, and a character made with each Choir starts with that Choir's
  bonuses and Gifts.

### M4: The run

- `map.ts` describes Heaven's fixed regions, built from chunks, and
  `chunks.ts` streams them in and out as the hero moves (see
  [Risks](#risks)).
- `invasion.ts` seeds each run's breaches, local corruption spread, demon
  camps and events. An open breach pulls its region up to a tier ahead of
  the world. Sealing it slows the local spread and keeps the region a tier
  behind, protecting its altar, merchants and rewards.
- `corruption.ts` runs the run's clock: World Corruption rises with time
  at a steady, designed rate, crossing tiers, and nothing lowers it. The
  starting pace is one tier about every 2 hours of play, which depends on
  open decision 4.
- **Corruption tiers.** The tiers are in section 10 of the
  [progression doc](./heaven-or-hell-progression.md#10-corruption-tiers-the-power-curve):
  six tiers, from Tier 0 (the Calm Courts) to Tier 5 (War in Heaven). Every
  tier lists its enemy scaling (HP, posture, damage, attack rate, new
  enemies and bosses), its weapon loot (weapon tiers from Plain to Glorious,
  and which named weapons first appear), how much harder progression gets
  (experience, shrine costs, harder Gift hands) with bigger rewards, and
  what it unlocks. There's no strength cap per tier: each tier gives an
  Ascension pace to balance against, not a limit. M4 builds the tier
  machinery and the first three tiers. Whether Tier 5 ends the run is open
  decision 3.
- Two lives: the first time you're struck down, your halo dims (stained
  health), and altars clear it. The second time casts you out and wipes the
  run, and Heaven resets entirely. This is separate from personal Stain.
- Ascension, with Gift hands of 4 to 5 cards on each Ascension, and Visions
  earned within the run.
- Testimony and Remembrance (bestiary entries, map memory and lore) saved to
  `localStorage`, plus a continuous save of the run itself (open
  decision 4). The bestiary shows read traits from Studied. Where
  Remembrance is read depends on the hub (open decision 2).
- NPC dialogue with allied angels, using `DialogueNPC` and `ChatSystem`.
- **Done when** a run can be played from character creation through at
  least three corruption tiers, being struck down and cast out behave as
  designed, two seeds produce different invasions on the same map, closing
  and reopening the tab resumes the run without undoing a life lost, and
  Testimony and Remembrance survive a wipe.

### M5: Builds and variety

- The four base Tongues, each with its first Hymns and a Grace bar.
- Vows, Anointings, Trumpets and the Throne's answer, each unlocked at its
  corruption tier as the progression doc sets out.
- Personal Stain: its sources and cleansing, the thresholds at 25, 50 and
  75, the halo cracking and reddening, and the Fall at 100, which ends the
  run as a wipe.
- Progression weapons by tier, from the Spear of the Host at Tier 1 to the
  Flaming Sword at Tier 2 and beyond, and the Testimony unlocks for the
  mace and the rare Choir variants.
- Shrines of the Throne as rare places on the map, paid with Visions, more
  Gifts, and a second region with its own monochrome base.
- More demons and bosses from the roster, more allied angels, and more
  corrupted angels.
- **Done when** two runs with different Choirs, Tongues and Vows play
  noticeably differently, and a run pushed to 100 Stain ends in the Fall
  while keeping Testimony and Remembrance.

### M6: Polish and release

- An original score and sound effects, built by a script such as
  `tools/oka-world/compose_music.py`.
- The title and chapter cards, `docs/heaven-or-hell.md`, and a README entry.
- **Done when** the GitHub Pages build serves `/#heavenorhell` and the
  console has no errors on a fresh `localStorage`.

## Risks

- **Scripted art fidelity.** With no modeller, every model, rig and
  animation is scripted, and may look simpler or stiffer than the
  references. Keep shapes simple, design silhouettes first, let toon bands,
  ink lines and bloom carry the look, and hold animation to the budget in
  [Who makes the art](#who-makes-the-art). Judge it on M1 screenshots next
  to the references.
- **Blender may not install headless** on the development VM. That's why
  it's M1's first task, with the procedural Python fallback ready if it
  fails. The fallback is likely to look plainer and makes rigged animation
  harder.
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
- **The camera angle is locked in by every render.** Changing the angle or
  lens after M1 means re-rendering everything. Verify the default against
  the screenshots and lock it before the first real asset.
- **Streaming a large map.** Excalibur has no built-in streaming. Chunks have
  to be loaded, added to the scene, removed and unloaded by `chunks.ts`, with
  `OffscreenSystem`'s viewport events as a trigger. Loading images while the
  hero runs can stutter, so chunks next to the current one load ahead of
  time, and textures for far chunks are released. The map's size (open
  decision 1) decides how hard this is.
- **Saving a long run.** A long permadeath run has to survive a closed tab
  or a crash without letting a player undo being struck down by reloading.
  The save has to be continuous and small, and `localStorage` has a size
  limit, so the save stores the seed and the changes, not the whole map.
- **Boss render cost.** Behemoth, Leviathan and the dragon are large, so
  their frames are large, and several can be on the map at higher tiers.
  Budget each boss on its own, render large bosses in parts, and load them
  only near the player.
- **Corruption balance.** Corruption rises at its own rate with no cap on
  the player, so if it rises faster than a player can grow, long runs
  become hopeless, and if slower, they lose tension. Tune the rate against
  the Ascension pace for each tier in play in M4, and keep the rates and
  scaling tables as data in `corruption.ts` so they can be tested and
  changed.
- **Feint AI that feels unfair or exploitable.** Gullible enemies can make
  feints feel like a cheat, and adaptive ones can feel like they read your
  mind. Every commitment needs a visible tell, adaptive memory must fade,
  and M3's manual play should check both ends. Keep the trait numbers as
  data in `reads.ts`.
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
