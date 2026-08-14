# 手机专项集成说明（2026-08-08）

## 子任务已落地

- `src/appliances/models/phone.ts`
  - 删除旧充电环、闪电图标、五段电量条和呼吸通知点。
  - 屏幕改为有厚度的来电界面：立体头像、`MOMO` 联系人名、`CALLING` 来电提示、绿色接听键、红色挂断键和各自的电话听筒图标。
  - 新增模型自有的 3 组 Torus 立体声波环、4 组 Tube 震动脉冲、6 组 Tube 呼叫弧线、8 个 Icosahedron 柔和光点、6 组 RoundedBox 信息粒子。
  - 所有效果默认隐藏；无 `PlaneGeometry`、`Sprite`、`Line`，无战斗星、电流或必杀技语义。
- `src/appliances/performance/PhonePerformance.ts`
  - 新增唯一的来电时间线和诊断数据。
  - 原手机本体节奏原样迁移：`0.35 → 3.65 → 5.15` 的升起包络、`sin(time * 39) * 0.055` 横向震动、`sin(time * 35) * 0.045` 侧滚，高潮前仍保留原 anticipation 加高。
  - 屏幕在 `0.035–0.15s` 突然亮起；中段 `CALLING` 持续闪烁，头像和接听区域脉冲；外围体积反馈逐层增加，末段平顺收束。
- `tests/phone-performance.spec.ts`
  - 锁定来电 UI、闭合体积几何、无战斗主题、无旧充电 UI、时间线阶段、原运动参数和游戏/图鉴确定性一致。

## 主代理需要集中修改的共享文件

为避免 16 个家电子任务同时改公共 switch，本子任务没有编辑以下两处。合并时必须完成：

### 1. `src/appliances/performance/ApplianceMechanics.ts`

新增导入：

```ts
import { applyPhonePerformance, resetPhonePerformance } from './PhonePerformance';
```

把现有 `case 'phone'` 整段（旧 handset lift/shake/roll 和 `phone-battery-segment-` 显隐）替换为：

```ts
case 'phone':
  applyPhonePerformance(root, time, p);
  break;
```

在 `stop()` 的专项 reset 列表加入：

```ts
if (kind === 'phone') resetPhonePerformance(root);
```

不要在新分支外再叠加旧手机位移，否则升起和震动会翻倍。

### 2. `src/systems/ApplianceSpectacleSystem.ts`

把 switch 中：

```ts
case 'phone': this.updatePhone(session, time, unit); break;
```

改为：

```ts
// Phone owns closed volumetric call feedback under the shared timeline.
case 'phone': break;
```

然后删除私有 `updatePhone(...)` 方法。该方法会生成通用 `ribbon` 粒子，正是本轮要求删除的旧普通面片效果。不要全局删除 `ribbon` 粒子类型，因为闹钟等其他家电仍可能使用。

## 集成后的验收点

1. `npx playwright test tests/phone-performance.spec.ts`
2. `npx tsc --noEmit`
3. `npm run build`
4. 游戏和图鉴分别采样约 `0.18s / 2.0s / 2.2s / 3.42s / 5.1s`：屏幕亮起、提示闪烁、接听脉冲、外围体积反馈与本体运动必须一致。
5. `AppliancePerformanceSystem` 运行时 `root.userData.phonePerformance.sharedSpectacleEffects === 'disabled'`，且共享 spectacle 中不再生成 `phone-lines`。
6. 图鉴自动旋转保持开启；侧面视角确认按钮、屏幕 UI、声波环和信息粒子均有真实厚度，没有突然消失或穿过机身中心。
