# 吹风机动态厚丝带 Quality Contract

## 质量目标

吹风机模型本体沿用已通过三视图拆分的 SAKURA 造型；本轮动画高潮必须由 5 根“像模型做出来”的长丝带完成。旧 `blown-mint-strand` 和 Spectacle 通用短 ribbon 粒子必须物理删除，不允许叠加。

## 组件、材质与层级

- 根：`hair-dryer-body-pivot`
- 出风口 socket：`hair-dryer-airflow-emitter-socket`，喷口局部坐标约 `[-2.43, 0, 0]`
- 动态场 pivot：`hair-dryer-ribbon-field-pivot`，跟随机身但不承担统一摆动
- 五个独立 Mesh：`hair-dryer-solid-wind-ribbon-1..5`
- topology：分段矩形实体截面；每段 4 顶点，包含前/后/左右侧面与端盖
- 材质：五种克制的 SAKURA pastel toon fabric；必须接受灯光产生明暗面，不能用无阴影 MeshBasicMaterial 或纯色 Plane
- attachment：每根起点位于喷口开口范围内，`anchorSocket=hair-dryer-airflow-emitter-socket`；固定阶段起点误差 `<= 1e-4` world/local unit

## 形变与 Timeline

- `0.00–0.12s`：隐藏/待机。
- `0.12–0.68s`：从喷口逐渐展开，固定端不漂移。
- `0.68–4.18s`：稳定强风；波由固定端向自由端传播，形成 S Curve、翻面、扭转、卷曲及上下/左右扰动。
- `4.18s`：解除 anchor。释放前后同一点的位置误差 `<= 1e-6`，禁止瞬移。
- `4.18–5.12s`：继承当前形状并受余风向 `-X` 飞行，继续翻卷，再由重力下坠。
- `>=5.12s`：到屏幕下方后隐藏；统一 powered cycle 停止时恢复精确 idle。

Timeline 唯一所有者是 `AppliancePerformanceSystem`。游戏和图鉴均调用 `createApplianceMechanicalAnimation -> applyHairDryerPerformance`；图鉴自动旋转不得暂停。

## 参数差异门槛

- 数量只能为 5（任务允许 4–5，本样板固定为 5）。
- 五个 profile 的完整参数集合唯一数必须为 5。
- 所有 `phase/frequency/waveNumber/twist/bend/turbulence` 不得完全相同。
- 从 `s=0.25` 到 `s=0.75` 的传播相位延迟必须全部 `>0`。
- 丝带长度 `>=5.6`，宽度 `0.19–0.27`，厚度 `0.032–0.046`；长宽比明显，且厚度在三分之四视角可见。

## 失败门槛

出现任一项即判失败：

- 吹风机仍触发 `dryer-ribbons` 粒子池，或保留 `hair-dryer-blown-mint-strand-*`。
- 丝带 Object3D 为 Line，Geometry 为 PlaneGeometry，或只有单层正反面而没有侧边/端盖。
- 五根丝带用相同的 `sin(time)` 同步摆动。
- 固定阶段首段离开喷口、穿过喷嘴后壁，或自由段大面积穿过机身。
- 4.18 秒释放发生起点/世界位置跳变。
- 释放后丝带瞬间消失、仍粘在喷口、只向前直飞而不翻卷，或未落到画面下方。
- `stop()` 后 Mesh 可见、材质残留 opacity、几何未恢复确定性 idle。
- 游戏与图鉴同时间点诊断形态不同，或图鉴 auto-rotate 停止。

## 浏览器验收视点

- anchored 强风高潮：3.70s（确认五根不同相位、长距离、厚度与喷口固定）。
- released/fall 高潮：4.55s（确认已解除 anchor、无跳变、余风平移、翻卷和下落）。
- near-recycle：5.08s（确认丝带在屏幕下方附近而不是半途消失）。
- 游戏与图鉴均在 4.55s 留同时间点截图和 runtime JSON。
