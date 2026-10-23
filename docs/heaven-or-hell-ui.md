# Heaven Or Hell UI

The UI kit for Heaven Or Hell: the in-world HUD, the reusable widgets and two
menu mocks (the Gift hand and the Choir picker), all drawn by one corruption
theme. Everything is Excalibur graphics: `ScreenElement`s carrying `Canvas`
rasters, plus `Text` and `FontSource`. There is no DOM overlay.

Preview it at `/#heavenorhellui`. Oka World is still the default route.

```
src/components/scenes/HeavenOrHell/ui/
  color.ts      pure: Rgb, mix, ramp, smoothstep, WCAG contrast
  theme.ts      pure: themeFor(corruption, stain) and the tier names
  hudState.ts   pure: bar trails, HP/posture/fervour views, cooldowns,
                the halo state, tiers, toasts, typewriter, hudLayout
  paint.ts      Canvas 2D painters: frames, veins, cracks, bars, the halo,
                cooldown tiles, Hymn slots, Gift cards, key caps
  icons.ts      line glyphs (roll, parry, block, feint, critical, trumpet, ...)
  fonts.ts      FontSources and loadUiFonts()
  fonts/        Cinzel, Cormorant Garamond and Inter (woff2) with OFL licences
  widgets.ts    UiWidget and every widget (kit and HUD)
  hud.ts        HohHud: the HUD a gameplay scene owns
  screens.ts    menu screens: Kit, Gift Hand, Choir
  hd.ts         HdScreen: the crisp 1280x720 switch, restored on leave
  UiPreview.ts  the preview scene
test/heaven-or-hell-ui.ts   tests for the pure modules (npm run test:hoh-ui)
```

## Look

The base is the dark Death's Door look: near-black glass panels, a single
hairline frame and small corner ornaments. Colour carries meaning:

- **White and gold** belong to Heaven and to the player: filigree, headings, HP,
  the halo and the selected state.
- **Orange** means a warning: posture nearing a guard break, a breach widening.
  It is fixed at `#ff9a2e` and never changes with the tier.
- **Red** means danger: damage taken, a guard break, a lethal hit. It is fixed
  at `#ff3a2a`.

Because those two roles never move, a player can still read a warning at Tier 5
when the whole frame has gone red-black. Text is Cinzel for headings, Cormorant
Garamond for prose and Inter for numbers and small labels.

## HUD layout

The layout is designed at 1280x720 and scaled to fit the screen
(`hudLayout(width, height)`, scale = min(width/1280, height/720)). Like
Deepwoken, it keeps to the edges and leaves the middle of the screen clear.

| Widget | Where | Size (ref px) | Contents |
| --- | --- | --- | --- |
| Vitals | bottom-left | 368x150 | halo and life pips, name, HP, Posture, Grace, Fervour, Sanctity, the cooldown row, the halo mark |
| Hotbar | bottom-centre | 452x86 | weapon slot and six Hymn slots |
| Tier | top-right | 252x64 | the World Corruption numeral, the tier name and progress to the next tier |
| Toasts | top-centre | 340 wide | up to three, fading in and out |
| Dialogue | above the hotbar | 640x132 | nameplate tab, typewriter text, page count |
| Prompt | centre, at 52% of the height | 260x40 | key cap and an action, such as `[E] Pray at the altar` |

Inside the vitals panel, from the top:

- **The halo**, a medallion on the left edge. The life pips sit under it.
- **The name** and `HP / max`. The HP number turns red when HP is low.
- **Posture**: a thin bar above HP that fills as you take blocked hits. It turns
  orange at 70% and red at 90%.
- **HP**: the thick gold bar. It has a red recent-damage trail, a white flash on
  healing and a hatched ash section past the healable cap once the halo has dimmed.
- **Grace** (pale blue-silver), with its label to the right of the bar. Grace is
  spent on Hymns.
- **Fervour** with the 40 Outcry notch. The notch lights and the label reads
  `FERVOUR · G` once 40 is stored. **Sanctity** sits beside it.
- **The cooldown row**: roll, parry, block, feint, critical and the Trumpet,
  as small diamond tiles. While cooling a tile turns red with a sweep, it flashes
  as it comes ready, and it is grey when locked. The Trumpet is locked below
  Tier IV.
- **The halo mark**, an italic label at the bottom-right: Unstained, Hairline
  cracks, Cracked halo, Choir fallen, Hell's regard or The Fall.

The hotbar groups its Hymn slots as 3 combat, then support and movement, then
one slot for any Hymn. Each slot shows its key and Grace cost. While cooling,
the glyph dims and a sweep and the seconds left are shown over it. A slot you
cannot afford shows its cost in red.

Full-screen pieces:

- **Sanctity vignette**: a dark edge that closes in below 70% Sanctity.
  It only changes opacity.
- **Embers**: pooled sprites that rise from the top edges of the vitals panel
  and the hotbar as corruption rises.

## The halo

`haloState(lives, stain)` in `hudState.ts` drives the halo; `drawHalo` paints it.

- **Lives** set the brightness. With 2 lives it is full. After the first time
  you are struck down it dims to 0.5, and the healable cap shows on HP. With
  0 lives you are cast out and it falls to 0.15.
- **Stain** (0–100) sets the cracks and the red:
  - below 25: hairline cracks, with a tinge of red
  - at 25: the halo cracks
  - at 50: half the ring is red, embers drift off it, and the label reads
    *Choir fallen*
  - at 75: almost all of the ring is red, it flickers, and the label reads
    *Hell's regard*
  - at 100: the ring shatters into pieces and the label reads *The Fall*
- **The Stain track** is a thin outer ring that fills clockwise from the top,
  with ticks at 25, 50 and 75 and a diamond at the top for the Fall.

## The theme

`themeFor(corruption, stain)` in `theme.ts` is pure and cheap. It takes:

- `corruption`: World Corruption as a continuous tier, 0..5
- `stain`: the player's Stain, 0..100

It clamps both inputs and treats NaN as 0, and it returns a `UiTheme`. Every
widget paints only from that object, so the two numbers restyle the whole UI.

Tokens:

- Palette: `ink`, `panel`, `panelDeep`, `panelAlpha`, `gold`, `goldBright`,
  `glow`, `glowStrength`, `glowBlur`, `text`, `textDim`, `heading`, `vein`.
  These ramp from Heaven to Hell through two to four stops.
- Fixed roles: `warning` (orange) and `danger` (red).
- Effect amounts, 0..1: `veins`, `tarnish`, `cracks`, `chips`, `embers`,
  `shimmer`, `flicker`, `heat`, and `goldLeft`, the share of ornaments still
  gold.
- Bars: `hp`, `posture`, `grace`, `fervour` and `sanctity` as `{hi, lo}`
  gradients, plus `trail` and `track`. Bar fills drift only 35% of the way
  toward their Hell colours, so they stay readable.
- `personal`: `stain`, `veins`, `red` and `flicker`. These come from Stain and
  apply only to the player's own widgets (the vitals frame and the halo), never
  the whole screen.

Each effect fades in over its own band of the scale through `smoothstep`, so
corruption reads as a slow creep, not a switch. These are the values at
Stain 0:

| Corruption | hell | veins | tarnish | cracks | chips | embers | shimmer | flicker | heat | goldLeft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 1 | 0.10 | 0.06 | 0.03 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2 | 0.35 | 0.32 | 0.31 | 0.04 | 0 | 0.01 | 0 | 0 | 0 | 0.90 |
| 2.5 | 0.50 | 0.50 | 0.50 | 0.17 | 0 | 0.12 | 0 | 0 | 0.03 | 0.77 |
| 3 | 0.65 | 0.68 | 0.69 | 0.37 | 0.14 | 0.32 | 0 | 0 | 0.20 | 0.61 |
| 4 | 0.90 | 0.94 | 0.97 | 0.79 | 0.67 | 0.77 | 0.50 | 0.42 | 0.71 | 0.30 |
| 5 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0.15 |

What that looks like per tier:

- **Tier 0, The Calm Courts.** Heaven: near-black glass, white and gold
  filigree, a soft gold glow, gold corner ornaments and crests.
- **Tier I, Smoke from the Pit.** The first thin red veins creep in from the
  frame corners. The gold is still clean.
- **Tier II, The Locusts.** The gold warms to bronze, veins reach along the
  edges, hairline cracks appear, and the panel fill picks up a faint red.
- **Tier III, The Brands.** The gold is rusting toward ember. Frame lines
  chip, cracks branch, embers rise from the HUD and heat glows up from the
  bottom of panels. Some corner ornaments have already turned.
- **Tier IV, The Four Loosed.** Mostly ember and rust. The heat glow wavers
  and flickers, and cracks and chips are heavy.
- **Tier V, War in Heaven.** Red-black panels, ember lines and full veins.
  Only about 15% of the ornaments are still gold, as fragments.

Readability rules, enforced by `test/heaven-or-hell-ui.ts` at every tier and
Stain value:

- Text contrast against the panel (composited over the backdrop) is at least
  12:1 for `text`, 4.5:1 for `textDim` and 7:1 for `heading`.
- Every bar fill has at least 3:1 contrast against its track.
- Every token moves monotonically, and continuously, between tiers.
- Veins, cracks and embers are painted on frame edges and under the
  bars, never across a bar's fill. The vignette changes only opacity.

## Feeding it from a scene

```ts
import { HohHud } from "./ui/hud";
import { HdScreen } from "./ui/hd";
import { loadUiFonts } from "./ui/fonts";

const hd = new HdScreen(1280, 720);

onActivate() {
    hd.enter(engine, Color.fromHex("#050506"));   // crisp: resolution, pixel ratio, AA
    await loadUiFonts();                           // before the first paint
    this.hud = new HohHud(this, 1280, 720);
    this.hud.layout(1280, 720, hd.pixelRatio);
}

onDeactivate() {
    hd.leave(engine);                              // restores every engine setting
}

onPreUpdate(engine, elapsed) {
    const hud = this.hud;
    hud.setCorruption(world.corruption, player.stain);   // cheap; no-op when unchanged
    hud.setValues({
        name: "Ashael · Kindled",
        hp, hpMax, hpCap,                    // hpCap < hpMax once the halo has dimmed
        posture, postureMax,
        grace, graceMax,
        fervour, fervourMax,                 // Outcry at 40
        sanctity, sanctityMax,
        lives, maxLives: 2,
        cooldowns: {                          // seconds; locked greys the tile
            roll:     { remaining, duration, sinceReady },
            parry:    { remaining, duration },
            block:    { remaining, duration },
            feint:    { remaining, duration },
            critical: { remaining, duration },
            trumpet:  { remaining, duration, locked: world.tier < 4 },
        },
    });
    hud.setHotbar(weapon, hymns);            // HotbarSlotData: key, name, glyph, cost, cooldown
    hud.update(elapsed / 1000);
}
```

Events:

- `hud.toast(title, detail, kind)`: `kind` is one of `"grace" | "info" |
  "warning" | "danger"`. At most three toasts show at once, and the rest queue.
- `hud.say(lines, onComplete)`: takes ChatSystem-style `{ speaker, text }`
  lines, and `hud.advanceDialogue()` moves to the next one. A first advance
  finishes the typewriter; the next shows the next line.
- `hud.showPrompt("E", "Pray at the altar")` and `hud.hidePrompt()`.
- `hud.setVisible(false)` hides the HUD while a menu screen is up. Embers
  burn out instead of freezing.

`corruption` should be the continuous World Corruption value, so that the UI
creeps rather than jumps, for example tier plus progress toward the next.
Stain is the player's own value. The scene owns both, and the UI never
stores them.

## Widgets

Every widget extends `UiWidget`, a `ScreenElement` with one `Canvas`.

- Widgets paint in reference pixels. `place(x, y, scale, pixelRatio)` sets the
  element's scale and `canvas.quality = pixelRatio * scale`, so text and lines
  stay sharp at any window size.
- They repaint when state or the theme changes. Widgets with ambient effects
  (glow, flicker, embers) also repaint at 30 fps.
- Kit widgets: `Panel`, `Button` (normal, hover, pressed, disabled, with key
  hints), `GiftCard` (Common, Rare, Advanced and Fallen frames, with hover and
  selected states), `Tooltip`, and `TabBar`.
- Menu screens in `screens.ts` sit on a veil at z 110. `KitScreen` shows every
  kit widget. `GiftHandScreen` is a five-card Ascension hand with feathers, Ban,
  Take and Stay; one card turns into a Fallen Gift at Tier III and Stain 25.
  `ChoirScreen` is the first character creation step: eight Choirs with passives
  and flaws, plus a detail panel.

## The preview

`/#heavenorhellui` shows the HUD over a stand-in floor. Its light pool shifts
from altar gold to a breach, and a fissure opens as corruption rises. Tabs
switch to Kit, Gift Hand and Choir; on those tabs the HUD hides and the preview
controls fold into a strip along the bottom.

- Drag the Corruption and Stain sliders, or use ← → for corruption, ↑ ↓ for
  Stain and 0–5 to jump to a tier.
- L cycles lives, H takes a hit, Space advances dialogue, [ ] or Tab switches
  screens, P pauses the dummy values and T sweeps corruption 0→5→0 over 24 s.
- Query parameters: `?c=2.5&s=50&lives=1&tab=0&t=3&paused=1`.
- `window.__hohUi.set({ corruption, stain, lives, tab, paused, time, sweep })`
  and `window.__hohUi.state()` are for scripted screenshots.

## Deepwoken references

- **Health bar states**: the [Deepwoken Wiki, Combat Mechanics](https://deepwoken.fandom.com/wiki/Combat_Mechanics)
  page says the health bar has four states and that after dying once "it is
  rusted and more jaundiced". This led to the halo dimming after the first
  time you are struck down, and to the hatched cap on HP.
- **Posture bar**: on the same page, posture is a bar you "keep as low as
  possible" and overfilling it guard-breaks. Here that is the thin Posture bar
  with orange and red stages.
- **Cooldown icons**: the same page lists roll, parry, block, feint/cancel and
  Resonance icons, plus a critical icon under the weapon slot, which become
  "reddened/grayed out" while on cooldown. That became the diamond cooldown row
  (with the Trumpet in Resonance's place), red while cooling and grey when
  locked.
- **Tempo and Vent**: the same page says "With at least 40 Tempo, press G to
  Vent". Fervour has the 40 Outcry notch and the `G` hint.
- **Item frames**: the same page says items have "a frame on them with the
  color defining its rarity". Gift cards have rarity frames.
- **Mantra slots**: the [Deepwoken Wiki, Mantras](https://deepwoken.fandom.com/wiki/Mantras)
  page lists six default slots: Combat (3), Support (1), Mobility (1) and
  Wildcard (1). The Hymn hotbar groups its slots the same way.
- **Card terms**: the [Deepwoken Wiki, Talents](https://deepwoken.fandom.com/wiki/Talents)
  page, under "Card Terminology", names Common, Rare and Advanced cards. Those
  are the three Gift card frames.
- **Insanity**: the [Deepwoken Wiki, Insanity](https://deepwoken.fandom.com/wiki/Insanity)
  page says the meter "is not directly shown to the player, but its progress
  can be tracked by a blue hue on the border of the screen". Sanctity works
  the same way, as an edge vignette rather than a big gauge.

## Fonts

All fonts are under the SIL Open Font License, and the licence files are next
to them in `ui/fonts/`:

- Cinzel 500 and 700
- Cormorant Garamond 500, regular and italic
- Inter 500 and 600

Excalibur's `FontSource` creates a `FontFace` with no weight, so each weight is
registered under its own family name (`"HoH Cinzel Bold"`, `"HoH Inter
SemiBold"`, and so on). `loadUiFonts()` loads them all and logs any that fail.
The webpack CopyPlugin ships them to `dist/` under the same relative path.

## Excalibur limits

- **No true heat distortion.** It would need a post-processing shader over the
  whole screen. Instead, `shimmer` wavers the heat glow under panels, and
  `flicker` modulates the glows.
- **`FontSource` has no weight.** Each weight therefore gets its own family.
- **Re-rasterising is costly.** Every repaint re-uploads the `Canvas`, so
  ambient effects are capped at 30 fps and static widgets repaint only on
  change.
- **Canvas text is not sharp by default.** The scene switches to 1280x720 with
  antialiasing and a pixel ratio of up to 3 while it is active (`HdScreen`),
  and restores everything on deactivate.
