# 高度透明球形薄膜虹彩护盾研究

> 研究日期：2026-08-24  
> 项目环境：Three.js `^0.184.0`  
> 范围：只研究适合“正向 BUFF、低遮挡、包围整组线缆”的球形薄膜虹彩表现，不实施动画。

## 结论摘要

最适合当前 SAKURA 风格的不是实心玻璃球、粗描边圆环或高折射护罩，而是：

1. 用一个平滑球形壳体包围全部线组；
2. 球心区域几乎透明，只在掠射角出现柔和 Fresnel 薄边；
3. 使用 Three.js `MeshPhysicalMaterial.iridescence` 生成基于视角、光照和膜厚的虹彩；
4. 用低频厚度噪声形成大块、缓慢漂移的粉、青、淡金、薰衣草反射；
5. 使用 `transparent: true`、`depthWrite: false`、保留 `depthTest: true`；
6. 不启用 `transmission`、实时折射、双层球壳和大量粒子。

**关键判断：`MeshPhysicalMaterial.iridescence` 只改变镜面反射的颜色，不会自动生成“中心透明、边缘可见”的泡泡膜。最终仍需要 Fresnel 驱动 alpha，推荐通过 `onBeforeCompile` 注入，或写一个精简的自定义 `ShaderMaterial`。**

## 1. 可复用技术点

### 1.1 Three.js `MeshPhysicalMaterial.iridescence`

Three.js 把虹彩作为 `MeshPhysicalMaterial` 的物理材质层，官方说明它用于肥皂泡、油膜、昆虫翅膀等颜色随观察角度和照明角度变化的表面。

可直接使用的属性：

- `iridescence`：虹彩强度，范围 `0.0～1.0`，默认 `0`。
- `iridescenceIOR`：薄膜折射率，默认 `1.3`。
- `iridescenceThicknessRange`：薄膜最小/最大厚度，单位纳米，默认 `[100, 400]`。
- `iridescenceMap`：红色通道控制每像素虹彩强度。
- `iridescenceThicknessMap`：绿色通道在厚度范围内插值，控制每像素膜厚。

对本项目的意义：让 Three.js 负责物理虹彩颜色，用小型低频纹理控制膜厚，不要用固定 HSV 彩虹渐变冒充薄膜干涉。官方同时指出 `MeshPhysicalMaterial` 的每像素成本高于 `MeshStandardMaterial`，并建议提供环境贴图。因此本效果只应启用虹彩，不同时开启 transmission、clearcoat、dispersion、anisotropy 等无关分支。

资料：

- [Three.js MeshPhysicalMaterial 文档](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- [Three.js r184 MeshPhysicalMaterial 源码](https://github.com/mrdoob/three.js/blob/r184/src/materials/MeshPhysicalMaterial.js)

### 1.2 Three.js 官方虹彩示例

官方 `webgl_loader_gltf_iridescence` 示例使用 `GLTFLoader` 加载 Khronos Iridescence Lamp，并用 HDR 环境贴图驱动虹彩反射。可复用的重点是：

- `scene.environment` 提供连续镜面反射信息；
- ACES Filmic tone mapping 控制高光；
- 相机移动时虹彩自然变化，不需要高速滚动彩虹贴图；
- `GLTFLoader` 已把 `KHR_materials_iridescence` 参数映射到 `MeshPhysicalMaterial`。

资料：

- [Three.js 官方在线示例](https://threejs.org/examples/#webgl_loader_gltf_iridescence)
- [Three.js r184 示例源码](https://github.com/mrdoob/three.js/blob/r184/examples/webgl_loader_gltf_iridescence.html)
- [Three.js r184 GLTFLoader 源码](https://github.com/mrdoob/three.js/blob/r184/examples/jsm/loaders/GLTFLoader.js)

### 1.3 Three.js 薄膜干涉 shader

Three.js r184 的 `iridescence_fragment.glsl.js` 已实现快速薄膜干涉近似：

- 根据视线与法线计算入射角；
- 通过 Snell 定律计算薄膜内部角度；
- 计算两层界面的 Fresnel 反射；
- 用 `OPD = 2 × IOR × thickness × cos(theta)` 得到光程差；
- 用 XYZ 光谱灵敏度近似积分并转换为线性 sRGB；
- 将虹彩 Fresnel 混入常规 GGX 镜面反射。

因此不需要重新发明虹彩算法。优先使用 `MeshPhysicalMaterial + onBeforeCompile`，只注入 Fresnel alpha 和厚度动画。若内建材质无法满足透明排序和风格控制，再把当前 r184 的虹彩函数整理到独立 shader。内部 ShaderChunk 不是稳定公共 API，不建议直接从 Three.js 内部路径导入；若复制较大源码，应遵守 Three.js MIT 许可并锁定版本。

资料：

- [Three.js r184 薄膜干涉函数](https://github.com/mrdoob/three.js/blob/r184/src/renderers/shaders/ShaderChunk/iridescence_fragment.glsl.js)
- [Three.js r184 虹彩参数采样](https://github.com/mrdoob/three.js/blob/r184/src/renderers/shaders/ShaderChunk/lights_physical_fragment.glsl.js)
- [Three.js r184 虹彩 Fresnel 接入光照](https://github.com/mrdoob/three.js/blob/r184/src/renderers/shaders/ShaderChunk/lights_fragment_begin.glsl.js)
- [Three.js r184 GGX 虹彩混合](https://github.com/mrdoob/three.js/blob/r184/src/renderers/shaders/ShaderChunk/lights_physical_pars_fragment.glsl.js)

### 1.4 Khronos `KHR_materials_iridescence`

Khronos 规范确认：

- 虹彩由半透明薄膜内部多次反射产生的建设性/破坏性干涉形成；
- `iridescenceFactor` 默认 `0.0`；
- 薄膜 IOR 默认 `1.3`；
- 膜厚默认最小 `100nm`、最大 `400nm`；
- 强度纹理使用红色通道；
- 厚度纹理使用绿色通道；
- 单通道纹理在线性空间读取；
- 没有厚度纹理时统一使用最大厚度；
- 膜厚为 `0` 时退化为普通材质。

直接结论：自然虹彩应通过“平滑膜厚场”生成，而不是把彩虹颜色直接画在球面上。

资料：

- [Khronos KHR_materials_iridescence 规范](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_iridescence/README.md)
- [Khronos Iridescence Lamp 示例资产](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/IridescenceLamp)

## 2. 开源实现参考

### 2.1 DerSchmale / threejs-thin-film-iridescence

MIT 许可。该实现把较重的光谱积分预计算成约 64 像素宽的 1D Fresnel 查找纹理，运行时按 `dot(normal, view)` 查表，再与环境反射相乘。

可借鉴：

- 预计算薄膜颜色，运行时成本低；
- 颜色仍由膜厚、折射率和视角产生；
- 可作为低画质或低端设备的降级路线。

不建议直接依赖：代码基于旧 Three.js API，示例输出不透明且主要使用单一膜厚，适合作为算法参考而非成品材质。

资料：

- [DerSchmale/threejs-thin-film-iridescence](https://github.com/DerSchmale/threejs-thin-film-iridescence)
- [ThinFilmFresnelMap 源码](https://github.com/DerSchmale/threejs-thin-film-iridescence/blob/master/js/ThinFilmFresnelMap.js)
- [IridescentMaterial 源码](https://github.com/DerSchmale/threejs-thin-film-iridescence/blob/master/js/IridescentMaterial.js)
- [MIT License](https://github.com/DerSchmale/threejs-thin-film-iridescence/blob/master/license)

### 2.2 Jerome Etienne / threex.bubble

MIT 许可的历史 Three.js 肥皂泡示例，使用球体、cubemap、Fresnel 和三路略有差异的 RGB 折射方向制造色散。

可借鉴：球体视觉主要应由视角相关 Fresnel 建立，几何无需复杂。不能直接使用：API 已过时，三次 cubemap 折射更像玻璃色散，不是真正薄膜干涉，默认结果也偏实心和高反射。

资料：

- [jeromeetienne/threex.bubble](https://github.com/jeromeetienne/threex.bubble)
- [Bubble shader 源码](https://github.com/jeromeetienne/threex.bubble/blob/master/threex.bubble.js)
- [MIT License](https://github.com/jeromeetienne/threex.bubble/blob/master/LICENSE)

## 3. 透明度、Fresnel、厚度噪声与混合建议

### 3.1 推荐结构

- 一个 `SphereGeometry`，约 `48×24` 或 `64×32` 分段；
- 依据全部有效线组和插头的世界空间包围盒计算中心与最大半径；
- 半径增加约 `6%～10%` 的保护余量；
- 相机始终在球外时使用 `FrontSide`，不要默认 `DoubleSide`；
- `castShadow = false`、`receiveShadow = false`；
- 只更新少量 uniform 或纹理变换，不每帧重建几何、材质或纹理。

### 3.2 Fresnel alpha

建议把透明度分为几乎不可见的基础膜和柔软边缘：

- 球心 alpha：`0.01～0.035`；
- 中间区域 alpha：`0.03～0.08`；
- 掠射边缘常态 alpha：`0.10～0.20`；
- 抵挡瞬间边缘峰值：最多 `0.24～0.30`，随后回落；
- 禁止整球统一高 opacity，避免重新形成灰紫色罩层。

起始公式：

```glsl
float ndv = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
float fresnel = pow(1.0 - ndv, 3.0);
float rim = smoothstep(0.18, 0.92, fresnel);
float alpha = mix(0.018, 0.16, rim) * coverage;
```

调节原则：Fresnel 指数过低会让球心发亮；过高会变成硬圆环；`smoothstep` 应保持较宽过渡。技能出现/退出用 `coverage` 淡入淡出，不改变 Fresnel 结构。

### 3.3 虹彩参数

第一轮建议范围：

- `iridescence`: `0.35～0.65`；
- `iridescenceIOR`: `1.25～1.38`；
- `iridescenceThicknessRange`: `[120, 420]` 或 `[160, 440]` 起测；
- `metalness`: `0`；
- `roughness`: `0.18～0.35`；
- 基础色：接近白色的淡樱粉/淡冷灰，不使用深紫底色；
- 环境反射强度以“不洗掉线色”为上限。

虹彩只在局部掠射区出现，主色控制为粉、青、淡金、薰衣草，避免满饱和连续 RGB 条纹，也不要依赖 bloom 才能辨认。

### 3.4 厚度噪声

- 使用 `64×64` 或 `128×64` 低频可平铺单通道纹理；
- 写入绿色通道，并作为线性数据纹理读取；
- 只保留约 `2～5` 个大尺度云团，避免密集噪点；
- 预先平滑，让虹彩像肥皂膜缓慢流动；
- UV 漂移速度约每秒 `0.005～0.015` 圈；
- 纹理只生成一次，每帧仅改 offset/uniform；
- 球体经纬 UV 极点与接缝处先降低噪声对比，实测仍明显时再升级为对象空间噪声。

不推荐高频 FBM 驱动 alpha、大幅顶点位移、快速滚动彩虹贴图。

### 3.5 混合与深度

推荐基础设置：

```ts
material.transparent = true;
material.blending = THREE.NormalBlending;
material.depthTest = true;
material.depthWrite = false;
material.side = THREE.FrontSide;
```

原因：

- `NormalBlending` 保持柔和半透明，不会像整球 Additive 那样漂白线组；
- `depthWrite: false` 防止球壳先写深度后切掉内部线和插头；
- `depthTest: true` 保留与场景前景物体的遮挡关系；
- `FrontSide` 避免透明双面材质的额外 overdraw 与排序复杂度。

若线缆材质本身透明，Three.js 按对象中心排序可能随相机旋转跳变，应为护盾和线组设置稳定 `renderOrder`，以线组清晰优先。不要通过关闭 `depthTest` 解决排序，也不要整球使用 `AdditiveBlending`。

资料：

- [Three.js Material 文档](https://threejs.org/docs/pages/Material.html)
- [Three.js r184 Material 源码](https://github.com/mrdoob/three.js/blob/r184/src/materials/Material.js)

### 3.6 不启用 transmission

`transmission` 适合玻璃真实透射，但不适合正向帮助型护盾：它增加背景采样和 fragment 成本，可能让线缆变形、模糊或位移；高透射也不等于低遮挡。这里仅需要虹彩反射与 Fresnel alpha，不需要真实体积折射。

## 4. 性能风险

### 4.1 大屏幕覆盖率

护盾会覆盖大量屏幕像素，主要成本是 fragment shader，而非球体三角形数量。规避方式：

- 只使用一个球体和一个物理材质；
- 不叠加背面球、描边球、噪声球；
- 不启用 transmission、clearcoat、dispersion；
- 无技能时隐藏 mesh，避免 alpha 为 0 仍参与绘制；
- 高 DPR 设备关注 GPU frame time；
- 低画质改用预计算 Fresnel LUT 或简化三色 Fresnel。

### 4.2 透明 overdraw

大球体使用 `DoubleSide` 会重复覆盖相同区域，并增加透明排序问题。相机在球外时只用 `FrontSide`；若未来允许进入球内，应单独处理该状态，不要常驻双面。

### 4.3 shader 重编译

Three.js 的 `iridescence` setter 在跨越 `0` 与正数时会增加材质版本。建议进入技能时创建/预热一次材质，生命周期内保持 `iridescence > 0`，用 `coverage` uniform 做淡入淡出；淡出结束后隐藏 mesh，不要每帧切换 `iridescence = 0/非零`。

### 4.4 动态噪声

每像素多层 FBM、三平面采样和实时法线扰动在大球上成本高。首版使用预生成低频厚度纹理，每帧只移动 UV，最多一到两次纹理采样，不更新纹理像素或触发 `needsUpdate`。

### 4.5 环境反射

内建虹彩属于镜面反射。没有合适环境信息时可能不明显，HDR 对比过高又会变成强反光玻璃。先复用现有灯光；如确实需要，只增加一张低分辨率、低对比度共享环境贴图，不使用动态 `CubeCamera`。

## 5. 推荐实施顺序

### 第一阶段：低风险原型

- 移除旧粗环/实心护盾；
- 单个平滑球壳覆盖全部线组；
- 原生 `MeshPhysicalMaterial.iridescence`；
- Fresnel alpha；
- `depthWrite: false`；
- 一张静态低频厚度纹理；
- 无 transmission、无顶点位移、无第二层球。

验收重点：线组颜色和交叉关系始终清楚；正视球心几乎感觉不到膜；侧边出现柔和虹彩。

### 第二阶段：SAKURA 风格运动

- 厚度纹理极慢漂移；
- 触发时薄膜从线组范围自然展开，而不是从泡泡机飞出；
- 常态仅保留 `0.15～0.25Hz` 极弱呼吸；
- 抵挡时沿球面通过一次柔和虹彩波，不叠加实心闪光。

### 第三阶段：质量降级

- 中高画质：原生 `MeshPhysicalMaterial` 虹彩；
- 低画质：DerSchmale 式 64 像素 Fresnel LUT；
- 极低画质：淡青/淡粉 Fresnel 薄边，不计算光谱薄膜干涉。

## 6. 实施前检查项

1. 当前线缆材质是否透明，以及其 `renderOrder`、`depthWrite` 设置；
2. 场景是否已有可复用 `scene.environment`；
3. 相机是否始终位于护盾球外；
4. 全部线组与插头的世界空间包围盒如何稳定计算；
5. 日间/夜间主题下虹彩是否都可见但不抢线色；
6. 触发、常驻、抵挡、退出能否只更新同一 mesh 的 uniform；
7. 护盾开启前后的 GPU frame time、draw calls 和透明 overdraw 差值。

## 最终建议

第一版采用 **Three.js r184 原生虹彩 + 自定义 Fresnel alpha 的单球壳方案**。自然感来自三件事：**视角相关 Fresnel、物理膜厚产生的虹彩、低频缓慢变化的厚度场**。保护感来自完整包围线组的球形范围与抵挡瞬间的一次柔和波动，而不是粗圆环、深紫实心球或玻璃折射罩。
