# 唱片机专属演出接线说明

## 子任务边界与已完成内容

本子任务只修改唱片机模型、新增 `RecordPlayerPerformance.ts` 和专项测试，没有直接编辑多人共享的 `ApplianceMechanics.ts` / `ApplianceSpectacleSystem.ts`。

- `recordPlayer.ts` 保持参考图中的开盖待机姿态，并把唱臂拆成“水平扫臂 pivot + 垂直 cue pivot”，从而能先抬起、移到唱片外缘、轻落，结束时反向归位。
- `RecordPlayerPerformance.ts` 是机械动作和所有可见效果的唯一时间线：右旋钮、指示灯、转盘缓启/稳定/减速、唱臂 cue、整机节拍回弹、上盖共振、连续立体音波、立体音符、光点、节奏粒子和柔和立体星点均由它管理。
- 旧的 `record-player-music-notes` 外部提示已从模型元数据中移除；新的模型元数据明确要求共享特效在集成时关闭。
- 所有效果使用 `TubeGeometry`、`ExtrudeGeometry`、`IcosahedronGeometry`、`CapsuleGeometry` 等有体积几何；禁止 `PlaneGeometry`、`Sprite`、`Line`。

## ApplianceMechanics.ts 接线

1. 增加导入：

```ts
import { createRecordPlayerPerformance } from './RecordPlayerPerformance';
```

2. 与其他专属 controller 一样，在工厂初始化区创建一次：

```ts
const recordPlayerPerformance = kind === 'record-player'
  ? createRecordPlayerPerformance(root)
  : null;
```

3. 将 `case 'record-player'` 中现有三行旧动画完整替换，不要叠加：

```ts
case 'record-player':
  recordPlayerPerformance?.apply(time, p);
  signalValue = recordPlayerPerformance?.signal() ?? run;
  break;
```

必须删除的旧逻辑是：

```ts
rotate('record-player-lid-hinge-pivot', 'x', ...);
rotate('record-player-platter-spin-pivot', 'y', ...);
rotate('record-player-tonearm-pivot', 'y', ...);
```

新演出把“上盖已打开”视作初始状态，因此绝不能再播放旧的开盖动画。

4. 在统一 `stop` 分支中增加：

```ts
if (kind === 'record-player') recordPlayerPerformance?.reset();
```

共享 `restore(objects, materials)` 可以保留；专属 `reset()` 还负责隐藏不在共享基线捕获中的效果池，并精确恢复旋钮、唱臂、上盖和根节点。

## ApplianceSpectacleSystem.ts 接线

将唱片机分支改成纯 `break`，不要再调用 `updateMusic`：

```ts
case 'record-player': break;
```

`updateMusic` 和通用 `note` 池仍可供其他设备使用，但唱片机不能再成为它们的 owner。新音符名称为 `record-player-performance-note-*`，是带倒角和厚度的 `ExtrudeGeometry`，不是旧的通用廉价音符面片。

## 单一所有权验收

集成后同一时间戳必须满足：

- `root.userData.recordPlayerPerformanceDiagnostics.timelineOwner === 'ApplianceMechanics/RecordPlayerPerformance'`。
- `root.userData.recordPlayerPerformanceDiagnostics.effectOwner === 'RecordPlayerPerformance'`。
- `sharedSpectacleEffects === 'disabled'`。
- `ApplianceSpectacleSystem` 的通用 `note` 活跃数对唱片机为 `0`。
- 游戏和图鉴都通过 `AppliancePerformanceSystem -> ApplianceMechanics -> RecordPlayerPerformance` 采样同一时间线，不复制模型或效果。
- `stop()` 后上盖仍保持参考图的开盖姿态，旋钮/唱臂/根节点精确回到待机基线，所有专属效果不可见。

专项验证命令：

```powershell
npx playwright test tests/record-player-performance.spec.ts --project=desktop-chrome --reporter=line
```
