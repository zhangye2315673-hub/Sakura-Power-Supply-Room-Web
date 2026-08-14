# SAKURA Game Controller v2 - quality contract

## Frozen runtime contract

- Full-tree v1 bounds remain within 2 percent of `min[-3.09744048,-0.63512782,-0.96889679]`, `max[3.09259112,4.20535533,1.105]`; ground Y remains within `0.005`.
- Existing animated node names, parents, local transforms, colliders and destruction groups remain unchanged.
- Existing semantic sockets retain local position, quaternion and direction. Four scene-edge connection sockets are added at the archived v1 Box3 fallback anchors.
- `AppliancePerformanceSystem` remains the only timeline owner and model-owned effects remain the only controller spectacle implementation.

## Visual acceptance

- Shells, grips, controls and shoulders visibly use 6-12 sided profiles, broad facets and restrained stepped bevels.
- Functional masses are enlarged by at most 15-20 percent locally without changing the overall footprint or frozen pivots.
- Side view reads as a faceted ergonomic S-curve rather than a straight slab; front and back control counts remain identical to the reference.
- Outline hierarchy remains stable under rotation and animation; D-pad, small buttons and rear screws do not become black contour clumps.
- Overall visual score is at least `0.80`; silhouette, controls, animation contact and outline critical features are at least `0.82`.

## Animation acceptance

- Anticipation, heartbeat, frenzy, ultimate burst, ready finale, settle and stop are sampled.
- D-pad, four face buttons, two sticks, home/status and all four shoulder controls remain attached and do not penetrate the new shell.
- Five stars, four electric bolts, eight impact shards and six energy points retain their existing parents, counts and emission positions.
- Stop restores transforms, visibility, opacity and emissive state exactly; repeated sessions have one owner and no residue.

## Performance acceptance

- Static triangles are at most `1.35 x 58400 = 78840`; peak powered triangles are at most `1.35 x 61368 = 82846`.
- Static draw calls are at most `1.20 x 74 = 88`; peak powered draw calls are at most `1.20 x 108 = 129`.
- Three create/destroy cycles contain no NaN and dispose every geometry and material.
- Repeated controls share geometry where stable node identity and destruction groups permit it.

