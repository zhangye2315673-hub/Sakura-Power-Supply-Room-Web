# 泡泡机独立集成说明

## 本子任务已完成

- `bubbleMachine.ts` 新增模型自有的 `bubble-machine-performance-rig`，预分配 48 个普通泡泡，超过旧共享池的 30 个槽位；运行时不分配新对象。
- 每个普通泡泡都是完整球体层级：`SphereGeometry` 半透明物理膜、第二层球形虹彩边、两条有厚度的 `TorusGeometry` 彩虹膜弧和一个椭球高光。没有 `PlaneGeometry`、`Sprite` 或 `Line`。
- 泡泡半径分成 `0.12 / 0.17 / 0.24 / 0.32` 四档，最大档是最小档的 2.67 倍；48 条轨迹分别记录不同启动时刻、`3.45–4.45s` 飞行时长、漂移频率、左右偏移、上升量和前向量。
- 每条普通轨迹的配置扩散距离均大于 12 个模型单位；旧共享实现的最大初速度为 `3.3 * unit`、寿命 `3.1s` 且有 `0.42` 阻力，本轮轨迹的可见覆盖显著超过旧表现的两倍，并把扩散主体放在左右和上升方向，避免仍聚在机器附近。
- 后段新增一个半径 `0.94` 的巨大泡泡：`3.18s` 从稳定输出口升起，`4.62s` 到达机身上方约 6.2 个模型单位处并在离开表现区前爆裂。
- 爆裂反馈只有 8 个体积对象：4 个小球泡和 4 个 `IcosahedronGeometry` 光点；没有面片，也没有密集烟花式碎屑。
- 新增稳定的 `bubble-machine-output-socket`。它不挂在旋转轮盘下，已脱离的泡泡不会错误继承轮盘旋转。
- 新增 `BubbleMachinePerformance.ts`，单一时间线统一驱动顶部旋钮、前轮盘、后风扇、48 个普通泡泡、巨大泡泡和爆裂；`reset()` 精确恢复待机姿态。
- 新增 `tests/bubble-machine-performance.spec.ts`，覆盖数量、四档尺寸、物理虹彩材质、立体高光、无 Plane/Sprite/Line、扩散距离、上升/左右漂移/速度差、巨大泡泡顶部爆裂、少量体积反馈和精确复位。

## 主代理在共享文件中的最小接线

本子任务按边界要求没有编辑共享 `ApplianceMechanics.ts` 和 `ApplianceSpectacleSystem.ts`。合并时只需以下两处接线。

1. `src/appliances/performance/ApplianceMechanics.ts`

   - 导入：

     ```ts
     import { createBubbleMachinePerformance } from './BubbleMachinePerformance';
     ```

   - 在控制器初始化区加入：

     ```ts
     const bubbleMachinePerformance = kind === 'bubble-machine'
       ? createBubbleMachinePerformance(root)
       : null;
     ```

   - 将现有 `case 'bubble-machine'` 的三行通用旋转替换为：

     ```ts
     case 'bubble-machine':
       bubbleMachinePerformance?.apply(time, p);
       signalValue = bubbleMachinePerformance?.signal() ?? run;
       break;
     ```

   - 在 `stop()` 专用复位区加入：

     ```ts
     if (kind === 'bubble-machine') bubbleMachinePerformance?.reset();
     ```

2. `src/systems/ApplianceSpectacleSystem.ts`

   - 将：

     ```ts
     case 'bubble-machine': this.updateBubbleMachine(session, time, unit, inward); break;
     ```

     改成纯 `break`：

     ```ts
     case 'bubble-machine': break;
     ```

   - `updateBubbleMachine()` 可保留为暂时无调用的旧代码，也可在确认没有引用后删除；不要删除全局 `bubble` 池，因为共享系统的类型/调试统计仍可能依赖它。

接线后，游戏与图鉴都继续走 `AppliancePerformanceSystem -> ApplianceMechanics -> BubbleMachinePerformance`；图鉴自动旋转只改变模型根节点，泡泡的模型局部轨迹会一起旋转，不会出现第二套动画或资源。

## 审计结论

- 旧 `ApplianceSpectacleSystem` 的泡泡是 `SphereGeometry(0.14, 10, 7)` 配单一浅蓝材质，统一透明度约 `0.52`；没有虹彩膜层、边缘层或独立高光，因此在浅背景和快速运动中几乎不可见。
- 旧普通泡泡仅使用共享池的 30 个槽位，尺寸随机缩放范围连续但视觉档位不清晰；巨大泡泡只是相同球体以 `3.1 * unit` 放大，没有独立上升阶段和真实爆裂反馈。
- 旧共享分支以相机右方向发射，且模型中原本不存在它查找的 `bubble-machine-output-socket`，会回退到机器根节点；新稳定 socket 修复了这个来源位置错误。
- 现有 sculpt spec 的关键条目要求薄透明虹彩膜、独立高光、池化泡泡、前轮与风扇同一动力时间线；新 rig 将这些要求落实为实际几何、材质和可验证元数据。
- `BubbleMachinePerformance` 明确声明 `sharedSpectacleEffects: 'disabled'`，接线后只有一个时间线 owner 和一个效果 owner。

## 接线后回归命令

```powershell
npx playwright test tests/bubble-machine-performance.spec.ts --project=desktop-chrome --reporter=line
npx playwright test tests/appliance-performance.spec.ts --project=desktop-chrome --reporter=line
npm run build
```

验收时再检查 `AppliancePerformanceSystem.getStateSummary().activeByKind.bubble` 在泡泡机运行期间为 `0`；可见泡泡应来自 `bubble-machine-performance-bubble-*`，共享 `spectacle-bubble-*` 不应同时出现。
