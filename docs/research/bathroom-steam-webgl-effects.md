# 浴室蒸汽 / 磨砂凝露 WebGL 效果研究

更新时间：2026-08-14  
范围：`arrow-cube` 当前 vanilla Three.js + 自研 `FullScreenQuad` 后处理管线。只研究，不改运行时代码。

## 先给结论

当前问题不是“模糊半径还不够”，而是画面里只有**均匀模糊**，缺少浴室玻璃最关键的三层视觉信息：

1. **磨砂层**：不均匀、乳白、局部浓淡不同的凝露膜；
2. **折射层**：水滴内部短距离扭曲背景，水滴边缘有明暗，不是透明圆点；
3. **运动层**：少量大水滴从顶部和左右上缘缓慢下滑，拖出较清晰的湿痕，随后重新起雾。

最推荐的方案不是引入一整套新后处理框架，而是：

- 保留项目现有的低分辨率双向模糊；
- 以 **SardineFish/raindrop-fx** 作为成品视觉与渲染蓝本，参考其宽模糊、雾层累积、水滴法线和背景折射；
- 参考 **Codrops RainEffect** 的水滴状态、合并和拖尾机制；
- 参考 **frost-reveal** 的低分辨率遮罩思路，用一张动态 `CanvasTexture` / `DataTexture` 表达凝露浓度和水滴湿痕；
- 在现有最终 `FullScreenQuad` 合成 shader 中，用 **stegu/webgl-noise** 的轻量噪声打破均匀模糊，并依据水滴法线做局部折射；
- 不安装 `postprocessing`，它适合作为性能和结构参考，但当前项目已经拥有同类型管线。

这样画面仍能看见线束的颜色块和大概走向，但插头边界、线的交叠位置和精确可抽判断会被磨砂层及局部折射破坏。水滴只作为边缘动态线索，不要铺满全屏。

## 与当前实现的关系

当前 `src/style/post.ts` 已经具备：

- `FullScreenQuad`；
- 两个蒸汽专用低分辨率 RenderTarget；
- 约 28% 分辨率的水平、垂直双向模糊；
- 最终全屏技能合成 pass；
- 蒸汽开关与完整 dispose 路径。

因此最小改造不是换框架，而是在现有结构上增加一张低分辨率凝露/水滴纹理，并把目前的正弦“云雾”改为基于遮罩的三路混合：

```text
清晰场景纹理 ─┐
               ├─ 凝露遮罩控制混合 ─ 局部水滴折射 ─ 乳白磨砂合成 ─ 屏幕
低分辨率模糊 ─┘                    ↑
                         动态水滴法线 / 湿痕纹理
```

## 候选对比

| 候选 | 许可证 | 能直接借什么 | 集成难度 | 性能风险 | 结论 |
|---|---|---|---|---|---|
| [SardineFish/raindrop-fx](https://github.com/SardineFish/raindrop-fx) | MIT | WebGL2 雾层、宽模糊、水滴法线、背景折射、重力、拖尾和合并 | 中—高 | 中 | **最推荐的成品蓝本**；移植算法，不直接并行启动另一套 renderer |
| [Codrops RainEffect](https://github.com/codrops/RainEffect) | 仓库 README 为 Codrops 使用条款；Codrops 当前许可页称下载 Demo 默认 MIT，存在年代差异，采用前需保留声明并按较严格条款处理 | 水滴生成、重力、合并、拖尾、小水珠层、清除轨迹、法线/厚度驱动折射 | 中 | 中 | **最推荐的动态水滴参考**，移植机制，不整包照搬 |
| [frost-reveal](https://github.com/kaminidoramawo/oss-frost-reveal) | MIT | 半分辨率遮罩、凝露纹理、WebGL/Canvas 双路径、遮罩上传与软边笔刷 | 中 | 低—中 | **推荐遮罩结构**；不能直接当 Three.js 场景模糊器 |
| [Three.js 官方 ShaderPass + Blur Shader](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/postprocessing) | MIT | 标准全屏 shader pass、9-tap 横/纵 Gaussian blur、资源释放方式 | 低 | 低—中 | 当前实现已接近它；保留作为模糊基础，不是完整蒸汽效果 |
| [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | Zlib | 半分辨率 Kawase blur、纹理合成、Effect 合并和性能做法 | 中—高 | 低—中 | **只参考，不建议现在整包接入**，会与现有管线重叠 |
| [stegu/webgl-noise](https://github.com/stegu/webgl-noise) | MIT | 无纹理的 2D simplex / psrdnoise，做缓慢变化的凝露厚度和边缘破碎 | 低 | 低—中，取决于 octave 数 | **推荐局部内联一个轻量函数**，只做非均匀遮罩 |

## 1. SardineFish/raindrop-fx：最接近目标的 WebGL2 成品

源码与 Demo：

- [GitHub 仓库](https://github.com/SardineFish/raindrop-fx)
- [作者 Demo](https://sardinefish.github.io/raindrop-fx/)
- [水滴模拟器](https://github.com/SardineFish/raindrop-fx/blob/master/src/simulator.ts)
- [水滴渲染与管线](https://github.com/SardineFish/raindrop-fx/blob/master/src/renderer.ts)
- [雾层 shader](https://github.com/SardineFish/raindrop-fx/blob/master/src/shader/bg-mist.glsl)
- [水滴 fragment shader](https://github.com/SardineFish/raindrop-fx/blob/master/src/shader/raindrop-frag.glsl)
- [背景 blur shader](https://github.com/SardineFish/raindrop-fx/blob/master/src/shader/blur.glsl)
- [MIT License](https://github.com/SardineFish/raindrop-fx/blob/master/LICENSE)

这是一级来源里与目标最接近的成品：它本身就是“glass 上的 raindrop effect”，同时提供 npm 包和在线 Demo。README 暴露了 `backgroundBlurSteps`、`mist`、`mistTime`、`mistBlurStep`、微滴生成率、水滴折射强度、重力、横向偏移、拖尾密度和碰撞等参数。也就是说，它已经明确把背景宽模糊、雾层、水滴法线/折射和水滴动力学分开，而不是把蒸汽当成一个普通 blur。

### 对本项目最有用的部分

- 用 3—4 级降采样/升采样形成宽而柔的背景模糊；
- 雾层拥有自己的累积时间和更高一级模糊，不与背景 blur 共用一个均匀强度；
- 活动水滴用法线和尺寸控制折射，小微滴作为另一层渲染；
- 水滴有重力、运动状态切换、横向漂移、拖尾、蒸发和碰撞；
- 风扇清除时可以同时作用于雾层 alpha 与水滴速度，形成“被吹散”而不是直接关闭 shader。

### 集成判断

不建议 `npm install raindrop-fx` 后在 Three.js canvas 旁再启动它自己的 WebGL2 renderer。它面向一张背景图片或独立 `TexImageSource`，会与当前 renderer、RenderTarget、尺寸和动画循环重叠。正确做法是以它的 shader 和状态机为蓝本，把雾层、水滴法线与折射合并进现有 `post.ts`。

项目当前 28% 分辨率双向模糊已经相当于一个低成本基础版本，不需要第一步就完整照搬多级 mip blur。应先验证“凝露遮罩 + 水滴法线 + 边缘生成”是否解决视觉问题，再决定是否增加第 3—4 级宽模糊。

## 2. Codrops RainEffect：最接近“玻璃上的真实水滴”

源码与 Demo：

- [GitHub 仓库](https://github.com/codrops/RainEffect)
- [作者 Demo](https://tympanus.net/Development/RainEffect/)
- [水滴状态、重力、碰撞、合并与拖尾](https://github.com/codrops/RainEffect/blob/master/src/raindrops.js)
- [水滴渲染器](https://github.com/codrops/RainEffect/blob/master/src/rain-renderer.js)
- [水滴折射 fragment shader](https://github.com/codrops/RainEffect/blob/master/src/shaders/water.frag)
- [水滴 alpha / color / shine 贴图目录](https://github.com/codrops/RainEffect/tree/master/demo/img)
- [仓库许可说明](https://github.com/codrops/RainEffect#license)
- [Codrops 当前许可页](https://tympanus.net/codrops/licensing/)

它不是简单画几个圆。`raindrops.js` 为每滴水保存半径、横纵扩散、纵向动量、横向动量、父滴和收缩状态；大滴会缓慢加速、留下小滴、擦除原有微滴，并与附近小滴合并。`water.frag` 把水滴贴图的 R/G 通道当折射方向，B 通道当厚度，再根据厚度改变折射距离和高光。

### 对本项目最有用的部分

- 只移植“大滴状态机 + 拖尾 + 合并”这一层；
- 把其 Canvas 输出改为 Three.js 的 `CanvasTexture`，或把 R/G/B/A 解释为法线 X、法线 Y、厚度、覆盖率；
- 把当前场景纹理作为折射输入，不使用 Demo 的固定背景图；
- 改生成区域：顶部约 70%，左、右边各约 15%，中部只保留少量随机微滴；
- 数量大幅缩减：不要使用源码默认最高 900 滴，建议 16—24 个活动大滴 + 一张静态/缓慢更新的微滴底纹。

### 风险

- 原项目使用 Canvas 2D 逐帧合成再上传 WebGL，分辨率或水滴数过高会产生 CPU、纹理上传压力；
- 原 Demo 的视觉偏写实，应降低高光和折射强度，避免破坏当前 Low Poly / Sakura 风格；
- 许可文字有年代差异：仓库 README 写的是可用于个人/商业项目但不可原样再发布；Codrops 当前总许可页称下载 Demo 默认 MIT。最安全做法是保留作者/Codrops 声明、明显改写实现，并在正式发行前确认适用条款。

## 3. frost-reveal：最适合借“凝露遮罩”，不适合直接安装解决问题

源码：

- [GitHub 仓库与说明](https://github.com/kaminidoramawo/oss-frost-reveal)
- [WebGL renderer](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/src/core/webgl-renderer.ts)
- [fragment shader](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/src/core/shaders.ts)
- [MIT License](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/LICENSE)

这是一个成品 npm 模块，提供 WebGL（TWGL）和 Canvas 2D 双渲染器。其最值得复用的设计是：**遮罩 Canvas 使用半分辨率，软边笔刷修改遮罩，再把遮罩作为纹理上传到 shader**。这种结构很适合表达“哪里雾浓、哪里被水滴划开、哪里正在重新起雾”。

但检查当前源码后不能把它当作即插即用答案：其 WebGL shader 只在两种颜色、白色磨砂层和凝露贴图之间混合，并没有采样或模糊外部 Three.js 场景；README 中的 `blurredSrc` 路径主要属于外围/Canvas 方案。因此推荐移植遮罩机制，而不是叠一个独立 WebGL canvas 或引入 TWGL。

### 对本项目最有用的部分

- 0.5 或 0.25 分辨率的单通道凝露遮罩；
- 水滴轨迹在遮罩里降低雾浓度，轨迹随时间缓慢回升；
- 纹理采用 `CLAMP_TO_EDGE + LINEAR`；
- 低分辨率遮罩天然产生柔和边缘，符合磨砂玻璃而不是锐利 UI 蒙版。

## 4. Three.js 官方后处理：现有实现的正确底座

源码：

- [ShaderPass](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/ShaderPass.js)
- [FullScreenQuad](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/Pass.js)
- [HorizontalBlurShader](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/HorizontalBlurShader.js)
- [VerticalBlurShader](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/VerticalBlurShader.js)
- [MIT License](https://github.com/mrdoob/three.js/blob/dev/LICENSE)

官方横纵模糊各使用 9 个采样，文档明确要求 `h=1/width`、`v=1/height`。它证明当前“先缩小 RenderTarget、再横纵两遍模糊”的方向是合理的，但它只能生成均匀模糊，无法自己产生凝露、湿痕和水滴折射。

结论：继续复用当前自研 `FullScreenQuad`，无需为了蒸汽改成 `EffectComposer`。需要改的是最终合成语义，而不是模糊 pass 的外壳。

## 5. pmndrs/postprocessing：成熟的性能参考，但不值得为这一个效果迁移

源码与文档：

- [GitHub 仓库](https://github.com/pmndrs/postprocessing)
- [KawaseBlurPass](https://github.com/pmndrs/postprocessing/blob/main/src/passes/KawaseBlurPass.js)
- [TextureEffect](https://github.com/pmndrs/postprocessing/blob/main/src/effects/TextureEffect.js)
- [官方 Blur Demo](https://pmndrs.github.io/postprocessing/public/demo/#blur)
- [Zlib License](https://github.com/pmndrs/postprocessing/blob/main/LICENSE.md)

`KawaseBlurPass` 默认以 0.5 分辨率运行，并在大模糊核下比 Gaussian blur 更高效；库还会把多个 Effect 合并，减少全屏绘制次数，并用一个全屏三角形降低对角线浪费。这些做法适合用来审核当前管线。

但是本项目已经有完整的 RenderTarget、FullScreenQuad、尺寸管理和 dispose。如果只为了蒸汽引入该库，会出现两套 composer 生命周期、颜色空间和缓冲区管理。建议只在将来多个屏幕技能都需要复杂组合时再统一迁移；这次不要安装。

## 6. stegu/webgl-noise：让“雾”从均匀滤镜变成凝露膜

源码：

- [GitHub 仓库](https://github.com/stegu/webgl-noise)
- [2D simplex noise](https://github.com/stegu/webgl-noise/blob/master/src/noise2D.glsl)
- [2D psrdnoise](https://github.com/stegu/webgl-noise/blob/master/src/psrdnoise2D.glsl)
- [MIT License](https://github.com/stegu/webgl-noise/blob/master/LICENSE)

该库的噪声函数不依赖查找纹理，适合在最终合成 pass 中生成低频凝露浓度：底部略薄、顶部和左右更浓，再叠加缓慢流动的 1—2 层噪声。它的作用是打破“整张图一样糊”的塑料感，不应承担水滴运动。

性能上只取一个 2D 函数和最多两个 octave。不要把完整库、多层 FBM、流体模拟和水滴折射一起堆进同一个高分辨率 shader。

## 可参考但不推荐直接接入

### olefriis/misty-window

- [GitHub](https://github.com/olefriis/misty-window)
- [核心实现说明](https://github.com/olefriis/misty-window#how-was-this-done)
- [WTFPL License](https://github.com/olefriis/misty-window/blob/main/LICENSE)

它是 Metal/iOS，不是 WebGL，但其架构与目标高度一致：生成清晰图和 Gaussian 模糊图；用一张 0—1 混合纹理决定每像素雾浓度；水滴经过处把混合值设为 0；混合纹理再逐帧回升，让湿痕重新起雾；最终 shader 在水滴内部做反射/折射。推荐借这套视觉逻辑，不移植 Metal 代码。作者 README 也明确指出当前 GPU 压力较大且未达到 60 FPS，说明全分辨率多阶段处理不适合本项目。

### PavelDoGreat/WebGL-Fluid-Simulation

- [GitHub 与 Demo](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)
- [核心 WebGL 源码](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/script.js)
- [MIT License](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/LICENSE)

这是完整的 GPU 流体模拟，包含速度、密度、压力、多次压力迭代、涡度、bloom 和 sunrays。它适合烟雾/液体流场，却不能自然给出玻璃水滴轮廓；默认还有 20 次压力迭代和多个 framebuffer。对一个持续 DEBUFF 来说性能、复杂度和视觉方向都过重，**不推荐**。

### Experience Monks glsl-fast-gaussian-blur

- [GitHub](https://github.com/Experience-Monks/glsl-fast-gaussian-blur)
- [9-tap shader](https://github.com/Experience-Monks/glsl-fast-gaussian-blur/blob/master/9.glsl)
- [Demo](https://experience-monks.github.io/glsl-fast-gaussian-blur/)
- [MIT License](https://github.com/Experience-Monks/glsl-fast-gaussian-blur/blob/master/LICENSE.md)

它提供 5/9/13 tap 的 separable Gaussian blur。若当前自写权重出现采样或画质问题，可以对照替换；但它仍只解决“模糊”，不能补足磨砂和水珠，所以优先级低于 Codrops、凝露遮罩和噪声。

## 推荐落地结构

### A. 静态磨砂基底

- 输入：当前清晰场景、已有低分辨率模糊场景；
- 凝露遮罩：低频噪声 + 顶部/左右边缘渐变，中央不要完全遮死；
- 合成：在清晰与模糊之间按遮罩混合，再加入少量冷白雾色；
- 目标：玩家能辨认线束大致位置和颜色，但看不清插头边界与线的交叠关系。

### B. 动态水滴层

- 只生成 16—24 个活动大滴；
- 主要从顶部、左上和右上出生；侧边水滴可以带小幅向内的横向动量，再受重力向下；
- 速度要慢且不一致，避免“下雨玻璃”抢走玩法注意力；
- 大滴拖出低雾湿痕，数秒后湿痕重新变雾；
- 微小水珠使用一张静态或低频更新纹理，不逐滴模拟。

### C. 折射与风扇清除

- 水滴纹理 R/G 保存法线方向，B 保存厚度，A 保存覆盖率；
- 水滴内部对清晰/模糊场景做 1—4 像素的短距离折射；
- 风扇技能触发时，不只把整体 opacity 降低：先让边缘大滴被吹偏/加速，再让凝露遮罩快速衰减，最后关闭 pass；
- UI 是 DOM 层，不进入 WebGL 后处理，继续保持清晰。

## 性能预算建议

- 继续使用当前约 28% 分辨率的两个蒸汽 RenderTarget；
- 凝露/水滴遮罩用 0.25—0.5 分辨率，`LinearFilter`；
- 水滴 Canvas 最多 30 FPS 更新，渲染帧之间复用同一纹理；
- 活动大滴上限 24，碰撞检查只查邻近/排序后的有限窗口；
- 最终只新增一次全屏合成，不新增流体压力迭代；
- 低画质档：禁用水滴法线折射，只保留遮罩、湿痕和 8—12 个大滴；
- 验收时记录启用/禁用蒸汽的 GPU frame time，而不只看平均 FPS。

## 最终选择

**推荐组合：raindrop-fx 的视觉与渲染管线作为蓝本 + Codrops 的水滴运动细节 + frost-reveal 的低分辨率凝露遮罩 + 当前项目已有双向模糊 + stegu 的单层噪声。**

这套组合能直接对应用户反馈中的每一项：

- “不是单纯模糊”——增加不均匀凝露遮罩与乳白膜；
- “有浴室磨砂感”——清晰/模糊按空间变化混合，而不是全屏同一模糊值；
- “看得到线但看不准”——保留低频轮廓，同时用折射破坏精确边缘；
- “顶部和左右水珠慢慢流下”——限制出生区和水滴动量；
- “性能可控”——复用现有 RenderTarget，只增加低分辨率动态纹理和一个最终合成。

不建议使用 IMG2THREEJS：这个效果是屏幕空间的玻璃/凝露介质，不是需要生成 GLB 的三维物件。也不建议引入 GPU 流体模拟或整套新 composer。
