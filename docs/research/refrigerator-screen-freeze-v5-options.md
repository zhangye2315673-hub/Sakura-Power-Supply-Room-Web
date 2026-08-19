# 冰箱技能 V5：屏幕结冰替代路线研究

研究日期：2026-08-18  
范围：只研究一级来源、许可证和可实施方向；本轮不下载素材，不修改运行时代码。

## 结论先行

当前 V4 的“真实裂纹贴图 + 整屏半透明冰层”应当整体废弃，不再通过调透明度、裂纹粗细或颜色继续修补。截图里最明显的问题有三项：

1. 灰黑裂纹横跨场景与 UI 背景，第一眼像脏玻璃、旧屏幕或划痕，不像正在生长的冰；
2. 大面积浅青半透明层没有清楚的实体轮廓，像低透明度遮罩；
3. 四周的大型斜面之间缺少共同的造型语言，既不像连续冰面，也不像 SAKURA 现有家电、线缆那种低模实体。

本轮一级来源里，没有一个可直接安装、原样使用就能匹配 SAKURA 的“屏幕结冰组件”。最可靠的方向不是继续找一张更好的裂纹图，而是把屏幕冰霜当成一张**带深色描边的低模冰晶插画层**：

- 四边最外侧由一圈很窄、连续但厚薄不等的冰根覆盖；
- 冰根向内长出大小不同的片状晶体、楔形冰块和少量枝晶；
- 中央不铺任何半透明面，只保留轻微冷色；
- 冰的主体用 3–4 档扁平色块，内缘和大晶片有与游戏物体一致的深蓝黑描边；
- 裂纹不再作为整屏纹理。若保留线条，它只能是从冰层内部向内长出的少量细枝，并在进入玩法中心前结束；
- 樱花转雪花继续复用项目已有动态，不需要另装雪花库。

推荐采用本文的 **方案 A：手工构图的矢量低模冰晶边框**。它是三套方案中最容易控制造型、最接近 SAKURA、性能最稳定、也最不可能再次变成“脏玻璃”的路线。

## 本轮硬性淘汰条件

只要出现下面任意一项，候选效果就不再进入实现：

- 摄影冰纹、玻璃划痕、冷凝水、脏玻璃贴图；
- 横跨中央玩法区的粗裂纹或灰黑线网；
- 整屏统一 alpha 的浅蓝/白色遮罩；
- 大片圆斑、软圆 metaball、泡沫边或水滴边；
- 由低分辨率 mask 直接放大造成的台阶和锯齿；
- 规则六角雪花沿边缘等距复制；
- 细碎 Voronoi 蜂窝、玻璃碎片或高频噪点；
- 需要第二套 WebGL renderer、持续多 pass 模拟或大纹理上传，才能得到基本外观；
- 冰层覆盖按钮与文字，使测试模式无法读图和操作。

## 候选总表

| 候选 | 一级来源与许可证 | Demo 可见特征 | SAKURA 判断 | 接入与性能 |
|---|---|---|---|---|
| **ChristmasArt / Snow Crystal Growth** | [作者 Demo](https://localhost-four.github.io/ChristmasArt/crystalGrowth.html)、[作者源码](https://github.com/localhost-four/ChristmasArt/blob/main/crystalGrowth.html)、[Apache-2.0 许可证](https://github.com/localhost-four/ChristmasArt/blob/main/LICENSE) | 原生 Canvas 在 150×150 六边格上连续长出六向实体枝晶；本轮实开 Demo 可见晶片从中心形成主枝和侧枝，而不是突然显示一张裂纹图 | **中高，只借生长骨架**。其枝晶形状适合冰霜，但原版中心放射雪花和点状网格锯齿不适合直接贴屏；必须改为四边播种并转成平滑矢量路径 | 中。150² CPU 模拟可用，但不能放大到全屏逐像素；适合 128–256 px 离屏生成一次并缓存 |
| **Game-icons 冰系 SVG** | [官方冰标签页](https://game-icons.net/tags/ice.html)、[作者仓库](https://github.com/game-icons/icons)、[官方许可说明](https://game-icons.net/about.html)；CC BY 3.0，可商用但必须署名 | 53 个黑白矢量冰图标；`icicles-aura`、`frozen-ring`、`ice-bolt`、`snowflake-1` 等都有明确黑色轮廓和大块白色负形 | **高**。不是直接拿整枚图标铺屏，而是借/改少量楔形、冰刺和枝晶片段，最接近项目的粗描边插画语言 | 低。SVG 可在构建时转为 Path2D/Canvas mask；几十个 path 没有明显运行时压力 |
| **Paper.js Boolean Operations** | [官方 Boolean Demo](https://paperjs.org/examples/boolean-operations/)、[Path Intersections](https://paperjs.org/examples/path-intersections/)、[作者仓库](https://github.com/paperjs/paper.js)、[MIT 许可证](https://github.com/paperjs/paper.js/blob/develop/LICENSE.txt) | Demo 可见矢量形状的联合、相交、差集和清晰曲线；结果是可描边的真实路径，不是像素雾层 | **高**。适合把三角/楔形冰片与四周冰根合并成连续轮廓，同时保留硬角；不能使用 smoothing 把形状重新磨圆 | 中。建议只在生成小样或进入测试时计算一次，随后缓存为 SVG/Canvas；不应每帧跑布尔运算 |
| **D3 Contours** | [官方文档与交互例子](https://d3js.org/d3-contour)、[作者仓库](https://github.com/d3/d3-contour)、[ISC 许可证](https://github.com/d3/d3-contour/blob/main/LICENSE) | 官方例子把标量网格转换为连续的 MultiPolygon 等值线；边界连贯，不会把低分辨率格子直接显示为锯齿 | **中高**。可把四边种子场变成一条连续但深浅不同的内缘；必须再用直线化/角点保留，不能沿用默认的圆滑等值线外观 | 低—中。128×80 或 192×120 字段在启动时计算一次即可；之后只绘制缓存路径，几乎无每帧成本 |
| **Three.js SobelOperatorShader** | [官方 Demo](https://threejs.org/examples/?q=sobel#webgl_postprocessing_sobel)、[官方 shader 源码](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/SobelOperatorShader.js)、[MIT 许可证](https://github.com/mrdoob/three.js/blob/dev/LICENSE) | Demo 可见稳定、清楚的屏幕空间轮廓，不靠纹理里的黑边 | **高，但只能做描边辅件**。可对冰晶自己的 alpha mask 求边缘，得到与家电近似的深蓝黑轮廓；不能对整个场景再次 Sobel，否则 UI 和背景都会变脏 | 低—中。标准 Sobel 是 3×3 九次采样；只对一张小型冰晶 mask 或预烘焙一次更合适 |
| **PixiJS OutlineFilter** | [官方 API](https://pixijs.io/filters/docs/OutlineFilter.html)、[官方示例](https://pixijs.io/examples/#/filters-basic/outline.js)、[原始实现](https://github.com/pixijs/filters/tree/main/src/outline)、[MIT 许可证](https://github.com/pixijs/filters/blob/main/LICENSE) | Demo 可见 sprite 外围形成宽度、颜色可控的完整描边；源码还暴露 `thickness` 与 `quality` | **高，但不应引入 Pixi renderer**。它证明 alpha 轮廓可以有稳定粗细，适合借采样思路重写到现有后处理或离线 Canvas | 中。另开 Pixi/WebGL 上下文不值得；借算法或预烘焙描边则成本低。高 quality 会增加采样数 |
| **Vivus SVG path drawing** | [作者 Demo](https://maxwellito.github.io/vivus/)、[作者仓库](https://github.com/maxwellito/vivus)、[MIT 许可证](https://github.com/maxwellito/vivus/blob/master/LICENSE) | Demo 提供 delayed、sync、one-by-one 三种路径逐笔画出动画，线不是整体淡入 | **中高，用于枝晶动态**。适合让细小霜枝从边缘向内“长出来”；不适合承担有厚度的冰体 | 低。少于约 60–100 条短 path 时 DOM/SVG 开销很小；路径过多会增加布局和样式更新，不应生成几千条 |
| **Johnny Awesome DLA / p5.js** | [作者仓库与 GIF](https://github.com/johnnyawesome/DiffusionLimitedAggregation)、[MIT 许可证](https://github.com/johnnyawesome/DiffusionLimitedAggregation/blob/main/LICENSE) | README 的 GIF 清楚展示随机游走粒子粘到冻结种子后，树枝状结构逐步增生；枝杈大小和方向不完全一致 | **中，仅适合生成枝晶骨架**。随机性自然，但原始结果像珊瑚/雷击且太稀疏；不能直接当整圈冰层 | 中—高。随机 walker 实时模拟的帧率较差；只适合离线/启动时生成少量种子并缓存，或重写成确定性的近似生长 |
| **Coding Train / Brownian Snowflake** | [官方源码](https://github.com/CodingTrain/Coding-Challenges/tree/main/127_Snowflake_Brownian/P5)、[官方 p5.js Demo](https://editor.p5js.org/codingtrain/full/SJcAeCpgE)、[官方演示视频](https://www.youtube.com/watch?v=XUA8UREROYE)、[MIT 许可证](https://github.com/CodingTrain/Coding-Challenges/blob/main/LICENSE) | Brownian/DLA 粒子附着后做六向镜像；Demo 的生长方向和尖锐分叉很清楚 | **中，仅适合少量突出枝杈**。必须取消六向镜像和中心放射，改成四边朝中心附着，否则又会得到用户否定的圆形/放射构图 | 中。逐粒子碰撞接近 O(n²)，不适合高密度全屏实时运行；只可低分辨率预生成或固定几张 mask |
| **Crystal Growth Simulator** | [作者 Demo](https://baditaflorin.github.io/crystal-growth-simulator/)、[作者仓库](https://github.com/baditaflorin/crystal-growth-simulator)、[MIT 许可证](https://github.com/baditaflorin/crystal-growth-simulator/blob/main/LICENSE) | 384² phase-field 模拟，官方界面提供 Snow、Dendrite、Coral 与 anisotropy 等参数；晶体前沿连续、分叉自然 | **中高，适合参考各向异性，不适合整包接入**。形状比随机裂纹合理，但原版渐变发光偏科幻，必须压成 3–4 档平涂并只描主体轮廓 | 高。主要路径为 WebGPU/WGSL，另有 CPU fallback 与 Three.js DataTexture；直接接入会带来兼容分支，只宜借方程和参数关系 |
| **Linus Mossberg Reaction-Diffusion** | [作者 Demo](https://linusmossberg.github.io/reaction-diffusion)、[作者仓库](https://github.com/linusmossberg/reaction-diffusion)、[MIT 许可证](https://github.com/linusmossberg/reaction-diffusion/blob/master/LICENSE) | 官方截图和 Demo 可见指纹、虫形、迷宫、波纹、撕裂等连续演化纹样 | **低，作为反例更有价值**。它能连续生长，但多数参数会像细菌、霉菌或黏液，不像硬冰晶，也很难维持 SAKURA 的大块低模轮廓 | 高。需要 WebGL ping-pong render target 和每帧多次迭代；为一次测试技能引入不划算 |
| **Stefan Gustavson / psrdnoise** | [作者 Demo/教程](https://stegu.github.io/psrdnoise/)、[作者仓库](https://github.com/stegu/psrdnoise)、[MIT 许可证说明](https://github.com/stegu/psrdnoise#license) | 周期 Simplex Flow Noise，支持解析导数、旋转梯度和无缝平铺；Demo 可见连续方向场和不重复扰动 | **中，只能作为修边辅料**。适合让冰层前沿和晶面厚度不机械；单独显示会重新变成云雾、果冻或水流 | 低。兼容 WebGL 1.0、单 pass、无外部纹理；只需一层低频扰动，不能把噪声当主体 |

## 候选细看

### 1. ChristmasArt：最值得借的“结冰生长”算法，但不能直接用它的画面

`ChristmasArt/crystalGrowth.html` 是一个单文件原生 Canvas 实现，使用 150×150 六边形网格更新雪晶状态。作者 Demo 能看到中心雪晶逐步形成六条主枝、片状主体和不完全相同的侧枝，因此它表达的是“晶体长出来”，不是把预制裂纹贴图渐显。

本轮已经实际打开 Demo 核查。它不能原样用在项目里：

- 默认只有一个中心种子，最终读成标准六角雪花，不是屏幕边缘结冰；
- 150² 六边格以点状像素显示，轮廓仍有明显锯齿；
- 紫白渐变和纯深蓝背景不属于 SAKURA 的色板；
- 六向对称如果完整保留，仍会形成用户不想要的圆形/放射构图。

它真正值得借的是**每个 cell 有出生先后，主体和侧枝在同一生长过程中形成**。V5 可把中心种子改成四边 18–26 个不对称种子，只读取其最终 occupancy 和 birth time；随后用 contour/矢量路径重新构造轮廓、删掉网格台阶，再套 SAKURA 的平涂与描边。它只为方案 A 生成 6–10 条次级枝晶骨架，不决定整圈冰体的主体剪影。

### 2. Game-icons：最接近 SAKURA 的现成造型语言

Game-icons 官方冰标签页提供 53 个 SVG/PNG 冰相关图形，并明确标注 CC BY 3.0。其官方 About 页说明可以自由使用和编辑，但必须给原作者署名。可重点查看：

- [Lorc / Icicles Aura](https://game-icons.net/1x1/lorc/icicles-aura.html)：环绕主体的大、小尖冰片，适合参考边缘冰片的疏密；
- [Delapouite / Frozen Ring](https://game-icons.net/1x1/delapouite/frozen-ring.html)：连续冰环与内缘不规则冰片，适合参考“连续但不是等宽框”；
- [Lorc / Ice Bolt](https://game-icons.net/1x1/lorc/ice-bolt.html)：几块方向一致但大小不同的尖楔，适合角落主晶体；
- [Lorc / Snowflake 1](https://game-icons.net/1x1/lorc/snowflake-1.html)：粗线、明确分叉、较少细节，适合拆成局部枝晶，而不是整枚复制。

它们与 SAKURA 的共同点不是“冰”这个题材，而是**大块黑白关系、明确剪影和粗外轮廓**。如果以后直接采用 SVG 路径，必须保留版权说明；如果只把它们作为构图参考，则应重新绘制自己的楔形和枝晶，避免近似复制。

### 3. Paper.js：适合把许多冰片真正合成一个整体

当前 V4 的冰片像一层层面片压在画面上，却没有一个共同的实体内缘。Paper.js 官方 Boolean Operations Demo 展示了 `unite`、`intersect`、`subtract` 等路径运算；Path Intersections Demo 展示了精确路径交点。它可用于：

1. 先画四条很窄的不规则冰根；
2. 把 35–55 个不等边三角形、梯形和扁楔形冰片与冰根做 union；
3. 对中央玩法区做 subtract，保证任何冰体都不能越界；
4. 最后得到一条可以统一填色、描边和裁切的路径。

这会从结构上解决“冰刺悬空/面片互不相干”的同类问题。风险是 Paper.js 的平滑工具很容易把轮廓磨成软圆形，因此 V5 只用布尔运算与少量角点简化，不做自动 smoothing。

### 4. D3 Contours：适合解决连续覆盖与锯齿，但不是最终美术

D3 Contours 官方说明它能根据规则网格生成等值 MultiPolygon，并在边界处插值。它适合用来确定“屏幕四边是否真的连续覆盖”和“向内厚度是否有自然变化”，再把等值线转为低模直线段。

建议字段不是噪声图，而是由 20–28 个边缘定向楔形种子叠加得到：

- 四边最外 8–18 px 始终为实冰；
- 种子主要沿屏幕法线向内，长度 35–125 px；
- 角落可有 1–2 个更深的主晶体，但不超过 150 px；
- 生成 contour 后保留曲率变化大的角点，再把其余边界简化为长直面。

这样 D3 只负责“连成整体”和抗锯齿，不负责画噪声、裂纹或透明玻璃。

### 5. Three.js Sobel / Pixi Outline：描边应来自 alpha 轮廓，不应画在贴图里

Three.js 官方 Sobel Demo 与 PixiJS OutlineFilter 都证明了同一件事：描边可以从目标自身的 alpha/亮度轮廓计算，而不必把黑边预画进一张会被放大、滤糊的纹理。

对本项目更合适的用法是：

- 冰晶层先得到干净的二值或高分辨率 alpha；
- 只对冰晶 alpha 做 1.5–3.5 px 的向外/向内边缘采样；
- 输出深蓝灰 `#30354b` 一类的描边色；
- 主体填充再盖在描边上；
- 内部晶面分界只用更细、更浅的 0.8–1.4 px 线，不做整屏 Sobel。

不建议安装 PixiJS。项目已经有 Three.js 后处理，V5 只需借 OutlineFilter 的 alpha 邻域思想，或直接把描边预烘焙进 Canvas。若全屏实时使用标准九采样 Sobel，虽然仍可承受，但没有必要。

### 6. Vivus：适合“长霜枝”，不适合“淡入裂纹”

Vivus 的官方 Demo 重点是 SVG 路径随时间真正从起点画到终点，而不是整条线同时改变 opacity。这正好可以纠正 V4 裂纹“整张贴图一起出现”的问题。

若采用矢量边框，枝晶应满足：

- 所有枝晶起点都嵌在已有冰体内部；
- 主枝朝屏幕中心，但长度只到边缘过渡区；
- 每条主枝最多 2–4 个侧枝；
- 主枝先长，侧枝晚 80–180 ms；
- 线条颜色是浅青/米白高光或深蓝细缝，不能是灰黑脏裂纹；
- 枝晶出现区域同步有冰体或冰根，不允许线条悬在透明画面上。

实现时甚至不必安装 Vivus；`stroke-dasharray` 与 `stroke-dashoffset` 就能完成同类动画。Vivus 的价值是其官方 Demo 清楚展示了可用的时序模式。

### 7. DLA：最像自然枝晶，但必须被艺术约束

Johnny Awesome 的 MIT 示例把粒子粘附过程和最终分叉结构完整展示在 README GIF 中。它能产生比手写随机线更自然的分叉，但原始结果有两个不适合本项目的特征：

- 从单一点向四周增长，容易变成雷击、珊瑚或神经元；
- 细枝远多于主体，无法单独表达“屏幕周围被冰覆盖”。

如果采用，只能将多个种子放在四边，让 walker 从中心侧向边缘吸附；结果还要经过删枝、加粗和路径简化。它适合提供 10%–20% 的枝晶细节，不适合决定整体轮廓。

### 8. Crystal Growth Simulator：形状参考价值高，运行架构不合适

该作者 Demo 使用 384² phase-field 晶体生长，并提供 Snow、Dendrite、Coral 预设以及 anisotropy、undercooling、diffusion、mobility、noise 等参数。它的价值在于证明“各向异性”能够控制晶体优先沿少数方向形成明确主枝，而不是向四周随机冒噪点。

不建议直接引入：主要计算路径是 WebGPU/WGSL，项目目前的 Three.js/WebGL 管线若接入它，会增加一套兼容分支；CPU fallback 又要反复扫描约 14.7 万格。V5 只需借它的参数关系来决定枝晶方向和分叉概率，不能复制其渐变发光视觉，也不需要持续运行完整 phase-field。

### 9. psrdnoise：轻量修边可以，单独做主体不可以

Stefan Gustavson 与 Ian McEwan 的 psrdnoise 为 WebGL 1.0 提供周期 Simplex Flow Noise、旋转梯度和解析导数，MIT 许可明确。它比外部噪声贴图更干净，也没有素材拼接问题。

但它只能在最终冰晶轮廓上产生约 2–6 px 的局部厚薄变化，或给少数晶面一个固定的深浅偏移。禁止将其直接显示成全屏流动噪声，禁止用 noise 同时决定主体、裂纹、法线和颜色，否则会再次变成云雾/果冻滤镜。

### 10. Reaction-Diffusion：有连续生长，但风格风险最高

Linus Mossberg 的官方 Demo 很完整，MIT 许可也清楚，但其 presets 明确包含 fingerprints、spots and worms、maze、oil spill 等视觉。它可以连续从边缘发展，却很难稳定地产生硬朗冰晶；参数一旦变化就会出现细菌、霉菌、指纹或黏液观感。

它还需要持续 ping-pong 模拟。对一个只在冰箱技能测试模式出现的效果而言，性能和调参风险都不划算。因此本文保留它作为“动态真实但美术不合适”的反例，不推荐实现。

## 三套互斥视觉方案

### 方案 A：手工构图的矢量低模冰晶边框（推荐）

**主体**

- 不使用任何裂纹或冰面摄影纹理；
- 以 Game-icons 的粗轮廓冰系图标作为形状语言参考，重新绘制 4 组角落晶体和 8–12 组边缘晶体；
- 用 Paper.js 或等价 Path2D 布尔逻辑，把所有晶体与窄冰根合成一个整体；
- ChristmasArt 的 Reiter 六边格算法只生成 6–10 条次级枝晶骨架；骨架必须被轮廓化、删枝并嵌回有色冰体，原始点阵不直接显示；
- 主体使用深冰青、浅冰青、奶白高光、蓝灰阴面四档平涂；
- 内缘使用 2.5–4 px 深蓝黑描边，内部大晶面用 0.8–1.4 px 细线；
- 只有边缘过渡区存在少量枝晶，使用 Vivus 同类的路径逐笔生长时序。

**画面范围**

- 100% 屏幕周长都接触一层 8–18 px 的窄冰根，满足“四周全部铺上”；
- 大多数区域向内 35–85 px；
- 角落主晶体和少数边缘峰值可达到 110–150 px；
- 中央至少 68%×60% 的玩法区完全没有冰体、裂纹或 alpha 遮罩；
- UI 层保持在冰晶层上方，按钮和文字不被盖住。

**动态**

1. 0.00–0.18 s：场景轻微降温，樱花开始分批变雪花；
2. 0.12–0.55 s：四角和四边的窄冰根分段连接，不是整框瞬间淡入；
3. 0.28–1.20 s：大晶片按边缘种子逐组向内长；
4. 0.55–1.55 s：已有冰体里的细枝才继续延伸；
5. persistent：冰体完全静止，只保留雪花飘落，不让纹理持续游动。

**为何不会再像 V4**：主体是有明确深色内缘、平涂晶面和实体剪影的矢量冰层；透明画面上不存在任何独立裂纹，中央也没有半透明覆盖。Reiter 生长只决定冰体内部的局部枝晶出生顺序，不会输出一张灰黑线网。四周通过窄冰根连续，向内的晶片却有明显长短变化，所以也不是等宽冰框。  
**优点**：最可控、最清楚、最符合低模描边风格；一次确认后不会因随机 seed 变形；Canvas/SVG 抗锯齿优于低分辨率 DataTexture。  
**缺点**：需要一次真正的美术构图，而不是只写一个 shader 参数；但这是当前问题无法继续靠程序噪声解决的核心原因。

### 方案 B：DLA 枝晶生长边框

**主体**

- 四周只有一条很窄的实冰根；
- 主要视觉由 12–20 个边缘 DLA 种子长出扁平枝晶；
- 枝晶经过删枝、加粗和角点化，再加统一深色描边；
- 不使用手工冰片组，也不使用 contour 大面积实体。

**优点**：生长过程最自然，每次看起来都像冰真的沿表面结晶。  
**缺点**：容易过细、过稀疏、像雷电或珊瑚；若加粗过多又会变成树根。实时随机 walker 性能不稳定，必须预生成并固定 seed。它满足“霜花”，但不如方案 A 能明确表达“屏幕四周有一层冰面”。

### 方案 C：D3 / Reaction-Diffusion 连续蕾丝冰边

**主体**

- 用低分辨率反应扩散或定向标量场生成连续边缘；
- D3 contour 提取内缘，再用矢量填充和描边；
- 不采用手工冰片、不使用 DLA 骨架。

**优点**：四周容易保持连续，形状每次可自动适配分辨率。  
**缺点**：即使最后矢量化，底层模式仍容易像指纹、虫纹、蕾丝或霉菌；算法参数与性能都比方案 A 更难控制。它比 V4 的脏玻璃好，但仍不是最稳妥的 SAKURA 方向。

## 推荐方案 A 的下一步实施顺序

用户确认视觉方向前，不应再修改后处理 shader。建议下一步只做视觉小样：

1. 先用已经撤掉 V4 后的干净 1440×900 冰箱测试截图作为底图；
2. 在独立研究页/图片中制作 **720×450 的可逆低分辨率小样**，以 2× Canvas 或 SVG 渲染后缩放，确保观察到的是抗锯齿后的真实轮廓；不安装 npm 包，不碰游戏入口；
3. 第一张只画静态 100% 方案 A：窄冰根、角落主晶体、边缘晶体、描边和四档色块。暂时不加枝晶、不加雪花，先确认主体不再像框或遮罩；
4. 主体确认后，再基于同一组矢量路径输出约 35%、70%、100% 三个出生阶段；不同阶段用 path clip/reveal，不重画三套不同造型；
5. 第三步才加入 6–10 条 Reiter 枝晶骨架和现有樱花转雪花，核对它们是否从实体冰里长出，而不是悬在画面上；
6. 让用户只判断四件事：冰层厚度、角落主晶体大小、描边粗细、中心侵入距离；颜色和速度留到形状通过后再调；
7. 静态/低分辨率样片确认后，再接入冰箱技能测试模式的进度；
8. 最后才决定用 DOM SVG、CanvasTexture 还是现有 Three.js 后处理采样。优先选择能让 UI 始终在上方且不增加第二渲染器的结构。

这套样片是可逆的：它只是一张独立覆盖图和参数清单，删除样片不会影响运行时代码。若第一张静态主体仍不像冰，可以直接调整矢量构图，不需要再次经历 shader、构建和浏览器测试循环。

## 视觉验收线

- [ ] 当前 V4 的裂纹贴图、灰黑划痕和整屏浅蓝遮罩完全消失；
- [ ] 四周都有连续窄冰根，但内缘厚度明显不同，不是矩形边框；
- [ ] 远看首先读成带深色描边的冰晶实体，而不是玻璃滤镜；
- [ ] 主形为不等边三角、扁楔、梯形和短枝，没有圆斑和泡沫边；
- [ ] 中央玩法区没有透明面、粗裂纹或灰线，线组与冰箱保持清楚；
- [ ] 描边粗细接近线缆/家电外描边，且所有晶片与冰根连为一体；
- [ ] 细枝只从已有冰体生长，不能悬空；
- [ ] 100% 覆盖态没有明显像素台阶或锯齿；
- [ ] 樱花转雪花与冰根、冰片、枝晶共用同一冻结时间线；
- [ ] 效果仍严格限制在冰箱技能测试模式，线缆冰壳和冰刺不再修改。
