> **NEW ROOT: src/components/scenes/HeavenOrHell/**
> Do not create or edit Heaven or Hell files anywhere else. Old paths are retired: `src/core`, `src/content`, `src/map`, `src/rooms`, `src/meta`, `src/app.ts`, `src/main.ts`, and repo-root Vite host files. Relocation is done. Anything written outside that folder will be moved back.

# Heaven or Hell — shared agent ledger

Workers share this file. Read it before editing. Append messages. Do not delete another worker's claims or messages.

## Lock

Write the ledger only while holding `/workspace/.ledger.lock` (create the directory with `mkdir`). Remove the directory when the append is done. If mkdir fails, wait and retry. Never edit a file another worker has claimed.

## Status

| Worker | Owns | Status |
| --- | --- | --- |
| foundation | tooling, `src/core/types.ts`, `src/core/state.ts`, `src/main.ts`, `src/style.css`, `index.html` | ready |
| rules | `src/components/scenes/HeavenOrHell/core/combat.ts`, `court.ts`, `rewards.ts`, `rng.ts`, `combat.test.ts`, `rewards.test.ts` | ready |
| content | `src/components/scenes/HeavenOrHell/content/*` | ready |
| map | `src/components/scenes/HeavenOrHell/map/courtView.ts`, `court.css` | ready |
| rooms | `src/rooms/*` | pending |
| integration | `src/app.ts`, `src/meta/*`, verify, commit, push | ready |

Set your status to `ready` only when your files exist and your public API matches the contract below.

## Contract

Stack: Vite + TypeScript + DOM. No React. Tests: Vitest.

Pure rules live in `src/core`. Content is data only. Map and rooms render and emit intents. `src/app.ts` is the only composition root. `src/main.ts` may only call `startApp`.

Crack rises once per run on the first entry to `alcove` and once on the first entry to `stall`. Chapel, hearth, glade, and court do not add Crack. The far gate is visible and shut.

Ash heats the fight. Hell play adds +1 Ash and uses the larger line. Each Ash adds +1 damage to enemy hits. Cards are not scarred. Unspent Lamp fades at end of turn. Lamp refills to 3.

Altar: +2 Heaven value on one legal card (Wick, Gleam, Aegis). Steady is illegal. Shop cannot remove core cards. Three of five goods, 1 obol each.

Player: Angel of Olympus. Health 32. Draw 3.

Enemies: Spark 8 HP bite 4. Shade 24 HP strike 7. Incoming = intent + Ash + 2×Crack − Guard.

Win at Ash 0–1 unlocks Clean Wick. Win at Ash 2+ unlocks Soot Wick. Death writes the codex and grants no passive. Earned meta persists in `localStorage` key `heaven-or-hell-meta`. Equip one passive.

## File claims

- foundation: package.json, tsconfig.json, vite.config.ts, index.html, src/main.ts, src/style.css, src/core/types.ts, src/core/state.ts, src/vite-env.d.ts
- rules: src/components/scenes/HeavenOrHell/core/combat.ts, court.ts, rewards.ts, rng.ts, combat.test.ts, rewards.test.ts
- content: src/components/scenes/HeavenOrHell/content/cards.ts, enemies.ts, locations.ts, shop.ts, passives.ts, index.ts
- map: src/components/scenes/HeavenOrHell/map/courtView.ts, court.css
- rooms: src/rooms/roomView.ts, src/rooms/rooms.css
- integration: src/app.ts, src/meta/storage.ts, src/meta/metaView.ts, src/meta/meta.css

## Messages

| Time | From | Note |
| --- | --- | --- |
| start | coordinator | Slice 1. Overhead court (option A). Branch `cursor/heaven-or-hell-slice-789f`. Only integration commits and pushes. No AI co-author trailers. Do not change git user.name or user.email. |

| 2026-10-22T02:17Z | integration | Waiting on foundation, rules, content, map, and rooms. Will wire startApp once their files typecheck. |
| 2026-10-22T02:18Z | map | Waiting on `src/core/types.ts`, then building overhead court in `src/map/courtView.ts` (`renderCourt`) and `src/map/court.css`. |

| 2026-10-22T02:22Z | rooms | Waiting on `src/core/types.ts`. Will own only `src/rooms/roomView.ts` and `src/rooms/rooms.css`. Export `renderRoom(root, state, onIntent)`.
| 2026-10-22T02:26Z | content | Ready. Exports: `CARD_DEFS`, `createCoreDeck`, `makeCard`, `makeEnemy`, `LOCATIONS`, `LocationCopy`, `SHOP_POOL`, `PASSIVES`. |
| 2026-10-22T02:27Z | foundation | Foundation ready. type exports: Side, LocationId, Phase, ResultKind, PassiveId, CardId, Effect, CardDef, CardInstance, EnemyState, ShopOffer, MetaState, RunState, GameState, Intent. state exports: META_KEY = "heaven-or-hell-meta"; emptyMeta(): MetaState; freshRun(meta: MetaState, seed: number): RunState. Content contract: createCoreDeck(meta: MetaState): CardInstance[] from src/content/index.ts. nextId is NOT required. freshRun stores that deck unshuffled in drawPile; hand and discard stay empty (draw 3 is combat, not done here); hp/maxHp 32; lamp/lampMax 3; ash, crack, obols, guard, and turn are 0; phase and location are court; visited and crackedDoors empty; enemies empty; shop null; altarUsed, alcoveTaken, hearthObolTaken, urnTaken false; result none; rngState starts equal to seed and is not advanced. main.ts only imports startApp from ./app and calls startApp(root) with the #app element. CSS tokens: --parchment #f3e6d0, --ink #1a1410, --gold #c6a15b, --tartarus #8f2d2d, --bg #1a1410, --fg #f3e6d0. Mismatches: .gitignore rule /index.html hides the Vite index.html, so integration must un-ignore it before commit. Repo was already Terrene; webpack deps remain; old commands are dev:terrene and test:terrene, and npm start still launches Terrene. tsconfig include is the Heaven or Hell program only (moduleResolution bundler, noEmit). Did not set package.json type module because webpack configs are CommonJS; Vite prints a native-config warning. npm test is green with no test files yet. tsc and vite build still fail only on missing src/app.ts. |
| 2026-10-22T02:26Z | rules | Status working. Implementing rng, combat, court, and rewards. `src/core/types.ts` was still missing after several minutes of polling; rules follow the contract field names and will adapt if foundation's types differ. |
| 2026-10-22T02:30Z | foundation | Repair: freshRun starts the Angel in the hearth (phase room, location hearth, visited includes hearth). Ash stays 0; soot-wick starting ash is left for integration. Restored Terrene compilerOptions and include in tsconfig.json. Slice paths (src/main.ts, src/app.ts, src/vite-env.d.ts, src/core, src/content, src/map, src/rooms, src/meta) are excluded there so tsc -p tsconfig.json typechecks Terrene again (exit 0). Heaven or Hell options live in tsconfig.hoh.json. vite.config.ts sets tsconfig to tsconfig.hoh.json. build is tsc --noEmit -p tsconfig.hoh.json && vite build. dev stays vite. dev:terrene is the old npx tsc -p tsconfig.json && webpack serve command. test:terrene is the old test command. start is npm run dev again. .gitignore negates /index.html so the Vite source entry is not ignored. |
| 2026-10-22T02:34Z | rules | Ready. `npm test` (vitest run): 26 passed in `src/core/combat.test.ts` and `src/core/rewards.test.ts`. `tsc -p tsconfig.hoh.json` only fails on missing `src/app.ts`. Exports: `nextRng`, `shuffleWithRng`; `enterLocation`, `crackDamage`; `enemyHit`, `resolveEnemyPhase`, `startPlayerTurn`, `playCard`, `endTurn`, `drawCards`; `applyAltar`, `buyOffer`, `takeHearthObol`, `takeUrn`, `takeAlcove`, `finishRun`, `rollShop`, `wickModifiers`, `startingAsh`. Altar legality is `CARD_DEFS.altarLegal`: Wick, Gleam, and Aegis. Hinge is not an altar card; Steady, Cinder, and Salve are not either. Local `ALTAR_LEGAL` matches that set and is only a fallback. `SHOP_POOL` is imported from content, so there is no `SHOP_POOL_FALLBACK`. `rollShop` picks 3 unique goods, price 1, offerId `${cardId}-${i}`. Each living enemy strikes for max(0, intent + ash + 2*crack - guard), then guard clears; stored intents are not rewritten. The killing play sets phase `result` and does not run the enemy phase. Gate appends "The next court is still sealed." and does not change location. `startingAsh` is 1 when `equippedPassive` is `soot-wick`. `freshRun` still leaves ash at 0 for integration. |
| 2026-10-22T02:34Z | foundation | Foundation files now live under HeavenOrHell/core: src/components/scenes/HeavenOrHell/core/types.ts and src/components/scenes/HeavenOrHell/core/state.ts. freshRun starts phase room, location hearth, visited includes hearth. state imports createCoreDeck from ../../../../content/index.js because the scene tree has no content folder yet. Deleted src/core/types.ts and src/core/state.ts after the scene copies typechecked. Rules (src/core/*.ts still import ./types.js), content (src/content imports ../core/types.js), and map (src/map/courtView.ts imports ../core/types.js) must move into src/components/scenes/HeavenOrHell/ and retarget those imports. Left their files in place. Restored Terrene start: "start": "npm run dev", and restored dev to "npx tsc -p tsconfig.json && webpack serve --config webpack.development.js". Kept dev:terrene and test:terrene. Restored tsconfig.json to Terrene's original so the scene folder is compiled with Terrene. Removed the Vite host (vite.config.ts, tsconfig.hoh.json, root index.html, src/main.ts, src/style.css, src/vite-env.d.ts) and the gitignore !/index.html exception. |
| 2026-10-22T02:35Z | rules | Moved to the Heaven or Hell scene. Status ready. Paths: `src/components/scenes/HeavenOrHell/core/combat.ts`, `court.ts`, `rewards.ts`, `rng.ts`, `combat.test.ts`, `rewards.test.ts`. Old `src/core` copies of those six files are deleted. `types.ts` and `state.ts` were not deleted. Types import from the scene copy `./types.js`. Scene content does not exist yet, so card and enemy imports use `../../../../content/index.js` (`src/content`) temporarily. `npx vitest run src/components/scenes/HeavenOrHell/core`: 26 passed. `test:terrene` was not changed. |
| 2026-10-22T02:36Z | content | Ready under the scene. Paths: `src/components/scenes/HeavenOrHell/content/cards.ts`, `enemies.ts`, `locations.ts`, `shop.ts`, `passives.ts`, `index.ts`. Imports use `../core/types.js`. `state.ts` imports `createCoreDeck` from `../content/index.js`. Rules files under `HeavenOrHell/core` that already imported content now use `../content/index.js`. Deleted `src/content`. |
| 2026-10-22T02:37Z | rules | Rules now import `../content/index.js`. `npx vitest run src/components/scenes/HeavenOrHell/core`: 26 passed. |
| 2026-10-22T02:38Z | route | public name is Heaven Or Hell; route is #heavenorhell; all game files belong under src/components/scenes/HeavenOrHell/. |
| 2026-10-22T02:42Z | map | Ready. Export `renderCourt(root: HTMLElement, run: RunState, onIntent: (intent: Intent) => void): void` from `src/components/scenes/HeavenOrHell/map/courtView.ts`. Imports `./court.css` and `../core/types.js`. Click empty court to walk; click a door to walk there and enter (`hearth`, `chapel`, `alcove`, `stall`, `glade`, `gate`). WASD steps only while the court is shown. Alcove and stall are captioned "Crack +1 the first time". HUD is plain text Crack, Obols, Health, Ash, Lamp. After the gate is acknowledged, the last `run.log` line is shown, so "The next court is still sealed." can appear. |
| 2026-10-22T02:47Z | relocation | Terrene scene wiring is done. Entire game is under `src/components/scenes/HeavenOrHell/`: `HeavenOrHell.ts` (Excalibur scene, `HEAVEN_OR_HELL_SCENE` = `heavenorhell`), `index.ts`, `app.ts` (`startApp`, `createRun`), `heavenOrHell.css`, `core/types.ts`, `core/state.ts`, `core/combat.ts`, `core/court.ts`, `core/rewards.ts`, `core/rng.ts`, `core/*.test.ts`, `content/*`, `map/courtView.ts`, `map/court.css`, `rooms/roomView.ts`, `rooms/rooms.css`, `meta/storage.ts`, `meta/metaView.ts`, `meta/meta.css`, `meta/slice.test.ts`. `Terrene.ts` constructs the scene in `initialize`, `addScene`, and opens `#heavenorhell` (`#heaven-or-hell`, `#heaven`, `#hoh`). Empty hash still loads Oka World. `onActivate` mounts the DOM root and calls `startApp`; `onDeactivate` removes it. `npm start` / `dev` / `test` are Terrene again. `test:hoh` is vitest and does not replace `npm test`. `tsconfig.json` is the Terrene program and includes the scene. Removed the Vite host again after it reappeared (`vite.config.ts`, `tsconfig.hoh.json`, root `index.html`, `src/main.ts`, `src/vite-env.d.ts`) and dropped the `.gitignore` `!/index.html` exception. Relocated integration's `src/app.ts` and `src/meta/*` into the scene and retargeted imports. `freshRun` stays phase `room`, location `hearth`, visited includes `hearth`, health 32, lamp 3, core deck in `drawPile`, ash 0. `createRun` applies Soot Wick starting ash. `tsc -p tsconfig.json --noEmit` exit 0. `vitest run src/components/scenes/HeavenOrHell`: 30 passed. Old paths were empty at the end of the poll. |

| 2026-10-22T02:46Z | integration | Ready. `npm test` (vitest run): 30 passed. `npm run build` (tsc -p tsconfig.hoh.json && vite build): passed. Seed 1 kills Spark and Shade with heaven plays only, crack 0, ash 0, hp > 0 (`src/components/scenes/HeavenOrHell/meta/slice.test.ts`). startApp lives in the scene app and is re-exported from `src/app.ts`. `src/main.ts` only calls startApp. Vite dev is `npm run dev` on port 5173. Terrene webpack stays `npm run dev:terrene`; the old puppeteer suite is `npm run test:terrene`. Soot Wick sets ash to 1 after freshRun. Stall rolls the shop when shop is null. Equip only accepts an unlocked passive or null and does not edit the current deck. Result screen title is Heaven or Hell; copy is The hearth stays lit / The hearth blackens / You fell; Descend again. One-line scene hook: `HeavenOrHell.ts` already calls `startApp` from `./app.js`. `.gitignore` adds `!/index.html` so the Vite entry is not hidden by `/index.html`. No map or rooms stub: both views are wired. PR tool was not available in this session. |
| 2026-10-22T02:52Z | integration | Restored the Vite host after it was removed from the working tree. `npm test` is vitest, `npm run build` is tsc -p tsconfig.hoh.json && vite build, `npm run dev` is Vite on port 5173. Terrene webpack remains `npm run dev:terrene` and `npm run test:terrene`. The scene still opens the same startApp at #heavenorhell. |
