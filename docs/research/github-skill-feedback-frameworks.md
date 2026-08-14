# GitHub 技能反馈框架研究：arrow-cube

更新日期：2026-08-13

## 结论

当前项目不缺更多通用图标或基础粒子，缺的是统一的 `SkillPresentationController`：消费规则层已确定的 `SkillResolution`，把技能编排成可取消、可清理、可验证的 `cue → commit → impact/result → settle → cleanup`。

建议的最小组合：

1. **Anime.js**：直接接入，统一编排 DOM、Three.js 对象和 Shader uniform。
2. **Three.js CSS2DRenderer**：使用现有 addons，负责世界空间编号、次数和目标说明。
3. **three.quarks**：先做原型，只使用自制 Low Poly Mesh/Trail 粒子。
4. **Three.js Line2 + 现有 TubeGeometry**：负责路线、扫描、线缆膨胀；必要时局部使用 meshline。
5. **XState、Godot Gameplay Abilities、Unity Status Effects Framework**：只借生命周期和事件结构，不迁移当前规则状态机。

目标不是“更炫”，而是每个技能都明确回答：谁发动、作用于谁、中间发生什么、最终结果是什么、何时结束或被抵消。

## 当前架构事实

- 当前运行时是 vanilla Three.js `^0.184.0`，不是 React Three Fiber。
- `SkillResolution.presentation` 已有 `cue / commit / settle / assetIds`，但 `assetIds` 当前全部为空。
- 专属模型、目标 tint、屏幕 Shader、HUD 与状态图标映射分散在 `Game.ts`、`SkillEffectModelKit.ts`、`post.ts`、`SkillChallengeUi.ts`。
- Sakura 参考项目的核心是程序化几何、量化 toon 光照、冷色阴影和屏幕空间描边，而不是素材包。
- 家电本体若干契约禁止 `PlaneGeometry / Sprite / Line`。CSS2D、线条和粒子只能属于独立的技能反馈层，不能替代家电本体造型。

## 候选项目

| 项目 | 许可证 | 使用方式 | 能解决什么 | 风险 |
|---|---|---|---|---|
| [Anime.js](https://github.com/juliangarnier/anime) | MIT | 直接依赖 | UI/3D/Shader 统一时间线、取消清理 | 必须由自有 Controller 管理；回调不能决定规则 |
| [tween.js](https://github.com/tweenjs/tween.js) | MIT | Anime.js 的替代，不同时装 | 轻量数值插值、独立 Group | 跨 DOM/3D 编排需自建 |
| [Theatre.js](https://github.com/theatre-js/theatre) | Core Apache-2.0；Studio AGPL-3.0 | 复杂技能样片工具 | 电视、电脑演出关键帧 | 偏重，不适合 29 项技能全量运行时 |
| [three.quarks](https://github.com/Alchemist0823/three.quarks) | MIT | 先原型后决定 | Mesh 粒子、Trail、表面发射、自动销毁、批处理 | 必须禁用写实贴图烟花并设置预算 |
| [three-nebula](https://github.com/creativelifeform/three-nebula) | MIT | quarks 的备选 | 通用 Three.js 粒子 | 不应并存两套粒子运行时 |
| [postprocessing](https://github.com/pmndrs/postprocessing) | Zlib | 局部引入或移植 Effect 结构 | Selection Outline、ShockWave、Glitch、Pixelation | 当前已有自研管线，不宜整套替换 |
| [THREE-CustomShaderMaterial](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial) | MIT | 条件式接入 | 保留材质同时做冻裂、热浪、鼓包、溶解 | 与现有 toon patch 组合需验证 |
| [drei-vanilla](https://github.com/pmndrs/drei-vanilla) | MIT | 移植 Trail 思路 | 扫描、吸走轨迹、实例 Mesh trail | 整包含大量无关 helper |
| [MeshLine](https://github.com/spite/THREE.MeshLine) | MIT | 局部使用 | 路线高亮、虚线推进、沿线变宽 | 旧 API；优先官方 Line2/现有 Tube |
| [troika-three-text](https://github.com/protectwise/troika) | MIT | CSS2D 不够时再用 | 高质量世界空间中文/数字 | 对简单数字太重，需显式 dispose |
| [Three.js CSS2DRenderer](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/renderers/CSS2DRenderer.js) | MIT | 现有 addons | 编号、次数、目标、抵消/到期提示 | 无自动遮挡；仅保证 100% 显示缩放 |
| [Three.js Line2](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/lines) | MIT | 现有 addons | 路线预演、扫描线 | 只能辅助，不能替代 Low Poly 主动作 |
| [XState](https://github.com/statelyai/xstate) | MIT | 借生命周期语义 | 创建与销毁成对，防残留 | 不重写已通过测试的规则状态机 |
| [godot-gameplay-abilities](https://github.com/OctoD/godot-gameplay-abilities) | MIT | 架构参考 | 判定、自动条件和反馈分离 | Godot 代码不能直接移植 |
| [StatusEffectsFramework-Unity](https://github.com/maraudical/StatusEffectsFramework-Unity) | MIT | 状态事件参考 | 新增、更新、抵消、到期、删除 | 需适配当前单 BUFF/单 DEBUFF 规则 |

## 推荐短名单

### Anime.js：统一技能时间线

Anime.js V4 能动画 CSS、DOM 属性、普通 JS 对象和 Three.js 对象。每次技能生成独立 timeline，并固定 `cue / target-lock / commit / impact / result / settle / cleanup` 标签。`cancel()` 必须触发统一 cleanup，清除临时模型、CSS2D 标签、目标材质覆盖、后处理模式和订阅。规则结果仍在 Engine 的 commit 阶段决定，动画只呈现既定结果。

### CSS2DRenderer：让玩家知道“作用于谁”

`CSS2DObject` 会跟随世界坐标；从场景移除时，官方实现会删除对应 DOM。适合收音机 `1/2/3`、微波炉剩余次数、打印机复制目标、手机真假尾端，以及状态抵消/到期短提示。需补轻量遮挡判断，避免标签穿模。

### three.quarks：只做“有形状的 Low Poly VFX”

它支持批处理、Mesh 粒子、Trail、Mesh Surface 发射、生命周期行为和自动销毁。粒子只能来自项目自制的 4–12 面几何，如米粒、冰片、纸屑、泡泡壳、樱花片、扫描方块；禁用写实烟火贴图，并设置移动端粒子与 draw-call 预算。

### 现有 TubeGeometry + 官方 Line2

电饭煲“变粗”无需新粒子库。让渲染 Tube 的半径包络真实变化，权威碰撞/拓扑数据保持不变。Line2 负责路线和扫描；仅在需要沿路径变宽或动态 dash 时局部考虑 meshline。

### postprocessing：借可组合 Effect，不推倒现有管线

当前 `SakuraPipeline` 已负责 toon grade、描边和技能屏幕效果。第一阶段只移植 Selection-based Outline 与 world-position ShockWave 两种思路；若后续自研 Pass 继续增加，再评估统一迁移。

## 映射到具体技能

| 技能/问题 | 推荐机制 | 新反馈流程 |
|---|---|---|
| 洗衣机立即隐藏 | Anime.js + quarks Mesh Trail | 目标锁定 → 绕滚筒加速 → 低多边形水滴/尾迹 → 甩出 → 结果 → 清理 |
| 扫地机器人立即隐藏 | CSS2D + Line2/Outline + quarks | LiDAR 扫描 → 目标框 → 路径收束到吸入口 → 线缆缩入 → “已清除” |
| 打印机复制缺因果 | Anime.js + CSS2D + Low Poly 纸片 | 标记复制动作 → 纸片进出 → 额外目标出现 → 告知实际对象 |
| 智能垃圾桶立即隐藏 | quarks Mesh + Tube 缩放 | 目标确认 → 分段折叠/碎片化 → 吸入桶口 → 状态更新 |
| 收音机同时染黄 | Anime.js + CSS2D + Line2 | `1` 先亮并脉冲 → `2` → `3` → 路线总览 → 标签退出 |
| 电饭煲只变色 | 现有 TubeGeometry + Anime.js | 米粒沿线传播 → 半径鼓起 → HUD 持续回合 → 到期回缩 |
| 电视与烤面包机相似 | 不同视觉语法 | 电视分块错位/扫描重构；烤面包机两端弹起、翻面、落下 |
| 台式电脑只有规则蓝屏 | Anime.js + 局部 post + CSS2D | 卡顿 → 像素冻结 → 蓝屏 → 显示实际损失 → 恢复/失败 |
| 手机误导不明确 | CSS2D + target shock wave | 三候选依次锁定，最终真假结果明确落地 |
| 微波炉空目标 DEBUFF | 状态事件 + cleanup guard | 目标删除发布 `statusTargetRemoved`；目标为空立即 `statusRemoved` 并消散 |
| 分支技能固定说明 | SkillResult event + result beat | commit 后写真实分支结果，在 result 标签展示 |
| BUFF/DEBUFF 图标相似 | 状态事件模型 | 图标只做身份；新增、抵消、续期、到期用不同边框动画、方向、目标连线和文字表达 |

## 推荐数据契约

`Game.ts` 不应继续按 appliance 分散判断。表现配方至少应声明 timeline、targetIds、worldMarkers、effectAssets、screenEffect、resultText、statusEvents。状态事件应区分 `status-added / refreshed / blocked / replaced / expired / target-removed / removed`，让 UI 与 3D 表现订阅同一事件。

## 不推荐

- 不下载 RPG BUFF/DEBUFF 图标包，不继续用 GPT 批量生成复杂图标。
- 不把 R3F-only 组件装进 vanilla Three.js；只用 `drei-vanilla` 或底层源码。
- 不同时引入 Anime.js 与 Tween.js，也不同时引入 quarks 与 nebula。
- 不用 Theatre.js 接管全部 29 项技能运行时。
- 不整套替换当前 `SakuraPipeline`。
- 不用通用烟火、光环、闪电掩盖技能语义。
- 不让动画回调决定规则；规则先 commit，表现读取不可变结果。

## 三个验证性原型

1. **收音机三步路线**：Anime.js + CSS2DRenderer + 官方 Line2，验证统一时间线、标签和 cleanup。
2. **电饭煲线缆膨胀**：复用 TubeGeometry，验证“逻辑几何不变、表现几何可动画”。
3. **扫地机器人清线**：three.quarks Low Poly Mesh/Trail 小样，验证移动端预算、自动销毁和 Sakura 风格。

三个原型通过后，再处理电视、台式电脑与完整 BUFF/DEBUFF 生命周期。

## 一手来源

- Anime.js：[仓库](https://github.com/juliangarnier/anime)、[Three.js adapter tests](https://github.com/juliangarnier/anime/blob/master/tests/suites/threejs.test.js)、[Timeline](https://github.com/juliangarnier/anime/blob/master/src/timeline/timeline.js)、[Timer](https://github.com/juliangarnier/anime/blob/master/src/timer/timer.js)
- three.quarks：[仓库与 README](https://github.com/Alchemist0823/three.quarks)
- postprocessing：[README](https://github.com/pmndrs/postprocessing)、[OutlineEffect](https://github.com/pmndrs/postprocessing/blob/main/src/effects/OutlineEffect.js)、[ShockWaveEffect](https://github.com/pmndrs/postprocessing/blob/main/src/effects/ShockWaveEffect.js)
- Three.js：[CSS2DRenderer](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/renderers/CSS2DRenderer.js)、[Line2](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/lines)
- drei-vanilla：[README](https://github.com/pmndrs/drei-vanilla)、[Trail](https://github.com/pmndrs/drei-vanilla/blob/main/src/core/Trail.ts)
- Custom Shader Material：[README](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial)
- MeshLine：[README](https://github.com/spite/THREE.MeshLine)
- troika-three-text：[README](https://github.com/protectwise/troika/blob/main/packages/troika-three-text/README.md)
- tween.js：[README](https://github.com/tweenjs/tween.js)、[Tween](https://github.com/tweenjs/tween.js/blob/main/src/Tween.ts)、[Group](https://github.com/tweenjs/tween.js/blob/main/src/Group.ts)
- Theatre.js：[README](https://github.com/theatre-js/theatre)、[Public types](https://github.com/theatre-js/theatre/blob/main/packages/core/src/types/public.ts)
- XState：[仓库](https://github.com/statelyai/xstate)、[StateNodeConfig](https://github.com/statelyai/xstate/blob/main/packages/core/src/types.ts)
- Gameplay/status 结构：[Godot Gameplay Abilities](https://github.com/OctoD/godot-gameplay-abilities/blob/main/USAGE.md)、[Unity StatusManager](https://github.com/maraudical/StatusEffectsFramework-Unity/blob/main/Shared/Runtime/Scripts/Classes/StatusManager.cs)、[Unity UI manager](https://github.com/maraudical/StatusEffectsFramework-Unity/blob/main/Samples~/Example/Scripts/Runtime/StatusEffectUIManager.cs)
