# 智能垃圾桶接线说明

## 已完成的垃圾桶专属改造

- `smartBin.ts` 已删除顶口的 `smart-bin-recessed-opening` 黑色厚块和整块 `smart-bin-translucent-inner-liner`。
- 桶体改为前、后、左、右四片外壳；桶口不封顶。内胆由四面竖直内壁和位于桶口下方 `0.82` 单位的深底组成，开盖可看见向下桶腔。
- 模型内预建 8 类专属立体垃圾：纸团、香蕉皮、易拉罐、塑料瓶、苹果核、咖啡杯、薯片袋、外卖盒。全部是 `Mesh` 体积几何，没有 `PlaneGeometry`、`Sprite` 或 `Line`。
- `SmartBinPerformance.ts` 独占感应灯、开盖、八方向抛入、入桶下沉、连续冲击回弹、合盖时间线；易拉罐翻滚两圈、香蕉皮弯曲、纸团入桶前弹跳、塑料瓶轻旋，薯片袋与外卖盒也有各自形变/翻转。

## 主代理需要做的共享接线

为避免多个子代理并发修改共享文件，本分支没有编辑 `ApplianceMechanics.ts` 或 `ApplianceSpectacleSystem.ts`。汇总时请做以下最小接线：

1. 在 `ApplianceMechanics.ts` 导入 `createSmartBinPerformance`，与 `popcornMachinePerformance` 同样在工厂初始化一次：
   `const smartBinPerformance = kind === 'smart-bin' ? createSmartBinPerformance(root) : null;`
2. 把现有 `case 'smart-bin'` 中直接旋盖/发光的旧代码替换为：
   `smartBinPerformance?.apply(time, p); signalValue = smartBinPerformance?.signal() ?? run;`
3. 在统一 reset/stop 分支调用 `smartBinPerformance?.reset()`（若共享工厂的 controller `stop` 已统一调用，则无需额外分支）。
4. 在 `ApplianceSpectacleSystem.updateSession` 的 `case 'smart-bin'` 改为纯 `break`，不要再调用旧 `updateSmartBin`；通用 `trash` 池可以保留供其他设备使用，但智能垃圾桶不再发射它。模型上的 `externalPerformanceCue.sharedSpectacleEffects` 已标记为 `must-be-disabled-during-integration`。
5. 不要同时保留旧 `rotate('smart-bin-lid-hinge-pivot'...)` 和新 controller，否则盖子会双重旋转；不要同时保留 `updateSmartBin`，否则会叠加旧抛物线垃圾。

## 专项验证

运行：

`npx playwright test tests/smart-bin-performance.spec.ts --workers=1`

专项测试覆盖桶腔深度、旧黑顶口删除、八类立体垃圾、无 Plane、八方向完整收纳、冲击下沉/回弹、合盖、差异动作、确定性 reset。
