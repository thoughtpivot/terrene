# Heaven Or Hell: progression API

The character and progression rules live in `src/components/scenes/HeavenOrHell/progression/`. Import everything from `progression/index.ts`.

The code is pure. It imports nothing from Excalibur and touches no browser API. Every random roll comes from a seed stored in the run, so the same state always gives the same result.

## Conventions

- **State is plain data.** A `RunState` holds one angel's run. A `MetaState` holds what survives a wipe. Both are JSON-safe.
- **Functions never mutate.** Each takes a state and returns a new one.
- **Fallible actions return `Result<T>`.** That is `{ ok: true, value }` or `{ ok: false, error }`, where `error` is a short code such as `"tier-locked"`, `"not-enough-visions"` or `"soft-cap"`. Show the player a message based on the code.
- **Randomness is seeded.** `run.rng` is a uint32 state, and functions that roll return the advanced state inside the new run.
- **Guessed numbers live in `tuning.ts`.** Numbers the designer fixed (15 creation points, caps of 75 and 100, 15 points per Ascension, Grace per point, Stain thresholds, the doc's shrine prices) live beside the rule that uses them.

## Starting a run

```ts
import { freshMeta, validateCreation, buildRun, CREATION_STEPS } from ".../progression";

const meta = freshMeta();
const errors = validateCreation(input, meta, "tongues"); // check the flow step by step
const run = buildRun(input, meta, seed);                  // Result<RunState>
```

`CreationInput` follows the flow: `choir`, `variant`, `tongues` (empty means Wordless), `arms` (sword, spear or knife), `boons`, `burdens`, `origin`, `appearance`, `allocation`, `penances` and, last, `difficulty`. `creationBudget(input)` tells the UI how many free and Tongue-bound points to place.

## Difficulty

The player picks one of four difficulties as the last creation step. It is stored on `run.difficulty` and on `run.creation`, so a wipe keeps it. `DIFFICULTIES` (in `tuning.ts`) lists them from easiest to hardest for the picker. Each entry has `id`, `name`, `subtitle`, a KJV `epigraph` (`text` and `ref`), a palette `accent` and the numbers below. `difficultyDef(id)` looks one up, and `DEFAULT_DIFFICULTY` is `"narrowWay"`.

| id | Name | Minutes per tier | Tier 5 at | Enemy HP / posture / damage / aggression | Stain gain | Loot tier bonus |
| --- | --- | --- | --- | --- | --- | --- |
| `stillWaters` | Still Waters | 40 | 3h 20m | ×0.7 / 0.8 / 0.7 / 0.8 | ×0.75 | +0 |
| `narrowWay` | The Narrow Way | 60 | 5h | ×1 / 1 / 1 / 1 | ×1 | +0 |
| `furnaceOfAffliction` | The Furnace of Affliction | 80 | 6h 40m | ×1.25 / 1.15 / 1.2 / 1.15 | ×1.15 | +1 |
| `sonOfTheMorning` | Son of the Morning | 100 | 8h 20m | ×1.5 / 1.3 / 1.4 / 1.3 | ×1.3 | +1 |

The difficulty sets the corruption pace. `secondsPerTier(difficulty)` gives the length of a tier, and `tierAt(elapsedSeconds, difficulty)` and `tierOf(run)` read it. `secondsToNextTier` and `minutesToLastTier` help with HUD timers. The difficulty's enemy multipliers stack on top of the tier's. The Stain multiplier stacks with Watcher-kin. The loot bonus raises `lootTier(run)` and the tier of weapons from `weaponItem`.

## What the systems expose

| Area | Main functions |
| --- | --- |
| Attributes | `allocatePoints`, `unsealAttribute`, `attributeCap` |
| Ascension | `gainExperience`, `experienceNeeded`, `canAscend`, `ascend`, `pickHymnDraw` |
| Gifts | `drawGiftHand`, `pickGift`, `stayHand`, `banGift`, `guaranteeGift`, `keepCard`, `eligibleGifts`, `giftBlock` |
| Hymns | `learnHymn`, `upgradeHymn`, `equipHymn`, `applyCoal`, `applySeal`, `hymnGraceCost` |
| Tongues | `learnTongue`, `learnCanticle` |
| Vows | `canSwear`, `swearVow`, `progressVow`, `breakVow`, `vowConsequences` |
| Anointings and items | `addItem`, `applyAnointing`, `equipItem`, `dropItem`, `rollAnointingDrop` |
| Weapons | `weaponUnlocked`, `weaponDropTable`, `rollWeaponDrop`, `weaponItem` |
| Shrines | `useScales`, `useRefiningRefund`, `useRefiningCleanse`, `useJoinedWings`, `usePartedWings`, `useLots`, `useMouth`, `mercySeat` |
| Trumpets | `addTrumpetProgress`, `chooseTrumpet`, `soundTrumpet`, `rerollTrumpet` |
| Stain | `applyStain`, `cleanseStain`, `stainEffects` |
| Difficulty | `DIFFICULTIES`, `difficultyDef`, `DEFAULT_DIFFICULTY` |
| Corruption | `advanceTime`, `tierOf`, `tierAt`, `secondsPerTier`, `secondsToNextTier`, `minutesToLastTier`, `tierScaling`, `unlocksAt`, `sealBreach`, `regionTier` |
| Run | `earnVisions`, `spendVisions`, `strikeDown`, `restoreHalo`, `completeQuest`, `recordBossKill`, `recordBreachCleared` |
| Meta | `recordWitness`, `buyUpgrade`, `unlockOrigin`, `unlockVariant`, `recordSeen`, `recordStudy`, `recordKill`, `bestiaryTier`, `discoverLandmark`, `learnLore` |
| Wipe | `wipe`, `settleMeta` |
| Save | `serializeSave`, `deserializeSave`, `SAVE_KEY`, `SAVE_VERSION` |
| Save slots | `listSlots`, `loadSlot`, `saveSlot`, `deleteSlot`, `startCharacterInSlot`, `slotMeta`, `migrateLegacySave`, `SLOT_IDS`, `SAVE_SLOT_COUNT` |

## What combat reads

Progression never runs combat. Combat reads two things:

- **`deriveCombatStats(run)`** returns the angel's pools (`maxHp`, `maxGrace`, `maxSanctity`, `maxFervour`), multipliers (damage, posture, damage taken, armour, healing, Grace cost and others), `airDashes`, `canParry`, the equipped Hymns with their Grace costs and shapes, the weapon and its tier, and `flags`. The flags are string ids for the passives, Gifts and Anointings that combat implements, such as `"noParry"`, `"m1Torment"` or `"crackedHalo"`.
- **`enemyScaling(run)`** returns the HP, posture, damage and aggression multipliers for the current corruption tier, multiplied by the run's difficulty. `lootTier(run)` gives the drop quality for the tier plus the difficulty's bonus.

Combat reports events back by calling progression:

- When HP reaches zero, call `strikeDown(run, { inBreach })`. It returns `"throne"`, `"dimmed"` or `"castOut"`. On `"throne"`, combat fully heals the angel.
- When a boss dies, call `recordBossKill`.
- When the angel eats a demon heart or breathes brimstone, call `applyStain`.
- When a Trumpet sounds, call `soundTrumpet`. It returns the Sanctity and HP cost for combat to apply.

## Lives, Stain and the wipe

- **Lives.** The first `strikeDown` dims the halo. The second sets `status: "castOut"`. Altars (`restoreHalo`) and Ascension restore a dimmed halo.
- **Stain.** Reaching 100 Stain sets `status: "fallen"`. Stain is separate from the halo.
- **The wipe.** When `status` isn't `"alive"`, call `wipe(run, meta, { seed })`. It pays out the run's Testimony times the Penance multiplier and keeps Remembrance. It returns the new `meta` and a `fresh` run: the same creation choices in a reset Heaven, with Visions, Stain, corruption and sealed regions all gone.

## Saving

`serializeSave(meta, run, savedAt?)` returns a JSON string with `format` and `version`. The slot functions below store it after every change, so reloading can't undo being struck down. `deserializeSave(text)` checks the format, refuses saves from newer versions, migrates older ones and fills in meta fields that are missing. It rejects a run with an unknown `difficulty`.

`SAVE_VERSION` is 2. Version 1 saves had no difficulty and a fixed 100 minutes per tier. The migration gives them `"narrowWay"` and scales `elapsedSeconds` by 60/100, so a loaded run stays at the same corruption tier.

## Save slots

After Start on the title menu, the player picks a slot, as in Deepwoken's slot select. There are `SAVE_SLOT_COUNT` (3) slots, with ids and labels `"A"`, `"B"` and `"C"` (`SLOT_IDS`). Each slot holds its own run **and its own meta** (Testimony, Remembrance and unlocks), so a wipe in one slot never touches another.

Every slot function takes a `SlotStorage` (`getItem`, `setItem`, `removeItem`); pass `window.localStorage`. Slot A lives under `slotKey("A")`, which is `"heaven-or-hell-progression:slot-v1:A"`. The `v1` is `SLOT_KEY_VERSION`, for the key layout; the file inside keeps its own `SAVE_VERSION` and migrations.

```ts
const slots = listSlots(localStorage);            // one SlotSummary per slot, for the menu
// Empty slot: run character creation against slotMeta(localStorage, id), then
const started = startCharacterInSlot(localStorage, id, input, seed, Date.now());
// Filled slot: continue it
const { meta, run } = loadSlot(localStorage, id).value;
saveSlot(localStorage, id, meta, run, Date.now()); // after every change, and after a wipe
deleteSlot(localStorage, id);                     // erases that slot's run and meta
```

`SlotSummary` is small, and `state` decides what the menu shows:

| `state` | Extra fields | Menu |
| --- | --- | --- |
| `"empty"` | – | "New character" |
| `"character"` | `choirName` (the variant's name if it has one), `difficulty`, `difficultyName`, `tier`, `playSeconds`, `life` (`"bright"`, `"dimmed"`, `"castOut"` or `"fallen"`), `lastPlayed` | Continue |
| `"noCharacter"` | `testimony`, `lastPlayed` | "New character", keeping the slot's meta |
| `"corrupt"` | `error` | Offer delete |

Every summary also has `id` and `label`. `lastPlayed` is the `now` passed to the last save, in epoch milliseconds, or `null` for a migrated save that never recorded one.

`startCharacterInSlot` builds the run with the slot's meta, keeps that meta and saves both. It fails with `"slot-occupied"` while the slot still holds a run, so a character is never overwritten by accident. Slot functions fail with `"bad-slot"` for an unknown id, and `loadSlot` fails with `"empty-slot"` when nothing is stored.

**Migration.** `listSlots` and `loadSlot` first call `migrateLegacySave`. It moves the old single save under `SAVE_KEY` (any version, so v1 saves are upgraded on the way) into slot A, then removes the old key. It does nothing when slot A already holds data or the old save can't be read, and leaves the old key in place in those cases.

## Tests

```sh
npm run test:hoh-progression   # npx tsx --test test/heaven-or-hell-progression*.ts
```
