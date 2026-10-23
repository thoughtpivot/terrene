# Heaven Or Hell: Combat Rules

## Overview

`src/components/scenes/HeavenOrHell/combat/` is the combat core for M2 and
M3: the hero's M1 chain, parry, block, posture, roll, critical, feint,
Fervour and Outcry, the two lives, and an enemy whose AI reads your wind-ups
and can be fooled by feints. It imports nothing from Excalibur. It is pure,
deterministic and fixed-step, so the scene drives it and `node:test` covers
it, the same split as `Street/rules.ts`.

Every number is a starting value to tune, and all of them live in
`combat/tuning.ts`.

| File | What it holds |
| --- | --- |
| `tuning.ts` | Every number: timings, posture, Fervour, hit-stop, shake, weapons, enemies, read traits |
| `types.ts` | Plain-data state, inputs and events |
| `engine.ts` | `createCombat`, `tick`, `step`, `advance` and the helpers for the run layer |
| `player.ts` | The hero's half of a step: input buffer, actions, meters |
| `enemy.ts` | The enemy's attack loop and the feint "reader" |
| `resolve.ts` | What happens when a hit lands: i-frames, parry, block, posture, damage, lives |
| `weapons.ts` | Turns weapon frame data into attack specs |
| `math.ts` | Vectors, arcs and the seeded RNG (Mulberry32) |

## The API

```typescript
import { createCombat, tick, SWORD } from "./combat";

let combat = createCombat({
    seed: 1234,
    weapon: SWORD,
    playerPos: { x: 0, y: 0 },
    enemies: [{ pos: { x: 200, y: 0 }, traits: "gullible" }],
});

const { state, events } = tick(combat, deltaMs, inputs);
combat = state;
```

- `tick(state, dtMs, inputs)` adds `dtMs` to an accumulator and runs whole
  60 Hz steps (`STEP_MS`), at most `MAX_STEPS_PER_TICK` a call. It never
  mutates its argument; it returns a new state and the events from every
  step it ran. Presses are buffered, so a press during a frame too short
  for a step still acts on the next one.
- `step(state, inputs)` runs exactly one step. `advance(state, ms, inputs)`
  runs whole steps for `ms`, applying presses only on the first.
- The same seed and the same inputs always produce the same fight.
- Run-layer helpers: `revivePlayer`, `healPlayer` (capped by a dimmed halo),
  `clearHaloDim` (altar or Ascension), `setThroneAnswerReady`, `spendGrace`
  and `spawnEnemy`.

### Inputs

```typescript
interface CombatInputs {
    move?: Vec;          // WASD, any length
    aim?: Vec;           // hero to mouse, any length
    sprint?: boolean;
    blockHeld?: boolean; // F is down
    pressed?: { attack, parry, roll, critical, feint, outcry, cast }; // went down this frame
}
```

| Control | Input |
| --- | --- |
| Left-click | `pressed.attack` |
| F goes down | `pressed.parry`, and `blockHeld: true` while it stays down |
| Q | `pressed.roll` |
| R | `pressed.critical` |
| Right-click | `pressed.feint`, always (call `preventDefault` on `contextmenu`) |
| G | `pressed.outcry` |
| A Hymn key | `pressed.cast` |

### Events

Every event has `atMs`. Contact events (`hit`, `blocked`, `parried`,
`guardBroken` and `outcry`) also carry `hitStopMs` and a
`shake: { magnitudePx, durationMs }` for the renderer. The others:

- **Animation:** `attackStarted`, `enemyTelegraph` (with a `color` of
  `"orange"` for parryable or `"red"` for unparryable, and `windupMs` for
  the shrinking timer circle), `rollStarted`, `whiffed`, `dodged`,
  `parryMissed`, `feint`, `postureFull`.
- **Feedback and debugging:** `feintRejected` (with a reason),
  `inputDropped`, `enemyRead`, `enemyReaction`, `enemyBaited`,
  `enemyParryWhiffed`, `enemyRollEndLag`.
- **For the run and Hymn layers:** `struckDown`, `castOut`,
  `throneAnswered`, `enemyDefeated`, `castRequested`.

## How the scene should drive it

1. Build the inputs each frame from Excalibur's keyboard and pointer: edge
   presses into `pressed`, and held keys into `blockHeld`, `sprint` and
   `move`.
2. In `onPreUpdate(engine, delta)`, call `tick(combat, delta, inputs)` and
   keep the returned state.
3. Copy `state.player.pos` and each `enemy.pos` onto their actors. The rules
   own positions, including rolls, lunges and knockback. They know nothing
   about walls, so after each tick the scene clamps positions against the
   level by writing them back into the returned state, which belongs to the
   scene until the next tick.
4. Pick animations from `action.kind` (and `action.t` for the frame), and
   play effects from the events: `camera.shake(m, m, duration)` for `shake`,
   and freeze the two actors' sprite animation for `hitStopMs`. The rules
   already freeze those two bodies' timers for the hit-stop.
5. Read the HUD from the state: `hp`, `maxHealable()`, `haloDimmed`, `lives`,
   `posture` and `maxPosture`, `fervour`, `grace`, and the cooldowns
   (`parryCooldownMs`, `rollCooldownMs`, `criticalCooldownMs`).

## The rules in brief

- **M1 chain.** Each weapon has `chainLength` light hits and then a
  flourish that knocks back and has long end lag. A Hymn cast cancels that
  end lag. The chain resets after `CHAIN_RESET_MS` without an M1.
- **Parry.** The F press opens the weapon's parry window and starts the
  1.2 s cooldown. A success stuns the attacker, deals the weapon's parry
  posture damage, gives back posture, resets the cooldown and grants 0.3 s of
  auto-parry. A miss holds you in a shaky block for `MISSED_PARRY_BLOCK_MS`.
  A hit on a shaky block costs 1.5 times the posture and stuns you briefly.
- **Block and posture.** A blocked hit adds its posture damage. Reaching full
  posture is the overflow, and the next blocked hit guard-breaks you
  (stunned 1.05 s, posture reset). Posture regenerates after a short delay
  while you're not blocking or sprinting.
- **Roll.** 250 ms of i-frames in a 400 ms roll, then a 1.5 s cooldown. It
  can cancel the recovery of a light hit that landed. Right-click
  roll-cancel is a hook behind `ROLL_CANCEL_ENABLED`, off for now.
- **Critical.** One per weapon, with its own cooldown. It can't be feinted.
- **Feint.** Right-click during the wind-up of an M1 or flourish cancels it.
  Feints have a cooldown, and only `FEINT_LIMIT` may come in a row before a
  swing reaches its active frames.
- **Fervour and Outcry.** Fervour comes from hitting, being hit, blocked
  hits and parries, and decays after a delay. With 40 or more, G spends 40
  on Outcry, which can also be used out of hitstun. It pushes enemies in
  range back and staggers them. If it whiffs or is parried, you're stunned.
  In combat, Grace regenerates only while Fervour is above zero.
- **Two lives.** The first lethal hit emits `struckDown` and dims the halo,
  which locks `HALO_DIM_FRACTION` of max HP away from healing. The second
  emits `castOut`. If `throneAnswerReady` is set, a lethal hit heals instead
  and emits `throneAnswered`.

## The feint-reading enemy

When the hero starts a swing within reach, a free enemy schedules a read at
`readAtFraction` of the wind-up. At the read, it commits with
`commitChance` (scaled by familiarity for adaptive enemies) to one reaction,
weighted by `reactionWeights` and limited to what's available:

| Reaction | Against a real swing | When baited by a feint |
| --- | --- | --- |
| Parry | Parries you: you're stunned and take posture damage | Whiffs. It goes on cooldown and is stunned, and while exposed, clean hits also deal posture damage |
| Block | Blocks: posture damage to it | Locked in the block for `ENEMY_BLOCK_HOLD_MS` and can't attack |
| Roll | Dodges through the hit | The roll plays out, and its end lag can be hit (follow through) |
| Counter | An armored counter trades with your swing | The counter comes anyway, and you can parry it |

The trait presets are in `READ_TRAIT_TUNING`:

- **Gullible:** reads early (20% of the wind-up) and commits 90% of the time.
- **Wary:** reads late (85%) and commits 15% of the time, so only a
  last-moment feint can bait it.
- **Adaptive:** reads at 35% and commits 85% of the time, but remembers your
  feints by swing type, chain step and timing (in 50 ms buckets). Each
  repeat of the same rhythm cuts its commit chance by `learnPerRepeat`, down
  to `familiarityFloor`, and the memory fades at `forgetPerSec`. Varying
  your timing or chain step keeps it guessing.

Over 200 seeds, a feint 150 ms into the sword's 300 ms wind-up baits a
gullible enemy 91% of the time and a wary one never. At 270 ms it baits a
wary enemy 17% of the time. An adaptive enemy falls from 89% to 6% over
seven identical feints and is back to 86% after 40 s.

Enemies attack in a loop. An `enemyTelegraph` event starts each wind-up
(every ordinary attack winds up for at least 300 ms), followed by the
active frames, the recovery and `attackIntervalMs`. Unparryable attacks
telegraph red and go through a parry, but not through a block.

## Tests

```bash
npm run test:hoh          # the existing vitest suite, then the combat tests
npm run test:hoh:combat   # tsx --test test/heaven-or-hell-combat*.ts
```

The tests use `node:test` through `tsx`, because plain `node --test` can't
resolve the extensionless imports that webpack expects.
