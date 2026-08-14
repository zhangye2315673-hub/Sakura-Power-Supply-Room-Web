# SAKURA 家电模型 v1 不可变档案

归档日期：2026-08-11  
项目：`arrow-cube`  
范围：29 款家电的程序化模型、模型工具、材质/描边、动画与特效连接、参考图、雕刻规格、审查页、基线截图和运行时合同。

本档案是在工作区存在大量未提交、未跟踪改动的情况下按文件复制生成的。它不依赖 Git commit、stash 或历史索引。

## 内容

- `src/appliances/`：29 款 v1 模型、共享模型工具、动画和 performance 源码。
- `src/style/`：v1 Toon、色板、描边和后处理配置。
- `src/systems/`：目录、场景、动画时间线、特效连接、展示和软体变形源码。
- `src/review/`、`model-review.html`：v1 模型审查页。
- `references/intake/`：现有 15 套及其余模型的 intake 参考证据。
- `docs/sculpt-specs/`：全部 v1 雕刻规格、分析和阶段证据。
- `screenshots/models/<appliance-id>/`：每款正面、侧面、背面、四分之三面，以及启动、高潮、收束 7 张基线图。
- `screenshots/appliance-catalog-v1.png`：29 款目录板。
- `screenshots/game-seed-2679418801*.png`：固定种子主游戏全页和画布基线。
- `screenshots/capture-index.json`：截图尺寸、完整性和缺失项机器可读索引。
- `appliance-rig-v1-contract.json`：包围盒、地面高度、节点、socket、父路径、静止变换、材质、碰撞、破坏分组和动画关键帧合同。
- `tools/`：生成运行时合同、逐款截图和目录板的可复现工具。
- `SHA256SUMS`：除清单自身以外，档案内每个文件的 SHA-256。

## 完整性检查

在 `arrow-cube` 根目录运行：

```powershell
$archiveRoot = Resolve-Path 'docs\history\appliance-model-v1-2026-08-11'
$failures = foreach ($line in Get-Content -LiteralPath (Join-Path $archiveRoot 'SHA256SUMS')) {
  if ($line -match '^([0-9a-f]{64})  (.+)$') {
    $expected = $Matches[1]
    $relativePath = $Matches[2]
    $actual = (Get-FileHash -LiteralPath (Join-Path $archiveRoot $relativePath) -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $expected) { $relativePath }
  }
}
if ($failures) { $failures; throw 'v1 archive checksum mismatch' }
'v1 archive checksums verified'
```

截图索引的 `complete` 必须为 `true`、`applianceCount` 必须为 `29`，且每款 `captureCount` 必须为 `7`。

## 只恢复模型视觉

此恢复方式不覆盖目录、关卡场景、动画时间线或特效系统。先另存当前 v2 文件，再运行：

```powershell
$archiveRoot = Resolve-Path 'docs\history\appliance-model-v1-2026-08-11'
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\appliances\models') -Destination 'src\appliances' -Recurse -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\appliances\ApplianceModelKit.ts') -Destination 'src\appliances\ApplianceModelKit.ts' -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\style\outline.ts') -Destination 'src\style\outline.ts' -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\style\palette.ts') -Destination 'src\style\palette.ts' -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\style\toon.ts') -Destination 'src\style\toon.ts' -Force
```

恢复后运行生产构建、家电动画测试和固定种子截图复核。不要删除 v2 新增文件；如果 v2 在模型目录新增了文件，应先人工列出并确认，再决定是否移走。

## 完整恢复家电视觉运行时

此恢复方式会覆盖家电模型、performance、共享材质/描边、场景连接、时间线、展示、软体变形和审查页。它不会修改关卡、谜题规则或其他项目目录。

```powershell
$archiveRoot = Resolve-Path 'docs\history\appliance-model-v1-2026-08-11'
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\appliances') -Destination 'src' -Recurse -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\style') -Destination 'src' -Recurse -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\systems\ApplianceCatalog.ts') -Destination 'src\systems\ApplianceCatalog.ts' -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\systems\AppliancePerformanceSystem.ts') -Destination 'src\systems\AppliancePerformanceSystem.ts' -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\systems\AppliancePresentation.ts') -Destination 'src\systems\AppliancePresentation.ts' -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\systems\ApplianceScene.ts') -Destination 'src\systems\ApplianceScene.ts' -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\systems\ApplianceSpectacleSystem.ts') -Destination 'src\systems\ApplianceSpectacleSystem.ts' -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\systems\SoftDeformController.ts') -Destination 'src\systems\SoftDeformController.ts' -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\systems\softDeformShader.ts') -Destination 'src\systems\softDeformShader.ts' -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'src\review') -Destination 'src' -Recurse -Force
Copy-Item -LiteralPath (Join-Path $archiveRoot 'model-review.html') -Destination 'model-review.html' -Force
```

## 恢复后验证

```powershell
npm run build
npx playwright test tests/appliance-performance.spec.ts --project=desktop-chrome --reporter=line
git diff --check
```

随后用 `tools/capture-appliance-v1-baseline.mjs` 逐款采集，和 `screenshots/models/` 及固定种子画面进行人工对照。恢复完成的判断依据是运行时合同、截图和测试三者同时通过，不以“能够构建”单独作为完成条件。
