# 面包机技能：屏幕热浪 / 热空气折射效果研究

更新时间：2026-08-17  
范围：`arrow-cube` 当前 vanilla Three.js + 自研 `FullScreenQuad` 后处理管线。只研究与提出设计，不修改运行时代码。

## 先给结论

现在的面包机画面主要是**整体暖红调色 + 规则横向摆动**，所以观众看到的是“危险滤镜”，不是“空气被烤热”。真正能让人立即感到热的核心应是：背景轮廓在多个不同尺度上发生缓慢上升、局部成团、强弱不均的折射；颜色变化只作辅助。

最适合本项目的方案不是引入完整流体库，而是组合两种一级来源的思路：

- 以 [Lucas Bebber / Codrops HeatDistortionEffect](https://github.com/lbebber/HeatDistortionEffect) 的 cooking Demo 作为主要视觉蓝本：多组不同方向和速度的波、区域遮罩、热区轻微失焦；
- 以 MIT 开源的 [BallisticsToolkit MirageEffect](https://github.com/chasep255/BallisticsToolkit/blob/master/web/fclass-sim/rendering/mirage.js) 作为 Three.js 分层热空气结构参考：近处大软热团、远处细小热柱，持续向上“沸腾”；
- 以 [Yui Kinomoto 的 MIT Heat Haze Shader](https://godotshaders.com/shader/heat-haze-shader/) 作为轻量算法底座：多频 value noise 生成非规则折射向量；
- 直接放进现有 `src/style/post.ts` 的 `uEffect == 6` 全屏 pass，不安装新框架，不新增 3D 提示模型；
- 删除大面积红色覆盖，保留极轻的低饱和桃杏暖色，只让“正在折射的热区”变暖；
- 热浪由屏幕下方及中下部向上漂移，在换头节点出现一次更强的热流脉冲，之后缓慢散去。

这能同时满足当前 Sakura 风格和玩法可读性：线的颜色仍是原色，玩家能确认发生变化；插头和线段边缘会被热浪一起折射，视觉上确实像整个场景受热，而不是在线上贴一个特效。

## 与当前实现的关系

项目已经有适合承载效果的完整结构：

- `src/style/post.ts` 使用 Three.js 官方 `FullScreenQuad`；
- 当前面包机对应 `uEffect == 6`；
- 已有 `uTime`、`uTexel`、`uEffectProgress` 和场景纹理 `tDiffuse`；
- 技能开始、换头与冷却已经有约 5.2 秒时间轴；
- 现有 shader 内已经有 `hash/noise` 类函数，可复用而不增加纹理资源。

因此无需像蒸汽那样再建立水滴 Canvas，也不需要新 `EffectComposer`。这次应替换的是 `uEffect == 6` 的视觉算法：从“规则 sine + 暖红混色”改成“上升的多尺度噪声折射场 + 轻微局部扩散 + 受控暖色”。

```text
场景纹理
   │
   ├─ 低频热团（慢速上升）
   ├─ 中频折射（左右摆动）  → 合成 UV 偏移 → 2 次场景采样 → 轻微热区调色 → 屏幕
   └─ 细频空气颤动（短促、不规则）
                    ↑
             技能 5.2 秒时间轴
```

## 推荐排序

| 排名 | 候选 | 许可证 | 可复用内容 | 集成难度 | 性能判断 | Sakura 适配 |
|---:|---|---|---|---|---|---|
| 1 | [Codrops / HeatDistortionEffect](https://github.com/lbebber/HeatDistortionEffect) | 仓库声明允许个人/商业集成与二创，但禁止原样再发布；不是标准 SPDX 文本 | cooking shader 的多速度热波、遮罩、模糊混合和热区质感 | 低—中 | 低—中 | **最匹配视觉目标**，但应独立改写并不复制资产 |
| 2 | [BallisticsToolkit / MirageEffect](https://github.com/chasep255/BallisticsToolkit/blob/master/web/fclass-sim/rendering/mirage.js) | MIT | 直接使用 Three.js 的三层热霾；横风、上升热流、纵深和时间分别驱动 4D simplex noise | 中 | 中；原版每像素 3 层 4D noise | **最好的 Three.js 结构参考**，移动端需简化 |
| 3 | [Yui Kinomoto / Heat haze Shader](https://godotshaders.com/shader/heat-haze-shader/) | MIT | 5 个尺度的 value noise、时间滚动 UV、屏幕采样偏移 | 低 | 低—中 | **最适合做实际轻量底座**，可将噪声层缩到 3 层 |
| 4 | [artcodev/three-fluid-fx](https://github.com/artcodev/three-fluid-fx) | MIT | 原生 Three.js 流体速度纹理驱动 UV 折射，提供精简 distortion 示例 | 中—高 | 中—高；GLSL 默认管线有 20 个 pass | 动态很自然，但对 5.2 秒技能明显过重 |
| 5 | [whatisjery/react-fluid-distortion](https://github.com/whatisjery/react-fluid-distortion) | MIT | density/velocity 流体场、`postprocessing` 自定义效果封装、耗散参数 | 高 | 高于程序噪声 | 可作流动节奏参考，不应引入 React/R3F 依赖 |
| 6 | [PixiJS DisplacementFilter](https://pixijs.download/v8.11.0/docs/filters.DisplacementFilter.html) | PixiJS/filters 为 MIT | 以 RG 位移图控制水平/垂直 UV 偏移；官方文档明确列出 heat haze 用途 | 中 | 低—中 | 技术方向正确，但项目不是 PixiJS，只参考 displacement map 语义 |
| 7 | [FoundryLogger/cel-lab](https://github.com/FoundryLogger/cel-lab) | GPL-3.0-or-later | 风格化 cel-shade 后处理、heat haze 与分色调色的组合思路 | 中 | 中 | 风格最接近，但**只看设计，不复制代码**，避免 GPL 传染范围 |
| Noise 基础 | [stegu/webgl-noise](https://github.com/stegu/webgl-noise) | MIT | 无查找纹理的 2D/3D/4D simplex noise | 低 | 主要消耗 ALU | 可只内联一个维度较低的函数，避免手写劣质 hash noise |
| 基础设施参考 | [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | Zlib | 自定义全屏 Effect、Effect 合并、全屏三角形的性能设计 | 中 | 低 | 当前项目已有同类管线，不建议为单个技能迁移 |

## 1. Codrops HeatDistortionEffect：最接近想要的“烤热空气”

一级来源：

- [原作者文章与在线 Demo](https://tympanus.net/codrops/2016/05/03/animated-heat-distortion-effects-webgl/)
- [GitHub 源码](https://github.com/lbebber/HeatDistortionEffect)
- [Cooking fragment shader](https://github.com/lbebber/HeatDistortionEffect/blob/master/src/shaders/haze-cooking.frag)
- [运行时与每帧 time uniform](https://github.com/lbebber/HeatDistortionEffect/blob/master/src/haze.js)
- [仓库许可说明](https://github.com/lbebber/HeatDistortionEffect#license)
- [Codrops 当前通用许可页](https://tympanus.net/codrops/licensing/)

文章明确把热霾的核心描述为：改变屏幕采样位置，使用随时间变化的 sine，再用一张灰度 map 限制哪些区域折射。Cooking shader 进一步叠加多组频率和速度不同的波，并在热区混合模糊图像。这与面包机技能非常吻合，因为它不是在画“火焰”，而是在让真实场景自身发生热折射。

### 最值得借的三点

1. **多层不同速度**：不能只有一根整齐的横波。低频热团慢慢上升，中频左右扭曲，细频快速颤动，三层相互打乱。
2. **热区遮罩**：只在热流经过处明显折射，其他位置保持稳定。这样不会让玩家觉得整台相机坏了。
3. **折射中混入轻微失焦**：热空气不仅改变位置，也会让细边缘短暂变软。项目可用第二次相邻采样模拟，不必增加完整 blur pass。

### 许可判断

该仓库 README 的许可文字比 Codrops 当前通用 MIT 页面更具体：允许在个人或商业项目中集成或继续开发，但禁止将其原样重新发布、分发或出售。稳妥做法是研究算法结构、独立编写 GLSL、不复制 Demo 图片、map 和整段 shader，并在第三方说明中保留 Lucas Bebber / Codrops 参考来源。

## 2. BallisticsToolkit MirageEffect：最贴近当前 Three.js 管线的分层热霾

一级来源：

- [GitHub 仓库](https://github.com/chasep255/BallisticsToolkit)
- [Three.js MirageEffect 源码](https://github.com/chasep255/BallisticsToolkit/blob/master/web/fclass-sim/rendering/mirage.js)
- [MIT License](https://github.com/chasep255/BallisticsToolkit/blob/master/LICENSE)

这是本次搜索到最有针对性的原生 Three.js 开源实现。作者把视线中的热空气建模成三个独立薄层，共享一套 4D simplex noise，但使用不同的纵深锚点打散重复：近层形成大而软的热团，远层形成细而清晰的热柱。四个 noise 轴分别由横风、热上升、纵深风与时间驱动，因此热浪既向上“沸腾”，又会缓慢生成、消散和横向漂移，不会退化成规则波纹。

源码还明确使用屏幕空间 UV distortion，并把位移强度设上限，防止高倍率下采样越界。这与当前 `tDiffuse + uTexel + FullScreenQuad` 管线高度一致。

### 适合移植的部分

- 三个纵深层的视觉关系，而不是照搬完整射击模拟器；
- x 方向代表轻微横向漂移，y 方向持续上升；
- 不同层使用不同空间尺度、速度和权重，避免纹理重复；
- 最终 UV 位移统一限幅并 clamp；
- 换头节点只提高强度，不改变 flow 的连续相位，避免跳帧。

### 性能取舍

原版是每像素三层 4D simplex noise，对持续的瞄准镜热霾合理，但对本项目全屏短技能偏重。推荐保留“分层上升”结构，将 4D simplex 降成两层 2D/3D noise，或仅桌面高画质启用第三层。这样能借到真实空气纵深感，又不必承担原版完整 ALU 成本。

## 3. Yui Kinomoto Heat Haze Shader：最适合实际移植的 MIT 底座

一级来源：

- [作者发布页、完整 shader 与 MIT 声明](https://godotshaders.com/shader/heat-haze-shader/)
- [作者原始 Bitbucket 项目入口](https://bitbucket.org/arlez80/godot-inverse-perspective-mapping/)

这段 shader 使用平滑 value noise，并以 8、16、32、64、128 五个频率叠加，再用两组不同时间方向生成 x/y 偏移。最终通过 `SCREEN_UV + shift` 重新采样场景。其语义可以一一映射到 Three.js：

- `SCREEN_UV` → 当前 `uv`；
- `SCREEN_TEXTURE` → 当前 `tDiffuse`；
- `TIME` → 当前 `uTime`；
- `max_shift` → 用 `uTexel * pixelAmplitude` 表达，避免分辨率变化；
- Godot 的 depth mask → 本项目改成程序化热团 mask 或可选的屏幕空间面包机热源位置。

不建议照搬五层 noise。项目的技能 pass 运行在完整画面上，使用 3 层即可：例如 7、19、43 三个尺度；低频决定热团，中频决定折射方向，高频只提供细小空气颤动。

## 4. three-fluid-fx：Three.js 原生、动态最好，但不适合第一版

一级来源：

- [GitHub、架构、性能与 MIT License](https://github.com/artcodev/three-fluid-fx)
- [最小屏幕 distortion 源码](https://github.com/artcodev/three-fluid-fx/blob/main/examples/glsl/minimal/distortion/main.ts)
- [第三方代码说明](https://github.com/artcodev/three-fluid-fx/blob/main/THIRD_PARTY_NOTICES.md)

它与当前 Three.js `0.184` 版本兼容，最小示例也是将 `tFluid.rg` 当速度场，乘以小系数后偏移 `tDiffuse` UV。从视觉上，它可以生成非常自然的卷曲和聚散，确实能成为高级热空气效果。

但默认 WebGL 管线包含 20 个 pass，并依赖 HalfFloat FBO；技能只持续约 5.2 秒，为它维护速度、密度、压力和多次迭代代价过高。它更适合以后多个技能共用流体场（烟、风、热、液体）时统一引入。当前只建议借它的一个原则：**位移向量应该来自连续流场，而不是单一正弦**。

## 5. react-fluid-distortion：可研究耗散节奏，不应直接安装

一级来源：

- [GitHub 仓库](https://github.com/whatisjery/react-fluid-distortion)
- [MIT License](https://github.com/whatisjery/react-fluid-distortion/blob/main/LICENSE)

它使用 React Three Fiber、`@react-three/postprocessing` 和完整 2D 流体模拟，公开了 velocity dissipation、density dissipation、pressure、curl、swirl、radius、force 和 distortion 等参数。对面包机最有价值的不是实现，而是动态节奏：热团应该有惯性、卷曲和逐渐耗散，而不是技能一结束就把滤镜硬切掉。

项目是 vanilla Three.js，而且已有自己的渲染循环与全屏 pass，所以不要引入 React/R3F 依赖。可将它的“快速注入、慢速耗散”翻译为时间轴：换头瞬间提升折射强度，之后约 0.7—1 秒平滑散去。

## 6. PixiJS DisplacementFilter：最轻的位移图结构参考

一级来源：

- [PixiJS 官方 DisplacementFilter 文档](https://pixijs.download/v8.11.0/docs/filters.DisplacementFilter.html)
- [PixiJS/filters GitHub 与 MIT License](https://github.com/pixijs/filters)

官方文档明确说明 R 通道控制水平位移、G 通道控制垂直位移，并把 heat haze 列为典型用途。这个结构与项目已有 `CanvasTexture` 经验兼容：如果程序噪声表现不够自然，可以以后增加一张 128×128 的低分辨率 RG 热流纹理，每帧 20—30 FPS 更新，然后在全屏 pass 中放大到屏幕。

第一版仍不需要它：GLSL 程序噪声不产生 CPU 纹理上传，并且当前技能只有 5.2 秒。

## 7. cel-lab：SAKURA 风格参考，不应复制 GPL 代码

一级来源：

- [GitHub 仓库](https://github.com/FoundryLogger/cel-lab)
- [GPL-3.0-or-later License](https://github.com/FoundryLogger/cel-lab/blob/main/LICENSE)

它把 heat haze 与 cel-shade、split-tone、film grain、边缘效果放在同一个风格化 VFX 编辑器里，说明热浪并不必然走写实电影风。适合本项目借鉴的美术取向是：低饱和分色、有限色阶、效果强度集中在轮廓变化，而不是浓重红色覆盖。

由于是 GPL-3.0-or-later，不建议复制其实现到当前项目。只将它当视觉组合与参数方向参考。

## 推荐的 Sakura 热浪设计

噪声函数若需要从成熟实现中移植，使用持续维护、MIT 授权的 [stegu/webgl-noise](https://github.com/stegu/webgl-noise)，不要自己叠大量 `sin(hash())`。其 README 说明实现不依赖纹理或外部数据、主要使用 ALU；这正适合当前以场景纹理采样为主的全屏 pass。但应只内联一个 2D/3D 函数并控制在 2—3 层，不能把整个库和 4D noise 全部塞进技能 shader。

### 视觉层 1：上升的热团折射

- 热团从屏幕下方约 `y=0.05—0.35` 随机生成，向上移动；
- 每团宽度不同，约屏幕宽度的 `12%—34%`，边缘必须柔软破碎；
- x 偏移为主，峰值约 `2—5 px`；y 偏移只需 `0.5—1.5 px`；
- 不让全屏同时保持最大折射，同一帧只应有约 `35%—60%` 区域明显受热；
- 热流速度不一致，避免像扫描线或水波。

### 视觉层 2：局部空气失焦

- 在强热区对 `tDiffuse` 做第二次相邻采样；
- 只用 2 tap，沿热流法线偏移约 `1—2 px` 后取平均；
- 不能像蒸汽那样做大半径 blur，仍要看得清哪几根线在变化；
- UI 是 DOM 层，保持完全清晰。

### 视觉层 3：低饱和暖色

- 删除当前大面积红色乘色；
- 颜色只混入低饱和桃杏色，例如暖高光偏 `#F3B18C`、暖阴影偏 `#A85F63`，但混合权重控制在约 `4%—12%`；
- 只在热团 mask 中调色，未受热区保持线材原色；
- 日间降低暖色、加强 UV 折射；夜间可略增暖色但不能压黑背景。

### 视觉层 4：换头节点的热脉冲

建议把 5.2 秒分成：

| 时间 | 屏幕表现 |
|---|---|
| `0—0.65s` | 热团从底部逐渐出现，折射约目标强度的 20%—45% |
| `0.65—3.35s` | 多尺度上升热浪持续，颜色只有轻微升温 |
| `3.35—4.25s` | 吐司弹起 / 换头窗口：折射短暂增大约 25%，一股较宽热流快速上冲 |
| `4.25—5.2s` | 热团继续上升并耗散，暖色先退，折射后退 |

切换时插头位置的跳动是几何/过渡提交问题，屏幕热浪只能减轻突兀感，不能用失真掩盖错误坐标。前端实现时仍应确保旧、新插头在同一个外端点坐标交叉淡化。

## 建议的 shader 结构

下面是结构示意，不是要原样复制的最终代码：

```glsl
float coarse = valueNoise(vec2(uv.x * 7.0, uv.y * 5.0 - time * 0.42));
float middle = valueNoise(vec2(uv.x * 19.0 + coarse, uv.y * 14.0 - time * 0.86));
float fine = valueNoise(vec2(uv.x * 43.0 - time * 0.12, uv.y * 32.0 - time * 1.45));

float risingMask = smoothstep(0.36, 0.78, coarse * 0.62 + middle * 0.38);
vec2 flow = vec2(middle - 0.5, (fine - 0.5) * 0.32);
vec2 heatUv = clamp(uv + flow * texel * pixelAmplitude * risingMask, 0.002, 0.998);

vec3 sharp = texture2D(scene, heatUv).rgb;
vec3 soft = texture2D(scene, heatUv + normalize(flow + 0.001) * texel * 1.4).rgb;
vec3 heated = mix(sharp, soft, risingMask * 0.24);
heated = mix(heated, sakuraWarmGrade(heated), risingMask * 0.08);
```

关键不是具体常数，而是：噪声随 y 方向上升、三个尺度速度不同、局部 mask 控制折射、位移使用 `uTexel` 以像素为单位、最终调色远弱于折射。

## 性能预算与降级

推荐第一版继续使用现有单个全屏技能 pass：

- 不新增流体 FBO；
- 不新增动态图片资产；
- 3 层 value noise；
- 受热时 2 次 `tDiffuse` 采样，未受热也走同一 shader；
- 1080p 桌面目标仍为 60 FPS，但必须实际记录 GPU frame time，不能只凭肉眼判断；
- 低画质档降为 2 层 noise、1 次纹理采样、最大位移 2 px；
- 减少 noise octave 应优先于降低屏幕分辨率，避免画面出现蒸汽效果曾出现的像素/锯齿感。

只有当程序噪声无法做出自然卷曲时，才考虑：

1. 128×128 RG 热流纹理；
2. `three-fluid-fx` 低分辨率 solver；
3. 多个技能共用同一个流体场。

## 不建议采用的方向

- **继续增加红色透明层**：表达的是受伤、警报或高温警告，不是空气受热；
- **全屏一致正弦波**：很快会被识别为水波/电视扭曲；
- **明显色散与 RGB 分离**：会重新接近电视机故障技能，削弱两个家电的区别；
- **火焰、火星或 3D 热浪模型**：会回到用户已经否定的“提示模型”，并可能穿插线组；
- **大范围 Gaussian blur**：更像蒸汽，不像干热空气；
- **完整 GPU 流体模拟**：当前只有一次短技能，复杂度和性能不成比例；
- **IMG2THREEJS**：这是屏幕空间介质折射，不是需要生成 GLB 的物体。

## 最终推荐

优先做一个独立改写的 `SakuraHeatHaze`：采用 MIT Heat Haze Shader 的多尺度 value-noise UV 偏移，借 BallisticsToolkit 的分层上升热柱结构和 Codrops Cooking Demo 的遮罩、轻微失焦语义，直接替换当前 `uEffect == 6`。

它的验收标准应该是：暂停在任意一帧时看不见规则的“特效图案”；连续播放时，能明显看到线、插头和场景轮廓像隔着热空气轻轻漂动；线材原色仍然可辨；换头节点出现一次自然热浪上冲；结束时不是硬切而是逐渐散热。
