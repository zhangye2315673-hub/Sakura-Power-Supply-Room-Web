# 咖啡机统一动画接线说明

本子任务只修改咖啡机专属模型、新增 `CoffeeMakerPerformance.ts` 与专项测试，没有直接编辑 16 路并发共享的 `ApplianceMechanics.ts` / `ApplianceSpectacleSystem.ts`。

## 真实结构依据

- Breville Barista Express 产品页：顶部豆仓连接锥形磨豆刀盘，冲煮链包含 54 mm portafilter、15 bar 泵、Thermocoil、PID 与压力反馈。参考：<https://www.breville.com/en-us/product/bes870>。
- 同页官方透明产品图明确显示顶部宽口透明豆仓、下窄锁定颈与上盖；本模型据此采用灰色半透明截锥仓、锁定环和白色实体盖，不复刻工业细节。
- National Coffee Association 对咖啡果实双种子的说明与常见烘焙豆实物轮廓共同支持“椭圆鼓起种子 + 中央纵向沟槽”，因此豆子使用椭球实体并单独建模弯曲中缝，而不是小球。参考：<https://www.aboutcoffee.org/origins/what-is-coffee/>。
- 浓缩咖啡结构按真实因果链简化为：豆仓/磨豆机构 -> 冲煮头花洒盘 -> 向下出液口 -> 杯中液面。预萃使用 3 个大滴，正式萃取使用双股厚流，避免与真实出液方向相悖。

## 1. ApplianceMechanics.ts

新增导入：

```ts
import {
  applyCoffeeMakerPerformance,
  resetCoffeeMakerPerformance,
} from './CoffeeMakerPerformance';
```

将现有 `case 'coffee-maker'` 中旋钮、冲煮头抖动和液面缩放的旧逻辑整体替换为：

```ts
case 'coffee-maker':
  applyCoffeeMakerPerformance(root, time, p);
  break;
```

在 `stop()` 的 kind 专属复位区加入：

```ts
if (kind === 'coffee-maker') resetCoffeeMakerPerformance(root);
```

不能保留旧三行逻辑叠加，否则液面缩放和冲煮头位移会被双重驱动。

## 2. ApplianceSpectacleSystem.ts

咖啡机的蒸汽、香气、暖光、咖啡液和滴流已全部由模型内闭合 3D rig 提供。将 switch 分支改为无共享发射：

```ts
case 'coffee-maker': break;
```

删除或停止调用 `updateCoffee()`。当前函数每 0.08 秒生成共享 `steam`，每 0.11 秒生成共享 `bubble`，若保留会与 `coffee-maker-volumetric-steam-rig` 重复，并重新引入旧泡沫语义。

## 3. 验收

- 运行 `npx playwright test tests/coffee-maker-performance.spec.ts --project=desktop-chrome --reporter=line`。
- 游戏和图鉴都应只经 `AppliancePerformanceSystem -> ApplianceMechanics -> CoffeeMakerPerformance`。
- 运行时 `coffeeMakerPerformanceDiagnostics.sharedSpectacleEffects` 必须为 `disabled`，共享 steam/bubble 活跃数应为 0。
- 检查不存在 `coffee-maker-coffee-stream`、`coffee-maker-steam-particle-*`、旧 beer/rim/overflow foam 名称，且咖啡机子树没有 Plane/Sprite/Line。
