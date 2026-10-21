# Street

Scene one of the sidewalk game. Open it at [/#street](https://thoughtpivot.github.io/terrene/#street). `#sceneone` lands on the same scene. Oka World stays the default.

You carry a box of Cheesy Squares. Twenty people sit against the buildings. Press E to ask. Half the time they refuse, and that ask is over. A yes is one sentence, and they follow you. One follower at a time. Q sends them back before any sale, and that does not call anyone. E again hands over the box. You stay put while the money changes hands, then while they open the box and start chewing. After that you can walk. They stay where the sale finished. You cannot ask them again.

A pedestrian who is close enough and can see the handoff calls the police. Walls block sight, so the pocket around the corner of an alley is the quiet spot. Police show up five seconds after a witnessed handoff finishes or is backed out of (E during the exchange). They sprint a little faster than you, then run out of breath. Hold Shift to sprint. Climb into an alley dumpster with E. A cop who walks up to that dumpster pulls you out. A car, or an arrest, restarts the scene at $0.

Cars drive the streets and stop for red lights, stop signs, and anyone standing on a crosswalk. The rest of the road is open. Crosswalks are the safe place to cross. Four blocks, two lights, three stop signs. Ten sales at $50 clears the $500 goal.

## What later levels can change

`rules.ts` is the game. These stay the same on every block:

- E asks, and the answer is a 50% coin flip
- One follower, Q dismisses them quietly, E sells
- The rooted handoff, then the chew, then they stay
- Witnesses need distance and a line of sight, and only during the handoff
- Police are five seconds behind a witnessed finish or abort
- Dumpsters, Shift to sprint, cars, crosswalks
- Death and arrest restart at $0

`level.ts` is the block. A later level is a new `StreetPack` passed into `Street`:

- The map: blocks, alleys, dumpsters, seats, lanes, crosswalks
- Which corners are lights, stop signs, or open
- How fast cars move, how many share a lane, how long the lights stay green
- How many pedestrians, and the loops they walk
- The price and the dollar goal
- Witness radius, police delay, police sprint and recovery, how close a cop must be to pull you out of a dumpster
- Afternoon or dusk
- The scene to open after a win (`next`), or none

Scene one is `buildSceneOne()`. A later block can reuse `buildTown`'s street grid by adding another builder beside it, or it can return a different `City` if the streets themselves change. Register the new pack on its own hash in `Terrene.ts` the same way `#street` is registered.
