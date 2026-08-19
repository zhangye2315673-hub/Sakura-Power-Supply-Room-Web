# 冰箱技能替代参考：连续屏幕结冰与少量大块线缆冰层

研究日期：2026-08-18  
研究边界：用户已否定锯齿 Voronoi 冰框与高密三角面线缆冰壳。本轮只查一级来源、作者原仓库和作者/官方在线 Demo；不修改运行时代码。

## 结论

新方向不应继续把“冰”理解成大量尖锐碎片。更适合当前 SAKURA 低模卡通风格的结构是：

- **屏幕**：先产生少数连续、圆润、互相融合的结冰区域，再用冷青吸收色、薄霜、高光和轻折射让它读成冰；不能先画完整矩形框。
- **线缆**：原线、插头和尾部先整体霜化，再沿线增加少量大而圆润的厚冰块；取消连续规则管壳和密集三角面。

最推荐的组合：

1. 屏幕用 **D3 Contour/Marching Squares 式平滑等值线**生成 4–8 个相连的大冰舌，材质借 **Canvas UI Frost 或 Phase Transition** 的连续高度、折射与冰色结构。
2. 线缆用 **Frozen Shader 式表面霜层**作为全覆盖基础，再用 **Three.js MarchingCubes** 生成约 4–7 处融合的大冰块，材质使用 Three.js 官方 physical transmission。
3. 如果透明冰仍然偏写实或排序不稳，采用 **奶白冰霜涂层 + 少量不透明浅青冰块**的纯 SAKURA toon 方案；保留大轮廓和两级高光，不追求写实玻璃。

## 屏幕边缘候选

### 候选 S1：D3 Contour 平滑等值线生长

一级来源：

- [D3 Contour 作者原仓库](https://github.com/d3/d3-contour)
- [D3 官方文档与在线示例](https://d3js.org/d3-contour)
- [ISC 许可证](https://github.com/d3/d3-contour/blob/main/LICENSE)

**长什么样**

- 输出连续、闭合、可平滑插值的等值线区域。
- 从四周构造低频标量场后，会形成几块互相融合的圆润冰舌、凹口和岛状空隙。
- 没有 Voronoi cell 接缝、像素块或断裂面板；第一眼更像结在玻璃上的连续冰层。

**动态怎么动**

- 四边只放 8–14 个大尺度标量种子，并给每个种子不同出生时间。
- 随技能进度降低 contour threshold，冰层从不同位置逐渐扩张、相遇、融合。
- 更新频率只需 10–15 Hz；渲染仍每帧平滑插值，不需要每帧重算复杂噪声。

**可以借什么**

- Marching Squares 单元分类、轮廓 stitching 和线性平滑。
- `contours().size().thresholds().smooth(true)` 的职责划分。
- 结果可栅格化到 128×72 或 256×144 的 `CanvasTexture/DataTexture` 作为现有后处理 mask。

**许可证、性能与适配风险**

- ISC，宽松；如果直接复制实质代码需保留许可信息。
- 低到中等开销；不必引入完整 D3，可按 ISC 许可移植最小 marching-squares 部分，或独立重写算法。
- 最大风险是单独看会像云、奶油或融化胶。必须叠加偏蓝阴面、奶白薄霜、窄高光和 1–2 像素折射，形状才会读成冰。
- SAKURA 适配度：**高**。轮廓简单、大片、易控制，不需要照片纹理。

### 候选 S2：Canvas UI Frost 的连续磨砂霜层

一级来源：

- [作者在线 Demo/文档](https://canvasui.dev/docs/components/frost)
- [作者原仓库](https://github.com/DavidHDev/canvas-ui)
- [Vanilla WebGL 完整源码](https://github.com/DavidHDev/canvas-ui/blob/main/src/lib/Frost/FrostVanilla.ts)
- [MIT + Commons Clause 许可证](https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md)

**长什么样**

- 大块连续乳白霜面，边界由 domain-warped noise 形成圆润缺口和缓慢变化。
- broad/fine 两层高度带来表面层次，少量 sparkle 让它像冷玻璃，而不是蓝色透明框。
- 整体接近浴室玻璃上的冻结霜，但参数可压低 haze，避免回到蒸汽模糊。

**动态怎么动**

- 原始实现已有 `introDuration`，用到屏幕边缘距离与 warped noise 控制霜从边缘连续进入。
- 可把一个全局 intro 拆成四组延迟，避免四边同一时间出现。
- 主体 shape 固定，只让覆盖进度前进；稳定后不继续漂移。

**可以借什么**

- `FRAG_NOISE` 的低频 warp + mottle 结构。
- `FRAG_HEIGHT` 的 broad/fine 双高度层。
- `edgeDist + noise` 的连续 intro 形状，以及由高度图产生的折射 normal。
- 不应借 10 tap 全屏 blur、DOM 捕获、鼠标融化和双缓冲交互。

**许可证、性能与适配风险**

- 许可证允许作为应用/网站/产品的一部分使用，但禁止把组件本身或 ported version 作为组件重新销售/再分发；若实质移植，应保留许可证并确认项目分发方式。
- 原实现包含多 render target、blur 和高度 pass，完整搬用是中高开销；只借低频 mask + height normal 可降到中等。
- 默认 haze 很强，直接照搬会重新变成“蒸汽磨砂”。必须把 blur/haze 压低，以大色块和窄高光为主。
- SAKURA 适配度：**中高**。形状合适，写实细颗粒需要删减。

### 候选 S3：Andrea Riccardi FreezePostProcess 的地图驱动冻结

一级来源：

- [作者原始 shader](https://github.com/a-riccardi/shader-toy/blob/master/ShaderToy/Assets/FreezePostProcess/Shaders/Git/FreezePostProcess.shader)
- [作者项目展示](https://andreariccardi.artstation.com/projects/VeDOR)
- [MIT 许可证](https://github.com/a-riccardi/shader-toy/blob/master/LICENSE)

**长什么样**

- 一张 mix map 的 RG/B/A 分别承载 normal、density 和 gradient，得到连续冰脉、厚薄区和背景折射。
- 形状由 gradient map 决定，所以可以专门制作成 5–8 块圆润大冰区，而不是程序生成细碎 cell。
- 冻结区域有厚冰色与正常画面的连续过渡。

**动态怎么动**

- `_Amount` 和 `_Steepness` 共同推进冻结阈值；不是直接切换模型。
- 可将一张程序生成的低频 gradient map 固定在屏幕上，从四角/四边按不同时间分批揭示。

**可以借什么**

- mix map 的通道职责分离。
- gradient × amount 的冻结进度结构。
- normal offset 折射，以及 density 控制厚冰色的合成方式。

**许可证、性能与适配风险**

- 仓库 MIT；但 shader 中 `ice_tiler` 明确注明来自外部 Shadertoy，许可链不清。建议只借 mix-map/gradient 架构，不复制 tiler。
- 中等开销，主要是数次纹理采样和折射场景采样。
- 需要自己程序生成或手工制作 mix map；若直接使用写实纹理会与 SAKURA 冲突。
- SAKURA 适配度：**高**，前提是 map 采用低频、少块、低模配色。

### 候选 S4：Phase Transition 连续冰面材质

一级来源：

- [Robert Leitl 作者原仓库](https://github.com/robert-leitl/phase-transition)
- [作者在线 Demo](https://robert-leitl.github.io/phase-transition/dist/?debug=true)
- [核心冰纹 shader](https://github.com/robert-leitl/phase-transition/blob/main/src/app/shader/texture.frag.glsl)
- [MIT 许可证](https://github.com/robert-leitl/phase-transition/blob/main/LICENSE)

**长什么样**

- 连续冰面上有深浅、凹凸、裂纹和视差层次，但不是由许多屏幕多边形拼起来。
- 原项目同时输出 ice texture、displacement 和 normal，因此高光会随表面层次变化。
- 适合作为“D3 Contour 形状里面填什么”的材质参考。

**动态怎么动**

- 原项目有纹理状态过渡；可用同一结构让薄霜逐渐增加厚度、normal 和冷色。
- 生长边界仍应交给独立的平滑 contour mask，不能把整个冰纹平面一次淡入。

**可以借什么**

- 冰色、位移/厚度和 normal 分开输出的架构。
- 少量低频 Voronoi 只用于冰内层次，不用于切割外轮廓。
- 状态之间逐步插值。

**许可证、性能与适配风险**

- MIT。
- 原 shader 含多次 3D Voronoi 和最高 25 层 FBM，完整照搬开销高；应缩减为 1–2 层低频场，启动时生成小纹理。
- 原 Demo 是球面等距柱状 UV，需要改为普通 screen UV。
- SAKURA 适配度：**中高**。必须去除密集细纹和过强 bloom。

### 候选 S5：Reaction-Diffusion 连续细霜枝

一级来源：

- [Linus Mossberg 作者原仓库](https://github.com/linusmossberg/reaction-diffusion)
- [作者在线 Demo](https://linusmossberg.github.io/reaction-diffusion)
- [MIT 许可证](https://github.com/linusmossberg/reaction-diffusion/blob/master/LICENSE)

**长什么样**

- 连续、圆滑的分叉、指纹和蕾丝状生长，没有硬多边形面板。
- 适合只补少量沿大冰区内缘生长的细霜枝。

**动态怎么动**

- GPU ping-pong texture 持续演化，形状确实从已有种子继续长出，不是 opacity 播放。
- 从屏幕四边种少量点，运行低分辨率模拟，约 0.8 秒后再让主体大冰区出现。

**可以借什么**

- Gray-Scott 双场更新、五点邻域采样和 ping-pong render target。
- 初始边缘种子与 anisotropic diffusion 参数。

**许可证、性能与适配风险**

- MIT。
- 中高开销；建议最多 256×144、每帧 2–4 次迭代，只作为小比例细节。
- 参数稍偏就会像细菌、珊瑚或黏液，不适合作为主体冰框。
- SAKURA 适配度：**中低（主体）/中高（少量细节）**。

## 线缆包冰候选

### 候选 C1：Robert Rumney Frozen Shader 的整线霜化层

一级来源：

- [作者原仓库](https://github.com/robertrumney/frozen-shader)
- [原始 IceShader](https://github.com/robertrumney/frozen-shader/blob/main/IceShader.shader)
- [MIT 许可证](https://github.com/robertrumney/frozen-shader/blob/main/LICENSE)

**长什么样**

- 不增加一根规则外管，而是在原物体表面叠加冰色、normal、光泽、折射环境色和边缘散射。
- 适合做“整根线、插头、衔接、尾环和尾帽都先蒙上一层霜”的基础层。
- 轮廓仍然保持原线可识别，粗厚感由后续少量大冰块负责。

**动态怎么动**

- 沿现有 `aCableProgress` 增加 coverage，霜层从技能起点向末端推进。
- `FrozenAmount` 可驱动冷色、normal 强度、粗糙度和 rim；稳定后不继续流动。

**可以借什么**

- normal map/程序 normal、环境折射方向和 fake subsurface rim 的组合。
- Unity HLSL 需重写成当前 Three.js `onBeforeCompile` GLSL。
- 原 shader 中 `_FrozenAmount` 实际只直接乘在 rim scatter 上，并不是完整 coverage；路径冻结阈值仍需本项目自己实现。

**许可证、性能与适配风险**

- MIT，低开销，适合作为所有冻结部件的统一基础材质。
- 单独使用只会像“物体变冷、结霜”，不会形成有厚度的包冰；必须配合少量大冰块。
- 原仓库使用 normal texture；本项目可程序生成一张低频霜纹，避免外部图片资产。
- SAKURA 适配度：**高**。霜层强度和色阶容易做成卡通。

### 候选 C2：Three.js 官方 MarchingCubes 大块融合冰

一级来源：

- [Three.js 官方 Marching Cubes Demo](https://threejs.org/examples/webgl_marchingcubes.html)
- [官方示例源码](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_marchingcubes.html)
- [`MarchingCubes` 官方 addon 源码](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/MarchingCubes.js)
- [Three.js MIT 许可证](https://github.com/mrdoob/three.js/blob/dev/LICENSE)

**长什么样**

- 少量球状场互相融合后形成连续、圆润、不规则的蜡封/冰瘤轮廓。
- 不会保持原线规则半径，也不会出现一整根密集三角切面管。
- 低分辨率时自然带一点大块低模感，符合 SAKURA。

**动态怎么动**

- 沿路径选择 4–7 个关键位置，每个位置放 1–2 个不同大小的 field ball。
- 这些冰块按路径顺序从小到大出现；相邻场在成长时逐渐融合。
- 最终几何生成后固定，不在持续状态中重算。

**可以借什么**

- `MarchingCubes.addBall()`、`isolation` 与低分辨率标量场。
- 可在技能触发时预生成最终几何，再用局部 scale/coverage 揭示；无需每帧重跑完整 marching cubes。

**许可证、性能与适配风险**

- Three.js MIT，当前项目已有依赖，无需新增库。
- 每帧实时重建会贵；建议 12–20 网格分辨率、少量 field ball，并在创建后冻结 geometry。
- 长线若塞太多球会重新变成均匀香肠；必须只选少数转角、插头根部和尾部形成大结块。
- SAKURA 适配度：**很高**。少块、大轮廓、易做 toon/physical 两套材质。

### 候选 C3：Three.js 官方 Physical Transmission 平滑大冰块

一级来源：

- [Three.js 官方 Physical Transmission Demo](https://threejs.org/examples/webgl_materials_physical_transmission.html)
- [官方示例源码](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_physical_transmission.html)
- [`MeshPhysicalMaterial` 官方文档](https://github.com/mrdoob/three.js/blob/dev/docs/pages/MeshPhysicalMaterial.html.md)
- [Three.js MIT 许可证](https://github.com/mrdoob/three.js/blob/dev/LICENSE)

**长什么样**

- 平滑透明冰内能看到原线，但经过 thickness、IOR 和 attenuation 后产生蓝青吸收与位置错位。
- 适合 MarchingCubes 生成的 4–7 个大冰块，不适合再次包成一整根规则壳。

**动态怎么动**

- 每块冰从 0.65 缩放到 1，同时 thickness、transmission 和 attenuation 从薄霜过渡到厚冰。
- 不用 opacity 从 0 淡到 1；Three.js 官方明确要求 transmission 非零时 opacity 应为 1。

**可以借什么**

- 官方 transmission、thickness、IOR、attenuationColor/Distance 与环境贴图关系。
- 共用一个材质，合并最终大冰块 geometry，控制 draw call。

**许可证、性能与适配风险**

- MIT，中等像素开销。
- 多个透明块互相重叠会有排序/透射限制；应尽量合并几何，并避免沿相机深度重叠太多。
- 没有环境高光会像透明胶；应使用稳定冷暖环境反射，并把 transmission 控制在中等，不做完全透明玻璃。
- SAKURA 适配度：**高**，前提是轮廓来自少量大块且色彩明显。

### 候选 C4：Drei MeshTransmissionMaterial 的夸张卡通折射

一级来源：

- [Drei 官方文档与 Demo](https://drei.docs.pmnd.rs/shaders/mesh-transmission-material)
- [作者原始源码](https://github.com/pmndrs/drei/blob/master/src/core/MeshTransmissionMaterial.tsx)
- [MIT 许可证](https://github.com/pmndrs/drei/blob/master/LICENSE)

**长什么样**

- 在普通 physical transmission 上增加可调色散、anisotropic blur、distortion、backside thickness 和多次折射采样。
- 低强度色散和短暂 distortion 能让大冰块更风格化，不需要增加几何切面。

**动态怎么动**

- 大冰块生成瞬间提高少量 distortion，0.4–0.8 秒后回落；稳定时只保留厚度和轻微色散。
- 内部原线发生可读的小幅错位，而不是被一个蓝色外描边盖住。

**可以借什么**

- 局部 FBO、backside pass、refraction samples 和 Beer-Lambert attenuation 结构。
- 当前项目不是 React Three Fiber，不能直接使用该组件；只能移植必要 shader 思路。

**许可证、性能与适配风险**

- MIT，中高开销；默认多采样和 backside 不适合所有线缆同时开启。
- 只建议作为高画质档或 1–2 块主要冰块的增强，不应成为基础路径。
- 整体引入 Drei/React Three Fiber 不值得，会破坏现有架构。
- SAKURA 适配度：**中高**，但性能风险高于原生 Three.js。

### 候选 C5：Godot Ice Shader 的光滑冰面结构

一级来源：

- [作者原仓库](https://github.com/nekotogd/Godot_Ice_Shader)
- [原始 `Ice3D.shader`](https://github.com/nekotogd/Godot_Ice_Shader/blob/main/Ice3D.shader)
- [CC0 许可证](https://github.com/nekotogd/Godot_Ice_Shader/blob/main/LICENSE)

**长什么样**

- 一个光滑壳体通过 Fresnel、screen texture refraction、normal 和冷色形成冰材质。
- 比密集低模晶面更连续，适合少量大冰块或平滑薄壳。

**动态怎么动**

- 原项目没有完整冻结时间线；需要本项目自己给 coverage、normal strength、refraction amount 和颜色添加 progress。
- 可先出现奶白表面霜，再逐步提高屏幕折射。

**可以借什么**

- Fresnel、screen texture offset/refraction 和 normal blending 的职责分离。
- CC0 代码可自由重写，但原 shader 需要 Ice_Texture；本项目不应搬贴图，应使用程序低频纹理。

**许可证、性能与适配风险**

- CC0，低到中等开销。
- 视觉本身偏普通游戏冰材质，缺少独特轮廓；必须配 MarchingCubes 大块才能明显区别于透明胶。
- SAKURA 适配度：**中**，适合作为低风险材质备选，不适合作为完整方案。

## 推荐的三条方向

### 方向 A：连续大冰舌屏幕 + 霜化线缆 + 少量融合冰块（首选）

**屏幕**

- 用低分辨率标量场和 Marching Squares/D3 Contour 生成 4–8 块连续大冰舌。
- 形状从不同边缘延迟出生，逐渐融合；中央保留不规则清晰区。
- 冰舌内部使用简化 Canvas UI Frost/Phase Transition：一层 broad height、一层 fine height、奶白薄霜、蓝灰阴面、1–2 像素折射。
- 不使用 Voronoi 外轮廓，不使用全屏 blur。

**线缆**

- 原线和所有部件先使用 Frozen Shader 思路整体霜化。
- 仅在插头根部、2–3 个线身转角和尾部生成共 4–7 个 MarchingCubes 大冰块。
- 大冰块共用官方 MeshPhysicalMaterial；主体冰青/奶白，内部原线只保留约 25%–35% 视觉权重。

优点：同时解决断节冰框、规则套管和三角面过密；最符合 SAKURA 的大形状设计。  
风险：需要做一次新的标量场/大冰块几何生成器，但不需要新运行时依赖。

### 方向 B：地图驱动的可控美术版本（最稳定）

**屏幕**

- 使用 Andrea 的 mix-map 架构，但由项目程序生成 2–3 张固定 SAKURA gradient map 变体。
- 每张只含几块大而圆润的冻结区、少量细霜枝和明确的厚薄分区。
- 运行时只推进 amount/steepness，不进行实时模拟。

**线缆**

- 表面霜层为主，只增加 3–5 个手工规则生成的大冰帽；不用 MarchingCubes 实时更新。

优点：美术最可控、性能最低、截图最稳定。  
风险：图案随机性低，需要准备多套 seed 或程序 map，避免每局完全相同。

### 方向 C：纯卡通不透明冰霜（性能与风格保险）

- 屏幕只做连续浅青/奶白霜边、两级高光和独立冷色渐变，关闭背景 blur 与高成本折射。
- 线缆把霜层变成主要颜色，增加 3–5 个不透明浅青冰块；只保留小面积亮面，不使用 transmission。
- 原线颜色通过局部裂口或约 20%–30% 的材质混合辨认，而不是物理透射。

优点：不会出现透明排序、塑料感或写实效果与 SAKURA 冲突，性能最低。  
风险：物理真实感最弱，需要靠轮廓、冷色环境和生长动画说明它是冰而不是油漆。

## 不建议继续尝试

- 不再用 Voronoi cell 作为屏幕冰层外轮廓；Voronoi 只可非常轻地用于冰层内部深浅。
- 不再让线缆外壳逐环产生大量三角晶面；少量大面/圆润融合块更符合当前反馈。
- 不再通过低 opacity 让完整规则管壳淡入；它仍会读成透明套管。
- 不把 reaction-diffusion 当主体，它容易变成细菌/珊瑚。
- 不完整移植 Canvas UI Frost 的模糊、Phase Transition 的 25 层 FBM 或 Drei 的全部多采样。
- 不下载写实冰纹照片；所有 mask、height 和大冰块应程序生成，保持 SAKURA 风格一致。

## 建议下一次只做的最小样片

不要立刻重做完整冰箱技能。先做一个可逆的小样：

1. 屏幕只生成左上、右侧和底部三块平滑大冰舌，2.5 秒内逐渐融合；不加细枝。
2. 冻结一根线：先整体霜化，再只在插头根部、一个弯折处和尾部放三块 MarchingCubes 融合冰。
3. 同时提供透明 physical 与不透明 toon 两种材质开关。
4. 截取白天正面、白天旋转、夜晚正面三张对比后，再决定正式方向。

