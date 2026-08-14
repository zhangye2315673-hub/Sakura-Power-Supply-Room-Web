# Refrigerator quality contract

## Classification and complexity

- Primary domain: hard-surface articulated appliance with organic/packaged food subassemblies.
- Structure: layered shell, articulated double door, repeated shelving and bins, detachable-looking but timeline-bound props.
- Motion: hinged doors plus seven independently animated props following sockets and collision-clear paths.
- Complexity: complex. Identity depends on cavity depth, interior hierarchy, prop readability and return-path correctness rather than exterior silhouette alone.

## Definition of done

1. Opening either door reveals a real recessed volume with a back, sides, ceiling/floor, full-depth shelf and drawer hierarchy.
2. At least seven semantically distinct food/packaging props are recognizable by geometry and material layering at gameplay scale.
3. Every prop has a named pivot, semantic home zone, home socket, launch index and route side.
4. The single shared timeline completes: open -> staggered launch -> side/rear party orbit -> front gathering -> staggered exact return -> close.
5. Any rear-to-front segment keeps `|x| >= 1.90` while crossing the cabinet depth; cabinet half-width is `1.42`, giving at least `0.48` clearance.
6. Game and gallery use `AppliancePerformanceSystem` and the same timestamp. Gallery auto-rotation remains active.
7. No refrigerator-owned `PlaneGeometry`, `Line`, `Sprite`, generic food pool or generic debris/frost pool is visible.

## Feature floors

- Macro: 2 cavities, 2 doors, 1 cabinet frame, 1 rear service assembly.
- Meso: at least 3 full-depth shelves, 1 produce drawer, 4 door bins, 7 named food props, 7 home sockets, 4 route-waypoint sockets.
- Micro: gasket, shelf front lips, milk label/cap, fish belly/eye/tail, steak fat cap, container lid/contents, fruit stems, carrot leaves, broccoli florets, bottle shoulder/cap/label.
- Repetition systems: cabinet side rails, cavity wall pairs, shelf/lip pairs, door bins, produce cluster, route-side alternation.

## Material contract

- Cabinet: warm ivory toon body, brighter door faces, cool lavender shadow frame, dark gasket and rubber foot accents.
- Interior: cool desaturated liner and darker back panel; translucent shelf/drawer materials require thickness and nearby opaque rails so they do not read as flat sheets.
- Props: minimum two material regions on milk, fish, steak, container, vegetables and drink; fruit uses color and stem layers.
- No albedo texture is reused as roughness/normal/AO. This real-time SAKURA model uses geometry, bevels, toon value separation and scene contact lighting instead of claiming recovered PBR maps.

## Action-readiness

- Door pivots sit at the right hinge edge.
- Food pivots remain root-owned so the shared performance can move them without reparenting.
- Door-shelf props store a door-local home position and are transformed back into root space each frame.
- `sculptRuntime` publishes wall colliders, opening triggers and named sockets.
- Attachment gap tolerance: handles and bin rails `<= 0.03` local units; shelf/front-lip separation `<= 0.02`.

## Required reviews

- Closed front three-quarter: exterior silhouette and door alignment.
- Open front three-quarter at `0.76s`: cavity depth, shelves, drawer and door bins.
- Party climax at `3.40s`: all props gathered at the front, recognisable and free of cabinet penetration.
- Side/rear path sample around `2.25s`: props use side clearance rather than crossing the body.
- Return at `4.62s`: every prop is at its exact semantic home before the doors close.
- Gallery at the same timestamps: same timeline values plus non-zero auto-orbit delta.

## Stop/fail thresholds

- Any visible prop is a plane, line, sprite or unlayered color card.
- Any cavity is a shallow front plate or the rear panel visually sits in front of the shelves.
- Any rear-to-front waypoint pair crosses the cabinet with `|x| < 1.90`.
- Any returned prop is farther than `0.001` local units from its current home socket.
- Door-shelf props do not follow the door during open/close.
- Generic `food` or refrigerator-owned `debris` pool activity is non-zero.
- Stop/reset leaves an interior, prop, door rotation or diagnostics entry active.
