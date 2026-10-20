# Forest Last Sap World

## Overview

Forest Last Sap World (`/#sapworld`, also reachable at `/#forestlastsapworld` or `/#sapwell`) is a long, five-zone physics construction puzzle scene inspired by *World of Goo* (2D Boy, 2008). Set in a twilight heartwood forest, you drag and weave living globs of sap into triangulated bridges, suspended canopy trusses, and updraft-lifted spans across a 3,600-unit expanse to reach the Heartwood Cistern Pipe.

Every musical element and sound effect in the scene is composed strictly in the **key of C minor** at **106 BPM** with a downtempo Detroit techno / minimal tech house aesthetic (`tools/sap-world/compose_music.py`).

## Five Forest Zones

| Zone | Span (`x`) | Features |
| --- | --- | --- |
| I · The Sapling Cradle | `0 – 720` | Starter root triangle, 14 awake sap globs, first mossy ravine, and Moss Bough Grove |
| II · The Amber Arch | `720 – 1440` | Overhead canopy bark anchors, rotating bramble thorn wheel, and Sunken Buttress Grove |
| III · Spore Updraft Chasm | `1440 – 2160` | Bioluminescent updraft vent, Spore Lantern Isle, and lighter-than-air Spore Floaters |
| IV · The Great Hollow Span | `2160 – 2880` | Twin hollow stone pillars, overhead canopy anchor, and Whispering Bark Grove |
| V · Heartwood Cistern Sanctum | `2880 – 3600` | Heartwood Sanctum Grove, sanctum starter footing, and the high brass Heartwood Cistern Pipe |

## Sap Species

| Species | Max Strands | Detachable | Pipe Eligible | Behavior |
| --- | --- | --- | --- | --- |
| Amber Sap (`amber`) | 2 | No | Yes | Standard structural sap; pulls connections toward optimal rest length |
| Heartwood White (`albino`) | 4 | No | Yes | Long-reach pearl sap that weaves up to 4 strands for wide spans |
| Canopy Ivy (`ivy`) | 3 | Yes | Yes | Emerald vine sap that can be detached from the structure and re-placed |
| Spore Floater (`balloon`) | 1 | Yes | No | Lighter-than-air violet spore sac (`gravity < 0`) that lifts sagging spans |

## Musical & Sonic Architecture (Key of C Minor · 106 BPM)

The score (`SapWorld.mp3`, 64 bars at 106 BPM, circularly looped) and all ten sound effects (`sfx/*.mp3`) are synthesized by `tools/sap-world/compose_music.py`:

- **Kick & Sub-Bass**: Four-on-the-floor 909-inspired sub kick tuned to `C1`/`C2` (`32.70 Hz` / `65.41 Hz`) with a rolling 16th-note minimal tech sub-bassline in C minor.
- **Detroit Dub Chords & Pad**: Minor-9th analog chord stabs (`Cm9`, `Abmaj9`, `Fm9`, `Gm7(b13)`) fed through a dotted-eighth (`3/16`) ping-pong tape delay and dark forest convolution reverb.
- **Minimal Percussion & Lead**: Swung 16th hi-hats, offbeat smoky open hats, C-minor wood clicks (`C5`, `Eb5`, `G5`), minimal arpeggios, and a late-night Detroit analog lead.
- **Harmonic SFX**: `grab`, `attach`, `detach`, `wake`, `strain`, `snap`, `launch`, `signpost`, `suck`, and `win` are all voiced in C minor, and consecutive placements/collections step through exact C-minor scale ratios (`C, D, Eb, F, G, Ab, Bb, C`).

## Controls

| Action | Mouse / Pointer | Keyboard |
| --- | --- | --- |
| Pick up / weave sap glob | Left-drag & release | — |
| Pan camera across the 5 zones | Drag empty sky, or edge-scroll while holding a glob | `A` / `D` or `Left` / `Right` |
| Jump camera to Zone I–V | Click `Zone 1` – `Zone 5` in top bar | `1` – `5` |
| Sound C-Minor Arbiter Whistle | Hold Right-Click | Hold `W` |
| Undo last placement (Time Moth) | Click `Undo` in top bar | `Z` or `U` |
| Read Watcher Signpost | Click `?` signpost | `Escape` to close |
| Reset expedition | Click `Reset` | `R` |
