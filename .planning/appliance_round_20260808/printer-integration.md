# 打印机专属性能接线

## 本轮所有权

- 模型与纸张 rig：`src/appliances/models/printer.ts`
- 专属时间线：`src/appliances/performance/PrinterPerformance.ts`
- 专项验收：`tests/printer-performance.spec.ts`
- 共享 `ApplianceMechanics.ts` 与 `ApplianceSpectacleSystem.ts`：本子任务未修改

## 已实现的打印机 rig

`printer-performance-paper-rig` 下有 6 个独立页面节点：

- `printer-performance-page-1` 到 `printer-performance-page-6`
- 每个页面各有一个 `printer-flexible-a4-output-page-N`
- 纸张尺寸为 `2.05 x 2.899 x 0.026`，长宽比为 `sqrt(2)`，宽度接近 2.28 的输出口
- 几何是封闭的 `BufferGeometry`：上下表皮、四周边壁、5 x 10 纵横分段，不是 `PlaneGeometry`
- 所有页面初始隐藏，由 `PrinterPerformance` 根据各自 `launchTime` 显示和回收

页面从本地纸口位置 `(0, 0.75, 1.53 - A4_LENGTH / 2)` 发射。各页发射时间从 0.28 秒开始，间隔 0.58 秒；单页飞行 1.96 秒，最后一页在 5.14 秒完成底部退出，仍处于共享 5.2 秒激活窗内。

## 专属时间线

`createPrinterPerformance(root)` 同时驱动：

- 后纸托展开
- 进纸滚轮旋转
- 打印小车横移
- 输出托盘展开
- 状态灯
- 6 张打印纸的独立路径、柔性形变和回收

单页路径阶段：

1. `feed`：滚轮高速送出，前端渐进弯起并向前上扬。
2. `loop`：纸沿半径 2.4、约 4.8 高/深的完整空间大环路翻飞；姿态跟随轨迹切线，不是原地自转。
3. `fall`：继续前飞至 Z=10.8（旧共享粒子 4.6 的 2.35 倍），同时左右往复飘落。
4. `recycled`：纸的本地 Y 到达 -8.55，低于 `bottomExitY=-6.8` 后才隐藏和回收，不在半空消失。

每帧按顶点连续改变前缘卷曲、纵向波浪、横向扭转；页面的极薄体积始终保留。`reset()` 恢复纸张所有顶点、节点姿态、机械部件和状态灯。

## 主代理接线操作

共享文件由主代理统一处理，建议只做以下最小接线：

1. 在 `src/appliances/performance/ApplianceMechanics.ts` 导入 `createPrinterPerformance`。
2. 在工厂初始化处加入：

   ```ts
   const printerPerformance = kind === 'printer'
     ? createPrinterPerformance(root)
     : null;
   ```

3. 将现有 `case 'printer'` 中的通用滚轮/小车代码替换为：

   ```ts
   case 'printer':
     printerPerformance?.apply(time, p);
     signalValue = printerPerformance?.signal() ?? run;
     break;
   ```

4. 在 `stop()` 中加入：

   ```ts
   if (kind === 'printer') printerPerformance?.reset();
   ```

5. 在 `src/systems/ApplianceSpectacleSystem.ts` 的 `case 'printer'` 停用 `updatePrinter`，防止旧的通用 `paper` 粒子与模型自有 A4 页叠加。推荐保留 case 并注释打印机特效由 `PrinterPerformance` 独占，便于所有权审计。

接线后，游戏和图鉴都继续经 `AppliancePerformanceSystem -> ApplianceMechanics` 使用同一专属时间线，图鉴自动旋转无需改动。

## 验收命令

```powershell
npx playwright test tests/printer-performance.spec.ts --project=desktop-chrome --reporter=line
npm run build
```

专项测试覆盖：无 Plane/Sprite/Line、A4 比例与真实厚度、纸张可顶点弯曲、6 页明显错峰、空间大环路、水平距离大于旧值 2 倍、左右摆落、底部退出后回收，以及精确 reset。
