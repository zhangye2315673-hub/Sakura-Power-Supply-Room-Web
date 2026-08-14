# SAKURA game controller image analysis

## Suitability

Conditional pass for a high-fidelity real-time procedural reconstruction. The front, central side and back turn-sheet views establish the exterior silhouette, shell depth, control layout and rear service details. The front view clips a few pixels from the far-right grip and the side sheet contains fragments of neighbouring views, so those regions are cross-checked against the bilateral back view rather than treated as exact masks.

## Object and views

- Primary type: wireless dual-analog game controller; domain: object.
- Form language: bilaterally symmetric, layered hard-surface shell with continuous ergonomic handle curvature.
- Front view: near-orthographic, showing the control face and two downward grips.
- Side view: near-orthographic central profile, showing shell depth, front control projection, shoulder buttons and handle taper.
- Back view: near-orthographic, showing rear shell, battery/service cover, four screws and the two-layer shoulder controls.
- Complexity: complex. The outer silhouette is moderate, but faithful identity needs separate front/back shells, grip overlays, 12 movable input parts, seams, fasteners and an action-ready hierarchy.

## Macro to micro decomposition

- Macro: cream front shell, cream rear shell, left grip, right grip, shoulder deck.
- Meso: D-pad, four face buttons, two analog stick assemblies, home/select controls, four shoulder controls, rear battery cover.
- Micro: analog socket rings and cap insets, shell seam, grip colour-boundary seams, button bevels, status lens, four screw heads and rear port/cover.

## Spatial relationships

- The front and rear shells overlap at a continuous perimeter seam around a shared central chassis volume.
- Pink grip panels sit flush on the lower front and rear handle masses and wrap around the lateral edges.
- Analog sticks are socketed into two raised front rings; button faces project along +Z from the control face.
- Shoulder bumpers and triggers hinge from sockets on the upper rear deck and overlap the cream shell.
- The rear battery cover sits flush in a shallow central recess; screw heads are countersunk around the rear lower shell.

## Materials and colour

- Warm cream satin ABS: dielectric, matte-to-satin response, broad soft highlights and slight cavity darkening.
- Sakura pink grip/control plastic: dielectric satin with slightly lower roughness on button crowns and stick caps.
- Dark seam/cavity material: high-roughness muted plum-brown used only for gaps, screw recesses and outlines.
- Status lens: translucent/emissive rose under power.
- No raw metal is visibly exposed in the supplied exterior views; screw heads read as muted metallic-brown accents.

## Identity-critical details

1. Broad cream body with inward lower notch and two long rounded handles.
2. Pink lower grip zones divided from cream by diagonal curved seams.
3. Large pink cross D-pad at upper-left.
4. Four unlabeled pink circular face buttons in a diamond at upper-right.
5. Symmetric twin analog sticks low on the face, each with cream socket ring and concentric cap recess.
6. Two small central controls plus a rose status lens.
7. Two visible shoulder layers per side.
8. Rear battery/service cover, four screw heads and continuous front/back shell seam.

## Uncertainty and inference

- Internal PCB, rumble motors, stick gimbals, button membranes, trigger springs, battery contacts and radio electronics are completely hidden and will not be fabricated.
- The exact function and depth of the rear upper-centre pink inset/connector are not legible; its exterior shape is reconstructed, while interface type is inferred.
- The port underside, battery-cover latch and exact screw drive pattern are not visible enough for exact reconstruction.
- The front-right edge is slightly clipped; bilateral symmetry and the complete back view constrain that handle.

