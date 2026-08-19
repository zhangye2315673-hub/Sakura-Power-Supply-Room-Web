# 冰箱技能：全屏降温、樱花转雪与线缆冰封效果研究

研究日期：2026-08-17  
范围：只研究一级来源（作者 Demo、官方文档、官方源码、GitHub 原仓库）。本文不修改运行时代码。

## 结论先行

当前冰箱技能不适合继续用“飞出的食物 / 冰块 / 悬浮提示模型”表达冻结。推荐把反馈拆成同一个 `coldProgress` 驱动的三个层次：

1. **环境先降温**：白天暖色在约 1.2 秒内渐变成低饱和冰蓝色；不是一次性滤镜切换。
2. **樱花逐个变成雪花**：沿用当前 `PetalField` 的粒子位置和运动状态，让每一片樱花按随机延迟缩小，同时同位置的低模雪花放大；风速、横向阵风与下落速度同步增强。
3. **目标线缆沿自身路径结冰**：冰层从线的一端沿弯曲路径累积，覆盖线身、接头、插头与尾帽；不用任何始终正对屏幕的模型。冻结完成后才锁定交互。

屏幕结霜只建议在四周和角落长出约 18%–28% 的冰晶边缘，中央线组仍然清楚。冻结状态持续三回合时，强烈的“结冰过程”结束，但保留较弱的冷色、雪花和线缆冰层；解冻时再反向渐退。

不建议安装一整套第三方特效库。当前项目已有全屏后处理、`InstancedMesh` 樱花和可注入 shader 的线缆材质，最合适的是借鉴开源实现的结构，在现有管线中独立实现。

## 当前实现中需要去除或改造的内容

### 去除冰箱飞行模型

`src/appliances/performance/RefrigeratorPerformance.ts` 当前会让 `refrigerator-food-performance-root` 中的食物从冰箱飞出、绕行、聚集再返回。这就是本轮应去除的“很丑的漂浮模型”。

建议保留：

- 冰箱门打开 / 关闭；
- 内部冷光；
- 压缩机轻震；
- 家电本体的 5.2 秒演出时长。

建议删除：

- `foodVisible`；
- 食物 launch / orbit / front-party / return 的整段运动；
- 用食物模型作为技能生效提示的依赖。

### 去除冻结线缆的普通发光

`src/game/Game.ts` 当前把 `frozen-plug` 目标加入通用 `glowHighlighted`，这只能让线发亮，不能表现结冰，而且容易出现此前用户不喜欢的黄色 / 原色光层。冰封材质完成后应把 `frozen-plug` 从该集合移除，由专属冰封材质独占视觉状态。

## 一级来源评估

| 来源 | 可以借用的核心结构 | 许可 | 对本项目的判断 |
|---|---|---|---|
| [Nathanael C. Fritz / Ice Covering](https://godotshaders.com/shader/ice-covering/) | 用 coverage texture + threshold 控制冰层扩张；对 coverage 邻域采样生成法线；在冰层区域做折射、冷色和高光 | 页面明确注明代码片段为 MIT；图像、视频和素材不包含在代码许可内 | **最适合参考屏幕冰层结构**。不要复制其纹理素材，改用本地程序生成遮罩 |
| [Andrea Riccardi / Frozen Screen Effect 作者展示](https://andreariccardi.artstation.com/projects/VeDOR) 与 [GitHub shader 源码](https://github.com/a-riccardi/shader-toy/blob/master/ShaderToy/Assets/FreezePostProcess/Shaders/Git/FreezePostProcess.shader) | 用一个 `_Amount` 控制完整结冰；混合贴图的 RG/B/A 分别承载法线、密度、渐变；用 steepness 调整生长边缘；结冰区域折射背景并加入冰色漫反射 / 高光 | [仓库为 MIT](https://github.com/a-riccardi/shader-toy/blob/master/LICENSE) | **最适合参考时间控制**。但源码中的非重复纹理函数注明来自另一个 Shadertoy，许可链不够清楚，建议不复制该函数 |
| [frost-reveal](https://github.com/kaminidoramawo/oss-frost-reveal) | 全屏四边形 + 遮罩纹理；遮罩以半分辨率运行并线性采样；DPR 封顶；WebGL 不可用时可降级 | [MIT](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/LICENSE) | **适合借性能结构**，不是现成的冰晶美术。其源码明确使用半分辨率 mask，并在渲染时上传纹理：[webgl-renderer.ts](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/src/core/webgl-renderer.ts) |
| [Three.js 官方雪花 Points 示例](https://threejs.org/examples/webgl_points_sprites.html) 与 [源码](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_points_sprites.html) | 多种雪花外观、共享一份顶点数据、不同尺寸和旋转速度的粒子层 | [Three.js MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE) | 可参考“雪花不应全部一样”和多层速度；本项目不应直接换成写实 sprite，应继续使用低模几何 |
| [Three.js `InstancedMesh` 官方文档](https://threejs.org/docs/pages/InstancedMesh.html) | 相同几何 / 材质的大量实例通过 instancing 降低 draw call；每实例矩阵可更新 | Three.js MIT | 当前 `PetalField` 已采用此结构，最适合增加第二个雪花 `InstancedMesh`，无需引入粒子库 |
| [Three.js TubeGeometry 官方源码](https://github.com/mrdoob/three.js/blob/dev/src/geometries/TubeGeometry.js) | 管线方向 `uv.x = i / tubularSegments`，横截面方向 `uv.y = j / radialSegments` | Three.js MIT | **最适合线缆沿路径累积结冰**：直接用 `uv.x` 作为线长进度，不需要世界空间提示物 |
| [Three.js DataTexture 官方文档](https://threejs.org/docs/pages/DataTexture.html) | 可直接从 `Uint8Array` 创建低分辨率纹理；默认无 mipmap，适合一次生成、反复采样的遮罩 | Three.js MIT | 适合生成 128×128 或 192×192 的冰晶 coverage / normal 数据，避免外部素材依赖 |
| [Three.js Color 官方文档](https://threejs.org/docs/pages/Color.html) | Three.js 默认在线性工作色域处理颜色，并提供线性插值 | Three.js MIT | 冷暖色过渡应在线性空间内插值，避免中间阶段发灰或突然发蓝 |

## 推荐的完整视觉结构

### 1. 全屏结霜：边缘生长，中央保持清楚

在 `src/style/post.ts` 的现有技能后处理里新增 `refrigerator-freeze`，继续使用已有 `FullScreenQuad`，不要新建 DOM 覆盖层。

建议输入：

- `uColdProgress`：0–1，控制整套效果；
- `uFrostMask`：128×128 或 192×192、单通道 `DataTexture`；
- `uFrostTexel`：遮罩纹素大小；
- `uTime`：仅用于很轻的冰面闪光，不让冰纹漂移；
- `uThemeProgress`：白天 / 夜晚兼容。

遮罩只生成一次：

1. 计算每个像素到最近屏幕边缘的距离；
2. 叠加 2–3 层不同尺度的 seeded cell / value noise；
3. 从四角加入少量六向分枝，让它像冰晶而不是浴室磨砂；
4. 中央设置保护区，最高结霜密度限制在 0.12–0.18；
5. 用 `uColdProgress` 移动 threshold，让冰从边缘逐渐向内生长。

实现逻辑可参考 `Ice Covering` 的 coverage threshold：先得到 `frostMask`，再只在 mask 内做折射、冷色与高光。[作者源码](https://godotshaders.com/shader/ice-covering/)还用 coverage 邻域差分生成法线，这种办法可以在本项目中简化为四次邻域采样：

```glsl
float left  = texture2D(uFrostMask, uv - vec2(uFrostTexel.x, 0.0)).r;
float right = texture2D(uFrostMask, uv + vec2(uFrostTexel.x, 0.0)).r;
float down  = texture2D(uFrostMask, uv - vec2(0.0, uFrostTexel.y)).r;
float up    = texture2D(uFrostMask, uv + vec2(0.0, uFrostTexel.y)).r;
vec2 frostNormal = vec2(right - left, up - down);
```

然后：

- 背景折射控制在约 1–2.5 像素，不要像热浪一样持续流动；
- 冰晶边缘加入米白高光和淡蓝阴影；
- 结霜区域轻微降饱和、提高亮部，不把整个屏幕盖成白色；
- 冰纹用低面数 / 片状高光表达，避免照片纹理与 SAKURA 低模风格冲突。

Andrea Riccardi 的实现证明了单一 `_Amount` 可以同时驱动 coverage、密度、折射和厚冰混合，[源码中以 steepness 改变渐变边缘](https://github.com/a-riccardi/shader-toy/blob/master/ShaderToy/Assets/FreezePostProcess/Shaders/Git/FreezePostProcess.shader)。本项目也应只暴露一个外部进度，内部再映射不同阶段，避免多个系统各自计时。

### 2. 暖色白天逐渐变冷

不要一次修改 `scene.background`，也不要用纯蓝半透明层直接盖住画面。建议在同一个后处理 pass 中对最终场景颜色做线性混合：

```glsl
float cold = smoothstep(0.06, 0.72, uColdProgress);
vec3 coolShadow = vec3(0.82, 0.88, 0.97);
vec3 coolLight = vec3(0.94, 0.97, 1.00);
float luminance = dot(sceneColor, vec3(0.2126, 0.7152, 0.0722));
vec3 coldGrade = sceneColor * mix(coolShadow, coolLight, smoothstep(0.15, 0.78, luminance));
sceneColor = mix(sceneColor, coldGrade, cold * 0.30);
```

建议上限：

- 白天冷色混合：0.25–0.34；
- 夜晚冷色混合：0.12–0.20，避免夜景再次变暗；
- 饱和度只降低 6%–10%；
- UI 不进入这个 pass，只影响 Three.js 游戏画布。

Three.js 文档说明 `Color` 默认在线性工作色域内表示并提供 `lerp`，[参见官方 Color 文档](https://threejs.org/docs/pages/Color.html)。如果冷暖色在 TypeScript 端插值，也应使用 `THREE.Color.lerpColors`，不要直接插值 sRGB 十六进制通道。

### 3. 樱花逐渐变成雪花，同时风变大

当前 `src/systems/PetalField.ts` 已经只有 28 个实例，并使用一个 `InstancedMesh`。不需要替换粒子系统；新增一个低模雪花 `InstancedMesh`，让樱花和雪花共享同一组粒子状态即可。官方文档明确说明 `InstancedMesh` 用于相同几何 / 材质的大量对象，并可降低 draw call：[InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)。

推荐不是“全体同时换材质”，而是逐个交叉变化：

```ts
const localCold = smoothstep(seed * 0.55, seed * 0.55 + 0.34, coldProgress);
petalScale = baseScale * (1 - localCold);
snowScale = baseScale * localCold;
```

每片粒子的 `seed` 固定，转换顺序因此随机但可复现。两个实例共享位置和旋转，视觉上会像樱花收缩成雪花，而不是一帧内换场。

雪花造型建议：

- 程序生成 6 臂低模雪花，只有 12–24 个三角面；
- 几何略厚，使用奶白 + 冰蓝的 toon 材质；
- 2–3 种臂长和缺口版本，避免全部一样；
- 不直接搬官方写实 snowflake sprite。Three.js 官方示例可用于参考“多种尺寸 / 多种外观 / 多层旋转”，其源码创建 5 组不同尺寸和纹理的雪粒子：[官方源码](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_points_sprites.html)。

风速建议随 `coldProgress` 平滑增加：

| 参数 | 樱花常态 | 完全降温后的雪花 |
|---|---:|---:|
| 水平速度 | 0.16–0.38 | 0.75–1.35 |
| 下落速度 | 0.42–0.76 | 0.95–1.65 |
| 摇摆幅度 | 0.08–0.24 | 0.18–0.48 |
| 自转 | 0.5–2.5 | 1.5–5.0 |

不要简单把所有速度乘同一个常数。每片雪花应有独立 gust phase：一部分先被阵风推快，一部分短暂停顿后再加速。Three.js 官方 compute snow 示例也为每个粒子保存独立随机量、下降速度，并用不同相位的 `sin/cos` 改变水平位置；尽管该示例是 WebGPU，运动原则可以在当前 28 个 CPU 粒子上直接使用：[官方源码](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_particles_snow.html)。

### 4. 整根线沿路径结冰

#### 推荐：修改现有线缆材质，不增加悬浮模型

`src/render/CableGeometry.ts` 已通过 `onBeforeCompile` 注入线缆视觉膨胀。可以在同一注入链中增加：

- `uFreezeProgress`：沿路径冻结进度；
- `uFrozenAmount`：冻结强度 / 状态保持；
- `uFreezeSeed`：每根线不同的冰纹；
- `vCableProgress`：直接来自 tube 的 `uv.x`，或者生成显式 `aCableDistance` 属性。

Three.js 官方 `TubeGeometry` 源码明确按管长写入 `uv.x = i / tubularSegments`，横截面写入 `uv.y = j / radialSegments`：[TubeGeometry.js](https://github.com/mrdoob/three.js/blob/dev/src/geometries/TubeGeometry.js)。因此冰层可以严格沿线的弯曲路径前进，不会变成正对屏幕的模型。

概念公式：

```glsl
float irregular = valueNoise(vec2(vCableProgress * 13.0, uFreezeSeed)) * 0.12;
float freezeMask = smoothstep(
  uFreezeProgress + 0.055,
  uFreezeProgress - 0.055,
  vCableProgress + irregular
);
```

在 `freezeMask` 区域：

- 原线色与冰蓝灰混合，但仍保留约 35% 原色，玩家还能辨认线路颜色；
- 沿法线轻微膨胀 3%–7%，像冰层贴在线材表面；
- 加两级片状高光和稀疏白霜斑，不使用柔和黄色发光；
- 外描边颜色转成深蓝灰，粗细保持与正常线一致；
- hover 只能叠加在冰层之后，不能把冻结材质恢复成原色。

#### 接头、插头和尾部也必须进入同一状态

线身的 `uv.x` 只负责路径进度。插头 / 尾帽可使用同一个 `uFrozenAmount`，在路径前沿抵达端点时延迟 0.08–0.16 秒生长：

- 头部：从线与插头的衔接处向插片扩散；
- 尾部：从线与圆环衔接处向圆帽扩散；
- 双头线：按实际冻结方向决定先后；
- 不产生包围盒、冰块、图标或始终朝向相机的面片。

为了防止 UV 合并后的端盖坐标重置，长期方案是给 `createCappedTubeGeometry` 生成显式 `aCableDistance`：tube 顶点为 0–1，头端盖统一为 1，尾端盖统一为 0。Three.js 的 `BufferGeometry` 支持自定义顶点 attribute，[官方文档](https://threejs.org/docs/pages/BufferGeometry.html)说明 position、normal、color、uv 和自定义数据都存储为并行 attribute。

#### 状态和交互顺序

1. 冰层前沿尚未到达：线仍可读，但技能输入整体锁定；
2. 冰层覆盖完成：提交 `frozen-plug` 状态；
3. 三回合内：线缆冰层保持，普通 hover 不得覆盖；
4. 冻结状态被吹风机解除：冰层从插头向线身反向退去，约 0.65–0.9 秒；
5. 状态自然结束：0.45–0.7 秒融化，雪与冷色同时减弱。

## 推荐时间线（沿用冰箱 5.2 秒家电动画）

| 时间 | 家电 | 屏幕 / 环境 | 目标线缆 |
|---|---|---|---|
| 0.00–0.35s | 压缩机启动，门开始打开 | 无突然切换 | 保持原状 |
| 0.35–1.20s | 门内冷光增强 | 暖色逐渐转冷；部分樱花开始缩小、雪花出现 | 冻结目标轻微失去暖色，不发光 |
| 0.80–2.20s | 门完全打开 | 风速逐步增强；雪花占比从约 20% 到 80%；边缘冰晶开始生长 | 冰层从端点沿 `vCableProgress` 前进 |
| 2.20–3.45s | 冰箱高潮，不再抛出食物 | 雪花达到全速；边缘结霜达到峰值但中央清楚 | 整根线、接头、插头、尾帽完成冰封 |
| 3.45–4.35s | 冷光保持 | 屏幕冷色稳定 | 此时才确认冻结锁定 |
| 4.35–5.20s | 门关闭、压缩机回落 | 强结霜减弱到持久态；雪速下降约 20% | 冰层保持三回合 |

持久态不要保留最强烈的屏幕遮挡：

- 边缘结霜由峰值 28% 回落到 12%–18%；
- 冷色色偏由峰值 0.30 回落到 0.18–0.22；
- 雪花保持，但风速从峰值回落 15%–25%；
- 线缆冰封保持完整，因为它才是直接解释玩法规则的反馈。

## 性能预算与降级策略

### 推荐预算

| 子系统 | 推荐成本 | 说明 |
|---|---:|---|
| 全屏结霜 | 现有 pass 内增加 1 个 128/192px mask + 4 次 mask 邻域采样 + 1–2 次场景采样 | 不新增独立 composer pass，不做全屏多级模糊 |
| 樱花 / 雪花 | 从 1 个 `InstancedMesh` 增到 2 个，仍只有 28 组状态 | 通常增加约 1 draw call；无必要引入 10k 粒子 |
| 线缆结冰 | 保持现有 draw call；每根冻结线增加少量 shader 数学 | 不复制 tube，不创建透明外壳网格 |
| 遮罩 | 128×128 R8 约 16KB，192×192 R8 约 36KB | 一次生成，不要每帧上传 |

`frost-reveal` 的作者实现用半分辨率 mask canvas、DPR 上限和线性采样来降低成本，[相关源码](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/src/core/webgl-renderer.ts)。本项目的遮罩只是自动生长，完全可以更进一步：启动时生成一次 `DataTexture`，每帧只更新 `uColdProgress`，不上传新纹理。

### 质量档位

- **高**：192×192 mask、四邻域法线、2 次背景采样、28 个雪花实例；
- **中**：128×128 mask、四邻域法线、1 次背景采样、24 个雪花实例；
- **低**：64×64 mask、无折射，只保留边缘冰色 / 高光，18 个雪花实例；
- **最小**：无屏幕冰纹，保留冷色渐变 + 线缆冰封，玩法反馈不能被关闭。

## 许可注意事项

1. Three.js 代码和官方示例整体采用 MIT，但若复制实质代码，应保留 MIT notice。[Three.js LICENSE](https://github.com/mrdoob/three.js/blob/dev/LICENSE)
2. `Ice Covering` 页面明确：代码片段 MIT，页面中的图像、视频和素材不在该许可内。因此只借算法结构，不下载它的贴图。[来源](https://godotshaders.com/shader/ice-covering/)
3. Andrea Riccardi 仓库为 MIT，但 `FreezePostProcess.shader` 内部注明某个非重复纹理函数来自另一个 Shadertoy。为避免上游许可不清，不复制该函数；使用我们自己的 seeded mask。[仓库](https://github.com/a-riccardi/shader-toy)
4. `frost-reveal` 是 MIT，可参考半分辨率遮罩和清理逻辑；不建议把 TWGL / React 组件直接引入 Three.js 游戏。[LICENSE](https://github.com/kaminidoramawo/oss-frost-reveal/blob/main/LICENSE)
5. 推荐所有冰晶和雪花造型程序生成，避免新增图片资产的署名、分发和风格不一致问题。

## 最终推荐方案

采用“**现有 Three.js 管线内的三层冷冻系统**”：

- **屏幕层**：参考 `Ice Covering` 的 coverage / normal / refraction 思路和 `frost-reveal` 的低分辨率遮罩结构，在现有后处理中新建边缘冰晶模式；
- **环境层**：复用 `PetalField` 状态，增加低模雪花 instancing，通过逐粒子缩放交叉替换；冷色与风速都由同一个 `coldProgress` 平滑推进；
- **玩法层**：利用 `TubeGeometry` 的纵向 UV 或显式 `aCableDistance`，让冰层沿每根目标线真实生长，并把接头、插头、尾帽纳入同一材质状态；
- **删除项**：去掉飞行食物 / 冰块 / 漂浮模型，也去掉冻结线缆的通用发光。

这套方案比“加一个屏幕蓝色滤镜”更能说明技能发生了什么，也比悬浮冰块更符合当前 SAKURA 低模世界：玩家先感到天气变冷，再看见樱花变雪，最后清楚看到具体哪几根线被冰完整封住。
