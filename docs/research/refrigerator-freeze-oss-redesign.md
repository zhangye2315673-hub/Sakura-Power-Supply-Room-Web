# 冰箱技能：开源冰壳与屏幕霜晶重做方案

研究日期：2026-08-17  
范围：一级来源（GitHub 源码、作者 Demo、官方文档、许可证）。本文件不修改运行时代码。

## 结论

当前效果的问题不是颜色参数，而是实现结构：

- `CableGeometry.ts` 直接修改原线材质，因此只能得到“线变蓝 + 白蓝纹”，不可能表现冰层包住线。
- `post.ts` 用边缘距离和 FBM 做单层软遮罩，因此更像模糊边框，没有独立的霜晶 mask、高度与法线。

建议直接换成：

1. **线缆：原线 + 独立低模冰壳**。原线颜色保留，第二层 TubeGeometry 沿法线向外膨胀。
2. **屏幕：真正的霜晶 mask + 高度法线 + 局部折射**。不再使用等宽柔边框，也不做全屏模糊。

没有一个成品能无修改地同时解决两项；最合适的是组合以下开源实现。

## 推荐项目

| 排名 | 一级来源 | 许可证 | 对应替换点 | 使用方式 |
|---:|---|---|---|---|
| 1 | [Three.js `TubeGeometry`](https://github.com/mrdoob/three.js/blob/dev/src/geometries/TubeGeometry.js)、[`MeshPhysicalMaterial`](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)、[Transmission Demo](https://threejs.org/examples/webgl_materials_physical_transmission.html) | [MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE) | 替换线缆“直接变色” | **直接使用现有依赖**：原线不动，新增共享路径的 outer ice shell |
| 2 | [DavidHDev/canvas-ui Frost](https://canvasui.dev/docs/components/frost)、[GitHub](https://github.com/DavidHDev/canvas-ui) | [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md)：商业应用可用，不可把组件本身重新销售或打包分发 | 替换屏幕模糊边框 | **移植 shader 结构**：noise、height、edge intro、normal/refraction；不安装 React 组件 |
| 3 | [stegu/psrdnoise](https://github.com/stegu/psrdnoise)、[作者 Demo](https://stegu.github.io/psrdnoise/) | MIT | 制造冰壳不均匀厚度 | **直接借 GLSL**：只在顶点阶段用 1–2 octave，不能画成 fragment 白蓝纹 |
| 4 | [stegu/webgl-noise](https://github.com/stegu/webgl-noise)、[`cellular2D.glsl`](https://github.com/stegu/webgl-noise/blob/master/src/cellular2D.glsl)、[作者 Demo](https://stegu.github.io/webgl-noise/webdemo/) | MIT | 生成 Voronoi/Worley 霜晶边界 | **直接借 GLSL**：半分辨率生成 frost mask，再用于晶枝、法线和局部折射 |
| 5 | [Material Maker](https://github.com/RodZill4/material-maker)、[Voronoi 节点文档](https://rodzill4.github.io/material-maker/doc/node_noise_voronoi.html) | [MIT](https://github.com/RodZill4/material-maker/blob/master/LICENSE.md) | 离线制作稳定的霜晶/法线图 | **工具可直接使用**：适合先锁定 SAKURA 美术；社区素材需另验许可 |

补充参考：

- [Ice Covering](https://godotshaders.com/shader/ice-covering/)：代码 MIT，适合借 coverage threshold、邻域法线和 mask 内折射；页面图片、视频和素材不在代码许可内。
- [Andrea Riccardi FreezePostProcess](https://github.com/a-riccardi/shader-toy/blob/master/ShaderToy/Assets/FreezePostProcess/Shaders/Git/FreezePostProcess.shader) / [作者展示](https://andreariccardi.artstation.com/projects/VeDOR)：适合参考单一进度控制密度、法线和厚冰混合；shader 内有外部 Shadertoy tiler，贴图来源也需单独核对，因此只参考结构。
- [THREE-CustomShaderMaterial](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial)：[MIT](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial/blob/main/LICENSE.md)，能给 `MeshPhysicalMaterial` 注入位置、粗糙度、clearcoat、transmission 和 thickness；当前项目已有 `onBeforeCompile`，暂时不必增加依赖。

## 线缆：改成真正的外层冰壳

### 几何结构

```text
原始 TubeGeometry：保留原颜色、原描边和线路身份
└─ outerIceShell：共享同一路径/geometry，顶点沿 normal 外移
```

冰壳不是把整根线等比例放大，而是在 shader 中沿每个顶点法线增加厚度：

```glsl
float growth = freezeMask * freezeAmount;
float uneven = 0.72 + 0.28 * lowFrequencyNoise;
transformed += normal * maxIceThickness * growth * uneven;
```

`freezeMask` 继续由 TubeGeometry 的 `uv.x` 或当前 `aCableProgress` 控制，冰层沿线生长。`psrdnoise` 只改变 `uneven`，不再进入 fragment shader 生成白蓝细线。

### 视觉参数

- 冰壳半径比原线大约 12%–18%，少数结块达到约 24%。
- radial segments 保持 6–8，并使用低模面高光，不做写实玻璃管。
- `roughness` 约 0.38–0.55；`transmission` 约 0.1–0.25；`ior` 1.31；透明度约 0.5–0.68。
- 原线从冰层下仍能看见，冰壳用奶白、浅青和蓝灰阴面，禁止饱和蓝。
- 删除当前高频 facet/stripe 白蓝线；高光来自壳体法线和场景光，不用白色加法纹。
- 插头壳、衔接套、插头正面、尾环、尾帽也分别增加同材质外壳；金属接触点仅结薄霜。
- hover 只能叠加冰壳边缘亮度，不能恢复原来的无冰状态。

### 性能

- 只给实际冻结的 1–2 根线创建冰壳，每根约增加 1 个线身 draw call，插头组件可合批或共享材质。
- transmission 是额外像素成本；低画质关闭 transmission，但保留壳体轮廓、透明度和低模高光。
- geometry 可以共享，不能为冰壳复制整套路径计算。

## 屏幕：改成霜晶生长，不是模糊边框

### 首选结构：Canvas UI Frost

Canvas UI Frost 的公开源码包含四个关键阶段：

1. 程序生成 frost noise、mottle 和 sparkle；
2. 生成宽/细两层 height；
3. 根据屏幕边缘距离与 intro progress 让霜不均匀长入；
4. 从 height 邻域差分生成法线，并使用 IOR、Fresnel 和折射合成。

在本项目中只移植 `FRAG_NOISE`、`FRAG_HEIGHT`、边缘生长 mask 和 `heightNormal/refract`。不要移植：

- HTML/DOM 捕获；现有 Three.js 场景纹理已经可采样。
- pointer 融化与双缓冲；冰箱技能不需要擦玻璃交互。
- 全屏 10 tap 高斯模糊和默认高 haze；这会再次变成模糊框。

### 霜晶主体：二选一

**方案 A：Material Maker 固定霜晶 mask（首轮推荐）**

- 用 Voronoi bisector、多尺度 noise 和方向扭曲离线导出 512/1024 灰度 mask 与 normal。
- 运行时只移动 threshold，让四角和四边的晶枝逐渐向内长。
- 优点是美术稳定、最容易控制成 SAKURA 低模片状冰花，GPU 成本最低。

**方案 B：webgl-noise 实时 cellular mask**

- 使用 `cellular2D.glsl` 的 Worley 距离场，以 `F2-F1` 或 cell boundary 得到尖锐晶界。
- 与到屏幕边缘的距离和两层低频噪声相乘，产生每局不同的冰花。
- 推荐 0.5 分辨率 mask；不要同时叠加多套高频噪声。

### 屏幕视觉规则

- 四角先结晶，四边以岛状、枝状向内推进，不能形成等宽矩形。
- 晶体边缘清晰、破碎；只有厚霜内部轻微折射和失焦。
- 中央保留约 62%–70% 清晰区域，线组仍可辨认。
- 霜晶主体是奶白浅青，阴面蓝灰；禁止整块蓝色渐变框。
- 冻结持久态固定霜形，仅保留少量晶点闪动，避免整圈噪声漂移。
- 屏幕模糊强度只由 frost mask 控制，mask 外完全清晰。

### 性能

- frost mask/height 在技能触发时生成一次，推荐 256×256 或 384×384。
- 持续状态每帧只更新 `freezeProgress` 和非常轻的 sparkle 时间。
- 高画质：4 次高度邻域采样 + 1 次折射场景采样。
- 低画质：关闭折射，只保留霜晶 mask、颜色、片状高光；玩法反馈不能关闭。

## 推荐执行顺序

1. 删除线材质中的白蓝细纹和主要冷色覆盖，恢复原线为内层。
2. 完成 TubeGeometry 独立低模冰壳，先验证线身，再覆盖插头和尾部组件。
3. 删除 `uEffect == 7` 中作为主体的软边框 FBM。
4. 先用 Material Maker 制作一张可控霜晶 mask，接入 Canvas UI 的 height-normal/refraction 结构。
5. 如果固定 mask 过于重复，再替换成 `webgl-noise cellular2D` 实时生成。
6. 在冰箱测试模式分别检查结冰过程、持续三回合、hover、旋转、夜晚和解冻。

## 最终选择

- **线缆：Three.js 原线 + 独立 MeshPhysicalMaterial 冰壳，psrdnoise 只改变壳体厚度。**
- **屏幕：Canvas UI Frost 的高度/法线/折射结构，霜晶主体优先用 Material Maker 固定 mask。**
- **webgl-noise 作为后续随机霜纹升级，不与固定 mask 同时堆叠。**

这一组合直接从结构上解决两个反馈：线会呈现“原线被一层低模冰包住”，屏幕四周会出现有晶界、有厚度和局部折射的冰花，而不是白蓝条纹和模糊矩形框。
