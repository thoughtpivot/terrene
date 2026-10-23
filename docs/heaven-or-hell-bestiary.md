# Heaven Or Hell: Creature Bible (Angels, Demons and the Beasts of the Pit)

## Overview

A proposal, and the companion to [heaven-or-hell-plan.md](./heaven-or-hell-plan.md). It is the full creature roster behind the plan's [Creatures](./heaven-or-hell-plan.md#creatures) section, with sprite briefs, AI image prompts and a tier table aligned with [heaven-or-hell-progression.md](./heaven-or-hell-progression.md). Where the plan or the progression doc has decided something, they win.

Working bestiary for the sprites, enemies and allied NPCs of *Heaven Or Hell*. You play a lesser angel, one of **the Tenth**, defending Heaven (the open map) against Hell's invasion. Angels are allies. Most enemies are demons and Hell-beasts drawn from scripture or long tradition, and a smaller elite and boss tier are corrupted angels.

Every scripture quote below is in the King James Version (decided by Dan) and was checked against a retrieved KJV text (Bible Gateway's KJV, which that site marks as public domain, and the Project Gutenberg KJV; Tobit against Wikisource's KJV Apocrypha). Every tradition quote comes from a retrieved public-domain text (Mathers' *Goetia* and Charles' *1 Enoch* on sacred-texts.com). Section 5 lists all the sources.

Contents:

1. Principles (what "biblically accurate" means here, labels, art rules, combat legend)
2. Bestiary
   - 2A. Ally angels (8 entries, plus the list of figures reserved for special quests)
   - 2B. Enemies (36 entries: Fallen Angels, demons, Hell beasts, corrupted angels and bosses)
   - 2C. Goetia quick reference (20 spirits)
   - 2D. Art-historical reference board
3. Tier table (Corruption Tiers 0 to 5)
4. Production priorities (the first three enemies to build)
5. Sources
6. Sensitivity and tone: decisions for Dan

---

## 1. Principles

### 1.1 What "biblically accurate" means in this project

The phrase comes from an internet meme. Know Your Meme dates the joke to a 2016 Tumblr post that set Ezekiel 1, Ezekiel 10 and Daniel 10 beside the gentle winged humans of Western art. The meme took off in 2020. The meme is right that the text describes far stranger beings than the art does. It also over-generalises: most angels in scripture look like ordinary men (Genesis 19, Hebrews 13:2), and the many-eyed, wheeled and four-faced forms belong to a few specific throne-room orders (seraphim, cherubim, ophanim and the living creatures).

For this game, "biblically accurate" means:

- **Take the text's own visual details literally where it gives them**, such as six wings, four faces, wheels full of eyes, crowns like gold on locusts, or lion-headed horses with serpent tails. The text is the design spec.
- **Do not invent anatomy the text contradicts.** Do add production detail (armour plates, ink edges, glow cracks) where the text is silent.
- **Keep the strangeness for the right orders.** Human-looking angels stay human-looking; most of Heaven's rank and file look like men in white linen.
- **Most Hell creatures in Revelation are visions and symbols.** We treat them as literal creatures for gameplay, and say so in the lore.

### 1.2 Source labels used on every entry

| Label | Meaning |
| --- | --- |
| **[Scripture]** | Protestant/Catholic canon; quoted with verse references, always from the KJV (decided) |
| **[Deuterocanon]** | Tobit (Catholic/Orthodox canon, Protestant Apocrypha); quoted from the KJV's Apocrypha |
| **[Enochic tradition]** | 1 Enoch (canonical only in the Ethiopian Orthodox Church); quoted from R. H. Charles' translation |
| **[Goetia tradition]** | *Ars Goetia*, the first book of the *Lesser Key of Solomon*, a 17th-century grimoire; quoted from Mathers' translation (1904 edition) |
| **[Later tradition]** | Pseudo-Dionysius, rabbinic or medieval demonology, the *Dictionnaire Infernal*, art history |
| **[Game invention]** | Our own mechanics or design filling a gap the source leaves; never presented as lore fact |

### 1.3 Art rules (apply to every sprite)

**Camera.** There is one fixed orthographic camera, looking about 45–50° down along a diagonal, like Death's Door's fixed isometric-style view. Every source painting must be painted from this angle. Implications:
- Silhouettes must read **from above**. Wings, horns, tails, crowns and spread limbs read well. Tall thin verticals (spears, necks) foreshorten, so exaggerate them.
- Faces tilt up toward the camera. Eyes on top surfaces (crowns, backs, wing tops) read strongly, which suits the many-eyed angels.
- Each creature needs **two painted views**: front-diagonal (facing down-screen toward the camera) and back-diagonal (facing up-screen). Mirror them for the other two diagonals. Bosses that never turn away may need only one.

**Style.** Death's Door-like chunky, bevelled forms and toon shading (two or three hard value bands plus a rim light), with thick dark ink outlines. Our version is darker: a **near-black monochrome base** (charcoal to black, cool or warm greys only), with colour coming *only* from emissive glows.

**Glow language** (it doubles as the combat telegraph system):

| Glow | Meaning |
| --- | --- |
| White and gold | Heaven, angels, holy light, the player's allies, the player's own critical (R) |
| Dim ember (low-intensity, desaturated red-brown) | A Hell creature's idle state. Deliberately dull so it does not read as danger |
| **Bright orange** | **Wind-up warning**: a parryable attack is coming. Parry (F) on the flash |
| **Bright red** | **Danger**: an unparryable attack, grab or area. Roll (Q) or reposition. Block only chips |
| Gold cracked with red | Corrupted angel: the holy gold glow is smothered, with red bleeding through the cracks |
| False gold (flickers red at the edges) | A **Deceiver's** lure: counterfeit holy light that copies the player's white-gold palette (see below) |

**False gold: the Deceivers (decided by Dan).** 2 Corinthians 11:14 (KJV): "And no marvel; for Satan himself is transformed into an angel of light." Deceiver-type enemies can show **fake gold** to lure the player. It comes in three forms:

- **False golden light.** A warm white-gold shaft or glow in the distance, the look of an altar, a shrine or an ally, that leads into an ambush or a hazard.
- **Fake Vision pickups.** There is no gold coin currency; Visions are the shrine currency, and they drop as small white-gold motes. A fake Vision looks like one, but collecting it gives nothing and springs the trap (a grab, a curse or an ambush). It is a visual lure, never money.
- **A false angelic glow.** The Deceiver itself wears the player's own white-gold palette, posing as an ally angel until it strikes.

Every false gold has a **tell**, so the glow language stays fair: the edges flicker to red or ember at intervals, it casts no bloom on the ground around it, and it never pulses in time with the player's halo. The tell is visible before the trap springs, and the Studied bestiary entry names it. True gold never flickers. The Deceivers are **E10 Furfur** (*Liar's light*), **E31 Belial** (the false angels) and **E34 the False Prophet** (counterfeit fire). The quote names Satan, but he is never a depicted character.

**Keying.** Source paintings sit on a **flat pure magenta (#FF00FF) background**. Hell's red and orange glows sit next to magenta in hue, so prompts must say "no magenta or pink in the figure, glows are orange-red not pink" and the glow halo must stop hard at the ink line (add bloom in-engine, not in the painting).

**Cutout puppets.** Every creature is cut into separate parts with keyframed transforms (position, rotation, scale and squash). Paint parts with **overlap margins** (hidden "underpaint" where parts tuck under each other) and keep glows on their own layer so the engine can pulse them for telegraphs. Each entry lists its part set and minimum animation list. The baseline set is idle, move, wind-up, attack, stagger (posture break) and death.

**Scale classes** (relative to the player, one of the Tenth, at 1.0 = roughly one human height):

| Class | Height vs player | Examples |
| --- | --- | --- |
| S | 0.3–0.6× | Frog-spirit, smoke wisp |
| M | 0.9–1.3× | Se'ir, Botis, the Branded |
| L | 1.5–2.5× | Nephil Brute, Andras with wolf, locust |
| XL | 3–5× | Behemoth (partial), Beast from the Sea, cherub |
| Colossal | 8×+, never fully on screen | Leviathan, the Red Dragon, Behemoth at its largest |

### 1.4 Combat legend used in the entries

- **Parryable** means a perfect parry (F) on the orange flash deflects it and deals posture damage to the attacker.
- **Unparryable (red)** means you must roll (Q) or step out; blocking takes chip damage plus heavy posture damage.
- **Posture threat** (Low / Med / High / Break) is how much a *blocked* hit fills the player's posture bar. "Break" means a blocked hit breaks the player's guard outright.
- **Hyperarmour** means the attack cannot be interrupted by the player's light hits. Only a parry, a posture break or a critical (R) stops it.
- **Critical (R)** is available when the enemy's posture breaks (stagger animation). Entries note any special critical.
- **AI read trait** (how it reacts to a right-click **feint**):
  - **Gullible**: always bites, committing a parry or dodge into the feint and leaving an opening.
  - **Wary**: rarely bites; it usually waits the feint out, and may punish a feint with a quick jab.
  - **Adaptive**: bites the first one or two feints, then learns. It punishes repeated feints with a counter, and the counter resets after a few seconds without feinting.
  - **Unreading**: ignores the player's wind-ups entirely. It is mindless, a swarm, or a hyperarmoured juggernaut, so feints do nothing; bait it with positioning instead.

---

## 2A. ALLY ANGELS

Angels are allies and NPCs, so each entry lists an **ally role** (support behaviours, quests, world functions) instead of attacks. Some can act as sparring partners in training, so a sparring read trait is given for those.

**Decided by Dan:** allied angels roam the open map and fight alongside the player. They are fragile and die easily, and a dead or overwhelmed ally can be corrupted into a **Fallen Angel** (E36), the lowest, common enemy tier. Only the Host (A8) roams; the seraphim, cherubim and ophanim keep their posts. The plan's [Fallen Angels](./heaven-or-hell-plan.md#fallen-angels-the-common-tier) section has the rules and starting values.

**Michael is reserved for special quests.** He has no entry, sprite or prompt here. His name appears only where the plan already uses it: the Vow of Michael's Host, the *Michael's Charge* Trumpet and Revelation 12:7.

**Reserved for special quests** (Dan's rule: no entries, sprites or prompts until he says otherwise):

- God
- Christ
- The Holy Spirit
- Michael, as a character
- Gabriel
- Raphael
- Uriel
- The angel with the key of the bottomless pit (Revelation 20:1)
- Satan, as a character
- The mighty angel of Revelation 10
- The man clothed in linen of Daniel 10

---

### A1. Seraph (the Burning Ones)

- **Source [Scripture]:** Isaiah 6:2–3, 6–7 (KJV): "Above it stood the seraphims: each one had six wings; with twain he covered his face, and with twain he covered his feet, and with twain he did fly. And one cried unto another, and said, Holy, holy, holy" ... "Then flew one of the seraphims unto me, having a live coal in his hand, which he had taken with the tongs from off the altar: And he laid it upon my mouth, and said, Lo, this hath touched thy lips; and thine iniquity is taken away."
- **Tradition [Later tradition]:** The Hebrew *saraph* means "burning" and elsewhere names a serpent, including Isaiah's "fiery flying serpent". Scholars link the motif to the winged Egyptian uraeus cobra (Wikipedia, *Seraph*). Pseudo-Dionysius makes seraphim the highest choir, "those who kindle or make hot". One Old Church Slavonic manuscript coined a ten-eyed letter O (ꙮ) for "many-eyed seraphim".
- **Visual (faithful to source):** A being of six wings: two crossed over the face, two crossed over the feet, two spread to fly. The body is barely visible between the wings, a burning core. It holds altar tongs with a live coal. Nothing in Isaiah mentions eyes; the many-eyed seraph is later icon tradition (keep the eyes optional and small).
- **SPRITE BRIEF**
  - *Silhouette at camera:* A six-pointed star of wings seen from above. The flight pair spreads flat toward the camera, the face pair forms a closed upper diamond and the feet pair forms a closed lower diamond. Reads as a hovering burning "X" with a spine. It never touches the ground.
  - *Scale:* L (2× player wingspan, about 1.3× height).
  - *Glow map:* Gold-white core seen between the wings, white-hot coal in the tongs, and thin gold edges on every feather tier. The wings themselves are near-black with gold rim light.
  - *Puppet parts (14):* core/torso glow; face-wing L and R; foot-wing L and R; flight-wing L and R (each flight wing split into inner and outer for a fold, so +2); arm with tongs; coal (separate emissive); halo-flare ring (emissive); ground glow decal.
  - *Animations:* idle hover (slow flight-wing beat, face wings trembling), fly/move, "Holy" call (all wings flare, used as an ally buff), coal throw (its attack at breaches), coal-touch (purify), recoil, departure (ascend and fade).
- **Ally role:** **Breach fighter and altar keeper.** As in the plan, seraphim fight beside the player at breaches, throwing coals from the altar at Hell's lines, and keep the altars where a dimmed halo is cleared. Proposed extras: at an altar the coal also clears corruption debuffs and refills healing, and when two altars in a zone are lit, the seraphim's antiphonal "Holy, holy, holy" gives a zone-wide posture-regeneration buff.
- **DRAFT AI IMAGE PROMPT:** "A seraph from Isaiah 6: a hovering being made of six great wings, two wings crossed over its hidden face, two crossed over its feet, two spread wide in flight, a burning gold-white core glimpsed between the feathers, one hand holding iron altar tongs with a glowing live coal. Painted from a fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, darker solemn mood. Near-black monochrome base, the only colour is emissive white and gold light on feather edges, core and coal. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, no text, high resolution game sprite source."

---

### A2. Cherub (Keeper of the Way)

- **Source [Scripture]:** Ezekiel 1:6–10 (KJV): "every one had four faces, and every one had four wings. And their feet were straight feet; and the sole of their feet was like the sole of a calf's foot: and they sparkled like the colour of burnished brass. And they had the hands of a man under their wings ... they four had the face of a man, and the face of a lion, on the right side: and they four had the face of an ox on the left side; they four also had the face of an eagle." Ezekiel 10:12: "their whole body, and their backs, and their hands, and their wings, and the wheels, were full of eyes round about". Ezekiel 10:14 swaps the ox face for "the face of a cherub". Genesis 3:24: "he placed at the east of the garden of Eden Cherubims, and a flaming sword which turned every way, to keep the way of the tree of life." Exodus 25:20: "the cherubims shall stretch forth their wings on high, covering the mercy seat with their wings".
- **Tradition:** Orthodox icons paint the "tetramorph" cherub. Western art later merged cherubim with the putto, the chubby winged child (Wikipedia, *Cherub*). **Do not use the putto.**
- **Visual:** A man-shaped body with straight legs ending in calf hooves of burnished brass, and four faces on one head (man forward, lion right, ox or cherub left, eagle back). Four wings: two raised and touching a neighbour's wing, two covering the body. Human hands under the wings. In Ezekiel 10 every surface is covered in eyes. At Eden's gate a flaming sword "turned every way" hovers beside it.
- **SPRITE BRIEF**
  - *Silhouette:* A tall block with two raised wings forming a "V" above and two wings wrapped down like a cloak. The four-faced head reads as a crowned lump from above, with eagle beak and lion mane breaking the outline. A ring-blade of flame (the turning sword) orbits it horizontally, which is ideal for the top-down camera.
  - *Scale:* XL (3× player).
  - *Glow map:* Brass hooves and hands lit gold; eyes as tiny white points scattered over the near-black body and wings; the turning sword white-gold with a gold trail.
  - *Puppet parts (16):* head base plus 4 face plates (man, lion, ox/cherub, eagle, each with a blinking eye layer); torso; raised wing L and R; cloak wing L and R; arm and hand L and R (under the wings); leg L and R with hoof; flaming sword (separate, orbiting); eye-twinkle overlay sheet.
  - *Animations:* idle (sword slowly orbits, eyes blink in waves), move straight forward without turning (Ezekiel 1:12 "they turned not when they went", so it *slides* and never rotates, just switches its facing plate), sword-sweep (gate defence), wings-cover (shield pose), kneel/bow, rise and depart.
- **Ally role:** **Gate warden, quest giver and tutor.** As in the plan, cherubim guard gates and give quests. They guard key gates and waystones of Heaven, sealing a zone against Hell's spread. Losing a cherub-guarded gate escalates local corruption. Optional: a cherub is the **parry trainer** at Tier 0, swinging the turning sword in readable orange-flash patterns. *Sparring read trait:* adaptive (it teaches the feint).
- **DRAFT AI IMAGE PROMPT:** "A biblical cherub from Ezekiel 1 and 10: a tall man-shaped guardian with four faces on one head (human face forward, lion face right, ox face left, eagle face behind), four wings (two raised high, two wrapped down covering the body), human hands under the wings, straight legs ending in polished brass calf hooves, its body and wings dotted with many small open eyes, a ring of flaming sword-blade orbiting horizontally around it. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, isolated. Death's Door-inspired chunky bevelled forms, toon shading, thick dark ink outlines, darker awe-filled mood. Near-black monochrome base; only emissive white and gold on the eyes, brass hooves, hands and the flaming blade. Flat pure magenta #FF00FF background, no ground, no shadow, no magenta or pink in the figure, high resolution sprite source."

---

### A3. Ophan / Throne (the Wheels)

- **Source [Scripture]:** Ezekiel 1:15–21 (KJV): "behold one wheel upon the earth by the living creatures ... The appearance of the wheels and their work was like unto the colour of a beryl ... a wheel in the middle of a wheel. When they went, they went upon their four sides: and they turned not when they went. As for their rings, they were so high that they were dreadful; and their rings were full of eyes round about them four ... for the spirit of the living creature was in the wheels." Ezekiel 10:13: "As for the wheels, it was cried unto them in my hearing, O wheel."
- **Tradition [Later tradition]:** The Dead Sea Scroll 4Q405 treats the ophanim as angels. 1 Enoch 71:7 lists "Seraphim, Cherubim, and Ophanim" together. Christian angelology later identified them with the "Thrones", Pseudo-Dionysius' third order (Wikipedia, *Ophanim*). Tradition also links them to the fiery wheels of Daniel 7:9 (per the same article).
- **Visual:** Two interlocking rings at right angles (a gyroscope), beryl-coloured in the text. Here the rings are near-black stone banded with a cold white-gold sheen, their rims "so high that they were dreadful" and lined with eyes. They roll in any of four directions without turning.
- **SPRITE BRIEF**
  - *Silhouette:* The camera sees one ring nearly edge-on and one as a tilted ellipse. Crossed ellipses make a strong, alien, instantly readable icon. Eyes line the outer rims.
  - *Scale:* XL (3–4× player diameter).
  - *Glow map:* Eyes white with a gold iris; the inner hub gold; faint beryl-white sheen bands on the rims (still within the white/gold rule).
  - *Puppet parts (8):* outer ring A; outer ring B; inner ring A and B (a wheel within a wheel); hub glow; eye strip A and B (scrolling textures for rotation); dust/fire trail.
  - *Animations:* idle (slow counter-rotation, eyes blink in sequence), roll (rings spin on their axes while the whole sprite slides), lift (rises from the ground, Ezekiel 1:19), "O wheel" activation flare, dim/sleep.
- **Ally role:** **Sentinels of the map.** As in the plan, ophanim watch the map, and talking to one reveals nearby breaches; their rims "full of eyes" are the in-world reason they see so much. Proposed extras: an activated ophan could carry the player between liberated zones (they go "whithersoever the spirit was to go"), and at Tier 4–5 an ophan can roll through a Hell siege line as a scripted ally charge.
- **DRAFT AI IMAGE PROMPT:** "An ophan, the wheel-angel of Ezekiel 1: two enormous interlocking stone rings at right angles like a gyroscope, a wheel within a wheel, the high dreadful rims lined with many open eyes, a glowing hub at the centre, hovering just above the ground. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full object, isolated. Death's Door-inspired chunky bevelled forms, toon shading, thick dark ink outlines, ominous holy mood. Near-black stone with cold pale sheen; only emissive white and gold on the eyes and hub. Flat pure magenta #FF00FF background, no ground, no shadow, no magenta or pink in the figure, high resolution sprite source."

---

### A4. The Four Living Creatures (Heralds of the Tiers)

- **Source [Scripture]:** Revelation 4:6–8 (KJV): "round about the throne, were four beasts full of eyes before and behind. And the first beast was like a lion, and the second beast like a calf, and the third beast had a face as a man, and the fourth beast was like a flying eagle. And the four beasts had each of them six wings about him; and they were full of eyes within: and they rest not day and night, saying, Holy, holy, holy". In Revelation 6:1–7 each living creature in turn says "Come and see" as the seals open.
- **Visual:** Four separate creatures, unlike Ezekiel's four-faced cherubim: a lion, a calf (young ox), one with a man's face, and a flying eagle. Each has six wings and is covered in eyes.
- **SPRITE BRIEF**
  - *Silhouette:* Four distinct animal silhouettes (a lion's mane mass, a calf's horned block, a man's upright, an eagle's spread) each wrapped in a six-wing fan. Eyes on wing tops face the camera.
  - *Scale:* L–XL (2.5× player).
  - *Glow map:* Eyes white-gold; wing edges gold; each one's mouth glows white when it speaks.
  - *Puppet parts (about 12 each; the wing rig is shared):* body; head; jaw/beak; 6 wings (3 pairs); legs (or talons) ×2–4; eye overlay sheet.
  - *Animations:* idle (wings in endless slow beats, "they rest not"), the "Come" call (head lifts, all eyes open, white flare), bow, ambient chant loop.
- **Ally role:** **Tier heralds and keepers of lore.** They guard the edge of the Throne zone, where the Throne itself is never shown (see section 6), and keep lore, as in the plan. When corruption rises a tier, one living creature cries "Come", which echoes Revelation 6, and the world escalates. Players learn to fear the cry. This frames escalation as permitted and announced from Heaven without showing anything on the reserved list.
- **DRAFT AI IMAGE PROMPT (one per creature; lion shown):** "One of the four living creatures of Revelation 4: a majestic lion-like creature wrapped in six wings, its body and wings covered in many open eyes, mouth open as if crying out. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, isolated. Death's Door-inspired chunky bevelled forms, toon shading, thick dark ink outlines, solemn mood. Near-black monochrome base; only emissive white and gold on eyes, wing edges and mouth. Flat pure magenta #FF00FF background, no ground, no shadow, no magenta or pink in the figure, high resolution sprite source." *(Swap "lion-like" for "young ox / calf", "creature with a man's face", "eagle in flight".)*

---

### A5. The Linen Scribes (Keepers of the Mark)

- **Source [Scripture]:** Ezekiel 9:2–4 (KJV): "one man among them was clothed with linen, with a writer's inkhorn by his side ... Go through the midst of the city ... and set a mark upon the foreheads of the men that sigh and that cry". Ezekiel 10:2: "Go in between the wheels ... fill thine hand with coals of fire from between the cherubims, and scatter them over the city."
- **Interpretation [Game invention]:** Ezekiel describes one unnamed scribe. We make him the pattern for an order of scribe-angels, all alike and none named. Only Ezekiel's details are used (section 6 explains why Daniel 10 is held back).
- **Visual:** A man-shaped angel in a plain white linen robe with a cord belt, a scribe's inkhorn and a reed pen at the hip, and a calm, quiet face. No wings at rest.
- **SPRITE BRIEF**
  - *Silhouette:* A tall, narrow robed figure; the inkhorn and pen break the outline at the hip, the cord marks the waist, the robe flares at the hem. Calm and vertical, the opposite of the monsters.
  - *Scale:* M+ (1.2× player).
  - *Glow map:* Soft white eyes; a thin gold rim on the cord; coals in the hand are white-gold; the ink glows white when he marks.
  - *Puppet parts (13):* head; torso/robe upper; robe skirt (2 hanging panels); arm L and R; hand with pen; inkhorn; cord belt; feet L and R; coal glow (separate emissive); mark-sigil decal (separate emissive).
  - *Animations:* idle (robe sways), walk, write (records in the ledger), mark (pen to the forehead), scatter coals (an area ally ability), bow.
- **Ally role:** **Keepers of Remembrance and of the mark.** The scribes record what the player keeps across a wipe (the bestiary, map memory and lore that the progression doc calls Remembrance), so they are the natural place to read it. Their mark on the forehead (Ezekiel 9:4) shortens the locusts' Torment (E8) and is the visual counter to the Branded's brand (E15). From Tier 3 a scribe can scatter coals of fire on a Hell position as an ally strike the player calls.
- **DRAFT AI IMAGE PROMPT:** "A scribe angel modelled on the man clothed in linen from Ezekiel 9: a tall serene man-like figure in a plain long white linen robe with a cord belt, a scribe's inkhorn and reed pen at the hip, a calm quiet face, a few glowing coals held in one hand. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, isolated. Death's Door-inspired chunky bevelled forms, toon shading, thick dark ink outlines, quiet stern mood. Near-black monochrome base with the robe in dark grey values; only emissive white and gold on the eyes, cord, coals and ink. Flat pure magenta #FF00FF background, no ground, no shadow, no magenta or pink in the figure, high resolution sprite source."

---

### A6. The Seven Trumpet Angels (and the Censer Angel)

- **Source [Scripture]:** Revelation 8:2–6 (KJV): "I saw the seven angels ... and to them were given seven trumpets. And another angel came and stood at the altar, having a golden censer ... And the angel took the censer, and filled it with fire of the altar, and cast it into the earth: and there were voices, and thunderings, and lightnings, and an earthquake. And the seven angels which had the seven trumpets prepared themselves to sound." In Revelation 15:6 the bowl angels are "clothed in pure and white linen, and having their breasts girded with golden girdles."
- **Visual:** Seven tall angels in white linen with golden sashes across the chest, each with a long trumpet. One more swings a golden censer. Kept uniform, like a liturgical choir, and unnamed.
- **SPRITE BRIEF**
  - *Silhouette:* A vertical robed figure with a long horizontal trumpet. Design the trumpet as the strongest line and point it along the camera diagonal so it does not foreshorten to nothing.
  - *Scale:* L (1.6× player).
  - *Glow map:* Gold trumpet bells, gold chest sash, white mouth-blast cone; the censer pours gold fire.
  - *Puppet parts (11):* head, torso, robe ×2, arms ×2, hands ×2, trumpet, wings ×2 (folded), plus a censer and chain variant for the censer angel.
  - *Animations:* idle, raise trumpet, sound (a light cone and a shockwave ring), lower; censer swing and throw.
- **Ally role:** **The turning points of the corruption tiers.** Their soundings are scripted world events, not a separate meter. The fifth trumpet opens the Pit (Revelation 9:1–2), which starts Tier 1, Smoke from the Pit. The sixth looses the four angels bound at the Euphrates (9:13–14), which starts Tier 4. Tier 4 is also when the player's own Trumpets unlock (progression doc, section 9), so the sixth sounding doubles as the introduction to the player's Trumpet. Proposal: the censer angel's thrown fire (8:5) opens a breach as a set-piece, and the other soundings stay unassigned for now.
- **DRAFT AI IMAGE PROMPT:** "One of the seven trumpet angels of Revelation 8: a tall solemn angel in a pure white linen robe with a golden sash across the chest, folded wings, raising a long straight golden trumpet. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, isolated. Death's Door-inspired chunky bevelled forms, toon shading, thick dark ink outlines, ominous ceremonial mood. Near-black monochrome base with dark grey robe values; only emissive white and gold on trumpet, sash and halo. Flat pure magenta #FF00FF background, no ground, no shadow, no magenta or pink in the figure, high resolution sprite source."

---

### A7. The Strangers (Angels Unawares)

- **Source [Scripture]:** Genesis 19:1 (KJV): "there came two angels to Sodom at even". Hebrews 13:2: "Be not forgetful to entertain strangers: for thereby some have entertained angels unawares."
- **Visual:** Ordinary-looking travellers in dusty cloaks, staff in hand. The only hint is that their **shadow** on the ground is winged, or a gold glint appears in the eye when the camera passes. This is the most biblically common angel and the least drawn one.
- **SPRITE BRIEF**
  - *Silhouette:* A hooded traveller with a staff and pack. Deliberately unremarkable; the reveal is the drop-shadow decal changing to a winged shape.
  - *Scale:* M (1.0×).
  - *Glow map:* None at rest; a faint gold eye-glint; a winged gold shadow on reveal.
  - *Puppet parts (10):* head/hood, torso/cloak, cloak tail, arms ×2, staff, pack, legs ×2, shadow decal (normal and winged).
  - *Animations:* idle, walk, sit at a fire, reveal (stands, the shadow unfurls into wings, a gold flash), vanish.
- **Ally role:** **Hidden merchants, mentors and secret quests.** Wanderers in the open map. Helping a stranger (escorting or sharing a healing charge) can reveal them as angels and grant relics. **Design hook:** some strangers are Hell spies instead (see Belial, E31). Hebrews 13:2 is the moral: hospitality is rewarded more often than punished.
- **DRAFT AI IMAGE PROMPT:** "A weary hooded traveller in a dusty cloak with a walking staff and small pack, ordinary and humble, whose cast shadow on the ground has the shape of great wings. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, isolated. Death's Door-inspired chunky bevelled forms, toon shading, thick dark ink outlines, quiet mysterious mood. Near-black monochrome base; only a faint emissive gold glint in the eyes and a gold edge on the winged shadow. Flat pure magenta #FF00FF background, the winged shadow as a separate shape on the magenta, no magenta or pink in the figure, high resolution sprite source."

---

### A8. The Host (Rank-and-File Angels)

- **Source [Scripture]:** Revelation 12:7 (KJV): "there was war in heaven: Michael and his angels fought against the dragon". The plan already quotes this verse. This entry is only "his angels", the unnamed host; Michael himself is reserved.
- **Visual (our design, labelled):** Scripture gives the host no physical description. Following section 1.1 they look like men: tall, man-shaped angels in white linen under plain plate armour, with two wings, a spear and a flat halo ring. Their power shows in numbers and light, not monstrosity. They are deliberately uniform, so no single soldier reads as a hero.
- **SPRITE BRIEF**
  - *Silhouette:* A V of raised wings over a spear held diagonally (which reads well against the camera diagonal) and a short cape. Reads as "soldier", and reads as a wall when several stand in a line.
  - *Scale:* M+ (1.3× player).
  - *Glow map:* Gold armour rims, a white-gold spearhead, and a halo **ring seen from above** (an ellipse on the ground plane reads better from this camera than a vertical disc). When they shield a lane, their spread wings join into one gold band.
  - *Puppet parts (16):* head, helm crest, torso, cape (2 segments), wing L and R (2 segments each), arm L and R (upper arm and forearm with hand), spear, legs ×2, halo ellipse.
  - *Animations:* idle (wings breathe), walk, flight, spear thrust, shield the lane (wings spread into a wall of light), kneel, hit, death (fades into light), and **fall** (about 0.6 s as a starting value: the halo cracks and drops, the gold rims flood red and the wings jerk down; it never pauses play, and the rig then becomes E36).
- **Ally role:** **The rank and file.** Bands of one to three roam the open map and join nearby fights. They are fragile: two or three demon hits kill one, and a dead or overwhelmed soldier may fall (E36). They hold breaches beside the player and the seraphim, and they are the NPC ranks behind the Host of the Gate and the Vow of Michael's Host in the progression doc. In the Red Dragon fight (E35) a line of them spreads its wings into a gold lane that shields the player from the falling stars. They never land the decisive blow; the dragon falls to the player's parries and criticals. *Sparring read trait:* wary.
- **DRAFT AI IMAGE PROMPT:** "A rank-and-file soldier angel of Heaven's host: a tall man-like angel with a calm plain face, white linen under plain plate armour, two great raised wings, a long spear held diagonally, a short cape, a flat halo ring of light above the head. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, isolated. Death's Door-inspired chunky bevelled forms, toon shading, thick dark ink outlines, grave steadfast mood. Near-black monochrome armour and feathers; only emissive white and gold on armour rims, spearhead and halo. Flat pure magenta #FF00FF background, no ground, no shadow, no magenta or pink in the figure, high resolution sprite source."

**Corrupted echoes.** The Fallen Angel (E36, common) reuses the A8 rig. The plan's corrupted seraph, cherub and ophan (the elite and boss tier) reuse the A1–A3 rigs, with red where the ally has white, following Death's Door's echo rule. They need no new sprite briefs, only recoloured glow layers and red telegraphs.

---

## 2B. ENEMIES

Thirty-six entries, kept in their draft order (roughly by escalation), with the Fallen Angel added last as E36 so the earlier numbers stay stable. Each entry's **First tier** line follows section 10 of the progression doc, and section 3 gives the tier-by-tier view. Three entries contain variants (Malphas/Halphas, Focalor/Vepar/Forneus, and the three Beasts of the Great Sea), so the roster gives **40 distinct sprites**, plus the Fallen Angel, which recolours the Host's rig (A8). Named corrupted angels are marked **(Corrupted angel)**.

**Goetic names (decided by Dan).** Goetic spirits keep their real *Ars Goetia* names, shown with a rank title underneath in the form "*<Rank> of the Pit*": King, Duke, Prince, Marquis, President, Earl or Knight. Each Goetic entry has a **Name plate** line. Where the Goetia gives two ranks, the first is shown.

Every prompt uses the same Hell style tail, written out in full so each prompt can be pasted on its own.

---

### E1. Pit-Smoke Wisp

- **Source [Scripture]:** Revelation 9:2 (KJV): "he opened the bottomless pit; and there arose a smoke out of the pit, as the smoke of a great furnace; and the sun and the air were darkened by reason of the smoke of the pit." Revelation 9:3: "there came out of the smoke locusts upon the earth". **[Game invention]:** the smoke itself is semi-alive.
- **Visual:** A drifting knot of furnace smoke with a dim ember heart and a suggestion of a mouth. It is the first sign of the Pit.
- **SPRITE BRIEF**
  - *Silhouette:* A low, wide smoke blob, wider than tall (it reads from above), with trailing tendrils.
  - *Scale:* S (0.5×).
  - *Glow map:* Dim ember core at idle; the core swells **orange** before it lunges and flashes **red** when it bursts.
  - *Puppet parts (5):* smoke body (2 overlapping lobes), ember core, mouth slit, tendril trail (scrolling).
  - *Animations:* idle drift, move (smear), wind-up (inhale, core brightens orange), attack (lunge or burst), stagger (puffs apart), death (disperses to ash).
- **Role:** Common (chaff and swarm). **First tier:** 0 (stray wisps), common at 1.
- **Attacks:**
  1. *Ember lunge*: parryable, 0.6 s orange core swell, Low posture threat.
  2. *Smoke burst* (on death or when touched in groups): unparryable red flash, 0.4 s; it leaves a smoke cloud that dims the player's vision and slows posture recovery. Roll through or away.
- **AI read trait:** Unreading (mindless smoke).
- **DRAFT AI IMAGE PROMPT:** "A small malevolent wisp of black furnace smoke from the bottomless pit, a low churning cloud with trailing tendrils and a dim glowing ember heart, a faint mouth-like slit. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full figure, single isolated element. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glow is a dim orange-red ember core. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E2. Se'ir, the Goat-Demon (basic melee)

- **Source [Scripture]:** Leviticus 17:7 (KJV): "they shall no more offer their sacrifices unto devils, after whom they have gone a whoring." Isaiah 34:14 (KJV): "the satyr shall cry to his fellow". Isaiah 13:21 (KJV): "owls shall dwell there, and satyrs shall dance there." (The Hebrew word behind the KJV's "devils" and "satyr" is *se'irim*, literally "hairy ones" or goats. Modern translations such as the NRSVUE render it "goat-demons"; that reading is noted here but not quoted.)
- **Visual:** A shaggy, goat-headed biped of the waste places, with ram-curled horns, a long goat muzzle, digitigrade legs on hooves, matted hair, and a crude hooked blade or shepherd's crook. "The satyr shall cry to his fellow", so they hunt in packs and bleat signals.
- **SPRITE BRIEF**
  - *Silhouette:* Horns curl out wide (the key read from above), a hunched back, a forward muzzle, a hooked blade held low. Simple and readable. **This is the template humanoid rig** for many later demons.
  - *Scale:* M (1.0–1.1×).
  - *Glow map:* Dim ember slit-pupils at idle. Wind-up: the blade edge and eyes flare **orange**. The red-flash charge makes the horns glow **red**.
  - *Puppet parts (13):* head (with jaw), horn L and R, torso, hair-mantle, upper arm L and R, forearm L and R, blade/crook, thigh L and R, shin and hoof L and R (rig knees backward), tail.
  - *Animations:* idle (head bobs, bleat), trot/run, wind-up (rear back, blade high), slash, horn-charge, bleat-call (summons the pack), stagger (head snaps back, horns ring), death (collapses to ash and horn).
- **Role:** Common. **First tier:** 0 (the imps of the Calm Courts' first breaches).
- **Attacks:**
  1. *Hook slash*: parryable, 0.5 s orange blade flash, Med posture. Two-hit string at Tier 3+.
  2. *Overhead chop*: parryable, a 0.8 s slower orange flash, High posture; a good parry teaching tool (delayed timing).
  3. *Horn charge*: **unparryable red**, 1.0 s (it paws the ground, horns go red), then a straight-line charge; roll sideways. On a miss it stumbles (critical window).
  4. *Bleat*: no damage; calls nearby Se'irim to converge (Isaiah 34:14, "the satyr shall cry to his fellow").
- **AI read trait:** Gullible (it bites feints and swings into them), which makes it the ideal first feint lesson.
- **DRAFT AI IMAGE PROMPT:** "A se'ir goat-demon of the wilderness: a hunched shaggy biped with a goat's head, long muzzle and huge curling ram horns, matted hair over its shoulders, digitigrade goat legs on cloven hooves, a short tail, gripping a crude hooked iron blade low in one hand, slit-pupil eyes. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are dim orange ember eyes and a faint orange edge on the blade. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E3. Unclean Frog-Spirit (ranged and area)

- **Source [Scripture]:** Revelation 16:13–14 (KJV): "I saw three unclean spirits like frogs come out of the mouth of the dragon, and out of the mouth of the beast, and out of the mouth of the false prophet. For they are the spirits of devils, working miracles, which go forth unto the kings of the earth and of the whole world, to gather them to the battle of that great day".
- **Lore placement:** In Revelation they "go forth ... to gather them to the battle", so here they are **Hell's heralds and scouts**, among the first to cross into Heaven at Tier 0, gathering the invasion. They also tie back to the dragon (E35), giving a long setup and payoff.
- **Visual:** A squat, bloated frog-thing with a too-wide mouth, warty hide, and a throat sac that glows as it charges a "miracle" (a spat glob of fire-sludge). Long sticky tongue. They come in threes.
- **SPRITE BRIEF**
  - *Silhouette:* A wide, low toad shape, ideal from above. The glowing throat sac and wide mouth are the read.
  - *Scale:* S (0.5×); an Elder variant at Tier 3+ is M.
  - *Glow map:* Throat sac and mouth interior idle at dim ember; the sac inflates **orange** on the spit wind-up and turns **red** for the miracle (area) attack; red ground-decal circles mark landing zones.
  - *Puppet parts (9):* body, head/upper jaw, lower jaw, throat sac (scalable emissive), front leg L and R, back leg L and R, tongue (segmented, 4 pieces).
  - *Animations:* idle (sac pulses), hop, wind-up (sac inflates), spit, tongue-lash, miracle (rears up, three red circles appear), stagger (flips onto its back, a critical window), death (deflates and dissolves into black water).
- **Role:** Common ranged. **First tier:** 0 (scouts at the first breaches).
- **Attacks:**
  1. *Sludge spit*: a parryable projectile (parry reflects it back), 0.7 s orange sac swell, Low posture.
  2. *Tongue lash*: parryable melee at mid range, 0.4 s, Low posture; punishes players who approach carelessly.
  3. *Miracle of fire*: **unparryable red**, 1.4 s. Three red circles appear on the ground (around and ahead of the player) and fire falls on them. Roll out. It must clearly read as telegraph, then danger.
  4. *Gathering croak* (Tier 2+): buffs nearby demons' aggression for 5 s; kill it first.
- **AI read trait:** Wary (it keeps distance and does not bite feints; you must close in).
- **DRAFT AI IMAGE PROMPT:** "An unclean frog-spirit from Revelation 16: a squat bloated demonic toad with an oversized gaping mouth, warty black hide, small cruel eyes, a swollen throat sac glowing from within, long sticky tongue curled at its lips, crouched ready to spit. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are the orange throat sac and orange-red mouth interior. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E4. Legion-Swine

- **Source [Scripture]:** Mark 5:13 (KJV): "the unclean spirits went out, and entered into the swine: and the herd ran violently down a steep place into the sea, (they were about two thousand;) and were choked in the sea."
- **Visual:** A possessed boar, bristled and gaunt, with too many eyes crowding its face (many spirits in one body), foam at the mouth, and tusks. They come in stampeding herds.
- **SPRITE BRIEF**
  - *Silhouette:* A low, long body with a big shoulder hump and tusks; reads like an arrow pointing in its run direction.
  - *Scale:* M (0.8× tall, 1.4× long).
  - *Glow map:* A cluster of dim ember eyes; the eyes turn **red** when it locks onto a stampede line, and a red ground arrow shows the path.
  - *Puppet parts (9):* head (with jaw), tusk overlay, body, hump, legs ×4, tail.
  - *Animations:* idle (snuffling), trot, wind-up (stamp and squeal), stampede, gore, stagger (tumbles), death (bursts into fleeing smoke; the spirits leave).
- **Role:** Common charger. **First tier:** 1.
- **Attacks:**
  1. *Gore*: parryable, 0.5 s orange flash on the tusks, Med posture.
  2. *Stampede*: **unparryable red**, 1.0 s red path arrow, then a straight charge with the whole herd following the leader. Like Mark 5:13 the herd "ran violently down a steep place", so **lure them over ledges or into water** to kill them outright (environmental kill).
- **AI read trait:** Unreading (a herd mind).
- **DRAFT AI IMAGE PROMPT:** "A demon-possessed wild swine: a gaunt bristling black boar with a high shoulder hump, long tusks, foaming mouth, and too many small glowing eyes crowded across its face, mid-charge. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are the cluster of dim orange-red eyes. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E5. Nephil Brute (heavy, hyperarmour)

- **Source [Scripture]:** Genesis 6:4 (KJV): "There were giants in the earth in those days ... the same became mighty men which were of old, men of renown."
- **Source [Enochic tradition]:** 1 Enoch 15:8–9, 11 (Charles): "the giants, who are produced from the spirits and flesh, shall be called evil spirits upon the earth ... Evil spirits have proceeded from their bodies ... And the spirits of the giants afflict, oppress, destroy, attack, do battle, and work destruction on the earth ... they take no food, but nevertheless hunger and thirst".
- **Lore:** In 1 Enoch, the spirits of the giants *are* the origin of evil spirits, which makes the Nephil a genuinely traditional "demon". We depict the **restless giant-spirit**, a hollow, hungering colossus of the ancient world in rusted bronze, not a living human.
- **Visual:** A towering, too-broad giant in archaic bronze scale armour fused to the body, its face hidden behind a corroded bronze helm with an empty mouth-grille (they "hunger and thirst"). It wields a stone-headed maul or uprooted pillar. Cracks across its body leak dim ember.
- **SPRITE BRIEF**
  - *Silhouette:* A massive trapezoid with huge shoulders, a small helmed head, and a maul head as big as the player's torso. From above, the maul's arc is the read.
  - *Scale:* L (2.2×).
  - *Glow map:* Ember cracks; the helm grille glows **orange** on the wind-up; the whole crack network flares **red** during hyperarmour slams.
  - *Puppet parts (14):* helm/head, jaw-grille, torso (front plate), belly, pauldron L and R, upper arm L and R, forearm L and R, maul, thigh L and R, shin and foot L and R.
  - *Animations:* idle (heavy breathing, grille steams), slow walk (heavy footfall dust and a low thud; no screen shake, which is reserved for hits and parries), wind-up (maul drags back), overhead slam, sweep, stomp, stagger (drops to one knee, the critical window), death (collapses into bronze shards and smoke).
- **Role:** Elite heavy. **First tier:** 1 (rare, one per zone), common at Tier 3.
- **Attacks:**
  1. *Maul sweep*: parryable, 0.9 s orange grille glow, **High** posture. A parry staggers its arm but does not stop its next action.
  2. *Hyperarmour overhead slam*: **unparryable red**, 1.3 s red cracks, with hyperarmour (it cannot be interrupted). It leaves a shockwave ring; roll *through* toward it, not away.
  3. *Stomp*: unparryable red, 0.6 s, a short-radius knockback; it punishes hugging it.
  4. *Hunger grab* (Tier 3+): unparryable red grab, 1.0 s; it drains player healing (1 Enoch's "hunger").
- **Posture note:** Huge posture bar that only parries fill quickly. A posture break gives a long critical, and the **critical (R) shatters the helm** (visual payoff).
- **AI read trait:** Unreading (juggernaut; feints are useless, so it teaches players to stop feinting and read hyperarmour).
- **DRAFT AI IMAGE PROMPT:** "A Nephil giant-spirit: a towering hulking colossus in corroded archaic bronze scale armour fused to its body, enormous shoulders, a small head hidden behind a cracked bronze helm with an empty mouth-grille, dragging a huge stone-headed maul, glowing cracks running across its body. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are dim orange-red ember cracks and an orange glow inside the helm grille. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E6. Botis, the Viper-President

- **Source [Goetia tradition]:** Goetia no. 17 (Mathers): "He appeareth at the first show in the form of an ugly Viper, then at the command of the Magician he putteth on a Human shape with Great Teeth, and two Horns, carrying a bright and sharp Sword in his hand."
- **Visual:** Phase 1 is a thick-bodied, ugly viper with a wedge head. Phase 2 is a gaunt humanoid with an overlarge grin of great teeth, two horns, and a bright, sharp sword.
- **SPRITE BRIEF**
  - *Silhouette:* Phase 1 is a coiled S-curve (great from above). Phase 2 is a lanky swordsman, with horns and a sword making an X.
  - *Scale:* M (viper 1.5× long; humanoid 1.1×).
  - *Glow map:* The sword is a **dim** pale-orange edge that flares orange on wind-ups; the teeth glint; venom spit glows red.
  - *Puppet parts:* Viper (8): head, jaw, 5 body segments, tail tip. Humanoid (13): head, jaw (teeth), horns ×2, torso, arms ×2 (2 segments each), sword, legs ×2 (2 segments each).
  - *Animations:* viper idle, slither, strike, spit; transform (sheds its skin and rises); humanoid idle, walk, slash combo, lunge, stagger, death.
- **Name plate:** Botis, *President of the Pit* (the Ars Goetia makes him a President and an Earl; the first rank is shown).
- **Role:** Elite (two-phase duellist). **First tier:** 1.
- **Attacks:**
  1. *Viper strike*: parryable, 0.4 s fast orange glint, Low posture.
  2. *Venom spit*: unparryable red projectile, 0.8 s; leaves poison on the ground.
  3. *Bright sword 3-hit combo* (phase 2): parryable, orange each hit (0.5/0.3/0.7 s, mixed rhythm), Med posture. It teaches rhythm parrying.
  4. *Shed-and-strike*: at half health it dives underground and re-emerges in its humanoid form with a red-flash uppercut (unparryable).
- **AI read trait:** Wary (Presidents and Earls are wary readers in the progression doc). It waits feints out and answers with a quick viper strike.
- **DRAFT AI IMAGE PROMPT:** "Botis, a demon of the Goetia, in his human shape: a gaunt sinewy humanoid with an unnaturally wide grin of great sharp teeth, two horns rising from his brow, a shed viper skin trailing from his shoulders like a cloak, carrying a bright sharp sword. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are a dim orange sword edge and orange ember eyes. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source." *(Second prompt for phase 1: "an ugly thick-bodied black viper with a wedge head, coiled to strike...")*

---

### E7. Malphas, the Tower-Raiser (with Halphas variant)

- **Source [Goetia tradition]:** Goetia no. 39 (Mathers): "He appeareth at first like a Crow, but after he will put on Human Shape at the request of the Exorcist, and speak with a hoarse Voice ... He can build Houses and High Towers, and can bring to thy Knowledge Enemies' Desires and Thoughts ... If thou makest a Sacrifice unto him he will receive it kindly and willingly, but he will deceive him that doth it." Goetia no. 38, **Halphas**: "appeareth in the Form of a Stock-Dove ... His Office is to build up Towers, and to furnish them with Ammunition and Weapons, and to send Men-of-War to places appointed."
- **Visual:** Malphas is a great crow-headed figure in a ragged feather cloak with a mason's iron staff. He raises black stone spire-turrets from the ground. Halphas is a dove-headed (stock-dove) quartermaster with a satchel of weapons, sending Se'irim forward. (A demon with a dove's head is deliberately unsettling.)
- **SPRITE BRIEF**
  - *Silhouette:* Malphas has a beak and a hood with a feather cloak spread wide, plus the staff. The **tower** is a separate prop sprite: a crooked black spire with an ember window.
  - *Scale:* M+ (1.3×); towers 2×.
  - *Glow map:* Ember eyes; the staff tip glows **orange** while raising a tower; tower windows go orange before firing and **red** at full charge.
  - *Puppet parts (12):* crow head (with beak hinge), hood, cloak ×2 wings, torso, arms ×2, staff, legs ×2 (bird-clawed feet); tower prop (3 parts: base, shaft, crown).
  - *Animations:* idle, hop-walk, flock-dash (dissolves into crows and reforms), raise tower (staff slam, the tower rises), caw-curse, stagger, death (bursts into crows).
- **Name plate:** Malphas, *President of the Pit*; the variant is Halphas, *Earl of the Pit*.
- **Role:** Elite summoner and controller. **First tier:** 1 (Malphas a President, the Halphas variant an Earl).
- **Attacks:**
  1. *Raise tower*: 1.5 s orange staff glow, then a spire erupts. The spire fires orange-telegraphed bolts (parryable, reflectable) every 3 s until destroyed. Towers carry their own posture; parried bolts damage them.
  2. *Staff jab*: parryable, 0.5 s, Low.
  3. *Crow scatter*: unparryable red, 0.8 s; he bursts into a crow swarm that sweeps a cone, then reforms behind the player.
  4. *"Enemies' thoughts"* (Game invention from his lore): he reads the player's last three actions and counters the most frequent one.
- **AI read trait:** Wary (a President). He "will deceive him", so his *Enemies' thoughts* counter does the punishing rather than his read.
- **DRAFT AI IMAGE PROMPT:** "Malphas, a demon of the Goetia: a tall figure with the head of a huge black crow, a hooded cloak of ragged black feathers spread like wings, bird-clawed feet, holding a mason's iron staff, beside a small crooked black stone spire with a glowing window. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are orange ember eyes, an orange staff tip and an orange tower window. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E8. Abyssal Locust

- **Source [Scripture]:** Revelation 9:3, 5, 7–10 (KJV): "there came out of the smoke locusts upon the earth: and unto them was given power, as the scorpions of the earth have power ... their torment was as the torment of a scorpion, when he striketh a man ... And the shapes of the locusts were like unto horses prepared unto battle; and on their heads were as it were crowns like gold, and their faces were as the faces of men. And they had hair as the hair of women, and their teeth were as the teeth of lions. And they had breastplates, as it were breastplates of iron; and the sound of their wings was as the sound of chariots of many horses running to battle. And they had tails like unto scorpions, and there were stings in their tails".
- **Visual (every clause used):** A horse-bodied locust in battle barding, crowned with something *like* gold, a human face, long flowing hair, lion's teeth, an iron breastplate, roaring chariot-wings, and a scorpion tail with a sting. Beatus manuscripts and Dürer's woodcuts both show them as hybrid war-horses. **Glow rule exception:** "crowns like gold" should be **tarnished dull brass with no glow** (gold glow is Heaven's).
- **SPRITE BRIEF**
  - *Silhouette:* A horse body with two pairs of insect wings spread flat (strong from above) and a scorpion tail arching forward over the back. The human face with long hair is unsettling at the front.
  - *Scale:* L (1.6× long, 1.1× tall).
  - *Glow map:* Ember eyes; the sting goes **orange** on the wind-up and **red** for the unparryable pin; wing membranes faint ember.
  - *Puppet parts (16):* head (face), hair mass (2), jaw (lion teeth), crown, neck, thorax with breastplate, abdomen, wings ×4, legs ×4, tail (4 segments) plus sting.
  - *Animations:* idle (wings buzz), gallop-hover, wind-up (tail arcs), sting, swoop, hair-whip, stagger (falls, wings crumple), death (husk cracks, smoke).
- **Role:** Common (Tier 2's signature swarm). **First tier:** 0 as lone scouts; swarms from Tier 2, when the crowned locusts become wary elites (progression doc).
- **Attacks:**
  1. *Lion bite*: parryable, 0.5 s, Med.
  2. *Scorpion sting*: parryable, 0.7 s orange sting; on hit it applies **Torment** (a damage-over-time "five months" debuff that blocks healing for 5 s).
  3. *Swooping pin*: **unparryable red**, 1.1 s; it takes off and dives (red ground marker).
- **Lore mechanic:** Revelation 9:4 says they must not hurt "any green thing" and may hurt only those without the seal on their foreheads, so in game the **Linen Scribes' mark (A5) reduces Torment duration**.
- **AI read trait:** Gullible as Tier 0 scouts; Unreading in swarms; the crowned elites of Tier 2 are Wary.
- **DRAFT AI IMAGE PROMPT:** "An abyssal locust from Revelation 9: a monstrous war-horse-shaped locust with two pairs of insect wings, an iron breastplate, a tarnished brass crown on its head, a pale human face framed by long flowing hair, a mouth of lion's teeth, and a segmented scorpion tail with a sting arching over its back. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are dim orange ember eyes and an orange sting tip; the crown is dull tarnished metal, not glowing. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E9. Glasya-Labolas, the Winged Hound

- **Source [Goetia tradition]:** Goetia no. 25 (Mathers): "showeth himself in the form of a Dog with Wings like a Gryphon ... is an Author of Bloodshed and Manslaughter ... He can make a Man to go Invisible."
- **Visual:** A lean, mastiff-like hound with gryphon (eagle) wings, a blood-matted muzzle, and a shimmer of invisibility along its flank.
- **SPRITE BRIEF**
  - *Silhouette:* A four-legged hound with wings folded high (flat-spread when leaping). Reads as "flying dog".
  - *Scale:* M (1.0× tall, 1.5× long).
  - *Glow map:* Ember eyes; **when invisible only the eyes and an ember shimmer outline remain**. That is the fair tell. Orange jaw flash on the wind-up.
  - *Puppet parts (12):* head, jaw, neck, body, wings ×2 (2 segments each), legs ×4, tail.
  - *Animations:* idle (pants), run, vanish (fades to its eye-glow), reappear-pounce, bite, wing-buffet, stagger, death.
- **Name plate:** Glasya-Labolas, *President of the Pit* (a President and an Earl; the first rank is shown).
- **Role:** Elite flanker. **First tier:** 1 (a President and Earl).
- **Attacks:**
  1. *Bite*: parryable, 0.4 s, Med.
  2. *Invisible pounce*: parryable (orange eyes flare 0.6 s before the leap), High posture. The audio cue is a growl.
  3. *Wing buffet*: unparryable red, 0.7 s; knockback cone.
- **Counter:** Any holy-light skill reveals it.
- **AI read trait:** Wary.
- **DRAFT AI IMAGE PROMPT:** "Glasya-Labolas, a demon of the Goetia: a lean savage mastiff-like hound with great eagle-feathered gryphon wings half raised, a blood-darkened muzzle, bared fangs, ribs showing, its hindquarters fading into a shimmering transparency. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are orange-red eyes and a faint orange shimmer along the fading flank. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E10. Furfur, the Storm-Hart

- **Source [Goetia tradition]:** Goetia no. 34 (Mathers): "appearing in the Form of an Hart with a Fiery Tail. He never speaketh truth unless he be compelled, or brought up within a triangle ... Being therein, he will take upon himself the Form of an Angel ... He can raise Lightnings and Thunders, Blasts, and Great Tempestuous Storms."
- **Visual:** A great black stag with branching antlers that crackle like lightning, and a long burning tail like a comet's.
- **SPRITE BRIEF**
  - *Silhouette:* Antlers make a huge, spiky crown from above, with a long fire tail trailing behind.
  - *Scale:* L (1.8×).
  - *Glow map:* Ember eyes; antlers charge **orange** (crackling) before a strike; red lightning circles mark impact; the tail is a constant low orange flame. **Phase 2 "Form of an Angel"**: the stag stands upright as a false angel with **fake gold** that gutters to red (a corrupted-angel tease).
  - *Puppet parts (13):* head, antler L and R, jaw, neck, body, legs ×4, tail (3 flame segments); phase-2 angel overlay (4 parts: torso, wings ×2, false halo).
  - *Animations:* idle (antlers spark), canter, rear-up wind-up, lightning call, antler charge, tail lash, stagger, transform-to-angel, death.
- **Name plate:** Furfur, *Earl of the Pit*.
- **Role:** Elite area controller (the first caster). **First tier:** 1 (an Earl).
- **Attacks:**
  1. *Lightning call*: **unparryable red**, 1.2 s; three to five red circles near the player, then bolts.
  2. *Antler charge*: parryable, 0.8 s orange antlers, High posture.
  3. *Tail lash*: parryable, 0.5 s, Med; leaves a fire strip.
  4. *Liar's light* (phase 2): it mimics an ally angel's gold glow to bait the player, then strikes with red. Trains players to trust only true gold.
- **Deceiver (section 1.3):** Before the fight, Furfur scatters **fake Vision motes** along a forest path to draw the player into its lightning circles. They flicker red at the edges.
- **AI read trait:** Wary (an Earl). "Never speaketh truth": its *Liar's light* does the deceiving.
- **DRAFT AI IMAGE PROMPT:** "Furfur, a demon of the Goetia: a great black hart stag with vast branching antlers crackling with lightning and a long comet-like tail of fire, rearing, storm energy around its hooves. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are orange lightning on the antlers, an orange-red fiery tail and ember eyes. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E11. Marchosias, the Fire-Wolf (Fallen Domination)

- **Source [Goetia tradition]:** Goetia no. 35 (Mathers): "appearing at first in the Form of a Wolf having Gryphon's Wings, and a Serpent's Tail, and Vomiting Fire out of his mouth. But after a time, at the command of the Exorcist he putteth on the Shape of a Man. And he is a strong fighter. He was of the Order of Dominations ... He told his Chief, who was Solomon, that after 1,200 years he had hopes to return unto the Seventh Throne."
- **Visual:** A huge wolf with gryphon wings, a serpent tail, and a fire-belching maw. Its human form is a scarred warrior. **Story hook:** he is a fallen Domination who hopes to return, so he is a candidate for a redemption or "spare" choice (see section 6).
- **SPRITE BRIEF**
  - *Silhouette:* A wolf with spread wings and an S-curve serpent tail; the flame breath cone is the key read.
  - *Scale:* L (1.6×).
  - *Glow map:* Ember eyes; the throat glows **orange** (0.9 s) before fire breath; ember inside the wing feathers; *faint, hidden gold* in the chest (the remnant of a Domination) that brightens if spared.
  - *Puppet parts (15):* head, jaw, neck/ruff, body, wings ×2 (2 segments each), legs ×4, serpent tail (4 segments).
  - *Animations:* idle, lope, wind-up (inhale), fire breath, claw combo, wing-dash, tail whip, stagger, kneel (the spare option), death.
- **Name plate:** Marchosias, *Marquis of the Pit*.
- **Role:** Elite and optional mini-boss duel. **First tier:** 2.
- **Attacks:**
  1. *Claw combo*: parryable, 2 hits (0.5/0.4 s), Med. "A strong fighter."
  2. *Fire breath*: **unparryable red** cone, after a 0.9 s orange throat. Roll to its flank.
  3. *Wing-dash*: parryable, 0.6 s, High.
  4. *Serpent tail whip*: unparryable red, a rear sweep that punishes standing behind it.
- **AI read trait:** Adaptive.
- **DRAFT AI IMAGE PROMPT:** "Marchosias, a fallen angel of the Goetia in wolf form: an enormous black wolf with great gryphon eagle wings, a long scaled serpent's tail, fire spilling from its jaws, a faint hidden glow in its chest. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are orange-red fire in the mouth, ember eyes and a very faint gold ember in the chest. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E12. Lilith, the Night-Creature

- **Source [Scripture]:** Isaiah 34:14 (KJV): "The wild beasts of the desert shall also meet with the wild beasts of the island, and the satyr shall cry to his fellow; the screech owl also shall rest there, and find for herself a place of rest." The KJV's "screech owl" translates the Hebrew *lilith*, which modern translations such as the NRSVUE keep as the name Lilith (noted here, not quoted).
- **Tradition [Later tradition]:** Lilith "does not appear in the Hebrew Bible or any other biblical source" except this word in Isaiah 34:14, whose meaning ranges "from a primordial she-demon to a night bird". She appears in Jewish incantation bowls and medieval folklore (Wikipedia, *Lilith*).
- **Visual (our design follows the owl/night-creature reading):** A gaunt, owl-like night-hag of the ruins, with an owl's facial disc and huge eyes, long taloned bird-feet, and a tattered feather-shroud for a robe. **Not sexualised** (see section 6). She rests in ruins; she ambushes from perches.
- **SPRITE BRIEF**
  - *Silhouette:* A tall, hunched, shrouded figure with an owl-disc face and great eyes; feathered "sleeves" spread into wings on the dive.
  - *Scale:* M+ (1.3×).
  - *Glow map:* Two huge ember eyes (the only things visible in darkness); a screech wind-up makes the eyes flare **orange**; red sonic rings.
  - *Puppet parts (12):* head (facial disc), eyes (emissive, separate), beak, shroud torso, shroud wings ×2 (2 segments each), arms with talons ×2, legs with bird-feet ×2.
  - *Animations:* perch idle (head swivels), silent glide, screech wind-up, screech, talon rake, dive, stagger, death (feathers scatter).
- **Role:** Elite ambusher in ruin zones (night). **First tier:** 2.
- **Attacks:**
  1. *Silent dive*: parryable, 0.6 s (eyes flare orange in the dark), High.
  2. *Talon rake*: parryable, 2 hits, Med.
  3. *Screech*: **unparryable red**, 1.0 s; expanding rings that freeze posture recovery. Roll through the ring.
- **AI read trait:** Wary.
- **DRAFT AI IMAGE PROMPT:** "A night-creature of the ruins from Isaiah 34, an owl-like demonic hag: a gaunt hunched figure in a tattered shroud of black owl feathers, an owl's facial disc with two huge glowing eyes and a hooked beak, long taloned bird feet, feathered arms half spread like wings. Unsexualised, eerie and ancient. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are the two large orange ember eyes. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E13. Legion (roaming elite)

- **Source [Scripture]:** Mark 5:3–5, 9 (KJV): "no man could bind him, no, not with chains: Because that he had been often bound with fetters and chains, and the chains had been plucked asunder by him, and the fetters broken in pieces ... always, night and day, he was in the mountains, and in the tombs, crying ... What is thy name? And he answered, saying, My name is Legion: for we are many."
- **Design stance:** The man in Mark 5 is a *victim* who is healed. **We do not depict him.** Our Legion is the spirit-host itself: a heaving mass of many shadow-bodies, faces and arms, wrapped in broken chains, risen from a tomb-field.
- **Visual:** A writhing mound of many dark figures fused together, with dozens of faces crying, hands reaching, and snapped fetters and chains dragging from it.
- **SPRITE BRIEF**
  - *Silhouette:* A wide, lumpy mound with arms sprouting from it and chains radiating outward, very readable from above. It *splits* into smaller pieces as it loses health.
  - *Scale:* XL (3× wide), splitting into L, then M "fragments".
  - *Glow map:* Many tiny ember eyes; the chains glow **orange** before a chain-whip; the core turns **red** before the "We are many" burst.
  - *Puppet parts (20+):* core mass (3 layers), 6–8 reaching arms (2 segments each), 6 face plates (swap-animated), 4 chain rigs (segmented), tomb debris.
  - *Animations:* idle (writhes, murmuring chorus), crawl, chain-whip wind-up, chain-whip, grasp, "We are many" burst, split (into 3, then 9), stagger, death (scatters like a herd fleeing).
- **Role:** Elite (roaming). **First tier:** 1, roaming the open map; its tomb-field lair is a set-piece.
- **Attacks:**
  1. *Chain-whip*: parryable, 0.7 s orange chain, Med; parrying a chain "plucks it asunder" (removes one attack option).
  2. *Many hands grasp*: **unparryable red** grab, 1.0 s; roll out.
  3. *"We are many"*: red burst, 1.5 s; it splits into 3 bodies, and at low health into 9 Legion-Swine-like crawlers.
- **AI read trait:** Adaptive, with one memory shared by every body (progression doc). A feint one fragment has learned works on none of them.
- **DRAFT AI IMAGE PROMPT:** "Legion, a host of many unclean spirits fused into one: a writhing mound of dozens of shadowy bodies, crying faces and reaching arms tangled together, wrapped in snapped iron fetters and broken chains trailing outward, rising from among tombstones. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are many tiny orange ember eyes and faint orange highlights on the chains. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E14. Abaddon / Apollyon, King of the Locusts (Corrupted angel, boss)

- **Source [Scripture]:** Revelation 9:1–2, 11 (KJV): "I saw a star fall from heaven unto the earth: and to him was given the key of the bottomless pit. And he opened the bottomless pit". Revelation 9:11: "they had a king over them, which is the angel of the bottomless pit, whose name in the Hebrew tongue is Abaddon, but in the Greek tongue hath his name Apollyon."
- **Note:** Scripture calls him "the angel of the bottomless pit". Whether he is fallen is debated; the *Dictionnaire Infernal* lists "Abaddon/Apollyon" among demons. Our game treats him as a **corrupted angel**, a fallen star holding the Pit's key (Dan may prefer the neutral reading; see section 6).
- **Visual (our design):** A fallen-star angel: a tall armoured figure whose halo has collapsed into a smouldering iron ring of keys. He wears locust-plate armour (an iron breastplate, the locusts' own) and has four insect wings over two broken feathered ones. He carries **the key of the bottomless pit** as a huge greatkey-mace. His gold light is choked by red.
- **SPRITE BRIEF**
  - *Silhouette:* A tall king with a mix of feathered and insect wings, the key-mace, and a crown like a halo snapped in half.
  - *Scale:* L–XL (2.5×).
  - *Glow map:* **Gold cracked with red** on the armour seams; the key glows red-orange; locust swarms orbit with ember eyes; the wind-up glow on the key head is orange, and red for pit-opening attacks.
  - *Puppet parts (20):* head, broken halo-crown, torso plate, abdomen, feather wings ×2 (broken), insect wings ×4, arms ×2 (2 segments each), key-mace, legs ×2 (2 segments each), tabard, locust orbit sprites (reuse E8, scaled down).
  - *Animations:* idle (swarm orbits), walk, key slam wind-up, key slam, sweeping combo, open-the-Pit (rams the key into the ground; smoke and locusts rise), wing hover, stagger, death (falls like a star, a light streak).
- **Role:** Boss (end of Tier 2). **First tier:** 1, where his vanguard is the first world boss; fought himself at Tier 2.
- **Attacks:**
  1. *Key-mace combo*: parryable 3-hit, orange (0.6/0.4/0.9 s), High posture; the third hit is delayed.
  2. *Open the Pit*: **unparryable red**, 2.0 s; smoke columns erupt at 4–6 marked points and spawn locusts (E8) and wisps (E1).
  3. *Falling star*: red, 1.5 s; he leaps skyward and crashes down on the marked spot, a big AoE. Roll at the last moment.
  4. *King's command*: locusts dive in formation (orange-telegraphed, parryable individually).
- **Phases:** In phase 2 (50%) he loses his feathered wings and becomes faster and insect-like.
- **AI read trait:** Adaptive.
- **DRAFT AI IMAGE PROMPT:** "Abaddon, Apollyon, the fallen angel-king of the bottomless pit: a tall armoured fallen angel in iron locust-plate armour, two broken feathered wings and four translucent insect wings, a shattered half halo like a cracked crown, holding a giant ornate iron key as a mace, a swarm of small crowned locusts circling him, gold light inside his armour seams choked by red. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; emissive glows are dim gold cracked with red in the armour seams, an orange-red glowing key and orange ember eyes. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E15. The Branded (sigil-thralls)

- **Source [Scripture]:** Revelation 13:16–17 (KJV): "he causeth all, both small and great, rich and poor, free and bond, to receive a mark in their right hand, or in their foreheads: And that no man might buy or sell, save he that had the mark".
- **Source [Goetia tradition]:** Every Goetic spirit has a seal; the *Observations* section says "The Seals of the 72 Kings are to be made in Metals," with a metal assigned to each rank.
- **Interpretation [Game invention]:** The Branded are lesser demons **branded with the sigil of their Goetic master**, Hell's organised infantry. At Tier 0 they carry Knights' brands; by Tier 3, "the Brands", they carry their Kings'. They are demons, not marked humans (see section 6). Their brand-metal matches their master's rank (gold-coloured for Kings, silver for Marquises, copper for Dukes), rendered as **dull, unlit metal**.
- **Visual:** Hollow-eyed, ash-skinned demon soldiers in crude armour, each with a burning brand-sigil on the forehead and right hand (the Revelation placement). The sigil design is invented, not a real Goetic seal. Weapons vary by king: spear (Bael), cymbal-blades (Paimon), lance (Asmodeus).
- **SPRITE BRIEF**
  - *Silhouette:* The Se'ir rig re-proportioned upright and armoured; the forehead brand reads as a bright dot from above.
  - *Scale:* M (1.1×).
  - *Glow map:* Forehead and hand brand at dim ember; the brand flares **orange** on wind-ups; **red** when "branded rage" activates near their King.
  - *Puppet parts (13, reusing the E2 rig):* head (with brand), helm, torso, shield or off-hand, arms ×2 (2 segments each), weapon (swappable), legs ×2 (2 segments each).
  - *Animations:* idle, march, wind-up, thrust or slash, shield bash, formation brace, stagger, death (the brand burns out, then the body crumbles).
- **Role:** Common (infantry). **First tier:** 0, branded by Goetic Knights. A **Knight captain** variant (bigger, with a banner) guards the first breach as a mini-boss (progression doc).
- **Attacks:**
  1. *Weapon strike*: parryable, 0.5 s, Med.
  2. *Shield bash*: parryable, 0.4 s, High (posture pressure).
  3. *Phalanx brace*: they lock shields in formation and frontal hits are blocked; flank them or parry the counter-thrust.
  4. *Branded rage*: when their King is nearby, they gain hyperarmour on one attack (red flash).
- **AI read trait:** Gullible alone, **Wary in formation**.
- **DRAFT AI IMAGE PROMPT:** "A branded demon soldier of Hell: an ash-grey hollow-eyed demonic infantryman in crude blackened armour with a round shield and spear, a burning sigil branded on its forehead and on the back of its right hand. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are the orange brand marks on forehead and hand and dim ember eyes. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E16. Andras, the Raven-Angel on the Black Wolf (Corrupted angel)

- **Source [Goetia tradition]:** Goetia no. 63 (Mathers): "appearing in the Form of an Angel with a Head like a Black Night Raven, riding upon a strong Black Wolf, and having a Sharp and Bright Sword flourished aloft in his hand. His Office is to sow Discords. If the Exorcist have not a care, he will slay both him and his fellows."
- **Visual:** An angel's body and wings with a raven's head, riding a huge black wolf, a bright sword held aloft. A perfect corrupted-angel elite, and the clearest "angel turned enemy" read at Tier 2, when corrupted angels first appear as rare elites.
- **SPRITE BRIEF**
  - *Silhouette:* Rider and mount: the wolf's long body, the angel's spread wings, the raven beak and the raised sword. Very strong from above.
  - *Scale:* L (2×).
  - *Glow map:* The angel's wing edges are **dull gold cracked with red**; the sword is a pale edge that flares **orange** on the wind-up; the wolf's eyes are ember.
  - *Puppet parts (22):* Rider (12): raven head, beak hinge, torso, wings ×2 (2 segments each), arms ×2, sword, legs ×2 (hidden mostly). Wolf (10): head, jaw, neck, body, legs ×4, tail.
  - *Animations:* idle (wolf prowls), run, rider sword wind-up, mounted slash, wolf lunge-bite, "discord" caw, dismount (phase 2, the wolf and rider fight separately), stagger (the rider is unseated), death.
- **Name plate:** Andras, *Marquis of the Pit*.
- **Role:** Elite (mounted duel). **First tier:** 2 (a Marquis).
- **Attacks:**
  1. *Mounted sword sweep*: parryable, 0.7 s orange, High.
  2. *Wolf lunge*: parryable, 0.5 s, Med.
  3. *Trample charge*: unparryable red, 1.0 s, a straight line.
  4. *Sow Discord*: red, 1.2 s; a caw that makes nearby **demons attack each other or, crucially, can turn the player's allied NPCs briefly hostile**. A reason to fight him away from allies.
- **AI read trait:** Adaptive.
- **DRAFT AI IMAGE PROMPT:** "Andras, a fallen angel of the Goetia: an angel with the head of a black night raven and great dark feathered wings, raising a sharp bright sword aloft, riding a huge strong black wolf mid-stride, faint gold in the feather edges cracked with red. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; emissive glows are dim gold cracked with red on wing edges, a pale orange sword edge and orange wolf eyes. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E17. Sabnock, the Lion-Headed Soldier

- **Source [Goetia tradition]:** Goetia no. 43 (Mathers): "appearing in the Form of an Armed Soldier with a Lion's Head, riding on a pale-coloured horse. His office is to build high Towers, Castles and Cities, and to furnish them with Armour ... Also he can afflict Men for many days with Wounds and with Sores rotten and full of Worms."
- **Visual:** A heavily armoured knight with a lion's head and mane spilling from the gorget, on a pale (ash-grey) warhorse; tower-shield and flanged mace. **Glow note:** "pale-coloured" becomes a pallid grey, which stays monochrome.
- **SPRITE BRIEF**
  - *Silhouette:* A broad, mounted heavy with a tower shield and mane. Distinct from Andras: bulk instead of wings.
  - *Scale:* L (2.2×).
  - *Glow map:* Ember lion eyes; the mace head flares **orange**; wound-rot debuff motes are red.
  - *Puppet parts (20):* lion head, jaw, mane, torso armour, shield, mace, arms ×2 (2 segments each); horse head, neck, body, legs ×4, tail.
  - *Animations:* idle, trot, shield-raise, mace wind-up, overhead smash, shield charge, roar, stagger, death.
- **Name plate:** Sabnock, *Marquis of the Pit*.
- **Role:** Elite heavy (mounted). **First tier:** 2 (a Marquis).
- **Attacks:**
  1. *Mace smash*: parryable, 0.9 s orange, **Break** if blocked (parry or roll only).
  2. *Shield charge*: unparryable red, 1.0 s, with hyperarmour.
  3. *Rotting wound*: any hit applies **Rot** (stacking: reduces max health until cleansed at a seraph's altar).
  4. *Lion's roar*: red, 0.8 s, a short stun cone.
- **AI read trait:** Wary.
- **DRAFT AI IMAGE PROMPT:** "Sabnock, a demon of the Goetia: an armoured knight with a lion's head and heavy mane spilling from his plate gorget, holding a tower shield and flanged mace, riding a pale ash-grey warhorse in black barding. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base with pallid grey horse; only emissive glows are orange ember lion eyes and a dim orange mace head. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E18. Bael, the Threefold King (roaming King boss)

- **Source [Goetia tradition]:** Goetia no. 1 (Mathers): "The First Principal Spirit is a King ruling in the East, called Bael. He maketh thee to go Invisible. He ruleth over 66 Legions of Infernal Spirits. He appeareth in divers shapes, sometimes like a Cat, sometimes like a Toad, and sometimes like a Man, and sometimes all these forms at once. He speaketh hoarsely."
- **Art reference:** Le Breton's *Dictionnaire Infernal* plate famously shows Bael as a crowned man's head between a cat's and a toad's head on spider legs. (Use it as reference only; the Mathers text is the source.)
- **Visual:** "All these forms at once": a crowned central man's face flanked by a cat head and a toad head, carried on long, jointed legs. A King of the East wearing a dull crown.
- **SPRITE BRIEF**
  - *Silhouette:* Three heads in a row on a small body with radiating long legs. The most bizarre, memorable top-down shape in the roster.
  - *Scale:* L (2× wide).
  - *Glow map:* Each head has its own glow: the cat head's eyes go **orange** for melee, the toad head's throat goes **orange** for spit (reuse the E3 language), and the man head's crown turns **red** before the invisibility phase.
  - *Puppet parts (18):* man head (with jaw), crown, cat head (with jaw), toad head (with jaw and throat sac), central body, legs ×8 (2 segments each, or ×6 to save effort), Branded summon sprites.
  - *Animations:* idle (the heads bicker), skitter, cat swipe, toad spit, man's hoarse command, vanish (Invisible), reappear, head-loss (each head can be broken off), stagger, death.
- **Name plate:** Bael, *King of the Pit*.
- **Role:** Boss (a King roaming the Tier 3 map). **First tier:** 3.
- **Attacks:**
  1. *Cat swipe*: parryable, 0.4 s, Med.
  2. *Toad spit*: parryable projectile (reflectable), 0.7 s; the area variant is red.
  3. *Hoarse decree*: summons 2–3 Branded (E15) with his brand.
  4. *Go Invisible*: red crown flash, then he vanishes; only the footstep decals show. A holy-light skill reveals him.
- **Mechanic:** Each head has separate posture. Breaking one head removes its attack set. Breaking all three triggers a King critical.
- **AI read trait:** Adaptive, led by the man head (every King is adaptive in the progression doc). Proposal: the cat head bites feints and the toad head ignores them, so breaking heads changes the puzzle (section 6).
- **DRAFT AI IMAGE PROMPT:** "Bael, first king of the Goetia: a grotesque demon with three heads side by side (a crowned bearded man's head in the centre, a snarling cat's head on one side and a warty toad's head on the other) set on a small body carried by long jointed spider-like legs. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base, dull tarnished crown; only emissive glows are orange ember eyes on each head and an orange glow in the toad's throat. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E19. Paimon, the King on the Dromedary (roaming King boss)

- **Source [Goetia tradition]:** Goetia no. 9 (Mathers): "a Great King ... He appeareth in the form of a Man sitting upon a Dromedary with a Crown most glorious upon his head. There goeth before him also an Host of Spirits, like Men with Trumpets and well sounding Cymbals, and all other sorts of Musical Instruments. He hath a great Voice, and roareth at his first coming". (Mathers adds that he "is of the Order of Dominations".)
- **Visual:** A crowned king riding a dromedary, preceded by a procession of spirit-musicians with trumpets and cymbals. He is a mirror of Heaven's trumpet angels (A6). **Glow rule:** the "crown most glorious" is the one place a Hell crown may glow, and it glows **red-orange**, never gold.
- **Sensitivity:** Avoid real-world Middle-Eastern or Islamic coding in costume (see the Dürer note in section 2D and section 6). Make his court abstract-infernal: bone, brass and black silk.
- **SPRITE BRIEF**
  - *Silhouette:* The camel's hump plus a tall crowned rider plus a train of small musicians. A procession reads beautifully from above as a moving line.
  - *Scale:* XL (3× including the mount); musicians M.
  - *Glow map:* The crown is red-orange (constant); trumpet bells glow **orange** before a sonic attack and **red** for the roar.
  - *Puppet parts (18 for the king and mount + 8 per musician):* rider head, crown, torso, arms ×2, sceptre, robe; dromedary head, neck, hump-body, legs ×4, tail; musician (body, head, arms ×2, instrument, legs ×2, cloak).
  - *Animations:* idle (the procession plays), march, roar (first-coming roar), sceptre wind-up, sonic blast, cymbal crash (musicians), dismount, stagger, death.
- **Name plate:** Paimon, *King of the Pit*.
- **Role:** Boss (a King roaming the Tier 3 map). **First tier:** 3.
- **Attacks:**
  1. *Roar at his coming*: **unparryable red**, 1.2 s; a screen-wide posture-damage wave. Roll i-frames negate it.
  2. *Trumpet volley* (musicians): parryable sound-bolts, orange bells (0.6 s); reflect them to kill musicians.
  3. *Cymbal crash ring*: red, 0.8 s, a ring around each cymbalist.
  4. *Sceptre strike*: parryable, 0.7 s, High.
- **Mechanic:** Kill the musicians first and Paimon loses his buffs ("a great voice ... the Magician cannot well understand"); his roar weakens.
- **AI read trait:** Adaptive (a King); the musicians are Gullible.
- **DRAFT AI IMAGE PROMPT:** "Paimon, a great king of the Goetia: a stern crowned demon king in black and bone-white robes seated on a gaunt black dromedary camel, a tall glorious crown on his head, sceptre raised, mouth open roaring. Abstract infernal regalia, no real-world cultural costume. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body including the mount, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are the red-orange crown and orange ember eyes. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source." *(Separate prompt per musician: "a spirit-musician of Paimon's host, a gaunt robed demon blowing a long brass trumpet...".)*

---

### E20. Asmodeus, the Three-Headed King (boss)

- **Source [Deuterocanon]:** Tobit 3:8 (KJV Apocrypha): "she had been married to seven husbands, whom Asmodeus the evil spirit had killed, before they had lain with her." Tobit 8:3: "The which smell when the evil spirit had smelled, he fled into the utmost parts of Egypt" (the smell is the smoke of the fish's heart and liver, 8:2; the rest of the verse names a reserved figure and is left out).
- **Source [Goetia tradition]:** Goetia no. 32, "Asmoday" (Mathers): "He appeareth with Three Heads, whereof the first is like a Bull, the second like a Man, and the third like a Ram; he hath also the tail of a Serpent, and from his mouth issue Flames of Fire. His Feet are webbed like those of a Goose. He sitteth upon an Infernal Dragon, and beareth in his hand a Lance with a Banner."
- **Visual (every clause used):** Three heads (bull, man, ram), a serpent tail, fire from the mouth, webbed goose-feet, riding an infernal dragon, carrying a lance with a banner.
- **SPRITE BRIEF**
  - *Silhouette:* A rider with three heads (bull horns and ram curls make a wide crown of horns) on a low, long-necked dragon mount, with a lance and a long banner streaming. The banner is a great motion read from above.
  - *Scale:* XL (3.5× including the mount).
  - *Glow map:* The mouths glow orange before fire and red during it; the banner sigil is dull ember; the dragon mount's throat glows orange.
  - *Puppet parts (28):* rider: bull head, man head, ram head (each with a jaw), torso, arms ×2 (2 segments each), lance, banner (3-segment cloth rig), serpent tail (4 segments), goose-feet ×2; dragon: head, jaw, neck (3 segments), body, wings ×2, legs ×4, tail (4 segments).
  - *Animations:* idle, stride, lance charge, lance thrust combo, triple fire breath, dragon bite, tail sweep, dismount (phase 2: he fights on foot, goose-feet slapping), flee (if the fish-smoke item is used, Tobit 8:3), death.
- **Name plate:** Asmodeus, *King of the Pit* (Mathers spells the Goetic name Asmoday; the game uses Tobit's spelling).
- **Role:** Boss (a King roaming the Tier 3 map). **First tier:** 3.
- **Attacks:**
  1. *Lance thrust combo*: parryable 3 hits, orange (0.6/0.5/0.8 s), High.
  2. *Lance charge with banner*: **unparryable red**, 1.5 s; a long line, with hyperarmour.
  3. *Three-headed flame*: red, 1.2 s; three fire cones, each from one head, fanning out. Find the gap.
  4. *Dragon tail sweep*: red, 0.7 s; punishes standing behind.
- **Lore mechanic:** An optional item (burned fish heart and liver at a censer) makes him **flee and weakens phase 2**.
- **AI read trait:** Adaptive (the man head commands); the dragon mount is Unreading.
- **DRAFT AI IMAGE PROMPT:** "Asmodeus, a great king of hell from the Goetia: a demon with three heads (a bull's head, a man's head and a ram's head), flames issuing from his mouths, a serpent's tail and webbed goose feet, holding a lance flying a long tattered banner, seated on a low long-necked infernal dragon. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body including the mount, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are orange-red fire at the mouths, orange ember eyes and an orange glow in the dragon's throat. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E21. Leviathan's Court: Focalor, Vepar and Forneus

- **Source [Goetia tradition]:** Goetia no. 41, **Focalor** (Mathers): "appeareth in the Form of a Man with Gryphon's Wings. His office is to slay Men, and to drown them in the Waters, and to overthrow Ships of War, for he hath Power over both Winds and Seas ... He also hath hopes to return to the Seventh Throne after 1,000 years." No. 42, **Vepar**: "appeareth like a Mermaid. His office is to govern the Waters ... he can cause the seas to be right stormy". No. 30, **Forneus**: "appeareth in the Form of a Great Sea-Monster."
- **Role in world:** From Tier 2 the seas and rivers of Heaven's map darken, and at Tier 3 Leviathan stirs. These three are the vanguard of the deep.
- **Visuals:**
  - **Vepar (common):** an eel-tailed, finned siren-thing, *not* a pretty mermaid: a lamprey mouth, webbed claws, and a long tail. It ambushes from water.
  - **Focalor (elite):** a drowned man with gryphon wings, waterlogged robes, and kelp-hair; he controls wind.
  - **Forneus (elite heavy):** a squat, armoured sea-monster (an anglerfish crossed with a crab) that crawls out onto shores.
- **SPRITE BRIEF**
  - *Silhouettes:* Vepar is a long S-curve half-submerged. Focalor has spread wings over a dangling drowned body (hovering). Forneus is a wide, low carapace with a lure.
  - *Scale:* Vepar M (2× long), Focalor L, Forneus L (2× wide).
  - *Glow map:* Vepar's mouth goes **orange** before a bite; Focalor's wind-gust rings are orange (parry-reflect) and his drowning whirlpools red; Forneus's lure is a constant ember that goes **red** before its hyperarmour lunge.
  - *Puppet parts:* Vepar (9: head, jaw, torso, arms ×2, tail ×4); Focalor (13: head, kelp hair, torso, robe ×2, arms ×2, wings ×2 (2 segments each), legs ×2 dangling); Forneus (12: carapace, head, jaw, lure stalk, lure, claws ×2, legs ×6 (as 2 grouped sprites)).
  - *Animations (each):* idle, move (swim, hover or crawl), wind-up, attack, special, stagger, death.
- **Name plates:** Focalor, *Duke of the Pit*; Vepar, *Duke of the Pit*; Forneus, *Marquis of the Pit*.
- **Role:** Vepar common; Focalor elite; Forneus elite heavy. **First tier:** 2 (Focalor and Vepar, Dukes); Forneus, a Marquis, joins at 3.
- **Attacks:**
  - Vepar: *lunge-bite from water* (parryable, 0.5 s); *drag under* (red grab, 1.0 s).
  - Focalor: *wind gust* (parryable projectile, reflectable, 0.7 s); *drowning whirlpool* (red zone, 1.3 s); *ship-breaker dive* (parryable, High).
  - Forneus: *claw crush* (parryable, 0.8 s, High); *lure lunge* (unparryable red, hyperarmour, 1.2 s).
- **AI read traits:** Vepar Gullible; Focalor Adaptive; Forneus Unreading.
- **DRAFT AI IMAGE PROMPT (Focalor):** "Focalor, a demon of the Goetia: the pale drowned body of a man in waterlogged black robes with kelp-tangled hair, held aloft by great dark gryphon wings, water streaming from him, wind swirling around. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are orange ember eyes and faint orange wind streaks. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source." *(Vepar: "an eel-tailed demonic siren with a lamprey mouth and webbed claws, half rising from black water"; Forneus: "a squat armoured sea-monster, a crab-like carapace with an anglerfish head and a glowing lure".)*

---

### E22. Leviathan, the Crooked Serpent (Corrupted creature, boss, Tier 3 to 4)

- **Source [Scripture]:** Job 41:1, 15–21, 26, 31 (KJV): "Canst thou draw out leviathan with an hook? ... His scales are his pride, shut up together as with a close seal ... By his neesings a light doth shine, and his eyes are like the eyelids of the morning. Out of his mouth go burning lamps, and sparks of fire leap out. Out of his nostrils goeth smoke, as out of a seething pot or caldron. His breath kindleth coals, and a flame goeth out of his mouth ... The sword of him that layeth at him cannot hold: the spear, the dart, nor the habergeon ... He maketh the deep to boil like a pot". Isaiah 27:1: "leviathan the piercing serpent, even leviathan that crooked serpent; and he shall slay the dragon that is in the sea." Psalm 74:14: "Thou brakest the heads of leviathan in pieces".
- **Notes:** Job 41 presents Leviathan as a created creature, not as a demon. Later demonology (Michaëlis, cited on Wikipedia's *Beelzebub* page) ranked Leviathan among the three foremost fallen angels. Psalm 74:14's plural "heads" supports a **multi-headed** design. **Our framing (decided by Dan): Leviathan is a corrupted creature**, like Behemoth (E28). It is not a demon or a fallen angel. Hell has corrupted it and driven it against Heaven, and the ember lines in its scale seams are the mark of that corruption.
- **Visual:** A colossal sea-serpent with interlocking seal-like scales "that no air can come between", eyes glowing like dawn, sneezes that flash light, burning breath, smoking nostrils, and several heads (we use three). The water boils where it passes.
- **SPRITE BRIEF**
  - *Silhouette:* Colossal: only coils breaking the water surface and one to three heads rearing toward the camera. Coils as arches read perfectly from the diagonal camera.
  - *Scale:* Colossal (each head about 3× the player; coils span the arena).
  - *Glow map:* Eyes are **pale dawn-orange** ("eyelids of the morning") at idle; nostrils steam ember; the throat goes **orange** 1.2 s before breath and **red** for boil-the-deep. Scale seams carry a faint ember line.
  - *Puppet parts (30+):* per head: skull, jaw, eye glow, nostril smoke, neck (5 segments); coil-arch sprites ×4 (reusable); tail fin; water-boil and foam overlays.
  - *Animations:* Tier 3 "stirring" (coils roll past offshore, waves hit the coast, an environmental hazard), surface, head strike, breath, sneeze-flash (blind), coil crush, dive, head broken (per Psalm 74:14), death (sinks; the sea calms).
- **Role:** Boss of the crystal sea (the plan's Sea of Glass). **First tier:** 3 as a world hazard ("stirring"); fought at the end of Tier 3 or at Tier 4.
- **Attacks:**
  1. *Head strike*: parryable, 0.9 s orange eyes, **Break**. A perfect parry stuns the head (a critical window on that head).
  2. *Burning lamps*: red, 1.2 s; it spits a line of fireballs across the arena.
  3. *Neesing flash*: red, 0.6 s; a light burst that blinds (look away, which means facing the player's back toward it, or roll).
  4. *Boil the deep*: red, 2.0 s; arena water tiles boil and the player must climb onto ruins.
- **Mechanic:** Job 41:26 says weapons "cannot hold", so ordinary hits do almost nothing **until his armour is broken**, as the plan sets out. Parries and criticals crack the sealed scales plate by plate; once a head's plates are off, ordinary hits land on it. Break all heads (Psalm 74:14) to win.
- **AI read trait:** Wary, and he punishes feints (progression doc).
- **DRAFT AI IMAGE PROMPT:** "Leviathan from Job 41: a colossal crooked sea-serpent with three heads rearing from boiling black water, interlocking scales tight as sealed armour, eyes glowing like the dawn, smoke pouring from its nostrils as from a boiling cauldron, sparks and flame leaping from its jaws, great coils arching out of the sea. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, the heads and nearest coils isolated. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are pale orange dawn-like eyes, orange-red fire at the mouths and ember lines between scales. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E23. Beasts of the Great Sea: the Lion, the Bear and the Leopard (Daniel 7)

- **Source [Scripture]:** Daniel 7:2–6 (KJV): "the four winds of the heaven strove upon the great sea. And four great beasts came up from the sea, diverse one from another. The first was like a lion, and had eagle's wings: I beheld till the wings thereof were plucked, and it was lifted up from the earth, and made stand upon the feet as a man, and a man's heart was given to it. And behold another beast, a second, like to a bear, and it raised up itself on one side, and it had three ribs in the mouth of it between the teeth of it: and they said thus unto it, Arise, devour much flesh. After this I beheld, and lo another, like a leopard, which had upon the back of it four wings of a fowl; the beast had also four heads".
- **Visuals:**
  - **Winged Lion:** a lion with eagle's wings that, when its wings are torn off (phase 2), **stands upright like a man**.
  - **Lopsided Bear:** a huge bear "raised up on one side", one shoulder hulking higher, with three ribs clenched in its teeth.
  - **Four-Headed Leopard:** a lean leopard with four bird wings on its back and four heads on four necks.
- **SPRITE BRIEF**
  - *Silhouettes:* The Lion has spread eagle wings (then an upright biped). The Bear is a massive, asymmetrical hump with ribs jutting from its mouth. The Leopard is a long body with a four-head fan and four wing-blades.
  - *Scale:* Lion L (1.8×), Bear L (2.4×, **hyperarmour heavy**), Leopard L (2× long, fast).
  - *Glow map:* Ember eyes on all; Lion wings go orange on the dive; Bear rib-jaws go **orange** before a bite and red-cracked during hyperarmour; Leopard heads light in sequence (orange, orange, orange, red) for a four-strike chain.
  - *Puppet parts:* Lion (15: head, jaw, mane, body, wings ×2 (2 segments each), legs ×4, tail; upright form reuses the parts rotated); Bear (13: head, jaw, ribs prop, high shoulder, low shoulder, body, legs ×4, stub tail); Leopard (18: 4 heads with jaws, 4 necks, body, wings ×4, legs ×4, tail).
  - *Animations (each):* idle, move, wind-up, attack(s), special (Lion: wings plucked, then stands; Bear: "Arise, devour" frenzy; Leopard: four-head chain), stagger, death.
- **Role:** Elites (the Leopard and Bear can be mini-bosses in their own zones). **First tier:** 3.
- **Attacks:**
  - Lion: *wing dive* (parryable, 0.7 s, High); *pounce* (red, 1.0 s); phase 2 *upright claws* (parryable 2-hit).
  - Bear: *rib-bite* (parryable, 0.8 s, Break); *"Arise, devour much flesh"* frenzy (red, hyperarmour, 4 swipes); *body slam* (red, 1.2 s).
  - Leopard: *four-head chain* (three orange parryable bites, then a red fourth); *wing-blade dash* (red line); *pounce* (parryable, 0.5 s).
- **AI read traits:** Lion Wary; Bear Unreading; Leopard Adaptive.
- **DRAFT AI IMAGE PROMPT (Bear):** "The second beast of Daniel 7: a colossal bear-like beast raised up on one side, one shoulder hulking far higher than the other, three great ribs clenched between its teeth, matted black fur over armoured hide, sea water dripping from it. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are orange ember eyes and a faint orange glow between the teeth. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source." *(Lion: "a lion with great eagle's wings..."; Leopard: "a lean leopard with four heads on four necks and four bird wings on its back...".)*

---

### E24. The Fourth Beast, Iron-Toothed (mini-boss)

- **Source [Scripture]:** Daniel 7:7–8 (KJV): "a fourth beast, dreadful and terrible, and strong exceedingly; and it had great iron teeth: it devoured and brake in pieces, and stamped the residue with the feet of it: and it was diverse from all the beasts that were before it; and it had ten horns. I considered the horns, and, behold, there came up among them another little horn, before whom there were three of the first horns plucked up by the roots: and, behold, in this horn were eyes like the eyes of man, and a mouth speaking great things."
- **Visual:** Deliberately unlike any animal ("diverse from all the beasts"): a heavy, armour-plated quadruped of black iron-bone with huge iron teeth, stamping feet, a crown of ten horns, and a small eleventh horn bearing human eyes and a mouth that talks.
- **SPRITE BRIEF**
  - *Silhouette:* A wide, low tank shape with a radiating fan of ten horns (it reads as a spiky crown from above). The small talking horn is the weak point.
  - *Scale:* XL (3×).
  - *Glow map:* The iron teeth catch orange rim light before a bite; the stamp telegraph is red ground cracks; the **little horn's eyes are the only bright points** (a red-orange stare). It is the critical target.
  - *Puppet parts (22):* head, jaw (iron teeth), horns ×10 (individually breakable), little horn (eyes, mouth), neck, body, legs ×4 (2 segments each).
  - *Animations:* idle (the little horn mutters), stomp-walk, bite wind-up, devour, stamp, horn sweep, horn-plucked reaction, stagger, death.
- **Role:** Mini-boss. **First tier:** 4.
- **Attacks:**
  1. *Iron-tooth devour*: parryable, 0.9 s, Break.
  2. *Stamp the residue*: red, 1.0 s; three stamps advancing.
  3. *Horn sweep*: parryable, 0.7 s, High.
  4. *"Mouth speaking great things"*: red, 1.5 s; the little horn shouts a blasphemy that inflicts a "silence" debuff (no skills for 4 s).
- **Mechanic:** Breaking 3 horns (an echo of 7:8) exposes the little horn for a critical.
- **AI read trait:** Unreading body; the little horn is Adaptive (it shouts when you feint).
- **DRAFT AI IMAGE PROMPT:** "The fourth beast of Daniel 7: a dreadful unnatural quadruped unlike any animal, plated in black iron and bone, huge iron teeth, heavy stamping feet, a fan of ten great horns on its head and among them a small horn bearing human eyes and a speaking mouth. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are the orange-red human eyes on the little horn and dim orange glints on the iron teeth. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E25. Watcher, Chief of Ten (Corrupted angel elite)

- **Source [Enochic tradition]:** 1 Enoch 6:2, 6–8 (Charles): "the angels, the children of the heaven, saw and lusted after them ... And they were in all two hundred; who descended in the days of Jared on the summit of Mount Hermon ... These are their chiefs of tens." 1 Enoch 10:11–12: "Go, bind Semjâzâ and his associates ... bind them fast for seventy generations in the valleys of the earth".
- **Visual (our design):** A fallen Watcher, an angel whose role was to watch: tall and gaunt, with **eyes sewn open** and a wide-eyed stare, the robe of a sentinel rotted to rags, and the wings of a once-high angel stripped to grey quills. He leads ten lesser fallen (the Tenth's dark mirror). Chains from his binding still hang from his wrists.
- **Story resonance:** The player's order is "the Tenth"; the Watchers were organised into "chiefs of tens". A Watcher chief leading *ten* fallen is an intentional dark mirror. A Watcher could even taunt the player as a former brother.
- **SPRITE BRIEF**
  - *Silhouette:* Tall, thin and stooped, with a ragged quill-wing fan and dangling chains; a halo hangs **behind and below** like a broken, dropped ring.
  - *Scale:* L (1.8×).
  - *Glow map:* **Dull gold cracked with red**; the staring eyes are a hard red-gold; the chains glow orange on whip wind-ups.
  - *Puppet parts (17):* head, eyes (emissive), jaw, torso, robe rags ×2, quill-wings ×2 (2 segments each), arms ×2 (2 segments each), wrist-chains ×2 (4 segments each), legs ×2, broken halo.
  - *Animations:* idle (stares, head ticks), glide-walk, chain-whip, "watcher's gaze" beam, command (rallies fallen), stagger, bound (if the player uses a binding-chain relic), death.
- **Role:** Elite (leads a squad of corrupted-angel adds, reskinned Branded with grey quills). **First tier:** 4.
- **Attacks:**
  1. *Chain lash*: parryable, 0.6 s orange chain, Med; a 2-hit at range.
  2. *Watcher's gaze*: red, 1.2 s; a sweeping beam. Break line of sight behind cover.
  3. *Forbidden art*: he imparts a buff to nearby demons (1 Enoch 8's "secret things"): +damage until he is staggered.
  4. *Fall of the Watcher*: parryable dive, 0.8 s, High.
- **AI read trait:** Adaptive, like every corrupted angel (progression doc). He watches, and remembers.
- **DRAFT AI IMAGE PROMPT:** "A fallen Watcher angel from 1 Enoch: a tall gaunt fallen angel in rotted sentinel robes, unblinking staring eyes, wings stripped to bare grey quills, broken iron shackles and chains hanging from his wrists, a cracked halo hanging low behind him like a dropped ring, faint gold light cracked with red. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; emissive glows are dim gold cracked with red, hard red-gold eyes and orange highlights on the chains. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E26. Brimstone Cavalry (the Lion-Headed Horses)

- **Source [Scripture]:** Revelation 9:16–19 (KJV): "the number of the army of the horsemen were two hundred thousand thousand ... And thus I saw the horses in the vision, and them that sat on them, having breastplates of fire, and of jacinth, and brimstone: and the heads of the horses were as the heads of lions; and out of their mouths issued fire and smoke and brimstone ... For their power is in their mouth, and in their tails: for their tails were like unto serpents, and had heads, and with them they do hurt."
- **Art reference:** The Saint-Sever Beatus' "Lionheaded Fire-Breathing Horses (Rev. 9:16–19)" (shown on Wikipedia's *Beatus of Liébana* page) is a superb silhouette reference.
- **Visual:** Horses with lion heads breathing fire, smoke and brimstone; tails that are live serpents with heads; faceless riders in breastplates of fire, jacinth and brimstone. **Glow mapping:** fire is orange, *jacinth* (a deep blue-violet stone) is rendered as near-black with a cold sheen (no new hue), and brimstone is a sulphur-dim ember.
- **SPRITE BRIEF**
  - *Silhouette:* A horse body with a big lion-mane head, a serpent-tail S, and a rider with a plated chest. From above they read as a line of manes and S-tails, a cavalry wave.
  - *Scale:* L (2×).
  - *Glow map:* The lion mouth glows **orange** 0.9 s before breath and **red** during; the rider's breastplate holds a steady low ember; the serpent tail's eyes glow ember and go **orange** before a rear strike.
  - *Puppet parts (20):* lion head, jaw, mane, neck, body, legs ×4 (2 segments each), serpent tail (4 segments plus head and jaw); rider: helm, torso plate, arms ×2, lance.
  - *Animations:* idle (paws, smoke), gallop, breath wind-up, fire-breath, charge, tail strike (rear), rearing, stagger (throws the rider), death (both burst into sulphur smoke).
- **Role:** Elite (in packs of 3 at Tier 4, more at Tier 5). **First tier:** 4.
- **Attacks:**
  1. *Fire, smoke and brimstone breath*: red cone, after 0.9 s orange. Three variants: fire (damage), smoke (blind), brimstone (lingering burn), the "three plagues" of 9:18.
  2. *Charge*: red, 1.1 s, a line.
  3. *Lance thrust*: parryable, 0.6 s, High.
  4. *Serpent-tail strike*: parryable, 0.5 s orange tail-eyes, Med; **it punishes attacking from behind**, a lore-true "power is in their tails".
- **AI read trait:** Gullible horses, Wary riders. (Unseat the rider to make it Gullible.)
- **DRAFT AI IMAGE PROMPT:** "A horse of the brimstone cavalry from Revelation 9: a war-horse with the head and mane of a lion breathing fire, smoke and sulphur, its tail a living serpent with its own head, ridden by a faceless armoured rider wearing a breastplate of fire, dark jacinth stone and brimstone, holding a lance. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body with rider, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are orange-red fire in the lion's mouth, dim ember in the breastplate and ember eyes on the serpent tail. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E27. The Four Loosed from Euphrates (Corrupted angels, quartet boss)

- **Source [Scripture]:** Revelation 9:13–15 (KJV): "the sixth angel sounded, and I heard a voice from the four horns of the golden altar ... Saying to the sixth angel which had the trumpet, Loose the four angels which are bound in the great river Euphrates. And the four angels were loosed, which were prepared for an hour, and a day, and a month, and a year, for to slay the third part of men." They command the 200-million cavalry (E26).
- **Notes:** The text does not say they are fallen; they are "bound" and "prepared". Making them corrupted angels is our reading (see section 6). Dürer's woodcut 9 is titled *The four angels of Death*.
- **Visual (our design):** Four bound angels, chained in a riverbed for ages, rising with **river-silt armour** and chains still fused to them. Each is themed to one unit of their appointed time:
  - **Hour:** a swift duellist with twin blades.
  - **Day:** a sunlit spearman whose gold is turned to a red dusk.
  - **Month:** a moon-crescent glaive wielder with tidal pulls.
  - **Year:** a slow, giant hammer-bearer who wears his years like rings of stone.
- **SPRITE BRIEF**
  - *Silhouette:* Four distinct weapon silhouettes on one shared angel rig (cheap to produce): wet, drooping wings and chains trailing into water.
  - *Scale:* L (2×) each; Year is XL (3×).
  - *Glow map:* **Gold cracked with red** on all four. Each has a signature telegraph rhythm: Hour flashes fast and orange, Day has long orange holds, Month pulses orange in a slow sine, and Year shows red only (all hyperarmour).
  - *Puppet parts (16 shared plus a weapon swap):* head, helm, torso, silt-armour plates ×2, wings ×2 (2 segments each), arms ×2 (2 segments each), legs ×2 (2 segments each), chain ×2 (segmented), plus a weapon (twin blades, spear, glaive or hammer).
  - *Animations (shared plus a weapon set):* rise from the river (intro), idle, move, weapon combos ×2, special, stagger, death (each falls back into the river as silt).
- **Role:** Boss (one fight, four bodies; two at a time, tag-team). **First tier:** 4.
- **Attacks (one signature each):**
  1. *Hour (blades)*: a parryable 5-hit flurry, 0.3 s per hit, Low each. A rhythm test.
  2. *Day (spear)*: a parryable long thrust after 1.0 s orange, Break; plus a red sunset sweep.
  3. *Month (glaive)*: a red tidal pull, 1.4 s; it draws the player in. Roll against it.
  4. *Year (hammer)*: red hyperarmour slams, 1.5 s; cracks the arena into rings.
- **Mechanic:** Defeating each before its "time" expires (a hidden per-angel timer) yields a bonus, a nod to "prepared for an hour, and a day, and a month, and a year".
- **AI read traits:** Adaptive by default, as corrupted angels are in the progression doc. Proposal: give each its own trait (Hour Gullible, Day Wary, Month Adaptive, Year Unreading), which makes the fight a feint-system exam (section 6).
- **DRAFT AI IMAGE PROMPT (Day; vary per angel):** "One of the four angels bound at the river Euphrates in Revelation 9, newly loosed: a tall fallen angel in armour crusted with river silt and mud, drooping waterlogged wings, broken chains still fused to his limbs and trailing, holding a long spear, faint gold light cracked with red seeping from the armour seams. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; emissive glows are dim gold cracked with red and orange eyes. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source." *(Swap the weapon: twin short blades / crescent glaive / huge stone hammer, the last with "a giant hulking angel wearing rings of stone like tree rings".)*

---

### E28. Behemoth (Corrupted creature, boss, hyperarmour colossus)

- **Source [Scripture]:** Job 40:15–19, 23 (KJV): "Behold now behemoth ... he eateth grass as an ox. Lo now, his strength is in his loins, and his force is in the navel of his belly. He moveth his tail like a cedar: the sinews of his stones are wrapped together. His bones are as strong pieces of brass; his bones are like bars of iron ... Behold, he drinketh up a river, and hasteth not: he trusteth that he can draw up Jordan into his mouth."
- **Notes:** In Job, Behemoth is a created creature and not demonic. The *Dictionnaire Infernal* (1863) lists Behemoth among its demons, and Le Breton's plate is the elephant-bellied demon most people picture. Our framing (decided by Dan): **Behemoth is a corrupted creature**, as Leviathan (E22) is. Hell has corrupted and goaded it; it is not a demon (see section 6).
- **Visual:** A grass-eating colossus: an ox-like, hippo-like mass with strength "in his loins", a cedar-trunk tail, a ribcage of brass bones visible through cracked hide, and iron-bar limbs. It drinks rivers dry. Hell's corruption shows as brand-chains and ember sores.
- **SPRITE BRIEF**
  - *Silhouette:* An enormous, low, wide body; a tree-trunk tail swinging like a cedar is the top-down read; the head is low and broad.
  - *Scale:* XL to Colossal (5×; the arena is built around it).
  - *Glow map:* Brand-chains and sores at dim ember; the tail glows **red** before the cedar sweep; the belly ("navel of his belly") glows **orange** before the river-gulp suction; brass bones catch rim light only (no gold glow).
  - *Puppet parts (20):* head, jaw, ears, neck hump, body front, body rear/loins, belly plate, legs ×4 (2 segments each), cedar tail (4 segments), brand-chains ×2, river-gulp FX.
  - *Animations:* idle (grazing, chewing), lumbering walk, cedar-tail sweep, stomp, charge, river-gulp (inhale; arena water drains), belch flood, enraged (corruption flare), stagger (falls on its side, a critical), death or calmed.
- **Role:** Boss (the heavy hyperarmour boss). **First tier:** 4.
- **Attacks:**
  1. *Cedar-tail sweep*: red, 1.3 s, 180°, with hyperarmour. Roll through or over (i-frames).
  2. *Stomp*: parryable shockwave (a deflect parry, 0.8 s orange), High.
  3. *River-gulp*: red, 2.0 s; suction pulls the player toward its mouth; hold against it or roll sideways. Ends with the jaws snapping shut (Break).
  4. *Charge*: red, 1.5 s, a long line. If it hits a wall it stuns itself (a critical window).
- **Mechanic:** Bones "like bars of iron", so only the **sores and brand-chains** take full damage. Breaking all brand-chains **frees** Behemoth instead of killing it (optional ending; see section 6).
- **AI read trait:** Unreading.
- **DRAFT AI IMAGE PROMPT:** "Behemoth from Job 40, corrupted by hell: a colossal grass-eating beast like a giant ox and hippopotamus, immense powerful loins and belly, a thick tail like a cedar trunk, brass-like bones and iron-bar ribs showing through cracked dark hide, wrapped in glowing infernal brand-chains with ember sores. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are orange-red brand-chains, ember sores and ember eyes. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E29. Azazel, the Weapon-Teacher (Corrupted angel, boss)

- **Source [Scripture]:** Leviticus 16:8, 10 (KJV): "Aaron shall cast lots upon the two goats ... the other lot for the scapegoat." ... "to let him go for a scapegoat into the wilderness." (The KJV's "scapegoat" translates the Hebrew *azazel*, which modern translations such as the NRSVUE keep as the name Azazel; noted here, not quoted.)
- **Source [Enochic tradition]:** 1 Enoch 8:1 (Charles): "Azâzêl taught men to make swords, and knives, and shields, and breastplates, and made known to them the metals of the earth and the art of working them". 1 Enoch 10:4–5: "Bind Azâzêl hand and foot, and cast him into the darkness: and make an opening in the desert ... And place upon him rough and jagged rocks, and cover him with darkness ... and cover his face that he may not see light."
- **Visual (our design):** The Watcher who forged the first weapons. He wears a jagged-rock carapace (the rocks laid upon him), a **covered face** (a hood or iron mask, as in 10:5) and the horns of a wilderness goat (the Leviticus link). His wings are made of hammered blades. He carries an anvil-hammer and wields **every weapon type**, changing weapon each phase.
- **SPRITE BRIEF**
  - *Silhouette:* A broad smith-angel with rock shoulders and a fan of blade-wings (the sword-wing fan is a superb top-down read), goat horns over a masked head, and a hammer.
  - *Scale:* XL (3×).
  - *Glow map:* **Forge-gold cracked with red** in the blade-wing seams; the hammer head glows orange (heat) then red (slam); weapons forged mid-fight glow orange as they "cool".
  - *Puppet parts (24):* masked head, horns ×2, rock pauldrons ×2, torso, apron, blade-wings ×2 (each with 5 blade sprites), arms ×2 (2 segments each), hammer, weapon slot (sword, shield, knife set), legs ×2 (2 segments each).
  - *Animations:* idle (hammer taps the anvil), walk, forge (makes a weapon), weapon combos (sword, knife and shield), blade-wing volley, hammer slam, unmask (phase 3), stagger, buried (rocks fall on him, 1 Enoch 10:5), death.
- **Role:** Boss. **First tier:** 4.
- **Attacks:**
  1. *Forged sword combo*: parryable 3-hit, orange, High.
  2. *Blade-wing volley*: he launches wing-blades in a fan; parryable individually (reflect), 0.8 s orange.
  3. *Shield wall*: he blocks frontal damage; parrying his shield bash (0.5 s) opens him up.
  4. *Hammer of the deep*: red, 1.6 s, hyperarmour; jagged rocks fall in a pattern ("rough and jagged rocks").
- **Mechanic:** Each phase he forges the weapon type the player has parried least, an Adaptive boss. In phase 3, "unmasked", his face is light-blind, so **holy light skills stun him**.
- **AI read trait:** Adaptive.
- **DRAFT AI IMAGE PROMPT:** "Azazel, the fallen Watcher who taught the forging of weapons: a broad fallen angel smith with wilderness goat horns rising above an iron mask that covers his face, shoulders encrusted with rough jagged rocks, wings made of fanned hammered sword blades, a leather forge apron, holding a great smith's hammer, forge-gold light cracked with red glowing from the blade seams. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; emissive glows are dim gold cracked with red in the blade-wings and an orange-hot hammer head. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E30. Beelzebub, Lord of the Flyers (boss)

- **Source [Scripture]:** Matthew 12:24 (KJV): "... Beelzebub the prince of the devils." 2 Kings 1:2: "Go, enquire of Baalzebub the god of Ekron whether I shall recover of this disease."
- **Tradition [Later tradition]:** The Hebrew name is commonly glossed as "lord of (the) flies". The Septuagint renders it "Baal of flies", though scholars debate a "lord of the (heavenly) dwelling" reading. The *Dictionnaire Infernal* depicts him as a fly and calls him "Lord of the Flies", "Lord of the Flyers" or "Lord of the Flying Demons". Milton's *Paradise Lost* ranks him second among the fallen (all from Wikipedia, *Beelzebub*).
- **Visual:** Following Le Breton's plate, a monstrous fly-prince: a bloated, armoured fly-body with veined wings bearing a skull-like pattern, a crown, compound eyes, and a buzzing swarm-cloak. Disease imagery ties to 2 Kings 1 (Ahaziah sought him about recovering from sickness).
- **SPRITE BRIEF**
  - *Silhouette:* Huge spread fly wings (perfect from above) over a bloated thorax and crowned head; the swarm-cloak blurs his edges.
  - *Scale:* XL (3× wingspan).
  - *Glow map:* Compound eyes are a mosaic of ember; the wing-veins flare **orange** before a gust; the swarm goes **red** when it locks onto the player.
  - *Puppet parts (18):* head, compound eyes (emissive), proboscis, crown, thorax, abdomen, wings ×2 (2 layers each), legs ×6, swarm-cloak (particle and sprite layers).
  - *Animations:* idle hover (buzz), dart, proboscis stab, wing-gust, swarm release, plague cloud, land (exposed), stagger (falls on his back), death (the swarm disperses).
- **Role:** Boss. **First tier:** 4.
- **Attacks:**
  1. *Proboscis stab*: parryable, 0.6 s, High.
  2. *Swarm lance*: red, 1.0 s; a line of flies, roll perpendicular.
  3. *Plague cloud*: red, 1.5 s; a lingering zone that **blocks healing** (the Ekron sickness).
  4. *Wing-gust*: parryable (deflect), 0.7 s orange, Med; pushes the player into the plague cloud if not parried.
- **Mechanic:** He only lands (and becomes critical-able) after the swarm-cloak is burned off by holy light or parried gusts.
- **AI read trait:** Wary.
- **DRAFT AI IMAGE PROMPT:** "Beelzebub, lord of the flies: a monstrous crowned fly-demon prince with a bloated armoured thorax and abdomen, huge veined translucent wings with skull-like patterns, glittering compound eyes, a proboscis, six jointed legs, a cloak of buzzing flies swirling around his body. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are orange-red mosaic compound eyes and faint orange wing veins. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E31. Belial, the Two Beautiful Angels (Corrupted angel, roaming King boss)

- **Source [Goetia tradition]:** Goetia no. 68 (Mathers): "He is a Mighty and a Powerful King ... He appeareth in the Form of Two Beautiful Angels sitting in a Chariot of Fire. He speaketh with a Comely Voice, and declareth that he fell first from among the worthier sort ... he tarrieth not one hour in the Truth, unless he be constrained ..."
- **Visual:** Two beautiful angels, twins, in a chariot of fire. They are the most "angelic-looking" enemy in the game, which is the point: **beauty as deceit**. Their gold is convincing until hit, when red bleeds through. They pair with the hidden-spy mechanic of the Strangers (A7).
- **SPRITE BRIEF**
  - *Silhouette:* Two serene winged figures side by side in a low, wheeled chariot with flame wheels. Spinning wheels read well from above; they are a dark echo of the ophanim.
  - *Scale:* L (2× including the chariot).
  - *Glow map:* They present **false white-gold** that switches to red when struck (a deliberate exception to the glow rule, flagged in section 6). The chariot's flame wheels are orange, red when charging.
  - *Puppet parts (24):* twin A and twin B (each: head, torso, wings ×2, arms ×2), chariot body, flame wheels ×2, yoke, flame trail.
  - *Animations:* idle (they speak in unison), glide, chariot charge, twin split (both leave the chariot and fight separately), mirrored strike, comely voice (charm), reveal (the gold cracks to red), stagger, death.
- **Name plate:** Belial, *King of the Pit* (hidden while he is disguised as an ally).
- **Role:** Boss (a King roaming the Tier 3 map; can appear disguised as an ally until revealed). **First tier:** 3.
- **Attacks:**
  1. *Chariot charge*: red, 1.2 s, a line, with flame trails.
  2. *Mirrored strikes*: the twins attack from both sides; each is parryable (0.6 s orange); they alternate tempo.
  3. *Comely voice*: red, 1.4 s; charm reverses the player's controls for 2 s unless the player is facing away (the "constrained" angle: standing at a seraph's altar nullifies it).
  4. *First to fall*: a desperation dive at low health, parryable, Break.
- **Deceiver (section 1.3):** On the Tier 3 map, Belial poses as a pair of ally angels standing in a **false golden light** that looks like a shrine. Their glow copies the player's white-gold palette, with the false-gold tell. "Satan himself is transformed into an angel of light" (2 Corinthians 11:14) is the line the Studied entry shows.
- **AI read trait:** Adaptive ("tarrieth not one hour in the Truth").
- **DRAFT AI IMAGE PROMPT:** "Belial, a king of the Goetia: two beautiful serene twin angels with long white-gold wings seated side by side in a low ornate chariot of fire with blazing wheels, unsettlingly perfect faces, faint red light bleeding through hairline cracks in their skin. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full figures including the chariot, single isolated group. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood beneath beauty. Near-black monochrome base; emissive glows are a false white-gold on the wings and halo, thin red cracks, and orange-red fire on the chariot wheels. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E32. The Image of the Beast (elite)

- **Source [Scripture]:** Revelation 13:14–15 (KJV): "saying to them that dwell on the earth, that they should make an image to the beast, which had the wound by a sword, and did live. And he had power to give life unto the image of the beast, that the image of the beast should both speak, and cause that as many as would not worship the image of the beast should be killed."
- **Visual:** A towering idol statue of the Beast from the Sea (E33) in black stone, given breath: its stone jaw grinds open to speak, and a sword-wound scar on one head glows. It is a statue that walks.
- **SPRITE BRIEF**
  - *Silhouette:* A cracked stone idol on a plinth-like base, seven stone heads (simplified); it moves by sliding and grinding.
  - *Scale:* XL (3×).
  - *Glow map:* The wound scar and mouth glow **orange** before it "speaks" and **red** during the decree; the stone is dark grey with ink cracks.
  - *Puppet parts (12):* base, body, heads ×7 (as 3 sprites: centre plus side clusters), jaw, wound glow, cracks overlay.
  - *Animations:* idle (dormant), awaken, slide, speak (decree), stone fist, crumble (stagger), shatter (death).
- **Role:** Elite (spawned by the False Prophet, E34; also a world object in Tier 5 zones that must be destroyed). **First tier:** 5.
- **Attacks:**
  1. *Decree of worship*: red, 2.0 s; a gaze cone sweeps from the speaking mouth, and anything in its line of sight takes heavy damage. Break line of sight behind cover. **The game never asks the player to bow to it** (see section 6).
  2. *Stone fist*: parryable, 1.0 s, Break.
  3. *Animate Branded*: revives nearby fallen Branded (E15).
- **AI read trait:** Unreading.
- **DRAFT AI IMAGE PROMPT:** "The image of the beast from Revelation 13: a towering idol statue of black cracked stone depicting a seven-headed leopard-like beast, one stone head bearing a glowing sword-wound scar, its stone jaws grinding open as it comes alive, rubble falling from its base. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full figure, single isolated object. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are an orange-red wound scar and orange light inside the open mouth. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E33. The Beast from the Sea (boss)

- **Source [Scripture]:** Revelation 13:1–3, 5, 7 (KJV): "I ... saw a beast rise up out of the sea, having seven heads and ten horns, and upon his horns ten crowns, and upon his heads the name of blasphemy. And the beast which I saw was like unto a leopard, and his feet were as the feet of a bear, and his mouth as the mouth of a lion: and the dragon gave him his power, and his seat, and great authority. And I saw one of his heads as it were wounded to death; and his deadly wound was healed ... And there was given unto him a mouth speaking great things and blasphemies ... it was given unto him to make war with the saints". It fuses Daniel 7's leopard, bear and lion (E23).
- **Visual (every clause used):** A leopard body, bear feet and a lion mouth; seven heads and ten horns with ten crowns on the horns (not the heads); "the name of blasphemy" on the heads, rendered as **illegible scratched glyphs** (never real words or names); one head scarred by a death-wound that has healed.
- **SPRITE BRIEF**
  - *Silhouette:* A long, spotted feline body on heavy bear paws with a fan of seven necks (horns crowned with small dull crowns). From above, the seven-head fan is the identity.
  - *Scale:* XL to Colossal (5×).
  - *Glow map:* The glyphs on the heads glow dim ember; the head about to strike lights **orange**; the healed-wound head turns **red** when it regenerates other heads; the crowns are dull.
  - *Puppet parts (40):* body, spots overlay, legs ×4 (bear paws, 2 segments each), tail; per head ×7: skull, jaw, neck (3 segments), horn(s) with crown; wound scar emissive.
  - *Animations:* rise from the sea (intro), idle (the heads weave), prowl, head-strike (per head), multi-head bite chain, bear-paw slam, roar of blasphemy, head severed, head regrows (via the wound head), stagger, death.
- **Role:** Boss (Tier 5). **First tier:** 5.
- **Attacks:**
  1. *Seven-head chain*: up to seven bites in sequence; each head lights orange (parryable, 0.5 s), with a red head inserted as an unparryable feint-check.
  2. *Bear-paw slam*: parryable, 0.9 s, Break.
  3. *Mouth speaking great things*: red, 1.8 s; a screen-wide roar that inflicts silence (as E24, its Daniel 7 ancestor).
  4. *Deadly wound healed*: the scarred head regrows severed heads unless the player **criticals the wound head first**.
- **Mechanic:** Sever heads via head-posture breaks, but the healed-wound head must die first or they return, a lore-true puzzle (13:3).
- **AI read trait:** Adaptive.
- **DRAFT AI IMAGE PROMPT:** "The beast from the sea in Revelation 13: a colossal beast with a spotted leopard's body, heavy bear's feet and seven heads with lion-like mouths on long necks, ten horns each topped with a small dull crown, scratched illegible glyphs carved on its heads, one head bearing a great healed death-wound scar, rising from dark water. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; only emissive glows are dim orange-red glyphs, ember eyes and a red-glowing wound scar. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E34. The Beast from the Earth, the False Prophet (boss)

- **Source [Scripture]:** Revelation 13:11–13 (KJV): "I beheld another beast coming up out of the earth; and he had two horns like a lamb, and he spake as a dragon. And he exerciseth all the power of the first beast before him ... And he doeth great wonders, so that he maketh fire come down from heaven on the earth in the sight of men". Revelation 16:13 calls him "the false prophet" (the frog-spirits come from his mouth), and Revelation 19:20 says he "wrought miracles before him".
- **Visual:** Deceptively gentle: a figure with **two small lamb's horns** and a soft, pale, fleece-trimmed form, until it speaks with a **dragon's mouth** that unhinges. It performs false miracles, calling fire "down from heaven" in a **counterfeit gold** that is really orange-red.
- **SPRITE BRIEF**
  - *Silhouette:* An upright, robed, lamb-horned figure with a shepherd's crook (a mock-pastoral look). The jaw unhinges into a dragon maw (a puppet jaw swap).
  - *Scale:* L (2×).
  - *Glow map:* False-gold miracle circles that **shift to red** as they fire (an intentional "fake heaven" lesson); the maw glows orange before frog-spirit summons (E3).
  - *Puppet parts (16):* head, lamb horns ×2, gentle jaw and dragon jaw (swap), fleece robe ×2, arms ×2 (2 segments each), crook, legs ×2, miracle circle FX.
  - *Animations:* idle (benediction pose), glide, false miracle (fire from heaven), dragon-voice roar, frog summon, image raise (summons E32), crook strike, stagger, death (the robe collapses into a pile of fleece and ash).
- **Role:** Boss (Tier 5). Fought alongside or before the Beast from the Sea. It works as a **corrupted-angel mimic** (progression doc): its counterfeit gold copies the allies' glow. **First tier:** 5.
- **Attacks:**
  1. *Fire from heaven*: red, 1.6 s; circles appear in counterfeit gold, then turn red and fire falls. **The player must learn that gold that turns red is a lie.**
  2. *Dragon's voice*: red cone, 1.0 s, posture damage.
  3. *Summon frogs*: three frog-spirits (E3) from his mouth (Revelation 16:13).
  4. *Crook hook*: parryable, 0.6 s, Med; pulls the player in.
- **Deceiver (section 1.3):** Its counterfeit gold is the false golden light. During the fight it also drops **fake Vision motes** that burst into frog-spirits (E3) when collected.
- **AI read trait:** Adaptive (a deceiver).
- **DRAFT AI IMAGE PROMPT:** "The beast from the earth, the false prophet of Revelation 13: a deceptively gentle robed figure with a pale fleece-trimmed mantle and two small curled lamb's horns, holding a shepherd's crook, its mouth unhinging into a fanged dragon's maw, false golden fire swirling above its raised hand. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, full body, single isolated figure. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, dark menacing mood. Near-black monochrome base; emissive glows are a sickly false gold turning orange-red in the fire above its hand and an orange glow inside the dragon maw. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source."

---

### E35. The Great Red Dragon (final boss)

- **Source [Scripture]:** Revelation 12:3–4, 7–9 (KJV): "behold a great red dragon, having seven heads and ten horns, and seven crowns upon his heads. And his tail drew the third part of the stars of heaven, and did cast them to the earth ... there was war in heaven: Michael and his angels fought against the dragon; and the dragon fought and his angels, And prevailed not ... And the great dragon was cast out, that old serpent ... he was cast out into the earth, and his angels were cast out with him."
- **Note:** The plan already names the dragon as the invasion's leader and the last-tier boss. This entry keeps it to "the Red Dragon" and "that old serpent" (see section 6).
- **Art reference:** William Blake's *Great Red Dragon* watercolours (1805–10) show a muscular, man-like dragon with bat wings and horns, seen from behind, looming over the woman (a stunning boss-silhouette reference). Dürer's woodcut 11 shows *The woman of the Apocalypse and the seven-headed dragon*.
- **Visual:**
  - **Phase 1, the Dragon in Heaven:** seven heads, ten horns and seven crowns (on the heads this time, unlike the sea beast); a vast serpent-dragon whose tail sweeps a third of the stars. **"Red" is the one creature allowed a deep red body tone**, a dark crimson-black base rather than pure near-black (flagged as an art-rule exception).
  - **Phase 2, Cast into the Earth:** with wings torn and heads broken, it falls out of the sky layer and crashes into the arena floor, then fights as a long, low serpent ("that old serpent"): desperate and fast.
- **SPRITE BRIEF**
  - *Silhouette:* Phase 1 is colossal: seven necks in a fan, bat-like wings, and a coiling tail across the sky layer with "stars" (white points) being swept. Phase 2 is a long, low serpent with wing stumps.
  - *Scale:* Phase 1 Colossal (heads 3× each, the body off-screen); Phase 2 XL (6× long).
  - *Glow map:* Phase 1 has a dark crimson base with seven dull crowns and eyes like red coals; the head about to strike lights orange; stars caught in the tail are white (Heaven's light stolen). Phase 2 has red lightning along the spine and an orange throat before each lunge.
  - *Puppet parts:* Phase 1 (per head ×7: skull, jaw, crown, neck ×4 segments; horns ×10 distributed; wings ×2 (3 segments each); body chunk; tail (8 segments); star sprites); Phase 2 (head, jaw, wing stumps ×2, 10-segment body, tail).
  - *Animations:* Dragon: rise, head strikes, seven-head breath, star-sweep tail, wing storm, head severed, cast down (falls as a red streak); Serpent: slither, lunge, coil, death.
- **Role:** Final boss (Tier 5, War in Heaven). The Host (A8) fights alongside the player. **First tier:** 5 (the frog-spirits of E3 come from its mouth earlier, as a setup).
- **Attacks:**
  1. *(Dragon) Seven-head barrage*: sequenced bites (orange, parryable) with red breath heads mixed in; each head has its own posture.
  2. *(Dragon) Third of the stars*: red, 2.5 s; the tail sweeps star-meteors across the arena in a sweeping band. **The Host (A8) shields one lane**, so stand in the gold.
  3. *(Dragon) Wing storm*: red, 1.4 s; a downdraft that pushes the player toward the arena edge. Roll into it.
  4. *(Serpent) Belly-lunge*: parryable, 0.4 s fast, High.
  5. *(Serpent) Coil*: red, 1.2 s; it rings the player and constricts. Roll out through the gap before it closes. The final parried lunge opens the last critical.
- **AI read trait:** Adaptive at both phases (progression doc). Optional callback [Game invention]: in the final fight it **counters the player's most-used action from the whole campaign**.
- **DRAFT AI IMAGE PROMPT (Phase 1):** "The great red dragon of Revelation 12: a colossal dark crimson serpent-dragon with seven heads on long necks each wearing a dull crown, ten horns among the heads, vast tattered bat-like wings, a long coiling tail dragging a scatter of small white stars, eyes like burning coals. Fixed orthographic camera 45–50 degrees down on a diagonal, three-quarter top-down view, heads, wings and nearest coils isolated. Death's Door-inspired chunky bevelled forms, toon shading with hard value bands, thick dark ink outlines, apocalyptic menacing mood. Very dark crimson-black base; emissive glows are red-orange eyes and mouths, small white stars caught in the tail. Flat pure magenta #FF00FF background, no ground, no cast shadow, no magenta or pink in the figure, glows orange-red not pink, high resolution game sprite source." *(Phase 2: "a long low dark crimson serpent with torn wing stumps and broken heads, red lightning crackling along its spine, coiled to lunge".)*

### E36. Fallen Angel (the common tier; a fallen ally of the Host)

- **Source [Scripture]:** Revelation 12:9 (KJV): "he was cast out into the earth, and his angels were cast out with him." **[Game invention]:** an allied angel of the Host (A8) who dies or is overwhelmed in a fight can fall on the spot and turn on the player (decided by Dan; the rules are in the plan's [Fallen Angels](./heaven-or-hell-plan.md#fallen-angels-the-common-tier) section).
- **Visual:** The A8 soldier after the fall: the same plain man-like angel, hunched, wings dragged low, the halo ring cracked and lying at its feet, red where the ally had white and gold. It must read as "one of ours, lost", not as a new monster.
- **SPRITE BRIEF**
  - *Silhouette:* The A8 silhouette with the wing V collapsed downward and the spear held low and forward. Telling it from a live ally at a glance comes from the drooped wings and the missing halo above the head.
  - *Scale:* M+ (1.3× player, the A8 rig).
  - *Glow map:* The A8 glow layers recoloured: dim ember rims and a dull red spearhead at idle, the spearhead **orange** before each parryable thrust. No white or gold survives.
  - *Puppet parts:* none new. It reuses the A8 rig and swaps the glow layers, plus a cracked halo sprite left on the ground.
  - *Animations:* the A8 **fall** (about 0.6 s as a starting value, played on the A8 rig; it never pauses play: no hit-stop, no timescale change, no camera move, no input lock), hunched idle, stalk, two-hit spear combo, stagger, death (crumbles to ash).
- **Name plate:** Fallen Angel (no rank title; it is not a Goetic spirit).
- **Role:** Common (the lowest enemy tier). **First tier:** 0, wherever an ally falls. The chance an ally falls rises with the local tier (the plan gives the starting values), so Fallen Angels grow common as Corruption rises. It scales with tier like any other common.
- **Attacks:**
  1. *Spear thrust*: parryable, orange, 0.5 s, Med.
  2. *Two-hit spear combo*: parryable, orange (0.5/0.6 s), Low then Med.
- **AI read trait:** Gullible (the progression doc lists Fallen Angels among the gullible readers).
- **Reward:** Killing one gives no Stain (plan). It is a fallen friend, not a trophy.
- **DRAFT AI IMAGE PROMPT:** none needed; it is a recolour of the A8 painting. If a separate painting is wanted later, use the A8 prompt with "hunched, wings dragged low, halo broken, glows dull red and orange instead of white and gold".

---

## 2C. Goetia quick reference (tradition, Mathers' translation)

These are appearance descriptions only, quoted from Mathers' *Goetia* (sacred-texts.com). **Bold** names have full entries in 2B. The rest are a bench for later content or variants. The rank column follows Wikipedia's list of the Goetia's demons; in game each spirit's real name is shown with "*<Rank> of the Pit*" underneath (decided by Dan), using the first rank where two are given. The game shows No. 32 as Asmodeus, Tobit's spelling.

| No. | Spirit | Rank (name plate) | Appearance (quoted) | Use |
| --- | --- | --- | --- | --- |
| 1 | **Bael** | King | "sometimes like a Cat, sometimes like a Toad, and sometimes like a Man, and sometimes all these forms at once" | E18 |
| 7 | Amon | Marquis | "like a Wolf with a Serpents tail, vomiting out of his mouth flames of fire ... a Man with Dog's teeth beset in a head like a Raven" | Bench: Marchosias variant |
| 9 | **Paimon** | King | "a Man sitting upon a Dromedary with a Crown most glorious upon his head. There goeth before him also an Host of Spirits, like Men with Trumpets" | E19 |
| 17 | **Botis** | President (and Earl) | "an ugly Viper, then ... a Human shape with Great Teeth, and two Horns, carrying a bright and sharp Sword" | E6 |
| 25 | **Glasya-Labolas** | President (and Earl) | "a Dog with Wings like a Gryphon" | E9 |
| 26 | Bune | Duke | "a Dragon with three heads, one like a Dog, one like a Gryphon, and one like a Man ... causeth the Spirits which be under him to gather together upon your Sepulchres" | Bench: tomb-field elite |
| 28 | Berith | Duke | "a Soldier with Red Clothing, riding upon a Red Horse, and having a Crown of Gold upon his head" | Bench: cavalry captain (note the red-horse overlap with Revelation 6:4) |
| 29 | Astaroth | Duke | "an hurtful Angel riding on an Infernal Beast like a Dragon, and carrying in his right hand a Viper ... his Noisome Breath" | Bench: corrupted-angel rider |
| 30 | **Forneus** | Marquis | "a Great Sea-Monster" | E21 variant |
| 32 | **Asmoday** | King | "Three Heads ... a Bull ... a Man ... a Ram; he hath also the tail of a Serpent ... Feet are webbed like those of a Goose. He sitteth upon an Infernal Dragon" | E20 |
| 34 | **Furfur** | Earl | "an Hart with a Fiery Tail ... he will take upon himself the Form of an Angel" | E10 |
| 35 | **Marchosias** | Marquis | "a Wolf having Gryphon's Wings, and a Serpent's Tail, and Vomiting Fire" | E11 |
| 36 | Stolas | Prince | "a Mighty Raven at first ... after he taketh the image of a Man" | Bench: scout |
| 38 | **Halphas** | Earl | "a Stock-Dove ... to build up Towers, and to furnish them with Ammunition and Weapons" | E7 variant |
| 39 | **Malphas** | President | "like a Crow ... can build Houses and High Towers" | E7 |
| 41 | **Focalor** | Duke | "a Man with Gryphon's Wings ... to drown them in the Waters" | E21 |
| 42 | **Vepar** | Duke | "like a Mermaid ... can cause the seas to be right stormy" | E21 variant |
| 43 | **Sabnock** | Marquis | "an Armed Soldier with a Lion's Head, riding on a pale-coloured horse" | E17 |
| 59 | Orias | Marquis | "a Lion, riding upon a Horse Mighty and Strong, with a Serpent's Tail; and he holdeth in his Right Hand two Great Serpents hissing" | Bench: Tier 4 cavalry elite |
| 61 | Zagan | King (and President) | "a Bull with Gryphon's Wings" | Bench: heavy charger |
| 63 | **Andras** | Marquis | "an Angel with a Head like a Black Night Raven, riding upon a strong Black Wolf, and having a Sharp and Bright Sword" | E16 |
| 68 | **Belial** | King | "Two Beautiful Angels sitting in a Chariot of Fire" | E31 |

The *Observations* section adds that 72 spirits sit under four Kings of the cardinal points (Amaymon, Corson, Ziminay and Göap). That is a natural structure if Dan wants four Hell "fronts" invading Heaven's map from four directions.

---

## 2D. Art-historical reference board (public-domain works)

Use these as silhouette and mood references for the AI source paintings. Do not trace them.

| Work | What it contributes to silhouettes |
| --- | --- |
| **Albrecht Dürer, *Apocalypse* (1498), 15 woodcuts** | Dense, line-driven monsters that read in pure black and white, ideal for our monochrome base. Key plates: no. 4 *The Four Horsemen*; no. 9 *The four angels of Death* (the Four Loosed, E27); no. 11 *The woman of the Apocalypse and the seven-headed dragon* (E35); no. 14 *The beast with the lamb's horns and the beast with seven heads* (E33 and E34). **Caution:** Wikipedia notes turbaned Ottoman figures in four plates, shown as torturers or beast-worshippers. Do not carry that coding into enemy design. |
| **William Blake, *The Great Red Dragon* watercolours (1805–10)** | Four paintings (Brooklyn Museum; National Gallery of Art, Washington ×2; Rosenbach). The dragon is drawn as a looming, man-like winged figure, the best reference for the Red Dragon's *presence* and wing spread (E35 phase 1). Check the plates directly for pose details. |
| **Gustave Doré (1832–1883): *Paradise Lost* (1866, 50 plates), Dante's *Inferno* (1857/1866), the Bible (1866)** | Theatrical chiaroscuro: figures lit from one high source against black, and vast fallen-angel wings. This matches our near-black base with a single glow source. Good for the Watchers, Azazel and the corrupted echoes. **Avoid** Doré's *Wandering Jew* series, which Wikipedia notes spread antisemitic views. |
| **Hieronymus Bosch, *The Garden of Earthly Delights*, Hell panel (c. 1490–1510)** | Hybrid object-demons: the bird-headed "Prince of Hell" wearing a cauldron as a crown, the "Tree-Man" with an eggshell torso, giant ears carrying a blade, and musical instruments used as torture devices. Good for Hell's props, the Branded's bizarre variants, and Paimon's musician host. |
| **Beatus manuscripts (Mozarabic, 9th–13th c.), e.g. the Saint-Sever Beatus** | Flat, banded, profile silhouettes with total graphic clarity. The Saint-Sever *Lionheaded Fire-Breathing Horses (Rev. 9:16–19)* is the direct reference for the Brimstone Cavalry (E26). Beatus locusts and dragons are equally useful. |
| **Byzantine and Orthodox icons** | The six-winged, many-eyed seraph and the **tetramorph cherub** (an Orthodox icon from Meteora is the lead image on Wikipedia's *Cherub* page). The 5th–6th c. apse mosaic at Hosios David, Thessaloniki, merges Ezekiel 1, Isaiah 6 and Revelation 4. The "many-eyed seraphim" glyph ꙮ shows how literally eyes were taken. Eastern "nine orders" icons show the full hierarchy. Reference for A1–A4. |
| **Matthäus Merian, *Icones Biblicae* (c. 1625–30), Ezekiel's chariot** | Engraving of the vision with an ophan wheel; good for the gyroscope geometry of A3. |
| **Louis Le Breton, *Dictionnaire Infernal* (1863 edition), 69 illustrations** | Iconic demon portraits (Bael's three heads on legs, Beelzebub as a fly, Behemoth, Asmodeus and others). Wikipedia notes many were reused in Mathers' edition of the *Lesser Key of Solomon*. Use them for character, then re-silhouette for our camera. |

**Pseudo-Dionysius' nine choirs** [Later tradition] (*De Coelesti Hierarchia*, about 500 AD; Wikipedia *Christian angelology* and *Ophanim*). First sphere: Seraphim, Cherubim and Thrones (ophanim). Second sphere: Dominions, Virtues and Powers. Third sphere: Principalities, Archangels and Angels. **Design hook:** the player's order, "the Tenth", stands *below* the nine as a lesser order outside the classical hierarchy. That is invented, but it fits the tradition's structure neatly. Several Goetic spirits claim former membership in these choirs (Marchosias and Paimon "of the Order of Dominations", Forneus "partly of the Order of Thrones"), which suggests a corrupted-angel naming scheme.

---

## 3. Tier table (Corruption Tiers 0 to 5)

Each tier adds new creatures. Earlier ones persist with escalation modifiers (see the table after the main tier table).

| Tier | Theme | Commons (new) | Elites (new) | Mini-bosses and bosses (new) | World events and allies |
| --- | --- | --- | --- | --- | --- |
| **0** | **The Calm Courts** | E36 Fallen Angels (wherever an ally falls), E1 Pit-Smoke Wisp (strays), E2 Se'ir goat-demon, E3 Frog-Spirit, E8 locust scouts, E15 the Branded (Knights' brands) | none | Knight captain (an E15 variant) guards the first breach | Cherub parry trainer (A2), seraphim at breaches and altars (A1), ophan sentinels (A3), Strangers (A7), the Host (A8) roaming in small, fragile bands |
| **1** | **Smoke from the Pit** | E4 Legion-Swine; E1 becomes common | E5 Nephil Brute (rare), E6 Botis, E7 Malphas and Halphas, E9 Glasya-Labolas, E10 Furfur, **E13 Legion** (roaming) | Abaddon's vanguard, the first world boss (E14 preview) | The fifth trumpet opens the Pit (A6); the Linen Scribes' mark (A5) |
| **2** | **The Locusts** | E8 locust swarms, E21 Vepar | Crowned locusts (E8, wary), E11 Marchosias, E12 Lilith, E16 Andras, E17 Sabnock, E21 Focalor | **E14 Abaddon/Apollyon** (boss) | Corrupted angels appear as rare elites, including the A1–A3 echoes |
| **3** | **The Brands** | E15 now carry Kings' brands; E5 becomes common | E21 Forneus, E23 Lion, Bear and Leopard | **E18 Bael**, **E19 Paimon**, **E20 Asmodeus**, **E31 Belial** (Kings roaming as bosses); **E22 Leviathan** (stirs as a sea hazard, fought at the end of the tier) | Scribes scatter coals as an ally strike (A5) |
| **4** | **The Four Loosed** | (cavalry packs act as commons late in the tier) | E25 Watcher, Chief of Ten; E26 Brimstone Cavalry; corrupted angels become a common elite tier | **E24 Fourth Beast** (mini-boss); **E27 the Four Loosed**, **E28 Behemoth**, **E29 Azazel**, **E30 Beelzebub** (bosses) | The sixth trumpet looses the Four (A6, Revelation 9:14); the player's Trumpets unlock; ophan charges (A3) |
| **5** | **War in Heaven** | (all earlier commons at maximum escalation) | E32 Image of the Beast | **E34 Beast from the Earth / False Prophet**, **E33 Beast from the Sea** (bosses); **E35 the Great Red Dragon** (final, two phases) | The Host (A8) fights alongside and shields a lane against the falling stars |

**Escalation modifiers for persisting enemies** [Game invention]:

| Tiers above first appearance | Change |
| --- | --- |
| +1 | Adds one hit to its main combo; wind-up 10% shorter |
| +2 | Gains the King's brand: one attack gains hyperarmour (red flash) |
| +3 | Read trait shifts one step toward Adaptive (Gullible becomes Wary, Wary becomes Adaptive) |
| +4 | Elite variant: bigger, with an ember aura and a new unparryable attack |

**Roster counts:** 8 ally entries; 36 enemy entries (40 distinct enemy sprites with variants, plus the Fallen Angel on the A8 rig). By entry role: 7 commons (E1, E2, E3, E4, E8, E15, E36, plus Vepar inside E21), 15 elites (E5, E6, E7, E9, E10, E11, E12, E13, E16, E17, E21, E23, E25, E26, E32), 1 mini-boss (E24, plus the Knight captain variant of E15) and 13 bosses (E14, E18, E19, E20, E22, E27, E28, E29, E30, E31, E33, E34 and the final boss E35). **Fallen Angels** (E36) are the common tier of corrupted angels. **Named corrupted angels:** Abaddon, Andras, the Watcher, the Four Loosed, Azazel and Belial, the Beast from the Earth as a mimic, the angel-form phases of Furfur and Marchosias, and the plan's corrupted seraph, cherub and ophan on the A1–A3 rigs. That keeps them a smaller elite and boss tier, as briefed.

---

## 4. Production priorities: the first three enemies for the combat milestone

### 1. E2 Se'ir, the Goat-Demon (basic parryable melee)

- **Why:** It is the cleanest **parry teacher**. Two parryable swings (a fast hook and a *delayed* overhead) teach timing, and one red horn-charge teaches "orange means parry, red means roll". Its **Gullible** read makes it the ideal first feint target.
- **Cost:** 13 parts on a standard biped rig. **This rig becomes the template** for the Branded (E15), Botis phase 2 (E6) and Malphas (E7).
- **Sourcing:** It is scriptural (the *se'irim* of Leviticus 17:7 and Isaiah 34:14, the KJV's "devils" and "satyr") and also reads as the archetypal goat-horned demon players expect.

### 2. E3 Unclean Frog-Spirit (ranged and area with telegraphs)

- **Why:** It tests every non-melee telegraph in one small creature: a **parryable, reflectable projectile** (orange throat-sac swell), a **red ground-circle area attack** (the "miracle of fire") and a close-range tongue lash. Its **Wary** read teaches that some enemies will not bite feints.
- **Cost:** 9 parts on a low, wide body, cheap to animate. The throat sac is one scalable emissive part, which is the perfect test of the glow-layer pipeline.
- **Sourcing:** It is scriptural (Revelation 16:13–14), and the "go forth ... to gather" line justifies its early arrival as Hell's scouts. It also sets up a late payoff when the frogs pour from the False Prophet's mouth (E34).

### 3. E5 Nephil Brute (heavy hyperarmour)

- **Why:** It tests **hyperarmour, posture and roll-through timing**: a parryable sweep that does not interrupt it, an unparryable hyperarmour slam you must roll *into*, and a stomp that punishes hugging it. The **Unreading** trait teaches that feints are not a universal answer. The helm-shatter critical gives a strong payoff and tests the critical (R) presentation.
- **Cost:** 14 parts, built on the Se'ir rig re-proportioned to 2.2× scale (wider torso, no tail, digitigrade legs swapped for columns). That shares the rig and animation timing tools.
- **Sourcing:** Genesis 6:4 plus 1 Enoch 15, where the giants' spirits *become* the evil spirits. It is a lore-solid "Hell creature" that is neither cartoonish nor overtly occult.

**Alternates if a swap is needed:** for the heavy slot, **E23 Bear of Daniel 7** (more monstrous, pure scripture, but a quadruped rig); for the ranged slot, **E7 Malphas** (tower turrets, but more complex AI).

**Milestone pipeline test:** Painting these three exercises every art rule: biped, low quadruped and heavy; orange and red telegraphs on separate emissive layers; magenta keying around orange glows; and two-view painting (front-diagonal and back-diagonal).

---

## 5. Sources

All pages below were retrieved during this research. Some passages on these pages are no longer quoted, because their figures are now reserved for special quests. Scripture is from Bible Gateway; the KJV pages carry a "Public Domain" notice.

**Scripture (Bible Gateway):**

1. Isaiah 6:1–7; Ezekiel 1:4–28 (KJV): https://www.biblegateway.com/passage/?search=Isaiah+6%3A1-7%3BEzekiel+1%3A4-28&version=KJV
2. Ezekiel 10; Genesis 3:24; Exodus 25:18–22 (KJV): https://www.biblegateway.com/passage/?search=Ezekiel+10%3B+Genesis+3%3A24%3B+Exodus+25%3A18-22&version=KJV
3. Revelation 4:6–8, 10:1–3, 20:1–3; Daniel 10:5–6; Ezekiel 9:1–4 (KJV): https://www.biblegateway.com/passage/?search=Revelation+4%3A6-8%3BRevelation+10%3A1-3%3BRevelation+20%3A1-3%3BDaniel+10%3A5-6%3BEzekiel+9%3A1-4&version=KJV
4. Daniel 10:13, 12:1; Jude 9; Revelation 12:3–9; Daniel 8:15–17, 9:21; Luke 1:19, 26–28 (KJV): https://www.biblegateway.com/passage/?search=Daniel+10%3A13%3BDaniel+12%3A1%3BJude+1%3A9%3BRevelation+12%3A3-9%3BDaniel+8%3A15-17%3BDaniel+9%3A21%3BLuke+1%3A19%3BLuke+1%3A26-28&version=KJV
5. Revelation 8:2–13, 9 (KJV): https://www.biblegateway.com/passage/?search=Revelation+8%3A2-13%3BRevelation+9&version=KJV
6. Revelation 13, 16:13–14; Daniel 7:2–8 (KJV): https://www.biblegateway.com/passage/?search=Revelation+13%3BRevelation+16%3A13-14%3BDaniel+7%3A2-8&version=KJV
7. Job 41, 40:15–24; Isaiah 27:1; Psalm 74:14 (KJV): https://www.biblegateway.com/passage/?search=Job+41%3A1-34%3BIsaiah+27%3A1%3BPsalm+74%3A14%3BJob+40%3A15-24&version=KJV
8. Mark 5:1–20; Matthew 12:24; 2 Kings 1:2–3; Leviticus 16:8–10, 17:7; Isaiah 34:14, 13:21 (KJV): https://www.biblegateway.com/passage/?search=Mark+5%3A1-20%3BMatthew+12%3A24%3B2+Kings+1%3A2-3%3BLeviticus+16%3A8-10%3BLeviticus+17%3A7%3BIsaiah+34%3A14%3BIsaiah+13%3A21&version=KJV
9. Isaiah 34:14; Leviticus 17:7, 16:8–10 (NRSVUE, for the translation notes on *se'irim*, *lilith* and *azazel* only; nothing is quoted from it): https://www.biblegateway.com/passage/?search=Isaiah+34%3A14%3BLeviticus+17%3A7%3BLeviticus+16%3A8-10&version=NRSVUE
10. Genesis 3:1, 3:14, 6:4, 18:1–2, 19:1; Job 1:6–7; Zechariah 3:1–2; Luke 10:18; Isaiah 14:12–15; Ezekiel 28:12–17; Hebrews 13:2 (KJV): https://www.biblegateway.com/passage/?search=Genesis+3%3A1%3BGenesis+3%3A14%3BJob+1%3A6-7%3BZechariah+3%3A1-2%3BLuke+10%3A18%3BIsaiah+14%3A12-15%3BEzekiel+28%3A12-17%3BGenesis+6%3A4%3BGenesis+18%3A1-2%3BGenesis+19%3A1%3BHebrews+13%3A2&version=KJV
11. Tobit 3:8, 8:2–3 (KJV Apocrypha, Wikisource, because Bible Gateway's KJV has no Apocrypha): https://en.wikisource.org/wiki/Bible_(King_James)/Tobit
12. Revelation 12:7–9, 6:1–8, 15:6–7, 19:20, 20:10 (KJV): https://www.biblegateway.com/passage/?search=Revelation+12%3A7-9%3BRevelation+6%3A1-8%3BRevelation+15%3A6-7%3BRevelation+19%3A20%3BRevelation+20%3A10&version=KJV

**Tradition texts (sacred-texts.com):**

13. *The Lesser Key of Solomon: Goetia*, trans. S. L. MacGregor Mathers, "Shemhamphorash" (the 72 spirits): https://www.sacred-texts.com/grim/lks/lks05.htm
14. Same edition, "Observations" (seals, the four Kings): https://www.sacred-texts.com/grim/lks/lks06.htm
15. *1 Enoch*, trans. R. H. Charles, chapter 6 (the Watchers descend on Hermon): https://www.sacred-texts.com/bib/boe/boe009.htm
16. *1 Enoch* chapter 8 (Azazel teaches weapons): https://www.sacred-texts.com/bib/boe/boe011.htm
17. *1 Enoch* chapter 10 (the binding of Azazel and Semjaza): https://www.sacred-texts.com/bib/boe/boe013.htm
18. *1 Enoch* chapter 15 (the giants' spirits become evil spirits): https://www.sacred-texts.com/bib/boe/boe018.htm
19. *1 Enoch* chapter 20 (the seven holy angels; no longer quoted here): https://www.sacred-texts.com/bib/boe/boe023.htm

**Reference articles:**

20. Know Your Meme, "Biblically Accurate Angels / Be Not Afraid": https://knowyourmeme.com/memes/biblically-accurate-angels
21. Wikipedia, "Christian angelology" (Pseudo-Dionysius, the choirs): https://en.wikipedia.org/wiki/Christian_angelology
22. Wikipedia, "Seraph": https://en.wikipedia.org/wiki/Seraph
23. Wikipedia, "Cherub": https://en.wikipedia.org/wiki/Cherub
24. Wikipedia, "Ophanim": https://en.wikipedia.org/wiki/Ophanim
25. Wikipedia, "Lilith": https://en.wikipedia.org/wiki/Lilith
26. Wikipedia, "Beelzebub": https://en.wikipedia.org/wiki/Beelzebub
27. Wikipedia, "Dictionnaire Infernal": https://en.wikipedia.org/wiki/Dictionnaire_Infernal
28. Wikipedia, "Apocalypse (Dürer)": https://en.wikipedia.org/wiki/Apocalypse_(D%C3%BCrer)
29. Wikipedia, "The Great Red Dragon paintings": https://en.wikipedia.org/wiki/The_Great_Red_Dragon_Paintings
30. Wikipedia, "Beatus of Liébana": https://en.wikipedia.org/wiki/Beatus_of_Li%C3%A9bana
31. Wikipedia, "Gustave Doré": https://en.wikipedia.org/wiki/Gustave_Dor%C3%A9
32. Wikipedia, "The Garden of Earthly Delights": https://en.wikipedia.org/wiki/The_Garden_of_Earthly_Delights
33. Wikipedia, "List of demons in the Ars Goetia" (ranks for the name plates): https://en.wikipedia.org/wiki/List_of_demons_in_the_Ars_Goetia

**Style reference (Death's Door), retrieved as web-search excerpts:**

34. Press Start, "We Spoke To The Team At Acid Nerve About The Stylish Looking Death's Door" (fixed isometric choice): https://press-start.com.au/features/2021/03/27/we-spoke-to-the-team-at-acid-nerve-about-the-stylish-looking-deaths-door/
35. The Gemsbok, "The Pros and Cons of Death's Door" (clean lines, mostly fixed isometric perspective, diorama look): https://thegemsbok.com/art-reviews-and-articles/deaths-door-acid-nerve-review-pros-cons/

---

## 6. Sensitivity and tone: decisions for Dan

**Recommended baseline (already applied throughout):**

- **Reserved figures stay out.** Dan's rule: God, Christ and very important biblical figures are left out until he says otherwise, because they will be used for special quests later. Nothing on the reserved list (section 2A) is depicted, given a sprite or prompt, or named as a character in this bestiary. Michael's name appears only where the plan already uses it. Scripture quotes are trimmed with ellipses where a verse names a reserved figure. The one exception Dan allowed is that Satan and Lucifer may be *named*: in 2 Corinthians 11:14 for the Deceivers (section 1.3) and in the run difficulty names (progression doc, section 1). Neither is ever added as a depicted character.
- **The Throne stays offscreen**, shown only as light at the edge of the Throne zone. The Four Living Creatures (A4) and the seraphim (A1) stand at that edge; the seraphim covering their faces is itself a respectful framing device.
- **Tier escalation is announced by the Living Creatures' "Come"** (Revelation 6), with no visible seal-breaker. Mark 5's Legion story is used without showing the healed man.
- **Demons as enemies** is a common, widely accepted framing. Angels are never mocked.
- **No real sacred text in fake scripts.** The Beast's "name of blasphemy" uses illegible invented glyphs, never real words, divine names or real-world scripts.
- **No real Goetic seals.** Brand-sigils (E15) are invented shapes, not the actual seals from the grimoire.
- **The player is never asked to worship or bow to an enemy.** The Image of the Beast's decree is dodged by breaking line of sight.

**Decisions only Dan can make:**

1. **The dragon's identity.** Revelation 12:9 identifies the dragon by name with a reserved figure. This bestiary calls it only "the Red Dragon" and "that old serpent" and gives it no other forms. Keep it that way until the special quests are planned, or tie the two together later?
2. **Beings scripture does not call demonic.** Behemoth and Leviathan are created creatures in Job; the four angels of the Euphrates are "prepared" and loosed at a trumpet; the locusts act only as "it was given them"; Abaddon is "the angel of the bottomless pit". We framed them as **corrupted or goaded by Hell**, as the plan does. *Decided for Behemoth and Leviathan:* both are corrupted creatures and enemies (E28, E22). The rest stays open. Alternatives: (a) keep them neutral "judgement" forces the player survives rather than kills; (b) give Behemoth a *free* ending (already designed) and Marchosias a *spare* ending.
3. **How much occult material (decided by Dan).** Goetic spirits keep their real *Ars Goetia* names, shown with a rank title underneath in the form "*<Rank> of the Pit*" (for example Bael, *King of the Pit*). That covers 15 Goetic spirits featured across 12 entries. The real seals stay out (see the baseline).
4. **Lilith.** She is a figure of Jewish folklore, and the Isaiah word may mean only a night bird. We use the owl/night-creature reading and **avoid the seductress trope entirely**. Confirm, or drop her and promote Stolas (raven) into the slot.
5. **Belial's false gold and the Strangers.** This intentionally breaks the "gold equals ally" rule, as does the False Prophet's counterfeit gold. It is a powerful twist, but it muddies the glow language Dan set. Keep it (with a tell, gold that flickers to red at its edges), or keep gold sacrosanct? *Decided:* keep it. Deceivers may show false golden light, fake Vision pickups and a false angelic glow, always with the tell (section 1.3, 2 Corinthians 11:14).
6. **Allied angels dying or falling (decided by Dan).** Allied angels roam the open map, fight alongside the player, and are fragile. A dead or overwhelmed ally can be corrupted into a Fallen Angel (E36), the lowest enemy tier, through a quick fall animation that never pauses play. Named corrupted angels stay the elite and boss tier. Only the Host (A8) roams and falls; the seraphim, cherubim and ophanim keep their posts.
7. **Scripture translation (decided by Dan).** Every scripture quote, in this document and in the game, is from the KJV, and Tobit from the KJV's Apocrypha. Bible Gateway marks the KJV as public domain. The NRSVUE is consulted only for the translation notes on *se'irim*, *lilith* and *azazel* (source 9), and nothing is quoted from it.
8. **Art-history baggage.** Do not reproduce the Ottoman "turban" coding in Dürer's woodcuts, and do not reference Doré's *Wandering Jew*. Give Paimon's court an abstract-infernal costume, not real Middle-Eastern dress.
9. **Naming Death's Door in prompts.** The prompts say "Death's Door-inspired" as briefed. For production and any public-facing material, consider swapping that for a purely descriptive style phrase (the prompts already include one) to avoid derivative-work concerns and to keep the look your own.
10. **Red Dragon colour exception.** The dragon is the one creature with a deep crimson body rather than a near-black base, because it is literally "a great red dragon". Approve or veto the exception.
11. **Read-trait exceptions.** The progression doc makes every King, every corrupted angel and every Tier 5 boss adaptive, and this bestiary follows it. It proposes mixed traits inside two fights as an option: Bael's three heads and the Four Loosed (one trait each, as a feint-system exam). Approve the mixes, or keep each fight to one trait.
12. **Held-back figures.** Two figures without names were left out as well as the named ones: the mighty angel of Revelation 10 and the man clothed in linen of Daniel 10. Some readers identify each with a reserved figure. The generic Linen Scribes (A5) come from Ezekiel 9 only, and the Strangers (A7) drop Genesis 18 for the same reason. Confirm, or clear them for use.
