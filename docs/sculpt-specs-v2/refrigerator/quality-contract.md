# SAKURA Refrigerator v2 - quality contract

## Frozen runtime contract

- Full-tree v1 bounds remain within 2 percent of `min[-1.42,0,-1.1895]`, `max[1.465,5.145,1.45]`; ground Y remains within `0.005`.
- Existing animated node names, parent paths, local transforms, 19 semantic sockets and five collider records remain unchanged.
- Four scene-edge connection sockets are added exactly at archived fallback anchors: left `[-1.455,2.5725,1.485]`, right `[1.5,2.5725,1.485]`, top `[0.0225,5.18,1.485]`, bottom `[0.0225,-0.035,1.485]`.
- `AppliancePerformanceSystem` remains the only timeline owner. Door motion, food routes and compressor vibration are not relocated to fit the new visual model.

## Visual acceptance

- Closed front, side, back and three-quarter silhouettes remain recognizably the same refrigerator and stay within the v1 envelope.
- Cabinet, doors, crown, plinth, handles and rear service plate use broad 6-12 sided planes, stepped chamfer bands and controlled undercuts instead of smooth white slabs.
- Functional features are enlarged locally by roughly 15-25 percent without changing hinge pivots, door arcs, cavity openings, shelf heights or external footprint.
- The outline hierarchy remains stable under rotation and animation; gasket, vent, fastener, transparent shelf and food detail do not form black contour clumps.
- Overall visual score is at least `0.80`; silhouette, door/cavity structure, animation contact and outline hierarchy are each at least `0.82`.

## Animation acceptance

- Open, staggered launch, side-clear orbit, front party, return, close and stop are sampled.
- Both doors reach their existing peak angles; handles, liners and four door bins stay attached without intersecting the cabinet or each other.
- Seven food props retain their home sockets, launch order, side-clearance route and front-party climax; no prop launches from an old surface position.
- Stop restores every transform, visibility and material state exactly; repeated sessions have one owner and no residue.

## Performance acceptance

- Static triangles are at most `1.35 x 62494 = 84366`; draw calls are at most 1.20 times the measured v1 static baseline.
- Repeated vents, hinge caps, fasteners and feet share geometry where stable node identity permits it.
- Three create/destroy cycles contain no NaN and dispose every created geometry and material.
- Runtime screenshots at 1280 x 720, 1600 x 900 and 1920 x 1080 preserve the safe band and exact line contact.
