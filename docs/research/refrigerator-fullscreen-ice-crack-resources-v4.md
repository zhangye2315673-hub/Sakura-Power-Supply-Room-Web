# 冰箱技能 V4：全屏冰面、裂纹与开源资源接入研究

研究日期：2026-08-18  
范围：只研究冰箱技能测试模式的全屏结冰；不修改运行时代码。只采用原始仓库、作者官方说明、官方资源站与明确许可证。

## 结论先行

这轮不应继续放大现有“几个圆形冰舌”的程序图形。用户要的是一整张贴在镜头前的冰面：

- 四条屏幕边缘连续铺满，角落不能漏空；
- 从边缘向中心逐渐变薄，而不是在中央挖一个矩形透明洞；
- 薄层里仍能看到贯通、分叉、粗细有变化的裂痕；
- 画面保留 SAKURA 的低模、墨线和大色块，不做写实玻璃橱窗；
- 冰层生长时把原有飘落樱花逐步换成雪花，并保留横向冷风和旋转下坠动态；
- 所有效果只在 `mode=skill-test` 且 `testId=refrigerator` 下启用。

最优组合不是安装一个完整组件，而是：

1. **直接采用 Shader Vault / Cracked Ice 的 MIT 多层裂纹贴图**，让裂痕本身来自经过美术设计的纹理，不再用几条 CPU 折线伪装；
2. **采用 `glsl-aastep` 的 MIT 导数抗锯齿方法**，让冰层边界、冻结前沿和裂纹阈值按一个屏幕像素平滑；
3. 冰面厚薄仍用项目现有的四边距离场控制，但改成连续冰膜，不再使用圆形 metaball / tongue 造型；
4. 可从 **ambientCG Ice 001–004 的 CC0 Normal / Displacement** 中 A/B 选一张，只提供大尺度冰面起伏；不直接使用其绿色照片色彩；
5. 保持现有 `skillEffectShader` 的 `uEffect == 7` 单 pass，最多新增一张裂纹纹理和一张可选冰面法线，不引入独立 Canvas、第二个 WebGL context 或完整后处理框架。

如果只做一件外部资源接入，应先接 Shader Vault 的 `ci_cracks.png`。它比继续手写裂纹路径更直接地解决“看起来不像冰面”的核心问题。

本文以用户最新反馈为准，并明确取代 V3 中“边缘必须稀疏、不得闭框、中央不得有实体冰、不得使用照片冰纹”的旧验收条件。V4 要求恰好相反：外围连续铺满，中心只减薄不挖空；来源清楚的 CC0 冰面纹理允许作为法线/位移辅料。

## 当前代码基线与问题定位

截至本研究时，项目使用 Three.js `^0.184.0`，冰箱屏幕效果已经在现有全屏 `skillEffectShader` 中拥有独立的 `uEffect == 7` 分支：

- `src/style/RefrigeratorEdgeFreezeField.ts` 生成程序字段；
- `src/style/post.ts` 在同一个全屏 pass 中采样字段、折射 `tDiffuse`、上冰色并画裂纹；
- DOM HUD 在这个 pass 外，不会被冰层覆盖；
- `src/systems/PetalField.ts` 已经保留雪花几何、雪花实例、冷风横移、旋转下坠，以及 `setColdProgress()` 驱动的樱花到雪花渐变；
- 当前 `Game.ts` 每帧调用 `this.petals.setColdProgress(0)`，所以雪花系统是被关闭，而不是被删除。

旧视觉不成立的根因不是 Three.js 本身，而是输入数据太“程序草图化”：

- 少量圆形/胶囊场天然会读成圆斑和冰舌，无法形成连续冰面；
- 手写折线路径数量有限，重复看几次后会像 UI 装饰线，不像冰内部自然分层的裂隙；
- 低分辨率字段经过阈值后，即便线性过滤也会出现阶梯；
- 中央硬保护区会形成明显的“边框 + 中间挖空”，与“越往中心越薄”相反。

因此 V4 应把职责拆清楚：**距离场负责厚度和生长，外部裂纹资源负责裂隙形态，法线/位移资源负责冰面质感，导数抗锯齿负责边界质量。**

## 推荐优先级

| 优先级 | 一级来源 | 许可证 | 可直接复用 | 对本项目的用途 | 结论 |
|---:|---|---|---|---|---|
| **P0** | [Shader Vault / Cracked Ice](https://github.com/danielpokladek-shaders/cracked-ice)、[作者拆解](https://www.danielpokladek.me/posts/shaders/2026/cracked-ice/)、[在线 Demo](https://danielpokladek-shaders.github.io/cracked-ice/) | [MIT](https://github.com/danielpokladek-shaders/cracked-ice/blob/main/LICENSE) | [`ci_cracks.png`](https://github.com/danielpokladek-shaders/cracked-ice/blob/main/Assets/Project/Textures/ci_cracks.png)、可选 `ci_normal.png` / `ci_roughness.png`，以及 RGB 分层合成思路 | 直接替换手写裂纹折线；一张 RGB 图存三层不同深度裂纹 | **首选，真正能改善造型** |
| **P0** | [stackgl / glsl-aastep](https://github.com/glslify/glsl-aastep)、[核心函数](https://github.com/glslify/glsl-aastep/blob/master/index.glsl) | [MIT](https://github.com/glslify/glsl-aastep/blob/master/LICENSE.md) | `fwidth` / `dFdx` / `dFdy` 决定的单像素平滑阈值 | 抗锯齿冰层前沿、厚薄分界和裂纹，不依赖固定纹理分辨率 | **首选，直接解决锯齿** |
| **P1** | [ambientCG Ice 001](https://ambientcg.com/a/Ice001)–[Ice 004](https://ambientcg.com/a/Ice004)、[官方 API 元数据](https://ambientcg.com/api/v2/full_json?type=Material&category=Ice&limit=50)、[许可证](https://docs.ambientcg.com/license/) | CC0 1.0 | 四套 Color、Displacement、Normal、Roughness；本项目只建议从四套中选一张 Normal 或 Displacement | 给大块冰面增加低频起伏和很轻折射，避免纯平色面 | **可选辅料，需先 A/B、降采样和风格化** |
| **P1** | [Stefan Gustavson / webgl-noise](https://github.com/stegu/webgl-noise)、[2D simplex](https://github.com/stegu/webgl-noise/blob/master/src/noise2D.glsl)、[WebGL Demo](https://stegu.github.io/webgl-noise/webdemo/) | [MIT](https://github.com/stegu/webgl-noise/blob/master/LICENSE) | 无外部查表的 2D simplex / classic / cellular GLSL | 只用于扰动厚度前沿、裂纹 UV 和出生时间，打破笔直边缘 | **支持性算法，不单独承担美术** |
| **P2** | [Robert Leitl / phase-transition](https://github.com/robert-leitl/phase-transition)、[Demo](https://robert-leitl.github.io/phase-transition/dist/?debug=true) | [MIT](https://github.com/robert-leitl/phase-transition/blob/main/LICENSE) | Three.js 程序冰纹、法线输出和状态过渡的工程拆分 | 参考冰纹数据分层，不搬完整 3D Voronoi + FBM + parallax + bloom | **参考，不直接移植** |
| **P2** | [Andrea Riccardi / FreezePostProcess](https://github.com/a-riccardi/shader-toy/blob/master/ShaderToy/Assets/FreezePostProcess/Shaders/Git/FreezePostProcess.shader) | [MIT](https://github.com/a-riccardi/shader-toy/blob/master/LICENSE) | 单一 `_Amount` 驱动 coverage、density、gradient 和局部折射的职责划分 | 核对时间线和数据通道，不直接复制缺失的 MixMap / IceTex | **结构参考** |
| **基础设施** | [Three.js r184 `DataTexture`](https://github.com/mrdoob/three.js/blob/r184/src/textures/DataTexture.js)、[`ShaderMaterial`](https://github.com/mrdoob/three.js/blob/r184/src/materials/ShaderMaterial.js)、[LICENSE](https://github.com/mrdoob/three.js/blob/r184/LICENSE) | MIT | 项目已安装，无需新增依赖 | 继续使用现有纹理、uniform 和全屏 pass | **保留当前管线** |

## P0：Shader Vault 的裂纹资源为什么最合适

Daniel Pokladek 的原始仓库专门实现“平面冰下有多层裂纹”的视觉。作者 README 和官方拆解明确说明：

- 裂纹纹理把三层裂隙打包到 R、G、B 三个通道；
- 原 shader 对三个通道使用不同偏移和权重，使裂纹像位于冰面下的不同深度；
- 最终只需要一张 packed crack texture，而不是三张独立图片；
- 项目根目录声明“除非另有说明，按 MIT 授权”，`Assets/Project/Textures/ci_cracks.png` 没有另行限制；
- 原始 [`CrackedIce.shader`](https://github.com/danielpokladek-shaders/cracked-ice/blob/main/Assets/Project/Shaders/CrackedIce.shader) 很短，方便审查数据职责。

`ci_cracks.png` 当前为 1024×1024、约 1.55 MB 的无损 PNG。项目无需复制完整 Unity 工程，只需评估并导入：

- `Assets/Project/Textures/ci_cracks.png`：优先；
- `Assets/Project/Textures/ci_normal.png`：可选，与 ambientCG Normal 二选一；
- `Assets/Project/Textures/ci_roughness.png`：全屏后处理价值较低，通常不需要；
- `Assets/Project/Textures/ci_diffuse_bw.png`：不建议直接使用，会把作者的明暗风格带进 SAKURA。

### 在全屏后处理里的改写方式

原项目在 3D 表面上根据视线切线方向做 parallax；SAKURA 是固定屏幕 UV，不应机械照搬相机切线计算。推荐：

1. 让单次采样得到 `cracks.rgb`；
2. 用三组权重合成主裂、次裂和深层裂，权重约为 `0.72 / 0.42 / 0.22`；
3. 用冰层厚度控制深度：边缘厚冰里三层都可见，中心薄冰只保留一层较细裂纹；
4. 最多增加一次沿冰面法线的微小偏移采样，制造 0.4–0.8 px 的层间错位；
5. 裂纹必须同时有暗槽和浅色单侧 bevel，避免像悬浮在画面上的黑线；
6. 用冻结 birth 值控制裂纹出现，裂纹只能在已结冰区域出现。

为了保留通道精度，若降采样到 512×512，应继续使用无损 PNG；不建议用有损 JPEG 或低质量 WebP，否则 RGB 通道串色会产生脏边。

### 许可证接入要求

把 MIT 的版权与许可文本保留在项目第三方声明中；若复制或修改 `ci_cracks.png` / shader 逻辑，也应保留来源说明。不要把仓库里的 Unity Packages 和 `Assets/Shared/Materials/Kenney Prototype Textures` 整包搬入——它们与本次效果无关，也会扩大许可证审查范围。

## P0：用 `glsl-aastep` 解决锯齿

`glsl-aastep` 的核心不是一个大型依赖，而是一个很小的 MIT GLSL 函数：根据当前像素的 `dFdx` / `dFdy` 算出阈值跨越一个 fragment 时应有多宽，再用 `smoothstep` 替代硬 `step`。作者 README 明确称其目标是“在任何放大级别得到抗锯齿边缘”。

在 V4 里至少用于三处：

- 冻结前沿：birth 与 progress 的比较；
- 厚冰到薄冰的分档边界；
- 裂纹阈值和裂纹 bevel。

这比单纯把 `DataTexture` 从 192×120 放大更有效。高分辨率只能减少字段像素块，不能保证阈值在不同 DPR 和视口尺寸下仍是一像素平滑。

项目可直接内联并保留 MIT notice，不必安装 npm 包。Three.js r184 默认 WebGL2 路径可使用导数；若保留 WebGL1 降级，需要遵循原项目 README 启用 `GL_OES_standard_derivatives`，或降级为用 `uTexel` 估算固定宽度的 `smoothstep`。

## P1：ambientCG Ice 001–004 如何使用而不变成写实贴图

ambientCG 官方 API 列出 Ice 001、002、003、004 四套 Ice 类 PBR 材质，均提供 Color、Displacement、Normal 和 Roughness；官方许可证页明确所有可下载资产为 CC0 1.0，可修改、商用和随游戏分发，不要求署名。不要预先认定其中一套最合适，应把四张 512 px Normal 做同屏 A/B 后只保留一套。

它适合补充的是“冰面微微不平”，不是决定最终颜色：

- 只取 OpenGL Normal 或灰度 Displacement；
- 降采样至 256×256 或 512×512；
- 采样强度压低到只造成约 0.35–0.9 px 的 UV 折射；
- 颜色继续由 SAKURA 的深冰青、浅冰青和米白亮边控制；
- 不使用原 Color 图，避免绿色写实湖冰盖住游戏画面；
- 不让 normal 持续滚动，持久态必须完全静止。

如果 Shader Vault 的 `ci_normal.png` 已能提供足够起伏，则不再引入 ambientCG，避免两套纹理叠加成脏玻璃。

## P1：webgl-noise 的正确角色

Stefan Gustavson 的 `webgl-noise` 是原始 MIT GLSL 实现，README 明确支持 WebGL 1.0，并包含无需查表纹理的 simplex、classic 和 cellular/Worley noise。

推荐只借 2D simplex 做低幅 domain warp：

- 扰动四边厚度前沿约 2%–5%；
- 扰动裂纹 UV 约 0.5%–1.5%；
- 扰动 birth time，让四边不是同一瞬间整齐推进。

不推荐让 `cellular2D.glsl` 的 `F2-F1` 直接成为最终裂纹。它虽然能生成裂隙，但未经约束会重新出现蜂窝、干裂泥地或规则 Voronoi 格子。只有外部裂纹资源无法通过视觉验收时，才把它作为离线生成候选，并用强 domain warp、非均匀缩放和人工删线打破单元格。

## 现有单 pass 的具体接入方案

### 1. 覆盖和厚度：四边连续，不再画圆形冰舌

用屏幕 UV 到最近边缘的距离作为主变量：

`edgeDistance = min(uv.x, 1-uv.x, uv.y, 1-uv.y)`

再用低频噪声轻微扰动深度阈值。它天然保证四条边和四个角 100% 连续，同时不会出现圆形岛或半圆舌头。

建议最终状态：

- 屏幕最外侧 10%–13% 为厚冰，密度约 0.82–0.96；
- 13%–28% 为过渡冰层，密度连续下降；
- 更靠中心保留约 0.08–0.18 的薄冰膜，不做硬清空；
- 中央 48%×40% 仍能清楚辨认线组，但可看见极淡裂纹和冷色折射；
- `perimeterCoverageRatio` 必须为 1.0 或至少 ≥0.995，不再保留“clear perimeter”指标。

冰面形状应由**距离和厚度**读出来，而不是依靠一圈白色轮廓。角落可略厚，但不能形成四个圆形角块。

### 2. 建议纹理与通道

保留一张程序字段 `uRefrigeratorFrost`：

- R：冰层 thickness；
- G：edge-to-centre birth；
- B：大尺度冰面 tone / facet；
- A：可留给预计算 normal X，或继续作为局部程序辅助，不再手画完整裂纹网。

新增 `uRefrigeratorCracks`，直接使用或降采样自 `ci_cracks.png`：

- RGB：三层裂纹；
- A：不依赖，可为 1。

可选新增 `uRefrigeratorIceNormal`；若测试后差异不明显则删掉，避免为了资源而资源。

### 3. 单 pass 采样预算

推荐持久态每像素：

- 1 次字段采样；
- 1 次 packed cracks 采样；
- 0–1 次 normal / displacement 采样；
- 1 次轻折射后的 `tDiffuse` 采样；
- 如需层间深度，再加 1 次偏移 cracks 采样。

目标是 3–5 次新增纹理读取，而不是引入第二个 blur pass。当前为了从字段梯度重建 normal 的四邻域采样，可在 CPU 预计算 normal 并打包后减少；如果保留四邻域，也应实测低端设备帧时。

### 4. 裂纹应怎样融进冰面

- 裂纹宽度用 `fwidth` 控制，不写死成字段 texel 宽度；
- 主裂约 1.6–2.4 px，支裂约 0.8–1.4 px；
- 裂纹暗槽不要纯黑，使用深蓝灰；
- bevel 只在光源侧出现 0.5–1 px 的淡青白边；
- 中心薄冰的裂纹对比度可以高于薄冰主体，让玩家仍能读到“整个镜头结冰”；
- 最外厚冰处可显示三层 RGB 裂隙，中心只显示主裂；
- 禁止整张裂纹纹理匀速滚动；出生后位置固定。

### 5. 生长时间线

| 冻结进度 | 屏幕表现 |
|---:|---|
| 0.00–0.08 | 只有轻微降温，尚无实体冰 |
| 0.08–0.28 | 四条边连续起霜，角落同步连接；雪花开始替代樱花 |
| 0.22–0.62 | 厚冰向内推进；已经结冰的位置同步出现主裂和局部 bevel |
| 0.52–0.86 | 薄冰膜到达中心；次裂逐步显现，中心仍能看清线组 |
| 0.86–1.00 | 稳定为边厚中薄的完整冰面；纹理、裂纹和折射停止变化 |
| persistent | 不漂移、不闪烁、不继续生成新裂纹；雪花继续按已有风场飘落 |
| thawing | 反向按 birth 退冰，裂纹随所在冰层一起淡出，雪花逐步恢复樱花 |

## 雪花动态无需外部依赖

用户提到的“放技能时樱花变雪花”的那版并未丢失。`PetalField.ts` 已有：

- `createLowPolySnowflakeGeometry()`；
- 独立 `snowMesh`；
- 每个实例不同的 `coldSeed` 和 `snowScale`；
- 樱花缩小、雪花同步长出的交叉渐变；
- 冷风造成的横向阵风、加速下落、Z 方向摆动和旋转；
- 越界后的重新投放。

实施时只需把 `Game.ts` 当前硬编码的 `setColdProgress(0)` 改为冰箱测试模式下的 `environmentAmount`，其他模式继续传 0。不要重新安装粒子库，也不要把雪花放进全屏 shader；真实 3D 实例随镜头和景深运动，更符合现有 SAKURA 场景。

雪花恢复必须与冰层同一时间线：边缘开始起霜时出现，冻结结束后保持，解冻时再逐步回到樱花。不要一次性把 28 个实例全换掉。

## 明确排除项

| 来源 / 路线 | 排除原因 |
|---|---|
| [LYGIA](https://github.com/patriciogonzalezvivo/lygia) 直接复制 | 当前仓库使用 Prosperity Public License 3.0 + Patron License；免费商业用途只有 30 天试用，不适合作为默认可商用依赖。不能把它误写成 MIT。 |
| [Canvas UI Frost](https://github.com/DavidHDev/canvas-ui) 完整组件 | 许可证是 MIT 加 Commons Clause；同时采用 WebGL2、多阶段高度/噪声/blur，写实度和成本都过高。仅看 Demo，不复制组件。 |
| [takuma-hmng8/frozen](https://github.com/takuma-hmng8/frozen) | 虽然是 R3F / WebGL 多 pass 冰霜案例，但仓库当前没有可确认的 LICENSE；许可证不清，不能复制代码或资产。 |
| [Paper Shaders / Metaballs](https://shaders.paper.design/metaballs) | 许可明确，但圆润融合场正是用户已否定的圆块、果冻和冰舌语言；V4 不再把它作为形状来源。 |
| [frost-reveal](https://github.com/kaminidoramawo/oss-frost-reveal) | MIT 且遮罩结构清楚，但最终视觉是白雾/冷凝玻璃，不是有厚度和裂纹的冰面；本轮不再作为美术来源。 |
| Shadertoy 上未附独立许可证的“frozen screen” | Shadertoy 可观看不等于可复制进商业项目；没有作者独立许可就排除。 |
| Pinterest、Freepik、Google 图片、来源不明 PNG | 无法确认原作者和游戏内再分发权，不进入仓库。 |
| 直接把 Voronoi / Worley 当裂纹 | 会变成蜂窝、干泥或规则晶格，与本轮“冰面”目标冲突。 |
| 把 ambientCG Color 直接罩满屏幕 | 原资源偏写实绿色湖冰，会污染 SAKURA 色板；只可用 Normal / Displacement。 |
| `phase-transition` 完整 shader | 多组 3D Voronoi、FBM、parallax、位移和 bloom 对一次屏幕技能过重，也容易产生碎晶片感。 |
| CSS `backdrop-filter` / 整屏 blur | 只能得到磨砂玻璃，不能表达边厚中薄和裂纹层次。 |
| 新建第二个 WebGL Canvas | 增加同步、DPR、层级和销毁复杂度；现有单 pass 已足够容纳资源。 |
| 圆形 metaball / capsule 冰舌 | 这正是当前被否决的造型语言；四边连续冰面应从矩形边界距离生成。 |

## 实施顺序

1. **先恢复雪花路由**：只接回现成 `PetalField.setColdProgress(environmentAmount)`，确认其他模式仍为 0。
2. **把形状基线改成连续冰面**：四边覆盖率达到 ≥99.5%，边厚中薄，无圆形冰舌和中央硬切口。
3. **导入 MIT 裂纹贴图做 A/B**：先只用 `ci_cracks.png`，不要同时加 normal，确认裂纹形态本身成立。
4. **接入 `aastep` / `fwidth`**：在 100%、125%、150% DPR 与 1440×900、1920×1080 下检查锯齿。
5. **必要时加一张冰面 normal**：优先试 Shader Vault 自带 normal；仍太平再对 ambientCG Ice 001–004 的降采样 normal 做 A/B。最终只留一套。
6. **统一时间线**：冰层、裂纹、冷色和雪花同一 progress；persistent 全部静止，只有雪花继续运动。
7. **只在冰箱测试模式验收**：视觉通过后再讨论是否进入正式技能，不顺手改其他技能。

## 验收指标

- [ ] 四条边和四个角连续结冰，`perimeterCoverageRatio >= 0.995`；
- [ ] 边缘明显厚于中心，但中心不是完全清空；
- [ ] 中央线组仍清楚可操作，HUD 完全不受后处理影响；
- [ ] 主裂能跨越厚冰到薄冰，存在自然分叉、粗细和层次变化；
- [ ] 裂纹有暗槽与淡色 bevel，不像悬浮贴纸；
- [ ] 冰面没有圆形舌头、圆斑、蜂窝或规则 Voronoi 格；
- [ ] 1440×900 截图中看不到明显字段台阶；
- [ ] 100%–150% DPR 下边缘保持约一像素平滑；
- [ ] 雪花由樱花逐个渐变出现，保留横风、旋转和加速下坠；
- [ ] persistent 状态冰纹完全静止，雪花可继续飘落；
- [ ] 运行时仍为现有单个 skill-effect pass，不新增第二 WebGL context；
- [ ] 所有新增纹理均有来源、许可证和第三方声明；
- [ ] 非冰箱技能测试模式的 `screenEffect`、petal 和后处理结果不变化。

## 最终推荐

建议 V4 锁定为：

> **连续四边距离场决定“边厚中薄”，Shader Vault 的 MIT packed cracks 决定“像真正冰裂”，`glsl-aastep` 决定“边缘不锯齿”，现有 PetalField 决定“樱花逐步变雪花”。**

这套方案只借外部资源最有价值的部分，不把 SAKURA 变成写实冰箱玻璃，也不需要推翻现有 Three.js 后处理。它把当前最弱的“程序折线和圆形造型”替换掉，同时保留测试模式隔离、低模配色和单 pass 性能边界。
