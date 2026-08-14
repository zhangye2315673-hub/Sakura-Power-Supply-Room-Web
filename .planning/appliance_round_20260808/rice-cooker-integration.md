# 电饭煲统一动画接线说明

本子任务只修改电饭煲模型、新增 `RiceCookerPerformance.ts` 与专项测试。为保护 16 路并行工作，没有直接编辑共享 `ApplianceMechanics.ts` 或 `ApplianceSpectacleSystem.ts`。

## 模型与专属 rig

- 锅内保留原有米饭总体尺寸，新建 18 粒有真实 XYZ 体积的白米：胶囊主形体 + 单独 TubeGeometry 背沟 + toon 轮廓。
- 新建 12 粒空中米饭实例，直接复用锅内米粒的几何和材质引用，不再由共享粒子池临时创建另一种胶囊米。
- 蒸汽改为 8 组、每组 4 个 IcosahedronGeometry 叶瓣的体积云团，全部挂在 `rice-cooker-steam-socket` 下；无 Plane、Sprite、Line。
- 盖座、盖枢轴、后铰链和后卡扣统一挂到 `rice-cooker-body-pivot`，锅身起伏时不会有父子层级脱节。
- `root.userData.riceCookerEffectContract.sharedSpectacleEffects` 标为 `must-be-disabled-during-integration`。

## 1. ApplianceMechanics.ts

新增导入：

```ts
import { createRiceCookerPerformance } from './RiceCookerPerformance';
```

在 `createApplianceMechanicalAnimation()` 初始化区新增：

```ts
const riceCookerPerformance = kind === 'rice-cooker'
  ? createRiceCookerPerformance(root)
  : null;
```

将当前 `case 'rice-cooker'` 的开关旋转、单一正弦锅盖、卡扣抖动和锅身跳动整段替换为：

```ts
case 'rice-cooker': {
  riceCookerPerformance?.update(time, p);
  signalValue = riceCookerPerformance?.signal() ?? 0;
  break;
}
```

在 `stop()` 中加入：

```ts
riceCookerPerformance?.stop();
```

不要保留旧逻辑叠加。`RiceCookerPerformance` 已完整负责开关、锅身、锅盖、卡扣、锅内米、空中米、蒸汽与指示灯。

## 2. ApplianceSpectacleSystem.ts

饭煲蒸汽和米饭已由模型专属 3D rig 提供。将 switch 分支改成无共享发射：

```ts
case 'rice-cooker': break;
```

停用 `updateRiceCooker()` 调用；当前函数每 0.09 秒生成共享 `steam`，每 0.055 秒生成共享 `rice`，会重复表现并重新引入不同造型的米粒。共享 pool 内的 `ParticleKind = 'rice'` 可以暂时保留给兼容代码，但饭煲运行时活跃数必须为 0。

## 3. 时间线验收

- `0.00-0.32s`：开关压下、指示灯点亮。
- `0.32-1.22s`：蒸汽持续建立，米床轻微煮动。
- `1.22-4.48s`：以 `0.38s` 为一拍，高盖 `0.44rad` / 矮盖 `0.22rad` 严格交替；蒸汽持续顶起。12 粒饭按时间差走抛物线，随后落回锅内并隐藏，而不是中途回收。
- `4.48-5.20s`：停止高低拍，蒸汽、锅身与卡扣运动按 smoothstep 单调自然减弱。
- 任何时刻盖壳都仍是 `rice-cooker-lid-hinge-pivot` 的子节点，枢轴又是锅身的子节点。

## 4. 验证命令

```powershell
npx playwright test tests/rice-cooker-performance.spec.ts --project=desktop-chrome --reporter=line
npx tsc --noEmit
npm run build
```

专项测试覆盖：内外米饭几何/材质同源、无平面特效、蒸汽 socket 归属、盖体父子层级、高矮交替节拍、米饭飞行落锅、蒸汽尾段单调减弱、reset 清理，以及相同时间戳下游戏/图鉴确定性同姿态。
