# 闹钟专属动画集成说明

本子任务只修改闹钟专属模型，新增 `AlarmClockPerformance.ts` 与专项测试；为保护并行工作，没有直接编辑共享 `ApplianceMechanics.ts` / `ApplianceSpectacleSystem.ts`。

## 已完成

- `alarmClock.ts`：顶部按钮、提手、双铃、支撑柱与双锤全部重新挂到 `alarm-clock-body-pivot`，机身摇晃时以一个完整刚体运动。
- 双铃球冠半径由 `0.38` 增至 `0.50`，铃口半径由 `0.32` 增至 `0.42`，支撑同步加粗并外移，经典双铃轮廓更清楚。
- 新增模型自有的 6 个 Torus 立体声波与 4 个 Tube 震动弧线；没有 PlaneGeometry、Sprite 或 Line，默认隐藏，由专属 Timeline 驱动。
- `AlarmClockPerformance.ts`：机身采用高频横移、垂直跳动与整体侧滚；所有顶部结构随刚体运动，双铃与铃锤在局部轴上额外高频震动，指针转速显著提高。尾段平滑收束，`reset()` 精确恢复待机姿态。
- `tests/alarm-clock-performance.spec.ts`：锁定层级、双铃尺寸、体积反馈、无平面特效、高潮幅度/速度、指针速比、游戏/图鉴同时间戳一致性和精确复位。

## 主代理需要完成的共享接线

### 1. `src/appliances/performance/ApplianceMechanics.ts`

导入：

```ts
import { createAlarmClockPerformance } from './AlarmClockPerformance';
```

在工厂初始化区创建：

```ts
const alarmClockPerformance = kind === 'alarm-clock'
  ? createAlarmClockPerformance(root)
  : null;
```

把现有 `case 'alarm-clock'` 的旧指针、铃、锤和仅 `bodyPivot` 跳动逻辑整体替换为：

```ts
case 'alarm-clock':
  alarmClockPerformance?.apply(time, p);
  signalValue = alarmClockPerformance?.signal() ?? run;
  break;
```

在 `stop()` 专项复位区加入：

```ts
if (kind === 'alarm-clock') alarmClockPerformance?.reset();
```

必须整体替换旧分支，不能叠加，否则铃、锤和指针会被双重驱动。

### 2. `src/systems/ApplianceSpectacleSystem.ts`

把：

```ts
case 'alarm-clock': this.updateAlarm(session, time, unit); break;
```

改为：

```ts
// Alarm clock owns closed stereo waves and vibration arcs under the shared timeline.
case 'alarm-clock': break;
```

并删除未再使用的私有 `updateAlarm()`。旧方法每 `0.09s` 生成一次 `ribbon`，正是本轮要求删除的面片式响铃反馈；新反馈完全来自模型内 `alarm-clock-ringing-feedback-rig`。

## 集成后验收

```powershell
npx playwright test tests/alarm-clock-performance.spec.ts --project=desktop-chrome --reporter=line
npx playwright test tests/appliance-performance.spec.ts --project=desktop-chrome --reporter=line
npx tsc --noEmit
npm run build
```

另需确认游戏与图鉴在相同时间戳下 `root.userData.alarmClockPerformance` 一致，图鉴自动旋转仍开启；运行期间共享粒子池不再出现 `alarm-lines`，顶部按钮/提手/双铃无滞留、穿模或中途消失。
