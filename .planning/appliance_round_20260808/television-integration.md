# 电视机共享时间线集成说明

本子任务只提交电视专属模型、`TelevisionPerformance` 和测试，不直接改多人共享的 `ApplianceMechanics.ts` / `ApplianceSpectacleSystem.ts`。主集成人员应做以下三处机械替换，不能叠加旧逻辑。

## 1. ApplianceMechanics.ts

在顶部引入：

```ts
import {
  applyTelevisionPerformance,
  resetTelevisionPerformance,
} from './TelevisionPerformance';
```

把现有 `case 'television'` 中缩放 `television-crt-screen-pivot`、旋转扫描线和整机抖动的全部代码替换成：

```ts
case 'television':
  applyTelevisionPerformance(root, time, p);
  break;
```

旧分支会缩放屏幕玻璃和物理外壳，而且没有频道内容；保留它会与新专属 `television-picture-pivot` 重复收缩。`stop()` 中追加：

```ts
if (kind === 'television') resetTelevisionPerformance(root);
```

## 2. ApplianceSpectacleSystem.ts

将分派中的电视改为纯 `break`：

```ts
case 'television': break;
```

删除未再使用的 `updateTelevision()`。它当前从 `this.origin` 生成通用 `debris`，不是电视雪花，也不从屏幕 socket 发射；新雪花、信号条和关机亮线全部由模型专属闭合几何负责。

## 3. 集成后验收

```powershell
npx playwright test tests/television-performance.spec.ts tests/appliance-performance.spec.ts
npm run build
```

必须确认：

- 游戏和图鉴在同一时间点产生一致的 `root.userData.televisionPerformanceDiagnostics`。
- `timelineOwners === 1`，没有第二个电视计时器。
- 0.94 秒：第二枚频道键下压、旋钮到中档、雪花出现、诊断频道为 2。
- 1.84 秒：第三枚频道键下压、旋钮到右档、雪花出现、诊断频道为 3。
- 4.54–4.76 秒：画面纵向收成水平亮线；4.78–5.02 秒：亮线横向收成点；5.14 秒后暗屏。
- 通用粒子池中没有电视 `debris`，屏幕玻璃与机壳不参与缩放。

