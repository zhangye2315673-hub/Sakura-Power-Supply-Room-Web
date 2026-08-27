# 微波炉“过热线”视觉效果研究

## 结论

最适合当前 Three.js 线缆谜题的不是更复杂的静态标记模型，而是“整根线在被加热”的动态组合：

1. 整根目标线沿曲线路径循环流动 2～3 段橙红热流；
2. 插头增加面向相机的热核光晕，负责第一眼定位；
3. 线体增加很薄的 Fresnel 暖边，插头附近少量火星；
4. 插头旁显示离散的两段环，明确表示还剩两次/一次成功拔线机会。

建议第一版实现 1+2+4。它比全屏热浪更清楚，也比当前整根 emissive 发亮更有“微波过热”的语义，并且不会遮住多线拓扑。

## 当前项目为什么适合这样做

- `src/render/CableGeometry.ts` 已给线体写入 `aCableProgress`，并通过 `onBeforeCompile` 传入 fragment shader；冰冻效果已经验证了沿线长做渐进覆盖的路径。
- `src/render/PlugCableModel.ts` 已有 `setSkillGlow()`，但现在主要是整根 emissive 增强，视觉上更像 hover/选中，不像过热倒计时。
- `src/game/Game.ts` 已能稳定取得 `overheated-plug` 的 cableId 和 `turnsRemaining`，可以同步热流、热核与两段环。
- `src/style/post.ts` 已有 bloom 和画质降级；低画质会弱化 bloom，因此目标识别不能只依赖 bloom。

## 第一方/原项目参考

### 1. Three.js modified materials：沿线热流与 Fresnel 薄边

- 官方示例：[webgl_materials_modified](https://threejs.org/examples/webgl_materials_modified.html)
- 官方源码：[examples/webgl_materials_modified.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_modified.html)
- 官方接口：[Material.onBeforeCompile](https://threejs.org/docs/#api/en/materials/Material.onBeforeCompile)、[ShaderMaterial](https://threejs.org/docs/#api/en/materials/ShaderMaterial)
- 许可证：[Three.js MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE)

机制：通过 `onBeforeCompile` 给现有材质注入 uniform、varying 和 shader 片段，不必放弃原有 toon 光照。对本项目可直接复用 `aCableProgress`，用 `fract(progress * repeat - time * speed)` 和软 `smoothstep` 生成沿曲线移动的热段；再用视线方向与法线夹角生成很薄的 Fresnel/rim 暖边。

适配评价：**最适合。** 只需每帧更新时间/强度 uniform，不重建几何。热流沿完整弯曲线体移动，玩家可以顺着运动认出整根目标线。Fresnel 只能做辅助，不能单独作为目标语义。

### 2. MeshLine：流动虚线/能量轨迹的运动参考

- 原项目：[pmndrs/meshline](https://github.com/pmndrs/meshline)
- 参数说明：[README](https://github.com/pmndrs/meshline/blob/master/README.md)
- 许可证：[MIT](https://github.com/pmndrs/meshline/blob/master/LICENSE)

机制：MeshLine 用面向相机的三角形带替代 `GL_LINE`，支持 `alphaMap`、`repeat`、`dashArray` 和可动画的 `dashOffset`。

适配评价：**适合作为视觉参考，不建议引入依赖。** 当前线缆已有体积、拾取、toon 轮廓和合并几何；直接换 MeshLine 会改变线径与遮挡。应借用滚动 alpha/dash 的思路，在现有线体 shader 上实现热流外壳。

### 3. Three.js Sprite：插头热核与 halo

- 官方示例：[webgl_sprites](https://threejs.org/examples/webgl_sprites.html)
- 官方源码：[examples/webgl_sprites.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_sprites.html)
- 官方接口：[Sprite](https://threejs.org/docs/#api/en/objects/Sprite)、[SpriteMaterial](https://threejs.org/docs/#api/en/materials/SpriteMaterial)
- 许可证：[Three.js MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE)

机制：Sprite 始终朝向相机。使用一次生成的径向渐变 CanvasTexture、AdditiveBlending 和轻微呼吸缩放，可形成稳定的插头热核。

适配评价：**非常适合负责第一眼定位，但不能单独承担整根线识别。** 建议热核只覆盖插头约 1.5～1.9 倍宽度并开启 depthTest，避免穿透所有线缆造成错误指引；必须和沿线热流组合。

### 4. Three.js Points / Three Nebula：少量火星

- Three.js 官方示例：[webgl_custom_attributes_points](https://threejs.org/examples/webgl_custom_attributes_points.html)
- 官方源码：[examples/webgl_custom_attributes_points.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_custom_attributes_points.html)
- 粒子引擎原项目：[creativelifeform/three-nebula](https://github.com/creativelifeform/three-nebula)
- 许可证：[Three Nebula MIT](https://github.com/creativelifeform/three-nebula/blob/master/LICENSE.md)

机制：官方 Points 示例在一个批次中用自定义 size/color attribute 驱动粒子；Three Nebula 则提供 emitter、initializer、behavior 和批处理 renderer。

适配评价：**适合点缀，不建议为了这个效果引入 Three Nebula。** 只需 12～24 个预分配火星，集中在插头和线体末段，一个 `THREE.Points` draw call 即可。Three Nebula 对单一标记偏重，其 README 当前测试基线是 `three@0.185.1`，项目为 `three@0.184.0`。

### 5. Codrops Animated Heat Distortion：热浪/折射参考

- 原作者文章：[Animated Heat Distortion Effects with WebGL](https://tympanus.net/codrops/2016/05/03/animated-heat-distortion-effects-webgl/)
- 原作者仓库：[lbebber/HeatDistortionEffect](https://github.com/lbebber/HeatDistortionEffect)
- 许可证：Codrops 自定义许可。仓库说明允许个人/商业项目集成和二次构建，但不可原样再发布、分发或销售；详见仓库 README 与 [Codrops licensing](https://tympanus.net/codrops/licensing/)。不是 MIT。

机制：fragment shader 对背景图像/文字进行随时间变化的纹理坐标扰动，形成热空气折射。

适配评价：**不建议作为主标记。** 在 3D 线组中做准确局部折射，需要场景纹理采样、屏幕遮罩和额外后处理，会扭曲附近其他线，降低交叉关系可读性，也增加移动端 fill-rate。最多作为插头周围极小、可降级关闭的增强；第一版先不做。

### 6. React Countdown Circle Timer：两次机会环的交互参考

- 原项目：[vydimitrov/react-countdown-circle-timer](https://github.com/vydimitrov/react-countdown-circle-timer)
- 许可证：[MIT](https://github.com/vydimitrov/react-countdown-circle-timer/blob/master/LICENSE)

机制：用圆环进度和颜色过渡表达剩余量，README 说明用单个 requestAnimationFrame 循环更新。这里无需引入 React 组件，只借鉴其清晰的圆环视觉语言。

适配评价：**适合，但必须改成离散的两段环，而不是真实秒数。** 初始两个半环都亮；成功拔出其他线后熄灭一半并短闪；剩最后一次时由橙转红、呼吸略加快。这样直接表达“两次成功拔线机会”，不会让玩家误以为按秒倒计时。

## 最推荐的三个方向

### A. 整根线的移动热流 + 薄 Fresnel 边缘（首选）

- 玩家识别：强；沿完整弯曲线路径运动。
- 遮挡：低；只扩大极薄一层轮廓。
- 性能：优；复用现有几何与 `aCableProgress`，每帧仅更新 uniform。
- 工程适配：优；可延伸现有线缆材质，或给目标线加轻微外扩的透明热流 shell。

建议两条热流带相隔约 0.4，基础速度每秒走线长的 0.55～0.8 倍；剩一次机会时提高约 20%，不要爆闪。

### B. 插头热核 + 两段式机会环（与 A 组合）

- 玩家识别：强；热核定位，圆环解释规则。
- 遮挡：中低；只占插头附近小范围。
- 性能：优；可用一到两个 Sprite/CanvasTexture。
- 工程适配：优；现有表现层可取得插头世界坐标和 turnsRemaining。

目标插头被遮挡时，沿线热流仍能提供定位，因此 B 不应替代 A。

### C. 小型复用火星池（收尾增强）

- 玩家识别：中；强化危险感，不能独立指出整根线。
- 遮挡：可控；限制在插头附近且不超过 24 个。
- 性能：优；一个 `THREE.Points` 批次。
- 工程适配：良；目标变化时重置粒子寿命即可。

## 不推荐作为主方案

- 只加强 emissive/bloom：静态，像 hover/可拔提示，低画质 bloom 还可能消失。
- 整根线套巨大 halo：多线时会把交叉关系糊成一团。
- 全屏或大范围 heat haze：干扰线路可读性且成本高。
- 持续大量火星：视觉噪声大，反而找不到目标线。
- 真实秒数圆环：规则按“两次成功拔线”结算，会制造错误心智模型。

## 建议状态机

1. 触发 0～0.35 秒：插头热核快速亮起，一圈热波扫过整根线，两段机会环出现。
2. 持续状态：两条热流沿线循环，Fresnel 暖边低强度常亮，热核慢呼吸，偶尔冒 1～3 个火星。
3. 剩一次机会：熄灭半环，另一半转红；热流速度与呼吸频率略升。
4. 正确拔出目标：热流向插头汇聚后熄灭，火星外散，环缩小消失。
5. 失败扣血：热核短促白热后收缩为红点，不让整根线爆炸，以免和洗衣机甩线/清线混淆。

## 实施边界

- 语义至少由“移动热流 + 两段环”承担，颜色和 bloom 只做辅助，以适应色弱与低画质。
- 所有效果绑定 cableId，不绑定一次性的 mesh 引用；线缆重构、换头或外扩后重新取得模型。
- 第一版先做 A+B，并在随机挑战多线局面验证：目标线远端、部分遮挡、与红/橙线交叉时，玩家仍能在 1 秒内认出。