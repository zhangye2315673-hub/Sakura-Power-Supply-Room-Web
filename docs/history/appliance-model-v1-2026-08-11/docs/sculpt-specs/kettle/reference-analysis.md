# Kettle performance reference analysis

## Sources inspected (2026-08-07)

- [Kettle / electric kettle structure](https://en.wikipedia.org/wiki/Kettle) — the appliance reads as a rigid vessel seated on a separate powered base; the spout is the only credible steam origin.
- [Boiling](https://en.wikipedia.org/wiki/Boiling) — boiling is a phase-change process driven throughout the liquid, so the vessel response should read as a sustained, regular low-amplitude vibration rather than an accelerating impact or random end jitter.
- [Steam](https://en.wikipedia.org/wiki/Steam) — visible “steam” above a kettle is condensed water aerosol; the readable plume therefore expands, drifts and loses opacity as it rises instead of behaving like solid pellets.
- [Three.js IcosahedronGeometry](https://threejs.org/docs/#api/en/geometries/IcosahedronGeometry) — a low-detail, vertex-deformed icosahedron supplies lit polygonal volume from every camera angle and avoids the flat Plane/Sprite failure mode.

All four pages returned HTTP 200 during intake. The implementation is a stylized SAKURA/low-poly interpretation, not a fluid simulation or a claim of exact hidden construction.

## Observed motion and form translation

- The kettle body remains one rigid assembly on its base. Powered motion is limited to a small vertical bounce, lateral sway and roll around a stable frequency.
- The lid is a secondary body with a short phase lag and lower amplitude. It never detaches and never crosses the lid seat.
- The performance has three continuous phases: warm-up, sustained boil, smooth settle. Frequency is constant; only amplitude decays during settle.
- Steam starts at `kettle-spout-steam-socket`, not at the body centre. Each puff is an overlapping cluster of irregular lit lobes with real X/Y/Z extent.
- Puff variants differ in lobe count/layout, aspect ratio, phase, drift, twist and opacity. They rise, sway, rotate, expand and fade before recycling.

## Single-view / inference limits

- The supplied kettle reference path is not available to this worker, so hidden heating hardware and exact inner-spout flow are not reconstructed.
- Steam shape is intentionally authored as stylized condensed puffs. It approximates the visual behaviour of a plume rather than solving thermodynamics.
