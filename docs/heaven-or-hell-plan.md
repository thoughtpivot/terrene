# Heaven Or Hell: Plan

## Overview

Heaven Or Hell is a working title for an open-map roguelite set in Heaven.
You play a lesser angel defending Heaven while Hell invades it. It takes its
mechanics from Deepwoken and its look from Death's Door, pushed darker. The
world is toon-shaded, bevelled 3D seen from one fixed, angled camera, in
near-black monochrome, and Heaven's white and gold clash with Hell's red and
orange in glows that bloom against the dark.

The game is built entirely in ExcaliburJS 0.32, like the rest of Terrene,
with no other engine and no 3D tool. It is 2D. Because the camera never
rotates, every image is painted for that one angle: AI-generated source
paintings are cut, keyed and packed into high-resolution sprites by
TypeScript build scripts, and the 3D look comes from the painted volume
plus Excalibur shaders for lighting, toon bands, outlines, glow and bloom.

This plan turns the Granola notes "Heaven Or Hell" (Dan, October 23, 2026)
and Dan's follow-up decisions into milestones that fit Terrene's existing
scene, rules and test patterns. Its companion,
[heaven-or-hell-progression.md](./heaven-or-hell-progression.md), is the
detailed design for character creation and progression, partly decided
by Dan and partly still a proposal.

### Questions that block M1 or M2

None. M1 (one lit, painted area) and M2 (the combat core with the
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
  *The follow-up replaces the 2D isometric view with Death's Door's fixed
  angled camera, still drawn in 2D with painted sprites.*
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

**Engine.** Dan: "Stay in ExcaliburJS." And later: "I don't plan on
downloading Blender for this project or using Three.js. I want this to be
built entirely on Excalibur.js; if there's any problem with anything I ask
for, let me know." So the game uses Excalibur 0.32 alone, with no Blender,
no Three.js and no other engine or 3D tool, as described in
[Technical approach](#technical-approach). Excalibur reuses `ChatSystem`,
`QuestSystem` and `DialogueNPC` and keeps the project rules as they are.
Where Excalibur lacks something this plan needs (skeletal animation,
multi-pass bloom, map streaming), the plan says so and builds it on
Excalibur, and the problems Dan asked to hear about are listed in
[Risks](#risks).

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
angels serves as elites and bosses. See [Creatures](#creatures) and the
full roster in the [bestiary](./heaven-or-hell-bestiary.md).

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
opens up more systems. **The pace depends on the difficulty** chosen at
character creation: a tier lasts 40, 60, 80 or 100 minutes of play, from
the easiest difficulty to the hardest (see
[Character creation and progression](#character-creation-and-progression)).

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

**Art production.** There is no artist, and no art will be bought or
commissioned. Dan: "Just try your best." AI image generation is allowed for
the source paintings. Dan: "focus on making them high-resolution sprites
that give it that 3D look, but it is 2D." The paintings are generated on a
keyable flat background, all for the same fixed camera angle, and Node and
TypeScript scripts cut, key and pack them into sprites. The look is chunky,
bevelled and toon-shaded, inspired mostly by Death's Door and only a little
by Little Scavenger. See [Who makes the art](#who-makes-the-art).

**Animation.** Dan wants "very crisp animations that give a very immersive
feel." Excalibur has no skeletal animation, so the plan writes a 2D cutout
puppet system for it: separate painted parts, keyframed with easing,
secondary motion, squash and stretch, and hit-stop. See
[Puppet animation](#puppet-animation).

**Bloom.** Maximum bloom and vibrance is a requirement. Dan: "no true bloom
is a very bad problem; try your best creating the most bloom and
vibrance." M1 tests a real multi-pass bloom inside Excalibur. See
[Bloom](#bloom).

**Deploy.** Each milestone is published to GitHub Pages so it can be played
at `https://thoughtpivot.github.io/terrene/#heavenorhell`. See
[Deploy](#deploy).

**Parallel work.** Development is split into workstreams on separate
branches (rendering, the combat rules and the progression systems), with an
integration step. See [Workstreams](#workstreams).

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
and Flaws are called Boons and Burdens. The last creation step picks one
of four run difficulties: easier ones make a run shorter and easier,
harder ones longer and harsher. See
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

**Goetic spirits keep their real names.** The spirits of the Ars Goetia
keep their names, shown with a rank title underneath in the form
"<Rank> of the Pit": Bael, King of the Pit; Focalor, Duke of the Pit;
Andras, Marquis of the Pit. The rank is the one the Ars Goetia gives. See
[Named demons](#hell-the-enemies).

**Allied angels fight beside you, and they fall.** Allied angels roam the
open map and fight alongside the player. They're fragile and die easily. A
dead or overwhelmed ally can be corrupted into a **Fallen Angel**, the
lowest enemy tier (a common). The corruption plays a quick fall animation
that never pauses gameplay, then the Fallen Angel attacks. Named corrupted
angels stay the elite and boss tier. See
[Fallen Angels](#fallen-angels-the-common-tier).

**The KJV for all scripture.** Every scripture quote uses the King James
Version, with Tobit from the KJV's Apocrypha.

**The music pulses on the 808.** On 808 hits in the score, and only those,
the screen gives a subtle vibration whose size rises with the Corruption
Tier (0 to 5), plus a glow and bloom pulse. It isn't screen shake: the
camera shake stays reserved for hits and parries. There's no setting to
turn it off yet, because settings come later. See
[Beat pulse](#beat-pulse).

**Corruption pace.** The old "about 2 hours per tier" is gone. Each
difficulty's pace (40, 60, 80 or 100 minutes per tier) is a tuning
constant, `minutesPerTier` in `progression/tuning.ts`, matching the
progression code. The original single pace, 100 minutes (1 hour 40
minutes), is kept by the hardest difficulty, Son of the Morning.

### Resolved since the first draft

- **What "Heaven Or Hell" means in play.** Resolved by the premise: you
  defend Heaven against Hell's invasion. The earlier readings (descending
  through hell floors, or choosing up or down at each exit) are dropped.
- **Pixel art or painted art.** Resolved: high-resolution painted 2D
  sprites, not pixel art, painted with volume and lit with toon bands so
  they read as 3D.
- **The engine.** Resolved: ExcaliburJS 0.32 alone. No Blender, no
  Three.js and no other engine.
- **What the heavenly creatures are to the player.** Resolved: angels are
  allies, demons are the main enemies, and corrupted angels are a smaller
  elite and boss tier.
- **Roguelite or roguelike.** Confirmed: a roguelite, with open-world
  permadeath and knowledge as the main thing kept.
- **The camera angle and lens.** Decided as a default: Death's Door's look,
  45–50 degrees down along a diagonal, orthographic, one angle everywhere.
  It's verified against the screenshots in M1.
- **Who makes the art and animations.** Resolved: the development agent,
  using AI-generated source paintings processed by TypeScript scripts and
  animated with a puppet system, with no bought or commissioned art.
- **Animation style.** Resolved: crisp 2D cutout puppets with easing,
  secondary motion, squash and stretch, held key poses and hit-stop.
- **Bloom.** Resolved as a requirement: maximum bloom and vibrance, with a
  real multi-pass bloom tested in M1.
- **Map streaming.** Resolved: regions and chunks load and unload by
  distance from the player, with a debug view.
- **Deploy.** Resolved: every milestone is published to GitHub Pages.
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
- **How long a run lasts.** Resolved: the player picks one of four
  difficulties at creation, and it sets the corruption pace. Tier 5
  arrives after 3 h 20 min on the easiest and 8 h 20 min on the hardest.
- **Goetic names.** Resolved: real Ars Goetia names, each with
  "<Rank> of the Pit" underneath.
- **Whether allied angels can die or fall.** Resolved: they roam, fight
  beside you, die easily, and can be corrupted into common Fallen Angels.
- **Scripture translation.** Resolved: the KJV for every quote.
- **Music-reactive effects.** Resolved: a beat pulse on 808 hits only,
  scaled by Corruption Tier, separate from combat screen shake.

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
4. **How a run is saved.** A long run with permadeath has to survive
   closing the tab. *Proposal:* the run saves continuously to
   `localStorage`, so quitting never undoes a death. The run's length is
   no longer open: the difficulty chosen at creation sets the corruption
   pace, from 40 to 100 minutes per tier. [M4]
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
  The rate is set by the run's difficulty (40 to 100 minutes per tier).
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

The creature designs start from the descriptions below. Decided: scripture
is quoted from the King James Version, and Tobit from the KJV's Apocrypha.
Decided: the angels are allies, demons and creatures of Hell are the
main enemies, and corrupted angels are a smaller elite and boss tier. The
role of each creature is a proposal.

The full roster lives in the companion
[bestiary](./heaven-or-hell-bestiary.md): 8 ally entries and 35 enemy
entries, each with a sprite brief, a draft AI image prompt and a first tier
aligned with the progression doc. The tables below are the short version.
The bestiary is a proposal too, and where it differs, this section and the
progression doc win.

### Angels: allies and NPCs

| Creature | Description | Proposed role |
| --- | --- | --- |
| The player | A lesser angel. The premise echoes Revelation 12:7: "there was war in heaven: Michael and his angels fought against the dragon" | The hero |
| Seraphim | Isaiah 6:2–7: "each one had six wings; with twain he covered his face, and with twain he covered his feet, and with twain he did fly." They cry "Holy, holy, holy," and one has "a live coal in his hand, which he had taken with the tongs from off the altar" | Allies who fight beside you at breaches, and altar keepers who clear a dimmed halo |
| Cherubim (the living creatures) | Ezekiel 1:5–14: "the likeness of a man," "four faces," "four wings," "the hands of a man under their wings," "straight feet," "the sole of a calf's foot," and they "sparkled like the colour of burnished brass." They "went every one straight forward" and "turned not when they went," and they "ran and returned as the appearance of a flash of lightning." Ezekiel 10:14 lists "the face of a cherub," "the face of a man," "the face of a lion" and "the face of an eagle" | Guardians of gates and quest givers |
| Ophanim (the wheels) | Ezekiel 1:15–21 and 10:9–13: "a wheel in the middle of a wheel," "like unto the colour of a beryl," with rings "full of eyes round about them four." "They went upon their four sides: and they turned not when they went," and in Ezekiel 10:13 they are called "O wheel." *Ophanim* is Hebrew for "wheels" | Sentinels that watch the map. Talking to one reveals nearby breaches, which is a natural source of map knowledge |
| Thrones | Colossians 1:16 names "thrones, or dominions, or principalities, or powers" among things created "in heaven." Some Christian angelology treats Thrones as one of the choirs of angels and identifies them with the ophanim. Jewish angelic hierarchies keep the two apart | To be chosen: either the same creature as the ophanim, or a ruler class that grants Vows |
| The four living creatures of Revelation | Revelation 4:6–8: "four beasts full of eyes before and behind," "like a lion," "like a calf," "a face as a man" and "like a flying eagle," which "had each of them six wings about him; and they were full of eyes within" | Guardians of the Throne region and keepers of lore |
| The Host | Revelation 12:7's "his angels": the rank and file, with no physical description in scripture (the bestiary's A8) | Allies who roam the open map in small bands and fight beside you. They're fragile, and a dead or overwhelmed one can fall (see [Fallen Angels](#fallen-angels-the-common-tier)) |

### Hell: the enemies

| Creature | Description | Proposed role |
| --- | --- | --- |
| Fallen Angels | No single verse. Revelation 12:9 says the dragon's "angels were cast out with him," and this game shows the same fall happening to allies during a run | The lowest enemy tier, a common: allied angels that died or were overwhelmed and were corrupted (see [Fallen Angels](#fallen-angels-the-common-tier)) |
| Locusts of the pit | Revelation 9:3–10: they come out of the smoke of "the bottomless pit," "like unto horses prepared unto battle," with "crowns like gold," "the faces of men," "hair as the hair of women," teeth "as the teeth of lions," "breastplates of iron," wings that sound "as the sound of chariots of many horses running to battle," and "tails like unto scorpions, and there were stings in their tails" | The common swarm enemy from the first tier. Their stings are the first orange telegraphs a player learns |
| Abaddon (Apollyon) | Revelation 9:11: the locusts have "a king over them, which is the angel of the bottomless pit, whose name in the Hebrew tongue is Abaddon, but in the Greek tongue hath his name Apollyon" | A boss. As an angel of the pit, he sits in the corrupted-angel tier and leads the locust swarms |
| Legion | Mark 5:2–13: "a man with an unclean spirit" had "his dwelling among the tombs," and "the chains had been plucked asunder by him." Asked his name, he answered, "My name is Legion: for we are many," and the spirits entered a herd of swine, "about two thousand" | An elite that splits into many bodies when hurt and possesses lesser demons |
| Behemoth | Job 40:15–24: he "eateth grass as an ox," "moveth his tail like a cedar," and "his bones are as strong pieces of brass; his bones are like bars of iron." He lies "in the covert of the reed, and fens" | A heavy boss with hyperarmor that charges across open regions |
| Leviathan | Job 41: "his scales are his pride, shut up together as with a close seal," "out of his mouth go burning lamps," "out of his nostrils goeth smoke," and "his breath kindleth coals." "The sword of him that layeth at him cannot hold." He "maketh the deep to boil like a pot" and is "a king over all the children of pride" | A boss of the Sea of Glass whose armour has to be broken before it takes damage |
| The beast from the sea | Revelation 13:1–2: "having seven heads and ten horns, and upon his horns ten crowns, and upon his heads the name of blasphemy," "like unto a leopard," with feet "as the feet of a bear" and a mouth "as the mouth of a lion," and "the dragon gave him his power" | A late boss |
| The dragon | Revelation 12:3–9: "a great red dragon, having seven heads and ten horns, and seven crowns upon his heads." "His tail drew the third part of the stars of heaven." He fought Michael's angels and "was cast out" | The invasion's leader and the last-tier boss |
| Named demons | Tobit 3:8 names "Asmodeus the evil spirit," and Matthew 12:24 names "Beelzebub the prince of the devils." The Ars Goetia, part of a 17th-century grimoire called the Lesser Key of Solomon, lists 72 spirits with ranks, such as King Bael, Duke Astaroth, King Asmodeus and King Belial | Ranked enemies using the Ars Goetia's titles, from Knights at the first corruption tier to Kings who roam as bosses (progression doc, section 10). They command camps and lead breaches. Decided: Goetic spirits keep their real names, shown with their rank underneath as "<Rank> of the Pit", for example "Bael, King of the Pit", "Focalor, Duke of the Pit" or "Andras, Marquis of the Pit". The [bestiary](./heaven-or-hell-bestiary.md) quotes the Ars Goetia's descriptions of their appearance as a starting point for their designs |
| Lesser demons | No single source. Original designs, kept in the same shape language | The melee, ranged and heavy types of M2 and M3 |

Behemoth and Leviathan appear in Job as creatures of God's making, not as
demons. Casting them as Hell's is this game's choice. So is casting the
beast and the dragon, who come to earth in Revelation, as invaders of
Heaven.

### Fallen Angels: the common tier

Decided by Dan: allied angels roam the open map and fight alongside the
player, they're fragile and die easily, and a dead or overwhelmed ally can
be corrupted into a Fallen Angel, the lowest enemy tier. The details below
are a proposal, and the numbers are starting values to tune:

- **Who roams.** Small bands of one to three Host angels walk the map and
  join any fight within about 12 metres. Seraphim, cherubim and ophanim
  keep their posts at breaches, gates and lookouts.
- **Fragile.** An allied angel has about a third of a common demon's HP and
  little posture, so two or three demon hits kill it. Allies can't be
  healed by the player in M4, so protecting them means fighting well.
- **Dead or overwhelmed.** An ally is overwhelmed when its posture breaks
  while two or more demons are attacking it. A dead or overwhelmed ally
  falls with a chance that rises with the local Corruption Tier: 25% at
  Tier 0, plus 15% per tier, reaching 100% at Tier 5. Otherwise it fades
  into light and is gone.
- **The fall never pauses play.** The corruption is a quick fall
  animation, about 0.6 seconds as a starting value: the halo cracks and
  drops, the gold rim floods red and the wings jerk down. It uses no
  hit-stop, no `Engine.timescale` change, no camera move and no input
  lock, and enemies and the player keep acting through it. Then the Fallen
  Angel attacks the nearest target, the player or another ally.
- **The lowest tier.** A Fallen Angel is a common, like the goat-demon: a
  short parryable combo with orange wind-ups, a gullible read, and scaling
  with tier like any other common. It uses the Host's puppet with red where
  the ally had white and gold. Killing one gives no Stain.

Named corrupted angels, such as Abaddon, stay the elite and boss tier
described next.

### Corrupted angels: the elite and boss tier

A smaller tier. Each is an allied creature that Hell has taken, so it shares
the ally's shape and gets red where the ally has white. That follows Death's
Door's "echo" rule for related enemies.

- A corrupted seraph, whose burning coals become ranged attacks.
- A corrupted cherub that attacks in all four directions without turning.
- A corrupted ophan that rolls through the arena.
- Abaddon, who leads them.

### Notes for the art pipeline

Cherubim, ophanim and corrupted versions of them move "without turning," so
each needs only one painted view instead of several, which saves a lot of
painting. Locusts and Legion's bodies share one puppet each and appear in
numbers, so they need few animations. The big bosses (Behemoth, Leviathan,
the beast and the dragon) are the costliest to paint consistently and to
animate, so they come one at a time, from M4 on, painted in parts. Wings,
eyes and wheels suit puppet loops in short cycles.

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
  Every sprite is painted for that angle, so nothing in the game may rotate
  the camera, and zoom stays within a narrow range so sprites stay sharp and
  ink lines keep their width. Decided as the default: Death's Door's look, about
  45–50 degrees down, looking along a diagonal, with an orthographic lens.
  These are starting values. M1 checks them against Death's Door's
  screenshots, for example whether vertical edges converge, which would
  mean a perspective lens. One angle covers the whole world.
- **High resolution.** The game renders at the display's full resolution,
  with antialiasing on. There is no pixel art and no pixel snapping. Sprites
  are packed at the size they're shown on a 1080p screen or larger, and
  never scaled up, so nothing blurs.
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
  surfaces skip the bands and draw at full brightness. Source paintings are
  prompted for flat, even light, and the runtime lighting `Material`
  applies the three bands, so every sprite gets the same bands.
- **Ink outlines.** Every sprite gets a dark ink outline at a fixed line
  width, drawn by a shader around its alpha edge rather than trusted to the
  painting. Environment outlines are pure black, so they merge into
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
  shafts are allowed as additive shapes over dark. Glow and bloom also
  pulse on the music's 808 hits (see [Beat pulse](#beat-pulse)).
- **Character readability.** Every actor reads in silhouette first. The hero
  gets a gold outline and a white rim light. Demons and corrupted creatures
  get a thin red rim, and related enemies share a shape, as Death's Door's
  Ghost "echoes" its Golem. Each actor gets one strong colour accent, like
  the crow's red sword.
- **Environment shape language.** Paint the environment as chunky,
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
embers appear. In the art pipeline the environment is painted in near
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
| Isaiah 6:1–7 (KJV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Isaiah+6%3A1-7&version=KJV) | The seraphim |
| Ezekiel 1:4–28 (KJV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Ezekiel+1%3A4-28&version=KJV) | The living creatures and the wheels |
| Ezekiel 10 (KJV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Ezekiel+10&version=KJV) | The cherubim, their four faces and the wheels called "O wheel" |
| Colossians 1:16 (KJV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Colossians+1%3A16&version=KJV) | Thrones among things created in heaven |
| Revelation 4:6–8 and 12:7–9 (KJV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Revelation+12%3A7-9%3BRevelation+4%3A6-8&version=KJV) | The four living creatures, the sea of glass, the war in heaven, and the dragon's angels cast out with him |
| Ophanim on Wikipedia | [en.wikipedia.org](https://en.wikipedia.org/wiki/Ophanim) | "Ophanim" means wheels. Some Christian angelology identifies them with Thrones, and Jewish hierarchies keep the two apart |
| Revelation 9:1–11, 12:3–4 and 13:1–2 (KJV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Revelation+9%3A1-11%3BRevelation+12%3A3-4%3BRevelation+13%3A1-2&version=KJV) | The locusts and Abaddon/Apollyon, the great red dragon, and the beast from the sea |
| Job 40:15–24, Job 41 and Mark 5:1–13 (KJV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Job+40%3A15-24%3BJob+41%3A1-34%3BMark+5%3A1-13&version=KJV) | Behemoth, Leviathan and Legion |
| Matthew 12:24 (KJV) | [biblegateway.com](https://www.biblegateway.com/passage/?search=Matthew+12%3A24&version=KJV) | Beelzebub by name |
| Tobit 3:8 (KJV Apocrypha) | [en.wikisource.org](https://en.wikisource.org/wiki/Bible_(King_James)/Tobit) | Asmodeus by name. Bible Gateway's KJV has no Apocrypha, so Tobit is quoted from Wikisource's King James text |
| The Lesser Key of Solomon on Wikipedia | [en.wikipedia.org](https://en.wikipedia.org/wiki/The_Lesser_Key_of_Solomon) | The Ars Goetia's 72 spirits and their ranks, a source for named demons |
| List of demons in the Ars Goetia on Wikipedia | [en.wikipedia.org](https://en.wikipedia.org/wiki/List_of_demons_in_the_Ars_Goetia) | Each spirit's rank (King, Duke, Prince, Marquis, Earl, President, Knight), used for the "<Rank> of the Pit" titles |
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

- **Save slots (decided).** The flow is Title (Start), then slot select,
  then character creation for an empty slot or continue for a filled one,
  then the game. There are three slots, A, B and C, as in Deepwoken's slot
  select. Each holds its own character and run plus its own Testimony and
  Remembrance, so a wipe in one slot never affects another. Each slot is
  saved under its own versioned `localStorage` key, and the old single save
  moves into slot A on first load (`progression/save.ts`).
- You are one of **the Tenth**, lesser angels kindled to refill Heaven's
  choirs after the War in Heaven. Each Choir is an echo of a higher choir,
  such as the Kindled (Seraphim) or the Wheelborn (Ophanim), with the same
  +3 and +2 attribute bonuses as Deepwoken's Aspects. Each of the eight
  Choirs also has a signature passive, two innate Gifts, a flaw that can be
  played around, and a rare variant, all balanced to the same budget.
  Choirs are chosen freely.
- Creation follows Deepwoken's order: Choir, Tongues, a basic weapon,
  Boons and Burdens, Origin, appearance, then the Testimony Shop and
  Penances, and finally the run's difficulty. Every Origin works solo.
- **Four difficulties** are chosen at creation and kept through a wipe.
  Each sets the corruption pace and multiplies enemy health, posture,
  damage and aggression on top of the tier's scaling. The two harder ones
  also raise Stain gain and drop weapons one tier higher. The detail and
  KJV epigraphs are in section 1 of the progression doc. Starting values:

  | Difficulty | Minutes per tier | Tier 5 at | Enemy HP / posture / damage / aggression |
  | --- | --- | --- | --- |
  | Still Waters (Psalm 23:2) | 40 | 3 h 20 min | ×0.70 / ×0.80 / ×0.70 / ×0.80 |
  | The Narrow Way (Matthew 7:14), the default | 60 | 5 h | ×1.00 / ×1.00 / ×1.00 / ×1.00 |
  | The Furnace of Affliction (Isaiah 48:10) | 80 | 6 h 40 min | ×1.25 / ×1.15 / ×1.20 / ×1.15 |
  | Son of the Morning (Isaiah 14:12) | 100 | 8 h 20 min | ×1.50 / ×1.30 / ×1.40 / ×1.30 |

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

### Why painted 2D sprites fit Excalibur

Excalibur's [documentation](https://excaliburjs.com/docs/) describes it as
"a free and open source 2D game engine written in TypeScript." The
installed `excalibur` 0.32.0 has no perspective projection, no depth test
and no meshes. Its only projection is `Matrix.ortho()`, its bundle enables
only `gl.BLEND`, and `Material` shaders take 2D positions. Dan has ruled
out Blender, Three.js and any other engine, so nothing is 3D at any stage.
The game is 2D, and the 3D look is painted into the sprites and then lit by
shaders. This works because the camera never rotates: every painting is
made for the one fixed angle, and that angle covers the whole game.

The honest limit is that painted 2D can't match real 3D in every way.
Light can't truly wrap around a painted shape, an actor can't turn to an
angle nobody painted, and the floor can't hide part of a body the way a
depth buffer would. The plan works with these limits rather than around
them: a few painted views per actor, layered environment pieces, and
lighting that only has to suggest the form the painting already shows.

These are the Excalibur 0.32 APIs the plan relies on. Each was checked in
`node_modules/excalibur/build/dist`:

- `ImageSource` (with `unload()` for streaming),
  `SpriteSheet.fromImageSourceWithSourceViews()` for packed atlases, and
  `Sprite` for each puppet part.
- `Graphic`'s `rotation`, `scale`, `origin`, `flipHorizontal` and `tint`,
  and `GraphicsGroup`, whose members take an `offset`. These are what the
  puppet system moves each frame. The easing functions (`easeOutCubic`,
  `easeInOutQuad` and others) are exported from `Math/easings`.
- `Actor.z` for draw order. With no depth buffer, sorting is how actors pass
  in front of and behind things.
- `graphicsContext.createMaterial()` and `Material`, whose `images` option
  binds extra textures by sampler name. That's how a sprite gets its
  normal-ish and emissive maps. Materials also get `v_screenuv` and can read
  the screen texture.
- `addPostProcessor()` and `removePostProcessor()`, with a `PostProcessor`
  built on `ScreenShader`, for bloom and the final grade. How far a
  post-processor can go beyond a single pass is the M1 bloom test,
  described in [Bloom](#bloom).
- `GpuParticleEmitter` for embers, sparks, corruption and hit effects.
- `ParallaxComponent` for drifting fog and sky layers.
- `Camera.shake(magnitudeX, magnitudeY, duration)`, which only moves the
  camera, plus `elasticToActor()` and `limitCameraBounds()` to follow the
  hero. `Camera.rotation` is never set.
- `OffscreenSystem`, which tags entities that leave the view with
  `ex.offscreen` and emits `enterviewport` and `exitviewport` events, to
  pause actors that are off screen.
- `Engine.timescale` for a whole-game hit-stop when it's needed.
- `TextureLoader.checkImageSizeSupportedAndLog()`, which checks an image
  against the GPU's maximum texture size, and
  `graphicsContext.textureLoader.delete()`, which releases an image's
  texture when its chunk unloads.

Excalibur 0.32 has no light types, no skeletal animation and no streaming.
Darkness uses the method from Oka World 2's `HollowDark` overlay
(`destination-out` radial gradients over a dark fill), light on sprites
comes from their normal-ish maps in a `Material`, and the plan writes its
own puppet system and chunk streamer on top of Excalibur.

### The art pipeline

Every sprite starts as an AI-generated source painting and ends as a packed
high-resolution atlas, and everything between is a Node and TypeScript
script under `tools/heaven-or-hell/`. Python isn't used, so the whole
toolchain stays in TypeScript alongside the game. The scripts run on
Node 22's built-in type stripping, which needs `.ts` import specifiers (the
same fix as in [Testing](#testing)). `pngjs`, already a dev dependency,
reads and writes the PNGs.

- **One camera, one style sheet.** Every painting is drawn for the same
  fixed Death's Door-style camera: orthographic, about 45–50 degrees down,
  looking along a diagonal, as verified in M1. M1 produces a style sheet
  (a lit stone block, a pillar, a floor tile and a standing figure at that
  angle) that every later prompt is matched against, and is given to the
  generator as a reference image when it accepts one.
- **Prompts are recorded.** `tools/heaven-or-hell/prompts.md` keeps one
  shared style block, repeated word for word in every prompt, then one
  entry per asset: the full prompt, the generator used, the date, the seed
  if the generator exposes one, and which output was kept. Any asset can
  then be regenerated or matched later.
- **Keyable flat background.** Paintings are generated on one flat colour
  that the palette never uses, such as pure magenta, as a starting choice.
  Prompts also ask for flat, even light, a dark ink edge, no cast shadow on
  the background, and the subject whole and centred.
- **Cut and key.** `key.ts` removes the background with a colour-distance
  key and a soft edge, removes the background tint from edge pixels
  ("despill"), trims empty space and sets a base point at the feet.
  Generated backgrounds are never perfectly flat, so the tolerance is per
  asset, recorded next to its prompt.
- **Parts for puppets.** Characters are generated as separate parts on the
  flat background (body, head, wings, halo, weapon and so on), in a fixed
  pose with clear joints. `parts.ts` cuts each part and records its pivot,
  so the puppet system can move it.
- **Maps for lighting.** `maps.ts` derives a normal-ish map from each
  painting's shading (a height guess from brightness, turned into normals),
  and an emissive mask from the glowing hues, with hand-drawn mask
  overrides where the guess is wrong. These are approximations, not true
  normals, which is why the lighting only adds to the painted volume.
- **Neutral environment, tinted at runtime.** Environment pieces are
  painted near neutral and tinted per region and by corruption in the
  `Material`, so one kit serves every region.
- **Scaling and packing.** `pack.ts` scales each part to its fixed size
  on a 1080p screen, never upward, then packs colour, normal-ish and
  emissive atlases with identical layouts, within the GPU's maximum texture
  size, and writes `art/atlas.ts`, the way `tools/oka-world/` generates Oka
  World's art. Down-scaling uses a small area-average resampler written in
  TypeScript, and adding `sharp` is an option if quality or speed needs
  it, decided in M1.
- **Environment chunks.** Each chunk is assembled from painted kit pieces
  (floor tiles, steps, pillars, wall ends, arches, altars) in layers:
  - *ground:* always behind actors;
  - *tall pieces:* pillars, wall ends, statues, each a separate sprite
    sorted by its base;
  - *front:* the cut-low wall stubs on the camera side, always in front.

### Who makes the art

Decided: nobody is hired and nothing is bought. The development agent
generates the source paintings with an AI image generator, runs them
through the pipeline, and builds the puppets and animations. In Dan's
words, the aim is "high-resolution sprites that give it that 3D look, but
it is 2D."

The 3D look comes from two places. The first is painted volume: bevelled
edges, a lit top face, darker sides and painted form, all at the one camera
angle. The second is Excalibur shaders: a lighting `Material` that reads the
normal-ish map, quantises light into the three toon bands and adds a rim
light; an ink outline drawn around each sprite's alpha edge; emissive glow;
and bloom.

The work goes in this order:

1. **Style sheet first.** Lock the camera angle and the style block on a
   few test pieces before any real asset, and judge them next to the
   references.
2. **Silhouette first.** Each asset is judged as a black shape before its
   painting is accepted, because the outline, toon bands and bloom carry
   most of the look.
3. **Modular kits.** Environment chunks are assembled from a small kit of
   painted pieces, and related demons share parts.
4. **Animation by puppet.** Motion comes from moving painted parts, not
   from painting frames. See [Puppet animation](#puppet-animation).

The limits, plainly:

- **Fidelity versus real 3D.** Painted sprites can't turn freely, light
  can't truly wrap around them, and normal-ish maps guessed from a painting
  are rough. Light on sprites will look more like a tint with bands than
  like real 3D lighting. The plan keeps lighting moderate and lets the
  painting carry the form.
- **Consistency across generated images.** Image generators drift between
  outputs in style, line weight, light direction, proportion and above all
  camera angle. A pillar can come out a few degrees off, and the eye
  catches it next to its neighbours. The mitigations are the shared style
  block, reference images where the generator accepts them, the style
  sheet, rejecting off-angle results, and the runtime shaders (bands,
  outline, tint), which pull different paintings toward one look. Expect
  to generate several candidates per asset and keep one.
- **Matching views.** A character needs the same design in several views,
  and generators don't keep a design identical between them. Fewer views,
  mirroring and puppet parts reused across views limit the problem without
  removing it.
- **Large creatures.** Behemoth, Leviathan, the beast and the dragon are
  where these limits are worst. Generators make images of limited size and
  detail, so a large creature is generated in parts, at matching scale,
  that must join without visible seams, and every part must agree on
  angle and light. Each boss is budgeted and judged on its own, from M4 on.
- **Rights.** Terms differ between image generators. Before M6, check that
  the chosen generator's terms allow use in a published game.

### Puppet animation

Dan wants "very crisp animations that give a very immersive feel."
Excalibur 0.32 has no skeletal animation, so the plan writes a 2D cutout
puppet system for it:

- **Separate parts.** Each actor is a tree of painted parts, such as body,
  head, wings, halo and weapon, each with a pivot. A pure solver in
  `puppet/rig.ts` works out each part's position, rotation and scale from
  its parent's, and `puppet/view.ts` applies the result to the part
  sprites (`Graphic` `rotation`, `scale`, `origin` and `GraphicsGroup`
  offsets) every frame. How one lighting `Material` handles rotated parts,
  or whether each part needs its own child actor, is checked in M1.
- **Keyframed transforms with easing.** Clips are data: keys for each
  part's offset, rotation and scale, with an easing per key, using
  Excalibur's easing functions. Adding a move costs authoring time, not
  texture memory.
- **Overlapping secondary motion.** Wings, robes, halo and hair follow
  their parent through a damped spring, so they lag, overshoot and settle.
- **Squash and stretch on impacts.** A short scale pulse on hits, parries,
  landings and guard breaks, keeping area roughly constant.
- **Held key poses.** Attacks hold their wind-up and their contact pose
  for a few frames, so each beat reads, rather than gliding through.
- **Hit-stop.** The attacker and target freeze on contact, with the
  starting values in M2.
- **Immediate input.** An input starts its move on the next fixed update,
  and an input pressed up to about 150 ms before the current move can be
  cancelled fires on the first frame it can.
- **Cancel windows.** Each clip has start-up, active and recovery markers,
  and a test checks that they match the move's frame data in
  `combat/moves.ts`, so the animation and the rules never disagree.
- **Crisp at one scale.** Parts are shown at a consistent scale, never
  scaled up past their packed size, with no motion blur and no smoothing
  filter that softens them.
- **Views.** As starting values: the hero is painted in 5 views (south,
  south-east, east, north-east and north), mirrored for the other three,
  and common demons in 3 (towards, side and away), mirrored and snapped to
  the nearest. A mirrored normal-ish map needs its x channel flipped in the
  shader, and anything held in one hand, like a sword, breaks the mirror,
  so the hero's weapon is its own part, moved to the correct hand.
  Creatures that move "without turning" (cherubim, ophanim) need one view.

**The animation budget.** Deepwoken-style combat needs many moves per
weapon and per enemy. As starting assumptions: each weapon needs its light
chain (three hits and a flourish), a critical, a feint and its parry and
block poses, which is about 8 clips, or about 32 across the four starter
weapons. The hero also needs about 12 shared clips (idle, run, roll, hit,
parried, guard break, struck down and casts), a common demon about 6
(idle, move, two attacks, hit, death) plus its commit poses, and bosses
are budgeted one by one. Frame-by-frame painting at that scale isn't
affordable. Puppets are: each view is painted once, and every clip after
that is keyframe data. Creatures that float or drift, such as seraphim,
ophanim and locust swarms, lean on procedural motion like bobbing, wing
beats and rotation.

### Bloom

Maximum bloom and vibrance is a requirement. Dan: "no true bloom is a very
bad problem; try your best creating the most bloom and vibrance."

Excalibur's post-processors look like a chain of single full-screen passes,
each reading the previous output. True bloom needs more: a bright pass,
a blur at reduced resolution, and an additive composite back onto the
untouched frame. Reading Excalibur 0.32's bundle suggests this can be done
inside one custom `PostProcessor`:

- `initialize()` receives the `ExcaliburGraphicsContextWebGL`, whose
  `__gl` (the `WebGL2RenderingContext`) is public, so the post-processor
  can allocate its own framebuffers and textures. Excalibur's own
  `RenderTarget` class isn't exported, so these are raw WebGL objects.
- For each post-processor, Excalibur binds the target framebuffer, uses the
  shader and layout, binds the previous output to `TEXTURE0`, calls
  `onDraw()`, then draws the full-screen quad. So inside `onDraw()` the
  bloom can run its own passes: a bright pass into a half-resolution
  buffer, a separable blur (horizontal, then vertical) at a quarter
  resolution or less, repeated at a few sizes for a wide glow.
- It then restores what Excalibur expects (the framebuffer binding, the
  viewport, the shader program, the vertex layout, the active texture unit
  and the texture on `TEXTURE0`, saved at the start), binds the blurred
  result to `TEXTURE1`, and lets Excalibur's quad draw run its own
  composite shader, which adds the bloom to the original frame from
  `TEXTURE0`, then applies the grade and a vibrance boost.

**The M1 test** is whether this works in practice: correct output, no GL
state left broken for Excalibur's next frame, the frame rate held at 60 at
full resolution, and no breakage on resize. It depends on internals that
aren't part of Excalibur's public API, so it's pinned to 0.32.x and
re-checked on any upgrade.

**The fallback**, if the test fails, is a wide single-pass blur kernel in
one `ScreenShader`, plus emissive glow layers (soft halo sprites drawn
additively behind glowing parts) and additive particles. It looks less
like true bloom, so it's a fallback only.

Either way, bloom applies only to pixels above the bloom threshold, which
the value structure keeps to light sources, actors and effects.

### Beat pulse

Decided by Dan: on 808 hits in the music, and only those, the screen gives
a subtle vibration whose size rises with the Corruption Tier (0 to 5),
plus a glow and bloom pulse. It isn't screen shake, and there's no setting
to turn it off yet, because settings come later. The details are a
proposal, and the numbers are starting values to tune:

- **Where the beats come from.** The score is generated by a script
  (M6), so the script also writes a beat map of each track's 808 hit
  times. The scene compares the music's playback position with the beat
  map every frame and fires a pulse as it passes each hit. Other drums,
  bass lines and melody never trigger it.
- **A vibration, not a shake.** The vibration is a small offset applied in
  `bloom.ts`'s final composite pass, so the image moves but the camera and
  every gameplay position stay still. `Camera.shake()` stays reserved for
  hits and parries in combat, and the two never share a code path, so a
  beat can't be mistaken for a hit. As starting values: 0.5 px at Tier 0,
  rising by 0.5 px per tier to 3 px at Tier 5 (at 1080p), decaying over
  about 100 ms.
- **Glow and bloom pulse.** On the same hit, bloom strength and emissive
  glow rise briefly, from +10% at Tier 0 to +35% at Tier 5, decaying over
  about 150 ms.
- **The same in the fallback.** If the bloom test fails, the offset and
  the glow pulse move into the single-pass shader.

### Streaming the open map

Excalibur has no streaming, so `streaming.ts` adds a region and chunk
system:

- **Regions and chunks.** `map.ts` splits Heaven into regions, and each
  region into fixed-size chunks on a grid.
- **Load and unload by distance.** Each update, the streamer measures the
  player's distance to each nearby chunk. Chunks inside the load radius
  load their images and add their layers and actors to the scene. Chunks
  beyond a larger unload radius remove them, call `ImageSource.unload()`
  and release their textures. The gap between the two radii stops chunks
  flickering at a boundary. Radii are starting values to tune.
- **Load ahead.** Chunks in the direction of travel start loading early,
  so images decode before they're needed, and only a few start per frame
  to avoid stutter.
- **State lives in the run.** Unloading never loses state. Corruption,
  killed enemies and opened gates are part of the run's data, and a chunk
  rebuilds from it when it loads again.
- **Debug view.** A key toggles an overlay that draws the chunk grid,
  colours each chunk by state (unloaded, loading, loaded, active), shows
  both radii around the player, and lists loaded chunks, actors and an
  estimate of texture memory.

### The real costs of the 2D approach

Each of these gets a measurement in M1.

- **Texture memory.** The figures here are arithmetic on assumed numbers,
  not measurements. A 2048x2048 atlas page takes 16 MB on the GPU as
  uncompressed RGBA. Suppose the hero has about 12 parts in each of 5 views,
  which fits in one or two pages of colour, plus matching normal-ish and
  emissive pages. That's about 50–100 MB for the hero, if the normal-ish
  pages are full size. Puppets keep this small compared with frame-by-frame
  animation, because every clip reuses the same parts. Normal-ish maps can
  use half resolution, and only chunks and creatures near the player are
  loaded. The target is desktop browsers, so M1 sets the budget from a
  desktop GPU's limits.
- **Depth sorting with no depth buffer.** Actors sort by their ground
  position through `z`. Anything an actor can walk behind has to be its own
  sprite with a base point, which is why chunks are painted in layers.
  Large actors, such as a wheel boss, may need more than one sort point.
- **Consistency costs generations.** Each accepted asset may take several
  generations and some masking by hand. That cost is per asset, so the
  kits stay small.
- **Two looks must agree.** The painted shading is fixed, and braziers,
  glows and corruption move. The lighting `Material` keeps runtime light
  moderate and quantised into the same three bands for every sprite. Ink
  lines are never lit.

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
- `onDeactivate()` also removes post-processors and frees the bloom's
  framebuffers, stops music and timers, stops the streamer and unloads
  every loaded chunk.
- NPCs implement `DialogueNPC` and talk through `ChatSystem`, and quests use
  `QuestSystem`, all unchanged.

### Deploy

Every milestone is published to GitHub Pages so it can be played at
`https://thoughtpivot.github.io/terrene/#heavenorhell`. The repository's
Pages site is a legacy build served from the root of the `gh-pages` branch,
which already exists.

- `npm run build:prod` writes the game to `dist/`.
- The `gh-pages` package, already a dev dependency, publishes `dist/` to
  the `gh-pages` branch. A `deploy` script in `package.json` wraps the two
  steps, as a proposal.
- Publishing replaces the whole Terrene site, not only Heaven Or Hell, so
  it's done from the integrated branch, after checking that the other
  scenes still load.
- The site is served under `/terrene/`, so every asset path must be
  relative. The check is to load the published URL, not only the dev
  server.

### Workstreams

Development is split into parallel workstreams on separate branches, then
integrated:

- **M1, the scene and rendering** (`cursor/heaven-or-hell-m1-ca84`): the
  route, screen mode, art pipeline, lighting, bloom test, puppet system and
  streaming.
- **The combat rules engine** (`cursor/heaven-or-hell-combat-ca84`): pure
  code under `src/components/scenes/HeavenOrHell/combat/`, with no
  Excalibur imports. It covers moves and frame data, posture, parry, block,
  roll, the input buffer, cancel windows, feints and enemy reads.
- **The progression systems** (`cursor/heaven-or-hell-progression-ca84`):
  pure code under `src/components/scenes/HeavenOrHell/progression/`, with no
  Excalibur imports. It covers Choirs and attributes, Gifts, Vows,
  Anointings, Trumpets, Stain, Visions, Testimony, Remembrance and
  corruption tiers.
- **Integration** merges the two pure branches into the scene, wires input
  and puppets to the combat engine, and wires the HUD and save to
  progression.

To keep the branches from colliding, each pure module owns its folder and
its own test file, and the boundary is plain data: combat takes a
`CombatStats` object and emits events (hit, parried, struck down), and
progression produces `CombatStats` from a character and consumes those
events. Those types are agreed first, so every branch can build against
them.

### Code layout

This follows the Street split, where the rules are pure and the scene is
thin, and the Oka World pipeline, where art is generated from `tools/`:

```
src/components/scenes/HeavenOrHell/
├── HeavenOrHell.ts     # Scene: load, camera, streaming, loop, cleanup
├── combat/             # Pure, no Excalibur (combat workstream)
│   ├── moves.ts        # Moves and frame data: start-up, active, recovery
│   ├── rules.ts        # Posture, parry, block, roll, hit-stop, lives
│   ├── buffer.ts       # Input buffer (about 150 ms) and cancel windows
│   ├── reads.ts        # Enemy read traits, commitments, feint baiting
│   └── types.ts        # CombatStats and combat events, the boundary
├── progression/        # Pure, no Excalibur (progression workstream)
│   ├── character.ts    # Creation, Choirs, attributes, Boons, Burdens
│   ├── gifts.ts        # Gifts, Vows, Anointings, Trumpets, Visions
│   ├── stain.ts        # Stain, its thresholds and the Fall
│   ├── corruption.ts   # Corruption level, tiers, unlocks and spawns
│   ├── testimony.ts    # What survives a wipe: Testimony, Remembrance
│   ├── tuning.ts       # Tuning constants: corruption pace, fall chance
│   └── types.ts        # Character data and CombatStats, the boundary
├── map.ts              # Regions, chunks, paths, landmarks (pure)
├── invasion.ts         # Seeded breaches, spread, camps, events (pure)
├── palette.ts          # Region bases, corruption blend, bands (pure)
├── puppet/
│   ├── rig.ts          # Part tree, clips, easing, springs (pure)
│   └── view.ts         # Applies poses to part sprites
├── streaming.ts        # Loads and unloads chunks by distance
├── streaming-debug.ts  # Chunk grid, states, radii and memory overlay
├── save.ts             # Continuous run save in localStorage
├── input.ts            # Mouse aim, clicks, F, hold F, Q, R, WASD
├── lit.ts              # Lighting Material: bands, rim, tint, outline
├── bloom.ts            # Multi-pass bloom and grade PostProcessor
├── beat.ts             # 808 beat map: tier-scaled vibration, glow pulse
├── darkness.ts         # Dark overlay and light holes, after HollowDark
├── fx.ts               # Hit sparks, embers, corruption particles
├── hud.ts              # Health and halo, posture, Fervour, Grace
├── art/atlas.ts        # Generated by tools/heaven-or-hell/pack.ts
└── sfx/, HeavenOrHell.mp3
src/components/characters/player/<Hero>/  # one folder per character
src/components/creatures/<Creature>/      # demons and angels alike
tools/heaven-or-hell/   # Node and TypeScript only, no Python
├── source/             # reference images and kept source paintings
├── prompts.md          # style block and every prompt, per asset
├── key.ts              # keys out the flat background, trims, despills
├── parts.ts            # cuts puppet parts and records pivots
├── maps.ts             # normal-ish and emissive maps from paintings
├── pack.ts             # scales, packs atlases, writes atlas.ts
└── references.md       # one line per reference: what to take from it
test/heaven-or-hell-combat.ts
test/heaven-or-hell-progression.ts
test/heaven-or-hell-world.ts
docs/heaven-or-hell.md  # player-facing doc, written when M1 ships
```

### Testing

- `combat/`, `progression/`, `map.ts`, `invasion.ts`, `palette.ts` and
  `puppet/rig.ts` import nothing from Excalibur, so `node:test` covers the
  parry window, posture overflow, roll
  i-frames, input buffering, feint baits and adaptive memory, the two-lives
  state, seeded invasions, corruption tiers, Choir bonuses, Stain
  thresholds and the Fall, what survives a wipe and the palette's value
  limits, all deterministically. Enemy reads use the run's seeded random
  numbers, so a bait test always plays out the same way. Each workstream
  owns its test file, so the branches don't collide.
- A test checks that every puppet clip's start-up, active and recovery
  markers match the move's frame data in `combat/moves.ts`, and that the
  rig solver gives the same pose for the same time.
- **Fix this first:** `node --test test/street-rules.ts` fails today with
  `ERR_MODULE_NOT_FOUND` because `Street/level.ts` imports `./rules` without
  an extension, and Node 22's type stripping needs one. The fix is to use
  `.ts` import specifiers (with `allowImportingTsExtensions` in tsconfig) or
  to add a TypeScript runner such as `tsx`. Then wire `test/*.ts` into
  `npm test`, which today points at a `test/test.js` that doesn't exist.
- A check in `pack.ts` fails the build if an atlas page is larger than the
  agreed maximum, the total texture budget is exceeded, or a sprite would be
  scaled up past its source.
- Each milestone also ends with a manual run in the browser at
  `/#heavenorhell`, on the dev server and on the published GitHub Pages
  URL: a screen recording, a clean console and a frame-rate reading.

## Milestones

### M0: References and decisions (Dan, before any code)

- Gather 4–5 more visual references, as the meeting asked. Sources: Google
  Images and specific itch.io profile pages. They should be stylised,
  toon-shaded art under a fixed angled camera, darker than Death's Door,
  and include some depictions of seraphim, cherubim and ophanim. They also
  serve as reference images for the AI-generated paintings, so prefer ones
  close to the fixed camera angle.
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
  makes the art (AI-generated source paintings, no Blender and no other
  engine), the animation approach, bloom as a requirement, streaming, the
  deploy target, the workstreams, the controls and the platform are
  settled. The Deepwoken wiki is linked, but the combat blog articles aren't
  collected yet, and `references.md` doesn't exist yet.
- **Done when** there are at least 5 tagged references. The open decisions
  each block a later milestone, not M0.

### M1: One lit, painted area

Built on `cursor/heaven-or-hell-m1-ca84`, in parallel with the combat and
progression workstreams (see [Workstreams](#workstreams)).

- **Lock the camera and the style sheet first.** Generate a few test
  pieces (a stone block, a pillar, a floor tile and a standing figure) at
  the orthographic, 45–50 degree default and compare them with Death's
  Door's Steam screenshots: the pitch, the diagonal, and whether vertical
  edges converge. Write the angle and the shared style block into
  `prompts.md` before any real asset.
- **The art pipeline end to end:** `key.ts`, `parts.ts`, `maps.ts` and
  `pack.ts`, producing colour, normal-ish and emissive atlases and
  `art/atlas.ts`, with every prompt recorded.
- The `#heavenorhell` route in its high-resolution mode, restoring the screen
  settings on leaving.
- One chunk of Heaven from painted kit pieces at the fixed angle, split into
  ground, tall-piece and front layers, in the default bone-grey base. The 2D
  packs in `src/assets/` don't fit this look.
- **The hero as a puppet,** painted as separate parts in its 5 views, with
  idle and run clips using easing and secondary motion on the wings and
  halo, walking in 8 directions, at a consistent scale with no blur.
  Sorted against pillars and walls by `z`.
- **The lighting `Material`:** normal-ish light in three bands, a rim
  light, region tint, the ink outline, a gold outline on the hero, altars
  glowing white and gold, and a breach glowing red. Near-black fog and one
  drifting parallax layer.
- **The bloom test** in `bloom.ts`, as described in [Bloom](#bloom): a
  multi-pass bloom inside one custom `PostProcessor`, with GL state
  restored. If it fails, build the fallback and record why.
- **A streaming prototype:** a small grid of chunks (some can repeat the
  same kit) loaded and unloaded by distance as the hero walks, with the
  debug view.
- One `ChatSystem` line from a placeholder `DialogueNPC`.
- **Done when**
  - a screenshot reads as "near-black monochrome Heaven, white against red"
    next to the M0 references, and the painted pieces read as one style at
    one angle;
  - the bloom test's result is written down: multi-pass bloom works with
    no broken GL state, or the fallback is in place with the reason;
  - the frame rate holds at 60 at full resolution with bloom on;
  - the hero's idle and run read as crisp, with no blurring;
  - walking across the chunk grid loads and unloads chunks with no visible
    stutter, and the debug view shows it;
  - the measured texture memory for the hero and the chunk is written down,
    with a projection for the full roster;
  - the camera angle and lens are checked against the screenshots and
    written down;
  - switching to another hash restores the screen settings;
  - the build is published to GitHub Pages and playable at
    `https://thoughtpivot.github.io/terrene/#heavenorhell`.

### M2: The combat core

The rules are built on `cursor/heaven-or-hell-combat-ca84` as pure code in
`combat/`, starting alongside M1. M2 finishes with the first integration:
the combat engine merged into the M1 scene, driving the hero's puppet.

- **The basic sword is the first weapon** (see
  [Weapons](./heaven-or-hell-progression.md#13-weapons) in the progression
  doc). It's a Plain medium weapon with three even hits and a flourish, a
  wind-up of about 0.35 seconds and the standard parry window. It's the
  baseline every other weapon is tuned against. Its critical, *Rising Cut*,
  comes in M3. The Flaming Sword is a later progression weapon.
- `combat/rules.ts` covers the light attack chain with its flourish, block
  and posture, parry with its cooldown, and roll with i-frames, using the
  frame data in `combat/moves.ts` and the buffer in `combat/buffer.ts`.
- The sword's puppet clips: three hits and a flourish, block, parry and
  roll, with held key poses and squash and stretch on contact.
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
    freeze lives in `combat/rules.ts`, so it's tested. `Engine.timescale` is
    used only for the parry, if a whole-screen pause feels better.
  - *Camera shake:* translation only, through `Camera.shake()`, never
    rotation. Start at 2 px for 80 ms on a hit, 4 px for 120 ms on a parry
    and 6 px for 200 ms on a guard break, at 1080p. Camera shake is
    reserved for these combat moments. The music's
    [beat pulse](#beat-pulse) is a separate effect.
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
- **Done when** unit tests cover every timing rule and buffer, in manual
  play a clean parry, a guard break and a dodge through an attack each work
  and feel distinct, and the integrated build is published to GitHub Pages.

### M3: Depth of combat

Feints, reads and criticals continue on the combat branch, and Choirs and
attributes are built on `cursor/heaven-or-hell-progression-ca84` as pure
code in `progression/`. M3 integrates both into the scene, through the
`CombatStats` boundary.

- Critical attacks on R, starting with the basic sword's *Rising Cut*, an
  upward cut that deals 1.5 times a light hit's posture damage on a
  6-second cooldown. R is the only critical input, and criticals can't be
  feinted.
- Feints on right-click, always, and Fervour and Outcry (Deepwoken's Tempo
  and Vent).
- **Feints that fool the AI.** `combat/reads.ts` implements the model in
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
    poses reuse the first keys of each enemy's parry, block and roll
    clips, so the animation budget doesn't grow.
- Two more demon types: a ranged one with telegraphed area attacks, and a
  heavy one with hyperarmor.
- One corrupted angel as an elite. A corrupted seraph is the cheapest,
  because it needs no new movement rules.
- **The character creation screen**, after the combat core and before the
  run: customising your angel and freely choosing one of the eight
  Choirs, each with +3 and +2 to two attributes, a signature passive, two
  innate Gifts and a flaw. Then a starter weapon: the sword, spear or knife.
  The full creation flow (Tongues, weapon, Boons and Burdens,
  Origin, appearance, difficulty) can follow in M4 and M5, as the systems behind it
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
  spammed, a character made with each Choir starts with that Choir's
  bonuses and Gifts, and the integrated build is published to GitHub Pages.

### M4: The run

Corruption, Testimony and Remembrance come from the progression branch, and
M4 is mostly integration work on the scene: the full map, streaming at
scale and the save.

- `map.ts` describes Heaven's fixed regions, built from chunks, and
  `streaming.ts` loads and unloads them by distance as the hero moves,
  grown from the M1 prototype to the full map, with the debug view (see
  [Streaming the open map](#streaming-the-open-map)).
- `invasion.ts` seeds each run's breaches, local corruption spread, demon
  camps and events. An open breach pulls its region up to a tier ahead of
  the world. Sealing it slows the local spread and keeps the region a tier
  behind, protecting its altar, merchants and rewards.
- `progression/corruption.ts` runs the run's clock: World Corruption rises
  with time at a steady, designed rate, crossing tiers, and nothing lowers
  it. The pace comes from the run's difficulty: one tier every 40, 60, 80
  or 100 minutes of play. Each is a tuning constant, `minutesPerTier` on
  the difficulty's entry in `DIFFICULTIES` in `progression/tuning.ts`, and
  Son of the Morning keeps the original 100-minute pace.
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
- **Roaming allies and Fallen Angels.** Bands of Host angels roam the map
  and fight beside the player. They die easily, and a dead or overwhelmed
  ally can fall into a Fallen Angel, the common enemy tier, through a quick
  fall animation that never pauses play (see
  [Fallen Angels](#fallen-angels-the-common-tier)). The fall chance by tier
  lives in `progression/tuning.ts` with the other tuning constants.
- **Done when** a run can be played from character creation through at
  least three corruption tiers, being struck down and cast out behave as
  designed, two seeds produce different invasions on the same map, closing
  and reopening the tab resumes the run without undoing a life lost,
  Testimony and Remembrance survive a wipe, crossing the map streams with
  no visible stutter, and the build is published to GitHub Pages.

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
  noticeably differently, a run pushed to 100 Stain ends in the Fall
  while keeping Testimony and Remembrance, and the build is published to
  GitHub Pages.

### M6: Polish and release

- An original score and sound effects, built by a TypeScript script in
  `tools/heaven-or-hell/`, taking its approach from
  `tools/oka-world/compose_music.py`. The script also writes each track's
  808 beat map, and the [beat pulse](#beat-pulse) is built on it.
- The title and chapter cards, `docs/heaven-or-hell.md`, and a README entry.
- The image generator's terms checked for use in a published game.
- **Done when** the GitHub Pages build serves `/#heavenorhell` at
  `https://thoughtpivot.github.io/terrene/#heavenorhell` and the console
  has no errors on a fresh `localStorage`.

## Risks

- **Fidelity of 2D against real 3D.** Painted sprites lit by normal-ish
  maps can't match real 3D lighting or turning, and may look flatter than
  the references. Let the painting carry the form, keep runtime light
  moderate, design silhouettes first, and let toon bands, ink lines and
  bloom carry the look. Judge it on M1 screenshots next to the references.
- **Consistency across generated images.** Generators drift in style, line
  weight and light direction between outputs, and a character's design
  drifts between its views. Use the shared style block in `prompts.md`,
  reference images, the M1 style sheet and the runtime shaders to pull
  assets together, and budget several generations per kept asset.
- **Camera-angle drift.** A painting a few degrees off the fixed angle
  stands out next to its neighbours, and there's no way to re-render it.
  Check every asset against the style sheet before it's packed, reject
  off-angle results, and lock the angle in M1 before any real asset.
- **Large creatures.** Behemoth, Leviathan, the beast and the dragon must be
  generated in parts that join without seams and agree on angle, scale and
  light, which is where generated art is weakest. Their atlases are also
  large, and several can be on the map at higher tiers. Budget and judge
  each boss on its own, and load them only near the player.
- **The bloom test fails, or breaks GL state.** The multi-pass bloom uses
  raw WebGL inside an Excalibur `PostProcessor` and relies on internals
  outside the public API. If it leaves any state wrong, Excalibur's next
  draw breaks in ways that are hard to trace. Save and restore every piece
  of state it touches, test resize and scene switches, and keep the
  single-pass fallback ready. If only the fallback works, the bloom is
  weaker than Dan wants, and he should hear that from the M1 result.
- **Puppet animation cost and feel.** The puppet system is new code, and
  cutout motion can look stiff if the clips lack overlap, holds and squash.
  The combat needs many clips (see
  [Puppet animation](#puppet-animation)). Build the secondary motion and
  hit-stop into the system so every clip gets them, and judge crispness in
  M1 and M2 recordings.
- **Lighting rotated parts.** A puppet part's normal-ish map rotates with
  the part, so one `Material` per actor may light rotated parts wrongly.
  Check it in M1, and fall back to a child actor per part if needed.
- **Texture memory.** Painted parts in several views with three maps each
  add up (see
  [The real costs of the 2D approach](#the-real-costs-of-the-2d-approach)).
  Measure the hero in M1, set a budget per creature, and enforce it in
  `pack.ts`.
- **Depth sorting** with tall pieces and big creatures, such as a wheel
  boss, is a common source of visual bugs. Settle the layer split in M1,
  before combat depends on it.
- **Streaming a large map.** Excalibur has no built-in streaming, so
  `streaming.ts` loads, adds, removes and unloads chunks itself. Loading
  images while the hero runs can stutter, and textures that aren't released
  leak memory, so chunks load ahead in the direction of travel, unload with
  a gap between radii, and the debug view shows what's loaded. The map's
  size (open decision 1) decides how hard this is.
- **Publishing to GitHub Pages.** Each publish replaces the whole Terrene
  site on `gh-pages`, and the site lives under `/terrene/`, so a bad build
  or an absolute asset path breaks every scene there. Publish only from the
  integrated branch, and load the published URL after each publish.
- **Integration merges.** Three branches moving in parallel can drift
  apart. Agree the `CombatStats` and event types first, keep each pure
  module in its own folder with its own tests, and integrate at the end of
  each milestone rather than once at the end.
- **Saving a long run.** A long permadeath run has to survive a closed tab
  or a crash without letting a player undo being struck down by reloading.
  The save has to be continuous and small, and `localStorage` has a size
  limit, so the save stores the seed and the changes, not the whole map.
- **Corruption balance.** Corruption rises at its own rate with no cap on
  the player, so if it rises faster than a player can grow, long runs
  become hopeless, and if slower, they lose tension. Tune the rate against
  the Ascension pace for each tier in play in M4, on every difficulty, and
  keep the per-difficulty rates and the scaling tables as data in
  `progression/tuning.ts` so they can be tested and changed.
- **Feint AI that feels unfair or exploitable.** Gullible enemies can make
  feints feel like a cheat, and adaptive ones can feel like they read your
  mind. Every commitment needs a visible tell, adaptive memory must fade,
  and M3's manual play should check both ends. Keep the trait numbers as
  data in `combat/reads.ts`.
- **Bloom cost.** Several blur passes every frame can drop the frame rate
  on low-end GPUs. The blur passes run at reduced resolution, as
  `HollowDark` paints its lighting at 480x270, and the number of blur sizes
  can drop on slower GPUs.
- **White and red readability.** White allies, the gold hero and white
  altars can blur together, and red corruption can hide red danger. Check
  each in M1 and M3 screenshots. Fallen Angels add another case: an ally
  that turns red mid-fight must read as an enemy at once.
- **Beat pulse with no off switch.** Until settings exist, the 808
  vibration can't be turned off, which can bother players sensitive to
  motion, and at Tier 5 it competes with combat shake. Keep it small,
  keep it in the composite pass rather than the camera, and add a setting
  when settings arrive.
- **Allies that die too easily.** If allies fall too often, every band of
  angels becomes a band of Fallen Angels and the map tilts toward Hell
  faster than the corruption pace intends. Tune ally HP and the fall
  chance by tier in M4 play, and keep both in `progression/tuning.ts`.
- **Combat feel** is hard to judge from tests alone. Each combat milestone
  needs a manual play session and a recording, not only green tests.
- **Engine pin.** Every API used must exist in ExcaliburJS 0.32.x, and the
  bloom's reliance on Excalibur's post-processor internals must be
  re-checked on any upgrade.
