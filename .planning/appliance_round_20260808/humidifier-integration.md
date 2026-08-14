# 加湿器共享时间线集成说明

## 已完成的专属实现

- `src/appliances/models/humidifier.ts` 已建立模型内 weather rig：18 组四瓣体积雾、9 瓣大型乌云、3 个内部闪光亮体、1 根闭合 Tube 闪电、36 个 Lathe 水滴。
- `src/appliances/performance/HumidifierPerformance.ts` 已提供唯一专属时间线：`applyHumidifierPerformance(root, time, power)` / `resetHumidifierPerformance(root)`。
- 专属实现没有 `PlaneGeometry`、`Sprite`、细线雨或共享粒子池；所有可见天气都跟随 `appliance-model-humidifier`，所以游戏与图鉴共用同一套模型和姿态。

## 主代理应在共享文件执行的最小接线

本子任务为避免 16 路并发冲突，未直接编辑共享 `ApplianceMechanics.ts` / `ApplianceSpectacleSystem.ts`。合并时只需：

1. 在 `src/appliances/performance/ApplianceMechanics.ts` 导入：

   ```ts
   import {
     applyHumidifierPerformance,
     resetHumidifierPerformance,
   } from './HumidifierPerformance';
   ```

2. 用专属时间线替换现有 `case 'humidifier'` 的两行通用旋转逻辑：

   ```ts
   case 'humidifier':
     applyHumidifierPerformance(root, time, p);
     break;
   ```

3. 在 `stop()` 的复位分支加入：

   ```ts
   if (kind === 'humidifier') resetHumidifierPerformance(root);
   ```

4. 在 `src/systems/ApplianceSpectacleSystem.ts` 令 `updateHumidifier` 不再生成任何共享效果。应删除/置空当前 `humidifier-mist` 的通用 `steam` spawn、共享 `slot.cloud` / `slot.lightning` 驱动，以及 `humidifier-rain` 的五棱柱雨 spawn。保留共享池给其他家电使用，不需要删除全局 `steam` / `rain` 类型。

   推荐最终实现：

   ```ts
   private updateHumidifier(_session: Session, _time: number, _unit: number): void {
     // HumidifierPerformance exclusively drives the model-owned weather rig.
   }
   ```

## 时间线

- `0.00–0.38s`：旋钮启动，喷口轻摆。
- `0.22–1.42s`：18 组体积雾连续循环，上升约 2.45 模型单位并扩散成高而宽的雾柱。
- `1.28–2.34s`：雾在约 `Y=5.2` 汇聚，乌云逐步长到约 `4.1 × 2.5 × 2.05`，正投影视觉面积约为本体 1.5 倍。
- `2.42–3.75s`：三次短促内部亮体/立体闪电闪烁。
- `2.68–4.68s`：36 个水滴持续降落；一部分以机顶 `Y=2.82` 为落点，其他落到附近地面。
- `4.68–5.18s`：雨、云、雾按因果顺序收尾；由共享 `5.2s` powered window 统一停止和复位。

## 合并后验收

- 运行 `npx playwright test tests/humidifier-performance.spec.ts --project=desktop-chrome --reporter=line`。
- 运行现有 `tests/appliance-performance.spec.ts`，确认一个 session / 一个 timeline owner，且旧命名节点仍为 0。
- 在游戏与图鉴分别冻结 `0.92s / 2.34s / 3.60s / 4.70s`，确认高雾、成云、闪电暴雨、收尾四个关键帧一致。
- 图鉴旋转一周检查：云和雾必须保持实体体积，闪电不是纸片；自动旋转不得被性能时间线关闭。
- 检查 `ApplianceSpectacleSystem.getStateSummary()`：加湿器运行时共享 `steam` / `rain` 活跃数应为 0，避免双重 owner。

## 当前风险

- 共享分支在主代理完成第 1–4 步前仍会叠加旧通用 steam/cloud/rain，这是唯一已知集成风险。
- 大型云位于本体上方，图库初始 framing 仍按隐藏 rig 的压缩 rest pose 计算；高潮设计上会占据画面顶部，需用真实浏览器截图确认不会被窄屏裁切。
- 36 个水滴和 72 个雾瓣为独立闭合网格；几何面数低且水滴共享同一 Geometry，但仍应在全 29 家电场景测一次帧率。
