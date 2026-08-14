# SAKURA Blender v2 — quality contract

## Frozen runtime contract

- Full-tree bounds remain exactly `min[-1.61228263,0.04,-1.51306522]`, `max[2.11908197,4.8,1.6625]`; ground Y remains `0.04`.
- Existing animated node names, parents, local transforms, colliders and destruction groups remain unchanged.
- Ten existing semantic sockets retain local position, quaternion and direction. Four zero-geometry scene-edge connection sockets are added at the archived v1 Box3 fallback anchors.
- `AppliancePerformanceSystem` remains the only timeline owner; model geometry adapts to animation anchors, never the reverse.

## Visual acceptance

- Base, jar, lid and handle visibly use 6–12 sided profiles, broad facets and restrained stepped bevels.
- The dial is enlarged visually without moving its frozen pivot or exceeding the base footprint.
- Transparent jar, opaque fruit, steel blades and powered smoothie sort correctly from front, side, back and three-quarter views.
- Outline hierarchy is stable under rotation and animation; liquid, splash and tiny transparent components do not form dark contour clumps.
- Overall visual score is at least `0.80`; silhouette, vessel, animation contact and outline critical features are at least `0.82`.

## Animation acceptance

- Startup, chop, blend, first lid bounce, second lid bounce, wind-down and stop are sampled.
- Fruit and chunks remain inside the jar; liquid rises from the blade area; both splash families emit from the existing mouth sockets.
- Lid bounce remains attached to the jar coordinate frame and returns to the archived lid seat.
- Stop restores transforms, visibility, opacity and emissive state exactly; repeated sessions have one owner and no residue.

## Performance acceptance

- Peak triangles are at most `1.35 × 29082 = 39260`.
- Peak draw calls are at most `1.20 × 92 = 110`.
- Three create/destroy cycles contain no NaN and dispose every geometry and material.
- Repeated details share geometry where this does not break stable node identity or destruction groups.
