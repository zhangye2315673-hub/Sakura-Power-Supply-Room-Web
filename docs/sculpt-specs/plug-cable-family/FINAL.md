# SAKURA plug and cable family v2 handoff

## Result

- Seven existing `PlugStyleId` values keep their terminal count, layout, direction, click contract, collision constants, and `0.18 × 0.64` visual envelope.
- The shared shell is a twelve-sided five-stage lathed construction with separate strain relief, rear neck, outer shell, front shoulder, interface faceplate, terminal assembly, and recessed status indicator.
- Orthogonal cable corners use analytic tangent quarter circles with radius `min(0.13, incoming × 0.28, outgoing × 0.28)` and fall back to the original corner below `0.025`.
- Static, double-ended, showcase, and connection-flight cables share a capped eight-sided `0.105` tube section and the same code-defined cable Toon material.
- `root.userData.sculptRuntime` publishes stable nodes, sockets, collider metadata, and destruction groups. Query-only showcase debug mode supports part raycasting and exploded assembly review without adding production UI.

## Main implementation files

- `src/render/PlugParts.ts`
- `src/render/CableGeometry.ts`
- `src/render/PlugCableModel.ts`
- `src/systems/ConnectionSystem.ts`
- `src/showcase/Showcase.ts`
- `tests/plug-cable-v2.spec.ts`

## Final evidence

- `reviews/final/comparison-styleboard-v1-v2.png`
- `reviews/final/comparison-game-v1-v2.png`
- `reviews/final/render-game-seed-2679418801.png`
- `reviews/interaction-pass/render-showcase-debug.png`
- `reviews/optimization-pass/capture-diagnostics.json`
- `object-sculpt-spec.json` (`sculptPipeline.currentPass = complete`)

## Verified gates

- `npm run build`
- `npm run verify:plug-collision`
- `npm run verify:levels`
- seven-style legacy envelope test
- eight v2 cable/plug geometry, lifecycle, state, debug, and performance tests
- full browser rotation, progressive extraction, two connection flights, and appliance activation test
- double-ended selected-end extraction and blocked-end life-loss test
- strict img2threejs spec validation
- v1 archive SHA-256 manifest verification (7 files)

The assembled seven-style board measured 95 draw calls, 8,574 triangles, 95 geometries, 2 textures, and a 16.945 ms average headless frame interval at 1280 × 720.

## Rollback

Use `docs/history/plug-cable-v1-2026-08-10/README.md`. It names every source file to restore, every v2-only file/declaration to remove, and the exact verification commands.
