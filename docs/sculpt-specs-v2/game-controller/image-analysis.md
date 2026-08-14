# SAKURA Game Controller v2 - image analysis

## Suitability

- Verdict: pass. The IMAGEN sheet presents one controller at consistent scale in four distinct views and preserves the required control count.
- Intended use: real-time browser appliance with a model-owned 5.2 second performance rig driven by the shared `AppliancePerformanceSystem` timeline.
- Authority split: the v2 sheet owns visible form language; `appliance-rig-v1-contract.json` owns bounds, pivots, sockets, colliders, node paths and idle transforms.
- Complexity: ultra-complex because shell shaping, eleven independently animated input pivots, four shoulder controls, model-owned ultimate effects and exact reset must remain compatible.

## Macro to meso to micro hierarchy

- Macro: broad cream shoulder deck; narrow centre waist; deep lower notch; two long outward-flared grip bodies; distinct front and rear shell layers.
- Meso: pink wraparound grip panels; D-pad; four face buttons; two analog assemblies; home/select/status cluster; paired bumpers and triggers; rear battery and port covers.
- Micro: button crown rings; stick thumb dishes and sockets; D-pad centre inset; grip boundary seams; shell split line; shoulder hinge caps; four rear screws; stable unequal outline tiers.

## Object-space relationships

- Every visible input remains a child of its archived pivot. Geometry may be enlarged locally, but pivots and travel axes do not move.
- Shoulder wedges remain centred on the frozen bumper/trigger hinges and must clear the shell through their full `+0.31 rad` press motion.
- The rear battery cover and upper port cover remain within `game-controller-rear-service-pivot`; the inferred power socket remains centred behind the upper cover.
- Model-owned stars, bolts, impact shards and energy points remain under `game-controller-ultimate-effects-pivot`; shell geometry never compensates by moving effect origins.
- Four explicit zero-geometry scene-edge sockets reproduce the archived Box3 fallback anchors so line attachment is independent of later visual outline changes.

## Material and outline response

- Warm cream and Sakura pink shells use two-to-three-band Toon response with cool lavender shadow tint.
- Plum cavities provide separation around controls without becoming heavy black pools.
- Main opaque silhouettes use `0.0048`, structural contours `0.0041`, and detail contours `0.0033`, with stable object-space variation `0.18`.
- Status light, screws and all performance-effect geometry are excluded from the main outline tier to avoid contour clumps.

## Identity features

- Symmetric wireless controller with broad upper shoulders, deep lower notch and flared handles.
- Pink cross D-pad upper-left and four unlabeled pink face buttons upper-right.
- Twin low analog sticks with oversized faceted caps and readable dark sockets.
- Two clearly separated shoulder layers per side.
- Rear battery cover, four screws and centred upper port cover.

## Inference limits

- IMAGEN is not dimensional authority and cannot move runtime anchors.
- PCB, rumble motors, stick gimbals, membranes, springs and battery contacts remain hidden.
- The generated side view is deliberately more faceted than v1, but the runtime S-curve remains constrained by the archived envelope and animation clearance.
- Button symbols, labels and brand marks are intentionally absent.

