# Plug Cable v1 archive

This folder is an exact pre-v2 snapshot captured on 2026-08-10 before the SAKURA plug and cable visual redesign.

## Contents

- `src/render/PlugParts.ts`: seven plug head factories and shared envelope.
- `src/render/PlugCableModel.ts`: static and progressively extracted cable renderer.
- `src/systems/ConnectionSystem.ts`: cable flight from puzzle to appliance.
- `src/showcase/Showcase.ts`: seven-style review board.
- `screenshots/plug-cable-v1-showcase.png`: 1440 x 900 style-board baseline.
- `screenshots/plug-cable-v1-game-seed-2679418801.png`: 1440 x 900 fixed-seed game baseline.
- `SHA256SUMS`: integrity hashes for every archived source and screenshot.

## Restore

From the `arrow-cube` project root, restore the four archived files explicitly:

```powershell
$archiveRoot = Resolve-Path '.\docs\history\plug-cable-v1-2026-08-10'
Copy-Item -LiteralPath "$archiveRoot\src\render\PlugParts.ts" -Destination '.\src\render\PlugParts.ts' -Force
Copy-Item -LiteralPath "$archiveRoot\src\render\PlugCableModel.ts" -Destination '.\src\render\PlugCableModel.ts' -Force
Copy-Item -LiteralPath "$archiveRoot\src\systems\ConnectionSystem.ts" -Destination '.\src\systems\ConnectionSystem.ts' -Force
Copy-Item -LiteralPath "$archiveRoot\src\showcase\Showcase.ts" -Destination '.\src\showcase\Showcase.ts' -Force
```

Then remove the v2-only runtime helper and its v2-only test:

```powershell
Remove-Item -LiteralPath '.\src\render\CableGeometry.ts'
Remove-Item -LiteralPath '.\tests\plug-cable-v2.spec.ts'
```

Finally, remove only the `__PLUG_SHOWCASE_DIAGNOSTICS__` declaration block added to `src/vite-env.d.ts`. The `docs/sculpt-specs/plug-cable-family` evidence folder and capture scripts are inert documentation and may remain. Verify the restored v1 with:

```powershell
npm run build
npx playwright test tests/catalog.spec.ts --project=desktop-chrome --grep "all seven plug styles stay inside"
npm run verify:plug-collision
```

This archive intentionally does not include unrelated project files and does not depend on a Git stash or commit.
