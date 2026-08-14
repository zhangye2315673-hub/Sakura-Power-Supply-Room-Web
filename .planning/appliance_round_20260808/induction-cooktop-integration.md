# 电磁炉独立接线说明

## 本子任务完成的专属改造

- 保留现有三视图还原的低矮圆角炉体、粉色玻璃陶瓷面板、炉圈、旋钮、侧通风孔、底部风扇格栅和电源收纳结构；没有覆盖其他代理或用户的工作树修改。
- 锅内保留并统一驱动 13 件立体食材：3 片带油花肉片、3 块豆腐、4 颗丸子、3 组带茎蔬菜。所有食材均为闭合体积几何。
- 新增 14 个 `induction-cooktop-soup-rolling-bubble-*` 立体 Low Poly 汤泡，替代旧 `hotpot-boil-bubble` 面片/通用池命名与所有权。
- 新增 18 组 `induction-cooktop-steam-cloud-*-pivot` 蒸汽云；每组由多瓣 `DodecahedronGeometry` 雾团和闭合 `TorusGeometry` 卷气流组成，不含 `PlaneGeometry`、`Sprite` 或 `Line`。
- 新增 `InductionCooktopPerformance.ts`，单一时间线依次表现：
  - `0.12–1.18s` 小火煮动：食材缓慢漂移、翻动、转向；
  - `1.18–2.48s` 升温：汤面起伏增大，汤泡和蒸汽逐步出现；
  - `2.48–3.28s` 爆沸：汤面高频翻滚，18 组蒸汽向上冲；
  - `3.28–4.08s` 锅短促上弹：只有锅跳，炉体不跳；
  - `3.32–4.72s` 13 件食材按 0.026 秒间隔、不同高度/横向漂移/旋转速度独立飞行，控制器抵消父锅位移，使食材世界轨迹不粘锅；
  - `4.08s` 锅先落回炉面，随后食材逐件回锅并压出汤面冲击与余波；
  - `4.78–5.20s` 蒸汽与热圈减弱，整体稳定。
- 控制器提供 `start()`、`update()/apply()`、`stop()/reset()` 和 `signal()`；`stop()` 恢复全部受控节点可见性、位置、四元数、缩放及材质发光/透明度。

## 主代理需要做的共享接线

本子任务没有编辑 `src/appliances/performance/ApplianceMechanics.ts` 或 `src/systems/ApplianceSpectacleSystem.ts`，避免并发冲突。请统一接线时做以下最小改动：

1. 在 `ApplianceMechanics.ts` 导入：

   ```ts
   import { createInductionCooktopPerformance } from './InductionCooktopPerformance';
   ```

2. 在其他专属 controller 初始化区创建一次：

   ```ts
   const inductionCooktopPerformance = kind === 'induction-cooktop'
     ? createInductionCooktopPerformance(root)
     : null;
   ```

3. 将现有 `case 'induction-cooktop'` 的锅整体抬升/倾斜和错误的 `induction-cooktop-heat-ring-` 内联分支完整替换为：

   ```ts
   case 'induction-cooktop':
     inductionCooktopPerformance?.apply(time, p);
     signalValue = inductionCooktopPerformance?.signal() ?? run;
     break;
   ```

   不要保留旧分支，否则锅会被两个 owner 重复位移，食材的惯性补偿也会失真。

4. 在统一 `stop()` 的专属复位区加入：

   ```ts
   if (kind === 'induction-cooktop') inductionCooktopPerformance?.reset();
   ```

5. 在 `ApplianceSpectacleSystem.updateSession` 把：

   ```ts
   case 'induction-cooktop': this.updateCooktop(session, time, unit); break;
   ```

   改为纯 `break`：

   ```ts
   case 'induction-cooktop': break;
   ```

   `updateCooktop()` 和全局通用蒸汽池可暂时保留给其他家电，但电磁炉不能再调用。模型上的 `externalPerformanceCue.sharedSpectacleEffects` 已标记为 `must-be-disabled-during-integration`。

接线后游戏与图鉴仍共用 `AppliancePerformanceSystem -> ApplianceMechanics -> InductionCooktopPerformance`；不新增第二模型或第二时间线。图鉴 `autoRotate` 继续只作用于展示根节点，不会改变锅内局部物理阶段。

## 专项验证

```powershell
npx playwright test tests/induction-cooktop-performance.spec.ts --project=desktop-chrome --reporter=line
npx tsc --noEmit
npm run build
```

专项测试覆盖：14 个立体汤泡、18 组多瓣蒸汽、13 件四类立体食材、无 Plane/Sprite/Line、小火到爆沸阶段、锅跳峰值、食材错峰高度差、锅先落下时食材仍在空中、回锅冲击、单一效果 owner 元数据，以及 `start/update/stop` 精确复位。

共享接线后还需重跑 `tests/appliance-performance.spec.ts`，并在约 `0.7 / 2.8 / 3.61 / 4.18 / 5.1s` 检查模型审阅页；运行电磁炉时 `AppliancePerformanceSystem` 应为一个 session、一个 timeline owner，旧共享 `steam`/`cooktop` 活跃计数必须为 0。
