# Radio quality contract

## Purpose and identity

Within the first second, the object must read as a tabletop radio switching on: the segmented aerial snaps from a folded rest pose toward vertical, extends, overshoots, settles and keeps a small two-sided sway. The grille diaphragm and tuning cursor respond on the same powered timeline. Sound waves must emerge from the speaker face as three-dimensional energy, never from the body centre.

## Component hierarchy

- `radio-outer-shell`
  - inset front fascia and speaker grille
  - diaphragm pivot
    - front emitter socket, local direction `[0, 0, 1]`
  - tuning and volume pivots
  - rear antenna bracket
    - hinge pivot, local Z rotation
      - base metal tube
      - extension pivot 2 + narrower tube + collar
      - extension pivot 3 + narrower tube + collar
      - tip extension pivot + cap
- transient spectacle system
  - pooled irregular closed tube wave loops

## Materials

- Shell: warm cream toon plastic, low metalness, medium roughness.
- Fascia: Sakura pink layered plastic.
- Antenna: cool metal tubes with dark base and joint collars.
- Waves: translucent Sakura physical material with emissive core, clearcoat and front/back shading; never unlit flat color.

## Pivots and sockets

- `radio-antenna-hinge-pivot`: folded-to-upright rotation plus two-frequency sway.
- `radio-antenna-extension-pivot-2`, `-3`, `radio-antenna-tip-extension-pivot`: translate only along local Y from stored overlap to full deployment.
- `radio-speaker-diaphragm-pivot`: bass pulse.
- `radio-speaker-socket`: starts beyond the grille and supplies local +Z emission direction.

## Timeline contract (5.2 s shared powered clock)

- 0.00-0.08: folded and compressed.
- 0.08-0.58: rapid rise and telescope deployment.
- 0.42-0.82: controlled overshoot and spring-back.
- 0.70-5.20: continuous low-amplitude left/right sway around near-vertical; it must cross both sides more than once.
- 0.90-4.85: staggered sound loops; 3.68-4.72 is the denser visual climax.
- stop/reset: exact original transform, hidden transient waves, zero signal.

## Failure gates

- Fail if any sound loop is a Plane, Sprite, Line, LineSegments, or regular TorusGeometry.
- Fail if the wave emitter is at or behind the grille, or a wave velocity has a negative dot product with speaker-forward.
- Fail if all wave loops share one geometry/profile/rotation/scale.
- Fail if the aerial is one scaled cylinder, remains fully extended at rest, ends at a right-side pose, or never crosses both sides of vertical after settling.
- Fail if active extension is below 90% of authored travel or the aerial hinge remains more than 0.16 rad from vertical after settling.
- Fail if game and gallery instantiate different mechanics/effect modules or clocks.
- Fail if stop does not restore the exact captured idle pose.

## Runtime evidence fields

`root.userData.radioPerformanceDiagnostics` records hinge angle, extension fraction, rise, overshoot and sway at the sampled shared timestamp. Each wave mesh records its emitter name, volumetric profile, forward vector, source position and no-body-crossing flag.
