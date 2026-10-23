# Heaven Or Hell source paintings

Every sprite in the Heaven Or Hell scene is cut from one of the paintings in
`source/`. They were made with an image generator from the prompts below,
then keyed, scaled and packed by `build-art.ts`:

```
node tools/heaven-or-hell/build-art.ts
```

The script writes `src/components/scenes/HeavenOrHell/art/heaven-props-0.png`
with `art/atlas.ts`, and `src/components/characters/player/Auriel/Auriel.png`
with `Auriel.atlas.ts`. The halo, the soft glow dot and the contact shadow
are drawn by the script itself, not painted.

## The camera

Every painting is drawn for the same fixed camera: orthographic, about
46 degrees down from the horizon, turned 45 degrees so things are seen
corner-on along a diagonal. A square footprint shows as a diamond 0.72 times
as tall as it is wide (`FOOTPRINT_RATIO`). Paintings that came out a little
flatter or steeper are evened out by a vertical scale in `build-art.ts`
(`footRatio` per prop), measured by hand from each painting's footprint.

## The shared style block

Every environment prompt starts with this block, so the paintings share one
look and one angle:

> Video game sprite asset in the style of Death's Door (Acid Nerve 2021):
> chunky bevelled stylised 3D forms, cel/toon shading with three hard value
> bands, thick dark ink outlines. Fixed orthographic camera tilted 45 degrees
> down from horizontal and rotated 45 degrees around the vertical axis, so
> the object is seen corner-on along a diagonal: the top face and two side
> faces are visible, like an isometric diorama piece.

and ends with this one, so the field keys out cleanly:

> Single isolated object centered and fully visible, nothing cropped, no cast
> shadow, no floor, no text, no border. Background is a perfectly flat solid
> pure magenta (#FF00FF) colour everywhere around the object, no gradient, no
> vignette, no magenta tones inside the object.

The steep variant used for `pillar-a.jpg` and `hero-sheet.jpg` replaces the
camera sentence with:

> STEEP high camera: orthographic camera pitched 50 degrees down from the
> horizon (a steep top-down three-quarter view, much steeper than classic
> isometric), and turned 45 degrees so the object is seen corner-on along a
> diagonal. Because the camera is steep, the square plinth top appears as a
> fat diamond that is almost as tall as it is wide (height about three
> quarters of its width), the top faces are large and clearly visible, and
> the vertical side faces look shortened.

The marble is painted pale on purpose. In the scene it is lit per pixel by
the braziers, the altar, the breach and the hero's halo, and falls to
near-black away from them, so the ruins read as white stone in the dark.

## Paintings

| File | Size | Subject (between the style blocks) |
| --- | --- | --- |
| `pillar-a.jpg` | 720x1280 | (steep camera) One tall ancient broken pillar of white marble, heavy square plinth base with bevelled steps, thick fluted round column shaft with a cracked jagged broken top, two inset bands of tarnished gold ornament around the shaft. Stone is pale white-grey marble with cool grey shadows; gold bands are warm gold. Lit by a dim cool key light from the upper left. |
| `pillar-b.jpg` | 720x1280 | The same pillar with the standard camera block, plus "chipped bevelled edges". |
| `pillar-broken.jpg` | 1024x1024 | A short broken white marble column stump, only about one third of a full column remains, standing on a square bevelled plinth, jagged cracked top, one tarnished gold ornament band, a few fallen marble chunks touching the plinth. |
| `brazier.jpg` | 864x1152 | An ornate golden brazier on a short white marble pedestal, a wide shallow gold bowl with bevelled rim, holding a bright blazing holy fire of white-hot core and vivid golden-yellow flames rising up, a few sparks. The flame is very bright and saturated, glowing. |
| `altar.jpg` | 1024x1024 | A sacred heavenly altar, the focal object of a ruined temple: a wide stepped white marble dais with three bevelled steps, on top a heavy marble altar block with gold inlaid trim and gold corner caps, and floating just above it a radiant glowing golden-white holy orb of light with thin gold rays. |
| `arch-wall.jpg` | 1152x864 | A ruined white marble temple wall segment with a broken round arch, running diagonally from lower-left to upper-right across the image, made of big bevelled marble blocks, one side crumbled down to rubble, tarnished gold trim along the top course, cracks and chipped edges. |
| `rubble.jpg` | 1152x864 | A low pile of ruined temple rubble: a toppled fluted white marble column lying on the ground broken into three drums, scattered bevelled marble blocks and a cracked gold ornament fragment. Low and wide, knee height. |
| `statue.jpg` | 864x1152 | A weathered white marble statue of a praying robed angel with folded stone wings, standing on a square bevelled marble plinth, the statue's head and one wing tip broken off, cracks across the robes, a thin tarnished gold band on the plinth. |
| `hell-spikes.jpg` | 1024x1024 | A cluster of Hell's corruption bursting up from the ground: jagged black obsidian spikes and twisted charred rock horns, split by glowing vivid red molten cracks, with a few small bright orange embers, waist to chest height. Near-black rock with dark grey bevel highlights and intense red glowing seams. |
| `breach.jpg` | 1280x720 | Ground decal. A Hell breach tearing open through a broken white marble floor: a long jagged fissure running diagonally, its depths glowing with molten vivid red and orange hellfire light, cracked floor slabs tilted up and charred black around the rim, black obsidian shards and thin red glowing veins creeping outward through the stone. Very high contrast. Flat on the ground, seen from above at the camera angle. |
| `floor-plaza.jpg` | 1280x720 | Ground decal. A square raised floor platform of large bevelled white marble slabs, one low step high, with a circular inlaid gold sigil of concentric rings and a star in the middle, a few cracked and missing slabs, chipped bevelled edges, the near edges show the short side faces of the step. Flat and low, no objects on it. |
| `hero-sheet.jpg` | 1280x720 | (steep camera) Character turnaround sheet. A small lesser angel, a stylised hooded figure in long flowing robes that taper to a pointed hem, no legs visible, hovering. The robes and hood are near-black charcoal monochrome cloth with subtle cool grey toon highlights. A thin bright gold trim line runs along the hood edge, the sleeve cuffs and the robe hem. The face is hidden in deep black hood shadow with two small glowing gold eyes. Arms tucked into wide sleeves. No wings, no halo, no weapon. Four views of exactly the same character at the same size and the same steep camera, in one horizontal row with wide empty gaps: facing the camera (south), three-quarter facing down-right (south-east), three-quarter back facing up-right (north-east), back view (north). |
| `hero-wing.jpg` | 1024x1024 | A single angel wing, seen from the side, spread and raised, attached point at the lower left, wing tip at the upper right, layered chunky stylised feathers. The feathers are near-black charcoal monochrome with cool grey toon highlights, and every feather edge is outlined by a thin vivid glowing gold line, brightest along the leading edge and tips. |
| `hero-arm.jpg` | 1280x720 | A stylised arm in a wide near-black charcoal robe sleeve with a thin bright gold cuff, ending in a black leather gloved hand gripping a short holy flaming sword, pointing straight horizontally to the right. Gold crossguard and pommel, a straight blade wreathed in white-hot and vivid golden-yellow flame. No skin visible. |

## Rejected

These were generated, checked and not used. They are not kept in `source/`.

| Painting | Why |
| --- | --- |
| First hero turnaround sheet (standard camera) | Too shallow: the figures were seen nearly side-on, so they did not match the props' steep angle. Replaced with the steep-camera sheet. |
| First sword arm | The hand was bare brown skin, off the monochrome palette, and it was drawn flat, without the toon bands of the rest. Replaced with the gloved arm. |
