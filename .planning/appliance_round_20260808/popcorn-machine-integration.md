# 爆米花机独立集成说明

## 本子任务已完成

- `popcornMachine.ts` 将内部可爆发爆米花从 12 个增至 24 个，触发间隔由 `0.18s` 缩短到 `0.075s`。
- 内部每个爆米花记录独立跳动频率（`7.4–9.3Hz`）、跳高（`0.46–0.625`）和旋转参数。
- 新增 28 个模型自有的外部飞出实例。它们和内部爆米花直接复用同一个五瓣 `BufferGeometry` 对象，以及同一组 `popcornLight / popcornCream` Toon 材质对象，不再另造外部样式。
- 外部路径始终按 `机舱内 -> 前部出料口 -> +Z 外部空间` 运动；28 个实例具有不同启动时间、飞行时长、峰值高度、横向偏移和 XYZ 旋转速度。
- 新增 `PopcornMachinePerformance.ts`，统一驱动转盘、24 个内部高频跳动爆米花和 28 个外部爆出实例；`reset()` 可精确恢复待机姿态。
- 新增 `tests/popcorn-machine-performance.spec.ts`，覆盖几何/材质同源、非 Plane/Sprite/Line、爆发密度、频率/高度、向外方向、错峰差异、同时间戳一致性和精确复位。

## 主代理在共享文件中的最小接线

本子任务按边界要求没有编辑共享 `ApplianceMechanics.ts` 和 `ApplianceSpectacleSystem.ts`。合并时请只做以下两处小接线：

1. `src/appliances/performance/ApplianceMechanics.ts`

   - 导入 `createPopcornMachinePerformance`。
   - 与 `kettlePerformance` 等控制器相同，在工厂初始化区仅当 `kind === 'popcorn-machine'` 时创建控制器。
   - 将现有 `case 'popcorn-machine'` 中第 402–424 行的内置转盘/种子/爆米花循环整体替换为：

     ```ts
     popcornMachinePerformance?.apply(time, p);
     signalValue = popcornMachinePerformance?.signal() ?? run;
     ```

   - 在 `stop()` 的专用复位区加入：

     ```ts
     if (kind === 'popcorn-machine') popcornMachinePerformance?.reset();
     ```

   - 替换后可删除仅由旧爆米花分支使用的局部 `popTarget` 与 `fallbackSpin`（若确认无其他分支引用）。

2. `src/systems/ApplianceSpectacleSystem.ts`

   - 把 `case 'popcorn-machine': this.updatePopcorn(...)` 改为纯 `break`，和 gumball machine 的模型自有效果策略一致。
   - 不需要删除全局 `popcorn` 池或几何工厂；它可能仍是共享类型的一部分。关键是爆米花机分支不再调用它，避免第二个视觉 owner。

接线后的所有模式仍通过 `AppliancePerformanceSystem -> ApplianceMechanics -> PopcornMachinePerformance` 使用同一条时间线；游戏与图鉴不会复制模型。图鉴自动旋转只旋转模型根节点，不会破坏模型局部的 +Z 向外轨迹。

## 审计结论

- 原共享 `ApplianceMechanics` 只做 12 次一次性跳起，频率和数量不足；本模块改为 24 个持续高频循环跳动。
- 原共享 `ApplianceSpectacleSystem` 用独立 `IcosahedronGeometry` 和 `MeshBasicMaterial` 生成外部爆米花；这与模型内五瓣 Sphere 合并几何和 Toon 材质不一致，是内外两套样式的直接原因。
- 现有 sculpt spec 已要求“lobed popcorn forms”“powered behavior visibly produces and dispenses popcorn”“dispense misses tray”为失败模式；新路径从玻璃舱内下行通过出料口，不穿越侧面/正面玻璃，符合这些约束。
- `externalPerformanceCue` 仅是元数据，不会自动提供同源几何；新 `popcornMachinePerformanceRig` 明确声明单一时间线、单一效果 owner 和内外同源语言。

## 接线后建议回归命令

```powershell
npx playwright test tests/popcorn-machine-performance.spec.ts --project=desktop-chrome --reporter=line
npx playwright test tests/appliance-performance.spec.ts --project=desktop-chrome --reporter=line
npm run build
```

验收时再确认 `AppliancePerformanceSystem.getStateSummary().activeByKind.popcorn` 在爆米花机运行期间为 `0`；可见外部爆米花应来自模型内的 `popcorn-machine-outward-pop-*`，而不是 `spectacle-popcorn-*`。
