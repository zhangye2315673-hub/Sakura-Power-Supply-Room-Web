# SAKURA Desktop Computer v2 — image analysis

## Suitability

- Verdict: `pass` for a stylized procedural real-time game prop.
- Evidence: the accepted 2×2 sheet supplies front, strict right side, back and three-quarter views at identical scale; all five workstation pieces remain visible.
- Limitation: the generated sheet is visual direction, not dimensional ground truth. The current v1 runtime contract remains authoritative for envelope, pivots, sockets, colliders, screen layers and animation transforms.

## Layer 1 — identification and classification

- Observed: a complete retro desktop workstation consisting of a deep CRT monitor, articulated stand/base, tower, wedge keyboard and faceted mouse.
- Primary domain: `object`.
- Form language: stylized hard-surface, low-poly, layered shell, assembled rigid solids.
- Motion potential: articulated screen/stand, animated tower, independent key presses, mouse motion/click/wheel, screen-state layers and a tower-top smoke emitter.
- Confidence: `0.98` for visible exterior identity; lower for hidden electronics, which are intentionally excluded.

## Layer 2 — overall form and silhouette

- Five-piece composition remains monitor-left, tower-right, keyboard foreground-left and mouse foreground-right.
- Monitor: broad rectangular front bezel connected to a deep stepped CRT body. The side silhouette clearly contains a front shell, swollen rear belly, tapered 8–10 facet bell and shallow rear service cap.
- Stand: short thick hinge column over a two-level broad base; it supports the CRT without changing the v1 hinge position.
- Tower: tall slightly tapered cuboid with an overhanging pink top cap and stable feet.
- Keyboard: shallow wedge footprint with six key rows and a large spacebar.
- Mouse: low faceted arch over a cream lower shell; upper buttons and wheel remain separate.

## Layer 3 — macro, meso and micro hierarchy

- Macro: monitor, stand, tower, keyboard, mouse.
- Monitor meso: front shell, stepped bezel, recessed screen, CRT belly, tapered rear bell, rear cap, mount plate.
- Stand meso: stand pivot, leaned column, cream inset, two-stage base.
- Tower meso: primary shell, top cap, front I/O strip, rear service panel, side and rear ventilation fields, feet.
- Keyboard meso: wedge shell, key deck, instanced key fields, six animated keys, spacebar.
- Mouse meso: lower shell, upper shell, two-button region, wheel.
- Micro: flower emblems, status dots, power button, port cavities, CRT vents, tower vents, seams, screen GUI planes and smoke puffs.

## Layer 4 — spatial relationships and frozen rig

- Every v2 visual must remain a child of the existing v1 pivot that owns its motion. Geometry must adapt to the rig; the rig must not move to adapt to geometry.
- The CRT shell, belly, bell, cap, bezel, screen and screen-state layers remain under `desktop-computer-screen-tilt-pivot`.
- The stand remains under `desktop-computer-monitor-stand-pivot` and `desktop-computer-monitor-column-pivot`, with the existing hinge socket unchanged.
- Tower shell, front I/O, rear I/O and smoke outlet remain under `desktop-computer-tower-assembly-pivot`.
- Keyboard keys remain under `desktop-computer-keybed-pivot`; the six active key pivots and spacebar pivot keep their exact local transforms.
- Mouse geometry remains under `desktop-computer-mouse-assembly-pivot`; button and wheel keep their nested pivots.
- The current full-tree Box3 is part of the connection and scaling contract because the model has no four edge connection sockets. Hidden smoke geometry must therefore remain unchanged unless equivalent frozen edge sockets are added and verified.

## Layer 5 — materials and surface

- Cream and Sakura-pink housings: dielectric matte plastic, 2–3 band Toon response, restrained broad highlights, no photoreal texture.
- Dark plum: screen cavity, seams, ports and vent interiors; low-value matte response.
- Screen: deep charcoal with low-intensity cyan/pink emissive state layers; screen opening remains unobstructed.
- Metal-like controls: limited cool-gray/plum response; no chrome.
- Outline: dark plum, object-space stable, main silhouette `0.0048`, structural `0.0041`, detail `0.0033`, low-frequency ±18% width variation, no temporal jitter.

## Layer 6 — colour and finish

- Dominant: warm cream, high value, low saturation.
- Secondary: Sakura pink, mid-high value.
- Accent: muted mint/cyan LEDs and screen elements.
- Shadow family: cool lavender/plum.
- Finish: matte cel-shaded plastic with crisp geometry-driven chamfer bands; no glossy PBR or soft rubber response.

## Layer 7 — identity-defining features

1. Deep stepped CRT profile, never a thin panel.
2. Chunky front bezel and recessed dark screen.
3. Tapered faceted CRT rear bell and rear service cap.
4. Short thick articulated stand and two-level base.
5. Tower pink top cap, flower emblem and vertical front I/O strip.
6. Tower side/rear ventilation fields and rear power inlet.
7. Six-row wedge keyboard with large pink spacebar.
8. Faceted arched mouse with separate buttons and wheel.
9. Thick, stable, slightly uneven dark-plum contour hierarchy.
10. Top smoke outlet aligned to the existing emission socket; no fan blades.

## Layer 8 — uncertainty and blocking risks

- Hidden electronics are undetermined and are not reconstructed.
- The reference exaggerates low-poly facets but does not authorize larger runtime bounds.
- The side-view component spacing is compositional evidence only; v1 assembly transforms remain frozen.
- Any change that creates a thin monitor, moves the smoke outlet, hides the screen area, changes key/button pivots, changes the full-tree bounds beyond tolerance, or causes outline-dependent cable drift is a blocking mismatch.
