# Heaven Or Hell: Character Creation and Progression

## Overview

This is a proposal for Dan, not a set of decisions. It covers character creation and every progression system in Heaven Or Hell. It keeps the structure of Deepwoken's systems, as documented on the Deepwoken wiki, and changes only the flavour, to angels and Heaven. Where it departs from how Deepwoken works, the text says so.

It's the companion to [heaven-or-hell-plan.md](./heaven-or-hell-plan.md), which holds the decisions, the world and run structure, the technical approach and the milestones. Where the two docs touch, this one has the detail and the plan has a summary.

**How it fits the plan's death rules.** The plan proposes Deepwoken's two lives: your first time struck down dims your halo (Deepwoken's stained health), and the second casts you out and wipes the run. That's separate from personal **Stain** (section 10), which is corruption you choose to take on for power. A dimmed halo is about lives. A cracked halo, at 25 Stain, is about corruption. The two can happen together, and neither causes the other.

## Research notes: Deepwoken facts this design is built on

- **Character creation** runs in this order: Aspect, Attunements (up to two, or None for 10 free points), weapon class, Boons and Flaws (at least one and at most two of each), Origin, Appearance, and then the Echo Shop and Modifiers.
- **Aspects** are rolled at random and cost money to reroll. Each gives +3 to one attribute and +2 to another, plus small innate Talent cards. Their in-game "variants" mostly change colour, and a few rare variants are only given out by the developers. Most downsides come from the Flaws you pick, not from the Aspect itself.
- **Attributes and Power:**
  - There are six core attributes, split into Body (Strength, Fortitude, Agility) and Mind (Intelligence, Willpower, Charisma).
  - There are three weapon attributes (Heavy, Medium, Light) and the Attunement attributes.
  - Each attribute has a soft cap of 75 and a hard cap of 100, which you reach through an "Unbound" quest.
  - Each Power level gives 15 points, up to Power 20, for 330 points in total (15 at creation, 5 from the Aspect, 10 from the Attunement).
  - Intelligence gives 2 Ether per point and Charisma gives 1.5. Willpower raises Sanity and Tempo.
- **Mantras:**
  - You get them from Whisper Draws on certain Power-ups. There is always a "Roll 2" card that gives two Talents instead of a Mantra.
  - Equip slots are 3 Combat, 1 Support, 1 Mobility and 1 Wildcard. Mantras have levels 1 to 5, unlocked at 20, 40, 60 and 80 points of investment.
  - Modifier stones trade one stat for another (size for speed, range for size, and so on). "Sparks" change how a Mantra behaves. Every modifier except Sparks raises the Ether cost.
  - Some support Mantras use "Ritual Casting", a short sequence of key presses.
- **Ether** regenerates during combat only while you have **Tempo**. With 40 or more Tempo, G performs a **Vent**.
- **Oaths:**
  - You can hold one at a time. They don't take up Talent slots.
  - They are unlocked by stat requirements or quests.
  - They are broken at Yun'Shul, often permanently.
  - Oath Mantras never level up.
  - A fully progressed Oath can be skipped on later characters for 10 Knowledge.
- **Talents:**
  - They come in hands of 4 to 5 cards, pick one. Rarities are Common, Rare and Advanced, with about two Rares per Power-up.
  - Some hands include a "Fold" card that saves the hand for later. **Aces** let you ban a card, guarantee one, or keep one.
  - Oath, Quest and Origin Talents are free. Some Talents are mutually exclusive.
- **Enchantments:**
  - Enchant Stones go on weapons and Grease goes on armour. Equipping an enchanted item soulbinds it, and you can't stack the same enchantment twice.
  - They come in two kinds: **Blessings** (no real downside) and **Curses** (an upside plus a matching downside).
- **Deep Shrines** cost **Knowledge**, a currency tied to one character that is lost on wipe:
  - **Order**: averages your stats. Costs 10, can be used once, needs Power 8 or higher and no Oath, and can't take more than 25 points from a core or weapon stat.
  - **Mastery**: costs 1 to refund an attribute point (three at most) or to move a Trait point.
  - **Blasphemy**: three instant Power-ups plus a Flaw.
  - **Division**, **Unification** and **Chance** also exist.
- **Resonance (the "Bell"):**
  - It is pressed with C.
  - You build up a hidden "Progress" stat from bosses, the Depths or PvP. If you die in the Depths with full Progress, you get "divine intervention": a full heal and a hand of three cards.
  - Rarities are Normal, Corrupted (stronger with one downside such as Wither or Mania), Legendary, and Drowned (corrupted Legendary).
  - Rerolling gives the "Tarnished" Flaw.
- **Echoes:**
  - They are earned on wipe from one-time "Triumphs".
  - They buy small capped upgrades (for example, mob damage +2% per step, up to 8%) and unlocks such as starter weapons.
  - Optional difficulty "Modifiers" increase how many Echoes you earn.
  - Learned Attunements and fighting styles stay unlocked for the whole account.
- **Origins** set where you spawn, your allegiance and your progression bonus. You start with one and unlock the others.
- **Murmurs:** you can have one, and the three are named after music terms (Ardour, Tacet, Rhythm).
- **Combat controls:**
  - Right-click (M2) during a wind-up is a feint. M2 also cancels Mantras and rolls.
  - The critical is R or the middle mouse button (M3), and most criticals can't be feinted.
  - Holding F blocks and builds posture. When posture overflows, the next blocked hit causes a guard break.
  - The M1 chain is usually three hits followed by a flourish.

---

## 1. Character creation flow

**Lore reason for the player being a lesser angel (proposal).** In the War in Heaven, the dragon's tail "drew the third part of the stars of heaven" (Revelation 12:4, 7–9). Heaven refilled the gaps in its choirs with lesser angels, kindled from the light of the choirs that stayed loyal. They are called **the Tenth**, after Isaiah 6:13: "yet in it shall be a tenth, and it shall return." You are one of them. You carry an *echo* of a higher choir, not its full rank, which is why no player is ever a true Seraph or Cherub. "It shall return" also explains the wipe: when Heaven resets, the Tenth is kindled again.

The steps follow Deepwoken's order:

1. **Choir (the Aspect).** Choose one of 8 echo-lineages. Each gives +3 and +2 to two attributes, plus innate Gifts (Talents) and a quirk. Deepwoken rolls Aspects at random, so how this works here is an open question for Dan.
2. **Tongues (the Attunements).** Choose up to 2 of the 4 base Tongues, or none for **Wordless**, which gives 10 free points like Deepwoken's Attunement-less option.
3. **Arms (weapon class).** Choose a starting weapon. Locked weapons open up through Testimony (section 11).
4. **Boons and Burdens (Boons and Flaws).** Pick at least one and at most two of each. Boons keep Deepwoken's name, because "Grace" means only the Ether equivalent (section 4).
   - Example Boons: *Tireless Wing* (more glide stamina), *Psalmist* (an extra Feather, the Ace equivalent, on every other Hymn Draw), *Unseen* (better stealth).
   - Example Burdens: *Clipped* (no air dash), *Doubting* (more Sanctity damage, like Manic), *Tarnished Halo* (enemies spot you more easily, like Obvious), *Unlettered* (slower experience and fewer Visions; counts as 2 points, like Simple).
5. **Origin ("where you were made").** This sets your spawn point, starting gear, allegiance and progression bonus. Example Origins:
   - **The Outer Courts** (the default, like Castaway). Basic gear and the most common starting zone.
   - **The Lone Vigil** (like Lone Warrior). You spawn inside a trial. Clearing it grants *Mark of the Vigil*.
   - **Breach-Warden** (like Deepbound). You gain more experience inside Hell breaches and less outside them, and start with a recall item.
   - **Host of the Gate** (like Authority Ensign). You join the Cherubim's guard at the Gate of Eden, with ranks, divisions and ally angels. The cost is that leaving your post too long gets you branded a deserter.
   - **Scribe of Names** (like Ignition Delver). You progress through the archive's commissions and boards.
   - **The Penitent** (like Voidwalker). You hunt marked corrupted angels for bounties.
   - Every Origin except the Outer Courts is unlocked through Testimony or triumphs.
6. **Appearance**, following Deepwoken's Body, Face and Aspect Features sections:
   - **Wings:** count from 2 to 6, shown as folded or clipped, with feather, ember or glass texture.
   - **Halo:** ring, broken ring, thorned, wheel or crown shape, in white, gold or silver light.
   - **Eyes:** pupil-less glow or veiled. Optional extra eyes on the wings for the Ophan line.
   - **Robes:** linen (after "the man clothed with linen" in Ezekiel 10:2), sash, cowl.
   - **Marks:** small sigils specific to each Choir.
   - **Style note:** the body stays near-monochrome; only the halo, eyes and wing edges glow white and gold.
7. **Testimony Shop and Penances.** Spend meta currency and turn on difficulty Penances (section 11). Then the angel "kindles" into the world.

**Starting attributes:** 15 free points plus the Choir's +5 (or +10 more free points if you chose Wordless). This matches Deepwoken.

## 2. Choirs (the Aspects)

The numbers mirror Deepwoken (+3 and +2). The quirk flaws are a small departure from Deepwoken, whose Aspects rarely have built-in downsides, so they stay light, and Boons and Burdens remain the main source of trade-offs.

**Kindled (an echo of the Seraphim, Isaiah 6)**
- **Flavour:** born of the altar's overflow; they sing without stopping.
- **Look:** four small wings (the true seraph has six, Isaiah 6:2), coal-white eyes, ember flecks across a black robe.
- **Stats:** Faith +3, Voice +2.
- **Passive, Live Coal:** your first parry after resting purges one ailment from you.
- **Flaw, Burning Bright:** Hell enemies notice you from 20% farther away.

**Four-Faced (an echo of the Cherubim, Ezekiel 1 and 10)**
- **Flavour:** guardians of thresholds.
- **Look:** a mask with four faces (man, lion, ox, eagle; Ezekiel 1:10) that turns between them, and "burnished brass" hoof-greaves (Ezekiel 1:7).
- **Stats:** Might +3, Steadfast +2.
- **Passive, Turning Face:** at each rest, set your face. Lion gives flourish posture, Ox gives block posture, Eagle gives an air dash, and Man gives Voice dialogue checks.
- **Flaw, Turned Not:** you climb and turn more slowly ("they turned not when they went," Ezekiel 1:9).

**Wheelborn (an echo of the Ophanim or Thrones, Ezekiel 1:15–21)**
- **Flavour:** small wheel-spirits that guard the throne.
- **Look:** a halo that is a beryl-glowing ring set with eyes (Ezekiel 1:16–18), with a slow ring orbiting the body.
- **Stats:** Wisdom +3, Swiftness +2.
- **Passive, Full of Eyes:** enemy ambushes and stealthed enemies within close range get outlined, and bestiary progress builds 25% faster.
- **Flaw, Seeing Too Much:** you lose more Sanctity from horror sights and Hell auras.

**Lordling (an echo of the Dominions)**
- **Flavour:** traditionally they "govern the movement of stars."
- **Look:** a star-map pattern on a black mantle and a crown-shaped halo.
- **Stats:** Wisdom +3, Voice +2.
- **Passive, Star-Reckoner:** discovered landmarks show their distance on the compass, and the night sky reveals the nearest Shrine of the Throne.
- **Flaw, Aloof:** ally angels charge more for their services, unless you pass a Voice check.

**Virtuant (an echo of the Virtues)**
- **Flavour:** the choir traditionally said to govern the elements and storms.
- **Look:** wings made of stormcloud, with lightning veins running gold through them.
- **Stats:** Faith +3, Swiftness +2.
- **Passive, Elemental Ease:** +1 Tongue point, and Tongue trainers (Cantors) charge less.
- **Flaw, Lightning Rod:** you build up statuses inflicted by enemy Tongues 15% faster.

**Bindborn (an echo of the Powers)**
- **Flavour:** the Powers traditionally "have power over evil forces" and restrain them.
- **Look:** chains of light wrapped around the forearms, and a ring-shaped halo with a gap in it.
- **Stats:** Might +3, Faith +2.
- **Passive, Restraint:** you deal +10% posture damage to demons, but not to corrupted angels.
- **Flaw, Marked Jailer:** demons target you first in mixed fights.

**Banneret (an echo of the Principalities)**
- **Flavour:** traditionally guardians of peoples and groups.
- **Look:** a banner-cloth hanging from the wings and a lantern-shaped halo.
- **Stats:** Voice +3, Steadfast +2.
- **Passive, Rally:** nearby ally angel NPCs gain posture regeneration and follow you for longer.
- **Flaw, Of the Host:** your Sanctity regenerates more slowly when no ally is within range.

**Watcher-kin (an echo of the Guardian Angels)**
- **Flavour:** the Christian angelology page notes that "the watchers were of this class."
- **Look:** grey-white wings, a veil, and a dim halo that flickers.
- **Stats:** Steadfast +3, Wisdom +2.
- **Passive, Keeper:** allies you revive come back with more HP, and you are harder to grip (finish off) while knocked down.
- **Flaw, the Old Fall:** this lineage has fallen before, so you gain 25% more personal corruption (Stain), but your Fallen Gifts are also slightly stronger. This is a deliberate hook into the risk-and-reward system.

**Rare variants (proposal).** Each Choir has common recolours: gold, white or silver light. Each also has one rare variant, rolled at about 2–3% or unlocked through Testimony. A variant keeps the same stats and swaps the passive for a sidegrade.
- *Ashen Kindled:* soot-black wings and white embers. Live Coal also briefly silences the attacker.
- *Sapphire Wheelborn:* blue-white rings (after the sapphire throne in Ezekiel 1:26). Shows the cooldowns of hostile casters.
- *Brass-Shod Four-Faced:* immune to knockdown, but has no Eagle face.
- *Seventh Watcher:* starts with 10 Stain, and Fallen Gifts can appear from Corruption Tier 1.

Deepwoken's variants are mostly cosmetic, so attaching a mechanical change here goes beyond what Deepwoken does. That needs Dan's approval.

## 3. Attributes

- **Form**, the Body category. Your Form value is your highest Form attribute.
  - **Might** (Strength): penetration, carry load, heavy-weapon requirements.
  - **Steadfast** (Fortitude): HP, posture-related requirements, resisting Hell's poisons.
  - **Swiftness** (Agility): parkour, roll distance, stealth.
- **Spirit**, the Mind category. Your Spirit value is your highest Spirit attribute.
  - **Wisdom** (Intelligence): +2 **Grace** (the Ether equivalent) per point, potions and incense, lore checks.
  - **Faith** (Willpower): **Sanctity** (Sanity) and **Fervour** (Tempo). Hell exposure drains Sanctity.
  - **Voice** (Charisma): +1.5 Grace per point, dialogue, and ally angel morale. You train it by singing to an audience instead of playing an instrument.
- **Arms** (the weapon attributes):
  - **Heavy Arms**, "of Judgement": greatswords, censers.
  - **Medium Arms**, "of the Host": swords, spears.
  - **Light Arms**, "of the Herald": daggers, gauntlets, bows.
- **Tongues** (the Attunement attributes): one per school in section 4.
- **Kept from Deepwoken:** the soft cap of 75; the hard cap of 100 through **Unsealing** quests (Deepwoken's Unbound); 15 points per **Ascension** (Power) up to 20, for 330 points in total; and training gear such as Prayer Beads, renamed *Psalter* (Faith) and *Wing-Weights* (Swiftness).

## 4. Tongues (the Attunements) and Hymns (the Mantras)

**Grace (the Ether equivalent)** is the visible "glory" that blooms around the angel (Isaiah 6:3, "the whole earth is full of his glory"). It comes from Wisdom, Voice and gear. In combat it regenerates only while you have Fervour (Tempo), and it regenerates faster out of combat, both as in Deepwoken. A Vent is called an **Outcry**: press G with 40 or more Fervour.

**Hymns (the Mantras)** match the Deepwoken originals in structure:
- Slots: 3 Combat, 1 Support, 1 Mobility and 1 Wildcard.
- Hymns come from **Hymn Draws** on certain Ascensions, and each draw always includes a *Two Lesser Gifts* card (Roll 2).
- Levels 1 to 5 at 20, 40, 60 and 80 points, upgraded at **Cantors** (trainers).
- Pressing the feint input during a cast cancels the Hymn without refunding its Grace.
- Support Hymns use **Liturgy** casting, a short key sequence like Deepwoken's Ritual Casting.

**Altar Coals (the modifiers)** are applied at a **Lectern of Psalms**. Every Coal raises the Grace cost; Seals do not.
- *Ember:* larger size, slower speed.
- *Beryl Lens:* longer range, smaller size (Ezekiel 1:16).
- *Amber:* longer duration, shorter range (Ezekiel 1:4).
- *Brass Filing:* faster speed, shorter duration (Ezekiel 1:7).
- *Sapphire:* bigger area of effect, shorter duration (Ezekiel 1:26).
- **Seals** are the equivalent of Sparks and change a Hymn's behaviour: *Seal of Pursuit* (it chases the target), *Seal of Bursting* (it detonates), *Seal of the Wheel* (it orbits you).

**The six Tongues.** The first four can be chosen at creation. The last two are quest-unlocked and then stay unlocked for the account, mirroring Shadowcast and Bloodrend.

1. **Seraph-Fire** (like Flamecharm)
   - Status: **Sear** (burning).
   - Hymns: *Coal from the Altar* (a thrown coal, 1★), *Tongs of the Seraph* (a grab that brands the target, 2★), *Burning Throne* (a pillar of fire for area denial, 3★).
   - Path at 40: **Purging Path**, where Sear can heal allies instead of harming them (Isaiah 6:7).
2. **Firmament** (like Frostdraw): crystal "as the colour of the terrible crystal" (Ezekiel 1:22).
   - Status: **Awe**, a slow that turns into **Struck Still**, a freeze.
   - Hymns: *Crystal Shard* (1★), *Firmament Wall* (a barrier, 2★), *Sea of Glass* (a field that slows, 3★).
3. **Judgement-Thunder** (like Thundercall): "out of the fire went forth lightning" (Ezekiel 1:13).
   - Status: **Shock**.
   - Hymns: *Flash of the Living Creatures* (a lightning dash, after "ran and returned as… a flash of lightning," Ezekiel 1:14, 1★), *Voice from the Firmament* (a strike from above, 2★), *Sevenfold Verdict* (a chained strike, 3★).
   - Path at 40: **Verdict**, a stacking mark that overloads, like Deepwoken's Surge.
4. **Whirlwind** (like Galebreathe): "a whirlwind came out of the north" (Ezekiel 1:4).
   - Status: **Winded** (slower enemy attacks) and **Hushed** (enemy can't cast, like Suffocate).
   - Hymns: *Updraft* (mobility, 1★), *Noise of Great Waters* (a wing-roar that knocks back, Ezekiel 1:24, 2★), *Answer from the Whirlwind* (a cyclone, Job 40:6, 3★).
5. **Radiance** (quest-unlocked; the opposite of Shadowcast)
   - Status: **Dazzle** (blinds). Landing Radiance Hymns drains Hell-energy from the target and restores your Grace.
   - Hymns: *Glory Flash* (1★), *Unveiling* (reveals and strips enemy buffs, 2★), *Brightness Round About* (an aura, Ezekiel 1:27–28, 3★).
6. **Sacrifice** (quest-unlocked; like Bloodrend)
   - You spend your own HP for power. Status: **Offered**, which marks a target to take bonus damage.
   - Hymns: *Lamb's Blood Ward* (1★), *They Overcame* (2★), *Unto the Death* (3★; Revelation 12:11). The 2★ Hymn isn't called "Testimony", so it can't be confused with the meta currency.

**Wordless Hymns** are the equivalent of Deepwoken's attunement-less Mantras. They scale on core attributes. Example: *Trisagion* ("Holy, holy, holy," Isaiah 6:3), a Voice Hymn that shakes the ground the way "the posts of the door moved" (Isaiah 6:4).

**Canticles (the Murmurs; optional, one per character):**
- **Hosanna:** more posture damage dealt, less posture damage taken (like Ardour).
- **Selah**, a musical "pause": stealth (like Tacet).
- **Antiphon:** call-and-response that lets you track allies and enemies (like Rhythm).

## 5. Vows (the Oaths)

The rules match Deepwoken: you can hold one Vow at a time, Vow Gifts are free, Vow Hymns never level up, and there is a separate "Vow damage" type. The default is **Unsworn**, like Deepwoken's Pathfinder. Vows are broken at **the Mercy Seat**, the equivalent of Yun'Shul, and some can never be sworn again. Most Vows need Corruption Tier 2 (section 10).

1. **Vow of the Flaming Sword** (the Gate of Eden)
   - Unlock: 40 Might and the Gate quest.
   - Playstyle: zone-holding with a blade.
   - Gifts: *Turning Every Way* (the critical becomes a 360° sweep), *None Shall Pass* (a stance that punishes anyone who rolls through you), *Keeper of the Tree*.
2. **Vow of the Watcher**
   - Unlock: 40 Faith and a sleepless vigil event.
   - Playstyle: stealth and vision, the counter-Vow to the Herald (like Blindseer).
   - Gifts: *Sleepless*, *Mark of Witness* (tags a target through walls), *Veiled Eyes*.
3. **Vow of the Herald**
   - Unlock: 50 Voice.
   - Playstyle: support and control.
   - Gifts: *Annunciation* (an area buff), *Here Am I* (a dash to a downed ally, Isaiah 6:8), *Whom Shall I Send* (summons an ally angel).
4. **Vow of the Martyr**
   - Unlock: no stat requirement; take a killing blow meant for an ally in a scripted quest.
   - Playstyle: gets stronger at low HP.
   - Gifts: *Loved Not Their Lives* (Revelation 12:11), *Word of Testimony*, *Last Breath Outcry*.
5. **Vow of the Ophan's Eye**
   - Unlock: 20 Wisdom, 20 Judgement-Thunder and 20 Whirlwind (a multi-stat requirement like Arcwarder).
   - Playstyle: orbiting wheel-constructs.
   - Gifts: *Wheel within a Wheel*, *Full of Eyes* (360° parry warnings), *Went Straight Forward*.
6. **Vow of the Live Coal**
   - Unlock: 15 in four different Tongues (like Saintsworn).
   - Playstyle: weaving several elements together.
   - Gifts: *Lips Touched* (cheaper Hymns), *Iniquity Taken Away*, *Altar's Tongs*.
7. **Vow of Michael's Host**
   - Unlock: 75 Medium Arms, or 90 combined across all Arms (like Bladeharper).
   - Playstyle: pure weapon mastery.
   - Gifts: *War in Heaven* (posture damage in chains), *And Prevailed Not*, *Cast Out* (the flourish throws the target).
8. **Forbidden: the Vow of the Fallen Star**
   - Unlock: Corruption Tier 5 and personal Stain of 50 or more. You take "the key of the bottomless pit" from a fallen star (Revelation 9:1).
   - Playstyle: converts Stain into power. Demons stay neutral until you strike.
   - Gifts: *Key of the Pit*, *Smoke of the Furnace* (an obscuring cloud, Revelation 9:2), *Locust Crown* (Revelation 9:7).
   - Cost: every ally angel turns hostile, and the pure endings are locked out. Breaking it at the Mercy Seat is possible once and leaves a permanent mark.

## 6. Gifts (the Talents)

**How cards are drawn (as in Deepwoken):**
- Each Ascension gives Gift hands of 4 to 5 cards, and you pick one.
- Rarities are Common, Rare (about two per Ascension) and Advanced (the ends of Talent trees).
- Some hands include a *Stay* card (Fold), which carries the hand to your next Ascension.
- **Feathers** (Aces) let you ban a card, guarantee a card, or keep a card.
- Some Gifts are mutually exclusive. Vow, Origin and Quest Gifts are free.

**Categories:** Form, Spirit, Arms, Tongue, Vow, Testament (quest and Origin), plus two new pools:
- **Fallen:** unlocked by personal Stain from Tier 3.
- **Sanctified:** only offered while your Stain is 0. This is a counter-curve so that staying pure also gets new options.

**Example Gifts:**
1. *Covering Wings* (Common, Steadfast 20): 10% less posture damage when blocking from the front ("with twain he covered his face," Isaiah 6:2).
2. *Burnished Feet* (Common, Steadfast 15): you can't be knocked down when you land (Ezekiel 1:7).
3. *Lion's Face* (Common, Might 25): your flourish deals +15% posture damage.
4. *Eagle's Face* (Common, Swiftness 25): +1 air dash.
5. *Full of Eyes* (Rare, Wisdom 35): enemies behind you flash when they wind up an attack.
6. *Here Am I* (Rare, Voice 30): dash to a downed ally and give them brief invulnerability.
7. *Live Coal Parry* (Rare, Seraph-Fire 30): a successful parry Hushes the attacker for 1.5 seconds.
8. *Turned Not* (Advanced, Swiftness 40): dashing forward grants hyperarmor, but you can't steer during it.
9. *Brimstone Lungs* (Fallen, Stain 25): your Outcry breathes fire and brimstone (Revelation 9:17–18). Each use adds Stain, and Sanctity regenerates at half speed.
10. *Seal on the Forehead* (Sanctified): immune to locust-swarm damage while your Stain is 0 (Revelation 9:4).

**How corruption adds pools:**
- Tier 3 adds the Fallen Common and Rare cards.
- Tier 4 adds Fallen Advanced cards and hybrid Tongue Gifts.
- Tier 5 adds the Forbidden Vow tree.
- From Tier 2, Sanctified cards are weighted higher for players with no Stain.

## 7. Anointings (the Enchantments)

Anointings use **Sanctified Whetstones** (weapons) and **Holy Oil** (armour). The rules match Deepwoken: they drop at a small chance, an item soulbinds when equipped, you can't stack the same one twice, and they come in two kinds. Blessings appear from Tier 2. **Brands** (Curses) appear from Tier 3.

**Blessings:**
1. *Coal-Anointed:* M1 hits apply light Sear.
2. *Beryl Wheel:* every third parry launches a rolling wheel.
3. *Amber Glory:* landing a critical restores Grace.
4. *Watcher's Oil* (armour): better stealth, and ambushes are revealed.

**Brands:**
5. *Brand of the Locust:* +15% damage, and M1s apply **Torment** (no healing; Revelation 9:5). In return, your own healing is 25% weaker.
6. *Mark of the Number:* large posture and armour bonus, but no angelic merchant will trade with you ("no man might buy or sell, save he that had the mark," Revelation 13:16–17). Only Hell markets serve you.
7. *Leviathan Scale* (armour): M1s can't guard-break you, because the scales are sealed and "the sword… cannot hold" (Job 41:15–17, 26). In return, you can block but can never parry.
8. *Behemoth Bone* (armour): +20% armour, because "his bones are like bars of iron" (Job 40:18). In return, no air dash and shorter rolls.

## 8. Shrines of the Throne (the Deep Shrines)

Shrines are paid with **Visions**, a currency earned within a run and lost on wipe, which is the equivalent of Deepwoken's Knowledge. You earn Visions from Ascensions, first boss kills, solo boss kills and quests. They are named Visions after "I saw visions of God" (Ezekiel 1:1).

1. **Shrine of the Scales** (Order)
   - Averages your stats. Costs 10 Visions and can be used once per run.
   - Needs Ascension 8 or higher and no Vow.
   - Can take at most 25 points from a core or Arms attribute, but any amount from Tongues.
2. **Shrine of Refining** (Mastery)
   - For 1 Vision, refund one attribute point (three per run at most) or move a Trait point.
   - Cannot go below the requirement of a Gift you hold.
   - New: for 3 Visions, cleanse 10 Stain, up to twice per run.
3. **Shrine of Joined Wings** (Unification): trade 2 Gifts and 5 Visions for a Hymn Draw ("their wings were joined one to another," Ezekiel 1:9).
4. **Shrine of the Parted Wings** (Division): trade a Hymn and 5 Visions for a *Two Lesser Gifts* card.
5. **Shrine of Lots** (Chance): trade a Gift and 5 Visions for a hand of the same rarity. For 10 Visions, trade a Common for a hand of Rares.
6. **The Mouth Speaking Great Things** (Blasphemy; a Hell-made shrine that only appears from Tier 3; Revelation 13:5)
   - For 5 Visions: three instant Ascensions, plus one Burden and +15 Stain.
   - Above Ascension 17, it rerolls a Burden instead.

**The Mercy Seat** (Yun'Shul) is separate from the Shrines. It breaks Vows, rerolls a Trumpet (which applies the Tarnished Burden), and removes a Canticle.

## 9. Trumpets (the Resonance)

Pressing C sounds your **Trumpet** (Revelation 9:1, "the fifth angel sounded"). It works like Deepwoken's Resonance:
- You build hidden **Progress** through boss kills (the best source), clearing Hell breaches, or other progress paths.
- If your HP hits zero inside a breach while your Progress is full, **the Throne answers**: a choir of trumpets sounds, you are fully healed, and you choose one of three cards. When the Throne answers, you aren't struck down, so your halo doesn't dim and you don't use up one of the plan's two lives.
- Trumpet points are randomly spread across each Trumpet's sub-stats.

**Rarities:** Normal; **Cracked** (Corrupted); **Archangel** (Legendary); **Abyssal** (a Cracked Archangel).

**Examples:**
1. *Coal of the Altar* (Normal): heals allies in an area and purges their ailments (Isaiah 6:6–7).
2. *Wheel within a Wheel* (Normal): an eye-wheel orbits you and deflects projectiles (Ezekiel 1:16–18).
3. *Firmament* (Normal): a brief crystal dome that blocks attacks (Ezekiel 1:22).
4. *Noise of Great Waters* (Cracked): a huge wing-roar that stuns, but each use costs 40 Sanctity, like Deepwoken's Mania downside (Ezekiel 1:24).
5. *Michael's Charge* (Archangel): teleport and strike a marked foe (Revelation 12:7).
6. *Key of the Pit* (Abyssal): smoke that "darkened the sun" and a locust swarm. Each use costs 10% of your max HP as Ash, a Wither-like effect, and adds Stain (Revelation 9:2–3).

## 10. Corruption tiers: the power curve

This system is new and has no Deepwoken equivalent. **World Corruption** rises with in-game days survived and with breaches left open, and goes down a little when you seal breaches. The plan instead says the level never goes down and sealing only slows it, so that's open question 11. Either way, corruption is the run's clock. Separately, the player carries their own **Stain**, from 0 to 100. Proposed rule: your maximum Ascension rises with each tier, so to grow stronger you have to let Heaven get worse.

- **Tier 0, The Calm Courts** (Ascension cap 6)
  - Map: a few small breaches.
  - Enemies: imps, locust scouts and Goetic **Knights**. The enemy ranks use the Ars Goetia's titles: Knight, President, Count, Marquis, Duke, Prince, King.
  - Unlocks: the 4 base Tongues, Hymns, Gifts, and the Shrines of Refining and Joined Wings.
- **Tier 1, Smoke from the Pit** (cap 9; Revelation 9:2)
  - Map: fog creeps over the Outer Courts.
  - Enemies: Presidents and Counts (for example Malphas, Halphas, Furfur), about +15% HP and posture. First world boss: the vanguard of Abaddon.
  - Unlocks: Altar Coals start dropping, the Radiance and Sacrifice quests, the Shrine of Lots and the Parted Wings.
- **Tier 2, The Locusts** (cap 12)
  - Map: locust swarms roam, and the crowned locusts with human faces (Revelation 9:7–10) become elites.
  - Enemies: Marquises and Dukes (Andras, Focalor, Vepar, Astaroth). Corrupted angels appear as rare elites.
  - Unlocks: **Vows** (Vow-givers retreat and look for sworn defenders), the Shrine of the Scales, and Blessing Anointings.
- **Tier 3, The Brands** (cap 15)
  - Map: Hell markets appear.
  - Enemies: Kings roam as bosses (Bael, Paimon, Asmodeus, Belial). **Leviathan** stirs in the crystal sea.
  - Unlocks: Brand Anointings, the Fallen Gift pool, the Mouth shrine, and full Stain mechanics.
- **Tier 4, The Four Loosed** (cap 18; Revelation 9:14–15)
  - Map: the four bound angels are loosed and become corrupted-angel bosses. Corrupted angels become a common elite tier.
  - Enemies: **Behemoth** (Job 40) appears, as do lion-headed horsemen breathing fire and brimstone (Revelation 9:17).
  - Unlocks: **Trumpets** (breaches can now trigger the Throne's answer), hybrid Tongues and Unsealing quests.
- **Tier 5, War in Heaven** (cap 20; Revelation 12:7)
  - Map: mostly red.
  - Bosses: the seven-headed **Red Dragon** (Revelation 12:3), the **Beast from the Sea** (Revelation 13:1–2), and the **Beast from the Earth**, who calls down false fire from heaven (Revelation 13:13) and works as a corrupted-angel mimic.
  - Unlocks: the Forbidden Vow, Archangel and Abyssal Trumpets, and the endings.

**Personal Stain thresholds.** You gain Stain by eating demon hearts, accepting Brands, taking Fallen Gifts and using the Mouth shrine. Each threshold is a bigger reward with a bigger cost:
- **25:** your halo cracks. This is separate from a halo dimmed by being struck down, which is about lives, not Stain. Fallen Gifts appear. Sanctity cap −10%.
- **50:** your Choir becomes a fallen variant, for example Kindled turns into **Smoulderer**: the same stats, but the passive is inverted towards Hell. Ally angels charge more, and some turn hostile.
- **75:** Hell's elites hesitate before attacking you. Pure endings are locked.
- **100, the Fall:** the run ends as a corrupted angel. The proposal is that your fallen self then appears in your next run as a named elite with your build, and defeating it grants a large Testimony bonus.

## 11. Testimony: meta progress kept on wipe (the Echoes)

**Testimony** is the meta currency, named after "the word of their testimony" (Revelation 12:11). It comes from one-time **Witnesses** (Triumphs) completed in a run. Examples:
- Swore a Vow: 5
- Heard a Trumpet: 15
- Defeated Abaddon: 5
- Each Ascension: 0.75

Ranks run from E to S as in Deepwoken. **Penances** (Modifiers) multiply the Testimony you earn. Examples: *Fragile Heart* (double damage taken), *Clipped Choir* (no Trumpet use), *Fated* (cards are picked for you).

**Remembrance** is the knowledge that persists. It is earned by doing things, not bought:
- **Bestiary:** each enemy has three tiers. *Seen* gives the name and silhouette. *Studied* lists its attacks, including which are unparryable or are grabs (earned by parrying or dodging each move a few times). *Mastered* shows its Tongue weakness and posture threshold (earned by killing it at least N times).
- **Map memory:** landmarks you've discovered stay as faded ink on the next run's map.
- **Lore:** pages and scripture fragments in a codex. Some reveal quest routes, such as where to find the Gate quest.

**Unlocks:**
- Radiance and Sacrifice stay learned for the account.
- Origins, starter weapons and rare Choir variants.
- **Vow skip:** a Vow you've fully progressed before can be skipped later for 10 Visions.
- The **Reliquary** lets you pass down one Anointed item for a high Testimony cost.

**Small capped upgrades** (Deepwoken-scale):
- +2% damage against demons per step, up to 8%.
- +2% armour, up to 8%.
- +1 starting Vision per step, up to 5.
- +1 starting Feather, up to 2.

Because knowledge and options do most of the work, the stat creep stays small.

## 12. Starting weapons

All weapons share the M1 chain (three hits and a flourish), parry with F, block by holding F, and use R for the critical.

1. **Flaming Sword** (Medium)
   - Even 3+1 chain and a forgiving parry window.
   - Critical: *Turning Every Way*, a wide sweep that deals posture damage.
   - **Build this first for the prototype.** It is the baseline that every other weapon is tuned against, it shows the white and gold bloom most clearly, and it ties into the Gate of Eden Vow.
2. **Spear of the Host** (Medium)
   - Long reach and slightly slower M1s.
   - Critical: a lunge that leaves the spear planted. You can follow up by pulling it out.
3. **Censer Flail** (Heavy)
   - Slow M1s with very high posture damage.
   - Critical: a swing that releases a smoke cloud ("the house was filled with smoke," Isaiah 6:4), which blocks enemy sight. Best for guard breaks.
4. **Ophan Cestus** (Light gauntlets)
   - Fast four-hit chain and a short-range parry.
   - Critical: spinning rings that hit several times.
5. **Bow of Light** (Light, ranged)
   - The M1 chain is quick draws, and the flourish is a point-blank knockback.
   - Parrying is weaker, so it leans on rolling.
   - Critical: a charged piercing shot.
6. **Herald's Horn** (Heavy, catalyst; build later)
   - Bell-mouth bashes, and blocking it builds Fervour.
   - Critical: a sonic blast that deals posture damage and briefly applies Hushed.

## 13. Open questions for Dan

1. **The right-click conflict.** In Deepwoken, M2 feints during a wind-up and also cancels Mantras and rolls. The critical is R or the middle mouse button. Which of these do you want?
   - **(A) Context-sensitive (recommended).** M2 during an M1 wind-up, a Hymn cast or a roll means feint or cancel. M2 at any other time is a critical, the same as R. This keeps Deepwoken players' habits and gives you right-click criticals. To avoid accidental criticals, a press that comes in just after a wind-up ends should be dropped rather than turned into a critical.
     The plan already lists (A) as its proposed resolution. The question blocks the plan's M3.
   - **(B) Separate keys.** M2 is always the critical, and feint and cancel move to another key such as the middle mouse button or E. This is clearer, but breaks Deepwoken habits.
   - **(C) Tap or hold.** Tapping M2 feints and holding M2 performs a critical. The downside is that a hold adds delay to the critical.
2. **Choosing a Choir.** Should Choirs be rolled at random like Deepwoken's Aspects, or chosen freely (perhaps from Choirs unlocked with Testimony)? It blocks the character creation screen in the plan's M3.
3. **Multiplayer.** Is the game solo, co-op, or has PvP? Several Origins (the Penitent, Host of the Gate) and the Trumpet progress paths depend on this.
4. **The map on reset.** Should Heaven's layout be fixed, so map memory matters a lot, or should it be a fixed core with shuffled breach and boss sites? The plan proposes both at once: a fixed map, with the invasion (breaches, camps, elites and bosses) reseeded each run.
5. **Ascension caps.** Do you want Ascension capped by Corruption tier, so growing stronger requires letting Heaven decay?
6. **The end of a run.** Does Tier 5 end the run, as a soft timer or "Heaven falls" ending, or can the player push corruption back down? This is the same question as the plan's "How a run ends well", which blocks M4.
7. **The Fall.** At Stain 100, should the run end, or continue as a Fallen angel with Hell-side endings? And do you like the idea of your fallen self returning as a nemesis in the next run?
8. **Naming.** Your word "knowledge" for meta progress clashes with Deepwoken's Knowledge, which is a per-character shrine currency lost on wipe. **Chosen for now, and both docs use it:** **Visions** within a run, and **Testimony** (the currency) and **Remembrance** (bestiary, map memory and lore) across runs. This replaces the plan's earlier names, Graces and then Revelations. Also chosen for now:
   - **Grace** means only the Ether equivalent.
   - Boons and Flaws are **Boons and Burdens**, not "Graces and Burdens", so that Grace has one meaning.
   - A death is being **struck down**, and **the Fall** is only Stain 100.

   Override any of these and both docs change to match.
9. **Tone.** How literal should scripture be? This proposal names Michael, Abaddon and the Dragon, and keeps the Throne itself offscreen.
10. **Death and survival.** Should there be survival meters (hunger and thirst), or only Sanctity? The plan proposes Deepwoken's two lives: the first time you're struck down dims your halo, and the second wipes the run. Is two right?
11. **Does sealing a breach lower corruption?** This proposal lowers World Corruption a little when you seal a breach. The plan says the level never goes down, and sealing only slows it and cleanses the ground nearby. It blocks the plan's M4.

---

## Sources

- https://deepwoken.fandom.com/wiki/Character_Creation
- https://deepwoken.fandom.com/wiki/Aspects
- https://deepwoken.fandom.com/wiki/Attributes
- https://deepwoken.fandom.com/wiki/Attunements
- https://deepwoken.fandom.com/wiki/Mantras
- https://deepwoken.fandom.com/wiki/Ether
- https://deepwoken.fandom.com/wiki/Oaths
- https://deepwoken.fandom.com/wiki/Talents
- https://deepwoken.fandom.com/wiki/Enchantments
- https://deepwoken.fandom.com/wiki/Deep_Shrines
- https://deepwoken.fandom.com/wiki/Shrine_of_Order
- https://deepwoken.fandom.com/wiki/Shrine_of_Mastery
- https://deepwoken.fandom.com/wiki/Knowledge
- https://deepwoken.fandom.com/wiki/Resonance
- https://deepwoken.fandom.com/wiki/Echoes
- https://deepwoken.fandom.com/wiki/Origins
- https://deepwoken.fandom.com/wiki/Murmur
- https://deepwoken.fandom.com/wiki/Power
- https://deepwoken.fandom.com/wiki/Posture (the combat interface and controls: feint, critical, block, vent, roll)
- https://deepwoken.fandom.com/wiki/Boons_and_Flaws
- https://en.wikipedia.org/wiki/Christian_angelology (the nine choirs and the Pseudo-Dionysian hierarchy)
- https://en.wikipedia.org/wiki/The_Lesser_Key_of_Solomon (the 72 Ars Goetia spirits and their ranks)
- https://www.biblegateway.com/passage/?search=Isaiah%206&version=KJV
- https://www.biblegateway.com/passage/?search=Ezekiel%201&version=KJV
- https://www.biblegateway.com/passage/?search=Ezekiel%2010&version=KJV
- https://www.biblegateway.com/passage/?search=Revelation%209&version=KJV
- https://www.biblegateway.com/passage/?search=Revelation%2012-13&version=KJV
- https://www.biblegateway.com/passage/?search=Job%2040-41&version=KJV

Three gaps in the sources:
- The Goetic demons are used only by name and rank. Their traditional descriptions weren't retrieved, so their looks and movesets in this design are original.
- The "Watchers" falling (the Watcher-kin flaw) and the flaming sword at Eden are general tradition. No page was retrieved for them.
- The Corruption-tier system, the mechanical Choir variants and the per-Choir flaws have no Deepwoken equivalent. They are marked as departures in the text.
