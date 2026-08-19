# 冰箱技能 V2：真实冰壳、晶面折射与屏幕霜晶生长

研究日期：2026-08-18  
范围：只使用一级来源，包括 Three.js 官方文档/源码/示例、算法作者页面、作者原仓库和论文。本文只给实现方案，不修改运行时代码。

## 结论

当前效果继续调蓝色、透明度或噪声强度不会解决问题。两个主要问题都属于结构错误：

1. **线缆冰壳仍是规则管体的外扩**。它虽然比原线粗，却保持相近的连续轮廓，因此更像蓝灰外描边或透明套管，而不是结块的冰。
2. **屏幕冰片仍由连续厚度场生成**。`LinearFilter`、较宽的 `smoothstep` 和由厚度梯度推导出的法线共同抹软了边缘；所有折射方向也随这个平滑梯度变化，因此没有平整晶面的硬折射。

推荐换成下面四个结构：

- 线缆使用沿真实路径重建的**不规则低面数分块冰壳**，而不是克隆原 Tube 后统一沿法线外移。
- 冰壳材质使用正确的物理 transmission/volume 参数和逐面的离散色阶；冰晶色成为主色，原线只作为壳内可见物。
- 屏幕将**生长场、几何覆盖、晶面法线**分成不同数据，晶片边缘只保留约 1 像素抗锯齿，不再把整块冰片滤糊。
- 冷色背景先渐变，霜晶再从分散的边缘种子逐片长出；触发瞬间不能先出现一个完整矩形框。

这套实现不需要新增 npm 依赖。Three.js 当前已有的 `Curve.computeFrenetFrames`、`BufferGeometry`、`DataTexture`、`MeshPhysicalMaterial` 和全屏后处理足够完成。

## 当前实现为何仍然不像冰

### 线缆冰壳

当前 `src/render/CableGeometry.ts` 的冰壳实现有三处关键限制：

- `createCableIceShellGeometry()` 克隆现有线缆几何，再按原顶点法线增加半径；虽然按 13 个 path band 改变厚度，但每个截面仍继承原线的规则八边形拓扑。
- 壳体是连续的一整根管，缺少偏心积冰、不同大小的冰块、局部楔面、交错接缝和少量突出的晶角。
- 材质使用 `transmission: 0.08`、`transparent: true`、`opacity: 0.82`。Three.js 官方文档明确说明，启用非零 transmission 时 `opacity` 应设为 `1`；当前组合主要表现为普通 alpha 叠色，而不是有厚度的物理透射。[Three.js `MeshPhysicalMaterial` 官方文档](https://github.com/mrdoob/three.js/blob/dev/docs/pages/MeshPhysicalMaterial.html.md)

因此现状能表达“冻线状态”，却很难表达“原线被一层有体积、有折射面的冰包住”。

### 屏幕冰片

当前 `src/style/RefrigeratorFrostField.ts` 把 reveal time、thickness 和 facet id 放进一张 384×240 `DataTexture`，并给整张纹理设置 `LinearFilter`。随后 `src/style/post.ts` 用 thickness 的四邻域差值生成 `frostNormal`。

这会产生两个直接结果：

- facet id 和厚度一起被双线性插值，原本离散的晶面在边界上混成连续渐变。
- 折射法线来自被滤软的厚度场，冰片内部没有稳定的平面法线，只有柔和的边缘起伏，所以视觉更像模糊玻璃。

另外，当前边缘底层先根据 `edgeDistance < edgeReach` 生成连续框，再叠加晶枝；低 reveal time 使这圈底层在触发早期迅速出现。它虽然不是完全瞬切，但第一眼仍会读成“突然套上一个框”。

## 一级来源与可借用结构

| 一级来源 | 已确认的原始机制 | 对当前项目的用法 |
|---|---|---|
| [Three.js `TubeGeometry` 官方源码](https://github.com/mrdoob/three.js/blob/dev/src/geometries/TubeGeometry.js) | 官方实现用曲线的 Frenet tangents、normals、binormals 逐环生成管体 | 沿同一线缆路径生成自定义冰壳环；每环可独立改变半径、椭圆比例、中心偏移和角度 |
| [Three.js `BufferGeometry` 官方文档](https://github.com/mrdoob/three.js/blob/dev/docs/pages/BufferGeometry.html.md) | 非索引几何的 `computeVertexNormals()` 会给每个三角形设置独立面法线；索引几何会平均共享顶点法线 | 冰壳转为 non-indexed 后重算法线，得到真正硬朗的低模折射面，而不是管体平滑法线 |
| [Three.js `MeshPhysicalMaterial` 官方文档](https://github.com/mrdoob/three.js/blob/dev/docs/pages/MeshPhysicalMaterial.html.md) | 提供 transmission、thickness、IOR、attenuationColor/Distance、clearcoat；官方要求 transmission 非零时 opacity 为 1，并建议配环境贴图 | 让浅青冰体成为主材质，同时通过物理透射看见内部原线；不再靠普通透明叠色 |
| [Three.js physical transmission 官方示例](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_physical_transmission.html) | 展示 thickness、attenuation、roughness、IOR 与环境照明共同决定玻璃/体积材质观感 | 直接参考参数关系和渲染路径；不复制示例模型或贴图 |
| [Warren & Brandt, 2008，冰的光学常数论文](https://doi.org/10.1029/2007JD009744) | 汇编并修订冰从紫外到微波的复折射率 | 可继续以约 1.31 作为可见光冰的 IOR 基准，但游戏中仍应优先保证低模可读性 |
| [Theodore Kim 与 Ming Lin：Visual Simulation of Ice Crystal Growth](https://www.tkim.graphics/ICE/) | 作者用 phase-field 模拟枝晶生长，并专门用 geometric sharpening 去除隐式场造成的平滑伪影；还把方法用于 3D 物体表面 | 不移植完整数值模拟，只借“从种子分枝生长”和“最后几何锐化”两层结构 |
| [Material Maker `Crystal` 原始节点](https://github.com/RodZill4/material-maker/blob/master/addons/material_maker/nodes/crystal.mmg) / [作者文档](https://github.com/RodZill4/material-maker/blob/master/material_maker/doc/node_noise_crystal.rst) | Crystal 节点并非单层噪声，而是组合两组不同 seed 的 Voronoi，再做数学组合形成晶体图案 | 借两层独立 cell field 的结构制作大小不一、方向不同的冰片；无需安装 Material Maker 运行时 |
| [Material Maker Voronoi 作者文档](https://github.com/RodZill4/material-maker/blob/master/material_maker/doc/node_noise_voronoi.rst) | 节点分别输出到特征点距离、到 cell bisector 距离和稳定 cell fill 信息 | 分开存“晶片覆盖/边界”和“每片稳定属性”，不要再让 thickness 同时承担所有职责 |
| [Iñigo Quílez：Voronoi edges](http://iquilezles.org/articles/voronoilines/) | 作者解释了 `F2-F1` 不是正确边界距离，并给出到相邻 cell 平分线的稳定距离算法 | 用正确 cell-border distance 生成等宽、不断裂的锋利晶片接缝；只重写数学结构，不复制页面资源 |
| [Witten 与 Sander：Diffusion-Limited Aggregation 原始论文](https://doi.org/10.1103/PhysRevLett.47.1400) | 提出扩散限制聚集模型，形成由种子向外发展的分枝聚集结构 | 只借“离散种子、分枝、不同出生时间”的形态，不在运行时照搬粒子模拟 |
| [Robert Leitl `phase-transition` 作者原仓库](https://github.com/robert-leitl/phase-transition) / [核心冰纹 shader](https://github.com/robert-leitl/phase-transition/blob/main/src/app/shader/texture.frag.glsl) | 原始 WebGL2 shader 以多层 Voronoi 和 FBM 同时生成冰色、位移数据和 normal 输出 | 直接参考“冰纹数据与 normal 分开输出”的前端结构；压缩为两层 Voronoi，不能原样使用其最高 25 层 FBM |
| [Three.js `DataTexture` 官方文档](https://github.com/mrdoob/three.js/blob/dev/docs/pages/DataTexture.html.md) | 可从 typed array 建立程序纹理，并独立选择 min/mag filter | 将连续生长/SDF 与离散 facet normal/id 拆成两张采用不同过滤方式的纹理 |
| [Three.js 自定义后处理官方示例](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_custom.html) / [`ShaderPass` 源码](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/ShaderPass.js) | 使用场景纹理和全屏 shader 合成自定义画面效果 | 继续放在现有 `FullScreenQuad` 后处理，不增加 DOM 层或新的特效框架 |

Material Maker 是 MIT 许可，[原仓库许可证](https://github.com/RodZill4/material-maker/blob/master/LICENSE.md)。本项目只需要重写其“两组 Voronoi + 分离 cell 属性”的结构，不需要引入 Godot 或 Material Maker 依赖。

## 方案一：重建不规则分块线缆冰壳

### 1. 不再从原 Tube 顶点做统一法线外移

保留原线几何和原色。为冰壳新增一个 `buildCableIceShell(path, seed)`，直接使用路径采样点与 Frenet frame 生成 5–7 边形截面。Three.js 官方 `TubeGeometry` 源码已经给出同样的 frame 生成方式，可直接使用现有 `curve.computeFrenetFrames()`，无需依赖新库。

每个截面环不只变化一个 radius，而是独立具有：

- `radiusN` / `radiusB`：两个方向不同的半径，形成不规则椭圆和楔面；
- `centerOffsetN` / `centerOffsetB`：让积冰偏向一侧，不始终与原线同心；
- `phaseRotation`：相邻环轻微扭转，使长边不会全部平行；
- 5–7 个独立 vertex radii：同一个截面也不能保持等距正多边形；
- 3–6 个环组成一块冰段，下一块重新取 seed，并与前一块轻微交叠或收腰。

建议轮廓范围：

- 大部分位置超出原线半径约 35%–70%；
- 收腰处约 20%–30%；
- 少量晶角可达到 85%–105%，但只占局部一两个顶点；
- 中心偏移约原线半径的 8%–24%，方向按块变化。

这样轮廓会变成“多块冰沿线冻结并连接”，而不是“把线整体放大一圈”。

### 2. 面必须是真正独立的低模晶面

几何生成完成后转为非索引几何，再调用 `computeVertexNormals()`。Three.js 官方 `BufferGeometry` 文档说明：非索引几何不会共享顶点，计算出的 normal 就是各三角形的 face normal。这是获得硬晶面最直接的官方路径。

同时给每个三角形写入同值的 `color` 或自定义 `aFacetTone`：

- 约 55% 使用主冰青；
- 约 25% 偏奶白亮面；
- 约 20% 偏蓝灰阴面；
- 色差只按面离散变化，禁止沿线画白蓝条纹。

晶面能否被看见主要应来自**面法线、环境反射、厚度和逐面色阶**，不是 emissive 纹路。

### 3. 物理材质改成“冰为主、原线隐约可见”

Three.js 官方文档给出的关键约束是 transmission 非零时 opacity 应为 1。建议候选参数从下面范围开始视觉调试：

```ts
new THREE.MeshPhysicalMaterial({
  color: 0x9bcfe0,
  vertexColors: true,
  flatShading: true,
  roughness: 0.18,
  metalness: 0,
  transmission: 0.38,
  opacity: 1,
  transparent: false,
  ior: 1.31,
  thickness: localShellThickness,
  attenuationColor: 0x8fc7dc,
  attenuationDistance: shellWorldThickness * 2.2,
  clearcoat: 0.65,
  clearcoatRoughness: 0.22,
});
```

这是起始区间，不是最终常数。关键关系是：

- `transmission` 从当前 0.08 提高到约 0.30–0.48，才有可见折射；
- `opacity` 改为 1，避免退化成普通透明叠色；
- 冰晶主色和 attenuation 明显增强，让远看时先读成冰青体积，再在近处看见内部原线；
- `roughness` 降低，但保持一定 clearcoat roughness，避免像完全光滑玻璃；
- 环境贴图或稳定的场景环境反射必须存在。Three.js 官方文档明确建议 `MeshPhysicalMaterial` 配环境贴图，否则 transmission/clearcoat 很难读出来。

若当前场景环境不足，可为冰壳准备一个很小的程序化冷暖环境纹理或复用现有环境；不要用发光白线代替反射。

### 4. 插头与尾部也使用同一个分块规则

线身、衔接、蓝色插头头部、接触点、尾环和尾帽仍需整体冻结，但不能统一 scale 一份规则外壳。

建议建立共享的 `IceHullProfile`：

- 盒状部件：用不等比例膨胀的 6–10 面 convex-like 外壳，角点各自扰动；
- 圆柱/圆环：沿轴分 2–4 个不规则环，每环独立旋转和偏心；
- 接触点：只覆盖薄冰和少量根部结晶，保留插片轮廓可辨认；
- 不同部件共用同一套材质和 seed 派生规则，视觉上仍是一整层冰。

## 方案二：屏幕边缘改成锋利冰片生长

### 1. 将一张 FrostField 拆成两张数据纹理

**Texture A：连续生长场，LinearFilter**

- R：每个像素或每块晶片的 birth time；
- G：signed distance / coverage distance；
- B：局部厚度；
- A：可选 branch strength。

**Texture B：离散晶面场，NearestFilter**

- RG：每块冰片固定的 2D facet normal，编码到 0–1；
- B：facet id 或 seam distance；
- A：逐片色阶/折射强度。

这样做的原因不是追求更多纹理，而是不同数据的采样规则相反：生长距离需要连续插值，晶面 id 和面法线绝对不能跨边界线性混合。Three.js `DataTexture` 官方 API 已支持分别设置过滤方式。

### 2. 冰片形状使用“枝晶骨架 × 双 Voronoi 晶面”

参考 Kim/Lin 的 phase-field 结构，从四边和四角建立离散种子，每个种子产生一条主枝和 1–3 级侧枝；但不运行完整 phase-field 模拟。启动时在 CPU 上生成固定的 birth field 即可。

覆盖形状使用两层尺度：

- 大尺度 cell：形成主要冰片和明显折射面；
- 小尺度 cell：只在大冰片边缘或厚冰区形成次级碎面；
- 两层使用不同 seed 和略不同拉伸方向，结构来自 Material Maker 的 `Crystal` 原始节点；
- 用 Quílez 的 cell bisector distance 计算接缝，避免 `F2-F1` 导致接缝忽粗忽细或三岔口破损。

不要先生成一整圈连续 edge frame。正确顺序是：

1. 四角和四边的 12–20 个种子分别出生；
2. 主枝向内推进；
3. 只有主枝经过的 cell 才逐片结冰；
4. 相邻冰片在后期连接成断续边缘，但始终保留空隙和不规则深入距离。

### 3. 锋利不是关闭所有抗锯齿

冰片几何边界应保持硬，但仍需要约 1 像素的屏幕空间抗锯齿：

```glsl
float aa = max(fwidth(frostSdf), 0.75 * uFrostFieldTexel.x);
float shape = smoothstep(aa, -aa, frostSdf);
```

当前 `smoothstep(frostData.r - 0.045, frostData.r + 0.07, cold)` 是生长时间的软过渡，可以保留为“该冰片逐渐显现”；但它不能同时决定几何边缘软硬。必须将：

- **时间 alpha**：一块冰出生后约 0.18–0.32 秒从 0 到 1；
- **空间边界**：始终只有约 1 像素 AA；

拆开计算。这样才能同时满足“逐渐出现”和“冰片边缘锋利”。

### 4. 折射法线必须在每个晶面内部稳定

当前从 thickness 梯度计算 normal，只适合连续水滴或磨砂玻璃。新实现应直接读取 Texture B 的 facet normal：

```glsl
vec2 facetNormal = texture2D(uFrostFacet, facetUv).rg * 2.0 - 1.0;
vec2 refractedUv = uv + facetNormal * uTexel * facetRefractionPixels;
```

- 同一冰片内部保持近似相同的折射方向；
- 到 seam 处法线突然改变，才会读成多个平面；
- thickness gradient 只用于最外缘的亮边和厚度变化，不再决定整个冰片的法线；
- 每片折射约 1.5–4.5 像素，按 thickness 分级，避免再次变成全屏模糊。

## 方案三：中间暖色逐渐转成冷色背景

冷色不能只依附于 frost mask，因为中央区域需要保持玩法清楚，却也必须让玩家感到整个空间变冷。建议把全屏冷色作为独立的第一阶段：

```glsl
float coldBase = smoothstep(0.02, 0.42, uEffectProgress);
float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
float coldEdge = 1.0 - smoothstep(0.0, 0.34, edgeDistance);
float coldTop = smoothstep(0.18, 1.0, uv.y);

vec3 coolGrade = color * mix(
  vec3(0.78, 0.88, 1.00),
  vec3(0.92, 0.97, 1.03),
  luma
);

float gradeAmount = coldBase * (0.24 + coldEdge * 0.10 + coldTop * 0.035);
color = mix(color, coolGrade, gradeAmount);
```

目标视觉：

- 中央暖色在约 0.8–1.3 秒内明显降温，但线的身份色仍然可读；
- 四周比中央再冷约 8%–12%，为后续冰片提供环境铺垫；
- 白天效果比夜晚强，夜晚只增加蓝青分量，不继续压暗；
- UI 不经过这个后处理，只影响 Three.js 游戏画面。

## 推荐时间线：不再触发瞬间出现完整冰框

沿用冰箱约 5.2 秒演出，可按以下阶段映射同一个 `uEffectProgress`：

| 时间 | 冷色背景 | 屏幕冰晶 | 线缆冰壳 |
|---|---|---|---|
| 0.00–0.35s | 保持原画面 | 完全不可见 | 完全不可见 |
| 0.35–1.10s | 中央与背景逐渐降温 | 四角/四边少量种子以低 alpha 出现，不形成连续框 | 插头或冻结起点出现第一块薄冰 |
| 0.80–2.40s | 冷色达到约 80% | 主枝分批向内生长，大冰片逐片显现 | 分块冰壳沿真实线缆路径推进 |
| 2.20–3.60s | 冷色达到峰值 | 大小晶片连接，facet refraction 与接缝变清楚 | 线身、插头、衔接和尾部完成包覆 |
| 3.60–5.20s | 稳定 | 保留锋利霜晶和少量晶面亮度变化，不漂移形状 | 保持完整冰壳 |
| 状态持续 | 降至峰值约 80% | 边缘覆盖保持，中央玩法区清楚 | 冰壳完整保持直到 debuff 解除 |

每块冰片自身可渐隐出现，但不存在“先画出完整半透明矩形，再逐渐变实”的阶段。

## 不引入重依赖的落地方式

### 可以直接借结构

1. **Three.js TubeGeometry 的 frame/ring 生成方式**：项目已安装 `three`，直接复用核心 API。
2. **Three.js MeshPhysicalMaterial transmission 示例的参数关系**：项目已经在用该材质，只需要改正确配置。
3. **Material Maker 双 Voronoi Crystal 的组合结构**：在启动时用现有 TypeScript hash/value functions 重写，不安装 Godot 或 Material Maker。
4. **Quílez 的 Voronoi border distance 数学**：只实现需要的 bisector distance，不引入 noise 包。
5. **Kim/Lin 的枝晶种子、生长与 geometric sharpening 概念**：生成一次 birth/SDF texture；不运行完整 phase-field solver。
6. **Robert Leitl 的多目标冰纹输出结构**：借其独立输出 ice/displacement/normal 的职责分离，但不复制高开销的 3D Voronoi 与 25 层 FBM。

### 不建议引入

- 不引入 React Three Fiber / drei，仅为了一个 transmission material 会扩大运行时架构。
- 不引入完整 Material Maker、Godot 或实时 phase-field 模拟。
- 不原样移植 `phase-transition` 的多次 3D Voronoi 与最高 25 层 FBM；它适合作为晶面法线参考，不适合作为当前游戏的每帧主 pass。
- 不使用照片冰纹、GPT 生成贴图或全屏 blur。
- 不把 Voronoi 每像素多层实时计算堆进最终主 pass；在启动时预计算两张小型 `DataTexture` 更稳定。

### 性能建议

- 线缆：只为实际冻结目标建立冰壳；每条线一份线身 shell，部件壳尽量共享 2–3 个材质变体。
- 屏幕：Texture A 可为 512×320 linear；Texture B 可为相同或半分辨率 nearest。两张 RGBA8 仍远小于新增全屏多级模糊成本。
- transmission 是高成本项；低画质可把 transmission 降到 0.12–0.2，但必须保留不规则几何、逐面色阶和冷青主色，不能退回普通外描边。
- 冻结形状一旦生成就固定；每帧只更新 progress、冷色强度和非常轻的晶面亮度，不重新上传纹理。

## 最值得采用的五个实现结构

1. **自定义 Frenet 分块冰壳**：沿原线真实路径重建偏心、扭转、粗细不一的 5–7 边截面，并按 3–6 环切换一块冰的 profile。这是解决“规则外描边感”的第一优先级。
2. **non-indexed 硬面法线 + 逐面离散色阶**：让折射面来自真实几何，不再靠白蓝纹路假装冰晶。
3. **正确的 MeshPhysicalMaterial volume**：`opacity = 1`、中等 transmission、thickness、attenuation 和环境反射共同工作，让主色先读成冰晶色，同时隐约看到内部线色。
4. **双纹理 Frost Field**：连续 birth/SDF 用 linear，离散 facet normal/id 用 nearest；屏幕冰片的几何边界和折射面不再互相滤糊。
5. **枝晶骨架 × 双 Voronoi 晶面 × 分阶段时间线**：分散种子逐片长出，冷色先铺垫，冰片再形成；不会在技能触发瞬间出现完整难看的矩形冰框。

## 建议实施顺序

1. 先重建一根测试线的分块冰壳，只验证轮廓、硬晶面、冰晶主色和内部线可见度。
2. 把同一 `IceHullProfile` 扩展到插头、衔接、接触点、尾环和尾帽。
3. 将屏幕 FrostField 拆成 birth/SDF 与 facet 两张纹理，先验证静态冻结画面是否锋利。
4. 最后接入 5.2 秒时间线，保证冷色、种子、晶枝、冰片和线缆冰壳逐层出现。
5. 浏览器正面与旋转视角都通过后，再检查白天、夜晚、hover、持续三回合和解除冻结。
