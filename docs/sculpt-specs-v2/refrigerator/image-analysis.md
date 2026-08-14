# SAKURA Refrigerator v2 - image analysis

## Suitability

- Verdict: pass. The IMAGEN sheet presents one isolated refrigerator in four consistent views with a complete silhouette and readable hard-surface materials.
- Intended use: an XL real-time browser appliance with two articulated doors and a model-owned 5.2 second food choreography driven by the shared `AppliancePerformanceSystem` timeline.
- Authority split: the four-view sheet owns visual facets, mass emphasis and palette; `appliance-rig-v1-contract.json` owns the full-tree bounds, pivots, sockets, collider nodes, transforms and keyframe evidence.
- Complexity: ultra-complex because two 150-degree door arcs, two true cavities, four door bins, seven independently animated semantic food props, rear compressor vibration and exact reset must all remain compatible.

## Observable form and hierarchy

- Overall volume: narrow tall hard-surface cuboid with bilateral front massing, asymmetric right hinge hardware and a deep rectangular footprint.
- Macro: cabinet frame and crown; upper freezer door; lower main door; upper and lower open cavities; rear service assembly; food-performance rig.
- Meso: stepped crown and lower plinth, tapered side panels, freezer divider, two faceted handle assemblies, four hinge caps, two gasket frames, shelves, drawer, four door bins, rear service plate, vent row, fasteners, power inlet and four feet.
- Micro: door face bevel bands, mint handle inserts, dark door-seam undercut, cold-light seam, shelf lips, gasket relief, rear vent grooves, service fasteners and the stable unequal outline tiers.

## Object-space relationships

- The upper and lower doors remain children of the archived right-edge pivots at `[1.38,4.31,1.02]` and `[1.38,2.0,1.02]`; visual shells extend inward from those hinges and never move the pivots.
- Cavity panels, shelves and drawer retain their current root-local heights so door opening reveals the same interior and seven home sockets remain supported by surfaces.
- The drink bottle home remains local to the lower door; all other food homes remain root-local. No food pivot is reparented during animation.
- The compressor service assembly remains under `refrigerator-compressor-pivot`; rear visual geometry may be restyled but its service and power-entry sockets cannot move.
- Four zero-geometry scene-edge connection sockets reproduce the archived Box3 fallback anchors, so line attachment no longer depends on visual outline thickness.

## Materials and outline response

- Warm cream shell and blush-pink structure use two-to-three-band Toon shading with cool lavender shadow tint and broad matte planes.
- Muted mint is limited to handle inserts, selected cold-light accents and interior details; plum/charcoal separates gaskets, seams, vents and cavities.
- Main opaque cabinet and door silhouettes use `0.0048`, structural panels and handles use `0.0041`, and small rear/hinge details use `0.0033`, all with stable object-space variation `0.18`.
- Transparent shelves, emissive cold lights, food effects and tiny fasteners are excluded from the main outline tier to avoid black clumping.

## Identity features and uncertainty

- Identity is a compact retro top-freezer refrigerator: smaller upper door, larger lower door, two left-side vertical handles, right hinges and a pink lower service/plinth language.
- The back view clearly supports one lower service plate, five horizontal vent slats, four visible fasteners and one power inlet.
- IMAGEN cannot provide manufacturing dimensions or interior mechanics. Hidden insulation, coolant tubing and compressor internals remain omitted.
- When generated perspective conflicts with runtime spacing, the archived node and socket coordinates take precedence.
