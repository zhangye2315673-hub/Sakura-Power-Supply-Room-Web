# 咖啡泼溅屏幕后处理视觉调研

调研日期：2026-08-21

## 调研目标与边界

目标是重做咖啡机触发瞬间的屏幕咖啡泼溅，使它更像液体撞上镜头玻璃，同时融入 SAKURA 当前的日系纸张、樱花、手绘描边气质。

本次只研究可在现有单个后处理 fragment shader 中实现的机制，不建议引入完整 Navier-Stokes 流体模拟、额外粒子系统或常驻多 pass flowmap。当前 `src/style/post.ts` 已有 `tDiffuse`、`uCoffeeOrigin`、`uCoffeeSplashProgress`、噪声与 fBM，足够完成轻量版本。

## 一手来源

### 1. PavelDoGreat / WebGL Fluid Simulation：splat 注入核

- 官方仓库：[PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)
- 原始 shader 源码：[script.js 中的 splatShader](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/script.js)
- 许可证：[MIT](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/LICENSE)

原项目的 `splatShader` 并不是先画一个硬边圆，而是把点击点换算到比例校正后的局部坐标，以 `exp(-dot(p, p))` 形成连续衰减的注入核，再把颜色或速度加到目标场中。完整项目还会对速度、压力、旋度和染料做多 pass 迭代，但对本项目最有价值的是最前端的 **splat 注入形状**：中心密、边缘自然衰减、可通过局部坐标拉伸成方向性液体撞击。

**可提炼机制：** 不引入模拟，只在当前 shader 内建立 1 个主高斯/指数核，叠加若干方向性核。它会比当前多个独立椭圆的 `max()` 拼接更像同一团液体，因为各部分共享一个连续密度场。

### 2. OGL Flowmap：速度决定方向、长宽和衰减

- 官方仓库：[oframe/ogl](https://github.com/oframe/ogl)
- 官方源码：[src/extras/Flowmap.js](https://github.com/oframe/ogl/blob/master/src/extras/Flowmap.js)
- 许可证：[MIT](https://github.com/oframe/ogl/blob/master/LICENSE)

OGL 的 `Flowmap` 使用 ping-pong framebuffer 保存历史，但它生成鼠标印记的核心非常轻：先做屏幕比例校正，再计算指针到采样点的距离；印记沿速度方向拉伸，并让鼠标速度影响强度，旧结果按 falloff/dissipation 衰减。

**可提炼机制：** 不保留 flowmap 纹理，只借用“方向向量 + 各向异性距离场”。咖啡从咖啡机屏幕坐标飞向镜头时，主泼点应沿飞行方向略长，放射液舌也应围绕该方向分布，而不是横向排布几块椭圆。历史衰减改由 `uCoffeeSplashProgress` 的阶段曲线直接控制。

### 3. Three.js WaterRefractionShader：局部法线扰动背景采样

- Three.js 官方仓库：[mrdoob/three.js](https://github.com/mrdoob/three.js)
- 官方源码：[examples/jsm/shaders/WaterRefractionShader.js](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/WaterRefractionShader.js)
- 官方示例：[webgl_shaders_ocean2](https://threejs.org/examples/webgl_shaders_ocean2.html)
- 许可证：[MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE)

官方水折射 shader 从 dudv 纹理取得扰动，构造 distortion 向量，再偏移场景纹理采样坐标；同时使用 flow map 与时间产生两组不同相位的采样，并混合避免周期跳变。

**可提炼机制：** 本项目不需要 dudv 纹理。可对程序化咖啡 mask 在 `uv ± texel` 处求差，得到近似二维梯度，把它当作液面法线，只在咖啡内部对 `tDiffuse` 做很小的 UV 偏移。这样会出现“咖啡液贴在镜头上、后方线组被湿润玻璃轻微折射”的感觉，而不是一块棕色半透明贴片。

### 4. Codrops / Water-like Distortion：假流体优于完整流体模拟

- 原作者教程：[Creating a Water-like Distortion Effect with Three.js](https://tympanus.net/codrops/2019/10/08/creating-a-water-like-distortion-effect-with-three-js/)
- 原作者源码入口：[Codrops 页面 Source](https://tympanus.net/codrops/2019/10/08/creating-a-water-like-distortion-effect-with-three-js/)

教程明确采用“看起来像水”的假效果而不做真实流体：把运动轨迹绘制成纹理，对其做模糊和阈值处理，然后作为 displacement map 扭曲图像。其视觉有效性来自连续的灰度场与受控位移，而不是物理正确性。

**可提炼机制：** 当前咖啡泼溅也应优先构造一个连续标量场 `coffeeField`，再从同一个场派生遮色、折射、湿边和高光。不要让主泼点、液滴、下淌各自拥有互不相干的边缘和材质。

### 5. Codrops / Ink Bleed：fBM 扰动半径形成纸上墨晕

- 原作者教程：[More Than a Portfolio: Building a Scroll-Driven 3D World with Something to Say](https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/)
- 文章内原始实现章节：`The Ink Bleed Transition`

该实现用 UV 到中心的距离作为基础圆形，再用多尺度 fBM 扰动半径：`radius = progress * scale + (fbm - 0.5) * noiseStrength`，最后通过 `smoothstep(radius - edge, radius + edge, dist)` 得到从中心向外不规则扩散的墨晕 mask。它不是流体模拟，但能稳定呈现纸张吸水后边缘毛化、渗透速度不均的观感。

**可提炼机制：** 咖啡撞击的前半段使用速度导向的液体 splat，后半段让外缘额外经过低频 fBM 阈值扩张，形成 SAKURA 纸张上的咖啡渍晕边。墨晕只能影响外缘 10%～20% 的宽度，不能把整团咖啡做成翻滚云雾。

### 6. Codrops / Risograph Grain：固定于纸面的颗粒与套色质感

- 原作者教程：[Creating a Risograph Grain Light Effect in Three.js](https://tympanus.net/codrops/2022/03/07/creating-a-risograph-grain-light-effect-in-three-js/)
- 原作者源码入口：[Codrops 页面 Source](https://tympanus.net/codrops/2022/03/07/creating-a-risograph-grain-light-effect-in-three-js/)

教程把 grain 作为屏幕空间随机纹理加入 shader，并强调随机粒子尺寸与纹理感；示例中同时把阴影和高光拆开处理，形成印刷颗粒而不是纯噪点覆盖。

**可提炼机制：** 咖啡内部加入非常弱、稳定在屏幕空间的纸纤维颗粒；颗粒只调制透明度和明度，不应随时间高速游动。SAKURA 的樱花粉只用于少量反射高光或湿边内侧，不做一整圈亮白/粉色描边。

## 推荐的单 pass 视觉机制

### 1. 用一个连续 `coffeeField` 统一所有形状

建议从同一个标量场派生全部表现：

1. **主注入核：** 以 `uCoffeeOrigin` 为中心的指数/高斯衰减核，使用画面宽高比校正。
2. **方向性冲击：** 根据咖啡机到画面内侧的方向，把局部坐标旋转后压缩垂直轴，得到略带速度方向的椭圆冲击核。
3. **放射液舌：** 预设 7～9 个不等角度，每个用窄长 capsule/指数核，长度由确定性 hash 和阶段曲线控制；角度围绕主方向偏置，不均匀铺满 360°。
4. **卫星液滴：** 8～12 个小核，位置由固定 seed 生成；出现时间错开，尺寸差异明显，避免“规则珍珠项链”。
5. **重力下淌：** 只保留 2～3 条，从主液体最低点开始，撞击后半段才生长；不再作为一开始就存在的竖直棕柱。

组合时优先使用软加和，例如 `1.0 - product(1.0 - lobe)` 或受限加法，而不是对大量椭圆一直做 `max()`。软加和能让交叠区域自然变厚，视觉上属于同一团液体。

### 2. 把动画拆成“撞击—铺展—墨晕—退场”四段

建议仍由一个 `uCoffeeSplashProgress` 驱动：

- **0.00～0.18：撞击。** 主核快速从小点膨胀，短暂 overshoot；中心密度先出现，外围液舌稍滞后。
- **0.12～0.50：铺展。** 放射液舌与卫星液滴飞出，主核沿飞行方向拉伸；局部折射最强。
- **0.30～0.82：墨晕。** 外缘 fBM 阈值缓慢向纸面扩散，2～3 条下淌开始受重力生长；液体中心透明度略降，边缘湿痕仍可见。
- **0.72～1.00：退场。** 先减弱咖啡遮色和折射，再让湿边/纸纹延迟约 0.1 个 progress 消失，避免整块同步淡出像 UI 贴图。

### 3. 从 mask 梯度生成轻微折射

对 `coffeeField(uv ± vec2(texel.x, 0))` 与 `coffeeField(uv ± vec2(0, texel.y))` 做中心差分，得到 `gradient`。在液体内部使用：

```glsl
vec2 refractOffset = gradient * refractionStrength * liquidMask;
vec3 wetScene = texture2D(tDiffuse, uv + refractOffset).rgb;
```

建议折射位移控制在约 0.5～2.0 个像素的视觉量级，并在手机/低画质下降低。咖啡边缘比中心更需要折射，中心主要负责半透明染色。

若采样预算紧张，可复用求梯度的 4 次场函数计算；它们是纯数学计算，不是 4 次额外纹理采样。场景纹理只增加 1 次偏移采样即可。

### 4. 四层材质，而不是单一棕色 alpha

从 `coffeeField` 建议派生四层：

- **薄洗色 wash：** 大范围、低 alpha 的暖褐透明染色，仍能看清线组结构。
- **浓咖啡 core：** 中心与液舌交叠处更深，但保留少量场景亮度，不做不透明泥块。
- **吸水晕边 bleed：** 低频 fBM 扰动的软边，颜色偏冷/灰褐，模拟纸纤维吸收。
- **湿润高光 wet glint：** 位于冲击方向反侧的碎片化短高光，只占很小面积；颜色用低饱和米白混少量樱花粉，不画连续描边。

### 5. SAKURA 风格约束

- 主色建议从深焙咖啡褐过渡到透明茶褐，不使用统一纯棕。
- 外缘应有手绘不规则性，但整体轮廓仍可读；低频噪声决定大形，高频噪声只负责纸纤维。
- 樱花粉是环境反射与品牌融合色，不是咖啡本体色；最多出现在局部湿润高光中。
- 纸纹应稳定在屏幕/纸面，不随 `uTime` 快速游动，否则会像电视噪声。
- 构图应以一个明确冲击中心为主，允许偏心和留白；不要再次形成横跨画面的棕色条带。
- 线组仍是核心玩法信息。瞬时泼溅可强烈，但 1～2 秒后必须完全退回到“只在线材表面持续咖啡遮色”的状态。

## 推荐实现优先级

### 第一版：最小可验证版本

1. 把当前多个 `coffeeEllipse()` 的硬拼接改为连续软加和场。
2. 增加方向性主核、7～9 条不均匀液舌和错时卫星液滴。
3. 用场梯度增加一次局部折射采样。
4. 给外缘增加低频 fBM 墨晕阈值，并将纸纹限制在很低强度。
5. 保留最多 2～3 条后发下淌，移除任何首帧竖柱感。

这版不需要新增纹理、render target 或外部依赖，主要复用当前已有的 `noise()`、`fbm()`、`uTexel`、`tDiffuse`、`uCoffeeOrigin` 和 `uCoffeeSplashProgress`。

### 第二版：仅在第一版仍缺少液体感时

- 增加第二次极小偏移的 `tDiffuse` 采样，用两档折射模拟厚薄差。
- 给主核加入一次短促的冲击环，但冲击环只扭曲背景，不画明亮圆环。
- 在高画质档提高卫星液滴数量；低画质保持固定少量。

## 不推荐

- 直接接入 PavelDoGreat 完整流体模拟：需要多张纹理、多个 framebuffer 和每帧多次求解，超出单次技能反馈所需。
- 直接接入 OGL Flowmap：其历史纹理和 ping-pong 更新对 1～2 秒的一次性效果偏重。
- 继续用大量独立椭圆 `max()` 拼成主体：容易得到平面污渍和贴片感。
- 全屏高强度折射：会破坏多线拓扑、插头朝向和交叉关系的可读性。
- 粉色/白色连续描边：会变成 UI 徽章或果冻，而不是咖啡液。
- 高频动态噪声覆盖整团咖啡：会像烟雾、火焰或电视雪花。

## 最终推荐

采用 **“指数 splat 注入核 + flowmap 式方向拉伸 + fBM 墨晕边缘 + mask 梯度局部折射 + 稳定纸纹”** 的组合。

它保留了真实液体最关键的视觉线索——冲击中心、方向性铺展、交叠增厚、卫星液滴和折射——同时把后半段处理成 SAKURA 适合的纸上咖啡渍/墨晕质感。工程上仍是一个后处理 pass，不引入完整模拟，也不改变咖啡封技的持续规则。

---

## 2026-08-21 增补：全屏多点飞溅、重力挂流与线组渐进晕染

本轮目标不是继续放大现有单团咖啡，而是把效果拆成两个彼此独立但共用色彩语言的系统：

1. **镜头前景咖啡飞溅层：** 从屏幕前方直接发生，不再从咖啡机模型位置发射；多个液团分布在整个视口，尺寸、形状、动量、出现时间和裁切状态均不同。
2. **线组咖啡晕染层：** 所有剩余线材共享一个缓慢扩散的咖啡染色场，从线组局部开始，先出现淡茶褐湿痕，再逐步扩散成深咖啡色；任何线都不能在技能触发帧立即整体改色。

### 一手开源来源

#### 1. PavelDoGreat / WebGL Fluid Simulation

- 仓库与核心实现：<https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/script.js>
- 可借鉴点：`splat()` 把位置、速度和颜色作为局部注入写入速度场与染料场；`advection`、`densityDissipation`、`velocityDissipation` 分离控制移动与消散。
- 对本项目的启发：视觉上必须把“位置、动量、密度、寿命”拆开。即使不引入完整 Navier-Stokes 求解，也应让每个咖啡液团拥有独立 seed、速度、尺寸和生命周期，并用重叠密度决定浓度，而不是所有形状共用同一个缩放与 alpha。
- 不直接移植原因：完整版本依赖多组 ping-pong framebuffer、压力迭代和每帧多 pass，作为短时技能反馈过重。

#### 2. OGL Flowmap

- 官方示例：<https://github.com/oframe/ogl/blob/master/examples/flowmap.html>
- 官方实现：<https://github.com/oframe/ogl/blob/master/src/extras/Flowmap.js>
- 可借鉴点：低分辨率历史纹理保存速度方向和强度；`falloff`、`dissipation`、`alpha` 分别决定局部影响半径、残留时间和注入强度。
- 对本项目的启发：咖啡挂流不应该每帧重画后立刻消失，而应让新位置在旧痕迹上继续追加。若纯解析 shader 难以得到足够长的湿痕，可增加一张很小的历史 mask（建议 128×72 或 192×108），只记录咖啡覆盖，不做压力求解。

#### 3. Codrops 作者教程：Water-like Distortion Effect with Three.js

- 作者原教程：<https://tympanus.net/codrops/2019/10/08/creating-a-water-like-distortion-effect-with-three-js/>
- 教程源码入口：<https://github.com/danielbaranowski/water-effect>
- 可借鉴点：用仅 64px 的 canvas 管理多个独立点，每个点保存位置、方向、力度、年龄；先升后降的强度曲线避免出生和死亡都像硬切；RGB 通道可编码方向与强度，再在单个后处理 pass 中进行折射。
- 对本项目的启发：不必为“很多液滴”启动完整流体模拟。可以在 CPU 端固定生成 12～18 个咖啡 splat 参数，在 fragment shader 中解析计算；或用低分辨率 canvas/mask 记录挂流历史，然后继续沿用现有单 pass 后处理。

#### 4. Three.js WaterRefractionShader

- 官方源码：<https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/WaterRefractionShader.js>
- 可借鉴点：用法线/扰动场修改屏幕 UV，再采样场景颜色，形成局部折射，而不是把液体仅当作纯色 alpha 层。
- 对本项目的启发：折射只在移动液滴和湿边较强，已经附着的浓咖啡主体以染色和柔和高光为主；这样既有湿润感，也不会持续扭曲线组拓扑。

#### 5. artcodev / three-fluid-fx

- 仓库：<https://github.com/artcodev/three-fluid-fx>
- 可借鉴点：把流体结果作为 UI reveal/mask，而不是必须渲染成独立物体；覆盖层可用于颜色混合、图片揭示和局部位移。
- 对本项目的启发：咖啡场应输出一个可复用 mask，同时驱动前景染色、折射强度和线材咖啡覆盖，而不是为三类视觉分别造三套互不连续的形状。

#### 6. Three.js LineDashedMaterial shader

- 官方源码：<https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderLib/linedashed.glsl.js>
- 可借鉴点：`vLineDistance` 展示了沿线材累计弧长坐标驱动局部显示/隐藏的轻量方式。
- 对本项目的启发：若现有线材已经有纵向 UV 或累计长度属性，咖啡染色可直接用该坐标做沿线传播；若没有，可在 CableGeometry 生成时补一个 0～1 的稳定进度属性。这样颜色前沿能沿真实弯曲线体爬行，而不是整条材质同时 lerp。

## 推荐方案 A：镜头前景多点物理飞溅

### 1. 构图数量与尺寸分布

建议固定生成 **14～20 个屏幕空间 splat**，不要每帧随机：

| 层级 | 数量 | 直径（相对短边） | 作用 |
| --- | ---: | ---: | --- |
| 大液团 | 2～3 | 0.24～0.42 | 建立“泼满镜头”的气势，其中至少 1 个中心在视口外，形成边缘裁切 |
| 中液团 | 4～6 | 0.10～0.23 | 覆盖画面中部和四象限，承担主要形状变化 |
| 小液滴 | 8～12 | 0.018～0.09 | 提供速度、方向和物理飞散感，禁止等间距排列 |

位置建议：

- 液团中心允许落在 `x = -0.16～1.16`、`y = -0.08～1.12`，让约 **30%～40%** 的液团被视口边缘自然裁切。
- 屏幕中央保留 1 个大液团和 2～3 个中液团，但不把所有主形状堆在正中心。
- 四个角至少覆盖三个；左右边缘与顶部都应有越界液滴，底边主要留给重力挂流。
- 位置来自技能触发时生成的确定性 seed，与咖啡机模型投影位置彻底解耦。

### 2. 解析弹道，而不是从单点放射

每个液滴保存：

```ts
type CoffeeDrop = {
  start: Vec2;
  velocity: Vec2;
  radius: number;
  aspect: number;
  rotation: number;
  birth: number;
  impact: number;
  drag: number;
  stick: number;
  dripRate: number;
  seed: number;
};
```

飞行阶段使用解析轨迹，UV 坐标 y 向上时：

```glsl
float age = max(0.0, t - birth);
vec2 ballistic = start
  + velocity * ((1.0 - exp(-drag * age)) / max(drag, 0.001))
  + vec2(0.0, -0.5 * gravity * age * age);
```

关键不是追求严格流体力学，而是确保：

- 水平速度受 drag 逐渐降低；
- 垂直速度持续受重力影响；
- 不同液滴的 `birth` 错开 0～0.35 秒；
- 大团速度慢、质量感强，小滴速度快、弹道更远；
- 液滴到达 `impact` 后停止弹道，转换为“附着在镜头玻璃上的咖啡渍”，而不是继续飞走或马上消失。

### 3. 撞击后保留与下淌

每个大/中液团都应分成三个 mask：

1. **stain：** 撞击后的主体污渍，位置基本固定，持续到总动画后段。
2. **drip trail：** 从主体最低点向下增长的细长胶囊/曲线，旧路径必须保留。
3. **drip head：** 下淌末端略大的水滴头，受重力缓慢加速。

建议时间：

- `T_appliance`：咖啡机本体普通动画时长。
- `T_splash = T_appliance + 1.8～2.8s`，保证屏幕咖啡比本体动画更久。
- 撞击与飞散：0.00～0.75s。
- 附着扩张：0.20～1.30s。
- 重力挂流：0.65s 开始，持续到 `T_splash - 0.8s`。
- 渐隐：只发生在最后 25%～32% 时长；污渍、挂流和湿边分批退场，不能整层同步消失。

推荐退场曲线：

```glsl
float fadeStart = 0.70;
float fade = 1.0 - smoothstep(fadeStart, 1.0, normalizedTime);
float wetEdgeFade = 1.0 - smoothstep(0.82, 1.0, normalizedTime);
```

主体先变淡，湿边和最细的挂流再延迟消失。下淌轨迹使用“累计长度 mask”，不能只画当前位置附近的一小段，否则仍会出现“流一下就没了”。

### 4. 形状变化

- 大液团：2～4 个指数核软加和，形成非对称厚薄；再减去 1～2 个小孔洞，避免标准椭圆。
- 中液团：椭圆核 + 2～3 条短液舌，旋转与初速度一致。
- 小液滴：圆形、泪滴形、短拉丝三类混合；半径、aspect 和 rotation 由 seed 决定。
- 外缘：只使用低频 fBM 扰动轮廓，噪声固定在屏幕空间；禁止快速滚动的高频噪声。
- 合成：受限软加和或 `1 - product(1 - lobe)`，交叠处自然加深。

### 5. 最轻实现路径

优先保持现有后处理结构：

- CPU 在技能触发时一次性生成 14～20 个确定性参数。
- shader 固定上限循环，例如 `MAX_COFFEE_SPLATS = 20`，由 `uCoffeeSplatCount` 控制有效数量。
- 参数可打包到 4～5 组 `vec4` uniform 数组；不需要粒子对象、额外 draw call 或常驻流体模拟。
- 如果 uniform 数量或 WebGL1 兼容性受限，可把参数编码进一张 20×4 的 DataTexture。
- 只有“保留旧挂流轨迹”不足时，才增加一张 128×72 单通道历史 mask，并且只做衰减与新增注入，不做压力/速度迭代。

## 推荐方案 B：所有剩余线组的咖啡渐进晕染

### 1. 不使用全材质瞬时 lerp

技能触发后立即设置 DEBUFF 规则，但视觉颜色必须分阶段：

1. 先在整个线组某个角落生成一处小范围浅色湿斑。
2. 湿斑像颜料滴入水中一样向外扩张，边缘带低频卷曲。
3. 扩张前沿经过某条线时，该线只在前沿覆盖的局部开始变色。
4. 前沿继续移动，局部从浅茶褐过渡到乳咖色，再沉淀为深咖啡色。

规则状态和视觉状态必须解耦：`coffee-lock` 在触发帧立即生效；`uCoffeeBleedProgress` 仅负责视觉传播。

### 2. 共享屏幕空间染色场

最适合“从线组一角扩散到全部线”的轻量方案，是所有线材/插头 shader 共享同一个屏幕空间 field：

```glsl
vec2 screenUv = gl_FragCoord.xy / uViewport;
float distanceField = length((screenUv - uCoffeeBleedOrigin) * vec2(aspect, 1.0));
float warpedDistance = distanceField
  + 0.055 * fbm(screenUv * 3.0 + seed)
  + 0.018 * fbm(screenUv * 11.0 - seed);
float radius = mix(-0.05, 1.45, easeInOutCubic(progress));
float outerWet = 1.0 - smoothstep(radius - 0.02, radius + 0.11, warpedDistance);
float innerCoffee = 1.0 - smoothstep(radius - 0.20, radius + 0.01, warpedDistance);
```

优势：

- 前沿在整个视口连续，线与插头接缝不会出现相位跳变；
- 所有剩余线自动处在同一个扩散场中，不需要逐条手动触发；
- 线段只有位于 field 内的 fragment 才变色，视觉上不会整条瞬变；
- 仍然只有纯数学计算，不需要新增 render target。

建议起点从可见线组边缘而非咖啡机位置选择，例如 `(0.08, 0.82)`、`(0.92, 0.76)` 或 `(0.10, 0.18)`，每次测试由 seed 在三个角落模板中选择。

### 3. 双前沿模拟“牛奶/咖啡入水”

单一 smoothstep 仍会像普通圆形 wipe。建议同时保留两个传播层：

- **outerWet：** 半径更大、边缘更宽、颜色偏透明乳咖，先经过线材。
- **innerCoffee：** 落后 0.12～0.20 progress、边缘更窄、颜色更深，负责最终沉淀。

颜色顺序：

```glsl
vec3 wetTea = vec3(0.53, 0.35, 0.25);
vec3 milkCoffee = vec3(0.43, 0.27, 0.20);
vec3 roastCoffee = vec3(0.24, 0.12, 0.09);

vec3 stained = mix(originalColor, wetTea, outerWet * 0.45);
stained = mix(stained, milkCoffee, outerWet * innerCoffee * 0.55);
stained = mix(stained, roastCoffee, innerCoffee * settle);
```

`settle` 比 `innerCoffee` 再慢 0.15～0.25 秒，让颜色表现为“湿润扩散后逐渐沉淀”，而不是前沿一碰就直接深褐。

### 4. 沿真实线体继续爬行

仅靠屏幕 field 已经能实现跨线组扩散。如果需要更明显的液体沿线体爬行，可把屏幕 field 与线材弧长坐标组合：

```glsl
float localDelay = hash(lineSeed) * 0.16;
float lineFront = smoothstep(
  vLineProgress - 0.12,
  vLineProgress + 0.08,
  saturate((progress - localDelay) * 1.35)
);
float coffeeMask = outerWet * max(innerCoffee, lineFront * 0.65);
```

- `vLineProgress` 必须由真实累计弧长归一化得到，不能用顶点索引代替。
- 每条线只允许小幅 delay 差异，避免变成一根一根轮流点亮。
- 插头和线材应共享屏幕 field；线材额外使用 `vLineProgress`，插头不需要伪造弧长。

### 5. 推荐阶段曲线

以视觉晕染总时长 `T_bleed = 2.8～4.2s` 为起点：

| 时间占比 | 阶段 | 视觉行为 |
| ---: | --- | --- |
| 0.00～0.12 | 成核 | 角落出现 1～2 个浅色湿斑，仅影响附近极少线段 |
| 0.08～0.46 | 快速扩散 | outerWet 扩大，边缘卷曲，约 40%～55% 可见线段开始染色 |
| 0.32～0.78 | 深色追赶 | innerCoffee 跟随，线材从乳咖过渡到深焙褐 |
| 0.65～1.00 | 沉淀统一 | 最后远端线段被覆盖，局部色差逐步收敛，但保留稳定纸纹和轻微深浅变化 |

推荐 easing：

```glsl
float spread = 1.0 - pow(1.0 - progress, 2.4);     // 前段扩散快，后段慢慢填满
float settle = smoothstep(0.28, 0.92, progress);   // 深色沉淀明显落后
float edgeCurl = (1.0 - smoothstep(0.72, 1.0, progress));
```

`edgeCurl` 只影响传播前沿，不要让整条已染色线一直流动，否则会像火焰或电流。

### 6. 四回合减退时的视觉建议

咖啡覆盖在触发阶段扩散到全部剩余线后，后续每次正确抽线减少四分之一时，不应把现有线材重新做一次反向圆形 wipe。建议：

- 保持已经被染色线材的咖啡材质稳定；
- 用共享 `uCoffeeLockRemaining / 3.0` 缓慢降低覆盖浓度或缩小“湿润高光/厚咖啡层”；
- 每次正确操作用 0.45～0.70 秒平滑过渡到下一档；错误操作保持所有视觉参数不变；
- 第 3 次普通动画结束后，再让残余湿痕用 0.8～1.2 秒渐隐退出。

## 推荐参数总表

| 参数 | 推荐值 |
| --- | --- |
| 前景 splat 数量 | 14～20 |
| 大 / 中 / 小数量 | 2～3 / 4～6 / 8～12 |
| 越界裁切比例 | 30%～40% |
| 飞散错时 | 0～0.35s |
| 飞散阶段 | 0.00～0.75s |
| 挂流开始 | 0.55～0.85s |
| 前景总时长 | `T_appliance + 1.8～2.8s` |
| 渐隐区间 | 最后 25%～32% |
| 挂流数量 | 5～8 条，其中 2～3 条明显长流 |
| 低分辨率历史 mask（可选） | 128×72 或 192×108，单通道 |
| 线组晕染时长 | 2.8～4.2s |
| outerWet 边缘宽度 | 0.08～0.13 屏幕短边 |
| innerCoffee 延迟 | 0.12～0.20 progress |
| 最终沉淀延迟 | 0.15～0.25s |
| 每线局部延迟 | 0～0.16s |
| 折射位移 | 移动液滴 1.0～2.2px；附着污渍 0.2～0.8px |

## 最终工程建议

### 第一阶段：完全解析、零新增 render target

1. 把前景系统改为 14～20 个独立 seed 的解析弹道 splat，来源改为屏幕空间分布。
2. 对大/中 splat 增加附着 stain、累计 drip trail 和延迟 fade。
3. 线材与插头共享一个 `gl_FragCoord` 屏幕空间咖啡扩散 field。
4. 用 outerWet / innerCoffee / settle 三层 mask 完成浅湿痕到深咖啡的渐进颜色。
5. 若线材已有纵向 UV，再叠加少量沿弧长爬行；没有时先不为此改结构。

### 第二阶段：只在挂流残留仍不自然时增加低分辨率历史 mask

- 仅增加一张单通道 128×72 或 192×108 mask。
- 每帧执行“旧 mask 轻微衰减 + 当前 splat/drip 注入”，不求压力、不求不可压缩速度场。
- mask 同时供后处理和线材 shader 采样，保证屏幕咖啡与线组晕染属于同一个视觉事件。

### 明确不采用

- 不接入完整 PavelDoGreat 流体求解器。
- 不常驻 ping-pong 多 pass 模拟整个游戏画面。
- 不从咖啡机世界坐标投影出发。
- 不把一个大圆形 mask 放大到全屏冒充多点飞溅。
- 不在触发帧对所有线材做统一 `mix(original, coffee, 1.0)`。
- 不让高频噪声持续滚动；SAKURA 的纸感必须稳定、柔和、可读。
