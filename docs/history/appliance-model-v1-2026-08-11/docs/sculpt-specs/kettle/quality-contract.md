# Kettle model + motion + volumetric effect quality contract

## Component hierarchy

1. `kettle-power-base-pivot`: stationary electrical base and feet.
2. `kettle-body-pivot`: rigid vessel shell, gauge, handle and spout.
3. `kettle-lid-hinge-pivot`: attached secondary lid with a bounded hinge response.
4. `kettle-power-switch-pivot`: independent powered control.
5. `kettle-spout-steam-socket`: exact attachment/action origin at the outlet lip.
6. `kettle-volumetric-steam-puff-*-pivot`: seven pooled, reusable stylized 3D puff assemblies; each contains five overlapping deformed-icosahedron lobes.

## Materials

- Vessel: opaque cel-shaded cream/accent surfaces with the existing Sakura outline language.
- Spout: low-saturation lit metal, dark outlet lip.
- Steam shell: warm translucent toon material, depth-write disabled, non-zero lit faceting.
- Steam shadow lobes: cooler/lower-opacity translucent material offset inside the cluster to preserve form and depth instead of reading as a flat white blob.

## Pivot and socket contract

- Body vibration is applied only at `kettle-body-pivot`; the powered base stays planted.
- Lid response is applied only at `kettle-lid-hinge-pivot` and remains seated.
- Every puff is parented to `kettle-spout-steam-socket`; its local origin begins within the outlet opening.
- The game and gallery both use `AppliancePerformanceSystem -> createApplianceMechanicalAnimation('kettle')` and the same 5.2 s powered timeline.

## Timeline contract

- `0.00–0.42 s`: switch engages; no arbitrary end-state snap.
- `0.42–1.10 s`: smooth warm-up into a regular 2.1 Hz boil response.
- `1.10–3.85 s`: sustained low-amplitude body motion and staggered puff cycles.
- `3.85–5.12 s`: constant-frequency motion whose positional/rotational amplitude continuously decreases to zero; steam output fades with the same envelope.
- `>=5.20 s`: exact baseline restore, all puff pivots hidden, signal zero.

## Failure gates

- Fail if any kettle steam is emitted by the generic spectacle `steam` particle pool (new/old overlap).
- Fail if a puff contains `PlaneGeometry`, `Sprite`, `Line`, or has near-zero extent on any axis.
- Fail if steam begins away from the spout socket or crosses through the vessel shell.
- Fail if tail amplitude increases after 3.85 s, if frequency changes during settle, or if transforms snap before stop.
- Fail if lid displacement exceeds the seating tolerance or the electrical base moves with the vessel.
- Fail if same-timestamp game/gallery rigs differ, the unified timeline owner count differs, or gallery automatic rotation must be disabled.
