# 冰箱技能 V3：适合 SAKURA 的开源屏幕结冰参考与实施计划

研究日期：2026-08-18  
范围：只查一级来源（作者在线 Demo、原始 GitHub 仓库、官方 Three.js 源码/文档、明确许可证）；本文不修改运行时代码。

## 先说结论

线缆方向已根据 2026-08-18 的最新视觉反馈更新：**冻结目标从插头头部向尾部逐段变冷，同时在已经变色的区域同步出现透明冰壳、墨色外描边和冰刺；扁片刺约占 72%，其余为尖刺。** 冰壳只比原轮廓厚一小圈，不使用球形鼓包、等距分段或糖葫芦式串珠。

屏幕结冰也没有一个现成开源组件能原样符合 SAKURA。最合适的是组合四个一级来源的局部能力：

1. 用 [Paper Shaders / Metaballs](https://shaders.paper.design/metaballs) 的少量大形状融合思路，生成不闭合的边缘冰舌；
2. 用 [Andrea Riccardi / FreezePostProcess](https://github.com/a-riccardi/shader-toy/blob/master/ShaderToy/Assets/FreezePostProcess/Shaders/Git/FreezePostProcess.shader) 的单一进度、coverage 与折射职责划分；
3. 用 [frost-reveal](https://github.com/kaminidoramawo/oss-frost-reveal) 的半分辨率遮罩和 DPR 上限控制成本；
4. 用项目现有 Three.js 后处理、[`DataTexture`](https://github.com/mrdoob/three.js/blob/r184/docs/pages/DataTexture.html.md) 和 `FullScreenQuad` 接入，不引入新的渲染框架。

推荐最终方向可概括为：

> **4–7 块从不同边缘独立长出的“大冰舌”，形状连贯但不围成框；只有三档低模色阶、一条窄亮边和极轻折射。中央玩法区始终清楚。**

Canvas UI 的 Frost 是目前最完整的前端视觉参考，但不能直接照搬：它偏写实磨砂玻璃、内部渲染较重，而且采用带 Commons Clause 的许可证。它适合帮助判断“冰从边缘进入、局部融化/恢复”的观感，不适合作为本项目的直接依赖。

## 本轮不可违反的视觉边界

以下不是可调参数，而是候选方案的淘汰条件：

- 线缆允许一层连续薄透明冰壳，但不能出现球形鼓包、等距分节或不透明套管；
- 冰刺必须沿完整路径分层随机分布、尺寸和倾斜不同，并以扁片形为主；
- 屏幕任意时刻都不能出现闭合矩形边框；
- 不使用 Voronoi 方砖、蜂窝晶格或大量小碎片；
- 不使用照片冰纹、写实冷凝水贴图或 GPT 生成冰贴图；
- 不用密集亮点、闪粉和白蓝条纹假装冰晶；
- 不让折射持续流动，避免读成热浪、水波或玻璃；
- 不遮住中央线组，也不把 UI 纳入冰冻后处理；
- 所有新效果先只进入 `mode=skill-test` 的冰箱测试，不影响其他模式、技能或家电。

## 候选优先级总表

| 优先级 | 一级来源 | 可借的核心 | 许可证 | 性能 / Three.js 接入 | SAKURA 适配判断 |
|---:|---|---|---|---|---|
| **1** | [Paper Shaders / Metaballs Demo](https://shaders.paper.design/metaballs)、[原始 shader](https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/metaballs.ts)、[仓库](https://github.com/paper-design/shaders) | 少量圆场融合为连续、有缺口的有机轮廓；`smoothstep` 控制边缘 | [Apache-2.0](https://github.com/paper-design/shaders/blob/main/LICENSE) | 低—中；不安装包，只把 6–8 个静态边缘种子预计算进一张小纹理 | **最适合决定形状语言**。需要把“果冻圆润”改成带方向的冰舌，并量化成三档色阶 |
| **2** | [Andrea Riccardi / FreezePostProcess 源码](https://github.com/a-riccardi/shader-toy/blob/master/ShaderToy/Assets/FreezePostProcess/Shaders/Git/FreezePostProcess.shader)、[作者项目展示](https://andreariccardi.artstation.com/projects/VeDOR) | 一个 `_Amount` 驱动结冰进度；MixMap 的 RG/B/A 分别表达 normal、density、gradient；只在 coverage 内折射背景 | [MIT](https://github.com/a-riccardi/shader-toy/blob/master/LICENSE) | 中；Unity/HLSL 要改写为现有 GLSL，仓库未附 MixMap/IceTex，不能直接运行 | **最适合时间与数据职责**。不复制其贴图和来源链不清的 non-tiling 函数 |
| **3** | [Canvas UI / Frost Demo](https://canvasui.dev/docs/components/frost)、[FrostVanilla 源码](https://github.com/DavidHDev/canvas-ui/blob/main/src/lib/Frost/FrostVanilla.ts) | 边缘增强、霜层高度、法线、折射、融化轨迹和重新冻结 | [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md) | 高；源码使用 WebGL2、多阶段纹理、512 高度场、1024 噪声和 blur pass | **最佳视觉参考，但不直接采用**。写实度和成本都高于本项目；许可证也不是 OSI 意义的纯开源 |
| **4** | [frost-reveal 仓库](https://github.com/kaminidoramawo/oss-frost-reveal)、[WebGL renderer](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/src/core/webgl-renderer.ts)、[fragment shader](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/src/core/shaders.ts) | 全屏四边形、半分辨率 mask、DPR 封顶、线性采样和 Canvas/WebGL 降级 | [MIT](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/LICENSE) | 低；结构简单，但原实现会反复上传 mask，并依赖冷凝图片 | **适合借性能结构，不适合借美术**。它本身只是白色磨砂覆盖，不是冰晶生长 |
| **5** | [Nathanael C. Fritz / Ice Covering](https://godotshaders.com/shader/ice-covering/) | coverage 阈值控制扩张；coverage 邻域差形成法线；冻结区域才做折射和冰色 | 页面将代码片段标为 MIT；页面图像、视频、素材不随代码授权 | 中；Godot shader 需改写，但数学结构很小 | **适合算法核对**。只能借 coverage/normal/refraction 结构，不能复制页面素材 |
| **6** | [Robert Leitl / phase-transition](https://github.com/robert-leitl/phase-transition)、[在线 Demo](https://robert-leitl.github.io/phase-transition/dist/?debug=true)、[核心 shader](https://github.com/robert-leitl/phase-transition/blob/main/src/app/shader/texture.frag.glsl) | Three.js/WebGL 的程序冰纹、独立 texture/normal 输出、状态过渡 | [MIT](https://github.com/robert-leitl/phase-transition/blob/main/LICENSE) | 高；核心包含多组 3D Voronoi 和最高 25 层 FBM，还带位移、视差与 bloom | **只看“数据分层”，不移植视觉**。直接使用会变成密集碎裂冰面，违背本轮要求 |
| **7** | [Stefan Gustavson / webgl-noise](https://github.com/stegu/webgl-noise)、[作者 Demo](https://stegu.github.io/webgl-noise/webdemo/)、[GLSL 源码](https://github.com/stegu/webgl-noise/tree/master/src) | 无外部纹理的 GLSL simplex/classic noise，可对大轮廓边缘做很小扰动 | [MIT](https://github.com/stegu/webgl-noise/blob/master/LICENSE) | 低—中；WebGL 1 可用，但要求 `highp` | **只作为边缘扰动辅料**。不采用其中 cellular/Worley 路线，避免重新得到方砖晶格 |
| **基础设施** | [Three.js r184 `DataTexture`](https://github.com/mrdoob/three.js/blob/r184/src/textures/DataTexture.js)、[`FullScreenQuad`](https://github.com/mrdoob/three.js/blob/r184/examples/jsm/postprocessing/Pass.js)、[LICENSE](https://github.com/mrdoob/three.js/blob/r184/LICENSE) | TypedArray 程序纹理；默认无 mipmap；全屏 shader 三角形/四边形 | MIT | 低；项目已经安装 Three.js 0.184 | **直接使用现有管线**，不新增 composer、React Three Fiber 或独立 Canvas 覆盖层 |

## 候选细看

### 1. Paper Shaders Metaballs：最适合解决“不要矩形框”

Paper Shaders 是零依赖 Canvas shader 集合，官方 README 将其定位为轻量、跨浏览器的可定制 shader，并明确采用 Apache-2.0：[README](https://github.com/paper-design/shaders/blob/main/README.md)、[LICENSE](https://github.com/paper-design/shaders/blob/main/LICENSE)。Metaballs 原始 shader 最多循环 20 个球场，把各自的 shape 累加后通过 `smoothstep` 得到最终连续轮廓：[源码](https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/metaballs.ts)。

对本项目有价值的不是彩色果冻外观，而是这三个性质：

- 少量种子能连成一块，也能自然保留大缺口；
- 每个种子可以有不同出生时间，因此不会整圈同时出现；
- 形状数量少时轮廓很清楚，不会产生碎片噪声。

SAKURA 版不能直接画圆球。建议把每个种子改成**沿屏幕法线拉长的椭圆/胶囊场**，并在末端加 1 条短侧枝。种子只放在四边，不沿整圈均匀排布。最后把连续值量化为薄霜、冰体、亮边三档，消除“果冻渐变”感。

建议只用 6–8 个固定种子预计算 mask，而不是每像素实时跑 20 次循环。这样既保留形状优点，也避开不必要的全屏 ALU 成本。

### 2. Andrea Riccardi：最适合解决“怎么长出来”

原 shader 把一张 MixMap 的 RG 作为 normal、B 作为 density、A 作为 gradient，并用 `_Amount` 与 `_Steepness` 控制冻结推进；只有结冰区域才偏移场景 UV，模拟冰面折射：[FreezePostProcess.shader](https://github.com/a-riccardi/shader-toy/blob/master/ShaderToy/Assets/FreezePostProcess/Shaders/Git/FreezePostProcess.shader)。仓库本身采用 MIT：[LICENSE](https://github.com/a-riccardi/shader-toy/blob/master/LICENSE)。

它适合借两点：

1. 外部只有一个进度，内部再映射 birth、coverage、亮边和折射；
2. 屏幕效果所需数据职责明确，不让一张噪声同时充当形状、厚度、法线和颜色。

但不能直接搬：仓库中只有 shader，没有 `_MixMap`、`_IceTex`、`_NoiseTex` 素材；`ice_tiler` 还注明来自 Iñigo Quílez。V3 应生成自己的小型 mask，不复制贴图和这段函数。

### 3. Canvas UI Frost：最完整，但应降级为视觉参考

作者 Demo 将其描述为覆盖在实时页面上的冰层，可由鼠标融出洞并重新冻结：[在线 Demo](https://canvasui.dev/docs/components/frost)。原始 `FrostVanilla.ts` 明确包含 edge boost、height/noise pass、refraction、highlight、melt 与 grow-from-edges；同时也定义了 512 高度场、1024 噪声纹理和 10 tap blur kernel：[源码](https://github.com/DavidHDev/canvas-ui/blob/main/src/lib/Frost/FrostVanilla.ts)。

因此它证明了“从边缘进入 + 局部厚薄 + 轻折射”在前端是可行的，但完整实现对 SAKURA 有三个问题：

- 写实磨砂和细颗粒过多，会盖掉低模卡通语言；
- 多 pass、WebGL2 和大纹理不值得为一次技能引入；
- 许可证是 MIT 加 Commons Clause，允许作为应用的一部分使用，但禁止销售、再授权或重新分发组件本身及其移植版：[LICENSE](https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md)。这不是标准 OSI 开源许可证。

结论：只把 Demo 当作“冰层响应与恢复速度”的参考，不复制组件代码，不安装包。

### 4. frost-reveal：只借遮罩预算

原 WebGL renderer 把交互 mask 放在半分辨率 Canvas，DPR 默认封顶为 2，并以 `LINEAR` 过滤上传纹理：[webgl-renderer.ts](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/src/core/webgl-renderer.ts)。fragment shader 只是把清晰背景、白色霜层和冷凝图片按 mask 混合：[shaders.ts](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/src/core/shaders.ts)。仓库为 MIT：[LICENSE](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/LICENSE)。

V3 比它还能更轻：冰箱是自动时间线，不需要鼠标擦除，所以 mask 可在启动或进入测试时生成一次，之后每帧只更新一个进度 uniform，不重复上传纹理。

### 5. phase-transition：有 Three.js 价值，但视觉方向应排除

作者 README 明确说明它是 Three.js 球体冰 shader，使用程序生成的等距柱状纹理、视差映射和顶点位移，并附在线 Demo：[README / Demo](https://github.com/robert-leitl/phase-transition)。核心 shader 同时计算多组 3D Voronoi、FBM、位移和 normal，FBM 循环上限达到 25：[texture.frag.glsl](https://github.com/robert-leitl/phase-transition/blob/main/src/app/shader/texture.frag.glsl)。

可以借“mask/normal 分开输出”的工程观念，但不可借最终纹理。它会把屏幕重新带回密集、碎裂、晶格化的方向，且性能远超本技能需要。

## 明确排除的路线

| 路线 | 排除原因 |
|---|---|
| Material Maker Crystal、Worley / Voronoi 冰片 | 即使许可证可用，也会重新出现方砖、蜂窝、密集接缝和玻璃碎片感 |
| `phase-transition` 完整 shader | 多组 3D Voronoi、最高 25 层 FBM、视差、位移和 bloom 对全屏技能过重 |
| 厚重 `MeshPhysicalMaterial` 套管 / 高 transmission | 会制造规则玻璃管或糖葫芦轮廓；当前仅保留低透明度、轻微外扩的薄壳 |
| Canvas UI Frost 完整移植 | 写实、多 pass、纹理较大，且 Commons Clause 对组件再分发有限制 |
| frost-reveal 的冷凝图片 | 图片质感偏浴室玻璃；素材授权和风格都不如程序生成 mask 稳妥 |
| Shadertoy 未标明独立许可证的效果 | 默认展示许可不能自动等同于可复制进项目的代码许可 |
| CSS `backdrop-filter: blur()` | 只能得到磨砂玻璃或白雾，不能形成可控冰舌，也会再次像软边框 |

## 推荐的 SAKURA 视觉规格

### 线缆与插头

- 原线与插头继续向冷青灰变色，并增加沿原造型轻微外扩的透明冰壳；
- 线壳实测不透明度约 62%，线径外扩约原半径的 28%；插头冰壳整体约放大 9.5%；
- 每根线按长度生成 10–18 个确定性随机冰刺，约 72% 为扁片刺，其余为尖刺；
- 冰刺按路径切片后在每片内随机落点，保证头、中、尾都有分布，同时保持尺寸、朝向、尖端偏斜和出现时间不同；
- 冰壳与每根冰刺都使用与家电、线缆一致的墨色外描边，冰刺底座嵌入冰壳而不是贴在壳外；
- 变色、冰壳、外描边和冰刺共用同一个头部到尾部的冻结前沿，不允许分成先后两套动画；
- 原线色向冷青灰混合约 48%–62%，仍能辨认原线路身份色；
- 饱和度降低约 18%–28%，明度提高约 6%–10%；
- 外描边只向深蓝灰轻微偏移，不加白色第二圈；
- emissive 保持为 0，避免读成发光 Buff；
- 插头、线身、尾部使用同一色变，不再分阶段长出物体。

“冰冻”由颜色、轻薄冰壳和冰刺轮廓共同表达；这些几何只承担视觉反馈，不改变碰撞、可抽取判断或玩法状态。

### 屏幕结冰

以 1440×900 测试画面为基准：

- 4–7 个独立生长区，其中 2 个来自角落、2–5 个来自边缘中段；
- 单个主冰舌深入约 70–180 px，最多一个可达到约 220 px；
- 峰值总覆盖 12%–18%，持久态回落到 8%–12%；
- 至少 45% 的屏幕周长始终完全没有冰，保证绝不闭框；
- 中央约 70%×62% 的玩法区设置硬保护，只有冷色，不出现实体冰；
- 每个主冰舌只有 0–2 条短侧枝，不生成密集枝晶；
- 颜色只用三档：深冰青阴面、浅青主体、米白窄亮边；
- 折射上限 0.8–1.5 像素，只在冰体内部使用一次场景采样；
- 不做 RGB 分离、持续闪烁、动态噪声漂移或整屏 blur。

### 生长时间线

继续复用现有冰箱视觉进度，但重新映射屏幕：

| 进度 | 画面 |
|---:|---|
| 0.00–0.16 | 只有非常轻的全屏降温；没有冰纹 |
| 0.16–0.42 | 2–3 个边缘种子先出现，彼此不连接 |
| 0.34–0.78 | 其余冰舌分批向内长；亮边只跟随当前前沿 |
| 0.78–1.00 | 冰体达到峰值，仍保留大缺口和中央清晰区 |
| persistent | 覆盖回落到峰值约 68%–76%，停止生长与闪动 |
| thawing | 冰体按相反 birth 顺序退回，冷色稍后消失 |

## 只在技能测试模式实施的计划

### 阶段 0：建立干净基线

目标是当前测试模式只剩冰冻色：

- 冰箱冻结目标线、插头和尾部只变冷色；
- `iceShellVisible === false`；
- `plugIceShellCount === 0`；
- 雪花、冰块、飞行食物和通用 glow 均为 0；
- `screenEffect.mode === 'none'`。

这一步是后续 A/B 的对照组，不能跳过。

### 阶段 1：做一个可逆的“边缘冰舌”小样

建议新建一个职责单一的屏幕字段，例如 `RefrigeratorEdgeFreezeField`，不要恢复上一版的双 FrostField / Facet 系统。

一张 192×120 的 RGBA8 `DataTexture` 足够：

- R：birth time；
- G：coverage / thickness；
- B：三档色阶编号或局部亮边强度；
- A：保留。

CPU 端只在创建时计算 6–8 个定向 metaball / capsule 场：种子位置、方向、长度和出生时间由固定 seed 决定。最终只上传一次。Three.js `DataTexture` 可直接接收 TypedArray，且默认不生成 mipmap：[r184 源码](https://github.com/mrdoob/three.js/blob/r184/src/textures/DataTexture.js)。

后处理仍使用现有 `FullScreenQuad`，只新增：

- 1 次 mask 主采样；
- 4 次邻域 mask 采样，得到前沿/法线；
- 0 或 1 次额外场景采样做轻折射；
- 1 个 `uFreezeProgress` uniform。

不增加 composer pass，不增加 DOM Canvas，不安装 Paper Shaders 或 Canvas UI。

### 阶段 2：严格限制到冰箱测试模式

接线位置应满足：

- 只有 `mode=skill-test` 且当前 `testId === 'refrigerator'` 才允许把 screen effect 切到新模式；
- 普通技能挑战、随机模式、RUSH、双头线、家电图鉴和其他测试入口不变化；
- 新字段在退出测试、重置或销毁时释放纹理；
- 线缆颜色基线不依赖屏幕效果，低画质或后处理关闭时仍能看出冻结目标。

### 阶段 3：验收后再决定是否进入正式技能

先只产出四张测试截图：

1. 触发前；
2. 约 0.7 秒，确认没有完整框；
3. 约 2.45 秒，确认是少量大冰舌而非碎片；
4. persistent + 旋转视角，确认中央线组和冻结目标仍清楚。

只有用户确认这版形状语言后，才讨论是否把它从测试模式推广到正式技能。不要在小样阶段顺手改其他模式。

## 验收清单

- [ ] 冰壳连续贴合原线与插头，只轻微放大轮廓，不形成粗管或球形串珠；
- [ ] 冰刺以扁片为主，大小、间距、朝向和偏斜明显不同；
- [ ] 屏幕四边不存在闭合轮廓；
- [ ] 画面里能数出少量主冰舌，而不是大量晶片；
- [ ] 没有 Voronoi 方格、蜂窝或规则重复单元；
- [ ] 中央线组可读，UI 完全不受后处理影响；
- [ ] 0.7 秒截图看得到“开始变冷”，但看不到突然出现的白框；
- [ ] persistent 不闪、不漂移、不继续长；
- [ ] 1440×900 下只使用一个小型程序纹理和现有全屏 pass；
- [ ] 改动只在冰箱技能测试模式生效。

## 最终建议

优先做“**Paper Metaballs 形状语法的静态边缘种子 + Andrea 的单进度 coverage + frost-reveal 的半分辨率预算**”。

它不是把三个库装进项目，而是从三个明确许可、可审查的一级来源各借一个经过约束的结构：

- Paper Shaders 负责“不围成框、少量大形状能融合”；
- Andrea 负责“一个进度怎样驱动出生、厚度和轻折射”；
- frost-reveal 负责“小遮罩、低 DPR、一次上传”；
- Three.js r184 负责真正落地。

这样最符合当前 SAKURA：冰是**低模卡通的图形反馈**，不是写实玻璃模拟；冻结线仍是原来的线，只是失去暖色，而不会再变成糖葫芦串。
